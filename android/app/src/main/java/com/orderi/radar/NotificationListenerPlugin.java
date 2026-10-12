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
        super.handleOnDestroy();
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

            // Case A: Confirmed phone number exists -> Open WhatsApp private chat directly via native intent
            if (!android.text.TextUtils.isEmpty(phone)) {
                String cleanPhone = phone.replaceAll("\\D", "");
                OrderiAccessibilityService.queueMessageToSend(message, autoSend);

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

            // Case B: No phone number in ad text, but advertiser name is known
            // User requirement: Click advertiser name -> show private chat option -> send acceptance message in private
            if (!android.text.TextUtils.isEmpty(memberName)) {
                OrderiAccessibilityService.queueOutreachToMember(memberName, message, autoSend);

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
            android.content.SharedPreferences.Editor editor = getContext()
                    .getSharedPreferences("orderi_filter_settings", Context.MODE_PRIVATE).edit();
            editor.putBoolean("ignore_non_matching", ignoreNonMatching);
            editor.putFloat("min_price", (float) minPrice);
            editor.putFloat("coverage_km", (float) coverageKm);
            editor.putFloat("driver_lat", (float) driverLat);
            editor.putFloat("driver_lon", (float) driverLon);
            editor.apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not update native filter settings", e);
        }
    }
}
