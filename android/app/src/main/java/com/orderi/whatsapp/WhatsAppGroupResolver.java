package com.orderi.whatsapp;

import android.text.TextUtils;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class WhatsAppGroupResolver {

    private static final Pattern SENDER_COLON_PATTERN = Pattern.compile("^([^:\\n]{2,35}):\\s*(.+)$", Pattern.DOTALL);

    public static class ResolvedMessage {
        public final String groupName;
        public final String senderName;
        public final String cleanText;
        public final boolean isGroup;

        public ResolvedMessage(String groupName, String senderName, String cleanText, boolean isGroup) {
            this.groupName = groupName;
            this.senderName = senderName;
            this.cleanText = cleanText;
            this.isGroup = isGroup;
        }
    }

    public static ResolvedMessage resolve(String title, String conversationTitle, String text, boolean isGroupFlag) {
        String cleanTitle = (title != null ? title : "").trim();
        String cleanConvTitle = (conversationTitle != null ? conversationTitle : "").trim();
        String cleanText = (text != null ? text : "").trim();

        String determinedGroup = "";
        String determinedSender = "";
        boolean isGroup = isGroupFlag;

        if (!TextUtils.isEmpty(cleanConvTitle)) {
            determinedGroup = cleanConvTitle;
            isGroup = true;
            determinedSender = cleanTitle;
        } else if (!TextUtils.isEmpty(cleanTitle)) {
            determinedGroup = cleanTitle;
        }

        // Check if text starts with "Sender: Text"
        Matcher matcher = SENDER_COLON_PATTERN.matcher(cleanText);
        if (matcher.matches()) {
            String prefixSender = matcher.group(1).trim();
            String remainingBody = matcher.group(2).trim();
            if (!prefixSender.contains("http") && prefixSender.length() <= 30) {
                if (TextUtils.isEmpty(determinedSender)) {
                    determinedSender = prefixSender;
                }
                cleanText = remainingBody;
                isGroup = true;
            }
        }

        return new ResolvedMessage(determinedGroup, determinedSender, cleanText, isGroup);
    }

    public static boolean isMockGroup(String groupName) {
        if (TextUtils.isEmpty(groupName)) return false;
        String lower = groupName.toLowerCase();
        return lower.contains("mock") || lower.contains("simulat") || lower.contains("تجريبي");
    }
}
