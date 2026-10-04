# Milestone 6 — PR/Webhook Reliability Hardening

## Implemented

- GitHub PR automation now validates repository owner/name before any API call.
- Webhook delivery now has bounded timeout, exponential retry, and attempt evidence.
- Retries occur for transport failures and HTTP 5xx; HTTP 4xx stops immediately.
- A retry reuses the same delivery ID, timestamp, payload, and HMAC signature, so consumers can deduplicate safely.
- Retry/timeout bounds are clamped server-side (`timeoutMs` 100–30000, `maxRetries` 0–5, `baseRetryDelayMs` 0–5000).
- Existing HTTPS, private-host and hostname allowlist protections remain unchanged.

## Verification

Milestone 6 focused tests: **3/3 PASS**.

Milestone 5 focused tests remain unchanged and should be run on the fully provisioned project environment together with the complete regression/build suite.

Full `npm ci`, full typecheck, build, and complete regression are not claimed here because dependency installation timed out in the sandbox.
