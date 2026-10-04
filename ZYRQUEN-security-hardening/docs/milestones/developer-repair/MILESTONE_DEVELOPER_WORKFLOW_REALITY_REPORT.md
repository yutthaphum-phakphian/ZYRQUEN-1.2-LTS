# CodeVoice AI — Developer Workflow Milestone Reality Report

## Scope

This milestone adds a safe developer-tool layer on top of the existing durable runtime. It combines workspace READ, SEARCH, TEST/BUILD execution, artifact inspection, and approval/audit boundaries without changing the existing transactional mutation path.

## Implemented

- `server/developerToolRuntime.ts`
- `READ`: bounded UTF-8 file reads with path traversal protection and SHA-256 evidence.
- `SEARCH`: recursive text search with bounded results and ignored generated/dependency directories.
- `RUN_TEST` / `RUN_BUILD`: explicit approval gate and reuse of the existing safe local execution runtime.
- `INSPECT`: deterministic inspection of common build artifact directories (`dist`, `build`, `.next`, `out`) with size + SHA-256.
- Every operation returns an execution ID and an audit object.
- `POST /api/runtime/developer-tools` exposes the capability through the server.
- Added `test:milestone-developer-tools`.

## Runtime validation

PASS:
- Developer tools milestone test
- Real tool execution milestone test
- Runtime control plane milestone test
- Supervisor control-plane regression test

A previously existing runtime-execution test also hit an `ENOTEMPTY` cleanup failure when run in the same chained shell. The test passes when run independently; this is recorded as an environment/test-cleanup issue rather than hidden.

## Build boundary

`npm run lint`: NOT_VERIFIED in this environment because the project reports missing `vite/client` type definitions (`TS2688`).

`npm run build`: NOT_VERIFIED in this environment because the `vite` executable/dependency is unavailable in the current installed environment.

## Security / reality boundary

- READ/SEARCH are read-only.
- TEST/BUILD require explicit approval.
- Commands still pass through the existing local execution allowlist and shell/path safety checks.
- No claim of unrestricted shell execution.
- No claim of exactly-once external side effects.
