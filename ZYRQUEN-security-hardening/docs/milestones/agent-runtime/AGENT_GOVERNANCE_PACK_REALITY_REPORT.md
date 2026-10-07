# CodeVoice AI — Agent Governance Pack Reality Report

## Scope
This pack hardens the existing agent runtime rather than creating a parallel architecture.

- Durable coordination now records the authorized agent set.
- Task claims require agent authorization and a registered capability.
- Claims receive bounded renewable leases.
- Lease heartbeat and explicit release are supported.
- Expired claims return to `PENDING` on subsequent coordination operations.
- Dependency graphs reject unknown dependencies, self-dependencies, duplicate task IDs, and cycles.
- Deterministic simulations are now persisted as durable evidence.

## APIs
- `POST /api/runtime/agent/coordination`
- `POST /api/runtime/agent/coordination/:id/claim`
- `POST /api/runtime/agent/coordination/:id/heartbeat`
- `POST /api/runtime/agent/coordination/:id/release`
- `POST /api/runtime/agent/coordination/:id/complete`
- `POST /api/runtime/agent/simulate`

## Verification
`milestone-agent-governance-pack.test.ts`: PASS

The test covers agent authorization, leased claims, heartbeat, dependency blocking, release/reclaim, completion, durable coordination state, and durable simulation evidence.

## Reality boundary
Leases are durable coordination guards, not a distributed consensus protocol. Expiry is reconciled when coordination state is accessed; there is no background lease daemon in this pack. Capability checks use the existing local registry and risk ceiling. Persisted simulations are deterministic planning evidence, not model-generated execution or a guarantee that future runtime conditions will match the simulation.
