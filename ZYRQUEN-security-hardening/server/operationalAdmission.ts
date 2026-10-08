import type { ExecutionHealthGateResult } from './executionHealthGate.ts';
import type { ExecutionRecoveryPlan } from './executionRecoveryPlan.ts';

export type AdmissionDecision = 'ADMITTED' | 'BLOCKED';
export interface OperationalAdmission {
  decision: AdmissionDecision;
  reasons: string[];
  recoveryRequired: boolean;
  checkedAt: string;
}

export function evaluateOperationalAdmission(gate: ExecutionHealthGateResult, recovery: ExecutionRecoveryPlan, now = new Date().toISOString()): OperationalAdmission {
  const reasons = [...gate.reasons, ...recovery.reasons.filter(r => !gate.reasons.includes(r))];
  if (gate.decision === 'ALLOW' && !recovery.required) return { decision: 'ADMITTED', reasons: [], recoveryRequired: false, checkedAt: now };
  return { decision: 'BLOCKED', reasons: reasons.length ? reasons : ['RECOVERY_REQUIRED'], recoveryRequired: recovery.required, checkedAt: now };
}
