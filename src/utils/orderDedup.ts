import { ParsedOrder } from '../types';
import { normalizePhoneNumber } from './contacts';

const STORAGE_KEY = 'orderi_recent_order_fingerprints';
const DEDUP_TTL_MS = 20 * 60 * 1000; // 20 minutes window for cross-group reposts
const RAPID_ROUTE_TTL_MS = 3 * 60 * 1000; // 3 minutes window for identical route + price
const MAX_ITEMS = 150;

export function normalizeArabicText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u200E\u200F]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanAnnouncementText(order: Partial<ParsedOrder>): string {
  return normalizeArabicText(order.rawText || '')
    .replace(/(?:\+?973|00973)?\s*[36]\d{7}/g, '')
    .replace(/\b(?:الساعه|الساعة|الوقت|توقيت|فوري|عاجل|الان|الآن)\b/g, '')
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if two sender identities represent the same advertiser
 */
export function isSameAdvertiser(
  phone1?: string,
  name1?: string,
  phone2?: string,
  name2?: string
): boolean {
  const normP1 = normalizePhoneNumber(phone1 || '');
  const normP2 = normalizePhoneNumber(phone2 || '');

  // If both have phones (8 digits in Bahrain), compare phone numbers
  if (normP1 && normP2 && normP1.length >= 7 && normP2.length >= 7) {
    if (normP1 === normP2 || normP1.endsWith(normP2) || normP2.endsWith(normP1)) {
      return true;
    }
  }

  // If names are meaningful (not generic defaults) and match closely
  const n1 = normalizeArabicText(name1 || '');
  const n2 = normalizeArabicText(name2 || '');
  const genericNames = ['تاجر واتساب', 'معلن', 'كابتن', 'مندوب', 'مجهول', 'غير معروف', 'whatsapp'];

  if (n1 && n2 && !genericNames.includes(n1) && !genericNames.includes(n2)) {
    if (n1 === n2 || (n1.length > 5 && (n1.includes(n2) || n2.includes(n1)))) {
      return true;
    }
  }

  return false;
}

/**
 * Compares an incoming order against currently active orders in memory to find
 * if it is a cross-group duplicate posted by the same advertiser.
 */
export function findDuplicateOrderMatch(
  newOrder: Partial<ParsedOrder>,
  existingOrders: ParsedOrder[],
  now = Date.now()
): ParsedOrder | null {
  if (!newOrder || !Array.isArray(existingOrders) || existingOrders.length === 0) {
    return null;
  }

  const fromNorm = normalizeArabicText(newOrder.from);
  const toNorm = normalizeArabicText(newOrder.to);
  const cleanText = cleanAnnouncementText(newOrder);
  const price = Number(newOrder.price || 0);

  for (const existing of existingOrders) {
    // Skip if comparing to itself
    if (existing.id === newOrder.id) continue;

    const existingTime = existing.receivedAt ? new Date(existing.receivedAt).getTime() : now;
    const timeDiff = now - existingTime;
    if (timeDiff > DEDUP_TTL_MS || timeDiff < -DEDUP_TTL_MS) continue;

    const exFromNorm = normalizeArabicText(existing.from);
    const exToNorm = normalizeArabicText(existing.to);
    const exCleanText = cleanAnnouncementText(existing);
    const exPrice = Number(existing.price || 0);

    // Rule 1: Same advertiser posted the same route (from -> to) across groups
    const sameAdv = isSameAdvertiser(
      newOrder.senderPhone,
      newOrder.senderName,
      existing.senderPhone,
      existing.senderName
    );

    const sameRoute = fromNorm && exFromNorm && fromNorm === exFromNorm && toNorm && exToNorm && toNorm === exToNorm;

    if (sameAdv && sameRoute) {
      return existing;
    }

    // Rule 2: Same advertiser posted matching price and text snippet
    if (sameAdv && Math.abs(price - exPrice) <= 0.5 && cleanText && exCleanText && (cleanText.includes(exCleanText) || exCleanText.includes(cleanText))) {
      return existing;
    }

    // Rule 3: Exact same announcement text posted across different groups
    if (cleanText.length >= 10 && exCleanText.length >= 10 && cleanText === exCleanText) {
      return existing;
    }

    // Rule 4: Rapid identical route + price repost within 3 minutes (e.g. from different forwarders)
    if (sameRoute && Math.abs(price - exPrice) < 0.1 && timeDiff < RAPID_ROUTE_TTL_MS) {
      return existing;
    }
  }

  return null;
}

/**
 * Checks localStorage cache to prevent duplicate alerts across page reloads/sessions
 */
export function isDuplicateOrder(order: Partial<ParsedOrder>, now = Date.now()): boolean {
  const normPhone = normalizePhoneNumber(order.senderPhone || '');
  const fromNorm = normalizeArabicText(order.from);
  const toNorm = normalizeArabicText(order.to);
  const cleanText = cleanAnnouncementText(order);
  const price = Number(order.price || 0).toFixed(1);

  const exactKey = `${fromNorm}|${toNorm}|${price}|${cleanText}`;
  const routeKey = `${fromNorm}|${toNorm}|${price}`;
  const advertiserRouteKey = normPhone ? `${normPhone}|${fromNorm}|${toNorm}` : '';

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const recent = Array.isArray(saved) 
      ? saved.filter((x: any) => now - Number(x.at || 0) < DEDUP_TTL_MS) 
      : [];

    const isDup = recent.some((x: any) => {
      // Same exact message
      if (x.exactKey === exactKey) return true;
      // Same advertiser + same route within 20 mins
      if (advertiserRouteKey && x.advRouteKey === advertiserRouteKey) return true;
      // Same route + price within 3 minutes
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

export function rememberOrderFingerprint(order: Partial<ParsedOrder>, now = Date.now()): void {
  try {
    const normPhone = normalizePhoneNumber(order.senderPhone || '');
    const fromNorm = normalizeArabicText(order.from);
    const toNorm = normalizeArabicText(order.to);
    const cleanText = cleanAnnouncementText(order);
    const price = Number(order.price || 0).toFixed(1);

    const exactKey = `${fromNorm}|${toNorm}|${price}|${cleanText}`;
    const routeKey = `${fromNorm}|${toNorm}|${price}`;
    const advertiserRouteKey = normPhone ? `${normPhone}|${fromNorm}|${toNorm}` : '';

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const recent = Array.isArray(saved)
      ? saved.filter((x: any) => now - Number(x.at || 0) < DEDUP_TTL_MS)
      : [];

    if (!recent.some((x: any) => x.exactKey === exactKey)) {
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
