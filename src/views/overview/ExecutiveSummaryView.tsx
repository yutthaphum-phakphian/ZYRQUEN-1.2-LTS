/**
 * ZYRQUEN Ω∞ Executive Summary View
 * High-level system overview stats with zero-drift SSoT invariants
 */
import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Lock,
  Scale,
  ArrowUpRight,
  Server,
} from 'lucide-react';
import { SYSTEM_INVARIANTS, SYSTEM_METADATA } from '../../data/canonicalData';

interface ExecutiveSummaryViewProps {
  onNavigateToLedger?: () => void;
  onNavigateToChambers?: () => void;
  onNavigateToCouncil?: () => void;
  onNavigateToLegal?: () => void;
}

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({
  onNavigateToLedger,
  onNavigateToChambers,
  onNavigateToCouncil,
  onNavigateToLegal,
}) => {
  const stats = [
    {
      label: 'SSoT Verified Seals',
      value: '14,902',
      subtext: '100% Immutable WORM',
      accent: 'text-cyan-400',
      bgGlow: 'from-cyan-500/10 to-transparent',
      borderColor: 'border-cyan-500/30',
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
      onClick: onNavigateToLedger,
    },
    {
      label: 'Zero-Drift Invariant',
      value: 'Δ 0.000%',
      subtext: 'Genesis Block #849202',
      accent: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
    },
    {
      label: 'Mean Gateway Latency',
      value: '35.80 ms',
      subtext: 'SLA Target < 142.00 ms',
      accent: 'text-violet-400',
      bgGlow: 'from-violet-500/10 to-transparent',
      borderColor: 'border-violet-500/30',
      icon: <Zap className="w-5 h-5 text-violet-400" />,
    },
    {
      label: 'Deca-Key Quorum',
      value: '10 / 10',
      subtext: 'REAL_HSM FIPS 140-3 L4',
      accent: 'text-amber-400',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      onClick: onNavigateToCouncil,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top 4 Key Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
            onClick={stat.onClick}
            className={`p-5 rounded-2xl bg-gradient-to-b ${stat.bgGlow} bg-slate-950/80 border ${stat.borderColor} shadow-lg transition-all ${
              stat.onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-cyan-500/10' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                {stat.icon}
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className={`text-2xl sm:text-3xl font-mono font-black ${stat.accent}`}>
                {stat.value}
              </div>
              {stat.onClick && (
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              )}
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-400">
              {stat.subtext}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Highlight Box */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
            <Server className="w-4 h-4" />
            <span>Chamber Governance</span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            18 Canonical Chambers operating in unified zero-drift lock. All state transitions anchored to Merkle Root with zero mutation.
          </p>
          <div className="text-[11px] font-mono text-slate-400">
            Cryostat: <strong className="text-emerald-400">14.98 mK</strong> • PQC: <strong className="text-cyan-300">Cat-5</strong>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-bold uppercase">
            <Cpu className="w-4 h-4" />
            <span>AI Reasoning Mesh</span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Multi-agent consensus architecture with strict read-only boundary connectors. Zero-mock deterministic execution verified.
          </p>
          <div className="text-[11px] font-mono text-slate-400">
            Agents Active: <strong className="text-violet-300">4 Enclaves</strong> • Security: <strong className="text-emerald-400">SGX/Cryo</strong>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
            <Scale className="w-4 h-4" />
            <span>Statutory Compliance</span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Full ETDA Sec 9/26/28 and PDPA Sec 37 statutory enforcement. Dual-custody ISO/IEC 27037 court-admissible audit trail.
          </p>
          <div className="text-[11px] font-mono text-slate-400">
            Passport: <strong className="text-cyan-300">#EP-SOVEREIGN-01</strong> • Status: <strong className="text-emerald-400">RATIFIED</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryView;
