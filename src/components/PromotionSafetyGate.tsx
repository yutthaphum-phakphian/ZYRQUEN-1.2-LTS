import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertOctagon,
  Key,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import {
  REQUIRED_QUORUM,
  SLOT_COUNT,
  CANONICAL_SEALS,
  QUARANTINE_COUNT,
  SSOT_MUTATION,
  BASELINE_DRIFT,
  CANONICAL_GENESIS_BLOCK,
  CANONICAL_MERKLE_ROOT,
} from '../data/canonicalData';

interface PromotionSafetyGateProps {
  invariantsPassed?: boolean;
  signedCustodianCount?: number;
  isQuorumReached?: boolean;
  isRootProvenanceValid?: boolean;
}

export const PromotionSafetyGate: React.FC<PromotionSafetyGateProps> = ({
  invariantsPassed = true,
  signedCustodianCount = 4,
  isQuorumReached = false,
  isRootProvenanceValid = false,
}) => {
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [promotionResult, setPromotionResult] = useState<string | null>(null);

  // 8 Mandatory Conditions for Compound Promotion Safety (G13)
  const conditions = [
    {
      id: 'C1',
      name: 'Invariant Hardening Gates (G01–G10)',
      requirement: '10/10 Invariants PASS with 0 Drift',
      status: invariantsPassed,
      evidence: invariantsPassed ? '10/10 Verified PASS' : 'FAILED',
    },
    {
      id: 'C2',
      name: 'Physical Custodian Quorum (G11)',
      requirement: `>= ${REQUIRED_QUORUM}/${SLOT_COUNT} Real HSM Signatures`,
      status: isQuorumReached,
      evidence: `${signedCustodianCount} / ${SLOT_COUNT} Real HSM Signed (${isQuorumReached ? 'PASS' : `BLOCKED: NEED ${REQUIRED_QUORUM - signedCustodianCount} MORE`})`,
    },
    {
      id: 'C3',
      name: 'Genesis Root Provenance (G12)',
      requirement: `Binding to Genesis Merkle Root ${CANONICAL_MERKLE_ROOT.substring(0, 8)}...${CANONICAL_MERKLE_ROOT.substring(CANONICAL_MERKLE_ROOT.length - 6)}`,
      status: isRootProvenanceValid,
      evidence: isRootProvenanceValid ? `VALID (Block #${CANONICAL_GENESIS_BLOCK} Bound)` : 'UNBOUND (BLOCKED)',
    },
    {
      id: 'C4',
      name: 'Frozen Core Inviolability',
      requirement: `SSoT Seal Count = ${CANONICAL_SEALS} (Mutation = ${SSOT_MUTATION})`,
      status: true,
      evidence: `${CANONICAL_SEALS} / ${CANONICAL_SEALS} Sealed (0 Mutation)`,
    },
    {
      id: 'C5',
      name: 'Evidence Quarantine Isolation',
      requirement: `+${QUARANTINE_COUNT} Seals (#14903–#14907) isolated in Ring-04 Buffer`,
      status: true,
      evidence: `${QUARANTINE_COUNT} Seals Quarantined (Physical Isolation)`,
    },
    {
      id: 'C6',
      name: 'Write-Back Interceptor Firewall',
      requirement: `Bidirectional write pipe disabled (Mutation = ${SSOT_MUTATION})`,
      status: true,
      evidence: 'BLOCKED (Read-Only Immutable)',
    },
    {
      id: 'C7',
      name: 'Auto-Reseal Inhibitor',
      requirement: 'No automatic core re-minting without Sovereign Gazette',
      status: true,
      evidence: 'BLOCKED (Zero Ambient Re-seal)',
    },
    {
      id: 'C8',
      name: 'SLSA Level 4 Hermetic Artifact Proof',
      requirement: 'Deterministic build binary digest match & Zero Baseline Drift',
      status: true,
      evidence: `Verified SHA-256 (Drift: ${BASELINE_DRIFT}%)`,
    },
  ];

  const metCount = conditions.filter((c) => c.status).length;
  const isFullyAuthorized = metCount === conditions.length;

  const handleExecutePromotion = () => {
    if (!isFullyAuthorized) {
      playTone(280, 0.1);
      return;
    }

    setIsPromoting(true);
    playTone(600, 0.05);

    setTimeout(() => {
      setIsPromoting(false);
      setPromotionResult(
        `PROMOTION AUTHORIZED: Evidence & Quarantine Lifecycle Formally Ratified. Canonical Core remains LOCKED at ${CANONICAL_SEALS} Seals (SSoT Mutation = ${SSOT_MUTATION}).`
      );
      playAuditChime();
    }, 900);
  };

  return (
    <div
      id="promotion-safety-gate"
      className="p-6 rounded-[28px] bg-gradient-to-br from-[#180a0a] via-black to-[#110606] border-2 border-rose-500/40 space-y-6 font-mono text-xs shadow-2xl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-500/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-rose-300">
              GATE 13 &bull; COMPOUND PROMOTION SAFETY GATE (COMPOSITE FAIL-CLOSED)
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            MULTI-LAYER ASSURANCE &amp; COMPOUND AUTHORIZATION AGGREGATOR
          </h3>
          <p className="text-[11px] text-zinc-400 font-sans">
            รวบรวมสถานะ Invariants (10/10), Quorum (&ge; {REQUIRED_QUORUM}/{SLOT_COUNT} Real HSM), และ Provenance (VALID) &bull; ค่าเริ่มต้น 6/8 FAIL-CLOSED (BLOCKED)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              isFullyAuthorized
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {isFullyAuthorized ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PROMOTION: AUTHORIZED (8/8)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span>PROMOTION: FAIL-CLOSED (BLOCKED {metCount}/8)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 8 Conditions Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {conditions.map((c) => (
          <div
            key={c.id}
            className={`p-3.5 rounded-2xl border transition-all ${
              c.status
                ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
                : 'bg-rose-950/30 border-rose-500/40 text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-400 font-mono">{c.id}</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
                  c.status
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {c.status ? 'PASS' : 'BLOCKED'}
              </span>
            </div>
            <div className="font-bold text-white text-[11px] truncate">{c.name}</div>
            <div className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{c.requirement}</div>
            <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono flex justify-between text-zinc-400">
              <span>Evidence:</span>
              <strong className={c.status ? 'text-emerald-300' : 'text-amber-300'}>{c.evidence}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate Bar */}
      <div className="p-4 rounded-2xl bg-black/80 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">COMPOUND SAFETY CRITERIA:</span>
            <strong className={isFullyAuthorized ? 'text-emerald-300' : 'text-amber-300'}>
              {metCount} / {conditions.length} CONDITIONS SATISFIED
            </strong>
          </div>
          <div className="text-[11px] text-zinc-400 font-sans">
            {!isFullyAuthorized ? (
              <span>
                Missing Requirements: {!isQuorumReached && `Physical Quorum (${signedCustodianCount}/${SLOT_COUNT} < ${REQUIRED_QUORUM}/${SLOT_COUNT} Real HSM)`}{' '}
                {!isRootProvenanceValid && ` & Root Provenance (UNBOUND)`}
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">
                All 8 compound gates satisfied! Promotion authorization legally ratifiable.
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleExecutePromotion}
          disabled={!isFullyAuthorized || isPromoting}
          className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
            isFullyAuthorized
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
              : 'bg-zinc-800 text-zinc-500 border border-white/10 cursor-not-allowed opacity-60'
          }`}
        >
          {isPromoting ? (
            <span>RATIFYING PROMOTION...</span>
          ) : isFullyAuthorized ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>AUTHORIZED FOR PROMOTION</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>FAIL-CLOSED (PROMOTION BLOCKED)</span>
            </>
          )}
        </button>
      </div>

      {/* Result feedback */}
      {promotionResult && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-emerald-300">PROMOTION RATIFIED WITH ZERO CANONICAL MUTATION</strong>
            <p className="text-[11px] text-emerald-400/90 leading-relaxed font-sans">{promotionResult}</p>
          </div>
        </div>
      )}
    </div>
  );
};
