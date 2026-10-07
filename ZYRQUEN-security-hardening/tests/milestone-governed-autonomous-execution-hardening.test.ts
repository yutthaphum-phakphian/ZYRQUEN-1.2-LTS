/**
 * Governed Autonomous Execution Hardening Milestone
 * Covers:
 *  1. Durable resume after simulated restart
 *  2. Idempotency / duplicate protection (execute, approve, complete, finalize)
 *  3. Evidence integrity (tamper detection)
 *  4. Recovery boundary (RECOVERY_REQUIRED vs FAILED, re-verify)
 *  5. Terminal-state protection / stale version
 */
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codevoice-gae-harden-'));
process.env.CODEVOICE_DURABLE_ROOT = root;

const { createAgentRun, loadAgentRun, approveAgentRun, completeAgentRun } = await import('../server/agentRunController.ts');
const {
  executeAgentRun,
  loadAgentRunExecution,
  recoverAndResumeAgentRun,
  verifyStepIntegrity,
  verifyExecutionIntegrity,
} = await import('../server/agentRunExecutionGateway.ts');
const { saveWorkspace, loadDurableRecord, saveDurableRecord } = await import('../server/durableStore.ts');
const { supervisorControlPlane } = await import('../server/supervisorControlPlane.ts');

// Hold leadership so recovery authority gates pass
await supervisorControlPlane.join();

await saveWorkspace({
  projectId: 'gae-project',
  version: 1,
  updatedAt: new Date().toISOString(),
  files: [{ name: 'README.md', content: 'ok' }],
  integrityHash: '',
});

// ─── 1. Basic happy path (regression safety) ─────────────────────────────────
const run = await createAgentRun({
  projectId: 'gae-project',
  agentId: 'gae-agent',
  goal: 'inspect workspace',
  capabilities: ['workspace.inspect'],
  maxRisk: 'LOW',
});
assert.equal(run.status, 'READY');

const execution = await executeAgentRun(run.runId, {
  actualFiles: [{ name: 'README.md', content: 'ok' }],
});
assert.equal(execution.status, 'COMPLETED');
assert.equal(execution.steps.length, 1);
assert.equal(execution.steps[0].status, 'COMPLETED');
assert.ok(execution.steps[0].startedAt);
assert.ok(execution.steps[0].completedAt);
assert.ok(execution.steps[0].auditHash);
assert.ok(execution.auditHash);
verifyExecutionIntegrity(execution);

const persisted = await loadAgentRunExecution(run.runId);
assert.equal(persisted?.status, 'COMPLETED');
assert.equal(persisted?.steps[0].capability, 'workspace.inspect');

// ─── 2. Idempotent re-execute of terminal state ───────────────────────────────
const again = await executeAgentRun(run.runId, {
  actualFiles: [{ name: 'README.md', content: 'ok' }],
});
assert.equal(again.status, 'COMPLETED');
assert.equal(again.auditHash, execution.auditHash); // same sealed evidence
assert.equal(again.steps[0].auditHash, execution.steps[0].auditHash);

// ─── 3. Duplicate finalize / complete protection ─────────────────────────────
const alreadyDone = await completeAgentRun(run.runId, true);
assert.equal(alreadyDone.status, 'COMPLETED');

await assert.rejects(
  () => completeAgentRun(run.runId, false),
  /AGENT_RUN_TERMINAL/,
);

// ─── 4. Approve idempotency ──────────────────────────────────────────────────
const approvalRun = await createAgentRun({
  projectId: 'gae-project',
  agentId: 'gae-agent',
  goal: 'high risk mutate',
  capabilities: ['repair.apply'],
  maxRisk: 'HIGH',
});
assert.equal(approvalRun.status, 'APPROVAL_REQUIRED');

const approved1 = await approveAgentRun(approvalRun.runId, 'builder');
assert.equal(approved1.status, 'APPROVED');
const approved2 = await approveAgentRun(approvalRun.runId, 'builder'); // same actor → idempotent
assert.equal(approved2.status, 'APPROVED');
assert.equal(approved2.approval?.approvedBy, 'builder');

await assert.rejects(
  () => approveAgentRun(approvalRun.runId, 'other-actor'),
  /AGENT_RUN_TERMINAL/,
);

// ─── 5. Durable resume simulation ────────────────────────────────────────────
// Create a multi-step-capable run (workspace.inspect is single-step; we simulate
 // partial state by writing a RUNNING execution with one completed step manually,
 // then resume).
const resumeRun = await createAgentRun({
  projectId: 'gae-project',
  agentId: 'gae-agent',
  goal: 'inspect workspace resume',
  capabilities: ['workspace.inspect'],
  maxRisk: 'LOW',
});

// Manually seed a partial RUNNING execution (simulates crash mid-run after step 0)
const partialStep = {
  stepId: resumeRun.plan.steps[0].stepId,
  capability: 'workspace.inspect',
  status: 'COMPLETED' as const,
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  result: { verdict: 'ALIGNED' },
  evidence: { verdict: 'ALIGNED' },
  auditHash: '',
};
// seal it the same way the gateway does
const crypto = await import('node:crypto');
const stepPayload = {
  stepId: partialStep.stepId,
  capability: partialStep.capability,
  status: partialStep.status,
  startedAt: partialStep.startedAt,
  completedAt: partialStep.completedAt,
  result: partialStep.result,
  error: null,
  evidence: partialStep.evidence,
};
partialStep.auditHash = crypto.createHash('sha256').update(JSON.stringify(stepPayload)).digest('hex');

const partialBase = {
  run: resumeRun,
  status: 'RUNNING' as const,
  steps: [partialStep],
  startedAt: partialStep.startedAt,
  updatedAt: new Date().toISOString(),
  resumeFromStepId: partialStep.stepId,
};
const partialExec = {
  ...partialBase,
  auditHash: crypto.createHash('sha256').update(JSON.stringify(partialBase)).digest('hex'),
};
await saveDurableRecord('agent-run-execution', resumeRun.runId, partialExec, 0);

// Now resume — should skip the completed step and finalize without re-executing
const resumed = await executeAgentRun(resumeRun.runId, {
  actualFiles: [{ name: 'README.md', content: 'ok' }],
});
assert.equal(resumed.status, 'COMPLETED');
assert.equal(resumed.steps.length, 1);
assert.equal(resumed.steps[0].status, 'COMPLETED');
assert.equal(resumed.steps[0].auditHash, partialStep.auditHash); // original evidence preserved
assert.ok(resumed.resumeFromStepId === partialStep.stepId || resumed.steps[0].stepId === partialStep.stepId);

// ─── 6. Corrupted evidence detection ─────────────────────────────────────────
const corruptRun = await createAgentRun({
  projectId: 'gae-project',
  agentId: 'gae-agent',
  goal: 'inspect for corruption',
  capabilities: ['workspace.inspect'],
  maxRisk: 'LOW',
});
const good = await executeAgentRun(corruptRun.runId, {
  actualFiles: [{ name: 'README.md', content: 'ok' }],
});
assert.equal(good.status, 'COMPLETED');

// Tamper the on-disk record
const rawPath = path.join(root, 'agent-run-execution', `${corruptRun.runId}.json`);
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
raw.payload.steps[0].evidence = { verdict: 'TAMPERED' };
// leave old auditHash → integrity must fail
fs.writeFileSync(rawPath, JSON.stringify(raw));

await assert.rejects(
  () => loadAgentRunExecution(corruptRun.runId),
  /CORRUPTED_EXECUTION_EVIDENCE|EVIDENCE_INTEGRITY_FAILED|EXECUTION_INTEGRITY_FAILED|RECORD_INTEGRITY_FAILED/,
);

// Also verify helper throws
assert.throws(
  () => verifyStepIntegrity(raw.payload.steps[0]),
  /EVIDENCE_INTEGRITY_FAILED/,
);

// ─── 7. Stale version protection ─────────────────────────────────────────────
const staleRun = await createAgentRun({
  projectId: 'gae-project',
  agentId: 'gae-agent',
  goal: 'stale version check',
  capabilities: ['workspace.inspect'],
  maxRisk: 'LOW',
});
const first = await executeAgentRun(staleRun.runId, {
  actualFiles: [{ name: 'README.md', content: 'ok' }],
});
assert.equal(first.status, 'COMPLETED');
const env = await loadDurableRecord('agent-run-execution', staleRun.runId);
assert.ok(env && env.version >= 1);

// Attempt to write with an older version must fail-closed
await assert.rejects(
  () => saveDurableRecord('agent-run-execution', staleRun.runId, first, 0),
  /STALE_RECORD_VERSION/,
);

// ─── 8. Recovery boundary + re-verify ────────────────────────────────────────
// Simulate a RECOVERY_REQUIRED state by writing a partial execution with that status,
// then call recoverAndResumeAgentRun which must re-verify and complete only after success.
const recoveryRun = await createAgentRun({
  projectId: 'gae-project',
  agentId: 'gae-agent',
  goal: 'recovery path',
  capabilities: ['workspace.inspect'],
  maxRisk: 'LOW',
});

const recoveryBase = {
  run: recoveryRun,
  status: 'RECOVERY_REQUIRED' as const,
  steps: [
    {
      stepId: recoveryRun.plan.steps[0].stepId,
      capability: 'workspace.inspect',
      status: 'RECOVERY_REQUIRED' as const,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: 'SIMULATED_AMBIGUOUS_STATE',
      evidence: ['SIMULATED_AMBIGUOUS_STATE'],
      auditHash: '',
    },
  ],
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const recStepPayload = {
  stepId: recoveryBase.steps[0].stepId,
  capability: recoveryBase.steps[0].capability,
  status: recoveryBase.steps[0].status,
  startedAt: recoveryBase.steps[0].startedAt,
  completedAt: recoveryBase.steps[0].completedAt,
  result: null,
  error: recoveryBase.steps[0].error,
  evidence: recoveryBase.steps[0].evidence,
};
recoveryBase.steps[0].auditHash = crypto.createHash('sha256').update(JSON.stringify(recStepPayload)).digest('hex');
const recoveryExec = {
  ...recoveryBase,
  auditHash: crypto.createHash('sha256').update(JSON.stringify(recoveryBase)).digest('hex'),
};
await saveDurableRecord('agent-run-execution', recoveryRun.runId, recoveryExec, 0);

// recoverAndResume should clear the failed step, re-execute, and complete only after real verification
const recovered = await recoverAndResumeAgentRun(recoveryRun.runId, {
  actualFiles: [{ name: 'README.md', content: 'ok' }],
});
assert.equal(recovered.status, 'COMPLETED');
assert.ok(recovered.steps.every((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'));
verifyExecutionIntegrity(recovered);

// Terminal protection after recovery
const againAfterRecovery = await executeAgentRun(recoveryRun.runId, {
  actualFiles: [{ name: 'README.md', content: 'ok' }],
});
assert.equal(againAfterRecovery.status, 'COMPLETED');

await supervisorControlPlane.stop();
console.log('Governed Autonomous Execution Hardening milestone: PASS');
