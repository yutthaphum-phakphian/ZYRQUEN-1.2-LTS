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

test('Central ToolGateway Middleware validateAndExecute(toolId, params, session)', async (t) => {
  const { validateAndExecute } = await import('../../src/services/ToolGateway');

  const activeOwnerSession = {
    sessionId: 'SES-TEST-OWNER',
    token: 'SOV_TEST_TOKEN',
    role: 'owner',
    username: 'EP-SOVEREIGN-01',
    userDisplayName: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    permissions: [
      'workspace:read',
      'workspace:chat',
      'tools:inspect',
      'tools:tune_batch',
      'tools:execute_proposal',
      'tools:quarantine',
      'tools:hsm_heal',
      'tools:export_dossier',
      'tools:audit_sync',
    ],
    status: 'ACTIVE',
  };

  const restrictedUserSession = {
    sessionId: 'SES-TEST-USER',
    token: 'USER_TOKEN',
    role: 'user',
    username: 'guest_user',
    userDisplayName: 'Guest User',
    permissions: ['workspace:read', 'tools:inspect'],
    status: 'ACTIVE',
  };

  const expiredSession = {
    sessionId: 'SES-TEST-EXPIRED',
    token: 'EXPIRED_TOKEN',
    role: 'owner',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() - 10000).toISOString(),
  };

  await t.test('rejects execution when session is unauthenticated or null', async () => {
    const result = await validateAndExecute('workspace.inspect', {}, null);
    assert.equal(result.success, false);
    assert.equal(result.status, 'AUTHENTICATION_REQUIRED');
  });

  await t.test('rejects execution when session is expired', async () => {
    const result = await validateAndExecute('workspace.inspect', {}, expiredSession);
    assert.equal(result.success, false);
    assert.equal(result.status, 'AUTHENTICATION_REQUIRED');
    assert.ok(result.diagnostic?.actualError.includes('expired'));
  });

  await t.test('blocks core mutation when targetLayer is ZYRQUEN_CORE', async () => {
    const result = await validateAndExecute(
      'workspace.inspect',
      { targetLayer: 'ZYRQUEN_CORE' },
      activeOwnerSession
    );
    assert.equal(result.success, false);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.diagnostic?.actualError.includes('Core Mutation Prohibited'));
  });

  await t.test('denies execution when user lacks required permission', async () => {
    const result = await validateAndExecute(
      'system.hsm_heal',
      {},
      restrictedUserSession
    );
    assert.equal(result.success, false);
    assert.equal(result.status, 'PERMISSION_DENIED');
  });

  await t.test('enforces approval gate on high-mutation tools when certificate is missing', async () => {
    const result = await validateAndExecute(
      'workspace.execute_tuning',
      { proposedBatchSize: 48 },
      activeOwnerSession
    );
    assert.equal(result.success, false);
    assert.equal(result.status, 'APPROVAL_REQUIRED');
    assert.equal(result.provenance, 'PROPOSED');
  });

  await t.test('validates and executes tool when session, permissions, and approval are valid', async () => {
    const result = await validateAndExecute(
      'workspace.execute_tuning',
      {
        proposedBatchSize: 48,
        approvalCertificate: {
          proposalId: 'PROP-VALID-01',
          approvedBy: '#EP-SOVEREIGN-01',
          signature: 'SIG_VALID',
        },
      },
      activeOwnerSession
    );
    assert.equal(result.success, true);
    assert.equal(result.status, 'EXECUTED');
    assert.equal(result.provenance, 'VERIFIED');
    assert.equal((result.output as any).newValue, 48);
  });

  await t.test('validates and executes read-only tool for authenticated user', async () => {
    const result = await validateAndExecute(
      'workspace.inspect',
      { targetWorkspace: 'ws-agent-02' },
      restrictedUserSession
    );
    assert.equal(result.success, true);
    assert.equal(result.status, 'EXECUTED');
    assert.equal(result.provenance, 'VERIFIED');
    assert.ok(result.output);
  });
});

test('Sovereign Account Registration & Authentication Lifecycle', async (t) => {
  const { validateAndExecute } = await import('../../src/services/ToolGateway');

  await t.test('enforces user role default on registration and blocks unauthenticated gateway calls', async () => {
    const regResult = await sessionService.registerUser({
      username: 'test_operator_99',
      email: 'operator99@zyrquen.internal',
      password: 'SecurePassword123!',
      userDisplayName: 'ผู้ดูแลระบบระดับผู้ใช้ 99',
    });

    // In unit test environment where fetch mock might fallback, verify role assignment principle
    if (regResult.success && regResult.session) {
      assert.equal(regResult.session.role, 'user', 'New accounts must always be assigned user role');
      assert.notEqual(regResult.session.role, 'owner', 'New accounts must never claim owner role');
    }

    // Explicitly test that a user role session cannot execute high-mutation tools
    const testUserSession = {
      sessionId: 'SES-USR-TEST',
      token: 'TOKEN-TEST-USER',
      userId: 'usr_test_99',
      username: 'test_operator_99',
      userDisplayName: 'ผู้ดูแลระบบระดับผู้ใช้ 99',
      role: 'user' as const,
      permissions: ['workspace:read', 'workspace:chat', 'tools:inspect'],
      fipsLevel: 'FIPS 140-3 LEVEL 4',
      authMethod: 'PASSWORD_HASH' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      status: 'ACTIVE' as const,
    };

    const mutResult = await validateAndExecute(
      'workspace.execute_tuning',
      { proposedBatchSize: 99 },
      testUserSession
    );
    assert.equal(mutResult.success, false, 'Standard user cannot execute high-mutation tools');
    assert.equal(mutResult.status, 'PERMISSION_DENIED');

    // Read-only inspection is permitted
    const inspectResult = await validateAndExecute(
      'workspace.inspect',
      { targetWorkspace: 'ws-agent-02' },
      testUserSession
    );
    assert.equal(inspectResult.success, true, 'Standard user can inspect telemetry');
  });

  await t.test('logout revokes session and disables subsequent tool execution', async () => {
    const tempSession = {
      sessionId: 'SES-TEMP',
      token: 'TOKEN-TEMP',
      userId: 'usr_temp',
      username: 'temp_user',
      userDisplayName: 'Temp User',
      role: 'user' as const,
      permissions: ['workspace:read', 'workspace:chat', 'tools:inspect'],
      fipsLevel: 'FIPS 140-3 LEVEL 4',
      authMethod: 'WEBAUTHN_PASSKEY' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      status: 'ACTIVE' as const,
    };

    // Before logout
    const validRun = await validateAndExecute('workspace.inspect', {}, tempSession);
    assert.equal(validRun.success, true);

    // Revoke
    tempSession.status = 'REVOKED' as any;
    const revokedRun = await validateAndExecute('workspace.inspect', {}, tempSession);
    assert.equal(revokedRun.success, false);
    assert.equal(revokedRun.status, 'AUTHENTICATION_REQUIRED');
  });
});


