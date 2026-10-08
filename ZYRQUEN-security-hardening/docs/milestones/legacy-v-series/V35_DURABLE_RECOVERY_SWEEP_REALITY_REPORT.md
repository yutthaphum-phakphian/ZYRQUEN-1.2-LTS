# V35 — Durable Transaction Recovery Sweep Reality Report

## Status
IMPLEMENTED / RUNTIME-TESTED

## What was added
- Durable transaction-commit record scan.
- Deterministic recovery candidate detection from atomic commit state.
- Mission journal integrity verification before automatic recovery.
- Recovery worker fence acquisition when no worker is active.
- Reuse and validation of an existing active worker fence.
- Mission/workspace durable locks during recovery.
- Fence re-check before recovery mutation.
- Evidence-bearing recovery sweep results.
- Idempotent second sweep: already committed records are NO_ACTION.
- HTTP endpoint: `POST /api/durable/recovery/transactions/sweep`.

## Recovery rules
- `STAGED_NOT_APPLIED` -> delegate to V34 deterministic recovery; abort without guessing a commit.
- `APPLIED_PENDING_COMMIT` -> finalize transaction commit from durable APPLIED evidence.
- `COMMITTED_COORDINATOR_PENDING` -> finalize coordinator from durable transaction-terminal evidence.
- Journal integrity failure -> BLOCKED; no automatic mutation.
- Missing/non-recoverable state -> SKIPPED/NO_ACTION.
- Active worker -> existing fence must verify; otherwise recovery is blocked.
- No active worker -> a temporary recovery worker lease is acquired and released after the sweep item.

## Tests executed
- `node --experimental-strip-types tests/v35-durable-recovery-sweep.test.ts` PASS
- V34 crash-consistent commit regression PASS
- V33 atomic workspace commit regression PASS
- V32 transactional fenced mutation regression PASS
- V31 fenced worker runtime regression PASS
- V30 fenced recovery regression PASS
- V29 worker fencing regression PASS
- V28 worker supervisor regression PASS
- V27 recovery orchestrator regression PASS
- V26 deterministic replay regression PASS

## Important boundary
This is not a single ACID database transaction across all storage. The sweep is evidence-driven and lock/fence protected, but cross-storage atomicity remains implemented as a durable commit protocol.

## Build verification
Full Vite/browser build was NOT VERIFIED in this environment because the archive does not include a complete `node_modules` installation. Runtime tests above were executed directly with Node's experimental TypeScript stripping.
