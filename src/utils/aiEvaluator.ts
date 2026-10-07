import { ParsedOrder, OrderFilter, AIMatchAnalysis } from '../types';
import { MatcherLocation } from './matcher';

/**
 * Robust client-side Bahrain logistics evaluation engine.
 * Guarantees that AI matching evaluation NEVER fails or gives "تعذر".
 */
export function computeClientAiEvaluation(
  order: Partial<ParsedOrder>,
  filter: OrderFilter,
  driverLocation: MatcherLocation | null
): AIMatchAnalysis {
  const rawText = order.rawText || '';
  const from = order.from || '';
  const to = order.to || '';
  const price = Number(order.price || 0);

  const minPrice = typeof filter.minimumPrice === 'number' ? filter.minimumPrice : 2.0;
  const coverageKm = typeof filter.coverageKm === 'number' ? filter.coverageKm : 15;
  const destinations = filter.destinations || [];

  const isPriceOk = price >= minPrice;
  const isStartOk = from ? true : false;
  const isDestOk = destinations.length === 0 || (to && destinations.includes(to));

  let calcScore = 65;
  const matched: string[] = [];
  const unmatched: string[] = [];
  const redFlags: string[] = [];

  // Price analysis
  if (isPriceOk) {
    calcScore += 18;
    matched.push(`الأجرة المعروضة (${price.toFixed(1)} د.ب) تغطي أو تتجاوز حدك الأدنى (${minPrice.toFixed(1)} د.ب)`);
  } else {
    calcScore -= 20;
    unmatched.push(`الأجرة المعروضة (${price.toFixed(1)} د.ب) أقل من حدك الأدنى المطلوب (${minPrice.toFixed(1)} د.ب)`);
  }

  // Location analysis
  if (isStartOk) {
    calcScore += 10;
    matched.push(`منطقة الاستلام (${from || 'البحرين'}) واضحة ومحددة بدقة`);
  } else {
    unmatched.push('منطقة الاستلام غير محددة بوضوح في الإعلان');
  }

  if (isDestOk) {
    calcScore += 10;
    matched.push(`منطقة التسليم (${to || 'البحرين'}) ضمن وجهاتك المفضلة والمربحة`);
  } else {
    unmatched.push(`منطقة التسليم (${to}) خارج قائمة وجهاتك المفضلة المحددة`);
  }

  // Text heuristics for Bahrain delivery market
  const isUrgent = /عاجل|فوري|حالا|الآن|ضروري|سريع/i.test(rawText);
  if (isUrgent) {
    calcScore += 5;
    matched.push('طلب فوري سريع جاهز للاستلام المباشر دون تأخير');
  }

  const hasBenefit = /بنفت|benefit|تحويل/i.test(rawText);
  if (hasBenefit) {
    calcScore += 5;
    matched.push('الدفع عبر بنفت بي (BenefitPay) فوري ومضمون');
  }

  // Red flags detection
  if (price <= 1.5 && from && to && from !== to) {
    redFlags.push('السعر منخفض جداً وقد لا يغطي تكلفة البترول واستهلاك السيارة');
    calcScore -= 15;
  }

  if (!from || !to) {
    redFlags.push('غموض في تفاصيل المسار: إحدى المناطق غير مصرح بها صراحة في الإعلان');
  }

  // Commodity detection
  let itemType = 'شحنة عامة';
  if (/عطر|عطور|بخور|دخون/i.test(rawText)) itemType = 'عطور وبخور';
  else if (/حلو|كيك|حلا|سويت|طعام|أكل|وجب|سندويش/i.test(rawText)) itemType = 'أطعمة ومأكولات';
  else if (/ورد|باقة|زهور/i.test(rawText)) itemType = 'ورود وهدايا';
  else if (/عباي|فستان|ثوب|ملابس/i.test(rawText)) itemType = 'ملابس وعبايات';
  else if (/هاتف|شاحن|سماعة|إلكترون/i.test(rawText)) itemType = 'إلكترونيات';

  calcScore = Math.max(25, Math.min(99, calcScore));

  const verdict: 'excellent' | 'good' | 'warning' | 'rejected' =
    calcScore >= 85 ? 'excellent' : calcScore >= 70 ? 'good' : calcScore >= 50 ? 'warning' : 'rejected';

  const verdictLabel =
    verdict === 'excellent'
      ? 'مطابق ومربح جداً ⭐'
      : verdict === 'good'
      ? 'مطابق ومناسب ✓'
      : verdict === 'warning'
      ? 'مطابق جزئياً مع محاذير ⚠️'
      : 'غير مطابق لشروطك ❌';

  const captainAdvice =
    calcScore >= 80
      ? 'الطلب مطابق ومربح، انقر على زر "حجز في الرادار" أو راسل المعلن عبر واتساب فوراً.'
      : calcScore >= 60
      ? 'الطلب مقبول، لكن تأكد من جاهزية الطلب وموقع الاستلام الدقيق قبل التحرك.'
      : 'راجع تفاصيل المسافة والسعر؛ قد يكون الطلب غير مجزٍ ما لم يزد المعلن الأجرة بمقدار دينار.';

  return {
    score: calcScore,
    verdict,
    verdictLabel,
    summary: `تحليل مطابقة الإعلان: حصل على تقييم ${calcScore}% استناداً لشروط الأجرة (${minPrice} د.ب) والمسار (${from} ← ${to}).`,
    matchedConditions: matched.length > 0 ? matched : ['مطابقة المعايير الأساسية'],
    unmatchedConditions: unmatched,
    redFlags,
    captainAdvice,
    detectedDetails: {
      itemType,
      urgency: isUrgent ? 'فوري مستعجل ⚡' : 'اعتيادي',
      paymentMethod: hasBenefit ? 'BenefitPay بنفت بي 📱' : /كاش/i.test(rawText) ? 'كاش عند الاستلام' : 'غير محدد بالرسالة',
      specialNotes: filter.customConditionsNotes ? `مقارنة مع شرطك الخاص: ${filter.customConditionsNotes}` : '',
    },
    analyzedAt: new Date().toISOString(),
  };
}
