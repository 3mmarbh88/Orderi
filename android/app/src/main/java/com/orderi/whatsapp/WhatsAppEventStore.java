package com.orderi.whatsapp;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class WhatsAppEventStore {

    public static final String PREFS_NAME = "orderi_whatsapp_events_v2";
    public static final String KEY_EVENTS = "unprocessed_events";
    private static final int MAX_QUEUE_LIMIT = 500;

    private final SharedPreferences prefs;

    public WhatsAppEventStore(Context context) {
        this.prefs = context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public synchronized boolean enqueue(JSONObject event) {
        if (event == null) return false;
        try {
            JSONArray array = new JSONArray(prefs.getString(KEY_EVENTS, "[]"));
            String id = event.optString("id");
            // Do not store duplicate event ID
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.optJSONObject(i);
                if (obj != null && id.equals(obj.optString("id"))) {
                    return false;
                }
            }
            array.put(event);
            return prefs.edit().putString(KEY_EVENTS, array.toString()).commit();
        } catch (Exception e) {
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
        } catch (Exception ignored) {}
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
                if (obj != null) {
                    String id = obj.optString("id");
                    if (acknowledgedIds.contains(id)) {
                        count++;
                    } else {
                        remaining.put(obj);
                    }
                }
            }
            prefs.edit().putString(KEY_EVENTS, remaining.toString()).commit();
        } catch (Exception ignored) {}
        return count;
    }

    public synchronized int size() {
        try {
            JSONArray array = new JSONArray(prefs.getString(KEY_EVENTS, "[]"));
            return array.length();
        } catch (Exception e) {
            return 0;
        }
    }
}
