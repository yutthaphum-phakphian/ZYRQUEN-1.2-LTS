# Production Agent Reliability Layer — Reality Report

## Capability
Closed-loop reliability control for developer repair/recovery workflows.

## Implemented
- `server/agentReliabilityControlLoop.ts`
- `POST /api/runtime/recovery/reliability-pass`
- Durable repair inventory discovery using the stored durable record ID and the embedded `repairId` payload.
- Automatic recovery of non-terminal repair coordinator records (`PREPARED`, `APPLYING`, `APPLIED`, `RECOVERY_REQUIRED`) when governance is not quarantined and a recovery worker identity is supplied.
- Never invents source-code patches.
- Never mutates a quarantined project.
- Re-runs governance and integrity inspection after recovery.
- Produces a bounded outcome: `HEALTHY`, `HEALED`, `DEGRADED`, or `QUARANTINED`.
- Optional durable mission event journal entry for reliability passes.

## Important correctness fix discovered during this milestone
The earlier governance/integrity inventory code attempted to derive the original `repairId` by stripping `repair-coordinator-` from the durable filename. Durable IDs are hashed from the original repair ID, so that approach could silently produce an empty inventory.

This milestone fixes the inventory path by loading the durable envelope using its actual stored ID and reading `payload.repairId`. This makes governance and integrity sweeps inspect real repair records instead of assuming filename reversibility.

## Reliability semantics
1. Governance evaluates the project before recovery.
2. `QUARANTINED` blocks automatic recovery.
3. Non-terminal repair records can be handed to a recovery worker.
4. Recovery still enforces the existing worker fence and durable transaction coordinator.
5. Integrity is re-evaluated after the recovery pass.
6. Corruption remains fail-closed.
7. The reliability loop does not generate arbitrary code changes.

## Validation
- Recovery governance milestone: PASS
- Recovery integrity governor milestone: PASS
- Recovery chaos certification: PASS (6 scenarios)
- Agent reliability control loop: PASS

## Known environment boundary
The project-wide `npm run lint` / `npm run build` status remains environment-dependent from earlier milestones. The known runtime reports are:
- lint: `NOT_VERIFIED` when `vite/client` type definitions are unavailable
- build: `NOT_VERIFIED` when the `vite` executable is unavailable

This milestone does not claim a full production build from this environment.
