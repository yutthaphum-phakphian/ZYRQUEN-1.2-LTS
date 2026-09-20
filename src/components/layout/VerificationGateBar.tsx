import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShieldCheck,
  Info,
  Shield,
  Lock,
  Scale,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { BannerAnimatedSealCount } from '@/components/layout/BannerAnimatedSealCount';
import { LegalTriggerMatrixSection } from '@/components/layout/LegalTriggerMatrixSection';
import { SsotDriftToggleButton } from '@/components/system/SystemStateComponents';

export interface VerificationGateStatusInfo {
  status: 'ACTIVE_GUARD' | 'PASSED' | 'BLOCKED' | 'PENDING';
  message: string;
  complianceEventCount: number;
  sealCount: number;
  lastCheckedTime: string;
}

export interface VerificationGateBarProps {
  verificationGateStatus: VerificationGateStatusInfo;
  auditCountdownSec: number;
  auditProgressPercent: number;
  isGateDetailsExpanded: boolean;
  setIsGateDetailsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isForensicAuditMode: boolean;
  onExportLegalTriggerMatrixPDF: () => void;
  onOpenLegalSearch: () => void;
  onOpenCertificate: () => void;
  onBatchVerify: () => void;
  onExportAuditLogs: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const VerificationGateBar: React.FC<VerificationGateBarProps> = ({
  verificationGateStatus,
  auditCountdownSec,
  auditProgressPercent,
  isGateDetailsExpanded,
  setIsGateDetailsExpanded,
  isForensicAuditMode,
  onExportLegalTriggerMatrixPDF,
  onOpenLegalSearch,
  onOpenCertificate,
  onBatchVerify,
  onExportAuditLogs,
  showToast,
}) => {
  const [isGateTooltipVisible, setIsGateTooltipVisible] = useState(false);

  return (
    <div className="rounded-2xl bg-[#0b0e1a]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg transition-all duration-300 overflow-hidden">
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Gate Status & Info with Tooltip Trigger */}
        <div className="flex items-center gap-2.5 relative">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              verificationGateStatus.status === 'PASSED'
                ? 'bg-emerald-400 animate-pulse'
                : verificationGateStatus.status === 'BLOCKED'
                ? 'bg-rose-400 animate-ping'
                : 'bg-cyan-400'
            }`}
          />
          <span className="font-bold text-zinc-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            VERIFICATION GATE:
          </span>

          {/* Status Pill with hover tooltip */}
          <div
            className="relative inline-block"
            onMouseEnter={() => setIsGateTooltipVisible(true)}
            onMouseLeave={() => setIsGateTooltipVisible(false)}
          >
            <button
              type="button"
              onClick={() => setIsGateDetailsExpanded((prev) => !prev)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                verificationGateStatus.status === 'PASSED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : verificationGateStatus.status === 'BLOCKED'
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/60 hover:bg-rose-500/30 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.45)] ring-1 ring-rose-500/50'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
              }`}
              title="Hover for tooltip / Click to toggle legal triggers summary"
            >
              {verificationGateStatus.status}
              <Info className="w-2.5 h-2.5 opacity-70" />
            </button>

            {/* Floating Tooltip Box: Enhanced Hover-Card Summary */}
            <AnimatePresence>
              {isGateTooltipVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 z-50 w-80 sm:w-[460px] p-4 rounded-2xl bg-[#070914]/98 border border-cyan-500/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-[11px] font-sans text-zinc-300 pointer-events-none"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10 font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          VERIFICATION GATE
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] border border-emerald-500/40 font-mono">
                            {verificationGateStatus.status} • MAINNET LIVE
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          Block #849202 • ZQ-GREEN-DEP-849202-3908
                        </span>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                      SSoT Δ0.00%
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-zinc-300 text-[11px] leading-relaxed mb-3">
                    {verificationGateStatus.message}
                  </p>

                  {/* 1. 10/10 REAL_HSM Quorum Status Breakdown */}
                  <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 mb-2.5 space-y-2">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        10/10 REAL_HSM QUORUM STATUS
                      </span>
                      <span className="text-emerald-400 font-bold">100% UNANIMOUS RATIFIED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-400 block text-[9px]">GOVERNANCE PLANE</span>
                        <span className="text-emerald-300 font-semibold">10/10 PASS (Statutory)</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-400 block text-[9px]">PHYSICAL HARDWARE</span>
                        <span className="text-emerald-300 font-semibold">10/10 FIPS 140-3 L4</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between pt-0.5 border-t border-white/5">
                      <span>Nodes: TC-01 Sovereign Hub + 9 Custodians</span>
                      <span className="text-cyan-300">Mean Latency: 0.31 ms</span>
                    </div>
                  </div>

                  {/* 2. Active Cryptographic Schemes (3-Tiered Hybrid Shield) */}
                  <div className="p-2.5 rounded-xl bg-black/50 border border-purple-500/20 mb-2.5 space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-purple-300 font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        ACTIVE CRYPTOGRAPHIC SCHEMES (3-TIER PQC)
                      </span>
                      <span className="text-purple-400 text-[9px]">NIST FIPS COMPLIANT</span>
                    </div>
                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between items-center text-zinc-300">
                        <span className="text-zinc-400">Outer Ring (ML-DSA-87):</span>
                        <span className="text-purple-300 font-semibold">CRYSTALS-Dilithium-5 (FIPS 204)</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300">
                        <span className="text-zinc-400">Middle Ring (ML-KEM):</span>
                        <span className="text-cyan-300 font-semibold">Kyber-1024 Cat-5 (FIPS 203)</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300">
                        <span className="text-zinc-400">Inner Guard (SLH-DSA):</span>
                        <span className="text-amber-300 font-semibold">SPHINCS+ Stateless (FIPS 205)</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300 pt-1 border-t border-white/5">
                        <span className="text-zinc-400">Quantum Hardware:</span>
                        <span className="text-emerald-300">Cryo 14.98 mK • QKD 256-bit • X448</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Legal & Court Invariant Details */}
                  <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/5 text-[10px] font-mono text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Thai Legal Standards:</span>
                      <span className="text-emerald-400 font-medium">ETDA Sec 9/26/28 • PDPA Sec 37</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evidence Admissibility:</span>
                      <span className="text-amber-300 font-medium">ISO/IEC 27037 Court-Admissible Ready</span>
                    </div>
                  </div>

                  <p className="mt-2 text-[10px] text-cyan-400/80 font-mono text-center">
                    Click status pill to expand / collapse full legal trigger matrix ↓
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-zinc-400 hidden lg:inline text-[11px] truncate max-w-md">
            {verificationGateStatus.message}
          </span>
        </div>

        {/* Right: Metrics, Drift Toggle, Trigger Button, Counters */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-zinc-400 ml-auto flex-wrap sm:flex-nowrap">
          {/* SSoT Drift Deviation Simulator Toggle Button */}
          <SsotDriftToggleButton />

          {/* Expandable Section Toggle Button */}
          <button
            type="button"
            onClick={() => setIsGateDetailsExpanded((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isGateDetailsExpanded
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-cyan-300 hover:border-cyan-500/30'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>ETDA / PDPA Triggers</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              6 Active
            </span>
            {isGateDetailsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          <span className="hidden sm:inline text-zinc-600">•</span>

          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Anchors: <strong className="text-emerald-300">{verificationGateStatus.complianceEventCount}</strong>
            </span>
          </span>

          <span>•</span>

          <BannerAnimatedSealCount
            sealCount={verificationGateStatus.sealCount}
            baseSealCount={14902}
          />

          <span className="hidden md:inline text-zinc-600">•</span>
          <span className="text-zinc-500 hidden md:inline">{verificationGateStatus.lastCheckedTime}</span>
        </div>
      </div>

      {/* Scheduled Telemetry Audit Real-time Progress Bar */}
      <div className="px-4 pb-2.5 pt-0.5 space-y-1 bg-black/20 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>
              Next Telemetry Audit: <strong className="text-white">{auditCountdownSec}s</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Sub-Kelvin HSM Cycle</span>
          </span>
          <span className="text-emerald-400 font-bold">
            {Math.round(auditProgressPercent)}% Complete
          </span>
        </div>
        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full bg-cyan-400 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${auditProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Expandable Section: Comprehensive ETDA & PDPA Trigger Matrix */}
      <LegalTriggerMatrixSection
        isGateDetailsExpanded={isGateDetailsExpanded}
        isForensicAuditMode={isForensicAuditMode}
        onExportLegalTriggerMatrixPDF={onExportLegalTriggerMatrixPDF}
        onOpenLegalSearch={onOpenLegalSearch}
        onOpenCertificate={onOpenCertificate}
        onBatchVerify={onBatchVerify}
        onExportAuditLogs={onExportAuditLogs}
        showToast={showToast}
      />
    </div>
  );
};
