import { isNativeAndroid, OrderiNotificationListener } from './orderiNotificationListener';
import { orderiWhatsAppClient, WhatsAppClientDiagnostics } from './orderiWhatsAppClient';
export { orderiWhatsAppClient, type WhatsAppClientDiagnostics };

export async function getWhatsAppDiagnostics(): Promise<WhatsAppClientDiagnostics> {
  return await orderiWhatsAppClient.refreshDiagnostics();
}

export async function getWhatsAppListenerStatus(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const result = await OrderiNotificationListener.isEnabled();
    return !!result.enabled;
  } catch {
    return false;
  }
}

export interface SettingsOpenResult {
  success: boolean;
  isNative: boolean;
  reason?: 'web_environment' | 'intent_failed' | 'opened';
  errorMessage?: string;
}

export async function openWhatsAppListenerSettings(): Promise<SettingsOpenResult> {
  if (!isNativeAndroid()) {
    return {
      success: false,
      isNative: false,
      reason: 'web_environment',
      errorMessage: 'يلزم تشغيل Orderi كتطبيق APK أصلي على أندرويد لفتح إعدادات النظام مباشرة.'
    };
  }
  try {
    await OrderiNotificationListener.openSettings();
    return {
      success: true,
      isNative: true,
      reason: 'opened'
    };
  } catch (err: any) {
    return {
      success: false,
      isNative: true,
      reason: 'intent_failed',
      errorMessage: err?.message || String(err)
    };
  }
}

/**
 * Checks if there are active unread WhatsApp group notifications in the Android notification tray.
 * Strictly checks group messages; returns unread status and count.
 */
export async function checkHasUnreadWhatsAppNotifications(): Promise<{ hasUnread: boolean; unreadCount: number }> {
  if (!isNativeAndroid()) {
    return { hasUnread: false, unreadCount: 0 };
  }
  try {
    const res = await OrderiNotificationListener.hasUnreadNotifications();
    return {
      hasUnread: !!res?.hasUnread,
      unreadCount: res?.unreadCount || 0,
    };
  } catch (err) {
    console.warn('[Orderi] Could not check unread WhatsApp notifications:', err);
    return { hasUnread: false, unreadCount: 0 };
  }
}

export async function getWhatsAppAccessibilityStatus(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const result = await OrderiNotificationListener.isAccessibilityEnabled();
    return !!result.enabled;
  } catch {
    return false;
  }
}

export async function openWhatsAppAccessibilitySettings(): Promise<SettingsOpenResult> {
  if (!isNativeAndroid()) {
    return {
      success: false,
      isNative: false,
      reason: 'web_environment',
      errorMessage: 'يلزم تشغيل Orderi كتطبيق APK أصلي على أندرويد لفتح إعدادات إمكانية الوصول مباشرة.'
    };
  }
  try {
    await OrderiNotificationListener.openAccessibilitySettings();
    return {
      success: true,
      isNative: true,
      reason: 'opened'
    };
  } catch (err: any) {
    return {
      success: false,
      isNative: true,
      reason: 'intent_failed',
      errorMessage: err?.message || String(err)
    };
  }
}

export async function openWhatsAppGroupConversation(
  groupName: string,
  options?: { inviteLink?: string; rawText?: string }
): Promise<{ success: boolean; method: string }> {
  const name = (groupName || '').trim();
  if (isNativeAndroid()) {
    try {
      const res = await OrderiNotificationListener.openWhatsAppGroupConversation({ groupName: name });
      return res || { success: false, method: 'group_not_found' };
    } catch {
      return { success: false, method: 'group_open_failed' };
    }
  }

  // Check if an invite link was passed or exists in rawText
  let inviteUrl = options?.inviteLink;
  if (!inviteUrl && options?.rawText) {
    const inviteMatch = /chat\.whatsapp\.com\/([A-Za-z0-9_-]{18,30})/i.exec(options.rawText);
    if (inviteMatch) {
      inviteUrl = `https://chat.whatsapp.com/${inviteMatch[1]}`;
    }
  }

  if (inviteUrl && typeof window !== 'undefined') {
    try {
      window.open(inviteUrl, '_blank');
      return { success: true, method: 'whatsapp_group_invite' };
    } catch {
      window.location.href = inviteUrl;
      return { success: true, method: 'whatsapp_group_invite_location' };
    }
  }

  return { success: false, method: 'exact_group_link_unavailable' };
}

export async function openWhatsAppPrivateConversation(options: {
  phone?: string;
  memberName?: string;
  message?: string;
}): Promise<{ success: boolean; method: string }> {
  const phone = (options.phone || '').replace(/[^\d+]/g, '');
  const memberName = (options.memberName || '').trim();
  const message = (options.message || '').trim();

  if (isNativeAndroid()) {
    try {
      return await OrderiNotificationListener.openWhatsAppPrivateConversation({
        phone: phone || undefined,
        memberName: memberName || undefined,
      });
    } catch {
      return { success: false, method: 'private_chat_open_failed' };
    }
  }

  // Web fallback: if phone number is present, open wa.me link directly with optional message
  if (phone) {
    const cleanDigits = phone.replace(/\D/g, '');
    const bahrainPhone = cleanDigits.length === 8 ? `973${cleanDigits}` : cleanDigits;
    const textQuery = message ? `?text=${encodeURIComponent(message)}` : '';
    const waUrl = `https://wa.me/${bahrainPhone}${textQuery}`;
    if (typeof window !== 'undefined') {
      try {
        window.open(waUrl, '_blank');
        return { success: true, method: 'web_phone_link' };
      } catch {
        window.location.href = waUrl;
        return { success: true, method: 'web_location_link' };
      }
    }
  }

  return { success: false, method: 'exact_private_destination_unavailable' };
}

export async function sendNativeQuickReply(options: {
  groupName?: string;
  phone?: string;
  message: string;
}): Promise<{ success: boolean; method: string }> {
  if (!isNativeAndroid()) {
    return { success: false, method: 'not_native' };
  }
  try {
    return await OrderiNotificationListener.sendQuickReply(options);
  } catch (err: any) {
    return { success: false, method: 'error' };
  }
}

export async function reachNativeAdvertiserPrivateChat(options: {
  operationId?: string;
  orderId?: string;
  phone?: string;
  memberName?: string;
  senderIdentityKey?: string;
  senderUri?: string;
  sourceNotificationKey?: string;
  sourceMessageId?: string;
  shortcutId?: string;
  originalMessageRef?: string;
  sourceMessageTimestamp?: number;
  groupName?: string;
  sourceMessageText?: string;
  message: string;
  autoSend?: boolean;
  backgroundOnly?: boolean;
  allowUiFallback?: boolean;
}): Promise<{
  success: boolean;
  method: string;
  operationId?: string;
  executionState?: string;
  status?: string;
  reasonCode?: string;
  packageName?: string;
  deliveryConfirmed?: boolean;
  sentVerifiedInUi?: boolean;
  retryBlocked?: boolean;
  asyncPending?: boolean;
  statusLabel?: string;
  accessibilityRequired?: boolean;
  submitted?: boolean;
}> {
  if (!isNativeAndroid()) {
    return {
      success: false,
      method: 'not_native',
      status: 'BACKGROUND_SEND_UNAVAILABLE',
      executionState: 'NEEDS_USER_INTERACTION',
    };
  }
  try {
    return await OrderiNotificationListener.reachAdvertiserPrivateChat(options);
  } catch {
    return {
      success: false,
      method: 'error',
      status: 'SEND_FAILED',
      executionState: 'FAILED',
    };
  }
}

/**
 * Executes "Mark as Read" only for explicitly supplied, active WhatsApp groups.
 * Archived chats and unrelated private conversations are intentionally excluded.
 * Server bookkeeping is synchronized separately and is not treated as device-level read confirmation.
 */
export async function markAllWhatsAppAsRead(
  groupNames?: string[],
  options?: { includeArchived?: boolean }
): Promise<{ success: boolean; markedCount: number; archivedAutomationStarted?: boolean; accessibilityRequired?: boolean; whatsAppOpened?: boolean; archivedChatsVisited?: number }> {
  const explicitGroups = Array.from(new Set((groupNames || []).map((name) => (name || '').trim()).filter(Boolean)));
  const includeArchived = options?.includeArchived === true;
  let markedCount = 0;
  let archivedAutomationStarted = false;
  let accessibilityRequired = false;
  let whatsAppOpened = false;
  let nativeReadSucceeded = false;
  let archivedChatsVisited = 0;

  if (isNativeAndroid()) {
    try {
      const res = await OrderiNotificationListener.markAllAsRead({
        groupNames: explicitGroups,
        includeArchived,
      });
      markedCount = res.markedCount || 0;
      nativeReadSucceeded = !!res.success;
      archivedAutomationStarted = !!res.archivedAutomationStarted;
      accessibilityRequired = !!res.accessibilityRequired;
      whatsAppOpened = !!res.whatsAppOpened;
      archivedChatsVisited = res.archivedChatsVisited || 0;
    } catch (err) {
      console.warn('Native markAllAsRead error:', err);
    }
  }

  // Server bookkeeping is only safe for an explicit group list. Empty means
  // "all device groups" to the native notification listener, not a server-wide mutation.
  if (explicitGroups.length > 0) {
    try {
      await fetch('/api/whatsapp/mark-all-groups-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupNames: explicitGroups }),
      });
    } catch {}
  }

  return {
    success: nativeReadSucceeded || archivedAutomationStarted,
    markedCount,
    archivedAutomationStarted,
    accessibilityRequired,
    whatsAppOpened,
    archivedChatsVisited,
  };
}



/** Wait for the Android Accessibility sweep to finish; a started scan is not success. */
export async function waitForWhatsAppReadAllCompletion(timeoutMs = 300000): Promise<{
  status: 'completed' | 'partial' | 'timeout' | 'unavailable';
  visited: number;
  detail?: string;
}> {
  if (!isNativeAndroid()) return { status: 'unavailable', visited: 0, detail: 'يلزم تشغيل Orderi على أندرويد' };
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await OrderiNotificationListener.getReadAllStatus();
      if (result.status === 'completed' || result.status === 'partial') {
        return { status: result.status, visited: result.visited || 0, detail: result.detail || '' };
      }
    } catch {
      return { status: 'unavailable', visited: 0, detail: 'تعذر قراءة حالة خدمة واتساب' };
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  return { status: 'timeout', visited: 0, detail: 'لم يصل تأكيد اكتمال الفحص خلال المهلة' };
}



/** Wait for the native accessibility service to report an explicit terminal state. */
export async function getNativePrivateOutreachStatus(
  timeoutMs = 30000,
  expectedOperationId?: string,
): Promise<{
  operationId?: string;
  executionState?: string;
  status: string;
  statusLabel?: string;
  retryBlocked?: boolean;
  sentVerifiedInUi?: boolean;
  deliveryConfirmed?: boolean;
}> {
  if (!isNativeAndroid()) {
    return {
      status: 'BACKGROUND_SEND_UNAVAILABLE',
      executionState: 'NEEDS_USER_INTERACTION',
      statusLabel: 'يلزم أندرويد',
    };
  }
  const terminalExecutionStates = new Set([
    'SENT',
    'FAILED',
    'IDENTITY_NOT_CONFIRMED',
    'SEND_RESULT_UNKNOWN',
    'NEEDS_USER_INTERACTION',
  ]);
  const terminalStatuses = new Set([
    'MESSAGE_SUBMITTED',
    'DELIVERY_CONFIRMED',
    'IDENTITY_NOT_VERIFIED',
    'BACKGROUND_SEND_UNAVAILABLE',
    'SEND_RESULT_UNKNOWN',
    'SEND_FAILED',
    'PRIVATE_CHAT_RESOLVED',
    'SUBMITTED_UNCONFIRMED',
    'VERIFICATION_REQUIRED',
    'FAILED',
    'submitted_unconfirmed',
    'sent_confirmed',
    'submitted',
    'failed',
    'verification_required',
  ]);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await OrderiNotificationListener.getPrivateOutreachStatus();
      const opMatches = !expectedOperationId || !result?.operationId || result.operationId === expectedOperationId;
      if (
        result &&
        opMatches &&
        ((result.executionState && terminalExecutionStates.has(result.executionState)) ||
          terminalStatuses.has(result.status))
      ) {
        return result;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return {
    operationId: expectedOperationId,
    executionState: 'SEND_RESULT_UNKNOWN',
    status: 'SEND_RESULT_UNKNOWN',
    retryBlocked: true,
    statusLabel: 'انتهت مهلة انتظار نتيجة الإرسال؛ تعذر الجزم بالإرسال ومُنع التكرار التلقائي.',
  };
}
