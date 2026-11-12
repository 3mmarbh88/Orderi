/**
 * Durable client-side order-closure tombstones and retryable server synchronization.
 *
 * A closed order is recorded before UI changes. Tombstones are intentionally not
 * truncated: dropping an old tombstone could allow Spider or stale server data to
 * resurrect an order after a later restart.
 */
export interface OrderClosureRecord {
  orderId: string;
  closedAt: string;
  reason: string;
  evidence?: unknown;
}

const CLOSED_IDS_KEY = 'orderi_closed_order_ids';
const PENDING_KEY = 'orderi_pending_order_closures';
const DISMISSED_IDS_KEY = 'orderi_notification_dismissed_order_ids';
const ORDER_CACHE_KEYS = ['orderi_real_orders', 'orderi_cached_orders'];

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function readStringArray(store: Storage, key: string): string[] {
  try {
    const value = JSON.parse(store.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function readPending(store: Storage): OrderClosureRecord[] {
  try {
    const value = JSON.parse(store.getItem(PENDING_KEY) || '[]');
    return Array.isArray(value)
      ? value.filter((item) => item && typeof item.orderId === 'string')
      : [];
  } catch {
    return [];
  }
}

/** Returns true if the order has a durable local closure tombstone. */
export function isOrderClosedLocally(orderId: string): boolean {
  if (!orderId) return false;
  const store = storage();
  return !!store && readStringArray(store, CLOSED_IDS_KEY).includes(orderId);
}

/**
 * Atomically persists the closure intent before any UI/notification side effects.
 * Repeated calls are safe and preserve the first closure timestamp/evidence.
 */
export function closeOrderPermanently(record: OrderClosureRecord): boolean {
  if (!record.orderId) return false;
  const store = storage();
  if (!store) return false;

  try {
    const closedIds = readStringArray(store, CLOSED_IDS_KEY);
    if (!closedIds.includes(record.orderId)) {
      closedIds.push(record.orderId);
      store.setItem(CLOSED_IDS_KEY, JSON.stringify(closedIds));
    }

    const dismissedIds = readStringArray(store, DISMISSED_IDS_KEY);
    if (!dismissedIds.includes(record.orderId)) {
      dismissedIds.push(record.orderId);
      store.setItem(DISMISSED_IDS_KEY, JSON.stringify(dismissedIds));
    }

    const pending = readPending(store);
    if (!pending.some((item) => item.orderId === record.orderId)) {
      pending.push({ ...record, closedAt: record.closedAt || new Date().toISOString() });
      store.setItem(PENDING_KEY, JSON.stringify(pending));
    }

    for (const key of ORDER_CACHE_KEYS) {
      try {
        const value = JSON.parse(store.getItem(key) || '[]');
        if (Array.isArray(value)) {
          store.setItem(key, JSON.stringify(value.filter((item) => item?.id !== record.orderId)));
        }
      } catch {
        // A malformed optional cache must not undo the durable tombstone.
      }
    }
    return true;
  } catch (error) {
    console.warn('[Orderi] Could not persist order closure locally:', error);
    return false;
  }
}

/**
 * Retry closure synchronization after connectivity returns. Only remove an item
 * from the outbox after the server confirms success; otherwise it remains durable.
 */
export async function flushPendingOrderClosures(): Promise<{ synced: number; pending: number }> {
  const store = storage();
  if (!store || typeof fetch === 'undefined') return { synced: 0, pending: 0 };

  const pending = readPending(store);
  if (pending.length === 0) return { synced: 0, pending: 0 };

  let synced = 0;
  const remaining: OrderClosureRecord[] = [];
  for (const record of pending) {
    try {
      const response = await fetch('/api/orders/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (response.ok) synced += 1;
      else remaining.push(record);
    } catch {
      remaining.push(record);
    }
  }

  try {
    store.setItem(PENDING_KEY, JSON.stringify(remaining));
  } catch {
    // Keep the original outbox if storage cannot be updated.
  }
  return { synced, pending: remaining.length };
}
