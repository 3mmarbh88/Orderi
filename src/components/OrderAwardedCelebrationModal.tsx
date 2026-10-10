import React from 'react';
import { 
  PartyPopper, 
  CheckCircle2, 
  MessageCircle, 
  Phone, 
  X, 
  MapPin, 
  Navigation, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ParsedOrder } from '../types';

interface OrderAwardedCelebrationModalProps {
  awardedData: {
    order?: ParsedOrder;
    orderId: string;
    advertiserName: string;
    advertiserPhone: string;
    replyText: string;
    from?: string;
    to?: string;
    price?: number;
  } | null;
  onClose: () => void;
}

export const OrderAwardedCelebrationModal: React.FC<OrderAwardedCelebrationModalProps> = ({
  awardedData,
  onClose,
}) => {
  if (!awardedData) return null;

  const cleanPhone = (awardedData.advertiserPhone || '').replace(/[^\d+]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('السلام عليكم، استلمت تأكيدك. جاهز للاستلام والتوصيل الآن، أرجو تزويدي بباقي التفاصيل 🚗')}`
    : 'https://api.whatsapp.com';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-400 overflow-hidden relative space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative celebration background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
            <PartyPopper className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
              <span>مبروك! حصلت على الأوردر 🎯</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              المعلن وافق وعطاك الطلب! 🎉
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              قام المعلن بالرد عليك والموافقة، قم بالتواصل بالواتساب مع المعلن لتلقي التفاصيل والتنسيق.
            </p>
          </div>
        </div>

        {/* Advertiser Response Quote Card */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-emerald-950 font-bold">
            <span>رد المعلن في الخاص:</span>
            <span className="text-slate-600 font-normal">المعلن: <strong>{awardedData.advertiserName || 'التاجر'}</strong></span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-emerald-200 text-slate-900 font-black text-sm text-center shadow-2xs">
            «{awardedData.replyText}»
          </div>

          {cleanPhone && (
            <div className="flex items-center justify-between text-[11px] text-emerald-900 pt-0.5">
              <span>رقم المعلن:</span>
              <span dir="ltr" className="font-mono font-bold text-blue-700">+{cleanPhone}</span>
            </div>
          )}
        </div>

        {/* Order Route Snippet if available */}
        {(awardedData.from || awardedData.to) && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-800 truncate">
                {awardedData.from || 'البحرين'} ← {awardedData.to || 'البحرين'}
              </span>
            </div>
            {awardedData.price && awardedData.price > 0 ? (
              <strong className="text-emerald-700 font-black shrink-0">
                {awardedData.price.toFixed(1)} د.ب
              </strong>
            ) : null}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span>تواصل بالواتساب لتلقي التفاصيل 💬</span>
          </a>

          {cleanPhone && (
            <a
              href={`tel:+${cleanPhone}`}
              onClick={onClose}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>اتصال هاتفي مباشر بالمعلن</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors"
          >
            إغلاق ومتابعة الرادار
          </button>
        </div>

      </div>
    </div>
  );
};
