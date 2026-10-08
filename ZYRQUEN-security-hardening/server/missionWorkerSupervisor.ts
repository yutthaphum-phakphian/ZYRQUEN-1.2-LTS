import crypto from 'crypto';
import { acquireDurableLock, renewDurableLock, releaseDurableLock, inspectDurableLock, loadDurableRecord, saveDurableRecord, appendMissionEvent, verifyMissionEventJournal, type DurableLock } from './durableStore.ts';
import { inspectMissionRecovery } from './missionRecoveryOrchestrator.ts';
import type { AutonomousMission } from '../src/tools/autonomousMissionEngine.ts';

export interface MissionWorkerLease {
  leaseId: string;
  fencingToken: string;
  missionId: string;
  workerId: string;
  resource: string;
  acquiredAt: string;
  expiresAt: string;
  heartbeatAt: string;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED';
}

const safe = (value: string) => { const v = String(value || '').trim(); if (!v || v.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_WORKER_VALUE'); return v; };
const leaseKey = (missionId: string) => `mission-worker-${safe(missionId)}`;
const recordId = (missionId: string) => `worker-lease-${safe(missionId)}`;

export async function acquireMissionWorker(missionId: string, workerId: string, ttlMs = 30000): Promise<MissionWorkerLease> {
  const id = safe(missionId), worker = safe(workerId);
  const lock = await acquireDurableLock(leaseKey(id), worker, ttlMs);
  const now = new Date().toISOString();
  const lease: MissionWorkerLease = { leaseId: crypto.randomUUID(), fencingToken: lock.fencingToken || lock.lockId, missionId: id, workerId: worker, resource: lock.resource, acquiredAt: now, expiresAt: lock.expiresAt, heartbeatAt: now, status: 'ACTIVE' };
  const previous = await loadDurableRecord<MissionWorkerLease>('worker-lease', recordId(id));
  await saveDurableRecord('worker-lease', recordId(id), lease, previous?.version || 1);
  await appendMissionEvent({ eventId: `worker-acquired:${lease.leaseId}`, missionId: id, type: 'MISSION_WORKER_ACQUIRED', timestamp: now, status: 'ACTIVE', summary: 'Mission worker lease acquired', evidence: [`worker:${worker}`, `expires:${lock.expiresAt}`] });
  return lease;
}

export async function heartbeatMissionWorker(missionId: string, workerId: string, ttlMs = 30000, leaseId?: string) {
  const id = safe(missionId), worker = safe(workerId);
  const current = await loadDurableRecord<MissionWorkerLease>('worker-lease', recordId(id));
  if (!current) throw new Error('WORKER_LEASE_NOT_FOUND');
  if (current.payload.workerId !== worker) throw new Error('WORKER_LEASE_OWNER_MISMATCH');
  if (leaseId && current.payload.leaseId !== leaseId) throw new Error('WORKER_LEASE_FENCE_MISMATCH');
  if (current.payload.status !== 'ACTIVE') throw new Error('WORKER_LEASE_NOT_ACTIVE');
  const lock = await renewDurableLock(leaseKey(id), worker, current.payload.fencingToken || current.payload.leaseId, ttlMs).catch(async (error) => {
    if (error instanceof Error && error.message === 'LOCK_FENCE_MISMATCH') throw error;
    const inspected = await inspectDurableLock(leaseKey(id));
    if (!inspected) throw error;
    if (inspected.owner !== worker) throw new Error('WORKER_FENCE_LOST');
    if (inspected.lockId !== (current.payload.fencingToken || current.payload.leaseId)) throw new Error('WORKER_FENCE_LOST');
    throw error;
  });
  const updated: MissionWorkerLease = { ...current.payload, fencingToken: lock.fencingToken || lock.lockId, heartbeatAt: new Date().toISOString(), expiresAt: lock.expiresAt, status: 'ACTIVE' };
  const saved = await saveDurableRecord('worker-lease', recordId(id), updated, current.version);
  await appendMissionEvent({ eventId: `worker-heartbeat:${id}:${saved.version}`, missionId: id, type: 'MISSION_WORKER_HEARTBEAT', timestamp: updated.heartbeatAt, status: 'ACTIVE', summary: 'Mission worker lease heartbeat', evidence: [`expires:${lock.expiresAt}`] });
  return saved.payload as MissionWorkerLease;
}

export async function releaseMissionWorker(missionId: string, workerId: string) {
  const id = safe(missionId), worker = safe(workerId);
  const current = await loadDurableRecord<MissionWorkerLease>('worker-lease', recordId(id));
  if (!current) return { released: false, reason: 'WORKER_LEASE_NOT_FOUND' };
  if (current.payload.workerId !== worker) throw new Error('WORKER_LEASE_OWNER_MISMATCH');
  await releaseDurableLock(leaseKey(id), worker);
  const updated: MissionWorkerLease = { ...current.payload, status: 'RELEASED', heartbeatAt: new Date().toISOString() };
  await saveDurableRecord('worker-lease', recordId(id), updated, current.version);
  await appendMissionEvent({ eventId: `worker-released:${id}:${updated.heartbeatAt}`, missionId: id, type: 'MISSION_WORKER_RELEASED', timestamp: updated.heartbeatAt, status: 'RELEASED', summary: 'Mission worker lease released' });
  return { released: true, lease: updated };
}

export async function inspectMissionWorker(missionId: string) {
  const id = safe(missionId);
  const current = await loadDurableRecord<MissionWorkerLease>('worker-lease', recordId(id));
  if (!current) return { status: 'NONE' as const, lease: undefined };
  const expired = Date.parse(current.payload.expiresAt) <= Date.now() && current.payload.status === 'ACTIVE';
  if (expired) {
    const updated = { ...current.payload, status: 'EXPIRED' as const };
    await saveDurableRecord('worker-lease', recordId(id), updated, current.version);
    return { status: 'EXPIRED' as const, lease: updated };
  }
  return { status: current.payload.status, lease: current.payload };
}

export async function claimMissionForRecovery(missionId: string, workerId: string, ttlMs = 30000) {
  const id = safe(missionId);
  const verification = await verifyMissionEventJournal(id);
  if (!verification.valid) throw new Error(`JOURNAL_${verification.firstFailure?.reason || 'INTEGRITY_FAILED'}`);
  const recovery = await inspectMissionRecovery(id);
  if (recovery.action !== 'RESUME_READY') return { claimed: false, recovery };
  const existing = await inspectMissionWorker(id);
  if (existing.status === 'ACTIVE') return { claimed: false, reason: 'WORKER_ALREADY_ACTIVE', recovery, lease: existing.lease };
  const lease = await acquireMissionWorker(id, workerId, ttlMs);
  await appendMissionEvent({ eventId: `worker-recovery-claim:${lease.leaseId}`, missionId: id, type: 'MISSION_RECOVERY_CLAIMED', timestamp: new Date().toISOString(), status: 'RUNNING', summary: 'Recovery worker claimed mission after verified durable inspection', evidence: recovery.evidence });
  return { claimed: true, recovery, lease };
}

export async function superviseMission(missionId: string) {
  const id = safe(missionId);
  const record = await loadDurableRecord<AutonomousMission>('mission', id);
  if (!record) return { missionId: id, status: 'MISSING' };
  const worker = await inspectMissionWorker(id);
  return { missionId: id, missionStatus: record.payload.status, workerStatus: worker.status, worker: worker.lease, progress: record.payload.progress || 0, currentTaskId: record.payload.currentTaskId };
}


export interface WorkerWatchdogResult {
  missionId: string;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED' | 'NONE' | 'FENCE_LOST' | 'ERROR';
  lease?: MissionWorkerLease;
  action?: 'HEALTHY' | 'MARK_EXPIRED' | 'RECOVERY_CANDIDATE' | 'BLOCKED';
  evidence: string[];
}

export async function watchdogMissionWorker(missionId: string): Promise<WorkerWatchdogResult> {
  const id = safe(missionId);
  const current = await loadDurableRecord<MissionWorkerLease>('worker-lease', recordId(id));
  if (!current) return { missionId: id, status: 'NONE', action: 'RECOVERY_CANDIDATE', evidence: ['worker_lease:none'] };
  const lock = await inspectDurableLock(leaseKey(id));
  const nowExpired = Date.parse(current.payload.expiresAt) <= Date.now();
  if (current.payload.status === 'ACTIVE' && !nowExpired && lock && lock.owner === current.payload.workerId && lock.lockId === (current.payload.fencingToken || current.payload.leaseId)) {
    return { missionId: id, status: 'ACTIVE', lease: current.payload, action: 'HEALTHY', evidence: ['lease:active', 'fence:valid'] };
  }
  if (current.payload.status === 'ACTIVE' && lock && lock.owner === current.payload.workerId && lock.lockId !== (current.payload.fencingToken || current.payload.leaseId)) {
    const updated = { ...current.payload, status: 'EXPIRED' as const, heartbeatAt: new Date().toISOString() };
    await saveDurableRecord('worker-lease', recordId(id), updated, current.version);
    await appendMissionEvent({ eventId: `worker-fence-lost:${id}:${updated.heartbeatAt}`, missionId: id, type: 'MISSION_WORKER_FENCE_LOST', timestamp: updated.heartbeatAt, status: 'FAILED', summary: 'Worker fence lost; stale worker must stop', evidence: ['fence:lost'] });
    return { missionId: id, status: 'FENCE_LOST', lease: updated, action: 'BLOCKED', evidence: ['fence:lost', `worker:${updated.workerId}`] };
  }
  if (current.payload.status === 'ACTIVE' && nowExpired) {
    const updated = { ...current.payload, status: 'EXPIRED' as const, heartbeatAt: new Date().toISOString() };
    await saveDurableRecord('worker-lease', recordId(id), updated, current.version);
    await appendMissionEvent({ eventId: `worker-expired:${id}:${updated.heartbeatAt}`, missionId: id, type: 'MISSION_WORKER_EXPIRED', timestamp: updated.heartbeatAt, status: 'RECOVERING', summary: 'Worker lease expired; mission is a recovery candidate', evidence: [`expiredAt:${updated.expiresAt}`] });
    return { missionId: id, status: 'EXPIRED', lease: updated, action: 'RECOVERY_CANDIDATE', evidence: ['lease:expired'] };
  }
  return { missionId: id, status: current.payload.status, lease: current.payload, action: 'RECOVERY_CANDIDATE', evidence: [`lease:${current.payload.status.toLowerCase()}`] };
}

export async function assertMissionWorkerFence(missionId: string, workerId: string, leaseId: string) {
  const id = safe(missionId), worker = safe(workerId), lease = safe(leaseId);
  const current = await loadDurableRecord<MissionWorkerLease>('worker-lease', recordId(id));
  if (!current) throw new Error('WORKER_LEASE_NOT_FOUND');
  if (current.payload.workerId !== worker || current.payload.leaseId !== lease || current.payload.status !== 'ACTIVE') throw new Error('WORKER_FENCE_LOST');
  if (Date.parse(current.payload.expiresAt) <= Date.now()) throw new Error('WORKER_LEASE_EXPIRED');
  const lock = await inspectDurableLock(leaseKey(id));
  if (!lock || lock.owner !== worker || lock.lockId !== (current.payload.fencingToken || current.payload.leaseId) || Date.parse(lock.expiresAt) <= Date.now()) throw new Error('WORKER_FENCE_LOST');
  return { valid: true, fencingToken: current.payload.fencingToken || current.payload.leaseId, expiresAt: current.payload.expiresAt };
}
