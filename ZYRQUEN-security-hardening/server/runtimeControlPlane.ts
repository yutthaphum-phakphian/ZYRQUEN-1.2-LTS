import { missionWorkerPool } from './missionWorkerPool.ts';
import { missionQueueScheduler } from './missionQueueScheduler.ts';
import { recoverySupervisor } from './recoverySupervisor.ts';
import { workerTaskConsistencySupervisor } from './workerTaskConsistencySupervisor.ts';
import { supervisorControlPlane, type SupervisorControlSnapshot } from './supervisorControlPlane.ts';
import { durableStoreInfo } from './durableStore.ts';

export type RuntimeHealth = 'HEALTHY' | 'DEGRADED' | 'RECOVERY_REQUIRED' | 'STANDBY';

export interface RuntimeControlSnapshot {
  timestamp: string;
  health: RuntimeHealth;
  leader: boolean;
  controlPlane: SupervisorControlSnapshot;
  workerPool: ReturnType<typeof missionWorkerPool.snapshot>;
  queueScheduler: ReturnType<typeof missionQueueScheduler.snapshot>;
  recoverySupervisor: ReturnType<typeof recoverySupervisor.snapshot>;
  consistencySupervisor: ReturnType<typeof workerTaskConsistencySupervisor.snapshot>;
  durableStore: ReturnType<typeof durableStoreInfo>;
  serviceOwnership: { ownedByActiveSupervisor: boolean; takeoverCount: number };
}

function classify(input: Omit<RuntimeControlSnapshot, 'health' | 'timestamp'>): RuntimeHealth {
  if (!input.leader) return 'STANDBY';
  const states = [
    input.workerPool.state,
    input.queueScheduler.state,
    input.recoverySupervisor.state,
    input.consistencySupervisor.state,
  ];
  if (states.some((state) => state === 'FAILED' || state === 'CIRCUIT_OPEN')) return 'RECOVERY_REQUIRED';
  if (states.some((state) => state === 'STOPPED' || state === 'BACKOFF' || state === 'HALF_OPEN')) return 'DEGRADED';
  return 'HEALTHY';
}

export class RuntimeControlPlane {
  private running = false;
  private timer?: ReturnType<typeof setInterval>;
  private takeoverCount = 0;
  private lastLeader = false;
  private readonly heartbeatMs: number;

  constructor(options: { heartbeatMs?: number } = {}) {
    this.heartbeatMs = Math.max(1000, Math.min(60000, Number(options.heartbeatMs || process.env.CODEVOICE_CONTROL_PLANE_HEARTBEAT_MS || 5000)));
  }

  async snapshot(): Promise<RuntimeControlSnapshot> {
    const controlPlane = await supervisorControlPlane.inspect();
    const leader = controlPlane.role === 'ACTIVE' && controlPlane.health === 'HEALTHY';
    return {
      timestamp: new Date().toISOString(),
      health: classify({
        leader,
        controlPlane,
        workerPool: missionWorkerPool.snapshot(),
        queueScheduler: missionQueueScheduler.snapshot(),
        recoverySupervisor: recoverySupervisor.snapshot(),
        consistencySupervisor: workerTaskConsistencySupervisor.snapshot(),
        durableStore: durableStoreInfo(),
        serviceOwnership: { ownedByActiveSupervisor: leader, takeoverCount: this.takeoverCount },
      }),
      leader,
      controlPlane,
      workerPool: missionWorkerPool.snapshot(),
      queueScheduler: missionQueueScheduler.snapshot(),
      recoverySupervisor: recoverySupervisor.snapshot(),
      consistencySupervisor: workerTaskConsistencySupervisor.snapshot(),
      durableStore: durableStoreInfo(),
      serviceOwnership: { ownedByActiveSupervisor: leader, takeoverCount: this.takeoverCount },
    };
  }

  async start(): Promise<RuntimeControlSnapshot> {
    if (!this.running) {
      this.running = true;
      await supervisorControlPlane.join();
      await this.reconcileOwnership();
      this.timer = setInterval(() => { void this.heartbeat().catch(() => undefined); }, this.heartbeatMs);
    }
    return this.snapshot();
  }

  async heartbeat(): Promise<RuntimeControlSnapshot> {
    if (!this.running) return this.snapshot();
    const before = await supervisorControlPlane.inspect();
    const after = await supervisorControlPlane.heartbeat();
    await this.reconcileOwnership(after);
    return this.snapshot();
  }

  async tick(): Promise<RuntimeControlSnapshot> {
    const state = await supervisorControlPlane.heartbeat();
    await this.reconcileOwnership(state);
    if (state.role !== 'ACTIVE' || state.health !== 'HEALTHY') return this.snapshot();
    await recoverySupervisor.tick().catch(() => undefined);
    await workerTaskConsistencySupervisor.tick().catch(() => undefined);
    await missionWorkerPool.tick();
    return this.snapshot();
  }

  async stop(): Promise<RuntimeControlSnapshot> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.running = false;
    await missionWorkerPool.stop();
    missionQueueScheduler.stop();
    recoverySupervisor.stop();
    workerTaskConsistencySupervisor.stop();
    await supervisorControlPlane.stop();
    return this.snapshot();
  }

  private async reconcileOwnership(controlPlane?: SupervisorControlSnapshot) {
    const state = controlPlane || await supervisorControlPlane.inspect();
    const active = state.role === 'ACTIVE' && state.health === 'HEALTHY';
    if (active) {
      if (missionWorkerPool.snapshot().state === 'STOPPED') missionWorkerPool.start();
      if (recoverySupervisor.snapshot().state === 'STOPPED') recoverySupervisor.start();
      if (workerTaskConsistencySupervisor.snapshot().state === 'STOPPED') workerTaskConsistencySupervisor.start();
      if (!this.lastLeader) this.takeoverCount += 1;
    } else {
      if (missionWorkerPool.snapshot().state === 'RUNNING') missionWorkerPool.stop();
      if (recoverySupervisor.snapshot().state === 'RUNNING') recoverySupervisor.stop();
      if (workerTaskConsistencySupervisor.snapshot().state === 'RUNNING') workerTaskConsistencySupervisor.stop();
    }
    this.lastLeader = active;
  }
}

export const runtimeControlPlane = new RuntimeControlPlane();
