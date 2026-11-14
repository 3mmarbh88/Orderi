/**
 * Original WhatsApp Message & Sender Locator (Phase 2 Structural Resolver)
 *
 * Mirrors OriginalMessageSenderResolver.java so that row-to-sender binding inside a WhatsApp
 * group conversation can be verified across ordinary names, nicknames, pure emoji/symbol
 * identities, English names, unsaved/unknown labels, multiple advertisers, and duplicate ads
 * without relying on WhatsApp global search, member lists, or guessing phone numbers.
 */

export type RowMatchStatus =
  | 'RESOLVED'
  | 'NOT_FOUND'
  | 'AMBIGUOUS_MULTIPLE_MATCHES'
  | 'IDENTITY_NOT_CONFIRMED';

export type RecommendedRowInteraction =
  | 'CLICK_ROW_SENDER_OR_AVATAR'
  | 'LONG_PRESS_EXACT_MESSAGE_FOR_REPLY_PRIVATELY'
  | 'NONE';

export interface OriginalAdContext {
  orderId: string;
  rawText: string;
  groupName: string;
  senderDisplayName: string;
  sourceMessageTimestamp: number;
  sourceNotificationKey?: string;
  sourceMessageId?: string;
  shortcutId?: string;
  trustedSenderId?: string;
  trustedSenderUri?: string;
  trustedSenderPhone?: string;
  originalMessageRef?: string;
}

export interface MessageRowDescriptor {
  rowIndex: number;
  senderHeader: string;
  messageBody: string;
  timeLabel?: string;
  hasSenderProfileTarget?: boolean;
  isLongClickable?: boolean;
  isOutgoing?: boolean;
  isSystemOrDateDivider?: boolean;
}

export interface OriginalMessageResolutionResult {
  status: RowMatchStatus;
  matchedRowIndex: number;
  boundHeaderRowIndex: number;
  boundSenderLabel: string;
  recommendedInteraction: RecommendedRowInteraction;
  reason: string;
}

const BIDI_CONTROLS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;

const GENERIC_PLACEHOLDERS = new Set([
  'صاحب الاعلان',
  'معلن',
  'معلن بالقروب',
  'معلن في القروب',
  'معلن بالقروب المؤرشف',
  'واتساب',
  'whatsapp',
  'whatsapp messenger',
  'عضو',
  'مجهول',
]);

export function normalizeWhatsAppSenderLabel(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.replace(BIDI_CONTROLS, '').trim();
  if (!s) return '';
  s = s.normalize('NFKC').replace(ARABIC_DIACRITICS, '');

  // Strip only WhatsApp push-name prefixes (~, @) and trailing punctuation while keeping emojis/symbols intact
  s = s.replace(/^[~@\s]+/, '').replace(/[:：،,\s]+$/, '').trim();
  s = s
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');

  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isGenericPlaceholderSender(raw?: string | null): boolean {
  const norm = normalizeWhatsAppSenderLabel(raw);
  if (!norm) return true;
  return GENERIC_PLACEHOLDERS.has(norm);
}

export function normalizeWhatsAppMessageBody(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.replace(BIDI_CONTROLS, ' ').trim();
  if (!s) return '';
  s = s.normalize('NFKC').replace(ARABIC_DIACRITICS, '');
  s = s
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function senderLabelsMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizeWhatsAppSenderLabel(a);
  const nb = normalizeWhatsAppSenderLabel(b);
  if (!na || !nb) return false;
  return na === nb;
}

export function messageBodiesMatch(candidateRowText?: string | null, expectedRawText?: string | null): boolean {
  const cand = normalizeWhatsAppMessageBody(candidateRowText);
  const expected = normalizeWhatsAppMessageBody(expectedRawText);
  if (!cand || !expected) return false;
  if (cand === expected) return true;
  if (expected.length >= 8 && cand.includes(expected)) return true;
  if (cand.length >= 18 && expected.includes(cand)) return true;
  return false;
}

function normalizeArabicDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function formatHourMinute24And12(timestampMs: number): [string, string] {
  const d = new Date(timestampMs);
  const h24 = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const hh24 = `${String(h24).padStart(2, '0')}:${m}`;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hh12 = `${h12}:${m}`;
  return [hh24, hh12];
}

export function buildOriginalMessageRef(rawText?: string | null, timestampMs = 0): string {
  const norm = normalizeWhatsAppMessageBody(rawText);
  let hash = 2166136261;
  for (let i = 0; i < norm.length; i++) {
    hash ^= norm.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const minuteBucket = timestampMs > 0 ? Math.floor(timestampMs / 60000) : 0;
  return `msg-${hex}-${minuteBucket}`;
}

export function locateOriginalMessageSender(
  rows: MessageRowDescriptor[],
  adContext: OriginalAdContext,
): OriginalMessageResolutionResult {
  if (!adContext || !normalizeWhatsAppMessageBody(adContext.rawText)) {
    return {
      status: 'IDENTITY_NOT_CONFIRMED',
      matchedRowIndex: -1,
      boundHeaderRowIndex: -1,
      boundSenderLabel: '',
      recommendedInteraction: 'NONE',
      reason: 'نص الإعلان الأصلي فارغ؛ لا يمكن تحديد الرسالة الأصلية.',
    };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      status: 'NOT_FOUND',
      matchedRowIndex: -1,
      boundHeaderRowIndex: -1,
      boundSenderLabel: '',
      recommendedInteraction: 'NONE',
      reason: 'لا توجد رسائل مرئية في شاشة المجموعة.',
    };
  }

  const expectedSender = adContext.senderDisplayName || '';
  const hasSpecificExpectedSender = !isGenericPlaceholderSender(expectedSender);

  interface Candidate {
    row: MessageRowDescriptor;
    boundSender: string;
    headerRowIndex: number;
  }

  const matched: Candidate[] = [];
  let sawTextMatchWithMismatch = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.isSystemOrDateDivider || row.isOutgoing) continue;
    if (!messageBodiesMatch(row.messageBody, adContext.rawText)) continue;

    let boundSender = (row.senderHeader || '').trim();
    let headerRowIndex = i;
    let hasProfileTarget = Boolean(row.hasSenderProfileTarget);

    if (!boundSender) {
      for (let prev = i - 1; prev >= 0; prev--) {
        const prevRow = rows[prev];
        if (!prevRow || prevRow.isSystemOrDateDivider || prevRow.isOutgoing) {
          break;
        }
        if ((prevRow.senderHeader || '').trim()) {
          boundSender = prevRow.senderHeader.trim();
          headerRowIndex = prev;
          if (!hasProfileTarget) {
            hasProfileTarget = Boolean(prevRow.hasSenderProfileTarget);
          }
          break;
        }
      }
    }

    if (hasSpecificExpectedSender) {
      if (!boundSender || !senderLabelsMatch(boundSender, expectedSender)) {
        sawTextMatchWithMismatch = true;
        continue;
      }
    } else if (!boundSender) {
      sawTextMatchWithMismatch = true;
      continue;
    }

    matched.push({
      row: { ...row, hasSenderProfileTarget: hasProfileTarget },
      boundSender,
      headerRowIndex,
    });
  }

  if (matched.length === 0) {
    if (sawTextMatchWithMismatch) {
      return {
        status: 'IDENTITY_NOT_CONFIRMED',
        matchedRowIndex: -1,
        boundHeaderRowIndex: -1,
        boundSenderLabel: '',
        recommendedInteraction: 'NONE',
        reason: 'وُجد نص مشابه لكن مرسله داخل المجموعة لا يطابق صاحب الإعلان الأصلي.',
      };
    }
    return {
      status: 'NOT_FOUND',
      matchedRowIndex: -1,
      boundHeaderRowIndex: -1,
      boundSenderLabel: '',
      recommendedInteraction: 'NONE',
      reason: 'لم يتم العثور على رسالة الإعلان الأصلية في الجزء الظاهر من المجموعة.',
    };
  }

  let selected: Candidate | null = null;
  if (matched.length === 1) {
    selected = matched[0];
  } else if (adContext.sourceMessageTimestamp > 0) {
    const [hh24, hh12] = formatHourMinute24And12(adContext.sourceMessageTimestamp);
    const timeFiltered = matched.filter((c) => {
      const label = normalizeArabicDigits(c.row.timeLabel || '');
      return Boolean(label && (label.includes(hh24) || label.includes(hh12)));
    });
    if (timeFiltered.length === 1) {
      selected = timeFiltered[0];
    }
  }

  if (!selected) {
    return {
      status: 'AMBIGUOUS_MULTIPLE_MATCHES',
      matchedRowIndex: -1,
      boundHeaderRowIndex: -1,
      boundSenderLabel: '',
      recommendedInteraction: 'NONE',
      reason: 'تطابق أكثر من صف إعلان لنفس النص/المرسل دون حسم فريد؛ توقف الإجراء حفاظاً على الدقة.',
    };
  }

  let interaction: RecommendedRowInteraction = 'NONE';
  if (selected.row.hasSenderProfileTarget) {
    interaction = 'CLICK_ROW_SENDER_OR_AVATAR';
  } else if (selected.row.isLongClickable) {
    interaction = 'LONG_PRESS_EXACT_MESSAGE_FOR_REPLY_PRIVATELY';
  } else {
    return {
      status: 'IDENTITY_NOT_CONFIRMED',
      matchedRowIndex: selected.row.rowIndex,
      boundHeaderRowIndex: selected.headerRowIndex,
      boundSenderLabel: selected.boundSender,
      recommendedInteraction: 'NONE',
      reason: 'تمت مطابقة الرسالة لكنها لا تحتوي على هدف قابل للنقر لملف المرسل أو الرد الخاص.',
    };
  }

  return {
    status: 'RESOLVED',
    matchedRowIndex: selected.row.rowIndex,
    boundHeaderRowIndex: selected.headerRowIndex,
    boundSenderLabel: selected.boundSender,
    recommendedInteraction: interaction,
    reason: `تم تحديد صف الرسالة الأصلية وربطها بصاحبها «${selected.boundSender}».`,
  };
}
