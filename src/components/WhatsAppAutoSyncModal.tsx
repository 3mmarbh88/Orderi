import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Zap,
  Copy,
  Check,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
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
  const activeGroups = savedConnection?.groups || internalMyGroups;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] pb-safe overscroll-contain"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Grab Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-white shrink-0">
          <span className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Clean High-Contrast Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate">
                السحب التلقائي من واتساب
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                <span className={isConnected ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {isConnected ? 'متصل ومفعّل' : 'جاهز للربط'}
                </span>
                <span aria-hidden="true">·</span>
                <span>واتساب العادي (Android)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-colors shrink-0 cursor-pointer"
            aria-label="إغلاق النافذة"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Column Segmented Tab Navigation (Always visible on mobile without scrolling) */}
        <div className="px-4 py-2.5 sm:px-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/75 rounded-xl select-none">
            <button
              type="button"
              onClick={() => setActiveTab('listener')}
              className={`min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs transition-all cursor-pointer ${
                activeTab === 'listener'
                  ? 'bg-white text-emerald-800 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">قارئ واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('importer')}
              className={`min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs transition-all cursor-pointer ${
                activeTab === 'importer'
                  ? 'bg-white text-emerald-800 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">استيراد .txt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('webhook')}
              className={`min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs transition-all cursor-pointer ${
                activeTab === 'webhook'
                  ? 'bg-white text-emerald-800 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">الويب هوك</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body (Flattened hierarchy so mobile has full horizontal room) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 text-slate-700 text-sm">
          {/* TAB 1: Native Android Notification Listener Service */}
          {activeTab === 'listener' && (
            <div className="space-y-4">
              {/* Section 1: WhatsApp Phone Number Linking */}
              <section className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900">
                      رقم WhatsApp في الهاتف
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      مربوط تلقائياً برقم حسابك لالتقاط إعلانات القروبات في الخلفية
                    </p>
                  </div>
                  <span
                    className={`text-xs font-black shrink-0 ${
                      nativeListenerEnabled && savedConnection?.status === 'connected'
                        ? 'text-emerald-700'
                        : nativeListenerEnabled
                        ? 'text-blue-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {nativeListenerEnabled && savedConnection?.status === 'connected'
                      ? 'مربوط ومفعّل'
                      : nativeListenerEnabled
                      ? 'الخدمة مفعّلة'
                      : 'الصلاحية مطلوبة'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    dir="ltr"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    placeholder="+973 3XXXXXXX"
                    className="w-full sm:flex-1 min-w-0 min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tabular-nums"
                    inputMode="tel"
                    aria-label="رقم WhatsApp في الهاتف"
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
                    className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm sm:text-xs disabled:opacity-50 shadow-sm shrink-0 whitespace-nowrap cursor-pointer transition-all"
                  >
                    {linkBusy ? 'جاري التنفيذ...' : 'حفظ الرقم وتفعيل المراقبة'}
                  </button>
                </div>
              </section>

              {/* Section 2: Android Permissions & Live Client Diagnostics */}
              <section className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-black truncate">تشخيص صلاحيات الهاتف</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      clientDiag.state === 'active_stream'
                        ? 'text-emerald-300'
                        : clientDiag.listenerEnabled
                        ? 'text-blue-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {clientDiag.stateLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/70 flex flex-col justify-between gap-2 min-h-[78px]">
                    <span className="text-slate-300 text-[11px] font-medium">قراءة الإشعارات</span>
                    {clientDiag.listenerEnabled ? (
                      <span className="text-emerald-400 font-black text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>مفعّلة</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isActivatingSetting === 'notification'}
                        onClick={handleOpenNotificationSettings}
                        className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs cursor-pointer transition-all disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {isActivatingSetting === 'notification' ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>جاري الفتح...</span>
                          </>
                        ) : (
                          <span>تفعيل الآن</span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/70 flex flex-col justify-between gap-2 min-h-[78px]">
                    <span className="text-slate-300 text-[11px] font-medium">إمكانية الوصول</span>
                    {clientDiag.accessibilityEnabled ? (
                      <span className="text-emerald-400 font-black text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>مفعّلة</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isActivatingSetting === 'accessibility'}
                        onClick={handleOpenAccessibilitySettings}
                        className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-xs cursor-pointer transition-all disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {isActivatingSetting === 'accessibility' ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>جاري الفتح...</span>
                          </>
                        ) : (
                          <span>تفعيل الآن</span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/70 flex flex-col justify-between gap-1.5">
                    <span className="text-slate-300 text-[11px] font-medium">خدمة الخلفية</span>
                    <span className={`font-black text-xs ${clientDiag.serviceConnected ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {clientDiag.serviceConnected ? 'متصلة وتعمل' : 'جاهزة للتشغيل'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/70 flex flex-col justify-between gap-1.5">
                    <span className="text-slate-300 text-[11px] font-medium">حماية البطارية</span>
                    <span className={`font-black text-xs ${clientDiag.batteryOptimizationIgnored ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {clientDiag.batteryOptimizationIgnored ? 'مستثنى من التقييد' : 'وضع عادي'}
                    </span>
                  </div>
                </div>

                {/* Expandable Manual Activation Guide */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowManualGuide((prev) => !prev)}
                    className="w-full min-h-[40px] flex items-center justify-between gap-2 py-1 text-xs text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer text-right"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>لا يفتح زر التفعيل؟ خطوات التفعيل اليدوي وفحص الهاتف</span>
                    </span>
                    {showManualGuide ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>

                  {showManualGuide && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
                        <span className="font-bold text-white">خطوات التفعيل اليدوي:</span>
                        <button
                          type="button"
                          onClick={async () => {
                            await orderiWhatsAppClient.refreshDiagnostics();
                            const enabled = await getWhatsAppListenerStatus();
                            setNativeListenerEnabled(enabled);
                            onShowToast('🔄 تم فحص وتحديث حالة الصلاحيات الآن');
                          }}
                          className="min-h-[34px] text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors"
                        >
                          فحص الصلاحيات الآن
                        </button>
                      </div>

                      <div className="space-y-1">
                        <strong className="text-amber-300 block">1. صلاحية قراءة الإشعارات:</strong>
                        <p>
                          الضبط ➔ التطبيقات ➔ الوصول الخاص ➔ <strong>الوصول إلى الإشعارات</strong> ➔ فعّل المفتاح أمام <strong>Orderi</strong>.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <strong className="text-amber-300 block">2. صلاحية إمكانية الوصول:</strong>
                        <p>
                          الضبط ➔ <strong>إمكانية الوصول</strong> ➔ الخدمات المثبتة ➔ اختر <strong>Orderi - WhatsApp Auto-Accept</strong> وفعّل المفتاح.
                        </p>
                      </div>

                      {!isNativeAndroid() && (
                        <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-600/50 text-amber-200 space-y-1.5">
                          <span className="block font-bold">التطبيق مفتوح في المتصفح</span>
                          <span className="block text-[11px] text-amber-100/90">
                            متصفحات الويب لا تدعم قراءة إشعارات التطبيقات في الخلفية؛ يلزم تشغيل تطبيق Orderi المثبت كـ APK على Android.
                          </span>
                          {onOpenAPKModal && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenAPKModal();
                              }}
                              className="inline-block text-emerald-300 underline font-black cursor-pointer hover:text-emerald-200"
                            >
                              فتح شاشة تثبيت ملف APK الأصلي
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Real Counters Grid */}
                <div className="pt-2.5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 tabular-nums">
                  <div className="bg-slate-800/50 rounded-lg px-2.5 py-2 flex items-center justify-between sm:block">
                    <span className="block text-[11px]">رسائل مفحوصة</span>
                    <strong className="text-white font-black">{clientDiag.totalMessagesIngested}</strong>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg px-2.5 py-2 flex items-center justify-between sm:block">
                    <span className="block text-[11px]">طلبات بالرادار</span>
                    <strong className="text-emerald-400 font-black">{clientDiag.totalOrdersCaptured}</strong>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg px-2.5 py-2 flex items-center justify-between sm:block">
                    <span className="block text-[11px]">طلبات مغلقة</span>
                    <strong className="text-teal-400 font-black">{clientDiag.totalClosedOrders}</strong>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg px-2.5 py-2 flex items-center justify-between sm:block">
                    <span className="block text-[11px]">آخر رسالة</span>
                    <strong className="text-slate-200 font-bold">
                      {clientDiag.lastMessageAt ? new Date(clientDiag.lastMessageAt).toLocaleTimeString('ar-BH') : '-'}
                    </strong>
                  </div>
                </div>
              </section>

              {/* Section 3: Monitored Groups & Quick Sync Actions */}
              <section className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-slate-900">القروبات المكتشفة والمحفوظة</h4>
                  <span className="text-xs font-black text-emerald-700 tabular-nums">
                    {activeGroups.length} قروب
                  </span>
                </div>

                {/* Add Group Input + Button (Stacks cleanly on mobile) */}
                <div className="flex flex-col sm:flex-row gap-2">
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
                    aria-label="أدخل اسم القروب"
                    className="w-full sm:flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-base sm:text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDirectGroup(newGroupInput)}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs shrink-0 cursor-pointer shadow-xs whitespace-nowrap transition-all"
                  >
                    + إضافة قروب
                  </button>
                </div>

                {detectedIncomingGroups && detectedIncomingGroups.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-xs font-bold text-blue-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>تم اعتماد القروبات المرصودة مؤخراً ({detectedIncomingGroups.length} قروب) تلقائياً</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLinkAllDetectedToWhatsApp}
                      className="w-full sm:w-auto min-h-[40px] py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black shrink-0 transition-all cursor-pointer"
                    >
                      إعادة المزامنة والاعتماد
                    </button>
                  </div>
                )}

                {activeGroups.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-500 leading-relaxed">
                    لا توجد قروبات مرتبطة حالياً. أضف اسم قروبك أعلاه أو سيتم رصده تلقائياً فور وصول إشعارات الواتساب.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-0.5">
                    {activeGroups.map((g) => (
                      <span
                        key={g}
                        className="min-h-[36px] px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 inline-flex items-center gap-2"
                      >
                        <span className="truncate max-w-[200px]">{g}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDirectGroup(g)}
                          className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors shrink-0"
                          aria-label={`حذف قروب ${g}`}
                          title="حذف القروب"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Mark All as Read Action Bar */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                      <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تمييز القروبات كمقروءة وجلب الأرشيف</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      لتصفير عدادات الإشعارات وسحب طلبات القروبات المؤرشفة
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isMarkingRead}
                    onClick={handleMarkAllAsRead}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <CheckCheck className={`w-4 h-4 ${isMarkingRead ? 'animate-bounce' : ''}`} />
                    <span>{isMarkingRead ? 'جاري التنفيذ...' : 'تنفيذ Mark as Read'}</span>
                  </button>
                </div>

                {/* Archived Groups Pro-Tip */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-black text-amber-900">ملاحظة للقروبات المؤرشفة</div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    لاستقبال طلبات القروبات المؤرشفة فوراً دون الحاجة للضغط على قراءة الكل: افتح{' '}
                    <strong>واتساب ➔ الإعدادات ➔ الدردشات ➔ أوقف خيار «إبقاء الدردشات مؤرشفة»</strong>.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: Historical WhatsApp Chat Export Importer (.txt) */}
          {activeTab === 'importer' && (
            <section className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-900">استيراد محادثات واتساب (.txt)</h4>
                  <p className="text-xs text-slate-600">
                    رفع ملف الدردشة المصدّر من قروب التوصيل لاستخراج طلباته تلقائياً
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  في واتساب: افتح القروب ➔ الخيارات (النقاط الثلاث) ➔ المزيد ➔ <strong>نقل الدردشة (Export Chat)</strong> ➔ بدون وسائط.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileSelected}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:flex-1 min-h-[48px] py-3 px-4 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{importedResult ? 'تغيير الملف المحدد' : 'رفع ملف محادثة واتساب (.txt)'}</span>
                  </button>

                  {importedResult && (
                    <button
                      type="button"
                      disabled={isProcessingImport || importedResult.messages.length === 0}
                      onClick={handleProcessImportedOrders}
                      className="w-full sm:w-auto min-h-[48px] py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isProcessingImport ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري الاستخراج...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>استخراج الطلبات للرادار</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {importedResult && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="font-bold text-emerald-400">ملخص فحص الملف</span>
                      <span className="text-[11px] text-slate-300 truncate">{importedResult.groupName}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                      <div className="p-2 rounded-lg bg-slate-800/80">
                        <span className="text-slate-400 block text-[11px]">إجمالي الأسطر</span>
                        <strong className="text-white font-mono">{importedResult.totalLines}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80">
                        <span className="text-slate-400 block text-[11px]">الرسائل</span>
                        <strong className="text-blue-400 font-mono">{importedResult.totalMessages}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80">
                        <span className="text-slate-400 block text-[11px]">إعلانات محتملة</span>
                        <strong className="text-emerald-400 font-mono">{importedResult.candidateOrdersCount}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80">
                        <span className="text-slate-400 block text-[11px]">ردود الإغلاق</span>
                        <strong className="text-teal-400 font-mono">{importedResult.closuresCount}</strong>
                      </div>
                    </div>

                    {importedResult.messages.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] text-slate-400 block">معاينة أولى الرسائل:</span>
                        <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
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
            </section>
          )}

          {/* TAB 3: Direct Webhook & APIs */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <section className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900">
                    رابط الويب هوك العام (Webhook URL)
                  </span>
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>متاح للاستقبال</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div
                    dir="ltr"
                    className="w-full sm:flex-1 bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 break-all select-all"
                  >
                    {webhookUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="w-full sm:w-auto min-h-[44px] shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUrl ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <span className="text-xs font-black text-slate-800 block">بنية كائن JSON المطلوب إرساله:</span>
                <pre
                  dir="ltr"
                  className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl text-left whitespace-pre-wrap break-words"
                >
{`{
  "text": "طلب توصيل من الرفاع إلى السيف 3.5 دينار 39123456",
  "sender": "بوتيك دانة للأزياء",
  "group": "محادثة خاصة / تاجر مباشر",
  "phone": "97339123456"
}`}
                </pre>
              </section>
            </div>
          )}
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-4 py-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                clientDiag.state === 'active_stream'
                  ? 'bg-emerald-500'
                  : clientDiag.state === 'ready_listening'
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-bold text-slate-700 text-xs leading-snug truncate">
              {clientDiag.state === 'active_stream'
                ? 'مراقبة WhatsApp العادي مفعّلة لحظياً'
                : clientDiag.state === 'ready_listening'
                ? 'خدمة Android نشطة ومستعدة للاستقبال'
                : clientDiag.state === 'permission_required'
                ? 'صلاحية الإشعارات مطلوبة من إعدادات الهاتف'
                : 'عميل Orderi جاهز للتفعيل'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold transition-all cursor-pointer text-xs shrink-0"
          >
            إغلاق
          </button>
        </div>

        {/* Permission Help & Manual Action Dialog */}
        {permissionHelpModal && (
          <div
            className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none"
            onClick={() => setPermissionHelpModal(null)}
          >
            <div
              dir="rtl"
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{permissionHelpModal.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPermissionHelpModal(null)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!permissionHelpModal.isNative && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="font-black flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>أنت تتصفح Orderi من متصفح الويب</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    متصفحات الإنترنت لا تسمح بفتح إعدادات النظام أو مراقبة الإشعارات في الخلفية بدون تثبيت تطبيق APK الأصلي.
                  </p>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">خطوات التفعيل على هاتفك:</span>
                <ul className="space-y-2">
                  {permissionHelpModal.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
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
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
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
                    className="w-full min-h-[44px] py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>تثبيت تطبيق Orderi كـ APK أندرويد أصلي</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPermissionHelpModal(null)}
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
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
