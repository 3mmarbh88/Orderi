package com.orderi.radar;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.net.Uri;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        super();
        registerPlugin(NotificationListenerPlugin.class);
        registerPlugin(OrderiBiometricPlugin.class);
        registerPlugin(OrderiLocalAIPlugin.class);
        registerPlugin(com.orderi.whatsapp.WhatsAppClientBridge.class);
    }
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getSharedPreferences(BackgroundRadarService.PREFS, MODE_PRIVATE)
                .edit().putBoolean(BackgroundRadarService.KEY_ENABLED, true).apply();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 9001);
        }
        if (!WhatsAppNotificationListenerService.isEnabled(this)) {
            try {
                Intent nIntent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                nIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(nIntent);
            } catch (Exception ignored) {}
        }
        startRadarService();
        requestBatteryOptimizationExemptionIfNeeded();
        NotificationListenerPlugin.handleOrderIntent(getIntent());
    }
    private void startRadarService() {
        Intent service = new Intent(this, BackgroundRadarService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(service);
        else startService(service);
    }
    private void requestBatteryOptimizationExemptionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        android.os.PowerManager pm = (android.os.PowerManager) getSystemService(POWER_SERVICE);
        if (pm == null || pm.isIgnoringBatteryOptimizations(getPackageName())) return;
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getPackageName())));
        } catch (Exception ignored) {
            try { startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)); }
            catch (Exception ignoredAgain) {}
        }
    }
    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        NotificationListenerPlugin.handleOrderIntent(intent);
    }
}