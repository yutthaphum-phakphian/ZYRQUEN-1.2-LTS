# CodeVoice AI V45 — Worker Task Consistency Supervisor Recovery

## What changed
- Added durable supervisor-cycle heartbeat using the existing durable lock renewal mechanism.
- Added stale supervisor-cycle reconciliation on restart/new cycle.
- Added `ORPHANED` cycle state for durable `worker-consistency-run` records that were left `RUNNING` beyond the configured orphan threshold.
- Added durable evidence event when a stale supervisor cycle is orphaned.
- Added bounded orphan scan before starting a new consistency cycle.
- Preserved V44 recovery + consistency audit flow.

## Runtime verification
- V45 worker task consistency supervisor recovery tests: PASS
- V44 worker task consistency supervisor tests: PASS
- V43 worker task consistency tests: PASS
- V42 worker task ledger recovery tests: PASS
- V41 worker task ledger tests: PASS
- V40 worker pool durable recovery tests: PASS
- V39 worker pool tests: PASS

## Environment boundary
- `npm run lint`: NOT_VERIFIED — environment is missing `vite/client` type definitions (`TS2688`).
- `npm run build`: NOT_VERIFIED — `vite` executable is unavailable in the current environment.
- No claim is made that the full frontend TypeScript/build pipeline passes.

## Reality boundary
V45 provides durable supervisor-cycle heartbeat and restart/orphan recovery inside the existing in-process/runtime architecture. It does not claim distributed consensus, multi-machine process supervision, or exactly-once external side effects.
