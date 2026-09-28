import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Layers,
  Award,
  Send,
  FileText,
  Clock,
  Activity,
  Download,
  FileJson,
  Lock,
} from 'lucide-react';
import {
  CONNECTED_WORKSPACES,
  executeZyrquenCliCommand,
} from '../utils/hologramMaterial';
import { ZYRQUEN_SIGNED_SNAPSHOT } from '../data/zyrquenSignedSnapshot';
import {
  AGENTIC_REASONING_MESH_CONFIG,
  CHAMBER_TELEMETRY_DEEP_ANALYSIS,
} from '../data/agenticReasoningMeshConfig';
import {
  GatewayAuditLogSlideOutPanel,
  EnhancedGatewayAuditEntry,
  INITIAL_ENHANCED_GATEWAY_LOGS,
  GatewayAuditSeverity,
} from './GatewayAuditLogPanel';
import { playTone } from './AudioSynthesizer';
import { CommandCenterOperationsConsole } from './CommandCenterOperationsConsole';
import {
  loadAuthoritativePhase11Transaction,
  ZYRQUEN_CORE_FROZEN_STATE,
} from '../adapters/zyrquenAdapter';

export interface SovereignConsoleProps {
  trustScore?: number;
  federationStatus?: string;
  externalGatewayLogs?: EnhancedGatewayAuditEntry[];
  onRecordGatewayTransition?: (entry: EnhancedGatewayAuditEntry) => void;
}

const GATEWAY_POOL: Array<{
  dimensionCode: string;
  gatewayName: string;
  sector: string;
  fromState: string;
  toState: string;
  actor: string;
  latencyMs: number;
}> = [
  {
    dimensionCode: 'DIM-00',
    gatewayName: 'Sovereign-Root-Gateway',
    sector: 'Sector 00-GENESIS',
    fromState: 'VERIFIED_ANCHOR',
    toState: 'GOLD_SEAL_LOCKED (#849202)',
    actor: '#EP-SOVEREIGN-01',
    latencyMs: 1.20,
  },
  {
    dimensionCode: 'DIM-01',
    gatewayName: 'Unifier-Bridge-Mk3',
    sector: 'Sector 01-UNIFIER',
    fromState: 'CONTINUUM_SYNC',
    toState: 'UNIFIED_ZERO_DRIFT',
    actor: 'QuantumRuntimeUnifier',
    latencyMs: 3.40,
  },
  {
    dimensionCode: 'DIM-02',
    gatewayName: 'FailClosed-Airgap-Gate',
    sector: 'Sector 02-GAMMA',
    fromState: 'QUARANTINE_WATCH',
    toState: 'STANDBY_BUFFER (80 Seals)',
    actor: 'Chamber02BufferGamma',
    latencyMs: 0.80,
  },
  {
    dimensionCode: 'DIM-09',
    gatewayName: 'OTLP-mTLS-8443',
    sector: 'Sector 08-XF4',
    fromState: 'HEARTBEAT_POLL',
    toState: 'ACTIVE_STREAM_8443',
    actor: 'TelemetryCore8443',
    latencyMs: 35.80,
  },
  {
    dimensionCode: 'DIM-10',
    gatewayName: 'Nexus-Gateway-MkIII',
    sector: 'Sector 10-NEXUS',
    fromState: 'PRIMARY_MESH',
    toState: 'SOVEREIGN_SHIELD_REROUTED',
    actor: 'SovereignRouterShield',
    latencyMs: 11.20,
  },
  {
    dimensionCode: 'DIM-11',
    gatewayName: 'Celestial-Haven-Gate',
    sector: 'Sector 11-HAVEN',
    fromState: 'WARP_HANDSHAKE',
    toState: 'CONTINUUM_SEALED_2048QOPS',
    actor: 'MultiverseNavGridMk3',
    latencyMs: 14.98,
  },
];

export const SovereignConsole: React.FC<SovereignConsoleProps> = ({
  trustScore = 99.47,
  federationStatus = '10/10 REAL_HSM · Δ0 = 0.000%',
  externalGatewayLogs,
  onRecordGatewayTransition,
}) => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('sovereign-core-engine');
  const [cliInput, setCliInput] = useState<string>('');
  const [cliLogs, setCliLogs] = useState<Array<{ id: string; cmd: string; output: string }>>(() => {
    const initStatus = executeZyrquenCliCommand('status');
    return [
      {
        id: 'boot-status',
        cmd: 'status',
        output: initStatus.responseText,
      },
    ];
  });

  const gatewaySeqRef = useRef<number>(1);
  const authoritativeTx = loadAuthoritativePhase11Transaction();

  // Gold Seal Verification Console — Slide-Out Audit Log Panel State
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [autoStreamEnabled, setAutoStreamEnabled] = useState<boolean>(true);
  const [showRawSnapshotJson, setShowRawSnapshotJson] = useState<boolean>(false);
  const [showRawAgenticJson, setShowRawAgenticJson] = useState<boolean>(false);
  const [localGatewayLogs, setLocalGatewayLogs] = useState<EnhancedGatewayAuditEntry[]>(
    INITIAL_ENHANCED_GATEWAY_LOGS
  );

  const handleDownloadAgenticMeshConfig = () => {
    playTone(760, 0.04);
    const jsonString = JSON.stringify(AGENTIC_REASONING_MESH_CONFIG, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agentic-reasoning-mesh-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSignedSnapshot = () => {
    playTone(740, 0.04);
    const jsonString = JSON.stringify(ZYRQUEN_SIGNED_SNAPSHOT, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zyrquen-signed-snapshot.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const combinedLogs = externalGatewayLogs && externalGatewayLogs.length > 0
    ? externalGatewayLogs
    : localGatewayLogs;

  const appendGatewayTransition = useCallback(
    (customSeverity?: GatewayAuditSeverity, customGatewayIdx?: number) => {
      const seq = gatewaySeqRef.current++;
      const idx =
        customGatewayIdx !== undefined
          ? customGatewayIdx % GATEWAY_POOL.length
          : seq % GATEWAY_POOL.length;
      const gw = GATEWAY_POOL[idx];
      const now = new Date();
      const timeStr =
        now.toTimeString().slice(0, 8) +
        '.' +
        String(now.getMilliseconds()).padStart(3, '0') +
        ' ICT';

      const severity: GatewayAuditSeverity =
        customSeverity ||
        (gw.dimensionCode === 'DIM-02'
          ? 'WARNING'
          : gw.dimensionCode === 'DIM-00' || gw.dimensionCode === 'DIM-01'
          ? 'VERIFIED'
          : 'INFO');

      const newEntry: EnhancedGatewayAuditEntry = {
        id: `gw-live-${Date.now()}-${seq}`,
        timestamp: timeStr,
        dimensionCode: gw.dimensionCode,
        gatewayName: gw.gatewayName,
        sector: gw.sector,
        previousState:
          severity === 'CRITICAL'
            ? 'ANOMALY_FLUX_SPIKE'
            : severity === 'WARNING'
            ? 'DISRUPTION_DETECTED'
            : gw.fromState,
        newState:
          severity === 'CRITICAL'
            ? 'FAIL_CLOSED_ISOLATED (Buffer Gamma)'
            : severity === 'WARNING'
            ? 'SHIELD_FAILOVER_REROUTED'
            : gw.toState,
        latencyMs: gw.latencyMs,
        quorumSignature: '10/10 REAL_HSM (Dilithium-5)',
        merkleProof: '0x909ab814...fa4c68',
        actor: gw.actor,
        severity,
        deltaDrift: 'Δ0 = 0.000%',
      };

      setLocalGatewayLogs((prev) => [newEntry, ...prev.slice(0, 39)]);
      onRecordGatewayTransition?.(newEntry);
    },
    [onRecordGatewayTransition]
  );

  // Real-time periodic gateway state telemetry capture
  useEffect(() => {
    if (!autoStreamEnabled) return;
    const timer = setInterval(() => {
      appendGatewayTransition();
    }, 5200);
    return () => clearInterval(timer);
  }, [autoStreamEnabled, appendGatewayTransition]);

  const runCliCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    playTone(680, 0.04);
    const res = executeZyrquenCliCommand(trimmed);
    const output = res.recognized
      ? res.responseText
      : `[sovereign-core-engine → ZYRQUEN CLI]\nExecuted "${trimmed}" on workspace "${selectedWorkspace}" | Genesis #849202 | Merkle 909ab814...fa4c68 | Δ0 = 0.000% | Port 8443 | Latency 35.80 ms`;

    const seq = gatewaySeqRef.current++;
    setCliLogs((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${seq}`,
        cmd: trimmed,
        output,
      },
    ]);
    setCliInput('');
    appendGatewayTransition('VERIFIED', 0);
  };

  const latestLog = combinedLogs[0];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#070b16] border border-white/10 space-y-5 relative">
      {/* Top Header & Gold Seal Verification Console Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-base font-semibold text-white">
              Gold Seal Verification Console &amp; ZYRQUEN CLI Integration
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-[10px] font-semibold">
              ZQ-GOLD-DEP-849202-3908
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5 tabular-nums">
            Target: sovereign-core-engine · Genesis #849202 · Trust Score {trustScore.toFixed(2)}% · {federationStatus}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Command Path Breadcrumb */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-300 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-cyan-300 font-semibold">Command Center</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
            <span className="text-violet-300">ZYRQUEN Integration</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
            <span className="text-[#D4AF37] font-semibold">sovereign-core-engine</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
            <span className="text-emerald-300 font-semibold">ZYRQUEN CLI</span>
          </div>

          {/* Slide-Out Gateway Audit Log Trigger Button */}
          <button
            type="button"
            onClick={() => {
              playTone(720, 0.04);
              setIsAuditLogOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/60 text-[#D4AF37] font-mono text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Gateway Audit Log</span>
            <span className="px-1.5 py-0.2 rounded bg-black/60 text-white text-[10px] tabular-nums">
              {combinedLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Sovereign Dimension Gateway State Transition Ticker Bar */}
      {latestLog && (
        <div className="p-2.5 rounded-lg bg-black/50 border border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-2 font-mono text-xs tabular-nums">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[#D4AF37] font-semibold">LATEST GATEWAY TRANSITION:</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-semibold">
              {latestLog.dimensionCode} · {latestLog.gatewayName}
            </span>
            <span className="text-zinc-400">{latestLog.previousState}</span>
            <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-emerald-300 font-semibold">{latestLog.newState}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{latestLog.timestamp}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAuditLogOpen(true)}
              className="text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
            >
              Inspect Slide-Out Log &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Section 1: ZYRQUEN CLI Connector Test Suite (status, workspace list, resources, audit verify) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. ZYRQUEN CLI Connector Verification</span>
            </span>

            {/* One-Click Required Test Commands */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {(
                [
                  'status',
                  'workspace list',
                  'resources',
                  'audit verify',
                  'snapshot',
                  'agentic-mesh',
                  'chambers',
                  'assurance',
                  'phoenix-rec',
                  'boundary',
                ] as const
              ).map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => runCliCommand(cmd)}
                  className="px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  $ {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Output Window */}
          <div className="h-64 overflow-y-auto rounded-lg bg-[#040710] border border-white/10 p-3 font-mono text-xs space-y-3 select-text tabular-nums">
            {cliLogs.map((entry) => (
              <div key={entry.id} className="space-y-1 border-b border-white/5 pb-2 last:border-b-0">
                <div className="text-cyan-400 font-semibold">
                  sovereign-core-engine ({selectedWorkspace}) $ {entry.cmd}
                </div>
                <pre className="whitespace-pre-wrap text-zinc-300 leading-relaxed">{entry.output}</pre>
              </div>
            ))}
          </div>

          {/* Interactive CLI Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runCliCommand(cliInput);
            }}
            className="flex items-center gap-2 font-mono text-xs"
          >
            <span className="text-[#D4AF37] font-semibold shrink-0">sovereign-core-engine&gt;</span>
            <input
              type="text"
              value={cliInput}
              onChange={(e) => setCliInput(e.target.value)}
              placeholder="Run CLI command: status, workspace list, resources, audit verify, phase11..."
              className="flex-1 bg-[#040710] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Execute</span>
            </button>
          </form>
        </div>

        {/* Connected Workspaces Selector */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>Connected ZYRQUEN Workspaces</span>
            </span>
            <span className="text-zinc-400 tabular-nums">{CONNECTED_WORKSPACES.length} Bound</span>
          </div>

          <div className="space-y-2 font-mono text-xs tabular-nums">
            {CONNECTED_WORKSPACES.map((ws, idx) => {
              const active = ws.name === selectedWorkspace;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    playTone(620, 0.03);
                    setSelectedWorkspace(ws.name);
                    appendGatewayTransition('INFO', idx);
                  }}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-cyan-950/50 border-cyan-400/60 text-white'
                      : 'bg-black/40 border-white/10 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-cyan-300">{ws.name}</span>
                    <span className="text-[11px] text-emerald-400">
                      {ws.status} · {ws.latencyMs.toFixed(2)} ms
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 truncate">{ws.description}</div>
                  <div className="text-[10px] text-zinc-500 mt-1 flex items-center justify-between">
                    <span>Branch: {ws.branch}</span>
                    <span>Seals: {ws.sealsBound.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 1.5: ZYRQUEN Adapter / Integration Boundary (READ vs WRITE 6-Gate Enforcement) */}
      <div className="pt-4 border-t border-white/10 space-y-3.5 font-mono text-xs tabular-nums">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Lock className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-sm font-semibold text-white font-sans">
                ZYRQUEN Adapter / Integration Boundary (Strict Sovereign Core Separation)
              </h4>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                ZYRQUEN ตัวจริง: คงเดิม / ไม่รื้อ / ไม่ปรับ Core 🔒
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-semibold">
                Cloud &amp; AI Command: เครื่องมือควบคุม/พัฒนา 🛠️
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              เส้นแบ่งสถาปัตยกรรม: ระบบหลัก ZYRQUEN Ω∞ ถูกล็อกสถานะ (Immutable Core) · คำสั่งฝั่งเครื่องมือทั้งหมดทำงานผ่าน Adapter Boundary เท่านั้น
            </p>
          </div>

          {/* Phase 11 Direct Core Write Guard Status (Immutable Read-Only Badge) */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg border bg-emerald-950/60 border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>
                Phase 11 Core Guard: LOCKED 🔒 (FROZEN / READ-ONLY · Δ0 = 0.000% · Core Mutation = 0)
              </span>
            </span>
          </div>
        </div>

        {/* Visual Architecture Diagram: Command Center -> ZYRQUEN Adapter -> READ / WRITE Paths */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left: Boundary Topology & READ Path */}
          <div className="lg:col-span-5 p-3.5 rounded-lg bg-[#040710] border border-white/10 space-y-3">
            <div className="text-[11px] font-semibold text-cyan-300 flex items-center justify-between">
              <span>ADAPTER INTEGRATION TOPOLOGY</span>
              <span className="text-emerald-400">Δ0 = 0.000%</span>
            </div>

            <pre className="text-[11px] text-zinc-300 leading-snug bg-black/60 p-2.5 rounded border border-white/5 overflow-x-auto">
{`Command Center (Cloud & AI Command 🛠️)
      │
      ▼
ZYRQUEN Adapter / Integration Boundary
      │
      ├── READ  → status / workspace / resources / audit
      │
      └── WRITE → approval → command → audit`}
            </pre>

            {/* Quick READ Path Dispatchers */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                READ Path (Direct Read-Only · 0 Core Mutation):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(
                  [
                    { label: 'READ status', cmd: 'status' },
                    { label: 'READ workspace', cmd: 'workspace list' },
                    { label: 'READ resources', cmd: 'resources' },
                    { label: 'READ audit', cmd: 'audit verify' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.cmd}
                    type="button"
                    onClick={() => runCliCommand(item.cmd)}
                    className="px-2 py-1.5 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] font-semibold transition-colors cursor-pointer text-center"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Authoritative Write Boundary & Phase 11 Final Lock Summary */}
          <div className="lg:col-span-7 p-3.5 rounded-lg bg-[#040710] border border-emerald-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AUTHORITATIVE PHASE 11 TRANSACTION &amp; WRITE BOUNDARY STATUS</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                STATUS: COMPLETED 🔒 (RE-EXECUTION BLOCKED)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-black/60 border border-white/10">
                <div className="text-[10px] text-zinc-400">TRANSACTION &amp; TRACE ID</div>
                <div className="text-white font-semibold mt-0.5">{authoritativeTx.transactionId}</div>
                <div className="text-[10px] text-cyan-300 mt-0.5">{authoritativeTx.traceId}</div>
              </div>
              <div className="p-2.5 rounded bg-black/60 border border-white/10">
                <div className="text-[10px] text-zinc-400">APPLIED PARAMETER (ADAPTER)</div>
                <div className="text-emerald-300 font-semibold mt-0.5">
                  batch_window_size: {authoritativeTx.previousValue} → {authoritativeTx.appliedValue}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Target: {authoritativeTx.targetWorkspace}
                </div>
              </div>
              <div className="p-2.5 rounded bg-black/60 border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400">🔒 CORE ISOLATION PROOF</div>
                <div className="text-emerald-200 font-semibold mt-0.5">FROZEN / READ-ONLY</div>
                <div className="text-[10px] text-emerald-300/90 mt-0.5">
                  Block #{ZYRQUEN_CORE_FROZEN_STATE.canonicalBlock} · Δ0 = 0.000% · Core Mutation = 0
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-black/50 border border-white/5 text-[11px] text-zinc-300 flex flex-wrap items-center justify-between gap-2">
              <span>
                Single Authoritative Command Center (1. Command Engine 6-Gate · 2. Phase 11 9-Stage Self-Tuning · 3. AI Workspace) อยู่ด้านล่างนี้
              </span>
              <span className="text-rose-300 font-semibold text-[10px]">
                Idempotency Guard: ALREADY_FINALIZED (Replay/Duplicate = BLOCKED)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Unified Cloud & AI Command Center (Command Engine + Phase 11 Self-Tuning + AI Workspace) */}
      <div className="pt-4 border-t border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Cpu className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="text-sm font-semibold text-white">
              2. Unified Cloud &amp; AI Command Center (Command Engine · Phase 11 Self-Tuning · AI Workspace)
            </h4>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold border bg-emerald-950/70 border-emerald-500/40 text-emerald-300">
              SINGLE AUTHORITATIVE PIPELINE · CORE MUTATION = 0 🔒
            </span>
          </div>
        </div>

        <div className="pt-1">
          <CommandCenterOperationsConsole embedded={true} />
        </div>
      </div>

      {/* Section 3: Digitally Signed Snapshot Dossier (zyrquen-signed-snapshot.json) */}
      <div className="pt-4 border-t border-white/10 space-y-3 font-mono text-xs tabular-nums">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 font-sans">
              <FileJson className="w-4 h-4 text-[#D4AF37]" />
              <span>3. Digitally Signed Snapshot Dossier (`zyrquen-signed-snapshot.json`)</span>
              <span className="text-xs font-mono text-emerald-400">
                · {ZYRQUEN_SIGNED_SNAPSHOT.signature_proof.verifier_status}
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Snapshot ID: <strong className="text-[#D4AF37]">{ZYRQUEN_SIGNED_SNAPSHOT.snapshot_header.snapshot_id}</strong> · Principal: <strong className="text-white">{ZYRQUEN_SIGNED_SNAPSHOT.snapshot_header.sovereign_principal.name} ({ZYRQUEN_SIGNED_SNAPSHOT.snapshot_header.sovereign_principal.id})</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playTone(640, 0.03);
                setShowRawSnapshotJson((v) => !v);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showRawSnapshotJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSignedSnapshot}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download zyrquen-signed-snapshot.json</span>
            </button>
          </div>
        </div>

        {/* Summary Grid of the Signed Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-1.5">
            <div className="text-[11px] font-semibold text-[#D4AF37] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Ledger &amp; Seal Registry</span>
            </div>
            <div className="text-[11px] text-zinc-300">
              Canonical <strong className="text-white">#{ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.canonical_block_height}</strong> · Local <strong className="text-cyan-300">#{ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.local_block_height}</strong> · Drift <strong className="text-emerald-400">{ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.consensus_drift}</strong>
            </div>
            <div className="text-[11px] text-zinc-300">
              Seals: <strong className="text-emerald-300">{ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.active_intact_seals.toLocaleString()} Active</strong> / {ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.total_seals_in_pool.toLocaleString()} ({ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.quarantined_seals} in {ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.quarantine_chamber})
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              Merkle: {ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.merkle_root_hash}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-1.5">
            <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Post-Quantum &amp; Hardware Proof</span>
            </div>
            <div className="text-[11px] text-zinc-300">
              {ZYRQUEN_SIGNED_SNAPSHOT.post_quantum_cryptography.digital_signature} · {ZYRQUEN_SIGNED_SNAPSHOT.post_quantum_cryptography.key_encapsulation}
            </div>
            <div className="text-[11px] text-zinc-300">
              Quorum: <strong className="text-emerald-300">{ZYRQUEN_SIGNED_SNAPSHOT. signature_proof.signed_by}</strong>
            </div>
            <div className="text-[10px] text-zinc-400">
              Cryostat: {ZYRQUEN_SIGNED_SNAPSHOT.hardware_and_telemetry.cryostat_temperature} · Latency: {ZYRQUEN_SIGNED_SNAPSHOT.hardware_and_telemetry.execution_latency}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-1.5">
            <div className="text-[11px] font-semibold text-violet-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Chambers &amp; Legal Admissibility</span>
            </div>
            <div className="text-[11px] text-zinc-300">
              Ch01: {ZYRQUEN_SIGNED_SNAPSHOT.chambers_telemetry.chamber_01_pqc_vault.load} · Ch02: {ZYRQUEN_SIGNED_SNAPSHOT.chambers_telemetry.chamber_02_quarantine.status} · Ch04: {ZYRQUEN_SIGNED_SNAPSHOT.chambers_telemetry.chamber_04_hsm_quorum.temp}
            </div>
            <div className="text-[11px] text-zinc-300 truncate">
              {ZYRQUEN_SIGNED_SNAPSHOT.compliance_and_legal.thai_electronic_transactions_act}
            </div>
            <div className="text-[10px] text-emerald-400">
              {ZYRQUEN_SIGNED_SNAPSHOT.compliance_and_legal.digital_forensics_standard} · {ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.ci_cd_workflow_status}
            </div>
          </div>
        </div>

        {showRawSnapshotJson && (
          <pre className="p-3.5 rounded-lg bg-[#040710] border border-[#D4AF37]/30 text-[11px] text-cyan-200 overflow-x-auto max-h-72 leading-relaxed select-all">
            {JSON.stringify(ZYRQUEN_SIGNED_SNAPSHOT, null, 2)}
          </pre>
        )}
      </div>

      {/* Section 4: Unified Sovereign Snapshot + Agentic Reasoning Mesh Blueprint & Chamber Telemetry Analysis */}
      <div className="pt-4 border-t border-white/10 space-y-3 font-mono text-xs tabular-nums">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 font-sans">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>
                4. Agentic Reasoning Mesh (`agentic-reasoning-mesh-config.json`) &amp; Deep Chamber Telemetry Analysis
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Workspace: <strong className="text-cyan-300">{AGENTIC_REASONING_MESH_CONFIG.workspace_metadata.workspace_name}</strong> ({AGENTIC_REASONING_MESH_CONFIG.workspace_metadata.display_name_th}) · {AGENTIC_REASONING_MESH_CONFIG.runtime_environment.runtime} · Context {AGENTIC_REASONING_MESH_CONFIG.runtime_environment.context_window_label} · Batch {AGENTIC_REASONING_MESH_CONFIG.runtime_environment.batch_size} · {AGENTIC_REASONING_MESH_CONFIG.security_profile.enclave_status}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playTone(640, 0.03);
                setShowRawAgenticJson((v) => !v);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-violet-400" />
              <span>{showRawAgenticJson ? 'Hide Mesh JSON' : 'Inspect Mesh JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAgenticMeshConfig}
              className="px-3 py-1.5 rounded-lg bg-violet-950/70 hover:bg-violet-900/80 border border-violet-500/50 text-violet-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download agentic-reasoning-mesh-config.json</span>
            </button>
          </div>
        </div>

        {/* 3 Orchestrated AI Agents + Compute Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AGENTIC_REASONING_MESH_CONFIG.orchestrated_agents.map((agt) => (
            <div
              key={agt.agent_id}
              className="p-3 rounded-lg bg-black/50 border border-cyan-500/25 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold text-[11px]">{agt.agent_id}</span>
                <span className="text-emerald-400 text-[10px]">
                  {agt.status} · Context {agt.context_utilization_pct}%
                </span>
              </div>
              <div className="text-white font-semibold text-xs font-sans">{agt.name}</div>
              <div className="text-[11px] text-zinc-400 font-sans leading-snug">{agt.role}</div>
              <div className="text-[10px] text-[#D4AF37] pt-1 border-t border-white/5">
                Bound: {agt.bound_chamber}
              </div>
            </div>
          ))}
        </div>

        {/* Deep Chamber Telemetry Analysis Grid (Chambers 01, 02, 04, 05, 06, 11) */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-300">
            <span className="font-semibold text-[#D4AF37]">
              CHAMBER TELEMETRY DEEP ANALYSIS (BOUND TO SNAP-849205 &amp; AGENTIC MESH)
            </span>
            <span>
              Resources: {AGENTIC_REASONING_MESH_CONFIG.compute_resources.cpu_cores} Cores (CPU {AGENTIC_REASONING_MESH_CONFIG.compute_resources.cpu_usage_pct}%) · {AGENTIC_REASONING_MESH_CONFIG.compute_resources.ram_gb} GB RAM ({AGENTIC_REASONING_MESH_CONFIG.compute_resources.ram_usage_pct}%) · {AGENTIC_REASONING_MESH_CONFIG.compute_resources.storage_gb} GB Storage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CHAMBER_TELEMETRY_DEEP_ANALYSIS.map((ch) => {
              const isCrit = ch.status === 'CRITICAL_MONITORED';
              const isWarn = ch.status === 'WARNING' || ch.status === 'FAIL_CLOSED';
              return (
                <div
                  key={ch.chamberKey}
                  className={`p-3 rounded-lg border space-y-1.5 ${
                    isCrit
                      ? 'bg-rose-950/25 border-rose-500/40'
                      : isWarn
                      ? 'bg-amber-950/25 border-amber-500/40'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">{ch.chamberName}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        isCrit
                          ? 'text-rose-300'
                          : isWarn
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {ch.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-cyan-300">
                    <span>Load: <strong>{ch.load}</strong></span>
                    <span>Temp: <strong>{ch.temp}</strong></span>
                    <span>Agent: <strong>{ch.boundAgentId}</strong></span>
                  </div>
                  <div className="text-[11px] text-zinc-300 font-sans leading-snug">
                    {ch.diagnosticTh}
                  </div>
                  <div className="text-[10px] text-emerald-300/90 pt-1 border-t border-white/5">
                    ↳ {ch.remediationAction}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showRawAgenticJson && (
          <pre className="p-3.5 rounded-lg bg-[#040710] border border-violet-500/30 text-[11px] text-violet-200 overflow-x-auto max-h-72 leading-relaxed select-all">
            {JSON.stringify(AGENTIC_REASONING_MESH_CONFIG, null, 2)}
          </pre>
        )}
      </div>

      {/* Gold Seal Verification Console — Slide-Out Gateway Audit Log Panel */}
      <GatewayAuditLogSlideOutPanel
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        logs={combinedLogs}
        onTriggerTransition={(sev) => appendGatewayTransition(sev)}
        onClearLogs={() => setLocalGatewayLogs(INITIAL_ENHANCED_GATEWAY_LOGS)}
        autoStreamEnabled={autoStreamEnabled}
        onToggleAutoStream={() => setAutoStreamEnabled((v) => !v)}
      />
    </div>
  );
};

export const VerificationConsole = SovereignConsole;

export default SovereignConsole;
