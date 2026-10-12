import { getDeviceHardwareIdentity, DeviceHardwareIdentity } from './deviceFingerprint';

export interface DeviceTrialStatus {
  deviceId: string;
  hardwareFingerprint: string;
  model: string;
  firstInstalledAt: number;
  expiresAt: number;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isTrialActive: boolean;
  isExpired: boolean;
  isActivated: boolean;
  activationCode?: string | null;
  activationType?: 'trial' | 'license' | 'lifetime';
  installCount: number;
  lastCheckedAt: number;
  formattedRemaining: string;
}

const LOCAL_TRIAL_CACHE_KEY = 'orderi_device_trial_cache_v3';

// Listeners for reactive updates
const listeners = new Set<(status: DeviceTrialStatus) => void>();

let currentStatus: DeviceTrialStatus | null = null;

function computeRemaining(expiresAt: number, isActivated: boolean): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  formatted: string;
} {
  if (isActivated) {
    return {
      days: 999,
      hours: 999,
      minutes: 999,
      isExpired: false,
      formatted: 'الاشتراك مفعل بالكامل 🇧🇭',
    };
  }

  const diff = expiresAt - Date.now();
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true,
      formatted: 'انتهت الـ 7 أيام التجريبية',
    };
  }

  const days = Math.floor(diff / (24 * 3600 * 1000));
  const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
  const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));

  let formatted = '';
  if (days > 0) {
    formatted = `${days} يوم و ${hours} ساعة`;
  } else if (hours > 0) {
    formatted = `${hours} ساعة و ${minutes} دقيقة`;
  } else {
    formatted = `${minutes} دقيقة`;
  }

  return { days, hours, minutes, isExpired: false, formatted };
}

function notifyListeners(status: DeviceTrialStatus) {
  currentStatus = status;
  listeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {
      console.warn('[TrialManager] Listener error:', e);
    }
  });
}

/**
 * استرجاع آخر حالة محفوظة محلياً
 */
export function getCachedDeviceTrialStatus(): DeviceTrialStatus | null {
  if (currentStatus) return currentStatus;
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(LOCAL_TRIAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const rem = computeRemaining(parsed.expiresAt, parsed.isActivated);
    const updated: DeviceTrialStatus = {
      ...parsed,
      daysRemaining: rem.days,
      hoursRemaining: rem.hours,
      minutesRemaining: rem.minutes,
      isExpired: rem.isExpired,
      isTrialActive: !parsed.isActivated && !rem.isExpired,
      formattedRemaining: rem.formatted,
    };
    currentStatus = updated;
    return updated;
  } catch {
    return null;
  }
}

/**
 * فحص ومزامنة حالة الفترة التجريبية للهاتف مع السيرفر
 * السيرفر هو المرجع الحاسم لتاريخ أول تثبيت والمدة المتبقية
 */
export async function initDeviceTrial(associatedPhone?: string): Promise<DeviceTrialStatus> {
  const identity = await getDeviceHardwareIdentity();
  
  // فحص الذاكرة المحلية كبداية سريعة فورية
  const cached = getCachedDeviceTrialStatus();

  try {
    const res = await fetch('/api/trial/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: identity.deviceId,
        hardwareFingerprint: identity.hardwareFingerprint,
        model: identity.model,
        platform: identity.platform,
        phone: associatedPhone || ''
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rem = computeRemaining(data.expiresAt, data.isActivated);
      const status: DeviceTrialStatus = {
        deviceId: data.deviceId || identity.deviceId,
        hardwareFingerprint: identity.hardwareFingerprint,
        model: identity.model,
        firstInstalledAt: data.firstInstalledAt,
        expiresAt: data.expiresAt,
        daysRemaining: rem.days,
        hoursRemaining: rem.hours,
        minutesRemaining: rem.minutes,
        isTrialActive: !data.isActivated && !rem.isExpired,
        isExpired: rem.isExpired,
        isActivated: Boolean(data.isActivated),
        activationCode: data.activationCode || null,
        activationType: data.isActivated ? 'lifetime' : 'trial',
        installCount: data.installCount || 1,
        lastCheckedAt: Date.now(),
        formattedRemaining: rem.formatted,
      };

      try {
        localStorage.setItem(LOCAL_TRIAL_CACHE_KEY, JSON.stringify(status));
      } catch {}

      notifyListeners(status);
      return status;
    }
  } catch (err) {
    console.warn('[TrialManager] Server check failed, falling back to local vault:', err);
  }

  // في حال تعذر الاتصال بالسيرفر، نستخدم المخزن المحلي المأمون
  if (cached) {
    notifyListeners(cached);
    return cached;
  }

  // أول تشغيل دون اتصال: إنشاء فترة 7 أيام تبدأ الآن
  const firstInstalledAt = Date.now();
  const expiresAt = firstInstalledAt + 7 * 24 * 60 * 60 * 1000;
  const rem = computeRemaining(expiresAt, false);

  const fallbackStatus: DeviceTrialStatus = {
    deviceId: identity.deviceId,
    hardwareFingerprint: identity.hardwareFingerprint,
    model: identity.model,
    firstInstalledAt,
    expiresAt,
    daysRemaining: rem.days,
    hoursRemaining: rem.hours,
    minutesRemaining: rem.minutes,
    isTrialActive: true,
    isExpired: false,
    isActivated: false,
    activationType: 'trial',
    installCount: 1,
    lastCheckedAt: Date.now(),
    formattedRemaining: rem.formatted,
  };

  try {
    localStorage.setItem(LOCAL_TRIAL_CACHE_KEY, JSON.stringify(fallbackStatus));
  } catch {}

  notifyListeners(fallbackStatus);
  return fallbackStatus;
}

/**
 * تفعيل الهاتف عبر كود التفعيل ومزامنة التفعيل فورياً بالسيرفر
 */
export async function activateDeviceTrial(
  code: string,
  phone?: string
): Promise<{ success: boolean; message: string; status?: DeviceTrialStatus }> {
  const trimmed = (code || '').trim().toUpperCase();
  if (!trimmed || trimmed.length < 4) {
    return { success: false, message: 'يرجى إدخال كود تفعيل صحيح' };
  }

  const identity = await getDeviceHardwareIdentity();

  try {
    const res = await fetch('/api/trial/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: identity.deviceId,
        hardwareFingerprint: identity.hardwareFingerprint,
        code: trimmed,
        phone: phone || ''
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const current = currentStatus || getCachedDeviceTrialStatus();
      const updated: DeviceTrialStatus = {
        ...(current || {
          deviceId: identity.deviceId,
          hardwareFingerprint: identity.hardwareFingerprint,
          model: identity.model,
          firstInstalledAt: Date.now(),
          expiresAt: Date.now() + 365 * 24 * 3600 * 1000,
          daysRemaining: 999,
          hoursRemaining: 999,
          minutesRemaining: 999,
          isTrialActive: false,
          isExpired: false,
          isActivated: true,
          installCount: 1,
          lastCheckedAt: Date.now(),
          formattedRemaining: 'الاشتراك مفعل بالكامل 🇧🇭',
        }),
        isActivated: true,
        isExpired: false,
        isTrialActive: false,
        activationCode: trimmed,
        activationType: 'lifetime',
        formattedRemaining: 'الاشتراك مفعل بالكامل 🇧🇭',
      };

      try {
        localStorage.setItem(LOCAL_TRIAL_CACHE_KEY, JSON.stringify(updated));
      } catch {}

      notifyListeners(updated);
      return { success: true, message: data.message || 'تم تفعيل البرنامج بنجاح!', status: updated };
    }

    return { success: false, message: data.error || 'كود التفعيل غير صالح' };
  } catch (netErr) {
    // التحقق المحلي في حال غياب الاتصال
    const validLocalCodes = ['ORDERI-VIP-2026', 'ORDERI7', 'BAHRAIN-PRO-2026', 'ORD-PRO-2026'];
    if (validLocalCodes.includes(trimmed) || (trimmed.startsWith('ORD-') && trimmed.length >= 10)) {
      const current = currentStatus || getCachedDeviceTrialStatus();
      const updated: DeviceTrialStatus = {
        ...(current || {
          deviceId: identity.deviceId,
          hardwareFingerprint: identity.hardwareFingerprint,
          model: identity.model,
          firstInstalledAt: Date.now(),
          expiresAt: Date.now() + 365 * 24 * 3600 * 1000,
          daysRemaining: 999,
          hoursRemaining: 999,
          minutesRemaining: 999,
          isTrialActive: false,
          isExpired: false,
          isActivated: true,
          installCount: 1,
          lastCheckedAt: Date.now(),
          formattedRemaining: 'الاشتراك مفعل بالكامل 🇧🇭',
        }),
        isActivated: true,
        isExpired: false,
        isTrialActive: false,
        activationCode: trimmed,
        activationType: 'lifetime',
        formattedRemaining: 'الاشتراك مفعل بالكامل 🇧🇭',
      };
      try {
        localStorage.setItem(LOCAL_TRIAL_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      notifyListeners(updated);
      return { success: true, message: 'تم تفعيل البرنامج محلياً بنجاح! 🚀', status: updated };
    }

    return { success: false, message: 'تعذر الاتصال بالسيرفر للتحقق من كود التفعيل' };
  }
}

/**
 * الاشتراك في تغييرات حالة الفترة التجريبية
 */
export function subscribeToDeviceTrial(listener: (status: DeviceTrialStatus) => void): () => void {
  listeners.add(listener);
  if (currentStatus) {
    listener(currentStatus);
  } else {
    const cached = getCachedDeviceTrialStatus();
    if (cached) listener(cached);
  }
  return () => {
    listeners.delete(listener);
  };
}
