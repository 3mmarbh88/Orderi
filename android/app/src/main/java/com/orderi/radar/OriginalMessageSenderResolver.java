package com.orderi.radar;

import android.graphics.Rect;
import android.view.accessibility.AccessibilityNodeInfo;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * OriginalMessageSenderResolver
 *
 * Resolves the sender of an original WhatsApp group advertisement strictly from the
 * advertisement row itself — supporting ordinary names, nicknames, pure emoji/symbol
 * identities, English labels, and unsaved/unknown labels without creating any persistent
 * advertiser database or guessing phone numbers.
 */
public final class OriginalMessageSenderResolver {

    private static final Pattern BIDI_CONTROLS = Pattern.compile("[\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]");
    private static final Pattern ARABIC_DIACRITICS = Pattern.compile("[\\u064B-\\u065F\\u0670\\u0640]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    public enum MatchStatus {
        RESOLVED,
        NOT_FOUND,
        AMBIGUOUS_MULTIPLE_MATCHES,
        IDENTITY_NOT_CONFIRMED
    }

    public enum RecommendedInteraction {
        CLICK_ROW_SENDER_OR_AVATAR,
        LONG_PRESS_EXACT_MESSAGE_FOR_REPLY_PRIVATELY,
        NONE
    }

    /**
     * Captures the 7 legitimate data points of the original WhatsApp message without
     * fabricating missing JIDs or phone numbers.
     */
    public static final class OriginalAdContext {
        public final String orderId;
        public final String rawText;
        public final String groupName;
        public final String senderDisplayName;
        public final long sourceMessageTimestamp;
        public final String sourceNotificationKey;
        public final String sourceMessageId;
        public final String shortcutId;
        public final String trustedSenderId;     // e.g., Person.getKey() or verified @s.whatsapp.net JID if exposed
        public final String trustedSenderUri;    // e.g., Person.getUri() if exposed
        public final String trustedSenderPhone;  // digits only when legitimately exposed
        public final String originalMessageRef;  // contentHash + timestamp reference

        public OriginalAdContext(
                String orderId,
                String rawText,
                String groupName,
                String senderDisplayName,
                long sourceMessageTimestamp,
                String sourceNotificationKey,
                String sourceMessageId,
                String shortcutId,
                String trustedSenderId,
                String trustedSenderUri,
                String trustedSenderPhone) {
            this.orderId = safeTrim(orderId);
            this.rawText = rawText == null ? "" : rawText.trim();
            this.groupName = safeTrim(groupName);
            this.senderDisplayName = safeTrim(senderDisplayName);
            this.sourceMessageTimestamp = sourceMessageTimestamp;
            this.sourceNotificationKey = safeTrim(sourceNotificationKey);
            this.sourceMessageId = safeTrim(sourceMessageId);
            this.shortcutId = safeTrim(shortcutId);
            this.trustedSenderId = safeTrim(trustedSenderId);
            this.trustedSenderUri = safeTrim(trustedSenderUri);
            this.trustedSenderPhone = safeTrim(trustedSenderPhone);
            this.originalMessageRef = buildMessageReference(this.rawText, sourceMessageTimestamp);
        }
    }

    /**
     * Pure structural representation of a visible message row inside a WhatsApp group chat.
     * Decoupled from Android framework classes so row-binding logic can be unit tested directly.
     */
    public static final class MessageRowDescriptor {
        public final int rowIndex;
        public final String senderHeader;
        public final String messageBody;
        public final String timeLabel;
        public final boolean hasSenderProfileTarget;
        public final boolean isLongClickable;
        public final boolean isOutgoing;
        public final boolean isSystemOrDateDivider;
        public final AccessibilityNodeInfo rowNode;
        public final AccessibilityNodeInfo senderClickNode;
        public final AccessibilityNodeInfo messageBodyNode;

        public MessageRowDescriptor(
                int rowIndex,
                String senderHeader,
                String messageBody,
                String timeLabel,
                boolean hasSenderProfileTarget,
                boolean isLongClickable,
                boolean isOutgoing,
                boolean isSystemOrDateDivider) {
            this(rowIndex, senderHeader, messageBody, timeLabel,
                    hasSenderProfileTarget, isLongClickable, isOutgoing, isSystemOrDateDivider,
                    null, null, null);
        }

        public MessageRowDescriptor(
                int rowIndex,
                String senderHeader,
                String messageBody,
                String timeLabel,
                boolean hasSenderProfileTarget,
                boolean isLongClickable,
                boolean isOutgoing,
                boolean isSystemOrDateDivider,
                AccessibilityNodeInfo rowNode,
                AccessibilityNodeInfo senderClickNode,
                AccessibilityNodeInfo messageBodyNode) {
            this.rowIndex = rowIndex;
            this.senderHeader = safeTrim(senderHeader);
            this.messageBody = messageBody == null ? "" : messageBody.trim();
            this.timeLabel = safeTrim(timeLabel);
            this.hasSenderProfileTarget = hasSenderProfileTarget;
            this.isLongClickable = isLongClickable;
            this.isOutgoing = isOutgoing;
            this.isSystemOrDateDivider = isSystemOrDateDivider;
            this.rowNode = rowNode;
            this.senderClickNode = senderClickNode;
            this.messageBodyNode = messageBodyNode;
        }
    }

    public static final class ResolutionResult {
        public final MatchStatus status;
        public final int matchedRowIndex;
        public final int boundHeaderRowIndex;
        public final String boundSenderLabel;
        public final RecommendedInteraction recommendedInteraction;
        public final String reason;
        public final MessageRowDescriptor matchedRow;
        public final AccessibilityNodeInfo targetSenderNode;
        public final AccessibilityNodeInfo targetMessageNode;

        public ResolutionResult(
                MatchStatus status,
                int matchedRowIndex,
                int boundHeaderRowIndex,
                String boundSenderLabel,
                RecommendedInteraction recommendedInteraction,
                String reason,
                MessageRowDescriptor matchedRow,
                AccessibilityNodeInfo targetSenderNode,
                AccessibilityNodeInfo targetMessageNode) {
            this.status = status;
            this.matchedRowIndex = matchedRowIndex;
            this.boundHeaderRowIndex = boundHeaderRowIndex;
            this.boundSenderLabel = safeTrim(boundSenderLabel);
            this.recommendedInteraction = recommendedInteraction;
            this.reason = safeTrim(reason);
            this.matchedRow = matchedRow;
            this.targetSenderNode = targetSenderNode;
            this.targetMessageNode = targetMessageNode;
        }

        public boolean isResolved() {
            return status == MatchStatus.RESOLVED;
        }
    }

    private OriginalMessageSenderResolver() {}

    public static String buildMessageReference(String rawText, long timestampMs) {
        String normalized = normalizeMessageBody(rawText);
        String digest = sha256Hex(normalized);
        String shortHash = digest.length() > 16 ? digest.substring(0, 16) : digest;
        return shortHash + "@" + Math.max(0L, timestampMs);
    }

    /**
     * Normalizes WhatsApp sender display names while preserving pure emoji/symbol names
     * (e.g. "🚗"), nicknames ("أبو محمد"), English names ("ABC"), and unknown IDs ("مجهول 123").
     */
    public static String normalizeSenderLabel(String raw) {
        if (raw == null) return "";
        String s = BIDI_CONTROLS.matcher(raw).replaceAll("").trim();
        if (s.isEmpty()) return "";
        s = Normalizer.normalize(s, Normalizer.Form.NFKC);
        s = ARABIC_DIACRITICS.matcher(s).replaceAll("");

        // Trim WhatsApp group push-name decorations (~, trailing colons) without stripping emojis!
        while (s.startsWith("~") || s.startsWith("@")) {
            s = s.substring(1).trim();
        }
        while (s.endsWith(":") || s.endsWith("：") || s.endsWith("،") || s.endsWith(",")) {
            s = s.substring(0, s.length() - 1).trim();
        }

        // Normalize common Arabic orthographic variants so display matching stays accurate
        s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
                .replace('ة', 'ه').replace('ى', 'ي');

        return WHITESPACE.matcher(s.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
    }

    public static boolean isGenericPlaceholderSender(String raw) {
        String norm = normalizeSenderLabel(raw);
        if (norm.isEmpty()) return true;
        return norm.equals("صاحب الاعلان")
                || norm.equals("معلن")
                || norm.equals("معلن بالقروب")
                || norm.equals("معلن في القروب")
                || norm.equals("معلن بالقروب المؤرشف")
                || norm.equals("واتساب")
                || norm.equals("whatsapp")
                || norm.equals("whatsapp messenger")
                || norm.equals("عضو")
                || norm.equals("مجهول");
    }

    public static String normalizeMessageBody(String raw) {
        if (raw == null) return "";
        String s = BIDI_CONTROLS.matcher(raw).replaceAll(" ").trim();
        if (s.isEmpty()) return "";
        s = Normalizer.normalize(s, Normalizer.Form.NFKC);
        s = ARABIC_DIACRITICS.matcher(s).replaceAll("");
        s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
                .replace('ة', 'ه').replace('ى', 'ي');
        return WHITESPACE.matcher(s.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
    }

    public static boolean senderLabelsMatch(String a, String b) {
        String na = normalizeSenderLabel(a);
        String nb = normalizeSenderLabel(b);
        if (na.isEmpty() || nb.isEmpty()) return false;
        return na.equals(nb);
    }

    /**
     * Matches two message bodies strictly without rejecting short ads (< 12 chars),
     * while tolerating WhatsApp notification truncation ("...", "…", "قراءة المزيد").
     */
    public static boolean messageBodiesMatch(String candidateRowText, String expectedRawText) {
        String cand = normalizeMessageBody(candidateRowText);
        String expected = normalizeMessageBody(expectedRawText);
        if (cand.isEmpty() || expected.isEmpty()) return false;
        if (cand.equals(expected)) return true;

        // Allow containment only when both sides are sufficiently descriptive to avoid false hits
        if (expected.length() >= 8 && cand.contains(expected)) return true;
        if (cand.length() >= 18 && expected.contains(cand)) return true;

        // Tolerate WhatsApp notification truncation ("..." / "…" / "قراءة المزيد" / "read more")
        String trimmedExpected = expected
                .replaceAll("(?:\\s*(?:\\.\\.\\.|…|قراءة المزيد|read more))+$", "")
                .trim();
        if (trimmedExpected.length() >= 12 && (cand.startsWith(trimmedExpected) || cand.contains(trimmedExpected))) {
            return true;
        }
        return false;
    }

    /**
     * Resolves the single original message row and its bound sender from visible group rows.
     * Rules:
     * 1. Never blindly pick the last message in the group.
     * 2. Never search member directories or match partial/similar names across unrelated rows.
     * 3. If WhatsApp omits the sender header on consecutive bubbles from the same sender,
     *    bind upward only within the contiguous incoming sender block.
     * 4. Reject ambiguous multi-row hits unless time disambiguates exactly one row.
     */
    public static ResolutionResult resolveOriginalMessageRow(
            List<MessageRowDescriptor> rows,
            OriginalAdContext adContext) {
        if (adContext == null || normalizeMessageBody(adContext.rawText).isEmpty()) {
            return new ResolutionResult(
                    MatchStatus.IDENTITY_NOT_CONFIRMED, -1, -1, "",
                    RecommendedInteraction.NONE,
                    "نص الإعلان الأصلي فارغ؛ لا يمكن تحديد الرسالة الأصلية.",
                    null, null, null);
        }
        if (rows == null || rows.isEmpty()) {
            return new ResolutionResult(
                    MatchStatus.NOT_FOUND, -1, -1, "",
                    RecommendedInteraction.NONE,
                    "لا توجد رسائل مرئية في شاشة المجموعة.",
                    null, null, null);
        }

        final String expectedSender = adContext.senderDisplayName;
        final boolean hasSpecificExpectedSender = !isGenericPlaceholderSender(expectedSender);

        class Candidate {
            final MessageRowDescriptor row;
            final String boundSender;
            final int headerRowIndex;
            final AccessibilityNodeInfo targetSenderNode;
            final boolean hasProfileTarget;

            Candidate(
                    MessageRowDescriptor row,
                    String boundSender,
                    int headerRowIndex,
                    AccessibilityNodeInfo targetSenderNode,
                    boolean hasProfileTarget) {
                this.row = row;
                this.boundSender = boundSender;
                this.headerRowIndex = headerRowIndex;
                this.targetSenderNode = targetSenderNode;
                this.hasProfileTarget = hasProfileTarget;
            }
        }

        List<Candidate> textAndSenderMatches = new ArrayList<>();
        boolean sawTextMatchWithDifferentSender = false;

        for (int i = 0; i < rows.size(); i++) {
            MessageRowDescriptor row = rows.get(i);
            if (row == null || row.isSystemOrDateDivider || row.isOutgoing) continue;
            if (!messageBodiesMatch(row.messageBody, adContext.rawText)) continue;

            // Bind sender strictly within this row or contiguous preceding stacked message block
            String boundSender = row.senderHeader;
            int headerRowIdx = i;
            AccessibilityNodeInfo senderNode = row.senderClickNode;
            boolean hasProfile = row.hasSenderProfileTarget;

            if (boundSender.isEmpty()) {
                for (int prev = i - 1; prev >= 0; prev--) {
                    MessageRowDescriptor prevRow = rows.get(prev);
                    if (prevRow == null || prevRow.isSystemOrDateDivider || prevRow.isOutgoing) {
                        // A divider or outgoing message breaks a stacked incoming sender block
                        break;
                    }
                    if (!prevRow.senderHeader.isEmpty()) {
                        boundSender = prevRow.senderHeader;
                        headerRowIdx = prev;
                        if (senderNode == null) senderNode = prevRow.senderClickNode;
                        if (!hasProfile) hasProfile = prevRow.hasSenderProfileTarget;
                        break;
                    }
                }
            }

            if (hasSpecificExpectedSender) {
                if (boundSender.isEmpty()) {
                    // Without a header on this row or its contiguous block, cannot safely confirm sender
                    sawTextMatchWithDifferentSender = true;
                    continue;
                }
                if (!senderLabelsMatch(boundSender, expectedSender)) {
                    sawTextMatchWithDifferentSender = true;
                    continue;
                }
            } else if (boundSender.isEmpty()) {
                sawTextMatchWithDifferentSender = true;
                continue;
            }

            textAndSenderMatches.add(new Candidate(row, boundSender, headerRowIdx, senderNode, hasProfile));
        }

        if (textAndSenderMatches.isEmpty()) {
            if (sawTextMatchWithDifferentSender) {
                return new ResolutionResult(
                        MatchStatus.IDENTITY_NOT_CONFIRMED, -1, -1, "",
                        RecommendedInteraction.NONE,
                        "وُجد نص مشابه لكن مرسله داخل المجموعة لا يطابق صاحب الإعلان الأصلي.",
                        null, null, null);
            }
            return new ResolutionResult(
                    MatchStatus.NOT_FOUND, -1, -1, "",
                    RecommendedInteraction.NONE,
                    "لم يتم العثور على رسالة الإعلان الأصلية في الجزء الظاهر من المجموعة (قد تكون محذوفة أو تتطلب التمرير للأعلى).",
                    null, null, null);
        }

        Candidate selected = null;
        if (textAndSenderMatches.size() == 1) {
            selected = textAndSenderMatches.get(0);
        } else {
            // Try timestamp disambiguation if multiple identical ads from the same sender are visible
            List<Candidate> timeMatched = filterByExpectedTimestamp(textAndSenderMatches, adContext.sourceMessageTimestamp);
            if (timeMatched.size() == 1) {
                selected = timeMatched.get(0);
            } else {
                return new ResolutionResult(
                        MatchStatus.AMBIGUOUS_MULTIPLE_MATCHES,
                        -1,
                        -1,
                        "",
                        RecommendedInteraction.NONE,
                        "تطابق أكثر من صف إعلان لنفس النص/المرسل دون إمكانية الجزم بالرسالة الفريدة؛ توقف الإجراء حفاظاً على الدقة.",
                        null,
                        null,
                        null);
            }
        }

        RecommendedInteraction interaction;
        if (selected.hasProfileTarget || selected.targetSenderNode != null) {
            interaction = RecommendedInteraction.CLICK_ROW_SENDER_OR_AVATAR;
        } else if (selected.row.isLongClickable) {
            interaction = RecommendedInteraction.LONG_PRESS_EXACT_MESSAGE_FOR_REPLY_PRIVATELY;
        } else {
            return new ResolutionResult(
                    MatchStatus.IDENTITY_NOT_CONFIRMED,
                    selected.row.rowIndex,
                    selected.headerRowIndex,
                    selected.boundSender,
                    RecommendedInteraction.NONE,
                    "تمت مطابقة الرسالة لكنها لا تحتوي على هدف قابل للنقر لملف المرسل أو الرد الخاص.",
                    selected.row,
                    selected.targetSenderNode,
                    selected.row.messageBodyNode);
        }

        return new ResolutionResult(
                MatchStatus.RESOLVED,
                selected.row.rowIndex,
                selected.headerRowIndex,
                selected.boundSender,
                interaction,
                "تم تحديد صف الرسالة الأصلية وربطها بصاحبها «" + selected.boundSender + "».",
                selected.row,
                selected.targetSenderNode,
                selected.row.messageBodyNode);
    }

    private static <T> List<T> filterByExpectedTimestamp(List<T> candidates, long timestampMs) {
        if (timestampMs <= 0L) return Collections.emptyList();
        // Format candidate 24h & 12h HH:mm representations to compare against WhatsApp row time labels
        Date date = new Date(timestampMs);
        String hhmm24 = new SimpleDateFormat("HH:mm", Locale.US).format(date);
        String hhmm12 = new SimpleDateFormat("h:mm", Locale.US).format(date);
        List<T> out = new ArrayList<>();
        for (T obj : candidates) {
            try {
                java.lang.reflect.Field rowField = obj.getClass().getDeclaredField("row");
                rowField.setAccessible(true);
                MessageRowDescriptor row = (MessageRowDescriptor) rowField.get(obj);
                if (row == null || row.timeLabel.isEmpty()) continue;
                String normalizedTime = normalizeDigits(row.timeLabel);
                if (normalizedTime.contains(hhmm24) || normalizedTime.contains(hhmm12)) {
                    out.add(obj);
                }
            } catch (Exception ignored) {}
        }
        return out;
    }

    /**
     * Live Android Accessibility tree extraction from the active WhatsApp group conversation.
     * Extracts individual message rows inside the chat RecyclerView/ListView rather than searching
     * the whole screen blindly.
     */
    public static List<MessageRowDescriptor> extractGroupMessageRows(AccessibilityNodeInfo root) {
        List<MessageRowDescriptor> rows = new ArrayList<>();
        if (root == null) return rows;

        AccessibilityNodeInfo listNode = findConversationListNode(root);
        if (listNode == null) return rows;

        int childCount = listNode.getChildCount();
        for (int i = 0; i < childCount; i++) {
            AccessibilityNodeInfo rowNode = listNode.getChild(i);
            if (rowNode == null) continue;

            if (isSystemOrDividerRow(rowNode)) {
                rows.add(new MessageRowDescriptor(
                        i, "", describeText(rowNode), "", false, false, false, true, rowNode, null, null));
                continue;
            }

            AccessibilityNodeInfo bodyNode = findFirstByViewIds(rowNode, new String[]{
                    "com.whatsapp:id/message_text",
                    "com.whatsapp:id/caption"
            });
            String bodyText = bodyNode != null ? describeText(bodyNode) : "";

            AccessibilityNodeInfo senderNode = findFirstByViewIds(rowNode, new String[]{
                    "com.whatsapp:id/name_in_group",
                    "com.whatsapp:id/push_name",
                    "com.whatsapp:id/message_contact_name",
                    "com.whatsapp:id/name",
                    "com.whatsapp:id/contact_photo"
            });
            String senderText = "";
            if (senderNode != null) {
                senderText = describeText(senderNode);
            }
            // Fallback: if contact_photo was matched without text, check name_in_group separately
            if (senderText.isEmpty()) {
                AccessibilityNodeInfo nameNode = findFirstByViewIds(rowNode, new String[]{
                        "com.whatsapp:id/name_in_group",
                        "com.whatsapp:id/push_name",
                        "com.whatsapp:id/message_contact_name",
                        "com.whatsapp:id/name"
                });
                if (nameNode != null) {
                    senderText = describeText(nameNode);
                    if (senderNode == null) senderNode = nameNode;
                }
            }

            AccessibilityNodeInfo dateNode = findFirstByViewIds(rowNode, new String[]{
                    "com.whatsapp:id/date"
            });
            String timeLabel = dateNode != null ? describeText(dateNode) : "";

            // Strict single-row fallback when WhatsApp renders message/sender without legacy ViewIds
            if (bodyText.isEmpty()) {
                List<AccessibilityNodeInfo> rowTextNodes = new ArrayList<>();
                collectTextLeafNodes(rowNode, rowTextNodes, 0, 6);
                String bestBody = "";
                AccessibilityNodeInfo bestBodyNode = null;
                for (AccessibilityNodeInfo leaf : rowTextNodes) {
                    String vid = leaf.getViewIdResourceName();
                    if (vid != null && (vid.endsWith(":id/date") || vid.endsWith(":id/status")
                            || vid.endsWith(":id/name_in_group") || vid.endsWith(":id/push_name")
                            || vid.endsWith(":id/quoted_title") || vid.endsWith(":id/quoted_text"))) {
                        continue;
                    }
                    String t = describeText(leaf);
                    if (t.isEmpty() || (!timeLabel.isEmpty() && t.equals(timeLabel))) continue;
                    if (!senderText.isEmpty() && t.equals(senderText)) continue;
                    if (t.matches("^\\d{1,2}:\\d{2}(\\s?[APap][Mm]|\\s?[صم])?$")) {
                        if (timeLabel.isEmpty()) timeLabel = t;
                        continue;
                    }
                    if (t.length() > bestBody.length()) {
                        bestBody = t;
                        bestBodyNode = leaf;
                    }
                }
                if (!bestBody.isEmpty()) {
                    bodyText = bestBody;
                    bodyNode = bestBodyNode;
                }
            }

            // Outgoing messages usually carry a delivery-status icon (single/double ticks)
            boolean isOutgoing = findFirstByViewIds(rowNode, new String[]{"com.whatsapp:id/status"}) != null;

            AccessibilityNodeInfo clickableSender = findClickableSelfOrAncestor(senderNode, 3);
            boolean hasProfileTarget = clickableSender != null;
            boolean longClickable = rowNode.isLongClickable()
                    || (bodyNode != null && bodyNode.isLongClickable())
                    || (findLongClickableAncestor(bodyNode, 4) != null);

            rows.add(new MessageRowDescriptor(
                    i,
                    senderText,
                    bodyText,
                    timeLabel,
                    hasProfileTarget,
                    longClickable,
                    isOutgoing,
                    false,
                    rowNode,
                    clickableSender != null ? clickableSender : senderNode,
                    bodyNode));
        }
        return rows;
    }

    private static void collectTextLeafNodes(
            AccessibilityNodeInfo node,
            List<AccessibilityNodeInfo> out,
            int depth,
            int maxDepth) {
        if (node == null || depth > maxDepth) return;
        CharSequence cls = node.getClassName();
        if (cls != null && cls.toString().contains("TextView")) {
            out.add(node);
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            collectTextLeafNodes(node.getChild(i), out, depth + 1, maxDepth);
        }
    }

    /**
     * Safe Phase-2 Dry-Run verification on a live WhatsApp group chat screen:
     * Identifies the exact ad row and its sender target WITHOUT clicking send or modifying WhatsApp state.
     */
    public static ResolutionResult performDryRunLocate(AccessibilityNodeInfo root, OriginalAdContext adContext) {
        List<MessageRowDescriptor> rows = extractGroupMessageRows(root);
        return resolveOriginalMessageRow(rows, adContext);
    }

    private static AccessibilityNodeInfo findConversationListNode(AccessibilityNodeInfo root) {
        if (root == null) return null;
        String[] listIds = new String[]{
                "android:id/list",
                "com.whatsapp:id/list",
                "com.whatsapp:id/conversation_recyclerview"
        };
        for (String id : listIds) {
            List<AccessibilityNodeInfo> found = root.findAccessibilityNodeInfosByViewId(id);
            if (found != null) {
                for (AccessibilityNodeInfo node : found) {
                    if (node != null && node.getChildCount() > 0) return node;
                }
            }
        }
        return findFirstScrollableList(root, 0);
    }

    private static AccessibilityNodeInfo findFirstScrollableList(AccessibilityNodeInfo node, int depth) {
        if (node == null || depth > 8) return null;
        CharSequence cls = node.getClassName();
        if (cls != null) {
            String name = cls.toString();
            if ((name.contains("RecyclerView") || name.contains("ListView")) && node.getChildCount() > 0) {
                return node;
            }
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo match = findFirstScrollableList(node.getChild(i), depth + 1);
            if (match != null) return match;
        }
        return null;
    }

    private static boolean isSystemOrDividerRow(AccessibilityNodeInfo rowNode) {
        if (rowNode == null) return true;
        AccessibilityNodeInfo divider = findFirstByViewIds(rowNode, new String[]{
                "com.whatsapp:id/conversation_row_date_divider",
                "com.whatsapp:id/info",
                "com.whatsapp:id/unread_divider"
        });
        if (divider != null) return true;
        AccessibilityNodeInfo msg = findFirstByViewIds(rowNode, new String[]{
                "com.whatsapp:id/message_text",
                "com.whatsapp:id/caption"
        });
        if (msg != null) return false;
        List<AccessibilityNodeInfo> leaves = new ArrayList<>();
        collectTextLeafNodes(rowNode, leaves, 0, 5);
        return leaves.size() <= 1 && rowNode.getChildCount() <= 2;
    }

    private static AccessibilityNodeInfo findFirstByViewIds(AccessibilityNodeInfo root, String[] ids) {
        if (root == null || ids == null) return null;
        for (String id : ids) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId(id);
            if (nodes != null && !nodes.isEmpty()) {
                return nodes.get(0);
            }
        }
        return null;
    }

    private static AccessibilityNodeInfo findClickableSelfOrAncestor(AccessibilityNodeInfo node, int maxDepth) {
        AccessibilityNodeInfo cur = node;
        for (int d = 0; cur != null && d <= maxDepth; d++) {
            if (cur.isClickable() && cur.isEnabled()) return cur;
            cur = cur.getParent();
        }
        return null;
    }

    private static AccessibilityNodeInfo findLongClickableAncestor(AccessibilityNodeInfo node, int maxDepth) {
        AccessibilityNodeInfo cur = node;
        for (int d = 0; cur != null && d <= maxDepth; d++) {
            if (cur.isLongClickable() && cur.isEnabled()) return cur;
            cur = cur.getParent();
        }
        return null;
    }

    private static String describeText(AccessibilityNodeInfo node) {
        if (node == null) return "";
        CharSequence t = node.getText();
        if (t != null && t.length() > 0) return t.toString().trim();
        CharSequence d = node.getContentDescription();
        return d != null ? d.toString().trim() : "";
    }

    private static String normalizeDigits(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char ch = input.charAt(i);
            if (ch >= '\u0660' && ch <= '\u0669') {
                sb.append((char) ('0' + (ch - '\u0660')));
            } else if (ch >= '\u06F0' && ch <= '\u06F9') {
                sb.append((char) ('0' + (ch - '\u06F0')));
            } else {
                sb.append(ch);
            }
        }
        return sb.toString();
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest((value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            return Integer.toHexString(value == null ? 0 : value.hashCode());
        }
    }

    private static String safeTrim(String s) {
        return s == null ? "" : s.trim();
    }
}
