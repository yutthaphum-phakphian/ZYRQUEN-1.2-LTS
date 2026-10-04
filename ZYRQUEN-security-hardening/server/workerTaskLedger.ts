import { appendMissionEvent, listDurableRecordIds, loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import type { AutonomousMission, AutonomousTask, MissionTaskResult } from '../src/tools/autonomousMissionEngine.ts';

export type WorkerTaskRunState = 'CLAIMED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING_APPROVAL' | 'ORPHANED';

export interface DurableWorkerTaskRun {
  runId: string;
  missionId: string;
  taskId: string;
  workerId: string;
  leaseId: string;
  fencingToken: string;
  attempt: number;
  state: WorkerTaskRunState;
  executionKey: string;
  startedAt: string;
  updatedAt: string;
  result?: MissionTaskResult;
  resultHash?: string;
  error?: string;
}

function safe(value: string) {
  const v = String(value || '').trim();
  if (!v || v.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_WORKER_TASK_VALUE');
  return v;
}

function id(missionId: string, taskId: string) { return `task-run-${missionId}-${taskId}`; }
function executionKey(missionId: string, taskId: string) { return `worker-task:${missionId}:${taskId}`; }

export async function loadWorkerTaskRun(missionId: string, taskId: string) {
  return loadDurableRecord<DurableWorkerTaskRun>('worker-task-run', id(safe(missionId), safe(taskId)));
}

export async function claimWorkerTaskRun(input: {
  mission: AutonomousMission;
  task: AutonomousTask;
  workerId: string;
  leaseId: string;
  fencingToken: string;
}): Promise<{ record: Awaited<ReturnType<typeof loadWorkerTaskRun>>; replay?: MissionTaskResult }> {
  const missionId = safe(input.mission.missionId);
  const taskId = safe(input.task.taskId);
  const existing = await loadWorkerTaskRun(missionId, taskId);
  if (existing?.payload.state === 'COMPLETED' && existing.payload.result) return { record: existing, replay: existing.payload.result };
  const now = new Date().toISOString();
  const payload: DurableWorkerTaskRun = {
    runId: id(missionId, taskId), missionId, taskId, workerId: safe(input.workerId), leaseId: safe(input.leaseId), fencingToken: safe(input.fencingToken),
    attempt: input.task.retryCount + 1, state: 'RUNNING', executionKey: executionKey(missionId, taskId), startedAt: existing?.payload.startedAt || now, updatedAt: now,
  };
  const saved = await saveDurableRecord('worker-task-run', id(missionId, taskId), payload, existing?.version || 1);
  await appendMissionEvent({ eventId: `worker-task-claim:${missionId}:${taskId}:${saved.version}`, missionId, type: 'MISSION_WORKER_TASK_LEDGER_CLAIMED', timestamp: now, status: 'RUNNING', taskId, summary: 'Durable task execution ledger claimed task', evidence: [`worker:${input.workerId}`, `lease:${input.leaseId}`, `executionKey:${payload.executionKey}`] });
  return { record: saved };
}

export async function completeWorkerTaskRun(missionId: string, taskId: string, result: MissionTaskResult) {
  const current = await loadWorkerTaskRun(missionId, taskId);
  if (!current) throw new Error('WORKER_TASK_RUN_NOT_FOUND');
  if (current.payload.state === 'COMPLETED' && current.payload.result) return { idempotent: true, record: current };
  const saved = await saveDurableRecord('worker-task-run', current.id, { ...current.payload, state: result.requiresApproval ? 'WAITING_APPROVAL' : result.success ? 'COMPLETED' : 'FAILED', result, updatedAt: new Date().toISOString() }, current.version);
  await appendMissionEvent({ eventId: `worker-task-result:${missionId}:${taskId}:${saved.version}`, missionId, type: 'MISSION_WORKER_TASK_LEDGER_RESULT', timestamp: new Date().toISOString(), status: saved.payload.state, taskId, summary: result.requiresApproval ? 'Task result durably recorded pending approval' : result.success ? 'Task result durably committed for replay' : 'Task failure durably recorded', evidence: result.evidence || [] });
  return { idempotent: false, record: saved };
}

export async function markWorkerTaskFailure(missionId: string, taskId: string, error: unknown) {
  const current = await loadWorkerTaskRun(missionId, taskId);
  if (!current) return null;
  return saveDurableRecord('worker-task-run', current.id, { ...current.payload, state: 'FAILED', error: error instanceof Error ? error.message : String(error), updatedAt: new Date().toISOString() }, current.version);
}

export async function listWorkerTaskRuns(limit = 500) {
  const ids = await listDurableRecordIds('worker-task-run', limit);
  const records = [];
  for (const recordId of ids) {
    const record = await loadDurableRecord<DurableWorkerTaskRun>('worker-task-run', recordId);
    if (record) records.push(record.payload);
  }
  return records;
}

export function workerTaskRunIdFor(missionId: string, taskId: string) { return id(safe(missionId), safe(taskId)); }
