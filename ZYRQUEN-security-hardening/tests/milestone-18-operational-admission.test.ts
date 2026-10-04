import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOperationalAdmission } from '../server/operationalAdmission.ts';
import type { ExecutionHealthGateResult } from '../server/executionHealthGate.ts';
import type { ExecutionRecoveryPlan } from '../server/executionRecoveryPlan.ts';

const gate:ExecutionHealthGateResult={decision:'ALLOW',reasons:[],checkedAt:'2026-10-05T00:00:00.000Z',sourceStatus:'HEALTHY'};
const clear:ExecutionRecoveryPlan={required:false,actions:[],reasons:[],generatedAt:'2026-10-05T00:00:00.000Z'};

test('M18: healthy system is admitted',()=>{ const a=evaluateOperationalAdmission(gate,clear); assert.equal(a.decision,'ADMITTED'); assert.equal(a.recoveryRequired,false); });
test('M18: blocked gate cannot be admitted',()=>{ const a=evaluateOperationalAdmission({...gate,decision:'BLOCK',reasons:['EXECUTION_RECEIPT_LEDGER_INVALID']},{required:true,actions:['REBUILD_RECEIPT_LEDGER'],reasons:['EXECUTION_RECEIPT_LEDGER_INVALID'],generatedAt:gate.checkedAt}); assert.equal(a.decision,'BLOCKED'); assert.equal(a.recoveryRequired,true); });
test('M18: recovery requirement alone blocks admission',()=>{ const a=evaluateOperationalAdmission(gate,{required:true,actions:['STOP_AUTOMATION'],reasons:['RECOVERY_REQUIRED'],generatedAt:gate.checkedAt}); assert.equal(a.decision,'BLOCKED'); assert.deepEqual(a.reasons,['RECOVERY_REQUIRED']); });
