import crypto from 'node:crypto';
import path from 'node:path';
import { verifyDeveloperWorkflow, type DeveloperWorkflowVerificationRequest, type DeveloperWorkflowVerificationResult } from './developerWorkflowVerification.ts';
import { previewDeveloperPatch, assertPatchApproval } from './developerPatchEngine.ts';
import { assertMissionWorkerFence } from './missionWorkerSupervisor.ts';
import { executeCrashConsistentRepair } from './crashConsistentRepairCoordinator.ts';
import { requireRecoveryAdmission } from './recoveryGovernance.ts';

export type RepairLoopStatus = 'COMPLETED' | 'REPAIR_REQUIRED' | 'APPROVAL_REQUIRED' | 'BLOCKED' | 'FAILED';
export interface RepairOperation { id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }
export interface DeveloperRepairLoopRequest extends DeveloperWorkflowVerificationRequest {
  missionId: string;
  projectId?: string;
  workerId: string;
  leaseId: string;
  approved?: boolean;
  repairs?: RepairOperation[];
  maxAttempts?: number;
  patchHash?: string;
}
export interface DeveloperRepairLoopResult {
  repairId: string;
  status: RepairLoopStatus;
  attempts: number;
  verification?: DeveloperWorkflowVerificationResult;
  transactionId?: string;
  effectId?: string;
  repairRequired: boolean;
  evidence: string[];
  auditHash: string;
}

const id = () => `repair-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');


function safeFsTarget(workspaceRoot: string, target: string) {
  const root = path.resolve(workspaceRoot);
  const normalized = String(target || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) throw new Error('INVALID_REPAIR_TARGET');
  const absolute = path.resolve(root, normalized);
  const rel = path.relative(root, absolute);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('REPAIR_TARGET_OUTSIDE_WORKSPACE');
  return absolute;
}

const fileHash = (content: string) => crypto.createHash('sha256').update(content).digest('hex');

function result(base: Omit<DeveloperRepairLoopResult, 'auditHash'>): DeveloperRepairLoopResult {
  const out = { ...base, auditHash: '' };
  out.auditHash = hash(out);
  return out;
}

export async function repairDeveloperWorkflow(req: DeveloperRepairLoopRequest): Promise<DeveloperRepairLoopResult> {
  const repairId = id();
  const maxAttempts = Math.max(1, Math.min(3, Number(req.maxAttempts || 2)));
  const repairs = Array.isArray(req.repairs) ? req.repairs.slice(0, 100) : [];

  if (!req.missionId || !req.workerId || !req.leaseId) {
    return result({ repairId, status: 'BLOCKED', attempts: 0, repairRequired: true, evidence: ['mission-worker-fence-required'] });
  }
  try {
    await assertMissionWorkerFence(req.missionId, req.workerId, req.leaseId);
    await requireRecoveryAdmission({ projectId: req.projectId || req.missionId, missionId: req.missionId, reason: 'developer-repair-before-mutation' });
  } catch (error) {
    return result({ repairId, status: 'BLOCKED', attempts: 0, repairRequired: true, evidence: [`fence:${error instanceof Error ? error.message : String(error)}`] });
  }

  const verification = await verifyDeveloperWorkflow({ ...req, approved: req.approved === true });
  if (verification.status === 'APPROVAL_REQUIRED') {
    return result({ repairId, status: 'APPROVAL_REQUIRED', attempts: 1, verification, repairRequired: false, evidence: ['verification-approval-required'] });
  }
  if (verification.status === 'PASSED') {
    return result({ repairId, status: 'COMPLETED', attempts: 1, verification, repairRequired: false, evidence: ['verification-already-passed'] });
  }
  if (!repairs.length) {
    return result({ repairId, status: 'REPAIR_REQUIRED', attempts: 1, verification, repairRequired: true, evidence: ['verification-failed', 'explicit-repair-operations-required'] });
  }
  if (req.approved !== true) {
    return result({ repairId, status: 'APPROVAL_REQUIRED', attempts: 1, verification, repairRequired: true, evidence: ['approved-repair-mutation-required'] });
  }

  let currentVerification = verification;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await assertMissionWorkerFence(req.missionId, req.workerId, req.leaseId);
    const idempotencyKey = `${repairId}:attempt:${attempt}`;
    const preview = await previewDeveloperPatch({ workspaceRoot: req.workspaceRoot, operations: repairs, sourceVerificationId: currentVerification.verificationId });
    try { assertPatchApproval(preview, { approved: req.approved, patchHash: req.patchHash }); } catch (error) {
      return result({ repairId, status: 'APPROVAL_REQUIRED', attempts: attempt, verification: currentVerification, repairRequired: true, evidence: [`patch:${preview.patchId}`, `patch-hash:${preview.patchHash}`, error instanceof Error ? error.message : String(error)] });
    }
    const coordinated = await executeCrashConsistentRepair({
      repairId: `${repairId}:attempt:${attempt}`,
      missionId: req.missionId,
      projectId: req.projectId || req.missionId,
      workspaceRoot: req.workspaceRoot,
      workerId: req.workerId,
      leaseId: req.leaseId,
      operations: repairs.map((op, i) => ({ ...op, id: op.id || `repair-op-${i + 1}` })),
      patchHash: preview.patchHash,
    });

    currentVerification = await verifyDeveloperWorkflow({ ...req, approved: true });
    if (currentVerification.status === 'PASSED') {
      return result({ repairId, status: 'COMPLETED', attempts: attempt + 1, verification: currentVerification, transactionId: coordinated.transactionId, effectId: `repair-coordinator-${preview.patchId}`,  repairRequired: false, evidence: ['repair-applied', 'verification-passed'] });
    }
  }

  return result({ repairId, status: 'FAILED', attempts: maxAttempts + 1, verification: currentVerification, repairRequired: true, evidence: ['repair-attempt-limit-reached', 'verification-still-failing'] });
}
