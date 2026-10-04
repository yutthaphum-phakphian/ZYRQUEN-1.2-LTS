import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codevoice-agent-live-evidence-'));
process.env.CODEVOICE_DURABLE_ROOT = root;

const { createAgentRun } = await import('../server/agentRunController.ts');
const { executeAgentRun, loadAgentRunExecution } = await import('../server/agentRunExecutionGateway.ts');
const { saveWorkspace } = await import('../server/durableStore.ts');

await saveWorkspace({ projectId: 'live-project', version: 1, updatedAt: new Date().toISOString(), files: [{ name: 'README.md', content: 'ok' }], integrityHash: '' });
const run = await createAgentRun({ projectId: 'live-project', agentId: 'live-agent', goal: 'inspect workspace', capabilities: ['workspace.inspect'], maxRisk: 'LOW' });
assert.equal(run.status, 'READY');

const execution = await executeAgentRun(run.runId, { actualFiles: [{ name: 'README.md', content: 'ok' }] });
assert.equal(execution.status, 'COMPLETED');
const persisted = await loadAgentRunExecution(run.runId);
assert.equal(persisted?.status, 'COMPLETED');
assert.equal(persisted?.steps.length, 1);
assert.equal(persisted?.steps[0].status, 'COMPLETED');
assert.ok(persisted?.steps[0].auditHash);

const rawPath = path.join(root, 'agent-run-execution', `${run.runId}.json`);
assert.equal(fs.existsSync(rawPath), true);
console.log('Agent run live evidence milestone: PASS');
