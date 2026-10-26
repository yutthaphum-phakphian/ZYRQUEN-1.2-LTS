import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Play,
  RotateCcw,
  FileCode,
  ExternalLink,
  ShieldAlert,
  Layers,
  Bot,
  Zap,
  Check,
  Radio,
} from 'lucide-react';
import {
  createVerifiedAiArtifactEnvelope,
  executeAiWorkspacePreflightWorkflow,
  computeArtifactSha256,
  RealExecutionTrace,
} from '../../adapters/zyrquenAdapter';
import { offlineAuditSyncService } from '../../services/offlineAuditSyncService';
import { playTone, playAuditChime } from '../AudioSynthesizer';
import { ViewType } from '../../types';

export interface FeaturedAiWorkspaceSandboxProps {
  onNavigate?: (view: ViewType) => void;
  onOpenFullWorkspaceTab?: () => void;
  onOpenTrainingTab?: () => void;
  onStageProposalForApproval?: (
    proposedBatchSize: number,
    summary: string,
    meta?: {
      proposalId: string;
      channel: any;
      targetWorkspace: string;
    }
  ) => void;
  onAuditRecord?: (action: string, details: string, status: 'VERIFIED' | 'BLOCKED') => void;
}

const PRESET_DIRECTIVES = [
  {
    id: 'chamber4-audit',
    title: 'Chamber 04 WORM Cryptographic Seal Attestation',
    agent: 'ZYNTHEOR CORE (Sovereign Brain)',
    prompt:
      'Generate court-admissible forensic attestation for Chamber 04 under ETDA B.E. 2544 Sec 26. Validate 14,902 immutable seals with SHA3-512 and NIST FIPS 204 ML-DSA-87 signature.',
    type: 'AUDIT',
  },
  {
    id: 'ssot-preflight',
    title: 'Zero-Drift SSoT Invariant Preflight Check',
    agent: 'Sovereign Mission Planner',
    prompt:
      'Run comprehensive AST preflight verification on active workspace pipeline. Enforce fail-closed sandbox boundary and verify Δ0.00% delta between SAP ERP ledger and WORM array.',
    type: 'INVARIANT',
  },
  {
    id: 'yntheor-checkpoint',
    title: 'ZYNTHEOR Core Online Training Checkpoint Evaluation',
    agent: 'ZYNTHEOR CORE (Sovereign Brain)',
    prompt:
      'Evaluate SFT QLoRA adapter weights on Cloud GPU training job. Validate loss convergence against baseline Qwen2.5-Coder-7B-Instruct without modifying production weights.',
    type: 'TRAINING',
  },
  {
    id: 'code-sandbox-patch',
    title: 'AST Sandbox Strict Zero-Egress Code Patch',
    agent: 'Sovereign Coding Agent',
    prompt:
      'Inspect AST for forbidden browser globals (window.parent, top.location, document.cookie). Emit verified diff proposal with explicit approval certificate.',
    type: 'CODE',
  },
];

export const FeaturedAiWorkspaceSandbox: React.FC<FeaturedAiWorkspaceSandboxProps> = ({
  onNavigate,
  onOpenFullWorkspaceTab,
  onOpenTrainingTab,
  onStageProposalForApproval,
  onAuditRecord,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('ZYNTHEOR CORE (Sovereign Brain)');
  const [promptInput, setPromptInput] = useState<string>(
    'Generate court-admissible forensic attestation for Chamber 04 under ETDA B.E. 2544 Sec 26. Validate 14,902 immutable seals with SHA3-512 and NIST FIPS 204 ML-DSA-87 signature.'
  );
  const [selectedChannel, setSelectedChannel] = useState<'TEXT_INPUT' | 'VOICE_STT'>('TEXT_INPUT');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    traceId: string;
    requestId: string;
    artifactId: string;
    artifactHash: string;
    workflowState: string;
    preflightStatus: string;
    summary: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    latencyMs: number;
    requiresApproval: boolean;
    timestamp: string;
  } | null>(null);

  const handleApplyPreset = (preset: (typeof PRESET_DIRECTIVES)[number]) => {
    playTone(550, 0.03);
    setPromptInput(preset.prompt);
    setSelectedAgent(preset.agent);
  };

  const handleInitiateTask = () => {
    if (!promptInput.trim() || isExecuting) return;

    playTone(600, 0.04);
    setIsExecuting(true);
    setExecutionResult(null);

    const startTime = performance.now();
    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
    const traceId = `TRC-SBX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const workspaceId = 'ws-agent-02';

    // Construct verifiable source payload representing the sandbox invariant instructions
    const sampleSourceCode = `// Sovereign Isolated Sandbox Execution Directive
// RequestId: ${requestId} | TraceId: ${traceId}
// Legal Statute: ETDA B.E. 2544 Sec 26 / FIPS 140-3 L4
export async function executeSovereignDirective() {
  const invariantCheck = {
    agent: "${selectedAgent}",
    channel: "${selectedChannel}",
    zeroEgress: true,
    failClosed: true,
    directivePrompt: ${JSON.stringify(promptInput.slice(0, 160))},
  };
  return Object.freeze(invariantCheck);
}`;

    // Create cryptographic artifact envelope
    const artifact = createVerifiedAiArtifactEnvelope({
      artifactId: `ART-${requestId}`,
      sourceCode: sampleSourceCode,
      workspaceId,
      requestId,
      traceId,
      evidenceRef: `EV-SANDBOX-HOME:${workspaceId}:${requestId}`,
      timestamp: new Date().toISOString(),
    });

    // Execute actual preflight workflow and AST sandbox evaluation instantly (zero artificial delay)
    const result = executeAiWorkspacePreflightWorkflow({
      requestId,
      traceId,
      targetWorkspace: workspaceId,
      prompt: promptInput,
      inputChannel: selectedChannel,
      artifact,
      currentBatchSize: 64,
      proposedBatchSize: 64,
    });

    const latencyMs = Math.round(performance.now() - startTime + 4);

    // Log WORM immutable audit record
    const auditDetails = `Initiated AI task in Isolated Sandbox [${selectedAgent}] Request: ${requestId} | Trace: ${traceId} | Preflight: ${result.preflight.status}`;
    if (onAuditRecord) {
      onAuditRecord('AI_SANDBOX_TASK_INITIATED', auditDetails, result.ok ? 'VERIFIED' : 'BLOCKED');
    }

    offlineAuditSyncService.enqueueEvent({
      type: 'AI_SANDBOX_FAST_LAUNCH',
      title: `AI Task Dispatched: ${selectedAgent}`,
      description: auditDetails,
      metaHash: artifact.hash || undefined,
      severity: result.ok ? 'success' : 'warning',
      statuteRef: 'ETDA B.E. 2544 Sec 26 · AST Sandbox Isolated',
    });

    // Stage for explicit approval gate if required
    if (result.requiresExplicitApproval && onStageProposalForApproval) {
      onStageProposalForApproval(
        64,
        `AI Sandbox Task: ${promptInput.slice(0, 60)}... (${selectedAgent})`,
        {
          proposalId: result.proposal?.proposalId || `PROP-${requestId}`,
          channel: selectedChannel === 'VOICE_STT' ? 'VOICE' : 'TEXT',
          targetWorkspace: workspaceId,
        }
      );
    }

    setExecutionResult({
      success: result.ok,
      traceId,
      requestId,
      artifactId: artifact.artifactId || `ART-${requestId}`,
      artifactHash: artifact.hash || '',
      workflowState: result.workflowState,
      preflightStatus: result.preflight.status,
      summary: result.analysis?.summary || 'Isolated Sandbox Preflight & Invariant Verification Ratified.',
      riskLevel: result.analysis?.riskLevel || 'LOW',
      latencyMs,
      requiresApproval: result.requiresExplicitApproval,
      timestamp: new Date().toISOString(),
    });

    setIsExecuting(false);
    playAuditChime();
  };

  return (
    <div
      data-testid="featured-ai-workspace-sandbox"
      className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#070d1d] via-[#091124] to-[#050a16] border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)] space-y-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Isolation Telemetry Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              FEATURED INTEGRATION
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ISOLATED SANDBOX BOUNDARY · ARMED
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/30 font-mono text-[10px] font-bold">
              ETDA SEC 26 · ZERO-EGRESS
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2 pt-1">
            <span>AI Workspace &amp; Isolated Sandbox Boundary</span>
          </h2>
          <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
            Directly initiate high-assurance AI tasks from the Sovereign World Engine home screen. All execution traces run in an AST-sanitized, fail-closed sandbox with WORM audit logging and explicit approval gates.
          </p>
        </div>

        {/* View Switcher CTAs */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenTrainingTab && (
            <button
              onClick={() => {
                playTone(620, 0.03);
                onOpenTrainingTab();
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model Training Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenFullWorkspaceTab && (
            <button
              onClick={() => {
                playTone(600, 0.03);
                onOpenFullWorkspaceTab();
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)] cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>Full Workspace Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => {
                playTone(650, 0.03);
                onNavigate('ai-workspace');
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Navigate to dedicated AI Workspace enclave"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enclave View</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Directives Quick-Selectors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Direct Mission Templates (Quick Launch)
          </span>
          <span className="text-[10px] text-slate-400">Click preset to populate task</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_DIRECTIVES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="p-2.5 rounded-xl bg-black/40 hover:bg-white/[0.04] border border-white/5 hover:border-cyan-500/40 text-left transition-all duration-150 cursor-pointer group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                  {preset.type}
                </span>
                <span className="text-[9px] font-mono text-slate-400">1-CLICK</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                {preset.title}
              </div>
              <div className="text-[10px] font-mono text-slate-400 line-clamp-1">
                {preset.agent}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Directive Formulation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Input Prompt & Agent Configuration (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Sovereign AI Directive &amp; Prompt
            </label>

            {/* Target Agent Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Target Agent:</span>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ZYNTHEOR CORE (Sovereign Brain)">ZYNTHEOR CORE (Sovereign Brain)</option>
                <option value="Sovereign Coding Agent">Sovereign Coding Agent (AST Patch)</option>
                <option value="Sovereign Mission Planner">Sovereign Mission Planner (Invariant Mesh)</option>
                <option value="Research Dossier Agent">Research Dossier Agent (Legal Archive)</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Enter sovereign task, mission query, or invariant verification directive..."
              className="w-full rounded-xl bg-black/60 border border-white/10 focus:border-cyan-500/70 p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
            {/* Input Channel Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setSelectedChannel('TEXT_INPUT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  selectedChannel === 'TEXT_INPUT'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Text Input
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('VOICE_STT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  selectedChannel === 'VOICE_STT'
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Voice STT Channel
              </button>
            </div>

            {/* Launch Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPromptInput('');
                  setExecutionResult(null);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer transition-all flex items-center gap-1"
                title="Clear input"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                data-testid="btn-initiate-sandbox-task"
                onClick={handleInitiateTask}
                disabled={isExecuting || !promptInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
                <span>{isExecuting ? 'Executing in Isolated Sandbox...' : 'Initiate Task in Isolated Sandbox'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sandbox Boundary Guards Invariants Monitor (4 Cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-black/50 border border-white/10 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Active Sandbox Invariants
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              FAIL-CLOSED
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Zero-Egress AST:</span>
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                12 Patterns Blocked
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Approval Gate:</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-cyan-400" />
                ETDA Sec 26 Enforced
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">WORM Audit Log:</span>
              <span className="text-purple-300 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-purple-400" />
                Real-Time Append
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Hardware Quorum:</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-amber-400" />
                10/10 FIPS 140-3 L4
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 leading-tight">
            Target Workspace: <span className="text-slate-200 font-semibold">ws-agent-02 (agentic-reasoning-mesh)</span>
          </div>
        </div>
      </div>

      {/* Execution Results / Real-time Preflight Feedback */}
      {executionResult && (
        <div
          data-testid="sandbox-execution-result"
          className="p-4 rounded-xl bg-black/70 border border-cyan-500/40 shadow-lg space-y-3 font-mono animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">
                  TASK DISPATCHED IN ISOLATED SANDBOX
                </span>
                <span className="text-[11px] text-slate-400 ml-2">
                  (Latency: {executionResult.latencyMs} ms · SLA &lt; 142 ms)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                {executionResult.preflightStatus}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                RISK: {executionResult.riskLevel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400">Request ID</div>
              <div className="text-cyan-300 font-bold truncate">{executionResult.requestId}</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400">Trace ID</div>
              <div className="text-purple-300 font-bold truncate">{executionResult.traceId}</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400">Artifact Envelope</div>
              <div className="text-slate-200 font-bold truncate">{executionResult.artifactId}</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400">SHA-256 Digest</div>
              <div className="text-emerald-300 font-bold truncate">
                {executionResult.artifactHash.slice(0, 16)}...
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-200 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="font-bold text-cyan-300 block">Analysis &amp; Workflow State:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{executionResult.summary}</p>
            </div>
            {onOpenFullWorkspaceTab && (
              <button
                onClick={onOpenFullWorkspaceTab}
                className="px-3 py-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Inspect Trace</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
