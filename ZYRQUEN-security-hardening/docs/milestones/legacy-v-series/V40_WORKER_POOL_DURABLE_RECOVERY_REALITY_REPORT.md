# CodeVoice AI V40 — Worker Pool Durable Recovery & Watchdog Reality Report

## Implemented

V40 extends V39 with a durable execution record for every worker-pool dispatch and a restart/watchdog reconciliation path.

### Durable worker-run record

New durable record kind: `worker-run`.

States:
- `CLAIMED`
- `RUNNING`
- `ACK_PENDING`
- `COMPLETED`
- `FAILED`
- `ORPHANED`

The record captures mission/worker/lease/fencing identity, attempt number, timestamps, result status/steps, error evidence, and ACK version.

### Crash/restart recovery

`recoverWorkerPoolRuns()` scans durable worker-run records, detects stale runs, verifies the mission worker lease, and only treats a run as orphaned when the recorded worker lease is no longer active.

For an orphaned dispatched mission, the durable queue dispatch is released and returned to `QUEUED`, preserving the existing scheduler slot/fencing model.

### Idempotent result ACK

Normal worker completion transitions through `ACK_PENDING` and then a durable terminal `COMPLETED` run record before the queue is acknowledged. Repeated ACK attempts against an already terminal run return an idempotent result rather than creating a duplicate completion.

### Pool APIs

- `GET /api/durable/worker-pool`
- `POST /api/durable/worker-pool/start`
- `POST /api/durable/worker-pool/stop`
- `POST /api/durable/worker-pool/tick`
- `POST /api/durable/worker-pool/shutdown`
- `POST /api/durable/worker-pool/recover`
- `POST /api/durable/worker-pool/watchdog`

## Verification

Passed:

- `V40 worker pool durable recovery tests: PASS`
- `V39 worker pool tests: PASS`
- `V38 mission queue scheduler tests: PASS`
- `V38 distributed scheduler tests: PASS`

TypeScript project-wide verification:

- `npx tsc --noEmit` = **NOT_VERIFIED** because this environment is missing the `vite/client` type definition (`TS2688`). This is an environment/dependency availability issue, not a failed V40 runtime test.

## Reality boundary

V40 provides durable worker-run state and in-process pool recovery/watchdog logic. It does **not** claim a separate OS process supervisor, multi-machine cluster orchestration, distributed consensus, or exactly-once external side effects.

A crash after an external side effect but before durable completion can still require external reconciliation; V40 prevents duplicate durable ACKs but cannot roll back arbitrary third-party side effects.

## Package

Version: `40.0.0`
