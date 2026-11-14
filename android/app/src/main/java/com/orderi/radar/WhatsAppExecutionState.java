package com.orderi.radar;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WhatsAppExecutionState
 *
 * Canonical 12-state execution lifecycle, unique operation IDs, and
 * in-memory deduplication / concurrency lock for Orderi private WhatsApp outreach.
 * Zero persistent advertiser database is kept across sessions.
 */
public final class WhatsAppExecutionState {

    public enum State {
        PENDING,
        IDENTIFYING_SENDER,
        LOCATING_ORIGINAL_MESSAGE,
        OPENING_PRIVATE_CHAT,
        VERIFYING_RECIPIENT,
        READY_TO_SEND,
        EXECUTING,
        SENT,
        FAILED,
        IDENTITY_NOT_CONFIRMED,
        SEND_RESULT_UNKNOWN,
        NEEDS_USER_INTERACTION
    }

    public static final String PREFS_NAME = "orderi_private_outreach";
    private static final long ACTIVE_LOCK_TTL_MS = 65_000L;

    public static final class ExecutionRecord {
        public final String operationId;
        public final String dedupKey;
        public volatile State state;
        public volatile boolean retryBlocked;
        public volatile boolean sentVerifiedInUi;
        public volatile long updatedAt;
        public volatile String label;

        public ExecutionRecord(String operationId, String dedupKey, State state, String label) {
            this.operationId = operationId;
            this.dedupKey = dedupKey;
            this.state = state;
            this.retryBlocked = (state == State.SEND_RESULT_UNKNOWN);
            this.sentVerifiedInUi = (state == State.SENT);
            this.updatedAt = System.currentTimeMillis();
            this.label = label == null ? "" : label;
        }
    }

    // Strictly in-memory concurrency & SEND_RESULT_UNKNOWN deduplication guard (no persistent advertiser DB)
    private static final ConcurrentHashMap<String, ExecutionRecord> IN_MEMORY_RECORDS = new ConcurrentHashMap<>();

    private WhatsAppExecutionState() {}

    public static String newOperationId() {
        return "op-" + UUID.randomUUID().toString();
    }

    public static String buildDedupKey(String orderId, String originalMessageRef) {
        String safeOrder = orderId == null ? "" : orderId.trim();
        String safeRef = originalMessageRef == null ? "" : originalMessageRef.trim();
        return safeOrder + "|" + safeRef;
    }

    public static boolean isTerminalState(State state) {
        return state == State.SENT
                || state == State.FAILED
                || state == State.IDENTITY_NOT_CONFIRMED
                || state == State.SEND_RESULT_UNKNOWN
                || state == State.NEEDS_USER_INTERACTION;
    }

    public static synchronized ExecutionRecord tryAcquireLock(
            String requestedOperationId,
            String orderId,
            String originalMessageRef) {
        String key = buildDedupKey(orderId, originalMessageRef);
        long now = System.currentTimeMillis();

        ExecutionRecord existing = IN_MEMORY_RECORDS.get(key);
        if (existing != null) {
            if (existing.state == State.SEND_RESULT_UNKNOWN || existing.retryBlocked) {
                return null;
            }
            if (!isTerminalState(existing.state) && (now - existing.updatedAt) < ACTIVE_LOCK_TTL_MS) {
                return null;
            }
        }

        String opId = !TextUtils.isEmpty(requestedOperationId) ? requestedOperationId.trim() : newOperationId();
        ExecutionRecord created = new ExecutionRecord(opId, key, State.PENDING, "تم إنشاء طلب المراسلة الخاصة");
        IN_MEMORY_RECORDS.put(key, created);
        return created;
    }

    public static ExecutionRecord getRecord(String orderId, String originalMessageRef) {
        return IN_MEMORY_RECORDS.get(buildDedupKey(orderId, originalMessageRef));
    }

    public static boolean isRetryBlocked(String orderId, String originalMessageRef) {
        ExecutionRecord rec = IN_MEMORY_RECORDS.get(buildDedupKey(orderId, originalMessageRef));
        return rec != null && (rec.retryBlocked || rec.state == State.SEND_RESULT_UNKNOWN);
    }

    public static void updateState(
            Context context,
            String operationId,
            String dedupKey,
            State state,
            String statusLabel,
            boolean sentVerifiedInUi) {
        if (!TextUtils.isEmpty(dedupKey)) {
            ExecutionRecord existing = IN_MEMORY_RECORDS.get(dedupKey);
            if (existing != null && (TextUtils.isEmpty(operationId) || operationId.equals(existing.operationId))) {
                existing.state = state;
                existing.label = statusLabel == null ? "" : statusLabel;
                existing.updatedAt = System.currentTimeMillis();
                if (state == State.SEND_RESULT_UNKNOWN) {
                    existing.retryBlocked = true;
                }
                if (sentVerifiedInUi) {
                    existing.sentVerifiedInUi = true;
                }
            }
        }

        if (context == null) return;
        String legacyStatus = mapToLegacyStatus(state);
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit();
        editor.putString("operation_id", operationId == null ? "" : operationId);
        editor.putString("execution_state", state.name());
        editor.putString("status", legacyStatus);
        editor.putString("status_label", statusLabel == null ? "" : statusLabel);
        editor.putBoolean("retry_blocked", state == State.SEND_RESULT_UNKNOWN);
        editor.putBoolean("sent_verified_in_ui", sentVerifiedInUi);
        editor.putBoolean("delivery_confirmed", false);
        editor.putLong("updated_at", System.currentTimeMillis());
        editor.apply();
    }

    public static String mapToLegacyStatus(State state) {
        if (state == null) return "FAILED";
        switch (state) {
            case SENT:
                return "MESSAGE_SUBMITTED";
            case IDENTITY_NOT_CONFIRMED:
                return "IDENTITY_NOT_VERIFIED";
            case NEEDS_USER_INTERACTION:
                return "BACKGROUND_SEND_UNAVAILABLE";
            case SEND_RESULT_UNKNOWN:
                return "SEND_RESULT_UNKNOWN";
            case FAILED:
                return "SEND_FAILED";
            default:
                return "sending";
        }
    }
}
