import assert from 'node:assert/strict';
import test from 'node:test';
import { GitHubPullRequestAutomation } from '../server/gitPullRequestAutomation.ts';
import { InMemoryPRExecutionLedger } from '../server/prExecutionLedger.ts';
import { previewDeveloperPatch } from '../server/developerPatchEngine.ts';
import fs from 'node:fs/promises';

test('milestone 8 recovers an already-created remote PR instead of duplicating it', async () => {
  const root = await fs.mkdtemp('/tmp/m8-pr-');
  try {
    await fs.writeFile(`${root}/server.ts`, 'old\n');
    const expectedHash = (await import('node:crypto')).createHash('sha256').update('old\n').digest('hex');
    const draft: any = { status:'DRAFT_READY', branchName:'auto-heal/recover', baseBranch:'main', title:'fix', body:'body', operations:[{type:'UPDATE',target:'server.ts',content:'new\n',expectedHash}], draftId:'d-m8' };
    const preview = await previewDeveloperPatch({workspaceRoot:root,operations:draft.operations,sourcePlanId:draft.draftId});
    let pulls = 0, refs = 0;
    const api:any = { request: async (method:string,url:string) => {
      if(url.includes('/git/ref/heads/main')) return {object:{sha:'base'}};
      if(url.includes('/git/commits/base')) return {sha:'base',tree:{sha:'tree'}};
      if(url.includes('/git/ref/heads/auto-heal')) { refs++; return {object:{sha:'existing'}}; }
      if(url.includes('/pulls?')) { pulls++; return [{number:17,html_url:'https://github.com/a/b/pull/17',body:`body\n\n<!-- ZYRQUEN-AUTOHEAL patchHash=${preview.patchHash} -->`,head:{ref:'auto-heal/recover',sha:'existing'},base:{ref:'main'}}]; }
      throw new Error(`UNEXPECTED ${method} ${url}`);
    }};
    const automation = new GitHubPullRequestAutomation(api,{getToken:async()=> 't'},new InMemoryPRExecutionLedger());
    const result = await automation.createPullRequest({workspaceRoot:root,draft,repository:{provider:'github',owner:'a',name:'b'},approved:true,patchHash:preview.patchHash});
    assert.equal(result.status,'CREATED');
    assert.equal(result.pullRequestNumber,17);
    assert.equal(refs,1);
    assert.equal(pulls,1);
    assert.equal(result.patchHash, preview.patchHash);
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});

test('milestone 8 blocks an existing branch when no matching PR can be reconciled', async () => {
  const root = await fs.mkdtemp('/tmp/m8-pr-');
  try {
    await fs.writeFile(`${root}/server.ts`, 'old\n');
    const expectedHash = (await import('node:crypto')).createHash('sha256').update('old\n').digest('hex');
    const draft: any = { status:'DRAFT_READY', branchName:'auto-heal/ambiguous', baseBranch:'main', title:'fix', body:'body', operations:[{type:'UPDATE',target:'server.ts',content:'new\n',expectedHash}], draftId:'d-m8b' };
    const preview = await previewDeveloperPatch({workspaceRoot:root,operations:draft.operations,sourcePlanId:draft.draftId});
    const api:any = { request: async (_m:string,url:string) => { if(url.includes('/git/ref/heads/main')) return {object:{sha:'base'}}; if(url.includes('/git/commits/base')) return {sha:'base',tree:{sha:'tree'}}; if(url.includes('/git/ref/heads/auto-heal')) return {object:{sha:'existing'}}; if(url.includes('/pulls?')) return []; throw new Error(url); } };
    const automation = new GitHubPullRequestAutomation(api,{getToken:async()=> 't'},new InMemoryPRExecutionLedger());
    const result = await automation.createPullRequest({workspaceRoot:root,draft,repository:{provider:'github',owner:'a',name:'b'},approved:true,patchHash:preview.patchHash});
    assert.equal(result.status,'BLOCKED');
    assert.equal(result.reason,'GIT_BRANCH_ALREADY_EXISTS_REQUIRES_RECONCILIATION');
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});
