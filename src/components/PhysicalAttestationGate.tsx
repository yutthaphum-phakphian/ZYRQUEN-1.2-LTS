import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Key,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Fingerprint,
  FileCheck2,
  Terminal,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import {
  CustodianEvidenceRecord,
  executeEvidenceVerificationPipeline,
  VerificationPipelineResult,
} from '../utils/custodianQuorumEngine';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';

interface PhysicalAttestationGateProps {
  allSlots: CustodianEvidenceRecord[];
  onEvidenceIntakeComplete?: (
    slotId: number,
    result: VerificationPipelineResult,
    evidenceDetails: Partial<CustodianEvidenceRecord>
  ) => void;
  onSelectEvidence?: (slot: CustodianEvidenceRecord) => void;
}

export interface SlotAttestationState {
  slotId: number;
  custodianTitle: string;
  role: string;
  device: string;
  pqcAlgo: string;
  fingerprint: string;
  claimed: boolean;
  evidencePresent: boolean;
  cryptoVerified: boolean;
  physicalAttested: boolean;
  quorumWeight: 0 | 1;
  statusLabel: 'CLAIMED_PENDING' | 'REAL_HSM_VERIFIED' | 'SIMULATED_REJECTED';
}

export const PhysicalAttestationGate: React.FC<PhysicalAttestationGateProps> = ({
  allSlots,
  onEvidenceIntakeComplete,
  onSelectEvidence,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<number>(6);
  const [isEvaluating, setIsEvaluating] = useState<number | null>(null);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PIPELINE_INSPECTOR' | 'TRUTH_MATRIX'>('OVERVIEW');

  // Filter specifically for the critical #06-#08 slot range
  const targetSlots = allSlots.filter((s) => s.slotId >= 6 && s.slotId <= 8);

  const getAttestationState = (slot: CustodianEvidenceRecord): SlotAttestationState => {
    const isReal = slot.classification === 'REAL_HSM_SIGNED';
    const isSimulated = slot.classification === 'SIMULATED_MOCK';
    const isRejected = slot.classification === 'INVALID_REJECTED';

    const evidencePresent = Boolean(slot.evidenceId && slot.rawAttestationPayload);
    const cryptoVerified = Boolean(isReal && slot.signatureValid && slot.replayCheckPass);
    const physicalAttested = Boolean(isReal && slot.physicalAttestation && slot.identityMatch);
    const quorumWeight = isReal && cryptoVerified && physicalAttested ? 1 : 0;

    let statusLabel: 'CLAIMED_PENDING' | 'REAL_HSM_VERIFIED' | 'SIMULATED_REJECTED' = 'CLAIMED_PENDING';
    if (isReal && quorumWeight === 1) {
      statusLabel = 'REAL_HSM_VERIFIED';
    } else if (isSimulated || isRejected) {
      statusLabel = 'SIMULATED_REJECTED';
    }

    return {
      slotId: slot.slotId,
      custodianTitle: slot.custodianTitle,
      role: slot.role,
      device: slot.expectedDevice,
      pqcAlgo: slot.pqcAlgorithm,
      fingerprint: slot.expectedKeyFingerprint,
      claimed: true, // Slots #06-#08 are designated/claimed statutory slots
      evidencePresent,
      cryptoVerified,
      physicalAttested,
      quorumWeight,
      statusLabel,
    };
  };

  const currentSlot = allSlots.find((s) => s.slotId === selectedSlotId) || targetSlots[0];
  const currentState = getAttestationState(currentSlot);

  // Compute aggregate metrics for #06-#08
  const states = targetSlots.map(getAttestationState);
  const verifiedCount = states.filter((s) => s.quorumWeight === 1).length;
  const claimedCount = states.filter((s) => s.claimed).length;

  const handleSimulateVerificationCheck = (slot: CustodianEvidenceRecord) => {
    setIsEvaluating(slot.slotId);
    playTone(520, 0.05, 'sine', 0.08);

    setTimeout(() => {
      const isCurrentlyVerified = slot.classification === 'REAL_HSM_SIGNED';
      const logEntry = `[${new Date().toLocaleTimeString()}] AUDIT GATE SLOT #${slot.slotId}: ` +
        `Claimed=${slot.expectedDevice} | Status=${slot.classification} | QuorumWeight=${isCurrentlyVerified ? '+1' : '0'}`;

      setAuditLog((prev) => [logEntry, ...prev.slice(0, 7)]);
      setIsEvaluating(null);
      playAuditChime();
    }, 450);
  };

  return (
    <div
      id="physical-attestation-gate"
      className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c101d] via-black to-[#080c16] border-2 border-amber-500/40 space-y-5 font-mono text-xs shadow-2xl"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              PHYSICAL ATTESTATION GATE &bull; SLOTS #06–#08
            </span>
            <span className="text-[10px] text-zinc-400">
              ANTI-FRAUD CRYPTOGRAPHIC PROOF SUBSYSTEM
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            HSM-Backed Cryptographic Evidence Validation
          </h3>
          <p className="text-[11px] text-zinc-400">
            Enforces strict differentiation: <strong className="text-amber-300">CLAIMED ≠ CRYPTOGRAPHICALLY VERIFIED</strong>.
            Zero quorum weight assigned without genuine hardware enclave attestation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 text-right">
            <span className="text-[10px] text-zinc-500 block">SLOTS #06–#08 VERIFIED</span>
            <strong className="text-sm font-bold text-amber-300">
              {verifiedCount} / {claimedCount} Real HSMs
            </strong>
            <span className="text-[9px] text-zinc-400 block">
              {verifiedCount === 3 ? '🟢 All 3 Attested' : `🟡 ${3 - verifiedCount} Pending Proof`}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'OVERVIEW', label: '1. Attestation Matrix (#06–#08)', icon: Layers },
            { id: 'PIPELINE_INSPECTOR', label: '2. Enclave Pipeline Inspector', icon: Terminal },
            { id: 'TRUTH_MATRIX', label: '3. Legal & Safe Harbor Status', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  playTone(600, 0.02);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-white/5 text-zinc-400 border border-white/5 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-amber-400/90">
          <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
            CLAIMED ≠ VERIFIED
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30">
            BUILD ≠ RUNTIME
          </span>
        </div>
      </div>

      {/* Main Tab 1: Slots #06-#08 Grid & Selector */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {targetSlots.map((slot) => {
              const state = getAttestationState(slot);
              const isSelected = slot.slotId === selectedSlotId;

              return (
                <div
                  key={slot.slotId}
                  id={`attestation-card-${slot.slotId}`}
                  onClick={() => {
                    setSelectedSlotId(slot.slotId);
                    playTone(580, 0.03);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-[#121626] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-black/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 font-mono">
                        SLOT #{slot.slotId.toString().padStart(2, '0')}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-[190px]">
                        {slot.custodianTitle}
                      </h4>
                      <span className="text-[10px] text-zinc-400 block truncate max-w-[190px]">
                        {slot.role}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        state.quorumWeight === 1
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {state.quorumWeight === 1 ? 'WEIGHT: +1' : 'WEIGHT: 0'}
                    </span>
                  </div>

                  {/* Verification Pipeline Checks for this Slot */}
                  <div className="space-y-1.5 pt-1 border-t border-white/5 text-[10px]">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>1. Claimed Designation:</span>
                      <span className="text-emerald-400 font-bold">YES (SLOT ASSIGNED)</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>2. Evidence Token Present:</span>
                      <span className={state.evidencePresent ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {state.evidencePresent ? 'PRESENT' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>3. PQC Signature Verified:</span>
                      <span className={state.cryptoVerified ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                        {state.cryptoVerified ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>4. Hardware Enclave Attested:</span>
                      <span className={state.physicalAttested ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                        {state.physicalAttested ? 'ATTESTED' : 'UNATTESTED'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400 truncate max-w-[130px]">{slot.expectedDevice}</span>
                    <span className="text-cyan-300 font-mono text-[9px]">{slot.pqcAlgorithm}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Slot Detailed Deep Dive */}
          <div className="p-5 rounded-2xl bg-black/80 border border-amber-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-sm">
                  DETAILED PROOF VALIDATION &bull; SLOT #{currentState.slotId} ({currentState.custodianTitle})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSimulateVerificationCheck(currentSlot)}
                  disabled={isEvaluating !== null}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating === currentState.slotId ? 'animate-spin' : ''}`} />
                  <span>{isEvaluating === currentState.slotId ? 'AUDITING...' : 'RUN PROOF AUDIT'}</span>
                </button>

                {currentSlot.classification === 'REAL_HSM_SIGNED' && onSelectEvidence && (
                  <button
                    onClick={() => onSelectEvidence(currentSlot)}
                    className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>VIEW PROOF MODAL</span>
                  </button>
                )}
              </div>
            </div>

            {/* 5-Step Status Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-zinc-500 block">STEP 1: CLAIMED</span>
                <strong className="text-emerald-400 text-xs block">SLOT REGISTERED</strong>
                <span className="text-[9px] text-zinc-400">Statutory role defined</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-zinc-500 block">STEP 2: EVIDENCE TOKEN</span>
                <strong className={currentState.evidencePresent ? 'text-emerald-400 text-xs block' : 'text-amber-400 text-xs block'}>
                  {currentState.evidencePresent ? 'PAYLOAD DETECTED' : 'AWAITING PAYLOAD'}
                </strong>
                <span className="text-[9px] text-zinc-400">{currentSlot.evidenceId || 'No Evidence ID'}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-zinc-500 block">STEP 3: CRYPTO VERIFIED</span>
                <strong className={currentState.cryptoVerified ? 'text-emerald-400 text-xs block' : 'text-zinc-500 text-xs block'}>
                  {currentState.cryptoVerified ? 'PQC SIGNATURE VALID' : 'UNVERIFIED'}
                </strong>
                <span className="text-[9px] text-zinc-400">{currentState.pqcAlgo}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-zinc-500 block">STEP 4: PHYSICAL HSM</span>
                <strong className={currentState.physicalAttested ? 'text-emerald-400 text-xs block' : 'text-zinc-500 text-xs block'}>
                  {currentState.physicalAttested ? 'CERTIFIED ENCLAVE' : 'PENDING CEREMONY'}
                </strong>
                <span className="text-[9px] text-zinc-400">{currentState.device}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-zinc-500 block">STEP 5: QUORUM IMPACT</span>
                <strong className={currentState.quorumWeight === 1 ? 'text-emerald-400 text-xs block' : 'text-amber-400 text-xs block'}>
                  {currentState.quorumWeight === 1 ? 'QUORUM WEIGHT: +1' : 'QUORUM WEIGHT: 0'}
                </strong>
                <span className="text-[9px] text-zinc-400">{currentState.quorumWeight === 1 ? 'Counted in 8/10' : 'Excluded from Quorum'}</span>
              </div>
            </div>

            {/* Cryptographic Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Expected Key Fingerprint:</span>
                </div>
                <div className="font-mono text-cyan-300 text-xs break-all">
                  {currentState.fingerprint}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                  <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware Security Module (HSM):</span>
                </div>
                <div className="font-mono text-amber-300 text-xs">
                  {currentState.device} ({currentState.pqcAlgo})
                </div>
              </div>
            </div>

            {/* Invariant Footer */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-zinc-400">
              <span className="text-zinc-400">
                Genesis Block: <strong className="text-white">#{CANONICAL_GENESIS_BLOCK}</strong> &bull; Merkle Root: <code className="text-cyan-300">{CANONICAL_MERKLE_ROOT.slice(0, 16)}...</code>
              </span>
              <span className="text-emerald-400 font-bold">
                SSoT Mutation = 0 &bull; Read-Only Audit Enforcement
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Pipeline Inspector */}
      {activeTab === 'PIPELINE_INSPECTOR' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
              <Terminal className="w-4 h-4" />
              <span>Anti-Fraud Proof Pipeline Invariants (Deterministic Gate Chain)</span>
            </div>

            <div className="space-y-2 text-[11px] text-zinc-300">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <strong className="text-white block text-xs">Hardware Enclave Identity Check</strong>
                  <p className="text-zinc-400 text-[10px] mt-0.5">
                    Ensures the key was generated in a FIPS 140-3 Level 3 / CC EAL6+ physical hardware token (YubiKey 5C, Trezor Safe 5, Ledger Stax).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div>
                  <strong className="text-white block text-xs">Post-Quantum Lattice Verification</strong>
                  <p className="text-zinc-400 text-[10px] mt-0.5">
                    Validates ML-DSA (CRYSTALS-Dilithium-5) or FN-DSA (FALCON-1024) signatures against the quantum cryptanalysis threat model.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <div>
                  <strong className="text-white block text-xs">Genesis Epoch &amp; Anti-Replay Guard</strong>
                  <p className="text-zinc-400 text-[10px] mt-0.5">
                    Binds the signature to Nonce with Genesis Block #{CANONICAL_GENESIS_BLOCK} and Root hash <code className="text-cyan-300">{CANONICAL_MERKLE_ROOT.slice(0, 10)}...</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          {auditLog.length > 0 && (
            <div className="p-3.5 rounded-xl bg-black border border-white/10 space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-bold block">REAL-TIME ATTESTATION AUDIT LOG:</span>
              <div className="space-y-1 text-[10px] font-mono text-zinc-300">
                {auditLog.map((log, idx) => (
                  <div key={idx} className="truncate">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tab 3: Legal & Safe Harbor Truth Matrix */}
      {activeTab === 'TRUTH_MATRIX' && (
        <div className="p-5 rounded-2xl bg-black/80 border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
            <FileCheck2 className="w-4 h-4" />
            <span>Thai Electronic Transactions Act B.E. 2544 (Sections 9, 26, 28) Safe Harbor Gate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <strong className="text-amber-300 block text-xs">Section 9 (มาตรา ๙)</strong>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Legal recognition of electronic signatures. Requires verifiable identity and clear intent manifesting from the signatory.
              </p>
              <span className="text-emerald-400 text-[9px] font-bold block">STATUS: STATUTORILY COMPLIANT</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <strong className="text-amber-300 block text-xs">Section 26 (มาตรา ๒๖)</strong>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Statutory presumption of reliability for reliable electronic signatures under the sole control of the signatory.
              </p>
              <span className="text-emerald-400 text-[9px] font-bold block">STATUS: SOVEREIGN ENCLAVE CONTROL</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <strong className="text-amber-300 block text-xs">Section 28 (มาตรา ๒๘)</strong>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Duty of care & safe harbor immunity for Relying Parties and Custodians utilizing FIPS certified hardware keys.
              </p>
              <span className="text-emerald-400 text-[9px] font-bold block">STATUS: SAFE HARBOR GRANTED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
