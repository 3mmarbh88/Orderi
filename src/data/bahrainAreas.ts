import { AreaLocation } from '../types';

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

export function findAreaByName(name: string): AreaLocation | undefined {
  if (!name) return undefined;
  const normalized = normalizeArabicText(name);
  return BAHRAIN_AREAS.find((area) => {
    const areaNorm = normalizeArabicText(area.name);
    return areaNorm === normalized || areaNorm.includes(normalized) || normalized.includes(areaNorm);
  });
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

export const POPULAR_WHATSAPP_GROUPS = [
  'قروب مندوبي البحرين 🇧🇭',
  'طلبات التوصيل - المنامة والمحرق',
  'توصيل سريع الرفاع ومدينة عيسى',
  'شبكة مناديب التوصيل السريع',
  'قروب أصحاب المشاريع والأسر المنتجة',
  'توصيل هدايا وورود البحرين',
  'طلبات المطاعم والكافيهات البحرين',
];
