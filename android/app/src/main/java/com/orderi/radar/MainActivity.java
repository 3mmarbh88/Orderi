package com.orderi.radar;

import android.Manifest;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        super();
        registerPlugin(NotificationListenerPlugin.class);
        registerPlugin(OrderiLocalAIPlugin.class);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Re-enable the radar whenever the user opens Orderi. The native listener
        // checks this persisted flag so it can stop processing after task dismissal.
        getSharedPreferences(BackgroundRadarService.PREFS, MODE_PRIVATE)
                .edit().putBoolean(BackgroundRadarService.KEY_ENABLED, true).apply();
        // The user explicitly requested not to show the persistent "الرادار يعمل حتى إزالة التطبيق" notification.
        // WhatsAppNotificationListenerService runs independently via Android's NotificationListenerService.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 9001);
        }
        NotificationListenerPlugin.handleOrderIntent(getIntent());
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        NotificationListenerPlugin.handleOrderIntent(intent);
    }
}
