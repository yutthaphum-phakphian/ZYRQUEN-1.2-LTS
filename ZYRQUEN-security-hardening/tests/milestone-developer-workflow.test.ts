import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { verifyDeveloperWorkflow } from '../server/developerWorkflowVerification.ts';

const root = await fs.mkdtemp(path.join(process.cwd(), '.developer-workflow-test-'));
await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --version', build: 'node --version' } }), 'utf8');

const denied = await verifyDeveloperWorkflow({ workspaceRoot: root, approved: false });
assert.equal(denied.status, 'APPROVAL_REQUIRED');

const passed = await verifyDeveloperWorkflow({ workspaceRoot: root, approved: true });
assert.equal(passed.status, 'PASSED');
assert.equal(passed.repairRequired, false);
assert.equal(passed.steps.length, 3);
assert.equal(passed.steps[0].ok, true);
assert.equal(passed.steps[1].ok, true);
assert.equal(passed.steps[2].ok, true);
assert.match(passed.auditHash, /^[a-f0-9]{64}$/);

const failed = await verifyDeveloperWorkflow({ workspaceRoot: root, approved: true, testCommand: 'node -e "process.exit(7)"', runBuild: false });
assert.equal(failed.status, 'FAILED');
assert.equal(failed.repairRequired, true);
assert.equal(failed.steps[0].ok, false);

await fs.rm(root, { recursive: true, force: true });
console.log('Developer workflow verification milestone: PASS');
