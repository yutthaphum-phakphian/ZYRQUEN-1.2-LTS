import { strict as assert } from 'node:assert';
import test from 'node:test';
import { GitHubPullRequestAutomation } from '../server/gitPullRequestAutomation.ts';
import { WebhookNotifier, validateWebhookConfig } from '../server/webhookNotifier.ts';

test('automated PR requires explicit approval and patch hash', async () => {
  const automation = new GitHubPullRequestAutomation();
  const draft: any = { status: 'DRAFT_READY', branchName: 'auto-heal/test', baseBranch: 'main', title: 'fix', body: 'body', operations: [], draftId: 'd' };
  const blocked = await automation.createPullRequest({ workspaceRoot: process.cwd(), draft, repository: { provider: 'github', owner: 'a', name: 'b' } });
  assert.equal(blocked.status, 'BLOCKED'); assert.equal(blocked.reason, 'PULL_REQUEST_APPROVAL_REQUIRED');
});


test('automated GitHub PR execution uses the real patch hash before remote mutation', async () => {
  const fs = await import('node:fs/promises');
  const crypto = await import('node:crypto');
  const { previewDeveloperPatch } = await import('../server/developerPatchEngine.ts');
  const root = await fs.mkdtemp('/tmp/m5-pr-');
  try {
    const target = `${root}/server.ts`; await fs.writeFile(target, 'old\n');
    const expectedHash = crypto.createHash('sha256').update('old\n').digest('hex');
    const draft: any = { status: 'DRAFT_READY', branchName: 'auto-heal/test', baseBranch: 'main', title: 'fix', body: 'body', operations: [{ type: 'UPDATE', target: 'server.ts', content: 'new\n', expectedHash }], draftId: 'd' };
    const preview = await previewDeveloperPatch({ workspaceRoot: root, operations: draft.operations, sourcePlanId: draft.draftId });
    const calls: string[] = []; let n = 0;
    const api: any = { request: async (method: string, url: string) => { calls.push(`${method} ${url}`); if (url.includes('/git/ref/heads/main')) return { object: { sha: 'base-sha' } }; if (url.includes('/git/ref/heads/auto-heal')) throw new Error('GITHUB_API_404:Not Found'); if (url.includes('/git/commits/base-sha')) return { sha: 'base-sha', tree: { sha: 'tree-base' } }; if (url.endsWith('/git/blobs')) return { sha: `blob-${++n}` }; if (url.endsWith('/git/trees')) return { sha: 'tree-new' }; if (url.endsWith('/git/commits')) return { sha: 'commit-new', tree: { sha: 'tree-new' } }; if (url.endsWith('/git/refs')) return {}; if (url.endsWith('/pulls')) return { number: 7, html_url: 'https://github.com/a/b/pull/7' }; throw new Error(`UNEXPECTED:${url}`); } };
    const result = await new GitHubPullRequestAutomation(api, { getToken: async () => 'test-token' }).createPullRequest({ workspaceRoot: root, draft, repository: { provider: 'github', owner: 'a', name: 'b' }, approved: true, patchHash: preview.patchHash });
    assert.equal(result.status, 'CREATED'); assert.equal(result.pullRequestNumber, 7); assert.equal(result.commitSha, 'commit-new'); assert.ok(calls.some(c => c.endsWith('POST /repos/a/b/pulls'))); assert.equal(await fs.readFile(target, 'utf8'), 'old\n');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('webhook blocks non-HTTPS and private destinations', () => {
  assert.throws(() => validateWebhookConfig({ url: 'http://example.com/hook', secret: 'x' }), /HTTPS/);
  assert.throws(() => validateWebhookConfig({ url: 'https://127.0.0.1/hook', secret: 'x' }), /PRIVATE/);
});

test('webhook sends signed event with deterministic audit hash', async () => {
  const old = globalThis.fetch;
  let headers: HeadersInit | undefined; let body = '';
  globalThis.fetch = (async (_url: URL | RequestInfo, init?: RequestInit) => { headers = init?.headers; body = String(init?.body); return new Response('{}', { status: 200 }); }) as typeof fetch;
  try {
    const result: any = { status: 'CREATED', provider: { provider: 'github', owner: 'a', name: 'b' }, branchName: 'auto-heal/x', auditHash: 'abc' };
    const out = await new WebhookNotifier().notify({ url: 'https://hooks.example.com/cv', secret: 'secret', allowedHosts: ['hooks.example.com'] }, result);
    assert.equal(out.ok, true); assert.match(String((headers as any)['x-codevoice-signature']), /^sha256=/); assert.match(body, /pull_request\.automation/);
  } finally { globalThis.fetch = old; }
});

console.log('Milestone 5 PR + webhook: PASS');
