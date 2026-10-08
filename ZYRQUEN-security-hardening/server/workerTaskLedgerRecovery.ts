import { appendMissionEvent, listDurableRecordIds, loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import { inspectMissionWorker } from './missionWorkerSupervisor.ts';
import { loadWorkerTaskRun, type DurableWorkerTaskRun } from './workerTaskLedger.ts';
import type { AutonomousMission, AutonomousTask, MissionTaskResult } from '../src/tools/autonomousMissionEngine.ts';

export type TaskLedgerRecoveryAction = 'FINALIZED_FROM_MISSION' | 'REQUEUED_SAFE_TASK' | 'BLOCKED_REVIEW' | 'SKIPPED_ACTIVE' | 'SKIPPED_TERMINAL';

export interface TaskLedgerRecoveryItem {
  missionId: string;
  taskId: string;
  action: TaskLedgerRecoveryAction;
  reason: string;
  runState: DurableWorkerTaskRun['state'];
}

export interface TaskLedgerRecoveryReport {
  scanned: number;
  finalized: number;
  requeued: number;
  blocked: number;
  skipped: number;
  errors: string[];
  items: TaskLedgerRecoveryItem[];
}

const SAFE_REPLAY_TASKS = new Set(['ANALYZE', 'PLAN', 'READ', 'SEARCH', 'VALIDATE', 'TEST', 'RUN_TEST', 'RUN_BUILD', 'RUN_LINT', 'RUN_TYPECHECK', 'RUN_INSPECT', 'REVIEW', 'SUMMARIZE']);

function safeId(value: string) {
  const v = String(value || '').trim();
  if (!v || v.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_WORKER_TASK_VALUE');
  return v;
}

function missionResultFromTask(task: AutonomousTask): MissionTaskResult | undefined {
  if (task.status === 'COMPLETED') return { success: true, output: task.outputs, evidence: ['reconciled:mission-task-already-completed'] };
  if (task.status === 'WAITING_APPROVAL') return { success: false, requiresApproval: true, error: { code: 'WAITING_APPROVAL', message: 'Task is waiting for approval', failureClass: 'PERMISSION', recoverable: false }, evidence: ['reconciled:mission-task-waiting-approval'] };
  if (task.status === 'FAILED' && task.error) return { success: false, error: task.error, evidence: task.error.evidence || ['reconciled:mission-task-failed'] };
  return undefined;
}

export async function recoverWorkerTaskLedger(options: { staleMs?: number; limit?: number } = {}): Promise<TaskLedgerRecoveryReport> {
  const staleMs = Math.max(1000, Number(options.staleMs || 30000));
  const ids = await listDurableRecordIds('worker-task-run', Math.min(Math.max(Number(options.limit || 500), 1), 2000));
  const report: TaskLedgerRecoveryReport = { scanned: 0, finalized: 0, requeued: 0, blocked: 0, skipped: 0, errors: [], items: [] };

  for (const recordId of ids) {
    try {
      const record = await loadDurableRecord<DurableWorkerTaskRun>('worker-task-run', recordId);
      if (!record) continue;
      report.scanned += 1;
      const run = record.payload;
      if (['COMPLETED', 'FAILED', 'WAITING_APPROVAL', 'ORPHANED'].includes(run.state)) {
        report.skipped += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: run.state === 'ORPHANED' ? 'SKIPPED_TERMINAL' : 'SKIPPED_TERMINAL', reason: 'terminal-or-already-reconciled', runState: run.state });
        continue;
      }
      if (Date.now() - Date.parse(run.updatedAt) < staleMs) {
        report.skipped += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: 'SKIPPED_ACTIVE', reason: 'not-stale', runState: run.state });
        continue;
      }
      const worker = await inspectMissionWorker(run.missionId);
      const active = worker.status === 'ACTIVE' && worker.lease?.leaseId === run.leaseId && worker.lease?.workerId === run.workerId;
      if (active) {
        report.skipped += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: 'SKIPPED_ACTIVE', reason: 'worker-lease-still-active', runState: run.state });
        continue;
      }

      const missionRecord = await loadDurableRecord<AutonomousMission>('mission', safeId(run.missionId));
      if (!missionRecord) {
        await saveDurableRecord('worker-task-run', record.id, { ...run, state: 'ORPHANED', error: 'MISSION_NOT_FOUND_DURING_TASK_RECOVERY', updatedAt: new Date().toISOString() }, record.version);
        report.blocked += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: 'BLOCKED_REVIEW', reason: 'mission-not-found', runState: run.state });
        continue;
      }
      const mission = missionRecord.payload;
      const task = mission.tasks.find((t) => t.taskId === run.taskId);
      if (!task) {
        await saveDurableRecord('worker-task-run', record.id, { ...run, state: 'ORPHANED', error: 'TASK_NOT_FOUND_DURING_TASK_RECOVERY', updatedAt: new Date().toISOString() }, record.version);
        report.blocked += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: 'BLOCKED_REVIEW', reason: 'task-not-found', runState: run.state });
        continue;
      }

      const missionResult = missionResultFromTask(task);
      if (missionResult) {
        const updatedRun = { ...run, state: missionResult.requiresApproval ? 'WAITING_APPROVAL' as const : missionResult.success ? 'COMPLETED' as const : 'FAILED' as const, result: missionResult, error: undefined, updatedAt: new Date().toISOString() };
        await saveDurableRecord('worker-task-run', record.id, updatedRun, record.version);
        report.finalized += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: 'FINALIZED_FROM_MISSION', reason: `mission-task-${task.status.toLowerCase()}`, runState: run.state });
        await appendMissionEvent({ eventId: `task-ledger-reconcile:${run.runId}:${record.version + 1}`, missionId: run.missionId, type: 'MISSION_WORKER_TASK_LEDGER_RECONCILED', timestamp: new Date().toISOString(), status: updatedRun.state, taskId: run.taskId, summary: 'Task ledger reconciled from durable mission task state after worker loss', evidence: [`run:${run.runId}`, `taskStatus:${task.status}`] });
        continue;
      }

      const orphaned = await saveDurableRecord('worker-task-run', record.id, { ...run, state: 'ORPHANED', error: 'WORKER_LOST_BEFORE_TASK_RESULT_COMMIT', updatedAt: new Date().toISOString() }, record.version);
      if (SAFE_REPLAY_TASKS.has(task.type) && task.status === 'RUNNING' && task.retryCount < task.maxRetries) {
        const updatedTask: AutonomousTask = { ...task, status: 'READY', retryCount: task.retryCount + 1, startedAt: undefined };
        const updatedMission: AutonomousMission = { ...mission, tasks: mission.tasks.map((candidate) => candidate.taskId === task.taskId ? updatedTask : candidate), status: 'RECOVERING', recoveryAttempts: mission.recoveryAttempts + 1, updatedAt: new Date().toISOString() };
        await saveDurableRecord('mission', missionRecord.id, updatedMission, missionRecord.version);
        report.requeued += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: 'REQUEUED_SAFE_TASK', reason: `safe-replay:${task.type}`, runState: run.state });
        await appendMissionEvent({ eventId: `task-ledger-requeue:${run.runId}:${missionRecord.version + 1}`, missionId: run.missionId, type: 'MISSION_WORKER_TASK_LEDGER_REQUEUED', timestamp: new Date().toISOString(), status: 'RECOVERING', taskId: run.taskId, summary: 'Orphaned deterministic task returned to READY after worker loss', evidence: [`run:${run.runId}`, `taskType:${task.type}`, 'replayPolicy:safe'] });
      } else {
        const updatedMission: AutonomousMission = { ...mission, status: 'WAITING_USER', updatedAt: new Date().toISOString(), errors: [...mission.errors, { code: 'TASK_LEDGER_ORPHANED', message: 'Worker disappeared before durable task result commit; manual review required to avoid duplicate side effects.', taskId: task.taskId, missionId: mission.missionId, failureClass: 'RECOVERY_LIMIT', recoverable: false, recoveryAction: 'MANUAL_REVIEW', evidence: [`worker:${run.workerId}`, `lease:${run.leaseId}`, `executionKey:${run.executionKey}`] }] };
        await saveDurableRecord('mission', missionRecord.id, updatedMission, missionRecord.version);
        report.blocked += 1;
        report.items.push({ missionId: run.missionId, taskId: run.taskId, action: 'BLOCKED_REVIEW', reason: `unsafe-or-max-retries:${task.type}`, runState: run.state });
        await appendMissionEvent({ eventId: `task-ledger-block:${run.runId}:${missionRecord.version + 1}`, missionId: run.missionId, type: 'MISSION_WORKER_TASK_LEDGER_BLOCKED', timestamp: new Date().toISOString(), status: 'WAITING_USER', taskId: run.taskId, summary: 'Orphaned task blocked to prevent an unverified side effect from being executed twice', evidence: [`run:${run.runId}`, `taskType:${task.type}`, `executionKey:${run.executionKey}`] });
      }
    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return report;
}
