import { strict as assert } from 'node:assert';
import { AutonomousReliabilitySupervisor } from '../server/autonomousReliabilitySupervisor.ts';

const supervisorId = `heartbeat-${Date.now()}`;
const missionId = `heartbeat-mission-${Date.now()}`;
let started = false;
const supervisor = new AutonomousReliabilitySupervisor({
  projectId: 'heartbeat-test', supervisorId, missionId, baseIntervalMs: 250,
  run: async () => {
    started = true;
    await new Promise((resolve) => setTimeout(resolve, 80));
    return { projectId: 'heartbeat-test', outcome: 'HEALTHY', checkedRepairs: 0, recoveredRepairs: 0,
      healthyRepairs: 0, recoveryRequired: 0, corrupt: 0, governance: {} as any, actions: [],
      checkedAt: new Date().toISOString(), auditHash: 'h'.repeat(64) };
  },
});
await supervisor.start();
const result = await supervisor.tick(true);
assert.equal(started, true);
assert.equal(result?.outcome, 'HEALTHY');
const snapshot = supervisor.snapshot();
assert.equal(Boolean(snapshot.lastHeartbeatAt), true);
assert.equal(snapshot.leaderLeaseExpiresAt, undefined);
await supervisor.clearPersistedState();
console.log('Supervisor heartbeat/lease renewal milestone: PASS');
