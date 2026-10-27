import { BAHRAIN_AREAS, normalizeArabicText } from '../data/bahrainAreas';
import { BAHRAIN_LANDMARKS } from '../data/bahrainLandmarks';
import { detectPassengerDelivery } from './passengerClassifier';
import { detectAdvertisementMessage } from './advertisementClassifier';
import { PassengerDetection } from '../types';
import { normalizeArabicMessageForMatching } from './arabicMessageNormalizer';

export interface RawParsedResult {
  from: string;
  to: string;
  price: number;
  /** Explicit number of orders advertised, when the message states it. */
  orderCount?: number;
  isPriceUnspecified?: boolean;
  passengerCount?: number;
  scheduledTime?: string;
  scheduledTimeMinutes?: number;
  isFutureSchedule?: boolean;
  phone: string;
  notes: string;
  confidence: number;
  canCreateOrder: boolean;
  /** True when repeated area shorthand means a same-area trip (e.g. محرق محرق). */
  sameAreaShorthand?: boolean;
  /** True when this message promotes a service/business instead of requesting a delivery. */
  isAdvertisement?: boolean;
  advertisementReason?: string;
  passengerDetection: PassengerDetection;
  advertiserName?: string;
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
/**
 * Bounded edit distance for local typo tolerance. Stops once the limit is exceeded.
 * This is intentionally conservative: short/common words are never fuzzy-matched.
 */
function boundedEditDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length];
}

function getPlaceTypoLimit(keyword: string): number {
  // Keep fuzzy matching conservative to avoid confusing nearby or similarly named places.
  if (keyword.length < 4) return 0;
  return keyword.length <= 5 ? 1 : 2;
}

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
  const normalized = normalizeArabicText(normalizeArabicMessageForMatching(convertedText));
  const advertisementDetection = detectAdvertisementMessage(rawText);

  // Explicit order quantity: "اوردرين", "2 اوردرات", "ثلاثة طلبات".
  // A trailing number without the word order is not treated as an order count.
  let orderCount: number | undefined;
  const numericOrderCount = /(?:^|[\s،,])([1-9]\d?)\s*(?:اوردرات|اوردر|طلبات|طلب)(?=$|[\s،,.])/i.exec(normalized);
  if (numericOrderCount) {
    const value = Number(numericOrderCount[1]);
    if (value >= 1 && value <= 20) orderCount = value;
  } else if (/(?:اوردرين|اوردران|طلبين|طلبان)/i.test(normalized)) {
    orderCount = 2;
  } else if (/(?:ثلاثه|ثلاث|ثلاثة)\s*(?:اوردرات|طلبات|اوردر|طلب)/i.test(normalized)) {
    orderCount = 3;
  } else if (/(?:اربعه|اربع|أربعة)\s*(?:اوردرات|طلبات|اوردر|طلب)/i.test(normalized)) {
    orderCount = 4;
  } else if (/(?:خمسه|خمس|خمسة)\s*(?:اوردرات|طلبات|اوردر|طلب)/i.test(normalized)) {
    orderCount = 5;
  }

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

  const areaAliasesById: Record<string, string[]> = {
    isa_town: ['م عيسى', 'م. عيسى', 'مدينه عيسى', 'مدينة عيسى'],
    hamad_town: [
      'م حمد', 'م. حمد', 'مدينه حمد', 'مدينة حمد',
      ...Array.from({ length: 30 }, (_, index) => `دوار ${index + 1}`),
      ...Array.from({ length: 30 }, (_, index) => `دوار رقم ${index + 1}`),
      ...Array.from({ length: 30 }, (_, index) => `roundabout ${index + 1}`),
    ],
    manama: ['منامه', 'المنامه'],
    muharraq: ['محرق', 'المحرق'],
  };

  const searchablePlaces: SearchablePlace[] = [
    // Malls & Landmarks (Moda Mall, Seef Mall, City Centre, Avenues, etc.)
    ...BAHRAIN_LANDMARKS.map((lm) => ({
      name: lm.name,
      keywords: lm.keywords,
      isLandmark: true,
      parentArea: lm.parentAreaName,
    })),
    // Standard geographic areas plus local WhatsApp shorthand and common aliases.
    ...BAHRAIN_AREAS.map((a) => ({
      name: a.name,
      keywords: [
        a.name,
        a.nameEn,
        ...(normalizeArabicText(a.name).startsWith('ال') ? [a.name.replace(/^ال/, '')] : []),
        ...(areaAliasesById[a.id] || []),
      ],
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
  // Handles Arabic prefixes (من, استلام من, بالـ, في) and (الى, إلى, لـ, للـ, مشوار لـ, توصيل لـ)
  for (const item of allKeywordItems) {
    const kw = item.normalizedKeyword;
    if (kw.length < 2) continue;

    const startsWithAl = kw.startsWith('ال');
    const core = startsWithAl ? kw.slice(2) : kw;

    // Look for "From" indicators before this place
    // Matches: "من الرفاع", "استلام من سار", "بالرفاع", "في الرفاع", "عند مجمع السيف"
    if (!fromArea) {
      const fromPattern = startsWithAl
        ? new RegExp(`(?:(?:من|استلام من|استلام|بيك اب من|بيك اب|موقع|تحميل من|فرع|عند)\s*(?:مجمع|مول|سوق|منطقة|قرية)?\s*${kw}\\b|(?:^|[\s،,.])بال(?:مجمع|مول|سوق|منطقة|قرية)?${core}\\b|(?:^|[\s،,.])في\s+(?:مجمع|مول|سوق|منطقة|قرية)?${kw}\\b)`, 'i')
        : new RegExp(`(?:(?:من|استلام من|استلام|بيك اب من|بيك اب|موقع|تحميل من|فرع|عند)\s*(?:مجمع|مول|سوق|منطقة|قرية)?\s*${kw}\\b|(?:^|[\s،,.])بـ?${kw}\\b|(?:^|[\s،,.])في\s+(?:مجمع|مول|سوق|منطقة|قرية)?${kw}\\b)`, 'i');

      if (fromPattern.test(normalized)) {
        fromArea = item.placeName;
      }
    }

    // Look for "To" indicators before this place
    // Matches: "الى الرفاع", "للمنامة", "للمطار", "للسلمانية", "للجسر", "لسار", "لـمدينة حمد", "توصيل للرفاع", "مشوار للمطار"
    if (!toArea) {
      const toPattern = startsWithAl
        ? new RegExp(`(?:(?:الى|إلى|لي|تسليم الى|تسليم ل|تسليم|توصيل الى|توصيل ل|مشوار الى|مشوار ل|توصيلة الى|توصيلة ل|وجهة|مكان|يوصل)\s*(?:مجمع|مول|سوق|منطقة|قرية)?\s*${kw}\\b|(?:^|[\s،,.]|(?:مشوار|توصيل|توصيلة|نقل|روحة|طالع)\s+)لل(?:مجمع|مول|سوق|منطقة|قرية)?${core}\\b|(?:^|[\s،,.])لـ?${kw}\\b)`, 'i')
        : new RegExp(`(?:(?:الى|إلى|لي|تسليم الى|تسليم ل|تسليم|توصيل الى|توصيل ل|مشوار الى|مشوار ل|توصيلة الى|توصيلة ل|وجهة|مكان|يوصل)\s*(?:مجمع|مول|سوق|منطقة|قرية)?\s*${kw}\\b|(?:^|[\s،,.]|(?:مشوار|توصيل|توصيلة|نقل|روحة|طالع)\s+)لـ?${kw}\\b)`, 'i');

      if (toPattern.test(normalized) && (!fromArea || item.placeName !== fromArea || /(?:من|استلام).*?(?:الى|إلى|لل|لـ|تسليم)/i.test(normalized))) {
        toArea = item.placeName;
      }
    }
  }

  // WhatsApp shorthand sometimes repeats a single area to mean pickup and drop-off in that same area:
  // "محرق محرق", "منامه منامه", "قلالي قلالي". Resolve only when no explicit route endpoint was found.
  let sameAreaShorthand = false;
  if (!fromArea && !toArea) {
    const isArabicOrLatinWord = (ch: string | undefined) => !!ch && /[\\p{L}\\p{N}]/u.test(ch);
    for (const area of BAHRAIN_AREAS) {
      const areaName = normalizeArabicText(area.name);
      const candidates = new Set([areaName, areaName.startsWith('ال') ? areaName.slice(2) : areaName]);
      // Also account for common spelling variants like منامه for المنامة.
      if (area.id === 'manama') { candidates.add('منامه'); candidates.add('المنامه'); }
      if (area.id === 'muharraq') { candidates.add('محرق'); candidates.add('المحرق'); }
      for (const candidate of candidates) {
        if (candidate.length < 3) continue;
        let firstIndex = -1;
        let searchFrom = 0;
        while (searchFrom < normalized.length) {
          const idx = normalized.indexOf(candidate, searchFrom);
          if (idx < 0) break;
          const before = normalized[idx - 1];
          const after = normalized[idx + candidate.length];
          if (!isArabicOrLatinWord(before) && !isArabicOrLatinWord(after)) {
            if (firstIndex >= 0) {
              const between = normalized.slice(firstIndex + candidate.length, idx);
              // Repeated area should be a compact shorthand, not two mentions far apart in a long advert.
              if (between.length <= 12 && /^[\\s،,./-]*$/.test(between)) {
                fromArea = area.name;
                toArea = area.name;
                sameAreaShorthand = true;
                break;
              }
            } else {
              firstIndex = idx;
            }
          }
          searchFrom = idx + candidate.length;
        }
        if (sameAreaShorthand) break;
      }
      if (sameAreaShorthand) break;
    }
  }

  // If either is missing, do an enhanced presence scan in message for known places
  if (!fromArea || !toArea) {
    const foundPlaces: { name: string; index: number; intentType?: 'from' | 'to' }[] = [];
    for (const item of allKeywordItems) {
      const kw = item.normalizedKeyword;
      if (kw.length < 2) continue;

      const startsWithAl = kw.startsWith('ال');
      const core = startsWithAl ? kw.slice(2) : kw;

      let idx = normalized.indexOf(kw);
      let intentType: 'from' | 'to' | undefined = undefined;

      // Check "للـ" for words starting with Al (destination preposition)
      if (startsWithAl && idx === -1) {
        const toPrefix = `لل${core}`;
        const toIdx = normalized.indexOf(toPrefix);
        if (toIdx !== -1) {
          idx = toIdx;
          intentType = 'to';
        }
      }

      // Check "لـ" or "ل" for non-Al words (destination preposition)
      if (!startsWithAl && idx === -1) {
        const toPrefix = `ل${kw}`;
        const toIdx = normalized.indexOf(toPrefix);
        if (toIdx !== -1) {
          idx = toIdx;
          intentType = 'to';
        }
      }

      // Check "بالـ" for words starting with Al (origin preposition)
      if (startsWithAl && idx === -1) {
        const fromPrefix = `بال${core}`;
        const fromIdx = normalized.indexOf(fromPrefix);
        if (fromIdx !== -1) {
          idx = fromIdx;
          intentType = 'from';
        }
      }

      if (idx !== -1) {
        const alreadySub = foundPlaces.some((f) => Math.abs(f.index - idx) < 4);
        if (!alreadySub) {
          foundPlaces.push({ name: item.placeName, index: idx, intentType });
        }
      }
    }

    // Typo-tolerant fallback: only runs when exact matching did not identify both endpoints.
    // Examples: common one-letter mistakes in الرفاع / مدينة عيسى / السلمانية.
    // It does not replace exact matches, and requires a minimum name length + a strict edit-distance limit.
    if (foundPlaces.length < 2) {
      const tokens: { value: string; index: number }[] = [];
      const tokenPattern = /[ء-يA-Za-z0-9]+/g;
      let tokenMatch: RegExpExecArray | null;
      while ((tokenMatch = tokenPattern.exec(normalized)) !== null) {
        tokens.push({ value: tokenMatch[0], index: tokenMatch.index });
      }

      const seenFuzzy = new Set<string>();
      for (const item of allKeywordItems) {
        const keyword = item.normalizedKeyword.trim();
        const keywordWords = keyword.split(/\s+/).filter(Boolean);
        const limit = getPlaceTypoLimit(keyword.replace(/\s/g, ''));
        if (!limit || keywordWords.length === 0) continue;

        // Compare equal-sized word windows so multi-word names stay aligned.
        for (let startIndex = 0; startIndex < tokens.length; startIndex++) {
          const window = tokens.slice(startIndex, startIndex + keywordWords.length);
          if (window.length !== keywordWords.length) continue;
          const candidate = window.map((token) => token.value).join(' ');
          if (candidate === keyword) continue;
          const compactCandidate = candidate.replace(/\s/g, '');
          const compactKeyword = keyword.replace(/\s/g, '');
          const distance = boundedEditDistance(compactCandidate, compactKeyword, limit);
          if (distance < 1 || distance > limit || distance / Math.max(compactCandidate.length, compactKeyword.length) > 0.22) continue;

          const matchIndex = window[0].index;
          const dedupeKey = item.placeName + ':' + Math.floor(matchIndex / 3);
          if (seenFuzzy.has(dedupeKey)) continue;
          seenFuzzy.add(dedupeKey);

          const before = normalized.slice(Math.max(0, matchIndex - 22), matchIndex);
          let intentType: 'from' | 'to' | undefined;
          if (/(?:من|استلام|بيك\s*اب|عند|في|بال)\s*$/.test(before)) intentType = 'from';
          else if (/(?:الى|إلى|ل|لل|توصيل|مشوار|تسليم|وجهة)\s*$/.test(before)) intentType = 'to';

          const alreadySub = foundPlaces.some((found) => Math.abs(found.index - matchIndex) < 4);
          if (!alreadySub) foundPlaces.push({ name: item.placeName, index: matchIndex, intentType });
        }
      }
    }

    foundPlaces.sort((a, b) => a.index - b.index);

    if (foundPlaces.length >= 2) {
      if (!fromArea && !toArea) {
        if (foundPlaces[0].intentType === 'to' && foundPlaces[1].intentType !== 'to') {
          toArea = foundPlaces[0].name;
          fromArea = foundPlaces[1].name;
        } else {
          fromArea = foundPlaces[0].name;
          toArea = foundPlaces[1].name;
        }
      } else if (!fromArea) {
        const remaining = foundPlaces.find((f) => f.name !== toArea);
        if (remaining) fromArea = remaining.name;
      } else if (!toArea) {
        const remaining = foundPlaces.find((f) => f.name !== fromArea);
        if (remaining) toArea = remaining.name;
      }
    } else if (foundPlaces.length === 1) {
      const singlePlace = foundPlaces[0];
      if (!fromArea && !toArea) {
        if (singlePlace.intentType === 'to') {
          toArea = singlePlace.name;
        } else {
          fromArea = singlePlace.name;
        }
      } else if (!fromArea && singlePlace.name !== toArea) {
        fromArea = singlePlace.name;
      } else if (!toArea && singlePlace.name !== fromArea) {
        toArea = singlePlace.name;
      }
    }
  }

  // Free-text Destination Fallback:
  // e.g. "اوردر من مودامول الى مكان معين" or "من السيف مول الى كافيه الزنج"
  if (!toArea && fromArea) {
    const toFreeMatch = /(?:الى|إلى|تسليم الى|تسليم ل|تسليم|توصيل الى|توصيل ل|وجهة)\s+([^\n\r،,]+)/i.exec(convertedText);
    if (toFreeMatch && toFreeMatch[1]) {
      let candidate = toFreeMatch[1].trim();
      candidate = candidate.replace(/(?:\s+ب?\s*\d+(?:\.\d+)?\s*(?:د\.ب|دب|دينار|bd|bhd)).*$/i, '').trim();
      candidate = candidate.replace(/(?:\s+(?:\+?973|00973)?[\s-]*(?:3\d{7}|6\d{7}|17\d{6})).*$/i, '').trim();
      candidate = candidate.replace(/\s+ب\s*$/i, '').trim();
      if (candidate.length >= 2 && candidate.length <= 40 && candidate !== fromArea) {
        toArea = candidate;
      }
    }
  }

  // Free-text Origin Fallback:
  // e.g. "استلام من مكان معين الى السلمانية"
  if (!fromArea && toArea) {
    const fromFreeMatch = /(?:من|استلام من|بيك اب من)\s+([^\n\r،,]+)/i.exec(convertedText);
    if (fromFreeMatch && fromFreeMatch[1]) {
      let candidate = fromFreeMatch[1].trim();
      candidate = candidate.replace(/(?:\s+ب?\s*\d+(?:\.\d+)?\s*(?:د\.ب|دب|دينار|bd|bhd)).*$/i, '').trim();
      candidate = candidate.replace(/(?:\s+(?:\+?973|00973)?[\s-]*(?:3\d{7}|6\d{7}|17\d{6})).*$/i, '').trim();
      candidate = candidate.replace(/\s+ب\s*$/i, '').trim();
      if (candidate.length >= 2 && candidate.length <= 40 && candidate !== toArea) {
        fromArea = candidate;
      }
    }
  }

  // Bahraini shorthand fare: "عسكر عراد 2" commonly means 2 BHD.
  // Only accept a final bare number after both route endpoints were identified,
  // when there is no explicit price, stated order quantity, passenger count or time.
  const hasPersonOrScheduleNumber = /(?:اشخاص|شخص|ركاب|راكب|ساعة|الساعة|هاتف|واتساب)/i.test(normalized);
  const trailingBareNumber = /(?:^|[\s،,])([1-9]\d?(?:\.\d+)?)\s*$/.exec(convertedText);
  if (price <= 0 && !orderCount && fromArea && toArea &&
      fromArea !== toArea && !hasPersonOrScheduleNumber && trailingBareNumber) {
    const shorthandFare = Number(trailingBareNumber[1]);
    if (shorthandFare > 0 && shorthandFare <= 100) price = shorthandFare;
  }

  // Comprehensive Intent Detection (Goods deliveries + Passenger rides)
  const hasOrderIntent =
    /(?:اوردر|طلب|توصيل|توصيل[ةه]|توصيلني|يوصلني|مشوار|مشاوير|مندوب|بيك\s*اب|pickup|delivery|شخص|اشخاص|راكب|ركاب|بنت|بنات|طفل|اطفال|طالب|طالب[ةه]|طلاب|طالبات|موظف|موظف[ةه]|موظفين|عمال|سيار[ةه]|دريول|سائق|دوام|مدرس[ةه]|جامع[ةه])/i.test(normalized) ||
    /(?:ابي|ابا|ابغي|ابغى|اريد|عايز|عاوزه|محتاج|محتاجه|احتاج|نبي|نبغي|مطلوب|لو\s*سمحت|please)/i.test(normalized) ||
    /(?:اوردر|أوردر|طلب|توصيل|توصيلة|توصيله|مشوار|مشاوير|شخص|أشخاص|اشخاص|راكب|ركاب|بنت|طفل|أطفال|طالب|طالبة|موظف|موظفة|سيارة|دريول|سائق|دوام|مدرسة|جامعة)/i.test(rawText);

  // 4. Notes / Package Type extraction
  let notes = '';

  // استبعاد الفويس نوت والتسجيلات الصوتية من الرادار والبرنامج بناءً على رغبة المستخدم
  const isVoiceMessage = /(?:رسالة|تسجيل)\s*صوتية|voice\s*message|ptt|🎙️|فويس\s*نوت|تسجيل\s*صوتي|مقطع\s*صوتي/i.test(convertedText) ||
    /(?:رسالة|تسجيل)\s*صوتية|voice\s*message|ptt|🎙️|فويس\s*نوت/i.test(rawText);

  if (isVoiceMessage && !fromArea && !toArea) {
    // إذا كانت الرسالة مجرد فويس نوت لا تحتوي مساراً كتابياً، تُستبعد كلياً ولا تنشئ طلباً
    return {
      from: '',
      to: '',
      price: 0,
      isPriceUnspecified: true,
      phone,
      notes: '',
      confidence: 0,
      canCreateOrder: false,
      passengerDetection: {
        level: 'goods_safe',
        label: 'فويس نوت مستبعد',
        matchedPhrases: [],
        reason: 'تم حذف واستبعاد الفويس نوت من البرنامج',
        isForbidden: false,
      },
    };
  }

  // If destination is missing but origin is known
  if (!toArea && fromArea && hasOrderIntent) {
    toArea = passengerDetection.level !== 'goods_safe' ? 'حسب طلب الراكب 📍' : 'حسب طلب الزبون 📍';
  }

  // If origin is missing but destination is known (e.g. "توصيل شخص للمطار", "توصيل بنت للسلمانية", "مشوار للجسر")
  if (!fromArea && toArea && hasOrderIntent) {
    fromArea = 'موقع العميل / غير محدد 📍';
  }
  const noteKeywords = [
    'ورد', 'باقة', 'زهور', 'كيك', 'حلويات', 'عطور', 'هدية', 'أكل', 'مطعم',
    'وجبة', 'مستندات', 'أوراق', 'عباية', 'ملابس', 'شحنة', 'أمانات', 'كرتون'
  ];
  for (const kw of noteKeywords) {
    const kwRegex = new RegExp(`(?:^|[\s،,.])${kw}(?:$|[\s،,.])`, 'i');
    if (kwRegex.test(normalized)) {
      notes = kw;
      break;
    }
  }

  // 4b. Extract explicit pickup/delivery times, including RTL-reversed WhatsApp clocks.
  let scheduledTime: string | undefined;
  let scheduledTimeMinutes: number | undefined;
  let isFutureSchedule = false;
  const timeContext = /استلام|تسليم|توصيل|موعد|وقت|الساعة|ساعة|توقيت|على الساعة|في حدود الساعة/i.test(convertedText);
  const periodRegex = /(صباحا|صباحاً|الصبح|الصباح|مساء|مساءً|المساء|العصر|الظهر|المغرب|بالليل|في الليل|ليلًا|ليلا|(?:^|\\s)ص(?=\\s|$)|(?:^|\\s)م(?=\\s|$))/i;
  const periodMatch = periodRegex.exec(convertedText);
  const period = (periodMatch?.[1] || '').trim();
  const hasAm = /صباح|الصبح|الصباح|(?:^|\\s)ص(?:\\s|$)/i.test(period);
  const hasPm = /مساء|المساء|(?:^|\\s)م(?:\\s|$)|العصر|الظهر|المغرب|بالليل|في الليل|ليل/i.test(period);
  // Standard clocks (7:30) and RTL-rendered clocks (30 : 7 / 00 : 8).
  const clockRegex = /(?:^|[^\d])(\d{1,2})\s*:\s*(\d{1,2})(?!\d)/;
  const clockMatch = clockRegex.exec(convertedText);
  let rawHour: number | undefined;
  let rawMin = 0;
  if (clockMatch && timeContext) {
    const left = Number(clockMatch[1]);
    const right = Number(clockMatch[2]);
    if ([0, 15, 30, 45].includes(left) && right >= 1 && right <= 12) {
      // Arabic right-to-left text can expose "7:30" as "30 : 7".
      rawHour = right;
      rawMin = left;
    } else if (left >= 0 && left <= 23 && right >= 0 && right <= 59) {
      rawHour = left;
      rawMin = right;
    }
  }
  if (rawHour === undefined) {
    const scheduleRegex = /(?:الساعة|ساعة|على الساعة|في حدود الساعة|توقيت|موعد|وقت|استلام|تسليم|توصيل)\s*(\d{1,2})(?!\s*[:：])\s*(صباحا|صباحاً|الصبح|الصباح|ص|مساء|مساءً|المساء|م|العصر|الظهر|المغرب|بالليل|في الليل|ليلًا|ليلا)?/i;
    const match = scheduleRegex.exec(convertedText);
    if (match) rawHour = Number(match[1]);
  }
  if (rawHour !== undefined && rawHour >= 0 && rawHour <= 24 && rawMin <= 59) {
    let hour24 = rawHour;
    if (hasPm && hour24 < 12) hour24 += 12;
    if (hasAm && hour24 === 12) hour24 = 0;
    if (hour24 === 24 && rawMin === 0) hour24 = 0;
    if (hour24 <= 23) {
      scheduledTimeMinutes = hour24 * 60 + rawMin;
      const displayHour = rawHour > 12 ? rawHour - 12 : (rawHour === 0 ? 12 : rawHour);
      const displayMin = String(rawMin).padStart(2, '0');
      const displayPeriod = hasAm ? ' صباحاً' : hasPm ? ' مساءً' : '';
      scheduledTime = 'وقت الاستلام/التوصيل: ' + displayHour + ':' + displayMin + displayPeriod;
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
  if (isVoiceMessage) confidence = Math.max(confidence, 92);
  if (advertisementDetection.isAdvertisement) confidence = 0;

  // Service promotions must never become radar orders just because they mention routes, items or prices.
  const canCreateOrder = !advertisementDetection.isAdvertisement && !!fromArea && !!toArea;
  const isPriceUnspecified = !price || price <= 0;

  return {
    from: fromArea,
    to: toArea,
    price: price > 0 ? price : 0,
    orderCount,
    isPriceUnspecified,
    passengerCount: passengerDetection.passengerCount,
    scheduledTime,
    scheduledTimeMinutes,
    isFutureSchedule,
    phone,
    notes,
    confidence,
    canCreateOrder,
    sameAreaShorthand,
    isAdvertisement: advertisementDetection.isAdvertisement,
    advertisementReason: advertisementDetection.reason,
    passengerDetection,
  };
}
