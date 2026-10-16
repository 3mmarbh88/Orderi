package com.orderi.radar;

import android.accessibilityservice.AccessibilityService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
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
    private static final int STAGE_CLICK_SEND = 4;

    private static volatile int currentStage = STAGE_IDLE;
    private static volatile String pendingMessageToSend = null;
    private static volatile String pendingTargetMemberName = null;
    private static volatile String pendingOriginGroupName = null;
    private static volatile boolean pendingAutoSend = false;
    private static volatile boolean pendingAwaitingWindowTransition = false;
    private static volatile boolean pendingSawWindowTransition = false;
    private static volatile long pendingMessageTimestamp = 0L;
    private static final AtomicBoolean isSendingInProgress = new AtomicBoolean(false);

    // Accessibility-driven fallback for archived WhatsApp chats. It only opens chats
    // when WhatsApp exposes an explicit unread indicator; it never sends messages.
    private static volatile boolean markArchivedChatsRequested = false;
    private boolean archivedSectionOpened = false;
    private boolean waitingForChatToClose = false;
    private int archivedReadEventRetries = 0;
    private int archivedChatsVisited = 0;
    private final java.util.HashSet<String> archivedUnreadChatsVisited = new java.util.HashSet<>();
    private static final int MAX_ARCHIVED_CHATS_TO_VISIT = 100;

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
        queueMessageToSend(message, autoSend, null);
    }

    public static void queueMessageToSend(String message, boolean autoSend, String originGroupName) {
        pendingMessageToSend = message;
        pendingTargetMemberName = null;
        pendingOriginGroupName = cleanMemberName(originGroupName);
        pendingAutoSend = autoSend;
        pendingAwaitingWindowTransition = true;
        pendingSawWindowTransition = false;
        pendingMessageTimestamp = System.currentTimeMillis();
        currentStage = STAGE_ENTER_PRIVATE_MESSAGE;
        isSendingInProgress.set(true);
        writeOutreachStatus("sending", "بانتظار فتح المحادثة الخاصة الصحيحة قبل الإرسال");
        Log.i(TAG, "Queued direct private message; waiting for target-chat transition. autoSend=" + autoSend);
    }

    public static void queueMessageToSend(String message) {
        queueMessageToSend(message, false);
    }

    public static void queueOutreachToMember(String memberName, String message, boolean autoSend) {
        queueOutreachToMember(memberName, message, autoSend, null);
    }

    public static void queueOutreachToMember(String memberName, String message, boolean autoSend, String originGroupName) {
        pendingTargetMemberName = cleanMemberName(memberName);
        pendingOriginGroupName = cleanMemberName(originGroupName);
        pendingMessageToSend = message;
        pendingAutoSend = autoSend;
        pendingAwaitingWindowTransition = false;
        pendingSawWindowTransition = false;
        pendingMessageTimestamp = System.currentTimeMillis();
        currentStage = STAGE_CLICK_MEMBER_NAME;
        isSendingInProgress.set(true);
        writeOutreachStatus("sending", "جاري فتح القروب والضغط على اسم المعلن للوصول إلى الخاص");
        Log.i(TAG, "Queued name-based outreach: member=" + pendingTargetMemberName
                + ", sourceGroup=" + pendingOriginGroupName + ", autoSend=" + autoSend);
    }

    public static void queueOutreachToMember(String memberName, String message) {
        queueOutreachToMember(memberName, message, false, null);
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

    /**
     * Starts a bounded Accessibility pass over WhatsApp's Archived section.
     * Returns true only when the service is connected and WhatsApp can be launched.
     */
    public static boolean requestMarkArchivedChatsRead(Context context) {
        if (context == null || !isAccessibilityEnabled(context) || instance == null) {
            return false;
        }

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(PACKAGE_WHATSAPP);
        if (launchIntent == null) {
            return false;
        }

        OrderiAccessibilityService service = instance;
        service.archivedSectionOpened = false;
        service.waitingForChatToClose = false;
        service.archivedReadEventRetries = 0;
        service.archivedChatsVisited = 0;
        service.archivedUnreadChatsVisited.clear();
        markArchivedChatsRequested = true;

        try {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launchIntent);
            Log.i(TAG, "Started archived-chat read pass");
            return true;
        } catch (Exception e) {
            markArchivedChatsRequested = false;
            Log.w(TAG, "Could not launch WhatsApp for archived-chat read pass", e);
            return false;
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        CharSequence pkg = event.getPackageName();
        if (pkg == null || !PACKAGE_WHATSAPP.contentEquals(pkg)) return;

        // Archived-chat processing is independent of the private-message workflow.
        // The previous guard returned early whenever no message was queued, so this
        // automation could never run even though the helper methods existed.
        if (markArchivedChatsRequested) {
            handleArchivedChatsReadEvent();
            return;
        }

        if (!isSendingInProgress.get() || pendingMessageToSend == null) return;

        // Expire pending operation after 30 seconds
        if (System.currentTimeMillis() - pendingMessageTimestamp > 30000L) {
            writeOutreachStatus("failed", "انتهت مهلة الوصول إلى محادثة المعلن أو الإرسال");
            resetOperation();
            return;
        }

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        try {
            // Phone-based intents must cause a fresh WhatsApp window transition before
            // processing any composer. This prevents the previously visible group chat
            // from accidentally receiving the acceptance message.
            if (pendingAwaitingWindowTransition) {
                if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                    pendingSawWindowTransition = true;
                }
                if (!pendingSawWindowTransition || !isPrivateChatScreen(rootNode)) {
                    return;
                }
                pendingAwaitingWindowTransition = false;
                Log.i(TAG, "Verified a private WhatsApp chat after target transition");
            }

            // Never type or send unless a private one-to-one composer is visible.
            if ((currentStage == STAGE_ENTER_PRIVATE_MESSAGE || currentStage == STAGE_CLICK_SEND)
                    && !isPrivateChatScreen(rootNode)) {
                return;
            }

            // STEP 1: Always select the advertiser's name first. Never treat an existing
            // group composer or unrelated "Message" text as proof of a private chat.
            if (currentStage == STAGE_CLICK_MEMBER_NAME) {
                if (!TextUtils.isEmpty(pendingTargetMemberName)) {
                    AccessibilityNodeInfo memberNode = findMemberNameNode(rootNode, pendingTargetMemberName);
                    if (memberNode != null && memberNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                        Log.i(TAG, "Clicked advertiser name node: " + pendingTargetMemberName);
                        currentStage = STAGE_CLICK_MESSAGE_ACTION;
                        return;
                    }
                }
                return;
            }

            // STEP 2: When member popup appears, click "Message {name}" / "مراسلة"
            if (currentStage == STAGE_CLICK_MESSAGE_ACTION) {
                AccessibilityNodeInfo messageAction = findPrivateMessageAction(rootNode);
                if (messageAction != null && messageAction.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
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
                    boolean textSet = inputField.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);
                    if (!textSet) {
                        writeOutreachStatus("failed", "تعذر إدخال رسالة القبول في المحادثة");
                        resetOperation();
                        return;
                    }
                    Log.i(TAG, "Acceptance message entered in target private chat");

                    if (pendingAutoSend) {
                        // Let WhatsApp update its composer from the microphone icon to
                        // the send button, then click it on a subsequent accessibility event.
                        currentStage = STAGE_CLICK_SEND;
                        return;
                    } else {
                        writeOutreachStatus("failed", "الإرسال التلقائي غير مفعل");
                        resetOperation();
                    }
                }
                return;
            }

            // STEP 4: Click Send only after the private-chat guard passed again.
            if (currentStage == STAGE_CLICK_SEND) {
                AccessibilityNodeInfo sendButton = findSendButton(rootNode);
                if (sendButton != null && sendButton.isEnabled()
                        && sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    writeOutreachStatus("sent_confirmed", "تم الضغط على زر الإرسال في المحادثة الخاصة");
                    Log.i(TAG, "WhatsApp private send-button action performed");
                    resetOperation();
                    returnToOrderi();
                }
                // Keep waiting for WhatsApp to render the send button. The operation
                // timeout reports failure instead of claiming success prematurely.
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in accessibility event processing", e);
        } finally {
            rootNode.recycle();
        }
    }

    private void handleArchivedChatsReadEvent() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;
        try {
            if (waitingForChatToClose) {
                // Do not immediately navigate back on the first list animation event.
                // Confirm WhatsApp opened an actual chat by locating its message composer.
                if (findInputField(root) != null) {
                    waitingForChatToClose = false;
                    performGlobalAction(GLOBAL_ACTION_BACK);
                    archivedReadEventRetries = 0;
                } else if (++archivedReadEventRetries > 8) {
                    finishArchivedReadPass("Could not confirm an archived chat opened");
                }
                return;
            }

            if (!archivedSectionOpened) {
                AccessibilityNodeInfo archived = findTextNode(root, new String[]{
                        "Archived", "Archived chats", "المؤرشفة", "مؤرشفة", "المحادثات المؤرشفة"
                });
                if (archived != null) {
                    AccessibilityNodeInfo clickable = clickableAncestor(archived, 4);
                    if (clickable != null && clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                        archivedSectionOpened = true;
                        archivedReadEventRetries = 0;
                        Log.i(TAG, "Opened WhatsApp Archived section for read-all");
                        return;
                    }
                }
                if (++archivedReadEventRetries > 8) {
                    finishArchivedReadPass("Archived section entry was not found");
                }
                return;
            }

            // Wait until WhatsApp's Archived screen is actually visible; do not inspect
            // the main chat list while the navigation transition is in progress.
            if (!containsText(root, new String[]{
                    "Archived", "Archived chats", "المؤرشفة", "مؤرشفة", "المحادثات المؤرشفة"
            })) {
                if (++archivedReadEventRetries > 8) {
                    finishArchivedReadPass("Could not confirm Archived screen");
                }
                return;
            }
            archivedReadEventRetries = 0;

            AccessibilityNodeInfo unreadMarker = findUnreadMarker(root);
            if (unreadMarker == null) {
                finishArchivedReadPass("No accessible unread markers found in Archived");
                return;
            }

            AccessibilityNodeInfo chatRow = clickableAncestor(unreadMarker, 6);
            if (chatRow == null) {
                finishArchivedReadPass("Unread marker had no clickable chat row");
                return;
            }
            // A badge often says only "unread messages" for every chat. Build the
            // de-duplication key from all accessible text inside the chat row instead.
            String signature = nodeSignature(chatRow);
            if (TextUtils.isEmpty(signature)) signature = describeNode(unreadMarker);
            if (TextUtils.isEmpty(signature)) signature = "unread-" + archivedChatsVisited;

            if (archivedUnreadChatsVisited.contains(signature)) {
                finishArchivedReadPass("Unread marker repeated; stopping to avoid opening the same chat");
                return;
            }
            if (archivedChatsVisited >= MAX_ARCHIVED_CHATS_TO_VISIT) {
                finishArchivedReadPass("Safety limit reached");
                return;
            }

            archivedUnreadChatsVisited.add(signature);
            if (chatRow.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                archivedChatsVisited++;
                waitingForChatToClose = true;
                Log.i(TAG, "Opened unread archived chat " + archivedChatsVisited + " to mark it read");
            } else {
                finishArchivedReadPass("Could not open unread archived chat");
            }
        } catch (Exception e) {
            Log.w(TAG, "Archived chat read pass stopped safely", e);
            finishArchivedReadPass("Accessibility error");
        } finally {
            root.recycle();
        }
    }

    private AccessibilityNodeInfo findUnreadMarker(AccessibilityNodeInfo node) {
        if (node == null) return null;
        String value = describeNode(node).toLowerCase(java.util.Locale.ROOT);
        boolean unread = value.contains("unread")
                || value.contains("غير مقروء")
                || value.contains("غير مقروءة")
                || value.contains("رسائل غير مقروءة")
                || value.contains("رسالة غير مقروءة");
        if (unread) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            AccessibilityNodeInfo found = findUnreadMarker(child);
            if (found != null) return found;
        }
        return null;
    }

    private AccessibilityNodeInfo findTextNode(AccessibilityNodeInfo root, String[] terms) {
        if (root == null) return null;
        for (String term : terms) {
            List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(term);
            if (matches != null) {
                for (AccessibilityNodeInfo match : matches) {
                    String value = describeNode(match).toLowerCase(java.util.Locale.ROOT);
                    String wanted = term.toLowerCase(java.util.Locale.ROOT);
                    if (value.contains(wanted)) return match;
                }
            }
        }
        return null;
    }

    private boolean containsText(AccessibilityNodeInfo root, String[] terms) {
        return findTextNode(root, terms) != null;
    }

    private AccessibilityNodeInfo clickableAncestor(AccessibilityNodeInfo node, int maxDepth) {
        AccessibilityNodeInfo current = node;
        for (int depth = 0; current != null && depth <= maxDepth; depth++) {
            if (current.isClickable()) return current;
            current = current.getParent();
        }
        return null;
    }

    private String nodeSignature(AccessibilityNodeInfo node) {
        if (node == null) return "";
        StringBuilder value = new StringBuilder();
        appendNodeText(node, value, 0);
        return value.toString().toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private void appendNodeText(AccessibilityNodeInfo node, StringBuilder out, int depth) {
        if (node == null || depth > 8) return;
        String own = describeNode(node);
        if (!TextUtils.isEmpty(own)) out.append(own).append(' ');
        for (int i = 0; i < node.getChildCount(); i++) {
            appendNodeText(node.getChild(i), out, depth + 1);
        }
    }

    private String describeNode(AccessibilityNodeInfo node) {
        if (node == null) return "";
        CharSequence text = node.getText();
        CharSequence desc = node.getContentDescription();
        String a = text == null ? "" : text.toString().trim();
        String b = desc == null ? "" : desc.toString().trim();
        return (a + " " + b).trim();
    }

    private void finishArchivedReadPass(String reason) {
        Log.i(TAG, "Archived read pass finished: " + reason + "; chats opened=" + archivedChatsVisited);
        markArchivedChatsRequested = false;
        archivedSectionOpened = false;
        waitingForChatToClose = false;
        archivedReadEventRetries = 0;
    }

    private void returnToOrderi() {
        try {
            Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(launchIntent);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not bring Orderi back to foreground", e);
        }
    }

    private static void writeOutreachStatus(String status, String label) {
        OrderiAccessibilityService service = instance;
        if (service == null) return;
        service.getSharedPreferences("orderi_private_outreach", Context.MODE_PRIVATE)
                .edit()
                .putString("status", status)
                .putString("status_label", label)
                .putLong("updated_at", System.currentTimeMillis())
                .apply();
    }

    private void resetOperation() {
        pendingMessageToSend = null;
        pendingTargetMemberName = null;
        pendingOriginGroupName = null;
        pendingAutoSend = false;
        pendingAwaitingWindowTransition = false;
        pendingSawWindowTransition = false;
        currentStage = STAGE_IDLE;
        isSendingInProgress.set(false);
    }

    private boolean isPrivateChatScreen(AccessibilityNodeInfo root) {
        if (root == null || findInputField(root) == null) return false;

        String header = "";
        List<AccessibilityNodeInfo> headers =
                root.findAccessibilityNodeInfosByViewId("com.whatsapp:id/conversation_contact_name");
        if (headers != null) {
            for (AccessibilityNodeInfo node : headers) {
                CharSequence text = node.getText();
                CharSequence description = node.getContentDescription();
                header = text != null ? text.toString().trim()
                        : (description != null ? description.toString().trim() : "");
                if (!TextUtils.isEmpty(header)) break;
            }
        }
        if (TextUtils.isEmpty(header)) return false;

        // Refuse to send if WhatsApp still shows the originating group as the chat title.
        if (!TextUtils.isEmpty(pendingOriginGroupName)
                && header.equalsIgnoreCase(pendingOriginGroupName.trim())) {
            return false;
        }

        // Group-only header controls vary by WhatsApp version; if any are exposed,
        // treat the screen as a group and fail closed.
        String[] groupHeaderIds = new String[]{
                "com.whatsapp:id/group_chat_info",
                "com.whatsapp:id/group_chat_info_container",
                "com.whatsapp:id/group_subject",
                "com.whatsapp:id/group_chat_header"
        };
        for (String id : groupHeaderIds) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId(id);
            if (nodes != null && !nodes.isEmpty()) return false;
        }
        return true;
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
        // Use WhatsApp's message-composer ID only. A generic EditText fallback can
        // accidentally select the chat-list search field or another unrelated input.
        List<AccessibilityNodeInfo> list =
                node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/entry");
        return list != null && !list.isEmpty() ? list.get(0) : null;
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
