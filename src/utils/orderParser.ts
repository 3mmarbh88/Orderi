import { BAHRAIN_AREAS, normalizeArabicText } from '../data/bahrainAreas';
import { BAHRAIN_LANDMARKS } from '../data/bahrainLandmarks';

export interface RawParsedResult {
  from: string;
  to: string;
  price: number;
  phone: string;
  notes: string;
  confidence: number;
  canCreateOrder: boolean;
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
      phone: '',
      notes: '',
      confidence: 0,
      canCreateOrder: false,
    };
  }

  const convertedText = convertArabicNumerals(rawText);
  const normalized = normalizeArabicText(convertedText);

  // 1. Detect Phone Number (Bahrain format: 8 digits starting with 3, 6, 17 or prefixed with 973)
  let phone = '';
  const phoneRegex = /(?:\+?973|00973)?[\s-]*(3\d{7}|6\d{7}|17\d{6}|[36]\d{3}[\s-]?\d{4})/g;
  const phoneMatch = phoneRegex.exec(convertedText);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[\s-+]/g, '');
    if (!phone.startsWith('973') && phone.length === 8) {
      phone = '973' + phone;
    }
  }

  // 2. Detect Price in BHD (دينار / د.ب / bd / bhd)
  let price = 0;
  // Patterns like: "3.5 دينار", "ب 3 د.ب", "السعر: 4", "3.0bd", "ب3", "٣ دينار"
  const pricePatterns = [
    /(?:السعر|سعر|ب|بقيمة|مبلغ|أجرة|اجرة|التوصيل)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:دينار|د\.ب|دب|دينار بحريني|bd|bhd)/i,
    /(?:دينار|د\.ب|دب|bd|bhd)\s*[:=]?\s*(\d+(?:\.\d+)?)/i,
    /(?:السعر|سعر|المبلغ|الحساب)\s*[:=]?\s*(\d+(?:\.\d+)?)/i,
    /\b(\d+(?:\.\d+)?)\s*(?:دينار|د\.ب|دب|bd|bhd)\b/i,
  ];

  for (const pattern of pricePatterns) {
    const match = pattern.exec(convertedText);
    if (match && match[1]) {
      const parsedVal = parseFloat(match[1]);
      if (!isNaN(parsedVal) && parsedVal > 0 && parsedVal <= 50) {
        price = parsedVal;
        break;
      }
    }
  }

  // If price not found with keywords, look for standalone sensible price numbers (e.g. 1.5, 2, 2.5, 3, 3.5, 4, 5)
  if (price === 0) {
    const fallbackMatch = /(?:^|\s)(?:ب\s*)?([1-9](?:\.[0-9])?)(?:\s|$)/.exec(convertedText);
    if (fallbackMatch && fallbackMatch[1]) {
      const val = parseFloat(fallbackMatch[1]);
      if (val >= 1 && val <= 15) {
        price = val;
      }
    }
  }

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

  // Calculate confidence
  let confidence = 0;
  if (fromArea) confidence += 35;
  if (toArea) confidence += 35;
  if (price > 0) confidence += 20;
  if (phone) confidence += 10;

  const canCreateOrder = !!fromArea && !!toArea;

  return {
    from: fromArea,
    to: toArea,
    price: price || 2.5, // Default fallback price if not explicitly provided
    phone,
    notes,
    confidence,
    canCreateOrder,
  };
}
