import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { appendMissionEvent, listMissionEvents, acquireDurableLock, releaseDurableLock, saveDurableRecord, loadDurableRecord } from '../server/durableStore.ts';

async function main() {
  const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
  const id = `v21-${Date.now()}`;

  await appendMissionEvent({ eventId: `${id}-1`, missionId: id, type: 'MISSION_CREATED', timestamp: new Date().toISOString(), summary: 'mission created', evidence: ['real event'] });
  await appendMissionEvent({ eventId: `${id}-2`, missionId: id, type: 'TASK_STARTED', timestamp: new Date().toISOString(), taskId: 'task-1', summary: 'task started' });
  const events = await listMissionEvents(id);
  assert.equal(events.length, 2);
  assert.equal(events[1].taskId, 'task-1');

  const lock = await acquireDurableLock(`resource-${id}`, `owner-${id}`, 10000);
  assert.equal(lock.owner, `owner-${id}`);
  await assert.rejects(() => acquireDurableLock(`resource-${id}`, `other-${id}`, 10000), /RESOURCE_LOCKED/);
  await releaseDurableLock(`resource-${id}`, `owner-${id}`);

  const mission = await saveDurableRecord('mission', id, { status: 'RUNNING', events: 2 });
  const restored = await loadDurableRecord<typeof mission.payload>('mission', id);
  assert.equal(restored?.payload.status, 'RUNNING');

  await fs.rm(path.join(root, 'event', `${id}.jsonl`), { force: true });
  await fs.rm(path.join(root, 'mission', `${id}.json`), { force: true });
  await fs.rm(path.join(root, 'lock', `resource-${id}.json`), { force: true });
  console.log('V21 PRODUCTION HARDENING TESTS: PASS');
}
main().catch((error) => { console.error(error); process.exit(1); });
