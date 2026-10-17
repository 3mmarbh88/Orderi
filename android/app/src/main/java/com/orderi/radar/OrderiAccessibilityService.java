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
import java.util.ArrayList;
import android.os.Handler;
import android.os.Looper;
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

    // Sequential multi-group broadcast workflow. WhatsApp must be visible while
    // Accessibility interacts with its UI; after the last group, Orderi is restored.
    private static volatile boolean broadcastInProgress = false;
    private static volatile String pendingBroadcastMessage = null;
    private static volatile ArrayList<String> pendingBroadcastGroups = new ArrayList<>();
    private static volatile int pendingBroadcastIndex = 0;
    private int broadcastStage = 0;
    private int broadcastRetries = 0;
    private long lastBroadcastActionAt = 0L;
    private static final int BROADCAST_FIND_SEARCH = 1;
    private static final int BROADCAST_ENTER_SEARCH = 2;
    private static final int BROADCAST_OPEN_GROUP = 3;
    private static final int BROADCAST_ENTER_MESSAGE = 4;
    private static final int BROADCAST_SEND_MESSAGE = 5;
    private static final int BROADCAST_NEXT_GROUP = 6;

    private static volatile int currentStage = STAGE_IDLE;
    private static volatile String pendingMessageToSend = null;
    private static volatile String pendingTargetMemberName = null;
    private static volatile boolean pendingAutoSend = false;
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
        pendingMessageToSend = message;
        pendingTargetMemberName = null;
        pendingAutoSend = autoSend;
        pendingMessageTimestamp = System.currentTimeMillis();
        currentStage = STAGE_ENTER_PRIVATE_MESSAGE;
        isSendingInProgress.set(true);
        writeOutreachStatus("sending", "بانتظار تنفيذ الإرسال في المحادثة الخاصة");
        Log.i(TAG, "Queued direct private message to send. autoSend=" + autoSend);
    }

    public static void queueMessageToSend(String message) {
        queueMessageToSend(message, false);
    }

    public static boolean queueGroupBroadcast(Context context, List<String> groupNames, String message) {
        if (context == null || instance == null || !isAccessibilityEnabled(context)
                || groupNames == null || groupNames.isEmpty() || TextUtils.isEmpty(message)) {
            return false;
        }
        ArrayList<String> cleanGroups = new ArrayList<>();
        for (String group : groupNames) {
            if (group == null) continue;
            String clean = group.trim();
            if (!TextUtils.isEmpty(clean) && !cleanGroups.contains(clean)) cleanGroups.add(clean);
        }
        if (cleanGroups.isEmpty()) return false;

        OrderiAccessibilityService service = instance;
        pendingBroadcastGroups = cleanGroups;
        pendingBroadcastMessage = message;
        pendingBroadcastIndex = 0;
        broadcastInProgress = true;
        service.broadcastStage = BROADCAST_FIND_SEARCH;
        service.broadcastRetries = 0;
        service.lastBroadcastActionAt = 0L;
        writeOutreachStatus("broadcasting", "جاري النشر بالتتابع في " + cleanGroups.size() + " قروب واتساب");

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(PACKAGE_WHATSAPP);
        if (launch == null) {
            finishGroupBroadcast("failed", "تعذر العثور على تطبيق واتساب");
            return false;
        }
        try {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(launch);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Could not launch WhatsApp for group broadcast", e);
            finishGroupBroadcast("failed", "تعذر فتح واتساب لبدء النشر");
            return false;
        }
    }

    private static void finishGroupBroadcast(String status, String label) {
        broadcastInProgress = false;
        pendingBroadcastMessage = null;
        pendingBroadcastGroups = new ArrayList<>();
        pendingBroadcastIndex = 0;
        OrderiAccessibilityService service = instance;
        if (service != null) {
            service.broadcastStage = 0;
            service.broadcastRetries = 0;
            service.writeOutreachStatus(status, label);
            service.returnToOrderi();
        }
    }

    private void handleGroupBroadcastEvent() {
        if (!broadcastInProgress || pendingBroadcastMessage == null) return;
        long now = System.currentTimeMillis();
        if (now - lastBroadcastActionAt < 350L) return;
        if (pendingBroadcastIndex >= pendingBroadcastGroups.size()) {
            finishGroupBroadcast("sent_confirmed", "اكتمل النشر في جميع القروبات المحددة");
            return;
        }
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;
        try {
            String groupName = pendingBroadcastGroups.get(pendingBroadcastIndex);
            boolean acted = false;
            if (broadcastStage == BROADCAST_FIND_SEARCH) {
                // After backing out of a chat, WhatsApp may keep its search screen open.
                // Reuse that search box when present; otherwise open search from the chat list.
                AccessibilityNodeInfo existingSearch = findInputField(root);
                if (existingSearch != null && findChatComposer(root) == null) {
                    Bundle args = new Bundle();
                    args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, groupName);
                    acted = existingSearch.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
                    if (acted) broadcastStage = BROADCAST_OPEN_GROUP;
                } else {
                    AccessibilityNodeInfo search = findWhatsAppSearchButton(root);
                    if (search != null) acted = search.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    if (acted) broadcastStage = BROADCAST_ENTER_SEARCH;
                }
            } else if (broadcastStage == BROADCAST_ENTER_SEARCH) {
                AccessibilityNodeInfo input = findInputField(root);
                if (input != null) {
                    Bundle args = new Bundle();
                    args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, groupName);
                    acted = input.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
                    if (acted) broadcastStage = BROADCAST_OPEN_GROUP;
                }
            } else if (broadcastStage == BROADCAST_OPEN_GROUP) {
                AccessibilityNodeInfo result = findGroupSearchResult(root, groupName);
                if (result != null) acted = result.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                if (acted) broadcastStage = BROADCAST_ENTER_MESSAGE;
            } else if (broadcastStage == BROADCAST_ENTER_MESSAGE) {
                AccessibilityNodeInfo composer = findChatComposer(root);
                if (composer != null) {
                    Bundle args = new Bundle();
                    args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pendingBroadcastMessage);
                    acted = composer.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
                    if (acted) broadcastStage = BROADCAST_SEND_MESSAGE;
                }
            } else if (broadcastStage == BROADCAST_SEND_MESSAGE) {
                AccessibilityNodeInfo send = findSendButton(root);
                if (send != null && send.isEnabled()) acted = send.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                if (acted) {
                    broadcastStage = BROADCAST_NEXT_GROUP;
                    writeOutreachStatus("broadcasting", "تم إرسال الرسالة إلى " + groupName + " (" + (pendingBroadcastIndex + 1) + "/" + pendingBroadcastGroups.size() + ")");
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        if (!broadcastInProgress) return;
                        performGlobalAction(GLOBAL_ACTION_BACK);
                        pendingBroadcastIndex++;
                        broadcastRetries = 0;
                        broadcastStage = pendingBroadcastIndex >= pendingBroadcastGroups.size()
                                ? 0 : BROADCAST_FIND_SEARCH;
                        lastBroadcastActionAt = System.currentTimeMillis();
                        if (pendingBroadcastIndex >= pendingBroadcastGroups.size()) {
                            finishGroupBroadcast("sent_confirmed", "اكتمل النشر في جميع القروبات المحددة");
                        }
                    }, 800L);
                }
            } else if (broadcastStage == BROADCAST_NEXT_GROUP) {
                return;
            }

            if (acted) {
                lastBroadcastActionAt = now;
                broadcastRetries = 0;
            } else if (++broadcastRetries > 12) {
                finishGroupBroadcast("failed", "توقف النشر عند قروب «" + groupName + "»؛ لم يتم العثور على عنصر واتساب المتوقع");
            }
        } catch (Exception e) {
            Log.e(TAG, "Group broadcast automation failed", e);
            finishGroupBroadcast("failed", "تعذر إكمال النشر الآلي في واتساب");
        } finally {
            root.recycle();
        }
    }

    private AccessibilityNodeInfo findWhatsAppSearchButton(AccessibilityNodeInfo root) {
        if (root == null) return null;
        List<AccessibilityNodeInfo> ids = root.findAccessibilityNodeInfosByViewId("com.whatsapp:id/menuitem_search");
        if (ids != null && !ids.isEmpty()) return ids.get(0);
        String[] labels = new String[]{"Search", "Search chats", "بحث", "بحث في المحادثات"};
        for (String label : labels) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(label);
            if (nodes != null) for (AccessibilityNodeInfo node : nodes) {
                String desc = describeNode(node).toLowerCase(java.util.Locale.ROOT);
                if (desc.contains(label.toLowerCase(java.util.Locale.ROOT))) {
                    AccessibilityNodeInfo clickable = clickableAncestor(node, 4);
                    if (clickable != null) return clickable;
                }
            }
        }
        return null;
    }

    private AccessibilityNodeInfo findGroupSearchResult(AccessibilityNodeInfo root, String groupName) {
        if (root == null || TextUtils.isEmpty(groupName)) return null;
        List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(groupName);
        if (nodes == null) return null;
        for (AccessibilityNodeInfo node : nodes) {
            if ("android.widget.EditText".contentEquals(node.getClassName())) continue;
            AccessibilityNodeInfo clickable = clickableAncestor(node, 6);
            if (clickable != null && !containsText(clickable, new String[]{"Search", "بحث"})) return clickable;
        }
        return null;
    }

    private AccessibilityNodeInfo findChatComposer(AccessibilityNodeInfo root) {
        if (root == null) return null;
        List<AccessibilityNodeInfo> list = root.findAccessibilityNodeInfosByViewId("com.whatsapp:id/entry");
        return list == null || list.isEmpty() ? null : list.get(0);
    }

    public static void queueOutreachToMember(String memberName, String message, boolean autoSend) {
        pendingTargetMemberName = cleanMemberName(memberName);
        pendingMessageToSend = message;
        pendingAutoSend = autoSend;
        pendingMessageTimestamp = System.currentTimeMillis();
        currentStage = STAGE_CLICK_MEMBER_NAME;
        isSendingInProgress.set(true);
        writeOutreachStatus("sending", "جاري الوصول إلى محادثة المعلن الخاصة");
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

        if (broadcastInProgress) {
            handleGroupBroadcastEvent();
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
                AccessibilityNodeInfo messageAction = findPrivateMessageAction(rootNode, pendingTargetMemberName);
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

            // STEP 3: Before typing, confirm the visible one-to-one chat header matches
            // the advertiser selected in the source group. If the header cannot be verified,
            // do not type or send anything.
            if (currentStage == STAGE_ENTER_PRIVATE_MESSAGE) {
                if (!TextUtils.isEmpty(pendingTargetMemberName)
                        && !isPrivateChatForTarget(rootNode, pendingTargetMemberName)) {
                    Log.i(TAG, "Waiting for exact private-chat header match before typing");
                    return;
                }
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
                    Log.i(TAG, "Acceptance message entered in target chat");

                    if (pendingAutoSend) {
                        AccessibilityNodeInfo sendButton = findSendButton(rootNode);
                        if (sendButton != null && sendButton.isEnabled()
                                && sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                            writeOutreachStatus("sent_confirmed", "تم تنفيذ الضغط على زر الإرسال في واتساب");
                            Log.i(TAG, "WhatsApp send-button action performed");
                            returnToOrderi();
                        } else {
                            writeOutreachStatus("failed", "لم يظهر زر إرسال قابل للتنفيذ في المحادثة");
                        }
                    } else {
                        writeOutreachStatus("failed", "الإرسال التلقائي غير مفعل");
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
        pendingAutoSend = false;
        currentStage = STAGE_IDLE;
        isSendingInProgress.set(false);
    }

    private String normalizeLabel(String value) {
        if (value == null) return "";
        return value.toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private boolean nodeHasExactLabel(AccessibilityNodeInfo node, String expected) {
        if (node == null || TextUtils.isEmpty(expected)) return false;
        String wanted = normalizeLabel(expected);
        CharSequence text = node.getText();
        CharSequence description = node.getContentDescription();
        return wanted.equals(normalizeLabel(text == null ? "" : text.toString()))
                || wanted.equals(normalizeLabel(description == null ? "" : description.toString()));
    }

    private boolean isPrivateChatForTarget(AccessibilityNodeInfo root, String expectedName) {
        if (root == null || TextUtils.isEmpty(expectedName)) return false;
        String[] headerIds = new String[]{
                "com.whatsapp:id/conversation_contact_name",
                "com.whatsapp:id/conversation_contact_name_container"
        };
        for (String viewId : headerIds) {
            List<AccessibilityNodeInfo> headers = root.findAccessibilityNodeInfosByViewId(viewId);
            if (headers == null) continue;
            for (AccessibilityNodeInfo header : headers) {
                if (nodeHasExactLabel(header, expectedName)) return true;
            }
        }
        return false;
    }

    private AccessibilityNodeInfo findMemberNameNode(AccessibilityNodeInfo root, String name) {
        if (root == null || TextUtils.isEmpty(name)) return null;

        // Android's text search is partial by design. Only accept a node whose own
        // text/content-description exactly matches the advertiser name; never fall back
        // to a first name or arbitrary message body.
        List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(name);
        if (nodes != null) {
            for (AccessibilityNodeInfo node : nodes) {
                if (!nodeHasExactLabel(node, name)) continue;
                if (node.isClickable()) return node;
                AccessibilityNodeInfo parent = node.getParent();
                if (parent != null && parent.isClickable()) return parent;
                if (parent != null) {
                    AccessibilityNodeInfo grandParent = parent.getParent();
                    if (grandParent != null && grandParent.isClickable()) return grandParent;
                }
            }
        }

        // Only inspect identity/name views; message-body nodes are intentionally excluded.
        String[] viewIds = new String[]{
                "com.whatsapp:id/name",
                "com.whatsapp:id/conversation_contact_name"
        };
        for (String viewId : viewIds) {
            List<AccessibilityNodeInfo> idNodes = root.findAccessibilityNodeInfosByViewId(viewId);
            if (idNodes == null) continue;
            for (AccessibilityNodeInfo node : idNodes) {
                if (!nodeHasExactLabel(node, name)) continue;
                if (node.isClickable()) return node;
                AccessibilityNodeInfo parent = node.getParent();
                if (parent != null && parent.isClickable()) return parent;
            }
        }
        return null;
    }

    private AccessibilityNodeInfo findPrivateMessageAction(AccessibilityNodeInfo root, String memberName) {
        if (root == null) return null;

        // Require a specific action label. The generic Arabic word "رسالة" and
        // partial text matches are excluded because they can refer to unrelated UI.
        String[] actionLabels = new String[]{"مراسلة", "Message", "Chat"};
        for (String actionLabel : actionLabels) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(actionLabel);
            if (nodes == null) continue;
            for (AccessibilityNodeInfo node : nodes) {
                boolean exactAction = nodeHasExactLabel(node, actionLabel);
                String text = normalizeLabel(node.getText() == null ? "" : node.getText().toString());
                String desc = normalizeLabel(node.getContentDescription() == null ? "" : node.getContentDescription().toString());
                String target = normalizeLabel(memberName);
                boolean namedAction = !TextUtils.isEmpty(target)
                        && (text.equals("message " + target) || desc.equals("message " + target)
                        || text.equals("مراسلة " + target) || desc.equals("مراسلة " + target));
                if (!exactAction && !namedAction) continue;
                if (node.isClickable() && node.isEnabled()) return node;
                AccessibilityNodeInfo parent = node.getParent();
                if (parent != null && parent.isClickable() && parent.isEnabled()) return parent;
            }
        }

        // These IDs identify explicit message/chat actions, not generic contact rows.
        String[] actionIds = new String[]{
                "com.whatsapp:id/conversation_contact_chat",
                "com.whatsapp:id/quick_action_message",
                "com.whatsapp:id/btn_msg",
                "com.whatsapp:id/chat_btn"
        };
        for (String viewId : actionIds) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId(viewId);
            if (nodes == null) continue;
            for (AccessibilityNodeInfo node : nodes) {
                if (node.isClickable() && node.isEnabled()) return node;
                AccessibilityNodeInfo parent = node.getParent();
                if (parent != null && parent.isClickable() && parent.isEnabled()) return parent;
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
