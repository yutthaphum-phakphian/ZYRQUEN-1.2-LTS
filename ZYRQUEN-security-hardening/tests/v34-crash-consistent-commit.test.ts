import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveWorkspace, loadWorkspace } from '../server/durableStore.ts';
import { prepareMissionTransaction, loadMissionTransaction } from '../server/transactionalRecovery.ts';
import { acquireMissionWorker, releaseMissionWorker } from '../server/missionWorkerSupervisor.ts';
import { executeAtomicWorkspaceCommit, inspectAtomicRecovery, recoverAtomicWorkspaceCommit } from '../server/atomicWorkspaceCommit.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
async function scenario(name: string, fault: any, expectedState: string) {
  const projectId = `v34-${name}-project-${Date.now()}`;
  const missionId = `v34-${name}-mission-${Date.now()}`;
  await saveWorkspace({ projectId, version: 1, files: [], updatedAt: new Date().toISOString() });
  const tx = await prepareMissionTransaction({ missionId, idempotencyKey: name, operations: [{ id:'create-1', type:'CREATE', target:`${name}.txt` }] });
  const lease = await acquireMissionWorker(missionId, `worker-${name}`, 10000);
  await assert.rejects(() => executeAtomicWorkspaceCommit({ transactionId: tx.transaction.transactionId, projectId, files:[{id:'create-1',type:'CREATE',target:`${name}.txt`,content:name}], fence:{workerId:lease.workerId,leaseId:lease.leaseId}, faultInjection:fault }));
  await releaseMissionWorker(missionId, lease.workerId);
  const state = await inspectAtomicRecovery(tx.transaction.transactionId);
  assert.equal(state.state, expectedState);
  return { transactionId: tx.transaction.transactionId, projectId, missionId };
}

async function main() {
  await fs.rm(root, { recursive:true, force:true });
  const a = await scenario('prepared', 'AFTER_STAGED', 'STAGED_NOT_APPLIED');
  const ra = await recoverAtomicWorkspaceCommit(a.transactionId);
  assert.equal(ra.action, 'ABORTED_STAGED');
  assert.equal((await loadMissionTransaction(a.transactionId))?.payload.status, 'ABORTED');
  assert.equal((await loadWorkspace(a.projectId))?.files.length, 0);

  const b = await scenario('applied', 'AFTER_APPLIED', 'APPLIED_PENDING_COMMIT');
  const rb = await recoverAtomicWorkspaceCommit(b.transactionId);
  assert.equal(rb.action, 'FINALIZED_COMMIT');
  assert.equal((await loadMissionTransaction(b.transactionId))?.payload.status, 'COMMITTED');
  assert.equal((await loadWorkspace(b.projectId))?.files[0].content, 'applied');
  assert.equal((await inspectAtomicRecovery(b.transactionId)).state, 'COMMITTED');

  const c = await scenario('before-final', 'BEFORE_FINAL_COMMIT', 'APPLIED_PENDING_COMMIT');
  const rc = await recoverAtomicWorkspaceCommit(c.transactionId);
  assert.equal(rc.action, 'FINALIZED_COMMIT');
  assert.equal((await loadMissionTransaction(c.transactionId))?.payload.status, 'COMMITTED');

  // Crash after transaction commit: coordinator remains APPLIED but durable tx is terminal.
  const d = await scenario('after-tx', 'AFTER_TRANSACTION_COMMIT', 'COMMITTED_COORDINATOR_PENDING');
  const rd = await recoverAtomicWorkspaceCommit(d.transactionId);
  assert.equal(rd.action, 'FINALIZED_COORDINATOR');
  assert.equal((await inspectAtomicRecovery(d.transactionId)).state, 'COMMITTED');

  await fs.rm(root, { recursive:true, force:true });
  console.log('V34 CRASH-CONSISTENT COMMIT TESTS: PASS');
}
main().catch(e => { console.error(e); process.exit(1); });
