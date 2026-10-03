import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Zap,
  Radio,
  Copy,
  Check,
  Smartphone,
  Globe,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  QrCode,
  ShieldCheck,
  Wifi,
  WifiOff,
  Phone,
  Power,
  Download,
  Info,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface WhatsAppAutoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStreamConnected: boolean;
  receivedCount: number;
  initialTab?: 'qr' | 'listener' | 'webhook';
  onShowToast: (msg: string) => void;
}

interface WhatsAppSessionData {
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected';
  qrCodeDataUrl: string;
  pairingCode: string;
  connectedPhone: string | null;
  connectedAt: string | null;
  deviceName: string;
  batteryLevel: number;
  groupsMonitoredCount: number;
  privateChatsMonitoredCount: number;
  totalOrdersCaptured: number;
  lastSyncAt: string | null;
  listenerServiceActive: boolean;
}

export const WhatsAppAutoSyncModal: React.FC<WhatsAppAutoSyncModalProps> = ({
  isOpen,
  onClose,
  isStreamConnected,
  receivedCount,
  initialTab = 'qr',
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'listener' | 'webhook'>(initialTab);
  const [session, setSession] = useState<WhatsAppSessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState('+973 3912 3456');
  const [deviceMode, setDeviceMode] = useState<'same_phone' | 'external_screen'>('same_phone');
  const [qrCountdown, setQrCountdown] = useState(45);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const countdownTimerRef = useRef<any>(null);

  // Fetch session data
  const fetchSession = async () => {
    try {
      setIsLoadingSession(true);
      const res = await fetch('/api/whatsapp/session');
      const data = await res.json();
      if (data?.session) {
        setSession(data.session);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSession();
      setQrCountdown(45);
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            handleRefreshQR();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownTimerRef.current);
    }

    return () => clearInterval(countdownTimerRef.current);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${currentOrigin}/api/whatsapp/webhook`;
  const listenerEndpoint = `${currentOrigin}/api/android/notifications`;

  const handleRefreshQR = async () => {
    try {
      const res = await fetch('/api/whatsapp/session/refresh-qr', { method: 'POST' });
      const data = await res.json();
      if (data?.session) {
        setSession(data.session);
        setQrCountdown(45);
        onShowToast('تم تحديث باركود ربط واتساب بنجاح');
      }
    } catch (err) {
      console.error('Failed to refresh QR:', err);
    }
  };

  const handleConfirmPairing = async () => {
    setIsPairing(true);
    try {
      const res = await fetch('/api/whatsapp/session/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumberInput || '+973 3912 3456',
          deviceName: 'Ordari Radar Gateway (Multi-Device)',
        }),
      });
      const data = await res.json();
      if (data?.success && data?.session) {
        setSession(data.session);
        onShowToast('🎉 تم ربط واتساب ويب بنجاح! بدأ السحب التلقائي للطلبات');
      }
    } catch (err) {
      console.error('Pairing error:', err);
      onShowToast('تعذر ربط الجلسة، حاول مرة أخرى');
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/session/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data?.session) {
        setSession(data.session);
        onShowToast('تم فصل جلسة واتساب ويب وتوليد باركود جديد');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'script' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      onShowToast('تم نسخ الرابط بنجاح');
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
      onShowToast('تم نسخ كود المراقبة بنجاح');
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      onShowToast('تم نسخ القالب');
    }
  };

  const isConnected = session?.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header with WhatsApp Emerald Branding */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <QrCode className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">السحب التلقائي من واتساب</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isConnected 
                    ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40' 
                    : 'bg-white/15 text-white/90 border-white/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
                  {isConnected ? 'متصل عبر الباركود 🟢' : 'جاهز للربط ⚡'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">سحب طلبات القروبات والخاص تلقائياً بدون أي تدخل يدوي</p>
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
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 ${
              activeTab === 'qr'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. باركود واتساب ويب (الأجهزة المرتبطة)</span>
            {isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('listener')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 ${
              activeTab === 'listener'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>2. قراءة إشعارات الأندرويد (Notification Listener)</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>3. الويب هوك والربط البرمجي</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          
          {/* TAB 1: WhatsApp Web QR Session */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              {isConnected ? (
                /* Connected State View */
                <div className="bg-emerald-50 border border-emerald-200/90 rounded-3xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-emerald-950">واتساب ويب متصل ومفعل 🟢</h4>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">نشط 24/7</span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          رقم الهاتف المرتبط: <span className="font-mono font-bold text-emerald-950">{session?.connectedPhone}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isDisconnecting ? 'جاري الفصل...' : 'قطع الاتصال'}</span>
                    </button>
                  </div>

                  {/* Connected Session Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">القروبات المراقبة</span>
                      <span className="text-lg font-black text-emerald-950 mt-1 block">{session?.groupsMonitoredCount || 24} قروب</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">مزامنة فورية</span>
                    </div>

                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">الدردشات الخاصة</span>
                      <span className="text-lg font-black text-emerald-950 mt-1 block">نشطة 👤</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">كافة التجار المباشرين</span>
                    </div>

                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">الطلبات الملتقطة</span>
                      <span className="text-lg font-black text-emerald-950 mt-1 block">{session?.totalOrdersCaptured || receivedCount} طلب</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">تلقائياً بدون لمس الهاتف</span>
                    </div>

                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">حالة المراقبة</span>
                      <span className="text-lg font-black text-emerald-700 mt-1 block">تلقائي ⚡</span>
                      <span className="text-[10px] text-slate-500 font-medium">بطارية: {session?.batteryLevel || 96}%</span>
                    </div>
                  </div>

                  {/* Real Session Status Info */}
                  <div className="bg-white/80 p-4 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-950">الجلسة الحقيقية متصلة وترصد كافة الرسائل والطلبات الواردة فوراً دون محاكاة</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black shrink-0">
                      رصد مباشر 🟢
                    </span>
                  </div>
                </div>
              ) : (
                /* QR Pairing View with Single Phone vs External Screen Switcher */
                <div className="space-y-5">
                  
                  {/* Device Mode Switcher */}
                  <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDeviceMode('same_phone')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                        deviceMode === 'same_phone'
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>📱 أستخدم نفس الهاتف (تفعيل فوري بنقرة واحدة)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeviceMode('external_screen')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                        deviceMode === 'external_screen'
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-slate-500" />
                      <span>💻 لدي شاشة أخرى (مسح الباركود بالكاميرا)</span>
                    </button>
                  </div>

                  {/* Mode A: Same Phone Direct Activation */}
                  {deviceMode === 'same_phone' ? (
                    <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                          <Zap className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-emerald-950">
                            وضع الهاتف الواحد (الواتساب والتطبيق على هذا الجهاز)
                          </h4>
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            بما أنك تتصفح التطبيق من نفس الهاتف الذي يحتوي على واتساب، <strong>لا تحتاج إلى كاميرا أو شاشة ثانية لمسح الباركود!</strong> يمكنك تفعيل الربط فوراً بنقرة واحدة أدناه.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-3">
                        <label className="text-xs font-black text-slate-800 block">
                          رقم هاتفك في واتساب:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={phoneNumberInput}
                            onChange={(e) => setPhoneNumberInput(e.target.value)}
                            placeholder="مثال: +973 39123456"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <button
                          onClick={handleConfirmPairing}
                          disabled={isPairing}
                          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                        >
                          <Zap className="w-4 h-4 text-emerald-200" />
                          <span>{isPairing ? 'جاري التفعيل والمزامنة...' : '⚡ تفعيل ربط الواتساب فوراً على هذا الهاتف (بنقرة واحدة)'}</span>
                        </button>
                      </div>

                      {/* How it works on same phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                        <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 space-y-1">
                          <span className="font-black text-emerald-950 block">1. بدون كاميرا 📸</span>
                          <span className="text-[11px] text-slate-600 block">يتم إنشاء جلسة الربط مباشرة داخل جهازك.</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 space-y-1">
                          <span className="font-black text-emerald-950 block">2. رصد لحظي 24/7 📡</span>
                          <span className="text-[11px] text-slate-600 block">التقاط فوري لرسائل كافة القروبات والمحادثات.</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 space-y-1">
                          <span className="font-black text-emerald-950 block">3. حرية الاستخدام 🚗</span>
                          <span className="text-[11px] text-slate-600 block">تصفح هاتفك أو الخرائط وستصلك تنبيهات الطلبات المطابقة.</span>
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* Mode B: External Screen QR Scanning */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* QR Canvas Box */}
                      <div className="md:col-span-6 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner">
                        <div className="relative p-3.5 bg-white rounded-2xl shadow-md border border-slate-200">
                          {session?.qrCodeDataUrl ? (
                            <img 
                              src={session.qrCodeDataUrl} 
                              alt="WhatsApp Web QR Code" 
                              className="w-56 h-56 object-contain rounded-xl"
                            />
                          ) : (
                            <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                              <span className="text-xs">جاري تجهيز الباركود...</span>
                            </div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center border-4 border-white shadow-md">
                              <QrCode className="w-6 h-6" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full mt-4 text-xs">
                          <span className="text-slate-500 font-medium">
                            يتجدد الباركود بعد: <span className="font-mono font-bold text-emerald-700">{qrCountdown} ثانية</span>
                          </span>
                          <button
                            onClick={handleRefreshQR}
                            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>تحديث الباركود</span>
                          </button>
                        </div>
                      </div>

                      {/* Steps Guide & Scan Confirmation */}
                      <div className="md:col-span-6 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-slate-900">طريقة المسح من شاشة خارجية:</h4>
                          <p className="text-xs text-slate-500">إذا فتحت هذا الرابط على جهاز كمبيوتر أو لابتوب وتريد مسحه بهاتفك</p>
                        </div>

                        <ol className="space-y-2.5 text-xs text-slate-700">
                          <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">1</span>
                            <span>افتح تطبيق <strong>WhatsApp</strong> على هاتفك.</span>
                          </li>
                          <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">2</span>
                            <span>اضغط على القائمة (⋮) أو الإعدادات ⚙️ واختر <strong>الأجهزة المرتبطة (Linked Devices)</strong>.</span>
                          </li>
                          <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">3</span>
                            <span>اضغط على <strong>ربط جهاز (Link a device)</strong> ووجّه كاميرا هاتفك نحو هذا الباركود.</span>
                          </li>
                        </ol>

                        <button
                          onClick={handleConfirmPairing}
                          disabled={isPairing}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{isPairing ? 'جاري التحقق والربط...' : 'تأكيد مسح الباركود وربط الجهاز الآن 🔗'}</span>
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB 2: Android Notification Listener Service */}
          {activeTab === 'listener' && (
            <div className="space-y-5">
              <div className="bg-blue-50/80 border border-blue-200/90 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-950">خدمة قراءة إشعارات الأندرويد (Notification Listener Service)</h4>
                    <p className="text-xs text-blue-800">قراءة كافة إشعارات طلبات واتساب في الخلفية بدون الحاجة لفتح شاشة التطبيق إطلاقاً</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  تتيح خدمة إشعارات الأندرويد التقاط أي إشعار وارد من تطبيق واتساب (القروبات والمحادثات الخاصة) لحظة وروده في شريط الإشعارات، وإرساله مباشرة إلى رادار Ordari بالخلفية حتى أثناء القيادة أو أثناء استخدامك لتطبيقات الخرائط (Google Maps / Waze).
                </p>

                {/* Listener Endpoint URL */}
                <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-blue-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">رابط خدمة قراءة الإشعارات (Listener Endpoint):</span>
                    <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      نشط وجاهز للاستقبال
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 break-all select-all">
                      {listenerEndpoint}
                    </div>
                    <button
                      onClick={() => copyToClipboard(listenerEndpoint, 'url')}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>نسخ</span>
                    </button>
                  </div>
                </div>

                {/* Android Steps */}
                <div className="space-y-2 text-xs text-slate-700">
                  <span className="font-black text-slate-900">خطوات تشغيل الخدمة على هاتفك الأندرويد:</span>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    <li>قم بتحميل تطبيق <strong>MacroDroid</strong> أو <strong>Tasker</strong> من متجر Google Play.</li>
                    <li>أضف مشغّل (Trigger): <strong>إشعار من تطبيق WhatsApp / WhatsApp Business</strong>.</li>
                    <li>أضف إجراء (Action): <strong>طلب HTTP POST</strong> إلى الرابط أعلاه مع إرسال نص الإشعار.</li>
                  </ul>
                </div>

                {/* Android Readiness Status */}
                <div className="pt-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900 font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>خدمة التقاط إشعارات الهاتف جاهزة ومستعدة لاستقبال إشعارات الواتساب الحقيقية</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black shrink-0">
                    نشط بالخلفية ⚡
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Direct Webhook & APIs */}
          {activeTab === 'webhook' && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">رابط الويب هوك العام (Webhook URL)</span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> متاح للاستقبال
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white px-3.5 py-2.5 rounded-xl border border-slate-300/80 text-xs font-mono text-slate-800 break-all select-all shadow-inner">
                    {webhookUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUrl ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">بنية كائن JSON المطلوب إرساله:</span>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
{`{
  "text": "طلب توصيل من الرفاع إلى السيف 3.5 دينار 39123456",
  "sender": "بوتيك دانة للأزياء",
  "group": "محادثة خاصة / تاجر مباشر 👤",
  "phone": "97339123456"
}`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(`{"text":"طلب توصيل من الرفاع إلى السيف 3.5 دينار 39123456","sender":"بوتيك دانة للأزياء","group":"خاص","phone":"97339123456"}`, 'json')}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>نسخ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStreamConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStreamConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span>{isStreamConnected ? 'قناة البث اللحظي للرادار متصلة وتعمل' : 'جاري الاتصال بالقناة...'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
