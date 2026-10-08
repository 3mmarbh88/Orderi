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
    private BroadcastReceiver receiver;

    @Override
    public void load() {
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
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            try { getContext().unregisterReceiver(receiver); } catch (Exception ignored) {}
            receiver = null;
        }
        super.handleOnDestroy();
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
