
import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Lock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Car,
  Bike,
  Truck,
  Bus,
  CarTaxiFront,
  X,
  BadgeCheck,
} from 'lucide-react';

import { CaptainUser, VehicleType } from '../types';

import {
  getCurrentUser,
  loginWithPhoneAndPassword,
  registerCaptain,
  applyActivationCode,
  authenticateWithBiometrics,
  ACTIVATION_WHATSAPP_LINK,
} from '../utils/authManager';

function WhatsAppIcon({
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
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.198.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CaptainUser) => void;
  initialTab?: 'login' | 'register' | 'activate';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
}: AuthModalProps) {
  const [tab, setTab] = useState<
    'login' | 'register' | 'activate'
  >(initialTab);

  // ============================================================
  // Login
  // ============================================================

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================
  // Register
  // ============================================================

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regVehicle, setRegVehicle] =
    useState<VehicleType>('car');
  const [regBiometrics, setRegBiometrics] =
    useState(true);
  const [regActivationCode, setRegActivationCode] =
    useState('');

  // ============================================================
  // Activation
  // ============================================================

  const [activationInput, setActivationInput] =
    useState('');

  // ============================================================
  // Feedback
  // ============================================================

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================
  // Biometric UI
  // ============================================================

  const [showBiometricScanner, setShowBiometricScanner] =
    useState(false);

  const [scannerStatus, setScannerStatus] =
    useState<
      'scanning' | 'success' | 'failed'
    >('scanning');

  // ============================================================
  // Open / Reset
  // ============================================================

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (
    e?: React.FormEvent
  ) => {
    if (e) {
      e.preventDefault();
    }

    setErrorMsg('');
    setSuccessMsg('');

    const phone = loginPhone.trim();
    const password = loginPassword;

    if (!phone) {
      setErrorMsg('يرجى إدخال رقم الهاتف');
      return;
    }

    if (!password) {
      setErrorMsg('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      const res =
        await loginWithPhoneAndPassword(
          phone,
          password
        );

      if (res.success && res.user) {
        setSuccessMsg(
          `أهلاً بك مجدداً، ${res.user.name}!`
        );

        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        setErrorMsg(
          res.error ||
            'فشل تسجيل الدخول. تحقق من رقم الهاتف وكلمة المرور.'
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

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('يرجى إدخال الاسم');
      return;
    }

    if (!regPhone.trim()) {
      setErrorMsg(
        'يرجى إدخال رقم هاتف واتساب البحرين'
      );
      return;
    }

    if (
      !regPassword ||
      regPassword.length < 6
    ) {
      setErrorMsg(
        'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل'
      );
      return;
    }

    setIsLoading(true);

    try {
      const res =
        await registerCaptain(
          {
            name: regName.trim(),
            phone: regPhone.trim(),
            password: regPassword,
            vehicleType: regVehicle,
            biometricsEnabled: regBiometrics,
          },
          regActivationCode.trim()
            ? regActivationCode
                .trim()
                .toUpperCase()
            : undefined
        );

      if (res.success && res.user) {
        if (res.user.isActivated) {
          setSuccessMsg(
            `تم إنشاء الحساب وتفعيل الاشتراك بنجاح! أهلاً بك ${res.user.name}`
          );

          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 700);
        } else {
          setSuccessMsg(
            `تم إنشاء الحساب بنجاح، أهلاً بك ${res.user.name}. أدخل كود التفعيل للمتابعة.`
          );

          setTimeout(() => {
            setActivationInput('');
            setTab('activate');
          }, 700);
        }
      } else {
        setErrorMsg(
          res.error ||
            'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.'
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

  // ============================================================
  // BIOMETRIC LOGIN
  // ============================================================

  const handleTriggerBiometrics =
    async () => {
      setErrorMsg('');
      setSuccessMsg('');
      setShowBiometricScanner(true);
      setScannerStatus('scanning');

      if (
        typeof navigator !== 'undefined' &&
        'vibrate' in navigator
      ) {
        try {
          navigator.vibrate([
            40,
            60,
            40,
          ]);
        } catch {}
      }

      try {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, 900)
        );

        const res =
          await authenticateWithBiometrics();

        if (res.success && res.user) {
          setScannerStatus('success');

          if (
            typeof navigator !== 'undefined' &&
            'vibrate' in navigator
          ) {
            try {
              navigator.vibrate(100);
            } catch {}
          }

          setTimeout(() => {
            setShowBiometricScanner(false);

            setSuccessMsg(
              `تم التحقق بنجاح! أهلاً ${res.user!.name}`
            );

            setTimeout(() => {
              onSuccess(res.user!);
              onClose();
            }, 500);
          }, 800);
        } else {
          setScannerStatus('failed');

          setTimeout(() => {
            setShowBiometricScanner(false);

            setErrorMsg(
              res.error ||
                'لم يتم التحقق من الحساب. يمكنك الدخول بكلمة المرور.'
            );
          }, 900);
        }
      } catch (error) {
        setScannerStatus('failed');

        setTimeout(() => {
          setShowBiometricScanner(false);

          setErrorMsg(
            error instanceof Error
              ? error.message
              : 'تعذر التحقق من الحساب'
          );
        }, 900);
      }
    };

  // ============================================================
  // ACTIVATION
  // ============================================================

  const handleApplyActivation =
    async (
      codeToApply?: string
    ) => {
      const targetCode = (
        codeToApply || activationInput
      )
        .trim()
        .toUpperCase();

      if (!targetCode) {
        setErrorMsg(
          'يرجى إدخال كود التفعيل'
        );
        return;
      }

      const currentUser =
        getCurrentUser();

      if (!currentUser) {
        setErrorMsg(
          'يجب تسجيل الدخول أولاً قبل تفعيل الاشتراك'
        );
        setTab('login');
        return;
      }

      setErrorMsg('');
      setSuccessMsg('');
      setIsLoading(true);

      try {
        const res =
          await applyActivationCode(
            currentUser.id,
            targetCode
          );

        if (
          res.success &&
          res.user
        ) {
          setSuccessMsg(
            'مبروك! تم تفعيل اشتراك Orderi بنجاح.'
          );

          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 1000);
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

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">

      {/* ======================================================
          Biometric Scanner
          ====================================================== */}

      {showBiometricScanner && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">

          <div className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-center text-white space-y-5 shadow-2xl relative">

            <button
              type="button"
              onClick={() =>
                setShowBiometricScanner(false)
              }
              className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pt-2">
              <h4 className="text-base font-black">
                مستشعر البصمة الذكي
              </h4>

              <p className="text-xs text-slate-400 mt-1">
                التحقق من جلسة حساب Orderi
              </p>
            </div>

            {/* Fingerprint */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">

              {scannerStatus ===
                'scanning' && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping opacity-50" />

                  <div className="absolute -inset-2 rounded-full border border-emerald-400/20 animate-pulse" />
                </>
              )}

              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  scannerStatus ===
                  'success'
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/40'
                    : scannerStatus ===
                      'failed'
                    ? 'bg-rose-600 text-white ring-4 ring-rose-400/40'
                    : 'bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/50'
                }`}
              >
                {scannerStatus ===
                'success' ? (
                  <CheckCircle2 className="w-12 h-12 animate-in zoom-in" />
                ) : (
                  <Fingerprint className="w-14 h-14 animate-pulse" />
                )}
              </div>
            </div>

            <div className="space-y-1">

              <p
                className={`text-sm font-black ${
                  scannerStatus ===
                  'success'
                    ? 'text-emerald-400'
                    : scannerStatus ===
                      'failed'
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {scannerStatus ===
                  'scanning' &&
                  'ضع إصبعك على مستشعر البصمة...'}

                {scannerStatus ===
                  'success' &&
                  'تم التحقق من الحساب بنجاح!'}

                {scannerStatus ===
                  'failed' &&
                  'تعذر التحقق من الحساب'}
              </p>

              <p className="text-[11px] text-slate-500">
                دخول سريع وآمن
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowBiometricScanner(false)
              }
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              إلغاء والعودة لتسجيل الدخول
            </button>

          </div>
        </div>
      )}

      {/* ======================================================
          Main Auth Card
          ====================================================== */}

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 sm:p-6 text-white text-right relative shrink-0">

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-md shadow-emerald-500/20 shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Orderi Logo"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>

            <div>

              <div className="flex items-center gap-2">

                <h3 className="text-lg font-black tracking-tight text-white">
                  Orderi
                </h3>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                  البحرين 🇧🇭
                </span>

              </div>

              <p className="text-xs text-slate-300 mt-0.5">
                تسجيل الدخول والمصادقة وتفعيل الاشتراك
              </p>

            </div>
          </div>

          {/* Tabs */}

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/10 rounded-2xl mt-4 border border-white/10">

            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 text-center text-xs font-bold rounded-xl transition-all ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              تسجيل الدخول
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 text-center text-xs font-bold rounded-xl transition-all ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              حساب جديد
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('activate');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                tab === 'activate'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-emerald-300 hover:text-emerald-200 hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>كود التفعيل</span>
            </button>

          </div>
        </div>

        {/* Content */}

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">

          {/* Error */}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">

              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />

              <span>{errorMsg}</span>

            </div>
          )}

          {/* Success */}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">

              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />

              <span>{successMsg}</span>

            </div>
          )}

          {/* ==================================================
              LOGIN
              ================================================== */}

          {tab === 'login' && (
            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >

              {/* Phone */}

              <div className="space-y-1.5">

                <label className="text-xs font-bold text-slate-700 block">
                  رقم الهاتف البحريني:
                </label>

                <div className="relative flex items-center">

                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) =>
                      setLoginPhone(
                        e.target.value
                      )
                    }
                    placeholder="3XXXXXXX"
                    dir="ltr"
                    autoComplete="tel"
                    className="w-full pl-4 pr-24 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />

                  <div className="absolute right-3 flex items-center gap-1.5 text-xs font-black text-slate-600 border-l border-slate-200 pl-2.5">
                    <span>🇧🇭 +973</span>
                  </div>

                </div>
              </div>

              {/* Password */}

              <div className="space-y-1.5">

                <div className="flex items-center justify-between">

                  <label className="text-xs font-bold text-slate-700">
                    كلمة المرور:
                  </label>

                  <span className="text-[11px] text-slate-400 font-normal">
                    كلمة المرور الخاصة بحسابك
                  </span>

                </div>

                <div className="relative flex items-center">

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={loginPassword}
                    onChange={(e) =>
                      setLoginPassword(
                        e.target.value
                      )
                    }
                    placeholder="أدخل كلمة المرور..."
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute left-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>
              </div>

              {/* Biometric */}

              <div className="pt-1">

                <button
                  type="button"
                  onClick={
                    handleTriggerBiometrics
                  }
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-emerald-300 text-emerald-950 font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-100/60 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Fingerprint className="w-5 h-5 text-emerald-600" />

                  <span>
                    تسجيل الدخول بالبصمة
                    (Fingerprint / Face ID)
                  </span>
                </button>

              </div>

              {/* Login */}

              <div className="pt-2">

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />

                  <span>
                    {isLoading
                      ? 'جاري الاتصال بالسيرفر...'
                      : 'تسجيل الدخول إلى Orderi'}
                  </span>

                </button>

              </div>

              {/* Server information */}

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">

                <span className="text-[11px] text-slate-500">
                  سيتم التحقق من الحساب والاشتراك
                  عبر سيرفر Orderi
                </span>

              </div>

            </form>
          )}

          {/* ==================================================
              REGISTER
              ================================================== */}

          {tab === 'register' && (
            <form
              onSubmit={handleRegister}
              className="space-y-3.5"
            >

              {/* Name */}

              <div className="space-y-1">

                <label className="text-xs font-bold text-slate-700 block">
                  الاسم الكامل:
                </label>

                <div className="relative flex items-center">

                  <input
                    type="text"
                    value={regName}
                    onChange={(e) =>
                      setRegName(
                        e.target.value
                      )
                    }
                    placeholder="مثال: أحمد العالـي"
                    autoComplete="name"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <User className="w-4 h-4 text-slate-400 absolute left-3.5" />

                </div>
              </div>

              {/* Phone */}

              <div className="space-y-1">

                <label className="text-xs font-bold text-slate-700 block">
                  رقم هاتف واتساب في البحرين:
                </label>

                <div className="relative flex items-center">

                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) =>
                      setRegPhone(
                        e.target.value
                      )
                    }
                    placeholder="3XXXXXXX"
                    dir="ltr"
                    autoComplete="tel"
                    className="w-full pl-4 pr-24 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <div className="absolute right-3 flex items-center gap-1 text-xs font-black text-slate-600 border-l border-slate-200 pl-2">
                    <span>🇧🇭 +973</span>
                  </div>

                </div>
              </div>

              {/* Password */}

              <div className="space-y-1">

                <label className="text-xs font-bold text-slate-700 block">
                  إنشاء كلمة المرور:
                </label>

                <div className="relative flex items-center">

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={regPassword}
                    onChange={(e) =>
                      setRegPassword(
                        e.target.value
                      )
                    }
                    placeholder="6 أحرف أو أرقام على الأقل"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute left-3 text-slate-400 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

              </div>

              {/* Vehicle */}

              <div className="space-y-1.5">

                <label className="text-xs font-bold text-slate-700 block">
                  وسيلة التوصيل:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                  {[
                    {
                      id: 'car' as const,
                      label: 'سيارة',
                      icon: Car,
                    },
                    {
                      id: 'motorcycle' as const,
                      label: 'دراجة نارية',
                      icon: Bike,
                    },
                    {
                      id: 'pickup_minibus' as const,
                      label: 'بيكاب / ميني باص',
                      icon: Bus,
                    },
                    {
                      id: 'six_wheel' as const,
                      label: 'سكسويل',
                      icon: Truck,
                    },
                    {
                      id: 'flatbed' as const,
                      label: 'سطحة',
                      icon: CarTaxiFront,
                    },
                  ].map((v) => {
                    const Icon = v.icon;

                    const isSelected =
                      regVehicle ===
                      v.id;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          setRegVehicle(
                            v.id
                          )
                        }
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-2xs ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isSelected
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        />

                        <span className="text-[11px] font-bold">
                          {v.label}
                        </span>
                      </button>
                    );
                  })}

                </div>
              </div>

              {/* Optional Activation */}

              <div className="space-y-1">

                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">

                  <span>
                    كود التفعيل:
                  </span>

                  <span className="text-[10px] text-slate-500 font-bold">
                    اختياري
                  </span>

                </label>

                <input
                  type="text"
                  value={regActivationCode}
                  onChange={(e) =>
                    setRegActivationCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="مثال: ORD-25425D-FC936B"
                  dir="ltr"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                />

              </div>

              {/* Biometrics */}

              <label className="flex items-center gap-2 cursor-pointer pt-1">

                <input
                  type="checkbox"
                  checked={regBiometrics}
                  onChange={(e) =>
                    setRegBiometrics(
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />

                <span className="text-xs text-slate-700 font-medium">
                  تفعيل تسجيل الدخول السريع بالبصمة
                </span>

              </label>

              {/* Register */}

              <div className="pt-2">

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >

                  <BadgeCheck className="w-4 h-4" />

                  <span>
                    {isLoading
                      ? 'جاري إنشاء الحساب...'
                      : 'إنشاء الحساب'}
                  </span>

                </button>

              </div>

            </form>
          )}

          {/* ==================================================
              ACTIVATION
              ================================================== */}

          {tab === 'activate' && (
            <div className="space-y-4">

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-200 space-y-2">

                <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">

                  <KeyRound className="w-4 h-4 text-emerald-600" />

                  <span>
                    تفعيل اشتراك Orderi
                  </span>

                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  أدخل كود التفعيل المخصص لحسابك.
                  سيتم التحقق من الكود مباشرة عبر
                  سيرفر Orderi.
                </p>

              </div>

              {/* Code */}

              <div className="space-y-1.5">

                <label className="text-xs font-bold text-slate-700 block">
                  أدخل كود التفعيل:
                </label>

                <div className="flex gap-2">

                  <input
                    type="text"
                    value={activationInput}
                    onChange={(e) =>
                      setActivationInput(
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="ORD-XXXXXXXX-XXXXXX"
                    dir="ltr"
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-black text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      void handleApplyActivation()
                    }
                    disabled={
                      isLoading ||
                      !activationInput.trim()
                    }
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading
                      ? 'جاري التحقق...'
                      : 'تفعيل'}
                  </button>

                </div>

              </div>

              {/* WhatsApp */}

              <div className="pt-0.5">

                <a
                  href={
                    ACTIVATION_WHATSAPP_LINK
                  }
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

              {/* Features */}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">

                <span className="font-black text-slate-800 block">
                  بعد التفعيل:
                </span>

                <ul className="space-y-1 text-slate-600 text-[11px]">

                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />

                    <span>
                      فتح ميزات Orderi
                    </span>
                  </li>

                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />

                    <span>
                      حفظ مدة الاشتراك على السيرفر
                    </span>
                  </li>

                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />

                    <span>
                      التحقق من حالة الاشتراك عند الاتصال
                    </span>
                  </li>

                </ul>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}

        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">

          <span>
            Orderi 🇧🇭
          </span>

          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            إغلاق
          </button>

        </div>

      </div>
    </div>
  );
}