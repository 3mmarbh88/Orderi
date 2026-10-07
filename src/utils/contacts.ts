import { StoreContact } from '../types';

/**
 * Normalizes phone numbers for consistent matching in Bahrain
 * Removes spaces, dashes, leading +, 00973, or 973
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00973') && digits.length > 5) {
    return digits.slice(5);
  }
  if (digits.startsWith('973') && digits.length > 3) {
    return digits.slice(3);
  }
  return digits;
}

/**
 * Formats a phone number for clean Bahrain display
 */
export function formatBahrainPhone(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  if (norm.length === 8) {
    return `${norm.slice(0, 4)} ${norm.slice(4)}`;
  }
  return phone;
}

/**
 * Checks whether an incoming order matches a saved VIP or Blacklist contact
 */
export function checkOrderContactStatus(
  phone: string,
  senderName: string,
  contacts: StoreContact[] = []
): { status: 'vip' | 'blacklist' | 'normal'; contact?: StoreContact } {
  if (!contacts || contacts.length === 0) {
    return { status: 'normal' };
  }

  const cleanPhone = normalizePhoneNumber(phone);
  const cleanName = (senderName || '').trim().toLowerCase();

  for (const c of contacts) {
    const contactPhone = normalizePhoneNumber(c.phone);
    const contactName = (c.name || '').trim().toLowerCase();

    const phoneMatch = cleanPhone && contactPhone && (cleanPhone === contactPhone || cleanPhone.endsWith(contactPhone) || contactPhone.endsWith(cleanPhone));
    const nameMatch = cleanName && contactName && (cleanName.includes(contactName) || contactName.includes(cleanName));

    if (phoneMatch || (nameMatch && contactName.length > 3)) {
      return {
        status: c.type,
        contact: c,
      };
    }
  }

  return { status: 'normal' };
}

/**
 * Pre-seeded starter contacts for Bahrain drivers (trusted VIP stores)
 */
export const DEFAULT_CONTACTS: StoreContact[] = [
  {
    id: 'contact-vip-1',
    name: 'متجر لافندر للزهور (السيف)',
    phone: '+973 3944 1122',
    type: 'vip',
    notes: 'تحويل بنفت فوري عند الاستلام، تغليف ممتاز',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'contact-vip-2',
    name: 'حلويات المملكة (الرفاع)',
    phone: '+973 3688 9900',
    type: 'vip',
    notes: 'أجرة مرتفعة، جاهز دائماً في الموعد',
    addedAt: new Date().toISOString(),
  },
];
