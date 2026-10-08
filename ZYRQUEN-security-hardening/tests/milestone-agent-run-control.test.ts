import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codevoice-agent-run-'));
process.env.CODEVOICE_DURABLE_ROOT = root;
const { saveAgentPolicy } = await import('../server/agentPolicyEngine.ts');
const { createAgentRun, loadAgentRun, approveAgentRun, cancelAgentRun, completeAgentRun } = await import('../server/agentRunController.ts');

await saveAgentPolicy({ projectId: 'run-project', grants: { builder: { capabilities: ['workspace.inspect', 'developer.verify', 'repair.preview', 'repair.apply', 'repair.recover', 'reliability.run'], maxRisk: 'HIGH' } }, requireApprovalForMutation: true });
const approvalRun = await createAgentRun({ projectId: 'run-project', agentId: 'builder', goal: 'repair workspace' });
assert.equal(approvalRun.status, 'APPROVAL_REQUIRED');
assert.ok(approvalRun.simulation.simulationId);
assert.equal((await loadAgentRun(approvalRun.runId))?.runId, approvalRun.runId);
const approved = await approveAgentRun(approvalRun.runId, 'builder');
assert.equal(approved.status, 'APPROVED');
const completed = await completeAgentRun(approvalRun.runId, true);
assert.equal(completed.status, 'COMPLETED');

const blocked = await createAgentRun({ projectId: 'run-project', agentId: 'unknown-agent', goal: 'repair workspace' });
assert.equal(blocked.status, 'BLOCKED');
await assert.rejects(() => approveAgentRun(blocked.runId, 'unknown-agent'), /APPROVER_DENIED|INVALID_AGENT_RUN_TRANSITION/);
const cancelled = await cancelAgentRun(blocked.runId);
assert.equal(cancelled.status, 'CANCELLED');

console.log('Agent run control milestone: PASS');
