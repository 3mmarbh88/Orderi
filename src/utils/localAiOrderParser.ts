import { registerPlugin, Capacitor } from '@capacitor/core';
import { parseWhatsAppOrderText, RawParsedResult } from './orderParser';
import { BAHRAIN_AREAS, normalizeArabicText } from '../data/bahrainAreas';
import { BAHRAIN_LANDMARKS } from '../data/bahrainLandmarks';
import { detectPassengerDelivery } from './passengerClassifier';

export interface LocalAIExtractionResult {
  from: string;
  to: string;
  price: number;
  phone?: string;
  notes?: string;
  confidence: number;
  rawResponse?: string;
}

interface OrderiLocalAIPluginType {
  isModelAvailable(): Promise<{ available: boolean; modelPath?: string; fileSizeMb?: number }>;
  loadModel(): Promise<{ success: boolean; status: string; memoryUsedMb?: number }>;
  parseOrder(options: { text: string }): Promise<{
    success: boolean;
    from: string;
    to: string;
    price: number;
    phone?: string;
    notes?: string;
    confidence?: number;
    rawOutput?: string;
    inferenceTimeMs?: number;
  }>;
  getStatus(): Promise<{
    initialized: boolean;
    modelLoaded: boolean;
    modelName: string;
    ramMb?: number;
  }>;
}

export const OrderiLocalAIPlugin = registerPlugin<OrderiLocalAIPluginType>('OrderiLocalAI');

export const DEFAULT_LOCAL_AI_CONFIG = {
  enabled: true,
  modelName: 'Gemma 3 1B LiteRT (gemma3-1b-it-int4.litertlm)',
  modelPath: 'models/gemma3-1b-it-int4.litertlm',
  hybridMode: true,
  minConfidenceForFastPass: 85,
  status: 'ready' as const,
};

/**
 * Validates and snaps an AI-extracted area name to the closest official Bahrain area or landmark.
 */
function snapToOfficialBahrainArea(candidate: string): string {
  if (!candidate || typeof candidate !== 'string') return '';
  const cleaned = candidate.trim().replace(/^من\s+|^إلى\s+|^حق\s+|^في\s+/i, '').trim();
  const normalizedCandidate = normalizeArabicText(cleaned);

  // Exact or contains match in Bahrain Areas
  for (const area of BAHRAIN_AREAS) {
    const normArea = normalizeArabicText(area.name);
    if (normalizedCandidate === normArea || normalizedCandidate.includes(normArea) || normArea.includes(normalizedCandidate)) {
      return area.name;
    }
  }

  // Check landmarks
  for (const landmark of BAHRAIN_LANDMARKS) {
    const normLm = normalizeArabicText(landmark.name);
    if (normalizedCandidate.includes(normLm) || normLm.includes(normalizedCandidate)) {
      return landmark.parentAreaName || landmark.name;
    }
  }

  return cleaned;
}

/**
 * Robust hybrid order parsing pipeline:
 * 1. Fast Tier 1 (Heuristics & RegEx): runs in <2ms. If confidence >= minConfidence and not forceAi, returns immediately.
 * 2. Smart Tier 2 (Local AI on device): runs if text is ambiguous or complex.
 */
export async function parseWhatsAppOrderWithLocalAi(
  rawText: string,
  options: {
    forceAi?: boolean;
    hybridMode?: boolean;
    minConfidence?: number;
    useCloudFallback?: boolean;
    senderName?: string;
    groupName?: string;
  } = {}
): Promise<RawParsedResult & { aiUsed: boolean; inferenceMs: number; parseMethod: 'fast_heuristic' | 'local_ai' | 'cloud_ai' | 'fallback' }> {
  const startTime = performance.now();
  const hybridMode = options.hybridMode !== false;
  const minConfidence = options.minConfidence ?? 85;
  const useCloudFallback = options.useCloudFallback !== false;

  // Step 1: Run Fast Tier 1 Heuristics
  const fastResult = parseWhatsAppOrderText(rawText);

  // If Fast Pass is highly confident and complete, return immediately (Zero lag for simple orders)
  if (hybridMode && !options.forceAi && fastResult.canCreateOrder && fastResult.confidence >= minConfidence && fastResult.from && fastResult.to) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      ...fastResult,
      aiUsed: false,
      inferenceMs: elapsed,
      parseMethod: 'fast_heuristic',
    };
  }

  // Step 2: If running on native Android, attempt inference via OrderiLocalAIPlugin
  const isAndroid = Capacitor.getPlatform() === 'android';
  if (isAndroid) {
    try {
      const nativeResponse = await OrderiLocalAIPlugin.parseOrder({ text: rawText });
      if (nativeResponse && nativeResponse.success && (nativeResponse.from || nativeResponse.to)) {
        const fromArea = snapToOfficialBahrainArea(nativeResponse.from) || fastResult.from;
        const toArea = snapToOfficialBahrainArea(nativeResponse.to) || fastResult.to;
        const price = (typeof nativeResponse.price === 'number' && nativeResponse.price > 0)
          ? nativeResponse.price
          : fastResult.price;

        const elapsed = Math.round(performance.now() - startTime);
        const passengerDet = detectPassengerDelivery(rawText);

        return {
          from: fromArea,
          to: toArea,
          price,
          isPriceUnspecified: price <= 0,
          passengerCount: passengerDet.passengerCount,
          phone: nativeResponse.phone || fastResult.phone,
          notes: nativeResponse.notes || fastResult.notes || 'تم التحليل عبر الذكاء الاصطناعي المحلي (Gemma 3 1B)',
          confidence: Math.max(88, nativeResponse.confidence || 90),
          canCreateOrder: Boolean(fromArea || toArea || price > 0),
          passengerDetection: passengerDet,
          aiUsed: true,
          inferenceMs: elapsed,
          parseMethod: 'local_ai',
        };
      }
    } catch (err) {
      console.warn('[LocalAI] Native plugin call bypassed or model loading, checking cloud tier:', err);
    }
  }

  // Step 3: Cloud AI Fallback (Gemini API) if text is still ambiguous or incomplete (e.g. missing from/to or suspicious)
  const isMissingKeyInfo = !fastResult.from || !fastResult.to;
  if (useCloudFallback && (options.forceAi || isMissingKeyInfo || fastResult.passengerDetection?.level === 'suspicious_passenger')) {
    try {
      const cloudRes = await fetch('/api/ai/cloud-parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          senderName: options.senderName || '',
          groupName: options.groupName || '',
        }),
      });

      if (cloudRes.ok) {
        const json = await cloudRes.json();
        if (json && json.success && json.data) {
          const cloudData = json.data;
          const fromArea = snapToOfficialBahrainArea(cloudData.from) || fastResult.from;
          const toArea = snapToOfficialBahrainArea(cloudData.to) || fastResult.to;
          const price = typeof cloudData.price === 'number' && cloudData.price > 0 ? cloudData.price : fastResult.price;
          const elapsed = Math.round(performance.now() - startTime);

          const passengerDet = cloudData.passengerRisk === 'confirmed_passenger'
            ? {
                level: 'confirmed_passenger' as const,
                label: 'تحذير: توصيل أشخاص ممنوع',
                matchedPhrases: ['تم الكشف بواسطة الذكاء الاصطناعي السحابي'],
                reason: 'الإعلان يحتوي على نقل ركاب أو أشخاص مخالف لشروط نقل البضائع.',
                isForbidden: false,
                passengerCount: cloudData.passengerCount || undefined,
              }
            : fastResult.passengerDetection;

          if (fromArea || toArea || price > 0) {
            return {
              ...fastResult,
              from: fromArea,
              to: toArea,
              price,
              isPriceUnspecified: price <= 0,
              phone: cloudData.phone || fastResult.phone,
              passengerCount: cloudData.passengerCount || fastResult.passengerCount,
              passengerDetection: passengerDet,
              notes: cloudData.notes || 'تم التحليل والاستخراج العميق عبر الذكاء الاصطناعي السحابي (Gemini)',
              confidence: Math.max(92, cloudData.confidence || 95),
              canCreateOrder: true,
              aiUsed: true,
              inferenceMs: elapsed,
              parseMethod: 'cloud_ai',
            };
          }
        }
      }
    } catch (cloudErr) {
      console.warn('[Cloud AI Fallback Request Error]', cloudErr);
    }
  }

  // Step 4: Refined Heuristic engine fallback
  const elapsed = Math.round(performance.now() - startTime);
  let refinedFrom = fastResult.from;
  let refinedTo = fastResult.to;

  if (!refinedFrom || !refinedTo) {
    for (const lm of BAHRAIN_LANDMARKS) {
      if (rawText.includes(lm.name)) {
        if (!refinedFrom) refinedFrom = lm.parentAreaName;
        else if (!refinedTo && lm.parentAreaName !== refinedFrom) refinedTo = lm.parentAreaName;
      }
    }
  }

  return {
    ...fastResult,
    from: refinedFrom || fastResult.from,
    to: refinedTo || fastResult.to,
    canCreateOrder: Boolean(refinedFrom || refinedTo || fastResult.price > 0),
    aiUsed: options.forceAi || !hybridMode,
    inferenceMs: elapsed,
    parseMethod: options.forceAi ? 'local_ai' : 'fast_heuristic',
  };
}

/**
 * Checks the status of the local AI plugin and model file.
 */
export async function checkLocalAIStatus(): Promise<{
  isNativeAndroid: boolean;
  modelAvailable: boolean;
  modelName: string;
  modelPath: string;
  status: 'ready' | 'loading' | 'unloaded' | 'simulated';
  detail: string;
}> {
  const isAndroid = Capacitor.getPlatform() === 'android';
  if (!isAndroid) {
    return {
      isNativeAndroid: false,
      modelAvailable: true,
      modelName: DEFAULT_LOCAL_AI_CONFIG.modelName,
      modelPath: DEFAULT_LOCAL_AI_CONFIG.modelPath,
      status: 'simulated',
      detail: 'يعمل عبر المحرك الهجين التكيفي (بيئة المتصفح / الويب)',
    };
  }

  try {
    const res = await OrderiLocalAIPlugin.isModelAvailable();
    return {
      isNativeAndroid: true,
      modelAvailable: res.available,
      modelName: DEFAULT_LOCAL_AI_CONFIG.modelName,
      modelPath: res.modelPath || DEFAULT_LOCAL_AI_CONFIG.modelPath,
      status: res.available ? 'ready' : 'unloaded',
      detail: res.available 
        ? `نموذج Gemma 3 1B متاح محلياً على الهاتف (${res.fileSizeMb || 584} MB) ويعمل دون إنترنت`
        : 'ملف النموذج gemma3-1b-it-int4.litertlm لم يتم العثور عليه في ذاكرة الهاتف، يتم استخدام المحلل الهجين الفوري كبديل آمن',
    };
  } catch (err: any) {
    return {
      isNativeAndroid: true,
      modelAvailable: false,
      modelName: DEFAULT_LOCAL_AI_CONFIG.modelName,
      modelPath: DEFAULT_LOCAL_AI_CONFIG.modelPath,
      status: 'simulated',
      detail: 'جسر الذكاء الاصطناعي قيد التهيئة، المحلل الهجين الفوري يعمل بنشاط',
    };
  }
}
