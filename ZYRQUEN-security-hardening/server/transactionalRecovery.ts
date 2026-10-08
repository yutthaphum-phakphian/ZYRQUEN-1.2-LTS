import crypto from 'crypto';
import { appendMissionEvent, createRecoveryRecord, loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import type { DurableEnvelope } from './durableStore.ts';

export type TransactionStatus = 'PREPARED' | 'COMMITTED' | 'ABORTED';

export interface TransactionOperation {
  id: string;
  type: string;
  target: string;
  expected?: string;
  metadata?: Record<string, unknown>;
}

export interface MissionTransaction {
  transactionId: string;
  missionId: string;
  idempotencyKey: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  operations: TransactionOperation[];
  commitEvidence?: string[];
  abortReason?: string;
}

const safeKey = (value: string) => {
  const v = String(value || '').trim();
  if (!v || v.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_TRANSACTION_KEY');
  return v;
};

export async function loadMissionTransaction(transactionId: string): Promise<DurableEnvelope<MissionTransaction> | null> {
  return loadDurableRecord<MissionTransaction>('transaction', safeKey(transactionId));
}

export async function prepareMissionTransaction(input: {
  missionId: string;
  idempotencyKey: string;
  operations: TransactionOperation[];
}) {
  const missionId = safeKey(input.missionId);
  const idempotencyKey = safeKey(input.idempotencyKey);
  if (!Array.isArray(input.operations) || input.operations.length === 0) throw new Error('TRANSACTION_OPERATIONS_REQUIRED');
  if (input.operations.length > 100) throw new Error('TRANSACTION_OPERATION_LIMIT');

  const transactionId = `txn-${crypto.createHash('sha256').update(`${missionId}:${idempotencyKey}`).digest('hex').slice(0, 40)}`;
  const existing = await loadMissionTransaction(transactionId);
  if (existing) return { transaction: existing.payload, reused: true };

  const now = new Date().toISOString();
  const transaction: MissionTransaction = {
    transactionId,
    missionId,
    idempotencyKey,
    status: 'PREPARED',
    createdAt: now,
    updatedAt: now,
    operations: input.operations.map((op, index) => ({
      id: safeKey(op.id || `op-${index + 1}`),
      type: String(op.type || 'UNKNOWN').slice(0, 80),
      target: String(op.target || '').slice(0, 512),
      expected: op.expected,
      metadata: op.metadata,
    })),
  };

  await saveDurableRecord('transaction', transactionId, transaction, 1);
  await appendMissionEvent({
    eventId: `${transactionId}:prepared`,
    missionId,
    type: 'TRANSACTION_PREPARED',
    timestamp: now,
    status: 'PREPARED',
    summary: `Prepared transaction ${transactionId}`,
    evidence: transaction.operations.map((op) => `${op.type}:${op.target}`).slice(0, 20),
    metadata: { transactionId, idempotencyKey },
  });
  return { transaction, reused: false };
}

export async function commitMissionTransaction(transactionId: string, evidence: string[] = []) {
  const id = safeKey(transactionId);
  const current = await loadMissionTransaction(id);
  if (!current) throw new Error('TRANSACTION_NOT_FOUND');
  if (current.payload.status === 'COMMITTED') return { transaction: current.payload, reused: true };
  if (current.payload.status === 'ABORTED') throw new Error('TRANSACTION_ALREADY_ABORTED');
  const updated: MissionTransaction = { ...current.payload, status: 'COMMITTED', updatedAt: new Date().toISOString(), commitEvidence: evidence.slice(0, 50).map(String) };
  await saveDurableRecord('transaction', id, updated, current.version);
  await appendMissionEvent({
    eventId: `${id}:committed`, missionId: updated.missionId, type: 'TRANSACTION_COMMITTED', timestamp: updated.updatedAt,
    status: 'COMMITTED', summary: `Committed transaction ${id}`, evidence: updated.commitEvidence, metadata: { transactionId: id, idempotencyKey: updated.idempotencyKey },
  });
  return { transaction: updated, reused: false };
}

export async function abortMissionTransaction(transactionId: string, reason: string) {
  const id = safeKey(transactionId);
  const current = await loadMissionTransaction(id);
  if (!current) throw new Error('TRANSACTION_NOT_FOUND');
  if (current.payload.status === 'ABORTED') return { transaction: current.payload, reused: true };
  if (current.payload.status === 'COMMITTED') throw new Error('TRANSACTION_ALREADY_COMMITTED');
  const updated: MissionTransaction = { ...current.payload, status: 'ABORTED', updatedAt: new Date().toISOString(), abortReason: String(reason || 'ABORTED').slice(0, 500) };
  await saveDurableRecord('transaction', id, updated, current.version);
  await appendMissionEvent({
    eventId: `${id}:aborted`, missionId: updated.missionId, type: 'TRANSACTION_ABORTED', timestamp: updated.updatedAt,
    status: 'ABORTED', summary: `Aborted transaction ${id}`, evidence: [updated.abortReason || 'ABORTED'], metadata: { transactionId: id, idempotencyKey: updated.idempotencyKey },
  });
  return { transaction: updated, reused: false };
}

export async function recoverPreparedTransaction(transactionId: string, reason = 'RECOVERY_REQUIRED') {
  const current = await loadMissionTransaction(transactionId);
  if (!current) throw new Error('TRANSACTION_NOT_FOUND');
  if (current.payload.status !== 'PREPARED') return { transaction: current.payload, action: 'NO_ACTION' as const };
  const recovery = await createRecoveryRecord({
    missionId: current.payload.missionId,
    status: 'DETECTED',
    reason: `TRANSACTION_${reason}`,
    lastEventSequence: 0,
    recommendedAction: 'MANUAL_REVIEW',
  });
  return { transaction: current.payload, action: 'RECOVERY_RECORDED' as const, recovery: recovery.payload };
}
