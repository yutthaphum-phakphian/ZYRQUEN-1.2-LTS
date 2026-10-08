import { strict as assert } from 'node:assert';
import { AutonomousReliabilitySupervisor } from '../server/autonomousReliabilitySupervisor.ts';
import { SelfHealingCoordinator } from '../server/selfHealingLoop.ts';

let calls = 0;
const supervisor = new AutonomousReliabilitySupervisor({
  projectId: 'supervisor-test',
  missionId: `supervisor-test-${Date.now()}-${Math.random()}`,
  baseIntervalMs: 250,
  maxBackoffMs: 1000,
  maxCycles: 5,
  run: async () => {
    calls += 1;
    return {
      projectId: 'supervisor-test', outcome: calls === 1 ? 'HEALED' : 'HEALTHY',
      checkedRepairs: 1, recoveredRepairs: calls === 1 ? 1 : 0, healthyRepairs: 1,
      recoveryRequired: 0, corrupt: 0, governance: {} as any, actions: [],
      checkedAt: new Date().toISOString(), auditHash: 'a'.repeat(64),
    };
  },
});
assert.equal(supervisor.snapshot().state, 'STOPPED');
await supervisor.start();
const first = await supervisor.tick(true);
assert.equal(first?.outcome, 'HEALED');
assert.equal(supervisor.snapshot().state, 'RUNNING');
const blocked = await supervisor.tick(false);
assert.equal(blocked, null);
const second = await supervisor.tick(true);
assert.equal(second?.outcome, 'HEALTHY');
assert.match(supervisor.snapshot().auditHash, /^[a-f0-9]{64}$/);

let failures = 0;
const failing = new AutonomousReliabilitySupervisor({ projectId: 'backoff-test', missionId: `backoff-test-${Date.now()}-${Math.random()}`, baseIntervalMs: 250, run: async () => { failures += 1; throw new Error('SIMULATED_FAILURE'); } });
await failing.start();
assert.equal(await failing.tick(true), null);
assert.equal(failing.snapshot().state, 'BACKOFF');
assert.equal(failing.snapshot().consecutiveFailures, 1);
assert.equal(failures, 1);

let quarantineRuns = 0;
const quarantined = new AutonomousReliabilitySupervisor({ projectId: 'quarantine-test', missionId: `quarantine-test-${Date.now()}-${Math.random()}`, run: async () => { quarantineRuns += 1; return {
  projectId: 'quarantine-test', outcome: 'QUARANTINED', checkedRepairs: 1, recoveredRepairs: 0, healthyRepairs: 0,
  recoveryRequired: 0, corrupt: 1, governance: {} as any, actions: [], checkedAt: new Date().toISOString(), auditHash: 'b'.repeat(64)
}; }});
await quarantined.start();
await quarantined.tick(true);
assert.equal(quarantined.snapshot().state, 'QUARANTINED');
await assert.rejects(() => quarantined.start(), /QUARANTINED/);
assert.equal(quarantineRuns, 1);

console.log('Autonomous reliability supervisor milestone: PASS');


const persistedId = `persisted-${Date.now()}`;
const persisted = new AutonomousReliabilitySupervisor({
  projectId: 'persisted-supervisor-test',
  supervisorId: persistedId,
  missionId: `persisted-supervisor-test-${Date.now()}`,
  baseIntervalMs: 250,
  maxCycles: 3,
  run: async () => ({
    projectId: 'persisted-supervisor-test', outcome: 'HEALTHY', checkedRepairs: 0, recoveredRepairs: 0, healthyRepairs: 0,
    recoveryRequired: 0, corrupt: 0, governance: {} as any, actions: [], checkedAt: new Date().toISOString(), auditHash: 'c'.repeat(64),
  }),
});
await persisted.start();
await persisted.tick(true);
const restored = await AutonomousReliabilitySupervisor.restore({
  projectId: 'persisted-supervisor-test', supervisorId: persistedId, missionId: persisted.snapshot().missionId, run: async () => ({
    projectId: 'persisted-supervisor-test', outcome: 'HEALTHY', checkedRepairs: 0, recoveredRepairs: 0, healthyRepairs: 0,
    recoveryRequired: 0, corrupt: 0, governance: {} as any, actions: [], checkedAt: new Date().toISOString(), auditHash: 'd'.repeat(64),
  }),
});
assert.equal(restored.snapshot().cycle, 1);
assert.equal(restored.snapshot().state, 'RUNNING');
assert.equal(restored.snapshot().consecutiveFailures, 0);
await restored.clearPersistedState();

console.log('Autonomous reliability supervisor persistence: PASS');

const selfHealing = new SelfHealingCoordinator({ repeatThreshold: 3, windowMs: 60_000 });
const observedSupervisor = new AutonomousReliabilitySupervisor({
  projectId: 'self-healing-supervisor-test',
  missionId: `self-healing-supervisor-test-${Date.now()}`,
  baseIntervalMs: 250,
  maxBackoffMs: 250,
  onFailure: signal => { selfHealing.observe({ ...signal, code: 'WORKER_LEASE_LOST', message: 'worker lease lost while recovery pass failed' }); },
  run: async () => { throw new Error('worker lease lost while recovery pass failed'); },
});
await observedSupervisor.start();
await observedSupervisor.tick(true);
await observedSupervisor.tick(true);
await observedSupervisor.tick(true);
const observed = selfHealing.registry.list()[0];
assert.equal(observed?.occurrences, 3);
assert.equal(selfHealing.registry.isRepeated(observed!), true);
const candidate = selfHealing.prepareDraft({
  fingerprint: observed!.fingerprint,
  operations: [{ type: 'UPDATE', target: 'server/recovery.ts', content: 'candidate patch', expectedHash: 'before' }],
  validation: [{ name: 'typecheck', ok: true }, { name: 'test', ok: true }, { name: 'build', ok: true }, { name: 'smoke', ok: true }],
});
assert.equal(candidate.status, 'DRAFT_READY');
assert.equal(candidate.pushRequested, false);
assert.equal(candidate.mergeRequested, false);
console.log('Autonomous reliability → self-healing integration: PASS');
