# Milestone 13 — Durable End-to-End Execution Receipt

## Scope
Adds a durable execution receipt that correlates one governed self-healing PR execution across:

- verified patch identity
- automated GitHub pull request result
- deterministic webhook delivery ID/result
- audit event ID
- receipt hash

The receipt is persisted at `.codevoice-data/execution-receipts.json` in production and uses atomic replacement.

## Safety properties
- Stable execution key is derived from draft, GitHub repository, branches and verified patch hash.
- Replaying an already completed execution returns the existing receipt instead of creating another webhook delivery.
- Different patch hashes produce different execution identities.
- Receipt state is `IN_PROGRESS`, `COMPLETE`, or `FAILED`.
- Successful PR + failed webhook is explicitly represented as `FAILED`; the PR result is retained.
- Webhook delivery uses a deterministic ID derived from the receipt ID, so retry after a process interruption converges on the same delivery ledger entry.
- Receipt contains hashes/IDs needed to correlate remote mutation, webhook delivery, and audit evidence.

## Verification
Focused Milestone 5–13 suite: **21/21 PASS**.

TypeScript syntax checks for the new receipt ledger and route: **PASS**.

Full `tsc --noEmit` was not claimed as PASS because the sandbox dependency set is incomplete (`vite/client` and `@types/node` were unavailable after install timeout). No lockfile was modified.
