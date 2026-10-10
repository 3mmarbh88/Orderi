import { LearnedClosureExpression, ClosureCategory } from '../types';

/**
 * AI-Powered Closure Expressions Learning Engine
 * محرك الذكاء الاصطناعي لرصد وفهم وتخزين الكلمات والتعابير الجديدة والرموز في سياق إنجاز وحجز الطلبات
 * 
 * الفئات الأربع المراقبة:
 * 1. أخذ الطلب وحجزه (Taken Confirmation)
 * 2. انتهاء الطلب واكتماله (Completion & Cancellation)
 * 3. الشكر وتأكيد الإنجاز (Gratitude & Success)
 * 4. الرموز التعبيرية في سياق الإنجاز (Closure & Delivery Emojis)
 */

export const STORAGE_KEY_LEARNED_CLOSURES = 'orderi_learned_closure_expressions';

// 1. الكلمات والرموز المبدئية المعتمدة في النظام
export const BASE_TAKEN_KEYWORDS = [
  'تم', 'حصلت', 'اخذته', 'أخذته', 'حجزته', 'انحجز', 'محجوز', 
  'اتفقت', 'اتفقت معاه', 'حصلنا مندوب', 'حصلت مندوب', 'توفر مندوب', 
  'تم الاتفاق', 'انا باخذه', 'أنا باخذه', 'عندي الطلب', 'عندي',
  'شالوه', 'استلمته', 'استلمها', 'مسكته', 'مسكت الطلب', 'راح الطلب'
];

export const BASE_COMPLETION_KEYWORDS = [
  'خلاص', 'انتهى', 'تم التوصيل', 'لا يوجد طلب', 'اكتمل', 
  'ملغي', 'الغي', 'التغى', 'تكنسل', 'كنسل', 'تفركش', 'كنسلناه',
  'وصل واستلم', 'خلصنا منه', 'خلص المشوار', 'تسكر', 'مقفل'
];

export const BASE_GRATITUDE_KEYWORDS = [
  'شكرا', 'شكراً', 'مشكور', 'مشكورين', 'يعطيك العافية', 'يعطيكم العافية', 
  'الله يوفقك', 'تسلم', 'تسلمون', 'جزاك الله خير', 'ما قصرت', 'ما قصرتوا',
  'في ميزان حسناتك', 'كفيت ووفيت', 'تسلم الأيادي', 'الله يبارك فيك'
];

export const BASE_CLOSURE_EMOJIS = ['👍', '✅', '👌', '🙏', '🎯', '🤝', '✔️', '🤍', '👏', '🤲', '📦', '🛵'];

// نماذج للتعابير المتقدمة المتعلمة مسبقاً بالذكاء الاصطناعي لإثراء اللهجة البحرينية والخليجية
export const SEED_AI_LEARNED_EXPRESSIONS: LearnedClosureExpression[] = [
  {
    id: 'ai-expr-1',
    phrase: 'شالوه',
    category: 'taken',
    meaning: 'تعبير بحريني دارج يعني أن الطلب أخذه مندوب آخر ولم يعد متاحاً.',
    confidence: 98,
    learnedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    sourceContext: 'طلب الرفاع شالوه خلاص',
    matchCount: 14,
    isAiLearned: true,
  },
  {
    id: 'ai-expr-2',
    phrase: 'فوقه خلاص',
    category: 'taken',
    meaning: 'تعبير شبابي يعني الموافقة التامة والاتفاق على التوصيل.',
    confidence: 94,
    learnedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    sourceContext: 'فوقه خلاص توكل على الله',
    matchCount: 8,
    isAiLearned: true,
  },
  {
    id: 'ai-expr-3',
    phrase: 'تيسرت الأمور',
    category: 'completion',
    meaning: 'عبارة تعني إتمام المشوار والتوصيل بنجاح ويسر.',
    confidence: 92,
    learnedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    sourceContext: 'الحمد لله تيسرت الأمور ووصل الطلب',
    matchCount: 5,
    isAiLearned: true,
  },
  {
    id: 'ai-expr-4',
    phrase: 'ما قصرتوا',
    category: 'gratitude',
    meaning: 'شكر وامتنان بالعامية تفيد الرضا عن إتمام الخدمة.',
    confidence: 96,
    learnedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    sourceContext: 'ما قصرتوا يا جماعة تم كل شي',
    matchCount: 11,
    isAiLearned: true,
  },
  {
    id: 'ai-expr-5',
    phrase: '🤝',
    category: 'emoji',
    meaning: 'رمز المصافحة في القروب دلالة على إبرام الاتفاق مع المندوب.',
    confidence: 95,
    learnedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    sourceContext: 'طلب المحرق 🤝',
    matchCount: 19,
    isAiLearned: true,
  }
];

/**
 * استرجاع كافة التعابير المتعلمة بالذكاء الاصطناعي من التخزين المحلي
 */
export function getStoredLearnedExpressions(): LearnedClosureExpression[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return SEED_AI_LEARNED_EXPRESSIONS;
    }
    const raw = localStorage.getItem(STORAGE_KEY_LEARNED_CLOSURES);
    if (!raw) {
      // حفظ القائمة الأولية إذا لم تكن موجودة
      localStorage.setItem(STORAGE_KEY_LEARNED_CLOSURES, JSON.stringify(SEED_AI_LEARNED_EXPRESSIONS));
      return SEED_AI_LEARNED_EXPRESSIONS;
    }
    const parsed: LearnedClosureExpression[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_AI_LEARNED_EXPRESSIONS;
  } catch {
    return SEED_AI_LEARNED_EXPRESSIONS;
  }
}

/**
 * حفظ قائمة التعابير المتعلمة
 */
export function saveLearnedExpressions(expressions: LearnedClosureExpression[]): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_LEARNED_CLOSURES, JSON.stringify(expressions));
  } catch (error) {
    console.error('[AI Closure Learner] Failed to save expressions:', error);
  }
}

/**
 * إضافة أو تحديث تعبير جديد متعلم بالذكاء الاصطناعي
 */
export function addOrUpdateLearnedExpression(newExpr: Omit<LearnedClosureExpression, 'id'> & { id?: string }): LearnedClosureExpression {
  const current = getStoredLearnedExpressions();
  const normalizedPhrase = newExpr.phrase.trim();

  // فحص ما إذا كان موجوداً مسبقاً
  const existingIndex = current.findIndex(
    item => item.phrase.toLowerCase() === normalizedPhrase.toLowerCase() ||
            item.phrase === normalizedPhrase
  );

  let updatedItem: LearnedClosureExpression;

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    updatedItem = {
      ...existing,
      category: newExpr.category || existing.category,
      meaning: newExpr.meaning || existing.meaning,
      confidence: Math.max(existing.confidence, newExpr.confidence || 90),
      matchCount: (existing.matchCount || 0) + 1,
      sourceContext: newExpr.sourceContext || existing.sourceContext,
    };
    current[existingIndex] = updatedItem;
  } else {
    updatedItem = {
      id: newExpr.id || `learned-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phrase: normalizedPhrase,
      category: newExpr.category,
      meaning: newExpr.meaning,
      confidence: newExpr.confidence || 90,
      learnedAt: newExpr.learnedAt || new Date().toISOString(),
      sourceContext: newExpr.sourceContext,
      matchCount: 1,
      isAiLearned: true,
    };
    current.unshift(updatedItem);
  }

  saveLearnedExpressions(current);

  // إرسال للخادم للتخزين المستمر بالتوازي
  fetch('/api/save-learned-closure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedItem),
  }).catch(() => {});

  return updatedItem;
}

/**
 * حذف تعبير متعلم
 */
export function deleteLearnedExpression(id: string): LearnedClosureExpression[] {
  const current = getStoredLearnedExpressions();
  const filtered = current.filter(item => item.id !== id);
  saveLearnedExpressions(filtered);

  fetch(`/api/learned-closure-expressions/${id}`, {
    method: 'DELETE',
  }).catch(() => {});

  return filtered;
}

/**
 * استخراج الكلمات والرموز المجمعة (الأساسية + المتعلمة بالذكاء الاصطناعي)
 */
export function getAggregatedClosureDictionary(): {
  takenKeywords: string[];
  completionKeywords: string[];
  gratitudeKeywords: string[];
  emojis: string[];
} {
  const learned = getStoredLearnedExpressions();

  const takenKeywords = new Set<string>(BASE_TAKEN_KEYWORDS);
  const completionKeywords = new Set<string>(BASE_COMPLETION_KEYWORDS);
  const gratitudeKeywords = new Set<string>(BASE_GRATITUDE_KEYWORDS);
  const emojis = new Set<string>(BASE_CLOSURE_EMOJIS);

  learned.forEach(item => {
    const phrase = item.phrase.trim();
    if (!phrase) return;

    if (item.category === 'taken') {
      takenKeywords.add(phrase);
    } else if (item.category === 'completion') {
      completionKeywords.add(phrase);
    } else if (item.category === 'gratitude') {
      gratitudeKeywords.add(phrase);
    } else if (item.category === 'emoji') {
      emojis.add(phrase);
    }
  });

  return {
    takenKeywords: Array.from(takenKeywords),
    completionKeywords: Array.from(completionKeywords),
    gratitudeKeywords: Array.from(gratitudeKeywords),
    emojis: Array.from(emojis),
  };
}

/**
 * فحص وتحليل نص رسالة جديدة باستخدام الذكاء الاصطناعي (Gemini 3.8 Flash)
 * للكشف عما إذا كانت تتضمن تعبيراً جديداً يفيد بإغلاق أو حجز الطلب، وتخزينه تلقائياً
 */
export async function analyzeAndLearnClosureWithAI(
  text: string,
  context?: {
    orderSnippet?: string;
    senderName?: string;
    groupName?: string;
  }
): Promise<{
  isClosureIntent: boolean;
  verdict: 'taken' | 'completion' | 'gratitude' | 'emoji' | 'none';
  extractedPhrase?: string;
  explanation?: string;
  confidence?: number;
  learnedItem?: LearnedClosureExpression;
}> {
  const rawText = (text || '').trim();
  if (!rawText) {
    return { isClosureIntent: false, verdict: 'none' };
  }

  try {
    const response = await fetch('/api/analyze-and-learn-closure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: rawText,
        context: context?.orderSnippet || '',
        senderName: context?.senderName || '',
        groupName: context?.groupName || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.isClosureIntent && data.extractedPhrase && data.verdict !== 'none') {
      // تخزين التعبير في الذاكرة المحلية وقاعدة البيانات
      const storedItem = addOrUpdateLearnedExpression({
        phrase: data.extractedPhrase,
        category: data.verdict as ClosureCategory,
        meaning: data.explanation || 'تعبير عامي يفيد باكتمال أو حجز الطلب تم فهمه بالذكاء الاصطناعي.',
        confidence: data.confidence || 85,
        sourceContext: rawText,
        isAiLearned: true,
      });

      return {
        isClosureIntent: true,
        verdict: data.verdict,
        extractedPhrase: data.extractedPhrase,
        explanation: data.explanation,
        confidence: data.confidence,
        learnedItem: storedItem,
      };
    }

    return {
      isClosureIntent: !!data.isClosureIntent,
      verdict: data.verdict || 'none',
      extractedPhrase: data.extractedPhrase,
      explanation: data.explanation,
      confidence: data.confidence,
    };
  } catch (error) {
    console.warn('[AI Closure Learner] AI evaluation fallback error:', error);
    return { isClosureIntent: false, verdict: 'none' };
  }
}
