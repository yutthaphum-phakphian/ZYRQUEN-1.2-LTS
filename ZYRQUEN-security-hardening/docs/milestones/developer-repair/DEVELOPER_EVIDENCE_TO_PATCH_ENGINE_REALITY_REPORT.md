# CodeVoice AI — Developer Evidence-to-Patch Engine Reality Report

## Capability
Implemented a bounded Evidence-to-Patch layer for the developer repair workflow.

Flow:

`VERIFY -> FAILURE EVIDENCE -> REPAIR PLAN -> PATCH PREVIEW -> APPROVAL -> APPLY -> VERIFY`

## Implemented
- `server/developerPatchEngine.ts`
- deterministic patch preview for CREATE/UPDATE/DELETE
- controlled-workspace target validation
- duplicate-target rejection
- expected-hash validation during preview
- before/after SHA-256 hashes
- human-readable line diff preview
- deterministic `patchHash` binding the approved operation set and observed file state
- explicit approval/hash check before mutation
- new API: `POST /api/runtime/developer-workflow/repair/patch-preview`
- repair loop now validates the patch preview/hash before applying changes
- durable transaction is committed with patch evidence after filesystem application
- verification is run again after repair

## Safety boundaries
- patch preview never mutates the workspace
- approval is mandatory
- a different patch hash is rejected
- path traversal is rejected
- expectedHash protects against stale workspace state
- worker fence is still required before repair execution
- retry remains bounded to three attempts

## Important reality boundary
The developer workflow currently operates on a controlled filesystem workspace (`workspaceRoot`), while the existing durable workspace transaction subsystem stores a separate durable workspace representation. This milestone records the filesystem repair in a durable transaction and audit event, but it does **not** claim a single ACID transaction spanning both the filesystem and durable workspace store.

A future filesystem transaction coordinator should close that gap if strict crash-consistent cross-store semantics are required.

## Validation
- Developer patch engine milestone: PASS
- Developer repair planner milestone: PASS
- Developer repair loop milestone: PASS
- Existing developer workflow verification milestone: expected to remain compatible; full project lint/build are not asserted here.

## Full project status
Previously observed environment-level limitations remain relevant:
- `npm run lint`: not verified successfully because `vite/client` type definitions were unavailable in the environment.
- `npm run build`: not verified successfully because the `vite` executable was unavailable in that environment.
