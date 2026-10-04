import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.cwd(), `.v38-test-${process.pid}-${Date.now()}`);
process.env.CODEVOICE_DURABLE_ROOT = root;

const { saveDurableRecord, appendMissionEvent, loadDurableRecord } = await import('../server/durableStore.ts');
const { enqueueMission, listMissionQueue, missionQueueScheduler, bindMissionDispatchLease } = await import('../server/missionQueueScheduler.ts');
const { acquireMissionWorker, releaseMissionWorker } = await import('../server/missionWorkerSupervisor.ts');

const mission = {
  missionId: 'v38-mission', objective: 'V38 queue test', status: 'READY', progress: 0,
  tasks: [{ id: 'task-1', title: 'test', type: 'ANALYZE', status: 'PENDING', dependencies: [], priority: 1 }],
  currentTaskId: undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
} as any;
await fs.rm(root, { recursive: true, force: true });
await saveDurableRecord('mission', mission.missionId, mission, 1);
await appendMissionEvent({ eventId: crypto.randomUUID(), missionId: mission.missionId, type: 'MISSION_CREATED', timestamp: new Date().toISOString(), status: 'READY', summary: 'test mission' });

const queued = await enqueueMission(mission.missionId, 'HIGH', 3);
if (queued.priority !== 'HIGH' || queued.status !== 'QUEUED') throw new Error('enqueue failed');
const again = await enqueueMission(mission.missionId, 'LOW', 3);
if (again.priority !== 'HIGH') throw new Error('idempotent enqueue failed');

const result = await missionQueueScheduler.tick('v38-worker');
if (result.length !== 1 || result[0].missionId !== mission.missionId) throw new Error('dispatch failed');
const rows = await listMissionQueue();
if (rows[0].status !== 'DISPATCHED' || rows[0].attempts !== 1) throw new Error('queue state failed');

// The scheduler only reserves a slot; the real worker acquires its own fenced lease.
const lease = await acquireMissionWorker(mission.missionId, result[0].workerId, 10000);
await bindMissionDispatchLease(mission.missionId, lease);
const bound = await loadDurableRecord<any>('mission-queue', `queue-${mission.missionId}`);
if (!bound?.payload.leaseId || bound.payload.fencingToken !== lease.fencingToken) throw new Error('lease binding failed');

await releaseMissionWorker(mission.missionId, result[0].workerId);
const done = await missionQueueScheduler.completeDispatch(mission.missionId, result[0].workerId, 'COMPLETED');
if (!done.completed || !done.entry || done.entry.status !== 'COMPLETED') throw new Error('complete failed');

const second = await missionQueueScheduler.tick('v38-worker');
if (second.length !== 0) throw new Error('terminal mission dispatched again');

await fs.rm(root, { recursive: true, force: true });
console.log('V38 mission queue scheduler tests: PASS');
