import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';

export type PatchOperation = { id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string };
export interface PatchPreviewFile { target: string; type: PatchOperation['type']; beforeHash?: string; afterHash?: string; changed: boolean; diff: string; }
export interface DeveloperPatchPreview {
  patchId: string;
  workspaceRoot: string;
  operations: PatchOperation[];
  files: PatchPreviewFile[];
  status: 'READY_FOR_APPROVAL'|'NO_SAFE_PATCH';
  sourceVerificationId?: string;
  sourcePlanId?: string;
  patchHash: string;
  constraints: string[];
}

const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const patchId = () => `patch-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

function safeTarget(root: string, target: string) {
  const normalized = String(target || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) throw new Error('INVALID_PATCH_TARGET');
  const abs = path.resolve(root, normalized);
  const rel = path.relative(path.resolve(root), abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('PATCH_TARGET_OUTSIDE_WORKSPACE');
  return abs;
}

function diffText(target: string, before: string, after: string, type: PatchOperation['type']) {
  if (type === 'CREATE') return `--- /dev/null\n+++ b/${target}\n@@ CREATE @@\n${after}`;
  if (type === 'DELETE') return `--- a/${target}\n+++ /dev/null\n@@ DELETE @@\n${before}`;
  const a = before.split(/\r?\n/); const b = after.split(/\r?\n/);
  const lines: string[] = [`--- a/${target}`, `+++ b/${target}`];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i] === b[i]) lines.push(` ${a[i] ?? ''}`);
    else {
      if (a[i] !== undefined) lines.push(`-${a[i]}`);
      if (b[i] !== undefined) lines.push(`+${b[i]}`);
    }
  }
  return lines.join('\n');
}

export async function previewDeveloperPatch(input: {
  workspaceRoot: string;
  operations: PatchOperation[];
  sourceVerificationId?: string;
  sourcePlanId?: string;
}): Promise<DeveloperPatchPreview> {
  const operations = Array.isArray(input.operations) ? input.operations.slice(0, 100) : [];
  const files: PatchPreviewFile[] = [];
  const seen = new Set<string>();
  for (const op of operations) {
    if (seen.has(op.target)) throw new Error(`DUPLICATE_PATCH_TARGET:${op.target}`);
    seen.add(op.target);
    const target = safeTarget(input.workspaceRoot, op.target);
    let before: string | undefined;
    try { before = await fs.readFile(target, 'utf8'); } catch (error: any) { if (error?.code !== 'ENOENT') throw error; }
    if (op.expectedHash && hash(before ?? '') !== op.expectedHash) throw new Error(`PATCH_EXPECTATION_MISMATCH:${op.target}`);
    if (op.type === 'CREATE' && before !== undefined) throw new Error(`PATCH_TARGET_EXISTS:${op.target}`);
    if ((op.type === 'UPDATE' || op.type === 'DELETE') && before === undefined) throw new Error(`PATCH_TARGET_NOT_FOUND:${op.target}`);
    const after = op.type === 'DELETE' ? undefined : String(op.content ?? '');
    files.push({ target: op.target, type: op.type, beforeHash: before === undefined ? undefined : hash(before), afterHash: after === undefined ? undefined : hash(after), changed: before !== after, diff: diffText(op.target, before ?? '', after ?? '', op.type) });
  }
  const base = { workspaceRoot: path.resolve(input.workspaceRoot), operations, files, status: operations.length ? 'READY_FOR_APPROVAL' as const : 'NO_SAFE_PATCH' as const, sourceVerificationId: input.sourceVerificationId, sourcePlanId: input.sourcePlanId, constraints: ['Preview does not mutate the workspace', 'Approval must be explicit before apply', 'Expected hashes must remain valid at apply time', 'Targets must remain inside the controlled workspace', 'Verification must run after apply'] };
  const patchHash = hash(JSON.stringify({ workspaceRoot: base.workspaceRoot, operations: base.operations, files: base.files }));
  return { patchId: `patch-${patchHash.slice(0, 20)}`, ...base, patchHash };
}

export function assertPatchApproval(preview: DeveloperPatchPreview, input: { approved?: boolean; patchHash?: string }) {
  if (input.approved !== true) throw new Error('PATCH_APPROVAL_REQUIRED');
  if (!input.patchHash || input.patchHash !== preview.patchHash) throw new Error('PATCH_HASH_MISMATCH');
}
