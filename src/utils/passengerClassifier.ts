import { PassengerDetection, PassengerRiskLevel } from '../types';
import { normalizeArabicText } from '../data/bahrainAreas';

/**
 * Passenger Transport Classifier for Orderi (كاشف إعلانات نقل الركاب والأشخاص)
 * 
 * Classifies orders into 3 strict categories:
 * 1. 'confirmed_passenger' (أحمر - نقل أشخاص مؤكد): تحذير واضح وتعطيل القبول
 * 2. 'suspicious_passenger' (أصفر - احتمال نقل أشخاص): مراجعة يدوية قبل القبول
 * 3. 'goods_safe' (أخضر - توصيل بضائع معتمد): يظهر كطلب عادي
 */

// Explicit False-Positive Indicators (Goods marked as "personal" e.g. "طلب شخصي", "أغراض شخصية")
const GOODS_SAFE_CONTEXT_REGEXES = [
  /طلب(?:\s+)?شخصي/i,
  /أوردر(?:\s+)?شخصي|اوردر(?:\s+)?شخصي/i,
  /أغراض(?:\s+)?شخصية|اغراض(?:\s+)?شخصية/i,
  /أغراض(?:\s+)?شخص|اغراض(?:\s+)?شخص/i,
  /حاجة(?:\s+)?شخصية|حاجات(?:\s+)?شخصية/i,
  /أمانة(?:\s+)?شخصية|امانة(?:\s+)?شخصية/i,
  /كرتون(?:\s+)?شخصي|كراتين(?:\s+)?شخصية/i,
  /شنطة(?:\s+)?شخصية|شنط(?:\s+)?شخصية/i,
  /شحنة(?:\s+)?شخصية|شحنات(?:\s+)?شخصية/i,
  /ملابس(?:\s+)?شخصية/i,
  /أوراق(?:\s+)?شخصية|اوراق(?:\s+)?شخصية/i,
  /مستندات(?:\s+)?شخصية/i,
];

// Physical Goods / Package Keywords that strongly imply merchandise delivery
const KNOWN_GOODS_KEYWORDS = [
  'كرتون', 'كراتين', 'شحنة', 'شحنات', 'طرد', 'طرود', 'بضاعة', 'بضائع',
  'أكل', 'اكل', 'وجبة', 'وجبات', 'مطعم', 'كافيه', 'سوبرماركت',
  'ورد', 'ورود', 'باقة', 'زهور', 'كيك', 'كيكة', 'حلويات', 'حلا',
  'عطور', 'عطر', 'هدية', 'هدايا', 'عباية', 'عبايات', 'فستان', 'ملابس',
  'أوراق', 'اوراق', 'مستندات', 'قطع غيار', 'شنطة', 'أمانات', 'امانات'
];

// 1. Confirmed Passenger Phrases (نقل أشخاص مؤكد - أحمر)
interface PatternDefinition {
  regex: RegExp;
  label: string;
}

const CONFIRMED_PASSENGER_PATTERNS: PatternDefinition[] = [
  // التوصيل الشخصي الصريح للأشخاص
  { regex: /توصيل(?:\s+)?(أشخاص|اشخاص|أفراد|افراد|ناس|ركاب)/i, label: 'توصيل أشخاص/ركاب' },
  { regex: /نقل(?:\s+)?(أشخاص|اشخاص|ركاب|أفراد|افراد|عائلات|عوائل)/i, label: 'نقل ركاب/أشخاص' },
  { regex: /توصيل(?:\s+)?شخص(?!(\s+)?(واحد\s+)?(طلب|اغراض|أغراض|كرتون|شحنة))/i, label: 'توصيل شخص' },

  // وصف الراكب (بنت، طفل، أطفال، شاب، رجال، عائلة)
  { regex: /توصيل(?:\s+)?(بنت|بنية|بنات|حرمة|حريم|نساء|نسوان|أم|ام)/i, label: 'توصيل راكبة (بنت/نساء)' },
  { regex: /توصيل(?:\s+)?(طفل|أطفال|اطفال|بيبي|جاهل|جهال|يهال|يهالوه)/i, label: 'توصيل طفل/أطفال' },
  { regex: /توصيل(?:\s+)?(شاب|شباب|رجال|رجل|ريال|أولاد|اولاد)/i, label: 'توصيل راكب (شاب/رجال)' },
  { regex: /توصيل(?:\s+)?(عائلة|عوائل|أسرة|اسرة)/i, label: 'توصيل عائلة' },
  { regex: /توصيل(?:\s+)?(موظف|موظفة|موظفات|موظفين|عامل|عاملة|عمال|خدامة|عاملة منزلية)/i, label: 'توصيل موظف/عمالة' },
  { regex: /توصيل(?:\s+)?(طالب|طالبة|طلاب|طالبات)/i, label: 'توصيل طالب/طالبات' },

  // عبارات نقل الأشخاص والمشاوير
  { regex: /مطلوب(?:\s+)?(مشوار|مشاوير|توصيلة|توصيله)/i, label: 'مطلوب مشوار/توصيلة' },
  { regex: /توصيل(?:\s+)?(مشوار|مشاوير)/i, label: 'توصيل مشوار' },
  { regex: /(أوصل|اوصل|يوصل|نوصل)(?:\s+)?(أحد|احد|شخص|راكب)/i, label: 'أوصل أحد/شخص' },
  { regex: /(مشوار|مشاوير)(?:\s+)?(خاص|خاصة)/i, label: 'مشوار خاص' },
  { regex: /(توصيلة|توصيله)(?:\s+)?(خاصة|خاصه|ركاب)/i, label: 'توصيلة خاصة' },
  { regex: /محتاج(?:\s+)?(مشوار|توصيلة|توصيله|سيارة توصلني|احد يوصلني)/i, label: 'طلب نقل خاص' },

  // عبارات مسارات الطلب للأشخاص (شخص من ... إلى ... / بنت من ... إلى ... / طفل للمدرسة ...)
  { regex: /(?:^|[\s،,.])(شخص|بنت|طفل|أطفال|اطفال|شاب|موظف|موظفة|راكب|عائلة)(?:\s+)?(?:من|استلام من)\s+[^\n\r]+?\s+(?:إلى|الى|ل|لـ)/i, label: 'مسار راكب بين مناطق' },
  { regex: /(?:^|[\s،,.])(طفل|أطفال|اطفال|طالب|طالبة|طلاب|طالبات)(?:\s+)?(?:للمدرسة|إلى المدرسة|الى المدرسة|من المدرسة)/i, label: 'توصيل مدرسة/أطفال' },
  { regex: /(?:^|[\s،,.])(موظف|موظفة|شخص|دوام)(?:\s+)?(?:للعمل|إلى العمل|الى العمل|للدوام|إلى الدوام|الى الدوام)/i, label: 'مشوار عمل/دوام' },
  { regex: /توصيل(?:\s+)?(للمدرسة|للدوام|للعمل|للروضة|للجامعة)(?:\s+)?(صباحي|مسائي|شهري)?/i, label: 'توصيل مشوار مدرسة/دوام' },
  { regex: /توصيل(?:\s+)?شهري(?:\s+)?(للدوام|للمدرسة|للجامعة)/i, label: 'توصيل شهري لركاب' },
];

// 2. Suspicious Passenger Indicators (احتمال نقل أشخاص - أصفر)
const SUSPICIOUS_PATTERNS: PatternDefinition[] = [
  { regex: /(?:^|[\s،,.])مشوار(?:$|[\s،,.])/i, label: 'ذكر كلمة مشوار' },
  { regex: /(?:^|[\s،,.])توصيلة(?:$|[\s،,.])/i, label: 'ذكر كلمة توصيلة' },
  { regex: /(?:^|[\s،,.])(أحد|احد)(?:\s+)?يوصل(?:$|[\s،,.])/i, label: 'طلب شخص يوصل' },
  { regex: /محتاج(?:\s+)?(سائق|دريول|سيارة)(?:$|[\s،,.])/i, label: 'طلب سيارة وسائق' },
  { regex: /توصيل(?:\s+)?(للمستشفى|للعيادة|للمطار)(?!(\s+)?(أغراض|اغراض|كرتون|شحنة))/i, label: 'مشوار وجهة شخصية' },
];

/**
 * Smart detection of passenger count from Arabic text
 * يميّز بين عدد الأشخاص (ركاب) وقيمة الأوردر (السعر)
 */
export function detectPassengerCount(rawText: string): number | undefined {
  if (!rawText || typeof rawText !== 'string') return undefined;

  const normalized = normalizeArabicText(rawText);

  // 1. Direct digits followed by passenger nouns (e.g. "5 أشخاص", "3 ركاب", "4 أفراد", "2 عمال")
  const digitMatch = /(?:^|[\s،,.])([1-9]|10)\s*(?:أشخاص|اشخاص|ركاب|أفراد|افراد|ناس|بنات|أطفال|اطفال|عمال|موظفين|طلاب|طالبات)/i.exec(rawText);
  if (digitMatch && digitMatch[1]) {
    const count = parseInt(digitMatch[1], 10);
    if (!isNaN(count) && count > 0 && count <= 20) return count;
  }

  // 2. Arabic number words followed by passenger nouns
  if (/(?:خمسة|خمس)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 5;
  if (/(?:أربعة|اربعة|اربع)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 4;
  if (/(?:ثلاثة|ثلاث)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 3;
  if (/(?:ستة|ست)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 6;
  if (/(?:سبعة|سبع)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 7;
  if (/(?:ثمانية|ثمان)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 8;
  if (/(?:تسعة|تسع)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 9;
  if (/(?:عشرة|عشر)\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)/i.test(normalized)) return 10;

  // 3. Dual forms (شخصين / راكبين / طفلين / بنتين)
  if (/(?:^|[\s،,.])(?:شخصين|راكبين|طفلين|بنتين)(?:$|[\s،,.])/i.test(normalized)) return 2;
  if (/(?:توصيل|نقل|مشوار)\s*(?:اثنين|إثنين|2)\s*(?:أشخاص|اشخاص|ركاب)?/i.test(normalized)) return 2;

  // 4. Single passenger (شخص واحد / راكب واحد / توصيل شخص / توصيل بنت)
  if (/(?:شخص|راكب|بنت|طفل|موظف|طالب)\s+واحد/i.test(normalized)) return 1;
  if (/(?:توصيل|نقل)\s+(?:شخص|راكب|بنت|طفل)(?!\s*(?:واحد\s+)?(?:طلب|اغراض|أغراض|كرتون|شحنة|بضاعة|سلعة))/i.test(normalized)) return 1;

  // 5. Pattern like "شخص من ... إلى ..."
  if (/(?:^|[\s،,.])شخص(?:\s+)?(?:من|استلام من)\s+[^\n\r]+?\s+(?:إلى|الى|ل|لـ)/i.test(normalized)) return 1;

  return undefined;
}

export function detectPassengerDelivery(
  rawText: string,
  options?: { isBlockForbiddenEnabled?: boolean }
): PassengerDetection {
  if (!rawText || typeof rawText !== 'string') {
    return {
      level: 'goods_safe',
      label: 'توصيل بضائع معتمد',
      matchedPhrases: [],
      reason: 'لا توجد عبارات نقل أشخاص',
      isForbidden: false,
    };
  }

  const isForbiddenPolicy = options?.isBlockForbiddenEnabled ?? true;
  const normalized = normalizeArabicText(rawText);
  const detectedCount = detectPassengerCount(rawText);

  // 1. Check for explicit Goods Exemption Contexts (e.g. "طلب شخصي", "أغراض شخصية")
  const hasSafeContext = GOODS_SAFE_CONTEXT_REGEXES.some((rx) => rx.test(rawText) || rx.test(normalized));
  
  // Check if primary goods keywords exist
  const hasExplicitGoodsWords = KNOWN_GOODS_KEYWORDS.some((kw) => {
    const rx = new RegExp(`(?:^|[\\s،,.])${kw}(?:$|[\\s،,.])`, 'i');
    return rx.test(normalized);
  });

  // If text contains safe context and NO explicit passenger descriptions, classify as goods_safe
  const matchedConfirmed: string[] = [];

  // If a passenger count is detected, that's a confirmed passenger indicator
  if (detectedCount !== undefined && detectedCount > 0) {
    const countLabel = detectedCount === 1 
      ? 'شخص واحد' 
      : detectedCount === 2 
      ? 'شخصين' 
      : `${detectedCount} أشخاص`;
    matchedConfirmed.push(`تحديد عدد الركاب (${countLabel})`);
  }

  for (const item of CONFIRMED_PASSENGER_PATTERNS) {
    if (item.regex.test(rawText) || item.regex.test(normalized)) {
      matchedConfirmed.push(item.label);
    }
  }

  // If safe goods context like "طلب شخصي" or "أغراض شخصية" was matched, check if it was falsely triggered by "شخص"
  if (hasSafeContext && matchedConfirmed.length > 0 && detectedCount === undefined) {
    // If the only matched confirmed pattern was "توصيل شخص" and it's accompanied by "طلب شخصي" / "أغراض شخصية"
    const isOnlyGenericPerson = matchedConfirmed.every((label) => label.includes('توصيل شخص'));
    if (isOnlyGenericPerson) {
      return {
        level: 'goods_safe',
        label: 'توصيل بضائع معتمد (طلب/أغراض شخصية)',
        matchedPhrases: ['طلب/أغراض شخصية (سلعة وليست راكباً)'],
        reason: 'تم التحقق من أن الإعلان يحتوي على غرض أو سلعة شخصية وليس نقل ركاب.',
        isForbidden: false,
      };
    }
  }

  // 1. RED LEVEL: Confirmed Passenger Transport (أحمر نقل أشخاص مؤكد)
  if (matchedConfirmed.length > 0) {
    const countSuffix = detectedCount ? ` (${detectedCount} ${detectedCount === 1 ? 'شخص' : detectedCount === 2 ? 'شخصين' : 'أشخاص'})` : '';
    return {
      level: 'confirmed_passenger',
      label: `تحذير: توصيل أشخاص ممنوع${countSuffix}`,
      matchedPhrases: Array.from(new Set(matchedConfirmed)),
      reason: `تحذير: إعلان نقل ركاب/أشخاص${countSuffix}.`,
      isForbidden: false,
      passengerCount: detectedCount,
    };
  }

  // 2. YELLOW LEVEL: Suspicious Passenger Transport (أصفر احتمال نقل أشخاص - مراجعة مطلوبة)
  const matchedSuspicious: string[] = [];
  for (const item of SUSPICIOUS_PATTERNS) {
    if (item.regex.test(rawText) || item.regex.test(normalized)) {
      matchedSuspicious.push(item.label);
    }
  }

  if (matchedSuspicious.length > 0) {
    // If explicit goods words exist, resolve ambiguous suspicion to safe
    if (hasExplicitGoodsWords) {
      return {
        level: 'goods_safe',
        label: 'توصيل بضائع معتمد',
        matchedPhrases: ['بضاعة محددة مع مشوار توصيل'],
        reason: 'يحتوي الإعلان على إشارة لبضاعة وسلعة ملموسة.',
        isForbidden: false,
      };
    }

    return {
      level: 'suspicious_passenger',
      label: 'احتمال نقل أشخاص (مراجعة مطلوبة)',
      matchedPhrases: Array.from(new Set(matchedSuspicious)),
      reason: 'يحتوي الإعلان على عبارات مشوار عامة قد تشير لنقل ركاب. يرجى التحقق اليدوي من الإعلان قبل القبول.',
      isForbidden: false, // does not hard-block, requires manual review confirmation
    };
  }

  // 3. GREEN LEVEL: Goods Safe Delivery (أخضر توصيل بضائع معتمد)
  return {
    level: 'goods_safe',
    label: 'توصيل بضائع معتمد',
    matchedPhrases: hasExplicitGoodsWords ? ['سلعة/بضاعة ملموسة'] : [],
    reason: 'إعلان توصيل بضائع وطلبات تجارية معتمد.',
    isForbidden: false,
  };
}
