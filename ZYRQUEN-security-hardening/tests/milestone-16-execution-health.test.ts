import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutionHealthSnapshot } from '../server/executionHealth.ts';
const receipts={valid:true,checked:2,invalid:[]} as const;
const webhook={valid:true,checked:2,invalid:[]} as const;
test('M16: healthy snapshot',()=>{const s=buildExecutionHealthSnapshot(receipts,webhook,'2026-10-05T00:00:00.000Z');assert.equal(s.status,'HEALTHY');assert.deepEqual(s.reasons,[]);});
test('M16: invalid receipt blocks',()=>{const s=buildExecutionHealthSnapshot({...receipts,valid:false,invalid:[{reason:'HASH'}]},webhook);assert.equal(s.status,'BLOCKED');assert.ok(s.reasons.includes('EXECUTION_RECEIPT_LEDGER_INVALID'));});
test('M16: invalid webhook ledger blocks',()=>{const s=buildExecutionHealthSnapshot(receipts,{...webhook,valid:false,invalid:[{reason:'HASH'}]});assert.equal(s.status,'BLOCKED');assert.ok(s.reasons.includes('WEBHOOK_DELIVERY_LEDGER_INVALID'));});
