import { OrderFilter, OrderMatchBreakdown } from '../types';
import { calculateDistanceKm, findAreaByName, normalizeArabicText } from '../data/bahrainAreas';
import { findLandmarkByName } from '../data/bahrainLandmarks';

export interface MatcherLocation {
  latitude: number;
  longitude: number;
  areaName?: string;
  speedKmh?: number;
  heading?: number;
  accuracyMeters?: number;
  lastUpdated?: string;
}

/**
 * تقييم دقيق لمطابقة الطلب بناءً على:
 * 1. موقع الكابتن الحالي ونطاق التغطية (بالكيلومتر) ومكان الاستلام (بما في ذلك المعالم والمجمعات الشهيرة مثل مودا مول، السيف، سيتي سنتر وربطها بالمدن التابعة لها كالعاصمة والمنامة)
 * 2. وجهة التسليم المطلوبة أو الوجهات المفتوحة
 * 3. الحد الأدنى للأجرة والوقت
 */
export function evaluateOrderMatch(
  from: string,
  to: string,
  price: number,
  filter: OrderFilter,
  driverLocation: MatcherLocation | null
): OrderMatchBreakdown {
  const fromAreaObj = findAreaByName(from);
  const fromLandmark = findLandmarkByName(from);
  const toAreaObj = findAreaByName(to);
  const toLandmark = findLandmarkByName(to);

  // 1. Pickup Location Match (مكان الاستلام من موقعي الحالي ونطاق التغطية والمسافة المقبولة)
  let distanceKm: number | null = null;
  let startMatched = false;

  // فحص الإحداثيات الدقيقة من موقع الكابتن
  if (driverLocation && fromAreaObj) {
    distanceKm = calculateDistanceKm(
      driverLocation.latitude,
      driverLocation.longitude,
      fromAreaObj.latitude,
      fromAreaObj.longitude
    );
    startMatched = distanceKm <= filter.coverageKm;
  } else if (!driverLocation) {
    // إذا لم يتحدد موقع الـ GPS بعد، نعتبره مطابقاً مبدئياً ريثما يتم التقاط الموقع
    startMatched = true;
  } else {
    // إذا لم تتوفر إحداثيات مباشرة للمكان، نفحص المدينة التابعة للمعلم
    if (fromLandmark && driverLocation.areaName) {
      const normDriverArea = normalizeArabicText(driverLocation.areaName);
      const normParent = normalizeArabicText(fromLandmark.parentAreaName);
      startMatched = normDriverArea === normParent || normDriverArea.includes(normParent) || normParent.includes(normDriverArea);
    } else {
      startMatched = true;
    }
  }

  // إذا حدد الكابتن مناطق استلام معينة (startAreas)
  if (filter.startAreas && filter.startAreas.length > 0) {
    const normStartAreas = filter.startAreas.map(normalizeArabicText);
    const normFrom = normalizeArabicText(from);
    const normParent = fromLandmark ? normalizeArabicText(fromLandmark.parentAreaName) : '';

    const directMatch = normStartAreas.includes(normFrom);
    const parentMatch = normParent ? normStartAreas.includes(normParent) : false;

    // إذا طابقت المنطقة التابعة للمعلم (مثل مودا مول -> المنامة، أو السيف مول -> السيف)، نعتبرها مطابقة
    if (directMatch || parentMatch) {
      startMatched = true;
    }
  }

  const distanceMatched = startMatched;

  // 2. Destination Match (وجهات التسليم المطلوبة)
  let destinationMatched = false;
  if (!filter.destinations || filter.destinations.length === 0) {
    destinationMatched = true;
  } else {
    const normDestinations = filter.destinations.map(normalizeArabicText);
    const normTo = normalizeArabicText(to);
    const normToParent = toLandmark ? normalizeArabicText(toLandmark.parentAreaName) : '';

    if (normDestinations.includes(normTo)) {
      destinationMatched = true;
    } else if (normToParent && normDestinations.includes(normToParent)) {
      destinationMatched = true;
    } else if (toAreaObj && normDestinations.includes(normalizeArabicText(toAreaObj.name))) {
      destinationMatched = true;
    } else {
      // فحص إذا كانت الوجهة عامة أو غير مقيدة (مثل "مكان معين"، "حسب طلب الزبون"، "اي مكان")
      const isGenericDestination = /مكان معين|اي مكان|أي مكان|حسب طلب الزبون|حسب الطلب|وجهة محددة|موقع الزبون|غير محدد/i.test(to);
      if (isGenericDestination) {
        destinationMatched = true;
      }
    }
  }

  // 3. Price Match (الحد الأدنى للأجرة)
  // إذا لم يذكر المعلن السعر في القروب، نتجاهل شرط السعر ونعتبره مطابقاً بالاتفاق حسب رغبة الكابتن
  const isPriceUnspecified = !price || price <= 0;
  const priceMatched = isPriceUnspecified || price >= filter.minimumPrice;

  // Distance between pickup and destination
  let pickupToDeliveryDistanceKm: number | undefined = undefined;
  if (fromAreaObj && toAreaObj) {
    pickupToDeliveryDistanceKm = calculateDistanceKm(
      fromAreaObj.latitude,
      fromAreaObj.longitude,
      toAreaObj.latitude,
      toAreaObj.longitude
    );
  }

  // 4. Time Window Match
  let timeMatched = true;
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = filter.startTime.split(':').map(Number);
    const [endH, endM] = filter.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      timeMatched = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Crosses midnight
      timeMatched = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    timeMatched = true;
  }

  // Score calculation:
  // مكان الاستلام من موقعي الحالي ونطاق التغطية والمسافة: 45%
  // وجهة التسليم المطلوبة: 35%
  // الحد الأدنى للأجرة: 20%
  let score = 0;
  if (startMatched) score += 45;
  if (destinationMatched) score += 35;
  if (priceMatched) score += 20;

  let statusLabel: OrderMatchBreakdown['statusLabel'] = 'غير مطابق';
  let statusColor: OrderMatchBreakdown['statusColor'] = 'slate';

  if (!driverLocation && score >= 80) {
    statusLabel = 'في انتظار الموقع';
    statusColor = 'amber';
  } else if (score >= 90) {
    statusLabel = 'طلب ممتاز';
    statusColor = 'emerald';
  } else if (score >= 80) {
    statusLabel = 'مطابق جداً';
    statusColor = 'blue';
  } else if (score >= 60) {
    statusLabel = 'مطابق جزئياً';
    statusColor = 'amber';
  } else {
    statusLabel = 'غير مطابق';
    statusColor = 'rose';
  }

  return {
    score,
    startMatched,
    destinationMatched,
    priceMatched,
    distanceMatched,
    timeMatched,
    distanceKm,
    statusLabel,
    statusColor,
    pickupToDeliveryDistanceKm,
  };
}
