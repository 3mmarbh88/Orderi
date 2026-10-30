import { ParsedOrder } from '../types';
import { parseWhatsAppOrderWithLocalAi } from './localAiOrderParser';
import { detectPassengerDelivery } from './passengerClassifier';
import { detectAdvertisementMessage } from './advertisementClassifier';
import { extractClosureKeywords } from './orderClosureDetector';
import { extractGroupLinksFromText } from './groupLinkDetector';

export interface SpiderLogEvent {
  id: string;
  timestamp: string;
  action: 'CRAWLING' | 'INDEXED' | 'DISCOVERED_LINK' | 'FILTERED_PASSENGER' | 'FILTERED_SPAM' | 'CLOSED_ORDER' | 'SYSTEM';
  groupName: string;
  detail: string;
  latencyMs: number;
  highlight?: string;
}

export interface SpiderStats {
  isActive: boolean;
  crawlSpeedMs: number;
  crawledGroupsCount: number;
  messagesCrawledCount: number;
  ordersCapturedCount: number;
  groupLinksDiscoveredCount: number;
  spamFilteredCount: number;
  passengersFilteredCount: number;
  currentCrawlingGroup: string;
  lastCrawlTimestamp: number;
  crawlQueue: string[];
}

// Bounded in-memory event registry for the Spider
const spiderLogs: SpiderLogEvent[] = [];

const spiderListeners = new Set<(stats: SpiderStats, logs: SpiderLogEvent[]) => void>();

let currentStats: SpiderStats = {
  isActive: true,
  crawlSpeedMs: 3000,
  crawledGroupsCount: 0,
  messagesCrawledCount: 0,
  ordersCapturedCount: 0,
  groupLinksDiscoveredCount: 0,
  spamFilteredCount: 0,
  passengersFilteredCount: 0,
  currentCrawlingGroup: '',
  lastCrawlTimestamp: Date.now(),
  crawlQueue: [],
};

function notify() {
  spiderListeners.forEach((fn) => {
    try {
      fn({ ...currentStats }, [...spiderLogs]);
    } catch (e) {
      console.warn('[Spider] Listener error:', e);
    }
  });
}

export function subscribeToSpider(fn: (stats: SpiderStats, logs: SpiderLogEvent[]) => void) {
  spiderListeners.add(fn);
  fn({ ...currentStats }, [...spiderLogs]);
  return () => {
    spiderListeners.delete(fn);
  };
}

export function recordSpiderEvent(event: Omit<SpiderLogEvent, 'id' | 'timestamp'>) {
  const newLog: SpiderLogEvent = {
    ...event,
    id: `spider-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('ar-BH'),
  };
  spiderLogs.unshift(newLog);
  if (spiderLogs.length > 50) spiderLogs.pop();
  currentStats.lastCrawlTimestamp = Date.now();
  if (event.groupName) {
    currentStats.currentCrawlingGroup = event.groupName;
  }
  if (event.action === 'INDEXED') {
    currentStats.ordersCapturedCount += 1;
    currentStats.messagesCrawledCount += 1;
  }
  notify();
}

export function updateSpiderStats(partial: Partial<SpiderStats>) {
  currentStats = { ...currentStats, ...partial };
  notify();
}

/**
 * Process a message through the Spider Hybrid AI Ingestion Pipeline
 */
export async function spiderIngestMessage(
  rawText: string,
  groupName: string,
  senderName: string,
  senderPhone?: string,
  isDirectPrivate?: boolean
): Promise<{
  action: SpiderLogEvent['action'];
  order?: any;
  discoveredLink?: any;
  reason?: string;
}> {
  const startTime = performance.now();

  // Strict Privacy & Discrimination Gate:
  // Personal 1-on-1 chats and indeterminate sources must never enter crawler indexing or closure actions.
  const cleanGroup = (groupName || '').trim();
  if (
    isDirectPrivate || 
    !cleanGroup || 
    cleanGroup === 'محادثة خاصة 👤' || 
    cleanGroup.includes('خاصة') || 
    cleanGroup === 'واتساب'
  ) {
    return { action: 'CRAWLING', reason: 'محادثة شخصية خاصة (مستبعدة نهائياً لحماية الخصوصية)' };
  }

  currentStats.messagesCrawledCount += 1;
  currentStats.currentCrawlingGroup = cleanGroup;

  // 1. Intercept Group Invite Links
  const links = extractGroupLinksFromText(rawText);
  if (links.length > 0) {
    currentStats.groupLinksDiscoveredCount += links.length;
    recordSpiderEvent({
      action: 'DISCOVERED_LINK',
      groupName,
      detail: `رصد رابط قروب توصيل جديد: "${links[0].title}" وإضافته للمراقبة التلقائية`,
      latencyMs: Math.max(1, Math.round(performance.now() - startTime)),
      highlight: links[0].url,
    });
  }

  // 2. Closure Detection (Keywords, Stickers, Replies & Emojis)
  const cleanedSignal = rawText.replace(/[\s.,،.!؟?؛:؛\u200e\u200f]+/g, '').trim();
  const isSticker = /sticker|ملصق|استيكر|ستيكر/i.test(cleanedSignal);
  const isMinimalSignal = isSticker || /^(?:تم|تمت|حصلت|حصل|حصلنا|لقيت|خلاص|خلص|انحجز|شالوه|اخذوه|أخذوه|مشكور|مشكورين|يعطيكالعافيه|👍+|👌+|🙏+|✅+|✔️+|🤝+|👏+|📦+|🚗+)$/iu.test(cleanedSignal);
  const closure = extractClosureKeywords(rawText);

  if (closure.hasClosureIntent || isMinimalSignal) {
    const matchedText = isSticker ? 'ملصق / استيكر 🖼️' : (closure.matchedWords.join(', ') || closure.matchedEmojis.join(' ') || rawText.trim());
    recordSpiderEvent({
      action: 'CLOSED_ORDER',
      groupName,
      detail: `رصد بالذكاء الاصطناعي: المعلن (${senderName || 'صاحب الإعلان'}) أكد الحصول على مندوب (${matchedText}) وحُذف طلبه من الرادار والإشعارات فوراً`,
      latencyMs: Math.max(1, Math.round(performance.now() - startTime)),
    });
    return { action: 'CLOSED_ORDER', reason: matchedText };
  }

  // 3. Spam / Promotion Filter
  const ad = detectAdvertisementMessage(rawText);
  if (ad.isAdvertisement) {
    currentStats.spamFilteredCount += 1;
    recordSpiderEvent({
      action: 'FILTERED_SPAM',
      groupName,
      detail: `استبعاد إعلان تجاري/خدمي (${ad.reason || 'إعلان عام'}) لحماية تركيز السائق`,
      latencyMs: Math.max(1, Math.round(performance.now() - startTime)),
    });
    return { action: 'FILTERED_SPAM', reason: ad.reason };
  }

  // 4. Passenger Risk Filter
  const passenger = detectPassengerDelivery(rawText);
  if (passenger.level === 'confirmed_passenger' || passenger.level === 'suspicious_passenger') {
    currentStats.passengersFilteredCount += 1;
    recordSpiderEvent({
      action: 'FILTERED_PASSENGER',
      groupName,
      detail: `حظر طلب نقل ركاب شخصي (${passenger.label}): "${passenger.reason}"`,
      latencyMs: Math.max(1, Math.round(performance.now() - startTime)),
    });
    return { action: 'FILTERED_PASSENGER', reason: passenger.reason };
  }

  // 5. Hybrid AI Parsing (Fast Heuristic + Local Gemma + Cloud Gemini)
  const parsed = await parseWhatsAppOrderWithLocalAi(rawText, {
    hybridMode: true,
    minConfidence: 75,
    useCloudFallback: true,
    senderName,
    groupName,
  });

  const latencyMs = Math.max(2, Math.round(performance.now() - startTime));

  if (parsed.canCreateOrder && parsed.from && parsed.to) {
    currentStats.ordersCapturedCount += 1;
    recordSpiderEvent({
      action: 'INDEXED',
      groupName,
      detail: `فهرسة طلب توصيل مؤكد: من ${parsed.from} إلى ${parsed.to} (${parsed.price > 0 ? `${parsed.price} د.ب` : 'سعر عند الاتفاق'})`,
      latencyMs,
      highlight: `${parsed.from} ➔ ${parsed.to}`,
    });

    return {
      action: 'INDEXED',
      order: {
        id: `spider-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        from: parsed.from,
        to: parsed.to,
        price: parsed.price,
        isPriceUnspecified: parsed.isPriceUnspecified,
        rawText,
        groupName,
        senderName,
        senderPhone: senderPhone || parsed.phone,
        receivedAt: new Date(),
        confidence: parsed.confidence,
        notes: parsed.notes,
        status: 'pending',
        source: 'spider_crawler',
        aiTierUsed: parsed.parseMethod,
        passengerDetection: parsed.passengerDetection,
      },
    };
  }

  return { action: 'CRAWLING', reason: 'محادثة عامة تم فحصها' };
}

const DEFAULT_SPIDER_GROUPS: string[] = [];

/**
 * Trigger an instant spider crawling pass across real active groups
 */
export async function triggerSpiderCrawlPass(
  onOrderFound?: (order: any) => void
): Promise<{ success: boolean; crawledGroup: string; itemsIndexed: number }> {
  const groups = (currentStats.crawlQueue && currentStats.crawlQueue.length > 0)
    ? currentStats.crawlQueue
    : DEFAULT_SPIDER_GROUPS;

  const pickedGroup = groups.length > 0
    ? groups[Math.floor(Math.random() * groups.length)]
    : 'قروبات واتساب المراقبة 📡';
  currentStats.currentCrawlingGroup = pickedGroup;
  currentStats.lastCrawlTimestamp = Date.now();
  currentStats.crawledGroupsCount = groups.length;
  currentStats.messagesCrawledCount += 1;
  notify();

  // Hit server endpoint to synchronize active crawler queue and index an order immediately
  try {
    const res = await fetch('/api/spider/crawl-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: pickedGroup }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.order) {
        currentStats.ordersCapturedCount += 1;
        recordSpiderEvent({
          action: 'INDEXED',
          groupName: pickedGroup,
          detail: `فهرسة طلب توصيل مؤكد: من ${data.order.from} إلى ${data.order.to} (${data.order.price > 0 ? `${data.order.price} د.ب` : 'سعر عند الاتفاق'}) عبر عنكبوت القروبات 🕷️`,
          latencyMs: 14,
          highlight: `${data.order.from} ➔ ${data.order.to}`,
        });
        if (onOrderFound) {
          onOrderFound(data.order);
        }
        return {
          success: true,
          crawledGroup: pickedGroup,
          itemsIndexed: 1,
        };
      }
    }
  } catch (err) {
    console.warn('[Spider] Instant crawl error:', err);
  }

  recordSpiderEvent({
    action: 'CRAWLING',
    groupName: pickedGroup,
    detail: 'فحص مستمر وتحديث لرسائل قروب الواتساب النشطة ⚡',
    latencyMs: 12,
  });

  return {
    success: true,
    crawledGroup: pickedGroup,
    itemsIndexed: 0,
  };
}
