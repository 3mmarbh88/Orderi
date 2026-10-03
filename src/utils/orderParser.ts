import { BAHRAIN_AREAS, normalizeArabicText } from '../data/bahrainAreas';

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

  // 3. Detect "From" (Start) and "To" (Destination) areas
  let fromArea = '';
  let toArea = '';

  // Sort areas by length descending so longer compound names match first (e.g. 'ديار المحرق' before 'المحرق')
  const sortedAreas = [...BAHRAIN_AREAS].sort((a, b) => b.name.length - a.name.length);

  // Search patterns for explicit "From" and "To"
  // Patterns like "من [منطقة] إلى [منطقة]" or "استلام: [منطقة] تسليم: [منطقة]"
  for (const area of sortedAreas) {
    const normArea = normalizeArabicText(area.name);

    // Look for "From" indicators before this area
    const fromPattern = new RegExp(`(?:من|استلام من|بيك اب من|موقع|تحميل من)\\s*(?:منطقة|قرية)?\\s*${normArea}\\b`, 'i');
    if (!fromArea && fromPattern.test(normalized)) {
      fromArea = area.name;
    }

    // Look for "To" indicators before this area
    const toPattern = new RegExp(`(?:الى|إلى|ل|لي|تسليم|توصيل الى|توصيل ل|وجهة|مكان)\\s*(?:منطقة|قرية)?\\s*${normArea}\\b`, 'i');
    if (!toArea && toPattern.test(normalized)) {
      toArea = area.name;
    }
  }

  // If either is missing, do a greedy area presence scan
  if (!fromArea || !toArea) {
    const foundAreas: { area: string; index: number }[] = [];
    for (const area of sortedAreas) {
      const normArea = normalizeArabicText(area.name);
      const idx = normalized.indexOf(normArea);
      if (idx !== -1) {
        // Ensure not duplicate of already matched longer area
        const alreadySub = foundAreas.some(f => Math.abs(f.index - idx) < 3);
        if (!alreadySub) {
          foundAreas.push({ area: area.name, index: idx });
        }
      }
    }

    // Sort by position in string
    foundAreas.sort((a, b) => a.index - b.index);

    if (foundAreas.length >= 2) {
      if (!fromArea && !toArea) {
        fromArea = foundAreas[0].area;
        toArea = foundAreas[1].area;
      } else if (!fromArea) {
        const remaining = foundAreas.find(f => f.area !== toArea);
        if (remaining) fromArea = remaining.area;
      } else if (!toArea) {
        const remaining = foundAreas.find(f => f.area !== fromArea);
        if (remaining) toArea = remaining.area;
      }
    } else if (foundAreas.length === 1) {
      if (!fromArea && !toArea) {
        fromArea = foundAreas[0].area;
      }
    }
  }

  // 4. Notes / Package Type extraction
  let notes = '';
  const noteKeywords = [
    'ورد', 'باقة', 'زهور', 'كيك', 'حلويات', 'عطور', 'هدية', 'أكل', 'مطعم',
    'وجبة', 'مستندات', 'أوراق', 'عباية', 'ملابس', 'شحنة', 'أمانات', 'كرتون'
  ];
  for (const kw of noteKeywords) {
    if (normalized.includes(kw)) {
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
