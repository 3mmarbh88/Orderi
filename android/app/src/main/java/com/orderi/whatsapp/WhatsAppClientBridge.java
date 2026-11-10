package com.orderi.whatsapp;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "OrderiWhatsAppClientBridge")
public class WhatsAppClientBridge extends Plugin {

    private OrderiWhatsAppClient client;

    @Override
    public void load() {
        super.load();
        client = OrderiWhatsAppClient.getInstance(getContext());
    }

    @PluginMethod
    public void getClientDiagnostics(PluginCall call) {
        JSObject ret = new JSObject();
        OrderiWhatsAppClient.ConnectionState state = client.evaluateState();
        ret.put("stateKey", state.name().toLowerCase());
        ret.put("technicalName", state.technicalName);
        ret.put("labelArabic", state.labelArabic);
        ret.put("registeredPhone", client.getRegisteredPhone());
        ret.put("isWhatsAppInstalled", WhatsAppPermissionManager.isWhatsAppInstalled(getContext()));
        ret.put("isNotificationAccessGranted", WhatsAppPermissionManager.isNotificationAccessGranted(getContext()));
        ret.put("isBatteryOptimizationIgnored", WhatsAppPermissionManager.isBatteryOptimizationIgnored(getContext()));
        ret.put("isServiceConnected", WhatsAppServiceMonitor.isServiceConnected());
        ret.put("lastEventTimestamp", WhatsAppServiceMonitor.getLastEventTimestamp());
        ret.put("totalEventsIngested", WhatsAppServiceMonitor.getTotalEventsIngested());
        ret.put("ordersCaptured", client.getOrdersCapturedCount());
        ret.put("ordersClosed", client.getClosedOrdersCount());
        ret.put("pendingEventsCount", client.getEventStore().size());
        ret.put("lastError", WhatsAppServiceMonitor.getLastError());
        call.resolve(ret);
    }

    @PluginMethod
    public void registerPhoneNumber(PluginCall call) {
        String phone = call.getString("phone", "");
        client.registerPhoneNumber(phone);
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("phone", client.getRegisteredPhone());
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        boolean opened = WhatsAppPermissionManager.openNotificationSettings(getContext());
        JSObject ret = new JSObject();
        ret.put("success", opened);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        boolean opened = WhatsAppPermissionManager.openAccessibilitySettings(getContext());
        JSObject ret = new JSObject();
        ret.put("success", opened);
        call.resolve(ret);
    }

    @PluginMethod
    public void getPendingEvents(PluginCall call) {
        List<JSONObject> pending = client.getEventStore().getAllPending();
        JSArray arr = new JSArray();
        for (JSONObject obj : pending) {
            try {
                arr.put(new JSObject(obj.toString()));
            } catch (Exception ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("events", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void acknowledgeEvents(PluginCall call) {
        JSArray ids = call.getArray("ids");
        Set<String> set = new HashSet<>();
        if (ids != null) {
            for (int i = 0; i < ids.length(); i++) {
                try {
                    String id = ids.getString(i);
                    if (id != null && !id.trim().isEmpty()) set.add(id.trim());
                } catch (Exception ignored) {}
            }
        }
        int ack = client.getEventStore().acknowledge(set);
        JSObject ret = new JSObject();
        ret.put("acknowledgedCount", ack);
        call.resolve(ret);
    }
}
