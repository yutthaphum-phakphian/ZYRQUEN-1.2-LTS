# nimbusOS — Cloud Workspace Command Center

**Phase 10 · Observability + Event Stream + System Health · Local-first · Thai-first · No Cloud Integration**

A local-development Workspace Core with an independent provider-neutral architecture. Phase 10 adds a read-only Observability layer over the existing Workspace, Command, Event, Audit, Resource, Runtime and Knowledge infrastructure: bounded operational Event Stream, evidence-bound System Health, local metrics, correlation fields, and secret redaction. Phase 09 adds a local Knowledge layer with real browser-file ingestion, exclusion policy, incremental hashing, deterministic chunking, lexical search, provenance-rich context retrieval, and shared durable audit records. Phase 08 adds a durable, append-only Command audit trail — `commandId`-idempotent, terminal-only, retention-capped — persisted alongside the existing Workspace store. Phase 07 added a Browser Web Worker Runtime adapter with explicit lifecycle capabilities, a Core-only capability query, and honest UI coverage of its scope and limitations. Earlier phases provide hardened Resource/Quota validation and recovery. The interface uses Graphite / Arctic Blue with restrained Sea-glass status accents.

## Architecture boundary

```text
Application Shell / Command Center
    ├─ Read-only Workspace / Event / Overview queries
    └─ Command Engine
          ├─ request snapshot + validation
          ├─ idempotency + FIFO per-Workspace lock
          └─ PENDING → RUNNING → SUCCEEDED | FAILED
                    ↓
             Workspace Provisioner
               ├─ Workspace domain + Repository
               ├─ State Machine transitions + compensation
               ├─ Resource / Quota Engine with pre-release commit
               ├─ Internal Event Bus
               └─ RuntimeAdapter interface
                         ↓
                  LocalRuntimeAdapter
```

The frozen Platform facade does not expose Repository, Runtime Adapter, State Machine, Resource Engine, or Event emission handles. UI lifecycle actions pass only through Command Engine; Knowledge operations pass through `WorkspacePlatform.knowledge` and its own repository boundary. No cloud/provider, AI, authentication, billing, deployment, or external API integration exists.

## Phase 05 recovery behavior

- Create failure destroys a known Runtime handle before releasing quota.
- If Runtime cleanup fails, the Workspace enters `ERROR` with its handle and quota reservation preserved; restored local quota includes nonzero `ERROR` allocations.
- Quota is released only after a zero-allocation Workspace snapshot has been persisted through Resource Engine's queued pre-release callback.
- If runtime teardown succeeds but a later storage/delete step fails, an `ERROR` record retains the truthful cleared-handle state and supports a safe DESTROY retry.
- Composition-root test doubles verify partial failures, resource recovery, retry behavior, and event-consistent state persistence.

## Phase 06 quota guardrails

- Resource requests accept known resource kinds only; restore rejects duplicate/malformed Workspace allocations atomically.
- Local Storage reconstruction restores nonzero `ERROR` reservations, and Commands/Overview wait until quota restore has completed.
- Overview shows only actual `ERROR` Workspaces that still retain a Runtime handle or quota reservation. Retry is confirmed and sent through `DESTROY_WORKSPACE` in Command Engine.
- Host Resource usage remains `UNAVAILABLE`; displayed values are reservations against local configuration, not telemetry.

## Phase 08 command audit trail

- `WorkspacePlatform.audit.list(workspaceId?)` returns a durable, structurally-validated shared `AuditRecord[]` trail containing Command and Knowledge records, separate from `commands.list()`'s live in-memory session history — it survives a page reload.
- Only terminal (`SUCCEEDED`/`FAILED`) records are written, once, keyed by `commandId`; replaying an idempotent command never duplicates an entry.
- Persisted to the browser's `Storage` (`nimbusos.command-audit.v1`), capped at 500 records with oldest-first rotation — local, single-device durability, not a tamper-evident or legal-grade ledger. See [Audit](docs/audit.md).
- A persistence failure (e.g. Storage quota) never rewrites an already-settled `CommandRecord`; the audit write is best-effort and cannot break a Core command result.

## Phase 09 local Knowledge

- `WorkspacePlatform.knowledge` exposes source discovery, incremental indexing, file removal/rename, stale marking, lexical/path/metadata search, and bounded context retrieval.
- Browser file picker input is real file content; no host filesystem access is claimed. Secrets, generated directories, unsupported extensions, and private-key material are excluded before persistence.
- Search results include scope, source/document/chunk identity, content hash, offsets/line ranges, and an explicit score type. No embeddings or semantic similarity are claimed. See [Knowledge](docs/knowledge.md).

## Phase 10 Observability

- `WorkspacePlatform.eventStream` projects the existing bounded `LocalEventBus` into source/severity/correlation-aware operational events; it is session-only and is not audit persistence.
- `WorkspacePlatform.observability` derives System Health and metrics from actual repositories, CommandEngine, ResourceEngine, RuntimeAdapter, AuditRepository and KnowledgeRepository evidence.
- No evidence is reported as healthy automatically: absent Workspace scope is `UNKNOWN`, absent providers are `NOT_CONFIGURED`, and unsupported host process telemetry is `UNSUPPORTED`. Host CPU/RAM/latency remains unavailable.
- Secrets are redacted before Event Stream projection and AuditRepository persistence. See [Observability](docs/observability.md).

## Phase 07 local runtime

- The Runtime adapter uses a fixed lifecycle Worker scoped to the current Browser tab; it is not an OS process, shell, container, or user-code execution environment.
- The Core facade exposes a frozen capability snapshot; all Workspace lifecycle commands still follow Command Engine → State Machine → Provisioner → Runtime Adapter.
- No host filesystem, host telemetry, general network operation, background execution, cloud, AI provider, external API, or provider integration is added.

## Local development

```bash
pnpm install
pnpm run dev
```

Workspace records use browser `localStorage` (`nimbusos.workspace-core.v1`), labeled `LOCAL_DEVELOPMENT_STORAGE`; this is not production persistence. Command history, idempotency keys, and bounded Internal Events are in-memory and reset when the Core instance/page is reloaded.

## Verification

```bash
pnpm run check    # TypeScript
pnpm run lint     # ESLint (TypeScript Core, Local Runtime Adapter, dashboard)
pnpm test         # Vitest unit tests
pnpm run build    # Vite + existing static project build
```

## Current limitations

- `LocalRuntimeAdapter` runs a fixed lifecycle Worker inside the active Browser tab; it is not an OS process, and has no Shell, host Filesystem, User-code execution, or host telemetry. Worker state is not restored across a page refresh.
- Host CPU/Memory/Storage usage is `UNAVAILABLE`; visible resource values are Core quota reservations against local policy limits.
- Command audit records are durable (survive a reload, see [Audit](docs/audit.md)), but this is local, single-device Storage — not a tamper-evident, legal-grade, or cross-device ledger, and it is lost if site data is cleared. State Transition History and the live `commands.list()` session feed remain volatile as before.
- Idempotency is limited to the active Platform instance (not distributed/transactional exactly-once execution).
- There is no database transaction spanning Local Storage, quota memory, and a real Runtime. Unknown provider-side partial creates cannot be cleaned up unless an adapter returns a discoverable handle.
- Runtime Logs, server/database persistence, authentication, AI Agents, embeddings, semantic retrieval, cloud/container runtime, external APIs, billing, and remote deployment remain out of scope.
- Project, Service, Process, Task and AI providers remain `NOT_CONFIGURED` or `UNSUPPORTED`; Observability does not fabricate registries, processes, tasks, model metrics, CPU/RAM usage or latency.
- Automated runtime doubles exist only in tests; app startup does not seed example Workspace or transition records.

See [Architecture](docs/architecture.md), [Observability](docs/observability.md), [Knowledge](docs/knowledge.md), [Commands](docs/commands.md), [Audit](docs/audit.md), [Provisioner](docs/provisioner.md), [Resources & Quotas](docs/resources.md), [Lifecycle](docs/lifecycle.md), [Runtime](docs/runtime.md), and [Development](docs/development.md).
