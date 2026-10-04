import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prepareMissionTransaction, loadMissionTransaction, commitMissionTransaction, abortMissionTransaction, recoverPreparedTransaction } from '../server/transactionalRecovery.ts';
import { listMissionEvents } from '../server/durableStore.ts';

async function main() {
  const missionId = `v23-${Date.now()}`;
  const key = `${missionId}:commit`;
  const prepared = await prepareMissionTransaction({
    missionId,
    idempotencyKey: key,
    operations: [
      { id: 'op-1', type: 'UPDATE', target: 'src/App.tsx', expected: 'workspace-version-1' },
      { id: 'op-2', type: 'VALIDATE', target: 'npm run lint' },
    ],
  });
  assert.equal(prepared.transaction.status, 'PREPARED');
  assert.equal(prepared.reused, false);

  const reused = await prepareMissionTransaction({ missionId, idempotencyKey: key, operations: [{ id: 'different', type: 'DELETE', target: 'bad' }] });
  assert.equal(reused.reused, true);
  assert.equal(reused.transaction.transactionId, prepared.transaction.transactionId);
  assert.equal(reused.transaction.operations.length, 2);

  const loaded = await loadMissionTransaction(prepared.transaction.transactionId);
  assert.equal(loaded?.payload.status, 'PREPARED');

  const committed = await commitMissionTransaction(prepared.transaction.transactionId, ['validation:PASS']);
  assert.equal(committed.transaction.status, 'COMMITTED');
  const committedAgain = await commitMissionTransaction(prepared.transaction.transactionId);
  assert.equal(committedAgain.reused, true);

  await assert.rejects(() => abortMissionTransaction(prepared.transaction.transactionId, 'too-late'), /TRANSACTION_ALREADY_COMMITTED/);

  const abortMission = `v23-abort-${Date.now()}`;
  const abortPrepared = await prepareMissionTransaction({ missionId: abortMission, idempotencyKey: 'abort', operations: [{ id: 'op-1', type: 'UPDATE', target: 'src/x.ts' }] });
  const aborted = await abortMissionTransaction(abortPrepared.transaction.transactionId, 'permission denied');
  assert.equal(aborted.transaction.status, 'ABORTED');
  await assert.rejects(() => commitMissionTransaction(abortPrepared.transaction.transactionId), /TRANSACTION_ALREADY_ABORTED/);

  const recoverMission = `v23-recover-${Date.now()}`;
  const recoverPrepared = await prepareMissionTransaction({ missionId: recoverMission, idempotencyKey: 'recover', operations: [{ id: 'op-1', type: 'UPDATE', target: 'src/y.ts' }] });
  const recovery = await recoverPreparedTransaction(recoverPrepared.transaction.transactionId, 'PROCESS_CRASH');
  assert.equal(recovery.action, 'RECOVERY_RECORDED');

  const events = await listMissionEvents(missionId);
  assert.equal(events.some((e) => e.type === 'TRANSACTION_PREPARED'), true);
  assert.equal(events.some((e) => e.type === 'TRANSACTION_COMMITTED'), true);

  const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
  await fs.rm(path.join(root, 'transaction', `${prepared.transaction.transactionId}.json`), { force: true });
  await fs.rm(path.join(root, 'transaction', `${abortPrepared.transaction.transactionId}.json`), { force: true });
  await fs.rm(path.join(root, 'transaction', `${recoverPrepared.transaction.transactionId}.json`), { force: true });
  await fs.rm(path.join(root, 'event', `${missionId}.jsonl`), { force: true });
  await fs.rm(path.join(root, 'event', `${abortMission}.jsonl`), { force: true });
  await fs.rm(path.join(root, 'event', `${recoverMission}.jsonl`), { force: true });
  console.log('V23 TRANSACTIONAL MISSION TESTS: PASS');
}
main().catch((error) => { console.error(error); process.exit(1); });
