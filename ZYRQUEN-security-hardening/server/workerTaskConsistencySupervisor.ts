import {
  acquireDurableLock,
  appendMissionEvent,
  loadDurableRecord,
  releaseDurableLock,
  renewDurableLock,
  listDurableRecordIds,
  saveDurableRecord,
} from './durableStore.ts';
import { recoverWorkerTaskLedger, type TaskLedgerRecoveryReport } from './workerTaskLedgerRecovery.ts';
import { auditWorkerTaskConsistency, type TaskConsistencyReport } from './workerTaskConsistency.ts';

export type ConsistencySupervisorState = 'STOPPED' | 'RUNNING' | 'STOPPING' | 'FAILED' | 'BACKOFF' | 'CIRCUIT_OPEN' | 'HALF_OPEN';
export type ConsistencyCycleStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ORPHANED' | 'SKIPPED_LOCKED';

export interface ConsistencySupervisorSnapshot {
  state: ConsistencySupervisorState;
  intervalMs: number;
  staleMs: number;
  batchLimit: number;
  cycles: number;
  recovered: number;
  repaired: number;
  blocked: number;
  lastCycleAt?: string;
  lastCycleStatus?: ConsistencyCycleStatus;
  lastError?: string;
  consecutiveFailures: number;
  nextAllowedAt?: string;
  circuitOpenedAt?: string;
  failureThreshold: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  circuitOpenMs: number;
  recoveryProbe: boolean;
  halfOpenAt?: string;
  transitions: number;
}


export interface DurableConsistencySupervisorRun {
  runId: string;
  owner: string;
  startedAt: string;
  finishedAt?: string;
  status: ConsistencyCycleStatus;
  recovery?: TaskLedgerRecoveryReport;
  audit?: TaskConsistencyReport;
  error?: string;
}

interface DurableSupervisorState {
  state: ConsistencySupervisorState;
  consecutiveFailures: number;
  nextAllowedAt?: string;
  circuitOpenedAt?: string;
  halfOpenAt?: string;
  transitions?: number;
  updatedAt: string;
}

export interface WorkerTaskConsistencySupervisorOptions {
  intervalMs?: number;
  staleMs?: number;
  batchLimit?: number;
  lockTtlMs?: number;
  heartbeatMs?: number;
  orphanAfterMs?: number;
  failureThreshold?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  circuitOpenMs?: number;
  recoveryProbe?: boolean;
}

const LOCK_RESOURCE = 'worker-task-consistency-supervisor';
const STATE_RECORD = 'worker-task-consistency-supervisor-state';

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number(value))); }
function ownerId() { return `task-consistency-supervisor-${process.pid}`; }

export class WorkerTaskConsistencySupervisor {
  private state: ConsistencySupervisorState = 'STOPPED';
  private timer?: ReturnType<typeof setTimeout>;
  private runningCycle?: Promise<DurableConsistencySupervisorRun>;
  private readonly owner = ownerId();
  private readonly options: Required<WorkerTaskConsistencySupervisorOptions>;
  private cycles = 0;
  private recovered = 0;
  private repaired = 0;
  private blocked = 0;
  private lastCycleAt?: string;
  private lastCycleStatus?: ConsistencyCycleStatus;
  private lastError?: string;
  private consecutiveFailures = 0;
  private nextAllowedAt?: string;
  private circuitOpenedAt?: string;
  private halfOpenAt?: string;
  private transitions = 0;

  constructor(options: WorkerTaskConsistencySupervisorOptions = {}) {
    this.options = {
      intervalMs: clamp(Number(options.intervalMs || process.env.CODEVOICE_TASK_CONSISTENCY_INTERVAL_MS || 10000), 1000, 300000),
      staleMs: clamp(Number(options.staleMs || process.env.CODEVOICE_TASK_CONSISTENCY_STALE_MS || 30000), 1000, 300000),
      batchLimit: clamp(Number(options.batchLimit || process.env.CODEVOICE_TASK_CONSISTENCY_BATCH_LIMIT || 500), 1, 2000),
      lockTtlMs: clamp(Number(options.lockTtlMs || 30000), 1000, 300000),
      heartbeatMs: clamp(Number(options.heartbeatMs || Math.max(1000, Math.floor(Number(options.lockTtlMs || 30000) / 3))), 1000, 100000),
      orphanAfterMs: clamp(Number(options.orphanAfterMs || Math.max(5000, Number(options.staleMs || 30000) * 2)), 1000, 900000),
      failureThreshold: clamp(Number(options.failureThreshold || process.env.CODEVOICE_TASK_CONSISTENCY_FAILURE_THRESHOLD || 3), 1, 20),
      baseBackoffMs: clamp(Number(options.baseBackoffMs || process.env.CODEVOICE_TASK_CONSISTENCY_BACKOFF_MS || 5000), 1000, 300000),
      maxBackoffMs: clamp(Number(options.maxBackoffMs || process.env.CODEVOICE_TASK_CONSISTENCY_MAX_BACKOFF_MS || 120000), 1000, 900000),
      circuitOpenMs: clamp(Number(options.circuitOpenMs || process.env.CODEVOICE_TASK_CONSISTENCY_CIRCUIT_MS || 60000), 1000, 900000),
      recoveryProbe: options.recoveryProbe !== false,
    };
  }

  snapshot(): ConsistencySupervisorSnapshot {
    return {
      state: this.state,
      intervalMs: this.options.intervalMs,
      staleMs: this.options.staleMs,
      batchLimit: this.options.batchLimit,
      cycles: this.cycles,
      recovered: this.recovered,
      repaired: this.repaired,
      blocked: this.blocked,
      ...(this.lastCycleAt ? { lastCycleAt: this.lastCycleAt } : {}),
      ...(this.lastCycleStatus ? { lastCycleStatus: this.lastCycleStatus } : {}),
      ...(this.lastError ? { lastError: this.lastError } : {}),
      consecutiveFailures: this.consecutiveFailures,
      ...(this.nextAllowedAt ? { nextAllowedAt: this.nextAllowedAt } : {}),
      ...(this.circuitOpenedAt ? { circuitOpenedAt: this.circuitOpenedAt } : {}),
      failureThreshold: this.options.failureThreshold,
      baseBackoffMs: this.options.baseBackoffMs,
      maxBackoffMs: this.options.maxBackoffMs,
      circuitOpenMs: this.options.circuitOpenMs,
      recoveryProbe: this.options.recoveryProbe,
      ...(this.halfOpenAt ? { halfOpenAt: this.halfOpenAt } : {}),
      transitions: this.transitions,
    };
  }

  start() {
    if (this.state === 'RUNNING') return this.snapshot();
    if (this.state === 'STOPPING') return this.snapshot();
    this.state = 'RUNNING';
    void this.loadPersistedState();
    this.schedule();
    return this.snapshot();
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.state = 'STOPPED';
    return this.snapshot();
  }

  async tick(): Promise<ConsistencySupervisorSnapshot> {
    if (this.state === 'STOPPED') this.state = 'RUNNING';
    if (this.state === 'STOPPING') return this.snapshot();
    await this.loadPersistedState();
    if (!this.canRunNow()) return this.snapshot();
    try {
      await this.runCycle();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.lastCycleStatus = 'FAILED';
      await this.recordFailure(this.lastError);
    }
    return this.snapshot();
  }

  runCycle(): Promise<DurableConsistencySupervisorRun> {
    if (this.runningCycle) return this.runningCycle;
    const cycle = this.executeCycle();
    this.runningCycle = cycle;
    cycle.then(() => { if (this.runningCycle === cycle) this.runningCycle = undefined; }, () => { if (this.runningCycle === cycle) this.runningCycle = undefined; });
    return cycle;
  }

  async shutdown() {
    this.stop();
    this.state = 'STOPPING';
    if (this.runningCycle) await this.runningCycle.catch(() => undefined);
    this.state = 'STOPPED';
    return this.snapshot();
  }

  private async executeCycle(): Promise<DurableConsistencySupervisorRun> {
    const runId = `consistency-cycle-${Date.now()}-${process.pid}`;
    const startedAt = new Date().toISOString();
    const base: DurableConsistencySupervisorRun = { runId, owner: this.owner, startedAt, status: 'RUNNING' };
    let lockHeld = false;
    let lockId: string | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    await this.reconcileOrphanedRuns(runId);
    await saveDurableRecord('worker-consistency-run', runId, base);
    try {
      const lock = await acquireDurableLock(LOCK_RESOURCE, this.owner, this.options.lockTtlMs);
      lockHeld = true;
      lockId = lock.lockId;
      heartbeat = setInterval(() => {
        if (!lockId) return;
        void renewDurableLock(LOCK_RESOURCE, this.owner, lockId, this.options.lockTtlMs).catch((error) => {
          this.lastError = error instanceof Error ? error.message : String(error);
        });
      }, this.options.heartbeatMs);
      const recovery = await recoverWorkerTaskLedger({ staleMs: this.options.staleMs, limit: this.options.batchLimit });
      const audit = await auditWorkerTaskConsistency({ limit: this.options.batchLimit });
      const finishedAt = new Date().toISOString();
      const completed: DurableConsistencySupervisorRun = { ...base, finishedAt, status: 'COMPLETED', recovery, audit };
      const current = await loadDurableRecord<DurableConsistencySupervisorRun>('worker-consistency-run', runId);
      await saveDurableRecord('worker-consistency-run', runId, completed, current?.version || 1);
      await appendMissionEvent({
        eventId: `worker-consistency-supervisor:${runId}`,
        missionId: 'system',
        type: 'WORKER_TASK_CONSISTENCY_SUPERVISOR_CYCLE',
        timestamp: finishedAt,
        status: 'COMPLETED',
        summary: 'Worker task ledger recovery and consistency audit completed',
        evidence: [`run:${runId}`, `recovered:${recovery.finalized + recovery.requeued}`, `repaired:${audit.repaired}`, `blocked:${recovery.blocked + audit.blocked}`],
      }).catch(() => undefined);
      this.cycles += 1;
      this.recovered += recovery.finalized + recovery.requeued;
      this.repaired += audit.repaired;
      this.blocked += recovery.blocked + audit.blocked;
      this.lastCycleAt = finishedAt;
      this.lastCycleStatus = 'COMPLETED';
      this.lastError = undefined;
      this.consecutiveFailures = 0;
      this.nextAllowedAt = undefined;
      this.circuitOpenedAt = undefined;
      if (this.state === 'HALF_OPEN') this.transitions += 1;
      this.halfOpenAt = undefined;
      await this.persistState('RUNNING');
      return completed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'RESOURCE_LOCKED') {
        const skipped: DurableConsistencySupervisorRun = { ...base, finishedAt: new Date().toISOString(), status: 'SKIPPED_LOCKED', error: message };
        const current = await loadDurableRecord<DurableConsistencySupervisorRun>('worker-consistency-run', runId);
        await saveDurableRecord('worker-consistency-run', runId, skipped, current?.version || 1).catch(() => undefined);
        this.lastCycleAt = skipped.finishedAt;
        this.lastCycleStatus = 'SKIPPED_LOCKED';
        this.lastError = undefined;
        return skipped;
      }
      const failed: DurableConsistencySupervisorRun = { ...base, finishedAt: new Date().toISOString(), status: 'FAILED', error: message };
      const current = await loadDurableRecord<DurableConsistencySupervisorRun>('worker-consistency-run', runId);
      await saveDurableRecord('worker-consistency-run', runId, failed, current?.version || 1).catch(() => undefined);
      this.cycles += 1;
      this.lastCycleAt = failed.finishedAt;
      this.lastCycleStatus = 'FAILED';
      this.lastError = message;
      await this.recordFailure(message);
      throw error;
    } finally {
      if (heartbeat) clearInterval(heartbeat);
      if (lockHeld) await releaseDurableLock(LOCK_RESOURCE, this.owner).catch(() => undefined);
    }
  }



  private canRunNow() {
    const now = Date.now();
    if (this.state === 'CIRCUIT_OPEN') {
      const opened = this.circuitOpenedAt ? Date.parse(this.circuitOpenedAt) : 0;
      if (opened && now - opened < this.options.circuitOpenMs) return false;
      if (this.options.recoveryProbe) {
        this.halfOpenAt = this.halfOpenAt || new Date().toISOString();
        this.state = 'HALF_OPEN';
        this.transitions += 1;
        void this.persistState('HALF_OPEN');
      } else {
        this.state = 'RUNNING';
      }
    }
    if (this.state === 'HALF_OPEN') return true;
    if (this.nextAllowedAt && now < Date.parse(this.nextAllowedAt)) {
      this.state = 'BACKOFF';
      return false;
    }
    if (this.state === 'BACKOFF') this.state = 'RUNNING';
    return true;
  }

  private async loadPersistedState() {
    const record = await loadDurableRecord<DurableSupervisorState>('worker-consistency-supervisor', STATE_RECORD);
    if (!record) return;
    this.consecutiveFailures = Math.max(0, Number(record.payload.consecutiveFailures || 0));
    this.nextAllowedAt = record.payload.nextAllowedAt;
    this.circuitOpenedAt = record.payload.circuitOpenedAt;
    this.halfOpenAt = record.payload.halfOpenAt;
    this.transitions = Math.max(0, Number(record.payload.transitions || 0));
    const now = Date.now();
    if (record.payload.state === 'CIRCUIT_OPEN' && this.circuitOpenedAt) {
      if (now - Date.parse(this.circuitOpenedAt) < this.options.circuitOpenMs) this.state = 'CIRCUIT_OPEN';
      else if (this.options.recoveryProbe) { this.state = 'HALF_OPEN'; this.halfOpenAt = new Date().toISOString(); }
      else this.state = 'RUNNING';
    } else if (record.payload.state === 'HALF_OPEN' && this.options.recoveryProbe) this.state = 'HALF_OPEN';
    else if (this.nextAllowedAt && now < Date.parse(this.nextAllowedAt)) this.state = 'BACKOFF';
    else if (record.payload.state === 'RUNNING') this.state = 'RUNNING';
  }

  private async persistState(state: ConsistencySupervisorState) {
    this.state = state;
    const current = await loadDurableRecord<DurableSupervisorState>('worker-consistency-supervisor', STATE_RECORD);
    const payload: DurableSupervisorState = { state, consecutiveFailures: this.consecutiveFailures, ...(this.nextAllowedAt ? { nextAllowedAt: this.nextAllowedAt } : {}), ...(this.circuitOpenedAt ? { circuitOpenedAt: this.circuitOpenedAt } : {}), ...(this.halfOpenAt ? { halfOpenAt: this.halfOpenAt } : {}), transitions: this.transitions, updatedAt: new Date().toISOString() };
    await saveDurableRecord('worker-consistency-supervisor', STATE_RECORD, payload, current?.version || 1);
  }

  private async recordFailure(message: string) {
    this.consecutiveFailures += 1;
    const delay = Math.min(this.options.maxBackoffMs, this.options.baseBackoffMs * (2 ** Math.max(0, this.consecutiveFailures - 1)));
    this.nextAllowedAt = new Date(Date.now() + delay).toISOString();
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      this.circuitOpenedAt = new Date().toISOString();
      this.halfOpenAt = undefined;
      this.state = 'CIRCUIT_OPEN';
      this.nextAllowedAt = new Date(Date.now() + this.options.circuitOpenMs).toISOString();
      this.transitions += 1;
    } else {
      this.state = 'BACKOFF';
      this.circuitOpenedAt = undefined;
      this.halfOpenAt = undefined;
      this.transitions += 1;
    }
    await this.persistState(this.state);
    await appendMissionEvent({ eventId: `worker-consistency-supervisor:failure:${Date.now()}:${process.pid}`, missionId: 'system', type: 'WORKER_TASK_CONSISTENCY_SUPERVISOR_BACKOFF', timestamp: new Date().toISOString(), status: this.state, summary: 'Supervisor entered durable failure backoff/circuit state', evidence: [`failures:${this.consecutiveFailures}`, `delayMs:${delay}`, `message:${message}`] }).catch(() => undefined);
  }

  async resetCircuit(reason = 'manual-reset') {
    this.consecutiveFailures = 0;
    this.nextAllowedAt = undefined;
    this.circuitOpenedAt = undefined;
    this.halfOpenAt = undefined;
    this.lastError = undefined;
    this.transitions += 1;
    await this.persistState('RUNNING');
    await appendMissionEvent({
      eventId: `worker-consistency-supervisor:reset:${Date.now()}:${process.pid}`,
      missionId: 'system',
      type: 'WORKER_TASK_CONSISTENCY_SUPERVISOR_RESET',
      timestamp: new Date().toISOString(),
      status: 'RUNNING',
      summary: 'Supervisor circuit/backoff state manually reset',
      evidence: [`reason:${String(reason).slice(0, 256)}`],
    }).catch(() => undefined);
    return this.snapshot();
  }

  private async reconcileOrphanedRuns(currentRunId: string) {
    const ids = await listDurableRecordIds('worker-consistency-run', Math.min(this.options.batchLimit, 2000));
    const cutoff = Date.now() - this.options.orphanAfterMs;
    for (const id of ids) {
      if (id === currentRunId) continue;
      const record = await loadDurableRecord<DurableConsistencySupervisorRun>('worker-consistency-run', id);
      if (!record || record.payload.status !== 'RUNNING') continue;
      if (Date.parse(record.payload.startedAt) > cutoff) continue;
      const orphaned: DurableConsistencySupervisorRun = { ...record.payload, finishedAt: new Date().toISOString(), status: 'ORPHANED', error: 'supervisor-cycle-stale-orphaned' };
      await saveDurableRecord('worker-consistency-run', id, orphaned, record.version);
      await appendMissionEvent({
        eventId: `worker-consistency-supervisor:orphan:${id}:${record.version + 1}`,
        missionId: 'system',
        type: 'WORKER_TASK_CONSISTENCY_SUPERVISOR_CYCLE_ORPHANED',
        timestamp: orphaned.finishedAt!,
        status: 'ORPHANED',
        summary: 'Stale supervisor cycle marked orphaned before a new recovery cycle',
        evidence: [`run:${id}`, `startedAt:${record.payload.startedAt}`],
      }).catch(() => undefined);
    }
  }

  private schedule() {
    if (this.state !== 'RUNNING' || this.timer) return;
    this.timer = setTimeout(async () => {
      this.timer = undefined;
      await this.tick();
      if (this.state === 'RUNNING') this.schedule();
    }, this.options.intervalMs);
  }
}

export const workerTaskConsistencySupervisor = new WorkerTaskConsistencySupervisor();

export async function loadWorkerConsistencyRun(runId: string) {
  return loadDurableRecord<DurableConsistencySupervisorRun>('worker-consistency-run', runId);
}
