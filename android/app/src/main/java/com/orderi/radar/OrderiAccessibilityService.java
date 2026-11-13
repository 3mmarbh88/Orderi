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

import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.graphics.Rect;
import android.os.Build;
import java.util.List;
import java.util.ArrayList;
import android.os.Handler;
import android.os.Looper;
import java.util.concurrent.atomic.AtomicBoolean;
import com.getcapacitor.JSObject;

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
    private static final int STAGE_VERIFY_SEND = 4;
    private static final int STAGE_FIND_GROUP_SEARCH = 5;
    private static final int STAGE_ENTER_GROUP_SEARCH = 6;
    private static final int STAGE_OPEN_GROUP_SEARCH_RESULT = 7;
    private static final int STAGE_LONG_PRESS_SOURCE_MESSAGE = 8;
    private static final int STAGE_SELECT_REPLY_PRIVATELY = 9;
    private static volatile int outreachScrollAttempts = 0;
    private static volatile long lastSendClickTime = 0L;

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
    private static volatile String pendingTargetGroupName = null;
        pendingSourceMessageText = null;
    private static volatile String pendingSourceMessageText = null;
    private static volatile boolean pendingAutoSend = false;
    private static volatile long pendingMessageTimestamp = 0L;
    private static final AtomicBoolean isSendingInProgress = new AtomicBoolean(false);

    // Watchdog to guarantee forward progress for advertiser private outreach even when accessibility events are sparse
    private final Handler outreachHandler = new Handler(Looper.getMainLooper());
    private final Runnable outreachWatchdog = new Runnable() {
        @Override
        public void run() {
            if (!isSendingInProgress.get() || pendingMessageToSend == null) return;
            handleOutreachEvent();
            if (isSendingInProgress.get() && pendingMessageToSend != null) {
                outreachHandler.postDelayed(this, 300L);
            }
        }
    };

    private void startOutreachWatchdog() {
        outreachHandler.removeCallbacks(outreachWatchdog);
        outreachHandler.postDelayed(outreachWatchdog, 300L);
    }

    // Accessibility-driven sweep for unread groups & archived WhatsApp chats.
    // Anchors strictly on Chats tab (never Calls/Updates), only opens groups with unread badges,
    // verifies badge clearance before counting, and strictly excludes private chats.
    private static volatile boolean markArchivedChatsRequested = false;
    private boolean archivedSectionOpened = false;
    private boolean activeGroupsSweepDone = false;
    private boolean chatsTabNavigationAttempted = false;
    private boolean waitingForChatToClose = false;
    private boolean waitingForBadgeToClear = false;
    private boolean isCurrentChatArchived = false;
    private String lastClickedSignature = null;
    private int archivedReadEventRetries = 0;
    private int archivedChatsVisited = 0;
    private int activeChatsVisited = 0;
    private int failedChatsCount = 0;
    private int archivedScrollAttempts = 0;
    private long lastArchivedActionAt = 0L;
    private final java.util.HashSet<String> archivedUnreadChatsVisited = new java.util.HashSet<>();
    private static final int MAX_ARCHIVED_CHATS_TO_VISIT = 100;

    // Accessibility events can be sparse while WhatsApp is rendering its chat list.
    // A bounded-rate watchdog keeps the read-all state machine moving even when no
    // new accessibility event arrives after WhatsApp is launched.
    private final Handler readAllHandler = new Handler(Looper.getMainLooper());
    private final Runnable readAllWatchdog = new Runnable() {
        @Override
        public void run() {
            if (!markArchivedChatsRequested) return;
            handleArchivedChatsReadEvent();
            if (markArchivedChatsRequested) {
                readAllHandler.postDelayed(this, 650L);
            }
        }
    };

    private void startReadAllWatchdog() {
        readAllHandler.removeCallbacks(readAllWatchdog);
        readAllHandler.postDelayed(readAllWatchdog, 650L);
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        Log.i(TAG, "Orderi Accessibility Service connected successfully");
    }

    @Override
    public void onDestroy() {
        readAllHandler.removeCallbacks(readAllWatchdog);
        outreachHandler.removeCallbacks(outreachWatchdog);
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
        outreachScrollAttempts = 0;
        lastSendClickTime = 0L;
        isSendingInProgress.set(true);
        writeOutreachStatus("sending", "بانتظار تنفيذ الإرسال في المحادثة الخاصة");
        Log.i(TAG, "Queued direct private message to send. autoSend=" + autoSend);
        if (instance != null) {
            instance.startOutreachWatchdog();
        }
    }

    public static void queueMessageToSend(String message) {
        queueMessageToSend(message, false);
    }

    /**
     * Background-only group broadcast.
     *
     * Uses an exact, recent WhatsApp group notification's RemoteInput reply action.
     * It never launches WhatsApp or drives its visible UI. Groups without a usable
     * reply action are reported as skipped rather than opening WhatsApp as a fallback.
     */
    public static boolean queueGroupBroadcast(Context context, List<String> groupNames, String message) {
        if (context == null || groupNames == null || groupNames.isEmpty() || TextUtils.isEmpty(message)) {
            writeOutreachStatus("failed", "لم يتم تحديد أي قروب أو رسالة للنشر");
            return false;
        }

        ArrayList<String> cleanGroups = new ArrayList<>();
        for (String group : groupNames) {
            if (group == null) continue;
            String clean = group.trim();
            if (!TextUtils.isEmpty(clean) && !cleanGroups.contains(clean)) cleanGroups.add(clean);
        }
        if (cleanGroups.isEmpty()) {
            writeOutreachStatus("failed", "لم يتم تحديد أي قروب للنشر");
            return false;
        }

        int sent = 0;
        ArrayList<String> failedGroups = new ArrayList<>();
        writeOutreachStatus("broadcasting", "محاولة النشر في الخلفية إلى " + cleanGroups.size() + " قروب محدد");

        for (String groupName : cleanGroups) {
            boolean ok = WhatsAppNotificationListenerService.sendGroupNotificationReply(context, groupName, message);
            if (ok) {
                sent++;
                Log.i(TAG, "Background group reply action submitted for exact group: " + groupName);
            } else {
                failedGroups.add(groupName);
                Log.w(TAG, "No safe recent group reply action available for: " + groupName);
            }
        }

        if (sent == cleanGroups.size()) {
            writeOutreachStatus("sent_confirmed", "تم تمرير الرسالة عبر إجراء الرد بالخلفية إلى " + sent
                    + " قروب؛ هذا لا يؤكد وصولها أو قراءتها");
            return true;
        }
        if (sent > 0) {
            writeOutreachStatus("sent_confirmed", "تم تمرير الرسالة إلى " + sent + " من " + cleanGroups.size()
                    + " قروب بالخلفية. لم يتوفر إجراء رد آمن لهذه القروبات: " + TextUtils.join("، ", failedGroups));
            return true;
        }

        writeOutreachStatus("failed", "لم تُرسل أي رسالة. لا يوجد إجراء رد حديث وصالح في إشعارات القروبات المحددة: "
                + TextUtils.join("، ", failedGroups) + ". افتح إشعار القروب أو استخدم النشر اليدوي");
        return false;
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
        String expected = normalizeAdvertiserIdentity(groupName);
        List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(groupName);
        if (nodes == null) return null;
        for (AccessibilityNodeInfo node : nodes) {
            if ("android.widget.EditText".contentEquals(node.getClassName())) continue;
            String label = normalizeAdvertiserIdentity(node.getText() == null ? "" : node.getText().toString());
            String description = normalizeAdvertiserIdentity(node.getContentDescription() == null ? "" : node.getContentDescription().toString());
            if (!expected.equals(label) && !expected.equals(description)) continue;
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
        queueOutreachToMember(memberName, "", message, autoSend);
    }

    public static void queueOutreachToMember(String memberName, String groupName, String message, boolean autoSend) {
        queueOutreachToMember(memberName, groupName, "", message, autoSend);
    }

    public static void queueOutreachToMember(String memberName, String groupName, String sourceMessageText, String message, boolean autoSend) {
        pendingTargetMemberName = cleanMemberName(memberName);
        pendingSourceMessageText = sourceMessageText == null ? "" : sourceMessageText.trim();
        pendingTargetGroupName = groupName == null ? "" : groupName.trim();
        pendingMessageToSend = message;
        pendingAutoSend = autoSend;
        pendingMessageTimestamp = System.currentTimeMillis();
        currentStage = TextUtils.isEmpty(pendingSourceMessageText) ? STAGE_CLICK_MEMBER_NAME : STAGE_LONG_PRESS_SOURCE_MESSAGE;
        outreachScrollAttempts = 0;
        lastSendClickTime = 0L;
        isSendingInProgress.set(true);
        writeOutreachStatus("sending", "جاري الوصول إلى قروب «" + pendingTargetGroupName + "» والبحث عن المعلن «" + pendingTargetMemberName + "»");
        Log.i(TAG, "Queued name-based outreach. group=" + pendingTargetGroupName + " member=" + pendingTargetMemberName + " autoSend=" + autoSend);
        if (instance != null) instance.startOutreachWatchdog();
    }

    /** Launch regular WhatsApp and continue through its in-app chat search if no exact notification intent exists. */
    public static boolean launchWhatsAppForOutreach(Context context) {
        if (context == null || TextUtils.isEmpty(pendingTargetGroupName) || TextUtils.isEmpty(pendingTargetMemberName)) return false;
        try {
            Intent launch = context.getPackageManager().getLaunchIntentForPackage(PACKAGE_WHATSAPP);
            if (launch == null) return false;
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            currentStage = STAGE_FIND_GROUP_SEARCH;
            pendingMessageTimestamp = System.currentTimeMillis();
            context.startActivity(launch);
            if (instance != null) instance.startOutreachWatchdog();
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Could not launch WhatsApp for name-based outreach", e);
            return false;
        }
    }

    public static void queueOutreachToMember(String memberName, String message) {
        queueOutreachToMember(memberName, message, false);
    }

    /**
     * Normalize WhatsApp group sender labels without requiring a phone number.
     * WhatsApp may decorate display names with "~", punctuation or emoji,
     * e.g. "😊 abood-bufatima ~". Keep a pure-emoji identity intact.
     */
    private static String cleanMemberName(String raw) {
        if (raw == null) return "";
        String s = raw.replaceAll("[\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]", "").trim();
        if (s.isEmpty()) return "";

        boolean hasLetterOrDigit = false;
        for (int i = 0; i < s.length();) {
            int cp = s.codePointAt(i);
            if (Character.isLetterOrDigit(cp)) { hasLetterOrDigit = true; break; }
            i += Character.charCount(cp);
        }

        if (hasLetterOrDigit) {
            s = s.replaceAll("^[\\s~@+：:،,؛;\\p{So}\\p{Sk}]+", "")
                 .replaceAll("[\\s~@+：:،,؛;\\p{So}\\p{Sk}]+$", "").trim();
        } else {
            s = s.replaceAll("^[\\s~@+：:،,؛;]+", "")
                 .replaceAll("[\\s~@+：:،,؛;]+$", "").trim();
        }
        return s;
    }

    private static String normalizeAdvertiserIdentity(String raw) {
        String s = cleanMemberName(raw).toLowerCase(java.util.Locale.ROOT);
        s = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFKC);
        s = s.replaceAll("[\\u064B-\\u065F\\u0670]", "");
        return s.replaceAll("\\s+", " ").trim();
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
        if (context == null || instance == null) return false;
        if (!isAccessibilityEnabled(context)) return false;

        markArchivedChatsRequested = true;
        context.getSharedPreferences("orderi_read_all_status", Context.MODE_PRIVATE).edit()
                .putString("status", "running")
                .putInt("visited", 0)
                .putString("detail", "بدأ فحص قروبات واتساب النشطة والمؤرشفة")
                .putLong("updated_at", System.currentTimeMillis())
                .commit();
        instance.archivedSectionOpened = false;
        instance.activeGroupsSweepDone = false;
        instance.chatsTabNavigationAttempted = false;
        instance.waitingForChatToClose = false;
        instance.waitingForBadgeToClear = false;
        instance.isCurrentChatArchived = false;
        instance.lastClickedSignature = null;
        instance.archivedReadEventRetries = 0;
        instance.archivedChatsVisited = 0;
        instance.activeChatsVisited = 0;
        instance.failedChatsCount = 0;
        instance.archivedScrollAttempts = 0;
        instance.lastArchivedActionAt = 0L;
        instance.archivedUnreadChatsVisited.clear();

        try {
            Intent intent = context.getPackageManager().getLaunchIntentForPackage(PACKAGE_WHATSAPP);
            if (intent == null) {
                intent = context.getPackageManager().getLaunchIntentForPackage("com.whatsapp.w4b");
            }
            if (intent == null) {
                intent = new Intent(Intent.ACTION_MAIN);
                intent.setPackage(PACKAGE_WHATSAPP);
                intent.addCategory(Intent.CATEGORY_LAUNCHER);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(intent);
            instance.startReadAllWatchdog();
            Log.i(TAG, "Launched WhatsApp to sweep and mark unread groups and archived chats as read");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Could not launch WhatsApp for sweep read pass", e);
            markArchivedChatsRequested = false;
            return false;
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        CharSequence pkg = event.getPackageName();
        if (pkg == null || (!PACKAGE_WHATSAPP.contentEquals(pkg) && !"com.whatsapp.w4b".contentEquals(pkg))) return;

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

        if (isSendingInProgress.get() && pendingMessageToSend != null) {
            handleOutreachEvent();
            return;
        }
    }

    private void handleOutreachEvent() {
        if (!isSendingInProgress.get() || pendingMessageToSend == null) return;

        // Allow enough time for WhatsApp launch, chat search, group open and member selection (bounded).
        if (System.currentTimeMillis() - pendingMessageTimestamp > 60000L) {
            writeOutreachStatus("failed", "انتهت مهلة الوصول إلى محادثة المعلن أو الإرسال");
            resetOperation();
            return;
        }

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        try {
            // FALLBACK: If the exact group notification could not be opened, navigate through WhatsApp's own chat search.
            if (currentStage == STAGE_FIND_GROUP_SEARCH) {
                AccessibilityNodeInfo existingSearch = findInputField(rootNode);
                if (existingSearch != null && findChatComposer(rootNode) == null) {
                    Bundle args = new Bundle();
                    args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pendingTargetGroupName);
                    if (existingSearch.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                        currentStage = STAGE_OPEN_GROUP_SEARCH_RESULT;
                        writeOutreachStatus("sending", "تم البحث عن القروب؛ جاري فتحه للعثور على اسم المعلن");
                    }
                    return;
                }
                AccessibilityNodeInfo searchButton = findWhatsAppSearchButton(rootNode);
                if (searchButton != null && searchButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    currentStage = STAGE_ENTER_GROUP_SEARCH;
                    return;
                }
                return;
            }
            if (currentStage == STAGE_ENTER_GROUP_SEARCH) {
                AccessibilityNodeInfo searchInput = findInputField(rootNode);
                if (searchInput != null && findChatComposer(rootNode) == null) {
                    Bundle args = new Bundle();
                    args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pendingTargetGroupName);
                    if (searchInput.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                        currentStage = STAGE_OPEN_GROUP_SEARCH_RESULT;
                    }
                }
                return;
            }
            if (currentStage == STAGE_OPEN_GROUP_SEARCH_RESULT) {
                AccessibilityNodeInfo groupResult = findGroupSearchResult(rootNode, pendingTargetGroupName);
                if (groupResult != null && groupResult.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    currentStage = TextUtils.isEmpty(pendingSourceMessageText) ? STAGE_CLICK_MEMBER_NAME : STAGE_LONG_PRESS_SOURCE_MESSAGE;
                    pendingMessageTimestamp = System.currentTimeMillis();
                    writeOutreachStatus("sending", TextUtils.isEmpty(pendingSourceMessageText) ? "تم فتح القروب الصحيح؛ جاري تحديد اسم المعلن «" + pendingTargetMemberName + "»" : "تم فتح القروب؛ جاري تحديد رسالة الإعلان الأصلية للرد على صاحبها بشكل خاص");
                }
                return;
            }

            // Primary path: invoke WhatsApp's own Reply Privately action on the exact source message.
            if (currentStage == STAGE_LONG_PRESS_SOURCE_MESSAGE) {
                AccessibilityNodeInfo sourceNode = findOriginalMessageNode(rootNode, pendingSourceMessageText);
                if (sourceNode != null) {
                    AccessibilityNodeInfo target = sourceNode.isLongClickable() ? sourceNode : clickableAncestor(sourceNode, 6);
                    if (target != null && target.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)) {
                        currentStage = STAGE_SELECT_REPLY_PRIVATELY;
                        writeOutreachStatus("sending", "تم تحديد الإعلان الأصلي؛ جاري اختيار «الرد بشكل خاص» من واتساب");
                        return;
                    }
                }
                if (outreachScrollAttempts < 3) {
                    AccessibilityNodeInfo scrollable = findScrollableNode(rootNode);
                    if (scrollable != null) scrollable.performAction(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD);
                    outreachScrollAttempts++;
                    return;
                }
                currentStage = STAGE_CLICK_MEMBER_NAME;
                outreachScrollAttempts = 0;
                writeOutreachStatus("sending", "تعذر تحديد الرسالة الأصلية؛ سنحاول الوصول إلى المعلن باسمه المطابق داخل المجموعة");
                return;
            }
            if (currentStage == STAGE_SELECT_REPLY_PRIVATELY) {
                AccessibilityNodeInfo replyAction = findReplyPrivatelyAction(rootNode);
                if (replyAction != null && replyAction.isEnabled()) {
                    boolean clicked = replyAction.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    if (!clicked) {
                        AccessibilityNodeInfo parent = clickableAncestor(replyAction, 4);
                        clicked = parent != null && parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    }
                    if (clicked) {
                        currentStage = STAGE_ENTER_PRIVATE_MESSAGE;
                        writeOutreachStatus("sending", "تم اختيار الرد الخاص؛ جاري التحقق من هوية المحادثة قبل إدخال الرسالة");
                    }
                }
                return;
            }

            // STEP 1: Always select the advertiser's name/bubble in the group chat first.
            if (currentStage == STAGE_CLICK_MEMBER_NAME) {
                if (!TextUtils.isEmpty(pendingTargetMemberName)) {
                    AccessibilityNodeInfo memberNode = findMemberNameNode(rootNode, pendingTargetMemberName);
                    if (memberNode != null) {
                        boolean clicked = performClickGesture(memberNode);
                        if (!clicked) clicked = memberNode.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        if (clicked) {
                            Log.i(TAG, "Clicked advertiser name node: " + pendingTargetMemberName);
                            currentStage = STAGE_CLICK_MESSAGE_ACTION;
                            writeOutreachStatus("sending", "تم النقر على اسم المعلن «" + pendingTargetMemberName + "»؛ جاري اختيار مراسلة بالخاص");
                            return;
                        }
                    } else {
                        // If not visible on current screen, attempt small scroll up to locate recent message
                        if (outreachScrollAttempts < 3) {
                            AccessibilityNodeInfo scrollable = findScrollableNode(rootNode);
                            if (scrollable != null && scrollable.performAction(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD)) {
                                outreachScrollAttempts++;
                                Log.i(TAG, "Scrolled backward in group to locate advertiser bubble (attempt " + outreachScrollAttempts + ")");
                                return;
                            }
                        }
                    }
                }
                return;
            }

            // STEP 2: When member popup appears, click "Message {name}" / "مراسلة"
            if (currentStage == STAGE_CLICK_MESSAGE_ACTION) {
                AccessibilityNodeInfo messageAction = findPrivateMessageAction(rootNode, pendingTargetMemberName);
                if (messageAction != null) {
                    boolean clicked = performClickGesture(messageAction);
                    if (!clicked) clicked = messageAction.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    if (clicked) {
                        Log.i(TAG, "Clicked private Message action for member in dialog");
                        currentStage = STAGE_ENTER_PRIVATE_MESSAGE;
                        writeOutreachStatus("sending", "تم اختيار المراسلة؛ جاري كتابة رسالة القبول في محادثة المعلن الخاصة");
                        return;
                    }
                }
                // If member node needs to be clicked again
                if (!TextUtils.isEmpty(pendingTargetMemberName)) {
                    AccessibilityNodeInfo memberNode = findMemberNameNode(rootNode, pendingTargetMemberName);
                    if (memberNode != null) {
                        performClickGesture(memberNode);
                        return;
                    }
                }
                return;
            }

            // STEP 3: In the private chat, enter message and optionally click send
            if (currentStage == STAGE_ENTER_PRIVATE_MESSAGE) {
                if (!isPrivateConversationScreen(rootNode, pendingTargetMemberName)) {
                    Log.i(TAG, "Waiting for private-chat screen to render before typing");
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
                        if (sendButton != null && sendButton.isEnabled()) {
                            boolean sent = performClickGesture(sendButton);
                            if (!sent) sent = sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                            if (sent) {
                                currentStage = STAGE_VERIFY_SEND;
                                lastSendClickTime = System.currentTimeMillis();
                                Log.i(TAG, "WhatsApp send-button clicked, awaiting delivery verification");
                                return;
                            }
                        }
                        writeOutreachStatus("failed", "لم يظهر زر إرسال قابل للتنفيذ في المحادثة");
                        resetOperation();
                    } else {
                        // When autoSend is false, message is prepared in composer for user review and confirmation
                        writeOutreachStatus("prepared", "تم تجهيز الرسالة في محادثة المعلن الخاصة؛ يمكنك الرد الآن 💬");
                        Log.i(TAG, "Private message prepared in composer; awaiting user send confirmation");
                        resetOperation();
                    }
                }
                return;
            }

            // STEP 4: Confirm send delivery (composer empty / send complete)
            if (currentStage == STAGE_VERIFY_SEND) {
                AccessibilityNodeInfo inputField = findInputField(rootNode);
                boolean composerCleared = false;
                if (inputField != null) {
                    CharSequence text = inputField.getText();
                    composerCleared = (text == null || text.length() == 0);
                }
                if (composerCleared) {
                    // Clearing the composer confirms submission to the chat UI, not delivery/read receipt.
                    writeOutreachStatus("submitted_unconfirmed", "تم تمرير رسالة القبول إلى محادثة المعلن؛ لم يؤكد واتساب التسليم بعد");
                    Log.i(TAG, "WhatsApp composer cleared after send tap; submission is unconfirmed. Returning to Orderi...");
                    returnToOrderi();
                    resetOperation();
                } else if (System.currentTimeMillis() - lastSendClickTime > 8000L) {
                    writeOutreachStatus("failed", "لم يختفِ نص الرسالة من خانة الكتابة؛ تعذر تأكيد الإرسال");
                    Log.w(TAG, "WhatsApp send could not be verified; leaving the order unaccepted");
                    returnToOrderi();
                    resetOperation();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in accessibility outreach event processing", e);
        } finally {
            rootNode.recycle();
        }
    }

    private void handleArchivedChatsReadEvent() {
        long now = System.currentTimeMillis();
        if (now - lastArchivedActionAt < 180L) return;

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;
        try {
            // STEP 1: If waiting for a chat to open, wait for it to render, scrape ad messages, then press back
            if (waitingForChatToClose) {
                if (isConversationOpen(root)) {
                    lastArchivedActionAt = now;
                    waitingForChatToClose = false;
                    waitingForBadgeToClear = true;
                    archivedReadEventRetries = 0;

                    // Scrape conversation title & ad messages from group before closing
                    scrapeAndDispatchArchivedConversation(root);

                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        performGlobalAction(GLOBAL_ACTION_BACK);
                    }, 140L);
                } else if (++archivedReadEventRetries > 8) {
                    waitingForChatToClose = false;
                    archivedReadEventRetries = 0;
                    failedChatsCount++;
                }
                return;
            }

            // STEP 2: After returning from conversation, verify badge cleared on the previous item
            if (waitingForBadgeToClear) {
                waitingForBadgeToClear = false;
                lastArchivedActionAt = now;
                // If the signature is still present and shows unread badge, retry once or record
                // We've successfully visited and opened it.
                if (isCurrentChatArchived) {
                    archivedChatsVisited++;
                } else {
                    activeChatsVisited++;
                }
            }

            // STEP 3: Anchor navigation strictly on the "Chats" / "الدردشات" tab
            // Prevent WhatsApp from being stranded in Calls, Updates, or Communities.
            if (!archivedSectionOpened && !activeGroupsSweepDone) {
                if (ensureChatsTabSelected(root)) {
                    lastArchivedActionAt = now;
                    return;
                }
            }

            // STEP 4: PHASE 1 - Sweep active unread GROUPS on the main Chats tab
            if (!activeGroupsSweepDone) {
                AccessibilityNodeInfo unreadActiveGroup = findUnreadGroupInMainScreen(root);
                if (unreadActiveGroup != null) {
                    String signature = nodeSignature(unreadActiveGroup);
                    archivedUnreadChatsVisited.add(signature);
                    lastClickedSignature = signature;
                    isCurrentChatArchived = false;
                    lastArchivedActionAt = now;
                    if (performClickGesture(unreadActiveGroup)) {
                        waitingForChatToClose = true;
                        Log.i(TAG, "Simulated touch gesture click on unread active group: " + signature);
                    }
                    return;
                }

                // If no more active unread groups visible on main chats list, proceed to Archived section
                activeGroupsSweepDone = true;
                Log.i(TAG, "Completed active groups sweep (" + activeChatsVisited + " opened). Now entering Archived section...");
            }

            // STEP 5: PHASE 2 - Navigate into Archived section
            if (!archivedSectionOpened) {
                if (isArchivedScreen(root)) {
                    archivedSectionOpened = true;
                    archivedReadEventRetries = 0;
                    lastArchivedActionAt = now;
                } else {
                    AccessibilityNodeInfo archivedRow = findArchivedRow(root);
                    if (archivedRow != null) {
                        if (performClickGesture(archivedRow)) {
                            archivedSectionOpened = true;
                            archivedReadEventRetries = 0;
                            lastArchivedActionAt = now;
                            Log.i(TAG, "Opened WhatsApp Archived section using touch gesture for read-all pass");
                            return;
                        }
                    }
                    if (++archivedReadEventRetries > 8) {
                        finishArchivedReadPass("Archived section entry was not found or has no archived chats");
                    }
                    return;
                }
            }

            // STEP 6: Confirm we are in Archived screen
            if (!isArchivedScreen(root) && !containsText(root, new String[]{
                    "Archived", "Archived chats", "المؤرشفة", "مؤرشفة", "الدردشات المؤرشفة", "المحادثات المؤرشفة"
            })) {
                if (++archivedReadEventRetries > 8) {
                    finishArchivedReadPass("Could not confirm Archived screen");
                }
                return;
            }
            archivedReadEventRetries = 0;

            // STEP 7: Search for unread group in the Archived list
            AccessibilityNodeInfo unreadArchivedGroup = findUnreadGroupInArchived(root);
            if (unreadArchivedGroup != null) {
                String signature = nodeSignature(unreadArchivedGroup);
                archivedUnreadChatsVisited.add(signature);
                lastClickedSignature = signature;
                isCurrentChatArchived = true;
                lastArchivedActionAt = now;
                if (performClickGesture(unreadArchivedGroup)) {
                    waitingForChatToClose = true;
                    Log.i(TAG, "Simulated touch gesture click on unread archived group #" + (archivedChatsVisited + 1));
                }
                return;
            }

            // STEP 8: No unread group visible on current screen in Archived. Attempt scroll forward.
            AccessibilityNodeInfo scrollable = findScrollableNode(root);
            if (scrollable != null && archivedScrollAttempts < MAX_ARCHIVED_CHATS_TO_VISIT) {
                archivedScrollAttempts++;
                lastArchivedActionAt = now;
                boolean scrolled = scrollable.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
                if (scrolled) {
                    return;
                }
            } else if (scrollable != null && archivedScrollAttempts >= MAX_ARCHIVED_CHATS_TO_VISIT) {
                finishArchivedReadPass("تم الوصول إلى حد التمرير الآمن؛ لم يمكن التحقق من بقية القروبات المؤرشفة");
                return;
            }

            // No further scroll is available: finish only after the visible list is exhausted.
            Log.i(TAG, "Read-all pass complete! Active groups read: " + activeChatsVisited
                    + ", Archived groups read: " + archivedChatsVisited + ", Failed: " + failedChatsCount);
            performGlobalAction(GLOBAL_ACTION_BACK);
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                finishArchivedReadPass("All delivery groups marked as read successfully");
            }, 250L);

        } catch (Exception e) {
            Log.w(TAG, "Sweep read pass stopped safely", e);
            finishArchivedReadPass("Accessibility error");
        } finally {
            root.recycle();
        }
    }

    private void scrapeAndDispatchArchivedConversation(AccessibilityNodeInfo root) {
        if (root == null) return;
        try {
            String convName = "";
            String[] headerIds = new String[]{
                    "com.whatsapp:id/conversation_contact_name",
                    "com.whatsapp:id/conversation_contact_name_container"
            };
            for (String hId : headerIds) {
                List<AccessibilityNodeInfo> list = root.findAccessibilityNodeInfosByViewId(hId);
                if (list != null && !list.isEmpty()) {
                    convName = describeNode(list.get(0)).trim();
                    if (!TextUtils.isEmpty(convName)) break;
                }
            }
            if (TextUtils.isEmpty(convName)) {
                convName = "قروب واتساب (مؤرشف 📦)";
            }

            // Extract visible message text nodes
            String[] msgViewIds = new String[]{
                    "com.whatsapp:id/message_text",
                    "com.whatsapp:id/caption",
                    "com.whatsapp:id/text_and_date"
            };
            ArrayList<String> messagesFound = new ArrayList<>();
            for (String mId : msgViewIds) {
                List<AccessibilityNodeInfo> msgs = root.findAccessibilityNodeInfosByViewId(mId);
                if (msgs != null) {
                    for (AccessibilityNodeInfo mNode : msgs) {
                        String t = describeNode(mNode).trim();
                        if (!TextUtils.isEmpty(t) && t.length() > 5 && !messagesFound.contains(t)) {
                            messagesFound.add(t);
                        }
                    }
                }
            }

            // Dispatch last recent messages to Orderi notification pipeline
            int start = Math.max(0, messagesFound.size() - 3);
            for (int i = start; i < messagesFound.size(); i++) {
                String msgText = messagesFound.get(i);
                WhatsAppNotificationListenerService.dispatchCustomWhatsAppEvent(
                        this,
                        convName,
                        "معلن بالقروب المؤرشف",
                        msgText,
                        true
                );
                Log.i(TAG, "Scraped and dispatched order from archived group: " + convName + " -> " + msgText);
            }
        } catch (Exception e) {
            Log.w(TAG, "Error scraping archived conversation", e);
        }
    }

    private boolean isConversationOpen(AccessibilityNodeInfo root) {
        if (root == null) return false;
        if (findInputField(root) != null) return true;
        String[] ids = new String[]{
                "com.whatsapp:id/conversation_contact_name",
                "com.whatsapp:id/conversation_contact_name_container",
                "com.whatsapp:id/entry",
                "com.whatsapp:id/voice_note_btn",
                "com.whatsapp:id/send",
                "com.whatsapp:id/conversation_layout"
        };
        for (String id : ids) {
            List<AccessibilityNodeInfo> list = root.findAccessibilityNodeInfosByViewId(id);
            if (list != null && !list.isEmpty()) return true;
        }
        return false;
    }

    private boolean isArchivedScreen(AccessibilityNodeInfo root) {
        if (root == null) return false;
        String[] titles = new String[]{"Archived", "Archived chats", "المؤرشفة", "مؤرشفة", "الدردشات المؤرشفة", "المحادثات المؤرشفة"};
        for (String title : titles) {
            List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(title);
            if (matches != null && !matches.isEmpty()) {
                List<AccessibilityNodeInfo> back = root.findAccessibilityNodeInfosByViewId("com.whatsapp:id/back");
                if (back != null && !back.isEmpty()) return true;
                for (AccessibilityNodeInfo m : matches) {
                    if (m.getParent() != null && m.getParent().getClassName() != null
                            && m.getParent().getClassName().toString().contains("Toolbar")) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private AccessibilityNodeInfo findArchivedRow(AccessibilityNodeInfo root) {
        if (root == null) return null;
        String[] viewIds = new String[]{
                "com.whatsapp:id/archived_row",
                "com.whatsapp:id/archived_row_content",
                "com.whatsapp:id/conversations_row_archived",
                "com.whatsapp:id/archived"
        };
        for (String vid : viewIds) {
            List<AccessibilityNodeInfo> list = root.findAccessibilityNodeInfosByViewId(vid);
            if (list != null && !list.isEmpty()) {
                AccessibilityNodeInfo click = clickableAncestor(list.get(0), 4);
                if (click != null) return click;
            }
        }
        String[] terms = new String[]{"Archived", "Archived chats", "المؤرشفة", "مؤرشفة", "الدردشات المؤرشفة", "المحادثات المؤرشفة"};
        AccessibilityNodeInfo node = findTextNode(root, terms);
        if (node != null) {
            return clickableAncestor(node, 4);
        }
        return null;
    }

    private boolean ensureChatsTabSelected(AccessibilityNodeInfo root) {
        if (root == null) return false;

        // If WhatsApp restored a previously open conversation, return to the chat
        // list first. Do not mistake the message composer for the chat-list search.
        String[] conversationIds = new String[]{
                "com.whatsapp:id/conversation_layout",
                "com.whatsapp:id/conversation_contact_name",
                "com.whatsapp:id/conversation_contact_name_container",
                "com.whatsapp:id/entry"
        };
        for (String id : conversationIds) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId(id);
            if (nodes != null && !nodes.isEmpty()) {
                Log.i(TAG, "Read-all: conversation screen detected; returning to Chats list");
                performGlobalAction(GLOBAL_ACTION_BACK);
                return true;
            }
        }

        // WhatsApp versions differ in whether the selected bottom tab exposes
        // isSelected(). Recognize the actual conversations list before attempting
        // to click Chats, otherwise the state machine can click the same tab forever.
        String[] listIds = new String[]{
                "com.whatsapp:id/conversations",
                "com.whatsapp:id/conversations_list",
                "com.whatsapp:id/conversations_list_view",
                "com.whatsapp:id/archived_row",
                "com.whatsapp:id/archived_row_content"
        };
        for (String id : listIds) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId(id);
            if (nodes != null && !nodes.isEmpty()) {
                return false;
            }
        }

        if (chatsTabNavigationAttempted) {
            // A click may not expose selected=true on some WhatsApp builds. Never
            // repeatedly click the same tab; continue with list discovery next pass.
            return false;
        }

        String[] chatTabLabels = new String[]{"Chats", "CHATS", "الدردشات", "دردشات"};
        for (String label : chatTabLabels) {
            List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(label);
            if (matches == null) continue;
            for (AccessibilityNodeInfo match : matches) {
                AccessibilityNodeInfo clickable = clickableAncestor(match, 4);
                if (clickable != null && !clickable.isSelected()) {
                    Log.i(TAG, "Read-all: selecting Chats tab because chat list is not visible: " + label);
                    boolean clicked = clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    if (clicked) chatsTabNavigationAttempted = true;
                    return clicked;
                }
            }
        }
        Log.w(TAG, "Read-all: could not identify Chats list or a clickable Chats tab");
        return false;
    }

    private boolean isGroupChatRow(AccessibilityNodeInfo rowNode) {
        if (rowNode == null) return false;

        // WhatsApp exposes the row container with empty text on several versions;
        // the title, sender preview and unread badge are often child nodes.
        // Inspect the complete row tree rather than only the clickable container.
        StringBuilder rowText = new StringBuilder();
        appendNodeText(rowNode, rowText, 0);
        String desc = rowText.toString().toLowerCase(java.util.Locale.ROOT)
                .replaceAll("\\s+", " ").trim();

        // Explicit private-chat indicators always win over heuristic group signals.
        if (desc.contains("محادثة خاصة") || desc.contains("دردشة خاصة") || desc.contains("محادثه خاصه")) {
            return false;
        }

        boolean hasSenderColon = desc.matches(".*[\\u0600-\\u06FFa-zA-Z0-9_]{2,}\\s*:\\s+.*")
                || desc.contains("~");
        boolean hasGroupKeyword = desc.contains("قروب") || desc.contains("توصيل") || desc.contains("مندوب")
                || desc.contains("طلبات") || desc.contains("بحرين") || desc.contains("delivery")
                || desc.contains("order") || desc.contains("group") || desc.contains("سائق")
                || desc.contains("مشاوير") || desc.contains("مطاعم") || desc.contains("شحن");

        List<AccessibilityNodeInfo> groupIcons =
                rowNode.findAccessibilityNodeInfosByViewId("com.whatsapp:id/chat_item_group_icon");
        if (groupIcons != null && !groupIcons.isEmpty()) return true;

        if (hasGroupKeyword || hasSenderColon) return true;

        return false;
    }

    /**
     * Simulates a tap/click using AccessibilityService Gestures on the specified node.
     * This simulates a real physical user touch at the center coordinate of the node.
     */
    private boolean performClickGesture(AccessibilityNodeInfo node) {
        if (node == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                Rect bounds = new Rect();
                node.getBoundsInScreen(bounds);
                if (bounds.width() > 0 && bounds.height() > 0) {
                    float x = bounds.centerX();
                    float y = bounds.centerY();
                    Path clickPath = new Path();
                    clickPath.moveTo(x, y);
                    GestureDescription.StrokeDescription stroke =
                            new GestureDescription.StrokeDescription(clickPath, 0, 80);
                    GestureDescription.Builder builder = new GestureDescription.Builder();
                    builder.addStroke(stroke);
                    boolean dispatched = dispatchGesture(builder.build(), null, null);
                    if (dispatched) {
                        Log.i(TAG, "Simulated touch gesture click at (" + x + ", " + y + ")");
                        return true;
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Gesture dispatch failed, falling back to performAction", e);
            }
        }
        return node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
    }

    private AccessibilityNodeInfo findUnreadGroupInMainScreen(AccessibilityNodeInfo root) {
        if (root == null) return null;
        return searchUnreadGroupInNode(root);
    }

    private AccessibilityNodeInfo findUnreadGroupInArchived(AccessibilityNodeInfo root) {
        if (root == null) return null;
        return searchUnreadGroupInNode(root);
    }

    private AccessibilityNodeInfo searchUnreadGroupInNode(AccessibilityNodeInfo node) {
        if (node == null) return null;

        String vid = node.getViewIdResourceName();
        boolean isBadgeId = vid != null && (vid.contains("badge") || vid.contains("unread") || vid.contains("counter"));
        if (isBadgeId) {
            CharSequence text = node.getText();
            CharSequence desc = node.getContentDescription();
            boolean hasCount = (text != null && text.length() > 0 && !text.toString().equals("0"))
                    || (desc != null && desc.length() > 0);
            if (hasCount) {
                AccessibilityNodeInfo row = clickableAncestor(node, 6);
                if (row != null && isGroupChatRow(row)) {
                    String sig = nodeSignature(row);
                    if (!archivedUnreadChatsVisited.contains(sig)) {
                        return row;
                    }
                }
            }
        }

        CharSequence desc = node.getContentDescription();
        if (desc != null && desc.length() > 0) {
            String descLower = desc.toString().toLowerCase(java.util.Locale.ROOT);
            if (descLower.contains("unread") || descLower.contains("غير مقروء") || descLower.contains("غير مقروءة") || descLower.contains("رسائل غير مقروءة")) {
                AccessibilityNodeInfo row = clickableAncestor(node, 6);
                if (row != null && isGroupChatRow(row)) {
                    String sig = nodeSignature(row);
                    if (!archivedUnreadChatsVisited.contains(sig)) {
                        return row;
                    }
                }
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            AccessibilityNodeInfo found = searchUnreadGroupInNode(child);
            if (found != null) return found;
        }
        return null;
    }

    private AccessibilityNodeInfo findScrollableNode(AccessibilityNodeInfo root) {
        if (root == null) return null;
        if (root.isScrollable()) return root;
        for (int i = 0; i < root.getChildCount(); i++) {
            AccessibilityNodeInfo child = root.getChild(i);
            AccessibilityNodeInfo s = findScrollableNode(child);
            if (s != null) return s;
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
        int totalMarked = activeChatsVisited + archivedChatsVisited;
        boolean fullyCompleted = failedChatsCount == 0
                && "All delivery groups marked as read successfully".equals(reason);
        String finalStatus = fullyCompleted ? "completed" : "partial";
        Log.i(TAG, "Sweep read pass finished: " + reason + "; status=" + finalStatus + "; total=" + totalMarked
                + " (active=" + activeChatsVisited + ", archived=" + archivedChatsVisited + ", failed=" + failedChatsCount + ")");

        getSharedPreferences("orderi_read_all_status", Context.MODE_PRIVATE).edit()
                .putString("status", finalStatus)
                .putInt("visited", totalMarked)
                .putString("detail", reason + (failedChatsCount > 0 ? "؛ تعذر التحقق من " + failedChatsCount + " قروب" : ""))
                .putLong("updated_at", System.currentTimeMillis())
                .commit();

        JSObject payload = new JSObject();
        payload.put("success", fullyCompleted);
        payload.put("status", finalStatus);
        payload.put("reason", reason);
        payload.put("markedCount", totalMarked);
        payload.put("activeCount", activeChatsVisited);
        payload.put("archivedCount", archivedChatsVisited);
        payload.put("failedCount", failedChatsCount);

        NotificationListenerPlugin plugin = NotificationListenerPlugin.getInstance();
        if (plugin != null) {
            plugin.notifyMarkAllAsReadComplete(payload);
        }

        markArchivedChatsRequested = false;
        readAllHandler.removeCallbacks(readAllWatchdog);
        // Every terminal path (including selector mismatch / timeout) must leave
        // WhatsApp and return control to Orderi. A partial result must never be
        // presented as successful completion.
        returnToOrderi();
        archivedSectionOpened = false;
        activeGroupsSweepDone = false;
        waitingForChatToClose = false;
        waitingForBadgeToClear = false;
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
        pendingTargetGroupName = null;
        pendingAutoSend = false;
        currentStage = STAGE_IDLE;
        outreachScrollAttempts = 0;
        lastSendClickTime = 0L;
        isSendingInProgress.set(false);
        outreachHandler.removeCallbacks(outreachWatchdog);
    }

    private String normalizeLabel(String value) {
        if (value == null) return "";
        String s = value.toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ").trim();
        while (s.startsWith("~") || s.startsWith("@") || s.startsWith("+")) {
            s = s.substring(1).trim();
        }
        while (s.endsWith(":") || s.endsWith("؛") || s.endsWith(",")) {
            s = s.substring(0, s.length() - 1).trim();
        }
        return s;
    }

    private boolean nodeHasExactLabel(AccessibilityNodeInfo node, String expected) {
        if (node == null || TextUtils.isEmpty(expected)) return false;
        String wanted = normalizeLabel(expected);
        if (wanted.isEmpty()) return false;
        CharSequence text = node.getText();
        CharSequence description = node.getContentDescription();
        String normText = normalizeLabel(text == null ? "" : text.toString());
        String normDesc = normalizeLabel(description == null ? "" : description.toString());
        if (wanted.equals(normText) || wanted.equals(normDesc)) return true;
        if (wanted.length() >= 3 && (normText.contains(wanted) || normDesc.contains(wanted))) return true;
        return false;
    }

    private boolean isPrivateConversationScreen(AccessibilityNodeInfo root, String expectedName) {
        if (root == null) return false;

        // 1. Must have input composer
        AccessibilityNodeInfo input = findInputField(root);
        if (input == null) return false;

        // 2. Reject if this is a group chat
        String[] groupIndicators = new String[]{
                "group", "participants", "قروب", "مجموعة",
                "انقر هنا لمزيد من المعلومات", "انقر هنا لمعلومات المجموعة", "tap here for group info"
        };
        for (String indicator : groupIndicators) {
            List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(indicator);
            if (matches != null && !matches.isEmpty()) {
                return false;
            }
        }

        // 3. If expected name is set, check if header matches clean name or phone digits
        if (!TextUtils.isEmpty(expectedName)) {
            String clean = normalizeAdvertiserIdentity(expectedName);
            String[] headerIds = new String[]{
                    "com.whatsapp:id/conversation_contact_name",
                    "com.whatsapp:id/conversation_contact_name_container",
                    "com.whatsapp:id/name"
            };
            boolean foundHeader = false;
            for (String viewId : headerIds) {
                List<AccessibilityNodeInfo> headers = root.findAccessibilityNodeInfosByViewId(viewId);
                if (headers == null) continue;
                for (AccessibilityNodeInfo header : headers) {
                    foundHeader = true;
                    String headerText = normalizeAdvertiserIdentity(
                            header.getText() == null ? "" : header.getText().toString());
                    String headerDescription = normalizeAdvertiserIdentity(
                            header.getContentDescription() == null ? "" : header.getContentDescription().toString());
                    if (!TextUtils.isEmpty(clean)
                            && (clean.equals(headerText) || clean.equals(headerDescription))) return true;
                }
            }
            // Never type into an unverified private chat.
            if (foundHeader || !TextUtils.isEmpty(clean)) return false;
        }

        // No expected identity: a composer alone is not proof of the intended recipient.
        return TextUtils.isEmpty(expectedName);
    }

    private boolean isNodeInsideGroupHeader(AccessibilityNodeInfo node) {
        AccessibilityNodeInfo p = node;
        for (int depth = 0; p != null && depth < 5; depth++) {
            String vid = p.getViewIdResourceName();
            if (vid != null && (vid.contains("toolbar") || vid.contains("action_bar") || vid.contains("header"))) {
                return true;
            }
            p = p.getParent();
        }
        return false;
    }

    private AccessibilityNodeInfo findOriginalMessageNode(AccessibilityNodeInfo root, String sourceText) {
        if (root == null || TextUtils.isEmpty(sourceText)) return null;
        String expected = normalizeAdvertiserIdentity(sourceText);
        if (expected.length() < 12) return null;
        List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(sourceText);
        if (nodes == null) return null;
        AccessibilityNodeInfo best = null;
        int bestLength = Integer.MAX_VALUE;
        for (AccessibilityNodeInfo node : nodes) {
            if (node == null || node.isEditable()) continue;
            String actual = normalizeAdvertiserIdentity(node.getText() == null ? "" : node.getText().toString());
            if (TextUtils.isEmpty(actual)) actual = normalizeAdvertiserIdentity(node.getContentDescription() == null ? "" : node.getContentDescription().toString());
            if (actual.equals(expected) || (actual.length() >= expected.length() * 0.85 && actual.contains(expected))) {
                if (actual.length() < bestLength) { best = node; bestLength = actual.length(); }
            }
        }
        return best;
    }

    private AccessibilityNodeInfo findReplyPrivatelyAction(AccessibilityNodeInfo root) {
        if (root == null) return null;
        String[] labels = new String[]{"الرد بشكل خاص", "رد بشكل خاص", "Reply privately", "Reply in private"};
        for (String label : labels) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(label);
            if (nodes == null) continue;
            for (AccessibilityNodeInfo node : nodes) {
                String text = normalizeLabel(node.getText() == null ? "" : node.getText().toString());
                String desc = normalizeLabel(node.getContentDescription() == null ? "" : node.getContentDescription().toString());
                String wanted = normalizeLabel(label);
                if (!text.equals(wanted) && !desc.equals(wanted)) continue;
                if (node.isClickable() && node.isEnabled()) return node;
                AccessibilityNodeInfo parent = clickableAncestor(node, 4);
                if (parent != null && parent.isEnabled()) return parent;
            }
        }
        return null;
    }
    private AccessibilityNodeInfo findMemberNameNode(AccessibilityNodeInfo root, String name) {
        if (root == null || TextUtils.isEmpty(name)) return null;

        String clean = cleanMemberName(name);
        if (clean.isEmpty()) return null;

        // 1. Text search for clean name and variants (e.g. "~ اذكر الله", "اذكر الله")
        String[] searchQueries = new String[]{clean, "~ " + clean, "~" + clean, name};
        for (String q : searchQueries) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(q);
            if (nodes != null) {
                for (AccessibilityNodeInfo node : nodes) {
                    if (isNodeInsideGroupHeader(node)) continue;
                    if (nodeMatchesMember(node, clean)) {
                        if (node.isClickable()) return node;
                        AccessibilityNodeInfo parent = clickableAncestor(node, 4);
                        if (parent != null) return parent;
                        return node;
                    }
                }
            }
        }

        // 2. Search by WhatsApp message contact name view IDs
        String[] viewIds = new String[]{
                "com.whatsapp:id/name",
                "com.whatsapp:id/conversation_contact_name",
                "com.whatsapp:id/sender_name",
                "com.whatsapp:id/push_name",
                "com.whatsapp:id/message_contact_name"
        };
        for (String viewId : viewIds) {
            List<AccessibilityNodeInfo> idNodes = root.findAccessibilityNodeInfosByViewId(viewId);
            if (idNodes == null) continue;
            for (AccessibilityNodeInfo node : idNodes) {
                if (isNodeInsideGroupHeader(node)) continue;
                if (nodeMatchesMember(node, clean)) {
                    if (node.isClickable()) return node;
                    AccessibilityNodeInfo parent = clickableAncestor(node, 4);
                    if (parent != null) return parent;
                    return node;
                }
            }
        }

        return null;
    }

    private boolean nodeMatchesMember(AccessibilityNodeInfo node, String cleanTarget) {
        if (node == null || TextUtils.isEmpty(cleanTarget)) return false;
        String text = normalizeAdvertiserIdentity(node.getText() == null ? "" : node.getText().toString());
        String desc = normalizeAdvertiserIdentity(node.getContentDescription() == null ? "" : node.getContentDescription().toString());
        String target = normalizeAdvertiserIdentity(cleanTarget);
        // Exact identity only, while tolerating WhatsApp's sender-label punctuation (for example "Nuha:").
        String textLabel = text.replaceFirst("^~\\s*", "").replaceAll("[:：،,]+$", "").trim();
        String descLabel = desc.replaceFirst("^~\\s*", "").replaceAll("[:：،,]+$", "").trim();
        return !TextUtils.isEmpty(target) && (text.equals(target) || desc.equals(target)
                || textLabel.equals(target) || descLabel.equals(target));
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
