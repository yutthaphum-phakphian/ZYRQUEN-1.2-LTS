import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveWorkspace, loadWorkspace } from '../server/durableStore.ts';
import { prepareMissionTransaction, loadMissionTransaction } from '../server/transactionalRecovery.ts';
import { acquireMissionWorker, releaseMissionWorker } from '../server/missionWorkerSupervisor.ts';
import { executeAtomicWorkspaceCommit } from '../server/atomicWorkspaceCommit.ts';
import { sweepDurableTransactionRecovery } from '../server/durableRecoverySweep.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
async function main() {
  await fs.rm(root, { recursive:true, force:true });
  const projectId = `v35-project-${Date.now()}`;
  const missionId = `v35-mission-${Date.now()}`;
  await saveWorkspace({ projectId, version: 1, files: [], updatedAt: new Date().toISOString() });
  const tx = await prepareMissionTransaction({ missionId, idempotencyKey:'sweep', operations:[{id:'create',type:'CREATE',target:'sweep.txt'}] });
  const lease = await acquireMissionWorker(missionId, 'v35-worker', 10000);
  await assert.rejects(() => executeAtomicWorkspaceCommit({ transactionId:tx.transaction.transactionId, projectId, files:[{id:'create',type:'CREATE',target:'sweep.txt',content:'recovered'}], fence:{workerId:lease.workerId,leaseId:lease.leaseId}, faultInjection:'AFTER_APPLIED' }));
  await releaseMissionWorker(missionId, lease.workerId);

  const report = await sweepDurableTransactionRecovery();
  const item = report.items.find(x => x.transactionId === tx.transaction.transactionId);
  assert.ok(item);
  assert.equal(item?.action, 'RECOVERED');
  assert.equal((await loadMissionTransaction(tx.transaction.transactionId))?.payload.status, 'COMMITTED');
  assert.equal((await loadWorkspace(projectId))?.files[0].content, 'recovered');

  const second = await sweepDurableTransactionRecovery();
  const secondItem = second.items.find(x => x.transactionId === tx.transaction.transactionId);
  assert.equal(secondItem?.action, 'NO_ACTION');

  await fs.rm(root, { recursive:true, force:true });
  console.log('V35 DURABLE RECOVERY SWEEP TESTS: PASS');
}
main().catch(e => { console.error(e); process.exit(1); });
