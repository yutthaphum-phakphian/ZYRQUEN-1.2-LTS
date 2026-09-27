# Resources and Quotas — Phase 06

## Model

Resource values represent Core quota reservations, not measured host consumption. `ResourceEngine.inspect()` reports `used: null` and `usageState: UNAVAILABLE`; it does not infer CPU, memory, disk, process, port, or runtime use from browser state.

`validate()` accepts a plain object containing only known resource kinds, and each amount must be finite and non-negative. `allocate()` normalizes partial requests to zero-filled quantities, serializes reservations through one engine queue, rejects duplicate Workspace reservations, and rejects any reservation that would exceed a configured limit.

## Restore and ready boundary

At Platform startup, stored Workspace snapshots are listed and every nonzero allocation is reconstructed—including allocations attached to `ERROR` records awaiting cleanup. Duplicate/invalid IDs, unknown/missing resource kinds, invalid quantities, or aggregate totals above the configured cap reject restoration atomically without replacing the previous in-memory allocation map.

The Platform `ready` Promise represents successful quota restoration. UI-facing Command execution snapshots the request synchronously, then waits for `ready` before entering Command Engine history. Overview reads also wait for `ready`. This closes a startup race where a new reservation could otherwise be admitted just before stored allocations were reconstructed.

## Release boundary

`release(workspaceId, beforeCommit?)` serializes against other quota changes. If supplied, `beforeCommit` receives a detached allocation snapshot and must succeed before the reservation is deleted. A rejected callback keeps the allocation. Provisioner uses this to save an accurate Workspace snapshot with zero allocated resources before committing the release.

## Recovery UI

Overview derives the Cleanup Required queue from actual Workspace records only. A Workspace qualifies when it is in `ERROR` and still has a non-null Runtime handle or at least one positive allocated quantity. The Retry button asks for confirmation and submits the normal `DESTROY_WORKSPACE` command; UI does not touch Resource Engine, State Machine, Runtime Adapter, or storage directly. Allocation details are shown as reservations, never as telemetry.

## Verification

Vitest covers strict Resource validation, serial allocation, atomic restore rejection, pre-release callback failure retention, restored `ERROR` quota from Local Storage, startup readiness gating, and Workspace cleanup eligibility. Failure tests use injected repositories/resource engines at the composition root; the public Platform facade does not expose mutation handles.

## Limits

Local Storage snapshots and in-memory quota accounting are not a crash-atomic database transaction. There is no host measurement, cross-tab lock, durable event history, or provider integration. A real runtime adapter must eventually define how it discovers, reconciles, and idempotently destroys orphaned runtime handles before production usage.
