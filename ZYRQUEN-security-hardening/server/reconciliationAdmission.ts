import crypto from 'node:crypto';
import { loadAgentPolicy } from './agentPolicyEngine.ts';
import { reconcileWorkspace, type ReconciliationResult } from './stateReconciliation.ts';

export type Admission='ADMITTED'|'BLOCKED';
export interface ReconciliationAdmissionResult { projectId:string; admission:Admission; verdict:ReconciliationResult['verdict']; reason:string; requiresRepair:boolean; auditHash:string; reconciliation:ReconciliationResult; checkedAt:string; }
const hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

export async function evaluateWorkspaceAdmission(input:{projectId:string; actualFiles?:Array<{name:string;content:string}>; agentId?:string}):Promise<ReconciliationAdmissionResult>{
 const reconciliation=await reconcileWorkspace(input);
 const policy=await loadAgentPolicy(input.projectId);
 let admission:Admission='ADMITTED', reason='ALIGNED';
 if(reconciliation.verdict!=='ALIGNED') { admission='BLOCKED'; reason=`WORKSPACE_${reconciliation.verdict}`; }
 if(policy && policy.deniedAgents.includes(String(input.agentId||'').trim())) { admission='BLOCKED'; reason='AGENT_DENIED'; }
 const base={projectId:input.projectId,admission,verdict:reconciliation.verdict,reason,requiresRepair:reconciliation.verdict!=='ALIGNED',reconciliation,checkedAt:new Date().toISOString()};
 return {...base,auditHash:hash(base)};
}
