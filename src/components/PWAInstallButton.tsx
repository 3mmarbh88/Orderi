import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Sparkles, 
  Check, 
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isInIframe } from '../utils/backgroundManager';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'hero' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const inIframe = isInIframe();

  // If already running in standalone mode (installed)
  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>مثبت على هاتفك ✅</span>
      </div>
    );
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
        return;
      }
    }
    // If prompt is not directly available (e.g. iframe, iOS, or pending prompt in Chrome)
    setShowGuide(true);
  };

  const handleOpenStandalone = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <>
      {/* Universal Install Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        title="تثبيت Ordari كتطبيق مستقل على شاشة هاتفك (PWA)"
        className={`flex items-center justify-center gap-2 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 ${
          variant === 'hero'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 shadow-emerald-500/20'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2'
        } ${className}`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>تثبيت التطبيق على الهاتف 📲</span>
      </button>

      {/* Success Feedback Toast Banner */}
      {installSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4" />
          <span>تم تثبيت تطبيق Ordari بنجاح على شاشة هاتفك! 🎉</span>
        </div>
      )}

      {/* Universal PWA Install Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-base">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3>تثبيت تطبيق Ordari على شاشة الهاتف</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Iframe Alert (AI Studio preview constraint) */}
            {inIframe && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>أنت تتصفح حالياً عبر نافذة المعاينة (iFrame)</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                  متصفحات الهواتف (Chrome و Safari) تمنع تثبيت تطبيقات PWA وطلب إذن الإشعارات من داخل الإطارات المضمنة. افتح التطبيق في متصفحك مباشرة لتثبيته بنقرة واحدة:
                </p>
                <button
                  type="button"
                  onClick={handleOpenStandalone}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح في متصفح مستقل كامل الآن 🚀</span>
                </button>
              </div>
            )}

            {/* Direct Instant Prompt if available */}
            {isInstallable && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <p className="font-bold text-emerald-950">
                  متصفحك يدعم التثبيت المباشر بنقرة زر واحدة!
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const success = await install();
                    if (success) {
                      setInstallSuccess(true);
                      setTimeout(() => setInstallSuccess(false), 4000);
                    }
                    setShowGuide(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>اضغط هنا لتثبيت التطبيق فوراً ⚡</span>
                </button>
              </div>
            )}

            {/* Step-by-Step for Android / Chrome */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>طريقة التثبيت على أجهزة Android (متصفح Chrome):</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <p className="text-slate-700">اضغط على <strong>زر القائمة (⋮)</strong> في أعلى شريط المتصفح.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <p className="text-slate-700">اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <p className="text-emerald-950">ستظهر أيقونة Ordari على شاشة هاتفك وتفتح بملء الشاشة بدون متصفح وبأعلى سرعة!</p>
                </div>
              </div>
            </div>

            {/* Step-by-Step for iOS / iPhone */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-600" />
                <span>طريقة التثبيت على أجهزة iPhone (متصفح Safari):</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <p className="text-slate-700">اضغط على أيقونة <strong>المشاركة (Share <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />)</strong> في أسفل متصفح Safari.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <p className="text-slate-700">اختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />)</strong>.</p>
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
