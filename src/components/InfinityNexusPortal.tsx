import React from 'react';

export const InfinityNexusPortal: React.FC = () => {
  return (
    <div className="p-8 bg-[#0b0d18] rounded-2xl border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-24 h-24 mb-6 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-b-emerald-400 animate-spin-reverse" />
      </div>
      <h2 className="text-2xl font-bold text-cyan-300 tracking-widest mb-2">INFINITY NEXUS PORTAL</h2>
      <p className="text-zinc-400 text-center max-w-md font-sans">
        Sovereign operations and deep-space federation synchronization matrices are currently aligned. 
        Quantum pathways are stable.
      </p>
      <div className="mt-8 flex gap-4">
        <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-emerald-400 font-mono">
          STATUS: OMNI-RESONANT
        </div>
        <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-cyan-400 font-mono">
          UPTIME: 99.9999%
        </div>
      </div>
    </div>
  );
};
