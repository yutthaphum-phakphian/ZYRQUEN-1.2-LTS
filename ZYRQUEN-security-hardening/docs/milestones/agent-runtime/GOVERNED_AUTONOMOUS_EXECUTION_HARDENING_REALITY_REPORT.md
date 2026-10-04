# Governed Autonomous Execution Hardening — Reality Report

## Scope
Strengthened the latest Governed Autonomous Execution path (`server/agentRunExecutionGateway.ts` + `server/agentRunController.ts`) without adding large new feature surfaces.

## Changes
1. **Durable Resume**
   - Loads prior `agent-run-execution` durable record on every `executeAgentRun`.
   - Verifies step integrity of already-COMPLETED steps and skips them.
   - Preserves original evidence/auditHash; does not re-execute completed work.
   - Tracks `resumeFromStepId` and incremental versioned persists.

2. **Idempotency / Duplicate Protection**
   - Terminal executions (COMPLETED / FAILED / RECOVERY_REQUIRED) return the sealed prior result without re-running.
   - `approveAgentRun` is idempotent for the same approver; conflicting terminal states fail-closed.
   - `completeAgentRun` is idempotent for the matching terminal; refuses to flip one terminal into another.
   - Optimistic concurrency via durable record version; STALE_RECORD_VERSION fails closed.

3. **Evidence Integrity**
   - Every step carries: stepId, capability, status, startedAt, completedAt, result/error, evidence, auditHash.
   - `verifyStepIntegrity` / `verifyExecutionIntegrity` recompute SHA-256 over canonical payload.
   - Load path and resume path fail-closed on CORRUPTED_EXECUTION_EVIDENCE / EVIDENCE_INTEGRITY_FAILED.
   - Silent mutation of historical evidence is impossible without detection.

4. **Recovery Boundary**
   - Capability errors matching RECOVERY_REQUIRED patterns (AMBIGUOUS, FENCE_CONFLICT, INTEGRITY_FAILED, STALE_*, TRANSACTION_MISSING, …) produce status RECOVERY_REQUIRED and do not auto-complete the agent run.
   - `recoverAndResumeAgentRun` requires active leadership (+ fence when mission-scoped), keeps only verified COMPLETED evidence, re-executes remaining steps, and only reaches COMPLETED after real re-verification.

5. **Regression Safety**
   - Existing Agent Planning / Simulation / Policy / Admission / Agent Run / Repair / Recovery / Reliability / Observability / Governed Execution APIs retained.
   - All prior milestone-agent-run-* tests continue to PASS.

## Milestone Tests Added
- `tests/milestone-governed-autonomous-execution-hardening.test.ts`
  - restart/resume, duplicate execution, duplicate finalize, approve idempotency, stale version, corrupted evidence, recovery boundary + re-verify, terminal-state protection.

## Validation
- Hardening test: PASS
- milestone-agent-run-execution-gateway: PASS
- milestone-agent-run-live-evidence: PASS
- milestone-agent-run-control: PASS
- Related governance / recovery / reliability / planning / expansion / upgrade-admission: PASS (with isolated durable roots where required)

## Dependency / Build Boundary
Full `npm ci` + Vite production build remain environment-sensitive (registry latency). Source regression gate via Node experimental type stripping is green. No dependency version changes were made.
