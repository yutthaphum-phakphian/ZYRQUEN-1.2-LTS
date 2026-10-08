import { sweepDurableTransactionRecovery, type RecoverySweepReport } from './durableRecoverySweep.ts';

export type RecoverySupervisorState = 'STOPPED' | 'RUNNING' | 'STOPPING' | 'FAILED';

export type RecoverySupervisorSnapshot = {
  state: RecoverySupervisorState;
  intervalMs: number;
  batchLimit: number;
  maxConcurrentCycles: number;
  cycle: number;
  activeCycles: number;
  lastStartedAt?: string;
  lastCompletedAt?: string;
  lastReport?: RecoverySweepReport;
  lastError?: string;
};

type Options = {
  intervalMs?: number;
  batchLimit?: number;
  maxConcurrentCycles?: number;
  sweep?: (limit: number) => Promise<RecoverySweepReport>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export class RecoverySupervisor {
  private state: RecoverySupervisorState = 'STOPPED';
  private timer?: ReturnType<typeof setTimeout>;
  private cycle = 0;
  private activeCycles = 0;
  private lastStartedAt?: string;
  private lastCompletedAt?: string;
  private lastReport?: RecoverySweepReport;
  private lastError?: string;
  private readonly intervalMs: number;
  private readonly batchLimit: number;
  private readonly maxConcurrentCycles: number;
  private readonly sweep: (limit: number) => Promise<RecoverySweepReport>;

  constructor(options: Options = {}) {
    this.intervalMs = clamp(options.intervalMs ?? 30_000, 250, 86_400_000);
    this.batchLimit = clamp(options.batchLimit ?? 500, 1, 1000);
    this.maxConcurrentCycles = clamp(options.maxConcurrentCycles ?? 1, 1, 4);
    this.sweep = options.sweep ?? sweepDurableTransactionRecovery;
  }

  snapshot(): RecoverySupervisorSnapshot {
    return {
      state: this.state,
      intervalMs: this.intervalMs,
      batchLimit: this.batchLimit,
      maxConcurrentCycles: this.maxConcurrentCycles,
      cycle: this.cycle,
      activeCycles: this.activeCycles,
      ...(this.lastStartedAt ? { lastStartedAt: this.lastStartedAt } : {}),
      ...(this.lastCompletedAt ? { lastCompletedAt: this.lastCompletedAt } : {}),
      ...(this.lastReport ? { lastReport: this.lastReport } : {}),
      ...(this.lastError ? { lastError: this.lastError } : {}),
    };
  }

  async tick(): Promise<RecoverySweepReport | null> {
    if (this.state !== 'RUNNING' && this.state !== 'STOPPED') return null;
    if (this.activeCycles >= this.maxConcurrentCycles) return null;
    this.activeCycles += 1;
    this.cycle += 1;
    this.lastStartedAt = new Date().toISOString();
    this.lastError = undefined;
    try {
      const report = await this.sweep(this.batchLimit);
      this.lastReport = report;
      this.lastCompletedAt = report.completedAt;
      return report;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.state = 'FAILED';
      throw error;
    } finally {
      this.activeCycles -= 1;
    }
  }

  start(): RecoverySupervisorSnapshot {
    if (this.state === 'RUNNING') return this.snapshot();
    if (this.state === 'STOPPING') throw new Error('RECOVERY_SUPERVISOR_STOPPING');
    this.state = 'RUNNING';
    this.schedule();
    return this.snapshot();
  }

  stop(): RecoverySupervisorSnapshot {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.state = 'STOPPED';
    return this.snapshot();
  }

  async shutdown(): Promise<RecoverySupervisorSnapshot> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.state = 'STOPPING';
    while (this.activeCycles > 0) await new Promise(resolve => setTimeout(resolve, 5));
    this.state = 'STOPPED';
    return this.snapshot();
  }

  private schedule() {
    if (this.state !== 'RUNNING' || this.timer) return;
    this.timer = setTimeout(async () => {
      this.timer = undefined;
      try { await this.tick(); } catch { /* state records the failure */ }
      if (this.state === 'RUNNING') this.schedule();
    }, this.intervalMs);
  }
}

export const recoverySupervisor = new RecoverySupervisor({
  intervalMs: Number(process.env.CODEVOICE_RECOVERY_INTERVAL_MS || 30_000),
  batchLimit: Number(process.env.CODEVOICE_RECOVERY_BATCH_LIMIT || 500),
});
