import { AreaLocation } from '../types';
import { BAHRAIN_LANDMARKS, findLandmarkByName } from './bahrainLandmarks';

export const BAHRAIN_AREAS: AreaLocation[] = [
  // العاصمة (Capital Governorate)
  { id: 'manama', name: 'المنامة', nameEn: 'Manama', governorate: 'العاصمة', latitude: 26.2235, longitude: 50.5876 },
  { id: 'juffair', name: 'الجفير', nameEn: 'Juffair', governorate: 'العاصمة', latitude: 26.2150, longitude: 50.6000 },
  { id: 'adliya', name: 'العدلية', nameEn: 'Adliya', governorate: 'العاصمة', latitude: 26.2150, longitude: 50.5960 },
  { id: 'seef', name: 'السيف', nameEn: 'Seef', governorate: 'العاصمة', latitude: 26.2360, longitude: 50.5350 },
  { id: 'sanabis', name: 'السنابس', nameEn: 'Sanabis', governorate: 'العاصمة', latitude: 26.2300, longitude: 50.5650 },
  { id: 'zinj', name: 'الزنج', nameEn: 'Zinj', governorate: 'العاصمة', latitude: 26.1900, longitude: 50.5850 },
  { id: 'bilad_al_qadeem', name: 'البلاد القديم', nameEn: 'Bilad Al Qadeem', governorate: 'العاصمة', latitude: 26.1900, longitude: 50.5700 },
  { id: 'umm_al_hassam', name: 'أم الحصم', nameEn: 'Umm Al Hassam', governorate: 'العاصمة', latitude: 26.2050, longitude: 50.5950 },
  { id: 'quful', name: 'القفول', nameEn: 'Qufool', governorate: 'العاصمة', latitude: 26.2220, longitude: 50.5680 },
  { id: 'salmaniya', name: 'السلمانية', nameEn: 'Salmaniya', governorate: 'العاصمة', latitude: 26.2100, longitude: 50.5850 },
  { id: 'tubli', name: 'توبلي', nameEn: 'Tubli', governorate: 'العاصمة', latitude: 26.1800, longitude: 50.5600 },
  { id: 'sitra', name: 'سترة', nameEn: 'Sitra', governorate: 'العاصمة', latitude: 26.1547, longitude: 50.6206 },
  { id: 'nabih_saleh', name: 'النبيه صالح', nameEn: 'Nabih Saleh', governorate: 'العاصمة', latitude: 26.1900, longitude: 50.6050 },
  { id: 'mahuz', name: 'الماحوز', nameEn: 'Mahooz', governorate: 'العاصمة', latitude: 26.2080, longitude: 50.5890 },
  { id: 'gudaibiya', name: 'القضيبية', nameEn: 'Gudaibiya', governorate: 'العاصمة', latitude: 26.2200, longitude: 50.5920 },
  { id: 'hoora', name: 'الحورة', nameEn: 'Hoora', governorate: 'العاصمة', latitude: 26.2340, longitude: 50.5950 },
  { id: 'ras_ruman', name: 'رأس رمان', nameEn: 'Ras Ruman', governorate: 'العاصمة', latitude: 26.2350, longitude: 50.5850 },
  { id: 'salhabad', name: 'سماهيج / الصالحية', nameEn: 'Salhiya', governorate: 'العاصمة', latitude: 26.2020, longitude: 50.5580 },
  { id: 'khamis', name: 'الخميس', nameEn: 'Khamis', governorate: 'العاصمة', latitude: 26.2050, longitude: 50.5480 },
  { id: 'daih', name: 'الديه', nameEn: 'Al Daih', governorate: 'العاصمة', latitude: 26.2260, longitude: 50.5500 },
  { id: 'burhama', name: 'البرهامة', nameEn: 'Burhama', governorate: 'العاصمة', latitude: 26.2210, longitude: 50.5580 },

  // المحرق (Muharraq Governorate)
  { id: 'muharraq', name: 'المحرق', nameEn: 'Muharraq', governorate: 'المحرق', latitude: 26.2572, longitude: 50.6119 },
  { id: 'busaiteen', name: 'البسيتين', nameEn: 'Busaiteen', governorate: 'المحرق', latitude: 26.2700, longitude: 50.6050 },
  { id: 'arad', name: 'عراد', nameEn: 'Arad', governorate: 'المحرق', latitude: 26.2530, longitude: 50.6200 },
  { id: 'hidd', name: 'الحد', nameEn: 'Hidd', governorate: 'المحرق', latitude: 26.2450, longitude: 50.6550 },
  { id: 'galali', name: 'قلالي', nameEn: 'Galali', governorate: 'المحرق', latitude: 26.2600, longitude: 50.6500 },
  { id: 'diyar_al_muharraq', name: 'ديار المحرق', nameEn: 'Diyar Al Muharraq', governorate: 'المحرق', latitude: 26.2850, longitude: 50.6300 },
  { id: 'amwaj', name: 'جزر أمواج', nameEn: 'Amwaj Islands', governorate: 'المحرق', latitude: 26.2820, longitude: 50.6620 },
  { id: 'dair', name: 'الدير', nameEn: 'Al Dair', governorate: 'المحرق', latitude: 26.2680, longitude: 50.6350 },
  { id: 'samaheej', name: 'سماهيج', nameEn: 'Samaheej', governorate: 'المحرق', latitude: 26.2700, longitude: 50.6400 },
  { id: 'halat_numaim', name: 'حالة النعيم', nameEn: 'Halat Nuaim', governorate: 'المحرق', latitude: 26.2400, longitude: 50.6380 },
  { id: 'halat_salta', name: 'حالة بو ماهر والصلطة', nameEn: 'Halat Bu Maher', governorate: 'المحرق', latitude: 26.2480, longitude: 50.6150 },

  // الشمالية (Northern Governorate)
  { id: 'bu_quwah', name: 'بو قوة', nameEn: 'Bu Quwah', governorate: 'الشمالية', latitude: 26.2047, longitude: 50.5200 },
  { id: 'sar', name: 'سار', nameEn: 'Saar', governorate: 'الشمالية', latitude: 26.2050, longitude: 50.5100 },
  { id: 'janabiya', name: 'الجنبية', nameEn: 'Janabiya', governorate: 'الشمالية', latitude: 26.2110, longitude: 50.5060 },
  { id: 'budaiya', name: 'البديع', nameEn: 'Budaiya', governorate: 'الشمالية', latitude: 26.2180, longitude: 50.4780 },
  { id: 'diraz', name: 'الدراز', nameEn: 'Diraz', governorate: 'الشمالية', latitude: 26.2300, longitude: 50.4775 },
  { id: 'barbar', name: 'باربار', nameEn: 'Barbar', governorate: 'الشمالية', latitude: 26.2160, longitude: 50.4880 },
  { id: 'karrana', name: 'كرانة', nameEn: 'Karrana', governorate: 'الشمالية', latitude: 26.2450, longitude: 50.4850 },
  { id: 'jidhafs', name: 'جدحفص', nameEn: 'Jidhafs', governorate: 'الشمالية', latitude: 26.2186, longitude: 50.5478 },
  { id: 'hamala', name: 'الهملة', nameEn: 'Hamala', governorate: 'الشمالية', latitude: 26.1740, longitude: 50.4780 },
  { id: 'jasra', name: 'الجسرة', nameEn: 'Jasra', governorate: 'الشمالية', latitude: 26.1600, longitude: 50.4500 },
  { id: 'malkiya', name: 'المالكية', nameEn: 'Malkiya', governorate: 'الشمالية', latitude: 26.2050, longitude: 50.4620 },
  { id: 'karzakan', name: 'كرزكان', nameEn: 'Karzakan', governorate: 'الشمالية', latitude: 26.1700, longitude: 50.4500 },
  { id: 'dumistan', name: 'دمستان', nameEn: 'Dumistan', governorate: 'الشمالية', latitude: 26.1800, longitude: 50.4450 },
  { id: 'shahrakan', name: 'شهركان', nameEn: 'Shahrakan', governorate: 'الشمالية', latitude: 26.1650, longitude: 50.4550 },
  { id: 'al_qurayyah', name: 'القرية', nameEn: 'Al Qurayyah', governorate: 'الشمالية', latitude: 26.1900, longitude: 50.5000 },
  { id: 'hamad_town', name: 'مدينة حمد', nameEn: 'Hamad Town', governorate: 'الشمالية', latitude: 26.1150, longitude: 50.5069 },
  // Al Lawzi / إسكان اللوزي: use an area-level coordinate, not a street-level pin.
  { id: 'lawzi', name: 'اللوزي', nameEn: 'Al Lawzi', governorate: 'الشمالية', latitude: 26.1217, longitude: 50.4891 },
  { id: 'bouri', name: 'بوري', nameEn: 'Bouri', governorate: 'الشمالية', latitude: 26.1650, longitude: 50.4950 },
  { id: 'maqaba', name: 'مقابة', nameEn: 'Maqaba', governorate: 'الشمالية', latitude: 26.2120, longitude: 50.5200 },
  { id: 'shakhoora', name: 'الشاخورة', nameEn: 'Shakhoora', governorate: 'الشمالية', latitude: 26.2200, longitude: 50.5150 },
  { id: 'abu_saiba', name: 'أبو صيبع', nameEn: 'Abu Saiba', governorate: 'الشمالية', latitude: 26.2250, longitude: 50.5050 },
  { id: 'markh', name: 'المرخ', nameEn: 'Al Markh', governorate: 'الشمالية', latitude: 26.2050, longitude: 50.4950 },
  { id: 'bani_jamrah', name: 'بني جمرة', nameEn: 'Bani Jamrah', governorate: 'الشمالية', latitude: 26.2180, longitude: 50.4650 },
  { id: 'salmabad', name: 'سلماباد', nameEn: 'Salmabad', governorate: 'الشمالية', latitude: 26.1850, longitude: 50.5350 },
  { id: 'sehla', name: 'السهلة', nameEn: 'Sehla', governorate: 'الشمالية', latitude: 26.2000, longitude: 50.5400 },
  { id: 'tashan', name: 'طشان', nameEn: 'Tashan', governorate: 'الشمالية', latitude: 26.2150, longitude: 50.5500 },
  { id: 'sadad', name: 'صدد', nameEn: 'Sadad', governorate: 'الشمالية', latitude: 26.1550, longitude: 50.4600 },

  // الجنوبية (Southern Governorate)
  { id: 'bu_kowarah', name: 'بو كوارة', nameEn: 'Bu Kowarah', governorate: 'الجنوبية', latitude: 26.1382, longitude: 50.5657 },
  { id: 'riffa', name: 'الرفاع', nameEn: 'Riffa', governorate: 'الجنوبية', latitude: 26.1300, longitude: 50.5550 },
  { id: 'riffa_sharqi', name: 'الرفاع الشرقي', nameEn: 'East Riffa', governorate: 'الجنوبية', latitude: 26.1200, longitude: 50.5700 },
  { id: 'riffa_gharbi', name: 'الرفاع الغربي', nameEn: 'West Riffa', governorate: 'الجنوبية', latitude: 26.1380, longitude: 50.5400 },
  { id: 'riffa_shamali', name: 'الرفاع الشمالي / الحنينية', nameEn: 'North Riffa', governorate: 'الجنوبية', latitude: 26.1320, longitude: 50.5480 },
  { id: 'buhair', name: 'البحير', nameEn: 'Al Buhair', governorate: 'الجنوبية', latitude: 26.1450, longitude: 50.5650 },
  { id: 'isa_town', name: 'مدينة عيسى', nameEn: 'Isa Town', governorate: 'الجنوبية', latitude: 26.1736, longitude: 50.5478 },
  { id: 'aali', name: 'عالي', nameEn: 'Aali', governorate: 'الجنوبية', latitude: 26.1500, longitude: 50.5270 },
  { id: 'sanad', name: 'سند', nameEn: 'Sanad', governorate: 'الجنوبية', latitude: 26.1600, longitude: 50.5800 },
  { id: 'nuwaidrat', name: 'النويدرات', nameEn: 'Nuwaidrat', governorate: 'الجنوبية', latitude: 26.1400, longitude: 50.6100 },
  { id: 'maameer', name: 'المعامير', nameEn: 'Maameer', governorate: 'الجنوبية', latitude: 26.1400, longitude: 50.6250 },
  { id: 'eker', name: 'العكر', nameEn: 'Eker', governorate: 'الجنوبية', latitude: 26.1400, longitude: 50.6350 },
  { id: 'zallaq', name: 'الزلاق', nameEn: 'Zallaq', governorate: 'الجنوبية', latitude: 26.0480, longitude: 50.4900 },
  { id: 'safra', name: 'السافرة', nameEn: 'Al Safra', governorate: 'الجنوبية', latitude: 26.1050, longitude: 50.5580 },
  { id: 'jaww', name: 'جو', nameEn: 'Jaww', governorate: 'الجنوبية', latitude: 26.0020, longitude: 50.6200 },
  { id: 'asker', name: 'عسكر', nameEn: 'Askar', governorate: 'الجنوبية', latitude: 26.0650, longitude: 50.6250 },
  { id: 'durrat_al_bahrain', name: 'درة البحرين', nameEn: 'Durrat Al Bahrain', governorate: 'الجنوبية', latitude: 25.8350, longitude: 50.5900 },
];

/**
 * Calculate distance between two coordinates in Kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Common Bahraini place-name abbreviations used in WhatsApp order messages.
 * Roundabout numbers are only resolved to Hamad Town at area level here; they
 * must not be treated as precise roundabout coordinates until verified map
 * coordinates are added to the dedicated places dataset.
 */
export const BAHRAIN_AREA_ALIASES: Record<string, string> = {
  'م عيسى': 'isa_town',
  'م. عيسى': 'isa_town',
  'مدينه عيسى': 'isa_town',
  'مدينة عيسى': 'isa_town',
  'isa town': 'isa_town',
  'isa-town': 'isa_town',
  'م حمد': 'hamad_town',
  'م. حمد': 'hamad_town',
  'مدينه حمد': 'hamad_town',
  'مدينة حمد': 'hamad_town',
  'hamad town': 'hamad_town',
  'hamad-town': 'hamad_town',
  'أبو قوة': 'bu_quwah',
  'ابو قوة': 'bu_quwah',
  'أبوقوة': 'bu_quwah',
  'ابوقوة': 'bu_quwah',
  'بو قوة': 'bu_quwah',
  'بو قوه': 'bu_quwah',
  'abu quwah': 'bu_quwah',
  'abu quwa': 'bu_quwah',
  'bu quwah': 'bu_quwah',
  'أبو كوارة': 'bu_kowarah',
  'ابو كوارة': 'bu_kowarah',
  'أبو كواره': 'bu_kowarah',
  'ابو كواره': 'bu_kowarah',
  'بو كوارة': 'bu_kowarah',
  'بو كواره': 'bu_kowarah',
  'بوكوارة': 'bu_kowarah',
  'بوكواره': 'bu_kowarah',
  'abu kowarah': 'bu_kowarah',
  'abu kuwarah': 'bu_kowarah',
  'bu kowarah': 'bu_kowarah',
  'bu kuwarah': 'bu_kowarah',
  // Common WhatsApp spelling mistakes and shorthand for Al Lawzi.
  'الوزي': 'lawzi',
  'اللوزى': 'lawzi',
  'لوزي': 'lawzi',
  'اللوزي': 'lawzi',
  'al lawzi': 'lawzi',
  'al-lawzi': 'lawzi',
  'lawzi': 'lawzi',
  'al lozi': 'lawzi',
  'lozi': 'lawzi',
};

function compactPlaceText(value: string): string {
  return normalizeArabicText(value).replace(/[\s.,،؛:()\-_/]/g, '');
}

function levenshteinDistance(a: string, b: string): number {
  const left = Array.from(a);
  const right = Array.from(b);
  const row = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    let previousDiagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previousDiagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      previousDiagonal = old;
    }
  }
  return row[right.length];
}

function findUniqueTypoCorrection(name: string): AreaLocation | undefined {
  const tokens = normalizeArabicText(name)
    .split(/[^\\p{L}\\p{N}]+/u)
    .filter((token) => token.length >= 4);
  const candidates = new Map<string, string>();
  for (const [alias, areaId] of Object.entries(BAHRAIN_AREA_ALIASES)) {
    const normalizedAlias = normalizeArabicText(alias).replace(/[^\\p{L}\\p{N}]/gu, '');
    if (normalizedAlias.length >= 4) candidates.set(normalizedAlias, areaId);
  }
  for (const area of BAHRAIN_AREAS) {
    const normalizedName = normalizeArabicText(area.name).replace(/[^\\p{L}\\p{N}]/gu, '');
    if (normalizedName.length >= 4) candidates.set(normalizedName, area.id);
  }

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestIds = new Set<string>();
  for (const token of tokens) {
    const compactToken = token.replace(/[^\\p{L}\\p{N}]/gu, '');
    for (const [candidate, areaId] of candidates) {
      if (Math.abs(compactToken.length - candidate.length) > 2) continue;
      const distance = levenshteinDistance(compactToken, candidate);
      const maxDistance = compactToken.length <= 5 ? 1 : 2;
      if (distance > maxDistance) continue;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIds = new Set([areaId]);
      } else if (distance === bestDistance) {
        bestIds.add(areaId);
      }
    }
  }

  // Correct only when the closest spelling points to one unambiguous area.
  if (bestIds.size !== 1) return undefined;
  const id = Array.from(bestIds)[0];
  return BAHRAIN_AREAS.find((area) => area.id === id);
}

export function findAreaByName(name: string): AreaLocation | undefined {
  if (!name) return undefined;
  const normalized = normalizeArabicText(name);
  const compact = compactPlaceText(name);

  // 0. Resolve local abbreviations even when embedded in a pickup/drop-off sentence.
  // Matching is still area-level: this does not claim an exact street or roundabout pin.
  for (const [alias, areaId] of Object.entries(BAHRAIN_AREA_ALIASES)) {
    const aliasCompact = compactPlaceText(alias);
    if (compact === aliasCompact || compact.includes(aliasCompact)) {
      const aliasedArea = BAHRAIN_AREAS.find((area) => area.id === areaId);
      if (aliasedArea) return aliasedArea;
    }
  }

  // In local WhatsApp shorthand, numbered roundabouts refer to Hamad Town.
  // Return only the town's general location until each roundabout has verified coordinates.
  const mentionsHamadTown = /مدينة\s*حمد|مدينه\s*حمد|م\.?\s*حمد|hamad\s*town/i.test(name);
  const mentionsNumberedRoundabout = /(?:دوار(?:\s*رقم)?|roundabout)\s*[0-9٠-٩]+/i.test(name);
  if (mentionsNumberedRoundabout && (mentionsHamadTown || /(?:^|[\s،,])(?:دوار(?:\s*رقم)?|roundabout)\s*[0-9٠-٩]+(?:$|[\s،,])/i.test(name))) {
    return BAHRAIN_AREAS.find((area) => area.id === 'hamad_town');
  }


  // 1. Direct match with standard Bahrain areas
  const directArea = BAHRAIN_AREAS.find((area) => {
    const areaNorm = normalizeArabicText(area.name);
    return areaNorm === normalized || areaNorm.includes(normalized) || normalized.includes(areaNorm);
  });
  if (directArea) return directArea;

  // 2. Conservative typo correction for local area names (unique nearest match only).
  const correctedArea = findUniqueTypoCorrection(name);
  if (correctedArea) return correctedArea;

  // 3. Intelligent match with Bahrain malls & landmarks (e.g. مودامول، السيف مول، سيتي سنتر، الأفنيوز)
  const landmark = findLandmarkByName(name);
  if (landmark) {
    return {
      id: landmark.id,
      name: landmark.name,
      nameEn: landmark.nameEn,
      governorate: landmark.governorate as any,
      latitude: landmark.latitude,
      longitude: landmark.longitude,
    };
  }

  return undefined;
}

export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, ''); // Remove tashkeel/diacritics
}

/** Replace only uniquely matched location tokens with their canonical area names. */
export function correctBahrainAreaTyposInText(text: string): string {
  if (!text) return text;
  return text.replace(/[\\p{L}\\p{N}]+/gu, (token) => {
    if (token.length < 4) return token;
    const corrected = findUniqueTypoCorrection(token);
    return corrected ? corrected.name : token;
  });
}

export function findNearestArea(lat: number, lon: number): { area: AreaLocation; distanceKm: number } {
  let nearest = BAHRAIN_AREAS[0];
  let minDistance = calculateDistanceKm(lat, lon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < BAHRAIN_AREAS.length; i++) {
    const current = BAHRAIN_AREAS[i];
    const dist = calculateDistanceKm(lat, lon, current.latitude, current.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = current;
    }
  }

  return { area: nearest, distanceKm: minDistance };
}

export const POPULAR_WHATSAPP_GROUPS: string[] = [];
