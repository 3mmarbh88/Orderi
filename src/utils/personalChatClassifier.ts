import { normalizeArabicText } from '../data/bahrainAreas';
import { normalizeArabicMessageForMatching } from './arabicMessageNormalizer';

/**
 * Personal WhatsApp Chat Classifier & Known Group Advertisers Registry
 * يتعرف الذكاء الاصطناعي على رسائل الواتساب الخاصة العادية من الأصدقاء والمعارف
 * ويفرق بينها وبين التجار الحقيقيين المعلنين في قروبات التوصيل
 */

const STORAGE_KEY_KNOWN_ADVERTISERS = 'orderi_known_group_advertisers';

// In-memory cache of known advertisers
const knownAdvertisersSet = new Set<string>();

/**
 * Initialize known advertisers from local storage
 */
function initKnownAdvertisers(): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_KNOWN_ADVERTISERS);
    if (saved) {
      const list: string[] = JSON.parse(saved);
      if (Array.isArray(list)) {
        list.forEach((item) => knownAdvertisersSet.add(normalizeIdentifier(item)));
      }
    }
  } catch {}
}

// Auto init
if (typeof window !== 'undefined') {
  initKnownAdvertisers();
}

function normalizeIdentifier(val: string): string {
  if (!val) return '';
  return val
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]/g, '')
    .trim();
}

/**
 * Register a sender as a known group advertiser (when an ad or message is captured in a monitored group)
 */
export function registerKnownGroupAdvertiser(senderName?: string, phone?: string): void {
  let updated = false;

  if (senderName && senderName.trim() && senderName !== 'واتساب' && senderName !== 'صاحب الإعلان') {
    const key = normalizeIdentifier(senderName);
    if (key && !knownAdvertisersSet.has(key)) {
      knownAdvertisersSet.add(key);
      updated = true;
    }
  }

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 8) {
      const last8 = digits.slice(-8);
      if (!knownAdvertisersSet.has(last8)) {
        knownAdvertisersSet.add(last8);
        updated = true;
      }
    }
  }

  if (updated && typeof window !== 'undefined') {
    try {
      const list = Array.from(knownAdvertisersSet).slice(-2000);
      localStorage.setItem(STORAGE_KEY_KNOWN_ADVERTISERS, JSON.stringify(list));
    } catch {}
  }
}

/**
 * Check if the sender has previously published orders or messages in the delivery groups
 */
export function isKnownGroupAdvertiser(senderName?: string, phone?: string): boolean {
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 8) {
      const last8 = digits.slice(-8);
      if (knownAdvertisersSet.has(last8)) return true;
    }
  }

  if (senderName && senderName.trim()) {
    const key = normalizeIdentifier(senderName);
    if (key && knownAdvertisersSet.has(key)) return true;
  }

  return false;
}

export interface PrivateMessageClassification {
  isCasualFriendChat: boolean;
  isKnownAdvertiser: boolean;
  reason?: string;
  isActionableOrder: boolean;
}

/**
 * Cues indicating a casual personal chat from friends/family/contacts
 */
const CASUAL_GREETINGS_AND_CHAT = [
  /^(?:السلام\s*عليكم|سلام\s*عليكم|وعليكم\s*السلام|صباح\s*الخير|مساء\s*الخير|هلا|هلا\s*والله|هلا\s*حبيبي|هلا\s*بالغالي|هلا\s*يا\s*الطيب|يا\s*هلا|مرحبا|مرحبتين|مرحبا\s*ملايين|تحياتي|شخبارك|شلونك|شخبارك\s*عساك\s*بخير|عساك\s*بخير|شلون\s*الصحة|شلون\s*الاهل|طمني\s*عنك|وينك|وين\s*طالع|وين\s*انت|وينك\s*اليوم|فاضي\s*اليوم|فاضي\s*الحين|مشغول|متى\s*ترجع|تتغدى|تتعشى|بتمر\s*علي|تعال|الديوانية|الميلس|المجلس|كوفي|نطلع|ضحك|هههه|ههههه|لوول|ياخوي|يا\s*خوي|يا\s*صاحبي|حبيبي|حبيب\s*قلبي|تسلم|مشكور|الله\s*يحفظك|الله\s*يعطيك\s*العافية|جمعة\s*مباركة|عيدك\s*مبارك|كل\s*عام\s*وانت\s*بخير)$/i,
  /(?:شخبارك|شلونك|عساك\s*بخير|طمني\s*عنك|وين\s*طالع|وين\s*قاعد|متى\s*فاضي|فاضي\s*نطلع|بتمر\s*علي|تعال\s*المجلس|تعال\s*الديوانية|شنو\s*مسوي|وين\s*انت\s*موجود|وينك\s*يا\s*غالي|اتصل\s*بك|دق\s*علي|كلمني\s*ضروري|شوف\s*الرابط|شوف\s*الفيديو|شوف\s*الصوره|شوف\s*الصورة)/i,
];

/**
 * Strict cues required if an unknown direct contact wants to place a delivery order
 */
const EXPLICIT_DELIVERY_INTENT = [
  /(?:مطلوب\s*مندوب|أبي\s*توصيل|ابي\s*توصيل|ابغي\s*توصيل|أبغي\s*توصيل|عندي\s*(?:طلب|اوردر|أوردر|توصيل|شحنة|اغراض\s*توصيل)|احتاج\s*توصيل|محتاج\s*مندوب|استلام\s*من.{1,40}توصيل|توصيل\s*من.{1,40}إلى|توصيل\s*من.{1,40}الى)/i,
];

/**
 * AI & Heuristic Classifier for Incoming Private WhatsApp Messages
 * إذا أرسل شخص رسالة واتساب خاصة ولم يعلن سابقاً في القروبات:
 * يُصنف فوراً على أنه رسالة عادية من صديق وليست تاجراً ولا طلب توصيل.
 */
export function classifyPrivateWhatsAppMessage(
  rawText: string,
  senderName?: string,
  senderPhone?: string,
  isDirectPrivate = true
): PrivateMessageClassification {
  if (!isDirectPrivate) {
    return {
      isCasualFriendChat: false,
      isKnownAdvertiser: true,
      isActionableOrder: true,
    };
  }

  const isKnown = isKnownGroupAdvertiser(senderName, senderPhone);
  const text = (rawText || '').trim();
  const normalized = normalizeArabicText(normalizeArabicMessageForMatching(text));

  // Voice note in private chat from an unknown sender (not a group advertiser):
  // صديق أرسل تسجيل صوتي في الخاص وليس معلناً في القروبات -> رسالة صديق خاصة
  const isVoiceNote = /(?:رسالة|تسجيل)\s*صوتية|voice\s*message|ptt|🎙️|فويس\s*نوت/i.test(text);
  if (!isKnown && isVoiceNote && !EXPLICIT_DELIVERY_INTENT.some((p) => p.test(normalized))) {
    return {
      isCasualFriendChat: true,
      isKnownAdvertiser: false,
      reason: 'تسجيل صوتي خاص من صديق/جهة اتصال عادية لم تعلن مسبقاً في قروبات التوصيل',
      isActionableOrder: false,
    };
  }

  // 1. Check for casual friendly greetings or personal chatter
  const isCasualGreeting = CASUAL_GREETINGS_AND_CHAT.some((pattern) => pattern.test(normalized));
  if (isCasualGreeting) {
    return {
      isCasualFriendChat: true,
      isKnownAdvertiser: isKnown,
      reason: 'رسالة واتساب خاصة عادية (تحية أو محادثة شخصية من صديق)',
      isActionableOrder: false,
    };
  }

  // 2. If NOT a known group advertiser:
  // Must possess explicit, unequivocal delivery intent (e.g. "عندي طلب توصيل من ... إلى ...")
  if (!isKnown) {
    const hasExplicitDeliveryIntent = EXPLICIT_DELIVERY_INTENT.some((p) => p.test(normalized));
    if (!hasExplicitDeliveryIntent) {
      return {
        isCasualFriendChat: true,
        isKnownAdvertiser: false,
        reason: 'رسالة خاصة من شخص لم يسبق له الإعلان في قروبات التوصيل ولا تحتوي صيغة طلب توصيل تجاري صريح',
        isActionableOrder: false,
      };
    }
  }

  return {
    isCasualFriendChat: false,
    isKnownAdvertiser: isKnown,
    isActionableOrder: true,
  };
}
