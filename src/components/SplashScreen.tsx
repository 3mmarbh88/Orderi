import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  ShieldCheck, 
  Zap, 
  Loader2
} from 'lucide-react';
import { CaptainUser } from '../types';

interface SplashScreenProps {
  onComplete: () => void;
  onOpenFaceLogin?: () => void;
  onOpenFingerprintLogin?: () => void;
  currentUser?: CaptainUser | null;
}

export function SplashScreen({
  onComplete,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('تهيئة نظام رادار طلبات البحرين 🇧🇭...');

  useEffect(() => {
    // Stage simulation reflecting real Orderi modules loading
    const stages = [
      { at: 15, text: 'تهيئة خريطة مناطق ومعالم البحرين...' },
      { at: 40, text: 'تشغيل محرك الكشف اللحظي وتصفية الطلبات ⚡' },
      { at: 65, text: 'تهيئة مستشعرات بصمة الوجه والإصبع بالكاميرا 🔐' },
      { at: 85, text: 'مزامنة مجموعات وقنوات سحب واتساب 📲' },
      { at: 100, text: 'اكتمل التحميل! جاري فتح شاشة تسجيل الدخول... 🚀' },
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 5;
        const matchingStage = stages.find((s) => next >= s.at && prev < s.at);
        if (matchingStage) {
          setStageText(matchingStage.text);
        }
        if (next >= 100) {
          clearInterval(timer);
          // بعد اكتمال اللودنق مباشرة يفتح صفحة تسجيل الدخول تلقائياً بدون أي أزرار
          setTimeout(() => {
            onComplete();
          }, 350);
          return 100;
        }
        return next;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between items-center px-6 py-8 sm:py-12 select-none overflow-hidden"
      dir="rtl"
    >
      {/* Top Bar Branding */}
      <div className="w-full max-w-sm flex items-center justify-between pt-safe">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black tracking-wide text-emerald-400">
            رادار الأوردرات المباشر
          </span>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-black text-slate-200">
          البحرين 🇧🇭
        </div>
      </div>

      {/* Main Radar Brand & Logo Center */}
      <div className="w-full max-w-sm flex flex-col items-center my-auto py-6 space-y-6">
        {/* Animated Radar Ripples & Logo */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          {/* Wave ring 1 */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-25" />
          {/* Wave ring 2 */}
          <div className="absolute -inset-4 rounded-full border border-emerald-500/20 animate-pulse" />
          {/* Wave ring 3 */}
          <div className="absolute -inset-8 rounded-full border border-emerald-500/10" />

          {/* Radar Sweep Needle */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div 
              className="w-full h-full origin-center animate-spin" 
              style={{ 
                animationDuration: '3.5s',
                background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.25) 0deg, transparent 60deg, transparent 360deg)'
              }} 
            />
          </div>

          {/* Central Logo Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-1.5 shadow-2xl shadow-emerald-500/30 border-2 border-emerald-400/80 z-10 flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Orderi Logo"
              className="w-full h-full object-cover rounded-[18px]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.radar-fallback-icon');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="radar-fallback-icon hidden items-center justify-center w-full h-full bg-emerald-600 rounded-[18px] text-white">
              <Radar className="w-14 h-14 animate-pulse" />
            </div>
          </div>
        </div>

        {/* App Title & Slogan */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            <span>نظام الذكاء الاصطناعي لكباتن التوصيل</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Ordari • رادار الأوردرات
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xs leading-relaxed">
            مراقبة وتصفية طلبات الواتساب ومطابقتها اللحظية مع موقعك وشروطك في البحرين 🇧🇭
          </p>
        </div>

        {/* Progress Bar & Stage Description (Loading Indicator only - No Buttons) */}
        <div className="w-full space-y-2.5 pt-2">
          <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-150 shadow-[0_0_12px_#10b981]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري التحميل...</span>
            </div>
            <span className="text-emerald-400 font-bold">{progress}%</span>
          </div>

          <p className="text-xs sm:text-sm font-bold text-emerald-300 min-h-[24px] text-center">
            {stageText}
          </p>
        </div>
      </div>

      {/* Clean Bottom Footer (No buttons whatsoever) */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center pb-safe pt-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>إصدار 2026 المطور • مخصص لكباتن التوصيل بمملكة البحرين</span>
        </div>
      </div>
    </div>
  );
}
