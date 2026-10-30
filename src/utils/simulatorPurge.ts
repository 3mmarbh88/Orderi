/**
 * Orderi - WhatsApp Simulator Purge Utility
 * Eliminates all mock delivery groups, simulated group links, and synthetic orders
 * that were generated or intercepted during earlier simulator iterations.
 */

export const SIMULATED_MOCK_GROUPS: readonly string[] = [
  'قروب مناديب وتوصيل البحرين 🇧🇭',
  'قروب كباتن وتجار المنامة والرفاع 📦',
  'قروب توصيل المحرق والحد 🚗',
  'طلبات المحافظة الشمالية السريعة ⚡',
  'سوق البحرين للتوصيل الفوري 🇧🇭',
  'توصيل كباتن مدينة عيسى وحمد 📍',
  'شبكة مناديب البحرين للتوصيل 🚗',
  'قروب تجار ومناديب سار والجنبية 📦',
  'قروب مندوبي البحرين 🇧🇭',
  'طلبات التوصيل - المنامة والمحرق',
  'توصيل سريع الرفاع ومدينة عيسى',
  'شبكة مناديب التوصيل السريع',
];

/**
 * Returns true if the group name matches any simulated/mock group
 */
export function isSimulatedMockGroup(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  return SIMULATED_MOCK_GROUPS.some(
    (mock) => mock === trimmed || trimmed.includes(mock) || mock.includes(trimmed)
  );
}

/**
 * Comprehensive purge of simulator groups, synthetic links, and mock orders from browser storage
 */
export function purgeSimulatorArtifactsFromStorage(): {
  purgedGroupsCount: number;
  purgedLinksCount: number;
  purgedOrdersCount: number;
} {
  let purgedGroupsCount = 0;
  let purgedLinksCount = 0;
  let purgedOrdersCount = 0;

  try {
    // 1. Purge orderi_detected_incoming_groups
    const savedDetected = localStorage.getItem('orderi_detected_incoming_groups');
    if (savedDetected) {
      const parsed = JSON.parse(savedDetected);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((g: any) => typeof g === 'string' && !isSimulatedMockGroup(g));
        purgedGroupsCount += (parsed.length - cleaned.length);
        localStorage.setItem('orderi_detected_incoming_groups', JSON.stringify(cleaned));
      }
    }

    // 2. Purge orderi_my_whatsapp_groups
    const savedMyGroups = localStorage.getItem('orderi_my_whatsapp_groups');
    if (savedMyGroups) {
      const parsed = JSON.parse(savedMyGroups);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((g: any) => typeof g === 'string' && !isSimulatedMockGroup(g));
        purgedGroupsCount += (parsed.length - cleaned.length);
        localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(cleaned));
      }
    }

    // 3. Purge orderi_whatsapp_connection_v2
    const savedConn = localStorage.getItem('orderi_whatsapp_connection_v2');
    if (savedConn) {
      const parsed = JSON.parse(savedConn);
      if (parsed && Array.isArray(parsed.groups)) {
        const cleaned = parsed.groups.filter((g: any) => typeof g === 'string' && !isSimulatedMockGroup(g));
        localStorage.setItem('orderi_whatsapp_connection_v2', JSON.stringify({
          ...parsed,
          groups: cleaned,
        }));
      }
    }

    // 4. Purge orderi_discovered_group_links
    const savedLinks = localStorage.getItem('orderi_discovered_group_links');
    if (savedLinks) {
      const parsed = JSON.parse(savedLinks);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((l: any) => 
          !isSimulatedMockGroup(l.sourceGroup) && 
          !isSimulatedMockGroup(l.title) &&
          !l.id?.startsWith('grp-mock-') &&
          !l.url?.includes('example')
        );
        purgedLinksCount += (parsed.length - cleaned.length);
        localStorage.setItem('orderi_discovered_group_links', JSON.stringify(cleaned));
      }
    }

    // 5. Purge orderi_filter_settings
    const savedFilter = localStorage.getItem('orderi_filter_settings');
    if (savedFilter) {
      const parsed = JSON.parse(savedFilter);
      if (parsed) {
        let changed = false;
        if (Array.isArray(parsed.selectedGroups)) {
          const cleanedSelected = parsed.selectedGroups.filter((g: string) => !isSimulatedMockGroup(g));
          if (cleanedSelected.length !== parsed.selectedGroups.length) {
            parsed.selectedGroups = cleanedSelected;
            changed = true;
          }
        }
        if (Array.isArray(parsed.customGroups)) {
          const cleanedCustom = parsed.customGroups.filter((g: string) => !isSimulatedMockGroup(g));
          if (cleanedCustom.length !== parsed.customGroups.length) {
            parsed.customGroups = cleanedCustom;
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem('orderi_filter_settings', JSON.stringify(parsed));
        }
      }
    }

    // 6. Purge orderi_real_orders
    const savedOrders = localStorage.getItem('orderi_real_orders');
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((o: any) =>
          !isSimulatedMockGroup(o.groupName) &&
          o.source !== 'simulation' &&
          o.source !== 'spider_crawler' &&
          !o.id?.startsWith('ord-spider-') &&
          !o.id?.startsWith('ord-showcase-')
        );
        purgedOrdersCount += (parsed.length - cleaned.length);
        localStorage.setItem('orderi_real_orders', JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.warn('[SimulatorPurge] Storage purge error:', e);
  }

  return { purgedGroupsCount, purgedLinksCount, purgedOrdersCount };
}
