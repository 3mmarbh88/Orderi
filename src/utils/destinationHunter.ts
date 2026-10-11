import { OrderFilter, HuntedDestinationLog, ParsedOrder } from '../types';
import { normalizeArabicText, BAHRAIN_AREAS } from '../data/bahrainAreas';
import { findLandmarkByName } from '../data/bahrainLandmarks';

export const STORAGE_KEY_HUNTED_LOGS = 'orderi_hunted_destinations_log';

export const POPULAR_BAHRAIN_PICKUP_AREAS = [
  'المنامة',
  'السيف',
  'الجفير',
  'الرفاع الشرقي',
  'الرفاع الغربي',
  'سند',
  'المحرق',
  'سار',
  'توبلي',
  'مدينة عيسى',
  'مدينة حمد',
  'البديع',
  'الزنج',
  'أم الحصم',
  'العدلية',
];

export const POPULAR_BAHRAIN_DELIVERY_AREAS = [
  'المحرق',
  'عراد',
  'الحد',
  'أمواج',
  'ديار المحرق',
  'البديع',
  'الجنبية',
  'سار',
  'الرفاع الشرقي',
  'الرفاع الغربي',
  'عالي',
  'سترة',
  'درة البحرين',
  'الزلاق',
  'مدينة حمد',
  'مدينة عيسى',
];

export const PRESET_POPULAR_ROUTES: { from: string; to: string; label: string }[] = [
  { from: 'السيف', to: 'المحرق', label: 'السيف ➔ المحرق' },
  { from: 'الرفاع', to: 'المنامة', label: 'الرفاع ➔ المنامة' },
  { from: 'سار', to: 'السيف', label: 'سار ➔ السيف' },
  { from: 'سند', to: 'المنامة', label: 'سند ➔ المنامة' },
  { from: 'مدينة حمد', to: 'السيف', label: 'مدينة حمد ➔ السيف' },
  { from: 'المحرق', to: 'الجفير', label: 'المحرق ➔ الجفير' },
  { from: 'توبلي', to: 'الرفاع', label: 'توبلي ➔ الرفاع' },
];

/**
 * فحص مطابقة اسم المنطقة مع مراعاة المعالم التابعة لها والتهجئات المختلفة
 */
function isAreaMatch(targetArea: string, candidate: string): boolean {
  if (!targetArea || !candidate) return false;
  const normTarget = normalizeArabicText(targetArea);
  const normCand = normalizeArabicText(candidate);

  if (normTarget === normCand) return true;
  if (normCand.includes(normTarget) || normTarget.includes(normCand)) return true;

  // فحص المعالم (مثل: مجمع السيف -> السيف، أو الأفنيوز -> المنامة)
  const landmark = findLandmarkByName(candidate);
  if (landmark && landmark.parentAreaName) {
    const normParent = normalizeArabicText(landmark.parentAreaName);
    if (normParent === normTarget || normParent.includes(normTarget) || normTarget.includes(normParent)) {
      return true;
    }
  }

  return false;
}

/**
 * محرك صائد وجهات التوصيل والتسليم المرغوبة في قروبات التوصيل المنشورة
 * يفحص الطلب الوارد ويحدد ما إذا كان يطابق أياً من:
 * 1. مسار مرغوب محدد (من كذا إلى كذا)
 * 2. وجهة تسليم مرغوبة
 * 3. مكان استلام مرغوب
 */
export function checkOrderDestinationHunt(
  order: { from: string; to: string; rawText?: string },
  filter: OrderFilter
): {
  isHunted: boolean;
  matchType?: 'route' | 'pickup' | 'delivery';
  matchedArea?: string;
  routeLabel?: string;
  badgeLabel?: string;
  reason?: string;
} {
  // إذا كان الصائد معطلاً تماماً
  if (filter.destinationHunterEnabled === false) {
    return { isHunted: false };
  }

  const from = (order.from || '').trim();
  const to = (order.to || '').trim();

  // 1. فحص المسارات المرغوبة المحددة (Routes: From ➔ To)
  const desiredRoutes = filter.desiredRoutes || [];
  if (desiredRoutes.length > 0) {
    for (const r of desiredRoutes) {
      if (isAreaMatch(r.from, from) && isAreaMatch(r.to, to)) {
        return {
          isHunted: true,
          matchType: 'route',
          matchedArea: `${r.from} ➔ ${r.to}`,
          routeLabel: `${r.from} ← ${r.to}`,
          badgeLabel: `🎯 مسار مرغوب: ${r.from} ➔ ${r.to}`,
          reason: `يطابق مسارك المفضل المرصود في القروب (${r.from} إلى ${r.to})`,
        };
      }
    }
  }

  // 2. فحص وجهات التسليم والتوصيل المرغوبة (Desired Delivery Areas)
  // نعتمد filter.desiredDeliveryAreas إن وُجدت أو filter.destinations
  const deliveryTargets = (filter.desiredDeliveryAreas && filter.desiredDeliveryAreas.length > 0)
    ? filter.desiredDeliveryAreas
    : (filter.destinations && filter.destinations.length > 0 ? filter.destinations : []);

  if (deliveryTargets.length > 0) {
    for (const target of deliveryTargets) {
      if (isAreaMatch(target, to)) {
        return {
          isHunted: true,
          matchType: 'delivery',
          matchedArea: target,
          routeLabel: `توصيل إلى ${target}`,
          badgeLabel: `🎯 وجهة مرغوبة: ${target}`,
          reason: `وجهة التسليم المطلوبة «${target}» ضمن قائمة صيدك المرغوبة في القروبات`,
        };
      }
    }
  }

  // 3. فحص مناطق الاستلام المرغوبة (Desired Pickup Areas)
  const pickupTargets = (filter.desiredPickupAreas && filter.desiredPickupAreas.length > 0)
    ? filter.desiredPickupAreas
    : (filter.startAreas && filter.startAreas.length > 0 ? filter.startAreas : []);

  if (pickupTargets.length > 0) {
    for (const target of pickupTargets) {
      if (isAreaMatch(target, from)) {
        return {
          isHunted: true,
          matchType: 'pickup',
          matchedArea: target,
          routeLabel: `استلام من ${target}`,
          badgeLabel: `🎯 استلام مرغوب: ${target}`,
          reason: `مكان الاستلام «${target}» ضمن مناطق انطلاقك المفضلة المرصودة بالقروب`,
        };
      }
    }
  }

  return { isHunted: false };
}

/**
 * حفظ سجل الطلبات المصطادة في التخزين المحلي
 */
export function getStoredHuntedDestinationLogs(): HuntedDestinationLog[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY_HUNTED_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHuntedDestinationLog(log: HuntedDestinationLog): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const current = getStoredHuntedDestinationLogs();
    // تجنب التكرار لنفس الطلب
    if (current.some(item => item.orderId === log.orderId)) return;
    const updated = [log, ...current].slice(0, 50); // حفظ آخر 50 صيدة
    localStorage.setItem(STORAGE_KEY_HUNTED_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save hunted destination log:', err);
  }
}

export function clearHuntedDestinationLogs(): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_HUNTED_LOGS);
  } catch {}
}
