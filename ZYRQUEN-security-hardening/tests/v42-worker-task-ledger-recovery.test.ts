import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.cwd(), `.v42-test-${process.pid}-${Date.now()}`);
process.env.CODEVOICE_DURABLE_ROOT = root;
const { saveDurableRecord, loadDurableRecord } = await import('../server/durableStore.ts');
const { recoverWorkerTaskLedger } = await import('../server/workerTaskLedgerRecovery.ts');
await fs.rm(root,{recursive:true,force:true});

const baseMission:any={missionId:'v42-safe',executionId:'exec-safe',goal:'safe recovery',status:'RUNNING',progress:0,tasks:[{taskId:'t-safe',type:'ANALYZE',title:'Analyze',description:'analyze',dependencies:[],priority:'HIGH',status:'RUNNING',inputs:{},retryCount:0,maxRetries:2,affectedFiles:[],validationCriteria:[],parallelSafe:false,startedAt:new Date(Date.now()-60000).toISOString()}],context:{objective:'safe',relevantFiles:[],budget:100,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
await saveDurableRecord('mission',baseMission.missionId,baseMission,1);
await saveDurableRecord('worker-task-run','task-run-v42-safe-t-safe',{runId:'task-run-v42-safe-t-safe',missionId:'v42-safe',taskId:'t-safe',workerId:'dead-worker',leaseId:'dead-lease',fencingToken:'f1',attempt:1,state:'RUNNING',executionKey:'worker-task:v42-safe:t-safe',startedAt:new Date(Date.now()-60000).toISOString(),updatedAt:new Date(Date.now()-60000).toISOString()},1);
const safeReport=await recoverWorkerTaskLedger({staleMs:1000});
if(safeReport.requeued!==1) throw new Error('safe task was not requeued');
const safeMission=await loadDurableRecord<any>('mission','v42-safe');
if(safeMission?.payload.tasks[0].status!=='READY') throw new Error('safe task not READY');
if(safeMission?.payload.tasks[0].retryCount!==1) throw new Error('safe retry not incremented');

const baseUnsafe={...baseMission,missionId:'v42-unsafe',executionId:'exec-unsafe',tasks:[{...baseMission.tasks[0],taskId:'t-unsafe',type:'UPDATE',status:'RUNNING'}],updatedAt:new Date().toISOString()};
await saveDurableRecord('mission',baseUnsafe.missionId,baseUnsafe,1);
await saveDurableRecord('worker-task-run','task-run-v42-unsafe-t-unsafe',{runId:'task-run-v42-unsafe-t-unsafe',missionId:'v42-unsafe',taskId:'t-unsafe',workerId:'dead-worker',leaseId:'dead-lease-2',fencingToken:'f2',attempt:1,state:'RUNNING',executionKey:'worker-task:v42-unsafe:t-unsafe',startedAt:new Date(Date.now()-60000).toISOString(),updatedAt:new Date(Date.now()-60000).toISOString()},1);
const unsafeReport=await recoverWorkerTaskLedger({staleMs:1000});
if(unsafeReport.blocked<1) throw new Error('unsafe task was not blocked');
const unsafeMission=await loadDurableRecord<any>('mission','v42-unsafe');
if(unsafeMission?.payload.status!=='WAITING_USER') throw new Error('unsafe mission not blocked for review');
const unsafeRun=await loadDurableRecord<any>('worker-task-run','task-run-v42-unsafe-t-unsafe');
if(unsafeRun?.payload.state!=='ORPHANED') throw new Error('unsafe ledger not orphaned');

const finalizedMission={...baseMission,missionId:'v42-finalize',executionId:'exec-finalize',tasks:[{...baseMission.tasks[0],taskId:'t-final',status:'COMPLETED',outputs:{ok:true},completedAt:new Date().toISOString()}],updatedAt:new Date().toISOString()};
await saveDurableRecord('mission',finalizedMission.missionId,finalizedMission,1);
await saveDurableRecord('worker-task-run','task-run-v42-finalize-t-final',{runId:'task-run-v42-finalize-t-final',missionId:'v42-finalize',taskId:'t-final',workerId:'dead-worker',leaseId:'dead-lease-3',fencingToken:'f3',attempt:1,state:'RUNNING',executionKey:'worker-task:v42-finalize:t-final',startedAt:new Date(Date.now()-60000).toISOString(),updatedAt:new Date(Date.now()-60000).toISOString()},1);
const finalReport=await recoverWorkerTaskLedger({staleMs:1000});
if(finalReport.finalized<1) throw new Error('completed mission task was not reconciled');
const finalRun=await loadDurableRecord<any>('worker-task-run','task-run-v42-finalize-t-final');
if(finalRun?.payload.state!=='COMPLETED' || !finalRun.payload.result?.success) throw new Error('reconciled ledger missing result');

await fs.rm(root,{recursive:true,force:true});
console.log('V42 worker task ledger recovery tests: PASS');
