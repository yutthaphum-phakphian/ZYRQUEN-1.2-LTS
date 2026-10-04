import { appendMissionEvent, loadDurableRecord } from './durableStore.ts';
import { createWorkerRun, transitionWorkerRun, acknowledgeWorkerRun, recoverWorkerPoolRuns, type WorkerPoolRecoveryReport } from './missionWorkerPoolSupervisor.ts';
import { missionQueueScheduler, bindMissionDispatchLease, type QueueDispatch } from './missionQueueScheduler.ts';
import { acquireMissionWorker, releaseMissionWorker } from './missionWorkerSupervisor.ts';
import { runFencedMissionWorker } from './fencedWorkerRuntime.ts';
import { executeLocalCommand } from './localExecutionRuntime.ts';
import { prepareMissionTransaction } from './transactionalRecovery.ts';
import { applyFencedPreparedWorkspaceTransaction } from './transactionalWorkspace.ts';
import type { AutonomousMission, AutonomousMissionAdapter, MissionTaskResult } from '../src/tools/autonomousMissionEngine.ts';

export interface WorkerPoolSnapshot {
  state: 'STOPPED' | 'RUNNING' | 'STOPPING' | 'FAILED';
  capacity: number;
  inFlight: number;
  dispatched: number;
  completed: number;
  failed: number;
  retries: number;
  backpressure: number;
  lastError?: string;
  recovered: number;
}

export interface MissionWorkerPoolOptions { capacity?: number; maxSteps?: number; ttlMs?: number; intervalMs?: number; schedulerBatchLimit?: number; }

function safeId(value: string) { const v = String(value || '').trim(); if (!v || v.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_WORKER_VALUE'); return v; }

/** Default server-side adapter: real local command execution for RUN_* tasks, and deterministic mission tasks for analysis/planning. Mutations remain approval-gated. */
export function createServerWorkerAdapter(getFence?: () => { workerId: string; leaseId: string } | undefined): AutonomousMissionAdapter {
  return {
    executeTask: async (task, mission): Promise<MissionTaskResult> => {
      if (['ANALYZE', 'PLAN', 'SUMMARIZE', 'REVIEW'].includes(task.type)) {
        return { success: true, output: { missionId: mission.missionId, taskId: task.taskId, taskType: task.type, taskCount: mission.tasks.length, progress: mission.progress }, evidence: [`server-worker:${task.type}`, `mission:${mission.missionId}`] };
      }
      if (['READ', 'SEARCH', 'VALIDATE', 'TEST'].includes(task.type)) {
        return { success: true, output: { taskType: task.type, projectFiles: mission.context.relevantFiles.length, contextBudget: mission.context.budget }, evidence: [`server-worker:${task.type}`, 'durable mission context inspected'] };
      }
      if (['CREATE', 'UPDATE', 'DELETE', 'RENAME', 'CODE', 'FIX'].includes(task.type)) {
        if (task.inputs?.approved !== true) return { success: false, requiresApproval: true, error: { code: 'WAITING_APPROVAL', message: 'Mutation task requires explicit approval', failureClass: 'PERMISSION', recoverable: false }, evidence: ['permission gate: mutation approval required'] };
        const fence = getFence?.();
        if (!fence) return { success: false, error: { code: 'WORKER_FENCE_UNAVAILABLE', message: 'Mutation requires an active fenced worker lease', failureClass: 'RESOURCE', recoverable: true }, evidence: ['mutation fence required'] };
        const requested = Array.isArray(task.inputs?.files) ? task.inputs.files as Array<{ id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }> : [];
        let operations = requested.slice(0, 100);
        if (task.type === 'RENAME' && !operations.length) {
          const source = String(task.inputs?.source || task.inputs?.from || '').trim();
          const target = String(task.inputs?.target || task.inputs?.to || '').trim();
          const sourceFile = mission.context.files?.find((f) => f.name === source);
          if (!source || !target || !sourceFile) return { success: false, error: { code: 'RENAME_INPUT_INVALID', message: 'RENAME requires source/target and the source file in mission context', failureClass: 'VALIDATION', recoverable: false }, evidence: ['rename validation'] };
          operations = [
            { id: 'rename-delete', type: 'DELETE', target: source },
            { id: 'rename-create', type: 'CREATE', target, content: sourceFile.content, language: sourceFile.language },
          ];
        }
        if (!operations.length) return { success: false, error: { code: 'MUTATION_FILES_REQUIRED', message: 'Mutation task requires an approved files change set', failureClass: 'VALIDATION', recoverable: false }, evidence: ['mutation files required'] };
        const projectId = String(mission.context.projectId || mission.missionId).slice(0, 128);
        const idempotencyKey = `task-mutation:${mission.missionId}:${task.taskId}`;
        const prepared = await prepareMissionTransaction({ missionId: mission.missionId, idempotencyKey, operations: operations.map((op, index) => ({ id: op.id || `op-${index + 1}`, type: op.type, target: op.target, expected: op.expectedHash, metadata: { taskId: task.taskId, taskType: task.type } })) });
        const applied = await applyFencedPreparedWorkspaceTransaction({ transactionId: prepared.transaction.transactionId, projectId, files: operations, fence, onPhase: async (phase) => { if (phase === 'BEFORE_WRITE' || phase === 'BEFORE_COMMIT') { /* fence is rechecked by the transactional layer */ } } });
        return { success: true, output: { transactionId: prepared.transaction.transactionId, projectId, status: applied.status, reused: applied.reused, effectId: applied.effect?.effectId, resultVersion: applied.effect?.resultVersion }, evidence: [`workspace-mutation:${task.type}`, `transaction:${prepared.transaction.transactionId}`, `fence:${fence.leaseId}`] };
      }
      if (['RUN_TEST', 'RUN_BUILD', 'RUN_LINT', 'RUN_TYPECHECK', 'RUN_INSPECT'].includes(task.type)) {
        const command = task.type === 'RUN_TEST' ? 'npm test' : task.type === 'RUN_BUILD' ? 'npm run build' : task.type === 'RUN_LINT' ? 'npm run lint' : task.type === 'RUN_TYPECHECK' ? 'npm run typecheck' : 'npm run inspect';
        const inputFiles = Array.isArray(task.inputs?.files) ? task.inputs.files as Array<{name:string;content:string}> : [];
        const result = await executeLocalCommand({ command, projectId: mission.missionId, files: inputFiles, permission: 'SAFE', timeoutMs: Number(task.inputs?.timeoutMs || 30000) });
        if (result.status === 'SUCCESS') return { success: true, output: result as unknown as Record<string, unknown>, evidence: [`local-exec:${command}`, `execution:${result.executionId}`] };
        return { success: false, error: { code: result.reason || `${task.type}_FAILED`, message: result.stderr || result.reason || `${task.type} failed`, failureClass: result.status === 'TIMEOUT' ? 'TIMEOUT' : 'TOOL', recoverable: result.status === 'FAILED' }, evidence: [`local-exec:${command}`, `execution:${result.executionId}`] };
      }
      return { success: true, output: { taskType: task.type }, evidence: ['server-worker:generic-task'] };
    }
  };
}

const DEFAULT_SERVER_ADAPTER = createServerWorkerAdapter();

export class MissionWorkerPool {
  private state: WorkerPoolSnapshot['state'] = 'STOPPED';
  private timer?: ReturnType<typeof setTimeout>;
  private inFlight = new Map<string, Promise<void>>();
  private dispatched = 0; private completed = 0; private failed = 0; private retries = 0; private backpressure = 0; private recovered = 0; private lastError?: string;
  private readonly options: Required<MissionWorkerPoolOptions>;
  private readonly adapter: AutonomousMissionAdapter;
  constructor(adapter: AutonomousMissionAdapter = DEFAULT_SERVER_ADAPTER, options: MissionWorkerPoolOptions = {}) {
    this.adapter = adapter;
    this.options = { capacity: Math.max(1, Math.min(100, Number(options.capacity || process.env.CODEVOICE_WORKER_CAPACITY || 4))), maxSteps: Math.max(1, Math.min(1000, Number(options.maxSteps || 100))), ttlMs: Math.max(1000, Number(options.ttlMs || 30000)), intervalMs: Math.max(250, Number(options.intervalMs || process.env.CODEVOICE_SCHEDULER_INTERVAL_MS || 5000)), schedulerBatchLimit: Math.max(1, Number(options.schedulerBatchLimit || process.env.CODEVOICE_SCHEDULER_BATCH_LIMIT || 4)) };
  }
  snapshot(): WorkerPoolSnapshot { return { state:this.state, capacity:this.options.capacity, inFlight:this.inFlight.size, dispatched:this.dispatched, completed:this.completed, failed:this.failed, retries:this.retries, backpressure:this.backpressure, recovered:this.recovered, ...(this.lastError ? {lastError:this.lastError}: {}) }; }
  async tick(): Promise<WorkerPoolSnapshot> {
    if (this.state === 'STOPPING' || this.state === 'FAILED') return this.snapshot();
    if (this.state === 'STOPPED') this.state = 'RUNNING';
    const capacity = this.options.capacity - this.inFlight.size;
    if (capacity <= 0) { this.backpressure += 1; return this.snapshot(); }
    try {
      const dispatches = await missionQueueScheduler.tick(`pool-${process.pid}`, Math.min(capacity, this.options.schedulerBatchLimit));
      for (const dispatch of dispatches.slice(0, capacity)) this.startDispatch(dispatch);
      if (dispatches.length > capacity) this.backpressure += dispatches.length - capacity;
    } catch (error) { this.lastError = error instanceof Error ? error.message : String(error); this.state = 'FAILED'; }
    return this.snapshot();
  }
  private startDispatch(dispatch: QueueDispatch) {
    if (this.inFlight.has(dispatch.missionId)) return;
    const run = this.executeDispatch(dispatch).finally(() => this.inFlight.delete(dispatch.missionId));
    this.inFlight.set(dispatch.missionId, run);
    this.dispatched += 1;
  }
  private async executeDispatch(dispatch: QueueDispatch) {
    const missionId = safeId(dispatch.missionId); const workerId = safeId(dispatch.workerId);
    let activeLeaseId: string | undefined;
    try {
      const mission = await loadDurableRecord<AutonomousMission>('mission', missionId);
      if (!mission) throw new Error('MISSION_NOT_FOUND');
      const lease = await acquireMissionWorker(missionId, workerId, this.options.ttlMs);
      activeLeaseId = lease.leaseId;
      await bindMissionDispatchLease(missionId, lease);
      const run = await createWorkerRun({ missionId, workerId, leaseId:lease.leaseId, fencingToken:lease.fencingToken, state:'CLAIMED', attempt:dispatch.attempts });
      await appendMissionEvent({ eventId:`pool-start:${missionId}:${lease.leaseId}`, missionId, type:'MISSION_WORKER_POOL_STARTED', timestamp:new Date().toISOString(), status:mission.payload.status, summary:'Worker pool claimed dispatched mission and started fenced runtime', evidence:[`worker:${workerId}`,`lease:${lease.leaseId}`,`fence:${lease.fencingToken}`,`run:${run.id}`] });
      await transitionWorkerRun(missionId, lease.leaseId, 'RUNNING');
      const dispatchAdapter = this.adapter === DEFAULT_SERVER_ADAPTER ? createServerWorkerAdapter(() => ({ workerId, leaseId: lease.leaseId })) : this.adapter;
      const result = await runFencedMissionWorker(missionId, workerId, dispatchAdapter, { ttlMs:this.options.ttlMs, maxSteps:this.options.maxSteps, releaseOnExit:true, existingLease:lease });
      const terminal = ['COMPLETED','FAILED','CANCELLED'].includes(result.status);
      await transitionWorkerRun(missionId, lease.leaseId, 'ACK_PENDING', { resultStatus:result.status, resultSteps:result.steps });
      const ack = await acknowledgeWorkerRun(missionId, lease.leaseId, 'COMPLETED', result.status, result.steps);
      if (!ack.idempotent) {
        await missionQueueScheduler.completeDispatch(missionId, workerId, terminal ? 'COMPLETED' : 'QUEUED');
        if (terminal) this.completed += 1; else this.retries += 1;
        await appendMissionEvent({ eventId:`pool-ack:${missionId}:${result.leaseId}:${result.steps}`, missionId, type:'MISSION_WORKER_POOL_ACK', timestamp:new Date().toISOString(), status:result.status, summary:terminal?'Worker result durably acknowledged as terminal':'Worker result returned to queue for continuation', evidence:[...result.evidence, `run:${run.id}`] });
      }
    } catch (error) {
      this.failed += 1;
      if (activeLeaseId) await transitionWorkerRun(missionId, activeLeaseId, 'FAILED', { lastError: error instanceof Error ? error.message : String(error) }).catch(() => undefined);
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      try { await missionQueueScheduler.completeDispatch(missionId, workerId, 'QUEUED'); this.retries += 1; } catch { /* recovery sweep handles orphaned dispatch */ }
      await appendMissionEvent({ eventId:`pool-failure:${missionId}:${Date.now()}`, missionId, type:'MISSION_WORKER_POOL_FAILED', timestamp:new Date().toISOString(), status:'FAILED', summary:'Worker pool execution failed; dispatch returned to durable recovery path', evidence:[`worker:${workerId}`,`error:${message}`] }).catch(()=>undefined);
    }
  }
  async recover(staleMs = Math.max(this.options.intervalMs * 3, this.options.ttlMs)) {
    const report = await recoverWorkerPoolRuns({ staleMs });
    this.recovered += report.requeued + report.finalized;
    if (report.errors.length) this.lastError = report.errors[0];
    return report;
  }
  async watchdog(staleMs = Math.max(this.options.intervalMs * 3, this.options.ttlMs)) {
    return this.recover(staleMs);
  }
  start() { if (this.state === 'RUNNING') return this.snapshot(); this.state='RUNNING'; this.schedule(); return this.snapshot(); }
  stop() { if (this.timer) clearTimeout(this.timer); this.timer=undefined; this.state='STOPPED'; return this.snapshot(); }
  async shutdown() { if (this.timer) clearTimeout(this.timer); this.timer=undefined; this.state='STOPPING'; await Promise.allSettled([...this.inFlight.values()]); this.state='STOPPED'; return this.snapshot(); }
  private schedule() { if (this.state !== 'RUNNING' || this.timer) return; this.timer=setTimeout(async()=>{this.timer=undefined; await this.tick(); if(this.state==='RUNNING') this.schedule();}, this.options.intervalMs); }
}

export const missionWorkerPool = new MissionWorkerPool();
