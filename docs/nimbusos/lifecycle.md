# Workspace Lifecycle — Phase 03

All status changes go through `WorkspaceStateMachine.transition()`. The State Machine has no persistence, Runtime, Provider, or Event Bus side effects: it validates one transition and returns a detached, validated Workspace snapshot.

## Transition table

| Current state | Allowed next states                     |
| ------------- | --------------------------------------- |
| CREATING      | INITIALIZING, ERROR                     |
| INITIALIZING  | READY, ERROR                            |
| READY         | STARTING, DESTROYING, ERROR             |
| STARTING      | RUNNING, ERROR                          |
| RUNNING       | STOPPING, RESTARTING, DESTROYING, ERROR |
| STOPPING      | STOPPED, ERROR                          |
| STOPPED       | STARTING, DESTROYING, ERROR             |
| RESTARTING    | RUNNING, ERROR                          |
| DESTROYING    | DESTROYED, ERROR                        |
| DESTROYED     | none (terminal)                         |
| ERROR         | DESTROYING                              |

`canTransition(from, to)` is false for undeclared pairs and unknown state values. `allowedTransitions(from)` returns a frozen copy; callers cannot change the module's transition table.

## Transition invariants

- The input must be a valid Workspace domain record and both lifecycle states must be declared.
- Same-state transitions and any unlisted transition are rejected with a typed `StateTransitionError`.
- The supplied transition timestamp must parse as a valid date and cannot precede the Workspace's latest `updatedAt` or `lastActivityAt`.
- A successful transition updates `status`, `updatedAt`, and `lastActivityAt` together, preserves other domain data, validates the result, and returns a detached snapshot.
- The input Workspace and nested metadata/resource objects remain unchanged.

## Orchestrated operation paths

- Create: `CREATING → INITIALIZING → READY` only if reservation and runtime `create()` succeed. In a Browser that supports Web Workers, `LocalRuntimeAdapter` starts a fixed, tab-scoped Worker; unsupported APIs or Worker failures are persisted truthfully as `ERROR` and any partial reservation is released.
- Start: `READY | STOPPED → STARTING → RUNNING` only if adapter `start()` succeeds.
- Stop: `RUNNING → STOPPING → STOPPED` only if adapter `stop()` succeeds.
- Restart: `RUNNING → RESTARTING → RUNNING`; a stopped Workspace uses `STOPPED → STARTING → RUNNING` and adapter `start()`.
- Destroy: `READY | RUNNING | STOPPED | ERROR → DESTROYING → DESTROYED`; runtime cleanup is requested only when an instance handle exists. On success, the record is removed after the terminal result/event is produced.

The Command Engine's per-Workspace lock serializes concurrent lifecycle commands. Failure enters `ERROR` only when that transition is allowed.

## Transition history events

After a successful transition snapshot has been saved, Provisioner emits a `STATE_TRANSITIONED` event with the old/new status, Workspace name/ID, owning `commandId`, and the exact transition `updatedAt` timestamp. The final `DESTROYING → DESTROYED` event is emitted after the terminal transition and record deletion. The Overview timeline reads these actual in-session events; there are no seeded or persisted mock transitions.
