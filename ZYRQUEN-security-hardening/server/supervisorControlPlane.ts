import {
  acquireDurableLock,
  appendMissionEvent,
  inspectDurableLock,
  loadDurableRecord,
  releaseDurableLock,
  renewDurableLock,
  saveDurableRecord,
  listDurableRecordIds,
} from './durableStore.ts';

export type ControlRole = 'ACTIVE' | 'STANDBY';
export type ControlHealth = 'HEALTHY' | 'DEGRADED' | 'STALE';

export interface SupervisorMember {
  memberId: string;
  owner: string;
  role: ControlRole;
  health: ControlHealth;
  epoch: number;
  fencingToken: string;
  heartbeatAt: string;
  expiresAt: string;
}

export interface SupervisorControlSnapshot {
  memberId: string;
  role: ControlRole;
  health: ControlHealth;
  epoch: number;
  fencingToken?: string;
  activeMemberId?: string;
  activeExpiresAt?: string;
  members: SupervisorMember[];
  transitionCount: number;
}

interface ControlState {
  epoch: number;
  activeMemberId?: string;
  activeFencingToken?: string;
  activeExpiresAt?: string;
  transitionCount: number;
  updatedAt: string;
}

const RESOURCE = 'worker-supervisor-control-plane';
const STATE_KIND = 'worker-consistency-supervisor';
const STATE_ID = 'control-plane-state';
const MEMBER_KIND = 'worker-consistency-supervisor';
const memberIdFor = () => `supervisor-member-${process.pid}`;

export class SupervisorControlPlane {
  private readonly memberId: string;
  private readonly owner: string;
  private readonly ttlMs: number;
  private readonly heartbeatMs: number;
  private role: ControlRole = 'STANDBY';
  private health: ControlHealth = 'STALE';
  private epoch = 0;
  private fencingToken?: string;
  private activeMemberId?: string;
  private activeExpiresAt?: string;
  private transitionCount = 0;
  private timer?: ReturnType<typeof setInterval>;
  private lockId?: string;

  constructor(options: { ttlMs?: number; heartbeatMs?: number; memberId?: string } = {}) {
    this.memberId = options.memberId || memberIdFor();
    this.owner = `${this.memberId}-owner`;
    this.ttlMs = Math.min(Math.max(Number(options.ttlMs || 15000), 3000), 300000);
    this.heartbeatMs = Math.min(Math.max(Number(options.heartbeatMs || Math.floor(this.ttlMs / 3)), 1000), 100000);
  }

  async join(): Promise<SupervisorControlSnapshot> {
    await this.loadState();
    await this.publishMember('HEALTHY');
    await this.reconcileLeadership();
    if (!this.timer) this.timer = setInterval(() => { void this.heartbeat().catch(() => undefined); }, this.heartbeatMs);
    return this.snapshot();
  }

  async heartbeat(): Promise<SupervisorControlSnapshot> {
    await this.loadState();
    if (this.role === 'ACTIVE' && this.lockId) {
      try {
        const lock = await renewDurableLock(RESOURCE, this.owner, this.lockId, this.ttlMs);
        this.fencingToken = lock.fencingToken;
        this.activeExpiresAt = lock.expiresAt;
        this.health = 'HEALTHY';
      } catch {
        this.role = 'STANDBY';
        this.health = 'DEGRADED';
        this.lockId = undefined;
        this.transitionCount += 1;
      }
    }
    await this.publishMember(this.health === 'DEGRADED' ? 'DEGRADED' : 'HEALTHY');
    await this.reconcileLeadership();
    return this.snapshot();
  }

  async acquireLeadership(): Promise<SupervisorControlSnapshot> {
    await this.loadState();
    try {
      const lock = await acquireDurableLock(RESOURCE, this.owner, this.ttlMs);
      const previousEpoch = this.epoch;
      this.epoch = Math.max(this.epoch + 1, previousEpoch + 1);
      this.role = 'ACTIVE';
      this.health = 'HEALTHY';
      this.lockId = lock.lockId;
      this.fencingToken = lock.fencingToken;
      this.activeMemberId = this.memberId;
      this.activeExpiresAt = lock.expiresAt;
      this.transitionCount += 1;
      await this.persistState();
      await this.publishMember('HEALTHY');
      await appendMissionEvent({
        eventId: `supervisor-control:leadership:${this.memberId}:${this.epoch}`,
        missionId: 'system', type: 'SUPERVISOR_CONTROL_LEADERSHIP_ACQUIRED', timestamp: new Date().toISOString(), status: 'ACTIVE',
        summary: 'Supervisor control-plane leadership acquired with a new durable epoch',
        evidence: [`member:${this.memberId}`, `epoch:${this.epoch}`, `fencingToken:${this.fencingToken}`],
      }).catch(() => undefined);
    } catch (error) {
      if (error instanceof Error && error.message === 'RESOURCE_LOCKED') {
        this.role = 'STANDBY';
        this.health = 'HEALTHY';
      } else throw error;
    }
    return this.snapshot();
  }

  async releaseLeadership(): Promise<SupervisorControlSnapshot> {
    if (this.lockId) await releaseDurableLock(RESOURCE, this.owner).catch(() => undefined);
    this.lockId = undefined;
    if (this.role === 'ACTIVE') this.transitionCount += 1;
    this.role = 'STANDBY';
    this.health = 'STALE';
    await this.publishMember('STALE');
    return this.snapshot();
  }

  async stop(): Promise<SupervisorControlSnapshot> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    return this.releaseLeadership();
  }

  snapshot(): SupervisorControlSnapshot {
    const active = this.activeMemberId;
    return {
      memberId: this.memberId, role: this.role, health: this.health, epoch: this.epoch,
      ...(this.fencingToken ? { fencingToken: this.fencingToken } : {}),
      ...(active ? { activeMemberId: active } : {}), ...(this.activeExpiresAt ? { activeExpiresAt: this.activeExpiresAt } : {}),
      members: [], transitionCount: this.transitionCount,
    };
  }

  async assertActiveLeadership(): Promise<SupervisorControlSnapshot> {
    await this.loadState();
    const lock = await inspectDurableLock(RESOURCE);
    if (!lock || lock.owner !== this.owner || Date.parse(lock.expiresAt) <= Date.now()) {
      this.role = 'STANDBY';
      this.health = 'STALE';
      this.lockId = undefined;
      throw new Error('SUPERVISOR_FENCE_LOST');
    }
    this.activeMemberId = this.memberId;
    this.activeExpiresAt = lock.expiresAt;
    this.fencingToken = lock.fencingToken;
    this.health = 'HEALTHY';
    return this.snapshot();
  }

  async inspect(): Promise<SupervisorControlSnapshot> {
    await this.loadState();
    const state = await loadDurableRecord<ControlState>(STATE_KIND, STATE_ID);
    const members: SupervisorMember[] = [];
    const now = Date.now();
    for (const id of await listDurableRecordIds(MEMBER_KIND, 200)) {
      try {
        const member = await loadDurableRecord<SupervisorMember>(MEMBER_KIND, id);
        if (!member) continue;
        const payload = member.payload;
        const expired = !payload.expiresAt || Date.parse(payload.expiresAt) <= now;
        members.push({ ...payload, health: expired ? 'STALE' : payload.health });
      } catch { /* malformed member records are ignored by inspection; durable integrity remains authoritative */ }
    }
    const activeLock = await inspectDurableLock(RESOURCE);
    if (activeLock && Date.parse(activeLock.expiresAt) > now) {
      this.activeMemberId = state?.payload.activeMemberId;
      this.activeExpiresAt = activeLock.expiresAt;
    } else if (!activeLock) {
      this.activeMemberId = undefined;
      this.activeExpiresAt = undefined;
    }
    return { ...this.snapshot(), members };
  }

  private async reconcileLeadership() {
    const lock = await inspectDurableLock(RESOURCE);
    if (!lock || Date.parse(lock.expiresAt) <= Date.now()) {
      if (this.role !== 'ACTIVE') await this.acquireLeadership();
      return;
    }
    this.activeMemberId = (await loadDurableRecord<ControlState>(STATE_KIND, STATE_ID))?.payload.activeMemberId;
    this.activeExpiresAt = lock.expiresAt;
    if (lock.owner !== this.owner) {
      this.role = 'STANDBY';
      this.health = 'HEALTHY';
      this.fencingToken = undefined;
    }
  }

  private async loadState() {
    const state = await loadDurableRecord<ControlState>(STATE_KIND, STATE_ID);
    if (!state) return;
    this.epoch = Math.max(this.epoch, Number(state.payload.epoch || 0));
    this.activeMemberId = state.payload.activeMemberId;
    this.activeExpiresAt = state.payload.activeExpiresAt;
    this.transitionCount = Math.max(this.transitionCount, Number(state.payload.transitionCount || 0));
  }

  private async persistState() {
    const current = await loadDurableRecord<ControlState>(STATE_KIND, STATE_ID);
    const payload: ControlState = { epoch: this.epoch, activeMemberId: this.activeMemberId, activeFencingToken: this.fencingToken, activeExpiresAt: this.activeExpiresAt, transitionCount: this.transitionCount, updatedAt: new Date().toISOString() };
    await saveDurableRecord(STATE_KIND, STATE_ID, payload, current?.version || 1);
  }

  private async publishMember(health: ControlHealth) {
    const now = new Date();
    const member: SupervisorMember = {
      memberId: this.memberId, owner: this.owner, role: this.role, health, epoch: this.epoch,
      fencingToken: this.fencingToken || '', heartbeatAt: now.toISOString(), expiresAt: new Date(now.getTime() + this.ttlMs).toISOString(),
    };
    const current = await loadDurableRecord<SupervisorMember>(MEMBER_KIND, this.memberId);
    await saveDurableRecord(MEMBER_KIND, this.memberId, member, current?.version || 1);
    if (this.role === 'ACTIVE') await this.persistState();
  }
}

export const supervisorControlPlane = new SupervisorControlPlane();
