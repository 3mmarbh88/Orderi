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


## Durable queue and acknowledgement implementation
- Native notification events are persisted before the app broadcast is sent.
- Event IDs are deterministic for a notification key, visible text, package, and Android post time. A bounded 24-hour native ledger prevents duplicate re-enqueueing across process restarts.
- `getPending()` is non-destructive. The JavaScript pipeline calls `acknowledgeEvents({ ids })` only after a message is parsed and handed to the local order-processing path, or after an intentional filter/closure decision. Parser errors leave the event pending for retry.
- The queue is bounded to 500 events to protect device storage. If it fills, the oldest unacknowledged event is dropped and an error is logged; this is a bounded offline queue, not an unlimited durable database.
- The UI's in-memory duplicate guard complements native idempotency; it is not the source of persistence.

## AI routing and privacy
- Local heuristic parsing and HERE WeGo place matching remain available offline.
- The Android project includes LiteRT-LM runtime integration. Gemma is reported as ready only after the model file is found, the engine initializes, and a real JSON inference succeeds. The model file itself is not bundled in the APK; it must be imported/copied to the app's private `files/models/gemma3-1b-it-int4.litertlm` or app-specific external `models/` path. If the file/runtime is missing or incompatible, parsing falls back to local deterministic rules and the status remains not ready.
- Cloud parsing is strictly opt-in (`useCloudAiFallback === true`). The Android build workflow sets `VITE_ORDERI_API_BASE_URL=https://orderi-server.onrender.com` and calls `/api/ai/cloud-parse-order`. If the endpoint is unavailable or returns an error, the app continues with local parsing; no request is made while cloud AI is disabled.
- The server route is in the `orderi-server` repository and must be deployed with `GEMINI_API_KEY` configured. The API key remains on the server and is never embedded in the Android app. Cloud parsing validates message size and applies a per-IP request limit.
- CI build success validates compilation only; notification behavior, cloud reachability, model inference, and OEM background execution still require device/backend tests.
