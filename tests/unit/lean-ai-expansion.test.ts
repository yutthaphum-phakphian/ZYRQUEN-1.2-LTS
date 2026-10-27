import test from 'node:test';
import assert from 'node:assert/strict';
import { aiAgentRegistryService } from '../../src/services/aiAgentRegistryService';
import {
  toolGateway,
  redactSensitiveTokens,
  checkRateLimit,
  verifyPayloadSha256Tripwire,
} from '../../src/adapters/toolGateway';
import { zyntheorTrainingService } from '../../src/services/zyntheorTrainingService';
import { sessionService, AuthenticatedSession } from '../../src/services/sessionService';

const MOCK_ARCHITECT_SESSION = {
  sessionId: 'SES-LEAN-TEST-001',
  userId: 'usr-architect-01',
  userDisplayName: 'Sovereign Architect',
  role: 'ARCHITECT',
  authenticatedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  authMethod: 'WEBAUTHN_FIPS_L4',
  permissions: ['*'],
  token: 'SOV_TOKEN_TEST_MOCK_TOKEN',
  fipsValidated: true,
  statuteRef: 'ETDA Sec 26 Certified',
};


test('Lean AI Capability Expansion Plan Suite (5 Pillars)', async (t) => {
  aiAgentRegistryService.clearRoutingCache();
  await sessionService.createSessionFromWebAuthn({ credentialId: 'CRED-LEAN-TEST-001' });

  // =========================================================================
  // Pillar 1: Performance Optimization (In-Memory LRU Cache & Async Queue)
  // =========================================================================
  await t.test('Pillar 1.1: caches repetitive routing simulations and returns sub-millisecond cached result', async () => {
    const prompt = 'Forensic audit for Chamber 04 under ETDA B.E. 2544 Sec 26.';

    // Cold run (cache miss)
    const coldResult = await aiAgentRegistryService.executeWorkflowSimulation('route-code-assist', prompt);
    assert.equal(coldResult.status, 'COMPLETED');
    assert.equal(coldResult.cached, false);

    // Warm run (cache hit)
    const warmResult = await aiAgentRegistryService.executeWorkflowSimulation('route-code-assist', prompt);
    assert.equal(warmResult.status, 'COMPLETED');
    assert.equal(warmResult.cached, true);
    assert.ok(warmResult.totalLatencyMs <= 1.0, 'Cached latency must be <= 1.0ms');

    const stats = aiAgentRegistryService.getCacheStats();
    assert.ok(stats.hits >= 1, 'Cache hits should be >= 1');
    assert.ok(stats.hitRatePct > 0, 'Cache hit rate should be > 0%');
  });

  await t.test('Pillar 1.2: enqueues executions via non-blocking async task queue', async () => {
    const order: number[] = [];
    const p1 = aiAgentRegistryService.enqueueExecution(async () => {
      order.push(1);
      return 'first';
    });
    const p2 = aiAgentRegistryService.enqueueExecution(async () => {
      order.push(2);
      return 'second';
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    assert.equal(r1, 'first');
    assert.equal(r2, 'second');
    assert.deepEqual(order, [1, 2]);
  });

  // =========================================================================
  // Pillar 2: Human-AI Collaboration (Manual Override & Feedback Loop)
  // =========================================================================
  await t.test('Pillar 2.1: records operator quality feedback on routing decisions', async () => {
    const prompt = 'Test directive for human operator verification.';
    await aiAgentRegistryService.executeWorkflowSimulation('route-code-assist', prompt);

    const logs = aiAgentRegistryService.getRoutingDecisionLogs();
    const latestLog = logs[0];
    assert.ok(latestLog, 'Routing decision log should exist');

    const success = aiAgentRegistryService.submitDecisionFeedback(latestLog.id, {
      rating: 5,
      score: 'POSITIVE',
      notes: 'Forensic attestation was precise and compliant with ETDA Sec 26.',
      operator: 'Chief Auditor #EP-01',
    });

    assert.equal(success, true);
    const updatedLogs = aiAgentRegistryService.getRoutingDecisionLogs();
    const updated = updatedLogs.find((l) => l.id === latestLog.id);
    assert.ok(updated?.feedback, 'Feedback must be attached to decision log');
    assert.equal(updated?.feedback?.rating, 5);
    assert.equal(updated?.feedback?.score, 'POSITIVE');
    assert.ok(updated?.feedback?.notes?.includes('Forensic attestation'));
  });

  await t.test('Pillar 2.2: allows operator manual override on AI routing and invalidates stale cache', async () => {
    const prompt = 'Directive for manual rerouting test.';
    await aiAgentRegistryService.executeWorkflowSimulation('route-code-assist', prompt);

    const logs = aiAgentRegistryService.getRoutingDecisionLogs();
    const latestLog = logs[0];

    const overrideSuccess = aiAgentRegistryService.applyManualOverride(
      latestLog.id,
      'agent-chamber18-sentinel',
      'Human override: Escalated to Neural Sentinel for strict quarantine audit',
      'Senior Compliance Officer'
    );

    assert.equal(overrideSuccess, true);
    const updatedLog = aiAgentRegistryService.getRoutingDecisionLogs().find((l) => l.id === latestLog.id);
    assert.ok(updatedLog?.manualOverride, 'manualOverride should be recorded');
    assert.equal(updatedLog?.manualOverride?.newAgentId, 'agent-chamber18-sentinel');
    assert.equal(updatedLog?.manualOverride?.overriddenBy, 'Senior Compliance Officer');

    // Routing cache was cleared to prevent stale routing
    const cacheStats = aiAgentRegistryService.getCacheStats();
    assert.equal(cacheStats.size, 0);
  });

  // =========================================================================
  // Pillar 3: Data Pipeline Refinement (Incremental Delta Ingestion & Deduplication)
  // =========================================================================
  await t.test('Pillar 3: ingests incremental delta batches, filters duplicates, and validates quality', () => {
    const initialManifest = zyntheorTrainingService.getDatasetManifest();

    const batch = [
      {
        instruction: 'ตรวจสอบข้อความทางกฎหมายตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 26',
        output: 'ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ต้องเป็นไปตามเงื่อนไขความเชื่อมโยงกับผู้สร้างลายมือชื่อและการตรวจพบการเปลี่ยนแปลง',
        language: 'th' as const,
        category: 'ETDA_COMPLIANCE' as const,
      },
      // Duplicate sample
      {
        instruction: 'ตรวจสอบข้อความทางกฎหมายตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 26',
        output: 'ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ต้องเป็นไปตามเงื่อนไขความเชื่อมโยงกับผู้สร้างลายมือชื่อและการตรวจพบการเปลี่ยนแปลง',
        language: 'th' as const,
        category: 'ETDA_COMPLIANCE' as const,
      },
      // Invalid sample (too short)
      {
        instruction: 'สั้น',
        output: 'สั้น',
        language: 'th' as const,
        category: 'REASONING' as const,
      },
    ];

    const result = zyntheorTrainingService.ingestIncrementalBatch(batch);
    assert.equal(result.addedCount, 1);
    assert.equal(result.duplicateCount, 1);
    assert.equal(result.invalidCount, 1);

    const newManifest = zyntheorTrainingService.getDatasetManifest();
    assert.equal(newManifest.totalSamples, initialManifest.totalSamples + 1);
  });

  // =========================================================================
  // Pillar 4: Security Enhancement (Log Redaction, Rate Limiter, Bounds, Tripwire)
  // =========================================================================
  await t.test('Pillar 4.1: redacts sensitive Bearer tokens, API keys, and passwords from logs', () => {
    const sensitiveLog = 'Authorization: Bearer SOV_TOKEN_SUPER_SECRET_KEY_12345 sk-ant-api03-abcdef123456789 with password="AdminSecret99!"';
    const redacted = redactSensitiveTokens(sensitiveLog);

    assert.ok(!redacted.includes('SOV_TOKEN_SUPER_SECRET_KEY_12345'), 'Token should be redacted');
    assert.ok(!redacted.includes('sk-ant-api03-abcdef123456789'), 'API key should be redacted');
    assert.ok(!redacted.includes('AdminSecret99!'), 'Password should be redacted');
    assert.ok(redacted.includes('[REDACTED_BEARER_TOKEN]'));
    assert.ok(redacted.includes('[REDACTED_API_KEY]'));
  });

  await t.test('Pillar 4.2: enforces in-process sliding window rate limiting without external dependencies', () => {
    const clientId = 'test-client-rate-limit-suite';
    let lastCheck = { allowed: true, remaining: 60, resetMs: 60000 };

    for (let i = 0; i < 60; i++) {
      lastCheck = checkRateLimit(clientId, 60);
      assert.equal(lastCheck.allowed, true);
    }

    // 61st call must be blocked
    const blockedCheck = checkRateLimit(clientId, 60);
    assert.equal(blockedCheck.allowed, false);
    assert.equal(blockedCheck.remaining, 0);
  });

  await t.test('Pillar 4.3: blocks payloads that exceed maximum bounds (>8192 bytes)', async () => {
    await sessionService.createSessionFromWebAuthn({ credentialId: 'CRED-LEAN-TEST-001' });
    const oversizedParams = {
      data: 'A'.repeat(9000),
    };

    const result = await toolGateway.executeTool({
      toolId: 'workspace.inspect',
      targetWorkspace: 'ws-agent-02',
      params: oversizedParams,
    });

    assert.equal(result.success, false);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.diagnostic?.actualError?.includes('INPUT_BOUNDS_EXCEEDED'));
  });

  await t.test('Pillar 4.4: computes and verifies SHA-256 payload integrity tripwire', () => {
    const payload = '{"command":"AUDIT_SEALS","timestamp":"2026-10-27T08:00:00Z"}';
    const tripwire = verifyPayloadSha256Tripwire(payload);
    assert.equal(tripwire.pass, true);
    assert.ok(tripwire.computedHash.includes('SHA256_'));

    // Mismatched expected hash fails tripwire
    const mismatched = verifyPayloadSha256Tripwire(payload, 'SHA256_0000000000000000');
    assert.equal(mismatched.pass, false);
  });

  // =========================================================================
  // Pillar 5: Tool Registry Expansion (Schemas & Single-Flag DRY_RUN)
  // =========================================================================
  await t.test('Pillar 5.1: verifies that canonical tools define parameter schemas', () => {
    const inspectTool = toolGateway.getTool('workspace.inspect');
    assert.ok(inspectTool?.parameterSchema, 'inspect tool should have parameterSchema');

    const tuneTool = toolGateway.getTool('workspace.tune_batch');
    assert.ok(tuneTool?.parameterSchema?.proposedBatchSize, 'proposedBatchSize schema should exist');
    assert.equal(tuneTool?.parameterSchema?.proposedBatchSize.type, 'number');
  });

  await t.test('Pillar 5.2: executes tool in DRY_RUN mode without committing live mutations', async () => {
    await sessionService.createSessionFromWebAuthn({ credentialId: 'CRED-LEAN-TEST-001' });
    
    const result = await toolGateway.executeTool({
      toolId: 'workspace.tune_batch',
      targetWorkspace: 'ws-agent-02',
      params: { proposedBatchSize: 48 },
      executionMode: 'DRY_RUN',
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'EXECUTED');
    assert.equal(result.dryRun, true);
    assert.equal((result.output as any).simulated, true);
    assert.equal((result.output as any).dryRun, true);
    assert.ok(result.auditEvidenceRef.includes('EVIDENCE:DRY_RUN'));
  });
});
