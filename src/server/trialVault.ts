import fs from 'fs';
import path from 'path';

export interface DeviceTrialRecord {
  deviceId: string;
  hardwareFingerprint: string;
  model: string;
  platform: string;
  phone?: string;
  firstInstalledAt: number;
  trialDays: number;
  expiresAt: number;
  isActivated: boolean;
  activationCode?: string | null;
  installCount: number;
  lastSeenAt: number;
  createdAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'device_trials.json');

// Ensure directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[TrialVault] Failed to ensure data dir:', e);
}

function loadRegistry(): Record<string, DeviceTrialRecord> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[TrialVault] Failed to load device_trials.json:', err);
  }
  return {};
}

function saveRegistry(registry: Record<string, DeviceTrialRecord>): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(registry, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[TrialVault] Failed to save device_trials.json:', err);
  }
}

/**
 * فحص أو تسجيل الهاتف للمرة الأولى
 * إذا كان الهاتف مسجلاً مسبقاً، يتم استرجاع تاريخ أول تثبيت بدقة وحساب المدة المتبقية
 * حتى لو قام المستخدم بحذف البرنامج وتثبيته من جديد
 */
export function checkOrRegisterDevice(params: {
  deviceId: string;
  hardwareFingerprint: string;
  model?: string;
  platform?: string;
  phone?: string;
}): {
  record: DeviceTrialRecord;
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  isNewInstall: boolean;
} {
  const registry = loadRegistry();
  const { deviceId, hardwareFingerprint, model = 'Mobile Device', platform = 'android', phone = '' } = params;

  // البحث في السجل عن معرف الجهاز أو بصمة العتاد أو رقم الهاتف المسجل
  let existingKey = Object.keys(registry).find(
    (k) =>
      k === deviceId ||
      registry[k].deviceId === deviceId ||
      (hardwareFingerprint && registry[k].hardwareFingerprint === hardwareFingerprint) ||
      (phone && registry[k].phone && registry[k].phone === phone)
  );

  const now = Date.now();

  if (existingKey) {
    const existing = registry[existingKey];
    // تحديث البيانات الإضافية والجلسة
    existing.lastSeenAt = now;
    existing.installCount = (existing.installCount || 1) + 1;
    if (phone && !existing.phone) existing.phone = phone;
    if (model && (!existing.model || existing.model === 'Mobile Device')) existing.model = model;

    saveRegistry(registry);

    const diff = existing.expiresAt - now;
    const isExpired = !existing.isActivated && diff <= 0;
    const daysRemaining = existing.isActivated ? 999 : Math.max(0, Math.ceil(diff / (24 * 3600 * 1000)));
    const hoursRemaining = existing.isActivated ? 999 : Math.max(0, Math.ceil(diff / (3600 * 1000)));

    return {
      record: existing,
      isExpired,
      daysRemaining,
      hoursRemaining,
      isNewInstall: false,
    };
  }

  // تسجيل جهاز جديد لأول مرة في تاريخ النظام: تبدأ مهلة الـ 7 أيام من هذه اللحظة
  const trialDays = 7;
  const firstInstalledAt = now;
  const expiresAt = firstInstalledAt + trialDays * 24 * 60 * 60 * 1000;

  const newRecord: DeviceTrialRecord = {
    deviceId,
    hardwareFingerprint,
    model,
    platform,
    phone,
    firstInstalledAt,
    trialDays,
    expiresAt,
    isActivated: false,
    activationCode: null,
    installCount: 1,
    lastSeenAt: now,
    createdAt: now,
  };

  registry[deviceId] = newRecord;
  saveRegistry(registry);

  return {
    record: newRecord,
    isExpired: false,
    daysRemaining: 7,
    hoursRemaining: 168,
    isNewInstall: true,
  };
}

/**
 * تفعيل الهاتف عبر كود ترخيص معتمد وحفظ التفعيل الدائم في السيرفر
 */
export function activateDevice(params: {
  deviceId: string;
  hardwareFingerprint?: string;
  code: string;
  phone?: string;
}): { success: boolean; message: string; record?: DeviceTrialRecord } {
  const { deviceId, hardwareFingerprint, code, phone } = params;
  const normalizedCode = (code || '').trim().toUpperCase();

  // قائمة أكواد التفعيل المعتمدة الرئيسية والأنماط الرسمية
  const masterCodes = ['ORDERI-VIP-2026', 'ORDERI7', 'BAHRAIN-PRO-2026', 'ORD-PRO-2026', 'ORDERI-2026'];
  const isValidPattern =
    masterCodes.includes(normalizedCode) ||
    /^ORD-[A-Z0-9]{4,10}-[A-Z0-9]{4,10}$/i.test(normalizedCode) ||
    /^CAP-[A-Z0-9]{4,12}$/i.test(normalizedCode);

  if (!isValidPattern) {
    return {
      success: false,
      message: 'كود التفعيل غير صالح. يرجى التأكد من الرمز أو التواصل عبر واتساب للحصول على كود جديد.',
    };
  }

  const registry = loadRegistry();
  let existingKey = Object.keys(registry).find(
    (k) =>
      k === deviceId ||
      registry[k].deviceId === deviceId ||
      (hardwareFingerprint && registry[k].hardwareFingerprint === hardwareFingerprint)
  );

  let record: DeviceTrialRecord;
  const now = Date.now();

  if (existingKey) {
    record = registry[existingKey];
    record.isActivated = true;
    record.activationCode = normalizedCode;
    record.lastSeenAt = now;
    if (phone) record.phone = phone;
  } else {
    // إنشاء سجل مباشر مفعل للجهاز
    record = {
      deviceId,
      hardwareFingerprint: hardwareFingerprint || deviceId,
      model: 'Mobile Device',
      platform: 'android',
      phone: phone || '',
      firstInstalledAt: now,
      trialDays: 7,
      expiresAt: now + 365 * 24 * 3600 * 1000,
      isActivated: true,
      activationCode: normalizedCode,
      installCount: 1,
      lastSeenAt: now,
      createdAt: now,
    };
    registry[deviceId] = record;
  }

  saveRegistry(registry);

  return {
    success: true,
    message: 'تم تفعيل ترخيص Orderi على هذا الهاتف بنجاح مدى الحياة! 🚀',
    record,
  };
}

/**
 * خيار إعادة ضبط التجربة للتجربة والاختبار
 */
export function resetDeviceTrial(deviceId: string): boolean {
  const registry = loadRegistry();
  if (registry[deviceId]) {
    delete registry[deviceId];
    saveRegistry(registry);
    return true;
  }
  return false;
}
