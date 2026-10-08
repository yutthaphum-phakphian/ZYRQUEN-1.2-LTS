import fs from 'node:fs';
import path from 'node:path';
import type { WebhookDeliveryResult } from './webhookNotifier.ts';

export type WebhookLedgerState = 'IN_PROGRESS' | 'SENT' | 'FAILED';
export interface WebhookLedgerEntry {
  deliveryId: string;
  payloadHash: string;
  state: WebhookLedgerState;
  startedAt: string;
  updatedAt: string;
  result?: WebhookDeliveryResult;
}

export interface WebhookDeliveryLedger {
  begin(deliveryId: string, payloadHash: string): { state: 'NEW' } | { state: 'SENT'; result: WebhookDeliveryResult } | { state: 'IN_PROGRESS' } | { state: 'CONFLICT' };
  complete(deliveryId: string, payloadHash: string, result: WebhookDeliveryResult): void;
  fail(deliveryId: string, payloadHash: string, result: WebhookDeliveryResult): void;
}

const now = () => new Date().toISOString();

export class InMemoryWebhookDeliveryLedger implements WebhookDeliveryLedger {
  protected readonly entries = new Map<string, WebhookLedgerEntry>();
  private readonly staleMs: number;
  constructor(staleMs = 15 * 60_000) { this.staleMs = staleMs; }

  begin(deliveryId: string, payloadHash: string) {
    const existing = this.entries.get(deliveryId);
    if (existing) {
      if (existing.payloadHash !== payloadHash) return { state: 'CONFLICT' as const };
      const age = Date.now() - Date.parse(existing.updatedAt);
      if (existing.state === 'SENT' && existing.result) return { state: 'SENT' as const, result: structuredClone(existing.result) };
      if (existing.state === 'IN_PROGRESS' && age <= this.staleMs) return { state: 'IN_PROGRESS' as const };
    }
    const ts = now();
    this.entries.set(deliveryId, { deliveryId, payloadHash, state: 'IN_PROGRESS', startedAt: ts, updatedAt: ts });
    return { state: 'NEW' as const };
  }

  complete(deliveryId: string, payloadHash: string, result: WebhookDeliveryResult) {
    const existing = this.entries.get(deliveryId);
    if (existing?.payloadHash !== payloadHash) throw new Error('WEBHOOK_DELIVERY_LEDGER_CONFLICT');
    const ts = now();
    this.entries.set(deliveryId, { deliveryId, payloadHash, state: 'SENT', startedAt: existing?.startedAt || ts, updatedAt: ts, result: structuredClone(result) });
  }

  fail(deliveryId: string, payloadHash: string, result: WebhookDeliveryResult) {
    const existing = this.entries.get(deliveryId);
    if (existing?.payloadHash !== payloadHash) throw new Error('WEBHOOK_DELIVERY_LEDGER_CONFLICT');
    const ts = now();
    this.entries.set(deliveryId, { deliveryId, payloadHash, state: 'FAILED', startedAt: existing?.startedAt || ts, updatedAt: ts, result: structuredClone(result) });
  }
}

export class FileWebhookDeliveryLedger implements WebhookDeliveryLedger {
  private readonly memory: InMemoryWebhookDeliveryLedger;
  private readonly filename: string;
  constructor(filename: string, staleMs = 15 * 60_000) {
    this.filename = filename;
    this.memory = new InMemoryWebhookDeliveryLedger(staleMs);
    this.load();
  }
  private load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.filename, 'utf8')) as WebhookLedgerEntry[];
      for (const entry of raw) {
        if (entry?.deliveryId && entry?.payloadHash && entry?.state) this.memory.entries.set(entry.deliveryId, entry);
      }
    } catch { /* missing/corrupt ledger: start clean; receiver remains authoritative */ }
  }
  private persist() {
    try {
      fs.mkdirSync(path.dirname(this.filename), { recursive: true });
      const tmp = `${this.filename}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify([...this.memory.entries.values()]), 'utf8');
      fs.renameSync(tmp, this.filename);
    } catch { /* best effort; delivery result remains observable */ }
  }
  begin(deliveryId: string, payloadHash: string) { const r = this.memory.begin(deliveryId, payloadHash); this.persist(); return r; }
  complete(deliveryId: string, payloadHash: string, result: WebhookDeliveryResult) { this.memory.complete(deliveryId, payloadHash, result); this.persist(); }
  fail(deliveryId: string, payloadHash: string, result: WebhookDeliveryResult) { this.memory.fail(deliveryId, payloadHash, result); this.persist(); }
}

export function defaultWebhookDeliveryLedger(): WebhookDeliveryLedger {
  return new FileWebhookDeliveryLedger(path.resolve(process.cwd(), '.codevoice-data', 'webhook-delivery-ledger.json'));
}
