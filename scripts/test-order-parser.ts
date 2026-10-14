import { strict as assert } from 'node:assert';
import { findAreaByName } from '../src/data/bahrainAreas';
import { parseWhatsAppOrderText } from '../src/utils/orderParser';
import { saveClassificationCorrection, findLearnedClassification } from '../src/utils/localClassificationLearning';
import { parseWhatsAppOrderWithLocalAi } from '../src/utils/localAiOrderParser';

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

const actualDeliveryToSaudi = parseWhatsAppOrderText('توصيل كرتون من اللوزي إلى السعودية رقم 33334444');
assert.equal(actualDeliveryToSaudi.canCreateOrder, true, 'Explicit delivery intent must not be suppressed as a travel announcement');


// Local learning must be device-local and conservative.
const localMemory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => localMemory.get(key) ?? null,
    setItem: (key: string, value: string) => { localMemory.set(key, value); },
    removeItem: (key: string) => { localMemory.delete(key); },
    clear: () => localMemory.clear(),
  },
});

const correctedAdText = 'إعلان خدمات خاصة ورقم التواصل 33334444';
assert.ok(saveClassificationCorrection(correctedAdText, 'advertisement'));
const exactAdCorrection = findLearnedClassification('اعلان خدمات خاصة ورقم التواصل 33334444');
assert.equal(exactAdCorrection?.label, 'advertisement');
assert.equal(exactAdCorrection?.shouldAutoApply, true);

const localCorrectedParse = await parseWhatsAppOrderWithLocalAi(correctedAdText);
assert.equal(localCorrectedParse.canCreateOrder, false, 'An exact local ad correction must suppress the same message');
assert.match(localCorrectedParse.notes, /تصحيح محلي/);


const similarA = 'announcement delivery item pickup location route price timing group contact sender goods package parcel urgent client address note service details pickup-ready delivery-window tracking-confirmation';
const similarB = similarA.replace('urgent', 'priority');
const similarQuery = similarA.replace('urgent', 'express');
saveClassificationCorrection(similarA, 'advertisement');
saveClassificationCorrection(similarB, 'advertisement');
const similarSuggestion = findLearnedClassification(similarQuery);
assert.equal(similarSuggestion?.match, 'similar-suggestion');
assert.equal(similarSuggestion?.shouldAutoApply, false, 'Similar messages must never be auto-classified from examples alone');

const vagueTravelCorrection = 'طالع يوم الخميس الإمارات 34445555';
saveClassificationCorrection(vagueTravelCorrection, 'order');
const safeTravelCorrection = await parseWhatsAppOrderWithLocalAi(vagueTravelCorrection);
assert.equal(safeTravelCorrection.canCreateOrder, false, 'A positive correction without a trustworthy pickup/route must not invent an order');

const conflictText = 'إعلان خدمات خاصة ورقم التواصل 35556666';
saveClassificationCorrection(conflictText, 'advertisement');
saveClassificationCorrection(conflictText, 'order');
assert.equal(findLearnedClassification(conflictText), null, 'Conflicting local labels must not auto-classify a message');

console.log('Orderi parser tests passed: Bahraini aliases, canonical routes, explicit prices, and passenger classification.');
