# Milestone 12 — Durable Webhook Delivery Ledger

## Goal
Make webhook delivery idempotency durable across process recovery while preventing reuse of a delivery ID for a different semantic payload.

## Changes
- Added `WebhookDeliveryLedger` with `IN_PROGRESS`, `SENT`, and `FAILED` states.
- Added in-memory and file-backed implementations with atomic replacement persistence.
- `WebhookNotifier` reserves a delivery before network I/O.
- A previously `SENT` delivery returns the stored result without another network request.
- Concurrent use of the same delivery ID is blocked while `IN_PROGRESS`.
- Reusing a delivery ID with a different semantic payload is blocked by `payloadHash` conflict.
- Semantic payload identity excludes the volatile timestamp, so legitimate replay does not create a false conflict.
- Existing HMAC timestamp/signature behavior remains unchanged for actual network delivery.

## Verification
Milestone 12 focused suite: 3/3 PASS using Node native TypeScript stripping.

Dependency-complete `npm ci`, full typecheck, build, and complete regression remain unclaimed because the sandbox dependency installation previously timed out.
