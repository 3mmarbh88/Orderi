package com.orderi.whatsapp;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.TextUtils;

public class WhatsAppPermissionManager {

    private static final String PACKAGE_WHATSAPP = "com.whatsapp";
    private static final String PACKAGE_WHATSAPP_BUSINESS = "com.whatsapp.w4b";

    public static boolean isWhatsAppInstalled(Context context) {
        if (context == null) return false;
        PackageManager pm = context.getPackageManager();
        try {
            pm.getPackageInfo(PACKAGE_WHATSAPP, 0);
            return true;
        } catch (Exception e1) {
            try {
                pm.getPackageInfo(PACKAGE_WHATSAPP_BUSINESS, 0);
                return true;
            } catch (Exception e2) {
                return false;
            }
        }
    }

    public static boolean isRegularWhatsAppInstalled(Context context) {
        if (context == null) return false;
        PackageManager pm = context.getPackageManager();
        try {
            pm.getPackageInfo(PACKAGE_WHATSAPP, 0);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isNotificationAccessGranted(Context context) {
        if (context == null) return false;
        String packageName = context.getPackageName();
        String flat = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        if (!TextUtils.isEmpty(flat)) {
            String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && TextUtils.equals(packageName, cn.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }

    public static boolean isBatteryOptimizationIgnored(Context context) {
        if (context == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                return pm.isIgnoringBatteryOptimizations(context.getPackageName());
            }
        }
        return true;
    }

    public static boolean openNotificationSettings(Context context) {
        if (context == null) return false;
        Intent[] candidateIntents = new Intent[] {
            new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS),
            new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"),
            new Intent().setComponent(new ComponentName("com.android.settings", "com.android.settings.Settings$NotificationAccessSettingsActivity")),
            new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).setData(Uri.fromParts("package", context.getPackageName(), null)),
            new Intent(Settings.ACTION_SETTINGS)
        };

        for (Intent intent : candidateIntents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return true;
            } catch (Exception ignored) {}
        }
        return false;
    }

    public static boolean openAccessibilitySettings(Context context) {
        if (context == null) return false;
        Intent[] candidateIntents = new Intent[] {
            new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
            new Intent("android.settings.ACCESSIBILITY_SETTINGS"),
            new Intent().setComponent(new ComponentName("com.android.settings", "com.android.settings.AccessibilitySettings")),
            new Intent(Settings.ACTION_SETTINGS)
        };

        for (Intent intent : candidateIntents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return true;
            } catch (Exception ignored) {}
        }
        return false;
    }
}
