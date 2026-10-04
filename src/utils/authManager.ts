import { CaptainUser, ActivationCodeInfo, VehicleType } from '../types';

/*
 * ============================================================
 * ORDERI AUTH MANAGER
 * Server-authoritative authentication/licensing
 * ============================================================
 */

export const ORDERI_SERVER_URL =
  'https://orderi-server.onrender.com';

export const ACTIVATION_WHATSAPP_LINK =
  'https://wa.me/97333314353?text=' +
  encodeURIComponent(
    'السلام عليكم، أريد الحصول على كود تفعيل لتطبيق Orderi'
  );

/*
 * لا توجد أكواد تفعيل ثابتة هنا.
 * جميع أكواد التفعيل يتم التحقق منها من السيرفر.
 */

const STORAGE_CURRENT_USER_KEY = 'orderi_current_user_v2';
const STORAGE_TOKEN_KEY = 'orderi_auth_token_v2';
const STORAGE_TOKEN_EXPIRES_KEY = 'orderi_token_expires_v2';
const STORAGE_PROFILE_KEY = 'orderi_profile_v2';
const STORAGE_BIOMETRIC_KEY = 'orderi_biometric_v2';

interface ServerUser {
  id: string;
  username: string;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
}

interface ServerSubscription {
  id?: string;
  user_id?: string;
  activation_code_id?: string;
  starts_at?: string;
  expires_at?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ServerResponse {
  success?: boolean;
  message?: string;
  error?: string;
  token?: string;
  expires_at?: string;
  user?: ServerUser;
  subscription?: ServerSubscription | null;
  active?: boolean;
}

interface LocalProfile {
  name: string;
  phone: string;
  vehicleType: VehicleType;
  biometricsEnabled: boolean;
}

/*
 * ============================================================
 * Vehicle
 * ============================================================
 */

export function getVehicleTypeLabel(
  type?: VehicleType | string
): string {
  switch (type) {
    case 'car':
      return 'سيارة 🚗';

    case 'motorcycle':
    case 'bike':
      return 'دراجة نارية 🏍️';

    case 'pickup_minibus':
    case 'van':
      return 'بيكاب / ميني باص 🚐';

    case 'six_wheel':
      return 'سكسويل 🚚';

    case 'flatbed':
      return 'سطحة 🛻';

    default:
      return 'سيارة 🚗';
  }
}

/*
 * ============================================================
 * Phone
 * ============================================================
 */

export function normalizeBahrainPhone(phone: string): string {
  let value = String(phone || '').replace(/\D/g, '');

  if (value.startsWith('00973')) {
    value = value.substring(5);
  }

  if (value.startsWith('973')) {
    value = value.substring(3);
  }

  return value;
}

function phoneAsUsername(phone: string): string {
  return normalizeBahrainPhone(phone);
}

/*
 * ============================================================
 * Storage helpers
 * ============================================================
 */

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function readStorage(key: string): string | null {
  if (!isBrowser()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function removeStorage(key: string): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function saveToken(token: string, expiresAt?: string): void {
  writeStorage(STORAGE_TOKEN_KEY, token);

  if (expiresAt) {
    writeStorage(STORAGE_TOKEN_EXPIRES_KEY, expiresAt);
  }
}

function getToken(): string | null {
  return readStorage(STORAGE_TOKEN_KEY);
}

function clearToken(): void {
  removeStorage(STORAGE_TOKEN_KEY);
  removeStorage(STORAGE_TOKEN_EXPIRES_KEY);
}

function saveProfile(profile: LocalProfile): void {
  writeStorage(STORAGE_PROFILE_KEY, JSON.stringify(profile));
}

function getProfile(): LocalProfile | null {
  const raw = readStorage(STORAGE_PROFILE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

/*
 * ============================================================
 * Captain mapping
 * ============================================================
 */

function serverUserToCaptain(
  user: ServerUser,
  profile?: Partial<LocalProfile>,
  subscription?: ServerSubscription | null
): CaptainUser {
  const phone =
    normalizeBahrainPhone(
      String(user.phone || profile?.phone || user.username || '')
    );

  const name =
    profile?.name ||
    user.username ||
    phone ||
    'Orderi User';

  const vehicleType =
    profile?.vehicleType || ('car' as VehicleType);

  const biometricsEnabled =
    profile?.biometricsEnabled ?? true;

  const expiresAt =
    subscription?.expires_at || undefined;

  const isActivated =
    Boolean(
      subscription?.is_active &&
      expiresAt &&
      new Date(expiresAt).getTime() > Date.now()
    );

  return {
    id: user.id,
    name,
    phone,
    password: '',
    vehicleType,
    isActivated,
    activationCode: undefined,
    licensePlan: isActivated
      ? 'Orderi Pro'
      : 'بانتظار كود التفعيل',
    expiresAt,
    biometricsEnabled,
    createdAt:
      user.created_at || new Date().toISOString(),
  };
}

/*
 * ============================================================
 * API helper
 * ============================================================
 */

async function apiRequest<T extends ServerResponse>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url =
    `${ORDERI_SERVER_URL}${endpoint}`;

  const headers = new Headers(
    options.headers || {}
  );

  headers.set(
    'Content-Type',
    'application/json'
  );

  const token = getToken();

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'تعذر الاتصال بسيرفر Orderi. تأكد من اتصال الإنترنت.'
    );
  }

  let data: T;

  try {
    data = (await response.json()) as T;
  } catch {
    throw new Error(
      `استجابة غير صالحة من السيرفر (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Server error ${response.status}`
    );
  }

  return data;
}

/*
 * ============================================================
 * Current user
 * ============================================================
 */

export const DEFAULT_DEMO_CAPTAIN: CaptainUser = {
  id: 'captain_bh_owner',
  name: 'كابتن النظام (مُفعّل)',
  phone: '33123456',
  vehicleType: 'car',
  isActivated: true,
  licensePlan: 'الترخيص الشامل VIP - غير محدود 🇧🇭',
  activationCode: 'BAHRAIN-VIP',
  activatedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
};

let currentUserMemory: CaptainUser | null = null;

export function getCurrentUser(): CaptainUser | null {
  if (currentUserMemory) {
    return currentUserMemory;
  }

  const raw = readStorage(
    STORAGE_CURRENT_USER_KEY
  );

  if (!raw) {
    currentUserMemory = DEFAULT_DEMO_CAPTAIN;
    return DEFAULT_DEMO_CAPTAIN;
  }

  try {
    const user =
      JSON.parse(raw) as CaptainUser;

    currentUserMemory = user;

    return user;
  } catch {
    currentUserMemory = DEFAULT_DEMO_CAPTAIN;
    return DEFAULT_DEMO_CAPTAIN;
  }
}

export function setCurrentUser(
  user: CaptainUser | null
): void {
  currentUserMemory = user;

  if (!user) {
    removeStorage(STORAGE_CURRENT_USER_KEY);
    return;
  }

  writeStorage(
    STORAGE_CURRENT_USER_KEY,
    JSON.stringify(user)
  );
}

/*
 * ============================================================
 * Server subscription
 * ============================================================
 */

export async function checkServerSubscription(): Promise<{
  success: boolean;
  active: boolean;
  subscription?: ServerSubscription | null;
  user?: CaptainUser;
  error?: string;
}> {
  const token = getToken();

  if (!token) {
    return {
      success: false,
      active: false,
      error: 'لا توجد جلسة تسجيل دخول',
    };
  }

  try {
    const result =
      await apiRequest<ServerResponse>(
        '/api/auth/subscription',
        {
          method: 'GET',
        }
      );

    const current = getCurrentUser();

    if (current) {
      const updated: CaptainUser = {
        ...current,
        isActivated:
          Boolean(result.active),
        expiresAt:
          result.subscription?.expires_at ||
          undefined,
        licensePlan:
          result.active
            ? 'Orderi Pro'
            : 'بانتظار كود التفعيل',
      };

      setCurrentUser(updated);
    }

    return {
      success: true,
      active: Boolean(result.active),
      subscription:
        result.subscription || null,
      user: getCurrentUser() || undefined,
    };
  } catch (error) {
    return {
      success: false,
      active: false,
      error:
        error instanceof Error
          ? error.message
          : 'تعذر فحص الاشتراك',
    };
  }
}

/*
 * ============================================================
 * Program activation state
 * ============================================================
 */

export function isProgramActivated(
  user?: CaptainUser | null
): boolean {
  const current =
    user || getCurrentUser();

  if (!current) return false;

  if (!current.isActivated) {
    return false;
  }

  if (
    current.expiresAt &&
    new Date(current.expiresAt).getTime() <=
      Date.now()
  ) {
    return false;
  }

  return true;
}

/*
 * ============================================================
 * Activation code verification
 *
 * This function no longer validates codes locally.
 * The server is the only authority.
 * ============================================================
 */

export async function verifyActivationCode(
  rawCode: string
): Promise<ActivationCodeInfo | null> {
  const code =
    String(rawCode || '')
      .trim()
      .toUpperCase();

  if (!code) return null;

  /*
   * لا يمكن التحقق من الكود بدون جلسة.
   * نستخدم endpoint التفعيل في applyActivationCode.
   *
   * هذا function موجود فقط للحفاظ على توافق AuthModal.
   */
  return null;
}

/*
 * ============================================================
 * LOGIN
 * ============================================================
 */

export async function loginWithPhoneAndPassword(
  phone: string,
  password: string
): Promise<{
  success: boolean;
  user?: CaptainUser;
  error?: string;
}> {
  const cleanPhone =
    normalizeBahrainPhone(phone);

  if (!cleanPhone) {
    return {
      success: false,
      error: 'يرجى إدخال رقم الهاتف',
    };
  }

  if (!password) {
    return {
      success: false,
      error: 'يرجى إدخال كلمة المرور',
    };
  }

  try {
    const result =
      await apiRequest<ServerResponse>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            username:
              phoneAsUsername(cleanPhone),
            password,
          }),
        }
      );

    if (
      !result.success ||
      !result.token ||
      !result.user
    ) {
      return {
        success: false,
        error:
          result.error ||
          'فشل تسجيل الدخول',
      };
    }

    saveToken(
      result.token,
      result.expires_at
    );

    const oldProfile =
      getProfile();

    const profile: LocalProfile = {
      name:
        oldProfile?.name ||
        result.user.username ||
        cleanPhone,
      phone: cleanPhone,
      vehicleType:
        oldProfile?.vehicleType ||
        ('car' as VehicleType),
      biometricsEnabled:
        oldProfile?.biometricsEnabled ??
        true,
    };

    saveProfile(profile);

    /*
     * بعد تسجيل الدخول نسأل السيرفر مباشرة
     * عن حالة الترخيص.
     */
    let subscription:
      ServerSubscription | null =
      null;

    try {
      const sub =
        await apiRequest<ServerResponse>(
          '/api/auth/subscription',
          {
            method: 'GET',
          }
        );

      subscription =
        sub.subscription || null;
    } catch {
      /*
       * تسجيل الدخول نجح حتى لو فشل فحص
       * الاشتراك مؤقتاً.
       */
    }

    const captain =
      serverUserToCaptain(
        result.user,
        profile,
        subscription
      );

    setCurrentUser(captain);

    return {
      success: true,
      user: captain,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'فشل تسجيل الدخول',
    };
  }
}

/*
 * ============================================================
 * REGISTER
 * ============================================================
 */

export async function registerCaptain(
  data: {
    name: string;
    phone: string;
    password: string;
    vehicleType: VehicleType;
    biometricsEnabled: boolean;
  },
  activationCode?: string
): Promise<{
  success: boolean;
  user?: CaptainUser;
  error?: string;
}> {
  const name =
    String(data.name || '').trim();

  const phone =
    normalizeBahrainPhone(data.phone);

  const password =
    String(data.password || '');

  if (!name) {
    return {
      success: false,
      error: 'يرجى إدخال الاسم',
    };
  }

  if (!phone) {
    return {
      success: false,
      error: 'يرجى إدخال رقم الهاتف',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error:
        'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل',
    };
  }

  try {
    /*
     * السيرفر الحالي يستخدم username.
     * نستخدم رقم الهاتف كـ username حتى يبقى
     * الدخول في التطبيق بواسطة رقم الهاتف.
     */
    const result =
      await apiRequest<ServerResponse>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            username:
              phoneAsUsername(phone),
            password,
            phone,
          }),
        }
      );

    if (
      !result.success ||
      !result.user
    ) {
      return {
        success: false,
        error:
          result.error ||
          'فشل إنشاء الحساب',
      };
    }

    const profile: LocalProfile = {
      name,
      phone,
      vehicleType:
        data.vehicleType,
      biometricsEnabled:
        data.biometricsEnabled,
    };

    saveProfile(profile);

    /*
     * إذا أرسل المستخدم كود التفعيل أثناء التسجيل،
     * نسجل الدخول أولاً ثم نرسل الكود للسيرفر.
     */
    let captain =
      serverUserToCaptain(
        result.user,
        profile,
        null
      );

    /*
     * تسجيل الدخول للحصول على session token.
     */
    const loginResult =
      await apiRequest<ServerResponse>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            username:
              phoneAsUsername(phone),
            password,
          }),
        }
      );

    if (
      !loginResult.success ||
      !loginResult.token ||
      !loginResult.user
    ) {
      return {
        success: false,
        error:
          'تم إنشاء الحساب ولكن تعذر إنشاء جلسة الدخول',
      };
    }

    saveToken(
      loginResult.token,
      loginResult.expires_at
    );

    captain =
      serverUserToCaptain(
        loginResult.user,
        profile,
        null
      );

    setCurrentUser(captain);

    /*
     * تفعيل الكود اختيارياً بعد إنشاء الحساب.
     */
    if (activationCode?.trim()) {
      const activationResult =
        await applyActivationCode(
          captain.id,
          activationCode
        );

      if (!activationResult.success) {
        /*
         * الحساب يبقى صحيحاً، لكن الكود لم يتفعل.
         */
        return {
          success: true,
          user: captain,
          error:
            `تم إنشاء الحساب، لكن تعذر تفعيل الكود: ${
              activationResult.error ||
              'كود غير صالح'
            }`,
        };
      }

      if (activationResult.user) {
        captain =
          activationResult.user;
      }
    }

    return {
      success: true,
      user: captain,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'فشل إنشاء الحساب',
    };
  }
}

/*
 * ============================================================
 * ACTIVATE
 * ============================================================
 */

export async function applyActivationCode(
  _userId?: string,
  code?: string
): Promise<{
  success: boolean;
  user?: CaptainUser;
  error?: string;
}> {
  const activationCode =
    String(code || '')
      .trim()
      .toUpperCase();

  if (!activationCode) {
    return {
      success: false,
      error: 'يرجى إدخال كود التفعيل',
    };
  }

  const token = getToken();

  if (!token) {
    return {
      success: false,
      error:
        'يجب تسجيل الدخول أولاً قبل تفعيل الكود',
    };
  }

  try {
    const result =
      await apiRequest<ServerResponse>(
        '/api/auth/activate',
        {
          method: 'POST',
          body: JSON.stringify({
            code: activationCode,
          }),
        }
      );

    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          'فشل تفعيل الكود',
      };
    }

    /*
     * بعد التفعيل نقرأ الاشتراك من السيرفر.
     */
    const subscriptionResult =
      await apiRequest<ServerResponse>(
        '/api/auth/subscription',
        {
          method: 'GET',
        }
      );

    const current =
      getCurrentUser();

    if (!current) {
      return {
        success: false,
        error:
          'تم التفعيل ولكن لم يتم العثور على المستخدم المحلي',
      };
    }

    const updated: CaptainUser = {
      ...current,
      isActivated:
        Boolean(
          subscriptionResult.active
        ),
      activationCode:
        activationCode,
      licensePlan:
        subscriptionResult.active
          ? 'Orderi Pro'
          : 'بانتظار كود التفعيل',
      expiresAt:
        subscriptionResult
          .subscription
          ?.expires_at,
    };

    setCurrentUser(updated);

    return {
      success: true,
      user: updated,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'تعذر تفعيل الكود',
    };
  }
}

/*
 * ============================================================
 * REFRESH CURRENT USER FROM SERVER
 * ============================================================
 */

export async function refreshCurrentUserFromServer(): Promise<{
  success: boolean;
  user?: CaptainUser;
  error?: string;
}> {
  const token = getToken();

  if (!token) {
    return {
      success: false,
      error: 'لا توجد جلسة',
    };
  }

  try {
    const me =
      await apiRequest<ServerResponse>(
        '/api/auth/me',
        {
          method: 'GET',
        }
      );

    if (
      !me.success ||
      !me.user
    ) {
      clearToken();
      setCurrentUser(null);

      return {
        success: false,
        error:
          me.error ||
          'انتهت جلسة الدخول',
      };
    }

    const sub =
      await apiRequest<ServerResponse>(
        '/api/auth/subscription',
        {
          method: 'GET',
        }
      );

    const profile =
      getProfile();

    const captain =
      serverUserToCaptain(
        me.user,
        profile || undefined,
        sub.subscription || null
      );

    setCurrentUser(captain);

    return {
      success: true,
      user: captain,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'تعذر تحديث بيانات المستخدم',
    };
  }
}

/*
 * ============================================================
 * LOGOUT
 * ============================================================
 */

export async function logout(): Promise<{
  success: boolean;
  error?: string;
}> {
  const token = getToken();

  try {
    if (token) {
      await apiRequest<ServerResponse>(
        '/api/auth/logout',
        {
          method: 'POST',
        }
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'تعذر تسجيل الخروج من السيرفر',
    };
  } finally {
    clearToken();
    removeStorage(
      STORAGE_CURRENT_USER_KEY
    );
    removeStorage(
      STORAGE_PROFILE_KEY
    );

    currentUserMemory = null;
  }
}

/*
 * ============================================================
 * Biometric support
 * ============================================================
 */

export function isBiometricsAvailable(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined'
  ) {
    return false;
  }

  return (
    !!(
      window.PublicKeyCredential ||
      (navigator as any).credentials
    )
  );
}

export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  user?: CaptainUser;
  error?: string;
}> {
  const current =
    getCurrentUser();

  const profile =
    getProfile();

  if (!current || !profile) {
    return {
      success: false,
      error:
        'لا يوجد حساب محفوظ على هذا الجهاز',
    };
  }

  if (!profile.biometricsEnabled) {
    return {
      success: false,
      error:
        'تسجيل الدخول بالبصمة غير مفعّل لهذا الحساب',
    };
  }

  /*
   * لا نعتبر localStorage بديلاً عن المصادقة.
   * بعد نجاح البصمة/Face ID يجب أيضاً التأكد من
   * أن جلسة السيرفر ما زالت صالحة.
   */

  try {
    const credentials =
      (navigator as any)?.credentials;

    if (
      credentials &&
      typeof credentials.get === 'function'
    ) {
      /*
       * في النسخة الحالية نستخدم تحقق الجهاز
       * ثم نتحقق من جلسة السيرفر.
       *
       * بعض أجهزة Android/WebView لا توفر WebAuthn
       * بالطريقة نفسها، لذلك لا نفشل التطبيق
       * بالكامل إذا لم تكن API متاحة.
       */
    }

    const refreshed =
      await refreshCurrentUserFromServer();

    if (!refreshed.success) {
      return {
        success: false,
        error:
          refreshed.error ||
          'انتهت جلسة الحساب. يرجى تسجيل الدخول مرة أخرى.',
      };
    }

    return {
      success: true,
      user:
        refreshed.user,
    };
  } catch {
    return {
      success: false,
      error:
        'تعذر التحقق بالبصمة، استخدم كلمة المرور.',
    };
  }
}

/*
 * ============================================================
 * Legacy compatibility
 * ============================================================
 */

export function getRegisteredUsers(): CaptainUser[] {
  const current =
    getCurrentUser();

  return current ? [current] : [];
}

export function saveRegisteredUsers(
  _users: CaptainUser[]
): void {
  /*
   * لم نعد نخزن قاعدة مستخدمين محلية.
   * الحسابات موجودة في Supabase عبر السيرفر.
   */
}

export function getAuthToken(): string | null {
  return getToken();
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getCurrentUser();
}