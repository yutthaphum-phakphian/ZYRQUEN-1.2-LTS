import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutionHealthSnapshot } from '../server/executionHealth.ts';
import { evaluateExecutionHealthGate } from '../server/executionHealthGate.ts';
import { buildExecutionRecoveryPlan } from '../server/executionRecoveryPlan.ts';

const good={valid:true,checked:1,invalid:[]};

test('M17: healthy execution is allowed',()=>{
  const s=buildExecutionHealthSnapshot(good,good,'2026-10-05T00:00:00.000Z');
  const g=evaluateExecutionHealthGate(s,'2026-10-05T00:00:01.000Z');
  assert.equal(g.decision,'ALLOW');
  assert.deepEqual(g.reasons,[]);
});

test('M17: corrupt receipt blocks and creates targeted recovery',()=>{
  const s=buildExecutionHealthSnapshot({...good,valid:false,invalid:[{reason:'HASH'}]},good);
  const g=evaluateExecutionHealthGate(s);
  const r=buildExecutionRecoveryPlan(s);
  assert.equal(g.decision,'BLOCK');
  assert.deepEqual(r.actions,['REBUILD_RECEIPT_LEDGER']);
  assert.equal(r.required,true);
});

test('M17: corrupt webhook ledger blocks targeted recovery',()=>{
  const s=buildExecutionHealthSnapshot(good,{...good,valid:false,invalid:[{reason:'HASH'}]});
  const r=buildExecutionRecoveryPlan(s);
  assert.deepEqual(r.actions,['REBUILD_WEBHOOK_LEDGER']);
});
