package com.orderi.whatsapp;

import android.content.Context;

public class WhatsAppServiceMonitor {

    private static volatile boolean isServiceConnected = false;
    private static volatile long lastEventTimestamp = 0L;
    private static volatile long serviceConnectedAt = 0L;
    private static volatile int totalEventsIngested = 0;
    private static volatile String lastError = null;

    public static void setServiceConnected(boolean connected) {
        isServiceConnected = connected;
        if (connected) {
            serviceConnectedAt = System.currentTimeMillis();
            lastError = null;
        }
    }

    public static boolean isServiceConnected() {
        return isServiceConnected;
    }

    public static void recordEventReceived() {
        lastEventTimestamp = System.currentTimeMillis();
        totalEventsIngested++;
    }

    public static void recordError(String error) {
        lastError = error;
    }

    public static long getLastEventTimestamp() {
        return lastEventTimestamp;
    }

    public static int getTotalEventsIngested() {
        return totalEventsIngested;
    }

    public static String getLastError() {
        return lastError;
    }

    public static boolean isHealthy() {
        return isServiceConnected;
    }
}
