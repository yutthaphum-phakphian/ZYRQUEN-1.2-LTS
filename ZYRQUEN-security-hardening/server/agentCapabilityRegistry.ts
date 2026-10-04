import crypto from 'node:crypto';

export type CapabilityRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CapabilityMode = 'READ' | 'MUTATE' | 'EXECUTE' | 'RECOVER' | 'ORCHESTRATE';

export interface AgentCapability {
  id: string;
  version: string;
  description: string;
  modes: CapabilityMode[];
  risk: CapabilityRisk;
  requiresApproval: boolean;
  requiresLeader: boolean;
  requiresWorkerFence: boolean;
}

export interface CapabilitySnapshot {
  registryVersion: number;
  capabilities: AgentCapability[];
  auditHash: string;
  generatedAt: string;
}

const hash = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const order: CapabilityRisk[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const builtIns: AgentCapability[] = [
  { id: 'workspace.read', version: '1', description: 'Read bounded workspace files', modes: ['READ'], risk: 'LOW', requiresApproval: false, requiresLeader: false, requiresWorkerFence: false },
  { id: 'workspace.inspect', version: '1', description: 'Inspect workspace and verification evidence', modes: ['READ'], risk: 'LOW', requiresApproval: false, requiresLeader: false, requiresWorkerFence: false },
  { id: 'developer.verify', version: '1', description: 'Run bounded developer verification', modes: ['EXECUTE'], risk: 'MEDIUM', requiresApproval: true, requiresLeader: true, requiresWorkerFence: true },
  { id: 'repair.preview', version: '1', description: 'Create deterministic patch previews', modes: ['READ'], risk: 'MEDIUM', requiresApproval: false, requiresLeader: false, requiresWorkerFence: false },
  { id: 'repair.apply', version: '1', description: 'Apply an approved repair patch transactionally', modes: ['MUTATE'], risk: 'HIGH', requiresApproval: true, requiresLeader: true, requiresWorkerFence: true },
  { id: 'repair.recover', version: '1', description: 'Recover a crash-consistent repair', modes: ['RECOVER'], risk: 'HIGH', requiresApproval: false, requiresLeader: true, requiresWorkerFence: true },
  { id: 'reliability.run', version: '1', description: 'Run the bounded reliability control loop', modes: ['ORCHESTRATE', 'RECOVER'], risk: 'HIGH', requiresApproval: false, requiresLeader: true, requiresWorkerFence: true },
  { id: 'recovery.governance', version: '1', description: 'Evaluate recovery admission and quarantine state', modes: ['READ', 'ORCHESTRATE'], risk: 'HIGH', requiresApproval: false, requiresLeader: true, requiresWorkerFence: false },
];

export function listAgentCapabilities(): CapabilitySnapshot {
  const capabilities = builtIns.map(c => ({ ...c, modes: [...c.modes] }));
  const base = { registryVersion: 1, capabilities, generatedAt: new Date().toISOString() };
  return { ...base, auditHash: hash(base) };
}

export function resolveCapabilities(ids: string[], maxRisk: CapabilityRisk = 'HIGH'): { allowed: AgentCapability[]; denied: Array<{ id: string; reason: string }> } {
  const snapshot = listAgentCapabilities();
  const allowed: AgentCapability[] = [];
  const denied: Array<{ id: string; reason: string }> = [];
  const ceiling = order.indexOf(maxRisk);
  for (const id of ids) {
    const capability = snapshot.capabilities.find(c => c.id === id);
    if (!capability) { denied.push({ id, reason: 'UNKNOWN_CAPABILITY' }); continue; }
    if (order.indexOf(capability.risk) > ceiling) { denied.push({ id, reason: 'RISK_CEILING_EXCEEDED' }); continue; }
    allowed.push(capability);
  }
  return { allowed, denied };
}
