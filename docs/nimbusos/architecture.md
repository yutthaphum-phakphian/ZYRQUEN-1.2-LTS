# Architecture — Foundation Through Phase 10

## Scope

nimbusOS remains a local-first development foundation, not a production control plane. Workspace Core has no dependency on cloud providers, external APIs, authentication, billing, AI services, or remote deployment systems.

## Dependency direction

```text
React UI
  ├─ WorkspacePlatform.workspaces / overview / events / eventStream / audit / observability (read-only queries)
  └─ WorkspacePlatform.commands.execute(CommandRequest)
       ├─ immutable request snapshot + strict validation
       ├─ session-scoped idempotency key
       ├─ PENDING → RUNNING → SUCCEEDED | FAILED history
       └─ per-Workspace FIFO lock
            └─ WorkspaceProvisioner
                 ├─ Workspace domain + Repository contract
                 ├─ WorkspaceStateMachine
                 ├─ ResourceEngine
                 ├─ RuntimeAdapter interface
│    └─ LocalRuntimeAdapter (fixed Browser Web Worker, tab-scoped)
                 └─ LocalEventBus
```

The frozen Platform facade exposes command execution/history plus read-only Workspace, Event, Event Stream, Audit, Observability, Overview, Knowledge, and detached Runtime capability queries. It does not expose Repository, Runtime Adapter, State Machine, Resource Engine, or Event emission handles. UI lifecycle actions pass only through Command Engine; Observability has no mutation handle.

## Command Engine invariants (Phase 04)

- Requests are deep-snapshotted before asynchronous work; caller mutation after submission cannot change an accepted command.
- Command and CREATE payload keys/values are validated before a record is created. Invalid requests are rejected; accepted operation failures resolve to truthful `FAILED` records.
- One command ID maps to one normalized semantic request for the lifetime of the local Platform. Identical retries await the same underlying execution and return defensive result copies; a different request under the same key raises `COMMAND_ID_CONFLICT`.
- Accepted requests receive in-memory lifecycle records and queue/start/terminal command events. Per-Workspace FIFO locks prevent conflicting lifecycle work from interleaving.
- Provisioner emits `STATE_TRANSITIONED` only after the corresponding Workspace snapshot is saved (or deleted, for the final destroy transition). Each event contains old/new status, Workspace identity/name, and the owning command ID; its timestamp matches that transition's `updatedAt`.
- The Overview timeline reads actual internal Event Bus events. It uses an honest empty state and never fabricates transitions.
- Live command records, idempotency keys, and events exist only for the current Page/Core instance. Terminal command records are also copied to the local, retention-capped audit repository; this is not cross-tab coordination or exactly-once distributed execution.

## Workspace Core and persistence

`createWorkspaceRecord` normalizes identity/name and validates initial state using the injected adapter identifier. `validateWorkspace` checks identity, lifecycle/runtime states, finite non-negative resources, metadata values, timestamps, and runtime/error references. Both repository implementations validate writes; reads return defensive copies. Local Storage restore rejects malformed records and duplicate IDs instead of silently accepting corruption.

The browser stores Workspace records under `nimbusos.workspace-core.v1`, labeled `LOCAL_DEVELOPMENT_STORAGE`. It is development storage, not production persistence. Configured quotas are Core policy; actual host usage remains `UNAVAILABLE` until a real runtime capability exists.

## Resource / Quota invariants (Phase 06)

- Resource requests accept a plain object of known kinds with finite, non-negative values; partial requests normalize missing kinds to zero.
- `ResourceEngine.restore` validates the full allocation set—including unique non-empty Workspace IDs, complete known resource keys, valid amounts, and aggregate limits—before replacing the current in-memory map.
- Platform startup restores all nonzero Workspace allocations, including `ERROR` records. The UI-facing command wrapper snapshots each request synchronously and then waits for `ready`; Overview reads wait for the same successful restore.
- `workspaceNeedsCleanup` is true only for `ERROR` snapshots that retain a Runtime handle or positive allocation. The Overview recovery button asks for confirmation and dispatches `DESTROY_WORKSPACE`; it has no direct Repository, quota, State Machine, or Runtime capability.
- The quota display contains configured reservations only. Measured host usage remains `UNAVAILABLE`.

## Failure behavior

Commands return `SUCCEEDED` or `FAILED` records for execution outcomes. Provisioner errors produce `ERROR` when the lifecycle permits it and emit transition/error events after persistence. Create compensation destroys a known runtime handle before quota release; cleanup failure retains the handle and reservation and returns `PROVISIONING_COMPENSATION_FAILED`. Error-state reservations are included in local quota restoration. The Browser Worker is tab-scoped and never reports itself as an OS process or host telemetry source.

Resource release takes an optional pre-release commit callback executed while the Resource Engine queue is held. Destroy persists a Workspace snapshot with the runtime handle cleared and allocated resources zero before the reservation is removed. A failed save leaves the reservation intact; a subsequent DESTROY retry is safe after a completed runtime destroy. The filesystem/localStorage record and in-memory quota are still not a crash-atomic database transaction.

See [Provisioner Phase 08](provisioner.md) for the create, compensation, teardown, and retry sequences.

## Integration boundary

No external integration is implemented. Future adapters remain behind RuntimeAdapter and Provisioner; provider-specific imports do not belong in Workspace Core. Phase 08 does not activate AI, network APIs, remote runtimes, cross-device audit synchronization, or external systems.


## Knowledge Layer (Phase 09)

The local Knowledge layer is composed below the UI and above a separate `KnowledgeRepository` contract:

```text
React UI
  └─ WorkspacePlatform.knowledge
       └─ KnowledgeEngine
            ├─ exclusion policy + incremental content hashing
            ├─ deterministic chunking + lexical/path/metadata search
            ├─ provenance-rich ContextPack retrieval with explicit budget
            ├─ KnowledgeRepository (Local Storage or InMemory)
            └─ existing AuditRepository (shared command/knowledge trail)
```

No Project registry, host Filesystem, AI Session, embedding service, Workflow registry, Tool Registry, cloud provider, or external API existed in the Phase 08 baseline, so Phase 09 keeps those boundaries explicit rather than fabricating implementations. `projectId` is an explicit scope value, file ingestion is browser-picker based, and search results report `MATCH_COUNT`/`PATH_MATCH`/`METADATA_MATCH` instead of semantic similarity.


## Observability Layer (Phase 10)

Phase 10 adds a read-only projection over existing infrastructure; it does not add an event store or telemetry store:

```text
WorkspaceRepository / CommandEngine / LocalEventBus / AuditRepository
ResourceEngine / RuntimeAdapter / KnowledgeRepository
                         ↓
              ObservabilityService
                 ├─ bounded EventStream projection
                 ├─ evidence-bound SystemHealth
                 └─ local Metrics snapshot
```

`LocalEventBus` remains the event source and is now retention-bounded. `AuditRepository` remains durable accountability storage. Runtime usage values stay `UNAVAILABLE`; AI, Project, Service and Task providers remain `NOT_CONFIGURED`; host process telemetry is `UNSUPPORTED`. Observability has no mutation handle and cannot alter lifecycle, quota, runtime, Knowledge, or Audit state. See [Observability](observability.md).
