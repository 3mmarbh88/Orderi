import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  ExternalLink, 
  Check, 
  Sparkles, 
  MessageSquare,
  Navigation,
  Clock
} from 'lucide-react';
import { ParsedOrder } from '../types';

interface WhatsAppHeadsUpBannerProps {
  order: ParsedOrder | null;
  onClose: () => void;
  onAccept: (order: ParsedOrder) => void;
  driverAreaName?: string;
  customTemplate?: string;
}

export const WhatsAppHeadsUpBanner: React.FC<WhatsAppHeadsUpBannerProps> = ({
  order,
  onClose,
  onAccept,
  driverAreaName = 'البحرين',
  customTemplate,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss countdown timer (7 seconds)
  useEffect(() => {
    if (!order) return;
    setProgress(100);

    const duration = 7000;
    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= decrement) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - decrement;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [order, isPaused, onClose]);

  if (!order) return null;

  const isVip = order.contactStatus === 'vip';
  const cleanPhone = order.senderPhone ? order.senderPhone.replace(/[^\d+]/g, '') : '';
  const courierMessage = customTemplate || `#مندوب_توصيل انا في (${driverAreaName})`;
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(courierMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(courierMessage)}`;

  const cleanText = order.rawText
    ? order.rawText.trim().replace(/\s+/g, ' ')
    : `مطلوب توصيل من ${order.from} إلى ${order.to}`;
  const previewText = cleanText.length > 95 ? cleanText.substring(0, 95) + '...' : cleanText;

  return (
    <AnimatePresence>
      <motion.div
        key={order.id}
        initial={{ y: -90, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -70, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md pointer-events-auto"
        dir="rtl"
      >
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 text-right">
          
          {/* Top WhatsApp App Header */}
          <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-slate-100/90 bg-slate-50/70">
            <div className="flex items-center gap-2">
              {/* WhatsApp Green Icon */}
              <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="/whatsapp-icon.svg" 
                  alt="WhatsApp" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to green circle
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-black text-emerald-700 tracking-tight">WhatsApp</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-700 truncate max-w-[180px] sm:max-w-[220px]">
                  {order.groupName || (isVip ? 'متجر VIP معتمد ⭐' : 'قروب مناديب البحرين')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                الآن
              </span>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
                title="إغلاق التنبيه"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Message Content */}
          <div className="p-3.5 sm:p-4 space-y-2.5">
            {/* Sender and Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isVip 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {order.senderName ? order.senderName.charAt(0) : '🚗'}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {order.senderName || order.senderPhone || 'طلب توصيل فوري'}
                    </h4>
                    {isVip && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-black shrink-0">
                        ⭐ VIP
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {order.senderPhone || 'واتساب'}
                  </p>
                </div>
              </div>

              {/* Price Tag */}
              <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-sm shrink-0">
                {order.price.toFixed(1)} <span className="text-[10px] font-normal text-emerald-700">د.ب</span>
              </div>
            </div>

            {/* Route Locations */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/70 text-xs font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{order.from}</span>
              <span className="text-slate-400 font-normal">←</span>
              <span className="truncate text-indigo-700">{order.to}</span>
              {order.match.distanceKm && (
                <span className="mr-auto text-[10px] text-slate-500 font-normal shrink-0">
                  ({order.match.distanceKm} كم)
                </span>
              )}
            </div>

            {/* Original Text Quote like WhatsApp chat bubble */}
            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/80 text-xs text-slate-700 leading-relaxed font-sans relative">
              <span className="text-emerald-500 font-bold ml-1">💬</span>
              <span>"{previewText}"</span>
            </div>

            {/* Quick Action Buttons (Reply in WhatsApp / Accept in Radar) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClose()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs shadow-xs transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                <span>رد في واتساب 💬</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  onAccept(order);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>حجز في الرادار ✅</span>
              </button>
            </div>

          </div>

          {/* Countdown Progress Bar at Bottom */}
          <div className="w-full bg-slate-100 h-1 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
