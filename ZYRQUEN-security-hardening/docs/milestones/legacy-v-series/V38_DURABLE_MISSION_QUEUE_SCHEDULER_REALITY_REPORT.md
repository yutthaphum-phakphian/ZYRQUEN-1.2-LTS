# CodeVoice AI V38 — Durable Mission Queue + Worker Scheduler Reality Report

## Scope
V38 adds a durable mission queue and lease-aware worker scheduler above V37 distributed recovery coordination.

## Implemented
- Durable mission queue records (`mission-queue`).
- Priority ordering: CRITICAL > HIGH > NORMAL > LOW, with FIFO ordering within the same priority.
- Idempotent enqueue and cancellation.
- Durable scheduler slots using the same atomic durable lock primitive.
- Global worker-capacity enforcement across concurrent scheduler instances sharing the same durable root.
- Queue dispatch reservation with mission queue lock + scheduler slot lock.
- Worker lease is intentionally acquired by the actual worker runtime; scheduler only reserves the slot and binds the real lease after acquisition.
- Lease binding evidence (`workerId`, `leaseId`, `fencingToken`).
- Orphaned-dispatch recovery: a dispatch with no active matching worker lease past the grace window is returned to `QUEUED` and its scheduler slot is released.
- Terminal missions are not redispatched.
- Attempt limits and cancellation on exhausted attempts.
- Periodic scheduler lifecycle: START / STOP / TICK / SHUTDOWN.
- Durable queue/scheduler APIs in `server.ts`.
- V38 hardens `acquireDurableLock()` with atomic `open(..., 'wx')` creation to prevent concurrent processes from both acquiring the same lock. This was required by the distributed scheduler test and is a material V37 concurrency hardening.

## Validation
- V38 mission queue scheduler test: PASS.
- V38 distributed scheduler concurrency/capacity test: PASS.
- V26–V36 regression suite: PASS.
- ZIP integrity: PASS.

## Important boundaries
- The scheduler dispatches/reserves work; it does not itself execute an autonomous mission. The existing V31 fenced worker runtime remains the execution authority.
- Worker capacity is durable across scheduler instances sharing the same durable storage root through scheduler-slot locks. It is not a network consensus protocol and does not claim Raft/Paxos semantics.
- External distributed storage, database transactions, and cross-machine network partition handling remain outside this release.
- Full Vite/browser build was not verified because `node_modules` is not present in the working archive/environment.
