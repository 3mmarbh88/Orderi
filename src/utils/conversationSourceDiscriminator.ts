/**
 * Orderi Conversation Source Discriminator & Privacy Shield
 * نظام التمييز الصارم بين مصادر الرسائل وحماية خصوصية المحادثات الشخصية
 * 
 * يضمن هذا النظام:
 * 1. استبعاد المحادثات الفردية الشخصية (1-on-1 Private Chats) نهائياً وافتراضياً من الظهور كطلبات في Radar.
 * 2. عدم اعتبار اسم المرسل أو نص الرسالة أو وجود كلمات مثل «مندوب» أو «توصيل» أو أسعار أو مناطق دليلاً على أنها قروب توصيل.
 * 3. الاعتماد الحصري على معرّفات وهوية المحادثة الفعلية (isGroup, conversationTitle, JID @g.us vs @s.whatsapp.net).
 * 4. منع رسائل الأصدقاء الخاصة من إغلاق أو تحديث طلبات في الرادار عند كتابة «تم» أو إرسال ملصقات.
 * 5. استبعاد الحالات غير المحددة بثقة وتسجيلها محلياً للتشخيص دون إرسال محتواها لأي خادم خارجي.
 */

import { FilterSettings } from '../types';

export type ConversationSourceType = 
  | 'authorized_group'       // قروب توصيل موثق ومصرح به للمراقبة
  | 'unauthorized_group'     // قروب واتساب مؤكد، لكنه مستبعد وفق إعدادات السائق الحالية
  | 'private_individual'     // محادثة شخصية فردية (صديق / معارف / خاص 1-on-1) -> مستبعدة نهائياً
  | 'undetermined_ambiguous'; // مصدر غير محدد بثقة -> مستبعد احتياطياً لحماية الخصوصية

export interface ConversationSourceAnalysis {
  sourceType: ConversationSourceType;
  isGroup: boolean;
  isPrivateIndividual: boolean;
  isAuthorized: boolean;
  groupName?: string;
  chatId?: string;
  senderName?: string;
  senderPhone?: string;
  confidence: number;
  reason: string;
  diagnosticCode: string;
  rejectionReason?: string;
}

export interface AmbiguousSourceDiagnostic {
  id: string;
  timestamp: number;
  timeDisplay: string;
  sourcePackage?: string;
  hasGroupFlag: boolean;
  hasConversationTitle: boolean;
  hasChatId: boolean;
  chatIdType: 'group_jid' | 'user_jid' | 'missing';
  reason: string;
  diagnosticCode: string;
  decision: 'EXCLUDED_FOR_PRIVACY';
}

const STORAGE_KEY_DIAGNOSTICS = 'orderi_ambiguous_source_diagnostics';
const STORAGE_KEY_EXCLUDED_PRIVATE_COUNT = 'orderi_excluded_private_chats_count';
const STORAGE_KEY_AUTHORIZED_GROUPS = 'orderi_my_whatsapp_groups';

// In-memory diagnostic log (bounded to last 50 entries)
const ambiguousDiagnosticsLog: AmbiguousSourceDiagnostic[] = [];

/**
 * Initialize diagnostics from localStorage
 */
function initDiagnostics(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIAGNOSTICS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        ambiguousDiagnosticsLog.push(...parsed.slice(0, 50));
      }
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  initDiagnostics();
}

/**
 * Record an ambiguous or excluded source diagnostic without leaking sensitive user text
 */
export function recordAmbiguousSourceDiagnostic(item: Omit<AmbiguousSourceDiagnostic, 'id' | 'timestamp' | 'timeDisplay' | 'decision'>): void {
  const diagnostic: AmbiguousSourceDiagnostic = {
    ...item,
    id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    timeDisplay: new Date().toLocaleTimeString('ar-BH'),
    decision: 'EXCLUDED_FOR_PRIVACY',
  };

  ambiguousDiagnosticsLog.unshift(diagnostic);
  if (ambiguousDiagnosticsLog.length > 50) {
    ambiguousDiagnosticsLog.pop();
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_DIAGNOSTICS, JSON.stringify(ambiguousDiagnosticsLog));
    } catch {}
  }
}

/**
 * Get recorded ambiguous source diagnostics
 */
export function getAmbiguousSourceDiagnostics(): AmbiguousSourceDiagnostic[] {
  return [...ambiguousDiagnosticsLog];
}

/**
 * Clear ambiguous source diagnostics
 */
export function clearAmbiguousSourceDiagnostics(): void {
  ambiguousDiagnosticsLog.length = 0;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_DIAGNOSTICS);
    } catch {}
  }
}

/**
 * Increment excluded private chats counter
 */
export function incrementExcludedPrivateChatsCounter(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const current = parseInt(localStorage.getItem(STORAGE_KEY_EXCLUDED_PRIVATE_COUNT) || '0', 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEY_EXCLUDED_PRIVATE_COUNT, String(next));
    return next;
  } catch {
    return 0;
  }
}

/**
 * Get total excluded private chats counter
 */
export function getExcludedPrivateChatsCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY_EXCLUDED_PRIVATE_COUNT) || '0', 10);
  } catch {
    return 0;
  }
}

/**
 * Helper to check if a Chat ID represents a WhatsApp Group or Individual User
 */
export function inspectChatJid(chatId?: string): { isGroupJid: boolean; isUserJid: boolean; jidType: 'group_jid' | 'user_jid' | 'missing' } {
  if (!chatId) return { isGroupJid: false, isUserJid: false, jidType: 'missing' };
  const lower = chatId.toLowerCase();
  
  if (lower.includes('@g.us') || lower.includes('group_') || lower.includes('@temp')) {
    return { isGroupJid: true, isUserJid: false, jidType: 'group_jid' };
  }
  
  if (lower.includes('@s.whatsapp.net') || lower.includes('@c.us') || /^\+?\d{8,15}$/.test(chatId.trim())) {
    return { isGroupJid: false, isUserJid: true, jidType: 'user_jid' };
  }

  return { isGroupJid: false, isUserJid: false, jidType: 'missing' };
}

/**
 * Common Arabic & English tokens that explicitly identify a 1-on-1 private chat label
 */
/**
 * Common Arabic & English tokens that explicitly identify a 1-on-1 private chat label
 */
const PRIVATE_CHAT_NAME_PATTERNS = [
  /محادثة\s*خاصة\s*(👤|1-on-1)?/i,
  /^محادثة\s*خاصة$/i,
  /^خاص\s*👤$/i,
  /^محادثة\s*فردية$/i,
  /^شات\s*خاص$/i,
  /^private\s*chat$/i,
  /^direct\s*message$/i,
  /^1-on-1$/i,
];

/**
 * Check whether a group name string is merely a private chat label or placeholder
 */
export function isPrivateChatPlaceholder(name?: string): boolean {
  if (!name || !name.trim()) return false;
  const trimmed = name.trim();
  return PRIVATE_CHAT_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Check whether an identified group is authorized under the driver's current FilterSettings
 */
/**
 * Check whether an identified group is authorized under the driver's current FilterSettings
 */
export function isGroupAuthorizedByFilter(
  groupName: string, 
  filter?: Partial<FilterSettings> | null
): boolean {
  const name = (groupName || '').trim();
  if (!name || isPrivateChatPlaceholder(name)) return false;

  // Platform default fallback label (e.g. from crawler/webhook stream)
  const normName = name.toLowerCase();
  if (normName === 'واتساب' || normName === 'whatsapp') {
    return true;
  }

  // Check archived group policy
  const isArchived = name.includes('مؤرشف') || name.toLowerCase().includes('archive');
  if (isArchived && filter && filter.monitorArchivedGroups === false) {
    return false;
  }

  // ALL JOINED GROUPS MODE (Default & Recommended):
  // When allJoinedGroupsMode !== false, the driver wants Orderi to monitor ALL delivery groups
  // they are joined in on WhatsApp!
  if (filter?.allJoinedGroupsMode !== false) {
    return true;
  }

  // If driver explicitly disabled allJoinedGroupsMode to restrict to a whitelist of selected groups:
  if (filter?.selectedGroups && filter.selectedGroups.length > 0) {
    return filter.selectedGroups.some((g) => {
      const normG = (g || '').trim().toLowerCase();
      return normG && (normName.includes(normG) || normG.includes(normName));
    });
  }

  // Default: Any genuine non-private group is allowed
  return true;
}

/**
 * Main Discriminator: Evaluates the authentic conversation source
 * Strictly distinguishes delivery groups from private 1-on-1 chats and ambiguous sources
 */
export function discriminateConversationSource(
  event: {
    isGroup?: boolean;
    isDirectPrivate?: boolean;
    isExplicitGroup?: boolean;
    conversationTitle?: string;
    groupName?: string;
    chatId?: string;
    tag?: string;
    key?: string;
    title?: string;
    senderName?: string;
    senderPhone?: string;
    packageName?: string;
    rawText?: string;
  },
  filter?: Partial<FilterSettings> | null
): ConversationSourceAnalysis {
  const rawGroup = (event.groupName || '').trim();
  const rawConvTitle = (event.conversationTitle || '').trim();
  const rawTitle = (event.title || '').trim();
  const rawSender = (event.senderName || '').trim();
  const idCandidate = event.chatId || event.tag || event.key || '';
  const { isGroupJid, isUserJid, jidType } = inspectChatJid(idCandidate);

  // Privacy-first source gate: explicit private signals must win over message
  // wording, contact names, location names, and notification title formatting.
  if (event.isDirectPrivate === true || (event.isGroup === false && !isGroupJid)) {
    return {
      sourceType: 'private_individual',
      isGroup: false,
      isPrivateIndividual: true,
      isAuthorized: false,
      groupName: undefined,
      chatId: idCandidate || undefined,
      senderName: rawSender || rawTitle,
      confidence: 99,
      reason: 'إشارة المصدر تؤكد محادثة فردية أو خاصة؛ تم الاستبعاد قبل تحليل نص الرسالة',
      diagnosticCode: 'PRIVATE_SOURCE_FLAG_EXCLUDED',
      rejectionReason: 'لا يسمح لنص الرسالة أو اسم جهة الاتصال بتحويل المحادثة الخاصة إلى قروب',
    };
  }

  // 1. Explicit Private Chat Signals:
  // A message is strictly private if:
  // - Confirmed individual user JID (@s.whatsapp.net or phone number without @g.us)
  // - Or explicit private placeholder name (e.g. "محادثة خاصة 👤")
  const isUserJidConfirmed = isUserJid && !isGroupJid;
  const hasPrivatePlaceholder = isPrivateChatPlaceholder(rawGroup) || isPrivateChatPlaceholder(rawTitle) || isPrivateChatPlaceholder(rawConvTitle);

  if (isUserJidConfirmed) {
    return {
      sourceType: 'private_individual',
      isGroup: false,
      isPrivateIndividual: true,
      isAuthorized: false,
      groupName: undefined,
      chatId: idCandidate || undefined,
      senderName: rawSender || rawTitle,
      confidence: 99,
      reason: 'محادثة شخصية فردية (User JID @s.whatsapp.net) - تم الاستبعاد التام لحماية الخصوصية',
      diagnosticCode: 'PRIVATE_INDIVIDUAL_EXCLUDED',
      rejectionReason: 'استبعاد افتراضي للمحادثات الخاصة الفردية',
    };
  }

  if (hasPrivatePlaceholder && !isGroupJid && !event.isExplicitGroup) {
    return {
      sourceType: 'private_individual',
      isGroup: false,
      isPrivateIndividual: true,
      isAuthorized: false,
      groupName: undefined,
      chatId: idCandidate || undefined,
      senderName: rawSender || rawTitle,
      confidence: 95,
      reason: 'تسمية المحادثة تدل على شات خاص فردي وليس قروب توصيل',
      diagnosticCode: 'PRIVATE_PLACEHOLDER_EXCLUDED',
      rejectionReason: 'استبعاد محادثة خاصة فردية',
    };
  }

  // 2. Explicit Group Verification Signals:
  const hasExplicitGroupFlag = event.isGroup === true || event.isExplicitGroup === true;
  const hasGroupJidMatch = isGroupJid;

  // Only platform group metadata or a WhatsApp group JID can establish a group.
  // A contact name, title punctuation, or delivery words are not proof of a group.
  const isConfirmedGroup = (hasExplicitGroupFlag || hasGroupJidMatch) && !isUserJidConfirmed;

  if (isConfirmedGroup) {
    // Resolve canonical group title
    let canonicalGroupName = 
      (rawConvTitle && !isPrivateChatPlaceholder(rawConvTitle) ? rawConvTitle : '') ||
      (rawGroup && !isPrivateChatPlaceholder(rawGroup) ? rawGroup : '') ||
      (rawTitle && !isPrivateChatPlaceholder(rawTitle) ? (rawTitle.includes(':') ? rawTitle.split(':')[0].trim() : (rawTitle.includes(' @ ') ? rawTitle.split(' @ ')[1].trim() : rawTitle)) : '') ||
      'واتساب';

    // Strip trailing message count summary like "(3 messages)" or "(5 رسائل)"
    canonicalGroupName = canonicalGroupName.replace(/\s*\(\d+[^)]*\)$/, '').trim();

    // Check if the group is authorized according to driver filter settings
    const isAuthorized = isGroupAuthorizedByFilter(canonicalGroupName, filter);

    if (isAuthorized) {
      return {
        sourceType: 'authorized_group',
        isGroup: true,
        isPrivateIndividual: false,
        isAuthorized: true,
        groupName: canonicalGroupName,
        chatId: idCandidate || undefined,
        senderName: rawSender || (rawSender !== canonicalGroupName ? rawSender : undefined),
        senderPhone: event.senderPhone,
        confidence: 98,
        reason: `قروب توصيل مصرح به ومعتمد: "${canonicalGroupName}"`,
        diagnosticCode: 'AUTHORIZED_DELIVERY_GROUP',
      };
    } else {
      return {
        sourceType: 'unauthorized_group',
        isGroup: true,
        isPrivateIndividual: false,
        isAuthorized: false,
        groupName: canonicalGroupName,
        chatId: idCandidate || undefined,
        senderName: rawSender,
        confidence: 90,
        reason: `قروب واتساب خارج القروبات المحددة في الإعدادات: "${canonicalGroupName}"`,
        diagnosticCode: 'UNAUTHORIZED_GROUP_EXCLUDED',
        rejectionReason: 'غير مصرح به في قائمة القروبات المحددة',
      };
    }
  }

  // If isDirectPrivate is explicitly set and not confirmed as a group:
  if (event.isDirectPrivate === true || event.isGroup === false) {
    return {
      sourceType: 'private_individual',
      isGroup: false,
      isPrivateIndividual: true,
      isAuthorized: false,
      groupName: undefined,
      chatId: idCandidate || undefined,
      senderName: rawSender || rawTitle,
      confidence: 90,
      reason: 'محادثة شخصية فردية (1-on-1 Private Chat) - تم الاستبعاد التام لحماية الخصوصية',
      diagnosticCode: 'PRIVATE_INDIVIDUAL_EXCLUDED',
      rejectionReason: 'استبعاد افتراضي للمحادثات الخاصة الفردية',
    };
  }

  // 3. Indeterminate / Ambiguous Source:
  recordAmbiguousSourceDiagnostic({
    sourcePackage: event.packageName,
    hasGroupFlag: Boolean(event.isGroup),
    hasConversationTitle: Boolean(rawConvTitle),
    hasChatId: Boolean(idCandidate),
    chatIdType: jidType,
    reason: 'تعذر تحديد نوع المحادثة بثقة (غياب معرّفات القروب الموثقة وعلامة isGroupConversation)',
    diagnosticCode: 'UNDETERMINED_SOURCE_EXCLUDED',
  });

  return {
    sourceType: 'undetermined_ambiguous',
    isGroup: false,
    isPrivateIndividual: false,
    isAuthorized: false,
    groupName: undefined,
    chatId: idCandidate || undefined,
    confidence: 40,
    reason: 'تعذر التحقق من هوية المحادثة كقروب توصيل موثق - تم الاستبعاد الاحتياطي',
    diagnosticCode: 'UNDETERMINED_SOURCE_EXCLUDED',
    rejectionReason: 'استبعاد لعدم ثبوت هوية القروب المصرح به',
  };
}

/**
 * Gate 1: Can this message create a new order in Radar?
 * STRICT RULE: Only messages from 'authorized_group' can EVER create an order!
 * Personal private messages and ambiguous chats CAN NEVER create orders.
 */
export function canMessageCreateRadarOrder(analysis: ConversationSourceAnalysis): boolean {
  return analysis.sourceType === 'authorized_group';
}

/**
 * Gate 2: Can this message close or update the status of an existing order in Radar?
 * STRICT RULE:
 * 1. Only messages from an 'authorized_group' can close orders.
 * 2. The message must originate from the SAME group (or cross-posted groups) as the active order.
 * 3. Personal private chats can NEVER close group orders!
 */
export function canMessageCloseRadarOrder(
  analysis: ConversationSourceAnalysis,
  targetOrderGroup?: string,
  targetOrderCrossPosted?: string[]
): boolean {
  if (analysis.sourceType !== 'authorized_group') {
    return false;
  }
  if (!analysis.groupName || !targetOrderGroup) {
    return false;
  }

  const msgGroup = analysis.groupName.trim().toLowerCase();
  const ordGroup = targetOrderGroup.trim().toLowerCase();

  const isDirectGroupMatch = msgGroup.includes(ordGroup) || ordGroup.includes(msgGroup);
  if (isDirectGroupMatch) return true;

  if (targetOrderCrossPosted && Array.isArray(targetOrderCrossPosted)) {
    return targetOrderCrossPosted.some((g) => {
      const gNorm = (g || '').trim().toLowerCase();
      return gNorm && (msgGroup.includes(gNorm) || gNorm.includes(msgGroup));
    });
  }

  return false;
}

/**
 * Gate 3: Can this message text be forwarded to Cloud AI models?
 * STRICT PRIVACY RULE: Never send private personal chats or ambiguous content to external cloud AI.
 */
export function canForwardToCloudAI(analysis: ConversationSourceAnalysis): boolean {
  return analysis.sourceType === 'authorized_group';
}
