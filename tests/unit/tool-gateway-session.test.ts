import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sessionService,
  SOVEREIGN_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../../src/services/sessionService';
import {
  toolGateway,
  SovereignToolGateway,
  CANONICAL_TOOLS,
} from '../../src/adapters/toolGateway';

test('Sovereign Session Service & Role-Based Permissions', async (t) => {
  await t.test('initializes default sovereign architect session as active owner', () => {
    const session = sessionService.getCurrentSession();
    assert.ok(session !== null, 'Session should exist');
    assert.equal(session.role, 'owner');
    assert.equal(session.username, 'EP-SOVEREIGN-01');
    assert.ok(sessionService.isAuthenticated(), 'Default session should be active and authenticated');
    assert.ok(sessionService.hasPermission(SOVEREIGN_PERMISSIONS.TOOLS_EXECUTE_PROPOSAL));
    assert.ok(sessionService.hasPermission(SOVEREIGN_PERMISSIONS.TOOLS_HSM_HEAL));
    assert.ok(sessionService.hasPermission(SOVEREIGN_PERMISSIONS.TOOLS_INSPECT));
  });

  await t.test('creates session from WebAuthn credential', async () => {
    const newSession = await sessionService.createSessionFromWebAuthn({
      credentialId: 'CRED-TEST-FIPS-140-3',
      userHandle: 'usr_owner_ep01',
      signatureHex: '0x1234567890abcdef',
    });
    assert.equal(newSession.credentialId, 'CRED-TEST-FIPS-140-3');
    assert.equal(newSession.status, 'ACTIVE');
    assert.ok(sessionService.isAuthenticated());
  });

  await t.test('revokes session on logout', async () => {
    await sessionService.logout();
    assert.equal(sessionService.isAuthenticated(), false);
    assert.equal(sessionService.getCurrentSession(), null);
    assert.equal(sessionService.hasPermission(SOVEREIGN_PERMISSIONS.TOOLS_INSPECT), false);

    // Restore active session for subsequent tests
    await sessionService.createSessionFromWebAuthn({
      credentialId: 'CRED-RESTORED-001',
    });
    assert.ok(sessionService.isAuthenticated());
  });
});

test('Sovereign Tool Gateway Interceptor & Invariants', async (t) => {
  const gateway = new SovereignToolGateway();

  await t.test('registers all canonical sovereign tools with correct risk tiers', () => {
    const tools = gateway.getAllTools();
    assert.ok(tools.length >= 7, 'Should have registered canonical tools');

    const inspectTool = gateway.getTool('workspace.inspect');
    assert.ok(inspectTool);
    assert.equal(inspectTool.category, 'READ_ONLY');
    assert.equal(inspectTool.requiresApproval, false);

    const tuneTool = gateway.getTool('workspace.execute_tuning');
    assert.ok(tuneTool);
    assert.equal(tuneTool.category, 'HIGH_MUTATION');
    assert.equal(tuneTool.requiresApproval, true);

    const healTool = gateway.getTool('system.hsm_heal');
    assert.ok(healTool);
    assert.equal(healTool.requiresApproval, true);
  });

  await t.test('enforces Core Isolation Guard — blocks any direct ZYRQUEN_CORE write attempt', async () => {
    const result = await gateway.executeTool({
      toolId: 'workspace.execute_tuning',
      targetWorkspace: 'ZYRQUEN_CORE',
      targetLayer: 'ZYRQUEN_CORE',
      params: { proposedBatchSize: 48 },
      approvalCertificate: {
        proposalId: 'PROP-01',
        approvedBy: 'EP-SOVEREIGN-01',
        approvedAt: new Date().toISOString(),
        signature: 'SIG_TEST',
      },
    });

    assert.equal(result.success, false);
    assert.equal(result.status, 'BLOCKED');
    assert.equal(result.targetLayer, 'ZYRQUEN_CORE');
    assert.ok(result.diagnostic?.actualError.includes('CORE_MUTATION_PROHIBITED'));
  });

  await t.test('enforces Approval Gate — rejects mutation without explicit approval certificate', async () => {
    const result = await gateway.executeTool({
      toolId: 'workspace.execute_tuning',
      targetWorkspace: 'ws-agent-02',
      targetLayer: 'WORKSPACE_RUNTIME',
      params: { proposedBatchSize: 48 },
      approvalCertificate: null, // Voice or chat alone without approval certificate
    });

    assert.equal(result.success, false);
    assert.equal(result.status, 'APPROVAL_REQUIRED');
    assert.equal(result.provenance, 'PROPOSED');
  });

  await t.test('executes approved tuning when valid approval certificate is supplied', async () => {
    const result = await gateway.executeTool({
      toolId: 'workspace.execute_tuning',
      targetWorkspace: 'ws-agent-02',
      targetLayer: 'WORKSPACE_RUNTIME',
      params: { proposedBatchSize: 48 },
      approvalCertificate: {
        proposalId: 'PROP-TEST-0042',
        approvedBy: '#EP-SOVEREIGN-01',
        approvedAt: new Date().toISOString(),
        signature: 'SIG_PQC_DILITHIUM5_RATIFIED',
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'EXECUTED');
    assert.equal(result.provenance, 'VERIFIED');
    assert.ok(result.output);
  });

  await t.test('executes read-only telemetry inspection seamlessly with zero mutation', async () => {
    const result = await gateway.executeTool({
      toolId: 'workspace.inspect',
      targetWorkspace: 'ws-agent-02',
      targetLayer: 'WORKSPACE_RUNTIME',
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'EXECUTED');
    assert.equal(result.provenance, 'VERIFIED');
    assert.ok(result.output);
  });
});
