package com.orderi.radar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;
import android.util.Log;
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
            obj.put("senderPhone", intent.getStringExtra("sender_phone"));
            obj.put("groupName", intent.getStringExtra("group_name"));
            obj.put("passengerCount", intent.getIntExtra("passenger_count", 0));
            obj.put("isPassenger", intent.getBooleanExtra("is_passenger", false));

            if (instance != null) {
                instance.notifyListeners("openOrderDetail", obj);
            } else {
                pendingOrderClick = obj;
            }
        }
    }

    public static NotificationListenerPlugin getInstance() {
        return instance;
    }

    public void notifyMarkAllAsReadComplete(JSObject payload) {
        notifyListeners("markAllAsReadComplete", payload);
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
                launch.putExtra("group_name", call.getString("groupName", ""));
                launch.putExtra("sender_name", call.getString("senderName", ""));
                launch.putExtra("sender_phone", call.getString("senderPhone", ""));
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
    public void getDiagnosticStatus(PluginCall call) {
        JSObject ret = new JSObject();
        boolean listenerEnabled = WhatsAppNotificationListenerService.isEnabled(getContext());
        boolean serviceConnected = WhatsAppNotificationListenerService.isServiceConnected();
        boolean accessibilityEnabled = OrderiAccessibilityService.isAccessibilityEnabled(getContext());
        boolean accessibilityRunning = OrderiAccessibilityService.isServiceRunning();

        boolean batteryOptimizationIgnored = false;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                batteryOptimizationIgnored = pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
            }
        }

        int unreadCount = 0;
        try {
            unreadCount = WhatsAppNotificationListenerService.getUnreadWhatsAppNotificationCount();
        } catch (Exception ignored) {}

        int pendingCount = 0;
        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences(
                    WhatsAppNotificationListenerService.PREFS, Context.MODE_PRIVATE);
            org.json.JSONArray events = new org.json.JSONArray(prefs.getString(
                    WhatsAppNotificationListenerService.KEY_EVENTS, "[]"));
            pendingCount = events.length();
        } catch (Exception ignored) {}

        ret.put("listenerEnabled", listenerEnabled);
        ret.put("serviceConnected", serviceConnected);
        ret.put("isWhatsAppInstalled", com.orderi.whatsapp.WhatsAppPermissionManager.isWhatsAppInstalled(getContext()));
        ret.put("lastEventTimestamp", com.orderi.whatsapp.WhatsAppServiceMonitor.getLastEventTimestamp());
        ret.put("totalEventsIngested", com.orderi.whatsapp.WhatsAppServiceMonitor.getTotalEventsIngested());
        ret.put("lastError", com.orderi.whatsapp.WhatsAppServiceMonitor.getLastError());
        ret.put("accessibilityEnabled", accessibilityEnabled);
        ret.put("accessibilityRunning", accessibilityRunning);
        ret.put("batteryOptimizationIgnored", batteryOptimizationIgnored);
        ret.put("unreadGroupsCount", unreadCount);
        ret.put("pendingEventsCount", pendingCount);
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        boolean launched = false;
        Intent[] candidateIntents = new Intent[] {
            new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS),
            new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"),
            new Intent().setComponent(new android.content.ComponentName("com.android.settings", "com.android.settings.Settings$NotificationAccessSettingsActivity")),
            new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).setData(android.net.Uri.fromParts("package", getContext().getPackageName(), null)),
            new Intent(Settings.ACTION_SETTINGS)
        };

        for (Intent intent : candidateIntents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (getActivity() != null) {
                    getActivity().startActivity(intent);
                } else {
                    getContext().startActivity(intent);
                }
                launched = true;
                break;
            } catch (Exception ignored) {}
        }

        JSObject ret = new JSObject();
        ret.put("success", launched);
        if (launched) {
            call.resolve(ret);
        } else {
            call.reject("Unable to open Android notification access settings");
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
        boolean launched = false;
        Intent[] candidateIntents = new Intent[] {
            new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
            new Intent("android.settings.ACCESSIBILITY_SETTINGS"),
            new Intent().setComponent(new android.content.ComponentName("com.android.settings", "com.android.settings.AccessibilitySettings")),
            new Intent(Settings.ACTION_SETTINGS)
        };

        for (Intent intent : candidateIntents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (getActivity() != null) {
                    getActivity().startActivity(intent);
                } else {
                    getContext().startActivity(intent);
                }
                launched = true;
                break;
            } catch (Exception ignored) {}
        }

        JSObject ret = new JSObject();
        ret.put("success", launched);
        if (launched) {
            call.resolve(ret);
        } else {
            call.reject("Unable to open Android accessibility settings");
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

        // Open only the exact, recently cached group conversation intent.
        // If it is unavailable, fail rather than opening the WhatsApp home screen.
        boolean opened = WhatsAppNotificationListenerService.openWhatsAppGroupConversation(getContext(), groupName);
        ret.put("success", opened);
        ret.put("method", opened ? "exact_group_notification_intent" : "exact_group_intent_unavailable");
        ret.put("groupName", groupName);
        call.resolve(ret);
    }

    @PluginMethod
    public void openWhatsAppPrivateConversation(PluginCall call) {
        String phone = call.getString("phone", "").trim();
        String memberName = call.getString("memberName", "").trim();
        JSObject ret = new JSObject();
        ret.put("packageName", "com.whatsapp");

        if (!com.orderi.whatsapp.WhatsAppPermissionManager.isRegularWhatsAppInstalled(getContext())) {
            ret.put("success", false);
            ret.put("method", "regular_whatsapp_not_installed");
            call.resolve(ret);
            return;
        }

        boolean opened = false;
        // A supplied phone is an explicit destination; otherwise require an exact cached private-chat match in com.whatsapp.
        if (!android.text.TextUtils.isEmpty(phone)) {
            String cleanPhone = normalizeBahrainPhoneNumber(phone);
            if (cleanPhone.length() >= 8 && cleanPhone.length() <= 15) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(android.net.Uri.parse("https://api.whatsapp.com/send?phone=" + cleanPhone));
                    intent.setPackage("com.whatsapp");
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                    opened = true;
                } catch (Exception ignored) {}
            }
        } else if (!android.text.TextUtils.isEmpty(memberName)) {
            opened = WhatsAppNotificationListenerService.openWhatsAppPrivateConversation(getContext(), memberName);
        }

        // Never launch WhatsApp Business or generic WhatsApp home screen as a substitute.
        ret.put("success", opened);
        ret.put("method", opened ? "exact_private_destination_opened" : "exact_private_destination_unavailable");
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

            boolean submitted = OrderiAccessibilityService.queueGroupBroadcast(getContext(), groups, message);
            getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                    .edit()
                    .putString("status", submitted ? "submitted" : "failed")
                    .putString("status_label", submitted
                            ? "تم تمرير إجراء الرد إلى واتساب؛ لم يتم التحقق من التسليم أو القراءة"
                            : "لم يتم إرسال أي رسالة؛ لا يوجد إجراء رد صالح وحديث للقروبات المحددة")
                    .putLong("updated_at", System.currentTimeMillis())
                    .apply();

            JSObject ret = new JSObject();
            ret.put("success", submitted);
            ret.put("submitted", submitted);
            ret.put("deliveryConfirmed", false);
            ret.put("method", submitted ? "group_notification_remote_input_submitted" : "no_exact_group_reply_action");
            ret.put("groupCount", groups.size());
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("submitted", false);
            ret.put("deliveryConfirmed", false);
            ret.put("method", "group_broadcast_failed");
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
        ret.put("method", sent ? "group_notification_remote_input_submitted" : "no_recent_exact_group_reply_action");
        ret.put("submitted", sent);
        ret.put("deliveryConfirmed", false);
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
        ret.put("method", sent ? "private_notification_remote_input_submitted" : "no_exact_private_reply_action");
        ret.put("submitted", sent);
        ret.put("deliveryConfirmed", false);
        if (sent) {
            getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                .edit()
                .putString("status", "submitted")
                .putString("status_label", "تم تمرير إجراء الرد من إشعار المحادثة الخاصة؛ لم يتم التحقق من التسليم")
                .putLong("updated_at", System.currentTimeMillis())
                .apply();
        }
        call.resolve(ret);
    }

    private static String normalizeBahrainPhoneNumber(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("00973") && digits.length() == 13) {
            digits = digits.substring(2);
        }
        if (digits.length() == 8) {
            digits = "973" + digits;
        }
        return digits;
    }

    private static boolean isGenericPlaceholderMemberName(String raw) {
        if (android.text.TextUtils.isEmpty(raw)) return true;
        String clean = raw.replaceAll("[\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]", "")
                .replaceAll("\\s+", " ").trim().toLowerCase(java.util.Locale.ROOT);
        return clean.isEmpty()
                || clean.equals("صاحب الإعلان")
                || clean.equals("صاحب الاعلان")
                || clean.equals("واتساب")
                || clean.equals("whatsapp")
                || clean.equals("whatsapp messenger")
                || clean.equals("معلن بالقروب")
                || clean.equals("معلن في القروب")
                || clean.equals("معلن بالقروب المؤرشف")
                || clean.equals("مجهول");
    }

    private void saveOutreachState(String status, String statusLabel) {
        getContext().getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                .edit()
                .putString("status", status)
                .putString("status_label", statusLabel)
                .putLong("updated_at", System.currentTimeMillis())
                .apply();
    }

    @PluginMethod
    public void checkPrivateOutreachCapability(PluginCall call) {
        String phone = normalizeBahrainPhoneNumber(call.getString("phone", ""));
        String memberName = call.getString("memberName", "").trim();
        String senderIdentityKey = call.getString("senderIdentityKey", "").trim();
        String senderUri = call.getString("senderUri", "").trim();
        String validPhone = (phone.length() >= 8 && phone.length() <= 15) ? phone : "";
        String validMember = isGenericPlaceholderMemberName(memberName) ? "" : memberName;

        boolean regularInstalled = com.orderi.whatsapp.WhatsAppPermissionManager.isRegularWhatsAppInstalled(getContext());
        boolean listenerEnabled = WhatsAppNotificationListenerService.isEnabled(getContext());
        boolean accessibilityEnabled = OrderiAccessibilityService.isAccessibilityEnabled(getContext());
        boolean hasPrivateReply = regularInstalled && listenerEnabled
                && WhatsAppNotificationListenerService.hasPrivateNotificationReplyAction(
                        getContext(), validPhone, validMember, senderIdentityKey, senderUri);
        boolean hasPrivateChatIntent = regularInstalled && listenerEnabled
                && WhatsAppNotificationListenerService.hasPrivateNotificationChatIntent(
                        getContext(), validPhone, validMember, senderIdentityKey, senderUri);
        boolean privateChatResolved = regularInstalled && (!validPhone.isEmpty() || hasPrivateReply || hasPrivateChatIntent);

        String reasonCode = "ok";
        if (!regularInstalled) reasonCode = "regular_whatsapp_not_installed";
        else if (!listenerEnabled) reasonCode = "notification_listener_disabled";
        else if (!hasPrivateReply) reasonCode = "remote_input_unavailable";

        JSObject ret = new JSObject();
        ret.put("regularWhatsAppInstalled", regularInstalled);
        ret.put("notificationListenerEnabled", listenerEnabled);
        ret.put("accessibilityEnabled", accessibilityEnabled);
        ret.put("hasPrivateNotificationReplyAction", hasPrivateReply);
        ret.put("privateChatResolved", privateChatResolved);
        ret.put("backgroundSendAvailable", hasPrivateReply);
        ret.put("packageName", "com.whatsapp");
        ret.put("reasonCode", reasonCode);
        call.resolve(ret);
    }

    /**
     * Private advertiser outreach via regular WhatsApp Messenger (com.whatsapp) ONLY.
     * When backgroundOnly=true and allowUiFallback=false, NEVER launches WhatsApp UI or wa.me links.
     */
    @PluginMethod
    public void reachAdvertiserPrivateChat(PluginCall call) {
        try {
            String rawPhone = call.getString("phone", "");
            String memberName = call.getString("memberName", "").trim();
            String senderIdentityKey = call.getString("senderIdentityKey", "").trim();
            String senderUri = call.getString("senderUri", "").trim();
            String groupName = call.getString("groupName", "").trim();
            String sourceMessageText = call.getString("sourceMessageText", "");
            String message = call.getString("message", "");
            boolean autoSend = call.getBoolean("autoSend", true);
            boolean backgroundOnly = call.getBoolean("backgroundOnly", true);
            boolean allowUiFallback = call.getBoolean("allowUiFallback", false);

            if (android.text.TextUtils.isEmpty(message)) {
                call.reject("Message is empty");
                return;
            }

            if (!com.orderi.whatsapp.WhatsAppPermissionManager.isRegularWhatsAppInstalled(getContext())) {
                String msg = "تطبيق واتساب العادي (WhatsApp Messenger) غير مثبت؛ يلزم لإرسال رسالة القبول بالخلفية من رقمك الشخصي";
                saveOutreachState("BACKGROUND_SEND_UNAVAILABLE", msg);
                JSObject unavailable = new JSObject();
                unavailable.put("success", false);
                unavailable.put("submitted", false);
                unavailable.put("deliveryConfirmed", false);
                unavailable.put("status", "BACKGROUND_SEND_UNAVAILABLE");
                unavailable.put("reasonCode", "regular_whatsapp_not_installed");
                unavailable.put("packageName", "com.whatsapp");
                unavailable.put("method", "regular_whatsapp_not_installed");
                unavailable.put("statusLabel", msg);
                call.resolve(unavailable);
                return;
            }

            String normalizedPhone = normalizeBahrainPhoneNumber(rawPhone);
            String cleanPhone = (normalizedPhone.length() >= 8 && normalizedPhone.length() <= 15) ? normalizedPhone : "";
            String validMemberName = isGenericPlaceholderMemberName(memberName) ? "" : memberName;

            if (android.text.TextUtils.isEmpty(cleanPhone)
                    && android.text.TextUtils.isEmpty(validMemberName)
                    && android.text.TextUtils.isEmpty(senderIdentityKey)
                    && android.text.TextUtils.isEmpty(senderUri)) {
                String msg = "تعذر تحديد هوية المعلن من الإعلان أو الإشعار؛ يلزم التحقق قبل التواصل";
                saveOutreachState("IDENTITY_NOT_VERIFIED", msg);
                JSObject unverified = new JSObject();
                unverified.put("success", false);
                unverified.put("submitted", false);
                unverified.put("deliveryConfirmed", false);
                unverified.put("status", "IDENTITY_NOT_VERIFIED");
                unverified.put("reasonCode", "missing_advertiser_identity");
                unverified.put("packageName", "com.whatsapp");
                unverified.put("method", "missing_advertiser_identity");
                unverified.put("statusLabel", msg);
                call.resolve(unverified);
                return;
            }

            // 1. Primary path: Silent background send via com.whatsapp private notification RemoteInput
            if (autoSend) {
                boolean remoteInputSubmitted = WhatsAppNotificationListenerService.sendPrivateNotificationReply(
                        getContext(), cleanPhone, validMemberName, senderIdentityKey, senderUri, message);
                if (remoteInputSubmitted) {
                    String okLabel = "تم تمرير رسالة القبول عبر إشعار واتساب الخاص في الخلفية؛ التسليم بانتظار تأكيد واتساب";
                    saveOutreachState("MESSAGE_SUBMITTED", okLabel);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("submitted", true);
                    ret.put("deliveryConfirmed", false);
                    ret.put("status", "MESSAGE_SUBMITTED");
                    ret.put("packageName", "com.whatsapp");
                    ret.put("method", "notification_remote_input");
                    ret.put("statusLabel", okLabel);
                    call.resolve(ret);
                    return;
                }
            }

            // 2. Strict background-only guard: never launch WhatsApp UI automatically when RemoteInput is absent.
            if (backgroundOnly || !allowUiFallback) {
                boolean accessibilityEnabled = OrderiAccessibilityService.isAccessibilityEnabled(getContext());
                String unavailableLabel = !android.text.TextUtils.isEmpty(cleanPhone)
                        ? "تعذر الإرسال الصامت بالخلفية: لم يوفر واتساب إشعار رد خاص مباشر للمعلن"
                        : "تعذر الإرسال الصامت بالخلفية: لا يتيح WhatsApp Messenger تنفيذ «الرد بشكل خاص» من القروب أو فتح محادثة جديدة بالخلفية بدون إشعار خاص سابق";
                saveOutreachState("BACKGROUND_SEND_UNAVAILABLE", unavailableLabel);
                JSObject unavailable = new JSObject();
                unavailable.put("success", false);
                unavailable.put("submitted", false);
                unavailable.put("deliveryConfirmed", false);
                unavailable.put("status", "BACKGROUND_SEND_UNAVAILABLE");
                unavailable.put("reasonCode", "remote_input_unavailable");
                unavailable.put("accessibilityRequired", !accessibilityEnabled);
                unavailable.put("packageName", "com.whatsapp");
                unavailable.put("method", "background_remote_input_unavailable");
                unavailable.put("statusLabel", unavailableLabel);
                call.resolve(unavailable);
                return;
            }

            // 3. Explicit user-authorized UI fallback ONLY (allowUiFallback == true)
            if (!android.text.TextUtils.isEmpty(cleanPhone)) {
                if (autoSend && !OrderiAccessibilityService.isAccessibilityEnabled(getContext())) {
                    String msg = "فعّل خدمة وصول Orderi حتى يتمكن من إدخال رسالة القبول وإرسالها في محادثة المعلن الخاصة";
                    saveOutreachState("BACKGROUND_SEND_UNAVAILABLE", msg);
                    JSObject required = new JSObject();
                    required.put("success", false);
                    required.put("submitted", false);
                    required.put("deliveryConfirmed", false);
                    required.put("status", "BACKGROUND_SEND_UNAVAILABLE");
                    required.put("reasonCode", "accessibility_required");
                    required.put("accessibilityRequired", true);
                    required.put("packageName", "com.whatsapp");
                    required.put("method", "accessibility_required");
                    required.put("statusLabel", msg);
                    call.resolve(required);
                    return;
                }
                try {
                    String expectedTarget = !android.text.TextUtils.isEmpty(validMemberName) ? validMemberName : cleanPhone;
                    if (autoSend) OrderiAccessibilityService.queueMessageToSend(expectedTarget, message, true);
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(android.net.Uri.parse("https://api.whatsapp.com/send?phone=" + cleanPhone + "&text=" + android.net.Uri.encode(message)));
                    intent.setPackage("com.whatsapp");
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                    String statusOut = autoSend ? "MESSAGE_SUBMITTED" : "PRIVATE_CHAT_RESOLVED";
                    String label = autoSend
                            ? "تم فتح محادثة المعلن الخاصة في واتساب لتنفيذ الإرسال الآلي؛ بانتظار تأكيد الإرسال"
                            : "تم فتح مسودة محادثة المعلن الخاصة في واتساب للمراجعة اليدوية 💬";
                    saveOutreachState(statusOut, label);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("submitted", autoSend);
                    ret.put("deliveryConfirmed", false);
                    ret.put("status", statusOut);
                    ret.put("packageName", "com.whatsapp");
                    ret.put("method", autoSend ? "exact_private_chat_queued_for_accessibility_send" : "exact_private_chat_opened");
                    ret.put("statusLabel", label);
                    call.resolve(ret);
                    return;
                } catch (Exception launchError) {
                    Log.e("NotificationListenerPlugin", "Unable to open regular WhatsApp private chat for phone outreach", launchError);
                }
            }

            // 4. Explicit user-authorized Accessibility Group->ReplyPrivately fallback without phone number
            if (!android.text.TextUtils.isEmpty(validMemberName)) {
                if (isGenericPlaceholderMemberName(groupName)) {
                    String msg = "اسم مجموعة الإعلان غير محدد؛ لم نفتح بحث واتساب عام ولم نرسل أي رسالة";
                    saveOutreachState("IDENTITY_NOT_VERIFIED", msg);
                    JSObject failed = new JSObject();
                    failed.put("success", false);
                    failed.put("submitted", false);
                    failed.put("deliveryConfirmed", false);
                    failed.put("status", "IDENTITY_NOT_VERIFIED");
                    failed.put("reasonCode", "missing_exact_group_name");
                    failed.put("packageName", "com.whatsapp");
                    failed.put("method", "missing_exact_group_name");
                    failed.put("statusLabel", msg);
                    call.resolve(failed);
                    return;
                }

                if (!OrderiAccessibilityService.isAccessibilityEnabled(getContext())) {
                    String msg = "تتطلب المراسلة عبر الرد الخاص داخل القروب تفعيل خدمة وصول Orderi";
                    saveOutreachState("BACKGROUND_SEND_UNAVAILABLE", msg);
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("submitted", false);
                    ret.put("deliveryConfirmed", false);
                    ret.put("status", "BACKGROUND_SEND_UNAVAILABLE");
                    ret.put("reasonCode", "accessibility_required");
                    ret.put("accessibilityRequired", true);
                    ret.put("packageName", "com.whatsapp");
                    ret.put("method", "accessibility_required");
                    ret.put("statusLabel", msg);
                    call.resolve(ret);
                    return;
                }

                OrderiAccessibilityService.queueOutreachToMember(validMemberName, groupName, sourceMessageText, message, autoSend);
                boolean opened = WhatsAppNotificationListenerService.openWhatsAppGroupConversation(getContext(), groupName);
                if (!opened) {
                    opened = OrderiAccessibilityService.launchWhatsAppForOutreach(getContext());
                }

                if (!opened) {
                    String msg = "تعذر فتح واتساب العادي للوصول إلى قروب الإعلان؛ لم يتم إرسال أي رسالة";
                    saveOutreachState("SEND_FAILED", msg);
                    JSObject failed = new JSObject();
                    failed.put("success", false);
                    failed.put("submitted", false);
                    failed.put("deliveryConfirmed", false);
                    failed.put("status", "SEND_FAILED");
                    failed.put("reasonCode", "whatsapp_launch_failed");
                    failed.put("packageName", "com.whatsapp");
                    failed.put("method", "whatsapp_launch_failed");
                    failed.put("statusLabel", msg);
                    call.resolve(failed);
                    return;
                }

                String label = "جاري فتح القروب واستخدام «الرد بشكل خاص» لمراسلة المعلن «" + validMemberName + "»";
                saveOutreachState("sending", label);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("submitted", true);
                ret.put("deliveryConfirmed", false);
                ret.put("status", "MESSAGE_SUBMITTED");
                ret.put("packageName", "com.whatsapp");
                ret.put("method", "accessibility_reply_privately");
                ret.put("statusLabel", label);
                call.resolve(ret);
                return;
            }

            String failMsg = "لم تُرسل الرسالة: تعذر التحقق من وجهة المعلن الخاصة في واتساب";
            saveOutreachState("SEND_FAILED", failMsg);
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("submitted", false);
            ret.put("deliveryConfirmed", false);
            ret.put("status", "SEND_FAILED");
            ret.put("reasonCode", "private_outreach_unavailable");
            ret.put("packageName", "com.whatsapp");
            ret.put("method", "no_exact_private_reply_action");
            ret.put("statusLabel", failMsg);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("submitted", false);
            ret.put("deliveryConfirmed", false);
            ret.put("status", "SEND_FAILED");
            ret.put("reasonCode", "private_outreach_exception");
            ret.put("packageName", "com.whatsapp");
            ret.put("method", "private_outreach_failed");
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
    public void getReadAllStatus(PluginCall call) {
        android.content.SharedPreferences prefs = getContext().getSharedPreferences(
                "orderi_read_all_status", android.content.Context.MODE_PRIVATE);
        JSObject ret = new JSObject();
        ret.put("status", prefs.getString("status", "not_started"));
        ret.put("visited", prefs.getInt("visited", 0));
        ret.put("detail", prefs.getString("detail", ""));
        ret.put("updatedAt", prefs.getLong("updated_at", 0L));
        call.resolve(ret);
    }

    @PluginMethod
    public void hasUnreadNotifications(PluginCall call) {
        try {
            int count = WhatsAppNotificationListenerService.getUnreadWhatsAppNotificationCount();
            JSObject ret = new JSObject();
            ret.put("hasUnread", count > 0);
            ret.put("unreadCount", count);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("hasUnread", false);
            ret.put("unreadCount", 0);
            call.resolve(ret);
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
                        String group = groups.getString(i);
                        if (group != null && !group.trim().isEmpty()) targetGroups.add(group.trim());
                    } catch (Exception ignored) {}
                }
            }

            boolean includeArchived = call.getBoolean("includeArchived", false);
            // Empty targets are intentional here: the user pressed Read All, so
            // include every group notification Android positively identifies.
            int count = WhatsAppNotificationListenerService.markAllWhatsAppAsRead(
                    getContext(), targetGroups.isEmpty() ? null : targetGroups);

            boolean archivedStarted = false;
            boolean accessibilityRequired = false;
            boolean whatsAppOpened = false;
            if (includeArchived) {
                accessibilityRequired = !OrderiAccessibilityService.isAccessibilityEnabled(getContext())
                        || !OrderiAccessibilityService.isServiceRunning();
                if (!accessibilityRequired) {
                    archivedStarted = OrderiAccessibilityService.requestMarkArchivedChatsRead(getContext());
                    whatsAppOpened = archivedStarted;
                    if (!archivedStarted) accessibilityRequired = true;
                }
            }

            JSObject ret = new JSObject();
            ret.put("success", count > 0 || archivedStarted);
            ret.put("markedCount", count);
            ret.put("method", archivedStarted ? "all_group_notifications_and_archived_sweep_started"
                    : (count > 0 ? "all_group_notifications_marked_read" : "no_matching_group_read_actions"));
            ret.put("archivedAutomationStarted", archivedStarted);
            ret.put("accessibilityRequired", accessibilityRequired);
            ret.put("whatsAppOpened", whatsAppOpened);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to mark all WhatsApp groups as read", e);
        }
    }
}
