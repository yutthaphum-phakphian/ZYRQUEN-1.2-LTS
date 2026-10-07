import crypto from 'node:crypto';
import { runDeveloperTool, type DeveloperToolResult } from './developerToolRuntime.ts';

export type VerificationStatus = 'PASSED' | 'FAILED' | 'APPROVAL_REQUIRED';

export interface DeveloperWorkflowVerificationRequest {
  workspaceRoot: string;
  projectId?: string;
  approved?: boolean;
  runTest?: boolean;
  runBuild?: boolean;
  testCommand?: string;
  buildCommand?: string;
  timeoutMs?: number;
  inspectArtifacts?: boolean;
}

export interface DeveloperWorkflowVerificationResult {
  verificationId: string;
  status: VerificationStatus;
  startedAt: string;
  completedAt: string;
  steps: Array<{
    action: string;
    ok: boolean;
    executionId?: string;
    error?: string;
    summary?: unknown;
  }>;
  repairRequired: boolean;
  auditHash: string;
}

const id = () => `verify-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

function summarize(result: DeveloperToolResult): unknown {
  if (!result.ok) return { error: result.error };
  const data = result.data as any;
  if (data?.status) return { status: data.status, exitCode: data.exitCode, output: String(data.output || '').slice(-4000) };
  if (data?.artifactCount !== undefined) return { artifactCount: data.artifactCount, artifacts: data.artifacts?.slice(0, 50) };
  return { ok: true };
}

export async function verifyDeveloperWorkflow(req: DeveloperWorkflowVerificationRequest): Promise<DeveloperWorkflowVerificationResult> {
  const verificationId = id();
  const startedAt = new Date().toISOString();
  const steps: DeveloperWorkflowVerificationResult['steps'] = [];
  const wantsTest = req.runTest !== false;
  const wantsBuild = req.runBuild !== false;
  const approved = req.approved === true;

  if ((wantsTest || wantsBuild) && !approved) {
    const result = { verificationId, status: 'APPROVAL_REQUIRED' as const, startedAt, completedAt: new Date().toISOString(), steps: [], repairRequired: false, auditHash: '' };
    result.auditHash = hash(result);
    return result;
  }

  const run = async (action: 'RUN_TEST' | 'RUN_BUILD', command?: string) => {
    const tool = await runDeveloperTool({ action, projectId: req.projectId, workspaceRoot: req.workspaceRoot, approved, command, timeoutMs: req.timeoutMs });
    steps.push({ action, ok: tool.ok, executionId: tool.executionId, error: tool.error, summary: summarize(tool) });
    return tool.ok;
  };

  let passed = true;
  if (wantsTest) passed = (await run('RUN_TEST', req.testCommand)) && passed;
  if (passed && wantsBuild) passed = (await run('RUN_BUILD', req.buildCommand)) && passed;

  if (passed && req.inspectArtifacts !== false) {
    const inspect = await runDeveloperTool({ action: 'INSPECT', projectId: req.projectId, workspaceRoot: req.workspaceRoot });
    steps.push({ action: 'INSPECT', ok: inspect.ok, executionId: inspect.executionId, error: inspect.error, summary: summarize(inspect) });
    passed = inspect.ok && passed;
  }

  const result: DeveloperWorkflowVerificationResult = {
    verificationId,
    status: passed ? 'PASSED' : 'FAILED',
    startedAt,
    completedAt: new Date().toISOString(),
    steps,
    repairRequired: !passed,
    auditHash: '',
  };
  result.auditHash = hash(result);
  return result;
}
