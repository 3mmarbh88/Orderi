# Orderi on-device AI implementation plan

## Goal
Add optional on-device language-model analysis for WhatsApp notification text without per-request AI API fees, while preserving the existing Orderi radar, notification listener, order parser, duplicate detection, filters, and server/database behavior.

## Current baseline reviewed
- `src/utils/orderParser.ts`: existing local Arabic/Bahraini WhatsApp order parser.
- `src/utils/aiEvaluator.ts`: existing deterministic client-side match evaluator; keep it as the reliable fallback and scoring layer.
- `src/App.tsx`: current app flow wires the notification listener and existing parser/evaluator.
- `android/app/src/main/java/com/orderi/radar/WhatsAppNotificationListenerService.java`: receives notification-shade content exposed by regular WhatsApp; it does not read WhatsApp's private database.
- `android/app/build.gradle`: current Android module has no on-device LLM runtime dependency.
- `android/variables.gradle`: minSdkVersion 24, compile/target SDK 36.
- `orderi-server/src/server.ts`: server persists/broadcasts orders and has a separate lightweight parser. Server must not become a required AI inference service.

## Intended design
1. Treat local model inference as an optional enhancement, not a replacement for current parsing.
2. Run inference on the Android device using a compatible native runtime and a quantized model downloaded once to app-private storage.
3. Perform a device-capability and runtime check before enabling the model. Devices that cannot run it must continue using the current parser and evaluator without blocking order capture.
4. Use structured output with validated fields only: pickup, destination, explicit price, phone if visible in the notification, item type, notes, and confidence. Never invent missing prices, locations, or phone numbers.
5. Pass the extracted result through the existing safety/validation, duplicate-detection, filter, and order-saving paths. Do not let model output bypass existing checks.
6. Download model files only from a verified release endpoint, validate file size and SHA-256, show storage requirements, and allow retry/cancel. Inference must not call a paid remote AI API.
7. Keep the server available for existing sync/database duties; local model inference should still work when offline after the model is installed.

## Implementation stages
- Stage A: preserve the baseline and add this implementation plan on an isolated branch.
- Stage B: select and verify an Android inference runtime/model combination, including licence, supported ABIs, minimum RAM/storage, download size, and Android API requirements.
- Stage C: add a native Android model manager/inference bridge and a TypeScript capability/status API. Keep model files out of the APK so the APK does not become unnecessarily large.
- Stage D: integrate the model as a best-effort enrichment step with timeout/error fallback to the existing parser.
- Stage E: add tests for Arabic numerals, Bahraini locations, missing/ambiguous prices, phone extraction, duplicates, malformed model output, offline inference, and unsupported devices.

## Non-regression requirements
- Do not change the `main` branch directly.
- Do not remove the existing parser/evaluator or current WhatsApp notification listener.
- Do not send WhatsApp message contents to a third-party AI API.
- Do not claim the model is ready until native integration, model download/checksum, and Android device tests pass.
- Validate build and typecheck before proposing a merge.
