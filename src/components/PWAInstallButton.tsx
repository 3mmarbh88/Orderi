import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'hero' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed in standalone mode
  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>مثبت كتطبيق</span>
      </div>
    );
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  return (
    <>
      {/* Chromium / Android / Desktop Install Flow */}
      {isInstallable && (
        <button
          onClick={handleInstall}
          title="تثبيت Ordari كتطبيق مستقل على هاتفك أو حاسوبك"
          className={`flex items-center gap-2 rounded-xl font-bold text-xs transition-all shadow-xs ${
            variant === 'hero'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-2'
          } ${className}`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>تثبيت التطبيق 📲</span>
        </button>
      )}

      {/* iOS Safari Guide Flow */}
      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSGuide(true)}
          title="كيفية تثبيت التطبيق على أجهزة iPhone و iPad"
          className={`flex items-center gap-1.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs px-3 py-2 transition-all ${className}`}
        >
          <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
          <span>تثبيت على iPhone</span>
        </button>
      )}

      {/* iOS Safari Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 font-black text-base">
                <Smartphone className="w-5 h-5" />
                <h3>تثبيت Ordari على iPhone</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              لتشغيل الرادار كتطبيق أصلي على شاشة هاتفك مع إشعارات أسرع وتجربة ملء الشاشة:
            </p>

            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900">اضغط على زر المشاركة (Share)</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">في الشريط السفلي لمتصفح Safari <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /></p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900">اختر "إضافة إلى الشاشة الرئيسية"</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">"Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700" /></p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <p className="font-bold text-emerald-950">اضغط "إضافة" (Add)</p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">سيظهر أيقونة Ordari مباشرة على شاشتك الرئيسية</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}
    </>
  );
};
