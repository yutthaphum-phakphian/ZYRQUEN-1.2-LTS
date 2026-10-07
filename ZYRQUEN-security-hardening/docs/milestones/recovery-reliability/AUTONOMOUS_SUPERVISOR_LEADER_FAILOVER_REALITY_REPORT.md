# Autonomous Supervisor Leader Lease & Failover — Reality Report

## Purpose
Prevent multiple restored supervisor instances from executing the same reliability cycle concurrently, while allowing a fresh instance to take over after the durable leader lease expires.

## Implemented
- Durable leader lock per `supervisorId`.
- Runtime instance identity is ephemeral and is never restored as authority.
- Every tick acquires a fresh leader lease before incrementing the cycle.
- Concurrent supervisor instances are fail-closed when another instance owns the lease.
- Leader lease is released after each cycle, including failure paths.
- Worker lease remains separately fenced and ephemeral.
- Persisted supervisor state remains the source of truth for cycle/backoff/quarantine state.

## Safety boundary
The leader lease prevents duplicate active control loops but does not replace worker fencing. A supervisor must still acquire a fresh mission worker lease before recovery work.

## Validation
- `tests/milestone-supervisor-leader-failover.test.ts` — PASS
- `tests/milestone-autonomous-reliability-supervisor.test.ts` — PASS
- `tests/milestone-agent-reliability.test.ts` — PASS

## Result
Supervisor control authority is now separated into:
1. durable supervisor state,
2. ephemeral supervisor leader lease,
3. ephemeral fenced mission-worker authority.

This keeps restart/failover durable without accidentally persisting executable authority across process lifetimes.
