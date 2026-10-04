export type LocalExecutionStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'BLOCKED' | 'UNAVAILABLE';
export type LocalExecutionPermission = 'SAFE' | 'REVIEW' | 'DANGEROUS';
export type ExecutionTaskType = 'RUN_TEST' | 'RUN_BUILD' | 'RUN_LINT' | 'RUN_TYPECHECK' | 'RUN_INSPECT';

export interface LocalExecutionRequest {
  command: string;
  cwd?: string;
  files: Array<{ name: string; content: string }>;
  projectId?: string;
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
  signal: string | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  status: LocalExecutionStatus;
  reason?: string;
  outputTruncated?: boolean;
  artifacts?: Array<{ path: string; size: number; sha256: string }>;
}

const SAFE_COMMANDS: Record<ExecutionTaskType, string> = {
  RUN_TEST: 'npm test',
  RUN_BUILD: 'npm run build',
  RUN_LINT: 'npm run lint',
  RUN_TYPECHECK: 'npm run typecheck',
  RUN_INSPECT: 'npm run inspect',
};

export function commandForTask(type: ExecutionTaskType, availableScripts: string[] = []): string | null {
  const preferred = SAFE_COMMANDS[type];
  const script = preferred.split(' ').slice(2).join(' ');
  if (type === 'RUN_TEST') return availableScripts.includes('test') ? 'npm test' : null;
  if (type === 'RUN_BUILD') return availableScripts.includes('build') ? 'npm run build' : null;
  if (type === 'RUN_LINT') return availableScripts.includes('lint') ? 'npm run lint' : null;
  if (type === 'RUN_TYPECHECK') return availableScripts.includes('typecheck') ? 'npm run typecheck' : availableScripts.includes('lint') ? 'npm run lint' : null;
  if (type === 'RUN_INSPECT') return availableScripts.includes('inspect') ? 'npm run inspect' : null;
  return script || null;
}

export async function executeLocalRuntime(request: LocalExecutionRequest): Promise<LocalExecutionResult> {
  const response = await fetch('/api/runtime/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `RUNTIME_HTTP_${response.status}`);
  }
  return response.json() as Promise<LocalExecutionResult>;
}

export function summarizeExecution(result: LocalExecutionResult): string {
  if (result.status === 'SUCCESS') return `${result.command} ผ่าน (${result.durationMs}ms, exit ${result.exitCode})`;
  if (result.status === 'TIMEOUT') return `${result.command} timeout หลัง ${result.durationMs}ms`;
  if (result.status === 'BLOCKED') return `${result.command} ถูกบล็อก: ${result.reason || 'security policy'}`;
  if (result.status === 'UNAVAILABLE') return `${result.command} ใช้งานไม่ได้: ${result.reason || 'runtime unavailable'}`;
  return `${result.command} ไม่ผ่าน (exit ${result.exitCode ?? 'null'})`;
}
