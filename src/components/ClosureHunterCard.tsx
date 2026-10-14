import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldAlert, 
  Tag, 
  Plus, 
  X, 
  Play, 
  Sparkles, 
  Trash2, 
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  HelpCircle
} from 'lucide-react';
import { OrderFilter, ClosureCategory, LearnedClosureExpression } from '../types';
import { 
  getStoredLearnedExpressions, 
  addOrUpdateLearnedExpression, 
  deleteLearnedExpression,
  getAggregatedClosureDictionary,
  BASE_TAKEN_KEYWORDS,
  BASE_COMPLETION_KEYWORDS,
  BASE_GRATITUDE_KEYWORDS,
  BASE_CLOSURE_EMOJIS,
  STORAGE_KEY_LEARNED_CLOSURES,
  SEED_AI_LEARNED_EXPRESSIONS,
  syncLearnedExpressions
} from '../utils/aiClosureLearner';
import { extractClosureKeywords } from '../utils/orderClosureDetector';
import { playAlertTone } from '../utils/sound';

interface ClosureHunterCardProps {
  filter: OrderFilter;
  onUpdateFilter: (updated: OrderFilter) => void;
}

export const ClosureHunterCard: React.FC<ClosureHunterCardProps> = ({
  filter,
  onUpdateFilter,
}) => {
  const [learnedExprs, setLearnedExprs] = useState<LearnedClosureExpression[]>([]);
  const [newWordInput, setNewWordInput] = useState('');
  const [newWordCategory, setNewWordCategory] = useState<ClosureCategory>('taken');
  
  // Simulator
  const [simText, setSimText] = useState('خلاص حصلت مندوب يا شباب شكراً');
  const [simResult, setSimResult] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'taken' | 'completion' | 'gratitude' | 'emoji'>('all');

  useEffect(() => {
    setLearnedExprs(getStoredLearnedExpressions());
    let cancelled = false;
    syncLearnedExpressions().then((items) => {
      if (!cancelled) setLearnedExprs(items);
    }).catch(() => {
      // Keep the local-first dictionary usable when the server is offline.
    });
    return () => { cancelled = true; };
  }, []);

  const isEnabled = filter.autoCloseOrdersEnabled !== false;
  const ambiguousAction = filter.autoCloseAmbiguousAction || 'flag';

  // Toggle master switch
  const handleToggleAutoClose = (enabled: boolean) => {
    onUpdateFilter({
      ...filter,
      autoCloseOrdersEnabled: enabled,
    });
  };

  const handleToggleAmbiguous = (action: 'flag' | 'ignore') => {
    onUpdateFilter({
      ...filter,
      autoCloseAmbiguousAction: action,
    });
  };

  // Add new word or symbol
  const handleAddNewWord = () => {
    const trimmed = newWordInput.trim();
    if (!trimmed) return;

    const newItem = addOrUpdateLearnedExpression({
      phrase: trimmed,
      category: newWordCategory,
      meaning: `كلمة أو رمز مضاف يدوياً لصائد الإغلاق (${newWordCategory})`,
      confidence: 95,
      isAiLearned: false,
      learnedAt: new Date().toISOString(),
    });

    setLearnedExprs(getStoredLearnedExpressions());
    setNewWordInput('');
  };

  const handleDeleteWord = (id: string) => {
    const updated = deleteLearnedExpression(id);
    setLearnedExprs(updated);
  };

  const handleResetToDefaults = () => {
    if (typeof window !== 'undefined' && window.confirm('هل تريد استعادة الكلمات والرموز الافتراضية للصائد؟')) {
      localStorage.setItem(STORAGE_KEY_LEARNED_CLOSURES, JSON.stringify(SEED_AI_LEARNED_EXPRESSIONS));
      setLearnedExprs(SEED_AI_LEARNED_EXPRESSIONS);
    }
  };

  // Run Simulator
  const handleRunSimulator = () => {
    if (!simText.trim()) return;
    const extracted = extractClosureKeywords(simText);

    let verdict: 'confirmed' | 'suspicious' | 'none' = 'none';
    let actionDesc = 'الرسالة غير مرتبطة بالإغلاق؛ سيبقى الطلب نشطاً في الرادار لمنع الحذف الخاطئ.';

    if (extracted.hasClosureIntent) {
      // Check if it's very short or ambiguous
      const isShortAmbiguous = (simText.trim() === 'تم' || simText.trim() === 'حصلت' || simText.trim() === '👍');
      if (isShortAmbiguous && ambiguousAction === 'flag') {
        verdict = 'suspicious';
        actionDesc = '⚠️ اشتباه بإغلاق الطلب: يظهر تنبيه أصفر بالرادار للمراجعة قبل الحذف.';
      } else {
        verdict = 'confirmed';
        actionDesc = '🗑️ إغلاق فوري: يُحذف الطلب فوراً من الرادار النشط مع حفظ سجله الدائم بالإحصائيات.';
      }
    }

    setSimResult({
      ...extracted,
      verdict,
      actionDesc,
    });

    if (extracted.hasClosureIntent && filter.soundEnabled) {
      playAlertTone('radar_beep', 70);
    }
  };

  const dictionary = getAggregatedClosureDictionary();

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all space-y-0">
      
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                صائد الكلمات والرموز للإغلاق التلقائي 🏷️
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
                {isEnabled ? 'الصائد مفعّل ⚡' : 'معطّل'}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
              يراقب رسائل واتساب اللاحقة («تم»، «حصلت»، «تم الحجز»، «شالوه»، والرموز) ويحذف الطلب المحجوز فوراً
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <span className="text-xs font-bold text-white ml-2">
              {isEnabled ? 'شغال تلقائياً' : 'متوقف'}
            </span>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => handleToggleAutoClose(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-full h-full rounded-full transition-colors ${isEnabled ? 'bg-white' : 'bg-white/30'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full shadow-xs transition duration-200 ease-in-out ${
                  isEnabled ? '-translate-x-5 bg-indigo-700' : 'translate-x-0 bg-white'
                }`} />
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* 1. Ambiguous Responses Protection Card */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>حماية من الحذف الخاطئ (التعامل مع الردود القصيرة كـ «تم» بدون اقتباس):</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
              ذكاء اصطناعي آمن
            </span>
          </div>

          <p className="text-[11px] text-amber-900/80 leading-relaxed">
            إذا كتب شخص بالقروب كلمة قصيرة مثل «تم» دون ذكر المنطقة أو اسم صاحب الإعلان، حدد تصرف النظام:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
              ambiguousAction === 'flag'
                ? 'bg-white border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-white/60 border-amber-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="closureAmbiguousAction"
                checked={ambiguousAction === 'flag'}
                onChange={() => handleToggleAmbiguous('flag')}
                className="mt-0.5 text-amber-600"
              />
              <div className="text-xs">
                <span className="font-black text-slate-900 block">⚠️ شارة اشتباه صفراء (موصى به)</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-relaxed">
                  يبقى الطلب متاحاً مع تنبيهك بأنه قد يكون محجوزاً دون حذفه تلقائياً بالخطأ.
                </span>
              </div>
            </label>

            <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
              ambiguousAction === 'ignore'
                ? 'bg-white border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                : 'bg-white/60 border-amber-200 hover:bg-white'
            }`}>
              <input
                type="radio"
                name="closureAmbiguousAction"
                checked={ambiguousAction === 'ignore'}
                onChange={() => handleToggleAmbiguous('ignore')}
                className="mt-0.5 text-blue-600"
              />
              <div className="text-xs">
                <span className="font-black text-slate-900 block">↻ تجاهل وإبقاء الطلب نشطاً</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-relaxed">
                  لا يُحذف الطلب إلا إذا كان التأكيد صريحاً من المعلن نفسه أو باقتباس مباشر.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Add New Custom Word / Phrase / Emoji Form */}
        <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>إضافة كلمة أو رمز جديد إلى صائد الإغلاق:</span>
            </h4>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>استعادة الافتراضي</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={newWordInput}
              onChange={(e) => setNewWordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNewWord()}
              placeholder="اكتب كلمة أو عبارة عامية أو رمز (مثال: شالوه، انحجز، تم الاتفاق...)"
              className="w-full sm:flex-1 px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />

            <select
              value={newWordCategory}
              onChange={(e) => setNewWordCategory(e.target.value as ClosureCategory)}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-bold text-slate-800"
            >
              <option value="taken">🟢 تأكيد أخذ وحجز الطلب</option>
              <option value="completion">🔵 اكتمال أو إلغاء الطلب</option>
              <option value="gratitude">🟣 شكر وتأكيد الإنجاز</option>
              <option value="emoji">🟡 رمز تعبيري / ملصق</option>
            </select>

            <button
              type="button"
              onClick={handleAddNewWord}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة للصائد</span>
            </button>
          </div>

          <p className="text-[11px] leading-5 text-slate-600 mt-2">
            تُزامَن الكلمات والرموز مع خادم Orderi حسب حسابك. لا يُرفع نص رسالة واتساب الأصلي. الملصق الذي يظهر كـ «Sticker/ملصق» لا يثبت الإغلاق وحده؛ يجب ربطه بالمعلن والطلب النشط.
          </p>

          {/* Quick Emoji Buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-bold">رموز سريعة:</span>
            {['👍', '✅', '👌', '🤝', '🎯', '🙏', '📦', '✔️'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  setNewWordInput(em);
                  setNewWordCategory('emoji');
                }}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 text-xs flex items-center justify-center transition-all shadow-2xs"
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Monitored Words & Expressions Display */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>الكلمات والرموز المراقبة حالياً بالقروبات ({dictionary.takenKeywords.length + dictionary.completionKeywords.length + dictionary.gratitudeKeywords.length + dictionary.emojis.length}):</span>
            </h4>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('taken')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeTab === 'taken' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'}`}
              >
                تأكيد الحجز ({dictionary.takenKeywords.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completion')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeTab === 'completion' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800'}`}
              >
                اكتمال المشوار ({dictionary.completionKeywords.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gratitude')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeTab === 'gratitude' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800'}`}
              >
                شكر ({dictionary.gratitudeKeywords.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('emoji')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeTab === 'emoji' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'}`}
              >
                رموز ({dictionary.emojis.length})
              </button>
            </div>
          </div>

          {/* Chips Grid */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
            {/* Taken keywords */}
            {(activeTab === 'all' || activeTab === 'taken') && dictionary.takenKeywords.map((kw, i) => (
              <span key={`taken-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200 shadow-2xs">
                <span>{kw}</span>
              </span>
            ))}

            {/* Completion keywords */}
            {(activeTab === 'all' || activeTab === 'completion') && dictionary.completionKeywords.map((kw, i) => (
              <span key={`comp-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 shadow-2xs">
                <span>{kw}</span>
              </span>
            ))}

            {/* Gratitude keywords */}
            {(activeTab === 'all' || activeTab === 'gratitude') && dictionary.gratitudeKeywords.map((kw, i) => (
              <span key={`grat-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 text-xs font-bold border border-purple-200 shadow-2xs">
                <span>{kw}</span>
              </span>
            ))}

            {/* Emojis */}
            {(activeTab === 'all' || activeTab === 'emoji') && dictionary.emojis.map((em, i) => (
              <span key={`em-${i}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white text-base border border-slate-200 shadow-2xs">
                {em}
              </span>
            ))}
          </div>
        </div>

        {/* 4. Live Simulator (مختبر الفحص المباشر) */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-right font-black text-xs sm:text-sm text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>مختبر فحص ومحاكاة صائد الكلمات والرموز (Live Simulator) 🧪</span>
            </div>
            {showSimulator ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showSimulator && (
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3">
              <p className="text-xs text-slate-600">
                اكتب أي رد وارد في القروب لفحص قدرة الصائد على التقاط كلمات الإغلاق وتحديد إجراء الرادار:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="مثال: خلاص حصلت مندوب شكراً، أو تم"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                />
                <button
                  type="button"
                  onClick={handleRunSimulator}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1 shrink-0 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>فحص العبارة</span>
                </button>
              </div>

              {simResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                  simResult.verdict === 'confirmed'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : simResult.verdict === 'suspicious'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1.5">
                      {simResult.verdict === 'confirmed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {simResult.verdict === 'suspicious' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      <span>{simResult.actionDesc}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                    {simResult.matchedWords.length > 0 && (
                      <span className="font-bold">
                        الكلمات المصطادة: <strong className="text-indigo-700">{simResult.matchedWords.join('، ')}</strong>
                      </span>
                    )}
                    {simResult.matchedEmojis.length > 0 && (
                      <span className="font-bold">
                        الرموز المصطادة: <strong className="text-amber-700">{simResult.matchedEmojis.join(' ')}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
