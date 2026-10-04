# CodeVoice AI V22 — Transactional Recovery & Tamper-Evident Mission Journal

## Scope
V22 continues V21 without replacing the existing architecture. The focus is production durability for mission events: serialized journal appends, hash chaining, integrity verification, and durable recovery records.

## Implemented
- Tamper-evident mission event journal with sequence numbers.
- SHA-256 hash chaining (`prevHash` -> `hash`).
- Per-mission in-process append serialization to prevent same-process interleaving.
- Backward-compatible verification for legacy V21 events that have no hash metadata.
- Journal verification endpoint: `GET /api/durable/events/:missionId/verify`.
- Recovery detection endpoint: `POST /api/durable/recovery/detect`.
- Durable recovery records with status and recommended action.
- Recovery listing endpoint: `GET /api/durable/recovery`.
- Client helpers for journal verification and recovery detection.
- V22 package version `22.0.0`.

## Evidence
The V22 test harness verified:
1. Two real mission events were persisted.
2. Sequence numbers were `1` and `2`.
3. The second event contained `prevHash` and `hash`.
4. The journal verified as valid before tampering.
5. A modified event was detected as `HASH_MISMATCH`.
6. Listing a corrupted journal was rejected with `EVENT_JOURNAL_INTEGRITY_FAILED`.
7. A recovery record was persisted and retrievable.

## Regression
- V20 durable runtime tests: PASS
- V21 production hardening tests: PASS
- V22 transactional recovery tests: PASS

## Environment limitation
The archive does not contain `node_modules`. The environment provides a global TypeScript compiler but not the project's installed dependency/type tree. Therefore the full React/Vite application build and browser regression are **NOT_VERIFIED** in this environment.

The durability server module and V20/V21/V22 durability test harness were compiled and executed using temporary Node type shims solely for verification; those shims are not part of the product archive.

## Reality Matrix
| Capability | Status |
|---|---|
| Durable mission journal | REAL |
| Event sequence numbers | REAL |
| SHA-256 event chaining | REAL |
| Journal integrity verification | REAL |
| Tamper detection | REAL |
| Recovery records | REAL |
| Recovery API | REAL |
| V20/V21 durability regression | REAL |
| Full Vite build | NOT_VERIFIED |
| Browser UI regression | NOT_VERIFIED |
| External providers | OUT OF SCOPE |

## Known limitation
The event journal is tamper-evident, but it is not a cryptographic signature system. An attacker with write access to the durable store could rewrite the entire journal and recompute hashes. Stronger trust requires an external append-only/WORM store or signing key outside the same trust boundary.
