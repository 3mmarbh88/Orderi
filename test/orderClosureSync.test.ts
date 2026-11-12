import assert from 'node:assert/strict';
import {
  closeOrderPermanently,
  flushPendingOrderClosures,
  isOrderClosedLocally,
} from '../src/utils/orderClosureSync';
import { checkIncomingMessageForClosure, isAdvertiserSenderMatch } from '../src/utils/orderClosureDetector';
import type { ParsedOrder } from '../src/types';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, String(value)); }
  removeItem(key: string): void { this.values.delete(key); }
  clear(): void { this.values.clear(); }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  get length(): number { return this.values.size; }
}

async function main() {
  const memory = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memory });
  memory.setItem('orderi_real_orders', JSON.stringify([{ id: 'closed-1' }, { id: 'active-1' }]));
  memory.setItem('orderi_cached_orders', JSON.stringify([{ id: 'closed-1' }, { id: 'cached-2' }]));

  const record = {
    orderId: 'closed-1',
    closedAt: '2026-11-12T10:00:00.000Z',
    reason: 'Advertiser confirmed courier',
    evidence: { groupName: 'Delivery group', replyText: 'حصلت مندوب' },
  };

  assert.equal(closeOrderPermanently(record), true);
  assert.equal(isOrderClosedLocally('closed-1'), true);
  assert.equal(isOrderClosedLocally('active-1'), false);
  assert.deepEqual(JSON.parse(memory.getItem('orderi_real_orders') || '[]'), [{ id: 'active-1' }]);
  assert.deepEqual(JSON.parse(memory.getItem('orderi_cached_orders') || '[]'), [{ id: 'cached-2' }]);

  // Duplicate close events must not create duplicate tombstones or outbox rows.
  closeOrderPermanently(record);
  assert.equal(JSON.parse(memory.getItem('orderi_closed_order_ids') || '[]').filter((id: string) => id === 'closed-1').length, 1);
  assert.equal(JSON.parse(memory.getItem('orderi_pending_order_closures') || '[]').length, 1);

  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  const result = await flushPendingOrderClosures();
  assert.equal(calls, 1);
  assert.deepEqual(result, { synced: 1, pending: 0 });
  assert.deepEqual(JSON.parse(memory.getItem('orderi_pending_order_closures') || '[]'), []);
  globalThis.fetch = originalFetch;


  // Sender matching must not accept partial names or infer identity from advert text.
  assert.equal(isAdvertiserSenderMatch('Abu Ali', '', 'Abu Ali Delivery', '', 'Abu Ali'), false);
  assert.equal(isAdvertiserSenderMatch('Abu Ali', '97333334444', 'Someone Else', '33334444'), true);

  const makeOrder = (id: string): ParsedOrder => ({
    id,
    from: 'المنامة',
    to: 'المحرق',
    price: 2,
    rawText: 'من المنامة إلى المحرق 2 دينار',
    groupName: 'Delivery Group',
    senderName: 'Advertiser One',
    senderPhone: '97333334444',
    receivedAt: new Date(Date.now() - 60_000),
    confidence: 95,
    type: 'whatsapp_notification',
    status: 'pending',
    match: {} as ParsedOrder['match'],
  });

  const ambiguous = checkIncomingMessageForClosure({
    text: 'حصلت مندوب',
    senderName: 'Advertiser One',
    senderPhone: '33334444',
    groupName: 'Delivery Group',
    timestamp: Date.now(),
    messageId: 'ambiguous-two-orders',
    isGroup: true,
  }, [makeOrder('order-a'), makeOrder('order-b')]);
  assert.equal(ambiguous, null, 'must not guess when advertiser has multiple active orders');

  const unique = checkIncomingMessageForClosure({
    text: 'حصلت مندوب',
    senderName: 'Advertiser One',
    senderPhone: '33334444',
    groupName: 'Delivery Group',
    timestamp: Date.now(),
    messageId: 'unique-one-order',
    isGroup: true,
  }, [makeOrder('order-c')]);
  assert.equal(unique?.orderId, 'order-c', 'explicit closure from the matching advertiser closes the unique order');

  console.log('orderClosureSync tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
