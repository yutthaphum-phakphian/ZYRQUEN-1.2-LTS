# Command Engine — Phase 04

## Boundary

The Command Engine is the sole UI-facing mutation boundary. UI code submits a `CommandRequest` to `WorkspacePlatform.commands.execute()`. The engine snapshots the request, validates it, serializes operations per Workspace, and delegates accepted lifecycle operations to the Provisioner. UI code does not call the State Machine, Repository, Resource Engine, Runtime Adapter, or Event emitter directly.

```text
UI → CommandRequest → validation + idempotency → WorkspaceLock → Provisioner → State Machine / RuntimeAdapter
```

## Request contract

A request contains `workspaceId`, `commandType`, and optional `commandId`, `requestedAt`, and command-specific `payload`. `commandId` is the idempotency key; if omitted, the engine generates one. CREATE accepts only a non-empty name (1–80 chars), recognized finite non-negative resource quantities, and flat primitive Workspace metadata. Other commands do not accept payload fields. Unknown request/payload keys, invalid timestamps, invalid resource kinds, and malformed values are rejected before a command record is created.

## Execution lifecycle

Every accepted request produces one in-memory `CommandRecord`:

```text
PENDING → RUNNING → SUCCEEDED | FAILED
```

- `requestedAt` records acceptance; `startedAt` remains null while queued; `completedAt` remains null until execution settles.
- The per-Workspace lock preserves FIFO serialization and prevents concurrent operations from observing partially committed lifecycle state.
- Runtime/Provisioner failures are represented as `FAILED` records with typed error details; invalid request validation and conflicting idempotency-key reuse reject before execution.
- Results and `commands.list()` are defensive clones.

## Idempotency

Within the lifetime of one Core Platform instance, replaying a `commandId` with the same normalized Workspace, command, and payload awaits the existing execution and returns a defensive copy of its result; it does not execute the mutation again. Reusing the key for a different semantic request throws `COMMAND_ID_CONFLICT`. The idempotency map and `commands.list()` live history are in-memory only and reset on reload; this is not durable distributed idempotency. A terminal record of each command is separately persisted to the durable audit trail — see [Audit](audit.md) — but that trail is a read-only record of what happened, not a substitute for the in-memory idempotency map (a reload still allows a previously-`commandId`'d request to run again as a fresh command).

## Events and State Transition History

The engine emits `COMMAND_QUEUED`, `COMMAND_STARTED`, and a terminal `COMMAND_EXECUTED` or `COMMAND_FAILED` event. It propagates its `commandId` to Provisioner lifecycle methods. After a State Machine result has been saved to the Workspace Repository, Provisioner emits `STATE_TRANSITIONED` with `fromStatus`, `toStatus`, `workspaceName`, and `commandId`; the event timestamp is the exact persisted Workspace `updatedAt`.

The Overview timeline displays the newest eight actual transition events and never seeds sample history. Transition events, command records, and event history remain in the current in-memory session; refreshing the page clears history (Workspace records remain in local development storage).
