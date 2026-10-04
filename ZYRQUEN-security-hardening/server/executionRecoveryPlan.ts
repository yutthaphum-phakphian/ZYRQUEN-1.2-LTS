import type { ExecutionHealthSnapshot } from './executionHealth.ts';

export type RecoveryAction = 'REBUILD_RECEIPT_LEDGER' | 'REBUILD_WEBHOOK_LEDGER' | 'STOP_AUTOMATION';
export interface ExecutionRecoveryPlan {
  required: boolean;
  actions: RecoveryAction[];
  reasons: string[];
  generatedAt: string;
}

export function buildExecutionRecoveryPlan(snapshot: ExecutionHealthSnapshot, now = new Date().toISOString()): ExecutionRecoveryPlan {
  const actions: RecoveryAction[] = [];
  const reasons = [...snapshot.reasons];
  if (snapshot.reasons.includes('EXECUTION_RECEIPT_LEDGER_INVALID')) actions.push('REBUILD_RECEIPT_LEDGER');
  if (snapshot.reasons.includes('WEBHOOK_DELIVERY_LEDGER_INVALID')) actions.push('REBUILD_WEBHOOK_LEDGER');
  if (snapshot.status !== 'HEALTHY' && actions.length === 0) actions.push('STOP_AUTOMATION');
  return { required: actions.length > 0, actions, reasons, generatedAt: now };
}
