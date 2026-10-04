import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { appendMissionEvent, verifyMissionEventJournal } from '../server/durableStore.ts';
import { replayMission, replayMissionRange } from '../server/missionReplay.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const missionId = `v26-replay-${Date.now()}`;

async function main() {
  await fs.rm(root, { recursive: true, force: true });
  const emit = async (eventId: string, type: string, status: string, taskId?: string, summary = type) => appendMissionEvent({ eventId, missionId, type, status, taskId, timestamp: new Date().toISOString(), summary });
  await emit('e1', 'MISSION_CREATED', 'CREATED');
  await emit('e2', 'MISSION_ANALYZING', 'ANALYZING');
  await emit('e3', 'TASK_STARTED', 'RUNNING', 'task-1', 'start task');
  await emit('e4', 'TASK_COMPLETED', 'SUCCESS', 'task-1', 'complete task');
  await emit('e5', 'TASK_STARTED', 'RUNNING', 'task-2', 'start task 2');
  await emit('e6', 'TASK_FAILED', 'FAILED', 'task-2', 'validation failed');
  await emit('e7', 'MISSION_FAILED', 'FAILED', 'task-2', 'mission failed');

  const verification = await verifyMissionEventJournal(missionId);
  assert.equal(verification.valid, true);
  assert.equal(verification.count, 7);

  const replay = await replayMission(missionId);
  assert.equal(replay.valid, true);
  assert.equal(replay.missionStatus, 'FAILED');
  assert.equal(replay.eventCount, 7);
  assert.equal(replay.completedTasks, 1);
  assert.equal(replay.failedTasks, 1);
  assert.equal(replay.progress, 50);
  assert.equal(replay.currentTaskId, 'task-2');

  const range = await replayMissionRange(missionId, 3, 4);
  assert.deepEqual(range.map(e => e.sequence), [3, 4]);

  const file = path.join(root, 'event', `${missionId}.jsonl`);
  const raw = await fs.readFile(file, 'utf8');
  const lines = raw.trim().split('\n');
  const tampered = JSON.parse(lines[3]);
  tampered.summary = 'TAMPERED';
  lines[3] = JSON.stringify(tampered);
  await fs.writeFile(file, lines.join('\n') + '\n', 'utf8');
  const blocked = await replayMission(missionId);
  assert.equal(blocked.valid, false);
  assert.match(blocked.blockingEvents[0], /HASH_MISMATCH/);

  await fs.rm(root, { recursive: true, force: true });
  console.log('V26 DETERMINISTIC REPLAY TESTS: PASS');
}
main().catch(error => { console.error(error); process.exit(1); });
