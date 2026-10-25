import { registerPlugin, Capacitor } from '@capacitor/core';

export interface WhatsAppNativeEvent {
  id: string;
  packageName: string;
  title?: string;
  text?: string;
  bigText?: string;
  subText?: string;
  rawText?: string;
  receivedAt: number;
  key?: string;
  isGroup?: boolean;
  conversationTitle?: string;
  groupName?: string;
  senderName?: string;
  summaryText?: string;
  category?: string;
  /** True only when Android's visible notification text explicitly identifies a sticker. */
  isSticker?: boolean;
}

interface OrderiNotificationListenerPlugin {
  isEnabled(): Promise<{ enabled: boolean }>;
  openWhatsAppGroupConversation(options: { groupName: string }): Promise<{ success: boolean; method: string }>;
  openSettings(): Promise<void>;
  isAccessibilityEnabled(): Promise<{ enabled: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  getPrivateOutreachStatus(): Promise<{ status: string; statusLabel?: string; updatedAt?: number }>;
  reachAdvertiserPrivateChat(options: {
    phone?: string;
    memberName?: string;
    groupName?: string;
    message: string;
    autoSend?: boolean;
  }): Promise<{ success: boolean; method: string }>;
  sendPrivateNotificationReply(options: {
    target: string;
    message: string;
  }): Promise<{ success: boolean; method: string }>;
  replyDoneToOriginalAd(options: {
    targetGroup: string;
  }): Promise<{ success: boolean; method: string; targetGroup?: string; message?: string }>;
  publishToWhatsAppGroups(options: {
    groupNames: string[];
    message: string;
  }): Promise<{ success: boolean; method: string; groupCount?: number }>;
  sendQuickReply(options: {
    groupName?: string;
    phone?: string;
    message: string;
  }): Promise<{ success: boolean; method: string }>;
  getPending(): Promise<{ events: WhatsAppNativeEvent[] }>;
  getClickedOrder?(): Promise<{ order?: any }>;
  showOrderNotification(options: { orderId: string; from: string; to: string; price?: number; priceDisplay?: string; rawText?: string }): Promise<void>;
  cancelOrderNotification(options: { orderId: string }): Promise<void>;
  syncOrderNotifications(options: { orderIds: string[] }): Promise<void>;
  getDismissedOrderIds(): Promise<{ orderIds: string[] }>;
  moveToBackground(): Promise<void>;
  updateFilterSettings?(options: {
    ignoreNonMatching: boolean;
    minPrice: number;
    coverageKm: number;
    driverLat?: number;
    driverLon?: number;
    blockPassenger?: boolean;
    notificationsEnabled?: boolean;
  }): Promise<void>;
  markAllAsRead(options?: { groupNames?: string[] }): Promise<{ success: boolean; markedCount: number; archivedAutomationStarted?: boolean; accessibilityRequired?: boolean }>;
  markGroupAsRead(options: { groupName: string }): Promise<{ success: boolean; markedCount: number; method: string }>;
  addListener(
    eventName: 'whatsappNotification',
    listenerFunc: (event: WhatsAppNativeEvent) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    eventName: 'openOrderDetail',
    listenerFunc: (event: any) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    eventName: 'orderNotificationDismissed',
    listenerFunc: (event: { orderId: string }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

export const OrderiNotificationListener = registerPlugin<OrderiNotificationListenerPlugin>(
  'OrderiNotificationListener'
);

export const isNativeAndroid = () => Capacitor.getPlatform() === 'android';

/** Send the literal completion reply through a recent notification action for the exact source group. */
export async function replyDoneToOriginalAd(targetGroup: string): Promise<{ success: boolean; method: string }> {
  if (!isNativeAndroid()) return { success: false, method: 'not_native' };
  const name = targetGroup.trim();
  if (!name) return { success: false, method: 'missing_target_group' };
  try {
    return await OrderiNotificationListener.replyDoneToOriginalAd({ targetGroup: name });
  } catch (error: any) {
    return { success: false, method: error?.message || 'error' };
  }
}

/** Start sequential multi-group publishing through Android Accessibility. */
export async function publishToWhatsAppGroups(groupNames: string[], message: string): Promise<{ success: boolean; method: string; groupCount?: number }> {
  if (!isNativeAndroid()) return { success: false, method: 'not_native' };
  const names = Array.from(new Set(groupNames.map((name) => name.trim()).filter(Boolean)));
  if (!names.length || !message.trim()) return { success: false, method: 'missing_groups_or_message' };
  try {
    return await OrderiNotificationListener.publishToWhatsAppGroups({ groupNames: names, message });
  } catch (error: any) {
    return { success: false, method: error?.message || 'error' };
  }
}

/** Open the exact WhatsApp group using its cached Android notification intent. */
export async function openWhatsAppGroupConversation(groupName: string): Promise<{ success: boolean; method: string }> {
  if (!isNativeAndroid()) return { success: false, method: 'not_native' };
  const name = groupName.trim();
  if (!name) return { success: false, method: 'missing_group_name' };
  try {
    return await OrderiNotificationListener.openWhatsAppGroupConversation({ groupName: name });
  } catch {
    return { success: false, method: 'error' };
  }
}
