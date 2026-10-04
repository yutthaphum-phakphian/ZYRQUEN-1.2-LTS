import crypto from 'node:crypto';
import { createAgentRun, loadAgentRun, completeAgentRun, type AgentRun } from './agentRunController.ts';
import { reconcileWorkspace, type ReconciliationResult } from './stateReconciliation.ts';
import { verifyDeveloperWorkflow, type DeveloperWorkflowVerificationResult } from './developerWorkflowVerification.ts';
import { previewDeveloperPatch, type DeveloperPatchPreview } from './developerPatchEngine.ts';
import { executeCrashConsistentRepair, recoverCrashConsistentRepair } from './crashConsistentRepairCoordinator.ts';
import { runAndJournalAgentReliabilityPass, type AgentReliabilitySnapshot } from './agentReliabilityControlLoop.ts';
import { evaluateRecoveryGovernance, type RecoveryGovernanceSnapshot } from './recoveryGovernance.ts';
import { assertMissionWorkerFence } from './missionWorkerSupervisor.ts';
import { supervisorControlPlane } from './supervisorControlPlane.ts';
import { saveDurableRecord, loadDurableRecord } from './durableStore.ts';

export interface AgentRunExecutionInput {
  workspaceRoot?: string;
  actualFiles?: Array<{ name: string; content: string }>;
  verification?: { workspaceRoot: string; testCommand?: string; buildCommand?: string; runTest?: boolean; runBuild?: boolean; approved?: boolean };
  repairs?: Array<{ id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }>;
  missionId?: string;
  workerId?: string;
  leaseId?: string;
  patchHash?: string;
  recoveryRepairId?: string;
  recoveryWorkerId?: string;
  reliabilityWorkerId?: string;
  autoRecover?: boolean;
  /** Force re-execution even if durable state exists (still respects terminal protection). */
  force?: boolean;
}

export interface AgentRunStepResult {
  stepId: string;
  capability: string;
  status: 'COMPLETED'|'BLOCKED'|'FAILED'|'SKIPPED'|'RECOVERY_REQUIRED';
  startedAt: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  evidence: unknown;
  auditHash: string;
}

export interface AgentRunExecutionResult {
  run: AgentRun;
  status: 'RUNNING'|'COMPLETED'|'BLOCKED'|'FAILED'|'RECOVERY_REQUIRED';
  steps: AgentRunStepResult[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  auditHash: string;
  resumeFromStepId?: string;
  version?: number;
}

const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

/** Canonical payload used for step auditHash — must not include the hash itself. */
function stepAuditPayload(step: Omit<AgentRunStepResult, 'auditHash'>): unknown {
  return {
    stepId: step.stepId,
    capability: step.capability,
    status: step.status,
    startedAt: step.startedAt,
    completedAt: step.completedAt ?? null,
    result: step.result ?? null,
    error: step.error ?? null,
    evidence: step.evidence,
  };
}

function sealStep(base: Omit<AgentRunStepResult, 'auditHash'>): AgentRunStepResult {
  return { ...base, auditHash: hash(stepAuditPayload(base)) };
}

/** Verify a step's integrity. Throws on tamper. */
export function verifyStepIntegrity(step: AgentRunStepResult): void {
  const expected = hash(stepAuditPayload(step));
  if (expected !== step.auditHash) {
    throw new Error(`EVIDENCE_INTEGRITY_FAILED:${step.stepId}`);
  }
}

/** Verify entire execution evidence chain. */
export function verifyExecutionIntegrity(execution: AgentRunExecutionResult): void {
  for (const step of execution.steps) {
    verifyStepIntegrity(step);
  }
  const base = {
    run: execution.run,
    status: execution.status,
    steps: execution.steps,
    startedAt: execution.startedAt,
    updatedAt: execution.updatedAt,
    completedAt: execution.completedAt,
    resumeFromStepId: execution.resumeFromStepId,
  };
  const expected = hash(base);
  if (expected !== execution.auditHash) {
    throw new Error('EXECUTION_INTEGRITY_FAILED');
  }
}

async function requireFence(input: AgentRunExecutionInput) {
  if (!input.missionId || !input.workerId || !input.leaseId) throw new Error('WORKER_FENCE_REQUIRED');
  await assertMissionWorkerFence(input.missionId, input.workerId, input.leaseId);
}

async function requireLeader() {
  await supervisorControlPlane.assertActiveLeadership();
}

async function executeCapability(run: AgentRun, capability: string, input: AgentRunExecutionInput): Promise<unknown> {
  switch (capability) {
    case 'workspace.inspect':
      return reconcileWorkspace({ projectId: run.projectId, actualFiles: input.actualFiles });
    case 'developer.verify':
      if (!input.verification) throw new Error('VERIFICATION_CONTEXT_REQUIRED');
      await requireFence(input);
      await requireLeader();
      return verifyDeveloperWorkflow({
        workspaceRoot: input.verification.workspaceRoot,
        testCommand: input.verification.testCommand,
        buildCommand: input.verification.buildCommand,
        runTest: input.verification.runTest,
        runBuild: input.verification.runBuild,
        approved: input.verification.approved === true,
      });
    case 'repair.preview':
      if (!input.workspaceRoot || !input.repairs?.length) throw new Error('REPAIR_PREVIEW_CONTEXT_REQUIRED');
      return previewDeveloperPatch({ workspaceRoot: input.workspaceRoot, operations: input.repairs });
    case 'repair.apply':
      if (!input.workspaceRoot || !input.repairs?.length || !input.patchHash) throw new Error('REPAIR_APPLY_CONTEXT_REQUIRED');
      await requireFence(input);
      await requireLeader();
      return executeCrashConsistentRepair({
        repairId: `agent-run:${run.runId}`,
        missionId: input.missionId!,
        projectId: run.projectId,
        workspaceRoot: input.workspaceRoot,
        workerId: input.workerId!,
        leaseId: input.leaseId!,
        operations: input.repairs.map((op, i) => ({ ...op, id: op.id || `agent-run-op-${i + 1}` })),
        patchHash: input.patchHash,
      });
    case 'repair.recover':
      if (!input.recoveryRepairId || !input.recoveryWorkerId) throw new Error('RECOVERY_CONTEXT_REQUIRED');
      await requireFence(input);
      await requireLeader();
      return recoverCrashConsistentRepair(input.recoveryRepairId, input.recoveryWorkerId);
    case 'reliability.run':
      await requireFence(input);
      await requireLeader();
      return runAndJournalAgentReliabilityPass({ projectId: run.projectId, recoveryWorkerId: input.reliabilityWorkerId, autoRecover: input.autoRecover, missionId: input.missionId });
    case 'recovery.governance':
      await requireLeader();
      return evaluateRecoveryGovernance(run.projectId);
    default:
      throw new Error(`UNSUPPORTED_AGENT_CAPABILITY:${capability}`);
  }
}

/** Errors that indicate an ambiguous / non-auto-recoverable state requiring explicit recovery. */
const RECOVERY_REQUIRED_PATTERNS = [
  /RECOVERY_REQUIRED/,
  /AMBIGUOUS/,
  /FENCE_CONFLICT/,
  /TRANSACTION_MISSING/,
  /INTEGRITY_FAILED/,
  /STALE_RECORD_VERSION/,
  /STALE_WORKSPACE_VERSION/,
  /ACTIVE_WORKER_FENCE/,
];

function isRecoveryRequiredError(reason: string): boolean {
  return RECOVERY_REQUIRED_PATTERNS.some((p) => p.test(reason));
}

/**
 * Governed Autonomous Execution entrypoint.
 * Supports durable resume, idempotent re-execution of terminal states,
 * evidence integrity verification, and recovery-boundary classification.
 */
export async function executeAgentRun(runId: string, input: AgentRunExecutionInput = {}): Promise<AgentRunExecutionResult> {
  const run = await loadAgentRun(clean(runId));
  if (!run) throw new Error('AGENT_RUN_NOT_FOUND');
  if (run.status === 'CANCELLED') throw new Error(`AGENT_RUN_TERMINAL:${run.status}`);
  if (run.status === 'APPROVAL_REQUIRED') throw new Error('AGENT_RUN_APPROVAL_REQUIRED');

  // Load prior durable execution state (if any)
  const priorEnvelope = await loadDurableRecord<AgentRunExecutionResult>('agent-run-execution', run.runId);
  let prior: AgentRunExecutionResult | null = priorEnvelope?.payload ?? null;
  let currentVersion = priorEnvelope?.version ?? 0;

  // Integrity check on prior evidence — fail-closed on corruption
  if (prior) {
    try {
      verifyExecutionIntegrity(prior);
    } catch (err) {
      throw new Error(`CORRUPTED_EXECUTION_EVIDENCE:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Terminal-state protection / idempotent return
  if (prior && (prior.status === 'COMPLETED' || prior.status === 'FAILED' || prior.status === 'RECOVERY_REQUIRED')) {
    if (!input.force) {
      // Idempotent: return the sealed terminal result without re-executing
      return { ...prior, version: currentVersion };
    }
    // force=true still refuses to reopen a terminal agent-run status
    if (run.status === 'COMPLETED' || run.status === 'FAILED') {
      throw new Error(`AGENT_RUN_TERMINAL:${run.status}`);
    }
  }

  // Resume path: reuse already-COMPLETED steps that pass integrity
  const results: AgentRunStepResult[] = [];
  const completed = new Set<string>();
  let resumeFromStepId: string | undefined;
  const now = () => new Date().toISOString();
  const executionStartedAt = prior?.startedAt ?? now();

  if (prior && prior.status === 'RUNNING' && Array.isArray(prior.steps)) {
    for (const step of prior.steps) {
      if (step.status === 'COMPLETED') {
        verifyStepIntegrity(step); // throws if tampered
        results.push(step);
        completed.add(step.stepId);
      } else if (step.status === 'FAILED' || step.status === 'RECOVERY_REQUIRED' || step.status === 'BLOCKED') {
        // Do not silently continue past a prior failure; require explicit recovery path
        throw new Error(`PRIOR_STEP_NOT_RESUMABLE:${step.stepId}:${step.status}`);
      }
    }
    if (results.length > 0) {
      resumeFromStepId = results[results.length - 1].stepId;
    }
  }

  const persistExecution = async (
    status: AgentRunExecutionResult['status'],
    currentRun: AgentRun = run,
    extra?: { completedAt?: string },
  ): Promise<AgentRunExecutionResult> => {
    const updatedAt = now();
    const base: Omit<AgentRunExecutionResult, 'auditHash' | 'version'> = {
      run: currentRun,
      status,
      steps: [...results],
      startedAt: executionStartedAt,
      updatedAt,
      completedAt: extra?.completedAt,
      resumeFromStepId,
    };
    const output: AgentRunExecutionResult = { ...base, auditHash: hash(base) };
    // Optimistic concurrency against currentVersion
    const envelope = await saveDurableRecord('agent-run-execution', run.runId, output, currentVersion);
    output.version = envelope.version;
    currentVersion = envelope.version;
    return output;
  };

  // Fresh or resumed RUNNING marker
  let current = await persistExecution('RUNNING');

  try {
    for (const step of run.plan.steps) {
      // Skip already completed (durable resume)
      if (completed.has(step.stepId)) continue;

      if (step.dependsOn.some((dep) => !completed.has(dep))) {
        const blocked = sealStep({
          stepId: step.stepId,
          capability: step.capability,
          status: 'BLOCKED',
          startedAt: now(),
          completedAt: now(),
          error: 'DEPENDENCY_NOT_COMPLETED',
          evidence: ['DEPENDENCY_NOT_COMPLETED'],
        });
        results.push(blocked);
        throw new Error(`AGENT_RUN_DEPENDENCY_BLOCKED:${step.stepId}`);
      }

      if (step.requiresApproval && !run.approval) {
        throw new Error(`STEP_APPROVAL_REQUIRED:${step.stepId}`);
      }

      const startedAt = now();
      let evidence: unknown;
      try {
        evidence = await executeCapability(run, step.capability, input);
      } catch (capErr) {
        const reason = capErr instanceof Error ? capErr.message : String(capErr);
        const status = isRecoveryRequiredError(reason) ? 'RECOVERY_REQUIRED' as const : 'FAILED' as const;
        const failedStep = sealStep({
          stepId: step.stepId,
          capability: step.capability,
          status,
          startedAt,
          completedAt: now(),
          error: reason,
          evidence: [reason],
        });
        results.push(failedStep);
        if (status === 'RECOVERY_REQUIRED') {
          // Do not auto-complete the run; leave agent-run status as-is for recovery authority
          current = await persistExecution('RECOVERY_REQUIRED');
          return current;
        }
        throw capErr; // surface as FAILED path below
      }

      const result = sealStep({
        stepId: step.stepId,
        capability: step.capability,
        status: 'COMPLETED',
        startedAt,
        completedAt: now(),
        result: evidence,
        evidence,
      });
      results.push(result);
      completed.add(step.stepId);
      current = await persistExecution('RUNNING');
    }

    // All steps done — finalize only after real completion
    const finished = await completeAgentRun(run.runId, true);
    return persistExecution('COMPLETED', finished, { completedAt: now() });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    // Avoid double-pushing if we already recorded a failed step above
    const last = results[results.length - 1];
    if (!last || last.status === 'COMPLETED' || last.status === 'SKIPPED') {
      results.push(sealStep({
        stepId: `failure-${results.length + 1}`,
        capability: 'agent.run',
        status: isRecoveryRequiredError(reason) ? 'RECOVERY_REQUIRED' : 'FAILED',
        startedAt: now(),
        completedAt: now(),
        error: reason,
        evidence: [reason],
      }));
    }

    if (isRecoveryRequiredError(reason) || last?.status === 'RECOVERY_REQUIRED') {
      current = await persistExecution('RECOVERY_REQUIRED');
      return current;
    }

    // Terminal failure — only transition agent-run if it was in an executable state
    const failed =
      run.status === 'APPROVED' || run.status === 'READY'
        ? await completeAgentRun(run.runId, false)
        : run;
    return persistExecution('FAILED', failed, { completedAt: now() });
  }
}

export async function loadAgentRunExecution(runId: string): Promise<AgentRunExecutionResult | null> {
  const envelope = await loadDurableRecord<AgentRunExecutionResult>('agent-run-execution', clean(runId));
  if (!envelope) return null;
  // Always verify integrity on load — fail-closed
  verifyExecutionIntegrity(envelope.payload);
  return { ...envelope.payload, version: envelope.version };
}

/**
 * Explicit recovery entry for RECOVERY_REQUIRED executions.
 * Re-verifies authority/fence/leader, then re-runs remaining steps and requires
 * successful re-verification before declaring COMPLETED.
 */
export async function recoverAndResumeAgentRun(
  runId: string,
  input: AgentRunExecutionInput & { recoveryApprovedBy?: string },
): Promise<AgentRunExecutionResult> {
  const run = await loadAgentRun(clean(runId));
  if (!run) throw new Error('AGENT_RUN_NOT_FOUND');
  if (run.status === 'CANCELLED' || run.status === 'COMPLETED') {
    throw new Error(`AGENT_RUN_TERMINAL:${run.status}`);
  }

  const prior = await loadAgentRunExecution(runId);
  if (!prior) throw new Error('NO_EXECUTION_STATE_TO_RECOVER');
  if (prior.status !== 'RECOVERY_REQUIRED' && prior.status !== 'FAILED' && prior.status !== 'RUNNING') {
    // Already terminal success — idempotent
    if (prior.status === 'COMPLETED') return prior;
    throw new Error(`RECOVERY_NOT_APPLICABLE:${prior.status}`);
  }

  // Recovery must pass the same policy/capability/leader/fence gates
  await requireLeader();
  if (input.missionId) await requireFence(input);

  // Clear non-COMPLETED steps so resume will re-execute them
  // (we keep COMPLETED evidence intact)
  const sealedCompleted = prior.steps.filter((s) => s.status === 'COMPLETED');
  for (const s of sealedCompleted) verifyStepIntegrity(s);

  // Persist a clean RUNNING state with only verified completed steps, then resume
  const base = {
    run,
    status: 'RUNNING' as const,
    steps: sealedCompleted,
    startedAt: prior.startedAt,
    updatedAt: new Date().toISOString(),
    resumeFromStepId: sealedCompleted.length ? sealedCompleted[sealedCompleted.length - 1].stepId : undefined,
  };
  const cleaned: AgentRunExecutionResult = { ...base, auditHash: hash(base) };
  const envelope = await saveDurableRecord(
    'agent-run-execution',
    run.runId,
    cleaned,
    prior.version ?? 0,
  );

  // Now execute remaining steps (force=false so terminal protection still applies)
  return executeAgentRun(runId, { ...input, force: false });
}

export async function createAndExecuteAgentRun(
  input: Parameters<typeof createAgentRun>[0] & { execution?: AgentRunExecutionInput },
) {
  const run = await createAgentRun(input);
  if (run.status === 'BLOCKED' || run.status === 'APPROVAL_REQUIRED') return { run, execution: null };
  return { run, execution: await executeAgentRun(run.runId, input.execution) };
}
