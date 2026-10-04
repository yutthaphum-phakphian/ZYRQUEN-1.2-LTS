import { strict as assert } from 'node:assert';
import { planDeveloperRepair } from '../server/developerRepairPlanner.ts';

const plan = planDeveloperRepair({
  verificationId: 'verify-test',
  status: 'FAILED',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  steps: [
    { action: 'RUN_TEST', ok: false, error: 'EXECUTION_FAILED', summary: { status: 'FAILED', exitCode: 7, output: 'test failed' } },
  ],
  repairRequired: true,
  auditHash: 'a'.repeat(64),
});

assert.equal(plan.status, 'READY_FOR_APPROVAL');
assert.equal(plan.diagnosis, 'TEST_FAILURE');
assert.equal(plan.requiresHumanApproval, true);
assert.equal(plan.candidateOperations.length, 0);
assert.ok(plan.constraints.length >= 5);
assert.match(plan.auditHash, /^[a-f0-9]{64}$/);
console.log('Developer repair planner milestone: PASS');
