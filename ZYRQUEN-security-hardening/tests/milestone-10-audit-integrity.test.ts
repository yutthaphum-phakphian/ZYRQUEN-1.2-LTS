import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { appendTamperEvidentAudit, verifyTamperEvidentAudit } from '../src/server/tamperEvidentAudit.ts';

test('milestone 10 creates a verifiable hash chain', async () => {
  const file = `/tmp/m10-audit-${Date.now()}.jsonl`;
  try {
    appendTamperEvidentAudit(file, { action:'self_healing.pull_request', actor:'system', result:'CREATED', level:'info' });
    appendTamperEvidentAudit(file, { action:'webhook.delivery', actor:'system', result:'ok', level:'info' });
    const verified = verifyTamperEvidentAudit(file);
    assert.deepEqual(verified, { valid:true, checked:2 });
  } finally { await fs.rm(file,{force:true}); }
});

test('milestone 10 detects audit tampering', async () => {
  const file = `/tmp/m10-audit-${Date.now()}.jsonl`;
  try {
    appendTamperEvidentAudit(file, { action:'self_healing.pull_request', result:'CREATED', level:'info' });
    appendTamperEvidentAudit(file, { action:'webhook.delivery', result:'ok', level:'info' });
    const lines = (await fs.readFile(file,'utf8')).trim().split('\n');
    const record = JSON.parse(lines[0]); record.result = 'BLOCKED';
    lines[0] = JSON.stringify(record); await fs.writeFile(file, lines.join('\n')+'\n');
    const verified = verifyTamperEvidentAudit(file);
    assert.equal(verified.valid,false); assert.equal(verified.reason,'HASH_MISMATCH');
  } finally { await fs.rm(file,{force:true}); }
});
