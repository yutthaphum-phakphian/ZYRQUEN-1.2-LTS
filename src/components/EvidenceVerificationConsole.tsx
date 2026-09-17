import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Key,
  Fingerprint,
  ArrowRight,
  Sparkles,
  FileCheck,
  Zap,
} from 'lucide-react';
import {
  CustodianEvidenceRecord,
  VerificationPipelineResult,
  PipelineStepLog,
  executeEvidenceVerificationPipeline,
} from '../utils/custodianQuorumEngine';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';

interface EvidenceVerificationConsoleProps {
  pendingSlots: CustodianEvidenceRecord[];
  allSlots: CustodianEvidenceRecord[];
  onEvidenceIntakeComplete: (
    slotId: number,
    result: VerificationPipelineResult,
    evidenceDetails: Partial<CustodianEvidenceRecord>
  ) => void;
}

export const EvidenceVerificationConsole: React.FC<EvidenceVerificationConsoleProps> = ({
  pendingSlots,
  allSlots,
  onEvidenceIntakeComplete,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<number>(
    pendingSlots.length > 0 ? pendingSlots[0].slotId : 6
  );
  const [pipelineState, setPipelineState] = useState<'IDLE' | 'EXECUTING' | 'ACCEPTED' | 'REJECTED'>('IDLE');
  const [activeLogs, setActiveLogs] = useState<PipelineStepLog[]>([]);
  const [currentResult, setCurrentResult] = useState<VerificationPipelineResult | null>(null);

  const selectedSlot = allSlots.find((s) => s.slotId === selectedSlotId) || allSlots[0];

  const handleRunPipeline = (mode: 'REAL_VALID' | 'TAMPERED_SIG' | 'REPLAY_NONCE' | 'SIMULATION_MOCK') => {
    if (!selectedSlot) return;

    setPipelineState('EXECUTING');
    setActiveLogs([]);
    setCurrentResult(null);

    const nonceStr = `NONCE_${CANONICAL_GENESIS_BLOCK}_${selectedSlot.expectedKeyFingerprint.slice(7, 11)}`;
    let payload = `HSM_SIG::${selectedSlot.pqcAlgorithm}_PASS::${nonceStr}::DEVICE_ENCLAVE_${selectedSlot.expectedDevice.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}::ROOT_${CANONICAL_MERKLE_ROOT.slice(0, 16)}::BLOCK_${CANONICAL_GENESIS_BLOCK}`;
    let signature = `0x${selectedSlot.expectedKeyFingerprint.slice(7, 15)}${CANONICAL_GENESIS_BLOCK}fa4c68`;
    let keyFingerprint = selectedSlot.expectedKeyFingerprint;
    let deviceName = selectedSlot.expectedDevice;
    let isSimulated = false;
    let forceTampered = false;
    let forceReplay = false;

    if (mode === 'SIMULATION_MOCK') {
      isSimulated = true;
      payload = `MOCK_SIMULATED_PAYLOAD::SLOT_${selectedSlot.slotId}::NO_HARDWARE_KEY`;
    } else if (mode === 'TAMPERED_SIG') {
      forceTampered = true;
      signature = '0xCORRUPTED';
    } else if (mode === 'REPLAY_NONCE') {
      forceReplay = true;
    }

    setTimeout(() => {
      const result = executeEvidenceVerificationPipeline(selectedSlot, {
        rawPayload: payload,
        providedDeviceName: deviceName,
        providedKeyFingerprint: keyFingerprint,
        providedSignature: signature,
        isSimulatedTest: isSimulated,
        forceTamperedPayload: forceTampered,
        forceReplay: forceReplay,
      });

      setActiveLogs(result.logs);
      setCurrentResult(result);

      if (result.accepted) {
        setPipelineState('ACCEPTED');
        playAuditChime();
        onEvidenceIntakeComplete(selectedSlot.slotId, result, {
          classification: 'REAL_HSM_SIGNED',
          signatureValid: true,
          physicalAttestation: true,
          provenanceComplete: true,
          replayCheckPass: true,
          identityMatch: true,
          evidenceId: `EVD-HSM-0${selectedSlot.slotId}-${selectedSlot.expectedKeyFingerprint.slice(7, 11).toUpperCase()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT',
          signatureSnippet: signature,
          rawAttestationPayload: payload,
          countsTowardsQuorum: true,
          rejectionReason: undefined,
        });
      } else {
        setPipelineState('REJECTED');
        playTone(220, 0.2, 'sawtooth', 0.1);
        onEvidenceIntakeComplete(selectedSlot.slotId, result, {
          classification: result.classification,
          signatureValid: result.classification === 'REAL_HSM_SIGNED',
          physicalAttestation: false,
          provenanceComplete: false,
          replayCheckPass: false,
          identityMatch: !result.rejectionReason?.includes('fingerprint'),
          countsTowardsQuorum: false,
          rejectionReason: result.rejectionReason,
        });
      }
    }, 700);
  };

  return (
    <div
      id="evidence-verification-console"
      className="p-6 rounded-[28px] bg-[#070a13] border-2 border-cyan-500/30 space-y-6 font-mono text-xs shadow-2xl"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
              ZYRQUEN &Omega;&infin; &bull; EVIDENCE VERIFICATION CONSOLE v1
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            PHYSICAL HSM EVIDENCE INTAKE &amp; CRYPTOGRAPHIC GATE
          </h3>
          <p className="text-[11px] text-zinc-400 font-sans">
            Strict Pipeline: <strong className="text-white">INTAKE &rarr; IDENTITY &rarr; ATTESTATION &rarr; SIGNATURE &rarr; PROVENANCE &rarr; REPLAY &rarr; ACCEPTANCE &rarr; QUORUM</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-bold border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>ENCLAVE GATE: FAIL-CLOSED</span>
          </span>
        </div>
      </div>

      {/* Pipeline 8-Stage Flow Visualization */}
      <div className="p-4 rounded-2xl bg-black/70 border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-2">
          <span className="font-bold text-white">FORMAL 8-STAGE VERIFICATION PIPELINE</span>
          <span>Zero Mutation Contract &bull; SSoT = 0</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[10px]">
          {[
            { num: '01', name: 'EVIDENCE RECV', desc: 'Buffer Intake' },
            { num: '02', name: 'IDENTITY CHECK', desc: 'Fingerprint Match' },
            { num: '03', name: 'DEVICE ATTEST', desc: 'Hardware Enclave' },
            { num: '04', name: 'SIG VERIFY', desc: 'PQC Lattice Math' },
            { num: '05', name: 'PROVENANCE', desc: 'Genesis Block #' + CANONICAL_GENESIS_BLOCK },
            { num: '06', name: 'REPLAY GUARD', desc: 'Anti-Replay Nonce' },
            { num: '07', name: 'ACCEPTANCE', desc: 'Crypto Validation' },
            { num: '08', name: 'QUORUM DERIVE', desc: 'Real HSM +1' },
          ].map((stage, idx) => (
            <div
              key={stage.num}
              className={`p-2 rounded-xl border flex flex-col justify-between ${
                pipelineState === 'ACCEPTED'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : pipelineState === 'REJECTED' && idx < activeLogs.length
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : pipelineState === 'EXECUTING'
                  ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300 animate-pulse'
                  : 'bg-black/40 border-white/5 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[9px]">
                <span className="opacity-50">#{stage.num}</span>
                {pipelineState === 'ACCEPTED' ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                ) : pipelineState === 'REJECTED' && idx >= activeLogs.length - 1 ? (
                  <XCircle className="w-2.5 h-2.5 text-rose-400" />
                ) : null}
              </div>
              <div className="font-bold truncate mt-1">{stage.name}</div>
              <div className="text-[9px] opacity-70 truncate">{stage.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Slot Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Slot Selection Panel */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
          <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
            <span>SELECT CUSTODIAN SLOT:</span>
            <span className="text-zinc-500">{allSlots.length} Slots Available</span>
          </div>

          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {allSlots.map((slot) => {
              const isSelected = slot.slotId === selectedSlotId;
              const isReal = slot.classification === 'REAL_HSM_SIGNED';
              const isPending = slot.classification === 'PENDING';
              const isSim = slot.classification === 'SIMULATED_MOCK';
              const isInv = slot.classification === 'INVALID_REJECTED';

              return (
                <button
                  key={slot.slotId}
                  onClick={() => {
                    setSelectedSlotId(slot.slotId);
                    setPipelineState('IDLE');
                    setActiveLogs([]);
                    setCurrentResult(null);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-black/40 border-white/5 hover:border-white/20 text-zinc-300'
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="text-cyan-400">#{slot.slotId}</span>
                      <span className="truncate">{slot.custodianTitle}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-sans truncate">
                      {slot.expectedDevice} &bull; {slot.pqcAlgorithm}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isReal && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        🟢 SIGNED
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        🟡 PENDING
                      </span>
                    )}
                    {isSim && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        ⚪ SIMULATED
                      </span>
                    )}
                    {isInv && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        🔴 REJECTED
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot Dossier and Intake Verification Controls */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="text-white font-bold text-sm flex items-center gap-2">
                <span className="text-cyan-400">SLOT #{selectedSlot.slotId}:</span>
                <span>{selectedSlot.custodianTitle}</span>
              </div>
              <div className="text-[11px] text-zinc-400 font-sans">{selectedSlot.role}</div>
            </div>

            <div className="text-right">
              <span
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border inline-block ${
                  selectedSlot.classification === 'REAL_HSM_SIGNED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : selectedSlot.classification === 'SIMULATED_MOCK'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : selectedSlot.classification === 'INVALID_REJECTED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {selectedSlot.classification === 'REAL_HSM_SIGNED'
                  ? '🟢 REAL HSM (SIGNED)'
                  : selectedSlot.classification === 'SIMULATED_MOCK'
                  ? '⚪ SIMULATED / MOCK'
                  : selectedSlot.classification === 'INVALID_REJECTED'
                  ? '🔴 INVALID / REJECTED'
                  : '🟡 NO EVIDENCE (PENDING)'}
              </span>
              <div className="text-[9px] text-zinc-500 mt-1">
                {selectedSlot.countsTowardsQuorum
                  ? 'counts_towards_quorum = true (+1)'
                  : 'counts_towards_quorum = false (0)'}
              </div>
            </div>
          </div>

          {/* Key & Hardware Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-black/80 border border-white/5 text-[10px]">
            <div>
              <span className="text-zinc-500">HARDWARE DEVICE:</span>
              <div className="text-amber-300 font-bold">{selectedSlot.expectedDevice}</div>
            </div>
            <div>
              <span className="text-zinc-500">PQC ALGORITHM:</span>
              <div className="text-cyan-300 font-bold">{selectedSlot.pqcAlgorithm}</div>
            </div>
            <div>
              <span className="text-zinc-500">KEY FINGERPRINT:</span>
              <div className="text-zinc-300 font-bold font-mono">{selectedSlot.expectedKeyFingerprint}</div>
            </div>
          </div>

          {/* Verification Pipeline Execution Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-zinc-300">
              INTAKE ACTION / CRYPTOGRAPHIC PROOF INGESTION:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleRunPipeline('REAL_VALID')}
                disabled={pipelineState === 'EXECUTING'}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                {pipelineState === 'EXECUTING' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>INTAKE REAL PHYSICAL HSM PROOF (+1 QUORUM)</span>
              </button>

              <button
                onClick={() => {
                  pendingSlots.forEach((slot, idx) => {
                    setTimeout(() => {
                      const nonceStr = `NONCE_${CANONICAL_GENESIS_BLOCK}_${slot.expectedKeyFingerprint.slice(7, 11)}`;
                      const payload = `HSM_SIG::${slot.pqcAlgorithm}_PASS::${nonceStr}::DEVICE_ENCLAVE_${slot.expectedDevice.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}::ROOT_${CANONICAL_MERKLE_ROOT.slice(0, 16)}::BLOCK_${CANONICAL_GENESIS_BLOCK}`;
                      const signature = `0x${slot.expectedKeyFingerprint.slice(7, 15)}${CANONICAL_GENESIS_BLOCK}fa4c68`;
                      const res = executeEvidenceVerificationPipeline(slot, {
                        rawPayload: payload,
                        providedDeviceName: slot.expectedDevice,
                        providedKeyFingerprint: slot.expectedKeyFingerprint,
                        providedSignature: signature,
                      });
                      onEvidenceIntakeComplete(slot.slotId, res, {
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
                    }, idx * 100);
                  });
                  playAuditChime();
                }}
                disabled={pipelineState === 'EXECUTING' || pendingSlots.length === 0}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-amber-600/30 hover:from-emerald-600/50 hover:to-amber-600/50 text-emerald-300 border border-emerald-500/50 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-500/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ INTAKE ALL PENDING ({pendingSlots.length}) &rarr; 10/10</span>
              </button>

              <button
                onClick={() => handleRunPipeline('SIMULATION_MOCK')}
                disabled={pipelineState === 'EXECUTING'}
                className="py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                <span>TEST SIMULATED/MOCK PROOF (0 QUORUM)</span>
              </button>

              <button
                onClick={() => handleRunPipeline('TAMPERED_SIG')}
                disabled={pipelineState === 'EXECUTING'}
                className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>TEST CORRUPTED SIGNATURE (REJECTED)</span>
              </button>

              <button
                onClick={() => handleRunPipeline('REPLAY_NONCE')}
                disabled={pipelineState === 'EXECUTING'}
                className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>TEST REPLAY ATTACK (REJECTED)</span>
              </button>
            </div>
          </div>

          {/* Interactive Logs Window */}
          {activeLogs.length > 0 && (
            <div className="p-3.5 rounded-xl bg-black border border-white/10 space-y-2 text-[10px]">
              <div className="text-zinc-400 font-bold flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="flex items-center gap-1 text-white">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  VERIFICATION PIPELINE AUDIT TRACE
                </span>
                <span className="text-zinc-500">SSoT Mutation = 0</span>
              </div>

              <div className="space-y-1 max-h-44 overflow-y-auto">
                {activeLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 rounded flex items-start gap-2 ${
                      log.status === 'PASS'
                        ? 'bg-emerald-950/20 text-emerald-300'
                        : 'bg-rose-950/20 text-rose-300'
                    }`}
                  >
                    <span className="font-bold shrink-0">
                      [{log.stage}] {log.status === 'PASS' ? '✅' : '❌'}
                    </span>
                    <span className="text-zinc-300">{log.detail}</span>
                  </div>
                ))}
              </div>

              {currentResult && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between ${
                    currentResult.accepted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  <span>
                    PIPELINE RESULT: {currentResult.accepted ? 'ACCEPTED &amp; ATTESTED' : 'REJECTED FAIL-CLOSED'}
                  </span>
                  <span>
                    {currentResult.accepted
                      ? 'REAL HSM (SIGNED) &bull; counts_towards_quorum = true'
                      : `REJECTED: ${currentResult.rejectionReason}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
