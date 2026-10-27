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
      const res = await OrderiNotificationListener.openWhatsAppGroupConversation({ groupName: name || 'واتساب' });
      if (res && res.success) return res;
    } catch {}
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

  // Web fallback: open WhatsApp Web or app scheme
  if (typeof window !== 'undefined') {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    if (isMobile) {
      try {
        window.location.href = 'whatsapp://';
        return { success: true, method: 'mobile_whatsapp_scheme' };
      } catch {}
    }
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
      const res = await OrderiNotificationListener.openWhatsAppPrivateConversation({
        phone: phone || undefined,
        memberName: memberName || undefined,
      });
      if (res && res.success) return res;
    } catch {}
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

  // If no phone is known, open WhatsApp app or web interface
  if (typeof window !== 'undefined') {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    if (isMobile) {
      try {
        const textQuery = message ? `?text=${encodeURIComponent(message)}` : '';
        window.location.href = `whatsapp://send${textQuery}`;
        return { success: true, method: 'mobile_whatsapp_scheme' };
      } catch {}
    }
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
