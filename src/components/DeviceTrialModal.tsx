import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  X,
  Sparkles,
  KeyRound,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { DeviceTrialStatus, activateDeviceTrial } from '../utils/deviceTrialManager';

interface DeviceTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialStatus: DeviceTrialStatus | null;
  onActivated?: () => void;
  onShowToast?: (msg: string) => void;
}

export function DeviceTrialModal({
  isOpen,
  onClose,
  trialStatus,
  onActivated,
  onShowToast,
}: DeviceTrialModalProps) {
  const [activationCode, setActivationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trialStatus) return null;

  const handleCopyDeviceId = () => {
    try {
      navigator.clipboard.writeText(trialStatus.deviceId);
      setCopied(true);
      onShowToast?.('تم نسخ معرف الهاتف إلى الحافظة 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast?.('يرجى تحديد المعرف ونسخه يدوياً');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!activationCode.trim()) {
      setErrorMsg('يرجى إدخال كود التفعيل');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activateDeviceTrial(activationCode.trim());
      if (res.success) {
        onShowToast?.(res.message || 'تم تفعيل ترخيص الهاتف بنجاح! 🚀');
        onActivated?.();
        onClose();
      } else {
        setErrorMsg(res.message || 'كود التفعيل غير صالح');
      }
    } catch {
      setErrorMsg('تعذر تفعيل الكود، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstInstallDateStr = trialStatus.firstInstalledAt
    ? new Date(trialStatus.firstInstalledAt).toLocaleDateString('ar-BH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'غير متوفر';

  const expiresDateStr = trialStatus.expiresAt
    ? new Date(trialStatus.expiresAt).toLocaleDateString('ar-BH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'غير متوفر';

  // Calculate percentage elapsed
  const totalDuration = 7 * 24 * 3600 * 1000;
  const elapsed = Math.max(0, Date.now() - trialStatus.firstInstalledAt);
  const percentElapsed = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  const whatsappLink = `https://wa.me/97333314353?text=${encodeURIComponent(
    `مرحباً دعم Orderi البحرين 🇧🇭، أود تفعيل اشتراكي على هذا الهاتف.\nمعرف الجهاز: ${trialStatus.deviceId}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-['Tajawal',sans-serif] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between text-white ${
          trialStatus.isActivated 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
            : trialStatus.isExpired 
              ? 'bg-gradient-to-r from-rose-600 to-amber-700' 
              : 'bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
              {trialStatus.isActivated ? (
                <ShieldCheck className="w-6 h-6 text-white" />
              ) : trialStatus.isExpired ? (
                <AlertTriangle className="w-6 h-6 text-amber-300" />
              ) : (
                <Clock className="w-6 h-6 text-emerald-300 animate-spin-slow" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {trialStatus.isActivated
                  ? 'ترخيص Orderi نشط ومدفوع 🇧🇭'
                  : trialStatus.isExpired
                  ? 'انتهت الفترة التجريبية (7 أيام) ⏳'
                  : 'الفترة التجريبية المجانية (7 أيام) ⏳'}
              </h3>
              <p className="text-xs text-white/80 font-medium">
                مرتبطة بعتاد هذا الهاتف تحديداً ولا يمكن تصفيرها
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {/* Hardware Identity Card */}
          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                معرف عتاد الهاتف الفريد (Device ID):
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                {trialStatus.model || 'Android Phone'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
              <span className="font-bold tracking-wider select-all">{trialStatus.deviceId}</span>
              <button
                type="button"
                onClick={handleCopyDeviceId}
                className="flex items-center gap-1 text-[11px] font-sans text-blue-600 hover:text-blue-800 font-bold shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 هذه البصمة مستخرجة من عتاد ومكونات هاتفك، وتضمن استمرار حساب الأيام حتى لو حذفت التطبيق وأعدت تثبيته.
            </p>
          </div>

          {/* Trial Status Details */}
          {!trialStatus.isActivated && (
            <div className={`rounded-2xl p-4 border ${
              trialStatus.isExpired 
                ? 'bg-rose-50/70 border-rose-200' 
                : 'bg-emerald-50/70 border-emerald-200'
            } space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">حالة الفترة التجريبية:</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-black ${
                  trialStatus.isExpired
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {trialStatus.formattedRemaining}
                </span>
              </div>

              {/* Progress bar */}
              {!trialStatus.isExpired && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>متبقي: {trialStatus.daysRemaining} يوم ({trialStatus.hoursRemaining} ساعة)</span>
                    <span>7 أيام إجمالية</span>
                  </div>
                  <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, 100 - percentElapsed)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                <div>
                  <span className="block text-slate-400 text-[10px]">تاريخ أول تثبيت:</span>
                  <span className="font-bold text-slate-700 text-[11px]">{firstInstallDateStr}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px]">تاريخ انتهاء التجربة:</span>
                  <span className="font-bold text-slate-700 text-[11px]">{expiresDateStr}</span>
                </div>
              </div>
            </div>
          )}

          {/* If already activated */}
          {trialStatus.isActivated && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-black text-emerald-900 text-sm">تهانينا! حسابك مفعل بالكامل على هذا الهاتف</h4>
              <p className="text-xs text-emerald-700">
                يمكنك استخدام كافة مزايا رادار الواتساب ومستشعر الـ GPS واقتناص الطلبات بحرية تامة.
              </p>
            </div>
          )}

          {/* Activation Form */}
          {!trialStatus.isActivated && (
            <div className="space-y-3 pt-1">
              <h4 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>تفعيل الاشتراك بكود الترخيص:</span>
              </h4>

              <form onSubmit={handleActivate} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => {
                      setActivationCode(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="أدخل كود التفعيل هنا..."
                    dir="ltr"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs sm:text-sm text-center uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-xs active:scale-95"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>تحقق...</span>
                      </span>
                    ) : (
                      'تفعيل الآن'
                    )}
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </form>

              {/* WhatsApp Support Link */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium">ليس لديك كود ترخيص؟</span>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-transform active:scale-95 shadow-xs"
                >
                  <span>طلب كود تفعيل عبر واتساب 💬</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
