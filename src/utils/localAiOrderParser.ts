
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ORDERI_SERVER_URL } from './authManager';
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

  // Keep non-Android parsing unchanged; Android order intake
  // must pass the local and server-side verification gates.
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

    if (!localAI || typeof localAI.is_order !== 'boolean') {
      console.warn('[Orderi AI] Local classification was invalid.');
      return rejectAutomaticCreation();
    }

    // If both the rule parser and Gemma reject the message,
    // do not spend a server request on an obvious non-candidate.
    // If they disagree, Gemini is asked to resolve the conflict.
    if (!fallback.canCreateOrder && localAI.is_order !== true) {
      return rejectAutomaticCreation();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let verification: Response;

    try {
      verification = await fetch(
        `${ORDERI_SERVER_URL}/api/ai/classify-whatsapp-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rawText }),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!verification.ok) {
      console.warn(
        '[Orderi AI] Gemini verification returned HTTP',
        verification.status,
      );
      return rejectAutomaticCreation();
    }

    const result: unknown = await verification.json();

    if (!result || typeof result !== 'object') {
      return rejectAutomaticCreation();
    }

    const verified = result as Record<string, unknown>;

    if (
      verified.success !== true ||
      verified.is_order !== true ||
      typeof verified.confidence !== 'number' ||
      !Number.isFinite(verified.confidence) ||
      verified.confidence < 80
    ) {
      return rejectAutomaticCreation();
    }

    const verifiedFrom =
      typeof verified.pickup_area === 'string'
        ? verified.pickup_area.trim()
        : '';

    const verifiedTo =
      typeof verified.destination === 'string'
        ? verified.destination.trim()
        : '';

    if (
      !isValidAIPlace(verifiedFrom) ||
      !isValidAIPlace(verifiedTo) ||
      normalizePlace(verifiedFrom) === normalizePlace(verifiedTo)
    ) {
      return rejectAutomaticCreation();
    }

    // Do not invent prices. Preserve an explicit parser price.
    const price = fallback.price;

    // Keep parser locations when present; use verified locations
    // only when the parser did not find them.
    const from = fallback.from || verifiedFrom;
    const to = fallback.to || verifiedTo;

    if (
      !from ||
      !to ||
      normalizePlace(from) === normalizePlace(to)
    ) {
      return rejectAutomaticCreation();
    }

    // Recheck the passenger restriction immediately before allowing
    // automatic creation. AI output cannot override this restriction.
    if (fallback.passengerDetection.isForbidden) {
      return rejectAutomaticCreation();
    }

    return {
      ...fallback,
      from,
      to,
      price,
      isPriceUnspecified: price <= 0,
      confidence: Math.max(fallback.confidence, 80),
      canCreateOrder: true,
    };
  } catch (error) {
    console.warn(
      '[Orderi AI] Verification failed; automatic creation blocked:',
      error,
    );
    return rejectAutomaticCreation();
  }
}
