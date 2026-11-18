package com.orderi.radar;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "OrderiLicense")
public class OrderiLicensePlugin extends Plugin {
    @PluginMethod
    public void setLicenseState(PluginCall call) {
        boolean active = call.getBoolean("active", false);
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(BackgroundRadarService.PREFS, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(BackgroundRadarService.KEY_LICENSED, active)
                .putBoolean(BackgroundRadarService.KEY_ENABLED, active).apply();
        Intent service = new Intent(context, BackgroundRadarService.class);
        if (active) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(service);
            else context.startService(service);
        } else context.stopService(service);
        JSObject result = new JSObject();
        result.put("active", active);
        call.resolve(result);
    }
}
