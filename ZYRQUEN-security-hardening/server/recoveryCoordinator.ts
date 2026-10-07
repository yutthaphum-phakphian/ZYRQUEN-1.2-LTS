import crypto from 'node:crypto';
import type { ExecutionHealthSnapshot } from './executionHealth.ts';
import { buildExecutionRecoveryPlan, type ExecutionRecoveryPlan } from './executionRecoveryPlan.ts';

export interface RecoveryAttempt { attemptId:string; action:string; status:'PLANNED'|'COMPLETED'|'BLOCKED'; startedAt:string; finishedAt?:string; evidenceHash:string; }
export interface RecoveryCoordinatorResult { state:'NO_RECOVERY_REQUIRED'|'RECOVERY_REQUIRED'|'RECOVERY_BLOCKED'; plan:ExecutionRecoveryPlan; attempts:RecoveryAttempt[]; coordinatorHash:string; }
export function coordinateRecovery(snapshot:ExecutionHealthSnapshot, now=new Date().toISOString()):RecoveryCoordinatorResult {
  const plan=buildExecutionRecoveryPlan(snapshot,now);
  if(!plan.required) return {state:'NO_RECOVERY_REQUIRED',plan,attempts:[],coordinatorHash:crypto.createHash('sha256').update(JSON.stringify(plan)).digest('hex')};
  const attempts:RecoveryAttempt[]=plan.actions.map(action=>{const startedAt=now; const evidenceHash=crypto.createHash('sha256').update(`${action}|${startedAt}`).digest('hex'); return {attemptId:`recovery-${evidenceHash.slice(0,16)}`,action,status:'PLANNED',startedAt,evidenceHash};});
  return {state:'RECOVERY_REQUIRED',plan,attempts,coordinatorHash:crypto.createHash('sha256').update(JSON.stringify({plan,attempts})).digest('hex')};
}
