# CodeVoice AI — Production Real Tool Execution Milestone

## Scope
This milestone moves approved mutation tasks from a placeholder boundary into the existing durable workspace transaction + fenced worker runtime.

## Implemented
- Approved CREATE / UPDATE / DELETE / CODE / FIX tasks now execute through `prepareMissionTransaction` + `applyFencedPreparedWorkspaceTransaction`.
- RENAME is supported as a durable DELETE + CREATE change set when source/target and source content are available in mission context.
- Every mutation requires an active worker fence (`workerId` + `leaseId`).
- Mutation tasks remain explicitly approval-gated.
- Idempotency key is stable per `missionId + taskId`, so replaying the same task reuses the committed transaction instead of writing the workspace again.
- Path validation, expected-content hash checks, transaction evidence, workspace-effect evidence, and mission journal evidence continue to be enforced by the existing durable transaction layer.
- The default worker pool now creates a per-dispatch server adapter bound to the active worker lease, while custom adapters remain untouched.

## Verification
PASS:
- Real tool execution milestone test
- Runtime control plane milestone test
- Runtime execution gateway milestone test
- Worker pool regression
- Durable worker recovery regression
- Worker task ledger regression
- Worker task ledger recovery regression
- Worker task consistency regression
- Consistency supervisor regression
- Supervisor recovery regression
- Supervisor state/backoff regression
- Supervisor self-healing regression
- Supervisor control-plane regression

## Reality Boundary
- Full TypeScript lint: NOT_VERIFIED in this environment because `vite/client` type definitions are unavailable (`TS2688`).
- Full Vite build: NOT_VERIFIED because `vite` executable is unavailable in the environment.
- This milestone provides real durable local-workspace mutation, not arbitrary host filesystem access.
- External provider side effects are still outside this exactly-once boundary.
- Distributed consensus is not claimed.

## Next Capability Direction
The natural next large milestone is secure real-tool breadth: richer workspace read/search, test/build artifact inspection, controlled browser/API tools, and a unified permission/audit surface — without splitting the project into another sequence of numbered releases.
