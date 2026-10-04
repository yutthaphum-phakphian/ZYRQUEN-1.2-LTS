import crypto from 'node:crypto';
import { createAgentExecutionPlan, type AgentExecutionPlan } from './agentPlanningLayer.ts';
import { saveDurableRecord } from './durableStore.ts';

export type SimulationOutcome = 'SAFE_TO_APPLY' | 'APPROVAL_REQUIRED' | 'BLOCKED';
export interface SimulationRequest { projectId: string; goal: string; capabilities?: string[]; maxRisk?: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; maxAttempts?: number; }
export interface SimulationResult { simulationId:string; plan:AgentExecutionPlan; outcome:SimulationOutcome; predictedMutations:number; predictedRecovery:number; warnings:string[]; auditHash:string; createdAt:string; }
const hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
export async function simulateAgentExecution(input:SimulationRequest):Promise<SimulationResult> {
  const plan=createAgentExecutionPlan(input);
  const warnings:string[]=[];
  if(plan.status==='BLOCKED') warnings.push('CAPABILITY_POLICY_BLOCK');
  if(plan.rollbackRequired) warnings.push('MUTATION_REQUIRES_TRANSACTIONAL_ROLLBACK');
  const predictedMutations=plan.steps.filter(s=>s.kind==='MUTATE').length;
  const predictedRecovery=plan.steps.filter(s=>s.kind==='RECOVER').length;
  const outcome: SimulationOutcome = plan.status==='BLOCKED'?'BLOCKED':plan.steps.some(s=>s.requiresApproval)?'APPROVAL_REQUIRED':'SAFE_TO_APPLY';
  const base={simulationId:`simulation-${crypto.randomUUID()}`,plan,outcome,predictedMutations,predictedRecovery,warnings,createdAt:new Date().toISOString()};
  const result={...base,auditHash:hash(base)};
  await saveDurableRecord('simulation', result.simulationId, result);
  return result;
}
