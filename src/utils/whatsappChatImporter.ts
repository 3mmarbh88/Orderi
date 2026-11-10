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
    let isBracket = true;
    if (!match) {
      match = HEADER_REGEX_DASH.exec(trimmed);
      isBracket = false;
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
        id: `import-${i}-${Math.random().toString(36).slice(2, 7)}`,
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

function parseDateTimeToTimestamp(dateStr: string, timeStr: string): number {
  try {
    const parts = dateStr.split(/[/.-]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      // Handle YYYY-MM-DD
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
      return new Date(year, month, day).getTime();
    }
  } catch {}
  return Date.now();
}
