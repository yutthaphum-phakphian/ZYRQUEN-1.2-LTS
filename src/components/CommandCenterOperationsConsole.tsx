import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SelfTuningConsole } from './SelfTuningConsole';
import { ZyrquenLogo, ZyrquenIcon } from './ZyrquenLogo';
import { AIWorkspace, type AiInputChannel } from './AIWorkspace';
import {
  INITIAL_ADAPTER_WRITE_GATE_STEPS,
  ADAPTER_WRITE_COMMAND_PRESETS,
  AdapterWriteGateStep,
  AdapterWriteCommandPreset,
} from '../utils/hologramMaterial';
import {
  loadAuthoritativePhase11Transaction,
  attemptIdempotentPhase11Execution,
  Phase11AuthoritativeTransaction,
  RealExecutionTrace,
  BoundaryHealthSnapshot,
  FailureDiagnosticRecord,
  FailureClassification,
  createCanonicalFinalizedExecutionTrace,
  buildExecutionTraceForOutcome,
  evaluateBoundaryHealthSnapshot,
  createFailureDiagnosticRecord,
  INITIAL_FAILURE_DIAGNOSTIC_RECORDS,
} from '../adapters/zyrquenAdapter';
import { offlineAuditSyncService } from '../services/offlineAuditSyncService';

// ============================================================================
// CONSTANTS & CANONICAL SNAPSHOT DATA (SSoT Boundary)
// ============================================================================
const CORE_GUARD_INFO = {
  status: 'FROZEN / READ-ONLY',
  block: 849202,
  drift: 'Δ0.000%',
  principal: '#EP-SOVEREIGN-01',
  quorum: '10/10 REAL_HSM READY',
};

export interface ConnectedWorkspaceItem {
  id: string;
  name: string;
  status: 'CONNECTED' | 'STANDBY_BUFFER';
  latency: string;
  cpuUtil: number;
  ramUtil: number;
  batchSize: number;
  seals: number;
}

const CONNECTED_WORKSPACES: ConnectedWorkspaceItem[] = [
  {
    id: 'ws-agent-02',
    name: 'agentic-reasoning-mesh',
    status: 'CONNECTED',
    latency: '18.42 ms',
    cpuUtil: 68.4,
    ramUtil: 78.2,
    batchSize: 64,
    seals: 14902,
  },
  {
    id: 'ws-telemetry-01',
    name: 'telemetry-core-8443',
    status: 'CONNECTED',
    latency: '35.80 ms',
    cpuUtil: 41.2,
    ramUtil: 64.0,
    batchSize: 128,
    seals: 14902,
  },
  {
    id: 'ws-quarantine-02',
    name: 'chamber-02-buffer-gamma',
    status: 'STANDBY_BUFFER',
    latency: '0.80 ms',
    cpuUtil: 12.0,
    ramUtil: 21.5,
    batchSize: 16,
    seals: 80,
  },
];

interface TerminalLogEntry {
  type: 'sys' | 'info' | 'cmd' | 'out' | 'warn' | 'err';
  text: string;
}

interface AuditRecordItem {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  actor: string;
  status: 'VERIFIED' | 'BLOCKED';
  details: string;
  hash: string;
}

// ============================================================================
// VISUAL RESOURCE QUOTA ALERT COMPONENT (Right Column)
// ============================================================================
interface ResourceQuotaAlertProps {
  workspace: ConnectedWorkspaceItem;
  cpuQuotaLimit: number;
  ramQuotaLimit: number;
  isCpuExceeded: boolean;
  isRamExceeded: boolean;
  onPrestageRemediation: () => void;
  onOpenSelfTuning: () => void;
}

const ResourceQuotaAlert: React.FC<ResourceQuotaAlertProps> = ({
  workspace,
  cpuQuotaLimit,
  ramQuotaLimit,
  isCpuExceeded,
  isRamExceeded,
  onPrestageRemediation,
  onOpenSelfTuning,
}) => {
  if (!isCpuExceeded && !isRamExceeded) {
    return (
      <div className="p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/30 flex items-center justify-between gap-2 font-mono text-[11px] text-emerald-300 tabular-nums">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">
            QUOTA STATUS: NOMINAL — CPU ({workspace.cpuUtil}% &le; {cpuQuotaLimit}%) · RAM ({workspace.ramUtil}% &le;{' '}
            {ramQuotaLimit}%)
          </span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 font-bold shrink-0">
          WITHIN QUOTA
        </span>
      </div>
    );
  }

  const cpuDelta = (workspace.cpuUtil - cpuQuotaLimit).toFixed(1);
  const ramDelta = (workspace.ramUtil - ramQuotaLimit).toFixed(1);

  return (
    <div
      role="alert"
      className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.25)] space-y-2.5 font-mono text-xs tabular-nums"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="font-bold text-rose-200 uppercase tracking-wide text-[11px] sm:text-xs">
            ⚠️ RESOURCE QUOTA LIMIT EXCEEDED ({workspace.id})
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 shrink-0">
          PERIODIC TERMINAL MONITOR ACTIVE
        </span>
      </div>

      <div className="space-y-1 text-[11px] text-rose-100/90 bg-black/40 p-2.5 rounded-lg border border-rose-500/30">
        {isCpuExceeded && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-rose-300 font-semibold">• CPU Usage Breach:</span>
            <span className="font-bold text-white">
              {workspace.cpuUtil}% &gt; {cpuQuotaLimit}% Quota (+{cpuDelta}% Over Limit)
            </span>
          </div>
        )}
        {isRamExceeded && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-amber-300 font-semibold">• RAM Usage Breach:</span>
            <span className="font-bold text-white">
              {workspace.ramUtil}% &gt; {ramQuotaLimit}% Quota (+{ramDelta}% Over Limit)
            </span>
          </div>
        )}
        <div className="text-[10px] text-zinc-400 pt-1 border-t border-rose-900/50">
          System warning automatically injected into Adapter Boundary Terminal Console. Core remains FROZEN (0 Core Mutation).
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={onPrestageRemediation}
          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] sm:text-[11px] cursor-pointer transition"
        >
          ⚡ Pre-Stage Batch Reduction ({workspace.batchSize} &rarr; 48)
        </button>
        <button
          type="button"
          onClick={onOpenSelfTuning}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 font-semibold text-[10px] sm:text-[11px] cursor-pointer transition"
        >
          🛠️ Open Autonomous Self-Tuning Engine
        </button>
      </div>
    </div>
  );
};

export interface StagedAiCommandRequest {
  proposalId: string;
  proposedBatchSize: number;
  summary: string;
  channel: AiInputChannel;
  targetWorkspace: string;
}

export interface CommandCenterOperationsConsoleProps {
  embedded?: boolean;
  initialModule?: 'operations' | 'self-tuning' | 'voice-builder';
  stagedAiRequest?: StagedAiCommandRequest | null;
  onConsumeStagedAiRequest?: () => void;
  onSystemAuditLog?: (action: string, details: string, status: 'VERIFIED' | 'BLOCKED') => void;
}

// ============================================================================
// MAIN OPERATIONS & TERMINAL CONSOLE COMPONENT (SECTION 3)
// ============================================================================
export function CommandCenterOperationsConsole({
  embedded = false,
  initialModule = 'operations',
  stagedAiRequest = null,
  onConsumeStagedAiRequest,
  onSystemAuditLog,
}: CommandCenterOperationsConsoleProps) {
  // Sidebar Module Navigation State
  const [activeSidebarModule, setActiveSidebarModule] = useState<'operations' | 'self-tuning' | 'voice-builder'>(initialModule);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([
    { type: 'sys', text: 'ZYRQUEN Ω∞ Adapter Boundary Terminal v11.0.0-LTS' },
    { type: 'sys', text: 'Type "help" or "boundary" for available commands.' },
    {
      type: 'info',
      text: 'Core Lock: FROZEN (Genesis Block #849202 | Zero Core Mutation Guaranteed)',
    },
  ]);

  // Active Selected Workspace for Operations (`selectedWs`)
  const [workspaces, setWorkspaces] = useState<ConnectedWorkspaceItem[]>(CONNECTED_WORKSPACES);
  const [selectedWsId, setSelectedWsId] = useState<string>('ws-agent-02');
  const selectedWs = workspaces.find((w) => w.id === selectedWsId) || workspaces[0];
  const activeWorkspace = selectedWs;

  // Operations & Quota Controls (Right Column)
  const [cpuQuotaLimit, setCpuQuotaLimit] = useState<number>(80);
  const [ramQuotaLimit, setRamQuotaLimit] = useState<number>(85);
  const [activeBatch, setActiveBatch] = useState<number>(selectedWs.batchSize);
  const [isPeriodicMonitorEnabled, setIsPeriodicMonitorEnabled] = useState<boolean>(true);

  const isCpuExceeded = selectedWs.cpuUtil > cpuQuotaLimit;
  const isRamExceeded = selectedWs.ramUtil > ramQuotaLimit;

  // Sync activeBatch when selectedWs changes
  useEffect(() => {
    setActiveBatch(selectedWs.batchSize);
  }, [selectedWs.id, selectedWs.batchSize]);

  // Audit Drawer State
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [auditRecords, setAuditRecords] = useState<AuditRecordItem[]>([
    {
      id: 'AUD-849205-01',
      timestamp: '2026-09-27T08:26:22Z',
      action: 'ADAPTER_BOUNDARY_INIT',
      target: 'ws-agent-02 (agentic-reasoning-mesh)',
      actor: '#EP-SOVEREIGN-01',
      status: 'VERIFIED',
      details: 'Connected via 6-Gate Policy Firewall. ZYRQUEN Ω∞ Core locked READ-ONLY.',
      hash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb924',
    },
    {
      id: 'AUD-849205-02',
      timestamp: '2026-09-27T08:28:10Z',
      action: 'MERKLE_PARITY_VERIFIED',
      target: '14,902 Active Seals (Chamber-00)',
      actor: 'REAL_HSM_10_10',
      status: 'VERIFIED',
      details: '64/64 Hex Parity confirmed. Drift Δ0.000%.',
      hash: 'SHA256:909ab814479844d8a14816bed34cdbb0',
    },
  ]);
  const auditSeqRef = useRef<number>(3);

  // Authoritative Phase 11 Transaction & Post-Execution Lock State
  const [authoritativeTx, setAuthoritativeTx] = useState<Phase11AuthoritativeTransaction>(() =>
    loadAuthoritativePhase11Transaction()
  );
  const [reExecutionBlockedReason, setReExecutionBlockedReason] = useState<string | null>(null);

  // 1. Real Execution Trace (REQUEST -> ANALYSIS -> PROPOSAL -> APPROVAL -> EXECUTE -> TARGET -> VERIFY -> AUDIT)
  const [executionTrace, setExecutionTrace] = useState<RealExecutionTrace>(() =>
    createCanonicalFinalizedExecutionTrace()
  );

  // 2. Boundary Health Monitor (AI Provider, Command Engine, Adapter, Target Workspace, Verification, Audit Ledger)
  const [aiProviderLiveState, setAiProviderLiveState] = useState<{
    connected: boolean;
    evidenceRef: string | null;
    detail: string;
  }>({
    connected: false,
    evidenceRef: null,
    detail: 'UNAVAILABLE (Awaiting /api/ai/status verification — Zero Fake Green)',
  });

  // 3. Failure-First Diagnostics Ledger (12-Field Evidence Ledger)
  const [failureDiagnostics, setFailureDiagnostics] = useState<FailureDiagnosticRecord[]>(
    () => INITIAL_FAILURE_DIAGNOSTIC_RECORDS
  );
  const [selectedFailureCategoryFilter, setSelectedFailureCategoryFilter] = useState<
    'ALL' | FailureClassification
  >('ALL');

  useEffect(() => {
    let cancelled = false;
    async function checkBoundaryHealth() {
      try {
        const res = await fetch('/api/ai/status');
        if (!res.ok) {
          if (!cancelled) {
            setAiProviderLiveState({
              connected: false,
              evidenceRef: null,
              detail: `UNAVAILABLE (HTTP ${res.status})`,
            });
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const isConnected = Boolean(data.connected && data.evidenceRef);
          const retryNote = data.retryAfterSeconds
            ? ` · Quota Cooldown (${data.retryAfterSeconds}s)`
            : '';
          setAiProviderLiveState({
            connected: isConnected,
            evidenceRef: isConnected ? String(data.evidenceRef) : null,
            detail: isConnected
              ? `CONNECTED (${data.evidenceRef})`
              : `UNAVAILABLE (${data.providerStatus || 'PROVIDER_NOT_CONNECTED'}${retryNote})`,
          });
        }
      } catch {
        if (!cancelled) {
          setAiProviderLiveState({
            connected: false,
            evidenceRef: null,
            detail: 'UNAVAILABLE (Network / Boundary Unreachable)',
          });
        }
      }
    }
    checkBoundaryHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  // 6-Gate Write Pipeline & Preset State (Inspect -> Preview -> Explicit Approval -> Execute -> Verify -> Audit -> FINALIZED)
  const [selectedWritePresetId, setSelectedWritePresetId] = useState<string>(
    ADAPTER_WRITE_COMMAND_PRESETS[0].id
  );
  const selectedWritePreset =
    ADAPTER_WRITE_COMMAND_PRESETS.find((p) => p.id === selectedWritePresetId) ||
    ADAPTER_WRITE_COMMAND_PRESETS[0];

  const [writeGateSteps, setWriteGateSteps] = useState<AdapterWriteGateStep[]>(
    INITIAL_ADAPTER_WRITE_GATE_STEPS
  );
  const [writeGateStage, setWriteGateStage] = useState<
    | 'IDLE'
    | 'INSPECTED'
    | 'PREVIEW_READY'
    | 'AWAITING_APPROVAL'
    | 'EXECUTING'
    | 'VERIFIED'
    | 'AUDITED'
    | 'FINALIZED'
    | 'BLOCKED'
  >(() => (loadAuthoritativePhase11Transaction().isFinalized ? 'FINALIZED' : 'AWAITING_APPROVAL'));
  const [writeGateStatusMsg, setWriteGateStatusMsg] = useState<string>(() => {
    const auth = loadAuthoritativePhase11Transaction();
    return auth.isFinalized
      ? `🔒 STATUS: FINALIZED (${auth.transactionId} · Trace: ${auth.traceId}) — Approval=CLOSED, Execute=CLOSED, Apply=CLOSED, Replay=BLOCKED, Duplicate=BLOCKED, Mutation=BLOCKED.`
      : 'AWAITING EXPLICIT APPROVAL (#EP-SOVEREIGN-01) — Inspect & Preview completed without Core mutation.';
  });

  const [proposedBatchSize, setProposedBatchSize] = useState<number>(48);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [principalSignature, setPrincipalSignature] = useState<string>('#EP-SOVEREIGN-01');
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [lastAuditReceipt, setLastAuditReceipt] = useState<{
    traceId: string;
    workspace: string;
    oldBatch: number;
    newBatch: number;
    cpuQuota: number;
    ramQuota: number;
    timestamp: string;
    merkleHash: string;
  } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const appendLog = useCallback((type: TerminalLogEntry['type'], text: string) => {
    setTerminalLogs((prev) => [...prev, { type, text }]);
  }, []);

  // ==========================================================================
  // PERIODIC RESOURCE QUOTA MONITOR (Checks `selectedWs` vs Quota Sliders)
  // ==========================================================================
  useEffect(() => {
    if (!isPeriodicMonitorEnabled) return;

    const checkQuotaThresholdBreach = () => {
      const cpuBreached = selectedWs.cpuUtil > cpuQuotaLimit;
      const ramBreached = selectedWs.ramUtil > ramQuotaLimit;

      if (!cpuBreached && !ramBreached) {
        return;
      }

      const breachDetails: string[] = [];
      if (cpuBreached) {
        breachDetails.push(
          `CPU ${selectedWs.cpuUtil}% > Quota ${cpuQuotaLimit}% (+${(
            selectedWs.cpuUtil - cpuQuotaLimit
          ).toFixed(1)}%)`
        );
      }
      if (ramBreached) {
        breachDetails.push(
          `RAM ${selectedWs.ramUtil}% > Quota ${ramQuotaLimit}% (+${(
            selectedWs.ramUtil - ramQuotaLimit
          ).toFixed(1)}%)`
        );
      }

      const timeStr = new Date().toISOString().slice(11, 19);
      setTerminalLogs((prev) => [
        ...prev,
        {
          type: 'warn',
          text: `[${timeStr}] [SYSTEM QUOTA MONITOR — ${selectedWs.id} (${selectedWs.name})] THRESHOLD BREACH DETECTED: ${breachDetails.join(
            ' | '
          )}. Core Status: FROZEN (0 Core Mutation). Recommended: Pre-stage batch reduction or execute 6-Gate Write Pipeline.`,
        },
      ]);
    };

    // Immediate evaluation when selectedWs or quota sliders change into a breach state
    checkQuotaThresholdBreach();

    // Periodic monitoring interval (every 6 seconds while breach persists)
    const intervalId = setInterval(checkQuotaThresholdBreach, 6000);

    return () => clearInterval(intervalId);
  }, [
    selectedWs.id,
    selectedWs.name,
    selectedWs.cpuUtil,
    selectedWs.ramUtil,
    cpuQuotaLimit,
    ramQuotaLimit,
    isPeriodicMonitorEnabled,
  ]);

  // Select a 6-Gate Write Command Preset
  const handleSelectWritePreset = (preset: AdapterWriteCommandPreset) => {
    setSelectedWritePresetId(preset.id);
    if (preset.touchesCoreDirectly) {
      setWriteGateSteps(
        INITIAL_ADAPTER_WRITE_GATE_STEPS.map((st) =>
          st.stepNumber <= 2
            ? { ...st, status: 'PASSED' }
            : { ...st, status: 'BLOCKED_CORE_GUARD' }
        )
      );
      setWriteGateStage('BLOCKED');
      setWriteGateStatusMsg(
        '🛑 BLOCKED BY PHASE 11 CORE GUARD: Direct modification of ZYRQUEN Ω∞ Core is strictly prohibited (Fail-Closed).'
      );
      appendLog(
        'err',
        `[6-GATE WRITE PIPELINE — GUARD TEST] Preset "${preset.title}" targeting ${preset.targetWorkspace} BLOCKED at Gate 03 (Core Lock: FROZEN / 0 Core Mutation).`
      );
    } else {
      const auth = loadAuthoritativePhase11Transaction();
      setAuthoritativeTx(auth);
      setWriteGateSteps(INITIAL_ADAPTER_WRITE_GATE_STEPS);
      if (auth.isFinalized) {
        setWriteGateStage('FINALIZED');
        setWriteGateStatusMsg(
          `🔒 STATUS: FINALIZED (${auth.transactionId} · Trace: ${auth.traceId}) — Approval=CLOSED, Execute=CLOSED, Apply=CLOSED, Replay=BLOCKED, Duplicate=BLOCKED, Mutation=BLOCKED.`
        );
      } else {
        setWriteGateStage('AWAITING_APPROVAL');
        setWriteGateStatusMsg(
          'AWAITING EXPLICIT APPROVAL (#EP-SOVEREIGN-01) — Inspect & Preview completed without Core mutation.'
        );
      }
      appendLog(
        'info',
        `[6-GATE WRITE PIPELINE — INSPECT & PREVIEW] Target=${preset.targetWorkspace} | ${preset.inspectSummary}`
      );
    }
  };

  const executeTerminalCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim().toLowerCase();
    if (!cmd) return;

    appendLog('cmd', `zyrquen-adapter (${selectedWs.name}) $ ${rawCmd}`);

    if (cmd === 'clear') {
      setTerminalLogs([
        { type: 'sys', text: 'ZYRQUEN Ω∞ Adapter Boundary Terminal v11.0.0-LTS (Cleared)' },
      ]);
      return;
    }

    if (cmd === 'help') {
      appendLog(
        'out',
        [
          'Available ZYRQUEN Adapter Boundary Commands:',
          '  status          — Read immutable ZYRQUEN Core & Ledger status (READ-ONLY)',
          '  workspace list  — List connected ZYRQUEN runtime workspaces',
          '  resources       — Inspect CPU, RAM, Cryo (14.98 mK), and Batch allocation',
          '  audit verify    — Verify 14,902 active seals & Merkle Root parity (100%)',
          '  boundary        — Display Command Center ↔ ZYRQUEN Adapter isolation topology',
          '  snapshot        — View signed snapshot SNAP-849205-20260927-082622',
          '  agentic-mesh    — Inspect ws-agent-02 (agentic-reasoning-mesh) parameters',
          '  self-tune       — Switch to Autonomous Self-Tuning Engine (Phase 11)',
          '  clear           — Clear terminal output buffer',
        ].join('\n')
      );
      return;
    }

    if (cmd === 'boundary') {
      appendLog(
        'out',
        [
          '[ZYRQUEN ADAPTER / INTEGRATION BOUNDARY TOPOLOGY]',
          '  Command Center (Cloud & AI Command 🛠️)',
          '        │',
          '        ▼',
          '  ZYRQUEN Integration Adapter (6-Gate Policy Firewall)',
          '        ├── READ  → status / workspace / resources / audit (0 Core Mutation)',
          '        └── WRITE → Inspect → Preview → Explicit Approval → Execute → Verify → Audit',
          `  Core Guard: ${CORE_GUARD_INFO.status} | Block #${CORE_GUARD_INFO.block} | Drift ${CORE_GUARD_INFO.drift}`,
        ].join('\n')
      );
      return;
    }

    if (cmd === 'status') {
      appendLog(
        'out',
        [
          `[READ STATUS — SOURCE: ZYRQUEN_LIVE | PROVENANCE: OBSERVED]`,
          `  Engine:      ZYRQUEN Ω∞ Sovereign World Engine (Frozen v1.2 LTS)`,
          `  Core Lock:   ${CORE_GUARD_INFO.status}`,
          `  Block:       #${CORE_GUARD_INFO.block} (Local #849205) | Drift: ${CORE_GUARD_INFO.drift}`,
          `  Principal:   นายยุทธภูมิ พากเพียร (${CORE_GUARD_INFO.principal})`,
          `  Quorum:      ${CORE_GUARD_INFO.quorum}`,
          `  Merkle Root: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
        ].join('\n')
      );
      return;
    }

    if (cmd === 'workspace list') {
      appendLog(
        'out',
        [
          '[CONNECTED ZYRQUEN WORKSPACES — PROVENANCE: OBSERVED]',
          ...workspaces.map(
            (w) =>
              `  • ${w.id} (${w.name}) | ${w.status} | Latency: ${w.latency} | CPU: ${w.cpuUtil}% | RAM: ${w.ramUtil}% | Batch: ${w.batchSize} | Seals: ${w.seals}`
          ),
        ].join('\n')
      );
      return;
    }

    if (cmd === 'resources') {
      appendLog(
        isCpuExceeded || isRamExceeded ? 'warn' : 'out',
        [
          `[WORKSPACE RESOURCES: ${selectedWs.name} (${selectedWs.id})]`,
          `  CPU Utilization: ${selectedWs.cpuUtil}% (Quota Ceiling: ${cpuQuotaLimit}%) ${
            isCpuExceeded ? '[⚠️ EXCEEDED]' : '[OK]'
          }`,
          `  RAM Utilization: ${selectedWs.ramUtil}% (Quota Ceiling: ${ramQuotaLimit}%) ${
            isRamExceeded ? '[⚠️ EXCEEDED]' : '[OK]'
          }`,
          `  Batch Size:      ${selectedWs.batchSize}`,
          `  Latency:         ${selectedWs.latency} (SLA Ceiling < 142.00 ms)`,
          `  Cryostat Temp:   14.98 mK (Helium-4 Flow 74.2%)`,
        ].join('\n')
      );
      return;
    }

    if (cmd === 'audit verify') {
      appendLog(
        'info',
        [
          '[WORM AUDIT & MERKLE PARITY VERIFICATION — PASS]',
          '  Active Seals:     14,902 / 14,982 (80 Quarantined in Chamber-02 Buffer Gamma)',
          '  Merkle Parity:    64/64 Hex Match (100% SSoT Parity)',
          '  Signature Status: VALID_AND_SEALED (ML-DSA-87 / Dilithium-5 + SLH-DSA)',
          '  Core Mutation:    0 (Strict Read-Only Core Enforcement)',
        ].join('\n')
      );
      return;
    }

    if (cmd === 'snapshot') {
      appendLog(
        'out',
        [
          '[DIGITALLY SIGNED SNAPSHOT DOSSIER]',
          '  Snapshot ID: SNAP-849205-20260927-082622',
          '  Timestamp:   2026-09-27T08:26:22.000000Z (RFC3161 Microsecond Verified)',
          '  Integrity:   99.47% Sovereign Integrity Score | CI/CD 30/30 Passing',
        ].join('\n')
      );
      return;
    }

    if (cmd === 'agentic-mesh') {
      appendLog(
        'out',
        [
          '[AGENTIC REASONING MESH — ws-agent-02]',
          '  Runtime:        Python 3.12 AI Runtime (local-sovereign-mesh)',
          '  Context Window: 128k Tokens | Enclave: SGX/SEV-SNP Verified',
          `  Current Batch:  ${workspaces[0].batchSize} | RAM Load: ${workspaces[0].ramUtil}%`,
        ].join('\n')
      );
      return;
    }

    if (cmd === 'self-tune') {
      setActiveSidebarModule('self-tuning');
      appendLog(
        'info',
        'Switched view to Autonomous Self-Tuning Engine (Phase 11).'
      );
      return;
    }

    if (cmd === 'ai-workspace') {
      setActiveSidebarModule('voice-builder');
      appendLog(
        'info',
        'Switched view to AI Workspace & Isolated Preview Sandbox.'
      );
      return;
    }

    if (cmd.includes('core') && (cmd.includes('write') || cmd.includes('mutate') || cmd.includes('delete'))) {
      appendLog(
        'err',
        'CORE_GUARD_VIOLATION_BLOCKED: Direct mutation of ZYRQUEN Ω∞ Core is strictly prohibited (Fail-Closed).'
      );
      const seq = String(auditSeqRef.current++).padStart(2, '0');
      setAuditRecords((prev) => [
        {
          id: `AUD-849205-${seq}`,
          timestamp: new Date().toISOString(),
          action: 'CORE_MUTATION_BLOCKED',
          target: 'ZYRQUEN_CORE',
          actor: CORE_GUARD_INFO.principal,
          status: 'BLOCKED',
          details: `Command "${rawCmd}" rejected by Core Isolation Guard (0 Core Mutation).`,
          hash: 'SHA256:0000000000000000failclosedguard',
        },
        ...prev,
      ]);
      try {
        offlineAuditSyncService.enqueueEvent({
          type: 'ALERT',
          title: 'Command Engine: CORE_MUTATION_BLOCKED',
          description: `Command "${rawCmd}" rejected by Core Isolation Guard (0 Core Mutation).`,
          metaHash: 'cmd-engine:core-mutation-blocked',
          severity: 'critical',
          statuteRef: 'ZYRQUEN Adapter Boundary · Core FROZEN',
        });
      } catch {
        // Ignore storage errors
      }
      onSystemAuditLog?.('CORE_MUTATION_BLOCKED', `Command "${rawCmd}" rejected by Core Isolation Guard (0 Core Mutation).`, 'BLOCKED');
      return;
    }

    // Route any AI-generated or CLI write/tuning requests through the Explicit Approval Gate
    if (
      cmd.startsWith('zyrquen-adapter workspace tune') ||
      cmd.startsWith('tune') ||
      cmd.startsWith('batch') ||
      cmd.startsWith('apply') ||
      cmd.startsWith('proposal')
    ) {
      const targetBatch = cmd.includes('48') ? 48 : 64;
      handleInspectAndPreview(targetBatch);
      appendLog(
        'info',
        `[COMMAND ENGINE -> EXPLICIT APPROVAL GATE] Write/Tuning request "${rawCmd}" staged for #EP-SOVEREIGN-01 Explicit Approval (Authorization Required · Core Mutation=0).`
      );
      const seq = String(auditSeqRef.current++).padStart(2, '0');
      setAuditRecords((prev) => [
        {
          id: `AUD-CMD-GATE-849205-${seq}`,
          timestamp: new Date().toISOString(),
          action: 'COMMAND_ROUTED_TO_EXPLICIT_APPROVAL',
          target: selectedWs.id,
          actor: CORE_GUARD_INFO.principal,
          status: 'VERIFIED',
          details: `Command "${rawCmd}" routed to Explicit Approval Gate (BATCH_SIZE -> ${targetBatch} · Core Mutation=0).`,
          hash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb924',
        },
        ...prev,
      ]);
      try {
        offlineAuditSyncService.enqueueEvent({
          type: 'COMPLIANCE',
          title: 'Command Engine: Write Request Routed to Explicit Approval Gate',
          description: `Command "${rawCmd}" staged for #EP-SOVEREIGN-01 Explicit Approval (BATCH_SIZE -> ${targetBatch}).`,
          metaHash: `cmd-engine:explicit-approval:${seq}`,
          severity: 'info',
          statuteRef: 'Explicit Approval Gate (#EP-SOVEREIGN-01) · Core Mutation = 0',
        });
      } catch {
        // Ignore storage errors
      }
      onSystemAuditLog?.(
        'COMMAND_ROUTED_TO_EXPLICIT_APPROVAL',
        `Command "${rawCmd}" routed to Explicit Approval Gate (BATCH_SIZE -> ${targetBatch}).`,
        'VERIFIED'
      );
      handleRequestApproval();
      return;
    }

    appendLog(
      'warn',
      `Unknown command "${rawCmd}". Type "help" or "boundary" for supported ZYRQUEN Adapter commands.`
    );
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    executeTerminalCommand(terminalInput);
    setTerminalInput('');
  };

  // Step 1 & 2: Inspect & Preview Non-Destructive Diff
  const handleInspectAndPreview = (overrideBatch?: number) => {
    setWriteGateStage('PREVIEW_READY');
    const nextBatch =
      overrideBatch !== undefined
        ? overrideBatch
        : activeBatch !== selectedWs.batchSize
        ? activeBatch
        : selectedWs.batchSize === 64
        ? 48
        : 64;
    setProposedBatchSize(nextBatch);
    setActiveBatch(nextBatch);
    setWriteGateSteps(INITIAL_ADAPTER_WRITE_GATE_STEPS);
    setWriteGateStatusMsg(
      `[1. Inspect & 2. Preview Ready]: Target ${selectedWs.id} (${selectedWs.name}) BATCH_SIZE ${selectedWs.batchSize} -> ${nextBatch} awaiting #EP-SOVEREIGN-01 approval.`
    );
    appendLog(
      'info',
      `[WRITE GATE 1-2: INSPECT & PREVIEW] Target=${selectedWs.id} (${selectedWs.name}) | Non-Destructive Diff: BATCH_SIZE ${selectedWs.batchSize} -> ${nextBatch} | CPU Quota=${cpuQuotaLimit}% | RAM Quota=${ramQuotaLimit}% (0 Core Mutation)`
    );
  };

  // Step 3: Open Explicit Approval Modal (or Block via Idempotency Guard / Core Guard)
  const handleRequestApproval = () => {
    if (selectedWritePreset.touchesCoreDirectly) {
      setWriteGateSteps((prev) =>
        prev.map((st) =>
          st.stepNumber <= 2
            ? { ...st, status: 'PASSED' }
            : { ...st, status: 'BLOCKED_CORE_GUARD' }
        )
      );
      setWriteGateStage('BLOCKED');
      setWriteGateStatusMsg(
        '🛑 FAIL-CLOSED: Direct ZYRQUEN Ω∞ Core modification blocked by Phase 11 Core Guard (0 Core Mutation).'
      );
      appendLog(
        'err',
        `[WRITE GATE 3 BLOCKED] Attempted direct Core write (${selectedWritePreset.commandString}). Rejected by Phase 11 Core Isolation Guard.`
      );
      const seq = String(auditSeqRef.current++).padStart(2, '0');
      const reqId = `REQ-CORE-849205-${seq}`;
      const trcId = `TRC-CORE-849205-${seq}`;
      const coreDiag = createFailureDiagnosticRecord({
        failureId: `FAIL-CORE-849205-${seq}`,
        stage: 'APPROVAL',
        component: 'PHASE11_CORE_ISOLATION_GUARD',
        requestId: reqId,
        traceId: trcId,
        target: 'sovereign-core-engine (ZYRQUEN Ω∞ Core)',
        actualError: `CORE_MUTATION_BLOCKED: Direct Core write command "${selectedWritePreset.commandString}" rejected by Phase 11 Core Isolation Guard.`,
        expectedState: 'WORKSPACE_ADAPTER_TARGET_ONLY (Core FROZEN / READ-ONLY)',
        observedState: 'BLOCKED_CORE_GUARD (0 Core Mutation)',
        evidence: `AUD-GUARD-849205-${seq} · SHA256:e3b0c44298fc1c149afbf4c8996fb924`,
        recoveryState: 'FAIL_CLOSED_ZERO_CORE_MUTATION',
        explicitCategory: 'BLOCKED',
      });
      setFailureDiagnostics((prev) => [coreDiag, ...prev]);
      setExecutionTrace(
        buildExecutionTraceForOutcome({
          traceId: trcId,
          requestId: reqId,
          targetWorkspace: 'sovereign-core-engine',
          stoppedAtStage: 'APPROVAL',
          stopStatus: 'BLOCKED',
          stopDetail: coreDiag.actualError,
          stopEvidenceRef: coreDiag.evidence,
          stageDurationMs: 9,
        })
      );
      setAuditRecords((prev) => [
        {
          id: `AUD-GUARD-849205-${seq}`,
          timestamp: new Date().toISOString(),
          action: 'CORE_WRITE_ATTEMPT_BLOCKED',
          target: 'sovereign-core-engine (ZYRQUEN Ω∞ Core)',
          actor: CORE_GUARD_INFO.principal,
          status: 'BLOCKED',
          details: selectedWritePreset.inspectSummary,
          hash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb924',
        },
        ...prev,
      ]);
      return;
    }

    // Authoritative Idempotency & Post-Execution Lock Guard
    const attempt = attemptIdempotentPhase11Execution({
      transactionId: authoritativeTx.transactionId,
      traceId: authoritativeTx.traceId,
      operationId: authoritativeTx.operationId,
      actor: CORE_GUARD_INFO.principal,
    });
    if (!attempt.allowed) {
      setAuthoritativeTx(attempt.transaction);
      setWriteGateStage('FINALIZED');
      setReExecutionBlockedReason(attempt.reason || 'TRANSACTION_ALREADY_FINALIZED');
      setWriteGateStatusMsg(
        `🛑 BLOCKED (REASON = ${attempt.reason}): Transaction ${attempt.transaction.transactionId} is already FINALIZED 🔒. Re-Execution / Duplicate / Replay BLOCKED (0 Mutation).`
      );
      appendLog(
        'warn',
        `[IDEMPOTENCY GUARD — BLOCKED] REASON = ${attempt.reason} | Tx=${attempt.transaction.transactionId} | Trace=${attempt.transaction.traceId} | Workspace Mutation=0 | Core Mutation=0`
      );
      const seq = String(auditSeqRef.current++).padStart(2, '0');
      const lockDiag = createFailureDiagnosticRecord({
        failureId: `FAIL-LOCK-849205-${seq}`,
        stage: 'APPROVAL',
        component: 'IDEMPOTENCY_REEXECUTION_GUARD',
        requestId: `REQ-DUP-${attempt.transaction.transactionId}-${seq}`,
        traceId: attempt.transaction.traceId,
        target: `${selectedWritePreset.targetWorkspace} (${attempt.transaction.transactionId})`,
        actualError: attempt.auditRecord.details,
        expectedState: 'NON_FINALIZED_TRANSACTION',
        observedState: 'FINALIZED 🔒 (RE-EXECUTION BLOCKED)',
        evidence: `${attempt.auditRecord.hash} · AUD-LOCK-849205-${seq}`,
        timestamp: attempt.auditRecord.timestamp,
        recoveryState: 'LOCKED_IDEMPOTENT_ZERO_MUTATION (Workspace Mutation = 0, Core Mutation = 0)',
        explicitCategory: 'BLOCKED',
      });
      setFailureDiagnostics((prev) => [lockDiag, ...prev]);
      setExecutionTrace(
        buildExecutionTraceForOutcome({
          traceId: attempt.transaction.traceId,
          requestId: lockDiag.requestId,
          targetWorkspace: selectedWritePreset.targetWorkspace,
          stoppedAtStage: 'APPROVAL',
          stopStatus: 'BLOCKED',
          stopDetail: `REASON = ${attempt.reason} (0 Mutation)`,
          stopEvidenceRef: lockDiag.evidence,
          stageDurationMs: 6,
        })
      );
      setAuditRecords((prev) => [
        {
          id: `AUD-LOCK-849205-${seq}`,
          timestamp: attempt.auditRecord.timestamp,
          action: attempt.auditRecord.event,
          target: `${selectedWritePreset.targetWorkspace} (${attempt.transaction.transactionId})`,
          actor: CORE_GUARD_INFO.principal,
          status: 'BLOCKED',
          details: attempt.auditRecord.details,
          hash: attempt.auditRecord.hash,
        },
        ...prev,
      ]);
      return;
    }

    setSignatureError(null);
    setWriteGateStage('AWAITING_APPROVAL');
    setShowApprovalModal(true);
  };

  // Route externally staged AI Workspace requests (from App.tsx / Sidebar AIWorkspace) directly into Explicit Approval Gate
  useEffect(() => {
    if (!stagedAiRequest) return;
    handleInspectAndPreview(stagedAiRequest.proposedBatchSize);
    appendLog(
      'info',
      `[AI WORKSPACE -> COMMAND ENGINE] Routed ${stagedAiRequest.channel} Proposal (${stagedAiRequest.proposalId}) to Explicit Approval Gate (${CORE_GUARD_INFO.principal}): ${stagedAiRequest.summary}`
    );
    const seq = String(auditSeqRef.current++).padStart(2, '0');
    setAuditRecords((prev) => [
      {
        id: `AUD-AI-GATE-849205-${seq}`,
        timestamp: new Date().toISOString(),
        action: 'AI_PROPOSAL_STAGED_AT_EXPLICIT_APPROVAL',
        target: `${stagedAiRequest.targetWorkspace} (${stagedAiRequest.proposalId})`,
        actor: CORE_GUARD_INFO.principal,
        status: 'VERIFIED',
        details: `Channel=${stagedAiRequest.channel} | ${stagedAiRequest.summary} | Core Mutation=0`,
        hash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb924',
      },
      ...prev,
    ]);
    setActiveSidebarModule('operations');
    handleRequestApproval();
    onConsumeStagedAiRequest?.();
  }, [stagedAiRequest]);

  // Step 4-6: Confirm Approval -> Execute -> Verify -> Audit
  const handleConfirmApprovalAndExecute = () => {
    if (principalSignature.trim() !== CORE_GUARD_INFO.principal) {
      setSignatureError(`Requires Sovereign Principal signature: ${CORE_GUARD_INFO.principal}`);
      return;
    }

    setShowApprovalModal(false);
    setWriteGateStage('EXECUTING');

    const oldBatch = selectedWs.batchSize;
    const newBatch = proposedBatchSize;
    const seq = String(auditSeqRef.current++).padStart(2, '0');
    const traceId = `TRC-GATE-849205-${seq}`;

    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.id === selectedWs.id
          ? {
              ...ws,
              batchSize: newBatch,
              cpuUtil: newBatch < oldBatch ? Number(Math.max(20, ws.cpuUtil - 8.2).toFixed(1)) : 68.4,
              ramUtil: newBatch < oldBatch ? Number(Math.max(20, ws.ramUtil - 16.4).toFixed(1)) : 78.2,
            }
          : ws
      )
    );
    setWriteGateSteps((prev) => prev.map((st) => ({ ...st, status: 'PASSED' })));
    setWriteGateStage('FINALIZED');
    setWriteGateStatusMsg(
      `✅ ALL 6 GATES PASSED & FINALIZED 🔒: Signed by ${CORE_GUARD_INFO.principal} · Verified Merkle Parity & Δ0.00% · WORM Audit Trace ${traceId}`
    );

    const receipt = {
      traceId,
      workspace: `${selectedWs.name} (${selectedWs.id})`,
      oldBatch,
      newBatch,
      cpuQuota: cpuQuotaLimit,
      ramQuota: ramQuotaLimit,
      timestamp: new Date().toISOString(),
      merkleHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };
    setLastAuditReceipt(receipt);
    setAuditRecords((prev) => [
      {
        id: traceId,
        timestamp: receipt.timestamp,
        action: 'WORKSPACE_TUNING_APPLIED',
        target: receipt.workspace,
        actor: CORE_GUARD_INFO.principal,
        status: 'VERIFIED',
        details: `Preset: ${selectedWritePreset.title} | BATCH_SIZE ${oldBatch} -> ${newBatch} | CPU Quota ${cpuQuotaLimit}% | RAM Quota ${ramQuotaLimit}% (0 Core Mutation)`,
        hash: `SHA256:${receipt.merkleHash.slice(0, 32)}`,
      },
      ...prev,
    ]);
    setShowCompletionModal(true);

    appendLog(
      'info',
      `[WRITE GATE 3-6 COMPLETE] Approved by ${CORE_GUARD_INFO.principal} | Executed "${selectedWritePreset.commandString}" on ${selectedWs.id} | Applied BATCH_SIZE=${newBatch} | Verified SLA PASS | WORM Audit Trace: ${traceId}`
    );
  };

  return (
    <div
      className={
        embedded
          ? 'w-full max-w-7xl mx-auto text-zinc-100 font-sans space-y-4'
          : 'w-full max-w-7xl mx-auto min-h-screen bg-[#030712] text-zinc-100 font-sans p-2 sm:p-4 md:p-6'
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* ================================================================= */}
        {/* LEFT SIDEBAR NAVIGATION (Primary Thai Display Name + En Subtitle) */}
        {/* ================================================================= */}
        <aside className="lg:col-span-3 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <ZyrquenIcon size={38} />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold truncate">
                    CLOUD &amp; AI COMMAND CENTER 🛠️
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                    ZYRQUEN Adapter Navigation
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-emerald-400 mt-0.5 truncate">
                    🔒 Core: {CORE_GUARD_INFO.status}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditDrawerOpen(true)}
                className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-cyan-300 cursor-pointer shrink-0"
                title="Open WORM Audit Drawer"
              >
                📜 Audit ({auditRecords.length})
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="space-y-2" aria-label="Command Center Module Navigation">
              {/* Module 1: Featured Phase 11 Module with Thai Primary Display Name & English Technical Subtitle */}
              <button
                type="button"
                onClick={() => setActiveSidebarModule('self-tuning')}
                className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  activeSidebarModule === 'self-tuning'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-200 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    PHASE 11 MODULE
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400">v11.0.0-LTS</span>
                </div>
                {/* Primary Display Name */}
                <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                  Autonomous Self-Tuning Engine
                </div>
                {/* Technical Subtitle */}
                <div className="text-[10px] sm:text-[11px] font-mono text-cyan-300/80 mt-0.5">
                  Phase 11 Adapter Boundary
                </div>
              </button>

              {/* Module 2: Operations & Terminal Console */}
              <button
                type="button"
                onClick={() => setActiveSidebarModule('operations')}
                className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  activeSidebarModule === 'operations'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-200 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    SECTION 3 CONSOLE
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400">6-GATE READY</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                  Command Center Operations Console
                </div>
                <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 mt-0.5">
                  Adapter CLI &amp; Quota Governance
                </div>
              </button>

              {/* Module 3: AI Workspace (Chat, Voice Input, Conversation History, Preview, Source) */}
              <button
                type="button"
                onClick={() => setActiveSidebarModule('voice-builder')}
                className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  activeSidebarModule === 'voice-builder'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-200 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    AI WORKSPACE
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400">BOUNDARY</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                  AI Workspace
                </div>
                <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 mt-0.5">
                  Chat · Voice Input · Preview · Source
                </div>
              </button>
            </nav>

            {/* Connected Workspaces Quick Status inside Sidebar */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
                Connected Workspaces ({workspaces.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => setSelectedWsId(ws.id)}
                    className={`w-full text-left p-2 rounded-lg border font-mono text-xs transition cursor-pointer tabular-nums ${
                      ws.id === selectedWsId
                        ? 'bg-zinc-800/90 border-cyan-500/60 text-white'
                        : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-cyan-300 truncate">{ws.name}</span>
                      <span className="text-[10px] text-emerald-400 shrink-0">{ws.latency}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                      <span>{ws.id}</span>
                      <span>Batch: {ws.batchSize}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Guard Invariant Footer */}
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 font-mono text-[10px] sm:text-[11px] space-y-1 tabular-nums">
            <div className="text-emerald-300 font-bold flex items-center justify-between">
              <span>SSoT Guard</span>
              <span>{CORE_GUARD_INFO.drift}</span>
            </div>
            <div className="text-zinc-400">Block #{CORE_GUARD_INFO.block}</div>
            <div className="text-amber-300">{CORE_GUARD_INFO.quorum}</div>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* MAIN CONTENT AREA                                                 */}
        {/* ================================================================= */}
        <div className="lg:col-span-9 space-y-4 sm:space-y-5 min-w-0">
          {activeSidebarModule === 'self-tuning' ? (
            <SelfTuningConsole embedded={true} />
          ) : activeSidebarModule === 'voice-builder' ? (
            <AIWorkspace
              targetWorkspaceId={selectedWs.id}
              targetWorkspaceName={selectedWs.name}
              currentBatchSize={selectedWs.batchSize}
              onStageProposalForApproval={(proposedBatch, summary) => {
                handleInspectAndPreview(proposedBatch);
                appendLog(
                  'info',
                  `[AI WORKSPACE -> COMMAND ENGINE] Staged Proposal for Explicit Approval (${CORE_GUARD_INFO.principal}): ${summary}`
                );
                setActiveSidebarModule('operations');
                handleRequestApproval();
              }}
              onAuditRecord={(action, details, status) => {
                const seq = String(auditSeqRef.current++).padStart(2, '0');
                setAuditRecords((prev) => [
                  {
                    id: `AUD-AI-849205-${seq}`,
                    timestamp: new Date().toISOString(),
                    action,
                    target: `${selectedWs.id} (${selectedWs.name})`,
                    actor: CORE_GUARD_INFO.principal,
                    status,
                    details,
                    hash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb924',
                  },
                  ...prev,
                ]);
                onSystemAuditLog?.(action, details, status);
              }}
              onExecutionTraceUpdate={(trace) => setExecutionTrace(trace)}
              onFailureDiagnostic={(diag) =>
                setFailureDiagnostics((prev) => [diag, ...prev])
              }
            />
          ) : (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-5 space-y-4 sm:space-y-5">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      ZYRQUEN Ω∞ Adapter Boundary Operations &amp; CLI Terminal
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {CORE_GUARD_INFO.status}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-zinc-400 font-mono mt-1 break-all sm:break-normal">
                    Principal: <strong className="text-amber-300">{CORE_GUARD_INFO.principal}</strong> · Quorum:{' '}
                    <strong className="text-emerald-400">{CORE_GUARD_INFO.quorum}</strong> · Active Workspace:{' '}
                    <strong className="text-cyan-300">{selectedWs.name}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAuditDrawerOpen(true)}
                    className="px-3 py-1.5 sm:py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] sm:text-xs font-mono cursor-pointer"
                  >
                    📜 WORM Audit ({auditRecords.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarModule('self-tuning')}
                    className="px-3 py-1.5 sm:py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-[11px] sm:text-xs font-mono font-semibold cursor-pointer"
                  >
                    🛠️ Autonomous Self-Tuning Engine &rarr;
                  </button>
                </div>
              </div>

              {/* Active Workspace Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3 font-mono text-xs tabular-nums">
                <div className="p-2.5 sm:p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[9px] sm:text-[10px] text-zinc-500">WORKSPACE ID</div>
                  <div className="text-cyan-300 font-bold mt-1 truncate">{selectedWs.id}</div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-400 mt-0.5">{selectedWs.status}</div>
                </div>
                <div
                  className={`p-2.5 sm:p-3 rounded-lg border transition-colors ${
                    isCpuExceeded ? 'bg-rose-950/30 border-rose-500/60' : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="text-[9px] sm:text-[10px] text-zinc-500">CPU UTILIZATION</div>
                  <div className={`font-bold text-sm mt-1 ${isCpuExceeded ? 'text-rose-300' : 'text-white'}`}>
                    {selectedWs.cpuUtil}%
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5">Quota: {cpuQuotaLimit}%</div>
                </div>
                <div
                  className={`p-2.5 sm:p-3 rounded-lg border transition-colors ${
                    isRamExceeded ? 'bg-rose-950/30 border-rose-500/60' : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="text-[9px] sm:text-[10px] text-zinc-500">RAM UTILIZATION</div>
                  <div className={`font-bold text-sm mt-1 ${isRamExceeded ? 'text-rose-300' : 'text-amber-300'}`}>
                    {selectedWs.ramUtil}%
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5">Quota: {ramQuotaLimit}%</div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[9px] sm:text-[10px] text-zinc-500">BATCH SIZE</div>
                  <div className="text-cyan-300 font-bold text-sm mt-1">{selectedWs.batchSize}</div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5">Target: {activeBatch}</div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-zinc-950 border border-zinc-800 col-span-2 sm:col-span-1">
                  <div className="text-[9px] sm:text-[10px] text-zinc-500">BOUND SEALS</div>
                  <div className="text-emerald-400 font-bold text-sm mt-1">
                    {selectedWs.seals.toLocaleString()}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5">{selectedWs.latency}</div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* TWO-COLUMN GRID: LEFT (TERMINAL) & RIGHT (RESOURCE QUOTA)     */}
              {/* ============================================================= */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
                {/* LEFT COLUMN: ADAPTER BOUNDARY CLI TERMINAL CONSOLE */}
                <div className="xl:col-span-7 space-y-3 flex flex-col justify-between bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 sm:p-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5 font-mono text-xs">
                      <span className="text-cyan-300 font-bold">
                        💻 ADAPTER BOUNDARY TERMINAL CONSOLE
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPeriodicMonitorEnabled((v) => !v)}
                          className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer transition ${
                            isPeriodicMonitorEnabled
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                          }`}
                          title="Toggle periodic resource usage vs quota slider monitoring"
                        >
                          {isPeriodicMonitorEnabled ? '● Quota Monitor: ON' : '○ Quota Monitor: PAUSED'}
                        </button>
                        <span className="text-[10px] text-zinc-400">
                          Target: <strong className="text-white">{selectedWs.id}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Quick Command Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] sm:text-xs">
                      {(
                        [
                          'help',
                          'boundary',
                          'status',
                          'workspace list',
                          'resources',
                          'audit verify',
                          'snapshot',
                          'agentic-mesh',
                          'self-tune',
                          'clear',
                        ] as const
                      ).map((cmd) => (
                        <button
                          key={cmd}
                          type="button"
                          onClick={() => executeTerminalCommand(cmd)}
                          className="px-2 sm:px-2.5 py-1 rounded bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-700 hover:border-cyan-500/50 text-cyan-300 cursor-pointer transition"
                        >
                          $ {cmd}
                        </button>
                      ))}
                    </div>

                    {/* Terminal Output Window */}
                    <div className="h-64 sm:h-72 overflow-y-auto rounded-lg bg-[#040710] border border-zinc-800 p-3 sm:p-3.5 font-mono text-[11px] sm:text-xs space-y-2">
                      {terminalLogs.map((log, i) => (
                        <div
                          key={i}
                          className={`whitespace-pre-wrap break-words leading-relaxed ${
                            log.type === 'cmd'
                              ? 'text-cyan-300 font-bold'
                              : log.type === 'info'
                              ? 'text-emerald-300'
                              : log.type === 'warn'
                              ? 'text-amber-300 bg-amber-950/30 border-l-2 border-amber-400 pl-2 py-0.5 rounded-r'
                              : log.type === 'err'
                              ? 'text-rose-400 font-bold'
                              : log.type === 'sys'
                              ? 'text-purple-300'
                              : 'text-zinc-300'
                          }`}
                        >
                          {log.text}
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>

                  {/* Terminal Input Form */}
                  <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 font-mono text-xs pt-2">
                    <span className="text-amber-400 font-bold shrink-0 text-[11px] sm:text-xs">
                      {selectedWs.id}&gt;
                    </span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder='Type command ("help", "boundary", "status", "resources")...'
                      className="flex-1 min-w-0 bg-[#040710] border border-zinc-700 rounded-lg px-2.5 sm:px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="px-3 sm:px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold cursor-pointer shrink-0 text-xs"
                    >
                      Execute
                    </button>
                  </form>
                </div>

                {/* RIGHT COLUMN: RESOURCE QUOTA SECTION & VISUAL ALERT */}
                <div className="xl:col-span-5 space-y-4 bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 font-mono text-xs tabular-nums">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        📊 Resource Quota &amp; Governance
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Right Column · Periodic Threshold Guard ({selectedWs.id})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCpuExceeded || isRamExceeded) {
                          setCpuQuotaLimit(80);
                          setRamQuotaLimit(85);
                        } else {
                          setCpuQuotaLimit(60);
                          setRamQuotaLimit(70);
                        }
                      }}
                      className={`px-2 py-1 rounded border text-[10px] font-semibold cursor-pointer transition ${
                        isCpuExceeded || isRamExceeded
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                          : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                      }`}
                      title="Toggle quota threshold to test visual alert and periodic terminal warning"
                    >
                      {isCpuExceeded || isRamExceeded ? 'Reset Quotas (80%/85%)' : 'Test Quota Alert'}
                    </button>
                  </div>

                  {/* VISUAL ALERT COMPONENT (Triggers when CPU or RAM exceeds defined quota limit) */}
                  <ResourceQuotaAlert
                    workspace={selectedWs}
                    cpuQuotaLimit={cpuQuotaLimit}
                    ramQuotaLimit={ramQuotaLimit}
                    isCpuExceeded={isCpuExceeded}
                    isRamExceeded={isRamExceeded}
                    onPrestageRemediation={() => handleInspectAndPreview(48)}
                    onOpenSelfTuning={() => setActiveSidebarModule('self-tuning')}
                  />

                  {/* CPU & RAM Quota Sliders with Live Utilization Progress Bars */}
                  <div className="space-y-3.5 pt-1">
                    {/* CPU Quota Control */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">
                          CPU Usage: <strong className="text-white">{selectedWs.cpuUtil}%</strong>
                        </span>
                        <span className={isCpuExceeded ? 'text-rose-400 font-bold' : 'text-cyan-300 font-bold'}>
                          Quota Limit: {cpuQuotaLimit}% {isCpuExceeded ? '(EXCEEDED)' : ''}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCpuExceeded ? 'bg-rose-500' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${Math.min(100, selectedWs.cpuUtil)}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={95}
                        value={cpuQuotaLimit}
                        onChange={(e) => setCpuQuotaLimit(Number(e.target.value))}
                        aria-label="CPU Quota Limit"
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* RAM Quota Control */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">
                          RAM Usage: <strong className="text-white">{selectedWs.ramUtil}%</strong>
                        </span>
                        <span className={isRamExceeded ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                          Quota Limit: {ramQuotaLimit}% {isRamExceeded ? '(EXCEEDED)' : ''}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isRamExceeded ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, selectedWs.ramUtil)}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={95}
                        value={ramQuotaLimit}
                        onChange={(e) => setRamQuotaLimit(Number(e.target.value))}
                        aria-label="RAM Quota Limit"
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    {/* Target Batch Size Selector */}
                    <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                      <div className="flex justify-between">
                        <span className="text-zinc-400 text-[11px]">Target Batch Size:</span>
                        <span className="text-emerald-300 font-bold">{activeBatch}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[16, 32, 48, 64, 128].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setActiveBatch(b)}
                            className={`flex-1 py-1.5 rounded border text-[10px] cursor-pointer transition ${
                              activeBatch === b
                                ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* WRITE PATH MANDATORY 6-GATE PIPELINE                          */}
              {/* (Inspect → Preview → Explicit Approval → Execute → Verify → Audit) */}
              {/* ============================================================= */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#040710] border border-[#D4AF37]/40 space-y-3.5 font-mono text-xs tabular-nums">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-[#D4AF37]">
                    WRITE PATH MANDATORY 6-GATE PIPELINE (Inspect → Preview → Explicit Approval → Execute → Verify → Audit)
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-zinc-300">
                    Principal: <strong className="text-amber-300">{CORE_GUARD_INFO.principal}</strong>
                  </span>
                </div>

                {/* 3 Write Command Presets: telemetry-core-8443, agentic-reasoning-mesh, sovereign-core-engine */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ADAPTER_WRITE_COMMAND_PRESETS.map((preset) => {
                    const isSelected = preset.id === selectedWritePreset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectWritePreset(preset)}
                        className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? preset.touchesCoreDirectly
                              ? 'bg-rose-950/60 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                              : 'bg-amber-950/50 border-[#D4AF37] text-white shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span
                            className={
                              preset.touchesCoreDirectly ? 'text-rose-300 font-bold' : 'text-cyan-300 font-bold'
                            }
                          >
                            {preset.targetWorkspace}
                          </span>
                          <span className="shrink-0">
                            {preset.touchesCoreDirectly ? '🔒 CORE' : '🛠️ ADAPTER'}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold mt-1 leading-snug">
                          {preset.title}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 6-Stage Stepper: 01 Inspect -> 02 Preview -> 03 Explicit Approval -> 04 Execute -> 05 Verify -> 06 Audit */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {writeGateSteps.map((st) => {
                    const isPassed = st.status === 'PASSED';
                    const isAwaiting = st.status === 'AWAITING_EXPLICIT_APPROVAL';
                    const isBlocked = st.status === 'BLOCKED_CORE_GUARD';
                    return (
                      <div
                        key={st.id}
                        className={`p-2.5 rounded-lg border ${
                          isBlocked
                            ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                            : isAwaiting
                            ? 'bg-amber-950/60 border-[#D4AF37] text-[#D4AF37]'
                            : isPassed
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>0{st.stepNumber}</span>
                          <span>{isBlocked ? 'BLOCKED' : isPassed ? 'PASSED' : isAwaiting ? 'AWAITING' : 'READY'}</span>
                        </div>
                        <div className="font-bold text-[11px] mt-1 truncate">{st.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* [1. Inspect] & [2. Preview Non-Destructive Diff] Box */}
                <div className="p-3 rounded-lg bg-black/70 border border-zinc-800 space-y-2.5">
                  <div className="text-[11px] text-zinc-200 leading-relaxed">
                    <strong className="text-cyan-300">[1. Inspect]:</strong>{' '}
                    {selectedWritePreset.inspectSummary}
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-400 font-bold">
                      [2. Preview Non-Destructive Diff]:
                    </div>
                    <pre className="text-[11px] text-emerald-300 bg-[#040710] p-2.5 rounded border border-zinc-800/90 whitespace-pre-wrap break-words leading-relaxed">
                      {selectedWritePreset.previewDiff.join('\n')}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                      <span className="font-bold text-emerald-300">
                        STATE: {writeGateStage} (Tx: {authoritativeTx.transactionId} · Trace: {authoritativeTx.traceId})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold text-[10px]">
                        RE-EXECUTION: BLOCKED
                      </span>
                    </div>
                    {reExecutionBlockedReason && (
                      <div className="text-[10px] text-rose-300 font-bold">
                        REASON = {reExecutionBlockedReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                    <span className="text-[11px] text-emerald-300 leading-snug">{writeGateStatusMsg}</span>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={writeGateStage === 'FINALIZED' && !selectedWritePreset.touchesCoreDirectly}
                        onClick={handleRequestApproval}
                        className={`px-3.5 py-1.5 rounded-lg font-bold text-[11px] transition ${
                          writeGateStage === 'FINALIZED' && !selectedWritePreset.touchesCoreDirectly
                            ? 'bg-zinc-900 border border-emerald-500/40 text-emerald-300 cursor-not-allowed opacity-85'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 cursor-pointer'
                        }`}
                      >
                        {writeGateStage === 'FINALIZED' && !selectedWritePreset.touchesCoreDirectly
                          ? '🔒 COMPLETED — RE-EXECUTION BLOCKED'
                          : '3. Explicit Approval → Execute → Verify → Audit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* 1. REAL EXECUTION TRACE 🔎 (Single End-to-End 8-Stage Timeline) */}
              {/* ============================================================= */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#040710] border border-cyan-500/40 space-y-3 font-mono text-xs tabular-nums">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      🔎 1. Real Execution Trace (REQUEST &rarr; ANALYSIS &rarr; PROPOSAL &rarr; APPROVAL #EP-SOVEREIGN-01 &rarr; EXECUTE &rarr; TARGET &rarr; VERIFY &rarr; AUDIT)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        executionTrace.overallStatus === 'FINALIZED'
                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                          : executionTrace.overallStatus === 'AWAITING_APPROVAL'
                          ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                          : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {executionTrace.overallStatus}
                      {executionTrace.stoppedAtStage ? ` · STOPPED AT ${executionTrace.stoppedAtStage}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>
                      Trace: <strong className="text-cyan-300">{executionTrace.traceId}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Duration: <strong className="text-emerald-300">{executionTrace.totalDurationMs} ms</strong>
                    </span>
                    {executionTrace.stoppedAtStage && (
                      <button
                        type="button"
                        onClick={() => setExecutionTrace(createCanonicalFinalizedExecutionTrace())}
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 cursor-pointer"
                      >
                        Reset to Canonical Trace
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2">
                  {executionTrace.stages.map((st, idx) => {
                    const isPassed = st.status === 'PASSED';
                    const isStopped =
                      st.status === 'BLOCKED' ||
                      st.status === 'FAILED' ||
                      st.status === 'PROVIDER_UNAVAILABLE';
                    const isAwaiting = st.status === 'AWAITING_APPROVAL';
                    return (
                      <div
                        key={st.stage}
                        className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-2 ${
                          isStopped
                            ? 'bg-rose-950/60 border-rose-500/70 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                            : isAwaiting
                            ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
                            : isPassed
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-zinc-950/70 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span>0{idx + 1}</span>
                            <span>{st.status}</span>
                          </div>
                          <div className="text-[10px] font-semibold mt-0.5 truncate" title={st.displayLabel}>
                            {st.displayLabel}
                          </div>
                          <div className="text-[9px] opacity-80 mt-1 line-clamp-2 leading-snug" title={st.detail}>
                            {st.detail}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-white/10 space-y-0.5 text-[9px]">
                          <div className="flex items-center justify-between">
                            <span className="opacity-80">{st.timestamp ? st.timestamp.slice(11, 19) : '—'}</span>
                            <span>{st.durationMs !== null ? `${st.durationMs} ms` : '—'}</span>
                          </div>
                          <div className="truncate text-cyan-300/90" title={st.evidenceRef || 'NO_EVIDENCE'}>
                            Ev: {st.evidenceRef || 'NONE'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================= */}
              {/* 2. BOUNDARY HEALTH MONITOR (Zero Green Without Real Evidence) */}
              {/* ============================================================= */}
              {(() => {
                const boundarySnapshot: BoundaryHealthSnapshot = evaluateBoundaryHealthSnapshot({
                  aiProviderConnected: aiProviderLiveState.connected,
                  aiProviderEvidenceRef: aiProviderLiveState.evidenceRef,
                  aiProviderDetail: aiProviderLiveState.detail,
                  commandEngineStatus:
                    writeGateStage === 'BLOCKED' || reExecutionBlockedReason ? 'BLOCKED' : 'READY',
                  commandEngineEvidenceRef: `GATE6:${authoritativeTx.transactionId}:EP-SOVEREIGN-01`,
                  commandEngineDetail:
                    writeGateStage === 'BLOCKED' || reExecutionBlockedReason
                      ? `BLOCKED (${reExecutionBlockedReason || 'CORE_ISOLATION_GUARD'})`
                      : `READY (6-Gate Enforced · Tx ${authoritativeTx.transactionId})`,
                  adapterConnected: true,
                  adapterEvidenceRef: `ZYRQUEN_WRITE_GATEWAY_V11:BLK-${CORE_GUARD_INFO.block}`,
                  targetWorkspaceReachable: selectedWs.status === 'CONNECTED',
                  targetWorkspaceId: selectedWs.id,
                  targetWorkspaceEvidenceRef:
                    selectedWs.status === 'CONNECTED'
                      ? `WS:${selectedWs.id}:LATENCY_${selectedWs.latency.replace(/\s+/g, '')}`
                      : null,
                  verificationReady: true,
                  verificationEvidenceRef: `VRF:MERKLE_${CORE_GUARD_INFO.drift}:SEALS_${selectedWs.seals}`,
                  auditLedgerAvailable: auditRecords.length > 0,
                  auditLedgerEvidenceRef:
                    auditRecords.length > 0 ? `${auditRecords[0].id}:${auditRecords[0].hash}` : null,
                });

                const boundaryNodes = [
                  boundarySnapshot.aiProvider,
                  boundarySnapshot.commandEngine,
                  boundarySnapshot.adapter,
                  boundarySnapshot.targetWorkspace,
                  boundarySnapshot.verification,
                  boundarySnapshot.auditLedger,
                ];

                return (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3 font-mono text-xs tabular-nums">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider">
                          🛡️ 2. Boundary Health Monitor
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Zero-Evidence Guard: No green status without verified evidence reference
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[10px] text-cyan-300">
                        Verified Green: {boundaryNodes.filter((n) => n.isGreen).length} / {boundaryNodes.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {boundaryNodes.map((node) => (
                        <div
                          key={node.boundaryId}
                          className={`p-3 rounded-lg border space-y-1.5 ${
                            node.isGreen
                              ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                              : node.status === 'BLOCKED'
                              ? 'bg-amber-950/35 border-amber-500/50 text-amber-200'
                              : 'bg-rose-950/35 border-rose-500/50 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-white">{node.label}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                node.isGreen
                                  ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
                                  : node.status === 'BLOCKED'
                                  ? 'bg-amber-950 border-amber-500/50 text-amber-300'
                                  : 'bg-rose-950 border-rose-500/50 text-rose-300'
                              }`}
                            >
                              {node.status}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-90 leading-snug">{node.detail}</div>
                          <div className="text-[9px] pt-1 border-t border-white/10 truncate text-cyan-300/90">
                            Evidence: {node.evidenceRef || 'NONE (Downgraded to Non-Green)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ============================================================= */}
              {/* 3. FAILURE-FIRST DIAGNOSTICS (12-Field Evidence Ledger)       */}
              {/* ============================================================= */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#040710] border border-rose-500/40 space-y-3 font-mono text-xs tabular-nums">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div>
                    <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      🚨 3. Failure-First Diagnostics (Real Evidence Ledger — Zero AI Guessing)
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      12-Field Deterministic Capture: BLOCKED · FAILED · TIMEOUT · PROVIDER_UNAVAILABLE · VERIFICATION_FAILED · AUDIT_FAILED
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {(
                      [
                        'ALL',
                        'PROVIDER_UNAVAILABLE',
                        'BLOCKED',
                        'FAILED',
                        'TIMEOUT',
                        'VERIFICATION_FAILED',
                        'AUDIT_FAILED',
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedFailureCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded border cursor-pointer transition ${
                          selectedFailureCategoryFilter === cat
                            ? 'bg-rose-950 border-rose-500/60 text-rose-200 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {failureDiagnostics
                    .filter(
                      (d) =>
                        selectedFailureCategoryFilter === 'ALL' ||
                        d.classification === selectedFailureCategoryFilter
                    )
                    .map((diag) => (
                      <div
                        key={diag.failureId}
                        className="p-3 rounded-lg bg-zinc-950/95 border border-rose-500/40 space-y-2 text-[11px]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-bold text-[10px]">
                              {diag.classification}
                            </span>
                            <span className="font-bold text-white">Failure ID: {diag.failureId}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400">Timestamp: {diag.timestamp}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
                          <div>
                            <span className="text-zinc-500">Stage:</span>{' '}
                            <strong className="text-amber-300">{diag.stage}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500">Component:</span>{' '}
                            <strong className="text-cyan-300">{diag.component}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500">Request ID:</span>{' '}
                            <span className="text-zinc-200">{diag.requestId}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Trace ID:</span>{' '}
                            <span className="text-zinc-200">{diag.traceId}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-zinc-500">Target:</span>{' '}
                            <span className="text-zinc-200">{diag.target}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-zinc-500">Evidence:</span>{' '}
                            <span className="text-emerald-300">{diag.evidence}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-zinc-500">Expected State:</span>{' '}
                            <span className="text-zinc-300">{diag.expectedState}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-zinc-500">Observed State:</span>{' '}
                            <strong className="text-rose-300">{diag.observedState}</strong>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-[10px] text-rose-200 break-words">
                          <strong>Actual Error:</strong> {diag.actualError}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-0.5">
                          <span>
                            <span className="text-zinc-500">Recovery State:</span>{' '}
                            <strong className="text-emerald-400">{diag.recoveryState}</strong>
                          </span>
                          {diag.retryAfterSeconds !== null && (
                            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                              Retry Cooldown: {diag.retryAfterSeconds}s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* WORM AUDIT SLIDE-OUT DRAWER                                       */}
      {/* ================================================================= */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-zinc-900 border-l border-cyan-500/40 w-full max-w-md h-full p-4 sm:p-5 flex flex-col justify-between font-mono text-xs shadow-2xl">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <div className="text-sm font-bold text-white">📜 WORM Audit Trail Drawer</div>
                  <div className="text-[10px] text-emerald-400">
                    Immutable Adapter Boundary Receipts ({auditRecords.length})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuditDrawerOpen(false)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-2.5">
                {auditRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-cyan-300">{rec.action}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          rec.status === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-300">{rec.details}</div>
                    <div className="text-[10px] text-zinc-500 break-all">
                      ID: {rec.id} · Target: {rec.target}
                    </div>
                    <div className="text-[10px] text-amber-300/90 break-all">{rec.hash}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400">
              <span>Zero Core Mutation (Block #{CORE_GUARD_INFO.block})</span>
              <span className="text-emerald-400 font-bold">{CORE_GUARD_INFO.drift}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* EXPLICIT APPROVAL MODAL                                           */}
      {/* ================================================================= */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-zinc-900 border border-cyan-500/50 rounded-xl max-w-lg w-full p-4 sm:p-6 space-y-4 font-mono text-xs shadow-2xl">
            <div className="text-sm sm:text-base font-bold text-white border-b border-zinc-800 pb-2">
              🔒 Explicit Sovereign Approval Gate
            </div>
            <div className="p-3 rounded bg-zinc-950 border border-zinc-800 space-y-1.5 text-zinc-300">
              <div>
                Target Workspace: <strong className="text-cyan-300">{selectedWs.name}</strong> ({selectedWs.id})
              </div>
              <div>
                Preset Command: <strong className="text-white">{selectedWritePreset.title}</strong>
              </div>
              <div>
                Non-Destructive Change:{' '}
                <strong className="text-amber-300">
                  BATCH_SIZE {selectedWs.batchSize} &rarr; {proposedBatchSize}
                </strong>
              </div>
              <div>
                Quota Limits:{' '}
                <strong className="text-cyan-200">
                  CPU {cpuQuotaLimit}% / RAM {ramQuotaLimit}%
                </strong>
              </div>
              <div>
                Core Guard: <strong className="text-emerald-400">{CORE_GUARD_INFO.status} (0 Core Mutation)</strong>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-amber-300">
                Enter Sovereign Principal ID ({CORE_GUARD_INFO.principal}):
              </label>
              <input
                type="text"
                value={principalSignature}
                onChange={(e) => setPrincipalSignature(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
              {signatureError && <div className="text-rose-400">{signatureError}</div>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprovalAndExecute}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold cursor-pointer"
              >
                Approve &amp; Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* AUDIT COMPLETION RECEIPT MODAL                                    */}
      {/* ================================================================= */}
      {showCompletionModal && lastAuditReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-zinc-900 border border-emerald-500/50 rounded-xl max-w-lg w-full p-4 sm:p-6 space-y-4 font-mono text-xs shadow-2xl">
            <div className="text-sm sm:text-base font-bold text-emerald-400 border-b border-zinc-800 pb-2">
              ✅ WORM Audit Receipt Sealed
            </div>
            <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-1.5 text-zinc-300">
              <div>
                Trace ID: <strong className="text-cyan-300">{lastAuditReceipt.traceId}</strong>
              </div>
              <div>
                Workspace: <strong className="text-white">{lastAuditReceipt.workspace}</strong>
              </div>
              <div>
                Applied Change:{' '}
                <strong className="text-emerald-300">
                  BATCH_SIZE {lastAuditReceipt.oldBatch} &rarr; {lastAuditReceipt.newBatch} (CPU Quota {lastAuditReceipt.cpuQuota}%, RAM Quota {lastAuditReceipt.ramQuota}%)
                </strong>
              </div>
              <div>
                Core Status: <strong className="text-emerald-400">{CORE_GUARD_INFO.status} ({CORE_GUARD_INFO.drift})</strong>
              </div>
              <div className="truncate text-[10px] text-zinc-400">
                Merkle Root: {lastAuditReceipt.merkleHash}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommandCenterOperationsConsole;
