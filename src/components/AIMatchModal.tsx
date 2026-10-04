import React from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lightbulb, 
  MessageSquare, 
  Package, 
  Clock, 
  CreditCard, 
  Phone, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { ParsedOrder, AIMatchAnalysis } from '../types';

interface AIMatchModalProps {
  order: ParsedOrder;
  analysis: AIMatchAnalysis;
  onClose: () => void;
  onAccept: (order: ParsedOrder) => void;
}

export function AIMatchModal({
  order,
  analysis,
  onClose,
  onAccept,
}: AIMatchModalProps) {
  const getScoreTheme = (score: number) => {
    if (score >= 90) {
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        cardBg: 'bg-emerald-50/60',
        ring: 'ring-emerald-500/20',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      };
    }
    if (score >= 75) {
      return {
        bg: 'bg-blue-600',
        text: 'text-blue-700',
        border: 'border-blue-200',
        cardBg: 'bg-blue-50/60',
        ring: 'ring-blue-500/20',
        badge: 'bg-blue-100 text-blue-900 border-blue-300',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        border: 'border-amber-200',
        cardBg: 'bg-amber-50/60',
        ring: 'ring-amber-500/20',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }
    return {
      bg: 'bg-rose-500',
      text: 'text-rose-700',
      border: 'border-rose-200',
      cardBg: 'bg-rose-50/60',
      ring: 'ring-rose-500/20',
      badge: 'bg-rose-100 text-rose-900 border-rose-300',
    };
  };

  const theme = getScoreTheme(analysis.score);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-0 sm:my-auto max-h-[92vh] flex flex-col pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-400/80 rounded-full mx-auto mt-2 -mb-1" />

        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md shadow-amber-400/20 font-black shrink-0">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">تحليل المطابقة بالذكاء الاصطناعي</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-blue-200 text-[10px] font-bold border border-white/10">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                فحص رسالة المعلن ومقارنتها بنطاقك وسعرك ومناطقك المفضلة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Verdict & Score Banner */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${theme.border} ${theme.cardBg} flex flex-col sm:flex-row items-center gap-4 sm:gap-6`}>
            {/* Score Ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-md border-4 border-slate-100 flex flex-col items-center justify-center">
                <span className={`text-2xl sm:text-3xl font-black ${theme.text} tracking-tight`}>
                  {analysis.score}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 -mt-1">درجة المطابقة</span>
              </div>
            </div>

            {/* Verdict text */}
            <div className="flex-1 text-center sm:text-right space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black border ${theme.badge} shadow-2xs`}>
                  {analysis.verdictLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed pt-1">
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Tactical Advice Card */}
          {analysis.captainAdvice && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-400 shrink-0" />
                <span>النصيحة التكتيكية من الذكاء الاصطناعي:</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-amber-950 leading-relaxed pr-6">
                {analysis.captainAdvice}
              </p>
            </div>
          )}

          {/* Original WhatsApp Message Preview */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>رسالة المعلن الأصلية من واتساب:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {order.groupName}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
              {order.rawText}
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>المعلن: <strong>{order.senderName || 'غير معروف'}</strong></span>
              {order.senderPhone && (
                <span dir="ltr" className="font-mono text-blue-600 font-bold">
                  +{order.senderPhone}
                </span>
              )}
            </div>
          </div>

          {/* Extracted Details Pill Grid */}
          {analysis.detectedDetails && (
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 block">
                🔍 تفاصيل استخلصها الذكاء الاصطناعي من لهجة الإعلان:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <Package className="w-3 h-3 text-blue-500" />
                    <span>نوع الشحنة:</span>
                  </span>
                  <strong className="text-slate-900 mt-0.5 block truncate">
                    {analysis.detectedDetails.itemType || 'شحنة اعتيادية'}
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>التوقيت والاستعجال:</span>
                  </span>
                  <strong className="text-slate-900 mt-0.5 block truncate">
                    {analysis.detectedDetails.urgency || 'اعتيادي'}
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-emerald-500" />
                    <span>طريقة الدفع:</span>
                  </span>
                  <strong className="text-slate-900 mt-0.5 block truncate">
                    {analysis.detectedDetails.paymentMethod || 'غير محدد في الرسالة'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Matched & Unmatched Conditions Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Matched */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>شروطك المتوافقة ({analysis.matchedConditions?.length || 0}):</span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                {analysis.matchedConditions && analysis.matchedConditions.length > 0 ? (
                  analysis.matchedConditions.map((cond, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{cond}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">لا توجد عناصر مطابقة صريحة</li>
                )}
              </ul>
            </div>

            {/* Unmatched */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>شروط غير متطابقة / ملاحظات ({analysis.unmatchedConditions?.length || 0}):</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                {analysis.unmatchedConditions && analysis.unmatchedConditions.length > 0 ? (
                  analysis.unmatchedConditions.map((cond, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>{cond}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-emerald-700 font-bold">كل الشروط متطابقة تماماً ✓</li>
                )}
              </ul>
            </div>
          </div>

          {/* Red Flags / Warnings Banner */}
          {analysis.redFlags && analysis.redFlags.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>محاذير وتنبيهات تم رصدها في رسالة المعلن:</span>
              </div>
              <ul className="space-y-1 text-xs text-rose-900 font-semibold pr-5">
                {analysis.redFlags.map((flag, idx) => (
                  <li key={idx} className="list-disc leading-snug">{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-98 transition-all"
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={() => {
              onAccept(order);
              onClose();
            }}
            className="flex-1 min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
          >
            <span>قبول الطلب والتواصل فوراً</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
