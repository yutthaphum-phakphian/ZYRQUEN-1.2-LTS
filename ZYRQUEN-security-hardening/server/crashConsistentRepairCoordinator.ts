import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { acquireDurableLock, releaseDurableLock, loadDurableRecord, saveDurableRecord, appendMissionEvent, type DurableEnvelope } from './durableStore.ts';
import { acquireMissionWorker, assertMissionWorkerFence, inspectMissionWorker, watchdogMissionWorker } from './missionWorkerSupervisor.ts';
import { prepareMissionTransaction, commitMissionTransaction, abortMissionTransaction, loadMissionTransaction } from './transactionalRecovery.ts';

export type RepairCoordinatorStatus = 'PREPARED'|'APPLYING'|'APPLIED'|'COMMITTED'|'ABORTED'|'RECOVERY_REQUIRED';
export interface RepairCoordinatorOperation { id: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string; }
interface FileSnapshot { target: string; existed: boolean; content?: string; hash: string; }
export interface RepairCoordinatorRecord {
  repairId: string; transactionId: string; missionId: string; projectId: string; workspaceRoot: string;
  workerId: string; leaseId: string; status: RepairCoordinatorStatus; operations: RepairCoordinatorOperation[];
  before: FileSnapshot[]; desired: FileSnapshot[]; createdAt: string; updatedAt: string; evidence: string[];
}
const safe = (v: string) => { const x = String(v || '').trim(); if (!x || x.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_REPAIR_COORDINATOR_KEY'); return x; };
const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const contentHash = (v: string | undefined) => hash(v ?? '');
const recordId = (repairId: string) => `repair-coordinator-${hash(repairId).slice(0, 40)}`;
const lockKey = (projectId: string) => `repair-coordinator-${safe(projectId)}`;
const targetPath = (root: string, target: string) => {
  const normalized = String(target || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) throw new Error('INVALID_REPAIR_TARGET');
  const absolute = path.resolve(root, normalized); const rel = path.relative(path.resolve(root), absolute);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('REPAIR_TARGET_OUTSIDE_WORKSPACE');
  return absolute;
};
async function readSnapshot(root: string, target: string): Promise<FileSnapshot> {
  const absolute = targetPath(root, target);
  try { const content = await fs.readFile(absolute, 'utf8'); return { target, existed: true, content, hash: contentHash(content) }; }
  catch (e: any) { if (e?.code === 'ENOENT') return { target, existed: false, hash: contentHash(undefined) }; throw e; }
}
async function writeAtomic(root: string, op: RepairCoordinatorOperation) {
  const absolute = targetPath(root, op.target);
  if (op.type === 'DELETE') { await fs.rm(absolute, { force: true }); return; }
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  const tmp = `${absolute}.repair-coordinator-${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(tmp, String(op.content ?? ''), 'utf8');
  await fs.rename(tmp, absolute);
}
async function currentMatches(root: string, snapshot: FileSnapshot) { return (await readSnapshot(root, snapshot.target)).hash === snapshot.hash && (await readSnapshot(root, snapshot.target)).existed === snapshot.existed; }
async function save(record: RepairCoordinatorRecord, version = 1) { return saveDurableRecord('repair-coordinator' as any, recordId(record.repairId), record, version); }
export async function loadRepairCoordinator(repairId: string): Promise<DurableEnvelope<RepairCoordinatorRecord> | null> { return loadDurableRecord<RepairCoordinatorRecord>('repair-coordinator' as any, recordId(safe(repairId))); }

export async function executeCrashConsistentRepair(input: { repairId: string; missionId: string; projectId: string; workspaceRoot: string; workerId: string; leaseId: string; operations: RepairCoordinatorOperation[]; patchHash: string; faultInjection?: 'AFTER_PREPARED'|'AFTER_APPLIED'|'BEFORE_TRANSACTION_COMMIT' }) {
  await assertMissionWorkerFence(input.missionId, input.workerId, input.leaseId);
  const owner = `${safe(input.workerId)}-${safe(input.leaseId)}`;
  const lock = await acquireDurableLock(lockKey(input.projectId), owner, 30000);
  try {
    const existing = await loadRepairCoordinator(input.repairId);
    if (existing?.payload.status === 'COMMITTED') return existing.payload;
    const before = await Promise.all(input.operations.map(op => readSnapshot(input.workspaceRoot, op.target)));
    for (const op of input.operations) {
      const snap = before.find(x => x.target === op.target)!;
      if (op.expectedHash && op.expectedHash !== snap.hash) throw new Error(`WORKSPACE_EXPECTATION_MISMATCH:${op.target}`);
      if (op.type === 'CREATE' && snap.existed) throw new Error(`WORKSPACE_TARGET_EXISTS:${op.target}`);
      if ((op.type === 'UPDATE' || op.type === 'DELETE') && !snap.existed) throw new Error(`WORKSPACE_TARGET_NOT_FOUND:${op.target}`);
    }
    const desired = input.operations.map(op => ({ target: op.target, existed: op.type !== 'DELETE', content: op.type === 'DELETE' ? undefined : String(op.content ?? ''), hash: contentHash(op.type === 'DELETE' ? undefined : String(op.content ?? '')) }));
    const preparedTx = await prepareMissionTransaction({ missionId: input.missionId, idempotencyKey: `${input.repairId}:coordinator`, operations: input.operations.map(op => ({ id: op.id, type: op.type, target: op.target, expected: op.expectedHash, metadata: { patchHash: input.patchHash, repairId: input.repairId } })) });
    const now = new Date().toISOString();
    const prepared: RepairCoordinatorRecord = { repairId: input.repairId, transactionId: preparedTx.transaction.transactionId, missionId: input.missionId, projectId: input.projectId, workspaceRoot: input.workspaceRoot, workerId: input.workerId, leaseId: input.leaseId, status: 'PREPARED', operations: input.operations, before, desired, createdAt: existing?.payload.createdAt || now, updatedAt: now, evidence: [`patch:${input.patchHash}`, `before:${hash(JSON.stringify(before))}`] };
    let saved = await save(prepared, existing?.version || 1);
    await appendMissionEvent({ eventId: `${input.repairId}:prepared`, missionId: input.missionId, type: 'REPAIR_COORDINATOR_PREPARED', timestamp: now, status: 'PREPARED', summary: 'Crash-consistent repair prepared with durable before-image and desired state', evidence: prepared.evidence });
    if (input.faultInjection === 'AFTER_PREPARED') throw new Error('SIMULATED_CRASH_AFTER_REPAIR_PREPARED');
    const applying = { ...saved.payload, status: 'APPLYING' as const, updatedAt: new Date().toISOString(), evidence: [...saved.payload.evidence, 'state:APPLYING'] };
    saved = await save(applying, saved.version);
    for (const op of input.operations) { await assertMissionWorkerFence(input.missionId, input.workerId, input.leaseId); await writeAtomic(input.workspaceRoot, op); }
    const applied = { ...saved.payload, status: 'APPLIED' as const, updatedAt: new Date().toISOString(), evidence: [...saved.payload.evidence, 'state:APPLIED'] };
    saved = await save(applied, saved.version);
    await appendMissionEvent({ eventId: `${input.repairId}:applied`, missionId: input.missionId, type: 'REPAIR_COORDINATOR_APPLIED', timestamp: applied.updatedAt, status: 'APPLIED', summary: 'Filesystem repair applied and durably journaled', evidence: applied.evidence });
    if (input.faultInjection === 'AFTER_APPLIED') throw new Error('SIMULATED_CRASH_AFTER_REPAIR_APPLIED');
    await assertMissionWorkerFence(input.missionId, input.workerId, input.leaseId);
    if (input.faultInjection === 'BEFORE_TRANSACTION_COMMIT') throw new Error('SIMULATED_CRASH_BEFORE_REPAIR_TRANSACTION_COMMIT');
    const committedTx = await commitMissionTransaction(saved.payload.transactionId, [...saved.payload.evidence, 'coordinator:commit']);
    const committed = { ...saved.payload, status: 'COMMITTED' as const, updatedAt: new Date().toISOString(), evidence: [...saved.payload.evidence, `transaction:${committedTx.transaction.transactionId}`, 'state:COMMITTED'] };
    await save(committed, saved.version);
    await appendMissionEvent({ eventId: `${input.repairId}:committed`, missionId: input.missionId, type: 'REPAIR_COORDINATOR_COMMITTED', timestamp: committed.updatedAt, status: 'COMMITTED', summary: 'Repair coordinator finalized after filesystem and durable transaction commit', evidence: committed.evidence });
    return committed;
  } finally { await releaseDurableLock(lockKey(input.projectId), owner).catch(() => undefined); }
}

export async function recoverCrashConsistentRepair(repairId: string, recoveryWorkerId?: string) {
  const current = await loadRepairCoordinator(repairId); if (!current) return { action: 'NO_ACTION' as const };
  let r = current.payload; let currentVersion = current.version; const tx = await loadMissionTransaction(r.transactionId); if (!tx) return { action: 'RECOVERY_REQUIRED' as const, reason: 'TRANSACTION_MISSING', record: r };
  let recoveryLease = false;
  if (recoveryWorkerId) {
    const watchdog = await watchdogMissionWorker(r.missionId);
    const inspected = await inspectMissionWorker(r.missionId);
    if (inspected.status === 'ACTIVE') {
      if (inspected.lease?.workerId !== safe(recoveryWorkerId)) {
        return { action: 'RECOVERY_REQUIRED' as const, reason: 'ACTIVE_WORKER_FENCE_CONFLICT', record: r };
      }
      try { await assertMissionWorkerFence(r.missionId, r.workerId, r.leaseId); }
      catch { return { action: 'RECOVERY_REQUIRED' as const, reason: 'RECOVERY_WORKER_FENCE_CONFLICT', record: r }; }
    } else {
      const lease = await acquireMissionWorker(r.missionId, safe(recoveryWorkerId), 30000);
      r = { ...r, workerId: lease.workerId, leaseId: lease.leaseId, updatedAt: new Date().toISOString(), evidence: [...r.evidence, `recovery:worker-takeover:${lease.workerId}`, `recovery:watchdog:${watchdog.status}`] };
      const takeoverSaved = await save(r, currentVersion);
      currentVersion = takeoverSaved.version;
      recoveryLease = true;
    }
  }
  const owner = `${safe(r.workerId)}-${safe(r.leaseId)}`;
  await assertMissionWorkerFence(r.missionId, r.workerId, r.leaseId);
  const lock = await acquireDurableLock(lockKey(r.projectId), owner, 30000);
  try {
    if (tx.payload.status === 'COMMITTED') {
      const committed = { ...r, status: 'COMMITTED' as const, updatedAt: new Date().toISOString(), evidence: [...r.evidence, 'recovery:transaction-terminal'] };
      await save(committed, currentVersion); return { action: 'FINALIZED' as const, record: committed };
    }
    const desiredState = await Promise.all(r.desired.map(s => readSnapshot(r.workspaceRoot, s.target)));
    const desiredMatch = desiredState.every((s, i) => s.existed === r.desired[i].existed && s.hash === r.desired[i].hash);
    const beforeState = await Promise.all(r.before.map(s => readSnapshot(r.workspaceRoot, s.target)));
    const beforeMatch = beforeState.every((s, i) => s.existed === r.before[i].existed && s.hash === r.before[i].hash);
    if (desiredMatch) {
      const committedTx = await commitMissionTransaction(r.transactionId, [...r.evidence, 'recovery:desired-state-confirmed']);
      const committed = { ...r, status: 'COMMITTED' as const, updatedAt: new Date().toISOString(), evidence: [...r.evidence, 'recovery:desired-state-confirmed', `transaction:${committedTx.transaction.transactionId}`] };
      await save(committed, currentVersion); return { action: 'FINALIZED' as const, record: committed };
    }
    if (beforeMatch) {
      const abortedTx = await abortMissionTransaction(r.transactionId, 'CRASH_RECOVERY_BEFORE_IMAGE_CONFIRMED');
      const aborted = { ...r, status: 'ABORTED' as const, updatedAt: new Date().toISOString(), evidence: [...r.evidence, 'recovery:before-image-confirmed', `abort:${abortedTx.transaction.transactionId}`] };
      await save(aborted, currentVersion); return { action: 'ABORTED' as const, record: aborted };
    }
    const blocked = { ...r, status: 'RECOVERY_REQUIRED' as const, updatedAt: new Date().toISOString(), evidence: [...r.evidence, 'recovery:ambiguous-filesystem-state'] };
    await save(blocked, currentVersion); return { action: 'RECOVERY_REQUIRED' as const, record: blocked };
  } finally {
    await releaseDurableLock(lockKey(r.projectId), owner).catch(() => undefined);
    if (recoveryLease) {
      const lease = await inspectMissionWorker(r.missionId);
      if (lease.status === 'ACTIVE' && lease.lease?.workerId === r.workerId && lease.lease?.leaseId === r.leaseId) {
        const { releaseMissionWorker } = await import('./missionWorkerSupervisor.ts');
        await releaseMissionWorker(r.missionId, r.workerId).catch(() => undefined);
      }
    }
  }
}
