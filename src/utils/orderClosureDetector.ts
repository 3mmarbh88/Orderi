import { ParsedOrder, ClosureEvidence } from '../types';
import { normalizeArabicText } from '../data/bahrainAreas';
import { getAggregatedClosureDictionary } from './aiClosureLearner';

/**
 * Smart Closed Order Detection Engine (الكشف الذكي عن الطلبات المحجوزة أو المنتهية)
 * 
 * يراقب رسائل مجموعات واتساب التي تصل للتطبيق ويربطها بالطلبات السابقة في Radar:
 * 1. تحديد مجموعة واتساب واسم المرسل ووقت الرسالة.
 * 2. فحص الطلبات النشطة في نفس المجموعة حصراً لمنع حذف أي طلب في مجموعة أخرى.
 * 3. تحليل العبارات واللهجات: «حصلت»، «حصل»، «تم»، «تم الحصول على مندوب»، «حصلت مندوب»، «تم الحجز»، «خلاص حصلت»، «تم التوصيل / الاتفاق».
 * 4. إعطاء الأولوية للربط بالطلب الأقرب زمنياً والصادر عن المعلن نفسه.
 * 5. إذا كانت الرسالة غامضة أو تحتمل أكثر من طلب بدون تحديد هوية المعلن أو المسار، لا تُحذف الطلبات عشوائياً.
 * 6. إزالة الطلب فوراً من Radar النشط وحفظ سجله في قاعدة البيانات ومنع عودته عند التحديث.
 */

export interface ClosureMatchResult {
  isMatch: boolean;
  orderId: string;
  matchedOrder: ParsedOrder;
  verdict: 'confirmed_closed' | 'suspicious_closed';
  reason: string;
  evidence: ClosureEvidence;
}

const STORAGE_KEY_CLOSED_ORDERS = 'orderi_closed_order_ids';
const processedMessageHashes = new Set<string>();

/**
 * تطهير النصوص وإزالة التطويل وتكرار الحروف واللهجات العامية
 * تمممم -> تم | حصللللت -> حصلت | خـلاص -> خلاص
 */
export function cleanDialectText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
    .replace(/[\u0640]/g, '')       // إزالة الكشيدة / التطويل (ـ)
    .replace(/(.)\1{2,}/gu, '$1')    // تقليص الحروف المكررة 3 مرات فأكثر إلى حرف واحد
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

/**
 * فحص ما إذا كانت الرسالة تتضمن كلمات أو رموز تدل على انتهاء الطلب
 */
export function extractClosureKeywords(text: string): {
  matchedWords: string[];
  matchedEmojis: string[];
  hasClosureIntent: boolean;
  matchedGratitudeWords: string[];
} {
  if (!text) return { matchedWords: [], matchedEmojis: [], matchedGratitudeWords: [], hasClosureIntent: false };
  
  const cleaned = cleanDialectText(text);
  const normalized = normalizeArabicText(text);

  const { takenKeywords, completionKeywords, gratitudeKeywords, emojis } = getAggregatedClosureDictionary();
  // Gratitude is tracked separately: «شكراً» alone must never close an order.
  const closureKeywords = [...takenKeywords, ...completionKeywords];

  const matchedWords: string[] = [];
  for (const kw of closureKeywords) {
    const kwClean = cleanDialectText(kw);
    // فحص بالحدود اللفظية لدقة المعنى وعدم التداخل مع كلمات أخرى
    const rxClean = new RegExp(`(?:^|[\\s،,.:!؟-])${kwClean}(?:$|[\\s،,.:!؟-])`, 'i');
    const rxNorm = new RegExp(`(?:^|[\\s،,.:!؟-])${kw}(?:$|[\\s،,.:!؟-])`, 'i');

    if (rxClean.test(cleaned) || rxNorm.test(normalized)) {
      if (!matchedWords.includes(kw)) {
        matchedWords.push(kw);
      }
    }
  }

  const matchedEmojis: string[] = [];
  for (const em of emojis) {
    if (text.includes(em)) {
      matchedEmojis.push(em);
    }
  }

  const matchedGratitudeWords: string[] = [];
  for (const kw of gratitudeKeywords) {
    const kwClean = cleanDialectText(kw);
    if (!kwClean) continue;
    const rx = new RegExp(`(?:^|[\\s،,.:!؟-])${kwClean}(?:$|[\\s،,.:!؟-])`, 'i');
    if (rx.test(cleaned) && !matchedGratitudeWords.includes(kw)) matchedGratitudeWords.push(kw);
  }

  // Emojis are evidence, not proof. The caller must connect them to the advertiser/order.
  const hasClosureIntent = matchedWords.length > 0;
  return { matchedWords, matchedEmojis, matchedGratitudeWords, hasClosureIntent };
}

/**
 * التحقق من تشابه اسم أو هاتف المعلن
 */
function isAdvertiserSenderMatch(
  msgSender: string, 
  msgPhone: string, 
  orderSenderName: string, 
  orderSenderPhone?: string
): boolean {
  if (msgPhone && orderSenderPhone) {
    const cleanMsgPhone = msgPhone.replace(/\D/g, '');
    const cleanOrderPhone = orderSenderPhone.replace(/\D/g, '');
    if (cleanMsgPhone && cleanOrderPhone && (cleanMsgPhone.includes(cleanOrderPhone) || cleanOrderPhone.includes(cleanMsgPhone))) {
      return true;
    }
  }

  if (msgSender && orderSenderName) {
    const s1 = cleanDialectText(msgSender);
    const s2 = cleanDialectText(orderSenderName);
    if (s1 && s2 && (s1 === s2 || s1.includes(s2) || s2.includes(s1))) {
      return true;
    }
  }

  return false;
}

/**
 * فحص الرسالة الواردة ومطابقتها سياقياً مع الطلبات النشطة لإلغاء وحذف الطلب الذي حصل على مندوب
 */
export function checkIncomingMessageForClosure(
  message: {
    text: string;
    senderName?: string;
    senderPhone?: string;
    groupName?: string;
    timestamp?: Date | number;
    rawQuotedText?: string;
    messageId?: string;
  },
  activeOrders: ParsedOrder[]
): ClosureMatchResult | null {
  const rawText = (message.text || '').trim();
  if (!rawText) return null;

  // منع التكرار ومعالجة الإشعارات المكررة
  const msgTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
  const msgGroup = (message.groupName || '').trim();
  const msgSender = (message.senderName || '').trim();
  const msgPhone = (message.senderPhone || '').replace(/\D/g, '');
  const dedupeKey = message.messageId || `${msgGroup}::${msgSender}::${msgTime}::${rawText.slice(0, 30)}`;

  if (processedMessageHashes.has(dedupeKey)) {
    return null;
  }

  // Android may expose a WhatsApp sticker only as «ملصق/Sticker». It must be tied to the advertiser/order.
  const isPureSticker = /^(?:sticker|ملصق|🖼️\s*ملصق|🖼️\s*sticker|صورة)$/i.test(rawText.trim());

  const { matchedWords, matchedEmojis, matchedGratitudeWords, hasClosureIntent } = extractClosureKeywords(rawText);
  const hasEmojiSignal = matchedEmojis.length > 0;
  if (!hasClosureIntent && !hasEmojiSignal && !isPureSticker) return null;
  // A generic emoji attached to a thank-you is not closure evidence.
  const emojiCanSupportClosure = hasEmojiSignal && matchedGratitudeWords.length === 0;

  // 1. فحص الطلبات النشطة التي تنتمي لنفس المجموعة حصراً
  const candidateOrders = activeOrders.filter((order) => {
    if (order.status === 'accepted' || order.status === 'closed_taken') return false;

    // التأكد من تطابق المجموعة
    const inSameGroup = 
      (msgGroup && order.groupName && (order.groupName.includes(msgGroup) || msgGroup.includes(order.groupName))) ||
      (order.crossPostedGroups && order.crossPostedGroups.some((g) => g.includes(msgGroup) || msgGroup.includes(g)));

    if (!inSameGroup && msgGroup) return false;

    // نافذة زمنية واقعية: خلال 3 ساعات من نشر الإعلان
    const orderTime = new Date(order.receivedAt).getTime();
    const diffHours = (msgTime - orderTime) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 3.5;
  });

  if (candidateOrders.length === 0) return null;

  // 2. ترتيب الطلبات المرشحة حسب الأولوية الزمنية وتطابق المعلن
  const sortedCandidates = [...candidateOrders].sort((a, b) => {
    const aSenderMatch = isAdvertiserSenderMatch(msgSender, msgPhone, a.senderName, a.senderPhone) ? 1 : 0;
    const bSenderMatch = isAdvertiserSenderMatch(msgSender, msgPhone, b.senderName, b.senderPhone) ? 1 : 0;
    if (aSenderMatch !== bSenderMatch) return bSenderMatch - aSenderMatch;

    // الأقرب زمنياً لوقت الرسالة
    const diffA = Math.abs(msgTime - new Date(a.receivedAt).getTime());
    const diffB = Math.abs(msgTime - new Date(b.receivedAt).getTime());
    return diffA - diffB;
  });

  // =========================================================================
  // المستوى الأول: اقتباس مباشر أو ذكر صريح لبيانات المسار أو السعر
  // =========================================================================
  for (const order of sortedCandidates) {
    const orderSnippet = order.rawText.substring(0, 35).trim();
    const cleanMsg = cleanDialectText(rawText);
    const fromMention = order.from && cleanMsg.includes(cleanDialectText(order.from));
    const toMention = order.to && cleanMsg.includes(cleanDialectText(order.to));
    const priceMention = order.price && order.price > 0 && cleanMsg.includes(order.price.toString());

    const isQuoted =
      (message.rawQuotedText && (message.rawQuotedText.includes(order.from) || message.rawQuotedText.includes(order.to))) ||
      rawText.includes(`> ${orderSnippet}`) ||
      ((fromMention || toMention || priceMention) && (hasClosureIntent || emojiCanSupportClosure));
    const advertiserMatch = isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone);

    if (isQuoted && (hasClosureIntent || (advertiserMatch && (emojiCanSupportClosure || isPureSticker)))) {
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(order.id);
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: 'confirmed_closed',
        reason: `اقتباس أو ذكر مباشر لبيانات الطلب (${order.from} ← ${order.to}) مع تأكيد اكتماله: «${rawText}»`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || 'عضو بالقروب',
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 99,
          isQuote: true,
          matchedKeywords: [...matchedWords, ...matchedEmojis],
        },
      };
    }
  }

  // =========================================================================
  // المستوى الثاني: مرسل الرسالة هو نفس صاحب الإعلان الصادر عنه الطلب
  // (الأولوية للطلب الأقرب زمنياً الصادر عن المعلن نفسه)
  // =========================================================================
  for (const order of sortedCandidates) {
    const isAdvertiser = isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone);

    if (isAdvertiser && (hasClosureIntent || isPureSticker || (emojiCanSupportClosure && matchedGratitudeWords.length === 0))) {
      // The advertiser's explicit closure text, sticker-only reply, or non-gratitude emoji can be evidence.
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(order.id);
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: 'confirmed_closed',
        reason: `أفاد صاحب الإعلان نفسه (${msgSender || order.senderName}) في القروب بأنه حصل على مندوب: «${rawText}»`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || order.senderName,
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 98,
          isQuote: false,
          matchedKeywords: [...matchedWords, ...matchedEmojis],
        },
      };
    }
  }

  // =========================================================================
  // المستوى الثالث: فحص الحالات الغامضة وعدم الحذف العشوائي
  // =========================================================================
  
  // إذا كان هناك أكثر من طلب نشط لمعلنين مختلفين في نفس المجموعة،
  // والرسالة من شخص آخر لم يحدد مساراً ولا اقتباساً، فلا نحذف عشوائياً!
  if (sortedCandidates.length > 1) {
    return null;
  }

  // إذا كان هناك طلب نشط وحيد فقط في القروب، ووصلت رسالة واضحة جداً
  // مثل «حصلت مندوب» أو «تم الحصول على مندوب» أو «تم الحجز» أو «تم أخذ الطلب»
  // خلال وقت قصير من الإعلان (أقل من 20 دقيقة):
  if (sortedCandidates.length === 1) {
    const singleOrder = sortedCandidates[0];
    const orderAgeSec = (msgTime - new Date(singleOrder.receivedAt).getTime()) / 1000;

    if (orderAgeSec <= 1200) {
      // عبارات قاطعة تدل على أخذ الطلب
      const explicitPhrases = [
        'حصلت', 'حصل', 'حصلت مندوب', 'حصلت على مندوب', 'تم الحصول على مندوب',
        'تم الحجز', 'خلاص حصلت', 'تم اخذ الطلب', 'تم أخذ الطلب', 'انحجز', 'شالوه',
        'اخذوه', 'أخذوه', 'حصلنا مندوب', 'لقيت مندوب'
      ];
      const hasExplicit = matchedWords.some((w) => explicitPhrases.includes(w));

      if (hasExplicit) {
        processedMessageHashes.add(dedupeKey);
        markOrderPermanentlyClosed(singleOrder.id);
        return {
          isMatch: true,
          orderId: singleOrder.id,
          matchedOrder: singleOrder,
          verdict: 'confirmed_closed',
          reason: `تأكيد صريح بالحصول على مندوب في القروب («${rawText}») على الطلب النشط الوحيد (${singleOrder.from} ← ${singleOrder.to}).`,
          evidence: {
            replyText: rawText,
            senderName: msgSender || 'عضو بالقروب',
            groupName: msgGroup || singleOrder.groupName,
            timestamp: new Date(msgTime).toISOString(),
            confidence: 92,
            isQuote: false,
            matchedKeywords: [...matchedWords, ...matchedEmojis],
          },
        };
      }
    }
  }

  return null;
}

/**
 * حفظ معرّف الطلب المغلق بشكل دائم في التخزين المحلي لمنع ظهوره ثانيةً
 */
export function markOrderPermanentlyClosed(orderId: string): void {
  if (!orderId || typeof window === 'undefined') return;
  try {
    const existing = getPermanentlyClosedOrderIds();
    if (!existing.includes(orderId)) {
      existing.push(orderId);
      localStorage.setItem(STORAGE_KEY_CLOSED_ORDERS, JSON.stringify(existing.slice(-300)));
    }
  } catch {}
}

/**
 * استرجاع قائمة معرّفات الطلبات المغلقة نهائياً
 */
export function getPermanentlyClosedOrderIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLOSED_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * التحقق ما إذا كان الطلب مسجلاً كطلب مغلق مسبقاً
 */
export function isOrderPermanentlyClosed(orderId: string): boolean {
  if (!orderId) return false;
  const list = getPermanentlyClosedOrderIds();
  return list.includes(orderId);
}
