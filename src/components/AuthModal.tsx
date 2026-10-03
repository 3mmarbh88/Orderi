import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Lock,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Car,
  Bike,
  Truck,
  Bus,
  CarTaxiFront,
  X,
  Zap,
  Clock,
  ArrowRight,
  BadgeCheck,
  Smartphone
} from 'lucide-react';
import { CaptainUser, VehicleType } from '../types';
import {
  getCurrentUser,
  setCurrentUser,
  loginWithPhoneAndPassword,
  registerCaptain,
  verifyActivationCode,
  applyActivationCode,
  authenticateWithBiometrics,
  normalizeBahrainPhone,
  ACTIVATION_WHATSAPP_LINK
} from '../utils/authManager';

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CaptainUser) => void;
  initialTab?: 'login' | 'register' | 'activate';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'activate'>(initialTab);
  
  // Login State
  const [loginPhone, setLoginPhone] = useState('39123456');
  const [loginPassword, setLoginPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regVehicle, setRegVehicle] = useState<VehicleType>('car');
  const [regBiometrics, setRegBiometrics] = useState(true);
  const [regActivationCode, setRegActivationCode] = useState('');

  // Activation Tab State
  const [activationInput, setActivationInput] = useState('');
  
  // Feedback state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Biometric Sensor Simulation Overlay
  const [showBiometricScanner, setShowBiometricScanner] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const res = loginWithPhoneAndPassword(loginPhone, loginPassword);
      setIsLoading(false);
      if (res.success && res.user) {
        setSuccessMsg(`أهلاً بك مجدداً، ${res.user.name}! 🚀`);
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || 'فشل تسجيل الدخول');
      }
    }, 300);
  };

  // Handle Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('يرجى إدخال الاسم');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف الواتساب في البحرين');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setErrorMsg('كلمة المرور يجب أن تكون 3 أحرف/أرقام على الأقل');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = registerCaptain(
        {
          name: regName,
          phone: regPhone,
          password: regPassword,
          vehicleType: regVehicle,
          biometricsEnabled: regBiometrics,
        },
        regActivationCode.trim() || undefined
      );
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMsg(`تم إنشاء الحساب بنجاح! مرحباً بك ${res.user.name} 🎉`);
        setTimeout(() => {
          if (!res.user?.isActivated) {
            setTab('activate');
          } else {
            onSuccess(res.user);
            onClose();
          }
        }, 700);
      } else {
        setErrorMsg(res.error || 'فشل إنشاء الحساب');
      }
    }, 400);
  };

  // Handle Biometric Login
  const handleTriggerBiometrics = async () => {
    setErrorMsg('');
    setShowBiometricScanner(true);
    setScannerStatus('scanning');

    // Trigger haptic if on mobile device
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }

    // Realistic biometric scan animation timing
    setTimeout(async () => {
      const res = await authenticateWithBiometrics();
      if (res.success && res.user) {
        setScannerStatus('success');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(100);
          } catch {}
        }
        setTimeout(() => {
          setShowBiometricScanner(false);
          setSuccessMsg(`تم التحقق بالبصمة بنجاح! أهلاً ${res.user!.name} ✨`);
          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 500);
        }, 800);
      } else {
        setScannerStatus('failed');
        setTimeout(() => {
          setShowBiometricScanner(false);
          setErrorMsg(res.error || 'لم يتم التعرف على البصمة، يمكنك الدخول بكلمة المرور');
        }, 1200);
      }
    }, 1200);
  };

  // Handle Activation Code Apply
  const handleApplyActivation = (codeToApply?: string) => {
    const targetCode = (codeToApply || activationInput).trim();
    if (!targetCode) {
      setErrorMsg('يرجى إدخال كود التفعيل');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const currentUser = getCurrentUser();
    const userId = currentUser ? currentUser.id : 'captain-bh-01';

    setTimeout(() => {
      const res = applyActivationCode(userId, targetCode);
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMsg(`مبروك! تم تفعيل رخصة Ordari بنجاح: ${res.user.licensePlan} 🌟`);
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.error || 'كود التفعيل غير صالح، تأكد من الرمز وحاول مجدداً');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Biometric Sensor Scanning Overlay Dialog */}
      {showBiometricScanner && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-center text-white space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowBiometricScanner(false)}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pt-2">
              <h4 className="text-base font-black">مستشعر البصمة الذكي</h4>
              <p className="text-xs text-slate-400 mt-1">المصادقة البيومترية في Ordari</p>
            </div>

            {/* Fingerprint Scanner Visual */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              {scannerStatus === 'scanning' && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping opacity-50" />
                  <div className="absolute -inset-2 rounded-full border border-emerald-400/20 animate-pulse" />
                </>
              )}

              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                scannerStatus === 'success' 
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/40' 
                  : scannerStatus === 'failed'
                  ? 'bg-rose-600 text-white ring-4 ring-rose-400/40'
                  : 'bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/50'
              }`}>
                {scannerStatus === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 animate-in zoom-in" />
                ) : (
                  <Fingerprint className="w-14 h-14 animate-pulse" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className={`text-sm font-black ${
                scannerStatus === 'success' 
                  ? 'text-emerald-400' 
                  : scannerStatus === 'failed' 
                  ? 'text-rose-400' 
                  : 'text-slate-200'
              }`}>
                {scannerStatus === 'scanning' && 'ضع إصبعك على مستشعر البصمة في الهاتف...'}
                {scannerStatus === 'success' && 'تم التحقق من البصمة بنجاح!'}
                {scannerStatus === 'failed' && 'لم يتم التعرف على البصمة'}
              </p>
              <p className="text-[11px] text-slate-500">دخول سريع ومؤمّن بنقرة واحدة</p>
            </div>

            <button
              onClick={() => setShowBiometricScanner(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              إلغاء والعودة لكلمة المرور
            </button>
          </div>
        </div>
      )}

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with App Logo & Branding */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 sm:p-6 text-white text-right relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-md shadow-emerald-500/20 shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="Ordari Logo" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">Ordari</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                  البحرين 🇧🇭
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">تسجيل الدخول، المصادقة بالبصمة، وتفعيل الترخيص</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/10 rounded-2xl mt-4 border border-white/10">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
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
              onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
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
              onClick={() => { setTab('activate'); setErrorMsg(''); setSuccessMsg(''); }}
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

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Alerts / Error feedback */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Phone Input with Bahrain prefix */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">رقم الهاتف (واتساب البحرين):</label>
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="39123456"
                    dir="ltr"
                    className="w-full pl-4 pr-24 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <div className="absolute right-3 flex items-center gap-1.5 text-xs font-black text-slate-600 border-l border-slate-200 pl-2.5">
                    <span>🇧🇭 +973</span>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">كلمة المرور:</label>
                  <span className="text-[11px] text-slate-400 font-normal">رمز الدخول الخاص بك</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Biometric Quick Login Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTriggerBiometrics}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-emerald-300 text-emerald-950 font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-100/60 shadow-xs transition-all active:scale-[0.98]"
                >
                  <Fingerprint className="w-5 h-5 text-emerald-600" />
                  <span>تسجيل الدخول السريع بالبصمة (Fingerprint / Face ID) 👆</span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول إلى رادار Ordari'}</span>
                </button>
              </div>

              {/* Quick Demo Credentials Pill */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[11px] text-slate-500 block">💡 بيانات تجريبية سريعة بنقرة واحدة:</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginPhone('39123456');
                    setLoginPassword('123');
                  }}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  الهاتف: 39123456 | كلمة المرور: 123 (عمار VIP)
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">الاسم الكامل:</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="مثال: أحمد العالي"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                </div>
              </div>

              {/* Bahrain Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">رقم هاتف الواتساب في البحرين:</label>
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="3XXXXXXX"
                    dir="ltr"
                    className="w-full pl-4 pr-24 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="absolute right-3 flex items-center gap-1 text-xs font-black text-slate-600 border-l border-slate-200 pl-2">
                    <span>🇧🇭 +973</span>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">تعيين كلمة المرور:</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="اكتب كلمة مرور سهلة للحفظ..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 text-slate-400 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Vehicle Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">وسيلة التوصيل المعتمدة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'car' as const, label: 'سيارة', icon: Car },
                    { id: 'motorcycle' as const, label: 'موترسيكل', icon: Bike },
                    { id: 'pickup_minibus' as const, label: 'بيكاب ميني باص', icon: Bus },
                    { id: 'six_wheel' as const, label: 'سكسويل', icon: Truck },
                    { id: 'flatbed' as const, label: 'سطحة', icon: CarTaxiFront },
                  ].map((v) => {
                    const Icon = v.icon;
                    const isSelected = regVehicle === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setRegVehicle(v.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-2xs ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <span className="text-[11px] font-bold">{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Activation Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>كود التفعيل (اختياري الآن):</span>
                  <span className="text-[10px] text-emerald-700 font-bold">يمكنك إدخاله لاحقاً</span>
                </label>
                <input
                  type="text"
                  value={regActivationCode}
                  onChange={(e) => setRegActivationCode(e.target.value.toUpperCase())}
                  placeholder="ORDARI-2026-VIP"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Biometrics Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={regBiometrics}
                  onChange={(e) => setRegBiometrics(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium">
                  تفعيل الدخول السريع بالبصمة على هذا الهاتف
                </span>
              </label>

              {/* Submit Registration */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  <BadgeCheck className="w-4 h-4" />
                  <span>{isLoading ? 'جاري التسجيل...' : 'إنشاء الحساب ومتابعة'}</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 3: ACTIVATION CODE */}
          {tab === 'activate' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>كود تفعيل وترخيص برنامج Ordari</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  أدخل كود الترخيص المخصص لك لفتح كافة ميزات رادار سحب الطلبات وفحص الذكاء الاصطناعي على مدار الساعة.
                </p>
              </div>

              {/* Activation Code Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">أدخل كود التفعيل المعتمد:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activationInput}
                    onChange={(e) => setActivationInput(e.target.value.toUpperCase())}
                    placeholder="أدخل كود التفعيل هنا"
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-black text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyActivation()}
                    disabled={isLoading || !activationInput.trim()}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'تفعيل...' : 'تفعيل الآن ✅'}
                  </button>
                </div>
              </div>

              {/* WhatsApp Direct Contact Button to Request Activation Code */}
              <div className="pt-0.5">
                <a
                  href={ACTIVATION_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs sm:text-sm shadow-md shadow-[#25D366]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] group"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform" />
                  <span>تواصل عبر واتساب للحصول على كود التفعيل</span>
                </a>
              </div>

              {/* Features Unlocked Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <span className="font-black text-slate-800 block">الميزات المفعلة عند إدخال الكود:</span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>سحب فوري لكافة طلبات مجموعات واتساب على نفس الهاتف</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فحص الذكاء الاصطناعي بـ Gemini AI لشروط التوصيل</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>العمل في الخلفية واستقبال الإشعارات فوق خرائط Google</span>
                  </li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Ordari 🇧🇭</span>
          <button
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
