import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
process.env.CODEVOICE_DURABLE_ROOT = await fs.mkdtemp(path.join(os.tmpdir(),'codevoice-governance-'));

const { saveAgentPolicy, loadAgentPolicy, decideAgentCapability } = await import('../server/agentPolicyEngine.ts');
const { createCoordination, claimCoordinationTask } = await import('../server/agentCoordination.ts');
const { collectRuntimeHealth, summarizeRuntimeHealth } = await import('../server/runtimeObservability.ts');
const { evaluateWorkspaceAdmission } = await import('../server/reconciliationAdmission.ts');
const { saveWorkspace } = await import('../server/durableStore.ts');

const projectId=`governance-pack-${Date.now()}`;
await saveAgentPolicy({projectId,grants:{agentA:{capabilities:['workspace.read','repair.preview']},agentB:{capabilities:['repair.apply'],maxRisk:'HIGH'}},deniedAgents:['blocked']});
const policy=await loadAgentPolicy(projectId);
assert(policy && policy.grants.agentA.capabilities.includes('workspace.read'));
assert.equal(decideAgentCapability(policy,'agentA','workspace.read').allowed,true);
assert.equal(decideAgentCapability(policy,'agentA','repair.apply').allowed,false);
assert.equal(decideAgentCapability(policy,'blocked','workspace.read').allowed,false);

const coord=await createCoordination({projectId,agentIds:['agentA','agentB'],tasks:[{taskId:'inspect',capability:'workspace.read'},{taskId:'apply',capability:'repair.apply',dependsOn:['inspect']}]});
await assert.rejects(()=>claimCoordinationTask(coord.coordinationId,'apply','agentB'),/TASK_DEPENDENCY_BLOCKED/);
await assert.doesNotReject(()=>claimCoordinationTask(coord.coordinationId,'inspect','agentA'));
await assert.rejects(()=>claimCoordinationTask(coord.coordinationId,'apply','agentB'),/TASK_DEPENDENCY_BLOCKED/);

const observations=await collectRuntimeHealth(50);
assert(observations.health && observations.health.auditHash.length===64);
assert.deepEqual(summarizeRuntimeHealth([{observationId:'1',category:'coordination',subjectId:'x',status:'COMPLETED',timestamp:new Date().toISOString(),metadata:{},hash:'x'}]).status,'HEALTHY');

const workspace={projectId,version:1,updatedAt:new Date().toISOString(),files:[{name:'README.md',content:'ok'}]};
await saveWorkspace(workspace as any);
const admitted=await evaluateWorkspaceAdmission({projectId,actualFiles:[{name:'README.md',content:'ok'}],agentId:'agentA'});
assert.equal(admitted.admission,'ADMITTED');
const blocked=await evaluateWorkspaceAdmission({projectId,actualFiles:[{name:'README.md',content:'changed'}],agentId:'agentA'});
assert.equal(blocked.admission,'BLOCKED');
assert.equal(blocked.requiresRepair,true);
console.log('Agent governance foundation pack: PASS');
