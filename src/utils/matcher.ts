import { OrderFilter, OrderMatchBreakdown } from '../types';
import { calculateDistanceKm, findAreaByName } from '../data/bahrainAreas';

export interface MatcherLocation {
  latitude: number;
  longitude: number;
  areaName?: string;
  speedKmh?: number;
  heading?: number;
  accuracyMeters?: number;
  lastUpdated?: string;
}

export function evaluateOrderMatch(
  from: string,
  to: string,
  price: number,
  filter: OrderFilter,
  driverLocation: MatcherLocation | null
): OrderMatchBreakdown {
  const fromAreaObj = findAreaByName(from);
  const toAreaObj = findAreaByName(to);

  // 1. Pickup Location Match (مكان الاستلام من موقعي الحالي ونطاق التغطية والمسافة المقبولة)
  let distanceKm: number | null = null;
  let startMatched = false;

  if (driverLocation && fromAreaObj) {
    distanceKm = calculateDistanceKm(
      driverLocation.latitude,
      driverLocation.longitude,
      fromAreaObj.latitude,
      fromAreaObj.longitude
    );
    startMatched = distanceKm <= filter.coverageKm;
  } else if (!driverLocation) {
    // If no GPS/current location is determined yet, accept pending location fix
    startMatched = true;
  } else {
    // If driver location exists but specific area coordinate not recognized
    startMatched = true;
  }

  const distanceMatched = startMatched;

  // 2. Destination Match (وجهات التسليم المطلوبة)
  const destinationMatched = filter.destinations.length === 0 || filter.destinations.includes(to);

  // 3. Price Match (الحد الأدنى للأجرة)
  const priceMatched = price >= filter.minimumPrice;

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

  // 5. Time Window Match
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
