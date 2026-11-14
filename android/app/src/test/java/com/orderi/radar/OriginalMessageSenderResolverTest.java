package com.orderi.radar;

import com.orderi.radar.OriginalMessageSenderResolver.MatchStatus;
import com.orderi.radar.OriginalMessageSenderResolver.MessageRowDescriptor;
import com.orderi.radar.OriginalMessageSenderResolver.OriginalAdContext;
import com.orderi.radar.OriginalMessageSenderResolver.RecommendedInteraction;
import com.orderi.radar.OriginalMessageSenderResolver.ResolutionResult;

import org.junit.Test;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;

import static org.junit.Assert.*;

public class OriginalMessageSenderResolverTest {

    private static OriginalAdContext ad(String id, String sender, String text, long ts) {
        return new OriginalAdContext(
                id,
                text,
                "قروب توصيل البحرين",
                sender,
                ts,
                "notif-key-" + id,
                "msg-id-" + id,
                "shortcut-" + id,
                "",
                "",
                ""
        );
    }

    @Test
    public void locatesAllRequestedIdentityTypesInsideMultiAdvertiserGroup() {
        List<MessageRowDescriptor> rows = Arrays.asList(
                new MessageRowDescriptor(0, "~ أحمد", "توصيل من السيف إلى المحرق 2 دينار", "10:12", true, true, false, false),
                new MessageRowDescriptor(1, "~ أبو محمد", "توصيل من الرفاع إلى المنامة 2.5 دينار", "10:14", true, true, false, false),
                new MessageRowDescriptor(2, "~ 🚗", "توصيل من سار إلى العدلية 3 دينار", "10:15", true, true, false, false),
                new MessageRowDescriptor(3, "~ ABC", "توصيل من الحد إلى جزر أمواج 1.5 دينار", "10:16", true, true, false, false),
                new MessageRowDescriptor(4, "~ مجهول 123", "توصيل من عراد إلى توبلي 2 دينار", "10:18", true, true, false, false),
                new MessageRowDescriptor(5, "~ اسم مستعار", "توصيل من البديع إلى مدينة حمد 2 دينار", "10:20", true, true, false, false)
        );

        ResolutionResult r1 = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("1", "أحمد", "توصيل من السيف إلى المحرق 2 دينار", 1000L));
        assertTrue(r1.isResolved());
        assertEquals(0, r1.matchedRowIndex);
        assertEquals("~ أحمد", r1.boundSenderLabel);
        assertEquals(RecommendedInteraction.CLICK_ROW_SENDER_OR_AVATAR, r1.recommendedInteraction);

        ResolutionResult r2 = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("2", "أبو محمد", "توصيل من الرفاع إلى المنامة 2.5 دينار", 1000L));
        assertTrue(r2.isResolved());
        assertEquals(1, r2.matchedRowIndex);

        ResolutionResult r3 = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("3", "🚗", "توصيل من سار إلى العدلية 3 دينار", 1000L));
        assertTrue(r3.isResolved());
        assertEquals(2, r3.matchedRowIndex);
        assertEquals("~ 🚗", r3.boundSenderLabel);

        ResolutionResult r4 = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("4", "ABC", "توصيل من الحد إلى جزر أمواج 1.5 دينار", 1000L));
        assertTrue(r4.isResolved());
        assertEquals(3, r4.matchedRowIndex);

        ResolutionResult r5 = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("5", "مجهول 123", "توصيل من عراد إلى توبلي 2 دينار", 1000L));
        assertTrue(r5.isResolved());
        assertEquals(4, r5.matchedRowIndex);

        ResolutionResult r6 = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("6", "اسم مستعار", "توصيل من البديع إلى مدينة حمد 2 دينار", 1000L));
        assertTrue(r6.isResolved());
        assertEquals(5, r6.matchedRowIndex);
    }

    @Test
    public void bindsStackedMessagesWithoutHeaderToSameBlockHeaderOnly() {
        List<MessageRowDescriptor> rows = Arrays.asList(
                new MessageRowDescriptor(0, "~ أبو محمد", "السلام عليكم شباب", "11:00", true, true, false, false),
                new MessageRowDescriptor(1, "", "توصيل من المنامة إلى سترة 2 دينار", "11:01", false, true, false, false),
                new MessageRowDescriptor(2, "", "", "", false, false, false, true), // divider breaks block
                new MessageRowDescriptor(3, "", "توصيل من سار إلى الرفاع 3 دينار", "11:05", false, true, false, false)
        );

        ResolutionResult validStacked = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("s1", "أبو محمد", "توصيل من المنامة إلى سترة 2 دينار", 1000L));
        assertTrue(validStacked.isResolved());
        assertEquals(1, validStacked.matchedRowIndex);
        assertEquals(0, validStacked.boundHeaderRowIndex);
        assertEquals(RecommendedInteraction.CLICK_ROW_SENDER_OR_AVATAR, validStacked.recommendedInteraction);

        ResolutionResult brokenByDivider = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("s2", "أبو محمد", "توصيل من سار إلى الرفاع 3 دينار", 1000L));
        assertFalse(brokenByDivider.isResolved());
        assertEquals(MatchStatus.IDENTITY_NOT_CONFIRMED, brokenByDivider.status);
    }

    @Test
    public void rejectsSimilarNamesAndAmbiguousDuplicatesWithoutTimestampMatch() {
        List<MessageRowDescriptor> rows = Arrays.asList(
                new MessageRowDescriptor(0, "~ أحمد", "توصيل سار 2 د", "09:10", true, true, false, false),
                new MessageRowDescriptor(1, "~ أحمد علي", "توصيل سار 2 د", "09:15", true, true, false, false)
        );

        ResolutionResult exact = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("sim1", "أحمد", "توصيل سار 2 د", 1000L));
        assertTrue(exact.isResolved());
        assertEquals(0, exact.matchedRowIndex);

        List<MessageRowDescriptor> duplicates = Arrays.asList(
                new MessageRowDescriptor(0, "~ 🚗", "توصيل الرفاع إلى المنامة 2 دينار", "09:10", true, true, false, false),
                new MessageRowDescriptor(1, "~ 🚗", "توصيل الرفاع إلى المنامة 2 دينار", "09:42", true, true, false, false)
        );

        // Without matching time -> AMBIGUOUS_MULTIPLE_MATCHES
        ResolutionResult ambiguous = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                duplicates, ad("dup1", "🚗", "توصيل الرفاع إلى المنامة 2 دينار", 0L));
        assertFalse(ambiguous.isResolved());
        assertEquals(MatchStatus.AMBIGUOUS_MULTIPLE_MATCHES, ambiguous.status);

        // With exact timestamp matching 09:42 -> uniquely resolves row 1
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 9);
        cal.set(Calendar.MINUTE, 42);
        ResolutionResult disambiguated = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                duplicates, ad("dup2", "🚗", "توصيل الرفاع إلى المنامة 2 دينار", cal.getTimeInMillis()));
        assertTrue(disambiguated.isResolved());
        assertEquals(1, disambiguated.matchedRowIndex);
    }

    @Test
    public void returnsNotFoundWhenOriginalAdDeleted() {
        List<MessageRowDescriptor> rows = Collections.singletonList(
                new MessageRowDescriptor(0, "~ أحمد", "طلب مختلف تماماً", "12:00", true, true, false, false)
        );
        ResolutionResult res = OriginalMessageSenderResolver.resolveOriginalMessageRow(
                rows, ad("del", "أحمد", "توصيل من المحرق إلى السيف 3 دينار", 1000L));
        assertFalse(res.isResolved());
        assertEquals(MatchStatus.NOT_FOUND, res.status);
    }
}
