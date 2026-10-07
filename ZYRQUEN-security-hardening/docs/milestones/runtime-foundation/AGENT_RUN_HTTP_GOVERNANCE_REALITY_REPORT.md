# Agent Run HTTP Governance — Reality Report

## Status
IMPLEMENTED / TEST-VERIFIED (route logic, against the real controller). Express wiring in `server.ts` is syntax-checked only.

## What was added
`src/server/agentRunRoutes.ts` + registration in `server.ts`: `POST/GET /api/agent/runs`, `GET /api/agent/runs/:id`,
`POST /api/agent/runs/:id/approve|cancel`, behind the existing session auth guard.

## REAL
- Runs are created through the real `createAgentRun` (plan → simulate → policy decisions → admission) and persisted in the durable store.
- Per-user namespace `<userId>.<project>`; foreign or malformed ids → 404 (no existence leak); prefix look-alike users do not match.
- Approver is the authenticated user; body-supplied approvers are ignored. Terminal states return 409 and leave the record unchanged.
- Input validation with field-level 400s; HTTP cannot request `CRITICAL`; default max risk is `MEDIUM`.
- Listing is bounded (scan ≤ 2000 ids, return ≤ 50 summaries, `truncated` flag). Internal errors are generic 500s.
- Audit events (`agent.run.create|approve|cancel`) and `agent_run_total` metrics.

## NOT done / limits
- These routes do **not** execute tools or modify files; they manage governance records only.
- Policy management is intentionally not exposed. With no project policy the library allows registered capabilities (`NO_PROJECT_POLICY`).
- Listing scans ids and loads records (no owner index); fine for thousands, not for very large stores.
- No UI for runs yet. The remaining `server/` modules (workers, queue, recovery, supervisor) are still test-only.
- `server.ts` was not started against real Express in this environment (Express not installable).

## Tests
`tests/agent-run-routes.test.ts` — 13 tests (routes registered, 401s, validation matrix, namespacing, risk default, isolation,
hostile ids, summaries, approver identity, terminal 409s, BLOCKED approve, error masking, bounded listing). Full TS suite: 79/79.
