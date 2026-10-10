import { BAHRAIN_AREAS, normalizeArabicText } from '../data/bahrainAreas';
import { BAHRAIN_LANDMARKS } from '../data/bahrainLandmarks';
import { detectPassengerDelivery } from './passengerClassifier';
import { PassengerDetection } from '../types';

export interface RawParsedResult {
  from: string;
  to: string;
  price: number;
  isPriceUnspecified?: boolean;
  passengerCount?: number;
  scheduledTime?: string;
  scheduledTimeMinutes?: number;
  isFutureSchedule?: boolean;
  phone: string;
  notes: string;
  confidence: number;
  canCreateOrder: boolean;
  passengerDetection: PassengerDetection;
}

/**
 * Converts Eastern Arabic numerals (٠-٩) to standard ASCII (0-9)
 */
export function convertArabicNumerals(str: string): string {
  if (!str) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicNumerals[i], 'g'), i.toString());
  }
  return result;
}

/**
 * Parses raw text from WhatsApp messages to extract delivery order parameters
 */
export function parseWhatsAppOrderText(rawText: string): RawParsedResult {
  if (!rawText || typeof rawText !== 'string') {
    return {
      from: '',
      to: '',
      price: 0,
      isPriceUnspecified: true,
      passengerCount: undefined,
      phone: '',
      notes: '',
      confidence: 0,
      canCreateOrder: false,
      passengerDetection: {
        level: 'goods_safe',
        label: 'توصيل بضائع معتمد',
        matchedPhrases: [],
        reason: 'النص فارغ',
        isForbidden: false,
      },
    };
  }

  const convertedText = convertArabicNumerals(rawText);
  const normalized = normalizeArabicText(convertedText);

  // 1. Detect Passenger Transport vs Goods Delivery first (أشخاص / ركاب مقابل بضائع)
  const passengerDetection = detectPassengerDelivery(rawText);
  const passengerCount = passengerDetection.passengerCount;

  // 2. Detect Phone Number (Bahrain format: 8 digits starting with 3, 6, 17 or prefixed with 973)
  let phone = '';
  const phoneRegex = /(?:\+?973|00973)?[\s-]*(3\d{7}|6\d{7}|17\d{6}|[36]\d{3}[\s-]?\d{4})/g;
  const phoneMatch = phoneRegex.exec(convertedText);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[\s-+]/g, '');
    if (!phone.startsWith('973') && phone.length === 8) {
      phone = '973' + phone;
    }
  }

  // 3. Smart Price Detection in BHD (دينار / د.ب / bd / bhd)
  // القاعدة: التمييز الذكي بين عدد الأشخاص وقيمة الأوردر
  // أي رقم يتبعه كلمة «أشخاص» أو «ركاب» لا يحسب كأجرة أبداً
  let price = 0;
  
  // Patterns with explicit currency units:
  // e.g. "10 دنانير", "بـ 10 دنانير", "السعر: 3.5 د.ب", "3 دينار", "3.0bd"
  const priceWithCurrencyPatterns = [
    // [Price prefix] [Number] [Currency]
    /(?:السعر|سعر|الأجر|الأجرة|أجرة|الأوردر|الطلب|المبلغ|الحساب|بقيمة)?\s*[:=]?\s*(?:بـ|ب)?\s*(\d+(?:\.\d+)?)\s*(?:دينار|دنانير|د\.ب|دب|دينار بحريني|bd|bhd)/i,
    // [Currency] [Number]
    /(?:دينار|دنانير|د\.ب|دب|bd|bhd)\s*[:=]?\s*(\d+(?:\.\d+)?)/i,
    // Standalone number + currency word
    /\b(\d+(?:\.\d+)?)\s*(?:دينار|دنانير|د\.ب|دب|bd|bhd)\b/i,
  ];

  for (const pattern of priceWithCurrencyPatterns) {
    const match = pattern.exec(convertedText);
    if (match && match[1]) {
      const parsedVal = parseFloat(match[1]);
      if (!isNaN(parsedVal) && parsedVal > 0 && parsedVal <= 100) {
        // Double check this match isn't a passenger count
        const afterMatch = convertedText.substring((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 20);
        if (!/(?:أشخاص|اشخاص|ركاب|أفراد|افراد|ناس|بنات|أطفال|اطفال|عمال)/i.test(afterMatch)) {
          price = parsedVal;
          break;
        }
      }
    }
  }

  // Explicit price prefix WITHOUT currency word (e.g. "السعر: 4", "الأجرة 5", "الحساب: 3.5")
  // MUST NOT match passenger counts like "5 أشخاص"
  if (price === 0) {
    const explicitPrefixPattern = /(?:السعر|سعر|الأجر|الأجرة|أجرة|الأوردر بـ|الطلب بـ|الحساب|المبلغ|بقيمة)\s*[:=]?\s*(?:بـ|ب)?\s*(\d+(?:\.\d+)?)/i;
    const match = explicitPrefixPattern.exec(convertedText);
    if (match && match[1]) {
      const parsedVal = parseFloat(match[1]);
      const afterMatch = convertedText.substring((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 20);
      const isPassengerCountWord = /(?:أشخاص|اشخاص|ركاب|أفراد|افراد|ناس|بنات|أطفال|اطفال|عمال)/i.test(afterMatch);
      if (!isPassengerCountWord && !isNaN(parsedVal) && parsedVal > 0 && parsedVal <= 100) {
        price = parsedVal;
      }
    }
  }

  // عدم اختراع سعر: إذا لم يُذكر السعر صراحة أو بالعملة، يُسجل السعر على أنه 0 وغير محدد (بالاتفاق)
  // تم إزالة التخمين العشوائي للأرقام المنفردة لضمان عدم الخلط بين عدد الركاب والسعر!

  // 3. Detect "From" (Start) and "To" (Destination) areas and landmarks
  let fromArea = '';
  let toArea = '';

  // Prepare unified list of searchable Bahrain places (Landmarks/Malls + Areas)
  interface SearchablePlace {
    name: string;
    keywords: string[];
    isLandmark: boolean;
    parentArea?: string;
  }

  const searchablePlaces: SearchablePlace[] = [
    // Malls & Landmarks (Moda Mall, Seef Mall, City Centre, Avenues, etc.)
    ...BAHRAIN_LANDMARKS.map((lm) => ({
      name: lm.name,
      keywords: lm.keywords,
      isLandmark: true,
      parentArea: lm.parentAreaName,
    })),
    // Standard Geographic Areas
    ...BAHRAIN_AREAS.map((a) => ({
      name: a.name,
      keywords: [a.name, a.nameEn],
      isLandmark: false,
    })),
  ];

  // Flatten and sort keywords by length descending so longer compound names match first
  interface KeywordMatchItem {
    placeName: string;
    keyword: string;
    normalizedKeyword: string;
    parentArea?: string;
  }

  const allKeywordItems: KeywordMatchItem[] = [];
  searchablePlaces.forEach((place) => {
    place.keywords.forEach((kw) => {
      if (kw && kw.trim()) {
        allKeywordItems.push({
          placeName: place.name,
          keyword: kw.trim(),
          normalizedKeyword: normalizeArabicText(kw.trim()),
          parentArea: place.parentArea,
        });
      }
    });
  });

  allKeywordItems.sort((a, b) => b.normalizedKeyword.length - a.normalizedKeyword.length);

  // Search patterns for explicit "From" and "To"
  // Patterns like "من [مودامول/منطقة] إلى [سار/منطقة]" or "استلام: [السيف مول] تسليم: [الرفاع]"
  for (const item of allKeywordItems) {
    const kw = item.normalizedKeyword;
    if (kw.length < 2) continue;

    // Look for "From" indicators before this place
    const fromPattern = new RegExp(`(?:من|استلام من|استلام|بيك اب من|بيك اب|موقع|تحميل من|فرع)\\s*(?:مجمع|مول|سوق|منطقة|قرية)?\\s*${kw}\\b`, 'i');
    if (!fromArea && fromPattern.test(normalized)) {
      fromArea = item.placeName;
    }

    // Look for "To" indicators before this place
    const toPattern = new RegExp(`(?:الى|إلى|ل|لي|تسليم الى|تسليم ل|تسليم|توصيل الى|توصيل ل|وجهة|مكان)\\s*(?:مجمع|مول|سوق|منطقة|قرية)?\\s*${kw}\\b`, 'i');
    if (!toArea && toPattern.test(normalized)) {
      toArea = item.placeName;
    }
  }

  // If either is missing, do a greedy presence scan in message for known places
  if (!fromArea || !toArea) {
    const foundPlaces: { name: string; index: number }[] = [];
    for (const item of allKeywordItems) {
      const kw = item.normalizedKeyword;
      if (kw.length < 2) continue;

      const idx = normalized.indexOf(kw);
      if (idx !== -1) {
        // Ensure not duplicate or subset of already matched longer span
        const alreadySub = foundPlaces.some((f) => Math.abs(f.index - idx) < 4);
        if (!alreadySub) {
          foundPlaces.push({ name: item.placeName, index: idx });
        }
      }
    }

    // Sort by position in string
    foundPlaces.sort((a, b) => a.index - b.index);

    if (foundPlaces.length >= 2) {
      if (!fromArea && !toArea) {
        fromArea = foundPlaces[0].name;
        toArea = foundPlaces[1].name;
      } else if (!fromArea) {
        const remaining = foundPlaces.find((f) => f.name !== toArea);
        if (remaining) fromArea = remaining.name;
      } else if (!toArea) {
        const remaining = foundPlaces.find((f) => f.name !== fromArea);
        if (remaining) toArea = remaining.name;
      }
    } else if (foundPlaces.length === 1) {
      if (!fromArea && !toArea) {
        fromArea = foundPlaces[0].name;
      }
    }
  }

  // Free-text Destination Fallback:
  // e.g. "اوردر من مودامول الى مكان معين" or "من السيف مول الى كافيه الزنج"
  if (!toArea && fromArea) {
    const toFreeMatch = /(?:الى|إلى|تسليم الى|تسليم ل|تسليم|توصيل الى|توصيل ل|وجهة)\s+([^\n\r،,]+)/i.exec(convertedText);
    if (toFreeMatch && toFreeMatch[1]) {
      let candidate = toFreeMatch[1].trim();
      // Remove any trailing price indicators or phone numbers
      candidate = candidate.replace(/(?:\s+ب?\s*\d+(?:\.\d+)?\s*(?:د\.ب|دب|دينار|bd|bhd)).*$/i, '').trim();
      candidate = candidate.replace(/(?:\s+(?:\+?973|00973)?[\s-]*(?:3\d{7}|6\d{7}|17\d{6})).*$/i, '').trim();
      candidate = candidate.replace(/\s+ب\s*$/i, '').trim();
      if (candidate.length >= 2 && candidate.length <= 40 && candidate !== fromArea) {
        toArea = candidate;
      }
    }
  }

  // If order intent is clearly present (e.g. "اوردر من مودامول", "طلب من السيف مول") but destination is unspecified:
  const hasOrderIntent = /(?:اوردر|أوردر|طلب|توصيل|مندوب|بيك اب|pickup|delivery)/i.test(normalized);
  if (!toArea && fromArea && hasOrderIntent) {
    toArea = 'حسب طلب الزبون 📍';
  }



  // 4. Notes / Package Type extraction (ensuring word boundaries)
  let notes = '';
  const noteKeywords = [
    'ورد', 'باقة', 'زهور', 'كيك', 'حلويات', 'عطور', 'هدية', 'أكل', 'مطعم',
    'وجبة', 'مستندات', 'أوراق', 'عباية', 'ملابس', 'شحنة', 'أمانات', 'كرتون'
  ];
  for (const kw of noteKeywords) {
    const kwRegex = new RegExp(`(?:^|[\\s،,.])${kw}(?:$|[\\s،,.])`, 'i');
    if (kwRegex.test(normalized)) {
      notes = kw;
      break;
    }
  }

  // 4b. Smart Scheduled Delivery Time Extraction (الساعة 8 مساءً / الساعة 6 صباحاً / مطلوب مندوب الساعة...)
  let scheduledTime: string | undefined = undefined;
  let scheduledTimeMinutes: number | undefined = undefined;
  let isFutureSchedule: boolean = false;

  // Pattern: (الساعة|ساعة|على الساعة|في حدود الساعة|توقيت)\s*(\d{1,2}(?::\d{2})?)\s*(صباحا|صباحاً|ص|مساء|مساءً|م|العصر|الظهر|المغرب|بالليل|في الليل|الصبح)?
  const scheduleRegex = /(?:الساعة|ساعة|على الساعة|في حدود الساعة|توقيت|موعد|وقت)\s*(\d{1,2})(?::(\d{2}))?\s*(صباحا|صباحاً|ص|مساء|مساءً|م|العصر|الظهر|المغرب|بالليل|في الليل|الصبح)?/i;
  const scheduleMatch = scheduleRegex.exec(convertedText);

  if (scheduleMatch) {
    const rawHour = parseInt(scheduleMatch[1], 10);
    const rawMin = scheduleMatch[2] ? parseInt(scheduleMatch[2], 10) : 0;
    const period = (scheduleMatch[3] || '').trim();

    if (rawHour >= 1 && rawHour <= 24) {
      let isPm = false;
      if (/مساء|مساءً|م|العصر|المغرب|بالليل|في الليل/i.test(period)) {
        isPm = true;
      } else if (/صباحا|صباحاً|ص|الصبح/i.test(period)) {
        isPm = false;
      } else if (rawHour >= 1 && rawHour <= 6) {
        // In Gulf business contexts, e.g. "الساعة 4" or "الساعة 5" usually refers to afternoon/evening
        isPm = true;
      }

      let hour24 = rawHour;
      if (isPm && hour24 < 12) hour24 += 12;
      if (!isPm && hour24 === 12) hour24 = 0;

      scheduledTimeMinutes = hour24 * 60 + rawMin;
      const displayPeriod = isPm ? 'مساءً' : 'صباحاً';
      const displayHour = rawHour > 12 ? rawHour - 12 : rawHour;
      const displayMin = rawMin > 0 ? `:${rawMin < 10 ? '0' + rawMin : rawMin}` : '';
      scheduledTime = `الساعة ${displayHour}${displayMin} ${displayPeriod}`;
      isFutureSchedule = true;
    }
  }

  // 5. Detect Passenger Transport vs Goods Delivery is already evaluated at step 1
  // Calculate confidence
  let confidence = 0;
  if (fromArea) confidence += 40;
  if (toArea) confidence += 40;
  if (price > 0) confidence += 10;
  if (phone) confidence += 10;

  const canCreateOrder = !!fromArea && !!toArea;
  const isPriceUnspecified = !price || price <= 0;

  return {
    from: fromArea,
    to: toArea,
    price: price > 0 ? price : 0,
    isPriceUnspecified,
    passengerCount: passengerDetection.passengerCount,
    scheduledTime,
    scheduledTimeMinutes,
    isFutureSchedule,
    phone,
    notes,
    confidence,
    canCreateOrder,
    passengerDetection,
  };
}
