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
  Volume2
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendBackgroundOrderNotification,
  isWakeLockSupported,
  requestScreenWakeLock,
  releaseScreenWakeLock
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
      // Send a welcoming test notification
      sendBackgroundOrderNotification({
        id: 'test-welcome',
        from: 'المنامة (السلمانية)',
        to: 'المحرق (البسيتين)',
        price: 2.5,
        rawText: 'طلب تجريبي لتأكيد تفعيل إشعارات الخلفية',
        groupName: 'قروب مناديب البحرين',
        senderName: 'متجر ورود وتوزيعات (VIP)',
        senderPhone: '97339000000',
        receivedAt: new Date(),
        confidence: 1,
        type: 'delivery',
        status: 'pending',
        match: {
          score: 95,
          startMatched: true,
          destinationMatched: true,
          priceMatched: true,
          distanceMatched: true,
          timeMatched: true,
          distanceKm: 4.2,
          statusLabel: 'طلب ممتاز',
          statusColor: 'emerald',
        },
        contactStatus: 'vip',
      });
    } else if (res === 'denied') {
      onShowToast('تم رفض إذن الإشعارات من إعدادات المتصفح');
    }
  };

  const handleSendTestNotification = () => {
    if (permission !== 'granted') {
      handleRequestNotifications();
      return;
    }

    sendBackgroundOrderNotification({
      id: `test-${Date.now()}`,
      from: 'الرفاع الشرقي',
      to: 'مدينة عيسى',
      price: 2.0,
      rawText: 'فحص إشعار الخلفية',
      groupName: 'قروب طلبات سريعة 🇧🇭',
      senderName: 'مطعم مذاق الخليج',
      senderPhone: '97336111222',
      receivedAt: new Date(),
      confidence: 1,
      type: 'delivery',
      status: 'pending',
      match: {
        score: 90,
        startMatched: true,
        destinationMatched: true,
        priceMatched: true,
        distanceMatched: true,
        timeMatched: true,
        distanceKm: 3.5,
        statusLabel: 'طلب ممتاز',
        statusColor: 'emerald',
      },
      contactStatus: 'vip',
    });

    onShowToast('تم إرسال إشعار تجريبي! يمكنك تجربة تصغير الشاشة لمعاينته');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 text-right my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">تشغيل الرادار في الخلفية (Background Mode)</h2>
              <p className="text-xs text-slate-500 mt-0.5">استقبل تنبيهات الطلبات وأنت تستخدم واتساب أو خرائط Google</p>
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
              {permission !== 'granted' ? (
                <button
                  onClick={handleRequestNotifications}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all"
                >
                  تفعيل الإشعارات الآن
                </button>
              ) : (
                <button
                  onClick={handleSendTestNotification}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>إرسال تجربة</span>
                </button>
              )}
            </div>
          </div>
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
