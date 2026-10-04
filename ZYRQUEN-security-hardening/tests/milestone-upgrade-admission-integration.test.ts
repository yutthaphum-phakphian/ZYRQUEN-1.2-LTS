import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codevoice-upgrade-admission-'));
process.env.CODEVOICE_DATA_ROOT = root;

const { createAgentRun } = await import('../server/agentRunController.ts');

const admitted = await createAgentRun({
  projectId: 'upgrade-admission-project',
  agentId: 'agent-alpha',
  goal: 'verify workspace safely',
  capabilities: ['workspace.inspect'],
  maxRisk: 'LOW',
});
assert.equal(admitted.admission.status, 'ADMITTED');
assert.notEqual(admitted.status, 'BLOCKED');

const blocked = await createAgentRun({
  projectId: 'upgrade-admission-blocked',
  agentId: 'agent-beta',
  goal: 'mutate workspace',
  capabilities: ['repair.apply'],
  maxRisk: 'LOW',
});
assert.equal(blocked.admission.status, 'BLOCKED');
assert.equal(blocked.status, 'BLOCKED');
assert.ok(blocked.admission.blockers.length > 0);

console.log('Upgrade admission integration: PASS');
