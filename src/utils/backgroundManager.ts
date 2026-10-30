import { ParsedOrder, OrderFilter } from '../types';
import { OrderiNotificationListener, isNativeAndroid } from '../native/orderiNotificationListener';

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

// Shared AudioContext for background audio playback priming
let backgroundAudioCtx: AudioContext | null = null;
let heartbeatTimer: any = null;

/**
 * Primes and unlocks Web Audio for background execution
 * Required by mobile browsers so chimes continue to play even when backgrounded
 */
export function primeBackgroundAudio(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!backgroundAudioCtx) {
      backgroundAudioCtx = new AudioContextClass();
    }

    if (backgroundAudioCtx.state === 'suspended') {
      backgroundAudioCtx.resume().catch(() => {});
    }

    // Play ultra-short silent buffer to unlock browser audio gate
    const buffer = backgroundAudioCtx.createBuffer(1, 1, 22050);
    const source = backgroundAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(backgroundAudioCtx.destination);
    source.start(0);
  } catch (err) {
    console.warn('[Orderi] AudioContext background priming notice:', err);
  }
}

/**
 * Starts a background heartbeat to keep Web Worker / SSE active while minimized
 */
export function startBackgroundHeartbeat(): void {
  if (heartbeatTimer || typeof window === 'undefined') return;
  try {
    // Keep a lightweight periodic interval that pings
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'hidden') {
        if (backgroundAudioCtx && backgroundAudioCtx.state === 'suspended') {
          backgroundAudioCtx.resume().catch(() => {});
        }
      }
    }, 15000);
  } catch {}
}

/**
 * Dispatches a native OS system notification for a matched order
 * Formatted exactly like native WhatsApp notifications with group/sender name, WhatsApp icon and sound
 */
export function sendBackgroundOrderNotification(order: ParsedOrder, filter?: OrderFilter): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  // إذا تم إيقاف الإشعارات من داخل التطبيق (إلا إذا أغلقنا عمل الإشعارات من داخل البرنامج)
  if (filter?.notificationsEnabled === false || filter?.backgroundNotificationsEnabled === false) {
    return;
  }

  // استبعاد إعلاناتي الشخصية من إرسال أي إشعار بالنظام في الخلفية إذا كان الخيار مفعلاً
  if ((order.isOwnAd || (order as any).isFromMe) && filter?.excludeMyOwnAds !== false) {
    return;
  }

  // حجب جهات الاتصال المحظورة (القائمة السوداء)
  if (filter?.autoBlockBlacklist !== false && order.contactStatus === 'blacklist') {
    return;
  }

  // حجب إعلانات نقل الركاب إذا كان خيار حجب الركاب مفعلاً
  const isPassenger = order.passengerDetection?.level === 'confirmed_passenger' || order.passengerDetection?.level === 'suspicious_passenger';
  if (isPassenger && filter?.blockPassengerDeliveries !== false) {
    return; // حجب إشعار الركاب لأن الحجب مفعل
  }

  // حجب الطلبات غير المطابقة لشروط الكابتن فقط إذا كان خيار الحجب مفعلاً
  // إذا كان الحجب معطلاً (ignoreNonMatching === false)، يُسمح بالإشعار وتنبيه الكابتن بالطلب!
  if (filter?.ignoreNonMatching) {
    if (!order.match || order.match.score < 80) {
      if (order.contactStatus !== 'vip') {
        return; // حجب الطلب غير المطابق
      }
    }
  }

  try {
    const isVip = order.contactStatus === 'vip';
    
    const priceText = (!order.price || order.price <= 0 || order.isPriceUnspecified)
      ? ''
      : ` ${Number.isInteger(order.price) ? order.price.toFixed(0) : order.price.toFixed(1)} دينار`;
    
    // Concise notification route text
    const routeText = `${order.from} ← ${order.to}${priceText}`;
    
    let title = routeText;
    if (isPassenger) {
      title = `👥 طلب توصيل راكب • ${routeText}`;
    } else if (isVip) {
      title = `⭐ VIP • ${routeText}`;
    }

    const body = `${routeText} (${order.groupName || 'واتساب'})`;

    const options: any = {
      body,
      icon: '/whatsapp-icon.png',
      badge: '/whatsapp-icon.png',
      tag: `orderi-order-${order.id}`,
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200, 100, 200], // Professional tactile vibration
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

    // Track sent notification count in session
    try {
      if (typeof sessionStorage !== 'undefined') {
        const prevCount = parseInt(sessionStorage.getItem('orderi_notifs_sent_count') || '0', 10);
        sessionStorage.setItem('orderi_notifs_sent_count', String(prevCount + 1));
      }
    } catch {}

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

/**
 * Dismisses/closes an active system notification for a specific order by orderId
 */
export function dismissBackgroundOrderNotification(orderId: string): void {
  if (typeof window === 'undefined' || !orderId) return;

  const targetTag = `orderi-order-${orderId}`;

  // 1. If Service Worker registration is present, find matching notifications and close them
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.getNotifications({ tag: targetTag }).then((notifications) => {
        notifications.forEach((notif) => {
          try {
            notif.close();
          } catch {}
        });
      }).catch(() => {});
    }).catch(() => {});
  }

  // 2. Broadcast custom event in case window notifications or external listeners track it
  window.dispatchEvent(new CustomEvent('orderi:dismiss_notification', {
    detail: { orderId, tag: targetTag }
  }));

  // 3. Broadcast channel for multi-tab and service worker synchronization
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('orderi_notifications');
      bc.postMessage({ type: 'NOTIFICATION_DISMISSED', orderId });
      bc.close();
    }
  } catch {}

  // 4. If running on native Android, cancel OS status-bar notification directly
  if (isNativeAndroid()) {
    try {
      OrderiNotificationListener.cancelOrderNotification({ orderId }).catch(() => {});
    } catch {}
  }
}

/**
 * Dismisses and cancels ALL active notifications in the OS bar / browser
 */
export function dismissAllBackgroundOrderNotifications(): void {
  if (typeof window === 'undefined') return;

  // 1. Service Worker: close all order notifications
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.getNotifications().then((notifications) => {
        notifications.forEach((notif) => {
          if (notif.tag && notif.tag.startsWith('orderi-order-')) {
            try {
              notif.close();
            } catch {}
          }
        });
      }).catch(() => {});
    }).catch(() => {});
  }

  // 2. Window events
  window.dispatchEvent(new CustomEvent('orderi:dismiss_all_notifications'));
  window.dispatchEvent(new CustomEvent('orderi:all_notifications_dismissed'));

  // 3. Broadcast channel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('orderi_notifications');
      bc.postMessage({ type: 'ALL_NOTIFICATIONS_DISMISSED' });
      bc.close();
    }
  } catch {}

  // 4. Native Android cancelAll
  if (isNativeAndroid()) {
    try {
      OrderiNotificationListener.cancelAllOrderNotifications().catch(() => {});
    } catch {}
  }
}

function createWindowNotification(title: string, options: any, order?: ParsedOrder) {
  let isProgrammaticClose = false;
  const notif = new Notification(title, options);

  // Listen for dismiss event to close window-level notification instance programmatically
  const handleDismiss = (e: any) => {
    if (e.detail?.orderId === order?.id) {
      isProgrammaticClose = true;
      try {
        notif.close();
      } catch {}
      window.removeEventListener('orderi:dismiss_notification', handleDismiss);
    }
  };
  window.addEventListener('orderi:dismiss_notification', handleDismiss);

  notif.onclose = () => {
    window.removeEventListener('orderi:dismiss_notification', handleDismiss);
  };

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
    isProgrammaticClose = true;
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
