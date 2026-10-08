# V32 — Transactional Fenced Mutation Reality Report

## Scope
V32 binds the V29/V31 worker fence to durable workspace transaction mutation. A fenced mutation now verifies worker ownership before staging, before the workspace write, after durable effect evidence is recorded, and immediately before transaction commit.

## Implemented
- `applyFencedPreparedWorkspaceTransaction()` in `server/transactionalWorkspace.ts`
- Worker/lease identity is required for fenced workspace mutation.
- Mission identity is taken from the prepared transaction and verified through the existing worker fence assertion.
- CREATE/UPDATE/DELETE workspace mutations retain expected-hash and path traversal protections.
- Durable `STAGED` effect is written before mutation.
- After the workspace write, the effect is durably marked `APPLIED` before the next fence assertion. This prevents recovery from mistaking a real write for a non-write when the fence is lost immediately after the side effect.
- Commit is allowed only while the worker fence remains valid.
- Applied/committed events include worker and lease evidence.
- New API: `POST /api/durable/transaction/:transactionId/workspace/apply-fenced`
- Existing unfenced API remains for backwards compatibility; callers that require worker ownership must use the fenced endpoint/function.

## Verification
- V32 transactional fenced mutation: PASS
- Successful fenced CREATE + COMMIT: PASS
- Stale/released fence rejected before mutation: PASS
- Fence loss after workspace write: PASS; workspace contains the write, durable effect is `APPLIED`, transaction remains `PREPARED` for deterministic recovery/reconciliation
- V31 fenced worker runtime regression: PASS
- V30 fenced recovery regression: PASS
- V29 worker fencing regression: PASS
- V28 worker supervisor regression: PASS
- V27 recovery orchestrator regression: PASS
- V26 deterministic replay regression: PASS

## Important boundary
The local durable store still uses separate workspace/effect/transaction records rather than one database transaction. Therefore V32 provides deterministic evidence and recovery semantics around the fence boundary, but it does not claim cross-store atomic commit. If a process dies between the workspace write and effect evidence persistence, the existing recovery model cannot mathematically prove the write unless the workspace store itself exposes a write transaction/commit marker. V32 closes the previously ambiguous post-write fence-loss case by persisting `APPLIED` evidence before re-checking the fence.

## Build status
Full Vite/browser build was not claimed because the supplied environment does not contain the complete installed dependency tree. Runtime tests above were executed directly with Node's experimental type stripping.
