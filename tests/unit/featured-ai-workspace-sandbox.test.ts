import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVerifiedAiArtifactEnvelope,
  executeAiWorkspacePreflightWorkflow,
  computeArtifactSha256,
} from '../../src/adapters/zyrquenAdapter';
import { offlineAuditSyncService } from '../../src/services/offlineAuditSyncService';

test('AI Workspace & Isolated Sandbox Boundary — Fast Launch & Invariant Suite', async (t) => {
  await t.test('1. Computes verifiable SHA-256 artifact hash and creates sealed envelope for sandbox task', () => {
    const requestId = 'REQ-TEST-HOME-01';
    const traceId = 'TRC-TEST-HOME-01';
    const workspaceId = 'ws-agent-02';
    const sourceCode = `export const sovereignDirective = Object.freeze({ agent: 'ZYNTHEOR CORE', isolated: true });`;

    const expectedHash = computeArtifactSha256(sourceCode);
    assert.ok(expectedHash.length >= 64);
    assert.ok(expectedHash.includes(':') || expectedHash.length === 64);

    const artifact = createVerifiedAiArtifactEnvelope({
      artifactId: `ART-${requestId}`,
      sourceCode,
      workspaceId,
      requestId,
      traceId,
      evidenceRef: `EV-HOME-TEST:${workspaceId}:${requestId}`,
    });

    assert.equal(artifact.artifactId, 'ART-REQ-TEST-HOME-01');
    assert.equal(artifact.status, 'VERIFIED');
    assert.equal(artifact.provenance, 'VERIFIED');
    assert.equal(artifact.hash, expectedHash);
  });

  await t.test('2. Preflight workflow executes and verifies sandbox invariants without mutation', () => {
    const requestId = 'REQ-TEST-HOME-02';
    const traceId = 'TRC-TEST-HOME-02';
    const workspaceId = 'ws-agent-02';
    const sourceCode = `// Directive\nexport const directive = { zeroEgress: true, failClosed: true };`;

    const artifact = createVerifiedAiArtifactEnvelope({
      artifactId: `ART-${requestId}`,
      sourceCode,
      workspaceId,
      requestId,
      traceId,
    });

    const result = executeAiWorkspacePreflightWorkflow({
      requestId,
      traceId,
      targetWorkspace: workspaceId,
      prompt: 'Execute zero-drift preflight verification',
      artifact,
      currentBatchSize: 64,
      proposedBatchSize: 64,
    });

    assert.equal(result.ok, true);
    assert.equal(result.preflight.status, 'VERIFIED');
    assert.equal(result.coreMutationCount, 0);
    assert.equal(result.ssotMutationCount, 0);
    assert.equal(result.genesisFrozen, true);
    assert.equal(result.authorizationGranted, false);
  });

  await t.test('3. Enforces AST sandbox fail-closed rejection on invalid or mismatched artifact envelope', () => {
    const requestId = 'REQ-TEST-HOME-03';
    const traceId = 'TRC-TEST-HOME-03';

    // Mismatched workspace ID
    const result = executeAiWorkspacePreflightWorkflow({
      requestId,
      traceId,
      targetWorkspace: 'ws-agent-02',
      prompt: 'Test mismatched artifact',
      artifact: {
        artifactId: 'ART-INVALID',
        sourceCode: 'invalid',
        workspaceId: 'ws-agent-WRONG',
        requestId,
        traceId,
        hash: 'invalidhash',
        status: 'VERIFIED',
      },
      currentBatchSize: 64,
      proposedBatchSize: 64,
    });

    assert.equal(result.ok, false);
    assert.equal(result.workflowState, 'WAITING FOR VERIFIED AI ARTIFACT');
    assert.equal(result.executionTrace.overallStatus, 'HALTED');
  });

  await t.test('4. Emits offline-resilient WORM audit event for fast launch tasks', () => {
    const enqueued = offlineAuditSyncService.enqueueEvent({
      type: 'AI_SANDBOX_FAST_LAUNCH_TEST',
      title: 'AI Task Dispatched: ZYNTHEOR CORE',
      description: 'Test fast launch audit entry under ETDA Sec 26',
      metaHash: 'test-hash-42',
      severity: 'success',
      statuteRef: 'ETDA B.E. 2544 Sec 26',
    });

    assert.ok(enqueued.id);
    assert.equal(enqueued.type, 'AI_SANDBOX_FAST_LAUNCH_TEST');
    assert.equal(enqueued.title, 'AI Task Dispatched: ZYNTHEOR CORE');
    assert.equal(enqueued.severity, 'success');
  });
});
