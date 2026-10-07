import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Zap,
  Radio,
  Copy,
  Check,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  QrCode,
  ShieldCheck,
  Wifi,
  Power,
  Phone,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Clock,
  MapPin,
  TrendingUp,
  Users,
  Trash2,
  Plus,
} from 'lucide-react';
import { CaptainUser } from '../types';
import { getWhatsAppListenerStatus, openWhatsAppListenerSettings } from '../native/whatsappListener';
import { getWhatsAppConnection, registerWhatsAppNumber, disconnectWhatsApp, normalizeWhatsAppPhone } from '../utils/whatsappConnection';

export interface WhatsAppSessionData {
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

interface WhatsAppAutoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStreamConnected: boolean;
  receivedCount: number;
  initialTab?: 'listener' | 'webhook' | 'qr';
  onShowToast: (msg: string) => void;
  onSessionConnected?: (session: WhatsAppSessionData, initialOrders?: any[]) => void;
  onAddIncomingOrders?: (orders: any[]) => void;
  currentUser?: CaptainUser | null;
  myGroups?: string[];
  detectedIncomingGroups?: string[];
  onUpdateMyGroups?: (newGroups: string[]) => void;
  onOpenSettings?: () => void;
}

export const WhatsAppAutoSyncModal: React.FC<WhatsAppAutoSyncModalProps> = ({
  isOpen,
  onClose,
  isStreamConnected,
  receivedCount,
  initialTab = 'listener',
  onShowToast,
  onSessionConnected,
  onAddIncomingOrders,
  currentUser,
  myGroups: propMyGroups,
  detectedIncomingGroups = [],
  onUpdateMyGroups,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'listener' | 'webhook'>(
    initialTab === 'webhook' ? 'webhook' : 'listener'
  );
  const [nativeListenerEnabled, setNativeListenerEnabled] = useState(false);
  const [session, setSession] = useState<WhatsAppSessionData | null>(null);
  const [savedConnection, setSavedConnection] = useState(() => getWhatsAppConnection());
  const [linkBusy, setLinkBusy] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Phone number is automatically linked to the captain's registered account phone
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>(() => {
    if (currentUser?.phone) {
      return currentUser.phone.startsWith('+') ? currentUser.phone : `+973 ${currentUser.phone}`;
    }
    try {
      const saved = localStorage.getItem('orderi_captain_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.phone) return u.phone.startsWith('+') ? u.phone : `+973 ${u.phone}`;
      }
    } catch {}
    return '';
  });

  useEffect(() => {
    if (currentUser?.phone) {
      setPhoneNumberInput(currentUser.phone.startsWith('+') ? currentUser.phone : `+973 ${currentUser.phone}`);
    }
  }, [currentUser?.phone]);

  // WhatsApp Groups list: dynamically synchronized with "قائمة قروباتي في الواتساب"
  const [internalMyGroups, setInternalMyGroups] = useState<string[]>(() => {
    if (propMyGroups && propMyGroups.length > 0) return propMyGroups;
    try {
      const saved = localStorage.getItem('orderi_my_whatsapp_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        const banned = [
          'قروب مندوبي البحرين 🇧🇭',
          'طلبات التوصيل - المنامة والمحرق',
          'توصيل سريع الرفاع ومدينة عيسى',
          'شبكة مناديب التوصيل السريع',
        ];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((g: string) => !banned.includes(g));
          if (valid.length > 0) return valid;
        }
      }
    } catch {}
    // Auto-link detected groups from phone notifications if myGroups is empty
    if (detectedIncomingGroups && detectedIncomingGroups.length > 0) {
      return detectedIncomingGroups;
    }
    return [];
  });

  // Keep internal groups synced if prop changes
  useEffect(() => {
    if (propMyGroups && propMyGroups.length > 0) {
      setInternalMyGroups(propMyGroups);
    }
  }, [propMyGroups]);

  // If internal groups are empty but phone notifications detected groups, auto-bind them
  useEffect(() => {
    if (internalMyGroups.length === 0 && detectedIncomingGroups && detectedIncomingGroups.length > 0) {
      setInternalMyGroups(detectedIncomingGroups);
      try {
        localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(detectedIncomingGroups));
      } catch {}
      if (onUpdateMyGroups) onUpdateMyGroups(detectedIncomingGroups);
    }
  }, [detectedIncomingGroups]);

  const handleLinkAllDetectedToWhatsApp = () => {
    if (!detectedIncomingGroups || detectedIncomingGroups.length === 0) return;
    const merged = Array.from(new Set([...internalMyGroups, ...detectedIncomingGroups]));
    setInternalMyGroups(merged);
    try {
      localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(merged));
    } catch {}
    if (onUpdateMyGroups) onUpdateMyGroups(merged);
    onShowToast(`✅ تم ربط ${detectedIncomingGroups.length} قروبات مرصودة من هاتفك برقم واتسابك بنجاح!`);
  };

  const [isManagingGroups, setIsManagingGroups] = useState<boolean>(false);
  const [newGroupInput, setNewGroupInput] = useState<string>('');

  const handleAddDirectGroup = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      onShowToast('يرجى كتابة اسم القروب أولاً');
      return;
    }
    if (internalMyGroups.includes(trimmed)) {
      onShowToast('هذا القروب موجود بالفعل في قائمتك');
      return;
    }
    const next = [...internalMyGroups, trimmed];
    setInternalMyGroups(next);
    setNewGroupInput('');
    try {
      localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(next));
    } catch {}
    if (onUpdateMyGroups) onUpdateMyGroups(next);
    onShowToast(`✅ تمت إضافة: "${trimmed}" إلى قروباتك المراقبة`);
  };

  const handleRemoveDirectGroup = (groupToRemove: string) => {
    const next = internalMyGroups.filter(g => g !== groupToRemove);
    setInternalMyGroups(next);
    try {
      localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(next));
    } catch {}
    if (onUpdateMyGroups) onUpdateMyGroups(next);
    onShowToast(`تم حذف القروب من القائمة`);
  };

  const myGroupsList = internalMyGroups;

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const connection = getWhatsAppConnection();
      setSavedConnection(connection);
      if (connection?.phoneNumber) setPhoneNumberInput(connection.phoneNumber);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'listener') return;
    getWhatsAppListenerStatus().then(setNativeListenerEnabled).catch(() => setNativeListenerEnabled(false));
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'listener') return;
    let cancelled = false;
    const refreshConnection = () => {
      const connection = getWhatsAppConnection();
      if (!cancelled) {
        setSavedConnection(connection);
        if (connection?.phoneNumber) setPhoneNumberInput(connection.phoneNumber);
      }
    };
    refreshConnection();
    const timer = window.setInterval(refreshConnection, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${currentOrigin}/api/whatsapp/webhook`;
  const listenerEndpoint = `${currentOrigin}/api/android/notifications`;

  const handleRefreshQR = async () => {
    onShowToast('ربط QR غير مستخدم. استخدم ربط الرقم وقارئ WhatsApp الأصلي.');
  };

  const handleConfirmPairing = async () => {
    const phone = normalizeWhatsAppPhone(phoneNumberInput);
    if (!phone) {
      onShowToast('أدخل رقم WhatsApp أولاً');
      return;
    }

    setLinkBusy(true);
    try {
      const enabled = await getWhatsAppListenerStatus();
      if (!enabled) {
        await openWhatsAppListenerSettings();
        onShowToast('فعّل صلاحية قراءة إشعارات Orderi ثم ارجع واضغط ربط الرقم مرة أخرى');
        return;
      }

      const connection = registerWhatsAppNumber(phone);
      setSavedConnection(connection);

      const verified = getWhatsAppConnection();
      const activeSession: WhatsAppSessionData = {
        status: verified?.status === 'connected' ? 'connected' : 'connecting',
        qrCodeDataUrl: '',
        pairingCode: '',
        connectedPhone: connection.phoneNumber,
        connectedAt: connection.connectedAt,
        deviceName: `Orderi • ${connection.deviceId.slice(0, 8)}`,
        batteryLevel: 0,
        groupsMonitoredCount: connection.groups.length,
        privateChatsMonitoredCount: 0,
        totalOrdersCaptured: 0,
        lastSyncAt: connection.lastSeenAt,
        listenerServiceActive: true,
      };
      setSession(activeSession);
      onSessionConnected?.(activeSession, []);
      onShowToast('✅ تم حفظ رقم WhatsApp وتفعيل مراقبة هذا الهاتف. أرسل رسالة في أحد القروبات لاختبار الربط الفعلي.');
    } catch (err) {
      console.error('[Orderi] WhatsApp registration error:', err);
      onShowToast('تعذر حفظ ربط WhatsApp على هذا الجهاز');
    } finally {
      setLinkBusy(false);
      setIsPairing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const connection = disconnectWhatsApp();
      setSavedConnection(connection);
      setSession((prev) => prev ? {
        ...prev,
        status: 'disconnected',
        connectedAt: connection?.connectedAt || null,
        lastSyncAt: connection?.lastSeenAt || null,
      } : null);
      onShowToast('تم إيقاف ربط رقم WhatsApp مع Orderi. خدمة Android تبقى متاحة ويمكن إعادة التفعيل.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'script' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      onShowToast('تم نسخ الرابط بنجاح');
    } else if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      onShowToast('تم نسخ كود الربط');
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
      onShowToast('تم نسخ كود المراقبة بنجاح');
    }
  };

  const isConnected = savedConnection?.status === 'connected' || session?.status === 'connected';
  const showConnectedScreen = isConnected;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[94vh] pb-safe"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 -mb-1" />

        {/* Header with WhatsApp Emerald Branding */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4.5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <QrCode className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">السحب التلقائي من واتساب</h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border ${
                    isConnected
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                      : 'bg-white/15 text-white/90 border-white/20'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
                  <span>{isConnected ? 'متصل ومفعل 🟢' : 'جاهز للربط ⚡'}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 font-medium">
                سحب طلبات القروبات والخاص تلقائياً بدون أي تدخل يدوي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Real modes only, no simulator */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto no-scrollbar select-none">
          <button
            onClick={() => setActiveTab('listener')}
            className={`min-h-[44px] flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 active:scale-95 ${
              activeTab === 'listener'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. قارئ WhatsApp الأصلي (Android APK)</span>
            {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`min-h-[44px] flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 active:scale-95 ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>2. الويب هوك والسيرفر المباشر (Webhook & Stream)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* TAB 1: Native Android Notification Listener Service (Real Device Flow) */}

          {activeTab === 'listener' && (
            <div className="space-y-5">
              <div className="bg-blue-50/80 border border-blue-200/90 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-950">قارئ WhatsApp الأصلي في Android</h4>
                    <p className="text-xs text-blue-800">يلتقط إشعارات WhatsApp العادي حتى عندما يكون Orderi في الخلفية</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900">رقم WhatsApp المرتبط</div>
                      <p className="text-[11px] text-slate-500 mt-1">يُحفظ على هذا الجهاز ولا يتغير عند إغلاق Orderi.</p>
                    </div>
                    {savedConnection?.status === 'connected' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">موثّق بالإشعار ✓</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      dir="ltr"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="+973 3XXXXXXX"
                      className="flex-1 min-w-0 px-3.5 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                      inputMode="tel"
                    />
                    <button
                      type="button"
                      disabled={linkBusy}
                      onClick={handleConfirmPairing}
                      className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs disabled:opacity-50"
                    >
                      {linkBusy ? 'جاري الحفظ...' : 'حفظ وربط'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    ملاحظة: Android لا يسمح للتطبيق بقراءة رقم حساب WhatsApp من قاعدة بياناته. لذلك الرقم الذي تدخله يُحفظ كرقم الحساب، وتصبح عملية الربط مؤكدة عند وصول إشعار WhatsApp الحقيقي إلى Orderi.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${nativeListenerEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-slate-900">{nativeListenerEnabled ? 'الخدمة مفعّلة على الهاتف ✅' : 'صلاحية قراءة الإشعارات غير مفعّلة ⚠️'}</div>
                      <p className="text-[11px] text-slate-600 mt-1">المصدر المقبول: WhatsApp العادي فقط (com.whatsapp).</p>
                    </div>
                    <button type="button" onClick={async () => { try { await openWhatsAppListenerSettings(); onShowToast('فعّل Orderi من قائمة الوصول إلى الإشعارات ثم ارجع للتطبيق'); setTimeout(() => getWhatsAppListenerStatus().then(setNativeListenerEnabled).catch(() => {}), 1200); } catch { onShowToast('تعذر فتح إعدادات قراءة الإشعارات'); } }} className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md">
                      {nativeListenerEnabled ? 'فتح الإعدادات' : 'تفعيل الخدمة'}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <div className="font-black text-slate-900">طريقة العمل:</div>
                  <div>1. WhatsApp العادي يستقبل رسالة في القروب.</div>
                  <div>2. Android يعرض إشعار WhatsApp.</div>
                  <div>3. خدمة Orderi الأصلية تلتقط الإشعار بدون فتح Orderi.</div>
                  <div>4. عند عودة Orderi للواجهة تُمرر الرسالة إلى محلل الطلبات والرادار.</div>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-blue-200 text-[11px] text-slate-600 leading-relaxed">لا نستخدم WhatsApp Web ولا QR ولا تسجيل دخول لواتساب داخل Orderi. الخدمة ترى فقط محتوى الإشعار الذي يسمح Android وWhatsApp بعرضه.</div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-slate-900">القروبات المكتشفة والمحفوظة</div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">{(savedConnection?.groups || internalMyGroups).length} قروب</span>
                  </div>
                  {(savedConnection?.groups || internalMyGroups).length === 0 ? (
                    <p className="text-[11px] text-slate-500">أرسل رسالة في قروب WhatsApp بعد تفعيل الخدمة، وسيظهر القروب هنا تلقائيًا.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {(savedConnection?.groups || internalMyGroups).map((g) => (
                        <span key={g} className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900">
                          👥 {g}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">يتم اكتشاف القروب من إشعار WhatsApp الذي يرسله Android؛ لا يتم الدخول إلى قاعدة بيانات WhatsApp.</p>
                </div>


              </div>
            </div>
          )}

          {/* TAB 3: Direct Webhook & APIs */}
          {activeTab === 'webhook' && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    رابط الويب هوك العام (Webhook URL)
                  </span>
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Unambiguous Status */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isConnected ? 'bg-emerald-400 opacity-75' : 'bg-emerald-400 opacity-60'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isConnected ? 'bg-emerald-500' : 'bg-emerald-600'
                }`}
              />
            </span>
            <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
              {isPairing
                ? '⏳ جاري الاتصال بحساب واتساب ورصد الطلبات...'
                : isConnected
                ? '🟢 مراقبة WhatsApp العادي مفعلة • Orderi يستقبل الإشعارات لحظياً'
                : '⚡ مراقبة WhatsApp جاهزة على هذا الهاتف'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer text-xs shrink-0"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
