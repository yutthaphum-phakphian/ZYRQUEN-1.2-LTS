import crypto from 'node:crypto';
import { createAgentExecutionPlan, type AgentExecutionPlan } from './agentPlanningLayer.ts';
import { loadAgentPolicy, decideAgentCapability } from './agentPolicyEngine.ts';
import { simulateAgentExecution, type SimulationResult } from './agentSimulationEngine.ts';
import { loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import { admitUpgrade, createUpgradeCheck, type UpgradeAdmission } from './upgradeAdmission.ts';

export type AgentRunStatus = 'BLOCKED' | 'APPROVAL_REQUIRED' | 'READY' | 'APPROVED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
export interface AgentRun {
  runId: string;
  projectId: string;
  agentId: string;
  goal: string;
  status: AgentRunStatus;
  plan: AgentExecutionPlan;
  simulation: SimulationResult;
  admission: UpgradeAdmission;
  decisions: Array<ReturnType<typeof decideAgentCapability>>;
  approval?: { approvedAt: string; approvedBy: string; approvalHash: string };
  createdAt: string;
  updatedAt: string;
  auditHash: string;
}

const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const clean = (v: unknown, max = 160) => String(v ?? '').trim().slice(0, max);
const allowedTransitions: Record<AgentRunStatus, AgentRunStatus[]> = {
  BLOCKED: ['CANCELLED'],
  APPROVAL_REQUIRED: ['APPROVED', 'CANCELLED'],
  READY: ['APPROVED', 'CANCELLED', 'COMPLETED'],
  APPROVED: ['COMPLETED', 'FAILED', 'CANCELLED'],
  CANCELLED: [], COMPLETED: [], FAILED: [],
};

function seal(base: Omit<AgentRun, 'auditHash'>): AgentRun { return { ...base, auditHash: hash(base) }; }
async function persist(run: AgentRun) {
  const current = await loadDurableRecord<AgentRun>('agent-run', run.runId);
  return (await saveDurableRecord('agent-run', run.runId, run, current?.version ?? 0)).payload;
}

export async function createAgentRun(input: {
  projectId: string; agentId: string; goal: string; capabilities?: string[];
  maxRisk?: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; maxAttempts?: number;
}): Promise<AgentRun> {
  const projectId = clean(input.projectId), agentId = clean(input.agentId), goal = clean(input.goal, 2000);
  if (!projectId || !agentId || !goal) throw new Error('INVALID_AGENT_RUN');
  const plan = createAgentExecutionPlan({ projectId, goal, capabilities: input.capabilities, maxRisk: input.maxRisk, maxAttempts: input.maxAttempts });
  const policy = await loadAgentPolicy(projectId);
  const capabilities = [...new Set(plan.steps.map(s => s.capability))];
  const decisions = capabilities.map(capability => decideAgentCapability(policy, agentId, capability));
  const simulation = await simulateAgentExecution({ projectId, goal, capabilities, maxRisk: input.maxRisk, maxAttempts: input.maxAttempts });
  const denied = decisions.filter(d => !d.allowed);
  const admission = admitUpgrade([
    createUpgradeCheck('PLAN_READY', plan.status === 'READY', plan.status === 'READY' ? 'Execution plan is ready' : 'Execution plan contains denied capabilities'),
    createUpgradeCheck('SIMULATION_ALLOWED', simulation.outcome !== 'BLOCKED', simulation.outcome === 'BLOCKED' ? 'Simulation blocked execution' : `Simulation outcome: ${simulation.outcome}`),
    createUpgradeCheck('POLICY_CAPABILITIES', denied.length === 0, denied.length === 0 ? 'All requested capabilities are admitted' : `Denied capabilities: ${denied.length}`),
  ]);
  const requiresApproval = decisions.some(d => d.requiresApproval) || simulation.outcome === 'APPROVAL_REQUIRED';
  const status: AgentRunStatus = admission.status === 'BLOCKED' ? 'BLOCKED' : requiresApproval ? 'APPROVAL_REQUIRED' : 'READY';
  const now = new Date().toISOString();
  return persist(seal({ runId: `agent-run-${crypto.randomUUID()}`, projectId, agentId, goal, status, plan, simulation, admission, decisions, createdAt: now, updatedAt: now }));
}

export async function loadAgentRun(runId: string) { return (await loadDurableRecord<AgentRun>('agent-run', clean(runId)))?.payload ?? null; }

async function transition(run: AgentRun, next: AgentRunStatus) {
  if (!allowedTransitions[run.status].includes(next)) throw new Error(`INVALID_AGENT_RUN_TRANSITION:${run.status}->${next}`);
  run.status = next; run.updatedAt = new Date().toISOString(); run.auditHash = hash({ ...run, auditHash: undefined });
  return persist(run);
}

export async function approveAgentRun(runId: string, approvedBy: string) {
  const run = await loadAgentRun(runId); if (!run) throw new Error('AGENT_RUN_NOT_FOUND');
  const actor = clean(approvedBy);
  if (!actor) throw new Error('INVALID_APPROVER');
  // Idempotent: already APPROVED with matching approver → return as-is
  if (run.status === 'APPROVED' && run.approval?.approvedBy === actor) {
    return run;
  }
  // Fail-closed on conflicting terminal or mismatched approval
  if (run.status === 'APPROVED' || run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELLED') {
    throw new Error(`AGENT_RUN_TERMINAL:${run.status}`);
  }
  const policy = await loadAgentPolicy(run.projectId);
  if (policy?.deniedAgents.includes(actor)) throw new Error('APPROVER_DENIED');
  const approvalHash = hash({ runId: run.runId, approvedBy: actor, planHash: run.plan.auditHash, policyHash: policy?.auditHash ?? null });
  run.approval = { approvedAt: new Date().toISOString(), approvedBy: actor, approvalHash };
  return transition(run, 'APPROVED');
}

export async function cancelAgentRun(runId: string) {
  const run = await loadAgentRun(runId); if (!run) throw new Error('AGENT_RUN_NOT_FOUND');
  return transition(run, 'CANCELLED');
}

export async function completeAgentRun(runId: string, success = true) {
  const run = await loadAgentRun(runId); if (!run) throw new Error('AGENT_RUN_NOT_FOUND');
  const target: AgentRunStatus = success ? 'COMPLETED' : 'FAILED';
  // Idempotent: already in the desired terminal state → return as-is
  if (run.status === target) return run;
  // Fail-closed: refuse to flip one terminal into another
  if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELLED') {
    throw new Error(`AGENT_RUN_TERMINAL:${run.status}`);
  }
  return transition(run, target);
}
