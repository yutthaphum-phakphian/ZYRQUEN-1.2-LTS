import assert from 'node:assert/strict';
import test from 'node:test';
const { derivePipelineSteps } = await import('../src/utils/pipelineSteps.ts');

const st = (steps: any[]) => steps.map(s => s.status).join(',');
const okVal = { isValid: true, errors: [], warnings: [], attemptCount: 1 };
const badVal = { isValid: false, errors: ['TS2304: cannot find name x'], warnings: [], attemptCount: 1 };
const qa: any = { id: 'r', totalTests: 10, passed: 10, failed: 0 };

test('the reported screenshot case: FAILED request with an old QA report no longer leaves 4/7/8 "pending"', () => {
  const s = derivePipelineSteps({ runtimeState: 'FAILED', validation: okVal as any, testReport: qa }, 'HTTP 500: GEMINI_API_KEY is not configured');
  assert.equal(st(s), 'completed,completed,completed,failed,completed,completed,skipped,skipped');
  assert.match(s[3].detail!, /GEMINI_API_KEY/);
  assert.equal(s.some(x => x.status === 'pending'), false);
});
test('FAILED with no evidence: only 1-3 completed, step 4 failed, rest skipped', () => {
  assert.equal(st(derivePipelineSteps({ runtimeState: 'FAILED' })), 'completed,completed,completed,failed,skipped,skipped,skipped,skipped');
});
test('FAILED because the validation gate failed marks step 5, keeps 4 completed', () => {
  const s = derivePipelineSteps({ runtimeState: 'FAILED', validation: badVal as any, toolResults: [{ success: true, tool: 'updateFile' } as any] });
  assert.equal(st(s), 'completed,completed,completed,completed,failed,skipped,skipped,skipped');
  assert.match(s[4].detail!, /TS2304/);
});
test('FAILED because a tool failed marks step 4 with the tool error', () => {
  const s = derivePipelineSteps({ runtimeState: 'FAILED', validation: badVal as any, toolResults: [{ success: false, tool: 'updateFile', error: { code: 'X', message: 'disk full', retryable: false } } as any] });
  assert.equal(s[3].status, 'failed'); assert.equal(s[3].detail, 'disk full');
});
test('COMPLETED completes all steps; Browser QA is skipped (not faked) without a report', () => {
  assert.equal(st(derivePipelineSteps({ runtimeState: 'COMPLETED' })), 'completed,completed,completed,completed,completed,skipped,completed,completed');
  assert.equal(derivePipelineSteps({ runtimeState: 'COMPLETED', testReport: qa })[5].status, 'completed');
});
test('in-flight states keep progressive behaviour; tool-only runs count as executed', () => {
  assert.equal(st(derivePipelineSteps({ runtimeState: 'EXECUTING' })), 'completed,completed,completed,running,pending,pending,pending,pending');
  assert.equal(derivePipelineSteps({ runtimeState: 'VALIDATING', toolResults: [{ success: true, tool: 't' } as any] })[3].status, 'completed');
  assert.equal(derivePipelineSteps({ runtimeState: 'VALIDATING' })[4].status, 'running');
  assert.equal(derivePipelineSteps({ runtimeState: 'PLANNING' })[2].status, 'running');
});
test('never reports a step as failed when the run did not fail', () => {
  for (const s of ['IDLE', 'UNDERSTANDING', 'PLANNING', 'EXECUTING', 'VALIDATING', 'FIXING', 'WAITING_CONFIRMATION', 'COMPLETED', 'PAUSED'] as const)
    assert.equal(derivePipelineSteps({ runtimeState: s }).some(x => x.status === 'failed'), false, s);
});
