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
 */
export async function markAllWhatsAppAsRead(): Promise<{ success: boolean; markedCount: number }> {
  if (isNativeAndroid()) {
    try {
      const res = await OrderiNotificationListener.markAllAsRead();
      return { success: true, markedCount: res.markedCount || 0 };
    } catch (err) {
      console.warn('Native markAllAsRead error:', err);
    }
  }
  return { success: true, markedCount: 0 };
}


