import { normalizeArabicText } from '../data/bahrainAreas';
import { normalizeArabicMessageForMatching } from './arabicMessageNormalizer';

export interface AdvertisementDetection {
  isAdvertisement: boolean;
  reason?: string;
}

/**
 * Detects service-provider promotions and unrelated commercial/group ads.
 * This is a local, rule-based guard: no message content leaves the device.
 * A phone number or a route alone is not enough to label a message as an ad.
 */
export function detectAdvertisementMessage(rawText: string): AdvertisementDetection {
  if (!rawText || typeof rawText !== 'string') return { isAdvertisement: false };

  const text = normalizeArabicText(normalizeArabicMessageForMatching(rawText))
    .replace(/[ـ_*~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const contactCallToAction =
    /(?:للتواصل|للتواصل والواتساب|للتواصل واتساب|واتساب|كلمني خاص|يكلمني خاص|عالخاص|على الخاص|تواصل مع|راسلني|للحجز|انضمامك|طلب انضمام|instagram|انستقرام|انستا|خاص\s*[:：])/i.test(text);

  const providerOrTravelOffer =
    /(?:طالع|طالعه|متوجه|متوجهه|متوجهة|متواجد|متواجده|متواجدة|موجود|موجوده|رحلاتنا|رحله اسبوعيه|رحلة أسبوعية|على اتم الاستعداد|على استعداد|خدماتنا|سعيدين في خدمتكم|في خدمتكم|كل طلب حاضر|اي طلب حاضر|جاهزين للتوصيل|مواصلات الاسطوره|توصيل داخل وخارج البحرين|مشاويرنا)/i.test(text);

  const serviceItems = [
    /توصيل\s*(?:ركاب|اشخاص|طلبات|اغراض)/i,
    /(?:تسوق|قطع غيار|شركات شحن|ادويه|هدايا|اغراض|اوردرات|اوردر|طلبات)/i,
    /(?:مطار|محطه قطار|محطة قطار|تأمين سيارات|تأمين سفر)/i,
    /(?:شراء|استلام|ترجيع|مشاوير خاصه|مشاوير خاصة)/i,
  ];
  const serviceItemCount = serviceItems.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);

  // Travel-provider advert: first-person trip announcement + offered services/contact.
  if (providerOrTravelOffer && serviceItemCount >= 1 && (contactCallToAction || /(?:\+?973|\b3\d{7}\b|\b6\d{7}\b|\b33735402\b)/.test(text))) {
    return { isAdvertisement: true, reason: 'إعلان مقدم خدمة أو رحلة يعرض خدماته للتواصل، وليس طلب توصيل لعميل' };
  }

  // Commercial promotions unrelated to a customer asking for a delivery.
  const explicitPromotion =
    /(?:راحتك تهمنا|تأمين سيارات|تأمين سفر|سعر مناسب لك|اسعار جدا مناسبه|اسعار مناسبه|انجاز سريع|خدمة نحرص فيها عليك|قروب افلام|قروب افلام امريكيه|عرض فيلم كامل|اسعار شدات|شدات ببجي|للبيع|متوفر لدينا|على اتم الاستعداد)/i.test(text);
  if (explicitPromotion && (contactCallToAction || serviceItemCount >= 2 || /(?:\+?973|\b3\d{7}\b|\b6\d{7}\b|instagram|انستقرام)/i.test(text))) {
    return { isAdvertisement: true, reason: 'إعلان تجاري أو ترويجي، وليس طلب عميل' };
  }

  // A long, structured list of services with an explicit invitation/contact line.
  const hasListFormatting = /(?:^|\n)\s*(?:[•●▪🛍️🛒✈️🚗💵⚙️🏃👬📍-])/.test(rawText);
  if (hasListFormatting && serviceItemCount >= 3 && contactCallToAction && providerOrTravelOffer) {
    return { isAdvertisement: true, reason: 'قائمة خدمات معلن عنها مع دعوة للتواصل' };
  }

  return { isAdvertisement: false };
}
