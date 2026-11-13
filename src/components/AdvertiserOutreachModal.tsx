import React, { useState, useEffect } from 'react';
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
  Smartphone,
  MapPin,
  Coins,
  AlertCircle,
  Zap,
  Users,
  Settings,
  BookmarkCheck,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { ParsedOrder } from '../types';
import { 
  AdvertiserContactResolution, 
  formatAdvertiserPrivateMessage, 
  normalizeBahrainPhone,
  executePrivateAdvertiserOutreach,
  formatDisplayPhone,
  CandidatePhoneDetail,
} from '../utils/whatsappPrivateOutreach';
import { openWhatsAppAccessibilitySettings } from '../native/whatsappListener';
import { isNativeAndroid, OrderiNotificationListener, openWhatsAppGroupConversation } from '../native/orderiNotificationListener';
import { saveAdvertiserPhone, getAdvertiserSavedPhone } from '../utils/advertiserVault';

interface AdvertiserOutreachModalProps {
  isOpen: boolean;
  order: ParsedOrder | null;
  resolution: AdvertiserContactResolution | null;
  onClose: () => void;
  onConfirmAccept: (order: ParsedOrder, confirmedPhone: string | null, message?: string) => void;
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

  const defaultInitialPhone = resolution.advertiserCandidate?.phone || (resolution.candidatePhones.length > 0 ? resolution.candidatePhones[0] : '');
  const [customPhone, setCustomPhone] = useState(defaultInitialPhone.replace(/^973/, ''));
  const [editedMessage, setEditedMessage] = useState(formatAdvertiserPrivateMessage(order));
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackgroundExecuting, setIsBackgroundExecuting] = useState(false);
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState<boolean | null>(null);
  const [saveToVaultChecked, setSaveToVaultChecked] = useState(true);

  const cleanInputPhone = normalizeBahrainPhone(customPhone);
  const isPhoneValid = cleanInputPhone.length >= 8;

  const selectedCandidate = resolution.candidatesDetailed?.find((c) => c.phone === cleanInputPhone);
  const isCustomerSelected = selectedCandidate?.role === 'customer_recipient';
  const advertiserName = resolution.name || order.senderName || 'صاحب الإعلان';
  const groupName = order.groupName || resolution.groupName || 'قروب واتساب';

  // Check accessibility status on mount
  useEffect(() => {
    let mounted = true;
    if (isNativeAndroid()) {
      OrderiNotificationListener.isAccessibilityEnabled()
        .then((res) => {
          if (mounted) setIsAccessibilityEnabled(Boolean(res?.enabled));
        })
        .catch(() => {
          if (mounted) setIsAccessibilityEnabled(false);
        });
    } else {
      setIsAccessibilityEnabled(false);
    }
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onToast('📋 تم نسخ صيغة الرسالة الخاصة');
    }
  };

  /**
   * الابتكار الرئيسي: تنفيذ المراسلة الخاصة في الخلفية آلياً
   * يقوم بمحاكاة الضغط على اسم المعلن في القروب ثم اختيار مراسلة وإرسال الرد في الخاص
   */
  const handleExecuteBackgroundMemberClick = async () => {
    if (isBackgroundExecuting) return;
    if (isCustomerSelected) {
      onToast('هذا الرقم يخص الزبون أو المستلم؛ لن نرسل إليه رسالة القبول.');
      return;
    }
    setIsBackgroundExecuting(true);
    try {
      // Share the same engine used by Radar and popup actions: exact private
      // notification RemoteInput first, then the existing Accessibility route.
      const result = await executePrivateAdvertiserOutreach(
        order, editedMessage, undefined, true, isPhoneValid ? cleanInputPhone : undefined
      );

      if (result.success) {
        onConfirmAccept(order, result.phoneUsed, result.message);
        onToast(result.statusLabel || `تم تمرير رسالة القبول الخاصة إلى «${advertiserName}»`);
        onClose();
        return;
      }

      if (result.accessibilityRequired) {
        onToast('⚙️ فعّل خدمة وصول Orderi حتى يتمكن التطبيق من الوصول إلى محادثة المعلن الخاصة.');
        await openWhatsAppAccessibilitySettings();
        return;
      }

      onToast(result.statusLabel || 'تعذر إرسال رسالة القبول؛ لم يتم قبول الطلب.');
    } catch (e) {
      console.warn('[Orderi] Background member click error:', e);
      onToast('تعذر إرسال الرسالة الخاصة؛ بقي الطلب دون قبول.');
    } finally {
      setIsBackgroundExecuting(false);
    }
  };

  /**
   * فتح القروب مباشرة والانتقال لإعلان المعلن مع نسخ الرسالة وتنبيه السائق
   */
  const handleOpenGroupDirectly = async () => {
    handleCopy();
    try {
      await openWhatsAppGroupConversation(groupName);
      onToast(`👥 افتح القروب واضغط على اسم «${advertiserName}» ثم اختر مراسلة (الرسالة منسوخة وجاهزة للصق)`);
      onClose();
    } catch {
      onToast('يرجى فتح واتساب يدوياً والبحث عن اسم المعلن');
    }
  };

  /**
   * فتح المحادثة الخاصة عند معرفة رقم الهاتف أو إدخاله يدوياً
   */
  const handleOpenPrivateChatWithPhone = async () => {
    if (!isPhoneValid) {
      onToast('⚠️ يرجى إدخال أو اختيار رقم هاتف واتساب صحيح للمعلن');
      return;
    }
    if (isCustomerSelected) {
      onToast('هذا الرقم يخص الزبون أو المستلم؛ اختر رقم المعلن قبل المتابعة.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (saveToVaultChecked && advertiserName && advertiserName !== 'صاحب الإعلان') {
        saveAdvertiserPhone(advertiserName, cleanInputPhone);
      }

      // "Private reply" opens the exact 1:1 chat with a draft only. It must
      // not auto-send, call a server endpoint, or mark the order accepted.
      const result = await executePrivateAdvertiserOutreach(
        order, editedMessage, undefined, false, cleanInputPhone
      );
      if (!result.success) {
        onToast(result.statusLabel || 'تعذر فتح محادثة المعلن الخاصة.');
        return;
      }

      onToast(`💬 تم فتح محادثة «${advertiserName}» الخاصة وتجهيز الرسالة (${formatDisplayPhone(cleanInputPhone)})؛ اضغط إرسال داخل واتساب.`);
      onClose();
    } catch (error) {
      console.warn('[Orderi] Could not open exact advertiser private chat:', error);
      onToast('تعذر فتح محادثة المعلن الخاصة؛ لم يتم إرسال أي رسالة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAccessibility = async () => {
    try {
      await openWhatsAppAccessibilitySettings();
      onToast('⚙️ جاري فتح إعدادات إمكانية الوصول لتفعيل خدمة وصول Orderi بالخلفية...');
    } catch {
      onToast('يرجى تفعيل خدمة Orderi في إعدادات إمكانية الوصول بأندرويد');
    }
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
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    مراسلة صاحب الإعلان في الخاص 💬
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3" />
                    <span>خاص بالخلفية 🔒</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5 font-bold">
                  تواصل خاص 1-على-1 • يُمنع الرد داخل القروب منعاً باتاً 🚫
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
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span>المعلن: <strong className="text-slate-900 font-extrabold">{advertiserName}</strong></span>
                <span>•</span>
                <span className="truncate text-purple-700 font-bold">{groupName}</span>
              </div>
            </div>

            <div className="shrink-0 text-left">
              <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs">
                {order.price && order.price > 0 ? `${order.price.toFixed(1)} د.ب` : 'بالاتفاق 🤝'}
              </span>
            </div>
          </div>

          {/* Background Member Click Innovation Spotlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 border-2 border-emerald-400/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                    الابتكار الذكي: الضغط على اسم المعلن بالخلفية ⚡
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    رقم الهاتف غير مكتوب في الإعلان — يتم فتحه عبر اسم «{advertiserName}» بالقروب
                  </p>
                </div>
              </div>

              {isAccessibilityEnabled && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black shrink-0">
                  جاهز للتشغيل ✓
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-900 leading-relaxed font-bold bg-white/80 p-3 rounded-xl border border-emerald-200">
              💡 <strong>كيف تعمل في الخلفية؟</strong> يقوم التطبيق بفتح القروب والنقر آلياً على اسم «{advertiserName}»، واختيار «مراسلة»، وإدخال رسالة القبول فوراً في المحادثة الخاصة ثم العودة للرادار دون أي تدخل منك!
            </p>

            {/* Accessibility CTA or One-Click Execute Button */}
            {isAccessibilityEnabled ? (
              <button
                type="button"
                onClick={handleExecuteBackgroundMemberClick}
                disabled={isBackgroundExecuting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isBackgroundExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>جاري الضغط على اسم «{advertiserName}» بالخلفية...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>تنفيذ المراسلة الخاصة في الخلفية آلياً (نقرة واحدة) ⚡</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleOpenAccessibility}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>تفعيل خدمة الوصول (لتمكين الضغط التلقائي على اسم المعلن) ⚙️</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenGroupDirectly}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>فتح القروب الآن ومراسلة «{advertiserName}» يدوياً (الرسالة منسوخة) 👥</span>
                </button>
              </div>
            )}
          </div>

          {/* Candidate Phone Numbers from Text with Detected Role */}
          {resolution.candidatesDetailed && resolution.candidatesDetailed.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 block">
                أرقام هاتف مكتشفة داخل نص الإعلان (انقر للاختيار):
              </label>
              <div className="space-y-1.5">
                {resolution.candidatesDetailed.map((cand, idx) => {
                  const isSelected = cleanInputPhone === cand.phone;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomPhone(cand.phone.replace(/^973/, ''))}
                      className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : cand.role === 'customer_recipient'
                          ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900" dir="ltr">
                            {cand.displayPhone}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cand.role === 'advertiser'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cand.role === 'customer_recipient'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {cand.roleLabel}
                          </span>
                        </div>
                        {cand.contextSnippet && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            سياق النص: «{cand.contextSnippet}»
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-slate-300 bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Number Selection Caution */}
          {isCustomerSelected && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>تنبيه:</strong> هذا الرقم يخص الزبون أو المستلم. لا تراسل الزبون؛ احرص على مراسلة التاجر المعلن.
              </span>
            </div>
          )}

          {/* Manual Phone Input Field + Vault Memory */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-xs font-black text-slate-800 flex items-center justify-between">
              <span>أو أدخل رقم هاتف المعلن (إن وُجد):</span>
              <span className="text-[10px] text-slate-500 font-bold">8 أرقام (3, 6, 17)</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="33XXXXXX أو 3XXXXXXX"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
              />
              <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none">
                +973
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={saveToVaultChecked}
                onChange={(e) => setSaveToVaultChecked(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-bold flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>تذكر رقم المعلن «{advertiserName}» تلقائياً للطلبات القادمة (ذاكرة المعلنين)</span>
              </span>
            </label>

            {isPhoneValid && (
              <button
                type="button"
                onClick={handleOpenPrivateChatWithPhone}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>فتح المحادثة الخاصة برقم الهاتف (+973 {customPhone}) 💬</span>
              </button>
            )}
          </div>

          {/* Message Preview and Quick Editing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-black text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>صيغة رسالة القبول المجهزة في الخاص:</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرسالة'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 leading-relaxed focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
