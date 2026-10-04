import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prepareMissionTransaction, commitMissionTransaction } from '../server/transactionalRecovery.ts';
import { applyPreparedWorkspaceTransaction } from '../server/transactionalWorkspace.ts';
import { saveWorkspace, loadWorkspace, listMissionEvents } from '../server/durableStore.ts';
import { reconcileMissionTransactions, reconcileMission } from '../server/missionReconciler.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const projectId = `v25-project-${Date.now()}`;

async function cleanupMission(missionId: string, transactionId?: string) {
  await fs.rm(path.join(root, 'event', `${missionId}.jsonl`), { force: true });
  await fs.rm(path.join(root, 'recovery'), { recursive: true, force: false }).catch(() => undefined);
  if (transactionId) await fs.rm(path.join(root, 'transaction', `${transactionId}.json`), { force: true });
}

async function main() {
  await fs.rm(root, { recursive: true, force: true });
  await saveWorkspace({ projectId, version: 1, updatedAt: new Date().toISOString(), files: [{ name: 'src/a.ts', content: 'export const a = 1;', language: 'typescript' }] });

  const mission1 = `v25-finalize-${Date.now()}`;
  const tx1 = await prepareMissionTransaction({ missionId: mission1, idempotencyKey: 'effect', operations: [{ id: 'op-1', type: 'UPDATE', target: 'src/a.ts' }] });
  await applyPreparedWorkspaceTransaction({ transactionId: tx1.transaction.transactionId, projectId, files: [{ id: 'op-1', type: 'UPDATE', target: 'src/a.ts', content: 'export const a = 2;', expectedHash: '683314ed22112e8dea8095c8c6173afa2c61279f5fe07968ebe0e21fff16871d' }] }).catch((error) => { throw new Error(`unexpected apply failure: ${error.message}`); });
  // Simulate a crash after workspace/effect APPLIED but before transaction COMMITTED by moving the transaction back to PREPARED.
  const txPath = path.join(root, 'transaction', `${tx1.transaction.transactionId}.json`);
  const txRaw = JSON.parse(await fs.readFile(txPath, 'utf8'));
  txRaw.payload.status = 'PREPARED';
  txRaw.payload.updatedAt = new Date().toISOString();
  const crypto = await import('node:crypto');
  txRaw.integrityHash = crypto.createHash('sha256').update(JSON.stringify({ kind: txRaw.kind, id: txRaw.id, version: txRaw.version, savedAt: txRaw.savedAt, payload: txRaw.payload })).digest('hex');
  await fs.writeFile(txPath, JSON.stringify(txRaw), 'utf8');

  const report1 = await reconcileMissionTransactions();
  const item1 = report1.items.find((item) => item.transactionId === tx1.transaction.transactionId);
  assert.equal(item1?.action, 'FINALIZED_COMMIT');
  const ws1 = await loadWorkspace(projectId);
  assert.equal(ws1?.files.find((f) => f.name === 'src/a.ts')?.content, 'export const a = 2;');

  const mission2 = `v25-orphan-${Date.now()}`;
  const tx2 = await prepareMissionTransaction({ missionId: mission2, idempotencyKey: 'orphan', operations: [{ id: 'op-1', type: 'UPDATE', target: 'src/a.ts' }] });
  const report2 = await reconcileMission(mission2);
  assert.equal(report2.items.find((item) => item.transactionId === tx2.transaction.transactionId)?.action, 'RECOVERY_RECORDED');

  const mission3 = `v25-aborted-${Date.now()}`;
  const tx3 = await prepareMissionTransaction({ missionId: mission3, idempotencyKey: 'staged', operations: [{ id: 'op-1', type: 'UPDATE', target: 'src/a.ts' }] });
  // Create a staged effect by using an expectation mismatch-free workspace transaction, then restore tx to PREPARED before commit is reached.
  // The real apply function commits atomically, so directly create the durable effect fixture from the observed workspace state.
  const effectId = `effect-${(await import('node:crypto')).createHash('sha256').update(tx3.transaction.transactionId).digest('hex').slice(0,40)}`;
  const { saveDurableRecord } = await import('../server/durableStore.ts');
  await saveDurableRecord('transaction-effect', effectId, { effectId, transactionId: tx3.transaction.transactionId, missionId: mission3, status: 'STAGED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), projectId, baseVersion: 2, operations: [{ id: 'op-1', type: 'UPDATE', target: 'src/a.ts', content: 'x' }] }, 1);
  const report3 = await reconcileMissionTransactions();
  const item3 = report3.items.find((item) => item.transactionId === tx3.transaction.transactionId);
  assert.equal(item3?.action, 'ABORTED_STAGED_EFFECT');

  const events = await listMissionEvents(mission1);
  assert.ok(events.some((event) => event.type === 'TRANSACTION_COMMITTED'));
  console.log('V25 RECOVERY RECONCILER TESTS: PASS');

  await fs.rm(root, { recursive: true, force: true });
}

main().catch(async (error) => { console.error(error); process.exit(1); });
