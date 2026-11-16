export type WhatsAppBridgeConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Waiting for Pairing'
  | 'Connected'
  | 'Reconnecting'
  | 'Session Expired'
  | 'Error';

export type BridgeMessageType =
  | 'text'
  | 'image'
  | 'sticker'
  | 'reply'
  | 'video_caption'
  | 'document_caption'
  | 'other';

export interface BridgeSessionPublicStatus {
  userId: string;
  state: WhatsAppBridgeConnectionState;
  phoneNumber: string | null;
  pairingCode: string | null;
  pairingCodeExpiresAt: string | null;
  connectedJid: string | null;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastMessageAt: string | null;
  receivedMessagesCount: number;
  sentMessagesCount: number;
  messageIngestionActive: boolean;
  reconnectAttempts: number;
  errorMessage: string | null;
  errorCode: string | null;
  unofficialLibraryWarning: string;
}

export interface BridgeGroupMessageEvent {
  eventId: string;
  userId: string;
  messageId: string;
  groupJid: string;
  groupName: string;
  senderJid: string;
  senderPhone: string;
  senderName: string;
  rawText: string;
  messageType: BridgeMessageType;
  isSticker: boolean;
  isImage: boolean;
  quotedStanzaId?: string;
  quotedParticipant?: string;
  quotedText?: string;
  timestamp: number;
  receivedAtIso: string;
  isFromMe: boolean;
  isPrivateChat: false;
  ignoredForOrderExtraction: false;
}

export interface BridgePrivateReplyEvent {
  eventId: string;
  userId: string;
  messageId: string;
  senderJid: string;
  senderPhone: string;
  senderName: string;
  rawText: string;
  timestamp: number;
  receivedAtIso: string;
  isFromMe: boolean;
  isPrivateChat: true;
  ignoredForOrderExtraction: true;
}

export interface BridgeSendPrivateRequest {
  orderId: string;
  operationId: string;
  targetJid?: string;
  senderPhone?: string;
  groupJid?: string;
  originalMessageId?: string;
  originalSenderName?: string;
  message: string;
}

export interface BridgeSendPrivateResult {
  success: boolean;
  alreadySent?: boolean;
  sentMessageId?: string;
  targetJid?: string;
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface BridgeOutreachLedgerRecord {
  operationId: string;
  orderId: string;
  targetJid: string;
  sentMessageId: string;
  messagePreview: string;
  sentAt: string;
}

export type SupervisorToWorkerMessage =
  | {
      type: 'INIT_AND_START';
      userId: string;
      sessionDir: string;
      masterSecret: string;
      phoneNumber?: string;
      requestPairingCode: boolean;
    }
  | {
      type: 'RECONNECT';
      phoneNumber?: string;
    }
  | {
      type: 'DISCONNECT';
      logout: boolean;
    }
  | {
      type: 'SEND_PRIVATE_MESSAGE';
      requestId: string;
      payload: BridgeSendPrivateRequest;
    }
  | {
      type: 'PING';
    };

export type WorkerToSupervisorMessage =
  | {
      type: 'WORKER_READY';
      userId: string;
    }
  | {
      type: 'STATE_UPDATE';
      userId: string;
      state: WhatsAppBridgeConnectionState;
      pairingCode?: string | null;
      pairingCodeExpiresAt?: string | null;
      connectedJid?: string | null;
      errorCode?: string | null;
      errorMessage?: string | null;
      reconnectAttempts?: number;
    }
  | {
      type: 'GROUP_MESSAGE';
      userId: string;
      payload: BridgeGroupMessageEvent;
    }
  | {
      type: 'PRIVATE_REPLY';
      userId: string;
      payload: BridgePrivateReplyEvent;
    }
  | {
      type: 'SEND_RESULT';
      userId: string;
      requestId: string;
      result: BridgeSendPrivateResult;
    }
  | {
      type: 'SESSION_EXPIRED';
      userId: string;
      reason: string;
    }
  | {
      type: 'PONG';
      userId: string;
    };
