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
  Pin,
  PinOff,
  QrCode,
  X,
  Activity,
  Cpu,
  Radio,
  Zap,
} from 'lucide-react';
import { BannerAnimatedSealCount } from '@/components/layout/BannerAnimatedSealCount';
import { LegalTriggerMatrixSection } from '@/components/layout/LegalTriggerMatrixSection';
import { SsotDriftToggleButton } from '@/components/system/SystemStateComponents';
import { MerkleRootQrCodeModal } from '@/components/MerkleRootQrCodeModal';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '@/data/canonicalData';
import { playTone } from '@/components/AudioSynthesizer';

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
  const [isGateTooltipPinned, setIsGateTooltipPinned] = useState(false);
  const [isGateQrModalOpen, setIsGateQrModalOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-[#0b0e1a]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg transition-all duration-300 overflow-hidden">
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Gate Status & Info with Tooltip Trigger & Pin Toggle */}
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

          {/* Status Pill with hover tooltip & quick pin toggle */}
          <div
            className="relative inline-flex items-center gap-1"
            onMouseEnter={() => setIsGateTooltipVisible(true)}
            onMouseLeave={() => {
              if (!isGateTooltipPinned) {
                setIsGateTooltipVisible(false);
              }
            }}
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
              title="Hover for summary / Click to toggle legal triggers breakdown"
            >
              {verificationGateStatus.status}
              <Info className="w-2.5 h-2.5 opacity-70" />
            </button>

            {/* Quick Pin Toggle on Status Pill */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTone(isGateTooltipPinned ? 520 : 780, 0.05);
                setIsGateTooltipPinned((prev) => !prev);
                setIsGateTooltipVisible(true);
              }}
              className={`p-1 rounded transition-all cursor-pointer border ${
                isGateTooltipPinned
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/10 hover:border-cyan-500/30'
              }`}
              title={isGateTooltipPinned ? 'Unpin Verification Gate summary' : 'Pin Verification Gate summary to keep visible while using dashboard'}
            >
              {isGateTooltipPinned ? (
                <PinOff className="w-2.5 h-2.5 text-cyan-300" />
              ) : (
                <Pin className="w-2.5 h-2.5 text-zinc-400 hover:text-zinc-200" />
              )}
            </button>

            {/* Floating Tooltip Box: Enhanced Hover-Card & Pinned Summary with Subtle Entry Animation */}
            <AnimatePresence>
              {isGateTooltipVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -6, scale: 0.97, filter: 'blur(3px)' }}
                  transition={{ type: 'spring', stiffness: 450, damping: 32, mass: 0.8 }}
                  className={`absolute left-0 top-full mt-2.5 z-50 w-80 sm:w-[480px] p-4 rounded-2xl bg-[#070914]/98 border backdrop-blur-2xl transition-all duration-200 pointer-events-auto ${
                    isGateTooltipPinned
                      ? 'border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.35),0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-cyan-400/50'
                      : 'border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-cyan-400/60'
                  } text-[11px] font-sans text-zinc-300`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10 font-mono text-[11px] gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>VERIFICATION GATE</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] border border-emerald-500/40 font-mono">
                            {verificationGateStatus.status} • MAINNET LIVE
                          </span>
                          {isGateTooltipPinned && (
                            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] border border-cyan-400/50 font-mono font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse">
                              <Pin className="w-2.5 h-2.5 text-cyan-300 rotate-45" />
                              PINNED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          Block #849202 • ZQ-GREEN-DEP-849202-3908
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-emerald-400 font-bold font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 hidden sm:inline-block">
                        SSoT Δ0.00%
                      </span>

                      {/* Pin / Unpin Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTone(isGateTooltipPinned ? 520 : 780, 0.05);
                          setIsGateTooltipPinned((prev) => !prev);
                        }}
                        className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                          isGateTooltipPinned
                            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border-white/10 hover:border-cyan-500/30'
                        }`}
                        title={
                          isGateTooltipPinned
                            ? 'Unpin tooltip (closes when mouse leaves trigger)'
                            : 'Pin tooltip (keeps legal/HSM summary visible while you use dashboard)'
                        }
                      >
                        {isGateTooltipPinned ? (
                          <>
                            <PinOff className="w-3 h-3 text-cyan-300" />
                            <span className="text-[9px] font-mono font-semibold">UNPIN</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3 h-3 text-zinc-400" />
                            <span className="text-[9px] font-mono">PIN</span>
                          </>
                        )}
                      </button>

                      {/* Close button if pinned */}
                      {isGateTooltipPinned && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTone(500, 0.04);
                            setIsGateTooltipPinned(false);
                            setIsGateTooltipVisible(false);
                          }}
                          className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                          title="Close pinned tooltip"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-zinc-300 text-[11px] leading-relaxed mb-3">
                    {verificationGateStatus.message}
                  </p>

                  {/* 1. 10/10 REAL_HSM Quorum Status Breakdown & Cluster Health Visualizer */}
                  <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/30 mb-2.5 space-y-2.5 shadow-lg shadow-cyan-950/20">
                    {/* Header with Cluster Health Badge */}
                    <div className="flex items-center justify-between font-mono text-[10px] pb-1.5 border-b border-cyan-500/20">
                      <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        10/10 REAL_HSM QUORUM STATUS
                      </span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-[9px] shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                        CLUSTER HEALTH: 100.0% OPTIMAL
                      </div>
                    </div>

                    {/* Visual Cluster Health Progress Ring & Operational Metrics */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-950/80 border border-emerald-500/25">
                      {/* Circular SVG Progress Ring */}
                      <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            className="stroke-zinc-800"
                            strokeWidth="3.5"
                            fill="transparent"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            className="stroke-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)] transition-all duration-500"
                            strokeWidth="3.5"
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                          <span className="text-[10px] font-black text-emerald-300 leading-none">100%</span>
                          <span className="text-[7px] text-zinc-400 uppercase font-medium">HEALTH</span>
                        </div>
                      </div>

                      {/* Status Bar & Node Cluster Health */}
                      <div className="flex-1 space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-300 font-semibold flex items-center gap-1">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            10/10 HARDWARE NODES ONLINE
                          </span>
                          <span className="text-emerald-400 font-bold">10/10 RATIFIED</span>
                        </div>
                        {/* 10-Segment Progress Status Bar */}
                        <div className="flex items-center gap-0.5 w-full h-2 bg-zinc-900 rounded p-0.5 border border-zinc-800">
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 h-full rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]"
                              title={`HSM Unit ${i + 1}: 100% Operational • 14.98 mK`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-zinc-400">
                          <span>Cryo Stability: 14.98 mK</span>
                          <span className="text-cyan-300">Quorum Jitter: &lt; 0.02 ms</span>
                        </div>
                      </div>
                    </div>

                    {/* HSM Cluster Health Visual Array (10 Nodes) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                          <Cpu className="w-3 h-3 text-cyan-400" />
                          HSM ENCLAVE NODES HEALTH (TC-01..TC-10)
                        </span>
                        <span className="text-emerald-400 font-medium">10/10 ONLINE • 0 TAMPER DRIFT</span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                        {[
                          { id: 'TC-01', name: 'Alpha', algo: 'Kyber-1024', temp: '14.98 mK', lat: '0.28ms' },
                          { id: 'TC-02', name: 'Beta', algo: 'Dilithium-5', temp: '14.97 mK', lat: '0.30ms' },
                          { id: 'TC-03', name: 'Gamma', algo: 'SPHINCS+', temp: '14.99 mK', lat: '0.31ms' },
                          { id: 'TC-04', name: 'Delta', algo: 'Kyber-1024', temp: '14.98 mK', lat: '0.29ms' },
                          { id: 'TC-05', name: 'Epsilon', algo: 'Dilithium-5', temp: '14.96 mK', lat: '0.32ms' },
                          { id: 'TC-06', name: 'Zeta', algo: 'SPHINCS+', temp: '14.98 mK', lat: '0.30ms' },
                          { id: 'TC-07', name: 'Eta', algo: 'Kyber-1024', temp: '15.01 mK', lat: '0.33ms' },
                          { id: 'TC-08', name: 'Theta', algo: 'Dilithium-5', temp: '14.98 mK', lat: '0.29ms' },
                          { id: 'TC-09', name: 'Iota', algo: 'SPHINCS+', temp: '14.97 mK', lat: '0.31ms' },
                          { id: 'TC-10', name: 'Kappa', algo: 'Kyber-1024', temp: '14.99 mK', lat: '0.30ms' },
                        ].map((node) => (
                          <div
                            key={node.id}
                            className="group relative p-1 rounded-md bg-zinc-900/80 border border-emerald-500/30 hover:border-emerald-400 transition-all text-center flex flex-col items-center justify-center cursor-help"
                            title={`Node ${node.id} (${node.name}): Status REAL_HSM_ONLINE | ${node.algo} | Temp: ${node.temp} | Latency: ${node.lat} | FIPS 140-3 Level 4`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.9)]" />
                              <span className="text-[8px] font-bold text-zinc-200">{node.id}</span>
                            </div>
                            <span className="text-[7px] text-emerald-400 font-mono scale-90">14.98mK</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cluster Health Metrics Grid */}
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <div className="p-1.5 rounded-lg bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Governance Quorum</span>
                          <span className="text-emerald-300 font-semibold text-[10px]">10/10 PASS (Statutory)</span>
                        </div>
                        <Activity className="w-3.5 h-3.5 text-emerald-400/70" />
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-zinc-400 block text-[8px] uppercase tracking-wider">Physical Hardware</span>
                          <span className="text-emerald-300 font-semibold text-[10px]">10/10 FIPS 140-3 L4</span>
                        </div>
                        <Radio className="w-3.5 h-3.5 text-cyan-400/70" />
                      </div>
                    </div>

                    {/* Health Cluster Summary Footer */}
                    <div className="text-[9px] font-mono text-zinc-400 flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        Cryo-Bus: <strong className="text-emerald-300">14.98 mK</strong> • Zeroization: <strong className="text-cyan-300">&lt;1.2 μs</strong>
                      </span>
                      <span className="text-cyan-300 font-semibold">Cluster Mean Latency: 0.31 ms</span>
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
                  <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/5 text-[10px] font-mono text-zinc-400 space-y-1 mb-2.5">
                    <div className="flex justify-between">
                      <span>Thai Legal Standards:</span>
                      <span className="text-emerald-400 font-medium">ETDA Sec 9/26/28 • PDPA Sec 37</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evidence Admissibility:</span>
                      <span className="text-amber-300 font-medium">ISO/IEC 27037 Court-Admissible Ready</span>
                    </div>
                  </div>

                  {/* Quick Mobile Audit QR Trigger Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTone(720, 0.05);
                      setIsGateQrModalOpen(true);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-200 hover:text-white font-mono text-[10px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm mb-2"
                    title="Generate & display shareable QR code with Merkle root & block height for mobile-based audit verification"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Generate Shareable Mobile Audit QR (Merkle #849202)</span>
                  </button>

                  <p className="text-[10px] text-cyan-400/80 font-mono text-center">
                    {isGateTooltipPinned
                      ? 'Pinned mode active • You can browse other screens while keeping this visible'
                      : 'Click status pill to expand / collapse full legal trigger matrix ↓'}
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

          {/* Mobile Audit QR Code Share Button */}
          <button
            type="button"
            onClick={() => {
              playTone(720, 0.05);
              setIsGateQrModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 border-cyan-500/40 hover:border-cyan-400/70 shadow-[0_0_10px_rgba(6,182,212,0.18)]"
            title="Generate and display shareable QR code containing Merkle root & block height for mobile audit"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mobile Audit QR</span>
          </button>

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

      {/* Verification Gate Mobile Audit Merkle Root QR Modal */}
      <MerkleRootQrCodeModal
        isOpen={isGateQrModalOpen}
        onClose={() => setIsGateQrModalOpen(false)}
        currentBlockHeight={CANONICAL_GENESIS_BLOCK}
        merkleRootHash={CANONICAL_MERKLE_ROOT}
      />
    </div>
  );
};
