import { mergeWhatsAppIngestionProvenance } from '../src/utils/whatsappIngestionProvenance';
import { ParsedOrder } from '../src/types';

const base = { id: 'order-1', source: 'android_notification', sourceMessageId: 'native-message-1', groupName: 'Delivery Group' } as Partial<ParsedOrder>;
const bridge = { id: 'bridge-wa-message-1', source: 'whatsapp_web_bridge', bridgeMessageId: 'bridge-message-1', bridgeGroupJid: '120363000000@g.us', bridgeParticipantJid: '97333314353@s.whatsapp.net', groupName: 'Delivery Group' } as Partial<ParsedOrder>;

const merged = mergeWhatsAppIngestionProvenance(base, bridge);
if (merged.ingestionSources.length !== 2 || !merged.ingestionSources.includes('android_notification') || !merged.ingestionSources.includes('whatsapp_web_bridge')) throw new Error('Dual-channel duplicate must retain both ingestion sources');
if (!merged.ingestionMessageIds.includes('native-message-1') || !merged.ingestionMessageIds.includes('bridge-message-1')) throw new Error('Both message identifiers must be retained');
if (!merged.ingestionGroupJids.includes('120363000000@g.us')) throw new Error('Bridge group JID must be retained');

const mergedAgain = mergeWhatsAppIngestionProvenance({ ...base, ...merged }, bridge);
if (mergedAgain.ingestionSources.length !== 2 || mergedAgain.ingestionMessageIds.length !== 2 || mergedAgain.ingestionGroupJids.length !== 1) throw new Error('Repeated events must not duplicate provenance entries');

const bridgeOnly = mergeWhatsAppIngestionProvenance({}, bridge);
if (bridgeOnly.ingestionSources.length !== 1 || bridgeOnly.ingestionSources[0] !== 'whatsapp_web_bridge') throw new Error('Bridge-only order must retain its single source');
console.log('Dual WhatsApp ingestion provenance tests passed.');
