import assert from 'node:assert/strict';
import {
  locateOriginalMessageSender,
  MessageRowDescriptor,
  normalizeWhatsAppSenderLabel,
  OriginalAdContext,
} from '../src/utils/originalMessageLocator';

function makeAd(
  orderId: string,
  senderDisplayName: string,
  rawText: string,
  sourceMessageTimestamp = 1700000000000,
): OriginalAdContext {
  return {
    orderId,
    rawText,
    groupName: 'قروب توصيل البحرين',
    senderDisplayName,
    sourceMessageTimestamp,
    sourceNotificationKey: `notif-${orderId}`,
    sourceMessageId: `msg-${orderId}`,
    shortcutId: `shortcut-${orderId}`,
  };
}

console.log('🧪 Starting Phase 2 Original Message → Sender Locator Verification');

// 1. Normalization preserves pure emoji, English, Arabic nicknames, and numeric unknowns
assert.equal(normalizeWhatsAppSenderLabel('~ أحمد'), 'احمد');
assert.equal(normalizeWhatsAppSenderLabel('~ أبو محمد:'), 'ابو محمد');
assert.equal(normalizeWhatsAppSenderLabel('~ 🚗'), '🚗');
assert.equal(normalizeWhatsAppSenderLabel('ABC'), 'abc');
assert.equal(normalizeWhatsAppSenderLabel('~ مجهول 123'), 'مجهول 123');
console.log('✅ PASS: Sender normalization preserves emojis (🚗), English (ABC), nicknames (أبو محمد), and numeric IDs');

// 2. Multi-advertiser group screen with all 6 requested identity categories
const multiAdvertiserRows: MessageRowDescriptor[] = [
  {
    rowIndex: 0,
    senderHeader: '~ أحمد',
    messageBody: 'توصيل من السيف إلى المحرق 2 دينار',
    timeLabel: '10:12',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 1,
    senderHeader: '~ أبو محمد',
    messageBody: 'توصيل من الرفاع إلى المنامة 2.5 دينار',
    timeLabel: '10:14',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 2,
    senderHeader: '~ 🚗',
    messageBody: 'توصيل من سار إلى العدلية 3 دينار',
    timeLabel: '10:15',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 3,
    senderHeader: '~ ABC',
    messageBody: 'توصيل من الحد إلى جزر أمواج 1.5 دينار',
    timeLabel: '10:16',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 4,
    senderHeader: '~ مجهول 123',
    messageBody: 'توصيل من عراد إلى توبلي 2 دينار',
    timeLabel: '10:18',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 5,
    senderHeader: '~ اسم مستعار',
    messageBody: 'توصيل من البديع إلى مدينة حمد 2 دينار',
    timeLabel: '10:20',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
];

// Even when "اسم مستعار" posted the LAST message in the group, selecting أحمد / أبو محمد / 🚗 / ABC / مجهول 123
// must locate their EXACT original message row, never the last message in the group!
const cases: Array<[string, string, number, string]> = [
  ['أحمد', 'توصيل من السيف إلى المحرق 2 دينار', 0, '~ أحمد'],
  ['أبو محمد', 'توصيل من الرفاع إلى المنامة 2.5 دينار', 1, '~ أبو محمد'],
  ['🚗', 'توصيل من سار إلى العدلية 3 دينار', 2, '~ 🚗'],
  ['ABC', 'توصيل من الحد إلى جزر أمواج 1.5 دينار', 3, '~ ABC'],
  ['مجهول 123', 'توصيل من عراد إلى توبلي 2 دينار', 4, '~ مجهول 123'],
  ['اسم مستعار', 'توصيل من البديع إلى مدينة حمد 2 دينار', 5, '~ اسم مستعار'],
];

for (const [sender, adText, expectedRowIndex, expectedBoundHeader] of cases) {
  const res = locateOriginalMessageSender(
    multiAdvertiserRows,
    makeAd(`case-${expectedRowIndex}`, sender, adText),
  );
  assert.equal(res.status, 'RESOLVED', `Expected RESOLVED for ${sender}, got ${res.status}: ${res.reason}`);
  assert.equal(res.matchedRowIndex, expectedRowIndex);
  assert.equal(res.boundSenderLabel, expectedBoundHeader);
  assert.equal(res.recommendedInteraction, 'CLICK_ROW_SENDER_OR_AVATAR');
}
console.log('✅ PASS: Located exact message row & bound sender for أحمد, أبو محمد, 🚗, ABC, مجهول 123, اسم مستعار in multi-advertiser group');

// 3. Stacked WhatsApp messages from the same sender (header omitted on 2nd bubble)
// AND divider protection so an unrelated block after a date divider is NOT misattributed
const stackedRows: MessageRowDescriptor[] = [
  {
    rowIndex: 0,
    senderHeader: '~ أبو محمد',
    messageBody: 'السلام عليكم شباب',
    timeLabel: '11:00',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 1,
    senderHeader: '', // WhatsApp omits header on consecutive message from same sender
    messageBody: 'توصيل من المنامة إلى سترة 2 دينار',
    timeLabel: '11:01',
    hasSenderProfileTarget: false,
    isLongClickable: true,
  },
  {
    rowIndex: 2,
    senderHeader: '',
    messageBody: 'اليوم',
    isSystemOrDateDivider: true,
  },
  {
    rowIndex: 3,
    senderHeader: '', // Orphan message after divider cannot safely claim أبو محمد
    messageBody: 'توصيل من سار إلى الرفاع 3 دينار',
    timeLabel: '11:05',
    hasSenderProfileTarget: false,
    isLongClickable: true,
  },
];

const stackedValid = locateOriginalMessageSender(
  stackedRows,
  makeAd('stacked-1', 'أبو محمد', 'توصيل من المنامة إلى سترة 2 دينار'),
);
assert.equal(stackedValid.status, 'RESOLVED');
assert.equal(stackedValid.matchedRowIndex, 1);
assert.equal(stackedValid.boundHeaderRowIndex, 0);
assert.equal(stackedValid.boundSenderLabel, '~ أبو محمد');
assert.equal(stackedValid.recommendedInteraction, 'CLICK_ROW_SENDER_OR_AVATAR');

const stackedBrokenByDivider = locateOriginalMessageSender(
  stackedRows,
  makeAd('stacked-2', 'أبو محمد', 'توصيل من سار إلى الرفاع 3 دينار'),
);
assert.equal(stackedBrokenByDivider.status, 'IDENTITY_NOT_CONFIRMED');
console.log('✅ PASS: Stacked message block inherits adjacent sender header safely & stops at system dividers');

// 4. Similar names in the same group + short ad (< 12 chars)
const similarNameRows: MessageRowDescriptor[] = [
  {
    rowIndex: 0,
    senderHeader: '~ أحمد',
    messageBody: 'سار 2 د',
    timeLabel: '09:10',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 1,
    senderHeader: '~ أحمد علي',
    messageBody: 'سار 2 د',
    timeLabel: '09:15',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
];

const shortAdExactSender = locateOriginalMessageSender(
  similarNameRows,
  makeAd('short-1', 'أحمد', 'سار 2 د'),
);
assert.equal(shortAdExactSender.status, 'RESOLVED');
assert.equal(shortAdExactSender.matchedRowIndex, 0);
assert.equal(shortAdExactSender.boundSenderLabel, '~ أحمد');

const wrongSenderCheck = locateOriginalMessageSender(
  similarNameRows,
  makeAd('short-2', 'أحمد البحريني', 'سار 2 د'),
);
assert.equal(wrongSenderCheck.status, 'IDENTITY_NOT_CONFIRMED');
console.log('✅ PASS: Distinguishes similar names (أحمد vs أحمد علي) and supports short ads (< 12 chars)');

// 5. Multiple identical ads from the same sender: reject ambiguity unless timestamp disambiguates
const duplicateAdsRows: MessageRowDescriptor[] = [
  {
    rowIndex: 0,
    senderHeader: '~ 🚗',
    messageBody: 'توصيل الرفاع إلى المنامة 2 دينار',
    timeLabel: '09:10',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
  {
    rowIndex: 1,
    senderHeader: '~ 🚗',
    messageBody: 'توصيل الرفاع إلى المنامة 2 دينار',
    timeLabel: '09:42',
    hasSenderProfileTarget: true,
    isLongClickable: true,
  },
];

const ambiguousDup = locateOriginalMessageSender(
  duplicateAdsRows,
  makeAd('dup-no-time', '🚗', 'توصيل الرفاع إلى المنامة 2 دينار', 0),
);
assert.equal(ambiguousDup.status, 'AMBIGUOUS_MULTIPLE_MATCHES');

const exactTime = new Date();
exactTime.setHours(9, 42, 0, 0);
const disambiguatedDup = locateOriginalMessageSender(
  duplicateAdsRows,
  makeAd('dup-with-time', '🚗', 'توصيل الرفاع إلى المنامة 2 دينار', exactTime.getTime()),
);
assert.equal(disambiguatedDup.status, 'RESOLVED');
assert.equal(disambiguatedDup.matchedRowIndex, 1);
console.log('✅ PASS: Multiple identical ads reject guessing when time is ambiguous & resolve uniquely when timestamp matches');

// 6. Fallback to Reply Privately only on the exact matched row when sender header has no profile click target
const replyPrivatelyOnlyRows: MessageRowDescriptor[] = [
  {
    rowIndex: 0,
    senderHeader: '~ أبو محمد',
    messageBody: 'توصيل المحرق إلى الحد 2 دينار',
    timeLabel: '14:05',
    hasSenderProfileTarget: false,
    isLongClickable: true,
  },
];
const longPressFallback = locateOriginalMessageSender(
  replyPrivatelyOnlyRows,
  makeAd('rp-1', 'أبو محمد', 'توصيل المحرق إلى الحد 2 دينار'),
);
assert.equal(longPressFallback.status, 'RESOLVED');
assert.equal(longPressFallback.recommendedInteraction, 'LONG_PRESS_EXACT_MESSAGE_FOR_REPLY_PRIVATELY');
console.log('✅ PASS: Falls back to exact-row long-press Reply Privately when header has no profile target');

// 7. Deleted / missing message must return NOT_FOUND and never tap anyone
const missingRes = locateOriginalMessageSender(
  multiAdvertiserRows,
  makeAd('deleted-1', 'أحمد', 'توصيل محذوف من مدينة عيسى إلى الزلاق 4 دينار'),
);
assert.equal(missingRes.status, 'NOT_FOUND');
console.log('✅ PASS: Deleted/missing original ad returns NOT_FOUND and never falls back to another advertiser');

console.log('🎉 All Phase 2 Original Message → Sender Locator tests passed!');
