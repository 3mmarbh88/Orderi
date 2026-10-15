package com.orderi.radar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

/** Captures swiped-away native order notifications, including while Orderi is closed. */
public class OrderiNotificationDismissReceiver extends BroadcastReceiver {
    public static final String ACTION_DISMISS = "com.orderi.radar.DISMISS_ORDER_NOTIFICATION";
    public static final String PREFS = "orderi_native_dismissals";
    public static final String KEY_PENDING = "pending";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_DISMISS.equals(intent.getAction())) return;
        String orderId = intent.getStringExtra("order_id");
        if (orderId == null || orderId.trim().isEmpty()) return;

        JSONObject event = new JSONObject();
        try {
            event.put("orderId", orderId);
            event.put("from", intent.getStringExtra("from_area"));
            event.put("to", intent.getStringExtra("to_area"));
            event.put("rawText", intent.getStringExtra("raw_text"));
            event.put("senderName", intent.getStringExtra("sender_name"));
            event.put("dismissedAt", System.currentTimeMillis());
        } catch (Exception ignored) { return; }

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray oldEvents;
        try { oldEvents = new JSONArray(prefs.getString(KEY_PENDING, "[]")); }
        catch (Exception ignored) { oldEvents = new JSONArray(); }
        JSONArray next = new JSONArray();
        for (int i = Math.max(0, oldEvents.length() - 49); i < oldEvents.length(); i++) {
            try { next.put(oldEvents.get(i)); } catch (Exception ignored) {}
        }
        next.put(event);
        prefs.edit().putString(KEY_PENDING, next.toString()).apply();

        Intent broadcast = new Intent(ACTION_DISMISS);
        broadcast.setPackage(context.getPackageName());
        broadcast.putExtra("event", event.toString());
        context.sendBroadcast(broadcast);
    }
}
