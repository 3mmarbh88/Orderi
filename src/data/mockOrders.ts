import { ParsedOrder } from '../types';
import { parseWhatsAppOrderText } from '../utils/orderParser';
import { evaluateOrderMatch, MatcherLocation } from '../utils/matcher';
import { OrderFilter } from '../types';

export const SAMPLE_RAW_MESSAGES = [
  {
    group: 'قروب مندوبي البحرين 🇧🇭',
    sender: 'أم جاسم - حلويات',
    phone: '97339123456',
    text: 'مطلوب مندوب توصيل ضروري من المحرق إلى الرفاع الشرقي استلام كيكة السعر 3.5 دينار التواصل واتساب 39123456',
  },
  {
    group: 'طلبات التوصيل - المنامة والمحرق',
    sender: 'متجر عطور السيف',
    phone: '97333445566',
    text: 'توصيل عطر فاخر من السيف إلى مدينة عيسى المبلغ 3.0 د.ب رقم المستلم 33445566 بيك اب جاهز',
  },
  {
    group: 'شبكة مناديب التوصيل السريع',
    sender: 'زهور الربيع',
    phone: '97336778899',
    text: 'باقة ورد كبيرة من سار إلى الجفير السعر 4 دينار بحريني التسليم قبل المغرب 36778899',
  },
  {
    group: 'توصيل سريع الرفاع ومدينة عيسى',
    sender: 'مطعم برجر ستيشن',
    phone: '97338112233',
    text: 'طلب طعام ساخن من سند إلى عالي ب 2.5 د.ب اتصال 38112233',
  },
  {
    group: 'قروب مندوبي البحرين 🇧🇭',
    sender: 'مكتب خدمات وطباعة',
    phone: '97339554433',
    text: 'مستندات وأوراق مهمة من المنامة (المنطقة الدبلوماسية) إلى ديار المحرق السعر 3 د.ب 39554433',
  },
  {
    group: 'قروب أصحاب المشاريع والأسر المنتجة',
    sender: 'بوتيك دانة',
    phone: '97334001122',
    text: 'عباية جاهزة للتسليم من البسيتين إلى الحد السعر 2.5 دينار التواصل 34001122',
  },
  {
    group: 'شبكة مناديب التوصيل السريع',
    sender: 'صيدلية الصحة',
    phone: '97332889900',
    text: 'أدوية عاجلة من جدحفص إلى البديع السعر 2 د.ب 32889900',
  },
  {
    group: 'طلبات التوصيل - المنامة والمحرق',
    sender: 'كافيه لافندر',
    phone: '97336113355',
    text: 'حلويات وقهوة مثلجة من العدلية إلى مدينة حمد دوار 12 السعر 3.5 دينار 36113355',
  },
  {
    group: 'قروب مندوبي البحرين 🇧🇭',
    sender: 'إلكترونيات الشرق',
    phone: '97337998811',
    text: 'سماعات وشاحن من الجنبية إلى الرفاع الغربي 3.0 دينار بحريني 37998811',
  },
];

let counter = 100;

export function generateMockOrder(
  filter: OrderFilter,
  driverLocation: MatcherLocation | null,
  overrideIndex?: number
): ParsedOrder {
  counter++;
  const idx = overrideIndex !== undefined ? overrideIndex : Math.floor(Math.random() * SAMPLE_RAW_MESSAGES.length);
  const sample = SAMPLE_RAW_MESSAGES[idx];

  const parsed = parseWhatsAppOrderText(sample.text);
  const match = evaluateOrderMatch(
    parsed.from,
    parsed.to,
    parsed.price,
    filter,
    driverLocation
  );

  const ratePerKm = match.pickupToDeliveryDistanceKm && match.pickupToDeliveryDistanceKm > 0
    ? Math.round((parsed.price / match.pickupToDeliveryDistanceKm) * 100) / 100
    : undefined;

  return {
    id: 'ord-' + counter + '-' + Date.now().toString(36),
    from: parsed.from,
    to: parsed.to,
    price: parsed.price,
    rawText: sample.text,
    groupName: sample.group,
    senderName: sample.sender,
    senderPhone: sample.phone || parsed.phone,
    receivedAt: new Date(),
    confidence: parsed.confidence,
    type: 'توصيل شحنة',
    notes: parsed.notes,
    status: 'pending',
    match,
    ratePerKm,
  };
}
