import { isNativeAndroid, OrderiNotificationListener } from './orderiNotificationListener';

export async function getWhatsAppListenerStatus(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const result = await OrderiNotificationListener.isEnabled();
    return !!result.enabled;
  } catch {
    return false;
  }
}

export async function openWhatsAppListenerSettings(): Promise<void> {
  if (!isNativeAndroid()) return;
  await OrderiNotificationListener.openSettings();
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

export async function openWhatsAppAccessibilitySettings(): Promise<void> {
  if (!isNativeAndroid()) return;
  await OrderiNotificationListener.openAccessibilitySettings();
}

export async function openWhatsAppGroupConversation(groupName: string): Promise<{ success: boolean; method: string }> {
  const name = (groupName || '').trim();
  if (isNativeAndroid()) {
    try {
      const res = await OrderiNotificationListener.openWhatsAppGroupConversation({ groupName: name || 'واتساب' });
      if (res && res.success) return res;
    } catch {}
  }
  // Web fallback: open WhatsApp Web or app scheme
  if (typeof window !== 'undefined') {
    try {
      window.open('https://web.whatsapp.com', '_blank');
      return { success: true, method: 'web_whatsapp' };
    } catch {
      window.location.href = 'https://web.whatsapp.com';
      return { success: true, method: 'web_location' };
    }
  }
  return { success: false, method: 'not_supported' };
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
  phone?: string;
  memberName?: string;
  groupName?: string;
  message: string;
  autoSend?: boolean;
}): Promise<{ success: boolean; method: string }> {
  if (!isNativeAndroid()) {
    return { success: false, method: 'not_native' };
  }
  try {
    return await OrderiNotificationListener.reachAdvertiserPrivateChat(options);
  } catch (err: any) {
    return { success: false, method: 'error' };
  }
}

/**
 * Executes "Mark as Read" (تمييز كمقروء) across all connected WhatsApp groups and chats.
 * In Android Native: executes the native Notification.Action PendingIntents to mark WhatsApp chats as read on the device.
 * Also synchronizes and clears orders across the backend and client state.
 */
export async function markAllWhatsAppAsRead(
  groupNames?: string[],
  options?: { includeArchived?: boolean }
): Promise<{ success: boolean; markedCount: number; archivedAutomationStarted?: boolean; accessibilityRequired?: boolean; whatsAppOpened?: boolean }> {
  let markedCount = 0;
  let archivedAutomationStarted = false;
  let accessibilityRequired = false;
  let whatsAppOpened = false;

  if (isNativeAndroid()) {
    try {
      const res = await OrderiNotificationListener.markAllAsRead({
        groupNames: groupNames || [],
        includeArchived: options?.includeArchived !== false,
      });
      markedCount = res.markedCount || 0;
      archivedAutomationStarted = !!res.archivedAutomationStarted;
      accessibilityRequired = !!res.accessibilityRequired;
      whatsAppOpened = !!res.whatsAppOpened;
    } catch (err) {
      console.warn('Native markAllAsRead error:', err);
    }
  }

  // Keep server-side group bookkeeping in sync, but do not count server-cleared
  // records as WhatsApp chats actually marked read on the device.
  try {
    await fetch('/api/whatsapp/mark-all-groups-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupNames: groupNames || [] }),
    });
  } catch {}

  return {
    success: true,
    markedCount,
    archivedAutomationStarted,
    accessibilityRequired,
    whatsAppOpened,
  };
}




/** Wait for the native accessibility service to report the actual send-button action. */
export async function getNativePrivateOutreachStatus(timeoutMs = 30000): Promise<{ status: string; statusLabel?: string }> {
  if (!isNativeAndroid()) return { status: 'failed', statusLabel: 'يلزم أندرويد' };
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await OrderiNotificationListener.getPrivateOutreachStatus();
      if (result.status === 'sent_confirmed' || result.status === 'failed' || result.status === 'verification_required') {
        return result;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return { status: 'failed', statusLabel: 'انتهت مهلة انتظار تأكيد الإرسال' };
}
