import { useState } from 'react';
import { 
  Check, 
  X, 
  MapPin, 
  ArrowLeft, 
  MessageCircle, 
  Clock, 
  Coins, 
  Users, 
  Copy, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  Reply,
  Trash2,
  Star,
  ShieldAlert,
  Zap,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { ParsedOrder } from '../types';
import { MatcherLocation } from '../utils/matcher';
import { AIMatchModal } from './AIMatchModal';

interface OrderCardProps {
  key?: string;
  order: ParsedOrder;
  driverLocation: MatcherLocation | null;
  customTemplate: string;
  onAccept: (order: ParsedOrder) => void;
  onIgnore: (orderId: string) => void;
  onToggleContact?: (order: ParsedOrder, type: 'vip' | 'blacklist') => void;
  onEvaluateAi?: (order: ParsedOrder) => void;
}

export function OrderCard({
  order,
  driverLocation,
  customTemplate,
  onAccept,
  onIgnore,
  onToggleContact,
  onEvaluateAi,
}: OrderCardProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const { match } = order;
  const isVip = match.score >= 90;
  const isGood = match.score >= 80;
  const isMyBroadcast = order.type === 'إعلاني الخاص';

  // Standardized response message
  const myArea = driverLocation?.areaName || 'البحرين';
  const courierMessage = `#مندوب_توصيل انا في (${myArea})`;
  
  // Replay (تم) message for user's own published broadcast orders
  const replayDoneMessage = `(تم) ✅ تم العثور على مندوب

> ${order.rawText.trim().replace(/\n/g, '\n> ')}

شكراً لكم جميعاً!`;

  const fullWhatsAppMessage = isMyBroadcast ? replayDoneMessage : courierMessage;

  const cleanPhone = order.senderPhone.replace(/[^\d+]/g, '');
  const waUrl = isMyBroadcast
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(fullWhatsAppMessage)}`
    : cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullWhatsAppMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(fullWhatsAppMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullWhatsAppMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmAccept = () => {
    onAccept(order);
    setShowAcceptDialog(false);
    if (waUrl) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const timeAgo = (date: Date) => {
    const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diffSec < 45) return 'الآن';
    if (diffSec < 120) return 'منذ دقيقة';
    if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
    return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
  };

  return (
    <>
      <div 
        className={`relative overflow-hidden rounded-2xl bg-white border transition-all duration-200 hover:shadow-md ${
          order.contactStatus === 'vip'
            ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
            : order.contactStatus === 'blacklist'
            ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20 shadow-xs'
            : isVip 
            ? 'border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-xs' 
            : isGood
            ? 'border-blue-300/80 shadow-xs'
            : 'border-slate-200 shadow-2xs'
        }`}
      >
        {/* VIP Store Banner */}
        {order.contactStatus === 'vip' && (
          <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-amber-950 px-4 py-2 flex items-center justify-between text-xs font-black shadow-xs">
            <div className="flex items-center gap-1.5 truncate">
              <Star className="w-4 h-4 fill-amber-900 text-amber-950 shrink-0" />
              <span className="truncate">⭐ متجر موثوق معتمد (VIP) — {order.matchedContact?.name || order.senderName}</span>
              {order.matchedContact?.notes && (
                <span className="font-semibold text-amber-900/80 text-[11px] truncate hidden sm:inline">
                  • {order.matchedContact.notes}
                </span>
              )}
            </div>
            <span className="text-[10px] bg-amber-950/10 px-2 py-0.5 rounded-full shrink-0 font-bold">
              دفع فوري سريع
            </span>
          </div>
        )}

        {/* Blacklist Warning Banner */}
        {order.contactStatus === 'blacklist' && (
          <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 flex items-center justify-between text-xs font-black shadow-xs">
            <div className="flex items-center gap-1.5 truncate">
              <ShieldAlert className="w-4 h-4 shrink-0 text-white" />
              <span className="truncate">🚫 تحذير: معلن في القائمة السوداء ({order.matchedContact?.name || 'غير موثوق'})</span>
              {order.matchedContact?.notes && (
                <span className="font-semibold text-rose-100 text-[11px] truncate hidden sm:inline">
                  • {order.matchedContact.notes}
                </span>
              )}
            </div>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full shrink-0 font-bold">
              إلغاء متكرر / غير جاد
            </span>
          </div>
        )}

        {/* Top Header Row with Score & Price */}
        <div 
          className={`p-4 sm:p-5 flex items-center justify-between border-b ${
            order.contactStatus === 'vip'
              ? 'bg-amber-50/50 border-amber-100'
              : order.contactStatus === 'blacklist'
              ? 'bg-rose-50/50 border-rose-100'
              : isVip 
              ? 'bg-emerald-50/40 border-emerald-100' 
              : isGood
              ? 'bg-blue-50/30 border-blue-100'
              : 'bg-slate-50/50 border-slate-100'
          }`}
        >
          {/* Match Score & Status */}
          <div className="flex items-center gap-3">
            <div 
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 shadow-2xs ${
                isVip
                  ? 'bg-emerald-600 text-white'
                  : isGood
                  ? 'bg-blue-600 text-white'
                  : match.score >= 60
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-600 text-white'
              }`}
            >
              <span className="text-base leading-none font-bold">{match.score}%</span>
              <span className="text-[9px] font-medium opacity-90">مطابقة</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black ${
                  isVip ? 'text-emerald-950' : isGood ? 'text-blue-950' : 'text-slate-800'
                }`}>
                  {match.statusLabel}
                </span>
                {isVip && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300/60">
                    <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>VIP</span>
                  </span>
                )}
                {isMyBroadcast && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                    <span>إعلاني الخاص</span>
                  </span>
                )}
                {order.source === 'webhook_auto' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                    <span>سحب تلقائي 🟢</span>
                  </span>
                )}
                {order.isDirectPrivate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                    <span>خاص دايركت 👤</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{timeAgo(order.receivedAt)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-[190px]">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{order.groupName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Price Badge */}
          <div className="shrink-0 text-left">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-left">
              <span className="text-[10px] text-emerald-800 font-bold block text-center">أجرة التوصيل</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-black text-emerald-700 tracking-tight">{order.price.toFixed(1)}</span>
                <span className="text-[11px] font-bold text-emerald-600">د.ب</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Details Box */}
        <div className="p-4 sm:p-5 space-y-4">
          
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              
              {/* Pickup (From) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 ring-3 ring-blue-100 inline-block shrink-0" />
                  <span>الاستلام</span>
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                  {order.from || 'غير محدد'}
                </div>
                {match.distanceKm !== null && (
                  <span className="text-[11px] font-medium text-slate-500 block">
                    يبعد {match.distanceKm.toFixed(1)} كم
                  </span>
                )}
              </div>

              {/* Connecting Indicator */}
              <div className="flex flex-col items-center justify-center shrink-0 px-2">
                <div className="w-7 h-7 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-400">
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-600 rotate-180" />
                </div>
                {match.pickupToDeliveryDistanceKm !== undefined && (
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                    ~{match.pickupToDeliveryDistanceKm.toFixed(0)} كم
                  </span>
                )}
              </div>

              {/* Destination (To) */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-rose-600 mb-0.5">
                  <span>التسليم</span>
                  <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                  {order.to || 'غير محدد'}
                </div>
                {order.ratePerKm && (
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    {order.ratePerKm.toFixed(2)} د.ب/كم
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Sleek Criteria Match Status Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${
              match.startMatched ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {match.startMatched ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              <span>الانطلاق: {order.from}</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${
              match.destinationMatched ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {match.destinationMatched ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              <span>الوجهة: {order.to}</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${
              match.priceMatched ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {match.priceMatched ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              <span>السعر ({order.price} د.ب)</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${
              match.distanceMatched ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {match.distanceMatched ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
              <span>المسافة ({match.distanceKm ? `${match.distanceKm.toFixed(1)} كم` : 'جاهز'})</span>
            </span>
          </div>

          {/* AI Match with Captain's Conditions (Gemini AI Feature) */}
          <div className="pt-0.5">
            {order.aiAnalysis ? (
              <div 
                onClick={() => setShowAiModal(true)}
                className="w-full p-3 rounded-2xl bg-gradient-to-l from-indigo-50/90 via-blue-50/80 to-emerald-50/80 border border-blue-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">مطابقة شروطي بالـ AI:</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white text-blue-800 text-[11px] font-black border border-blue-200 shadow-2xs">
                        {order.aiAnalysis.score}% {order.aiAnalysis.verdictLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-blue-700 group-hover:underline shrink-0 flex items-center gap-1">
                    <span>تفاصيل التحليل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </span>
                </div>

                {order.aiAnalysis.captainAdvice && (
                  <div className="mt-2 text-[11px] font-bold text-slate-700 bg-white/80 p-2 rounded-xl border border-blue-100 flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{order.aiAnalysis.captainAdvice}</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEvaluateAi?.(order);
                }}
                disabled={order.isAnalyzingAi}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/90 text-blue-950 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 shadow-2xs hover:shadow-xs active:scale-[0.99]"
              >
                <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${order.isAnalyzingAi ? 'animate-spin' : 'fill-blue-500'}`} />
                <span>
                  {order.isAnalyzingAi ? 'جاري فحص رسالة المعلن ومطابقتها مع شروطك...' : '✨ فحص مطابقة الإعلان لشروطي بالذكاء الاصطناعي'}
                </span>
              </button>
            )}
          </div>

          {/* Original WhatsApp Message Accordion */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
            <button 
              onClick={() => setShowFullText(!showFullText)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>نص رسالة الواتساب الأصلية</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                <span>{showFullText ? 'إخفاء' : 'عرض'}</span>
                {showFullText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
            </button>

            {showFullText && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/70">
                <p className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200/60">
                  {order.rawText}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                  <span>المعلن: <strong>{order.senderName || 'غير معروف'}</strong></span>
                  {order.senderPhone && (
                    <span dir="ltr" className="font-mono text-blue-600 font-bold">
                      +{order.senderPhone}
                    </span>
                  )}
                </div>

                {onToggleContact && order.senderPhone && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">تصنيف صاحب الإعلان:</span>
                    <div className="flex items-center gap-1.5">
                      {order.contactStatus !== 'vip' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleContact(order, 'vip');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition-colors cursor-pointer"
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>⭐ تمييز كـ VIP</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleContact(order, 'vip');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300 transition-colors cursor-pointer"
                        >
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                          <span>متجر موثوق VIP ✓</span>
                        </button>
                      )}

                      {order.contactStatus !== 'blacklist' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleContact(order, 'blacklist');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>🚫 حظر (قائمة سوداء)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleContact(order, 'blacklist');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 text-[10px] font-black border border-rose-300 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>في القائمة السوداء ✗</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: Responsive Mobile Stack / Desktop Row */}
          <div className="space-y-2 pt-1">
            {/* Primary Action Button (Accept & Reply on WhatsApp) */}
            <button
              onClick={() => setShowAcceptDialog(true)}
              className={`w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl text-white font-black text-sm sm:text-base shadow-md transition-all active:scale-[0.98] ${
                isMyBroadcast 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              }`}
            >
              {isMyBroadcast ? (
                <>
                  <Reply className="w-4 h-4" />
                  <span>حصلت مندوب (رد: تم بالقروبات) 🎯</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>قبول الطلب والتواصل بالواتساب</span>
                </>
              )}
            </button>

            {/* Secondary Touch Actions Row */}
            <div className="flex items-center gap-2">
              {/* Quick Copy Response */}
              <button
                onClick={handleCopy}
                title={isMyBroadcast ? 'نسخ صيغة رد (تم)' : 'نسخ صيغة الرد السريع'}
                className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرد'}</span>
              </button>

              {/* Direct Phone Call if available */}
              {order.senderPhone && (
                <a
                  href={`tel:+${order.senderPhone}`}
                  title="اتصال هاتفي مباشر بالمعلن"
                  className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>اتصال</span>
                </a>
              )}

              {/* Remove / Ignore Order Button */}
              <button
                onClick={() => onIgnore(order.id)}
                title="إزالة الطلب من القائمة"
                aria-label="إزالة الطلب"
                className="min-h-[44px] w-12 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Accept Order Modal Confirmation */}
      {showAcceptDialog && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAcceptDialog(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-2" />
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                {isMyBroadcast ? <Reply className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {isMyBroadcast ? 'نشر رد (تم) في نفس القروبات' : 'تأكيد قبول الطلب'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isMyBroadcast ? 'سيتم فتح WhatsApp لنشر رد (تم) في القروبات وإغلاق الطلب' : 'سيتم فتح WhatsApp وإرسال الرد السريع للمعلن'}
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-500 block">
                {isMyBroadcast ? 'صيغة رد (تم) باقتباس الإعلان:' : 'معاينة الرسالة المتكاملة المرسلة للواتساب:'}
              </span>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-40 sm:max-h-48 overflow-y-auto">
                {fullWhatsAppMessage}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 flex items-center justify-between">
              <span>{isMyBroadcast ? 'قيمة الطلب المنشور:' : 'أجرة التوصيل المسجلة:'}</span>
              <strong className="text-base font-black text-blue-700">{order.price.toFixed(1)} د.ب</strong>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAcceptDialog(false)}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 active:scale-98 transition-all"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmAccept}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
              >
                <span>{isMyBroadcast ? 'نشر رد (تم) 🚀' : 'متابعة إلى WhatsApp'}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI Match Analysis Details Modal */}
      {showAiModal && order.aiAnalysis && (
        <AIMatchModal
          order={order}
          analysis={order.aiAnalysis}
          onClose={() => setShowAiModal(false)}
          onAccept={(acceptedOrder) => {
            setShowAiModal(false);
            onAccept(acceptedOrder);
          }}
        />
      )}
    </>
  );
}
