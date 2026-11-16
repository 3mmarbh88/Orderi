import { BridgeGroupMessageEvent, BridgeMessageType, BridgePrivateReplyEvent } from './types';

export interface MappedIncomingMessageResult {
  kind: 'group_message' | 'private_reply' | 'ignored';
  reason?: string;
  groupEvent?: BridgeGroupMessageEvent;
  privateEvent?: BridgePrivateReplyEvent;
}

/**
 * Normalizes a WhatsApp JID or extracts numeric phone digits when a PN JID exists.
 */
export function extractPhoneFromJid(jid?: string | null): string {
  if (!jid || typeof jid !== 'string') return '';
  if (jid.endsWith('@lid') || jid.endsWith('@g.us') || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) {
    return '';
  }
  const userPart = jid.split('@')[0]?.split(':')[0] || '';
  const digits = userPart.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return digits;
}

export function normalizePrivateUserJid(jid?: string | null): string {
  if (!jid || typeof jid !== 'string') return '';
  const trimmed = jid.trim();
  if (!trimmed) return '';
  const [userPart, domain] = trimmed.split('@');
  if (!userPart || !domain) return trimmed;
  const cleanUser = userPart.split(':')[0];
  return `${cleanUser}@${domain}`;
}

export function isGroupJid(jid?: string | null): boolean {
  return Boolean(jid && typeof jid === 'string' && jid.endsWith('@g.us'));
}

export function unwrapBaileysMessageContent(message: any): any {
  if (!message || typeof message !== 'object') return null;
  let current = message;
  for (let depth = 0; depth < 5; depth++) {
    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
      continue;
    }
    if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
      continue;
    }
    if (current.viewOnceMessageV2?.message) {
      current = current.viewOnceMessageV2.message;
      continue;
    }
    if (current.viewOnceMessageV2Extension?.message) {
      current = current.viewOnceMessageV2Extension.message;
      continue;
    }
    if (current.documentWithCaptionMessage?.message) {
      current = current.documentWithCaptionMessage.message;
      continue;
    }
    if (current.editedMessage?.message) {
      current = current.editedMessage.message;
      continue;
    }
    break;
  }
  return current;
}

export function extractQuotedTextFromContext(quotedMessage: any): string {
  const unwrapped = unwrapBaileysMessageContent(quotedMessage);
  if (!unwrapped) return '';
  if (typeof unwrapped.conversation === 'string') return unwrapped.conversation.trim();
  if (typeof unwrapped.extendedTextMessage?.text === 'string') return unwrapped.extendedTextMessage.text.trim();
  if (typeof unwrapped.imageMessage?.caption === 'string') return unwrapped.imageMessage.caption.trim();
  if (typeof unwrapped.videoMessage?.caption === 'string') return unwrapped.videoMessage.caption.trim();
  if (typeof unwrapped.documentMessage?.caption === 'string') return unwrapped.documentMessage.caption.trim();
  return '';
}

export function extractMessageDetails(rawMessage: any): {
  rawText: string;
  messageType: BridgeMessageType;
  isSticker: boolean;
  isImage: boolean;
  quotedStanzaId?: string;
  quotedParticipant?: string;
  quotedText?: string;
} {
  const unwrapped = unwrapBaileysMessageContent(rawMessage);
  if (!unwrapped) {
    return { rawText: '', messageType: 'other', isSticker: false, isImage: false };
  }

  let contextInfo: any = null;
  let rawText = '';
  let messageType: BridgeMessageType = 'other';
  let isSticker = false;
  let isImage = false;

  if (typeof unwrapped.conversation === 'string' && unwrapped.conversation.trim()) {
    rawText = unwrapped.conversation.trim();
    messageType = 'text';
  } else if (unwrapped.extendedTextMessage) {
    contextInfo = unwrapped.extendedTextMessage.contextInfo;
    rawText = (unwrapped.extendedTextMessage.text || '').trim();
    messageType = contextInfo?.stanzaId ? 'reply' : 'text';
  } else if (unwrapped.imageMessage) {
    isImage = true;
    contextInfo = unwrapped.imageMessage.contextInfo;
    rawText = (unwrapped.imageMessage.caption || '').trim();
    messageType = 'image';
  } else if (unwrapped.stickerMessage) {
    isSticker = true;
    contextInfo = unwrapped.stickerMessage.contextInfo;
    rawText = '[sticker]';
    messageType = 'sticker';
  } else if (unwrapped.videoMessage) {
    contextInfo = unwrapped.videoMessage.contextInfo;
    rawText = (unwrapped.videoMessage.caption || '').trim();
    messageType = 'video_caption';
  } else if (unwrapped.documentMessage) {
    contextInfo = unwrapped.documentMessage.contextInfo;
    rawText = (unwrapped.documentMessage.caption || '').trim();
    messageType = 'document_caption';
  }

  const quotedStanzaId = contextInfo?.stanzaId ? String(contextInfo.stanzaId) : undefined;
  const quotedParticipant = contextInfo?.participant
    ? normalizePrivateUserJid(String(contextInfo.participant))
    : undefined;
  const quotedText = contextInfo?.quotedMessage
    ? extractQuotedTextFromContext(contextInfo.quotedMessage)
    : undefined;

  if (quotedStanzaId && messageType === 'text') {
    messageType = 'reply';
  }

  return {
    rawText,
    messageType,
    isSticker,
    isImage,
    quotedStanzaId,
    quotedParticipant,
    quotedText,
  };
}

export function resolveTimestampMs(messageTimestamp: unknown): number {
  if (typeof messageTimestamp === 'number' && Number.isFinite(messageTimestamp)) {
    return messageTimestamp > 1e12 ? messageTimestamp : messageTimestamp * 1000;
  }
  if (messageTimestamp && typeof messageTimestamp === 'object' && 'low' in messageTimestamp) {
    const low = Number((messageTimestamp as any).low || 0);
    if (low > 0) return low * 1000;
  }
  const parsed = Number(messageTimestamp);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed > 1e12 ? parsed : parsed * 1000;
  }
  return Date.now();
}

/**
 * Pure mapper converting a Baileys WAMessage into an Orderi Bridge event.
 * - Group messages (`@g.us`) become `BridgeGroupMessageEvent`.
 * - 1-on-1 private chats NEVER become group order events; they only produce a
 *   `private_reply` signal (`ignoredForOrderExtraction: true`) so active outreach
 *   confirmations can still be recognized safely without creating fake orders.
 */
export function mapBaileysMessage(params: {
  userId: string;
  msg: any;
  groupName?: string;
  resolvedPnJid?: string;
}): MappedIncomingMessageResult {
  const { userId, msg, groupName, resolvedPnJid } = params;
  if (!msg || !msg.key || !msg.message) {
    return { kind: 'ignored', reason: 'empty_message' };
  }

  const remoteJid = String(msg.key.remoteJid || '').trim();
  const messageId = String(msg.key.id || '').trim();
  if (!remoteJid || !messageId) {
    return { kind: 'ignored', reason: 'missing_key' };
  }

  if (
    remoteJid === 'status@broadcast' ||
    remoteJid.endsWith('@broadcast') ||
    remoteJid.endsWith('@newsletter')
  ) {
    return { kind: 'ignored', reason: 'status_or_newsletter' };
  }

  const details = extractMessageDetails(msg.message);
  if (!details.rawText && !details.isSticker) {
    return { kind: 'ignored', reason: 'no_extractable_text_or_sticker' };
  }

  const timestamp = resolveTimestampMs(msg.messageTimestamp);
  const receivedAtIso = new Date(timestamp).toISOString();
  const isFromMe = msg.key.fromMe === true;

  // Strict 1-on-1 Private Chat Isolation:
  // Never emit group orders from private 1-on-1 messages!
  if (!isGroupJid(remoteJid)) {
    const altJid = msg.key.remoteJidAlt ? normalizePrivateUserJid(String(msg.key.remoteJidAlt)) : '';
    const pnCandidate =
      (resolvedPnJid && resolvedPnJid.endsWith('@s.whatsapp.net') ? normalizePrivateUserJid(resolvedPnJid) : '') ||
      (altJid.endsWith('@s.whatsapp.net') ? altJid : '') ||
      normalizePrivateUserJid(remoteJid);
    const senderPhone = extractPhoneFromJid(pnCandidate);

    if (isFromMe) {
      return { kind: 'ignored', reason: 'own_private_outbound' };
    }

    return {
      kind: 'private_reply',
      privateEvent: {
        eventId: `wa-priv-${messageId}`,
        userId,
        messageId,
        senderJid: pnCandidate,
        senderPhone,
        senderName: String(msg.pushName || '').trim() || 'معلن واتساب',
        rawText: details.rawText,
        timestamp,
        receivedAtIso,
        isFromMe: false,
        isPrivateChat: true,
        ignoredForOrderExtraction: true,
      },
    };
  }

  // Group Message (@g.us)
  const rawParticipant = String(msg.key.participant || msg.participant || '').trim();
  const altParticipant = msg.key.participantAlt ? String(msg.key.participantAlt).trim() : '';

  const candidatePn =
    (resolvedPnJid && resolvedPnJid.endsWith('@s.whatsapp.net') ? normalizePrivateUserJid(resolvedPnJid) : '') ||
    (altParticipant.endsWith('@s.whatsapp.net') ? normalizePrivateUserJid(altParticipant) : '') ||
    (rawParticipant.endsWith('@s.whatsapp.net') ? normalizePrivateUserJid(rawParticipant) : '');

  const canonicalSenderJid =
    candidatePn ||
    normalizePrivateUserJid(rawParticipant) ||
    normalizePrivateUserJid(altParticipant);

  const senderPhone = extractPhoneFromJid(candidatePn);
  const senderName = String(msg.pushName || '').trim() || (senderPhone ? `+${senderPhone}` : 'معلن بالقروب');

  return {
    kind: 'group_message',
    groupEvent: {
      eventId: `wa-grp-${remoteJid}-${messageId}`,
      userId,
      messageId,
      groupJid: remoteJid,
      groupName: (groupName || '').trim() || remoteJid,
      senderJid: canonicalSenderJid,
      senderPhone,
      senderName,
      rawText: details.rawText,
      messageType: details.messageType,
      isSticker: details.isSticker,
      isImage: details.isImage,
      quotedStanzaId: details.quotedStanzaId,
      quotedParticipant: details.quotedParticipant,
      quotedText: details.quotedText,
      timestamp,
      receivedAtIso,
      isFromMe,
      isPrivateChat: false,
      ignoredForOrderExtraction: false,
    },
  };
}

/**
 * Bounded deduplication tracker to prevent duplicate message delivery across reconnects.
 */
export class BridgeMessageDeduper {
  private seen = new Set<string>();
  private queue: string[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 2000, initialKeys: string[] = []) {
    this.maxSize = maxSize;
    for (const key of initialKeys) {
      this.markSeen(key);
    }
  }

  hasSeen(key: string): boolean {
    return this.seen.has(key);
  }

  markSeen(key: string): boolean {
    if (!key) return false;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    this.queue.push(key);
    while (this.queue.length > this.maxSize) {
      const oldest = this.queue.shift();
      if (oldest) this.seen.delete(oldest);
    }
    return true;
  }

  exportKeys(): string[] {
    return [...this.queue];
  }
}
