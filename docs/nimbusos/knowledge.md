# Knowledge Layer — Phase 09

## Scope

Phase 09 adds a **local-first Knowledge foundation** on top of the existing Workspace Core. It is not a cloud knowledge service, vector database, LLM memory, filesystem daemon, or semantic-search claim.

The active path is:

```text
Browser file picker
  → KnowledgePanel
    → WorkspacePlatform.knowledge
      → KnowledgeEngine
        → KnowledgeRepository (InMemory or LocalStorage)
        → existing AuditRepository
```

The existing `WorkspaceRepository`, `RuntimeAdapter`, `EventBus`, `ResourceEngine`, and `CommandEngine` remain the source of truth for their own domains. Knowledge does not create a second Workspace or audit store.

## Current truth boundaries

- **Project registry:** not present in the Phase 08 baseline. Phase 09 therefore treats `projectId` as an explicit scope supplied by the caller/UI (`workspace-root` is the default UI scope); it does not invent project records.
- **Filesystem:** no host filesystem access exists. Files enter Knowledge only through the user’s browser file picker. The selected file path, browser-provided mtime, and file contents are the actual input.
- **AI Session:** no AI session or model provider exists. Knowledge exposes deterministic search/context primitives only.
- **Embeddings:** not implemented. `LEXICAL_SEARCH` uses token occurrence counts and reports `MATCH_COUNT`; `PATH_SEARCH` and `METADATA_SEARCH` report their own score types.
- **Context budget:** `ContextBudget` is an explicit contract with approximate character-to-token estimation (`ceil(chars / 4)`). It never claims provider-specific tokenization.
- **Workflow / Tool Registry:** no pre-existing registry was found in the baseline. Phase 09 does not fabricate one; indexing/search are ordinary Platform operations and are audit-recorded.

## Knowledge model

- `KnowledgeSource` describes a discovered file and its status: `NOT_INDEXED`, `INDEXING`, `INDEXED`, `STALE`, `ERROR`, or `EXCLUDED`.
- `KnowledgeDocument` stores normalized path, content hash, byte size, mtime, and chunk IDs.
- `KnowledgeChunk` stores bounded content with offset and line provenance.
- `KnowledgeSearchResult` always returns workspace/project scope, source ID, content hash, path, line range, and score type.
- `ContextPack` is a bounded selection of search results plus provenance and remaining budget.

## Indexing behavior

`KnowledgeEngine.indexFiles` is incremental:

1. Normalize path and apply exclusion policy.
2. Mark excluded paths without storing their content.
3. Hash content (`SHA-256` when available, deterministic FNV-1a fallback).
4. Skip unchanged content.
5. Chunk Markdown by headings, TypeScript/JavaScript by declarations, and other supported text by bounded character ranges.
6. Persist source, document, and chunks through one repository abstraction.
7. Record started/completed/failed/excluded/document-updated actions through the existing `AuditRepository`.

The exclusion policy blocks `node_modules`, `.git`, `dist`, `build`, `coverage`, `.env*`, credential/secret paths, private keys, unsupported extensions, and empty paths. This is a safe default, not a complete secret scanner.

## Persistence and audit

Browser deployments use:

- `nimbusos.knowledge.v1` for local Knowledge state.
- `nimbusos.command-audit.v1` for both Command and Knowledge audit records.

The audit repository remains append-only and retention-capped. Knowledge actions are discriminated by `recordType: "KNOWLEDGE"` and include `actionType`, scope, status, result, and error. Audit persistence is secondary: an audit write failure does not rewrite a truthful Knowledge result.

## UI

The Knowledge module supports:

- selecting real files through the browser picker;
- choosing an explicit project scope;
- indexing and seeing indexed/unchanged/excluded/error counts;
- source status and last-indexed time;
- local lexical search;
- provenance-rich result display;
- approximate context retrieval with budget/remaining values.

There are no sample documents, fake counts, fake telemetry, provider claims, or fabricated search results.
