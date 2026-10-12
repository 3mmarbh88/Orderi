import React, { useState } from 'react';
import { 
  X, 
  Send, 
  MessageCircle, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  MapPin,
  Coins
} from 'lucide-react';
import { ParsedOrder } from '../types';
import { 
  AdvertiserContactResolution, 
  formatAdvertiserPrivateMessage, 
  openRegularWhatsAppPrivateChat, 
  normalizeBahrainPhone 
} from '../utils/whatsappPrivateOutreach';

interface AdvertiserOutreachModalProps {
  isOpen: boolean;
  order: ParsedOrder | null;
  resolution: AdvertiserContactResolution | null;
  onClose: () => void;
  onConfirmAccept: (order: ParsedOrder, confirmedPhone: string) => void;
  onToast: (msg: string) => void;
}

export function AdvertiserOutreachModal({
  isOpen,
  order,
  resolution,
  onClose,
  onConfirmAccept,
  onToast,
}: AdvertiserOutreachModalProps) {
  if (!isOpen || !order || !resolution) return null;

  const [customPhone, setCustomPhone] = useState(
    resolution.candidatePhones.length > 0 
      ? resolution.candidatePhones[0].replace(/^973/, '') 
      : ''
  );
  const [editedMessage, setEditedMessage] = useState(formatAdvertiserPrivateMessage(order));
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanInputPhone = normalizeBahrainPhone(customPhone);
  const isPhoneValid = cleanInputPhone.length >= 8;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onToast('📋 تم نسخ صيغة الرسالة الخاصة');
    }
  };

  const handleSendPrivateChat = () => {
    if (!isPhoneValid) {
      onToast('⚠️ يرجى إدخال أو اختيار رقم هاتف واتساب صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Copy message
      handleCopy();

      // 2. Open regular WhatsApp private chat
      openRegularWhatsAppPrivateChat(cleanInputPhone, editedMessage);

      // 3. Confirm accept in order radar
      onConfirmAccept(order, cleanInputPhone);
      onToast('تم فتح المحادثة الخاصة والرسالة جاهزة. اضغط إرسال داخل واتساب لإرسالها؛ لم تُرسل تلقائيًا.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchAdvertiserInWhatsApp = () => {
    // Open WhatsApp regular app and copy message so captain can search advertiser by name
    handleCopy();
    const searchUrl = `whatsapp://`;
    try {
      window.location.href = searchUrl;
    } catch {
      window.open('https://web.whatsapp.com', '_blank');
    }
    onToast(`🔍 تم نسخ الرسالة! ابحث عن «${resolution.name}» في محادثات واتساب`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
      <div 
        dir="rtl"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 flex flex-col my-auto max-h-[95vh] text-right"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 p-5 text-white relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    تواصل خاص مع صاحب الإعلان
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3" />
                    <span>محادثة خاصة 🔒</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5 font-bold">
                  تواصل عبر WhatsApp العادي مباشرة • يُمنع الرد في القروب 🚫
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Order Snapshot Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 truncate">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{order.from} ← {order.to}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>المعلن: <strong className="text-slate-800">{resolution.name}</strong></span>
                <span>•</span>
                <span className="truncate text-purple-700 font-medium">{resolution.groupName}</span>
              </div>
            </div>

            <div className="shrink-0 text-left">
              <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs">
                {order.price && order.price > 0 ? `${order.price.toFixed(1)} د.ب` : 'بالاتفاق 🤝'}
              </span>
            </div>
          </div>

          {/* Verification Alert Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-black">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>التحقق من هوية المعلن لمنع الإرسال الخاطئ:</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
              حفاظاً على خصوصيتك وعدم الرد في القروب، تأكد من رقم المعلن الصحيح أو اختره من الأرقام المستخرجة من الإعلان لإرسال الرسالة في الخاص فقط.
            </p>
          </div>

          {/* Candidate Phone Numbers from Text (if any) */}
          {resolution.candidatePhones.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 block">
                الأرقام المرصودة في الإعلان (انقر للاختيار):
              </label>
              <div className="flex flex-wrap gap-2">
                {resolution.candidatePhones.map((ph, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomPhone(ph.replace(/^973/, ''))}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      cleanInputPhone === ph
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">+{ph}</span>
                    {cleanInputPhone === ph && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Phone Input Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center justify-between">
              <span>رقم هاتف واتساب المعلن (البحرين):</span>
              <span className="text-[10px] text-slate-500 font-bold">8 أرقام</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="33XXXXXX أو 3XXXXXXX"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
              />
              <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none">
                +973
              </span>
            </div>
          </div>

          {/* Message Preview and Quick Editing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-black text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>صيغة الرسالة التلقائية الخاصة:</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 leading-relaxed focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
            />
          </div>

          {/* Honest platform capability notice: links cannot send a WhatsApp message by themselves. */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] leading-relaxed text-slate-700">
            <span className="font-black">تنبيه:</span> سيُفتح الخاص برسالة جاهزة فقط. تطبيق واتساب العادي لا يتيح إرسال الرسالة تلقائيًا عبر هذا الرابط؛ يجب الضغط على «إرسال» داخل المحادثة. لن يكتب Orderi أي رسالة في القروب.
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSendPrivateChat}
              disabled={!isPhoneValid || isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>فتح الخاص وتجهيز الرسالة وتأكيد القبول</span>
            </button>

            <button
              type="button"
              onClick={handleSearchAdvertiserInWhatsApp}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>البحث عن المعلن في واتساب بالاسم («{resolution.name}»)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
