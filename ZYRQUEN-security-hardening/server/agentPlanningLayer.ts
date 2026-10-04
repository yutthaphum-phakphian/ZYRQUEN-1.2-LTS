import crypto from 'node:crypto';
import { resolveCapabilities, type CapabilityRisk } from './agentCapabilityRegistry.ts';

export type PlanStepKind = 'INSPECT' | 'VERIFY' | 'PREVIEW' | 'APPROVAL' | 'MUTATE' | 'RECOVER' | 'REVERIFY';
export type PlanStatus = 'READY' | 'BLOCKED';
export interface AgentPlanStep {
  stepId: string;
  kind: PlanStepKind;
  capability: string;
  dependsOn: string[];
  requiresApproval: boolean;
  requiresLeader: boolean;
  requiresWorkerFence: boolean;
  risk: CapabilityRisk;
}
export interface AgentExecutionPlan {
  planId: string;
  projectId: string;
  goal: string;
  status: PlanStatus;
  steps: AgentPlanStep[];
  deniedCapabilities: Array<{ id: string; reason: string }>;
  rollbackRequired: boolean;
  maxAttempts: number;
  auditHash: string;
  createdAt: string;
}

const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export function createAgentExecutionPlan(input: { projectId: string; goal: string; capabilities?: string[]; maxRisk?: CapabilityRisk; maxAttempts?: number }): AgentExecutionPlan {
  const projectId = clean(input.projectId, 160);
  const goal = clean(input.goal, 2000);
  if (!projectId) throw new Error('INVALID_PLAN_PROJECT');
  if (!goal) throw new Error('INVALID_PLAN_GOAL');
  const requested = input.capabilities?.length ? input.capabilities : ['workspace.inspect', 'developer.verify', 'repair.preview', 'repair.apply', 'repair.recover', 'reliability.run'];
  const resolution = resolveCapabilities(requested, input.maxRisk ?? 'HIGH');
  const steps: AgentPlanStep[] = [];
  const add = (kind: PlanStepKind, capability: string, dependsOn: string[] = []) => {
    const c = resolution.allowed.find(x => x.id === capability);
    if (!c) return;
    steps.push({ stepId: `step-${steps.length + 1}`, kind, capability, dependsOn, requiresApproval: c.requiresApproval, requiresLeader: c.requiresLeader, requiresWorkerFence: c.requiresWorkerFence, risk: c.risk });
  };
  add('INSPECT', 'workspace.inspect');
  const inspect = steps.at(-1)?.stepId;
  add('VERIFY', 'developer.verify', inspect ? [inspect] : []);
  const verify = steps.at(-1)?.stepId;
  add('PREVIEW', 'repair.preview', verify ? [verify] : []);
  const preview = steps.at(-1)?.stepId;
  add('APPROVAL', 'repair.apply', preview ? [preview] : []);
  const approval = steps.at(-1)?.stepId;
  add('MUTATE', 'repair.apply', approval ? [approval] : []);
  const mutate = steps.at(-1)?.stepId;
  add('RECOVER', 'repair.recover', mutate ? [mutate] : []);
  const recover = steps.at(-1)?.stepId;
  add('REVERIFY', 'developer.verify', recover ? [recover] : []);
  const createdAt = new Date().toISOString();
  const base = {
    planId: `agent-plan-${crypto.randomUUID()}`,
    projectId, goal,
    status: resolution.denied.length ? 'BLOCKED' as const : 'READY' as const,
    steps,
    deniedCapabilities: resolution.denied,
    rollbackRequired: steps.some(s => s.kind === 'MUTATE'),
    maxAttempts: Math.min(Math.max(Number(input.maxAttempts ?? 3), 1), 5),
    createdAt,
  };
  return { ...base, auditHash: hash(base) };
}
