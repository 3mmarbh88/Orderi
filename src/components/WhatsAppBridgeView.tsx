import { useState, useEffect, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Link2,
  Phone,
  Power,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Unlink,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  MessageSquare,
} from 'lucide-react';
import {
  BridgeSessionStatus,
  WhatsAppBridgeConnectionState,
  getBridgeServerUrlOverride,
  setBridgeServerUrlOverride,
} from '../utils/bridgeClient';

interface WhatsAppBridgeViewProps {
  status: BridgeSessionStatus;
  defaultPhone?: string;
  bridgeEnabled: boolean;
  preferBridgeOutreach: boolean;
  onToggleBridgeEnabled: (enabled: boolean) => void;
  onTogglePreferBridgeOutreach: (enabled: boolean) => void;
  onConnect: (phoneNumber: string) => Promise<void> | void;
  onReconnect: () => Promise<void> | void;
  onDisconnect: () => Promise<void> | void;
  onRefreshStatus: () => Promise<void> | void;
  onToast?: (msg: string) => void;
}

const STATE_STYLES: Record<
  WhatsAppBridgeConnectionState,
  { badgeClass: string; dotClass: string; arLabel: string }
> = {
  Disconnected: {
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-400',
    arLabel: 'غير متصل',
  },
  Connecting: {
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    dotClass: 'bg-blue-500',
    arLabel: 'جاري الاتصال وتجهيز الجلسة',
  },
  'Waiting for Pairing': {
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-500',
    arLabel: 'بانتظار إدخال رمز الربط في واتساب',
  },
  Connected: {
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    arLabel: 'متصل ومؤكد من الخادم',
  },
  Reconnecting: {
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    arLabel: 'إعادة الاتصال التلقائي جارية',
  },
  'Session Expired': {
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-600',
    arLabel: 'انتهت صلاحية الجلسة — يلزم إعادة الربط',
  },
  Error: {
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-600',
    arLabel: 'تعذر الاتصال',
  },
};

function formatDateTimeArabic(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-BH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

export function WhatsAppBridgeView({
  status,
  defaultPhone = '',
  bridgeEnabled,
  preferBridgeOutreach,
  onToggleBridgeEnabled,
  onTogglePreferBridgeOutreach,
  onConnect,
  onReconnect,
  onDisconnect,
  onRefreshStatus,
  onToast,
}: WhatsAppBridgeViewProps) {
  const [phoneInput, setPhoneInput] = useState<string>(status.phoneNumber || defaultPhone || '');
  const [serverOverrideInput, setServerOverrideInput] = useState<string>(() => getBridgeServerUrlOverride());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAdvancedServer, setShowAdvancedServer] = useState(false);

  useEffect(() => {
    if (!phoneInput && (status.phoneNumber || defaultPhone)) {
      setPhoneInput(status.phoneNumber || defaultPhone);
    }
  }, [status.phoneNumber, defaultPhone]);

  const currentStyle = STATE_STYLES[status.state] || STATE_STYLES.Disconnected;

  const handlePairSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = phoneInput.replace(/[^\d+]/g, '').trim();
    if (cleaned.replace(/\D/g, '').length < 8) {
      onToast?.('يرجى إدخال رقم واتساب صحيح بالرمز الدولي (مثال: 97339123456)');
      return;
    }
    setIsSubmitting(true);
    try {
      await onConnect(cleaned);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPairingCode = async () => {
    if (!status.pairingCode) return;
    try {
      await navigator.clipboard.writeText(status.pairingCode.replace(/-/g, ''));
      setCopiedCode(true);
      onToast?.('تم نسخ رمز الربط — الصقه في واتساب الآن');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      onToast?.('حدد الرمز وانسخه يدوياً');
    }
  };

  const handleReconnectClick = async () => {
    setIsSubmitting(true);
    try {
      await onReconnect();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnectClick = async () => {
    setIsSubmitting(true);
    try {
      await onDisconnect();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveServerUrl = () => {
    setBridgeServerUrlOverride(serverOverrideInput);
    onToast?.('تم حفظ عنوان خادم WhatsApp Bridge وتحديث الاتصال');
    void onRefreshStatus();
  };

  return (
    <section
      dir="rtl"
      aria-label="WhatsApp Bridge"
      data-testid="whatsapp-bridge-view"
      data-bridge-state={status.state}
      className="max-w-4xl mx-auto space-y-5 pb-12"
    >
      {/* Top Status & Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900">WhatsApp Bridge</h1>
                <span
                  data-testid="bridge-connection-state-badge"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${currentStyle.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentStyle.dotClass}`} />
                  <span className="font-mono">{status.state}</span>
                  <span className="text-[11px] opacity-85">({currentStyle.arLabel})</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                ربط واتساب Messenger العادي على نفس الهاتف عبر Pairing Code واستقبال طلبات الجروبات وإرسال الردود بالخلفية.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleReconnectClick()}
              disabled={isSubmitting || status.state === 'Connecting'}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSubmitting || status.state === 'Reconnecting' ? 'animate-spin text-amber-600' : 'text-slate-600'}`} />
              <span>إعادة الاتصال</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDisconnectClick()}
              disabled={isSubmitting || status.state === 'Disconnected'}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Unlink className="w-4 h-4" />
              <span>فصل الحساب</span>
            </button>
          </div>
        </div>

        {/* Live Telemetry Strip (Tabular Numerals) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>حالة استقبال الرسائل</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm font-black text-slate-900">
              {status.messageIngestionActive ? (
                <>
                  <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700">نشط ومباشر</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600">متوقف</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>الرسائل المستقبلة</span>
            </div>
            <p
              data-testid="bridge-received-count"
              className="mt-1.5 text-lg font-black text-slate-900 font-mono tabular-nums"
            >
              {status.receivedMessagesCount}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>آخر وقت اتصال</span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
              {formatDateTimeArabic(status.lastConnectedAt)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>ردود القبول المرسلة</span>
            </div>
            <p className="mt-1.5 text-lg font-black text-slate-900 font-mono tabular-nums">
              {status.sentMessagesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Real Error / Session Expired Banner */}
      {(status.errorMessage || status.state === 'Session Expired' || status.state === 'Error') && (
        <div
          role="alert"
          data-testid="bridge-error-box"
          className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-900"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-black">
              {status.state === 'Session Expired'
                ? 'انتهت صلاحية جلسة WhatsApp Bridge (Session Expired)'
                : 'تنبيه خطأ في الربط (Error)'}
            </p>
            <p className="font-medium leading-relaxed">
              {status.errorMessage || 'تعذر إتمام الاتصال — يرجى مراجعة الرقم والمحاولة مرة أخرى.'}
            </p>
            {status.errorCode && (
              <p className="text-[11px] font-mono text-rose-700">Code: {status.errorCode}</p>
            )}
          </div>
        </div>
      )}

      {/* Single-Phone Pairing Code Flow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">ربط واتساب العادي برمز Pairing Code</h2>
              <p className="text-xs text-slate-500">يعمل على نفس هاتف Android دون الحاجة إلى هاتف ثانٍ أو كاميرا QR</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePairSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="bridge-phone-input" className="block text-xs font-bold text-slate-700">
              رقم هاتف حساب WhatsApp Messenger (بالرمز الدولي)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="bridge-phone-input"
                type="tel"
                dir="ltr"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+973 3912 3456"
                className="w-full min-h-[46px] pr-10 pl-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono tabular-nums text-sm text-left"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status.state === 'Connecting'}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            {isSubmitting || status.state === 'Connecting' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري إنشاء الرمز...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>ربط واتساب</span>
              </>
            )}
          </button>
        </form>

        {/* Active Pairing Code Box */}
        {status.pairingCode && (
          <div
            data-testid="bridge-pairing-code-box"
            className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-black text-emerald-900">رمز الربط الخاص بك (Pairing Code)</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  انسخ الرمز وأدخله في تطبيق WhatsApp Messenger على نفس هاتفك الآن
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  dir="ltr"
                  data-testid="bridge-pairing-code-value"
                  className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 font-mono tabular-nums text-base sm:text-2xl font-black tracking-[0.12em] text-slate-900 select-all whitespace-nowrap shrink-0"
                >
                  {status.pairingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPairingCode}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-950 font-medium pt-2 border-t border-emerald-200/80">
              <li>1. افتح تطبيق <strong>WhatsApp Messenger</strong> العادي على نفس الهاتف.</li>
              <li>2. انتقل إلى: <strong>الإعدادات ← الأجهزة المرتبطة ← ربط جهاز</strong>.</li>
              <li>3. اضغط بالأسفل على: <strong>الربط برقم الهاتف بدلاً من ذلك</strong>.</li>
              <li>4. أدخل الرمز أعلاه وانتظر تأكيد الخادم حتى تظهر حالة <strong>Connected</strong>.</li>
            </ol>
          </div>
        )}

        {status.state === 'Connected' && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                الجسر متصل ومؤكد من الخادم للرقم{' '}
                <span dir="ltr" className="font-mono tabular-nums underline">
                  {status.phoneNumber || status.connectedJid || 'واتساب'}
                </span>
                ؛ يستمر استقبال الجروبات وإرسال ردود القبول حتى عند إغلاق واجهة Orderi.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Optional Channel Controls (Preserving NotificationListener & Accessibility) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Power className="w-4 h-4 text-slate-700" />
          <h2 className="text-base font-black text-slate-900">خيارات دمج القناة مع النظام الحالي</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
            <div>
              <span className="block text-sm font-bold text-slate-900">تفعيل قناة WhatsApp Web Bridge</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                يعمل كمسار إضافي بجانب Notification Listener و Accessibility Service مع توحيد منع التكرار تلقائياً.
              </span>
            </div>
            <input
              type="checkbox"
              checked={bridgeEnabled}
              onChange={(e) => onToggleBridgeEnabled(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 cursor-pointer shrink-0"
            />
          </label>

          <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
            <div>
              <span className="block text-sm font-bold text-slate-900">
                تفضيل Bridge لإرسال رسالة القبول بالخاص دون فتح واتساب
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                عند توفر معرف المعلن الأصلي واتصال الجسر، يتم إرسال رسالة القبول مباشرة عبر الخادم دون مغادرة شاشة الرادار.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferBridgeOutreach}
              onChange={(e) => onTogglePreferBridgeOutreach(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 cursor-pointer shrink-0"
            />
          </label>
        </div>

        {/* Advanced Self-Hosted Server URL Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAdvancedServer((v) => !v)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
          >
            {showAdvancedServer ? 'إخفاء إعدادات رابط الخادم المخصص' : 'إعداد رابط خادم Bridge مخصص (متقدم للـ APK)'}
          </button>

          {showAdvancedServer && (
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                dir="ltr"
                value={serverOverrideInput}
                onChange={(e) => setServerOverrideInput(e.target.value)}
                placeholder="https://orderi-server.onrender.com"
                className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleSaveServerUrl}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                حفظ الرابط
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security & Unofficial Library Risk Disclosure */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 space-y-2 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-black text-amber-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>ضمانات الأمان والخصوصية</span>
        </div>
        <ul className="space-y-1 pr-4 list-disc text-amber-900/90 leading-relaxed">
          <li>يتم تشفير جميع بيانات جلسة واتساب على الخادم بتشفير AES-256-GCM مع عزل كامل لجلسة كل مستخدم.</li>
          <li>لا يتم تخزين مفاتيح الجلسة داخل تطبيق الهاتف أو مستودع GitHub، ولا تُنشأ أي طلبات من المحادثات الخاصة (1-on-1).</li>
          <li className="flex items-start gap-1 font-bold text-amber-950">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>{status.unofficialLibraryWarning}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
