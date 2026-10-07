# CodeVoice AI V31 — Fenced Worker Runtime Reality Report

## Scope
V31 closes the execution-loop gap after V29/V30 by introducing a server-side fenced worker runtime. The runtime executes one mission task at a time, renews the worker lease, verifies the fence before and after execution boundaries, durably commits mission state, and stops when the mission reaches a terminal/waiting state.

## Implemented
- `server/fencedWorkerRuntime.ts`
  - `runFencedMissionWorker`
  - durable worker acquisition
  - lease heartbeat interval
  - fence assertion before each step
  - fenced adapter wrapper for snapshot/checkpoint/execute/observe
  - fence assertion after execution hooks
  - durable mission save with stale-version protection
  - per-step journal evidence
  - clean worker release
  - explicit fence-loss detection
  - bounded `maxSteps`
- `src/tools/autonomousMissionEngine.ts`
  - exported `runAutonomousMissionStep` for deterministic single-task worker ticks
  - Node-native type import corrected to `import type .../index.ts`
- `package.json`
  - version `31.0.0`
  - `test:v31`
- `tests/v31-fenced-worker-runtime.test.ts`
  - real fenced worker task execution
  - durable mission commit
  - worker release
  - active-worker conflict
  - forced fence loss after adapter execution is detected before durable commit
  - V30/V29/V28/V27/V26 regression tests

## Verified
- V31 fenced worker runtime: PASS
- durable task execution: PASS
- durable mission state reaches COMPLETED: PASS
- lease heartbeat/fence boundary: PASS
- worker conflict protection: PASS
- stale/fence-loss detection before commit: PASS
- V30 regression: PASS
- V29 regression: PASS
- V28 regression: PASS
- V27 regression: PASS
- V26 regression: PASS

## Important boundary
The runtime now gates the adapter execution boundary with a durable worker fence, but an external adapter's own internal side effects cannot be rolled back automatically if the fence is lost during that side effect. V31 detects the loss before the durable mission commit and records the failure. Full transactional side-effect fencing still requires the underlying mutation adapter to participate in the same transactional/fencing protocol.

## Not Verified
- Full Vite/browser build: NOT VERIFIED because this environment does not contain the project's complete `node_modules` installation.
- Browser E2E: NOT VERIFIED.
- Long-running production process supervision across multiple OS workers: NOT VERIFIED.

## Result
V31 is a real server-side fenced execution loop, not a UI-only simulation. It provides the missing runtime boundary needed to make every autonomous mission task execution explicitly owned by a durable worker lease and fencing token.
