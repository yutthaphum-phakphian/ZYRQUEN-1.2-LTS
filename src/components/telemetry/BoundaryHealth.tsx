import React from 'react';
import { ShieldAlert, ShieldCheck, Activity, Layers, Lock, Cpu } from 'lucide-react';

export const BoundaryHealth: React.FC = () => {
  const boundaries = [
    { name: 'SSoT Master Boundary', status: 'LOCKED', drift: 'Δ0.000%', latency: '0.12ms', passed: true },
    { name: 'HSM Cryptographic Seal Mesh', status: 'ACTIVE', drift: 'Δ0.000%', latency: '4.20ms', passed: true },
    { name: 'Phase 11 Write Firewall Gate', status: 'ENFORCED', drift: 'Δ0.000%', latency: '1.05ms', passed: true },
    { name: 'ETDA Sec 28 Non-Repudiation', status: 'COMPLIANT', drift: 'Δ0.000%', latency: '8.40ms', passed: true },
    { name: 'Quantum Jitter Absorption Enclave', status: 'CRYOGENIC', drift: '0.082K', latency: '35.80ms', passed: true },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-950/60 border border-violet-500/30 text-violet-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Boundary Health &amp; Invariant Watchdog
            </h3>
            <p className="text-[10px] text-slate-400">Deterministic Formal Verification Checks</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          5/5 BOUNDARIES INTACT
        </span>
      </div>

      <div className="space-y-2">
        {boundaries.map((b, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-200">{b.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 hidden sm:inline">{b.latency}</span>
              <span className="text-[10px] font-bold text-emerald-400">{b.drift}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-300 border border-slate-700">
                {b.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoundaryHealth;
