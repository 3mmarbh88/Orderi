import { Device } from '@capacitor/device';

/**
 * Orderi Device Fingerprint & Hardware Identity Engine
 * يولد ويحفظ هوية عتاد الهاتف الثابتة حتى لو تم حذف البرنامج وتثبيته من جديد
 */

const STORAGE_KEY = 'orderi_device_hw_id_v3';
const COOKIE_NAME = 'orderi_hw_token';
const DB_NAME = 'orderi_hardware_vault';
const DB_STORE = 'device_info';

export interface DeviceHardwareIdentity {
  deviceId: string;
  hardwareFingerprint: string;
  model: string;
  platform: string;
  osVersion: string;
  screenSummary: string;
  cores: number;
  memoryGb?: number;
  gpuRenderer: string;
  createdAt: number;
}

// Simple fast deterministic string hashing (FNV-1a / Murmur-like)
function hashString(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const val = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return Math.abs(val).toString(16).toUpperCase().padStart(12, '0');
}

/**
 * استخراج بصمة كرت الشاشة (GPU Renderer & Vendor) من WebGL
 */
function getGpuFingerprint(): { renderer: string; vendor: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return { renderer: 'Standard-GPU', vendor: 'Generic' };
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { renderer: 'GL-Renderer', vendor: 'GL-Vendor' };
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'GL-Renderer';
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'GL-Vendor';
    return { renderer: String(renderer), vendor: String(vendor) };
  } catch {
    return { renderer: 'Unknown-GPU', vendor: 'Unknown' };
  }
}

/**
 * استخراج بصمة رسم الخطوط (Canvas 2D Subpixel Rendering Fingerprint)
 * تعتمد على محرك رسم الخطوط في نظام التشغيل وكرت الشاشة ولا تتغير عند حذف البرنامج
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas-nactx';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial, Tajawal, sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.fillText('Orderi Bahrain 🇧🇭 2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('رادار طلبات الهاتف', 4, 35);

    return hashString(canvas.toDataURL());
  } catch {
    return 'canvas-fallback';
  }
}

/**
 * قراءة وحفظ في الـ IndexedDB لضمان بقاء هوية الهاتف حتى لو تم مسح localStorage
 */
async function getStoredIndexedDbId(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => {
        try {
          const db = request.result;
          const tx = db.transaction(DB_STORE, 'readonly');
          const store = tx.objectStore(DB_STORE);
          const getReq = store.get('hw_device_id');
          getReq.onsuccess = () => {
            resolve(getReq.result?.value || null);
          };
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveToIndexedDb(id: string): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => {
      try {
        const db = request.result;
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.put({ key: 'hw_device_id', value: id, savedAt: Date.now() });
      } catch {}
    };
  } catch {}
}

/**
 * حفظ واسترجاع من Cookies ذات الصلاحية الطويلة (10 سنوات)
 */
function getCookieId(): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function setCookieId(id: string): void {
  try {
    if (typeof document === 'undefined') return;
    const tenYears = 10 * 365 * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; max-age=${tenYears}; path=/; SameSite=Lax`;
  } catch {}
}

let cachedIdentity: DeviceHardwareIdentity | null = null;

/**
 * الحصول على بصمة وهوية هاتف العميل الثابتة والمقاومة للحذف
 */
export async function getDeviceHardwareIdentity(): Promise<DeviceHardwareIdentity> {
  if (cachedIdentity) return cachedIdentity;

  let nativeId = '';
  let nativeModel = '';
  let nativePlatform = 'web';
  let nativeOsVersion = '';

  // 1. فحص إضافة Capacitor Device الأصلية في Android
  try {
    const idRes = await Device.getId();
    if (idRes && idRes.identifier) {
      nativeId = idRes.identifier;
    }
    const infoRes = await Device.getInfo();
    if (infoRes) {
      nativeModel = infoRes.model || infoRes.name || '';
      nativePlatform = infoRes.platform || 'android';
      nativeOsVersion = infoRes.osVersion || '';
    }
  } catch {
    // بيئة المتصفح أو PWA
  }

  // 2. محاولة استعادة معرف الجهاز المحفوظ من الطبقات المتعددة (IndexedDB, Cookie, LocalStorage)
  const localId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const cookieId = getCookieId();
  const idbId = await getStoredIndexedDbId();

  const recoveredPersistentId = localId || cookieId || idbId;

  // 3. حساب بصمة العتاد الفيزيائية (Hardware Fingerprint)
  const screenSummary = typeof window !== 'undefined' && window.screen 
    ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}@${window.devicePixelRatio || 1}`
    : 'screen-standard';

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const memoryGb = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || undefined : undefined;
  const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Bahrain';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'OrderiClient';
  const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  
  const gpu = getGpuFingerprint();
  const canvasHash = getCanvasFingerprint();

  // تجميع كافة سمات العتاد الثابتة في بصمة واحدة غير قابلة للتغيير
  const hardwareRaw = [
    nativeId,
    screenSummary,
    cores,
    memoryGb || 'nomem',
    timezone,
    gpu.vendor,
    gpu.renderer,
    canvasHash,
    touchPoints,
    userAgent.includes('Android') ? 'Android' : userAgent.includes('iPhone') ? 'iOS' : 'Desktop'
  ].join('||');

  const hardwareFingerprint = hashString(hardwareRaw);

  // معرف الجهاز الموحد: إذا كان الجهاز مسجلاً من قبل نحافظ عليه، أو نبنيه برمز البصمة
  let finalDeviceId = recoveredPersistentId;
  if (!finalDeviceId) {
    if (nativeId && nativeId.length > 5) {
      finalDeviceId = `ORD-AND-${hashString(nativeId).slice(0, 8)}`;
    } else {
      finalDeviceId = `ORD-BH-${hardwareFingerprint.slice(0, 8)}`;
    }
  }

  // حفظ المعرف في كافة طبقات التخزين لضمان بقائه
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, finalDeviceId);
    }
    setCookieId(finalDeviceId);
    await saveToIndexedDb(finalDeviceId);
  } catch {}

  cachedIdentity = {
    deviceId: finalDeviceId,
    hardwareFingerprint,
    model: nativeModel || (userAgent.includes('Android') ? 'Android Device' : 'Mobile Phone'),
    platform: nativePlatform,
    osVersion: nativeOsVersion,
    screenSummary,
    cores,
    memoryGb,
    gpuRenderer: gpu.renderer,
    createdAt: Date.now()
  };

  return cachedIdentity;
}
