import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Scan, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Fingerprint, 
  SwitchCamera,
  Eye,
  Smile
} from 'lucide-react';
import { CaptainUser } from '../types';
import { getCurrentUser, setCurrentUser as setStoredCurrentUser } from '../utils/authManager';
import { playAlertTone, triggerCustomVibration } from '../utils/sound';

interface FaceBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CaptainUser) => void;
}

export function FaceBiometricModal({
  isOpen,
  onClose,
  onSuccess,
}: FaceBiometricModalProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [scanStage, setScanStage] = useState<'initializing' | 'detecting' | 'aligning' | 'analyzing' | 'matched' | 'failed'>('initializing');
  const [matchScore, setMatchScore] = useState(0);
  const [statusText, setStatusText] = useState('جاري تشغيل الكاميرا الأمامية...');
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Start the real camera. Camera availability is not face authentication.
  const startCamera = async (mode: 'user' | 'environment' = 'user') => {
    stopCameraStream();
    setCameraError(null);
    setScanStage('initializing');
    setStatusText('جاري تشغيل الكاميرا؛ لم يتم التحقق من الهوية بعد...');
    setMatchScore(0);
    setIsSimulatedMode(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('الوصول إلى الكاميرا غير مدعوم في هذه البيئة');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error('تعذر تهيئة عرض الكاميرا');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      setScanStage('failed');
      setStatusText('الكاميرا تعمل، لكن محرك مقارنة الوجه المسجّل غير مدمج. لم يتم تسجيل الدخول.');
      setCameraError('لا يمكن استخدام حركة مسح أو صورة الكاميرا وحدها لإثبات الهوية. سجّل الدخول بكلمة المرور.');
    } catch (err: any) {
      stopCameraStream();
      setCameraActive(false);
      setScanStage('failed');
      const message = err?.message || 'تعذر تشغيل الكاميرا';
      setCameraError(message);
      setStatusText('فشل تشغيل الكاميرا؛ تم رفض تسجيل الدخول بالوجه.');
    }
  };

  // This app currently has no enrolled face template or verified matching engine.
  // Keep this function fail-closed instead of simulating a successful match.
  const startBiometricFaceAnalysis = () => {
    setScanStage('failed');
    setMatchScore(0);
    setStatusText('التحقق بالوجه غير مهيأ. استخدم تسجيل الدخول بكلمة المرور.');
  };

  const finalizeSuccessfulFaceMatch = (_simulated: boolean) => {
    setScanStage('failed');
    setMatchScore(0);
    setStatusText('تم رفض الدخول: لا توجد نتيجة مقارنة وجه موثّقة.');
    setCameraError('تسجيل الدخول لم يتم. استخدم كلمة المرور حتى يتم دمج محرك تحقق وجه حقيقي.');
  };

  // Toggle front/back camera
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div 
        className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 text-white space-y-4 shadow-2xl relative flex flex-col items-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            stopCameraStream();
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer z-20 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Flip Camera Button */}
        {!isSimulatedMode && (
          <button
            type="button"
            onClick={handleToggleCamera}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer z-20 min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 text-xs"
            title="تبديل الكاميرا (الأمامية / الخلفية)"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>
        )}

        {/* Title */}
        <div className="text-center pt-1 px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Scan className="w-3.5 h-3.5" />
            <span>بصمة الوجه الذكية Face ID بالكاميرا 🇧🇭</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            التحقق البيومتري من هوية الكابتن
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ضع وجهك داخل الإطار الدائري لمطابقة الملامح والدخول الفوري
          </p>
        </div>

        {/* Camera / Biometric Scan Viewport */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-1 flex items-center justify-center">
          {/* Outer Pulsing Radar Rings */}
          <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-500 ${
            scanStage === 'matched' 
              ? 'border-emerald-500 animate-ping opacity-30' 
              : 'border-emerald-500/30 animate-pulse'
          }`} />
          <div className="absolute -inset-3 rounded-full border border-emerald-500/20" />

          {/* Oval Circular Mask Container */}
          <div className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 shadow-2xl transition-all duration-300 bg-slate-950 flex items-center justify-center ${
            scanStage === 'matched'
              ? 'border-emerald-400 ring-8 ring-emerald-500/30 shadow-emerald-500/40'
              : scanStage === 'failed'
              ? 'border-rose-500 ring-8 ring-rose-500/30 shadow-rose-500/40'
              : 'border-emerald-500/80 ring-4 ring-emerald-500/20 shadow-emerald-500/20'
          }`}>
            {/* Live Camera Stream Video */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover transform ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              } ${isSimulatedMode ? 'hidden' : 'block'}`}
            />

            {/* Camera failures never fall back to a simulated face. */}
            {/* Target Reticle Brackets (Corners) */}
            <div className="absolute inset-4 pointer-events-none">
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
            </div>

            {/* Facial Landmark Nodes (High-Tech Mesh Points) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-36 h-36 opacity-75 animate-pulse" viewBox="0 0 100 100">
                {/* Eyes, Nose, Mouth Biometric Target Points */}
                <circle cx="35" cy="38" r="2.5" fill="#10b981" />
                <circle cx="65" cy="38" r="2.5" fill="#10b981" />
                <circle cx="50" cy="52" r="2" fill="#34d399" />
                <circle cx="40" cy="68" r="2" fill="#10b981" />
                <circle cx="60" cy="68" r="2" fill="#10b981" />
                <circle cx="50" cy="72" r="2" fill="#10b981" />
                {/* Connecting delicate biometric wires */}
                <line x1="35" y1="38" x2="50" y2="52" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="65" y1="38" x2="50" y2="52" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="50" y1="52" x2="40" y2="68" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="50" y1="52" x2="60" y2="68" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2,2" />
              </svg>
            </div>

            {/* Vertical Laser Scan Beam */}
            <div className="w-full rounded-xl bg-amber-950/40 border border-amber-700/50 p-3 text-xs text-amber-200">
            لا توجد مقارنة وجه حقيقية في هذه النسخة؛ لم يتم تسجيل الدخول. استخدم كلمة المرور.
          </div>

          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            إلغاء والعودة لتسجيل الدخول بكلمة المرور
          </button>
        </div>

        {/* Security Trust Footnote */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>تشفير بيومتري محلي داخل عتاد الهاتف معتمد من نظام Orderi 🇧🇭</span>
        </div>
      </div>
    </div>
  );
}
