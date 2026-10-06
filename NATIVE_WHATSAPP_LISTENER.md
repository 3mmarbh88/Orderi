# Orderi Native WhatsApp Listener

This Android build adds a real `NotificationListenerService` restricted to `com.whatsapp`.

## Runtime behavior
- Orderi does **not** log into WhatsApp and does not use WhatsApp Web/QR.
- Android must grant **Notification access** to Orderi.
- The service continues receiving WhatsApp notifications while Orderi's UI is in the background.
- Events are kept in a small local queue and delivered to Orderi when it returns to the foreground.
- Only the normal WhatsApp package `com.whatsapp` is accepted. WhatsApp Business is intentionally not included.
- The service can only see information that WhatsApp exposes in Android notifications; it cannot read WhatsApp's private database.

## User flow
1. Install Orderi.
2. Sign in.
3. Open Android notification access settings when prompted by the Orderi listener settings UI.
4. Enable Orderi.
5. Return to Orderi.
6. WhatsApp group notifications are captured automatically.

## Important Android behavior
Notification access is a special Android system permission and is enabled from Settings. Android does not allow an app to silently grant this permission to itself.
