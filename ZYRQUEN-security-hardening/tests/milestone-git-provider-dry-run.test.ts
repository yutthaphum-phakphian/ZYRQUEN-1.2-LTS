import { strict as assert } from 'node:assert';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { SelfHealingCoordinator } from '../server/selfHealingLoop.ts';
import { DryRunGitProvider } from '../server/gitProviderDryRun.ts';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codevoice-git-dry-run-'));
const target = path.join(root, 'server.ts');
const before = 'export const state = "old";\n';
const after = 'export const state = "new";\n';
await fs.writeFile(target, before);
const expectedHash = crypto.createHash('sha256').update(before).digest('hex');

const coordinator = new SelfHealingCoordinator({ repeatThreshold: 2 });
const signal = { projectId: 'alice.project-a', code: 'BUILD_FAILURE', message: 'build failed repeatedly' };
const first = coordinator.observe(signal);
coordinator.observe(signal);
const draft = coordinator.prepareDraft({
  fingerprint: first.evidence.fingerprint,
  baseBranch: 'main',
  operations: [{ type: 'UPDATE', target: 'server.ts', content: after, expectedHash }],
  validation: [{ name: 'typecheck', ok: true }, { name: 'test', ok: true }, { name: 'build', ok: true }],
});

const provider = new DryRunGitProvider('github');
const preview = await provider.previewBranch({ workspaceRoot: root, draft, repository: { provider: 'github', owner: 'alice', name: 'project-a' } });

test('dry-run preview produces branch and unified diff metadata without mutation', async () => {
  assert.equal(preview.status, 'READY');
  assert.equal(preview.mode, 'DRY_RUN');
  assert.equal(preview.provider.provider, 'github');
  assert.equal(preview.baseBranch, 'main');
  assert.match(preview.proposedBranch, /^auto-heal\//);
  assert.equal(preview.changedFiles.length, 1);
  assert.match(preview.unifiedDiff, /-export const state = "old"/);
  assert.match(preview.unifiedDiff, /\+export const state = "new"/);
  assert.equal(preview.branchCreated, false);
  assert.equal(preview.pushRequested, false);
  assert.equal(preview.pullRequestCreated, false);
  assert.equal(await fs.readFile(target, 'utf8'), before);
});

test('provider rejects real branch and pull-request mutations', async () => {
  await assert.rejects(() => provider.createBranch(), /DRY_RUN_ONLY/);
  await assert.rejects(() => provider.createPullRequest(), /DRY_RUN_ONLY/);
});

test('expected-hash mismatch blocks preview and leaves workspace unchanged', async () => {
  const mismatched = { ...draft, operations: [{ ...draft.operations[0], expectedHash: '0'.repeat(64) }] };
  const blocked = await provider.previewBranch({ workspaceRoot: root, draft: mismatched, repository: { provider: 'github', owner: 'alice', name: 'project-a' } });
  assert.equal(blocked.status, 'BLOCKED');
  assert.match(blocked.reason || '', /PATCH_EXPECTATION_MISMATCH/);
  assert.equal(await fs.readFile(target, 'utf8'), before);
});

test.after(async () => { await fs.rm(root, { recursive: true, force: true }); });
console.log('Git provider dry-run milestone: PASS');
