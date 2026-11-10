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
  CheckCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bell,
  Settings as SettingsIcon,
  AlertTriangle,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { CaptainUser } from '../types';
import { parseWhatsAppExportTxt, ChatImportResult } from '../utils/whatsappChatImporter';
import { 
  getWhatsAppListenerStatus, 
  openWhatsAppListenerSettings, 
  openWhatsAppAccessibilitySettings,
  markAllWhatsAppAsRead,
  orderiWhatsAppClient,
  WhatsAppClientDiagnostics
} from '../native/whatsappListener';
import { isNativeAndroid } from '../native/orderiNotificationListener';
import { 
  getWhatsAppConnection, 
  registerWhatsAppNumber, 
  disconnectWhatsApp, 
  normalizeWhatsAppPhone,
  syncWhatsAppPhoneWithAccount,
  autoAdoptDetectedGroups
} from '../utils/whatsappConnection';
import { isSimulatedMockGroup } from '../utils/simulatorPurge';

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
  onOpenAPKModal?: () => void;
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
  onOpenAPKModal,
}) => {
  const [activeTab, setActiveTab] = useState<'listener' | 'importer' | 'webhook'>(
    initialTab === 'webhook' ? 'webhook' : 'listener'
  );
  const [nativeListenerEnabled, setNativeListenerEnabled] = useState(false);
  const [clientDiag, setClientDiag] = useState<WhatsAppClientDiagnostics>(() => orderiWhatsAppClient.getDiagnostics());
  const [session, setSession] = useState<WhatsAppSessionData | null>(null);
  const [savedConnection, setSavedConnection] = useState(() => getWhatsAppConnection());
  const [linkBusy, setLinkBusy] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  // Historical Chat Import state
  const [importedResult, setImportedResult] = useState<ChatImportResult | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Permission settings activation & interactive guide states
  const [isActivatingSetting, setIsActivatingSetting] = useState<'notification' | 'accessibility' | null>(null);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [permissionHelpModal, setPermissionHelpModal] = useState<{
    isOpen: boolean;
    type: 'notification' | 'accessibility';
    isNative: boolean;
    title: string;
    instructions: string[];
  } | null>(null);

  useEffect(() => {
    const unsub = orderiWhatsAppClient.onStatusChange((diag) => {
      setClientDiag(diag);
      setNativeListenerEnabled(diag.listenerEnabled);
    });
    orderiWhatsAppClient.refreshDiagnostics().catch(() => {});
    return unsub;
  }, []);

  // Auto-refresh diagnostics whenever the user returns to the app from phone Settings
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        orderiWhatsAppClient.refreshDiagnostics().catch(() => {});
        getWhatsAppListenerStatus().then(setNativeListenerEnabled).catch(() => {});
      }
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, []);

  const handleOpenNotificationSettings = async () => {
    setIsActivatingSetting('notification');
    try {
      const isNative = isNativeAndroid();
      if (!isNative) {
        setPermissionHelpModal({
          isOpen: true,
          type: 'notification',
          isNative: false,
          title: 'تفعيل صلاحية قراءة إشعارات واتساب (Notification Access)',
          instructions: [
            'أنت تتصفح Orderi عبر متصفح الويب (أو اختصار PWA). متصفحات الإنترنت لا تسمح تقنياً بالوصول المباشر لإعدادات نظام أندرويد لحماية خصوصيتك.',
            'إذا كنت قمت بتنزيل تطبيق Orderi كـ APK: افتح تطبيق Orderi المثبت على هاتفك مباشرة من شاشة التطبيقات وليس من داخل المتصفح.',
            'لتفعيل الصلاحية يدوياً على هاتفك الآن: افتح «الضبط» (Settings) ➔ «التطبيقات» (Apps) ➔ اضغط القائمة (النقاط الثلاث) ➔ «الوصول الخاص» (Special Access) ➔ «الوصول إلى الإشعارات» (Notification Access) ➔ قُم بتفعيل المفتاح أمام Orderi ✅.',
          ],
        });
        onShowToast('⚠️ أنت تتصفح من المتصفح؛ راجع خطوات التفعيل اليدوية بالنافذة');
        return;
      }

      onShowToast('📱 جاري توجيهك لشاشة إعدادات الإشعارات في الهاتف...');
      const res = await openWhatsAppListenerSettings();
      if (res.success) {
        onShowToast('✅ ابحث عن Orderi وقُم بتفعيل المفتاح ثم عُد للتطبيق');
      } else {
        setPermissionHelpModal({
          isOpen: true,
          type: 'notification',
          isNative: true,
          title: 'تفعيل صلاحية الإشعارات يدوياً على هاتفك',
          instructions: [
            'تعذر تحويلك تلقائياً لشاشة الإعدادات بسبب قيود نظام حماية الهاتف.',
            'الخطوة 1: افتح «الضبط» (Settings) في هاتفك.',
            'الخطوة 2: ادخل على «التطبيقات» (Apps) ثم اضغط خيارات إضافية (النقاط الثلاث) واختر «الوصول الخاص» (Special Access).',
            'الخطوة 3: اختر «الوصول إلى الإشعارات» (Notification Access).',
            'الخطوة 4: فعّل المفتاح أمام تطبيق «Orderi» ✅ ثم عُد للتطبيق.',
          ],
        });
      }
    } catch (err) {
      console.error('Error opening notification settings:', err);
      onShowToast('يرجى تفعيل الصلاحية يدوياً من ضبط الهاتف');
    } finally {
      setIsActivatingSetting(null);
      setTimeout(() => {
        orderiWhatsAppClient.refreshDiagnostics().catch(() => {});
      }, 1500);
    }
  };

  const handleOpenAccessibilitySettings = async () => {
    setIsActivatingSetting('accessibility');
    try {
      const isNative = isNativeAndroid();
      if (!isNative) {
        setPermissionHelpModal({
          isOpen: true,
          type: 'accessibility',
          isNative: false,
          title: 'تفعيل خدمة إمكانية الوصول (Accessibility Service)',
          instructions: [
            'أنت تتصفح Orderi عبر متصفح الويب (أو اختصار PWA). متصفحات الإنترنت لا تسمح بتشغيل خدمات إمكانية الوصول الخلفية.',
            'إذا كنت قمت بتنزيل تطبيق Orderi كـ APK: افتح تطبيق Orderi المثبت على هاتفك مباشرة من شاشة التطبيقات.',
            'لتفعيل إمكانية الوصول يدوياً في هاتفك: افتح «الضبط» (Settings) ➔ «إمكانية الوصول» (Accessibility) ➔ «الخدمات المثبتة» (Installed Services) ➔ فعّل المفتاح أمام Orderi ✅.',
          ],
        });
        onShowToast('⚠️ أنت تتصفح من المتصفح؛ راجع خطوات التفعيل اليدوية بالنافذة');
        return;
      }

      onShowToast('📱 جاري توجيهك لشاشة إمكانية الوصول في الهاتف...');
      const res = await openWhatsAppAccessibilitySettings();
      if (res.success) {
        onShowToast('✅ ابحث عن تطبيق Orderi وفعّل الخدمة ثم عُد للتطبيق');
      } else {
        setPermissionHelpModal({
          isOpen: true,
          type: 'accessibility',
          isNative: true,
          title: 'تفعيل إمكانية الوصول يدوياً على هاتفك',
          instructions: [
            'تعذر تحويلك تلقائياً لشاشة إمكانية الوصول بسبب نظام حماية الهاتف.',
            'الخطوة 1: افتح «الضبط» (Settings) في هاتفك.',
            'الخطوة 2: اختر «إمكانية الوصول» (Accessibility).',
            'الخطوة 3: ادخل على «الخدمات التي تم تثبيتها» (Installed apps / Services).',
            'الخطوة 4: اضغط على «Orderi - WhatsApp Auto-Accept» وقُم بتفعيل المفتاح ✅ ثم عُد للتطبيق.',
          ],
        });
      }
    } catch (err) {
      console.error('Error opening accessibility settings:', err);
      onShowToast('يرجى تفعيل إمكانية الوصول يدوياً من ضبط الهاتف');
    } finally {
      setIsActivatingSetting(null);
      setTimeout(() => {
        orderiWhatsAppClient.refreshDiagnostics().catch(() => {});
      }, 1500);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const cleanName = file.name.replace(/WhatsApp Chat - /i, '').replace(/\.txt$/i, '').trim();
        const res = parseWhatsAppExportTxt(content, cleanName || 'قروب واتساب مستورد');
        setImportedResult(res);
        onShowToast(`تم فحص الملف: ${res.totalMessages} رسالة، ${res.candidateOrdersCount} طلب محتمل`);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImportedOrders = async () => {
    if (!importedResult || !importedResult.messages.length) return;
    setIsProcessingImport(true);
    try {
      const { parseMultipleWhatsAppOrdersWithLocalAi } = await import('../utils/localAiOrderParser');
      const rawTexts = importedResult.messages.map((m) => m.messageText);
      const parsedOrders = await parseMultipleWhatsAppOrdersWithLocalAi(rawTexts, {
        groupName: importedResult.groupName,
      });
      if (parsedOrders && parsedOrders.length > 0) {
        onAddIncomingOrders?.(parsedOrders);
        onShowToast(`✅ تم استخراج ${parsedOrders.length} طلب بنجاح وإضافتها إلى الرادار!`);
      } else {
        onShowToast('لم يتم العثور على طلبات توصيل جديدة مطابقة في الملف المستورد');
      }
    } catch (err) {
      console.error('Import error:', err);
      onShowToast('حدث خطأ أثناء معالجة رسائل الملف المستورد');
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingRead(true);
    try {
      const groupsToMark = savedConnection?.groups || internalMyGroups || [];
      const res = await markAllWhatsAppAsRead(groupsToMark);
      const count = res.markedCount || groupsToMark.length || 0;
      onShowToast(`✅ تم تمييز جميع قروبات الواتساب (${count > 0 ? `${count} قروب` : 'المرتبطة'}) كمقروءة (Mark as Read) بنجاح 👁️✨`);
    } catch (err) {
      console.error('Error marking as read:', err);
      onShowToast('تم إرسال أمر تمييز القروبات كمقروءة');
    } finally {
      setIsMarkingRead(false);
    }
  };

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
      const normalized = currentUser.phone.startsWith('+') ? currentUser.phone : `+973 ${currentUser.phone}`;
      setPhoneNumberInput(normalized);
      syncWhatsAppPhoneWithAccount(currentUser.phone);
    }
  }, [currentUser?.phone]);

  // WhatsApp Groups list: dynamically synchronized with "قائمة قروباتي في الواتساب" (بدون أي قروبات محاكاة)
  const [internalMyGroups, setInternalMyGroups] = useState<string[]>(() => {
    if (propMyGroups && propMyGroups.length > 0) {
      return propMyGroups.filter((g) => !isSimulatedMockGroup(g));
    }
    try {
      const saved = localStorage.getItem('orderi_my_whatsapp_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((g: string) => !isSimulatedMockGroup(g));
          if (valid.length > 0) return valid;
        }
      }
    } catch {}
    // Auto-link clean detected groups from phone notifications if myGroups is empty
    if (detectedIncomingGroups && detectedIncomingGroups.length > 0) {
      return detectedIncomingGroups.filter((g) => !isSimulatedMockGroup(g));
    }
    return [];
  });

  // Keep internal groups synced if prop changes
  useEffect(() => {
    if (propMyGroups && propMyGroups.length > 0) {
      setInternalMyGroups(propMyGroups.filter((g) => !isSimulatedMockGroup(g)));
    }
  }, [propMyGroups]);

  // Automatically link and adopt ALL clean detected groups from phone notifications into user's account
  useEffect(() => {
    const cleanDetected = (detectedIncomingGroups || []).filter((g) => !isSimulatedMockGroup(g));
    if (cleanDetected.length > 0) {
      const unlinked = cleanDetected.filter((g) => !internalMyGroups.includes(g));
      if (unlinked.length > 0) {
        const merged = Array.from(new Set([...internalMyGroups, ...cleanDetected]));
        setInternalMyGroups(merged);
        try {
          localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(merged));
        } catch {}
        autoAdoptDetectedGroups(cleanDetected);
        if (onUpdateMyGroups) onUpdateMyGroups(merged);
      }
    }
  }, [detectedIncomingGroups, internalMyGroups, onUpdateMyGroups]);

  const handleLinkAllDetectedToWhatsApp = () => {
    const cleanDetected = (detectedIncomingGroups || []).filter((g) => !isSimulatedMockGroup(g));
    if (cleanDetected.length === 0) return;
    const merged = Array.from(new Set([...internalMyGroups, ...cleanDetected]));
    setInternalMyGroups(merged);
    try {
      localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(merged));
    } catch {}
    autoAdoptDetectedGroups(cleanDetected);
    if (onUpdateMyGroups) onUpdateMyGroups(merged);
    onShowToast(`✅ تم ربط واعتماد كافة القروبات المرصودة (${cleanDetected.length}) بحسابك أوتوماتيكياً!`);
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
            onClick={() => setActiveTab('importer')}
            className={`min-h-[44px] flex items-center gap-2 pb-3 px-3 text-xs font-black border-b-2 transition-all shrink-0 active:scale-95 ${
              activeTab === 'importer'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. استيراد محادثات واتساب (.txt)</span>
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
            <span>3. الويب هوك والسيرفر المباشر (Webhook & Stream)</span>
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
                {/* كارت مدمج لحفظ وربط الرقم وتفعيل الصلاحية مباشرة بدون حشو شروحات */}
                <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">رقم WhatsApp وقراءة الإشعارات</span>
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                        🔒 متطابق ومربوط تلقائياً بالرقم المسجل به في البرنامج
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        nativeListenerEnabled && savedConnection?.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-700'
                          : nativeListenerEnabled
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {nativeListenerEnabled && savedConnection?.status === 'connected'
                        ? 'مربوط ومفعّل ✅'
                        : nativeListenerEnabled
                        ? 'الخدمة مفعّلة ✅'
                        : 'الصلاحية مطلوبة ⚠️'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      dir="ltr"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="+973 3XXXXXXX"
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                      inputMode="tel"
                    />
                    <button
                      type="button"
                      disabled={linkBusy}
                      onClick={async () => {
                        const phone = normalizeWhatsAppPhone(phoneNumberInput);
                        if (!phone) {
                          onShowToast('أدخل رقم WhatsApp أولاً');
                          return;
                        }

                        setLinkBusy(true);
                        try {
                          const connection = registerWhatsAppNumber(phone);
                          orderiWhatsAppClient.registerPhoneNumber(phone);
                          setSavedConnection(connection);

                          // تحقق من صلاحية الإشعارات
                          const enabled = await getWhatsAppListenerStatus();
                          if (!enabled) {
                            await openWhatsAppListenerSettings();
                            onShowToast('تم حفظ الرقم. يرجى تفعيل صلاحية قراءة الإشعارات لتطبيق Orderi');
                            setTimeout(() => {
                              orderiWhatsAppClient.refreshDiagnostics().catch(() => {});
                            }, 1500);
                          } else {
                            await orderiWhatsAppClient.start();
                            setNativeListenerEnabled(true);
                            onShowToast('✅ تم حفظ الرقم والخدمة نشطة بانتظار وصول رسائل القروبات');
                          }
                        } catch (err) {
                          console.error('[Orderi] Save & Link error:', err);
                          onShowToast('تعذر إتمام حفظ الرقم');
                        } finally {
                          setLinkBusy(false);
                          setIsPairing(false);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs disabled:opacity-50 shadow-md shadow-emerald-600/20 shrink-0"
                    >
                      {linkBusy ? 'جاري التنفيذ...' : 'حفظ الرقم وتفعيل المراقبة'}
                    </button>
                  </div>
                </div>

                {/* لوحة التشخيص المباشر لصلاحيات أندرويد وحالة العميل */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black">تشخيص صلاحيات واتساب في الهاتف (Orderi Client)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      clientDiag.state === 'active_stream'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : clientDiag.listenerEnabled
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {clientDiag.stateLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-300">قراءة الإشعارات:</span>
                      {clientDiag.listenerEnabled ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">مفعّلة ✅</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isActivatingSetting === 'notification'}
                          onClick={handleOpenNotificationSettings}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[10px] cursor-pointer shadow-xs transition-all disabled:opacity-60 flex items-center gap-1"
                        >
                          {isActivatingSetting === 'notification' ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              <span>جاري الفتح...</span>
                            </>
                          ) : (
                            <span>تفعيل ⚠️</span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-300">إمكانية الوصول:</span>
                      {clientDiag.accessibilityEnabled ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">مفعّلة ✅</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isActivatingSetting === 'accessibility'}
                          onClick={handleOpenAccessibilitySettings}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-[10px] cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1"
                        >
                          {isActivatingSetting === 'accessibility' ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              <span>جاري الفتح...</span>
                            </>
                          ) : (
                            <span>تفعيل</span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-300">خدمة الخلفية:</span>
                      <span className={clientDiag.serviceConnected ? "text-emerald-400 font-bold" : "text-slate-400 font-bold"}>
                        {clientDiag.serviceConnected ? 'متصلة ✅' : 'جاهزة ⚡'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-300">استثناء البطارية:</span>
                      <span className={clientDiag.batteryOptimizationIgnored ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {clientDiag.batteryOptimizationIgnored ? 'محمي ✅' : 'عادي'}
                      </span>
                    </div>
                  </div>

                  {/* دليل التفعيل اليدوي إذا لم تفتح الشاشة تلقائياً */}
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowManualGuide((prev) => !prev)}
                      className="w-full flex items-center justify-between py-1 px-1 text-[10px] text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>لا يفتح زر التفعيل معك؟ اضغط هنا للخطوات اليدوية وفحص هاتفك</span>
                      </span>
                      {showManualGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showManualGuide && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-[10px] text-slate-300 space-y-2.5 leading-relaxed">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                          <span className="font-bold text-white">خطوات التفعيل اليدوي على هاتفك:</span>
                          <button
                            type="button"
                            onClick={async () => {
                              await orderiWhatsAppClient.refreshDiagnostics();
                              const enabled = await getWhatsAppListenerStatus();
                              setNativeListenerEnabled(enabled);
                              onShowToast('🔄 تم فحص وتحديث حالة الصلاحيات الآن');
                            }}
                            className="text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-black px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            🔄 فحص الصلاحيات الآن
                          </button>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-amber-300 block">1. صلاحية قراءة الإشعارات (Notification Access):</strong>
                          <p>
                            الضبط (Settings) ➔ التطبيقات (Apps) ➔ القائمة (النقاط الثلاث) ➔ <strong>الوصول الخاص (Special Access)</strong> ➔ <strong>الوصول إلى الإشعارات (Device & app notifications)</strong> ➔ ابحث عن <strong>Orderi</strong> وفعّل المفتاح ✅.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-amber-300 block">2. صلاحية إمكانية الوصول (Accessibility):</strong>
                          <p>
                            الضبط (Settings) ➔ <strong>إمكانية الوصول (Accessibility)</strong> ➔ <strong>الخدمات المثبتة (Installed Services)</strong> ➔ اختر <strong>Orderi - WhatsApp Auto-Accept</strong> وفعّل المفتاح ✅.
                          </p>
                        </div>

                        {!isNativeAndroid() && (
                          <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-600/50 text-amber-200 space-y-1">
                            <span className="block font-bold">⚠️ تنبيه: التطبيق مفتوح في المتصفح</span>
                            <span className="block text-[10px] text-amber-100/90">
                              متصفحات الويب لا تدعم قراءة إشعارات التطبيقات في الخلفية. يجب تثبيت تطبيق Orderi كـ APK وتشغيله على الهاتف لالتقاط إعلانات الواتساب.
                            </span>
                            {onOpenAPKModal && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenAPKModal();
                                }}
                                className="inline-block mt-1 text-emerald-300 underline font-black cursor-pointer hover:text-emerald-200"
                              >
                                📥 اضغط هنا لفتح شاشة تثبيت ملف الـ APK الأصلي
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* العدادات والإحصائيات الحقيقية */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <div>
                      رسائل مفحوصة: <strong className="text-white font-bold">{clientDiag.totalMessagesIngested}</strong>
                    </div>
                    <div>
                      طلبات بالرادار: <strong className="text-emerald-400 font-bold">{clientDiag.totalOrdersCaptured}</strong>
                    </div>
                    <div>
                      طلبات مغلقة: <strong className="text-teal-400 font-bold">{clientDiag.totalClosedOrders}</strong>
                    </div>
                    {clientDiag.lastMessageAt && (
                      <div>
                        آخر رسالة: <span className="text-slate-300">{new Date(clientDiag.lastMessageAt).toLocaleTimeString('ar-BH')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-slate-900">القروبات المكتشفة والمحفوظة</div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">{(savedConnection?.groups || internalMyGroups).length} قروب</span>
                  </div>

                  {/* Manual group quick addition input */}
                  <div className="flex gap-2">
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
                      placeholder="أدخل اسم القروب كما يظهر في هاتفك..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddDirectGroup(newGroupInput)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs"
                    >
                      + إضافة قروب
                    </button>
                  </div>

                  {/* Mark All as Read Action Card */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                        <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تمييز جميع القروبات كمقروءة (Mark as Read) وجلب الأرشيف</span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        لتصفير عدادات الإشعارات وسحب طلبات القروبات المؤرشفة تلقائياً
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isMarkingRead}
                      onClick={handleMarkAllAsRead}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 shrink-0 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCheck className={`w-4 h-4 ${isMarkingRead ? 'animate-bounce' : ''}`} />
                      <span>{isMarkingRead ? 'جاري التنفيذ...' : 'تنفيذ Mark as Read الآن 👁️'}</span>
                    </button>
                  </div>

                  {/* Archived Groups Pro-Tip for Instant 0s Capture */}
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-amber-900">
                      <span>💡 هل تضع قروبات الواتساب في الأرشيف؟</span>
                    </div>
                    <p className="text-[10px] text-slate-700 leading-relaxed">
                      لاستقبال طلبات القروبات المؤرشفة في الرادار فوراً بلحظتها (0 ثانية) دون الحاجة للضغط على «قراءة الكل»:
                      افتح <strong>واتساب ➔ الإعدادات ➔ الدردشات ➔ أوقف خيار «إبقاء الدردشات مؤرشفة»</strong>.
                    </p>
                  </div>

                  {/* Automatic Link & Adoption of detected phone notification groups */}
                  {detectedIncomingGroups && detectedIncomingGroups.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] font-bold text-blue-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>تم اعتماد وربط كافة القروبات المرصودة مؤخراً ({detectedIncomingGroups.length} قروب) بحسابك أوتوماتيكياً</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleLinkAllDetectedToWhatsApp}
                        className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[10px] font-black shrink-0 shadow-2xs transition-all cursor-pointer self-end sm:self-auto"
                      >
                        ⚡ إعادة المزامنة والاعتماد
                      </button>
                    </div>
                  )}

                  {(savedConnection?.groups || internalMyGroups).length === 0 ? (
                    <div className="py-2 text-center">
                      <p className="text-xs text-slate-500">
                        لا توجد قروبات مرتبطة حالياً. أضف اسم قروبك يدوياً أعلاه أو سيتم رصده تلقائياً عند استلام إشعارات الواتساب على الهاتف.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {(savedConnection?.groups || internalMyGroups).map((g) => (
                        <span key={g} className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 shadow-2xs">
                          <span>👥 {g}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDirectGroup(g)}
                            className="text-emerald-500 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50 cursor-pointer transition-colors"
                            title="حذف القروب"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>


              </div>
            </div>
          )}

          {/* TAB 2: Historical WhatsApp Chat Export Importer (.txt) */}
          {activeTab === 'importer' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">استيراد محادثات واتساب التاريخية (.txt)</h4>
                    <p className="text-xs text-emerald-800">
                      استيراد ملفات الدردشة المصدّرة يدوياً من قروبات التوصيل واستخراج طلباتها بالذكاء الاصطناعي
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 block">اختر ملف المحادثة المصدّر من واتساب:</span>
                    <p className="text-[11px] text-slate-500">
                      في واتساب: افتح قروب التوصيل ➔ اضغط الخيارات (النقاط الثلاث) ➔ المزيد ➔ <strong>نقل الدردشة (Export Chat)</strong> ➔ بدون وسائط (Without Media) ➔ احفظ ملف الـ TXT.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleFileSelected}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>{importedResult ? 'تغيير الملف المحدد 📁' : 'رفع ملف محادثة واتساب (.txt) 📂'}</span>
                    </button>

                    {importedResult && (
                      <button
                        type="button"
                        disabled={isProcessingImport || importedResult.messages.length === 0}
                        onClick={handleProcessImportedOrders}
                        className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isProcessingImport ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>جاري التحليل واستخراج الطلبات...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>استخراج الطلبات وإضافتها للرادار 🚀</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {importedResult && (
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-emerald-400">ملخص فحص ملف المحادثة:</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">{importedResult.groupName}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">إجمالي الأسطر:</span>
                          <strong className="text-white font-mono">{importedResult.totalLines}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">الرسائل المكتشفة:</span>
                          <strong className="text-blue-400 font-mono">{importedResult.totalMessages}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">إعلانات محتملة:</span>
                          <strong className="text-emerald-400 font-mono">{importedResult.candidateOrdersCount}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">ردود إغلاق «تم»:</span>
                          <strong className="text-teal-400 font-mono">{importedResult.closuresCount}</strong>
                        </div>
                      </div>

                      {importedResult.messages.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-slate-400 block">معاينة أولى الرسائل المكتشفة:</span>
                          <div className="max-h-28 overflow-y-auto space-y-1 text-[10px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                            {importedResult.messages.slice(0, 3).map((m, idx) => (
                              <div key={idx} className="truncate">
                                <strong className="text-emerald-300">{m.senderName}:</strong> {m.messageText}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
              {clientDiag.state === 'active_stream'
                ? '🟢 مراقبة WhatsApp العادي مفعلة • Orderi يستقبل الإعلانات لحظياً'
                : clientDiag.state === 'ready_listening'
                ? '⚡ خدمة Android نشطة ومستعدة لاستقبال إعلانات القروبات'
                : clientDiag.state === 'permission_required'
                ? '⚠️ صلاحية قراءة إشعارات WhatsApp غير مفعلة في إعدادات الهاتف'
                : '⚪ عميل Orderi WhatsApp جاهز للتفعيل'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer text-xs shrink-0"
          >
            إغلاق
          </button>
        </div>

        {/* Permission Help & Manual Action Dialog */}
        {permissionHelpModal && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none"
            onClick={() => setPermissionHelpModal(null)}
          >
            <div
              dir="rtl"
              className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{permissionHelpModal.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPermissionHelpModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!permissionHelpModal.isNative && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="font-black flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                    <span>أنت تتصفح Orderi من متصفح الويب (Web/PWA)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    متصفحات الإنترنت لا تستطيع تقنياً فتح إعدادات الهاتف مباشرة أو مراقبة إشعارات واتساب في الخلفية بدون تثبيت الـ APK الأصلي.
                  </p>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">خطوات التفعيل على هاتفك:</span>
                <ul className="space-y-2">
                  {permissionHelpModal.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    await orderiWhatsAppClient.refreshDiagnostics();
                    const enabled = await getWhatsAppListenerStatus();
                    setNativeListenerEnabled(enabled);
                    onShowToast('🔄 تم فحص وتحديث حالة الصلاحيات الآن');
                    setPermissionHelpModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>فحص وتحديث الحالة الآن</span>
                </button>

                {!permissionHelpModal.isNative && onOpenAPKModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setPermissionHelpModal(null);
                      onClose();
                      onOpenAPKModal();
                    }}
                    className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>تثبيت تطبيق Orderi كـ APK أندرويد أصلي</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPermissionHelpModal(null)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  حسناً، فهمت
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
