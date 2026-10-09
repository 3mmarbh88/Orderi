import { ParsedOrder, ClosureEvidence } from '../types';
import { normalizeArabicText } from '../data/bahrainAreas';

/**
 * Smart Closed Order Detection Engine (الكشف الذكي عن الطلبات المحجوزة أو المنتهية)
 * 
 * Monitors subsequent WhatsApp replies and messages in groups to detect when an order has been taken or completed:
 * - Confirmed Closed (أُخذ / انتهى): Automatically removed from available active feed, archived in database.
 * - Suspicious Closed (اشتباه حجز): Marked for verification rather than falsely deleted.
 */

// 1. Core Closure Keywords and Expressions
const TAKEN_CONFIRMATION_KEYWORDS = [
  'تم', 'حصلت', 'اخذته', 'أخذته', 'حجزته', 'انحجز', 'محجوز', 
  'اتفقت', 'اتفقت معاه', 'حصلنا مندوب', 'حصلت مندوب', 'توفر مندوب', 
  'تم الاتفاق', 'انا باخذه', 'أنا باخذه', 'عندي الطلب', 'عندي'
];

const COMPLETION_KEYWORDS = [
  'خلاص', 'انتهى', 'تم التوصيل', 'لا يوجد طلب', 'اكتمل', 
  'ملغي', 'الغي', 'التغى', 'تكنسل', 'كنسل'
];

const GRATITUDE_KEYWORDS = [
  'شكرا', 'شكراً', 'مشكور', 'مشكورين', 'يعطيك العافية', 'يعطيكم العافية', 
  'الله يوفقك', 'تسلم', 'تسلمون', 'جزاك الله خير'
];

const CLOSURE_EMOJIS = ['👍', '✅', '👌', '🙏', '🎯', '🤝', '✔️'];

export interface ClosureMatchResult {
  isMatch: boolean;
  orderId: string;
  matchedOrder: ParsedOrder;
  verdict: 'confirmed_closed' | 'suspicious_closed';
  reason: string;
  evidence: ClosureEvidence;
}

/**
 * Checks if incoming message text contains signals of closure
 */
export function extractClosureKeywords(text: string): {
  matchedWords: string[];
  matchedEmojis: string[];
  hasClosureIntent: boolean;
} {
  if (!text) return { matchedWords: [], matchedEmojis: [], hasClosureIntent: false };
  const normalized = normalizeArabicText(text);

  const matchedWords: string[] = [];
  const allKeywords = [...TAKEN_CONFIRMATION_KEYWORDS, ...COMPLETION_KEYWORDS, ...GRATITUDE_KEYWORDS];

  for (const kw of allKeywords) {
    const rx = new RegExp(`(?:^|[\\s،,.])${kw}(?:$|[\\s،,.])`, 'i');
    if (rx.test(normalized)) {
      matchedWords.push(kw);
    }
  }

  const matchedEmojis: string[] = [];
  for (const em of CLOSURE_EMOJIS) {
    if (text.includes(em)) {
      matchedEmojis.push(em);
    }
  }

  const hasClosureIntent = matchedWords.length > 0 || matchedEmojis.length > 0;
  return { matchedWords, matchedEmojis, hasClosureIntent };
}

/**
 * Correlates an incoming WhatsApp message/reply with active orders to detect auto closure
 */
export function checkIncomingMessageForClosure(
  message: {
    text: string;
    senderName?: string;
    senderPhone?: string;
    groupName?: string;
    timestamp?: Date | number;
    rawQuotedText?: string;
  },
  activeOrders: ParsedOrder[]
): ClosureMatchResult | null {
  const rawText = (message.text || '').trim();
  if (!rawText) return null;

  const { matchedWords, matchedEmojis, hasClosureIntent } = extractClosureKeywords(rawText);
  if (!hasClosureIntent) return null;

  const msgTime = message.timestamp 
    ? new Date(message.timestamp).getTime() 
    : Date.now();

  const msgGroup = (message.groupName || '').trim();
  const msgSender = (message.senderName || '').trim();
  const msgPhone = (message.senderPhone || '').replace(/[^\d]/g, '');

  // Filter candidate orders in the same group or cross-posted groups that are not already accepted or closed
  const candidateOrders = activeOrders.filter((order) => {
    if (order.status === 'accepted' || order.status === 'closed_taken') return false;
    
    // Group check: must belong to the same WhatsApp group or crossPostedGroups
    const inSameGroup = 
      (msgGroup && order.groupName && (order.groupName.includes(msgGroup) || msgGroup.includes(order.groupName))) ||
      (order.crossPostedGroups && order.crossPostedGroups.some((g) => g.includes(msgGroup) || msgGroup.includes(g)));

    if (!inSameGroup && msgGroup) return false;

    // Time window check: order must have been posted within the last 3 hours
    const orderTime = new Date(order.receivedAt).getTime();
    const diffHours = (msgTime - orderTime) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 3;
  });

  if (candidateOrders.length === 0) return null;

  // 1. LEVEL 1: Check for Direct Quoted Reply (اقتباس مباشر لنص الطلب)
  // WhatsApp notification quote or message text with ">"
  for (const order of candidateOrders) {
    const orderSnippet = order.rawText.substring(0, 40).trim();
    const fromToMention = order.from && order.to && (rawText.includes(order.from) || rawText.includes(order.to));
    const hasQuotedOrder = 
      (message.rawQuotedText && message.rawQuotedText.includes(order.from)) ||
      rawText.includes(`> ${orderSnippet}`) ||
      (fromToMention && matchedWords.length > 0);

    if (hasQuotedOrder) {
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: 'confirmed_closed',
        reason: `تم رصد رد باقتباس مباشر للإعلان في قروب "${msgGroup || order.groupName}" يفيد بحجز الطلب (${matchedWords.join('، ') || matchedEmojis.join(' ')})`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || 'عضو بالقروب',
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 98,
          isQuote: true,
          matchedKeywords: [...matchedWords, ...matchedEmojis],
        },
      };
    }
  }

  // 2. LEVEL 2: Exact Advertiser Match (نفس صاحب الإعلان أرسل تم / حصلت / شكراً)
  for (const order of candidateOrders) {
    const isSamePhone = msgPhone && order.senderPhone && order.senderPhone.replace(/[^\d]/g, '').includes(msgPhone);
    const isSameSenderName = msgSender && order.senderName && (
      msgSender === order.senderName ||
      msgSender.includes(order.senderName) ||
      order.senderName.includes(msgSender)
    );

    if (isSamePhone || isSameSenderName) {
      // If the advertiser himself sent closure text (e.g. "تم", "حصلت مندوب", "خلاص شكراً")
      const isShortConfirmation = rawText.length <= 35;
      const verdict = isShortConfirmation ? 'confirmed_closed' : 'confirmed_closed';

      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict,
        reason: `أرسل صاحب الإعلان نفسه (${msgSender || order.senderName}) رداً في القروب يفيد باكتمال الطلب: "${rawText}"`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || order.senderName,
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 95,
          isQuote: false,
          matchedKeywords: [...matchedWords, ...matchedEmojis],
        },
      };
    }
  }

  // 3. LEVEL 3: Explicit Route/Area Mention in Reply (e.g. "طلب الرفاع تم" or "طلب العدلية حصلت")
  for (const order of candidateOrders) {
    const mentionsFrom = order.from && rawText.includes(order.from);
    const mentionsTo = order.to && rawText.includes(order.to);
    
    if (mentionsFrom || mentionsTo) {
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: 'confirmed_closed',
        reason: `تم ذكر منطقة الطلب (${order.from} ← ${order.to}) مع تأكيد الإنجاز في القروب: "${rawText}"`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || 'عضو بالقروب',
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 90,
          isQuote: false,
          matchedKeywords: [...matchedWords, ...matchedEmojis],
        },
      };
    }
  }

  // 4. LEVEL 4: Ambiguous Single Order in Group Within Short Window (رد بالقروب في توقيت قريب)
  // If there is ONLY ONE recent pending order in this exact group posted in the last 15 minutes,
  // and someone replied with a clear "تم" or "حصلت مندوب":
  if (candidateOrders.length === 1) {
    const singleOrder = candidateOrders[0];
    const orderAgeSec = (msgTime - new Date(singleOrder.receivedAt).getTime()) / 1000;
    
    // If the reply arrived within 15 minutes of the order posting
    if (orderAgeSec <= 900) {
      const isExplicitConfirmation = matchedWords.some((w) => ['حصلت', 'أخذته', 'اخذته', 'حصلنا مندوب', 'توفر مندوب', 'تم الاتفاق'].includes(w));
      
      return {
        isMatch: true,
        orderId: singleOrder.id,
        matchedOrder: singleOrder,
        verdict: isExplicitConfirmation ? 'confirmed_closed' : 'suspicious_closed',
        reason: isExplicitConfirmation 
          ? `ورد تأكيد أخذ الطلب في القروب: "${rawText}"`
          : `ورد رد محتمل ("${rawText}") في القروب بعد نشر الطلب بوقت قصير. وضع في حالة اشتباه للتحقق.`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || 'عضو بالقروب',
          groupName: msgGroup || singleOrder.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: isExplicitConfirmation ? 88 : 70,
          isQuote: false,
          matchedKeywords: [...matchedWords, ...matchedEmojis],
        },
      };
    }
  }

  return null;
}
