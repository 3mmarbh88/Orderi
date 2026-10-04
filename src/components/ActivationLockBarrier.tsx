import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Fingerprint,
  Phone,
  User,
} from 'lucide-react';
import { CaptainUser } from '../types';
import {
  applyActivationCode,
  authenticateWithBiometrics,
  getCurrentUser,
  ACTIVATION_WHATSAPP_LINK,
} from '../utils/authManager';

interface ActivationLockBarrierProps {
  currentUser: CaptainUser | null;
  onActivated: (user: CaptainUser) => void;
  onOpenAuthModal: (
    tab: 'login' | 'register' | 'activate'
  ) => void;
}

export function WhatsAppIcon({
  className = 'w-5 h-5',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ActivationLockBarrier({
  currentUser,
  onActivated,
  onOpenAuthModal,
}: ActivationLockBarrierProps) {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /*
   * ============================================================
   * Server activation
   * ============================================================
   */
  const handleActivate = async (
    targetCode?: string
  ) => {
    const codeToUse = (
      targetCode || code
    ).trim().toUpperCase();

    if (!codeToUse) {
      setErrorMsg(
        'يرجى إدخال كود التفعيل لتشغيل البرنامج'
      );
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    if (
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      try {
        navigator.vibrate(30);
      } catch {}
    }

    try {
      const activeUser =
        currentUser || getCurrentUser();

      if (!activeUser) {
        setErrorMsg(
          'يجب تسجيل الدخول أولاً قبل تفعيل كود الاشتراك'
        );
        return;
      }

      /*
       * applyActivationCode أصبح async
       * ويرسل الكود مباشرة إلى Orderi Server.
       */
      const res =
        await applyActivationCode(
          activeUser.id,
          codeToUse
        );

      if (res.success && res.user) {
        setIsSuccess(true);

        if (
          typeof navigator !== 'undefined' &&
          'vibrate' in navigator
        ) {
          try {
            navigator.vibrate([
              40,
              80,
              40,
            ]);
          } catch {}
        }

        setTimeout(() => {
          onActivated(res.user!);
        }, 700);
      } else {
        setErrorMsg(
          res.error ||
            'كود التفعيل غير صالح أو منتهي أو مستخدم مسبقاً'
        );
      }
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'تعذر الاتصال بسيرفر Orderi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * ============================================================
   * Biometric / existing session
   * ============================================================
   */
  const handleBiometricUnlock = async () => {
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res =
        await authenticateWithBiometrics();

      if (res.success && res.user) {
        if (res.user.isActivated) {
          setIsSuccess(true);

          setTimeout(() => {
            onActivated(res.user!);
          }, 500);
        } else {
          setErrorMsg(
            'تم التحقق من الحساب، لكن الاشتراك غير مفعل. أدخل كود التفعيل.'
          );
        }
      } else {
        setErrorMsg(
          res.error ||
            'تعذر التحقق من الحساب. يرجى تسجيل الدخول مرة أخرى.'
        );
      }
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'فشل التحقق من الحساب'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 select-none">

      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-rose-300/80 overflow-hidden relative z-10 flex flex-col my-auto max-h-[95vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-950 p-5 sm:p-6 text-white text-right relative">

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-lg shadow-rose-900/40 shrink-0 flex items-center justify-center border-2 border-rose-400">
                <img
                  src="/logo.png"
                  alt="Orderi Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">

                  <h3 className="text-xl font-black tracking-tight text-white">
                    Orderi
                  </h3>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center gap-1 shadow-xs">
                    <Lock className="w-3 h-3" />
                    <span>البرنامج مقفل</span>
                  </span>

                </div>

                <p className="text-xs text-rose-200 mt-0.5 font-bold">
                  بانتظار كود التفعيل لتشغيل رادار الطلبات 🇧🇭
                </p>
              </div>

            </div>

            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>

          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">

          {/* Warning */}
          <div className="p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-200 text-right space-y-1.5 shadow-2xs">

            <div className="flex items-center gap-2 font-black text-rose-950 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                تنبيه: البرنامج يحتاج إلى اشتراك فعال
              </span>
            </div>

            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              أدخل كود التفعيل المخصص لحسابك.
              سيتم التحقق من الكود مباشرة عبر سيرفر
              Orderi، ولن يتم تشغيل البرنامج إلا إذا
              كان الاشتراك صالحاً.
            </p>

          </div>

          {/* WhatsApp */}
          <div className="pt-0.5">

            <a
              href={ACTIVATION_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs sm:text-sm shadow-md shadow-[#25D366]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] group"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform" />

              <span>
                تواصل عبر واتساب للحصول على كود التفعيل
              </span>
            </a>

          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold animate-in fade-in">

              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />

              <span>{errorMsg}</span>

            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold animate-in fade-in">

              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />

              <span>
                تم تفعيل الاشتراك بنجاح! جاري تشغيل Orderi...
              </span>

            </div>
          )}

          {/* Current account */}
          {currentUser && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-right flex items-center justify-between">

              <div className="flex items-center gap-2.5">

                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    {currentUser.name}
                  </span>

                  <span
                    className="text-[11px] text-slate-500 font-mono"
                    dir="ltr"
                  >
                    +973 {currentUser.phone}
                  </span>
                </div>

              </div>

              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                الاشتراك غير مفعل
              </span>

            </div>
          )}

          {/* Activation form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleActivate();
            }}
            className="space-y-3"
          >

            <div className="space-y-1.5 text-right">

              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>
                  أدخل كود التفعيل المعتمد:
                </span>

                <span className="text-[10px] text-emerald-700 font-bold">
                  أحرف وأرقام
                </span>
              </label>

              <div className="relative flex items-center">

                <input
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="أدخل كود التفعيل هنا"
                  dir="ltr"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 bg-slate-50 font-mono font-black text-base text-slate-900 text-center tracking-wider focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  autoFocus
                  disabled={isLoading || isSuccess}
                />

                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />

              </div>

            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                !code.trim() ||
                isSuccess ||
                !currentUser
              }
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >

              {isLoading ? (
                <>
                  <span className="animate-pulse">
                    جاري التحقق من السيرفر...
                  </span>
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  <span>
                    تفعيل الاشتراك وتشغيل البرنامج
                  </span>
                </>
              )}

            </button>

          </form>

          {/* Features */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-right space-y-2">

            <span className="font-black text-slate-800 text-xs block">
              بعد نجاح التفعيل:
            </span>

            <ul className="space-y-1.5 text-slate-700 text-xs">

              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  يتم فتح جميع ميزات Orderi
                </span>
              </li>

              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  يتم حفظ مدة الاشتراك من السيرفر
                </span>
              </li>

              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  يمكن للسيرفر إيقاف الاشتراك عند انتهائه
                </span>
              </li>

            </ul>

          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() => void handleBiometricUnlock()}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4 text-emerald-600" />
              <span>الدخول بالبصمة</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenAuthModal('login')
              }
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>تسجيل الدخول</span>
            </button>

          </div>

          <div className="text-center">

            <button
              type="button"
              onClick={() =>
                onOpenAuthModal('register')
              }
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <span>
                ليس لديك حساب؟ إنشاء حساب جديد
              </span>

              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>

          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          Orderi — رادار طلبات التوصيل الذكي في مملكة البحرين 🇧🇭
        </div>

      </div>

    </div>
  );
}