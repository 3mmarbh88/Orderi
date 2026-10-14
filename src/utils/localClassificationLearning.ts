import { normalizeArabicText } from '../data/bahrainAreas';

export type ClassificationLabel = 'order' | 'advertisement';
export interface ClassificationCorrection {
  id: string;
  text: string;
  normalizedText: string;
  label: ClassificationLabel;
  at: number;
  sourceGroup?: string;
}
const STORAGE_KEY = 'orderi_local_classification_corrections';
const MAX_CORRECTIONS = 300;

function safeStorage(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export function normalizeClassificationText(text: string): string {
  return normalizeArabicText(String(text || ''))
    .replace(/(?:\+?973|00973)?\s*[36]\d{7}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getClassificationCorrections(): ClassificationCorrection[] {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      item && typeof item.normalizedText === 'string' &&
      (item.label === 'order' || item.label === 'advertisement')
    ).slice(-MAX_CORRECTIONS);
  } catch { return []; }
}

export function saveClassificationCorrection(
  text: string,
  label: ClassificationLabel,
  sourceGroup?: string
): ClassificationCorrection | null {
  const normalizedText = normalizeClassificationText(text);
  if (!normalizedText || normalizedText.length < 4) return null;
  const storage = safeStorage();
  if (!storage) return null;
  const correction: ClassificationCorrection = {
    id: `correction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: String(text).slice(0, 1500),
    normalizedText,
    label,
    at: Date.now(),
    sourceGroup: sourceGroup ? String(sourceGroup).slice(0, 120) : undefined,
  };
  const previous = getClassificationCorrections();
  const next = [...previous, correction].slice(-MAX_CORRECTIONS);
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orderi:classification-correction', { detail: { label } }));
    }
    return correction;
  } catch { return null; }
}

export interface LearnedClassification {
  label: ClassificationLabel;
  match: 'exact' | 'similar-suggestion';
  examples: number;
  shouldAutoApply: boolean;
}

function tokenSimilarity(a: string, b: string): number {
  const left = new Set(a.split(/\s+/).filter((x) => x.length > 1));
  const right = new Set(b.split(/\s+/).filter((x) => x.length > 1));
  if (!left.size || !right.size) return 0;
  let common = 0;
  left.forEach((token) => { if (right.has(token)) common++; });
  return common / (left.size + right.size - common);
}

/**
 * Exact user corrections may be reused. Similar messages are suggestions only:
 * they never auto-override the classifier, and need multiple consistent examples.
 */
export function findLearnedClassification(text: string): LearnedClassification | null {
  const normalized = normalizeClassificationText(text);
  if (!normalized) return null;
  const corrections = getClassificationCorrections();
  const exact = corrections.filter((item) => item.normalizedText === normalized);
  if (exact.length) {
    const latest = exact[exact.length - 1];
    const opposite = exact.some((item) => item.label !== latest.label);
    if (!opposite) return { label: latest.label, match: 'exact', examples: exact.length, shouldAutoApply: true };
    return null;
  }

  const candidates = corrections
    .map((item) => ({ item, similarity: tokenSimilarity(normalized, item.normalizedText) }))
    .filter(({ similarity }) => similarity >= 0.9)
    .sort((a, b) => b.similarity - a.similarity);
  if (candidates.length < 2) return null;
  const top = candidates.slice(0, 5);
  const labels = new Set(top.map(({ item }) => item.label));
  if (labels.size !== 1) return null;
  return {
    label: top[0].item.label,
    match: 'similar-suggestion',
    examples: top.length,
    shouldAutoApply: false,
  };
}

export function getLocalClassificationStats() {
  const corrections = getClassificationCorrections();
  return {
    totalCorrections: corrections.length,
    orderCorrections: corrections.filter((item) => item.label === 'order').length,
    advertisementCorrections: corrections.filter((item) => item.label === 'advertisement').length,
    uniqueTexts: new Set(corrections.map((item) => item.normalizedText)).size,
  };
}
