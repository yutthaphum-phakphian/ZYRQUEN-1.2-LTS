import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { saveWorkspace, loadWorkspace, saveDurableRecord, loadDurableRecord, releaseDurableLock } from '../server/durableStore.ts';
import { prepareMissionTransaction, loadMissionTransaction } from '../server/transactionalRecovery.ts';
import { acquireMissionWorker, releaseMissionWorker } from '../server/missionWorkerSupervisor.ts';
import { applyFencedPreparedWorkspaceTransaction, loadWorkspaceEffect } from '../server/transactionalWorkspace.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const projectId = `v32-project-${Date.now()}`;
const missionId = `v32-mission-${Date.now()}`;

async function main() {
  await fs.rm(root, { recursive: true, force: true });
  await saveWorkspace({ projectId, version: 1, files: [], updatedAt: new Date().toISOString() });

  const prepared = await prepareMissionTransaction({ missionId, idempotencyKey: 'create-file', operations: [{ id:'create-1', type:'CREATE', target:'hello.txt' }] });
  const lease = await acquireMissionWorker(missionId, 'worker-v32', 5000);
  const committed = await applyFencedPreparedWorkspaceTransaction({
    transactionId: prepared.transaction.transactionId,
    projectId,
    files: [{ id:'create-1', type:'CREATE', target:'hello.txt', content:'hello', language:'text' }],
    fence: { workerId: lease.workerId, leaseId: lease.leaseId },
  });
  assert.equal(committed.status, 'COMMITTED');
  assert.equal((await loadMissionTransaction(prepared.transaction.transactionId))?.payload.status, 'COMMITTED');
  assert.equal((await loadWorkspace(projectId))?.files[0].content, 'hello');
  await releaseMissionWorker(missionId, lease.workerId);

  const staleMission = `${missionId}-stale`;
  await saveWorkspace({ projectId: `${projectId}-stale`, version: 1, files: [], updatedAt: new Date().toISOString() });
  const staleTx = await prepareMissionTransaction({ missionId: staleMission, idempotencyKey:'stale', operations:[{id:'create-1',type:'CREATE',target:'stale.txt'}] });
  const staleLease = await acquireMissionWorker(staleMission, 'worker-stale', 5000);
  await releaseDurableLock(`mission-worker-${staleMission}`, staleLease.workerId);
  await assert.rejects(() => applyFencedPreparedWorkspaceTransaction({
    transactionId: staleTx.transaction.transactionId,
    projectId: `${projectId}-stale`,
    files: [{id:'create-1',type:'CREATE',target:'stale.txt',content:'must-not-write'}],
    fence: {workerId: staleLease.workerId, leaseId: staleLease.leaseId},
  }), /WORKER_FENCE_LOST|WORKER_LEASE_EXPIRED|WORKER_LEASE_NOT_ACTIVE/);
  assert.equal((await loadWorkspace(`${projectId}-stale`))?.files.length, 0);

  const crashMission = `${missionId}-crash`;
  const crashProject = `${projectId}-crash`;
  await saveWorkspace({ projectId: crashProject, version: 1, files: [], updatedAt: new Date().toISOString() });
  const crashTx = await prepareMissionTransaction({ missionId: crashMission, idempotencyKey:'crash', operations:[{id:'create-1',type:'CREATE',target:'crash.txt'}] });
  const crashLease = await acquireMissionWorker(crashMission, 'worker-crash', 5000);
  await assert.rejects(() => applyFencedPreparedWorkspaceTransaction({
    transactionId: crashTx.transaction.transactionId,
    projectId: crashProject,
    files: [{id:'create-1',type:'CREATE',target:'crash.txt',content:'written-before-fence-loss'}],
    fence: {workerId: crashLease.workerId, leaseId: crashLease.leaseId},
    onPhase: async phase => { if (phase === 'AFTER_WRITE') await releaseDurableLock(`mission-worker-${crashMission}`, crashLease.workerId); },
  }), /WORKER_FENCE_LOST|WORKER_LEASE_EXPIRED|WORKER_LEASE_NOT_ACTIVE/);
  assert.equal((await loadWorkspace(crashProject))?.files[0].content, 'written-before-fence-loss');
  const crashEffectId = `effect-${crypto.createHash('sha256').update(crashTx.transaction.transactionId).digest('hex').slice(0,40)}`;
  assert.equal((await loadWorkspaceEffect(crashEffectId))?.payload.status, 'APPLIED');
  assert.equal((await loadMissionTransaction(crashTx.transaction.transactionId))?.payload.status, 'PREPARED');

  await fs.rm(root, { recursive: true, force: true });
  console.log('V32 TRANSACTIONAL FENCED MUTATION TESTS: PASS');
}
main().catch(e => { console.error(e); process.exit(1); });
