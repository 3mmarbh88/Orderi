import { OrderFilter } from '../types';
import { normalizePhoneNumber } from './contacts';

export interface SelfAdDetectionResult {
  isOwnAd: boolean;
  reason?: string;
  matchedField?: 'phone' | 'sender_name' | 'from_me_flag' | 'signature_tag' | 'custom_keyword';
  detail?: string;
}

/**
 * Common captain broadcast signatures used when announcing availability in WhatsApp groups
 */
const DEFAULT_CAPTAIN_BROADCAST_PATTERNS = [
  /#مندوب_توصيل/i,
  /#كابتن_توصيل/i,
  /#مندوب_البحرين/i,
  /#مناديب_البحرين/i,
  /#كباتن_البحرين/i,
  /مندوب\s*متاح/i,
  /كابتن\s*متاح/i,
  /مندوب\s*متوفر/i,
  /كابتن\s*متوفر/i,
  /جاهز\s*للتوصيل/i,
  /متاح\s*للتوصيل/i,
  /سيارة\s*مكيفة\s*متوفرة/i,
  /متواجد\s*حاليا\s*في/i,
  /متواجد\s*الآن\s*في/i,
  /أنا\s*في\s*\(.*?\)/i,
  /انا\s*في\s*\(.*?\)/i,
];

/**
 * Detects whether an incoming WhatsApp message is the captain's own advertisement / broadcast
 */
export function detectIsOwnAd(
  messageData: {
    senderPhone?: string;
    senderName?: string;
    rawText?: string;
    isFromMe?: boolean;
  },
  filter?: Partial<OrderFilter>,
  currentUser?: { phone?: string; name?: string } | null
): SelfAdDetectionResult {
  const { senderPhone = '', senderName = '', rawText = '', isFromMe = false } = messageData;

  // 1. Explicit WhatsApp `fromMe` flag (outgoing messages sent from this device)
  if (isFromMe) {
    return {
      isOwnAd: true,
      reason: 'رسالة صادرة من حسابك الشخصي (From Me)',
      matchedField: 'from_me_flag',
      detail: 'إعلانك الشخصي الصادر من هذا الهاتف',
    };
  }

  // 2. Sender Name explicitly indicates self
  const cleanSender = (senderName || '').trim().toLowerCase();
  if (['أنا', 'انا', 'me', 'you', 'you (you)', 'myself'].includes(cleanSender)) {
    return {
      isOwnAd: true,
      reason: 'اسم المرسل يطابق حسابك الشخصي (أنا)',
      matchedField: 'sender_name',
      detail: senderName,
    };
  }

  if (currentUser?.name && cleanSender && currentUser.name.trim().toLowerCase() === cleanSender) {
    return {
      isOwnAd: true,
      reason: `اسم المعلن يطابق اسم حسابك المسجل (${currentUser.name})`,
      matchedField: 'sender_name',
      detail: currentUser.name,
    };
  }

  // Collect all captain known phone numbers
  const captainPhones: string[] = [];
  if (filter?.captainPhone) {
    // Can be comma or space separated if captain has multiple numbers
    const parts = filter.captainPhone.split(/[,،\s/]+/).map((p) => p.trim()).filter(Boolean);
    parts.forEach((p) => {
      const norm = normalizePhoneNumber(p);
      if (norm.length >= 8) captainPhones.push(norm.slice(-8));
    });
  }
  if (currentUser?.phone) {
    const normUser = normalizePhoneNumber(currentUser.phone);
    if (normUser.length >= 8) captainPhones.push(normUser.slice(-8));
  }

  // 3. Match sender phone number
  if (captainPhones.length > 0 && senderPhone) {
    const normSender = normalizePhoneNumber(senderPhone);
    const last8Sender = normSender.length >= 8 ? normSender.slice(-8) : normSender;
    if (last8Sender && captainPhones.includes(last8Sender)) {
      return {
        isOwnAd: true,
        reason: `رقم هاتف المرسل (${senderPhone}) يطابق رقمك الشخصي المسجل`,
        matchedField: 'phone',
        detail: senderPhone,
      };
    }
  }

  // 4. Scan message body text for captain phone numbers (many drivers write their number in the ad text)
  if (captainPhones.length > 0 && rawText) {
    const textNumbers = rawText.match(/(?:973)?[\s-]*(3\d{7}|6\d{7}|17\d{6})/g) || [];
    for (const num of textNumbers) {
      const normNum = normalizePhoneNumber(num);
      const last8Num = normNum.length >= 8 ? normNum.slice(-8) : normNum;
      if (last8Num && captainPhones.includes(last8Num)) {
        return {
          isOwnAd: true,
          reason: `نص الإعلان يحتوي على رقم هاتفك الشخصي (${num})`,
          matchedField: 'phone',
          detail: num,
        };
      }
    }
  }

  // 5. Match custom signatures defined by the captain
  if (filter?.captainCustomSignatures && filter.captainCustomSignatures.length > 0 && rawText) {
    for (const sig of filter.captainCustomSignatures) {
      const cleanSig = sig.trim().toLowerCase();
      if (cleanSig.length >= 2 && rawText.toLowerCase().includes(cleanSig)) {
        return {
          isOwnAd: true,
          reason: `مطابقة توقيعك الشخصي المخصص: "${sig}"`,
          matchedField: 'custom_keyword',
          detail: sig,
        };
      }
    }
  }

  // 6. Match standard captain broadcast templates (if the sender text is clearly offering delivery services)
  if (rawText) {
    for (const pattern of DEFAULT_CAPTAIN_BROADCAST_PATTERNS) {
      if (pattern.test(rawText)) {
        // If the text contains the captain's custom template prefix
        if (filter?.customResponseTemplate && filter.customResponseTemplate.trim().length > 5) {
          const cleanCustom = filter.customResponseTemplate.replace(/{area}/g, '').trim().toLowerCase();
          if (cleanCustom.length > 5 && rawText.toLowerCase().includes(cleanCustom)) {
            return {
              isOwnAd: true,
              reason: 'النص يطابق قالب ردك الشخصي المحفوظ',
              matchedField: 'signature_tag',
              detail: 'قالب الرد الشخصي',
            };
          }
        }
      }
    }
  }

  return { isOwnAd: false };
}
