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
