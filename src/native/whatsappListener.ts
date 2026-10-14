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
  if (!isNativeAndroid()) {
    return { success: false, method: 'not_native' };
  }
  try {
    return await OrderiNotificationListener.openWhatsAppGroupConversation({ groupName });
  } catch {
    return { success: false, method: 'error' };
  }
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
export async function markAllWhatsAppAsRead(groupNames?: string[]): Promise<{ success: boolean; markedCount: number }> {
  let markedCount = 0;
  if (isNativeAndroid()) {
    try {
      const res = await OrderiNotificationListener.markAllAsRead({ groupNames: groupNames || [] });
      markedCount = res.markedCount || 0;
    } catch (err) {
      console.warn('Native markAllAsRead error:', err);
    }
  }

  // Also sync to backend server for webhook/session groups
  try {
    const resp = await fetch('/api/whatsapp/mark-all-groups-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupNames: groupNames || [] }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (!markedCount && data.clearedCount) {
        markedCount = data.clearedCount;
      }
    }
  } catch {}

  return { success: true, markedCount: markedCount || groupNames?.length || 0 };
}


