import { strict as assert } from 'node:assert';
import { SelfHealingFailureRegistry, prepareSelfHealingDraft } from '../server/selfHealingLoop.ts';

const registry = new SelfHealingFailureRegistry({ repeatThreshold: 3, windowMs: 60_000, maxEvidence: 2 });
const signal = {
  projectId: 'self-healing-project',
  missionId: 'mission-1',
  workerId: 'worker-1',
  code: 'WORKER_LEASE_LOST',
  message: 'worker lease lost while committing transaction 123',
  stack: 'Error: worker lease lost\n    at /home/ubuntu/project/server/worker.ts:140:22\n    at /home/ubuntu/project/server/worker.ts:160:22',
  timestamp: '2026-10-05T00:00:00.000Z',
};

const first = registry.observe(signal);
assert.equal(first.occurrences, 1);
assert.equal(registry.isRepeated(first), false);
const second = registry.observe({ ...signal, missionId: 'mission-2', timestamp: '2026-10-05T00:00:10.000Z' });
const repeated = registry.observe({ ...signal, missionId: 'mission-3', timestamp: '2026-10-05T00:00:20.000Z' });
assert.equal(second.fingerprint, repeated.fingerprint);
assert.equal(repeated.occurrences, 3);
assert.equal(repeated.evidence.length, 2);
assert.equal(registry.isRepeated(repeated), true);
assert.match(repeated.normalizedStack || '', /<path>/);

const blocked = prepareSelfHealingDraft({
  evidence: repeated,
  latestSignal: signal,
  operations: [{ type: 'UPDATE', target: 'server/worker.ts', content: 'safe patch' }],
  validation: [{ name: 'test', ok: false, summary: 'suite failed' }],
});
assert.equal(blocked.status, 'BLOCKED');
assert.equal(blocked.pushRequested, false);
assert.equal(blocked.mergeRequested, false);

const ready = prepareSelfHealingDraft({
  evidence: repeated,
  latestSignal: { ...signal, message: 'worker lease lost while committing transaction 999', stack: `${signal.stack}\ngithub_token_fixture_not_a_credential` },
  operations: [{ type: 'UPDATE', target: 'server/worker.ts', content: 'safe patch', expectedHash: 'before-hash' }],
  validation: [
    { name: 'typecheck', ok: true },
    { name: 'test', ok: true, summary: '79/79 passed' },
    { name: 'build', ok: true },
    { name: 'smoke', ok: true },
  ],
  baseBranch: 'main',
});
assert.equal(ready.status, 'DRAFT_READY');
assert.match(ready.branchName, /^auto-heal\/worker_lease_lost\//);
assert.match(ready.body, /draft-only/);
assert.doesNotMatch(ready.body, /github_pat_/);
assert.equal(ready.operations[0].target, 'server/worker.ts');
assert.match(ready.auditHash, /^[a-f0-9]{64}$/);
assert.throws(() => prepareSelfHealingDraft({ evidence: repeated, latestSignal: signal, operations: [{ type: 'UPDATE', target: '../outside.ts' }], validation: [] }), /INVALID_SELF_HEALING_TARGET/);

console.log('Self-healing loop milestone: PASS');
