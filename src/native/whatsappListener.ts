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
 * Executes "Mark as Read" only for explicitly supplied, active WhatsApp groups.
 * Archived chats and unrelated private conversations are intentionally excluded.
 * Server bookkeeping is synchronized separately and is not treated as device-level read confirmation.
 */
export async function markAllWhatsAppAsRead(
  groupNames?: string[],
  options?: { includeArchived?: boolean }
): Promise<{ success: boolean; markedCount: number; archivedAutomationStarted?: boolean; accessibilityRequired?: boolean; whatsAppOpened?: boolean }> {
  let markedCount = 0;
  let archivedAutomationStarted = false;
  let accessibilityRequired = false;
  let whatsAppOpened = false;
  let nativeReadSucceeded = false;

  if (isNativeAndroid()) {
    try {
      const res = await OrderiNotificationListener.markAllAsRead({
        groupNames: groupNames || [],
        includeArchived: false,
      });
      markedCount = res.markedCount || 0;
      nativeReadSucceeded = !!res.success;
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
    success: nativeReadSucceeded,
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
      if (result.status === 'sent_confirmed' || result.status === 'submitted' || result.status === 'failed' || result.status === 'verification_required') {
        return result;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return { status: 'failed', statusLabel: 'انتهت مهلة انتظار تأكيد الإرسال' };
}
