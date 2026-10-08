import { appendMissionEvent, loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import { claimWorkerTaskRun, completeWorkerTaskRun, markWorkerTaskFailure } from './workerTaskLedger.ts';
import {
  runAutonomousMissionStep,
  type AutonomousMission,
  type AutonomousMissionAdapter,
  type MissionTaskResult,
  type AutonomousTask,
} from '../src/tools/autonomousMissionEngine.ts';
import {
  acquireMissionWorker,
  assertMissionWorkerFence,
  heartbeatMissionWorker,
  releaseMissionWorker,
  inspectMissionWorker,
} from './missionWorkerSupervisor.ts';

export interface FencedWorkerRuntimeOptions {
  ttlMs?: number;
  existingLease?: import('./missionWorkerSupervisor.ts').MissionWorkerLease;
  maxSteps?: number;
  heartbeatMs?: number;
  releaseOnExit?: boolean;
}

export interface FencedWorkerRunResult {
  missionId: string;
  workerId: string;
  leaseId: string;
  steps: number;
  status: AutonomousMission['status'] | 'MISSING';
  fenceLost: boolean;
  released: boolean;
  taskIds: string[];
  evidence: string[];
}

function safeWorker(value: string) {
  const v = String(value || '').trim();
  if (!v || v.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_WORKER_VALUE');
  return v;
}

/**
 * Wrap every adapter boundary with a fence assertion. This prevents the worker
 * from entering checkpoint/snapshot/execute/observe hooks after its lease is lost.
 */
function fencedAdapter(missionId: string, workerId: string, leaseId: string, adapter: AutonomousMissionAdapter, heartbeat: () => Promise<void>): AutonomousMissionAdapter {
  const guard = async () => {
    await heartbeat();
    await assertMissionWorkerFence(missionId, workerId, leaseId);
  };
  return {
    ...(adapter.createSnapshot ? { createSnapshot: async (mission, task) => { await guard(); const result = await adapter.createSnapshot!(mission, task); await assertMissionWorkerFence(missionId, workerId, leaseId); return result; } } : {}),
    ...(adapter.createCheckpoint ? { createCheckpoint: async (mission, task) => { await guard(); const result = await adapter.createCheckpoint!(mission, task); await assertMissionWorkerFence(missionId, workerId, leaseId); return result; } } : {}),
    executeTask: async (task: AutonomousTask, mission: AutonomousMission): Promise<MissionTaskResult> => {
      await guard();
      const claim = await claimWorkerTaskRun({ mission, task, workerId, leaseId, fencingToken: (await inspectMissionWorker(missionId)).lease?.fencingToken || '' });
      if (claim.replay) {
        await assertMissionWorkerFence(missionId, workerId, leaseId);
        return claim.replay;
      }
      // Expose a stable idempotency key to adapters that can make external effects idempotent.
      const originalInputs = task.inputs;
      task.inputs = { ...(task.inputs || {}), executionIdempotencyKey: claim.record?.payload.executionKey };
      try {
        const result = await adapter.executeTask(task, mission);
        await assertMissionWorkerFence(missionId, workerId, leaseId);
        await completeWorkerTaskRun(missionId, task.taskId, result);
        return result;
      } catch (error) {
        await markWorkerTaskFailure(missionId, task.taskId, error).catch(() => undefined);
        throw error;
      } finally {
        task.inputs = originalInputs;
      }
    },
    ...(adapter.observe ? { observe: async (mission, task, result) => { await guard(); const observed = await adapter.observe!(mission, task, result); await assertMissionWorkerFence(missionId, workerId, leaseId); return observed; } } : {}),
  };
}

export async function runFencedMissionWorker(missionId: string, workerId: string, adapter: AutonomousMissionAdapter, options: FencedWorkerRuntimeOptions = {}): Promise<FencedWorkerRunResult> {
  const id = String(missionId || '').trim();
  const worker = safeWorker(workerId);
  const ttlMs = Math.max(1000, Number(options.ttlMs || 30000));
  const maxSteps = Math.max(1, Math.min(1000, Number(options.maxSteps || 100)));
  const heartbeatMs = Math.max(250, Math.min(ttlMs - 100, Number(options.heartbeatMs || Math.floor(ttlMs / 3))));
  const record = await loadDurableRecord<AutonomousMission>('mission', id);
  if (!record) return { missionId: id, workerId: worker, leaseId: '', steps: 0, status: 'MISSING', fenceLost: false, released: false, taskIds: [], evidence: ['mission:not_found'] };

  const lease = options.existingLease && options.existingLease.missionId === id && options.existingLease.workerId === worker
    ? options.existingLease
    : await acquireMissionWorker(id, worker, ttlMs);
  let timer: ReturnType<typeof setInterval> | undefined;
  let fenceLost = false;
  let released = false;
  let steps = 0;
  const taskIds: string[] = [];
  const evidence: string[] = [`lease:${lease.leaseId}`, `fence:${lease.fencingToken}`];
  let latest = record.payload;
  let latestVersion = record.version;

  const heartbeat = async () => {
    try { await heartbeatMissionWorker(id, worker, ttlMs, lease.leaseId); }
    catch (error) { fenceLost = true; throw error; }
  };

  try {
    await assertMissionWorkerFence(id, worker, lease.leaseId);
    await appendMissionEvent({ eventId: `worker-runtime-start:${id}:${lease.leaseId}`, missionId: id, type: 'MISSION_WORKER_RUNTIME_STARTED', timestamp: new Date().toISOString(), status: latest.status, summary: 'Fenced worker execution loop started', evidence: [`worker:${worker}`, `lease:${lease.leaseId}`] });
    timer = setInterval(() => { heartbeat().catch(() => undefined); }, heartbeatMs);

    const guarded = fencedAdapter(id, worker, lease.leaseId, adapter, heartbeat);
    while (steps < maxSteps) {
      await heartbeat();
      await assertMissionWorkerFence(id, worker, lease.leaseId);
      const step = await runAutonomousMissionStep(latest, guarded);
      latest = step.mission;
      await assertMissionWorkerFence(id, worker, lease.leaseId);
      const saved = await saveDurableRecord('mission', id, latest, latestVersion);
      latest = saved.payload;
      latestVersion = saved.version;
      steps += step.executed ? 1 : 0;
      if (step.taskId) taskIds.push(step.taskId);
      await appendMissionEvent({ eventId: `worker-runtime-step:${id}:${lease.leaseId}:${steps}:${latest.updatedAt}`, missionId: id, type: 'MISSION_WORKER_STEP_COMMITTED', timestamp: new Date().toISOString(), status: latest.status, taskId: step.taskId, summary: step.executed ? 'Fenced worker task step committed durably' : 'Fenced worker observed terminal or waiting state', evidence: [`worker:${worker}`, `lease:${lease.leaseId}`, `steps:${steps}`, `progress:${latest.progress}`] });
      if (!step.executed || ['PAUSED', 'WAITING_APPROVAL', 'WAITING_USER', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(latest.status)) break;
    }
    await assertMissionWorkerFence(id, worker, lease.leaseId);
    evidence.push(`steps:${steps}`, `status:${latest.status}`);
    await appendMissionEvent({ eventId: `worker-runtime-stop:${id}:${lease.leaseId}`, missionId: id, type: 'MISSION_WORKER_RUNTIME_STOPPED', timestamp: new Date().toISOString(), status: latest.status, summary: 'Fenced worker execution loop stopped cleanly', evidence });
  } catch (error) {
    if (/WORKER_FENCE_LOST|WORKER_LEASE_EXPIRED|WORKER_LEASE_NOT_ACTIVE|WORKER_LEASE_FENCE_MISMATCH/.test(String(error instanceof Error ? error.message : error))) fenceLost = true;
    evidence.push(`error:${error instanceof Error ? error.message : String(error)}`);
    await appendMissionEvent({ eventId: `worker-runtime-failure:${id}:${lease.leaseId}:${Date.now()}`, missionId: id, type: fenceLost ? 'MISSION_WORKER_FENCE_LOST' : 'MISSION_WORKER_RUNTIME_FAILED', timestamp: new Date().toISOString(), status: fenceLost ? 'FAILED' : latest.status, summary: fenceLost ? 'Fenced worker stopped because ownership was lost' : 'Fenced worker runtime failed', evidence });
    throw error;
  } finally {
    if (timer) clearInterval(timer);
    if (options.releaseOnExit !== false) {
      await releaseMissionWorker(id, worker).then(() => { released = true; }).catch(() => undefined);
    }
  }

  const inspected = await inspectMissionWorker(id);
  return { missionId: id, workerId: worker, leaseId: lease.leaseId, steps, status: latest.status, fenceLost, released, taskIds, evidence: [...evidence, `workerStatus:${inspected.status}`] };
}
