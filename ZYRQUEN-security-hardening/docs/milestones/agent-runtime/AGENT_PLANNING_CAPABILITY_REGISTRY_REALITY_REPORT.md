# CodeVoice AI — Agent Planning + Capability Registry Reality Report

## Scope
Adds a deterministic planning layer and explicit capability registry above the existing repair/recovery runtime.

## Implemented
- `server/agentCapabilityRegistry.ts`
- `server/agentPlanningLayer.ts`
- `GET /api/runtime/agent/capabilities`
- `POST /api/runtime/agent/plan`
- risk ceiling enforcement
- explicit capability requirements for approval, leader authority, and worker fencing
- dependency-ordered execution plan with re-verification
- audit SHA-256 over registry/plan evidence

## Boundary
The planner does not generate arbitrary code, patches, or hidden reasoning. It constructs a bounded execution plan from declared capabilities and safety constraints.

## Verification
`node --experimental-strip-types tests/milestone-agent-planning-capabilities.test.ts` — PASS
