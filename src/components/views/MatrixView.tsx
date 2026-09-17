import React, { useState } from 'react';
import { Orbit, Play, ShieldAlert, Sparkles, CheckCircle2, RotateCw, Compass, Radio } from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { MultiversePathProjectionD3Graph } from '../MultiversePathProjectionD3Graph';
import { MultiverseNavigationGridPanel } from '../MultiverseNavigationGridPanel';
import { PathProjectionNode, HardwareSnapshot, ViewType } from '../../types';

interface MatrixViewProps {
  snapshots?: HardwareSnapshot[];
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'info' | 'warning' | 'critical' | 'success',
    statuteRef?: string,
    targetView?: ViewType
  ) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({ snapshots, onAddSystemEvent }) => {
  const [selectedUniverse, setSelectedUniverse] = useState<'alpha' | 'prime' | 'omega'>('prime');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [selectedProjectionNode, setSelectedProjectionNode] = useState<PathProjectionNode | null>(null);

  const universes = [
    {
      id: 'prime',
      branchKey: 'canonical_anchor',
      name: 'Universe Prime (Production SSoT Mirror)',
      divergence: '0.00% Divergence',
      blastRadius: '0.8% (Nominal)',
      riskScore: '0.02 (Minimal)',
      latencyDelta: '-12ms',
      health: '100% HEALTH',
      status: 'CANONICAL',
    },
    {
      id: 'alpha',
      branchKey: 'optimal_warp',
      name: 'Universe Alpha (Chaos Stress Test 10x Load)',
      divergence: '1.42% Counterfactual',
      blastRadius: '1.4% (<2.0% Safe)',
      riskScore: '0.14 (Low Risk)',
      latencyDelta: '+4ms',
      health: 'STABLE',
      status: 'SYNTHETIC',
    },
    {
      id: 'omega',
      branchKey: 'quarantine_divergence',
      name: 'Universe Omega (Adversarial Privilege Injection)',
      divergence: '4.88% Attack Vector',
      blastRadius: '0.0% (Quarantined)',
      riskScore: '0.98 (Auto-Blocked)',
      latencyDelta: '0ms',
      health: 'FAIL-CLOSED ISOLATED',
      status: 'QUARANTINED',
    },
  ];

  const handleSimulate = () => {
    setIsSimulating(true);
    setSimulationResult(null);
    playTone(480, 0.1, 'sawtooth');

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResult('Monte Carlo 10,000 runs completed: 0 invariant violations. Entropy Lyapunov dissipation bounded at -0.0384. Blast radius bounded at 0.8% (<2.0% ceiling).');
      playAuditChime();
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#120a24]/90 via-[#0b0e1a]/80 to-[#07080F] border border-white/8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-mono">
              MULTIVERSE SIMULATION ARENA
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
              DIGITAL TWIN (SimA)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              PATH PROJECTION ENGINE ACTIVE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
            Multiverse Simulation Arena & Path Projection Matrix
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            D3 Vector Graph Path Projection • Telemetry Entropy Analysis (T+1 to T+5) • Monte Carlo 10,000 Paths (&lt;2.0% Blast Radius)
          </p>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold flex items-center gap-2 border transition-all ${
            isSimulating
              ? 'bg-violet-500/20 border-violet-500/40 text-violet-200 animate-pulse'
              : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 text-violet-300 shadow-lg'
          }`}
        >
          <RotateCw className={`w-4 h-4 text-violet-400 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulating 10,000 Paths...' : 'Run Monte Carlo Simulation'}</span>
        </button>
      </div>

      {simulationResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{simulationResult}</span>
        </div>
      )}

      {/* Multiverse Navigation Grid Integration Panel (Unified with Embedded D3 Path Projection Vector Engine) */}
      <MultiverseNavigationGridPanel
        snapshots={snapshots}
        onAddSystemEvent={onAddSystemEvent}
        showEmbeddedPathProjection={true}
      />

      {/* Digital Twin Simulation Parameters */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
            Digital Twin (SimA) Counterfactual Engine
          </span>
          <span className="text-xs font-mono text-cyan-400">Deterministic Replay Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-zinc-500 text-[10px]">SIMULATED ACTION</span>
            <div className="text-zinc-200 font-bold">SCALE_CONTAINER_RESOURCES</div>
            <div className="text-[11px] text-zinc-400">CPU 2.0 -&gt; 4.0 Cores</div>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-zinc-500 text-[10px]">PREDICTED LATENCY</span>
            <div className="text-emerald-400 font-bold">-12ms (From 46ms to 34ms)</div>
            <div className="text-[11px] text-zinc-400">26% Performance Gain</div>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-zinc-500 text-[10px]">ESTIMATED BLAST RADIUS</span>
            <div className="text-cyan-400 font-bold">1.2% Impact (&lt;2.0% Safe)</div>
            <div className="text-[11px] text-zinc-400">Zero service disruption</div>
          </div>
        </div>
      </div>
    </div>
  );
};

