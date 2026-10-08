import { createHash } from 'node:crypto';

export type UpgradeAdmissionStatus = 'ADMITTED' | 'BLOCKED';

export interface UpgradeCheck {
  id: string;
  ok: boolean;
  detail: string;
}

export interface UpgradeAdmission {
  status: UpgradeAdmissionStatus;
  checks: UpgradeCheck[];
  blockers: string[];
  auditHash: string;
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function admitUpgrade(checks: UpgradeCheck[]): UpgradeAdmission {
  const normalized = checks.map((check) => ({ ...check }));
  const blockers = normalized.filter((check) => !check.ok).map((check) => check.id);
  const status: UpgradeAdmissionStatus = blockers.length === 0 ? 'ADMITTED' : 'BLOCKED';
  return {
    status,
    checks: normalized,
    blockers,
    auditHash: hash({ status, checks: normalized, blockers }),
  };
}

export function createUpgradeCheck(id: string, ok: boolean, detail: string): UpgradeCheck {
  if (!id.trim()) throw new Error('INVALID_CHECK_ID');
  return { id, ok, detail: detail.slice(0, 500) };
}
