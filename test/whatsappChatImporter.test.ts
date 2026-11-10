import { parseWhatsAppExportTxt } from '../src/utils/whatsappChatImporter';

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
console.log('🧪 Starting WhatsApp Chat Importer Test Suite');
console.log('========================================================');

const sampleExport = `
12/05/2026, 14:15 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
12/05/2026, 14:16 - Ali: سلام عليكم كباتن
12/05/2026, 14:18 - مطعم النعيم: مطلوب توصيل من المنامة إلى المحرق 2.5 دينار
39123456
12/05/2026, 14:20 - بو أحمد: مطلوب سائق من الرفاع لمدينة عيسى دينارين
12/05/2026, 14:25 - مطعم النعيم: تم
12/05/2026, 14:30 - You created group "قروب توصيل كباتن البحرين"
[12/05/2026, 14:35:10] مطبخ أم علي: أوردر جاهز من سترة إلى سند 1.5 د.ب
[12/05/2026, 14:40:00] مطبخ أم علي: حصلت مشكورين
`;

const result = parseWhatsAppExportTxt(sampleExport, 'قروب توصيل كباتن البحرين');

assert(result.totalMessages === 6, `Parsed 6 non-system messages (got ${result.totalMessages})`);
assert(result.groupName === 'قروب توصيل كباتن البحرين', 'Preserves provided group name');
assert(result.candidateOrdersCount >= 3, `Identifies delivery orders (got ${result.candidateOrdersCount})`);
assert(result.closuresCount >= 2, `Identifies closures "تم" and "حصلت" (got ${result.closuresCount})`);

// Multi-line preservation test
const multiLineOrder = result.messages.find((m) => m.senderName === 'مطعم النعيم' && m.messageText.includes('39123456'));
assert(Boolean(multiLineOrder), 'Preserved multi-line message continuation');
assert(
  multiLineOrder?.timestamp === new Date(2026, 4, 12, 14, 18, 0).getTime(),
  'Preserves both date and time in imported message timestamp'
);
const repeatedImport = parseWhatsAppExportTxt(sampleExport, 'قروب توصيل كباتن البحرين');
assert(
  repeatedImport.messages[1]?.id === result.messages[1]?.id,
  'Generates stable message IDs across repeated imports'
);
const twelveHourImport = parseWhatsAppExportTxt(
  '12/05/2026, 2:32 PM - Sender: test message',
  'Test Group'
);
assert(
  twelveHourImport.messages[0]?.timestamp === new Date(2026, 4, 12, 14, 32, 0).getTime(),
  'Converts 12-hour PM timestamps correctly'
);

// Bracket timestamp format
const bracketOrder = result.messages.find((m) => m.senderName === 'مطبخ أم علي' && m.messageText.includes('سترة إلى سند'));
assert(Boolean(bracketOrder), 'Parsed bracket timestamp format correctly');

// Empty file handling
const emptyResult = parseWhatsAppExportTxt('');
assert(emptyResult.totalMessages === 0, 'Handles empty content gracefully');

console.log('========================================================');
console.log(`📊 Importer Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('========================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
