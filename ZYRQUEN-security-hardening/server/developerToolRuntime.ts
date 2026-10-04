import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { executeLocalCommand, type LocalExecutionResult } from './localExecutionRuntime.ts';

export type DeveloperToolAction = 'READ' | 'SEARCH' | 'RUN_TEST' | 'RUN_BUILD' | 'INSPECT';

export interface DeveloperToolRequest {
  action: DeveloperToolAction;
  projectId?: string;
  workspaceRoot?: string;
  path?: string;
  query?: string;
  command?: string;
  files?: Array<{ name: string; content: string }>;
  approved?: boolean;
  maxBytes?: number;
  timeoutMs?: number;
}

export interface DeveloperToolResult {
  ok: boolean;
  action: DeveloperToolAction;
  executionId: string;
  startedAt: string;
  completedAt: string;
  data?: unknown;
  error?: string;
  audit: { action: string; target?: string; approved: boolean; timestamp: string; sha256?: string };
}

const MAX_BYTES = 512 * 1024;
const iso = () => new Date().toISOString();
const id = () => `devtool-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const hash = (value: string | Buffer) => crypto.createHash('sha256').update(value).digest('hex');

function safeRelative(input: string): string {
  const normalized = input.replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || normalized.includes('\0')) throw new Error('PATH_TRAVERSAL_BLOCKED');
  const resolved = path.posix.normalize(normalized);
  if (resolved === '..' || resolved.startsWith('../')) throw new Error('PATH_TRAVERSAL_BLOCKED');
  return resolved.replace(/^\.\//, '');
}

function rootFor(req: DeveloperToolRequest): string {
  const root = req.workspaceRoot || path.join(process.cwd(), 'workspace', req.projectId || 'default');
  if (path.isAbsolute(root) && req.workspaceRoot && !root.startsWith(path.resolve(process.cwd()))) throw new Error('WORKSPACE_ROOT_BLOCKED');
  return path.resolve(root);
}

async function readFile(root: string, rel: string, maxBytes: number) {
  const safe = safeRelative(rel);
  const target = path.resolve(root, safe);
  if (!target.startsWith(root + path.sep) && target !== root) throw new Error('PATH_TRAVERSAL_BLOCKED');
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw new Error('NOT_A_FILE');
  const data = await fs.readFile(target);
  return { path: safe, size: data.length, sha256: hash(data), content: data.subarray(0, maxBytes).toString('utf8'), truncated: data.length > maxBytes };
}

async function search(root: string, query: string, maxBytes: number) {
  if (!query?.trim()) throw new Error('QUERY_REQUIRED');
  const results: Array<{ path: string; line: number; text: string }> = [];
  const ignored = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out']);
  async function walk(dir: string) {
    if (results.length >= 200) return;
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { await walk(full); continue; }
      if (!entry.isFile()) continue;
      try {
        const stat = await fs.stat(full);
        if (stat.size > maxBytes) continue;
        const text = await fs.readFile(full, 'utf8');
        if (text.includes('\0')) continue;
        const lines = text.split(/\r?\n/);
        lines.forEach((line, index) => { if (results.length < 200 && line.toLowerCase().includes(query.toLowerCase())) results.push({ path: path.relative(root, full).replace(/\\/g, '/'), line: index + 1, text: line.slice(0, 500) }); });
      } catch { /* unreadable/binary */ }
    }
  }
  await walk(root);
  return { query, count: results.length, results };
}

async function inspect(root: string) {
  const candidates = ['dist', 'build', '.next', 'out'];
  const artifacts: Array<{ path: string; size: number; sha256: string }> = [];
  for (const rel of candidates) {
    const dir = path.join(root, rel);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries.slice(0, 100)) {
        if (!entry.isFile()) continue;
        const full = path.join(dir, entry.name);
        const data = await fs.readFile(full);
        artifacts.push({ path: path.relative(root, full).replace(/\\/g, '/'), size: data.length, sha256: hash(data) });
      }
    } catch { /* optional */ }
  }
  return { root, artifacts, artifactCount: artifacts.length };
}

async function runCommand(action: 'RUN_TEST' | 'RUN_BUILD', req: DeveloperToolRequest, root: string): Promise<LocalExecutionResult> {
  if (!req.approved) throw new Error('APPROVAL_REQUIRED');
  const command = req.command || (action === 'RUN_TEST' ? 'npm test' : 'npm run build');
  return executeLocalCommand({ command, cwd: '', files: req.files, projectId: req.projectId || 'developer-tool', workspaceRoot: root, approved: true, permission: 'SAFE', timeoutMs: req.timeoutMs });
}

export async function runDeveloperTool(req: DeveloperToolRequest): Promise<DeveloperToolResult> {
  const executionId = id();
  const startedAt = iso();
  const approved = req.approved === true;
  try {
    if (!req.action) throw new Error('ACTION_REQUIRED');
    if ((req.action === 'RUN_TEST' || req.action === 'RUN_BUILD') && !approved) throw new Error('APPROVAL_REQUIRED');
    const root = rootFor(req);
    let data: unknown;
    if (req.action === 'READ') data = await readFile(root, req.path || '', Math.min(Math.max(req.maxBytes || MAX_BYTES, 1), MAX_BYTES));
    else if (req.action === 'SEARCH') data = await search(root, req.query || '', Math.min(Math.max(req.maxBytes || MAX_BYTES, 1), MAX_BYTES));
    else if (req.action === 'INSPECT') data = await inspect(root);
    else data = await runCommand(req.action, req, root);
    const serialized = JSON.stringify(data);
    const commandOk = req.action === 'RUN_TEST' || req.action === 'RUN_BUILD'
      ? (data as LocalExecutionResult).status === 'SUCCESS'
      : true;
    return { ok: commandOk, action: req.action, executionId, startedAt, completedAt: iso(), data, error: commandOk ? undefined : `EXECUTION_${(data as LocalExecutionResult).status}`, audit: { action: req.action, target: req.path || req.command, approved, timestamp: iso(), sha256: hash(serialized) } };
  } catch (error) {
    return { ok: false, action: req.action, executionId, startedAt, completedAt: iso(), error: error instanceof Error ? error.message : String(error), audit: { action: req.action, target: req.path || req.command, approved, timestamp: iso() } };
  }
}
