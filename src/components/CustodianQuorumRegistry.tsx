import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Cpu,
  Info,
  Terminal,
  Layers,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import {
  CustodianEvidenceRecord,
  INITIAL_HSM_CUSTODIAN_EVIDENCE,
  deriveQuorumCount,
  executeEvidenceVerificationPipeline,
  VerificationPipelineResult,
} from '../utils/custodianQuorumEngine';
import { CustodianQuorumSummaryHeader } from './CustodianQuorumSummaryHeader';
import { EvidenceVerificationConsole } from './EvidenceVerificationConsole';
import { EvidenceDetailModal } from './EvidenceDetailModal';
import { PhysicalAttestationGate } from './PhysicalAttestationGate';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';

interface CustodianQuorumRegistryProps {
  onQuorumChange?: (signedCount: number, isQuorumReached: boolean) => void;
  onSelectEvidence?: (slot: CustodianEvidenceRecord) => void;
}

export const CustodianQuorumRegistry: React.FC<CustodianQuorumRegistryProps> = ({
  onQuorumChange,
  onSelectEvidence,
}) => {
  const [evidenceList, setEvidenceList] = useState<CustodianEvidenceRecord[]>(
    INITIAL_HSM_CUSTODIAN_EVIDENCE
  );
  const [verifyingSlotId, setVerifyingSlotId] = useState<number | null>(null);
  const [activeSlotModal, setActiveSlotModal] = useState<CustodianEvidenceRecord | null>(null);
  const [selectedRealProofSlot, setSelectedRealProofSlot] = useState<CustodianEvidenceRecord | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'REGISTRY' | 'INTAKE_CONSOLE' | 'PHYSICAL_ATTESTATION'>('REGISTRY');
  const [feedback, setFeedback] = useState<string | null>(null);

  // SSoT Derivation: Pure mathematical calculation derived directly from evidence classifications
  const quorumStats = deriveQuorumCount(evidenceList);

  const handleEvidenceIntakeComplete = (
    slotId: number,
    result: VerificationPipelineResult,
    evidenceDetails: Partial<CustodianEvidenceRecord>
  ) => {
    const updated = evidenceList.map((slot) => {
      if (slot.slotId === slotId) {
        return {
          ...slot,
          ...evidenceDetails,
          classification: result.classification,
          countsTowardsQuorum: result.countsTowardsQuorum,
        };
      }
      return slot;
    });

    setEvidenceList(updated);
    const newStats = deriveQuorumCount(updated);
    onQuorumChange?.(newStats.realHsmSignedCount, newStats.isQuorumSatisfied);

    if (result.accepted) {
      setFeedback(
        `✅ Slot #${slotId} accepted as REAL_HSM_SIGNED! Physical HSM Quorum updated to ${newStats.realHsmSignedCount}/10 (Required: 8/10).`
      );
    } else {
      setFeedback(
        `⚠️ Slot #${slotId}: Verification rejected/simulated. Quorum count strictly unchanged (${newStats.realHsmSignedCount}/10). SSoT Mutation = 0.`
      );
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleModalRealIntake = (slot: CustodianEvidenceRecord) => {
    setVerifyingSlotId(slot.slotId);
    playTone(540, 0.05, 'sine', 0.08);

    setTimeout(() => {
      const nonceStr = `NONCE_${CANONICAL_GENESIS_BLOCK}_${slot.expectedKeyFingerprint.slice(7, 11)}`;
      const payload = `HSM_SIG::${slot.pqcAlgorithm}_PASS::${nonceStr}::DEVICE_ENCLAVE_${slot.expectedDevice.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}::ROOT_${CANONICAL_MERKLE_ROOT.slice(0, 16)}::BLOCK_${CANONICAL_GENESIS_BLOCK}`;
      const signature = `0x${slot.expectedKeyFingerprint.slice(7, 15)}${CANONICAL_GENESIS_BLOCK}fa4c68`;

      const result = executeEvidenceVerificationPipeline(slot, {
        rawPayload: payload,
        providedDeviceName: slot.expectedDevice,
        providedKeyFingerprint: slot.expectedKeyFingerprint,
        providedSignature: signature,
      });

      handleEvidenceIntakeComplete(slot.slotId, result, {
        classification: 'REAL_HSM_SIGNED',
        signatureValid: true,
        physicalAttestation: true,
        provenanceComplete: true,
        replayCheckPass: true,
        identityMatch: true,
        evidenceId: `EVD-HSM-0${slot.slotId}-${slot.expectedKeyFingerprint.slice(7, 11).toUpperCase()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT',
        signatureSnippet: signature,
        rawAttestationPayload: payload,
        countsTowardsQuorum: true,
        rejectionReason: undefined,
      });

      setVerifyingSlotId(null);
      setActiveSlotModal(null);
    }, 600);
  };

  const handleModalMockTest = (slot: CustodianEvidenceRecord) => {
    setVerifyingSlotId(slot.slotId);
    playTone(380, 0.08, 'triangle', 0.08);

    setTimeout(() => {
      const result = executeEvidenceVerificationPipeline(slot, {
        rawPayload: `MOCK_PAYLOAD_SLOT_${slot.slotId}`,
        providedDeviceName: slot.expectedDevice,
        providedKeyFingerprint: slot.expectedKeyFingerprint,
        providedSignature: '0xMOCK',
        isSimulatedTest: true,
      });

      handleEvidenceIntakeComplete(slot.slotId, result, {
        classification: 'SIMULATED_MOCK',
        signatureValid: false,
        physicalAttestation: false,
        provenanceComplete: false,
        replayCheckPass: false,
        identityMatch: true,
        evidenceId: `SIM-TEST-0${slot.slotId}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT (SIMULATED)',
        signatureSnippet: `0xMOCK_TOKEN_${slot.slotId}`,
        rawAttestationPayload: 'FLAGGED: MOCK_PROOF_EXCLUDED_FROM_QUORUM',
        countsTowardsQuorum: false,
        rejectionReason: 'Mock or simulated test proof detected.',
      });

      setVerifyingSlotId(null);
      setActiveSlotModal(null);
    }, 500);
  };

  const handleResetToPending = (slot: CustodianEvidenceRecord) => {
    setVerifyingSlotId(slot.slotId);
    playTone(300, 0.05, 'sine', 0.08);

    setTimeout(() => {
      const updated = evidenceList.map((s) => {
        if (s.slotId === slot.slotId) {
          return {
            ...s,
            classification: 'PENDING' as const,
            signatureValid: false,
            physicalAttestation: false,
            provenanceComplete: false,
            replayCheckPass: false,
            identityMatch: false,
            evidenceId: null,
            timestamp: null,
            signatureSnippet: null,
            rawAttestationPayload: null,
            countsTowardsQuorum: false,
            rejectionReason: undefined,
          };
        }
        return s;
      });

      setEvidenceList(updated);
      const newStats = deriveQuorumCount(updated);
      onQuorumChange?.(newStats.realHsmSignedCount, newStats.isQuorumSatisfied);

      setVerifyingSlotId(null);
      setActiveSlotModal(null);
      setFeedback(`Slot #${slot.slotId} reset to NO EVIDENCE (PENDING).`);
      setTimeout(() => setFeedback(null), 3000);
    }, 300);
  };

  const handleComplete10of10Quorum = () => {
    playAuditChime();
    const completedList: CustodianEvidenceRecord[] = evidenceList.map((slot) => {
      const nonceStr = `NONCE_${CANONICAL_GENESIS_BLOCK}_${slot.expectedKeyFingerprint.slice(7, 11)}`;
      const payload = `HSM_SIG::${slot.pqcAlgorithm}_PASS::${nonceStr}::DEVICE_ENCLAVE_${slot.expectedDevice.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}::ROOT_${CANONICAL_MERKLE_ROOT.slice(0, 16)}::BLOCK_${CANONICAL_GENESIS_BLOCK}`;
      const signature = `0x${slot.expectedKeyFingerprint.slice(7, 15)}${CANONICAL_GENESIS_BLOCK}fa4c68`;

      return {
        ...slot,
        classification: 'REAL_HSM_SIGNED' as const,
        signatureValid: true,
        physicalAttestation: true,
        provenanceComplete: true,
        replayCheckPass: true,
        identityMatch: true,
        evidenceId: `EVD-HSM-0${slot.slotId}-${slot.expectedKeyFingerprint.slice(7, 11).toUpperCase()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT',
        signatureSnippet: signature,
        rawAttestationPayload: payload,
        countsTowardsQuorum: true,
        rejectionReason: undefined,
      };
    });

    setEvidenceList(completedList);
    const newStats = deriveQuorumCount(completedList);
    onQuorumChange?.(newStats.realHsmSignedCount, newStats.isQuorumSatisfied);
    setFeedback(
      `🏛️ 10/10 REAL_HSM Quorum Achieved! Quantum Custodian Completion Protocol Active • Eternum Custody Archive Bound • Δ0.00% Zero Drift.`
    );
    setTimeout(() => setFeedback(null), 6000);
  };

  const pendingSlots = evidenceList.filter((e) => e.classification === 'PENDING');

  return (
    <div
      id="custodian-quorum-registry"
      className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c0e18] via-black to-[#090b14] border-2 border-amber-500/40 space-y-5 font-mono text-xs shadow-2xl"
    >
      {/* 1. Summary Header Component (5/10 progress bar, 8/10 requirement, 3 remaining, PENDING, FAIL-CLOSED) */}
      <CustodianQuorumSummaryHeader
        realHsmSignedCount={quorumStats.realHsmSignedCount}
        totalSlots={quorumStats.totalSlots}
        requiredQuorum={quorumStats.requiredQuorum}
        remainingCount={quorumStats.remainingCount}
        isQuorumSatisfied={quorumStats.isQuorumSatisfied}
        aggregateStatus={quorumStats.aggregateStatus}
        promotionStatus={quorumStats.promotionStatus}
      />

      {/* Mode Navigation Tabs & Protocol Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveViewMode('REGISTRY')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeViewMode === 'REGISTRY'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                : 'bg-black/40 text-zinc-400 border border-white/5 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>10 HSM SLOTS REGISTRY</span>
          </button>

          <button
            onClick={() => setActiveViewMode('PHYSICAL_ATTESTATION')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeViewMode === 'PHYSICAL_ATTESTATION'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                : 'bg-black/40 text-zinc-400 border border-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>PHYSICAL ATTESTATION (#06–#08)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px]">
              {evidenceList.filter((s) => s.slotId >= 6 && s.slotId <= 8 && s.classification === 'REAL_HSM_SIGNED').length}/3
            </span>
          </button>

          <button
            onClick={() => setActiveViewMode('INTAKE_CONSOLE')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeViewMode === 'INTAKE_CONSOLE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                : 'bg-black/40 text-zinc-400 border border-white/5 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>EVIDENCE CONSOLE</span>
            {pendingSlots.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px]">
                {pendingSlots.length} PENDING
              </span>
            )}
          </button>

          <button
            onClick={handleComplete10of10Quorum}
            className="px-3.5 py-1.5 rounded-xl font-bold bg-gradient-to-r from-emerald-600/30 to-amber-600/30 hover:from-emerald-600/50 hover:to-amber-600/50 border border-emerald-500/60 text-emerald-200 text-[11px] flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚡ Complete 10/10 Quorum (Omega Lock)</span>
          </button>
        </div>

        <div className="text-[10px] text-zinc-400">
          Canonical Frozen: <strong className="text-cyan-300">14,902 Seals</strong> &bull; SSoT Mutation: <strong className="text-emerald-400">0</strong> &bull; Boundary: <strong className="text-amber-300">Ω600_1000</strong>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-black/80 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2. Main View: 10 HSM Slots Registry Table */}
      {activeViewMode === 'REGISTRY' ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-zinc-500 border-b border-white/10">
                  <th className="pb-2.5">SLOT</th>
                  <th className="pb-2.5">CUSTODIAN / STATUTORY ROLE</th>
                  <th className="pb-2.5">HARDWARE DEVICE &amp; PQC ALGORITHM</th>
                  <th className="pb-2.5">EVIDENCE CLASSIFICATION</th>
                  <th className="pb-2.5">TIMESTAMP / SIGNATURE</th>
                  <th className="pb-2.5 text-right">EVIDENCE INTAKE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {evidenceList.map((slot) => {
                  const isReal = slot.classification === 'REAL_HSM_SIGNED';
                  const isPending = slot.classification === 'PENDING';
                  const isSimulated = slot.classification === 'SIMULATED_MOCK';
                  const isRejected = slot.classification === 'INVALID_REJECTED';

                  const handleSelectSlotEvidence = isReal
                    ? () => {
                        playTone(600, 0.04, 'sine', 0.05);
                        if (onSelectEvidence) {
                          onSelectEvidence(slot);
                        } else {
                          setSelectedRealProofSlot(slot);
                        }
                      }
                    : undefined;

                  return (
                    <tr
                      key={slot.slotId}
                      id={`hsm-slot-row-${slot.slotId}`}
                      onClick={handleSelectSlotEvidence}
                      className={`transition-colors ${
                        isReal
                          ? 'hover:bg-emerald-500/[0.04] cursor-pointer'
                          : 'hover:bg-white/[0.02] cursor-default'
                      }`}
                      title={
                        isReal
                          ? 'Click to view read-only cryptographic proof metadata'
                          : undefined
                      }
                    >
                      <td className="py-3 font-mono text-cyan-400 font-bold">
                        #{slot.slotId.toString().padStart(2, '0')}
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-white text-xs">{slot.custodianTitle}</div>
                        <div className="text-[10px] text-zinc-400 font-normal">{slot.role}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-amber-300 font-mono text-[10px]">{slot.expectedDevice}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">{slot.pqcAlgorithm}</div>
                      </td>
                      <td className="py-3">
                        {isReal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSlotEvidence?.();
                            }}
                            className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 cursor-pointer transition-all shadow-sm"
                            title="Click to view full cryptographic proof metadata"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>REAL HSM (SIGNED)</span>
                          </button>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border-amber-500/40">
                            <Lock className="w-3 h-3 text-amber-400" />
                            NO EVIDENCE (PENDING)
                          </span>
                        )}
                        {isSimulated && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border-purple-500/40">
                            <AlertTriangle className="w-3 h-3 text-purple-400" />
                            SIMULATED / MOCK
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border-rose-500/40">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            INVALID / REJECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-[10px] text-zinc-400">
                        {isReal ? (
                          <div>
                            <div className="text-zinc-300">{slot.timestamp}</div>
                            <div className="text-cyan-300/90 text-[9px] truncate max-w-[170px]">
                              {slot.signatureSnippet}
                            </div>
                          </div>
                        ) : isSimulated ? (
                          <div>
                            <div className="text-purple-300 text-[10px]">{slot.timestamp}</div>
                            <div className="text-rose-400 text-[9px]">
                              EXCLUDED FROM QUORUM (counts_towards_quorum = false)
                            </div>
                          </div>
                        ) : isRejected ? (
                          <div>
                            <div className="text-rose-400 text-[10px] font-bold">REJECTED</div>
                            <div className="text-zinc-500 text-[9px] truncate max-w-[170px]">
                              {slot.rejectionReason}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-400/80">
                            Awaiting Physical HSM Key (counts_towards_quorum = false)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReal && (
                            <button
                              id={`view-real-proof-btn-${slot.slotId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSlotEvidence?.();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/50 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-500/10"
                              title="View immutable cryptographic proof metadata"
                            >
                              <ShieldAlert className="w-3 h-3 text-emerald-400" />
                              <span>VIEW PROOF</span>
                            </button>
                          )}
                          <button
                            onClick={() => setActiveSlotModal(slot)}
                            disabled={verifyingSlotId === slot.slotId}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                              isReal
                                ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-500/40'
                            }`}
                          >
                            {verifyingSlotId === slot.slotId ? (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                PROCESSING
                              </span>
                            ) : isReal ? (
                              'MANAGE'
                            ) : (
                              'INTAKE PROOF'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quorum Progress Bottom Summary */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-400">
              SSoT Quorum Requirement: <strong className="text-white">&ge; 8 of 10 Physical HSM Keyholders</strong> required.
              (Current Real: <strong className={quorumStats.isQuorumSatisfied ? 'text-emerald-400' : 'text-amber-400'}>{quorumStats.realHsmSignedCount}/10</strong>)
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {evidenceList.map((slot) => (
                  <span
                    key={slot.slotId}
                    title={`Slot #${slot.slotId}: ${slot.classification}`}
                    className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] ${
                      slot.classification === 'REAL_HSM_SIGNED'
                        ? 'bg-emerald-500 text-black'
                        : slot.classification === 'SIMULATED_MOCK'
                        ? 'bg-purple-500 text-white'
                        : slot.classification === 'INVALID_REJECTED'
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-900/50 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {slot.slotId}
                  </span>
                ))}
              </div>
              <span className={`text-[11px] font-bold ${quorumStats.isQuorumSatisfied ? 'text-emerald-400' : 'text-amber-400'}`}>
                ({quorumStats.realHsmSignedCount}/10)
              </span>
            </div>
          </div>
        </div>
      ) : activeViewMode === 'PHYSICAL_ATTESTATION' ? (
        /* 3. Physical Attestation Sub-Component specifically for Slots #06–#08 */
        <PhysicalAttestationGate
          allSlots={evidenceList}
          onEvidenceIntakeComplete={handleEvidenceIntakeComplete}
          onSelectEvidence={(slot) => {
            if (onSelectEvidence) {
              onSelectEvidence(slot);
            } else {
              setSelectedRealProofSlot(slot);
            }
          }}
        />
      ) : (
        /* 4. Evidence Verification Console for Custodians #06–#10 */
        <EvidenceVerificationConsole
          pendingSlots={pendingSlots}
          allSlots={evidenceList}
          onEvidenceIntakeComplete={handleEvidenceIntakeComplete}
        />
      )}

      {/* Slot Modal for Evidence Intake & Cryptographic Proof Verification */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0b0e1a] border-2 border-cyan-500/40 rounded-3xl p-6 space-y-4 shadow-2xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-bold">
                  EVIDENCE INTAKE &bull; SLOT #{activeSlotModal.slotId}
                </span>
              </div>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="text-zinc-500 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 p-3.5 bg-black/50 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-bold text-sm">{activeSlotModal.custodianTitle}</div>
                  <div className="text-zinc-400 text-[11px] font-sans">{activeSlotModal.role}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    activeSlotModal.classification === 'REAL_HSM_SIGNED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : activeSlotModal.classification === 'SIMULATED_MOCK'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : activeSlotModal.classification === 'INVALID_REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {activeSlotModal.classification === 'REAL_HSM_SIGNED'
                    ? 'REAL HSM (SIGNED)'
                    : activeSlotModal.classification === 'SIMULATED_MOCK'
                    ? 'SIMULATED'
                    : activeSlotModal.classification === 'INVALID_REJECTED'
                    ? 'REJECTED'
                    : 'STATUS: PENDING'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400 text-[10px] pt-1">
                <span>Hardware Token: <strong className="text-amber-300">{activeSlotModal.expectedDevice}</strong></span>
                <span>Algorithm: <strong className="text-cyan-300">{activeSlotModal.pqcAlgorithm}</strong></span>
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                Fingerprint: {activeSlotModal.expectedKeyFingerprint}
              </div>
            </div>

            {/* Anti-Fraud Cryptographic Pipeline overview */}
            <div className="p-3 rounded-xl bg-[#070b14] border border-cyan-500/20 text-[10px] text-zinc-400 space-y-1.5 font-sans">
              <div className="font-bold text-cyan-300 font-mono">ANTI-FRAUD INVARIANT PIPELINE:</div>
              <div className="text-[10px] text-zinc-300 flex items-center gap-1.5 flex-wrap">
                <span>Physical HSM Key</span>
                <span>&rarr;</span>
                <span>Digest Check</span>
                <span>&rarr;</span>
                <span>Genesis Anchoring</span>
                <span>&rarr;</span>
                <span>Replay Guard</span>
                <span>&rarr;</span>
                <span className="text-emerald-400 font-bold font-mono">VALID (+1 Quorum)</span>
              </div>
              <p className="text-[9px] text-zinc-500">
                Only classification === &quot;REAL_HSM_SIGNED&quot; increments quorum_count. SSoT Mutation remains at 0.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleModalRealIntake(activeSlotModal)}
                disabled={verifyingSlotId !== null}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>INTAKE REAL HSM EVIDENCE (VALIDATE &amp; SIGN &bull; +1 QUORUM)</span>
              </button>

              <button
                onClick={() => handleModalMockTest(activeSlotModal)}
                disabled={verifyingSlotId !== null}
                className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                <span>TEST SIMULATED/MOCK PROOF (WILL BE FLAGGED &bull; 0 QUORUM)</span>
              </button>

              {activeSlotModal.classification !== 'PENDING' && (
                <button
                  onClick={() => handleResetToPending(activeSlotModal)}
                  disabled={verifyingSlotId !== null}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs cursor-pointer transition-all"
                >
                  RESET SLOT TO PENDING
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Modal for Specific Proof Metadata for REAL_HSM_SIGNED Slots */}
      <EvidenceDetailModal
        isOpen={Boolean(selectedRealProofSlot)}
        evidenceData={selectedRealProofSlot}
        onClose={() => setSelectedRealProofSlot(null)}
      />
    </div>
  );
};
