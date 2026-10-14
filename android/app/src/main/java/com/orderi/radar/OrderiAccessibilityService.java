package com.orderi.radar;

import android.accessibilityservice.AccessibilityService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Toast;

import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Accessibility helpers for WhatsApp. Read-all is opt-in and runs visibly in
 * WhatsApp's UI; it does not access WhatsApp's private database.
 */
public class OrderiAccessibilityService extends AccessibilityService {
    public static final String PACKAGE_WHATSAPP = "com.whatsapp";
    private static OrderiAccessibilityService instance;
    private static String pendingMessageToSend;
    private static long pendingMessageTimestamp;
    private static final AtomicBoolean isSendingInProgress = new AtomicBoolean(false);

    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean markAllReadActive = false;
    private boolean waitingForChatToOpen = false;
    private int chatsOpened = 0;
    private int emptyScans = 0;
    private int scanCount = 0;

    private final Runnable scanRunnable = this::scanUnreadChats;
    private final Runnable returnFromChatRunnable = () -> {
        if (!markAllReadActive) return;
        performGlobalAction(GLOBAL_ACTION_BACK);
        waitingForChatToOpen = false;
        handler.postDelayed(scanRunnable, 1100L);
    };

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onDestroy() {
        cancelMarkAllRead();
        instance = null;
        super.onDestroy();
    }

    public static boolean isServiceRunning() { return instance != null; }

    public static boolean startMarkAllRead(Context context) {
        OrderiAccessibilityService service = instance;
        if (service == null) return false;
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(PACKAGE_WHATSAPP);
        if (launch == null) return false;
        service.handler.post(() -> {
            service.cancelMarkAllRead();
            service.markAllReadActive = true;
            service.waitingForChatToOpen = false;
            service.chatsOpened = 0;
            service.emptyScans = 0;
            service.scanCount = 0;
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try {
                context.startActivity(launch);
                Toast.makeText(context, "Orderi: بدء قراءة المحادثات غير المقروءة", Toast.LENGTH_SHORT).show();
                service.handler.postDelayed(service.scanRunnable, 1600L);
            } catch (Exception e) {
                service.cancelMarkAllRead();
            }
        });
        return true;
    }

    public static boolean isAccessibilityEnabled(Context context) {
        try {
            int enabled = Settings.Secure.getInt(context.getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED, 0);
            if (enabled != 1) return false;
            String services = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (services == null) return false;
            String expected = new ComponentName(context, OrderiAccessibilityService.class).flattenToString();
            for (String service : services.split(":")) if (service.equalsIgnoreCase(expected)) return true;
        } catch (Exception ignored) {}
        return false;
    }

    public static void queueMessageToSend(String message) {
        pendingMessageToSend = message;
        pendingMessageTimestamp = System.currentTimeMillis();
        isSendingInProgress.set(true);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        CharSequence packageName = event.getPackageName();
        if (packageName == null || !PACKAGE_WHATSAPP.contentEquals(packageName)) return;

        if (markAllReadActive) {
            if (!waitingForChatToOpen) handler.removeCallbacks(scanRunnable);
            handler.postDelayed(scanRunnable, 350L);
            return;
        }

        if (!isSendingInProgress.get() || pendingMessageToSend == null) return;
        if (System.currentTimeMillis() - pendingMessageTimestamp > 20000L) {
            pendingMessageToSend = null;
            isSendingInProgress.set(false);
            return;
        }

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;
        try {
            AccessibilityNodeInfo input = findInputField(root);
            if (input != null) {
                Bundle args = new Bundle();
                args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pendingMessageToSend);
                input.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
                AccessibilityNodeInfo send = findSendButton(root);
                if (send != null && send.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    pendingMessageToSend = null;
                    isSendingInProgress.set(false);
                    performGlobalAction(GLOBAL_ACTION_BACK);
                }
            }
        } catch (Exception ignored) {
        } finally {
            root.recycle();
        }
    }

    private void scanUnreadChats() {
        if (!markAllReadActive || waitingForChatToOpen) return;
        scanCount++;
        if (scanCount > 120) { finishMarkAllRead("توقفت العملية للحماية من التكرار"); return; }
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            if (emptyScans++ > 3) finishMarkAllRead("تعذر قراءة واجهة واتساب");
            else handler.postDelayed(scanRunnable, 900L);
            return;
        }
        try {
            AccessibilityNodeInfo unread = findUnreadMarker(root);
            if (unread != null) {
                AccessibilityNodeInfo row = unread;
                for (int i = 0; i < 6 && row.getParent() != null; i++) {
                    AccessibilityNodeInfo parent = row.getParent();
                    if (parent == null) break;
                    row = parent;
                    if (row.isClickable()) break;
                }
                boolean clicked = row.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                if (!clicked) clicked = unread.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                if (clicked) {
                    chatsOpened++;
                    emptyScans = 0;
                    waitingForChatToOpen = true;
                    handler.postDelayed(returnFromChatRunnable, 1800L);
                    return;
                }
            }
            emptyScans++;
            // Do not mistake WhatsApp's "Unread" filter chip for a chat marker.
            // If no actual unread-chat marker was exposed by Accessibility, report
            // that detection failed instead of claiming the inbox was cleared.
            if (emptyScans >= 2) {
                if (chatsOpened == 0) {
                    finishMarkAllRead("لم أتمكن من تحديد محادثات غير مقروءة من واجهة واتساب. لم يتم تأكيد قراءة أي محادثة.");
                } else {
                    finishMarkAllRead("تم فتح " + chatsOpened + " محادثة، لكن تعذر العثور على علامات إضافية. تحقق من واتساب للتأكد.");
                }
            } else {
                handler.postDelayed(scanRunnable, 1000L);
            }
        } catch (Exception e) {
            handler.postDelayed(scanRunnable, 1000L);
        } finally {
            root.recycle();
        }
    }

    private AccessibilityNodeInfo findUnreadMarker(AccessibilityNodeInfo node) {
        if (node == null) return null;
        CharSequence text = node.getText();
        CharSequence desc = node.getContentDescription();
        if (isUnreadLabel(text) || isUnreadLabel(desc)) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            AccessibilityNodeInfo found = findUnreadMarker(child);
            if (found != null) return found;
        }
        return null;
    }

    private boolean isUnreadLabel(CharSequence value) {
        if (value == null) return false;
        String s = value.toString().toLowerCase(Locale.ROOT);
        // Match message-specific indicators only. A bare "غير مقروءة" may
        // be the WhatsApp filter chip, not an unread badge on a conversation.
        return s.contains("unread message") || s.contains("unread messages")
            || s.contains("رسائل غير مقروءة") || s.contains("رسالة غير مقروءة")
            || s.contains("رسائل غير مقروءه") || s.contains("رسالة غير مقروءه")
            || s.contains("رسائل جديدة") || s.contains("رسالة جديدة")
            || s.matches(".*\\\\d+.*غير مقروء.*");
    }

    private void finishMarkAllRead(String message) {
        if (!markAllReadActive) return;
        markAllReadActive = false;
        waitingForChatToOpen = false;
        handler.removeCallbacks(scanRunnable);
        handler.removeCallbacks(returnFromChatRunnable);
        Toast.makeText(this, "Orderi: " + message, Toast.LENGTH_LONG).show();
        // WhatsApp was opened by this task; return to Orderi when possible.
        performGlobalAction(GLOBAL_ACTION_BACK);
    }

    private void cancelMarkAllRead() {
        markAllReadActive = false;
        waitingForChatToOpen = false;
        handler.removeCallbacks(scanRunnable);
        handler.removeCallbacks(returnFromChatRunnable);
    }

    private AccessibilityNodeInfo findInputField(AccessibilityNodeInfo node) {
        if (node == null) return null;
        List<AccessibilityNodeInfo> list = node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/entry");
        if (list != null && !list.isEmpty()) return list.get(0);
        if ("android.widget.EditText".contentEquals(node.getClassName())) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo result = findInputField(node.getChild(i));
            if (result != null) return result;
        }
        return null;
    }

    private AccessibilityNodeInfo findSendButton(AccessibilityNodeInfo node) {
        if (node == null) return null;
        List<AccessibilityNodeInfo> list = node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/send");
        if (list != null && !list.isEmpty()) return list.get(0);
        CharSequence desc = node.getContentDescription();
        if (desc != null) {
            String text = desc.toString().toLowerCase(Locale.ROOT);
            if (text.contains("send") || text.contains("إرسال") || text.contains("ارسال")) return node;
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo result = findSendButton(node.getChild(i));
            if (result != null) return result;
        }
        return null;
    }

    @Override
    public void onInterrupt() {
        pendingMessageToSend = null;
        isSendingInProgress.set(false);
        cancelMarkAllRead();
    }
}