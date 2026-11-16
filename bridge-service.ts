import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WhatsAppBridgeSupervisor } from './src/server/bridge/bridgeSupervisor';
import { createBridgeRouter } from './src/server/bridge/bridgeRouter';
import { BridgeWsHub } from './src/server/bridge/bridgeWsServer';
import {
  restoreBridgeStateFromSupabase,
  startBridgeStateBackup,
} from './src/server/bridge/supabaseStateBackup';

async function startBridgeService(): Promise<void> {
  const port = Number(process.env.PORT || 10000);
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY || '';
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const stateDir = process.env.WHATSAPP_BRIDGE_STATE_DIR || '/tmp/whatsapp-bridge';
  const bucket = process.env.WHATSAPP_BRIDGE_STORAGE_BUCKET || 'orderi-bridge-state';

  if (!supabaseUrl || !supabaseSecret) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required by Orderi Bridge.');
  }
  if (Buffer.byteLength(encryptionSecret, 'utf8') < 32) {
    throw new Error('WHATSAPP_BRIDGE_SECRET must contain at least 32 bytes.');
  }

  const restored = await restoreBridgeStateFromSupabase({
    stateDir,
    supabaseUrl,
    supabaseSecretKey: supabaseSecret,
    encryptionSecret,
    bucket,
  });
  console.log(
    `[Orderi Bridge] Supabase state restore: ${restored.restored ? restored.fileCount + ' file(s)' : 'no remote snapshot'}.`
  );

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));

  const allowedOrigins = (process.env.BRIDGE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  async function resolveOrderiUser(req: Request): Promise<string | null> {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
    const sessionToken = authHeader.slice(7).trim();
    if (!sessionToken || sessionToken.length > 4096) return null;

    const headers = {
      apikey: supabaseSecret,
      Authorization: `Bearer ${supabaseSecret}`,
      Accept: 'application/json',
    };

    const sessionUrl = new URL(`${supabaseUrl}/rest/v1/auth_sessions`);
    sessionUrl.searchParams.set('token', `eq.${sessionToken}`);
    sessionUrl.searchParams.set('select', 'captain_id,expires_at');
    sessionUrl.searchParams.set('limit', '1');

    const sessionResponse = await fetch(sessionUrl, { headers });
    if (!sessionResponse.ok) return null;
    const sessions = await sessionResponse.json() as Array<{ captain_id?: string; expires_at?: string }>;
    const session = sessions[0];
    if (!session?.captain_id || !session.expires_at) return null;
    if (!Number.isFinite(Date.parse(session.expires_at)) || Date.parse(session.expires_at) <= Date.now()) {
      return null;
    }

    const captainUrl = new URL(`${supabaseUrl}/rest/v1/captains`);
    captainUrl.searchParams.set('id', `eq.${session.captain_id}`);
    captainUrl.searchParams.set('select', 'id,is_active');
    captainUrl.searchParams.set('limit', '1');
    const captainResponse = await fetch(captainUrl, { headers });
    if (!captainResponse.ok) return null;
    const captains = await captainResponse.json() as Array<{ id?: string; is_active?: boolean }>;
    const captain = captains[0];
    if (!captain?.id || captain.is_active === false) return null;
    return String(captain.id);
  }

  function rateLimit(maxRequests: number, windowMs: number) {
    const hits = new Map<string, { count: number; resetAt: number }>();
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const current = hits.get(key);
      if (!current || current.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return next();
      }
      current.count += 1;
      if (current.count > maxRequests) {
        res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
        return res.status(429).json({
          success: false,
          errorCode: 'RATE_LIMITED',
          error: 'طلبات كثيرة؛ يرجى الانتظار قليلاً ثم المحاولة مجدداً.',
        });
      }
      next();
    };
  }

  let bridgeWsHub: BridgeWsHub | null = null;
  const supervisor = new WhatsAppBridgeSupervisor({
    stateDir,
    masterSecret: encryptionSecret,
    events: {
      onStatusChange: (userId, status) => bridgeWsHub?.broadcastStatus(userId, status),
      onGroupMessage: (userId, event) => bridgeWsHub?.broadcastGroupMessage(userId, event),
      onPrivateReply: (userId, event) => bridgeWsHub?.broadcastPrivateReply(userId, event),
      onSessionExpired: (userId, reason) => bridgeWsHub?.broadcastSessionExpired(userId, reason),
    },
  });

  app.get('/api/bridge/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'orderi-bridge',
      timestamp: new Date().toISOString(),
      persistentStateConfigured: true,
      stateStorage: 'supabase-encrypted',
    });
  });

  app.use('/api/bridge/auth/session', rateLimit(12, 60_000));
  app.use('/api/bridge/session/connect', rateLimit(5, 10 * 60_000));
  app.use('/api/bridge', createBridgeRouter(supervisor, resolveOrderiUser));

  const server = http.createServer(app);
  bridgeWsHub = new BridgeWsHub(server, supervisor);
  const stopStateBackup = startBridgeStateBackup({
    stateDir,
    supabaseUrl,
    supabaseSecretKey: supabaseSecret,
    encryptionSecret,
    bucket,
    intervalMs: 15_000,
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Orderi Bridge] Listening on 0.0.0.0:${port}`);
    try {
      const restoredCount = supervisor.restorePersistedSessions();
      console.log(`[Orderi Bridge] Restored ${restoredCount} persisted WhatsApp session(s).`);
    } catch {
      console.error('[Orderi Bridge] Failed to restore persisted WhatsApp sessions.');
    }
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    supervisor.shutdownAll();
    bridgeWsHub?.close();
    void stopStateBackup().finally(() => {
      server.close(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startBridgeService().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error('[Orderi Bridge] Startup failed:', message);
  process.exit(1);
});
