import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codevoice-v48-'));
process.env.CODEVOICE_DURABLE_ROOT = root;

const { SupervisorControlPlane } = await import('../server/supervisorControlPlane.ts');
const { inspectDurableLock, loadDurableRecord } = await import('../server/durableStore.ts');

const a = new SupervisorControlPlane({ ttlMs: 5000, heartbeatMs: 1000, memberId: 'supervisor-a' });
const b = new SupervisorControlPlane({ ttlMs: 5000, heartbeatMs: 1000, memberId: 'supervisor-b' });

const aj = await a.join();
assert.equal(aj.role, 'ACTIVE');
assert.ok(aj.fencingToken);
const bj = await b.join();
assert.equal(bj.role, 'STANDBY');
assert.equal(bj.activeMemberId, aj.memberId);

const hb = await a.heartbeat();
assert.equal(hb.role, 'ACTIVE');
assert.equal(hb.fencingToken, aj.fencingToken);

await a.stop();
const b2 = await b.acquireLeadership();
assert.equal(b2.role, 'ACTIVE');
assert.ok(b2.fencingToken);
assert.notEqual(b2.fencingToken, aj.fencingToken);
assert.ok(b2.epoch > aj.epoch);

const lock = await inspectDurableLock('worker-supervisor-control-plane');
assert.equal(lock?.owner, `${b2.memberId}-owner`);
const state = await loadDurableRecord<any>('worker-consistency-supervisor', 'control-plane-state');
assert.equal(state?.payload.activeMemberId, b2.memberId);
assert.equal(state?.payload.epoch, b2.epoch);

await b.stop();
console.log('V48 supervisor control plane tests: PASS');
