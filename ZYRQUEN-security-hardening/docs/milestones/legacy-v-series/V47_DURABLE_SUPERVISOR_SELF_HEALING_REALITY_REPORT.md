# CodeVoice AI V47 — Durable Supervisor Self-Healing Reality Report

## Scope
V47 extends V46 with a durable self-healing control loop for the Worker Task Consistency Supervisor.

### Implemented
- Added `HALF_OPEN` recovery-probe state after circuit cooldown.
- Durable persistence/restoration of `HALF_OPEN` and supervisor transition counter.
- Recovery probe is opt-in by `recoveryProbe` (enabled by default).
- Successful probe clears failure/backoff/circuit state and returns supervisor to `RUNNING`.
- `RESOURCE_LOCKED` is treated as `SKIPPED_LOCKED`, not as a health failure, so distributed lock contention does not inflate the circuit breaker.
- Durable manual circuit/backoff reset: `POST /api/durable/worker-pool/task-consistency-supervisor/reset`.
- Durable reset evidence is appended to the system mission journal.
- Existing V39–V46 behavior remains covered by regression tests.

## State flow
`RUNNING -> BACKOFF -> CIRCUIT_OPEN -> HALF_OPEN -> RUNNING`

Failure during `HALF_OPEN` returns the supervisor to the durable circuit/backoff path. A successful recovery probe clears the failure state.

## Tests
The following passed in this environment:
- V47 durable supervisor self-healing tests
- V46 durable supervisor state/backoff tests
- V45 supervisor recovery tests
- V44 consistency supervisor tests
- V43 consistency tests
- V42 task ledger recovery tests
- V41 task ledger tests
- V40 worker pool durable recovery tests
- V39 worker pool tests
- V38 mission queue scheduler tests
- V38 distributed scheduler tests

## Verification limits
### TypeScript lint
`NOT_VERIFIED`

`npm run lint` fails before project type-checking because the environment does not provide `vite/client`:

`TS2688: Cannot find type definition file for 'vite/client'`

### Frontend build
`NOT_VERIFIED`

`npm run build` cannot start because `vite` is unavailable in the current environment (`vite: not found`).

## Reality boundary
V47 is a durable in-process supervisor/control loop with durable records, resource locking, recovery probes, and journal evidence. It does **not** claim multi-machine consensus, Raft/Paxos semantics, or exactly-once guarantees for external side effects. External side effects still require provider-side idempotency/transaction semantics.
