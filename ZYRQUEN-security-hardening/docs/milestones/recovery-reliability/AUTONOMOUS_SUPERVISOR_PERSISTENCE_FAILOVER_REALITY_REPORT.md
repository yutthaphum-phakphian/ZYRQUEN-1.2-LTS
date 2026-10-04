# Autonomous Supervisor Persistence & Failover — Reality Report

## Implemented
- Added durable record kind `reliability-supervisor`.
- Supervisor state is persisted after start, stop, successful tick, failed tick/backoff, and max-cycle stop.
- Added `AutonomousReliabilitySupervisor.restore(...)` to reconstruct persisted state with identity checks.
- Added explicit persisted-state cleanup for tests/administration.
- Recovery supervisor API now restores the persisted supervisor before ticking instead of constructing a fresh in-memory supervisor on every request.
- Added status API for reading a persisted supervisor snapshot.
- Preserved worker lease/fencing as per-cycle ephemeral authority; leases are not persisted as reusable authority.

## Failure semantics
- A corrupted supervisor durable record fails closed through durable-record integrity validation.
- A persisted record whose project/mission identity does not match the requested supervisor is rejected.
- QUARANTINED and FAILED states are restored rather than silently reset.
- Backoff state (`consecutiveFailures`, `nextAllowedAt`) survives process restart.
- Cycle count survives restart, preventing a restarted process from bypassing the bounded-cycle limit.

## Validation
- Autonomous reliability supervisor: PASS
- Supervisor persistence/restore: PASS
- Agent reliability control loop: PASS
- Recovery governance: PASS
- Recovery integrity governor: PASS
- Recovery chaos certification: PASS (6 scenarios)

## Boundary
This milestone persists supervisor control state and restores it after process restart. It does not persist an active worker lease as reusable authority; every control cycle must acquire a fresh fenced worker lease. This keeps stale authority from surviving a process restart.

## Source of truth
`/mnt/data/nextwork`
