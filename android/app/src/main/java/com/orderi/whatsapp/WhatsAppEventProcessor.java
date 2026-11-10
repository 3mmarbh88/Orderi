package com.orderi.whatsapp;

import android.content.Context;
import org.json.JSONObject;
import java.util.UUID;

public class WhatsAppEventProcessor {

    private final WhatsAppEventDeduplicator deduplicator;

    public WhatsAppEventProcessor() {
        this.deduplicator = new WhatsAppEventDeduplicator();
    }

    public JSONObject processRawNotification(
            String packageName,
            String title,
            String text,
            String bigText,
            String subText,
            String conversationTitle,
            long postTime,
            String key,
            String chatJid,
            boolean isGroupHint
    ) {
        String effectiveText = (bigText != null && !bigText.trim().isEmpty()) ? bigText : text;
        if (effectiveText == null) effectiveText = "";

        WhatsAppGroupResolver.ResolvedMessage resolved = WhatsAppGroupResolver.resolve(
                title, conversationTitle, effectiveText, isGroupHint
        );

        if (WhatsAppGroupResolver.isMockGroup(resolved.groupName)) {
            return null;
        }

        String deduplicationKey = WhatsAppEventDeduplicator.computeDeduplicationKey(
                resolved.groupName, resolved.senderName, resolved.cleanText, postTime
        );

        // Deduplication window: 5 minutes (300,000 ms)
        if (deduplicator.isDuplicate(deduplicationKey, 300000L)) {
            return null;
        }

        try {
            JSONObject event = new JSONObject();
            event.put("id", UUID.randomUUID().toString());
            event.put("packageName", packageName != null ? packageName : "com.whatsapp");
            event.put("source", "whatsapp_notification");
            event.put("title", title != null ? title : "");
            event.put("text", resolved.cleanText);
            event.put("rawText", effectiveText);
            event.put("groupName", resolved.groupName);
            event.put("conversationTitle", resolved.groupName);
            event.put("senderName", resolved.senderName);
            event.put("receivedAt", postTime > 0 ? postTime : System.currentTimeMillis());
            event.put("key", key != null ? key : "");
            event.put("chatJid", chatJid != null ? chatJid : "");
            event.put("isGroup", resolved.isGroup);
            event.put("isExplicitGroup", resolved.isGroup);
            event.put("deduplicationKey", deduplicationKey);
            return event;
        } catch (Exception e) {
            return null;
        }
    }
}
