import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const identity = {
  draftId:'self-heal-draft-14-cafebabe', provider:'github' as const, owner:'o', repository:'r',
  baseBranch:'main', branchName:'auto/fix', patchHash:'a'.repeat(64)
};
const pr: any = { status:'CREATED', provider:'github', repository:{provider:'github',owner:'o',name:'r'}, branchName:'auto/fix', patchHash:identity.patchHash, pullRequestNumber:14, pullRequestUrl:'https://github.com/o/r/pull/14', commitSha:'c'.repeat(40), auditHash:'b'.repeat(64) };
const hook: any = { ok:true, deliveryId:'delivery-m14-001', status:200, attempts:[{attempt:1,status:200}], auditHash:'c'.repeat(64) };

test('milestone 14 rejects a tampered durable receipt instead of starting clean', async () => {
  const { FileExecutionReceiptLedger, executionReceiptKey } = await import('../server/executionReceiptLedger.ts');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'm14-receipt-'));
  const file = path.join(dir, 'execution-receipts.json');
  const first = new FileExecutionReceiptLedger(file);
  first.begin(identity);
  first.complete(executionReceiptKey(identity), { pullRequest: pr, webhook: hook, auditEventId:'audit-14-1' });
  const original = JSON.parse(await fs.readFile(file,'utf8'));
  original[0].pullRequest.pullRequestNumber = 999;
  await fs.writeFile(file, JSON.stringify(original, null, 2));
  const corrupted = new FileExecutionReceiptLedger(file);
  assert.deepEqual(corrupted.verifyIntegrity().invalid[0]?.reason, 'RECEIPT_HASH_MISMATCH');
  assert.throws(() => corrupted.begin(identity), /EXECUTION_RECEIPT_LEDGER_CORRUPT/);
  await fs.rm(dir, { recursive:true, force:true });
});

test('milestone 14 validates the semantic binding between identity and PR patch hash', async () => {
  const { FileExecutionReceiptLedger, executionReceiptKey } = await import('../server/executionReceiptLedger.ts');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'm14-binding-'));
  const file = path.join(dir, 'execution-receipts.json');
  const ledger = new FileExecutionReceiptLedger(file);
  ledger.begin(identity);
  ledger.complete(executionReceiptKey(identity), { pullRequest: { ...pr, patchHash:'b'.repeat(64) } as any });
  const persisted = JSON.parse(await fs.readFile(file,'utf8'));
  assert.equal(ledger.verifyIntegrity().valid, false, 'in-memory semantic verification should reject mismatched patch hash');
  persisted[0].receiptHash = '0'.repeat(64);
  await fs.writeFile(file, JSON.stringify(persisted, null, 2));
  const restored = new FileExecutionReceiptLedger(file);
  assert.equal(restored.verifyIntegrity().valid, false);
  await fs.rm(dir, { recursive:true, force:true });
});

test('milestone 14 makes completed receipts terminal', async () => {
  const { InMemoryExecutionReceiptLedger, executionReceiptKey } = await import('../server/executionReceiptLedger.ts');
  const ledger = new InMemoryExecutionReceiptLedger();
  ledger.begin(identity);
  const first = ledger.complete(executionReceiptKey(identity), { pullRequest: pr, webhook: hook, auditEventId:'audit-14-terminal' });
  const second = ledger.complete(executionReceiptKey(identity), { pullRequest: { ...pr, pullRequestNumber: 999 } as any, webhook: hook });
  assert.deepEqual(second, first);
});

test('milestone 14 accepts a valid persisted receipt', async () => {
  const { FileExecutionReceiptLedger, executionReceiptKey } = await import('../server/executionReceiptLedger.ts');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'm14-valid-'));
  const file = path.join(dir, 'execution-receipts.json');
  const ledger = new FileExecutionReceiptLedger(file);
  ledger.begin(identity);
  const expected = ledger.complete(executionReceiptKey(identity), { pullRequest: pr, webhook: hook, auditEventId:'audit-14-valid' });
  const restored = new FileExecutionReceiptLedger(file);
  assert.deepEqual(restored.verifyIntegrity(), { valid:true, checked:1, invalid:[] });
  const replay = restored.begin(identity);
  assert.equal(replay.state, 'COMPLETE');
  assert.deepEqual(replay.receipt, expected);
  await fs.rm(dir, { recursive:true, force:true });
});
