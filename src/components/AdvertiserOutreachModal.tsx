import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Check,
  ShieldCheck,
  Sparkles,
  MapPin,
  AlertCircle,
  Zap,
  Users,
  Settings,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { ParsedOrder, OutreachDeliveryStatus } from '../types';
import {
  AdvertiserContactResolution,
  formatFilterOutreachMessage,
  normalizeBahrainPhone,
  executePrivateAdvertiserOutreach,
  formatDisplayPhone,
  openManualRegularWhatsAppChat,
} from '../utils/whatsappPrivateOutreach';
import { openWhatsAppAccessibilitySettings, openWhatsAppGroupConversation } from '../native/whatsappListener';
import { isNativeAndroid, OrderiNotificationListener } from '../native/orderiNotificationListener';

interface AdvertiserOutreachModalProps {
  isOpen: boolean;
  order: ParsedOrder | null;
  resolution: AdvertiserContactResolution | null;
  customTemplate?: string;
  driverArea?: string;
  failureStatus?: OutreachDeliveryStatus;
  failureReason?: string;
  onClose: () => void;
  onConfirmAccept: (
    order: ParsedOrder,
    confirmedPhone: string | null,
    message?: string,
    deliveryMethod?:
      | 'notification_remote_input'
      | 'accessibility_reply_privately'
      | 'accessibility_member_click'
      | 'manual_regular_whatsapp',
    status?: OutreachDeliveryStatus,
  ) => void;
  onToast: (msg: string) => void;
}

export function AdvertiserOutreachModal({
  isOpen,
  order,
  resolution,
  customTemplate,
  driverArea = 'البحرين',
  failureStatus,
  failureReason,
  onClose,
  onConfirmAccept,
  onToast,
}: AdvertiserOutreachModalProps) {
  if (!isOpen || !order || !resolution) return null;

  const defaultInitialPhone =
    resolution.phone ||
    resolution.advertiserCandidate?.phone ||
    '';

  const [customPhone, setCustomPhone] = useState(defaultInitialPhone.replace(/^973/, ''));
  const [editedMessage, setEditedMessage] = useState(
    formatFilterOutreachMessage(order, customTemplate, driverArea),
  );
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackgroundExecuting, setIsBackgroundExecuting] = useState(false);
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    setCustomPhone((resolution.phone || resolution.advertiserCandidate?.phone || '').replace(/^973/, ''));
    setEditedMessage(formatFilterOutreachMessage(order, customTemplate, driverArea));
  }, [order.id, resolution.phone, customTemplate, driverArea]);

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

  const cleanInputPhone = normalizeBahrainPhone(customPhone);
  const isPhoneValid = cleanInputPhone.length >= 8;

  const selectedCandidate = resolution.candidatesDetailed?.find((c) => c.phone === cleanInputPhone);
  const isCustomerSelected = selectedCandidate?.role === 'customer_recipient';
  const advertiserName = resolution.name || order.senderName || 'صاحب الإعلان';
  const groupName = order.groupName || resolution.groupName || 'قروب واتساب';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onToast('📋 تم نسخ نص الرد المعدّ للخاص');
    }
  };

  /**
   * Explicit user-triggered Accessibility assisted outreach inside regular WhatsApp (com.whatsapp).
   * Tries Reply privately / member click or private chat send with allowUiFallback = true.
   */
  const handleExecuteExplicitAssistedOutreach = async () => {
    if (isBackgroundExecuting) return;
    if (isCustomerSelected) {
      onToast('هذا الرقم يخص الزبون أو المستلم؛ لن نرسل إليه رسالة القبول.');
      return;
    }
    setIsBackgroundExecuting(true);
    try {
      const result = await executePrivateAdvertiserOutreach(
        order,
        editedMessage,
        driverArea,
        {
          autoSend: true,
          backgroundOnly: false,
          allowUiFallback: true,
          phoneOverride: isPhoneValid ? cleanInputPhone : undefined,
        },
      );

      if (result.success) {
        onConfirmAccept(
          order,
          result.phoneUsed,
          result.message,
          result.deliveryMethod === 'none' ? 'accessibility_member_click' : result.deliveryMethod,
          result.status,
        );
        onToast(result.statusLabel || `تم تمرير رسالة القبول إلى «${advertiserName}»`);
        onClose();
        return;
      }

      if (result.accessibilityRequired) {
        onToast('⚙️ فعّل خدمة وصول Orderi حتى يتمكن التطبيق من الوصول إلى محادثة المعلن الخاصة في WhatsApp العادي.');
        await openWhatsAppAccessibilitySettings();
        return;
      }

      onToast(result.statusLabel || 'تعذر إرسال رسالة القبول؛ بقي الطلب في الرادار.');
    } catch {
      onToast('تعذر إرسال الرسالة الخاصة؛ بقي الطلب في الرادار.');
    } finally {
      setIsBackgroundExecuting(false);
    }
  };

  /**
   * Explicit user action to open source group chat with the reply text copied to clipboard
   * so user can long-press -> Reply privately manually in regular WhatsApp.
   */
  const handleOpenGroupDirectly = async () => {
    handleCopy();
    try {
      const res = await openWhatsAppGroupConversation(groupName, { rawText: order.rawText });
      if (res.success) {
        onToast(`👥 فُتح قروب «${groupName}» مع نسخ ردك — استخدم «الرد بشكل خاص» على إعلان «${advertiserName}»`);
        onClose();
      } else {
        onToast('افتح WhatsApp العادي يدوياً على القروب واستخدم «الرد بشكل خاص» على إعلان المعلن (الرد منسوخ).');
      }
    } catch {
      onToast('يرجى فتح WhatsApp العادي يدوياً ومراسلة المعلن (الرد منسوخ).');
    }
  };

  /**
   * Explicit user action to open regular WhatsApp 1:1 draft with an identified/entered phone.
   * Never auto-invoked on failure, and never marks order delivered.
   */
  const handleOpenManualPrivateDraft = async () => {
    if (!isPhoneValid) {
      onToast('⚠️ أدخل أو اختر رقم هاتف واتساب صحيح للمعلن أولاً.');
      return;
    }
    if (isCustomerSelected) {
      onToast('هذا الرقم يخص الزبون أو المستلم؛ اختر رقم المعلن فقط.');
      return;
    }

    setIsSubmitting(true);
    try {
      const openRes = await openManualRegularWhatsAppChat(cleanInputPhone, editedMessage);
      if (!openRes.success) {
        onToast('تعذر فتح WhatsApp Messenger العادي لهذه المحادثة؛ تأكد من تثبيت WhatsApp العادي.');
        return;
      }
      onToast(
        `💬 تم فتح محادثة «${advertiserName}» في WhatsApp العادي (${formatDisplayPhone(cleanInputPhone)}) وتجهيز الرد — اضغط إرسال داخل واتساب.`,
      );
      onClose();
    } catch {
      onToast('تعذر فتح محادثة المعلن الخاصة في WhatsApp العادي.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmManualSent = () => {
    if (isCustomerSelected) {
      onToast('هذا الرقم يخص الزبون أو المستلم؛ اختر رقم المعلن.');
      return;
    }
    onConfirmAccept(
      order,
      isPhoneValid ? cleanInputPhone : null,
      editedMessage,
      'manual_regular_whatsapp',
      'SUBMITTED_UNCONFIRMED',
    );
    onToast('✅ تم تسجيل قبول الطلب بعد إرسالك اليدوي للخاص');
    onClose();
  };

  const handleOpenAccessibility = async () => {
    try {
      await openWhatsAppAccessibilitySettings();
      onToast('⚙️ جاري فتح إعدادات إمكانية الوصول لتفعيل خدمة وصول Orderi...');
    } catch {
      onToast('يرجى تفعيل خدمة Orderi في إعدادات إمكانية الوصول بأندرويد');
    }
  };

  const statusBadgeText =
    failureStatus === 'VERIFICATION_REQUIRED'
      ? 'يتطلب تأكيد هوية المعلن'
      : failureStatus === 'FAILED'
      ? 'تعذر تنفيذ المراسلة'
      : 'الإرسال الصامت بالخلفية غير متاح لهذا الإعلان';

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
                <MessageCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    التواصل الخاص مع المعلن 💬
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3" />
                    <span>WhatsApp العادي فقط</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5 font-bold">
                  بقي الطلب في الرادار ولم يُفتح واتساب تلقائياً — اختر وسيلة المتابعة أدناه 🔒
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
          {/* Honest Failure Status Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs font-black">
              <span className="flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{statusBadgeText}</span>
              </span>
              {failureStatus && (
                <span className="text-[10px] font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  {failureStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {failureReason ||
                resolution.verificationReason ||
                'لا يتوفر إشعار رد خاص (RemoteInput) مباشر لهذا المعلن في نظام أندرويد حالياً.'}
            </p>
          </div>

          {/* Order Snapshot Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 truncate">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">
                  {order.from} ← {order.to}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span>
                  المعلن: <strong className="text-slate-900 font-extrabold">{advertiserName}</strong>
                </span>
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

          {/* Explicit Accessibility / Reply Privately Action */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300 space-y-3">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                متابعة عبر WhatsApp Messenger العادي (اختياري وبإذنك)
              </h4>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                {resolution.phone
                  ? `الرقم المحدد للمعلن: ${resolution.displayPhone}`
                  : `لا يشترط رقم هاتف — سيتم مطابقة «${advertiserName}» أو ميزة «الرد بشكل خاص» على رسالته الأصلية داخل القروب.`}
              </p>
            </div>

            {isAccessibilityEnabled ? (
              <button
                type="button"
                onClick={handleExecuteExplicitAssistedOutreach}
                disabled={isBackgroundExecuting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isBackgroundExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>جاري فتح محادثة «{advertiserName}» الخاصة...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>تنفيذ المراسلة الخاصة عبر خدمة وصول Orderi الآن ⚡</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                {isNativeAndroid() && (
                  <button
                    type="button"
                    onClick={handleOpenAccessibility}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>تفعيل خدمة وصول Orderi للمراسلة الخاصة التلقائية ⚙️</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenGroupDirectly}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>فتح القروب في WhatsApp العادي للرد الخاص على «{advertiserName}» (الرد منسوخ) 👥</span>
                </button>
              </div>
            )}
          </div>

          {/* Candidate Phone Numbers from Text with Role Guard */}
          {resolution.candidatesDetailed && resolution.candidatesDetailed.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 block">
                أرقام واردة في الإعلان (يُمنع اختيار رقم الزبون):
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
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cand.role === 'advertiser'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cand.role === 'customer_recipient'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
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

          {isCustomerSelected && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>تنبيه:</strong> هذا الرقم يخص الزبون أو المستلم. لا تراسل الزبون؛ راسل المعلن فقط.
              </span>
            </div>
          )}

          {/* Ephemeral Manual Phone Field (ZERO vault / persistence) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-xs font-black text-slate-800 flex items-center justify-between">
              <span>رقم هاتف المعلن لهذا الطلب فقط (اختياري بدون حفظ):</span>
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
              <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none">+973</span>
            </div>

            {isPhoneValid && !isCustomerSelected && (
              <button
                type="button"
                onClick={handleOpenManualPrivateDraft}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>فتح المحادثة الخاصة برقم الهاتف ({formatDisplayPhone(cleanInputPhone)}) يدوياً 💬</span>
              </button>
            )}
          </div>

          {/* Message Preview & Editing (Uses Filter Template) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-black text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>نص الرد من إعدادات الفلتر:</span>
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

          {/* Explicit Post-Manual Confirmation Button */}
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmManualSent}
              disabled={isCustomerSelected}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>أرسلت الرد يدوياً للمعلن — سجّل قبول الطلب</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
