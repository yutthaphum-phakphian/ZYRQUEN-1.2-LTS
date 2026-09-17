import React, { useState, useEffect } from 'react';
import {
  Compass,
  Zap,
  Radio,
  Globe,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Rocket,
  Activity,
  Cpu,
  RefreshCw,
  Share2,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import {
  getQuantumContinuumState,
  subscribeQuantumContinuum,
  activateQuantumContinuum,
} from '../utils/quantumContinuumRuntime';
import {
  getMultiverseNavigationState,
  subscribeMultiverseNavigation,
  activateMultiverseNavigation,
} from '../utils/multiverseNavigationGrid';
import { QuantumContinuumState, MultiverseNavigationState, PathProjectionNode, HardwareSnapshot } from '../types';
import { playAuditChime, playTone, playTelemetryBeep } from './AudioSynthesizer';
import { MultiversePathProjectionD3Graph } from './MultiversePathProjectionD3Graph';

interface MultiverseNavigationGridPanelProps {
  snapshots?: HardwareSnapshot[];
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    statuteRef?: string,
    severity?: 'info' | 'warning' | 'critical',
    metaHash?: string
  ) => void;
  showEmbeddedPathProjection?: boolean;
}

export const MultiverseNavigationGridPanel: React.FC<MultiverseNavigationGridPanelProps> = ({
  snapshots,
  onAddSystemEvent,
  showEmbeddedPathProjection = true,
}) => {
  const [continuum, setContinuum] = useState<QuantumContinuumState>(getQuantumContinuumState);
  const [nav, setNav] = useState<MultiverseNavigationState>(getMultiverseNavigationState);
  const [isActivatingContinuum, setIsActivatingContinuum] = useState<boolean>(false);
  const [isEngagingNav, setIsEngagingNav] = useState<boolean>(false);
  const [activeStepText, setActiveStepText] = useState<string | null>(null);
  const [isProjectionExpanded, setIsProjectionExpanded] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<PathProjectionNode | null>(null);

  useEffect(() => {
    const unsub1 = subscribeQuantumContinuum(setContinuum);
    const unsub2 = subscribeMultiverseNavigation(setNav);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleRunContinuum = async () => {
    setIsActivatingContinuum(true);
    playTone(520, 0.08);

    try {
      const state = await activateQuantumContinuum((step, msg) => {
        setActiveStepText(msg);
        playTelemetryBeep();
      });
      playAuditChime();
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'IMMUTABLE_LOGGED',
          'Quantum Continuum Runtime v14 Activated',
          `Continuum Core ${state.continuumId} bound with Kernel ${state.baseKernel} and Governance ${state.governanceFabric}. Quorum: ${state.quorum}, Dimensions: ${state.activeDimensions.join(', ')}.`,
          'Multiverse Continuum Synchronization Invariant',
          'info',
          state.commitHash
        );
      }
    } finally {
      setIsActivatingContinuum(false);
      setActiveStepText(null);
    }
  };

  const handleEngageNavigation = async () => {
    setIsEngagingNav(true);
    playTone(600, 0.08);

    try {
      const state = await activateMultiverseNavigation(
        { currentSector: '08-XF4', targetGateway: 'Nexus-Gateway', destination: 'Celestial-Haven' },
        (step, msg) => {
          setActiveStepText(msg);
          playTelemetryBeep();
        }
      );
      playAuditChime();
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'IMMUTABLE_LOGGED',
          'Multiverse Navigation Grid v15 Engaged',
          `Grid ${state.gridId} aligned to Sector ${state.currentSector} via Gateway ${state.targetGateway} → Destination ${state.destination}. qOps: ${state.qOps}, Warp: Quantum-Resilient.`,
          'Omega-1 Holographic Navigation Invariant',
          'info',
          state.commitHash
        );
      }
    } finally {
      setIsEngagingNav(false);
      setActiveStepText(null);
    }
  };

  return (
    <div
      id="multiverse-navigation-grid-panel"
      className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1322]/90 via-[#070b14]/85 to-[#04060b] border border-cyan-500/25 backdrop-blur-xl space-y-5 shadow-2xl relative overflow-hidden font-mono"
    >
      {/* Background Starlight Radial Effect */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Compass className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                QUANTUM CONTINUUM RUNTIME v14 & MULTIVERSE NAVIGATION GRID v15
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                OMEGA-1 SUPREME CLEARANCE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Unified Multiverse Synchronization Core bridging Civilization Nodes with Holographic Spatial Grid
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={handleRunContinuum}
            disabled={isActivatingContinuum || isEngagingNav}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${isActivatingContinuum ? 'animate-spin' : ''}`} />
            <span>{isActivatingContinuum ? 'SYNCING CONTINUUM...' : 'SYNC CONTINUUM v14'}</span>
          </button>

          <button
            onClick={handleEngageNavigation}
            disabled={isActivatingContinuum || isEngagingNav}
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)] disabled:opacity-50"
          >
            <Rocket className="w-3.5 h-3.5 text-purple-300" />
            <span>{isEngagingNav ? 'WARP ENGAGING...' : 'ENGAGE NAV GRID v15'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Progress ticker */}
      {activeStepText && (
        <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 animate-pulse flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{activeStepText}</span>
        </div>
      )}

      {/* Dual Section Grid: Continuum v14 & Nav Grid v15 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10 text-xs">
        {/* Quantum Continuum Card */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/8 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-xs">QUANTUM CONTINUUM (QCR-v14)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
              {continuum.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-zinc-500">Continuum Core:</span>
              <p className="font-bold text-cyan-300">{continuum.continuumId}</p>
            </div>
            <div>
              <span className="text-zinc-500">Base Kernel:</span>
              <p className="font-bold text-zinc-200">{continuum.baseKernel}</p>
            </div>
            <div>
              <span className="text-zinc-500">Governance Fabric:</span>
              <p className="font-bold text-emerald-300">{continuum.governanceFabric}</p>
            </div>
            <div>
              <span className="text-zinc-500">HSM Quorum:</span>
              <p className="font-bold text-violet-300">{continuum.quorum}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500">Federation Nodes Synchronized:</span>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {continuum.synchronizedNodes.map((node) => (
                <span key={node} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 font-bold">
                  {node}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500">Active Spatial Dimensions:</span>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {continuum.activeDimensions.map((dim) => (
                <span key={dim} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold">
                  {dim} (Latency {continuum.latency})
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Continuum Seal:</span>
            <span className="text-cyan-300 font-bold">{continuum.seal}</span>
          </div>
        </div>

        {/* Multiverse Navigation Grid Card */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/8 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white text-xs">NAVIGATION GRID (NAV-v15)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
              {nav.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-zinc-500">Current Sector:</span>
              <p className="font-bold text-purple-300">{nav.currentSector}</p>
            </div>
            <div>
              <span className="text-zinc-500">Target Gateway:</span>
              <p className="font-bold text-zinc-200">{nav.targetGateway}</p>
            </div>
            <div>
              <span className="text-zinc-500">Destination:</span>
              <p className="font-bold text-emerald-300">{nav.destination}</p>
            </div>
            <div>
              <span className="text-zinc-500">Warp Latency:</span>
              <p className="font-bold text-cyan-300">{nav.warpLatency}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-zinc-500">Grid Engine qOps:</span>
              <p className="font-bold text-white">{nav.qOps} QOps/s</p>
            </div>
            <div>
              <span className="text-zinc-500">Holographic Heartbeat:</span>
              <p className="font-bold text-emerald-300">{nav.heartbeat}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500">Navigation Proof Anchor:</span>
            <p className="text-[10px] text-purple-300 font-mono break-all bg-black/50 p-1.5 rounded-lg border border-white/5 mt-0.5">
              {nav.blockId} • Commit: {nav.commitHash}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Warp Alignment 100% Locked
            </span>
            <span className="text-zinc-500">Omega-1 Sovereign Verified</span>
          </div>
        </div>
      </div>

      {/* Embedded D3 Path Projection Vector Graph Section */}
      {showEmbeddedPathProjection && (
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
              <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                INTEGRATED MULTIVERSE PATH PROJECTION (D3 VECTOR CONES T+1..T+5)
              </span>
            </div>
            <button
              onClick={() => {
                setIsProjectionExpanded(!isProjectionExpanded);
                playTone(isProjectionExpanded ? 480 : 620, 0.03);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            >
              {isProjectionExpanded ? 'COLLAPSE VECTOR GRAPH' : 'EXPAND VECTOR GRAPH'}
            </button>
          </div>

          {isProjectionExpanded && (
            <MultiversePathProjectionD3Graph
              snapshots={snapshots}
              onSelectNode={(node) => setSelectedNode(node)}
            />
          )}
        </div>
      )}
    </div>
  );
};
