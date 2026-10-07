import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(process.cwd(), `.v41-test-${process.pid}-${Date.now()}`);
process.env.CODEVOICE_DURABLE_ROOT = root;
const { saveDurableRecord, loadDurableRecord } = await import('../server/durableStore.ts');
const { enqueueMission } = await import('../server/missionQueueScheduler.ts');
const { MissionWorkerPool } = await import('../server/missionWorkerPool.ts');
const { loadWorkerTaskRun, listWorkerTaskRuns } = await import('../server/workerTaskLedger.ts');
await fs.rm(root,{recursive:true,force:true});

const mission:any={missionId:'v41-mission',executionId:crypto.randomUUID(),goal:'task ledger',status:'READY',progress:0,tasks:[{taskId:'t1',type:'ANALYZE',title:'Analyze',description:'analyze',dependencies:[],priority:'HIGH',status:'READY',inputs:{},retryCount:0,maxRetries:1,affectedFiles:[],validationCriteria:[],parallelSafe:false}],context:{objective:'task ledger',relevantFiles:[],budget:100,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
await saveDurableRecord('mission',mission.missionId,mission,1);
await enqueueMission(mission.missionId,'CRITICAL',3);
const pool=new MissionWorkerPool(undefined,{capacity:1,intervalMs:100,ttlMs:5000,maxSteps:10});
await pool.tick();
for(let i=0;i<50;i++){ await new Promise(r=>setTimeout(r,40)); if(pool.snapshot().inFlight===0) break; }
const final=await loadDurableRecord<any>('mission',mission.missionId);
if(final?.payload.status!=='COMPLETED') throw new Error('V41 mission did not complete');
const taskRun=await loadWorkerTaskRun(mission.missionId,'t1');
if(taskRun?.payload.state!=='COMPLETED') throw new Error('task ledger not completed');
if(taskRun?.payload.executionKey!=='worker-task:v41-mission:t1') throw new Error('stable execution key missing');
if(!taskRun.payload.result?.success) throw new Error('task result missing from ledger');
const all=await listWorkerTaskRuns();
if(!all.some(x=>x.runId===taskRun.payload.runId)) throw new Error('task ledger listing failed');

// Replay safety: a second worker-pool tick must not execute a completed task again.
const replayMission:any={...mission,missionId:'v41-replay',executionId:crypto.randomUUID(),status:'READY',updatedAt:new Date().toISOString(),tasks:mission.tasks.map((t:any)=>({...t,status:'READY',retryCount:0,outputs:undefined,completedAt:undefined}))};
await saveDurableRecord('mission',replayMission.missionId,replayMission,1);
await enqueueMission(replayMission.missionId,'HIGH',3);
await pool.tick();
for(let i=0;i<50;i++){ await new Promise(r=>setTimeout(r,40)); if(pool.snapshot().inFlight===0) break; }
const replayRun=await loadWorkerTaskRun(replayMission.missionId,'t1');
if(replayRun?.payload.state!=='COMPLETED') throw new Error('replay ledger not completed');

await pool.shutdown();
await fs.rm(root,{recursive:true,force:true});
console.log('V41 worker task ledger tests: PASS');
