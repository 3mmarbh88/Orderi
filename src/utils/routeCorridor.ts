import { ParsedOrder } from '../types';
import { calculateDistanceKm, findAreaByName, normalizeArabicText } from '../data/bahrainAreas';
import { findLandmarkByName } from '../data/bahrainLandmarks';

export interface RouteCorridorResult {
  isSameRoute: boolean;
  score: number; // 0 to 100
  reason: string;
  detourKm: number;
  routeRelation: 'identical_route' | 'same_destination' | 'same_pickup' | 'on_the_way' | 'none';
  potentialExtraEarnings: number;
}

export interface ActiveRoute {
  id: string;
  from: string;
  to: string;
  price: number;
  acceptedAt: string;
}

// Well-defined Bahrain transport corridors
const BAHRAIN_CORRIDORS: Array<{ name: string; areas: string[] }> = [
  // محور المنامة - الرفاع (طريق الشيخ جابر الأحمد الصباح وطريق الاستقلال)
  {
    name: 'محور المنامة - الرفاع',
    areas: [
      'المنامة', 'السيف', 'السنابس', 'السلمانية', 'الزنج', 'البلاد القديم', 'أم الحصم', 
      'الماحوز', 'القضيبية', 'الحورة', 'توبلي', 'مدينة عيسى', 'سلماباد', 'عالي', 
      'سند', 'الرفاع', 'بو كوارة', 'الرفاع الشرقي', 'الرفاع الغربي', 'الحجيات', 'البحير'
    ]
  },
  // محور المنامة - المحرق (الجسور الثلاثة)
  {
    name: 'محور العاصمة - المحرق',
    areas: [
      'المنامة', 'الجفير', 'الحورة', 'القضيبية', 'رأس رمان', 'أم الحصم',
      'المحرق', 'البسيتين', 'عراد', 'الحد', 'قلالي', 'ديار المحرق', 'جزر أمواج', 'الدير', 'سماهيج'
    ]
  },
  // محور المنامة - البديع والشارع الشمالي
  {
    name: 'محور العاصمة - الشارع الشمالي',
    areas: [
      'المنامة', 'السيف', 'السنابس', 'طشان', 'جدحفص', 'الديه', 'السهلة', 'بو قوة', 
      'جبلة حبشي', 'سار', 'الجنبية', 'المرخ', 'مقابة', 'الشاخورة', 'أبو صيبع', 'باربار', 'الدراز', 'بني جمرة', 'البديع'
    ]
  },
  // محور المنامة - مدينة حمد (شارع الشيخ خليفة بن سلمان السريع)
  {
    name: 'محور العاصمة - مدينة حمد',
    areas: [
      'المنامة', 'السيف', 'السنابس', 'السهلة', 'بو قوة', 'سلماباد', 'بوري', 
      'مدينة حمد', 'اللوزي', 'دمستان', 'كرزكان', 'المالكية', 'صدد', 'الهملة'
    ]
  },
  // محور مدينة عيسى والرفاع - مدينة حمد
  {
    name: 'محور الوسطى - الغربية',
    areas: [
      'مدينة عيسى', 'عالي', 'الرفاع', 'بو كوارة', 'الرفاع الشرقي', 'الرفاع الغربي', 
      'بوري', 'مدينة حمد', 'اللوزي', 'دمستان', 'الزلاق'
    ]
  }
];

function resolveAreaCoords(name: string): { latitude: number; longitude: number; name: string } | null {
  if (!name || typeof name !== 'string') return null;
  const areaObj = findAreaByName(name);
  if (areaObj) {
    return { latitude: areaObj.latitude, longitude: areaObj.longitude, name: areaObj.name };
  }
  const landmark = findLandmarkByName(name);
  if (landmark) {
    return { latitude: landmark.latitude, longitude: landmark.longitude, name: landmark.name };
  }
  return null;
}

/**
 * Checks whether a candidate order is on the same road/corridor as the active accepted order.
 */
export function checkOrderOnSameRoute(
  candidateOrder: ParsedOrder,
  activeRoute: ActiveRoute
): RouteCorridorResult {
  const defaultResult: RouteCorridorResult = {
    isSameRoute: false,
    score: 0,
    reason: '',
    detourKm: 999,
    routeRelation: 'none',
    potentialExtraEarnings: candidateOrder.price || 0,
  };

  if (!candidateOrder || !activeRoute) return defaultResult;
  if (candidateOrder.id === activeRoute.id) return defaultResult;

  const activeFrom = normalizeArabicText(activeRoute.from || '');
  const activeTo = normalizeArabicText(activeRoute.to || '');
  const candFrom = normalizeArabicText(candidateOrder.from || '');
  const candTo = normalizeArabicText(candidateOrder.to || '');

  if (!candFrom || !candTo || !activeFrom || !activeTo) return defaultResult;

  // 1. Identical route (نفس المشوار بالضبط)
  if (candFrom === activeFrom && candTo === activeTo) {
    return {
      isSameRoute: true,
      score: 100,
      reason: `نفس المشوار بالضبط (${candidateOrder.from} ← ${candidateOrder.to}) - مشوار مضاعف بنفس الوجهة!`,
      detourKm: 0,
      routeRelation: 'identical_route',
      potentialExtraEarnings: candidateOrder.price || 0,
    };
  }

  // 2. Same Destination (نفس الوجهة ونقطة الوصول)
  if (candTo === activeTo) {
    return {
      isSameRoute: true,
      score: 95,
      reason: `نفس وجهة الوصول (${candidateOrder.to}) - استلام إضافي في طريقك إلى نفس المنطقة!`,
      detourKm: 0.8,
      routeRelation: 'same_destination',
      potentialExtraEarnings: candidateOrder.price || 0,
    };
  }

  // 3. Same Pickup (نفس نقطة الاستلام)
  if (candFrom === activeFrom) {
    return {
      isSameRoute: true,
      score: 90,
      reason: `نفس مكان الاستلام (${candidateOrder.from}) - استلام طلبين من نفس المكان لتسليمهما معاً!`,
      detourKm: 1.5,
      routeRelation: 'same_pickup',
      potentialExtraEarnings: candidateOrder.price || 0,
    };
  }

  // 4. Geometric coordinate distance & projection check
  const pOrig = resolveAreaCoords(activeRoute.from);
  const pDest = resolveAreaCoords(activeRoute.to);
  const cOrig = resolveAreaCoords(candidateOrder.from);
  const cDest = resolveAreaCoords(candidateOrder.to);

  if (pOrig && pDest && cOrig && cDest) {
    const mainTripDist = calculateDistanceKm(pOrig.latitude, pOrig.longitude, pDest.latitude, pDest.longitude);

    // Calculate detour if driver does: pOrig -> cOrig -> cDest -> pDest
    const d1 = calculateDistanceKm(pOrig.latitude, pOrig.longitude, cOrig.latitude, cOrig.longitude);
    const d2 = calculateDistanceKm(cOrig.latitude, cOrig.longitude, cDest.latitude, cDest.longitude);
    const d3 = calculateDistanceKm(cDest.latitude, cDest.longitude, pDest.latitude, pDest.longitude);
    const combinedTotal = d1 + d2 + d3;
    const detourKm = Math.max(0, Math.round((combinedTotal - mainTripDist) * 10) / 10);

    // Vector projection along direction of travel
    const vecX = pDest.longitude - pOrig.longitude;
    const vecY = pDest.latitude - pOrig.latitude;
    const lenSq = vecX * vecX + vecY * vecY;

    if (lenSq > 0.00001) {
      // Projection of cand pickup
      const tOrig = ((cOrig.longitude - pOrig.longitude) * vecX + (cOrig.latitude - pOrig.latitude) * vecY) / lenSq;
      // Projection of cand dropoff
      const tDest = ((cDest.longitude - pOrig.longitude) * vecX + (cDest.latitude - pOrig.latitude) * vecY) / lenSq;

      // Distance from candidate pickup to active line
      const perpOrigLat = pOrig.latitude + tOrig * vecY;
      const perpOrigLon = pOrig.longitude + tOrig * vecX;
      const perpDistOrigKm = calculateDistanceKm(cOrig.latitude, cOrig.longitude, perpOrigLat, perpOrigLon);

      // Distance from candidate dropoff to active line
      const perpDestLat = pOrig.latitude + tDest * vecY;
      const perpDestLon = pOrig.longitude + tDest * vecX;
      const perpDistDestKm = calculateDistanceKm(cDest.latitude, cDest.longitude, perpDestLat, perpDestLon);

      // Check if both points lie in the corridor along travel direction
      const isAlongDirection = tOrig >= -0.2 && tDest <= 1.25 && tDest >= (tOrig - 0.2);
      const isNarrowCorridor = perpDistOrigKm <= 4.2 && perpDistDestKm <= 4.2;

      if ((isAlongDirection && isNarrowCorridor) || detourKm <= 4.5) {
        const score = Math.max(75, Math.min(95, Math.round(100 - (detourKm * 5))));
        return {
          isSameRoute: true,
          score,
          reason: `على نفس الطريق تماماً (انحراف بسيط ${detourKm} كم فقط) بين ${activeRoute.from} و ${activeRoute.to}`,
          detourKm,
          routeRelation: 'on_the_way',
          potentialExtraEarnings: candidateOrder.price || 0,
        };
      }
    }
  }

  // 5. Corridor-based lookup (e.g. Manama -> Riffa corridor)
  for (const corridor of BAHRAIN_CORRIDORS) {
    const activeFromIdx = corridor.areas.findIndex(a => normalizeArabicText(a) === activeFrom || activeFrom.includes(normalizeArabicText(a)));
    const activeToIdx = corridor.areas.findIndex(a => normalizeArabicText(a) === activeTo || activeTo.includes(normalizeArabicText(a)));

    if (activeFromIdx !== -1 && activeToIdx !== -1 && activeFromIdx !== activeToIdx) {
      const candFromIdx = corridor.areas.findIndex(a => normalizeArabicText(a) === candFrom || candFrom.includes(normalizeArabicText(a)));
      const candToIdx = corridor.areas.findIndex(a => normalizeArabicText(a) === candTo || candTo.includes(normalizeArabicText(a)));

      if (candFromIdx !== -1 && candToIdx !== -1) {
        const activeDir = Math.sign(activeToIdx - activeFromIdx);
        const candDir = Math.sign(candToIdx - candFromIdx);

        // Same corridor direction (e.g. both moving from North/Capital towards South/Riffa)
        if (activeDir !== 0 && activeDir === candDir) {
          const minIdx = Math.min(activeFromIdx, activeToIdx);
          const maxIdx = Math.max(activeFromIdx, activeToIdx);

          if (
            candFromIdx >= minIdx - 1 && candFromIdx <= maxIdx + 1 &&
            candToIdx >= minIdx - 1 && candToIdx <= maxIdx + 1
          ) {
            return {
              isSameRoute: true,
              score: 88,
              reason: `ضمن ${corridor.name} المتجه من ${activeRoute.from} إلى ${activeRoute.to} 🛣️`,
              detourKm: 1.8,
              routeRelation: 'on_the_way',
              potentialExtraEarnings: candidateOrder.price || 0,
            };
          }
        }
      }
    }
  }

  return defaultResult;
}

/**
 * Filter all orders in feed that are on the same route as the active accepted order.
 */
export function findOrdersOnSameRoute(
  orders: ParsedOrder[],
  activeRoute: ActiveRoute
): Array<{ order: ParsedOrder; match: RouteCorridorResult }> {
  if (!activeRoute || !orders.length) return [];

  const matched: Array<{ order: ParsedOrder; match: RouteCorridorResult }> = [];

  for (const order of orders) {
    const match = checkOrderOnSameRoute(order, activeRoute);
    if (match.isSameRoute) {
      matched.push({ order, match });
    }
  }

  return matched.sort((a, b) => b.match.score - a.match.score);
}
