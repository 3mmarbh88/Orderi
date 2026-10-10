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
  X
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
import { ActivationLockBarrier } from './components/ActivationLockBarrier';
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
import { getWhatsAppConnection, markWhatsAppVerified } from './utils/whatsappConnection';
import { isNativeAndroid, OrderiNotificationListener, WhatsAppNativeEvent } from './native/orderiNotificationListener';
import { getWhatsAppListenerStatus } from './native/whatsappListener';
import { isDuplicateOrder, findDuplicateOrderMatch, rememberOrderFingerprint } from './utils/orderDedup';
import { computeClientAiEvaluation } from './utils/aiEvaluator';
import { detectPassengerDelivery } from './utils/passengerClassifier';
import { checkIncomingMessageForClosure, ClosureMatchResult } from './utils/orderClosureDetector';
import { classifyAdvertiserPrivateReply } from './utils/advertiserReplyClassifier';
import { 
  sendBackgroundOrderNotification, 
  requestNotificationPermission,
  requestScreenWakeLock, 
  releaseScreenWakeLock,
  isInIframe,
  isNotificationSupported
} from './utils/backgroundManager';

const DEFAULT_FILTER: OrderFilter = {
  coverageKm: 10,
  minimumPrice: 2.5,
  startAreas: [],
  destinations: ['الرفاع', 'مدينة عيسى', 'سار'],
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
};

function OrderiApp() {
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
  const [feedFilter, setFeedFilter] = useState<'all' | 'matched' | 'vip' | 'trusted_vip' | 'passengers' | 'closed'>(() => {
    try {
      const saved = localStorage.getItem('orderi_feed_filter');
      if (saved) return saved as any;
    } catch {}
    return 'all';
  });

  // 4. Orders State (Persisted real orders only - pure live feeds)
  const [orders, setOrders] = useState<ParsedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('orderi_real_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((o: any) => o.source !== 'simulation' && !o.id?.startsWith('ord-showcase-') && !o.notes?.includes('سحبه تلقائياً فور ربط'))
            .map((o: any) => ({
              ...o,
              receivedAt: new Date(o.receivedAt),
              passengerDetection: o.passengerDetection || detectPassengerDelivery(o.rawText || `${o.from} ${o.to}`),
            }));
        }
      }
    } catch {}

    // Clean initial state: no mock/simulation orders, only live WhatsApp orders
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

  // Self-healing purge: Automatically remove deleted default groups from localStorage if previously stored
  useEffect(() => {
    try {
      const banned = [
        'قروب مندوبي البحرين 🇧🇭',
        'طلبات التوصيل - المنامة والمحرق',
        'توصيل سريع الرفاع ومدينة عيسى',
        'شبكة مناديب التوصيل السريع',
      ];

      // Clean orderi_my_whatsapp_groups
      const saved = localStorage.getItem('orderi_my_whatsapp_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((g: string) => !banned.includes(g));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(cleaned));
          }
        }
      }

      // Clean orderi_custom_broadcast_groups
      const savedBroadcast = localStorage.getItem('orderi_custom_broadcast_groups');
      if (savedBroadcast) {
        const parsedB = JSON.parse(savedBroadcast);
        if (Array.isArray(parsedB)) {
          const cleanedB = parsedB.filter((g: any) => !banned.includes(g?.name || g));
          if (cleanedB.length !== parsedB.length) {
            localStorage.setItem('orderi_custom_broadcast_groups', JSON.stringify(cleanedB));
          }
        }
      }
    } catch {}
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
      // 1. Fetch recent webhook orders from server if available
      try {
        const res = await fetch('/api/whatsapp/recent', { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.orders)) {
            json.orders.forEach((ord: any) => {
              handleProcessIncomingRawOrder(ord, false);
            });
          }
        }
      } catch (netErr) {
        console.warn('[Orderi] Could not fetch server recent orders:', netErr);
      }

      // 2. Refresh local persisted orders
      const saved = localStorage.getItem('orderi_real_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOrders(parsed
            .filter((o: any) => o.source !== 'simulation')
            .map((o: any) => ({ ...o, receivedAt: new Date(o.receivedAt) }))
            .slice(0, 40));
        }
      }

      // 3. In Native Android, check pending notification events
      if (isNativeAndroid()) {
        const pending = await OrderiNotificationListener.getPending();
        // Existing fingerprint protection makes this safe even if Android
        // returns notifications that were already processed.
        if (pending?.events?.length) {
          const { parseWhatsAppOrderText } = await import('./utils/orderParser');
          pending.events.slice(-30).forEach((event: WhatsAppNativeEvent) => {
            const groupName = (event.conversationTitle || event.title || '').trim() || 'محادثة خاصة 👤';
            const rawText = [event.bigText, event.text, event.subText, event.rawText]
              .filter(Boolean).join('\n').trim();
            const parsed = parseWhatsAppOrderText(rawText || event.title || '');
            if (parsed.canCreateOrder) {
              handleProcessIncomingRawOrder({
                id: `android-wa-${event.id}`,
                from: parsed.from, to: parsed.to, price: parsed.price,
                isPriceUnspecified: parsed.isPriceUnspecified,
                rawText: rawText || event.title || '', groupName,
                senderName: event.title || 'WhatsApp', senderPhone: parsed.phone,
                receivedAt: new Date(event.receivedAt || Date.now()),
                confidence: parsed.confidence, type: 'whatsapp_notification',
                notes: parsed.notes, status: 'pending',
                source: 'android_notification',
                isDirectPrivate: !event.isGroup,
              }, true);
            }
          });
        }
      }
      showToast('✅ تم تحديث الرادار وجلب أحدث الطلبات');
    } catch (e) {
      console.warn('[Orderi] Radar refresh failed', e);
      showToast('تعذر تحديث الرادار');
    } finally {
      setTimeout(() => setIsRadarRefreshing(false), 450);
    }
  };

  // Persistent list of groups detected from phone notifications / orders
  const [persistedDetectedGroups, setPersistedDetectedGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orderi_detected_incoming_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

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
  }, [currentUser]);

  const isActivated = isProgramActivated(currentUser);
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
    } catch {}
  }, [filter]);

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
    if (!filterRef.current.selectedGroups || filterRef.current.selectedGroups.length === 0) return true;
    if (!groupName) return true;
    return filterRef.current.selectedGroups.some(g =>
      groupName.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(groupName.toLowerCase())
    );
  };

  // Track processed order IDs to prevent duplicate alerts
  const processedOrderIdsRef = useRef<Set<string>>(new Set());

  // Unified processor for incoming WhatsApp orders from SSE, Pairing, or Polling
  const handleProcessIncomingRawOrder = (raw: any, isInitialBatch = false) => {
    if (!raw || !raw.id) return;
    if (processedOrderIdsRef.current.has(raw.id)) return;

    processedOrderIdsRef.current.add(raw.id);

    // Block order processing if the program is not activated
    if (!isProgramActivated(currentUserRef.current)) {
      return;
    }

    setWebhookOrdersCount((prev) => prev + 1);

    // Save detected group name from incoming WhatsApp notification / message
    if (raw.groupName && raw.groupName !== 'محادثة خاصة 👤' && !raw.groupName.includes('محادثة خاصة')) {
      setPersistedDetectedGroups((prev) => {
        if (!prev.includes(raw.groupName)) {
          const next = [...prev, raw.groupName];
          try {
            localStorage.setItem('orderi_detected_incoming_groups', JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }

    // Also sniff for any group links inside the raw message
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

    // Calculate matching with current driver location & active filter
    const match = evaluateOrderMatch(
      raw.from,
      raw.to,
      raw.price,
      filterRef.current,
      driverLocationRef.current
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

    // Compare order & advertiser across WhatsApp groups to prevent duplicates
    if (filterRef.current.preventDuplicateOrders !== false) {
      const existingMatch = findDuplicateOrderMatch(raw, ordersRef.current);
      if (existingMatch) {
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
        showToast(`📢 تم دمج إعلان مكرر من المعلن نُشر في قروب: ${raw.groupName} لمنع التكرار`);
        return;
      }
    }

    // Deduplicate only after the order passes activation, blacklist and group
    // filters. This prevents an ignored group from "claiming" an order that
    // later appears in one of the driver's monitored groups.
    if (isDuplicateOrder(raw)) {
      return;
    }

    // Detect Passenger Delivery status (كاشف نقل الركاب والأشخاص)
    const passengerDetection = raw.passengerDetection || detectPassengerDelivery(raw.rawText || `${raw.from} ${raw.to}`, {
      isBlockForbiddenEnabled: filterRef.current.blockPassengerDeliveries !== false,
    });

    const newOrder: ParsedOrder = {
      ...raw,
      price: typeof raw.price === 'number' && raw.price > 0 ? raw.price : 0,
      isPriceUnspecified: raw.isPriceUnspecified ?? (!raw.price || raw.price <= 0),
      receivedAt: new Date(raw.receivedAt || Date.now()),
      match,
      contactStatus: contactCheck.status,
      matchedContact: contactCheck.contact,
      source: 'webhook_auto',
      isDirectPrivate: raw.isDirectPrivate,
      crossPostedGroups: raw.crossPostedGroups || [raw.groupName],
      duplicateCount: raw.duplicateCount || 1,
      passengerDetection,
    };

    // Sound, Vibration & Notifications
    if (!isInitialBatch) {
      if (passengerDetection.level === 'confirmed_passenger') {
        // تنبيه أحمر بنقل أشخاص: الإعلان يظهر بالرادار للعلم مع تعطيل القبول
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
        if (filterRef.current.backgroundNotificationsEnabled ?? true) {
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

        if (filterRef.current.backgroundNotificationsEnabled ?? true) {
          sendBackgroundOrderNotification(newOrder, filterRef.current);
        }
        showToast(`⚡ طلب وارد تلقائياً من واتساب (${newOrder.isDirectPrivate ? 'خاص 👤' : 'قروب 👥'}) • ${newOrder.from} ← ${newOrder.to}`);
      } else {
        // الطلب غير مطابق لشروط الكابتن
        if (filterRef.current.ignoreNonMatching && passengerDetection.level !== 'confirmed_passenger') {
          // محجوب تماماً من الإشعارات في الخلفية والأصوات بناء على رغبة الكابتن
          return;
        }
        if (filterRef.current.soundEnabled) {
          playAlertTone(filterRef.current.alertTone || 'chime', 60);
        }
        showToast(`⚡ وارد تلقائياً من واتساب: ${newOrder.from} ← ${newOrder.to} (${newOrder.price} د.ب)`);
      }
    }

    setOrders((prev) => [newOrder, ...prev.filter(o => o.id !== newOrder.id).slice(0, 39)]);
  };

  // Native Android WhatsApp listener: receives com.whatsapp notifications even while Orderi is backgrounded.
  useEffect(() => {
    if (!isNativeAndroid()) return;
    let removed = false;
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    const convertNativeEvent = (event: WhatsAppNativeEvent) => {
      const groupName = (event.conversationTitle || event.title || '').trim() || 'محادثة خاصة 👤';
      const rawText = [event.bigText, event.text, event.subText]
        .filter(Boolean)
        .join('\n')
        .trim();
      if (!rawText && !event.title) return;
      // A real WhatsApp notification verifies that the native listener is seeing WhatsApp on this device.
      markWhatsAppVerified(event.isGroup ? groupName : undefined);
      setIsWhatsAppConnected(true);

      // Check if incoming notification is a private reply from an advertiser («تم / لك / عندك» vs «أخذوه / تكنسل»)
      if (!event.isGroup && rawText) {
        const replyVerdict = classifyAdvertiserPrivateReply(rawText);
        if (replyVerdict.verdict === 'CONFIRMED_AWARDED') {
          setAwardedOrderData({
            orderId: `notif-reply-${Date.now()}`,
            advertiserName: event.title || 'صاحب الإعلان',
            advertiserPhone: '',
            replyText: rawText.trim(),
          });
          showToast(`🎉 مبروك! المعلن رد عليك بالخاص وعطاك الطلب («${rawText.trim()}»)`);
          if (filterRef.current.soundEnabled) {
            playAlertTone('cash_register', 90);
          }
          return;
        } else if (replyVerdict.verdict === 'REJECTED_OR_TAKEN') {
          // Silent ignore - المعلن أفاد بأنه أخذوه أو تكنسل
          console.log('[Orderi Native] Advertiser replied taken/cancelled:', rawText);
          return;
        }
      }

      // Check for Smart Order Closure (الكشف الذكي عن الطلبات المحجوزة أو المنتهية)
      if (filterRef.current.autoCloseOrdersEnabled !== false) {
        const closureMatch = checkIncomingMessageForClosure(
          {
            text: rawText || event.title || '',
            senderName: event.title,
            groupName,
            timestamp: event.receivedAt || Date.now(),
          },
          ordersRef.current
        );
        if (closureMatch) {
          handleAutoOrderClosure(closureMatch);
          return;
        }
      }

      import('./utils/orderParser').then(({ parseWhatsAppOrderText }) => {
        const parsed = parseWhatsAppOrderText(rawText || event.title || '');
        const order = {
          id: `android-wa-${event.id}`,
          from: parsed.from,
          to: parsed.to,
          price: parsed.price,
          isPriceUnspecified: parsed.isPriceUnspecified,
          rawText: rawText || event.title || '',
          groupName,
          senderName: event.title || 'WhatsApp',
          senderPhone: parsed.phone,
          receivedAt: new Date(event.receivedAt || Date.now()),
          confidence: parsed.confidence,
          type: 'whatsapp_notification',
          notes: parsed.notes,
          status: 'pending' as const,
          source: 'android_notification' as const,
          isDirectPrivate: !event.isGroup,
          passengerDetection: parsed.passengerDetection,
        };
        if (parsed.canCreateOrder) handleProcessIncomingRawOrder(order, false);
      }).catch(() => {});
    };

    let openOrderListenerHandle: { remove: () => Promise<void> } | null = null;

    const setup = async () => {
      try {
        const pending = await OrderiNotificationListener.getPending();
        if (!removed) pending.events.forEach(convertNativeEvent);
        listenerHandle = await OrderiNotificationListener.addListener('whatsappNotification', convertNativeEvent);

        // Listen for openOrderDetail emitted when tapping Android phone notification
        openOrderListenerHandle = await OrderiNotificationListener.addListener('openOrderDetail', (data: any) => {
          if (!data) return;
          const orderId = data.orderId;
          const existing = ordersRef.current.find((o) => o.id === orderId);
          if (existing) {
            setFocusedOrder(existing);
          } else if (data.rawText || data.from) {
            setFocusedOrder({
              id: orderId || `ord-notif-${Date.now()}`,
              from: data.from || 'البحرين',
              to: data.to || 'حسب طلب الزبون 📍',
              price: data.price || 0,
              isPriceUnspecified: !data.price || data.price <= 0,
              rawText: data.rawText || `${data.from || ''} ← ${data.to || ''}`,
              groupName: 'واتساب',
              senderName: data.senderName || 'معلن واتساب',
              receivedAt: new Date(),
              confidence: 90,
              type: 'طلب واتساب',
              notes: '',
              status: 'pending',
              passengerCount: data.passengerCount,
              passengerDetection: {
                level: data.isPassenger ? 'confirmed_passenger' : 'goods_safe',
                label: data.isPassenger ? 'نقل أشخاص' : 'توصيل بضائع معتمد',
                matchedPhrases: [],
                reason: data.isPassenger ? 'إعلان نقل ركاب' : 'طلب توصيل',
                isForbidden: !!data.isPassenger,
                passengerCount: data.passengerCount,
              },
            });
          }
        });

        // Also check if app was opened via notification intent
        if (OrderiNotificationListener.getClickedOrder) {
          const clicked = await OrderiNotificationListener.getClickedOrder();
          if (clicked?.order && !removed) {
            const data = clicked.order;
            const existing = ordersRef.current.find((o) => o.id === data.orderId);
            if (existing) {
              setFocusedOrder(existing);
            } else if (data.rawText || data.from) {
              setFocusedOrder({
                id: data.orderId || `ord-notif-${Date.now()}`,
                from: data.from || 'البحرين',
                to: data.to || 'حسب طلب الزبون 📍',
                price: data.price || 0,
                isPriceUnspecified: !data.price || data.price <= 0,
                rawText: data.rawText || '',
                groupName: 'واتساب',
                senderName: data.senderName || 'معلن واتساب',
                receivedAt: new Date(),
                confidence: 90,
                type: 'طلب واتساب',
                notes: '',
                status: 'pending',
                passengerCount: data.passengerCount,
                passengerDetection: {
                  level: data.isPassenger ? 'confirmed_passenger' : 'goods_safe',
                  label: data.isPassenger ? 'نقل أشخاص' : 'توصيل بضائع معتمد',
                  matchedPhrases: [],
                  reason: data.isPassenger ? 'إعلان نقل ركاب' : 'طلب توصيل',
                  isForbidden: !!data.isPassenger,
                  passengerCount: data.passengerCount,
                },
              });
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
        setIsStreamConnected(enabled);
      }).catch(() => setIsStreamConnected(false));
      return;
    }

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
            if (data.type === 'NEW_ORDER' && data.order) {
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
              showToast(`🎉 مبروك! المعلن رد عليك بالخاص وعطاك الطلب («${data.replyText || 'تم'}»)`);
              if (filterRef.current.soundEnabled) {
                playAlertTone('cash_register', 90);
              }
            } else if (data.type === 'GROUP_LINK_DETECTED' && data.groupLink) {
              setDiscoveredGroupLinks((prev) => {
                const exists = prev.some((l) => l.inviteCode === data.groupLink.inviteCode);
                if (exists) return prev;
                const next = [data.groupLink, ...prev];
                saveDiscoveredGroupLinks(next);
                setActiveGroupLinkPrompt(data.groupLink);
                return next;
              });
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

  // Listen for Web / PWA background notification clicks: opens order details modal directly!
  useEffect(() => {
    const handleOpenOrderDetailEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const order = detail.order || ordersRef.current.find((o) => o.id === detail.orderId);
      if (order) {
        setFocusedOrder(order);
      } else if (detail.orderId) {
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
      }
    };

    window.addEventListener('orderi:open_order_detail', handleOpenOrderDetailEvent);
    return () => {
      window.removeEventListener('orderi:open_order_detail', handleOpenOrderDetailEvent);
    };
  }, []);


  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

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
    showToast(next ? 'تم تفعيل الرادار ومراقبة القروبات 🟢' : 'تم إيقاف الرادار مؤقتاً ⏸️');
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
        const match = evaluateOrderMatch(ord.from, ord.to, ord.price, currentFilter, loc);
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
    
    setOrders((prev) =>
      prev.map((ord) => {
        const isTarget = 
          ord.id === orderId || 
          (ord.crossPostedGroups && ord.crossPostedGroups.some((g) => evidence.groupName.includes(g)));
        
        if (!isTarget) return ord;

        if (verdict === 'confirmed_closed') {
          return {
            ...ord,
            status: 'closed_taken',
            closedAt: new Date(),
            closureReason: reason,
            closureEvidence: evidence,
          };
        } else {
          return {
            ...ord,
            status: 'suspicious_closed',
            closureReason: reason,
            closureEvidence: evidence,
          };
        }
      })
    );

    if (verdict === 'confirmed_closed') {
      showToast(`🏷️ تم إغلاق الطلب تلقائياً (${closureMatch.matchedOrder.from} ← ${closureMatch.matchedOrder.to}) • تم أخذه في القروب («${evidence.replyText}»)`);
      if (filterRef.current.soundEnabled) {
        playAlertTone('radar_beep', 60);
      }
    } else {
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

  // Accept Order with Monthly Commitment Conflict Protection (حماية من التعارض مع التوصيل الشهري)
  const handleAcceptOrder = (order: ParsedOrder, forceAccept = false) => {
    // Check if accepting this order conflicts with an upcoming monthly commitment today!
    if (!forceAccept) {
      const conflict = checkOrderConflictWithCommitments(commitments, 40);
      if (conflict.hasConflict && conflict.commitment) {
        setCommitmentConflictOrder({
          order,
          conflictWarning: conflict.warningMessage || 'لديك موعد توصيل شهري متزامن مع وقت هذا الطلب',
          commitmentTitle: conflict.commitment.title,
        });
        if (filterRef.current.soundEnabled) {
          playAlertTone('urgent_siren', 80);
        }
        return;
      }
    }

    const updated = { ...order, status: 'accepted' as const };
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    setAcceptedOrders((prev) => [updated, ...prev]);
    const priceText = (!order.price || order.price <= 0 || order.isPriceUnspecified)
      ? '(بالاتفاق مع العميل 🤝)'
      : `(+${order.price.toFixed(1)} د.ب)`;
    showToast(`⚡ تم قبول الطلب والرد التلقائي في الخاص مع صاحب الإعلان 👤 (وليس بالقروب) ${priceText}`);
  };

  // Ignore / Dismiss Order - مسح الطلب من البرنامج وعمل علامة مقروء (تمت قراءتها ✓✓) في الواتساب
  const handleIgnoreOrder = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    try {
      const stored = localStorage.getItem('orderi_cached_orders');
      if (stored) {
        const parsed: ParsedOrder[] = JSON.parse(stored);
        const filtered = parsed.filter((o) => o.id !== orderId);
        localStorage.setItem('orderi_cached_orders', JSON.stringify(filtered));
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

  // Helper to verify if an order's WhatsApp group is allowed by driver's group filter
  const isOrderGroupAllowed = (groupName?: string) => {
    // If selectedGroups is empty, driver wants to monitor ALL joined groups in WhatsApp!
    if (!filter.selectedGroups || filter.selectedGroups.length === 0) return true;
    if (!groupName) return true; // Direct messages or unspecified groups
    return filter.selectedGroups.some(g => 
      groupName.toLowerCase().includes(g.toLowerCase()) || 
      g.toLowerCase().includes(groupName.toLowerCase())
    );
  };

  const detectedIncomingGroups = Array.from(
    new Set([
      ...persistedDetectedGroups,
      ...orders.map((o) => o.groupName).filter(Boolean),
    ])
  ).filter((g) => g && g !== 'محادثة خاصة 👤' && !g.includes('محادثة خاصة')) as string[];

  // Non-matching count (respecting group filter)
  const groupFilteredOrders = orders.filter((o) => isOrderGroupAllowed(o.groupName));
  const closedCount = groupFilteredOrders.filter((o) => o.status === 'closed_taken').length;
  const availableOrders = groupFilteredOrders.filter((o) => o.status !== 'closed_taken');
  const nonMatchingCount = availableOrders.filter((o) => o.match.score < 80).length;
  const matchedCount = availableOrders.filter((o) => o.match.score >= 80).length;
  const vipCount = availableOrders.filter((o) => o.match.score >= 90).length;
  const trustedVipCount = availableOrders.filter((o) => o.contactStatus === 'vip').length;
  const passengerCount = availableOrders.filter((o) => o.passengerDetection?.level === 'confirmed_passenger').length;
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

    const isPassengerOrder = ord.passengerDetection?.level === 'confirmed_passenger';
    if (!isPassengerOrder && filter.ignoreNonMatching && ord.match.score < 80 && ord.contactStatus !== 'vip') return false;
    if (feedFilter === 'matched') return ord.match.score >= 80;
    if (feedFilter === 'vip') return ord.match.score >= 90;
    if (feedFilter === 'trusted_vip') return ord.contactStatus === 'vip';
    if (feedFilter === 'passengers') return isPassengerOrder;
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
            onUpdateFilter={handleUpdateFilter}
            onRequestGps={handleRequestGps}
            onSetManualLocation={handleSetManualLocation}
            onSaveToast={() => showToast('✅ تم حفظ التعديلات وتفعيل شروط الفلتر، وطي الأقسام والانتقال لشاشة الرادار 📡')}
            onNavigateToRadar={() => setActiveTab('radar')}
            detectedIncomingGroups={detectedIncomingGroups}
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

      {/* Activation Lock Barrier: بانتظار كود التفعيل أو بدء التجربة المجانية 7 أيام */}
      {!isActivated && !isBarrierDismissed && (
        <ActivationLockBarrier
          currentUser={currentUser}
          onOpenUnactivated={() => {
            setIsBarrierDismissed(true);
            showToast('تم فتح البرنامج في وضع المشاهدة (رادار الواتساب والـ GPS معطلان) 🔒');
          }}
          onActivated={(user) => {
            setCurrentUser(user);
            setStoredCurrentUser(user);
            setLiveRadarActive(true);
            setIsBarrierDismissed(true);
            showToast(`تم تفعيل Orderi بنجاح! مرحباً بك ${user.name} 🚀`);
          }}
          onOpenAuthModal={(tab) => handleOpenAuthModal(tab)}
        />
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
  const [authenticated, setAuthenticated] = useState<boolean>(
    () => !!getCurrentUser()
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

  if (!authenticated) {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={(user) => {
          setStoredCurrentUser(user);
          setAuthenticated(true);
        }}
        initialTab="login"
      />
    );
  }

  return <OrderiApp />;
}
