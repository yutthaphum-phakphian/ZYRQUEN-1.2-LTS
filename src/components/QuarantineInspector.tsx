import React from 'react';
import {
  ShieldAlert,
  Lock,
  Cpu,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import {
  CANONICAL_SEALS,
  QUARANTINE_COUNT,
  CANONICAL_GENESIS_BLOCK,
  CANONICAL_MERKLE_ROOT,
  SSOT_MUTATION,
  BASELINE_DRIFT,
} from '../data/canonicalData';

export interface QuarantinedSealDetail {
  sealId: number;
  anomalyClass: string;
  quarantineReason: string;
  sourceTelemetry: string;
  blockEpochInfo: string;
  evidenceStatus: 'QUARANTINED' | 'UNDER_ANALYSIS' | 'CONFIRMED_NON_CANONICAL';
  canonicalRelationship: string;
  isolationBoundary: string;
  payloadDigest: string;
  cryptographicAlgo: string;
  impactOnSsoT: string;
}

export const QuarantineInspector: React.FC = () => {
  const quarantinedSeals: QuarantinedSealDetail[] = [
    {
      sealId: 14903,
      anomalyClass: 'Post-Epoch Emission (+1 Block Drift)',
      quarantineReason: 'Block height probe mismatch detected at block #849,203 instead of Genesis Epoch #849,202.',
      sourceTelemetry: 'Warp Telemetry Stream Node 04 (Sub-ring 09)',
      blockEpochInfo: 'Observed Block #849,203 (+1 drift from Genesis #849,202)',
      evidenceStatus: 'QUARANTINED',
      canonicalRelationship: 'EXCLUDED from Genesis Merkle Tree root calculation',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Zero Read/Write to Canonical Core)',
      payloadDigest: '0x849203bb1029cde8871234909ab814479844d8a14816bed34cdbb07528e185',
      cryptographicAlgo: 'FALCON-1024 (Post-Quantum)',
      impactOnSsoT: '0 (Zero SSoT Mutation & Zero Drift Impact)',
    },
    {
      sealId: 14904,
      anomalyClass: 'Replay Candidate / Digest Collision',
      quarantineReason: 'Identical cryptographic telemetry hash collision matching prior Seal #14,881 payload frame.',
      sourceTelemetry: 'Global Ingress Multi-Mesh Gateway-02',
      blockEpochInfo: 'Genesis Block #849,202 Epoch Duplicate Stamp',
      evidenceStatus: 'CONFIRMED_NON_CANONICAL',
      canonicalRelationship: 'REJECTED by Inviolable Idempotency Filter',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Idempotency Filter Trap)',
      payloadDigest: '0x14881cc334455aa667788909ab814479844d8a14816bed34cdbb07528e185',
      cryptographicAlgo: 'SPHINCS+ (State-Free PQC)',
      impactOnSsoT: '0 (Zero Duplicate in SSoT Baseline)',
    },
    {
      sealId: 14905,
      anomalyClass: 'Cryptographic Key-Type Mismatch',
      quarantineReason: 'Classical Ed25519 signature scheme detected where NIST Post-Quantum (PQC) was required.',
      sourceTelemetry: 'Legacy Edge Oracle Relayer Node 11',
      blockEpochInfo: 'Timestamp: 2026-08-23 03:00:35 ICT (Pre-PQC Enclave)',
      evidenceStatus: 'QUARANTINED',
      canonicalRelationship: 'DISALLOWED by Post-Quantum Hardening Filter',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (PQC Armor Interceptor)',
      payloadDigest: '0xed25519dd556677bb889900909ab814479844d8a14816bed34cdbb07528e185',
      cryptographicAlgo: 'Ed25519 (Classical Non-PQC Rejected)',
      impactOnSsoT: '0 (Zero Canonical Write Permitted)',
    },
    {
      sealId: 14906,
      anomalyClass: 'Provisional Key (Missing Genesis Anchor)',
      quarantineReason: 'Missing verifiable parent cryptographic link to Canonical Merkle Root.',
      sourceTelemetry: 'External Peer Attestation Bridge 08',
      blockEpochInfo: 'Parent Hash: 0x0000000000000000 (Orphaned Node)',
      evidenceStatus: 'QUARANTINED',
      canonicalRelationship: 'ORPHAN NODE — Lineage broken from Genesis Root',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Zero Ambient Write Enclave)',
      payloadDigest: '0x00000000ee778899aa001122909ab814479844d8a14816bed34cdbb07528e185',
      cryptographicAlgo: 'CRYSTALS-Dilithium-5 (Orphan Root)',
      impactOnSsoT: '0 (Zero Tree Corruption Allowed)',
    },
    {
      sealId: 14907,
      anomalyClass: 'Synthetic Stress Benchmark Telemetry',
      quarantineReason: 'Simulated high-throughput test artifact tagged as MONTE_CARLO_SIM_100K_RUN.',
      sourceTelemetry: 'Diagnostic Chaos Engineering Sandbox 01',
      blockEpochInfo: 'Simulation Run Artifact #SIM-100K-0849202',
      evidenceStatus: 'CONFIRMED_NON_CANONICAL',
      canonicalRelationship: 'BENCHMARK ARTIFACT — Segregated from Production SSoT',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Simulation Sandbox Prison)',
      payloadDigest: '0xff11223344556677889900909ab814479844d8a14816bed34cdbb07528e185',
      cryptographicAlgo: 'Synthetic Lattice Diagnostic Probe',
      impactOnSsoT: '0 (Zero Ledger Mutation Guaranteed)',
    },
  ];

  return (
    <div
      id="quarantine-forensic-inspector"
      className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c101d] via-black to-[#080c16] border-2 border-amber-500/40 space-y-5 font-mono text-xs shadow-2xl"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              FORENSIC QUARANTINE INSPECTOR &bull; SEALS #14,903–#14,907
            </span>
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] text-zinc-400">
              STRICTLY READ-ONLY
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            Isolated Anomaly Container &bull; RING-04 Boundary
          </h3>
          <p className="text-[11px] text-zinc-400">
            Immutable isolation: <span className="text-amber-300 font-bold">CANONICAL (14,902) ≠ OBSERVED (14,907)</span>.
            Zero write path to Frozen Core. Automatic merge, promotion, and reseal are permanently blocked.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 text-right">
            <span className="text-[10px] text-zinc-500 block">QUARANTINED DELTA</span>
            <strong className="text-sm font-bold text-amber-300">+{QUARANTINE_COUNT} Isolated Seals</strong>
            <span className="text-[9px] text-emerald-400 block mt-0.5">SSoT Mutation = {SSOT_MUTATION} (Zero)</span>
          </div>
        </div>
      </div>

      {/* Truth Notice Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px]">
        <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-zinc-300 space-y-0.5">
          <strong className="text-cyan-300 block">1. CANONICAL LEDGER</strong>
          <p className="text-zinc-400">{CANONICAL_SEALS.toLocaleString()} Immutable Seals &bull; 0.00% Drift</p>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 space-y-0.5">
          <strong className="text-amber-300 block">2. QUARANTINE BUFFER</strong>
          <p className="text-amber-200/80">+{QUARANTINE_COUNT} Delta Artifacts &bull; Ring-04 Hard Enclave</p>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 space-y-0.5">
          <strong className="text-rose-300 block">3. PROMOTION CIRCUIT</strong>
          <p className="text-rose-200/80">FAIL-CLOSED 🔒 &bull; Zero Write Authority</p>
        </div>
      </div>

      {/* Grid of 5 Quarantined Seals (Read-Only Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quarantinedSeals.map((seal) => (
          <div
            key={seal.sealId}
            id={`quarantine-card-${seal.sealId}`}
            className="p-4 rounded-2xl bg-black/70 border border-white/10 space-y-3 relative overflow-hidden"
          >
            {/* Top Bar: Seal ID and Status Badge */}
            <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                  SEAL #{seal.sealId.toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-400 font-bold">
                  {seal.anomalyClass}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950/40 text-amber-300 border border-amber-500/30 shrink-0">
                {seal.evidenceStatus}
              </span>
            </div>

            {/* Metadata Fields Grid */}
            <div className="space-y-2 text-[10px]">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-zinc-500 block uppercase">Quarantine Rationale:</span>
                <p className="text-zinc-200 leading-relaxed font-sans">{seal.quarantineReason}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-zinc-500 block">Telemetry Source:</span>
                  <span className="text-zinc-300 truncate block">{seal.sourceTelemetry}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-zinc-500 block">Block / Epoch Info:</span>
                  <span className="text-amber-300 truncate block font-mono">{seal.blockEpochInfo}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-zinc-500 block">Algorithm Scheme:</span>
                  <span className="text-cyan-300 truncate block font-mono">{seal.cryptographicAlgo}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-zinc-500 block">SSoT Mutation Delta:</span>
                  <span className="text-emerald-400 font-bold block">{seal.impactOnSsoT}</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-zinc-500 block">Canonical Core Relationship:</span>
                <span className="text-rose-300 block font-mono text-[9px]">{seal.canonicalRelationship}</span>
              </div>

              <div className="p-2 rounded-lg bg-black/60 border border-white/10 space-y-0.5">
                <span className="text-zinc-500 block">Isolation Boundary:</span>
                <span className="text-amber-400 block font-mono text-[9px] truncate">{seal.isolationBoundary}</span>
              </div>

              <div className="p-2 rounded-lg bg-black border border-white/10 space-y-0.5">
                <span className="text-zinc-500 block">Telemetry Digest Hash:</span>
                <code className="text-cyan-300 block font-mono text-[9px] break-all select-all">{seal.payloadDigest}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invariant Footer */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <Lock className="w-3 h-3 text-amber-400" />
          Genesis Block: <strong className="text-white">#{CANONICAL_GENESIS_BLOCK}</strong> &bull; Merkle Root: <code className="text-cyan-300">{CANONICAL_MERKLE_ROOT.slice(0, 16)}...</code>
        </span>
        <span className="text-emerald-400 font-bold">
          SSoT Mutation: {SSOT_MUTATION} &bull; Write Authority: DENIED &bull; Promotion: FAIL-CLOSED 🔒
        </span>
      </div>
    </div>
  );
};
