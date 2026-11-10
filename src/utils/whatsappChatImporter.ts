/**
 * WhatsApp Chat Importer for Orderi
 * Parses exported .txt chat files from WhatsApp without requiring direct database access
 */

export interface ImportedWhatsAppMessage {
  id: string;
  groupName: string;
  senderName: string;
  dateStr: string;
  timeStr: string;
  timestamp: number;
  messageText: string;
  isSystemMessage: boolean;
}

export interface ChatImportResult {
  totalLines: number;
  totalMessages: number;
  candidateOrdersCount: number;
  closuresCount: number;
  groupName: string;
  messages: ImportedWhatsAppMessage[];
}

// Common WhatsApp exported date-time header patterns
// Examples:
// [12/05/2026, 14:32:10] Sender: Message
// 12/05/2026, 2:32 PM - Sender: Message
// 12/5/26, 14:32 - Sender: Message
// 2026-05-12, 14:32 - Sender: Message
const HEADER_REGEX_BRACKET = /^\[(\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s+([^:]+):\s+(.*)$/;
const HEADER_REGEX_DASH = /^(\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s+-\s+([^:]+):\s+(.*)$/;
const SYSTEM_REGEX_DASH = /^(\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s+-\s+(.+)$/;

export function parseWhatsAppExportTxt(content: string, defaultGroupName?: string): ChatImportResult {
  if (!content) {
    return {
      totalLines: 0,
      totalMessages: 0,
      candidateOrdersCount: 0,
      closuresCount: 0,
      groupName: defaultGroupName || 'محادثة مستوردة',
      messages: [],
    };
  }

  const lines = content.split(/\r?\n/);
  const messages: ImportedWhatsAppMessage[] = [];
  let currentMsg: ImportedWhatsAppMessage | null = null;
  const inferredGroup = defaultGroupName || 'قروب واتساب مستورد';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    let match = HEADER_REGEX_BRACKET.exec(trimmed);
    if (!match) {
      match = HEADER_REGEX_DASH.exec(trimmed);
    }

    if (match) {
      if (currentMsg) {
        messages.push(currentMsg);
      }
      const dateStr = match[1];
      const timeStr = match[2];
      const senderName = match[3].trim();
      const messageText = match[4].trim();

      const parsedTs = parseDateTimeToTimestamp(dateStr, timeStr);
      currentMsg = {
        id: createStableMessageId(inferredGroup, senderName, parsedTs, dateStr, timeStr, messageText),
        groupName: inferredGroup,
        senderName,
        dateStr,
        timeStr,
        timestamp: parsedTs,
        messageText,
        isSystemMessage: isSystemSecurityOrAdminMessage(messageText),
      };
    } else {
      // Check if it's a system message without a sender
      const sysMatch = SYSTEM_REGEX_DASH.exec(trimmed);
      if (sysMatch && isSystemSecurityOrAdminMessage(sysMatch[3])) {
        if (currentMsg) messages.push(currentMsg);
        currentMsg = null;
        continue;
      }

      // Multi-line continuation of current message
      if (currentMsg) {
        currentMsg.messageText += '\n' + trimmed;
      }
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  // Filter out system messages
  const userMessages = messages.filter((m) => !m.isSystemMessage);

  // Quick stats
  let candidateOrders = 0;
  let closures = 0;
  const closureKeywords = ['تم', 'حصلت', 'خلاص', 'تم الاستلام', 'تم الحجز'];

  for (const m of userMessages) {
    const txt = m.messageText;
    if (closureKeywords.some((k) => txt === k || txt.startsWith(k + ' ') || txt.endsWith(' ' + k))) {
      closures++;
    } else if (txt.includes('دينار') || txt.includes('د.ب') || txt.includes('توصيل') || txt.includes('مطلوب')) {
      candidateOrders++;
    }
  }

  return {
    totalLines: lines.length,
    totalMessages: userMessages.length,
    candidateOrdersCount: candidateOrders,
    closuresCount: closures,
    groupName: inferredGroup,
    messages: userMessages,
  };
}

function isSystemSecurityOrAdminMessage(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    text.includes('الرسائل والمكالمات مشفرة تماماً') ||
    text.includes('تم إنشاء المجموعة') ||
    text.includes('تم تغيير رمز الأمان') ||
    text.includes('أضاف') ||
    text.includes('غادر') ||
    lower.includes('end-to-end encrypted') ||
    lower.includes('created group') ||
    lower.includes('security code changed')
  );
}

function createStableMessageId(
  groupName: string,
  senderName: string,
  timestamp: number,
  dateStr: string,
  timeStr: string,
  messageText: string,
): string {
  const identity = [
    groupName.trim().toLocaleLowerCase(),
    senderName.trim().toLocaleLowerCase(),
    String(timestamp),
    dateStr.trim(),
    timeStr.trim(),
    messageText.trim().replace(/\\s+/g, ' '),
  ].join('|');
  // Deterministic FNV-1a hash: importing the same export twice yields the same ID.
  let hash = 0x811c9dc5;
  for (let i = 0; i < identity.length; i++) {
    hash ^= identity.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `import-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function parseDateTimeToTimestamp(dateStr: string, timeStr: string): number {
  const dateParts = dateStr.split(/[/.-]/).map((part) => Number.parseInt(part, 10));
  if (dateParts.length !== 3 || dateParts.some((part) => !Number.isFinite(part))) return 0;

  let year: number;
  let month: number;
  let day: number;
  if (dateStr.split(/[/.-]/)[0].length === 4) {
    [year, month, day] = dateParts;
  } else {
    // WhatsApp exports commonly use day/month/year in Arabic-region locales.
    [day, month, year] = dateParts;
  }
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return 0;

  const timeMatch = /^(\\d{1,2}):(\\d{2})(?::(\\d{2}))?\\s*(AM|PM)?$/i.exec(timeStr.trim());
  if (!timeMatch) return 0;
  let hour = Number.parseInt(timeMatch[1], 10);
  const minute = Number.parseInt(timeMatch[2], 10);
  const second = Number.parseInt(timeMatch[3] || '0', 10);
  const meridiem = (timeMatch[4] || '').toUpperCase();
  if (minute > 59 || second > 59 || hour > 23) return 0;
  if (meridiem) {
    if (hour < 1 || hour > 12) return 0;
    if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  }

  const parsed = new Date(year, month - 1, day, hour, minute, second, 0);
  // Reject impossible calendar dates rather than silently rolling into another month.
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return 0;
  return parsed.getTime();
}
