import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sealWebhookLedgerEntry, verifyWebhookLedgerFile } from '../server/webhookDeliveryLedgerIntegrity.ts';

const entry = { deliveryId:'delivery-15', payloadHash:'a'.repeat(64), state:'SENT' as const, startedAt:'2026-10-05T00:00:00.000Z', updatedAt:'2026-10-05T00:00:01.000Z', result:{ ok:true, status:200, attempts:1 } };

test('M15: valid webhook ledger verifies', () => { const d=fs.mkdtempSync(path.join(os.tmpdir(),'m15-')); const f=path.join(d,'ledger.json'); fs.writeFileSync(f, JSON.stringify([sealWebhookLedgerEntry(entry)])); assert.deepEqual(verifyWebhookLedgerFile(f), {valid:true,checked:1,invalid:[]}); });
test('M15: tampered entry fails closed', () => { const d=fs.mkdtempSync(path.join(os.tmpdir(),'m15-')); const f=path.join(d,'ledger.json'); const x=sealWebhookLedgerEntry(entry); x.result={ok:false,status:500,attempts:2}; fs.writeFileSync(f, JSON.stringify([x])); assert.equal(verifyWebhookLedgerFile(f).valid,false); });
test('M15: malformed ledger fails closed', () => { const d=fs.mkdtempSync(path.join(os.tmpdir(),'m15-')); const f=path.join(d,'ledger.json'); fs.writeFileSync(f,'not-json'); assert.equal(verifyWebhookLedgerFile(f).valid,false); });
