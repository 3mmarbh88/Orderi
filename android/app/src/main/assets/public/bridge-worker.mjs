// src/server/bridge/bridgeWorkerEntry.ts
import makeWASocket, {
  Browsers,
  BufferJSON,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  proto
} from "@whiskeysockets/baileys";

// src/server/bridge/encryptedAuthState.ts
import fs from "fs/promises";
import path from "path";

// src/server/bridge/whatsappBridgeCrypto.ts
import crypto from "crypto";
var ENVELOPE_PREFIX = "ORD_BRIDGE_AESGCM_V1:";
var KEY_DERIVATION_SALT = "orderi-whatsapp-bridge-session-vault-v1";
function deriveAesKey(masterSecret, context = "auth-state") {
  return crypto.scryptSync(masterSecret, `${KEY_DERIVATION_SALT}:${context}`, 32);
}
function encryptBridgePayload(plaintext, masterSecret, context = "auth-state") {
  if (!masterSecret || masterSecret.length < 8) {
    throw new Error("Bridge master secret is required for AES-256-GCM encryption");
  }
  const key = deriveAesKey(masterSecret, context);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENVELOPE_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}
function decryptBridgePayload(envelope, masterSecret, context = "auth-state") {
  if (!envelope || !envelope.startsWith(ENVELOPE_PREFIX)) {
    throw new Error("Invalid encrypted WhatsApp Bridge envelope format");
  }
  const body = envelope.slice(ENVELOPE_PREFIX.length);
  const parts = body.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted WhatsApp Bridge envelope");
  }
  const [ivB64, tagB64, cipherB64] = parts;
  const key = deriveAesKey(masterSecret, context);
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
function sanitizeForLog(input) {
  const str = typeof input === "string" ? input : JSON.stringify(input ?? "");
  return str.replace(/ORD_BRIDGE_AESGCM_V1:[^\s"']+/g, "[REDACTED_ENCRYPTED_STATE]").replace(/(Bearer\s+)[A-Za-z0-9\-_.]+/gi, "$1[REDACTED_TOKEN]").replace(/"(noiseKey|signedIdentityKey|signedPreKey|advSecretKey|pairingEphemeralKeyPair|me|creds)"\s*:\s*\{[^}]*\}/gi, '"$1":"[REDACTED]"');
}

// src/server/bridge/encryptedAuthState.ts
var mutexQueues = /* @__PURE__ */ new Map();
function runExclusive(lockKey, task) {
  const prev = mutexQueues.get(lockKey) || Promise.resolve();
  const next = prev.then(task, task);
  const cleanup = next.finally(() => {
    if (mutexQueues.get(lockKey) === cleanup) {
      mutexQueues.delete(lockKey);
    }
  });
  mutexQueues.set(lockKey, cleanup);
  return next;
}
function fixFileName(name) {
  return `${name.replace(/\//g, "__").replace(/:/g, "-")}.enc`;
}
async function useEncryptedAuthState(sessionDir, masterSecret, adapters) {
  const authFolder = path.join(sessionDir, "auth");
  await fs.mkdir(authFolder, { recursive: true, mode: 448 });
  const writeEncryptedData = async (data, fileKey) => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    await runExclusive(filePath, async () => {
      const serialized = JSON.stringify(data, adapters.BufferJSON.replacer);
      const encrypted = encryptBridgePayload(serialized, masterSecret, "baileys-auth");
      const tmpPath = `${filePath}.${Date.now()}.tmp`;
      await fs.writeFile(tmpPath, encrypted, { encoding: "utf8", mode: 384 });
      await fs.rename(tmpPath, filePath);
    });
  };
  const readEncryptedData = async (fileKey) => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    return runExclusive(filePath, async () => {
      try {
        const envelope = await fs.readFile(filePath, { encoding: "utf8" });
        const json = decryptBridgePayload(envelope, masterSecret, "baileys-auth");
        return JSON.parse(json, adapters.BufferJSON.reviver);
      } catch {
        return null;
      }
    });
  };
  const removeEncryptedData = async (fileKey) => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    await runExclusive(filePath, async () => {
      try {
        await fs.unlink(filePath);
      } catch {
      }
    });
  };
  const clearAll = async () => {
    await runExclusive(authFolder, async () => {
      try {
        await fs.rm(authFolder, { recursive: true, force: true });
        await fs.mkdir(authFolder, { recursive: true, mode: 448 });
      } catch {
      }
    });
  };
  const creds = await readEncryptedData("creds") || adapters.initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readEncryptedData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value && adapters.fromAppStateSyncKeyObject) {
                value = adapters.fromAppStateSyncKeyObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data)) {
            const entries = data[category];
            if (!entries) continue;
            for (const id of Object.keys(entries)) {
              const value = entries[id];
              const fileKey = `${category}-${id}`;
              tasks.push(value ? writeEncryptedData(value, fileKey) : removeEncryptedData(fileKey));
            }
          }
          await Promise.all(tasks);
        },
        clear: async () => {
          await clearAll();
        }
      }
    },
    saveCreds: async () => {
      await writeEncryptedData(creds, "creds");
    },
    clearAll
  };
}

// src/server/bridge/baileysMessageMapper.ts
function extractPhoneFromJid(jid) {
  if (!jid || typeof jid !== "string") return "";
  if (jid.endsWith("@lid") || jid.endsWith("@g.us") || jid.endsWith("@broadcast") || jid.endsWith("@newsletter")) {
    return "";
  }
  const userPart = jid.split("@")[0]?.split(":")[0] || "";
  const digits = userPart.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return digits;
}
function normalizePrivateUserJid(jid) {
  if (!jid || typeof jid !== "string") return "";
  const trimmed = jid.trim();
  if (!trimmed) return "";
  const [userPart, domain] = trimmed.split("@");
  if (!userPart || !domain) return trimmed;
  const cleanUser = userPart.split(":")[0];
  return `${cleanUser}@${domain}`;
}
function isGroupJid(jid) {
  return Boolean(jid && typeof jid === "string" && jid.endsWith("@g.us"));
}
function unwrapBaileysMessageContent(message) {
  if (!message || typeof message !== "object") return null;
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
function extractQuotedTextFromContext(quotedMessage) {
  const unwrapped = unwrapBaileysMessageContent(quotedMessage);
  if (!unwrapped) return "";
  if (typeof unwrapped.conversation === "string") return unwrapped.conversation.trim();
  if (typeof unwrapped.extendedTextMessage?.text === "string") return unwrapped.extendedTextMessage.text.trim();
  if (typeof unwrapped.imageMessage?.caption === "string") return unwrapped.imageMessage.caption.trim();
  if (typeof unwrapped.videoMessage?.caption === "string") return unwrapped.videoMessage.caption.trim();
  if (typeof unwrapped.documentMessage?.caption === "string") return unwrapped.documentMessage.caption.trim();
  return "";
}
function extractMessageDetails(rawMessage) {
  const unwrapped = unwrapBaileysMessageContent(rawMessage);
  if (!unwrapped) {
    return { rawText: "", messageType: "other", isSticker: false, isImage: false };
  }
  let contextInfo = null;
  let rawText = "";
  let messageType = "other";
  let isSticker = false;
  let isImage = false;
  if (typeof unwrapped.conversation === "string" && unwrapped.conversation.trim()) {
    rawText = unwrapped.conversation.trim();
    messageType = "text";
  } else if (unwrapped.extendedTextMessage) {
    contextInfo = unwrapped.extendedTextMessage.contextInfo;
    rawText = (unwrapped.extendedTextMessage.text || "").trim();
    messageType = contextInfo?.stanzaId ? "reply" : "text";
  } else if (unwrapped.imageMessage) {
    isImage = true;
    contextInfo = unwrapped.imageMessage.contextInfo;
    rawText = (unwrapped.imageMessage.caption || "").trim();
    messageType = "image";
  } else if (unwrapped.stickerMessage) {
    isSticker = true;
    contextInfo = unwrapped.stickerMessage.contextInfo;
    rawText = "[sticker]";
    messageType = "sticker";
  } else if (unwrapped.videoMessage) {
    contextInfo = unwrapped.videoMessage.contextInfo;
    rawText = (unwrapped.videoMessage.caption || "").trim();
    messageType = "video_caption";
  } else if (unwrapped.documentMessage) {
    contextInfo = unwrapped.documentMessage.contextInfo;
    rawText = (unwrapped.documentMessage.caption || "").trim();
    messageType = "document_caption";
  }
  const quotedStanzaId = contextInfo?.stanzaId ? String(contextInfo.stanzaId) : void 0;
  const quotedParticipant = contextInfo?.participant ? normalizePrivateUserJid(String(contextInfo.participant)) : void 0;
  const quotedText = contextInfo?.quotedMessage ? extractQuotedTextFromContext(contextInfo.quotedMessage) : void 0;
  if (quotedStanzaId && messageType === "text") {
    messageType = "reply";
  }
  return {
    rawText,
    messageType,
    isSticker,
    isImage,
    quotedStanzaId,
    quotedParticipant,
    quotedText
  };
}
function resolveTimestampMs(messageTimestamp) {
  if (typeof messageTimestamp === "number" && Number.isFinite(messageTimestamp)) {
    return messageTimestamp > 1e12 ? messageTimestamp : messageTimestamp * 1e3;
  }
  if (messageTimestamp && typeof messageTimestamp === "object" && "low" in messageTimestamp) {
    const low = Number(messageTimestamp.low || 0);
    if (low > 0) return low * 1e3;
  }
  const parsed = Number(messageTimestamp);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed > 1e12 ? parsed : parsed * 1e3;
  }
  return Date.now();
}
function mapBaileysMessage(params) {
  const { userId, msg, groupName, resolvedPnJid } = params;
  if (!msg || !msg.key || !msg.message) {
    return { kind: "ignored", reason: "empty_message" };
  }
  const remoteJid = String(msg.key.remoteJid || "").trim();
  const messageId = String(msg.key.id || "").trim();
  if (!remoteJid || !messageId) {
    return { kind: "ignored", reason: "missing_key" };
  }
  if (remoteJid === "status@broadcast" || remoteJid.endsWith("@broadcast") || remoteJid.endsWith("@newsletter")) {
    return { kind: "ignored", reason: "status_or_newsletter" };
  }
  const details = extractMessageDetails(msg.message);
  if (!details.rawText && !details.isSticker) {
    return { kind: "ignored", reason: "no_extractable_text_or_sticker" };
  }
  const timestamp = resolveTimestampMs(msg.messageTimestamp);
  const receivedAtIso = new Date(timestamp).toISOString();
  const isFromMe = msg.key.fromMe === true;
  if (!isGroupJid(remoteJid)) {
    const altJid = msg.key.remoteJidAlt ? normalizePrivateUserJid(String(msg.key.remoteJidAlt)) : "";
    const pnCandidate = (resolvedPnJid && resolvedPnJid.endsWith("@s.whatsapp.net") ? normalizePrivateUserJid(resolvedPnJid) : "") || (altJid.endsWith("@s.whatsapp.net") ? altJid : "") || normalizePrivateUserJid(remoteJid);
    const senderPhone2 = extractPhoneFromJid(pnCandidate);
    if (isFromMe) {
      return { kind: "ignored", reason: "own_private_outbound" };
    }
    return {
      kind: "private_reply",
      privateEvent: {
        eventId: `wa-priv-${messageId}`,
        userId,
        messageId,
        senderJid: pnCandidate,
        senderPhone: senderPhone2,
        senderName: String(msg.pushName || "").trim() || "\u0645\u0639\u0644\u0646 \u0648\u0627\u062A\u0633\u0627\u0628",
        rawText: details.rawText,
        timestamp,
        receivedAtIso,
        isFromMe: false,
        isPrivateChat: true,
        ignoredForOrderExtraction: true
      }
    };
  }
  const rawParticipant = String(msg.key.participant || msg.participant || "").trim();
  const altParticipant = msg.key.participantAlt ? String(msg.key.participantAlt).trim() : "";
  const candidatePn = (resolvedPnJid && resolvedPnJid.endsWith("@s.whatsapp.net") ? normalizePrivateUserJid(resolvedPnJid) : "") || (altParticipant.endsWith("@s.whatsapp.net") ? normalizePrivateUserJid(altParticipant) : "") || (rawParticipant.endsWith("@s.whatsapp.net") ? normalizePrivateUserJid(rawParticipant) : "");
  const canonicalSenderJid = candidatePn || normalizePrivateUserJid(rawParticipant) || normalizePrivateUserJid(altParticipant);
  const senderPhone = extractPhoneFromJid(candidatePn);
  const senderName = String(msg.pushName || "").trim() || (senderPhone ? `+${senderPhone}` : "\u0645\u0639\u0644\u0646 \u0628\u0627\u0644\u0642\u0631\u0648\u0628");
  return {
    kind: "group_message",
    groupEvent: {
      eventId: `wa-grp-${remoteJid}-${messageId}`,
      userId,
      messageId,
      groupJid: remoteJid,
      groupName: (groupName || "").trim() || remoteJid,
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
      ignoredForOrderExtraction: false
    }
  };
}
var BridgeMessageDeduper = class {
  constructor(maxSize = 2e3, initialKeys = []) {
    this.seen = /* @__PURE__ */ new Set();
    this.queue = [];
    this.maxSize = maxSize;
    for (const key of initialKeys) {
      this.markSeen(key);
    }
  }
  hasSeen(key) {
    return this.seen.has(key);
  }
  markSeen(key) {
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
  exportKeys() {
    return [...this.queue];
  }
};

// src/server/bridge/bridgeWorkerEntry.ts
function createSilentLogger() {
  const noop = () => {
  };
  const logger = {
    level: "silent",
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    child: () => logger
  };
  return logger;
}
var silentLogger = createSilentLogger();
var activeUserId = "";
var activeSessionDir = "";
var activeMasterSecret = "";
var activePhoneNumber = "";
var wantsPairingCode = false;
var pairingCodeRequestedForSocket = false;
var manualDisconnectRequested = false;
var currentState = "Disconnected";
var activeSocket = null;
var authController = null;
var reconnectTimer = null;
var reconnectAttempts = 0;
var socketGeneration = 0;
var groupNameCache = /* @__PURE__ */ new Map();
var messageDeduper = new BridgeMessageDeduper(2500);
function emitToSupervisor(msg) {
  if (typeof process.send === "function") {
    process.send(msg);
  }
}
function emitState(state, extras) {
  currentState = state;
  emitToSupervisor({
    type: "STATE_UPDATE",
    userId: activeUserId,
    state,
    ...extras
  });
}
function sanitizePhoneForPairing(rawPhone) {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 8 && /^[1367]/.test(digits)) {
    return `973${digits}`;
  }
  return digits;
}
function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
async function teardownSocket() {
  socketGeneration++;
  clearReconnectTimer();
  const sock = activeSocket;
  activeSocket = null;
  if (sock) {
    try {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
      sock.ev.removeAllListeners("messages.upsert");
      sock.ev.removeAllListeners("groups.update");
      sock.end(void 0);
    } catch {
    }
  }
}
async function resolveGroupName(sock, groupJid) {
  const cached = groupNameCache.get(groupJid);
  if (cached) return cached;
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const subject = (metadata?.subject || "").trim();
    if (subject) {
      groupNameCache.set(groupJid, subject);
      return subject;
    }
  } catch {
  }
  return groupJid;
}
async function requestPairingCodeSafely(sock, generation) {
  if (pairingCodeRequestedForSocket || generation !== socketGeneration) return;
  const cleanPhone = sanitizePhoneForPairing(activePhoneNumber);
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    emitState("Error", {
      errorCode: "INVALID_PHONE_NUMBER",
      errorMessage: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0644\u0644\u0631\u0628\u0637\u061B \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0648\u0627\u062A\u0633\u0627\u0628 \u0643\u0627\u0645\u0644 \u0628\u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u062F\u0648\u0644\u064A (\u0645\u062B\u0627\u0644: 97339123456)."
    });
    return;
  }
  pairingCodeRequestedForSocket = true;
  try {
    const code = await sock.requestPairingCode(cleanPhone);
    if (generation !== socketGeneration) return;
    const formatted = code && code.length === 8 && !code.includes("-") ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
    emitState("Waiting for Pairing", {
      pairingCode: formatted || code,
      pairingCodeExpiresAt: new Date(Date.now() + 18e4).toISOString(),
      errorCode: null,
      errorMessage: null
    });
  } catch (err) {
    if (generation !== socketGeneration) return;
    pairingCodeRequestedForSocket = false;
    emitState("Error", {
      errorCode: "PAIRING_CODE_FAILED",
      errorMessage: `\u062A\u0639\u0630\u0631 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0631\u0645\u0632 \u0627\u0644\u0631\u0628\u0637 \u0645\u0646 \u0648\u0627\u062A\u0633\u0627\u0628: ${sanitizeForLog(err?.message || "\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639")}`
    });
  }
}
async function startSocketConnection() {
  await teardownSocket();
  const generation = ++socketGeneration;
  manualDisconnectRequested = false;
  pairingCodeRequestedForSocket = false;
  emitState(reconnectAttempts > 0 ? "Reconnecting" : "Connecting", {
    reconnectAttempts,
    errorCode: null,
    errorMessage: null
  });
  try {
    if (!authController) {
      authController = await useEncryptedAuthState(activeSessionDir, activeMasterSecret, {
        initAuthCreds,
        BufferJSON,
        fromAppStateSyncKeyObject: (val) => proto.Message.AppStateSyncKeyData.fromObject(val)
      });
    }
    let version;
    try {
      const latest = await fetchLatestBaileysVersion();
      if (Array.isArray(latest?.version) && latest.version.length === 3) {
        version = latest.version;
      }
    } catch {
    }
    if (generation !== socketGeneration) return;
    const sock = makeWASocket({
      version,
      auth: {
        creds: authController.state.creds,
        keys: makeCacheableSignalKeyStore(authController.state.keys, silentLogger)
      },
      logger: silentLogger,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Orderi"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 3e4,
      defaultQueryTimeoutMs: 25e3,
      keepAliveIntervalMs: 25e3
    });
    activeSocket = sock;
    sock.ev.on("creds.update", async () => {
      if (authController) {
        await authController.saveCreds().catch(() => {
        });
      }
    });
    sock.ev.on("groups.update", (updates) => {
      for (const update of updates) {
        if (update?.id && update?.subject) {
          groupNameCache.set(update.id, update.subject.trim());
        }
      }
    });
    sock.ev.on("connection.update", async (update) => {
      if (generation !== socketGeneration) return;
      const { connection, lastDisconnect, qr } = update;
      if (qr && wantsPairingCode && !sock.authState.creds.registered && !pairingCodeRequestedForSocket) {
        await requestPairingCodeSafely(sock, generation);
      }
      if (connection === "connecting") {
        if (currentState !== "Waiting for Pairing") {
          emitState(reconnectAttempts > 0 ? "Reconnecting" : "Connecting", { reconnectAttempts });
        }
        if (wantsPairingCode && !sock.authState.creds.registered && !pairingCodeRequestedForSocket) {
          setTimeout(() => {
            if (generation === socketGeneration && !pairingCodeRequestedForSocket && !sock.authState.creds.registered) {
              void requestPairingCodeSafely(sock, generation);
            }
          }, 1200);
        }
      }
      if (connection === "open") {
        reconnectAttempts = 0;
        wantsPairingCode = false;
        pairingCodeRequestedForSocket = false;
        const connectedJid = normalizePrivateUserJid(sock.user?.id || "");
        emitState("Connected", {
          pairingCode: null,
          pairingCodeExpiresAt: null,
          connectedJid,
          reconnectAttempts: 0,
          errorCode: null,
          errorMessage: null
        });
      }
      if (connection === "close") {
        if (manualDisconnectRequested) {
          emitState("Disconnected", {
            pairingCode: null,
            pairingCodeExpiresAt: null,
            errorCode: null,
            errorMessage: null
          });
          return;
        }
        const err = lastDisconnect?.error;
        const statusCode = err?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === DisconnectReason.badSession;
        const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;
        if (isLoggedOut) {
          wantsPairingCode = false;
          if (authController) {
            await authController.clearAll().catch(() => {
            });
            authController = null;
          }
          emitToSupervisor({
            type: "SESSION_EXPIRED",
            userId: activeUserId,
            reason: "\u062A\u0645 \u0641\u0635\u0644 \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u0645\u0631\u062A\u0628\u0637 \u0645\u0646 WhatsApp Messenger \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0629 (401)."
          });
          emitState("Session Expired", {
            pairingCode: null,
            pairingCodeExpiresAt: null,
            errorCode: "SESSION_EXPIRED",
            errorMessage: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u062C\u0644\u0633\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u2014 \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0631\u0628\u0637 \u0628\u0631\u0645\u0632 Pairing Code \u062C\u062F\u064A\u062F."
          });
          return;
        }
        if (isReplaced) {
          emitState("Error", {
            errorCode: "CONNECTION_REPLACED",
            errorMessage: "\u062A\u0645 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u062C\u0633\u0631 \u0628\u062C\u0644\u0633\u0629 \u0623\u062E\u0631\u0649 \u0644\u0646\u0641\u0633 \u0627\u0644\u062D\u0633\u0627\u0628\u061B \u0623\u0639\u062F \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629."
          });
          return;
        }
        reconnectAttempts += 1;
        const delayMs = Math.min(3e4, 2e3 * Math.pow(2, Math.min(reconnectAttempts - 1, 4)));
        emitState("Reconnecting", {
          reconnectAttempts,
          errorCode: statusCode ? `WA_${statusCode}` : "NETWORK_RECONNECTING",
          errorMessage: `\u0627\u0646\u0642\u0637\u0639 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0645\u0624\u0642\u062A\u0627\u064B \u2014 \u062C\u0627\u0631\u064A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B (${reconnectAttempts})...`
        });
        clearReconnectTimer();
        reconnectTimer = setTimeout(() => {
          if (!manualDisconnectRequested) {
            void startSocketConnection();
          }
        }, delayMs);
      }
    });
    sock.ev.on("messages.upsert", async (upsert) => {
      if (generation !== socketGeneration) return;
      if (upsert.type !== "notify") return;
      for (const msg of upsert.messages) {
        try {
          const remoteJid = String(msg?.key?.remoteJid || "");
          const messageId = String(msg?.key?.id || "");
          if (!remoteJid || !messageId) continue;
          const dedupeKey = `${remoteJid}::${messageId}`;
          if (messageDeduper.hasSeen(dedupeKey)) continue;
          messageDeduper.markSeen(dedupeKey);
          let groupName;
          if (isGroupJid(remoteJid)) {
            groupName = await resolveGroupName(sock, remoteJid);
          }
          let resolvedPnJid;
          const candidateLid = isGroupJid(remoteJid) ? String(msg?.key?.participant || msg?.participant || "") : remoteJid;
          if (candidateLid.endsWith("@lid") && sock.signalRepository?.lidMapping) {
            try {
              const pn = await sock.signalRepository.lidMapping.getPNForLID(candidateLid);
              if (pn) resolvedPnJid = pn;
            } catch {
            }
          }
          const mapped = mapBaileysMessage({
            userId: activeUserId,
            msg,
            groupName,
            resolvedPnJid
          });
          if (mapped.kind === "group_message" && mapped.groupEvent) {
            emitToSupervisor({
              type: "GROUP_MESSAGE",
              userId: activeUserId,
              payload: mapped.groupEvent
            });
          } else if (mapped.kind === "private_reply" && mapped.privateEvent) {
            emitToSupervisor({
              type: "PRIVATE_REPLY",
              userId: activeUserId,
              payload: mapped.privateEvent
            });
          }
        } catch (err) {
          emitToSupervisor({
            type: "STATE_UPDATE",
            userId: activeUserId,
            state: currentState,
            errorCode: "MESSAGE_PARSE_WARNING",
            errorMessage: sanitizeForLog(err?.message || "Message handling warning")
          });
        }
      }
    });
  } catch (err) {
    if (generation !== socketGeneration) return;
    emitState("Error", {
      errorCode: "BRIDGE_INIT_FAILED",
      errorMessage: `\u062A\u0639\u0630\u0631 \u062A\u0647\u064A\u0626\u0629 WhatsApp Web Bridge: ${sanitizeForLog(err?.message || "\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639")}`
    });
  }
}
async function resolveVerifiedTargetJid(sock, payload) {
  const candidateJid = normalizePrivateUserJid(payload.targetJid);
  if (candidateJid) {
    if (candidateJid.endsWith("@s.whatsapp.net")) {
      return { jid: candidateJid };
    }
    if (candidateJid.endsWith("@lid")) {
      try {
        const mappedPn = await sock.signalRepository?.lidMapping?.getPNForLID(candidateJid);
        if (mappedPn && mappedPn.endsWith("@s.whatsapp.net")) {
          return { jid: normalizePrivateUserJid(mappedPn) };
        }
      } catch {
      }
      return { jid: candidateJid };
    }
  }
  const rawPhone = (payload.senderPhone || "").replace(/\D/g, "");
  if (rawPhone.length >= 8) {
    const normalizedPhone = rawPhone.length === 8 && /^[1367]/.test(rawPhone) ? `973${rawPhone}` : rawPhone;
    const pnJid = `${normalizedPhone}@s.whatsapp.net`;
    try {
      const check = await sock.onWhatsApp(normalizedPhone);
      if (Array.isArray(check) && check.length > 0 && check[0]?.exists && check[0]?.jid) {
        return { jid: normalizePrivateUserJid(check[0].jid) };
      }
    } catch {
    }
    return { jid: pnJid };
  }
  return {
    errorCode: "IDENTITY_NOT_VERIFIED",
    errorMessage: "\u0644\u0627 \u064A\u062A\u0648\u0641\u0631 \u0645\u0639\u0631\u0641 \u062D\u0642\u064A\u0642\u064A (JID) \u0623\u0648 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0645\u0648\u062B\u0642 \u0644\u0644\u0645\u0639\u0644\u0646 \u0641\u064A \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629\u061B \u0644\u0646 \u064A\u062A\u0645 \u0627\u0644\u062A\u062E\u0645\u064A\u0646 \u0623\u0648 \u0627\u0644\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0645\u0646\u0639\u0627\u064B \u0644\u0645\u0631\u0627\u0633\u0644\u0629 \u0634\u062E\u0635 \u062E\u0637\u0623."
  };
}
async function handleSendPrivateMessage(requestId, payload) {
  const sock = activeSocket;
  if (!sock || currentState !== "Connected") {
    return {
      success: false,
      errorCode: "BRIDGE_NOT_CONNECTED",
      errorMessage: "WhatsApp Bridge \u063A\u064A\u0631 \u0645\u062A\u0635\u0644 \u062D\u0627\u0644\u064A\u0627\u064B \u0628\u0627\u0644\u062E\u0627\u062F\u0645 \u2014 \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062D\u0627\u0644\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const resolved = await resolveVerifiedTargetJid(sock, payload);
  if (!resolved.jid) {
    return {
      success: false,
      errorCode: resolved.errorCode || "IDENTITY_NOT_VERIFIED",
      errorMessage: resolved.errorMessage || "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0647\u0648\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0644\u0645.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const cleanMessage = (payload.message || "").trim();
  if (!cleanMessage) {
    return {
      success: false,
      errorCode: "EMPTY_MESSAGE",
      errorMessage: "\u0646\u0635 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0642\u0628\u0648\u0644 \u0641\u0627\u0631\u063A.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  try {
    const sent = await sock.sendMessage(resolved.jid, { text: cleanMessage });
    const sentMessageId = sent?.key?.id || "";
    if (!sentMessageId) {
      return {
        success: false,
        targetJid: resolved.jid,
        errorCode: "SEND_ACK_MISSING",
        errorMessage: "\u0644\u0645 \u064A\u0624\u0643\u062F \u062E\u0627\u062F\u0645 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062E\u0627\u0635\u0629\u061B \u0628\u0642\u064A \u0627\u0644\u0637\u0644\u0628 \u0628\u062F\u0648\u0646 \u062A\u0633\u062C\u064A\u0644 \u0642\u0628\u0648\u0644.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    return {
      success: true,
      sentMessageId,
      targetJid: resolved.jid,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (err) {
    return {
      success: false,
      targetJid: resolved.jid,
      errorCode: "BRIDGE_SEND_FAILED",
      errorMessage: `\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0639\u0628\u0631 Bridge: ${sanitizeForLog(err?.message || "\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
process.on("message", async (raw) => {
  if (!raw || typeof raw !== "object") return;
  switch (raw.type) {
    case "INIT_AND_START": {
      activeUserId = raw.userId;
      activeSessionDir = raw.sessionDir;
      activeMasterSecret = raw.masterSecret;
      activePhoneNumber = raw.phoneNumber || "";
      wantsPairingCode = raw.requestPairingCode;
      reconnectAttempts = 0;
      authController = null;
      emitToSupervisor({ type: "WORKER_READY", userId: activeUserId });
      await startSocketConnection();
      break;
    }
    case "RECONNECT": {
      if (raw.phoneNumber) activePhoneNumber = raw.phoneNumber;
      wantsPairingCode = false;
      reconnectAttempts = 0;
      await startSocketConnection();
      break;
    }
    case "DISCONNECT": {
      manualDisconnectRequested = true;
      wantsPairingCode = false;
      clearReconnectTimer();
      const sock = activeSocket;
      if (raw.logout && sock) {
        await sock.logout().catch(() => {
        });
      }
      await teardownSocket();
      if (raw.logout && authController) {
        await authController.clearAll().catch(() => {
        });
        authController = null;
      }
      emitState("Disconnected", {
        pairingCode: null,
        pairingCodeExpiresAt: null,
        connectedJid: null,
        errorCode: null,
        errorMessage: null
      });
      break;
    }
    case "SEND_PRIVATE_MESSAGE": {
      const result = await handleSendPrivateMessage(raw.requestId, raw.payload);
      emitToSupervisor({
        type: "SEND_RESULT",
        userId: activeUserId,
        requestId: raw.requestId,
        result
      });
      break;
    }
    case "PING": {
      emitToSupervisor({ type: "PONG", userId: activeUserId });
      break;
    }
  }
});
process.on("uncaughtException", (err) => {
  if (activeUserId) {
    emitState("Error", {
      errorCode: "WORKER_EXCEPTION",
      errorMessage: sanitizeForLog(err?.message || "Worker exception")
    });
  }
});
process.on("unhandledRejection", (reason) => {
  if (activeUserId) {
    emitState("Error", {
      errorCode: "WORKER_REJECTION",
      errorMessage: sanitizeForLog(reason?.message || String(reason || "Worker rejection"))
    });
  }
});
//# sourceMappingURL=bridge-worker.mjs.map
