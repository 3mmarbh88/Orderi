import test from 'node:test';
import assert from 'node:assert/strict';
import { hasExplicitOrderIntent, parseWhatsAppOrderText } from '../src/utils/orderParser.ts';
import { cleanAnnouncementText } from '../src/utils/orderDedup.ts';

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
