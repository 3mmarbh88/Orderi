import {
  OrderFilter,
  OutreachDeliveryStatus,
  ParsedOrder,
  WhatsAppExecutionState,
} from '../types';
import { MatcherLocation } from './matcher';

export const WHATSAPP_EXECUTION_STATES: readonly WhatsAppExecutionState[] = [
  'PENDING',
  'IDENTIFYING_SENDER',
  'LOCATING_ORIGINAL_MESSAGE',
  'OPENING_PRIVATE_CHAT',
  'VERIFYING_RECIPIENT',
  'READY_TO_SEND',
  'EXECUTING',
  'SENT',
  'FAILED',
  'IDENTITY_NOT_CONFIRMED',
  'SEND_RESULT_UNKNOWN',
  'NEEDS_USER_INTERACTION',
] as const;

export const TERMINAL_EXECUTION_STATES = new Set<WhatsAppExecutionState>([
  'SENT',
  'FAILED',
  'IDENTITY_NOT_CONFIRMED',
  'SEND_RESULT_UNKNOWN',
  'NEEDS_USER_INTERACTION',
]);

export interface ExecutionLockEntry {
  operationId: string;
  lockKey: string;
  state: WhatsAppExecutionState;
  retryBlocked: boolean;
  sentVerifiedInUi: boolean;
  updatedAt: number;
}

const inFlightOperationLocks = new Map<string, ExecutionLockEntry>();
const sendResultUnknownLocks = new Set<string>();
const LOCK_STALE_TIMEOUT_MS = 35_000;
const STALE_PRESEND_TAKEOVER_MS = 12_000;

export function createOutreachOperationId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `op-${Date.now()}-${rand}`;
}

export function buildExecutionLockKey(order: Pick<ParsedOrder, 'id' | 'originalMessageRef' | 'rawText' | 'sourceMessageTimestamp'>): string {
  const orderId = (order.id || '').trim();
  const ref = (order.originalMessageRef || `${(order.rawText || '').trim().slice(0, 64)}@${order.sourceMessageTimestamp || 0}`).trim();
  return `${orderId}::${ref}`;
}

export function isSendRetryBlocked(order: Pick<ParsedOrder, 'id' | 'originalMessageRef' | 'rawText' | 'sourceMessageTimestamp'>): boolean {
  return sendResultUnknownLocks.has(buildExecutionLockKey(order));
}

export function clearExecutionLocksForTesting(): void {
  inFlightOperationLocks.clear();
  sendResultUnknownLocks.clear();
}

export function acquireExecutionLock(
  order: Pick<ParsedOrder, 'id' | 'originalMessageRef' | 'rawText' | 'sourceMessageTimestamp'>,
  operationId?: string,
  allowTakeoverOfStalePreSend = false,
): { acquired: true; entry: ExecutionLockEntry } | { acquired: false; reason: 'SEND_RESULT_UNKNOWN' | 'IN_FLIGHT'; existing?: ExecutionLockEntry } {
  const lockKey = buildExecutionLockKey(order);

  if (sendResultUnknownLocks.has(lockKey)) {
    return {
      acquired: false,
      reason: 'SEND_RESULT_UNKNOWN',
      existing: inFlightOperationLocks.get(lockKey),
    };
  }

  const existing = inFlightOperationLocks.get(lockKey);
  if (existing && !TERMINAL_EXECUTION_STATES.has(existing.state)) {
    const age = Date.now() - existing.updatedAt;
    if (age < LOCK_STALE_TIMEOUT_MS) {
      const isExecutingOrReady = existing.state === 'EXECUTING' || existing.state === 'READY_TO_SEND';
      const canSupersede = allowTakeoverOfStalePreSend && !isExecutingOrReady && age >= STALE_PRESEND_TAKEOVER_MS;
      if (!canSupersede) {
        return {
          acquired: false,
          reason: 'IN_FLIGHT',
          existing,
        };
      }
    }
  }

  const entry: ExecutionLockEntry = {
    operationId: operationId || createOutreachOperationId(),
    lockKey,
    state: 'PENDING',
    retryBlocked: false,
    sentVerifiedInUi: false,
    updatedAt: Date.now(),
  };
  inFlightOperationLocks.set(lockKey, entry);
  return { acquired: true, entry };
}

export function transitionExecutionLock(
  lockKey: string,
  operationId: string,
  nextState: WhatsAppExecutionState,
  sentVerifiedInUi = false,
): void {
  const entry = inFlightOperationLocks.get(lockKey);
  if (!entry || entry.operationId !== operationId) return;
  entry.state = nextState;
  entry.updatedAt = Date.now();
  if (sentVerifiedInUi) {
    entry.sentVerifiedInUi = true;
  }
  if (nextState === 'SEND_RESULT_UNKNOWN') {
    entry.retryBlocked = true;
    sendResultUnknownLocks.add(lockKey);
  }
}

export function isOrderClosedBeforeSend(order: ParsedOrder, latestOrders?: ParsedOrder[]): {
  closed: boolean;
  reason?: string;
} {
  const live = latestOrders?.find((o) => o.id === order.id) || order;
  if (live.status === 'closed_taken') {
    return {
      closed: true,
      reason: live.closureEvidence?.replyText
        ? `تم إغلاق هذا الطلب للتو في القروب («${live.closureEvidence.replyText}»)`
        : 'تم أخذ وإغلاق هذا الطلب قبل إرسال الرسالة؛ أوقفنا الإرسال تلقائياً.',
    };
  }
  return { closed: false };
}

export function mapExecutionStateToOutreachStatus(state: WhatsAppExecutionState): OutreachDeliveryStatus {
  switch (state) {
    case 'PENDING':
    case 'IDENTIFYING_SENDER':
      return 'IDENTIFYING_ADVERTISER';
    case 'LOCATING_ORIGINAL_MESSAGE':
      return 'ADVERTISER_VERIFIED';
    case 'OPENING_PRIVATE_CHAT':
    case 'VERIFYING_RECIPIENT':
      return 'PRIVATE_CHAT_RESOLVED';
    case 'READY_TO_SEND':
    case 'EXECUTING':
      return 'BACKGROUND_SEND_READY';
    case 'SENT':
      return 'MESSAGE_SUBMITTED';
    case 'IDENTITY_NOT_CONFIRMED':
      return 'IDENTITY_NOT_VERIFIED';
    case 'NEEDS_USER_INTERACTION':
      return 'BACKGROUND_SEND_UNAVAILABLE';
    case 'SEND_RESULT_UNKNOWN':
      return 'SEND_RESULT_UNKNOWN';
    case 'FAILED':
    default:
      return 'SEND_FAILED';
  }
}

export function getExecutionStateArabicLabel(state: WhatsAppExecutionState): string {
  switch (state) {
    case 'PENDING':
      return 'بانتظار بدء التنفيذ...';
    case 'IDENTIFYING_SENDER':
      return 'جاري تحديد هوية صاحب الإعلان...';
    case 'LOCATING_ORIGINAL_MESSAGE':
      return 'جاري تحديد صف الرسالة الأصلية في المجموعة...';
    case 'OPENING_PRIVATE_CHAT':
      return 'جاري فتح المحادثة الخاصة للمعلن...';
    case 'VERIFYING_RECIPIENT':
      return 'جاري التحقق من تطابق هوية المستلم...';
    case 'READY_TO_SEND':
      return 'المحادثة الخاصة جاهزة للإرسال...';
    case 'EXECUTING':
      return 'جاري إرسال رسالة القبول عبر واتساب العادي...';
    case 'SENT':
      return 'تم الإرسال عبر واتساب العادي (حالة التسليم والقراءة تعتمد على واتساب) ✓';
    case 'IDENTITY_NOT_CONFIRMED':
      return 'تعذر الجزم بهوية صاحب الإعلان الأصلي ⚠️';
    case 'SEND_RESULT_UNKNOWN':
      return 'تعذر الجزم بنتيجة الإرسال — ممنوع التكرار التلقائي ⚠️';
    case 'NEEDS_USER_INTERACTION':
      return 'يتطلب تدخل المستخدم لإتمام التواصل';
    case 'FAILED':
    default:
      return 'فشل إرسال الرسالة الخاصة ❌';
  }
}

/**
 * Privacy guard for Section 11:
 * Strips all advertiser PII (senderName, senderPhone, senderIdentityKey, senderUri)
 * before sending order route/price text to Gemini AI.
 */
export function buildSafeAiEvaluatePayload(
  order: ParsedOrder,
  driverLocation: MatcherLocation | null,
  filter: OrderFilter,
) {
  return {
    rawText: order.rawText,
    groupName: order.groupName,
    from: order.from,
    to: order.to,
    price: order.price,
    driverLocation,
    filter,
  };
}
