import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Cpu,
  Key,
  Layers,
  Sparkles,
  RefreshCw,
  Play,
  RotateCcw,
  Scale,
  Award,
  Fingerprint,
  Radio,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';

export interface OmegaPhase {
  phase: number;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  descriptionEn: string;
  technicalEnforcement: string;
  statuteRef: string;
  status: 'PENDING' | 'ATTESTING' | 'FINALIZED';
  accentColor: string;
  hashPreview: string;
  latencyMs: number;
}

export const INITIAL_OMEGA_PHASES: OmegaPhase[] = [
  {
    phase: 1,
    nameTh: 'Genesis Seal',
    nameEn: 'Sovereign Root Genesis',
    descriptionTh: 'สร้างตราประทับอธิปไตยเริ่มต้น พร้อม Merkle Root Identity',
    descriptionEn: 'Genesis sovereign seal establishment with immutable Merkle root anchor.',
    technicalEnforcement: 'Sub-Kelvin frozen Merkle Root 7f8a9b2c... initialization across all kernel rings.',
    statuteRef: 'พ.ร.บ. ธุรกรรมฯ ม. 9 & Root-of-Trust Invariant',
    status: 'FINALIZED',
    accentColor: '#3b82f6', // Blue
    hashPreview: 'genesis:root_7f8a9b2cd4e5f6a1b2c3d4e5f6',
    latencyMs: 1.2,
  },
  {
    phase: 2,
    nameTh: 'Cryogenic Key Forge',
    nameEn: 'Post-Quantum Lattice Key Generation',
    descriptionTh: 'สร้างคีย์ Kyber-1024 / Dilithium-5 สำหรับการลงนามแบบ Post-Quantum',
    descriptionEn: 'Ephemeral lattice keys generated under cryogenic hardware isolation.',
    technicalEnforcement: 'NIST FIPS 203 ML-KEM-1024 key encapsulation & FIPS 204 ML-DSA-87 parameter generation.',
    statuteRef: 'NIST PQC & NCSA CII Tier-1 Standard',
    status: 'FINALIZED',
    accentColor: '#06b6d4', // Cyan
    hashPreview: 'pqc:dilithium5_pk_8f7e6d5c4b3a21',
    latencyMs: 2.8,
  },
  {
    phase: 3,
    nameTh: 'Identity Attestation',
    nameEn: 'Sovereign Identity Non-Repudiation',
    descriptionTh: 'ตรวจสอบตัวตนและเจตนา Non-Repudiation ผ่าน Sovereign Seal',
    descriptionEn: 'Verification of signatory intent and legal identification without third-party leak.',
    technicalEnforcement: 'Merkle leaf signature binding with Zero-Knowledge proof of custody.',
    statuteRef: 'พ.ร.บ. ธุรกรรมฯ ม. 9 (Electronic Signature Validity)',
    status: 'FINALIZED',
    accentColor: '#38bdf8', // Sky
    hashPreview: 'identity:attest_zk_nonrepudiate_01',
    latencyMs: 1.9,
  },
  {
    phase: 4,
    nameTh: 'Custodian Binding',
    nameEn: 'Legal Custodian Registry Anchor',
    descriptionTh: 'ผูกข้อมูลกับ Custodian Registry เพื่อสร้าง Legal Traceability',
    descriptionEn: 'Binding ledger state to certified Thai Sovereign Custodians.',
    technicalEnforcement: 'Direct cryptographic anchoring to 4 Thai Custodian Passports (Yuththaphum, Sukhum, et al.).',
    statuteRef: 'Thai Custodian Registry & ETDA Rule',
    status: 'FINALIZED',
    accentColor: '#818cf8', // Indigo
    hashPreview: 'custodian:anchor_ep_sovereign_01_bind',
    latencyMs: 3.1,
  },
  {
    phase: 5,
    nameTh: 'qOps Invariant Lock',
    nameEn: 'Zero-Drift Merkle Invariant Verification',
    descriptionTh: 'ล็อกค่าคงที่ Zero-Drift ใน Cryogenic Merkle Core',
    descriptionEn: '10/10 mathematical invariants verified against hardware telemetry with 0.00% drift.',
    technicalEnforcement: '14,902 sealed blocks Merkle path re-calculation and memory invariance freeze.',
    statuteRef: 'พ.ร.บ. ธุรกรรมฯ ม. 26 (Reliable Digital Signatures)',
    status: 'FINALIZED',
    accentColor: '#10b981', // Emerald
    hashPreview: 'invariant:drift_0.0000000000000000000',
    latencyMs: 4.4,
  },
  {
    phase: 6,
    nameTh: 'Sovereign Passport Sign-Off',
    nameEn: 'Executive Passport #EP-SOVEREIGN-01 Veto Seal',
    descriptionTh: 'ลงนาม Executive Passport #EP-SOVEREIGN-01 พร้อม Omega Clearance',
    descriptionEn: 'Executive physical biometric hardware gate signing by Sovereign Principal.',
    technicalEnforcement: 'Passport #EP-SOVEREIGN-01 (นายยุทธภูมิ พากเพียร) non-delegable signature applied.',
    statuteRef: 'พ.ร.บ. ธุรกรรมฯ ม. 28 (Signatory Custody & Liability)',
    status: 'FINALIZED',
    accentColor: '#f59e0b', // Amber
    hashPreview: 'sign:passport_ep_sovereign_01_yuththaphum',
    latencyMs: 2.1,
  },
  {
    phase: 7,
    nameTh: 'Audit Trail Emission',
    nameEn: 'Immutable OTLP Audit Trace Recording',
    descriptionTh: 'สร้างบันทึก Immutable Audit Trail ที่ตรวจสอบย้อนกลับได้',
    descriptionEn: 'Cryptographic event emission into un-tamperable append-only audit stream.',
    technicalEnforcement: 'OTLP streaming telemetry with monotonic SHA-256 state chaining.',
    statuteRef: 'NCSA Cybersecurity Act Sec 35 Audit Standard',
    status: 'FINALIZED',
    accentColor: '#a855f7', // Purple
    hashPreview: 'audit:tx_0x8f9c1b3d7a2e4f6a0d',
    latencyMs: 1.5,
  },
  {
    phase: 8,
    nameTh: 'Quantum Resilience Sync',
    nameEn: 'NIST PQC Multi-Sphere Inviolability Sync',
    descriptionTh: 'ซิงค์กับมาตรฐาน NIST FIPS 203-205 เพื่อความมั่นคงระดับ PQC',
    descriptionEn: 'Global lattice-proof synchronization across sovereign nodes.',
    technicalEnforcement: 'Kyber-1024 / SPHINCS+ hybrid encapsulation cross-verified across all ring buffers.',
    statuteRef: 'NIST FIPS 203/204/205 Mandate',
    status: 'FINALIZED',
    accentColor: '#ec4899', // Pink
    hashPreview: 'sync:pqc_fips204_lattice_shield_ok',
    latencyMs: 3.7,
  },
  {
    phase: 9,
    nameTh: 'Legal Attestation Bridge',
    nameEn: 'ETDA & PDPA Statutory Verification Bridge',
    descriptionTh: 'เชื่อมโยงกับ ETDA และ PDPA เพื่อรับรองผลทางกฎหมาย',
    descriptionEn: 'Statutory compliance verification against Thai legal codes in Royal Gazette.',
    technicalEnforcement: 'Sections 9, 26, 28 & PDPA Sec 19/27/37 automated legal admissibility assertions.',
    statuteRef: 'ราชกิจจานุเบกษา & ETDA Recommendation Level 3+',
    status: 'FINALIZED',
    accentColor: '#06b6d4', // Cyan
    hashPreview: 'bridge:etda_level3_court_admissible_proof',
    latencyMs: 2.4,
  },
  {
    phase: 10,
    nameTh: 'Custody Reconciliation',
    nameEn: 'Dual-Key Physical Custody Reconciliation',
    descriptionTh: 'ตรวจสอบความถูกต้องของข้อมูลและสิทธิ์การถือครอง',
    descriptionEn: 'Full cryptographic reconciliation of physical storage and hardware state roots.',
    technicalEnforcement: 'Physical NVMe hardware serial + TPM 2.0 PCR registers matched to immutable ledger.',
    statuteRef: 'พ.ร.บ. ธุรกรรมฯ ม. 28 Legal Custody Reconciliation',
    status: 'FINALIZED',
    accentColor: '#eab308', // Yellow
    hashPreview: 'reconcile:tpm20_pcr0_nvme_verified',
    latencyMs: 5.1,
  },
  {
    phase: 11,
    nameTh: 'Sovereign Homeostasis',
    nameEn: 'Legal-Cryptographic Equilibrium Hold',
    descriptionTh: 'รักษาสมดุลระหว่าง Legal Compliance และ Runtime Integrity',
    descriptionEn: 'Continuous self-healing feedback loop maintaining mathematical zero-trust.',
    technicalEnforcement: 'Dynamic invariant balancer maintaining Sub-Kelvin cryogenic temperature stability.',
    statuteRef: 'Zero-Trust Homeostasis Invariant Ω601',
    status: 'FINALIZED',
    accentColor: '#10b981', // Emerald
    hashPreview: 'homeostasis:thermal_3.8k_drift_0.000%',
    latencyMs: 1.8,
  },
  {
    phase: 12,
    nameTh: 'Omega Ascension',
    nameEn: 'Immutable Sovereign Seal Finalization ♾️',
    descriptionTh: 'ปิดลูปการตรวจสอบ และ ยืนยันสถานะ Sovereign Finalization ♾️',
    descriptionEn: 'Final closing of cryptographic audit circuit. Permanent non-repudiable state sealed.',
    technicalEnforcement: 'Finalized block height #849202 sealed under ZYRQUEN Ω∞ FROZEN v1.2 LTS.',
    statuteRef: 'Permanent Admissible Sovereign Finality ♾️',
    status: 'FINALIZED',
    accentColor: '#6366f1', // Indigo
    hashPreview: 'omega:ascension_finalized_849202_infinity',
    latencyMs: 0.9,
  },
];

export const OmegaSequenceSimulator: React.FC = () => {
  const [phases, setPhases] = useState<OmegaPhase[]>(INITIAL_OMEGA_PHASES);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(11); // Default showing all completed
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [currentRunningStep, setCurrentRunningStep] = useState<number>(-1);
  const [totalSimTimeMs, setTotalSimTimeMs] = useState<number>(31.4);

  const selectedPhase = phases[activePhaseIndex] || phases[0];

  const handleRunFullAttestation = () => {
    setIsRunningSim(true);
    setCurrentRunningStep(0);
    setActivePhaseIndex(0);
    playTone(500, 0.08);

    // Reset all phases to pending except the first being attested
    const resetPhases: OmegaPhase[] = INITIAL_OMEGA_PHASES.map((p, idx) => ({
      ...p,
      status: idx === 0 ? 'ATTESTING' : 'PENDING',
    }));
    setPhases(resetPhases);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < 12) {
        setCurrentRunningStep(step);
        setActivePhaseIndex(step);
        playTone(480 + step * 40, 0.06);

        setPhases((prev) =>
          prev.map((p, idx) => {
            if (idx < step) return { ...p, status: 'FINALIZED' };
            if (idx === step) return { ...p, status: 'ATTESTING' };
            return { ...p, status: 'PENDING' };
          })
        );
      } else {
        clearInterval(interval);
        setIsRunningSim(false);
        setCurrentRunningStep(-1);
        setActivePhaseIndex(11);
        setPhases(INITIAL_OMEGA_PHASES.map((p) => ({ ...p, status: 'FINALIZED' })));
        setTotalSimTimeMs(31.4);
        playAuditChime();
      }
    }, 450);
  };

  const handleSelectPhase = (index: number) => {
    if (isRunningSim) return;
    playTone(600, 0.03);
    setActivePhaseIndex(index);
  };

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-[#07080F]/90 border border-white/8 backdrop-blur-2xl space-y-6 shadow-2xl font-mono">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.2)] shrink-0">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                12-Phase Omega Sequence — Executive Custody Protocol
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                #EP-SOVEREIGN-01 RUNTIME
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Interactive 12-stage attestation pipeline: Genesis Seal $\rightarrow$ Quantum Sync $\rightarrow$ Omega Ascension Finality
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunFullAttestation}
            disabled={isRunningSim}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border shadow-lg ${
              isRunningSim
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 animate-pulse cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-200 border-amber-500/40 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 text-amber-400 ${isRunningSim ? 'animate-spin' : ''}`} />
            <span>{isRunningSim ? `Attesting Phase ${currentRunningStep + 1}/12...` : 'Run 12-Phase Attestation'}</span>
          </button>
        </div>
      </div>

      {/* 12-Phase Visual Progress Chain (Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {phases.map((p, idx) => {
          const isSelected = activePhaseIndex === idx;
          const isCurrentAttesting = currentRunningStep === idx;
          const isFinalized = p.status === 'FINALIZED';

          return (
            <button
              key={p.phase}
              onClick={() => handleSelectPhase(idx)}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 group ${
                isSelected
                  ? 'bg-white/[0.08] shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                  : 'bg-black/40 hover:bg-white/[0.03]'
              }`}
              style={{
                borderColor: isSelected
                  ? p.accentColor
                  : isCurrentAttesting
                  ? '#38bdf8'
                  : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Left Color Indicator Pill */}
              <div
                className="absolute top-0 left-0 w-1.5 h-full"
                style={{ backgroundColor: p.accentColor }}
              />

              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${p.accentColor}20`,
                    color: p.accentColor,
                  }}
                >
                  Phase {p.phase}
                </span>

                {isFinalized && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isCurrentAttesting && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                {p.status === 'PENDING' && <Lock className="w-3 h-3 text-zinc-600" />}
              </div>

              <div>
                <div className="text-xs font-bold text-white truncate">{p.nameTh}</div>
                <div className="text-[10px] text-zinc-400 truncate font-sans">{p.nameEn}</div>
              </div>

              <div className="text-[9px] text-zinc-500 flex items-center justify-between pt-1 border-t border-white/5">
                <span>{p.latencyMs}ms</span>
                <span className="text-[8px] uppercase">{p.status}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Phase Detailed Inspector Card */}
      <div className="p-6 rounded-2xl bg-black/75 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${selectedPhase.accentColor}18`,
                color: selectedPhase.accentColor,
                borderColor: `${selectedPhase.accentColor}35`,
              }}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">
                  Phase {selectedPhase.phase}: {selectedPhase.nameTh}
                </span>
                <span className="text-xs text-zinc-400 font-sans">({selectedPhase.nameEn})</span>
              </div>
              <span className="text-xs text-cyan-300 font-mono mt-0.5 block">{selectedPhase.statuteRef}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold border"
              style={{
                backgroundColor: `${selectedPhase.accentColor}18`,
                color: selectedPhase.accentColor,
                borderColor: `${selectedPhase.accentColor}35`,
              }}
            >
              {selectedPhase.status} • {selectedPhase.latencyMs}ms
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: Phase Purpose & Description */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>วัตถุประสงค์และหน้าที่หลัก (Phase Purpose & Scope):</span>
            </span>
            <p className="text-zinc-200 font-sans text-xs sm:text-sm leading-relaxed">
              {selectedPhase.descriptionTh}
            </p>
            <p className="text-zinc-400 font-sans text-xs italic">
              {selectedPhase.descriptionEn}
            </p>
          </div>

          {/* Right: Technical Sovereign Runtime Enforcement */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>การบังคับใช้เชิงสถาปัตยกรรม (Runtime Enforcement Proof):</span>
            </span>
            <p className="text-zinc-300 font-mono text-xs leading-relaxed">
              {selectedPhase.technicalEnforcement}
            </p>
            <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-[10px] text-emerald-400 select-all font-mono truncate">
              Proof Hash: {selectedPhase.hashPreview}
            </div>
          </div>
        </div>

        {/* Global Summary Footprint */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-emerald-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Executive Custody Principal: <strong className="text-white">{SYSTEM_METADATA.sovereignPrincipal}</strong> (#EP-SOVEREIGN-01)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Total Attestation Duration: <strong className="text-cyan-300">{totalSimTimeMs}ms</strong></span>
            <span className="text-emerald-400 font-bold">12/12 PHASES SEALED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
