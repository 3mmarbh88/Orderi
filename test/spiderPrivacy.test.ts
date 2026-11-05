import { runSpiderCatchupRecovery, evaluateSubsequentThreadClosure, evaluateCatchupCandidate } from '../src/utils/spiderCatchupRecovery';
import { spiderIngestMessage } from '../src/utils/spiderCrawler';
import { ParsedOrder } from '../src/types';
import { shouldReturnFastHeuristic } from '../src/utils/localAiOrderParser';

let total = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  total += 1;
  if (condition) console.log(`PASS: ${label}`);
  else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

const orderTime = Date.now() - 60_000;
const originalAd = {
  id: 'wa-ad-1',
  rawText: 'مطلوب توصيل من المنامة إلى المحرق 2 دينار',
  groupName: 'قروب التوصيل',
  senderName: 'أحمد',
  timestamp: orderTime,
  isGroup: true,
};

async function main() {
  const completeHeuristic = { sameAreaShorthand: false, canCreateOrder: true, from: 'المنامة', to: 'المحرق' } as any;
  assert(shouldReturnFastHeuristic(completeHeuristic), 'Hybrid mode returns a complete deterministic route without invoking Gemma');
  assert(!shouldReturnFastHeuristic(completeHeuristic, true), 'AI-first mode does not bypass Gemma for a complete deterministic route');
  assert(shouldReturnFastHeuristic({ ...completeHeuristic, sameAreaShorthand: true }, true), 'Explicit same-area shorthand remains on the deterministic safe path');
  // Private and unidentified messages must never enter catch-up recovery.
  const privateReport = await runSpiderCatchupRecovery([{
    id: 'private-1',
    rawText: 'مطلوب مندوب من المنامة إلى المحرق 2 دينار',
    groupName: 'صديق',
    senderName: 'صديق',
    timestamp: Date.now(),
    isGroup: false,
    isDirectPrivate: true,
    chatId: '97330000000@s.whatsapp.net',
  }]);
  assert(privateReport.recoveredOrders.length === 0, 'Catch-up rejects confirmed private chats');

  const unknownReport = await runSpiderCatchupRecovery([{
    id: 'unknown-1',
    rawText: 'مطلوب مندوب من المنامة إلى المحرق 2 دينار',
    groupName: 'قروب يبدو للتوصيل',
    senderName: 'معلن',
    timestamp: Date.now(),
  }]);
  assert(unknownReport.recoveredOrders.length === 0, 'Catch-up rejects messages without explicit group evidence');

  const duplicateReport = await runSpiderCatchupRecovery([{
    ...originalAd,
    id: 'duplicate-1',
  }], [{ id: 'spider-rec-duplicate-1' } as ParsedOrder]);
  assert(duplicateReport.recoveredOrders.length === 0, 'Catch-up detects an existing spider-rec prefixed order');

  // Verified group events are parsed from their real text; no placeholder route or price is allowed.
  const validCatchupReport = await runSpiderCatchupRecovery([{
    id: 'valid-catchup-1',
    rawText: 'مطلوب توصيل من المنامة إلى المحرق 2 دينار',
    groupName: 'قروب التوصيل',
    senderName: 'أحمد',
    timestamp: Date.now(),
    isGroup: true,
    isDirectPrivate: false,
    chatId: '120363000000000000@g.us',
  }]);
  assert(validCatchupReport.recoveredOrders.length === 1, 'Catch-up recovers a verified group message when the real parser finds a route');
  assert(validCatchupReport.recoveredOrders[0]?.from === 'المنامة' && validCatchupReport.recoveredOrders[0]?.to === 'المحرق', 'Catch-up uses the real parsed pickup and destination');
  assert(validCatchupReport.recoveredOrders[0]?.price === 2, 'Catch-up preserves the actual advertised price instead of a hard-coded amount');

  const compatibilityResult = evaluateCatchupCandidate({
    ...originalAd,
    id: 'sync-helper-1',
  }, [originalAd]);
  assert(!compatibilityResult.recoveredOrder, 'Synchronous compatibility helper never fabricates a Radar order');

  // A different member saying "تم" must not close another advertiser's order.
  const unrelatedFollowup = evaluateSubsequentThreadClosure(originalAd, [{
    id: 'followup-other',
    rawText: 'تم',
    groupName: originalAd.groupName,
    senderName: 'شخص آخر',
    timestamp: orderTime + 30_000,
    isGroup: true,
  }]);
  assert(!unrelatedFollowup.isClosed, 'Another group member cannot close the advertiser order');

  const advertiserFollowup = evaluateSubsequentThreadClosure(originalAd, [{
    id: 'followup-owner',
    rawText: 'حصلت',
    groupName: originalAd.groupName,
    senderName: 'أحمد',
    timestamp: orderTime + 30_000,
    isGroup: true,
  }]);
  assert(advertiserFollowup.isClosed, 'The original advertiser can close their own order');

  // Spider's standalone ingestion path must use the same owner-aware closure detector.
  const unlinkedSignal = await spiderIngestMessage(
    'تم', 'قروب التوصيل', 'شخص آخر', undefined, false, true, []
  );
  assert(unlinkedSignal.action !== 'CLOSED_ORDER', 'An unlinked closure word never closes an order');

  const activeOrder = {
    id: 'active-order-1',
    from: 'المنامة',
    to: 'المحرق',
    price: 2,
    rawText: originalAd.rawText,
    groupName: originalAd.groupName,
    senderName: 'أحمد',
    senderPhone: '',
    receivedAt: new Date(orderTime),
    status: 'pending',
  } as ParsedOrder;

  const matchedSignal = await spiderIngestMessage(
    'تم', originalAd.groupName, 'أحمد', undefined, false, true, [activeOrder]
  );
  assert(matchedSignal.action === 'CLOSED_ORDER', 'A confirmed owner-matched closure is recognized');

  console.log(`Spider privacy regression tests: ${total - failed}/${total} passed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
