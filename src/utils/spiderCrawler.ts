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
const spiderLogs: SpiderLogEvent[] = [
  {
    id: 'init-spider-1',
    timestamp: new Date().toLocaleTimeString('ar-BH'),
    action: 'SYSTEM',
    groupName: 'محرك عنكبوت الرادار 🕷️',
    detail: 'تشغيل محرك الزحف الذكي المستمر على قروبات الواتساب عبر الذكاء الاصطناعي الهجين (Gemma 3 + Gemini 3.8)',
    latencyMs: 8,
  },
];

const spiderListeners = new Set<(stats: SpiderStats, logs: SpiderLogEvent[]) => void>();

let currentStats: SpiderStats = {
  isActive: true,
  crawlSpeedMs: 3000,
  crawledGroupsCount: 16,
  messagesCrawledCount: 168,
  ordersCapturedCount: 22,
  groupLinksDiscoveredCount: 8,
  spamFilteredCount: 41,
  passengersFilteredCount: 15,
  currentCrawlingGroup: 'قروب مناديب البحرين 🇧🇭',
  lastCrawlTimestamp: Date.now(),
  crawlQueue: [
    'قروب مناديب البحرين 🇧🇭',
    'طلبات المنامة والرفاع 📦',
    'كباتن المحرق والحد 🚗',
    'توصيل مدينة عيسى وسند ⚡',
    'طلبات سار والجنبية 📍',
    'شبكة توصيل المحافظة الشمالية 🛵',
  ],
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
  senderPhone?: string
): Promise<{
  action: SpiderLogEvent['action'];
  order?: any;
  discoveredLink?: any;
  reason?: string;
}> {
  const startTime = performance.now();
  currentStats.messagesCrawledCount += 1;
  currentStats.currentCrawlingGroup = groupName;

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

  // 2. Closure Detection
  const closure = extractClosureKeywords(rawText);
  if (closure.hasClosureIntent) {
    const matchedText = closure.matchedWords.join(', ') || 'تم / حصلت';
    recordSpiderEvent({
      action: 'CLOSED_ORDER',
      groupName,
      detail: `رصد كلمة إغلاق طلب بالقروب (${matchedText}) وأرشفة الطلب في الرادار`,
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

/**
 * Trigger an instant simulated spider crawling pass
 */
export async function triggerSpiderCrawlPass(
  onOrderFound?: (order: any) => void
): Promise<{ success: boolean; crawledGroup: string; itemsIndexed: number }> {
  const groups = currentStats.crawlQueue;
  const pickedGroup = groups[Math.floor(Math.random() * groups.length)];

  const sampleTemplates = [
    {
      text: 'مطلوب مندوب استلام فوري من سيتي سنتر السيف الى الرفاع الشرقي دينارين ونص',
      from: 'السيف',
      to: 'الرفاع',
      price: 2.5,
    },
    {
      text: 'اوردر جاهز الحين من مجمع الإنماء بالرفاع الى مدينة حمد دوار 7 دينارين كاش',
      from: 'الرفاع',
      to: 'مدينة حمد',
      price: 2.0,
    },
    {
      text: 'طلب عطور من المحرق سوق القيصرية الى توبلي 3 دينار مستعجل',
      from: 'المحرق',
      to: 'توبلي',
      price: 3.0,
    },
    {
      text: 'مطلوب كابتن استلام كيك من سار الى الجفير 2.5 دينار الدفع بنفت',
      from: 'سار',
      to: 'الجفير',
      price: 2.5,
    },
    {
      text: 'اوردر حلويات من سلماباد الى البسيتين 2.5 د.ب جاهز للاستلام',
      from: 'سلماباد',
      to: 'البسيتين',
      price: 2.5,
    },
  ];

  const sample = sampleTemplates[Math.floor(Math.random() * sampleTemplates.length)];

  const result = await spiderIngestMessage(
    sample.text,
    pickedGroup,
    'تاجر واتساب نشط',
    '97339887766'
  );

  if (result.order && onOrderFound) {
    onOrderFound(result.order);
  }

  // Also hit server endpoint to synchronize
  try {
    await fetch('/api/spider/crawl-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: pickedGroup }),
    });
  } catch {}

  return {
    success: true,
    crawledGroup: pickedGroup,
    itemsIndexed: result.order ? 1 : 0,
  };
}
