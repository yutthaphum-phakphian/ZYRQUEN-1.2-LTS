import crypto from 'node:crypto';
import { loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import { resolveCapabilities, type CapabilityRisk } from './agentCapabilityRegistry.ts';

export interface AgentPolicy {
  projectId: string;
  version: number;
  defaultMaxRisk: CapabilityRisk;
  grants: Record<string, { capabilities: string[]; maxRisk?: CapabilityRisk }>;
  deniedAgents: string[];
  requireApprovalForMutation: boolean;
  requireLeaderForHighRisk: boolean;
  updatedAt: string;
  auditHash: string;
}

export interface PolicyDecision {
  allowed: boolean;
  agentId: string;
  capability: string;
  reason: string;
  risk?: CapabilityRisk;
  requiresApproval?: boolean;
  requiresLeader?: boolean;
  auditHash: string;
}

const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const riskOrder: CapabilityRisk[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const clean = (v: unknown) => String(v ?? '').trim().slice(0, 128);

function makePolicy(input: Omit<AgentPolicy, 'auditHash'>): AgentPolicy {
  return { ...input, auditHash: hash(input) };
}

export async function saveAgentPolicy(input: {
  projectId: string;
  defaultMaxRisk?: CapabilityRisk;
  grants?: Record<string, { capabilities: string[]; maxRisk?: CapabilityRisk }>;
  deniedAgents?: string[];
  requireApprovalForMutation?: boolean;
  requireLeaderForHighRisk?: boolean;
}): Promise<AgentPolicy> {
  const projectId = clean(input.projectId);
  if (!projectId) throw new Error('INVALID_PROJECT_ID');
  const current = await loadDurableRecord<AgentPolicy>('agent-policy', projectId);
  const policy = makePolicy({
    projectId,
    version: (current?.payload.version ?? 0) + 1,
    defaultMaxRisk: input.defaultMaxRisk ?? current?.payload.defaultMaxRisk ?? 'HIGH',
    grants: input.grants ?? current?.payload.grants ?? {},
    deniedAgents: [...new Set((input.deniedAgents ?? current?.payload.deniedAgents ?? []).map(clean).filter(Boolean))],
    requireApprovalForMutation: input.requireApprovalForMutation ?? current?.payload.requireApprovalForMutation ?? true,
    requireLeaderForHighRisk: input.requireLeaderForHighRisk ?? current?.payload.requireLeaderForHighRisk ?? true,
    updatedAt: new Date().toISOString(),
  });
  return (await saveDurableRecord('agent-policy', projectId, policy, current?.version ?? 0)).payload;
}

export async function loadAgentPolicy(projectId: string): Promise<AgentPolicy | null> {
  return (await loadDurableRecord<AgentPolicy>('agent-policy', clean(projectId)))?.payload ?? null;
}

export function decideAgentCapability(policy: AgentPolicy | null, agentId: string, capability: string): PolicyDecision {
  const agent = clean(agentId), cap = clean(capability);
  const base = { agentId: agent, capability: cap };
  if (!agent || !cap) return { ...base, allowed: false, reason: 'INVALID_AGENT_OR_CAPABILITY', auditHash: hash(base) };
  if (!policy) return { ...base, allowed: true, reason: 'NO_PROJECT_POLICY', auditHash: hash({ ...base, reason: 'NO_PROJECT_POLICY' }) };
  if (policy.deniedAgents.includes(agent)) return { ...base, allowed: false, reason: 'AGENT_DENIED', auditHash: hash({ ...base, reason: 'AGENT_DENIED' }) };
  const grant = policy.grants[agent];
  if (!grant || !grant.capabilities.includes(cap)) return { ...base, allowed: false, reason: 'CAPABILITY_NOT_GRANTED', auditHash: hash({ ...base, reason: 'CAPABILITY_NOT_GRANTED' }) };
  const maxRisk = grant.maxRisk ?? policy.defaultMaxRisk;
  const resolved = resolveCapabilities([cap], maxRisk);
  if (resolved.denied.length) return { ...base, allowed: false, reason: resolved.denied[0].reason, auditHash: hash({ ...base, reason: resolved.denied[0].reason }) };
  const capabilityDef = resolved.allowed[0];
  if (!capabilityDef) return { ...base, allowed: false, reason: 'UNKNOWN_CAPABILITY', auditHash: hash({ ...base, reason: 'UNKNOWN_CAPABILITY' }) };
  const risk = capabilityDef.risk;
  const requiresApproval = policy.requireApprovalForMutation && capabilityDef.modes.includes('MUTATE');
  const requiresLeader = policy.requireLeaderForHighRisk && riskOrder.indexOf(risk) >= riskOrder.indexOf('HIGH');
  const result = { ...base, allowed: true, reason: 'ALLOWED', risk, requiresApproval, requiresLeader };
  return { ...result, auditHash: hash(result) };
}
