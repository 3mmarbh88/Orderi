/**
 * Test Suite: Orderi Conversation Source Discriminator & Privacy Shield
 * اختبارات التمييز الصارم بين مصادر الرسائل وحماية الخصوصية
 */

import {
  discriminateConversationSource,
  canMessageCreateRadarOrder,
  canMessageCloseRadarOrder,
  canForwardToCloudAI,
  isGroupAuthorizedByFilter,
  inspectChatJid,
  isPrivateChatPlaceholder,
  recordAmbiguousSourceDiagnostic,
  getAmbiguousSourceDiagnostics,
  clearAmbiguousSourceDiagnostics
} from '../src/utils/conversationSourceDiscriminator';
import { checkIncomingMessageForClosure } from '../src/utils/orderClosureDetector';
import { evaluateCatchupCandidate } from '../src/utils/spiderCatchupRecovery';
import { classifyPrivateWhatsAppMessage } from '../src/utils/personalChatClassifier';
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
console.log('🧪 Starting Conversation Source Discrimination Test Suite');
console.log('========================================================');

// Test Group 1: Strict Rejection of Personal 1-on-1 Messages
console.log('\n--- Test Group 1: Strict Rejection of Personal 1-on-1 Messages ---');

const friendMessageWithDeliveryKeywords = {
  isGroup: false,
  isDirectPrivate: true,
  chatId: '97339123456@s.whatsapp.net',
  title: 'أحمد صديق',
  senderName: 'أحمد',
  rawText: 'هلا كابتن وينك اليوم؟ محتاج مندوب ضروري عندي توصيل للرفاع بدينارين',
};

const res1 = discriminateConversationSource(friendMessageWithDeliveryKeywords);
assert(res1.sourceType === 'private_individual', 'Friend 1-on-1 chat classified as private_individual despite delivery keywords');
assert(!canMessageCreateRadarOrder(res1), 'Friend 1-on-1 chat CANNOT create radar order');
assert(!canForwardToCloudAI(res1), 'Friend 1-on-1 chat CANNOT be forwarded to cloud AI');

const friendGreeting = {
  isGroup: false,
  isDirectPrivate: true,
  chatId: '97336667788@s.whatsapp.net',
  title: 'محمد علي',
  rawText: 'شخبارك عساك بخير فاضي اليوم نطلع كوفي؟',
};
const res2 = discriminateConversationSource(friendGreeting);
assert(res2.sourceType === 'private_individual', 'Personal chat greeting classified as private_individual');
assert(!canMessageCreateRadarOrder(res2), 'Personal greeting CANNOT create order');

const privatePlaceholderGroup = {
  isGroup: false,
  groupName: 'محادثة خاصة 👤',
  title: 'صاحب الإعلان',
  rawText: 'عندي طلب توصيل من سوق المحرق إلى سلماباد سعر 2.5 د.ب',
};
const res3 = discriminateConversationSource(privatePlaceholderGroup);
assert(res3.sourceType === 'private_individual', 'Placeholder groupName "محادثة خاصة 👤" classified as private_individual');
assert(!canMessageCreateRadarOrder(res3), 'Placeholder private chat CANNOT create order');

// Test Group 2: Personal Message Classifier Never Allows Orders
console.log('\n--- Test Group 2: classifyPrivateWhatsAppMessage Direct Private Exclusion ---');

const privateClassEval1 = classifyPrivateWhatsAppMessage(
  'عندي طلب توصيل من الرفاع إلى مدينة حمد سعر 3 دينار محتاج مندوب',
  'صديق من المعارف',
  '97339001122',
  true
);
assert(privateClassEval1.isActionableOrder === false, 'classifyPrivateWhatsAppMessage returns isActionableOrder: false for private message');

const privateClassEval2 = classifyPrivateWhatsAppMessage(
  'هلا وغلا شخبارك',
  'Ali',
  '97333445566',
  true
);
assert(privateClassEval2.isActionableOrder === false, 'Casual greeting in private chat returns isActionableOrder: false');

// Test Group 3: Prevention of Private Messages Closing Delivery Group Orders
console.log('\n--- Test Group 3: Friend Private Messages Never Close Orders ---');

const mockOrder: ParsedOrder = {
  id: 'order-101',
  from: 'المنامة',
  to: 'الرفاع',
  price: 2.5,
  isPriceUnspecified: false,
  rawText: 'طلب توصيل من المنامة إلى الرفاع 2.5 دينار',
  groupName: 'قروب توصيل كباتن البحرين 🇧🇭',
  senderName: 'متجر العطور',
  senderPhone: '97339112233',
  receivedAt: new Date(Date.now() - 1000 * 60 * 10),
  confidence: 95,
  status: 'pending',
  source: 'android_notification',
  type: 'whatsapp_notification' as const,
  match: {
    score: 95,
    startMatched: true,
    destinationMatched: true,
    priceMatched: true,
    distanceMatched: true,
    timeMatched: true,
    distanceKm: 4.2,
    statusLabel: 'طلب ممتاز',
    statusColor: 'emerald',
  },
};

// Friend sends "تم" in a 1-on-1 private chat
const friendClosureInPrivate = checkIncomingMessageForClosure(
  {
    text: 'تم خلاص يعطيك العافية',
    senderName: 'أحمد صديق',
    groupName: 'محادثة خاصة 👤',
    isDirectPrivate: true,
    isGroup: false,
  },
  [mockOrder]
);
assert(friendClosureInPrivate === null, 'Private chat message with "تم" returns NULL (never closes active order)');

// Friend sends sticker in private chat
const friendStickerInPrivate = checkIncomingMessageForClosure(
  {
    text: 'ملصق/Sticker 🖼️',
    senderName: 'Ali Friend',
    groupName: '',
    isDirectPrivate: true,
    isGroup: false,
  },
  [mockOrder]
);
assert(friendStickerInPrivate === null, 'Private sticker returns NULL (never closes active order)');

// Genuine group advertiser sends "تم" in the actual delivery group
const genuineAdvertiserClosure = checkIncomingMessageForClosure(
  {
    text: 'تم خلاص حصلت مندوب شكراً',
    senderName: 'متجر العطور',
    senderPhone: '97339112233',
    groupName: 'قروب توصيل كباتن البحرين 🇧🇭',
    isDirectPrivate: false,
    isGroup: true,
  },
  [mockOrder]
);
assert(genuineAdvertiserClosure !== null && genuineAdvertiserClosure.isMatch, 'Authentic advertiser message in matching group successfully closes order');

// Test Group 4: Indeterminate & Ambiguous Sources
console.log('\n--- Test Group 4: Indeterminate & Ambiguous Sources ---');

clearAmbiguousSourceDiagnostics();

const ambiguousNoMarkers = {
  title: 'Unknown Header',
  rawText: 'من المنامة للرفاع دينارين',
};
const resAmbiguous = discriminateConversationSource(ambiguousNoMarkers);
assert(resAmbiguous.sourceType === 'undetermined_ambiguous', 'Message without group markers or JID is classified as undetermined_ambiguous');
assert(!canMessageCreateRadarOrder(resAmbiguous), 'Ambiguous source CANNOT create order');

const recordedDiags = getAmbiguousSourceDiagnostics();
assert(recordedDiags.length > 0, 'Ambiguous source event recorded locally for diagnostics');
assert(recordedDiags[0].decision === 'EXCLUDED_FOR_PRIVACY', 'Diagnostic logs decision as EXCLUDED_FOR_PRIVACY');

// Test Group 5: Authorized vs Unauthorized Delivery Groups
console.log('\n--- Test Group 5: Authorized vs Unauthorized Delivery Groups ---');

const genuineGroupEvent = {
  isGroup: true,
  isExplicitGroup: true,
  chatId: '1203630456789@g.us',
  conversationTitle: 'قروب توصيل مناديب البحرين',
  senderName: 'مطعم مشويات',
  rawText: 'طلب توصيل من سند للرفاع 2 دينار',
};

// With no specific group filter (all joined groups monitored):
const resGroupAll = discriminateConversationSource(genuineGroupEvent, { selectedGroups: [] });
assert(resGroupAll.sourceType === 'authorized_group', 'Genuine delivery group allowed when monitoring all joined groups');
assert(canMessageCreateRadarOrder(resGroupAll), 'Authorized group CAN create order in Radar');

// With selectedGroups filter that includes this group:
const resGroupFiltered = discriminateConversationSource(genuineGroupEvent, {
  selectedGroups: ['قروب توصيل مناديب البحرين', 'كباتن المحرق']
});
assert(resGroupFiltered.sourceType === 'authorized_group', 'Group in driver whitelist is authorized');

// With selectedGroups filter that DOES NOT include this group:
const resGroupExcluded = discriminateConversationSource(genuineGroupEvent, {
  selectedGroups: ['كباتن سار والجنبية']
});
assert(resGroupExcluded.sourceType === 'unauthorized_group', 'Group not in driver whitelist is classified as unauthorized_group');
assert(!canMessageCreateRadarOrder(resGroupExcluded), 'Unauthorized group CANNOT create order in Radar');

// Test Group 6: Spider Catch-up Recovery Source Protection
console.log('\n--- Test Group 6: Spider Catch-up Recovery Source Protection ---');

const privateCandidate = {
  id: 'catchup-pvt-1',
  rawText: 'طلب توصيل من الرفاع للمنامة 3 د.ب مطلوب مندوب',
  groupName: 'محادثة خاصة 👤',
  senderName: 'صديق قديم',
  timestamp: Date.now() - 1000 * 60 * 30,
  isGroup: false,
  isDirectPrivate: true,
  chatId: '97339998877@s.whatsapp.net',
};

const catchupPrivateResult = evaluateCatchupCandidate(privateCandidate, [privateCandidate]);
assert(catchupPrivateResult.status === 'IGNORED_NON_ORDER', 'Catch-up Recovery ignores candidate from private individual chat');

const groupCandidate = {
  id: 'catchup-grp-1',
  rawText: 'مطلوب استلام من السلمانية وتوصيل لمدينة عيسى سعر 2 دينار',
  groupName: 'مناديب البحرين السريعة 🇧🇭',
  senderName: 'صاحب المتجر',
  senderPhone: '97339556677',
  timestamp: Date.now() - 1000 * 60 * 20,
  isGroup: true,
  isDirectPrivate: false,
  chatId: '1203630987654@g.us',
};

const catchupGroupResult = evaluateCatchupCandidate(groupCandidate, [groupCandidate]);
assert(catchupGroupResult.status === 'AVAILABLE_OPEN', 'Catch-up Recovery accepts genuine delivery group candidate as AVAILABLE_OPEN');

// Test Group 7: Platform Fallback Stream & Edge Cases
console.log('\n--- Test Group 7: Platform Fallback Stream & Edge Cases ---');

// Fallback stream with groupName: 'واتساب' (crawler/webhook)
const sseFallbackEvent = {
  groupName: 'واتساب',
  title: 'واتساب',
  rawText: 'توصيل من توبلي إلى الجفير 2.5 د.ب',
  isGroup: true,
};
const resFallback = discriminateConversationSource(sseFallbackEvent);
assert(resFallback.sourceType === 'authorized_group', 'SSE fallback event with groupName "واتساب" is authorized');
assert(canMessageCreateRadarOrder(resFallback), 'SSE fallback can create Radar order');

// Android notification where conversationTitle is null but groupName is extracted
const androidGroupNullConvTitle = {
  isGroup: true,
  isDirectPrivate: false,
  groupName: 'قروب توصيل كباتن البحرين',
  conversationTitle: '',
  rawText: 'طلب مستعجل من الحد إلى عراد 2 دينار',
};
const resAndroidNullConv = discriminateConversationSource(androidGroupNullConvTitle);
assert(resAndroidNullConv.sourceType === 'authorized_group', 'Android group notification with empty conversationTitle is recognized as authorized_group');

// Legitimate delivery group whose title contains the word 'خاص' (e.g. توصيل طلبات خاصة)
const legitimateGroupWithKhasWord = {
  isGroup: true,
  groupName: 'قروب توصيل طلبات خاصة بالمناديب',
  rawText: 'من البديع إلى سار دينارين',
};
assert(!isPrivateChatPlaceholder('قروب توصيل طلبات خاصة بالمناديب'), 'Group named "قروب توصيل طلبات خاصة بالمناديب" is NOT a private placeholder');
const resKhasGroup = discriminateConversationSource(legitimateGroupWithKhasWord);
assert(resKhasGroup.sourceType === 'authorized_group', 'Group with "خاص" in title is recognized as authorized_group');

console.log('========================================================');
console.log(`📊 Test Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('========================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL SOURCE DISCRIMINATION & PRIVACY TESTS PASSED!');
  process.exit(0);
}
