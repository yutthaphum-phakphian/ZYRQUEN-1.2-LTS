/**
 * ZYRQUEN Ω∞ ERA Infinity Portal Integration (Phase 14)
 * Unified Multiverse Control Plane linking Continuum Particle Stream & Gold Seal Audit
 */
import React from 'react';
import ContinuumParticleStreamDashboard from '../citadel/ContinuumParticleStreamDashboard';
import SovereignGoldSealAuditDashboard from '../citadel/SovereignGoldSealAuditDashboard';
import { Globe, ShieldCheck, Sparkles, Activity, Clock } from 'lucide-react';
import { SYSTEM_METADATA } from '../../data/canonicalData';

export const ERAInfinityPortalIntegration: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              ERA∞ Multiverse Portal Integration (Phase 14)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            พอร์ทัลควบคุมสหพันธรัฐพหุภพ (Multiverse Control Plane) ผสานการตรวจสอบตราประทับทองคำและสตรีมอนุภาคโฮโลแกรม
          </p>
        </div>
      </div>

      {/* 2-Column Grid: Particle Stream & Gold Seal Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ContinuumParticleStreamDashboard />
        <SovereignGoldSealAuditDashboard />
      </div>

      {/* Footer: ERA Portal Status */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 font-mono text-xs shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-slate-500 text-[10px] block uppercase">Multiverse Sync</span>
          <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Stable (Δ0.00% Drift)
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-slate-500 text-[10px] block uppercase">Canonical Block Anchor</span>
          <span className="text-cyan-300 font-bold text-sm">
            #{SYSTEM_METADATA.genesisBlock} • FROZEN v1.2.1 LTS
          </span>
        </div>
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-slate-500 text-[10px] block uppercase">Federation Trust</span>
          <span className="text-amber-400 font-bold text-sm">
            10/10 REAL_HSM RATIFIED
          </span>
        </div>
      </div>
    </div>
  );
};

export default ERAInfinityPortalIntegration;
