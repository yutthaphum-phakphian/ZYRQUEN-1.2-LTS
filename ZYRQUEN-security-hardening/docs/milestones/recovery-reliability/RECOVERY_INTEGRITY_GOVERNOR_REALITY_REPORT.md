# Recovery Integrity Governor — Reality Report

## Capability
The Recovery Integrity Governor provides a deterministic post-recovery integrity verdict for crash-consistent repair records.

## Flow
`Repair Record -> Transaction Check -> Mission Journal Check -> Before/Desired Workspace Check -> Integrity Verdict`

## Verdicts
- `HEALTHY`: terminal repair state with matching durable transaction, valid mission journal, and workspace matching desired/before state as appropriate.
- `RECOVERY_REQUIRED`: repair remains non-terminal and requires the recovery path to continue.
- `CORRUPT`: a critical invariant is broken; the governor refuses to treat the repair as healthy.

## Checks
- Mission event journal hash-chain validity.
- Transaction existence and mission identity.
- `COMMITTED` repair requires `COMMITTED` transaction.
- `ABORTED` repair cannot have a committed transaction.
- Committed workspace must match desired snapshots.
- Aborted workspace must match before-images.
- Ambiguous recovery state must not be silently accepted.
- Report includes SHA-256 audit hash.

## API
- `POST /api/runtime/developer-workflow/repair/integrity`
- `GET /api/runtime/developer-workflow/repair/integrity/recent`

## Validation
- Developer workflow verification: PASS
- Crash-consistent repair: PASS
- Recovery chaos certification: PASS (6 scenarios)
- Recovery integrity governor: PASS

## Project-wide checks
- `npm run lint`: NOT_VERIFIED — `TS2688: Cannot find type definition file for 'vite/client'`.
- `npm run build`: NOT_VERIFIED — `vite: not found` in the current runtime environment.

## Boundary
This is an integrity authority/reporting layer. It does not silently repair corrupted state. Critical invariant violations are surfaced as `CORRUPT` for an explicit recovery or operator path.
