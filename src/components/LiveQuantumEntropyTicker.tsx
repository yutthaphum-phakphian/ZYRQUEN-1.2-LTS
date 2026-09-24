import React from 'react';
import { Activity, ShieldCheck, Database, Radio, Cpu, Lock, Thermometer } from 'lucide-react';

export const LiveQuantumEntropyTicker: React.FC = () => {
  return (
    <div className="w-full bg-slate-950/95 border-y border-slate-800/80 py-1.5 px-2.5 sm:px-4 overflow-x-auto scrollbar-none font-mono text-[10px] sm:text-[10.5px] text-slate-400 flex items-center gap-2 sm:gap-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5 shrink-0 text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/40 text-[9.5px] sm:text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.15)]">
        <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
        <span className="whitespace-nowrap">LIVE STREAM</span>
      </div>

      {/* Marquee Animated Stream / Smooth Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-none flex-1 min-w-0 relative">
        <div className="flex items-center gap-3 sm:gap-6 min-w-max py-0.5">
          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300">Lithium-5 + Kyber-1024</span>
          </span>

          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-sky-400" />
            <span>Cryo Core: <strong className="text-sky-300 font-bold">14.98 mK</strong></span>
          </span>

          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Deca-Key Quorum: <strong className="text-emerald-400 font-bold">10/10 REAL_HSM</strong></span>
          </span>

          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Genesis: <strong className="text-white font-bold">#849,202</strong></span>
          </span>

          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>SSoT: <strong className="text-emerald-400 font-bold">Δ0.00% Zero Drift</strong></span>
          </span>

          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1">
            <Database className="w-3 h-3 text-purple-400" />
            <span>Seals: <strong className="text-purple-300 font-bold">14,902 Active</strong></span>
          </span>

          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1">
            <span>Legal Status: <strong className="text-amber-400 font-bold">พ.ร.บ. 2544 (ม. 9, 26, 28) & PDPA</strong></span>
          </span>

          <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-lg shrink-0">
            Principal: <strong className="text-white">นายยุทธภูมิ พากเพียร #EP-01</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
