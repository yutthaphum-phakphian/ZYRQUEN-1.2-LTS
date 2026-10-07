import crypto from 'node:crypto';
import { listDurableRecordIds, loadDurableRecord, saveDurableRecord, appendMissionEvent } from './durableStore.ts';
import { inspectRepairIntegrity } from './recoveryIntegrityGovernor.ts';
import { loadRepairCoordinator, type RepairCoordinatorRecord } from './crashConsistentRepairCoordinator.ts';

export type RecoveryGovernanceState = 'OPEN' | 'DEGRADED' | 'QUARANTINED';
export type RecoveryAdmission = 'ADMIT' | 'BLOCK';
export interface GovernanceFinding { repairId: string; severity: 'WARN' | 'CRITICAL'; code: string; detail: string; }
export interface RecoveryGovernanceSnapshot {
  projectId: string;
  state: RecoveryGovernanceState;
  admission: RecoveryAdmission;
  checkedAt: string;
  checkedRepairs: number;
  healthy: number;
  recoveryRequired: number;
  corrupt: number;
  findings: GovernanceFinding[];
  auditHash: string;
}
interface GovernanceRecord { projectId: string; decisionId: string; state: RecoveryGovernanceState; admission: RecoveryAdmission; snapshot: RecoveryGovernanceSnapshot; reason: string; createdAt: string; }

const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const safeProject = (v: string) => { const x = String(v || '').trim(); if (!x || x.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_GOVERNANCE_PROJECT'); return x; };
const recordId = (projectId: string) => `governance-${hash(projectId).slice(0, 40)}`;

async function relevantRepairs(projectId: string, limit = 100) {
  const ids = await listDurableRecordIds('repair-coordinator' as any, limit);
  const rows: Array<{ id: string; envelope: Awaited<ReturnType<typeof loadRepairCoordinator>>; record: RepairCoordinatorRecord }> = [];
  const unreadable: string[] = [];
  for (const raw of ids) {
    const durableId = raw;
    try {
      const envelope = await loadDurableRecord<RepairCoordinatorRecord>('repair-coordinator' as any, durableId);
      if (envelope?.payload.projectId === projectId) rows.push({ id: envelope.payload.repairId, envelope, record: envelope.payload });
    } catch { unreadable.push(durableId); }
  }
  return { rows, unreadable };
}

export async function evaluateRecoveryGovernance(projectId: string, options: { limit?: number } = {}): Promise<RecoveryGovernanceSnapshot> {
  const project = safeProject(projectId);
  const inventory = await relevantRepairs(project, Math.min(Math.max(Number(options.limit || 100), 1), 200));
  const repairs = inventory.rows;
  const findings: GovernanceFinding[] = inventory.unreadable.map((id) => ({ repairId: id, severity: 'CRITICAL' as const, code: 'UNREADABLE_REPAIR_RECORD', detail: 'Durable repair record cannot be verified; governance fails closed' }));
  let healthy = 0, recoveryRequired = 0, corrupt = inventory.unreadable.length;
  for (const row of repairs) {
    try {
      const report = await inspectRepairIntegrity(row.id);
      if (report.verdict === 'HEALTHY') healthy += 1;
      else if (report.verdict === 'RECOVERY_REQUIRED') {
        recoveryRequired += 1;
        findings.push({ repairId: row.id, severity: 'WARN', code: 'REPAIR_RECOVERY_REQUIRED', detail: `repair=${row.record.status}` });
      } else {
        corrupt += 1;
        findings.push(...report.findings.filter(f => f.severity === 'CRITICAL').map(f => ({ repairId: row.id, severity: 'CRITICAL' as const, code: f.code, detail: f.detail })));
      }
    } catch (error) {
      corrupt += 1;
      findings.push({ repairId: row.id, severity: 'CRITICAL', code: 'REPAIR_INTEGRITY_UNREADABLE', detail: error instanceof Error ? error.message : String(error) });
    }
  }
  const state: RecoveryGovernanceState = corrupt > 0 ? 'QUARANTINED' : recoveryRequired > 0 ? 'DEGRADED' : 'OPEN';
  const admission: RecoveryAdmission = state === 'QUARANTINED' ? 'BLOCK' : 'ADMIT';
  const base = { projectId: project, state, admission, checkedAt: new Date().toISOString(), checkedRepairs: repairs.length, healthy, recoveryRequired, corrupt, findings };
  return { ...base, auditHash: hash(base) };
}

export async function recordRecoveryGovernanceDecision(snapshot: RecoveryGovernanceSnapshot, reason: string) {
  const decisionId = `decision-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
  const payload: GovernanceRecord = { projectId: snapshot.projectId, decisionId, state: snapshot.state, admission: snapshot.admission, snapshot, reason: String(reason || 'governance-check'), createdAt: new Date().toISOString() };
  const existing = await loadDurableRecord<GovernanceRecord>('recovery-governance' as any, recordId(snapshot.projectId));
  await saveDurableRecord('recovery-governance' as any, recordId(snapshot.projectId), payload, (existing?.version || 0) + 1);
  return payload;
}

export async function requireRecoveryAdmission(input: { projectId: string; missionId?: string; reason?: string }) {
  const snapshot = await evaluateRecoveryGovernance(input.projectId);
  await recordRecoveryGovernanceDecision(snapshot, input.reason || 'repair-admission');
  if (input.missionId) {
    await appendMissionEvent({ eventId: `governance:${input.missionId}:${snapshot.checkedAt}`, missionId: input.missionId, type: 'RECOVERY_GOVERNANCE_DECISION', timestamp: snapshot.checkedAt, status: snapshot.admission, summary: `Recovery governance ${snapshot.admission.toLowerCase()}ed`, evidence: [`project:${snapshot.projectId}`, `state:${snapshot.state}`, `audit:${snapshot.auditHash}`] });
  }
  if (snapshot.admission === 'BLOCK') throw new Error(`RECOVERY_QUARANTINED:${snapshot.auditHash}`);
  return snapshot;
}

export async function loadRecoveryGovernance(projectId: string) {
  return loadDurableRecord<GovernanceRecord>('recovery-governance' as any, recordId(safeProject(projectId)));
}
