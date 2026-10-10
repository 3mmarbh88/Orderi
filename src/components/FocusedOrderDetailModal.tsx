import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  MessageCircle, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Copy, 
  Check, 
  User, 
  Users, 
  Phone, 
  RefreshCw,
  Layers,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react';
import { ParsedOrder } from '../types';
import { sendNativeQuickReply } from '../native/whatsappListener';

interface FocusedOrderDetailModalProps {
  order: ParsedOrder | null;
  customTemplate?: string;
  driverArea?: string;
  onClose: () => void;
  onAccept: (order: ParsedOrder) => void;
  onIgnore: (orderId: string) => void;
}

export const FocusedOrderDetailModal: React.FC<FocusedOrderDetailModalProps> = ({
  order,
  customTemplate,
  driverArea = 'البحرين',
  onClose,
  onAccept,
  onIgnore,
}) => {
  if (!order) return null;

  const [copied, setCopied] = useState(false);
  const [isAutoReplying, setIsAutoReplying] = useState(false);

  const isClosed = order.status === 'closed_taken' || order.status === 'suspicious_closed';
  const isPassenger = order.passengerDetection?.level === 'confirmed_passenger' || !!order.passengerCount;
  const count = order.passengerCount || order.passengerDetection?.passengerCount;

  // Clean advertiser phone
  const cleanPhone = order.senderPhone ? order.senderPhone.replace(/[^\d+]/g, '') : '';
  const phoneFromText = (order.rawText && /(?:973)?[\s-]*(3\d{7}|6\d{7}|17\d{6})/g.exec(order.rawText)?.[0]?.replace(/\D/g, '')) || '';
  const effectivePhone = (cleanPhone && cleanPhone !== '97300000000' && cleanPhone.length >= 8)
    ? cleanPhone
    : phoneFromText ? (phoneFromText.startsWith('973') ? phoneFromText : '973' + phoneFromText)
    : cleanPhone;

  // Quick private reply template to advertiser
  const baseCourierText = customTemplate && customTemplate.trim()
    ? customTemplate.replace(/{area}/g, driverArea)
    : `#مندوب_توصيل انا في (${driverArea})`;

  const privateAdvertiserMessage = `السلام عليكم، بخصوص طلبك (${order.from} ← ${order.to}):\n${baseCourierText} ومستعد للاستلام والتوصيل فوراً 🚗`;

  const waUrl = effectivePhone && effectivePhone !== '97300000000'
    ? `https://wa.me/${effectivePhone}?text=${encodeURIComponent(privateAdvertiserMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(privateAdvertiserMessage)}`;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptOrder = async () => {
    setIsAutoReplying(true);
    try {
      // 1. قبول الطلب وإضافته لجدول الأرباح فوراً
      onAccept(order);

      // 2. إرسال الرد النيتيف في واتساب تلقائياً في الخاص مع المعلن
      try {
        await sendNativeQuickReply({
          phone: effectivePhone || order.senderPhone,
          message: privateAdvertiserMessage,
        });
      } catch (nativeErr) {
        console.warn('[Orderi Focused] Native quick reply:', nativeErr);
      }

      // 3. إرسال الرد في واتساب عبر السيرفر في الخاص مباشرة لصاحب الإعلان
      await fetch('/api/whatsapp/quick-accept-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          phone: effectivePhone || order.senderPhone,
          targetType: 'private_direct',
          groupName: order.groupName,
          senderName: order.senderName,
          replyText: privateAdvertiserMessage,
          price: order.price,
          from: order.from,
          to: order.to,
        }),
      });
    } catch (err) {
      console.warn('[Orderi Focused] Auto reply error:', err);
    } finally {
      setIsAutoReplying(false);
      onClose();
    }
  };

  const handleIgnoreOrder = () => {
    onIgnore(order.id);
    onClose();
  };

  const priceText = (!order.price || order.price <= 0 || order.isPriceUnspecified)
    ? 'غير محدد في الإعلان (تجاهل السعر • بالاتفاق 🤝)'
    : `${order.price.toFixed(1)} د.ب`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 mb-1" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isPassenger 
                ? 'bg-red-100 text-red-600' 
                : isClosed 
                ? 'bg-slate-200 text-slate-700' 
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              {isPassenger ? <AlertTriangle className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isPassenger ? 'إعلان نقل ركاب ⚠️' : 'تفاصيل الأوردر الوارد 📦'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {order.groupName || 'واتساب'} • {order.senderName || 'معلن'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* WhatsApp Closed State Notification (اذا كان قد تم في الواتساب) */}
          {isClosed && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 font-black text-amber-900 text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                <span>🏷️ هذا الطلب تم في الواتساب (مغلق)</span>
              </div>
              <p className="text-xs text-amber-900 font-bold leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200">
                تم حجز وتوصيل هذا الطلب بواسطة مندوب آخر في القروب:
                <span className="block mt-1 font-mono text-amber-800 text-xs">
                  «{order.closureEvidence?.replyText || 'تم'}» ({order.closureEvidence?.senderName || 'عضو بالقروب'})
                </span>
              </p>
              <div className="text-[11px] text-amber-800">
                الطلب لم يعد متاحاً للتوصيل لتجنب التضارب بين المناديب.
              </div>
            </div>
          )}

          {/* Red Warning Banner if Passenger Transport is Detected */}
          {isPassenger && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white space-y-1.5 shadow-md shadow-rose-900/20">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
                <span>تحذير: توصيل أشخاص ممنوع 🚫</span>
              </div>
              <p className="text-xs text-rose-100 font-medium leading-relaxed">
                تم رصد إعلان نقل ركاب وأشخاص {count ? `(${count} ركاب)` : ''}. نظام الرادار مخصص لتوصيل البضائع والطلبات التجارية لحماية المندوب.
              </p>
              {count && count > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full text-xs font-black text-amber-200 border border-white/20 mt-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>عدد الركاب المذكورين: {count} {count === 1 ? 'شخص' : count === 2 ? 'شخصين' : 'أشخاص'}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Route & Price Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>منطقة الاستلام:</span>
                </span>
                <strong className="text-sm sm:text-base font-black text-slate-900 block truncate">
                  {order.from || 'البحرين'}
                </strong>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الوجهة:</span>
                </span>
                <strong className="text-sm sm:text-base font-black text-slate-900 block truncate">
                  {order.to || 'حسب طلب الزبون 📍'}
                </strong>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">💰 قيمة الطلب / الأجرة:</span>
              <strong className={`text-sm sm:text-base font-black ${
                (!order.price || order.price <= 0 || order.isPriceUnspecified)
                  ? 'text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200'
              }`}>
                {priceText}
              </strong>
            </div>

            {order.scheduledTime && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-black text-indigo-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>توقيت التوصيل المطلوب في الإعلان:</span>
                </span>
                <span className="font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  {order.scheduledTime} ⏰
                </span>
              </div>
            )}

            {count && count > 0 && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">👥 عدد الأشخاص / الركاب:</span>
                <span className="font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                  {count} {count === 1 ? 'شخص واحد' : count === 2 ? 'شخصين' : 'أشخاص'}
                </span>
              </div>
            )}
          </div>

          {/* Original WhatsApp Advertisement Card (الإعلان الأصلي) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>نص الإعلان الأصلي الوارد من واتساب:</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(order.rawText)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الإعلان'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
              {order.rawText}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-1">
              <span>المعلن: <strong className="text-slate-800">{order.senderName || 'غير معروف'}</strong></span>
              {effectivePhone && (
                <span dir="ltr" className="font-mono text-blue-700 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-500" />
                  +{effectivePhone}
                </span>
              )}
              <span>القروب: <strong className="text-slate-800">{order.groupName || 'واتساب'}</strong></span>
            </div>
          </div>

          {/* Target Private Reply Notice */}
          {!isClosed && (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-black text-emerald-900 block">
                  🔒 خصوصية تامة: الرد يُرسل في الخاص للمعلن مباشرة
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  عند النقر على قبول، سيتم إرسال ردك تلقائياً في المحادثة الخاصة مع صاحب الإعلان لتأكيد الاستلام دون نشر أي شيء في قروب الواتساب.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 space-y-2">
          {isClosed ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleIgnoreOrder}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>مسح الطلب من الرادار ✕</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 min-h-[48px] rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Primary Accept & Auto-reply in Private Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptOrder}
                  disabled={isAutoReplying}
                  className={`flex-1 min-h-[50px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                    isPassenger 
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 shadow-rose-900/30' 
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-700/25'
                  }`}
                >
                  {isAutoReplying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>جاري إرسال الرد في الخاص للمعلن...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                      <div className="flex flex-col items-center leading-tight">
                        <span className="flex items-center gap-1">
                          <span>قبول والرد في الخاص للمعلن</span>
                          <span className="text-[11px] font-bold text-amber-200">👤⚡</span>
                        </span>
                        <span className="text-[10px] font-normal text-emerald-100">
                          (إرسال بالخاص مباشرة وليس بالقروب 🔒)
                        </span>
                      </div>
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Actions: Ignore/Delete and Private Chat */}
              <div className="flex items-center gap-2">
                {/* Ignore / Delete Order Button */}
                <button
                  type="button"
                  onClick={handleIgnoreOrder}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="تجاهل ومسح الطلب وتحديده كمقروء"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>تجاهل ومسح الطلب 🗑️</span>
                </button>

                {/* Direct WhatsApp Private Chat */}
                {effectivePhone && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>فتح خاص واتساب 👤</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 min-h-[44px] rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  رجوع
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
