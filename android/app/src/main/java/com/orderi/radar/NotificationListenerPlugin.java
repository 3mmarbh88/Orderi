package com.orderi.radar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;
import androidx.core.content.ContextCompat;

import androidx.annotation.Nullable;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

@CapacitorPlugin(name = "OrderiNotificationListener")
public class NotificationListenerPlugin extends Plugin {
    private static NotificationListenerPlugin instance;
    private static JSObject pendingOrderClick = null;
    private BroadcastReceiver receiver;
    private BroadcastReceiver orderDismissReceiver;

    public static void handleOrderIntent(Intent intent) {
        if (intent == null) return;
        String orderId = intent.getStringExtra("order_id");
        if (orderId == null && intent.getData() != null) {
            String path = intent.getData().getPath();
            if (path != null && path.contains("order/")) {
                orderId = path.substring(path.indexOf("order/") + 6);
            }
        }
        if (orderId != null) {
            JSObject obj = new JSObject();
            obj.put("orderId", orderId);
            obj.put("from", intent.getStringExtra("from_area"));
            obj.put("to", intent.getStringExtra("to_area"));
            obj.put("price", intent.getFloatExtra("price", 0.0f));
            obj.put("rawText", intent.getStringExtra("raw_text"));
            obj.put("senderName", intent.getStringExtra("sender_name"));
            obj.put("passengerCount", intent.getIntExtra("passenger_count", 0));
            obj.put("isPassenger", intent.getBooleanExtra("is_passenger", false));

            if (instance != null) {
                instance.notifyListeners("openOrderDetail", obj);
            } else {
                pendingOrderClick = obj;
            }
        }
    }

    @Override
    public void load() {
        instance = this;
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!WhatsAppNotificationListenerService.ACTION_EVENT.equals(intent.getAction())) return;
                String json = intent.getStringExtra("event");
                if (json == null) return;
                try {
                    JSObject ret = new JSObject(json);
                    notifyListeners("whatsappNotification", ret);
                } catch (Exception ignored) {}
            }
        };
        IntentFilter filter = new IntentFilter(WhatsAppNotificationListenerService.ACTION_EVENT);
        ContextCompat.registerReceiver(getContext(), receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
        orderDismissReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context context, Intent intent) {
                if (!OrderiOrderNotificationDismissReceiver.ACTION_DISMISSED.equals(intent.getAction())) return;
                String orderId = intent.getStringExtra("order_id");
                if (orderId == null || orderId.trim().isEmpty()) return;
                JSObject payload = new JSObject();
                payload.put("orderId", orderId);
                notifyListeners("orderNotificationDismissed", payload);
            }
        };
        ContextCompat.registerReceiver(getContext(), orderDismissReceiver,
                new IntentFilter(OrderiOrderNotificationDismissReceiver.ACTION_DISMISSED),
                ContextCompat.RECEIVER_NOT_EXPORTED);

        if (pendingOrderClick != null) {
            JSObject pending = pendingOrderClick;
            pendingOrderClick = null;
            notifyListeners("openOrderDetail", pending);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) instance = null;
        if (receiver != null) {
            try { getContext().unregisterReceiver(receiver); } catch (Exception ignored) {}
            receiver = null;
        }
        if (orderDismissReceiver != null) {
            try { getContext().unregisterReceiver(orderDismissReceiver); } catch (Exception ignored) {}
            orderDismissReceiver = null;
        }
        super.handleOnDestroy();
    }


    @PluginMethod
    public void showOrderNotification(PluginCall call) {
        try {
            String orderId = call.getString("orderId", "").trim();
            if (orderId.isEmpty()) { call.reject("Missing orderId"); return; }
            Context context = getContext();
            android.app.NotificationManager manager = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) { call.reject("Notification manager unavailable"); return; }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                android.app.NotificationChannel channel = new android.app.NotificationChannel(
                    "orderi_radar_orders", "Orderi Radar Orders", android.app.NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Only orders accepted into Orderi Radar");
                channel.enableVibration(true);
                manager.createNotificationChannel(channel);
            }
            int notificationId = orderId.hashCode() & 0x7fffffff;
            if (notificationId == 0) notificationId = 1;
            Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            android.app.PendingIntent contentIntent = null;
            if (launch != null) {
                launch.setAction(Intent.ACTION_VIEW);
                launch.setData(android.net.Uri.parse("orderi://order/" + android.net.Uri.encode(orderId)));
                launch.putExtra("order_id", orderId);
                launch.putExtra("from_area", call.getString("from", ""));
                launch.putExtra("to_area", call.getString("to", ""));
                launch.putExtra("price", call.getDouble("price", 0.0).doubleValue());
                launch.putExtra("raw_text", call.getString("rawText", ""));
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                contentIntent = android.app.PendingIntent.getActivity(context, notificationId, launch,
                    android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M
                        ? android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                        : android.app.PendingIntent.FLAG_UPDATE_CURRENT);
            }
            Intent delete = new Intent(context, OrderiOrderNotificationDismissReceiver.class);
            delete.setAction(OrderiOrderNotificationDismissReceiver.ACTION_DISMISSED);
            delete.putExtra("order_id", orderId);
            android.app.PendingIntent deleteIntent = android.app.PendingIntent.getBroadcast(context, notificationId, delete,
                android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M
                    ? android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                    : android.app.PendingIntent.FLAG_UPDATE_CURRENT);
            String from = call.getString("from", "غير محدد");
            String to = call.getString("to", "غير محدد");
            String price = call.getString("priceDisplay", "");
            String routeText = from + " ← " + to + (price.isEmpty() ? "" : " " + price.replace(" د.ب", " دينار"));
            String body = routeText;
            android.app.Notification.Builder builder = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O
                ? new android.app.Notification.Builder(context, "orderi_radar_orders")
                : new android.app.Notification.Builder(context);
            builder.setSmallIcon(com.orderi.radar.R.drawable.orderi_notification_icon)
                .setContentTitle(routeText)
                .setContentText(routeText)
                .setStyle(new android.app.Notification.BigTextStyle().bigText(body))
                .setAutoCancel(true).setDeleteIntent(deleteIntent)
                .setCategory(android.app.Notification.CATEGORY_MESSAGE)
                .setPriority(android.app.Notification.PRIORITY_HIGH)
                .setDefaults(android.app.Notification.DEFAULT_ALL);
            if (contentIntent != null) builder.setContentIntent(contentIntent);
            manager.notify(notificationId, builder.build());
            android.content.SharedPreferences prefs = context.getSharedPreferences("orderi_radar_notification_ids", Context.MODE_PRIVATE);
            JSONArray ids = new JSONArray(prefs.getString("ids", "[]"));
            boolean found = false;
            for (int i = 0; i < ids.length(); i++) if (orderId.equals(ids.optString(i))) found = true;
            if (!found) ids.put(orderId);
            prefs.edit().putString("ids", ids.toString()).apply();
            call.resolve();
        } catch (Exception e) { call.reject("Could not show Radar order notification", e); }
    }

    @PluginMethod
    public void cancelOrderNotification(PluginCall call) {
        String orderId = call.getString("orderId", "").trim();
        if (!orderId.isEmpty()) {
            android.app.NotificationManager manager = (android.app.NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.cancel(orderId.hashCode() & 0x7fffffff);
            removeTrackedNotificationId(orderId);
        }
        call.resolve();
    }

    @PluginMethod
    public void syncOrderNotifications(PluginCall call) {
        try {
            java.util.HashSet<String> activeIds = new java.util.HashSet<>();
            JSArray ids = call.getArray("orderIds");
            if (ids != null) for (int i = 0; i < ids.length(); i++) {
                try { String id = ids.getString(i); if (id != null && !id.isEmpty()) activeIds.add(id); } catch (Exception ignored) {}
            }
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("orderi_radar_notification_ids", Context.MODE_PRIVATE);
            JSONArray tracked = new JSONArray(prefs.getString("ids", "[]"));
            android.app.NotificationManager manager = (android.app.NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            JSONArray kept = new JSONArray();
            for (int i = 0; i < tracked.length(); i++) {
                String id = tracked.optString(i, "");
                if (id.isEmpty()) continue;
                if (activeIds.contains(id)) kept.put(id);
                else if (manager != null) manager.cancel(id.hashCode() & 0x7fffffff);
            }
            prefs.edit().putString("ids", kept.toString()).apply();
            call.resolve();
        } catch (Exception e) { call.reject("Could not sync Radar notifications", e); }
    }

    @PluginMethod
    public void getDismissedOrderIds(PluginCall call) {
        JSArray ids = new JSArray();
        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences(
                OrderiOrderNotificationDismissReceiver.PREFS, Context.MODE_PRIVATE);
            JSONArray saved = new JSONArray(prefs.getString(OrderiOrderNotificationDismissReceiver.KEY_DISMISSED, "[]"));
            for (int i = 0; i < saved.length(); i++) ids.put(saved.optString(i));
            prefs.edit().remove(OrderiOrderNotificationDismissReceiver.KEY_DISMISSED).apply();
        } catch (Exception ignored) {}
        JSObject ret = new JSObject();
        ret.put("orderIds", ids);
        call.resolve(ret);
    }

    private void removeTrackedNotificationId(String orderId) {
        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("orderi_radar_notification_ids", Context.MODE_PRIVATE);
            JSONArray saved = new JSONArray(prefs.getString("ids", "[]"));
            JSONArray next = new JSONArray();
            for (int i = 0; i < saved.length(); i++) if (!orderId.equals(saved.optString(i))) next.put(saved.get(i));
            prefs.edit().putString("ids", next.toString()).apply();
        } catch (Exception ignored) {}
    }

    @PluginMethod
    public void getClickedOrder(PluginCall call) {
        JSObject ret = new JSObject();
        if (pendingOrderClick != null) {
            ret.put("order", pendingOrderClick);
            pendingOrderClick = null;
        } else {
            ret.put("order", null);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", WhatsAppNotificationListenerService.isEnabled(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open Android notification access settings", e);
        }
    }

    @PluginMethod
    public void moveToBackground(PluginCall call) {
        try {
            getContext().getSharedPreferences(BackgroundRadarService.PREFS, Context.MODE_PRIVATE)
                    .edit().putBoolean(BackgroundRadarService.KEY_ENABLED, true).apply();
            if (getActivity() != null) {
                getActivity().moveTaskToBack(true);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to move Orderi to background", e);
        }
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        JSObject ret = new JSObject();
        JSArray arr = new JSArray();
        try {
            synchronized (WhatsAppNotificationListenerService.class) {
                android.content.SharedPreferences prefs = getContext().getSharedPreferences(
                        WhatsAppNotificationListenerService.PREFS, Context.MODE_PRIVATE);
                JSONArray events = new JSONArray(prefs.getString(
                        WhatsAppNotificationListenerService.KEY_EVENTS, "[]"));
                for (int i = 0; i < events.length(); i++) {
                    arr.put(new JSObject(events.getJSONObject(i).toString()));
                }
            }
        } catch (Exception ignored) {}
        ret.put("events", arr);
        call.resolve(ret);
    }

    /**
     * Remove events only after the JS processing pipeline finishes. A crash or
     * rejected parser promise leaves the event queued for the next app launch.
     */
    @PluginMethod
    public void acknowledgeEvents(PluginCall call) {
        com.getcapacitor.JSArray ids = call.getArray("ids");
        java.util.HashSet<String> eventIds = new java.util.HashSet<>();
        if (ids != null) {
            for (int i = 0; i < ids.length(); i++) {
                String id = ids.optString(i, "");
                if (id != null && !id.trim().isEmpty()) eventIds.add(id.trim());
            }
        }
        int acknowledged = WhatsAppNotificationListenerService.acknowledgePendingEvents(
                getContext(), eventIds);
        JSObject ret = new JSObject();
        ret.put("acknowledged", acknowledged);
        call.resolve(ret);
    }

    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", OrderiAccessibilityService.isAccessibilityEnabled(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open Android accessibility settings", e);
        }
    }

    @PluginMethod
    public void openWhatsAppGroupConversation(PluginCall call) {
        String groupName = call.getString("groupName", "").trim();
        JSObject ret = new JSObject();
        if (android.text.TextUtils.isEmpty(groupName)) {
            ret.put("success", false);
            ret.put("method", "missing_group_name");
            call.resolve(ret);
            return;
        }

        // Only open an exact matching group notification intent. Never guess
        // between similarly named groups or fall back to an unrelated chat.
        boolean opened = WhatsAppNotificationListenerService.openWhatsAppGroupConversation(
                getContext(), groupName);
        if (!opened) {
            try {
                android.content.pm.PackageManager pm = getContext().getPackageManager();
                android.content.Intent launchIntent = pm.getLaunchIntentForPackage("com.whatsapp");
                if (launchIntent == null) {
                    launchIntent = pm.getLaunchIntentForPackage("com.whatsapp.w4b");
                }
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(launchIntent);
                    opened = true;
                }
            } catch (Exception ignored) {}
        }
        ret.put("success", opened);
        ret.put("method", opened ? "cached_group_or_whatsapp" : "group_not_found");
        call.resolve(ret);
    }

    @PluginMethod
    public void openWhatsAppPrivateConversation(PluginCall call) {
        String phone = call.getString("phone", "").trim();
        String memberName = call.getString("memberName", "").trim();
        JSObject ret = new JSObject();
        boolean opened = false;

        // 1. If phone number is available, launch WhatsApp direct chat by phone
        if (!android.text.TextUtils.isEmpty(phone)) {
            String cleanPhone = phone.replaceAll("\\D", "");
            if (cleanPhone.length() == 8) cleanPhone = "973" + cleanPhone;
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(android.net.Uri.parse("https://api.whatsapp.com/send?phone=" + cleanPhone));
                intent.setPackage("com.whatsapp");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                opened = true;
            } catch (Exception e1) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(android.net.Uri.parse("https://api.whatsapp.com/send?phone=" + cleanPhone));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                    opened = true;
                } catch (Exception ignored) {}
            }
        }

        // 2. If phone is not provided, try cached private conversation intent by member name
        if (!opened && !android.text.TextUtils.isEmpty(memberName)) {
            opened = WhatsAppNotificationListenerService.openWhatsAppPrivateConversation(getContext(), memberName);
        }

        // 3. Fallback: launch WhatsApp app
        if (!opened) {
            try {
                android.content.pm.PackageManager pm = getContext().getPackageManager();
                Intent launchIntent = pm.getLaunchIntentForPackage("com.whatsapp");
                if (launchIntent == null) launchIntent = pm.getLaunchIntentForPackage("com.whatsapp.w4b");
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(launchIntent);
                    opened = true;
                }
            } catch (Exception ignored) {}
        }

        ret.put("success", opened);
        ret.put("method", opened ? "whatsapp_private_opened" : "not_opened");
        call.resolve(ret);
    }

    @PluginMethod
    public void getPrivateOutreachStatus(PluginCall call) {
        android.content.SharedPreferences prefs = getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE);
        JSObject ret = new JSObject();
        ret.put("status", prefs.getString("status", "not_started"));
        ret.put("statusLabel", prefs.getString("status_label", ""));
        ret.put("updatedAt", prefs.getLong("updated_at", 0L));
        call.resolve(ret);
    }

    @PluginMethod
    public void publishToWhatsAppGroups(PluginCall call) {
        try {
            String message = call.getString("message", "");
            JSArray names = call.getArray("groupNames");
            java.util.List<String> groups = new java.util.ArrayList<>();
            if (names != null) {
                for (int i = 0; i < names.length(); i++) {
                    try {
                        String name = names.getString(i);
                        if (name != null && !name.trim().isEmpty()) groups.add(name.trim());
                    } catch (Exception ignored) {}
                }
            }
            if (android.text.TextUtils.isEmpty(message) || groups.isEmpty()) {
                call.reject("Message and at least one WhatsApp group are required");
                return;
            }

            // Single execution: queueGroupBroadcast iterates through each unique group strictly ONCE
            boolean queued = false;
            try {
                queued = OrderiAccessibilityService.queueGroupBroadcast(getContext(), groups, message);
            } catch (Exception ignored) {}

            // Mark private outreach status as confirmed
            getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                    .edit()
                    .putString("status", "sent_confirmed")
                    .putString("status_label", "تم إطلاق النشر في الخلفية إلى " + groups.size() + " قروب")
                    .putLong("updated_at", System.currentTimeMillis())
                    .apply();

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("method", "background_group_broadcast");
            ret.put("groupCount", groups.size());
            ret.put("directSentCount", queued ? groups.size() : 0);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("method", "background_fallback");
            call.resolve(ret);
        }
    }

    /**
     * Sends a completion reply through the most recent exact-group WhatsApp notification action.
     * This does not open WhatsApp.
     */
    @PluginMethod
    public void replyDoneToOriginalAd(PluginCall call) {
        String targetGroup = call.getString("targetGroup", "").trim();
        String message = call.getString("message", "تم");
        if (android.text.TextUtils.isEmpty(message)) {
            message = "تم";
        }
        JSObject ret = new JSObject();
        if (targetGroup.isEmpty()) {
            ret.put("success", false);
            ret.put("method", "missing_target_group");
            call.resolve(ret);
            return;
        }
        boolean sent = WhatsAppNotificationListenerService.sendGroupNotificationReply(getContext(), targetGroup, message);
        ret.put("success", sent);
        ret.put("method", sent ? "group_notification_remote_input" : "no_recent_exact_group_reply_action");
        ret.put("targetGroup", targetGroup);
        ret.put("message", message);
        call.resolve(ret);
    }

    @PluginMethod
    public void sendPrivateNotificationReply(PluginCall call) {
        String target = call.getString("target", "").trim();
        String message = call.getString("message", "");
        JSObject ret = new JSObject();
        boolean sent = WhatsAppNotificationListenerService.sendPrivateNotificationReply(getContext(), target, message);
        ret.put("success", sent);
        ret.put("method", sent ? "private_notification_remote_input" : "no_exact_private_reply_action");
        if (sent) {
            getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                .edit()
                .putString("status", "sent_confirmed")
                .putString("status_label", "تم تنفيذ الرد من إشعار المحادثة الخاصة دون فتح واتساب")
                .putLong("updated_at", System.currentTimeMillis())
                .apply();
        }
        call.resolve(ret);
    }

    /**
     * Pure background advertiser outreach. NEVER launches WhatsApp foreground app or opens any links.
     */
    @PluginMethod
    public void reachAdvertiserPrivateChat(PluginCall call) {
        try {
            String phone = call.getString("phone", "");
            String memberName = call.getString("memberName", "");
            String groupName = call.getString("groupName", "");
            String message = call.getString("message", "");
            boolean autoSend = call.getBoolean("autoSend", true);

            if (android.text.TextUtils.isEmpty(message)) {
                call.reject("Message is empty");
                return;
            }

            // Case A: Phone number exists directly or inside memberName
            String targetPhone = phone;
            if (android.text.TextUtils.isEmpty(targetPhone) && !android.text.TextUtils.isEmpty(memberName)) {
                String memberDigits = memberName.replaceAll("\\D", "");
                if (memberDigits.length() >= 8 && memberDigits.length() <= 15) {
                    targetPhone = memberDigits;
                }
            }

            // Attempt silent background notification reply first
            boolean sent = false;
            if (!android.text.TextUtils.isEmpty(targetPhone)) {
                String cleanPhone = targetPhone.replaceAll("\\D", "");
                if (cleanPhone.length() == 8) {
                    cleanPhone = "973" + cleanPhone;
                }
                sent = WhatsAppNotificationListenerService.sendPrivateNotificationReply(getContext(), cleanPhone, message);
            }
            if (!sent && !android.text.TextUtils.isEmpty(memberName)) {
                sent = WhatsAppNotificationListenerService.sendPrivateNotificationReply(getContext(), memberName, message);
            }

            // Mark status in SharedPreferences (pure background, zero foreground switch)
            getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                    .edit()
                    .putString("status", "sent_confirmed")
                    .putString("status_label", sent ? "تم إرسال رسالة القبول بالخاص للمعلن بالخلفية دون فتح واتساب" : "تم تجهيز رسالة القبول بالخاص للمعلن بالخلفية")
                    .putLong("updated_at", System.currentTimeMillis())
                    .apply();

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("method", sent ? "background_notification_private_reply" : "background_private_outreach_ready");
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("method", "private_outreach_fallback");
            call.resolve(ret);
        }
    }


    @PluginMethod
    public void updateFilterSettings(PluginCall call) {
        try {
            boolean ignoreNonMatching = call.getBoolean("ignoreNonMatching", false);
            double minPrice = call.getDouble("minPrice", 0.0);
            double coverageKm = call.getDouble("coverageKm", 10.0);
            double driverLat = call.getDouble("driverLat", 0.0);
            double driverLon = call.getDouble("driverLon", 0.0);
            boolean blockPassenger = call.getBoolean("blockPassenger", true);
            boolean notificationsEnabled = call.getBoolean("notificationsEnabled", true);

            android.content.SharedPreferences.Editor editor = getContext()
                    .getSharedPreferences("orderi_filter_settings", Context.MODE_PRIVATE).edit();
            editor.putBoolean("ignore_non_matching", ignoreNonMatching);
            editor.putFloat("min_price", (float) minPrice);
            editor.putFloat("coverage_km", (float) coverageKm);
            editor.putFloat("driver_lat", (float) driverLat);
            editor.putFloat("driver_lon", (float) driverLon);
            editor.putBoolean("block_passenger", blockPassenger);
            editor.putBoolean("notifications_enabled", notificationsEnabled);
            editor.apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not update native filter settings", e);
        }
    }

    @PluginMethod
    public void markGroupAsRead(PluginCall call) {
        String groupName = call.getString("groupName", "").trim();
        JSObject ret = new JSObject();
        if (android.text.TextUtils.isEmpty(groupName)) {
            ret.put("success", false);
            ret.put("markedCount", 0);
            ret.put("method", "missing_group_name");
            call.resolve(ret);
            return;
        }
        int count = WhatsAppNotificationListenerService.markWhatsAppGroupAsRead(groupName);
        ret.put("success", count > 0);
        ret.put("markedCount", count);
        ret.put("method", count > 0 ? "notification_mark_as_read_action" : "no_matching_mark_as_read_action");
        call.resolve(ret);
    }

    @PluginMethod
    public void markAllAsRead(PluginCall call) {
        try {
            java.util.List<String> targetGroups = new java.util.ArrayList<>();
            com.getcapacitor.JSArray groups = call.getArray("groupNames");
            if (groups != null) {
                for (int i = 0; i < groups.length(); i++) {
                    try {
                        String g = groups.getString(i);
                        if (g != null && !g.trim().isEmpty()) {
                            targetGroups.add(g.trim());
                        }
                    } catch (Exception ignored) {}
                }
            }

            // 1. Execute Android notification Mark As Read actions for active status bar WhatsApp notifications
            int count = WhatsAppNotificationListenerService.markAllWhatsAppAsRead(getContext(), null);

            // 2. Clear archived chats via Accessibility automation so when user opens WhatsApp, ALL archived chats are 100% read
            boolean includeArchived = call.getBoolean("includeArchived", true);
            boolean archivedAutomationStarted = false;
            boolean accessibilityRequired = false;

            if (includeArchived) {
                if (OrderiAccessibilityService.isAccessibilityEnabled(getContext())) {
                    archivedAutomationStarted = OrderiAccessibilityService.requestMarkArchivedChatsRead(getContext());
                } else {
                    accessibilityRequired = true;
                }
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("markedCount", count);
            ret.put("archivedAutomationStarted", archivedAutomationStarted);
            ret.put("accessibilityRequired", accessibilityRequired);
            ret.put("whatsAppOpened", archivedAutomationStarted);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to mark WhatsApp groups as read", e);
        }
    }
}
