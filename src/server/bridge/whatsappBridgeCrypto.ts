import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ENVELOPE_PREFIX = 'ORD_BRIDGE_AESGCM_V1:';
const KEY_DERIVATION_SALT = 'orderi-whatsapp-bridge-session-vault-v1';

/**
 * Resolves the master server-side encryption secret for WhatsApp Bridge sessions.
 * Never exposed to React client, Android APK, or GitHub repository.
 */
export function resolveBridgeMasterSecret(stateDir: string): string {
  const envSecret = (
    process.env.WHATSAPP_BRIDGE_SECRET ||
    process.env.BRIDGE_SESSION_SECRET ||
    ''
  ).trim();
  if (envSecret.length >= 16) {
    return envSecret;
  }

  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const keyFilePath = path.join(stateDir, '.bridge-master.key');
  try {
    if (fs.existsSync(keyFilePath)) {
      const existing = fs.readFileSync(keyFilePath, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
  } catch {
    // Regenerate cleanly if unreadable
  }

  const generated = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(keyFilePath, generated, { encoding: 'utf-8', mode: 0o600 });
  } catch {
    // Fall back to in-memory secret if filesystem is read-only
  }
  return generated;
}

function deriveAesKey(masterSecret: string, context = 'auth-state'): Buffer {
  return crypto.scryptSync(masterSecret, `${KEY_DERIVATION_SALT}:${context}`, 32);
}

export function encryptBridgePayload(plaintext: string, masterSecret: string, context = 'auth-state'): string {
  if (!masterSecret || masterSecret.length < 8) {
    throw new Error('Bridge master secret is required for AES-256-GCM encryption');
  }
  const key = deriveAesKey(masterSecret, context);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENVELOPE_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptBridgePayload(envelope: string, masterSecret: string, context = 'auth-state'): string {
  if (!envelope || !envelope.startsWith(ENVELOPE_PREFIX)) {
    throw new Error('Invalid encrypted WhatsApp Bridge envelope format');
  }
  const body = envelope.slice(ENVELOPE_PREFIX.length);
  const parts = body.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted WhatsApp Bridge envelope');
  }
  const [ivB64, tagB64, cipherB64] = parts;
  const key = deriveAesKey(masterSecret, context);
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(cipherB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

export function deriveUserSessionFolder(baseDir: string, userId: string): string {
  const cleanUser = (userId || '').trim();
  if (!cleanUser) {
    throw new Error('userId is required to isolate WhatsApp Bridge session');
  }
  const hashed = crypto.createHash('sha256').update(`orderi-user:${cleanUser}`).digest('hex').slice(0, 32);
  return path.join(baseDir, 'sessions', hashed);
}

export function signBridgeToken(userId: string, secret: string, ttlMs = 30 * 24 * 3600 * 1000): string {
  const payload = {
    uid: userId,
    exp: Date.now() + ttlMs,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyBridgeToken(token: string, secret: string): { valid: boolean; userId?: string; reason?: string } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, reason: 'missing_or_malformed_token' };
  }
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) {
    return { valid: false, reason: 'invalid_token_parts' };
  }
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'invalid_token_signature' };
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed?.uid || typeof parsed.uid !== 'string') {
      return { valid: false, reason: 'missing_uid' };
    }
    if (typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return { valid: false, reason: 'expired_token' };
    }
    return { valid: true, userId: parsed.uid };
  } catch {
    return { valid: false, reason: 'corrupt_token_payload' };
  }
}

export function sanitizeForLog(input: unknown): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input ?? '');
  return str
    .replace(/ORD_BRIDGE_AESGCM_V1:[^\s"']+/g, '[REDACTED_ENCRYPTED_STATE]')
    .replace(/(Bearer\s+)[A-Za-z0-9\-_.]+/gi, '$1[REDACTED_TOKEN]')
    .replace(/"(noiseKey|signedIdentityKey|signedPreKey|advSecretKey|pairingEphemeralKeyPair|me|creds)"\s*:\s*\{[^}]*\}/gi, '"$1":"[REDACTED]"');
}
