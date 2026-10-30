import { ParsedOrder } from '../types';
import { normalizePhoneNumber } from './contacts';

const STORAGE_KEY = 'orderi_recent_order_fingerprints';
const DEDUP_TTL_MS = 30 * 60 * 1000; // 30 minutes window for cross-group reposts
const RAPID_ROUTE_TTL_MS = 15 * 60 * 1000; // 15 minutes window for identical route cross-posts
const MAX_ITEMS = 200;

// In-memory fast synchronous registry to eliminate React async state race conditions
const inMemoryOrderRegistry: ParsedOrder[] = [];

/**
 * Normalizes Arabic text by standardizing letter variants, removing diacritics and noise
 */
export function normalizeArabicText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel
    .replace(/[\u200E\u200F]/g, '') // LTR/RTL marks
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts Bahrain phone number (8 digits) from phone string or text body
 */
export function extractBahrainPhone(phone?: string, text?: string): string {
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 8) {
      const last8 = digits.slice(-8);
      if (/^[36]\d{7}$/.test(last8)) return last8;
    }
  }

  if (text) {
    const match = text.match(/(?:\+?973|00973)?\s*([36]\d{7})\b/);
    if (match && match[1]) return match[1];
  }

  return '';
}

/**
 * Normalizes area names by stripping common Bahrain prefixes ("مجمع", "سوق", "دوار", etc.)
 */
export function normalizeAreaName(area?: string): string {
  if (!area) return '';
  const norm = normalizeArabicText(area);
  return norm
    .replace(/\b(?:مجمع|سوق|دوار|شارع|حي|قرية|قريه|ضاحية|ضاحيه|مدينة|مدينه|منطقة|منطقه|محافظة|محافظه|بحرين|البحرين)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim() || norm;
}

/**
 * Checks if two area strings refer to the same location (exact, substring, or stripped)
 */
export function isSameArea(area1?: string, area2?: string): boolean {
  if (!area1 || !area2) return false;
  const a1 = normalizeArabicText(area1);
  const a2 = normalizeArabicText(area2);
  if (!a1 || !a2) return false;

  // 1. Direct normalized equality
  if (a1 === a2) return true;

  // 2. Mutual inclusion (e.g. "السيف" in "مجمع السيف" or "الرفاع" in "الرفاع الشرقي")
  if (a1.length >= 3 && a2.length >= 3) {
    if (a1.includes(a2) || a2.includes(a1)) return true;
  }

  // 3. Stripped prefix comparison
  const stripped1 = normalizeAreaName(area1);
  const stripped2 = normalizeAreaName(area2);
  if (stripped1 && stripped2) {
    if (stripped1 === stripped2) return true;
    if (stripped1.length >= 3 && stripped2.length >= 3) {
      if (stripped1.includes(stripped2) || stripped2.includes(stripped1)) return true;
    }
  }

  return false;
}

/**
 * Cleans announcement text for comparison by removing phone numbers, times, and filler words
 */
export function cleanAnnouncementText(order: Partial<ParsedOrder>): string {
  return normalizeArabicText(order.rawText || '')
    .replace(/(?:\+?973|00973)?\s*[36]\d{7}/g, '')
    .replace(/\b(?:الساعه|الساعة|الوقت|توقيت|فوري|عاجل|الان|الآن|اليوم|صباحا|مساء|الحين|حالا)\b/g, '')
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ARABIC_DELIVERY_STOP_WORDS = new Set([
  'من', 'الى', 'الي', 'في', 'علي', 'على', 'مع', 'عن', 'هو', 'هي', 'او', 'و',
  'طلب', 'طلبية', 'طلبية', 'توصيل', 'مطلوب', 'مندوب', 'كابتن', 'سايق', 'سائق',
  'دينار', 'دب', 'د', 'ب', 'فوري', 'الان', 'الآن', 'عاجل', 'استلام', 'تسليم',
  'جاهز', 'للتواصل', 'واتساب', 'بحرين', 'البحرين', 'رقم', 'هاتف', 'اتصال'
]);

/**
 * Computes Jaccard similarity of significant delivery keywords between two texts
 */
export function calculateDeliveryTextSimilarity(text1?: string, text2?: string): number {
  if (!text1 || !text2) return 0;
  const words1 = normalizeArabicText(text1).split(/\s+/).filter(w => w.length >= 2 && !ARABIC_DELIVERY_STOP_WORDS.has(w));
  const words2 = normalizeArabicText(text2).split(/\s+/).filter(w => w.length >= 2 && !ARABIC_DELIVERY_STOP_WORDS.has(w));

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let intersectionCount = 0;
  for (const w of set1) {
    if (set2.has(w)) intersectionCount++;
  }

  const unionCount = new Set([...words1, ...words2]).size;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

/**
 * Checks if two sender identities represent the same advertiser
 */
export function isSameAdvertiser(
  phone1?: string,
  name1?: string,
  phone2?: string,
  name2?: string,
  rawText1?: string,
  rawText2?: string
): boolean {
  const p1 = extractBahrainPhone(phone1, rawText1);
  const p2 = extractBahrainPhone(phone2, rawText2);

  // 1. Phone number match (Bahrain 8 digits) - conclusive proof of same advertiser
  if (p1 && p2 && p1 === p2) {
    return true;
  }

  // 2. Sender name match (excluding generic labels)
  const n1 = normalizeArabicText(name1 || '');
  const n2 = normalizeArabicText(name2 || '');
  const genericNames = ['تاجر واتساب', 'معلن', 'معلن واتساب', 'كابتن', 'مندوب', 'مجهول', 'غير معروف', 'whatsapp', 'admin', 'قروب', 'مجموعة'];

  const isGeneric1 = !n1 || genericNames.some(g => n1 === g || n1.includes(g));
  const isGeneric2 = !n2 || genericNames.some(g => n2 === g || n2.includes(g));

  if (!isGeneric1 && !isGeneric2) {
    if (n1 === n2) return true;
    if (n1.length >= 3 && n2.length >= 3) {
      if (n1.includes(n2) || n2.includes(n1)) return true;
    }
    // Token overlap between advertiser names (e.g. "مطبخ الضيافة" and "مطبخ الضيافة البحريني")
    const words1 = n1.split(/\s+/).filter(w => w.length >= 2);
    const words2 = n2.split(/\s+/).filter(w => w.length >= 2);
    const set1 = new Set(words1);
    const shared = words2.filter(w => set1.has(w)).length;
    if (shared >= 2 || (shared === 1 && words1.length <= 2 && words2.length <= 2)) {
      return true;
    }
  }

  return false;
}

/**
 * Registers an order into the fast synchronous in-memory registry
 */
export function registerOrderInDedupRegistry(order: ParsedOrder): void {
  if (!order || !order.id) return;
  const existingIdx = inMemoryOrderRegistry.findIndex(o => o.id === order.id);
  if (existingIdx !== -1) {
    inMemoryOrderRegistry[existingIdx] = order;
  } else {
    inMemoryOrderRegistry.unshift(order);
    if (inMemoryOrderRegistry.length > 80) inMemoryOrderRegistry.pop();
  }
}

/**
 * Compares an incoming order against active orders in memory to determine
 * if it is a cross-group duplicate posted by the same advertiser.
 */
export function findDuplicateOrderMatch(
  newOrder: Partial<ParsedOrder>,
  existingOrders: ParsedOrder[],
  now = Date.now()
): ParsedOrder | null {
  if (!newOrder) return null;

  // Combine passed existingOrders with the fast in-memory synchronous registry
  const combinedMap = new Map<string, ParsedOrder>();
  if (Array.isArray(existingOrders)) {
    existingOrders.forEach(o => { if (o && o.id) combinedMap.set(o.id, o); });
  }
  inMemoryOrderRegistry.forEach(o => { if (o && o.id && !combinedMap.has(o.id)) combinedMap.set(o.id, o); });

  const allOrders = Array.from(combinedMap.values());
  if (allOrders.length === 0) return null;

  const newFrom = newOrder.from || '';
  const newTo = newOrder.to || '';
  const newCleanText = cleanAnnouncementText(newOrder);
  const newPrice = Number(newOrder.price || 0);
  const newPhone = extractBahrainPhone(newOrder.senderPhone, newOrder.rawText);

  for (const existing of allOrders) {
    // Skip if comparing to exact same order ID
    if (existing.id === newOrder.id) continue;

    const existingTime = existing.receivedAt ? new Date(existing.receivedAt).getTime() : now;
    const timeDiff = Math.abs(now - existingTime);
    if (timeDiff > DEDUP_TTL_MS) continue;

    const exFrom = existing.from || '';
    const exTo = existing.to || '';
    const exCleanText = cleanAnnouncementText(existing);
    const exPrice = Number(existing.price || 0);
    const exPhone = extractBahrainPhone(existing.senderPhone, existing.rawText);

    const samePhone = Boolean(newPhone && exPhone && newPhone === exPhone);
    const samePickup = isSameArea(newFrom, exFrom);
    const sameDropoff = isSameArea(newTo, exTo);
    const sameRoute = samePickup && sameDropoff;

    const sameAdv = isSameAdvertiser(
      newOrder.senderPhone,
      newOrder.senderName,
      existing.senderPhone,
      existing.senderName,
      newOrder.rawText,
      existing.rawText
    );

    // Rule 1: Same advertiser phone number posted within 30 minutes
    // If phone matches, and either route matches or text similarity is high or both are in monitored window
    if (samePhone) {
      if (sameRoute || samePickup || sameDropoff) {
        return existing;
      }
      const similarity = calculateDeliveryTextSimilarity(newOrder.rawText, existing.rawText);
      if (similarity >= 0.30 || timeDiff <= 20 * 60 * 1000) {
        return existing;
      }
    }

    // Rule 2: Same advertiser identity + Same route (from -> to) across groups
    if (sameAdv && sameRoute) {
      return existing;
    }

    // Rule 3: Same route (pickup & destination match) within 20 minutes with matching price
    // (In Bahrain WhatsApp groups, identical pickup + destination posted within 20 mins is the same order)
    if (sameRoute) {
      const priceDifference = Math.abs(newPrice - exPrice);
      // Either exact price, or within 0.5 BHD, or one/both price unspecified (0)
      if (priceDifference <= 0.5 || newPrice === 0 || exPrice === 0) {
        if (timeDiff <= RAPID_ROUTE_TTL_MS) {
          return existing;
        }
      }
    }

    // Rule 4: Significant text similarity (advertiser copied & pasted announcement across groups)
    const textSim = calculateDeliveryTextSimilarity(newOrder.rawText, existing.rawText);
    if (textSim >= 0.50) {
      return existing;
    }
    if (textSim >= 0.35 && (samePickup || sameDropoff)) {
      return existing;
    }

    // Rule 5: Exact cleaned text match (>= 8 chars)
    if (newCleanText.length >= 8 && exCleanText.length >= 8 && newCleanText === exCleanText) {
      return existing;
    }

    // Rule 6: Same advertiser name + matching price + same pickup or dropoff
    if (sameAdv && Math.abs(newPrice - exPrice) <= 0.5 && (samePickup || sameDropoff) && timeDiff <= 20 * 60 * 1000) {
      return existing;
    }
  }

  return null;
}

/**
 * Checks localStorage cache to prevent duplicate alerts and notifications across sessions
 */
export function isDuplicateOrder(order: Partial<ParsedOrder>, now = Date.now()): boolean {
  const normPhone = extractBahrainPhone(order.senderPhone, order.rawText);
  const fromNorm = normalizeArabicText(order.from);
  const toNorm = normalizeArabicText(order.to);
  const cleanText = cleanAnnouncementText(order);
  const price = Number(order.price || 0).toFixed(1);

  const exactKey = `${fromNorm}|${toNorm}|${price}|${cleanText}`;
  const routeKey = `${normalizeAreaName(order.from)}|${normalizeAreaName(order.to)}|${price}`;
  const advertiserRouteKey = normPhone ? `${normPhone}|${normalizeAreaName(order.from)}|${normalizeAreaName(order.to)}` : '';

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const recent = Array.isArray(saved) 
      ? saved.filter((x: any) => now - Number(x.at || 0) < DEDUP_TTL_MS) 
      : [];

    const isDup = recent.some((x: any) => {
      // 1. Same exact announcement message
      if (x.exactKey === exactKey) return true;
      // 2. Same advertiser phone + route within 30 mins
      if (advertiserRouteKey && x.advRouteKey === advertiserRouteKey) return true;
      // 3. Same phone number posted within 20 mins
      if (normPhone && x.senderPhone === normPhone && (now - Number(x.at || 0)) < 20 * 60 * 1000) return true;
      // 4. Same route + price within 15 minutes
      if (x.routeKey === routeKey && (now - Number(x.at || 0)) < RAPID_ROUTE_TTL_MS) return true;
      return false;
    });

    const next = recent.slice(-(MAX_ITEMS - 1));
    if (!isDup) {
      next.push({
        exactKey,
        routeKey,
        advRouteKey: advertiserRouteKey,
        senderPhone: normPhone,
        group: order.groupName,
        at: now,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }

    return isDup;
  } catch {
    return false;
  }
}

/**
 * Permanently remembers an order fingerprint in localStorage to prevent duplicate alerts
 */
export function rememberOrderFingerprint(order: Partial<ParsedOrder>, now = Date.now()): void {
  try {
    const normPhone = extractBahrainPhone(order.senderPhone, order.rawText);
    const fromNorm = normalizeArabicText(order.from);
    const toNorm = normalizeArabicText(order.to);
    const cleanText = cleanAnnouncementText(order);
    const price = Number(order.price || 0).toFixed(1);

    const exactKey = `${fromNorm}|${toNorm}|${price}|${cleanText}`;
    const routeKey = `${normalizeAreaName(order.from)}|${normalizeAreaName(order.to)}|${price}`;
    const advertiserRouteKey = normPhone ? `${normPhone}|${normalizeAreaName(order.from)}|${normalizeAreaName(order.to)}` : '';

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const recent = Array.isArray(saved)
      ? saved.filter((x: any) => now - Number(x.at || 0) < DEDUP_TTL_MS)
      : [];

    if (!recent.some((x: any) => x.exactKey === exactKey || (advertiserRouteKey && x.advRouteKey === advertiserRouteKey))) {
      recent.push({
        exactKey,
        routeKey,
        advRouteKey: advertiserRouteKey,
        senderPhone: normPhone,
        group: order.groupName,
        at: now,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(-MAX_ITEMS)));
    }
  } catch {}
}
