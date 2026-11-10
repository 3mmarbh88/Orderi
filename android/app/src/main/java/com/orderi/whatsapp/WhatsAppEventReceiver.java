package com.orderi.whatsapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

public class WhatsAppEventReceiver extends BroadcastReceiver {

    public interface OnWhatsAppEventListener {
        void onEvent(JSONObject event);
    }

    private static OnWhatsAppEventListener eventListener;

    public static void setEventListener(OnWhatsAppEventListener listener) {
        eventListener = listener;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String rawJson = intent.getStringExtra("event");
        if (rawJson != null && eventListener != null) {
            try {
                JSONObject json = new JSONObject(rawJson);
                eventListener.onEvent(json);
            } catch (Exception ignored) {}
        }
    }
}
