import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveDurableRecord, appendMissionEvent, verifyMissionEventJournal, loadDurableRecord } from '../server/durableStore.ts';
import { inspectMissionRecovery, resumeMissionFromDurableState, recoverAllMissions } from '../server/missionRecoveryOrchestrator.ts';
import type { AutonomousMission } from '../src/tools/autonomousMissionEngine.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const missionId = `v27-recovery-${Date.now()}`;
const mission = (status: AutonomousMission['status']): AutonomousMission => ({ missionId, executionId:'exec-v27', goal:'recover mission', status, tasks:[{ taskId:'task-1', type:'RUN_TEST', title:'test', description:'test', dependencies:[], priority:'HIGH', status:'RUNNING', inputs:{}, retryCount:0, maxRetries:3, affectedFiles:[], validationCriteria:[], parallelSafe:true }], currentTaskId:'task-1', progress:0, context:{objective:'recover mission',relevantFiles:[],budget:16000,used:0,summaries:[]},checkpoints:[],snapshots:[],errors:[],recoveryAttempts:0,maxRecoveryAttempts:3,events:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});

async function main(){
  await fs.rm(root,{recursive:true,force:true});
  const m=mission('RUNNING');
  await saveDurableRecord('mission',missionId,m,1);
  await appendMissionEvent({eventId:'c1',missionId,type:'MISSION_CREATED',timestamp:new Date().toISOString(),status:'CREATED',summary:'created'});
  await appendMissionEvent({eventId:'c2',missionId,type:'TASK_STARTED',timestamp:new Date().toISOString(),status:'RUNNING',taskId:'task-1',summary:'started'});
  const candidate=await inspectMissionRecovery(missionId);
  assert.equal(candidate.action,'RESUME_READY');
  const resumed=await resumeMissionFromDurableState(missionId);
  assert.equal(resumed.mission?.status,'RUNNING');
  assert.equal(resumed.mission?.currentTaskId,'task-1');
  const stored=await loadDurableRecord<AutonomousMission>('mission',missionId);
  assert.equal(stored?.payload.status,'RUNNING');
  assert.equal((await verifyMissionEventJournal(missionId)).valid,true);

  const blockedId=`${missionId}-tampered`;
  const blockedMission=mission('RECOVERING'); blockedMission.missionId=blockedId;
  await saveDurableRecord('mission',blockedId,blockedMission,1);
  await appendMissionEvent({eventId:'t1',missionId:blockedId,type:'MISSION_CREATED',timestamp:new Date().toISOString(),status:'CREATED',summary:'created'});
  const eventFile=path.join(root,'event',`${blockedId}.jsonl`); const raw=await fs.readFile(eventFile,'utf8'); const row=JSON.parse(raw.trim()); row.summary='TAMPERED'; await fs.writeFile(eventFile,JSON.stringify(row)+'\n','utf8');
  const blocked=await inspectMissionRecovery(blockedId); assert.equal(blocked.action,'BLOCKED'); assert.match(blocked.reason,/HASH_MISMATCH/);

  const sweep=await recoverAllMissions(); assert.ok(sweep.scanned>=2); assert.ok(sweep.blocked>=1);
  await fs.rm(root,{recursive:true,force:true});
  console.log('V27 RECOVERY ORCHESTRATOR TESTS: PASS');
}
main().catch(e=>{console.error(e);process.exit(1)});
