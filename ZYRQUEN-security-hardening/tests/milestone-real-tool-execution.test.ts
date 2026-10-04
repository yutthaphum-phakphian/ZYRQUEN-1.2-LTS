import assert from 'node:assert/strict';
import { createServerWorkerAdapter } from '../server/missionWorkerPool.ts';
import { saveWorkspace, loadWorkspace } from '../server/durableStore.ts';
import { acquireMissionWorker, releaseMissionWorker } from '../server/missionWorkerSupervisor.ts';

const missionId = `mission-tool-exec-test-${Date.now()}`;
const projectId = `tool-exec-test-project-${Date.now()}`;
const workerId = `tool-test-worker-${Date.now()}`;
await saveWorkspace({ projectId, version: 1, updatedAt: new Date().toISOString(), files: [{ name: 'hello.txt', content: 'hello', language: 'text' }], metadata: {} } as any);
const lease = await acquireMissionWorker(missionId, workerId, 30000);
const adapter = createServerWorkerAdapter(() => ({ workerId, leaseId: lease.leaseId }));
const baseMission = {
  missionId,
  status: 'RUNNING',
  progress: 0,
  context: {
    projectId,
    relevantFiles: [{ name: 'hello.txt', content: 'hello', language: 'text' }],
    budget: 100,
  },
  tasks: [],
} as any;

const denied = await adapter.executeTask({ taskId: 'task-denied', type: 'UPDATE', title: '', description: '', dependencies: [], priority: 'HIGH', status: 'READY', inputs: { files: [{ type: 'UPDATE', target: 'hello.txt', content: 'changed' }] }, retryCount: 0, maxRetries: 1, affectedFiles: [], validationCriteria: [], parallelSafe: false } as any, baseMission);
assert.equal(denied.requiresApproval, true);

const result = await adapter.executeTask({ taskId: 'task-approved', type: 'UPDATE', title: '', description: '', dependencies: [], priority: 'HIGH', status: 'READY', inputs: { approved: true, files: [{ id: 'update-1', type: 'UPDATE', target: 'hello.txt', content: 'changed', language: 'text' }] }, retryCount: 0, maxRetries: 1, affectedFiles: [], validationCriteria: [], parallelSafe: false } as any, baseMission);
assert.equal(result.success, true);
assert.ok(result.output?.transactionId);
assert.ok(result.output?.effectId);
const workspace = await loadWorkspace(projectId);
assert.equal(workspace?.files.find((f) => f.name === 'hello.txt')?.content, 'changed');
const versionAfterFirst = workspace?.version;
const replay = await adapter.executeTask({ taskId: 'task-approved', type: 'UPDATE', title: '', description: '', dependencies: [], priority: 'HIGH', status: 'READY', inputs: { approved: true, files: [{ id: 'update-1', type: 'UPDATE', target: 'hello.txt', content: 'changed', language: 'text' }] }, retryCount: 1, maxRetries: 1, affectedFiles: [], validationCriteria: [], parallelSafe: false } as any, baseMission);
assert.equal(replay.success, true);
assert.equal(replay.output?.reused, true);
assert.equal((await loadWorkspace(projectId))?.version, versionAfterFirst);
await releaseMissionWorker(missionId, workerId);
console.log('Real tool execution milestone: PASS');
