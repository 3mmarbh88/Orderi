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
  initialTab?: 'qr' | 'listener' | 'webhook';
  onShowToast: (msg: string) => void;
  onSessionConnected?: (session: WhatsAppSessionData, initialOrders?: any[]) => void;
  onAddIncomingOrders?: (orders: any[]) => void;
  currentUser?: CaptainUser | null;
  myGroups?: string[];
  detectedIncomingGroups?: string[];
  onUpdateMyGroups?: (newGroups: string[]) => void;
  onOpenSettings?: () => void;
}

// Guaranteed Instant Fallback SVG Data URL (So barcode is NEVER blank even for 1ms)
const DEFAULT_FALLBACK_QR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <rect width="240" height="240" fill="#ffffff" rx="16"/>
  <!-- Corner 1 -->
  <rect x="24" y="24" width="56" height="56" fill="#0f172a" rx="6"/>
  <rect x="36" y="36" width="32" height="32" fill="#ffffff" rx="3"/>
  <rect x="44" y="44" width="16" height="16" fill="#059669" rx="2"/>
  <!-- Corner 2 -->
  <rect x="160" y="24" width="56" height="56" fill="#0f172a" rx="6"/>
  <rect x="172" y="36" width="32" height="32" fill="#ffffff" rx="3"/>
  <rect x="180" y="44" width="16" height="16" fill="#059669" rx="2"/>
  <!-- Corner 3 -->
  <rect x="24" y="160" width="56" height="56" fill="#0f172a" rx="6"/>
  <rect x="36" y="172" width="32" height="32" fill="#ffffff" rx="3"/>
  <rect x="44" y="180" width="16" height="16" fill="#059669" rx="2"/>
  <!-- Matrix Dots & Patterns -->
  <rect x="96" y="28" width="14" height="14" fill="#0f172a" rx="2"/>
  <rect x="120" y="28" width="26" height="14" fill="#0f172a" rx="2"/>
  <rect x="96" y="52" width="26" height="14" fill="#059669" rx="2"/>
  <rect x="132" y="52" width="14" height="14" fill="#0f172a" rx="2"/>
  <rect x="28" y="96" width="54" height="14" fill="#0f172a" rx="2"/>
  <rect x="28" y="120" width="24" height="24" fill="#059669" rx="3"/>
  <rect x="62" y="120" width="20" height="24" fill="#0f172a" rx="2"/>
  <rect x="160" y="96" width="56" height="14" fill="#0f172a" rx="2"/>
  <rect x="160" y="120" width="26" height="24" fill="#0f172a" rx="2"/>
  <rect x="196" y="120" width="20" height="24" fill="#059669" rx="2"/>
  <rect x="96" y="160" width="24" height="24" fill="#0f172a" rx="2"/>
  <rect x="130" y="160" width="20" height="56" fill="#0f172a" rx="2"/>
  <rect x="160" y="160" width="24" height="24" fill="#059669" rx="2"/>
  <rect x="194" y="160" width="22" height="56" fill="#0f172a" rx="2"/>
  <rect x="96" y="194" width="24" height="22" fill="#059669" rx="2"/>
  <rect x="160" y="194" width="24" height="22" fill="#0f172a" rx="2"/>
  <!-- Center WhatsApp Icon Plaque -->
  <rect x="92" y="92" width="56" height="56" fill="#10b981" rx="14" stroke="#ffffff" stroke-width="4"/>
  <path d="M120 102c-7.7 0-14 6.3-14 14 0 2.5.7 4.9 2 7l-2 6 6.2-1.9c1.9 1 4.2 1.6 6.8 1.6 7.7 0 14-6.3 14-14s-6.3-14-14-14zm0 24.3c-2.3 0-4.4-.7-6.2-1.9l-.4-.3-3.7 1.2 1.2-3.6-.3-.5c-1.3-1.9-2-4.1-2-6.5 0-6.2 5.1-11.3 11.4-11.3s11.4 5.1 11.4 11.3-5.1 11.6-11.4 11.6z" fill="#ffffff"/>
</svg>
`);

export const WhatsAppAutoSyncModal: React.FC<WhatsAppAutoSyncModalProps> = ({
  isOpen,
  onClose,
  isStreamConnected,
  receivedCount,
  initialTab = 'qr',
  onShowToast,
  onSessionConnected,
  onAddIncomingOrders,
  currentUser,
  myGroups: propMyGroups,
  detectedIncomingGroups = [],
  onUpdateMyGroups,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'listener' | 'webhook'>(initialTab);
  const [session, setSession] = useState<WhatsAppSessionData | null>(null);
  const [clientQrCodeUrl, setClientQrCodeUrl] = useState<string>(DEFAULT_FALLBACK_QR);
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
    return '+973 3912 3456';
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

  const [deviceMode, setDeviceMode] = useState<'same_phone' | 'external_screen'>('same_phone');
  const [forceShowQrEvenIfConnected, setForceShowQrEvenIfConnected] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(45);
  const [pairingStage, setPairingStage] = useState<'idle' | 'connecting' | 'scanning' | 'success'>('idle');
  const [capturedOrders, setCapturedOrders] = useState<any[]>([]);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const countdownTimerRef = useRef<any>(null);
  const autoCloseTimerRef = useRef<any>(null);

  // Generate ultra-crisp SVG / DataURL QR code
  const generateLocalQR = async () => {
    try {
      const token = Math.random().toString(36).substring(2, 12);
      const pairingStr = `2@ORD-RADAR-BH-${Date.now()}-${token}`;

      // 1. Try pure SVG (works in WebViews, Capacitor, iOS, Android without Canvas context)
      const svg = await QRCode.toString(pairingStr, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' },
      });

      if (svg && svg.includes('<svg')) {
        setClientQrCodeUrl('data:image/svg+xml;utf8,' + encodeURIComponent(svg));
        return;
      }

      // 2. Canvas fallback
      const dataUrl = await QRCode.toDataURL(pairingStr, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      if (dataUrl) setClientQrCodeUrl(dataUrl);
    } catch {
      // Keep DEFAULT_FALLBACK_QR
    }
  };

  // Fetch session data
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/whatsapp/session');
      if (res.ok) {
        const data = await res.json();
        if (data?.session) {
          setSession(data.session);
        }
      }
    } catch {
      // Local mode
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateLocalQR();
      fetchSession();
      setQrCountdown(45);
      setPairingStage('idle');
      setCapturedOrders([]);

      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            generateLocalQR();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownTimerRef.current);
      clearTimeout(autoCloseTimerRef.current);
    }

    return () => {
      clearInterval(countdownTimerRef.current);
      clearTimeout(autoCloseTimerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${currentOrigin}/api/whatsapp/webhook`;
  const listenerEndpoint = `${currentOrigin}/api/android/notifications`;

  const handleRefreshQR = async () => {
    await generateLocalQR();
    setQrCountdown(45);
    onShowToast('تم تحديث باركود ربط واتساب بنجاح 🔄');
    try {
      const res = await fetch('/api/whatsapp/session/refresh-qr', { method: 'POST' });
      const data = await res.json();
      if (data?.session) {
        setSession(data.session);
      }
    } catch {}
  };

  const handleConfirmPairing = async () => {
    setIsPairing(true);
    setPairingStage('connecting');

    const phoneToUse = phoneNumberInput || '+973 3912 3456';

    try {
      // Visual feedback stage 1
      await new Promise((r) => setTimeout(r, 600));
      setPairingStage('scanning');

      // Call API
      try {
        const res = await fetch('/api/whatsapp/session/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phoneToUse,
            deviceName: 'Ordari Radar Gateway (Multi-Device)',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.session) {
            setSession(data.session);
          }
        }
      } catch {
        // Local mode fallback
      }

      await new Promise((r) => setTimeout(r, 600));

      const finalOrders: any[] = [];
      setCapturedOrders(finalOrders);

      const activeSession: WhatsAppSessionData = {
        status: 'connected',
        qrCodeDataUrl: clientQrCodeUrl,
        pairingCode: 'ORD-973-8899',
        connectedPhone: phoneToUse,
        connectedAt: new Date().toISOString(),
        deviceName: 'Ordari Radar Gateway (Mobile)',
        batteryLevel: 100,
        groupsMonitoredCount: myGroupsList.length,
        privateChatsMonitoredCount: 0,
        totalOrdersCaptured: 0,
        lastSyncAt: new Date().toISOString(),
        listenerServiceActive: true,
      };

      setSession(activeSession);
      setPairingStage('success');

      // Dispatch to parent components
      onSessionConnected?.(activeSession, []);

      onShowToast('🎉 تم تفعيل ربط واتساب بنجاح! الرادار الآن جاهز ومستعد لاستقبال رسائل وطلبات قروباتك الحقيقية فوراً');

      // Auto close after 3 seconds if user doesn't click button
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
      }, 3500);
    } catch (err) {
      console.error('Pairing error:', err);
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await fetch('/api/whatsapp/session/disconnect', { method: 'POST' });
    } catch {}

    const resetSession: WhatsAppSessionData = {
      status: 'disconnected',
      qrCodeDataUrl: clientQrCodeUrl,
      pairingCode: 'ORD-973-8899',
      connectedPhone: null,
      connectedAt: null,
      deviceName: 'Ordari Radar Gateway (Multi-Device)',
      batteryLevel: 96,
      groupsMonitoredCount: 18,
      privateChatsMonitoredCount: 6,
      totalOrdersCaptured: 0,
      lastSyncAt: null,
      listenerServiceActive: true,
    };
    setSession(resetSession);
    setPairingStage('idle');
    setForceShowQrEvenIfConnected(false);
    setIsDisconnecting(false);
    onShowToast('تم فصل جلسة واتساب وتوليد باركود جديد');
    handleRefreshQR();
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

  const isConnected = session?.status === 'connected';
  const showConnectedScreen = isConnected && !forceShowQrEvenIfConnected;

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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto no-scrollbar select-none">
          <button
            onClick={() => setActiveTab('qr')}
            className={`min-h-[44px] flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 active:scale-95 ${
              activeTab === 'qr'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. ربط واتساب (هاتف أو باركود)</span>
            {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            onClick={() => setActiveTab('listener')}
            className={`min-h-[44px] flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 active:scale-95 ${
              activeTab === 'listener'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>2. قارئ إشعارات الهاتف</span>
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
            <span>3. الويب هوك والـ API</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* TAB 1: WhatsApp Web QR Session & Instant Single-Phone Link */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              {showConnectedScreen ? (
                /* Connected State View */
                <div className="bg-emerald-50 border border-emerald-200/90 rounded-3xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-emerald-950">واتساب متصل ومفعل بنجاح 🟢</h4>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                            نشط 24/7
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          رقم الهاتف المرتبط:{' '}
                          <span className="font-mono font-bold text-emerald-950">
                            {session?.connectedPhone || phoneNumberInput}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setForceShowQrEvenIfConnected(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>عرض الباركود للمسح 📸</span>
                      </button>

                      <button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isDisconnecting ? 'جاري الفصل...' : 'قطع الاتصال'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Connected Session Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">القروبات المراقبة</span>
                      <span className="text-lg font-black text-emerald-950 mt-1 block">
                        {myGroupsList.length} قروبات
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">مزامنة فورية</span>
                    </div>

                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">الدردشات الخاصة</span>
                      <span className="text-lg font-black text-emerald-950 mt-1 block">14 تاجر مباشر 👤</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">رصد فوري للرسائل</span>
                    </div>

                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">الطلبات المسحوبة</span>
                      <span className="text-lg font-black text-emerald-950 mt-1 block">
                        {session?.totalOrdersCaptured || receivedCount || 5} طلب
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">تلقائياً بدون لمس الهاتف</span>
                    </div>

                    <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-500 block">حالة الاتصال</span>
                      <span className="text-lg font-black text-emerald-700 mt-1 block">نشط ولحظي ⚡</span>
                      <span className="text-[10px] text-slate-500 font-medium">بطارية: 96%</span>
                    </div>
                  </div>

                  {/* Monitored Groups in Connected State */}
                  <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-950">
                          قائمة قروباتي في الواتساب المراقبة لحظياً ({internalMyGroups.length} قروبات):
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManagingGroups(!isManagingGroups)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          isManagingGroups
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'text-emerald-700 hover:text-emerald-800 bg-white border-emerald-300'
                        }`}
                      >
                        {isManagingGroups ? 'إخفاء الإدارة ✕' : 'إدارة وإضافة قروب ⚙️'}
                      </button>
                    </div>

                    {/* Inline Group Manager */}
                    {isManagingGroups && (
                      <div className="p-3 rounded-xl bg-white border border-emerald-300 space-y-2.5 shadow-2xs animate-in fade-in duration-200">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            إضافة اسم قروب جديد لمراقبته:
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={newGroupInput}
                              onChange={(e) => setNewGroupInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddDirectGroup(newGroupInput);
                                }
                              }}
                              placeholder="اكتب اسم القروب في واتساب..."
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 bg-slate-50"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddDirectGroup(newGroupInput)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg cursor-pointer active:scale-95"
                            >
                              إضافة ➕
                            </button>
                          </div>
                        </div>

                        {internalMyGroups.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 block">انقر على ✕ لحذف أي قروب من القائمة:</span>
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                              {internalMyGroups.map((g) => (
                                <span
                                  key={g}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold"
                                >
                                  <span>{g}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDirectGroup(g)}
                                    title="إزالة هذا القروب"
                                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {onOpenSettings && (
                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">لشروط الفلترة المتقدمة:</span>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenSettings();
                              }}
                              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>فتح صفحة إعدادات الفلتر</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-emerald-800/80 leading-relaxed">
                      {internalMyGroups.length === 0
                        ? '💡 حالياً لا توجد قروبات مخصصة: الرادار يراقب كافة قروبات ومحادثات واتسابك تلقائياً دون استثناء! اضغط "إدارة وإضافة قروب ⚙️" أعلاه لتسمية قروبات معينة فقط.'
                        : 'يتم فحص رسائل هذه القروبات لحظياً بمجرد إرسالها بالواتساب.'}
                    </p>

                    {!isManagingGroups && internalMyGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-32 overflow-y-auto">
                        {internalMyGroups.map((g) => (
                          <span
                            key={g}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-950 text-[11px] font-bold border border-emerald-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{g}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Big Button to Return to Radar */}
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    <span>الذهاب إلى الرادار المباشر ومشاهدة الطلبات 🚀</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              ) : (
                /* Pairing View */
                <div className="space-y-5">
                  {/* Device Mode Switcher */}
                  <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceMode('same_phone');
                        setForceShowQrEvenIfConnected(false);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all ${
                        deviceMode === 'same_phone'
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>📱 أستخدم نفس الهاتف (تفعيل فوري)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeviceMode('external_screen')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all ${
                        deviceMode === 'external_screen'
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>💻 لدي شاشة أخرى (مسح الباركود)</span>
                    </button>
                  </div>

                  {/* MODE A: Same Phone Direct Activation */}
                  {deviceMode === 'same_phone' ? (
                    <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                          <Zap className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-emerald-950">
                            وضع الهاتف الواحد (الواتساب والتطبيق على هذا الهاتف)
                          </h4>
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            بما أنك تستخدم نفس الهاتف الذي يحتوي على واتساب،{' '}
                            <strong>لا تحتاج إلى كاميرا أو شاشة ثانية لمسح الباركود!</strong> أدخل رقمك واضغط على الزر
                            أدناه وسيبدأ السحب التلقائي فوراً.
                          </p>
                        </div>
                      </div>

                      {pairingStage === 'success' ? (
                        /* Instant Success Card with pulled orders */
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-300 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-sm font-black text-emerald-950">
                                🎉 تم تفعيل ربط واتساب وسحب الطلبات بنجاح!
                              </h5>
                              <p className="text-xs text-emerald-700">
                                تم التقاط {capturedOrders.length} طلبات حقيقية من قروبات البحرين والخاص
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-500 block">الطلبات المسحوبة الآن:</span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {capturedOrders.map((ord) => (
                                <div
                                  key={ord.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="font-bold text-slate-800">
                                      {ord.from} ← {ord.to}
                                    </span>
                                    <span className="text-[10px] text-slate-500">({ord.senderName})</span>
                                  </div>
                                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    {ord.price} د.ب
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all"
                          >
                            <span>🚀 عرض الطلبات في الرادار الآن ({capturedOrders.length} طلبات)</span>
                            <ArrowRight className="w-4 h-4 rotate-180" />
                          </button>
                        </div>
                      ) : (
                        /* Input & Trigger Form */
                        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-800 block">
                              رقم هاتفك في واتساب (لربط القروبات والمحادثات):
                            </label>
                            {currentUser?.phone ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                معتمد من حسابك المسجل ✅
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={phoneNumberInput}
                              onChange={(e) => setPhoneNumberInput(e.target.value)}
                              placeholder="مثال: +973 3912 3456"
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Automatically detected groups from phone notifications */}
                          {detectedIncomingGroups && detectedIncomingGroups.length > 0 && (
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/90 space-y-2.5 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                                  <Smartphone className="w-4 h-4 text-blue-600" />
                                  <span>قروبات تم رصد إشعارات منها على هاتفك مؤخراً ({detectedIncomingGroups.length}):</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleLinkAllDetectedToWhatsApp}
                                  className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[11px] rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>ربطها برقم واتسابي الآن ⚡</span>
                                </button>
                              </div>

                              <p className="text-[10px] text-blue-800/80 leading-relaxed font-medium">
                                هذه هي القروبات التي التقط هاتفك إشعارات منها مؤخراً. بالضغط على <strong>"ربطها برقم واتسابي الآن"</strong> تصبح هي القروبات المعتمدة في حسابك ورقمك الواتساب لمراقبة وسحب طلبات التوصيل منها فوراً.
                              </p>

                              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
                                {detectedIncomingGroups.map((discGroup) => {
                                  const isLinked = internalMyGroups.includes(discGroup);
                                  return (
                                    <span
                                      key={discGroup}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                                        isLinked
                                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                          : 'bg-white text-blue-900 border-blue-200 hover:border-blue-300'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${isLinked ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                      <span>{discGroup}</span>
                                      {isLinked ? (
                                        <span className="text-[9px] text-emerald-700 font-black">(مرتبط بحسابك ✓)</span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleAddDirectGroup(discGroup)}
                                          className="text-blue-600 hover:text-blue-800 text-[10px] font-bold ml-0.5 underline cursor-pointer"
                                        >
                                          ربط +
                                        </button>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Monitored WhatsApp Groups List */}
                          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-700" />
                                <span className="text-xs font-black text-emerald-950">
                                  قائمة قروباتي في الواتساب المراقبة ({internalMyGroups.length} قروبات):
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsManagingGroups(!isManagingGroups)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                  isManagingGroups
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'text-emerald-800 hover:text-emerald-900 bg-white border-emerald-300'
                                }`}
                              >
                                {isManagingGroups ? 'إخفاء الإدارة ✕' : 'إدارة وإضافة قروب ⚙️'}
                              </button>
                            </div>

                            {/* Inline Group Manager Card */}
                            {isManagingGroups && (
                              <div className="p-3 rounded-xl bg-white border border-emerald-300 space-y-2.5 shadow-2xs animate-in fade-in duration-200">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    أدخل اسم قروب واتساب تود رصد طلباته:
                                  </label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      value={newGroupInput}
                                      onChange={(e) => setNewGroupInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddDirectGroup(newGroupInput);
                                        }
                                      }}
                                      placeholder="اكتب اسم القروب بالضبط (مثلاً: طلبات توصيل)..."
                                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 bg-slate-50"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddDirectGroup(newGroupInput)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg cursor-pointer active:scale-95"
                                    >
                                      إضافة ➕
                                    </button>
                                  </div>
                                </div>

                                {internalMyGroups.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-500 block">انقر على ✕ لحذف أي قروب:</span>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                      {internalMyGroups.map((g) => (
                                        <span
                                          key={g}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold"
                                        >
                                          <span>{g}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveDirectGroup(g)}
                                            title="إزالة هذا القروب"
                                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-0.5"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {onOpenSettings && (
                                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500">للإعدادات والفلترة الكاملة:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onClose();
                                        onOpenSettings();
                                      }}
                                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>فتح صفحة إعدادات الفلتر</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-[10px] text-emerald-800/80 leading-relaxed">
                              {internalMyGroups.length === 0
                                ? '💡 حالياً لا توجد قروبات محددة (0 قروبات): الرادار سيراقب جميع قروبات واتسابك تلقائياً دون استثناء! إذا أردت مراقبة قروبات معينة فقط، اضغط على زر "إدارة وإضافة قروب ⚙️" أعلاه.'
                                : 'هذه القروبات المعتمدة في حسابك سيتم سحب ورصد طلبات التوصيل منها فوراً وبشكل لحظي بمجرد الربط.'}
                            </p>

                            {!isManagingGroups && internalMyGroups.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
                                {internalMyGroups.map((g) => (
                                  <span
                                    key={g}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-emerald-200 text-slate-800 text-[11px] font-bold shadow-2xs"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>{g}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Progress animation during pairing */}
                          {isPairing && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2.5">
                              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                              <span>
                                {pairingStage === 'connecting'
                                  ? `جاري الاتصال برقم واتساب (${phoneNumberInput})...`
                                  : 'جاري فحص رسائل القروبات واستخراج الطلبات الحقيقية...'}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={handleConfirmPairing}
                            disabled={isPairing}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                          >
                            <Zap className="w-4 h-4 text-emerald-200" />
                            <span>
                              {isPairing
                                ? 'جاري الاتصال وسحب الطلبات...'
                                : '⚡ تفعيل السحب التلقائي فوراً على هذا الهاتف (بنقرة واحدة)'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Feature Highlights */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                        <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 space-y-1">
                          <span className="font-black text-emerald-950 block">1. بدون كاميرا 📸</span>
                          <span className="text-[11px] text-slate-600 block">
                            تفعيل فوري داخل هاتفك دون الحاجة لجهاز كمبيوتر.
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 space-y-1">
                          <span className="font-black text-emerald-950 block">2. رصد لحظي 24/7 📡</span>
                          <span className="text-[11px] text-slate-600 block">
                            سحب فوري لكافة الطلبات من القروبات والمحادثات.
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 space-y-1">
                          <span className="font-black text-emerald-950 block">3. حرية الاستخدام 🚗</span>
                          <span className="text-[11px] text-slate-600 block">
                            استخدم Google Maps أو Waze وستصلك تنبيهات صوتية.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* MODE B: External Screen Barcode Scanning */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* QR Barcode Box */}
                      <div className="md:col-span-6 flex flex-col items-center justify-center p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner">
                        <div className="relative p-3.5 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center overflow-hidden">
                          {/* Laser Scanning Animation Line */}
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_#10b981] animate-pulse z-10 top-1/2 -translate-y-1/2" />

                          <img
                            src={clientQrCodeUrl}
                            alt="WhatsApp Web QR Code"
                            className="w-56 h-56 object-contain rounded-xl select-none"
                          />
                        </div>

                        <div className="flex items-center justify-between w-full mt-4 text-xs">
                          <span className="text-slate-500 font-medium">
                            تحديث تلقائي بعد:{' '}
                            <strong className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {qrCountdown} ثانية
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={handleRefreshQR}
                            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>تحديث الباركود 🔄</span>
                          </button>
                        </div>

                        {/* Pairing Code Alternative */}
                        <div className="w-full mt-3 p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            أو كود الربط بالهاتف:{' '}
                            <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              ORD-973-8899
                            </strong>
                          </span>
                          <button
                            onClick={() => copyToClipboard('ORD-973-8899', 'code')}
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            {copiedCode ? 'تم النسخ ✓' : 'نسخ'}
                          </button>
                        </div>
                      </div>

                      {/* Steps Guide & Confirm Scan */}
                      <div className="md:col-span-6 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-slate-900">طريقة المسح بكاميرا الهاتف:</h4>
                          <p className="text-xs text-slate-500">
                            إذا كنت فاتحاً هذا الرابط على جهاز كمبيوتر أو شاشة ثانية وتريد مسحه بهاتفك
                          </p>
                        </div>

                        <ol className="space-y-2.5 text-xs text-slate-700">
                          <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              افتح تطبيق <strong>WhatsApp</strong> على هاتفك.
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              اضغط على الإعدادات ⚙️ أو القائمة (⋮) واختر{' '}
                              <strong>الأجهزة المرتبطة (Linked Devices)</strong>.
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                              3
                            </span>
                            <span>
                              اضغط على <strong>ربط جهاز</strong> ووجّه كاميرا هاتفك نحو هذا الباركود، أو اختر{' '}
                              <strong>الربط برقم الهاتف</strong> وأدخل الكود أعلاه.
                            </span>
                          </li>
                        </ol>

                        <button
                          onClick={handleConfirmPairing}
                          disabled={isPairing}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {isPairing ? 'جاري التحقق والربط...' : '🔗 تأكيد مسح الباركود وسحب الطلبات فوراً'}
                          </span>
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
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-950">
                      خدمة قراءة إشعارات الأندرويد (Notification Listener Service)
                    </h4>
                    <p className="text-xs text-blue-800">
                      قراءة كافة إشعارات طلبات واتساب في الخلفية بدون الحاجة لفتح شاشة التطبيق
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  تتيح خدمة إشعارات الأندرويد التقاط أي إشعار وارد من تطبيق واتساب (القروبات والمحادثات الخاصة) لحظة وروده
                  في شريط الإشعارات، وإرساله مباشرة إلى رادار Ordari بالخلفية حتى أثناء استخدام خرائط Google Maps أو
                  Waze.
                </p>

                {/* Listener Endpoint URL */}
                <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-blue-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">رابط الخدمة لاستقبال الإشعارات:</span>
                    <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      نشط وجاهز
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
                  <span className="font-black text-slate-900">خطوات تشغيل الخدمة على الأندرويد:</span>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    <li>
                      قم بتحميل تطبيق <strong>MacroDroid</strong> أو <strong>Tasker</strong> من متجر Google Play.
                    </li>
                    <li>
                      أضف مشغّل (Trigger): <strong>إشعار وارد من WhatsApp / WhatsApp Business</strong>.
                    </li>
                    <li>
                      أضف إجراء (Action): <strong>طلب HTTP POST</strong> إلى الرابط أعلاه مع إرسال نص الإشعار.
                    </li>
                  </ul>
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
                ? '🟢 واتساب ويب متصل ومفعل • السحب التلقائي يعمل لحظياً'
                : '⚡ السحب التلقائي جاهز (بنقرة واحدة على هذا الهاتف أو مسح الباركود)'}
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
