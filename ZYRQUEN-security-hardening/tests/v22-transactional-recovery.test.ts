import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { appendMissionEvent, listMissionEvents, verifyMissionEventJournal, createRecoveryRecord, listRecoveryRecords } from '../server/durableStore.ts';

async function main() {
  const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
  const id = `v22-${Date.now()}`;

  await appendMissionEvent({ eventId: `${id}-1`, missionId: id, type: 'MISSION_CREATED', timestamp: new Date().toISOString(), summary: 'created', evidence: ['real'] });
  await appendMissionEvent({ eventId: `${id}-2`, missionId: id, type: 'TASK_STARTED', timestamp: new Date().toISOString(), taskId: 'task-1', summary: 'started' });
  const events = await listMissionEvents(id);
  assert.equal(events.length, 2);
  assert.equal(events[0].sequence, 1);
  assert.equal(events[1].sequence, 2);
  assert.ok(events[1].prevHash);
  assert.ok(events[1].hash);

  const verified = await verifyMissionEventJournal(id);
  assert.equal(verified.valid, true);
  assert.equal(verified.count, 2);

  const eventFile = path.join(root, 'event', `${id}.jsonl`);
  const raw = await fs.readFile(eventFile, 'utf8');
  const rows = raw.trim().split('\n').map((line) => JSON.parse(line));
  rows[1].summary = 'tampered';
  await fs.writeFile(eventFile, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');
  const tampered = await verifyMissionEventJournal(id);
  assert.equal(tampered.valid, false);
  assert.equal(tampered.firstFailure?.reason, 'HASH_MISMATCH');
  await assert.rejects(() => listMissionEvents(id), /EVENT_JOURNAL_INTEGRITY_FAILED/);

  const recovery = await createRecoveryRecord({ missionId: id, status: 'DETECTED', reason: 'HASH_MISMATCH', lastEventSequence: 2, recommendedAction: 'MANUAL_REVIEW' });
  assert.equal(recovery.payload.status, 'DETECTED');
  const records = await listRecoveryRecords(100);
  assert.ok(records.some((record) => record.missionId === id));

  await fs.rm(path.join(root, 'event', `${id}.jsonl`), { force: true });
  await fs.rm(path.join(root, 'recovery', `${recovery.id}.json`), { force: true });
  console.log('V22 TRANSACTIONAL RECOVERY TESTS: PASS');
}
main().catch((error) => { console.error(error); process.exit(1); });
