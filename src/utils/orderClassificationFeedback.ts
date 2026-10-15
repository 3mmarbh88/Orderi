import { normalizeArabicText } from '../data/bahrainAreas';

export type OrderClassificationLabel = 'order' | 'advertisement';
const STORAGE_KEY = 'orderi_classification_feedback_v1';
const MAX_FEEDBACK = 250;

function normalizeFeedbackText(value: unknown): string {
  return normalizeArabicText(String(value || ''))
    .replace(/(.)\1{2,}/gu, '$1')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readFeedback(): Array<{ text: string; label: OrderClassificationLabel; at: number }> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((x) =>
      x && typeof x.text === 'string' &&
      (x.label === 'order' || x.label === 'advertisement')
    ) : [];
  } catch {
    return [];
  }
}

export function saveOrderClassificationFeedback(
  rawText: string,
  label: OrderClassificationLabel,
): void {
  const text = normalizeFeedbackText(rawText);
  if (text.length < 8) return;
  try {
    const items = readFeedback().filter((x) => x.text !== text);
    items.push({ text, label, at: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_FEEDBACK)));
  } catch {}
}

/**
 * Conservative local learning: exact matches or very high token overlap only.
 * It never changes passenger-safety rules or invents missing route fields.
 */
export function getOrderClassificationFeedback(
  rawText: string,
): OrderClassificationLabel | null {
  const text = normalizeFeedbackText(rawText);
  if (text.length < 8) return null;
  const items = readFeedback();
  const exact = items.filter((x) => x.text === text).sort((a, b) => b.at - a.at)[0];
  if (exact) return exact.label;

  const tokens = new Set(text.split(' ').filter((x) => x.length > 1));
  if (tokens.size < 5) return null;
  let best: { label: OrderClassificationLabel; score: number; at: number } | null = null;
  for (const item of items) {
    const other = new Set(item.text.split(' ').filter((x) => x.length > 1));
    if (other.size < 5) continue;
    const intersection = [...tokens].filter((token) => other.has(token)).length;
    const score = intersection / new Set([...tokens, ...other]).size;
    if (score >= 0.9 && (!best || score > best.score || (score === best.score && item.at > best.at))) {
      best = { label: item.label, score, at: item.at };
    }
  }
  return best?.label || null;
}
