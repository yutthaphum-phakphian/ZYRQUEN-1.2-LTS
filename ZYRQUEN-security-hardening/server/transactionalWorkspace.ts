import crypto from 'crypto';
import { loadWorkspace, saveWorkspace, loadDurableRecord, saveDurableRecord, appendMissionEvent } from './durableStore.ts';
import { loadMissionTransaction, commitMissionTransaction, abortMissionTransaction, type MissionTransaction } from './transactionalRecovery.ts';
import { assertMissionWorkerFence } from './missionWorkerSupervisor.ts';

export type WorkspaceEffectStatus = 'STAGED' | 'APPLIED' | 'ROLLED_BACK';
export interface WorkspaceEffect {
  effectId: string;
  transactionId: string;
  missionId: string;
  status: WorkspaceEffectStatus;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  baseVersion: number;
  resultVersion?: number;
  operations: Array<{ id: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }>;
  evidence?: string[];
}

const safe = (v: string) => { const x=String(v||'').trim(); if(!x || x.length>160 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_EFFECT_KEY'); return x; };
const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const effectIdFor = (tx: string) => `effect-${crypto.createHash('sha256').update(tx).digest('hex').slice(0,40)}`;

export async function loadWorkspaceEffect(effectId: string) { return loadDurableRecord<WorkspaceEffect>('transaction-effect', safe(effectId)); }

export type WorkspaceMutationFence = { workerId: string; leaseId: string };
export type WorkspaceMutationPhase = 'BEFORE_STAGE'|'BEFORE_WRITE'|'AFTER_WRITE'|'BEFORE_COMMIT';

export interface FencedWorkspaceApplyInput {
  transactionId: string;
  projectId: string;
  files: Array<{ id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }>;
  fence: WorkspaceMutationFence;
  onPhase?: (phase: WorkspaceMutationPhase) => Promise<void> | void;
  faultInjection?: 'AFTER_STAGED' | 'AFTER_APPLIED';
  deferTransactionCommit?: boolean;
}

export async function applyPreparedWorkspaceTransaction(input: { transactionId: string; projectId: string; files: Array<{ id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }> }) {
  const txRecord = await loadMissionTransaction(safe(input.transactionId));
  if (!txRecord) throw new Error('TRANSACTION_NOT_FOUND');
  const tx: MissionTransaction = txRecord.payload;
  if (tx.status === 'ABORTED') throw new Error('TRANSACTION_ALREADY_ABORTED');
  if (tx.status === 'COMMITTED') return { status: 'COMMITTED', reused: true, transaction: tx };
  const projectId = safe(input.projectId);
  const existingEffect = await loadWorkspaceEffect(effectIdFor(tx.transactionId));
  if (existingEffect?.payload.status === 'APPLIED') return { status: 'APPLIED', reused: true, effect: existingEffect.payload };
  const workspace = await loadWorkspace(projectId);
  if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
  const operations = input.files.map((op, i) => ({ id: safe(op.id || `op-${i+1}`), type: op.type, target: normalizeTarget(op.target), content: op.content, language: op.language, expectedHash: op.expectedHash }));
  const byName = new Map(workspace.files.map(f => [f.name, f]));
  for (const op of operations) {
    const current = byName.get(op.target);
    if (op.expectedHash && hash(current?.content || '') !== op.expectedHash) throw new Error(`WORKSPACE_EXPECTATION_MISMATCH:${op.target}`);
    if ((op.type === 'UPDATE' || op.type === 'DELETE') && !current) throw new Error(`WORKSPACE_TARGET_NOT_FOUND:${op.target}`);
    if (op.type === 'CREATE' && current) throw new Error(`WORKSPACE_TARGET_EXISTS:${op.target}`);
  }
  const effect: WorkspaceEffect = { effectId: effectIdFor(tx.transactionId), transactionId: tx.transactionId, missionId: tx.missionId, status: 'STAGED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), projectId, baseVersion: workspace.version, operations };
  await saveDurableRecord('transaction-effect', effect.effectId, effect, 1);
  await appendMissionEvent({ eventId: `${effect.effectId}:staged`, missionId: tx.missionId, type: 'WORKSPACE_EFFECT_STAGED', timestamp: effect.updatedAt, status: 'STAGED', summary: `Staged workspace effect ${effect.effectId}`, evidence: operations.map(o => `${o.type}:${o.target}`).slice(0,20), metadata: { transactionId: tx.transactionId, projectId } });
  const nextFiles = workspace.files.map(f => ({...f}));
  for (const op of operations) {
    const idx = nextFiles.findIndex(f => f.name === op.target);
    if (op.type === 'DELETE') nextFiles.splice(idx, 1);
    else if (op.type === 'UPDATE') nextFiles[idx] = { ...nextFiles[idx], content: String(op.content ?? ''), language: op.language || nextFiles[idx].language, action: 'update' };
    else nextFiles.push({ name: op.target, content: String(op.content ?? ''), language: op.language || 'text', action: 'create' });
  }
  const saved = await saveWorkspace({ ...workspace, version: workspace.version, files: nextFiles, updatedAt: new Date().toISOString() });
  const applied: WorkspaceEffect = { ...effect, status: 'APPLIED', updatedAt: new Date().toISOString(), resultVersion: saved.version, evidence: [`workspace-version:${saved.version}`] };
  const currentEffectRecord = await loadWorkspaceEffect(effect.effectId);
  await saveDurableRecord('transaction-effect', effect.effectId, applied, currentEffectRecord?.version || 1);
  await appendMissionEvent({ eventId: `${effect.effectId}:applied`, missionId: tx.missionId, type: 'WORKSPACE_EFFECT_APPLIED', timestamp: applied.updatedAt, status: 'APPLIED', summary: `Applied workspace effect ${effect.effectId}`, evidence: applied.evidence, metadata: { transactionId: tx.transactionId, projectId, resultVersion: saved.version } });
  const committed = await commitMissionTransaction(tx.transactionId, [`workspace-effect:${effect.effectId}`, `workspace-version:${saved.version}`]);
  return { status: 'COMMITTED', reused: false, effect: applied, transaction: committed.transaction };
}

export async function applyFencedPreparedWorkspaceTransaction(input: FencedWorkspaceApplyInput) {
  const txRecord = await loadMissionTransaction(safe(input.transactionId));
  if (!txRecord) throw new Error('TRANSACTION_NOT_FOUND');
  const tx = txRecord.payload;
  if (tx.status === 'ABORTED') throw new Error('TRANSACTION_ALREADY_ABORTED');
  if (tx.status === 'COMMITTED') return { status: 'COMMITTED' as const, reused: true, transaction: tx };
  if (!tx.missionId) throw new Error('TRANSACTION_MISSION_INVALID');

  const fenceCheck = () => assertMissionWorkerFence(tx.missionId, input.fence.workerId, input.fence.leaseId);
  await fenceCheck();
  await input.onPhase?.('BEFORE_STAGE');
  await fenceCheck();

  const projectId = safe(input.projectId);
  const existingEffect = await loadWorkspaceEffect(effectIdFor(tx.transactionId));
  if (existingEffect?.payload.status === 'APPLIED') {
    await fenceCheck();
    return { status: 'APPLIED' as const, reused: true, effect: existingEffect.payload };
  }
  const workspace = await loadWorkspace(projectId);
  if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
  const operations = input.files.map((op, i) => ({ id: safe(op.id || `op-${i+1}`), type: op.type, target: normalizeTarget(op.target), content: op.content, language: op.language, expectedHash: op.expectedHash }));
  const byName = new Map(workspace.files.map(f => [f.name, f]));
  for (const op of operations) {
    const current = byName.get(op.target);
    if (op.expectedHash && hash(current?.content || '') !== op.expectedHash) throw new Error(`WORKSPACE_EXPECTATION_MISMATCH:${op.target}`);
    if ((op.type === 'UPDATE' || op.type === 'DELETE') && !current) throw new Error(`WORKSPACE_TARGET_NOT_FOUND:${op.target}`);
    if (op.type === 'CREATE' && current) throw new Error(`WORKSPACE_TARGET_EXISTS:${op.target}`);
  }

  const effect: WorkspaceEffect = { effectId: effectIdFor(tx.transactionId), transactionId: tx.transactionId, missionId: tx.missionId, status: 'STAGED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), projectId, baseVersion: workspace.version, operations };
  await saveDurableRecord('transaction-effect', effect.effectId, effect, 1);
  await appendMissionEvent({ eventId: `${effect.effectId}:staged`, missionId: tx.missionId, type: 'WORKSPACE_EFFECT_STAGED', timestamp: effect.updatedAt, status: 'STAGED', summary: `Staged fenced workspace effect ${effect.effectId}`, evidence: operations.map(o => `${o.type}:${o.target}`).slice(0,20), metadata: { transactionId: tx.transactionId, projectId, workerId: input.fence.workerId, leaseId: input.fence.leaseId } });
  if (input.faultInjection === 'AFTER_STAGED') throw new Error('SIMULATED_CRASH_AFTER_STAGED');

  await fenceCheck();
  await input.onPhase?.('BEFORE_WRITE');
  await fenceCheck();
  const nextFiles = workspace.files.map(f => ({...f}));
  for (const op of operations) {
    const idx = nextFiles.findIndex(f => f.name === op.target);
    if (op.type === 'DELETE') nextFiles.splice(idx, 1);
    else if (op.type === 'UPDATE') nextFiles[idx] = { ...nextFiles[idx], content: String(op.content ?? ''), language: op.language || nextFiles[idx].language, action: 'update' };
    else nextFiles.push({ name: op.target, content: String(op.content ?? ''), language: op.language || 'text', action: 'create' });
  }
  const saved = await saveWorkspace({ ...workspace, version: workspace.version, files: nextFiles, updatedAt: new Date().toISOString() });
  await input.onPhase?.('AFTER_WRITE');

  // The workspace side effect is now real. Persist APPLIED evidence before any
  // further fence assertion so recovery can deterministically distinguish
  // 'written but not committed' from 'never written'.
  const applied: WorkspaceEffect = { ...effect, status: 'APPLIED', updatedAt: new Date().toISOString(), resultVersion: saved.version, evidence: [`workspace-version:${saved.version}`, `worker:${input.fence.workerId}`, `lease:${input.fence.leaseId}`] };
  const currentEffectRecord = await loadWorkspaceEffect(effect.effectId);
  await saveDurableRecord('transaction-effect', effect.effectId, applied, currentEffectRecord?.version || 1);
  await appendMissionEvent({ eventId: `${effect.effectId}:applied`, missionId: tx.missionId, type: 'WORKSPACE_EFFECT_APPLIED', timestamp: applied.updatedAt, status: 'APPLIED', summary: `Applied fenced workspace effect ${effect.effectId}`, evidence: applied.evidence, metadata: { transactionId: tx.transactionId, projectId, resultVersion: saved.version, workerId: input.fence.workerId, leaseId: input.fence.leaseId } });
  if (input.faultInjection === 'AFTER_APPLIED') throw new Error('SIMULATED_CRASH_AFTER_APPLIED');

  await fenceCheck();
  await input.onPhase?.('BEFORE_COMMIT');
  await fenceCheck();
  if (input.deferTransactionCommit) {
    return { status: 'APPLIED' as const, reused: false, effect: applied, transaction: tx };
  }
  const committed = await commitMissionTransaction(tx.transactionId, [`workspace-effect:${effect.effectId}`, `workspace-version:${saved.version}`, `worker:${input.fence.workerId}`, `lease:${input.fence.leaseId}`]);
  await appendMissionEvent({ eventId: `${effect.effectId}:fenced-committed`, missionId: tx.missionId, type: 'FENCED_WORKSPACE_TRANSACTION_COMMITTED', timestamp: new Date().toISOString(), status: 'COMMITTED', summary: 'Workspace transaction committed under active worker fence', evidence: [`transaction:${tx.transactionId}`, `worker:${input.fence.workerId}`, `lease:${input.fence.leaseId}`] });
  return { status: 'COMMITTED' as const, reused: false, effect: applied, transaction: committed.transaction };
}

export async function recoverWorkspaceEffect(transactionId: string) {
  const effect = await loadWorkspaceEffect(effectIdFor(safe(transactionId)));
  if (!effect) return { action: 'NO_EFFECT' as const };
  if (effect.payload.status === 'APPLIED') {
    const tx = await loadMissionTransaction(transactionId);
    if (tx?.payload.status === 'PREPARED') {
      const committed = await commitMissionTransaction(transactionId, effect.payload.evidence || [`workspace-effect:${effect.payload.effectId}`]);
      return { action: 'FINALIZED_COMMIT' as const, transaction: committed.transaction, effect: effect.payload };
    }
  }
  if (effect.payload.status === 'STAGED') {
    await abortMissionTransaction(transactionId, 'STAGED_EFFECT_NOT_APPLIED');
    return { action: 'ABORTED_STAGED_EFFECT' as const, effect: effect.payload };
  }
  return { action: 'NO_ACTION' as const, effect: effect.payload };
}

function normalizeTarget(target: string) {
  const x = String(target||'').replace(/\\/g,'/').replace(/^\.\//,'');
  if (!x || x.startsWith('/') || x.split('/').includes('..') || x.includes('\0')) throw new Error('PATH_TRAVERSAL_BLOCKED');
  return x;
}
