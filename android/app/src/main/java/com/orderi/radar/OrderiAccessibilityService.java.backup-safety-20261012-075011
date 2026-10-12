package com.orderi.radar;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Orderi Accessibility Service for WhatsApp Automation.
 * Allows Orderi to automatically send acceptance messages to the target WhatsApp group
 * in the background or semi-background without user manual tapping.
 */
public class OrderiAccessibilityService extends AccessibilityService {
    public static final String PACKAGE_WHATSAPP = "com.whatsapp";
    private static OrderiAccessibilityService instance = null;
    private static String pendingMessageToSend = null;
    private static long pendingMessageTimestamp = 0L;
    private static final AtomicBoolean isSendingInProgress = new AtomicBoolean(false);

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    public static boolean isServiceRunning() {
        return instance != null;
    }

    public static void queueMessageToSend(String message) {
        pendingMessageToSend = message;
        pendingMessageTimestamp = System.currentTimeMillis();
        isSendingInProgress.set(true);
    }

    public static boolean isAccessibilityEnabled(Context context) {
        try {
            int accessibilityEnabled = Settings.Secure.getInt(
                    context.getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED, 0);
            if (accessibilityEnabled != 1) return false;

            String services = Settings.Secure.getString(
                    context.getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (services == null) return false;

            ComponentName expected = new ComponentName(context, OrderiAccessibilityService.class);
            String colonSplit = expected.flattenToString();
            for (String s : services.split(":")) {
                if (s.equalsIgnoreCase(colonSplit)) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || !isSendingInProgress.get()) return;
        if (pendingMessageToSend == null) return;

        // Expire pending message after 20 seconds
        if (System.currentTimeMillis() - pendingMessageTimestamp > 20000L) {
            pendingMessageToSend = null;
            isSendingInProgress.set(false);
            return;
        }

        CharSequence pkg = event.getPackageName();
        if (pkg == null || !PACKAGE_WHATSAPP.contentEquals(pkg)) return;

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        try {
            // Find input field in WhatsApp
            AccessibilityNodeInfo inputField = findInputField(rootNode);
            if (inputField != null) {
                Bundle arguments = new Bundle();
                arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pendingMessageToSend);
                inputField.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);

                // Small delay or directly find and click send button
                AccessibilityNodeInfo sendButton = findSendButton(rootNode);
                if (sendButton != null) {
                    sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    pendingMessageToSend = null;
                    isSendingInProgress.set(false);

                    // Return to Orderi or close WhatsApp window after auto-send
                    performGlobalAction(GLOBAL_ACTION_BACK);
                }
            }
        } catch (Exception ignored) {
        } finally {
            rootNode.recycle();
        }
    }

    private AccessibilityNodeInfo findInputField(AccessibilityNodeInfo node) {
        if (node == null) return null;
        
        // Search by view ID first
        List<AccessibilityNodeInfo> list = node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/entry");
        if (list != null && !list.isEmpty()) {
            return list.get(0);
        }

        // Search by class name (EditText)
        if ("android.widget.EditText".contentEquals(node.getClassName())) {
            return node;
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            AccessibilityNodeInfo result = findInputField(child);
            if (result != null) return result;
        }
        return null;
    }

    private AccessibilityNodeInfo findSendButton(AccessibilityNodeInfo node) {
        if (node == null) return null;

        // Search by view ID
        List<AccessibilityNodeInfo> list = node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/send");
        if (list != null && !list.isEmpty()) {
            return list.get(0);
        }

        // Search by content description (English and Arabic)
        CharSequence desc = node.getContentDescription();
        if (desc != null) {
            String text = desc.toString().toLowerCase();
            if (text.contains("send") || text.contains("إرسال") || text.contains("ارسال")) {
                return node;
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            AccessibilityNodeInfo result = findSendButton(child);
            if (result != null) return result;
        }
        return null;
    }

    @Override
    public void onInterrupt() {
        pendingMessageToSend = null;
        isSendingInProgress.set(false);
    }
}
