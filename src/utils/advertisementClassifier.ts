import { normalizeArabicText } from '../data/bahrainAreas';
import { normalizeArabicMessageForMatching } from './arabicMessageNormalizer';

export interface AdvertisementDetection {
  isAdvertisement: boolean;
  reason?: string;
}

/**
 * Local, rule-based filter for provider promotions and general service adverts.
 * Called before Radar insertion and before Orderi sounds/notifications.
 * A phone number, city, route, or service word alone is never sufficient.
 */
export function detectAdvertisementMessage(rawText: string): AdvertisementDetection {
  if (!rawText || typeof rawText !== 'string') return { isAdvertisement: false };

  const text = normalizeArabicText(normalizeArabicMessageForMatching(rawText))
    .replace(/[ـ_*~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return { isAdvertisement: false };

  // Group rules, welcome posts and service directories are not delivery orders.
  // Preserve genuine requests when the same message explicitly asks for a courier,
  // pickup, delivery or a concrete order.
  const groupInformationPost =
    /(?:قوانين\s*(?:القروب|القروب|المجموعه|المجموعة)|شروط\s*(?:القروب|المجموعه|المجموعة)|الرجاء\s*(?:الالتزام|عدم)|يرجى\s*(?:الالتزام|عدم)|تنبيه\s*(?:من\s*)?(?:الاداره|الإدارة)|اداره\s*(?:القروب|المجموعة)|إدارة\s*(?:القروب|المجموعة)|رابط\s*(?:الدعوه|الدعوة)|هذا\s*(?:القروب|الجروب|المجموعة)\s*(?:مخصص|خاص)|الخدمات\s*(?:المتوفره|المتوفرة|المتاحه|المتاحة)|خدمات\s*عامه|خدمات\s*عامة|اهلا\s*وسهلا\s*(?:بكم\s*)?(?:في|بقروب|بقروبنا)|أهلا\s*وسهلا\s*(?:بكم\s*)?(?:في|بقروب|بقروبنا))/i.test(text);
  const explicitDeliveryRequest =
    /(?:مطلوب\s*(?:مندوب|توصيل|استلام|سائق)|ابي\s*(?:مندوب|توصيل|استلام)|ابغي\s*(?:مندوب|توصيل|استلام)|أبي\s*(?:مندوب|توصيل|استلام)|أبغي\s*(?:مندوب|توصيل|استلام)|محتاج\s*(?:مندوب|توصيل|استلام)|احتاج\s*(?:مندوب|توصيل|استلام)|أحتاج\s*(?:مندوب|توصيل|استلام)|استلام.{0,60}توصيل|توصيل.{0,60}(?:الى|إلى|لـ)\s*\S+)/i.test(text);
  if (groupInformationPost && !explicitDeliveryRequest) {
    return { isAdvertisement: true, reason: 'رسالة قوانين أو تعريف أو قائمة خدمات للقروب وليست طلب توصيل محدداً' };
  }

  const contactCallToAction =
    /(?:للتواصل|للتواصل والواتساب|للتواصل واتساب|واتساب|كلمني خاص|يكلمني خاص|على الخاص|عالخاص|تواصل مع|راسلني|للحجز|للاستفسار|للتنسيق|instagram|انستقرام|انستا|خاص\s*[:：])/i.test(text);

  const providerOrTravelOffer =
    /(?:طالع|طالعه|طالع(?:ه)?\s+(?:باذن الله|ان شاء الله)|رايح|رايحه|راجع|راجعه|متوجه|متوجهه|متوجهة|متواجد|متواجده|متواجدة|موجود|موجوده|رحلاتنا|رحلات مستمره|رحلات مستمرة|رحله|رحلة|مواصلات|مشاويرنا|على اتم الاستعداد|على استعداد|خدماتنا|في خدمتكم|حاضرين له|كل طلب حاضر|اي طلب حاضر|اللي يبي حاجه|اللي يبي شي|اي شخص يريد|اي شخص محتاج|من البحرين الى|من البحرين الي)/i.test(text);

  const serviceItems = [
    /(?:توصيل\s*(?:ركاب|اشخاص|طلبات|اغراض|امانات)|توصيل امانات)/i,
    /(?:تسوق|قطع غيار|شركات شحن|ادويه|هدايا|اغراض|اوردرات|اوردر|طلبات|رسايل|رسائل)/i,
    /(?:مطار|محطه قطار|تأمين سيارات|تأمين سفر|شراء|استلام|ترجيع|مشاوير خاصه|مشاوير خاصة)/i,
  ];
  const serviceItemCount = serviceItems.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
  const hasPhoneOrSocial =
    /(?:\+?973\s*\d{8}|\b[36]\d{7}\b|instagram|انستقرام|wa\.me)/i.test(text);
  const invitationToCustomers =
    /(?:اللي يبي|اللي يبي حاجه|اللي يبي شي|اي شخص يريد|أي شخص يريد|اي شخص محتاج|اللي محتاج|محتاج شي|كلمني خاص|يكلمني خاص|حاضرين له|حياكم على الخاص|متوفر من|متوفره من|متوفرة من)/i.test(text);

  // Catch common Bahrain/Gulf provider adverts, including trip announcements,
  // shopping/errand offers and commercial posts mixed with prayers/emojis.
  const explicitProviderOffer =
    /(?:طالع|طالعه|رايح|رايحه|راجع|راجعه|متجه|متوجه|متواجد|متواجده|موجود في الامارات|رحلاتنا مستمره|رحلات مستمره|رحلات يوميه|رحلات يومية|متوفر من|متوفره من|متوفرة من|حاضرين له|حاضرين لكم|اللي يبي|الي يبي|اللي محتاج|الي محتاج|اي شخص يريد|اي شخص محتاج|محتاج شي|محتاج شيء|اغراض فقط|أغراض فقط)/i.test(text);
  const customerInvitation =
    /(?:اللي يبي|الي يبي|اللي محتاج|الي محتاج|اي شخص يريد|أي شخص يريد|اي شخص محتاج|محتاج شي|محتاج شيء|حاضرين له|حياكم على الخاص|يكلمني خاص|كلمني خاص|متوفر من|متوفره من|متوفرة من)/i.test(text);
  const routeOrTripContext =
    /(?:السعوديه|السعودية|الكويت|قطر|الامارات|الإمارات|الاردن|الأردن|سوريا|الخبر|الدمام|البحرين|المنامه|المنامة|المحرق|مدينة حمد|مجمع التنين|طالع|رايح|راجع|رحله|رحلة|رحلات)/i.test(text);
  if (explicitProviderOffer && customerInvitation && routeOrTripContext &&
      (contactCallToAction || hasPhoneOrSocial || serviceItemCount >= 1)) {
    return { isAdvertisement: true, reason: 'إعلان رحلة أو عرض خدمات/أغراض للزبائن، وليس طلب توصيل محدداً' };
  }

  // Strong trip/service advert: the author announces their own travel or service,
  // then invites people to contact them or offers a list of services.
  if (providerOrTravelOffer && (contactCallToAction || invitationToCustomers || hasPhoneOrSocial) &&
      (serviceItemCount >= 1 || invitationToCustomers || /(?:راجع|رحلاتنا|رحلات مستمره|رحلات مستمرة|طالع|رايح)/i.test(text))) {
    return { isAdvertisement: true, reason: 'إعلان رحلة أو مقدم خدمة يعرض خدماته، وليس طلب عميل' };
  }

  // General commercial adverts, including insurance and service promotions.
  const explicitPromotion =
    /(?:راحتك تهمنا|تأمين سيارات|تأمين سفر|سعر مناسب لك|اسعار جدا مناسبه|اسعار مناسبه|انجاز سريع|خدمة نحرص فيها عليك|قروب افلام|عرض فيلم كامل|اسعار شدات|للبيع|متوفر لدينا|تواصل مع ابو سند|تواصل مع أبو سند)/i.test(text);
  if (explicitPromotion && (contactCallToAction || hasPhoneOrSocial || serviceItemCount >= 2)) {
    return { isAdvertisement: true, reason: 'إعلان تجاري أو ترويجي، وليس طلب توصيل' };
  }

  // Structured service menu with contact details is an advert even if the author
  // omitted an explicit "I am travelling" phrase.
  const hasListFormatting = /(?:^|\n)\s*(?:[•●▪🛍️🛒✈️🚗💵⚙️🏃👬📍-])/.test(rawText);
  if (hasListFormatting && serviceItemCount >= 3 && (contactCallToAction || hasPhoneOrSocial)) {
    return { isAdvertisement: true, reason: 'قائمة خدمات معلن عنها مع دعوة للتواصل' };
  }

  return { isAdvertisement: false };
}
