import { ChildProcess, fork, spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  decryptBridgePayload,
  deriveUserSessionFolder,
  encryptBridgePayload,
  resolveBridgeMasterSecret,
  sanitizeForLog,
} from './whatsappBridgeCrypto';
import type {
  BridgeGroupMessageEvent,
  BridgeOutreachLedgerRecord,
  BridgePrivateReplyEvent,
  BridgeSendPrivateRequest,
  BridgeSendPrivateResult,
  BridgeSessionPublicStatus,
  SupervisorToWorkerMessage,
  WhatsAppBridgeConnectionState,
  WorkerToSupervisorMessage,
} from './types';

const UNOFFICIAL_LIBRARY_WARNING =
  'تنبيه أمني: يعتمد WhatsApp Bridge على مكتبة Baileys غير الرسمية لمحاكاة WhatsApp Web؛ قد يؤدي الاستخدام المكثف أو تغييرات واتساب إلى تقييد الحساب أو انتهاء الجلسة تلقائياً.';

export interface BridgeWorkerHandle {
  send: (msg: SupervisorToWorkerMessage) => void;
  onMessage: (cb: (msg: WorkerToSupervisorMessage) => void) => void;
  onExit: (cb: (code: number | null, signal: string | null) => void) => void;
  kill: () => void;
}

export type BridgeWorkerFactory = (userId: string) => BridgeWorkerHandle;

interface PersistedSessionMeta {
  userId: string;
  phoneNumber: string | null;
  autoResume: boolean;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastMessageAt: string | null;
  receivedMessagesCount: number;
  sentMessagesCount: number;
}

interface PendingSendResolver {
  resolve: (result: BridgeSendPrivateResult) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface UserSessionRecord {
  userId: string;
  sessionDir: string;
  status: BridgeSessionPublicStatus;
  autoResume: boolean;
  worker: BridgeWorkerHandle | null;
  pairingStartupTimer: ReturnType<typeof setTimeout> | null;
  recentGroupMessages: BridgeGroupMessageEvent[];
  pendingSends: Map<string, PendingSendResolver>;
  outreachLedger: {
    byOperationId: Record<string, BridgeOutreachLedgerRecord>;
    byOrderId: Record<string, BridgeOutreachLedgerRecord>;
  };
  inFlightOrderIds: Set<string>;
}

export interface BridgeSupervisorEvents {
  onStatusChange?: (userId: string, status: BridgeSessionPublicStatus) => void;
  onGroupMessage?: (userId: string, event: BridgeGroupMessageEvent) => void;
  onPrivateReply?: (userId: string, event: BridgePrivateReplyEvent) => void;
  onSessionExpired?: (userId: string, reason: string) => void;
}

function defaultWorkerFactory(): BridgeWorkerHandle {
  const distWorkerPath = path.resolve(process.cwd(), 'dist', 'bridge-worker.mjs');
  const tsWorkerPath = path.resolve(process.cwd(), 'src', 'server', 'bridge', 'bridgeWorkerEntry.ts');
  const isCompiledBundle =
    typeof __filename === 'string' && __filename.endsWith('.cjs') && fs.existsSync(distWorkerPath);

  let child: ChildProcess;
  if (isCompiledBundle || !fs.existsSync(tsWorkerPath)) {
    child = fork(distWorkerPath, [], {
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
      env: { ...process.env },
    });
  } else {
    const tsxBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'tsx');
    if (fs.existsSync(tsxBin)) {
      child = spawn(tsxBin, [tsWorkerPath], {
        stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
        env: { ...process.env },
      });
    } else {
      child = fork(tsWorkerPath, [], {
        stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
        execArgv: ['--import', 'tsx'],
        env: { ...process.env },
      });
    }
  }

  if (child.stderr) {
    child.stderr.on('data', (chunk) => {
      const msg = sanitizeForLog(chunk.toString('utf8').trim());
      if (msg) {
        console.warn('[Orderi Bridge Worker]', msg);
      }
    });
  }

  return {
    send: (msg) => {
      if (child.connected) {
        child.send(msg);
      }
    },
    onMessage: (cb) => {
      child.on('message', cb);
    },
    onExit: (cb) => {
      child.on('exit', cb);
    },
    kill: () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // Ignore cleanup failure
      }
    },
  };
}

export class WhatsAppBridgeSupervisor {
  public readonly stateDir: string;
  public readonly masterSecret: string;
  private readonly workerFactory: BridgeWorkerFactory;
  private readonly events: BridgeSupervisorEvents;
  private readonly sessions = new Map<string, UserSessionRecord>();
  private readonly maxRecentMessagesPerUser = 150;

  constructor(options?: {
    stateDir?: string;
    masterSecret?: string;
    workerFactory?: BridgeWorkerFactory;
    events?: BridgeSupervisorEvents;
  }) {
    this.stateDir =
      options?.stateDir ||
      process.env.WHATSAPP_BRIDGE_STATE_DIR ||
      path.resolve(process.cwd(), 'data', 'whatsapp-bridge');
    fs.mkdirSync(this.stateDir, { recursive: true, mode: 0o700 });
    this.masterSecret = options?.masterSecret || resolveBridgeMasterSecret(this.stateDir);
    this.workerFactory = options?.workerFactory || (() => defaultWorkerFactory());
    this.events = options?.events || {};
  }

  private getOrCreateRecord(userId: string): UserSessionRecord {
    const cleanUserId = (userId || '').trim();
    if (!cleanUserId) {
      throw new Error('userId is required');
    }
    const existing = this.sessions.get(cleanUserId);
    if (existing) return existing;

    const sessionDir = deriveUserSessionFolder(this.stateDir, cleanUserId);
    fs.mkdirSync(sessionDir, { recursive: true, mode: 0o700 });

    const meta = this.readMeta(sessionDir, cleanUserId);
    const outreachLedger = this.readOutreachLedger(sessionDir);

    const record: UserSessionRecord = {
      userId: cleanUserId,
      sessionDir,
      autoResume: meta.autoResume,
      worker: null,
      pairingStartupTimer: null,
      recentGroupMessages: [],
      pendingSends: new Map(),
      outreachLedger,
      inFlightOrderIds: new Set(),
      status: {
        userId: cleanUserId,
        state: 'Disconnected',
        phoneNumber: meta.phoneNumber,
        pairingCode: null,
        pairingCodeExpiresAt: null,
        connectedJid: null,
        lastConnectedAt: meta.lastConnectedAt,
        lastDisconnectedAt: meta.lastDisconnectedAt,
        lastMessageAt: meta.lastMessageAt,
        receivedMessagesCount: meta.receivedMessagesCount,
        sentMessagesCount: meta.sentMessagesCount,
        messageIngestionActive: false,
        reconnectAttempts: 0,
        errorMessage: null,
        errorCode: null,
        unofficialLibraryWarning: UNOFFICIAL_LIBRARY_WARNING,
      },
    };

    this.sessions.set(cleanUserId, record);
    return record;
  }

  private readMeta(sessionDir: string, userId: string): PersistedSessionMeta {
    const metaPath = path.join(sessionDir, 'meta.json');
    try {
      if (fs.existsSync(metaPath)) {
        const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return {
          userId,
          phoneNumber: parsed.phoneNumber || null,
          autoResume: Boolean(parsed.autoResume),
          lastConnectedAt: parsed.lastConnectedAt || null,
          lastDisconnectedAt: parsed.lastDisconnectedAt || null,
          lastMessageAt: parsed.lastMessageAt || null,
          receivedMessagesCount: Number(parsed.receivedMessagesCount || 0),
          sentMessagesCount: Number(parsed.sentMessagesCount || 0),
        };
      }
    } catch {
      // Corrupt metadata resets safely
    }
    return {
      userId,
      phoneNumber: null,
      autoResume: false,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      lastMessageAt: null,
      receivedMessagesCount: 0,
      sentMessagesCount: 0,
    };
  }

  private persistMeta(record: UserSessionRecord): void {
    try {
      const metaPath = path.join(record.sessionDir, 'meta.json');
      const payload: PersistedSessionMeta = {
        userId: record.userId,
        phoneNumber: record.status.phoneNumber,
        autoResume: record.autoResume,
        lastConnectedAt: record.status.lastConnectedAt,
        lastDisconnectedAt: record.status.lastDisconnectedAt,
        lastMessageAt: record.status.lastMessageAt,
        receivedMessagesCount: record.status.receivedMessagesCount,
        sentMessagesCount: record.status.sentMessagesCount,
      };
      fs.writeFileSync(metaPath, JSON.stringify(payload, null, 2), { encoding: 'utf8', mode: 0o600 });
    } catch {
      // Non-fatal metadata write error
    }
  }

  private readOutreachLedger(sessionDir: string): {
    byOperationId: Record<string, BridgeOutreachLedgerRecord>;
    byOrderId: Record<string, BridgeOutreachLedgerRecord>;
  } {
    const ledgerPath = path.join(sessionDir, 'outreach-ledger.enc');
    try {
      if (fs.existsSync(ledgerPath)) {
        const envelope = fs.readFileSync(ledgerPath, 'utf8');
        const json = decryptBridgePayload(envelope, this.masterSecret, 'outreach-ledger');
        const parsed = JSON.parse(json);
        return {
          byOperationId: parsed.byOperationId || {},
          byOrderId: parsed.byOrderId || {},
        };
      }
    } catch {
      // Start clean ledger if unreadable
    }
    return { byOperationId: {}, byOrderId: {} };
  }

  private persistOutreachLedger(record: UserSessionRecord): void {
    try {
      const ledgerPath = path.join(record.sessionDir, 'outreach-ledger.enc');
      const encrypted = encryptBridgePayload(
        JSON.stringify(record.outreachLedger),
        this.masterSecret,
        'outreach-ledger'
      );
      fs.writeFileSync(ledgerPath, encrypted, { encoding: 'utf8', mode: 0o600 });
    } catch {
      // Non-fatal persistence warning
    }
  }

  private ensureWorker(record: UserSessionRecord): BridgeWorkerHandle {
    if (record.worker) return record.worker;

    const worker = this.workerFactory(record.userId);
    record.worker = worker;

    worker.onMessage((msg) => {
      this.handleWorkerMessage(record, msg);
    });

    worker.onExit((code) => {
      if (record.worker !== worker) return;
      record.worker = null;
      // Reject pending sends cleanly without claiming sent
      for (const [reqId, pending] of record.pendingSends.entries()) {
        clearTimeout(pending.timer);
        pending.resolve({
          success: false,
          errorCode: 'WORKER_EXITED',
          errorMessage: 'توقفت خدمة WhatsApp Bridge مؤقتاً أثناء الإرسال — أعد المحاولة بعد عودة الاتصال.',
          timestamp: new Date().toISOString(),
        });
        record.pendingSends.delete(reqId);
      }

      if (record.autoResume && record.status.state !== 'Session Expired' && record.status.state !== 'Disconnected') {
        this.updateStatus(record, {
          state: 'Reconnecting',
          messageIngestionActive: false,
          errorCode: code ? `WORKER_EXIT_${code}` : 'WORKER_RESTARTING',
          errorMessage: 'إعادة تشغيل خدمة WhatsApp Bridge المعزولة تلقائياً...',
        });
        setTimeout(() => {
          if (record.autoResume && !record.worker) {
            this.resumeSession(record.userId);
          }
        }, 2500);
      } else if (record.status.state !== 'Session Expired') {
        this.updateStatus(record, {
          state: 'Disconnected',
          messageIngestionActive: false,
        });
      }
    });

    return worker;
  }

  private updateStatus(
    record: UserSessionRecord,
    patch: Partial<BridgeSessionPublicStatus>
  ): void {
    const prevState = record.status.state;
    const nextState: WhatsAppBridgeConnectionState = patch.state || prevState;

    const nowIso = new Date().toISOString();
    const updated: BridgeSessionPublicStatus = {
      ...record.status,
      ...patch,
      state: nextState,
      messageIngestionActive: nextState === 'Connected',
      lastConnectedAt:
        nextState === 'Connected' && prevState !== 'Connected'
          ? nowIso
          : patch.lastConnectedAt ?? record.status.lastConnectedAt,
      lastDisconnectedAt:
        prevState === 'Connected' && nextState !== 'Connected'
          ? nowIso
          : patch.lastDisconnectedAt ?? record.status.lastDisconnectedAt,
    };

    record.status = updated;
    if (nextState === 'Connected') {
      record.autoResume = true;
    } else if (nextState === 'Disconnected' || nextState === 'Session Expired') {
      record.autoResume = false;
    }
    this.persistMeta(record);
    this.events.onStatusChange?.(record.userId, updated);
  }

  private handleWorkerMessage(record: UserSessionRecord, msg: WorkerToSupervisorMessage): void {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'WORKER_READY': {
        console.info('[Orderi Bridge] WhatsApp worker is ready to initialize.');
        break;
      }

      case 'STATE_UPDATE': {
        if (msg.state !== 'Connecting' && msg.state !== 'Reconnecting' && record.pairingStartupTimer) {
          clearTimeout(record.pairingStartupTimer);
          record.pairingStartupTimer = null;
        }
        console.info(`[Orderi Bridge] Worker state update: ${msg.state}; errorCode=${msg.errorCode || 'none'}.`);
        this.updateStatus(record, {
          state: msg.state,
          pairingCode: msg.pairingCode !== undefined ? msg.pairingCode : record.status.pairingCode,
          pairingCodeExpiresAt:
            msg.pairingCodeExpiresAt !== undefined
              ? msg.pairingCodeExpiresAt
              : record.status.pairingCodeExpiresAt,
          connectedJid: msg.connectedJid !== undefined ? msg.connectedJid : record.status.connectedJid,
          errorCode: msg.errorCode !== undefined ? msg.errorCode : null,
          errorMessage: msg.errorMessage !== undefined ? msg.errorMessage : null,
          reconnectAttempts:
            msg.reconnectAttempts !== undefined
              ? msg.reconnectAttempts
              : record.status.reconnectAttempts,
        });
        break;
      }

      case 'GROUP_MESSAGE': {
        const evt = msg.payload;
        if (!record.recentGroupMessages.some((m) => m.eventId === evt.eventId)) {
          record.recentGroupMessages.unshift(evt);
          if (record.recentGroupMessages.length > this.maxRecentMessagesPerUser) {
            record.recentGroupMessages.pop();
          }
          record.status = {
            ...record.status,
            receivedMessagesCount: record.status.receivedMessagesCount + 1,
            lastMessageAt: evt.receivedAtIso,
          };
          this.persistMeta(record);
        }
        this.events.onGroupMessage?.(record.userId, evt);
        break;
      }

      case 'PRIVATE_REPLY': {
        this.events.onPrivateReply?.(record.userId, msg.payload);
        break;
      }

      case 'SEND_RESULT': {
        const pending = record.pendingSends.get(msg.requestId);
        if (pending) {
          clearTimeout(pending.timer);
          record.pendingSends.delete(msg.requestId);
          pending.resolve(msg.result);
        }
        break;
      }

      case 'SESSION_EXPIRED': {
        record.autoResume = false;
        this.updateStatus(record, {
          state: 'Session Expired',
          pairingCode: null,
          pairingCodeExpiresAt: null,
          connectedJid: null,
          errorCode: 'SESSION_EXPIRED',
          errorMessage: msg.reason,
        });
        this.events.onSessionExpired?.(record.userId, msg.reason);
        break;
      }
    }
  }

  public getStatus(userId: string): BridgeSessionPublicStatus {
    return { ...this.getOrCreateRecord(userId).status };
  }

  public getRecentGroupMessages(userId: string, afterTimestamp = 0): BridgeGroupMessageEvent[] {
    const record = this.getOrCreateRecord(userId);
    return record.recentGroupMessages
      .filter((m) => m.timestamp > afterTimestamp)
      .slice()
      .reverse();
  }

  public startPairing(userId: string, phoneNumber: string): BridgeSessionPublicStatus {
    const digits = (phoneNumber || '').replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      const record = this.getOrCreateRecord(userId);
      this.updateStatus(record, {
        state: 'Error',
        errorCode: 'INVALID_PHONE_NUMBER',
        errorMessage: 'يرجى إدخال رقم واتساب صحيح (مثال: 97339123456 أو 39123456).',
      });
      return this.getStatus(userId);
    }

    const normalizedPhone =
      digits.length === 8 && /^[1367]/.test(digits) ? `973${digits}` : digits;

    const record = this.getOrCreateRecord(userId);
    if (record.worker) {
      record.worker.kill();
      record.worker = null;
    }

    this.updateStatus(record, {
      state: 'Connecting',
      phoneNumber: normalizedPhone,
      pairingCode: null,
      pairingCodeExpiresAt: null,
      errorCode: null,
      errorMessage: null,
      reconnectAttempts: 0,
    });

    const worker = this.ensureWorker(record);
    if (record.pairingStartupTimer) clearTimeout(record.pairingStartupTimer);
    record.pairingStartupTimer = setTimeout(() => {
      if (record.status.state !== 'Connecting' && record.status.state !== 'Reconnecting') return;
      console.warn('[Orderi Bridge] Pairing startup timed out before a pairing code or terminal state was received.');
      const stalledWorker = record.worker;
      record.worker = null;
      if (stalledWorker) stalledWorker.kill();
      record.pairingStartupTimer = null;
      this.updateStatus(record, {
        state: 'Error',
        errorCode: 'PAIRING_START_TIMEOUT',
        errorMessage: 'توقف تجهيز اتصال واتساب دون استجابة من خدمة الربط. تحقق من سجلات الخدمة ثم أعد المحاولة لاحقاً.',
      });
    }, 45_000);
    worker.send({
      type: 'INIT_AND_START',
      userId: record.userId,
      sessionDir: record.sessionDir,
      masterSecret: this.masterSecret,
      phoneNumber: normalizedPhone,
      requestPairingCode: true,
    });

    console.info('[Orderi Bridge] WhatsApp worker startup command sent.');
    return this.getStatus(userId);
  }

  public reconnect(userId: string): BridgeSessionPublicStatus {
    const record = this.getOrCreateRecord(userId);
    if (record.status.state === 'Session Expired') {
      this.updateStatus(record, {
        state: 'Session Expired',
        errorCode: 'SESSION_EXPIRED',
        errorMessage: 'انتهت صلاحية الجلسة السابقة؛ يرجى الضغط على "ربط واتساب" لاستخراج رمز ربط جديد.',
      });
      return this.getStatus(userId);
    }

    this.updateStatus(record, {
      state: 'Reconnecting',
      errorCode: null,
      errorMessage: null,
    });

    if (record.worker) {
      record.worker.send({
        type: 'RECONNECT',
        phoneNumber: record.status.phoneNumber || undefined,
      });
    } else {
      const worker = this.ensureWorker(record);
      worker.send({
        type: 'INIT_AND_START',
        userId: record.userId,
        sessionDir: record.sessionDir,
        masterSecret: this.masterSecret,
        phoneNumber: record.status.phoneNumber || undefined,
        requestPairingCode: false,
      });
    }

    return this.getStatus(userId);
  }

  public resumeSession(userId: string): BridgeSessionPublicStatus {
    const record = this.getOrCreateRecord(userId);
    if (record.worker) return this.getStatus(userId);
    this.updateStatus(record, { state: 'Reconnecting', errorCode: null, errorMessage: null });
    const worker = this.ensureWorker(record);
    worker.send({
      type: 'INIT_AND_START',
      userId: record.userId,
      sessionDir: record.sessionDir,
      masterSecret: this.masterSecret,
      phoneNumber: record.status.phoneNumber || undefined,
      requestPairingCode: false,
    });
    return this.getStatus(userId);
  }

  public async disconnect(userId: string, logout = true): Promise<BridgeSessionPublicStatus> {
    const record = this.getOrCreateRecord(userId);
    record.autoResume = false;
    if (record.worker) {
      record.worker.send({ type: 'DISCONNECT', logout });
      if (logout) {
        const w = record.worker;
        setTimeout(() => {
          w.kill();
        }, 1200);
        record.worker = null;
      }
    }

    if (logout) {
      try {
        await fs.promises.rm(path.join(record.sessionDir, 'auth'), { recursive: true, force: true });
      } catch {
        // Ignore cleanup failure
      }
    }

    this.updateStatus(record, {
      state: 'Disconnected',
      pairingCode: null,
      pairingCodeExpiresAt: null,
      connectedJid: null,
      errorCode: null,
      errorMessage: null,
      reconnectAttempts: 0,
    });

    return this.getStatus(userId);
  }

  public async sendPrivateMessage(
    userId: string,
    payload: BridgeSendPrivateRequest
  ): Promise<BridgeSendPrivateResult> {
    const record = this.getOrCreateRecord(userId);

    // 1. Check idempotency ledger first (never duplicate outreach for same operationId or orderId)
    const existingByOp = payload.operationId ? record.outreachLedger.byOperationId[payload.operationId] : undefined;
    if (existingByOp) {
      return {
        success: true,
        alreadySent: true,
        sentMessageId: existingByOp.sentMessageId,
        targetJid: existingByOp.targetJid,
        timestamp: existingByOp.sentAt,
      };
    }

    const existingByOrder = payload.orderId ? record.outreachLedger.byOrderId[payload.orderId] : undefined;
    if (existingByOrder) {
      return {
        success: true,
        alreadySent: true,
        sentMessageId: existingByOrder.sentMessageId,
        targetJid: existingByOrder.targetJid,
        timestamp: existingByOrder.sentAt,
      };
    }

    if (record.inFlightOrderIds.has(payload.orderId)) {
      return {
        success: false,
        errorCode: 'SEND_IN_FLIGHT',
        errorMessage: 'توجد عملية إرسال جارية حالياً لهذا الطلب — مُنع التكرار.',
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Enforce Connected state strictly
    if (!record.worker || record.status.state !== 'Connected') {
      return {
        success: false,
        errorCode: 'BRIDGE_NOT_CONNECTED',
        errorMessage: 'WhatsApp Bridge غير متصل حالياً — تأكد من حالة الجلسة أو أعد الاتصال.',
        timestamp: new Date().toISOString(),
      };
    }

    // 3. Enforce verified JID or phone (NEVER allow display-name-only sending)
    const hasJid = Boolean(
      payload.targetJid &&
        (payload.targetJid.includes('@s.whatsapp.net') || payload.targetJid.includes('@lid'))
    );
    const phoneDigits = (payload.senderPhone || '').replace(/\D/g, '');
    const hasPhone = phoneDigits.length >= 8;

    if (!hasJid && !hasPhone) {
      return {
        success: false,
        errorCode: 'IDENTITY_NOT_VERIFIED',
        errorMessage:
          'لا يتوفر معرف مرسل حقيقي أو رقم موثق في الرسالة الأصلية؛ مُنع الإرسال بالاسم منعاً لمراسلة شخص خطأ.',
        timestamp: new Date().toISOString(),
      };
    }

    const requestId = `req-${crypto.randomUUID()}`;
    record.inFlightOrderIds.add(payload.orderId);

    try {
      const result = await new Promise<BridgeSendPrivateResult>((resolve) => {
        const timer = setTimeout(() => {
          record.pendingSends.delete(requestId);
          resolve({
            success: false,
            errorCode: 'BRIDGE_SEND_TIMEOUT',
            errorMessage: 'انتهى وقت انتظار تأكيد الإرسال من WhatsApp Bridge.',
            timestamp: new Date().toISOString(),
          });
        }, 20_000);

        record.pendingSends.set(requestId, { resolve, timer });
        record.worker!.send({
          type: 'SEND_PRIVATE_MESSAGE',
          requestId,
          payload,
        });
      });

      if (result.success && result.sentMessageId) {
        const ledgerRecord: BridgeOutreachLedgerRecord = {
          operationId: payload.operationId,
          orderId: payload.orderId,
          targetJid: result.targetJid || payload.targetJid || `${phoneDigits}@s.whatsapp.net`,
          sentMessageId: result.sentMessageId,
          messagePreview: payload.message.slice(0, 80),
          sentAt: result.timestamp,
        };
        if (payload.operationId) {
          record.outreachLedger.byOperationId[payload.operationId] = ledgerRecord;
        }
        if (payload.orderId) {
          record.outreachLedger.byOrderId[payload.orderId] = ledgerRecord;
        }
        record.status = {
          ...record.status,
          sentMessagesCount: record.status.sentMessagesCount + 1,
        };
        this.persistOutreachLedger(record);
        this.persistMeta(record);
      }

      return result;
    } finally {
      record.inFlightOrderIds.delete(payload.orderId);
    }
  }

  /**
   * Restores previously active WhatsApp Bridge sessions on backend startup/reboot.
   */
  public restorePersistedSessions(): number {
    const sessionsRoot = path.join(this.stateDir, 'sessions');
    if (!fs.existsSync(sessionsRoot)) return 0;
    let restored = 0;
    for (const folderName of fs.readdirSync(sessionsRoot)) {
      const folderPath = path.join(sessionsRoot, folderName);
      const metaPath = path.join(folderPath, 'meta.json');
      const authDir = path.join(folderPath, 'auth');
      if (!fs.existsSync(metaPath) || !fs.existsSync(authDir)) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        if (parsed?.userId && parsed?.autoResume === true) {
          this.resumeSession(String(parsed.userId));
          restored += 1;
        }
      } catch {
        // Ignore corrupted session descriptor
      }
    }
    return restored;
  }

  public shutdownAll(): void {
    for (const record of this.sessions.values()) {
      record.autoResume = false;
      if (record.worker) {
        record.worker.kill();
        record.worker = null;
      }
    }
  }
}
