import { OrderiNotificationListener, WhatsAppNativeEvent, isNativeAndroid } from './orderiNotificationListener';
import { discriminateConversationSource, inspectChatJid } from '../utils/conversationSourceDiscriminator';
import { isSimulatedMockGroup } from '../utils/simulatorPurge';

export type WhatsAppClientConnectionState = 
  | 'not_registered'
  | 'whatsapp_not_installed'
  | 'permission_required' 
  | 'service_disconnected'
  | 'waiting_for_messages'
  | 'receiving_events'
  | 'processing_messages'
  | 'radar_active'
  | 'error'
  // Backward-compatible aliases:
  | 'disconnected' 
  | 'ready_listening' 
  | 'active_stream';

export interface WhatsAppClientDiagnostics {
  isAndroid: boolean;
  listenerEnabled: boolean;
  serviceConnected: boolean;
  accessibilityEnabled: boolean;
  accessibilityRunning: boolean;
  batteryOptimizationIgnored: boolean;
  unreadGroupsInTray: number;
  pendingEventsCount: number;
  phoneRegistered: boolean;
  phoneNumber: string;
  lastMessageAt: number | null;
  lastMessageGroup: string | null;
  totalMessagesIngested: number;
  totalOrdersCaptured: number;
  totalClosedOrders: number;
  monitoredGroupsCount: number;
  state: WhatsAppClientConnectionState;
  stateLabel: string;
  detailedState?: 'not_registered' | 'whatsapp_not_installed' | 'permission_required' | 'service_disconnected' | 'waiting_for_messages' | 'receiving_events' | 'processing_messages' | 'radar_active' | 'error';
  isWhatsAppInstalled?: boolean;
}

export type WhatsAppRawMessageHandler = (event: WhatsAppNativeEvent) => Promise<void> | void;
export type WhatsAppStatusChangeHandler = (status: WhatsAppClientDiagnostics) => void;

const STORAGE_BUFFER_KEY = 'orderi_wa_client_event_buffer_v1';
const STATS_STORAGE_KEY = 'orderi_wa_client_stats_v1';
const PHONE_STORAGE_KEY = 'orderi_wa_client_phone_v1';

export class OrderiWhatsAppClient {
  private static instance: OrderiWhatsAppClient | null = null;
  private isStarted = false;
  private statusCheckInterval: any = null;
  private eventBuffer: WhatsAppNativeEvent[] = [];
  private processedIds: Set<string> = new Set();
  private rawMessageHandlers: Set<WhatsAppRawMessageHandler> = new Set();
  private statusChangeHandlers: Set<WhatsAppStatusChangeHandler> = new Set();
  
  // Real stats (no fake connected counters)
  private totalMessagesIngested = 0;
  private totalOrdersCaptured = 0;
  private totalClosedOrders = 0;
  private lastMessageAt: number | null = null;
  private lastMessageGroup: string | null = null;
  private listenerSubscription: { remove: () => Promise<void> } | null = null;

  // Cached diagnostic state
  private lastDiagnostics: WhatsAppClientDiagnostics = {
    isAndroid: isNativeAndroid(),
    listenerEnabled: false,
    serviceConnected: false,
    accessibilityEnabled: false,
    accessibilityRunning: false,
    batteryOptimizationIgnored: false,
    unreadGroupsInTray: 0,
    pendingEventsCount: 0,
    phoneRegistered: false,
    phoneNumber: '',
    lastMessageAt: null,
    lastMessageGroup: null,
    totalMessagesIngested: 0,
    totalOrdersCaptured: 0,
    totalClosedOrders: 0,
    monitoredGroupsCount: 0,
    state: 'disconnected',
    stateLabel: 'غير مفعل',
  };

  private constructor() {
    this.loadPersistedData();
  }

  public static getInstance(): OrderiWhatsAppClient {
    if (!OrderiWhatsAppClient.instance) {
      OrderiWhatsAppClient.instance = new OrderiWhatsAppClient();
    }
    return OrderiWhatsAppClient.instance;
  }

  private loadPersistedData(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY) || '';
      if (savedPhone) {
        this.lastDiagnostics.phoneNumber = savedPhone;
        this.lastDiagnostics.phoneRegistered = true;
      }
      const rawStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (rawStats) {
        const stats = JSON.parse(rawStats);
        this.totalMessagesIngested = stats.totalMessagesIngested || 0;
        this.totalOrdersCaptured = stats.totalOrdersCaptured || 0;
        this.totalClosedOrders = stats.totalClosedOrders || 0;
        this.lastMessageAt = stats.lastMessageAt || null;
        this.lastMessageGroup = stats.lastMessageGroup || null;
      }
      const rawBuffer = localStorage.getItem(STORAGE_BUFFER_KEY);
      if (rawBuffer) {
        const parsed = JSON.parse(rawBuffer);
        if (Array.isArray(parsed)) {
          this.eventBuffer = parsed.slice(-50);
        }
      }
    } catch {}
  }

  private persistStats(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({
        totalMessagesIngested: this.totalMessagesIngested,
        totalOrdersCaptured: this.totalOrdersCaptured,
        totalClosedOrders: this.totalClosedOrders,
        lastMessageAt: this.lastMessageAt,
        lastMessageGroup: this.lastMessageGroup,
      }));
    } catch {}
  }

  private persistBuffer(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_BUFFER_KEY, JSON.stringify(this.eventBuffer.slice(-50)));
    } catch {}
  }

  /**
   * Register captain's phone number. Separated strictly from connection status.
   */
  public registerPhoneNumber(phone: string): void {
    const clean = (phone || '').trim();
    this.lastDiagnostics.phoneNumber = clean;
    this.lastDiagnostics.phoneRegistered = !!clean;
    try {
      if (typeof localStorage !== 'undefined') {
        if (clean) localStorage.setItem(PHONE_STORAGE_KEY, clean);
        else localStorage.removeItem(PHONE_STORAGE_KEY);
      }
    } catch {}
    this.refreshDiagnostics();
  }

  /**
   * Starts the client: hooks native Android listener, drains pending queues, and starts status monitor.
   */
  public async start(): Promise<void> {
    if (this.isStarted) return;
    this.isStarted = true;

    // 1. Hook native event listener
    if (isNativeAndroid()) {
      try {
        this.listenerSubscription = await OrderiNotificationListener.addListener(
          'whatsappNotification',
          (event: WhatsAppNativeEvent) => {
            this.handleIncomingNativeEvent(event);
          }
        );
      } catch (err) {
        console.warn('[Orderi WhatsApp Client] Failed to register notification listener:', err);
      }
    }

    // 2. Initial diagnostics check
    await this.refreshDiagnostics();

    // 3. Drain any pending events that arrived while app was closed or in background
    await this.drainPendingEvents();

    // 4. Start periodic health & status check
    if (!this.statusCheckInterval && typeof window !== 'undefined') {
      this.statusCheckInterval = window.setInterval(() => {
        this.refreshDiagnostics().catch(() => {});
        this.drainPendingEvents().catch(() => {});
      }, 3500);
    }
  }

  /**
   * Stops the client monitoring.
   */
  public async stop(): Promise<void> {
    this.isStarted = false;
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
    if (this.listenerSubscription) {
      try {
        await this.listenerSubscription.remove();
      } catch {}
      this.listenerSubscription = null;
    }
    this.lastDiagnostics.state = 'disconnected';
    this.lastDiagnostics.stateLabel = 'متوقف';
    this.notifyStatusChange();
  }

  /**
   * Ingest and buffer incoming native event. Strictly enforces privacy:
   * Rejects private/personal 1-on-1 chats so they never touch the radar.
   */
  public async handleIncomingNativeEvent(event: WhatsAppNativeEvent): Promise<void> {
    if (!event || !event.id) return;

    // Dedup check
    if (this.processedIds.has(event.id)) return;
    this.processedIds.add(event.id);
    if (this.processedIds.size > 2000) {
      const arr = Array.from(this.processedIds);
      this.processedIds = new Set(arr.slice(-1000));
    }

    // Check if group is a mock/simulation group (purge)
    if (event.groupName && isSimulatedMockGroup(event.groupName)) {
      await this.acknowledgeEvent(event.id);
      return;
    }

    // Strict Source Discrimination:
    // Reject private 1-on-1 chats from ever entering group delivery pipeline
    if (event.chatJid) {
      const jidCheck = inspectChatJid(event.chatJid);
      if (jidCheck.isUserJid) {
        await this.acknowledgeEvent(event.id);
        return;
      }
    }

    const sourceAnalysis = discriminateConversationSource({
      title: event.title,
      rawText: event.text || event.rawText,
      conversationTitle: event.conversationTitle,
      groupName: event.groupName,
      isGroup: event.isGroup,
      isExplicitGroup: event.isExplicitGroup,
      chatId: event.chatId || event.chatJid,
      senderName: event.senderName,
      isDirectPrivate: event.isDirectPrivate,
    });

    if (sourceAnalysis.isPrivateIndividual || sourceAnalysis.sourceType === 'private_individual') {
      // Personal chat strictly ignored & acknowledged
      await this.acknowledgeEvent(event.id);
      return;
    }

    // Update real stats
    this.totalMessagesIngested++;
    this.lastMessageAt = Date.now();
    this.lastMessageGroup = event.groupName || event.conversationTitle || event.title || 'قروب واتساب';
    this.persistStats();

    // Buffer event in memory & storage
    this.eventBuffer.push(event);
    if (this.eventBuffer.length > 50) this.eventBuffer.shift();
    this.persistBuffer();

    // Broadcast to raw message handlers
    const handlers = Array.from(this.rawMessageHandlers);
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        console.warn('[Orderi WhatsApp Client] Handler error for event:', event.id, err);
      }
    }

    // Refresh diagnostics
    this.refreshDiagnostics().catch(() => {});
  }

  /**
   * Drains persisted native unacknowledged queue from Android SharedPreferences.
   */
  public async drainPendingEvents(): Promise<void> {
    if (!isNativeAndroid()) return;
    try {
      const res = await OrderiNotificationListener.getPending();
      if (res && res.events && res.events.length > 0) {
        for (const evt of res.events) {
          if (!this.processedIds.has(evt.id)) {
            await this.handleIncomingNativeEvent(evt);
          }
        }
      }
    } catch (err) {
      console.warn('[Orderi WhatsApp Client] Failed to drain pending events:', err);
    }
  }

  /**
   * Acknowledges an event to remove it from Android persistent queue.
   */
  public async acknowledgeEvent(eventId: string): Promise<void> {
    if (!eventId || !isNativeAndroid()) return;
    try {
      await OrderiNotificationListener.acknowledgeEvents({ ids: [eventId] });
    } catch {}
  }

  /**
   * Record that a confirmed order was parsed and added to Radar.
   */
  public recordOrderCaptured(_orderId: string): void {
    this.totalOrdersCaptured++;
    this.persistStats();
    this.refreshDiagnostics().catch(() => {});
  }

  /**
   * Record that an order was closed (e.g. advertiser posted 'تم' or got another driver).
   */
  public recordOrderClosed(_orderId: string): void {
    this.totalClosedOrders++;
    this.persistStats();
    this.refreshDiagnostics().catch(() => {});
  }

  /**
   * Full diagnostics of Android permissions and real WhatsApp connection state.
   */
  public async refreshDiagnostics(): Promise<WhatsAppClientDiagnostics> {
    const isAndroid = isNativeAndroid();
    let listenerEnabled = false;
    let serviceConnected = false;
    let accessibilityEnabled = false;
    let accessibilityRunning = false;
    let batteryOptimizationIgnored = false;
    let unreadGroupsInTray = 0;
    let pendingEventsCount = 0;
    let isWhatsAppInstalled = false;

    if (isAndroid) {
      try {
        const pluginAny = OrderiNotificationListener as any;
        if (typeof pluginAny.getDiagnosticStatus === 'function') {
          const diag = await pluginAny.getDiagnosticStatus();
          listenerEnabled = !!diag.listenerEnabled;
          serviceConnected = !!diag.serviceConnected;
          accessibilityEnabled = !!diag.accessibilityEnabled;
          accessibilityRunning = !!diag.accessibilityRunning;
          batteryOptimizationIgnored = !!diag.batteryOptimizationIgnored;
          unreadGroupsInTray = diag.unreadGroupsCount || 0;
          pendingEventsCount = diag.pendingEventsCount || 0;
          isWhatsAppInstalled = !!diag.isWhatsAppInstalled;
        } else {
          const enabledRes = await OrderiNotificationListener.isEnabled();
          listenerEnabled = !!enabledRes?.enabled;
          const accRes = await OrderiNotificationListener.isAccessibilityEnabled();
          accessibilityEnabled = !!accRes?.enabled;
          const unreadRes = await OrderiNotificationListener.hasUnreadNotifications();
          unreadGroupsInTray = unreadRes?.unreadCount || 0;
        }
      } catch (err) {
        console.warn('[Orderi WhatsApp Client] Diagnostic query failed:', err);
      }
    }

    // Determine state truthfully:
    let state: WhatsAppClientConnectionState = 'disconnected';
    let stateLabel = 'متوقف';

    if (!this.isStarted) {
      state = 'disconnected';
      stateLabel = 'العميل متوقف';
    } else if (isAndroid && !isWhatsAppInstalled) {
      state = 'disconnected';
      stateLabel = 'واتساب العادي غير مثبت';
    } else if (isAndroid && !listenerEnabled) {
      state = 'permission_required';
      stateLabel = 'صلاحية قراءة الإشعارات مطلوبة ⚠️';
    } else if (isAndroid && !serviceConnected) {
      state = 'service_disconnected';
      stateLabel = 'خدمة استقبال إشعارات واتساب غير متصلة';
    } else {
      const hasRecentMessage = !!this.lastMessageAt && (Date.now() - this.lastMessageAt < 15 * 60 * 1000);
      if (hasRecentMessage) {
        state = 'active_stream';
        stateLabel = 'تم استقبال أحداث واتساب مؤخراً 🟢';
      } else {
        state = 'ready_listening';
        stateLabel = 'خدمة الاستقبال متصلة وتنتظر إشعاراً جديداً';
      }
    }

    // Count monitored groups
    let monitoredGroupsCount = 0;
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('orderi_my_whatsapp_groups');
        if (saved) {
          const groups = JSON.parse(saved);
          if (Array.isArray(groups)) monitoredGroupsCount = groups.length;
        }
      }
    } catch {}

    let detailedState: 'not_registered' | 'whatsapp_not_installed' | 'permission_required' | 'service_disconnected' | 'waiting_for_messages' | 'receiving_events' | 'processing_messages' | 'radar_active' | 'error' = 'not_registered';

    if (!this.lastDiagnostics.phoneRegistered) {
      detailedState = 'not_registered';
    } else if (isAndroid && !isWhatsAppInstalled) {
      detailedState = 'whatsapp_not_installed';
    } else if (isAndroid && !listenerEnabled) {
      detailedState = 'permission_required';
    } else if (isAndroid && !serviceConnected) {
      detailedState = 'service_disconnected';
    } else if (this.lastMessageAt && (Date.now() - this.lastMessageAt < 15 * 60 * 1000)) {
      if (this.totalOrdersCaptured > 0) {
        detailedState = 'radar_active';
      } else {
        detailedState = 'receiving_events';
      }
    } else {
      detailedState = 'waiting_for_messages';
    }

    this.lastDiagnostics = {
      isAndroid,
      listenerEnabled,
      serviceConnected,
      accessibilityEnabled,
      accessibilityRunning,
      batteryOptimizationIgnored,
      unreadGroupsInTray,
      pendingEventsCount,
      phoneRegistered: !!this.lastDiagnostics.phoneNumber,
      phoneNumber: this.lastDiagnostics.phoneNumber,
      lastMessageAt: this.lastMessageAt,
      lastMessageGroup: this.lastMessageGroup,
      totalMessagesIngested: this.totalMessagesIngested,
      totalOrdersCaptured: this.totalOrdersCaptured,
      totalClosedOrders: this.totalClosedOrders,
      monitoredGroupsCount,
      state,
      stateLabel,
      detailedState,
      isWhatsAppInstalled,
    };

    this.notifyStatusChange();
    return this.lastDiagnostics;
  }

  public getDiagnostics(): WhatsAppClientDiagnostics {
    return { ...this.lastDiagnostics };
  }

  public onRawMessage(handler: WhatsAppRawMessageHandler): () => void {
    this.rawMessageHandlers.add(handler);
    return () => {
      this.rawMessageHandlers.delete(handler);
    };
  }

  public onStatusChange(handler: WhatsAppStatusChangeHandler): () => void {
    this.statusChangeHandlers.add(handler);
    // Call immediately with current state
    handler({ ...this.lastDiagnostics });
    return () => {
      this.statusChangeHandlers.delete(handler);
    };
  }

  private notifyStatusChange(): void {
    const diag = { ...this.lastDiagnostics };
    this.statusChangeHandlers.forEach((handler) => {
      try {
        handler(diag);
      } catch {}
    });
  }
}

export const orderiWhatsAppClient = OrderiWhatsAppClient.getInstance();
