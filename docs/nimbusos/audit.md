# Shared Audit Trail — Foundation Through Phase 10

## Boundary

`commands.list()` (see [Commands](commands.md)) is this session's live, in-memory `CommandRecord` history — it resets on reload. `audit.list()` is a separate, durable trail of terminal `CommandRecord` and `KnowledgeAuditRecord` entries. Knowledge operations write through the same repository; nothing creates a second audit store, and UI reads it only through `WorkspacePlatform.audit.list()`.

```text
CommandEngine.executeOnce()
  → dispatch to Provisioner (unchanged)
  → record.status settles to SUCCEEDED | FAILED
  → AuditRepository.append(record)   (best-effort, never rewrites the result)
  → return record to caller (unchanged)
```

## What is — and is not — persisted

Only **terminal** records are written. `PENDING`/`RUNNING` snapshots stay in the in-memory `CommandEngine.history` only; the audit trail never records a command that has not actually finished, so it can never be read as claiming an operation succeeded before it did.

`AuditRepository.append` is idempotent per `commandId`: replaying the same finished command (e.g. via the Command Engine's own idempotency-key replay) does not create a duplicate entry.

Knowledge records use `recordType: "KNOWLEDGE"` and are idempotent per `auditId`. Their action types include index start/completion/failure, source exclusion, document update, and search. Knowledge audit writes are best-effort and never rewrite a truthful indexing/search result.

## Storage

`LocalStorageAuditRepository` persists to the browser's `Storage` under `nimbusos.command-audit.v1`, structurally validated on every read the same way `LocalStorageWorkspaceRepository` validates Workspace records (see [Persistence](development.md)). It is capped at 500 records by default; once full, the **oldest** record is dropped first. This is honest, local, single-device durability:

- It survives a page reload.
- It does **not** survive clearing site data / browser storage.
- It is **not** a tamper-evident or legal-grade ledger — any code with access to the same `Storage` could edit it directly. There is no signing, hashing, or write-once enforcement beyond the repository's own API surface.
- It does not sync across devices or tabs beyond what the browser's own Storage does.

Outside a browser (`storage` unavailable), the Platform falls back to `InMemoryAuditRepository`, which behaves identically except that it does not survive a reload — this keeps the facade usable in tests and non-browser hosts without silently claiming durability it cannot provide.

## Failure handling

A write failure in `AuditRepository.append` (e.g. Storage quota exceeded) is caught inside `CommandEngine.executeOnce` and does not change the `CommandRecord` already returned to the caller — the Workspace-affecting part of the command already actually happened (or actually failed) by that point, and the audit write is a secondary durability concern, not a reason to misreport it. This mirrors the existing rule for event-bus subscriber errors: *"A UI subscriber cannot break a Core operation."*

## Reading the trail

```ts
const recent = await platform.audit.list();        // all workspaces, newest first
const forOne = await platform.audit.list(workspaceId); // one workspace, newest first
```

Both are read-only, structurally cloned on the way out — mutating the returned array or its entries has no effect on stored state.
