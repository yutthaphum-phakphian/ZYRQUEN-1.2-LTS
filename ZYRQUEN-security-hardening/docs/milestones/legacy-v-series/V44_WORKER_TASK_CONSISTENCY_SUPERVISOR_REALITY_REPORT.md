# CodeVoice AI V44 — Worker Task Consistency Supervisor

## Scope
V44 extends V43 with a durable supervisor that coordinates task-ledger recovery and consistency auditing as one bounded, serialized cycle.

## Implemented
- Added `server/workerTaskConsistencySupervisor.ts`.
- Durable `worker-consistency-run` record per supervisor cycle.
- Durable resource lock prevents concurrent supervisor instances from running the same cycle.
- In-process cycle coalescing prevents overlapping calls in one process.
- Each cycle runs V42 task-ledger recovery followed by V43 consistency audit.
- Bounded stale threshold and batch size.
- Periodic `start/stop/tick/shutdown` lifecycle.
- Durable cycle status and error evidence.
- Added APIs:
  - `GET /api/durable/worker-pool/task-consistency-supervisor`
  - `POST /api/durable/worker-pool/task-consistency-supervisor/start`
  - `POST /api/durable/worker-pool/task-consistency-supervisor/stop`
  - `POST /api/durable/worker-pool/task-consistency-supervisor/tick`
  - `POST /api/durable/worker-pool/task-consistency-supervisor/shutdown`
- Added `test:v44`.

## Verified tests
- V44 worker task consistency supervisor tests: PASS
- V43 worker task consistency tests: PASS
- V42 worker task ledger recovery tests: PASS
- V41 worker task ledger tests: PASS
- V40 worker pool durable recovery tests: PASS
- V39 worker pool tests: PASS

## Environment boundary
- Full TypeScript/build verification depends on the project dependency environment. The known baseline issue remains if `node_modules` is incomplete (`vite/client` type definition / `vite` executable).

## Reality boundary
V44 is a durable single-process supervisor with a filesystem-backed distributed lock. It is not a consensus protocol and does not guarantee exactly-once external side effects. External providers still require idempotency/transaction semantics.
