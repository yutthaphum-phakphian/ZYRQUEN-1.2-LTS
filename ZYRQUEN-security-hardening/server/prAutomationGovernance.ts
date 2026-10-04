import crypto from 'node:crypto';

export type PRGovernanceDecision = 'ADMITTED' | 'BLOCKED';
export interface PRGovernanceInput { patchHash:string; approved:boolean; dryRun:boolean; branchName:string; baseBranch:string; healthDecision:'ADMITTED'|'BLOCKED'; }
export interface PRGovernanceResult { decision:PRGovernanceDecision; reasons:string[]; policyHash:string; checkedAt:string; }

export function evaluatePRGovernance(input: PRGovernanceInput, now = new Date().toISOString()): PRGovernanceResult {
  const reasons:string[]=[];
  if (!/^[a-f0-9]{64}$/.test(input.patchHash)) reasons.push('PATCH_HASH_INVALID');
  if (!input.approved) reasons.push('APPROVAL_REQUIRED');
  if (input.dryRun) reasons.push('DRY_RUN_NO_MUTATION');
  if (!input.branchName || input.branchName === input.baseBranch) reasons.push('INVALID_TARGET_BRANCH');
  if (input.healthDecision !== 'ADMITTED') reasons.push('EXECUTION_HEALTH_NOT_ADMITTED');
  const policyHash=crypto.createHash('sha256').update(JSON.stringify({approved:input.approved,dryRun:input.dryRun,branchName:input.branchName,baseBranch:input.baseBranch,healthDecision:input.healthDecision})).digest('hex');
  return { decision: reasons.length ? 'BLOCKED':'ADMITTED', reasons, policyHash, checkedAt:now };
}
