/**
 * Test Suite: Group Capture & Authorization Verification
 * اختبارات التأكد من التقاط جميع القروبات التي تظهر فيها طلبات
 */

import { 
  isGroupAuthorizedByFilter, 
  discriminateConversationSource,
  canMessageCreateRadarOrder 
} from '../src/utils/conversationSourceDiscriminator';
import { OrderFilter } from '../src/types';

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
console.log('🧪 Starting Group Capture & Authorization Test Suite');
console.log('========================================================');

const defaultFilter: Partial<OrderFilter> = {
  allJoinedGroupsMode: true,
  selectedGroups: ['قروب كباتن المنامة'],
};

// 1. In allJoinedGroupsMode (default: true), all non-private groups must be authorized
assert(
  isGroupAuthorizedByFilter('قروب توصيل الرفاع', defaultFilter) === true,
  'Authorizes "قروب توصيل الرفاع" even when not in selectedGroups because allJoinedGroupsMode is true'
);
assert(
  isGroupAuthorizedByFilter('تجار المحرق والحد', defaultFilter) === true,
  'Authorizes "تجار المحرق والحد" under allJoinedGroupsMode'
);
assert(
  isGroupAuthorizedByFilter('أكلات وأسر منتجة سترة', defaultFilter) === true,
  'Authorizes "أكلات وأسر منتجة سترة" under allJoinedGroupsMode'
);

// 2. Private 1-on-1 chats are always excluded
assert(
  isGroupAuthorizedByFilter('محادثة خاصة 👤', defaultFilter) === false,
  'Disallows private chat placeholder "محادثة خاصة 👤"'
);
assert(
  isGroupAuthorizedByFilter('', defaultFilter) === false,
  'Disallows empty group string'
);

// 3. When restricted mode is explicitly chosen (allJoinedGroupsMode: false):
const restrictedFilter: Partial<OrderFilter> = {
  allJoinedGroupsMode: false,
  selectedGroups: ['قروب كباتن المنامة'],
};
assert(
  isGroupAuthorizedByFilter('قروب كباتن المنامة', restrictedFilter) === true,
  'Authorizes selected group in restricted mode'
);
assert(
  isGroupAuthorizedByFilter('سوق سترة الفوري', restrictedFilter) === false,
  'Rejects unselected group when allJoinedGroupsMode is explicitly false'
);

// 4. Group discrimination with diverse notification shapes
const notifEvent1 = {
  isGroup: true,
  title: 'سوق البحرين للتوصيل: بو علي',
  rawText: 'مطلوب مندوب من الجفير إلى السيف 2 د.ب للتواصل 39112233',
};
const analysis1 = discriminateConversationSource(notifEvent1, defaultFilter);
assert(canMessageCreateRadarOrder(analysis1) === true, 'Allows group with colon in title to create order');
assert(analysis1.groupName?.includes('سوق البحرين') === true, 'Resolves correct group name from colon title');

const privateDeliveryLookingMessage = {
  isGroup: false,
  title: 'أسر منتجة المحرق',
  senderName: 'صديق',
  rawText: 'توصيل عاجل من المحرق للرفاع دينارين ونصف',
};
const privateAnalysis = discriminateConversationSource(privateDeliveryLookingMessage, defaultFilter);
assert(privateAnalysis.sourceType === 'private_individual', 'Explicit private flag wins over group-like title and delivery text');
assert(canMessageCreateRadarOrder(privateAnalysis) === false, 'Never creates a Radar order from a private chat');

const ambiguousDeliveryLookingMessage = {
  title: 'المحرق',
  rawText: 'مطلوب مندوب من المحرق للرفاع 2 دينار',
};
const ambiguousAnalysis = discriminateConversationSource(ambiguousDeliveryLookingMessage, defaultFilter);
assert(ambiguousAnalysis.sourceType === 'undetermined_ambiguous', 'Unknown source remains ambiguous even when message text looks like an order');
assert(canMessageCreateRadarOrder(ambiguousAnalysis) === false, 'Never promotes an unknown source using message text');

const verifiedGroupEvent = {
  isGroup: true,
  isExplicitGroup: true,
  title: 'أسر منتجة المحرق: بو علي',
  rawText: 'توصيل عاجل من المحرق للرفاع دينارين ونصف',
};
const verifiedGroupAnalysis = discriminateConversationSource(verifiedGroupEvent, defaultFilter);
assert(canMessageCreateRadarOrder(verifiedGroupAnalysis) === true, 'Allows a notification explicitly identified by Android as a group');

console.log('========================================================');
console.log(`📊 Group Capture Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('========================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
