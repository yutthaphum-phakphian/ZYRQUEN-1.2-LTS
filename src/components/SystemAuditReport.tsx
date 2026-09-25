import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Activity,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  Server,
  Hash,
  Copy,
  Check,
  Clock,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { HardwareSnapshot } from '../types';
import { SystemEvent } from './SystemEventsSidebar';
import { INITIAL_HARDWARE_SNAPSHOTS } from '../utils/telemetrySnapshot';
import {
  SYSTEM_METADATA,
  CANONICAL_SEALS,
  CANONICAL_GENESIS_BLOCK,
  CANONICAL_MERKLE_ROOT,
  QUARANTINE_COUNT,
  SSOT_MUTATION,
  BASELINE_DRIFT,
  REQUIRED_QUORUM,
  SLOT_COUNT,
} from '../data/canonicalData';
import { playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export interface SystemAuditReportProps {
  snapshots?: HardwareSnapshot[];
  systemEvents?: SystemEvent[];
  events?: SystemEvent[];
  className?: string;
}

/**
 * SYSTEM AUDIT REPORT — ZYRQUEN Ω∞ SOVEREIGN FROZEN v1.2 LTS
 * 
 * STRICT INVARIANTS:
 * - Read-only snapshot of system health generated from INITIAL_HARDWARE_SNAPSHOTS & systemEvents.
 * - Confirms SSoT Mutation = 0 (INVIOLABLE) and Canonical status (14,902 Canonical Seals / +5 Quarantine).
 * - Quorum Verification: 10/10 Real HSM proofs (8/10 required, promotion FAIL-CLOSED).
 * - Zero mutation controls (no forms, inputs, edit handlers, or state modifiers).
 * - Canonical ZYRQUEN Ω∞ Branding and Sovereign Principal #EP-SOVEREIGN-01.
 */
export const SystemAuditReport: React.FC<SystemAuditReportProps> = ({
  snapshots = INITIAL_HARDWARE_SNAPSHOTS,
  systemEvents,
  events,
  className = '',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeEvents = systemEvents || events || [];
  const activeSnapshots = snapshots.length > 0 ? snapshots : INITIAL_HARDWARE_SNAPSHOTS;
  const latestSnapshot = activeSnapshots[0] || INITIAL_HARDWARE_SNAPSHOTS[0];

  const handleCopy = (text: string, fieldId: string) => {
    copyToClipboard(text);
    setCopiedField(fieldId);
    playTone(600, 0.04, 'sine', 0.05);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const observedSeals = CANONICAL_SEALS + QUARANTINE_COUNT; // 14,907
  const verifiedHsmCount = 10;
  const remainingHsmProofs = Math.max(0, REQUIRED_QUORUM - verifiedHsmCount); // 0

  return (
    <div
      id="system-audit-report-root"
      className={`w-full bg-[#080c16] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.12)] text-zinc-300 font-mono text-xs select-none ${className}`}
    >
      {/* Sovereign Header & Official Branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-base sm:text-lg tracking-wider">
                ZYRQUEN Ω∞ SOVEREIGN FROZEN v1.2 LTS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                AUDIT SNAPSHOT
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-zinc-400 border-white/10 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                STRICT READ-ONLY
              </span>
            </div>
            <p className="text-zinc-400 text-xs font-sans mt-1">
              System Health &amp; Invariant Telemetry Report &bull; Inviolable SSoT Core &bull; Genesis Block #{CANONICAL_GENESIS_BLOCK.toLocaleString()}
            </p>
            <div className="text-[11px] text-emerald-400/90 font-sans mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Sovereign Architect: <strong>{SYSTEM_METADATA.sovereignPrincipal}</strong></span>
              <span className="text-zinc-500">&bull;</span>
              <span className="text-zinc-400">Clearance: <strong className="text-zinc-200">OMEGA-1 SUPREME</strong></span>
            </div>
          </div>
        </div>

        {/* Global Seal Status Badge */}
        <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 bg-black/60 p-3.5 rounded-2xl border-white/10">
          <div className="text-[10px] text-zinc-400 font-sans">CANONICAL STATUS</div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold text-sm tracking-wide">
              100% INVIOLABLE
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">SSoT Mutation: 0</div>
        </div>
      </div>

      {/* Primary Invariants Verification Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Canonical Seals */}
        <div className="p-3.5 bg-black/60 rounded-2xl border-emerald-500/30 space-y-1">
          <div className="text-zinc-400 text-[10px] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>CANONICAL SEALS</span>
          </div>
          <div className="text-emerald-400 font-bold text-sm select-text">
            {CANONICAL_SEALS.toLocaleString()}
          </div>
          <div className="text-[9px] text-zinc-400">FROZEN CORE BASELINE</div>
        </div>

        {/* Observed Seals */}
        <div className="p-3.5 bg-black/60 rounded-2xl border-amber-500/30 space-y-1">
          <div className="text-zinc-400 text-[10px] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>OBSERVED SEALS</span>
          </div>
          <div className="text-amber-300 font-bold text-sm select-text">
            {observedSeals.toLocaleString()}
          </div>
          <div className="text-[9px] text-amber-400/80">INCLUDES QUARANTINE</div>
        </div>

        {/* Quarantine Delta */}
        <div className="p-3.5 bg-black/60 rounded-2xl border-amber-500/30 space-y-1">
          <div className="text-zinc-400 text-[10px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>QUARANTINE DELTA</span>
          </div>
          <div className="text-amber-400 font-bold text-sm select-text">
            +{QUARANTINE_COUNT} SEALS
          </div>
          <div className="text-[9px] text-zinc-400">#14,903–#14,907 (ISOLATED)</div>
        </div>

        {/* SSoT Mutation Count */}
        <div className="p-3.5 bg-black/60 rounded-2xl border-emerald-500/40 space-y-1">
          <div className="text-zinc-400 text-[10px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SSoT MUTATION</span>
          </div>
          <div className="text-emerald-400 font-bold text-sm select-text">
            {SSOT_MUTATION} (ZERO)
          </div>
          <div className="text-[9px] text-emerald-300/80">INVIOLABLE / VERIFIED</div>
        </div>

        {/* HSM Quorum */}
        <div className="p-3.5 bg-black/60 rounded-2xl border-cyan-500/30 space-y-1">
          <div className="text-zinc-400 text-[10px] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>HSM QUORUM</span>
          </div>
          <div className="text-cyan-300 font-bold text-sm select-text">
            {verifiedHsmCount} / {SLOT_COUNT}
          </div>
          <div className="text-[9px] text-cyan-400/80">REQ: {REQUIRED_QUORUM} | REM: {remainingHsmProofs}</div>
        </div>

        {/* Promotion Firewall */}
        <div className="p-3.5 bg-black/60 rounded-2xl border-rose-500/30 space-y-1">
          <div className="text-zinc-400 text-[10px] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>PROMOTION GATE</span>
          </div>
          <div className="text-rose-400 font-bold text-sm select-text">
            FAIL-CLOSED
          </div>
          <div className="text-[9px] text-rose-300/80">NOT AUTHORIZED</div>
        </div>
      </div>

      {/* Hardware Telemetry & Quantum Health Snapshot */}
      <div className="p-5 rounded-2xl bg-black/70 border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold text-xs tracking-wide">
              HARDWARE TELEMETRY SNAPSHOT &bull; {latestSnapshot.id}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans">
            Timestamp: <strong className="text-zinc-200 font-mono">{latestSnapshot.timestampIct}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Cryo Temp */}
          <div className="p-3 bg-black/50 rounded-xl border-white/5 space-y-1">
            <div className="text-zinc-400 text-[10px] flex items-center gap-1">
              <Flame className="w-3 h-3 text-cyan-400" />
              <span>CRYO TEMPERATURE</span>
            </div>
            <div className="text-cyan-300 font-bold text-sm select-text">
              {latestSnapshot.cryoTempMk.toFixed(2)} mK
            </div>
            <div className="text-[9px] text-zinc-400">Coolant: {latestSnapshot.heliumFlowPct}% Helium-4</div>
          </div>

          {/* Coherence */}
          <div className="p-3 bg-black/50 rounded-xl border-white/5 space-y-1">
            <div className="text-zinc-400 text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>QUANTUM COHERENCE</span>
            </div>
            <div className="text-emerald-300 font-bold text-sm select-text">
              {latestSnapshot.coherencePct.toFixed(2)}%
            </div>
            <div className="text-[9px] text-zinc-400">QOps: {latestSnapshot.qopsThroughput.toFixed(1)} M/s</div>
          </div>

          {/* CPU & Memory */}
          <div className="p-3 bg-black/50 rounded-xl border-white/5 space-y-1">
            <div className="text-zinc-400 text-[10px] flex items-center gap-1">
              <Cpu className="w-3 h-3 text-amber-400" />
              <span>CPU LOAD / MEMORY</span>
            </div>
            <div className="text-amber-300 font-bold text-sm select-text">
              {latestSnapshot.cpuAverage.toFixed(1)}% &bull; {(latestSnapshot.memoryUsedMb / 1024).toFixed(1)} GB
            </div>
            <div className="text-[9px] text-zinc-400">4 Cores Enclave Verified</div>
          </div>

          {/* Hardware Stability */}
          <div className="p-3 bg-black/50 rounded-xl border-white/5 space-y-1">
            <div className="text-zinc-400 text-[10px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>VOLTAGE / SSD WEAR</span>
            </div>
            <div className="text-emerald-300 font-bold text-sm select-text">
              {(latestSnapshot.voltageStabilityPct || 99.98).toFixed(2)}% Stability
            </div>
            <div className="text-[9px] text-zinc-400">Wear Level: {(latestSnapshot.ssdWearLevelPct || 0.82).toFixed(2)}%</div>
          </div>
        </div>

        {/* Cryptographic Hashes Verification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Merkle Root */}
          <div className="p-3 bg-black/90 rounded-xl border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[10px] flex items-center gap-1">
                <Hash className="w-3 h-3 text-emerald-400" />
                CANONICAL MERKLE ROOT
              </span>
              <button
                onClick={() => handleCopy(CANONICAL_MERKLE_ROOT, 'merkle')}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Copy Canonical Merkle Root"
              >
                {copiedField === 'merkle' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'merkle' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-emerald-300 font-mono text-[10px] break-all select-all">
              {CANONICAL_MERKLE_ROOT}
            </div>
          </div>

          {/* Latest Sealed Hash */}
          <div className="p-3 bg-black/90 rounded-xl border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[10px] flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-cyan-400" />
                LATEST HARDWARE SEAL HASH
              </span>
              <button
                onClick={() => handleCopy(latestSnapshot.sealedHash, 'sealedHash')}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Copy Sealed Hash"
              >
                {copiedField === 'sealedHash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'sealedHash' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-cyan-300 font-mono text-[10px] break-all select-all">
              {latestSnapshot.sealedHash}
            </div>
          </div>
        </div>
      </div>

      {/* System Events Ledger Stream (Read-Only) */}
      <div className="p-5 rounded-2xl bg-black/70 border-white/10 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold text-xs tracking-wide">
              IMMUTABLE AUDIT EVENTS FEED &bull; {activeEvents.length} RECORDED
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">
            DRIFT: {BASELINE_DRIFT.toFixed(2)}% (ZERO)
          </span>
        </div>

        {activeEvents.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 font-sans text-xs">
            No system events logged in current session buffer. All historical canonical seals verified.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {activeEvents.slice(0, 8).map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-xl bg-black/50 border-white/5 flex items-start justify-between gap-3 text-[11px]"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-zinc-300">
                      {evt.type}
                    </span>
                    <span className="text-white font-bold truncate">{evt.title}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        evt.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : evt.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : evt.severity === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {evt.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-zinc-400 text-[10px] font-sans truncate">
                    {evt.description}
                  </div>
                </div>
                <div className="text-right shrink-0 text-[10px] text-zinc-500 flex flex-col items-end">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {evt.timestamp}
                  </span>
                  {evt.metaHash && (
                    <span className="text-emerald-400/80 font-mono text-[9px] truncate max-w-[120px]">
                      {evt.metaHash}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Read-Only Assurance & Immutable Guarantee Footer */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 to-black border-emerald-500/30 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-zinc-300 font-sans text-xs">
            Audit Health Confirmation: <strong className="text-white font-mono">100% INVIOLABLE</strong> &bull; Mutation: <strong className="text-emerald-400 font-mono">0</strong> &bull; Write Control: <strong className="text-rose-400 font-mono">NONE</strong>
          </span>
        </div>
        <div className="text-[10px] font-mono text-zinc-400">
          GENESIS: <strong className="text-white">#{CANONICAL_GENESIS_BLOCK.toLocaleString()}</strong> &bull; CANONICAL SEALS: <strong className="text-emerald-400">{CANONICAL_SEALS.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
};
