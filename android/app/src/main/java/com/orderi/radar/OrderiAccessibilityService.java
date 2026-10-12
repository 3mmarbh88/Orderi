package com.orderi.radar;

import android.accessibilityservice.AccessibilityService;
import android.content.ComponentName;
import android.content.Context;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Orderi Accessibility Service for WhatsApp Automation.
 * Allows Orderi to automatically navigate to the advertiser's private chat
 * by clicking their name and selecting "Message" in WhatsApp, and sending or preparing
 * the acceptance message, strictly preventing any replies inside WhatsApp groups.
 */
public class OrderiAccessibilityService extends AccessibilityService {
    private static final String TAG = "OrderiAccessibility";
    public static final String PACKAGE_WHATSAPP = "com.whatsapp";
    private static OrderiAccessibilityService instance = null;

    private static final int STAGE_IDLE = 0;
    private static final int STAGE_CLICK_MEMBER_NAME = 1;
    private static final int STAGE_CLICK_MESSAGE_ACTION = 2;
    private static final int STAGE_ENTER_PRIVATE_MESSAGE = 3;

    private static volatile int currentStage = STAGE_IDLE;
    private static volatile String pendingMessageToSend = null;
    private static volatile String pendingTargetMemberName = null;
    private static volatile boolean pendingAutoSend = false;
    private static volatile long pendingMessageTimestamp = 0L;
    private static final AtomicBoolean isSendingInProgress = new AtomicBoolean(false);

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        Log.i(TAG, "Orderi Accessibility Service connected successfully");
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    public static boolean isServiceRunning() {
        return instance != null;
    }

    public static void queueMessageToSend(String message, boolean autoSend) {
        pendingMessageToSend = message;
        pendingTargetMemberName = null;
        pendingAutoSend = autoSend;
        pendingMessageTimestamp = System.currentTimeMillis();
        currentStage = STAGE_ENTER_PRIVATE_MESSAGE;
        isSendingInProgress.set(true);
        Log.i(TAG, "Queued direct private message to send. autoSend=" + autoSend);
    }

    public static void queueMessageToSend(String message) {
        queueMessageToSend(message, false);
    }

    public static void queueOutreachToMember(String memberName, String message, boolean autoSend) {
        pendingTargetMemberName = cleanMemberName(memberName);
        pendingMessageToSend = message;
        pendingAutoSend = autoSend;
        pendingMessageTimestamp = System.currentTimeMillis();
        currentStage = STAGE_CLICK_MEMBER_NAME;
        isSendingInProgress.set(true);
        Log.i(TAG, "Queued outreach to group member: " + pendingTargetMemberName + " autoSend=" + autoSend);
    }

    public static void queueOutreachToMember(String memberName, String message) {
        queueOutreachToMember(memberName, message, false);
    }

    private static String cleanMemberName(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.startsWith("~")) s = s.substring(1).trim();
        if (s.endsWith(":")) s = s.substring(0, s.length() - 1).trim();
        return s;
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

        // Expire pending operation after 30 seconds
        if (System.currentTimeMillis() - pendingMessageTimestamp > 30000L) {
            resetOperation();
            return;
        }

        CharSequence pkg = event.getPackageName();
        if (pkg == null || !PACKAGE_WHATSAPP.contentEquals(pkg)) return;

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        try {
            // STEP 1: Find and click member name in group chat
            if (currentStage == STAGE_CLICK_MEMBER_NAME) {
                // If the message popup is ALREADY visible (e.g. from previous click), skip to clicking message action
                AccessibilityNodeInfo messageAction = findPrivateMessageAction(rootNode);
                if (messageAction != null) {
                    messageAction.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    Log.i(TAG, "Clicked private Message action for member: " + pendingTargetMemberName);
                    currentStage = STAGE_ENTER_PRIVATE_MESSAGE;
                    return;
                }

                if (!TextUtils.isEmpty(pendingTargetMemberName)) {
                    AccessibilityNodeInfo memberNode = findMemberNameNode(rootNode, pendingTargetMemberName);
                    if (memberNode != null) {
                        memberNode.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        Log.i(TAG, "Clicked member name node: " + pendingTargetMemberName);
                        currentStage = STAGE_CLICK_MESSAGE_ACTION;
                        return;
                    }
                }
                return;
            }

            // STEP 2: When member popup appears, click "Message {name}" / "مراسلة"
            if (currentStage == STAGE_CLICK_MESSAGE_ACTION) {
                AccessibilityNodeInfo messageAction = findPrivateMessageAction(rootNode);
                if (messageAction != null) {
                    messageAction.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    Log.i(TAG, "Clicked private Message action for member in dialog");
                    currentStage = STAGE_ENTER_PRIVATE_MESSAGE;
                    return;
                }
                // If member node needs to be clicked again
                if (!TextUtils.isEmpty(pendingTargetMemberName)) {
                    AccessibilityNodeInfo memberNode = findMemberNameNode(rootNode, pendingTargetMemberName);
                    if (memberNode != null) {
                        memberNode.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        return;
                    }
                }
                return;
            }

            // STEP 3: Inside private 1-on-1 chat, find message input, set text, and optionally click send
            if (currentStage == STAGE_ENTER_PRIVATE_MESSAGE) {
                AccessibilityNodeInfo inputField = findInputField(rootNode);
                if (inputField != null) {
                    Bundle arguments = new Bundle();
                    arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pendingMessageToSend);
                    inputField.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);
                    Log.i(TAG, "Pasted acceptance message in private chat successfully");

                    if (pendingAutoSend) {
                        // Attempt to click send button after a slight delay/check
                        AccessibilityNodeInfo sendButton = findSendButton(rootNode);
                        if (sendButton != null && sendButton.isEnabled()) {
                            sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                            Log.i(TAG, "Triggered send button in private chat successfully!");
                        }
                    }

                    resetOperation();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in accessibility event processing", e);
        } finally {
            rootNode.recycle();
        }
    }

    private void resetOperation() {
        pendingMessageToSend = null;
        pendingTargetMemberName = null;
        pendingAutoSend = false;
        currentStage = STAGE_IDLE;
        isSendingInProgress.set(false);
    }

    private AccessibilityNodeInfo findMemberNameNode(AccessibilityNodeInfo root, String name) {
        if (root == null || TextUtils.isEmpty(name)) return null;

        // 1. Text lookup by full or partial name
        List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(name);
        if (nodes != null && !nodes.isEmpty()) {
            for (AccessibilityNodeInfo n : nodes) {
                if (n.isClickable()) return n;
                AccessibilityNodeInfo parent = n.getParent();
                if (parent != null && parent.isClickable()) return parent;
                if (parent != null) {
                    AccessibilityNodeInfo grandParent = parent.getParent();
                    if (grandParent != null && grandParent.isClickable()) return grandParent;
                }
            }
            return nodes.get(0);
        }

        // 2. Search in common message author / name view IDs
        String[] viewIds = new String[]{
                "com.whatsapp:id/name",
                "com.whatsapp:id/conversation_contact_name",
                "com.whatsapp:id/message_text"
        };
        for (String vid : viewIds) {
            List<AccessibilityNodeInfo> idNodes = root.findAccessibilityNodeInfosByViewId(vid);
            if (idNodes != null) {
                for (AccessibilityNodeInfo n : idNodes) {
                    CharSequence text = n.getText();
                    if (text != null && text.toString().toLowerCase().contains(name.toLowerCase())) {
                        if (n.isClickable()) return n;
                        AccessibilityNodeInfo parent = n.getParent();
                        if (parent != null && parent.isClickable()) return parent;
                    }
                }
            }
        }

        // 3. Fallback to first word of name
        String firstWord = name.split("\\s+")[0];
        if (firstWord.length() >= 3 && !firstWord.equals(name)) {
            List<AccessibilityNodeInfo> partialNodes = root.findAccessibilityNodeInfosByText(firstWord);
            if (partialNodes != null && !partialNodes.isEmpty()) {
                for (AccessibilityNodeInfo n : partialNodes) {
                    if (n.isClickable()) return n;
                    AccessibilityNodeInfo parent = n.getParent();
                    if (parent != null && parent.isClickable()) return parent;
                }
            }
        }

        return null;
    }

    private AccessibilityNodeInfo findPrivateMessageAction(AccessibilityNodeInfo root) {
        if (root == null) return null;

        // Common keywords for "Message {name}" in WhatsApp Arabic and English
        String[] keywords = new String[]{"مراسلة", "رسالة", "message", "chat", "direct"};

        for (String kw : keywords) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(kw);
            if (nodes != null && !nodes.isEmpty()) {
                for (AccessibilityNodeInfo n : nodes) {
                    if (n.isClickable()) return n;
                    AccessibilityNodeInfo parent = n.getParent();
                    if (parent != null && parent.isClickable()) return parent;
                }
                return nodes.get(0);
            }
        }

        // Search by view IDs for contact action dialogs
        String[] actionIds = new String[]{
                "com.whatsapp:id/conversation_contact_chat",
                "com.whatsapp:id/quick_action_message",
                "com.whatsapp:id/btn_msg",
                "com.whatsapp:id/chat_btn",
                "com.whatsapp:id/contact_row"
        };
        for (String vid : actionIds) {
            List<AccessibilityNodeInfo> idNodes = root.findAccessibilityNodeInfosByViewId(vid);
            if (idNodes != null && !idNodes.isEmpty()) {
                return idNodes.get(0);
            }
        }

        return null;
    }

    private AccessibilityNodeInfo findInputField(AccessibilityNodeInfo node) {
        if (node == null) return null;

        List<AccessibilityNodeInfo> list = node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/entry");
        if (list != null && !list.isEmpty()) {
            return list.get(0);
        }

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

    private AccessibilityNodeInfo findSendButton(AccessibilityNodeInfo root) {
        if (root == null) return null;

        List<AccessibilityNodeInfo> list = root.findAccessibilityNodeInfosByViewId("com.whatsapp:id/send");
        if (list != null && !list.isEmpty()) {
            return list.get(0);
        }

        // Look for send button by description
        String[] descriptions = new String[]{"إرسال", "ارسال", "Send", "send"};
        for (String desc : descriptions) {
            List<AccessibilityNodeInfo> descNodes = root.findAccessibilityNodeInfosByText(desc);
            if (descNodes != null) {
                for (AccessibilityNodeInfo n : descNodes) {
                    if (n.isClickable()) return n;
                }
            }
        }

        return null;
    }

    @Override
    public void onInterrupt() {
        resetOperation();
    }
}
