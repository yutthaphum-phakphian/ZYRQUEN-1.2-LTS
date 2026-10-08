import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface TamperEvidentAuditRecord {
  seq: number;
  ts: number;
  action: string;
  actor?: string;
  target?: string;
  result?: string;
  detail?: string;
  level: 'info' | 'warn' | 'error';
  prevHash: string;
  hash: string;
}

const genesis = 'GENESIS';
const hashRecord = (record: Omit<TamperEvidentAuditRecord, 'hash'>) =>
  crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');

export function appendTamperEvidentAudit(file: string, input: Omit<TamperEvidentAuditRecord, 'seq' | 'ts' | 'prevHash' | 'hash'>): TamperEvidentAuditRecord {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const lines = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').split('\n').filter(Boolean) : [];
  const previous = lines.length ? JSON.parse(lines[lines.length - 1]) as TamperEvidentAuditRecord : undefined;
  const recordBase: Omit<TamperEvidentAuditRecord, 'hash'> = {
    seq: (previous?.seq ?? 0) + 1,
    ts: Date.now(),
    ...input,
    prevHash: previous?.hash ?? genesis,
  };
  const record = { ...recordBase, hash: hashRecord(recordBase) };
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(record) + '\n', 'utf8');
  fs.appendFileSync(target, fs.readFileSync(tmp));
  fs.rmSync(tmp, { force: true });
  return record;
}

export function verifyTamperEvidentAudit(file: string): { valid: boolean; checked: number; reason?: string } {
  const target = path.resolve(file);
  if (!fs.existsSync(target)) return { valid: true, checked: 0 };
  const lines = fs.readFileSync(target, 'utf8').split('\n').filter(Boolean);
  let previousHash = genesis;
  let previousSeq = 0;
  for (let i = 0; i < lines.length; i++) {
    let parsed: TamperEvidentAuditRecord;
    try { parsed = JSON.parse(lines[i]) as TamperEvidentAuditRecord; } catch { return { valid: false, checked: i, reason: 'INVALID_JSON' }; }
    const { hash, ...base } = parsed;
    if (parsed.seq !== previousSeq + 1) return { valid: false, checked: i, reason: 'SEQUENCE_MISMATCH' };
    if (parsed.prevHash !== previousHash) return { valid: false, checked: i, reason: 'CHAIN_MISMATCH' };
    if (hashRecord(base) !== hash) return { valid: false, checked: i, reason: 'HASH_MISMATCH' };
    previousHash = hash;
    previousSeq = parsed.seq;
  }
  return { valid: true, checked: lines.length };
}
