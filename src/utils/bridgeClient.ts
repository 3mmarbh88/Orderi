import { isNativeAndroid } from '../native/orderiNotificationListener';
import { getCurrentUser, ORDERI_SERVER_URL } from './authManager';
import { getDeviceId } from './whatsappConnection';

export type WhatsAppBridgeConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Waiting for Pairing'
  | 'Connected'
  | 'Reconnecting'
  | 'Session Expired'
  | 'Error';

export interface BridgeSessionStatus {
  userId: string;
  state: WhatsAppBridgeConnectionState;
  phoneNumber: string | null;
  pairingCode: string | null;
  pairingCodeExpiresAt: string | null;
  connectedJid: string | null;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastMessageAt: string | null;
  receivedMessagesCount: number;
  sentMessagesCount: number;
  messageIngestionActive: boolean;
  reconnectAttempts: number;
  errorMessage: string | null;
  errorCode: string | null;
  unofficialLibraryWarning: string;
}

export interface BridgeGroupMessagePayload {
  eventId: string;
  userId: string;
  messageId: string;
  groupJid: string;
  groupName: string;
  senderJid: string;
  senderPhone: string;
  senderName: string;
  rawText: string;
  messageType: 'text' | 'image' | 'sticker' | 'reply' | 'video_caption' | 'document_caption' | 'other';
  isSticker: boolean;
  isImage: boolean;
  quotedStanzaId?: string;
  quotedParticipant?: string;
  quotedText?: string;
  timestamp: number;
  receivedAtIso: string;
  isFromMe: boolean;
  isPrivateChat: false;
  ignoredForOrderExtraction: false;
}

export interface BridgePrivateReplyPayload {
  eventId: string;
  userId: string;
  messageId: string;
  senderJid: string;
  senderPhone: string;
  senderName: string;
  rawText: string;
  timestamp: number;
  receivedAtIso: string;
  isFromMe: boolean;
  isPrivateChat: true;
  ignoredForOrderExtraction: true;
}

export interface BridgeSendOutreachParams {
  orderId: string;
  operationId: string;
  targetJid?: string;
  senderPhone?: string;
  groupJid?: string;
  originalMessageId?: string;
  originalSenderName?: string;
  message: string;
}

export interface BridgeSendOutreachResult {
  success: boolean;
  alreadySent?: boolean;
  sentMessageId?: string;
  targetJid?: string;
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
}

const STORAGE_BRIDGE_TOKEN_KEY = 'orderi_bridge_auth_token_v1';
const STORAGE_BRIDGE_TOKEN_USER_KEY = 'orderi_bridge_auth_user_v1';
const STORAGE_LAST_SEEN_TS_KEY = 'orderi_bridge_last_msg_ts_v1';
const STORAGE_SERVER_OVERRIDE_KEY = 'orderi_bridge_server_url_override';

export const DEFAULT_BRIDGE_WARNING =
  'تنبيه أمني: يعتمد WhatsApp Bridge على مكتبة Baileys غير الرسمية لمحاكاة WhatsApp Web؛ قد يؤدي الاستخدام المكثف أو تغييرات واتساب إلى تقييد الحساب أو انتهاء الجلسة تلقائياً.';

export function createInitialBridgeStatus(userId = ''): BridgeSessionStatus {
  return {
    userId,
    state: 'Disconnected',
    phoneNumber: null,
    pairingCode: null,
    pairingCodeExpiresAt: null,
    connectedJid: null,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    lastMessageAt: null,
    receivedMessagesCount: 0,
    sentMessagesCount: 0,
    messageIngestionActive: false,
    reconnectAttempts: 0,
    errorMessage: null,
    errorCode: null,
    unofficialLibraryWarning: DEFAULT_BRIDGE_WARNING,
  };
}

export function resolveBridgeApiOrigin(): string {
  try {
    const customOverride = localStorage.getItem(STORAGE_SERVER_OVERRIDE_KEY)?.trim();
    if (customOverride) {
      return customOverride.replace(/\/+$/, '');
    }
  } catch {}

  if (!isNativeAndroid() && typeof window !== 'undefined' && window.location?.origin?.startsWith('http')) {
    return window.location.origin.replace(/\/+$/, '');
  }

  const envUrl = ((import.meta as any)?.env?.VITE_ORDERI_API_BASE_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return ORDERI_SERVER_URL.replace(/\/+$/, '');
}

export function setBridgeServerUrlOverride(url: string): void {
  try {
    const clean = (url || '').trim().replace(/\/+$/, '');
    if (!clean) {
      localStorage.removeItem(STORAGE_SERVER_OVERRIDE_KEY);
    } else {
      localStorage.setItem(STORAGE_SERVER_OVERRIDE_KEY, clean);
    }
  } catch {}
}

export function getBridgeServerUrlOverride(): string {
  try {
    return localStorage.getItem(STORAGE_SERVER_OVERRIDE_KEY) || '';
  } catch {
    return '';
  }
}

export function resolveBridgeUserId(): string {
  const user = getCurrentUser();
  if (user?.id) return String(user.id);
  if (user?.phone) return `captain_${user.phone}`;
  return `device_${getDeviceId()}`;
}

export interface BridgeClientListeners {
  onStatus?: (status: BridgeSessionStatus) => void;
  onGroupMessage?: (msg: BridgeGroupMessagePayload) => void;
  onPrivateReply?: (msg: BridgePrivateReplyPayload) => void;
  onSessionExpired?: (reason: string) => void;
}

class OrderiBridgeClient {
  private currentStatus: BridgeSessionStatus = createInitialBridgeStatus();
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private bridgeToken: string | null = null;
  private tokenUserId: string | null = null;
  private enabled = false;
  private readonly listeners = new Set<BridgeClientListeners>();
  private readonly processedEventIds = new Set<string>();
  private handshakePromise: Promise<string> | null = null;

  public getStatusSnapshot(): BridgeSessionStatus {
    return this.currentStatus;
  }

  public isConnected(): boolean {
    return this.enabled && this.currentStatus.state === 'Connected';
  }

  public subscribe(listener: BridgeClientListeners): () => void {
    this.listeners.add(listener);
    listener.onStatus?.(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitStatus(next: BridgeSessionStatus): void {
    this.currentStatus = next;
    for (const l of this.listeners) {
      try {
        l.onStatus?.(next);
      } catch {}
    }
  }

  private handleIncomingGroupMessage(msg: BridgeGroupMessagePayload): void {
    if (!msg?.eventId || this.processedEventIds.has(msg.eventId)) return;
    this.processedEventIds.add(msg.eventId);
    if (this.processedEventIds.size > 1500) {
      const first = this.processedEventIds.values().next().value;
      if (first) this.processedEventIds.delete(first);
    }

    try {
      const prevTs = Number(localStorage.getItem(STORAGE_LAST_SEEN_TS_KEY) || 0);
      if (msg.timestamp > prevTs) {
        localStorage.setItem(STORAGE_LAST_SEEN_TS_KEY, String(msg.timestamp));
      }
    } catch {}

    for (const l of this.listeners) {
      try {
        l.onGroupMessage?.(msg);
      } catch {}
    }
  }

  private async ensureAuthToken(forceRefresh = false): Promise<string> {
    const userId = resolveBridgeUserId();
    if (!forceRefresh && this.bridgeToken && this.tokenUserId === userId) {
      return this.bridgeToken;
    }

    if (!forceRefresh) {
      try {
        const storedTok = localStorage.getItem(STORAGE_BRIDGE_TOKEN_KEY);
        const storedUser = localStorage.getItem(STORAGE_BRIDGE_TOKEN_USER_KEY);
        if (storedTok && storedUser === userId) {
          this.bridgeToken = storedTok;
          this.tokenUserId = storedUser;
          return storedTok;
        }
      } catch {}
    }

    if (this.handshakePromise) {
      return this.handshakePromise;
    }

    this.handshakePromise = (async () => {
      const origin = resolveBridgeApiOrigin();
      const resp = await fetch(`${origin}/api/bridge/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.bridgeToken) {
        throw new Error(data?.error || 'تعذر مصادقة جلسة WhatsApp Bridge');
      }
      this.bridgeToken = data.bridgeToken;
      this.tokenUserId = userId;
      try {
        localStorage.setItem(STORAGE_BRIDGE_TOKEN_KEY, data.bridgeToken);
        localStorage.setItem(STORAGE_BRIDGE_TOKEN_USER_KEY, userId);
      } catch {}
      if (data.status) {
        this.emitStatus(data.status);
      }
      return data.bridgeToken as string;
    })();

    try {
      return await this.handshakePromise;
    } finally {
      this.handshakePromise = null;
    }
  }

  private async authedFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
    const token = await this.ensureAuthToken(retried);
    const origin = resolveBridgeApiOrigin();
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const resp = await fetch(`${origin}${path}`, { ...init, headers });
    if (resp.status === 401 && !retried) {
      this.bridgeToken = null;
      return this.authedFetch(path, init, true);
    }
    return resp;
  }

  public start(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopWebSocket();
      return;
    }
    void this.syncAndConnectWs();
  }

  public async refreshStatus(): Promise<BridgeSessionStatus> {
    try {
      const resp = await this.authedFetch('/api/bridge/session', { method: 'GET' });
      const data = await resp.json();
      if (resp.ok && data?.status) {
        this.emitStatus(data.status);
        return data.status as BridgeSessionStatus;
      }
    } catch {
      // Preserve last known status if server temporarily unreachable
    }
    return this.currentStatus;
  }

  public async connectWithPhoneNumber(phoneNumber: string): Promise<BridgeSessionStatus> {
    this.enabled = true;
    this.emitStatus({
      ...this.currentStatus,
      state: 'Connecting',
      errorCode: null,
      errorMessage: null,
    });
    const resp = await this.authedFetch('/api/bridge/session/connect', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await resp.json();
    if (!resp.ok || !data?.status) {
      const errStatus: BridgeSessionStatus = {
        ...this.currentStatus,
        state: 'Error',
        errorCode: data?.errorCode || 'CONNECT_REQUEST_FAILED',
        errorMessage: data?.error || 'تعذر إنشاء جلسة WhatsApp Bridge على الخادم.',
      };
      this.emitStatus(errStatus);
      return errStatus;
    }
    this.emitStatus(data.status);
    void this.syncAndConnectWs();
    return data.status as BridgeSessionStatus;
  }

  public async reconnect(): Promise<BridgeSessionStatus> {
    const resp = await this.authedFetch('/api/bridge/session/reconnect', { method: 'POST' });
    const data = await resp.json();
    if (data?.status) {
      this.emitStatus(data.status);
      return data.status as BridgeSessionStatus;
    }
    return this.currentStatus;
  }

  public async disconnect(logout = true): Promise<BridgeSessionStatus> {
    const resp = await this.authedFetch('/api/bridge/session/disconnect', {
      method: 'POST',
      body: JSON.stringify({ logout }),
    });
    const data = await resp.json();
    if (data?.status) {
      this.emitStatus(data.status);
      return data.status as BridgeSessionStatus;
    }
    return this.currentStatus;
  }

  public async fetchMissedMessagesSince(afterMs?: number): Promise<BridgeGroupMessagePayload[]> {
    let since = afterMs;
    if (since === undefined) {
      try {
        since = Number(localStorage.getItem(STORAGE_LAST_SEEN_TS_KEY) || 0);
      } catch {
        since = 0;
      }
    }
    try {
      const resp = await this.authedFetch(`/api/bridge/messages/since?after=${encodeURIComponent(String(since || 0))}`, {
        method: 'GET',
      });
      const data = await resp.json();
      if (resp.ok && Array.isArray(data?.messages)) {
        return data.messages;
      }
    } catch {}
    return [];
  }

  public async sendPrivateMessage(params: BridgeSendOutreachParams): Promise<BridgeSendOutreachResult> {
    try {
      const resp = await this.authedFetch('/api/bridge/outreach/send', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      const data = await resp.json();
      return {
        success: Boolean(data?.success),
        alreadySent: Boolean(data?.alreadySent),
        sentMessageId: data?.sentMessageId,
        targetJid: data?.targetJid,
        errorCode: data?.errorCode,
        errorMessage: data?.errorMessage || data?.error,
        timestamp: data?.timestamp || new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'BRIDGE_NETWORK_ERROR',
        errorMessage: err?.message || 'تعذر الوصول إلى خادم WhatsApp Bridge.',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async syncAndConnectWs(): Promise<void> {
    if (!this.enabled || typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      return;
    }

    try {
      const token = await this.ensureAuthToken();
      await this.refreshStatus();

      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const origin = resolveBridgeApiOrigin();
      const wsBase = origin.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
      const wsUrl = `${wsBase}/api/bridge/ws?token=${encodeURIComponent(token)}`;

      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data || '{}'));
          if (msg.type === 'BRIDGE_STATUS' && msg.status) {
            this.emitStatus(msg.status);
          } else if (msg.type === 'BRIDGE_GROUP_MESSAGE' && msg.event) {
            this.handleIncomingGroupMessage(msg.event);
          } else if (msg.type === 'BRIDGE_MISSED_MESSAGES' && Array.isArray(msg.messages)) {
            for (const m of msg.messages) {
              this.handleIncomingGroupMessage(m);
            }
          } else if (msg.type === 'BRIDGE_PRIVATE_REPLY' && msg.event) {
            for (const l of this.listeners) {
              l.onPrivateReply?.(msg.event);
            }
          } else if (msg.type === 'BRIDGE_SESSION_EXPIRED') {
            for (const l of this.listeners) {
              l.onSessionExpired?.(msg.reason || 'انتهت صلاحية جلسة WhatsApp Bridge');
            }
          }
        } catch {}
      };

      socket.onclose = (ev) => {
        if (this.ws === socket) {
          this.ws = null;
        }
        if (ev.code === 4001 || ev.code === 1008) {
          this.bridgeToken = null;
        }
        if (this.enabled) {
          this.scheduleWsReconnect();
        }
      };

      socket.onerror = () => {
        // Error triggers onclose cleanly
      };
    } catch {
      if (this.enabled) {
        this.scheduleWsReconnect();
      }
    }
  }

  private scheduleWsReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.enabled) {
        void this.syncAndConnectWs();
      }
    }, 5000);
  }

  private stopWebSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}

export const orderiBridgeClient = new OrderiBridgeClient();
