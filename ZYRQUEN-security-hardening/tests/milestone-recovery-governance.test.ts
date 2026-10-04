import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { evaluateRecoveryGovernance, requireRecoveryAdmission } from '../server/recoveryGovernance.ts';

const root = path.join(process.cwd(), '.governance-test-workspace');
await fs.rm(root, { recursive: true, force: true });
await fs.mkdir(root, { recursive: true });
const projectId = `governance-project-${Date.now()}`;

const open = await evaluateRecoveryGovernance(projectId);
assert.equal(open.state, 'OPEN');
assert.equal(open.admission, 'ADMIT');
assert.equal(open.checkedRepairs, 0);

const admitted = await requireRecoveryAdmission({ projectId, reason: 'initial-admission' });
assert.equal(admitted.admission, 'ADMIT');
assert.match(admitted.auditHash, /^[a-f0-9]{64}$/);

const empty = await evaluateRecoveryGovernance(projectId);
assert.equal(empty.checkedRepairs, 0);
assert.equal(empty.state, 'OPEN');

await fs.rm(root, { recursive: true, force: true });
console.log('Recovery governance milestone: PASS');
