# Agent Run Control — Reality Report

## Scope
Adds a durable, policy-aware run control layer above planning and simulation.

## Implemented
- `server/agentRunController.ts`
  - creates durable agent runs
  - evaluates project policy for every planned capability
  - links plan + simulation + policy decisions into one auditable run
  - explicit lifecycle: BLOCKED / APPROVAL_REQUIRED / READY / APPROVED / CANCELLED / COMPLETED / FAILED
  - approval records actor, timestamp and approval hash
  - transition guards prevent invalid lifecycle jumps
- `server/durableStore.ts`
  - adds `agent-run` durable record kind
- `server/runtimeObservability.ts`
  - includes `agent-run` observations
- `server.ts`
  - run create/read/approve/cancel/complete APIs
- `tests/milestone-agent-run-control.test.ts`
  - policy-gated approval flow
  - durable reload
  - blocked agent flow
  - cancellation and completion

## Boundaries
- This milestone does not execute filesystem mutations by itself.
- Approval is a durable runtime decision; external identity/authentication is not provided here.
- Completion records the run lifecycle result; actual tool execution remains downstream.
