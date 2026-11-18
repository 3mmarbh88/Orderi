package com.orderi.radar;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
public class RadarBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) return;
        android.content.SharedPreferences prefs = context.getSharedPreferences(BackgroundRadarService.PREFS, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(BackgroundRadarService.KEY_ENABLED, false)
                && prefs.getBoolean(BackgroundRadarService.KEY_LICENSED, false);
        if (!enabled) return;
        Intent service = new Intent(context, BackgroundRadarService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(service);
        else context.startService(service);
    }
}