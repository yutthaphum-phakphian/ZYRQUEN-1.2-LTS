import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveDurableRecord, appendMissionEvent, inspectDurableLock } from '../server/durableStore.ts';
import { acquireMissionWorker, heartbeatMissionWorker, releaseMissionWorker, watchdogMissionWorker, assertMissionWorkerFence } from '../server/missionWorkerSupervisor.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const missionId = `v29-fence-${Date.now()}`;
const mission = () => ({ missionId, executionId:'exec-v29', goal:'fencing test', status:'RUNNING', tasks:[], progress:10, context:{objective:'fence',relevantFiles:[],budget:1000,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() });
async function main(){
 await fs.rm(root,{recursive:true,force:true});
 await saveDurableRecord('mission',missionId,mission(),1);
 await appendMissionEvent({eventId:'v29-created',missionId,type:'MISSION_CREATED',timestamp:new Date().toISOString(),status:'CREATED',summary:'created'});
 const lease=await acquireMissionWorker(missionId,'worker-a',4000);
 assert.ok(lease.fencingToken);
 assert.equal((await assertMissionWorkerFence(missionId,'worker-a',lease.leaseId)).valid,true);
 const hb=await heartbeatMissionWorker(missionId,'worker-a',4000,lease.leaseId); assert.equal(hb.status,'ACTIVE'); assert.equal(hb.leaseId,lease.leaseId);
 await assert.rejects(()=>assertMissionWorkerFence(missionId,'worker-a','wrong-lease'),/WORKER_FENCE_LOST/);
 const lock=await inspectDurableLock(`mission-worker-${missionId}`); assert.equal(lock?.fencingToken,lease.fencingToken);
 const healthy=await watchdogMissionWorker(missionId); assert.equal(healthy.status,'ACTIVE');
 await releaseMissionWorker(missionId,'worker-a');
 const post=await watchdogMissionWorker(missionId); assert.notEqual(post.status,'ACTIVE');
 await fs.rm(root,{recursive:true,force:true});
 console.log('V29 WORKER FENCING TESTS: PASS');
}
main().catch(e=>{console.error(e);process.exit(1)});
