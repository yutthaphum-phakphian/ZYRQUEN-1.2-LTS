import fs from 'node:fs/promises';
import path from 'node:path';
import {
  acquireDurableLock,
  releaseDurableLock,
  inspectDurableLock,
  loadDurableRecord,
  saveDurableRecord,
  appendMissionEvent,
  type DurableEnvelope,
} from './durableStore.ts';
import { inspectMissionWorker, type MissionWorkerLease } from './missionWorkerSupervisor.ts';
import { inspectMissionRecovery } from './missionRecoveryOrchestrator.ts';
import type { AutonomousMission } from '../src/tools/autonomousMissionEngine.ts';

const DATA_ROOT = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const QUEUE_DIR = path.join(DATA_ROOT, 'mission-queue');
const safe = (v: string) => { const x = String(v || '').trim(); if (!x || x.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_QUEUE_VALUE'); return x; };
const queueId = (missionId: string) => `queue-${safe(missionId)}`;
const queueLock = (missionId: string) => `mission-queue-${safe(missionId)}`;
const schedulerSlotLock = (slot: number) => `mission-scheduler-slot-${Math.max(0, Math.floor(slot))}`;

export type MissionQueueStatus = 'QUEUED' | 'CLAIMED' | 'DISPATCHED' | 'CANCELLED' | 'COMPLETED';
export type MissionQueuePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
const priorityWeight: Record<MissionQueuePriority, number> = { CRITICAL: 4, HIGH: 3, NORMAL: 2, LOW: 1 };

export interface MissionQueueEntry {
  missionId: string;
  priority: MissionQueuePriority;
  status: MissionQueueStatus;
  enqueuedAt: string;
  updatedAt: string;
  attempts: number;
  maxAttempts: number;
  claimedBy?: string;
  leaseId?: string;
  fencingToken?: string;
  claimedAt?: string;
  slotId?: number;
  lastError?: string;
}

export interface QueueDispatch {
  missionId: string;
  workerId: string;
  lease: MissionWorkerLease;
  priority: MissionQueuePriority;
  attempts: number;
  slotId?: number;
}

export interface SchedulerSnapshot {
  state: 'STOPPED' | 'RUNNING' | 'STOPPING' | 'FAILED';
  workerCapacity: number;
  activeWorkers: number;
  queued: number;
  claimed: number;
  dispatched: number;
  cycle: number;
  lastStartedAt?: string;
  lastCompletedAt?: string;
  lastError?: string;
}

async function listQueueIds(limit = 1000) {
  try {
    const names = await fs.readdir(QUEUE_DIR);
    return names.filter(n => n.endsWith('.json')).slice(0, Math.min(Math.max(limit, 1), 5000)).map(n => n.slice(0, -5));
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function loadEntry(missionId: string): Promise<DurableEnvelope<MissionQueueEntry> | null> {
  return loadDurableRecord<MissionQueueEntry>('mission-queue', queueId(missionId));
}

function sortEntries(a: MissionQueueEntry, b: MissionQueueEntry) {
  const priority = priorityWeight[b.priority] - priorityWeight[a.priority];
  if (priority) return priority;
  return Date.parse(a.enqueuedAt) - Date.parse(b.enqueuedAt);
}

export async function enqueueMission(missionId: string, priority: MissionQueuePriority = 'NORMAL', maxAttempts = 3) {
  const id = safe(missionId);
  const mission = await loadDurableRecord<AutonomousMission>('mission', id);
  if (!mission) throw new Error('MISSION_NOT_FOUND');
  const existing = await loadEntry(id);
  if (existing && ['QUEUED', 'CLAIMED', 'DISPATCHED'].includes(existing.payload.status)) return existing.payload;
  const now = new Date().toISOString();
  const entry: MissionQueueEntry = {
    missionId: id, priority, status: 'QUEUED', enqueuedAt: existing?.payload.enqueuedAt || now,
    updatedAt: now, attempts: existing?.payload.attempts || 0, maxAttempts: Math.max(1, Math.min(20, Number(maxAttempts || 3))),
  };
  const saved = await saveDurableRecord('mission-queue', queueId(id), entry, existing?.version || 1);
  await appendMissionEvent({ eventId: `queue-enqueued:${id}:${saved.version}`, missionId: id, type: 'MISSION_QUEUED', timestamp: now, status: 'QUEUED', summary: 'Mission added to durable worker queue', metadata: { priority, maxAttempts: entry.maxAttempts } });
  return saved.payload;
}

export async function cancelQueuedMission(missionId: string) {
  const id = safe(missionId);
  const existing = await loadEntry(id);
  if (!existing) return { cancelled: false, reason: 'QUEUE_ENTRY_NOT_FOUND' };
  if (existing.payload.status === 'DISPATCHED' || existing.payload.status === 'COMPLETED') return { cancelled: false, reason: 'QUEUE_ENTRY_TERMINAL', entry: existing.payload };
  const now = new Date().toISOString();
  const updated = { ...existing.payload, status: 'CANCELLED' as const, updatedAt: now };
  const saved = await saveDurableRecord('mission-queue', queueId(id), updated, existing.version);
  await appendMissionEvent({ eventId: `queue-cancelled:${id}:${saved.version}`, missionId: id, type: 'MISSION_QUEUE_CANCELLED', timestamp: now, status: 'CANCELLED', summary: 'Queued mission cancelled' });
  return { cancelled: true, entry: saved.payload };
}

export async function listMissionQueue(limit = 500): Promise<MissionQueueEntry[]> {
  const entries: MissionQueueEntry[] = [];
  for (const id of await listQueueIds(limit)) {
    try { const record = await loadDurableRecord<MissionQueueEntry>('mission-queue', id); if (record) entries.push(record.payload); } catch { /* corrupt entries are surfaced by scheduler evidence */ }
  }
  return entries.sort(sortEntries).slice(0, Math.min(Math.max(limit, 1), 1000));
}

export async function bindMissionDispatchLease(missionId: string, lease: MissionWorkerLease) {
  const id = safe(missionId);
  const record = await loadEntry(id);
  if (!record) throw new Error('QUEUE_ENTRY_NOT_FOUND');
  if (record.payload.status !== 'DISPATCHED') throw new Error('QUEUE_ENTRY_NOT_DISPATCHED');
  if (record.payload.claimedBy && record.payload.claimedBy !== lease.workerId) throw new Error('QUEUE_WORKER_MISMATCH');
  const updated = { ...record.payload, leaseId: lease.leaseId, fencingToken: lease.fencingToken, updatedAt: new Date().toISOString() };
  const saved = await saveDurableRecord('mission-queue', queueId(id), updated, record.version);
  await appendMissionEvent({ eventId: `queue-bound:${id}:${lease.leaseId}`, missionId: id, type: 'MISSION_QUEUE_LEASE_BOUND', timestamp: new Date().toISOString(), status: 'RUNNING', summary: 'Queue dispatch bound to an active fenced worker lease', evidence: [`worker:${lease.workerId}`, `lease:${lease.leaseId}`, `fence:${lease.fencingToken}`] });
  return saved.payload;
}

export class MissionQueueScheduler {
  private state: SchedulerSnapshot['state'] = 'STOPPED';
  private timer?: ReturnType<typeof setTimeout>;
  private cycle = 0;
  private activeWorkers = 0;
  private queued = 0;
  private claimed = 0;
  private dispatched = 0;
  private lastStartedAt?: string;
  private lastCompletedAt?: string;
  private lastError?: string;
  private readonly options: { workerCapacity?: number; intervalMs?: number; batchLimit?: number };
  constructor(options: { workerCapacity?: number; intervalMs?: number; batchLimit?: number } = {}) { this.options = options; }

  snapshot(): SchedulerSnapshot {
    return { state: this.state, workerCapacity: Math.max(1, Math.min(100, Number(this.options.workerCapacity || 4))), activeWorkers: this.activeWorkers, queued: this.queued, claimed: this.claimed, dispatched: this.dispatched, cycle: this.cycle, ...(this.lastStartedAt ? { lastStartedAt: this.lastStartedAt } : {}), ...(this.lastCompletedAt ? { lastCompletedAt: this.lastCompletedAt } : {}), ...(this.lastError ? { lastError: this.lastError } : {}) };
  }

  async tick(workerPrefix = `scheduler-${process.pid}`, requestedLimit?: number): Promise<QueueDispatch[]> {
    if (this.state !== 'RUNNING' && this.state !== 'STOPPED') return [];
    const capacity = Math.max(1, Math.min(100, Number(this.options.workerCapacity || 4)));
    const batch = Math.max(1, Math.min(100, Number(requestedLimit || this.options.batchLimit || capacity)));
    this.cycle += 1; this.lastStartedAt = new Date().toISOString(); this.lastError = undefined;
    const allEntries = await listMissionQueue(Math.max(batch * 8, 200));
    for (const entry of allEntries.filter(e => e.status === 'DISPATCHED')) {
      const worker = await inspectMissionWorker(entry.missionId);
      const leaseFresh = worker.status === 'ACTIVE' && !!worker.lease && worker.lease.workerId === entry.claimedBy;
      const ageMs = entry.claimedAt ? Date.now() - Date.parse(entry.claimedAt) : Number.MAX_SAFE_INTEGER;
      const graceMs = Math.max(1000, Number(this.options.intervalMs || 5000) * 2);
      if (!leaseFresh && ageMs >= graceMs) {
        const current = await loadEntry(entry.missionId);
        if (current?.payload.status === 'DISPATCHED') {
          await saveDurableRecord('mission-queue', queueId(entry.missionId), { ...current.payload, status: 'QUEUED', updatedAt: new Date().toISOString(), lastError: 'DISPATCH_ORPHANED' }, current.version);
          if (typeof entry.slotId === 'number' && entry.claimedBy) await releaseDurableLock(schedulerSlotLock(entry.slotId), entry.claimedBy).catch(() => undefined);
          await appendMissionEvent({ eventId: `queue-requeued:${entry.missionId}:${current.version + 1}`, missionId: entry.missionId, type: 'MISSION_QUEUE_REQUEUED', timestamp: new Date().toISOString(), status: 'QUEUED', summary: 'Orphaned dispatch returned to durable queue', evidence: ['dispatch:orphaned'] });
        }
      }
    }
    const entries = allEntries.filter(e => e.status === 'QUEUED').sort(sortEntries);
    this.queued = entries.length;
    const dispatches: QueueDispatch[] = [];
    try {
      for (const entry of entries) {
        if (dispatches.length >= batch || dispatches.length >= capacity) break;
        const mission = await loadDurableRecord<AutonomousMission>('mission', entry.missionId);
        if (!mission) { await cancelQueuedMission(entry.missionId); continue; }
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(mission.payload.status)) { await this.markTerminal(entry, 'COMPLETED'); continue; }
        const worker = await inspectMissionWorker(entry.missionId);
        if (worker.status === 'ACTIVE') continue;
        const recovery = await inspectMissionRecovery(entry.missionId).catch(() => ({ action: 'UNKNOWN' as const }));
        if (recovery.action === 'BLOCKED') continue;
        const lockOwner = `${workerPrefix}-${entry.missionId}`;
        let missionLock: Awaited<ReturnType<typeof acquireDurableLock>> | undefined;
        let slotLock: Awaited<ReturnType<typeof acquireDurableLock>> | undefined;
        try {
          missionLock = await acquireDurableLock(queueLock(entry.missionId), lockOwner, 30000);
          let selectedSlot = -1;
          for (let slot = 0; slot < capacity; slot += 1) {
            try { slotLock = await acquireDurableLock(schedulerSlotLock(slot), lockOwner, 30000); selectedSlot = slot; break; } catch (error) { if (!String(error).includes('RESOURCE_LOCKED')) throw error; }
          }
          if (selectedSlot < 0 || !slotLock) { await releaseDurableLock(queueLock(entry.missionId), lockOwner).catch(() => undefined); missionLock = undefined; continue; }
          const fresh = await loadEntry(entry.missionId);
          if (!fresh || fresh.payload.status !== 'QUEUED') { await releaseDurableLock(schedulerSlotLock(selectedSlot), lockOwner).catch(() => undefined); slotLock = undefined; continue; }
          const now = new Date().toISOString();
          const updated: MissionQueueEntry = { ...fresh.payload, status: 'DISPATCHED', updatedAt: now, attempts: fresh.payload.attempts + 1, claimedBy: lockOwner, claimedAt: now, slotId: selectedSlot };
          if (updated.attempts > updated.maxAttempts) { await this.markTerminal(fresh.payload, 'CANCELLED', 'MAX_ATTEMPTS_EXCEEDED'); await releaseDurableLock(schedulerSlotLock(selectedSlot), lockOwner).catch(() => undefined); slotLock = undefined; continue; }
          await saveDurableRecord('mission-queue', queueId(entry.missionId), updated, fresh.version);
          await appendMissionEvent({ eventId: `queue-dispatched:${entry.missionId}:${updated.attempts}`, missionId: entry.missionId, type: 'MISSION_QUEUE_DISPATCHED', timestamp: now, status: 'QUEUED', summary: 'Mission reserved in a durable scheduler slot; worker lease is acquired by the runtime', evidence: [`worker:${lockOwner}`, `slot:${selectedSlot}`, `attempt:${updated.attempts}`], metadata: { priority: entry.priority, attempt: updated.attempts, slot: selectedSlot } });
          const lease: MissionWorkerLease = { leaseId: '', fencingToken: '', missionId: entry.missionId, workerId: lockOwner, resource: '', acquiredAt: now, expiresAt: now, heartbeatAt: now, status: 'RELEASED' };
          dispatches.push({ missionId: entry.missionId, workerId: lockOwner, lease, priority: entry.priority, attempts: updated.attempts, slotId: selectedSlot });
          this.activeWorkers += 1; this.claimed += 1; this.dispatched += 1;
          await releaseDurableLock(queueLock(entry.missionId), lockOwner).catch(() => undefined); missionLock = undefined;
          slotLock = undefined;
        } catch (error) {
          if (String(error).includes('RESOURCE_LOCKED')) continue;
          this.lastError = error instanceof Error ? error.message : String(error);
        } finally {
          if (missionLock) await releaseDurableLock(queueLock(entry.missionId), lockOwner).catch(() => undefined);
          // slotLock intentionally remains durable until completion/recovery.
        }
      }
      this.lastCompletedAt = new Date().toISOString();
      return dispatches;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error); this.state = 'FAILED'; throw error;
    }
  }

  async completeDispatch(missionId: string, workerId: string, status: 'COMPLETED' | 'QUEUED' = 'COMPLETED') {
    const id = safe(missionId); const record = await loadEntry(id); if (!record) return { completed: false, reason: 'QUEUE_ENTRY_NOT_FOUND' };
    if (record.payload.claimedBy && record.payload.claimedBy !== workerId) throw new Error('QUEUE_WORKER_MISMATCH');
    const now = new Date().toISOString();
    const updated = { ...record.payload, status, updatedAt: now, ...(status === 'QUEUED' ? { claimedBy: undefined, leaseId: undefined, fencingToken: undefined } : {}) };
    const saved = await saveDurableRecord('mission-queue', queueId(id), updated, record.version);
    if (typeof record.payload.slotId === 'number') await releaseDurableLock(schedulerSlotLock(record.payload.slotId), workerId).catch(() => undefined);
    this.activeWorkers = Math.max(0, this.activeWorkers - 1);
    await appendMissionEvent({ eventId: `queue-complete:${id}:${saved.version}`, missionId: id, type: 'MISSION_QUEUE_RELEASED', timestamp: now, status, summary: status === 'COMPLETED' ? 'Mission queue slot completed' : 'Mission returned to durable queue', evidence: [`worker:${workerId}`] });
    return { completed: true, entry: saved.payload };
  }

  start() { if (this.state === 'RUNNING') return this.snapshot(); this.state = 'RUNNING'; this.schedule(); return this.snapshot(); }
  stop() { if (this.timer) clearTimeout(this.timer); this.timer = undefined; this.state = 'STOPPED'; return this.snapshot(); }
  async shutdown() { if (this.timer) clearTimeout(this.timer); this.timer = undefined; this.state = 'STOPPING'; this.state = 'STOPPED'; return this.snapshot(); }
  private schedule() { if (this.state !== 'RUNNING' || this.timer) return; const interval = Math.max(250, Math.min(86_400_000, Number(this.options.intervalMs || 5000))); this.timer = setTimeout(async () => { this.timer = undefined; try { await this.tick(); } catch {} if (this.state === 'RUNNING') this.schedule(); }, interval); }
  private async markTerminal(entry: MissionQueueEntry, status: 'COMPLETED' | 'CANCELLED', reason?: string) { const current = await loadEntry(entry.missionId); if (!current) return; await saveDurableRecord('mission-queue', queueId(entry.missionId), { ...current.payload, status, updatedAt: new Date().toISOString(), lastError: reason }, current.version); }
}

export const missionQueueScheduler = new MissionQueueScheduler({
  workerCapacity: Number(process.env.CODEVOICE_WORKER_CAPACITY || 4),
  intervalMs: Number(process.env.CODEVOICE_SCHEDULER_INTERVAL_MS || 5000),
  batchLimit: Number(process.env.CODEVOICE_SCHEDULER_BATCH_LIMIT || 4),
});
