/**
 * Test Suite: Orderi Cross-Group Deduplication & Repost Interceptor
 * اختبارات منع تكرار الأوردرات عند نشر المعلن نفس الطلب في عدة قروبات
 */

import {
  findDuplicateOrderMatch,
  isDuplicateOrder,
  rememberOrderFingerprint,
  registerOrderInDedupRegistry,
  isSameArea,
  isSameAdvertiser,
  calculateDeliveryTextSimilarity,
  extractBahrainPhone,
  normalizeAreaName
} from '../src/utils/orderDedup';
import { ParsedOrder } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('========================================================');
console.log('🧪 Starting Cross-Group Order Deduplication Test Suite');
console.log('========================================================');

// 1. Phone extraction tests
assert(extractBahrainPhone('97339123456') === '39123456', 'Extracts 8-digit Bahrain phone from E.164 string');
assert(extractBahrainPhone(undefined, 'للتواصل وتساب 36998877 جاهز') === '36998877', 'Extracts Bahrain phone from message text');
assert(extractBahrainPhone('0097366112233') === '66112233', 'Extracts 8-digit phone with international prefix');

// 2. Fuzzy Area Matching tests
assert(isSameArea('السيف', 'مجمع السيف') === true, 'Matches "السيف" with "مجمع السيف"');
assert(isSameArea('الرفاع الشرقي', 'الرفاع') === true, 'Matches "الرفاع الشرقي" with "الرفاع"');
assert(isSameArea('سوق واقف', 'مدينة حمد') === false, 'Distinguishes "سوق واقف" and "مدينة حمد" without overlap');
assert(isSameArea('مدينة عيسى', 'مدينه عيسي') === true, 'Matches normalized Arabic spellings for Isa Town');

// 3. Advertiser Identity tests
assert(
  isSameAdvertiser('39112233', 'متجر العطور', '39112233', 'معلن واتساب') === true,
  'Matches same advertiser when phone numbers match even if names differ'
);
assert(
  isSameAdvertiser('', 'مطبخ الضيافة', '', 'مطبخ الضيافة 🍲') === true,
  'Matches same advertiser by name ignoring emojis'
);
assert(
  isSameAdvertiser('', 'معلن بالقروب', '', 'كابتن') === false,
  'Does not match generic unnamed placeholders'
);

// 4. Text similarity tests
const post1 = 'مطلوب مندوب توصيل طلبية عطور من السيف مول إلى الرفاع 2.5 د.ب جاهز الحين للتواصل 39112233';
const post2 = 'مطلوب كابتن توصيل عطور وهدايا من السيف الى الرفاع دينارين ونصف واتساب 39112233';
const sim = calculateDeliveryTextSimilarity(post1, post2);
assert(sim >= 0.35, `Delivery text similarity should be significant (got ${sim.toFixed(2)})`);

// 5. Cross-Group Duplicate Detection across 3 groups
const initialOrder: ParsedOrder = {
  id: 'ord-grp-1',
  from: 'السيف',
  to: 'الرفاع الغربي',
  price: 2.5,
  isPriceUnspecified: false,
  rawText: post1,
  groupName: 'قروب مناديب وتوصيل البحرين 🇧🇭',
  senderName: 'متجر قصر العطور',
  senderPhone: '97339112233',
  receivedAt: new Date(),
  confidence: 95,
  type: 'طلب قروب واتساب',
  notes: '',
  status: 'pending',
  crossPostedGroups: ['قروب مناديب وتوصيل البحرين 🇧🇭'],
  duplicateCount: 1,
  match: { score: 90, distanceKm: 5, pickupDistanceKm: 2, dropoffDistanceKm: 5, feasible: true, reason: 'مطابق' } as any,
};

const existingOrders: ParsedOrder[] = [initialOrder];

// Repost 1 in Group 2 (Same advertiser, same route, same phone)
const repostGroup2: Partial<ParsedOrder> = {
  id: 'ord-grp-2',
  from: 'السيف مول',
  to: 'الرفاع',
  price: 2.5,
  rawText: post2,
  groupName: 'قروب كباتن وتجار المنامة والرفاع 📦',
  senderName: 'متجر قصر العطور 🌸',
  senderPhone: '39112233',
  receivedAt: new Date(Date.now() + 30000), // 30 seconds later
};

const match1 = findDuplicateOrderMatch(repostGroup2, existingOrders);
assert(match1 !== null && match1.id === 'ord-grp-1', 'Successfully identifies repost in Group 2 as duplicate of Group 1');

// Repost 2 in Group 3 (Same advertiser without phone in sender field, but phone in text)
const repostGroup3: Partial<ParsedOrder> = {
  id: 'ord-grp-3',
  from: 'السيف',
  to: 'الرفاع',
  price: 2.5,
  rawText: 'توصيل عطور من السيف إلى الرفاع بـ 2.5 د.ب هاتف 39112233',
  groupName: 'سوق البحرين للتوصيل الفوري 🇧🇭',
  senderName: 'معلن بالقروب',
  senderPhone: '',
  receivedAt: new Date(Date.now() + 60000), // 1 minute later
};

const match2 = findDuplicateOrderMatch(repostGroup3, existingOrders);
assert(match2 !== null && match2.id === 'ord-grp-1', 'Successfully identifies repost in Group 3 as duplicate via phone in text');

// 6. Distinct Order Test (Must NOT be flagged as duplicate)
const distinctOrder: Partial<ParsedOrder> = {
  id: 'ord-distinct-1',
  from: 'المحرق',
  to: 'الحد',
  price: 2.0,
  rawText: 'توصيل عباية من المحرق إلى الحد دينارين جاهز',
  groupName: 'قروب توصيل المحرق والحد 🚗',
  senderName: 'دار العباية',
  senderPhone: '36990011',
  receivedAt: new Date(),
};

const matchDistinct = findDuplicateOrderMatch(distinctOrder, existingOrders);
assert(matchDistinct === null, 'Correctly preserves distinct delivery order without falsely flagging as duplicate');

// 7. Fast Synchronous In-Memory Registry Test (Prevents burst race conditions)
registerOrderInDedupRegistry(initialOrder);

const burstRepost: Partial<ParsedOrder> = {
  id: 'ord-burst-immediate',
  from: 'السيف',
  to: 'الرفاع الغربي',
  price: 2.5,
  rawText: post1,
  groupName: 'طلبات المحافظة الشمالية السريعة ⚡',
  senderName: 'متجر قصر العطور',
  senderPhone: '39112233',
  receivedAt: new Date(),
};

// Even with an empty external array, the in-memory synchronous registry catches it!
const burstMatch = findDuplicateOrderMatch(burstRepost, []);
assert(burstMatch !== null && burstMatch.id === 'ord-grp-1', 'Synchronous in-memory registry catches burst duplicates instantly');

console.log('========================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${failedTests} failures)`);
console.log('========================================================');

if (failedTests > 0) {
  process.exit(1);
}
