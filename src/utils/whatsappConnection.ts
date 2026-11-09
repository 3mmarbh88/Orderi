export type WhatsAppConnectionStatus = 'disconnected' | 'pending' | 'connected';

// `connected` means a real WhatsApp group notification was received by Orderi.
// It never means WhatsApp Link Devices authentication or a companion-device session.

export interface WhatsAppConnection {
  phoneNumber: string;
  deviceId: string;
  status: WhatsAppConnectionStatus;
  connectedAt: string | null;
  lastSeenAt: string | null;
  groups: string[];
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
    return {
      phoneNumber: String(value.phoneNumber || ''),
      deviceId: String(value.deviceId || getDeviceId()),
      status: value.status || 'disconnected',
      connectedAt: value.connectedAt || null,
      lastSeenAt: value.lastSeenAt || null,
      groups: Array.isArray(value.groups) ? value.groups.filter(Boolean) : [],
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
  const samePhone = previous?.phoneNumber === phone;
  return save({
    phoneNumber: phone,
    deviceId: previous?.deviceId || getDeviceId(),
    status: 'pending',
    // A newly registered phone must be verified by a fresh notification.
    connectedAt: null,
    lastSeenAt: samePhone ? (previous?.lastSeenAt || null) : null,
    groups: samePhone ? (previous?.groups || []) : [],
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
  return save({ ...previous, status: 'disconnected' });
}

/**
 * Automatically syncs WhatsApp reader phone number with captain's registered account phone
 */
export function syncWhatsAppPhoneWithAccount(accountPhone: string): WhatsAppConnection {
  const phone = normalizeWhatsAppPhone(accountPhone);
  const previous = getWhatsAppConnection();
  const samePhone = previous?.phoneNumber === phone;
  return save({
    phoneNumber: phone,
    deviceId: previous?.deviceId || getDeviceId(),
    // Syncing an account phone is bookkeeping only, not listener verification.
    status: samePhone ? (previous?.status || 'pending') : 'pending',
    connectedAt: samePhone ? (previous?.connectedAt || null) : null,
    lastSeenAt: samePhone ? (previous?.lastSeenAt || null) : null,
    groups: samePhone ? (previous?.groups || []) : [],
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
    // Discovering a group name is not proof of a live WhatsApp listener.
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
