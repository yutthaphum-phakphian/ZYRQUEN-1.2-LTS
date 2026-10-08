# Milestone 14 — Durable Execution Receipt Integrity Guard

## Scope
Harden the Milestone 13 durable execution receipt ledger so persisted execution evidence is validated before it can participate in replay or mutation decisions.

## Changes
- Added `ExecutionReceiptIntegrity` verification to the receipt ledger contract.
- Validate persisted receipts for:
  - execution-key / identity binding
  - receipt-id binding
  - status and timestamp shape
  - patch-hash format and PR patch-hash binding
  - PR/webhook audit-hash formats
  - terminal-state completeness
  - receipt hash integrity
- Existing but malformed/corrupt ledger files now fail closed with `EXECUTION_RECEIPT_LEDGER_CORRUPT` instead of silently starting from an empty ledger.
- Added route handling that returns HTTP 503 for a corrupted receipt ledger.
- Receipt sealing now canonicalizes the JSON representation before hashing, preventing in-memory vs persisted replay drift caused by undefined fields.
- Completed receipts are terminal and cannot be overwritten by a later `complete()` call.
- M11 idempotency test now uses an isolated in-memory webhook ledger so test results do not depend on previous persistent test artifacts.

## Zero-Fake behavior
A damaged receipt ledger is not treated as empty. Recovery is blocked until the ledger is repaired or replaced by an operator under controlled procedures.

## Verification
Focused Milestone 5–14 suite: **25/25 PASS**.

Modified TypeScript syntax checks: **PASS** using Node TypeScript stripping.

Global `tsc --noEmit`: **NOT CLAIMED PASS** in this sandbox because `vite/client` type definitions are unavailable after dependency installation timed out earlier.

No package-lock modification. No existing tests/data deleted.
