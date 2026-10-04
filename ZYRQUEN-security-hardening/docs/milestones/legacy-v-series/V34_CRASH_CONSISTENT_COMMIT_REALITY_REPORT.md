# V34 — Crash-Consistent Commit Reality Report

## Scope
V34 hardens V33 with deterministic crash-point simulation and recovery state reconstruction across the atomic workspace commit protocol.

Flow:

`PREPARED → STAGED → APPLIED → TRANSACTION COMMITTED → COORDINATOR COMMITTED`

Each boundary can now be tested with a simulated process crash. Recovery uses durable evidence rather than guessing.

## Implemented

- deterministic crash injection at `AFTER_STAGED`, `AFTER_APPLIED`, `BEFORE_FINAL_COMMIT`, and `AFTER_TRANSACTION_COMMIT`
- V33 atomic coordinator can defer transaction commit while applying the fenced workspace effect
- `inspectAtomicRecovery()` exposes deterministic states:
  - `MISSING`
  - `PREPARED_NO_EFFECT`
  - `STAGED_NOT_APPLIED`
  - `APPLIED_PENDING_COMMIT`
  - `COMMITTED_COORDINATOR_PENDING`
  - `COMMITTED`
  - `ABORTED`
- `recoverAtomicWorkspaceCommit()` now:
  - aborts staged-but-not-applied work
  - finalizes APPLIED + PREPARED transactions
  - finalizes coordinator state when transaction is already COMMITTED
  - preserves terminal idempotency
- recovery events are appended as durable mission evidence
- API:
  - GET `/api/durable/transaction/:transactionId/atomic-commit/recovery-state`
- V33/V32 behavior remains backward compatible by default

## Crash scenarios verified

1. crash after STAGED → `STAGED_NOT_APPLIED` → recovery aborts safely
2. crash after APPLIED → `APPLIED_PENDING_COMMIT` → recovery commits deterministically
3. crash before final commit → `APPLIED_PENDING_COMMIT` → recovery commits deterministically
4. crash after transaction commit but before coordinator record → `COMMITTED_COORDINATOR_PENDING` → recovery finalizes coordinator

## Regression evidence

- V34 crash-consistent commit: PASS
- V33 atomic workspace commit: PASS
- V32 transactional fenced mutation: PASS
- V31 fenced worker runtime: PASS
- V30 fenced recovery: PASS
- V29 worker fencing: PASS
- V28 worker supervisor: PASS
- V27 recovery orchestrator: PASS
- V26 deterministic replay: PASS
- ZIP integrity: PASS

## Important boundary

This remains a durable multi-record commit protocol, not a single ACID database transaction spanning every storage record. Crash consistency is achieved through explicit durable phases, evidence, idempotency, locks, and deterministic recovery. External side effects outside the CodeVoice durable workspace remain outside this protocol.

## Verification limitation

Full Vite/browser build was not claimed because the archive does not include a complete installed `node_modules` environment. Runtime regression tests were executed directly with Node's experimental TypeScript stripping.
