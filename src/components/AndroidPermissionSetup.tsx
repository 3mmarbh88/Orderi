import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, ShieldCheck, Smartphone, Settings, Accessibility } from 'lucide-react';
import { OrderiNotificationListener } from '../native/orderiNotificationListener';

interface AndroidPermissionSetupProps {
  onComplete: () => void;
}

type PermissionState = {
  notification: boolean;
  accessibility: boolean;
  checking: boolean;
  error: string | null;
};

export function AndroidPermissionSetup({ onComplete }: AndroidPermissionSetupProps) {
  const [permissions, setPermissions] = useState<PermissionState>({
    notification: false,
    accessibility: false,
    checking: true,
    error: null,
  });
  const completedRef = useRef(false);

  const refreshPermissions = useCallback(async () => {
    try {
      const diagnostic = await OrderiNotificationListener.getDiagnosticStatus?.();
      const [notification, accessibility] = diagnostic
        ? [!!diagnostic.listenerEnabled, !!diagnostic.accessibilityEnabled]
        : await Promise.all([
            OrderiNotificationListener.isEnabled().then((value) => !!value.enabled),
            OrderiNotificationListener.isAccessibilityEnabled().then((value) => !!value.enabled),
          ]);

      setPermissions({ notification, accessibility, checking: false, error: null });
      if (notification && accessibility && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    } catch (error: any) {
      setPermissions((current) => ({
        ...current,
        checking: false,
        error: error?.message || 'تعذر التحقق من صلاحيات Android. أعد المحاولة.',
      }));
    }
  }, [onComplete]);

  useEffect(() => {
    void refreshPermissions();
    const handleResume = () => {
      if (document.visibilityState === 'visible') void refreshPermissions();
    };
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);
    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [refreshPermissions]);

  const openNotificationSettings = async () => {
    try {
      await OrderiNotificationListener.openSettings();
    } catch (error: any) {
      setPermissions((current) => ({ ...current, error: error?.message || 'تعذر فتح إعدادات الإشعارات.' }));
    }
  };

  const openAccessibilitySettings = async () => {
    try {
      await OrderiNotificationListener.openAccessibilitySettings();
    } catch (error: any) {
      setPermissions((current) => ({ ...current, error: error?.message || 'تعذر فتح إعدادات إمكانية الوصول.' }));
    }
  };

  const PermissionCard = ({
    enabled,
    title,
    description,
    buttonLabel,
    onClick,
    icon,
  }: {
    enabled: boolean;
    title: string;
    description: string;
    buttonLabel: string;
    onClick: () => void;
    icon: React.ReactNode;
  }) => (
    <section className={`rounded-2xl border p-4 space-y-3 ${enabled ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
          {enabled ? <CheckCircle2 className="w-5 h-5" /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black text-slate-900">{title}</h2>
            <span className={`text-xs font-bold ${enabled ? 'text-emerald-700' : 'text-amber-700'}`}>
              {enabled ? 'مفعّلة' : 'مطلوبة'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      {!enabled && (
        <button type="button" onClick={onClick} className="w-full min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2">
          <Settings className="w-4 h-4" />
          {buttonLabel}
        </button>
      )}
    </section>
  );

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl bg-slate-50 p-5 sm:p-7 shadow-2xl space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900">إعداد صلاحيات Orderi</h1>
          <p className="text-sm leading-6 text-slate-600">
            لإتاحة استقبال طلبات واتساب ومتابعتها، فعّل الصلاحيتين التاليتين مرة واحدة من إعدادات هاتفك.
          </p>
        </div>

        <PermissionCard
          enabled={permissions.notification}
          title="السماح بقراءة الإشعارات"
          description="يسمح لـ Orderi بقراءة إشعارات واتساب لاستقبال الرسائل والطلبات الجديدة."
          buttonLabel="تفعيل صلاحية قراءة الإشعارات"
          onClick={() => void openNotificationSettings()}
          icon={<Bell className="w-5 h-5" />}
        />
        <PermissionCard
          enabled={permissions.accessibility}
          title="تفعيل إمكانية الوصول"
          description="تتيح خدمة Orderi تنفيذ خطوات واتساب المصرّح بها، مثل فتح المحادثة والتعامل مع الواجهة عند طلبك."
          buttonLabel="فتح إعدادات إمكانية الوصول"
          onClick={() => void openAccessibilitySettings()}
          icon={<Accessibility className="w-5 h-5" />}
        />

        {permissions.error && (
          <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">{permissions.error}</p>
        )}

        <button
          type="button"
          onClick={() => void refreshPermissions()}
          disabled={permissions.checking}
          className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-sm disabled:opacity-50"
        >
          {permissions.checking ? 'جارٍ التحقق...' : 'تحقق من الصلاحيات'}
        </button>

        <p className="text-[11px] leading-5 text-slate-500 text-center">
          سيعود Orderi تلقائياً إلى هذه الشاشة بعد الرجوع من الإعدادات. لا يستطيع التطبيق منح الصلاحيات نيابةً عنك؛ يجب تأكيدها من Android.
        </p>
      </div>
    </main>
  );
}
