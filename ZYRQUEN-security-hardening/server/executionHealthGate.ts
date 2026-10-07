import type { ExecutionHealthSnapshot } from './executionHealth.ts';

export type ExecutionHealthGateDecision = 'ALLOW' | 'BLOCK';
export interface ExecutionHealthGateResult {
  decision: ExecutionHealthGateDecision;
  reasons: string[];
  checkedAt: string;
  sourceStatus: ExecutionHealthSnapshot['status'];
}

export function evaluateExecutionHealthGate(snapshot: ExecutionHealthSnapshot, now = new Date().toISOString()): ExecutionHealthGateResult {
  if (snapshot.status === 'HEALTHY' && snapshot.reasons.length === 0) {
    return { decision: 'ALLOW', reasons: [], checkedAt: now, sourceStatus: snapshot.status };
  }
  const reasons = snapshot.reasons.length ? [...snapshot.reasons] : ['EXECUTION_HEALTH_NOT_HEALTHY'];
  return { decision: 'BLOCK', reasons, checkedAt: now, sourceStatus: snapshot.status };
}
