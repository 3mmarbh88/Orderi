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
    public static final String PREFS = "orderi_native_notifications";
    public static final String KEY_EVENTS = "events";
    public static final String ACTION_EVENT = "com.orderi.radar.WHATSAPP_NOTIFICATION";
    private static final String CHANNEL_ID = "orderi_orders";
    private static final String DEDUP_PREFS = "orderi_native_dedup";
    private static final long NATIVE_DEDUP_TTL_MS = 90_000L;

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !PACKAGE_WHATSAPP.equals(sbn.getPackageName())) return;

        Notification n = sbn.getNotification();
        if (n == null) return;
        Bundle extras = n.extras;
        if (extras == null) return;

        String title = safe(extras.getCharSequence(Notification.EXTRA_TITLE));
        String text = safe(extras.getCharSequence(Notification.EXTRA_TEXT));
        String bigText = safe(extras.getCharSequence(Notification.EXTRA_BIG_TEXT));
        String subText = safe(extras.getCharSequence(Notification.EXTRA_SUB_TEXT));
        String conversationTitle = safe(extras.getCharSequence("android.conversationTitle"));
        String category = n.category == null ? "" : n.category;

        // Some WhatsApp notifications expose the group as title and sender/message in text.
        String resolvedTitle = !TextUtils.isEmpty(conversationTitle) ? conversationTitle : title;
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
            event.put("id", UUID.randomUUID().toString());
            event.put("packageName", PACKAGE_WHATSAPP);
            event.put("title", resolvedTitle);
            event.put("text", text);
            event.put("bigText", bigText);
            event.put("subText", subText);
            event.put("rawText", rawText);
            event.put("receivedAt", sbn.getPostTime());
            event.put("key", sbn.getKey());
            event.put("conversationTitle", conversationTitle);
            event.put("category", category);
            // WhatsApp commonly exposes a conversation title for group notifications.
            // Do not claim every notification with a title is a group.
            boolean looksLikeGroup = !TextUtils.isEmpty(conversationTitle)
                    || (!TextUtils.isEmpty(title) && !TextUtils.isEmpty(text) && text.contains(": "));
            event.put("isGroup", looksLikeGroup);

            // Android-native Heads-Up notification. This runs inside the
            // NotificationListenerService, so it can fire while Orderi's
            // WebView is backgrounded or suspended.
            maybeShowOrderNotification(resolvedTitle, rawText, sbn.getPostTime(), looksLikeGroup);

            appendEvent(event);

            Intent broadcast = new Intent(ACTION_EVENT);
            broadcast.setPackage(getPackageName());
            broadcast.putExtra("event", event.toString());
            sendBroadcast(broadcast);
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
                 normalized.contains("pickup") || normalized.contains("delivery"))
                && (normalized.contains("من ") || normalized.contains("الى") ||
                    normalized.contains("إلى") || normalized.matches(".*\\d+(?:\\.\\d+)?\\s*(?:د\\.ب|دب|دينار|bd|bhd).*"));

        if (!looksLikeOrder) return;

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

        createOrderChannel();

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = null;
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            pendingIntent = PendingIntent.getActivity(
                    this, Math.abs(fingerprint.hashCode()), launchIntent,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                            : PendingIntent.FLAG_UPDATE_CURRENT);
        }

        String clean = rawText.length() > 120 ? rawText.substring(0, 120) + "..." : rawText;
        String body = "🚗 " + clean;

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);

        builder.setSmallIcon(com.orderi.radar.R.drawable.orderi_notification_icon)
                .setContentTitle("🚗 Orderi • طلب توصيل جديد")
                .setContentText(title + (isGroup ? " • " : " • خاص • ") + body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
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

    private void appendEvent(JSONObject event) {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        JSONArray existing;
        try {
            existing = new JSONArray(prefs.getString(KEY_EVENTS, "[]"));
        } catch (Exception e) {
            existing = new JSONArray();
        }
        // Keep only a small local queue so the service remains lightweight.
        JSONArray next = new JSONArray();
        int start = Math.max(0, existing.length() - 99);
        for (int i = start; i < existing.length(); i++) {
            try { next.put(existing.get(i)); } catch (Exception ignored) {}
        }
        next.put(event);
        prefs.edit().putString(KEY_EVENTS, next.toString()).apply();
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
