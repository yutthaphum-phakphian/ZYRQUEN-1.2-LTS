# CodeVoice AI V24 — Transactional Workspace Effects Reality Report

## Scope
V24 bridges the V23 durable mission transaction coordinator to the internal durable project workspace. It provides a validated, staged workspace effect that applies a bounded set of CREATE/UPDATE/DELETE operations only after all preconditions are checked, then finalizes the prepared mission transaction with evidence.

## Implemented
- Durable `transaction-effect` record kind.
- Transaction -> workspace effect bridge.
- Expected-content SHA-256 precondition checks.
- Workspace path normalization and traversal protection.
- CREATE/UPDATE/DELETE effect application through the existing atomic durable workspace writer.
- Effect status STAGED/APPLIED/ROLLED_BACK model.
- Evidence linking effect to workspace version.
- Mission journal events for STAGED and APPLIED effects.
- Recovery endpoint for APPLIED effects that need transaction finalization and STAGED effects that were never applied.
- Client helpers for apply/recover.
- V24 package/test script.

## Real verification
Command:
`node --experimental-strip-types tests/v24-transactional-workspace.test.ts`

Expected/verified behaviors:
- prepare mission transaction
- apply UPDATE to durable workspace
- expected-content hash gate
- committed transaction evidence
- durable effect record
- failed precondition leaves workspace unchanged
- recovery of a transaction without an effect is a safe NO_EFFECT result

## NOT VERIFIED
- Full Vite/browser build: NOT VERIFIED because dependency tree is not installed in this sandbox.
- Express HTTP E2E: NOT VERIFIED.
- Multi-process distributed atomicity: NOT VERIFIED.

## Important limitation
V24 does not claim distributed ACID semantics. The durable workspace write is atomic at the file-record level; the transaction finalization is separately durable. If a process crashes between workspace application and transaction commit, the persisted APPLIED effect is the recovery source of truth and can be finalized safely.

## Security
- Existing V20–V23 atomic write and SHA-256 integrity mechanisms retained.
- Workspace targets reject absolute paths, `..`, and NUL bytes.
- Expected-content hash prevents overwriting a changed file unexpectedly.
- No credentials or external provider access added.

## Package
`codevoice-ai-v24-transactional-workspace-effects.zip`

## Additional regression evidence
- V23 transactional mission test: PASS.
- V22 legacy test invocation was not completed in this environment because its historical import path expects extensionless ESM resolution (`server/durableStore`) that Node's native type-stripping loader does not resolve here. This is an environment/test-runner compatibility limitation, not evidence of a V22 behavior failure.
