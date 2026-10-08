import crypto from 'crypto';
import {
  acquireDurableLock,
  releaseDurableLock,
  loadDurableRecord,
  saveDurableRecord,
  appendMissionEvent,
  type DurableEnvelope,
} from './durableStore.ts';
import { assertMissionWorkerFence, type MissionWorkerLease } from './missionWorkerSupervisor.ts';
import { loadMissionTransaction, commitMissionTransaction, type MissionTransaction } from './transactionalRecovery.ts';
import { applyFencedPreparedWorkspaceTransaction, loadWorkspaceEffect, type WorkspaceEffect } from './transactionalWorkspace.ts';

export type AtomicCommitStatus = 'PREPARED' | 'APPLIED' | 'COMMITTED' | 'ABORTED';
export interface AtomicWorkspaceCommit {
  commitId: string;
  transactionId: string;
  missionId: string;
  projectId: string;
  workerId: string;
  leaseId: string;
  fencingToken: string;
  status: AtomicCommitStatus;
  expectedWorkspaceVersion: number;
  resultWorkspaceVersion?: number;
  effectId: string;
  createdAt: string;
  updatedAt: string;
  evidence: string[];
}

const safe = (v: string) => { const x = String(v || '').trim(); if (!x || x.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_ATOMIC_COMMIT_KEY'); return x; };
const commitIdFor = (transactionId: string) => `commit-${crypto.createHash('sha256').update(transactionId).digest('hex').slice(0, 40)}`;
const effectIdFor = (transactionId: string) => `effect-${crypto.createHash('sha256').update(transactionId).digest('hex').slice(0, 40)}`;
const missionLock = (missionId: string) => `txn-mission-${safe(missionId)}`;
const workspaceLock = (projectId: string) => `txn-workspace-${safe(projectId)}`;
const ownerFor = (workerId: string, leaseId: string) => `${safe(workerId)}-${safe(leaseId)}`;

export async function loadAtomicWorkspaceCommit(commitId: string): Promise<DurableEnvelope<AtomicWorkspaceCommit> | null> {
  return loadDurableRecord<AtomicWorkspaceCommit>('transaction-commit' as any, safe(commitId));
}

async function saveCommit(commit: AtomicWorkspaceCommit, version?: number) {
  return saveDurableRecord('transaction-commit' as any, commit.commitId, commit, version || 1);
}

export async function executeAtomicWorkspaceCommit(input: {
  transactionId: string;
  projectId: string;
  files: Array<{ id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }>;
  fence: { workerId: string; leaseId: string };
  faultInjection?: 'AFTER_PREPARED' | 'AFTER_STAGED' | 'AFTER_APPLIED' | 'BEFORE_FINAL_COMMIT' | 'AFTER_TRANSACTION_COMMIT';
}) {
  const txRecord = await loadMissionTransaction(safe(input.transactionId));
  if (!txRecord) throw new Error('TRANSACTION_NOT_FOUND');
  const tx = txRecord.payload;
  if (tx.status === 'ABORTED') throw new Error('TRANSACTION_ALREADY_ABORTED');
  if (tx.status === 'COMMITTED') return { status: 'COMMITTED' as const, reused: true, transaction: tx };

  const commitId = commitIdFor(tx.transactionId);
  const existing = await loadAtomicWorkspaceCommit(commitId);
  if (existing?.payload.status === 'COMMITTED') return { status: 'COMMITTED' as const, reused: true, commit: existing.payload, transaction: tx };

  await assertMissionWorkerFence(tx.missionId, input.fence.workerId, input.fence.leaseId);
  const owner = ownerFor(input.fence.workerId, input.fence.leaseId);
  const missionLockRecord = await acquireDurableLock(missionLock(tx.missionId), owner, 30000);
  let workspaceLockRecord;
  try {
    workspaceLockRecord = await acquireDurableLock(workspaceLock(input.projectId), owner, 30000);
    await assertMissionWorkerFence(tx.missionId, input.fence.workerId, input.fence.leaseId);

    const workspace = await import('./durableStore.ts').then(m => m.loadWorkspace(safe(input.projectId)));
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
    const now = new Date().toISOString();
    const prepared: AtomicWorkspaceCommit = {
      commitId,
      transactionId: tx.transactionId,
      missionId: tx.missionId,
      projectId: safe(input.projectId),
      workerId: input.fence.workerId,
      leaseId: input.fence.leaseId,
      fencingToken: (await assertMissionWorkerFence(tx.missionId, input.fence.workerId, input.fence.leaseId)).fencingToken,
      status: 'PREPARED',
      expectedWorkspaceVersion: workspace.version,
      effectId: effectIdFor(tx.transactionId),
      createdAt: existing?.payload.createdAt || now,
      updatedAt: now,
      evidence: [`workspace-version:${workspace.version}`, `worker:${input.fence.workerId}`, `lease:${input.fence.leaseId}`],
    };
    const savedPrepared = await saveCommit(prepared, existing?.version || 1);
    await appendMissionEvent({ eventId: `${commitId}:prepared`, missionId: tx.missionId, type: 'ATOMIC_WORKSPACE_COMMIT_PREPARED', timestamp: now, status: 'PREPARED', summary: 'Atomic workspace commit prepared under mission and workspace locks', evidence: prepared.evidence, metadata: { commitId, transactionId: tx.transactionId, projectId: prepared.projectId } });
    if (input.faultInjection === 'AFTER_PREPARED') throw new Error('SIMULATED_CRASH_AFTER_PREPARED');

    const result = await applyFencedPreparedWorkspaceTransaction({
      transactionId: tx.transactionId,
      projectId: input.projectId,
      files: input.files,
      fence: input.fence,
      faultInjection: input.faultInjection === 'AFTER_STAGED' || input.faultInjection === 'AFTER_APPLIED' ? input.faultInjection : undefined,
      deferTransactionCommit: true,
      onPhase: async phase => {
        if (phase === 'BEFORE_WRITE') {
          await assertMissionWorkerFence(tx.missionId, input.fence.workerId, input.fence.leaseId);
        }
      },
    });

    const effect = await loadWorkspaceEffect(prepared.effectId);
    if (effect?.payload.status === 'APPLIED') {
      const applied: AtomicWorkspaceCommit = { ...savedPrepared.payload, status: 'APPLIED', updatedAt: new Date().toISOString(), resultWorkspaceVersion: effect.payload.resultVersion, evidence: [...savedPrepared.payload.evidence, ...(effect.payload.evidence || [])] };
      const savedApplied = await saveCommit(applied, savedPrepared.version);
      await appendMissionEvent({ eventId: `${commitId}:applied`, missionId: tx.missionId, type: 'ATOMIC_WORKSPACE_COMMIT_APPLIED', timestamp: applied.updatedAt, status: 'APPLIED', summary: 'Workspace side effect applied under coordinator locks', evidence: applied.evidence, metadata: { commitId, effectId: effect.payload.effectId, resultWorkspaceVersion: effect.payload.resultVersion } });
      if (input.faultInjection === 'AFTER_APPLIED') throw new Error('SIMULATED_CRASH_AFTER_APPLIED');
      await assertMissionWorkerFence(tx.missionId, input.fence.workerId, input.fence.leaseId);
      if (input.faultInjection === 'BEFORE_FINAL_COMMIT') throw new Error('SIMULATED_CRASH_BEFORE_FINAL_COMMIT');
      const committedTx = result.status === 'COMMITTED' ? result.transaction : (await commitMissionTransaction(tx.transactionId, applied.evidence)).transaction;
      if (input.faultInjection === 'AFTER_TRANSACTION_COMMIT') throw new Error('SIMULATED_CRASH_AFTER_TRANSACTION_COMMIT');
      const committed: AtomicWorkspaceCommit = { ...savedApplied.payload, status: 'COMMITTED', updatedAt: new Date().toISOString(), evidence: [...savedApplied.payload.evidence, `transaction:${committedTx.transactionId}`] };
      await saveCommit(committed, savedApplied.version);
      await appendMissionEvent({ eventId: `${commitId}:committed`, missionId: tx.missionId, type: 'ATOMIC_WORKSPACE_COMMIT_COMMITTED', timestamp: committed.updatedAt, status: 'COMMITTED', summary: 'Atomic workspace commit finalized', evidence: committed.evidence, metadata: { commitId, transactionId: tx.transactionId } });
      return { status: 'COMMITTED' as const, reused: false, commit: committed, effect: effect.payload, transaction: committedTx };
    }
    return result;
  } catch (error) {
    const current = await loadAtomicWorkspaceCommit(commitId).catch(() => undefined);
    if (current?.payload.status === 'PREPARED') {
      const effect = await loadWorkspaceEffect(effectIdFor(tx.transactionId)).catch(() => undefined);
      if (!effect) {
        const aborted: AtomicWorkspaceCommit = { ...current.payload, status: 'ABORTED', updatedAt: new Date().toISOString(), evidence: [...current.payload.evidence, `error:${error instanceof Error ? error.message : String(error)}`] };
        await saveCommit(aborted, current.version).catch(() => undefined);
      }
    }
    throw error;
  } finally {
    await releaseDurableLock(workspaceLock(input.projectId), owner).catch(() => undefined);
    await releaseDurableLock(missionLock(tx.missionId), owner).catch(() => undefined);
  }
}

export async function recoverAtomicWorkspaceCommit(transactionId: string) {
  const id = safe(transactionId);
  const commit = await loadAtomicWorkspaceCommit(commitIdFor(id));
  const tx = await loadMissionTransaction(id);
  if (!commit || !tx) return { action: 'NO_ACTION' as const };

  const effect = await loadWorkspaceEffect(commit.payload.effectId);

  // Crash after transaction commit but before coordinator commit: the durable
  // transaction is authoritative evidence that final commit already happened.
  if (tx.payload.status === 'COMMITTED' && commit.payload.status !== 'COMMITTED') {
    const updated: AtomicWorkspaceCommit = {
      ...commit.payload,
      status: 'COMMITTED',
      updatedAt: new Date().toISOString(),
      resultWorkspaceVersion: effect?.payload.resultVersion ?? commit.payload.resultWorkspaceVersion,
      evidence: [...commit.payload.evidence, 'recovery:transaction-already-committed'],
    };
    await saveCommit(updated, commit.version);
    await appendMissionEvent({
      eventId: `${commit.payload.commitId}:recovered-committed`,
      missionId: tx.payload.missionId,
      type: 'ATOMIC_WORKSPACE_COMMIT_RECOVERED',
      timestamp: updated.updatedAt,
      status: 'COMMITTED',
      summary: 'Coordinator finalized from already-committed transaction evidence',
      evidence: updated.evidence,
      metadata: { commitId: updated.commitId, transactionId: id, source: 'transaction-terminal' },
    });
    return { action: 'FINALIZED_COORDINATOR' as const, commit: updated, transaction: tx.payload, effect: effect?.payload };
  }

  if (commit.payload.status === 'COMMITTED') return { action: 'NO_ACTION' as const, commit: commit.payload, transaction: tx.payload, effect: effect?.payload };

  if (effect?.payload.status === 'APPLIED' && tx.payload.status === 'PREPARED') {
    const committed = await commitMissionTransaction(id, effect.payload.evidence || commit.payload.evidence);
    const updated: AtomicWorkspaceCommit = { ...commit.payload, status: 'COMMITTED', updatedAt: new Date().toISOString(), resultWorkspaceVersion: effect.payload.resultVersion, evidence: [...commit.payload.evidence, 'recovery:finalized'] };
    await saveCommit(updated, commit.version);
    await appendMissionEvent({ eventId: `${commit.payload.commitId}:recovered-finalized`, missionId: tx.payload.missionId, type: 'ATOMIC_WORKSPACE_COMMIT_RECOVERED', timestamp: updated.updatedAt, status: 'COMMITTED', summary: 'APPLIED workspace effect finalized deterministically during recovery', evidence: updated.evidence, metadata: { commitId: updated.commitId, transactionId: id, source: 'applied-effect' } });
    return { action: 'FINALIZED_COMMIT' as const, commit: updated, transaction: committed.transaction, effect: effect.payload };
  }

  // A prepared coordinator with only a staged effect is known not to have
  // produced the workspace side effect. Abort rather than guessing a commit.
  if (commit.payload.status === 'PREPARED' && effect?.payload.status === 'STAGED') {
    const abortedTx = await import('./transactionalRecovery.ts').then(m => m.abortMissionTransaction(id, 'CRASH_RECOVERY_STAGED_EFFECT_NOT_APPLIED'));
    const updated: AtomicWorkspaceCommit = { ...commit.payload, status: 'ABORTED', updatedAt: new Date().toISOString(), evidence: [...commit.payload.evidence, 'recovery:staged-effect-aborted'] };
    await saveCommit(updated, commit.version);
    return { action: 'ABORTED_STAGED' as const, commit: updated, transaction: abortedTx.transaction, effect: effect.payload };
  }

  if (commit.payload.status === 'ABORTED') return { action: 'ABORTED' as const, commit: commit.payload, transaction: tx.payload, effect: effect?.payload };
  return { action: 'RECOVERY_REQUIRED' as const, commit: commit.payload, transaction: tx.payload, effect: effect?.payload };
}

export async function inspectAtomicRecovery(transactionId: string) {
  const id = safe(transactionId);
  const commit = await loadAtomicWorkspaceCommit(commitIdFor(id));
  const tx = await loadMissionTransaction(id);
  const effect = commit ? await loadWorkspaceEffect(commit.payload.effectId) : null;
  if (!commit || !tx) return { state: 'MISSING' as const, transaction: tx?.payload, commit: commit?.payload, effect: effect?.payload };
  if (tx.payload.status === 'COMMITTED' && commit.payload.status === 'COMMITTED') return { state: 'COMMITTED' as const, transaction: tx.payload, commit: commit.payload, effect: effect?.payload };
  if (tx.payload.status === 'COMMITTED') return { state: 'COMMITTED_COORDINATOR_PENDING' as const, transaction: tx.payload, commit: commit.payload, effect: effect?.payload };
  if (commit.payload.status === 'ABORTED') return { state: 'ABORTED' as const, transaction: tx.payload, commit: commit.payload, effect: effect?.payload };
  if (effect?.payload.status === 'APPLIED') return { state: 'APPLIED_PENDING_COMMIT' as const, transaction: tx.payload, commit: commit.payload, effect: effect.payload };
  if (effect?.payload.status === 'STAGED') return { state: 'STAGED_NOT_APPLIED' as const, transaction: tx.payload, commit: commit.payload, effect: effect.payload };
  return { state: 'PREPARED_NO_EFFECT' as const, transaction: tx.payload, commit: commit.payload };
}
