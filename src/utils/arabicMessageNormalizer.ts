/**
 * Arabic WhatsApp text cleanup for matching and classification only.
 * Keep the original message separately for display, audit and user corrections.
 */
export function normalizeArabicMessageForMatching(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[\u200E-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    // Repeated characters are common in informal WhatsApp spelling.
    // Collapse 3+ repeats to 2, preserving ordinary double letters.
    .replace(/([ء-ي])\1{2,}/g, '$1$1')
    .replace(/[،؛,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
