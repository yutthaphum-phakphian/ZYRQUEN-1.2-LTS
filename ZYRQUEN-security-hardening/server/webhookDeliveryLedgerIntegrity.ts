import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { WebhookLedgerEntry } from './webhookDeliveryLedger.ts';

export interface WebhookLedgerIntegrity { valid: boolean; checked: number; invalid: Array<{ deliveryId?: string; reason: string }>; }

const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canonical = (entry: WebhookLedgerEntry) => JSON.parse(JSON.stringify(entry));
const expected = (entry: WebhookLedgerEntry & { entryHash?: string }) => hash(canonical({ ...entry, entryHash: undefined }));

export function sealWebhookLedgerEntry(entry: WebhookLedgerEntry): WebhookLedgerEntry & { entryHash: string } {
  const unsigned = canonical(entry) as WebhookLedgerEntry;
  return { ...unsigned, entryHash: hash(unsigned) };
}

export function verifyWebhookLedgerFile(filename: string): WebhookLedgerIntegrity {
  try {
    const raw = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (!Array.isArray(raw)) return { valid: false, checked: 0, invalid: [{ reason: 'LEDGER_NOT_ARRAY' }] };
    const invalid: WebhookLedgerIntegrity['invalid'] = [];
    raw.forEach((entry, index) => {
      if (!entry?.deliveryId || !entry?.payloadHash || !entry?.state || !entry?.entryHash) {
        invalid.push({ deliveryId: entry?.deliveryId, reason: `MISSING_FIELDS:${index}` });
        return;
      }
      if (!/^[a-f0-9]{64}$/.test(entry.entryHash) || expected(entry) !== entry.entryHash) invalid.push({ deliveryId: entry.deliveryId, reason: 'ENTRY_HASH_MISMATCH' });
    });
    return { valid: invalid.length === 0, checked: raw.length, invalid };
  } catch (error) {
    return { valid: false, checked: 0, invalid: [{ reason: error instanceof Error ? 'INVALID_JSON' : 'LEDGER_READ_FAILED' }] };
  }
}

export function defaultWebhookLedgerIntegrityPath(): string { return path.resolve(process.cwd(), '.codevoice-data', 'webhook-delivery-ledger.json'); }
