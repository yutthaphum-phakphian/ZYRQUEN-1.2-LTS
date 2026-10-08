import assert from 'node:assert/strict';
import test from 'node:test';

const identity = {
  draftId:'self-heal-draft-1-deadbeef', provider:'github' as const, owner:'o', repository:'r',
  baseBranch:'main', branchName:'auto/fix', patchHash:'a'.repeat(64)
};
const pr: any = { status:'CREATED', provider:'github', repository:{provider:'github',owner:'o',name:'r'}, branchName:'auto/fix', patchHash:identity.patchHash, pullRequestNumber:7, pullRequestUrl:'https://github.com/o/r/pull/7', commitSha:'c'.repeat(40), auditHash:'p'.repeat(64) };
const hook: any = { ok:true, deliveryId:'delivery-m13-001', status:200, attempts:[{attempt:1,status:200}], auditHash:'h'.repeat(64) };

test('milestone 13 creates one durable execution receipt and completes it', async () => {
  const { InMemoryExecutionReceiptLedger, executionReceiptKey } = await import('../server/executionReceiptLedger.ts');
  const ledger = new InMemoryExecutionReceiptLedger();
  const begun = ledger.begin(identity);
  assert.equal(begun.state, 'NEW');
  const event = ledger.complete(executionReceiptKey(identity), { pullRequest: pr, webhook: hook, auditEventId:'audit-13-1' });
  assert.equal(event.status, 'COMPLETE');
  assert.equal(event.pullRequest?.pullRequestNumber, 7);
  assert.equal(event.webhook?.deliveryId, 'delivery-m13-001');
  assert.equal(event.auditEventId, 'audit-13-1');
  assert.equal(event.receiptHash.length, 64);
  const replay = ledger.begin(identity);
  assert.equal(replay.state, 'COMPLETE');
  assert.deepEqual(replay.receipt, event);
});

test('milestone 13 uses a stable identity key and separates different patches', async () => {
  const { executionReceiptKey, InMemoryExecutionReceiptLedger } = await import('../server/executionReceiptLedger.ts');
  const other = { ...identity, patchHash:'b'.repeat(64) };
  assert.notEqual(executionReceiptKey(identity), executionReceiptKey(other));
  const ledger = new InMemoryExecutionReceiptLedger();
  assert.equal(ledger.begin(identity).state, 'NEW');
  assert.equal(ledger.begin(other).state, 'NEW');
});

test('milestone 13 marks receipt failed when webhook delivery is not successful', async () => {
  const { InMemoryExecutionReceiptLedger, executionReceiptKey } = await import('../server/executionReceiptLedger.ts');
  const ledger = new InMemoryExecutionReceiptLedger();
  ledger.begin(identity);
  const failed = ledger.complete(executionReceiptKey(identity), { pullRequest: pr, webhook: { ...hook, ok:false, status:503 } });
  assert.equal(failed.status, 'FAILED');
  assert.equal(failed.error, 'WEBHOOK_HTTP_503');
});
