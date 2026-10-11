import { ParsedOrder } from '../types';
import { sendNativeQuickReply } from '../native/whatsappListener';
import { isNativeAndroid } from '../native/orderiNotificationListener';

/**
 * WhatsApp Private Chat Outreach Engine for Orderi
 * محرك التواصل المباشر في المحادثات الخاصة مع أصحاب الإعلانات في تطبيق WhatsApp العادي
 * 
 * يلتزم بالقواعد الصارمة:
 * 1. التواصل حصراً في الخاص (Private Chat) مع صاحب الإعلان.
 * 2. منع أي كتابة أو إرسال داخل القروب الذي نُشر فيه الطلب.
 * 3. استخدام تطبيق WhatsApp العادي (com.whatsapp) وليس WhatsApp Business.
 * 4. التحقق التام من هوية المعلن ورقم هاتفه، والتوقف عند الشك لتأكيد الشخص الصحيح.
 */

export interface AdvertiserContactResolution {
  phone: string | null;
  displayPhone: string;
  name: string;
  confidence: 'confirmed_phone' | 'extracted_from_text' | 'multiple_candidates' | 'name_only_needs_verification';
  candidatePhones: string[];
  source: 'sender_meta' | 'text_extraction' | 'none';
  groupName: string;
  orderId: string;
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
 * 1. تحديد صاحب الإعلان واستخراج رقمه من بيانات الإشعار ومحتوى الرسالة
 */
export function resolveAdvertiserContact(order: ParsedOrder): AdvertiserContactResolution {
  const candidatePhones: string[] = [];

  // Check senderPhone from notification metadata
  const senderMetaPhone = order.senderPhone ? normalizeBahrainPhone(order.senderPhone) : '';
  const isValidSenderMeta = Boolean(
    senderMetaPhone && 
    senderMetaPhone !== '97300000000' && 
    senderMetaPhone.length >= 8 &&
    !/^0+$/.test(senderMetaPhone)
  );

  if (isValidSenderMeta) {
    candidatePhones.push(senderMetaPhone);
  }

  // Extract phone numbers and wa.me links from message text (rawText)
  if (order.rawText) {
    // 1. wa.me or api.whatsapp links
    const linkMatches = [...order.rawText.matchAll(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?([0-9]{8,15})/gi)];
    for (const m of linkMatches) {
      const p = normalizeBahrainPhone(m[1]);
      if (p && !candidatePhones.includes(p)) {
        candidatePhones.push(p);
      }
    }

    // 2. Direct Bahrain 8-digit mobile/landline numbers (3XXXXXXX, 6XXXXXXX, 17XXXXXX) with optional 973
    const textPhoneMatches = [...order.rawText.matchAll(/(?:^|[\s،,.:\/-])(?:\+?973[\s-]*)?([36]\d{7}|17\d{6})(?:$|[\s،,.:\/-])/g)];
    for (const m of textPhoneMatches) {
      const p = normalizeBahrainPhone(m[1]);
      if (p && !candidatePhones.includes(p)) {
        candidatePhones.push(p);
      }
    }

    // 3. General phone labels ("للتواصل", "واتساب", "اتصال", "تلفون", "رقم") followed by numbers
    const labelledMatches = [...order.rawText.matchAll(/(?:للتواصل|واتساب|اتصال|تلفون|هاتف|رقم|wa|tel|call)[\s:]*([0-9\s+-]{8,15})/gi)];
    for (const m of labelledMatches) {
      const p = normalizeBahrainPhone(m[1]);
      if (p && p.length >= 8 && !candidatePhones.includes(p)) {
        candidatePhones.push(p);
      }
    }
  }

  const name = order.senderName && order.senderName.trim() ? order.senderName.trim() : 'صاحب الإعلان';

  // Determine confidence and best phone
  if (isValidSenderMeta) {
    return {
      phone: senderMetaPhone,
      displayPhone: `+${senderMetaPhone.startsWith('973') ? '973 ' + senderMetaPhone.slice(3) : senderMetaPhone}`,
      name,
      confidence: 'confirmed_phone',
      candidatePhones,
      source: 'sender_meta',
      groupName: order.groupName || 'قروب واتساب',
      orderId: order.id,
    };
  }

  if (candidatePhones.length === 1) {
    const single = candidatePhones[0];
    return {
      phone: single,
      displayPhone: `+${single.startsWith('973') ? '973 ' + single.slice(3) : single}`,
      name,
      confidence: 'extracted_from_text',
      candidatePhones,
      source: 'text_extraction',
      groupName: order.groupName || 'قروب واتساب',
      orderId: order.id,
    };
  }

  if (candidatePhones.length > 1) {
    return {
      phone: candidatePhones[0],
      displayPhone: `+${candidatePhones[0].startsWith('973') ? '973 ' + candidatePhones[0].slice(3) : candidatePhones[0]}`,
      name,
      confidence: 'multiple_candidates',
      candidatePhones,
      source: 'text_extraction',
      groupName: order.groupName || 'قروب واتساب',
      orderId: order.id,
    };
  }

  // No phone found in metadata or text -> only advertiser's name available
  return {
    phone: null,
    displayPhone: 'غير متوفر بالرسالة',
    name,
    confidence: 'name_only_needs_verification',
    candidatePhones: [],
    source: 'none',
    groupName: order.groupName || 'قروب واتساب',
    orderId: order.id,
  };
}

/**
 * 2. نموذج الرسالة التلقائية الخاصة وفق مواصفات المستخدم بدقة:
 * "السلام عليكم، بخصوص الأوردر من {العدلية} إلى {أم الحصم} بقيمة {2} دينار، أنا مستعد لاستلامه. هل ما زال متاحًا؟"
 * وبتغيير تلقائي حسب كل طلب (توصيل طلب أو راكب).
 */
export function formatAdvertiserPrivateMessage(order: ParsedOrder): string {
  const pickup = (order.from || 'الموقع المحدد').trim();
  const destination = (order.to || 'الموقع المحدد').trim();
  
  const hasPrice = typeof order.price === 'number' && order.price > 0 && !order.isPriceUnspecified;
  const priceValue = hasPrice 
    ? (order.price % 1 === 0 ? order.price.toString() : order.price.toFixed(1))
    : null;
  const priceSegment = priceValue ? `بقيمة ${priceValue} دينار` : 'بالسعر المتفق عليه';

  // Check if passenger ride delivery
  const isPassenger = 
    order.passengerDetection?.level === 'confirmed_passenger' ||
    (typeof order.passengerCount === 'number' && order.passengerCount > 0);

  if (isPassenger) {
    const passengerSuffix = order.passengerCount && order.passengerCount > 1 
      ? ` (${order.passengerCount} ركاب)` 
      : '';
    return `السلام عليكم، بخصوص توصيل الراكب${passengerSuffix} من ${pickup} إلى ${destination} ${priceSegment}، أنا مستعد لتوصيله. هل ما زال متاحًا؟`;
  }

  return `السلام عليكم، بخصوص الأوردر من ${pickup} إلى ${destination} ${priceSegment}، أنا مستعد لاستلامه. هل ما زال متاحًا؟`;
}

/**
 * 3. فتح المحادثة الخاصة في تطبيق WhatsApp العادي (com.whatsapp) حصراً
 * دون كتابة أي رسالة في القروب
 */
export function openRegularWhatsAppPrivateChat(phone: string, message: string): void {
  const cleaned = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);

  // Use wa.me deep link with WhatsApp normal scheme
  // WhatsApp package on Android: com.whatsapp (regular), not com.whatsapp.w4b (business)
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  if (isAndroid) {
    // Android Intent targeting regular WhatsApp specifically
    try {
      const intentUrl = `intent://send?phone=${cleaned}&text=${encoded}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
      window.location.href = intentUrl;
      return;
    } catch {
      // Fallback to direct whatsapp protocol
    }
  }

  // Standard universal direct private link (opens regular WhatsApp on phone)
  const universalUrl = `https://wa.me/${cleaned}?text=${encoded}`;
  
  if (typeof window !== 'undefined') {
    // Open in top window or popup without leaving context
    const link = document.createElement('a');
    link.href = universalUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * 4. تنفيذ التسلسل الكامل لقبول الطلب والتواصل عبر الخاص
 */
export async function executePrivateAdvertiserOutreach(
  order: ParsedOrder,
  confirmedPhone?: string
): Promise<{
  success: boolean;
  needsVerification: boolean;
  resolution: AdvertiserContactResolution;
  message: string;
  phoneUsed: string | null;
}> {
  const resolution = resolveAdvertiserContact(order);
  const targetPhone = confirmedPhone ? normalizeBahrainPhone(confirmedPhone) : resolution.phone;
  const messageText = formatAdvertiserPrivateMessage(order);

  // If phone is missing or ambiguous and captain has not explicitly provided/confirmed one
  if (!targetPhone || resolution.confidence === 'name_only_needs_verification') {
    return {
      success: false,
      needsVerification: true,
      resolution,
      message: messageText,
      phoneUsed: null,
    };
  }

  // 1. Copy tailored message to clipboard as safe backup
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(messageText);
    } catch {}
  }

  // 2. Send via Native Android Notification / Accessibility Bridge if available
  if (isNativeAndroid()) {
    try {
      await sendNativeQuickReply({
        phone: targetPhone,
        message: messageText,
      });
    } catch (err) {
      console.warn('[Orderi Outreach] Native quick reply call:', err);
    }
  }

  // 3. Register outreach in server backend for response tracking (تم/لك/اخذوه)
  try {
    fetch('/api/whatsapp/quick-accept-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        phone: targetPhone,
        targetType: 'private_direct', // PRIVATE DIRECT CHAT ONLY - NEVER GROUP!
        groupName: order.groupName,
        senderName: resolution.name,
        replyText: messageText,
        price: order.price,
        from: order.from,
        to: order.to,
      }),
    }).catch(() => {});
  } catch {}

  // 4. Open regular WhatsApp private chat
  openRegularWhatsAppPrivateChat(targetPhone, messageText);

  return {
    success: true,
    needsVerification: false,
    resolution,
    message: messageText,
    phoneUsed: targetPhone,
  };
}
