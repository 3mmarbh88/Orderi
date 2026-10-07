import { ParsedOrder } from '../types';

const STORAGE_KEY = 'orderi_recent_order_fingerprints';
const EXACT_TTL_MS = 15 * 60 * 1000;
const ROUTE_TTL_MS = 90 * 1000;
const MAX_ITEMS = 120;

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u200E\u200F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanAnnouncementText(order: Partial<ParsedOrder>): string {
  return normalize(order.rawText || '')
    .replace(/(?:\+?973|00973)?\s*[36]\d{7}/g, '')
    .replace(/\b(?:الساعه|الساعة|الوقت)\s*[:\-]?\s*\d{1,2}[:.]\d{2}\b/g, '')
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fingerprint used to collapse the same WhatsApp order when the advertiser
 * posts it in several groups. Exact message matches have a longer TTL;
 * route+price matches only suppress rapid cross-group reposts.
 */
export function getOrderFingerprints(order: Partial<ParsedOrder>) {
  const from = normalize(order.from);
  const to = normalize(order.to);
  const price = Number(order.price || 0).toFixed(1);
  const text = cleanAnnouncementText(order);

  const exact = `${from}|${to}|${price}|${text}`;
  const route = `${from}|${to}|${price}`;

  return { exact, route };
}

export function isDuplicateOrder(order: Partial<ParsedOrder>, now = Date.now()): boolean {
  const { exact, route } = getOrderFingerprints(order);

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const recent = Array.isArray(saved) ? saved.filter((x: any) => now - Number(x.at || 0) < EXACT_TTL_MS) : [];

    const duplicate = recent.some((x: any) =>
      x.exact === exact ||
      (x.route === route && now - Number(x.at || 0) < ROUTE_TTL_MS)
    );

    // Keep the fingerprint store compact.
    const next = recent.slice(-(MAX_ITEMS - 1));
    if (!duplicate) {
      next.push({ exact, route, at: now });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }

    return duplicate;
  } catch {
    return false;
  }
}

export function rememberOrderFingerprint(order: Partial<ParsedOrder>, now = Date.now()): void {
  try {
    const { exact, route } = getOrderFingerprints(order);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const recent = Array.isArray(saved) ? saved.filter((x: any) => now - Number(x.at || 0) < EXACT_TTL_MS) : [];
    if (!recent.some((x: any) => x.exact === exact)) {
      recent.push({ exact, route, at: now });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(-MAX_ITEMS)));
    }
  } catch {}
}
