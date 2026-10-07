# CodeVoice AI V42 — Worker Task Ledger Recovery Reality Report

## Scope
V42 extends V41's durable task ledger with conservative crash/restart reconciliation for stale task executions.

## Implemented
- Durable `worker-task-run` states now include `ORPHANED`.
- New `server/workerTaskLedgerRecovery.ts` scans stale non-terminal task ledger records.
- Active worker leases are never reclaimed by this recovery pass.
- If the durable mission already records the task as `COMPLETED`, `WAITING_APPROVAL`, or `FAILED`, the task ledger is finalized from that durable mission state.
- Deterministic/read-only task classes (`ANALYZE`, `PLAN`, `READ`, `SEARCH`, `VALIDATE`, `TEST`, `RUN_*`, `REVIEW`, `SUMMARIZE`) may be returned to `READY` after a lost worker, subject to retry limits.
- Potential side-effect task classes (`CREATE`, `UPDATE`, `DELETE`, `RENAME`, `CODE`, `FIX`) are **not automatically replayed** when the worker disappears before result commit. They are marked `ORPHANED` and the mission moves to `WAITING_USER` for manual review, preventing an unverified external mutation from being blindly repeated.
- Added APIs:
  - `POST /api/durable/worker-pool/task-ledger/recover`
  - `POST /api/durable/worker-pool/task-ledger/watchdog`
- Added V42 regression test suite.

## Verification
PASS:
- `tests/v42-worker-task-ledger-recovery.test.ts`
- `tests/v41-worker-task-ledger.test.ts`
- `tests/v40-worker-pool-recovery.test.ts`
- `tests/v39-worker-pool.test.ts`
- `tests/v38-mission-queue-scheduler.test.ts`
- `tests/v38-distributed-scheduler.test.ts`

## Full TypeScript verification
`npm run lint` = **NOT_VERIFIED** in this environment.
Observed error:
`TS2688: Cannot find type definition file for 'vite/client'.`
This is an environment/dependency resolution issue; the targeted runtime suites above passed.

## Reality boundary
V42 does **not** claim exactly-once semantics for external side effects. If a worker disappears after an external mutation has happened but before the durable task result is committed, the system deliberately blocks automatic replay for mutation-capable task types. Safe replay is limited to the deterministic/read-only task allowlist.

V42 also remains an in-process worker-pool architecture. It does not claim multi-machine consensus or distributed transaction coordination.
