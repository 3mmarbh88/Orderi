import { ParsedOrder } from '../types';

export type WhatsAppIngestionSource =
  | 'android_notification'
  | 'whatsapp_web_bridge'
  | 'whatsapp_web_session'
  | 'webhook_auto';

/** Retains every channel that observed a deduplicated order. */
export function mergeWhatsAppIngestionProvenance(
  existing: Partial<ParsedOrder>,
  incoming: Partial<ParsedOrder>,
): Pick<ParsedOrder, 'ingestionSources' | 'ingestionMessageIds' | 'ingestionGroupJids'> {
  const ingestionSources = new Set<WhatsAppIngestionSource>();
  for (const source of [
    ...(existing.ingestionSources || []), existing.source,
    ...(incoming.ingestionSources || []), incoming.source,
  ]) {
    if (source === 'android_notification' || source === 'whatsapp_web_bridge' ||
        source === 'whatsapp_web_session' || source === 'webhook_auto') {
      ingestionSources.add(source);
    }
  }

  const ingestionMessageIds = new Set<string>([
    ...(existing.ingestionMessageIds || []), ...(incoming.ingestionMessageIds || []),
  ]);
  for (const id of [existing.sourceMessageId, existing.bridgeMessageId, incoming.sourceMessageId, incoming.bridgeMessageId]) {
    if (typeof id === 'string' && id.trim()) ingestionMessageIds.add(id.trim());
  }

  const ingestionGroupJids = new Set<string>([
    ...(existing.ingestionGroupJids || []), ...(incoming.ingestionGroupJids || []),
  ]);
  for (const jid of [existing.bridgeGroupJid, incoming.bridgeGroupJid]) {
    if (typeof jid === 'string' && jid.trim()) ingestionGroupJids.add(jid.trim());
  }

  return {
    ingestionSources: [...ingestionSources],
    ingestionMessageIds: [...ingestionMessageIds],
    ingestionGroupJids: [...ingestionGroupJids],
  };
}
