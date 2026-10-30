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
} {
  if (!text) return { matchedWords: [], matchedEmojis: [], hasClosureIntent: false };
  
  const cleaned = cleanDialectText(text);
  const normalized = normalizeArabicText(text);

  const { takenKeywords, completionKeywords, gratitudeKeywords, emojis } = getAggregatedClosureDictionary();
  const allKeywords = [...takenKeywords, ...completionKeywords, ...gratitudeKeywords];

  const matchedWords: string[] = [];
  for (const kw of allKeywords) {
    const kwClean = cleanDialectText(kw);
    // فحص بالحدود اللفظية لدقة المعنى وعدم التداخل مع كلمات أخرى
    const rxClean = new RegExp(`(?:^|[\\s،,.:!؟-])${kwClean}(?:$|[\\s،,.:!؟-])`, 'i');
    const rxNorm = new RegExp(`(?:^|[\\s،,.:!؟-])${kw}(?:$|[\\s،,.:!؟-])`, 'i');

    if (rxClean.test(cleaned) || rxNorm.test(normalized)) {
      // التحقق من أن الكلمة لم تُستخدم في سياق عادي غير مقصود به الإغلاق
      if (!isFalsePositiveClosureUsage(text, kw)) {
        if (!matchedWords.includes(kw)) {
          matchedWords.push(kw);
        }
      }
    }
  }

  const matchedEmojis: string[] = [];
  for (const em of emojis) {
    if (text.includes(em)) {
      matchedEmojis.push(em);
    }
  }

  const hasClosureIntent = matchedWords.length > 0 || matchedEmojis.length > 0;
  return { matchedWords, matchedEmojis, hasClosureIntent };
}

/**
 * التمييز الدقيق بين ذكر الكلمة في سياق عادي وبين استخدامها فعلًا لإغلاق الطلب
 * أمثلة مستبعدة: تمور سكري، سيتم التوصيل، تم تحديد السعر، هل تم مندوب؟
 */
export function isFalsePositiveClosureUsage(rawText: string, matchedKeyword?: string): boolean {
  if (!rawText) return true;
  const lower = rawText.toLowerCase();
  const cleaned = cleanDialectText(rawText);
  const kwClean = matchedKeyword ? cleanDialectText(matchedKeyword) : 'تم';

  // 0. فحص عام لأي كلمة من مشتقات التمور أو زمن المستقبل أو الاستفسار
  if (/(?:تمور|تمر|التمر|التمور|تمرية)/i.test(rawText)) {
    return true;
  }
  if (/(?:سيتم|سوف\s*يتم)/i.test(rawText)) {
    return true;
  }
  if (/(?:هل|أهل|مين|منو)\s*(?:تم|حصل|حصلت|انحجز)/i.test(rawText) || (/\?|؟/.test(rawText) && /(?:تم|حصلت|انحجز|taken|booked)/i.test(rawText))) {
    return true;
  }

  // 1. فحص كلمة "تم" / "تمت"
  if (!matchedKeyword || kwClean === 'تم' || kwClean === 'تمت' || kwClean === '') {
    // جمل من قبيل: "تم تحديد السعر"، "تم الدفع"، "تم تحويل"، "تم تجهيز" في صلب نص الإعلان
    if (/(?:تم|تمت)\s*(?:تحديد|تثبيت|دفع|تحويل|تجهيز|ارسال\s*الموقع|إرسال\s*الموقع|الاتفاق\s*مع\s*المحل|الاتفاق\s*مع\s*المطعم)/i.test(rawText) && !/^(?:تم|خلاص\s*تم|تم\s*خلاص)$/i.test(cleaned)) {
      return true;
    }
    // وصف المسار في صلب الإعلان: "تم الاستلام من ... والتسليم في ..."
    if (/(?:تم|يتم)\s*(?:الاستلام|استلام)\s*من/i.test(rawText) && /(?:التسليم|تسليم)\s*(?:في|الى|إلى)/i.test(rawText)) {
      return true;
    }
    // الجمل الشرطية: "إذا تم / لو تم"
    if (/(?:اذا|إذا|لو|في\s*حال|بحال)\s*(?:تم|حصلت|لقيت|انحجز)/i.test(rawText)) {
      return true;
    }
  }

  // 2. فحص كلمات "Taken / Booked" في سياقات إنجليزية عامة أو أسئلة
  if (['taken', 'booked', 'done', 'completed'].includes(kwClean)) {
    if (/\?|is\s+it\s+(?:taken|booked)/i.test(lower)) {
      return true;
    }
  }

  return false;
}

export interface StickerAnalysisResult {
  isSticker: boolean;
  isRecognized: boolean;
  hasVisualContent: boolean;
  isClosure: boolean;
  isAmbiguous: boolean;
  confidence: number;
  label?: string;
  diagnosticReason: string;
}

/**
 * تحليل ملصقات واتساب والاستيكرات مع التحقق البصري والنصي
 * عدم افتراض أن كل ملصق يعني إغلاق؛ إذا كان الملصق غير متاح للتحليل، يُسجل كحالة غير مؤكدة للتشخيص
 */
export function analyzeStickerSignal(
  rawText: string,
  stickerData?: { caption?: string; emoji?: string; visualLabel?: string; hasVisualData?: boolean }
): StickerAnalysisResult {
  const cleaned = cleanDialectText(rawText);
  const isStickerTag = 
    /^(?:sticker|ملصق|استيكر|ستيكر|صورهملصق|صورةملصق|🖼️sticker|📷ملصق|🖼️ملصق)$/i.test(cleaned) ||
    /\[(?:ملصق|استيكر|ستيكر|sticker)\]/i.test(rawText) ||
    Boolean(stickerData?.hasVisualData || stickerData?.caption || stickerData?.visualLabel);

  if (!isStickerTag) {
    return {
      isSticker: false,
      isRecognized: false,
      hasVisualContent: false,
      isClosure: false,
      isAmbiguous: false,
      confidence: 0,
      diagnosticReason: 'الرسالة ليست ملصقاً',
    };
  }

  const caption = (stickerData?.caption || stickerData?.visualLabel || '').trim();
  const emoji = (stickerData?.emoji || '').trim();

  // 1. ملصق يحتوي على علامة إنجاز أو شكر صريحة تم التعرف عليها
  if (caption || emoji) {
    const combined = `${caption} ${emoji}`.trim();
    const closureCheck = extractClosureKeywords(combined);

    if (closureCheck.hasClosureIntent || /^(?:تم|حصلت|مشكور|يعطيكم\s*العافية|مكتمل|done|ok|👍|✅|✔️|🤝)$/i.test(cleanDialectText(combined))) {
      return {
        isSticker: true,
        isRecognized: true,
        hasVisualContent: true,
        isClosure: true,
        isAmbiguous: false,
        confidence: 95,
        label: combined,
        diagnosticReason: `تم التعرف بصرياً ونَصياً على محتوى الملصق: "${combined}" (يدل على الحجز والإغلاق)`,
      };
    }

    // محتوى ملصق تم التعرف عليه ولا يدل على إغلاق
    return {
      isSticker: true,
      isRecognized: true,
      hasVisualContent: true,
      isClosure: false,
      isAmbiguous: false,
      confidence: 90,
      label: combined,
      diagnosticReason: `تم التعرف على الملصق: "${combined}" (لا يدل على إغلاق الطلب)`,
    };
  }

  // 2. نصوص مقتبسة مع الملصقات تفيد الإغلاق
  if (/ملصق\s*(?:تم|حصلت|شكرا|مشكور|يعطيك)/i.test(rawText)) {
    return {
      isSticker: true,
      isRecognized: true,
      hasVisualContent: false,
      isClosure: true,
      isAmbiguous: false,
      confidence: 90,
      label: rawText.trim(),
      diagnosticReason: `ملصق مصحوب بنص إغلاق مقتبس: "${rawText.trim()}"`,
    };
  }

  // 3. ملصق غامض بدون محتوى متاح (حالة غير مؤكدة تُسجل للتشخيص)
  return {
    isSticker: true,
    isRecognized: false,
    hasVisualContent: false,
    isClosure: false,
    isAmbiguous: true,
    confidence: 50,
    diagnosticReason: 'الملصق لا يتضمن محتوى بصري أو نصي متاح للتحليل - تم تسجيله كحالة غير مؤكدة للتشخيص',
  };
}

/**
 * تطهير نصوص أسماء المرسلين للمقارنة الذكية
 */
function cleanSenderText(text: string): string {
  if (!text) return '';
  return cleanDialectText(text)
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // إزالة الإيموجيات
    .replace(/[^\p{L}\p{N}\s]/gu, '') // إزالة الرموز
    .trim();
}

/**
 * التحقق من تشابه اسم أو هاتف المعلن بدقة عالية
 * يدعم هواتف البحرين والخليج (آخر 8 أرقام) والأسماء المقتطعة بدون إيموجيات
 */
export function isAdvertiserSenderMatch(
  msgSender: string, 
  msgPhone: string, 
  orderSenderName: string, 
  orderSenderPhone?: string
): boolean {
  // 1. مطابقة أرقام الهواتف (آخر 8 أرقام لهواتف البحرين والخليج لتجاوز مفاتيح الدول +973 و 00973 والفواصل)
  const p1 = (msgPhone || msgSender || '').replace(/\D/g, '');
  const p2 = (orderSenderPhone || orderSenderName || '').replace(/\D/g, '');

  if (p1.length >= 8 && p2.length >= 8) {
    if (p1.slice(-8) === p2.slice(-8)) {
      return true;
    }
  }

  // 2. مطابقة الأسماء المعيارية بعد إزالة الإيموجيات وعلامات الواتساب
  if (msgSender && orderSenderName) {
    const s1 = cleanSenderText(msgSender);
    const s2 = cleanSenderText(orderSenderName);
    if (s1 && s2) {
      if (s1 === s2) return true;
      if (s1.length >= 3 && s2.includes(s1)) return true;
      if (s2.length >= 3 && s1.includes(s2)) return true;
    }
  }

  return false;
}

/**
 * فحص الرسالة الواردة ومطابقتها سياقياً مع الطلبات النشطة لإلغاء وحذف الطلب الذي حصل على مندوب
 * يدعم حالة وجود معلنين متعددين في نفس القروب:
 * (معلن 1، معلن 2، معلن 3 ➔ إذا كتب معلن 1 تم أو أرسل ملصق/استيكر بريبلي أو بدون ريبلي ➔ يُحذف طلب معلن 1 فقط)
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
    isGroup?: boolean;
    isDirectPrivate?: boolean;
    isGroup?: boolean;
  },
  activeOrders: ParsedOrder[]
): ClosureMatchResult | null {
  const rawText = (message.text || '').trim();
  if (!rawText) return null;

  // STRICT PRIVACY & SOURCE RULE:
  // A message from a 1-on-1 private chat can NEVER close or update an order in Radar!
  // A friend saying "تم" or sending a sticker in a private chat must never touch delivery group orders.
  const msgGroup = (message.groupName || '').trim();
  if (
    message.isDirectPrivate === true ||
    message.isGroup !== true ||
    !msgGroup ||
    msgGroup === 'محادثة خاصة 👤' ||
    msgGroup.includes('خاصة') ||
    msgGroup === 'واتساب'
  ) {
    return null;
  }

  // منع التكرار ومعالجة الإشعارات المكررة
  const msgTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
  const msgSender = (message.senderName || '').trim();
  const msgPhone = (message.senderPhone || '').replace(/\D/g, '');
  const dedupeKey = message.messageId || `${msgGroup}::${msgSender}::${msgTime}::${rawText.slice(0, 30)}`;

  if (processedMessageHashes.has(dedupeKey)) {
    return null;
  }

  // رصد الملصقات والاستيكرات والرموز التعبيرية والكلمات التأكيدية
  const cleanedSignal = cleanDialectText(rawText).replace(/[\s.,،.!؟?؛:؛\u200e\u200f]+/g, '').trim();
  const isPureSticker = 
    /^(?:sticker|ملصق|استيكر|ستيكر|صورهملصق|صورةملصق|🖼️sticker|📷ملصق|🖼️ملصق|ملصقمتحرك|animatedsticker)$/i.test(cleanedSignal) ||
    /ملصق|استيكر|ستيكر|sticker/i.test(cleanedSignal);

  const isMinimalCompletionSignal =
    isPureSticker ||
    /^(?:تم|تمت|حصلت|حصل|حصلنا|لقيت|لقينا|خلاص|خلص|انحجز|انحجزت|اخذت|اخذته|اخذوه|أخذوه|شالوه|انشال|مشكور|مشكورين|يعطيكالعافيه|يعطيكمالعافيه|تسلم|تسلمون|قواكمالله|👍+|👌+|🙏+|✅+|✔️+|🤝+|👏+|🎯+|💐+|🌷+|🤍+|✨+|📦+|🛵+|🚗+|🔒+|💯+|🎉+)$/iu.test(cleanedSignal);

  const { matchedWords, matchedEmojis, hasClosureIntent } = extractClosureKeywords(rawText);
  if (!hasClosureIntent && !isMinimalCompletionSignal) return null;
  if (isMinimalCompletionSignal && matchedWords.length === 0 && matchedEmojis.length === 0) {
    matchedEmojis.push(isPureSticker ? 'ملصق/Sticker 🖼️' : rawText.trim());
  }

  // 1. فحص الطلبات النشطة التي تنتمي لنفس المجموعة حصراً
  const candidateOrders = activeOrders.filter((order) => {
    if (order.status === 'accepted' || order.status === 'closed_taken') return false;

    // التأكد من تطابق المجموعة
    const inSameGroup = 
      (msgGroup && order.groupName && (order.groupName.includes(msgGroup) || msgGroup.includes(order.groupName))) ||
      (order.crossPostedGroups && order.crossPostedGroups.some((g) => g.includes(msgGroup) || msgGroup.includes(g)));

    if (!msgGroup || !inSameGroup) return false;

    // نافذة زمنية واقعية: خلال 3.5 ساعات من نشر الإعلان
    const orderTime = new Date(order.receivedAt).getTime();
    const diffHours = (msgTime - orderTime) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 3.5;
  });

  if (candidateOrders.length === 0) return null;

  // =========================================================================
  // المسار الأول: ريبلي / رد صريح على الطلب (Quoted Reply)
  // المعلن عمل ريبلي على رسالة طلبه وكتب تم/حصلت أو أرسل ملصق/استيكر
  // =========================================================================
  for (const order of candidateOrders) {
    const orderSnippet = order.rawText.substring(0, 35).trim();
    const cleanMsg = cleanDialectText(rawText);
    const fromMention = order.from && cleanMsg.includes(cleanDialectText(order.from));
    const toMention = order.to && cleanMsg.includes(cleanDialectText(order.to));
    const priceMention = order.price && order.price > 0 && cleanMsg.includes(order.price.toString());

    const rawQuoteClean = message.rawQuotedText ? cleanDialectText(message.rawQuotedText) : '';
    const rawOrderClean = cleanDialectText(order.rawText);
    const quoteMatchesOrder = Boolean(
      rawQuoteClean && (
        (rawQuoteClean.length >= 8 && rawOrderClean.includes(rawQuoteClean.slice(0, 25))) ||
        (rawOrderClean.length >= 8 && rawQuoteClean.includes(rawOrderClean.slice(0, 25))) ||
        (order.from && rawQuoteClean.includes(cleanDialectText(order.from))) ||
        (order.to && rawQuoteClean.includes(cleanDialectText(order.to))) ||
        (order.senderPhone && rawQuoteClean.includes(order.senderPhone.replace(/\D/g, '').slice(-8)))
      )
    );

    const isQuoted = 
      quoteMatchesOrder ||
      rawText.includes(`> ${orderSnippet}`) ||
      rawText.includes(orderSnippet) ||
      ((fromMention && toMention) || (fromMention && priceMention) || (toMention && priceMention));

    const isSenderMatch = isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone);

    // إذا وُجد اقتباس للطلب، أو إذا كان ريبلي من صاحب الطلب نفسه
    if (isQuoted && isSenderMatch) {
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(order.id);
      return {
        isMatch: true,
        orderId: order.id,
        matchedOrder: order,
        verdict: 'confirmed_closed',
        reason: `رد ريبلي من المعلن (${msgSender || order.senderName}) على طلبه بالقروب (${order.from} ← ${order.to}) مع تأكيد: «${rawText}»`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || order.senderName,
          groupName: msgGroup || order.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 99,
          isQuote: true,
          matchedKeywords: [...matchedWords, ...matchedEmojis, 'ريبلي على الطلب'],
        },
      };
    }
  }

  // =========================================================================
  // المسار الثاني: بدون ريبلي - مطابقة معلن الطلب حصراً (Sender Match)
  // عندما يعلن معلن 1 ومعلن 2 ومعلن 3 في نفس القروب:
  // يكتب معلن 1 (أو يرسل استيكر/ملصق) "تم" أو "حصلت" ➔ يُحذف طلب معلن 1 فقط!
  // ويبقى طلب معلن 2 ومعلن 3 نشطين بالرادار دون أي تأثير!
  // =========================================================================
  const matchingAdvertiserOrders = candidateOrders.filter((order) =>
    isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone)
  );

  if (matchingAdvertiserOrders.length > 0) {
    // الأقرب زمنياً لوقت هذه الرسالة من إعلانات هذا المعلن حصراً
    matchingAdvertiserOrders.sort((a, b) => {
      const diffA = Math.abs(msgTime - new Date(a.receivedAt).getTime());
      const diffB = Math.abs(msgTime - new Date(b.receivedAt).getTime());
      return diffA - diffB;
    });

    const targetOrder = matchingAdvertiserOrders[0];
    processedMessageHashes.add(dedupeKey);
    markOrderPermanentlyClosed(targetOrder.id);

    const signalType = isPureSticker 
      ? 'ملصق / استيكر 🖼️' 
      : (matchedEmojis.length > 0 ? `رمز ${matchedEmojis.join(' ')}` : `عبارة «${rawText}»`);

    return {
      isMatch: true,
      orderId: targetOrder.id,
      matchedOrder: targetOrder,
      verdict: 'confirmed_closed',
      reason: `أرسل معلن الطلب نفسه (${msgSender || targetOrder.senderName}) في القروب ${signalType} دلالة على حصوله على مندوب لإعلانه السابق (${targetOrder.from} ← ${targetOrder.to})`,
      evidence: {
        replyText: rawText,
        senderName: msgSender || targetOrder.senderName,
        groupName: msgGroup || targetOrder.groupName,
        timestamp: new Date(msgTime).toISOString(),
        confidence: 99,
        isQuote: false,
        matchedKeywords: [...matchedWords, ...matchedEmojis],
      },
    };
  }

  // =========================================================================
  // المسار الثالث: عبارة صريحة لا تحتمل اللبس («حصلت مندوب»، «خلاص حصلت»)
  // في حال كان في القروب طلب نشط وحيد فقط
  // =========================================================================
  const explicitCourierFoundRegex = /(?:حصلت|لقيت|توفر|تنسق)\s*(?:خلاص\s*)?مندوب|خلاص\s*حصلت|تم\s*توفير\s*مندوب|شالوه\s*خلاص|انحجز\s*خلاص|تم\s*(?:اخذ|أخذ)\s*الطلب|حصلت\s*على\s*مندوب|خلاص\s*توفر\s*مندوب|لقينا\s*مندوب|توفر\s*مندوب\s*خلاص/i;
  const hasExplicitCourierFound = explicitCourierFoundRegex.test(cleanedSignal) || explicitCourierFoundRegex.test(cleanDialectText(rawText));

  if (hasExplicitCourierFound) {
    // إذا كان هناك طلب وحيد نشط في القروب
    if (candidateOrders.length === 1 && isAdvertiserSenderMatch(msgSender, msgPhone, candidateOrders[0].senderName, candidateOrders[0].senderPhone)) {
      const targetOrder = candidateOrders[0];
      processedMessageHashes.add(dedupeKey);
      markOrderPermanentlyClosed(targetOrder.id);
      return {
        isMatch: true,
        orderId: targetOrder.id,
        matchedOrder: targetOrder,
        verdict: 'confirmed_closed',
        reason: `رصد بالذكاء الاصطناعي: تأكيد صريح بالحصول على مندوب في قروب (${msgGroup || targetOrder.groupName}): «${rawText}» لإعلان (${targetOrder.from} ← ${targetOrder.to})`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || targetOrder.senderName,
          groupName: msgGroup || targetOrder.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: 95,
          isQuote: false,
          matchedKeywords: [...matchedWords, ...matchedEmojis, 'حصلت مندوب'],
        },
      };
    }
  }

  return null;
}

/**
 * فحص الرسالة الواردة بالذكاء الاصطناعي الهجين (المحلي + السحابي)
 * في حال استخدم المعلن تعابير جديدة أو غامضة لا توجد بالقائمة الأساسية
 */
export async function checkIncomingMessageForClosureWithAI(
  message: {
    text: string;
    senderName?: string;
    senderPhone?: string;
    groupName?: string;
    timestamp?: Date | number;
    rawQuotedText?: string;
    messageId?: string;
    isGroup?: boolean;
    isDirectPrivate?: boolean;
  },
  activeOrders: ParsedOrder[]
): Promise<ClosureMatchResult | null> {
  // 1. فحص فوري وسريع بالمطابقة المحلية
  const fastResult = checkIncomingMessageForClosure(message, activeOrders);
  if (fastResult) return fastResult;

  const rawText = (message.text || '').trim();
  if (!rawText || message.isGroup !== true || message.isDirectPrivate === true) return null;

  const msgGroup = (message.groupName || '').trim();
  const msgSender = (message.senderName || '').trim();
  const msgPhone = (message.senderPhone || '').replace(/\D/g, '');
  const msgTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();

  // فحص الطلبات التي تعود لنفس المعلن ونفس القروب
  const advertiserOrders = activeOrders.filter((order) => {
    if (order.status === 'accepted' || order.status === 'closed_taken') return false;
    const inSameGroup = 
      (msgGroup && order.groupName && (order.groupName.includes(msgGroup) || msgGroup.includes(order.groupName))) ||
      (order.crossPostedGroups && order.crossPostedGroups.some((g) => g.includes(msgGroup) || msgGroup.includes(g)));
    if (!msgGroup || !inSameGroup) return false;
    return isAdvertiserSenderMatch(msgSender, msgPhone, order.senderName, order.senderPhone);
  });

  // AI must never guess which advertiser owns a closure. Without an exact
  // sender match, leave every active order untouched.
  if (advertiserOrders.length === 0) return null;
  const targetCandidates = advertiserOrders;

  // استدعاء الذكاء الاصطناعي لفهم التعبير العامي الجديد
  try {
    const { analyzeAndLearnClosureWithAI } = await import('./aiClosureLearner');
    const orderCandidate = targetCandidates[0];
    const aiAnalysis = await analyzeAndLearnClosureWithAI(rawText, {
      orderSnippet: `${orderCandidate.from} إلى ${orderCandidate.to}`,
      senderName: msgSender || orderCandidate.senderName,
      groupName: msgGroup || orderCandidate.groupName,
    });

    if (aiAnalysis.isClosureIntent && (aiAnalysis.verdict === 'taken' || aiAnalysis.verdict === 'completion' || aiAnalysis.verdict === 'emoji')) {
      markOrderPermanentlyClosed(orderCandidate.id);
      return {
        isMatch: true,
        orderId: orderCandidate.id,
        matchedOrder: orderCandidate,
        verdict: 'confirmed_closed',
        reason: `رصد بالذكاء الاصطناعي: أكد معلن الطلب الأصلي (${msgSender || orderCandidate.senderName}) حصوله على مندوب («${rawText}»): ${aiAnalysis.explanation || ''}`,
        evidence: {
          replyText: rawText,
          senderName: msgSender || orderCandidate.senderName,
          groupName: msgGroup || orderCandidate.groupName,
          timestamp: new Date(msgTime).toISOString(),
          confidence: aiAnalysis.confidence || 95,
          isQuote: false,
          matchedKeywords: [aiAnalysis.extractedPhrase || rawText],
        },
      };
    }
  } catch (err) {
    console.warn('[AI Closure Analyzer] Evaluation error:', err);
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
