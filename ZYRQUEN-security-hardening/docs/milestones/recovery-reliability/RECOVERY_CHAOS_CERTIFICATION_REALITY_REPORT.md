# Recovery Chaos Certification — Reality Report

## Capability
This milestone stress-tests crash recovery around the repair coordinator rather than adding another repair path.

The certification matrix forces deterministic failure at critical boundaries and verifies that recovery terminates in an explicit state:

- `COMMITTED`
- `ABORTED`
- `RECOVERY_REQUIRED`

A stale worker must instead be rejected by fencing.

## Certified scenarios

1. **Crash after PREPARED** → before-image confirmed → `ABORTED`
2. **Crash after APPLIED** → desired state confirmed → `COMMITTED`
3. **Crash before transaction COMMIT** → desired state confirmed → `COMMITTED`
4. **Ambiguous filesystem state** → `RECOVERY_REQUIRED`
5. **Active-worker authority conflict** → recovery takeover blocked while valid worker is active; after release, recovery worker takes over and aborts safely
6. **Stale worker fence** → old worker identity rejected after lease turnover

## Important correction
During certification, the recovery coordinator was hardened so a caller requesting a recovery-worker takeover cannot silently reuse a different still-active worker's authority. If another valid worker owns the active lease, recovery returns `RECOVERY_REQUIRED` with `ACTIVE_WORKER_FENCE_CONFLICT`.

## Validation

- Recovery chaos certification: **PASS (6 scenarios)**
- Existing crash-consistent repair test: **PASS**
- Existing repair recovery takeover test: **PASS**

## Scope boundary
This is deterministic fault-injection certification, not a claim of exhaustive distributed-systems proof. The tests cover the currently implemented repair coordinator failure boundaries; real process termination, power loss, filesystem corruption, and multi-host storage failures are outside this local certification harness.
