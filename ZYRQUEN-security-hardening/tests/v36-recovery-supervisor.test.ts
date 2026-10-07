import assert from 'node:assert/strict';
import { RecoverySupervisor } from '../server/recoverySupervisor.ts';

const report = (id: string) => ({ startedAt:new Date().toISOString(), completedAt:new Date().toISOString(), scanned:1, recovered:1, skipped:0, blocked:0, items:[{commitId:id,transactionId:id,missionId:'m',projectId:'p',state:'APPLIED_PENDING_COMMIT',action:'RECOVERED' as const,reason:'COMMITTED',evidence:[]}] });

async function main() {
  let calls = 0;
  let gate: (() => void) | undefined;
  const supervisor = new RecoverySupervisor({ intervalMs:250, batchLimit:7, maxConcurrentCycles:1, sweep: async (limit) => { calls++; assert.equal(limit,7); if (calls === 1) await new Promise<void>(resolve => { gate = resolve; }); return report(`c${calls}`); } });

  const started = supervisor.start();
  assert.equal(started.state, 'RUNNING');
  const first = supervisor.tick();
  const overlap = await supervisor.tick();
  assert.equal(overlap, null);
  gate?.();
  assert.equal((await first)?.recovered, 1);
  assert.equal(supervisor.snapshot().cycle, 1);

  const second = await supervisor.tick();
  assert.equal(second?.items[0].commitId, 'c2');
  assert.equal(supervisor.snapshot().cycle, 2);

  const stopped = supervisor.stop();
  assert.equal(stopped.state, 'STOPPED');
  await supervisor.shutdown();
  assert.equal(supervisor.snapshot().state, 'STOPPED');

  let failed = false;
  const broken = new RecoverySupervisor({ sweep: async () => { throw new Error('TEST_FAILURE'); } });
  try { await broken.tick(); } catch { failed = true; }
  assert.equal(failed, true);
  assert.equal(broken.snapshot().state, 'FAILED');
  assert.equal(broken.snapshot().lastError, 'TEST_FAILURE');

  console.log('V36 RECOVERY SUPERVISOR TESTS: PASS');
}
main().catch(e => { console.error(e); process.exit(1); });
