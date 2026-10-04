import fs from 'node:fs/promises';
import path from 'node:path';
import {
  acquireDurableLock,
  releaseDurableLock,
  loadDurableRecord,
  verifyMissionEventJournal,
  type DurableEnvelope,
} from './durableStore.ts';
import { inspectAtomicRecovery, recoverAtomicWorkspaceCommit, type AtomicWorkspaceCommit } from './atomicWorkspaceCommit.ts';
import {
  acquireMissionWorker,
  assertMissionWorkerFence,
  inspectMissionWorker,
  releaseMissionWorker,
  type MissionWorkerLease,
} from './missionWorkerSupervisor.ts';

const DATA_ROOT = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const safe = (v: string) => { const x = String(v || '').trim(); if (!x || x.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_RECOVERY_KEY'); return x; };
const commitPath = () => path.join(DATA_ROOT, 'transaction-commit');
const missionLock = (missionId: string) => `txn-mission-${safe(missionId)}`;
const workspaceLock = (projectId: string) => `txn-workspace-${safe(projectId)}`;

export type RecoverySweepItem = {
  commitId: string;
  transactionId: string;
  missionId: string;
  projectId: string;
  state: string;
  action: 'RECOVERED' | 'SKIPPED' | 'BLOCKED' | 'NO_ACTION';
  reason: string;
  evidence: string[];
};

export type RecoverySweepReport = {
  startedAt: string;
  completedAt: string;
  scanned: number;
  recovered: number;
  skipped: number;
  blocked: number;
  items: RecoverySweepItem[];
};

async function listCommitIds(limit: number) {
  try {
    const names = await fs.readdir(commitPath());
    return names.filter(n => n.endsWith('.json')).sort().slice(0, Math.min(Math.max(limit, 1), 1000)).map(n => n.slice(0, -5));
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function loadCommit(id: string): Promise<DurableEnvelope<AtomicWorkspaceCommit> | null> {
  return loadDurableRecord<AtomicWorkspaceCommit>('transaction-commit' as any, safe(id));
}

async function acquireRecoveryFence(missionId: string, commitId: string): Promise<{ lease: MissionWorkerLease; owned: boolean }> {
  const inspected = await inspectMissionWorker(missionId);
  if (inspected.status === 'ACTIVE' && inspected.lease) {
    await assertMissionWorkerFence(missionId, inspected.lease.workerId, inspected.lease.leaseId);
    return { lease: inspected.lease, owned: false };
  }
  const workerId = `recovery-sweep-${safe(commitId).slice(0, 48)}`;
  const lease = await acquireMissionWorker(missionId, workerId, 30000);
  await assertMissionWorkerFence(missionId, lease.workerId, lease.leaseId);
  return { lease, owned: true };
}

export async function sweepDurableTransactionRecovery(limit = 500): Promise<RecoverySweepReport> {
  const startedAt = new Date().toISOString();
  const ids = await listCommitIds(limit);
  const items: RecoverySweepItem[] = [];

  for (const commitId of ids) {
    const record = await loadCommit(commitId);
    if (!record) continue;
    const commit = record.payload;
    const inspected = await inspectAtomicRecovery(commit.transactionId);
    const base = {
      commitId: commit.commitId,
      transactionId: commit.transactionId,
      missionId: commit.missionId,
      projectId: commit.projectId,
      state: inspected.state,
    };
    if (!['STAGED_NOT_APPLIED', 'APPLIED_PENDING_COMMIT', 'COMMITTED_COORDINATOR_PENDING'].includes(inspected.state)) {
      items.push({ ...base, action: inspected.state === 'COMMITTED' || inspected.state === 'ABORTED' ? 'NO_ACTION' : 'SKIPPED', reason: 'NO_RECOVERABLE_STATE', evidence: [] });
      continue;
    }

    const journal = await verifyMissionEventJournal(commit.missionId);
    if (!journal.valid) {
      items.push({ ...base, action: 'BLOCKED', reason: `JOURNAL_${journal.firstFailure?.reason || 'INTEGRITY_FAILED'}`, evidence: [`sequence:${journal.firstFailure?.sequence || 0}`] });
      continue;
    }

    let fence: { lease: MissionWorkerLease; owned: boolean } | undefined;
    let missionLockRecord: Awaited<ReturnType<typeof acquireDurableLock>> | undefined;
    let workspaceLockRecord: Awaited<ReturnType<typeof acquireDurableLock>> | undefined;
    try {
      fence = await acquireRecoveryFence(commit.missionId, commit.commitId);
      await assertMissionWorkerFence(commit.missionId, fence.lease.workerId, fence.lease.leaseId);
      const owner = `${fence.lease.workerId}-${fence.lease.leaseId}`;
      missionLockRecord = await acquireDurableLock(missionLock(commit.missionId), owner, 30000);
      workspaceLockRecord = await acquireDurableLock(workspaceLock(commit.projectId), owner, 30000);
      await assertMissionWorkerFence(commit.missionId, fence.lease.workerId, fence.lease.leaseId);

      const result = await recoverAtomicWorkspaceCommit(commit.transactionId);
      items.push({ ...base, action: result.action === 'NO_ACTION' ? 'NO_ACTION' : 'RECOVERED', reason: result.action, evidence: [`journalEvents:${journal.count}`, `worker:${fence.lease.workerId}`, `lease:${fence.lease.leaseId}`] });
    } catch (error) {
      items.push({ ...base, action: 'BLOCKED', reason: error instanceof Error ? error.message : String(error), evidence: [`journalEvents:${journal.count}`] });
    } finally {
      const owner = fence ? `${fence.lease.workerId}-${fence.lease.leaseId}` : undefined;
      if (owner) {
        if (workspaceLockRecord) await releaseDurableLock(workspaceLock(commit.projectId), owner).catch(() => undefined);
        if (missionLockRecord) await releaseDurableLock(missionLock(commit.missionId), owner).catch(() => undefined);
        if (fence?.owned) await releaseMissionWorker(commit.missionId, fence.lease.workerId).catch(() => undefined);
      }
    }
  }

  const completedAt = new Date().toISOString();
  return {
    startedAt,
    completedAt,
    scanned: items.length,
    recovered: items.filter(i => i.action === 'RECOVERED').length,
    skipped: items.filter(i => i.action === 'SKIPPED' || i.action === 'NO_ACTION').length,
    blocked: items.filter(i => i.action === 'BLOCKED').length,
    items,
  };
}
