import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  Layers,
  RefreshCw,
  Lock,
  AlertCircle,
  CheckCircle2,
  MoveHorizontal
} from 'lucide-react';
import { ParsedOrder } from '../types';
import { MatcherLocation } from '../utils/matcher';
import { AIMatchModal } from './AIMatchModal';
import { findLandmarkByName } from '../data/bahrainLandmarks';
import { sendNativeQuickReply } from '../native/whatsappListener';
import { detectPassengerDelivery } from '../utils/passengerClassifier';

interface OrderCardProps {
  key?: string;
  order: ParsedOrder;
  driverLocation: MatcherLocation | null;
  customTemplate: string;
  onAccept: (order: ParsedOrder) => void;
  onIgnore: (orderId: string) => void;
  onToggleContact?: (order: ParsedOrder, type: 'vip' | 'blacklist') => void;
  onEvaluateAi?: (order: ParsedOrder) => void;
  onRestoreOrder?: (orderId: string) => void;
  onConfirmClosure?: (orderId: string) => void;
  onDismissClosureSuspicion?: (orderId: string) => void;
}

export function OrderCard({
  order,
  driverLocation,
  customTemplate,
  onAccept,
  onIgnore,
  onToggleContact,
  onEvaluateAi,
  onRestoreOrder,
  onConfirmClosure,
  onDismissClosureSuspicion,
}: OrderCardProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showReviewConfirmModal, setShowReviewConfirmModal] = useState(false);

  // Swipe-to-delete state & handlers (سحب لليمين أو لليسار يمسح الأوردر)
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const hasTriggeredHapticRef = useRef(false);

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExiting) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = null;
    hasTriggeredHapticRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isExiting) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaY) > 6 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isHorizontalSwipeRef.current = false; // vertical page scroll
        return;
      }
      if (Math.abs(deltaX) > 6 && Math.abs(deltaX) >= Math.abs(deltaY)) {
        isHorizontalSwipeRef.current = true; // horizontal card swipe
      }
    }

    if (isHorizontalSwipeRef.current) {
      setDragOffset(deltaX);

      if (Math.abs(deltaX) >= SWIPE_THRESHOLD && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(25);
        }
      } else if (Math.abs(deltaX) < SWIPE_THRESHOLD && hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
      setIsExiting(true);
      const exitDirection = dragOffset > 0 ? 600 : -600;
      setDragOffset(exitDirection);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 35]);
      }
      setTimeout(() => {
        onIgnore(order.id);
      }, 220);
    } else {
      setDragOffset(0);
    }
    isHorizontalSwipeRef.current = null;
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExiting) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isHorizontalSwipeRef.current = null;
    hasTriggeredHapticRef.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isExiting) return;
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaY) > 6 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isHorizontalSwipeRef.current = false;
        return;
      }
      if (Math.abs(deltaX) > 6) {
        isHorizontalSwipeRef.current = true;
      }
    }

    if (isHorizontalSwipeRef.current) {
      setDragOffset(deltaX);
      if (Math.abs(deltaX) >= SWIPE_THRESHOLD && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
      setIsExiting(true);
      const exitDirection = dragOffset > 0 ? 600 : -600;
      setDragOffset(exitDirection);
      setTimeout(() => {
        onIgnore(order.id);
      }, 220);
    } else {
      setDragOffset(0);
    }
    isHorizontalSwipeRef.current = null;
  };

  // Passenger transport detection status (كاشف نقل الركاب والأشخاص)
  const passenger = order.passengerDetection || detectPassengerDelivery(order.rawText);
  const isConfirmedPassenger = passenger.level === 'confirmed_passenger';
  const isSuspiciousPassenger = passenger.level === 'suspicious_passenger';

  const { match } = order;
  const isVip = match.score >= 90;
  const isGood = match.score >= 80;
  const isMyBroadcast = order.type === 'إعلاني الخاص';

  const fromLandmark = findLandmarkByName(order.from);
  const toLandmark = findLandmarkByName(order.to);

  // Standardized response message for Private Direct chat with advertiser
  const myArea = driverLocation?.areaName || 'البحرين';
  const baseCourierText = customTemplate && customTemplate.trim()
    ? customTemplate.replace(/{area}/g, myArea)
    : `#مندوب_توصيل انا في (${myArea})`;
  
  // Replay (تم) message for user's own published broadcast orders
  const replayDoneMessage = `(تم) ✅ تم العثور على مندوب

> ${order.rawText.trim().replace(/\n/g, '\n> ')}

شكراً لكم جميعاً!`;

  // Private direct response to the advertiser:
  // الرد يُرسل في الخاص للمعلن مباشرة مع الإشارة للطلب المنشور بالقروب
  const privateAdvertiserMessage = `السلام عليكم، بخصوص طلبك (${order.from} ← ${order.to}):\n${baseCourierText} ومستعد للاستلام والتوصيل فوراً 🚗`;

  const fullWhatsAppMessage = isMyBroadcast ? replayDoneMessage : privateAdvertiserMessage;

  // Extract phone number from sender or detected in message text
  const cleanPhone = order.senderPhone ? order.senderPhone.replace(/[^\d+]/g, '') : '';
  const phoneFromText = (order.rawText && /(?:973)?[\s-]*(3\d{7}|6\d{7}|17\d{6})/g.exec(order.rawText)?.[0]?.replace(/\D/g, '')) || '';
  const effectivePhone = (cleanPhone && cleanPhone !== '97300000000' && cleanPhone.length >= 8)
    ? cleanPhone
    : phoneFromText ? (phoneFromText.startsWith('973') ? phoneFromText : '973' + phoneFromText)
    : cleanPhone;

  // Direct private WhatsApp chat with advertiser
  const waUrl = isMyBroadcast
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(fullWhatsAppMessage)}`
    : effectivePhone && effectivePhone !== '97300000000'
    ? `https://wa.me/${effectivePhone}?text=${encodeURIComponent(fullWhatsAppMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(fullWhatsAppMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullWhatsAppMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isAutoReplying, setIsAutoReplying] = useState(false);

  const handleQuickAutoReply = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAutoReplying(true);

    try {
      // 1. قبول الطلب وإضافته لجدول الأرباح فوراً
      onAccept(order);
      setShowAcceptDialog(false);

      // 2. إرسال الرد النيتيف في واتساب تلقائياً في الخاص مع المعلن (وليس في القروب)
      try {
        await sendNativeQuickReply({
          phone: effectivePhone || order.senderPhone, // Send directly to the advertiser in private!
          message: fullWhatsAppMessage,
        });
      } catch (nativeErr) {
        console.warn('[Orderi Native Quick Reply]', nativeErr);
      }

      // 3. إرسال الرد في واتساب عبر السيرفر في الخاص مباشرة لصاحب الإعلان
      await fetch('/api/whatsapp/quick-accept-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          phone: effectivePhone || order.senderPhone,
          targetType: 'private_direct', // Private chat with the advertiser, NOT group!
          groupName: order.groupName,
          senderName: order.senderName,
          replyText: fullWhatsAppMessage,
          price: order.price,
          from: order.from,
          to: order.to,
        }),
      });
    } catch (err) {
      console.warn('[Orderi] Quick auto-reply error:', err);
    } finally {
      setIsAutoReplying(false);
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
      {/* Swipe to Delete Container */}
      <div 
        className={`relative overflow-hidden rounded-2xl transition-all duration-300 select-none ${
          isExiting ? 'max-h-0 opacity-0 mb-0 py-0 scale-95 overflow-hidden' : 'mb-0'
        }`}
      >
        {/* Background Reveal Layer during horizontal swipe */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 flex items-center justify-between px-6 rounded-2xl text-white font-bold pointer-events-none z-0"
          aria-hidden="true"
        >
          {/* Revealed when dragging right (dragOffset > 0) */}
          <div className={`flex items-center gap-2.5 transition-all duration-150 ${dragOffset > 20 ? 'opacity-100 scale-105' : 'opacity-30 scale-90'}`}>
            <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-black block">
                {Math.abs(dragOffset) >= SWIPE_THRESHOLD ? 'حرّر لمسح الطلب الآن 🗑️' : 'اسحب للمسح'}
              </span>
              <span className="text-[10px] text-white/90">يمسح الطلب ويحدده كمقروء ✓✓</span>
            </div>
          </div>

          {/* Revealed when dragging left (dragOffset < 0) */}
          <div className={`flex items-center gap-2.5 transition-all duration-150 ${dragOffset < -20 ? 'opacity-100 scale-105' : 'opacity-30 scale-90'}`}>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-black block">
                {Math.abs(dragOffset) >= SWIPE_THRESHOLD ? 'حرّر لمسح الطلب الآن 🗑️' : 'اسحب للمسح'}
              </span>
              <span className="text-[10px] text-white/90">يمسح الطلب ويحدده كمقروء ✓✓</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Foreground Interactive Order Card */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease',
            opacity: isExiting ? 0 : 1,
            touchAction: 'pan-y',
          }}
          className={`relative z-10 overflow-hidden rounded-2xl bg-white border transition-shadow duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${
            order.status === 'closed_taken'
              ? 'border-slate-300 bg-slate-50/50 opacity-95 shadow-2xs'
              : order.status === 'suspicious_closed'
              ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10 shadow-xs'
              : isConfirmedPassenger
              ? 'border-red-500 ring-2 ring-red-500/25 bg-red-50/10 shadow-sm'
              : isSuspiciousPassenger
              ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
              : order.contactStatus === 'vip'
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
        {/* Closed & Taken Order Banner */}
        {order.status === 'closed_taken' && (
          <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs font-black shadow-xs">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">🏷️ مغلق تلقائياً — تم أخذ الطلب في القروب («{order.closureEvidence?.replyText || 'تم'}»)</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0 font-bold">
              مكتمل ومحجوز
            </span>
          </div>
        )}

        {/* Suspicious Closed Banner */}
        {order.status === 'suspicious_closed' && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs font-black shadow-xs">
            <div className="flex items-center gap-2 truncate">
              <AlertCircle className="w-4 h-4 text-amber-200 shrink-0" />
              <span className="truncate font-black">⚠️ اشتباه حجز: ورد رد بالقروب («{order.closureEvidence?.replyText || 'تم'}»)</span>
            </div>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full shrink-0 font-bold">
              تحقق يدوي
            </span>
          </div>
        )}

        {/* Red Warning Banner: Passenger Delivery Forbidden */}
        {isConfirmedPassenger && (
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-black shadow-xs">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
              <span className="truncate text-xs sm:text-sm font-black tracking-wide">
                تحذير: توصيل أشخاص ممنوع 🚫
              </span>
            </div>
            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full shrink-0 font-bold border border-white/20">
              تحذير ركاب ⚠️ • القبول متاح
            </span>
          </div>
        )}

        {/* Amber Warning Banner: Suspicious Passenger Delivery */}
        {!isConfirmedPassenger && isSuspiciousPassenger && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-amber-950 px-4 py-2 flex items-center justify-between text-xs font-black shadow-xs">
            <div className="flex items-center gap-1.5 truncate">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-950" />
              <span className="truncate font-bold">⚠️ احتمال نقل أشخاص (مراجعة مطلوبة قبل القبول)</span>
            </div>
            <span className="text-[10px] bg-amber-950/20 px-2 py-0.5 rounded-full shrink-0 font-bold">
              مراجعة يدوية
            </span>
          </div>
        )}

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
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div 
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 shadow-2xs ${
                isVip
                  ? 'bg-emerald-600 text-white'
                  : isGood
                  ? 'bg-blue-600 text-white'
                  : match.score >= 60
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-600 text-white'
              }`}
            >
              <span className="text-sm sm:text-base leading-none font-bold">{match.score}%</span>
              <span className="text-[8px] sm:text-[9px] font-medium opacity-90">مطابقة</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={`text-xs sm:text-sm font-black truncate ${
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
                {order.crossPostedGroups && order.crossPostedGroups.length > 1 && (
                  <span 
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs"
                    title={`تم نشر هذا الطلب في ${order.crossPostedGroups.length} قروبات وتم دمجه لمنع التكرار`}
                  >
                    <Layers className="w-3 h-3 text-purple-700" />
                    <span>مكرر في {order.crossPostedGroups.length} قروبات (تم دمجه ✓)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{timeAgo(order.receivedAt)}</span>
                </span>
                <span>•</span>
                <span 
                  className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-[200px]" 
                  title={order.crossPostedGroups && order.crossPostedGroups.length > 1 ? order.crossPostedGroups.join(' • ') : order.groupName}
                >
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>
                    {order.crossPostedGroups && order.crossPostedGroups.length > 1
                      ? `${order.crossPostedGroups.length} قروبات: ${order.crossPostedGroups.join('، ')}`
                      : order.groupName}
                  </span>
                </span>
                <span>•</span>
                <span 
                  className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 px-1.5 py-0.5 rounded-md select-none transition-colors"
                  title="اسحب لليمين أو لليسار لمسح الطلب"
                >
                  <MoveHorizontal className="w-2.5 h-2.5 text-slate-400" />
                  <span>اسحب للمسح</span>
                </span>
              </div>
            </div>
          </div>

          {/* Price Badge */}
          <div className="shrink-0 text-left">
            {(!order.price || order.price <= 0 || order.isPriceUnspecified) ? (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-center shadow-2xs">
                <span className="text-[10px] text-amber-800 font-bold block text-center">أجرة التوصيل</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-xs sm:text-sm font-black text-amber-900 tracking-tight whitespace-nowrap">بالاتفاق 🤝</span>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-left shadow-2xs">
                <span className="text-[10px] text-emerald-800 font-bold block text-center">أجرة التوصيل</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-emerald-700 tracking-tight">{order.price.toFixed(1)}</span>
                  <span className="text-[11px] font-bold text-emerald-600">د.ب</span>
                </div>
              </div>
            )}
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
                  {fromLandmark && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 text-[10px] font-extrabold border border-blue-200">
                      🏬 {fromLandmark.parentAreaName}
                    </span>
                  )}
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 truncate flex items-center gap-1.5">
                  <span>{order.from || 'غير محدد'}</span>
                </div>
                {match.distanceKm !== null && (
                  <span className="text-[11px] font-medium text-slate-500 block">
                    يبعد {match.distanceKm.toFixed(1)} كم {fromLandmark ? `(${fromLandmark.parentAreaName})` : ''}
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
                  {toLandmark && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 text-[10px] font-extrabold border border-rose-200">
                      🏬 {toLandmark.parentAreaName}
                    </span>
                  )}
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

          {/* Multi-group deduplication notice banner */}
          {order.crossPostedGroups && order.crossPostedGroups.length > 1 && (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200/90 text-purple-950 flex items-start gap-2 text-xs">
              <Layers className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                <span className="font-black text-purple-900 block text-[11px]">
                  🛡️ تم منع التكرار: نُشر هذا الإعلان في {order.crossPostedGroups.length} قروبات واتساب وتم دمجه
                </span>
                <p className="text-[10px] text-purple-800 truncate">
                  القروبات: {order.crossPostedGroups.join(' • ')}
                </p>
              </div>
            </div>
          )}

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
            {/* Primary Action Button (Accept & Reply on WhatsApp Instantly Without Redirection) */}
            <div className="flex items-center gap-2">
              {order.status === 'closed_taken' ? (
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 min-h-[48px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>الطلب مغلق — تم أخذه في القروب 🏷️</span>
                  </div>
                  {onRestoreOrder && (
                    <button
                      type="button"
                      onClick={() => onRestoreOrder(order.id)}
                      className="min-h-[48px] px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                      title="استعادة هذا الطلب إلى الرادار المتاح إذا كان لا يزال متاحاً"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>إعادة للرادار</span>
                    </button>
                  )}
                </div>
              ) : order.status === 'suspicious_closed' ? (
                <div className="space-y-2 w-full">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate">رد محتمل بالقروب: «{order.closureEvidence?.replyText || 'تم'}» ({order.closureEvidence?.senderName || 'عضو'})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onConfirmClosure && (
                      <button
                        type="button"
                        onClick={() => onConfirmClosure(order.id)}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>تأكيد إغلاقه (تم أخذه) ✓</span>
                      </button>
                    )}
                    {onDismissClosureSuspicion && (
                      <button
                        type="button"
                        onClick={() => onDismissClosureSuspicion(order.id)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 transition-all cursor-pointer"
                      >
                        لا يزال متاحاً ↺
                      </button>
                    )}
                  </div>
                </div>
              ) : isConfirmedPassenger ? (
                <button
                  type="button"
                  onClick={handleQuickAutoReply}
                  disabled={isAutoReplying}
                  className="flex-1 min-h-[48px] flex items-center justify-center gap-2 py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 font-black text-xs sm:text-sm shadow-md shadow-rose-900/30 transition-all active:scale-[0.98] cursor-pointer"
                  title="تحذير: توصيل أشخاص ممنوع، انقر لقبول الطلب والرد بالواتساب"
                >
                  {isAutoReplying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>جاري الرد التلقائي بالواتساب...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>قبول الطلب ⚡ (تحذير: توصيل أشخاص ⚠️)</span>
                    </>
                  )}
                </button>
              ) : isSuspiciousPassenger ? (
                <button
                  type="button"
                  onClick={() => setShowReviewConfirmModal(true)}
                  className="flex-1 min-h-[48px] flex items-center justify-center gap-2 py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-950" />
                  <span>مراجعة وتأكيد (بضاعة وليست أشخاص) للقبول ⚠️</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickAutoReply}
                  disabled={isAutoReplying}
                  className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                    isMyBroadcast 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25' 
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
                  }`}
                >
                  {isAutoReplying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>جاري إرسال الرد في الخاص للمعلن...</span>
                    </>
                  ) : isMyBroadcast ? (
                    <>
                      <Reply className="w-4 h-4" />
                      <span>حصلت مندوب (رد: تم فوراً) 🎯</span>
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
              )}

              {/* View Message Template / Dialog */}
              <button
                type="button"
                onClick={() => setShowAcceptDialog(true)}
                title={isConfirmedPassenger ? "معاينة نص الإعلان وتفاصيل الحظر" : "معاينة نص الرسالة وخيارات القبول بالخاص"}
                className={`min-h-[48px] px-3 flex items-center justify-center rounded-xl sm:rounded-2xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
                  isConfirmedPassenger
                    ? 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                <MessageCircle className={`w-4 h-4 ${isConfirmedPassenger ? 'text-red-700' : 'text-emerald-700'}`} />
              </button>
            </div>

            {/* Secondary Touch Actions Row */}
            <div className="flex items-center gap-2">
              {/* Direct WhatsApp chat with advertiser in Private */}
              {effectivePhone && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="فتح المحادثة الخاصة في واتساب مباشرة مع صاحب الإعلان"
                  className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>خاص واتساب 👤</span>
                </a>
              )}

              {/* Quick Copy Response */}
              <button
                onClick={handleCopy}
                title={isMyBroadcast ? 'نسخ صيغة رد (تم)' : 'نسخ صيغة الرد الخاص'}
                className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرد'}</span>
              </button>

              {/* Direct Phone Call if available */}
              {effectivePhone && (
                <a
                  href={`tel:+${effectivePhone}`}
                  title="اتصال هاتفي مباشر بالمعلن"
                  className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>اتصال</span>
                </a>
              )}

              {/* Remove / Ignore Order Button & Mark as Read in WhatsApp */}
              <button
                type="button"
                onClick={() => onIgnore(order.id)}
                title="مسح الطلب من الرادار وتحديده كمقروء (تمت قراءتها ✓✓) في الواتساب"
                aria-label="مسح الطلب وتحديده كمقروء في الواتساب"
                className="min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] font-bold flex items-center gap-1">
                  <span>مسح</span>
                  <span className="text-emerald-600 font-black text-[10px]" title="تمت قراءتها في الواتساب">✓✓</span>
                </span>
              </button>
            </div>
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
                  {isMyBroadcast ? 'نشر رد (تم) في نفس القروبات' : 'قبول الطلب وإرسال الرد في الخاص 👤'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isMyBroadcast 
                    ? 'سيتم نشر رد (تم) فوراً في القروبات وإغلاق الطلب' 
                    : 'الرد يُرسل في المحادثة الخاصة مع صاحب الإعلان مباشرة (وليس في القروب) 🔒'}
                </p>
              </div>
            </div>

            {/* Target Destination Info Badge */}
            {!isMyBroadcast && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <span>وجهة الرد التلقائي:</span>
                  </span>
                  <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-xs">
                    خاص مباشر (دايركت) 👤
                  </span>
                </div>
                <div className="text-[11px] text-emerald-900 space-y-1 pt-0.5 leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">المعلن (المستلم):</span>
                    <strong className="font-bold text-slate-900">{order.senderName || 'صاحب الإعلان'} ({effectivePhone || order.senderPhone})</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">قروب الإعلان:</span>
                    <strong className="text-slate-800">{order.groupName || 'قروب واتساب'}</strong>
                  </div>
                  <div className="mt-1 text-emerald-900 font-bold bg-white/80 p-2 rounded-xl border border-emerald-200/70">
                    🔒 خصوصية تامة: لن يُنشر أي رد داخل قروب الواتساب، بل سيتم فتح المحادثة الخاصة مع المعلن مباشرة للتنسيق والاتفاق.
                  </div>
                </div>
              </div>
            )}

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-500 block">
                {isMyBroadcast ? 'صيغة رد (تم) باقتباس الإعلان:' : 'معاينة نص الرسالة المرسلة في الخاص للمعلن:'}
              </span>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-40 sm:max-h-48 overflow-y-auto">
                {fullWhatsAppMessage}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 flex items-center justify-between">
              <span>{isMyBroadcast ? 'قيمة الطلب المنشور:' : 'أجرة التوصيل المسجلة:'}</span>
              <strong className="text-sm font-black text-blue-700">
                {(!order.price || order.price <= 0 || order.isPriceUnspecified)
                  ? 'غير محددة في الإعلان (تجاهل السعر • بالاتفاق 🤝)'
                  : `${order.price.toFixed(1)} د.ب`}
              </strong>
            </div>

            {isConfirmedPassenger && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-950 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-black text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>تحذير: توصيل أشخاص ممنوع 🚫</span>
                </div>
                <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                  تحذير ركاب • القبول متاح للكابتن
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAcceptDialog(false)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-98 transition-all order-2 sm:order-1"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={handleQuickAutoReply}
                disabled={isAutoReplying}
                className={`w-full sm:flex-1 min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-black text-xs sm:text-sm shadow-md active:scale-98 transition-all cursor-pointer order-1 sm:order-2 ${
                  isConfirmedPassenger
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-rose-900/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                }`}
              >
                {isAutoReplying ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : isConfirmedPassenger ? (
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                ) : (
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                )}
                <span>
                  {isConfirmedPassenger
                    ? 'قبول والرد في الخاص للمعلن ⚡ (تحذير: أشخاص ⚠️)'
                    : isMyBroadcast
                    ? 'نشر رد (تم) فوراً 🎯'
                    : 'تأكيد القبول والرد في الخاص للمعلن 👤⚡'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Suspicious Passenger Manual Review Dialog */}
      {showReviewConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowReviewConfirmModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  مراجعة يدوية: احتمال نقل ركاب
                </h3>
                <p className="text-xs text-slate-500">
                  تحقق من نص الإعلان للتأكد من أنه توصيل بضائع وليس نقل أشخاص
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 block">
                نص الإعلان الوارد من الواتساب:
              </span>
              <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                {order.rawText}
              </div>
              {passenger.matchedPhrases.length > 0 && (
                <div className="text-[11px] text-amber-800 font-bold">
                  السبب المرصود: {passenger.matchedPhrases.join('، ')}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              ⚠️ تنبيه: نقل الأشخاص والركاب ممنوع. لا تقبل الطلب إلا إذا تأكدت أنه بضاعة أو غرض شخصي أو وجبة وليس راكباً.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReviewConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-98 transition-all"
              >
                إلغاء (نقل أشخاص)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReviewConfirmModal(false);
                  handleQuickAutoReply();
                }}
                className="w-full sm:flex-1 min-h-[46px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>تأكيد أنه بضاعة والقبول بالواتساب ⚡</span>
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
