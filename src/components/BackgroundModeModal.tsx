import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Sun, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Radio, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Volume2,
  RefreshCw,
  Lock
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendBackgroundOrderNotification,
  isWakeLockSupported,
  requestScreenWakeLock,
  releaseScreenWakeLock,
  isInIframe
} from '../utils/backgroundManager';
import { PWAInstallButton } from './PWAInstallButton';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface BackgroundModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  keepScreenAwake: boolean;
  onToggleKeepScreenAwake: (enabled: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const BackgroundModeModal: React.FC<BackgroundModeModalProps> = ({
  isOpen,
  onClose,
  keepScreenAwake,
  onToggleKeepScreenAwake,
  onShowToast,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [isWakeLockActive, setIsWakeLockActive] = useState(keepScreenAwake);
  const { isInstalled } = usePWAInstall();

  useEffect(() => {
    setPermission(getNotificationPermission());
    setIsWakeLockActive(keepScreenAwake);
  }, [isOpen, keepScreenAwake]);

  if (!isOpen) return null;

  const handleRequestNotifications = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      onShowToast('تم تفعيل إشعارات الخلفية بنجاح! ستصلك التنبيهات أثناء استخدام التطبيقات الأخرى');
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🔔 رادار أورداري جاهز في الخلفية', {
            body: 'خدمة التنبيهات تعمل بنجاح. ستتلقى إشعاراً فورياً عند وصول أي طلب حقيقي مطابق.',
            icon: '/logo.png',
          });
        } catch {}
      }
    } else if (res === 'denied') {
      onShowToast('تم رفض إذن الإشعارات من إعدادات المتصفح');
    }
  };

  const handleCheckPermissionAgain = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const current = Notification.permission;
      setPermission(current);
      if (current === 'granted') {
        onShowToast('🎉 ممتاز! تم فك الحظر وتفعيل الإشعارات بنجاح');
        handleSendTestNotification();
      } else {
        onShowToast('⚠️ لا تزال الإشعارات محظورة. يرجى الضغط على القفل 🔒 أعلى المتصفح وتغييرها إلى سماح');
      }
    }
  };

  const handleSendTestNotification = () => {
    if (permission !== 'granted') {
      handleRequestNotifications();
      return;
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 فحص تنبيهات الرادار الحية', {
          body: 'نظام الإشعارات يعمل بكفاءة في الخلفية.',
          icon: '/logo.png',
        });
        onShowToast('تم إرسال إشعار تأكيدي لجهازك بنجاح');
      } catch {
        onShowToast('تعذر إظهار الإشعار عبر النظام');
      }
    }
  };

  const handleToggleWakeLock = async () => {
    const next = !isWakeLockActive;
    setIsWakeLockActive(next);
    onToggleKeepScreenAwake(next);

    if (next) {
      const success = await requestScreenWakeLock();
      if (success) {
        onShowToast('تم تفعيل منع قفل الشاشة أثناء تشغيل الرادار');
      } else {
        onShowToast('عذراً، هذا الجهاز أو المتصفح لا يدعم ميزة Screen Wake Lock');
      }
    } else {
      await releaseScreenWakeLock();
      onShowToast('تم إيقاف منع قفل الشاشة');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 sm:space-y-6 text-right max-h-[92vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-2" />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">تشغيل الرادار في الخلفية</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">استقبل تنبيهات الطلبات وأنت تستخدم واتساب أو خرائط Google</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature 1: System Notifications */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                permission === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {permission === 'granted' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">إشعارات النظام المنبثقة</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    permission === 'granted' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : permission === 'denied' 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {permission === 'granted' ? 'مفعّلة ومستعدة ✅' : permission === 'denied' ? 'محظورة بالمتصفح 🚫' : 'تحتاج إذن ⚠️'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  ظهور إشعار منبثق فوق أي تطبيق على هاتفك عند رصد طلب مطابق لموقعك أو من متجر VIP، مع صوت التنبيه.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {permission === 'granted' ? (
                <button
                  onClick={handleSendTestNotification}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>إرسال تجربة ✅</span>
                </button>
              ) : permission === 'denied' ? (
                <button
                  onClick={handleCheckPermissionAgain}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>فحص الإذن 🔄</span>
                </button>
              ) : (
                <button
                  onClick={handleRequestNotifications}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  تفعيل الإشعارات الآن
                </button>
              )}
            </div>
          </div>

          {/* Blocked Permission Guide & Fix Steps */}
          {permission === 'denied' && (
            <div className="mt-3 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200/90 text-xs space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>لماذا تظهر «محظورة بالمتصفح 🚫» وكيف تفك الحظر؟</span>
              </div>

              {isInIframe() ? (
                <div className="space-y-2 text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                  <p className="bg-amber-100/80 p-2.5 rounded-xl border border-amber-300/80 text-amber-900 font-medium">
                    ⚠️ <strong>أنت تتصفح المعاينة المضمنة (iFrame):</strong> متصفحات الويب (Chrome و Safari) تمنع النوافذ المضمنة أمنياً من طلب إذن الإشعارات وتعتبرها محظورة تلقائياً.
                  </p>
                  <p className="text-slate-600">
                    للحصول على إشعارات النظام الحقيقية كاملة، اضغط الزر أدناه لفتح التطبيق في صفحة مستقلة كاملة أو قم بتثبيته كتطبيق على شاشة هاتفك:
                  </p>
                  <div className="pt-1">
                    <a
                      href={typeof window !== 'undefined' ? window.location.href : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      <span>فتح التطبيق في نافذة مستقلة جديدة ↗</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
                    قام متصفح هاتفك (Chrome أو Safari) بحفظ خيار «حظر الإشعارات» سابقاً لهذا الموقع. ولحماية الخصوصية، يمنع المتصفح التطبيق برمجياً من إظهار نافذة الطلب مجدداً حتى تقوم بفك الحظر يدوياً في ثوانٍ:
                  </p>

                  <div className="bg-white p-3 rounded-xl border border-rose-200/80 space-y-1.5 text-[11px]">
                    <span className="font-bold text-slate-800 block text-xs">خطوات فك الحظر في متصفح الهاتف (3 خطوات):</span>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed font-medium">
                      <li>
                        اضغط على أيقونة <strong>القفل أو الضبط 🔒</strong> بجانب رابط الموقع في شريط العناوين أعلى الشاشة.
                      </li>
                      <li>
                        اختر <strong>«أذونات الموقع» (Permissions / Site settings)</strong>.
                      </li>
                      <li>
                        اضغط على <strong>«الإشعارات» (Notifications)</strong> وغيّرها من "حظر" إلى <strong>«سماح» (Allow)</strong>.
                      </li>
                      <li>
                        ارجع هنا واضغط على زر <strong>«إعادة فحص الإذن 🔄»</strong> وسيعمل فوراً!
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  onClick={handleCheckPermissionAgain}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة فحص الإذن الآن 🔄</span>
                </button>

                <button
                  onClick={handleSendTestNotification}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>تجربة الصوت والاهتزاز 🔔</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature 2: Screen Wake Lock */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isWakeLockActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
              }`}>
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">إبقاء الشاشة مضاءة أثناء القيادة</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  منع شاشة الهاتف من القفل أو التعتيم التلقائي أثناء تثبيت الهاتف في السيارة ومراقبة الرادار.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleWakeLock}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isWakeLockActive ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isWakeLockActive ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Feature 3: PWA Standalone Installation */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">تثبيت التطبيق على الشاشة الرئيسية (PWA)</h4>
                  {isInstalled && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      مثبت بالفعل
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  تشغيل Ordari كتطبيق مستقل وسريع بأيقونة مخصصة وبدون أشرطة المتصفح لتجربة ملاحة سلسة.
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <PWAInstallButton variant="hero" />
            </div>
          </div>
        </div>

        {/* Driver Pro Tips */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs text-amber-950">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>نصائح لضمان عمل الرادار باستمرار أثناء القيادة والتنقل:</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-amber-900/90 pr-1">
            <li><strong>تطبيق واتساب:</strong> يمكنك تصغير نافذة Ordari وفتح واتساب بحرية؛ ستظهر لك إشعارات الطلبات المطابقة فوراً أعلى الشاشة.</li>
            <li><strong>نظام Android:</strong> يفضل إلغاء خيار «تحسين البطارية / Battery Saver» لمتصفحك لمنع النظام من تجميد التبويبات بالخلفية.</li>
            <li><strong>نظام iOS (iPhone):</strong> اترك تبويب Ordari مفتوحاً في الخلفية ولا تغلقه من قائمة التطبيقات النشطة لضمان استمرار رصد الرسائل.</li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            إغلاق ومتابعة الرادار
          </button>
        </div>

      </div>
    </div>
  );
};
