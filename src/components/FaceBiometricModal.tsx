import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle, ShieldCheck, SwitchCamera } from 'lucide-react';

interface FaceBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function FaceBiometricModal({
  isOpen,
  onClose,
}: FaceBiometricModalProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCameraStream();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('الوصول إلى الكاميرا غير مدعوم في هذه البيئة');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        throw new Error('تعذر تهيئة عرض الكاميرا');
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      setCameraError('الكاميرا تعمل، لكن محرك مقارنة الوجه المسجّل غير مدمج. لم يتم تسجيل الدخول. استخدم كلمة المرور.');
    } catch (error: unknown) {
      stopCameraStream();
      setCameraError(error instanceof Error ? error.message : 'تعذر تشغيل الكاميرا');
    }
  };

  useEffect(() => {
    if (isOpen) {
      void startCamera(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md"
      dir="rtl"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
        <button
          type="button"
          onClick={() => {
            stopCameraStream();
            onClose();
          }}
          className="absolute left-4 top-4 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-800 text-slate-300"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setFacingMode((mode) => mode === 'user' ? 'environment' : 'user')}
          className="absolute right-4 top-4 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-800 text-slate-300"
          aria-label="تبديل الكاميرا"
        >
          <SwitchCamera className="h-5 w-5" />
        </button>

        <div className="px-8 pt-2 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            <Camera className="h-4 w-4" />
            التحقق بالوجه
          </div>
          <h3 className="text-lg font-black">التحقق من هوية المستخدم</h3>
          <p className="mt-1 text-xs text-slate-400">تشغيل الكاميرا لا يعني نجاح التحقق من الهوية.</p>
        </div>

        <div className="relative h-56 w-56 overflow-hidden rounded-full border-4 border-rose-500 bg-slate-950">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <Camera className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="flex w-full items-start gap-2 rounded-xl border border-amber-700/50 bg-amber-950/40 p-3 text-xs text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            {cameraError ?? 'لا يوجد محرك مقارنة وجه حقيقي أو قالب وجه مسجل في هذه النسخة. لن يتم تسجيل الدخول بالوجه.'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            stopCameraStream();
            onClose();
          }}
          className="min-h-[44px] w-full rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200"
        >
          إلغاء والعودة لتسجيل الدخول بكلمة المرور
        </button>

        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span>لم يتم اعتماد الوجه كوسيلة تحقق في هذه النسخة.</span>
        </div>
      </div>
    </div>
  );
}
