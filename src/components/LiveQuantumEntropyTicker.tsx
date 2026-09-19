import React from 'react';
import { Activity, ShieldCheck, Database, Radio, Cpu, Lock, Thermometer } from 'lucide-react';

export const LiveQuantumEntropyTicker: React.FC = () => {
  return (
    <div className="w-full bg-slate-950/90 border-y border-slate-800/80 py-1.5 px-3 sm:px-4 overflow-hidden font-mono text-[10.5px] text-slate-400 flex items-center gap-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5 shrink-0 text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 text-[10px]">
        <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
        <span>LIVE STREAM</span>
      </div>

      {/* Marquee Animated Stream */}
      <div className="overflow-hidden whitespace-nowrap flex-1 relative mask-fade">
        <div className="animate-marquee flex items-center gap-8">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Genesis Block: <strong className="text-white">#849,202</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-purple-400" />
            <span>Memory Seals: <strong className="text-purple-300">14,902 Active</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>SSoT Invariant: <strong className="text-emerald-300">Δ0.00% Zero Drift</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>PQC Spec: <strong className="text-amber-300">ML-DSA-87 (Dilithium-5) + Kyber-1024</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-sky-400" />
            <span>Cryo Core: <strong className="text-sky-300">14.98 mK Sub-Kelvin</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Deca-Key Quorum: <strong className="text-emerald-300">10/10 REAL_HSM Ratified</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span>Legal Status: <strong className="text-cyan-300">พ.ร.บ. 2544 (ม. 9, 26, 28) & PDPA 2562 Compliant</strong></span>
          <span className="text-slate-600">•</span>
          <span>Sovereign Principal: <strong className="text-white">นายยุทธภูมิ พากเพียร #EP-SOVEREIGN-01</strong></span>

          {/* Repeat for seamless continuous scrolling */}
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Genesis Block: <strong className="text-white">#849,202</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-purple-400" />
            <span>Memory Seals: <strong className="text-purple-300">14,902 Active</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>SSoT Invariant: <strong className="text-emerald-300">Δ0.00% Zero Drift</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>PQC Spec: <strong className="text-amber-300">ML-DSA-87 (Dilithium-5) + Kyber-1024</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-sky-400" />
            <span>Cryo Core: <strong className="text-sky-300">14.98 mK Sub-Kelvin</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Deca-Key Quorum: <strong className="text-emerald-300">10/10 REAL_HSM Ratified</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span>Legal Status: <strong className="text-cyan-300">พ.ร.บ. 2544 (ม. 9, 26, 28) & PDPA 2562 Compliant</strong></span>
          <span className="text-slate-600">•</span>
          <span>Sovereign Principal: <strong className="text-white">นายยุทธภูมิ พากเพียร #EP-SOVEREIGN-01</strong></span>
        </div>
      </div>
    </div>
  );
};
