import crypto from 'node:crypto';
import { appendMissionEvent, listDurableRecordIds, loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import type { AutonomousMission, AutonomousTask } from '../src/tools/autonomousMissionEngine.ts';
import type { DurableWorkerTaskRun } from './workerTaskLedger.ts';

export type TaskConsistencyAction = 'MATCHED' | 'FINALIZED_LEDGER' | 'BLOCKED_MISMATCH' | 'SYNTHETIC_LEDGER';
export interface TaskConsistencyItem { missionId:string; taskId:string; action:TaskConsistencyAction; reason:string; }
export interface TaskConsistencyReport { scanned:number; matched:number; repaired:number; blocked:number; errors:string[]; items:TaskConsistencyItem[]; }

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value as Record<string,unknown>).sort().map(k => `${JSON.stringify(k)}:${stable((value as Record<string,unknown>)[k])}`).join(',')}}`;
}
function hash(value: unknown) { return crypto.createHash('sha256').update(stable(value)).digest('hex'); }
function safe(value:string){ const v=String(value||'').trim(); if(!v||v.length>128||!/^[a-zA-Z0-9._:-]+$/.test(v)) throw new Error('INVALID_WORKER_TASK_VALUE'); return v; }
function taskOutcome(task: AutonomousTask) {
  return { status: task.status, outputs: task.outputs ?? null, error: task.error ?? null };
}

export async function auditWorkerTaskConsistency(options:{limit?:number}={}):Promise<TaskConsistencyReport>{
  const ids=await listDurableRecordIds('worker-task-run',Math.min(Math.max(Number(options.limit||500),1),2000));
  const report:TaskConsistencyReport={scanned:0,matched:0,repaired:0,blocked:0,errors:[],items:[]};
  for(const recordId of ids){
    try{
      const ledger=await loadDurableRecord<DurableWorkerTaskRun>('worker-task-run',recordId); if(!ledger) continue;
      report.scanned++;
      const run=ledger.payload;
      const missionRec=await loadDurableRecord<AutonomousMission>('mission',safe(run.missionId));
      if(!missionRec){ report.blocked++; report.items.push({missionId:run.missionId,taskId:run.taskId,action:'BLOCKED_MISMATCH',reason:'mission-not-found'}); continue; }
      const task=missionRec.payload.tasks.find(t=>t.taskId===run.taskId);
      if(!task){ report.blocked++; report.items.push({missionId:run.missionId,taskId:run.taskId,action:'BLOCKED_MISMATCH',reason:'task-not-found'}); continue; }
      const terminalMission=task.status==='COMPLETED'||task.status==='FAILED'||task.status==='WAITING_APPROVAL';
      const terminalLedger=run.state==='COMPLETED'||run.state==='FAILED'||run.state==='WAITING_APPROVAL';
      if(terminalMission && !terminalLedger){
        const result = task.status==='COMPLETED'
          ? {success:true,output:task.outputs,evidence:['consistency-audit:mission-task-terminal']}
          : task.status==='WAITING_APPROVAL'
            ? {success:false,requiresApproval:true,error:{code:'WAITING_APPROVAL',message:'Task is waiting for approval',failureClass:'PERMISSION',recoverable:false},evidence:['consistency-audit:mission-task-terminal']}
            : {success:false,error:task.error,evidence:task.error?.evidence||['consistency-audit:mission-task-terminal']};
        const nextState=task.status==='COMPLETED'?'COMPLETED':task.status==='WAITING_APPROVAL'?'WAITING_APPROVAL':'FAILED';
        const saved=await saveDurableRecord('worker-task-run',ledger.id,{...run,state:nextState,result,updatedAt:new Date().toISOString(),resultHash:hash(result)},ledger.version);
        await appendMissionEvent({eventId:`task-consistency-finalize:${run.runId}:${saved.version}`,missionId:run.missionId,type:'MISSION_WORKER_TASK_LEDGER_CONSISTENCY_REPAIRED',timestamp:new Date().toISOString(),status:nextState,taskId:run.taskId,summary:'Task ledger finalized from terminal durable mission state',evidence:[`run:${run.runId}`,`taskStatus:${task.status}`]});
        report.repaired++; report.items.push({missionId:run.missionId,taskId:run.taskId,action:'FINALIZED_LEDGER',reason:`mission-terminal:${task.status}`}); continue;
      }
      if(terminalLedger && !terminalMission){
        report.blocked++; report.items.push({missionId:run.missionId,taskId:run.taskId,action:'BLOCKED_MISMATCH',reason:`ledger-terminal:${run.state}-mission:${task.status}`});
        await appendMissionEvent({eventId:`task-consistency-block:${run.runId}:${ledger.version}`,missionId:run.missionId,type:'MISSION_WORKER_TASK_LEDGER_CONSISTENCY_BLOCKED',timestamp:new Date().toISOString(),status:'WAITING_USER',taskId:run.taskId,summary:'Ledger claims terminal execution while mission task is non-terminal; manual reconciliation required',evidence:[`run:${run.runId}`,`ledger:${run.state}`,`mission:${task.status}`]});
        continue;
      }
      if(terminalLedger && terminalMission){
        if(run.result && run.resultHash && hash(run.result)!==run.resultHash){ report.blocked++; report.items.push({missionId:run.missionId,taskId:run.taskId,action:'BLOCKED_MISMATCH',reason:'ledger-result-hash-mismatch'}); continue; }
        report.matched++; report.items.push({missionId:run.missionId,taskId:run.taskId,action:'MATCHED',reason:'terminal-states-consistent'}); continue;
      }
      report.matched++; report.items.push({missionId:run.missionId,taskId:run.taskId,action:'MATCHED',reason:'non-terminal-state-consistent'});
    }catch(error){ report.errors.push(error instanceof Error?error.message:String(error)); }
  }
  return report;
}

export { hash as workerTaskResultHash };
