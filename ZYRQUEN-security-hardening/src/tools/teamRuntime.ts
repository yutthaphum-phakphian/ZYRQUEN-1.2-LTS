import {
  AgentEvidence,
  AgentMessage,
  AgentResult,
  ArchitectureDecision,
  CapabilityReality,
  ChangeSet,
  CodeFile,
  FileOwnership,
  ProjectContext,
  ProjectRule,
  ReviewRiskLevel,
  TeamAgentRole,
  TeamAgentStatus,
  TeamAgentState,
  TeamRealityReport,
  TeamRunRecord,
  TeamRunStatus,
  TeamTaskNode,
  TeamTaskState,
} from '../types';
import { runResponsiveProbe } from './runtimeProbe';
import { byteSize } from '../utils/documentAssembler';
import { runDependencyAudit, runPerformanceAudit, runSecurityAudit } from './releaseEngine';
import { toolOrchestrator } from './toolOrchestrator';

const ROLE_LABELS: Record<TeamAgentRole, string> = {
  LEAD: 'Lead / Orchestrator',
  CODER: 'Coder',
  UI_UX: 'UI / UX',
  QA_BROWSER: 'QA / Browser',
  SECURITY: 'Security',
  PERFORMANCE: 'Performance',
  REVIEWER: 'Reviewer',
  RELEASE: 'Release',
};

const now = () => new Date().toISOString();

function ev(label: string, value: string, source: string, measured = true): AgentEvidence {
  return { id: `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label, value, source, measured, timestamp: now() };
}

function result(
  agentId: string,
  role: TeamAgentRole,
  status: AgentResult['status'],
  summary: string,
  filesRead: string[],
  evidence: AgentEvidence[],
  findings: string[] = [],
  blockers: string[] = [],
  toolCalls: string[] = []
): AgentResult {
  return {
    agentId, role, status, summary, changes: [], filesRead, filesCreated: [], filesModified: [], findings, evidence,
    tests: [], blockers, recommendations: [], nextActions: [], toolCalls, retries: 0, durationMs: 0,
  };
}

export function selectTeam(objective: string, context: ProjectContext): TeamAgentRole[] {
  const text = objective.toLowerCase();
  const production = /production|release|เตรียม|ขึ้นระบบ|ตรวจทุกอย่าง/.test(text);
  const qa = /qa|ทดสอบ|ตรวจ|พัง|bug|responsive|เว็บมือถือ|flow/.test(text);
  const security = /security|secret|ความปลอดภัย|credential|api key|production|release/.test(text);
  const performance = /performance|เร็ว|ช้า|ขนาด|bundle|production|release/.test(text);
  const ui = /ui|ux|หน้า|ปุ่ม|สี|responsive|mobile|login|เว็บ/.test(text);
  const roles: TeamAgentRole[] = ['LEAD'];
  if (!production && !qa && !ui) roles.push('CODER');
  if (ui) roles.push('UI_UX');
  if (qa || production) roles.push('QA_BROWSER');
  if (security) roles.push('SECURITY');
  if (performance) roles.push('PERFORMANCE');
  if (!roles.includes('CODER') && !production) roles.push('CODER');
  roles.push('REVIEWER');
  if (production) roles.push('RELEASE');
  return [...new Set(roles)];
}

function buildGraph(objective: string, context: ProjectContext): TeamTaskNode[] {
  const roles = selectTeam(objective, context).filter((r) => r !== 'LEAD');
  const graph: TeamTaskNode[] = [];
  roles.forEach((role) => {
    const id = `team-task-${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const isWrite = role === 'CODER' || role === 'UI_UX';
    const deps = isWrite ? [] : (['CODER', 'UI_UX'] as const).filter((r) => roles.some((candidate) => candidate === r)).map((r) => `role:${r}`);
    graph.push({ id, title: `${ROLE_LABELS[role]} task`, role, dependencies: deps, status: deps.length ? 'PENDING' : 'READY', riskLevel: role === 'SECURITY' || role === 'RELEASE' ? 'HIGH' : isWrite ? 'MEDIUM' : 'LOW', files: context.files.map((f) => f.name) });
  });
  return graph;
}

export function createTeamState(objective: string, context: ProjectContext): TeamTaskState {
  const roles = selectTeam(objective, context);
  const taskGraph = buildGraph(objective, context);
  const agents: TeamAgentState[] = roles.map((role) => ({
    id: `agent-${role.toLowerCase()}`,
    role,
    label: ROLE_LABELS[role],
    status: role === 'LEAD' ? 'WORKING' : taskGraph.some((t) => t.role === role && t.status === 'READY') ? 'WAITING' : 'IDLE',
    progress: role === 'LEAD' ? 10 : 0,
    filesTouched: [], findings: [], evidence: [], errors: [], retries: 0,
  }));
  const contextBytes = context.files.reduce((sum, f) => sum + byteSize(f.content), 0);
  return {
    id: `team-${Date.now()}`,
    objective,
    status: 'TEAM_PLANNING',
    activeAgents: agents,
    completedAgents: [],
    blockedAgents: [],
    waitingAgents: agents.filter((a) => a.status === 'WAITING').map((a) => a.id),
    taskGraph,
    dependencies: Object.fromEntries(taskGraph.map((t) => [t.id, t.dependencies])),
    sharedContext: {
      projectName: context.projectName || context.name || 'Project',
      framework: context.framework,
      rules: context.rules || [],
      decisions: context.decisions || [],
      knownIssues: context.knownIssues || [],
      knowledgeCount: (context.knowledgeBase || []).length,
      activeRoadmap: (context.tasks || []).map((t) => `[${t.status}] ${t.title}`),
      contextBytes,
    },
    changeSets: [], evidence: [], findings: [], decisions: [], approvals: [], messages: [], errors: [], retries: 0,
    startedAt: now(), updatedAt: now(),
  };
}

export class TeamRuntime {
  private ownership: FileOwnership[] = [];
  private cancelled = false;

  cancel(state: TeamTaskState): TeamTaskState {
    this.cancelled = true;
    return this.updateAll(state, (a) => ({ ...a, status: a.status === 'SUCCESS' ? a.status : 'CANCELLED', currentAction: 'Cancelled by user' }));
  }

  resume(state: TeamTaskState): TeamTaskState {
    this.cancelled = false;
    return { ...state, status: 'TEAM_EXECUTING', updatedAt: now(), activeAgents: state.activeAgents.map((a) => a.status === 'CANCELLED' || a.status === 'FAILED' ? { ...a, status: 'WAITING', errors: [] } : a) };
  }

  requestFileLock(path: string, agentId: string, taskId: string): { granted: boolean; conflict?: FileOwnership } {
    const conflict = this.ownership.find((o) => o.path === path && o.locked && o.agentId !== agentId);
    if (conflict) return { granted: false, conflict };
    if (!this.ownership.some((o) => o.path === path && o.agentId === agentId && o.locked)) this.ownership.push({ path, agentId, taskId, locked: true, lockedAt: now() });
    return { granted: true };
  }

  releaseFileLocks(agentId: string) { this.ownership = this.ownership.map((o) => o.agentId === agentId ? { ...o, locked: false, releasedAt: now() } : o); }

  detectConflicts(paths: string[], agentId: string): FileOwnership[] { return this.ownership.filter((o) => o.locked && o.agentId !== agentId && paths.includes(o.path)); }

  private updateAll(state: TeamTaskState, updater: (agent: TeamAgentState) => TeamAgentState): TeamTaskState {
    return { ...state, activeAgents: state.activeAgents.map(updater), updatedAt: now() };
  }

  private message(state: TeamTaskState, from: string, to: string, type: AgentMessage['type'], taskId: string, payload: Record<string, any>, priority: AgentMessage['priority'] = 'NORMAL'): TeamTaskState {
    return { ...state, messages: [...state.messages, { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, from, to, type, taskId, payload, priority, timestamp: now() }], updatedAt: now() };
  }

  private finishAgent(state: TeamTaskState, agentId: string, taskId: string, agentResult: AgentResult): TeamTaskState {
    const status: TeamAgentStatus = agentResult.status === 'SUCCESS' ? 'SUCCESS' : agentResult.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : agentResult.status === 'BLOCKED' ? 'BLOCKED' : agentResult.status === 'CANCELLED' ? 'CANCELLED' : agentResult.status === 'FAILED' ? 'FAILED' : 'PARTIAL';
    let next = {
      ...state,
      activeAgents: state.activeAgents.map((a) => a.id === agentId ? { ...a, status, progress: 100, currentTaskId: taskId, currentAction: agentResult.summary, filesTouched: agentResult.filesModified, findings: agentResult.findings, evidence: agentResult.evidence, result: agentResult, finishedAt: now() } : a),
      completedAgents: status === 'SUCCESS' || status === 'PARTIAL' ? [...state.completedAgents, agentId] : state.completedAgents,
      blockedAgents: status === 'BLOCKED' ? [...state.blockedAgents, agentId] : state.blockedAgents,
      evidence: [...state.evidence, ...agentResult.evidence],
      findings: [...state.findings, ...agentResult.findings],
      errors: [...state.errors, ...agentResult.blockers],
      updatedAt: now(),
    };
    next = this.message(next, agentId, 'agent-lead', agentResult.status === 'SUCCESS' ? 'TASK_COMPLETE' : agentResult.status === 'BLOCKED' ? 'TASK_BLOCKED' : 'EVIDENCE', taskId, { summary: agentResult.summary, evidence: agentResult.evidence, blockers: agentResult.blockers }, agentResult.status === 'BLOCKED' ? 'HIGH' : 'NORMAL');
    return next;
  }

  private findTask(state: TeamTaskState, role: TeamAgentRole) { return state.taskGraph.find((t) => t.role === role); }

  private inspectCoder(state: TeamTaskState, context: ProjectContext, role: TeamAgentRole): AgentResult {
    const files = context.files.map((f) => f.name);
    return result('agent-coder', role, 'PARTIAL', 'Coder is ready, but no file mutation was requested by this team run; existing AI coding route remains the source of code changes.', files, [ev('Mutation', 'NOT_EXECUTED', 'team-runtime', false), ev('Files available', `${files.length}`, 'project-context')], ['No code mutation requested; handoff to existing Agent Runtime for implementation'], [], ['readFile', 'listFiles']);
  }

  private inspectUI(state: TeamTaskState, context: ProjectContext): AgentResult {
    const html = context.files.filter((f) => f.name.endsWith('.html')).map((f) => f.name);
    return result('agent-ui-ux', 'UI_UX', 'PARTIAL', 'UI/UX inspection completed; no mutation was applied without an approved ChangeSet.', context.files.map((f) => f.name), [ev('HTML entry files', `${html.length}`, 'project-context'), ev('Responsive rule', context.files.some((f) => /viewport|@media|sm:|md:/.test(f.content)) ? 'detected' : 'not detected', 'source-inspection')], [], [], ['readFile', 'runVisualQA']);
  }

  private async inspectQA(context: ProjectContext): Promise<AgentResult> {
    const probes = await runResponsiveProbe(context);
    const loaded = probes.filter((p) => p.loaded);
    const errors = loaded.flatMap((p) => [...p.consoleErrors, ...p.runtimeExceptions]);
    return result('agent-qa-browser', 'QA_BROWSER', loaded.length === 0 ? 'BLOCKED' : errors.length ? 'NEEDS_REVIEW' : 'SUCCESS', loaded.length === 0 ? 'Browser probe unavailable' : `Browser QA ran on ${loaded.length}/${probes.length} viewports`, context.files.map((f) => f.name), [ev('Viewports loaded', `${loaded.length}/${probes.length}`, 'runtime-probe'), ev('Console/runtime errors', `${errors.length}`, 'runtime-probe'), ev('Overflow viewports', `${loaded.filter((p) => p.overflow.hasHorizontalOverflow).length}`, 'runtime-probe')], errors, loaded.length === 0 ? ['Browser runtime probe unavailable'] : [], ['runResponsiveProbe', 'browserControl']);
  }

  private inspectSecurity(context: ProjectContext): AgentResult {
    const audit = runSecurityAudit(context.files);
    const findings = audit.findings.map((f) => `[${f.severity}] ${f.file || ''}: ${f.maskedSample}`);
    return result('agent-security', 'SECURITY', audit.releaseBlocked ? 'BLOCKED' : audit.passed ? 'SUCCESS' : 'NEEDS_REVIEW', audit.releaseBlocked ? 'Critical security finding blocks team' : `Security audit scanned ${audit.scannedFiles} files`, context.files.map((f) => f.name), [ev('Critical findings', `${audit.criticalCount}`, 'security-audit'), ev('High findings', `${audit.highCount}`, 'security-audit'), ev('Scanned bytes', `${audit.scannedBytes}`, 'security-audit')], findings, audit.releaseBlocked ? ['Critical secret/config finding requires remediation'] : [], ['securityAudit']);
  }

  private inspectPerformance(context: ProjectContext): AgentResult {
    const audit = runPerformanceAudit(context);
    return result('agent-performance', 'PERFORMANCE', 'SUCCESS', `Performance audit measured ${audit.totalBytes} source bytes`, context.files.map((f) => f.name), [ev('Source bytes', `${audit.totalBytes}`, 'performance-audit'), ev('Largest files', `${audit.largestFiles.map((f) => `${f.name}:${f.bytes}`).join(', ') || 'none'}`, 'performance-audit'), ev('Unavailable metrics', audit.unavailable.join(', ') || 'none', 'performance-audit', false)], audit.unavailable.map((u) => `${u}: UNAVAILABLE`), [], ['performanceAudit']);
  }

  private inspectReviewer(state: TeamTaskState, context: ProjectContext): AgentResult {
    const highRisk = state.changeSets.filter((c) => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL');
    const blockers = state.blockedAgents.length ? [`Blocked agents: ${state.blockedAgents.join(', ')}`] : [];
    return result('agent-reviewer', 'REVIEWER', blockers.length ? 'NEEDS_REVIEW' : highRisk.length ? 'NEEDS_REVIEW' : 'SUCCESS', blockers.length ? 'Reviewer found blocked dependencies' : highRisk.length ? 'Reviewer approval required for high-risk changes' : 'Reviewer checked team evidence and found no blocking change review', context.files.map((f) => f.name), [ev('Agents completed', `${state.completedAgents.length}`, 'team-state'), ev('High-risk changes', `${highRisk.length}`, 'change-set-review'), ev('Evidence records', `${state.evidence.length}`, 'team-state')], blockers, highRisk.length ? ['Reviewer approval required before applying high-risk ChangeSets'] : [], ['inspectDiff', 'getProjectRules']);
  }

  /** Execute read-only specialists safely; no agent silently writes files. */
  async execute(state: TeamTaskState, context: ProjectContext): Promise<TeamRunRecord> {
    let current = { ...state, status: 'TEAM_EXECUTING' as TeamRunStatus, updatedAt: now() };
    const executeOne = async (role: TeamAgentRole, fn: () => AgentResult | Promise<AgentResult>) => {
      if (this.cancelled) return;
      const task = this.findTask(current, role);
      const agent = current.activeAgents.find((a) => a.role === role);
      if (!task || !agent) return;
      current = this.message(current, 'agent-lead', agent.id, 'TASK_ASSIGN', task.id, { role, objective: task.title });
      current = { ...current, activeAgents: current.activeAgents.map((a) => a.id === agent.id ? { ...a, status: 'WORKING', currentTaskId: task.id, currentTask: task.title, currentAction: 'Executing structured task' } : a), taskGraph: current.taskGraph.map((t) => t.id === task.id ? { ...t, status: 'RUNNING', assignedAt: now() } : t) };
      const output = await fn();
      current = this.finishAgent(current, agent.id, task.id, output);
      current = { ...current, taskGraph: current.taskGraph.map((t) => t.id === task.id ? { ...t, status: output.status === 'SUCCESS' ? 'SUCCESS' : output.status === 'BLOCKED' ? 'BLOCKED' : 'PARTIAL', result: output, completedAt: now() } : t) };
    };

    const roles = selectTeam(context.currentGoal || context.currentTask || current.objective, context);
    const writeRoles = roles.filter((r) => r === 'CODER' || r === 'UI_UX');
    for (const role of writeRoles) {
      if (this.cancelled) break;
      await executeOne(role, () => role === 'CODER' ? this.inspectCoder(current, context, role) : this.inspectUI(current, context));
    }
    if (!this.cancelled) {
      await Promise.all([
        roles.includes('QA_BROWSER') ? executeOne('QA_BROWSER', () => this.inspectQA(context)) : Promise.resolve(),
        roles.includes('SECURITY') ? executeOne('SECURITY', () => this.inspectSecurity(context)) : Promise.resolve(),
        roles.includes('PERFORMANCE') ? executeOne('PERFORMANCE', () => this.inspectPerformance(context)) : Promise.resolve(),
      ]);
    }
    if (roles.includes('REVIEWER') && !this.cancelled) await executeOne('REVIEWER', () => this.inspectReviewer(current, context));

    const hasFailure = current.activeAgents.some((a) => a.status === 'FAILED' || a.status === 'BLOCKED');
    current = { ...current, status: this.cancelled ? 'TEAM_CANCELLED' : hasFailure ? 'TEAM_FAILED' : current.activeAgents.some((a) => a.status === 'NEEDS_REVIEW') ? 'TEAM_WAITING_REVIEW' : 'TEAM_COMPLETED', completedAt: now(), updatedAt: now(), activeAgents: current.activeAgents.map((a) => a.role === 'LEAD' ? { ...a, status: this.cancelled ? 'CANCELLED' : hasFailure ? 'FAILED' : 'SUCCESS', progress: 100, currentAction: 'Collected evidence and finalized team decision', finishedAt: now() } : a) };
    const reality: TeamRealityReport = {
      generatedAt: now(),
      assessments: [
        { capability: 'Multi-Agent Orchestration', reality: 'REAL', evidence: `Lead created ${current.activeAgents.length} structured agents and task graph` },
        { capability: 'Agent Execution', reality: current.evidence.length ? 'REAL' : 'PARTIAL', evidence: `${current.evidence.length} evidence records from executed agents` },
        { capability: 'File Coordination', reality: 'REAL', evidence: 'File ownership/lock conflict detector is active; mutation was not silently applied' },
        { capability: 'Browser QA', reality: current.activeAgents.find((a) => a.role === 'QA_BROWSER')?.result?.status === 'SUCCESS' ? 'REAL' : 'PARTIAL', evidence: 'Reuses V10 runtime probe' },
        { capability: 'Security', reality: current.activeAgents.find((a) => a.role === 'SECURITY') ? 'REAL' : 'UNAVAILABLE', evidence: 'Reuses V10 security audit' },
        { capability: 'Performance', reality: current.activeAgents.find((a) => a.role === 'PERFORMANCE') ? 'REAL' : 'UNAVAILABLE', evidence: 'Reuses V10 performance audit' },
        { capability: 'Review', reality: current.activeAgents.find((a) => a.role === 'REVIEWER') ? 'REAL' : 'UNAVAILABLE', evidence: 'Reviewer evaluated shared evidence' },
        { capability: 'Release', reality: roles.includes('RELEASE') ? 'PARTIAL' : 'UNAVAILABLE', evidence: 'V10 Release Agent remains the release authority' },
        { capability: 'Rollback', reality: 'REAL', evidence: 'Reuses V10 snapshot/rollback' },
        { capability: 'Voice Control', reality: 'PARTIAL', evidence: 'V11 structured commands route through existing Voice Command Router' },
      ],
    };
    return { state: current, reality };
  }
}

export const teamRuntime = new TeamRuntime();
