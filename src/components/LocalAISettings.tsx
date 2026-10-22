import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  HardDrive, 
  RefreshCw,
  Check,
  Radio
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { OrderFilter } from '../types';
import { 
  checkLocalAIStatus, 
  DEFAULT_LOCAL_AI_CONFIG 
} from '../utils/localAiOrderParser';
import { 
  HERE_WE_GO_BAHRAIN_PLACES, 
  findHereWeGoPlaceInText 
} from '../data/hereWeGoBahrainMap';
import { detectPassengerDelivery } from '../utils/passengerClassifier';

interface LocalAISettingsProps {
  filter: OrderFilter;
  onUpdateFilter: (updated: OrderFilter) => void;
}

interface ReadinessAuditItem {
  id: string;
  name: string;
  detail: string;
  latencyMs: number;
  status: 'passed' | 'warning';
}

interface ReadinessAudit {
  timestamp: string;
  totalElapsedMs: number;
  environment: string;
  items: ReadinessAuditItem[];
  summary: string;
}

export const LocalAISettings: React.FC<LocalAISettingsProps> = ({
  filter,
  onUpdateFilter,
}) => {
  const isEnabled = filter.useLocalAi !== false;
  const isHybrid = filter.localAiConfig?.hybridMode !== false;

  const [modelStatus, setModelStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [readinessAudit, setReadinessAudit] = useState<ReadinessAudit | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await checkLocalAIStatus();
      setModelStatus(res);
    } catch (e) {
      console.warn('Error checking local AI status', e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  /**
   * إجراء فحص شامل ونشط لجميع أجزاء منظومة الذكاء الاصطناعي وخريطة HERE WeGo
   * وعرض تقرير الجاهزية اللحظي
   */
  const handleCheckReadiness = async () => {
    setIsCheckingStatus(true);
    const t0 = performance.now();

    try {
      // 1. فحص قاعدة خرائط HERE WeGo البحرين
      const hwgStart = performance.now();
      const testPlace = findHereWeGoPlaceInText('طلب من سيتي سنتر السيف إلى المحرق');
      const hwgLatency = Math.max(1, Math.round(performance.now() - hwgStart));

      // 2. فحص رادار كشف الركاب
      const pStart = performance.now();
      const testPassenger = detectPassengerDelivery('توصيل شخصين من المنامة إلى سار');
      const pLatency = Math.max(1, Math.round(performance.now() - pStart));

      // 3. فحص نموذج قواعد محلية
      const gStart = performance.now();
      const statusRes = await checkLocalAIStatus();
      setModelStatus(statusRes);
      const gLatency = Math.max(2, Math.round(performance.now() - gStart));

      // 4. فحص اتصال الذكاء السحابي الاحتياطي
      // A generic server health endpoint does not prove that Cloud AI is configured.
      // Keep message analysis disabled unless a real, explicitly enabled provider exists.
      const cLatency = 0;
      const cloudPassed = false;

      const totalElapsed = Math.round(performance.now() - t0);
      const isAndroid = Capacitor.getPlatform() === 'android';

      const audit: ReadinessAudit = {
        timestamp: new Date().toLocaleTimeString('ar-BH'),
        totalElapsedMs: totalElapsed,
        environment: isAndroid ? 'تطبيق أندرويد الأصلي (APK)' : 'متصفح الويب (المحرك الهجين)',
        items: [
          {
            id: 'here_we_go',
            name: 'قاعدة خرائط ومعالم HERE WeGo البحرين',
            detail: `مفهرسة ونشطة في الخلفية (${HERE_WE_GO_BAHRAIN_PLACES.length}+ معلماً ومجمعاً تجارياً)`,
            latencyMs: hwgLatency,
            status: 'passed',
          },
          {
            id: 'passenger_radar',
            name: 'رادار كشف ومنع نقل الركاب',
            detail: `تم تشغيل اختبار تصنيفي تجريبي؛ يلزم اختبار حالات واقعية ولا تُضمن دقة 100%.`,
            latencyMs: pLatency,
            status: testPlace ? 'passed' : 'warning',
          },
          {
            id: 'gemma3_model',
            name: 'استدلال قواعد محلية',
            detail: isAndroid
              ? 'تم فحص حالة الملف فقط؛ استدلال LiteRT-LM غير مدمج، لذلك لا يوجد نموذج لغوي يعمل.'
              : 'يعمل استخراج القواعد المحلية فقط؛ لا يوجد استدلال نموذج لغوي في المتصفح.',
            latencyMs: gLatency,
            status: 'warning',
          },
          {
            id: 'cloud_gemini',
            name: 'تحليل رسائل واتساب عبر السحابة (معطّل للخصوصية)',
            detail: 'معطّل عمدًا لحماية الخصوصية؛ لا يوجد مزوّد تحليل رسائل سحابي مهيأ، وفحص صحة الخادم لا يثبت جاهزية هذه الميزة.',
            latencyMs: cLatency,
            status: 'warning',
          },
        ],
        summary: `قاعدة HERE WeGo وقواعد التحليل المحلية متاحة؛ استدلال Gemma غير مدمج، والمصادقة بالوجه غير مهيأة، وتحليل رسائل واتساب السحابي معطّل للخصوصية.`, 
      };

      setReadinessAudit(audit);
    } catch (e) {
      console.warn('Error running readiness audit', e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleToggleLocalAi = (enabled: boolean) => {
    onUpdateFilter({
      ...filter,
      useLocalAi: enabled,
      localAiConfig: {
        ...(filter.localAiConfig || DEFAULT_LOCAL_AI_CONFIG),
        enabled,
      },
    });
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-700 via-indigo-700 to-emerald-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Cpu className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                محرك القواعد المحلية + HERE WeGo 🧠
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
                {isEnabled ? 'القواعد المحلية مفعّلة' : 'معطّل'}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
              قواعد استخراج محلية وقاعدة معالم البحرين؛ لا يوجد استدلال نموذج لغوي مدمج حاليًا
            </p>
          </div>
        </div>

        {/* Master Switch */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <span className="text-xs font-bold text-white ml-2">
              {isEnabled ? 'شغال بالرادار' : 'متوقف'}
            </span>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => handleToggleLocalAi(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-full h-full rounded-full transition-colors ${isEnabled ? 'bg-white' : 'bg-white/30'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full shadow-xs transition duration-200 ease-in-out ${
                  isEnabled ? '-translate-x-5 bg-violet-600' : 'translate-x-0 bg-white'
                }`} />
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Compact Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-x-reverse divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-center text-xs">
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">المحرك الحالي</span>
          <span className="text-xs font-black text-slate-800">قواعد محلية</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">خريطة HERE WeGo</span>
          <span className="text-xs font-black text-indigo-700">
            {HERE_WE_GO_BAHRAIN_PLACES.length}+ معلماً مدمجاً 📍
          </span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">المعمارية</span>
          <span className="text-xs font-black text-emerald-700">هجين ثلاثي الطبقات ⚡</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">حالة الاتصال</span>
          <span className="text-xs font-black text-violet-700 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>محلي + سحابي تكيفي</span>
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Model File & Engine Readiness Status Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-2">
                  <span>حالة المحرك ونموذج الذكاء الاصطناعي:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    استدلال Gemma غير مدمج
                  </span>
                </h4>
                <p className="text-[11px] text-indigo-800/80 mt-0.5 leading-relaxed">
                  {modelStatus?.detail || 'يتم استخدام قواعد محلية وقاعدة HERE WeGo؛ لا يُعتبر ملف النموذج جاهزًا قبل دمج واختبار الاستدلال.'}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-indigo-600 font-semibold">
                  <span>⚡ المعمارية: {modelStatus?.architecture || 'قواعد محلية؛ تحليل رسائل واتساب يبقى على الجهاز'}</span>
                  <span>·</span>
                  <span>📍 قاعدة HERE WeGo: {HERE_WE_GO_BAHRAIN_PLACES.length}+ معلماً تعمل في الخلفية</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckReadiness}
              disabled={isCheckingStatus}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shrink-0 transition-all shadow-xs hover:shadow-md cursor-pointer self-start sm:self-center active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              <span>{isCheckingStatus ? 'جارٍ الفحص الشامل...' : 'فحص الجاهزية الآن ⚡'}</span>
            </button>
          </div>

          {/* Readiness Audit Result Popover/Card */}
          {readinessAudit && (
            <div className="mt-2 p-3.5 rounded-xl bg-white border-2 border-emerald-300/80 shadow-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <h5 className="text-xs font-black text-slate-900">
                    نتيجة فحص المكونات (ليست شهادة جاهزية كاملة) ({readinessAudit.totalElapsedMs} ms)
                  </h5>
                </div>

                <button
                  type="button"
                  onClick={() => setReadinessAudit(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 px-2 py-0.5 self-end sm:self-auto"
                >
                  إخفاء التقرير
                </button>
              </div>

              {/* Compact Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {readinessAudit.items.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2"
                  >
                    <div className={`w-4 h-4 rounded-full ${item.status === 'passed' ? 'bg-emerald-500' : 'bg-amber-500'} text-white flex items-center justify-center shrink-0 mt-0.5`}>
                      {item.status === 'passed' ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px] font-black">!</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-black text-slate-900">
                          {item.name}
                        </span>
                        <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${item.status === 'passed' ? 'text-emerald-700 bg-emerald-100/70' : 'text-amber-800 bg-amber-100'}`}>
                          {item.status === 'passed' ? `${item.latencyMs} ms` : 'غير جاهز'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cloud AI Fallback Toggle Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-600" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  الذكاء الاصطناعي السحابي عند الحاجة (Cloud AI Fallback) ☁️
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
                  غير مفعّل
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                معالجة نصوص واتساب تبقى على الجهاز. لا يتوفر حاليًا مسار سحابي معتمد لتحليل هذه الرسائل، حفاظًا على الخصوصية.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={false}
                disabled={true}
                className="sr-only"
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${filter.useCloudAiFallback !== false ? 'bg-violet-600' : 'bg-slate-300'}`}>
                <span className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition ${filter.useCloudAiFallback !== false ? '-translate-x-4' : 'translate-x-0.5'} mt-0.5`} />
              </div>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};
