import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { WhatsAppBridgeSupervisor } from './bridgeSupervisor';
import { verifyBridgeToken } from './whatsappBridgeCrypto';
import type {
  BridgeGroupMessageEvent,
  BridgePrivateReplyEvent,
  BridgeSessionPublicStatus,
} from './types';

interface AuthedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class BridgeWsHub {
  private readonly wss: WebSocketServer;
  private readonly clientsByUser = new Map<string, Set<AuthedSocket>>();
  private readonly heartbeatInterval: ReturnType<typeof setInterval>;

  constructor(server: http.Server, supervisor: WhatsAppBridgeSupervisor) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      try {
        const reqUrl = new URL(request.url || '/', 'http://localhost');
        if (reqUrl.pathname !== '/api/bridge/ws') {
          return;
        }

        const tokenFromQuery = reqUrl.searchParams.get('token') || '';
        const authHeader = String(request.headers.authorization || '');
        const tokenFromHeader = authHeader.toLowerCase().startsWith('bearer ')
          ? authHeader.slice(7).trim()
          : '';
        const token = tokenFromQuery || tokenFromHeader;

        const verified = verifyBridgeToken(token, supervisor.masterSecret);
        if (!verified.valid || !verified.userId) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          const authedWs = ws as AuthedSocket;
          authedWs.userId = verified.userId;
          authedWs.isAlive = true;
          this.registerClient(verified.userId!, authedWs, supervisor);
        });
      } catch {
        socket.destroy();
      }
    });

    this.heartbeatInterval = setInterval(() => {
      for (const clientSet of this.clientsByUser.values()) {
        for (const ws of clientSet) {
          if (ws.isAlive === false) {
            ws.terminate();
            clientSet.delete(ws);
            continue;
          }
          ws.isAlive = false;
          try {
            ws.ping();
          } catch {
            clientSet.delete(ws);
          }
        }
      }
    }, 25_000);
  }

  private registerClient(
    userId: string,
    ws: AuthedSocket,
    supervisor: WhatsAppBridgeSupervisor
  ): void {
    let set = this.clientsByUser.get(userId);
    if (!set) {
      set = new Set();
      this.clientsByUser.set(userId, set);
    }
    set.add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      set?.delete(ws);
      if (set && set.size === 0) {
        this.clientsByUser.delete(userId);
      }
    });

    // Initial state snapshot on connect
    const status = supervisor.getStatus(userId);
    const missedMessages = supervisor.getRecentGroupMessages(userId, Date.now() - 2 * 3600 * 1000);
    this.sendJson(ws, { type: 'BRIDGE_STATUS', status });
    if (missedMessages.length > 0) {
      this.sendJson(ws, { type: 'BRIDGE_MISSED_MESSAGES', messages: missedMessages });
    }
  }

  private sendJson(ws: WebSocket, payload: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(payload));
      } catch {
        // Ignore transient write error
      }
    }
  }

  public broadcastStatus(userId: string, status: BridgeSessionPublicStatus): void {
    const clients = this.clientsByUser.get(userId);
    if (!clients) return;
    for (const ws of clients) {
      this.sendJson(ws, { type: 'BRIDGE_STATUS', status });
    }
  }

  public broadcastGroupMessage(userId: string, event: BridgeGroupMessageEvent): void {
    const clients = this.clientsByUser.get(userId);
    if (!clients) return;
    for (const ws of clients) {
      this.sendJson(ws, { type: 'BRIDGE_GROUP_MESSAGE', event });
    }
  }

  public broadcastPrivateReply(userId: string, event: BridgePrivateReplyEvent): void {
    const clients = this.clientsByUser.get(userId);
    if (!clients) return;
    for (const ws of clients) {
      this.sendJson(ws, { type: 'BRIDGE_PRIVATE_REPLY', event });
    }
  }

  public broadcastSessionExpired(userId: string, reason: string): void {
    const clients = this.clientsByUser.get(userId);
    if (!clients) return;
    for (const ws of clients) {
      this.sendJson(ws, { type: 'BRIDGE_SESSION_EXPIRED', reason });
    }
  }

  public close(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}
