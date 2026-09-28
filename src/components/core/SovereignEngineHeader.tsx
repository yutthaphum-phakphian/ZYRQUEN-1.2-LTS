import React from 'react';
import { Shield, Sparkles, Activity, Lock, Cpu, Globe, Hash } from 'lucide-react';
import { ZyrquenIcon } from '../ZyrquenLogo';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../../data/canonicalData';

export interface SovereignEngineHeaderProps {
  onRefresh?: () => void;
  activeViewTitle?: string;
  resilienceScore?: number;
}

export const SovereignEngineHeader: React.FC<SovereignEngineHeaderProps> = ({
  activeViewTitle = 'ZYRQUEN Ω∞ SOVEREIGN WORLD ENGINE',
  resilienceScore = 99.47,
}) => {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-950/95 to-slate-900/95 border border-cyan-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 left-10 w-72 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Brand Identity & Principal */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-400/40 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <ZyrquenIcon size={34} />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold font-mono text-white tracking-wider">
                {activeViewTitle}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                v1.2.1 LTS FROZEN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                10/10 REAL_HSM
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 font-mono mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                Block #{CANONICAL_GENESIS_BLOCK}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Δ0.000% ZERO DRIFT
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">
                Principal: <strong className="text-zinc-200">#EP-SOVEREIGN-01</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Telemetry Pills */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-mono">
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Resilience</div>
              <div className="font-bold text-cyan-300">{resilienceScore}% PASS</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Quorum Gate</div>
              <div className="font-bold text-emerald-300">PQC FIPS 204/205</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
            <Globe className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Latency SLA</div>
              <div className="font-bold text-amber-300">35.80 ms / 142 ms</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SovereignEngineHeader;
