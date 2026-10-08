import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codevoice-agent-reliability-'));
process.env.CODEVOICE_DURABLE_ROOT = root;

const { acquireMissionWorker, releaseMissionWorker } = await import('../server/missionWorkerSupervisor.ts');
const { executeCrashConsistentRepair, loadRepairCoordinator } = await import('../server/crashConsistentRepairCoordinator.ts');
const { previewDeveloperPatch } = await import('../server/developerPatchEngine.ts');
const { runAgentReliabilityPass } = await import('../server/agentReliabilityControlLoop.ts');
const missionId = `reliability-${Date.now()}`;
const projectId = missionId;
await fs.writeFile(path.join(root, 'app.js'), 'bad\n', 'utf8');
const worker = await acquireMissionWorker(missionId, `worker-${Date.now()}`, 30000);
const preview = await previewDeveloperPatch({ workspaceRoot: root, operations: [{ type: 'UPDATE', target: 'app.js', content: 'good\n' }], sourceVerificationId: 'reliability-test' });
const repairId = `repair-${Date.now()}`;

await assert.rejects(() => executeCrashConsistentRepair({
  repairId, missionId, projectId, workspaceRoot: root, workerId: worker.workerId, leaseId: worker.leaseId,
  operations: [{ id: 'op-1', type: 'UPDATE', target: 'app.js', content: 'good\n' }], patchHash: preview.patchHash,
  faultInjection: 'AFTER_APPLIED',
}));

const pending = await loadRepairCoordinator(repairId);
assert.equal(pending?.payload.status, 'APPLIED');
await releaseMissionWorker(missionId, worker.workerId);

const beforePass = await runAgentReliabilityPass({ projectId, autoRecover: false });
assert.equal(beforePass.outcome, 'DEGRADED');
assert.equal(beforePass.recoveryRequired, 1);
const healed = await runAgentReliabilityPass({ projectId, recoveryWorkerId: `recovery-${Date.now()}`, autoRecover: true });
assert.equal(healed.outcome, 'HEALED');
assert.equal(healed.recoveredRepairs, 1);
assert.equal(healed.recoveryRequired, 0);
assert.equal(healed.corrupt, 0);
assert.match(healed.auditHash, /^[a-f0-9]{64}$/);

const stable = await runAgentReliabilityPass({ projectId, autoRecover: false });
assert.equal(stable.outcome, 'HEALTHY');
assert.equal(stable.healthyRepairs, 1);

await fs.rm(root, { recursive: true, force: true });
console.log('Agent reliability control loop milestone: PASS');
