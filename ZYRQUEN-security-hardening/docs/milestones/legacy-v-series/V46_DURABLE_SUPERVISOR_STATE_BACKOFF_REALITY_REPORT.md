# CodeVoice AI V46 — Durable Supervisor State Machine + Self-Healing Backoff

## What changed
- Added a durable supervisor state record: `worker-task-consistency-supervisor-state`.
- Added supervisor states `BACKOFF` and `CIRCUIT_OPEN` in addition to the existing lifecycle states.
- Added configurable consecutive-failure threshold, exponential backoff, maximum backoff, and circuit-open cooldown.
- Persisted failure count and next-allowed timestamp so restart restores the recovery throttle instead of immediately hammering a failing dependency.
- Successful cycles reset failure count, backoff, and circuit state.
- Added durable evidence event when the supervisor enters backoff/circuit protection.
- Existing V45 heartbeat/orphan recovery and V39-V45 behavior remains intact.

## Runtime verification
- V46 durable supervisor state/backoff tests: PASS
- V45 worker task consistency supervisor recovery tests: PASS
- V44 worker task consistency supervisor tests: PASS
- V43 worker task consistency tests: PASS
- V42 worker task ledger recovery tests: PASS
- V41 worker task ledger tests: PASS
- V40 worker pool durable recovery tests: PASS
- V39 worker pool tests: PASS

## Environment boundary
- `npm run lint`: NOT_VERIFIED — environment does not provide the full Vite client type environment (`vite/client`).
- `npm run build`: NOT_VERIFIED — Vite executable/dependencies are not available in the current runtime.
- No claim is made that the full frontend TypeScript/build pipeline passes.

## Reality boundary
V46 provides a durable in-process supervisor state machine with persisted failure backoff and circuit protection. It does not claim multi-machine consensus, process-level supervision outside this runtime, or exactly-once external side effects.
