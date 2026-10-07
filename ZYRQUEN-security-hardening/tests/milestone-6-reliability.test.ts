import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWebhookConfig } from '../server/webhookNotifier.ts';
import { GitHubPullRequestAutomation } from '../server/gitPullRequestAutomation.ts';

test('milestone 6 rejects unsafe GitHub repository parts', async () => {
  const api = { request: async () => { throw new Error('SHOULD_NOT_CALL_API'); } } as any;
  const tokenProvider = { getToken: async () => 'token' };
  const automation = new GitHubPullRequestAutomation(api, tokenProvider);
  const draft: any = { draftId:'d1', status:'DRAFT_READY', branchName:'auto/fix', baseBranch:'main', title:'x', body:'x', rootCause:{fingerprint:'f',diagnosis:'TEST_FAILURE',occurrences:2,summary:'x'}, validation:[], operations:[], pushRequested:false, mergeRequested:false, auditHash:'a' };
  const result = await automation.createPullRequest({ workspaceRoot: process.cwd(), draft, repository:{provider:'github',owner:'bad/name',name:'repo'}, approved:true, patchHash:'x' });
  assert.equal(result.status, 'FAILED');
  assert.match(result.reason || '', /INVALID_GIT_OWNER/);
});

test('milestone 6 enforces webhook HTTPS and allowlist', () => {
  assert.throws(() => validateWebhookConfig({url:'http://example.com/hook',secret:'s'}), /WEBHOOK_HTTPS_REQUIRED/);
  assert.throws(() => validateWebhookConfig({url:'https://example.com/hook',secret:'s',allowedHosts:['other.example.com']}), /WEBHOOK_HOST_NOT_ALLOWLISTED/);
});

test('milestone 6 webhook retries transient 5xx and preserves delivery id', async () => {
  const { WebhookNotifier } = await import('../server/webhookNotifier.ts');
  const originalFetch = globalThis.fetch;
  let count = 0;
  let delivery = '';
  globalThis.fetch = async (_input, init) => {
    count++;
    const headers = new Headers(init?.headers);
    const current = headers.get('x-codevoice-delivery') || '';
    if (!delivery) delivery = current;
    assert.equal(current, delivery);
    return new Response('', { status: count === 1 ? 503 : 200 });
  };
  try {
    const result = await new WebhookNotifier().notify({ url:'https://example.com/hook', secret:'secret', maxRetries:1, baseRetryDelayMs:0 }, {status:'CREATED',provider:'github',repository:{provider:'github',owner:'o',name:'r'},branchName:'b',auditHash:'a'} as any);
    assert.equal(result.ok, true);
    assert.equal(result.attempts.length, 2);
    assert.equal(count, 2);
  } finally { globalThis.fetch = originalFetch; }
});
