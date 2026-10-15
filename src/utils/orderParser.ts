
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

interface SearchablePlace {
  name: string;
  keywords: string[];
  parentArea?: string;
}

interface PlaceOccurrence {
  name: string;
  start: number;
  end: number;
  keywordLength: number;
}

interface SelectedPrice {
  value: number;
  start: number;
  end: number;
}

/** تحويل الأرقام العربية إلى أرقام إنجليزية. */
export function convertArabicNumerals(str: string): string {
  if (!str) return '';

  const eastern = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';

  return str.replace(/[٠-٩۰-۹]/g, (digit) => {
    const easternIndex = eastern.indexOf(digit);
    if (easternIndex !== -1) return String(easternIndex);

    const persianIndex = persian.indexOf(digit);
    return persianIndex !== -1 ? String(persianIndex) : digit;
  });
}

/**
 * لا يكفي وجود منطقتين لاعتبار الرسالة طلب توصيل.
 * تُستخدم هذه الدالة أيضًا للتحقق من نتيجة الذكاء الاصطناعي المحلي.
 */
export function hasExplicitOrderIntent(rawText: string): boolean {
  if (!rawText || typeof rawText !== 'string') return false;

  // Normalize exaggerated repeated letters common in WhatsApp ads:
  // "مباششششر" -> "مباشر". The original notification text is never modified.
  const text = normalizeArabicText(convertArabicNumerals(rawText))
    .replace(/(.)\1{2,}/gu, '$1');

  // A service provider advertising availability is not a customer order.
  // An explicit request term takes precedence (e.g. "مطلوب مندوب متوفر").
  const serviceOffer =
    /(?:متوفر|متوفرين|نوفر|نقدم|خدمة|خدمات|لدينا|عندنا).{0,18}(?:توصيل|دليفري|مندوب|نقل)|مندوبين?\s*متوفرين|سيارات?\s*توصيل/i.test(text);
  const explicitRequest =
    /(?:مطلوب|ابي|ابغي|احتاج|نحتاج|طلب|استلام|اوردر|بيك\s*اب|pickup|delivery request)/i.test(text);
  if (serviceOffer && !explicitRequest) return false;

  const directIntent =
    /(?:اوردر|توصيل|مندوب|بيك\s*اب|بيكاب|pickup|delivery|courier|driver|كابتن|دليفري)/i;

  const combinedRequest =
    /(?:طلب|مطلوب|ابي|ابغي|احتاج|نحتاج)\s*(?:توصيل|مندوب|سائق|كابتن|بيك\s*اب|اوردر|delivery|pickup)/i;

  // Bahrain group ads may express a job as a route + fare + direct/request wording.
  const routeAndFare =
    /.+(?:الى|إلى)\s*.+/i.test(text) &&
    (/\d+(?:\.\d+)?\s*(?:دينار|دنانير|د\.?\s*ب|دب|bhd|bd)/i.test(text) ||
      /دينارين|(?:ثلاثه|ثلاثة|ثلاث)\s+دنانير|(?:اربعه|أربعة|اربع)\s+دنانير|(?:خمسه|خمسة|خمس)\s+دنانير/i.test(text));
  const directOrRequestWording =
    /مباشر|اذكر\s+(?:منطقتك|المنطقه)|لو\s+سمحت/i.test(text);

  return directIntent.test(text) || combinedRequest.test(text) ||
    (routeAndFare && directOrRequestWording);
}

function cleanText(value: string): string {
  return value
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * يوحّد الاختصارات والأسماء الشعبية الشائعة في إعلانات التوصيل البحرينية
 * قبل البحث عن المناطق. لا يغيّر قاعدة إنشاء الطلب؛ تبقى نية التوصيل
 * الصريحة وبقية فحوصات السلامة مطلوبة.
 */
function expandBahrainAreaAliases(text: string): string {
  const aliases: Array<[string, string]> = [
    ['م. عيسى', 'مدينة عيسى'],
    ['م عيسى', 'مدينة عيسى'],
    ['م. عيسي', 'مدينة عيسى'],
    ['م عيسي', 'مدينة عيسى'],
    ['م. حمد', 'مدينة حمد'],
    ['م حمد', 'مدينة حمد'],
    ['الجنيبية', 'الجنبية'],
    ['الجنيبيه', 'الجنبية'],
    ['جنيبية', 'الجنبية'],
    ['جنيبيه', 'الجنبية'],
    ['قضيبية', 'القضيبية'],
    ['قضيبيه', 'القضيبية'],
    ['رفاع', 'الرفاع'],
    ['منامه', 'المنامة'],
    ['منامة', 'المنامة'],
    ['محرق', 'المحرق'],
    ['قلالى', 'قلالي'],
    ['قلالي', 'قلالي'],
    ['ستره', 'سترة'],
    ['سترة', 'سترة'],
    ['الرفاع الشرقي', 'الرفاع الشرقي'],
    ['الرفاع الغربي', 'الرفاع الغربي'],
    ['الحد', 'الحد'],
  ];

  let expanded = text.replace(/\s+/g, ' ').trim();
  const boundary = '[^a-z0-9\\u0600-\\u06FF]';

  for (const [alias, canonical] of aliases.sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    const normalizedAlias = normalizeArabicText(alias);
    const normalizedCanonical = normalizeArabicText(canonical);
    if (!normalizedAlias || normalizedAlias === normalizedCanonical) continue;

    const pattern = new RegExp(
      `(^|${boundary})(${escapeRegExp(normalizedAlias)})(?=$|${boundary})`,
      'gi',
    );
    expanded = expanded.replace(pattern, `$1${normalizedCanonical}`);
  }

  return expanded;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWordCharacter(char: string | undefined): boolean {
  return !!char && /[a-z0-9\u0600-\u06FF]/i.test(char);
}

/** يمنع مطابقة اسم منطقة كجزء من كلمة أطول. */
function hasWordBoundaries(text: string, start: number, end: number): boolean {
  return (
    !isWordCharacter(text[start - 1]) &&
    !isWordCharacter(text[end])
  );
}

function emptyPassengerDetection(): PassengerDetection {
  return {
    level: 'goods_safe',
    label: 'توصيل بضائع معتمد',
    matchedPhrases: [],
    reason: 'النص فارغ',
    isForbidden: false,
  };
}

function emptyResult(): RawParsedResult {
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
    passengerDetection: emptyPassengerDetection(),
  };
}

/** استخراج رقم هاتف بحريني، مع توحيد الصيغة إلى 973XXXXXXXX. */
function extractPhone(text: string): string {
  const phoneRegex =
    /(?:\+?973|00973)?[\s-]*(17\d{6}|[36]\d{7})/g;

  let match: RegExpExecArray | null;

  while ((match = phoneRegex.exec(text)) !== null) {
    const raw = match[0];
    const digits = raw.replace(/\D/g, '');
    const localNumber = digits.startsWith('00973')
      ? digits.slice(5)
      : digits.startsWith('973') && digits.length === 11
        ? digits.slice(3)
        : digits;

    if (/^(?:3\d{7}|6\d{7}|17\d{6})$/.test(localNumber)) {
      return `973${localNumber}`;
    }
  }

  return '';
}

function isPassengerCountContext(
  text: string,
  start: number,
  end: number,
): boolean {
  const before = text.slice(Math.max(0, start - 24), start);
  const after = text.slice(end, Math.min(text.length, end + 28));

  const passengerWords =
    /(?:اشخاص|شخص|ركاب|افراد|ناس|بنات|اطفال|عمال|ركاب)/i;

  // «5 أشخاص» أو «عدد الركاب 5» ليست أجرة.
  if (passengerWords.test(after)) return true;

  if (
    /(?:عدد\s*(?:الركاب|الاشخاص|الافراد)|ركاب|اشخاص|افراد)\s*[:=]?\s*$/i.test(
      before,
    )
  ) {
    return true;
  }

  return false;
}

/** استخراج السعر فقط عند وجود عملة أو وصف صريح للسعر. */
function extractPrice(text: string): SelectedPrice | null {
  // Common written fare amounts used in local WhatsApp groups.
  // Only map unambiguous number words; do not guess from a bare "دنانير".
  const writtenPrices: Array<[RegExp, number]> = [
    [/نص\s+دينار|نصف\s+دينار/i, 0.5],
    [/دينار\s+واحد|دينار\s+واحده/i, 1],
    [/دينارين/i, 2],
    [/(?:ثلاثه|ثلاثة|ثلاث)\s+دنانير/i, 3],
    [/(?:اربعه|أربعة|اربع)\s+دنانير/i, 4],
    [/(?:خمسه|خمسة|خمس)\s+دنانير/i, 5],
    [/(?:سته|ستة|ست)\s+دنانير/i, 6],
    [/(?:سبعه|سبعة|سبع)\s+دنانير/i, 7],
    [/(?:ثمانيه|ثمانية|ثمان)\s+دنانير/i, 8],
    [/(?:تسعه|تسعة|تسع)\s+دنانير/i, 9],
    [/(?:عشره|عشرة|عشر)\s+دنانير/i, 10],
  ];

  for (const [pattern, value] of writtenPrices) {
    const match = pattern.exec(text);
    if (match && match.index !== undefined) {
      return {
        value,
        start: match.index,
        end: match.index + match[0].length,
      };
    }
  }

  const patterns = [
    // 3.5 د.ب، 5 دنانير، 2 BHD
    /(\d{1,3}(?:\.\d{1,2})?)\s*(?:دينار\s*بحريني|دنانير|دينار|د\.?\s*ب|دب|BHD|BD)(?![a-z])/i,

    // د.ب 3.5، دينار: 5
    /(?:دينار\s*بحريني|دنانير|دينار|د\.?\s*ب|دب|BHD|BD)\s*[:=]?\s*(\d{1,3}(?:\.\d{1,2})?)/i,

    // السعر: 4، الأجرة 3.5، الحساب 2
    /(?:السعر|سعر|الاجر|الاجرة|اجرة|المبلغ|الحساب|بقيمة|قيمة\s*الطلب)\s*[:=]?\s*(?:بـ?\s*)?(\d{1,3}(?:\.\d{1,2})?)(?!\d)/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match || match.index === undefined) continue;

    const numberText = match[1];
    const numberOffset = match[0].lastIndexOf(numberText);
    const start = match.index + numberOffset;
    const end = start + numberText.length;
    const value = Number(numberText);

    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 100 ||
      isPassengerCountContext(text, start, end)
    ) {
      continue;
    }

    // لا نأخذ رقمًا يمثل جزءًا من رقم هاتف أطول.
    if (/\d/.test(text[start - 1] || '') || /\d/.test(text[end] || '')) {
      continue;
    }

    return { value, start, end };
  }

  return null;
}

function buildSearchablePlaces(): SearchablePlace[] {
  const places: SearchablePlace[] = [
    ...BAHRAIN_LANDMARKS.map((landmark) => ({
      name: landmark.name,
      keywords: [landmark.name, ...(landmark.keywords || [])].filter(
        (value): value is string => typeof value === 'string' && !!value.trim(),
      ),
      parentArea: landmark.parentAreaName,
    })),
    ...BAHRAIN_AREAS.map((area) => ({
      name: area.name,
      // "وزارة التربية" is used as a destination landmark in Isa Town.
      // Resolve it to the known area rather than inventing an address.
      keywords: [
        area.name,
        area.nameEn,
        ...(area.id === 'isa_town'
          ? ['وزارة التربية', 'وزارة التربيه', 'وزاره التربيه', 'وزاره التربيه مدينة عيسى']
          : []),
      ].filter(
        (value): value is string => typeof value === 'string' && !!value.trim(),
      ),
    })),
  ];

  // أزل التكرار حسب الاسم لتقليل الالتباس.
  const unique = new Map<string, SearchablePlace>();

  for (const place of places) {
    const key = normalizeArabicText(place.name);
    if (!key) continue;

    const existing = unique.get(key);

    if (existing) {
      existing.keywords = [...new Set([...existing.keywords, ...place.keywords])];
    } else {
      unique.set(key, {
        ...place,
        keywords: [...new Set(place.keywords)],
      });
    }
  }

  return [...unique.values()];
}

const SEARCHABLE_PLACES = buildSearchablePlaces();

function findPlaceOccurrences(text: string): PlaceOccurrence[] {
  const candidates: PlaceOccurrence[] = [];

  for (const place of SEARCHABLE_PLACES) {
    for (const keyword of place.keywords) {
      const normalizedKeyword = normalizeArabicText(keyword);
      if (normalizedKeyword.length < 2) continue;

      let searchFrom = 0;

      while (searchFrom < text.length) {
        const start = text.indexOf(normalizedKeyword, searchFrom);
        if (start === -1) break;

        const end = start + normalizedKeyword.length;

        if (hasWordBoundaries(text, start, end)) {
          candidates.push({
            name: place.name,
            start,
            end,
            keywordLength: normalizedKeyword.length,
          });
        }

        searchFrom = start + 1;
      }
    }
  }

  // الأسماء المركبة الأطول لها الأولوية على الأسماء الجزئية.
  candidates.sort(
    (a, b) =>
      b.keywordLength - a.keywordLength ||
      a.start - b.start,
  );

  const selected: PlaceOccurrence[] = [];

  for (const candidate of candidates) {
    const overlaps = selected.some(
      (item) =>
        candidate.start < item.end &&
        candidate.end > item.start,
    );

    if (!overlaps) selected.push(candidate);
  }

  return selected.sort((a, b) => a.start - b.start);
}

function classifyPlace(
  text: string,
  occurrence: PlaceOccurrence,
): 'from' | 'to' | null {
  // افحص الكلمات القريبة قبل اسم المنطقة؛ لا تعتمد على ترتيب الاسم وحده.
  const prefix = text.slice(Math.max(0, occurrence.start - 48), occurrence.start);

  const fromPattern =
    /(?:استلام\s+من|تحميل\s+من|بيك\s*اب\s+من|pickup\s+from|from|استلام|بيك\s*اب|بيكاب|تحميل|موقع|فرع|من)\s*(?:(?:مجمع|مول|سوق|منطقة|قرية)\s*)?$/i;

  const toPattern =
    /(?:تسليم\s+الى|تسليم\s+ل|توصيل\s+الى|توصيل\s+ل|الى|وجهة|مكان|destination|drop\s*off|to)\s*(?:(?:مجمع|مول|سوق|منطقة|قرية)\s*)?$/i;

  const fromMatch = fromPattern.exec(prefix);
  const toMatch = toPattern.exec(prefix);

  if (fromMatch && toMatch) {
    // استخدم المؤشر الأقرب إلى اسم المنطقة.
    return fromMatch[0].length >= toMatch[0].length ? 'from' : 'to';
  }

  if (fromMatch) return 'from';
  if (toMatch) return 'to';

  return null;
}

function extractAreas(
  normalizedText: string,
  originalText: string,
): { from: string; to: string } {
  const occurrences = findPlaceOccurrences(normalizedText);

  let from = '';
  let to = '';

  const explicitlyFrom: PlaceOccurrence[] = [];
  const explicitlyTo: PlaceOccurrence[] = [];

  for (const occurrence of occurrences) {
    const kind = classifyPlace(normalizedText, occurrence);

    if (kind === 'from') {
      explicitlyFrom.push(occurrence);
    } else if (kind === 'to') {
      explicitlyTo.push(occurrence);
    }
  }

  // اختيار أقرب منطقة إلى مؤشر الاستلام، مع تجنب تعيين نفس المنطقة للطرفين.
  if (explicitlyFrom.length) {
    from = explicitlyFrom[0].name;
  }

  if (explicitlyTo.length) {
    const candidate = explicitlyTo.find((item) => item.name !== from);
    if (candidate) to = candidate.name;
  }

  // عند غياب أحد المؤشرين، لا نعكس المسار تلقائيًا إن كان هناك مؤشر صريح للطرف الآخر.
  if (!from && !to && occurrences.length >= 2) {
    from = occurrences[0].name;
    to = occurrences.find((item) => item.name !== from)?.name || '';
  } else if (from && !to) {
    const candidate = occurrences.find(
      (item) => item.name !== from && item.start > (explicitlyFrom[0]?.start ?? -1),
    );

    if (candidate) to = candidate.name;
  } else if (to && !from) {
    const candidate = [...occurrences]
      .reverse()
      .find((item) => item.name !== to && item.start < (explicitlyTo[0]?.start ?? Infinity));

    if (candidate) from = candidate.name;
  }

  // الوجهة الحرة مقبولة فقط إذا كانت مكتوبة بعد مؤشر وجهة واضح.
  if (!to && from) {
    const freeDestinationPattern =
      /(?:تسليم\s+الى|تسليم\s+ل|توصيل\s+الى|توصيل\s+ل|الى|وجهة|destination|drop\s*off|to)\s+([^\n\r،,]+)/i;

    const match = freeDestinationPattern.exec(originalText);

    if (match?.[1]) {
      let candidate = cleanText(match[1]);

      candidate = candidate
        .replace(/(?:السعر|سعر|الاجر|الاجرة|المبلغ|الحساب)\s*[:=]?.*$/i, '')
        .replace(/\b\d+(?:\.\d+)?\s*(?:دينار|دنانير|د\.?\s*ب|دب|BHD|BD)\b.*$/i, '')
        .replace(/(?:\+?973|00973)?[\s-]*(?:17\d{6}|[36]\d{7}).*$/i, '')
        .replace(/(?:واتساب|واتس|للتواصل|رقم|اتصال).*$/i, '')
        .trim();

      if (
        candidate.length >= 2 &&
        candidate.length <= 45 &&
        normalizeArabicText(candidate) !== normalizeArabicText(from)
      ) {
        to = candidate;
      }
    }
  }

  // لا تنشئ وجهة وهمية مثل «حسب طلب الزبون» هنا.
  // الوجهة غير المحددة تظل فارغة إلى أن تُحدد فعليًا.
  return { from, to };
}

function extractNotes(normalizedText: string): string {
  const noteKeywords = [
    'ورد',
    'باقة',
    'زهور',
    'كيك',
    'حلويات',
    'عطور',
    'هدية',
    'اكل',
    'مطعم',
    'وجبة',
    'مستندات',
    'اوراق',
    'عباية',
    'ملابس',
    'شحنة',
    'امانات',
    'كرتون',
    'طرد',
    'اغراض',
    'بضاعة',
  ];

  for (const keyword of noteKeywords) {
    const escaped = escapeRegExp(normalizeArabicText(keyword));
    const pattern = new RegExp(`(?:^|[^\\u0600-\\u06FFa-z0-9])${escaped}(?:$|[^\\u0600-\\u06FFa-z0-9])`, 'i');

    if (pattern.test(normalizedText)) return keyword;
  }

  return '';
}

interface ScheduleResult {
  scheduledTime?: string;
  scheduledTimeMinutes?: number;
  isFutureSchedule: boolean;
}

function extractScheduledTime(text: string): ScheduleResult {
  const pattern =
    /(?:الساعة|ساعة|على الساعة|في حدود الساعة|توقيت|موعد|وقت)\s*(\d{1,2})(?::(\d{2}))?\s*(صباحا|صباحاً|ص|مساء|مساءً|م|العصر|الظهر|المغرب|بالليل|في الليل|الصبح)?/i;

  const match = pattern.exec(text);

  if (!match) return { isFutureSchedule: false };

  const rawHour = Number(match[1]);
  const rawMinute = match[2] ? Number(match[2]) : 0;
  const period = (match[3] || '').trim();

  if (
    !Number.isInteger(rawHour) ||
    rawHour < 1 ||
    rawHour > 24 ||
    !Number.isInteger(rawMinute) ||
    rawMinute < 0 ||
    rawMinute > 59
  ) {
    return { isFutureSchedule: false };
  }

  const explicitPm = /مساء|العصر|المغرب|بالليل|في الليل/i.test(period);
  const explicitAm = /صباحا|صباحاً|الصبح|^ص$/i.test(period);

  let hour24 = rawHour;

  if (explicitPm && hour24 < 12) hour24 += 12;
  if (explicitAm && hour24 === 12) hour24 = 0;

  // إذا لم يذكر صاحب الإعلان صباحًا أو مساءً، لا نخترع الفترة.
  if (!explicitPm && !explicitAm) {
    return {
      scheduledTime: `الساعة ${rawHour}${rawMinute ? `:${String(rawMinute).padStart(2, '0')}` : ''}`,
      scheduledTimeMinutes: rawHour * 60 + rawMinute,
      isFutureSchedule: true,
    };
  }

  const displayHour = hour24 % 12 || 12;
  const displayPeriod = explicitPm ? 'مساءً' : 'صباحاً';
  const minuteText = rawMinute ? `:${String(rawMinute).padStart(2, '0')}` : '';

  return {
    scheduledTime: `الساعة ${displayHour}${minuteText} ${displayPeriod}`,
    scheduledTimeMinutes: hour24 * 60 + rawMinute,
    isFutureSchedule: true,
  };
}

/**
 * يحلل رسالة واتساب إلى بيانات طلب توصيل.
 * لا ينشئ طلبًا لمجرد وجود منطقتين، ولا يخترع سعرًا غير مذكور.
 */
export function parseWhatsAppOrderText(rawText: string): RawParsedResult {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return emptyResult();
  }

  const convertedText = convertArabicNumerals(rawText);
  const normalized = expandBahrainAreaAliases(normalizeArabicText(convertedText));
  const passengerDetection = detectPassengerDelivery(rawText);

  const phone = extractPhone(convertedText);
  const priceMatch = extractPrice(convertedText);
  const price = priceMatch?.value ?? 0;

  const extractedAreas = extractAreas(normalized, convertedText);
  let fromArea = extractedAreas.from;
  let toArea = extractedAreas.to;

  const notes = extractNotes(normalized);
  const schedule = extractScheduledTime(convertedText);
  const hasIntent = hasExplicitOrderIntent(rawText);

  // الطلب يحتاج إلى نية توصيل واضحة، وموقع استلام، ووجهة محددة.
  // لا تُستخدم وجهة افتراضية لإجبار الرسالة على أن تصبح طلبًا.
  // Repeated same-area forms are common in Bahrain WhatsApp groups:
  // «محرق محرق»، «منامة منامة»، «قلالي قلالي» mean a local/same-area delivery.
  // Accept this only when the same known area appears twice close together and
  // the message independently has explicit delivery intent.
  const occurrences = findPlaceOccurrences(normalized);
  const repeatedSameArea =
    hasIntent &&
    occurrences.length >= 2 &&
    normalizeArabicText(occurrences[0].name) === normalizeArabicText(occurrences[1].name) &&
    occurrences[1].start - occurrences[0].end <= 8 &&
    /^[\\s،,./-]*$/.test(normalized.slice(occurrences[0].end, occurrences[1].start));

  if (repeatedSameArea) {
    fromArea = occurrences[0].name;
    toArea = occurrences[0].name;
  }

  const canCreateOrder =
    hasIntent &&
    !!fromArea &&
    !!toArea &&
    (normalizeArabicText(fromArea) !== normalizeArabicText(toArea) || repeatedSameArea) &&
    !passengerDetection.isForbidden;

  let confidence = 0;

  if (hasIntent) confidence += 20;
  if (fromArea) confidence += 25;
  if (toArea) confidence += 25;
  if (price > 0) confidence += 10;
  if (phone) confidence += 10;
  if (notes) confidence += 5;
  if (schedule.scheduledTime) confidence += 5;

  if (!canCreateOrder) {
    confidence = Math.min(confidence, 49);
  } else {
    confidence = Math.min(confidence, 100);
  }

  return {
    from: fromArea,
    to: toArea,
    price,
    isPriceUnspecified: price <= 0,
    passengerCount: passengerDetection.passengerCount,
    scheduledTime: schedule.scheduledTime,
    scheduledTimeMinutes: schedule.scheduledTimeMinutes,
    isFutureSchedule: schedule.isFutureSchedule,
    phone,
    notes,
    confidence,
    canCreateOrder,
    passengerDetection,
  };
}
