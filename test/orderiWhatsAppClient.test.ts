import { OrderiWhatsAppClient } from '../src/native/orderiWhatsAppClient';
import { WhatsAppNativeEvent } from '../src/native/orderiNotificationListener';

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
console.log('🧪 Starting Orderi WhatsApp Client Test Suite');
console.log('========================================================');

async function runTests() {
  const client = OrderiWhatsAppClient.getInstance();

  // Test 1: Initial state before start is disconnected
  const diag1 = client.getDiagnostics();
  assert(diag1.state === 'disconnected', 'Initial client state is disconnected');

  // Test 2: Phone registration preserves disconnected / ready state and does NOT fake "connected"
  client.registerPhoneNumber('+973 39123456');
  const diag2 = client.getDiagnostics();
  assert(diag2.phoneRegistered === true, 'Phone number is marked as registered');
  assert(diag2.phoneNumber === '+973 39123456', 'Phone number is correctly preserved');
  assert(diag2.state === 'disconnected', 'Registering a phone does NOT fake "connected" before start');

  // Test 3: Start client and check ready status
  await client.start();
  const diag3 = client.getDiagnostics();
  assert(diag3.state === 'ready_listening' || diag3.state === 'permission_required', 'Started client enters ready_listening or permission_required mode truthfully');

  // Test 4: Private 1-on-1 chat rejection
  let rawReceived = false;
  const unsubscribe = client.onRawMessage(() => {
    rawReceived = true;
  });

  const privateChatEvent: WhatsAppNativeEvent = {
    id: 'test-pvt-1',
    packageName: 'com.whatsapp',
    title: 'صديق خاص',
    text: 'طلب توصيل من الرفاع للمنامة دينارين',
    receivedAt: Date.now(),
    isGroup: false,
    chatJid: '97339887766@s.whatsapp.net',
  };

  await client.handleIncomingNativeEvent(privateChatEvent);
  assert(rawReceived === false, 'Personal 1-on-1 message is strictly rejected and never dispatched');

  // Test 5: Genuine delivery group message ingestion
  let receivedGroupEvent: WhatsAppNativeEvent | null = null;
  const unsubscribe2 = client.onRawMessage((evt) => {
    receivedGroupEvent = evt;
  });

  const groupEvent: WhatsAppNativeEvent = {
    id: 'test-group-msg-1',
    packageName: 'com.whatsapp',
    title: 'قروب توصيل كباتن الرفاع',
    conversationTitle: 'قروب توصيل كباتن الرفاع',
    text: 'مطعم البيت: مطلوب توصيل من الرفاع إلى مدينة عيسى 2 دينار',
    senderName: 'مطعم البيت',
    receivedAt: Date.now(),
    isGroup: true,
    isExplicitGroup: true,
    chatJid: '120363012345678@g.us',
  };

  await client.handleIncomingNativeEvent(groupEvent);
  assert(receivedGroupEvent !== null, 'Genuine delivery group message is ingested');
  assert(receivedGroupEvent?.id === 'test-group-msg-1', 'Ingested event matches group message ID');

  // Test 6: Ingestion advances client state to active_stream
  const diag4 = client.getDiagnostics();
  assert(diag4.state === 'active_stream', 'Active verified message flow transitions state to active_stream');
  assert(diag4.totalMessagesIngested >= 1, 'Total messages ingested count increments');
  assert(diag4.lastMessageGroup === 'قروب توصيل كباتن الرفاع', 'Last message group name recorded correctly');

  // Test 7: Duplicate event is ignored
  const initialIngested = diag4.totalMessagesIngested;
  await client.handleIncomingNativeEvent(groupEvent);
  const diag5 = client.getDiagnostics();
  assert(diag5.totalMessagesIngested === initialIngested, 'Duplicate event is silently deduplicated without incrementing count');

  // Test 8: Order captured and closed stats tracking
  client.recordOrderCaptured('ord-123');
  const diag6 = client.getDiagnostics();
  assert(diag6.totalOrdersCaptured === 1, 'Captured order is recorded in stats');

  client.recordOrderClosed('ord-123');
  const diag7 = client.getDiagnostics();
  assert(diag7.totalClosedOrders === 1, 'Closed order is recorded in stats');

  unsubscribe();
  unsubscribe2();
  await client.stop();

  console.log('========================================================');
  console.log(`📊 Orderi WhatsApp Client Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('========================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
