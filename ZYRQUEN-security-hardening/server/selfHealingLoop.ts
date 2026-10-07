import crypto from 'node:crypto';
import path from 'node:path';
import type { RepairDiagnosis } from './developerRepairPlanner.ts';

export type SelfHealingDraftStatus = 'DRAFT_READY' | 'BLOCKED';

export interface FailureSignal {
  projectId: string;
  missionId?: string;
  workerId?: string;
  code?: string;
  message: string;
  stack?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface FailureEvidence {
  fingerprint: string;
  projectId: string;
  code: string;
  message: string;
  normalizedStack?: string;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  evidence: Array<{
    timestamp: string;
    missionId?: string;
    workerId?: string;
    message: string;
  }>;
}

export interface SelfHealingPolicy {
  repeatThreshold?: number;
  windowMs?: number;
  maxEvidence?: number;
}

export interface ValidationGateResult {
  name: 'typecheck' | 'test' | 'build' | 'smoke';
  ok: boolean;
  summary?: string;
}

export interface SelfHealingDraft {
  draftId: string;
  status: SelfHealingDraftStatus;
  branchName: string;
  baseBranch: string;
  title: string;
  body: string;
  rootCause: {
    diagnosis: RepairDiagnosis;
    fingerprint: string;
    occurrences: number;
    summary: string;
    stackTrace?: string;
  };
  validation: ValidationGateResult[];
  operations: Array<{
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    target: string;
    content?: string;
    expectedHash?: string;
  }>;
  pushRequested: false;
  mergeRequested: false;
  auditHash: string;
}

const iso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function safeText(value: unknown, max = 4000): string {
  return String(value ?? '')
    .replace(/(?:gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_\-]{12,}/gi, '[REDACTED_SECRET]')
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
    .slice(0, max);
}

function normalizeStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const normalized = stack
    .split(/\r?\n/)
    .map(line => line
      .replace(/[A-Za-z]:[\\/][^ )]+/g, '<path>')
      .replace(/\/home\/[^ )]+/g, '<path>')
      .replace(/:\d+:\d+/g, ':#: #')
      .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '<uuid>'))
    .slice(0, 12)
    .join('\n');
  return safeText(normalized, 6000);
}

function normalizeMessage(message: string): string {
  return safeText(message, 500)
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '<uuid>')
    .replace(/\b\d+(?:\.\d+)?\b/g, '#')
    .trim();
}

function fingerprint(signal: FailureSignal): string {
  const basis = [signal.projectId, signal.code || 'UNKNOWN_ERROR', normalizeMessage(signal.message), normalizeStack(signal.stack) || ''].join('|');
  return crypto.createHash('sha256').update(basis).digest('hex');
}

function diagnosisFor(signal: FailureSignal): RepairDiagnosis {
  const text = `${signal.code || ''} ${signal.message} ${signal.stack || ''}`.toUpperCase();
  if (text.includes('TIMEOUT') || text.includes('DEADLINE')) return 'EXECUTION_TIMEOUT';
  if (text.includes('EXPECTATION') || text.includes('TARGET_NOT_FOUND') || text.includes('TARGET_EXISTS') || text.includes('WORKSPACE')) return 'WORKSPACE_STATE_MISMATCH';
  if (text.includes('APPROVAL') || text.includes('POLICY') || text.includes('BLOCKED') || text.includes('FENCE')) return 'APPROVAL_OR_POLICY_BLOCK';
  if (text.includes('BUILD') || text.includes('TSC') || text.includes('COMPILE')) return 'BUILD_FAILURE';
  if (text.includes('TEST') || text.includes('ASSERT') || text.includes('EXPECT')) return 'TEST_FAILURE';
  return 'UNKNOWN_FAILURE';
}

function safeBranchPart(value: string): string {
  const result = value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return result || 'unknown-error';
}

function safeTarget(target: string): string {
  const normalized = target.replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..') || path.posix.normalize(normalized) !== normalized) throw new Error('INVALID_SELF_HEALING_TARGET');
  return normalized;
}

function allValidationPassed(validation: ValidationGateResult[]): boolean {
  return validation.length > 0 && validation.every(gate => gate.ok);
}

export class SelfHealingFailureRegistry {
  private readonly entries = new Map<string, FailureEvidence>();
  private readonly repeatThreshold: number;
  private readonly windowMs: number;
  private readonly maxEvidence: number;

  constructor(policy: SelfHealingPolicy = {}) {
    this.repeatThreshold = Math.max(2, Math.min(20, Number(policy.repeatThreshold ?? 3)));
    this.windowMs = Math.max(1_000, Math.min(86_400_000, Number(policy.windowMs ?? 15 * 60_000)));
    this.maxEvidence = Math.max(1, Math.min(50, Number(policy.maxEvidence ?? 10)));
  }

  observe(signal: FailureSignal): FailureEvidence {
    if (!signal.projectId.trim() || !signal.message.trim()) throw new Error('FAILURE_SIGNAL_REQUIRED');
    const now = signal.timestamp || iso();
    const key = fingerprint(signal);
    const existing = this.entries.get(key);
    const expired = existing && Date.parse(now) - Date.parse(existing.lastSeen) > this.windowMs;
    const base: FailureEvidence = expired || !existing
      ? { fingerprint: key, projectId: signal.projectId, code: signal.code || 'UNKNOWN_ERROR', message: safeText(signal.message, 500), normalizedStack: normalizeStack(signal.stack), firstSeen: now, lastSeen: now, occurrences: 0, evidence: [] }
      : existing;
    base.occurrences += 1;
    base.lastSeen = now;
    base.evidence = [...base.evidence, { timestamp: now, missionId: signal.missionId, workerId: signal.workerId, message: safeText(signal.message, 500) }].slice(-this.maxEvidence);
    this.entries.set(key, base);
    return structuredClone(base);
  }

  get(fingerprintValue: string): FailureEvidence | undefined {
    const found = this.entries.get(fingerprintValue);
    return found ? structuredClone(found) : undefined;
  }

  list(): FailureEvidence[] {
    return [...this.entries.values()].map(entry => structuredClone(entry));
  }

  isRepeated(evidence: FailureEvidence): boolean {
    return evidence.occurrences >= this.repeatThreshold;
  }

  threshold(): number {
    return this.repeatThreshold;
  }

  clear(fingerprintValue: string): boolean {
    return this.entries.delete(fingerprintValue);
  }
}

export interface SelfHealingObservation {
  evidence: FailureEvidence;
  repeated: boolean;
}

export class SelfHealingCoordinator {
  readonly registry: SelfHealingFailureRegistry;
  private readonly latestSignals = new Map<string, FailureSignal>();
  private readonly drafts = new Map<string, SelfHealingDraft>();

  constructor(policy: SelfHealingPolicy = {}) {
    this.registry = new SelfHealingFailureRegistry(policy);
  }

  observe(signal: FailureSignal): SelfHealingObservation {
    const evidence = this.registry.observe(signal);
    this.latestSignals.set(evidence.fingerprint, { ...signal, message: safeText(signal.message, 1000), stack: safeText(signal.stack, 6000) });
    return { evidence, repeated: this.registry.isRepeated(evidence) };
  }

  prepareDraft(input: Omit<PrepareSelfHealingDraftInput, 'evidence' | 'latestSignal'> & { fingerprint: string }): SelfHealingDraft {
    const evidence = this.registry.get(input.fingerprint);
    const latestSignal = this.latestSignals.get(input.fingerprint);
    if (!evidence || !latestSignal) throw new Error('SELF_HEALING_FAILURE_NOT_FOUND');
    const draft = prepareSelfHealingDraft({ ...input, evidence, latestSignal, repeatThreshold: input.repeatThreshold ?? this.registry.threshold() });
    this.drafts.set(draft.draftId, structuredClone(draft));
    return draft;
  }

  getDraft(draftId: string): SelfHealingDraft | undefined {
    const draft = this.drafts.get(draftId);
    return draft ? structuredClone(draft) : undefined;
  }

  listDrafts(): SelfHealingDraft[] {
    return [...this.drafts.values()].map(draft => structuredClone(draft));
  }

  clear(fingerprintValue: string): boolean {
    this.latestSignals.delete(fingerprintValue);
    for (const [draftId, draft] of this.drafts) if (draft.rootCause.fingerprint === fingerprintValue) this.drafts.delete(draftId);
    return this.registry.clear(fingerprintValue);
  }
}

export interface PrepareSelfHealingDraftInput {
  evidence: FailureEvidence;
  latestSignal: FailureSignal;
  operations: Array<{ type: 'CREATE' | 'UPDATE' | 'DELETE'; target: string; content?: string; expectedHash?: string }>;
  validation?: ValidationGateResult[];
  baseBranch?: string;
  repeatThreshold?: number;
}

export function prepareSelfHealingDraft(input: PrepareSelfHealingDraftInput): SelfHealingDraft {
  const validation = (input.validation || []).map(gate => ({ ...gate, summary: gate.summary ? safeText(gate.summary, 500) : undefined }));
  const repeated = input.evidence.occurrences >= Math.max(2, Number(input.repeatThreshold ?? 3));
  const safeOperations = input.operations.map(operation => ({ ...operation, target: safeTarget(operation.target), content: operation.content === undefined ? undefined : safeText(operation.content, 100_000) }));
  const diagnosis = diagnosisFor(input.latestSignal);
  const branchName = `auto-heal/${safeBranchPart(input.latestSignal.code || diagnosis)}/${input.evidence.fingerprint.slice(0, 12)}`;
  const baseBranch = safeBranchPart(input.baseBranch || 'main');
  const ready = repeated && safeOperations.length > 0 && allValidationPassed(validation);
  const status: SelfHealingDraftStatus = ready ? 'DRAFT_READY' : 'BLOCKED';
  const title = `[auto-heal] ${input.latestSignal.code || diagnosis}: repeated failure remediation`;
  const body = [
    '## Automated self-healing draft',
    '',
    '> This payload is draft-only. No branch push, PR creation, merge, or deployment was requested by this module.',
    '',
    `- Project: \`${safeText(input.evidence.projectId, 160)}\``,
    `- Diagnosis: \`${diagnosis}\``,
    `- Fingerprint: \`${input.evidence.fingerprint}\``,
    `- Repeated occurrences: **${input.evidence.occurrences}**`,
    `- Proposed branch: \`${branchName}\``,
    '',
    '### Root cause evidence',
    safeText(input.latestSignal.message, 1000),
    input.evidence.normalizedStack ? `\n\`\`\`text\n${input.evidence.normalizedStack}\n\`\`\`` : '_No stack trace supplied._',
    '',
    '### Validation gates',
    ...validation.map(gate => `- ${gate.ok ? 'PASS' : 'FAIL'} ${gate.name}${gate.summary ? ` — ${gate.summary}` : ''}`),
    '',
    '### Guardrails',
    '- Human approval is required before applying any operation.',
    '- Expected hashes must be checked before mutation.',
    '- Re-run the full verification suite after applying the patch.',
    '- Do not merge automatically.',
  ].join('\n');
  const base = {
    draftId: id('self-heal-draft'),
    status,
    branchName,
    baseBranch,
    title,
    body,
    rootCause: { diagnosis, fingerprint: input.evidence.fingerprint, occurrences: input.evidence.occurrences, summary: safeText(input.latestSignal.message, 1000), stackTrace: input.evidence.normalizedStack },
    validation,
    operations: safeOperations,
    pushRequested: false as const,
    mergeRequested: false as const,
  };
  return { ...base, auditHash: hash(base) };
}
