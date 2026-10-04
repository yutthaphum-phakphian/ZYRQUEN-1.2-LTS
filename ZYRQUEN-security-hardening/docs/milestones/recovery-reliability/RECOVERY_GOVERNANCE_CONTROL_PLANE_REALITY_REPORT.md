# Recovery Governance Control Plane — Reality Report

## Purpose

Adds a fail-closed governance layer above crash-consistent repair and recovery integrity. A repair mutation is admitted only when the target project has no known corrupt repair state.

## Implemented

- `server/recoveryGovernance.ts`
- durable record kind `recovery-governance`
- governance states: `OPEN`, `DEGRADED`, `QUARANTINED`
- admission decision: `ADMIT` / `BLOCK`
- project-scoped integrity sweep over repair coordinator records
- critical unreadable repair records fail closed
- durable governance decision with SHA-256 audit hash
- optional mission journal evidence for each admission decision
- repair loop admission gate before mutation
- APIs:
  - `GET /api/runtime/recovery/governance/:projectId`
  - `POST /api/runtime/recovery/governance/admit`

## Safety semantics

- `OPEN`: no corrupt repair evidence detected; repair admission allowed.
- `DEGRADED`: recovery-required repair exists; admission remains allowed but is explicitly observable.
- `QUARANTINED`: corrupt or unreadable repair evidence exists; new repair mutation is blocked.
- The governor fails closed when a durable repair record cannot be verified.

## Validation

- Recovery governance milestone: PASS
- Recovery integrity governor: PASS
- Recovery chaos certification: PASS (6 scenarios)

## Boundary

This is a local durable governance layer, not a distributed consensus system. It does not claim cross-process/host consensus or external database durability.
