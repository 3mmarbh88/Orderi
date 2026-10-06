export type WhatsAppConnectionStatus = 'disconnected' | 'pending' | 'connected';

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
  return save({
    phoneNumber: phone,
    deviceId: previous?.deviceId || getDeviceId(),
    status: 'pending',
    connectedAt: previous?.connectedAt || null,
    lastSeenAt: previous?.lastSeenAt || null,
    groups: previous?.groups || [],
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
    status: previous?.phoneNumber ? 'connected' : 'pending',
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

export function clearWhatsAppConnection(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
