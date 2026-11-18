package com.orderi.radar;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
public class RadarBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) return;
        // A previous activation flag may be stale after a license expires while the phone is off.
        // Require Orderi to revalidate the official subscription before restarting monitoring.
        context.getSharedPreferences(BackgroundRadarService.PREFS, Context.MODE_PRIVATE)
                .edit().putBoolean(BackgroundRadarService.KEY_LICENSED, false)
                .putBoolean(BackgroundRadarService.KEY_ENABLED, false).apply();
        context.stopService(new Intent(context, BackgroundRadarService.class));
    }
}
