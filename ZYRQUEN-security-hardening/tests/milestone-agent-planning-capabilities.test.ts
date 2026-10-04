import assert from 'node:assert/strict';
import { listAgentCapabilities, resolveCapabilities } from '../server/agentCapabilityRegistry.ts';
import { createAgentExecutionPlan } from '../server/agentPlanningLayer.ts';

const registry = listAgentCapabilities();
assert.ok(registry.capabilities.length >= 8);
assert.equal(registry.auditHash.length, 64);

const denied = resolveCapabilities(['repair.apply'], 'MEDIUM');
assert.equal(denied.allowed.length, 0);
assert.equal(denied.denied[0]?.reason, 'RISK_CEILING_EXCEEDED');

const plan = createAgentExecutionPlan({ projectId: 'planning-test', goal: 'repair and verify workspace', maxRisk: 'HIGH' });
assert.equal(plan.status, 'READY');
assert.ok(plan.steps.length >= 6);
for (let i = 1; i < plan.steps.length; i += 1) assert.ok(plan.steps[i].dependsOn.length >= 1);
assert.equal(plan.auditHash.length, 64);
assert.ok(plan.steps.some(s => s.kind === 'APPROVAL'));
assert.ok(plan.steps.some(s => s.kind === 'REVERIFY'));

const blocked = createAgentExecutionPlan({ projectId: 'planning-test', goal: 'critical operation', capabilities: ['repair.apply'], maxRisk: 'MEDIUM' });
assert.equal(blocked.status, 'BLOCKED');
assert.equal(blocked.deniedCapabilities[0]?.reason, 'RISK_CEILING_EXCEEDED');

console.log('Agent planning + capability registry milestone: PASS');
