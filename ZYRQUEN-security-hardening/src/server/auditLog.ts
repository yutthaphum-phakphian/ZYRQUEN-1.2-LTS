/**
 * In-process audit log for admin / auth operational events.
 * Bounded ring buffer; optional file append for crude durability.
 * Never stores secrets (tokens, access keys, passwords).
 */
import fs from 'fs';
import path from 'path';

export type AuditLevel = 'info' | 'warn' | 'error';

export interface AuditEvent {
  id: string;
  ts: number;
  action: string;
  actor?: string;       // 'admin' | userId | 'system' | ip
  target?: string;      // userId or resource
  result?: string;      // ok | error | denied
  detail?: string;      // short non-sensitive note
  level: AuditLevel;
}

const MAX = 500;
const buf: AuditEvent[] = [];
let seq = 0;
let filePath: string | null = null;

export function configureAuditLog(persistPath?: string | null) {
  filePath = persistPath && persistPath.trim() ? path.resolve(persistPath.trim()) : null;
  if (filePath) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    } catch { /* ignore */ }
  }
}

export function audit(
  action: string,
  opts?: { actor?: string; target?: string; result?: string; detail?: string; level?: AuditLevel },
): AuditEvent {
  const ev: AuditEvent = {
    id: `a${Date.now().toString(36)}_${(++seq).toString(36)}`,
    ts: Date.now(),
    action,
    actor: opts?.actor,
    target: opts?.target,
    result: opts?.result,
    detail: opts?.detail?.slice(0, 300),
    level: opts?.level || 'info',
  };
  buf.push(ev);
  while (buf.length > MAX) buf.shift();
  if (filePath) {
    try {
      fs.appendFileSync(filePath, JSON.stringify(ev) + '\n', 'utf8');
    } catch { /* best-effort */ }
  }
  return ev;
}

export function listAudit(limit = 100): AuditEvent[] {
  const n = Math.min(Math.max(1, limit), MAX);
  return buf.slice(-n).reverse();
}

export function auditCount(): number {
  return buf.length;
}
