# CodeVoice AI V41 — Durable Worker Task Execution Ledger Reality Report

## Implemented

V41 extends V40 from durable **worker-run** recovery to durable **task-level execution identity** inside a fenced worker.

### Durable task execution ledger

New durable record kind: `worker-task-run`.

States:
- `CLAIMED`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `WAITING_APPROVAL`

Each task ledger record stores mission/task identity, worker/lease/fencing identity, attempt, stable execution key, timestamps, and the task result/error evidence.

### Replay protection

Before `adapter.executeTask()` the fenced runtime claims the durable task record. If a previous execution for the same mission/task is already durably `COMPLETED`, the stored `MissionTaskResult` is replayed and the adapter is not invoked again.

This closes an important crash window between task execution and mission-state persistence for completed task results: after a completed result has reached the ledger, a restarted worker can reuse it rather than execute that task again.

### Adapter idempotency key

The runtime exposes a stable `executionIdempotencyKey` in task inputs while the adapter executes. External adapters that support idempotency can use this key to deduplicate their own side effects.

### API

Added:
- `GET /api/durable/worker-pool/task-runs`

The existing V40 recovery/watchdog APIs remain intact.

## Verification

Passed:

- `V41 worker task ledger tests: PASS`
- `V40 worker pool durable recovery tests: PASS`
- `V39 worker pool tests: PASS`
- `V38 mission queue scheduler tests: PASS`
- `V38 distributed scheduler tests: PASS`

Project-wide TypeScript verification:

- `npx tsc --noEmit` = **NOT_VERIFIED** in this environment because the installed dependency tree is missing `vite/client` (`TS2688`). This is an environment/dependency availability limitation, not a failed V41 runtime test.

## Reality boundary

V41 does **not** claim exactly-once external side effects. A crash can still occur after an arbitrary third-party side effect and before that provider's own idempotency/commit boundary. The new stable execution key gives an external integration a durable deduplication key, but the external provider must actually honor it.

V41 also remains an in-process worker-pool/runtime design; it does not claim multi-machine consensus or a separate OS process supervisor.

## Package

Version: `41.0.0`
