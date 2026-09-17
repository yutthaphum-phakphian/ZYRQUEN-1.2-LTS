import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Activity,
  Terminal,
  Layers,
  Zap,
  Cpu,
  Server,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  FileCheck2,
  Play,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Download,
  Flame,
  Globe2,
  Gauge,
  Box,
  Crown,
  Grid3X3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DashboardView } from './DashboardView';
import { PulseView } from './PulseView';
import { ConsoleView } from './ConsoleView';
import { GovernanceHealthHeatmap } from './GovernanceHealthHeatmap';
import { FederationKnowledgeDriftHeatmap } from '../FederationKnowledgeDriftHeatmap';
import { MultiverseNavigationGridPanel } from '../MultiverseNavigationGridPanel';
import { HardwareSnapshot, ViewType } from '../../types';
import { SYSTEM_METADATA } from '../../data/canonicalData';
import { playAuditChime, playTone, playWarningTone } from '../AudioSynthesizer';
import { speakSystemAlert, getTTSConfig, toggleTTSEnabled } from '../../utils/textToSpeechService';
import { createTelemetrySnapshot } from '../../utils/telemetrySnapshot';

export type MultiverseViewMode =
  | 'tri-split'
  | 'dashboard-focus'
  | 'pulse-focus'
  | 'console-focus'
  | 'governance-heatmap'
  | 'federation-drift'
  | 'path-projection';

interface UnifiedMultiverseControlPanelProps {
  onNavigate: (view: ViewType) => void;
  onOpenCertificate: () => void;
  snapshots: HardwareSnapshot[];
  onAddHardwareSnapshot: (snap: HardwareSnapshot) => void;
  onAddSystemEvent: (
    type: any,
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'info' | 'warning' | 'critical' | 'success',
    statuteRef?: string,
    targetView?: string
  ) => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  isSystemActivityFrozen: boolean;
  onToggleFreezeSystemActivity?: () => void;
}

export const UnifiedMultiverseControlPanel: React.FC<UnifiedMultiverseControlPanelProps> = ({
  onNavigate,
  onOpenCertificate,
  snapshots,
  onAddHardwareSnapshot,
  onAddSystemEvent,
  isAudioActive,
  onToggleAudio,
  isSystemActivityFrozen,
  onToggleFreezeSystemActivity
}) => {
  const [activeMode, setActiveMode] = useState<MultiverseViewMode>('tri-split');
  const [ttsActive, setTtsActive] = useState<boolean>(() => getTTSConfig().enabled);
  const [isExecutingPhase121, setIsExecutingPhase121] = useState<boolean>(false);
  const [isExecutingPhase123, setIsExecutingPhase123] = useState<boolean>(false);
  const [activeCivilizationLog, setActiveCivilizationLog] = useState<string[]>([]);
  const [activeFederationLog, setActiveFederationLog] = useState<string[]>([]);
  const [warpSimulationSpeed, setWarpSimulationSpeed] = useState<number>(1.0);
  const [isWarpPaused, setIsWarpPaused] = useState<boolean>(false);

  const handleToggleTts = () => {
    const next = toggleTTSEnabled();
    setTtsActive(next);
    playTone(next ? 700 : 400, 0.05);
    if (next) {
      speakSystemAlert('Text-to-speech verbal warnings enabled', 'info', 'en');
    }
  };

  // Execute Phase 12.1 Civilization Intelligence Core Runtime
  const handleRunCivilizationCore = useCallback(() => {
    setIsExecutingPhase121(true);
    setActiveCivilizationLog(['🧠 Initializing Civilization Intelligence Core...']);
    playTone(600, 0.08, 'sine');

    const steps = [
      { delay: 400, log: '⚙️ Kernel Initialized: CIK-001 (Constitution v1.x • Trust Status: VERIFIED)' },
      { delay: 900, log: '📜 Constitution Bound: Supreme-Constitution (Enforcement: Phase-10.1 • Federation: Phase-10.3)' },
      { delay: 1400, log: '🚀 Engines Activated: 6 modules online (Cognition, Reasoning, Coordination, Memory, Decision, Execution)' },
      { delay: 2000, log: '🔒 Proof Verified: GRAPH-99201 bound to BLOCK-120001 (Compliance: Constitutional, Federation, Economic)' },
      { delay: 2600, log: '🪶 Ledger Published: CIV-FED-01 • Commit: 0xCIVILIZATION-INTELLIGENCE-VERIFIED' },
      { delay: 3000, log: '✅ Civilization Intelligence Core is now LIVE — Coordination Kernel operational.' }
    ];

    steps.forEach(({ delay, log }, idx) => {
      setTimeout(() => {
        setActiveCivilizationLog((prev) => [...prev, log]);
        playTone(650 + idx * 30, 0.04);
        if (idx === steps.length - 1) {
          setIsExecutingPhase121(false);
          playAuditChime();
          onAddSystemEvent(
            'CRYPTO',
            'Civilization Intelligence Core (Phase 12.1) Activated',
            'Kernel CIK-001 bound to Supreme Constitution with 6 sovereign engines operational and BLOCK-120001 sealed.',
            '0xCIVILIZATION-INTELLIGENCE-VERIFIED',
            'success',
            'Phase 12.1 Coordination Kernel & SSoT Invariant',
            'dashboard'
          );
        }
      }, delay);
    });
  }, [onAddSystemEvent]);

  // Execute Phase 12.3 Federation Intelligence Protocol Runtime
  const handleRunFederationProtocol = useCallback(() => {
    setIsExecutingPhase123(true);
    setActiveFederationLog(['🌍 Initializing Federation Intelligence Protocol v12.3...']);
    playTone(550, 0.08, 'sine');

    const steps = [
      { delay: 400, log: '🪪 Federation Identity Established: CIV-FED-001 (MAEW-CIV-TH • Constitution v1.1 • Kernel 12.1)' },
      { delay: 900, log: '🔒 Trust Mesh Integrity: 100% (Identity, Constitution, Evidence, Kernel, Agent Compliance: VERIFIED)' },
      { delay: 1500, log: '📡 Knowledge Exchange: PK-90001 (Origin: CIV-A • VerifiedBy: CIV-B, CIV-C • Trust=99.8%)' },
      { delay: 2100, log: '🧪 Simulation Result: Federated Economic Adjustment Consensus REACHED' },
      { delay: 2700, log: '📜 Ledger Published: CIV-FED-001 • Commit: 0xFEDERATION-INTELLIGENCE-VERIFIED' },
      { delay: 3100, log: '✅ Federation Intelligence Protocol v12.3 is now ACTIVE — Multi-Civilization Runtime operational.' }
    ];

    steps.forEach(({ delay, log }, idx) => {
      setTimeout(() => {
        setActiveFederationLog((prev) => [...prev, log]);
        playTone(600 + idx * 35, 0.04);
        if (idx === steps.length - 1) {
          setIsExecutingPhase123(false);
          playAuditChime();
          onAddSystemEvent(
            'COMPLIANCE',
            'Federation Intelligence Protocol v12.3 Activated',
            'Planetary Constitutional Intelligence Federation trust mesh established across CIV-FED-001.',
            '0xFEDERATION-INTELLIGENCE-VERIFIED',
            'success',
            'Phase 12.3 Multi-Civilization Runtime',
            'nexus'
          );
        }
      }, delay);
    });
  }, [onAddSystemEvent]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Multiverse Cockpit HUD Banner */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1424]/95 via-[#080d1a]/90 to-[#07080F] border border-cyan-500/25 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/15 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>UNIFIED MULTIVERSE CONTROL COCKPIT</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                TRI-STREAM INTEGRATED
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono">
                BLOCK #849202 (14,902 SEALS)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-center gap-3">
              <span>Unified Multiverse Control Panel</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 font-mono">
                Live Executive • Pulse Telemetry • Sovereign CLI
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-4xl font-sans">
              Single-screen sovereign nexus integrating high-level executive command, real-time hardware telemetry streams, and low-level CLI execution. Toggle seamlessly between views or run full-spectrum tri-stream monitoring.
            </p>
          </div>

          {/* Quick Action Buttons & Protocols */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunCivilizationCore}
              disabled={isExecutingPhase121}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition cursor-pointer disabled:opacity-50"
              title="Activate Phase 12.1 Civilization Intelligence Core"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isExecutingPhase121 ? 'animate-spin' : ''}`} />
              <span>{isExecutingPhase121 ? 'INITIALIZING CIK-001...' : 'PHASE 12.1 CIK CORE'}</span>
            </button>

            <button
              onClick={handleRunFederationProtocol}
              disabled={isExecutingPhase123}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition cursor-pointer disabled:opacity-50"
              title="Activate Phase 12.3 Federation Intelligence Protocol"
            >
              <Globe2 className={`w-3.5 h-3.5 ${isExecutingPhase123 ? 'animate-pulse' : ''}`} />
              <span>{isExecutingPhase123 ? 'ESTABLISHING FED...' : 'PHASE 12.3 FED PROTOCOL'}</span>
            </button>

            <button
              onClick={handleToggleTts}
              className={`px-3.5 py-2 rounded-xl border font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
                ttsActive
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white'
              }`}
              title="Toggle Low-Latency Text-to-Speech Verbal Warning System"
            >
              {ttsActive ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              <span>TTS: {ttsActive ? 'ENABLED' : 'DISABLED'}</span>
            </button>
          </div>
        </div>

        {/* Runtime Sequence Execution Logs (If triggered) */}
        {(activeCivilizationLog.length > 0 || activeFederationLog.length > 0) && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {activeCivilizationLog.length > 0 && (
              <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 space-y-1">
                <div className="font-bold text-purple-300 flex items-center justify-between">
                  <span>CIVILIZATION INTELLIGENCE (PHASE 12.1)</span>
                  <button
                    onClick={() => setActiveCivilizationLog([])}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    CLEAR
                  </button>
                </div>
                <div className="space-y-0.5 text-[11px] text-zinc-300 max-h-32 overflow-y-auto custom-scrollbar">
                  {activeCivilizationLog.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            )}

            {activeFederationLog.length > 0 && (
              <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-1">
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <span>FEDERATION PROTOCOL (PHASE 12.3)</span>
                  <button
                    onClick={() => setActiveFederationLog([])}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300"
                  >
                    CLEAR
                  </button>
                </div>
                <div className="space-y-0.5 text-[11px] text-zinc-300 max-h-32 overflow-y-auto custom-scrollbar">
                  {activeFederationLog.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warp Simulation Controller Bar */}
      <div className="p-4 rounded-2xl bg-[#070a12] border border-[#D4AF37]/50 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌌</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#D4AF37] tracking-wider">
                  WARP SIMULATION CONTROLLER
                </span>
                <span className="px-2 py-0.2 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-400 font-bold text-[9px]">
                  {isWarpPaused ? 'PAUSED' : 'ACTIVE STREAM'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Adjust the multiverse simulation velocity and qOps warp flow rate for all civilization sectors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                playTone(isWarpPaused ? 700 : 400, 0.02);
                setIsWarpPaused(!isWarpPaused);
              }}
              className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isWarpPaused
                  ? 'bg-amber-950/60 border border-[#D4AF37] text-[#D4AF37]'
                  : 'bg-emerald-950/60 border border-emerald-500 text-emerald-400'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isWarpPaused ? 'RESUME FLOW' : 'PAUSE FLOW'}</span>
            </button>

            <button
              onClick={() => {
                playTone(450, 0.02);
                setWarpSimulationSpeed((prev) => Math.max(0.2, Number((prev - 0.2).toFixed(1))));
              }}
              className="px-2.5 py-1.5 bg-[#0a0f1e] border border-zinc-700 hover:border-zinc-500 rounded text-zinc-300 transition-colors cursor-pointer"
              title="Slow down simulation flow"
            >
              REWIND -0.2x
            </button>

            <div className="px-3 py-1.5 bg-[#0a0f1e] border border-cyan-500/40 rounded flex items-center gap-1.5">
              <span className="text-zinc-400 text-[10px]">WARP VELOCITY:</span>
              <strong className="text-cyan-300 font-bold text-sm">{warpSimulationSpeed}x</strong>
            </div>

            <button
              onClick={() => {
                playTone(750, 0.02);
                setWarpSimulationSpeed((prev) => Math.min(3.0, Number((prev + 0.2).toFixed(1))));
              }}
              className="px-2.5 py-1.5 bg-[#0a0f1e] border border-zinc-700 hover:border-zinc-500 rounded text-zinc-300 transition-colors cursor-pointer"
              title="Speed up simulation flow"
            >
              SPEED +0.2x
            </button>

            <button
              onClick={() => {
                playAuditChime();
                setWarpSimulationSpeed(1.0);
              }}
              className="px-2.5 py-1.5 bg-[#0a0f1e] border border-zinc-700 hover:border-zinc-500 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              RESET 1.0x
            </button>
          </div>
        </div>

        {/* Warp Velocity Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={warpSimulationSpeed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setWarpSimulationSpeed(val);
              playTone(500 + val * 120, 0.01);
            }}
            className="w-full h-1.5 bg-[#0a0f1e] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>0.2x (Sub-Quantum Rewind)</span>
            <span>1.0x (Standard Continuum Flow)</span>
            <span>2.0x (HyperWarp Burst)</span>
            <span>3.0x (Maximum Luminal Warp)</span>
          </div>
        </div>
      </div>

      {/* Multiverse Stream Switcher Toolbar */}
      <div className="p-3 rounded-2xl bg-black/40 border border-white/8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-zinc-400 px-2">STREAM LAYOUT:</span>

          <button
            onClick={() => {
              setActiveMode('tri-split');
              playTone(600, 0.04);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'tri-split'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tri-Split Cockpit</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('dashboard-focus');
              playTone(600, 0.04);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'dashboard-focus'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Executive Dashboard Stream</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('pulse-focus');
              playTone(600, 0.04);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'pulse-focus'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry Pulse Stream</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('console-focus');
              playTone(600, 0.04);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'console-focus'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sovereign CLI Stream</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('governance-heatmap');
              playTone(600, 0.04);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'governance-heatmap'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>14,902 Seals Heatmap</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('federation-drift');
              playTone(650, 0.04);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'federation-drift'
                ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Knowledge Drift Heatmap & Runtimes</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('path-projection');
              playTone(680, 0.04);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'path-projection'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multiverse Nav & D3 Path Projection</span>
          </button>
        </div>

        {/* Action shortcut to seal snapshot */}
        <button
          onClick={() => {
            const snap = createTelemetrySnapshot(
              { core0: 42, core1: 39, core2: 44, core3: 38 },
              snapshots.length,
              snapshots[0]?.sealedHash
            );
            onAddHardwareSnapshot(snap);
            playAuditChime();
          }}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>CAPTURE SNAPSHOT</span>
        </button>
      </div>

      {/* Dynamic Content Display based on selected Multiverse Mode */}
      {activeMode === 'tri-split' && (
        <div className="space-y-6">
          {/* Top Tri-Stream Summary Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stream 1: Executive KPI Panel */}
            <div className="p-5 rounded-[24px] bg-black/40 border border-white/8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-cyan-300">
                  <Crown className="w-4 h-4 text-cyan-400" />
                  <span>STREAM 1: EXECUTIVE SSoT</span>
                </div>
                <button
                  onClick={() => setActiveMode('dashboard-focus')}
                  className="text-[10px] text-zinc-400 hover:text-white font-mono"
                >
                  EXPAND &rarr;
                </button>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Canonical Merkle:</span>
                  <span className="text-cyan-300 font-bold">909ab814...fa4c68</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Genesis Block:</span>
                  <span className="text-emerald-400 font-bold">#849202 (14,902 Seals)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Zero-Trust Mutation:</span>
                  <span className="text-purple-300 font-bold">0 (READ-ONLY LOCKED)</span>
                </div>
              </div>
            </div>

            {/* Stream 2: Hardware Telemetry Heartbeat */}
            <div className="p-5 rounded-[24px] bg-black/40 border border-white/8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-emerald-300">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>STREAM 2: TELEMETRY PULSE</span>
                </div>
                <button
                  onClick={() => setActiveMode('pulse-focus')}
                  className="text-[10px] text-zinc-400 hover:text-white font-mono"
                >
                  EXPAND &rarr;
                </button>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Cryostat Subzero:</span>
                  <span className="text-cyan-300 font-bold">12.4 mK (Nominal)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Quantum Coherence:</span>
                  <span className="text-emerald-400 font-bold">99.97% Qubit Fidelity</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Throughput QOps:</span>
                  <span className="text-indigo-300 font-bold">842.6 QOps/s</span>
                </div>
              </div>
            </div>

            {/* Stream 3: Sovereign Console CLI */}
            <div className="p-5 rounded-[24px] bg-black/40 border border-white/8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-amber-300">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>STREAM 3: COMMAND CLI</span>
                </div>
                <button
                  onClick={() => setActiveMode('console-focus')}
                  className="text-[10px] text-zinc-400 hover:text-white font-mono"
                >
                  EXPAND &rarr;
                </button>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Authority:</span>
                  <span className="text-amber-300 font-bold">OMEGA-1 SUPREME (#EP-01)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Crypto Standard:</span>
                  <span className="text-cyan-300 font-bold">NIST FIPS 204 (Dilithium-5)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-zinc-400">Statutory Seal:</span>
                  <span className="text-emerald-400 font-bold">ETDA Sec 9/26/28 Bound</span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Split Layout: Dashboard on Top, Console & Pulse Below */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300 px-1">
                <span>TELEMETRY STREAM VIEW</span>
                <span className="text-[10px] text-zinc-500">LIVE FEED</span>
              </div>
              <PulseView
                snapshots={snapshots}
                onAddHardwareSnapshot={onAddHardwareSnapshot}
                onAddSystemEvent={onAddSystemEvent}
                isSystemActivityFrozen={isSystemActivityFrozen}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300 px-1">
                <span>SOVEREIGN CLI CONSOLE VIEW</span>
                <span className="text-[10px] text-zinc-500">INTERACTIVE TERMINAL</span>
              </div>
              <ConsoleView
                onCaptureSnapshot={onAddHardwareSnapshot}
                onNavigate={onNavigate}
                snapshots={snapshots}
                snapshotsCount={snapshots.length}
              />
            </div>
          </div>
        </div>
      )}

      {activeMode === 'dashboard-focus' && (
        <DashboardView onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      )}

      {activeMode === 'pulse-focus' && (
        <PulseView
          snapshots={snapshots}
          onAddHardwareSnapshot={onAddHardwareSnapshot}
          onAddSystemEvent={onAddSystemEvent}
          isSystemActivityFrozen={isSystemActivityFrozen}
        />
      )}

      {activeMode === 'console-focus' && (
        <ConsoleView
          onCaptureSnapshot={onAddHardwareSnapshot}
          onNavigate={onNavigate}
          snapshots={snapshots}
          snapshotsCount={snapshots.length}
        />
      )}

      {activeMode === 'governance-heatmap' && (
        <GovernanceHealthHeatmap
          onNavigateToView={onNavigate}
          onAddSystemEvent={onAddSystemEvent}
        />
      )}

      {activeMode === 'federation-drift' && (
        <FederationKnowledgeDriftHeatmap />
      )}

      {activeMode === 'path-projection' && (
        <div className="space-y-6">
          <MultiverseNavigationGridPanel
            snapshots={snapshots}
            onAddSystemEvent={onAddSystemEvent}
            showEmbeddedPathProjection={true}
          />
        </div>
      )}
    </div>
  );
};
