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
} from '../../src/adapters/zyrquenAdapter';
import { INITIAL_ADAPTER_WRITE_GATE_STEPS } from '../../src/utils/hologramMaterial';
import { validateAndSanitizePreviewHtml } from '../../src/components/ZyrquenVoiceChatBuilder';

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

