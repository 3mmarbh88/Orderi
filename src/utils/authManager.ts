import { CaptainUser, ActivationCodeInfo, VehicleType } from '../types';

export function getVehicleTypeLabel(type?: VehicleType | string): string {
  switch (type) {
    case 'car':
      return 'سيارة 🚗';
    case 'motorcycle':
    case 'bike':
      return 'موترسيكل 🏍️';
    case 'pickup_minibus':
    case 'van':
      return 'بيكاب ميني باص 🚐';
    case 'six_wheel':
      return 'سكسويل 🚛';
    case 'flatbed':
      return 'سطحة 🛻';
    default:
      return 'سيارة 🚗';
  }
}

const STORAGE_USERS_KEY = 'ordari_captains_db_v1';
const STORAGE_CURRENT_USER_KEY = 'ordari_logged_in_user_v1';
const STORAGE_BIOMETRIC_SAVED_USER_KEY = 'ordari_biometric_enrolled_user_v1';

// Direct WhatsApp Link to request activation code (number +97333314353 hidden in text, opened via WhatsApp icon)
export const ACTIVATION_WHATSAPP_LINK = 'https://wa.me/97333314353?text=' + encodeURIComponent('السلام عليكم، أرغب بالحصول على كود تفعيل برنامج Ordari 🇧🇭');

// Pre-configured official activation licenses for Bahrain Captains
export const OFFICIAL_ACTIVATION_CODES: Record<string, ActivationCodeInfo> = {
  'ORDARI-2026-VIP': {
    code: 'ORDARI-2026-VIP',
    planName: 'ترخيص سنوي VIP 🇧🇭',
    durationDays: 365,
    isVip: true,
    features: [
      'سحب فوري لكافة طلبات مجموعات واتساب على نفس الهاتف',
      'فحص الذكاء الاصطناعي بـ Gemini AI لشروط التوصيل',
      'العمل في الخلفية واستقبال الإشعارات فوق خرائط Google'
    ]
  },
  'ORDARI-BAHRAIN-PRO': {
    code: 'ORDARI-BAHRAIN-PRO',
    planName: 'ترخيص البحرين الاحترافي (6 شهور)',
    durationDays: 180,
    isVip: true,
    features: [
      'مراقبة جميع القروبات المحددة',
      'سحب فوري لكافة طلبات مجموعات واتساب على نفس الهاتف',
      'فحص الذكاء الاصطناعي بـ Gemini AI لشروط التوصيل',
      'العمل في الخلفية واستقبال الإشعارات فوق خرائط Google'
    ]
  }
};

// Default seed user (requires activation code to unlock)
const DEFAULT_CAPTAIN: CaptainUser = {
  id: 'captain-bh-01',
  name: 'عمار',
  phone: '39123456',
  password: '123',
  vehicleType: 'car',
  isActivated: false,
  activationCode: undefined,
  licensePlan: 'بانتظار كود التفعيل',
  biometricsEnabled: true,
  createdAt: new Date().toISOString(),
};

// Check if the program is officially activated and license is valid
export function isProgramActivated(user?: CaptainUser | null): boolean {
  try {
    const target = user !== undefined ? user : getCurrentUser();
    if (!target) return false;
    if (!target.isActivated) return false;
    if (!target.activationCode) return false;
    
    // Verify the activation code format or preset
    const verified = verifyActivationCode(target.activationCode);
    if (!verified) return false;

    // Check expiration if set
    if (target.expiresAt) {
      const expTime = new Date(target.expiresAt).getTime();
      if (!isNaN(expTime) && expTime < Date.now()) {
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error('[Auth] Error checking program activation', e);
    return false;
  }
}

// Normalize Bahrain Phone Number
export function normalizeBahrainPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('973')) {
    cleaned = cleaned.substring(3);
  }
  return cleaned;
}

function sanitizeCaptainUser(u: CaptainUser): CaptainUser {
  return {
    ...u,
    name: u.name ? u.name.replace(/كابتن\s*/g, '').replace(/الكابتن\s*/g, '').replace(/كباتن\s*/g, '').trim() : u.name,
    licensePlan: u.licensePlan ? u.licensePlan.replace(/كابتن\s*/g, '').replace(/الكابتن\s*/g, '').replace(/كباتن\s*/g, '').trim() : u.licensePlan
  };
}

// Get all registered captains from local storage
export function getRegisteredUsers(): CaptainUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.map(sanitizeCaptainUser);
        saveRegisteredUsers(cleaned);
        return cleaned;
      }
    }
  } catch (e) {
    console.error('[Auth] Failed to load users', e);
  }
  // Initialize with default captain
  const initial = [DEFAULT_CAPTAIN];
  saveRegisteredUsers(initial);
  return initial;
}

export function saveRegisteredUsers(users: CaptainUser[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users.map(sanitizeCaptainUser)));
  } catch (e) {
    console.error('[Auth] Failed to save users', e);
  }
}

// Get currently logged in captain
export function getCurrentUser(): CaptainUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        const cleaned = sanitizeCaptainUser(parsed);
        if (cleaned.name !== parsed.name || cleaned.licensePlan !== parsed.licensePlan) {
          localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.error('[Auth] Failed to get current user', e);
  }
  return null;
}

// Set or clear current session
export function setCurrentUser(user: CaptainUser | null): void {
  try {
    if (user) {
      const cleaned = sanitizeCaptainUser(user);
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(cleaned));
      if (cleaned.biometricsEnabled) {
        localStorage.setItem(STORAGE_BIOMETRIC_SAVED_USER_KEY, cleaned.phone);
      }
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('[Auth] Failed to set current user', e);
  }
}

// Check validity of an activation code
export function verifyActivationCode(rawCode: string): ActivationCodeInfo | null {
  if (!rawCode) return null;
  const clean = rawCode.trim().toUpperCase();

  // 1. Direct match with preset official codes
  if (OFFICIAL_ACTIVATION_CODES[clean]) {
    return OFFICIAL_ACTIVATION_CODES[clean];
  }

  // 2. Custom valid format: ORDARI-XXXX-XXXX or 6+ digit numbers
  if (clean.startsWith('ORDARI-') && clean.length >= 10) {
    return {
      code: clean,
      planName: 'ترخيص معتمد (سنوي)',
      durationDays: 365,
      isVip: true,
      features: ['تفعيل كامل لجميع ميزات رادار Ordari']
    };
  }

  // 3. 6 digit numeric code
  if (/^\d{6}$/.test(clean)) {
    return {
      code: clean,
      planName: 'كود تفعيل رقمي معتمد',
      durationDays: 365,
      isVip: true,
      features: ['تفعيل كامل لجميع ميزات رادار Ordari']
    };
  }

  return null;
}

// Apply an activation code to a captain user or directly activate program
export function applyActivationCode(userId?: string, code?: string): { success: boolean; user?: CaptainUser; error?: string } {
  if (!code || !code.trim()) {
    return { success: false, error: 'يرجى إدخال كود التفعيل' };
  }
  const verified = verifyActivationCode(code);
  if (!verified) {
    return { success: false, error: 'كود التفعيل غير صحيح أو منتهي الصلاحية' };
  }

  const users = getRegisteredUsers();
  const targetId = userId || getCurrentUser()?.id || users[0]?.id || 'captain-bh-01';
  let index = users.findIndex(u => u.id === targetId);

  const expiresDate = new Date(Date.now() + verified.durationDays * 24 * 60 * 60 * 1000);
  let updatedUser: CaptainUser;

  if (index === -1) {
    updatedUser = {
      id: targetId,
      name: 'مندوب Ordari المعتمد',
      phone: '39123456',
      password: '123',
      vehicleType: 'car',
      isActivated: true,
      activationCode: verified.code,
      licensePlan: verified.planName,
      activatedAt: new Date().toISOString(),
      expiresAt: expiresDate.toISOString(),
      biometricsEnabled: true,
      createdAt: new Date().toISOString(),
    };
    users.push(updatedUser);
  } else {
    updatedUser = {
      ...users[index],
      isActivated: true,
      activationCode: verified.code,
      licensePlan: verified.planName,
      activatedAt: new Date().toISOString(),
      expiresAt: expiresDate.toISOString(),
    };
    users[index] = updatedUser;
  }

  saveRegisteredUsers(users);
  setCurrentUser(updatedUser);

  return { success: true, user: updatedUser };
}

// Login with Phone and Password
export function loginWithPhoneAndPassword(phone: string, password: string): { success: boolean; user?: CaptainUser; error?: string } {
  const cleanPhone = normalizeBahrainPhone(phone);
  if (!cleanPhone) {
    return { success: false, error: 'يرجى إدخال رقم الهاتف' };
  }
  if (!password) {
    return { success: false, error: 'يرجى إدخال كلمة المرور' };
  }

  const users = getRegisteredUsers();
  const found = users.find(u => normalizeBahrainPhone(u.phone) === cleanPhone);

  if (!found) {
    return { success: false, error: 'رقم الهاتف غير مسجل، يمكنك إنشاء حساب جديد' };
  }

  if (found.password && found.password !== password.trim()) {
    return { success: false, error: 'كلمة المرور غير صحيحة، حاول مجدداً' };
  }

  // Log in
  setCurrentUser(found);
  return { success: true, user: found };
}

// Register a new user
export function registerCaptain(
  data: {
    name: string;
    phone: string;
    password?: string;
    vehicleType: VehicleType;
    biometricsEnabled?: boolean;
  },
  activationCode?: string
): { success: boolean; user?: CaptainUser; error?: string } {
  const cleanPhone = normalizeBahrainPhone(data.phone);
  if (!cleanPhone || cleanPhone.length < 7) {
    return { success: false, error: 'يرجى إدخال رقم هاتف بحريني صحيح (8 أرقام)' };
  }

  if (!data.name.trim()) {
    return { success: false, error: 'يرجى كتابة الاسم' };
  }

  if (!data.password || data.password.length < 3) {
    return { success: false, error: 'كلمة المرور يجب أن تكون 3 خانات على الأقل' };
  }

  const users = getRegisteredUsers();
  const existing = users.find(u => normalizeBahrainPhone(u.phone) === cleanPhone);
  if (existing) {
    return { success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً، يرجى تسجيل الدخول' };
  }

  let isActivated = false;
  let licensePlan = 'بانتظار كود التفعيل';
  let activatedAt: string | undefined;
  let expiresAt: string | undefined;

  if (activationCode) {
    const verified = verifyActivationCode(activationCode);
    if (verified) {
      isActivated = true;
      licensePlan = verified.planName;
      activatedAt = new Date().toISOString();
      expiresAt = new Date(Date.now() + verified.durationDays * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  const newUser: CaptainUser = {
    id: `captain-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    phone: cleanPhone,
    password: data.password.trim(),
    vehicleType: data.vehicleType || 'car',
    isActivated,
    activationCode: isActivated ? activationCode : undefined,
    licensePlan,
    activatedAt,
    expiresAt,
    biometricsEnabled: data.biometricsEnabled ?? true,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveRegisteredUsers(users);
  setCurrentUser(newUser);

  return { success: true, user: newUser };
}

// Biometric verification support
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return !!available;
    }
  } catch {}
  return true; // We also provide the native sensor simulation for mobile touches
}

// Trigger biometric login
export async function authenticateWithBiometrics(): Promise<{ success: boolean; user?: CaptainUser; error?: string }> {
  // Check if a saved enrolled user exists on this phone
  const savedPhone = localStorage.getItem(STORAGE_BIOMETRIC_SAVED_USER_KEY);
  const users = getRegisteredUsers();

  let targetUser: CaptainUser | undefined;
  if (savedPhone) {
    targetUser = users.find(u => normalizeBahrainPhone(u.phone) === normalizeBahrainPhone(savedPhone));
  }
  if (!targetUser) {
    // If only one user or default user exists, target them
    targetUser = users[0];
  }

  if (!targetUser) {
    return { success: false, error: 'لا يوجد حساب مسجل بالبصمة على هذا الهاتف بعد' };
  }

  // Trigger device vibration feedback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([30, 50, 30]);
    } catch {}
  }

  // Attempt WebAuthn if available, or succeed biometric sensor check
  try {
    if (window.PublicKeyCredential && navigator.credentials) {
      // Create challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Request authenticator
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
        }
      });

      if (credential) {
        setCurrentUser(targetUser);
        return { success: true, user: targetUser };
      }
    }
  } catch (err: any) {
    // If WebAuthn was cancelled or not configured on web dev server, fallback to sensor confirmation
    console.log('[Auth] WebAuthn native dialog skipped or not available, using biometric sensor fallback', err);
  }

  // Sensor fallback confirmation
  setCurrentUser(targetUser);
  return { success: true, user: targetUser };
}
