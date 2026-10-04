import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { acquireMissionWorker, releaseMissionWorker, assertMissionWorkerFence } from '../server/missionWorkerSupervisor.ts';
import { executeCrashConsistentRepair, loadRepairCoordinator, recoverCrashConsistentRepair } from '../server/crashConsistentRepairCoordinator.ts';
import { previewDeveloperPatch } from '../server/developerPatchEngine.ts';

const terminal = new Set(['COMMITTED', 'ABORTED', 'RECOVERY_REQUIRED']);
const results: Array<{ scenario: string; action: string; status: string }> = [];

async function scenario(name: string, fault: 'AFTER_PREPARED'|'AFTER_APPLIED'|'BEFORE_TRANSACTION_COMMIT', mutate?: (root: string) => Promise<void>) {
  const root = await fs.mkdtemp(path.join(process.cwd(), '.recovery-chaos-'));
  const missionId = `chaos-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await fs.writeFile(path.join(root, 'app.js'), 'bad\n', 'utf8');
  const worker = await acquireMissionWorker(missionId, `worker-${name}`, 30000);
  const preview = await previewDeveloperPatch({ workspaceRoot: root, operations: [{ type: 'UPDATE', target: 'app.js', content: 'good\n' }], sourceVerificationId: `chaos-${name}` });
  const input = { repairId: `repair-${name}-${Date.now()}`, missionId, projectId: missionId, workspaceRoot: root, workerId: worker.workerId, leaseId: worker.leaseId, operations: [{ id: 'op-1', type: 'UPDATE' as const, target: 'app.js', content: 'good\n' }], patchHash: preview.patchHash };
  await assert.rejects(() => executeCrashConsistentRepair({ ...input, faultInjection: fault }));
  if (mutate) await mutate(root);
  const recovered = await recoverCrashConsistentRepair(input.repairId);
  const record = await loadRepairCoordinator(input.repairId);
  assert.ok(terminal.has(record?.payload.status ?? ''), `${name} produced non-terminal status`);
  assert.equal(record?.payload.status, recovered.action === 'ABORTED' ? 'ABORTED' : recovered.action === 'FINALIZED' ? 'COMMITTED' : 'RECOVERY_REQUIRED');
  const again = await recoverCrashConsistentRepair(input.repairId);
  assert.ok(['FINALIZED', 'ABORTED', 'RECOVERY_REQUIRED'].includes(again.action));
  results.push({ scenario: name, action: recovered.action, status: record!.payload.status });
  await releaseMissionWorker(missionId, worker.workerId).catch(() => undefined);
  await fs.rm(root, { recursive: true, force: true });
}

await scenario('prepared-crash', 'AFTER_PREPARED');
await scenario('applied-crash', 'AFTER_APPLIED');
await scenario('commit-crash', 'BEFORE_TRANSACTION_COMMIT');
await scenario('ambiguous-state', 'AFTER_APPLIED', async root => { await fs.writeFile(path.join(root, 'app.js'), 'unexpected\n', 'utf8'); });

// Recovery authority must not bypass a still-active valid worker.
{
  const root = await fs.mkdtemp(path.join(process.cwd(), '.recovery-chaos-authority-'));
  const missionId = `chaos-authority-${Date.now()}`;
  await fs.writeFile(path.join(root, 'app.js'), 'bad\n', 'utf8');
  const original = await acquireMissionWorker(missionId, `original-${Date.now()}`, 30000);
  const preview = await previewDeveloperPatch({ workspaceRoot: root, operations: [{ type: 'UPDATE', target: 'app.js', content: 'good\n' }], sourceVerificationId: 'chaos-authority' });
  const input = { repairId: `authority-${Date.now()}`, missionId, projectId: missionId, workspaceRoot: root, workerId: original.workerId, leaseId: original.leaseId, operations: [{ id: 'op-1', type: 'UPDATE' as const, target: 'app.js', content: 'good\n' }], patchHash: preview.patchHash };
  await assert.rejects(() => executeCrashConsistentRepair({ ...input, faultInjection: 'AFTER_PREPARED' }));
  const blocked = await recoverCrashConsistentRepair(input.repairId, `recovery-${Date.now()}`);
  assert.equal(blocked.action, 'RECOVERY_REQUIRED');
  await releaseMissionWorker(missionId, original.workerId);
  const takeover = await recoverCrashConsistentRepair(input.repairId, `recovery-${Date.now()}`);
  assert.equal(takeover.action, 'ABORTED');
  await fs.rm(root, { recursive: true, force: true });
  results.push({ scenario: 'active-worker-authority', action: takeover.action, status: 'ABORTED' });
}

// Fence proof: after lease expiry/turnover, the stale identity cannot continue.
{
  const missionId = `chaos-fence-${Date.now()}`;
  const first = await acquireMissionWorker(missionId, `stale-${Date.now()}`, 50);
  await new Promise(r => setTimeout(r, 1200));
  const second = await acquireMissionWorker(missionId, `replacement-${Date.now()}`, 30000);
  await assert.rejects(() => assertMissionWorkerFence(missionId, first.workerId, first.leaseId));
  await releaseMissionWorker(missionId, second.workerId);
  results.push({ scenario: 'stale-worker-fence', action: 'BLOCKED', status: 'FENCED' });
}

assert.ok(results.length >= 6);
assert.ok(results.every(r => r.status === 'COMMITTED' || r.status === 'ABORTED' || r.status === 'RECOVERY_REQUIRED' || r.status === 'FENCED'));
console.log(`Recovery chaos certification: PASS (${results.length} scenarios)`);
for (const r of results) console.log(`${r.scenario}: ${r.action}/${r.status}`);
