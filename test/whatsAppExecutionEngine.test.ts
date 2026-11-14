import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WHATSAPP_EXECUTION_STATES,
  TERMINAL_EXECUTION_STATES,
  acquireExecutionLock,
  transitionExecutionLock,
  isSendRetryBlocked,
  isOrderClosedBeforeSend,
  mapExecutionStateToOutreachStatus,
  getExecutionStateArabicLabel,
  buildSafeAiEvaluatePayload,
  clearExecutionLocksForTesting,
} from '../src/utils/whatsAppExecutionEngine';
import {
  executePrivateAdvertiserOutreach,
  PrivateOutreachNativeBridge,
} from '../src/utils/whatsappPrivateOutreach';
import { buildOriginalMessageRef } from '../src/utils/originalMessageLocator';
import { OrderFilter, ParsedOrder } from '../src/types';

const memoryStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => memoryStore.set(k, String(v)),
  removeItem: (k: string) => memoryStore.delete(k),
  clear: () => memoryStore.clear(),
};

const baseOrder: ParsedOrder = {
  id: 'order-exec-1',
  rawText: 'طلب توصيل من المنامة إلى الرفاع 2.5 د.ب',
  from: 'المنامة',
  to: 'الرفاع',
  price: 2.5,
  senderName: '🚗',
  groupName: 'قروب توصيل البحرين',
  senderPhone: '',
  sourceMessageId: 'msg-native-7788',
  shortcutId: 'shortcut-group-1',
  sourceMessageTimestamp: 1763000120000,
  originalMessageRef: buildOriginalMessageRef('طلب توصيل من المنامة إلى الرفاع 2.5 د.ب', 1763000120000),
  receivedAt: new Date(1763000120000),
  confidence: 94,
  type: 'whatsapp_notification',
  status: 'pending',
  match: {
    score: 92,
    startMatched: true,
    destinationMatched: true,
    priceMatched: true,
    distanceMatched: true,
    timeMatched: true,
    distanceKm: 3.2,
    statusLabel: 'طلب ممتاز',
    statusColor: 'emerald',
  },
};

test('12 canonical execution states and Arabic labels are complete', () => {
  assert.equal(WHATSAPP_EXECUTION_STATES.length, 12);
  for (const state of WHATSAPP_EXECUTION_STATES) {
    assert.ok(getExecutionStateArabicLabel(state).length > 3);
    assert.ok(mapExecutionStateToOutreachStatus(state).length > 3);
  }
  assert.equal(TERMINAL_EXECUTION_STATES.has('SENT'), true);
  assert.equal(TERMINAL_EXECUTION_STATES.has('SEND_RESULT_UNKNOWN'), true);
  assert.equal(TERMINAL_EXECUTION_STATES.has('NEEDS_USER_INTERACTION'), true);
});

test('concurrency lock prevents double-execution in flight and allows retry after terminal FAILED', () => {
  clearExecutionLocksForTesting();
  const lock1 = acquireExecutionLock(baseOrder, 'op-1');
  assert.equal(lock1.acquired, true);

  const lock2 = acquireExecutionLock(baseOrder, 'op-2');
  assert.equal(lock2.acquired, false);
  if ('reason' in lock2) {
    assert.equal(lock2.reason, 'IN_FLIGHT');
  }

  if (lock1.acquired && 'entry' in lock1) {
    transitionExecutionLock(lock1.entry.lockKey, 'op-1', 'FAILED');
  }
  const lock3 = acquireExecutionLock(baseOrder, 'op-3');
  assert.equal(lock3.acquired, true);
});

test('SEND_RESULT_UNKNOWN permanently blocks duplicate retries for that order', async () => {
  clearExecutionLocksForTesting();
  const lock = acquireExecutionLock({ ...baseOrder, id: 'order-unknown-lock' }, 'op-u1');
  assert.equal(lock.acquired, true);
  if (lock.acquired) {
    transitionExecutionLock(lock.entry.lockKey, 'op-u1', 'SEND_RESULT_UNKNOWN');
  }
  assert.equal(isSendRetryBlocked({ ...baseOrder, id: 'order-unknown-lock' }), true);

  let bridgeCalled = false;
  const mockBridge: PrivateOutreachNativeBridge = {
    isNativeAndroid: () => true,
    reachAdvertiserPrivateChat: async () => {
      bridgeCalled = true;
      return { success: true, method: 'mock' };
    },
  };

  const res = await executePrivateAdvertiserOutreach(
    { ...baseOrder, id: 'order-unknown-lock' },
    'موافق',
    'المنامة',
    { autoSend: true, backgroundOnly: true, allowUiFallback: false, nativeBridge: mockBridge },
  );
  assert.equal(bridgeCalled, false);
  assert.equal(res.success, false);
  assert.equal(res.status, 'SEND_RESULT_UNKNOWN');
  assert.equal(res.executionState, 'SEND_RESULT_UNKNOWN');
  assert.equal(res.retryBlocked, true);
});

test('pre-send closure guard aborts outreach before touching WhatsApp', async () => {
  clearExecutionLocksForTesting();
  let bridgeCalled = false;
  const mockBridge: PrivateOutreachNativeBridge = {
    isNativeAndroid: () => true,
    reachAdvertiserPrivateChat: async () => {
      bridgeCalled = true;
      return { success: true, method: 'mock' };
    },
  };

  const liveClosedOrder: ParsedOrder = {
    ...baseOrder,
    id: 'order-closed-pre-send',
    status: 'closed_taken',
    closureEvidence: {
      replyText: 'تم خذيته',
      senderName: 'مندوب آخر',
      groupName: baseOrder.groupName,
      timestamp: new Date().toISOString(),
      confidence: 99,
      isQuote: true,
      matchedKeywords: ['تم'],
    },
  };

  const check = isOrderClosedBeforeSend(baseOrder, [liveClosedOrder]);
  assert.equal(check.closed, false);
  const closedCheck = isOrderClosedBeforeSend({ ...baseOrder, id: 'order-closed-pre-send' }, [liveClosedOrder]);
  assert.equal(closedCheck.closed, true);

  const res = await executePrivateAdvertiserOutreach(
    { ...baseOrder, id: 'order-closed-pre-send' },
    'موافق',
    'المنامة',
    {
      autoSend: true,
      backgroundOnly: false,
      allowUiFallback: true,
      latestOrders: [liveClosedOrder],
      nativeBridge: mockBridge,
    },
  );
  assert.equal(bridgeCalled, false);
  assert.equal(res.success, false);
  assert.equal(res.reasonCode, 'order_closed_before_send');
});

test('async Accessibility outreach polls to SENT with sentVerifiedInUi=true and distinguishes Sent vs Delivered', async () => {
  clearExecutionLocksForTesting();
  let capturedPayload: any = null;
  let pollCount = 0;

  const asyncBridge: PrivateOutreachNativeBridge = {
    isNativeAndroid: () => true,
    reachAdvertiserPrivateChat: async (opts) => {
      capturedPayload = opts;
      return {
        success: true,
        submitted: true,
        asyncPending: true,
        operationId: opts.operationId,
        executionState: 'LOCATING_ORIGINAL_MESSAGE',
        status: 'MESSAGE_SUBMITTED',
        method: 'accessibility_reply_privately',
      };
    },
    getPrivateOutreachStatus: async () => {
      pollCount++;
      if (pollCount === 1) {
        return {
          operationId: capturedPayload.operationId,
          executionState: 'VERIFYING_RECIPIENT',
          status: 'sending',
        };
      }
      return {
        operationId: capturedPayload.operationId,
        executionState: 'SENT',
        status: 'MESSAGE_SUBMITTED',
        sentVerifiedInUi: true,
        deliveryConfirmed: false,
        statusLabel: 'تم إرسال رسالة القبول عبر واتساب العادي (ظهور الرسالة مؤكد؛ حالة التسليم تعتمد على واتساب) ✓',
      };
    },
  };

  const observedStates: string[] = [];
  const emojiOrder: ParsedOrder = {
    ...baseOrder,
    id: 'order-async-emoji',
    senderName: '🚗',
  };

  const res = await executePrivateAdvertiserOutreach(emojiOrder, 'تم قبول {from} -> {to}', 'المنامة', {
    autoSend: true,
    backgroundOnly: false,
    allowUiFallback: true,
    nativeBridge: asyncBridge,
    onExecutionStateProgress: (state) => observedStates.push(state),
  });

  assert.equal(res.success, true);
  assert.equal(res.executionState, 'SENT');
  assert.equal(res.sentVerifiedInUi, true);
  assert.equal(res.deliveryReceiptStatus, 'sent_only');
  assert.equal(capturedPayload.sourceMessageId, 'msg-native-7788');
  assert.equal(capturedPayload.shortcutId, 'shortcut-group-1');
  assert.equal(capturedPayload.memberName, '🚗');
  assert.ok(observedStates.includes('VERIFYING_RECIPIENT'));
  assert.ok(observedStates.includes('SENT'));
});

test('async Accessibility timeout resolves to SEND_RESULT_UNKNOWN and locks retries', async () => {
  clearExecutionLocksForTesting();
  const timeoutOrder: ParsedOrder = {
    ...baseOrder,
    id: 'order-async-timeout',
    senderName: 'Express Courier',
  };

  const hangingBridge: PrivateOutreachNativeBridge = {
    isNativeAndroid: () => true,
    reachAdvertiserPrivateChat: async (opts) => ({
      success: true,
      submitted: true,
      asyncPending: true,
      operationId: opts.operationId,
      executionState: 'OPENING_PRIVATE_CHAT',
      status: 'MESSAGE_SUBMITTED',
      method: 'accessibility_reply_privately',
    }),
    getPrivateOutreachStatus: async () => ({
      executionState: 'EXECUTING',
      status: 'sending',
    }),
  };

  const res = await executePrivateAdvertiserOutreach(timeoutOrder, 'موافق', 'المنامة', {
    autoSend: true,
    backgroundOnly: false,
    allowUiFallback: true,
    pollTimeoutMs: 50,
    nativeBridge: hangingBridge,
  });

  assert.equal(res.success, false);
  assert.equal(res.status, 'SEND_RESULT_UNKNOWN');
  assert.equal(res.executionState, 'SEND_RESULT_UNKNOWN');
  assert.equal(res.retryBlocked, true);
  assert.equal(isSendRetryBlocked(timeoutOrder), true);
});

test('Section 11 privacy sanitizer strips all advertiser PII before Gemini calls', () => {
  const piiOrder: ParsedOrder = {
    ...baseOrder,
    senderName: 'أبو علي للمفروشات',
    senderPhone: '97339991122',
    senderIdentityKey: '97339991122@s.whatsapp.net',
    senderUri: 'tel:+97339991122',
  };
  const filter: OrderFilter = {
    startAreas: ['المنامة'],
    destinations: ['الرفاع'],
    minimumPrice: 2,
    coverageKm: 10,
    startTime: '08:00',
    endTime: '23:00',
    notificationsEnabled: true,
    soundEnabled: true,
    soundVolume: 80,
    alertTone: 'radar_beep',
    vibrationEnabled: true,
    vibrationIntensity: 2,
    vibrationPattern: 'standard',
    excellentAlertEnabled: true,
    ignoreNonMatching: false,
    selectedGroups: [],
    customResponseTemplate: 'موافق',
    contacts: [],
  };

  const payload = buildSafeAiEvaluatePayload(piiOrder, null, filter) as Record<string, unknown>;
  assert.equal('senderName' in payload, false);
  assert.equal('senderPhone' in payload, false);
  assert.equal('senderIdentityKey' in payload, false);
  assert.equal('senderUri' in payload, false);
  assert.equal(payload.from, 'المنامة');
  assert.equal(payload.to, 'الرفاع');
});
