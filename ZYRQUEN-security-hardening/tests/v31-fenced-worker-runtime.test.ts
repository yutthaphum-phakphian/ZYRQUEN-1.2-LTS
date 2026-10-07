import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveDurableRecord, loadDurableRecord, releaseDurableLock } from '../server/durableStore.ts';
import { acquireMissionWorker, releaseMissionWorker } from '../server/missionWorkerSupervisor.ts';
import { runFencedMissionWorker } from '../server/fencedWorkerRuntime.ts';
import type { AutonomousMission, AutonomousMissionAdapter } from '../src/tools/autonomousMissionEngine.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const missionId = `v31-${Date.now()}`;
const mission = (): AutonomousMission => ({ missionId, executionId:'exec-v31', goal:'run fenced worker loop', status:'CREATED', tasks:[{taskId:'task-1',type:'READ',title:'read',description:'read',dependencies:[],priority:'HIGH',status:'READY',inputs:{},retryCount:0,maxRetries:0,affectedFiles:[],validationCriteria:[],parallelSafe:false}],progress:0,context:{objective:'fence',relevantFiles:[],budget:1000,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});

async function main(){
  await fs.rm(root,{recursive:true,force:true});
  await saveDurableRecord('mission',missionId,mission(),1);
  let executions=0;
  const adapter: AutonomousMissionAdapter = { executeTask: async () => { executions++; return {success:true,output:{ok:true},evidence:['real-adapter-execution']}; } };
  const result = await runFencedMissionWorker(missionId,'worker-v31',adapter,{ttlMs:5000,maxSteps:4,heartbeatMs:1000});
  assert.equal(result.fenceLost,false);
  assert.equal(result.released,true);
  assert.equal(result.steps,1);
  assert.equal(executions,1);
  assert.equal(result.status,'COMPLETED');
  const persisted = await loadDurableRecord<AutonomousMission>('mission',missionId);
  assert.equal(persisted?.payload.tasks[0].status,'COMPLETED');
  assert.equal(persisted?.payload.progress,100);

  const staleId = `${missionId}-stale`;
  await saveDurableRecord('mission',staleId,{...mission(),missionId:staleId},1);
  let staleLockResource = '';
  const staleAdapter: AutonomousMissionAdapter = { executeTask: async () => {
    staleLockResource = `mission-worker-${staleId}`;
    await releaseDurableLock(staleLockResource,'worker-stale');
    return {success:true,output:{ok:true},evidence:['mutation-ran-before-fence-check']};
  } };
  await assert.rejects(() => runFencedMissionWorker(staleId,'worker-stale',staleAdapter,{ttlMs:5000,maxSteps:1}), /WORKER_FENCE_LOST|WORKER_LEASE_EXPIRED/);

  const conflictId = `${missionId}-conflict`;
  const m2 = {...mission(),missionId:conflictId};
  await saveDurableRecord('mission',conflictId,m2,1);
  const held = await acquireMissionWorker(conflictId,'other-worker',5000);
  await assert.rejects(() => runFencedMissionWorker(conflictId,'worker-v31',adapter,{ttlMs:5000,maxSteps:1}), /LOCK_ALREADY_HELD|RESOURCE_LOCKED|WORKER/);
  await releaseMissionWorker(conflictId,held.workerId);
  await fs.rm(root,{recursive:true,force:true});
  console.log('V31 FENCED WORKER RUNTIME TESTS: PASS');
}
main().catch(e=>{console.error(e);process.exit(1)});
