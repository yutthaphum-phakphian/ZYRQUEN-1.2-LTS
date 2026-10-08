import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codevoice-agent-run-exec-'));
process.env.CODEVOICE_DURABLE_ROOT = root;

const { createAgentRun } = await import('../server/agentRunController.ts');
const { executeAgentRun, loadAgentRunExecution } = await import('../server/agentRunExecutionGateway.ts');
const { saveWorkspace } = await import('../server/durableStore.ts');

await saveWorkspace({ projectId: 'exec-project', version: 1, updatedAt: new Date().toISOString(), files: [{ name: 'README.md', content: 'ok' }], integrityHash: '' });

const run = await createAgentRun({ projectId: 'exec-project', agentId: 'agent-executor', goal: 'inspect workspace', capabilities: ['workspace.inspect'], maxRisk: 'LOW' });
assert.equal(run.status, 'READY');

const execution = await executeAgentRun(run.runId, { actualFiles: [{ name: 'README.md', content: 'ok' }] });
assert.equal(execution.status, 'COMPLETED');
assert.equal(execution.steps[0].capability, 'workspace.inspect');
assert.equal((execution.steps[0].evidence as any).verdict, 'ALIGNED');

const persisted = await loadAgentRunExecution(run.runId);
assert.equal(persisted?.status, 'COMPLETED');

const blockedRun = await createAgentRun({ projectId: 'exec-project', agentId: 'agent-executor', goal: 'mutate', capabilities: ['repair.apply'], maxRisk: 'HIGH' });
assert.equal(blockedRun.status, 'APPROVAL_REQUIRED');
await assert.rejects(() => executeAgentRun(blockedRun.runId, {}), /AGENT_RUN_APPROVAL_REQUIRED/);

console.log('Agent run execution gateway milestone: PASS');
