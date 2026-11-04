package com.orderi.radar;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

public class BackgroundRadarService extends Service {
    public static final String PREFS = "orderi_runtime";
    public static final String KEY_ENABLED = "background_radar_enabled";
    private static final String CHANNEL_ID = "orderi_background_radar";
    private static final int NOTIFICATION_ID = 74021;
    private static final String TAG = "OrderiBackgroundRadar";
    @Override public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildNotification());
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        boolean enabled = getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean(KEY_ENABLED, true);
        if (!enabled) {
            stopForeground(true);
            stopSelf(startId);
            return START_NOT_STICKY;
        }
        if (Build.VERSION.SDK_INT >= 29) {
            try {
                startForeground(NOTIFICATION_ID, buildNotification(),
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } catch (RuntimeException e) {
                Log.e(TAG, "Could not promote radar service to foreground", e);
                stopSelf(startId);
                return START_NOT_STICKY;
            }
        } else startForeground(NOTIFICATION_ID, buildNotification());
        return START_STICKY;
    }
    @Override public void onTaskRemoved(Intent rootIntent) {
        Log.i(TAG, "Task removed; stop radar until user opens Orderi again");
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, false).apply();
        stopForeground(true);
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    "Orderi background radar", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Orderi radar active while the app is in the background");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }
    private Notification buildNotification() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = null;
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
            pi = PendingIntent.getActivity(this, NOTIFICATION_ID, launch, flags);
        }
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.orderi_notification_icon)
                .setContentTitle("Orderi — الرادار يعمل")
                .setContentText("مراقبة الطلبات بالخلفية أثناء قفل الشاشة")
                .setOngoing(true).setCategory(Notification.CATEGORY_SERVICE)
                .setPriority(Notification.PRIORITY_LOW);
        if (pi != null) b.setContentIntent(pi);
        return b.build();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}