import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ZYRQUEN_CORE_FROZEN_STATE,
  SOVEREIGN_PRINCIPAL_AUTHORITY,
  verifyAllStageEvidenceComplete,
  loadAuthoritativePhase11Transaction,
  finalizePhase11Transaction,
  stageNewProposalTransaction,
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
  computeArtifactSha256,
  createVerifiedAiArtifactEnvelope,
  inspectAiArtifactPreflight,
  executeAiWorkspacePreflightWorkflow,
  executeFullCycleHeadlessE2E,
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
    '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
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

  // Idempotency check: re-sanitizing already sanitized HTML must never duplicate <meta http-equiv="Content-Security-Policy" ...>
  const secondPass = validateAndSanitizePreviewHtml(result.sanitizedHtml);
  assert.equal(secondPass.valid, true);
  assert.ok(secondPass.sanitizedHtml);
  const cspMatches = secondPass.sanitizedHtml.match(/http-equiv=["']Content-Security-Policy["']/gi) || [];
  assert.equal(cspMatches.length, 1);
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
    auditLedgerEvidenceRef: 'AUD-849205-01:SHA256:909ab814',
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

test('T10 — End-to-End Proposal Staging -> Approval (#EP-SOVEREIGN-01) -> Execution -> Audit Finalization -> Replay Lock Test', () => {
  resetAuthoritativePhase11TransactionToFinalized();

  // 1. Stage a brand-new AI Proposal for ws-agent-02
  const staged = stageNewProposalTransaction({
    proposalId: 'PROP-AI-849202-0007',
    targetWorkspace: 'ws-agent-02',
    previousValue: 64,
    proposedValue: 48,
  });
  assert.equal(staged.isFinalized, false);
  assert.equal(staged.lifecycleStage, 'APPROVAL_REQUIRED');
  assert.equal(staged.lockPolicies.approval, 'OPEN');

  // 2. First execution attempt on the new proposal must be ALLOWED
  const firstAttempt = attemptIdempotentPhase11Execution({
    transactionId: staged.transactionId,
    traceId: staged.traceId,
    operationId: staged.operationId,
    actor: SOVEREIGN_PRINCIPAL_AUTHORITY.id,
  });
  assert.equal(firstAttempt.allowed, true);
  assert.equal(firstAttempt.status, 'ALLOWED');

  // 3. Complete all 8 evidence checkpoints and finalize into WORM Audit Ledger
  const finalized = finalizePhase11Transaction({
    ...staged,
    lifecycleStage: 'COMPLETED',
    workspaceMutationCount: staged.workspaceMutationCount + 1,
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
  });
  assert.equal(finalized.finalized, true);
  assert.equal(finalized.lifecycleStage, 'FINALIZED');
  assert.equal(finalized.transaction.isFinalized, true);
  assert.equal(finalized.transaction.coreMutationCount, 0);

  // 4. 8-Stage Real Execution Trace transitions to FINALIZED with all 8 stages PASSED
  const completedTrace = buildExecutionTraceForOutcome({
    traceId: finalized.transaction.traceId,
    requestId: finalized.transaction.transactionId,
    targetWorkspace: 'ws-agent-02',
    stoppedAtStage: null,
  });
  assert.equal(completedTrace.overallStatus, 'FINALIZED');
  assert.equal(completedTrace.stoppedAtStage, null);
  assert.ok(completedTrace.stages.every((s) => s.status === 'PASSED' && Boolean(s.evidenceRef)));

  // 5. Re-staging or re-executing the same finalized proposalId is deterministically BLOCKED
  const restaged = stageNewProposalTransaction({
    proposalId: 'PROP-AI-849202-0007',
    targetWorkspace: 'ws-agent-02',
    previousValue: 64,
    proposedValue: 48,
  });
  assert.equal(restaged.isFinalized, true);

  const duplicateAttempt = attemptIdempotentPhase11Execution({
    transactionId: restaged.transactionId,
    traceId: restaged.traceId,
    operationId: restaged.operationId,
    actor: SOVEREIGN_PRINCIPAL_AUTHORITY.id,
  });
  assert.equal(duplicateAttempt.allowed, false);
  assert.equal(duplicateAttempt.status, 'BLOCKED');
  assert.equal(duplicateAttempt.reason, 'TRANSACTION_ALREADY_FINALIZED');
  assert.equal(duplicateAttempt.mutationOccurred, false);
  assert.equal(duplicateAttempt.coreMutationCount, 0);

  resetAuthoritativePhase11TransactionToFinalized();
});

test('T11 — AI Artifact Preflight Gate: Verified Artifact passes Preflight (Preflight = VERIFIED) and forwards into Analysis -> Proposal -> Preview -> Explicit Approval', () => {
  const sourceCode = '<!DOCTYPE html><html><body class="bg-slate-950 text-white">Verified Workspace Widget</body></html>';
  const requestId = 'REQ-AI-849202-0101';
  const traceId = 'TRC-AI-849202-0101';
  const proposalId = 'PROP-AI-AI-849202-0101';
  const workspaceId = 'ws-agent-02';

  const verifiedArtifact = createVerifiedAiArtifactEnvelope({
    artifactId: 'ART-849202-0101',
    sourceCode,
    workspaceId,
    requestId,
    traceId,
    evidenceRef: `E2E:${requestId}:${traceId}:${proposalId}`,
    provenance: 'VERIFIED',
  });

  const preflight = inspectAiArtifactPreflight({
    artifact: verifiedArtifact,
    expectedWorkspaceId: workspaceId,
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });

  assert.equal(preflight.passed, true);
  assert.equal(preflight.status, 'VERIFIED');
  assert.equal(preflight.reason, 'ARTIFACT_VERIFIED');
  assert.equal(preflight.preflightLabel, 'Preflight = VERIFIED');
  assert.equal(preflight.gateState, 'PREFLIGHT_VERIFIED');
  assert.equal(preflight.allowProceedToAnalysis, true);
  assert.equal(preflight.allowProceedToProposal, true);
  assert.equal(preflight.coreMutationCount, 0);
  assert.equal(preflight.ssotMutationCount, 0);
  assert.equal(preflight.genesisBlock, 849202);
  assert.equal(preflight.genesisFrozen, true);
  assert.equal(preflight.computedHash, computeArtifactSha256(sourceCode));
  assert.equal(preflight.diagnostic, null);

  const workflow = executeAiWorkspacePreflightWorkflow({
    requestId,
    traceId,
    targetWorkspace: workspaceId,
    artifact: verifiedArtifact,
    currentBatchSize: 64,
    proposedBatchSize: 48,
  });

  assert.equal(workflow.ok, true);
  assert.equal(workflow.workflowState, 'PROCEEDED_TO_EXPLICIT_APPROVAL_GATE');
  assert.equal(workflow.preflight.passed, true);
  assert.equal(workflow.preflight.preflightLabel, 'Preflight = VERIFIED');
  assert.notEqual(workflow.analysis, null);
  assert.notEqual(workflow.proposal, null);
  assert.equal(workflow.proposal?.proposalId, proposalId);
  assert.equal(workflow.proposal?.requiresApprover, '#EP-SOVEREIGN-01');
  assert.equal(workflow.previewHtml, sourceCode);
  assert.equal(workflow.requiresExplicitApproval, true);
  assert.equal(workflow.authorizationGranted, false);
  assert.equal(workflow.coreMutationCount, 0);
  assert.equal(workflow.ssotMutationCount, 0);
});

test('T12 — AI Artifact Preflight Gate: Unverified Artifact is halted at WAITING FOR VERIFIED AI ARTIFACT before Proposal', () => {
  const sourceCode = '<div>Unverified candidate</div>';
  const requestId = 'REQ-AI-849202-0102';
  const traceId = 'TRC-AI-849202-0102';
  const workspaceId = 'ws-agent-02';

  const unverifiedArtifact = {
    artifactId: 'ART-849202-0102',
    sourceCode,
    provenance: 'UNVERIFIED' as const,
    evidenceRef: `E2E:${requestId}:${traceId}`,
    hash: computeArtifactSha256(sourceCode),
    workspaceId,
    requestId,
    traceId,
    timestamp: new Date().toISOString(),
  };

  const workflow = executeAiWorkspacePreflightWorkflow({
    requestId,
    traceId,
    targetWorkspace: workspaceId,
    artifact: unverifiedArtifact,
    currentBatchSize: 64,
    proposedBatchSize: 48,
  });

  assert.equal(workflow.ok, false);
  assert.equal(workflow.workflowState, 'WAITING FOR VERIFIED AI ARTIFACT');
  assert.equal(workflow.preflight.passed, false);
  assert.equal(workflow.preflight.status, 'UNVERIFIED');
  assert.equal(workflow.preflight.reason, 'UNVERIFIED_ARTIFACT');
  assert.equal(workflow.preflight.gateState, 'WAITING FOR VERIFIED AI ARTIFACT');
  assert.equal(workflow.preflight.preflightLabel, 'WAITING FOR VERIFIED AI ARTIFACT');
  assert.equal(workflow.preflight.allowProceedToAnalysis, false);
  assert.equal(workflow.preflight.allowProceedToProposal, false);
  assert.equal(workflow.analysis, null);
  assert.equal(workflow.proposal, null);
  assert.equal(workflow.previewHtml, null);
  assert.equal(workflow.requiresExplicitApproval, false);
  assert.equal(workflow.coreMutationCount, 0);
  assert.equal(workflow.ssotMutationCount, 0);
  assert.equal(workflow.executionTrace.overallStatus, 'HALTED');
  assert.equal(workflow.executionTrace.stoppedAtStage, 'REQUEST');
});

test('T13 — AI Artifact Preflight Gate: Missing / NULL Artifact halts at WAITING FOR VERIFIED AI ARTIFACT (Fail-Closed without crash)', () => {
  const requestId = 'REQ-AI-849202-0103';
  const traceId = 'TRC-AI-849202-0103';
  const workspaceId = 'ws-agent-02';

  const nullCheck = inspectAiArtifactPreflight({
    artifact: null,
    expectedWorkspaceId: workspaceId,
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });

  assert.equal(nullCheck.passed, false);
  assert.equal(nullCheck.status, 'NULL');
  assert.equal(nullCheck.reason, 'MISSING_ARTIFACT');
  assert.equal(nullCheck.gateState, 'WAITING FOR VERIFIED AI ARTIFACT');
  assert.equal(nullCheck.preflightLabel, 'WAITING FOR VERIFIED AI ARTIFACT');
  assert.equal(nullCheck.allowProceedToAnalysis, false);
  assert.equal(nullCheck.allowProceedToProposal, false);
  assert.equal(nullCheck.coreMutationCount, 0);
  assert.equal(nullCheck.ssotMutationCount, 0);

  const workflow = executeAiWorkspacePreflightWorkflow({
    requestId,
    traceId,
    targetWorkspace: workspaceId,
    artifact: undefined,
    currentBatchSize: 64,
    proposedBatchSize: 48,
  });

  assert.equal(workflow.ok, false);
  assert.equal(workflow.workflowState, 'WAITING FOR VERIFIED AI ARTIFACT');
  assert.equal(workflow.analysis, null);
  assert.equal(workflow.proposal, null);
  assert.equal(workflow.previewHtml, null);
  assert.equal(workflow.coreMutationCount, 0);
  assert.equal(workflow.ssotMutationCount, 0);
});

test('T14 — AI Artifact Preflight Gate: Invalid provenance, missing/fake evidenceRef, hash mismatch, and workspace/request/trace mismatch are deterministically rejected', () => {
  const sourceCode = '<section> Sovereign Artifact </section>';
  const validHash = computeArtifactSha256(sourceCode);
  const requestId = 'REQ-AI-849202-0104';
  const traceId = 'TRC-AI-849202-0104';
  const workspaceId = 'ws-agent-02';

  // 1. Invalid provenance ('ESTIMATED')
  const invalidProv = inspectAiArtifactPreflight({
    artifact: {
      artifactId: 'ART-1',
      sourceCode,
      provenance: 'ESTIMATED',
      evidenceRef: `E2E:${requestId}:${traceId}`,
      hash: validHash,
      workspaceId,
      requestId,
      traceId,
    },
    expectedWorkspaceId: workspaceId,
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });
  assert.equal(invalidProv.passed, false);
  assert.equal(invalidProv.status, 'UNVERIFIED');
  assert.equal(invalidProv.reason, 'INVALID_PROVENANCE');
  assert.equal(invalidProv.gateState, 'WAITING FOR VERIFIED AI ARTIFACT');

  // 2. Missing or fake/mock evidenceRef
  const fakeEvidence = inspectAiArtifactPreflight({
    artifact: {
      artifactId: 'ART-2',
      sourceCode,
      provenance: 'VERIFIED',
      evidenceRef: 'MOCK:FAKE_EVIDENCE_01',
      hash: validHash,
      workspaceId,
      requestId,
      traceId,
    },
    expectedWorkspaceId: workspaceId,
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });
  assert.equal(fakeEvidence.passed, false);
  assert.equal(fakeEvidence.reason, 'MISSING_EVIDENCE_REF');

  // 3. Hash mismatch (tampered source code)
  const hashMismatch = inspectAiArtifactPreflight({
    artifact: {
      artifactId: 'ART-3',
      sourceCode: '<section> Tampered Artifact </section>',
      provenance: 'VERIFIED',
      evidenceRef: `E2E:${requestId}:${traceId}`,
      hash: validHash,
      workspaceId,
      requestId,
      traceId,
    },
    expectedWorkspaceId: workspaceId,
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });
  assert.equal(hashMismatch.passed, false);
  assert.equal(hashMismatch.reason, 'HASH_MISMATCH');

  // 4. TraceId / RequestId / Workspace mismatch
  const traceMismatch = inspectAiArtifactPreflight({
    artifact: {
      artifactId: 'ART-4',
      sourceCode,
      provenance: 'VERIFIED',
      evidenceRef: `E2E:${requestId}:${traceId}`,
      hash: validHash,
      workspaceId,
      requestId,
      traceId: 'TRC-AI-849202-9999',
    },
    expectedWorkspaceId: workspaceId,
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });
  assert.equal(traceMismatch.passed, false);
  assert.equal(traceMismatch.reason, 'TRACE_ID_MISMATCH');

  // 5. Empty-input SHA-256 (e3b0c442...) is deterministically rejected
  const emptyHashRejected = inspectAiArtifactPreflight({
    artifact: {
      artifactId: 'ART-5',
      sourceCode,
      provenance: 'VERIFIED',
      evidenceRef: `E2E:${requestId}:${traceId}`,
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workspaceId,
      requestId,
      traceId,
    },
    expectedWorkspaceId: workspaceId,
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });
  assert.equal(emptyHashRejected.passed, false);
  assert.equal(emptyHashRejected.reason, 'HASH_MISMATCH');
});

test('T15 — AI Artifact Preflight Gate: Core target (ZYRQUEN_CORE) is blocked with Core Mutation = 0, SSoT Mutation = 0, and Genesis #849202 FROZEN', () => {
  const sourceCode = '<div>Attempt core write</div>';
  const requestId = 'REQ-AI-849202-0105';
  const traceId = 'TRC-AI-849202-0105';

  const coreArtifact = createVerifiedAiArtifactEnvelope({
    artifactId: 'ART-CORE-01',
    sourceCode,
    workspaceId: 'ZYRQUEN_CORE',
    requestId,
    traceId,
    evidenceRef: `E2E:${requestId}:${traceId}`,
    provenance: 'VERIFIED',
  });

  const corePreflight = inspectAiArtifactPreflight({
    artifact: coreArtifact,
    expectedWorkspaceId: 'ZYRQUEN_CORE',
    expectedRequestId: requestId,
    expectedTraceId: traceId,
  });

  assert.equal(corePreflight.passed, false);
  assert.equal(corePreflight.status, 'UNVERIFIED');
  assert.equal(corePreflight.reason, 'CORE_TARGET_BLOCKED');
  assert.equal(corePreflight.coreMutationCount, 0);
  assert.equal(corePreflight.ssotMutationCount, 0);
  assert.equal(
    corePreflight.canonicalMerkleRoot,
    '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
  );
  assert.equal(Object.isFrozen(ZYRQUEN_CORE_FROZEN_STATE), true);
  assert.equal(ZYRQUEN_CORE_FROZEN_STATE.isFrozen, true);
  assert.equal(ZYRQUEN_CORE_FROZEN_STATE.canonicalBlock, 849202);
  assert.equal(ZYRQUEN_CORE_FROZEN_STATE.drift, 'Δ0.000%');
  assert.equal(
    ZYRQUEN_CORE_FROZEN_STATE.merkleRoot,
    '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
  );
});

test('T16 — AI Artifact Preflight Gate: Existing Full-Cycle Headless E2E workflow remains intact without regression', () => {
  resetAuthoritativePhase11TransactionToFinalized();

  const e2eResult = executeFullCycleHeadlessE2E({
    proposalId: 'PROP-AI-849202-0106',
    requestId: 'REQ-AI-849202-0106',
    traceId: 'TRC-AI-849202-0106',
    targetWorkspace: 'ws-agent-02',
    previousBatchSize: 64,
    proposedBatchSize: 48,
    approverSignature: SOVEREIGN_PRINCIPAL_AUTHORITY.id,
  });

  assert.equal(e2eResult.ok, true);
  assert.equal(e2eResult.preflight?.passed, true);
  assert.equal(e2eResult.preflight?.status, 'VERIFIED');
  assert.equal(e2eResult.preflight?.preflightLabel, 'Preflight = VERIFIED');
  assert.equal(e2eResult.transaction.isFinalized, true);
  assert.equal(e2eResult.transaction.coreMutationCount, 0);
  assert.equal(e2eResult.executionTrace.overallStatus, 'FINALIZED');
  assert.equal(e2eResult.replayCheckBlocked, true);
  assert.equal(e2eResult.coreMutationCount, 0);

  resetAuthoritativePhase11TransactionToFinalized();
});


