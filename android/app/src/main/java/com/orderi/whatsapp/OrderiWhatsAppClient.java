package com.orderi.whatsapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;
import org.json.JSONObject;
import java.util.List;
import java.util.Set;

public class OrderiWhatsAppClient {

    public enum ConnectionState {
        NOT_REGISTERED("Not Registered", "رقم الهاتف غير مسجل"),
        WHATSAPP_NOT_INSTALLED("WhatsApp Not Installed", "واتساب العادي غير مثبت"),
        PERMISSION_REQUIRED("Permission Required", "صلاحية قراءة الإشعارات مطلوبة ⚠️"),
        SERVICE_DISCONNECTED("Service Disconnected", "خدمة الاستقبال غير متصلة"),
        WAITING_FOR_MESSAGES("Waiting For Messages", "الخدمة نشطة بانتظار وصول الرسائل ⚡"),
        RECEIVING_EVENTS("Receiving Events", "تم استقبال إعلانات من واتساب 📥"),
        PROCESSING_MESSAGES("Processing Messages", "جاري تحليل الرسائل واستخراج الطلبات ⚙️"),
        RADAR_ACTIVE("Radar Active", "الرادار نشط ومتصل بلحظات الإعلانات 🟢"),
        ERROR("Error", "خطأ في الخدمة");

        public final String technicalName;
        public final String labelArabic;

        ConnectionState(String technicalName, String labelArabic) {
            this.technicalName = technicalName;
            this.labelArabic = labelArabic;
        }
    }

    private static volatile OrderiWhatsAppClient instance;
    private final Context context;
    private final WhatsAppEventStore eventStore;
    private final WhatsAppEventProcessor eventProcessor;
    private String registeredPhone = "";
    private int ordersCapturedCount = 0;
    private int closedOrdersCount = 0;

    private OrderiWhatsAppClient(Context context) {
        this.context = context.getApplicationContext();
        this.eventStore = new WhatsAppEventStore(this.context);
        this.eventProcessor = new WhatsAppEventProcessor();
        loadState();
    }

    public static synchronized OrderiWhatsAppClient getInstance(Context context) {
        if (instance == null) {
            instance = new OrderiWhatsAppClient(context);
        }
        return instance;
    }

    private void loadState() {
        SharedPreferences prefs = context.getSharedPreferences("orderi_wa_client_native", Context.MODE_PRIVATE);
        this.registeredPhone = prefs.getString("registered_phone", "");
    }

    public synchronized void registerPhoneNumber(String phone) {
        this.registeredPhone = phone != null ? phone.trim() : "";
        context.getSharedPreferences("orderi_wa_client_native", Context.MODE_PRIVATE)
                .edit().putString("registered_phone", this.registeredPhone).apply();
    }

    public synchronized String getRegisteredPhone() {
        return this.registeredPhone;
    }

    public synchronized ConnectionState evaluateState() {
        if (TextUtils.isEmpty(registeredPhone)) {
            return ConnectionState.NOT_REGISTERED;
        }
        if (!WhatsAppPermissionManager.isWhatsAppInstalled(context)) {
            return ConnectionState.WHATSAPP_NOT_INSTALLED;
        }
        if (!WhatsAppPermissionManager.isNotificationAccessGranted(context)) {
            return ConnectionState.PERMISSION_REQUIRED;
        }
        if (!WhatsAppServiceMonitor.isServiceConnected()) {
            return ConnectionState.SERVICE_DISCONNECTED;
        }
        long lastEvent = WhatsAppServiceMonitor.getLastEventTimestamp();
        long now = System.currentTimeMillis();
        if (lastEvent > 0 && (now - lastEvent) < (15 * 60 * 1000L)) {
            if (ordersCapturedCount > 0) {
                return ConnectionState.RADAR_ACTIVE;
            }
            return ConnectionState.RECEIVING_EVENTS;
        }
        return ConnectionState.WAITING_FOR_MESSAGES;
    }

    public synchronized void recordOrderCaptured() {
        this.ordersCapturedCount++;
    }

    public synchronized void recordOrderClosed() {
        this.closedOrdersCount++;
    }

    public WhatsAppEventStore getEventStore() {
        return eventStore;
    }

    public WhatsAppEventProcessor getEventProcessor() {
        return eventProcessor;
    }

    public int getOrdersCapturedCount() {
        return ordersCapturedCount;
    }

    public int getClosedOrdersCount() {
        return closedOrdersCount;
    }
}
