import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(process.cwd(), `.v40-test-${process.pid}-${Date.now()}`);
process.env.CODEVOICE_DURABLE_ROOT = root;
const { saveDurableRecord, loadDurableRecord } = await import('../server/durableStore.ts');
const { enqueueMission, listMissionQueue } = await import('../server/missionQueueScheduler.ts');
const { MissionWorkerPool } = await import('../server/missionWorkerPool.ts');
const { createWorkerRun, acknowledgeWorkerRun, loadWorkerRun, recoverWorkerPoolRuns } = await import('../server/missionWorkerPoolSupervisor.ts');
await fs.rm(root,{recursive:true,force:true});

const mission:any={missionId:'v40-mission',executionId:crypto.randomUUID(),goal:'durable pool recovery',status:'READY',progress:0,tasks:[{taskId:'t1',type:'ANALYZE',title:'Analyze',description:'analyze',dependencies:[],priority:'HIGH',status:'READY',inputs:{},retryCount:0,maxRetries:1,affectedFiles:[],validationCriteria:[],parallelSafe:false}],context:{objective:'durable pool recovery',relevantFiles:[],budget:100,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
await saveDurableRecord('mission',mission.missionId,mission,1);
await enqueueMission(mission.missionId,'CRITICAL',3);

const pool=new MissionWorkerPool(undefined,{capacity:1,intervalMs:250,ttlMs:5000,maxSteps:10});
await pool.tick();
for(let i=0;i<30;i++){ await new Promise(r=>setTimeout(r,50)); if(pool.snapshot().inFlight===0) break; }
const final=await loadDurableRecord<any>('mission',mission.missionId);
if(!['COMPLETED','WAITING_USER','FAILED','WAITING_APPROVAL'].includes(final?.payload.status)) throw new Error('V40 worker execution failed');
const runs=await fs.readdir(path.join(root,'worker-run'));
if(!runs.length) throw new Error('durable worker run was not created');
const runId=runs[0].replace(/\.json$/,'');
const runRec=await loadDurableRecord<any>('worker-run',runId);
if(runRec?.payload.state!=='COMPLETED') throw new Error('worker run not durably completed');

const idem=await acknowledgeWorkerRun(runRec.payload.missionId,runRec.payload.leaseId,'COMPLETED','COMPLETED',1);
if(!idem.idempotent) throw new Error('ACK is not idempotent');

const orphanMission='v40-orphan';
const orphan:any={...mission,missionId:orphanMission,executionId:crypto.randomUUID(),status:'READY',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
await saveDurableRecord('mission',orphanMission,orphan,1);
await enqueueMission(orphanMission,'HIGH',3);
const orphanLease='orphan-lease';
await createWorkerRun({missionId:orphanMission,workerId:'dead-worker',leaseId:orphanLease,fencingToken:'dead-fence',state:'RUNNING',attempt:1});
const rec=await loadWorkerRun(orphanMission,orphanLease); if(!rec) throw new Error('orphan run missing');
const aged={...rec.payload,updatedAt:new Date(Date.now()-60000).toISOString()};
await saveDurableRecord('worker-run',rec.id,aged,rec.version);
const report=await recoverWorkerPoolRuns({staleMs:1000});
if(report.orphaned<1 || report.requeued<1) throw new Error(`orphan recovery failed: ${JSON.stringify(report)}`);
const oq=(await listMissionQueue()).find(x=>x.missionId===orphanMission);
if(oq?.status!=='QUEUED') throw new Error('orphan mission was not requeued');

await pool.shutdown();
await fs.rm(root,{recursive:true,force:true});
console.log('V40 worker pool durable recovery tests: PASS');
