import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export type LocalExecutionStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'BLOCKED' | 'UNAVAILABLE';
export type LocalExecutionPermission = 'SAFE' | 'REVIEW' | 'DANGEROUS';

export interface WorkspaceFileInput { name: string; content: string; }
export interface LocalExecutionRequest {
  command: string;
  cwd?: string;
  files?: WorkspaceFileInput[];
  projectId?: string;
  workspaceRoot?: string;
  permission?: LocalExecutionPermission;
  approved?: boolean;
  timeoutMs?: number;
  maxOutputBytes?: number;
}
export interface LocalExecutionResult {
  executionId: string;
  command: string;
  cwd: string;
  startedAt: string;
  completedAt: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  status: LocalExecutionStatus;
  reason?: string;
  outputTruncated?: boolean;
  workspaceRoot?: string;
  artifacts?: Array<{ path: string; size: number; sha256: string }>;
}

const MAX_TIMEOUT = 120_000;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_OUTPUT = 256 * 1024;
const MAX_OUTPUT = 1024 * 1024;
const SAFE_EXECUTABLES = new Set(['node', 'npm', 'npx', 'bun', 'pnpm', 'yarn', 'tsc', 'vite']);
const FORBIDDEN = /(?:^|[;&|<>`$\n\r]|\$\(|\b)(?:sudo|shutdown|reboot|rm|rmdir|del|format|mkfs|chmod|chown|curl|wget|powershell|pwsh|cmd|bash|sh)(?:\b|$)/i;
const SHELL_META = /[;&|<>`\n\r]|\$\(|\$\{|\b(?:sudo|shutdown|reboot|rm|rmdir|del|format|mkfs|chmod|chown|curl|wget|powershell|pwsh|cmd|bash|sh)\b/i;

const iso = () => new Date().toISOString();
const id = () => `exec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const hash = (buf: Buffer | string) => crypto.createHash('sha256').update(buf).digest('hex');

function safeRelative(input: string): string {
  const normalized = input.replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || normalized.includes('\0')) throw new Error('PATH_TRAVERSAL_BLOCKED');
  const resolved = path.posix.normalize(normalized);
  if (resolved === '..' || resolved.startsWith('../')) throw new Error('PATH_TRAVERSAL_BLOCKED');
  return resolved.replace(/^\.\//, '');
}

function tokenize(command: string): string[] {
  if (typeof command !== 'string' || !command.trim()) throw new Error('COMMAND_REQUIRED');
  if (SHELL_META.test(command) || FORBIDDEN.test(command)) throw new Error('COMMAND_BLOCKED');
  const out: string[] = [];
  const re = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|([^\s]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(command)) !== null) out.push(match[1] ?? match[2] ?? match[3]);
  if (!out.length) throw new Error('COMMAND_REQUIRED');
  return out;
}

function validateArgs(args: string[]) {
  const executable = path.basename(args[0]);
  if (!SAFE_EXECUTABLES.has(executable)) throw new Error('COMMAND_BLOCKED');
  for (const arg of args.slice(1)) {
    if (/^--?(?:eval|require|loader|experimental-loader|inspect|inspect-brk|input-type)=/.test(arg) && executable === 'node') throw new Error('COMMAND_BLOCKED');
    if (/^(?:-e|--eval|-r|--require)$/.test(arg)) throw new Error('COMMAND_BLOCKED');
    if (/^(?:https?:|file:\/\/)/i.test(arg)) throw new Error('COMMAND_BLOCKED');
    if (arg.includes('..\\') || arg.includes('../') || arg.startsWith('/') || /^[A-Za-z]:[\\/]/.test(arg)) throw new Error('PATH_TRAVERSAL_BLOCKED');
  }
}

function scriptIsSafe(script: string): boolean {
  if (!script || SHELL_META.test(script) || FORBIDDEN.test(script)) return false;
  try { validateArgs(tokenize(script)); return true; } catch { return false; }
}

function allowedWorkspaceRoot(root: string): boolean {
  const configured = String(process.env.CODEVOICE_ALLOWED_WORKSPACE_ROOTS || '').split(path.delimiter).map(s => s.trim()).filter(Boolean);
  if (configured.length === 0) return false;
  const resolved = path.resolve(root);
  return configured.some(base => {
    const b = path.resolve(base);
    return resolved === b || resolved.startsWith(b + path.sep);
  });
}

async function ensureWorkspace(projectId: string, files: WorkspaceFileInput[], workspaceRoot?: string): Promise<string> {
  const defaultRoot = path.join(os.tmpdir(), 'codevoice-ai-runtime', projectId.replace(/[^A-Za-z0-9_-]/g, '_'));
  const root = workspaceRoot ? path.resolve(workspaceRoot) : defaultRoot;
  if (workspaceRoot && (!path.isAbsolute(root) || !allowedWorkspaceRoot(root))) throw new Error('WORKSPACE_ROOT_BLOCKED');
  await fs.mkdir(root, { recursive: true });
  for (const file of files || []) {
    const rel = safeRelative(file.name);
    const target = path.join(root, rel);
    const relativeBack = path.relative(root, target);
    if (relativeBack.startsWith('..') || path.isAbsolute(relativeBack)) throw new Error('PATH_TRAVERSAL_BLOCKED');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, String(file.content ?? ''), 'utf8');
  }
  return root;
}

async function verifyScript(root: string, args: string[]) {
  const executable = path.basename(args[0]);
  if (!['npm', 'npx', 'pnpm', 'yarn', 'bun'].includes(executable)) return;
  let pkg: any = null;
  try { pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')); } catch { return; }
  if (executable === 'npm' && args[1] === 'run') {
    const scriptName = args[2];
    if (!scriptName) throw new Error('SCRIPT_MISSING');
    const script = pkg?.scripts?.[scriptName];
    if (typeof script !== 'string') throw new Error('SCRIPT_MISSING');
    if (!scriptIsSafe(script)) throw new Error('COMMAND_BLOCKED');
  }
  if (executable === 'npm' && args[1] === 'test') {
    const script = pkg?.scripts?.test;
    if (typeof script !== 'string') throw new Error('SCRIPT_MISSING');
    if (!scriptIsSafe(script)) throw new Error('COMMAND_BLOCKED');
  }
}

function boundedAppend(state: { stdout: string; stderr: string; bytes: number; truncated: boolean }, chunk: Buffer, target: 'stdout' | 'stderr', max: number) {
  if (state.bytes >= max) { state.truncated = true; return; }
  const remaining = max - state.bytes;
  const text = chunk.subarray(0, remaining).toString('utf8');
  state[target] += text;
  state.bytes += Buffer.byteLength(text);
  if (chunk.length > Buffer.byteLength(text)) state.truncated = true;
}

async function inspectArtifacts(root: string): Promise<LocalExecutionResult['artifacts']> {
  const candidates = ['dist', 'build', '.next', 'out'];
  const artifacts: NonNullable<LocalExecutionResult['artifacts']> = [];
  for (const rel of candidates) {
    const dir = path.join(root, rel);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries.slice(0, 50)) {
        if (!entry.isFile()) continue;
        const p = path.join(dir, entry.name);
        const data = await fs.readFile(p);
        artifacts.push({ path: path.relative(root, p).replace(/\\/g, '/'), size: data.length, sha256: hash(data) });
      }
    } catch { /* artifact directory may not exist */ }
  }
  return artifacts;
}

export async function executeLocalCommand(req: LocalExecutionRequest): Promise<LocalExecutionResult> {
  const executionId = id();
  const startedAt = iso();
  const started = Date.now();
  const timeoutMs = Math.min(Math.max(Number(req.timeoutMs || DEFAULT_TIMEOUT), 100), MAX_TIMEOUT);
  const maxOutputBytes = Math.min(Math.max(Number(req.maxOutputBytes || DEFAULT_OUTPUT), 1024), MAX_OUTPUT);
  const permission = req.permission || 'SAFE';

  let args: string[];
  try {
    args = tokenize(req.command);
    validateArgs(args);
    if (permission !== 'SAFE' && req.approved !== true) throw new Error('PERMISSION_DENIED');
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { executionId, command: req.command, cwd: '', startedAt, completedAt: iso(), exitCode: null, signal: null, stdout: '', stderr: '', durationMs: Date.now() - started, timedOut: false, status: 'BLOCKED', reason };
  }

  let root: string;
  try { root = await ensureWorkspace(req.projectId || 'default', req.files || [], req.workspaceRoot); }
  catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { executionId, command: req.command, cwd: '', startedAt, completedAt: iso(), exitCode: null, signal: null, stdout: '', stderr: '', durationMs: Date.now() - started, timedOut: false, status: 'BLOCKED', reason };
  }

  let requestedCwd = '';
  try { requestedCwd = req.cwd ? safeRelative(req.cwd) : ''; } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { executionId, command: req.command, cwd: '', startedAt, completedAt: iso(), exitCode: null, signal: null, stdout: '', stderr: '', durationMs: Date.now() - started, timedOut: false, status: 'BLOCKED', reason, workspaceRoot: root };
  }
  const cwd = path.resolve(root, requestedCwd);
  if (cwd !== root && !cwd.startsWith(root + path.sep)) return { executionId, command: req.command, cwd: '', startedAt, completedAt: iso(), exitCode: null, signal: null, stdout: '', stderr: '', durationMs: Date.now() - started, timedOut: false, status: 'BLOCKED', reason: 'WORKSPACE_BOUNDARY_BLOCKED', workspaceRoot: root };
  await fs.mkdir(cwd, { recursive: true });
  try { await verifyScript(root, args); }
  catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { executionId, command: req.command, cwd: path.relative(root, cwd) || '.', startedAt, completedAt: iso(), exitCode: null, signal: null, stdout: '', stderr: '', durationMs: Date.now() - started, timedOut: false, status: reason === 'SCRIPT_MISSING' ? 'UNAVAILABLE' : 'BLOCKED', reason, workspaceRoot: root };
  }

  const output = { stdout: '', stderr: '', bytes: 0, truncated: false };
  const child = spawn(args[0], args.slice(1), { cwd, shell: false, windowsHide: true, detached: process.platform !== 'win32', env: { PATH: process.env.PATH || '', NODE_ENV: 'test' } });
  let timedOut = false;
  let timer: NodeJS.Timeout | undefined;
  const cleanup = () => { if (timer) clearTimeout(timer); };
  child.stdout.on('data', (chunk: Buffer) => boundedAppend(output, chunk, 'stdout', maxOutputBytes));
  child.stderr.on('data', (chunk: Buffer) => boundedAppend(output, chunk, 'stderr', maxOutputBytes));
  timer = setTimeout(() => {
    timedOut = true;
    try {
      if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch { try { child.kill('SIGTERM'); } catch { /* process already exited */ } }
    setTimeout(() => {
      try {
        if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL');
        else if (!child.killed) child.kill('SIGKILL');
      } catch { /* process already exited */ }
    }, 1000);
  }, timeoutMs);

  const result = await new Promise<LocalExecutionResult>((resolve) => {
    child.on('error', (error) => {
      cleanup();
      resolve({ executionId, command: req.command, cwd: path.relative(root, cwd) || '.', startedAt, completedAt: iso(), exitCode: null, signal: null, stdout: output.stdout, stderr: `${output.stderr}${error.message}`, durationMs: Date.now() - started, timedOut, status: 'UNAVAILABLE', reason: 'RUNTIME_MISSING', outputTruncated: output.truncated, workspaceRoot: root });
    });
    child.on('close', async (code, signal) => {
      cleanup();
      const status: LocalExecutionStatus = timedOut ? 'TIMEOUT' : code === 0 ? 'SUCCESS' : 'FAILED';
      resolve({ executionId, command: req.command, cwd: path.relative(root, cwd) || '.', startedAt, completedAt: iso(), exitCode: code, signal, stdout: output.stdout, stderr: output.stderr, durationMs: Date.now() - started, timedOut, status, outputTruncated: output.truncated, workspaceRoot: root, artifacts: status === 'SUCCESS' ? await inspectArtifacts(root) : [] });
    });
  });
  return result;
}
