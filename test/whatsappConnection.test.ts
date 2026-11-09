import {
  autoAdoptDetectedGroups,
  disconnectWhatsApp,
  getWhatsAppConnection,
  markWhatsAppVerified,
  registerWhatsAppNumber,
  syncWhatsAppPhoneWithAccount,
} from '../src/utils/whatsappConnection';

const values = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, String(value)); },
  removeItem: (key: string) => { values.delete(key); },
};

let total = 0;
let failed = 0;

const legacyStored = {
  phoneNumber: '+97333334444',
  deviceId: 'legacy-device',
  status: 'connected',
  connectedAt: '2026-11-01T10:00:00.000Z',
  lastSeenAt: '2026-11-01T10:00:00.000Z',
  groups: ['قروب قديم'],
};
values.set('orderi_whatsapp_connection_v2', JSON.stringify(legacyStored));
const migratedLegacy = getWhatsAppConnection();
assert(migratedLegacy?.status === 'pending', 'Legacy connected records without notification proof are downgraded');
assert(migratedLegacy?.connectedAt === null, 'Legacy false connection timestamps are cleared');


function assert(condition: boolean, label: string): void {
  total += 1;
  if (condition) console.log(`PASS: ${label}`);
  else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

const registered = registerWhatsAppNumber('+973 33334444');
assert(registered.status === 'pending', 'Saving a phone number never claims a WhatsApp connection');
assert(registered.connectedAt === null, 'A new phone registration clears old verification time');

const synced = syncWhatsAppPhoneWithAccount('+973 33334444');
assert(synced.status === 'pending', 'Syncing the captain account phone does not fake listener verification');
assert(synced.connectedAt === null, 'Account phone sync does not invent a connection timestamp');

const adopted = autoAdoptDetectedGroups(['قروب التوصيل']);
assert(adopted.status === 'pending', 'Adopting a group does not claim live WhatsApp reception');

const verified = markWhatsAppVerified('قروب التوصيل');
assert(verified.status === 'connected', 'A real processed WhatsApp group notification verifies reception');
assert(verified.verificationSource === 'notification', 'Verified state records its trusted notification source');
assert(Boolean(verified.connectedAt && verified.lastSeenAt), 'Verification records real reception timestamps');
assert(verified.groups.includes('قروب التوصيل'), 'Verification stores the observed group');

const changedPhone = syncWhatsAppPhoneWithAccount('+973 35556666');
assert(changedPhone.status === 'pending', 'Changing the account phone requires fresh listener verification');
assert(changedPhone.connectedAt === null, 'Changing the account phone clears prior verification time');
assert(changedPhone.groups.length === 0, 'Groups from a previous phone are not carried to a different account phone');

const disconnected = disconnectWhatsApp();
assert(disconnected?.status === 'disconnected', 'Disconnect clears the verified receiving state');
assert(getWhatsAppConnection()?.status === 'disconnected', 'Disconnect state persists');

console.log(`WhatsApp connection regression tests: ${total - failed}/${total} passed`);
if (failed > 0) process.exit(1);
