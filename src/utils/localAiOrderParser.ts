
import { Capacitor, registerPlugin } from '@capacitor/core';
import { findAreaByName } from '../data/bahrainAreas';
import {
  parseWhatsAppOrderText,
  hasExplicitOrderIntent,
  type RawParsedResult,
} from './orderParser';

interface LocalAIStatus {
  modelPresent: boolean;
  initialized: boolean;
  ready: boolean;
  modelPath?: string;
  model?: string;
}

interface LocalAIResult {
  ready: boolean;
  model: string;
}

interface LocalAIAnalysis {
  text: string;
  model: string;
  local: boolean;
}

export interface OrderiLocalAIPlugin {
  getStatus(): Promise<LocalAIStatus>;
  importModel(): Promise<{
    success: boolean;
    model: string;
    modelPath: string;
    bytes: number;
  }>;
  initialize(): Promise<LocalAIResult>;
  analyze(options: { text: string }): Promise<LocalAIAnalysis>;
}

export const LocalAI =
  registerPlugin<OrderiLocalAIPlugin>('OrderiLocalAI');

let initialization: Promise<boolean> | null = null;

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';

  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function parseModelJson(
  text: string,
): Record<string, unknown> | null {
  if (typeof text !== 'string' || !text.trim()) return null;

  const cleaned = text
    .replace(/```(?:json)?/gi, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start < 0 || end <= start) return null;

  try {
    const parsed: unknown = JSON.parse(
      cleaned.slice(start, end + 1),
    );

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function ensureModelReady(): Promise<boolean> {
  try {
    const status = await LocalAI.getStatus();

    if (status.ready) return true;
    if (!status.modelPresent) return false;

    if (!initialization) {
      initialization = LocalAI.initialize()
        .then((result) => !!result.ready)
        .catch(() => {
          initialization = null;
          return false;
        });
    }

    const ready = await initialization;

    if (!ready) initialization = null;

    return ready;
  } catch {
    initialization = null;
    return false;
  }
}

function normalizePlace(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isValidAIPlace(value: string): boolean {
  if (!value || value.length < 2 || value.length > 80) {
    return false;
  }

  // Reject generic answers instead of treating them as locations.
  const genericValues = [
    'غير محدد',
    'غير معروف',
    'غير مذكور',
    'unknown',
    'not specified',
    'null',
    'none',
    'n/a',
    'حسب طلب الزبون',
  ];

  const normalized = normalizePlace(value);

  return !genericValues.some(
    (item) => normalized === normalizePlace(item),
  );
}

/**
 * Uses on-device Gemma to help extract missing fields.
 *
 * Safety rules:
 * - The AI cannot invent or replace an explicitly parsed price.
 * - The AI cannot create an order without explicit delivery intent.
 * - Forbidden passenger requests cannot become orders.
 * - Existing parser locations take precedence over AI suggestions.
 */
export async function parseWhatsAppOrderTextWithLocalAI(
  rawText: string,
): Promise<RawParsedResult> {
  const fallback = parseWhatsAppOrderText(rawText);

  const rejectAutomaticCreation = (): RawParsedResult => ({
    ...fallback,
    canCreateOrder: false,
    confidence: Math.min(fallback.confidence, 49),
  });

  if (
    typeof rawText !== 'string' ||
    !rawText.trim()
  ) {
    return rejectAutomaticCreation();
  }

  // The model and all WhatsApp text classification run on-device.
  // Never send notification contents to a remote AI endpoint.
  if (Capacitor.getPlatform() !== 'android') {
    return fallback;
  }

  if (fallback.passengerDetection.isForbidden) {
    return rejectAutomaticCreation();
  }

  if (!hasExplicitOrderIntent(rawText)) {
    return rejectAutomaticCreation();
  }

  try {
    if (!(await ensureModelReady())) {
      console.warn('[Orderi AI] Local model is unavailable.');
      return rejectAutomaticCreation();
    }

    const localResponse = await LocalAI.analyze({ text: rawText });
    const localAI = parseModelJson(localResponse.text);

    if (
      !localAI ||
      typeof localAI.is_order !== 'boolean' ||
      typeof localAI.confidence !== 'number' ||
      !Number.isFinite(localAI.confidence)
    ) {
      console.warn('[Orderi AI] Local classification was invalid.');
      return rejectAutomaticCreation();
    }

    // Require agreement from the local model. A remote service is not used.
    if (localAI.is_order !== true || localAI.confidence < 80) {
      return rejectAutomaticCreation();
    }

    const verifiedFrom =
      typeof localAI.pickup_area === 'string'
        ? localAI.pickup_area.trim()
        : '';
    const verifiedTo =
      typeof localAI.destination === 'string'
        ? localAI.destination.trim()
        : '';

    // Existing parser locations win. AI-suggested locations are accepted
    // only if they resolve to a known Bahrain area or landmark.
    const aiFrom = isValidAIPlace(verifiedFrom)
      ? findAreaByName(verifiedFrom)?.name || ''
      : '';
    const aiTo = isValidAIPlace(verifiedTo)
      ? findAreaByName(verifiedTo)?.name || ''
      : '';

    const from = fallback.from || aiFrom;
    const to = fallback.to || aiTo;

    if (
      !from ||
      !to ||
      normalizePlace(from) === normalizePlace(to)
    ) {
      return rejectAutomaticCreation();
    }

    // Never let AI override the passenger-transport restriction.
    if (fallback.passengerDetection.isForbidden) {
      return rejectAutomaticCreation();
    }

    // Price and phone come only from explicit deterministic extraction;
    // AI is not allowed to invent them.
    const price = fallback.price;

    return {
      ...fallback,
      from,
      to,
      price,
      isPriceUnspecified: price <= 0,
      confidence: Math.max(fallback.confidence, Math.min(100, localAI.confidence)),
      canCreateOrder: true,
    };
  } catch (error) {
    console.warn(
      '[Orderi AI] Local analysis failed; automatic creation blocked:',
      error,
    );
    return rejectAutomaticCreation();
  }
}
