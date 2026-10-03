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
  Reply
} from 'lucide-react';
import { OrderFilter, ParsedOrder, AreaLocation, StoreContact, OrderBroadcast } from './types';
import { BAHRAIN_AREAS, findNearestArea } from './data/bahrainAreas';
import { MatcherLocation, evaluateOrderMatch } from './utils/matcher';
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
  // 1. Persistent Filter State
  const [filter, setFilter] = useState<OrderFilter>(() => {
    try {
      const saved = localStorage.getItem('orderi_filter_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_FILTER;
  });

  // 2. Driver Location (Default: Manama)
  const [driverLocation, setDriverLocation] = useState<MatcherLocation | null>(() => {
    return {
      latitude: 26.2235,
      longitude: 50.5876,
      areaName: 'المنامة',
    };
  });
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // 3. Navigation & Feed Filter
  const [activeTab, setActiveTab] = useState<'radar' | 'settings' | 'ledger' | 'broadcast' | 'map'>('radar');
  const [feedFilter, setFeedFilter] = useState<'all' | 'matched' | 'vip' | 'trusted_vip'>('all');

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

  // 5. Radar Live Engine (No fake simulator - pure real WhatsApp stream & webhooks)
  const [liveRadarActive, setLiveRadarActive] = useState(true);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isAutoSyncModalOpen, setIsAutoSyncModalOpen] = useState(false);
  const [autoSyncInitialTab, setAutoSyncInitialTab] = useState<'qr' | 'listener' | 'webhook'>('qr');
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const [isWhatsAppWebConnected, setIsWhatsAppWebConnected] = useState(false);
  const [webhookOrdersCount, setWebhookOrdersCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleLogout = () => {
    setStoredCurrentUser(null);
    setCurrentUser(null);
    showToast('تم تسجيل الخروج بنجاح');
  };

  const currentUserRef = useRef<CaptainUser | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const isActivated = isProgramActivated(currentUser);

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

  // Check if a group is allowed by driver filter
  const isOrderGroupAllowedRef = (groupName?: string) => {
    if (!filterRef.current.selectedGroups || filterRef.current.selectedGroups.length === 0) return true;
    if (!groupName) return true;
    return filterRef.current.selectedGroups.some(g =>
      groupName.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(groupName.toLowerCase())
    );
  };

  // 6. Real-time EventSource listener for WhatsApp automated webhook orders
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
              // Block order processing if the program is not activated
              if (!isProgramActivated(currentUserRef.current)) {
                return;
              }
              const raw = payload.order;
              setWebhookOrdersCount((prev) => prev + 1);

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
                // If sounds enabled and not ignored, alert with pleasant tone
                if (filterRef.current.soundEnabled && !filterRef.current.ignoreNonMatching) {
                  playAlertTone(filterRef.current.alertTone || 'chime', 60);
                }
                showToast(`⚡ وارد تلقائياً من واتساب: ${newOrder.from} ← ${newOrder.to} (${newOrder.price} د.ب)`);
              }

              setOrders((prev) => [newOrder, ...prev.slice(0, 39)]);
            }
          } catch (err) {
            console.error('[Ordari Stream Error]', err);
          }
        };

        eventSource.onerror = () => {
          setIsStreamConnected(false);
          if (eventSource) {
            eventSource.close();
          }
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectToLiveStream, 4000);
        };
      } catch {
        setIsStreamConnected(false);
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectToLiveStream, 5000);
      }
    };

    connectToLiveStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, []);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // GPS Location Request
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      showToast('خدمة تحديد الموقع GPS غير مدعومة في متصفحك');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestArea(latitude, longitude);

        const newLoc: MatcherLocation = {
          latitude,
          longitude,
          areaName: nearest.area.name,
        };
        setDriverLocation(newLoc);
        recalculateOrdersWithNewLocation(newLoc, filter);
        showToast(`تم تحديد موقعك: أقرب منطقة هي ${nearest.area.name} (${nearest.distanceKm} كم)`);
      },
      (err) => {
        setIsGpsLoading(false);
        showToast('تعذر الوصول إلى GPS. يمكنك اختيار منطقتك يدوياً من الإعدادات');
        console.warn(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSetManualLocation = (area: AreaLocation) => {
    const newLoc: MatcherLocation = {
      latitude: area.latitude,
      longitude: area.longitude,
      areaName: area.name,
    };
    setDriverLocation(newLoc);
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
    setFilter(newFilter);
    recalculateOrdersWithNewLocation(driverLocation, newFilter);
    showToast('تم حفظ الإعدادات وتحديث مطابقة الرادار بنجاح');
  };

  // Toggle switch to ignore/hide non-matching orders (< 80%)
  const handleToggleIgnoreNonMatching = () => {
    const nextVal = !filter.ignoreNonMatching;
    const updatedFilter: OrderFilter = { ...filter, ignoreNonMatching: nextVal };
    setFilter(updatedFilter);
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
    new Set(orders.map((o) => o.groupName).filter(Boolean))
  ) as string[];

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

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col font-['Tajawal',sans-serif]">
      
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
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 pb-32 md:pb-8 space-y-4 sm:space-y-8">
        
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
                <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60 overflow-x-auto gap-1">
                  <button
                    onClick={() => setFeedFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      feedFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter.ignoreNonMatching ? `المطابقة (${displayedOrders.length})` : `جميع الوارد (${orders.length})`}
                  </button>

                  <button
                    onClick={() => setFeedFilter('matched')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      feedFilter === 'matched'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    المطابقة 80%+ ({matchedCount})
                  </button>

                  <button
                    onClick={() => setFeedFilter('vip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      feedFilter === 'vip'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    VIP 90%+ ({vipCount})
                  </button>

                  <button
                    onClick={() => setFeedFilter('trusted_vip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      feedFilter === 'trusted_vip'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/50'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
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
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 max-w-xl mx-auto">
                      <button
                        onClick={() => {
                          setAutoSyncInitialTab('qr');
                          setIsAutoSyncModalOpen(true);
                        }}
                        className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4 text-emerald-200" />
                        <span>ربط واتساب ويب (QR) 📲</span>
                      </button>

                      <button
                        onClick={() => {
                          setAutoSyncInitialTab('listener');
                          setIsAutoSyncModalOpen(true);
                        }}
                        className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Smartphone className="w-4 h-4 text-blue-200" />
                        <span>تفعيل قارئ إشعارات الهاتف 🔔</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('settings')}
                        className="flex-1 min-w-[180px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Sliders className="w-4 h-4 text-slate-300" />
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

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs sm:text-sm font-bold">
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

      {/* Activation Lock Barrier: إذا لم يدخل كود التفعيل البرنامج لا يعمل */}
      {!isActivated && (
        <ActivationLockBarrier
          currentUser={currentUser}
          onActivated={(user) => {
            setCurrentUser(user);
            setStoredCurrentUser(user);
            setLiveRadarActive(true);
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
