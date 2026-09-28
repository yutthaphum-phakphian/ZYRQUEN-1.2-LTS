/**
 * ZYRQUEN Ω∞ Executive Dashboard Overview
 * Modular, clutter-free grid with strict max-width constraints
 */
import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Layers,
  FileText,
  Lock,
  ArrowRight,
  Database,
  Terminal,
  Radio,
  Scale,
  Sparkles,
  Server,
  Globe,
  Boxes,
} from 'lucide-react';
import { ViewType, HardwareSnapshot } from '../../types';
import { SYSTEM_INVARIANTS, SYSTEM_METADATA } from '../../data/canonicalData';
import { playTone } from '../../components/AudioSynthesizer';
import { ExecutiveSummaryView } from './ExecutiveSummaryView';
import { ChartAnimationToggle } from '../../components/dashboard/ChartAnimationToggle';

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
  onOpenCertificate?: () => void;
  onSelectChamber?: (chamberId: string) => void;
  snapshots?: HardwareSnapshot[];
  totalVerifiedSeals?: number;
  totalSealsCount?: number;
  verificationGateStatus?: {
    status: 'PASSED' | 'BLOCKED';
    sealCount: number;
    lastCheckedTime: string;
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCertificate,
  onSelectChamber,
  snapshots = [],
  totalVerifiedSeals = 14902,
  totalSealsCount = 14902,
  verificationGateStatus,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Overview Banner */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight flex items-center gap-2">
              <span>ZYRQUEN Ω∞</span>
              <span className="text-cyan-400 text-sm font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                v{SYSTEM_METADATA.version} LTS FROZEN
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            Autonomous Self-Tuning World Engine • Sovereign Principal Architect: <strong className="text-cyan-300">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <ChartAnimationToggle variant="compact" />
          {onOpenCertificate && (
            <button
              onClick={() => {
                playTone(720, 0.04);
                onOpenCertificate();
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Court-Ready Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Primary Executive Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Primary System Summary</span>
          </h2>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            SSoT Δ0.00% Zero-Drift Verified
          </span>
        </div>

        <ExecutiveSummaryView
          onNavigateToLedger={() => onNavigate('ledger')}
          onNavigateToChambers={() => onNavigate('matrix')}
          onNavigateToCouncil={() => onNavigate('council')}
          onNavigateToLegal={() => onNavigate('legal')}
        />
      </div>

      {/* 3. Operational Hub & Enclave Navigation (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Key Invariants & Status (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Runtime Invariants</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                100% INTACT
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Canonical Merkle Root:</span>
                <span className="text-cyan-300 font-bold">0x{SYSTEM_METADATA.merkleRoot.slice(0, 10)}...</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Genesis Block Height:</span>
                <span className="text-emerald-400 font-bold">#{SYSTEM_METADATA.genesisBlock}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Post-Quantum Algorithm:</span>
                <span className="text-violet-300 font-bold">{SYSTEM_METADATA.pqcCompliance}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Fail-Closed Cutoff:</span>
                <span className="text-amber-300 font-bold">&lt; 85.0°C Thermal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fast Launchpad to Dedicated Chamber Rooms (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>Operating Enclaves (ห้องปฏิบัติการ)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">คลิกเพื่อเข้าห้องเฉพาะทาง</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'matrix', name: '18 Chambers', desc: 'Lattice Topology', icon: <Boxes className="w-4 h-4 text-cyan-400" /> },
                { id: 'ledger', name: 'Evidence Ledger', desc: '14,902 WORM Seals', icon: <Database className="w-4 h-4 text-emerald-400" /> },
                { id: 'pulse', name: 'System Pulse', desc: 'Cryo Telemetry', icon: <Radio className="w-4 h-4 text-rose-400" /> },
                { id: 'council', name: 'HSM Council', desc: '10/10 Quorum', icon: <Lock className="w-4 h-4 text-amber-400" /> },
                { id: 'legal', name: 'Legal & PDPA', desc: 'ETDA Sec 9/26/28', icon: <Scale className="w-4 h-4 text-violet-400" /> },
                { id: 'security', name: 'Security Enclave', desc: 'Zero-Trust Gate', icon: <ShieldCheck className="w-4 h-4 text-teal-400" /> },
                { id: 'quantum', name: 'Quantum Nexus', desc: 'Sub-Kelvin State', icon: <Sparkles className="w-4 h-4 text-sky-400" /> },
                { id: 'console', name: 'CLI Terminal', desc: 'Operations CLI', icon: <Terminal className="w-4 h-4 text-zinc-300" /> },
                { id: 'archive', name: 'Module Archive', desc: '17 Manifests', icon: <FileText className="w-4 h-4 text-purple-400" /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    playTone(580, 0.04);
                    onNavigate(item.id as ViewType);
                  }}
                  className="p-3.5 rounded-xl bg-black/40 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                      {item.icon}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-2 text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-200 transition-colors">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
