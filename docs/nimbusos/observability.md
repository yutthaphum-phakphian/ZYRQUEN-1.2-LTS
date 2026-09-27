# Observability + Event Stream + System Health — Phase 10

## Boundary

Phase 10 adds a read-only observability layer over existing Core infrastructure:

```text
WorkspaceRepository ─┐
CommandEngine ───────┤
LocalEventBus ───────┤→ ObservabilityService → SystemHealth / Metrics
AuditRepository ────┤                         → EventStream projection
ResourceEngine ─────┤
RuntimeAdapter ──────┤
KnowledgeRepository ─┘
```

It does not create a telemetry database, event database, audit database, host monitor, provider SLA, cloud integration, AI provider, or second lifecycle state machine.

## Event Stream

`WorkspacePlatform.eventStream` queries and subscribes to the existing `LocalEventBus`. It is an operational stream, not accountability persistence.

The normalized event projection includes:

- `eventId`, `timestamp`, `eventType`;
- derived `source` and `severity`;
- `workspaceId`, and correlation fields when present in the actual payload;
- redacted payload.

Sources and severities are derived from actual Core event types. The stream does not invent events for Project, Service, Process, Task, AI, or Knowledge when those systems do not emit them.

Event history is session-only and bounded to 500 records by `LocalEventBus`. Query results are additionally bounded to 500 records and support workspace, source, severity, event type, time, and tail-limit filters. Subscriptions emit the same normalized/redacted event shape as queries, return a cleanup function, and UI cleanup occurs on unmount.

## Health semantics

`ObservabilityService.health()` returns component evidence for:

- Core
- Workspace
- Runtime
- Execution
- Project
- Service
- Process
- Task
- AI
- Knowledge
- Audit

Health states are evidence-bound:

- `HEALTHY`: the component has an actual readable/available evidence source and no observed failure;
- `DEGRADED`: evidence exists but reports errors, failures, or reduced durability;
- `UNAVAILABLE`: the source could not be read;
- `UNKNOWN`: the component exists in the model but no evidence is available for the requested scope;
- `NOT_CONFIGURED`: no provider/registry/runtime is configured;
- `UNSUPPORTED`: the Local Runtime explicitly does not expose that capability.

Examples:

- No AI provider → `AI: NOT_CONFIGURED`.
- No Workspace scope → `Workspace: UNKNOWN`, Knowledge may be `NOT_CONFIGURED` for that scope.
- Local Runtime host process telemetry is not exposed → `Process: UNSUPPORTED`.
- Runtime `HEALTHY` means the fixed Browser Worker capability is available; it does not mean an active Workspace runtime, host operational health, or production readiness.
- Empty command history → `Execution: UNKNOWN`, not healthy.
- Empty Knowledge source set → `Knowledge: UNKNOWN`, not healthy.
- Runtime availability `NOT_CONFIGURED` → `Runtime: NOT_CONFIGURED`.

## Metrics

`WorkspacePlatform.observability.metrics()` aggregates actual local counts from WorkspaceRepository, CommandEngine, LocalEventBus, AuditRepository, ResourceEngine, RuntimeAdapter and KnowledgeRepository. It does not expose CPU, RAM, disk use, latency, token counts, success rates, or semantic scores because no actual source exists.

The resource view reports configured reservations and `usageState: UNAVAILABLE`. Knowledge retains Phase 09 lexical `MATCH_COUNT` semantics.

## Security

The shared `redactSensitive` utility is used before Event Stream projection and AuditRepository persistence. It redacts sensitive keys and common token forms. This is defense-in-depth, not a complete secret scanner. Phase 09 environment/private-key exclusion remains unchanged.

## API

The Platform exposes:

```ts
platform.eventStream.query({ limit: 30 });
platform.eventStream.subscribe(listener); // returns cleanup
platform.observability.health();
platform.observability.metrics();
platform.observability.workspaceHealth(workspaceId);
```

The Observability layer has no mutation handle and cannot change Workspace lifecycle, quota, runtime, Knowledge, or Audit state.

## UI

The Observability module shows:

- System Health component grid;
- evidence-derived metrics;
- Event Stream with time/source/severity/workspace/correlation;
- Recent Failures from actual ERROR/CRITICAL events;
- selected Workspace health evidence;
- Runtime, Execution, Knowledge and AI status;
- honest empty, unknown, not-configured and unsupported states.
