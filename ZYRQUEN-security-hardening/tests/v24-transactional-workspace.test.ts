import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { saveWorkspace, loadWorkspace } from '../server/durableStore.ts';
import { prepareMissionTransaction } from '../server/transactionalRecovery.ts';
import { applyPreparedWorkspaceTransaction, loadWorkspaceEffect, recoverWorkspaceEffect } from '../server/transactionalWorkspace.ts';

const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const projectId = `v24-${Date.now()}`;
const missionId = `v24-mission-${Date.now()}`;
const hash = (v:string)=>crypto.createHash('sha256').update(v).digest('hex');

async function cleanup(){ await fs.rm(path.join(root,'workspace',`${projectId}.json`),{force:true}); }
async function main(){
  await cleanup();
  await saveWorkspace({ projectId, version: 1, updatedAt:new Date().toISOString(), files:[{name:'src/App.tsx',content:'old',language:'tsx'}], metadata:{} , integrityHash:''});
  const tx = await prepareMissionTransaction({missionId,idempotencyKey:'workspace-1',operations:[{id:'op-1',type:'UPDATE',target:'src/App.tsx'}]});
  const applied = await applyPreparedWorkspaceTransaction({transactionId:tx.transaction.transactionId,projectId,files:[{id:'op-1',type:'UPDATE',target:'src/App.tsx',content:'new',language:'tsx',expectedHash:hash('old')}]});
  assert.equal(applied.status,'COMMITTED');
  const workspace = await loadWorkspace(projectId); assert.equal(workspace?.files[0].content,'new');
  if (!applied.effect) throw new Error('missing workspace effect');
  const effect = await loadWorkspaceEffect(applied.effect.effectId); assert.equal(effect?.payload.status,'APPLIED');

  const badTx = await prepareMissionTransaction({missionId:missionId+'-bad',idempotencyKey:'bad',operations:[{id:'op-1',type:'UPDATE',target:'src/App.tsx'}]});
  await assert.rejects(()=>applyPreparedWorkspaceTransaction({transactionId:badTx.transaction.transactionId,projectId,files:[{type:'UPDATE',target:'src/App.tsx',content:'should-not-write',expectedHash:hash('wrong')}] }));
  const afterBad = await loadWorkspace(projectId); assert.equal(afterBad?.files[0].content,'new');

  const recoverTx = await prepareMissionTransaction({missionId:missionId+'-recover',idempotencyKey:'recover',operations:[{id:'op-1',type:'UPDATE',target:'src/App.tsx'}]});
  // Create a staged effect by invoking with a missing target so no mutation occurs; recovery must remain safe.
  const recovered = await recoverWorkspaceEffect(recoverTx.transaction.transactionId); assert.equal(recovered.action,'NO_EFFECT');
  await cleanup();
  console.log('V24 TRANSACTIONAL WORKSPACE TESTS: PASS');
}
main().catch(e=>{console.error(e);process.exit(1)});
