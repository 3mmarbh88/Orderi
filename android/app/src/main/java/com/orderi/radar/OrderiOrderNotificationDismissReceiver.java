package com.orderi.radar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;

public class OrderiOrderNotificationDismissReceiver extends BroadcastReceiver {
    public static final String ACTION_DISMISSED = "com.orderi.radar.ORDER_NOTIFICATION_DISMISSED";
    public static final String PREFS = "orderi_dismissed_order_notifications";
    public static final String KEY_DISMISSED = "dismissed_ids";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_DISMISSED.equals(intent.getAction())) return;
        String orderId = intent.getStringExtra("order_id");
        if (orderId == null || orderId.trim().isEmpty()) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray saved;
        try { saved = new JSONArray(prefs.getString(KEY_DISMISSED, "[]")); }
        catch (Exception e) { saved = new JSONArray(); }
        boolean found = false;
        for (int i = 0; i < saved.length(); i++) if (orderId.equals(saved.optString(i))) found = true;
        if (!found) saved.put(orderId);
        prefs.edit().putString(KEY_DISMISSED, saved.toString()).apply();
        Intent event = new Intent(ACTION_DISMISSED);
        event.setPackage(context.getPackageName());
        event.putExtra("order_id", orderId);
        context.sendBroadcast(event);
    }
}
