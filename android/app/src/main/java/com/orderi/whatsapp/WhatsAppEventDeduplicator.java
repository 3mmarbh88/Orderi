package com.orderi.whatsapp;

import android.text.TextUtils;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;

public class WhatsAppEventDeduplicator {

    private static final int MAX_CACHE_ENTRIES = 1000;
    private final LinkedHashMap<String, Long> seenKeys = new LinkedHashMap<String, Long>(128, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Long> eldest) {
            return size() > MAX_CACHE_ENTRIES;
        }
    };

    public synchronized boolean isDuplicate(String key, long windowMs) {
        if (TextUtils.isEmpty(key)) return false;
        long now = System.currentTimeMillis();
        Long prev = seenKeys.get(key);
        if (prev != null && (now - prev) < windowMs) {
            return true;
        }
        seenKeys.put(key, now);
        return false;
    }

    public static String computeDeduplicationKey(String group, String sender, String text, long timestamp) {
        long timeBucket = timestamp / (60 * 1000L); // 1-minute bucket
        String cleanText = (text != null ? text : "").trim().replaceAll("\\s+", " ");
        String cleanGroup = (group != null ? group : "").trim();
        String cleanSender = (sender != null ? sender : "").trim();
        String raw = cleanGroup + "|" + cleanSender + "|" + cleanText + "|" + timeBucket;
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(raw.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(raw.hashCode());
        }
    }
}
