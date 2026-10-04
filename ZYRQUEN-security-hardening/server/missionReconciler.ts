import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { appendMissionEvent, createRecoveryRecord, listMissionEvents, verifyMissionEventJournal } from './durableStore.ts';
import { commitMissionTransaction, loadMissionTransaction, type MissionTransaction } from './transactionalRecovery.ts';
import { loadWorkspaceEffect, recoverWorkspaceEffect, type WorkspaceEffect } from './transactionalWorkspace.ts';

export type ReconciliationAction =
  | 'NO_ACTION'
  | 'FINALIZED_COMMIT'
  | 'ABORTED_STAGED_EFFECT'
  | 'RECOVERY_RECORDED'
  | 'JOURNAL_BLOCKED';

export interface ReconciliationItem {
  transactionId: string;
  missionId: string;
  transactionStatus: MissionTransaction['status'];
  effectStatus?: WorkspaceEffect['status'];
  action: ReconciliationAction;
  reason: string;
  evidence: string[];
}

export interface ReconciliationReport {
  startedAt: string;
  completedAt: string;
  scannedTransactions: number;
  reconciled: number;
  blocked: number;
  items: ReconciliationItem[];
}

const safe = (value: string) => {
  const x = String(value || '').trim();
  if (!x || x.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_RECONCILER_KEY');
  return x;
};

const DATA_ROOT = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));

async function listTransactionIds(limit = 500) {
  const dir = path.join(DATA_ROOT, 'transaction');
  try {
    const names = await fs.readdir(dir);
    return names.filter((name) => name.endsWith('.json')).slice(-Math.min(Math.max(limit, 1), 500)).map((name) => name.slice(0, -5));
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function reconcileOne(transactionId: string): Promise<ReconciliationItem | null> {
  const id = safe(transactionId);
  const record = await loadMissionTransaction(id);
  if (!record) return null;
  const tx = record.payload;
  const evidence: string[] = [`transaction:${tx.transactionId}`, `status:${tx.status}`];

  const verification = await verifyMissionEventJournal(tx.missionId);
  if (!verification.valid) {
    const recovery = await createRecoveryRecord({
      missionId: tx.missionId,
      status: 'BLOCKED',
      reason: `JOURNAL_${verification.firstFailure?.reason || 'INTEGRITY_FAILED'}`,
      lastEventSequence: verification.count,
      lastEventHash: verification.lastHash,
      recommendedAction: 'MANUAL_REVIEW',
    });
    await appendMissionEvent({
      eventId: `reconcile:${id}:journal-blocked`,
      missionId: tx.missionId,
      type: 'MISSION_RECONCILIATION_BLOCKED',
      timestamp: new Date().toISOString(),
      status: 'BLOCKED',
      summary: `Reconciliation blocked by journal integrity failure for ${id}`,
      evidence: [verification.firstFailure?.reason || 'INTEGRITY_FAILED', `recovery:${recovery.payload.recoveryId}`],
      metadata: { transactionId: id },
    }).catch(() => undefined);
    return { transactionId: id, missionId: tx.missionId, transactionStatus: tx.status, action: 'JOURNAL_BLOCKED', reason: verification.firstFailure?.reason || 'INTEGRITY_FAILED', evidence: [verification.firstFailure?.reason || 'INTEGRITY_FAILED'] };
  }

  if (tx.status === 'COMMITTED' || tx.status === 'ABORTED') {
    return { transactionId: id, missionId: tx.missionId, transactionStatus: tx.status, action: 'NO_ACTION', reason: 'TERMINAL_TRANSACTION', evidence };
  }

  const effect = await loadWorkspaceEffect(`effect-${crypto.createHash('sha256').update(id).digest('hex').slice(0,40)}`);
  // The effect helper uses the transaction hash-derived key; recoverWorkspaceEffect is authoritative.
  if (effect?.payload.status === 'APPLIED') {
    const committed = await commitMissionTransaction(id, effect.payload.evidence || [`workspace-effect:${effect.payload.effectId}`]);
    evidence.push(`effect:${effect.payload.effectId}`, 'workspace-effect:APPLIED');
    return { transactionId: id, missionId: tx.missionId, transactionStatus: committed.transaction.status, effectStatus: effect.payload.status, action: 'FINALIZED_COMMIT', reason: 'APPLIED_EFFECT_FINALIZED', evidence };
  }

  if (effect?.payload.status === 'STAGED') {
    const recovered = await recoverWorkspaceEffect(id);
    evidence.push(`effect:${effect.payload.effectId}`, 'workspace-effect:STAGED');
    return { transactionId: id, missionId: tx.missionId, transactionStatus: 'ABORTED', effectStatus: effect.payload.status, action: recovered.action === 'ABORTED_STAGED_EFFECT' ? recovered.action : 'RECOVERY_RECORDED', reason: 'STAGED_EFFECT_ABORTED', evidence };
  }

  const recovery = await createRecoveryRecord({
    missionId: tx.missionId,
    status: 'DETECTED',
    reason: 'PREPARED_TRANSACTION_WITHOUT_EFFECT',
    lastEventSequence: verification.count,
    lastEventHash: verification.lastHash,
    recommendedAction: 'MANUAL_REVIEW',
  });
  await appendMissionEvent({
    eventId: `reconcile:${id}:prepared-without-effect`,
    missionId: tx.missionId,
    type: 'MISSION_RECONCILIATION_DETECTED',
    timestamp: new Date().toISOString(),
    status: 'DETECTED',
    summary: `Prepared transaction ${id} has no workspace effect`,
    evidence: [`recovery:${recovery.payload.recoveryId}`],
    metadata: { transactionId: id },
  });
  return { transactionId: id, missionId: tx.missionId, transactionStatus: tx.status, action: 'RECOVERY_RECORDED', reason: 'PREPARED_TRANSACTION_WITHOUT_EFFECT', evidence: [`recovery:${recovery.payload.recoveryId}`] };
}

export async function reconcileMissionTransactions(limit = 500): Promise<ReconciliationReport> {
  const startedAt = new Date().toISOString();
  const ids = await listTransactionIds(limit);
  const items: ReconciliationItem[] = [];
  for (const id of ids) {
    const result = await reconcileOne(id);
    if (result) items.push(result);
  }
  const completedAt = new Date().toISOString();
  return {
    startedAt,
    completedAt,
    scannedTransactions: ids.length,
    reconciled: items.filter((item) => item.action !== 'NO_ACTION').length,
    blocked: items.filter((item) => item.action === 'JOURNAL_BLOCKED').length,
    items,
  };
}

export async function reconcileMission(missionId: string) {
  const safeMission = safe(missionId);
  const events = await listMissionEvents(safeMission, 500);
  const verification = await verifyMissionEventJournal(safeMission);
  const transactionIds = [...new Set(events.map((event) => String(event.metadata?.transactionId || '')).filter(Boolean))];
  const items: ReconciliationItem[] = [];
  for (const id of transactionIds) {
    const result = await reconcileOne(id);
    if (result) items.push(result);
  }
  return { missionId: safeMission, verification, eventCount: events.length, items };
}
