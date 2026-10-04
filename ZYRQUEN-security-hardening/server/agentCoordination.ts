import crypto from 'node:crypto';
import { saveDurableRecord, loadDurableRecord, listDurableRecordIds } from './durableStore.ts';
import { resolveCapabilities } from './agentCapabilityRegistry.ts';
import { loadAgentPolicy, decideAgentCapability } from './agentPolicyEngine.ts';

export type CoordinationStatus='OPEN'|'PARTIAL'|'COMPLETED'|'BLOCKED';
export interface AgentTask { taskId:string; agentId:string; capability:string; dependsOn:string[]; status:'PENDING'|'CLAIMED'|'DONE'|'BLOCKED'; leaseUntil?:string; claimedAt?:string; completedAt?:string; }
export interface CoordinationSnapshot { coordinationId:string; projectId:string; status:CoordinationStatus; agentIds:string[]; tasks:AgentTask[]; assignments:Record<string,string>; auditHash:string; updatedAt:string; }
const hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const cleanId=(v:unknown,max=128)=>String(v??'').trim().slice(0,max);
const LEASE_MS=60_000;

function validateGraph(tasks: AgentTask[]) {
 const ids=new Set(tasks.map(t=>t.taskId));
 if(ids.size!==tasks.length) throw new Error('DUPLICATE_TASK_ID');
 for(const t of tasks){ for(const dep of t.dependsOn){ if(!ids.has(dep)) throw new Error('UNKNOWN_TASK_DEPENDENCY'); if(dep===t.taskId) throw new Error('SELF_DEPENDENCY'); } }
 const visiting=new Set<string>(), visited=new Set<string>();
 const walk=(id:string)=>{ if(visiting.has(id)) throw new Error('TASK_DEPENDENCY_CYCLE'); if(visited.has(id)) return; visiting.add(id); const t=tasks.find(x=>x.taskId===id)!; t.dependsOn.forEach(walk); visiting.delete(id); visited.add(id); };
 tasks.forEach(t=>walk(t.taskId));
}

export async function createCoordination(input:{projectId:string; tasks:Array<{taskId:string;capability:string;dependsOn?:string[]}>; agentIds:string[]}):Promise<CoordinationSnapshot>{
 const projectId=cleanId(input.projectId); const agentIds=[...new Set((input.agentIds||[]).map(x=>cleanId(x)).filter(Boolean))];
 if(!projectId||!input.tasks?.length||!agentIds.length) throw new Error('INVALID_COORDINATION');
 const tasks=input.tasks.map(t=>({taskId:cleanId(t.taskId),agentId:'',capability:cleanId(t.capability),dependsOn:(t.dependsOn||[]).map(x=>cleanId(x)),status:'PENDING' as const}));
 if(tasks.some(t=>!t.taskId||!t.capability)) throw new Error('INVALID_COORDINATION_TASK');
 validateGraph(tasks);
 const denied=resolveCapabilities(tasks.map(t=>t.capability),'CRITICAL').denied;
 if(denied.length) throw new Error(`UNKNOWN_COORDINATION_CAPABILITY:${denied.map(x=>x.id).join(',')}`);
 const coordinationId=`coord-${crypto.randomUUID()}`;
 return persist({coordinationId,projectId,status:'OPEN',agentIds,tasks,assignments:{},updatedAt:new Date().toISOString()});
}
async function persist(s:Omit<CoordinationSnapshot,'auditHash'>){const base={...s}; const existing=await loadDurableRecord<CoordinationSnapshot>('agent-coordination',s.coordinationId); const payload={...base,auditHash:hash(base)}; return saveDurableRecord('agent-coordination',s.coordinationId,payload,existing?.version ?? 0).then(e=>e.payload as CoordinationSnapshot);}
export async function loadCoordination(id:string){const r=await loadDurableRecord<CoordinationSnapshot>('agent-coordination',id); return r?.payload||null;}
function refreshExpired(s:CoordinationSnapshot){const now=Date.now(); for(const t of s.tasks){if(t.status==='CLAIMED'&&t.leaseUntil&&Date.parse(t.leaseUntil)<=now){t.status='PENDING'; delete t.leaseUntil; delete t.claimedAt; delete s.assignments[t.taskId]; t.agentId='';}}}
async function capabilityAllowed(s:CoordinationSnapshot, capability:string, agentId:string){
 const policy=await loadAgentPolicy(s.projectId);
 const decision=decideAgentCapability(policy,agentId,capability);
 return decision.allowed;
}
export async function claimCoordinationTask(id:string,taskId:string,agentId:string,leaseMs=LEASE_MS){const s=await loadCoordination(id); if(!s) throw new Error('COORDINATION_NOT_FOUND'); refreshExpired(s); const t=s.tasks.find(x=>x.taskId===taskId); if(!t) throw new Error('TASK_NOT_FOUND'); const agent=cleanId(agentId); if(!s.agentIds.includes(agent)) throw new Error('AGENT_NOT_AUTHORIZED'); if(!(await capabilityAllowed(s,t.capability,agent))) throw new Error('CAPABILITY_NOT_ALLOWED'); if(t.status!=='PENDING') throw new Error('TASK_NOT_AVAILABLE'); if(t.dependsOn.some(dep=>s.tasks.find(x=>x.taskId===dep)?.status!=='DONE')) throw new Error('TASK_DEPENDENCY_BLOCKED'); t.agentId=agent;t.status='CLAIMED';t.claimedAt=new Date().toISOString();t.leaseUntil=new Date(Date.now()+Math.min(Math.max(Number(leaseMs)||LEASE_MS,1000),300000)).toISOString();s.assignments[taskId]=agent;s.updatedAt=new Date().toISOString(); return persist({...s,auditHash:undefined} as any);}
export async function heartbeatCoordinationTask(id:string,taskId:string,agentId:string,leaseMs=LEASE_MS){const s=await loadCoordination(id);if(!s) throw new Error('COORDINATION_NOT_FOUND');refreshExpired(s);const t=s.tasks.find(x=>x.taskId===taskId);if(!t) throw new Error('TASK_NOT_FOUND');if(t.status!=='CLAIMED'||t.agentId!==cleanId(agentId)) throw new Error('TASK_OWNER_MISMATCH');t.leaseUntil=new Date(Date.now()+Math.min(Math.max(Number(leaseMs)||LEASE_MS,1000),300000)).toISOString();s.updatedAt=new Date().toISOString();return persist({...s,auditHash:undefined} as any);}
export async function releaseCoordinationTask(id:string,taskId:string,agentId:string){const s=await loadCoordination(id);if(!s) throw new Error('COORDINATION_NOT_FOUND');const t=s.tasks.find(x=>x.taskId===taskId);if(!t) throw new Error('TASK_NOT_FOUND');if(t.status!=='CLAIMED'||t.agentId!==cleanId(agentId)) throw new Error('TASK_OWNER_MISMATCH');t.status='PENDING';t.agentId='';delete t.leaseUntil;delete t.claimedAt;delete s.assignments[taskId];s.status='PARTIAL';s.updatedAt=new Date().toISOString();return persist({...s,auditHash:undefined} as any);}
export async function completeCoordinationTask(id:string,taskId:string,agentId:string){const s=await loadCoordination(id); if(!s) throw new Error('COORDINATION_NOT_FOUND'); refreshExpired(s); const t=s.tasks.find(x=>x.taskId===taskId); if(!t||t.agentId!==cleanId(agentId)||t.status!=='CLAIMED') throw new Error('TASK_OWNER_MISMATCH'); t.status='DONE';t.completedAt=new Date().toISOString();delete t.leaseUntil; const done=s.tasks.every(x=>x.status==='DONE');s.status=done?'COMPLETED':s.tasks.some(x=>x.status==='BLOCKED')?'BLOCKED':'PARTIAL';s.updatedAt=new Date().toISOString();return persist({...s,auditHash:undefined} as any);}
export async function listCoordinations(limit=50){const ids=await listDurableRecordIds('agent-coordination',limit); const out=[];for(const id of ids){const s=await loadCoordination(id);if(s)out.push(s)}return out;}
