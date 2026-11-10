export type WhatsAppConnectionStatus = 'disconnected' | 'pending' | 'connected';

export interface WhatsAppConnection {
  phoneNumber: string;
  deviceId: string;
  status: WhatsAppConnectionStatus;
  connectedAt: string | null;
  lastSeenAt: string | null;
  groups: string[];
  verificationSource?: 'notification' | null;
}

const STORAGE_KEY = 'orderi_whatsapp_connection_v2';
const DEVICE_KEY = 'orderi_device_id_v2';

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return `orderi-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = createId();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return 'orderi-device';
  }
}

export function normalizeWhatsAppPhone(value: string): string {
  const digits = (value || '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return digits;
  return `+973${digits.replace(/^973/, '')}`;
}

export function getWhatsAppConnection(): WhatsAppConnection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;

    // Legacy migration: any legacy 'connected' state that lacks explicit
    // notification proof must be downgraded to 'pending' with cleared timestamps.
    const isLegacyUnverified = value.status === 'connected' && value.verificationSource !== 'notification';
    const status: WhatsAppConnectionStatus = isLegacyUnverified ? 'pending' : (value.status || 'disconnected');
    const connectedAt = isLegacyUnverified ? null : (value.connectedAt || null);
    const verificationSource = isLegacyUnverified ? null : (value.verificationSource || null);

    return {
      phoneNumber: String(value.phoneNumber || ''),
      deviceId: String(value.deviceId || getDeviceId()),
      status,
      connectedAt,
      lastSeenAt: value.lastSeenAt || null,
      groups: Array.isArray(value.groups) ? value.groups.filter(Boolean) : [],
      verificationSource,
    };
  } catch {
    return null;
  }
}

function save(connection: WhatsAppConnection): WhatsAppConnection {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
    localStorage.setItem(DEVICE_KEY, connection.deviceId);
  } catch {}
  return connection;
}

export function registerWhatsAppNumber(phoneNumber: string): WhatsAppConnection {
  const phone = normalizeWhatsAppPhone(phoneNumber);
  const previous = getWhatsAppConnection();
  return save({
    phoneNumber: phone,
    deviceId: previous?.deviceId || getDeviceId(),
    status: 'pending',
    connectedAt: null,
    lastSeenAt: previous?.lastSeenAt || null,
    groups: previous?.groups || [],
    verificationSource: null,
  });
}

/**
 * A native notification proves that the Android listener can see WhatsApp
 * notifications on this device. It does NOT authenticate to WhatsApp or
 * read WhatsApp's private database.
 */
export function markWhatsAppVerified(groupName?: string): WhatsAppConnection {
  const previous = getWhatsAppConnection();
  const now = new Date().toISOString();
  const group = (groupName || '').trim();
  const groups = [...(previous?.groups || [])];
  if (group && group !== 'محادثة خاصة 👤' && !group.includes('محادثة خاصة') && !groups.includes(group)) {
    groups.push(group);
  }
  return save({
    phoneNumber: previous?.phoneNumber || '',
    deviceId: previous?.deviceId || getDeviceId(),
    status: 'connected',
    connectedAt: previous?.connectedAt || now,
    lastSeenAt: now,
    groups,
    verificationSource: 'notification',
  });
}

export function addWhatsAppGroup(groupName: string): WhatsAppConnection | null {
  const group = (groupName || '').trim();
  if (!group) return getWhatsAppConnection();
  const previous = getWhatsAppConnection();
  if (!previous) return null;
  const groups = previous.groups.includes(group) ? previous.groups : [...previous.groups, group];
  return save({ ...previous, groups });
}

export function setWhatsAppConnectionStatus(status: WhatsAppConnectionStatus): WhatsAppConnection | null {
  const previous = getWhatsAppConnection();
  if (!previous) return null;
  return save({ ...previous, status });
}

export function disconnectWhatsApp(): WhatsAppConnection | null {
  const previous = getWhatsAppConnection();
  if (!previous) return null;
  return save({
    ...previous,
    status: 'disconnected',
    connectedAt: null,
    verificationSource: null,
  });
}

/**
 * Automatically syncs WhatsApp reader phone number with captain's registered account phone.
 * Preserves the actual connection status; does NOT fake 'connected'.
 */
export function syncWhatsAppPhoneWithAccount(accountPhone: string): WhatsAppConnection {
  const phone = normalizeWhatsAppPhone(accountPhone);
  const previous = getWhatsAppConnection();
  const phoneChanged = Boolean(previous?.phoneNumber && previous.phoneNumber !== phone);
  return save({
    phoneNumber: phone,
    deviceId: previous?.deviceId || getDeviceId(),
    status: phoneChanged ? 'pending' : (previous?.status || 'pending'),
    connectedAt: phoneChanged ? null : (previous?.connectedAt || null),
    lastSeenAt: phoneChanged ? null : (previous?.lastSeenAt || null),
    groups: phoneChanged ? [] : (previous?.groups || []),
    verificationSource: phoneChanged ? null : (previous?.verificationSource || null),
  });
}

/**
 * Automatically link and adopt all detected groups from phone notifications into the user's account
 */
export function autoAdoptDetectedGroups(incomingGroups: string[]): WhatsAppConnection {
  const previous = getWhatsAppConnection();
  const existingGroups = new Set(previous?.groups || []);
  for (const g of incomingGroups) {
    const trimmed = (g || '').trim();
    if (trimmed && trimmed !== 'محادثة خاصة 👤' && !trimmed.includes('محادثة خاصة')) {
      existingGroups.add(trimmed);
    }
  }
  const mergedGroups = Array.from(existingGroups);
  return save({
    phoneNumber: previous?.phoneNumber || '',
    deviceId: previous?.deviceId || getDeviceId(),
    status: previous?.status || 'pending',
    connectedAt: previous?.connectedAt || null,
    lastSeenAt: previous?.lastSeenAt || null,
    groups: mergedGroups,
  });
}

export function clearWhatsAppConnection(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
