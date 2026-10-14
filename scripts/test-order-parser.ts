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

const buQuwahOrder = parseWhatsAppOrderText('أوردر من أبو قوة إلى مدينة عيسى 3 د.ب');
assert.equal(buQuwahOrder.from, 'بو قوة');
assert.equal(buQuwahOrder.to, 'مدينة عيسى');
assert.equal(buQuwahOrder.price, 3);
assert.equal(buQuwahOrder.canCreateOrder, true);

const buKowarahOrder = parseWhatsAppOrderText('اوردر من بو كوارة الى مدينة حمد');
assert.equal(buKowarahOrder.from, 'بو كوارة');
assert.equal(buKowarahOrder.to, 'مدينة حمد');
assert.equal(buKowarahOrder.price, 0, 'Parser must not invent a price when none is stated');
assert.equal(buKowarahOrder.isPriceUnspecified, true);


const roundaboutOrder = parseWhatsAppOrderText('أوردر من دوار 1 إلى مدينة عيسى');
assert.equal(roundaboutOrder.from, 'مدينة حمد (الدوارات من 1 إلى 22)', 'Numbered roundabouts are resolved to town-level only');
assert.equal(roundaboutOrder.to, 'مدينة عيسى');

const passengerOrder = parseWhatsAppOrderText('توصيل شخص من أبو قوة إلى مدينة عيسى');
assert.equal(passengerOrder.passengerDetection.level, 'confirmed_passenger');

console.log('Orderi parser tests passed: Bahraini aliases, canonical routes, explicit prices, and passenger classification.');
