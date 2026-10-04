import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { PullRequestResult } from './gitPullRequestAutomation.ts';

export type PRLedgerState = 'IN_PROGRESS' | 'CREATED' | 'FAILED';
export interface PRLedgerEntry {
  key: string;
  state: PRLedgerState;
  startedAt: string;
  updatedAt: string;
  result?: PullRequestResult;
  reason?: string;
}

export interface PRExecutionLedger {
  begin(key: string): { state: 'NEW' } | { state: 'CREATED'; result: PullRequestResult } | { state: 'IN_PROGRESS' };
  complete(key: string, result: PullRequestResult): void;
  fail(key: string, reason: string): void;
}

const now = () => new Date().toISOString();
const hashKey = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function prExecutionKey(input: { draftId: string; provider: string; owner: string; repository: string; patchHash: string; baseBranch: string; branchName: string }): string {
  return hashKey(input);
}

export class InMemoryPRExecutionLedger implements PRExecutionLedger {
  private readonly entries = new Map<string, PRLedgerEntry>();
  private readonly staleMs: number;
  constructor(staleMs = 15 * 60_000) { this.staleMs = staleMs; }
  begin(key: string) {
    const existing = this.entries.get(key);
    if (existing && Date.now() - Date.parse(existing.updatedAt) <= this.staleMs) {
      if (existing.state === 'CREATED' && existing.result) return { state: 'CREATED' as const, result: structuredClone(existing.result) };
      if (existing.state === 'IN_PROGRESS') return { state: 'IN_PROGRESS' as const };
    }
    const entry: PRLedgerEntry = { key, state: 'IN_PROGRESS', startedAt: now(), updatedAt: now() };
    this.entries.set(key, entry);
    return { state: 'NEW' as const };
  }
  complete(key: string, result: PullRequestResult) { const e = this.entries.get(key) || { key, startedAt: now() }; this.entries.set(key, { ...e, state: 'CREATED', updatedAt: now(), result: structuredClone(result), reason: undefined }); }
  fail(key: string, reason: string) { const e = this.entries.get(key) || { key, startedAt: now() }; this.entries.set(key, { ...e, state: 'FAILED', updatedAt: now(), reason }); }
}

export class FilePRExecutionLedger implements PRExecutionLedger {
  private readonly memory: InMemoryPRExecutionLedger;
  private readonly filename: string;
  constructor(filename: string, staleMs = 15 * 60_000) { this.filename = filename; this.memory = new InMemoryPRExecutionLedger(staleMs); this.load(); }
  private load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.filename, 'utf8')) as PRLedgerEntry[];
      for (const e of raw) if (e?.key && e?.state) (this.memory as any).entries?.set?.(e.key, e);
    } catch { /* missing/corrupt ledger is treated as empty; remote state remains authoritative */ }
  }
  private persist() {
    try {
      fs.mkdirSync(path.dirname(this.filename), { recursive: true });
      const entries = [...((this.memory as any).entries?.values?.() || [])] as PRLedgerEntry[];
      const tmp = `${this.filename}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(entries), 'utf8');
      fs.renameSync(tmp, this.filename);
    } catch { /* best effort; remote GitHub state remains authoritative */ }
  }
  begin(key: string) { const result = this.memory.begin(key); this.persist(); return result; }
  complete(key: string, result: PullRequestResult) { this.memory.complete(key, result); this.persist(); }
  fail(key: string, reason: string) { this.memory.fail(key, reason); this.persist(); }
}

export function defaultPRExecutionLedger(): PRExecutionLedger {
  return new FilePRExecutionLedger(path.resolve(process.cwd(), '.codevoice-data', 'pr-execution-ledger.json'));
}
