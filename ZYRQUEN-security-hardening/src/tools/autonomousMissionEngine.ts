import { ProjectContext } from '../types';
import { SelfContainedRuntime, InternalEvent, InternalToolName } from './selfContainedRuntime';
export type MissionState = 'CREATED'|'ANALYZING'|'PLANNING'|'READY'|'RUNNING'|'PAUSED'|'WAITING_APPROVAL'|'WAITING_USER'|'VALIDATING'|'RECOVERING'|'COMPLETED'|'FAILED'|'CANCELLED';
export type TaskStatus = 'PENDING'|'READY'|'RUNNING'|'BLOCKED'|'WAITING_APPROVAL'|'WAITING_USER'|'COMPLETED'|'FAILED'|'CANCELLED';
export type TaskType = 'ANALYZE'|'PLAN'|'READ'|'CREATE'|'UPDATE'|'DELETE'|'RENAME'|'SEARCH'|'CODE'|'VALIDATE'|'TEST'|'REVIEW'|'FIX'|'SUMMARIZE';
export interface MissionTask { taskId: string; missionId: string; title: string; description: string; type: TaskType; dependencies: string[]; status: TaskStatus; priority: number; attempts: number; inputs: Record<string, unknown>; outputs?: unknown; error?: string; startedAt?: string; completedAt?: string; files?: string[]; }
export interface MissionContext { system: string; project: Record<string, unknown>; mission: Record<string, unknown>; task: Record<string, unknown>; files: string[]; tool?: Record<string, unknown>; errors: string[]; budget: { maxChars: number; used: number; compressed: boolean }; }
export interface MissionEvent { id: string; missionId: string; type: string; timestamp: string; taskId?: string; summary: string; evidence: string[]; }
export interface Mission { missionId: string; objective: string; state: MissionState; tasks: MissionTask[]; currentTaskId?: string; events: MissionEvent[]; context: MissionContext; recoveryAttempts: number; maxRecoveryAttempts: number; maxTasks: number; checkpoint?: unknown; snapshotId?: string; result?: unknown; error?: string; createdAt: string; updatedAt: string; }
const iso=()=>new Date().toISOString(); const uid=(p:string)=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const storageKey=(id:string)=>`codevoice-ai:v18:mission:${id}`; const memoryMissionStore=new Map<string,string>();
const typeFor=(s:string):TaskType=>s==='create'?'CREATE':s==='update'?'UPDATE':s==='validate'?'VALIDATE':s==='test'?'TEST':s==='fix'?'FIX':'READ';
export class MissionContextManager { constructor(private project: ProjectContext) {} select(objective:string, task:MissionTask, errors:string[]=[]):MissionContext { const terms=(objective+' '+task.title+' '+task.description).toLowerCase().split(/\W+/).filter(Boolean); const files=this.project.files.filter(f=>terms.some(t=>f.name.toLowerCase().includes(t)||f.content.toLowerCase().includes(t))).slice(0,12).map(f=>f.name); const project={projectName:this.project.projectName,framework:this.project.framework,files:this.project.files.length,rules:this.project.rules||[],knownIssues:this.project.knownIssues||[]}; const required=JSON.stringify({project,task,files,errors}); const maxChars=12000; return {system:'CodeVoice internal autonomous runtime; do not invent evidence.',project,mission:{objective},task:{taskId:task.taskId,type:task.type},files,errors,budget:{maxChars,used:Math.min(required.length,maxChars),compressed:required.length>maxChars}}; } }
export class AutonomousMissionEngine { private missions=new Map<string,Mission>(); private runtimes=new Map<string,SelfContainedRuntime>(); private approvedTasks=new Set<string>(); private contextManager: MissionContextManager;
   constructor(private project:ProjectContext, private limits:{maxTasks:number;maxRecoveryAttempts:number;maxAttemptsPerTask:number;parallelReadOnly?:boolean;maxParallel?:number}={maxTasks:20,maxRecoveryAttempts:3,maxAttemptsPerTask:3,parallelReadOnly:true,maxParallel:3}) { this.contextManager=new MissionContextManager(project); }
  private remote?:{save:(id:string,json:string)=>Promise<void>;load:(id:string)=>Promise<string|null>};
  private remotePending=new Map<string,string>(); private remoteFlushing=false;
  /** 'OFF' (no remote store) | 'SYNCED' | 'PENDING' | 'FAILED:<reason>' — reflects the last real attempt, never assumed. */
  remoteStatus:string='OFF';
  setRemoteStore(r:{save:(id:string,json:string)=>Promise<void>;load:(id:string)=>Promise<string|null>}|undefined){ this.remote=r; this.remoteStatus=r?'PENDING':'OFF'; }
  private async flushRemote(){ if(this.remoteFlushing||!this.remote) return; this.remoteFlushing=true;
    try{ while(this.remotePending.size){ const [id,json]=this.remotePending.entries().next().value as [string,string]; this.remotePending.delete(id);
      try{ await this.remote.save(id,json); this.remoteStatus=this.remotePending.size?'PENDING':'SYNCED'; }catch(e){ this.remoteStatus='FAILED:'+(e instanceof Error?e.message:String(e)); } }
    } finally { this.remoteFlushing=false; } }
  async restoreMissionRemote(id:string):Promise<Mission|undefined>{
    if(!this.remote) return undefined;
    try{ const raw=await this.remote.load(id); if(!raw) return undefined; const m=JSON.parse(raw) as Mission;
      if(m.missionId!==id||!Array.isArray(m.tasks)||!Array.isArray(m.events)) throw new Error('MISSION_PERSISTENCE_INVALID');
      if(m.state==='RUNNING'){ m.state='PAUSED'; m.events.push({id:uid('me'),missionId:id,type:'RESTORED_AFTER_RESTART',timestamp:iso(),summary:'Mission was RUNNING when persisted; restored as PAUSED (no checkpoint verification implied)',evidence:['server restore'] });
        for(const t of m.tasks) if(t.status==='RUNNING') t.status='PENDING'; }
      this.missions.set(id,m); this.remoteStatus='SYNCED'; return m;
    }catch(e){ this.remoteStatus='FAILED:'+(e instanceof Error?e.message:String(e)); return undefined; } }
  private save(m:Mission){const serialized=JSON.stringify(m);memoryMissionStore.set(m.missionId,serialized);if(this.remote){this.remotePending.set(m.missionId,serialized);this.remoteStatus='PENDING';void this.flushRemote();}try{localStorage.setItem(storageKey(m.missionId),serialized);}catch{/* browser storage unavailable; process fallback retained */} this.missions.set(m.missionId,m);}
  private event(m:Mission,type:string,summary:string,evidence:string[],taskId?:string){m.events.push({id:uid('me'),missionId:m.missionId,type,timestamp:iso(),summary,evidence,taskId});m.updatedAt=iso();this.save(m);}
  createMission(objective:string){const mission:Mission={missionId:uid('mission'),objective,state:'CREATED',tasks:[],events:[],context:{system:'',project:{},mission:{},task:{},files:[],errors:[],budget:{maxChars:12000,used:0,compressed:false}},recoveryAttempts:0,maxRecoveryAttempts:this.limits.maxRecoveryAttempts,maxTasks:this.limits.maxTasks,createdAt:iso(),updatedAt:iso()};this.missions.set(mission.missionId,mission);this.event(mission,'MISSION_CREATED','Mission created from user objective',['objective captured']);return mission;}
  analyzeMission(m:Mission){if(m.state!=='CREATED')throw new Error('INVALID_STATE_ANALYZE');m.state='ANALYZING';this.event(m,'MISSION_ANALYZED','Project and objective analyzed',['project state inspected']);return m;}
  planMission(m:Mission){if(m.state!=='ANALYZING')throw new Error('INVALID_STATE_PLAN');m.state='PLANNING';const parts:[string,TaskType][]=[['Inspect project','READ'],['Analyze relevant files','ANALYZE'],['Create implementation plan','PLAN']];const lower=m.objective.toLowerCase();if(/สร้าง|create|build|implement/.test(lower))parts.push(['Apply requested internal changes',typeFor(lower.includes('update')?'update':'create')]);if(/test|ทดสอบ/.test(lower))parts.push(['Run validation and tests','VALIDATE']);else parts.push(['Validate actual project state','VALIDATE']);m.tasks=parts.slice(0,m.maxTasks).map(([title,type])=>({taskId:uid('task'),missionId:m.missionId,title,description:`${title} for: ${m.objective}`,type,dependencies:[],status:'PENDING',priority:type==='VALIDATE'?2:1,attempts:0,inputs:{objective:m.objective}}));m.tasks.forEach((t,i)=>{if(i)t.dependencies=[m.tasks[i-1].taskId];});
    if(this.limits.parallelReadOnly&&m.tasks.length>=3){ m.tasks[1].dependencies=[]; m.tasks[2].dependencies=[m.tasks[0].taskId,m.tasks[1].taskId]; }m.state='READY';this.event(m,'PLAN_CREATED',`Created ${m.tasks.length} dependency-aware tasks`,m.tasks.map(t=>t.title));return m;}
  private static readonly PLAN_TYPES:ReadonlySet<string>=new Set(['ANALYZE','PLAN','READ','CREATE','UPDATE','DELETE','RENAME','SEARCH','CODE','VALIDATE','TEST','REVIEW','FIX','SUMMARIZE']);
  /** Strictly validates an untrusted (model-produced) plan. Throws PLAN_INVALID:<reason>; never repairs silently. */
  private validatePlan(m:Mission,raw:unknown):{title:string;type:TaskType;deps:number[]}[]{
    const bad=(r:string):never=>{throw new Error('PLAN_INVALID:'+r);};
    if(!Array.isArray(raw)||raw.length<2) bad('not an array of >=2 tasks');
    const arr=raw as unknown[]; if(arr.length>m.maxTasks) bad('exceeds maxTasks');
    const out=arr.map((x,i)=>{ const o=x as {title?:unknown;type?:unknown;dependsOn?:unknown};
      if(!o||typeof o.title!=='string'||!o.title.trim()||o.title.length>120) bad(`task ${i} title`);
      const type=String(o.type||'').toUpperCase(); if(!AutonomousMissionEngine.PLAN_TYPES.has(type)) bad(`task ${i} type`);
      const deps=o.dependsOn===undefined?(i?[i-1]:[]):o.dependsOn; if(!Array.isArray(deps)||deps.some(d=>!Number.isInteger(d)||d<0||d>=i)) bad(`task ${i} dependsOn must reference earlier tasks`);
      return {title:(o.title as string).trim(),type:type as TaskType,deps:[...new Set(deps as number[])]}; });
    if(out[out.length-1].type!=='VALIDATE') bad('last task must be VALIDATE');
    const last=out.length-1; const used=new Set(out.flatMap(t=>t.deps)); // validation must wait for every leaf task
    out[last].deps=[...new Set([...out[last].deps,...out.map((_,i)=>i).filter(i=>i!==last&&!used.has(i))])];
    return out;
  }
  /** Model-assisted planning. `planner` is injected (e.g. a server call); any failure falls back to deterministic planMission and is recorded. */
  async planMissionAsync(m:Mission,planner?:(objective:string)=>Promise<unknown>):Promise<Mission>{
    if(m.state!=='ANALYZING') throw new Error('INVALID_STATE_PLAN');
    if(planner){
      try{
        const plan=this.validatePlan(m,await planner(m.objective)); m.state='PLANNING';
        m.tasks=plan.map(p=>({taskId:uid('task'),missionId:m.missionId,title:p.title,description:`${p.title} for: ${m.objective}`,type:p.type,dependencies:[],status:'PENDING' as TaskStatus,priority:p.type==='VALIDATE'?2:1,attempts:0,inputs:{objective:m.objective}}));
        m.tasks.forEach((t,i)=>{t.dependencies=plan[i].deps.map(d=>m.tasks[d].taskId);});
        m.state='READY'; this.event(m,'PLAN_CREATED',`Created ${m.tasks.length} model-planned, validated tasks`,m.tasks.map(t=>t.title)); return m;
      }catch(e){ this.event(m,'MODEL_PLAN_REJECTED','Model plan unavailable or invalid; using deterministic planner',[e instanceof Error?e.message:String(e)]); }
    }
    return this.planMission(m);
  }
  private ready(m:Mission){return m.tasks.filter(t=>t.status==='PENDING'&&t.dependencies.every(d=>m.tasks.find(x=>x.taskId===d)?.status==='COMPLETED'));}
  private runtime(m:Mission){let r=this.runtimes.get(m.missionId);if(!r){r=new SelfContainedRuntime(this.project);this.runtimes.set(m.missionId,r);}return r;}
  private runTask(m:Mission,t:MissionTask){t.status='RUNNING';t.startedAt=iso();t.attempts++;m.currentTaskId=t.taskId;m.context=this.contextManager.select(m.objective,t,m.context.errors);this.event(m,'TASK_STARTED',t.title,['task entered RUNNING','context selected'],t.taskId);const r=this.runtime(m);let result:{success:boolean;data?:unknown;error?:string;event:InternalEvent};if(['CREATE','UPDATE','DELETE','RENAME','CODE','FIX'].includes(t.type)){if(!this.approvedTasks.has(t.taskId)){t.status='WAITING_APPROVAL';this.event(m,'WAITING_APPROVAL','Mutation requires explicit approval',['V17 permission boundary'],t.taskId);return 'WAITING_APPROVAL';}if(!t.inputs.name||(!t.inputs.content&&['CREATE','UPDATE','CODE','FIX'].includes(t.type))){t.status='WAITING_USER';t.error='MISSING_MUTATION_INPUTS';this.event(m,'WAITING_USER','Required file name/content is missing; no mutation was attempted',['no fabricated mutation'],t.taskId);return 'WAITING_USER';}if(!m.snapshotId){const snap=r.createSnapshot();m.snapshotId=snap.snapshotId;this.event(m,'SNAPSHOT_CREATED','Risk snapshot created before mutation',[snap.snapshotId],t.taskId);}const tool=t.type==='CREATE'?'createFile':t.type==='UPDATE'?'updateFile':t.type==='DELETE'?'deleteFile':'renameFile';result=r.executeTool(tool as InternalToolName,{...t.inputs,approved:true});}else if(t.type==='READ'||t.type==='ANALYZE'||t.type==='PLAN')result=r.executeTool(t.type==='READ'?'listFiles':'getProjectSummary',{});else if(t.type==='VALIDATE'||t.type==='TEST')result=r.executeTool('validateCode',{});else result=r.executeTool('getDiff',{});if(result.success){t.status='COMPLETED';t.outputs=result.data;t.completedAt=iso();this.event(m,'TASK_COMPLETED',t.title,['tool returned success'],t.taskId);return 'COMPLETED';}t.status='FAILED';t.error=result.error||'TOOL_FAILURE';this.event(m,'TASK_FAILED',t.error,['actual internal tool failure'],t.taskId);return 'FAILED';}
  executeMission(m:Mission){if(!['READY','RUNNING','RESUMING'].includes(m.state))throw new Error('INVALID_STATE_EXECUTE');m.state='RUNNING';this.event(m,'EXECUTION_STARTED','Autonomous loop started',['bounded dependency execution']);let guard=0;while(m.state==='RUNNING'&&guard++<m.maxTasks*4){const next=this.ready(m)[0];if(!next){if(m.tasks.some(t=>['PENDING','READY'].includes(t.status))){m.state='FAILED';m.error='DEPENDENCY_BLOCKED';this.event(m,'MISSION_BLOCKED','No executable task because dependency is unresolved',['dependency graph']);}break;}const outcome=this.runTask(m,next);if(outcome==='WAITING_APPROVAL'){m.state='WAITING_APPROVAL';break;}if(outcome==='WAITING_USER'){m.state='WAITING_USER';break;}if(outcome==='FAILED'){if(next.attempts<this.limits.maxAttemptsPerTask){m.state='RECOVERING';m.recoveryAttempts++;this.event(m,'RECOVERY_STARTED','Bounded recovery requested',['task failure classified as TOOL'],next.taskId);if(m.recoveryAttempts<=m.maxRecoveryAttempts){next.status='PENDING';m.state='RUNNING';continue;}}m.state='FAILED';m.error='RECOVERY_LIMIT';break;}if(m.tasks.every(t=>t.status==='COMPLETED')){m.state='VALIDATING';const validation=m.tasks.find(t=>t.type==='VALIDATE');if(validation?.status==='COMPLETED'){m.state='COMPLETED';m.result={completedTasks:m.tasks.length,validated:true};this.event(m,'MISSION_COMPLETED','Mission completed after actual validation',['all tasks completed','validation completed']);}else{m.state='FAILED';m.error='REQUIRED_VALIDATION_MISSING';}break;}}if(guard>=m.maxTasks*4&&m.state==='RUNNING'){m.state='FAILED';m.error='EXECUTION_LIMIT';}m.updatedAt=iso();this.save(m);return m;}
  provideTaskInputs(m:Mission,taskId:string,inputs:Record<string,unknown>){
    const t=m.tasks.find(x=>x.taskId===taskId); if(!t) throw new Error('TASK_NOT_FOUND');
    if(m.state!=='WAITING_USER'&&t.status!=='WAITING_USER') throw new Error('INPUTS_NOT_EXPECTED');
    t.inputs={...t.inputs,...inputs}; t.error=undefined; t.status='PENDING'; m.state='RUNNING';
    this.event(m,'USER_INPUT_RECEIVED','Concrete mutation inputs received',['file inputs attached'],taskId);
    return this.executeMission(m);
  }
  approve(m:Mission,taskId:string,approved=true){const t=m.tasks.find(x=>x.taskId===taskId);if(!t||m.state!=='WAITING_APPROVAL')throw new Error('APPROVAL_TARGET_INVALID');if(approved)this.approvedTasks.add(taskId); if(!approved){t.status='BLOCKED';m.state='WAITING_USER';this.event(m,'APPROVAL_REJECTED','User rejected mutation',['permission boundary'],taskId);return m;}t.status='PENDING';m.state='RUNNING';this.event(m,'APPROVAL_GRANTED','User approved next mutation',['approval bound to task'],taskId);return this.executeMission(m);}
  pauseMission(m:Mission){if(m.state!=='RUNNING')throw new Error('INVALID_STATE_PAUSE');m.state='PAUSED';const r=this.runtime(m);m.checkpoint=r.createCheckpoint(m.missionId,m.missionId,m.currentTaskId||'none',m.state,{tasks:m.tasks,context:m.context});this.event(m,'MISSION_PAUSED','Mission paused at local checkpoint',['LOCAL_ONLY']);return m;}
  resumeMission(m:Mission){if(m.state!=='PAUSED')throw new Error('INVALID_STATE_RESUME');const r=this.runtime(m);if(m.checkpoint&&!r.verifyCheckpoint(m.checkpoint)){m.state='FAILED';m.error='CHECKPOINT_INTEGRITY_FAILED';this.event(m,'MISSION_FAILED',m.error,['checkpoint tampering']);return m;}m.state='RUNNING';this.event(m,'MISSION_RESUMED','Mission resumed from verified checkpoint',['completed tasks not restarted']);return this.executeMission(m);}
  cancelMission(m:Mission,reason='user_cancelled'){if(['COMPLETED','FAILED','CANCELLED'].includes(m.state))return m;m.state='CANCELLED';m.error=reason;for(const t of m.tasks)if(['PENDING','READY','RUNNING'].includes(t.status))t.status='CANCELLED';this.event(m,'MISSION_CANCELLED','Mission cancelled',[reason]);return m;}
  executeNextTask(m:Mission){
    if(!['READY','RUNNING'].includes(m.state)) throw new Error('INVALID_STATE_STEP');
    m.state='RUNNING'; const next=this.ready(m)[0];
    if(!next){ if(m.tasks.every(t=>t.status==='COMPLETED')){m.state='VALIDATING'; const v=m.tasks.find(t=>t.type==='VALIDATE'); if(v?.status==='COMPLETED'){m.state='COMPLETED';m.result={completedTasks:m.tasks.length,validated:true};this.event(m,'MISSION_COMPLETED','Mission completed after actual validation',['single-step completion']);} } else {m.state='FAILED';m.error='DEPENDENCY_BLOCKED';this.event(m,'MISSION_BLOCKED','No ready task exists',['dependency graph']);} return m; }
    const outcome=this.runTask(m,next);
    if(outcome==='WAITING_APPROVAL') m.state='WAITING_APPROVAL';
    else if(outcome==='WAITING_USER') m.state='WAITING_USER';
    else if(outcome==='FAILED') { m.state='FAILED'; m.error=next.error||'TASK_FAILED'; }
    else if(m.tasks.every(t=>t.status==='COMPLETED')) { m.state='VALIDATING'; const v=m.tasks.find(t=>t.type==='VALIDATE'); if(v?.status==='COMPLETED'){m.state='COMPLETED';m.result={completedTasks:m.tasks.length,validated:true};this.event(m,'MISSION_COMPLETED','Mission completed after actual validation',['single-step completion']);} }
    this.save(m); return m;
  }
  /** Only side-effect-free task types may share a tick; mutations always run alone. */
  private static readonly PARALLEL_SAFE:ReadonlySet<TaskType>=new Set<TaskType>(['READ','ANALYZE','SEARCH','REVIEW','SUMMARIZE']);
  private executeReadyBatch(m:Mission){
    const safe=this.limits.parallelReadOnly?this.ready(m).filter(t=>AutonomousMissionEngine.PARALLEL_SAFE.has(t.type)).slice(0,this.limits.maxParallel??3):[];
    if(safe.length<2) return this.executeNextTask(m);
    m.state='RUNNING'; this.event(m,'PARALLEL_BATCH',`Running ${safe.length} independent read-only tasks in one tick`,safe.map(t=>t.title));
    const outcomes=safe.map(t=>({t,o:this.runTask(m,t)}));
    const bad=outcomes.find(x=>x.o!=='COMPLETED');
    if(bad){ if(bad.o==='FAILED'){m.state='FAILED';m.error=bad.t.error||'TASK_FAILED';} else m.state=bad.o as MissionState; }
    else if(m.tasks.every(t=>t.status==='COMPLETED')){ const v=m.tasks.find(t=>t.type==='VALIDATE'); if(v?.status==='COMPLETED'){m.state='COMPLETED';m.result={completedTasks:m.tasks.length,validated:true};this.event(m,'MISSION_COMPLETED','Mission completed after actual validation',['batch completion']);} }
    this.save(m); return m;
  }
  // Cooperative control: flags are honoured at task boundaries by executeMissionAsync.
  private controlRequests=new Map<string,'PAUSE'|'CANCEL'>();
  requestPause(m:Mission){ if(m.state==='RUNNING'){ this.controlRequests.set(m.missionId,'PAUSE'); this.event(m,'PAUSE_REQUESTED','Pause requested; will apply at next task boundary',['cooperative control']); } return m; }
  requestCancel(m:Mission){ if(m.state==='RUNNING'){ this.controlRequests.set(m.missionId,'CANCEL'); this.event(m,'CANCEL_REQUESTED','Cancel requested; will apply at next task boundary',['cooperative control']); return m; } return this.cancelMission(m); }
  /** Runs one task per tick and yields to the event loop between tasks so pause/cancel can take effect mid-mission. */
  async resumeMissionAsync(m:Mission,opts:{yieldMs?:number;onTick?:(m:Mission)=>void}={}):Promise<Mission>{
    if(m.state!=='PAUSED') throw new Error('INVALID_STATE_RESUME');
    const r=this.runtime(m);
    if(m.checkpoint&&!r.verifyCheckpoint(m.checkpoint)){ m.state='FAILED'; m.error='CHECKPOINT_INTEGRITY_FAILED'; this.event(m,'MISSION_FAILED',m.error,['checkpoint tampering']); return m; }
    m.state='RUNNING'; this.event(m,'MISSION_RESUMED','Mission resumed from verified checkpoint',['completed tasks not restarted']);
    return this.executeMissionAsync(m,opts);
  }
  async executeMissionAsync(m:Mission,opts:{yieldMs?:number;onTick?:(m:Mission)=>void}={}):Promise<Mission>{
    if(!['READY','RUNNING'].includes(m.state)) throw new Error('INVALID_STATE_EXECUTE');
    this.controlRequests.delete(m.missionId); m.state='RUNNING';
    this.event(m,'EXECUTION_STARTED','Async autonomous loop started',['yields between tasks']);
    for(let guard=0; guard<m.maxTasks*4 && m.state==='RUNNING'; guard++){
      await new Promise<void>(r=>setTimeout(r,opts.yieldMs??0));
      const req=this.controlRequests.get(m.missionId);
      if(req){ this.controlRequests.delete(m.missionId); if(req==='CANCEL') return this.cancelMission(m,'user_cancelled_mid_run'); return this.pauseMission(m); }
      this.executeReadyBatch(m); opts.onTick?.(m);
      if((m.state as MissionState)==='FAILED'){
        const failed=m.tasks.find(t=>t.status==='FAILED');
        if(failed && failed.attempts<this.limits.maxAttemptsPerTask && m.recoveryAttempts<m.maxRecoveryAttempts){
          m.recoveryAttempts++; failed.status='PENDING'; failed.error=undefined; m.error=undefined; m.state='RUNNING';
          this.event(m,'RECOVERY_STARTED','Bounded recovery: retrying failed task',['actual tool failure'],failed.taskId);
        }
      }
    }
    if(m.state==='RUNNING'){ m.state='FAILED'; m.error='EXECUTION_LIMIT'; }
    this.save(m); return m;
  }
  restoreMission(id:string){
    try { const raw=(typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey(id)) : null) || memoryMissionStore.get(id); if(!raw) return undefined; const m=JSON.parse(raw) as Mission; if(!m.missionId||m.missionId!==id||!Array.isArray(m.tasks)||!Array.isArray(m.events)) throw new Error('MISSION_PERSISTENCE_INVALID'); this.missions.set(id,m); return m; } catch { return undefined; }
  }
  replayMission(m:Mission){
    return m.events.map((event,index)=>({index:index+1,type:event.type,timestamp:event.timestamp,taskId:event.taskId||null,summary:event.summary,evidence:event.evidence}));
  }
  getMission(id:string){return this.missions.get(id);}
}

export {
  createAutonomousMission,
  pauseMission,
  resumeMission,
  runAutonomousMission,
  runAutonomousMissionStep,
} from './autonomousMissionRuntime';
export type {
  AutonomousMission,
  AutonomousMissionAdapter,
  AutonomousMissionContext,
  AutonomousMissionEvent,
  AutonomousMissionStatus,
  AutonomousMissionStep,
  AutonomousTask,
  AutonomousTaskStatus,
  MissionTaskFailure,
  MissionTaskResult,
} from './autonomousMissionRuntime';
