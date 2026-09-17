import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  RefreshCw,
  Scale,
  Award,
  Cpu,
  Layers,
  Fingerprint,
  Zap,
  Activity,
  ShieldCheck,
  Binary,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';

export interface QuantumPhaseState {
  phase: number;
  nameTh: string;
  nameEn: string;
  quantumLatticeState: string;
  legalStatus: string;
  runtimeIntegrity: string;
  coherenceScore: number;
  driftVariance: number;
  status: 'IDLE' | 'TRANSMUTING' | 'HARMONIZED';
  qubitSignature: string;
}

export const INITIAL_QUANTUM_PHASES: QuantumPhaseState[] = [
  {
    phase: 1,
    nameTh: 'Genesis Seal',
    nameEn: 'Sovereign Root Genesis',
    quantumLatticeState: 'Sub-Kelvin State Vector |ψ₀⟩ Stabilized',
    legalStatus: 'พ.ร.บ. ธุรกรรมฯ ม. 9 (Root-of-Trust Invariant Locked)',
    runtimeIntegrity: '100% Invariable Core Root',
    coherenceScore: 99.99,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:root_7f8a9b2cd4e5f6',
  },
  {
    phase: 2,
    nameTh: 'Cryogenic Key Forge',
    nameEn: 'Post-Quantum Lattice Key Generation',
    quantumLatticeState: 'Kyber-1024 / Dilithium-5 Lattice Superposition',
    legalStatus: 'NIST PQC FIPS 203/204 Approved & NCSA Tier-1',
    runtimeIntegrity: '768-D Superposition Matrix Active',
    coherenceScore: 99.98,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:lattice_fips203_kyber1024',
  },
  {
    phase: 3,
    nameTh: 'Identity Attestation',
    nameEn: 'Sovereign Identity Non-Repudiation',
    quantumLatticeState: 'Zero-Knowledge Lattice Identity Projection',
    legalStatus: 'มาตรา 9: แสดงเจตนายึดถือและยืนยันตัวบุคคลทางอิเล็กทรอนิกส์',
    runtimeIntegrity: 'Non-Repudiation Custody Absolute',
    coherenceScore: 99.97,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:zk_identity_proj_01',
  },
  {
    phase: 4,
    nameTh: 'Custodian Binding',
    nameEn: 'Legal Custodian Registry Anchor',
    quantumLatticeState: 'Tri-Agent Council Entanglement Bound',
    legalStatus: 'ETDA Custodian Passport Binding #EP-SOVEREIGN-01',
    runtimeIntegrity: '4/4 Custodians Verified in Registry',
    coherenceScore: 99.99,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:custodian_entangle_yuththaphum',
  },
  {
    phase: 5,
    nameTh: 'qOps Invariant Lock',
    nameEn: 'Zero-Drift Merkle Invariant Verification',
    quantumLatticeState: 'Zero-Jitter Invariant Inviolability Hold',
    legalStatus: 'มาตรา 26: ระบบสร้างลายมือชื่อดิจิทัลที่เชื่อถือได้ตามมาตรฐาน',
    runtimeIntegrity: '10/10 Invariants Active (0.00% Drift)',
    coherenceScore: 100.0,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:invariant_zero_drift_10of10',
  },
  {
    phase: 6,
    nameTh: 'Sovereign Passport Sign-Off',
    nameEn: 'Executive Passport #EP-SOVEREIGN-01 Veto Seal',
    quantumLatticeState: 'Physical Biometric Phase Collapse to Signature',
    legalStatus: 'มาตรา 28: ความรับผิดและหน้าที่ของเจ้าของลายมือชื่อดิจิทัล',
    runtimeIntegrity: 'Executive Principal Non-Delegable Veto Armed',
    coherenceScore: 99.96,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:passport_sign_yuththaphum_ep01',
  },
  {
    phase: 7,
    nameTh: 'Audit Trail Emission',
    nameEn: 'Immutable OTLP Audit Trace Recording',
    quantumLatticeState: 'Monotonic Telemetry Stream State Collapse',
    legalStatus: 'NCSA Cybersecurity Act Sec 35 Audit Admissibility',
    runtimeIntegrity: 'Append-Only Write-Once Memory Ring',
    coherenceScore: 99.98,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:otlp_trace_tx_0x8f9c1',
  },
  {
    phase: 8,
    nameTh: 'Quantum Resilience Sync',
    nameEn: 'NIST PQC Multi-Sphere Inviolability Sync',
    quantumLatticeState: 'Global Multi-Qubit Bell State Synchronization',
    legalStatus: 'NIST FIPS 203-205 Sovereign Compliance Certified',
    runtimeIntegrity: 'Cross-Ring Buffer Coherence Synchronized',
    coherenceScore: 99.99,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:pqc_fips205_sphincs_plus',
  },
  {
    phase: 9,
    nameTh: 'Legal Attestation Bridge',
    nameEn: 'ETDA & PDPA Statutory Verification Bridge',
    quantumLatticeState: 'Statutory Invariant Verification Matrix',
    legalStatus: 'Sec 9, 26, 28 & PDPA Sec 19/27/37 Admissibility Affirmation',
    runtimeIntegrity: 'Full Court Evidentiary Package Validated',
    coherenceScore: 99.97,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:etda_level3_court_admissible',
  },
  {
    phase: 10,
    nameTh: 'Custody Reconciliation',
    nameEn: 'Dual-Key Physical Custody Reconciliation',
    quantumLatticeState: 'Hardware NVMe / TPM 2.0 State Entanglement',
    legalStatus: 'พ.ร.บ. ธุรกรรมฯ ม. 28 Strict Custody Verification',
    runtimeIntegrity: 'Physical Storage Cryptographic Roots Matched',
    coherenceScore: 99.99,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:tpm20_pcr0_nvme_reconciled',
  },
  {
    phase: 11,
    nameTh: 'Sovereign Homeostasis',
    nameEn: 'Legal-Cryptographic Equilibrium Hold',
    quantumLatticeState: 'Sub-Kelvin Thermal Equilibrium Invariant (3.8K)',
    legalStatus: 'Continuous Zero-Trust Homeostasis Invariant Ω601',
    runtimeIntegrity: 'Zero-Decoherence Baseline Maintained',
    coherenceScore: 100.0,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:thermal_3.8k_drift_zero',
  },
  {
    phase: 12,
    nameTh: 'Omega Ascension',
    nameEn: 'Immutable Sovereign Seal Finalization ♾️',
    quantumLatticeState: 'Final Multiverse Harmonic Unity |Ω∞⟩ Sealed',
    legalStatus: 'Permanent Admissible Sovereign Finality (Block #849202)',
    runtimeIntegrity: 'Frozen Baseline v1.2 LTS Immutable Seal',
    coherenceScore: 100.0,
    driftVariance: 0.0,
    status: 'HARMONIZED',
    qubitSignature: 'qvec:omega_finality_849202_infinity',
  },
];

export const QuantumAttestationSimulator: React.FC = () => {
  const [phases, setPhases] = useState<QuantumPhaseState[]>(INITIAL_QUANTUM_PHASES);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number>(0);
  const [isSimulatingAll, setIsSimulatingAll] = useState<boolean>(false);
  const [activeTransmuteIndex, setActiveTransmuteIndex] = useState<number>(-1);

  const selectedPhase = phases[selectedPhaseIndex] || phases[0];

  // Trigger single phase attestation
  const handleTriggerPhase = (idx: number) => {
    if (isSimulatingAll) return;
    setActiveTransmuteIndex(idx);
    setSelectedPhaseIndex(idx);
    playTone(400 + idx * 45, 0.1, 'sine');

    setPhases((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, status: 'TRANSMUTING' } : p))
    );

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, status: 'HARMONIZED' } : p))
      );
      setActiveTransmuteIndex(-1);
      playTone(700 + idx * 25, 0.08, 'sine');
    }, 600);
  };

  // Run all 12 phases in sequential loop
  const handleRunFullQuantumAttestation = () => {
    setIsSimulatingAll(true);
    setSelectedPhaseIndex(0);
    setActiveTransmuteIndex(0);
    playTone(420, 0.08, 'sine');

    setPhases(
      INITIAL_QUANTUM_PHASES.map((p, idx) => ({
        ...p,
        status: idx === 0 ? 'TRANSMUTING' : 'IDLE',
      }))
    );

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < 12) {
        setSelectedPhaseIndex(step);
        setActiveTransmuteIndex(step);
        playTone(420 + step * 38, 0.06, 'sine');

        setPhases((prev) =>
          prev.map((p, idx) => {
            if (idx < step) return { ...p, status: 'HARMONIZED' };
            if (idx === step) return { ...p, status: 'TRANSMUTING' };
            return { ...p, status: 'IDLE' };
          })
        );
      } else {
        clearInterval(interval);
        setIsSimulatingAll(false);
        setActiveTransmuteIndex(-1);
        setSelectedPhaseIndex(11);
        setPhases(INITIAL_QUANTUM_PHASES.map((p) => ({ ...p, status: 'HARMONIZED' })));
        playAuditChime();
      }
    }, 450);
  };

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-[#07080F]/95 border border-white/8 backdrop-blur-2xl space-y-6 shadow-2xl font-mono">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-[0_0_25px_rgba(139,92,246,0.25)] shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Quantum Attestation Simulator (Omega Sequence #EP-SOVEREIGN-01)
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
                PQC LATTICE + THAI LAW
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Live harmonic dual-engine: Quantum Lattice Coherence $\longleftrightarrow$ Thai Electronic Transactions Act Compliance
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunFullQuantumAttestation}
            disabled={isSimulatingAll}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border shadow-lg ${
              isSimulatingAll
                ? 'bg-violet-500/20 text-violet-200 border-violet-500/40 animate-pulse cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-emerald-500/20 hover:from-violet-500/30 hover:to-emerald-500/30 text-violet-200 border-violet-500/40 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 text-violet-300 ${isSimulatingAll ? 'animate-spin' : ''}`} />
            <span>{isSimulatingAll ? `Attesting Phase ${activeTransmuteIndex + 1}/12...` : 'Run 12-Phase Quantum Attestation'}</span>
          </button>
        </div>
      </div>

      {/* 12-Phase Interactive Node Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {phases.map((p, idx) => {
          const isSelected = selectedPhaseIndex === idx;
          const isTransmuting = activeTransmuteIndex === idx;
          const isHarmonized = p.status === 'HARMONIZED';

          return (
            <button
              key={p.phase}
              onClick={() => {
                if (!isSimulatingAll) {
                  setSelectedPhaseIndex(idx);
                  playTone(500 + idx * 25, 0.03);
                }
              }}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 group ${
                isSelected
                  ? 'bg-violet-950/30 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                  : 'bg-black/40 border-white/8 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300">
                  Φ{p.phase}
                </span>

                {isHarmonized && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isTransmuting && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                {p.status === 'IDLE' && <Lock className="w-3 h-3 text-zinc-600" />}
              </div>

              <div>
                <div className="text-xs font-bold text-white truncate">{p.nameTh}</div>
                <div className="text-[10px] text-zinc-400 truncate font-sans">{p.nameEn}</div>
              </div>

              <div className="text-[9px] text-zinc-500 flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-cyan-400">{p.coherenceScore}% Coh</span>
                <span className="text-emerald-400 font-mono">0.00% Drift</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Phase Dual-Status Monitor Card */}
      <div className="p-6 rounded-2xl bg-black/80 border border-white/10 space-y-5 shadow-2xl">
        {/* Phase Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center font-bold text-lg shrink-0">
              Φ{selectedPhase.phase}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-white">
                  Phase {selectedPhase.phase}: {selectedPhase.nameTh}
                </span>
                <span className="text-xs text-zinc-400 font-sans">({selectedPhase.nameEn})</span>
              </div>
              <span className="text-xs text-cyan-300 font-mono mt-0.5 block">
                Qubit Vector Signature: {selectedPhase.qubitSignature}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTriggerPhase(selectedPhaseIndex)}
              disabled={isSimulatingAll || activeTransmuteIndex === selectedPhaseIndex}
              className="px-3.5 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Attest Phase Φ{selectedPhase.phase}</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {selectedPhase.status}
            </span>
          </div>
        </div>

        {/* Dual Panels: Quantum Lattice vs Legal Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Panel: Quantum Lattice State & Invariant Integrity */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/30 to-black/60 border border-violet-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                <span>QUANTUM RUNTIME INTEGRITY</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                LATTICE SYNCHRONIZED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 block">LATTICE STATE VECTOR:</span>
                <span className="text-zinc-100 font-bold">{selectedPhase.quantumLatticeState}</span>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 block">SOVEREIGN INVARIANT INTEGRITY:</span>
                <span className="text-cyan-300 font-mono">{selectedPhase.runtimeIntegrity}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">COHERENCE</span>
                  <span className="text-emerald-400 font-bold">{selectedPhase.coherenceScore}%</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">DRIFT VARIANCE</span>
                  <span className="text-cyan-300 font-bold">0.0000% (Zero-Drift)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Thai Legal Compliance & Statutory Grounding */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-black/60 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span>THAI STATUTORY COMPLIANCE</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                ETDA LEVEL 3+ ENFORCED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 block">THAI STATUTE / JURISDICTIONAL MANDATE:</span>
                <span className="text-emerald-300 font-bold leading-relaxed">{selectedPhase.legalStatus}</span>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 block">EXECUTIVE CUSTODY MANDATE:</span>
                <span className="text-zinc-200">
                  Anchored to Passport <strong className="text-amber-400">#EP-SOVEREIGN-01</strong> ({SYSTEM_METADATA.sovereignPrincipal})
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] text-zinc-400 flex items-center justify-between">
                <span>EVIDENTIARY STANDING:</span>
                <span className="text-emerald-400 font-bold">Admissible in Thai Courts (Section 9/26/28)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
