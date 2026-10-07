# CodeVoice AI — Production Runtime Control Plane Milestone Reality Report

## Scope

This milestone stops the version-by-version expansion and consolidates the existing durable runtime into one operational control surface.

### Implemented

1. **Runtime Control Plane** (`server/runtimeControlPlane.ts`)
   - Aggregates the supervisor control plane, worker pool, mission queue scheduler, transaction recovery supervisor, task consistency supervisor, and durable-store metadata.
   - Exposes a single runtime health classification: `HEALTHY`, `DEGRADED`, `RECOVERY_REQUIRED`, `STANDBY`.
   - Uses the durable supervisor role as the authority for whether this process owns execution services.
   - Starts local worker/recovery services only while this process is active and healthy in the control plane.
   - Stops those services when the process becomes standby/stale.
   - Provides `start`, `heartbeat`, `tick`, and `stop` orchestration.

2. **Control-plane membership inspection** (`server/supervisorControlPlane.ts`)
   - Inspects all persisted supervisor member records instead of only the active member.
   - Marks expired members as `STALE` during inspection.
   - Adds `assertActiveLeadership()` to verify the current durable lock owner and fencing token before privileged orchestration.

3. **HTTP operational API** (`server.ts`)
   - `GET /api/runtime/control-plane`
   - `POST /api/runtime/control-plane/start`
   - `POST /api/runtime/control-plane/heartbeat`
   - `POST /api/runtime/control-plane/tick`
   - `POST /api/runtime/control-plane/stop`

4. **Regression coverage**
   - Added `tests/milestone-runtime-control-plane.test.ts`.
   - Added `npm run test:milestone`.

## Verification

The milestone-specific test passed.

The durable runtime regression chain also passed:

- V48 supervisor control plane
- V47 durable supervisor self-healing
- V46 durable supervisor state/backoff
- V45 supervisor recovery
- V44 consistency supervisor
- V43 consistency audit
- V42 task ledger recovery
- V41 task ledger
- V40 worker-pool durable recovery
- V39 worker pool
- V38 mission queue scheduler
- V38 distributed scheduler

## Reality Boundary

This milestone is an in-process durable control/orchestration layer. It is **not** a Raft/Paxos implementation and does not claim general distributed consensus or network-partition safety.

External side effects still depend on provider-side idempotency/transaction semantics; this system does not claim exactly-once execution across arbitrary external providers.

A full frontend TypeScript/build verification remains environment-dependent. The prior environment limitation around `vite/client` / installed build dependencies is not represented as a passed full-project build here.
