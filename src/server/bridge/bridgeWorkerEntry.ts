import path from 'path';
import { Boom } from '@hapi/boom';
import makeWASocket, {
  Browsers,
  BufferJSON,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  proto,
} from '@whiskeysockets/baileys';
import { useEncryptedAuthState } from './encryptedAuthState';
import { SerialTaskQueue } from './serialTaskQueue';
import {
  BridgeMessageDeduper,
  extractPhoneFromJid,
  isGroupJid,
  mapBaileysMessage,
  normalizePrivateUserJid,
} from './baileysMessageMapper';
import { sanitizeForLog } from './whatsappBridgeCrypto';
import type {
  BridgeSendPrivateRequest,
  BridgeSendPrivateResult,
  SupervisorToWorkerMessage,
  WhatsAppBridgeConnectionState,
  WorkerToSupervisorMessage,
} from './types';

function createSilentLogger(): any {
  const noop = () => {};
  const logger: any = {
    level: 'silent',
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    child: () => logger,
  };
  return logger;
}

const silentLogger = createSilentLogger();

let activeUserId = '';
let activeSessionDir = '';
let activeMasterSecret = '';
let activePhoneNumber = '';
let wantsPairingCode = false;
let pairingCodeRequestedForSocket = false;
let manualDisconnectRequested = false;
let currentState: WhatsAppBridgeConnectionState = 'Disconnected';
let activeSocket: ReturnType<typeof makeWASocket> | null = null;
let authController: Awaited<ReturnType<typeof useEncryptedAuthState>> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let socketGeneration = 0;
let lastDisconnectDiagnostic: { errorCode: string; errorMessage: string } | null = null;
let socketStartInFlight = false;

const groupNameCache = new Map<string, string>();
const messageDeduper = new BridgeMessageDeduper(2500);

function emitToSupervisor(msg: WorkerToSupervisorMessage): void {
  if (typeof process.send === 'function') {
    process.send(msg);
  }
}

function emitState(
  state: WhatsAppBridgeConnectionState,
  extras?: {
    pairingCode?: string | null;
    pairingCodeExpiresAt?: string | null;
    connectedJid?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    reconnectAttempts?: number;
  }
): void {
  currentState = state;
  emitToSupervisor({
    type: 'STATE_UPDATE',
    userId: activeUserId,
    state,
    ...extras,
  });
}

function sanitizePhoneForPairing(rawPhone?: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 8 && /^[1367]/.test(digits)) {
    return `973${digits}`;
  }
  return digits;
}

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

async function teardownSocket(): Promise<void> {
  socketGeneration++;
  clearReconnectTimer();
  const sock = activeSocket;
  activeSocket = null;
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.ev.removeAllListeners('messages.upsert');
      sock.ev.removeAllListeners('groups.update');
      sock.end(undefined);
    } catch {
      // Ignore socket close error during teardown
    }
  }
}

async function resolveGroupName(sock: ReturnType<typeof makeWASocket>, groupJid: string): Promise<string> {
  const cached = groupNameCache.get(groupJid);
  if (cached) return cached;
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const subject = (metadata?.subject || '').trim();
    if (subject) {
      groupNameCache.set(groupJid, subject);
      return subject;
    }
  } catch {
    // Fallback cleanly if group metadata lookup is rate-limited
  }
  return groupJid;
}

async function requestPairingCodeSafely(
  sock: ReturnType<typeof makeWASocket>,
  generation: number
): Promise<void> {
  if (pairingCodeRequestedForSocket || generation !== socketGeneration) return;
  const cleanPhone = sanitizePhoneForPairing(activePhoneNumber);
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    emitState('Error', {
      errorCode: 'INVALID_PHONE_NUMBER',
      errorMessage: 'رقم الهاتف غير صالح للربط؛ يرجى إدخال رقم واتساب كامل بالرمز الدولي (مثال: 97339123456).',
    });
    return;
  }

  pairingCodeRequestedForSocket = true;
  try {
    const code = await sock.requestPairingCode(cleanPhone);
    if (generation !== socketGeneration) return;
    const formatted = code && code.length === 8 && !code.includes('-')
      ? `${code.slice(0, 4)}-${code.slice(4)}`
      : code;
    emitState('Waiting for Pairing', {
      pairingCode: formatted || code,
      pairingCodeExpiresAt: new Date(Date.now() + 180_000).toISOString(),
      errorCode: null,
      errorMessage: null,
    });
  } catch (err: any) {
    if (generation !== socketGeneration) return;
    pairingCodeRequestedForSocket = false;
    const rawMsg = String(err?.message || '');
    const statusCode = (err as Boom)?.output?.statusCode;
    let friendlyError = `تعذر استخراج رمز الربط من واتساب: ${sanitizeForLog(rawMsg || 'خطأ غير متوقع')}`;
    let errorCode = 'PAIRING_CODE_FAILED';

    if (statusCode === 429 || /rate[-_\s]?overlimit|too many/i.test(rawMsg)) {
      errorCode = 'PAIRING_RATE_LIMITED';
      friendlyError =
        'تم إرسال عدة طلبات ربط متتالية؛ يرجى الانتظار دقيقتين ثم إعادة المحاولة برمز ربط جديد.';
    } else if (/not[-_\s]?authorized|401|403/i.test(rawMsg)) {
      errorCode = 'PAIRING_REJECTED';
      friendlyError =
        'رفض خادم واتساب إنشاء رمز الربط للرقم المدخل — تأكد من إدخال الرقم الصحيح بالرمز الدولي (مثال: 97339123456).';
    } else if (/timed?\s*out|etimedout/i.test(rawMsg)) {
      errorCode = 'PAIRING_TIMEOUT';
      friendlyError =
        'انتهت مهلة الاتصال بخادم واتساب أثناء طلب رمز الربط — تحقق من الإنترنت وأعد المحاولة.';
    }

    emitState('Error', {
      errorCode,
      errorMessage: friendlyError,
    });
  }
}

async function startSocketConnection(): Promise<void> {
  // Serialize socket creation: overlapping INIT/RECONNECT commands must never
  // create competing Baileys sockets against the same encrypted auth state.
  if (socketStartInFlight) {
    console.warn('[Orderi Bridge] Socket start skipped; another initialization is already in progress.');
    return;
  }

  socketStartInFlight = true;
  try {
    await startSocketConnectionInternal();
  } finally {
    socketStartInFlight = false;
  }
}

async function startSocketConnectionInternal(): Promise<void> {
  console.info('[Orderi Bridge] Worker starting WhatsApp socket initialization.');
  await teardownSocket();
  const generation = ++socketGeneration;
  manualDisconnectRequested = false;
  pairingCodeRequestedForSocket = false;

  emitState(reconnectAttempts > 0 ? 'Reconnecting' : 'Connecting', {
    reconnectAttempts,
    ...(lastDisconnectDiagnostic || { errorCode: null, errorMessage: null }),
  });

  try {
    if (!authController) {
      authController = await useEncryptedAuthState(activeSessionDir, activeMasterSecret, {
        initAuthCreds,
        BufferJSON,
        fromAppStateSyncKeyObject: (val) => proto.Message.AppStateSyncKeyData.fromObject(val),
      });
    }
    console.info('[Orderi Bridge] Encrypted WhatsApp auth state initialized.');

    let version: [number, number, number] | undefined;
    try {
      const latest = await fetchLatestBaileysVersion();
      if (Array.isArray(latest?.version) && latest.version.length === 3) {
        version = latest.version;
      }
    } catch {
      // Baileys falls back to bundled WA Web version if version fetch is offline
    }

    if (generation !== socketGeneration) return;

    const sock = makeWASocket({
      version,
      auth: {
        creds: authController.state.creds,
        keys: makeCacheableSignalKeyStore(authController.state.keys, silentLogger),
      },
      logger: silentLogger,
      printQRInTerminal: false,
      browser: Browsers.macOS('Chrome'),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 30_000,
      defaultQueryTimeoutMs: 25_000,
      keepAliveIntervalMs: 25_000,
    });

    activeSocket = sock;
    console.info('[Orderi Bridge] Baileys socket created; waiting for WhatsApp connection events.');

    sock.ev.on('creds.update', async () => {
      if (generation !== socketGeneration || activeSocket !== sock) return;
      if (authController) {
        await authController.saveCreds().catch(() => {});
      }
    });

    sock.ev.on('groups.update', (updates) => {
      if (generation !== socketGeneration || activeSocket !== sock) return;
      for (const update of updates) {
        if (update?.id && update?.subject) {
          groupNameCache.set(update.id, update.subject.trim());
        }
      }
    });

    sock.ev.on('connection.update', async (update) => {
      if (generation !== socketGeneration) return;
      const { connection, lastDisconnect, qr } = update;
      if (connection || qr) {
        console.info(`[Orderi Bridge] WhatsApp connection event: ${connection || 'qr'}.`);
      }

      if (qr && wantsPairingCode && !sock.authState.creds.registered && !pairingCodeRequestedForSocket) {
        await requestPairingCodeSafely(sock, generation);
      }

      if (connection === 'connecting') {
        if (currentState !== 'Waiting for Pairing') {
          emitState(reconnectAttempts > 0 ? 'Reconnecting' : 'Connecting', {
            reconnectAttempts,
            ...(lastDisconnectDiagnostic || { errorCode: null, errorMessage: null }),
          });
        }
        if (wantsPairingCode && !sock.authState.creds.registered && !pairingCodeRequestedForSocket) {
          setTimeout(() => {
            if (generation === socketGeneration && !pairingCodeRequestedForSocket && !sock.authState.creds.registered) {
              void requestPairingCodeSafely(sock, generation);
            }
          }, 1200);
        }
      }

      if (connection === 'open') {
        reconnectAttempts = 0;
        lastDisconnectDiagnostic = null;
        wantsPairingCode = false;
        pairingCodeRequestedForSocket = false;
        const connectedJid = normalizePrivateUserJid(sock.user?.id || '');
        emitState('Connected', {
          pairingCode: null,
          pairingCodeExpiresAt: null,
          connectedJid,
          reconnectAttempts: 0,
          errorCode: null,
          errorMessage: null,
        });

        // Pre-warm group subject cache silently so the very first captured message displays the real Arabic group name
        void sock
          .groupFetchAllParticipating()
          .then((groups) => {
            if (!groups || typeof groups !== 'object') return;
            for (const [jid, meta] of Object.entries(groups)) {
              const subject = String((meta as any)?.subject || '').trim();
              if (jid && subject) {
                groupNameCache.set(jid, subject);
              }
            }
          })
          .catch(() => {});
      }

      if (connection === 'close') {
        if (manualDisconnectRequested) {
          emitState('Disconnected', {
            pairingCode: null,
            pairingCodeExpiresAt: null,
            errorCode: null,
            errorMessage: null,
          });
          return;
        }

        const err = lastDisconnect?.error as Boom | undefined;
        const statusCode = err?.output?.statusCode;
        const isLoggedOut =
          statusCode === DisconnectReason.loggedOut ||
          statusCode === 401 ||
          statusCode === DisconnectReason.badSession;
        const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;
        const disconnectReason = sanitizeForLog(err?.message || err?.name || 'Unknown disconnect');
        console.warn(
          `[Orderi Bridge] WhatsApp socket closed; statusCode=${statusCode ?? 'none'}; reason=${disconnectReason}; generation=${generation}; reconnectAttempts=${reconnectAttempts}.`
        );

        if (isLoggedOut) {
          wantsPairingCode = false;
          lastDisconnectDiagnostic = {
            errorCode: 'SESSION_EXPIRED',
            errorMessage: 'انتهت صلاحية جلسة واتساب؛ يلزم إعادة الربط بعد التأكد من حالة الحساب.',
          };
          if (authController) {
            await authController.clearAll().catch(() => {});
            authController = null;
          }
          emitToSupervisor({
            type: 'SESSION_EXPIRED',
            userId: activeUserId,
            reason: 'تم فصل الجهاز المرتبط من WhatsApp Messenger أو انتهت صلاحية الجلسة (401).',
          });
          emitState('Session Expired', {
            pairingCode: null,
            pairingCodeExpiresAt: null,
            errorCode: 'SESSION_EXPIRED',
            errorMessage: 'انتهت صلاحية جلسة واتساب — يرجى إعادة الربط برمز Pairing Code جديد.',
          });
          return;
        }

        if (isReplaced) {
          lastDisconnectDiagnostic = {
            errorCode: 'CONNECTION_REPLACED',
            errorMessage: 'تم استبدال اتصال الجسر بجلسة أخرى لنفس الحساب؛ تحقق من الأجهزة المرتبطة.',
          };
          emitState('Error', {
            errorCode: 'CONNECTION_REPLACED',
            errorMessage: 'تم استبدال اتصال الجسر بجلسة أخرى لنفس الحساب؛ أعد الاتصال عند الحاجة.',
          });
          return;
        }

        reconnectAttempts += 1;
        const delayMs = Math.min(30_000, 2000 * Math.pow(2, Math.min(reconnectAttempts - 1, 4)));
        lastDisconnectDiagnostic = {
          errorCode: statusCode ? `WA_${statusCode}` : 'NETWORK_RECONNECTING',
          errorMessage: `انقطع اتصال واتساب${statusCode ? ` (HTTP ${statusCode})` : ''}: ${disconnectReason}. ستتم إعادة المحاولة تلقائياً (${reconnectAttempts}).`,
        };
        emitState('Reconnecting', {
          reconnectAttempts,
          ...lastDisconnectDiagnostic,
        });

        clearReconnectTimer();
        reconnectTimer = setTimeout(() => {
          if (!manualDisconnectRequested) {
            void startSocketConnection();
          }
        }, delayMs);
      }
    });

    sock.ev.on('messages.upsert', async (upsert) => {
      if (generation !== socketGeneration) return;
      if (upsert.type !== 'notify') return;

      for (const msg of upsert.messages) {
        try {
          const remoteJid = String(msg?.key?.remoteJid || '');
          const messageId = String(msg?.key?.id || '');
          if (!remoteJid || !messageId) continue;

          const dedupeKey = `${remoteJid}::${messageId}`;
          if (messageDeduper.hasSeen(dedupeKey)) continue;
          messageDeduper.markSeen(dedupeKey);

          let groupName: string | undefined;
          if (isGroupJid(remoteJid)) {
            groupName = await resolveGroupName(sock, remoteJid);
          }

          let resolvedPnJid: string | undefined;
          const candidateLid = isGroupJid(remoteJid)
            ? String(msg?.key?.participant || msg?.participant || '')
            : remoteJid;

          if (candidateLid.endsWith('@lid') && sock.signalRepository?.lidMapping) {
            try {
              const pn = await sock.signalRepository.lidMapping.getPNForLID(candidateLid);
              if (pn) resolvedPnJid = pn;
            } catch {
              // Keep original JID if LID-to-PN mapping isn't populated yet
            }
          }

          const mapped = mapBaileysMessage({
            userId: activeUserId,
            msg,
            groupName,
            resolvedPnJid,
          });

          if (mapped.kind === 'group_message' && mapped.groupEvent) {
            emitToSupervisor({
              type: 'GROUP_MESSAGE',
              userId: activeUserId,
              payload: mapped.groupEvent,
            });
          } else if (mapped.kind === 'private_reply' && mapped.privateEvent) {
            emitToSupervisor({
              type: 'PRIVATE_REPLY',
              userId: activeUserId,
              payload: mapped.privateEvent,
            });
          }
        } catch (err: any) {
          // Never allow one malformed message to kill the worker loop
          emitToSupervisor({
            type: 'STATE_UPDATE',
            userId: activeUserId,
            state: currentState,
            errorCode: 'MESSAGE_PARSE_WARNING',
            errorMessage: sanitizeForLog(err?.message || 'Message handling warning'),
          });
        }
      }
    });
  } catch (err: any) {
    if (generation !== socketGeneration) return;
    console.error(`[Orderi Bridge] Socket initialization failed: ${sanitizeForLog(err?.message || 'Unknown error')}`);
    emitState('Error', {
      errorCode: 'BRIDGE_INIT_FAILED',
      errorMessage: `تعذر تهيئة WhatsApp Web Bridge: ${sanitizeForLog(err?.message || 'خطأ غير متوقع')}`,
    });
  }
}

async function resolveVerifiedTargetJid(
  sock: ReturnType<typeof makeWASocket>,
  payload: BridgeSendPrivateRequest
): Promise<{ jid?: string; errorCode?: string; errorMessage?: string }> {
  const candidateJid = normalizePrivateUserJid(payload.targetJid);
  if (candidateJid) {
    if (candidateJid.endsWith('@s.whatsapp.net')) {
      return { jid: candidateJid };
    }
    if (candidateJid.endsWith('@lid')) {
      try {
        const mappedPn = await sock.signalRepository?.lidMapping?.getPNForLID(candidateJid);
        if (mappedPn && mappedPn.endsWith('@s.whatsapp.net')) {
          return { jid: normalizePrivateUserJid(mappedPn) };
        }
      } catch {
        // Fall through to sending via LID directly
      }
      return { jid: candidateJid };
    }
  }

  const rawPhone = (payload.senderPhone || '').replace(/\D/g, '');
  if (rawPhone.length >= 8) {
    const normalizedPhone =
      rawPhone.length === 8 && /^[1367]/.test(rawPhone) ? `973${rawPhone}` : rawPhone;
    const pnJid = `${normalizedPhone}@s.whatsapp.net`;
    try {
      const check = await sock.onWhatsApp(normalizedPhone);
      if (Array.isArray(check) && check.length > 0 && check[0]?.exists && check[0]?.jid) {
        return { jid: normalizePrivateUserJid(check[0].jid) };
      }
    } catch {
      // Fallback to canonical PN JID
    }
    return { jid: pnJid };
  }

  return {
    errorCode: 'IDENTITY_NOT_VERIFIED',
    errorMessage:
      'لا يتوفر معرف حقيقي (JID) أو رقم هاتف موثق للمعلن في الرسالة الأصلية؛ لن يتم التخمين أو البحث بالاسم منعاً لمراسلة شخص خطأ.',
  };
}

async function handleSendPrivateMessage(
  requestId: string,
  payload: BridgeSendPrivateRequest
): Promise<BridgeSendPrivateResult> {
  const sock = activeSocket;
  if (!sock || currentState !== 'Connected') {
    return {
      success: false,
      errorCode: 'BRIDGE_NOT_CONNECTED',
      errorMessage: 'WhatsApp Bridge غير متصل حالياً بالخادم — يرجى التحقق من حالة الاتصال.',
      timestamp: new Date().toISOString(),
    };
  }

  const resolved = await resolveVerifiedTargetJid(sock, payload);
  if (!resolved.jid) {
    return {
      success: false,
      errorCode: resolved.errorCode || 'IDENTITY_NOT_VERIFIED',
      errorMessage: resolved.errorMessage || 'تعذر التحقق من هوية المستلم.',
      timestamp: new Date().toISOString(),
    };
  }

  const cleanMessage = (payload.message || '').trim();
  if (!cleanMessage) {
    return {
      success: false,
      errorCode: 'EMPTY_MESSAGE',
      errorMessage: 'نص رسالة القبول فارغ.',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const sent = await sock.sendMessage(resolved.jid, { text: cleanMessage });
    const sentMessageId = sent?.key?.id || '';
    if (!sentMessageId) {
      return {
        success: false,
        targetJid: resolved.jid,
        errorCode: 'SEND_ACK_MISSING',
        errorMessage: 'لم يؤكد خادم واتساب استلام الرسالة الخاصة؛ بقي الطلب بدون تسجيل قبول.',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      sentMessageId,
      targetJid: resolved.jid,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      targetJid: resolved.jid,
      errorCode: 'BRIDGE_SEND_FAILED',
      errorMessage: `تعذر إرسال الرسالة الخاصة عبر Bridge: ${sanitizeForLog(err?.message || 'خطأ غير متوقع')}`,
      timestamp: new Date().toISOString(),
    };
  }
}

const lifecycleCommandQueue = new SerialTaskQueue();

async function handleWorkerCommand(raw: SupervisorToWorkerMessage): Promise<void> {
  if (!raw || typeof raw !== 'object') return;
  switch (raw.type) {
    case 'INIT_AND_START': {
      if (socketStartInFlight || activeSocket) {
        console.warn('[Orderi Bridge] Duplicate INIT_AND_START ignored; an existing socket lifecycle is active.');
        break;
      }
      activeUserId = raw.userId;
      activeSessionDir = raw.sessionDir;
      activeMasterSecret = raw.masterSecret;
      activePhoneNumber = raw.phoneNumber || '';
      wantsPairingCode = raw.requestPairingCode;
      reconnectAttempts = 0;
      lastDisconnectDiagnostic = null;
      authController = null;
      emitToSupervisor({ type: 'WORKER_READY', userId: activeUserId });
      await startSocketConnection();
      break;
    }

    case 'RECONNECT': {
      if (raw.phoneNumber) activePhoneNumber = raw.phoneNumber;
      wantsPairingCode = false;
      // Keep the retry counter and last disconnect diagnostic until a real
      // connection open event confirms recovery.
      await startSocketConnection();
      break;
    }

    case 'DISCONNECT': {
      manualDisconnectRequested = true;
      wantsPairingCode = false;
      lastDisconnectDiagnostic = null;
      clearReconnectTimer();
      const sock = activeSocket;
      if (raw.logout && sock) {
        await sock.logout().catch(() => {});
      }
      await teardownSocket();
      if (raw.logout && authController) {
        await authController.clearAll().catch(() => {});
        authController = null;
      }
      emitState('Disconnected', {
        pairingCode: null,
        pairingCodeExpiresAt: null,
        connectedJid: null,
        errorCode: null,
        errorMessage: null,
      });
      break;
    }

    case 'SEND_PRIVATE_MESSAGE': {
      const result = await handleSendPrivateMessage(raw.requestId, raw.payload);
      emitToSupervisor({
        type: 'SEND_RESULT',
        userId: activeUserId,
        requestId: raw.requestId,
        result,
      });
      break;
    }

    case 'PING': {
      emitToSupervisor({ type: 'PONG', userId: activeUserId });
      break;
    }
  }
}

function dispatchWorkerCommand(raw: SupervisorToWorkerMessage): void {
  const isLifecycleCommand =
    raw?.type === 'INIT_AND_START' ||
    raw?.type === 'RECONNECT' ||
    raw?.type === 'DISCONNECT';

  const operation = () => handleWorkerCommand(raw);
  const pending = isLifecycleCommand
    ? lifecycleCommandQueue.run(operation)
    : operation();

  void pending.catch((err: any) => {
    const message = sanitizeForLog(err?.message || 'Worker command failed');
    console.error('[Orderi Bridge] Worker command failed:', message);
    if (activeUserId) {
      emitState('Error', {
        errorCode: 'WORKER_COMMAND_FAILED',
        errorMessage: message,
      });
    }
  });
}

process.on('message', dispatchWorkerCommand);

process.on('uncaughtException', (err) => {
  if (activeUserId) {
    emitState('Error', {
      errorCode: 'WORKER_EXCEPTION',
      errorMessage: sanitizeForLog(err?.message || 'Worker exception'),
    });
  }
});

process.on('unhandledRejection', (reason: any) => {
  if (activeUserId) {
    emitState('Error', {
      errorCode: 'WORKER_REJECTION',
      errorMessage: sanitizeForLog(reason?.message || String(reason || 'Worker rejection')),
    });
  }
});

// Keep IPC loop alive cleanly
void extractPhoneFromJid;
void path;
