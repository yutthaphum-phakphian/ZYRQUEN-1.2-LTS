# V36 Recovery Supervisor — Reality Report

## Implemented
- Durable Recovery Supervisor with explicit `STOPPED/RUNNING/STOPPING/FAILED` lifecycle.
- Periodic recovery scheduling using a bounded timer loop.
- Bounded concurrency (`maxConcurrentCycles`, default 1) to prevent overlapping recovery sweeps.
- Manual deterministic `tick()` for testing and operational control.
- Graceful `shutdown()` waits for an active sweep to finish before returning to STOPPED.
- Failure isolation: a failed sweep records the error and moves the supervisor to FAILED instead of silently retrying indefinitely.
- Reuses V35 `sweepDurableTransactionRecovery()` as the authoritative recovery operation; no duplicate recovery logic.
- Runtime configuration through `CODEVOICE_RECOVERY_INTERVAL_MS` and `CODEVOICE_RECOVERY_BATCH_LIMIT`.
- HTTP control/inspection endpoints: GET status, POST start/stop/tick/shutdown.

## Verification
- V36 supervisor lifecycle test: PASS
- V35 durable recovery sweep regression: PASS
- V34 crash-consistent commit regression: PASS
- V33 atomic workspace commit regression: PASS

## Not verified
- Full Vite/browser build was not claimed because the provided runtime workspace does not contain a complete installed `node_modules` environment.
- The supervisor is a Node process-local timer supervisor. It is not yet a distributed multi-process scheduler or OS-managed daemon.
- If the process itself is terminated, the durable V35 records remain authoritative; a new process must start the supervisor to resume periodic sweeps.

## End state
V36 adds operational supervision around the existing evidence-based recovery sweep while preserving V29+ fencing and V33/V34 transactional recovery boundaries.
