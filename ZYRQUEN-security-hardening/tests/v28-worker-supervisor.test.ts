import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveDurableRecord, loadDurableRecord, appendMissionEvent, verifyMissionEventJournal } from '../server/durableStore.ts';
import { acquireMissionWorker, heartbeatMissionWorker, releaseMissionWorker, inspectMissionWorker, claimMissionForRecovery, superviseMission } from '../server/missionWorkerSupervisor.ts';
import type { AutonomousMission } from '../src/tools/autonomousMissionEngine.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const missionId = `v28-worker-${Date.now()}`;
const mission = (): AutonomousMission => ({ missionId, executionId:'exec-v28', goal:'worker lease test', status:'RUNNING', tasks:[], progress:25, context:{objective:'worker lease test',relevantFiles:[],budget:16000,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() });

async function main(){
  await fs.rm(root,{recursive:true,force:true});
  await saveDurableRecord('mission', missionId, mission(), 1);
  await appendMissionEvent({eventId:'m1',missionId,type:'MISSION_CREATED',timestamp:new Date().toISOString(),status:'CREATED',summary:'created'});
  await appendMissionEvent({eventId:'m2',missionId,type:'TASK_STARTED',timestamp:new Date().toISOString(),status:'RUNNING',summary:'running'});

  const first=await acquireMissionWorker(missionId,'worker-a',5000);
  assert.equal(first.status,'ACTIVE');
  const second=await inspectMissionWorker(missionId); assert.equal(second.status,'ACTIVE');
  await assert.rejects(()=>acquireMissionWorker(missionId,'worker-b',5000),/RESOURCE_LOCKED/);
  const hb=await heartbeatMissionWorker(missionId,'worker-a',5000); assert.equal(hb.status,'ACTIVE');
  const supervised=await superviseMission(missionId); assert.equal(supervised.workerStatus,'ACTIVE');
  const released=await releaseMissionWorker(missionId,'worker-a'); assert.equal(released.released,true);
  assert.equal((await inspectMissionWorker(missionId)).status,'RELEASED');

  const claim=await claimMissionForRecovery(missionId,'recovery-worker',5000); assert.equal(claim.claimed,true);
  const duplicate=await claimMissionForRecovery(missionId,'recovery-worker-2',5000); assert.equal(duplicate.claimed,false); assert.equal(duplicate.reason,'WORKER_ALREADY_ACTIVE');
  assert.equal((await verifyMissionEventJournal(missionId)).valid,true);
  const leaseRecord=await loadDurableRecord('worker-lease',`worker-lease-${missionId}`); assert.ok(leaseRecord);
  await releaseMissionWorker(missionId,'recovery-worker');
  await fs.rm(root,{recursive:true,force:true});
  console.log('V28 WORKER SUPERVISOR TESTS: PASS');
}
main().catch(e=>{console.error(e);process.exit(1)});
