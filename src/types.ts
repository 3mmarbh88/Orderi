export interface AreaLocation {
  id: string;
  name: string;
  nameEn: string;
  governorate: 'العاصمة' | 'المحرق' | 'الشمالية' | 'الجنوبية';
  latitude: number;
  longitude: number;
}

export type AlertToneId = 'whatsapp' | 'chime' | 'radar_beep' | 'cash_register' | 'car_horn' | 'marimba' | 'urgent_siren' | 'custom_file';
export type VibrationPatternId = 'standard' | 'pulse' | 'heavy' | 'urgent' | 'subtle';

export interface WhatsAppGroup {
  id: string;
  name: string;
  category?: string;
  isMonitored: boolean;
}

export interface DiscoveredGroupLink {
  id: string;
  url: string;
  inviteCode: string;
  title: string;
  senderName: string;
  senderPhone?: string;
  sourceGroup: string;
  rawText: string;
  capturedAt: string;
  status: 'new' | 'joined' | 'ignored';
  isMonitored?: boolean;
}

export interface StoreContact {
  id: string;
  name: string;
  phone: string;
  type: 'vip' | 'blacklist';
  notes?: string;
  addedAt: string;
}

export interface OrderFilter {
  coverageKm: number;
  minimumPrice: number;
  startAreas?: string[];
  destinations: string[];
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 100
  alertTone: AlertToneId;
  customSoundDataUrl?: string; // custom audio uploaded by user
  customSoundFileName?: string;
  vibrationEnabled: boolean;
  vibrationIntensity: number; // 1 to 3 (low, medium, high)
  vibrationPattern: VibrationPatternId;
  excellentAlertEnabled: boolean;
  ignoreNonMatching: boolean;
  selectedGroups: string[];
  customGroups?: string[];
  allJoinedGroupsMode?: boolean;
  customResponseTemplate: string;
  contacts?: StoreContact[];
  autoBlockBlacklist?: boolean;
  backgroundNotificationsEnabled?: boolean;
  keepScreenAwake?: boolean;
  notificationStyle?: 'whatsapp' | 'standard';
  whatsappBannerEnabled?: boolean;
  customConditionsNotes?: string;
  autoAiEvaluate?: boolean;
  autoDetectGroupLinks?: boolean;
  broadcastReplayTemplate?: string;
  broadcastDefaultDoneText?: string;
  broadcastIncludeQuote?: boolean;
  broadcastCustomNotes?: string;
  preventDuplicateOrders?: boolean;
  blockPassengerDeliveries?: boolean;
  autoCloseOrdersEnabled?: boolean;
  autoCloseAmbiguousAction?: 'flag' | 'ignore';
  excludeMyOwnAds?: boolean; // استبعاد إعلاناتي الشخصية من الرادار
  captainPhone?: string;     // رقم هاتف الكابتن الشخصي للتعرف على إعلاناته
}

export interface AIMatchAnalysis {
  orderId?: string;
  score: number;
  verdict: 'excellent' | 'good' | 'warning' | 'rejected';
  verdictLabel: string;
  summary: string;
  matchedConditions: string[];
  unmatchedConditions: string[];
  redFlags: string[];
  captainAdvice: string;
  detectedDetails?: {
    itemType?: string;
    urgency?: string;
    paymentMethod?: string;
    specialNotes?: string;
  };
  analyzedAt: string;
}

export interface OrderMatchBreakdown {
  score: number;
  startMatched: boolean;
  destinationMatched: boolean;
  priceMatched: boolean;
  distanceMatched: boolean;
  timeMatched: boolean;
  distanceKm: number | null;
  statusLabel: 'طلب ممتاز' | 'مطابق جداً' | 'مطابق جزئياً' | 'غير مطابق' | 'في انتظار الموقع';
  statusColor: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
  pickupToDeliveryDistanceKm?: number;
}

export type PassengerRiskLevel = 'confirmed_passenger' | 'suspicious_passenger' | 'goods_safe';

export interface PassengerDetection {
  level: PassengerRiskLevel;
  label: string;
  matchedPhrases: string[];
  reason: string;
  isForbidden: boolean;
  passengerCount?: number; // عدد الركاب/الأشخاص (مثل: 1, 2, 3, 5)
}

export interface ClosureEvidence {
  replyText: string;
  senderName: string;
  groupName: string;
  timestamp: string;
  confidence: number;
  isQuote: boolean;
  matchedKeywords: string[];
}

export interface ParsedOrder {
  id: string;
  from: string;
  to: string;
  price: number;
  isPriceUnspecified?: boolean;
  passengerCount?: number; // عدد الأشخاص/الركاب منفصلاً عن السعر
  scheduledTime?: string; // وقت التوصيل المحدد بالساعة (e.g. "الساعة 8 مساءً" أو "08:00 مساء")
  scheduledTimeMinutes?: number; // الدقائق من منتصف الليل (e.g. 1200 للساعة 8 مساء)
  isFutureSchedule?: boolean; // هل الطلب محدد بوقت لاحق
  isFromMe?: boolean; // إعلان صادر من رقم المندوب الشخصي
  rawText: string;
  groupName: string;
  senderName: string;
  senderPhone: string;
  receivedAt: Date;
  confidence: number;
  type: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'ignored' | 'closed_taken' | 'suspicious_closed';
  match: OrderMatchBreakdown;
  ratePerKm?: number;
  contactStatus?: 'vip' | 'blacklist' | 'normal';
  matchedContact?: StoreContact;
  source?: 'webhook_auto' | 'whatsapp_web_session' | 'manual' | 'voice' | 'android_notification';
  isDirectPrivate?: boolean;
  aiAnalysis?: AIMatchAnalysis;
  isAnalyzingAi?: boolean;
  crossPostedGroups?: string[];
  duplicateCount?: number;
  passengerDetection?: PassengerDetection;
  closedAt?: Date | string;
  closureReason?: string;
  closureEvidence?: ClosureEvidence;
}

export interface DriverStats {
  todayEarnings: number;
  acceptedCount: number;
  monitoredOrdersCount: number;
  matchedOrdersCount: number;
}

export interface OrderBroadcast {
  id: string;
  text: string;
  targetGroups: string[];
  createdAt: string;
  from?: string;
  to?: string;
  price?: number;
  phone?: string;
  isCompleted?: boolean;
  completedAt?: string;
  repliedGroups?: string[];
  replyTextSent?: string;
}

export type VehicleType = 'car' | 'motorcycle' | 'pickup_minibus' | 'six_wheel' | 'flatbed' | 'bike' | 'van';

export interface CaptainUser {
  id: string;
  name: string;
  phone: string;
  password?: string;
  vehicleType: VehicleType;
  isActivated: boolean;
  activationCode?: string;
  licensePlan?: string;
  activatedAt?: string;
  expiresAt?: string;
  biometricsEnabled?: boolean;
  biometricCredentialId?: string;
  createdAt: string;
  isTrial?: boolean;
  trialStartedAt?: string;
  trialExpiresAt?: string;
}

export interface ActivationCodeInfo {
  code: string;
  planName: string;
  durationDays: number;
  isVip: boolean;
  features: string[];
}

/**
 * Monthly Recurring Commitments & School Runs (الارتباط بالتوصيلات الشهرية)
 * e.g., School runs, daily employee shuttles, recurring point-to-point contracts.
 */
export type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface MonthlyCommitment {
  id: string;
  title: string; // e.g. "توصيل مدارس - مدرسة بيان", "توصيل موظفة السيف يومياً"
  type: 'school' | 'daily_work' | 'custom_recurring'; // نوع الارتباط
  clientName: string; // اسم العميل أو ولي الأمر
  clientPhone: string; // رقم الواتساب / الهاتف للتواصل
  fromArea: string; // نقطة الاستلام اليومية
  toArea: string; // نقطة الوصول اليومية
  pickupTime: string; // توقيت الاستلام بالساعة والدقيقة (e.g. "06:45")
  returnPickupTime?: string; // توقيت العودة إن وجد (e.g. "13:30")
  durationMinutes: number; // المدة المتوقعة للرحلة بالدقائق (e.g. 45 دقيقة) لمنع التعارض مع الطلبات
  days: DayOfWeek[]; // الأيام المتفق عليها (e.g. ['sun', 'mon', 'tue', 'wed', 'thu'])
  monthlyFeeBhd?: number; // المبلغ الشهري المتفق عليه (د.ب)
  reminderMinutesBefore: number; // التنبيه والتذكير قبل كم دقيقة من الموعد (e.g. 15 أو 30 دقيقة)
  isActive: boolean; // مفعل أم معلق مؤقتاً
  notes?: string;
  createdAt: string;
}

/**
 * AI-Learned Closure Expressions (الكلمات والرموز المتعلمة بالذكاء الاصطناعي لكشف الإغلاق)
 * Stores new slang, phrases, and emojis detected and analyzed by Gemini AI
 */
export type ClosureCategory = 'taken' | 'completion' | 'gratitude' | 'emoji';

export interface LearnedClosureExpression {
  id: string;
  phrase: string;
  category: ClosureCategory;
  meaning: string;
  confidence: number;
  learnedAt: string;
  sourceContext?: string;
  matchCount?: number;
  isAiLearned: boolean;
}

