import crypto from 'node:crypto';
import { appendMissionEvent, listDurableRecordIds, loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import { inspectMissionWorker } from './missionWorkerSupervisor.ts';
import { listMissionQueue, missionQueueScheduler, type MissionQueueEntry } from './missionQueueScheduler.ts';

export type WorkerRunState = 'CLAIMED' | 'RUNNING' | 'ACK_PENDING' | 'COMPLETED' | 'FAILED' | 'ORPHANED';

export interface DurableWorkerRun {
  runId: string;
  missionId: string;
  workerId: string;
  leaseId: string;
  fencingToken: string;
  state: WorkerRunState;
  startedAt: string;
  updatedAt: string;
  attempt: number;
  resultStatus?: string;
  resultSteps?: number;
  lastError?: string;
  ackVersion: number;
}

function safeId(value: string) {
  const id = String(value || '').trim();
  if (!id || id.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(id)) throw new Error('INVALID_WORKER_VALUE');
  return id;
}

function runId(missionId: string, leaseId: string) { return `run-${missionId}-${leaseId}`; }

export async function createWorkerRun(input: Omit<DurableWorkerRun, 'runId' | 'startedAt' | 'updatedAt' | 'ackVersion'>) {
  const now = new Date().toISOString();
  return saveDurableRecord<DurableWorkerRun>('worker-run', runId(input.missionId, input.leaseId), { ...input, runId: runId(input.missionId, input.leaseId), startedAt: now, updatedAt: now, ackVersion: 0 });
}

export async function loadWorkerRun(missionId: string, leaseId: string) {
  return loadDurableRecord<DurableWorkerRun>('worker-run', runId(safeId(missionId), safeId(leaseId)));
}

export async function transitionWorkerRun(missionId: string, leaseId: string, state: WorkerRunState, patch: Partial<DurableWorkerRun> = {}) {
  const current = await loadWorkerRun(missionId, leaseId);
  if (!current) throw new Error('WORKER_RUN_NOT_FOUND');
  if (['COMPLETED', 'FAILED'].includes(current.payload.state) && current.payload.state !== state) return current;
  const payload = { ...current.payload, ...patch, state, updatedAt: new Date().toISOString() };
  return saveDurableRecord('worker-run', current.id, payload, current.version);
}

export async function acknowledgeWorkerRun(missionId: string, leaseId: string, terminalState: 'COMPLETED' | 'FAILED', resultStatus?: string, resultSteps?: number) {
  const current = await loadWorkerRun(missionId, leaseId);
  if (!current) throw new Error('WORKER_RUN_NOT_FOUND');
  if (current.payload.state === 'COMPLETED' || current.payload.state === 'FAILED') return { idempotent: true, run: current.payload };
  const next = await saveDurableRecord('worker-run', current.id, { ...current.payload, state: terminalState, resultStatus, resultSteps, ackVersion: current.payload.ackVersion + 1, updatedAt: new Date().toISOString() }, current.version);
  return { idempotent: false, run: next.payload };
}

export interface WorkerPoolRecoveryReport { scanned: number; orphaned: number; requeued: number; finalized: number; skipped: number; errors: string[]; }

/** Recover durable worker-run records after a pool/process restart. This is deliberately conservative: stale RUNNING work is requeued only when the worker lease is no longer active. */
export async function recoverWorkerPoolRuns(options: { staleMs?: number; limit?: number } = {}): Promise<WorkerPoolRecoveryReport> {
  const staleMs = Math.max(1000, Number(options.staleMs || 15000));
  const ids = await listDurableRecordIds('worker-run', options.limit || 500);
  const report: WorkerPoolRecoveryReport = { scanned: 0, orphaned: 0, requeued: 0, finalized: 0, skipped: 0, errors: [] };
  const queueEntries = new Map((await listMissionQueue(1000)).map((entry) => [entry.missionId, entry]));
  for (const id of ids) {
    try {
      const record = await loadDurableRecord<DurableWorkerRun>('worker-run', id);
      if (!record) continue;
      report.scanned += 1;
      const run = record.payload;
      if (run.state === 'COMPLETED' || run.state === 'FAILED') { report.skipped += 1; continue; }
      if (Date.now() - Date.parse(run.updatedAt) < staleMs) { report.skipped += 1; continue; }
      const worker = await inspectMissionWorker(run.missionId);
      const active = worker.status === 'ACTIVE' && worker.lease?.leaseId === run.leaseId && worker.lease?.workerId === run.workerId;
      if (active) { report.skipped += 1; continue; }
      await transitionWorkerRun(run.missionId, run.leaseId, 'ORPHANED', { lastError: 'POOL_RESTART_OR_WORKER_LEASE_LOST' });
      report.orphaned += 1;
      const queue = queueEntries.get(run.missionId);
      if (queue?.status === 'DISPATCHED') {
        await missionQueueScheduler.completeDispatch(run.missionId, run.workerId, 'QUEUED');
        report.requeued += 1;
      } else if (queue?.status === 'QUEUED') {
        report.requeued += 1;
      } else if (['COMPLETED', 'CANCELLED'].includes(queue?.status || '')) {
        report.finalized += 1;
      }
      await appendMissionEvent({ eventId: `worker-run-recovery:${run.runId}:${run.updatedAt}`, missionId: run.missionId, type: 'MISSION_WORKER_RUN_RECOVERED', timestamp: new Date().toISOString(), status: 'RECOVERING', summary: 'Stale durable worker run reconciled after worker/pool loss', evidence: [`run:${run.runId}`, `worker:${run.workerId}`, `lease:${run.leaseId}`, `state:${run.state}`] });
    } catch (error) { report.errors.push(error instanceof Error ? error.message : String(error)); }
  }
  return report;
}

export function workerRunIdFor(missionId: string, leaseId: string) { return runId(safeId(missionId), safeId(leaseId)); }
