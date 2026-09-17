import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  RefreshCw,
  Scale,
  Award,
  Cpu,
  Layers,
  Fingerprint,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { INITIAL_OMEGA_PHASES, OmegaPhase } from './OmegaSequenceSimulator';
import { SYSTEM_METADATA } from '../data/canonicalData';

export const OmegaSequenceFlowDiagram: React.FC = () => {
  const [phases, setPhases] = useState<OmegaPhase[]>(INITIAL_OMEGA_PHASES);
  const [selectedPhase, setSelectedPhase] = useState<OmegaPhase>(INITIAL_OMEGA_PHASES[0]);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto-play simulation through all 12 nodes
  const handlePlayFlow = () => {
    setIsSimulating(true);
    let current = 0;
    setActivePhaseIndex(0);
    setSelectedPhase(INITIAL_OMEGA_PHASES[0]);
    playTone(450, 0.08);

    setPhases(
      INITIAL_OMEGA_PHASES.map((p, idx) => ({
        ...p,
        status: idx === 0 ? 'ATTESTING' : 'PENDING',
      }))
    );

    const timer = setInterval(() => {
      current++;
      if (current < 12) {
        setActivePhaseIndex(current);
        setSelectedPhase(INITIAL_OMEGA_PHASES[current]);
        playTone(450 + current * 35, 0.06);

        setPhases((prev) =>
          prev.map((p, idx) => {
            if (idx < current) return { ...p, status: 'FINALIZED' };
            if (idx === current) return { ...p, status: 'ATTESTING' };
            return { ...p, status: 'PENDING' };
          })
        );
      } else {
        clearInterval(timer);
        setIsSimulating(false);
        setPhases(INITIAL_OMEGA_PHASES.map((p) => ({ ...p, status: 'FINALIZED' })));
        playAuditChime();
      }
    }, 550);
  };

  const handleNodeClick = (index: number) => {
    if (isSimulating) return;
    setActivePhaseIndex(index);
    setSelectedPhase(phases[index]);
    playTone(550 + index * 20, 0.04);
  };

  // Node coordinate calculations for SVG Flow (2 rows of 6 nodes)
  // Row 1: Phase 1 to 6 (left to right) -> X: 80, 240, 400, 560, 720, 880 | Y: 90
  // Row 2: Phase 7 to 12 (left to right) -> X: 80, 240, 400, 560, 720, 880 | Y: 240
  const getNodePos = (idx: number) => {
    if (idx < 6) {
      return { x: 80 + idx * 160, y: 95 };
    } else {
      return { x: 80 + (idx - 6) * 160, y: 250 };
    }
  };

  return (
    <div
      className={`rounded-[28px] bg-[#07080F]/95 border border-white/8 backdrop-blur-2xl transition-all duration-300 font-mono flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 p-6 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-y-auto' : 'p-6 sm:p-8 space-y-6 shadow-2xl'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.2)] shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                12-Phase Omega Sequence Flow Diagram
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                INTERACTIVE SVG NODE MAP
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Live cryptographic pipeline from Genesis Root $\rightarrow$ Invariant Verification $\rightarrow$ Omega Finality ♾️
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePlayFlow}
            disabled={isSimulating}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all shadow-lg ${
              isSimulating
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 animate-pulse cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-200 border-cyan-500/40 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 text-cyan-300 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? `Flowing Phase ${activePhaseIndex + 1}/12...` : 'Simulate 12-Phase Flow'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Flow Diagram */}
      <div className="relative w-full overflow-x-auto rounded-2xl bg-black/60 border border-white/5 p-4 flex items-center justify-center">
        <svg
          viewBox="0 0 960 340"
          className="w-full max-w-5xl h-auto min-w-[780px] select-none"
        >
          <defs>
            {/* Gradient definition for active glow */}
            <linearGradient id="flowLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>

            <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Row 1 Path Connectors (Phase 1 -> 6) */}
          <path
            d="M 80 95 L 880 95"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Loop Connector from Row 1 end (Node 6) to Row 2 start (Node 7) */}
          <path
            d="M 880 95 C 940 95, 940 170, 480 170 C 20 170, 20 250, 80 250"
            fill="none"
            stroke="url(#flowLineGrad)"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />

          {/* Row 2 Path Connectors (Phase 7 -> 12) */}
          <path
            d="M 80 250 L 880 250"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Active Flow Pulse Path (Highlighted depending on activePhaseIndex) */}
          {activePhaseIndex < 6 ? (
            <path
              d={`M 80 95 L ${80 + activePhaseIndex * 160} 95`}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              filter="url(#nodeGlow)"
            />
          ) : (
            <>
              <path
                d="M 80 95 L 880 95"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="4"
                filter="url(#nodeGlow)"
              />
              <path
                d={`M 80 250 L ${80 + (activePhaseIndex - 6) * 160} 250`}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                filter="url(#nodeGlow)"
              />
            </>
          )}

          {/* 12 Interactive SVG Nodes */}
          {phases.map((p, idx) => {
            const pos = getNodePos(idx);
            const isSelected = activePhaseIndex === idx;
            const isAttesting = p.status === 'ATTESTING';
            const isFinalized = p.status === 'FINALIZED';

            return (
              <g
                key={p.phase}
                onClick={() => handleNodeClick(idx)}
                className="cursor-pointer transition-all duration-200 group"
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                {/* Outer Glow Halo if Active */}
                {isSelected && (
                  <circle
                    r="34"
                    fill="none"
                    stroke={p.accentColor}
                    strokeWidth="2"
                    strokeOpacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r="26"
                  fill="#0b0e1a"
                  stroke={isSelected ? p.accentColor : isAttesting ? '#38bdf8' : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isSelected ? '3.5' : '2'}
                  filter={isSelected ? 'url(#nodeGlow)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-white"
                />

                {/* Inner Accent Ring */}
                <circle
                  r="21"
                  fill={isSelected ? `${p.accentColor}25` : 'rgba(0,0,0,0.4)'}
                />

                {/* Phase Number Text */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill={isSelected ? '#ffffff' : p.accentColor}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Φ{p.phase}
                </text>

                {/* Status Indicator Dot */}
                <circle
                  cx="18"
                  cy="-18"
                  r="6"
                  fill={isFinalized ? '#10b981' : isAttesting ? '#06b6d4' : '#52525b'}
                  stroke="#07080F"
                  strokeWidth="1.5"
                />

                {/* Phase Label under/above node */}
                <text
                  textAnchor="middle"
                  dy={idx < 6 ? '-36' : '44'}
                  fill={isSelected ? '#ffffff' : '#cbd5e1'}
                  fontSize="9.5"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {p.nameTh}
                </text>

                <text
                  textAnchor="middle"
                  dy={idx < 6 ? '-48' : '56'}
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontFamily="sans-serif"
                >
                  {p.nameEn.slice(0, 20)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Phase Detail Modal / Expand Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/80 border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl border flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                backgroundColor: `${selectedPhase.accentColor}20`,
                borderColor: `${selectedPhase.accentColor}40`,
                color: selectedPhase.accentColor,
              }}
            >
              Φ{selectedPhase.phase}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-white">
                  Phase {selectedPhase.phase}: {selectedPhase.nameTh}
                </span>
                <span className="text-xs text-zinc-400 font-sans">({selectedPhase.nameEn})</span>
              </div>
              <span className="text-xs text-cyan-300 font-mono mt-0.5 block">{selectedPhase.statuteRef}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold border"
              style={{
                backgroundColor: `${selectedPhase.accentColor}15`,
                color: selectedPhase.accentColor,
                borderColor: `${selectedPhase.accentColor}35`,
              }}
            >
              {selectedPhase.status} • {selectedPhase.latencyMs}ms Latency
            </span>
          </div>
        </div>

        {/* Phase Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>กฎหมายไทยและข้อกำหนด (Statutory Purpose):</span>
            </span>
            <p className="text-zinc-200 font-sans text-xs leading-relaxed">
              {selectedPhase.descriptionTh}
            </p>
            <p className="text-zinc-400 font-sans text-xs italic">
              {selectedPhase.descriptionEn}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>การบังคับใช้เชิงรันไทม์ (Runtime Invariant Proof):</span>
            </span>
            <p className="text-zinc-300 font-mono text-xs leading-relaxed">
              {selectedPhase.technicalEnforcement}
            </p>
            <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-[10px] text-emerald-400 select-all font-mono truncate">
              Proof Hash: {selectedPhase.hashPreview}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
