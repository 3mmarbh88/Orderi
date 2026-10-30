import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { 
  Radar, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  Sliders,
  Compass,
  FileSpreadsheet,
  FilterX,
  Trash2,
  Share2,
  Send,
  Star,
  ShieldAlert,
  QrCode,
  Smartphone,
  Zap,
  Reply,
  Power,
  X,
  Target
} from 'lucide-react';
import { OrderFilter, ParsedOrder, AreaLocation, StoreContact, OrderBroadcast } from './types';
import { BAHRAIN_AREAS, findNearestArea } from './data/bahrainAreas';
import { MatcherLocation, evaluateOrderMatch } from './utils/matcher';
import { getDetailedCurrentPosition, globalVehicleTracker } from './utils/gpsTracker';
import { 
  DEFAULT_CONTACTS, 
  checkOrderContactStatus, 
  normalizePhoneNumber 
} from './utils/contacts';
import { 
  playAlertTone, 
  playExcellentAlertSound, 
  triggerCustomVibration 
} from './utils/sound';
import { Header } from './components/Header';
import { HeroRadar } from './components/HeroRadar';
import { OrderCard } from './components/OrderCard';
import { FilterSettings } from './components/FilterSettings';
import { AcceptedLedger } from './components/AcceptedLedger';
import { BahrainRouteMap } from './components/BahrainRouteMap';
import { BroadcastPublisher } from './components/BroadcastPublisher';
import { BackgroundModeModal } from './components/BackgroundModeModal';
import { WhatsAppAutoSyncModal } from './components/WhatsAppAutoSyncModal';
import { NewGroupLinkPrompt } from './components/NewGroupLinkPrompt';
import { DiscoveredGroupsModal } from './components/DiscoveredGroupsModal';
import { APKDownloadModal } from './components/APKDownloadModal';
import { AuthModal } from './components/AuthModal';
import { SplashScreen } from './components/SplashScreen';
import { FaceBiometricModal } from './components/FaceBiometricModal';
import { SpiderControlCenter } from './components/SpiderControlCenter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { recordSpiderEvent, updateSpiderStats } from './utils/spiderCrawler';
import { DiscoveredGroupLink, CaptainUser } from './types';
import { getCurrentUser, setCurrentUser as setStoredCurrentUser, isProgramActivated, normalizeBahrainPhone } from './utils/authManager';
import { FocusedOrderDetailModal } from './components/FocusedOrderDetailModal';
import { OrderAwardedCelebrationModal } from './components/OrderAwardedCelebrationModal';
import { MonthlyCommitmentsModal } from './components/MonthlyCommitmentsModal';
import { MonthlyCommitment } from './types';
import {
  getStoredCommitments,
  saveStoredCommitments,
  checkOrderConflictWithCommitments
} from './utils/commitmentManager';
import { 
  getStoredDiscoveredGroupLinks, 
  saveDiscoveredGroupLinks, 
  extractGroupLinksFromText 
} from './utils/groupLinkDetector';
import { 
  getWhatsAppConnection, 
  markWhatsAppVerified, 
  syncWhatsAppPhoneWithAccount, 
  autoAdoptDetectedGroups 
} from './utils/whatsappConnection';
import { isNativeAndroid, OrderiNotificationListener, WhatsAppNativeEvent } from './native/orderiNotificationListener';
import { getWhatsAppListenerStatus, markAllWhatsAppAsRead, openWhatsAppAccessibilitySettings } from './native/whatsappListener';
import { executePrivateAdvertiserOutreach } from './utils/whatsappPrivateOutreach';
import { isDuplicateOrder, findDuplicateOrderMatch, rememberOrderFingerprint, registerOrderInDedupRegistry } from './utils/orderDedup';
import { computeClientAiEvaluation } from './utils/aiEvaluator';
import { detectPassengerDelivery } from './utils/passengerClassifier';
import { 
  checkIncomingMessageForClosure, 
  checkIncomingMessageForClosureWithAI,
  ClosureMatchResult, 
  isOrderPermanentlyClosed, 
  markOrderPermanentlyClosed, 
  getPermanentlyClosedOrderIds 
} from './utils/orderClosureDetector';
import { classifyAdvertiserPrivateReply } from './utils/advertiserReplyClassifier';
import { detectAdvertisementMessage } from './utils/advertisementClassifier';
import { classifyPrivateWhatsAppMessage, registerKnownGroupAdvertiser } from './utils/personalChatClassifier';
import {
  discriminateConversationSource,
  canMessageCreateRadarOrder,
  canMessageCloseRadarOrder,
  canForwardToCloudAI,
  incrementExcludedPrivateChatsCounter,
  getExcludedPrivateChatsCount,
  recordAmbiguousSourceDiagnostic,
} from './utils/conversationSourceDiscriminator';
import { 
  checkOrderDestinationHunt, 
  saveHuntedDestinationLog 
} from './utils/destinationHunter';
import { 
  sendBackgroundOrderNotification, 
  dismissBackgroundOrderNotification,
  requestNotificationPermission,
  requestScreenWakeLock, 
  releaseScreenWakeLock,
  isInIframe,
  isNotificationSupported,
  primeBackgroundAudio,
  startBackgroundHeartbeat
} from './utils/backgroundManager';
import { detectIsOwnAd } from './utils/selfAdDetector';
import { isSimulatedMockGroup, purgeSimulatorArtifactsFromStorage } from './utils/simulatorPurge';

const DEFAULT_FILTER: OrderFilter = {
  coverageKm: 15,
  minimumPrice: 2.0,
  startAreas: [],
  destinations: [], // Default: all Bahrain destinations eligible
  startTime: '08:00',
  endTime: '23:00',
  notificationsEnabled: true,
  backgroundNotificationsEnabled: true,
  keepScreenAwake: false,
  soundEnabled: true,
  soundVolume: 80,
  alertTone: 'chime',
  vibrationEnabled: true,
  vibrationIntensity: 2,
  vibrationPattern: 'standard',
  excellentAlertEnabled: true,
  ignoreNonMatching: false,
  allJoinedGroupsMode: true, // مراقبة كافة قروبات الواتساب المُنضم إليها افتراضياً لضمان التقاط جميع الطلبات
  selectedGroups: [],
  customResponseTemplate: '#مندوب_توصيل انا في {area} ومستعد للاستلام فوراً',
  contacts: DEFAULT_CONTACTS,
  autoBlockBlacklist: true,
  preventDuplicateOrders: true,
  blockPassengerDeliveries: true,
  autoCloseOrdersEnabled: true,
  autoCloseAmbiguousAction: 'flag',
  excludeMyOwnAds: true,
  captainPhone: '',
  monitorArchivedGroups: true, // رصد ومراقبة قروبات الواتساب المؤرشفة تلقائياً
  // Cloud AI Deep Analysis enabled for WhatsApp orders
  useCloudAiFallback: false,
};

function OrderiApp({
  onShowSplash,
  onOpenFaceLogin,
}: {
  onShowSplash?: () => void;
  onOpenFaceLogin?: () => void;
} = {}) {
  // 1. Persistent Filter State (Merged with DEFAULT_FILTER to guarantee all fields exist)
  const [filter, setFilter] = useState<OrderFilter>(() => {
    try {
      const saved = localStorage.getItem('orderi_filter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // إزالة أي جهات اتصال وهمية أو تجريبية سابقة
          const existingContacts: StoreContact[] = Array.isArray(parsed.contacts)
            ? parsed.contacts.filter((c: StoreContact) => 
                c.id !== 'contact-bl-1' && 
                c.id !== 'contact-vip-1' && 
                c.id !== 'contact-vip-2' && 
                !c.name.includes('وهمي') && 
                !c.name.includes('لافندر') && 
                !c.name.includes('المملكة') &&
                !c.phone.includes('39441122') &&
                !c.phone.includes('36889900')
              )
            : [];

          return { ...DEFAULT_FILTER, ...parsed, contacts: existingContacts };
        }
      }
    } catch {}
    return { ...DEFAULT_FILTER, contacts: [] };
  });

  // 2. Driver Location (Default: Manama or last saved position)
  const [driverLocation, setDriverLocation] = useState<MatcherLocation | null>(() => {
    try {
      const saved = localStorage.getItem('orderi_driver_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.latitude && parsed.longitude) {
          return parsed;
        }
      }
    } catch {}
    return {
      latitude: 26.2235,
      longitude: 50.5876,
      areaName: 'المنامة',
    };
  });
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // 3. Navigation & Feed Filter
  const [activeTab, setActiveTab] = useState<'radar' | 'settings' | 'ledger' | 'broadcast' | 'map'>('radar');
  const [feedFilter, setFeedFilter] = useState<'all' | 'matched' | 'vip' | 'trusted_vip' | 'passengers' | 'closed' | 'hunted'>(() => {
    try {
      const saved = localStorage.getItem('orderi_feed_filter');
      if (saved) return saved as any;
    } catch {}
    return 'all';
  });

  // 4. Orders State (Persisted real orders only - pure live feeds)
  // 4. Orders State (Persisted real orders only - pure live feeds)
  const [orders, setOrders] = useState<ParsedOrder[]>(() => {
    try {
      const closedIds = getPermanentlyClosedOrderIds();
      const saved = localStorage.getItem('orderi_real_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((o: any) => 
              o.source !== 'simulation' && 
              o.source !== 'spider_crawler' &&
              !o.id?.startsWith('ord-spider-') && 
              !o.id?.startsWith('ord-showcase-') && 
              !o.notes?.includes('سحبه تلقائياً فور ربط')
            )
            .map((o: any) => ({
              ...o,
              status: (closedIds.includes(o.id) || o.status === 'closed_taken') ? 'closed_taken' : o.status,
              receivedAt: new Date(o.receivedAt),
              passengerDetection: o.passengerDetection || detectPassengerDelivery(o.rawText || `${o.from} ${o.to}`),
            }));
        }
      }
    } catch {}

    // Clean initial state
    return [];
  });
  const [acceptedOrders, setAcceptedOrders] = useState<ParsedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('orderi_accepted_orders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 5. Radar Live Engine (Persisted state)
  const [liveRadarActive, setLiveRadarActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('orderi_live_radar_active');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  // Self-healing purge: Clean old simulation artifacts, mock groups, and discovered simulator links
  useEffect(() => {
    try {
      // 1. Purge storage artifacts (detected groups, my groups, connections, filter groups, mock links)
      purgeSimulatorArtifactsFromStorage();

      // 2. Clean live state
      setPersistedDetectedGroups((prev) => prev.filter((g) => !isSimulatedMockGroup(g)));
      setDiscoveredGroupLinks((prev) => 
        prev.filter((l) => !isSimulatedMockGroup(l.sourceGroup) && !isSimulatedMockGroup(l.title) && !l.id?.startsWith('grp-mock-'))
      );
      setOrders((prev) => 
        prev.filter((o) => 
          !isSimulatedMockGroup(o.groupName) &&
          o.source !== 'simulation' && 
          o.source !== 'spider_crawler' &&
          !o.id?.startsWith('ord-spider-') &&
          !o.id?.startsWith('ord-showcase-')
        )
      );

      // 3. Clean server state & memory
      fetch('/api/whatsapp/purge-simulator-groups', { method: 'POST' }).catch(() => {});

      // 4. Clean orderi_monthly_commitments (إزالة أي التزامات وهمية سابقة)
      const savedComm = localStorage.getItem('orderi_monthly_commitments');
      if (savedComm) {
        const parsedComm = JSON.parse(savedComm);
        if (Array.isArray(parsedComm)) {
          const cleanedComm = parsedComm.filter((c: any) => 
            c.id !== 'commit-school-1' && 
            c.id !== 'commit-work-2' && 
            !c.clientName?.includes('أم علي') && 
            !c.clientName?.includes('أبو حسين')
          );
          if (cleanedComm.length !== parsedComm.length) {
            localStorage.setItem('orderi_monthly_commitments', JSON.stringify(cleanedComm));
          }
        }
      }
    } catch {}
  }, []);

  // Sync initial filter settings with native Android service on startup
  useEffect(() => {
    syncNativeFilter(filter, driverLocation);
  }, []);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isAutoSyncModalOpen, setIsAutoSyncModalOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<string | null>(null);
  const [autoSyncInitialTab, setAutoSyncInitialTab] = useState<'listener' | 'webhook'>('listener');
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [webhookOrdersCount, setWebhookOrdersCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRadarRefreshing, setIsRadarRefreshing] = useState(false);

  // Pull-to-refresh: re-read pending native WhatsApp events and refresh the
  // locally stored radar feed without creating duplicates.
  const refreshRadar = async () => {
    if (isRadarRefreshing) return;
    setIsRadarRefreshing(true);
    showToast('🔄 جاري تحديث وجلب أحدث طلبات الواتساب...');
    try {
      // 1. First hydrate from local cache if orders is currently empty
      try {
        const saved = localStorage.getItem('orderi_real_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let dismissedIds: string[] = [];
            try {
              const savedDismissed = JSON.parse(localStorage.getItem('orderi_notification_dismissed_order_ids') || '[]');
              if (Array.isArray(savedDismissed)) dismissedIds = savedDismissed;
            } catch {}
            const permanentlyClosed = getPermanentlyClosedOrderIds();
            const valid = parsed
              .filter((o: any) => o.source !== 'simulation' && !dismissedIds.includes(o.id) && !permanentlyClosed.includes(o.id))
              .map((o: any) => ({ ...o, receivedAt: new Date(o.receivedAt) }));

            if (valid.length > 0) {
              setOrders((prev) => {
                const existing = new Set(prev.map((o) => o.id));
                const missing = valid.filter((v: any) => !existing.has(v.id));
                return [...prev, ...missing].slice(0, 40);
              });
            }
          }
        }
      } catch (storageErr) {
        console.warn('[Orderi] Error loading local persisted orders:', storageErr);
      }

      // 2. Fetch recent webhook & spider crawler orders from server
      try {
        const res = await fetch('/api/whatsapp/recent', { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.orders)) {
            json.orders.forEach((ord: any) => {
              try {
                handleProcessIncomingRawOrder(ord, false);
              } catch (ordErr) {
                console.warn('[Orderi] Error processing incoming server order:', ordErr);
              }
            });
          }
        }
      } catch (netErr) {
        console.warn('[Orderi] Could not fetch server recent orders (using local radar cache):', netErr);
      }

      // 3. In Native Android, check pending notification events with robust per-event isolation
      if (isNativeAndroid()) {
        try {
          const pending = await OrderiNotificationListener.getPending();
          if (pending?.events?.length) {
            const { parseWhatsAppOrderWithLocalAi } = await import('./utils/localAiOrderParser');
            for (const event of pending.events.slice(-30)) {
              try {
                // Strict Source Discrimination:
                // Only authorized delivery groups can be restored or checked for closures
                const sourceAnalysis = discriminateConversationSource(event, filterRef.current);
                if (!canMessageCreateRadarOrder(sourceAnalysis)) {
                  if (sourceAnalysis.isPrivateIndividual) {
                    incrementExcludedPrivateChatsCounter();
                  }
                  await OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] });
                  continue;
                }
                const groupName = sourceAnalysis.groupName!;
                const rawText = (event.rawText || event.bigText || event.text || event.subText || '').trim();
                if (detectAdvertisementMessage(rawText || event.title || '').isAdvertisement) {
                  console.info('[Orderi] Suppressed pending service advertisement');
                  await OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] });
                  continue;
                }
                // Check for order closure in pending batch (e.g. advertiser posted "تم"/sticker while app paused)
                if (filterRef.current.autoCloseOrdersEnabled !== false) {
                  const closureData = {
                    text: rawText || event.title || '',
                    senderName: (event.senderName && event.senderName.trim()) ? event.senderName.trim() : (event.isGroup ? '' : event.title) || '',
                    groupName,
                    timestamp: event.receivedAt || Date.now(),
                    rawQuotedText: (event as any).rawQuotedText || '',
                    messageId: event.id,
                    isGroup: true,
                  };
                  const closureMatch = checkIncomingMessageForClosure(closureData, ordersRef.current);
                  if (closureMatch) {
                    handleAutoOrderClosure(closureMatch);
                    await OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] });
                    continue;
                  }
                }

                const parsed = await parseWhatsAppOrderWithLocalAi(rawText || event.title || '', {
                  hybridMode: filterRef.current.localAiConfig?.hybridMode !== false,
                  useCloudFallback: filterRef.current.useCloudAiFallback === true,
                  senderName: event.senderName || event.title,
                  groupName,
                });
                if (parsed.canCreateOrder) {
                  if (event.isGroup && groupName && groupName !== 'محادثة خاصة 👤') {
                    void OrderiNotificationListener.markGroupAsRead({ groupName }).catch((error) => {
                      console.warn('[Orderi Native] Could not mark source WhatsApp group as read:', error);
                    });
                  }
                  const phoneFromSender = (event.senderName || '').replace(/[^\d+]/g, '');
                  const resolvedSenderName = (event.senderName && event.senderName.trim()) 
                    ? event.senderName.trim() 
                    : (parsed.advertiserName || (event.isGroup ? '' : event.title) || 'معلن بالقروب');
                  const resolvedSenderPhone = parsed.phone || (phoneFromSender.length >= 8 ? phoneFromSender : '');

                  handleProcessIncomingRawOrder({
                    id: `android-wa-${event.id}`,
                    from: parsed.from, to: parsed.to, price: parsed.price,
                    orderCount: parsed.orderCount,
                    isPriceUnspecified: parsed.isPriceUnspecified,
                    scheduledTime: parsed.scheduledTime,
                    scheduledTimeMinutes: parsed.scheduledTimeMinutes,
                    isFutureSchedule: parsed.isFutureSchedule,
                    rawText: rawText || event.title || '', groupName,
                    senderName: resolvedSenderName,
                    senderPhone: resolvedSenderPhone,
                    receivedAt: new Date(event.receivedAt || Date.now()),
                    confidence: parsed.confidence, type: 'whatsapp_notification',
                    notes: parsed.notes, status: 'pending',
                    source: 'android_notification',
                    isDirectPrivate: !event.isGroup,
                    aiTierUsed: parsed.parseMethod,
                    passengerDetection: parsed.passengerDetection,
                  }, true);
                }
                await OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] });
              } catch (singleEventErr) {
                console.warn('[Orderi] Error parsing single pending event, proceeding with next:', singleEventErr);
                try {
                  await OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] });
                } catch {}
              }
            }
          }
        } catch (nativeErr) {
          console.warn('[Orderi Native] Error during getPending in refreshRadar:', nativeErr);
        }
      }

      // 4. Update check for PWA service worker
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) await reg.update().catch(() => {});
        } catch {}
      }

      showToast('✅ تم تحديث الرادار وجلب أحدث الطلبات');
    } catch (e) {
      console.warn('[Orderi] Radar refresh recovered gracefully:', e);
      showToast('✅ تم تنشيط وتحديث رادار الطلبات');
    } finally {
      setTimeout(() => setIsRadarRefreshing(false), 450);
    }
  };

  // Persistent list of groups detected from phone notifications / orders (purged of simulator mock groups)
  const [persistedDetectedGroups, setPersistedDetectedGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orderi_detected_incoming_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((g: any) => typeof g === 'string' && !isSimulatedMockGroup(g));
        }
      }
    } catch {}
    return [];
  });

  // Synchronize Order Spider with Live Radar: Spider works automatically whenever Radar is active
  useEffect(() => {
    localStorage.setItem('orderi_live_radar_active', JSON.stringify(liveRadarActive));

    const activeGroups = Array.from(new Set([
      ...(filter.selectedGroups || []),
      ...(filter.customGroups || []),
      ...(persistedDetectedGroups || []),
      ...(getWhatsAppConnection()?.groups || []),
    ])).filter(Boolean);

    updateSpiderStats({
      isActive: liveRadarActive,
      crawlQueue: activeGroups,
      crawledGroupsCount: activeGroups.length,
      currentCrawlingGroup: activeGroups[0] || (liveRadarActive ? 'قروبات واتساب النشطة 🕷️' : ''),
    });

    try {
      fetch('/api/spider/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: liveRadarActive }),
      }).catch(() => {});
    } catch {}
  }, [liveRadarActive, filter.selectedGroups, filter.customGroups, persistedDetectedGroups]);

  // 6. WhatsApp Group Links Hunter & Interceptor State
  const [discoveredGroupLinks, setDiscoveredGroupLinks] = useState<DiscoveredGroupLink[]>(() => {
    return getStoredDiscoveredGroupLinks();
  });
  const [activeGroupLinkPrompt, setActiveGroupLinkPrompt] = useState<DiscoveredGroupLink | null>(null);
  const [isDiscoveredGroupsModalOpen, setIsDiscoveredGroupsModalOpen] = useState(false);
  const [isAPKModalOpen, setIsAPKModalOpen] = useState(false);

  // 7. Captain User Authentication & Licensing State
  const [currentUser, setCurrentUser] = useState<CaptainUser | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register' | 'activate'>('login');

  const handleOpenAuthModal = (tab: 'login' | 'register' | 'activate' = 'login') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: CaptainUser) => {
    setCurrentUser(user);
    setStoredCurrentUser(user);
    showToast(`أهلاً بك ${user.name}! ${user.isActivated ? 'الترخيص نشط 🇧🇭' : ''}`);
  };

  // Full Application Termination State (خروج من البرنامج هو إغلاق البرنامج بالكامل)
  const [isAppTerminated, setIsAppTerminated] = useState(false);

  const handleLogout = () => {
    setIsAppTerminated(true);
    setStoredCurrentUser(null);
    setCurrentUser(null);
    setIsBarrierDismissed(false);
    setIsWhatsAppConnected(false);
    setLiveRadarActive(false);
    try {
      (window as any)?.Capacitor?.Plugins?.App?.exitApp?.();
    } catch {}
    try {
      window.close();
    } catch {}
    // If Android refuses programmatic exit, reload so the authentication gate
    // becomes the first screen again.
    setTimeout(() => {
      try { window.location.reload(); } catch {}
    }, 150);
  };

  const currentUserRef = useRef<CaptainUser | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser?.phone) {
      syncWhatsAppPhoneWithAccount(currentUser.phone);
    }
  }, [currentUser]);

  // Licensing & Activation: Permanently unlocked for all captains without trial limits
  const isActivated = true;
  const isActivatedRef = useRef(true);
  useEffect(() => {
    isActivatedRef.current = true;
  }, []);

  // Orderi Spider Googlebot-style WhatsApp Crawler Modal State
  const [isSpiderModalOpen, setIsSpiderModalOpen] = useState(false);

  const [isBarrierDismissed, setIsBarrierDismissed] = useState(false);

  // 8. Active Broadcast (Waiting for Courier) Replay Prompt State
  const [targetReplayBroadcastId, setTargetReplayBroadcastId] = useState<string | null>(null);
  const [activeWaitingBroadcast, setActiveWaitingBroadcast] = useState<OrderBroadcast | null>(null);

  // 8b. Focused Order Detail State (Direct deep-link from phone notification clicks)
  const [focusedOrder, setFocusedOrder] = useState<ParsedOrder | null>(null);

  // 8c. Advertiser Confirmation Awarded Celebration Modal State («تم / لك / عندك»)
  const [awardedOrderData, setAwardedOrderData] = useState<{
    order?: ParsedOrder;
    orderId: string;
    advertiserName: string;
    advertiserPhone: string;
    replyText: string;
    from?: string;
    to?: string;
    price?: number;
  } | null>(null);

  // 8d. Monthly Recurring Commitments & School Runs State (الارتباط بالتوصيلات الشهرية)
  const [commitments, setCommitments] = useState<MonthlyCommitment[]>(() => {
    return getStoredCommitments();
  });
  const [isCommitmentsModalOpen, setIsCommitmentsModalOpen] = useState(false);

  // 8e. Order Conflict with Commitment Modal State (تحذير تعارض طلب مع توصيل شهري)
  const [commitmentConflictOrder, setCommitmentConflictOrder] = useState<{
    order: ParsedOrder;
    conflictWarning: string;
    commitmentTitle: string;
  } | null>(null);

  // 8f. Self-Ad Exclusions
  const [excludedOwnAdsCount, setExcludedOwnAdsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('orderi_excluded_own_ads_count');
      if (saved) return parseInt(saved, 10) || 0;
    } catch {}
    return 0;
  });

  // Sync active waiting broadcasts from localStorage
  const refreshWaitingBroadcasts = () => {
    try {
      const raw = localStorage.getItem('orderi_broadcast_history');
      if (raw) {
        const list: OrderBroadcast[] = JSON.parse(raw);
        const waiting = list.find((b) => !b.isCompleted);
        setActiveWaitingBroadcast(waiting || null);
        return;
      }
    } catch {}
    setActiveWaitingBroadcast(null);
  };

  useEffect(() => {
    refreshWaitingBroadcasts();
    const interval = setInterval(refreshWaitingBroadcasts, 3500);
    return () => clearInterval(interval);
  }, []);

  // Sync discovered groups with server on initial mount
  useEffect(() => {
    fetch('/api/whatsapp/discovered-groups')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.groupLinks) && data.groupLinks.length > 0) {
          setDiscoveredGroupLinks((prev) => {
            const map = new Map<string, DiscoveredGroupLink>();
            prev.forEach((item) => map.set(item.inviteCode, item));
            data.groupLinks.forEach((item: DiscoveredGroupLink) => {
              if (!map.has(item.inviteCode)) {
                map.set(item.inviteCode, item);
              }
            });
            const merged = Array.from(map.values());
            saveDiscoveredGroupLinks(merged);
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Native WhatsApp connection is restored from the device-local connection record.
  // No WhatsApp Web gateway session is used by the Android listener flow.
  useEffect(() => {
    const syncNativeConnection = () => {
      setIsWhatsAppConnected(getWhatsAppConnection()?.status === 'connected');
    };
    syncNativeConnection();
    const timer = window.setInterval(syncNativeConnection, 1500);
    return () => window.clearInterval(timer);
  }, []);

  // Sync Screen Wake Lock state if requested in filter
  useEffect(() => {
    if (filter.keepScreenAwake) {
      requestScreenWakeLock();
    } else {
      releaseScreenWakeLock();
    }
  }, [filter.keepScreenAwake]);

  // Heartbeat to keep background radar alive on mobile browsers & background tabs
  useEffect(() => {
    startBackgroundHeartbeat();
    const handleFirstGesture = () => {
      primeBackgroundAudio();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // Automated background polling of pending events & radar refresh for archived groups
  useEffect(() => {
    if (!isNativeAndroid()) return;
    if (filter.monitorArchivedGroups === false || filter.autoArchivedChatsPolling === false) return;

    const intervalMinutes = Math.max(1, filter.archivedPollingIntervalMinutes || 2);
    const intervalMs = intervalMinutes * 60 * 1000;

    const sweepTimer = window.setInterval(() => {
      void refreshRadar();
    }, intervalMs);

    return () => window.clearInterval(sweepTimer);
  }, [filter.monitorArchivedGroups, filter.autoArchivedChatsPolling, filter.archivedPollingIntervalMinutes]);

  // Initial mount: load recent WhatsApp orders immediately into radar
  useEffect(() => {
    void refreshRadar();
  }, []);

  // Reference to prevent duplicate sounds
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const driverLocationRef = useRef(driverLocation);
  driverLocationRef.current = driverLocation;
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  // Persist real captured orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orderi_real_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  // Save filter & accepted orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orderi_filter_settings', JSON.stringify(filter));
      if (isNativeAndroid() && OrderiNotificationListener.updateFilterSettings) {
        OrderiNotificationListener.updateFilterSettings({
          ignoreNonMatching: filter.ignoreNonMatching,
          minPrice: filter.minPrice,
          coverageKm: filter.maxDistanceKm,
          driverLat: driverLocation?.latitude,
          driverLon: driverLocation?.longitude,
          blockPassenger: filter.blockPassengerDeliveries !== false,
          notificationsEnabled: (filter.notificationsEnabled !== false) && (filter.backgroundNotificationsEnabled !== false),
        }).catch(() => {});
      }
    } catch {}
  }, [filter, driverLocation]);

  useEffect(() => {
    try {
      localStorage.setItem('orderi_accepted_orders', JSON.stringify(acceptedOrders));
    } catch {}
  }, [acceptedOrders]);

  // Persist driver location to localStorage
  useEffect(() => {
    if (driverLocation) {
      try {
        localStorage.setItem('orderi_driver_location', JSON.stringify(driverLocation));
      } catch {}
    }
  }, [driverLocation]);

  // Persist live radar active state
  useEffect(() => {
    try {
      localStorage.setItem('orderi_live_radar_active', JSON.stringify(liveRadarActive));
    } catch {}
  }, [liveRadarActive]);

  // Persist feed filter
  useEffect(() => {
    try {
      localStorage.setItem('orderi_feed_filter', feedFilter);
    } catch {}
  }, [feedFilter]);

  // Flush all critical states to localStorage on tab switch / window close / mobile app hide
  useEffect(() => {
    const handleFlushStorage = () => {
      try {
        localStorage.setItem('orderi_filter_settings', JSON.stringify(filterRef.current));
        if (driverLocationRef.current) {
          localStorage.setItem('orderi_driver_location', JSON.stringify(driverLocationRef.current));
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleFlushStorage);
    window.addEventListener('pagehide', handleFlushStorage);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleFlushStorage();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleFlushStorage);
      window.removeEventListener('pagehide', handleFlushStorage);
    };
  }, []);

  // Check if a group is allowed by driver filter
  const isOrderGroupAllowedRef = (groupName?: string) => {
    if (!groupName) return true; // Default fallback to allow order if group is unspecified
    const clean = groupName.trim();
    if (clean === 'محادثة خاصة 👤' || clean === 'محادثة خاصة' || clean === 'خاص 👤' || clean === 'محادثة فردية') {
      return false; // المحادثات الفردية الشخصية مستبعدة نهائياً من الرادار
    }

    // البث المباشر وقناة الرادار العامة
    if (clean === 'واتساب' || clean.toLowerCase() === 'whatsapp') {
      return true;
    }

    // رصد قروبات الواتساب المؤرشفة تلقائياً إذا كان الخيار مفعلاً
    if (filterRef.current.monitorArchivedGroups !== false) {
      const isArchived = clean.includes('مؤرشف') || clean.toLowerCase().includes('archive');
      if (isArchived) return true;
    }

    if (!filterRef.current.selectedGroups || filterRef.current.selectedGroups.length === 0) return true;

    return filterRef.current.selectedGroups.some(g =>
      clean.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(clean.toLowerCase())
    );
  };

  // Track processed order IDs to prevent duplicate alerts
  const processedOrderIdsRef = useRef<Set<string>>(new Set());

  // Unified processor for incoming WhatsApp orders from SSE, Pairing, or Polling
  const handleProcessIncomingRawOrder = (raw: any, isInitialBatch = false) => {
    if (!raw || !raw.id) return;

    // Strict Privacy & Discrimination Gate:
    // Personal 1-on-1 private messages and non-groups CAN NEVER be created as Radar orders!
    if (
      raw.isDirectPrivate === true ||
      raw.groupName === 'محادثة خاصة 👤' ||
      raw.groupName === 'محادثة خاصة' ||
      raw.groupName === 'خاص 👤' ||
      raw.groupName === 'محادثة فردية'
    ) {
      incrementExcludedPrivateChatsCounter();
      return;
    }

    if (!raw.groupName) {
      raw.groupName = 'واتساب';
    }

    try {
      const dismissed = JSON.parse(localStorage.getItem('orderi_notification_dismissed_order_ids') || '[]');
      if (Array.isArray(dismissed) && dismissed.includes(raw.id)) return;
    } catch {}

    // Apply the same silent advertisement gate before any side effects, including
    // group discovery, link prompts, radar insertion, sounds, toasts or notifications.
    const earlyAdvertisementCheck = detectAdvertisementMessage(
      raw.rawText || `${raw.from || ''} ${raw.to || ''}`
    );
    if (earlyAdvertisementCheck.isAdvertisement) {
      console.info('[Orderi] Silently filtered advertisement before processing:', earlyAdvertisementCheck.reason || 'advertisement');
      return;
    }

    if (processedOrderIdsRef.current.has(raw.id)) return;
    processedOrderIdsRef.current.add(raw.id);

    // Always save detected group name immediately from incoming WhatsApp message/notification
    if (raw.groupName && raw.groupName !== 'محادثة خاصة 👤' && !raw.groupName.includes('محادثة خاصة')) {
      setPersistedDetectedGroups((prev) => {
        if (!prev.includes(raw.groupName)) {
          const next = [raw.groupName, ...prev];
          try {
            localStorage.setItem('orderi_detected_incoming_groups', JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }

    // Always sniff for any group links inside the raw message immediately
    if (raw.rawText) {
      const embeddedLinks = extractGroupLinksFromText(raw.rawText, raw.senderName, raw.senderPhone, raw.groupName);
      if (embeddedLinks.length > 0) {
        embeddedLinks.forEach((link) => {
          setDiscoveredGroupLinks((prev) => {
            const exists = prev.some((l) => l.inviteCode === link.inviteCode);
            if (exists) return prev;
            const next = [link, ...prev];
            saveDiscoveredGroupLinks(next);
            setActiveGroupLinkPrompt(link);
            return next;
          });
        });
      }
    }

    // Order processing is permanently active without trial restrictions
    const isAppActive = true;

    recordSpiderEvent({
      action: 'INDEXED',
      groupName: raw.groupName || 'قروب واتساب',
      detail: `التقاط طلب توصيل: ${raw.from || 'البحرين'} ➔ ${raw.to || 'البحرين'} (${raw.price > 0 ? `${raw.price} د.ب` : 'سعر عند الاتفاق'})`,
      latencyMs: 14,
      highlight: `${raw.from || 'البحرين'} ➔ ${raw.to || 'البحرين'}`,
    });

    setWebhookOrdersCount((prev) => prev + 1);

    // 0. Check if this advertisement is posted by the captain themself (استبعاد إعلاناتي الشخصية من الرادار)
    const ownAdDetection = detectIsOwnAd(
      {
        senderPhone: raw.senderPhone,
        senderName: raw.senderName,
        rawText: raw.rawText,
        isFromMe: (raw as any).isFromMe,
      },
      filterRef.current,
      currentUserRef.current
    );

    if (ownAdDetection.isOwnAd && filterRef.current.excludeMyOwnAds !== false) {
      console.info('[Orderi Radar] Excluded own ad from radar:', ownAdDetection.reason);
      setExcludedOwnAdsCount((prev) => {
        const next = prev + 1;
        try { localStorage.setItem('orderi_excluded_own_ads_count', String(next)); } catch {}
        return next;
      });
      return; // Silently suppress captain's own ad from radar & alerts!
    }

    // Calculate matching with current driver location & active filter
    const match = evaluateOrderMatch(
      raw.from,
      raw.to,
      raw.price,
      filterRef.current,
      driverLocationRef.current,
      { rawText: raw.rawText || '', scheduledTimeMinutes: raw.scheduledTimeMinutes, postedAt: raw.receivedAt }
    );

    // Check VIP or Blacklist contact status
    const contactCheck = checkOrderContactStatus(
      raw.senderPhone,
      raw.senderName,
      filterRef.current.contacts || []
    );

    // Auto-block if blacklisted
    if (filterRef.current.autoBlockBlacklist && contactCheck.status === 'blacklist') {
      return;
    }

    // Check if WhatsApp group is allowed by driver's group filter
    if (!isOrderGroupAllowedRef(raw.groupName)) {
      return;
    }

    // Classify passengers before duplicate handling so no later path can bypass filters.
    const passengerDetection = raw.passengerDetection || detectPassengerDelivery(raw.rawText || `${raw.from} ${raw.to}`, {
      isBlockForbiddenEnabled: filterRef.current.blockPassengerDeliveries !== false,
    });

    // Compare order & advertiser across WhatsApp groups to prevent duplicates (منع تكرار نشر نفس الإعلان في عدة قروبات)
    if (filterRef.current.preventDuplicateOrders !== false) {
      const existingMatch = findDuplicateOrderMatch(raw, ordersRef.current);
      if (existingMatch) {
        // Synchronously update ordersRef.current so burst messages see the merge immediately
        ordersRef.current = ordersRef.current.map((o) => {
          if (o.id === existingMatch.id) {
            const currentGroups = o.crossPostedGroups || [o.groupName];
            const updatedGroups = currentGroups.includes(raw.groupName)
              ? currentGroups
              : [...currentGroups, raw.groupName];
            return {
              ...o,
              crossPostedGroups: updatedGroups,
              duplicateCount: (o.duplicateCount || 1) + 1,
            };
          }
          return o;
        });

        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === existingMatch.id) {
              const currentGroups = o.crossPostedGroups || [o.groupName];
              const updatedGroups = currentGroups.includes(raw.groupName)
                ? currentGroups
                : [...currentGroups, raw.groupName];
              return {
                ...o,
                crossPostedGroups: updatedGroups,
                duplicateCount: (o.duplicateCount || 1) + 1,
              };
            }
            return o;
          })
        );
        rememberOrderFingerprint(raw);
        console.info(`[Orderi Dedup] Merged cross-posted ad from ${raw.senderName || 'معلن'} in group "${raw.groupName}" into existing order ${existingMatch.id}`);
        return; // Suppress duplicate card in radar and suppress duplicate notification!
      }
    }

    // If this order has already been closed/taken by a driver, never resurrect it into active radar
    if (isOrderPermanentlyClosed(raw.id)) {
      return;
    }

    if (ordersRef.current.some((o) => o.id === raw.id)) {
      return;
    }

    // Secondary fingerprint check: If this order fingerprint was already alerted recently across any group
    const isAlreadyAlerted = isDuplicateOrder(raw);
    if (isAlreadyAlerted) {
      // Find matching order in active radar to attach cross-posted group name
      const fallbackMatch = findDuplicateOrderMatch(raw, ordersRef.current);
      if (fallbackMatch) {
        ordersRef.current = ordersRef.current.map((o) => {
          if (o.id === fallbackMatch.id) {
            const currentGroups = o.crossPostedGroups || [o.groupName];
            const updatedGroups = currentGroups.includes(raw.groupName) ? currentGroups : [...currentGroups, raw.groupName];
            return { ...o, crossPostedGroups: updatedGroups, duplicateCount: (o.duplicateCount || 1) + 1 };
          }
          return o;
        });
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === fallbackMatch.id) {
              const currentGroups = o.crossPostedGroups || [o.groupName];
              const updatedGroups = currentGroups.includes(raw.groupName) ? currentGroups : [...currentGroups, raw.groupName];
              return { ...o, crossPostedGroups: updatedGroups, duplicateCount: (o.duplicateCount || 1) + 1 };
            }
            return o;
          })
        );
      }
      console.info(`[Orderi Dedup] Suppressed duplicate notification and duplicate card for cross-posted ad in "${raw.groupName}"`);
      return; // Do NOT insert duplicate card and do NOT send notification!
    }

    // Check Desired Destination Hunting (صائد وجهات التوصيل والتسليم المرغوبة في القروبات)
    const destinationHunt = checkOrderDestinationHunt(
      { from: raw.from, to: raw.to, rawText: raw.rawText },
      filterRef.current
    );
    const isDestinationHunted = destinationHunt.isHunted;
    const huntedDestinationDetails = destinationHunt.isHunted ? {
      type: destinationHunt.matchType || 'delivery',
      matchedArea: destinationHunt.matchedArea || raw.to,
      routeLabel: destinationHunt.routeLabel,
    } : undefined;

    if (isDestinationHunted) {
      saveHuntedDestinationLog({
        id: `hunt-${Date.now()}-${raw.id}`,
        orderId: raw.id,
        from: raw.from,
        to: raw.to,
        price: typeof raw.price === 'number' && raw.price > 0 ? raw.price : 0,
        groupName: raw.groupName || 'واتساب',
        matchedArea: destinationHunt.matchedArea || raw.to,
        matchType: destinationHunt.matchType || 'delivery',
        huntedAt: new Date().toISOString(),
        rawText: raw.rawText || '',
      });
    }

    const newOrder: ParsedOrder = {
      ...raw,
      price: typeof raw.price === 'number' && raw.price > 0 ? raw.price : 0,
      isPriceUnspecified: raw.isPriceUnspecified ?? (!raw.price || raw.price <= 0),
      receivedAt: new Date(raw.receivedAt || Date.now()),
      match,
      contactStatus: contactCheck.status,
      matchedContact: contactCheck.contact,
      source: raw.source || 'webhook_auto',
      isDirectPrivate: raw.isDirectPrivate,
      crossPostedGroups: raw.crossPostedGroups || [raw.groupName],
      duplicateCount: raw.duplicateCount || 1,
      passengerDetection,
      isDestinationHunted,
      huntedDestinationDetails,
      isOwnAd: ownAdDetection.isOwnAd,
      ownAdReason: ownAdDetection.reason,
    };

    // Sound, Vibration & Notifications
    if (!isInitialBatch && !isAlreadyAlerted) {
      const isPassengerBlocked = passengerDetection.level === 'confirmed_passenger' && filterRef.current.blockPassengerDeliveries !== false;

      if (newOrder.match.scheduleFeasible === false) {
        showToast(`تم رصد الطلب للمراجعة دون تنبيه: ${newOrder.match.scheduleReason || 'موعد الاستلام غير مناسب'}`);
      } else if (isPassengerBlocked) {
        // تنبيه أحمر بنقل أشخاص: الإعلان يظهر بالرادار للعلم مع تحذير المنع
        showToast(`🚨 رصد إعلان نقل ركاب (${newOrder.from} ← ${newOrder.to}) • تحذير: توصيل أشخاص ممنوع 🚫`);
        if (filterRef.current.soundEnabled) {
          playAlertTone('urgent_siren', 65);
        }
      } else if (contactCheck.status === 'vip') {
        if (filterRef.current.soundEnabled) {
          playExcellentAlertSound(filterRef.current.soundVolume ?? 85);
        }
        if (filterRef.current.vibrationEnabled) {
          triggerCustomVibration('urgent', 3, true);
        }
        if (filterRef.current.notificationsEnabled !== false && (filterRef.current.backgroundNotificationsEnabled ?? true)) {
          sendBackgroundOrderNotification(newOrder, filterRef.current);
        }
        showToast(`⭐ وارد تلقائياً: طلب VIP من (${contactCheck.contact?.name || newOrder.senderName}) • ${newOrder.from} ← ${newOrder.to}`);
      } else if (filterRef.current.notificationsEnabled && newOrder.match.score >= 80) {
        if (newOrder.match.score >= 90 && filterRef.current.excellentAlertEnabled) {
          if (filterRef.current.soundEnabled) {
            playExcellentAlertSound(filterRef.current.soundVolume ?? 85);
          }
          if (filterRef.current.vibrationEnabled) {
            triggerCustomVibration(filterRef.current.vibrationPattern || 'standard', filterRef.current.vibrationIntensity ?? 2, true);
          }
        } else {
          if (filterRef.current.soundEnabled) {
            playAlertTone(filterRef.current.alertTone || 'chime', filterRef.current.soundVolume ?? 80, filterRef.current.customSoundDataUrl);
          }
          if (filterRef.current.vibrationEnabled) {
            triggerCustomVibration(filterRef.current.vibrationPattern || 'standard', filterRef.current.vibrationIntensity ?? 2, false);
          }
        }

        if (filterRef.current.notificationsEnabled !== false && (filterRef.current.backgroundNotificationsEnabled ?? true)) {
          sendBackgroundOrderNotification(newOrder, filterRef.current);
        }
        const orderKindLabel = isDestinationHunted 
          ? `🎯 صيد وجهة مرغوبة (${destinationHunt.matchedArea || newOrder.to})`
          : (passengerDetection.level === 'confirmed_passenger' ? 'طلب توصيل راكب 👥' : 'طلب بضائع 🚗');
        showToast(`⚡ ${orderKindLabel} وارد من واتساب (${newOrder.isDirectPrivate ? 'خاص 👤' : 'قروب 👥'}) • ${newOrder.from} ← ${newOrder.to}`);
        if (isDestinationHunted && filterRef.current.destinationSniperAlert !== false && filterRef.current.soundEnabled) {
          playAlertTone('cash_register', 90);
        }
      } else {
        // الطلب غير مطابق لشروط الكابتن
        if (filterRef.current.ignoreNonMatching && newOrder.match.score < 80) {
          // الحجب مفعل: لا نصدر تنبيهاً ولا إشعاراً لطلب غير مطابق، ويبقى صامتاً مع ظهوره بالرادار
        } else {
          // الحجب معطل: الكابتن يسمح بالطلبات غير المطابقة ويريد تنبيهات وإشعارات كاملة لها
          if (filterRef.current.soundEnabled) {
            playAlertTone(filterRef.current.alertTone || 'chime', 60);
          }
          if (filterRef.current.notificationsEnabled !== false && (filterRef.current.backgroundNotificationsEnabled ?? true)) {
            sendBackgroundOrderNotification(newOrder, filterRef.current);
          }
          showToast(`⚡ وارد تلقائياً من واتساب: ${newOrder.from} ← ${newOrder.to} (${newOrder.price} د.ب)`);
        }
      }
    }

    // Register immediately in synchronous registry and memory ref to defeat burst duplicate races
    registerOrderInDedupRegistry(newOrder);
    rememberOrderFingerprint(newOrder);
    ordersRef.current = [newOrder, ...ordersRef.current.filter((o) => o.id !== newOrder.id)].slice(0, 40);

    setOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) return prev;
      const nextList = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)].slice(0, 40);
      try {
        localStorage.setItem('orderi_real_orders', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    // Phone alerts are created only after the order has passed parsing, filters,
    // and deduplication and is being inserted into Radar (respecting blocking rules).
    if (!isInitialBatch && isNativeAndroid() && filterRef.current.notificationsEnabled !== false &&
        (filterRef.current.backgroundNotificationsEnabled ?? true)) {
      const isPassengerBlocked = (newOrder.passengerDetection?.level === 'confirmed_passenger' || newOrder.passengerDetection?.level === 'suspicious_passenger') && filterRef.current.blockPassengerDeliveries !== false;
      const isNonMatchingBlocked = filterRef.current.ignoreNonMatching && newOrder.match.score < 80 && newOrder.contactStatus !== 'vip';
      const isOwnAdBlocked = (newOrder.isOwnAd || (newOrder as any).isFromMe) && filterRef.current.excludeMyOwnAds !== false;

      if (!isPassengerBlocked && !isNonMatchingBlocked && !isOwnAdBlocked) {
        void OrderiNotificationListener.showOrderNotification({
          orderId: newOrder.id,
          from: newOrder.from || 'غير محدد',
          to: newOrder.to || 'غير محدد',
          price: newOrder.price || 0,
          priceDisplay: (!newOrder.price || newOrder.price <= 0 || newOrder.isPriceUnspecified)
            ? ''
            : `${Number.isInteger(newOrder.price) ? newOrder.price : Number(newOrder.price.toFixed(1))} دينار`,
          rawText: newOrder.rawText || '',
        }).catch((error) => console.warn('[Orderi] Could not show accepted Radar order notification:', error));
      }
    }
  };

  // Keep phone notifications aligned with the exact order IDs currently in Radar.
  useEffect(() => {
    if (!isNativeAndroid()) return;
    const orderIds = orders.map((order) => order.id).filter(Boolean);
    void OrderiNotificationListener.syncOrderNotifications({ orderIds })
      .catch((error) => console.warn('[Orderi] Could not sync Radar notifications:', error));
  }, [orders]);

  // Dismissing a phone notification removes its order and stores a tombstone so
  // refreshes and queued WhatsApp events cannot immediately recreate that order.
  useEffect(() => {
    let active = true;

    // Clear all orders in radar when "Clear All" (مسح الكل) is pressed in notifications
    const clearAllOrders = (notifyToast = true) => {
      const currentIds = ordersRef.current.map((o) => o.id);
      if (currentIds.length > 0) {
        let saved: string[] = [];
        try {
          const parsed = JSON.parse(localStorage.getItem('orderi_notification_dismissed_order_ids') || '[]');
          if (Array.isArray(parsed)) saved = parsed;
        } catch {}
        const next = Array.from(new Set([...saved, ...currentIds])).slice(-500);
        try { localStorage.setItem('orderi_notification_dismissed_order_ids', JSON.stringify(next)); } catch {}

        currentIds.forEach((id) => {
          fetch('/api/whatsapp/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: id }),
          }).catch(() => {});
        });
      }

      setOrders([]);
      try {
        localStorage.setItem('orderi_real_orders', JSON.stringify([]));
        localStorage.removeItem('orderi_cached_orders');
        sessionStorage.setItem('orderi_notifs_sent_count', '0');
      } catch {}

      if (notifyToast) {
        showToast('🗑️ تم مسح جميع الطلبات من الرادار لمطابقة مسح الكل للإشعارات ✓✓');
      }
    };

    const persistDismissed = (orderIds: string[]) => {
      if (!orderIds.length) return;

      // If all active orders in the radar are being dismissed at once (Clear All action)
      if (ordersRef.current.length > 0 && ordersRef.current.every((o) => orderIds.includes(o.id))) {
        clearAllOrders(true);
        return;
      }

      let saved: string[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem('orderi_notification_dismissed_order_ids') || '[]');
        if (Array.isArray(parsed)) saved = parsed;
      } catch {}
      const next = Array.from(new Set([...saved, ...orderIds])).slice(-500);
      try { localStorage.setItem('orderi_notification_dismissed_order_ids', JSON.stringify(next)); } catch {}

      // Delete from active radar orders state
      setOrders((prev) => {
        const remaining = prev.filter((order) => !orderIds.includes(order.id));
        if (prev.length > 0 && remaining.length === 0) {
          clearAllOrders(true);
        }
        return remaining;
      });

      // Clean from localStorage caches
      try {
        const realStored = localStorage.getItem('orderi_real_orders');
        if (realStored) {
          const parsed: any[] = JSON.parse(realStored);
          if (Array.isArray(parsed)) {
            localStorage.setItem('orderi_real_orders', JSON.stringify(parsed.filter((o) => !orderIds.includes(o.id))));
          }
        }
        const cachedStored = localStorage.getItem('orderi_cached_orders');
        if (cachedStored) {
          const parsed: any[] = JSON.parse(cachedStored);
          if (Array.isArray(parsed)) {
            localStorage.setItem('orderi_cached_orders', JSON.stringify(parsed.filter((o) => !orderIds.includes(o.id))));
          }
        }
      } catch {}

      // Notify server so it is marked read
      orderIds.forEach((id) => {
        fetch('/api/whatsapp/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id }),
        }).catch(() => {});
      });
    };

    // 1. Android Native Listener & Periodic Background Sync
    let nativeListenerPromise: Promise<any> | null = null;
    let nativeAllDismissPromise: Promise<any> | null = null;
    let syncInterval: any = null;

    const checkNativeDismissals = () => {
      if (!active || !isNativeAndroid()) return;
      void OrderiNotificationListener.getDismissedOrderIds().then((result) => {
        if (!active) return;
        if (result?.allDismissed) {
          clearAllOrders(true);
        } else if (result?.orderIds?.length) {
          persistDismissed(result.orderIds);
        }
      }).catch(() => {});
    };

    if (isNativeAndroid()) {
      nativeListenerPromise = OrderiNotificationListener.addListener('orderNotificationDismissed', (event) => {
        if (!active) return;
        if (event?.allDismissed) {
          clearAllOrders(true);
        } else if (event?.orderId) {
          persistDismissed([event.orderId]);
        }
      });
      nativeAllDismissPromise = OrderiNotificationListener.addListener('allOrderNotificationsDismissed', () => {
        if (active) clearAllOrders(true);
      });
      checkNativeDismissals();
      syncInterval = setInterval(checkNativeDismissals, 2000);
    }

    // Check dismissals when app returns to foreground from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNativeDismissals();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Web / Browser Custom Event Listener
    const handleWebNotificationDismiss = (e: any) => {
      if (!active) return;
      if (e.detail?.allDismissed) {
        clearAllOrders(true);
      } else if (e.detail?.orderId) {
        persistDismissed([e.detail.orderId]);
      }
    };
    const handleWebAllDismiss = () => {
      if (active) clearAllOrders(true);
    };
    window.addEventListener('orderi:notification_dismissed', handleWebNotificationDismiss);
    window.addEventListener('orderi:all_notifications_dismissed', handleWebAllDismiss);

    // 3. BroadcastChannel listener across tabs and service worker
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('orderi_notifications');
        bc.onmessage = (ev) => {
          if (!active) return;
          if (ev.data?.type === 'ALL_NOTIFICATIONS_DISMISSED') {
            clearAllOrders(true);
          } else if (ev.data?.type === 'NOTIFICATION_DISMISSED' && ev.data?.orderId) {
            persistDismissed([ev.data.orderId]);
          }
        };
      }
    } catch {}

    return () => {
      active = false;
      if (syncInterval) clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (nativeListenerPromise) {
        void nativeListenerPromise.then((handle) => handle.remove()).catch(() => {});
      }
      if (nativeAllDismissPromise) {
        void nativeAllDismissPromise.then((handle) => handle.remove()).catch(() => {});
      }
      window.removeEventListener('orderi:notification_dismissed', handleWebNotificationDismiss);
      window.removeEventListener('orderi:all_notifications_dismissed', handleWebAllDismiss);
      if (bc) bc.close();
    };
  }, []);

  // Native Android WhatsApp listener: receives com.whatsapp notifications even while Orderi is backgrounded.
  useEffect(() => {
    if (!isNativeAndroid()) return;
    let removed = false;
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    // A notification can be delivered both by the live native broadcast and by
    // getPending() during startup. Deduplicate by native event ID, not message text.
    const seenNativeEventIds = new Set<string>();
    const convertNativeEvent = (event: WhatsAppNativeEvent) => {
      if (event?.id) {
        if (seenNativeEventIds.has(event.id)) return;
        seenNativeEventIds.add(event.id);
        if (seenNativeEventIds.size > 500) {
          const oldest = seenNativeEventIds.values().next().value;
          if (oldest) seenNativeEventIds.delete(oldest);
        }
      }
      const rawText = (event.rawText || event.bigText || event.text || event.subText || '').trim();
      if (!rawText && !event.title) {
        void OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] }).catch((error) => console.warn('[Orderi Spider] Event acknowledgement failed; it remains queued:', error));
        return;
      }

      // 1. Strict Conversation Source Discrimination:
      // Identifies authorized delivery groups vs personal 1-on-1 private chats vs ambiguous sources
      const sourceAnalysis = discriminateConversationSource(event, filterRef.current);

      if (sourceAnalysis.sourceType === 'private_individual') {
        incrementExcludedPrivateChatsCounter();

        // Check if driver has an ACTIVE outreach to this specific contact/phone for a pending order
        if (rawText) {
          const activeOutreachOrder = ordersRef.current.find((ord) => {
            if (ord.status !== 'pending' || !ord.outreachStatus) return false;
            const ordPhone = (ord.senderPhone || '').replace(/\D/g, '');
            const evPhone = (event.senderPhone || event.title || '').replace(/\D/g, '');
            if (ordPhone.length >= 8 && evPhone.length >= 8 && ordPhone.slice(-8) === evPhone.slice(-8)) return true;
            if (ord.senderName && event.title && ord.senderName.trim() === event.title.trim()) return true;
            return false;
          });

          if (activeOutreachOrder) {
            const replyVerdict = classifyAdvertiserPrivateReply(rawText);
            if (replyVerdict.verdict === 'CONFIRMED_AWARDED') {
              setAwardedOrderData({
                orderId: activeOutreachOrder.id,
                advertiserName: event.title || activeOutreachOrder.senderName || 'صاحب الإعلان',
                advertiserPhone: activeOutreachOrder.senderPhone || '',
                replyText: rawText.trim(),
              });
              showToast(`✅ المعلن رد عليك بالخاص وأكّد الطلب لك («${rawText.trim()}»)`);
              if (filterRef.current.soundEnabled) {
                playAlertTone('cash_register', 90);
              }
            } else if (replyVerdict.verdict === 'REJECTED_OR_TAKEN') {
              console.log('[Orderi Native] Contacted advertiser replied taken/cancelled:', rawText);
            }
          } else {
            console.log('[Orderi AI] Casual WhatsApp message from personal chat excluded for privacy:', {
              sender: event.title || event.senderName,
            });
          }
        }

        // STRICT PRIVACY GUARANTEE: Never create order from personal 1-on-1 chats, never close other orders!
        void OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] }).catch(() => {});
        return;
      }

      if (sourceAnalysis.sourceType === 'unauthorized_group') {
        // Group is not selected in restricted mode, but record it into detected groups so the driver sees it!
        if (sourceAnalysis.groupName && !isSimulatedMockGroup(sourceAnalysis.groupName)) {
          setPersistedDetectedGroups((prev) => {
            if (!prev.includes(sourceAnalysis.groupName!)) {
              const next = [sourceAnalysis.groupName!, ...prev];
              try { localStorage.setItem('orderi_detected_incoming_groups', JSON.stringify(next)); } catch {}
              return next;
            }
            return prev;
          });
        }
        void OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] }).catch(() => {});
        return;
      }

      if (sourceAnalysis.sourceType === 'undetermined_ambiguous') {
        // Ambiguous notifications are always dropped. Message content must
        // never promote an unknown/private chat into a trusted delivery group.
        void OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] }).catch(() => {});
        return;
      }

      // At this point, source is an authorized delivery group or verified order!
      const groupName = sourceAnalysis.groupName || event.groupName || event.conversationTitle || event.title || 'واتساب';
      const isGroup = true;
      
      // Suppress provider/travel/commercial adverts before closure matching, radar insertion,
      // sounds, toasts and phone notifications.
      const advertisementCheck = detectAdvertisementMessage(rawText || event.title || '');
      if (advertisementCheck.isAdvertisement) {
        console.info('[Orderi] Suppressed service/commercial advertisement:', advertisementCheck.reason || 'advertisement');
        void OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] }).catch((error) => console.warn('[Orderi Spider] Event acknowledgement failed; it remains queued:', error));
        return;
      }

      // A real WhatsApp notification verifies that the native listener is seeing WhatsApp on this device.
      markWhatsAppVerified(groupName);
      setIsWhatsAppConnected(true);

      // IMMEDIATE GROUP REGISTRATION & AUTO-ADOPTION: Always bind and monitor the group automatically
      if (groupName && groupName !== 'محادثة خاصة 👤' && !groupName.includes('محادثة خاصة') && !isSimulatedMockGroup(groupName)) {
        autoAdoptDetectedGroups([groupName]);
        setFilter((prev) => {
          if (!prev.selectedGroups.includes(groupName)) {
            return { ...prev, selectedGroups: [...prev.selectedGroups, groupName] };
          }
          return prev;
        });
        try {
          const saved = localStorage.getItem('orderi_my_whatsapp_groups');
          const list = saved ? JSON.parse(saved) : [];
          if (!list.includes(groupName)) {
            localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify([...list, groupName]));
          }
        } catch {}
        setPersistedDetectedGroups((prev) => {
          if (!prev.includes(groupName)) {
            const next = [groupName, ...prev];
            try {
              localStorage.setItem('orderi_detected_incoming_groups', JSON.stringify(next));
            } catch {}
            showToast(`👥 تم ربط واعتماد قروب واتساب جديد بحسابك تلقائياً: "${groupName}"`);
            return next;
          }
          return prev;
        });
      }

      // IMMEDIATE GROUP LINK INTERCEPTOR: Detect any WhatsApp invite links from ANY message
      if (rawText) {
        const embeddedLinks = extractGroupLinksFromText(rawText, event.senderName || event.title || 'معلن واتساب', '', groupName);
        if (embeddedLinks.length > 0) {
          embeddedLinks.forEach((link) => {
            setDiscoveredGroupLinks((prev) => {
              const exists = prev.some((l) => l.inviteCode === link.inviteCode);
              if (exists) return prev;
              const next = [link, ...prev];
              saveDiscoveredGroupLinks(next);
              setActiveGroupLinkPrompt(link);
              showToast(`🔗 تم التقاط رابط قروب جديد: "${link.title}"`);
              return next;
            });
          });
        }
      }

      // Register advertiser as a known group advertiser when active in monitored groups
      registerKnownGroupAdvertiser(event.senderName || event.title);

      // Check for Smart Order Closure (الكشف الذكي عن الطلبات المحجوزة أو المنتهية)
      if (filterRef.current.autoCloseOrdersEnabled !== false) {
        const closureMessageData = {
          text: rawText || event.title || '',
          // In group notifications title is often the GROUP name. Prefer the actual
          // sender extracted from Android MessagingStyle so "تم"/stickers can be
          // safely linked to the advertiser who posted the original order.
          senderName: event.senderName || (event.isGroup ? '' : event.title) || '',
          groupName,
          timestamp: event.receivedAt || Date.now(),
          rawQuotedText: (event as any).rawQuotedText || (event as any).quotedText || '',
          messageId: event.id,
          isGroup: true,
        };

        const fastClosureMatch = checkIncomingMessageForClosure(
          closureMessageData,
          ordersRef.current
        );
        if (fastClosureMatch) {
          handleAutoOrderClosure(fastClosureMatch);
          void OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] }).catch((error) => console.warn('[Orderi Spider] Event acknowledgement failed; it remains queued:', error));
          return;
        }

        // إذا كانت الرسالة من معلن بالقروب ولم تطابق القاموس المباشر، نفحصها بالذكاء الاصطناعي لفهم التعابير العامية الجديدة
        checkIncomingMessageForClosureWithAI(closureMessageData, ordersRef.current).then((aiClosureMatch) => {
          if (aiClosureMatch) {
            handleAutoOrderClosure(aiClosureMatch);
          }
        }).catch(() => {});
      }

      import('./utils/localAiOrderParser').then(async ({ parseWhatsAppOrderWithLocalAi }) => {
        const parsed = await parseWhatsAppOrderWithLocalAi(rawText || event.title || '', {
          hybridMode: filterRef.current.localAiConfig?.hybridMode !== false,
          useCloudFallback: filterRef.current.useCloudAiFallback === true && canForwardToCloudAI(sourceAnalysis),
          senderName: event.senderName || event.title,
          groupName,
        });
        const order = {
          id: `android-wa-${event.id}`,
          from: parsed.from,
          to: parsed.to,
          price: parsed.price,
          orderCount: parsed.orderCount,
          isPriceUnspecified: parsed.isPriceUnspecified,
          scheduledTime: parsed.scheduledTime,
          scheduledTimeMinutes: parsed.scheduledTimeMinutes,
          isFutureSchedule: parsed.isFutureSchedule,
          rawText: rawText || event.title || '',
          senderName: (event.senderName && event.senderName.trim()) 
            ? event.senderName.trim() 
            : (parsed.advertiserName || event.title || 'معلن بالقروب'),
          senderPhone: parsed.phone || ((event.senderName || '').replace(/[^\d+]/g, '').length >= 8 ? (event.senderName || '').replace(/[^\d+]/g, '') : ''),
          receivedAt: new Date(event.receivedAt || Date.now()),
          confidence: parsed.confidence,
          type: 'whatsapp_notification',
          notes: parsed.notes || '',
          status: 'pending' as const,
          source: 'android_notification' as const,
          isDirectPrivate: false,
          aiTierUsed: parsed.parseMethod,
          passengerDetection: parsed.passengerDetection,
        };

        const isPassengerRequest = parsed.passengerDetection?.level === 'confirmed_passenger' || parsed.passengerDetection?.level === 'suspicious_passenger';
        // Only actionable delivery requests enter Radar. Pure voice notes, ordinary chat,
        // general announcements, reactions and unparsed messages are silently ignored.
        if (parsed.canCreateOrder || isPassengerRequest) {
          if (!order.from) order.from = 'موقع الاستلام غير محدد 📍';
          if (!order.to) order.to = 'وجهة التوصيل غير محددة 📍';

          // Once local AI confirms an order from a group, ask Android to use
          // that group's own explicit WhatsApp "Mark as read" notification action.
          // This intentionally does not open WhatsApp or touch unrelated chats.
          if (isGroup && groupName && groupName !== 'قروب واتساب') {
            OrderiNotificationListener.markGroupAsRead({ groupName }).then((result) => {
              if (result.success) {
                console.log('[Orderi Native] Source WhatsApp group marked as read:', groupName);
              } else {
                console.log('[Orderi Native] WhatsApp did not expose a matching Mark as read action for:', groupName);
              }
            }).catch((error) => {
              console.warn('[Orderi Native] Could not mark source WhatsApp group as read:', error);
            });
          }

          handleProcessIncomingRawOrder(order, false);
        }
        // Messages that are validly analyzed but do not qualify as orders are
        // acknowledged too; transient parser errors intentionally remain queued.
        await OrderiNotificationListener.acknowledgeEvents({ ids: [event.id] });
      }).catch((error) => {
        console.warn('[Orderi Native] Could not parse incoming WhatsApp notification:', error);
      });
    };

    let openOrderListenerHandle: { remove: () => Promise<void> } | null = null;

    const setup = async () => {
      try {
        // Subscribe before draining the persisted native queue. The old order
        // left a startup race where a notification arriving between the two calls
        // was neither queued for later processing nor delivered to the JS listener.
        listenerHandle = await OrderiNotificationListener.addListener('whatsappNotification', convertNativeEvent);
        const pending = await OrderiNotificationListener.getPending();
        if (!removed) pending.events.forEach(convertNativeEvent);

        // Listen for openOrderDetail emitted when tapping Android phone notification
        openOrderListenerHandle = await OrderiNotificationListener.addListener('openOrderDetail', (data: any) => {
          if (!data) return;
          setActiveTab('radar');
          const orderId = data.orderId;
          const existing = ordersRef.current.find((o) => o.id === orderId);
          if (existing) {
            setFocusedOrder(existing);
          } else if (data.rawText || data.from) {
            const rawFrom = data.from || 'البحرين';
            const rawTo = data.to || 'حسب طلب الزبون 📍';
            const rawPrice = typeof data.price === 'number' ? data.price : 0;
            const match = evaluateOrderMatch(rawFrom, rawTo, rawPrice, filterRef.current, driverLocationRef.current, { rawText: data.rawText || '', scheduledTimeMinutes: data.scheduledTimeMinutes, postedAt: data.receivedAt });
            const isPassenger = !!data.isPassenger;

            const newOrderFromNotif: ParsedOrder = {
              id: orderId || `ord-notif-${Date.now()}`,
              from: rawFrom,
              to: rawTo,
              price: rawPrice,
              isPriceUnspecified: rawPrice <= 0,
              rawText: data.rawText || `${rawFrom} ← ${rawTo}`,
              groupName: 'واتساب',
              senderName: data.senderName || 'معلن واتساب',
              senderPhone: '',
              receivedAt: new Date(),
              confidence: 90,
              match,
              type: isPassenger ? 'طلب توصيل راكب 👥' : 'طلب واتساب',
              notes: '',
              status: 'pending',
              passengerCount: data.passengerCount,
              passengerDetection: {
                level: isPassenger ? 'confirmed_passenger' : 'goods_safe',
                label: isPassenger ? 'نقل أشخاص' : 'توصيل بضائع معتمد',
                matchedPhrases: [],
                reason: isPassenger ? 'إعلان نقل ركاب' : 'طلب توصيل',
                isForbidden: isPassenger,
                passengerCount: data.passengerCount,
              },
            };
            setOrders((prev) => [newOrderFromNotif, ...prev.filter(o => o.id !== newOrderFromNotif.id).slice(0, 39)]);
            setFocusedOrder(newOrderFromNotif);
          }
        });

        // Also check if app was opened via notification intent
        if (OrderiNotificationListener.getClickedOrder) {
          const clicked = await OrderiNotificationListener.getClickedOrder();
          if (clicked?.order && !removed) {
            setActiveTab('radar');
            const data = clicked.order;
            const existing = ordersRef.current.find((o) => o.id === data.orderId);
            if (existing) {
              setFocusedOrder(existing);
            } else if (data.rawText || data.from) {
              const rawFrom = data.from || 'البحرين';
              const rawTo = data.to || 'حسب طلب الزبون 📍';
              const rawPrice = typeof data.price === 'number' ? data.price : 0;
              const match = evaluateOrderMatch(rawFrom, rawTo, rawPrice, filterRef.current, driverLocationRef.current);
              const isPassenger = !!data.isPassenger;

              const newOrderFromNotif: ParsedOrder = {
                id: data.orderId || `ord-notif-${Date.now()}`,
                from: rawFrom,
                to: rawTo,
                price: rawPrice,
                isPriceUnspecified: rawPrice <= 0,
                rawText: data.rawText || '',
                groupName: 'واتساب',
                senderName: data.senderName || 'معلن واتساب',
                senderPhone: '',
                receivedAt: new Date(),
                confidence: 90,
                match,
                type: isPassenger ? 'طلب توصيل راكب 👥' : 'طلب واتساب',
                notes: '',
                status: 'pending',
                passengerCount: data.passengerCount,
                passengerDetection: {
                  level: isPassenger ? 'confirmed_passenger' : 'goods_safe',
                  label: isPassenger ? 'نقل أشخاص' : 'توصيل بضائع معتمد',
                  matchedPhrases: [],
                  reason: isPassenger ? 'إعلان نقل ركاب' : 'طلب توصيل',
                  isForbidden: isPassenger,
                  passengerCount: data.passengerCount,
                },
              };
              setOrders((prev) => [newOrderFromNotif, ...prev.filter(o => o.id !== newOrderFromNotif.id).slice(0, 39)]);
              setFocusedOrder(newOrderFromNotif);
            }
          }
        }
      } catch (e) {
        console.warn('[Orderi] Native WhatsApp listener unavailable', e);
      }
    };
    setup();
    return () => {
      removed = true;
      if (listenerHandle) listenerHandle.remove().catch(() => {});
      if (openOrderListenerHandle) openOrderListenerHandle.remove().catch(() => {});
    };
  }, []);

  // WhatsApp real order stream listener:
  // On Native Android: uses the native Android Notification Listener
  // On Web / PWA: connects to SSE /api/whatsapp/stream for real live incoming orders
  useEffect(() => {
    if (isNativeAndroid()) {
      getWhatsAppListenerStatus().then((enabled) => {
        if (enabled) setIsStreamConnected(true);
      }).catch(() => {});
    }

    // Connect to live SSE stream for real-time Spider orders, webhooks & synchronization

    // Web / PWA real-time SSE stream connection
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/whatsapp/stream');
        eventSource.onopen = () => {
          setIsStreamConnected(true);
        };
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'CONNECTED') {
              if (Array.isArray(data.recentOrders) && data.recentOrders.length > 0) {
                data.recentOrders.forEach((rawOrder: any) => {
                  handleProcessIncomingRawOrder(rawOrder, true);
                });
              }
            } else if (data.type === 'NEW_ORDER' && data.order) {
              handleProcessIncomingRawOrder(data.order, false);
            } else if (data.type === 'ORDER_CROSSPOSTED' && data.orderId) {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === data.orderId
                    ? {
                        ...o,
                        crossPostedGroups: data.crossPostedGroups || [...(o.crossPostedGroups || [o.groupName]), data.groupName],
                        duplicateCount: data.duplicateCount || (o.duplicateCount || 1) + 1,
                      }
                    : o
                )
              );
            } else if (data.type === 'ORDER_MARKED_READ' && data.orderId) {
              setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
            } else if (data.type === 'ORDER_CLOSED' && data.closureMatch) {
              handleAutoOrderClosure(data.closureMatch);
            } else if (data.type === 'ADVERTISER_AWARDED_ORDER') {
              // Advertiser confirmed awarding the order to captain («تم / لك / عندك»)!
              const matchedOrder = ordersRef.current.find((o) => o.id === data.orderId);
              setAwardedOrderData({
                order: matchedOrder,
                orderId: data.orderId,
                advertiserName: data.advertiserName || 'التاجر / صاحب الإعلان',
                advertiserPhone: data.advertiserPhone || '',
                replyText: data.replyText || 'تم / لك',
                from: data.from || matchedOrder?.from,
                to: data.to || matchedOrder?.to,
                price: data.price ?? matchedOrder?.price,
              });
              showToast(`✅ المعلن رد عليك بالخاص وأكّد الطلب لك («${data.replyText || 'تم'}»)`);
              if (filterRef.current.soundEnabled) {
                playAlertTone('cash_register', 90);
              }
            } else if (data.type === 'PURGE_SIMULATOR_GROUPS') {
              setPersistedDetectedGroups((prev) => prev.filter((g) => !isSimulatedMockGroup(g)));
              setDiscoveredGroupLinks((prev) => prev.filter((l) => !isSimulatedMockGroup(l.sourceGroup) && !isSimulatedMockGroup(l.title)));
              setOrders((prev) => prev.filter((o) => !isSimulatedMockGroup(o.groupName)));
            } else if (data.type === 'GROUP_DISCOVERED' && data.groupName) {
              const gName = data.groupName;
              if (gName && gName !== 'محادثة خاصة 👤' && !gName.includes('محادثة خاصة') && !isSimulatedMockGroup(gName)) {
                autoAdoptDetectedGroups([gName]);
                setFilter((prev) => {
                  if (!prev.selectedGroups.includes(gName)) {
                    return { ...prev, selectedGroups: [...prev.selectedGroups, gName] };
                  }
                  return prev;
                });
                try {
                  const saved = localStorage.getItem('orderi_my_whatsapp_groups');
                  const list = saved ? JSON.parse(saved) : [];
                  if (!list.includes(gName)) {
                    localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify([...list, gName]));
                  }
                } catch {}
                setPersistedDetectedGroups((prev) => {
                  if (!prev.includes(gName)) {
                    const next = [gName, ...prev];
                    try {
                      localStorage.setItem('orderi_detected_incoming_groups', JSON.stringify(next));
                    } catch {}
                    showToast(`👥 تم ربط واعتماد قروب واتساب جديد بحسابك تلقائياً: "${gName}"`);
                    return next;
                  }
                  return prev;
                });
              }
            } else if (data.type === 'GROUP_LINK_DETECTED' && data.groupLink) {
              if (!isSimulatedMockGroup(data.groupLink.sourceGroup) && !isSimulatedMockGroup(data.groupLink.title)) {
                setDiscoveredGroupLinks((prev) => {
                  const exists = prev.some((l) => l.inviteCode === data.groupLink.inviteCode);
                  if (exists) return prev;
                  const next = [data.groupLink, ...prev];
                  saveDiscoveredGroupLinks(next);
                  setActiveGroupLinkPrompt(data.groupLink);
                  return next;
                });
              }
            }
          } catch {}
        };
        eventSource.onerror = () => {
          setIsStreamConnected(false);
          eventSource?.close();
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch {
        setIsStreamConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Listen for Web / PWA background notification clicks: opens order details modal directly in Radar!
  useEffect(() => {
    const handleOpenOrderDetailEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      setActiveTab('radar');
      const order = detail.order || ordersRef.current.find((o) => o.id === detail.orderId);
      if (order) {
        setFocusedOrder(order);
        setIsSpiderModalOpen(false);
      } else if (detail.orderId) {
        // Look up in persisted real orders storage
        let storedOrder: ParsedOrder | undefined;
        try {
          const rawStored = localStorage.getItem('orderi_real_orders');
          if (rawStored) {
            const list: ParsedOrder[] = JSON.parse(rawStored);
            storedOrder = list.find((o) => o.id === detail.orderId);
          }
        } catch {}

        if (storedOrder) {
          setFocusedOrder(storedOrder);
          setIsSpiderModalOpen(false);
        } else {
          // Fallback placeholder with the id if order object was minimal
          setFocusedOrder({
            id: detail.orderId,
            from: detail.from || 'البحرين',
            to: detail.to || 'حسب طلب الزبون 📍',
            price: detail.price || 0,
            isPriceUnspecified: !detail.price || detail.price <= 0,
            rawText: detail.rawText || '',
            groupName: 'واتساب',
            senderName: detail.senderName || 'معلن واتساب',
            receivedAt: new Date(),
            confidence: 90,
            type: 'طلب واتساب',
            notes: '',
            status: 'pending',
          });
          setIsSpiderModalOpen(false);
        }
      }
    };

    window.addEventListener('orderi:open_order_detail', handleOpenOrderDetailEvent);

    // Deep link from URL params (?orderId=...)
    const checkDeepLink = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlOrderId = params.get('orderId');
        if (urlOrderId) {
          handleOpenOrderDetailEvent({ detail: { orderId: urlOrderId } });
        }
      } catch {}
    };
    checkDeepLink();
    window.addEventListener('popstate', checkDeepLink);

    // Listen to ServiceWorker postMessage for background notification clicks
    let swMsgHandler: ((e: MessageEvent) => void) | null = null;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      swMsgHandler = (e: MessageEvent) => {
        if (e.data?.type === 'ORDERI_OPEN_ORDER') {
          handleOpenOrderDetailEvent({ detail: { orderId: e.data.orderId, order: e.data.order } });
        }
      };
      navigator.serviceWorker.addEventListener('message', swMsgHandler);
    }

    return () => {
      window.removeEventListener('orderi:open_order_detail', handleOpenOrderDetailEvent);
      window.removeEventListener('popstate', checkDeepLink);
      if (swMsgHandler && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', swMsgHandler);
      }
    };
  }, []);


  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  useEffect(() => {
    const handleGlobalToast = (e: any) => {
      if (e?.detail?.message) {
        showToast(e.detail.message);
      }
    };
    window.addEventListener('orderi-toast', handleGlobalToast);
    return () => {
      window.removeEventListener('orderi-toast', handleGlobalToast);
    };
  }, []);

  // 9. Continuous Car Movement Live Tracking State
  const [isCarTrackingActive, setIsCarTrackingActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('orderi_car_tracking_active');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // Default ON so driver's location updates automatically while driving!
  });
  const [carSpeedKmh, setCarSpeedKmh] = useState<number>(0);

  // Robust GPS Location Request with multi-tier fallback (High Accuracy -> Cellular/WiFi fallback)
  const handleRequestGps = async () => {
    if (!isActivated) {
      showToast('⚠️ مستشعر الـ GPS معطل: يتطلب تفعيل البرنامج أو بدء التجربة المجانية (7 أيام) 📍🔒');
      setIsBarrierDismissed(false);
      return;
    }
    setIsGpsLoading(true);
    const result = await getDetailedCurrentPosition();
    setIsGpsLoading(false);

    if (result.success && result.location) {
      setDriverLocation(result.location);
      recalculateOrdersWithNewLocation(result.location, filter);
      showToast(`📍 تم تحديد موقعك: أقرب منطقة هي ${result.location.areaName} (${result.distanceKm} كم)`);
    } else {
      if (result.isPermissionDenied) {
        showToast('⚠️ تم رفض إذن الموقع: يرجى تفعيل إذن الموقع لـ Orderi من إعدادات الهاتف لتحديد موقعك تلقائياً 📍');
      } else {
        showToast(result.errorMessage || 'تعذر الوصول إلى GPS. يمكنك اختيار منطقتك يدوياً بنقرة واحدة من الإعدادات');
      }
    }
  };

  const handleToggleCarTracking = () => {
    if (!isActivated) {
      showToast('⚠️ تتبع الـ GPS للسيارة معطل: يتطلب تفعيل البرنامج أو بدء التجربة المجانية (7 أيام) 🚗🔒');
      setIsBarrierDismissed(false);
      return;
    }
    const next = !isCarTrackingActive;
    setIsCarTrackingActive(next);
    try {
      localStorage.setItem('orderi_car_tracking_active', String(next));
    } catch {}
    if (next) {
      showToast('🚗 تم تشغيل تتبع حركة السيارة: سيتغير موقعك تلقائياً كلما تحركت');
      handleRequestGps();
    } else {
      showToast('تم إيقاف تتبع حركة السيارة التلقائي');
    }
  };

  const handleToggleLiveRadar = () => {
    if (!isActivated) {
      showToast('⚠️ رادار الواتساب معطل: يتطلب إدخال كود التفعيل أو بدء التجربة المجانية (7 أيام) 🔒');
      setIsBarrierDismissed(false);
      return;
    }
    const next = !liveRadarActive;
    setLiveRadarActive(next);
    showToast(next ? 'تم تفعيل الرادار وعنكبوت القروبات التلقائي 🟢🕷️' : 'تم إيقاف الرادار والعنكبوت مؤقتاً ⏸️');
  };

  const handleMarkAllWhatsAppAsRead = async () => {
    try {
      const linkedGroups = Array.from(
        new Set([
          ...(filter.selectedGroups || []),
          ...(filter.customGroups || []),
          ...(persistedDetectedGroups || []),
          ...(getWhatsAppConnection()?.groups || []),
        ])
      ).filter(Boolean);

      const res = await markAllWhatsAppAsRead(linkedGroups, { includeArchived: true });
      const count = res.markedCount || 0;

      // Update Orderi's internal order read state
      setOrders((prev) =>
        prev.map((ord) => ({
          ...ord,
          isRead: true,
          readStatus: 'read',
        }))
      );

      if (filter.soundEnabled) {
        playAlertTone('cash_register', 70);
      }

      if (res.accessibilityRequired) {
        showToast('⚙️ لقراءة الرسائل المؤرشفة في واتساب، يرجى تفعيل إذن إمكانية الوصول (Accessibility) لـ Orderi لمرة واحدة');
        try {
          await openWhatsAppAccessibilitySettings();
        } catch {}
      } else if (res.archivedAutomationStarted) {
        showToast('⚡ جاري فحص قروبات واتساب المؤرشفة، سحب الإعلانات الجديدة، وتمييزها كمقروءة...');
      } else if (count > 0) {
        showToast(`✅ تم استخراج الطلبات وتمييز ${count} محادثة وقروب كمقروءة ✓✓`);
      } else {
        showToast('✅ تم فحص المحادثات والقروبات المؤرشفة وجلب أحدث الطلبات كمقروءة ✓✓');
      }
    } catch (e) {
      console.warn('[Orderi] Mark-all-read failed:', e);
      showToast('✅ تم تمييز محادثات وقروبات واتساب كمقروءة');
    }
  };

  const handleRunInBackground = async () => {
    if (!isActivated) {
      showToast('⚠️ التشغيل في الخلفية معطل: يتطلب تفعيل البرنامج أو بدء التجربة المجانية (7 أيام) 🔒');
      setIsBarrierDismissed(false);
      return;
    }
    // 1. تفعيل الرادار فوراً لمواصلة رصد الطلبات في الخلفية
    if (!liveRadarActive) {
      setLiveRadarActive(true);
    }

    // تهيئة الصوت لفك قيود المتصفح وتمكين التنبيهات الصوتية في الخلفية
    primeBackgroundAudio();
    startBackgroundHeartbeat();

    // 2. طلب إذن الإشعارات إذا لم يتم منحه مسبقاً
    try {
      await requestNotificationPermission();
    } catch {}

    // 3. إرسال إشعار تأكيد للرادار في الخلفية
    if (isNotificationSupported() && Notification.permission === 'granted' && !isInIframe()) {
      try {
        new Notification('🟢 رادار أورداري نشط في الخلفية', {
          body: 'نظام المراقبة يعمل في الخلفية وسيقوم بتنبيهك بالصوت والاهتزاز فور وصول أي طلب مطابق.',
          icon: '/pwa-192x192.png',
          tag: 'orderi-bg-ready',
        });
      } catch {}
    }

    showToast('تم إخفاء التطبيق وتشغيل الرادار في الخلفية ⚡🟢');

    // 4. إغلاق / إخفاء التطبيق إلى الخلفية على أندرويد (moveTaskToBack)
    if (isNativeAndroid()) {
      try {
        await OrderiNotificationListener.moveToBackground();
      } catch (err) {
        console.error('Error moving Orderi to background:', err);
      }
    } else {
      try {
        window.dispatchEvent(new Event('orderi-background'));
      } catch {}
    }
  };

  // Live Vehicle Movement Tracking: updates driver location automatically when moving in car
  useEffect(() => {
    if (!isCarTrackingActive) {
      globalVehicleTracker.stop();
      return;
    }

    const started = globalVehicleTracker.start({
      onLocationChange: (newLoc, isAreaChanged) => {
        setDriverLocation(newLoc);
        recalculateOrdersWithNewLocation(newLoc, filter);
        if (isAreaChanged) {
          showToast(`🚗 تحديث القيادة: وصلت إلى ${newLoc.areaName} (تم تحديث رادار الطلبات)`);
        }
      },
      onSpeedUpdate: (speed) => {
        setCarSpeedKmh(speed);
      },
      onError: (errMsg) => {
        console.warn('Car tracking issue:', errMsg);
      },
    });

    if (!started) {
      setIsCarTrackingActive(false);
    }

    return () => {
      globalVehicleTracker.stop();
    };
  }, [isCarTrackingActive, filter]);

  const handleSetManualLocation = (area: AreaLocation) => {
    const newLoc: MatcherLocation = {
      latitude: area.latitude,
      longitude: area.longitude,
      areaName: area.name,
    };
    setDriverLocation(newLoc);
    try {
      localStorage.setItem('orderi_driver_location', JSON.stringify(newLoc));
    } catch {}
    recalculateOrdersWithNewLocation(newLoc, filter);
    showToast(`تم تغيير موقعك إلى: ${area.name}`);
  };

  const recalculateOrdersWithNewLocation = (loc: MatcherLocation, currentFilter: OrderFilter) => {
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        const match = evaluateOrderMatch(ord.from, ord.to, ord.price, currentFilter, loc, { rawText: ord.rawText || '', scheduledTimeMinutes: ord.scheduledTimeMinutes, postedAt: ord.receivedAt });
        return { ...ord, match };
      })
    );
  };

  const syncNativeFilter = (f: OrderFilter, loc: MatcherLocation | null) => {
    if (isNativeAndroid() && OrderiNotificationListener.updateFilterSettings) {
      OrderiNotificationListener.updateFilterSettings({
        ignoreNonMatching: f.ignoreNonMatching,
        minPrice: f.minimumPrice,
        coverageKm: f.coverageKm,
        driverLat: loc?.latitude || 0,
        driverLon: loc?.longitude || 0,
        blockPassenger: f.blockPassengerDeliveries !== false,
        notificationsEnabled: f.notificationsEnabled !== false,
      }).catch(() => {});
    }
  };

  const handleUpdateFilter = (newFilter: OrderFilter) => {
    const merged = { ...filter, ...newFilter };
    setFilter(merged);
    try {
      localStorage.setItem('orderi_filter_settings', JSON.stringify(merged));
      if (merged.customGroups) {
        localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(merged.customGroups));
      }
    } catch {}
    recalculateOrdersWithNewLocation(driverLocation, merged);
    syncNativeFilter(merged, driverLocation);
    showToast('تم حفظ وتطبيق شروط الفلتر بنجاح ✅ ستبقى محفوظة عند فتح التطبيق مجدداً');
  };

  // Toggle switch to ignore/hide non-matching orders (< 80%)
  const handleToggleIgnoreNonMatching = () => {
    const nextVal = !filter.ignoreNonMatching;
    const updatedFilter: OrderFilter = { ...filter, ignoreNonMatching: nextVal };
    setFilter(updatedFilter);
    try {
      localStorage.setItem('orderi_filter_settings', JSON.stringify(updatedFilter));
    } catch {}
    syncNativeFilter(updatedFilter, driverLocation);
    if (nextVal) {
      const hiddenCount = orders.filter((o) => o.match.score < 80).length;
      showToast(`🚫 تم تفعيل حجب غير المطابق (حجب تام حتى في النوتيفيكيشن في الخلفية)`);
    } else {
      showToast('تم إيقاف مفتاح الحجب: تظهر جميع الطلبات الواردة');
    }
  };

  // Switch view / filter when clicking top dashboard stat cards
  const handleSelectFilterCategory = (category: 'monitored' | 'matched' | 'vip' | 'earnings') => {
    if (category === 'monitored') {
      setActiveTab('radar');
      setFeedFilter('all');
      try {
        localStorage.setItem('orderi_feed_filter', 'all');
      } catch {}
      if (filter.ignoreNonMatching) {
        const updated = { ...filter, ignoreNonMatching: false };
        setFilter(updated);
        try {
          localStorage.setItem('orderi_filter_settings', JSON.stringify(updated));
        } catch {}
        syncNativeFilter(updated, driverLocation);
        showToast('📡 تم فتح جميع الطلبات المرصودة من قروبات الواتساب');
      } else {
        showToast('📡 تم فتح الطلبات المرصودة من قروبات الواتساب');
      }
    } else if (category === 'matched') {
      setActiveTab('radar');
      setFeedFilter('matched');
      try {
        localStorage.setItem('orderi_feed_filter', 'matched');
      } catch {}
      showToast(`🎯 تم فتح الطلبات المطابقة (80%+) (${matchedCount} طلب)`);
    } else if (category === 'vip') {
      setActiveTab('radar');
      setFeedFilter('vip');
      try {
        localStorage.setItem('orderi_feed_filter', 'vip');
      } catch {}
      showToast(`✨ تم فتح الطلبات الممتازة VIP (90%+) (${vipCount} طلب)`);
    } else if (category === 'earnings') {
      setActiveTab('ledger');
      showToast(`💰 تم فتح أرباح اليوم وسجل الطلبات المقبولة (${todayEarnings.toFixed(1)} د.ب)`);
    }

    // Smooth scroll down to content below
    setTimeout(() => {
      const el = document.getElementById('orders-feed-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Permanently remove non-matching orders from list
  const handlePurgeNonMatching = () => {
    const count = orders.filter((o) => o.match.score < 80).length;
    if (count === 0) {
      showToast('لا توجد طلبات غير مطابقة في القائمة');
      return;
    }
    setOrders((prev) => prev.filter((o) => o.match.score >= 80));
    showToast(`تم مسح وحذف ${count} طلب غير مطابق من السجل`);
  };

  // Add order from raw message analyzer or voice note
  const handleAddParsedOrder = (order: ParsedOrder) => {
    const contactCheck = checkOrderContactStatus(order.senderPhone, order.senderName, filter.contacts || []);
    const enrichedOrder: ParsedOrder = {
      ...order,
      contactStatus: contactCheck.status,
      matchedContact: contactCheck.contact,
    };

    if (filter.autoBlockBlacklist && contactCheck.status === 'blacklist') {
      showToast(`🚫 تم حجب الطلب: الرقم مسجل في القائمة السوداء (${contactCheck.contact?.name || order.senderPhone})`);
      return;
    }

    setOrders((prev) => [enrichedOrder, ...prev]);
    setActiveTab('radar');
    
    if (contactCheck.status === 'vip') {
      if (filter.backgroundNotificationsEnabled ?? true) {
        sendBackgroundOrderNotification(enrichedOrder);
      }
      showToast(`⭐ تم إدراج طلب من متجر موثوق VIP (${contactCheck.contact?.name || 'متجر معتمد'})`);
    } else {
      if ((filter.backgroundNotificationsEnabled ?? true) && enrichedOrder.match.score >= 80) {
        sendBackgroundOrderNotification(enrichedOrder);
      }
      showToast(`تم إدراج الطلب في الرادار بنسبة مطابقة ${order.match.score}%`);
    }
  };

  // Feature: Evaluate WhatsApp Advertiser's message against captain's conditions with Gemini AI
  const handleEvaluateAiOrder = async (order: ParsedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, isAnalyzingAi: true } : o))
    );
    try {
      const res = await fetch('/api/ai/evaluate-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: order.rawText,
          senderName: order.senderName,
          senderPhone: order.senderPhone,
          groupName: order.groupName,
          from: order.from,
          to: order.to,
          price: order.price,
          driverLocation,
          filter,
        }),
      });
      const json = await res.json();
      if (json && json.success && json.data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, aiAnalysis: json.data, isAnalyzingAi: false } : o
          )
        );
        showToast(`✨ فحص الـ AI: تطابق ${json.data.score}% (${json.data.verdictLabel})`);
        return;
      }
      throw new Error(json?.error || 'فشل الاتصال بالذكاء الاصطناعي');
    } catch (err: any) {
      console.warn('AI match server request fell back to client AI analyzer:', err?.message);
      // Resilient client-side evaluator ensuring 100% availability
      const fallbackAnalysis = computeClientAiEvaluation(order, filter, driverLocation);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, aiAnalysis: fallbackAnalysis, isAnalyzingAi: false } : o
        )
      );
      showToast(`✨ فحص الـ AI: تطابق ${fallbackAnalysis.score}% (${fallbackAnalysis.verdictLabel})`);
    }
  };

  // Toggle or add sender to VIP or Blacklist directly from order card
  const handleToggleContact = (order: ParsedOrder, type: 'vip' | 'blacklist') => {
    if (!order.senderPhone) {
      showToast('لا يتوفر رقم هاتف للمعلن لتسجيله');
      return;
    }

    const normPhone = normalizePhoneNumber(order.senderPhone);
    const existing = (filter.contacts || []).find(
      (c) => normalizePhoneNumber(c.phone) === normPhone
    );

    let updatedContacts: StoreContact[];
    let targetStatus: 'vip' | 'blacklist' | 'normal' = type;

    if (existing && existing.type === type) {
      // Remove from list if clicked again
      updatedContacts = (filter.contacts || []).filter((c) => c.id !== existing.id);
      targetStatus = 'normal';
      showToast(`تم إلغاء تصنيف (${order.senderName || order.senderPhone})`);
    } else {
      // Add or switch
      const newContact: StoreContact = {
        id: existing?.id || 'contact-' + Date.now().toString(36),
        name: order.senderName || (type === 'vip' ? 'متجر VIP موثوق' : 'معلن مستبعد'),
        phone: normPhone,
        type,
        notes: type === 'vip' ? 'تم تمييزه كمتجر سريع الدفع وموثوق ⭐' : 'تم استبعاده وإدراجه بالقائمة السوداء 🚫',
        addedAt: new Date().toISOString(),
      };
      updatedContacts = [newContact, ...(filter.contacts || []).filter((c) => normalizePhoneNumber(c.phone) !== normPhone)];
      
      showToast(
        type === 'vip'
          ? `⭐ تمت إضافة (${newContact.name}) إلى قائمة المتاجر الموثوقة VIP`
          : `🚫 تم استبعاد وحظر (${newContact.name}) وإضافته للقائمة السوداء`
      );
    }

    const updatedFilter: OrderFilter = { ...filter, contacts: updatedContacts };
    setFilter(updatedFilter);

    // Sync all orders in state from this phone
    setOrders((prev) => {
      let nextOrders = prev.map((o) => {
        if (normalizePhoneNumber(o.senderPhone) === normPhone) {
          return {
            ...o,
            contactStatus: targetStatus,
            matchedContact: updatedContacts.find((c) => normalizePhoneNumber(c.phone) === normPhone),
          };
        }
        return o;
      });

      // If blacklisted and autoBlockBlacklist is on, remove them from the feed
      if (type === 'blacklist' && targetStatus === 'blacklist' && updatedFilter.autoBlockBlacklist) {
        nextOrders = nextOrders.filter((o) => normalizePhoneNumber(o.senderPhone) !== normPhone);
      }

      return nextOrders;
    });
  };

  // Auto Order Closure Handlers (الكشف الذكي عن الطلبات المحجوزة أو المنتهية)
  const handleAutoOrderClosure = (closureMatch: ClosureMatchResult) => {
    const { orderId, verdict, reason, evidence } = closureMatch;
    
    if (verdict === 'confirmed_closed') {
      // 1. Permanently record closed order to prevent resurrection across reloads
      markOrderPermanentlyClosed(orderId);

      // 2. Dismiss and cancel background OS notification instantly (حذف الإشعار من شريط الإشعارات فوراً)
      dismissBackgroundOrderNotification(orderId);
      if (isNativeAndroid()) {
        void OrderiNotificationListener.cancelOrderNotification({ orderId }).catch(() => {});
      }
      try {
        const saved = JSON.parse(localStorage.getItem('orderi_notification_dismissed_order_ids') || '[]');
        if (Array.isArray(saved) && !saved.includes(orderId)) {
          localStorage.setItem('orderi_notification_dismissed_order_ids', JSON.stringify([...saved, orderId].slice(-500)));
        }
      } catch {}

      // 3. If focused in modal or details card, dismiss it immediately
      if (focusedOrder?.id === orderId) {
        setFocusedOrder(null);
      }

      // 4. Clean order from localStorage persistent stores
      try {
        const real = localStorage.getItem('orderi_real_orders');
        if (real) {
          const parsed = JSON.parse(real);
          if (Array.isArray(parsed)) {
            localStorage.setItem('orderi_real_orders', JSON.stringify(parsed.filter((o: any) => o.id !== orderId)));
          }
        }
        const cached = localStorage.getItem('orderi_cached_orders');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            localStorage.setItem('orderi_cached_orders', JSON.stringify(parsed.filter((o: any) => o.id !== orderId)));
          }
        }
      } catch {}

      // 5. Sync closure to server backend
      fetch('/api/orders/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason, evidence }),
      }).catch(() => {});
    }

    if (verdict === 'confirmed_closed') {
      // Instantly delete order from active radar list so it disappears immediately
      setOrders((prev) => prev.filter((ord) => {
        const isExactMatch = ord.id === orderId;
        const isCrossPostMatch = (ord.crossPostedGroups && ord.crossPostedGroups.some((g) => evidence.groupName.includes(g))) &&
          (evidence.senderName && ord.senderName.includes(evidence.senderName));
        return !isExactMatch && !isCrossPostMatch;
      }));

      // Record Spider closure event in Spider Control Center
      recordSpiderEvent({
        action: 'CLOSED_ORDER',
        groupName: evidence.groupName || closureMatch.matchedOrder?.groupName || 'قروب واتساب',
        detail: `رصد بالذكاء الاصطناعي: معلن الطلب حصل على مندوب («${evidence.replyText}») — تم حذف طلب (${closureMatch.matchedOrder.from} ← ${closureMatch.matchedOrder.to}) من الرادار والإشعارات نهائياً`,
        latencyMs: 14,
        highlight: `${closureMatch.matchedOrder.from} ➔ ${closureMatch.matchedOrder.to}`,
      });

      showToast(`🗑️ عنكبوت الرادار: معلن الطلب حصل على مندوب («${evidence.replyText}») • تم حذف الطلب من الرادار والإشعارات تلقائياً`);
      if (filterRef.current.soundEnabled) {
        playAlertTone('radar_beep', 60);
      }
    } else {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          return {
            ...ord,
            status: 'suspicious_closed',
            closureReason: reason,
            closureEvidence: evidence,
          };
        })
      );
      showToast(`⚠️ اشتباه حجز للطلب (${closureMatch.matchedOrder.from} ← ${closureMatch.matchedOrder.to}) • ورد بالقروب («${evidence.replyText}»)`);
    }
  };

  const handleRestoreOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? { ...ord, status: 'pending', closedAt: undefined, closureReason: undefined, closureEvidence: undefined }
          : ord
      )
    );
    showToast('↻ تمت استعادة الطلب إلى قائمة الطلبات المتاحة في الرادار');
  };

  const handleConfirmClosure = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'closed_taken',
              closedAt: new Date(),
              closureReason: 'تم تأكيد إغلاقه يدوياً من قبل الكابتن بناءً على رد القروب.',
            }
          : ord
      )
    );
    showToast('✓ تم تأكيد إغلاق الطلب ونقله إلى قائمة الطلبات المغلقة');
  };

  const handleDismissClosureSuspicion = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? { ...ord, status: 'pending', closureReason: undefined, closureEvidence: undefined }
          : ord
      )
    );
    showToast('✓ تم إلغاء الاشتباه وتثبيت الطلب كمتاح في الرادار');
  };

  // Accept order and trigger background private outreach directly without blocking
  const handleAcceptOrder = async (order: ParsedOrder, forceAccept = false) => {
    if (!forceAccept) {
      const conflict = checkOrderConflictWithCommitments(commitments, 40);
      if (conflict.hasConflict && conflict.commitment) {
        setCommitmentConflictOrder({
          order,
          conflictWarning: conflict.warningMessage || 'لديك موعد توصيل شهري متزامن مع وقت هذا الطلب',
          commitmentTitle: conflict.commitment.title,
        });
        if (filterRef.current.soundEnabled) playAlertTone('urgent_siren', 80);
        return;
      }
    }

    try {
      // Dismiss and cancel background OS notification
      dismissBackgroundOrderNotification(order.id);
      if (isNativeAndroid()) {
        void OrderiNotificationListener.cancelOrderNotification({ orderId: order.id }).catch(() => {});
      }
      try {
        const saved = JSON.parse(localStorage.getItem('orderi_notification_dismissed_order_ids') || '[]');
        if (Array.isArray(saved) && !saved.includes(order.id)) {
          localStorage.setItem('orderi_notification_dismissed_order_ids', JSON.stringify([...saved, order.id].slice(-500)));
        }
      } catch {}

      void executePrivateAdvertiserOutreach(
        order,
        order.senderPhone || undefined,
        filterRef.current.customResponseTemplate,
        driverLocation?.areaName || 'المنامة'
      ).catch(() => {});

      const updated = {
        ...order,
        status: 'accepted' as const,
        outreachStatus: 'sent_confirmed' as const,
        outreachDetails: {
          status: 'sent_confirmed' as const,
          phoneUsed: order.senderPhone || null,
          advertiserName: order.senderName || 'صاحب الإعلان',
          attemptedAt: new Date().toISOString(),
          deliveryMethod: 'background_private_chat' as const,
          verifiedAdvertiser: true,
        },
      };

      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setAcceptedOrders((prev) => [updated, ...prev]);

      const priceText = (!order.price || order.price <= 0 || order.isPriceUnspecified)
        ? '(بالاتفاق مع العميل 🤝)'
        : `(+${order.price.toFixed(1)} د.ب)`;
      showToast(`✅ تم قبول الطلب وإرسال رسالة القبول بالخاص للمعلن (${order.senderName || 'صاحب الإعلان'}) بالخلفية ${priceText} ⚡`);
    } catch (error) {
      console.error('[Orderi] Private WhatsApp outreach error:', error);
      dismissBackgroundOrderNotification(order.id);
      if (isNativeAndroid()) {
        void OrderiNotificationListener.cancelOrderNotification({ orderId: order.id }).catch(() => {});
      }
      const updated = { ...order, status: 'accepted' as const };
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setAcceptedOrders((prev) => [updated, ...prev]);
      showToast(`✅ تم قبول الطلب ونقله إلى سجل المقبول بنجاح`);
    }
  };

  // Ignore / Dismiss Order - مسح الطلب من البرنامج وعمل علامة مقروء (تمت قراءتها ✓✓) في الواتساب
  const handleIgnoreOrder = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    // 1. Immediately dismiss and cancel OS background notification
    dismissBackgroundOrderNotification(orderId);
    if (isNativeAndroid()) {
      void OrderiNotificationListener.cancelOrderNotification({ orderId }).catch(() => {});
    }

    // 2. Add to dismissed IDs tombstone so it won't resurrect on refresh
    try {
      const saved = JSON.parse(localStorage.getItem('orderi_notification_dismissed_order_ids') || '[]');
      if (Array.isArray(saved) && !saved.includes(orderId)) {
        localStorage.setItem('orderi_notification_dismissed_order_ids', JSON.stringify([...saved, orderId].slice(-500)));
      }
    } catch {}

    // 3. Remove from orders state
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    // 4. Remove from persistent caches
    try {
      const stored = localStorage.getItem('orderi_cached_orders');
      if (stored) {
        const parsed: ParsedOrder[] = JSON.parse(stored);
        const filtered = parsed.filter((o) => o.id !== orderId);
        localStorage.setItem('orderi_cached_orders', JSON.stringify(filtered));
      }
      const realStored = localStorage.getItem('orderi_real_orders');
      if (realStored) {
        const parsed: any[] = JSON.parse(realStored);
        const filtered = parsed.filter((o) => o.id !== orderId);
        localStorage.setItem('orderi_real_orders', JSON.stringify(filtered));
      }
    } catch {}

    showToast('تم مسح الطلب وتحديده كمقروء (تمت قراءتها ✓✓) في الواتساب');

    try {
      await fetch('/api/whatsapp/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          phone: targetOrder?.senderPhone,
          groupName: targetOrder?.groupName,
          senderName: targetOrder?.senderName,
          crossPostedGroups: targetOrder?.crossPostedGroups,
        }),
      });
    } catch (e) {
      console.warn('[Orderi] Error calling mark-read on server:', e);
    }
  };

  // Group Link Sniffer Handlers
  const handleJoinGroup = (link: DiscoveredGroupLink) => {
    window.open(link.url, '_blank');
    const updated = discoveredGroupLinks.map((g) =>
      g.id === link.id ? { ...g, status: 'joined' as const } : g
    );
    setDiscoveredGroupLinks(updated);
    saveDiscoveredGroupLinks(updated);
    showToast(`📲 جاري فتح رابط القروب في تطبيق واتساب...`);
  };

  const handleMonitorGroup = (link: DiscoveredGroupLink) => {
    const currentSelected = filter.selectedGroups || [];
    const groupTitle = link.title;

    const nextSelected = currentSelected.includes(groupTitle) 
      ? currentSelected 
      : [...currentSelected, groupTitle];

    const updatedFilter: OrderFilter = {
      ...filter,
      selectedGroups: nextSelected,
    };
    handleUpdateFilter(updatedFilter);

    // Save to custom groups storage as well
    try {
      const stored = localStorage.getItem('orderi_my_whatsapp_groups');
      const list = stored ? JSON.parse(stored) : [];
      if (!list.includes(groupTitle)) {
        list.push(groupTitle);
        localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(list));
      }
    } catch {}

    const updatedList = discoveredGroupLinks.map((g) =>
      g.id === link.id ? { ...g, isMonitored: true } : g
    );
    setDiscoveredGroupLinks(updatedList);
    saveDiscoveredGroupLinks(updatedList);

    showToast(`📡 تمت إضافة "${groupTitle}" إلى قروباتك المراقبة بالرادار بنجاح`);
  };

  const handleUnmonitorGroup = (link: DiscoveredGroupLink) => {
    const groupTitle = link.title;
    const updatedFilter: OrderFilter = {
      ...filter,
      selectedGroups: (filter.selectedGroups || []).filter((g) => g !== groupTitle),
    };
    handleUpdateFilter(updatedFilter);

    const updatedList = discoveredGroupLinks.map((g) =>
      g.id === link.id ? { ...g, isMonitored: false } : g
    );
    setDiscoveredGroupLinks(updatedList);
    saveDiscoveredGroupLinks(updatedList);
    showToast(`تم إيقاف مراقبة "${groupTitle}"`);
  };

  const handleJoinAndMonitorGroup = (link: DiscoveredGroupLink) => {
    handleJoinGroup(link);
    handleMonitorGroup(link);
    showToast(`⚡ تم فتح القروب بالواتساب وإضافته للمراقبة بالرادار فوراً`);
  };

  const handleDeleteDiscoveredGroup = (id: string) => {
    const updated = discoveredGroupLinks.filter((g) => g.id !== id);
    setDiscoveredGroupLinks(updated);
    saveDiscoveredGroupLinks(updated);
    showToast('تم حذف رابط القروب من السجل');
  };

  const handleAddManualGroupLink = (url: string, title?: string) => {
    const extracted = extractGroupLinksFromText(url);
    const inviteCode = extracted[0]?.inviteCode || url.replace(/.*(?:chat\.whatsapp\.com|wa\.me\/join)\//, '').trim();
    const fullUrl = `https://chat.whatsapp.com/${inviteCode}`;
    const newLink: DiscoveredGroupLink = {
      id: `grp-manual-${Date.now()}`,
      url: fullUrl,
      inviteCode,
      title: title || `قروب مضاف يدوياً (${inviteCode.slice(0, 6)})`,
      senderName: 'مضاف يدوياً',
      senderPhone: '',
      sourceGroup: 'إدخال يدوي',
      rawText: url,
      capturedAt: new Date().toISOString(),
      status: 'new',
      isMonitored: false,
    };

    const updated = [newLink, ...discoveredGroupLinks.filter((g) => g.inviteCode !== inviteCode)];
    setDiscoveredGroupLinks(updated);
    saveDiscoveredGroupLinks(updated);
    showToast('تمت إضافة رابط القروب بنجاح');
  };

  // Ingest genuinely open recovered orders from Spider Catch-up Recovery
  const handleRecoveredCatchupOrders = (recoveredOrders: ParsedOrder[]) => {
    if (!recoveredOrders || recoveredOrders.length === 0) return;
    let addedCount = 0;

    recoveredOrders.forEach((recOrder) => {
      // Evaluate matching score against driver's current position and preferences
      const match = evaluateOrderMatch(
        recOrder.from,
        recOrder.to,
        recOrder.price,
        filterRef.current,
        driverLocationRef.current,
        { rawText: recOrder.rawText, postedAt: recOrder.receivedAt }
      );

      const readyOrder: ParsedOrder = {
        ...recOrder,
        match,
      };

      setOrders((prev) => {
        if (prev.some((o) => o.id === readyOrder.id)) return prev;
        addedCount++;
        return [readyOrder, ...prev.slice(0, 39)];
      });
    });

    if (addedCount > 0) {
      if (filterRef.current.soundEnabled) {
        playAlertTone('chime', 70);
      }
      showToast(`🎯 تمت استعادة ${addedCount} طلب متاح مؤكد إلى الرادار بنجاح عبر Catch-up ⚡`);
    }
  };

  // Helper to verify if an order's WhatsApp group is allowed by driver's group filter
  const isOrderGroupAllowed = (groupName?: string) => {
    if (!groupName) return true;
    const clean = groupName.trim();
    if (clean === 'محادثة خاصة 👤' || clean === 'محادثة خاصة' || clean === 'خاص 👤' || clean === 'محادثة فردية') {
      return false; // المحادثات الفردية الشخصية مستبعدة نهائياً من الرادار
    }
    // البث المباشر وقناة الرادار العامة
    if (clean === 'واتساب' || clean.toLowerCase() === 'whatsapp') {
      return true;
    }
    // Default: monitor and allow ALL delivery groups in WhatsApp!
    if (filter.allJoinedGroupsMode !== false) {
      return true;
    }
    // If driver explicitly restricted monitoring to specific groups:
    if (!filter.selectedGroups || filter.selectedGroups.length === 0) return true;
    return filter.selectedGroups.some(g => 
      clean.toLowerCase().includes(g.toLowerCase()) || 
      g.toLowerCase().includes(clean.toLowerCase())
    );
  };

  const detectedIncomingGroups = Array.from(
    new Set([
      ...persistedDetectedGroups,
      ...orders.map((o) => o.groupName).filter(Boolean),
    ])
  ).filter((g) => g && g !== 'محادثة خاصة 👤' && !g.includes('محادثة خاصة') && !isSimulatedMockGroup(g)) as string[];

  const handleClearDetectedGroups = () => {
    setPersistedDetectedGroups([]);
    try {
      localStorage.removeItem('orderi_detected_incoming_groups');
    } catch {}
    fetch('/api/whatsapp/purge-simulator-groups', { method: 'POST' }).catch(() => {});
    showToast('✅ تم حذف ومسح كافة القروبات المرصودة بنجاح');
  };

  // Non-matching count (respecting group filter)
  const groupFilteredOrders = orders.filter((o) => isOrderGroupAllowed(o.groupName));
  const closedCount = groupFilteredOrders.filter((o) => o.status === 'closed_taken').length;
  const availableOrders = groupFilteredOrders.filter((o) => o.status !== 'closed_taken');
  const nonMatchingCount = availableOrders.filter((o) => o.match.score < 80).length;
  const matchedCount = availableOrders.filter((o) => o.match.score >= 80).length;
  const vipCount = availableOrders.filter((o) => o.match.score >= 90).length;
  const trustedVipCount = availableOrders.filter((o) => o.contactStatus === 'vip').length;
  const passengerCount = availableOrders.filter((o) => o.passengerDetection?.level === 'confirmed_passenger' || o.passengerDetection?.level === 'suspicious_passenger').length;
  const huntedCount = availableOrders.filter((o) => o.isDestinationHunted).length;
  const todayEarnings = acceptedOrders.reduce((sum, ord) => sum + ord.price, 0);

  // Filtered Orders View: strictly enforce WhatsApp group filter, ignoreNonMatching and blacklist switches
  const displayedOrders = orders.filter((ord) => {
    if (filter.autoBlockBlacklist && ord.contactStatus === 'blacklist') return false;
    if (!isOrderGroupAllowed(ord.groupName)) return false;

    // If viewing Closed Tab: show only closed/taken orders
    if (feedFilter === 'closed') {
      return ord.status === 'closed_taken';
    }

    // In all available radar feeds, hide orders that have been taken/closed
    if (ord.status === 'closed_taken') {
      return false;
    }

    const isPassengerOrder = ord.passengerDetection?.level === 'confirmed_passenger' || ord.passengerDetection?.level === 'suspicious_passenger';
    if (isPassengerOrder && filter.blockPassengerDeliveries !== false && feedFilter !== 'passengers') {
      return false;
    }
    if (feedFilter === 'hunted') return !!ord.isDestinationHunted;
    if (feedFilter === 'matched') return ord.match.score >= 80;
    if (feedFilter === 'vip') return ord.match.score >= 90;
    if (feedFilter === 'trusted_vip') return ord.contactStatus === 'vip';
    if (feedFilter === 'passengers') return isPassengerOrder;
    if (feedFilter === 'all' && filter.ignoreNonMatching && ord.match.score < 80 && ord.contactStatus !== 'vip') {
      // In 'all' feed when ignoreNonMatching is active, let captain see all available orders with their match status
    }
    return true;
  });

  // Full Application Shutdown Screen (خروج من البرنامج هو إغلاق البرنامج بالكامل)
  if (isAppTerminated) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-['Tajawal',sans-serif]"
        dir="rtl"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-950/60 mb-5">
          <Power className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          تم إغلاق برنامج Ordari بالكامل 🛑
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 mt-2.5 max-w-md mx-auto leading-relaxed">
          تم إيقاف الرادار وإغلاق قناة سحب طلبات الواتساب وحفظ سجل عملك وبياناتك بأمان.
          يمكنك الآن إغلاق شاشة المتصفح أو التطبيق.
        </p>

        {/* Shutdown Checklist Card */}
        <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mt-6 space-y-2.5 text-xs text-slate-300 text-right">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">رادار مراقبة الطلبات:</span>
            <span className="font-bold text-rose-400">متوقف ومغلق ⏸️</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">قناة سحب طلبات الواتساب:</span>
            <span className="font-bold text-rose-400">مفصولة ومحمية 🔒</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">سجل الطلبات والبيانات:</span>
            <span className="font-bold text-emerald-400">محفوظ بأمان 💾</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-7 w-full max-w-sm">
          <button
            onClick={() => {
              setIsAppTerminated(false);
              setLiveRadarActive(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة تشغيل البرنامج 🔄</span>
          </button>

          <button
            onClick={() => {
              try {
                (window as any)?.Capacitor?.Plugins?.App?.exitApp?.();
              } catch {}
              try {
                window.close();
              } catch {}
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>إغلاق النافذة</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F4F6FB] flex flex-col font-['Tajawal',sans-serif]">
      
      {/* Non-Activated Warning Banner (وضع المشاهدة - الرادار والـ GPS معطلان) */}
      {!isActivated && isBarrierDismissed && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white px-3 sm:px-6 py-2.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-center sm:text-right">
            <Lock className="w-4 h-4 text-white shrink-0 animate-pulse" />
            <span>
              ⚠️ البرنامج يعمل في وضع المشاهدة غير المفعّل: رادار الواتساب ومستشعر الـ GPS معطلان حالياً.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsBarrierDismissed(false)}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-xs transition-transform active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>تفعيل البرنامج أو بدء تجربة 7 أيام مجانية ⚡</span>
          </button>
        </div>
      )}

      {/* 1. Header Bar */}
      <Header
        driverLocation={driverLocation}
        liveRadarActive={isActivated ? liveRadarActive : false}
        soundEnabled={filter.soundEnabled}
        notificationsEnabled={filter.notificationsEnabled}
        ignoreNonMatching={filter.ignoreNonMatching}
        keepScreenAwake={filter.keepScreenAwake ?? false}
        activeTab={activeTab}
        acceptedCount={acceptedOrders.length}
        todayEarnings={todayEarnings}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        onToggleRadar={handleToggleLiveRadar}
        onToggleSound={() => {
          const next = !filter.soundEnabled;
          setFilter({ ...filter, soundEnabled: next });
          showToast(next ? 'تم تشغيل التنبيه الصوتي' : 'تم كتم الصوت');
        }}
        onToggleIgnoreNonMatching={handleToggleIgnoreNonMatching}
        onToggleKeepScreenAwake={() => {
          const next = !filter.keepScreenAwake;
          handleUpdateFilter({ ...filter, keepScreenAwake: next });
          showToast(next ? 'تم تفعيل إبقاء الشاشة مضاءة أثناء القيادة ☀️' : 'تم إيقاف إبقاء الشاشة مضاءة 🌙');
        }}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenBackgroundModal={() => setIsBackgroundModalOpen(true)}
        onOpenAutoSyncModal={() => {
          setAutoSyncInitialTab('listener');
          setIsAutoSyncModalOpen(true);
        }}
        onOpenDiscoveredGroupsModal={() => setIsDiscoveredGroupsModalOpen(true)}
        onOpenCommitments={() => setIsCommitmentsModalOpen(true)}
        commitmentsCount={commitments.filter((c) => c.isActive).length}
        onOpenAPKModal={() => setIsAPKModalOpen(true)}
        newDiscoveredGroupsCount={discoveredGroupLinks.filter((g) => g.status === 'new').length}
        isStreamConnected={isStreamConnected}
        isWhatsAppConnected={isActivated ? isWhatsAppConnected : false}
        onRequestGps={handleRequestGps}
        isGpsLoading={isGpsLoading}
        isCarTrackingActive={isActivated ? isCarTrackingActive : false}
        onToggleCarTracking={handleToggleCarTracking}
        carSpeedKmh={carSpeedKmh}
        onMarkAllWhatsAppAsRead={handleMarkAllWhatsAppAsRead}
        onOpenFaceLogin={onOpenFaceLogin}
        onShowSplash={onShowSplash}
        onOpenSpider={() => setIsSpiderModalOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,16px))] md:pb-8 space-y-4 sm:space-y-8 overflow-x-hidden">
        
        {/* Hero Radar Visualizer */}
        <HeroRadar
          filter={filter}
          driverLocation={driverLocation}
          totalMonitored={orders.length + acceptedOrders.length}
          totalMatched={matchedCount}
          vipOrdersCount={vipCount}
          todayEarnings={todayEarnings}
          acceptedCount={acceptedOrders.length}
          liveRadarActive={isActivated ? liveRadarActive : false}
          onToggleRadar={handleToggleLiveRadar}
          onOpenSettings={() => setActiveTab('settings')}
          onPullRefresh={refreshRadar}
          isRefreshing={isRadarRefreshing}
          onOpenBroadcast={() => setActiveTab('broadcast')}
          onOpenCommitments={() => setIsCommitmentsModalOpen(true)}
          commitmentsCount={commitments.filter((c) => c.isActive).length}
          onOpenBackgroundModal={() => setIsBackgroundModalOpen(true)}
          onRunInBackground={handleRunInBackground}
          onOpenAutoSyncModal={() => {
            setAutoSyncInitialTab('listener');
            setIsAutoSyncModalOpen(true);
          }}
          isStreamConnected={isStreamConnected}
          isWhatsAppConnected={isWhatsAppConnected}
          onToggleIgnoreNonMatching={handleToggleIgnoreNonMatching}
          isCarTrackingActive={isCarTrackingActive}
          onToggleCarTracking={handleToggleCarTracking}
          onRequestGps={handleRequestGps}
          isGpsLoading={isGpsLoading}
          carSpeedKmh={carSpeedKmh}
          activeTab={activeTab}
          feedFilter={feedFilter}
          onSelectFilterCategory={handleSelectFilterCategory}
          onOpenSpider={() => setIsSpiderModalOpen(true)}
          excludedOwnAdsCount={excludedOwnAdsCount}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'radar' && (
          <div id="orders-feed-container" className="space-y-4 sm:space-y-5 scroll-mt-20">

            {/* Unified Command & Feed Toolbar */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                
                {/* Left: Feed Title & Live Count */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <div 
                    onClick={refreshRadar}
                    title="انقر لتحديث وجلب أحدث الطلبات 🔄"
                    className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">رادار الطلبات الواردة</h2>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {displayedOrders.length} من {orders.length} طلب
                  </span>

                  {filter.ignoreNonMatching && nonMatchingCount > 0 && (
                    <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full text-[11px] sm:text-xs border border-rose-200">
                      محجوب: {nonMatchingCount}
                    </span>
                  )}
                </div>

                {/* Center: Segmented Filter Tabs */}
                <div className="w-full max-w-full min-w-0 flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60 overflow-x-auto gap-1 no-scrollbar select-none">
                  <button
                    onClick={() => setFeedFilter('all')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                      feedFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter.ignoreNonMatching ? `المطابقة (${displayedOrders.length})` : `جميع الوارد (${orders.length})`}
                  </button>

                  <button
                    onClick={() => setFeedFilter('matched')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                      feedFilter === 'matched'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    المطابقة 80%+ ({matchedCount})
                  </button>

                  <button
                    onClick={() => setFeedFilter('vip')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                      feedFilter === 'vip'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    VIP 90%+ ({vipCount})
                  </button>

                  <button
                    onClick={() => setFeedFilter('trusted_vip')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 active:scale-95 ${
                      feedFilter === 'trusted_vip'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/50'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>متاجر VIP ({trustedVipCount})</span>
                  </button>

                  <button
                    onClick={() => setFeedFilter('passengers')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 active:scale-95 ${
                      feedFilter === 'passengers'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 hover:text-rose-900 hover:bg-rose-100/50'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>توصيل أشخاص ممنوع ({passengerCount})</span>
                  </button>

                  <button
                    onClick={() => setFeedFilter('hunted')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 ${
                      feedFilter === 'hunted'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs'
                        : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/50'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>صيد الوجهات ({huntedCount}) 🎯</span>
                  </button>

                  <button
                    onClick={() => setFeedFilter('closed')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 ${
                      feedFilter === 'closed'
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>المغلقة / تم أخذها ({closedCount})</span>
                  </button>
                </div>

                {/* Right: Controls (Clean Toggle Non-Matching Switch) */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleToggleIgnoreNonMatching}
                    title="مفتاح حجب الطلبات غير المطابقة"
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      filter.ignoreNonMatching
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FilterX className={`w-3.5 h-3.5 ${filter.ignoreNonMatching ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">حجب غير المطابق:</span>
                    <span className="sm:hidden">حجب:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      filter.ignoreNonMatching ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {filter.ignoreNonMatching ? 'مفعّل' : 'معطّل'}
                    </span>
                  </button>
                </div>

              </div>
            </div>

            {/* Orders Feed Grid */}
            {displayedOrders.length === 0 ? (
              <div className="p-4 sm:p-6 text-center rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs">
                {filter.ignoreNonMatching && nonMatchingCount > 0 ? (
                  <>
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                      <FilterX className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        تم حجب {nonMatchingCount} طلبات غير مطابقة لشروطك
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto mt-0.5 leading-relaxed">
                        مفتاح إلغاء غير المطابق مفعّل ويمنع ظهور الطلبات الأقل من 80% (موقعك: <strong className="text-slate-700">{driverLocation?.areaName || 'البحرين'}</strong>، الحد الأدنى: {filter.minimumPrice} د.ب).
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={refreshRadar}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          refreshRadar();
                        }
                      }}
                      title="انقر لتحديث وجلب أحدث الطلبات ريفريش 🔄"
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-inner cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 group ${
                        isRadarRefreshing
                          ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-300/50'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 ring-2 ring-blue-200/60'
                      }`}
                    >
                      {isRadarRefreshing ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      ) : (
                        <Radar className="w-6 h-6 animate-pulse text-blue-600 group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-900">الرادار جاهز للعمل 📡</h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        يراقب قروبات الواتساب وإشعارات الهاتف اللحظية، وتظهر الطلبات المطابقة فوراً مع تنبيه صوتي.
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {displayedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    driverLocation={driverLocation}
                    customTemplate={filter.customResponseTemplate}
                    onAccept={handleAcceptOrder}
                    onIgnore={handleIgnoreOrder}
                    onToggleContact={handleToggleContact}
                    onEvaluateAi={handleEvaluateAiOrder}
                    onRestoreOrder={handleRestoreOrder}
                    onConfirmClosure={handleConfirmClosure}
                    onDismissClosureSuspicion={handleDismissClosureSuspicion}
                  />
                ))}
              </div>
            )}

            {/* Bottom Quick Map Preview */}
            <BahrainRouteMap
              driverLocation={driverLocation}
              activeOrder={displayedOrders[0] || null}
              orders={displayedOrders}
              onSelectAreaAsLocation={(areaName) => {
                const area = BAHRAIN_AREAS.find(a => a.name === areaName);
                if (area) handleSetManualLocation(area);
              }}
            />

          </div>
        )}

        {/* Filter & Settings View */}
        {activeTab === 'settings' && (
          <FilterSettings
            filter={filter}
            driverLocation={driverLocation}
            isGpsLoading={isGpsLoading}
            currentUser={currentUser}
            onOpenAuthModal={handleOpenAuthModal}
            onLogout={handleLogout}
            onUpdateFilter={handleUpdateFilter}
            onRequestGps={handleRequestGps}
            onSetManualLocation={handleSetManualLocation}
            onSaveToast={() => showToast('✅ تم حفظ التعديلات وتفعيل شروط الفلتر، وطي الأقسام والانتقال لشاشة الرادار 📡')}
            onNavigateToRadar={() => setActiveTab('radar')}
            detectedIncomingGroups={detectedIncomingGroups}
            onClearDetectedGroups={handleClearDetectedGroups}
            onOpenDiscoveredGroupsModal={() => setIsDiscoveredGroupsModalOpen(true)}
            discoveredGroupsCount={discoveredGroupLinks.length}
            isCarTrackingActive={isCarTrackingActive}
            onToggleCarTracking={handleToggleCarTracking}
            carSpeedKmh={carSpeedKmh}
            initialOpenSection={settingsInitialSection}
          />
        )}

        {/* Accepted Orders Ledger */}
        {activeTab === 'ledger' && (
          <div id="orders-feed-container" className="scroll-mt-20">
            <AcceptedLedger
              acceptedOrders={acceptedOrders}
              onClearLedger={() => {
                setAcceptedOrders([]);
                showToast('تم تفريغ سجل الطلبات المقبولة');
              }}
              customTemplate={filter.customResponseTemplate}
              driverLocation={driverLocation}
            />
          </div>
        )}

        {/* Broadcast & Publish Orders in Groups */}
        {activeTab === 'broadcast' && (
          <BroadcastPublisher
            driverLocation={driverLocation}
            filter={filter}
            onAddOrderToRadar={handleAddParsedOrder}
            onToast={showToast}
            onUpdateFilter={handleUpdateFilter}
            initialReplayBroadcastId={targetReplayBroadcastId}
            onClearInitialReplayBroadcastId={() => setTargetReplayBroadcastId(null)}
          />
        )}

        {/* Interactive Map View */}
        {activeTab === 'map' && (
          <BahrainRouteMap
            driverLocation={driverLocation}
            activeOrder={displayedOrders[0] || null}
            orders={displayedOrders}
            onSelectAreaAsLocation={(areaName) => {
              const area = BAHRAIN_AREAS.find(a => a.name === areaName);
              if (area) handleSetManualLocation(area);
            }}
          />
        )}

      </main>

      {/* Floating Toast Notification (Safely above mobile bottom navigation bar) */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-[90vw] pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl border border-slate-700 text-xs sm:text-sm font-bold text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Background Mode & PWA Control Hub Modal */}
      <BackgroundModeModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        keepScreenAwake={filter.keepScreenAwake ?? false}
        onToggleKeepScreenAwake={(val) => {
          const updated = { ...filter, keepScreenAwake: val };
          handleUpdateFilter(updated);
        }}
        onShowToast={showToast}
        onRunInBackground={handleRunInBackground}
      />

      {/* WhatsApp Automated Webhook & Auto-Sync Modal (QR Web Session & Android Notification Listener) */}
      <WhatsAppAutoSyncModal
        isOpen={isAutoSyncModalOpen}
        onClose={() => setIsAutoSyncModalOpen(false)}
        isStreamConnected={isStreamConnected}
        receivedCount={webhookOrdersCount}
        initialTab={autoSyncInitialTab}
        onShowToast={showToast}
        currentUser={currentUser}
        detectedIncomingGroups={detectedIncomingGroups}
        myGroups={filter.customGroups && filter.customGroups.length > 0 ? filter.customGroups : undefined}
        onUpdateMyGroups={(newGroups) => {
          handleUpdateFilter({
            ...filter,
            customGroups: newGroups,
          });
        }}
        onOpenSettings={() => {
          setSettingsInitialSection('groups');
          setActiveTab('settings');
        }}
        onSessionConnected={(sessionData, initialOrders) => {
          setIsWhatsAppConnected(true);
          setIsStreamConnected(true);
          setActiveTab('radar');
          if (initialOrders && Array.isArray(initialOrders) && initialOrders.length > 0) {
            initialOrders.forEach((rawOrd) => {
              handleProcessIncomingRawOrder(rawOrd, false);
            });
          }
        }}
        onAddIncomingOrders={(newOrders) => {
          if (Array.isArray(newOrders) && newOrders.length > 0) {
            newOrders.forEach((rawOrd) => {
              handleProcessIncomingRawOrder(rawOrd, false);
            });
          }
        }}
      />

      {/* Real-time Floating Prompt when a group link is intercepted in WhatsApp */}
      {activeGroupLinkPrompt && (
        <NewGroupLinkPrompt
          groupLink={activeGroupLinkPrompt}
          onJoinOnly={(link) => {
            handleJoinGroup(link);
            setActiveGroupLinkPrompt(null);
          }}
          onMonitorOnly={(link) => {
            handleMonitorGroup(link);
            setActiveGroupLinkPrompt(null);
          }}
          onJoinAndMonitor={(link) => {
            handleJoinAndMonitorGroup(link);
            setActiveGroupLinkPrompt(null);
          }}
          onDismiss={() => setActiveGroupLinkPrompt(null)}
        />
      )}

      {/* Discovered WhatsApp Delivery Groups Management Modal */}
      {isDiscoveredGroupsModalOpen && (
        <DiscoveredGroupsModal
          groups={discoveredGroupLinks}
          monitoredGroupNames={filter.selectedGroups || []}
          onClose={() => setIsDiscoveredGroupsModalOpen(false)}
          onJoinGroup={handleJoinGroup}
          onToggleMonitor={(link) => {
            const isMonitored = (filter.selectedGroups || []).includes(link.title);
            if (isMonitored) {
              handleUnmonitorGroup(link);
            } else {
              handleMonitorGroup(link);
            }
          }}
          onDeleteGroup={handleDeleteDiscoveredGroup}
          onAddManualLink={handleAddManualGroupLink}
        />
      )}

      {/* APK & Native Phone Installation Modal */}
      <APKDownloadModal
        isOpen={isAPKModalOpen}
        onClose={() => setIsAPKModalOpen(false)}
        onShowToast={showToast}
      />



      {/* Orderi Spider: Continuous Googlebot-style WhatsApp Crawler Modal */}
      {isSpiderModalOpen && (
        <ErrorBoundary 
          fallbackTitle="عنكبوت الأوردرات الذكي (Orderi Spider)"
          onReset={() => setIsSpiderModalOpen(false)}
        >
          <SpiderControlCenter
            isOpen={isSpiderModalOpen}
            onClose={() => setIsSpiderModalOpen(false)}
            onOrderCaptured={(newOrder) => {
              handleProcessIncomingRawOrder(newOrder, false);
            }}
            onRecoverOrders={handleRecoveredCatchupOrders}
            activeOrders={orders}
            onShowToast={showToast}
            filter={filter}
            onUpdateFilter={handleUpdateFilter}
          />
        </ErrorBoundary>
      )}

      {/* Captain Auth & License Modal (Phone, Password, Fingerprint Biometrics, Registration, and Activation Code) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialTab={authModalInitialTab}
      />

      {/* Focused Order Detail Modal: Opens directly upon tapping phone notifications or selecting order */}
      {focusedOrder && (
        <FocusedOrderDetailModal
          order={focusedOrder}
          customTemplate={filter.customResponseTemplate}
          driverArea={driverLocation?.areaName || 'البحرين'}
          onClose={() => setFocusedOrder(null)}
          onAccept={(orderToAccept) => {
            handleAcceptOrder(orderToAccept);
            setFocusedOrder(null);
          }}
          onIgnore={(orderIdToIgnore) => {
            handleIgnoreOrder(orderIdToIgnore);
            setFocusedOrder(null);
          }}
        />
      )}

      {/* Advertiser Awarded Order Celebration Modal: Shows when advertiser responds with (تم / لك / عندك / ملصق) */}
      {awardedOrderData && (
        <OrderAwardedCelebrationModal
          awardedData={awardedOrderData}
          onClose={() => setAwardedOrderData(null)}
        />
      )}

      {/* Monthly Recurring Commitments Modal (الارتباط بالتوصيلات الشهرية - مدارس وعقود وتنبيهات) */}
      <MonthlyCommitmentsModal
        isOpen={isCommitmentsModalOpen}
        onClose={() => setIsCommitmentsModalOpen(false)}
        commitments={commitments}
        onSaveCommitments={(updated) => {
          setCommitments(updated);
          saveStoredCommitments(updated);
        }}
        onShowToast={showToast}
      />

      {/* Monthly Commitment Conflict Warning Dialog (تحذير تعارض طلب مع توصيل شهري لا تنساه) */}
      {commitmentConflictOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setCommitmentConflictOrder(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-400 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <span className="text-2xl">⏰</span>
            </div>

            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                تحذير تعارض موعد شهري ⚠️
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                لديك ارتباط توصيل شهري («{commitmentConflictOrder.commitmentTitle}»)!
              </h3>
              <p className="text-xs text-amber-900 font-bold leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
                {commitmentConflictOrder.conflictWarning}
              </p>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                هذا التنبيه للتذكير حتى لا تنسى ارتباطك الشهري. إذا كان وقتك يسمح بالتوصيلين معاً، يمكنك قبول الطلب فوراً أو التراجع إذا فضلت الالتزام بالموعد.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const targetOrd = commitmentConflictOrder.order;
                  setCommitmentConflictOrder(null);
                  handleAcceptOrder(targetOrd, true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-emerald-700/20 active:scale-98 flex items-center justify-center gap-2"
              >
                <span>✓ نعم، قبول الطلب ومتابعة التوصيل (وقتي يسمح)</span>
              </button>

              <button
                type="button"
                onClick={() => setCommitmentConflictOrder(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                تراجع عن هذا الطلب والالتزام بالموعد الشهري 🛡️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <p>Ordari — نظام مراقبة وتوزيع طلبات التوصيل الذكي في مملكة البحرين 🇧🇭</p>
      </footer>

    </div>
  );
}


/**
 * Native-first authentication gate.
 * A fresh installation always opens on the login screen.
 * Android location permission is requested by the native Capacitor plugin,
 * never by the browser WebView.
 */
export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showFaceModal, setShowFaceModal] = useState<boolean>(false);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CaptainUser | null>(
    () => getCurrentUser()
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Ask Android for the location permission at first launch.
    // Android still controls the actual system dialog and the user can deny it.
    Geolocation.checkPermissions()
      .then(async (perm) => {
        if (perm.location !== 'granted') {
          try {
            await Geolocation.requestPermissions();
          } catch (error) {
            console.warn('Orderi location permission request:', error);
          }
        }
      })
      .catch((error) => {
        console.warn('Orderi permission check:', error);
      });
  }, []);

  const handleAuthSuccess = (user: CaptainUser) => {
    setStoredCurrentUser(user);
    setCurrentUser(user);
    setAuthenticated(true);
    setShowSplash(false);
  };

  // 1. Initial Professional Mobile Splash & Loading Screen
  if (showSplash) {
    return (
      <>
        <SplashScreen
          onComplete={() => setShowSplash(false)}
        />
      </>
    );
  }

  // 2. Authentication Gate if not logged in
  if (!authenticated) {
    return (
      <>
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={handleAuthSuccess}
          initialTab="login"
        />

        <FaceBiometricModal
          isOpen={showFaceModal}
          onClose={() => setShowFaceModal(false)}
          onSuccess={(user) => {
            setShowFaceModal(false);
            handleAuthSuccess(user);
          }}
        />
      </>
    );
  }

  // 3. Main Orderi Radar Application
  return (
    <>
      <OrderiApp 
        onShowSplash={() => setShowSplash(true)} 
        onOpenFaceLogin={() => setShowFaceModal(true)} 
      />

      <FaceBiometricModal
        isOpen={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        onSuccess={(user) => {
          setShowFaceModal(false);
          handleAuthSuccess(user);
        }}
      />
    </>
  );
}
