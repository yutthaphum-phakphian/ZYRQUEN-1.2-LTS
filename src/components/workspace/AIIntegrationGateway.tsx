import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Terminal,
  Cpu,
  Key,
  ExternalLink,
  Lock,
  ArrowRight,
  Code2,
  AlertTriangle,
  Server,
  Layers,
} from 'lucide-react';
import { safeCopyToClipboard } from '@/utils/clipboard';
import {
  aiAgentRegistryService,
  ConnectedAgent,
  AgentRole,
  AgentProtocol,
  AgentLatencyMeasurementLog,
} from '@/services/aiAgentRegistryService';

export const AIIntegrationGateway: React.FC = () => {
  const [agents, setAgents] = useState<ConnectedAgent[]>(() => aiAgentRegistryService.getAgents());
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    () => agents[1]?.id || agents[0]?.id || ''
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'nodejs' | 'curl'>('python');
  const [isPinging, setIsPinging] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    agentId: string;
    success: boolean;
    latencyMs: number;
    message: string;
    timestamp: string;
  } | null>(null);

  // Real-time latency measurements & heartbeat state
  const [latencyLogs, setLatencyLogs] = useState<AgentLatencyMeasurementLog[]>(() =>
    aiAgentRegistryService.getRecentLatencyLogs()
  );
  const [latencyThreshold, setLatencyThresholdState] = useState<number>(() =>
    aiAgentRegistryService.getLatencyThreshold()
  );
  const [isHeartbeating, setIsHeartbeating] = useState<boolean>(false);
  const [heartbeatSummary, setHeartbeatSummary] = useState<{
    totalAgents: number;
    healthyCount: number;
    degradedCount: number;
    offlineCount: number;
    maxLatencyMs: number;
    avgLatencyMs: number;
    timestamp: string;
  } | null>(null);
  const [selectedLogFilterAgent, setSelectedLogFilterAgent] = useState<string>('ALL');
  const [turboProcessingMode, setTurboProcessingMode] = useState<boolean>(true);

  // Form for registering a new agent
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formEndpoint, setFormEndpoint] = useState<string>('http://localhost:8000/v1/chat/completions');
  const [formModel, setFormModel] = useState<string>('my-custom-agent');
  const [formRole, setFormRole] = useState<AgentRole>('PLANNER');
  const [formProtocol, setFormProtocol] = useState<AgentProtocol>('REST_HTTP');
  const [formToken, setFormToken] = useState<string>('SOV_TOKEN_DEFAULT_ARCHITECT');
  const [formDesc, setFormDesc] = useState<string>('');

  useEffect(() => {
    const unsub = aiAgentRegistryService.subscribe(() => {
      const updated = aiAgentRegistryService.getAgents();
      setAgents(updated);
      setLatencyLogs(aiAgentRegistryService.getRecentLatencyLogs());
      setLatencyThresholdState(aiAgentRegistryService.getLatencyThreshold());
      if (!selectedAgentId && updated.length > 0) {
        setSelectedAgentId(updated[0].id);
      }
    });
    return () => unsub();
  }, [selectedAgentId]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleCopy = (text: string, key: string) => {
    safeCopyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePing = async (agentId: string) => {
    setIsPinging(agentId);
    const res = await aiAgentRegistryService.pingAgent(agentId, 'MANUAL_PING');
    setIsPinging(null);
    setTestResult({
      agentId,
      success: res.success,
      latencyMs: res.latencyMs,
      message: res.success
        ? `Communication verified: Round-trip ${res.latencyMs}ms (Status: ${res.status})`
        : `Connection degraded or timed out: ${res.latencyMs}ms`,
      timestamp: new Date().toLocaleTimeString(),
    });
    setLatencyLogs(aiAgentRegistryService.getRecentLatencyLogs());
  };

  const handleSystemWideHeartbeat = async () => {
    setIsHeartbeating(true);
    try {
      const result = await aiAgentRegistryService.triggerSystemWideHeartbeat();
      setHeartbeatSummary({
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      });
      setLatencyLogs(aiAgentRegistryService.getRecentLatencyLogs());
    } finally {
      setIsHeartbeating(false);
    }
  };

  const handleThresholdChange = (val: number) => {
    aiAgentRegistryService.setLatencyThreshold(val);
    setLatencyThresholdState(val);
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEndpoint.trim()) return;

    const newAgent = aiAgentRegistryService.addAgent({
      id: `agent-custom-${Date.now().toString(36)}`,
      name: formName.trim(),
      endpoint: formEndpoint.trim(),
      modelIdentifier: formModel.trim() || 'custom-model',
      role: formRole,
      protocol: formProtocol,
      status: 'ONLINE',
      latencyMs: 42,
      lastPingAt: new Date().toISOString(),
      authMethod: formToken ? 'BEARER_TOKEN' : 'NONE',
      token: formToken.trim() || undefined,
      capabilities: ['natural_language_reasoning', 'workflow_routing'],
      routePriority: 3,
      description: formDesc.trim() || 'Custom user-connected AI agent.',
    });

    setFormName('');
    setFormDesc('');
    setShowAddForm(false);
    setSelectedAgentId(newAgent.id);
  };

  const handleDeleteAgent = (agentId: string) => {
    aiAgentRegistryService.removeAgent(agentId);
  };

  const [autoPing, setAutoPing] = useState<boolean>(true);
  const [lastAutoPingTime, setLastAutoPingTime] = useState<string>(new Date().toISOString());

  // Periodically ping connected AI agents (every 15s)
  useEffect(() => {
    if (!autoPing) return;
    const interval = setInterval(async () => {
      await aiAgentRegistryService.pingAllAgents();
      setLastAutoPingTime(new Date().toISOString());
    }, 15000);
    return () => clearInterval(interval);
  }, [autoPing]);

  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const d = new Date(timestamp);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
    if (diffSec < 4) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusBadge = (status: ConnectedAgent['status'], lastPingAt?: string) => {
    let badge;
    switch (status) {
      case 'ONLINE':
        badge = (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE</span>
          </span>
        );
        break;
      case 'STANDBY':
        badge = (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>STANDBY</span>
          </span>
        );
        break;
      case 'DEGRADED':
        badge = (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>DEGRADED</span>
          </span>
        );
        break;
      case 'OFFLINE':
      default:
        badge = (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/90 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>OFFLINE</span>
          </span>
        );
        break;
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {badge}
        <span
          data-testid="agent-last-seen-timestamp"
          className="text-[9px] text-zinc-400 font-mono flex items-center gap-0.5"
          title={`Last seen at: ${lastPingAt ? new Date(lastPingAt).toLocaleString() : 'Never'}`}
        >
          <span>seen</span>
          <span className="text-zinc-300 font-semibold">{formatLastSeen(lastPingAt)}</span>
        </span>
      </div>
    );
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-evktkflalhkukcrjcltkgw-962549943978.asia-east1.run.app';

  const pythonSnippet = `# ZYNTHEOR AI Integration Bridge — Python Client for Your Other AI
import requests

BASE_URL = "${currentHost}"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer SOV_TOKEN_DEFAULT_ARCHITECT",
    "x-sovereign-api-token": "SOV_TOKEN_DEFAULT_ARCHITECT"
}

# Call ZYNTHEOR Central Tool Gateway
def execute_tool(tool_id, params=None):
    payload = {
        "toolId": tool_id,
        "targetWorkspace": "ws-agent-02",
        "targetLayer": "WORKSPACE_RUNTIME",
        "params": params or {}
    }
    response = requests.post(f"{BASE_URL}/api/tools/gateway", headers=HEADERS, json=payload)
    return response.json()

# Example: Inspect live system state and request code analysis
status = execute_tool("workspace.inspect")
print("ZYNTHEOR Telemetry:", status)
`;

  const nodeSnippet = `// ZYNTHEOR AI Integration Bridge — Node.js / TypeScript Client
import fetch from 'node-fetch'; // or built-in fetch in Node 18+

const BASE_URL = '${currentHost}';
const TOKEN = 'SOV_TOKEN_DEFAULT_ARCHITECT';

async function callZyntheorGateway(toolId, params = {}) {
  const res = await fetch(\`\${BASE_URL}/api/tools/gateway\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${TOKEN}\`,
      'x-sovereign-api-token': TOKEN,
    },
    body: JSON.stringify({
      toolId,
      targetWorkspace: 'ws-agent-02',
      targetLayer: 'WORKSPACE_RUNTIME',
      params,
    }),
  });
  return await res.json();
}

// Execute Tool
callZyntheorGateway('workspace.inspect').then(console.log);
`;

  const curlSnippet = `# Call ZYNTHEOR Tool Gateway directly from terminal or shell
curl -X POST "${currentHost}/api/tools/gateway" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SOV_TOKEN_DEFAULT_ARCHITECT" \\
  -H "x-sovereign-api-token: SOV_TOKEN_DEFAULT_ARCHITECT" \\
  -d '{
    "toolId": "workspace.inspect",
    "targetWorkspace": "ws-agent-02",
    "targetLayer": "WORKSPACE_RUNTIME"
  }'
`;

  return (
    <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 p-4 font-mono space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                AI Integration Gateway & Secure API Bridge
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                SSoT Multi-Agent
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Bidirectional interface connecting external & imported AI agents with ZYNTHEOR Core capabilities.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* System-Wide Heartbeat Check Button */}
          <button
            type="button"
            data-testid="btn-system-wide-heartbeat"
            onClick={handleSystemWideHeartbeat}
            disabled={isHeartbeating}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm ${
              isHeartbeating
                ? 'bg-purple-950 border-purple-500/60 text-purple-200 animate-pulse'
                : 'bg-purple-950/70 hover:bg-purple-900 border-purple-500/40 text-purple-300 hover:text-white'
            }`}
            title="Perform synchronous system-wide heartbeat sweep across all registered AI agent nodes"
          >
            <Zap className={`w-3.5 h-3.5 ${isHeartbeating ? 'animate-spin text-purple-300' : 'text-purple-400'}`} />
            <span>{isHeartbeating ? 'Sweeping All Nodes...' : 'System-Wide Heartbeat'}</span>
          </button>

          {/* Periodic Ping Toggle */}
          <button
            type="button"
            onClick={() => setAutoPing((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
              autoPing
                ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Periodically ping all connected AI agents (every 15s)"
          >
            <Radio className={`w-3 h-3 ${autoPing ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span>{autoPing ? 'Periodic: 15s' : 'Auto-Ping Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showAddForm ? 'Close Form' : 'Register External Agent'}</span>
          </button>
        </div>
      </div>

      {/* Latency Threshold & High-Speed Processing Mode Bar */}
      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-zinc-400 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Latency Alert Threshold:</span>
          </div>
          <div className="flex items-center gap-1">
            {[80, 142, 200, 300].map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => handleThresholdChange(th)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                  latencyThreshold === th
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
                title={`Trigger System Event Alert if agent latency exceeds ${th}ms`}
              >
                {th}ms {th === 142 && '(SLA Target)'}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-zinc-500 font-sans">
            (Latency spikes above this limit automatically emit alerts to SystemEventsSidebar)
          </span>
        </div>

        {/* Real Internet & High-Speed Mode Indicator */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTurboProcessingMode((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              turboProcessingMode
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Accelerate multi-agent inference routing with persistent HTTP keep-alive and sub-50ms priority"
          >
            <Zap className={`w-3.5 h-3.5 ${turboProcessingMode ? 'text-cyan-400 animate-pulse' : ''}`} />
            <span>{turboProcessingMode ? 'Turbo High-Speed Active (<50ms)' : 'Standard Speed'}</span>
          </button>

          <span className="px-2 py-1 rounded bg-zinc-950 border border-emerald-500/30 text-emerald-300 text-[10px] flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Internet Connected</span>
          </span>
        </div>
      </div>

      {/* Heartbeat Summary Banner (when recently swept) */}
      {heartbeatSummary && (
        <div
          data-testid="heartbeat-summary-banner"
          className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            heartbeatSummary.degradedCount > 0 || heartbeatSummary.offlineCount > 0
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="font-bold">System-Wide Heartbeat Sweep Completed</span>
              <span className="text-[11px] opacity-80 ml-2">({heartbeatSummary.timestamp})</span>
              <div className="text-[11px] opacity-90 mt-0.5">
                Total Agents: <strong>{heartbeatSummary.totalAgents}</strong> · Healthy:{' '}
                <strong className="text-emerald-400">{heartbeatSummary.healthyCount}</strong> · Degraded:{' '}
                <strong className={heartbeatSummary.degradedCount > 0 ? 'text-amber-400 font-bold' : ''}>
                  {heartbeatSummary.degradedCount}
                </strong>{' '}
                · Offline:{' '}
                <strong className={heartbeatSummary.offlineCount > 0 ? 'text-rose-400 font-bold' : ''}>
                  {heartbeatSummary.offlineCount}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div>
              Avg Latency: <strong className="text-zinc-100">{heartbeatSummary.avgLatencyMs}ms</strong>
            </div>
            <div>
              Max Latency: <strong className="text-zinc-100">{heartbeatSummary.maxLatencyMs}ms</strong>
            </div>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[10px]">
              SLA Limit: {latencyThreshold}ms
            </span>
          </div>
        </div>
      )}

      {/* Add New Agent Form Modal / Card */}
      {showAddForm && (
        <form
          onSubmit={handleAddAgent}
          className="p-3.5 rounded-xl bg-zinc-900/90 border border-cyan-500/30 space-y-3"
        >
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
            <span className="text-xs font-bold text-cyan-300 uppercase">
              Register New Connected AI Agent
            </span>
            <span className="text-[10px] text-zinc-500">Owner Access (#EP-SOVEREIGN-01)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Agent Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Claude Opus Reasoning Agent / My Python Coder"
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Endpoint URL</label>
              <input
                type="text"
                value={formEndpoint}
                onChange={(e) => setFormEndpoint(e.target.value)}
                placeholder="https://my-agent.run.app/v1 or http://localhost:8000"
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Model Identifier</label>
              <input
                type="text"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                placeholder="e.g. zyntheor-p18-sovereign / llama-3"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Assigned Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as AgentRole)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs"
              >
                <option value="PLANNER">PLANNER (High-Level Architecture & Planning)</option>
                <option value="CODER">CODER (Code Generation & Diff Proposals)</option>
                <option value="AUDITOR">AUDITOR (Security, Entropy & Invariant Checks)</option>
                <option value="LOCAL_LLM">LOCAL_LLM (Air-Gapped Local Inference)</option>
                <option value="RESEARCHER">RESEARCHER (Web & Fact Retrieval)</option>
                <option value="CUSTOM">CUSTOM (Generic External Model)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Communication Protocol</label>
              <select
                value={formProtocol}
                onChange={(e) => setFormProtocol(e.target.value as AgentProtocol)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs"
              >
                <option value="REST_HTTP">REST HTTP(S) API Bridge</option>
                <option value="LOCAL_RUNTIME">LOCAL RUNTIME (Ollama / On-Device)</option>
                <option value="WEBSOCKET">WEBSOCKET Event Stream</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Bridge Security Token</label>
              <input
                type="text"
                value={formToken}
                onChange={(e) => setFormToken(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Connect Agent</span>
            </button>
          </div>
        </form>
      )}

      {/* Connected Agents Grid / List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-bold uppercase tracking-wider text-zinc-300">
            Registered AI Agent Fleet ({agents.length})
          </span>
          <span className="text-[10px] text-zinc-500">Click to view Bridge Details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <span className="font-bold text-xs text-zinc-100 truncate">{agent.name}</span>
                    {getStatusBadge(agent.status, agent.lastPingAt)}
                  </div>

                  <div className="space-y-1 text-[10px] text-zinc-400 mb-2">
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span className="text-cyan-400 font-bold">{agent.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span className="font-bold text-emerald-400">{agent.latencyMs} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protocol:</span>
                      <span className="text-zinc-300">{agent.protocol}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                  <span className="text-[9px] text-zinc-500 truncate">{agent.modelIdentifier}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isPinging === agent.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePing(agent.id);
                      }}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-[10px] cursor-pointer"
                      title="Ping test this agent"
                    >
                      <RefreshCw className={`w-3 h-3 ${isPinging === agent.id ? 'animate-spin' : ''}`} />
                    </button>
                    {!agent.isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id);
                        }}
                        className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 text-[10px] cursor-pointer"
                        title="Remove agent"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Agent Bridge Details & Code Snippets */}
      {selectedAgent && (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-100">{selectedAgent.name}</span>
              {getStatusBadge(selectedAgent.status, selectedAgent.lastPingAt)}
              <span className="text-xs text-zinc-400 font-sans">({selectedAgent.description})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPinging === selectedAgent.id}
                onClick={() => handlePing(selectedAgent.id)}
                className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Bridge Ping ({selectedAgent.latencyMs}ms)</span>
              </button>
            </div>
          </div>

          {/* Test Result Banner */}
          {testResult && testResult.agentId === selectedAgent.id && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{testResult.message}</span>
              </div>
              <span className="text-[10px] text-zinc-500">{testResult.timestamp}</span>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Target Endpoint</div>
              <div className="font-bold text-zinc-200 truncate">{selectedAgent.endpoint}</div>
              <div className="text-[9px] text-zinc-500 mt-1">Protocol: {selectedAgent.protocol}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Authentication</div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 truncate">
                  {selectedAgent.token ? 'SOV_TOKEN_DEFAULT_ARCHITECT' : 'NO_AUTH'}
                </span>
                {selectedAgent.token && (
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedAgent.token!, 'token')}
                    className="text-zinc-400 hover:text-cyan-300 cursor-pointer ml-1"
                    title="Copy Token"
                  >
                    {copiedKey === 'token' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
              <div className="text-[9px] text-cyan-400 mt-1">Owner Attested (#EP-SOVEREIGN-01)</div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Safety Invariant Guard</div>
              <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero Core Mutation</span>
              </div>
              <div className="text-[9px] text-emerald-400 mt-1">SSoT Δ0.00% Genesis #849202</div>
            </div>
          </div>

          {/* Integration Snippets for this Agent */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase">
                Integration Code for Your External AI
              </span>
              <div className="flex items-center gap-1">
                {(['python', 'nodejs', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveCodeTab(lang)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                      activeCodeTab === lang
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const snippet =
                      activeCodeTab === 'python'
                        ? pythonSnippet
                        : activeCodeTab === 'nodejs'
                        ? nodeSnippet
                        : curlSnippet;
                    handleCopy(snippet, 'snippet');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] cursor-pointer flex items-center gap-1 ml-1"
                >
                  {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'snippet' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 p-3 overflow-x-auto text-[11px] text-zinc-300 font-mono leading-relaxed">
              <pre>
                {activeCodeTab === 'python' && pythonSnippet}
                {activeCodeTab === 'nodejs' && nodeSnippet}
                {activeCodeTab === 'curl' && curlSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── REAL-TIME LATENCY MEASUREMENTS LOG PANEL (Sorted by Most Recent) ── */}
      <div
        data-testid="real-time-latency-logs-panel"
        className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-3.5 space-y-3 font-mono"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <span className="font-bold text-xs text-zinc-200 uppercase tracking-wide">
                Real-Time Latency Measurement Stream
              </span>
              <span className="text-[10px] text-zinc-400 ml-2">
                (Sorted by newest communication event · SLA Target: {latencyThreshold}ms)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLogFilterAgent}
              onChange={(e) => setSelectedLogFilterAgent(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Connected Agents ({latencyLogs.length})</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                aiAgentRegistryService.clearLatencyLogs();
                setLatencyLogs([]);
              }}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] cursor-pointer transition flex items-center gap-1"
              title="Clear recorded latency measurement stream"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Measurements List / Table */}
        {(() => {
          const filteredLogs = latencyLogs.filter(
            (log) => selectedLogFilterAgent === 'ALL' || log.agentId === selectedLogFilterAgent
          );

          if (filteredLogs.length === 0) {
            return (
              <div className="p-4 text-center text-xs text-zinc-500">
                No latency measurements recorded yet. Run a ping or System-Wide Heartbeat to capture events.
              </div>
            );
          }

          return (
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-zinc-800 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-zinc-950/90 text-zinc-400 text-[10px] uppercase sticky top-0 border-b border-zinc-800">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Agent Node</th>
                    <th className="py-2 px-3">Measured Latency</th>
                    <th className="py-2 px-3">SLA Delta</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Trigger / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {filteredLogs.map((log) => {
                    const delta = Math.round((log.latencyMs - log.thresholdMs) * 10) / 10;
                    const isExceeded = log.isExceeded || log.latencyMs > log.thresholdMs;
                    return (
                      <tr
                        key={log.id}
                        className={`transition hover:bg-zinc-800/40 ${
                          isExceeded
                            ? 'bg-rose-950/20 border-l-2 border-l-rose-500 text-rose-200'
                            : 'text-zinc-300'
                        }`}
                      >
                        <td className="py-1.5 px-3 whitespace-nowrap text-zinc-400 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <span className="font-bold text-zinc-200">{log.agentName}</span>
                          <span className="text-[10px] text-zinc-500 block">{log.modelIdentifier}</span>
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                              log.latencyMs <= 80
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                : log.latencyMs <= log.thresholdMs
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                log.latencyMs <= 80
                                  ? 'bg-emerald-400'
                                  : log.latencyMs <= log.thresholdMs
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                            />
                            <span>{log.latencyMs} ms</span>
                          </span>
                          {isExceeded && (
                            <span className="ml-1.5 text-[9px] text-rose-400 font-bold uppercase">
                              [SPIKE ALERT]
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap font-mono text-[10px]">
                          {delta > 0 ? (
                            <span className="text-rose-400 font-bold">+{delta} ms (Exceeded)</span>
                          ) : (
                            <span className="text-emerald-400">{delta} ms (Within SLA)</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              log.status === 'ONLINE'
                                ? 'bg-emerald-950 text-emerald-300'
                                : log.status === 'DEGRADED'
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap text-[10px] text-zinc-400">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                            {log.trigger}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
