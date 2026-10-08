# Agent Governance Foundation Pack — Reality Report

## Scope
A larger governance layer was added on top of the existing planning, simulation, coordination, recovery and observability runtime.

## Implemented
- Durable per-project agent policy records.
- Per-agent capability grants and risk ceilings.
- Agent deny-list support.
- Mutation approval and high-risk leader requirements exposed as policy decisions.
- Coordination task claims now consult project policy before accepting an agent.
- Workspace reconciliation admission gate: aligned state is admitted; drift/missing/corrupt state is blocked and marked as requiring repair.
- Runtime observability now returns observations plus a bounded health snapshot.
- New APIs for policy read/write and reconciliation admission.

## APIs
- `POST /api/runtime/agent/policy`
- `GET /api/runtime/agent/policy/:projectId`
- `POST /api/runtime/reconciliation/admission`
- `GET /api/runtime/observability` now returns `{ observations, health }`

## Verification
`milestone-agent-governance-foundation.test.ts` passes.

## Reality boundaries
- Policy enforcement is local to this runtime's durable coordination path; it is not an external identity provider.
- Capability grants do not authenticate an agent; callers still need a trusted agent identity at the integration boundary.
- Reconciliation admission evaluates the supplied file set; it does not independently scan arbitrary host paths.
- Health summarization is derived from persisted runtime records and is not a complete external telemetry system.
- Approval/leader flags are policy decisions; actual approval and leader enforcement remain enforced by the downstream execution/recovery layers.
