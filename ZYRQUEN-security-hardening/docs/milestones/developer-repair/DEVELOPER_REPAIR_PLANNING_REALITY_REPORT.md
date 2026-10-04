# Developer Repair Planning — Reality Report

## Capability
Added a deterministic, evidence-bound repair planning layer between verification failure and mutation.

Flow:

`VERIFY -> FAILURE EVIDENCE -> REPAIR PLAN -> EXPLICIT APPROVAL -> REPAIR MUTATION -> VERIFY AGAIN`

## Implemented
- `server/developerRepairPlanner.ts`
- `POST /api/runtime/developer-workflow/repair/plan`
- Failure classification:
  - TEST_FAILURE
  - BUILD_FAILURE
  - INSPECTION_FAILURE
  - APPROVAL_OR_POLICY_BLOCK
  - EXECUTION_TIMEOUT
  - WORKSPACE_STATE_MISMATCH
  - UNKNOWN_FAILURE
- Plan is immutable output with:
  - verificationId
  - verificationAuditHash
  - diagnosis
  - failed step evidence
  - safety constraints
  - candidate operations (currently empty unless a future evidence adapter can justify them)
  - auditHash
- Planning never mutates the workspace.
- Every mutation remains explicitly approved and must use the existing fenced transactional path.
- Verification must run again after repair.

## Important boundary
The planner does **not** invent arbitrary source-code patches. It classifies evidence and establishes constraints. Candidate operations stay empty unless a trusted planner/evidence adapter can justify a concrete mutation. This prevents the system from pretending that a generic error message is enough to safely rewrite production code.

## Validation
- Developer workflow verification milestone: PASS
- Developer repair planner milestone: PASS
- Developer repair loop milestone: PASS

## Existing project checks
Full `npm run lint` / `npm run build` remain environment-limited in this workspace because the existing project dependency/type environment is incomplete (`vite/client` types and `vite` executable were previously unavailable). No claim of full-project build success is made.
