import { normalizeArabicText } from '../data/bahrainAreas';

export type AdvertiserReplyVerdict = 'CONFIRMED_AWARDED' | 'REJECTED_OR_TAKEN' | 'NEUTRAL';

export interface AdvertiserReplyAnalysis {
  verdict: AdvertiserReplyVerdict;
  matchedKeywords: string[];
  reason: string;
}

/**
 * Keywords that mean the advertiser gave the order to this captain:
 * «تم»، «لك»، «عندك»، «حياك»، «تفضل»، «اعتمد»، «أوك»، «تمام»، «اوكي»، «خذه»، «تعال»، ملصقات/إيموجي (👍, ✅, 🤝, 👌, 🚗, 📦)
 */
const CONFIRMATION_KEYWORDS = [
  'تم', 'لك', 'عندك', 'حياك', 'تفضل', 'اعتمد', 'معتمد', 'تمام', 'أوك', 'اوك', 
  'اوكي', 'أوكي', 'خذه', 'خذها', 'تعال', 'جاهز', 'يلا', 'أبشر', 'ابشر', 
  'على بركة الله', 'بالانتظار', 'في الانتظار', 'انتظرك', 'أنتظرك', 
  'تفضل اخوي', 'تفضل اخي', 'تفضل خاص', 'كلمني', 'راسلني', 'عطني رقمك', 'جاهزة الشحنة', 'جاهز الطلب'
];

const CONFIRMATION_EMOJIS = ['👍', '✅', '🤝', '👌', '🚗', '📦', '✔️', '💐', '🌹', '💯', '🙏'];

/**
 * Keywords that mean the advertiser gave it to someone else or it was cancelled:
 * «أخذوه»، «حصلت مندوب»، «حصلت»، «لقد حصلت علي مندوب»، «تكنسل»، «راح»، «تأخرت»، «ملغي»
 */
const REJECTION_OR_TAKEN_KEYWORDS = [
  'اخذوه', 'أخذوه', 'حصلت مندوب', 'حصلت', 'حصلنا مندوب', 'حصلنا', 
  'لقد حصلت', 'تم اخذه', 'تم أخذه', 'انأخذ', 'انأخذت', 'راح', 'راحت', 
  'تكنسل', 'كنسل', 'تكنسلت', 'ملغي', 'الغي', 'التغى', 'تأخرت', 'تاخرت', 
  'في مندوب ثاني', 'اخذها مندوب', 'خلاص اخذوه', 'اعتذر', 'اعتذر منك', 
  'مو متوفر', 'خلص', 'سبقك مندوب', 'مو لك', 'مش لك', 'مو عندك'
];

/**
 * Classifies an advertiser's incoming reply in private chat
 */
export function classifyAdvertiserPrivateReply(rawText: string): AdvertiserReplyAnalysis {
  if (!rawText || typeof rawText !== 'string') {
    return { verdict: 'NEUTRAL', matchedKeywords: [], reason: 'نص فارغ' };
  }

  const normalized = normalizeArabicText(rawText);

  // 1. Check for Rejection / Taken first (الأولوية لكلمات الرفض أو الأخَذ لمنع الإيجابيات الخاطئة)
  const matchedRejection: string[] = [];
  for (const kw of REJECTION_OR_TAKEN_KEYWORDS) {
    const rx = new RegExp(`(?:^|[\\s،,.])${kw}(?:$|[\\s،,.])`, 'i');
    if (rx.test(normalized) || rx.test(rawText)) {
      matchedRejection.push(kw);
    }
  }

  if (matchedRejection.length > 0) {
    return {
      verdict: 'REJECTED_OR_TAKEN',
      matchedKeywords: matchedRejection,
      reason: 'المعلن أفاد بأن الطلب أخذوه أو حصل مندوب آخر أو تم إلغاؤه (يتم التجاهل التام)',
    };
  }

  // 2. Check for Award Confirmation (المعلن وافق وعطاني الأوردر)
  const matchedConfirmation: string[] = [];
  for (const kw of CONFIRMATION_KEYWORDS) {
    const rx = new RegExp(`(?:^|[\\s،,.])${kw}(?:$|[\\s،,.])`, 'i');
    if (rx.test(normalized) || rx.test(rawText)) {
      matchedConfirmation.push(kw);
    }
  }

  for (const emoji of CONFIRMATION_EMOJIS) {
    if (rawText.includes(emoji)) {
      matchedConfirmation.push(emoji);
    }
  }

  if (matchedConfirmation.length > 0) {
    return {
      verdict: 'CONFIRMED_AWARDED',
      matchedKeywords: Array.from(new Set(matchedConfirmation)),
      reason: 'المعلن وافق وعطاك الطلب («تم / لك / عندك / ملصق تأكيد»)',
    };
  }

  return {
    verdict: 'NEUTRAL',
    matchedKeywords: [],
    reason: 'رسالة عادية لا تحتوي على تأكيد أو رفض صريح',
  };
}
