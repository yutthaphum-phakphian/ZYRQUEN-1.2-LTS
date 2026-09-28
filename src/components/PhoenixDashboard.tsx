import React, { useState } from 'react';
import {
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Activity,
  Sparkles,
  Gauge,
  Zap,
  Share2,
  Waves,
  Brain,
  Flame,
} from 'lucide-react';
import {
  ChaosRuntimeBlock,
  HealingStatusType,
  PhoenixRecoveryPhase,
} from '../hooks/useChaosResilience';
import {
  QuantarisResilienceEvaluation,
  computeQuantarisResilienceScore,
} from '../utils/hologramMaterial';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface PhoenixDashboardProps {
  runtimeBlocks: ChaosRuntimeBlock[];
  healingStatus: HealingStatusType;
  recoveryPhase?: PhoenixRecoveryPhase;
  latencyMs?: number;
  healingRatePct?: number;
  stabilityIndexPct?: number;
  latencyHistory?: number[];
  resilienceEval?: QuantarisResilienceEvaluation;
  onTriggerAutoHeal?: () => void;
  onTriggerHeal?: () => void;
}

const PHOENIX_PHASES: Array<{
  id: PhoenixRecoveryPhase;
  code: string;
  title: string;
  desc: string;
}> = [
  {
    id: 'PHASE_1_DETECTION',
    code: 'Phase-1',
    title: 'Detection',
    desc: 'Quantum Telemetry Hooks · Radar Ping · Glitch Overlay',
  },
  {
    id: 'PHASE_2_RESPONSE',
    code: 'Phase-2',
    title: 'Response',
    desc: 'Sovereign Router Shield · Auto-Healing Blocks',
  },
  {
    id: 'PHASE_3_RECOVERY',
    code: 'Phase-3',
    title: 'Recovery',
    desc: 'Phoenix Dashboard G16 · Cosmic Bloom Layer',
  },
  {
    id: 'PHASE_4_ASSURANCE',
    code: 'Phase-4',
    title: 'Assurance',
    desc: 'Gold Seal Verification · AI Benchmark Overlay',
  },
];

const ROUTER_SHIELD_PATHS = [
  {
    id: 'rt-01',
    sector: 'Sector 00 ↔ 01',
    primaryGateway: 'Sovereign-Root-Gateway',
    shieldFailover: 'Unifier-Bridge-Mk3',
    latencyMs: 1.20,
    status: 'LOCKED_ZERO_DRIFT',
  },
  {
    id: 'rt-02',
    sector: 'Sector 08-XF4 ↔ 10',
    primaryGateway: 'OTLP-mTLS-8443',
    shieldFailover: 'Nexus-Gateway-MkIII',
    latencyMs: 35.80,
    status: 'SHIELD_ARMED',
  },
  {
    id: 'rt-03',
    sector: 'Sector 02-GAMMA',
    primaryGateway: 'FailClosed-Airgap-Gate',
    shieldFailover: 'Chamber 02 Buffer Gamma [STANDBY]',
    latencyMs: 0.80,
    status: 'ISOLATED_80_SEALS',
  },
];

const AI_BENCHMARK_AGENTS = [
  {
    id: 'ag-1',
    agentName: 'Arbitrator Prime (OMEGA-1)',
    role: 'Byzantine Consensus & 16-Stage Court Verification',
    reasoningScore: 99.94,
    latencyMs: 11.4,
    status: 'CONSENSUS_<20MS',
  },
  {
    id: 'ag-2',
    agentName: 'Sentry Seraph',
    role: 'Adversarial Injection & Threat Neutralization (<35ms)',
    reasoningScore: 99.91,
    latencyMs: 13.8,
    status: 'ACTIVE_SHIELD',
  },
  {
    id: 'ag-3',
    agentName: 'Cipher Warden',
    role: 'FIPS 203/204 Enclave & Zero-Drift Guard',
    reasoningScore: 99.89,
    latencyMs: 14.2,
    status: 'ENCLAVE_READY',
  },
  {
    id: 'ag-4',
    agentName: 'Chronos Overseer',
    role: 'PHOENIX-AUTO-HEAL Hot-Swap Microkernel (<85ms)',
    reasoningScore: 99.86,
    latencyMs: 16.5,
    status: 'HOT_SWAP_ARMED',
  },
];

export const PhoenixDashboard: React.FC<PhoenixDashboardProps> = ({
  runtimeBlocks,
  healingStatus,
  recoveryPhase = 'PHASE_4_ASSURANCE',
  latencyMs = 35.80,
  healingRatePct = 99.4,
  stabilityIndexPct = 99.8,
  latencyHistory = [35.8, 35.6, 36.1, 35.9, 35.7, 35.8, 36.0, 35.8, 35.5, 35.8],
  resilienceEval,
  onTriggerAutoHeal,
  onTriggerHeal,
}) => {
  const isHealing =
    healingStatus === 'GLITCH_ISOLATING' || healingStatus === 'BLOOM_AUTO_HEALING';

  // Allow interactive stress testing of the Resilience Score formula f(Latency, Healing Rate, Stability Index)
  const [simOverride, setSimOverride] = useState<null | {
    latency: number;
    healing: number;
    stability: number;
    scenarioName: string;
  }>(null);

  const [activeVisualizerTab, setActiveVisualizerTab] = useState<
    'BLOCKS' | 'DISTORTION_VISUALIZER' | 'ROUTER_SHIELD' | 'AI_BENCHMARK' | 'ASSURANCE_BLUEPRINT'
  >('ASSURANCE_BLUEPRINT');

  const activeLatency = simOverride ? simOverride.latency : latencyMs;
  const activeHealingRate = simOverride ? simOverride.healing : healingRatePct;
  const activeStability = simOverride ? simOverride.stability : stabilityIndexPct;

  const computedEval =
    simOverride || !resilienceEval
      ? computeQuantarisResilienceScore(activeLatency, activeHealingRate, activeStability)
      : resilienceEval;

  const handleHealClick = () => {
    setSimOverride(null);
    playTone(680, 0.05);
    if (onTriggerAutoHeal) onTriggerAutoHeal();
    else if (onTriggerHeal) onTriggerHeal();
    setTimeout(() => playAuditChime(), 950);
  };

  // SVG Gauge circumference for r=38
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, computedEval.score)) / 100) * circumference;

  // Build SVG polyline points for Latency Monitor Line
  const maxLat = Math.max(150, ...latencyHistory);
  const minLat = 20;
  const polyPoints = latencyHistory
    .map((val, idx) => {
      const x = (idx / Math.max(1, latencyHistory.length - 1)) * 220;
      const y = 48 - ((val - minLat) / (maxLat - minLat)) * 40;
      return `${x.toFixed(1)},${Math.max(4, Math.min(48, y)).toFixed(1)}`;
    })
    .join(' ');

  // Build Sine-Wave Distortion Pulse points for Chaos Distortion Visualizer
  const sineWavePoints = Array.from({ length: 36 }, (_, idx) => {
    const x = (idx / 35) * 320;
    const amp = isHealing || simOverride ? 16 : 6;
    const freq = isHealing || simOverride ? 0.55 : 0.28;
    const y = 28 + Math.sin(idx * freq) * amp;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#070b16] border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Quantaris Phoenix Dashboard G16 &amp; Chaos-Resilience Runtime
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5 tabular-nums">
            Resilience Score = f(Latency, Healing Rate, Stability Index) · Auto-Healing SLA &lt; 142.00 ms
            {simOverride ? ` · Stress Scenario: ${simOverride.scenarioName}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Chaos Simulation Engine Stress-Test Scenarios */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => {
                playTone(420, 0.03);
                setSimOverride({
                  latency: 138.0,
                  healing: 42.0,
                  stability: 44.0,
                  scenarioName: 'Multiverse Decoherence Surge (Critical 0–49)',
                });
              }}
              className="px-2 py-0.5 rounded text-[10px] text-rose-300 hover:bg-rose-950/60 cursor-pointer"
              title="Chaos Simulation: Critical Tier (0–49)"
            >
              Critical
            </button>
            <button
              type="button"
              onClick={() => {
                playTone(520, 0.03);
                setSimOverride({
                  latency: 88.0,
                  healing: 64.0,
                  stability: 66.0,
                  scenarioName: 'Gateway Route Disruption (Moderate 50–74)',
                });
              }}
              className="px-2 py-0.5 rounded text-[10px] text-amber-300 hover:bg-amber-950/60 cursor-pointer"
              title="Chaos Simulation: Moderate Tier (50–74)"
            >
              Moderate
            </button>
            <button
              type="button"
              onClick={() => {
                playTone(620, 0.03);
                setSimOverride({
                  latency: 48.0,
                  healing: 82.0,
                  stability: 84.0,
                  scenarioName: 'Router Shield Failover (Strong 75–89)',
                });
              }}
              className="px-2 py-0.5 rounded text-[10px] text-cyan-300 hover:bg-cyan-950/60 cursor-pointer"
              title="Chaos Simulation: Strong Tier (75–89)"
            >
              Strong
            </button>
            <button
              type="button"
              onClick={() => {
                playTone(740, 0.03);
                setSimOverride(null);
              }}
              className="px-2 py-0.5 rounded text-[10px] text-violet-300 hover:bg-violet-950/60 cursor-pointer"
              title="Restore Sovereign Verified Tier (90–100)"
            >
              Sovereign (99.6)
            </button>
          </div>

          <button
            type="button"
            disabled={isHealing}
            onClick={handleHealClick}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isHealing ? 'animate-spin' : ''}`} />
            <span>{isHealing ? 'Phoenix Healing (142ms)...' : 'Trigger Phoenix Recovery'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Quantaris Resilience Visualization Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
        {/* 1. Resilience Score Gauge */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="7"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="transparent"
                stroke={computedEval.accentHex}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-bold text-white">{computedEval.score.toFixed(1)}</span>
              <span className="text-[9px] text-zinc-400">/ 100</span>
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span className="truncate">RESILIENCE GAUGE</span>
            </div>
            <div
              className="font-semibold text-xs truncate"
              style={{ color: computedEval.accentHex }}
            >
              {computedEval.tierLabel}
            </div>
            <div className="text-[10px] text-zinc-400">
              0–49 Red · 50–74 Amber · 75–89 Cyan · 90–100 Violet
            </div>
          </div>
        </div>

        {/* 2. Healing Rate Bar */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>HEALING RATE BAR</span>
            </span>
            <span className="text-sm font-bold text-cyan-300">{activeHealingRate.toFixed(1)}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(8, activeHealingRate))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Auto-Heal SLA: 142.00 ms</span>
            <span className="text-emerald-400">6/6 Blocks Armed</span>
          </div>
        </div>

        {/* 3. Latency Monitor Line */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>LATENCY MONITOR LINE</span>
            </span>
            <span className="text-sm font-bold text-emerald-300">{activeLatency.toFixed(2)} ms</span>
          </div>

          <svg className="w-full h-12 overflow-visible" viewBox="0 0 220 52">
            <line
              x1="0"
              y1="12"
              x2="220"
              y2="12"
              stroke="rgba(245,158,11,0.25)"
              strokeDasharray="3 3"
            />
            <polyline fill="none" stroke="#06B6D4" strokeWidth="2" points={polyPoints} />
          </svg>

          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Port 8443 Stream</span>
            <span>SLA Ceiling: 142.00 ms</span>
          </div>
        </div>

        {/* 4. Stability Index Orb & AI Benchmark Overlay */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <div
              className={`w-12 h-12 rounded-full border border-violet-400/60 flex items-center justify-center transition-transform ${
                activeStability < 85 ? 'animate-bounce' : 'animate-pulse'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 35% 35%, rgba(139,92,246,0.65), rgba(6,182,212,0.25) 65%, transparent)',
                boxShadow: `0 0 18px ${computedEval.accentHex}55`,
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="text-[11px] text-zinc-400">STABILITY INDEX ORB</div>
            <div className="text-sm font-bold text-violet-300">{activeStability.toFixed(1)}%</div>
            <div className="text-[10px] text-zinc-400 truncate">
              AI Benchmark: 99.88% Reasoning
            </div>
          </div>
        </div>
      </div>

      {/* 4-Phase Phoenix Recovery Pipeline Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs">
        {PHOENIX_PHASES.map((ph) => {
          const isCurrent = recoveryPhase === ph.id;
          return (
            <div
              key={ph.id}
              className={`p-2.5 rounded-lg border transition-colors ${
                isCurrent
                  ? 'bg-violet-950/50 border-violet-400/60 text-white'
                  : 'bg-black/30 border-white/8 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold">
                  {ph.code}: {ph.title}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">{ph.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Sub-Module Switcher: Auto-Healing Blocks / Chaos Distortion Visualizer / Sovereign Router Shield / AI Benchmark Overlay */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-xs">
        <button
          type="button"
          onClick={() => {
            playTone(620, 0.03);
            setActiveVisualizerTab('BLOCKS');
          }}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
            activeVisualizerTab === 'BLOCKS'
              ? 'bg-cyan-950/70 border-cyan-400/60 text-white font-semibold'
              : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto-Healing Runtime Blocks (6)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(650, 0.03);
            setActiveVisualizerTab('DISTORTION_VISUALIZER');
          }}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
            activeVisualizerTab === 'DISTORTION_VISUALIZER'
              ? 'bg-violet-950/70 border-violet-400/60 text-white font-semibold'
              : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-violet-400" />
          <span>Chaos Distortion Visualizer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(680, 0.03);
            setActiveVisualizerTab('ROUTER_SHIELD');
          }}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
            activeVisualizerTab === 'ROUTER_SHIELD'
              ? 'bg-emerald-950/70 border-emerald-400/60 text-white font-semibold'
              : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sovereign Router Shield</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(710, 0.03);
            setActiveVisualizerTab('AI_BENCHMARK');
          }}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
            activeVisualizerTab === 'AI_BENCHMARK'
              ? 'bg-amber-950/70 border-amber-400/60 text-white font-semibold'
              : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Benchmark Overlay</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(740, 0.03);
            setActiveVisualizerTab('ASSURANCE_BLUEPRINT');
          }}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
            activeVisualizerTab === 'ASSURANCE_BLUEPRINT'
              ? 'bg-emerald-950/70 border-[#D4AF37]/70 text-white font-semibold'
              : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>5-Layer Assurance Blueprint</span>
        </button>
      </div>

      {/* Tab 1: Auto-Healing Runtime Blocks Grid */}
      {activeVisualizerTab === 'BLOCKS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
          {runtimeBlocks.map((blk) => {
            const isGlitch = blk.status === 'GLITCH_DETECTED';
            const isRecovering = blk.status === 'AUTO_HEALING';
            return (
              <div
                key={blk.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isGlitch
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    : isRecovering
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-black/40 border-white/8 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300">{blk.blockCode}</span>
                  <span className="text-[11px] flex items-center gap-1">
                    {isGlitch ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{blk.status}</span>
                  </span>
                </div>
                <div className="text-zinc-100 font-medium mt-1 truncate">{blk.moduleName}</div>
                <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                  <span>{blk.chamberRef}</span>
                  <span>·</span>
                  <span>Integrity {blk.integrityPct.toFixed(2)}%</span>
                  <span>·</span>
                  <span className="text-emerald-300">{blk.recoveryMs.toFixed(1)}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Chaos Distortion Visualizer (Glitch Overlay + Cosmic Bloom Layer + Sine-Wave Distortion Pulse) */}
      {activeVisualizerTab === 'DISTORTION_VISUALIZER' && (
        <div className="p-4 rounded-xl bg-black/50 border border-violet-500/30 space-y-3 font-mono text-xs tabular-nums">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-violet-300 font-semibold">
              QUANTARIS CHAOS DISTORTION VISUALIZER (GLITCH OVERLAY + COSMIC BLOOM + SINE PULSE)
            </span>
            <span className="text-emerald-400">
              Particle Stream Overlay: ACTIVE · Δ0 = 0.000%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-1">
              <div className="text-cyan-300 font-semibold">1. Glitch Overlay</div>
              <div className="text-[11px] text-zinc-300">
                Visualizes runtime block instability prior to sub-142ms isolation in Chamber 02 Buffer Gamma.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-1">
              <div className="text-violet-300 font-semibold">2. Cosmic Bloom Layer</div>
              <div className="text-[11px] text-zinc-300">
                Cyan-Violet hologram glow confirming autonomous self-repair and Merkle root re-verification.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-1">
              <div className="text-[#D4AF37] font-semibold">3. Distortion Sine Pulse</div>
              <div className="text-[11px] text-zinc-300">
                Harmonic phase-lock waveform stabilizing quantum coherence at 99.97% (14.98 mK).
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#040710] border border-cyan-500/20">
            <svg className="w-full h-14 overflow-visible" viewBox="0 0 320 56">
              <polyline
                fill="none"
                stroke={computedEval.accentHex}
                strokeWidth="2.5"
                points={sineWavePoints}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Tab 3: Sovereign Router Shield (Federation Traffic Reroute Table) */}
      {activeVisualizerTab === 'ROUTER_SHIELD' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
          {ROUTER_SHIELD_PATHS.map((rt) => (
            <div key={rt.id} className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold">{rt.sector}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                  {rt.status}
                </span>
              </div>
              <div className="text-[11px] text-zinc-300">
                Primary: <strong className="text-white">{rt.primaryGateway}</strong>
              </div>
              <div className="text-[11px] text-zinc-400">
                Shield Failover: <strong className="text-violet-300">{rt.shieldFailover}</strong>
              </div>
              <div className="text-[10px] text-emerald-400">
                Reroute Latency: {rt.latencyMs.toFixed(2)} ms · Zero Packet Loss
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: AI Benchmark Overlay (Multi-Agent Reasoning Performance Hologram) */}
      {activeVisualizerTab === 'AI_BENCHMARK' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs tabular-nums">
          {AI_BENCHMARK_AGENTS.map((ag) => (
            <div key={ag.id} className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#D4AF37] font-semibold">{ag.agentName}</span>
                <span className="text-emerald-400 font-bold">{ag.reasoningScore}%</span>
              </div>
              <div className="text-[11px] text-zinc-300">{ag.role}</div>
              <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Inference: {ag.latencyMs.toFixed(1)} ms</span>
                <span className="text-cyan-300">{ag.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Quantaris 5-Layer Resilience Assurance Layer Blueprint & 5-Phase Cycle */}
      {activeVisualizerTab === 'ASSURANCE_BLUEPRINT' && (
        <div className="space-y-3 font-mono text-xs tabular-nums">
          {/* 5-Phase Phoenix Healing Runtime Cycle: Sense -> Ingest -> Assure -> Understand -> Simulate/Decide */}
          <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/30 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-cyan-300 font-semibold">
                LAYER-3 PHOENIX HEALING 5-PHASE CYCLE: SENSE → INGEST → ASSURE → UNDERSTAND → SIMULATE/DECIDE
              </span>
              <span className="text-emerald-400 font-semibold">
                Latency: 35.56 ms · SLA Ceiling: 142.00 ms · Safety Margin: +106.44 ms
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { step: '01. Sense', detail: 'Quantum Telemetry Hooks & Radar Ping (8443)', ms: '4.12 ms' },
                { step: '02. Ingest', detail: 'Zero-Drift Stream & RFC 3161 Microsecond TSA', ms: '6.40 ms' },
                { step: '03. Assure', detail: '10/10 REAL_HSM & Chamber 02 Fail-Closed Guard', ms: '8.24 ms' },
                { step: '04. Understand', detail: 'Agentic Mesh 128k Causal Graph Synthesis', ms: '9.80 ms' },
                { step: '05. Simulate/Decide', detail: 'Proactive Phoenix Heal & Router Shield Reroute', ms: '7.00 ms' },
              ].map((c) => (
                <div key={c.step} className="p-2 rounded-lg bg-white/[0.02] border border-white/10 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#D4AF37] font-semibold">{c.step}</span>
                    <span className="text-emerald-300">{c.ms}</span>
                  </div>
                  <div className="text-[10px] text-zinc-300 font-sans leading-snug">{c.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Layer Resilience Assurance Architecture Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="p-3 rounded-lg bg-black/45 border border-cyan-500/30 space-y-1.5">
              <div className="text-cyan-300 font-semibold">Layer-1: Cryptographic Core</div>
              <ul className="text-[11px] text-zinc-300 space-y-1 font-sans">
                <li>• <strong>Kyber-1024</strong>: ป้องกัน Harvest-Now Decrypt-Later</li>
                <li>• <strong>Dilithium-5</strong>: ลงนามอธิปไตย 14,902 Seals</li>
                <li>• <strong>SLH-DSA</strong>: ตรวจสอบความสมบูรณ์ระดับบิต</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-black/45 border border-violet-500/30 space-y-1.5">
              <div className="text-violet-300 font-semibold">Layer-2: Quorum &amp; Isolation</div>
              <ul className="text-[11px] text-zinc-300 space-y-1 font-sans">
                <li>• <strong>Deca-Key (10/10 HSM)</strong>: ขจัด Single Point of Failure</li>
                <li>• <strong>Chamber 02</strong>: Fail-Closed Isolation (80 Seals)</li>
                <li>• <strong>Circuit Breaker</strong>: Trigger 85°C, Proactive Healing</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-black/45 border border-emerald-500/30 space-y-1.5">
              <div className="text-emerald-300 font-semibold">Layer-3: Phoenix Healing</div>
              <ul className="text-[11px] text-zinc-300 space-y-1 font-sans">
                <li>• <strong>5-Phase Cycle</strong>: Sense → Ingest → Assure → Understand → Decide</li>
                <li>• <strong>Latency 35.56 ms</strong>: Margin +106.44 ms (&lt;142 ms)</li>
                <li>• <strong>Chaos Visualizer</strong>: Glitch → Heal → Bloom</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-black/45 border border-amber-500/30 space-y-1.5">
              <div className="text-[#D4AF37] font-semibold">Layer-4: Legal &amp; Compliance</div>
              <ul className="text-[11px] text-zinc-300 space-y-1 font-sans">
                <li>• <strong>ETDA Sec 9/26/28</strong>: ลายมือชื่อดิจิทัลเชื่อถือได้</li>
                <li>• <strong>PDPA Sec 26/37</strong>: Zero-Trust + PQC + PDPA FINAL</li>
                <li>• <strong>ISO/IEC 27037:2012</strong>: Chain of Custody Audit</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-black/45 border border-cyan-400/30 space-y-1.5">
              <div className="text-cyan-200 font-semibold">Layer-5: Visualization &amp; HUD</div>
              <ul className="text-[11px] text-zinc-300 space-y-1 font-sans">
                <li>• <strong>Phoenix Dashboard</strong>: Realtime Resilience Metrics</li>
                <li>• <strong>Gold Seal Console</strong>: Sovereign Trust (99.47%)</li>
                <li>• <strong>Quantum Radar Pulse</strong>: GPU BufferAttribute Heatmap</li>
              </ul>
            </div>
          </div>

          {/* Phase-2 Phoenix Recovery Pipeline (QUANTARIS-PHOENIX-REC-v∞.2) Core Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg bg-black/50 border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-rose-300 font-semibold">PHOENIX-CHAOS-SIM</span>
                <span className="text-[10px] text-emerald-300">Isolation &lt; 5 ms</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans">
                Chaos-Resilience Simulation Engine · จำลองสถานการณ์ multiverse stress-test แบบ Bitwise Deterministic (Δ0.00%)
              </p>
              <div className="text-[10px] text-zinc-400">
                Flow: Radar Detect → Shader Glitch → Router Shield → Auto-Heal → Confirm
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/50 border border-cyan-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold">PHOENIX-TELEMETRY-G16</span>
                <span className="text-[10px] text-emerald-300">Sampling 1600Hz</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans">
                Telemetry Dashboard G16 · ประมวลผล 24,960 QOps/s และ GPU BufferAttribute Heatmap (768 Qubits, ≥99.98% Coherence)
              </p>
              <div className="text-[10px] text-zinc-400">
                SLA Ceiling: 142.00 ms · Actual: 35.56 ms · Margin: +106.44 ms (75.0%)
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/50 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-semibold">PHOENIX-AUTO-HEAL</span>
                <span className="text-[10px] text-[#D4AF37]">Recovery &lt; 85 ms (35.56 ms)</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans">
                Auto-Healing Runtime Blocks · Hot-Swap Microkernel Recovery แก้ไข anomaly ทันทีโดยไม่กระทบ federation traffic
              </p>
              <div className="text-[10px] text-zinc-400">
                Seals: 14,902 Active Intact · 80 Quarantined (Chamber 02 FAIL_CLOSED)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoenixDashboard;
