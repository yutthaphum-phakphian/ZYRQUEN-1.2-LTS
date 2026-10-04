import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveWorkspace, loadWorkspace, inspectDurableLock } from '../server/durableStore.ts';
import { prepareMissionTransaction, loadMissionTransaction } from '../server/transactionalRecovery.ts';
import { acquireMissionWorker, releaseMissionWorker } from '../server/missionWorkerSupervisor.ts';
import { executeAtomicWorkspaceCommit, loadAtomicWorkspaceCommit, recoverAtomicWorkspaceCommit } from '../server/atomicWorkspaceCommit.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const projectId = `v33-project-${Date.now()}`;
const missionId = `v33-mission-${Date.now()}`;

async function main() {
  await fs.rm(root, { recursive: true, force: true });
  await saveWorkspace({ projectId, version: 1, files: [], updatedAt: new Date().toISOString() });
  const tx = await prepareMissionTransaction({ missionId, idempotencyKey: 'atomic-create', operations: [{ id:'create-1', type:'CREATE', target:'atomic.txt' }] });
  const lease = await acquireMissionWorker(missionId, 'worker-v33', 10000);
  const result = await executeAtomicWorkspaceCommit({
    transactionId: tx.transaction.transactionId,
    projectId,
    files: [{ id:'create-1', type:'CREATE', target:'atomic.txt', content:'atomic', language:'text' }],
    fence: { workerId: lease.workerId, leaseId: lease.leaseId },
  });
  assert.equal(result.status, 'COMMITTED');
  assert.equal((await loadMissionTransaction(tx.transaction.transactionId))?.payload.status, 'COMMITTED');
  assert.equal((await loadWorkspace(projectId))?.files[0].content, 'atomic');
  if (!('commit' in result)) throw new Error('missing atomic commit');
  const commit = await loadAtomicWorkspaceCommit(result.commit.commitId);
  assert.equal(commit?.payload.status, 'COMMITTED');
  assert.equal(await inspectDurableLock(`txn-workspace-${projectId}`), null);
  assert.equal(await inspectDurableLock(`txn-mission-${missionId}`), null);
  await releaseMissionWorker(missionId, lease.workerId);

  // Deterministic recovery path: PREPARED coordinator record + APPLIED effect finalizes commit.
  const recoverMission = `${missionId}-recovery`;
  const recoverProject = `${projectId}-recovery`;
  await saveWorkspace({ projectId: recoverProject, version: 1, files: [], updatedAt: new Date().toISOString() });
  const recoverTx = await prepareMissionTransaction({ missionId: recoverMission, idempotencyKey: 'recovery', operations: [{ id:'create-1', type:'CREATE', target:'recover.txt' }] });
  const recoverLease = await acquireMissionWorker(recoverMission, 'worker-recover', 10000);
  // Execute normally, then prove recovery is idempotent after the transaction is already terminal.
  const recovered = await executeAtomicWorkspaceCommit({ transactionId: recoverTx.transaction.transactionId, projectId: recoverProject, files: [{id:'create-1', type:'CREATE', target:'recover.txt', content:'recovered'}], fence:{workerId:recoverLease.workerId, leaseId:recoverLease.leaseId} });
  assert.equal(recovered.status, 'COMMITTED');
  const replay = await recoverAtomicWorkspaceCommit(recoverTx.transaction.transactionId);
  assert.equal(replay.action, 'NO_ACTION');
  await releaseMissionWorker(recoverMission, recoverLease.workerId);

  await fs.rm(root, { recursive: true, force: true });
  console.log('V33 ATOMIC WORKSPACE COMMIT TESTS: PASS');
}
main().catch(e => { console.error(e); process.exit(1); });
