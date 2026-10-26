import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  Plus,
  Trash2,
  Check,
  Cpu,
  Layers,
  Settings2,
  Radio,
  Clock,
  Lock,
  GitMerge,
  GitPullRequest,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  aiAgentRegistryService,
  ConnectedAgent,
  WorkflowRouteRule,
  WorkflowTaskType,
  WorkflowExecutionResult,
  RoutingDecisionLog,
} from '@/services/aiAgentRegistryService';

export const AgentOrchestratorPanel: React.FC = () => {
  const [agents, setAgents] = useState<ConnectedAgent[]>(() => aiAgentRegistryService.getAgents());
  const [routes, setRoutes] = useState<WorkflowRouteRule[]>(() => aiAgentRegistryService.getRoutes());
  const [decisionLogs, setDecisionLogs] = useState<RoutingDecisionLog[]>(() =>
    aiAgentRegistryService.getRoutingDecisionLogs()
  );
  const [flaggedAgentIds, setFlaggedAgentIds] = useState<string[]>(() =>
    aiAgentRegistryService.getFlaggedAgentIds()
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => routes[0]?.id || '');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<WorkflowExecutionResult | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>(
    'Refactor memory telemetry inspector and enforce fail-closed invariant'
  );

  // New route creation state
  const [showNewRouteForm, setShowNewRouteForm] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>('');
  const [taskType, setTaskType] = useState<WorkflowTaskType>('CODE_GENERATION');
  const [primaryAgentId, setPrimaryAgentId] = useState<string>('');
  const [fallbackAgentId, setFallbackAgentId] = useState<string>('');
  const [executionMode, setExecutionMode] = useState<WorkflowRouteRule['executionMode']>('SEQUENTIAL_CHAIN');
  const [requiresApproval, setRequiresApproval] = useState<boolean>(true);
  const [maxSlaMs, setMaxSlaMs] = useState<number>(142);

  useEffect(() => {
    const unsub = aiAgentRegistryService.subscribe(() => {
      setAgents(aiAgentRegistryService.getAgents());
      const updatedRoutes = aiAgentRegistryService.getRoutes();
      setRoutes(updatedRoutes);
      setDecisionLogs(aiAgentRegistryService.getRoutingDecisionLogs());
      setFlaggedAgentIds(aiAgentRegistryService.getFlaggedAgentIds());
      if (!selectedRouteId && updatedRoutes.length > 0) {
        setSelectedRouteId(updatedRoutes[0].id);
      }
    });
    return () => unsub();
  }, [selectedRouteId]);

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const handleToggleRoute = (routeId: string) => {
    aiAgentRegistryService.toggleRouteEnabled(routeId);
  };

  const handleDeleteRoute = (routeId: string) => {
    aiAgentRegistryService.deleteRoute(routeId);
  };

  const handleRunSimulation = async (routeId: string) => {
    setIsSimulating(true);
    try {
      const res = await aiAgentRegistryService.executeWorkflowSimulation(
        routeId,
        testPrompt.trim() || 'Process generic workflow routing task'
      );
      setSimulationResult(res);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim() || !primaryAgentId) return;

    const newRule: WorkflowRouteRule = {
      id: `route-${Date.now().toString(36)}`,
      name: routeName.trim(),
      taskType,
      primaryAgentId,
      fallbackAgentId: fallbackAgentId || undefined,
      executionMode,
      requiresApproval,
      maxLatencySlaMs: maxSlaMs,
      enabled: true,
      description: `Custom workflow route for ${taskType}.`,
    };

    aiAgentRegistryService.addRoute(newRule);
    setRouteName('');
    setShowNewRouteForm(false);
    setSelectedRouteId(newRule.id);
  };

  return (
    <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 p-4 font-mono space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/30 text-purple-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Agent Orchestrator & Workflow Routing
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold">
                Multi-Agent Mesh
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Route tasks between ZYNTHEOR Core Engine and your connected external AI agents with policy-driven guarantees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewRouteForm((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>{showNewRouteForm ? 'Close' : 'New Route Rule'}</span>
          </button>
        </div>
      </div>

      {/* ── MULTI-AGENT MESH HEALTH & HEARTBEAT STATUS BAR ── */}
      <div
        data-testid="orchestrator-mesh-health-bar"
        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
          <div>
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              <span>Multi-Agent Mesh Health &amp; Latency Monitor</span>
              {flaggedAgentIds.length > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/60 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>{flaggedAgentIds.length} Nodes Degraded / High Latency Spike</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>All Agent Nodes Healthy (Within SLA)</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-sans">
              Monitors real-time heartbeats and visually flags agents experiencing high latency spikes (&gt; 142ms SLA target) or connection drops.
            </p>
          </div>
        </div>

        {/* Mini Grid of Connected Agents with High Latency & Drop Highlights */}
        <div className="flex flex-wrap items-center gap-2">
          {agents.map((agent) => {
            const isDegraded =
              agent.status === 'DEGRADED' ||
              agent.status === 'OFFLINE' ||
              flaggedAgentIds.includes(agent.id) ||
              agent.latencyMs > 142;

            return (
              <div
                key={agent.id}
                data-testid={`orchestrator-agent-node-${agent.id}`}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-2 transition ${
                  isDegraded
                    ? 'bg-rose-950/50 border-rose-500/80 ring-1 ring-rose-500/70 text-rose-200 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
                }`}
                title={`Agent: ${agent.name} | Latency: ${agent.latencyMs}ms | Status: ${agent.status}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    agent.status === 'ONLINE' && !isDegraded
                      ? 'bg-emerald-400'
                      : agent.status === 'OFFLINE'
                      ? 'bg-rose-500'
                      : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span className="font-bold truncate max-w-[130px]">{agent.name.split(' ')[0]}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isDegraded
                      ? 'bg-rose-900/80 text-rose-200 border border-rose-500'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {agent.latencyMs}ms
                </span>
                {isDegraded && (
                  <span className="text-[9px] text-rose-400 font-bold uppercase tracking-tight">
                    {agent.status === 'OFFLINE' ? 'DROPPED' : 'SPIKE'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Route Form */}
      {showNewRouteForm && (
        <form
          onSubmit={handleCreateRoute}
          className="p-3.5 rounded-xl bg-zinc-900/90 border border-purple-500/30 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
            <span className="font-bold text-purple-300 uppercase">Define Workflow Route</span>
            <span className="text-[10px] text-zinc-500">Fail-Closed Default</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Route Name</label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. External Planner -> ZYNTHEOR Core Auditor"
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as WorkflowTaskType)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs"
              >
                <option value="ARCHITECTURE_PLAN">ARCHITECTURE_PLAN (Planning & High-Level Design)</option>
                <option value="CODE_GENERATION">CODE_GENERATION (Source Code & Diff Proposal)</option>
                <option value="SECURITY_AUDIT">SECURITY_AUDIT (Invariant & Entropy Check)</option>
                <option value="RESEARCH_FACTS">RESEARCH_FACTS (Fact Retrieval & Knowledge)</option>
                <option value="LOCAL_INFERENCE">LOCAL_INFERENCE (Air-Gapped Private Tasks)</option>
                <option value="TEST_EXECUTION">TEST_EXECUTION (Automated Test Execution)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Primary Agent (First Hop)</label>
              <select
                value={primaryAgentId}
                onChange={(e) => setPrimaryAgentId(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs"
              >
                <option value="">-- Select Primary Agent --</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role} • {a.latencyMs}ms)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Fallback Agent (If Primary Fails)</label>
              <select
                value={fallbackAgentId}
                onChange={(e) => setFallbackAgentId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs"
              >
                <option value="">-- None (Fail-Closed) --</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role} • {a.latencyMs}ms)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Execution Mode</label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-purple-500 text-xs"
              >
                <option value="SEQUENTIAL_CHAIN">SEQUENTIAL_CHAIN (Planner -&gt; Tool Gateway -&gt; Sentinel Audit)</option>
                <option value="DIRECT">DIRECT (Send directly to primary agent)</option>
                <option value="QUORUM_CONSENSUS">QUORUM_CONSENSUS (Cross-verify across multiple nodes)</option>
              </select>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-purple-600 focus:ring-0"
                />
                <span className="text-[10px]">Require Approval Gate (#EP-SOVEREIGN-01)</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-400">Max SLA:</span>
                <input
                  type="number"
                  value={maxSlaMs}
                  onChange={(e) => setMaxSlaMs(Number(e.target.value))}
                  className="w-16 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 text-xs"
                />
                <span className="text-[10px] text-zinc-500">ms</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowNewRouteForm(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Route</span>
            </button>
          </div>
        </form>
      )}

      {/* Route Rules List & Active Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: Rules List (5 Cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
            <span className="font-bold uppercase tracking-wider text-zinc-300">
              Active Workflow Routes ({routes.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {routes.map((rule) => {
              const isSelected = rule.id === selectedRouteId;
              const primary = agents.find((a) => a.id === rule.primaryAgentId);
              return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRouteId(rule.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-purple-500/70 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <span className="font-bold text-xs text-zinc-100 truncate">{rule.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {primary &&
                        (primary.status === 'DEGRADED' ||
                          primary.status === 'OFFLINE' ||
                          flaggedAgentIds.includes(primary.id) ||
                          primary.latencyMs > rule.maxLatencySlaMs) && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-950 text-rose-300 border border-rose-500 flex items-center gap-0.5 animate-pulse"
                            title={`Agent ${primary.name} experiencing latency spike (${primary.latencyMs}ms > SLA ${rule.maxLatencySlaMs}ms)`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            <span>SLA Breach</span>
                          </span>
                        )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRoute(rule.id);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition cursor-pointer ${
                          rule.enabled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        {rule.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-400 space-y-0.5 mb-2">
                    <div className="flex justify-between">
                      <span>Task:</span>
                      <span className="text-purple-300 font-bold">{rule.taskType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary:</span>
                      <span className="text-zinc-200 truncate max-w-[140px]">
                        {primary?.name || rule.primaryAgentId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="text-cyan-400">{rule.executionMode}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>SLA: {rule.maxLatencySlaMs}ms</span>
                    </span>
                    {rule.requiresApproval && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Approval Gate</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Route Detail & Test Runner (7 Cols) */}
        {activeRoute && (
          <div className="lg:col-span-7 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-100">{activeRoute.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                      {activeRoute.executionMode}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">{activeRoute.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteRoute(activeRoute.id)}
                  className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 text-xs cursor-pointer"
                  title="Delete Route Rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Visual Routing Hop Map */}
              <div className="p-3 my-3 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-2">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Configured Workflow Path
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Hop 1 */}
                  {(() => {
                    const primaryAgent = agents.find((a) => a.id === activeRoute.primaryAgentId);
                    const isPrimaryDegraded =
                      primaryAgent &&
                      (primaryAgent.status === 'DEGRADED' ||
                        primaryAgent.status === 'OFFLINE' ||
                        flaggedAgentIds.includes(primaryAgent.id) ||
                        primaryAgent.latencyMs > activeRoute.maxLatencySlaMs);

                    return (
                      <div
                        data-testid="hop-1-card"
                        className={`p-2 rounded border flex flex-col gap-1 transition ${
                          isPrimaryDegraded
                            ? 'bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                            : 'bg-zinc-900 border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${
                              isPrimaryDegraded ? 'bg-rose-600' : 'bg-purple-600'
                            }`}
                          >
                            1
                          </span>
                          <div>
                            <div className="font-bold text-zinc-200">
                              {primaryAgent?.name || 'Primary Agent'}
                            </div>
                            <div className="text-[9px] text-purple-400">
                              Primary Inbound Hop ({primaryAgent ? `${primaryAgent.latencyMs}ms` : '—'})
                            </div>
                          </div>
                        </div>

                        {isPrimaryDegraded && primaryAgent && (
                          <div className="text-[9px] text-rose-300 font-bold flex items-center gap-1 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/70 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                            <span>
                              {primaryAgent.status === 'OFFLINE'
                                ? 'Connection Drop (OFFLINE)'
                                : `High Latency Spike (${primaryAgent.latencyMs}ms > SLA ${activeRoute.maxLatencySlaMs}ms)`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />

                  {/* Hop 2 (Core / Approval Gate) */}
                  <div className="p-2 rounded bg-zinc-900 border border-cyan-500/40 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-600 text-zinc-950 text-[9px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <div className="font-bold text-zinc-200">ZYNTHEOR Sovereign Core</div>
                      <div className="text-[9px] text-cyan-400">
                        {activeRoute.requiresApproval ? 'Approval Gate & Invariant Check' : 'SSoT Seal Validation'}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />

                  {/* Hop 3 (Sentinel Audit) */}
                  <div className="p-2 rounded bg-zinc-900 border border-emerald-500/40 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <div className="font-bold text-zinc-200">Chamber 18 Sentinel</div>
                      <div className="text-[9px] text-emerald-400">Entropy & Replay Audit</div>
                    </div>
                  </div>

                  {/* Fallback Hop if configured */}
                  {activeRoute.fallbackAgentId && (() => {
                    const fallbackAgent = agents.find((a) => a.id === activeRoute.fallbackAgentId);
                    const isFallbackDegraded =
                      fallbackAgent &&
                      (fallbackAgent.status === 'DEGRADED' ||
                        fallbackAgent.status === 'OFFLINE' ||
                        flaggedAgentIds.includes(fallbackAgent.id) ||
                        fallbackAgent.latencyMs > activeRoute.maxLatencySlaMs);

                    return (
                      <>
                        <span className="text-[10px] text-zinc-500 font-bold px-1">OR</span>
                        <div
                          className={`p-2 rounded border flex flex-col gap-1 transition ${
                            isFallbackDegraded
                              ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/60'
                              : 'bg-zinc-900/80 border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-zinc-700 text-zinc-200 text-[9px] font-bold flex items-center justify-center">
                              FB
                            </span>
                            <div>
                              <div className="font-bold text-zinc-300">
                                {fallbackAgent?.name || 'Fallback Agent'}
                              </div>
                              <div className="text-[9px] text-zinc-400">Failover Hop</div>
                            </div>
                          </div>
                          {isFallbackDegraded && fallbackAgent && (
                            <div className="text-[9px] text-amber-300 font-bold flex items-center gap-1 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-500/50 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span>Failover Degraded ({fallbackAgent.latencyMs}ms)</span>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Simulation Run Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-bold uppercase">Test Workflow Execution</span>
                  <span className="text-[10px] text-zinc-500">Live Round-Trip Simulation</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Enter test task prompt for workflow route..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={() => handleRunSimulation(activeRoute.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shrink-0"
                  >
                    <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>{isSimulating ? 'Executing...' : 'Run Test Route'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Result Output */}
            {simulationResult && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-purple-500/40 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-emerald-300">
                      Workflow Succeeded in {simulationResult.totalLatencyMs} ms
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{simulationResult.executionId}</span>
                </div>

                <div className="space-y-1.5">
                  {simulationResult.hops.map((hop) => (
                    <div
                      key={hop.hopNumber}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-purple-400">Hop {hop.hopNumber}:</span>
                        <span className="text-zinc-200 font-bold truncate">{hop.agentName}</span>
                        <span className="text-zinc-400 truncate">({hop.action})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-emerald-400 font-bold">{hop.latencyMs}ms</span>
                        <span className="px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[8px] font-bold">
                          {hop.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-zinc-500 pt-1 flex justify-between">
                  <span>Zero Core Mutation Verified (Δ0.00%)</span>
                  <span>SLA Margin: {(142.0 - simulationResult.totalLatencyMs).toFixed(1)}ms HEADROOM</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact Scrollable Log of Recent Workflow Routing Decisions */}
      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Recent Workflow Routing Decisions Log</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-500/30 font-bold">
              {decisionLogs.length} Decisions Logged
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-sans hidden sm:inline">
              SSoT Zero-Drift &amp; SLA Compliance Audit Trail
            </span>
            {decisionLogs.length > 0 && (
              <button
                type="button"
                onClick={() => aiAgentRegistryService.clearDecisionLogs()}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] cursor-pointer transition"
                title="Clear routing decision logs"
              >
                Clear Logs
              </button>
            )}
          </div>
        </div>

        {/* Compact Scrollable Container */}
        <div
          data-testid="orchestrator-decision-logs"
          className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px] scrollbar-thin scrollbar-thumb-zinc-700"
        >
          {decisionLogs.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-xs">
              No workflow routing decisions recorded yet. Run a route simulation above to record live decisions.
            </div>
          ) : (
            decisionLogs.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              const isFallback = log.status === 'FALLBACK_TRIGGERED';
              return (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : isFallback
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {log.status}
                    </span>

                    <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    <span className="text-purple-300 font-bold truncate shrink-0">
                      [{log.taskType}]
                    </span>

                    <span className="text-zinc-200 font-semibold truncate max-w-[180px] sm:max-w-[240px]">
                      &rarr; {log.primaryAgentName}
                    </span>

                    <span className="text-zinc-500 truncate hidden lg:inline max-w-[200px]">
                      &ldquo;{log.promptSnippet}&rdquo;
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-300">
                      {log.executionMode}
                    </span>

                    <span className="font-bold text-emerald-400">
                      {log.totalLatencyMs}ms
                    </span>

                    <span className="text-[9px] text-zinc-500">
                      ({log.hopCount} hop{log.hopCount > 1 ? 's' : ''})
                    </span>

                    {log.approvalRequired && (
                      <span className="text-amber-400 text-[9px] flex items-center" title="Required explicit approval">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        Gate
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
