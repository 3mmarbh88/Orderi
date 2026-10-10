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
  category?: string;
}

interface OrderiNotificationListenerPlugin {
  isEnabled(): Promise<{ enabled: boolean }>;
  openSettings(): Promise<void>;
  isAccessibilityEnabled(): Promise<{ enabled: boolean }>;
  openAccessibilitySettings(): Promise<void>;
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
  }): Promise<void>;
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
