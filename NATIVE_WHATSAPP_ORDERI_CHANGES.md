# Orderi native WhatsApp integration changes

- WhatsApp integration is native Android notification-listener based and filters `com.whatsapp`.
- The Orderi WhatsApp phone number is stored locally in `orderi_whatsapp_connection_v2`.
- A stable `deviceId` is stored in `orderi_device_id_v2`.
- A connection becomes verified when a real WhatsApp notification reaches the native listener.
- Discovered group names are stored with the local WhatsApp connection record.
- Pending native notifications remain in Android SharedPreferences until Orderi reads them.
- Legacy WhatsApp Web/SSE session status is ignored by the native Android flow to prevent false connection states and duplicate orders.
- Fake QR/pairing code values are no longer used for the native flow.
- The app does not read WhatsApp's private database and cannot independently retrieve the WhatsApp account phone number; the user-entered number is stored as account metadata and the native notification is used as the device-side verification signal.
