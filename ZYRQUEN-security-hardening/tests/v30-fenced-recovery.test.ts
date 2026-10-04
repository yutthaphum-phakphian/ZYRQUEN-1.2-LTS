import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveDurableRecord, appendMissionEvent } from '../server/durableStore.ts';
import { acquireMissionWorker, assertMissionWorkerFence, releaseMissionWorker } from '../server/missionWorkerSupervisor.ts';
import { inspectMissionRecovery, resumeMissionWithWorkerLease, recoverMissionWithWorker } from '../server/missionRecoveryOrchestrator.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const missionId = `v30-fenced-${Date.now()}`;
const makeMission = () => ({ missionId, executionId:'exec-v30', goal:'fenced recovery', status:'RUNNING', tasks:[], progress:25, context:{objective:'fence',relevantFiles:[],budget:1000,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() });

async function main(){
  await fs.rm(root,{recursive:true,force:true});
  await saveDurableRecord('mission',missionId,makeMission(),1);
  await appendMissionEvent({eventId:'v30-created',missionId,type:'MISSION_CREATED',timestamp:new Date().toISOString(),status:'CREATED',summary:'created'});

  const lease = await acquireMissionWorker(missionId,'worker-v30',5000);
  assert.equal((await assertMissionWorkerFence(missionId,'worker-v30',lease.leaseId)).valid,true);
  const fenced = await resumeMissionWithWorkerLease(missionId,'worker-v30',lease.leaseId);
  assert.ok(fenced.mission);
  assert.equal(fenced.mission?.status,'RUNNING');
  await releaseMissionWorker(missionId,'worker-v30');
  await assert.rejects(() => resumeMissionWithWorkerLease(missionId,'worker-v30',lease.leaseId), /WORKER_FENCE_LOST|WORKER_LEASE_NOT_ACTIVE/);

  const mission2 = `${missionId}-auto`;
  await saveDurableRecord('mission',mission2,{...makeMission(),missionId:mission2},1);
  await appendMissionEvent({eventId:'v30-created-2',missionId:mission2,type:'MISSION_CREATED',timestamp:new Date().toISOString(),status:'CREATED',summary:'created'});
  const claimed = await recoverMissionWithWorker(mission2,'worker-auto',5000);
  assert.equal(claimed.mission?.status,'RUNNING');
  const recovery = await inspectMissionRecovery(mission2);
  assert.equal(recovery.action,'RESUME_READY');
  await fs.rm(root,{recursive:true,force:true});
  console.log('V30 FENCED RECOVERY TESTS: PASS');
}
main().catch(e=>{console.error(e);process.exit(1)});
