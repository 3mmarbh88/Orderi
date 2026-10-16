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
            String body = "الاستلام: " + from + "\\nالوجهة: " + to + (price.isEmpty() ? "" : "\\nالسعر: " + price);
            android.app.Notification.Builder builder = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O
                ? new android.app.Notification.Builder(context, "orderi_radar_orders")
                : new android.app.Notification.Builder(context);
            builder.setSmallIcon(com.orderi.radar.R.drawable.orderi_notification_icon)
                .setContentTitle("طلب في الرادار: " + from + " ← " + to)
                .setContentText(from + " ← " + to)
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
            android.content.SharedPreferences prefs = getContext().getSharedPreferences(
                    WhatsAppNotificationListenerService.PREFS, Context.MODE_PRIVATE);
            JSONArray events = new JSONArray(prefs.getString(
                    WhatsAppNotificationListenerService.KEY_EVENTS, "[]"));
            for (int i = 0; i < events.length(); i++) {
                arr.put(new JSObject(events.getJSONObject(i).toString()));
            }
            prefs.edit().remove(WhatsAppNotificationListenerService.KEY_EVENTS).apply();
        } catch (Exception ignored) {}
        ret.put("events", arr);
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
        ret.put("success", opened);
        ret.put("method", opened ? "cached_group_notification" : "group_not_found");
        call.resolve(ret);
    }

    @PluginMethod
    public void publishWhatsAppBroadcast(PluginCall call) {
        try {
            String message = call.getString("message", "");
            JSArray inputGroups = call.getArray("groupNames");
            java.util.ArrayList<String> groups = new java.util.ArrayList<>();
            if (inputGroups != null) {
                for (int i = 0; i < inputGroups.length(); i++) {
                    try {
                        String group = inputGroups.getString(i);
                        if (group != null && !group.trim().isEmpty()) groups.add(group.trim());
                    } catch (Exception ignored) {}
                }
            }
            if (android.text.TextUtils.isEmpty(message.trim())) {
                call.reject("Broadcast message is empty");
                return;
            }
            if (groups.isEmpty()) {
                call.reject("Select at least one WhatsApp group");
                return;
            }
            if (!OrderiAccessibilityService.isAccessibilityEnabled(getContext())
                    || !OrderiAccessibilityService.isServiceRunning()) {
                call.reject("Enable Orderi Accessibility to automate WhatsApp group publishing");
                return;
            }
            boolean queued = OrderiAccessibilityService.queueBroadcastToGroups(groups, message);
            if (!queued) {
                call.reject("Could not start group publishing. Another automation may be running or the first group has no available notification shortcut.");
                return;
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("method", "sequential_accessibility_group_broadcast");
            ret.put("queuedGroups", groups.size());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to start WhatsApp group broadcast", e);
        }
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

            // Automated sending requires the explicitly enabled Orderi Accessibility service.
            if (!OrderiAccessibilityService.isAccessibilityEnabled(getContext())) {
                call.reject("Orderi Accessibility permission is required for private message sending");
                return;
            }
            getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                    .edit()
                    .putString("status", "sending")
                    .putString("status_label", "جاري الوصول إلى محادثة المعلن الخاصة")
                    .putLong("updated_at", System.currentTimeMillis())
                    .apply();

            // Case A: Confirmed phone number exists -> Open WhatsApp private chat directly via native intent
            if (!android.text.TextUtils.isEmpty(phone)) {
                String cleanPhone = phone.replaceAll("\\D", "");
                OrderiAccessibilityService.queueMessageToSend(message, autoSend, groupName);

                try {
                    android.net.Uri uri = android.net.Uri.parse("whatsapp://send?phone=" + cleanPhone + "&text=" + java.net.URLEncoder.encode(message, "UTF-8"));
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    intent.setPackage("com.whatsapp");
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("method", "native_direct_phone_chat");
                    call.resolve(ret);
                    return;
                } catch (Exception ex) {
                    Intent fallback = new Intent(Intent.ACTION_VIEW);
                    fallback.setData(android.net.Uri.parse("https://api.whatsapp.com/send?phone=" + cleanPhone + "&text=" + java.net.URLEncoder.encode(message, "UTF-8")));
                    fallback.setPackage("com.whatsapp");
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(fallback);

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("method", "native_direct_phone_fallback");
                    call.resolve(ret);
                    return;
                }
            }

            // Case B: No phone number in ad text, but advertiser name is known.
            // Open the source group and let Accessibility click the advertiser name, choose Message,
            // verify that the destination is a private chat, then send the configured reply.
            if (!android.text.TextUtils.isEmpty(memberName)) {
                OrderiAccessibilityService.queueOutreachToMember(memberName, message, autoSend, groupName);

                // Try to launch directly to the specific conversation from cached notification
                boolean launched = false;
                if (!android.text.TextUtils.isEmpty(groupName)) {
                    launched = WhatsAppNotificationListenerService.openWhatsAppConversation(getContext(), groupName);
                }
                if (!launched && !android.text.TextUtils.isEmpty(memberName)) {
                    launched = WhatsAppNotificationListenerService.openWhatsAppConversation(getContext(), memberName);
                }

                if (!launched) {
                    // Launch WhatsApp directly so Accessibility Service takes over
                    Intent launchIntent = getContext().getPackageManager().getLaunchIntentForPackage("com.whatsapp");
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(launchIntent);
                    } else {
                        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("whatsapp://"));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(intent);
                    }
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("method", "accessibility_member_private_outreach");
                call.resolve(ret);
                return;
            }

            call.reject("Missing both phone and memberName for private outreach");
        } catch (Exception e) {
            call.reject("Failed to execute private outreach", e);
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

            // Execute only Android notification actions. Do not launch WhatsApp or
            // navigate into Archived: conversations without an active notification
            // expose no supported background "mark as read" action.
            int count = WhatsAppNotificationListenerService.markAllWhatsAppAsRead(getContext(), targetGroups);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("markedCount", count);
            ret.put("archivedAutomationStarted", false);
            ret.put("accessibilityRequired", false);
            ret.put("whatsAppOpened", false);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to mark WhatsApp groups as read", e);
        }
    }
}
