import { ParsedOrder, OutreachDeliveryStatus } from '../types';
import { OrderiNotificationListener, isNativeAndroid } from '../native/orderiNotificationListener';

/**
 * WhatsApp Private Chat Outreach Engine for Orderi
 * محرك تحديد هوية المعلن من الإعلان الحالي فقط والتواصل الخاص عبر WhatsApp Messenger العادي (com.whatsapp).
 *
 * القواعد الصارمة:
 * 1. ممنوع إنشاء أو قراءة أو تخزين أي سجل دائم أو قاعدة بيانات للمعلنين بين الطلبات.
 * 2. عدم اشتراط وجود رقم هاتف: يُقبل المعلن بالاسم أو اللقب أو الاسم المستعار أو الرمز كما ورد في الرسالة/الإشعار الحالي.
 * 3. التمييز الصارم بين رقم المعلن ورقم الزبون/المستلم وعدم مراسلة الزبون أبداً.
 * 4. عدم تخمين أرقام الهواتف من الاسم الظاهر (senderName).
 * 5. استخدام نص الرد من إعدادات الفلتر (customResponseTemplate) كما هو.
 * 6. التواصل في المحادثة الخاصة عبر WhatsApp Messenger العادي (com.whatsapp) فقط.
 * 7. عند تعذر الإرسال بالخلفية، لا يُفتح واتساب تلقائياً ولا يُقبل الطلب أو يُحذف من الرادار.
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
  advertiserVerified: boolean;
  confidence: 'confirmed_phone' | 'extracted_from_text' | 'multiple_candidates' | 'name_only_verified' | 'needs_verification';
  candidatePhones: string[];
  candidatesDetailed: CandidatePhoneDetail[];
  advertiserCandidate: CandidatePhoneDetail | null;
  source: 'direct_private_meta' | 'notification_person_meta' | 'text_advertiser_label' | 'text_extraction' | 'sender_identity_only' | 'none';
  groupName: string;
  orderId: string;
  verificationReason?: string;
}

export interface PrivateOutreachNativeBridge {
  isNativeAndroid: () => boolean;
  checkPrivateOutreachCapability?: (options: {
    phone?: string;
    memberName?: string;
    groupName?: string;
  }) => Promise<{
    regularWhatsAppInstalled: boolean;
    notificationListenerEnabled: boolean;
    accessibilityEnabled: boolean;
    hasPrivateNotificationReplyAction: boolean;
    backgroundSendAvailable: boolean;
    reasonCode?: string;
  }>;
  reachAdvertiserPrivateChat: (options: {
    phone?: string;
    memberName?: string;
    groupName?: string;
    sourceMessageText?: string;
    message: string;
    autoSend?: boolean;
    backgroundOnly?: boolean;
    allowUiFallback?: boolean;
  }) => Promise<{
    success: boolean;
    method: string;
    status?: string;
    reasonCode?: string;
    packageName?: string;
    deliveryConfirmed?: boolean;
    statusLabel?: string;
    accessibilityRequired?: boolean;
    submitted?: boolean;
  }>;
  openWhatsAppPrivateConversation?: (options: {
    phone?: string;
    memberName?: string;
  }) => Promise<{ success: boolean; method: string }>;
}

const GENERIC_SENDER_PLACEHOLDERS = new Set([
  'صاحب الإعلان',
  'صاحب الاعلان',
  'معلن',
  'معلن بالقروب',
  'معلن واتساب',
  'معلن بالقروب المؤرشف',
  'واتساب',
  'عضو',
  'عضو بالقروب',
  'غير معروف',
  'whatsapp',
  'whatsapp messenger',
  'unknown',
]);

function purgeLegacyAdvertiserVaultStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('orderi_advertiser_phone_vault');
    localStorage.removeItem('orderi_known_group_advertisers');
  } catch {}
}

purgeLegacyAdvertiserVaultStorage();

export function cleanAdvertiserIdentityName(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const stripped = raw
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .trim();
  if (!stripped) return '';

  // Keep pure emoji/symbol identities (e.g. "🚕✨") intact while trimming leading/trailing decorations.
  const hasLetterOrDigit = /[\p{L}\p{N}]/u.test(stripped);
  const cleaned = hasLetterOrDigit
    ? stripped.replace(/^[~\s@+：:،,؛;]+|[~\s@+：:،,؛;]+$/g, '').trim()
    : stripped.replace(/^[~\s@+：:،,؛;]+|[~\s@+：:،,؛;]+$/g, '').trim();
  return cleaned;
}

export function isMeaningfulAdvertiserName(raw?: string | null): boolean {
  const cleaned = cleanAdvertiserIdentityName(raw);
  if (!cleaned) return false;
  return !GENERIC_SENDER_PLACEHOLDERS.has(cleaned.toLowerCase());
}

/**
 * Normalize and clean phone numbers into international Bahrain format: 973XXXXXXXX
 */
export function normalizeBahrainPhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits || /^0+$/.test(digits) || digits === '97300000000') return '';
  if (digits.startsWith('973') && digits.length >= 11) {
    return digits;
  }
  if (digits.length === 8 && /^[1367]/.test(digits)) {
    return '973' + digits;
  }
  if (digits.length > 8 && !digits.startsWith('973')) {
    return digits;
  }
  return digits.length >= 8 ? digits : '';
}

/**
 * Format phone number for clean UI display: +973 3912 3456
 */
export function formatDisplayPhone(phone: string): string {
  if (!phone) return 'غير متوفر';
  const clean = normalizeBahrainPhone(phone);
  if (!clean) return 'غير متوفر';
  if (clean.startsWith('973') && clean.length === 11) {
    const local = clean.slice(3);
    return `+973 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return `+${clean}`;
}

/**
 * Classifies phone numbers found in the text into roles (Advertiser vs Customer/Recipient)
 * لمنع مراسلة الزبون بالخطأ والتأكد من مراسلة صاحب الإعلان فقط.
 */
export function classifyTextPhoneNumbers(rawText: string): CandidatePhoneDetail[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const results: CandidatePhoneDetail[] = [];
  const registeredNumbers = new Set<string>();

  const getContextWindow = (startIdx: number, matchLen: number): { snippet: string; sameLine: string } => {
    const lineStart = Math.max(0, rawText.lastIndexOf('\n', startIdx) + 1);
    const nextNewline = rawText.indexOf('\n', startIdx);
    const lineEnd = nextNewline === -1 ? rawText.length : nextNewline;
    const sameLine = rawText.slice(lineStart, lineEnd).trim();

    const beforeStart = Math.max(0, startIdx - 30);
    const afterEnd = Math.min(rawText.length, startIdx + matchLen + 30);
    const snippet = rawText.slice(beforeStart, afterEnd).replace(/\n+/g, ' ').trim();
    return { snippet, sameLine };
  };

  const evaluateRoleFromContext = (ctx: { snippet: string; sameLine: string }): { role: PhoneRole; roleLabel: string; score: number } => {
    const customerKeywords = [
      'زبون', 'الزبون', 'عميل', 'العميل', 'مستلم', 'المستلم',
      'للتسليم', 'توصيل حق', 'توصيل الى', 'توصيل لـ', 'رقم المستلم',
      'بيانات الزبون', 'بيانات المستلم', 'عنوان الزبون', 'رقم الشخص',
    ];

    const advertiserKeywords = [
      'للتواصل', 'تواصل', 'واتسابي', 'الطلب من', 'المعلن', 'صاحب الطلب',
      'التاجر', 'المحل', 'المتجر', 'حسابنا', 'wa.me', 'للحجز',
      'للاستفسار', 'اتصال', 'تلفون', 'هاتف', 'كلمنا', 'ارسل لي',
    ];

    const lowerLine = ctx.sameLine.toLowerCase();
    const lineHasCustomer = customerKeywords.some((kw) => lowerLine.includes(kw));
    const lineHasAdvertiser = advertiserKeywords.some((kw) => lowerLine.includes(kw));

    if (lineHasCustomer && !lineHasAdvertiser) {
      return {
        role: 'customer_recipient',
        roleLabel: '⚠️ رقم زبون أو مستلم (ممنوع مراسلته للقبول)',
        score: 20,
      };
    }
    if (lineHasAdvertiser && !lineHasCustomer) {
      return {
        role: 'advertiser',
        roleLabel: '🟢 رقم صاحب الإعلان (المعلن)',
        score: 96,
      };
    }

    const lower = ctx.snippet.toLowerCase();
    const hasCustomerCue = customerKeywords.some((kw) => lower.includes(kw));
    const hasAdvertiserCue = advertiserKeywords.some((kw) => lower.includes(kw));

    if (hasCustomerCue && !hasAdvertiserCue) {
      return {
        role: 'customer_recipient',
        roleLabel: '⚠️ رقم زبون أو مستلم (ممنوع مراسلته للقبول)',
        score: 20,
      };
    }
    if (hasAdvertiserCue && !hasCustomerCue) {
      return {
        role: 'advertiser',
        roleLabel: '🟢 رقم صاحب الإعلان (المعلن)',
        score: 95,
      };
    }
    return {
      role: 'ambiguous',
      roleLabel: '⚪ رقم وارد بالإعلان (يحتاج تحقق)',
      score: hasAdvertiserCue ? 50 : 55,
    };
  };

  // 1. wa.me / api.whatsapp links
  const linkMatches = [...rawText.matchAll(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?([0-9]{8,15})/gi)];
  for (const m of linkMatches) {
    const norm = normalizeBahrainPhone(m[1]);
    if (norm && !registeredNumbers.has(norm)) {
      registeredNumbers.add(norm);
      const ctx = getContextWindow(m.index || 0, m[0].length);
      const roleEval = evaluateRoleFromContext(ctx);
      const effectiveRole: PhoneRole = roleEval.role === 'customer_recipient' ? 'customer_recipient' : 'advertiser';
      results.push({
        phone: norm,
        displayPhone: formatDisplayPhone(norm),
        role: effectiveRole,
        roleLabel: effectiveRole === 'advertiser' ? '🟢 رابط واتساب مباشر للمعلن' : roleEval.roleLabel,
        contextSnippet: ctx.snippet,
        confidenceScore: effectiveRole === 'advertiser' ? 98 : roleEval.score,
      });
    }
  }

  // 2. Direct Bahrain 8-digit numbers
  const directMatches = [...rawText.matchAll(/(?:^|[\s،,.:\/-])(?:\+?973[\s-]*)?([36]\d{7}|17\d{6})(?=$|[\s،,.:\/-])/g)];
  for (const m of directMatches) {
    const norm = normalizeBahrainPhone(m[1]);
    if (norm && !registeredNumbers.has(norm)) {
      registeredNumbers.add(norm);
      const ctx = getContextWindow(m.index || 0, m[0].length);
      const roleEval = evaluateRoleFromContext(ctx);
      results.push({
        phone: norm,
        displayPhone: formatDisplayPhone(norm),
        role: roleEval.role,
        roleLabel: roleEval.roleLabel,
        contextSnippet: ctx.snippet,
        confidenceScore: roleEval.score,
      });
    }
  }

  // 3. Labelled phone matches
  const labelledMatches = [...rawText.matchAll(/(?:للتواصل|واتساب|اتصال|تلفون|هاتف|رقم|wa|tel|call)[\s:]*([0-9\s+-]{8,15})/gi)];
  for (const m of labelledMatches) {
    const norm = normalizeBahrainPhone(m[1]);
    if (norm && !registeredNumbers.has(norm)) {
      registeredNumbers.add(norm);
      const ctx = getContextWindow(m.index || 0, m[0].length);
      const roleEval = evaluateRoleFromContext(ctx);
      results.push({
        phone: norm,
        displayPhone: formatDisplayPhone(norm),
        role: roleEval.role === 'ambiguous' ? 'advertiser' : roleEval.role,
        roleLabel: roleEval.role === 'ambiguous' ? '🟢 رقم مسبوق بعبارة تواصل' : roleEval.roleLabel,
        contextSnippet: ctx.snippet,
        confidenceScore: Math.max(roleEval.score, 85),
      });
    }
  }

  return results;
}

/**
 * 1. تحديد هوية صاحب الإعلان مباشرة من رسالة الإعلان الحالية وإشعار واتساب فقط.
 * - لا يُشترط ظهور رقم هاتف: أي اسم / لقب / رمز واضح للمرسل يكفي لتأكيد هويته من الإعلان.
 * - لا يُخمن رقم هاتف من الاسم ولا تُستخدم أي ذاكرة معلنين سابقة.
 * - يُمنع إرجاع رقم زبون أو رقم ملتبس كرقم للمعلن.
 */
export function resolveAdvertiserContact(order: ParsedOrder): AdvertiserContactResolution {
  purgeLegacyAdvertiserVaultStorage();

  const rawName = (order.senderName || '').trim();
  const hasMeaningfulName = isMeaningfulAdvertiserName(rawName);
  const name = hasMeaningfulName ? rawName : 'صاحب الإعلان';
  const groupName = (order.groupName || '').trim() || 'قروب واتساب';

  const classifiedCandidates = classifyTextPhoneNumbers(order.rawText || '');
  const candidatePhones = classifiedCandidates.map((c) => c.phone);
  const advertiserCandidates = classifiedCandidates.filter((c) => c.role === 'advertiser');
  const customerCandidates = classifiedCandidates.filter((c) => c.role === 'customer_recipient');

  const isDirectChat = Boolean(
    order.isDirectPrivate ||
      groupName.includes('خاص') ||
      groupName.includes('دايركت') ||
      (hasMeaningfulName && groupName === rawName),
  );

  // Only trust order.senderPhone if it didn't just copy a customer phone by mistake
  const senderMetaPhone = order.senderPhone ? normalizeBahrainPhone(order.senderPhone) : '';
  const senderIsKnownCustomerPhone = Boolean(
    senderMetaPhone && customerCandidates.some((c) => c.phone === senderMetaPhone),
  );
  const isValidSenderMeta = Boolean(
    senderMetaPhone &&
      !senderIsKnownCustomerPhone &&
      order.senderPhoneSource !== 'none',
  );

  if (isDirectChat && isValidSenderMeta) {
    const directCandidate: CandidatePhoneDetail = {
      phone: senderMetaPhone,
      displayPhone: formatDisplayPhone(senderMetaPhone),
      role: 'advertiser',
      roleLabel: '🟢 محادثة خاصة مباشرة مع المعلن',
      confidenceScore: 100,
    };
    return {
      phone: senderMetaPhone,
      displayPhone: formatDisplayPhone(senderMetaPhone),
      name,
      advertiserVerified: true,
      confidence: 'confirmed_phone',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: directCandidate,
      source: 'direct_private_meta',
      groupName,
      orderId: order.id,
    };
  }

  if (isValidSenderMeta) {
    const metaCandidate: CandidatePhoneDetail = {
      phone: senderMetaPhone,
      displayPhone: formatDisplayPhone(senderMetaPhone),
      role: 'advertiser',
      roleLabel: '🟢 مستخرج من بيانات المرسل في الإعلان الحالي',
      confidenceScore: 98,
    };
    return {
      phone: senderMetaPhone,
      displayPhone: formatDisplayPhone(senderMetaPhone),
      name,
      advertiserVerified: true,
      confidence: 'confirmed_phone',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: metaCandidate,
      source:
        order.senderPhoneSource === 'ad_text_advertiser'
          ? 'text_advertiser_label'
          : 'notification_person_meta',
      groupName,
      orderId: order.id,
    };
  }

  // Case B.1: Exactly one explicit advertiser number (even if a customer number also appears in text)
  if (advertiserCandidates.length === 1) {
    const best = advertiserCandidates[0];
    return {
      phone: best.phone,
      displayPhone: best.displayPhone,
      name,
      advertiserVerified: true,
      confidence: 'confirmed_phone',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: best,
      source: 'text_advertiser_label',
      groupName,
      orderId: order.id,
    };
  }

  // Case B.2: Exactly one phone in text and it is NOT labeled as customer
  if (classifiedCandidates.length === 1 && customerCandidates.length === 0) {
    const single = classifiedCandidates[0];
    return {
      phone: single.phone,
      displayPhone: single.displayPhone,
      name,
      advertiserVerified: true,
      confidence: 'extracted_from_text',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: single,
      source: 'text_extraction',
      groupName,
      orderId: order.id,
    };
  }

  // Case B.3: Multiple conflicting / ambiguous numbers (never auto-pick!)
  if (classifiedCandidates.length > 1 && advertiserCandidates.length !== 1) {
    return {
      phone: null,
      displayPhone: 'يحتوي على أكثر من رقم — يتطلب تحديد رقم المعلن',
      name,
      advertiserVerified: false,
      confidence: 'multiple_candidates',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: null,
      source: 'none',
      groupName,
      orderId: order.id,
      verificationReason: `يحتوي الإعلان على ${classifiedCandidates.length} أرقام مختلفة بدون تحديد قاطع لرقم المعلن. اختر رقم المعلن يدوياً لتجنب مراسلة الزبون.`,
    };
  }

  // Case B.4: No advertiser phone (or only customer phone), BUT real advertiser name/alias/symbol exists
  if (hasMeaningfulName) {
    return {
      phone: null,
      displayPhone: customerCandidates.length > 0 ? 'رقم الزبون مستبعد — المعلن بالاسم فقط' : 'بالاسم الظاهر فقط',
      name: rawName,
      advertiserVerified: true,
      confidence: 'name_only_verified',
      candidatePhones,
      candidatesDetailed: classifiedCandidates,
      advertiserCandidate: null,
      source: 'sender_identity_only',
      groupName,
      orderId: order.id,
      verificationReason:
        'لا يظهر رقم هاتف للمعلن في الإعلان، وتم اعتماد اسم/لقب المرسل الظاهر من الرسالة الحالية لمحاولة المراسلة الخاصة.',
    };
  }

  // Case B.5: Neither phone nor real sender name exists
  return {
    phone: null,
    displayPhone: 'غير ظاهر في الإعلان',
    name,
    advertiserVerified: false,
    confidence: 'needs_verification',
    candidatePhones,
    candidatesDetailed: classifiedCandidates,
    advertiserCandidate: null,
    source: 'none',
    groupName,
    orderId: order.id,
    verificationReason:
      'لم يظهر اسم مرسل حقيقي أو رقم هاتف للمعلن في الإعلان أو الإشعار الحالي.',
  };
}

/**
 * Resolves a verified advertiser phone strictly from the current order without guessing digits
 * from senderName or picking customer_recipient phone numbers.
 */
export function getAdvertiserTargetPhone(order: ParsedOrder, effectivePhone?: string | null): string | null {
  if (effectivePhone) {
    const norm = normalizeBahrainPhone(effectivePhone);
    if (norm) return norm;
  }
  const resolution = resolveAdvertiserContact(order);
  return resolution.phone;
}

/**
 * Fallback response format when the user left FilterSettings.customResponseTemplate empty.
 */
export function formatAdvertiserPrivateMessage(order: ParsedOrder): string {
  const pickup = (order.from || 'الموقع المحدد').trim();
  const destination = (order.to || 'الموقع المحدد').trim();

  const hasPrice = typeof order.price === 'number' && order.price > 0 && !order.isPriceUnspecified;
  const priceValue = hasPrice
    ? (order.price % 1 === 0 ? order.price.toString() : order.price.toFixed(1))
    : null;
  const priceSegment = priceValue ? `بقيمة ${priceValue} د.ب` : 'بالسعر المتفق عليه';

  const isPassenger =
    order.passengerDetection?.level === 'confirmed_passenger' ||
    (typeof order.passengerCount === 'number' && order.passengerCount > 0);

  if (isPassenger) {
    const passengerSuffix =
      order.passengerCount && order.passengerCount > 1 ? ` (${order.passengerCount} ركاب)` : '';
    return `السلام عليكم، أنا كابتن توصيل وأرغب في قبول مشوار توصيل الراكب${passengerSuffix} من ${pickup} إلى ${destination} ${priceSegment}. هل ما زال الطلب متاحًا؟`;
  }

  return `السلام عليكم، أنا كابتن توصيل وأرغب في قبول طلبكم من ${pickup} إلى ${destination} ${priceSegment}. هل ما زال الطلب متاحًا؟`;
}

/**
 * Formats the exact outreach message from Orderi Filter Settings (`customResponseTemplate`),
 * without adding hardcoded wrappers around the user's configured response.
 */
export function formatFilterOutreachMessage(
  order: ParsedOrder,
  customTemplate?: string,
  areaName?: string,
): string {
  let template = (customTemplate || '').trim();
  if (!template && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('orderi_filter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.customResponseTemplate === 'string') {
          template = parsed.customResponseTemplate.trim();
        }
      }
    } catch {}
  }

  if (!template) {
    return formatAdvertiserPrivateMessage(order);
  }

  const myArea = (areaName || order.from || 'البحرين').trim();
  const fromArea = (order.from || 'الموقع المحدد').trim();
  const toArea = (order.to || 'الموقع المحدد').trim();
  const priceText =
    order.price > 0 && !order.isPriceUnspecified
      ? order.price % 1 === 0
        ? String(order.price)
        : order.price.toFixed(1)
      : 'بالاتفاق';
  const advertiserName = isMeaningfulAdvertiserName(order.senderName)
    ? order.senderName.trim()
    : 'صاحب الإعلان';

  return template
    .replace(/\{area\}/g, myArea)
    .replace(/\{from\}/g, fromArea)
    .replace(/\{to\}/g, toArea)
    .replace(/\{price\}/g, priceText)
    .replace(/\{name\}/g, advertiserName);
}

/**
 * Explicit user-initiated manual regular WhatsApp private chat launch (NEVER called automatically on failure).
 */
export async function openManualRegularWhatsAppChat(
  phone: string,
  message: string,
  nativeBridge?: PrivateOutreachNativeBridge,
): Promise<{ success: boolean; method: string }> {
  const cleaned = normalizeBahrainPhone(phone);
  if (!cleaned) {
    return { success: false, method: 'invalid_phone' };
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(message);
    } catch {}
  }

  const bridge: PrivateOutreachNativeBridge = nativeBridge || {
    isNativeAndroid,
    reachAdvertiserPrivateChat: (opts) => OrderiNotificationListener.reachAdvertiserPrivateChat(opts),
    openWhatsAppPrivateConversation: (opts) => OrderiNotificationListener.openWhatsAppPrivateConversation(opts),
  };

  if (bridge.isNativeAndroid() && bridge.openWhatsAppPrivateConversation) {
    try {
      const res = await bridge.openWhatsAppPrivateConversation({ phone: cleaned });
      if (res?.success) {
        return res;
      }
    } catch {}
  }

  const encoded = encodeURIComponent(message || '');
  const waMeUrl = `https://wa.me/${cleaned}${encoded ? `?text=${encoded}` : ''}`;

  if (typeof window === 'undefined') {
    return { success: false, method: 'window_unavailable' };
  }

  try {
    const win = window.open(waMeUrl, '_blank');
    if (!win) {
      window.location.href = waMeUrl;
    }
    return { success: true, method: 'manual_wa_me_opened' };
  } catch {
    return { success: false, method: 'manual_open_failed' };
  }
}

export async function checkBackgroundOutreachAvailability(
  order: ParsedOrder,
  nativeBridge?: PrivateOutreachNativeBridge,
): Promise<{
  regularWhatsAppInstalled: boolean;
  notificationListenerEnabled: boolean;
  accessibilityEnabled: boolean;
  hasPrivateNotificationReplyAction: boolean;
  backgroundSendAvailable: boolean;
  reasonCode?: string;
}> {
  const resolution = resolveAdvertiserContact(order);
  const bridge: PrivateOutreachNativeBridge = nativeBridge || {
    isNativeAndroid,
    checkPrivateOutreachCapability: OrderiNotificationListener.checkPrivateOutreachCapability
      ? (opts) => OrderiNotificationListener.checkPrivateOutreachCapability!(opts)
      : undefined,
    reachAdvertiserPrivateChat: (opts) => OrderiNotificationListener.reachAdvertiserPrivateChat(opts),
  };

  if (!bridge.isNativeAndroid() || !bridge.checkPrivateOutreachCapability) {
    return {
      regularWhatsAppInstalled: false,
      notificationListenerEnabled: false,
      accessibilityEnabled: false,
      hasPrivateNotificationReplyAction: false,
      backgroundSendAvailable: false,
      reasonCode: 'not_native_android',
    };
  }

  try {
    return await bridge.checkPrivateOutreachCapability({
      phone: resolution.phone || undefined,
      memberName: isMeaningfulAdvertiserName(order.senderName) ? order.senderName.trim() : undefined,
      groupName: order.groupName || undefined,
    });
  } catch {
    return {
      regularWhatsAppInstalled: false,
      notificationListenerEnabled: false,
      accessibilityEnabled: false,
      hasPrivateNotificationReplyAction: false,
      backgroundSendAvailable: false,
      reasonCode: 'capability_check_failed',
    };
  }
}

export interface ExecutePrivateOutreachResult {
  success: boolean;
  status: OutreachDeliveryStatus;
  needsVerification: boolean;
  openFallbackModal: boolean;
  resolution: AdvertiserContactResolution;
  message: string;
  phoneUsed: string | null;
  statusLabel: string;
  reasonCode?: string;
  deliveryMethod:
    | 'notification_remote_input'
    | 'accessibility_reply_privately'
    | 'accessibility_member_click'
    | 'manual_regular_whatsapp'
    | 'none';
  accessibilityRequired?: boolean;
}

const privateOutreachInFlight = new Set<string>();
const privateOutreachRecentlySubmitted = new Map<string, number>();

export interface ExecutePrivateOutreachOptions {
  autoSend?: boolean;
  backgroundOnly?: boolean;
  allowUiFallback?: boolean;
  phoneOverride?: string | null;
  nativeBridge?: PrivateOutreachNativeBridge;
}

/**
 * 4. المحرك الموحد لقبول الطلب ومحاولة إرسال رسالة خاصة عبر WhatsApp Messenger العادي (com.whatsapp).
 * - عند فشل الإرسال بالخلفية (backgroundOnly && !allowUiFallback): لا يفتح واتساب أبداً ويُعيد status دقيق.
 */
export async function executePrivateAdvertiserOutreach(
  order: ParsedOrder,
  customTemplate?: string,
  areaName?: string,
  optionsOrAutoSend: boolean | ExecutePrivateOutreachOptions = true,
  legacyPhoneOverride?: string | null,
): Promise<ExecutePrivateOutreachResult> {
  const opts: ExecutePrivateOutreachOptions =
    typeof optionsOrAutoSend === 'boolean'
      ? {
          autoSend: optionsOrAutoSend,
          backgroundOnly: optionsOrAutoSend,
          allowUiFallback: false,
          phoneOverride: legacyPhoneOverride,
        }
      : {
          autoSend: optionsOrAutoSend.autoSend ?? true,
          backgroundOnly: optionsOrAutoSend.backgroundOnly ?? true,
          allowUiFallback: optionsOrAutoSend.allowUiFallback ?? false,
          phoneOverride: optionsOrAutoSend.phoneOverride ?? legacyPhoneOverride,
          nativeBridge: optionsOrAutoSend.nativeBridge,
        };

  const autoSend = opts.autoSend ?? true;
  const backgroundOnly = opts.backgroundOnly ?? true;
  const allowUiFallback = opts.allowUiFallback ?? false;

  const resolution = resolveAdvertiserContact(order);
  const messageText = formatFilterOutreachMessage(order, customTemplate, areaName);

  const normalizedOverride = opts.phoneOverride ? normalizeBahrainPhone(opts.phoneOverride) : '';
  const targetPhone = normalizedOverride || resolution.phone || null;
  const targetName = isMeaningfulAdvertiserName(order.senderName) ? order.senderName.trim() : '';
  const advertiserName = targetName || resolution.name || 'صاحب الإعلان';

  const makeFailure = (
    status: OutreachDeliveryStatus,
    statusLabel: string,
    reasonCode: string,
    extra?: Partial<ExecutePrivateOutreachResult>,
  ): ExecutePrivateOutreachResult => ({
    success: false,
    status,
    needsVerification: status === 'VERIFICATION_REQUIRED',
    openFallbackModal:
      status === 'VERIFICATION_REQUIRED' || status === 'BACKGROUND_SEND_UNAVAILABLE',
    resolution,
    message: messageText,
    phoneUsed: targetPhone,
    statusLabel,
    reasonCode,
    deliveryMethod: 'none',
    ...extra,
  });

  // Step 1: Must identify advertiser cleanly from the current ad/notification only (or explicit manual phone override)
  if (!normalizedOverride && !resolution.advertiserVerified) {
    return makeFailure(
      'VERIFICATION_REQUIRED',
      resolution.verificationReason ||
        'تعذر التحقق من هوية صاحب الإعلان أو تم رصد أكثر من رقم بدون تحديد قاطع للمعلن.',
      resolution.confidence === 'multiple_candidates'
        ? 'multiple_ambiguous_phones'
        : 'unverified_advertiser_identity',
    );
  }

  if (!targetPhone && !targetName) {
    return makeFailure(
      'VERIFICATION_REQUIRED',
      'لا يوجد اسم مرسل حقيقي أو رقم هاتف لصاحب الإعلان؛ لن يتم إرسال أي رسالة عشوائية.',
      'missing_advertiser_identity',
    );
  }

  const bridge: PrivateOutreachNativeBridge = opts.nativeBridge || {
    isNativeAndroid,
    reachAdvertiserPrivateChat: (payload) => OrderiNotificationListener.reachAdvertiserPrivateChat(payload),
    openWhatsAppPrivateConversation: (payload) => OrderiNotificationListener.openWhatsAppPrivateConversation(payload),
  };

  // Step 2: Check native Android execution availability (NEVER auto-open WhatsApp on background failure)
  if (!bridge.isNativeAndroid()) {
    return makeFailure(
      'BACKGROUND_SEND_UNAVAILABLE',
      'الإرسال في الخلفية عبر WhatsApp Messenger العادي متاح على Android فقط؛ لم يتم فتح واتساب تلقائياً أو تسجيل قبول الطلب.',
      'non_android_runtime',
    );
  }

  const dedupTarget = targetPhone || targetName;
  const requestKey = `${String(order.id || '')}:${dedupTarget}:${messageText}`;
  const lastSubmittedAt = privateOutreachRecentlySubmitted.get(requestKey) || 0;

  if (autoSend) {
    if (privateOutreachInFlight.has(requestKey)) {
      return makeFailure(
        'FAILED',
        'يوجد إرسال جارٍ بالفعل لهذا الطلب؛ لم نكرر الرسالة.',
        'outreach_in_flight',
        { openFallbackModal: false },
      );
    }
    if (Date.now() - lastSubmittedAt < 30_000) {
      return makeFailure(
        'FAILED',
        'تم تمرير الرد لهذا الطلب مؤخراً؛ مُنع تكرار الإرسال.',
        'duplicate_recent_outreach',
        { openFallbackModal: false },
      );
    }
    privateOutreachInFlight.add(requestKey);
  }

  try {
    const result = await bridge.reachAdvertiserPrivateChat({
      phone: targetPhone || undefined,
      memberName: targetName || undefined,
      groupName: order.groupName,
      sourceMessageText: order.rawText || '',
      message: messageText,
      autoSend,
      backgroundOnly,
      allowUiFallback,
    });

    if (result && result.success) {
      if (autoSend) {
        privateOutreachRecentlySubmitted.set(requestKey, Date.now());
      }
      const deliveryMethod: ExecutePrivateOutreachResult['deliveryMethod'] =
        result.method?.includes('remote_input') || result.method?.includes('notification')
          ? 'notification_remote_input'
          : result.method?.includes('reply_privately')
          ? 'accessibility_reply_privately'
          : 'accessibility_member_click';

      const normalizedStatus: OutreachDeliveryStatus =
        result.status === 'DELIVERY_CONFIRMED'
          ? 'DELIVERY_CONFIRMED'
          : 'SUBMITTED_UNCONFIRMED';

      return {
        success: true,
        status: normalizedStatus,
        needsVerification: false,
        openFallbackModal: false,
        resolution,
        message: messageText,
        phoneUsed: targetPhone,
        deliveryMethod,
        reasonCode: result.reasonCode,
        statusLabel:
          result.statusLabel ||
          `تم تمرير رسالة القبول إلى محادثة «${advertiserName}» الخاصة في WhatsApp العادي (بانتظار تأكيد التسليم) ⚡`,
      };
    }

    const nativeStatus = result?.status;
    if (nativeStatus === 'VERIFICATION_REQUIRED') {
      return makeFailure(
        'VERIFICATION_REQUIRED',
        result.statusLabel || 'يتطلب التحقق من هوية المعلن أو المجموعة قبل المراسلة الخاصة.',
        result.reasonCode || 'native_verification_required',
        { accessibilityRequired: Boolean(result.accessibilityRequired) },
      );
    }

    if (nativeStatus === 'FAILED') {
      return makeFailure(
        'FAILED',
        result.statusLabel || 'تعذر إرسال الرسالة الخاصة عبر WhatsApp Messenger العادي.',
        result.reasonCode || 'native_outreach_failed',
        { accessibilityRequired: Boolean(result.accessibilityRequired) },
      );
    }

    return makeFailure(
      'BACKGROUND_SEND_UNAVAILABLE',
      result?.statusLabel ||
        `تعذر الإرسال في الخلفية لعدم توفر إجراء رد خاص مباشر من WhatsApp العادي لـ «${advertiserName}»؛ يمكنك المتابعة يدوياً من الخيارات دون فتح واتساب قسراً.`,
      result?.reasonCode || 'background_send_unavailable',
      { accessibilityRequired: Boolean(result?.accessibilityRequired) },
    );
  } catch {
    return makeFailure(
      'FAILED',
      'حدث خطأ تقني أثناء محاولة التواصل الخاص عبر واتساب؛ بقي الطلب في الرادار.',
      'native_bridge_exception',
    );
  } finally {
    if (autoSend) {
      privateOutreachInFlight.delete(requestKey);
    }
  }
}
