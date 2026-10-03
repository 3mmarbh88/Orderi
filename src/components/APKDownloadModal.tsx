import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Globe,
  BatteryCharging,
  BellRing,
  FileDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface APKDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const APKDownloadModal: React.FC<APKDownloadModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'direct_apk' | 'builder_apk' | 'macrodroid'>('direct_apk');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMacroLink, setCopiedMacroLink] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://orderi-radar.app';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://orderi-radar.app';
  const listenerEndpoint = `${currentOrigin}/api/android/notifications`;
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?url=${encodeURIComponent(currentUrl)}`;

  const handleInstallWebAPK = async () => {
    setIsInstalling(true);
    try {
      const outcome = await install();
      if (outcome) {
        onShowToast('🎉 تم بدء تثبيت التطبيق الأصلي على هاتفك بنجاح!');
        onClose();
      } else {
        onShowToast('يرجى النقر على خيارات المتصفح (⋮) ثم اختيار "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
      }
    } catch {
      onShowToast('يرجى النقر على خيارات المتصفح (⋮) ثم اختيار "تثبيت التطبيق"');
    } finally {
      setIsInstalling(false);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'macro') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      onShowToast('تم نسخ الرابط بنجاح');
    } else {
      setCopiedMacroLink(true);
      setTimeout(() => setCopiedMacroLink(false), 2000);
      onShowToast('تم نسخ رابط الرصد بنجاح');
    }
  };

  // Generate and download Manifest & Configuration file
  const handleDownloadManifest = () => {
    const manifestData = {
      name: "Ordari - رادار طلبات التوصيل البحرين",
      short_name: "Ordari",
      description: "نظام ذكي لمراقبة وتصفية طلبات التوصيل ومطابقتها مع موقع السائق وشروطه في البحرين عبر مجموعات واتساب.",
      start_url: "/",
      display: "standalone",
      background_color: "#F4F6FB",
      theme_color: "#059669",
      orientation: "portrait",
      dir: "rtl",
      lang: "ar",
      scope: "/",
      categories: ["business", "productivity", "utilities"],
      icons: [
        {
          src: `${currentOrigin}/pwa-192x192.png`,
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: `${currentOrigin}/pwa-512x512.png`,
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: `${currentOrigin}/pwa-maskable-512x512.png`,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Ordari-manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('📦 تم تنزيل ملف تهيئة الأندرويد Ordari-manifest.json');
  };

  // Generate download of MacroDroid Action JSON template
  const handleDownloadMacroTemplate = () => {
    const macroConfig = {
      name: "Ordari WhatsApp Radar Real Listener",
      description: "يرصد إشعارات مجموعات ومحادثات واتساب ويرسلها لحظياً إلى رادار Ordari",
      targetWebhook: listenerEndpoint,
      instructions: [
        "افتح تطبيق MacroDroid على هاتفك الأندرويد",
        "اختر إضافة ماكرو جديد (Add Macro)",
        "المشغل (Trigger): Notification Received -> WhatsApp / WhatsApp Business",
        "الإجراء (Action): HTTP Request -> POST -> URL: " + listenerEndpoint,
        "Body format: JSON مع تمرير { text: [not_text], sender: [not_title], timestamp: [timestamp] }"
      ]
    };

    const blob = new Blob([JSON.stringify(macroConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Ordari_WhatsApp_Listener_Config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('📥 تم تنزيل إعدادات الربط بتطبيق MacroDroid');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">تشغيل وتثبيت التطبيق على الهاتف (APK)</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
                  Android APK 🇧🇭
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">العمل الفعلي في الخلفية وإلغاء المحاكاة لتلقي طلبات الواتساب الحقيقية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('direct_apk')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 ${
              activeTab === 'direct_apk'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>1. تثبيت أصلي فوري (WebAPK بضغطة زر)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">الأسرع ⚡</span>
          </button>

          <button
            onClick={() => setActiveTab('builder_apk')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 ${
              activeTab === 'builder_apk'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. توليد وتحميل ملف .APK مستقل</span>
          </button>

          <button
            onClick={() => setActiveTab('macrodroid')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 ${
              activeTab === 'macrodroid'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>3. ربط إشعارات الواتساب بهاتفك (MacroDroid)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: Direct WebAPK Install */}
          {activeTab === 'direct_apk' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-black text-emerald-950 flex items-center gap-2">
                      <span>تثبيت تطبيق Ordari مباشرة على شاشة الهاتف</span>
                      <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-lg">WebAPK أصلي</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      يقوم نظام أندرويد و Google Chrome بتجميع وحزم التطبيق فوراً إلى ملف تطبيق أصلي مستقل يُثبت على هاتفك مثل أي تطبيق من متجر Play.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">واجهة كاملة الشاشة بدون شريط متصفح</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                    <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">إشعارات صوتية واهتزاز فور وصول أي طلب</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                    <BatteryCharging className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">وضع العمل بالخلفية وإبقاء الشاشة مضاءة أثناء القيادة</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">تحديث تلقائي وفوري بدون إعادة تثبيت</span>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="pt-3">
                  {isInstalled ? (
                    <div className="p-4 rounded-2xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-black text-xs flex items-center justify-center gap-2 shadow-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      <span>التطبيق مثبت بالفعل على جهازك في الوضع الأصلي المستقل!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleInstallWebAPK}
                      disabled={isInstalling}
                      className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-5 h-5" />
                      <span>{isInstalling ? 'جاري التثبيت...' : 'تثبيت التطبيق على هاتفي الأندرويد الآن 📲'}</span>
                    </button>
                  )}
                </div>

                {/* Android Manual Install Instructions fallback */}
                <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-slate-900">
                    <span>💡 إذا لم يظهر زر التثبيت التلقائي في متصفحك:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pr-1">
                    <li>اضغط على زر الخيارات (⋮) أعلى أو أسفل متصفح Chrome أو Samsung Internet.</li>
                    <li>اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                    <li>ستظهر لك نافذة تأكيد التثبيت كـ APK رسمي ويُضاف للأيقونات بجوار واتساب.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Standalone .APK Generator (PWABuilder / Capacitor) */}
          {activeTab === 'builder_apk' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">توليد وتحميل ملف APK مخصص للأندرويد (.apk)</h4>
                    <p className="text-xs text-slate-500">تحويل الرابط إلى ملف تثبيت أندرويد قياسي قابل للمشاركة والتثبيت دون متصفح</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  يمكنك استخدام أداة <strong>PWABuilder</strong> الرسمية من Microsoft لتوليد حزمة <strong>Ordari.apk</strong> صالحة لجميع هواتف أندرويد أو نشرها على متجر Google Play:
                </p>

                {/* Step 1: PWABuilder Button */}
                <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">الخطوة 1: توليد الـ APK بضغطة واحدة أونلاين</span>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">مجاني ورسمي</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    سيتم فتح موقع PWABuilder مع عنوان تطبيق Ordari المباشر، ما عليك سوى النقر على <strong>Package for Android</strong> ثم <strong>Download APK</strong>.
                  </p>
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح أداة توليد الـ APK (PWABuilder) الآن 🚀</span>
                  </a>
                </div>

                {/* Step 2: Download Manifest Package */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">الخطوة 2: تحميل ملفات التهيئة والأيقونات للمطورين</span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Capacitor / TWA</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    إذا أردت تجميع التطبيق محلياً عبر Android Studio أو Capacitor:
                  </p>
                  <button
                    onClick={handleDownloadManifest}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>تحميل ملف Ordari-manifest.json 📦</span>
                  </button>
                </div>

                {/* Android Install Tip */}
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium space-y-1">
                  <span className="font-bold flex items-center gap-1 text-amber-950">
                    ⚠️ تنبيه عند تثبيت ملف الـ APK اليدوي:
                  </span>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    قد يطلب هاتفك تفعيل خيار <strong>«السماح بتثبيت التطبيقات من مصادر غير معروفة» (Install Unknown Apps)</strong> في إعدادات الأمان لمرة واحدة، وهو إجراء أمان طبيعي عند تثبيت أي تطبيق من خارج متجر Play.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Real Notification Listener with MacroDroid */}
          {activeTab === 'macrodroid' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">الربط الحقيقي بإشعارات واتساب عبر MacroDroid</h4>
                    <p className="text-xs text-emerald-800">قراءة كافة طلبات مجموعات وخاص الواتساب بالثانية في الخلفية</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  لكي يعمل التطبيق <strong>بالشكل الحقيقي الكامل</strong>، يتم ربطه بتطبيق <strong>MacroDroid</strong> (المتوفر مجاناً بمتجر Google Play). عندما يصلك أي إشعار طلب في مجموعات واتساب، يقوم بنقله فوراً للرادار ليقوم بتحليله وتنبيهك صوتياً!
                </p>

                {/* Endpoint copy box */}
                <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-emerald-200">
                  <span className="text-xs font-bold text-slate-700">رابط استقبال الإشعارات الخاص برادارك:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 break-all select-all">
                      {listenerEndpoint}
                    </div>
                    <button
                      onClick={() => copyToClipboard(listenerEndpoint, 'macro')}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      {copiedMacroLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>نسخ</span>
                    </button>
                  </div>
                </div>

                {/* Quick MacroDroid Template Download */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDownloadMacroTemplate}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل قالب الماكرو الجاهز (JSON) 📥</span>
                  </button>

                  <a
                    href="https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>تحميل تطبيق MacroDroid من Play</span>
                  </a>
                </div>

                {/* Easy setup steps */}
                <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                  <span className="font-bold text-slate-900">طريقة الإعداد السريع (دقيقة واحدة):</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pr-1">
                    <li>ثبّت تطبيق MacroDroid من متجر Play وأعطه إذن قراءة الإشعارات.</li>
                    <li>اختر <strong>Add Macro</strong> واجعل المشغل (Trigger) هو إشعار من <strong>WhatsApp</strong>.</li>
                    <li>اجعل الإجراء (Action) إرسال طلب <strong>HTTP POST</strong> إلى رابط الرادار أعلاه.</li>
                    <li>الآن سيعمل الرادار في الخلفية بشكل حقيقي وتلقائي 100%!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>نظام التشغيل الحقيقي جاهز ومفعّل</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
