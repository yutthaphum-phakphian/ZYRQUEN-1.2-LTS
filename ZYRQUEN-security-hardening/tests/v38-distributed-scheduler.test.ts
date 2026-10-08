import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(process.cwd(), `.v38-dist-${process.pid}-${Date.now()}`);
process.env.CODEVOICE_DURABLE_ROOT = root;
const { saveDurableRecord, appendMissionEvent, inspectDurableLock } = await import('../server/durableStore.ts');
const { enqueueMission, MissionQueueScheduler, listMissionQueue, bindMissionDispatchLease } = await import('../server/missionQueueScheduler.ts');
const { acquireMissionWorker, releaseMissionWorker } = await import('../server/missionWorkerSupervisor.ts');
await fs.rm(root, { recursive: true, force: true });
for (const [id, priority] of [['m-high','HIGH'],['m-critical','CRITICAL'],['m-normal','NORMAL']] as const) {
  const mission = { missionId:id, executionId:crypto.randomUUID(), goal:id, status:'READY', progress:0, tasks:[], context:{objective:id,relevantFiles:[],budget:100,used:0,summaries:[]}, checkpoints:[], snapshots:[], errors:[], recoveryAttempts:0, maxRecoveryAttempts:3, events:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  await saveDurableRecord('mission', id, mission, 1);
  await appendMissionEvent({eventId:crypto.randomUUID(), missionId:id, type:'MISSION_CREATED', timestamp:new Date().toISOString(), status:'READY', summary:'scheduler test'});
  await enqueueMission(id, priority, 3);
}
const a = new MissionQueueScheduler({workerCapacity:2, batchLimit:2, intervalMs:1000});
const b = new MissionQueueScheduler({workerCapacity:2, batchLimit:2, intervalMs:1000});
const [ra, rb] = await Promise.all([a.tick('proc-a'), b.tick('proc-b')]);
const total = ra.length + rb.length;
if (total !== 2) throw new Error(`global capacity violated: ${total}`);
const all = await listMissionQueue();
const dispatched = all.filter(x=>x.status==='DISPATCHED');
if (dispatched.length !== 2 || dispatched.some(x=>typeof x.slotId !== 'number')) throw new Error('slot dispatch state failed');
if (dispatched[0].missionId !== 'm-critical' && dispatched[1].missionId !== 'm-critical') throw new Error('priority ordering failed');
for (const d of dispatched) {
  const lease = await acquireMissionWorker(d.missionId, d.claimedBy!, 10000);
  await bindMissionDispatchLease(d.missionId, lease);
  await releaseMissionWorker(d.missionId, d.claimedBy!);
  await a.completeDispatch(d.missionId, d.claimedBy!, 'COMPLETED');
  if (typeof d.slotId === 'number' && await inspectDurableLock(`mission-scheduler-slot-${d.slotId}`)) throw new Error('slot not released');
}
const c = await a.tick('proc-a');
if (c.length !== 1 || c[0].missionId !== 'm-normal') throw new Error('remaining mission not scheduled');
await fs.rm(root, { recursive:true, force:true });
console.log('V38 distributed scheduler tests: PASS');
