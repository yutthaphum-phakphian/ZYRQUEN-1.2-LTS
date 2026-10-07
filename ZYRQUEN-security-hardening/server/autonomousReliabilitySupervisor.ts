import crypto from 'node:crypto';
import { acquireMissionWorker, releaseMissionWorker, type MissionWorkerLease } from './missionWorkerSupervisor.ts';
import { runAgentReliabilityPass, type AgentReliabilitySnapshot } from './agentReliabilityControlLoop.ts';
import { acquireDurableLock, deleteDurableRecord, loadDurableRecord, releaseDurableLock, renewDurableLock, saveDurableRecord } from './durableStore.ts';
import type { FailureSignal } from './selfHealingLoop.ts';

export type ReliabilitySupervisorState = 'STOPPED' | 'RUNNING' | 'BACKOFF' | 'QUARANTINED' | 'FAILED';
export type ReliabilitySupervisorSnapshot = {
  supervisorId: string;
  projectId: string;
  missionId: string;
  state: ReliabilitySupervisorState;
  cycle: number;
  maxCycles: number;
  baseIntervalMs: number;
  maxBackoffMs: number;
  consecutiveFailures: number;
  nextAllowedAt?: string;
  lastRunAt?: string;
  lastOutcome?: AgentReliabilitySnapshot['outcome'];
  lastSnapshot?: AgentReliabilitySnapshot;
  lastError?: string;
  auditHash: string;
  lastHeartbeatAt?: string;
  leaderLeaseExpiresAt?: string;
};

type PersistedSupervisorState = ReliabilitySupervisorSnapshot & {
  persistedAt: string;
};

type Options = {
  projectId: string;
  supervisorId?: string;
  missionId?: string;
  baseIntervalMs?: number;
  maxBackoffMs?: number;
  maxCycles?: number;
  run?: (input: { projectId: string; recoveryWorkerId: string; autoRecover: boolean }) => Promise<AgentReliabilitySnapshot>;
  onFailure?: (signal: FailureSignal) => void | Promise<void>;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

/**
 * Autonomous reliability supervisor. It owns a bounded control loop around the
 * existing reliability pass; it never invents code changes. Recovery authority
 * is fenced through a fresh mission worker lease for each cycle.
 */
export class AutonomousReliabilitySupervisor {
  private readonly projectId: string;
  private readonly supervisorId: string;
  private readonly missionId: string;
  private readonly baseIntervalMs: number;
  private readonly maxBackoffMs: number;
  private readonly maxCycles: number;
  private readonly run: NonNullable<Options['run']>;
  private readonly onFailure?: Options['onFailure'];
  private state: ReliabilitySupervisorState = 'STOPPED';
  private cycle = 0;
  private consecutiveFailures = 0;
  private nextAllowedAt?: string;
  private lastRunAt?: string;
  private lastOutcome?: AgentReliabilitySnapshot['outcome'];
  private lastSnapshot?: AgentReliabilitySnapshot;
  private lastError?: string;
  private lease?: MissionWorkerLease;
  private readonly runtimeInstanceId = `supervisor-instance-${crypto.randomUUID()}`;
  private readonly leaderLeaseTtlMs = 30_000;
  private lastHeartbeatAt?: string;
  private leaderLeaseExpiresAt?: string;

  constructor(options: Options) {
    const projectId = String(options.projectId || '').trim();
    if (!projectId) throw new Error('INVALID_RELIABILITY_PROJECT');
    this.projectId = projectId;
    this.supervisorId = options.supervisorId || `reliability-supervisor-${crypto.randomUUID()}`;
    this.missionId = options.missionId || `reliability-supervisor:${projectId}`;
    this.baseIntervalMs = clamp(options.baseIntervalMs ?? 5_000, 250, 86_400_000);
    this.maxBackoffMs = clamp(options.maxBackoffMs ?? 60_000, this.baseIntervalMs, 86_400_000);
    this.maxCycles = clamp(options.maxCycles ?? 100, 1, 10_000);
    this.run = options.run ?? (input => runAgentReliabilityPass(input));
    this.onFailure = options.onFailure;
  }

  private async persist(): Promise<void> {
    const snapshot = this.snapshot();
    const payload: PersistedSupervisorState = { ...snapshot, persistedAt: new Date().toISOString() };
    const existing = await loadDurableRecord<PersistedSupervisorState>('reliability-supervisor', this.supervisorId);
    await saveDurableRecord('reliability-supervisor', this.supervisorId, payload, (existing?.version || 0) + 1);
  }

  static async restore(options: Options): Promise<AutonomousReliabilitySupervisor> {
    const supervisor = new AutonomousReliabilitySupervisor(options);
    const record = await loadDurableRecord<PersistedSupervisorState>('reliability-supervisor', supervisor.supervisorId);
    if (!record) return supervisor;
    const saved = record.payload;
    if (saved.projectId !== supervisor.projectId || saved.missionId !== supervisor.missionId) {
      throw new Error('RELIABILITY_SUPERVISOR_IDENTITY_MISMATCH');
    }
    supervisor.state = saved.state;
    supervisor.cycle = saved.cycle;
    supervisor.consecutiveFailures = saved.consecutiveFailures;
    supervisor.nextAllowedAt = saved.nextAllowedAt;
    supervisor.lastRunAt = saved.lastRunAt;
    supervisor.lastOutcome = saved.lastOutcome;
    supervisor.lastSnapshot = saved.lastSnapshot;
    supervisor.lastError = saved.lastError;
    supervisor.lastHeartbeatAt = saved.lastHeartbeatAt;
    supervisor.leaderLeaseExpiresAt = undefined;
    return supervisor;
  }

  async persistState(): Promise<ReliabilitySupervisorSnapshot> {
    await this.persist();
    return this.snapshot();
  }

  async clearPersistedState(): Promise<void> {
    await deleteDurableRecord('reliability-supervisor', this.supervisorId);
  }

  snapshot(): ReliabilitySupervisorSnapshot {
    const base = {
      supervisorId: this.supervisorId,
      projectId: this.projectId,
      missionId: this.missionId,
      state: this.state,
      cycle: this.cycle,
      maxCycles: this.maxCycles,
      baseIntervalMs: this.baseIntervalMs,
      maxBackoffMs: this.maxBackoffMs,
      consecutiveFailures: this.consecutiveFailures,
      ...(this.nextAllowedAt ? { nextAllowedAt: this.nextAllowedAt } : {}),
      ...(this.lastRunAt ? { lastRunAt: this.lastRunAt } : {}),
      ...(this.lastOutcome ? { lastOutcome: this.lastOutcome } : {}),
      ...(this.lastSnapshot ? { lastSnapshot: this.lastSnapshot } : {}),
      ...(this.lastError ? { lastError: this.lastError } : {}),
      ...(this.lastHeartbeatAt ? { lastHeartbeatAt: this.lastHeartbeatAt } : {}),
      ...(this.leaderLeaseExpiresAt ? { leaderLeaseExpiresAt: this.leaderLeaseExpiresAt } : {}),
    };
    return { ...base, auditHash: hash(base) };
  }

  async start() {
    if (this.state === 'QUARANTINED') throw new Error('RELIABILITY_SUPERVISOR_QUARANTINED');
    if (this.state === 'FAILED') throw new Error('RELIABILITY_SUPERVISOR_FAILED');
    this.state = 'RUNNING';
    this.nextAllowedAt = new Date().toISOString();
    await this.persist();
    return this.snapshot();
  }

  async stop() {
    this.state = 'STOPPED';
    this.nextAllowedAt = undefined;
    await this.persist();
    return this.snapshot();
  }

  async tick(force = false): Promise<AgentReliabilitySnapshot | null> {
    if (!['RUNNING', 'BACKOFF'].includes(this.state)) return null;
    if (this.cycle >= this.maxCycles) { this.state = 'STOPPED'; await this.persist(); return null; }
    if (!force && this.nextAllowedAt && Date.now() < Date.parse(this.nextAllowedAt)) return null;

    const leaderResource = `reliability-supervisor-leader-${this.supervisorId}`;
    let leaderLock;
    try {
      leaderLock = await acquireDurableLock(leaderResource, this.runtimeInstanceId, this.leaderLeaseTtlMs);
    } catch (error) {
      if (error instanceof Error && error.message === 'RESOURCE_LOCKED') return null;
      throw error;
    }

    this.lastHeartbeatAt = new Date().toISOString();
    this.leaderLeaseExpiresAt = leaderLock.expiresAt;
    await this.persist();
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let leaderLost = false;
    const heartbeatMs = Math.max(1_000, Math.floor(this.leaderLeaseTtlMs / 3));
    heartbeatTimer = setInterval(() => {
      void renewDurableLock(leaderResource, this.runtimeInstanceId, leaderLock.lockId, this.leaderLeaseTtlMs)
        .then((renewed) => {
          this.lastHeartbeatAt = new Date().toISOString();
          this.leaderLeaseExpiresAt = renewed.expiresAt;
        })
        .catch(() => {
          leaderLost = true;
        });
    }, heartbeatMs);
    heartbeatTimer.unref?.();

    this.cycle += 1;
    this.lastRunAt = new Date().toISOString();
    this.lastError = undefined;
    try {
      this.lease = await acquireMissionWorker(this.missionId, this.supervisorId, Math.max(this.baseIntervalMs * 4, 30_000));
      const result = await this.run({ projectId: this.projectId, recoveryWorkerId: this.lease.workerId, autoRecover: true });
      if (leaderLost) throw new Error('RELIABILITY_SUPERVISOR_LEADERSHIP_LOST');
      this.lastSnapshot = result;
      this.lastOutcome = result.outcome;
      this.consecutiveFailures = 0;
      if (result.outcome === 'QUARANTINED') {
        this.state = 'QUARANTINED';
        this.nextAllowedAt = undefined;
      } else {
        this.state = 'RUNNING';
        this.nextAllowedAt = new Date(Date.now() + this.baseIntervalMs).toISOString();
      }
      await this.persist();
      return result;
    } catch (error) {
      this.consecutiveFailures += 1;
      this.lastError = error instanceof Error ? error.message : String(error);
      try {
        await this.onFailure?.({
          projectId: this.projectId,
          missionId: this.missionId,
          workerId: this.lease?.workerId,
          code: this.lastError,
          message: this.lastError,
          stack: error instanceof Error ? error.stack : undefined,
        });
      } catch (observerError) {
        this.lastError = `${this.lastError};SELF_HEALING_OBSERVER:${observerError instanceof Error ? observerError.message : String(observerError)}`;
      }
      const delay = Math.min(this.maxBackoffMs, this.baseIntervalMs * (2 ** Math.min(this.consecutiveFailures - 1, 10)));
      this.nextAllowedAt = new Date(Date.now() + delay).toISOString();
      this.state = 'BACKOFF';
      await this.persist();
      return null;
    } finally {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      this.leaderLeaseExpiresAt = undefined;
      if (this.lease) {
        try { await releaseMissionWorker(this.missionId, this.lease.workerId); } catch { /* preserve supervisor evidence */ }
        this.lease = undefined;
      }
      try { await releaseDurableLock(leaderResource, this.runtimeInstanceId); } catch { /* preserve supervisor evidence */ }
    }
  }
}
