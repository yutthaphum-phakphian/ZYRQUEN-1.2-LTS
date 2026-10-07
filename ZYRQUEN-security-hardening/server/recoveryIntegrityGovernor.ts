import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { listMissionEvents, verifyMissionEventJournal, listDurableRecordIds, loadDurableRecord } from './durableStore.ts';
import { loadRepairCoordinator, type RepairCoordinatorRecord } from './crashConsistentRepairCoordinator.ts';
import { loadMissionTransaction } from './transactionalRecovery.ts';

export type IntegrityVerdict = 'HEALTHY' | 'RECOVERY_REQUIRED' | 'CORRUPT';
export interface IntegrityFinding { code: string; severity: 'INFO'|'WARN'|'CRITICAL'; detail: string; }
export interface RecoveryIntegrityReport {
  repairId: string;
  missionId: string;
  verdict: IntegrityVerdict;
  repairStatus?: RepairCoordinatorRecord['status'];
  transactionStatus?: string;
  journalValid: boolean;
  findings: IntegrityFinding[];
  checkedAt: string;
  auditHash: string;
}

const sha = (value: unknown) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const safe = (value: string) => { const v = String(value || '').trim(); if (!v || v.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_INTEGRITY_KEY'); return v; };

async function snapshot(root: string, target: string) {
  const normalized = target.replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) throw new Error('INVALID_INTEGRITY_TARGET');
  const absolute = path.resolve(root, normalized);
  const rel = path.relative(path.resolve(root), absolute);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('INTEGRITY_TARGET_OUTSIDE_WORKSPACE');
  try { const content = await fs.readFile(absolute, 'utf8'); return { existed: true, hash: sha(content) }; }
  catch (e: any) { if (e?.code === 'ENOENT') return { existed: false, hash: sha('') }; throw e; }
}

async function checkSnapshot(root: string, expected: { target: string; existed: boolean; hash: string }) {
  const actual = await snapshot(root, expected.target);
  return actual.existed === expected.existed && actual.hash === expected.hash;
}

export async function inspectRepairIntegrity(repairId: string): Promise<RecoveryIntegrityReport> {
  const id = safe(repairId);
  const envelope = await loadRepairCoordinator(id);
  if (!envelope) throw new Error('REPAIR_NOT_FOUND');
  const r = envelope.payload;
  const findings: IntegrityFinding[] = [];
  const journal = await verifyMissionEventJournal(r.missionId);
  const tx = await loadMissionTransaction(r.transactionId);

  if (!journal.valid) findings.push({ code: 'MISSION_JOURNAL_INVALID', severity: 'CRITICAL', detail: journal.firstFailure?.reason || 'UNKNOWN' });
  if (!tx) findings.push({ code: 'TRANSACTION_MISSING', severity: 'CRITICAL', detail: r.transactionId });
  else if (tx.payload.missionId !== r.missionId) findings.push({ code: 'TRANSACTION_MISSION_MISMATCH', severity: 'CRITICAL', detail: tx.payload.missionId });

  if (r.status === 'COMMITTED' && tx?.payload.status !== 'COMMITTED') findings.push({ code: 'COMMITTED_WITHOUT_TRANSACTION', severity: 'CRITICAL', detail: `${r.status}/${tx?.payload.status || 'MISSING'}` });
  if (r.status === 'ABORTED' && tx?.payload.status === 'COMMITTED') findings.push({ code: 'ABORTED_AFTER_COMMIT', severity: 'CRITICAL', detail: r.transactionId });

  let beforeMatches = false;
  let desiredMatches = false;
  try {
    beforeMatches = (await Promise.all(r.before.map(s => checkSnapshot(r.workspaceRoot, s)))).every(Boolean);
    desiredMatches = (await Promise.all(r.desired.map(s => checkSnapshot(r.workspaceRoot, s)))).every(Boolean);
  } catch (error) {
    findings.push({ code: 'WORKSPACE_INSPECTION_FAILED', severity: 'CRITICAL', detail: error instanceof Error ? error.message : String(error) });
  }

  if (r.status === 'COMMITTED' && !desiredMatches) findings.push({ code: 'COMMITTED_WORKSPACE_DRIFT', severity: 'CRITICAL', detail: 'Workspace does not match desired state' });
  if (r.status === 'ABORTED' && !beforeMatches) findings.push({ code: 'ABORTED_WORKSPACE_DRIFT', severity: 'CRITICAL', detail: 'Workspace does not match before-image' });
  if (r.status === 'RECOVERY_REQUIRED' && !beforeMatches && !desiredMatches) findings.push({ code: 'AMBIGUOUS_WORKSPACE_STATE', severity: 'CRITICAL', detail: 'Workspace matches neither before nor desired state' });

  const terminal = new Set(['COMMITTED', 'ABORTED']);
  const verdict: IntegrityVerdict = findings.some(f => f.severity === 'CRITICAL') ? 'CORRUPT' : terminal.has(r.status) ? 'HEALTHY' : 'RECOVERY_REQUIRED';
  if (verdict === 'RECOVERY_REQUIRED') findings.push({ code: 'NON_TERMINAL_REPAIR', severity: 'WARN', detail: `Repair remains ${r.status}` });
  const reportBase = { repairId: id, missionId: r.missionId, verdict, repairStatus: r.status, transactionStatus: tx?.payload.status, journalValid: journal.valid, findings, checkedAt: new Date().toISOString() };
  return { ...reportBase, auditHash: sha(reportBase) };
}

export async function inspectRecentRecoveryIntegrity(limit = 50) {
  const ids = await listDurableRecordIds('repair-coordinator' as any, Math.min(Math.max(limit, 1), 100));
  const reports: RecoveryIntegrityReport[] = [];
  for (const raw of ids) { try { const envelope = await loadDurableRecord<RepairCoordinatorRecord>('repair-coordinator' as any, raw); if (envelope?.payload?.repairId) reports.push(await inspectRepairIntegrity(envelope.payload.repairId)); } catch { /* individual records are isolated from the sweep */ } }
  return { checked: reports.length, healthy: reports.filter(r => r.verdict === 'HEALTHY').length, recoveryRequired: reports.filter(r => r.verdict === 'RECOVERY_REQUIRED').length, corrupt: reports.filter(r => r.verdict === 'CORRUPT').length, reports };
}
