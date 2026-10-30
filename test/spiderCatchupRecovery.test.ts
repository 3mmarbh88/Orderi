import { 
  evaluateCatchupCandidate, 
  runSpiderCatchupRecovery, 
  CatchupCandidateMessage 
} from '../src/utils/spiderCatchupRecovery';
import { 
  checkIncomingMessageForClosure, 
  extractClosureKeywords,
  isFalsePositiveClosureUsage, 
  analyzeStickerSignal 
} from '../src/utils/orderClosureDetector';
import { ParsedOrder } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`, details ? details : '');
  }
}

console.log('========================================================');
console.log('🧪 Starting Spider Catch-up Recovery Test Suite');
console.log('========================================================\n');

// Mock order for thread closure testing
const mockOrder: ParsedOrder = {
  id: 'order-bh-1',
  from: 'الرفاع',
  to: 'مدينة عيسى',
  price: 2.5,
  isPriceUnspecified: false,
  rawText: 'مطلوب مندوب توصيل طلب حلويات من الرفاع إلى مدينة عيسى سعر 2.5 دينار',
  groupName: 'قروب توصيل البحرين',
  senderName: 'أم أحمد للحلويات',
  senderPhone: '97339111222',
  receivedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
  confidence: 90,
  type: 'طلب واتساب',
  notes: '',
  status: 'pending',
  match: {
    score: 90,
    startMatched: true,
    destinationMatched: true,
    priceMatched: true,
    distanceMatched: true,
    timeMatched: true,
    distanceKm: null,
    statusLabel: 'طلب ممتاز',
    statusColor: 'emerald',
  },
};

// 1. Arabic Dialect Closure Expressions
console.log('--- Test Group 1: Arabic Dialect Closure Expressions ---');
const arabicClosurePhrases = [
  'حصلت مندوب خلاص شكراً',
  'محجوز الطلب',
  'انحجز مع كابتن',
  'الطلب محجوزة خلاص',
  'حصل عليه مندوب بالقروب',
  'أخذه مندوب قبل شوي',
  'الطلب مع المندوب الحين',
  'تم الاستلام والتسليم خلاص',
  'الطلب خلص وانتهى',
  'شالوه الشباب',
  'تم خلاص',
  'تم اخذه من كابتن',
];

for (const phrase of arabicClosurePhrases) {
  const result = checkIncomingMessageForClosure(
    {
      text: phrase,
      senderName: 'أم أحمد للحلويات',
      senderPhone: '97339111222',
      groupName: 'قروب توصيل البحرين',
      timestamp: Date.now() - 10 * 60 * 1000,
    },
    [mockOrder]
  );
  assert(
    result !== null && result.isMatch && result.verdict === 'confirmed_closed',
    `Arabic closure detection: "${phrase}"`,
    { result }
  );
}

// 2. English Closure Expressions
console.log('\n--- Test Group 2: English Closure Expressions ---');
const englishClosurePhrases = [
  'Order taken thanks',
  'Already booked by a driver',
  'Assigned to courier',
  'Delivery completed',
  'Delivered successfully',
  'This order is closed',
  'Order handled already',
];

const mockOrderEnglish: ParsedOrder = {
  ...mockOrder,
  id: 'order-bh-en',
  senderName: 'Burger Shop',
  senderPhone: '97339888777',
  rawText: 'Order from Juffair to Seef price 2.5 BD',
};

for (const phrase of englishClosurePhrases) {
  const result = checkIncomingMessageForClosure(
    {
      text: phrase,
      senderName: 'Burger Shop',
      senderPhone: '97339888777',
      groupName: 'قروب توصيل البحرين',
      timestamp: Date.now() - 5 * 60 * 1000,
    },
    [mockOrderEnglish]
  );
  assert(
    result !== null && result.isMatch && result.verdict === 'confirmed_closed',
    `English closure detection: "${phrase}"`,
    { result }
  );
}

// 3. Contextual Disambiguation (False Positive Prevention)
console.log('\n--- Test Group 3: Contextual Disambiguation (False Positive Prevention) ---');
const falsePositiveCases = [
  { text: 'توصيل كرتون تمور سكري فاخر من سوق المنامة للرفاع', reason: 'تمور (dates fruit)' },
  { text: 'سيتم التوصيل غداً بعد صلاة العصر', reason: 'سيتم (future tense)' },
  { text: 'هل تم التوصيل يا شباب؟', reason: 'هل تم (question asking)' },
  { text: 'تم تحديد السعر 3 دينار بحريني', reason: 'تم تحديد السعر (price definition)' },
  { text: 'تم الاستلام من البديع والتسليم في الحد سعر 3 دينار مطلوب مندوب', reason: 'delivery steps description in open ad' },
  { text: 'مطلوب استلام تمور من المحرق', reason: 'dates fruit item' }
];

for (const item of falsePositiveCases) {
  const isFP = isFalsePositiveClosureUsage(item.text);
  assert(
    isFP === true,
    `False positive correctly identified: "${item.text}" (${item.reason})`
  );
}

// 4. Emojis Indicating Closure
console.log('\n--- Test Group 4: Closure Emojis Detection ---');
const emojiCases = [
  { text: '✅', expected: true, label: 'Standalone checkmark emoji' },
  { text: '🤝 تم', expected: true, label: 'Handshake + done' },
  { text: '🔒 خلاص', expected: true, label: 'Lock emoji + done' },
  { text: '🚫 أخذوه', expected: true, label: 'Prohibited emoji + taken' },
  { text: '⛔ خلص', expected: true, label: 'No entry emoji + done' },
];

for (const ec of emojiCases) {
  const extracted = extractClosureKeywords(ec.text);
  assert(
    extracted.hasClosureIntent === ec.expected,
    `Closure emoji detection: ${ec.label} ("${ec.text}")`,
    { extracted }
  );
}

// 5. WhatsApp Stickers Analysis (Verified vs Unverified Caution)
console.log('\n--- Test Group 5: WhatsApp Stickers Analysis ---');
// Verified sticker with recognized completion emoji or caption
const verifiedResult = analyzeStickerSignal(
  '[ملصق]',
  {
    caption: 'تم التوصيل ✅',
    emoji: '✅',
    hasVisualData: true,
  }
);
assert(
  verifiedResult.isSticker && verifiedResult.isClosure === true && !verifiedResult.isAmbiguous,
  'Verified closure sticker correctly marked as closed'
);

// Unverified sticker with NO caption or unknown visual data:
// Strictly treated with caution (isAmbiguous = true) and NEVER falsely claimed to be understood!
const unverifiedResult = analyzeStickerSignal(
  '[ملصق]',
  {
    hasVisualData: false,
  }
);
assert(
  unverifiedResult.isSticker && unverifiedResult.isAmbiguous === true && unverifiedResult.isClosure === false,
  'Unverified sticker treated with caution (flagged as ambiguous, no false recognition claimed)'
);
assert(
  Boolean(unverifiedResult.diagnosticReason && unverifiedResult.diagnosticReason.includes('غير مؤكدة')),
  'Unverified sticker provides clear diagnostic logging'
);

// 6. Thread Context & Delayed Subsequent Replies
console.log('\n--- Test Group 6: Thread Context & Delayed Subsequent Replies ---');
const now = Date.now();
const adTimestamp = now - 30 * 60 * 1000; // 30 mins ago

// Case A: Ad was posted 30 mins ago, but 10 mins later the advertiser replied "تم"
const candidateWithDelayedClosure: CatchupCandidateMessage = {
  id: 'cand-1',
  groupName: 'قروب توصيل البحرين',
  senderName: 'أم أحمد للحلويات',
  senderPhone: '97339111222',
  rawText: 'مطلوب مندوب توصيل طلب حلويات من الرفاع إلى مدينة عيسى سعر 2.5 دينار',
  timestamp: adTimestamp,
};

const subsequentThreadA = [
  {
    id: 'reply-1',
    groupName: 'قروب توصيل البحرين',
    senderName: 'أم أحمد للحلويات',
    senderPhone: '97339111222',
    rawText: 'تم، حصلت مندوب يعطيكم العافية',
    timestamp: adTimestamp + 10 * 60 * 1000,
  }
];

const evalResultA = evaluateCatchupCandidate(
  candidateWithDelayedClosure,
  subsequentThreadA,
  new Set(),
  new Set()
);

assert(
  evalResultA.status === 'EXCLUDED_CLOSED' && evalResultA.closureEvidence !== undefined,
  'Delayed reply from advertiser ("تم، حصلت مندوب") correctly excludes ad from recovery',
  { evalResultA }
);

// Case B: Ad was posted, and another user quoted the ad saying "محجوز أخذه كابتن علي"
const candidateWithQuotedClosure: CatchupCandidateMessage = {
  id: 'cand-2',
  groupName: 'قروب توصيل البحرين',
  senderName: 'مطعم كرامي',
  senderPhone: '97339333444',
  rawText: 'طلب وجبة من كرامي سند إلى سار السعر دينارين ونص',
  timestamp: adTimestamp,
};

const subsequentThreadB = [
  {
    id: 'reply-2',
    groupName: 'قروب توصيل البحرين',
    senderName: 'كابتن علي',
    senderPhone: '97339888999',
    rawText: 'محجوز أخذه كابتن علي',
    rawQuotedText: 'طلب وجبة من كرامي سند إلى سار السعر دينارين ونص',
    timestamp: adTimestamp + 4 * 60 * 1000,
  }
];

const evalResultB = evaluateCatchupCandidate(
  candidateWithQuotedClosure,
  subsequentThreadB,
  new Set(),
  new Set()
);

assert(
  evalResultB.status === 'EXCLUDED_CLOSED',
  'Quoted reply ("محجوز أخذه كابتن علي") correctly excludes ad from recovery',
  { evalResultB }
);

// Case C: Genuinely OPEN ad: No closure messages in thread
const candidateOpen: CatchupCandidateMessage = {
  id: 'cand-3',
  groupName: 'قروب توصيل المنامة',
  senderName: 'مكتبة الزهراء',
  senderPhone: '97339555666',
  rawText: 'مطلوب استلام كتب من شارع المعارض بالمنامة إلى المحرق، التوصيل فوري السعر 3 دينار',
  timestamp: adTimestamp,
};

const subsequentThreadC = [
  {
    id: 'reply-3',
    groupName: 'قروب توصيل المنامة',
    senderName: 'مندوب محمد',
    senderPhone: '97339777111',
    rawText: 'السلام عليكم',
    timestamp: adTimestamp + 2 * 60 * 1000,
  }
];

const evalResultC = evaluateCatchupCandidate(
  candidateOpen,
  subsequentThreadC,
  new Set(),
  new Set()
);

assert(
  evalResultC.status === 'AVAILABLE_OPEN' && evalResultC.recoveredOrder !== undefined,
  'Genuinely open ad with no closure signals is correctly marked as AVAILABLE_OPEN and parsed into Radar',
  { evalResultC }
);

// 7. Full Batch Recovery Engine
console.log('\n--- Test Group 7: Full Batch Spider Catch-up Engine ---');
async function runAsyncTests() {
  const batchCandidates: CatchupCandidateMessage[] = [
    // 1. Open order
    {
      id: 'batch-1',
      groupName: 'قروب توصيل 1',
      senderName: 'متجر ورود',
      senderPhone: '97339000111',
      rawText: 'طلب باقة ورد من البسيتين إلى الجفير السعر 2.5 دينار فوري',
      timestamp: now - 40 * 60 * 1000,
    },
    // 2. Closed order by dialect keyword "حصلت"
    {
      id: 'batch-2',
      groupName: 'قروب توصيل 1',
      senderName: 'متجر إلكترونيات',
      senderPhone: '97339000222',
      rawText: 'توصيل شاحن من توبلي إلى عالي السعر دينارين',
      timestamp: now - 35 * 60 * 1000,
    },
    // 3. Ambiguous order with unverified sticker
    {
      id: 'batch-3',
      groupName: 'قروب توصيل 1',
      senderName: 'مخبز الأرز',
      senderPhone: '97339000333',
      rawText: 'توصيل فطائر من الدراز إلى كرانة السعر 1.5 دينار',
      timestamp: now - 25 * 60 * 1000,
    },
    // 4. Passenger ad (must be filtered)
    {
      id: 'batch-4',
      groupName: 'قروب توصيل 1',
      senderName: 'توصيل عائلي',
      senderPhone: '97339000444',
      rawText: 'توصيل مشوار بنات شخصين من سترة إلى المنامة',
      timestamp: now - 20 * 60 * 1000,
    }
  ];

  const allContextMessages = [
    ...batchCandidates,
    // Closure for batch-2
    {
      id: 'batch-reply-1',
      groupName: 'قروب توصيل 1',
      senderName: 'متجر إلكترونيات',
      senderPhone: '97339000222',
      rawText: 'حصلت مندوب يا جماعة شكراً لكم',
      timestamp: now - 30 * 60 * 1000,
    },
    // Unverified sticker for batch-3
    {
      id: 'batch-reply-2',
      groupName: 'قروب توصيل 1',
      senderName: 'مخبز الأرز',
      senderPhone: '97339000333',
      rawText: '[ملصق]',
      stickerData: { hasVisualData: false },
      timestamp: now - 22 * 60 * 1000,
    }
  ];

  const report = await runSpiderCatchupRecovery(
    allContextMessages,
    [] // active radar orders
  );

  assert(report.totalScanned === 6, `Batch scanned 6 candidate/context messages (got ${report.totalScanned})`);
  assert(report.recoveredOrders.length === 1, `Recovered exactly 1 open order (got ${report.recoveredOrders.length})`);
  assert(report.excludedClosedCount >= 1, `Excluded closed order count >= 1 (got ${report.excludedClosedCount})`);
  assert(report.flaggedAmbiguousCount >= 1, `Logged unverified sticker as ambiguous (got ${report.flaggedAmbiguousCount})`);

  console.log('\n========================================================');
  console.log(`📊 Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

void runAsyncTests();
