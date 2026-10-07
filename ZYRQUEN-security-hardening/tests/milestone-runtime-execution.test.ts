import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.join(process.cwd(), `.milestone-runtime-execution-${process.pid}`);
process.env.CODEVOICE_DURABLE_ROOT = root;
process.env.CODEVOICE_SUPERVISOR_MEMBER_ID = `gateway-test-${process.pid}`;
await fs.rm(root, { recursive: true, force: true });

const { RuntimeExecutionGateway } = await import('../server/runtimeExecutionGateway.ts');
const gateway = new RuntimeExecutionGateway();

const result = await gateway.dispatch({
  goal: 'ตรวจสอบสถานะโปรเจกต์และรันทดสอบจริง',
  context: { projectId: 'gateway-test', description: '', framework: 'unknown', files: [{ name: 'package.json', content: '{"scripts":{"test":"echo test"}}', language: 'json' }] },
  priority: 'HIGH',
  maxAttempts: 2,
  autoStart: true,
});

assert.ok(result.mission.missionId);
assert.equal(result.queue.status, 'QUEUED');
assert.ok(result.runtime.controlPlane);
assert.ok(['HEALTHY', 'DEGRADED', 'RECOVERY_REQUIRED', 'STANDBY'].includes(result.runtime.health));

const inspected = await gateway.inspect(result.mission.missionId);
assert.equal(inspected.mission.missionId, result.mission.missionId);
assert.equal(inspected.mission.goal, result.mission.goal);

await gateway.stop();
for (let attempt = 0; attempt < 10; attempt += 1) {
  try {
    await fs.rm(root, { recursive: true, force: true });
    break;
  } catch (error: any) {
    if (error?.code !== 'ENOTEMPTY' || attempt === 9) throw error;
    await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
  }
}
console.log('Runtime execution gateway milestone: PASS');
