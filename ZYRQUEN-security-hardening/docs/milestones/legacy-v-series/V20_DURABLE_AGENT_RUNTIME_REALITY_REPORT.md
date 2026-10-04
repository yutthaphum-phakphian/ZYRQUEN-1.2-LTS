# CodeVoice AI V20 — Durable Agent Runtime Reality Report

## Objective
V20 closes the main durability gap after V19 by adding a server-side, controlled persistence boundary for the internal CodeVoice workspace, autonomous missions, and checkpoints/records.

## Implemented
- Atomic JSON persistence under `.codevoice-data/` (configurable with `CODEVOICE_DURABLE_ROOT`).
- SHA-256 integrity hashes for durable workspace and mission/checkpoint records.
- Monotonic version checks to reject stale writes.
- Workspace path traversal and file-size/file-count limits.
- Durable workspace save/load API.
- Durable mission/checkpoint record save/load API.
- Durable health endpoint exposing persistence capabilities without secrets.
- Client helpers for durable workspace and mission persistence.
- Autonomous mission state is still kept in browser localStorage as a fast fallback, with best-effort server durability.
- Workspace changes are mirrored to the durable server store when the API is available.
- Self-Contained Runtime panel updated to V20 durability wording.

## API
- `POST /api/durable/workspace/save`
- `GET /api/durable/workspace/:projectId`
- `POST /api/durable/record/:kind/:id` where kind is `mission` or `checkpoint`
- `GET /api/durable/record/:kind/:id`
- `GET /api/durable/health`

## Safety
- Durable IDs are restricted to safe identifier characters.
- Workspace file paths reject absolute paths, `..`, and NUL bytes.
- Writes use temp-file + rename atomic replacement.
- Integrity is verified on every load.
- Stale versions are rejected instead of silently overwriting newer state.
- No raw credentials are persisted by this feature.

## Tests
A deterministic V20 Node test harness was added:
- workspace save/load
- workspace version increment
- mission save/load
- tamper detection
- durable record deletion

Test command:
`npm run test:v20`

## Verification limitation
This sandbox does not expose the Node/npm toolchain, so the V20 test command and Vite build could not be executed here. The source and test harness were created against the existing V19 TypeScript architecture, but runtime/build execution is therefore **NOT_VERIFIED in this environment**.

Do not interpret this report as claiming a build pass where the required toolchain was unavailable.

## Reality matrix
| Capability | Reality | Evidence |
|---|---|---|
| Durable workspace store | REAL (code path) | server/durableStore.ts |
| Atomic writes | REAL (code path) | temp file + rename |
| SHA-256 integrity | REAL (code path) | load-time verification |
| Stale-write protection | REAL (code path) | monotonic version checks |
| Workspace path safety | REAL (code path) | validation before persistence |
| Durable mission records | REAL (code path) | generic durable record API |
| Client mission durability | REAL (best-effort integration) | src/tools/durableRuntime.ts + App.tsx |
| Browser localStorage fallback | REAL | existing V18/V17 persistence |
| Automated V20 execution tests | NOT_VERIFIED | Node unavailable in sandbox |
| Vite production build | NOT_VERIFIED | Node/npm unavailable in sandbox |

## Package
Version: 20.0.0

Next version is intentionally not started.
