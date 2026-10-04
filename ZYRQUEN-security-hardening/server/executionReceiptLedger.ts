import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { PullRequestResult } from './gitPullRequestAutomation.ts';
import type { WebhookDeliveryResult } from './webhookNotifier.ts';

export type ExecutionReceiptStatus = 'IN_PROGRESS' | 'COMPLETE' | 'FAILED';

export interface ExecutionReceiptIdentity {
  draftId: string;
  provider: 'github';
  owner: string;
  repository: string;
  baseBranch: string;
  branchName: string;
  patchHash: string;
}

export interface ExecutionReceipt {
  receiptId: string;
  executionKey: string;
  status: ExecutionReceiptStatus;
  identity: ExecutionReceiptIdentity;
  createdAt: string;
  updatedAt: string;
  pullRequest?: Pick<PullRequestResult, 'status' | 'pullRequestUrl' | 'pullRequestNumber' | 'commitSha' | 'patchHash' | 'auditHash'>;
  webhook?: Pick<WebhookDeliveryResult, 'ok' | 'deliveryId' | 'status' | 'attempts' | 'auditHash'>;
  auditEventId?: string;
  error?: string;
  receiptHash: string;
}

export interface ExecutionReceiptIntegrity { valid: boolean; checked: number; invalid: Array<{ executionKey?: string; reason: string }>; }

export type ReceiptBeginResult =
  | { state: 'NEW'; receipt: ExecutionReceipt }
  | { state: 'IN_PROGRESS'; receipt: ExecutionReceipt }
  | { state: 'COMPLETE'; receipt: ExecutionReceipt }
  | { state: 'CONFLICT' };

export interface ExecutionReceiptLedger {
  begin(identity: ExecutionReceiptIdentity): ReceiptBeginResult;
  complete(executionKey: string, data: { pullRequest: PullRequestResult; webhook?: WebhookDeliveryResult; auditEventId?: string }): ExecutionReceipt;
  fail(executionKey: string, reason: string, auditEventId?: string): ExecutionReceipt;
  get(executionKey: string): ExecutionReceipt | undefined;
  verifyIntegrity(): ExecutionReceiptIntegrity;
}

const now = () => new Date().toISOString();

export function executionReceiptKey(identity: ExecutionReceiptIdentity): string {
  return crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}

function receiptId(executionKey: string): string {
  return `receipt-${executionKey.slice(0, 32)}`;
}

function seal(receipt: Omit<ExecutionReceipt, 'receiptHash'>): ExecutionReceipt {
  const { receiptHash: _previousHash, ...unsigned } = receipt as ExecutionReceipt;
  const canonical = JSON.parse(JSON.stringify(unsigned)) as Omit<ExecutionReceipt, 'receiptHash'>;
  const nextHash = crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  return { ...canonical, receiptHash: nextHash };
}

function sameIdentity(a: ExecutionReceiptIdentity, b: ExecutionReceiptIdentity): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function expectedReceiptHash(entry: ExecutionReceipt): string {
  const { receiptHash: _receiptHash, ...unsigned } = entry;
  return crypto.createHash('sha256').update(JSON.stringify(unsigned)).digest('hex');
}

function validateReceipt(entry: ExecutionReceipt): string | null {
  if (!entry || typeof entry !== 'object') return 'INVALID_RECORD';
  if (!entry.executionKey || !entry.receiptId || !entry.receiptHash || !entry.identity) return 'MISSING_FIELDS';
  if (!['IN_PROGRESS', 'COMPLETE', 'FAILED'].includes(entry.status)) return 'INVALID_STATUS';
  if (typeof entry.createdAt !== 'string' || Number.isNaN(Date.parse(entry.createdAt))) return 'INVALID_CREATED_AT';
  if (typeof entry.updatedAt !== 'string' || Number.isNaN(Date.parse(entry.updatedAt))) return 'INVALID_UPDATED_AT';
  if (executionReceiptKey(entry.identity) !== entry.executionKey) return 'EXECUTION_KEY_MISMATCH';
  if (receiptId(entry.executionKey) !== entry.receiptId) return 'RECEIPT_ID_MISMATCH';
  if (!/^[a-f0-9]{64}$/.test(entry.identity.patchHash)) return 'IDENTITY_PATCH_HASH_FORMAT';
  if (!/^[a-f0-9]{64}$/.test(entry.receiptHash)) return 'RECEIPT_HASH_FORMAT';
  if (entry.pullRequest?.patchHash && entry.pullRequest.patchHash !== entry.identity.patchHash) return 'PR_PATCH_HASH_MISMATCH';
  if (entry.pullRequest?.auditHash && !/^[a-f0-9]{64}$/.test(entry.pullRequest.auditHash)) return 'PR_AUDIT_HASH_FORMAT';
  if (entry.webhook?.auditHash && !/^[a-f0-9]{64}$/.test(entry.webhook.auditHash)) return 'WEBHOOK_AUDIT_HASH_FORMAT';
  if (entry.status === 'COMPLETE' && !entry.pullRequest) return 'COMPLETE_WITHOUT_PR';
  if (entry.status === 'FAILED' && !entry.error && entry.webhook?.ok !== false) return 'FAILED_WITHOUT_REASON';
  if (!/^[a-f0-9]{64}$/.test(expectedReceiptHash(entry))) return 'INTERNAL_HASH_FAILURE';
  if (expectedReceiptHash(entry) !== entry.receiptHash) return 'RECEIPT_HASH_MISMATCH';
  return null;
}

export class InMemoryExecutionReceiptLedger implements ExecutionReceiptLedger {
  protected readonly entries = new Map<string, ExecutionReceipt>();

  begin(identity: ExecutionReceiptIdentity): ReceiptBeginResult {
    const executionKey = executionReceiptKey(identity);
    const existing = this.entries.get(executionKey);
    if (existing) {
      if (!sameIdentity(existing.identity, identity)) return { state: 'CONFLICT' };
      if (existing.status === 'COMPLETE') return { state: 'COMPLETE', receipt: structuredClone(existing) };
      return { state: 'IN_PROGRESS', receipt: structuredClone(existing) };
    }
    const ts = now();
    const receipt = seal({ receiptId: receiptId(executionKey), executionKey, status: 'IN_PROGRESS', identity, createdAt: ts, updatedAt: ts });
    this.entries.set(executionKey, receipt);
    return { state: 'NEW', receipt: structuredClone(receipt) };
  }

  complete(executionKey: string, data: { pullRequest: PullRequestResult; webhook?: WebhookDeliveryResult; auditEventId?: string }): ExecutionReceipt {
    const existing = this.entries.get(executionKey);
    if (!existing) throw new Error('EXECUTION_RECEIPT_NOT_FOUND');
    if (existing.status === 'COMPLETE') return structuredClone(existing);
    const ts = now();
    const receipt = seal({
      ...existing,
      status: data.webhook && !data.webhook.ok ? 'FAILED' : 'COMPLETE',
      updatedAt: ts,
      pullRequest: {
        status: data.pullRequest.status,
        pullRequestUrl: data.pullRequest.pullRequestUrl,
        pullRequestNumber: data.pullRequest.pullRequestNumber,
        commitSha: data.pullRequest.commitSha,
        patchHash: data.pullRequest.patchHash,
        auditHash: data.pullRequest.auditHash,
      },
      webhook: data.webhook ? {
        ok: data.webhook.ok,
        deliveryId: data.webhook.deliveryId,
        status: data.webhook.status,
        attempts: data.webhook.attempts,
        auditHash: data.webhook.auditHash,
      } : undefined,
      auditEventId: data.auditEventId,
      error: data.webhook && !data.webhook.ok ? `WEBHOOK_HTTP_${data.webhook.status}` : undefined,
    });
    this.entries.set(executionKey, receipt);
    return structuredClone(receipt);
  }

  fail(executionKey: string, reason: string, auditEventId?: string): ExecutionReceipt {
    const existing = this.entries.get(executionKey);
    if (!existing) throw new Error('EXECUTION_RECEIPT_NOT_FOUND');
    const receipt = seal({ ...existing, status: 'FAILED', updatedAt: now(), error: reason.slice(0, 300), auditEventId });
    this.entries.set(executionKey, receipt);
    return structuredClone(receipt);
  }

  get(executionKey: string): ExecutionReceipt | undefined {
    const value = this.entries.get(executionKey);
    return value ? structuredClone(value) : undefined;
  }

  verifyIntegrity(): ExecutionReceiptIntegrity {
    const invalid: Array<{ executionKey?: string; reason: string }> = [];
    for (const [key, entry] of this.entries.entries()) {
      const reason = validateReceipt(entry);
      if (reason) invalid.push({ executionKey: key, reason });
    }
    return { valid: invalid.length === 0, checked: this.entries.size, invalid };
  }
}

export class FileExecutionReceiptLedger implements ExecutionReceiptLedger {
  private readonly memory: InMemoryExecutionReceiptLedger;
  private readonly filename: string;
  private corrupted: ExecutionReceiptIntegrity | null = null;

  constructor(filename: string) {
    this.filename = filename;
    this.memory = new InMemoryExecutionReceiptLedger();
    this.load();
  }

  private load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.filename, 'utf8'));
      if (!Array.isArray(raw)) {
        this.corrupted = { valid: false, checked: 0, invalid: [{ reason: 'INVALID_LEDGER_FORMAT' }] };
        return;
      }
      const invalid: Array<{ executionKey?: string; reason: string }> = [];
      for (const entry of raw as ExecutionReceipt[]) {
        const reason = validateReceipt(entry);
        if (reason) invalid.push({ executionKey: entry?.executionKey, reason });
      }
      if (invalid.length) {
        this.corrupted = { valid: false, checked: raw.length, invalid };
        return;
      }
      for (const entry of raw as ExecutionReceipt[]) this.memory.entries.set(entry.executionKey, entry);
      this.corrupted = null;
    } catch {
      // Missing file is a valid first-run state. Existing but unreadable/corrupt files are blocked.
      try { fs.accessSync(this.filename); this.corrupted = { valid: false, checked: 0, invalid: [{ reason: 'LEDGER_READ_OR_PARSE_FAILED' }] }; }
      catch { this.corrupted = null; }
    }
  }

  private ensureHealthy() {
    if (this.corrupted) throw new Error('EXECUTION_RECEIPT_LEDGER_CORRUPT');
  }

  private persist() {
    this.ensureHealthy();
    fs.mkdirSync(path.dirname(this.filename), { recursive: true });
    const tmp = `${this.filename}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify([...this.memory.entries.values()], null, 2), 'utf8');
    fs.renameSync(tmp, this.filename);
  }

  begin(identity: ExecutionReceiptIdentity): ReceiptBeginResult { this.ensureHealthy(); const r = this.memory.begin(identity); this.persist(); return r; }
  complete(executionKey: string, data: { pullRequest: PullRequestResult; webhook?: WebhookDeliveryResult; auditEventId?: string }) {
    this.ensureHealthy();
    const existing = this.memory.get(executionKey);
    if (existing?.status === 'COMPLETE') return existing;
    const r = this.memory.complete(executionKey, data); this.persist(); return r;
  }
  fail(executionKey: string, reason: string, auditEventId?: string) { this.ensureHealthy(); const r = this.memory.fail(executionKey, reason, auditEventId); this.persist(); return r; }
  get(executionKey: string) { this.ensureHealthy(); return this.memory.get(executionKey); }
  verifyIntegrity(): ExecutionReceiptIntegrity {
    if (this.corrupted) return structuredClone(this.corrupted);
    return this.memory.verifyIntegrity();
  }
}

export function defaultExecutionReceiptLedger(): ExecutionReceiptLedger {
  return new FileExecutionReceiptLedger(path.resolve(process.cwd(), '.codevoice-data', 'execution-receipts.json'));
}
