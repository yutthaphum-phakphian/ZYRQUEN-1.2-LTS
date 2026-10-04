# Passed Snapshot — 2026-10-02

## Scope
This snapshot contains the current `nextwork` source, tests, configuration, and milestone documentation only. Generated runtime data and local dependency directories are excluded.

## Regression gate
All `tests/milestone-*.test.ts` files were executed with Node's experimental type stripping. Every milestone test completed with `PASS`.

Key areas covered:
- runtime control/execution
- developer tools/workflow/repair
- crash-consistent repair and recovery
- recovery governance/integrity/takeover
- reliability control loop and autonomous supervisor
- agent planning/capabilities
- agent governance/policy
- agent run control
- upgrade admission + integration
- agent run execution gateway
- live evidence
- supervisor heartbeat/failover
- recovery chaos certification (6 scenarios)

## Fixes made during this gate
- Isolated the reliability milestone test from shared durable runtime state by setting a temporary durable root before importing runtime modules.
- Made runtime execution milestone cleanup retry transient `ENOTEMPTY` directory cleanup after gateway shutdown.

## Dependency/build boundary
The source regression gate above passes. A full `npm ci`, `tsc`, and Vite production build require a complete dependency installation; the execution environment has had registry/DNS access failures. No fake dependency files or generated `node_modules` are included in this snapshot.

## Rule
Only source and test changes that pass the milestone regression gate are included. This snapshot is a checkpoint, not a replacement for `nextwork` as source of truth.
