# V33 — Atomic Workspace Commit Reality Report

## Scope
V33 adds a durable commit-coordinator protocol around fenced workspace mutations.

Flow:

`Worker Fence → Mission Lock + Workspace Lock → Durable COMMIT PREPARED → Fenced Workspace Mutation → APPLIED Evidence → Fence Check → Transaction COMMITTED → Coordinator COMMITTED`

## Implemented

- `server/atomicWorkspaceCommit.ts`
- Durable `transaction-commit` record kind
- Mission-scoped and workspace-scoped durable locks
- Worker fence validation before lock acquisition and before final commit
- Durable coordinator states: PREPARED / APPLIED / COMMITTED / ABORTED
- Idempotent terminal commit lookup
- Recovery helper for APPLIED + PREPARED state
- Server API:
  - POST `/api/durable/transaction/:transactionId/workspace/atomic-commit`
  - GET `/api/durable/transaction/:transactionId/atomic-commit`
  - POST `/api/durable/transaction/:transactionId/atomic-commit/recover`
- V32 fenced mutation remains authoritative for workspace effects

## Evidence tests

- V33 atomic workspace commit: PASS
- Coordinator durable COMMITTED record: PASS
- Transaction COMMITTED: PASS
- Workspace mutation persisted: PASS
- Mission/workspace locks released: PASS
- Recovery replay after terminal commit: PASS
- V32 regression: PASS
- V31 regression: PASS
- V30 regression: PASS
- V29 regression: PASS
- V28 regression: PASS
- V27 regression: PASS
- V26 regression: PASS

## Important boundary

This is a durable commit protocol, not a single database transaction spanning all files. The workspace, transaction record, effect record, coordinator record, and journal remain separate durable stores. The coordinator reduces concurrency races and records recoverable commit intent, but a process crash can still occur between individual durable writes. Recovery is therefore explicit and evidence-based rather than claiming impossible cross-file atomicity.

## Verification limitation

Full Vite/browser build was not claimed because the working archive does not include a complete installed `node_modules` environment. Runtime tests were executed directly with Node's experimental TypeScript stripping.
