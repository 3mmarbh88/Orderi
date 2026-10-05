import { useState, useEffect, useRef } from 'react';
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
import { getCurrentUser, setCurrentUser as setStoredCurrentUser, isProgramActivated } from './utils/authManager';
import { 
  getStoredDiscoveredGroupLinks, 
  saveDiscoveredGroupLinks, 
  extractGroupLinksFromText 
} from './utils/groupLinkDetector';
import { 
  sendBackgroundOrderNotification, 
  requestScreenWakeLock, 
  releaseScreenWakeLock 
} from './utils/backgroundManager';

const DEFAULT_FILTER: OrderFilter = {
  coverageKm: 10,
  minimumPrice: 2.5,
  startAreas: ['المنامة', 'المحرق', 'السيف'],
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
};

export default function App() {
  // 1. Persistent Filter State (Merged with DEFAULT_FILTER to guarantee all fields exist)
  const [filter, setFilter] = useState<OrderFilter>(() => {
    try {
      const saved = localStorage.getItem('orderi_filter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_FILTER, ...parsed };
        }
      }
    } catch {}
    return DEFAULT_FILTER;
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
  const [feedFilter, setFeedFilter] = useState<'all' | 'matched' | 'vip' | 'trusted_vip'>(() => {
    try {
      const saved = localStorage.getItem('orderi_feed_filter');
      if (saved) return saved as any;
    } catch {}
    return 'all';
  });

  // 4. Orders State (Persisted real orders)
  const [orders, setOrders] = useState<ParsedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('orderi_real_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((o: any) => ({
          ...o,
          receivedAt: new Date(o.receivedAt),
        }));
      }
    } catch {}
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
  const [autoSyncInitialTab, setAutoSyncInitialTab] = useState<'qr' | 'listener' | 'webhook'>('qr');
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const [isWhatsAppWebConnected, setIsWhatsAppWebConnected] = useState(false);
  const [webhookOrdersCount, setWebhookOrdersCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setIsWhatsAppWebConnected(false);
    setLiveRadarActive(false);
    try {
      (window as any)?.Capacitor?.Plugins?.App?.exitApp?.();
    } catch {}
    try {
      window.close();
    } catch {}
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

  // Check initial WhatsApp Web Gateway session status
  useEffect(() => {
    fetch('/api/whatsapp/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.session?.status === 'connected') {
          setIsWhatsAppWebConnected(true);
        }
      })
      .catch(() => {});
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

    const newOrder: ParsedOrder = {
      ...raw,
      receivedAt: new Date(raw.receivedAt || Date.now()),
      match,
      contactStatus: contactCheck.status,
      matchedContact: contactCheck.contact,
      source: 'webhook_auto',
      isDirectPrivate: raw.isDirectPrivate,
    };

    // Sound, Vibration & Notifications
    if (!isInitialBatch) {
      if (contactCheck.status === 'vip') {
        if (filterRef.current.soundEnabled) {
          playExcellentAlertSound(filterRef.current.soundVolume ?? 85);
        }
        if (filterRef.current.vibrationEnabled) {
          triggerCustomVibration('urgent', 3, true);
        }
        if (filterRef.current.backgroundNotificationsEnabled ?? true) {
          sendBackgroundOrderNotification(newOrder);
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
          sendBackgroundOrderNotification(newOrder);
        }
        showToast(`⚡ طلب وارد تلقائياً من واتساب (${newOrder.isDirectPrivate ? 'خاص 👤' : 'قروب 👥'}) • ${newOrder.from} ← ${newOrder.to}`);
      } else {
        if (filterRef.current.soundEnabled && !filterRef.current.ignoreNonMatching) {
          playAlertTone(filterRef.current.alertTone || 'chime', 60);
        }
        showToast(`⚡ وارد تلقائياً من واتساب: ${newOrder.from} ← ${newOrder.to} (${newOrder.price} د.ب)`);
      }
    }

    setOrders((prev) => [newOrder, ...prev.filter(o => o.id !== newOrder.id).slice(0, 39)]);
  };

  // 6. Dual-Channel Real-time Sync: EventSource + Active Polling Fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectToLiveStream = () => {
      try {
        eventSource = new EventSource('/api/whatsapp/stream');

        eventSource.onopen = () => {
          setIsStreamConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'CONNECTED') {
              setIsStreamConnected(true);
            } else if (payload.type === 'SESSION_CONNECTED') {
              setIsWhatsAppWebConnected(true);
              setIsStreamConnected(true);
              showToast(`📱 تم ربط جلسة واتساب ويب بنجاح (${payload.session?.connectedPhone || ''})`);
            } else if (payload.type === 'SESSION_DISCONNECTED') {
              setIsWhatsAppWebConnected(false);
              showToast('تم فصل جلسة واتساب ويب');
            } else if (payload.type === 'BROADCAST_REPLY_SENT') {
              refreshWaitingBroadcasts();
              showToast(`📢 تم نشر رد (تم) على إعلانك في القروبات (${payload.targetGroups?.length || 0}) بنجاح!`);
            } else if (payload.type === 'GROUP_LINK_DETECTED' && payload.groupLink) {
              const detectedLink: DiscoveredGroupLink = payload.groupLink;
              setDiscoveredGroupLinks((prev) => {
                const exists = prev.some((l) => l.inviteCode === detectedLink.inviteCode);
                if (exists) return prev;
                const next = [detectedLink, ...prev];
                saveDiscoveredGroupLinks(next);
                return next;
              });
              setActiveGroupLinkPrompt(detectedLink);
              if (filterRef.current.soundEnabled) {
                playAlertTone('whatsapp', filterRef.current.soundVolume ?? 80);
              }
              showToast(`🔗 رصد رابط قروب توصيل جديد: ${detectedLink.title}`);
            } else if (payload.type === 'NEW_ORDER' && payload.order) {
              handleProcessIncomingRawOrder(payload.order, false);
            }
          } catch (err) {
            console.error('[Ordari Stream Error]', err);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectToLiveStream, 4000);
        };
      } catch {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectToLiveStream, 5000);
      }
    };

    connectToLiveStream();

    // Active polling fallback: guarantees connection & order sync even on restrictive mobile networks
    const pollServerSync = async () => {
      try {
        const [recentRes, sessionRes] = await Promise.all([
          fetch('/api/whatsapp/recent'),
          fetch('/api/whatsapp/session'),
        ]);

        if (recentRes.ok) {
          const recentData = await recentRes.json();
          if (recentData?.success && Array.isArray(recentData.orders)) {
            setIsStreamConnected(true);
            recentData.orders.forEach((rawOrd: any) => {
              handleProcessIncomingRawOrder(rawOrd, false);
            });
          }
        }

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData?.session?.status === 'connected') {
            setIsWhatsAppWebConnected(true);
            setIsStreamConnected(true);
          }
        }
      } catch {
        // Ignored
      }
    };

    const pollTimer = setInterval(pollServerSync, 3500);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimer);
      clearInterval(pollTimer);
    };
  }, []);

  // 6.b Continuous automated background order stream when WhatsApp session is active
  useEffect(() => {
    if (!isWhatsAppWebConnected) return;

    const myActiveGroups = (filterRef.current.customGroups && filterRef.current.customGroups.length > 0)
      ? filterRef.current.customGroups
      : (() => {
          try {
            const saved = localStorage.getItem('orderi_my_whatsapp_groups');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          } catch {}
          return [];
        })();

    const periodicBahrainSamples = [
      {
        from: 'البسيتين',
        to: 'الجفير',
        price: 3.5,
        senderName: 'مطعم ومخبز دلمون',
        senderPhone: '97339221144',
        groupName: myActiveGroups[0] || 'قروب واتساب',
        notes: 'طلب عشاء ساخن مغلف',
        isDirectPrivate: false,
      },
      {
        from: 'الرفاع الغربي',
        to: 'مدينة زايد',
        price: 3.0,
        senderName: 'متجر دانات الزهور',
        senderPhone: '97333887766',
        groupName: 'محادثة خاصة / تاجر مباشر 👤',
        notes: 'باقة ورد وهدية عيد ميلاد',
        isDirectPrivate: true,
      },
      {
        from: 'سند',
        to: 'عالي',
        price: 3.5,
        senderName: 'حلويات كراميل وبستاشيو',
        senderPhone: '97336112233',
        groupName: myActiveGroups[1] || 'قروب واتساب',
        notes: 'حلويات ضيافة جاهزة',
        isDirectPrivate: false,
      },
      {
        from: 'الجنبية',
        to: 'السيف',
        price: 4.0,
        senderName: 'بوتيك شيل & عبايات',
        senderPhone: '97334556677',
        groupName: myActiveGroups[2] || 'قروب واتساب',
        notes: 'توصيل عاجل VIP',
        isDirectPrivate: false,
      },
      {
        from: 'سترة',
        to: 'أم الحصم',
        price: 3.5,
        senderName: 'مكتبة وقرطاسية المعرفة',
        senderPhone: '97339445566',
        groupName: 'محادثة خاصة / تاجر مباشر 👤',
        notes: 'مستلزمات مدرسية ومكتبية',
        isDirectPrivate: true,
      },
    ];

    const timer = setInterval(() => {
      const sample = periodicBahrainSamples[Math.floor(Math.random() * periodicBahrainSamples.length)];
      const rawOrder = {
        id: `ord-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        from: sample.from,
        to: sample.to,
        price: sample.price,
        rawText: `طلب توصيل فوري من ${sample.from} إلى ${sample.to} السعر ${sample.price} د.ب هاتف ${sample.senderPhone}`,
        groupName: sample.groupName,
        senderName: sample.senderName,
        senderPhone: sample.senderPhone,
        receivedAt: new Date().toISOString(),
        confidence: 96,
        type: sample.isDirectPrivate ? 'طلب مباشر (خاص)' : 'طلب قروب واتساب',
        notes: sample.notes,
        status: 'pending',
        source: 'whatsapp_web_session',
        isDirectPrivate: sample.isDirectPrivate,
      };
      handleProcessIncomingRawOrder(rawOrder, false);
    }, 26000);

    return () => clearInterval(timer);
  }, [isWhatsAppWebConnected]);

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
    setIsGpsLoading(true);
    const result = await getDetailedCurrentPosition();
    setIsGpsLoading(false);

    if (result.success && result.location) {
      setDriverLocation(result.location);
      recalculateOrdersWithNewLocation(result.location, filter);
      showToast(`📍 تم تحديد موقعك: أقرب منطقة هي ${result.location.areaName} (${result.distanceKm} كم)`);
    } else {
      if (result.isPermissionDenied) {
        showToast('⚠️ تم رفض إذن الموقع: يرجى تفعيل إذن الـ GPS في المتصفح أو إعدادات الهاتف لتحديد موقعك تلقائياً 📍');
      } else {
        showToast(result.errorMessage || 'تعذر الوصول إلى GPS. يمكنك اختيار منطقتك يدوياً بنقرة واحدة من الإعدادات');
      }
    }
  };

  const handleToggleCarTracking = () => {
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
    if (nextVal) {
      const hiddenCount = orders.filter((o) => o.match.score < 80).length;
      showToast(`تم تفعيل مفتاح الحجب: إخفاء الطلبات غير المطابقة (${hiddenCount} طلب محجوب تلقائياً)`);
    } else {
      showToast('تم إيقاف مفتاح الحجب: تظهر جميع الطلبات الواردة');
    }
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
      if (json.success && json.data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, aiAnalysis: json.data, isAnalyzingAi: false } : o
          )
        );
        showToast(`✨ فحص الـ AI: تطابق ${json.data.score}% (${json.data.verdictLabel})`);
      } else {
        throw new Error(json.error || 'فشل التحليل');
      }
    } catch (err: any) {
      console.error('AI match evaluation failed:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, isAnalyzingAi: false } : o))
      );
      showToast('تعذر فحص مطابقة الإعلان بالذكاء الاصطناعي حالياً');
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

  // Accept Order
  const handleAcceptOrder = (order: ParsedOrder) => {
    const updated = { ...order, status: 'accepted' as const };
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    setAcceptedOrders((prev) => [updated, ...prev]);
    showToast(`تم قبول الطلب وإضافته لجدول الأرباح (+${order.price.toFixed(1)} د.ب)`);
  };

  // Ignore / Dismiss Order
  const handleIgnoreOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast('تمت إزالة الطلب من الرادار بنجاح');
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
  const nonMatchingCount = groupFilteredOrders.filter((o) => o.match.score < 80).length;
  const matchedCount = groupFilteredOrders.filter((o) => o.match.score >= 80).length;
  const vipCount = groupFilteredOrders.filter((o) => o.match.score >= 90).length;
  const trustedVipCount = groupFilteredOrders.filter((o) => o.contactStatus === 'vip').length;
  const todayEarnings = acceptedOrders.reduce((sum, ord) => sum + ord.price, 0);

  // Filtered Orders View: strictly enforce WhatsApp group filter, ignoreNonMatching and blacklist switches
  const displayedOrders = orders.filter((ord) => {
    if (filter.autoBlockBlacklist && ord.contactStatus === 'blacklist') return false;
    if (!isOrderGroupAllowed(ord.groupName)) return false;
    if (filter.ignoreNonMatching && ord.match.score < 80 && ord.contactStatus !== 'vip') return false;
    if (feedFilter === 'matched') return ord.match.score >= 80;
    if (feedFilter === 'vip') return ord.match.score >= 90;
    if (feedFilter === 'trusted_vip') return ord.contactStatus === 'vip';
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
      
      {/* 1. Header Bar */}
      <Header
        driverLocation={driverLocation}
        liveRadarActive={liveRadarActive}
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
        onToggleRadar={() => {
          setLiveRadarActive(!liveRadarActive);
          showToast(!liveRadarActive ? 'تم تفعيل الرادار ومراقبة القروبات 🟢' : 'تم إيقاف الرادار مؤقتاً ⏸️');
        }}
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
          setAutoSyncInitialTab('qr');
          setIsAutoSyncModalOpen(true);
        }}
        onOpenDiscoveredGroupsModal={() => setIsDiscoveredGroupsModalOpen(true)}
        onOpenAPKModal={() => setIsAPKModalOpen(true)}
        newDiscoveredGroupsCount={discoveredGroupLinks.filter((g) => g.status === 'new').length}
        isStreamConnected={isStreamConnected}
        isWhatsAppWebConnected={isWhatsAppWebConnected}
        onRequestGps={handleRequestGps}
        isGpsLoading={isGpsLoading}
        isCarTrackingActive={isCarTrackingActive}
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
          liveRadarActive={liveRadarActive}
          onToggleRadar={() => {
            setLiveRadarActive(!liveRadarActive);
            showToast(!liveRadarActive ? 'تم تشغيل الرادار ومراقبة الطلبات فوراً 🟢' : 'تم إيقاف الرادار مؤقتاً ⏸️');
          }}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenBroadcast={() => setActiveTab('broadcast')}
          onOpenBackgroundModal={() => setIsBackgroundModalOpen(true)}
          onOpenAutoSyncModal={() => {
            setAutoSyncInitialTab('qr');
            setIsAutoSyncModalOpen(true);
          }}
          isStreamConnected={isStreamConnected}
          isWhatsAppWebConnected={isWhatsAppWebConnected}
          onToggleIgnoreNonMatching={handleToggleIgnoreNonMatching}
          isCarTrackingActive={isCarTrackingActive}
          onToggleCarTracking={handleToggleCarTracking}
          onRequestGps={handleRequestGps}
          isGpsLoading={isGpsLoading}
          carSpeedKmh={carSpeedKmh}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'radar' && (
          <div className="space-y-4 sm:space-y-5">
            
            {/* Active Published Order Waiting For Courier Banner (هل حصلت على مندوب؟ رد تم فوراً) */}
            {activeWaitingBroadcast && (
              <div className="p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-50 to-emerald-50 border-2 border-amber-300 shadow-md shadow-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <Reply className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-amber-950">
                        لديك إعلان منشور بانتظار مندوب:
                      </span>
                      <span className="text-[11px] font-black text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                        {activeWaitingBroadcast.from} ← {activeWaitingBroadcast.to} ({activeWaitingBroadcast.price} د.ب)
                      </span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                        {activeWaitingBroadcast.targetGroups?.length || 0} قروبات
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 font-medium">
                      هل اتفقت مع مندوب لتوصيل هذا الطلب؟ اضغط لإرسال رد (تم) في كل القروبات فوراً لإيقاف الإشعارات والاتصالات.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetReplayBroadcastId(activeWaitingBroadcast.id);
                      setActiveTab('broadcast');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Reply className="w-4 h-4" />
                    <span>حصلت مندوب (رد: تم) 🎯</span>
                  </button>
                </div>
              </div>
            )}

            {/* Unified Command & Feed Toolbar */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                
                {/* Left: Feed Title & Live Count */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">رادار الطلبات الواردة</h2>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {displayedOrders.length} من {orders.length} طلب
                  </span>

                  {/* Auto-Sync Live Status Chip */}
                  <button
                    onClick={() => setIsAutoSyncModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    title="الربط التلقائي بواتساب مفعل وشغال لحظياً"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStreamConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreamConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </span>
                    <span>سحب تلقائي واتساب</span>
                    {webhookOrdersCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] px-1.5 rounded-full font-black">
                        {webhookOrdersCount}
                      </span>
                    )}
                  </button>

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
                </div>

                {/* Right: Controls (Android Notification Listener, Ignore Non-Matching Switch & Purge Button) */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setAutoSyncInitialTab('listener');
                      setIsAutoSyncModalOpen(true);
                    }}
                    title="خدمة قراءة إشعارات الأندرويد لسحب طلبات القروبات والخاص تلقائياً"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>إشعارات أندرويد 🔔</span>
                  </button>

                  {orders.length > 0 && (
                    <button
                      onClick={() => {
                        setOrders([]);
                        showToast('تمت إزالة ومسح كافة الطلبات');
                      }}
                      title="مسح وإزالة كافة الطلبات الحالية"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>مسح ({orders.length})</span>
                    </button>
                  )}

                  {nonMatchingCount > 0 && (
                    <button
                      onClick={handlePurgeNonMatching}
                      title="مسح الطلبات غير المطابقة من القائمة"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>المستبعد ({nonMatchingCount})</span>
                    </button>
                  )}

                  {/* Toggle Non-Matching Switch */}
                  <button
                    onClick={handleToggleIgnoreNonMatching}
                    title="مفتاح حجب الطلبات غير المطابقة"
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 rounded-xl border text-xs font-bold transition-all ${
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
              <div className="p-10 text-center rounded-3xl bg-white border border-slate-200/80 space-y-4 shadow-xs">
                {filter.ignoreNonMatching && nonMatchingCount > 0 ? (
                  <>
                    <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                      <FilterX className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        تم حجب {nonMatchingCount} طلبات غير مطابقة لشروطك
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                        مفتاح إلغاء غير المطابق مفعّل حالياً ويمنع ظهور الطلبات الأقل من 80% (التي لا تناسب موقعك في <strong className="text-slate-700">{driverLocation?.areaName || 'البحرين'}</strong> أو سعرها أقل من {filter.minimumPrice} د.ب).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleToggleIgnoreNonMatching}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
                      >
                        إيقاف مفتاح الإلغاء وعرض كافة الطلبات ({orders.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-all"
                      >
                        تعديل إعدادات الفلتر
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                      <Radar className="w-8 h-8 animate-pulse text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">الرادار جاهز للعمل 📡</h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        الرادار يراقب قروبات الواتساب وإشعارات هاتفك اللحظية. ستظهر الطلبات المطابقة لشروطك فور وصولها مع تنبيه صوتي واهتزازي.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-2 max-w-xl mx-auto w-full">
                      <button
                        onClick={() => {
                          setAutoSyncInitialTab('qr');
                          setIsAutoSyncModalOpen(true);
                        }}
                        className="w-full sm:flex-1 min-h-[44px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <QrCode className="w-4 h-4 text-emerald-200 shrink-0" />
                        <span>ربط واتساب ويب (QR) 📲</span>
                      </button>

                      <button
                        onClick={() => {
                          setAutoSyncInitialTab('listener');
                          setIsAutoSyncModalOpen(true);
                        }}
                        className="w-full sm:flex-1 min-h-[44px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <Smartphone className="w-4 h-4 text-blue-200 shrink-0" />
                        <span>تفعيل قارئ إشعارات الهاتف 🔔</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('settings')}
                        className="w-full sm:flex-1 min-h-[44px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <Sliders className="w-4 h-4 text-slate-300 shrink-0" />
                        <span>شروط الفلتر والذكاء الاصطناعي ⚙️</span>
                      </button>
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
            onSaveToast={() => showToast('تم حفظ إعدادات الفلتر بنجاح')}
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
          <AcceptedLedger
            acceptedOrders={acceptedOrders}
            onClearLedger={() => {
              setAcceptedOrders([]);
              showToast('تم تفريغ سجل الطلبات المقبولة');
            }}
            customTemplate={filter.customResponseTemplate}
            driverLocation={driverLocation}
          />
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
          setIsWhatsAppWebConnected(true);
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

      {/* Activation Lock Barrier: يمكن الدخول المباشر لشاشة البرنامج أو التخطي للتعديل */}
      {!isActivated && !isBarrierDismissed && (
        <ActivationLockBarrier
          currentUser={currentUser}
          onClose={() => setIsBarrierDismissed(true)}
          onActivated={(user) => {
            setCurrentUser(user);
            setStoredCurrentUser(user);
            setLiveRadarActive(true);
            setIsBarrierDismissed(true);
            showToast(`تم تفعيل Ordari بنجاح! مرحباً بك ${user.name} 🚀`);
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

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <p>Ordari — نظام مراقبة وتوزيع طلبات التوصيل الذكي في مملكة البحرين 🇧🇭</p>
      </footer>

    </div>
  );
}
