import crypto from 'node:crypto';
import type { DeveloperWorkflowVerificationResult } from './developerWorkflowVerification.ts';
type RepairOperation = { id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string };

export type RepairDiagnosis =
  | 'TEST_FAILURE'
  | 'BUILD_FAILURE'
  | 'INSPECTION_FAILURE'
  | 'APPROVAL_OR_POLICY_BLOCK'
  | 'EXECUTION_TIMEOUT'
  | 'WORKSPACE_STATE_MISMATCH'
  | 'UNKNOWN_FAILURE';

export interface DeveloperRepairPlan {
  planId: string;
  verificationId: string;
  verificationAuditHash: string;
  status: 'READY_FOR_APPROVAL' | 'NO_SAFE_PLAN';
  diagnosis: RepairDiagnosis;
  failedStep?: { action: string; error?: string; summary?: unknown };
  constraints: string[];
  candidateOperations: RepairOperation[];
  requiresHumanApproval: true;
  auditHash: string;
}

const id = () => `repair-plan-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

function classify(step: { action: string; error?: string; summary?: unknown }): RepairDiagnosis {
  const text = `${step.error || ''} ${JSON.stringify(step.summary || '')}`.toUpperCase();
  if (text.includes('TIMEOUT')) return 'EXECUTION_TIMEOUT';
  if (text.includes('EXPECTATION') || text.includes('TARGET_NOT_FOUND') || text.includes('TARGET_EXISTS')) return 'WORKSPACE_STATE_MISMATCH';
  if (text.includes('APPROVAL') || text.includes('BLOCKED')) return 'APPROVAL_OR_POLICY_BLOCK';
  if (step.action === 'RUN_TEST') return 'TEST_FAILURE';
  if (step.action === 'RUN_BUILD') return 'BUILD_FAILURE';
  if (step.action === 'INSPECT') return 'INSPECTION_FAILURE';
  return 'UNKNOWN_FAILURE';
}

function buildConstraints(diagnosis: RepairDiagnosis): string[] {
  const common = [
    'No mutation is performed while planning',
    'Any mutation must be explicitly approved',
    'Mutation must use an active worker fence and transactional workspace path',
    'Do not overwrite changed files without an expectedHash',
    'Re-run verification after every approved repair',
  ];
  if (diagnosis === 'EXECUTION_TIMEOUT') common.push('Increase timeout only after confirming the command is expected to be bounded');
  if (diagnosis === 'WORKSPACE_STATE_MISMATCH') common.push('Refresh workspace state before constructing a repair operation');
  return common;
}

export function planDeveloperRepair(verification: DeveloperWorkflowVerificationResult): DeveloperRepairPlan {
  const failedStep = verification.steps.find(step => !step.ok);
  const diagnosis = failedStep ? classify(failedStep) : 'UNKNOWN_FAILURE';
  const candidateOperations: RepairOperation[] = [];
  const status = failedStep ? 'READY_FOR_APPROVAL' : 'NO_SAFE_PLAN';
  const base = {
    planId: id(),
    verificationId: verification.verificationId,
    verificationAuditHash: verification.auditHash,
    status: status as 'READY_FOR_APPROVAL' | 'NO_SAFE_PLAN',
    diagnosis,
    failedStep,
    constraints: buildConstraints(diagnosis),
    candidateOperations,
    requiresHumanApproval: true as const,
  };
  return { ...base, auditHash: hash(base) };
}
