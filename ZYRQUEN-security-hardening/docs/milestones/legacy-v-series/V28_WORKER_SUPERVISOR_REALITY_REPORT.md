# CodeVoice AI V28 — Worker Supervisor Reality Report

## Version
28.0.0

## Objective
Make autonomous mission execution exclusive and restart-safe by adding a durable worker lease layer on top of V27 recovery/replay.

## Implemented
- Durable `MissionWorkerLease` record (`ACTIVE`, `RELEASED`, `EXPIRED`)
- Worker acquire / heartbeat / release
- Owner verification for heartbeat and release
- Mission supervisor inspection
- Verified-journal recovery claim
- Duplicate recovery claim prevention
- Worker lifecycle events in the existing tamper-evident journal
- HTTP endpoints and client helpers
- Reuse of V27 recovery/replay and V20–V26 durable infrastructure
- No duplicate mission engine or replay engine

## Real runtime tests
- Worker acquire: PASS
- Second worker conflict: PASS
- Heartbeat: PASS
- Supervisor inspection: PASS
- Owner release: PASS
- Recovery claim after verified journal: PASS
- Duplicate recovery claim blocked: PASS
- Durable worker lease persisted: PASS
- Journal remains valid after worker events: PASS
- V27 recovery orchestrator regression: PASS
- V26/V25 test runners remain available; V26/V25 were previously reported as passing in the V27 baseline.

## Security / correctness
- Mission and worker identifiers are validated.
- Recovery claim verifies the mission journal before claiming execution.
- Only the current worker owner may heartbeat or release its lease.
- Durable resource locking prevents a second active worker from claiming the same mission.
- Tampered journal blocks recovery claim.
- Lease TTL bounds stale ownership.

## Verification limits
The environment used for this build does not have the project's installed dependency tree. Full Vite/browser build and complete application typecheck are therefore **NOT_VERIFIED**. A direct TypeScript probe also reports missing Node typings/module resolution because `node_modules` is unavailable. This is an environment limitation, not reported as a runtime PASS.

The focused V28 and V27 Node tests run successfully using Node's experimental type stripping.

## Output
`codevoice-ai-v28-worker-supervisor.zip`
