import test, { describe, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import express from 'express';

import {
  decryptBridgePayload,
  deriveUserSessionFolder,
  encryptBridgePayload,
  sanitizeForLog,
  signBridgeToken,
  verifyBridgeToken,
} from '../src/server/bridge/whatsappBridgeCrypto';
import { useEncryptedAuthState, withEncryptedAuthStateLock } from '../src/server/bridge/encryptedAuthState';
import { createBridgeRouter } from '../src/server/bridge/bridgeRouter';
import {
  BridgeMessageDeduper,
  extractPhoneFromJid,
  mapBaileysMessage,
} from '../src/server/bridge/baileysMessageMapper';
import {
  BridgeWorkerHandle,
  WhatsAppBridgeSupervisor,
} from '../src/server/bridge/bridgeSupervisor';
import type {
  SupervisorToWorkerMessage,
  WorkerToSupervisorMessage,
} from '../src/server/bridge/types';
import { findDuplicateOrderMatch } from '../src/utils/orderDedup';
import { checkIncomingMessageForClosure } from '../src/utils/orderClosureDetector';
import {
  executePrivateAdvertiserOutreach,
  BridgeOutreachAdapter,
} from '../src/utils/whatsappPrivateOutreach';
import { evaluateOrderMatch } from '../src/utils/matcher';
import type { OrderFilter, ParsedOrder } from '../src/types';

const tempDirs: string[] = [];
function createTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

after(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

class MockBridgeWorker implements BridgeWorkerHandle {
  private emitter = new EventEmitter();
  public sentCommands: SupervisorToWorkerMessage[] = [];
  public killed = false;

  send(msg: SupervisorToWorkerMessage): void {
    this.sentCommands.push(msg);
  }

  onMessage(cb: (msg: WorkerToSupervisorMessage) => void): void {
    this.emitter.on('message', cb);
  }

  onExit(cb: (code: number | null, signal: string | null) => void): void {
    this.emitter.on('exit', cb);
  }

  emitWorkerMessage(msg: WorkerToSupervisorMessage): void {
    this.emitter.emit('message', msg);
  }

  emitCrash(code = 1): void {
    this.emitter.emit('exit', code, null);
  }

  kill(): void {
    this.killed = true;
  }
}

describe('WhatsApp Bridge Crypto & Token Security', () => {
  test('AES-256-GCM encrypts, uses random IV, decrypts, and rejects tampering', () => {
    const secret = 'orderi-super-strong-test-secret-key-973';
    const payload = JSON.stringify({ noiseKey: 'secret-buffer', user: '97339123456' });

    const enc1 = encryptBridgePayload(payload, secret, 'baileys-auth');
    const enc2 = encryptBridgePayload(payload, secret, 'baileys-auth');

    assert.ok(enc1.startsWith('ORD_BRIDGE_AESGCM_V1:'));
    assert.notEqual(enc1, enc2, 'Distinct random IVs must produce distinct ciphertexts');
    assert.equal(decryptBridgePayload(enc1, secret, 'baileys-auth'), payload);

    const parts = enc1.split(':');
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3].slice(0, -4)}AAAA`;
    assert.throws(() => decryptBridgePayload(tampered, secret, 'baileys-auth'));
  });

  test('Per-user session directory hashing and HMAC token isolation', () => {
    const baseDir = '/tmp/orderi-bridge-test';
    const dirA = deriveUserSessionFolder(baseDir, 'captain-alpha');
    const dirB = deriveUserSessionFolder(baseDir, 'captain-beta');
    assert.notEqual(dirA, dirB);
    assert.ok(!dirA.includes('captain-alpha'), 'Session path should hash userId');

    const secret = 'token-hmac-secret-at-least-32-chars!!';
    const token = signBridgeToken('captain-alpha', secret, 60_000);
    const verified = verifyBridgeToken(token, secret);
    assert.equal(verified.valid, true);
    assert.equal(verified.userId, 'captain-alpha');

    const tampered = `${token.slice(0, -2)}zz`;
    assert.equal(verifyBridgeToken(tampered, secret).valid, false);

    const expired = signBridgeToken('captain-alpha', secret, -5_000);
    assert.equal(verifyBridgeToken(expired, secret).valid, false);

    const redacted = sanitizeForLog(`Authorization: Bearer ${token} state=ORD_BRIDGE_AESGCM_V1:abc:def:ghi`);
    assert.ok(!redacted.includes(token));
    assert.ok(!redacted.includes('ORD_BRIDGE_AESGCM_V1:abc'));
  });
});

describe('Encrypted Baileys Auth State Adapter', () => {
  test('Fails closed on unreadable existing credentials without replacing or deleting session data', async () => {
    const dir = createTempDir('orderi-corrupt-auth-');
    const authDir = path.join(dir, 'auth');
    fs.mkdirSync(authDir, { recursive: true });
    const credsPath = path.join(authDir, 'creds.enc');
    const original = 'ORD_BRIDGE_AESGCM_V1:corrupt-existing-session-data';
    fs.writeFileSync(credsPath, original, 'utf8');

    let initCalls = 0;
    await assert.rejects(
      useEncryptedAuthState(dir, 'vault-master-secret-973-testing-key', {
        initAuthCreds: () => {
          initCalls += 1;
          return { registrationId: 1 };
        },
        BufferJSON: {
          replacer: (_k: string, v: any) => v,
          reviver: (_k: string, v: any) => v,
        },
      }),
      /Unable to decrypt or parse encrypted Baileys auth file creds\.enc/
    );

    assert.equal(initCalls, 0, 'An unreadable existing session must not be silently replaced with fresh credentials');
    assert.equal(fs.readFileSync(credsPath, 'utf8'), original, 'Existing session bytes must remain untouched');
  });

  test('Auth snapshots hold the same exclusive lock used by credential writes', async () => {
    const dir = createTempDir('orderi-auth-lock-');
    const vault = await useEncryptedAuthState(dir, 'vault-master-secret-973-testing-key', {
      initAuthCreds: () => ({ registrationId: 7788 }),
      BufferJSON: {
        replacer: (_k: string, v: any) => v,
        reviver: (_k: string, v: any) => v,
      },
    });

    let releaseLock!: () => void;
    const gate = new Promise<void>((resolve) => { releaseLock = resolve; });
    const lockHeld = withEncryptedAuthStateLock(dir, async () => gate);
    const pendingWrite = vault.saveCreds();

    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(fs.existsSync(path.join(dir, 'auth', 'creds.enc')), false,
      'Credential writes must wait while a consistent auth snapshot holds the lock');

    releaseLock();
    await Promise.all([lockHeld, pendingWrite]);
    assert.equal(fs.existsSync(path.join(dir, 'auth', 'creds.enc')), true);
  });

  test('Persists creds and keys encrypted on disk without plaintext leaks and wipes on clearAll', async () => {
    const dir = createTempDir('orderi-enc-auth-');
    const secret = 'vault-master-secret-973-testing-key';
    const mockBufferJson = {
      replacer: (_k: string, v: any) =>
        v instanceof Uint8Array || Buffer.isBuffer(v) ? { type: 'Buffer', data: Buffer.from(v).toString('base64') } : v,
      reviver: (_k: string, v: any) =>
        v && typeof v === 'object' && v.type === 'Buffer' ? Buffer.from(v.data, 'base64') : v,
    };

    const vault1 = await useEncryptedAuthState(dir, secret, {
      initAuthCreds: () => ({ registrationId: 7788, noiseKey: Buffer.from('super-secret-noise-key') }),
      BufferJSON: mockBufferJson,
    });

    await vault1.saveCreds();
    await vault1.state.keys.set({
      'pre-key': {
        '42': { public: Buffer.from('pk-42-secret-material') },
      },
    });

    const credsEncPath = path.join(dir, 'auth', 'creds.enc');
    const diskContent = fs.readFileSync(credsEncPath, 'utf8');
    assert.ok(diskContent.startsWith('ORD_BRIDGE_AESGCM_V1:'));
    assert.ok(!diskContent.includes('7788'));
    assert.ok(!diskContent.includes('super-secret-noise-key'));

    // Reload from disk and verify Buffer revival
    const vault2 = await useEncryptedAuthState(dir, secret, {
      initAuthCreds: () => ({ registrationId: 0 }),
      BufferJSON: mockBufferJson,
    });
    assert.equal(vault2.state.creds.registrationId, 7788);
    assert.ok(Buffer.isBuffer(vault2.state.creds.noiseKey));
    assert.equal(vault2.state.creds.noiseKey.toString('utf8'), 'super-secret-noise-key');

    const keys = await vault2.state.keys.get('pre-key', ['42']);
    assert.equal(keys['42'].public.toString('utf8'), 'pk-42-secret-material');

    await vault2.clearAll();
    assert.equal(fs.existsSync(credsEncPath), false);
  });
});

describe('Baileys Incoming Message Mapper & Reconnect Dedup', () => {
  test('Extracts group text, image captions, stickers, quoted replies, and LID PN alt JIDs', () => {
    const groupText = mapBaileysMessage({
      userId: 'u1',
      groupName: 'طلبات البحرين السريعة',
      msg: {
        key: {
          remoteJid: '120363000111222@g.us',
          id: 'MSG_TEXT_1',
          participant: '1234567890@lid',
          participantAlt: '97339112233@s.whatsapp.net',
          fromMe: false,
        },
        pushName: 'مطعم النخيل',
        messageTimestamp: 1760000000,
        message: { conversation: 'مطلوب مندوب من المنامة الى الرفاع 2.5 دينار' },
      },
    });

    assert.equal(groupText.kind, 'group_message');
    assert.equal(groupText.groupEvent?.groupJid, '120363000111222@g.us');
    assert.equal(groupText.groupEvent?.senderJid, '97339112233@s.whatsapp.net');
    assert.equal(groupText.groupEvent?.senderPhone, '97339112233');
    assert.equal(groupText.groupEvent?.messageType, 'text');
    assert.equal(groupText.groupEvent?.isPrivateChat, false);

    const stickerReply = mapBaileysMessage({
      userId: 'u1',
      groupName: 'طلبات البحرين السريعة',
      msg: {
        key: {
          remoteJid: '120363000111222@g.us',
          id: 'MSG_STICKER_2',
          participant: '97339112233@s.whatsapp.net',
          fromMe: false,
        },
        pushName: 'مطعم النخيل',
        messageTimestamp: 1760000050,
        message: {
          stickerMessage: {
            contextInfo: {
              stanzaId: 'MSG_TEXT_1',
              participant: '97339112233@s.whatsapp.net',
              quotedMessage: { conversation: 'مطلوب مندوب من المنامة الى الرفاع 2.5 دينار' },
            },
          },
        },
      },
    });

    assert.equal(stickerReply.kind, 'group_message');
    assert.equal(stickerReply.groupEvent?.isSticker, true);
    assert.equal(stickerReply.groupEvent?.quotedStanzaId, 'MSG_TEXT_1');
    assert.equal(stickerReply.groupEvent?.quotedText, 'مطلوب مندوب من المنامة الى الرفاع 2.5 دينار');

    const imgMsg = mapBaileysMessage({
      userId: 'u1',
      groupName: 'طلبات البحرين',
      msg: {
        key: { remoteJid: '120363000111222@g.us', id: 'MSG_IMG_3', participant: '97336665544@s.whatsapp.net' },
        messageTimestamp: 1760000090,
        message: { imageMessage: { caption: 'طلب من سترة إلى المحرق ٣ دينار' } },
      },
    });
    assert.equal(imgMsg.kind, 'group_message');
    assert.equal(imgMsg.groupEvent?.isImage, true);
    assert.equal(imgMsg.groupEvent?.rawText, 'طلب من سترة إلى المحرق ٣ دينار');
  });

  test('Strictly isolates 1-on-1 private chats so they never enter group order pipeline', () => {
    const priv = mapBaileysMessage({
      userId: 'u1',
      msg: {
        key: {
          remoteJid: '97339445566@s.whatsapp.net',
          id: 'PRIV_1',
          fromMe: false,
        },
        pushName: 'أم محمد',
        messageTimestamp: 1760000100,
        message: { conversation: 'تم الطلب لك تفضل رقم الزبون 33112233' },
      },
    });

    assert.equal(priv.kind, 'private_reply');
    assert.equal(priv.groupEvent, undefined);
    assert.equal(priv.privateEvent?.isPrivateChat, true);
    assert.equal(priv.privateEvent?.ignoredForOrderExtraction, true);
    assert.equal(priv.privateEvent?.senderPhone, '97339445566');

    const status = mapBaileysMessage({
      userId: 'u1',
      msg: {
        key: { remoteJid: 'status@broadcast', id: 'ST_1' },
        message: { conversation: 'status post' },
      },
    });
    assert.equal(status.kind, 'ignored');
    assert.equal(extractPhoneFromJid('12345@lid'), '');
  });

  test('Deduper prevents duplicate events across reconnect replays', () => {
    const deduper = new BridgeMessageDeduper(3);
    assert.equal(deduper.markSeen('120@g.us:m1'), true);
    assert.equal(deduper.markSeen('120@g.us:m1'), false);
    assert.equal(deduper.markSeen('120@g.us:m2'), true);
    assert.equal(deduper.markSeen('120@g.us:m3'), true);
    assert.equal(deduper.markSeen('120@g.us:m4'), true);
    assert.equal(deduper.hasSeen('120@g.us:m1'), false, 'Oldest entry evicted cleanly after capacity');
  });
});

describe('WhatsAppBridgeSupervisor State Machine, Worker Isolation & Verified Outreach', () => {
  test('Pairing Code flow: never Connected prematurely, isolates users, handles crashes & Session Expired', async () => {
    const stateDir = createTempDir('orderi-sup-');
    const workers = new Map<string, MockBridgeWorker>();
    const expiredUsers: string[] = [];

    const supervisor = new WhatsAppBridgeSupervisor({
      stateDir,
      workerFactory: (userId) => {
        const w = new MockBridgeWorker();
        workers.set(userId, w);
        return w;
      },
      events: {
        onSessionExpired: (userId) => expiredUsers.push(userId),
      },
    });

    // Reject invalid short phone
    const badStatus = supervisor.startPairing('user-A', '123');
    assert.equal(badStatus.state, 'Error');
    assert.equal(badStatus.errorCode, 'INVALID_PHONE_NUMBER');

    // Valid connect starts Connecting (must NOT be Connected yet!)
    const connecting = supervisor.startPairing('user-A', '973 3912-3456');
    assert.equal(connecting.state, 'Connecting');
    assert.equal(connecting.phoneNumber, '97339123456');
    assert.equal(supervisor.getStatus('user-B').state, 'Disconnected', 'user-B must remain completely isolated');

    const workerA = workers.get('user-A')!;
    assert.equal(workerA.sentCommands[0]?.type, 'INIT_AND_START');
    assert.equal((workerA.sentCommands[0] as any).phoneNumber, '97339123456');

    // Worker issues Pairing Code
    workerA.emitWorkerMessage({
      type: 'STATE_UPDATE',
      userId: 'user-A',
      state: 'Waiting for Pairing',
      pairingCode: 'ABCD-1234',
      pairingCodeExpiresAt: new Date(Date.now() + 180_000).toISOString(),
    });
    assert.equal(supervisor.getStatus('user-A').state, 'Waiting for Pairing');
    assert.equal(supervisor.getStatus('user-A').pairingCode, 'ABCD-1234');

    // Worker confirms real WhatsApp Web open
    workerA.emitWorkerMessage({
      type: 'STATE_UPDATE',
      userId: 'user-A',
      state: 'Connected',
      pairingCode: null,
      connectedJid: '97339123456@s.whatsapp.net',
    });
    assert.equal(supervisor.getStatus('user-A').state, 'Connected');

    // Worker crash must NOT crash host and must move to Reconnecting
    workerA.emitCrash(1);
    assert.equal(supervisor.getStatus('user-A').state, 'Reconnecting');

    // Re-attach and expire session
    supervisor.resumeSession('user-A');
    const workerA2 = workers.get('user-A')!;
    workerA2.emitWorkerMessage({ type: 'SESSION_EXPIRED', userId: 'user-A', reason: 'loggedOut 401' });
    assert.equal(supervisor.getStatus('user-A').state, 'Session Expired');
    assert.deepEqual(expiredUsers, ['user-A']);

    // Persistence check on supervisor restart
    const supervisor2 = new WhatsAppBridgeSupervisor({
      stateDir,
      workerFactory: (userId) => {
        const w = new MockBridgeWorker();
        workers.set(userId, w);
        return w;
      },
    });
    assert.equal(supervisor2.getStatus('user-A').phoneNumber, '97339123456');

    supervisor.shutdownAll();
    supervisor2.shutdownAll();
  });

  test('Repeated pairing request preserves an active or reconnecting worker', () => {
    const stateDir = createTempDir('orderi-preserve-worker-');
    const workers: MockBridgeWorker[] = [];
    const supervisor = new WhatsAppBridgeSupervisor({
      stateDir,
      workerFactory: () => {
        const worker = new MockBridgeWorker();
        workers.push(worker);
        return worker;
      },
    });

    supervisor.startPairing('user-preserve', '97339123456');
    const originalWorker = workers[0];
    originalWorker.emitWorkerMessage({
      type: 'STATE_UPDATE',
      userId: 'user-preserve',
      state: 'Connected',
      connectedJid: '97339123456@s.whatsapp.net',
    });

    const connectedResult = supervisor.startPairing('user-preserve', '97339123456');
    assert.equal(connectedResult.state, 'Connected');
    assert.equal(originalWorker.killed, false);
    assert.equal(workers.length, 1, 'A second worker must not replace a live WhatsApp socket');

    originalWorker.emitWorkerMessage({
      type: 'STATE_UPDATE',
      userId: 'user-preserve',
      state: 'Reconnecting',
      errorCode: 'WA_408',
    });
    const reconnectingResult = supervisor.startPairing('user-preserve', '97339123456');
    assert.equal(reconnectingResult.state, 'Reconnecting');
    assert.equal(originalWorker.killed, false);
    assert.equal(workers.length, 1, 'A transient disconnect must not trigger a new pairing worker');

    supervisor.shutdownAll();
  });

  test('Verified private messaging: blocks display-name-only send and enforces idempotency', async () => {
    const stateDir = createTempDir('orderi-outreach-sup-');
    const workers = new Map<string, MockBridgeWorker>();

    const supervisor = new WhatsAppBridgeSupervisor({
      stateDir,
      workerFactory: (userId) => {
        const w = new MockBridgeWorker();
        workers.set(userId, w);
        return w;
      },
    });

    supervisor.startPairing('user-send', '97339001122');
    const worker = workers.get('user-send')!;
    worker.emitWorkerMessage({
      type: 'STATE_UPDATE',
      userId: 'user-send',
      state: 'Connected',
      connectedJid: '97339001122@s.whatsapp.net',
    });

    // Block unverified display name without JID/phone
    const denied = await supervisor.sendPrivateMessage('user-send', {
      orderId: 'ord-no-id',
      operationId: 'op-no-id',
      originalSenderName: 'متجر بدون رقم',
      message: 'أنا جاهز للتوصيل',
    });
    assert.equal(denied.success, false);
    assert.equal(denied.errorCode, 'IDENTITY_NOT_VERIFIED');

    // Verified JID send
    const sendPromise = supervisor.sendPrivateMessage('user-send', {
      orderId: 'ord-verified-1',
      operationId: 'op-verified-1',
      targetJid: '97339887766@s.whatsapp.net',
      senderPhone: '97339887766',
      groupJid: '120363000111222@g.us',
      originalMessageId: 'WA_ORIG_1',
      originalSenderName: 'مطبخ الذواقة',
      message: '#مندوب_توصيل انا في المنامة ومستعد للاستلام فوراً',
    });

    const sentCmd = worker.sentCommands.find((c) => c.type === 'SEND_PRIVATE_MESSAGE') as
      | Extract<SupervisorToWorkerMessage, { type: 'SEND_PRIVATE_MESSAGE' }>
      | undefined;
    assert.ok(sentCmd);

    worker.emitWorkerMessage({
      type: 'SEND_RESULT',
      userId: 'user-send',
      requestId: sentCmd!.requestId,
      result: {
        success: true,
        sentMessageId: 'BAE5_SENT_999',
        targetJid: '97339887766@s.whatsapp.net',
        timestamp: new Date().toISOString(),
      },
    });

    const res1 = await sendPromise;
    assert.equal(res1.success, true);
    assert.equal(res1.sentMessageId, 'BAE5_SENT_999');

    // Retry for same orderId with different operationId must return alreadySent without hitting worker again
    const sendCountBefore = worker.sentCommands.filter((c) => c.type === 'SEND_PRIVATE_MESSAGE').length;
    const res2 = await supervisor.sendPrivateMessage('user-send', {
      orderId: 'ord-verified-1',
      operationId: 'op-verified-retry-2',
      targetJid: '97339887766@s.whatsapp.net',
      message: 'duplicate',
    });
    const sendCountAfter = worker.sentCommands.filter((c) => c.type === 'SEND_PRIVATE_MESSAGE').length;
    assert.equal(res2.success, true);
    assert.equal(res2.alreadySent, true);
    assert.equal(res2.sentMessageId, 'BAE5_SENT_999');
    assert.equal(sendCountBefore, sendCountAfter);

    supervisor.shutdownAll();
  });
});

describe('Orderi Core Integration: Cross-Channel Dedup, Quoted Closure, & Private Outreach', () => {
  const baseFilter: OrderFilter = {
    coverageKm: 15,
    minimumPrice: 2,
    startAreas: [],
    destinations: [],
    startTime: '00:00',
    endTime: '23:59',
    notificationsEnabled: true,
    soundEnabled: true,
    soundVolume: 80,
    alertTone: 'chime',
    vibrationEnabled: false,
    vibrationIntensity: 1,
    vibrationPattern: 'standard',
    excellentAlertEnabled: true,
    ignoreNonMatching: false,
    allJoinedGroupsMode: true,
    selectedGroups: [],
    customResponseTemplate: '#مندوب_توصيل انا في {area}',
    contacts: [],
    autoBlockBlacklist: true,
    preventDuplicateOrders: true,
  };

  function makeSampleOrder(overrides: Partial<ParsedOrder>): ParsedOrder {
    return {
      id: 'ord-1',
      from: 'المنامة',
      to: 'الرفاع',
      price: 2.5,
      rawText: 'توصيل من المنامة إلى الرفاع 2.5 د.ب',
      groupName: 'قروب مناديب البحرين',
      senderName: 'مطبخ اللؤلؤة',
      senderPhone: '39112233',
      senderPhoneSource: 'notification_metadata',
      receivedAt: new Date(Date.now() - 30_000),
      confidence: 95,
      match: evaluateOrderMatch('المنامة', 'الرفاع', 2.5, baseFilter, null),
      type: 'whatsapp_bridge',
      notes: '',
      status: 'pending',
      source: 'whatsapp_web_bridge',
      isDirectPrivate: false,
      ...overrides,
    };
  }

  test('Cross-channel deduplication matches NotificationListener and Bridge orders accurately', () => {
    const notifOrder = makeSampleOrder({
      id: 'android-wa-100',
      source: 'android_notification',
      sourceMessageId: 'WA_SHARED_MSG_77',
    });
    const bridgeOrder = makeSampleOrder({
      id: 'bridge-wa-100',
      source: 'whatsapp_web_bridge',
      bridgeMessageId: 'WA_SHARED_MSG_77',
      bridgeParticipantJid: '97339112233@s.whatsapp.net',
    });

    const dup = findDuplicateOrderMatch(bridgeOrder, [notifOrder]);
    assert.ok(dup);
    assert.equal(dup?.id, 'android-wa-100');
  });

  test('Closure detector uses quotedStanzaId & senderJid strictly and ignores unrelated advertisers or private chats', () => {
    const orderA = makeSampleOrder({
      id: 'ord-adv-A',
      senderName: 'مطبخ اللؤلؤة',
      senderPhone: '39112233',
      bridgeGroupJid: '1203630001@g.us',
      bridgeParticipantJid: '97339112233@s.whatsapp.net',
      bridgeMessageId: 'MSG_A_1',
    });
    const orderB = makeSampleOrder({
      id: 'ord-adv-B',
      from: 'المحرق',
      to: 'سترة',
      senderName: 'متجر آخر',
      senderPhone: '36445566',
      bridgeGroupJid: '1203630001@g.us',
      bridgeParticipantJid: '97336445566@s.whatsapp.net',
      bridgeMessageId: 'MSG_B_1',
    });

    // Private 1-on-1 "تم" must NEVER close group order
    const privateClosureAttempt = checkIncomingMessageForClosure(
      {
        text: 'تم حصلت',
        senderName: 'مطبخ اللؤلؤة',
        senderPhone: '39112233',
        groupName: 'محادثة خاصة 👤',
        timestamp: Date.now(),
        isGroup: false,
        isDirectPrivate: true,
      },
      [orderA, orderB]
    );
    assert.equal(privateClosureAttempt, null);

    // Different advertiser C saying "تم" without quoting orderA must NOT close orderA
    const strangerClosureAttempt = checkIncomingMessageForClosure(
      {
        text: 'تم',
        senderName: 'معلن غريب',
        senderJid: '97333000999@s.whatsapp.net',
        groupJid: '1203630001@g.us',
        groupName: 'قروب مناديب البحرين',
        timestamp: Date.now(),
        isGroup: true,
        isDirectPrivate: false,
      },
      [orderA, orderB]
    );
    assert.equal(strangerClosureAttempt, null);

    // Advertiser A replying with sticker quoting MSG_A_1 closes ONLY orderA
    const validClosure = checkIncomingMessageForClosure(
      {
        text: '[sticker]',
        senderName: 'مطبخ اللؤلؤة',
        senderJid: '97339112233@s.whatsapp.net',
        senderPhone: '97339112233',
        groupJid: '1203630001@g.us',
        groupName: 'قروب مناديب البحرين',
        quotedStanzaId: 'MSG_A_1',
        messageId: 'MSG_CLOSE_1',
        timestamp: Date.now(),
        isGroup: true,
        isDirectPrivate: false,
        isSticker: true,
      },
      [orderA, orderB]
    );
    assert.ok(validClosure);
    assert.equal(validClosure?.orderId, 'ord-adv-A');
    assert.equal(validClosure?.verdict, 'confirmed_closed');
  });

  test('executePrivateAdvertiserOutreach routes through Bridge with verified JID and returns sentMessageId', async () => {
    const order = makeSampleOrder({
      id: 'ord-send-via-bridge-1',
      bridgeGroupJid: '1203630001@g.us',
      bridgeParticipantJid: '97339112233@s.whatsapp.net',
      bridgeMessageId: 'MSG_ORIG_55',
    });

    let capturedTarget = '';
    const mockAdapter: BridgeOutreachAdapter = {
      isConnected: () => true,
      sendPrivateMessage: async (params) => {
        capturedTarget = params.targetJid || '';
        return {
          success: true,
          sentMessageId: 'BAE5_ACK_55',
          targetJid: params.targetJid,
          timestamp: new Date().toISOString(),
        };
      },
    };

    const result = await executePrivateAdvertiserOutreach(
      order,
      '#مندوب_توصيل انا في {area} وجاهز',
      'المنامة',
      {
        autoSend: true,
        backgroundOnly: true,
        useBridge: true,
        bridgeOutreach: mockAdapter,
        latestOrders: [order],
        nativeBridge: {
          isNativeAndroid: () => false,
          getPrivateOutreachStatus: async () => ({
            status: 'NOT_ATTEMPTED',
          }),
          reachAdvertiserPrivateChat: async () => ({ success: false, method: 'none', status: 'BACKGROUND_SEND_UNAVAILABLE', message: 'N/A' }),
          openWhatsAppPrivateConversation: async () => ({ success: false, method: 'none' }),
        },
      }
    );

    assert.equal(result.success, true);
    assert.equal(result.deliveryMethod, 'whatsapp_web_bridge');
    assert.equal(result.sentMessageId, 'BAE5_ACK_55');
    assert.equal(capturedTarget, '97339112233@s.whatsapp.net');
  });
});


test('Bridge token issuance requires a verified Orderi session and rejects userId spoofing', async () => {
  const secret = 'bridge-test-secret-with-at-least-32-bytes';
  const supervisor = new WhatsAppBridgeSupervisor({
    stateDir: createTempDir('orderi-bridge-auth-'),
    masterSecret: secret,
    workerFactory: () => {
      throw new Error('Worker must not start during authentication test');
    },
  });
  const app = express();
  app.use(express.json());
  app.use('/api/bridge', createBridgeRouter(supervisor, async (req) => {
    return req.headers.authorization === 'Bearer valid-orderi-session'
      ? 'captain-real'
      : null;
  }));
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const unauthorized = await fetch(`${origin}/api/bridge/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'captain-victim' }),
    });
    assert.equal(unauthorized.status, 401);

    const spoofed = await fetch(`${origin}/api/bridge/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-orderi-session',
      },
      body: JSON.stringify({ userId: 'captain-victim' }),
    });
    assert.equal(spoofed.status, 403);

    const accepted = await fetch(`${origin}/api/bridge/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-orderi-session',
      },
      body: JSON.stringify({ userId: 'captain-real' }),
    });
    assert.equal(accepted.status, 200);
    const payload = await accepted.json() as { bridgeToken: string; userId: string };
    assert.equal(payload.userId, 'captain-real');
    assert.equal(verifyBridgeToken(payload.bridgeToken, secret).userId, 'captain-real');
  } finally {
    supervisor.shutdownAll();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    });
  }
});
