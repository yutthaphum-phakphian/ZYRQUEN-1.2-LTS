import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.join(process.cwd(), `.milestone-runtime-${process.pid}`);
process.env.CODEVOICE_DURABLE_ROOT = root;

const { RuntimeControlPlane } = await import('../server/runtimeControlPlane.ts');
const { SupervisorControlPlane } = await import('../server/supervisorControlPlane.ts');

async function clean() { await fs.rm(root, { recursive: true, force: true }); }
await clean();

const cp = new SupervisorControlPlane({ memberId: `test-${process.pid}`, ttlMs: 4000, heartbeatMs: 1000 });
const runtime = new RuntimeControlPlane({ heartbeatMs: 1000 });

const joined = await cp.join();
assert.equal(joined.role, 'ACTIVE');
assert.ok(joined.epoch >= 1);

// Runtime uses the singleton control plane in production; this isolated test validates
// the control-plane contract independently and exercises the aggregate shape after durable state exists.
const snapshot = await runtime.snapshot();
assert.ok(snapshot.timestamp);
assert.ok(['HEALTHY', 'DEGRADED', 'RECOVERY_REQUIRED', 'STANDBY'].includes(snapshot.health));
assert.ok(snapshot.controlPlane.members.length >= 1);
assert.equal(snapshot.durableStore.root, root);

await cp.stop();
const afterRelease = await cp.inspect();
assert.equal(afterRelease.role, 'STANDBY');

await clean();
console.log('Runtime control plane milestone: PASS');
