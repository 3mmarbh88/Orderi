import { DiscoveredGroupLink } from '../types';

const STORAGE_KEY = 'orderi_discovered_group_links';

// Seed sample Bahrain delivery group links for realistic demonstration and testing
export const INITIAL_DISCOVERED_GROUPS: DiscoveredGroupLink[] = [
  {
    id: 'grp-seed-1',
    url: 'https://chat.whatsapp.com/Jk99BhDeliveryCaptains01',
    inviteCode: 'Jk99BhDeliveryCaptains01',
    title: 'قروب مناديب وتوصيل المحرق والحد 🇧🇭',
    senderName: 'أبو علي (مندوب محترف)',
    senderPhone: '97339112233',
    sourceGroup: 'قروب مندوبي البحرين 🇧🇭',
    rawText: 'حياكم يا شباب تم إنشاء قروب خاص بطلبات المحرق والحد السريعة فقط: https://chat.whatsapp.com/Jk99BhDeliveryCaptains01',
    capturedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'new',
    isMonitored: false,
  },
  {
    id: 'grp-seed-2',
    url: 'https://chat.whatsapp.com/RifaaQuickOrders2026',
    inviteCode: 'RifaaQuickOrders2026',
    title: 'توصيل عاجل الرفاع وسند وعالي 🛵',
    senderName: 'مطعم ومشويات الخليج',
    senderPhone: '97333448899',
    sourceGroup: 'طلبات التوصيل - المنامة والمحرق',
    rawText: 'السلام عليكم، تجار ومطاعم الرفاع وسند عملنا قروب مباشر لتوزيع الطلبات: https://chat.whatsapp.com/RifaaQuickOrders2026 حياكم شباب',
    capturedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'joined',
    isMonitored: true,
  },
];

/**
 * Extracts all WhatsApp group invite URLs from a text string
 */
export function extractGroupLinksFromText(
  rawText: string,
  senderName: string = 'معلن واتساب',
  senderPhone: string = '',
  sourceGroup: string = 'قروب واتساب'
): DiscoveredGroupLink[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Match chat.whatsapp.com or wa.me/join links
  const groupLinkRegex = /(?:https?:\/\/)?(?:chat\.whatsapp\.com|wa\.me\/join)\/([a-zA-Z0-9_-]{20,26})/gi;
  const matches = [...rawText.matchAll(groupLinkRegex)];

  if (matches.length === 0) return [];

  const discovered: DiscoveredGroupLink[] = [];

  for (const match of matches) {
    const inviteCode = match[1];
    const fullUrl = `https://chat.whatsapp.com/${inviteCode}`;

    // Extract or infer title from surrounding text
    const title = inferGroupTitle(rawText, match.index ?? 0, senderName, sourceGroup);

    discovered.push({
      id: `grp-link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: fullUrl,
      inviteCode,
      title,
      senderName: senderName || 'عضو بقروب التوصيل',
      senderPhone: senderPhone || '',
      sourceGroup: sourceGroup || 'قروب عام',
      rawText: rawText.trim(),
      capturedAt: new Date().toISOString(),
      status: 'new',
      isMonitored: false,
    });
  }

  return discovered;
}

/**
 * Inactive title inference heuristics from Arabic text lines
 */
function inferGroupTitle(
  fullText: string,
  linkIndex: number,
  senderName: string,
  sourceGroup: string
): string {
  // Split text by lines
  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Look for a line containing "قروب" or "مجموعة" or "مناديب" or "توصيل"
  const keywords = ['قروب', 'قروبات', 'مجموعة', 'مندوب', 'مناديب', 'توصيل', 'طلبات', 'شبكة', 'سائق', 'سواق'];

  for (const line of lines) {
    // If the line contains keyword and is reasonably short (title-like)
    if (keywords.some((kw) => line.includes(kw)) && line.length < 65) {
      // Clean up common link phrases
      const cleaned = line
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/(?:رابط|انضموا|حياكم|تفضلوا|هذا|الرابط|للانضمام|للتسجيل|اضغط|هنا)[\s:]*/gi, '')
        .trim();
      if (cleaned.length > 4) {
        return cleaned;
      }
    }
  }

  // Fallback: check first line if clean
  if (lines.length > 0 && lines[0].length < 45 && !lines[0].includes('http')) {
    return lines[0];
  }

  return `قروب توصيل جديد (من ${senderName || sourceGroup})`;
}

/**
 * LocalStorage storage helpers
 */
export function getStoredDiscoveredGroupLinks(): DiscoveredGroupLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse discovered group links from localStorage:', err);
  }
  return INITIAL_DISCOVERED_GROUPS;
}

export function saveDiscoveredGroupLinks(links: DiscoveredGroupLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (err) {
    console.error('Failed to save discovered group links to localStorage:', err);
  }
}
