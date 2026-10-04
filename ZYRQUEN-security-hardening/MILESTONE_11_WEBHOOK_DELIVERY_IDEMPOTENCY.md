# Milestone 11 — Webhook Delivery Idempotency

## Goal
Prevent duplicate webhook delivery identity across process recovery/retry when a caller can persist the delivery ID.

## Changes
- `WebhookConfig.deliveryId` accepts a caller-supplied stable delivery ID.
- Delivery IDs are validated against a bounded safe character set and length.
- Existing automatic delivery-ID generation remains the default.
- Retry attempts continue to use one delivery ID, preserving the existing Milestone 6 behavior.

## Verification
Focused Milestone 5–11 suite: 15/15 PASS.

Full dependency-complete `npm ci`, typecheck, build and complete regression are not claimed here because the sandbox dependency installation previously timed out.
