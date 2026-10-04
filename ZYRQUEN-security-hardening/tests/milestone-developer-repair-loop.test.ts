import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
const durableRoot = await fs.mkdtemp(path.join(process.cwd(), '.developer-repair-data-'));
process.env.CODEVOICE_DURABLE_ROOT = durableRoot;
const { saveWorkspace } = await import('../server/durableStore.ts');
const { createAutonomousMission } = await import('../src/tools/autonomousMissionEngine.ts');
const { acquireMissionWorker, releaseMissionWorker } = await import('../server/missionWorkerSupervisor.ts');
const { repairDeveloperWorkflow } = await import('../server/developerRepairLoop.ts');
const { previewDeveloperPatch } = await import('../server/developerPatchEngine.ts');
import type { PatchOperation } from '../server/developerPatchEngine.ts';

const root = await fs.mkdtemp(path.join(process.cwd(), '.developer-repair-test-'));
const projectId = `repair-project-${Date.now()}`;
await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node -e "process.exit(7)"', build: 'node --version' } }), 'utf8');
const mission = createAutonomousMission('developer repair test', { id: projectId, projectId, description: '', framework: 'unknown', files: [] } as any);
await saveWorkspace({ projectId, version: 0, updatedAt: new Date().toISOString(), files: [{ name: 'package.json', content: JSON.stringify({ scripts: { test: 'node -e \"process.exit(7)\"', build: 'node --version' } }), language: 'json' }], metadata: { missionId: mission.missionId }, integrityHash: '' });
const missionId = mission.missionId;
const { saveDurableRecord } = await import('../server/durableStore.ts');
await saveDurableRecord('mission', missionId, mission);
const worker = await acquireMissionWorker(missionId, `repair-worker-${Date.now()}`, 30000);

const blocked = await repairDeveloperWorkflow({ workspaceRoot: root, projectId, missionId, workerId: worker.workerId, leaseId: worker.leaseId, approved: true });
assert.equal(blocked.status, 'REPAIR_REQUIRED');

const repairedPackage = JSON.stringify({ scripts: { test: 'node --version', build: 'node --version' } });
const repairs: PatchOperation[] = [{ type: 'UPDATE', target: 'package.json', content: repairedPackage, language: 'json' }];
const patch = await previewDeveloperPatch({ workspaceRoot: root, operations: repairs, sourceVerificationId: 'pre-repair' });
const completed = await repairDeveloperWorkflow({
  workspaceRoot: root,
  projectId,
  missionId,
  workerId: worker.workerId,
  leaseId: worker.leaseId,
  approved: true,
  repairs,
  patchHash: patch.patchHash,
});
assert.equal(completed.status, 'COMPLETED');
assert.equal(completed.repairRequired, false);
assert.ok(completed.transactionId);
assert.ok(completed.effectId);
assert.ok(completed.transactionId);
assert.match(completed.auditHash, /^[a-f0-9]{64}$/);

await releaseMissionWorker(missionId, worker.workerId);
await fs.rm(root, { recursive: true, force: true });
await fs.rm(durableRoot, { recursive: true, force: true });
console.log('Developer repair loop milestone: PASS');
