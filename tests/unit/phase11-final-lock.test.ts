import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ZYRQUEN_CORE_FROZEN_STATE,
  SOVEREIGN_PRINCIPAL_AUTHORITY,
  verifyAllStageEvidenceComplete,
  loadAuthoritativePhase11Transaction,
  finalizePhase11Transaction,
  attemptIdempotentPhase11Execution,
  resetAuthoritativePhase11TransactionToFinalized,
  Phase11AuthoritativeTransaction,
  CANONICAL_EXECUTION_TRACE_STAGE_ORDER,
  createCanonicalFinalizedExecutionTrace,
  buildExecutionTraceForOutcome,
  normalizeTraceStageNode,
  evaluateBoundaryHealthSnapshot,
  createFailureDiagnosticRecord,
  parseQuotaRetryAfterSeconds,
} from '../../src/adapters/zyrquenAdapter';
import { INITIAL_ADAPTER_WRITE_GATE_STEPS } from '../../src/utils/hologramMaterial';
import { validateAndSanitizePreviewHtml } from '../../src/components/AIWorkspace';

test('T1 — Post-Audit Finalization Test: COMPLETED transaction with all 8 evidence checkpoints transitions to FINALIZED', () => {
  const baseTx = resetAuthoritativePhase11TransactionToFinalized();
  const completedCandidate: Phase11AuthoritativeTransaction = {
    ...baseTx,
    lifecycleStage: 'COMPLETED',
    isFinalized: false,
    finalizationEvent: null,
    evidence: {
      inspect: true,
      preview: true,
      approval: true,
      execute: true,
      test: true,
      verify: true,
      safety: true,
      audit: true,
    },
  };

  const result = finalizePhase11Transaction(completedCandidate);
  assert.equal(result.finalized, true);
  assert.equal(result.lifecycleStage, 'FINALIZED');
  assert.equal(result.transaction.isFinalized, true);
  assert.equal(result.transaction.lifecycleStage, 'FINALIZED');
  assert.deepEqual(result.transaction.lockPolicies, {
    approval: 'CLOSED',
    execute: 'CLOSED',
    apply: 'CLOSED',
    replay: 'BLOCKED',
    duplicate: 'BLOCKED',
    mutation: 'BLOCKED',
  });
});

test('T2 — UI Refresh Persistence Test: Reloading state after refresh/remount remains FINALIZED and never reverts to APPROVAL_REQUIRED', () => {
  resetAuthoritativePhase11TransactionToFinalized();
  const reloadedTx = loadAuthoritativePhase11Transaction();

  assert.equal(reloadedTx.lifecycleStage, 'FINALIZED');
  assert.notEqual(reloadedTx.lifecycleStage, 'APPROVAL_REQUIRED');
  assert.equal(reloadedTx.isFinalized, true);
  assert.equal(reloadedTx.lockPolicies.approval, 'CLOSED');
  assert.equal(reloadedTx.lockPolicies.execute, 'CLOSED');
  assert.equal(reloadedTx.lockPolicies.apply, 'CLOSED');
  assert.ok(INITIAL_ADAPTER_WRITE_GATE_STEPS.every((step) => step.status === 'PASSED'));
});

test('T3 — Duplicate Execution Block Test: Re-executing same transactionId/traceId/operationId is BLOCKED with 0 mutation and Audit recorded', () => {
  const tx = resetAuthoritativePhase11TransactionToFinalized();
  const previousAuditCount = tx.auditTrail.length;

  const attempt = attemptIdempotentPhase11Execution({
    transactionId: tx.transactionId,
    traceId: tx.traceId,
    operationId: tx.operationId,
    actor: SOVEREIGN_PRINCIPAL_AUTHORITY.id,
  });

  assert.equal(attempt.allowed, false);
  assert.equal(attempt.status, 'BLOCKED');
  assert.equal(attempt.reason, 'TRANSACTION_ALREADY_FINALIZED');
  assert.equal(attempt.mutationOccurred, false);
  assert.equal(attempt.coreMutationCount, 0);
  assert.equal(attempt.auditRecord.event, 'RE_EXECUTION_BLOCKED_FINALIZED');
  assert.equal(attempt.auditRecord.status, 'BLOCKED');
  assert.equal(attempt.transaction.auditTrail.length, previousAuditCount + 1);
  assert.equal(attempt.transaction.appliedValue, 48);
  assert.equal(attempt.transaction.workspaceMutationCount, 1);
});

test('T4 — Core Isolation Test: ZYRQUEN Ω∞ Core remains FROZEN / READ-ONLY with 0 mutations', () => {
  const tx = loadAuthoritativePhase11Transaction();

  assert.equal(Object.isFrozen(ZYRQUEN_CORE_FROZEN_STATE), true);
  assert.equal(ZYRQUEN_CORE_FROZEN_STATE.isFrozen, true);
  assert.equal(ZYRQUEN_CORE_FROZEN_STATE.canonicalBlock, 849202);
  assert.equal(ZYRQUEN_CORE_FROZEN_STATE.drift, 'Δ0.000%');
  assert.equal(
    ZYRQUEN_CORE_FROZEN_STATE.merkleRoot,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  assert.equal(tx.coreMutationCount, 0);
});

test('T5 — Audit Completeness Test: Refuses FINALIZED if any stage evidence is missing (NOT_FINALIZED) and records full finalization event when complete', () => {
  const baseTx = resetAuthoritativePhase11TransactionToFinalized();

  // Missing audit evidence -> must NOT finalize
  const incompleteCandidate: Phase11AuthoritativeTransaction = {
    ...baseTx,
    lifecycleStage: 'COMPLETED',
    isFinalized: false,
    evidence: {
      inspect: true,
      preview: true,
      approval: true,
      execute: true,
      test: true,
      verify: true,
      safety: true,
      audit: false,
    },
  };

  assert.equal(verifyAllStageEvidenceComplete(incompleteCandidate.evidence), false);
  const rejected = finalizePhase11Transaction(incompleteCandidate);
  assert.equal(rejected.finalized, false);
  assert.equal(rejected.lifecycleStage, 'NOT_FINALIZED');
  assert.equal(rejected.transaction.isFinalized, false);

  // Restore full evidence -> must finalize with complete Finalization Event
  const restored = resetAuthoritativePhase11TransactionToFinalized();
  assert.equal(verifyAllStageEvidenceComplete(restored.evidence), true);
  assert.equal(restored.lifecycleStage, 'FINALIZED');
  assert.ok(restored.finalizationEvent);
  assert.equal(restored.finalizationEvent.transactionId, 'TXN-P11-849205-0042');
  assert.equal(restored.finalizationEvent.traceId, 'TRC-P11-849205-0042');
  assert.equal(restored.finalizationEvent.finalState, 'FINALIZED');
  assert.equal(restored.finalizationEvent.actor, '#EP-SOVEREIGN-01');
  assert.match(restored.finalizationEvent.verificationResult, /VERIFIED_STABLE/);
  assert.match(restored.finalizationEvent.auditReference, /AUDIT-ADAPTER-849205-W01/);
});

test('T6 — AI Workspace Preview Sandbox Isolation & Sanitization Test: Blocks parent/storage/adapter/core references and rejects empty HTML', () => {
  const emptyCheck = validateAndSanitizePreviewHtml('');
  assert.equal(emptyCheck.valid, false);
  assert.equal(emptyCheck.sanitizedHtml, null);

  const maliciousHtml = `<head></head><body><script>window.parent.postMessage('x'); const c = document.cookie; const s = localStorage.getItem('k'); zyrquenAdapter.mutate(); ZYRQUEN_CORE.override();</script></body>`;
  const result = validateAndSanitizePreviewHtml(maliciousHtml);

  assert.equal(result.valid, true);
  assert.ok(result.sanitizedHtml);
  assert.ok(!result.sanitizedHtml.includes('window.parent'));
  assert.ok(!result.sanitizedHtml.includes('document.cookie'));
  assert.ok(!result.sanitizedHtml.includes('localStorage'));
  assert.ok(!result.sanitizedHtml.includes('zyrquenAdapter'));
  assert.ok(!result.sanitizedHtml.includes('ZYRQUEN_CORE'));
  assert.ok(result.sanitizedHtml.includes('Content-Security-Policy'));
  assert.ok(result.blockedReasons.length >= 5);
});

test('T7 — Real Execution Trace Test: 8-stage timeline (REQUEST -> ANALYSIS -> PROPOSAL -> APPROVAL -> EXECUTE -> TARGET -> VERIFY -> AUDIT) halts deterministically and rejects PASSED without evidence', () => {
  const canonicalTrace = createCanonicalFinalizedExecutionTrace();
  assert.equal(canonicalTrace.stages.length, 8);
  assert.deepEqual(
    canonicalTrace.stages.map((s) => s.stage),
    CANONICAL_EXECUTION_TRACE_STAGE_ORDER.map((s) => s.stage)
  );
  assert.ok(canonicalTrace.stages.every((s) => s.status === 'PASSED' && Boolean(s.evidenceRef)));

  // Reject PASSED when evidenceRef is missing
  const unverifiedNode = normalizeTraceStageNode({
    stage: 'VERIFY',
    displayLabel: 'VERIFY',
    timestamp: new Date().toISOString(),
    durationMs: 10,
    status: 'PASSED',
    evidenceRef: '',
    detail: 'Missing evidence ref',
  });
  assert.equal(unverifiedNode.status, 'PENDING');
  assert.equal(unverifiedNode.evidenceRef, null);

  // Halted trace at ANALYSIS due to PROVIDER_UNAVAILABLE
  const halted = buildExecutionTraceForOutcome({
    traceId: 'TRC-AI-849205-0301',
    requestId: 'REQ-AI-849205-0301',
    targetWorkspace: 'ws-agent-02',
    stoppedAtStage: 'ANALYSIS',
    stopStatus: 'PROVIDER_UNAVAILABLE',
    stopDetail: 'Quota exceeded',
    stopEvidenceRef: 'ERR:QUOTA_EXHAUSTED',
  });
  assert.equal(halted.overallStatus, 'HALTED');
  assert.equal(halted.stoppedAtStage, 'ANALYSIS');
  assert.equal(halted.stages[0].status, 'PASSED'); // REQUEST
  assert.equal(halted.stages[1].status, 'PROVIDER_UNAVAILABLE'); // ANALYSIS
  assert.equal(halted.stages[2].status, 'PENDING'); // PROPOSAL
  assert.equal(halted.stages[7].status, 'PENDING'); // AUDIT
});

test('T8 — Boundary Health Monitor Zero-Evidence Guard Test: Never reports green status without real evidence reference', () => {
  const snapshotWithoutEvidence = evaluateBoundaryHealthSnapshot({
    aiProviderConnected: true,
    aiProviderEvidenceRef: null, // Missing evidence -> must downgrade to UNAVAILABLE
    commandEngineStatus: 'READY',
    commandEngineEvidenceRef: '', // Empty evidence -> must downgrade to ERROR
    adapterConnected: true,
    adapterEvidenceRef: 'ZYRQUEN_WRITE_GATEWAY_V11:BLK-849202',
    targetWorkspaceReachable: true,
    targetWorkspaceId: 'ws-agent-02',
    targetWorkspaceEvidenceRef: null, // Missing evidence -> must downgrade to UNAVAILABLE
    verificationReady: true,
    verificationEvidenceRef: 'VRF:MERKLE_0.000%',
    auditLedgerAvailable: true,
    auditLedgerEvidenceRef: 'AUD-849205-01:SHA256:e3b0c442',
  });

  assert.equal(snapshotWithoutEvidence.aiProvider.status, 'UNAVAILABLE');
  assert.equal(snapshotWithoutEvidence.aiProvider.isGreen, false);
  assert.equal(snapshotWithoutEvidence.commandEngine.status, 'ERROR');
  assert.equal(snapshotWithoutEvidence.commandEngine.isGreen, false);
  assert.equal(snapshotWithoutEvidence.adapter.status, 'CONNECTED');
  assert.equal(snapshotWithoutEvidence.adapter.isGreen, true);
  assert.equal(snapshotWithoutEvidence.targetWorkspace.status, 'UNAVAILABLE');
  assert.equal(snapshotWithoutEvidence.targetWorkspace.isGreen, false);
  assert.equal(snapshotWithoutEvidence.verification.status, 'READY');
  assert.equal(snapshotWithoutEvidence.verification.isGreen, true);
  assert.equal(snapshotWithoutEvidence.auditLedger.status, 'AVAILABLE');
  assert.equal(snapshotWithoutEvidence.auditLedger.isGreen, true);
});

test('T9 — Failure-First Diagnostics Test: Captures all 12 fields and classifies resource_exhausted quota errors as PROVIDER_UNAVAILABLE', () => {
  const rawQuotaError =
    'generic::resource_exhausted: You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generativelanguage.googleapis.com/generate_requests_per_model, limit: 300, model: gdm-lc-eval-phase-1 Please retry in 50.292337146s.';

  assert.equal(parseQuotaRetryAfterSeconds(rawQuotaError), 51);

  const diag = createFailureDiagnosticRecord({
    failureId: 'FAIL-QUOTA-849205-99',
    stage: 'ANALYSIS',
    component: 'AI_SERVICE_BOUNDARY',
    requestId: 'REQ-AI-849205-0301',
    traceId: 'TRC-AI-849205-0301',
    target: 'ws-agent-02',
    actualError: rawQuotaError,
    expectedState: 'AI_PROVIDER_CONNECTED',
    evidence: 'ERR:RESOURCE_EXHAUSTED:LIMIT_300',
  });

  assert.equal(diag.failureId, 'FAIL-QUOTA-849205-99');
  assert.equal(diag.classification, 'PROVIDER_UNAVAILABLE');
  assert.equal(diag.stage, 'ANALYSIS');
  assert.equal(diag.component, 'AI_SERVICE_BOUNDARY');
  assert.equal(diag.requestId, 'REQ-AI-849205-0301');
  assert.equal(diag.traceId, 'TRC-AI-849205-0301');
  assert.equal(diag.target, 'ws-agent-02');
  assert.equal(diag.actualError, rawQuotaError);
  assert.equal(diag.expectedState, 'AI_PROVIDER_CONNECTED');
  assert.match(diag.observedState, /PROVIDER_UNAVAILABLE/);
  assert.equal(diag.evidence, 'ERR:RESOURCE_EXHAUSTED:LIMIT_300');
  assert.ok(diag.timestamp.length > 0);
  assert.match(diag.recoveryState, /QUOTA_COOLDOWN_51S/);
  assert.equal(diag.retryAfterSeconds, 51);
});


