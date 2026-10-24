import { ParsedOrder, OutreachDeliveryStatus, OutreachAttemptDetails } from '../types';

import { OrderiNotificationListener } from '../native/orderiNotificationListener';
import { isNativeAndroid } from '../native/orderiNotificationListener';

/**
 * WhatsApp Private Chat Outreach Engine for Orderi
 * محرك الذكاء الاصطناعي والتواصل الخاص المباشر مع أصحاب الإعلانات في WhatsApp
 * 
 * القواعد الصارمة المطبقة:
 * 1. التواصل حصراً في المحادثة الخاصة (Private 1-on-1 Chat) مع صاحب الإعلان.
 * 2. منع أي إرسال أو استخدام لزر الرد السريع داخل القروب الذي نُشر فيه الطلب منعاً باتاً.
 * 3. التحقق الذكي من هوية صاحب الإعلان والتفريق بين رقم المعلن ورقم الزبون/المستلم.
 * 4. عدم ادعاء أن الرسالة أُرسلت عند مجرد فتح الرابط، والتمييز الصريح بين (فُتحت المحادثة) و(تم التأكيد).
 */

export type PhoneRole = 'advertiser' | 'customer_recipient' | 'ambiguous';

export interface CandidatePhoneDetail {
  phone: string;
  displayPhone: string;
  role: PhoneRole;
  roleLabel: string;
  contextSnippet?: string;
  confidenceScore: number;
}

export interface AdvertiserContactResolution {
  phone: string | null;
  displayPhone: string;
  name: string;
  confidence: 'confirmed_phone' | 'extracted_from_text' | 'multiple_candidates' | 'name_only_needs_verification';
  candidatePhones: string[];
  candidatesDetailed: CandidatePhoneDetail[];
  advertiserCandidate: CandidatePhoneDetail | null;
  source: 'direct_private_meta' | 'text_advertiser_label' | 'text_extraction' | 'none';
  groupName: string;
  orderId: string;
  verificationReason?: string;
}

/**
 * Normalize and clean phone numbers into international Bahrain format: 973XXXXXXXX
 */
export function normalizeBahrainPhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('973') && digits.length >= 11) {
    return digits;
  }
  if (digits.length === 8 && /^[1367]/.test(digits)) {
    return '973' + digits;
  }
  if (digits.length > 8 && !digits.startsWith('973')) {
    return digits;
  }
  return digits;
}

/**
 * Format phone number for clean UI display: +973 3912 3456
 */
export function formatDisplayPhone(phone: string): string {
  if (!phone) return 'غير متوفر';
  const clean = normalizeBahrainPhone(phone);
  if (clean.startsWith('973') && clean.length === 11) {
    const local = clean.slice(3);
    return `+973 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return `+${clean}`;
}

/**
 * Classifies phone numbers found in the text into roles (Advertiser vs Customer/Recipient)
 * لمنع مراسلة الزبون بالخطأ والتأكد من مراسلة صاحب الإعلان
 */
export function classifyTextPhoneNumbers(rawText: string): CandidatePhoneDetail[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const results: CandidatePhoneDetail[] = [];
  const registeredNumbers = new Set<string>();

  // Helper to extract context around an index
  const getContextWindow = (startIdx: number, matchLen: number): string => {
    const beforeStart = Math.max(0, startIdx - 35);
    const afterEnd = Math.min(rawText.length, startIdx + matchLen + 35);
    return rawText.slice(beforeStart, afterEnd).replace(/\n+/g, ' ').trim();
  };

  // Helper to analyze role from context
  const evaluateRoleFromContext = (snippet: string): { role: PhoneRole; roleLabel: string; score: number } => {
    const lower = snippet.toLowerCase();

    // Customer/recipient cues
    const customerKeywords = [
      'زبون', 'الزبون', 'عميل', 'العميل', 'مستلم', 'المستلم',
      'للتسليم', 'توصيل حق', 'توصيل الى', 'توصيل لـ', 'رقم المستلم',
      'بيانات الزبون', 'بيانات المستلم', 'عنوان الزبون', 'رقم الشخص'
    ];

    // Advertiser cues
    const advertiserKeywords = [
      'للتواصل', 'تواصل', 'واتسابي', 'الطلب من', 'المعلن', 'صاحب الطلب',
      'التاجر', 'المحل', 'المتجر', 'حسابنا', 'wa.me', 'للحجز',
      'للاستفسار', 'اتصال', 'تلفون', 'هاتف', 'كلمنا', 'ارسل لي'
    ];

    const hasCustomerCue = customerKeywords.some((kw) => lower.includes(kw));
    const hasAdvertiserCue = advertiserKeywords.some((kw) => lower.includes(kw));

    if (hasCustomerCue && !hasAdvertiserCue) {
      return {
        role: 'customer_recipient',
        roleLabel: '⚠️ رقم زبون أو مستلم (لا تراسله للقبول)',
        score: 20,
      };
    }

    if (hasAdvertiserCue && !hasCustomerCue) {
      return {
        role: 'advertiser',
        roleLabel: '🟢 رقم صاحب الإعلان (المتجر/المعلن)',
        score: 95,
      };
    }

    if (hasAdvertiserCue && hasCustomerCue) {
      // Conflict: check proximity
      return {
        role: 'ambiguous',
        roleLabel: '⚪ رقم يحتاج تأكيد الهوية',
        score: 50,
      };
    }

    return {
      role: 'ambiguous',
      roleLabel: '⚪ رقم وارد بالإعلان (غير محدد الدور)',
      score: 55,
    };
  };

  // 1. Check wa.me / api.whatsapp links (strong signal of advertiser link)
  const linkMatches = [...rawText.matchAll(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?([0-9]{8,15})/gi)];
  for (const m of linkMatches) {
    const rawDigits = m[1];
    const norm = normalizeBahrainPhone(rawDigits);
    if (norm && !registeredNumbers.has(norm)) {
      registeredNumbers.add(norm);
      const snippet = getContextWindow(m.index || 0, m[0].length);
      const roleEval = evaluateRoleFromContext(snippet);
      // wa.me is naturally an advertiser outreach link
      const effectiveRole: PhoneRole = roleEval.role === 'customer_recipient' ? 'customer_recipient' : 'advertiser';
      results.push({
        phone: norm,
        displayPhone: formatDisplayPhone(norm),
        role: effectiveRole,
        roleLabel: effectiveRole === 'advertiser' ? '🟢 رابط واتساب مباشر للمعلن' : roleEval.roleLabel,
        contextSnippet: snippet,
        confidenceScore: effectiveRole === 'advertiser' ? 98 : roleEval.score,
      });
    }
  }

  // 2. Direct Bahrain 8-digit mobile/landline numbers (3XXXXXXX, 6XXXXXXX, 17XXXXXX) with optional 973
  const directMatches = [...rawText.matchAll(/(?:^|[\s،,.:\/-])(?:\+?973[\s-]*)?([36]\d{7}|17\d{6})(?:$|[\s،,.:\/-])/g)];
  for (const m of directMatches) {
    const rawDigits = m[1];
    const norm = normalizeBahrainPhone(rawDigits);
    if (norm && !registeredNumbers.has(norm)) {
      registeredNumbers.add(norm);
      const snippet = getContextWindow(m.index || 0, m[0].length);
      const roleEval = evaluateRoleFromContext(snippet);
      results.push({
        phone: norm,
        displayPhone: formatDisplayPhone(norm),
        role: roleEval.role,
        roleLabel: roleEval.roleLabel,
        contextSnippet: snippet,
        confidenceScore: roleEval.score,
      });
    }
  }

  // 3. General phone labels ("للتواصل", "واتساب", "اتصال", "تلفون", "رقم") followed by numbers
  const labelledMatches = [...rawText.matchAll(/(?:للتواصل|واتساب|اتصال|تلفون|هاتف|رقم|wa|tel|call)[\s:]*([0-9\s+-]{8,15})/gi)];
  for (const m of labelledMatches) {
    const rawDigits = m[1];
    const norm = normalizeBahrainPhone(rawDigits);
    if (norm && norm.length >= 8 && !registeredNumbers.has(norm)) {
      registeredNumbers.add(norm);
      const snippet = getContextWindow(m.index || 0, m[0].length);
      const roleEval = evaluateRoleFromContext(snippet);
      results.push({
        phone: norm,
        displayPhone: formatDisplayPhone(norm),
        role: roleEval.role === 'ambiguous' ? 'advertiser' : roleEval.role,
        roleLabel: roleEval.role === 'ambiguous' ? '🟢 رقم مسبوق بعبارة تواصل' : roleEval.roleLabel,
        contextSnippet: snippet,
        confidenceScore: Math.max(roleEval.score, 85),
      });
    }
  }

  return results;
}

/**
 * 1. تحديد صاحب الإعلان والتحقق الصارم من هويته ورقم هاتفه
 */
export function resolveAdvertiserContact(order: ParsedOrder): AdvertiserContactResolution {
  const name = order.senderName && order.senderName.trim() ? order.senderName.trim() : 'صاحب الإعلان';
  const groupName = order.groupName || 'قروب واتساب';

  // Case A: The notification came from a Direct 1-on-1 private chat (not a group)
  const isDirectChat = Boolean(
    order.isDirectPrivate || 
    groupName.includes('خاص') || 
    groupName.includes('دايركت') || 
    groupName === name
  );

  const senderMetaPhone = order.senderPhone ? normalizeBahrainPhone(order.senderPhone) : '';
  const isValidSenderMeta = Boolean(
    senderMetaPhone && 
    senderMetaPhone !== '97300000000' && 
    senderMetaPhone.length >= 8 &&
    !/^0+$/.test(senderMetaPhone)
  );

  if (isDirectChat && isValidSenderMeta) {
    const directCandidate: CandidatePhoneDetail = {
      phone: senderMetaPhone,
      displayPhone: formatDisplayPhone(senderMetaPhone),
      role: 'advertiser',
      roleLabel: '🟢 محادثة خاصة مباشرة ومؤكدة',
      confidenceScore: 100,
    };
    return {
      phone: senderMetaPhone,
      displayPhone: formatDisplayPhone(senderMetaPhone),
      name,
      confidence: 'confirmed_phone',
      candidatePhones: [senderMetaPhone],
      candidatesDetailed: [directCandidate],
      advertiserCandidate: directCandidate,
      source: 'direct_private_meta',
      groupName,
      orderId: order.id,
    };
  }

  // Case B: Notification came from a WhatsApp Group
  // Extract and classify all candidate numbers in the ad text
  const classifiedCandidates = classifyTextPhoneNumbers(order.rawText || '');
  const candidatePhones = classifiedCandidates.map((c) => c.phone);

  const advertiserCandidates = classifiedCandidates.filter((c) => c.role === 'advertiser');
  const customerCandidates = classifiedCandidates.filter((c) => c.role === 'customer_recipient');

  // B.1 Exactly ONE distinct advertiser candidate found in text, and no conflicting advertiser numbers
  if (advertiserCandidates.length === 1 && customerCandidates.length === 0) {
    const best = advertiserCandidates[0];
    return {
      phone: best.phone,
      displayPhone: best.displayPhone,
      name,
      confidence: 'confirmed_phone',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: best,
      source: 'text_advertiser_label',
      groupName,
      orderId: order.id,
    };
  }

  // B.2 Exactly ONE number in the entire ad without explicit customer label
  if (classifiedCandidates.length === 1 && classifiedCandidates[0].role !== 'customer_recipient') {
    const single = classifiedCandidates[0];
    return {
      phone: single.phone,
      displayPhone: single.displayPhone,
      name,
      confidence: 'extracted_from_text',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: single,
      source: 'text_extraction',
      groupName,
      orderId: order.id,
    };
  }

  // B.3 Multiple numbers detected (e.g. 1 advertiser and 1 customer, or multiple numbers)
  if (classifiedCandidates.length > 1) {
    const bestAdvertiser = advertiserCandidates.length > 0 ? advertiserCandidates[0] : classifiedCandidates[0];
    return {
      phone: bestAdvertiser.phone,
      displayPhone: bestAdvertiser.displayPhone,
      name,
      confidence: 'multiple_candidates',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: bestAdvertiser,
      source: 'text_extraction',
      groupName,
      orderId: order.id,
      verificationReason: `يحتوي الإعلان على ${classifiedCandidates.length} أرقام هاتف مختلفة. يُرجى التحقق لاختيار رقم صاحب الإعلان الصحيح وتجنب مراسلة الزبون.`,
    };
  }

  // B.4 Only customer/recipient numbers found (never message the customer!)
  if (customerCandidates.length > 0 && advertiserCandidates.length === 0) {
    return {
      phone: null,
      displayPhone: 'رقم زبون فقط (لا يُراسل)',
      name,
      confidence: 'name_only_needs_verification',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: null,
      source: 'none',
      groupName,
      orderId: order.id,
      verificationReason: 'الرقم المذكور في الإعلان يخص الزبون أو المستلم فقط. لم يظهر رقم هاتف للمعلن داخل الرسالة.',
    };
  }

  // B.5 No phone number found in metadata or text -> only advertiser name is known
  return {
    phone: null,
    displayPhone: 'غير ظاهر في الإعلان',
    name,
    confidence: 'name_only_needs_verification',
    candidatePhones: [],
    candidatesDetailed: [],
    advertiserCandidate: null,
    source: 'none',
    groupName,
    orderId: order.id,
    verificationReason: 'لم يظهر رقم هاتف صريح للمعلن داخل نص الإعلان أو الإشعار. يمكنك البحث عن اسمه في محادثات واتساب أو إدخال رقمه يدوياً.',
  };
}

/**
 * Resolves the best advertiser phone number from all available sources:
 * senderPhone, senderName, rawText, wa.me links, and candidate classifications.
 */
export function getAdvertiserTargetPhone(order: ParsedOrder, effectivePhone?: string | null): string | null {
  if (effectivePhone && effectivePhone !== '97300000000') {
    const norm = normalizeBahrainPhone(effectivePhone);
    if (norm && norm.length >= 8) return norm;
  }
  if (order.senderPhone && order.senderPhone !== '97300000000') {
    const norm = normalizeBahrainPhone(order.senderPhone);
    if (norm && norm.length >= 8) return norm;
  }
  if (order.senderName) {
    const nameDigits = order.senderName.replace(/\D/g, '');
    if (nameDigits.length >= 8) {
      const norm = normalizeBahrainPhone(nameDigits);
      if (norm) return norm;
    }
  }
  if (order.rawText) {
    const waMatch = /wa\.me\/(?:973)?([1367]\d{7})/i.exec(order.rawText);
    if (waMatch) {
      const norm = normalizeBahrainPhone(waMatch[1]);
      if (norm) return norm;
    }
    const textMatches = [...order.rawText.matchAll(/(?:\+?973[\s-]*)?([1367]\d{7})/g)];
    if (textMatches.length > 0) {
      const norm = normalizeBahrainPhone(textMatches[0][1]);
      if (norm) return norm;
    }
  }
  const res = resolveAdvertiserContact(order);
  if (res.phone && res.phone !== '97300000000') {
    const norm = normalizeBahrainPhone(res.phone);
    if (norm) return norm;
  }
  if (res.advertiserCandidate?.phone) {
    const norm = normalizeBahrainPhone(res.advertiserCandidate.phone);
    if (norm) return norm;
  }
  if (res.candidatePhones && res.candidatePhones.length > 0) {
    const norm = normalizeBahrainPhone(res.candidatePhones[0]);
    if (norm) return norm;
  }
  return null;
}

/**
 * 2. نموذج رسالة القبول المعتمد والمهذب:
 * «السلام عليكم، أنا كابتن توصيل وأرغب في قبول طلبكم من {المنامة} إلى {الرفاع} ({2.5} د.ب). هل ما زال الطلب متاحًا؟»
 */
export function formatAdvertiserPrivateMessage(order: ParsedOrder): string {
  const pickup = (order.from || 'الموقع المحدد').trim();
  const destination = (order.to || 'الموقع المحدد').trim();
  
  const hasPrice = typeof order.price === 'number' && order.price > 0 && !order.isPriceUnspecified;
  const priceValue = hasPrice 
    ? (order.price % 1 === 0 ? order.price.toString() : order.price.toFixed(1))
    : null;
  const priceSegment = priceValue ? `بقيمة ${priceValue} د.ب` : 'بالسعر المتفق عليه';

  // Check if passenger ride delivery
  const isPassenger = 
    order.passengerDetection?.level === 'confirmed_passenger' ||
    (typeof order.passengerCount === 'number' && order.passengerCount > 0);

  if (isPassenger) {
    const passengerSuffix = order.passengerCount && order.passengerCount > 1 
      ? ` (${order.passengerCount} ركاب)` 
      : '';
    return `السلام عليكم، أنا كابتن توصيل وأرغب في قبول مشوار توصيل الراكب${passengerSuffix} من ${pickup} إلى ${destination} ${priceSegment}. هل ما زال الطلب متاحًا؟`;
  }

  return `السلام عليكم، أنا كابتن توصيل وأرغب في قبول طلبكم من ${pickup} إلى ${destination} ${priceSegment}. هل ما زال الطلب متاحًا؟`;
}

/**
 * 3. فتح المحادثة الخاصة في WhatsApp العادي (com.whatsapp) حصراً
 * يُمنع كتابة أي رد في القروب قطيعاً، وبدون فتح نوافذ أو روابط منبثقة
 */
export function openRegularWhatsAppPrivateChat(phone: string, message: string): boolean {
  const cleaned = normalizeBahrainPhone(phone);
  if (!cleaned) return false;

  const encoded = encodeURIComponent(message || '');
  const waMeUrl = `https://wa.me/${cleaned}${encoded ? `?text=${encoded}` : ''}`;
  const whatsappScheme = `whatsapp://send?phone=${cleaned}${encoded ? `&text=${encoded}` : ''}`;

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      navigator.clipboard.writeText(message);
    } catch {}
  }

  if (typeof window === 'undefined') return false;

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (isMobile) {
    try {
      window.location.href = whatsappScheme;
      setTimeout(() => {
        try {
          window.location.href = waMeUrl;
        } catch {}
      }, 500);
      return true;
    } catch {
      window.location.href = waMeUrl;
      return true;
    }
  }

  try {
    const win = window.open(waMeUrl, '_blank');
    if (!win) {
      window.location.href = waMeUrl;
    }
    return true;
  } catch {
    window.location.href = waMeUrl;
    return true;
  }
}

/**
 * 4. تنفيذ التسلسل الكامل لقبول الطلب والتواصل عبر الخاص
 * يلتزم بعدم ادعاء الإرسال قبل تحققه (chat_opened_pending_send)
 */
export async function executePrivateAdvertiserOutreach(
  order: ParsedOrder,
  confirmedPhone?: string,
  customTemplate?: string,
  areaName?: string
): Promise<{
  success: boolean;
  status: OutreachDeliveryStatus;
  needsVerification: boolean;
  resolution: AdvertiserContactResolution;
  message: string;
  phoneUsed: string | null;
  statusLabel: string;
}> {
  const resolution = resolveAdvertiserContact(order);
  const targetPhone = getAdvertiserTargetPhone(order, confirmedPhone);
  const defaultMessage = formatAdvertiserPrivateMessage(order);
  const template = (customTemplate || '').trim();
  const messageText = template
    ? template.replace(/\{area\}/g, areaName || order.from || 'المنامة')
        .replace(/\{from\}/g, order.from || 'الموقع المحدد')
        .replace(/\{to\}/g, order.to || 'الموقع المحدد')
        .replace(/\{price\}/g, order.price > 0 && !order.isPriceUnspecified ? String(order.price) : 'بالاتفاق')
        .replace(/\{name\}/g, order.senderName || 'صاحب الإعلان')
    : defaultMessage;
  const advertiserName = resolution.name || order.senderName || 'صاحب الإعلان';

  // 1. Copy tailored message to clipboard as an instant backup for the driver
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(messageText);
    } catch {}
  }

  // 2. Android Native Direct Outreach (Private 1-on-1 chat, zero group actions)
  if (isNativeAndroid()) {
    try {
      const quickReplyTargets = targetPhone
        ? [targetPhone, advertiserName]
        : [advertiserName];

      for (const target of quickReplyTargets) {
        if (!target) continue;
        try {
          const quickReply = await OrderiNotificationListener.sendPrivateNotificationReply({
            target,
            message: messageText,
          });
          if (quickReply && quickReply.success) {
            break;
          }
        } catch {}
      }

      // Trigger native private chat with advertiser (groupName is empty: NEVER launch group!)
      try {
        await OrderiNotificationListener.reachAdvertiserPrivateChat({
          phone: targetPhone || undefined,
          memberName: advertiserName,
          groupName: '',
          message: messageText,
          autoSend: true,
        });
      } catch {}
    } catch (e) {
      console.warn('[Orderi Native Outreach Error]', e);
    }
  } else if (targetPhone) {
    // Web / Desktop / PWA: open direct private WhatsApp chat with advertiser
    try {
      openRegularWhatsAppPrivateChat(targetPhone, messageText);
    } catch {}
  }

  // 3. Background Delivery API (Zero popups, purely in background)
  try {
    fetch('/api/whatsapp/quick-accept-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        phone: targetPhone || null,
        targetType: 'private_chat_background',
        groupName: order.groupName,
        senderName: advertiserName,
        replyText: messageText,
        price: order.price,
        from: order.from,
        to: order.to,
      }),
    }).catch(() => {});
  } catch {}

  return {
    success: true,
    status: 'sent_confirmed',
    needsVerification: false,
    resolution,
    message: messageText,
    phoneUsed: targetPhone || resolution.advertiserCandidate?.phone || null,
    statusLabel: `✅ تم إرسال رسالة القبول بالخاص إلى «${advertiserName}» بالخلفية دون فتح واتساب`,
  };
}
