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
}

interface OrderiNotificationListenerPlugin {
  isEnabled(): Promise<{ enabled: boolean }>;
  openWhatsAppGroupConversation(options: { groupName: string }): Promise<{ success: boolean; method: string }>;
  openSettings(): Promise<void>;
  isAccessibilityEnabled(): Promise<{ enabled: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  reachAdvertiserPrivateChat(options: {
    phone?: string;
    memberName?: string;
    groupName?: string;
    message: string;
    autoSend?: boolean;
  }): Promise<{ success: boolean; method: string }>;
  sendQuickReply(options: {
    groupName?: string;
    phone?: string;
    message: string;
  }): Promise<{ success: boolean; method: string }>;
  getPending(): Promise<{ events: WhatsAppNativeEvent[] }>;
  getClickedOrder?(): Promise<{ order?: any }>;
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
  addListener(
    eventName: 'whatsappNotification',
    listenerFunc: (event: WhatsAppNativeEvent) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    eventName: 'openOrderDetail',
    listenerFunc: (event: any) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

export const OrderiNotificationListener = registerPlugin<OrderiNotificationListenerPlugin>(
  'OrderiNotificationListener'
);

export const isNativeAndroid = () => Capacitor.getPlatform() === 'android';

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
