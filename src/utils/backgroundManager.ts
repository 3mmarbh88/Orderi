import { ParsedOrder, OrderFilter } from '../types';

let wakeLockSentinel: any = null;
let isWakeLockRequested = false;

/**
 * Checks if running inside an iframe (e.g. AI Studio preview)
 */
export function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Checks if the Web Notification API is supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets the current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Requests native system notification permissions from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';

  // Check if running inside an iframe - browsers security sandbox blocks notification prompts in iframes
  if (isInIframe()) {
    console.warn('[Ordari] Cannot request notification permission from inside an iframe.');
    return Notification.permission;
  }

  try {
    if (typeof Notification.requestPermission === 'function') {
      let permission: NotificationPermission;
      try {
        permission = await Notification.requestPermission();
      } catch {
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission(resolve);
        });
      }
      return permission;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return Notification.permission || 'denied';
}

/**
 * Dispatches a native OS system notification for a matched order
 * Formatted exactly like native WhatsApp notifications with group/sender name, WhatsApp icon and sound
 */
export function sendBackgroundOrderNotification(order: ParsedOrder, filter?: OrderFilter): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  // حجب كامل للإشعارات في الخلفية للطلبات غير المطابقة لشروط الكابتن
  if (filter?.ignoreNonMatching) {
    if (!order.match || order.match.score < 80 || !order.match.priceMatched || !order.match.distanceMatched || !order.match.startMatched) {
      return; // حجب كامل لمنع إزعاج الكابتن بطلبات خارج نطاقه أو سعره
    }
  }

  // منع إرسال إشعار في الخلفية إذا كانت نسبة المطابقة أقل من 80% (إلا إذا كان متجر VIP موثوق)
  if (order.match && order.match.score < 80 && order.contactStatus !== 'vip') {
    return;
  }

  try {
    const isVip = order.contactStatus === 'vip';
    const isPassenger = order.passengerDetection?.level === 'confirmed_passenger';
    const count = order.passengerCount || order.passengerDetection?.passengerCount;
    
    // Title format: highlights route or passenger warning
    let title = '';
    if (isPassenger) {
      title = `🚨 نقل ركاب ${count ? `(${count} ركاب)` : ''} • تحذير: توصيل أشخاص ممنوع 🚫`;
    } else {
      title = `🚗 طلب جديد: ${order.from} ← ${order.to}`;
    }

    // Message snippet formatted as WhatsApp chat message
    const cleanText = order.rawText
      ? order.rawText.trim().replace(/\s+/g, ' ')
      : `مطلوب توصيل من ${order.from} إلى ${order.to}`;
    const preview = cleanText.length > 70 ? cleanText.substring(0, 70) + '...' : cleanText;

    const priceText = (!order.price || order.price <= 0 || order.isPriceUnspecified)
      ? 'غير محدد (بالاتفاق 🤝)'
      : `${order.price.toFixed(1)} د.ب`;

    // Order summary body with pickup, destination, price and original snippet
    const bodyLines = [
      `📍 الاستلام: ${order.from}`,
      `🏁 الوجهة: ${order.to}`,
      `💰 السعر: ${priceText}`,
    ];
    if (count && count > 0) {
      bodyLines.push(`👥 عدد الركاب: ${count} ${count === 1 ? 'شخص' : count === 2 ? 'شخصين' : 'أشخاص'}`);
    }
    bodyLines.push(`💬 "${preview}"`);

    const body = bodyLines.join('\n');

    const options: any = {
      body,
      icon: '/whatsapp-icon.png',
      badge: '/whatsapp-icon.png',
      tag: `orderi-order-${order.id}`,
      renotify: true,
      silent: false,
      vibrate: [150, 75, 150], // Signature pulse
      actions: [
        {
          action: 'open_order',
          title: 'عرض وتفاصيل الأوردر 🚗',
        },
      ],
      data: {
        orderId: order.id,
        order,
      },
    };

    // If Service Worker registration is available, use showNotification for better mobile background persistence
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      }).catch(() => {
        createWindowNotification(title, options, order);
      });
    } else {
      createWindowNotification(title, options, order);
    }
  } catch (e) {
    console.warn('Could not send system notification:', e);
  }
}

function createWindowNotification(title: string, options: any, order?: ParsedOrder) {
  const notif = new Notification(title, options);
  notif.onclick = () => {
    try {
      window.focus();
    } catch {}

    // Dispatch event to open this specific order's details inside Orderi
    if (order && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orderi:open_order_detail', {
        detail: {
          orderId: order.id,
          order,
        },
      }));
    }
    notif.close();
  };
}

/**
 * Screen Wake Lock API: Keeps phone screen awake while mounted in vehicle
 */
export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export async function requestScreenWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) return false;
  isWakeLockRequested = true;

  try {
    if (!wakeLockSentinel) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    }
    return true;
  } catch (err) {
    console.warn('Wake Lock request failed:', err);
    return false;
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  isWakeLockRequested = false;
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}

// Automatically re-request wake lock when returning from background if user enabled it
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isWakeLockRequested && !wakeLockSentinel) {
      try {
        await requestScreenWakeLock();
      } catch {}
    }
  });
}
