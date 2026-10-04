# Autonomous Reliability Supervisor — Reality Report

## Capability
Adds a bounded autonomous control loop around the existing Agent Reliability Layer.

## Flow
Supervisor start → fenced recovery-worker lease → reliability pass → release lease → schedule/backoff → quarantine stop on unsafe outcome.

## Safety properties
- Does not invent code changes.
- Recovery authority is obtained through the existing mission-worker lease/fencing path.
- Each cycle uses a fresh recovery worker identity and releases it after the pass.
- `QUARANTINED` is terminal for the supervisor instance; `start()` refuses to restart it.
- Failures enter bounded exponential backoff rather than hot-looping.
- Maximum cycle count is bounded.
- Snapshot contains an audit SHA-256 hash.

## API
`POST /api/runtime/recovery/reliability-supervisor/tick`

The endpoint performs one bounded supervisor cycle and returns both the reliability result and supervisor snapshot.

## Validation
- Agent reliability control loop: PASS
- Recovery governance: PASS
- Recovery integrity governor: PASS
- Recovery chaos certification: PASS (6 scenarios)
- Autonomous reliability supervisor: PASS

## Boundary
The supervisor is an orchestration/control loop. It does not generate arbitrary patches or claim general autonomous coding. Patch generation remains behind the existing planner/preview/approval/mutation pipeline.
