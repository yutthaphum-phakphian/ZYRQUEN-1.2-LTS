# CodeVoice AI V21 — Production Durability & Recovery Reality Report

## Objective
V21 hardens the V20 durable boundary into a more complete internal runtime persistence layer: mission event journaling, idempotent event append, resource locks, durable APIs, and client-side synchronization of mission events.

## Implemented
- Durable workspace persistence retained from V20.
- Durable mission/checkpoint records retained from V20.
- Atomic writes and SHA-256 integrity verification retained.
- Monotonic stale-write protection retained.
- Mission event journal under `.codevoice-data/event/<missionId>.jsonl`.
- Idempotent mission-event append by `eventId`.
- Event size and per-mission event-count bounds.
- Durable resource locks with owner and TTL.
- Lock owner verification on release.
- Client `syncDurableMissionEvents()` integration from the existing mission state.
- Durable event retrieval API.
- Durable lock acquire/release APIs.
- V21 health metadata exposing journal/lock capabilities without secrets.
- V21 UI wording updated to reflect mission journal and resource locks.
- Package version updated to 21.0.0.

## New API
- `POST /api/durable/event`
- `GET /api/durable/events/:missionId`
- `POST /api/durable/lock/:resource/acquire`
- `POST /api/durable/lock/:resource/release`
- Existing V20 workspace/record/health APIs remain available.

## Safety
- Durable IDs remain restricted to safe identifier characters.
- Workspace paths reject absolute paths, `..`, and NUL bytes.
- Event IDs are idempotent to prevent duplicate journal entries during client retries.
- Event payloads are bounded.
- Mission event count is bounded.
- Resource locks have bounded TTL.
- Lock release requires matching owner.
- No raw credentials are persisted by V21.

## Verification
### Executed successfully
- V21 durable core behavior was executed with Node using the TypeScript source transpiled by the installed global TypeScript runtime.
- Mission event append/read: PASS.
- Mission event ordering/task ID preservation: PASS.
- Resource lock acquisition: PASS.
- Conflicting owner lock rejection: PASS.
- Lock release: PASS.
- Durable mission save/load: PASS.

### Environment limitation
The project dependency tree was not installed in this environment. `npm ci --ignore-scripts` could not complete before the environment timeout, and the local project therefore has no `node_modules` tree. Full project `tsc --noEmit` reports the expected missing `vite/client` type definition, and the Vite production build was not claimed as verified.

This report therefore does **not** claim a full application build pass.

## Reality Matrix
| Capability | Reality |
|---|---|
| Durable workspace | REAL (V20 retained) |
| Durable mission/checkpoint records | REAL (V20 retained) |
| Mission event journal | REAL — directly executed |
| Idempotent event append | REAL — implemented and exercised |
| Resource locks | REAL — directly executed |
| Durable event API | REAL code path; HTTP integration not executed without full dependency tree |
| Durable lock API | REAL code path; HTTP integration not executed without full dependency tree |
| Client mission event synchronization | REAL code path |
| Full TypeScript project check | NOT_VERIFIED — dependency tree unavailable |
| Full Vite production build | NOT_VERIFIED — dependency tree unavailable |
| Full browser UI regression | NOT_VERIFIED |

## Package
Version: 21.0.0

Output: `codevoice-ai-v21-production-durability.zip`

## Scope Boundary
V21 intentionally remains focused on the internal CodeVoice runtime. External provider infrastructure, OAuth, databases, MCP, GraphQL, WebSocket, and external webhook ingress remain outside this V21 hardening pass.

Next version is not started automatically.
