import test from 'node:test';
import assert from 'node:assert/strict';
import { sovereignMissionPlanner } from '../../src/services/sovereignMissionPlanner';
import { sovereignResearchAgent } from '../../src/services/sovereignResearchAgent';
import { sovereignCodingAgent } from '../../src/services/sovereignCodingAgent';
import { toolGateway, CANONICAL_TOOLS } from '../../src/adapters/toolGateway';
import { sessionService } from '../../src/services/sessionService';

test('Extension Plane AI Engine & Agent Verification', async (t) => {
  await t.test('1. AI Reasoning & Mission Planner parses natural goals and creates ordered dependencies without direct mutation', () => {
    const plan = sovereignMissionPlanner.generatePlan({
      naturalGoal: 'Tune workspace batch size from 64 down to 48',
      targetWorkspace: 'ws-agent-02',
    });

    assert.ok(plan.planId.startsWith('PLAN-'));
    assert.equal(plan.targetWorkspace, 'ws-agent-02');
    assert.equal(plan.overallStatus, 'PLANNED');
    assert.ok(plan.steps.length >= 3);

    // Verify ordering and dependency structure
    const step1 = plan.steps[0];
    const step2 = plan.steps[1];
    const step3 = plan.steps[2];

    assert.equal(step1.toolId, 'workspace.inspect');
    assert.equal(step1.category, 'READ_ONLY');
    assert.equal(step1.requiresApproval, false);
    assert.deepEqual(step1.dependencies, []);

    assert.equal(step2.toolId, 'workspace.tune_batch');
    assert.equal(step2.category, 'OPERATIONAL');
    assert.deepEqual(step2.dependencies, [step1.stepId]);

    assert.equal(step3.toolId, 'workspace.execute_tuning');
    assert.equal(step3.category, 'HIGH_MUTATION');
    assert.equal(step3.requiresApproval, true);
    assert.deepEqual(step3.dependencies, [step2.stepId]);
  });

  await t.test('2. Mission Planner halts execution at Approval Gate for high-mutation steps when certificate is missing', async () => {
    const plan = sovereignMissionPlanner.generatePlan({
      naturalGoal: 'Tune workspace batch',
      targetWorkspace: 'ws-agent-02',
    });

    // Execute Step 1 (read-only inspect)
    const exec1 = await sovereignMissionPlanner.executeNextStep(plan);
    assert.ok(exec1.executedStep);
    assert.equal(exec1.executedStep.status, 'COMPLETED');

    // Execute Step 2 (operational proposal)
    const exec2 = await sovereignMissionPlanner.executeNextStep(plan);
    assert.ok(exec2.executedStep);
    assert.equal(exec2.executedStep.status, 'COMPLETED');

    // Execute Step 3 (high mutation) without certificate -> MUST HALT at APPROVAL_REQUIRED
    const exec3 = await sovereignMissionPlanner.executeNextStep(plan);
    assert.ok(exec3.executedStep);
    assert.equal(exec3.executedStep.status, 'APPROVAL_REQUIRED');
    assert.equal(plan.overallStatus, 'AWAITING_APPROVAL');

    // Provide valid cryptographic approval certificate -> MUST COMPLETE
    const cert = {
      proposalId: 'PROP-BATCH-TEST-01',
      approvedBy: '#EP-SOVEREIGN-01',
      approvedAt: new Date().toISOString(),
      signature: 'SIG_PQC_DILITHIUM5_TEST',
    };
    const exec4 = await sovereignMissionPlanner.executeNextStep(plan, cert);
    assert.ok(exec4.executedStep);
    assert.equal(exec4.executedStep.status, 'COMPLETED');
    assert.equal(plan.overallStatus, 'COMPLETED');
  });

  await t.test('3. Research & Browser Agent gathers real evidence, URLs, timestamps, and enforces zero mutation rights', async () => {
    const dossier = await sovereignResearchAgent.conductResearch('Thai Electronic Transactions Act B.E. 2544');

    assert.ok(dossier.researchId.startsWith('RES-'));
    assert.equal(dossier.systemMutationAttempted, false);
    assert.ok(dossier.confidenceScore >= 0.90);
    assert.ok(dossier.sources.length >= 1);

    const primarySource = dossier.sources[0];
    assert.ok(primarySource.url.startsWith('https://'));
    assert.ok(primarySource.retrievedAt);
    assert.ok(primarySource.reliabilityScore >= 0.95);
    assert.ok(primarySource.factualExcerpts.length >= 1);

    // Separates facts from conclusions
    assert.ok(dossier.facts.length >= 1);
    assert.ok(dossier.inferencesAndConclusions.length >= 1);
  });

  await t.test('4. Coding & File Agent analyzes without mutating and rejects mutation on Canonical Core', async () => {
    // Read and analyze file
    const report = await sovereignCodingAgent.analyzeFile('src/adapters/toolGateway.ts');
    assert.equal(report.isCoreFile, false);
    assert.ok(report.sha256Hash.startsWith('sha256-'));
    assert.equal(report.syntaxValid, true);

    // Propose non-destructive diff
    const proposal = await sovereignCodingAgent.proposeDiff(
      'src/adapters/toolGateway.ts',
      '// diff proposal',
      'Add invariant verification log'
    );
    assert.ok(proposal.proposalId.startsWith('PROP-'));
    assert.equal(proposal.requiresExplicitApproval, true);

    // Guard: Core mutation blocked
    const coreProposal = {
      ...proposal,
      filePath: 'src/core/sovereign-core.ts',
      targetLayer: 'ZYRQUEN_CORE' as const,
    };
    const coreAttempt = await sovereignCodingAgent.applyApprovedMutation(coreProposal);
    assert.equal(coreAttempt.success, false);
    assert.equal(coreAttempt.status, 'BLOCKED_CORE');
  });

  await t.test('5. Coding & File Agent applies approved diff only under valid certificate on extension plane', async () => {
    const proposal = await sovereignCodingAgent.proposeDiff(
      'src/services/toolGateway.ts',
      '// safe extension plane',
      'Extension Plane Update'
    );

    // Without certificate -> APPROVAL_REQUIRED
    const unapproved = await sovereignCodingAgent.applyApprovedMutation(proposal);
    assert.equal(unapproved.success, false);
    assert.equal(unapproved.status, 'APPROVAL_REQUIRED');

    // With certificate -> SUCCESS
    const cert = {
      proposalId: proposal.proposalId,
      approvedBy: '#EP-SOVEREIGN-01',
      approvedAt: new Date().toISOString(),
      signature: 'SIG_PQC_DILITHIUM5_EP01_MUTATE',
    };
    const approved = await sovereignCodingAgent.applyApprovedMutation(proposal, cert);
    assert.equal(approved.success, true);
    assert.equal(approved.status, 'MUTATED');
    assert.ok(approved.newSha256);
  });
});
