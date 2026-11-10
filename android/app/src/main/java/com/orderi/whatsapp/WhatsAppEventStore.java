package com.orderi.whatsapp;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Durable event queue shared with the legacy NotificationListener plugin API.
 * Both native listener and Capacitor bridge must use the same preferences so
 * events are never stranded in a second, disconnected queue.
 */
public class WhatsAppEventStore {

    // Keep these names aligned with WhatsAppNotificationListenerService.
    public static final String PREFS_NAME = "orderi_native_notifications";
    public static final String KEY_EVENTS = "events";
    private static final String DEDUP_PREFS = "orderi_native_dedup";
    private static final String KEY_SEEN_IDS = "seen_ids";
    private static final long DEDUP_TTL_MS = 24L * 60L * 60L * 1000L;

    private final SharedPreferences prefs;
    private final SharedPreferences dedupPrefs;

    public WhatsAppEventStore(Context context) {
        Context app = context.getApplicationContext();
        this.prefs = app.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.dedupPrefs = app.getSharedPreferences(DEDUP_PREFS, Context.MODE_PRIVATE);
    }

    public synchronized boolean enqueue(JSONObject event) {
        if (event == null) return false;
        String id = event.optString("id", "");
        if (id.trim().isEmpty()) return false;
        try {
            long now = System.currentTimeMillis();
            JSONObject seen = new JSONObject(dedupPrefs.getString(KEY_SEEN_IDS, "{}"));
            java.util.Iterator<String> keys = seen.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                if (seen.optLong(key, 0L) <= now) keys.remove();
            }
            if (seen.optLong(id, 0L) > now) return false;

            JSONArray array = new JSONArray(prefs.getString(KEY_EVENTS, "[]"));
            for (int i = 0; i < array.length(); i++) {
                JSONObject queued = array.optJSONObject(i);
                if (queued != null && id.equals(queued.optString("id", ""))) return false;
            }

            // Never silently evict unacknowledged messages: a backlog is safer
            // than losing a real order or closure event.
            array.put(event);
            if (!prefs.edit().putString(KEY_EVENTS, array.toString()).commit()) return false;

            seen.put(id, now + DEDUP_TTL_MS);
            dedupPrefs.edit().putString(KEY_SEEN_IDS, seen.toString()).commit();
            return true;
        } catch (Exception error) {
            android.util.Log.e("OrderiWhatsAppEventStore", "Failed to persist WhatsApp event", error);
            return false;
        }
    }

    public synchronized List<JSONObject> getAllPending() {
        List<JSONObject> list = new ArrayList<>();
        try {
            JSONArray array = new JSONArray(prefs.getString(KEY_EVENTS, "[]"));
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.optJSONObject(i);
                if (obj != null) list.add(obj);
            }
        } catch (Exception error) {
            android.util.Log.e("OrderiWhatsAppEventStore", "Could not read pending events", error);
        }
        return list;
    }

    public synchronized int acknowledge(Set<String> acknowledgedIds) {
        if (acknowledgedIds == null || acknowledgedIds.isEmpty()) return 0;
        int count = 0;
        try {
            JSONArray array = new JSONArray(prefs.getString(KEY_EVENTS, "[]"));
            JSONArray remaining = new JSONArray();
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.optJSONObject(i);
                if (obj == null) continue;
                if (acknowledgedIds.contains(obj.optString("id", ""))) count++;
                else remaining.put(obj);
            }
            if (!prefs.edit().putString(KEY_EVENTS, remaining.toString()).commit()) {
                android.util.Log.e("OrderiWhatsAppEventStore", "Could not persist event acknowledgements");
                return 0;
            }
        } catch (Exception error) {
            android.util.Log.e("OrderiWhatsAppEventStore", "Could not acknowledge events", error);
            return 0;
        }
        return count;
    }

    public synchronized int size() {
        try {
            return new JSONArray(prefs.getString(KEY_EVENTS, "[]")).length();
        } catch (Exception error) {
            return 0;
        }
    }
}
