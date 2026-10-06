package com.orderi.radar;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        super();
        registerPlugin(NotificationListenerPlugin.class);
    }
}
