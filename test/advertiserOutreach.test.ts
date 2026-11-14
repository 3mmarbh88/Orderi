import assert from 'node:assert/strict';
import {
  cleanAdvertiserIdentityName,
  isMeaningfulAdvertiserName,
  resolveAdvertiserContact,
  getAdvertiserTargetPhone,
  classifyTextPhoneNumbers,
  normalizeBahrainPhone,
  formatFilterOutreachMessage,
  formatAdvertiserPrivateMessage,
  executePrivateAdvertiserOutreach,
  checkBackgroundOutreachAvailability,
  PrivateOutreachNativeBridge,
} from '../src/utils/whatsappPrivateOutreach';
import { isKnownGroupAdvertiser, registerKnownGroupAdvertiser } from '../src/utils/personalChatClassifier';
import { ParsedOrder } from '../src/types';

// Mock localStorage & window for Node test runner
const memoryStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memoryStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    memoryStore.delete(k);
  },
  clear: () => {
    memoryStore.clear();
  },
};

let windowOpenCount = 0;
let locationHrefWrites = 0;
(globalThis as any).window = {
  open: () => {
    windowOpenCount++;
    return null;
  },
  location: {
    set href(_val: string) {
      locationHrefWrites++;
    },
  },
};

const baseOrder: ParsedOrder = {
  id: 'order-base-1',
  rawText: 'طلب توصيل من العدلية إلى مدينة زايد 2 دينار',
  from: 'العدلية',
  to: 'مدينة زايد',
  price: 2.0,
  senderName: '~ اذكر الله',
  groupName: 'قروب توصيل البحرين',
  senderPhone: '',
  receivedAt: new Date(),
  confidence: 0.95,
  type: 'order',
  status: 'pending',
  match: {
    score: 90,
    startMatched: true,
    destinationMatched: true,
    priceMatched: true,
    distanceMatched: true,
    timeMatched: true,
    distanceKm: 5,
    statusLabel: 'طلب ممتاز',
    statusColor: 'emerald',
  },
};

console.log('🧪 Starting Zero-Registry Advertiser Outreach Test Suite');

// Test 1: Legacy advertiser registry / vault localStorage keys are purged and never written
memoryStore.set('orderi_advertiser_phone_vault', JSON.stringify({ 'اذكر الله': '97339123456' }));
memoryStore.set('orderi_known_group_advertisers', JSON.stringify(['اذكر الله']));
registerKnownGroupAdvertiser('~ اذكر الله');
assert.equal(isKnownGroupAdvertiser('~ اذكر الله'), false);
const legacyResolved = resolveAdvertiserContact(baseOrder);
assert.equal(memoryStore.has('orderi_advertiser_phone_vault'), false);
assert.equal(memoryStore.has('orderi_known_group_advertisers'), false);
assert.equal(legacyResolved.phone, null);
assert.equal(legacyResolved.advertiserVerified, true);
assert.equal(legacyResolved.confidence, 'name_only_verified');
assert.equal(legacyResolved.source, 'sender_identity_only');
console.log('✅ PASS: Zero advertiser database/registry; legacy storage keys purged and ignored');

// Test 2: Cross-order isolation — phone in Order A does NOT carry over to Order B from same senderName
const orderWithPhone: ParsedOrder = {
  ...baseOrder,
  id: 'order-isolation-a',
  senderName: 'متجر الورود',
  senderPhone: '97333112233',
  senderPhoneSource: 'notification_metadata',
};
const resolvedA = resolveAdvertiserContact(orderWithPhone);
assert.equal(resolvedA.phone, '97333112233');

const laterOrderSameSenderNoPhone: ParsedOrder = {
  ...baseOrder,
  id: 'order-isolation-b',
  senderName: 'متجر الورود',
  senderPhone: '',
  rawText: 'طلب توصيل المنامة إلى الرفاع 2.5 دينار',
};
const resolvedB = resolveAdvertiserContact(laterOrderSameSenderNoPhone);
assert.equal(resolvedB.phone, null);
assert.equal(resolvedB.confidence, 'name_only_verified');
assert.equal(resolvedB.advertiserVerified, true);
console.log('✅ PASS: Strict per-order isolation — no phone leaks between orders with same senderName');

// Test 3: Pure symbol / emoji identities and aliases without phone numbers
assert.equal(cleanAdvertiserIdentityName('~ اذكر الله'), 'اذكر الله');
assert.equal(cleanAdvertiserIdentityName('🚕✨'), '🚕✨');
assert.equal(isMeaningfulAdvertiserName('🚕✨'), true);
assert.equal(isMeaningfulAdvertiserName('صاحب الإعلان'), false);
assert.equal(isMeaningfulAdvertiserName('واتساب'), false);

const emojiAdvertiserOrder: ParsedOrder = {
  ...baseOrder,
  id: 'order-emoji-sender',
  senderName: '🚕✨',
  senderPhone: '',
};
const resolvedEmoji = resolveAdvertiserContact(emojiAdvertiserOrder);
assert.equal(resolvedEmoji.advertiserVerified, true);
assert.equal(resolvedEmoji.name, '🚕✨');
assert.equal(resolvedEmoji.confidence, 'name_only_verified');
console.log('✅ PASS: Pure emoji/symbol and alias identities accepted without requiring phone');

// Test 4: Never guess phone digits from senderName (even when senderName contains 8+ digits)
const trickyNameOrder: ParsedOrder = {
  ...baseOrder,
  id: 'order-digits-in-name',
  senderName: 'مندوب 39112233 السريع',
  senderPhone: '',
  senderPhoneSource: 'none',
  rawText: 'مشوار من سار إلى السيف دينارين',
};
const resolvedTricky = resolveAdvertiserContact(trickyNameOrder);
assert.equal(resolvedTricky.phone, null);
assert.equal(getAdvertiserTargetPhone(trickyNameOrder), null);
assert.equal(resolvedTricky.advertiserVerified, true);
assert.equal(resolvedTricky.confidence, 'name_only_verified');
console.log('✅ PASS: Never guesses/extracts phone digits from senderName');

// Test 5: Customer phone rejection & advertiser-vs-customer separation
const adCustomerOnly: ParsedOrder = {
  ...baseOrder,
  id: 'order-customer-only-phone',
  senderName: 'أم محمد',
  rawText: 'توصيل من المحرق إلى المنامة 2 دينار\nرقم الزبون 39887766',
};
const resolvedCustomerOnly = resolveAdvertiserContact(adCustomerOnly);
assert.equal(resolvedCustomerOnly.phone, null);
assert.equal(getAdvertiserTargetPhone(adCustomerOnly), null);
assert.equal(resolvedCustomerOnly.confidence, 'name_only_verified');

const adMixedPhones = `
مطلوب توصيل طلبية من محل العطور
للتواصل مع المحل: 33112233
بيانات الزبون والمستلم: 39887766
`;
const classified = classifyTextPhoneNumbers(adMixedPhones);
assert.equal(classified.find((c) => c.role === 'advertiser')?.phone, '97333112233');
assert.equal(classified.find((c) => c.role === 'customer_recipient')?.phone, '97339887766');

const adMixedOrder: ParsedOrder = {
  ...baseOrder,
  id: 'order-mixed-phones',
  rawText: adMixedPhones,
};
assert.equal(getAdvertiserTargetPhone(adMixedOrder), '97333112233');
console.log('✅ PASS: Rejects customer_recipient phone and isolates explicit advertiser phone');

// Test 6: Ambiguous multiple unclassified numbers & placeholder sender => IDENTITY_NOT_VERIFIED
const ambiguousOrder: ParsedOrder = {
  ...baseOrder,
  id: 'order-ambiguous-phones',
  rawText: 'طلب توصيل المنامة إلى الرفاع\n33112233\n39445566',
};
const resolvedAmbiguous = resolveAdvertiserContact(ambiguousOrder);
assert.equal(resolvedAmbiguous.phone, null);
assert.equal(resolvedAmbiguous.advertiserVerified, false);
assert.equal(resolvedAmbiguous.confidence, 'multiple_candidates');

const placeholderOnlyOrder: ParsedOrder = {
  ...baseOrder,
  id: 'order-placeholder-only',
  senderName: 'واتساب',
  senderPhone: '',
  rawText: 'توصيل من الرفاع إلى المنامة 2 دينار',
};
const resolvedPlaceholder = resolveAdvertiserContact(placeholderOnlyOrder);
assert.equal(resolvedPlaceholder.advertiserVerified, false);
assert.equal(resolvedPlaceholder.confidence, 'needs_verification');
console.log('✅ PASS: Ambiguous numbers and placeholder senders require verification');

// Test 7: Filter customResponseTemplate used verbatim with placeholders & clean fallback when blank
const renderedFilterMsg = formatFilterOutreachMessage(
  baseOrder,
  'هلا {name}، أنا قريب من {area} وبآخذ طلب {from} إلى {to} بـ {price} د.ب',
  'العدلية',
);
assert.equal(
  renderedFilterMsg,
  'هلا ~ اذكر الله، أنا قريب من العدلية وبآخذ طلب العدلية إلى مدينة زايد بـ 2 د.ب',
);

memoryStore.set('orderi_filter_settings', JSON.stringify({ customResponseTemplate: 'أقبل طلب {from} -> {to}' }));
assert.equal(formatFilterOutreachMessage(baseOrder), 'أقبل طلب العدلية -> مدينة زايد');
memoryStore.delete('orderi_filter_settings');

const fallbackMsg = formatFilterOutreachMessage(baseOrder, '   ');
assert.equal(fallbackMsg, formatAdvertiserPrivateMessage(baseOrder));
console.log('✅ PASS: Filter customResponseTemplate rendered verbatim with placeholders and safe blank fallback');

// Test 8: Background silent outreach succeeds via com.whatsapp RemoteInput even WITHOUT senderPhone,
// emits progress states, and forwards senderIdentityKey/senderUri/sourceNotificationKey/sourceMessageTimestamp
let capturedCapabilityPayload: any = null;
let capturedNativePayload: any = null;
const mockRemoteInputBridge: PrivateOutreachNativeBridge = {
  isNativeAndroid: () => true,
  checkPrivateOutreachCapability: async (opts) => {
    capturedCapabilityPayload = opts;
    return {
      regularWhatsAppInstalled: true,
      notificationListenerEnabled: true,
      accessibilityEnabled: false,
      hasPrivateNotificationReplyAction: true,
      privateChatResolved: true,
      backgroundSendAvailable: true,
      reasonCode: 'ok',
    };
  },
  reachAdvertiserPrivateChat: async (opts) => {
    capturedNativePayload = opts;
    return {
      success: true,
      submitted: true,
      deliveryConfirmed: false,
      status: 'MESSAGE_SUBMITTED',
      packageName: 'com.whatsapp',
      method: 'notification_remote_input',
      statusLabel: 'تم تمرير رسالة القبول عبر إشعار واتساب الخاص في الخلفية',
    };
  },
};

const identityRichOrder: ParsedOrder = {
  ...baseOrder,
  id: 'order-silent-no-phone',
  senderIdentityKey: '97339998877@s.whatsapp.net',
  senderUri: 'tel:+97339998877',
  sourceNotificationKey: '0|com.whatsapp|101|group-jid|10001',
  sourceMessageTimestamp: 1763000000123,
};

const cap = await checkBackgroundOutreachAvailability(identityRichOrder, mockRemoteInputBridge);
assert.equal(cap.backgroundSendAvailable, true);
assert.equal(capturedCapabilityPayload.senderIdentityKey, '97339998877@s.whatsapp.net');
assert.equal(capturedCapabilityPayload.senderUri, 'tel:+97339998877');

windowOpenCount = 0;
locationHrefWrites = 0;
const progressStages: string[] = [];
const silentNoPhoneRes = await executePrivateAdvertiserOutreach(
  identityRichOrder,
  'موافق على {from} إلى {to}',
  'المنامة',
  {
    autoSend: true,
    backgroundOnly: true,
    allowUiFallback: false,
    nativeBridge: mockRemoteInputBridge,
    onProgress: (status) => {
      progressStages.push(status);
    },
  },
);
assert.equal(silentNoPhoneRes.success, true);
assert.equal(silentNoPhoneRes.status, 'MESSAGE_SUBMITTED');
assert.equal(silentNoPhoneRes.deliveryMethod, 'notification_remote_input');
assert.deepEqual(progressStages, [
  'IDENTIFYING_ADVERTISER',
  'ADVERTISER_VERIFIED',
  'PRIVATE_CHAT_RESOLVED',
  'BACKGROUND_SEND_READY',
]);
assert.equal(capturedNativePayload.phone, undefined);
assert.equal(capturedNativePayload.memberName, '~ اذكر الله');
assert.equal(capturedNativePayload.senderIdentityKey, '97339998877@s.whatsapp.net');
assert.equal(capturedNativePayload.senderUri, 'tel:+97339998877');
assert.equal(capturedNativePayload.sourceNotificationKey, '0|com.whatsapp|101|group-jid|10001');
assert.equal(capturedNativePayload.sourceMessageTimestamp, 1763000000123);
assert.equal(capturedNativePayload.backgroundOnly, true);
assert.equal(capturedNativePayload.allowUiFallback, false);
assert.equal(capturedNativePayload.message, 'موافق على العدلية إلى مدينة زايد');
assert.equal(windowOpenCount, 0);
assert.equal(locationHrefWrites, 0);
console.log('✅ PASS: Silent RemoteInput outreach emits stage states, forwards identity metadata, and returns MESSAGE_SUBMITTED');

// Test 9: Placeholder/ambiguous order yields IDENTITY_NOT_VERIFIED; duplicate/native error yields SEND_FAILED;
// non-autoSend UI open yields PRIVATE_CHAT_RESOLVED (not MESSAGE_SUBMITTED)
const unverifiedOutreachRes = await executePrivateAdvertiserOutreach(
  placeholderOnlyOrder,
  'موافق',
  'العدلية',
  {
    autoSend: true,
    backgroundOnly: true,
    allowUiFallback: false,
    nativeBridge: mockRemoteInputBridge,
  },
);
assert.equal(unverifiedOutreachRes.success, false);
assert.equal(unverifiedOutreachRes.status, 'IDENTITY_NOT_VERIFIED');
assert.equal(unverifiedOutreachRes.needsVerification, true);

const duplicateSendRes = await executePrivateAdvertiserOutreach(
  identityRichOrder,
  'موافق على {from} إلى {to}',
  'المنامة',
  {
    autoSend: true,
    backgroundOnly: true,
    allowUiFallback: false,
    nativeBridge: mockRemoteInputBridge,
  },
);
assert.equal(duplicateSendRes.success, false);
assert.equal(duplicateSendRes.status, 'SEND_FAILED');

const nativeErrorBridge: PrivateOutreachNativeBridge = {
  isNativeAndroid: () => true,
  reachAdvertiserPrivateChat: async () => ({
    success: false,
    submitted: false,
    deliveryConfirmed: false,
    status: 'SEND_FAILED',
    reasonCode: 'remote_input_send_failed',
    packageName: 'com.whatsapp',
    method: 'notification_remote_input',
    statusLabel: 'فشل تمرير الرد عبر إشعار واتساب',
  }),
};
const nativeFailedRes = await executePrivateAdvertiserOutreach(
  { ...orderWithPhone, id: 'order-native-send-failed' },
  'موافق',
  'العدلية',
  {
    autoSend: true,
    backgroundOnly: true,
    allowUiFallback: false,
    nativeBridge: nativeErrorBridge,
  },
);
assert.equal(nativeFailedRes.success, false);
assert.equal(nativeFailedRes.status, 'SEND_FAILED');

const draftOpenBridge: PrivateOutreachNativeBridge = {
  isNativeAndroid: () => true,
  reachAdvertiserPrivateChat: async () => ({
    success: true,
    submitted: false,
    deliveryConfirmed: false,
    status: 'PRIVATE_CHAT_RESOLVED',
    packageName: 'com.whatsapp',
    method: 'whatsapp_private_chat_opened',
    statusLabel: 'تم فتح محادثة المعلن الخاصة لمراجعة الرسالة يدوياً',
  }),
};
const draftOpenRes = await executePrivateAdvertiserOutreach(
  { ...orderWithPhone, id: 'order-draft-open' },
  'موافق',
  'العدلية',
  {
    autoSend: false,
    backgroundOnly: false,
    allowUiFallback: true,
    nativeBridge: draftOpenBridge,
  },
);
assert.equal(draftOpenRes.success, true);
assert.equal(draftOpenRes.status, 'PRIVATE_CHAT_RESOLVED');
console.log('✅ PASS: IDENTITY_NOT_VERIFIED, SEND_FAILED, and PRIVATE_CHAT_RESOLVED semantics verified');

// Test 10: When background RemoteInput is unavailable, NEVER auto-open WhatsApp or wa.me links
const mockUnavailableBridge: PrivateOutreachNativeBridge = {
  isNativeAndroid: () => true,
  reachAdvertiserPrivateChat: async () => ({
    success: false,
    submitted: false,
    deliveryConfirmed: false,
    status: 'BACKGROUND_SEND_UNAVAILABLE',
    reasonCode: 'remote_input_unavailable',
    packageName: 'com.whatsapp',
    method: 'background_remote_input_unavailable',
    statusLabel: 'تعذر الإرسال الصامت بالخلفية: لم يوفر واتساب إشعار رد خاص مباشر للمعلن',
  }),
};

windowOpenCount = 0;
locationHrefWrites = 0;
const failedNativeRes = await executePrivateAdvertiserOutreach(
  { ...orderWithPhone, id: 'order-bg-unavailable-native' },
  'تم قبول {from} -> {to}',
  'العدلية',
  {
    autoSend: true,
    backgroundOnly: true,
    allowUiFallback: false,
    nativeBridge: mockUnavailableBridge,
  },
);
assert.equal(failedNativeRes.success, false);
assert.equal(failedNativeRes.status, 'BACKGROUND_SEND_UNAVAILABLE');
assert.equal(failedNativeRes.openFallbackModal, true);
assert.equal(windowOpenCount, 0);
assert.equal(locationHrefWrites, 0);

// Non-native runtime also returns BACKGROUND_SEND_UNAVAILABLE with zero window.open calls
const failedWebRes = await executePrivateAdvertiserOutreach(
  { ...orderWithPhone, id: 'order-bg-unavailable-web' },
  'تم قبول {from} -> {to}',
  'العدلية',
  {
    autoSend: true,
    backgroundOnly: true,
    allowUiFallback: false,
    nativeBridge: {
      isNativeAndroid: () => false,
      reachAdvertiserPrivateChat: async () => {
        throw new Error('should not call');
      },
    },
  },
);
assert.equal(failedWebRes.success, false);
assert.equal(failedWebRes.status, 'BACKGROUND_SEND_UNAVAILABLE');
assert.equal(failedWebRes.openFallbackModal, true);
assert.equal(windowOpenCount, 0);
assert.equal(locationHrefWrites, 0);
assert.equal(normalizeBahrainPhone('39123456'), '97339123456');
console.log('✅ PASS: Failed background outreach never opens WhatsApp UI or wa.me and triggers fallback modal cleanly');

console.log('🎉 All Zero-Registry Advertiser Outreach tests passed successfully!');
