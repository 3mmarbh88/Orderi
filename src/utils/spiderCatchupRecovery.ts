import { ParsedOrder, ClosureEvidence } from '../types';
import { 
  cleanDialectText, 
  extractClosureKeywords, 
  isFalsePositiveClosureUsage, 
  analyzeStickerSignal, 
  isAdvertiserSenderMatch,
  isOrderPermanentlyClosed,
  markOrderPermanentlyClosed
} from './orderClosureDetector';
import { parseWhatsAppOrderWithLocalAi } from './localAiOrderParser';
import { detectPassengerDelivery } from './passengerClassifier';
import { detectAdvertisementMessage } from './advertisementClassifier';

export interface CatchupCandidateMessage {
  id: string;
  rawText: string;
  groupName: string;
  senderName: string;
  senderPhone?: string;
  from?: string;
  to?: string;
  timestamp: Date | number | string;
  rawQuotedText?: string;
  quotedMessageId?: string;
  mediaType?: 'text' | 'image' | 'sticker' | 'audio';
  stickerData?: {
    caption?: string;
    emoji?: string;
    visualLabel?: string;
    hasVisualData?: boolean;
  };
  isGroup?: boolean;
  isDirectPrivate?: boolean;
  chatId?: string;
}

export type CatchupDecisionStatus = 
  | 'eligible_available'      // متاح مؤكد - يستعاد للرادار
  | 'excluded_closed'        // مستبعد: ثبت أنه حُجز أو أُخذ أو أُغلق
  | 'flagged_ambiguous'      // حالة غير محسومة / اشتباه حجز - لا يضاف كمتاح مؤكد
  | 'excluded_duplicate'     // مستبعد: مكرر أو موجود مسبقاً في الرادار أو السجلات
  | 'ignored_non_order';     // مستبعد: ليس إعلان طلب توصيل (محادثة عامة / إعلان تجاري)

export interface CatchupEvaluationResult {
  messageId: string;
  status: CatchupDecisionStatus;
  reason: string;
  evidence?: ClosureEvidence;
  parsedOrder?: ParsedOrder;
  diagnosticLog: string;
  timestamp: number;
}

export interface CatchupRecoveryReport {
  totalScanned: number;
  eligibleAvailableCount: number;
  excludedClosedCount: number;
  flaggedAmbiguousCount: number;
  duplicatesSkippedCount: number;
  nonOrdersCount: number;
  recoveredOrders: ParsedOrder[];
  excludedClosed: Array<{ messageId: string; reason: string; evidence?: ClosureEvidence }>;
  ambiguousOrders: Array<{ messageId: string; reason: string; order?: ParsedOrder }>;
  diagnosticLogs: string[];
}

/**
 * فحص ما إذا كان نص الإعلان نفسه يحتوي على إشارة إغلاق مسبقة أو حجز صريح
 * مثال: إعلان تم تعديله لاحقاً بإضافة (تم التوصيل) أو (محجوز) أو مشطوب
 */
export function checkSelfClosedInAdText(rawText: string): { isClosed: boolean; reason?: string } {
  if (!rawText) return { isClosed: false };

  const cleaned = cleanDialectText(rawText);

  // 1. عبارات صريحة تفيد انتهاء الطلب داخل الإعلان
  if (/(?:الطلب\s*محجوز|تم\s*الحجز|انحجز\s*خلاص|تم\s*اخذ\s*الطلب|أخذوه\s*خلاص|حصلت\s*مندوب\s*خلاص|تم\s*التوصيل\s*خلاص|الطلب\s*منتهي|تم\s*الغاء\s*الطلب|تكنسل\s*الطلب|كنسلناه)/i.test(rawText)) {
    return { isClosed: true, reason: 'الإعلان يتضمن في نصه عبارة إغلاق صريحة (محجوز / تم الحجز / تكنسل)' };
  }

  // 2. فحص إشارات بالإنجليزية
  if (/\b(?:taken|booked|already\s*assigned|completed|cancelled|closed)\b/i.test(rawText)) {
    if (!/\?/i.test(rawText)) {
      return { isClosed: true, reason: 'النص يتضمن علامة إغلاق بالإنجليزية (Taken / Booked / Completed)' };
    }
  }

  // 3. شطب النص أو رموز القفل التام
  if (/~[^~]{5,}~/.test(rawText) && (rawText.includes('🔒') || rawText.includes('⛔') || rawText.includes('❌'))) {
    return { isClosed: true, reason: 'النص مشطوب ومصحوب برمز إغلاق' };
  }

  return { isClosed: false };
}

/**
 * فحص سياق المحادثة والرسائل اللاحقة في القروب نفسه للتأكد هل تم أخذ أو إغلاق الطلب بعد نشره
 */
export function evaluateSubsequentThreadClosure(
  orderMsg: CatchupCandidateMessage,
  allGroupMessages: CatchupCandidateMessage[]
): {
  isClosed: boolean;
  isAmbiguous: boolean;
  reason: string;
  evidence?: ClosureEvidence;
  diagnostic: string;
} {
  const orderTime = new Date(orderMsg.timestamp).getTime();
  const orderSenderName = (orderMsg.senderName || '').trim();
  const orderSenderPhone = (orderMsg.senderPhone || '').replace(/\D/g, '');

  // جلب كافة الرسائل التي وردت بعد رسالة الطلب في نفس القروب خلال نافذة 4 ساعات
  const subsequentMessages = allGroupMessages.filter((msg) => {
    if (msg.id === orderMsg.id) return false;
    if (msg.groupName !== orderMsg.groupName) return false;
    const t = new Date(msg.timestamp).getTime();
    const diffHours = (t - orderTime) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 4.0;
  });

  // فرز تصاعدي حسب وقت الورود
  subsequentMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let ambiguousSign: { reason: string; diagnostic: string } | null = null;

  for (const followUp of subsequentMessages) {
    const followUpTime = new Date(followUp.timestamp).getTime();
    const rawText = (followUp.rawText || '').trim();
    const sender = (followUp.senderName || '').trim();
    const phone = (followUp.senderPhone || '').replace(/\D/g, '');
    const isSameAdvertiser = isAdvertiserSenderMatch(sender, phone, orderSenderName, orderSenderPhone);

    // 1. فحص الاقتباس المباشر (Quoted Reply)
    const quoteMatches = Boolean(
      (followUp.quotedMessageId && followUp.quotedMessageId === orderMsg.id) ||
      (followUp.rawQuotedText && (
        (followUp.rawQuotedText.length >= 8 && orderMsg.rawText.includes(followUp.rawQuotedText.slice(0, 25))) ||
        (orderMsg.rawText.length >= 8 && followUp.rawQuotedText.includes(orderMsg.rawText.slice(0, 25)))
      ))
    );

    // 2. تحليل الملصقات والاستيكرات
    const stickerResult = analyzeStickerSignal(rawText, followUp.stickerData);
    if (stickerResult.isSticker) {
      if (stickerResult.isClosure && (quoteMatches || isSameAdvertiser)) {
        return {
          isClosed: true,
          isAmbiguous: false,
          reason: `أرسل المعلن أو ورد ريبلي ملصق معتمد يثبت الحجز: ${stickerResult.label || 'ملصق إغلاق'}`,
          evidence: {
            replyText: stickerResult.label || 'ملصق واتساب 🖼️',
            senderName: sender || orderSenderName,
            groupName: orderMsg.groupName,
            timestamp: new Date(followUpTime).toISOString(),
            confidence: stickerResult.confidence,
            isQuote: quoteMatches,
            matchedKeywords: ['ملصق_إغلاق', stickerResult.label || 'sticker'],
          },
          diagnostic: `الملصق تم التحقق منه محلياً كدليل إغلاق: ${stickerResult.diagnosticReason}`,
        };
      }

      // إذا كان الملصق غير متاح للتحليل البصري وموجه للطلب بريبلي أو من معلن الطلب نفسه
      if (stickerResult.isAmbiguous && (quoteMatches || isSameAdvertiser)) {
        ambiguousSign = {
          reason: `ورد ملصق غير مؤكد المحتوى من ${isSameAdvertiser ? 'معلن الطلب' : 'ريبلي'}`,
          diagnostic: stickerResult.diagnosticReason,
        };
      }
    }

    // 3. تحليل الكلمات والإيموجيات الدالة على الإغلاق
    const closureKeywords = extractClosureKeywords(rawText);
    const cleanedText = cleanDialectText(rawText);

    // فحص الإشارات الصريحة الموجزة: "تم"، "حصلت"، "خلاص"، "انحجز"، "شالوه"، "أخذوه"، "مع المندوب"، "👍", "✅", "🤝"
    const isDirectClosureExpression =
      /^(?:تم|تمت|حصلت|حصل|حصلنا|لقيت|خلاص|خلص|انحجز|حجزوه|شالوه|اخذوه|أخذوه|مع\s*المندوب|عند\s*المندوب|مشكور|مشكورين|تسلم|تسلمون|يعطيك\s*العافيه|يعطيكم\s*العافيه|قواكم\s*الله|done|taken|booked|assigned|handled|ok|👍+|✅+|✔️+|🤝+|👌+|🔒+)$/i.test(cleanedText);

    const isExplicitClosurePhrase =
      /(?:حصلت|لقيت|توفر|تنسق)\s*(?:خلاص\s*)?مندوب|خلاص\s*حصلت|مع\s*المندوب\s*خلاص|الطلب\s*مع\s*المندوب|شالوه\s*خلاص|انحجز\s*خلاص|تم\s*(?:اخذ|أخذ)\s*الطلب|حصلت\s*على\s*مندوب|driver\s*assigned|got\s*a\s*driver/i.test(rawText);

    // أ) ريبلي مباشر مقتبس للطلب يفيد الإغلاق
    if (quoteMatches) {
      if (closureKeywords.hasClosureIntent || isDirectClosureExpression || isExplicitClosurePhrase) {
        return {
          isClosed: true,
          isAmbiguous: false,
          reason: `رد ريبلي مباشر على الطلب بالقروب من (${sender || 'عضو'}) يفيد الحجز: «${rawText}»`,
          evidence: {
            replyText: rawText,
            senderName: sender || orderSenderName,
            groupName: orderMsg.groupName,
            timestamp: new Date(followUpTime).toISOString(),
            confidence: 99,
            isQuote: true,
            matchedKeywords: [...closureKeywords.matchedWords, ...closureKeywords.matchedEmojis],
          },
          diagnostic: `تم رصد ريبلي مباشر باقتباس نص الإعلان السابق مع عبارة إغلاق مؤكدة: ${rawText}`,
        };
      }
    }

    // ب) رسالة لاحقة من نفس المعلن صاحب الطلب تفيد حصوله على مندوب
    if (isSameAdvertiser) {
      if (closureKeywords.hasClosureIntent || isDirectClosureExpression || isExplicitClosurePhrase) {
        return {
          isClosed: true,
          isAmbiguous: false,
          reason: `أرسل معلن الطلب نفسه (${sender || orderSenderName}) رسالة لاحقة بالقروب تفيد إنجاز الطلب: «${rawText}»`,
          evidence: {
            replyText: rawText,
            senderName: sender || orderSenderName,
            groupName: orderMsg.groupName,
            timestamp: new Date(followUpTime).toISOString(),
            confidence: 99,
            isQuote: false,
            matchedKeywords: [...closureKeywords.matchedWords, ...closureKeywords.matchedEmojis],
          },
          diagnostic: `معلن الطلب أصدر تأكيد إغلاق بالقروب بعد نشر إعلانه: «${rawText}»`,
        };
      }
    }

    // ج) عبارة صريحة جداً لا تحتمل اللبس ومربوطة بالطلب حصراً (اقتباس أو نفس المعلن أو تذكر تفاصيل الإعلان)
    // منع حذف طلب قائم لمعلن لمجرد ظهور كلمة عامة لمعلن آخر في القروب
    const mentionsOrderDetails = Boolean(
      (orderMsg.from && orderMsg.from.length >= 3 && rawText.includes(orderMsg.from)) ||
      (orderMsg.to && orderMsg.to.length >= 3 && rawText.includes(orderMsg.to)) ||
      (orderSenderName && orderSenderName.length >= 3 && rawText.includes(orderSenderName))
    );

    if (isExplicitClosurePhrase && (isSameAdvertiser || quoteMatches || mentionsOrderDetails) && !isFalsePositiveClosureUsage(rawText, 'تم')) {
      return {
        isClosed: true,
        isAmbiguous: false,
        reason: `ورد بالقروب تأكيد صريح بتوفر المندوب مرتبط بالطلب: «${rawText}»`,
        evidence: {
          replyText: rawText,
          senderName: sender,
          groupName: orderMsg.groupName,
          timestamp: new Date(followUpTime).toISOString(),
          confidence: 95,
          isQuote: quoteMatches,
          matchedKeywords: ['تأكيد صريح بالحجز', ...closureKeywords.matchedWords],
        },
        diagnostic: `تأكيد صريح بالحصول على مندوب مرتبط بإعلان ${orderSenderName}: ${rawText}`,
      };
    }
  }

  // إذا وُجدت إشارة اشتباه غير محسومة (مثل ملصق غير مفحوص بريبلي)
  if (ambiguousSign) {
    return {
      isClosed: false,
      isAmbiguous: true,
      reason: ambiguousSign.reason,
      diagnostic: ambiguousSign.diagnostic,
    };
  }

  return {
    isClosed: false,
    isAmbiguous: false,
    reason: 'لا توجد علامات إغلاق أو حجز في سياق المحادثة',
    diagnostic: 'سياق المحادثة نظيف والطلب لم ترد عليه أي إفادة بالإلغاء أو الحجز',
  };
}

/**
 * تقييم رسالة مرشحة واحدة للاستعادة في Catch-up Recovery
 */
export function evaluateCatchupCandidate(
  candidate: CatchupCandidateMessage,
  allMessages: Array<CatchupCandidateMessage | any>,
  existingIds: Set<string> = new Set(),
  dismissedIds: Set<string> = new Set()
): {
  status: 'AVAILABLE_OPEN' | 'EXCLUDED_CLOSED' | 'FLAGGED_AMBIGUOUS' | 'EXCLUDED_DUPLICATE' | 'IGNORED_NON_ORDER';
  reason: string;
  closureEvidence?: ClosureEvidence;
  recoveredOrder?: ParsedOrder;
  diagnostic: string;
} {
  const rawText = (candidate.rawText || '').trim();
  if (!rawText) {
    return { status: 'IGNORED_NON_ORDER', reason: 'رسالة فارغة', diagnostic: 'تم تخطي رسالة بدون نص' };
  }

  // 0. فحص مصدر المحادثة واستبعاد المحادثات الخاصة الفردية لحماية الخصوصية
  const group = (candidate.groupName || '').trim();
  const isDirectPrivate = candidate.isDirectPrivate === true || candidate.isGroup === false;
  const isPrivateLabel = !group || group === 'محادثة خاصة 👤' || group.includes('خاصة') || group === 'واتساب';
  const isUserJid = candidate.chatId ? candidate.chatId.includes('@s.whatsapp.net') : false;

  if (isDirectPrivate || isPrivateLabel || isUserJid) {
    return {
      status: 'IGNORED_NON_ORDER',
      reason: 'محادثة شخصية خاصة (مستبعدة نهائياً لحماية الخصوصية)',
      diagnostic: 'استبعاد رسالة شخصية فردية من الظهور كطلب في Radar',
    };
  }

  // 1. مكرر أو موجود مسبقاً
  if (existingIds.has(candidate.id) || dismissedIds.has(candidate.id) || isOrderPermanentlyClosed(candidate.id)) {
    return { status: 'EXCLUDED_DUPLICATE', reason: 'مكرر أو مسجل مسبقاً', diagnostic: `الطلب ${candidate.id} موجود مسبقاً أو مغلق نهائياً` };
  }

  // 2. إعلان تجاري أو سبام
  const spam = detectAdvertisementMessage(rawText);
  if (spam.isAdvertisement) {
    return { status: 'IGNORED_NON_ORDER', reason: spam.reason || 'إعلان تجاري', diagnostic: 'إعلان تجاري مستبعد' };
  }

  // 3. نقل ركاب
  const passenger = detectPassengerDelivery(rawText);
  if (passenger.level === 'confirmed_passenger') {
    return { status: 'IGNORED_NON_ORDER', reason: passenger.reason || 'نقل ركاب', diagnostic: 'إعلان نقل ركاب محظور' };
  }

  // 4. إغلاق ذاتي في نص الإعلان نفسه
  const selfClosed = checkSelfClosedInAdText(rawText);
  if (selfClosed.isClosed) {
    return {
      status: 'EXCLUDED_CLOSED',
      reason: selfClosed.reason || 'إغلاق ذاتي في نص الإعلان',
      diagnostic: 'الإعلان يحتوي علامة إغلاق صريحة أو مشطوب'
    };
  }

  // 5. فحص سياق المحادثة والرسائل اللاحقة
  const normalizedMessages: CatchupCandidateMessage[] = allMessages.map((m, idx) => ({
    id: m.id || `msg-${idx}`,
    rawText: m.rawText || m.text || '',
    groupName: m.groupName || candidate.groupName,
    senderName: m.senderName || m.sender || '',
    senderPhone: m.senderPhone || m.phone || '',
    timestamp: m.timestamp || Date.now(),
    rawQuotedText: m.rawQuotedText || m.quotedText,
    stickerData: m.stickerData || (m.stickerUrl ? { caption: m.caption, emoji: m.visualEmoji } : undefined)
  }));

  const threadCheck = evaluateSubsequentThreadClosure(candidate, normalizedMessages);
  if (threadCheck.isClosed) {
    return {
      status: 'EXCLUDED_CLOSED',
      reason: threadCheck.reason,
      closureEvidence: threadCheck.evidence,
      diagnostic: threadCheck.diagnostic
    };
  }

  if (threadCheck.isAmbiguous) {
    return {
      status: 'FLAGGED_AMBIGUOUS',
      reason: threadCheck.reason,
      diagnostic: threadCheck.diagnostic
    };
  }

  // متاح ومؤهل للاستعادة
  const recoveredOrder: ParsedOrder = {
    id: candidate.id.startsWith('spider-') ? candidate.id : `spider-rec-${candidate.id}`,
    from: 'البحرين',
    to: 'الوجهة المطلوبة',
    price: 2.5,
    isPriceUnspecified: false,
    rawText,
    groupName: candidate.groupName,
    senderName: candidate.senderName,
    senderPhone: candidate.senderPhone || '',
    receivedAt: new Date(candidate.timestamp),
    confidence: 85,
    type: 'طلب مستعاد (Catch-up)',
    notes: 'تمت استعادته عبر Spider Catch-up Recovery بعد التحقق التام 🟢',
    status: 'pending',
    source: 'android_notification',
    match: {
      score: 85,
      startMatched: true,
      destinationMatched: true,
      priceMatched: true,
      distanceMatched: true,
      timeMatched: true,
      distanceKm: null,
      statusLabel: 'مطابق جداً',
      statusColor: 'emerald',
    },
  };

  return {
    status: 'AVAILABLE_OPEN',
    reason: 'طلب متاح وغير محجوز أو مغلق',
    recoveredOrder,
    diagnostic: 'اجتاز جميع اختبارات عدم الإغلاق وسياق المحادثة نظيف'
  };
}

/**
 * المحرك الرئيسي لآلية استعادة الطلبات الفائتة في Spider (Catch-up Recovery)
 */
export async function runSpiderCatchupRecovery(
  candidateMessages: CatchupCandidateMessage[],
  existingOrders: ParsedOrder[] = [],
  options?: {
    maxRecoveryLimit?: number;
    logDiagnostics?: boolean;
  }
): Promise<CatchupRecoveryReport> {
  const maxLimit = options?.maxRecoveryLimit || 35;
  const existingIds = new Set<string>(existingOrders.map((o) => o.id));

  // جلب الطلبات المغلقة والممسوحة من الذاكرة الدائمة
  let dismissedIds: string[] = [];
  try {
    const rawDismissed = localStorage.getItem('orderi_notification_dismissed_order_ids');
    if (rawDismissed) dismissedIds = JSON.parse(rawDismissed);
  } catch {}
  const dismissedSet = new Set<string>(dismissedIds);

  const report: CatchupRecoveryReport = {
    totalScanned: candidateMessages.length,
    eligibleAvailableCount: 0,
    excludedClosedCount: 0,
    flaggedAmbiguousCount: 0,
    duplicatesSkippedCount: 0,
    nonOrdersCount: 0,
    recoveredOrders: [],
    excludedClosed: [],
    ambiguousOrders: [],
    diagnosticLogs: [],
  };

  const logDiag = (msg: string) => {
    report.diagnosticLogs.push(`[${new Date().toLocaleTimeString('ar-BH')}] ${msg}`);
  };

  logDiag(`بدء دورة Catch-up Recovery لفحص ${candidateMessages.length} رسالة فائتة بدقة صارمة...`);

  // ترتيب الرسائل من الأحدث إلى الأقدم
  const sortedMessages = [...candidateMessages].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  for (const msg of sortedMessages) {
    if (report.recoveredOrders.length >= maxLimit) {
      logDiag(`تم الوصول للحد الأقصى للطلبات المستعادة (${maxLimit}) - إيقاف الفحص.`);
      break;
    }

    const rawText = (msg.rawText || '').trim();
    if (!rawText) {
      report.nonOrdersCount++;
      continue;
    }

    // 1. منع التكرار: استبعاد الطلبات المسجلة مسبقاً أو المغلقة نهائياً أو المحذوفة
    if (existingIds.has(msg.id) || dismissedSet.has(msg.id) || isOrderPermanentlyClosed(msg.id)) {
      report.duplicatesSkippedCount++;
      logDiag(`تخطي رسالة مكررة أو مسجلة مسبقاً (${msg.id}).`);
      continue;
    }

    // 2. استبعاد الرسائل غير الصالحة: إعلانات عامة أو سبام أو حظر نقل الركاب
    const spamCheck = detectAdvertisementMessage(rawText);
    if (spamCheck.isAdvertisement) {
      report.nonOrdersCount++;
      logDiag(`استبعاد إعلان تجاري/خدمي: "${spamCheck.reason}"`);
      continue;
    }

    const passengerCheck = detectPassengerDelivery(rawText);
    if (passengerCheck.level === 'confirmed_passenger') {
      report.nonOrdersCount++;
      logDiag(`استبعاد طلب نقل ركاب شخصي: "${passengerCheck.reason}"`);
      continue;
    }

    // 3. فحص نص الإعلان نفسه: هل تم إغلاقه ذاتياً؟
    const selfClosed = checkSelfClosedInAdText(rawText);
    if (selfClosed.isClosed) {
      report.excludedClosedCount++;
      markOrderPermanentlyClosed(msg.id);
      report.excludedClosed.push({
        messageId: msg.id,
        reason: selfClosed.reason || 'إغلاق ذاتي في نص الإعلان',
      });
      logDiag(`استبعاد طلب مغلق في نص الإعلان نفسه: "${selfClosed.reason}" (المرسل: ${msg.senderName})`);
      continue;
    }

    // 4. فحص سياق المحادثة والرسائل اللاحقة في القروب (Thread Closure Analysis)
    const threadCheck = evaluateSubsequentThreadClosure(msg, candidateMessages);
    if (threadCheck.isClosed) {
      report.excludedClosedCount++;
      markOrderPermanentlyClosed(msg.id);
      report.excludedClosed.push({
        messageId: msg.id,
        reason: threadCheck.reason,
        evidence: threadCheck.evidence,
      });
      logDiag(`استبعاد طلب تم حجزه في سياق القروب: "${threadCheck.reason}"`);
      continue;
    }

    // إذا كانت الحالة غير مؤكدة (ملصق غير معروف أو ريبلي غامض)، لا يصنف كمتاح مؤكد
    if (threadCheck.isAmbiguous) {
      report.flaggedAmbiguousCount++;
      logDiag(`اشتباه حجز غير محسوم للطلب (${msg.id}): "${threadCheck.reason}" - تم حفظه للتحقق دون نشره كمتاح.`);
      continue;
    }

    // 5. تحليل الطلب بالذكاء الاصطناعي المحلي للتأكد من وجود موقع استلام وتسليم صحيح
    const parsed = await parseWhatsAppOrderWithLocalAi(rawText, {
      hybridMode: true,
      minConfidence: 75,
      useCloudFallback: false,
      senderName: msg.senderName,
      groupName: msg.groupName,
    });

    if (!parsed.canCreateOrder || !parsed.from || !parsed.to) {
      report.nonOrdersCount++;
      continue;
    }

    // طلب متاح ومؤكد اجتاز كافة اختبارات عدم الإغلاق
    const recoveredOrder: ParsedOrder = {
      id: msg.id.startsWith('spider-') ? msg.id : `spider-rec-${msg.id}`,
      from: parsed.from,
      to: parsed.to,
      price: parsed.price > 0 ? parsed.price : 0,
      isPriceUnspecified: parsed.isPriceUnspecified,
      rawText,
      groupName: msg.groupName,
      senderName: msg.senderName,
      senderPhone: msg.senderPhone || parsed.phone || '',
      receivedAt: new Date(msg.timestamp),
      confidence: parsed.confidence,
      type: 'طلب مستعاد (Catch-up)',
      notes: 'تمت استعادته عبر Spider Catch-up Recovery بعد التحقق التام من عدم حجزه أو إغلاقه 🟢',
      status: 'pending',
      source: 'android_notification',
      aiTierUsed: (parsed.parseMethod === 'cloud_ai' ? 'cloud_ai' : parsed.parseMethod === 'fast_heuristic' ? 'fast_heuristic' : 'local_ai'),
      passengerDetection: parsed.passengerDetection,
      match: {
        score: 85,
        startMatched: true,
        destinationMatched: true,
        priceMatched: true,
        distanceMatched: true,
        timeMatched: true,
        distanceKm: null,
        statusLabel: 'مطابق جداً',
        statusColor: 'emerald',
      },
    };

    report.recoveredOrders.push(recoveredOrder);
    report.eligibleAvailableCount++;
    logDiag(`✅ استعادة ناجحة لطلب متاح مؤكد: ${recoveredOrder.from} ➔ ${recoveredOrder.to} (${recoveredOrder.price} د.ب)`);
  }

  logDiag(`اكتملت دورة Catch-up Recovery: استعادة ${report.eligibleAvailableCount} متاح، واستبعاد ${report.excludedClosedCount} مغلق/محجوز.`);
  return report;
}
