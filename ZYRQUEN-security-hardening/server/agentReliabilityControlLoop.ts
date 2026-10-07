import crypto from 'node:crypto';
import { listDurableRecordIds, loadDurableRecord, appendMissionEvent } from './durableStore.ts';
import { loadRepairCoordinator, recoverCrashConsistentRepair, type RepairCoordinatorRecord } from './crashConsistentRepairCoordinator.ts';
import { evaluateRecoveryGovernance, type RecoveryGovernanceSnapshot } from './recoveryGovernance.ts';
import { inspectRepairIntegrity, type RecoveryIntegrityReport } from './recoveryIntegrityGovernor.ts';

export type ReliabilityOutcome = 'HEALTHY' | 'HEALED' | 'DEGRADED' | 'QUARANTINED' | 'BLOCKED';
export interface ReliabilityRepairAction {
  repairId: string;
  projectId: string;
  before: string;
  action: string;
  after?: string;
  reason?: string;
}
export interface AgentReliabilitySnapshot {
  projectId: string;
  outcome: ReliabilityOutcome;
  checkedRepairs: number;
  recoveredRepairs: number;
  healthyRepairs: number;
  recoveryRequired: number;
  corrupt: number;
  governance: RecoveryGovernanceSnapshot;
  actions: ReliabilityRepairAction[];
  checkedAt: string;
  auditHash: string;
}

const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const safeProject = (v: string) => {
  const x = String(v || '').trim();
  if (!x || x.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_RELIABILITY_PROJECT');
  return x;
};

async function repairRecords(projectId: string, limit: number) {
  const ids = await listDurableRecordIds('repair-coordinator' as any, Math.min(Math.max(limit, 1), 200));
  const rows: Array<{ id: string; record: RepairCoordinatorRecord }> = [];
  for (const raw of ids) {
    const durableId = raw;
    try {
      const envelope = await loadDurableRecord<RepairCoordinatorRecord>('repair-coordinator' as any, durableId);
      if (envelope?.payload.projectId === projectId) rows.push({ id: envelope.payload.repairId, record: envelope.payload });
    } catch {
      // Integrity/governance remains responsible for declaring unreadable records corrupt.
    }
  }
  return rows;
}

/**
 * Closed-loop reliability pass. It may recover durable crash states, but never
 * invents code changes and never mutates a quarantined project.
 */
export async function runAgentReliabilityPass(input: {
  projectId: string;
  recoveryWorkerId?: string;
  limit?: number;
  autoRecover?: boolean;
}): Promise<AgentReliabilitySnapshot> {
  const projectId = safeProject(input.projectId);
  const limit = Math.min(Math.max(Number(input.limit || 100), 1), 200);
  const actions: ReliabilityRepairAction[] = [];
  let governance = await evaluateRecoveryGovernance(projectId, { limit });
  const rows = await repairRecords(projectId, limit);
  let recoveredRepairs = 0;

  // Never perform recovery while the governance snapshot is already quarantined.
  if (governance.admission === 'BLOCK') {
    const base = { projectId, outcome: 'QUARANTINED' as const, checkedRepairs: rows.length, recoveredRepairs: 0,
      healthyRepairs: 0, recoveryRequired: governance.recoveryRequired, corrupt: governance.corrupt,
      governance, actions, checkedAt: new Date().toISOString() };
    return { ...base, auditHash: hash(base) };
  }

  if (input.autoRecover !== false) {
    for (const row of rows) {
      if (['COMMITTED', 'ABORTED'].includes(row.record.status)) continue;
      if (!input.recoveryWorkerId) {
        actions.push({ repairId: row.id, projectId, before: row.record.status, action: 'RECOVERY_SKIPPED', reason: 'RECOVERY_WORKER_REQUIRED' });
        continue;
      }
      try {
        const recovered = await recoverCrashConsistentRepair(row.id, input.recoveryWorkerId);
        const after = recovered.record?.status;
        actions.push({ repairId: row.id, projectId, before: row.record.status, action: recovered.action, after, reason: recovered.reason });
        if (recovered.action === 'FINALIZED' || recovered.action === 'ABORTED') recoveredRepairs += 1;
      } catch (error) {
        actions.push({ repairId: row.id, projectId, before: row.record.status, action: 'RECOVERY_FAILED', reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  governance = await evaluateRecoveryGovernance(projectId, { limit });
  const reports: RecoveryIntegrityReport[] = [];
  for (const row of await repairRecords(projectId, limit)) {
    try { reports.push(await inspectRepairIntegrity(row.id)); } catch { /* governance already fails closed */ }
  }

  const healthyRepairs = reports.filter(r => r.verdict === 'HEALTHY').length;
  const recoveryRequired = reports.filter(r => r.verdict === 'RECOVERY_REQUIRED').length;
  const corrupt = reports.filter(r => r.verdict === 'CORRUPT').length;
  const outcome: ReliabilityOutcome = governance.admission === 'BLOCK' || corrupt > 0
    ? 'QUARANTINED'
    : recoveryRequired > 0
      ? (recoveredRepairs > 0 ? 'DEGRADED' : 'DEGRADED')
      : recoveredRepairs > 0 ? 'HEALED' : 'HEALTHY';

  const checkedAt = new Date().toISOString();
  const base = { projectId, outcome, checkedRepairs: reports.length, recoveredRepairs, healthyRepairs, recoveryRequired, corrupt, governance, actions, checkedAt };
  return { ...base, auditHash: hash(base) };
}

export async function runAndJournalAgentReliabilityPass(input: Parameters<typeof runAgentReliabilityPass>[0] & { missionId?: string }) {
  const snapshot = await runAgentReliabilityPass(input);
  if (input.missionId) {
    await appendMissionEvent({
      eventId: `reliability:${input.missionId}:${snapshot.checkedAt}`,
      missionId: input.missionId,
      type: 'AGENT_RELIABILITY_PASS',
      timestamp: snapshot.checkedAt,
      status: snapshot.outcome,
      summary: `Agent reliability pass ${snapshot.outcome.toLowerCase()}`,
      evidence: [`project:${snapshot.projectId}`, `audit:${snapshot.auditHash}`, `recovered:${snapshot.recoveredRepairs}`, `corrupt:${snapshot.corrupt}`],
    });
  }
  return snapshot;
}
