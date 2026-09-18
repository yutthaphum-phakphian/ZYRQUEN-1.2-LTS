import React, { useEffect } from 'react';
import { AlertOctagon, Gauge } from 'lucide-react';
import { useSystemState } from '../../hooks/useSystemState';
import { systemStateStore } from '../../store/systemStateStore';
import { playAuditChime, playTone, updateAtmosphericEntropyPitch } from '../AudioSynthesizer';

export const SsotDriftWarning = () => {
  const { ssotMutationDrift } = useSystemState();
  const driftNum = parseFloat(ssotMutationDrift) || 0;

  if (driftNum < 0.01) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-red-200 animate-pulse">
      <div className="flex items-center gap-2.5">
        <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
        <div>
          <div className="font-bold text-red-100 flex items-center gap-2">
            <span>⚠️ SSoT MUTATION DRIFT WARNING: Δ+{driftNum.toFixed(2)}% DEVIATION</span>
            <span className="px-2 py-0.2 rounded bg-red-900 text-red-200 text-[10px] uppercase font-mono">
              NON-COMPLIANT
            </span>
          </div>
          <div className="text-[11px] text-red-300 font-sans mt-0.5">
            Violates <strong className="text-white underline">PDPA Section 37 Log Integrity Mandate</strong> (Mandatory non-tampering of security & access logs and strict Zero Mutation Drift). Immediate quarantine isolation protocol armed.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            playAuditChime();
            systemStateStore.setSsotMutationDrift('0.00');
          }}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Restore Δ0.00% Zero Drift
        </button>
      </div>
    </div>
  );
};

export const SsotDriftToggleButton = () => {
  const { ssotMutationDrift } = useSystemState();
  const driftNum = parseFloat(ssotMutationDrift) || 0;

  return (
    <button
      type="button"
      onClick={() => {
        playTone(driftNum > 0 ? 600 : 380, 0.05);
        systemStateStore.setSsotMutationDrift(driftNum > 0 ? '0.00' : '0.01');
      }}
      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
        driftNum >= 0.01
          ? 'bg-red-500/25 text-red-300 border-red-500/50 animate-pulse'
          : 'bg-white/5 text-zinc-400 hover:text-cyan-300 border-white/10'
      }`}
      title="Test SSoT Mutation Drift Alert (Simulates deviation >= 0.01% citing PDPA Section 37)"
    >
      Drift: Δ{driftNum.toFixed(2)}%
    </button>
  );
};

export const QuantumAggregateEntropyIndicator = () => {
  const { aggregateEntropy } = useSystemState();
  return (
    <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10" title="Quantum Aggregate Entropy (HSM Ambient Load)">
      <Gauge className="w-3.5 h-3.5 text-fuchsia-400" />
      H: {aggregateEntropy}%
    </span>
  );
};

export const AudioEntropyController = ({
  isAudioActive,
  setCarrierPitchHz,
}: {
  isAudioActive: boolean;
  setCarrierPitchHz: (pitch: number) => void;
}) => {
  const { aggregateEntropy } = useSystemState();

  useEffect(() => {
    if (isAudioActive) {
      const pitch = updateAtmosphericEntropyPitch(aggregateEntropy, true);
      setCarrierPitchHz(pitch);
    }
  }, [isAudioActive, aggregateEntropy, setCarrierPitchHz]);

  return null;
};
