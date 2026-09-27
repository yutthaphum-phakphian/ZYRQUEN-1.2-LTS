# Combined Foundation + ZYRQUEN Upgrade Delivery

This package contains Foundation Phase 01–10 at the workspace root and ZYRQUEN-1.2-LTS (including ROOM18) at `ZYRQUEN-1.2-LTS/`.

The source boundaries remain isolated; no unverified cross-system runtime adapter was introduced.

## Upgrade work included

- Production and integration Evidence APIs now share the same `legalBasis` contract.
- Evidence responses expose `evidenceState` and `provenance` explicitly.
- Added production-entrypoint smoke coverage for startup, health, evidence, replay, and shutdown.
- `npm start` runs the TypeScript server through `tsx`.
- Removed deprecated `@types/dompurify` dependency.
