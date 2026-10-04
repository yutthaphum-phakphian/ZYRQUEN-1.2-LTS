import { strict as assert } from 'node:assert';
import test from 'node:test';
import { SelfHealingCoordinator } from '../server/selfHealingLoop.ts';
import { registerSelfHealingReadOnlyRoutes } from '../src/server/selfHealingRoutes.ts';

const coordinator = new SelfHealingCoordinator({ repeatThreshold: 2, windowMs: 60_000 });
const signal = {
  projectId: 'alice.project-a',
  code: 'WORKER_LEASE_LOST',
  message: 'lease lost while committing run 123',
  stack: 'Error: lease lost\n at /home/ubuntu/project/server/worker.ts:12:3',
};
const first = coordinator.observe(signal);
coordinator.observe({ ...signal, message: 'lease lost while committing run 456' });
const draft = coordinator.prepareDraft({
  fingerprint: first.evidence.fingerprint,
  operations: [{ type: 'UPDATE', target: 'server/worker.ts', content: 'candidate', expectedHash: 'before' }],
  validation: [{ name: 'typecheck', ok: true }, { name: 'test', ok: true }],
});
coordinator.observe({ projectId: 'bob.project-b', code: 'TEST_FAILURE', message: 'test failed' });

const handlers = new Map<string, any>();
registerSelfHealingReadOnlyRoutes({
  get: (route, handler) => handlers.set(`GET ${route}`, handler),
  post: (route, handler) => handlers.set(`POST ${route}`, handler),
}, { coordinator });

async function call(route: string, userId: string | undefined, opts: { method?: 'GET' | 'POST'; params?: Record<string, string>; query?: Record<string, unknown>; body?: Record<string, unknown> } = {}) {
  const method = opts.method || 'GET';
  const handler = handlers.get(`${method} ${route}`);
  assert.ok(handler, `route registered: ${route}`);
  let status = 200;
  let body: any;
  const res: any = { status(code: number) { status = code; return res; }, json(value: unknown) { body = value; return res; } };
  await handler({ userId, params: opts.params || {}, query: opts.query || {}, body: opts.body || {} }, res);
  return { status, body };
}

test('routes require a valid authenticated user', async () => {
  for (const userId of [undefined, '', '../alice', 'alice.b']) {
    assert.equal((await call('/api/self-healing/failures', userId)).status, 401);
    assert.equal((await call('/api/self-healing/drafts', userId)).status, 401);
  }
});

test('failure list is namespace-isolated and detail is sanitized', async () => {
  const list = await call('/api/self-healing/failures', 'alice');
  assert.equal(list.status, 200);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.failures[0].project, 'project-a');
  assert.equal(list.body.failures[0].repeated, true);
  assert.equal(list.body.failures[0].normalizedStack, undefined);

  const detail = await call('/api/self-healing/failures/:fingerprint', 'alice', { params: { fingerprint: first.evidence.fingerprint } });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.failure.project, 'project-a');
  assert.match(detail.body.failure.normalizedStack, /<path>/);
  assert.equal((await call('/api/self-healing/failures/:fingerprint', 'bob', { params: { fingerprint: first.evidence.fingerprint } })).status, 404);
  assert.equal((await call('/api/self-healing/failures/:fingerprint', 'alice', { params: { fingerprint: 'bad' } })).status, 404);
});

test('draft list/detail is namespace-isolated and read-only', async () => {
  const list = await call('/api/self-healing/drafts', 'alice');
  assert.equal(list.status, 200);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.drafts[0].draftId, draft.draftId);
  assert.equal(list.body.drafts[0].pushRequested, false);
  assert.equal(list.body.drafts[0].mergeRequested, false);

  const detail = await call('/api/self-healing/drafts/:draftId', 'alice', { params: { draftId: draft.draftId } });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.draft.project, 'project-a');
  assert.equal(detail.body.draft.operations[0].target, 'server/worker.ts');
  assert.equal((await call('/api/self-healing/drafts/:draftId', 'bob', { params: { draftId: draft.draftId } })).status, 404);
});

test('branch preview is dry-run and returns unified diff without creating a branch', async () => {
  const preview = await call('/api/self-healing/drafts/:draftId/branch-preview', 'alice', {
    method: 'POST',
    params: { draftId: draft.draftId },
    body: { workspaceRoot: process.cwd(), provider: 'github', owner: 'alice', repository: 'project-a' },
  });
  assert.equal(preview.status, 200);
  assert.equal(preview.body.preview.mode, 'DRY_RUN');
  assert.equal(preview.body.preview.status, 'BLOCKED');
  assert.equal(preview.body.preview.branchCreated, false);
  assert.equal(preview.body.preview.pullRequestCreated, false);
  assert.match(preview.body.preview.reason, /PATCH_EXPECTATION_MISMATCH/);
  assert.equal((await call('/api/self-healing/drafts/:draftId/branch-preview', 'bob', { method: 'POST', params: { draftId: draft.draftId }, body: { workspaceRoot: process.cwd() } })).status, 404);
});

test('project filter rejects malformed values and supports a public project name', async () => {
  assert.equal((await call('/api/self-healing/failures', 'alice', { query: { project: '../secret' } })).status, 400);
  const filtered = await call('/api/self-healing/failures', 'alice', { query: { project: 'project-a' } });
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.total, 1);
});

console.log('Self-healing read-only routes milestone: PASS');
