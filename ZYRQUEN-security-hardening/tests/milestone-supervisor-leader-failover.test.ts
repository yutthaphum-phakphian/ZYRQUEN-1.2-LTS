import { strict as assert } from 'node:assert';
import { AutonomousReliabilitySupervisor } from '../server/autonomousReliabilitySupervisor.ts';

const supervisorId = `leader-failover-${Date.now()}`;
const missionId = `leader-failover-mission-${Date.now()}`;
let runs = 0;
const make = () => new AutonomousReliabilitySupervisor({
  projectId: 'leader-failover-test', supervisorId, missionId, baseIntervalMs: 250,
  run: async () => {
    runs += 1;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { projectId: 'leader-failover-test', outcome: 'HEALTHY', checkedRepairs: 0, recoveredRepairs: 0,
      healthyRepairs: 0, recoveryRequired: 0, corrupt: 0, governance: {} as any, actions: [],
      checkedAt: new Date().toISOString(), auditHash: 'f'.repeat(64) };
  },
});

const a = make();
const b = make();
await a.start();
const [first, second] = await Promise.all([a.tick(true), b.tick(true)]);
assert.equal(runs, 1, 'only one supervisor instance may own the cycle');
assert.equal(Boolean(first) !== Boolean(second), true);

const restored = await AutonomousReliabilitySupervisor.restore({
  projectId: 'leader-failover-test', supervisorId, missionId,
  baseIntervalMs: 250, run: async () => ({ projectId: 'leader-failover-test', outcome: 'HEALTHY', checkedRepairs: 0,
    recoveredRepairs: 0, healthyRepairs: 0, recoveryRequired: 0, corrupt: 0, governance: {} as any, actions: [],
    checkedAt: new Date().toISOString(), auditHash: 'e'.repeat(64) }),
});
assert.equal(restored.snapshot().cycle, 1);
await restored.clearPersistedState();
console.log('Supervisor leader lease/failover milestone: PASS');
