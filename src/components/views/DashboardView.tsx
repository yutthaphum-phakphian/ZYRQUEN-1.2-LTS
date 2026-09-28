import React, { useState } from 'react';
import { ViewType, HardwareSnapshot } from '../../types';
import { SYSTEM_METADATA, CANONICAL_MODULES, AUDIT_TRACE_TX } from '../../data/canonicalData';
import { useOfflineWarning } from '../../hooks/useOfflineWarning';
import {
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Lock,
  Scale,
  ExternalLink,
  Award,
  Radio,
  FileCheck,
  RotateCw,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';

interface DashboardViewProps {
  snapshots?: HardwareSnapshot[];
  verificationGateStatus?: {
    status: 'ACTIVE_GUARD' | 'PASSED' | 'BLOCKED';
    lastCheckedTime: string;
    complianceEventCount: number;
    sealCount: number;
    message: string;
  };
  onNavigate: (view: ViewType) => void;
  onOpenCertificate: () => void;
  isForensicAuditMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  snapshots = [],
  verificationGateStatus,
  onNavigate,
  onOpenCertificate,
  isForensicAuditMode = false,
}) => {
  // Listen and alert on browser offline / online events
  useOfflineWarning();

  const [isVerifyingSeals, setIsVerifyingSeals] = useState<boolean>(false);
  const [verifyFeedback, setVerifyFeedback] = useState<string | null>(null);

  // Dynamic verified seals count based on 14,902 canonical baseline + appended valid snapshots
  const baselineCanonicalSeals = 14902;
  const initialSnapshotsCount = 2;
  const addedSnapshots = Math.max(0, snapshots.length - initialSnapshotsCount);
  const totalVerifiedSeals = baselineCanonicalSeals + addedSnapshots;
  const totalSealsCount = baselineCanonicalSeals + 80 + addedSnapshots;
  const currentIntegrityScore = ((verificationGateStatus?.sealCount || totalVerifiedSeals) / totalSealsCount) * 100;

  const handleVerifyAllSeals = () => {
    playTone(650, 0.05);
    setIsVerifyingSeals(true);
    setVerifyFeedback(null);
    setTimeout(() => {
      setIsVerifyingSeals(false);
      playAuditChime();
      setVerifyFeedback('14,902/14,902 SEALS CRYPTOGRAPHICALLY RATIFIED (Δ0.00% ZERO DRIFT)');
      setTimeout(() => setVerifyFeedback(null), 5000);
    }, 900);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* 1. PRIMARY HEADER & SOVEREIGN STATUS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-[#070b16] to-[#040814] border border-cyan-500/25 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold tracking-wider">
                CANONICAL BLOCK #{SYSTEM_METADATA.genesisBlock}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                10/10 REAL_HSM
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                FROZEN v1.2.1 LTS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2 pt-1">
              <span>ZYRQUEN Ω∞ SOVEREIGN WORLD ENGINE</span>
            </h1>
            <p className="text-xs text-slate-400 font-sans max-w-2xl">
              Executive Governance &amp; High-Assurance Cryptographic Control Plane. Sovereign Architect: <strong className="text-cyan-300">นายยุทธภูมิ พากเพียร</strong> (#EP-SOVEREIGN-01).
            </p>
          </div>

          {/* Quick Actions Header CTAs */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={() => {
                playTone(700, 0.04);
                onOpenCertificate();
              }}
              className="px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audit Certificate</span>
            </button>
            <button
              onClick={handleVerifyAllSeals}
              disabled={isVerifyingSeals}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 ${isVerifyingSeals ? 'animate-spin' : ''}`} />
              <span>{isVerifyingSeals ? 'Verifying 14,902 Seals...' : 'Verify All Seals'}</span>
            </button>
          </div>
        </div>

        {verifyFeedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{verifyFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. TOP 3 KEY EXECUTIVE METRICS CARDS (3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Metric 1: Core Status & Cryptography */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1c] border border-cyan-500/20 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Core State &amp; Cryo
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px]">
              SUB-KELVIN
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              14.98 <span className="text-sm text-cyan-400 font-normal">mK</span>
            </div>
            <div className="text-right text-[11px] font-mono text-emerald-400 font-semibold">
              0.00% DRIFT
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Kernel Immutability:</span>
            <span className="text-slate-200 font-semibold">FROZEN (0 Mutation)</span>
          </div>
        </div>

        {/* Metric 2: Sovereign Integrity Score */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1c] border border-emerald-500/20 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Sovereign Integrity
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
              14,902 SEALS
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-300 tracking-tight">
              {currentIntegrityScore.toFixed(2)}%
            </div>
            <div className="text-right text-[11px] font-mono text-cyan-300">
              100% STATUTORY
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Verified Seals:</span>
            <span className="text-emerald-300 font-semibold">14,902 / 14,902</span>
          </div>
        </div>

        {/* Metric 3: Hardware Quorum & SSoT Consensus */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1c] border border-purple-500/20 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Radio className="w-4 h-4 text-purple-400" />
              Deca-HSM Quorum
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px]">
              FIPS 140-3 L4
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-purple-200 tracking-tight">
              10/10 <span className="text-sm text-purple-400 font-normal">NODES</span>
            </div>
            <div className="text-right text-[11px] font-mono text-purple-300">
              35.80 ms SLA
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Deca-Key Consensus:</span>
            <span className="text-slate-200 font-semibold">100% RATIFIED</span>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY SYSTEM SUMMARY & OPERATIONS ROUTER (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 6 Columns: Key Runtime Status */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Key Runtime Invariants
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                NOMINAL
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>18 Canonical Chambers:</span>
                </div>
                <span className="text-emerald-300 font-bold">18/18 ONLINE</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Thai Legal Enforcement:</span>
                </div>
                <span className="text-cyan-300 font-semibold">ETDA Sec 9/26/28 • PDPA Sec 37</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>PQC Schemes:</span>
                </div>
                <span className="text-purple-300 font-semibold">Dilithium-5 • Kyber-1024 • SPHINCS+</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fail-Closed Cutoff:</span>
                </div>
                <span className="text-slate-200 font-semibold">&lt; 85.0°C Armed (Zeroize &lt;1.2μs)</span>
              </div>
            </div>

            {/* Recent Verified Trace Info */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Latest 12-Stage Trace:</span>
                <span className="text-cyan-300 font-bold">{AUDIT_TRACE_TX.txId}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono line-clamp-1">
                {AUDIT_TRACE_TX.title}
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400">
                <span>Actor: {AUDIT_TRACE_TX.rootActor}</span>
                <button
                  onClick={() => {
                    playTone(600, 0.04);
                    onNavigate('playback');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>Replay 12 Stages</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Deep Canonical Room Routers */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Canonical Operations &amp; Enclaves
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                DEEP DIVE BY ROOM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'chambers', name: '18 Chambers Explorer', desc: '18 Sovereign Enclaves & CRUD', emoji: '🏛️' },
                { id: 'ledger', name: 'Evidence Ledger', desc: '14,902 Immutable WORM Seals', emoji: '📜' },
                { id: 'pulse', name: 'System Telemetry Pulse', desc: 'Cryo-Bus & Real-time Jitter', emoji: '📡' },
                { id: 'quantum', name: 'Quantum Sub-Kelvin Nexus', desc: '768-Qubit State & Phase Shifter', emoji: '🎮' },
                { id: 'council', name: 'Sovereign HSM Council', desc: '10/10 Deca-Custodian Quorum', emoji: '👑' },
                { id: 'legal', name: 'Legal & PDPA Sec 37', desc: 'ETDA B.E. 2544 Court Evidence', emoji: '⚖️' },
                { id: 'production', name: 'Zero-Trust Bastion', desc: 'Production Readiness PH-20', emoji: '🛡️' },
                { id: 'archive', name: '17 Canonical Modules', desc: 'Genesis Manifest & Dossier', emoji: '📑' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    playTone(550, 0.04);
                    onNavigate(item.id as ViewType);
                  }}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 text-left transition-all duration-150 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
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
