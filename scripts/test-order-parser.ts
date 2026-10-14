import { strict as assert } from 'node:assert';
import { findAreaByName } from '../src/data/bahrainAreas';
import { parseWhatsAppOrderText } from '../src/utils/orderParser';

function testBahrainAlias(alias: string, expectedId: string): void {
  const area = findAreaByName(alias);
  assert.ok(area, `Expected to resolve area alias: ${alias}`);
  assert.equal(area.id, expectedId, `Alias should resolve to canonical area: ${alias}`);
}

testBahrainAlias('أبو قوة', 'bu_quwah');
testBahrainAlias('ابوقوة', 'bu_quwah');
testBahrainAlias('بو كوارة', 'bu_kowarah');
testBahrainAlias('أبو كواره', 'bu_kowarah');
testBahrainAlias('الوزي', 'lawzi');
testBahrainAlias('اللوزى', 'lawzi');

const buQuwahOrder = parseWhatsAppOrderText('أوردر من أبو قوة إلى مدينة عيسى 3 د.ب');
assert.equal(buQuwahOrder.from, 'بو قوة');
assert.equal(buQuwahOrder.to, 'مدينة عيسى');
assert.equal(buQuwahOrder.price, 3);
assert.equal(buQuwahOrder.canCreateOrder, true);
assert.equal(buQuwahOrder.orderCategory, 'delivery');

const buKowarahOrder = parseWhatsAppOrderText('اوردر من بو كوارة الى مدينة حمد');
assert.equal(buKowarahOrder.from, 'بو كوارة');
assert.ok(buKowarahOrder.to.includes('مدينة حمد'), 'Destination should resolve to canonical Hamad Town area');
assert.equal(buKowarahOrder.price, 0, 'Parser must not invent a price when none is stated');
assert.equal(buKowarahOrder.isPriceUnspecified, true);

const goodsOrder = parseWhatsAppOrderText('اوردر من بو كوارة إلى مدينة حمد كرتون');
assert.equal(goodsOrder.orderCategory, 'goods');


const roundaboutOrder = parseWhatsAppOrderText('أوردر من دوار 1 إلى مدينة عيسى');
assert.ok(roundaboutOrder.from.includes('مدينة حمد'), 'Numbered roundabouts must resolve to Hamad Town at area level only');
assert.equal(roundaboutOrder.to, 'مدينة عيسى');

const typoAreaOrder = parseWhatsAppOrderText('أوردر من الوزي إلى مدينة عيسى');
assert.equal(typoAreaOrder.from, 'اللوزي', 'Common misspelling الوزي should be normalized to اللوزي on Radar');

const coldStorageOrder = parseWhatsAppOrderText('أوردر من اللوزي إلى مدينة عيسى يحتاج تكييف ومكيف هواء');
assert.match(coldStorageOrder.notes, /حفظ بارد/, 'Explicit AC wording should flag cold storage');
const coldWordOrder = parseWhatsAppOrderText('توصيل من اللوزي إلى سار بارد');
assert.match(coldWordOrder.notes, /حفظ بارد/, 'Explicit cold wording should flag cold storage');

const passengerOrder = parseWhatsAppOrderText('توصيل شخص من أبو قوة إلى مدينة عيسى');
assert.equal(passengerOrder.passengerDetection.level, 'confirmed_passenger');
assert.equal(passengerOrder.orderCategory, 'passengers');

const travelAnnouncement = parseWhatsAppOrderText('طالع يوم الخميس الإمارات واتساب 33334444');
assert.equal(travelAnnouncement.canCreateOrder, false, 'Personal travel announcements must not appear on Radar');
assert.equal(travelAnnouncement.from, '');
assert.equal(travelAnnouncement.to, '');
assert.match(travelAnnouncement.notes, /إعلان سفر شخصي/);

const saudiTravelAnnouncement = parseWhatsAppOrderText('رايح السعودية يوم الخميس 36667777');
assert.equal(saudiTravelAnnouncement.canCreateOrder, false, 'A phone number must not turn a travel announcement into an order');

const actualDeliveryToSaudi = parseWhatsAppOrderText('مطلوب توصيل كرتون إلى السعودية رقم 33334444');
assert.equal(actualDeliveryToSaudi.canCreateOrder, true, 'Explicit delivery intent must not be suppressed as a travel announcement');

console.log('Orderi parser tests passed: Bahraini aliases, canonical routes, explicit prices, and passenger classification.');
