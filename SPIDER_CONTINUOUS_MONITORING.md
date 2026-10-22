# Orderi Spider: Continuous Monitoring Contract

## Purpose
Spider continuously processes WhatsApp notifications that Android exposes to Orderi while the user has enabled monitoring and the required notification-listener permission remains granted. This is notification-based ingestion, not direct access to WhatsApp's private database or a guarantee that every message/conversation will be visible.

## Runtime lifecycle
- `STOPPED`: user has stopped monitoring or Orderi's task was deliberately dismissed from Recents.
- `STARTING`: foreground service is starting and validating the persisted runtime flag.
- `WAITING_PERMISSION`: the notification-listener permission is not enabled; do not claim that capture is active.
- `MONITORING`: the Android notification listener is connected and runtime monitoring is enabled.
- `DEGRADED`: the listener is available but a secondary function (for example, cloud AI) is unavailable.
- `ERROR`: a failure prevents required capture or processing.

The UI must derive status from native permission/service checks and recent listener events. It must not display `MONITORING` merely because a preference is enabled.

## Required lifecycle behavior
1. Starting Orderi persists `background_radar_enabled=true` before starting `BackgroundRadarService`.
2. The foreground service uses `START_STICKY` while the persisted flag remains enabled, allowing Android to recreate it after ordinary process reclamation.
3. If the persisted flag is false, the service must stop and return `START_NOT_STICKY`.
4. When the user removes Orderi's task from Recents, `onTaskRemoved` sets the flag to false, clears queued stale notification events, cancels Orderi-owned notifications, and stops the foreground service.
5. If Android disconnects the notification listener temporarily, request a system rebind on supported versions. A user-revoked permission still requires user action in Android Settings.
6. Do not start monitoring automatically after an intentional user stop or task dismissal.
7. Do not use a polling loop to scrape WhatsApp. Process only notifications delivered through Android's supported notification-listener mechanism.

## Inbound message contract
Every captured event should preserve, when available:
- `schemaVersion`
- stable internal `messageId`
- `source` (for example, `whatsapp_notification`)
- `sourcePackage`
- `chatId` / `chatName`
- `senderId` / `senderName`
- `sourceMessageId`
- `receivedAt` (UTC timestamp)
- `messageTimestamp` (only when known)
- `text`
- `contentHash` (deduplication aid, not a unique identity by itself)
- `captureMetadata` (minimum necessary diagnostics)

Unavailable values must be null/omitted rather than fabricated. Avoid storing or logging unnecessary sensitive message content.

## Per-message state machine
`RECEIVED -> VALIDATING -> QUEUED -> ANALYZING -> ACCEPTED -> PERSISTING -> PUBLISHED`

Other terminal/side states:
- `DUPLICATE`: the same source event was already handled.
- `NEEDS_REVIEW`: required data is ambiguous.
- `FILTERED_OUT`: rejected by configured filters.
- `RETRY_PENDING`: transient failure eligible for retry.
- `FAILED`: retry policy exhausted.
- `ARCHIVED` / `DELETED`: explicit lifecycle action on a saved order.

Do not publish a Radar order until persistence succeeds. Retries must be idempotent and must not create duplicate orders or notifications.

## AI engine states
Track local and cloud engines independently:
`NOT_CONFIGURED`, `DISABLED`, `MODEL_MISSING`, `LOADING`, `READY`, `UNAVAILABLE`, `AUTH_ERROR`, `QUOTA_EXCEEDED`, `RESOURCE_ERROR`, `ERROR`.

`READY` is allowed only after a real inference/health check succeeds. Cloud AI failure must not stop notification capture; queue messages for local processing or retry according to user settings. Never send message content to the cloud while cloud analysis is disabled.

## Acceptance checks
- A new WhatsApp notification is captured while Radar is not the foreground screen.
- Capture works with the screen off when Android delivers the notification and the service/permission remain active.
- A temporary process reclaim does not permanently disable the active foreground service.
- Swiping Orderi away from Recents disables ingestion and stops the service.
- A disconnected listener requests rebind where supported.
- Reprocessing a queued event does not create duplicate orders.
- Status UI distinguishes permission missing, active monitoring, degraded AI, backlog, and stopped.
- Tests and device results must be reported honestly; behavior may vary with Android/OEM battery restrictions and notification content.

## Scope and limitations
Spider can process only notification content Android exposes. It cannot guarantee access to every WhatsApp message, hidden/old messages, or full conversation history. Force-stop, revoked permissions, OEM task killers, and OS restrictions may interrupt monitoring.
