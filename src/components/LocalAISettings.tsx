import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  ShieldCheck, 
  HardDrive, 
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OrderFilter } from '../types';
import { 
  checkLocalAIStatus, 
  DEFAULT_LOCAL_AI_CONFIG 
} from '../utils/localAiOrderParser';

interface LocalAISettingsProps {
  filter: OrderFilter;
  onUpdateFilter: (updated: OrderFilter) => void;
}

export const LocalAISettings: React.FC<LocalAISettingsProps> = ({
  filter,
  onUpdateFilter,
}) => {
  const isEnabled = filter.useLocalAi !== false;
  const isHybrid = filter.localAiConfig?.hybridMode !== false;

  const [modelStatus, setModelStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const fetchStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await checkLocalAIStatus();
      setModelStatus(res);
    } catch (e) {
      console.warn('Error checking local AI status', e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

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

  const handleToggleHybridMode = (hybrid: boolean) => {
    onUpdateFilter({
      ...filter,
      localAiConfig: {
        ...(filter.localAiConfig || DEFAULT_LOCAL_AI_CONFIG),
        hybridMode: hybrid,
      },
    });
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Cpu className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                الذكاء الاصطناعي المحلي على الهاتف (Gemma 3 1B) 🧠
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
                {isEnabled ? 'مفعّل محلياً ⚡' : 'معطّل'}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
              تحليل وفهم نصوص طلبات واتساب داخل الهاتف بدون إنترنت عبر نموذج LiteRT (584 MB)
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

      {/* Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-x-reverse divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-center text-xs">
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">النموذج المحلي</span>
          <span className="text-xs font-black text-slate-800">Gemma 3 1B LiteRT</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">حجم الملف بالذاكرة</span>
          <span className="text-xs font-black text-indigo-700">584 MB (int4)</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">وضع التشغيل</span>
          <span className="text-xs font-black text-emerald-700">{isHybrid ? 'هجين فوري ⚡' : 'ذكاء اصطناعي فقط'}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">حالة الاتصال</span>
          <span className="text-xs font-black text-violet-700 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>محلي 100% بدون نت</span>
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Model File & Status Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-2">
                  <span>حالة نموذج الذكاء الاصطناعي على الجهاز:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    gemma3-1b-it-int4.litertlm
                  </span>
                </h4>
                <p className="text-[11px] text-indigo-800/80 mt-0.5 leading-relaxed">
                  {modelStatus?.detail || 'تم تهيئة المحرك الهجين التكيفي للعمل مع نظام أندرويد لضمان استخراج فوري للطلبات.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchStatus}
              disabled={isCheckingStatus}
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              <span>فحص النموذج</span>
            </button>
          </div>
        </div>

        {/* Cloud AI Fallback Toggle Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-600" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  الذكاء الاصطناعي السحابي عند الحاجة (Cloud AI Fallback) ☁️
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
                  Gemini Flash 3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                استدعاء ذكاء اصطناعي خارجي سحابي فائق الدقة تلقائياً عند غموض النص، أو نقص بيانات الاستلام والتسليم، أو عند الاشتباه بنقل ركاب.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={filter.useCloudAiFallback !== false}
                onChange={(e) => {
                  onUpdateFilter({
                    ...filter,
                    useCloudAiFallback: e.target.checked,
                    localAiConfig: {
                      ...(filter.localAiConfig || DEFAULT_LOCAL_AI_CONFIG),
                      cloudFallbackEnabled: e.target.checked,
                    },
                  });
                }}
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
