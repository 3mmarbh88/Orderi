import { normalizeArabicText } from '../data/bahrainAreas';
import { normalizeArabicMessageForMatching } from './arabicMessageNormalizer';

/**
 * Personal WhatsApp Chat Classifier
 * يفرّق بين محادثات واتساب الخاصة الفردية وبين رسائل المجموعات المصرّح بها،
 * مع منع إنشاء أو تخزين أي سجل دائم لهويات المعلنين بين الطلبات.
 */

const LEGACY_STORAGE_KEYS_TO_PURGE = [
  'orderi_known_group_advertisers',
  'orderi_advertiser_phone_vault',
];

function purgeLegacyAdvertiserRegistries(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    for (const key of LEGACY_STORAGE_KEYS_TO_PURGE) {
      localStorage.removeItem(key);
    }
  } catch {}
}

purgeLegacyAdvertiserRegistries();

/**
 * Intentionally a no-op: Orderi never builds or persists an internal advertiser registry.
 */
export function registerKnownGroupAdvertiser(_senderName?: string, _phone?: string): void {
  purgeLegacyAdvertiserRegistries();
}

/**
 * Always returns false because historical advertiser registries are forbidden.
 */
export function isKnownGroupAdvertiser(_senderName?: string, _phone?: string): boolean {
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

  // 2. Strict Exclusion Rule:
  // Personal 1-on-1 private chats can NEVER create orders in Radar regardless of keywords or locations.
  // This completely eliminates any confusion between personal chats and delivery groups.
  return {
    isCasualFriendChat: true,
    isKnownAdvertiser: isKnown,
    reason: isKnown 
      ? 'محادثة خاصة فردية من معلن مسجل (مستبعدة نهائياً من إنشاء طلبات جديدة بالرادار)'
      : 'محادثة خاصة فردية من صديق/جهة اتصال (مستبعدة نهائياً لحماية الخصوصية)',
    isActionableOrder: false,
  };
}
