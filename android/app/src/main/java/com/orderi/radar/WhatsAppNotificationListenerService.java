package com.orderi.radar;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.UUID;

/**
 * Native Android listener for WhatsApp notifications only.
 * It does not read WhatsApp's database or messages directly; it receives
 * whatever WhatsApp exposes in the Android notification shade.
 */
public class WhatsAppNotificationListenerService extends NotificationListenerService {
    public static final String PACKAGE_WHATSAPP = "com.whatsapp";
    public static final String PACKAGE_WHATSAPP_BUSINESS = "com.whatsapp.w4b";
    public static final String PREFS = "orderi_native_notifications";
    public static final String KEY_EVENTS = "events";
    public static final String ACTION_EVENT = "com.orderi.radar.WHATSAPP_NOTIFICATION";
    private static final String CHANNEL_ID = "orderi_orders";
    private static final String DEDUP_PREFS = "orderi_native_dedup";
    private static final long NATIVE_DEDUP_TTL_MS = 90_000L;

    public static boolean isWhatsAppPackage(String pkg) {
        return PACKAGE_WHATSAPP.equals(pkg) || PACKAGE_WHATSAPP_BUSINESS.equals(pkg);
    }

    public static class ReplyActionHolder {
        public PendingIntent pendingIntent;
        public android.app.RemoteInput[] remoteInputs;
        public long timestamp;
        public boolean isGroup;
    }
    private static final java.util.concurrent.ConcurrentHashMap<String, ReplyActionHolder> REPLY_ACTIONS = new java.util.concurrent.ConcurrentHashMap<>();

    public static class ChatIntentHolder {
        public PendingIntent contentIntent;
        public long timestamp;
        public boolean isGroup;
        public String title;
    }
    private static final java.util.concurrent.ConcurrentHashMap<String, ChatIntentHolder> CHAT_INTENTS = new java.util.concurrent.ConcurrentHashMap<>();

    public static class MarkAsReadHolder {
        public PendingIntent pendingIntent;
        public String key;
        public long timestamp;
        public String title;
    }
    private static final java.util.concurrent.ConcurrentHashMap<String, MarkAsReadHolder> MARK_AS_READ_ACTIONS = new java.util.concurrent.ConcurrentHashMap<>();
    private static volatile WhatsAppNotificationListenerService instance;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        instance = this;
    }

    @Override
    public void onListenerDisconnected() {
        if (instance == this) instance = null;
        super.onListenerDisconnected();

        // Android may temporarily disconnect notification listeners. Ask the
        // system to rebind this listener when supported; if the user revoked the
        // notification-listener permission, Android still requires user action.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                requestRebind(new ComponentName(this, WhatsAppNotificationListenerService.class));
            } catch (RuntimeException error) {
                android.util.Log.w("WhatsAppNotificationListenerService",
                        "Could not request notification-listener rebind", error);
            }
        }
    }

    /**
     * Marks only the exact WhatsApp group that produced a confirmed parsed order.
     * Does not cancel notifications or execute actions for any other conversation.
     */
    public static int markWhatsAppGroupAsRead(String targetGroup) {
        if (TextUtils.isEmpty(targetGroup)) return 0;
        String normalizedTarget = targetGroup.trim().toLowerCase(java.util.Locale.ROOT);
        java.util.HashSet<PendingIntent> sentIntents = new java.util.HashSet<>();
        int count = 0;
        for (MarkAsReadHolder holder : MARK_AS_READ_ACTIONS.values()) {
            if (holder == null || holder.pendingIntent == null || TextUtils.isEmpty(holder.title)) continue;
            String normalizedTitle = holder.title.trim().toLowerCase(java.util.Locale.ROOT);
            if (!normalizedTitle.equals(normalizedTarget)) continue;
            if (sentIntents.contains(holder.pendingIntent)) continue;
            try {
                holder.pendingIntent.send();
                sentIntents.add(holder.pendingIntent);
                count++;
            } catch (Exception e) {
                android.util.Log.w("WhatsAppNotificationListenerService", "Could not mark source group as read", e);
            }
        }
        return count;
    }

    public static int markAllWhatsAppAsRead(android.content.Context context) {
        return markAllWhatsAppAsRead(context, null);
    }

    public static int markAllWhatsAppAsRead(android.content.Context context, java.util.List<String> targetGroups) {
        int count = 0;
        java.util.HashSet<PendingIntent> sentIntents = new java.util.HashSet<>();

        // 1. Send cached Mark As Read actions for tracked groups
        for (java.util.Map.Entry<String, MarkAsReadHolder> entry : MARK_AS_READ_ACTIONS.entrySet()) {
            try {
                String groupTitle = entry.getKey();
                boolean matches = true;
                if (targetGroups != null && !targetGroups.isEmpty()) {
                    matches = false;
                    String normTitle = groupTitle != null ? groupTitle.toLowerCase().trim() : "";
                    for (String tg : targetGroups) {
                        String normTg = tg != null ? tg.toLowerCase().trim() : "";
                        if (!normTg.isEmpty() && (normTitle.contains(normTg) || normTg.contains(normTitle))) {
                            matches = true;
                            break;
                        }
                    }
                }

                if (matches) {
                    PendingIntent pi = entry.getValue().pendingIntent;
                    if (pi != null && !sentIntents.contains(pi)) {
                        pi.send();
                        sentIntents.add(pi);
                        count++;
                    }
                }
            } catch (Exception ignored) {}
        }
        if (targetGroups == null || targetGroups.isEmpty()) {
            MARK_AS_READ_ACTIONS.clear();
        }

        // 2. Scan active status bar notifications for WhatsApp & WhatsApp Business
        if (instance != null) {
            try {
                StatusBarNotification[] active = instance.getActiveNotifications();
                if (active != null) {
                    for (StatusBarNotification sbn : active) {
                        if (isWhatsAppPackage(sbn.getPackageName())) {
                            Notification n = sbn.getNotification();
                            if (n != null) {
                                // Extract standard and wearable actions
                                java.util.List<Notification.Action> actionsList = new java.util.ArrayList<>();
                                if (n.actions != null) {
                                    for (Notification.Action a : n.actions) {
                                        if (a != null) actionsList.add(a);
                                    }
                                }
                                if (n.extras != null) {
                                    android.os.Bundle wearableBundle = n.extras.getBundle("android.wearable.EXTENSIONS");
                                    if (wearableBundle != null) {
                                        java.util.ArrayList<Notification.Action> wActions = wearableBundle.getParcelableArrayList("actions");
                                        if (wActions != null) {
                                            actionsList.addAll(wActions);
                                        }
                                    }
                                }

                                for (Notification.Action act : actionsList) {
                                    if (act != null && act.actionIntent != null) {
                                        // Only execute an action whose title clearly indicates marking as read.
                                        // Other no-input actions can archive, mute, or dismiss a chat.
                                        String actTitle = act.title != null ? act.title.toString().toLowerCase() : "";
                                        boolean isMarkReadTitle = actTitle.contains("read") || 
                                                                  actTitle.contains("مقروء") || 
                                                                  actTitle.contains("قراءة") || 
                                                                  actTitle.contains("mark") || 
                                                                  actTitle.contains("تعيين") || 
                                                                  actTitle.contains("تمييز") ||
                                                                  actTitle.contains("gelesen") ||
                                                                  actTitle.contains("lu");

                                        if (isMarkReadTitle) {
                                            try {
                                                if (!sentIntents.contains(act.actionIntent)) {
                                                    act.actionIntent.send();
                                                    sentIntents.add(act.actionIntent);
                                                    count++;
                                                }
                                            } catch (Exception ignored) {}
                                        }
                                    }
                                }

                                // Cancel notification from status bar
                                try {
                                    instance.cancelNotification(sbn.getKey());
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return count;
    }

    public static boolean openWhatsAppConversation(android.content.Context context, String targetTitle) {
        if (TextUtils.isEmpty(targetTitle)) return false;
        String targetNormalized = targetTitle.toLowerCase().trim();
        for (java.util.Map.Entry<String, ChatIntentHolder> entry : CHAT_INTENTS.entrySet()) {
            String key = entry.getKey().toLowerCase().trim();
            if (key.equals(targetNormalized) || key.contains(targetNormalized) || targetNormalized.contains(key)) {
                try {
                    entry.getValue().contentIntent.send();
                    return true;
                } catch (Exception ignored) {}
            }
        }
        return false;
    }

    /**
     * Open a group only when a cached notification intent matches its name exactly
     * and that notification was identified as a group.
     */
    public static boolean openWhatsAppGroupConversation(android.content.Context context, String targetTitle) {
        if (TextUtils.isEmpty(targetTitle)) return false;
        String targetNormalized = targetTitle.trim().toLowerCase(java.util.Locale.ROOT);
        long now = System.currentTimeMillis();
        for (java.util.Map.Entry<String, ChatIntentHolder> entry : CHAT_INTENTS.entrySet()) {
            ChatIntentHolder holder = entry.getValue();
            if (holder == null || !holder.isGroup || holder.contentIntent == null
                    || holder.timestamp <= 0L || now - holder.timestamp < 0L
                    || now - holder.timestamp > 900_000L) continue;
            String key = entry.getKey();
            if (key == null || !key.trim().toLowerCase(java.util.Locale.ROOT).equals(targetNormalized)) continue;
            try {
                holder.contentIntent.send();
                return true;
            } catch (Exception e) {
                android.util.Log.w("WhatsAppNotificationListenerService", "Unable to open cached WhatsApp group intent", e);
            }
        }
        return false;
    }

    /**
     * Open only a recent, exactly named private conversation from a WhatsApp notification.
     * Group intents and fuzzy/partial title matches are deliberately rejected.
     */
    public static boolean openWhatsAppPrivateConversation(android.content.Context context, String targetTitle) {
        if (TextUtils.isEmpty(targetTitle)) return false;
        String targetNormalized = targetTitle.trim().toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ");
        long now = System.currentTimeMillis();
        for (java.util.Map.Entry<String, ChatIntentHolder> entry : CHAT_INTENTS.entrySet()) {
            ChatIntentHolder holder = entry.getValue();
            if (holder == null || holder.isGroup || holder.contentIntent == null
                    || holder.timestamp <= 0L || now - holder.timestamp < 0L
                    || now - holder.timestamp > 900_000L) continue;
            String key = entry.getKey();
            if (key == null) continue;
            String normalizedKey = key.trim().toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ");
            if (!normalizedKey.equals(targetNormalized)) continue;
            try {
                holder.contentIntent.send();
                return true;
            } catch (Exception e) {
                android.util.Log.w("WhatsAppNotificationListenerService", "Unable to open exact private WhatsApp conversation", e);
            }
        }
        return false;
    }

    public static boolean sendQuickReply(android.content.Context context, String targetGroupOrPhone, String replyText) {
        if (TextUtils.isEmpty(replyText)) return false;

        if (!TextUtils.isEmpty(targetGroupOrPhone)) {
            String targetNormalized = targetGroupOrPhone.toLowerCase().trim();
            for (java.util.Map.Entry<String, ReplyActionHolder> entry : REPLY_ACTIONS.entrySet()) {
                // RULE 5: Strictly prevent replying into groups!
                if (entry.getValue().isGroup) continue;

                String key = entry.getKey().toLowerCase().trim();
                if (key.equals(targetNormalized) || key.contains(targetNormalized) || targetNormalized.contains(key)) {
                    if (executeReply(context, entry.getValue(), replyText)) return true;
                }
            }
        }

        // Fallback: try latest action if less than 15 minutes old AND NOT A GROUP
        long now = System.currentTimeMillis();
        for (java.util.Map.Entry<String, ReplyActionHolder> entry : REPLY_ACTIONS.entrySet()) {
            if (entry.getValue().isGroup) continue; // NEVER group
            if (now - entry.getValue().timestamp < 900_000L) {
                if (executeReply(context, entry.getValue(), replyText)) return true;
            }
        }
        return false;
    }

    /**
     * Try to reply to a specifically identified private-chat notification without
     * bringing WhatsApp to the foreground. Never falls back to an unrelated chat.
     */
    public static boolean sendPrivateNotificationReply(android.content.Context context, String target, String replyText) {
        if (TextUtils.isEmpty(target) || TextUtils.isEmpty(replyText)) return false;
        String wanted = target.toLowerCase(java.util.Locale.ROOT).replaceAll("\\D", "");
        String wantedText = target.toLowerCase(java.util.Locale.ROOT).trim();
        long now = System.currentTimeMillis();
        for (java.util.Map.Entry<String, ReplyActionHolder> entry : REPLY_ACTIONS.entrySet()) {
            ReplyActionHolder holder = entry.getValue();
            if (holder == null || holder.isGroup || holder.pendingIntent == null
                    || holder.remoteInputs == null || holder.timestamp <= 0L
                    || now - holder.timestamp < 0L || now - holder.timestamp > 900_000L) continue;
            String key = entry.getKey() == null ? "" : entry.getKey().toLowerCase(java.util.Locale.ROOT).trim();
            String keyDigits = key.replaceAll("\\D", "");
            String normalizedKey = key.replaceAll("\\s+", " ").trim();
            String normalizedWanted = wantedText.replaceAll("\\s+", " ").trim();
            boolean exactName = !normalizedWanted.isEmpty() && normalizedKey.equals(normalizedWanted);
            // Allow a local Bahrain number to match its +973 form, but never use arbitrary suffix matches.
            boolean exactPhone = wanted.length() >= 8 && keyDigits.length() >= 8
                    && (keyDigits.equals(wanted)
                    || (wanted.length() == 11 && keyDigits.length() == 8 && wanted.endsWith(keyDigits))
                    || (keyDigits.length() == 11 && wanted.length() == 8 && keyDigits.endsWith(wanted)));
            if ((exactName || exactPhone) && executeReply(context, holder, replyText)) return true;
        }
        return false;
    }

    /**
     * Submit a reply only through a recent RemoteInput action belonging to the
     * exact requested WhatsApp group. This does not launch WhatsApp.
     *
     * Note: Android/WhatsApp expose reply actions only for some notifications.
     * A successful PendingIntent send means the action was submitted, not that
     * WhatsApp delivered or the group received the message.
     */
    public static boolean sendGroupNotificationReply(android.content.Context context, String targetGroup, String message) {
        if (TextUtils.isEmpty(targetGroup) || TextUtils.isEmpty(message)) return false;
        String wanted = targetGroup.toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ").trim();
        long now = System.currentTimeMillis();
        for (java.util.Map.Entry<String, ReplyActionHolder> entry : REPLY_ACTIONS.entrySet()) {
            ReplyActionHolder holder = entry.getValue();
            if (holder == null || !holder.isGroup || holder.pendingIntent == null
                    || holder.remoteInputs == null || holder.remoteInputs.length == 0
                    || holder.timestamp <= 0L || now - holder.timestamp < 0L
                    || now - holder.timestamp > 900_000L) continue;
            String key = entry.getKey();
            if (key == null) continue;
            String normalizedKey = key.toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ").trim();
            if (!normalizedKey.equals(wanted)) continue;
            if (executeReply(context, holder, message)) return true;
        }
        return false;
    }

    private static boolean executeReply(android.content.Context context, ReplyActionHolder holder, String replyText) {
        if (holder == null || holder.pendingIntent == null || holder.remoteInputs == null) return false;
        try {
            Intent intent = new Intent();
            Bundle bundle = new Bundle();
            for (android.app.RemoteInput remoteInput : holder.remoteInputs) {
                bundle.putCharSequence(remoteInput.getResultKey(), replyText);
            }
            android.app.RemoteInput.addResultsToIntent(holder.remoteInputs, intent, bundle);
            holder.pendingIntent.send(context, 0, intent);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String pkg = sbn.getPackageName();
        if (pkg == null) return;
        boolean isWhatsApp = PACKAGE_WHATSAPP.equals(pkg) || PACKAGE_WHATSAPP_BUSINESS.equals(pkg) || pkg.contains("whatsapp");
        if (!isWhatsApp) return;

        // The OS notification listener can remain connected after the app is swiped
        // from Recents. Respect the explicit runtime flag so no new radar events or
        // Orderi alerts are processed until the user opens Orderi again.
        if (!getSharedPreferences(BackgroundRadarService.PREFS, MODE_PRIVATE)
                .getBoolean(BackgroundRadarService.KEY_ENABLED, false)) {
            return;
        }

        Notification n = sbn.getNotification();
        if (n == null) return;
        Bundle extras = n.extras;
        if (extras == null) return;

        String title = safe(extras.getCharSequence(Notification.EXTRA_TITLE));
        String text = safe(extras.getCharSequence(Notification.EXTRA_TEXT));
        String bigText = safe(extras.getCharSequence(Notification.EXTRA_BIG_TEXT));
        String subText = safe(extras.getCharSequence(Notification.EXTRA_SUB_TEXT));
        
        CharSequence convTitleCs = extras.getCharSequence("android.conversationTitle");
        if (convTitleCs == null) convTitleCs = extras.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE);
        String conversationTitle = safe(convTitleCs);

        CharSequence summaryCs = extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT);
        String summaryText = safe(summaryCs);

        boolean isExplicitGroupFlag = extras.getBoolean("android.isGroupConversation", false)
                || extras.getBoolean(Notification.EXTRA_IS_GROUP_CONVERSATION, false);

        String category = n.category == null ? "" : n.category;

        // Robust group-name extraction across WhatsApp/Android notification layouts.
        // Prefer explicit MessagingStyle conversation metadata; then inspect title/text
        // formats without assuming every group name contains a keyword such as "توصيل".
        String detectedGroupName = "";
        String detectedSenderName = title;
        String combinedVisibleText = !TextUtils.isEmpty(bigText) ? bigText : text;
        if (TextUtils.isEmpty(combinedVisibleText)) combinedVisibleText = subText;

        if (!TextUtils.isEmpty(conversationTitle)) {
            detectedGroupName = conversationTitle.trim();
        } else if (isExplicitGroupFlag && !TextUtils.isEmpty(title)) {
            detectedGroupName = title.trim();
        } else if (!TextUtils.isEmpty(title) && title.contains(" @ ")) {
            String[] parts = title.split(" @ ", 2);
            if (parts.length == 2) {
                detectedSenderName = parts[0].trim();
                detectedGroupName = parts[1].trim();
            }
        }

        // Some WhatsApp versions put "sender: message" in text and the chat/group
        // title in title. Other versions put "group: sender: message" in the text.
        if (TextUtils.isEmpty(detectedGroupName) && !TextUtils.isEmpty(title)
                && !TextUtils.isEmpty(combinedVisibleText)) {
            int colonIdx = combinedVisibleText.indexOf(':');
            if (colonIdx > 0 && colonIdx < 70) {
                String prefix = combinedVisibleText.substring(0, colonIdx).trim();
                String normalizedPrefix = prefix.toLowerCase(java.util.Locale.ROOT);
                String normalizedTitle = title.trim().toLowerCase(java.util.Locale.ROOT);
                boolean prefixIsTitle = normalizedPrefix.equals(normalizedTitle);
                boolean looksLikeGenericSummary = normalizedPrefix.matches("\\d+\\s+.*")
                        || normalizedPrefix.contains("رسالة") || normalizedPrefix.contains("messages");
                int secondColon = combinedVisibleText.indexOf(':', colonIdx + 1);
                if (!prefixIsTitle && !looksLikeGenericSummary && secondColon > colonIdx) {
                    // Layout: "Group: Sender: message" (title may be the sender).
                    detectedGroupName = prefix;
                    if (secondColon > colonIdx + 1) {
                        detectedSenderName = combinedVisibleText.substring(colonIdx + 1, secondColon).trim();
                    }
                } else if (!prefixIsTitle && !looksLikeGenericSummary) {
                    // Layout: title="Group name", text="Sender: message".
                    // Keep the title as the group, and preserve the sender from the text.
                    detectedGroupName = title.trim();
                    detectedSenderName = prefix;
                } else if (prefixIsTitle) {
                    detectedSenderName = prefix;
                }
            }
        }

        if (TextUtils.isEmpty(detectedGroupName) && !TextUtils.isEmpty(title)
                && (title.contains("قروب") || title.contains("جروب") || title.contains("مجموعة")
                || title.contains("مندوب") || title.contains("توصيل") || title.contains("كباتن")
                || title.contains("طلبات") || title.contains("بحرين"))) {
            detectedGroupName = title.trim();
        }

        if (TextUtils.isEmpty(detectedGroupName) && !TextUtils.isEmpty(summaryText)
                && (summaryText.contains("قروب") || summaryText.contains("مجموعة")
                || summaryText.contains("توصيل") || summaryText.contains("كباتن"))) {
            detectedGroupName = summaryText.trim();
        }

        // MessagingStyle can expose the actual sender separately from the visible title.
        // If the sender differs from the notification title, the title is usually the group
        // name (even when Android omits EXTRA_CONVERSATION_TITLE and the group name has no keywords).
        // For direct chats, the sender normally matches the title, so they are not misclassified.
        if (!TextUtils.isEmpty(title) && Build.VERSION.SDK_INT >= 24) {
            try {
                Object messages = extras.get(Notification.EXTRA_MESSAGES);
                if (messages instanceof Parcelable[]) {
                    String latestSender = "";
                    for (Parcelable item : (Parcelable[]) messages) {
                        if (!(item instanceof Bundle)) continue;
                        Bundle message = (Bundle) item;
                        String senderName = "";
                        if (Build.VERSION.SDK_INT >= 28) {
                            Parcelable senderParcelable = message.getParcelable("sender_person");
                            if (senderParcelable instanceof android.app.Person) {
                                senderName = safe(((android.app.Person) senderParcelable).getName());
                            }
                        }
                        if (TextUtils.isEmpty(senderName)) {
                            senderName = safe(message.getCharSequence("sender"));
                        }
                        if (!TextUtils.isEmpty(senderName)) latestSender = senderName.trim();
                    }
                    if (!TextUtils.isEmpty(latestSender)
                            && !latestSender.equalsIgnoreCase(title.trim())) {
                        // Keep an explicit conversation title as the group name, but always
                        // retain the actual sender for matching short "تم"/sticker closures.
                        if (TextUtils.isEmpty(detectedGroupName)) {
                            detectedGroupName = title.trim();
                        }
                        detectedSenderName = latestSender;
                    }
                }
            } catch (Exception ignored) {}
        }

        boolean looksLikeGroup = !TextUtils.isEmpty(detectedGroupName) || isExplicitGroupFlag;
        String resolvedTitle = !TextUtils.isEmpty(detectedGroupName) ? detectedGroupName
                : (!TextUtils.isEmpty(conversationTitle) ? conversationTitle : title);
        String rawText = !TextUtils.isEmpty(bigText) ? bigText : text;
        if (TextUtils.isEmpty(rawText)) rawText = subText;

        // WhatsApp commonly uses Android MessagingStyle. On those devices the
        // actual message body is exposed through Notification.EXTRA_MESSAGES,
        // not EXTRA_TEXT/EXTRA_BIG_TEXT. Read all available message bundles.
        if (TextUtils.isEmpty(rawText)) {
            try {
                Object messages = extras.get(Notification.EXTRA_MESSAGES);
                if (messages instanceof Parcelable[]) {
                    StringBuilder builder = new StringBuilder();
                    for (Parcelable item : (Parcelable[]) messages) {
                        if (!(item instanceof Bundle)) continue;
                        Bundle message = (Bundle) item;
                        CharSequence body = message.getCharSequence("text");
                        if (body != null && body.length() > 0) {
                            if (builder.length() > 0) builder.append("\n");
                            builder.append(body);
                        }
                    }
                    rawText = builder.toString();
                }
            } catch (Exception ignored) {}
        }
        if (TextUtils.isEmpty(rawText) && !TextUtils.isEmpty(title)) rawText = title;
        if (TextUtils.isEmpty(rawText) && TextUtils.isEmpty(title)) return;

        JSONObject event = new JSONObject();
        try {
            // Stable identity: the same Android notification update can be delivered more than once.
            String stableIdentity = pkg + "|" + safe(sbn.getKey()) + "|" + rawText + "|" + sbn.getPostTime();
            String stableId = UUID.nameUUIDFromBytes(stableIdentity.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
            event.put("schemaVersion", 1);
            event.put("id", stableId);
            event.put("messageId", stableId);
            event.put("source", "whatsapp_notification");
            event.put("sourcePackage", pkg);
            event.put("packageName", pkg);
            event.put("chatId", safe(sbn.getKey()));
            event.put("sourceMessageId", safe(sbn.getKey()) + ":" + sbn.getPostTime());
            event.put("contentHash", java.util.UUID.nameUUIDFromBytes(rawText.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString());
            event.put("title", resolvedTitle);
            event.put("groupName", detectedGroupName);
            event.put("senderName", detectedSenderName);
            event.put("text", text);
            event.put("bigText", bigText);
            event.put("subText", subText);
            event.put("summaryText", summaryText);
            event.put("rawText", rawText);
            event.put("receivedAt", sbn.getPostTime());
            event.put("key", sbn.getKey());
            event.put("conversationTitle", conversationTitle);
            event.put("category", category);
            event.put("isGroup", looksLikeGroup);

            // Cache WhatsApp direct reply action from notification if present
            if (n.actions != null) {
                for (Notification.Action action : n.actions) {
                    if (action == null || action.actionIntent == null) continue;
                    
                    // Reply action
                    if (action.getRemoteInputs() != null && action.getRemoteInputs().length > 0) {
                        ReplyActionHolder holder = new ReplyActionHolder();
                        holder.pendingIntent = action.actionIntent;
                        holder.remoteInputs = action.getRemoteInputs();
                        holder.timestamp = sbn.getPostTime();
                        holder.isGroup = looksLikeGroup;
                        if (!TextUtils.isEmpty(resolvedTitle)) {
                            REPLY_ACTIONS.put(resolvedTitle, holder);
                        }
                        if (!TextUtils.isEmpty(title)) {
                            REPLY_ACTIONS.put(title, holder);
                        }
                        if (!TextUtils.isEmpty(conversationTitle)) {
                            REPLY_ACTIONS.put(conversationTitle, holder);
                        }
                    } else {
                        // Mark as read action (تمييز كمقروء)
                        CharSequence aTitle = action.title;
                        String aTitleStr = aTitle != null ? aTitle.toString().toLowerCase() : "";
                        boolean isMarkRead = aTitleStr.contains("read") ||
                                             aTitleStr.contains("مقروء") ||
                                             aTitleStr.contains("قراءة") ||
                                             aTitleStr.contains("تمييز") ||
                                             aTitleStr.contains("تعليم") ||
                                             aTitleStr.contains("mark");
                        if (isMarkRead) {
                            MarkAsReadHolder readHolder = new MarkAsReadHolder();
                            readHolder.pendingIntent = action.actionIntent;
                            readHolder.key = sbn.getKey();
                            readHolder.timestamp = sbn.getPostTime();
                            readHolder.title = resolvedTitle;
                            if (!TextUtils.isEmpty(resolvedTitle)) MARK_AS_READ_ACTIONS.put(resolvedTitle, readHolder);
                            if (!TextUtils.isEmpty(title)) MARK_AS_READ_ACTIONS.put(title, readHolder);
                            if (!TextUtils.isEmpty(conversationTitle)) MARK_AS_READ_ACTIONS.put(conversationTitle, readHolder);
                            MARK_AS_READ_ACTIONS.put(sbn.getKey(), readHolder);
                        }
                    }
                }
            }

            // Cache WhatsApp chat launch Intent for direct private outreach
            if (n.contentIntent != null) {
                ChatIntentHolder intentHolder = new ChatIntentHolder();
                intentHolder.contentIntent = n.contentIntent;
                intentHolder.timestamp = sbn.getPostTime();
                intentHolder.isGroup = looksLikeGroup;
                intentHolder.title = resolvedTitle;
                if (!TextUtils.isEmpty(resolvedTitle)) CHAT_INTENTS.put(resolvedTitle, intentHolder);
                if (!TextUtils.isEmpty(title)) CHAT_INTENTS.put(title, intentHolder);
                if (!TextUtils.isEmpty(conversationTitle)) CHAT_INTENTS.put(conversationTitle, intentHolder);
            }

            // Android-native Heads-Up notification. This runs inside the
            // NotificationListenerService, so it can fire while Orderi's
            // WebView is backgrounded or suspended.
            // Raw WhatsApp text must not generate Orderi alerts before Radar validation.

            // Persist before broadcasting. If the WebView is suspended, startup can
            // resume the same event from the queue without losing it.
            if (appendEvent(event)) {
                Intent broadcast = new Intent(ACTION_EVENT);
                broadcast.setPackage(getPackageName());
                broadcast.putExtra("event", event.toString());
                sendBroadcast(broadcast);
            }
        } catch (Exception ignored) {
        }
    }

    private void maybeShowOrderNotification(String title, String rawText, long postTime, boolean isGroup) {
        String normalized = safe(rawText).toLowerCase()
                .replace('إ', 'ا').replace('أ', 'ا').replace('آ', 'ا')
                .replaceAll("\\s+", " ").trim();

        // Avoid turning every WhatsApp chat message into an Orderi alert.
        boolean looksLikeOrder =
                (normalized.contains("توصيل") || normalized.contains("طلب") ||
                 normalized.contains("استلام") || normalized.contains("بيك اب") ||
                 normalized.contains("مشوار") || normalized.contains("توصيلة") ||
                 normalized.contains("نقل") || normalized.contains("ركاب") ||
                 normalized.contains("pickup") || normalized.contains("delivery"))
                && (normalized.contains("من ") || normalized.contains("الى") ||
                    normalized.contains("إلى") || normalized.contains("لـ") ||
                    normalized.contains("لل") || normalized.contains("مطار") ||
                    normalized.contains("سلمانية") || normalized.contains("جسر") ||
                    normalized.matches(".*\\d+(?:\\.\\d+)?\\s*(?:د\\.ب|دب|دينار|bd|bhd).*"));

        if (!looksLikeOrder) return;

        SharedPreferences filterPrefs = getSharedPreferences("orderi_filter_settings", MODE_PRIVATE);
        boolean notificationsEnabled = filterPrefs.getBoolean("notifications_enabled", true);
        if (!notificationsEnabled) return; // تم إيقاف الإشعارات في الإعدادات

        // فحص حظر نقل الركاب حسب إعدادات الفلتر
        boolean blockPassenger = filterPrefs.getBoolean("block_passenger", true);
        boolean isPassengerBlocked = normalized.contains("شخص") || normalized.contains("اشخاص") ||
                normalized.contains("أشخاص") || normalized.contains("راكب") ||
                normalized.contains("ركاب") || normalized.contains("توصيل بنات") ||
                normalized.contains("توصيل طالب") || normalized.contains("توصيل طالبة") ||
                normalized.contains("توصيل موظف") || normalized.contains("مشوار ركاب");

        if (blockPassenger && isPassengerBlocked) {
            return; // حجب إشعار نقل الركاب لأن السائق مفعّل حظر الركاب في الإعدادات
        }

        // Check if ignore_non_matching is active in native SharedPreferences
        boolean ignoreNonMatching = filterPrefs.getBoolean("ignore_non_matching", false);
        float minPrice = filterPrefs.getFloat("min_price", 0.0f);

        if (ignoreNonMatching && minPrice > 0) {
            java.util.regex.Matcher priceMatcher = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:د\\.ب|دب|دينار|bd|bhd)").matcher(normalized);
            if (priceMatcher.find()) {
                try {
                    float parsedPrice = Float.parseFloat(priceMatcher.group(1));
                    if (parsedPrice < minPrice) {
                        return; // حجب الطلب غير المطابق في السعر في الخلفية
                    }
                } catch (Exception ignored) {}
            }
        }

        // Check distance against coverage radius if driver location is set
        if (ignoreNonMatching) {
            float coverageKm = filterPrefs.getFloat("coverage_km", 10.0f);
            float driverLat = filterPrefs.getFloat("driver_lat", 0.0f);
            float driverLon = filterPrefs.getFloat("driver_lon", 0.0f);

            if (driverLat != 0.0f && driverLon != 0.0f) {
                Double targetLat = null;
                Double targetLon = null;

                if (normalized.contains("مودا") || normalized.contains("مودامول") || normalized.contains("شيراتون")) {
                    targetLat = 26.2370; targetLon = 50.5820; // مودا مول / المنامة
                } else if (normalized.contains("سيف") || normalized.contains("السيف")) {
                    targetLat = 26.2410; targetLon = 50.5360; // مجمع السيف
                } else if (normalized.contains("سيتي سنتر") || normalized.contains("ستي سنتر")) {
                    targetLat = 26.2345; targetLon = 50.5510; // سيتي سنتر
                } else if (normalized.contains("افنيوز") || normalized.contains("الأفنيوز")) {
                    targetLat = 26.2425; targetLon = 50.5780; // الأفنيوز
                } else if (normalized.contains("مراسي") || normalized.contains("ديار المحرق")) {
                    targetLat = 26.2940; targetLon = 50.6410; // مراسي جاليريا
                } else if (normalized.contains("انماء") || normalized.contains("الإنماء")) {
                    targetLat = 26.1260; targetLon = 50.5740; // مجمع الإنماء
                } else if (normalized.contains("رملي") || normalized.contains("الرملي")) {
                    targetLat = 26.1710; targetLon = 50.5400; // مجمع الرملي
                } else if (normalized.contains("دلمونيا")) {
                    targetLat = 26.2910; targetLon = 50.6650; // مجمع دلمونيا
                } else if (normalized.contains("ليوان") || normalized.contains("الليوان")) {
                    targetLat = 26.1680; targetLon = 50.4850; // مجمع الليوان
                } else if (normalized.contains("سلمانية") || normalized.contains("السلمانية")) {
                    targetLat = 26.2120; targetLon = 50.5840; // مستشفى السلمانية
                } else if (normalized.contains("مطار")) {
                    targetLat = 26.2708; targetLon = 50.6332; // مطار البحرين
                } else if (normalized.contains("جسر") || normalized.contains("كوزواي")) {
                    targetLat = 26.1770; targetLon = 50.4610; // جسر الملك فهد
                } else if (normalized.contains("منامه") || normalized.contains("المنامة")) {
                    targetLat = 26.2235; targetLon = 50.5876;
                } else if (normalized.contains("محرق") || normalized.contains("المحرق")) {
                    targetLat = 26.2572; targetLon = 50.6119;
                } else if (normalized.contains("رفاع") || normalized.contains("الرفاع")) {
                    targetLat = 26.1300; targetLon = 50.5550;
                } else if (normalized.contains("حمد") || normalized.contains("مدينة حمد")) {
                    targetLat = 26.1150; targetLon = 50.5069;
                } else if (normalized.contains("عيسى") || normalized.contains("مدينة عيسى")) {
                    targetLat = 26.1736; targetLon = 50.5478;
                } else if (normalized.contains("ستره") || normalized.contains("سترة")) {
                    targetLat = 26.1547; targetLon = 50.6206;
                } else if (normalized.contains("سار")) {
                    targetLat = 26.2050; targetLon = 50.5100;
                }

                if (targetLat != null && targetLon != null) {
                    double dLat = Math.toRadians(targetLat - driverLat);
                    double dLon = Math.toRadians(targetLon - driverLon);
                    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos(Math.toRadians(driverLat)) * Math.cos(Math.toRadians(targetLat)) *
                            Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    double distKm = 6371.0 * c;

                    if (distKm > coverageKm) {
                        return; // حجب الطلب خارج نطاق التغطية في الخلفية
                    }
                }
            }
        }

        String fingerprint = normalized
                .replaceAll("(?:\\+?973|00973)?\\s*[36]\\d{7}", "")
                .replaceAll("\\d{1,2}[:.]\\d{2}", "")
                .trim();

        SharedPreferences dedup = getSharedPreferences(DEDUP_PREFS, MODE_PRIVATE);
        String previous = dedup.getString("last_" + fingerprint.hashCode(), "");
        long previousAt = 0L;
        try { previousAt = Long.parseLong(previous); } catch (Exception ignored) {}
        if (postTime - previousAt >= 0 && postTime - previousAt < NATIVE_DEDUP_TTL_MS) return;
        dedup.edit().putString("last_" + fingerprint.hashCode(), String.valueOf(postTime)).apply();

        // 1. Identify Areas
        String fromArea = "البحرين";
        String toArea = "البحرين";
        if (normalized.contains("سيف")) fromArea = "السيف";
        else if (normalized.contains("منامه")) fromArea = "المنامة";
        else if (normalized.contains("محرق")) fromArea = "المحرق";
        else if (normalized.contains("عدلية") || normalized.contains("عدليه")) fromArea = "العدلية";
        else if (normalized.contains("رفاع")) fromArea = "الرفاع";
        else if (normalized.contains("ستره")) fromArea = "سترة";
        else if (normalized.contains("عيسى")) fromArea = "مدينة عيسى";
        else if (normalized.contains("حمد")) fromArea = "مدينة حمد";
        else if (normalized.contains("سار")) fromArea = "سار";

        if (normalized.contains("الى رفاع") || normalized.contains("إلى الرفاع") || normalized.contains("للرفاع")) toArea = "الرفاع";
        else if (normalized.contains("الى محرق") || normalized.contains("إلى المحرق") || normalized.contains("للمحرق")) toArea = "المحرق";
        else if (normalized.contains("الى منامه") || normalized.contains("إلى المنامة") || normalized.contains("للمنامة")) toArea = "المنامة";
        else if (normalized.contains("الى سار") || normalized.contains("إلى سار") || normalized.contains("لسار")) toArea = "سار";
        else if (normalized.contains("الى حمد") || normalized.contains("إلى مدينة حمد")) toArea = "مدينة حمد";
        else if (normalized.contains("الى عيسى") || normalized.contains("إلى مدينة عيسى")) toArea = "مدينة عيسى";
        else if (normalized.contains("الى عدلية") || normalized.contains("إلى العدلية")) toArea = "العدلية";

        // 2. Identify Passenger Status & Count
        boolean isPassenger = normalized.contains("أشخاص") || normalized.contains("اشخاص") || 
                              normalized.contains("ركاب") || normalized.contains("مشوار خاص") || 
                              normalized.contains("توصيل شخص");
        int passengerCount = 0;
        java.util.regex.Matcher pCountMatcher = java.util.regex.Pattern.compile("(\\d+)\\s*(?:أشخاص|اشخاص|ركاب|أفراد|ناس)").matcher(normalized);
        if (pCountMatcher.find()) {
            try { passengerCount = Integer.parseInt(pCountMatcher.group(1)); } catch (Exception ignored) {}
        }

        // 3. Identify Price
        String priceDisplay = "";
        float priceVal = 0.0f;
        java.util.regex.Matcher priceMatcher = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:د\\.ب|دب|دينار|bd|bhd)").matcher(normalized);
        if (priceMatcher.find()) {
            try {
                priceVal = Float.parseFloat(priceMatcher.group(1));
                if (priceVal > 0) priceDisplay = (priceVal == Math.floor(priceVal) ? String.valueOf((int) priceVal) : String.valueOf(priceVal)) + " دينار";
            } catch (Exception ignored) {}
        }

        createOrderChannel();

        String orderId = "ord-notif-" + Math.abs(fingerprint.hashCode());
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = null;
        if (launchIntent != null) {
            launchIntent.setAction(Intent.ACTION_VIEW);
            launchIntent.setData(android.net.Uri.parse("orderi://order/" + orderId));
            launchIntent.putExtra("order_id", orderId);
            launchIntent.putExtra("from_area", fromArea);
            launchIntent.putExtra("to_area", toArea);
            launchIntent.putExtra("price", priceVal);
            launchIntent.putExtra("raw_text", rawText);
            launchIntent.putExtra("sender_name", title);
            launchIntent.putExtra("passenger_count", passengerCount);
            launchIntent.putExtra("is_passenger", isPassenger);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            pendingIntent = PendingIntent.getActivity(
                    this, Math.abs(fingerprint.hashCode()), launchIntent,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                            : PendingIntent.FLAG_UPDATE_CURRENT);
        }

        String clean = rawText.length() > 90 ? rawText.substring(0, 90) + "..." : rawText;

        String notifTitle = isPassenger 
            ? "🚨 نقل ركاب " + (passengerCount > 0 ? "(" + passengerCount + " ركاب) " : "") + "• تحذير 🚫"
            : "🚗 طلب جديد: " + fromArea + " ← " + toArea;

        String routeText = fromArea + " ← " + toArea + (priceDisplay.isEmpty() ? "" : " " + priceDisplay);
        String notifBody = routeText;

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);

        builder.setSmallIcon(com.orderi.radar.R.drawable.orderi_notification_icon)
                .setContentTitle(notifTitle)
                .setContentText(routeText)
                .setStyle(new Notification.BigTextStyle().bigText(notifBody))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_MESSAGE)
                .setPriority(Notification.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_ALL)
                .setVisibility(Notification.VISIBILITY_PUBLIC);

        if (pendingIntent != null) builder.setContentIntent(pendingIntent);

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            int id = Math.abs(fingerprint.hashCode());
            manager.notify(id == 0 ? 1 : id, builder.build());
        }
    }

    private void createOrderChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Orderi - طلبات التوصيل", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("تنبيهات طلبات التوصيل من واتساب");
        channel.enableVibration(true);
        channel.setLightColor(Color.GREEN);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }

    private boolean appendEvent(JSONObject event) {
        synchronized (WhatsAppNotificationListenerService.class) {
            SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
            SharedPreferences dedupPrefs = getSharedPreferences(DEDUP_PREFS, MODE_PRIVATE);
            String eventId = event.optString("id", "");
            if (TextUtils.isEmpty(eventId)) return false;

            long now = System.currentTimeMillis();
            JSONObject seen;
            try { seen = new JSONObject(dedupPrefs.getString("seen_ids", "{}")); }
            catch (Exception ignored) { seen = new JSONObject(); }

            // Keep a bounded 24-hour idempotency ledger across process restarts.
            java.util.Iterator<String> seenKeys = seen.keys();
            while (seenKeys.hasNext()) {
                String key = seenKeys.next();
                if (seen.optLong(key, 0L) <= now) seenKeys.remove();
            }
            if (seen.optLong(eventId, 0L) > now) return false;

            JSONArray existing;
            try { existing = new JSONArray(prefs.getString(KEY_EVENTS, "[]")); }
            catch (Exception ignored) { existing = new JSONArray(); }
            for (int i = 0; i < existing.length(); i++) {
                JSONObject queued = existing.optJSONObject(i);
                if (queued != null && eventId.equals(queued.optString("id"))) return false;
            }

            // Keep oldest unacknowledged events when possible; the queue is bounded
            // to protect device storage. Queue overflow is explicitly logged.
            if (existing.length() >= 500) {
                android.util.Log.e("OrderiSpider", "Persistent notification queue full; dropping oldest unacknowledged event");
                JSONArray trimmed = new JSONArray();
                for (int i = 1; i < existing.length(); i++) {
                    JSONObject queued = existing.optJSONObject(i);
                    if (queued != null) trimmed.put(queued);
                }
                existing = trimmed;
            }
            existing.put(event);
            boolean persisted = prefs.edit().putString(KEY_EVENTS, existing.toString()).commit();
            if (!persisted) {
                android.util.Log.e("OrderiSpider", "Could not persist WhatsApp notification event");
                return false;
            }
            try { seen.put(eventId, now + 24L * 60L * 60L * 1000L); }
            catch (Exception ignored) {}
            dedupPrefs.edit().putString("seen_ids", seen.toString()).commit();
            return true;
        }
    }

    /** Acknowledge only events the JavaScript pipeline finished handling. */
    public static int acknowledgePendingEvents(android.content.Context context, java.util.Set<String> ids) {
        if (context == null || ids == null || ids.isEmpty()) return 0;
        synchronized (WhatsAppNotificationListenerService.class) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, MODE_PRIVATE);
            JSONArray existing;
            try { existing = new JSONArray(prefs.getString(KEY_EVENTS, "[]")); }
            catch (Exception ignored) { existing = new JSONArray(); }
            JSONArray remaining = new JSONArray();
            int removed = 0;
            for (int i = 0; i < existing.length(); i++) {
                JSONObject event = existing.optJSONObject(i);
                if (event == null) continue;
                if (ids.contains(event.optString("id", ""))) removed++;
                else remaining.put(event);
            }
            prefs.edit().putString(KEY_EVENTS, remaining.toString()).commit();
            return removed;
        }
    }

    private String safe(CharSequence value) {
        return value == null ? "" : value.toString();
    }

    public static boolean isEnabled(android.content.Context context) {
        String flat = android.provider.Settings.Secure.getString(
                context.getContentResolver(), "enabled_notification_listeners");
        if (flat == null) return false;
        ComponentName expected = new ComponentName(context, WhatsAppNotificationListenerService.class);
        for (String item : flat.split(":")) {
            ComponentName cn = ComponentName.unflattenFromString(item);
            if (expected.equals(cn)) return true;
        }
        return false;
    }
}
