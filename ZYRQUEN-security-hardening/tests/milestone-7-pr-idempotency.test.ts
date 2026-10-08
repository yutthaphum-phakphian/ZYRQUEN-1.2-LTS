import assert from 'node:assert/strict';
import test from 'node:test';
import { GitHubPullRequestAutomation } from '../server/gitPullRequestAutomation.ts';
import { InMemoryPRExecutionLedger } from '../server/prExecutionLedger.ts';
import { previewDeveloperPatch } from '../server/developerPatchEngine.ts';
import fs from 'node:fs/promises';

test('milestone 7 returns the recorded PR instead of duplicating remote mutation', async () => {
  const root = await fs.mkdtemp('/tmp/m7-pr-');
  try {
    await fs.writeFile(`${root}/server.ts`, 'old\n');
    const expectedHash = (await import('node:crypto')).createHash('sha256').update('old\n').digest('hex');
    const draft: any = { status:'DRAFT_READY', branchName:'auto-heal/test', baseBranch:'main', title:'fix', body:'body', operations:[{type:'UPDATE',target:'server.ts',content:'new\n',expectedHash}], draftId:'d-m7' };
    const preview = await previewDeveloperPatch({workspaceRoot:root,operations:draft.operations,sourcePlanId:draft.draftId});
    let calls = 0;
    const api:any = { request: async (_m:string,url:string) => { calls++; if(url.includes('/git/ref/heads/main')) return {object:{sha:'base'}}; if(url.includes('/git/ref/heads/auto-heal')) throw new Error('GITHUB_API_404:Not Found'); if(url.includes('/git/commits/base')) return {sha:'base',tree:{sha:'tree'}}; if(url.endsWith('/git/blobs')) return {sha:'blob'}; if(url.endsWith('/git/trees')) return {sha:'tree2'}; if(url.endsWith('/git/commits')) return {sha:'commit',tree:{sha:'tree2'}}; if(url.endsWith('/git/refs')) return {}; if(url.endsWith('/pulls')) return {number:9,html_url:'https://github.com/a/b/pull/9'}; throw new Error(url); } };
    const ledger = new InMemoryPRExecutionLedger();
    const make = () => new GitHubPullRequestAutomation(api,{getToken:async()=> 't'},ledger);
    const input:any = {workspaceRoot:root,draft,repository:{provider:'github',owner:'a',name:'b'},approved:true,patchHash:preview.patchHash};
    const first = await make().createPullRequest(input); const callsAfterFirst = calls;
    const second = await make().createPullRequest(input);
    assert.equal(first.status,'CREATED'); assert.equal(second.status,'CREATED'); assert.equal(second.pullRequestNumber,9); assert.equal(calls,callsAfterFirst);
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});

test('milestone 7 blocks concurrent duplicate execution', async () => {
  const ledger = new InMemoryPRExecutionLedger();
  const first = ledger.begin('same'); const second = ledger.begin('same');
  assert.equal(first.state,'NEW'); assert.equal(second.state,'IN_PROGRESS');
});
