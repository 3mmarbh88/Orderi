/**
 * Advertiser Vault - ذاكرة ذكية دائمة لأصحاب الإعلانات في واتساب
 * تتيح حفظ والتعرف التلقائي على أرقام هواتف المعلنين حتى لو لم تظهر في نص الإعلان
 */

const VAULT_STORAGE_KEY = 'orderi_advertiser_phone_vault';

export function normalizeAdvertiserName(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  while (s.startsWith('~') || s.startsWith('@') || s.startsWith('+')) {
    s = s.substring(1).trim();
  }
  while (s.endsWith(':') || s.endsWith('؛') || s.endsWith(',')) {
    s = s.substring(0, s.length - 1).trim();
  }
  return s.toLowerCase().replace(/\s+/g, ' ');
}

export const cleanAdvertiserKey = normalizeAdvertiserName;

export function getAllSavedAdvertisers(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getAdvertiserSavedPhone(senderName: string): string | null {
  if (!senderName) return null;
  const key = normalizeAdvertiserName(senderName);
  if (!key) return null;
  const vault = getAllSavedAdvertisers();
  return vault[key] || null;
}

export function saveAdvertiserPhone(senderName: string, phone: string): void {
  if (!senderName || !phone) return;
  const key = normalizeAdvertiserName(senderName);
  if (!key) return;
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 8) return;
  if (cleanPhone.length === 8 && /^[1367]/.test(cleanPhone)) {
    cleanPhone = '973' + cleanPhone;
  }

  if (typeof localStorage === 'undefined') return;
  try {
    const vault = getAllSavedAdvertisers();
    vault[key] = cleanPhone;
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    // Trigger custom event so UI updates immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orderi-advertiser-vault-updated', {
        detail: { senderName, key, phone: cleanPhone }
      }));
    }
  } catch (err) {
    console.warn('[AdvertiserVault] Save error:', err);
  }
}

export function removeSavedAdvertiser(senderName: string): void {
  if (!senderName || typeof localStorage === 'undefined') return;
  const key = normalizeAdvertiserName(senderName);
  if (!key) return;
  try {
    const vault = getAllSavedAdvertisers();
    delete vault[key];
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
  } catch {}
}
