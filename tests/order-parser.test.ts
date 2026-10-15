import test from 'node:test';
import assert from 'node:assert/strict';
import { hasExplicitOrderIntent, parseWhatsAppOrderText } from '../src/utils/orderParser.ts';
import { cleanAnnouncementText, findDuplicateOrderMatch } from '../src/utils/orderDedup.ts';

test('provider advertising delivery availability is not treated as a customer order', () => {
  assert.equal(
    hasExplicitOrderIntent('متوفر توصيل من المنامة إلى المحرق بسعر 2 دينار'),
    false,
  );
});

test('an explicit request for a delivery remains eligible for order parsing', () => {
  assert.equal(
    hasExplicitOrderIntent('مطلوب مندوب توصيل من المنامة إلى المحرق 2 دينار'),
    true,
  );
});

test('a route that starts and ends in the same area is not a valid order', () => {
  const parsed = parseWhatsAppOrderText('مطلوب توصيل من المحرق إلى المحرق 2 دينار');
  assert.equal(parsed.canCreateOrder, false);
});

test('exactly duplicated notification text is collapsed once', () => {
  const message = 'طلب توصيل من المنامة إلى المحرق بسعر 2 دينار';
  const once = cleanAnnouncementText({ rawText: message });
  const twice = cleanAnnouncementText({ rawText: message + ' ' + message });
  assert.equal(twice, once);
});


test('a repeated known area is parsed as a same-area delivery when request intent is explicit', () => {
  const parsed = parseWhatsAppOrderText('مطلوب توصيل محرق محرق 2 دينار');
  assert.equal(parsed.from, 'المحرق');
  assert.equal(parsed.to, 'المحرق');
  assert.equal(parsed.canCreateOrder, true);
});

test('common spelling variants normalize to canonical Bahrain areas', () => {
  const parsed = parseWhatsAppOrderText('مطلوب مندوب من منامه الى محرق 2 دينار');
  assert.equal(parsed.from, 'المنامة');
  assert.equal(parsed.to, 'المحرق');
  assert.equal(parsed.canCreateOrder, true);
});

test('different jobs with the same route and fare are not merged without message evidence', () => {
  const now = Date.now();
  const existing: any = {
    id: 'order-a',
    from: 'المنامة',
    to: 'المحرق',
    price: 2,
    rawText: 'مطلوب توصيل طلب مطعم من المنامة للمحرق',
    senderName: 'معلن أول',
    senderPhone: '97333333333',
    receivedAt: new Date(now),
    groupName: 'قروب أ',
  };
  const incoming: any = {
    id: 'order-b',
    from: 'المنامة',
    to: 'المحرق',
    price: 2,
    rawText: 'مطلوب استلام شحنة مختلفة من المنامة للمحرق',
    senderName: 'معلن ثان',
    senderPhone: '97336666666',
    receivedAt: new Date(now + 1000),
    groupName: 'قروب ب',
  };
  assert.equal(findDuplicateOrderMatch(incoming, [existing], now + 1000), null);
});
