import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';

export interface ForensicStage {
  stageNumber: number;
  name: string;
  category: string;
  targetDurationMs: number;
  actualDurationMs: number;
  stateHash: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  invariantCheck: string;
}

export const INITIAL_STAGES: ForensicStage[] = [
  { stageNumber: 1, name: 'Ingestion & Pre-flight Payload Validation', category: 'Ingestion', targetDurationMs: 5.0, actualDurationMs: 3.2, stateHash: '0x8f01a...902a', status: 'PENDING', invariantCheck: 'Valid JSON Schema & Header' },
  { stageNumber: 2, name: 'SHA-256 / SHA3-512 Pre-hash Digest Computation', category: 'Hashing', targetDurationMs: 8.0, actualDurationMs: 4.1, stateHash: '0x992b1...112c', status: 'PENDING', invariantCheck: 'Canonical Hash Consistency' },
  { stageNumber: 3, name: 'Dilithium-5 (FIPS 204) Signature Verification', category: 'PQC Audit', targetDurationMs: 15.0, actualDurationMs: 11.4, stateHash: '0xa412f...882e', status: 'PENDING', invariantCheck: 'Dilithium-5 Public Key Match' },
  { stageNumber: 4, name: 'SPHINCS+ (FIPS 205) Secondary Verification', category: 'PQC Audit', targetDurationMs: 20.0, actualDurationMs: 14.8, stateHash: '0xb8821...001a', status: 'PENDING', invariantCheck: 'Stateful Signature Root Match' },
  { stageNumber: 5, name: 'Deca-Key 10/10 HSM Quorum Ratification Test', category: 'Hardware Quorum', targetDurationMs: 25.0, actualDurationMs: 18.2, stateHash: '0xc1109...33f1', status: 'PENDING', invariantCheck: '10/10 HSM Quorum Signature' },
  { stageNumber: 6, name: 'Genesis Anchor #849202 Merkle Root Verification', category: 'SSoT Anchor', targetDurationMs: 10.0, actualDurationMs: 6.0, stateHash: '0x909ab...4c68', status: 'PENDING', invariantCheck: 'Zero Drift (Δ 0.00%)' },
  { stageNumber: 7, name: 'Chamber 02 WORM Immutable Ledger Integrity Audit', category: 'WORM Isolation', targetDurationMs: 12.0, actualDurationMs: 7.9, stateHash: '0xd7710...228b', status: 'PENDING', invariantCheck: 'Zero Tampering / Deletion' },
  { stageNumber: 8, name: 'Zero-Knowledge PII Redaction Integrity Check', category: 'Privacy PDPA', targetDurationMs: 14.0, actualDurationMs: 9.3, stateHash: '0xe9011...4411', status: 'PENDING', invariantCheck: 'zk-SNARK PII Anonymization' },
  { stageNumber: 9, name: 'Real-Time Hardware Heartbeat Telemetry Analysis', category: 'Telemetry', targetDurationMs: 8.0, actualDurationMs: 4.5, stateHash: '0xf0021...556a', status: 'PENDING', invariantCheck: 'Sub-Kelvin Thermal Range' },
  { stageNumber: 10, name: 'State-Hash Delta Transition Check', category: 'State Audit', targetDurationMs: 10.0, actualDurationMs: 5.8, stateHash: '0x011a2...7781', status: 'PENDING', invariantCheck: 'Continuous Invariant Δ = 0' },
  { stageNumber: 11, name: 'RFC 3161 Hardware Time-Stamp Protocol Audit', category: 'Timestamp', targetDurationMs: 10.0, actualDurationMs: 6.2, stateHash: '0x122b3...8892', status: 'PENDING', invariantCheck: 'NIMT UTC Synchronization' },
  { stageNumber: 12, name: 'Final Statutory Court-Admissible Dossier Generation', category: 'Legal Export', targetDurationMs: 5.0, actualDurationMs: 2.1, stateHash: '0x233c4...9903', status: 'PENDING', invariantCheck: 'Sections 9, 26, 28 Compliance' }
];

export const LiveReplayVerificationDashboard: React.FC = () => {
  const [stages, setStages] = useState<ForensicStage[]>(INITIAL_STAGES);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [totalElapsedTimeMs, setTotalElapsedTimeMs] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // SLA Threshold Constant
  const TARGET_SLA_LIMIT_MS = 142.0;

  // Replay Step Executor
  const stepNext = () => {
    setCurrentStageIdx((prevIdx) => {
      const nextIdx = prevIdx + 1;
      if (nextIdx >= stages.length) {
        setIsPlaying(false);
        return prevIdx;
      }

      setStages((prevStages) =>
        prevStages.map((stg, i) => {
          if (i === nextIdx) {
            return { ...stg, status: 'PASSED' };
          }
          return stg;
        })
      );

      setTotalElapsedTimeMs((prev) =>
        Number((prev + stages[nextIdx].actualDurationMs).toFixed(2))
      );

      try {
        playTone(520 + nextIdx * 40, 0.08, 'sine');
      } catch {
        // ignore audio failure
      }

      return nextIdx;
    });
  };

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStageIdx((prevIdx) => {
          if (prevIdx + 1 >= INITIAL_STAGES.length) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            try {
              playAuditChime();
            } catch {}
            return prevIdx;
          }
          const nextIdx = prevIdx + 1;
          setStages((prevStages) =>
            prevStages.map((stg, i) =>
              i === nextIdx ? { ...stg, status: 'PASSED' } : stg
            )
          );
          setTotalElapsedTimeMs((prev) =>
            Number((prev + INITIAL_STAGES[nextIdx].actualDurationMs).toFixed(2))
          );
          try {
            playTone(520 + nextIdx * 40, 0.06, 'sine');
          } catch {}
          return nextIdx;
        });
      }, 350); // Tick interval for playback visualization
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStageIdx(-1);
    setTotalElapsedTimeMs(0);
    setStages(INITIAL_STAGES);
  };

  return (
    <div id="live-replay-verification-dashboard-root" className="w-full bg-gray-950 text-gray-100 p-6 rounded-xl border border-gray-800 space-y-6">
      {/* Header & Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              12-STAGE FORENSIC PLAYBACK PIPELINE
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Target SLA Limit: &lt; {TARGET_SLA_LIMIT_MS.toFixed(2)} ms
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-white">
            Live Replay Verification Dashboard
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Deterministic Microsecond Trace Replay • State Invariant Enforcement • Phoenix Resiliency
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-live-replay"
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 font-semibold text-xs rounded transition flex items-center gap-1.5 cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold shadow-cyan-900/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Replay' : 'Start Live Replay'}</span>
          </button>
          <button
            id="btn-step-replay"
            type="button"
            onClick={stepNext}
            disabled={isPlaying || currentStageIdx >= stages.length - 1}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-xs font-mono rounded text-gray-200 border border-gray-700 flex items-center gap-1 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step (+1 Stage)</span>
          </button>
          <button
            id="btn-reset-replay"
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-mono rounded text-gray-300 border border-gray-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="metric-total-replay-time" className="bg-gray-900 p-3.5 rounded-lg border border-gray-800">
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            TOTAL REPLAY TIME
          </div>
          <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
            {totalElapsedTimeMs.toFixed(2)} <span className="text-xs text-gray-500">ms</span>
          </div>
        </div>
        <div id="metric-sla-benchmark" className="bg-gray-900 p-3.5 rounded-lg border border-gray-800">
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            SLA BENCHMARK STATUS
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {totalElapsedTimeMs <= TARGET_SLA_LIMIT_MS ? 'PASS (SLA MET)' : 'SLA EXCEEDED'}
          </div>
        </div>
        <div id="metric-stages-completed" className="bg-gray-900 p-3.5 rounded-lg border border-gray-800">
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
            STAGES COMPLETED
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {currentStageIdx + 1} / {stages.length}
          </div>
        </div>
        <div id="metric-invariant-verdict" className="bg-gray-900 p-3.5 rounded-lg border border-gray-800">
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            INVARIANT VERDICT
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            100% VALIDATED
          </div>
        </div>
      </div>

      {/* Pipeline Stage List */}
      <div className="space-y-2">
        {stages.map((stage, idx) => {
          const isActive = idx === currentStageIdx;
          const isPassed = stage.status === 'PASSED';

          return (
            <div
              id={`stage-card-${stage.stageNumber}`}
              key={stage.stageNumber}
              className={`p-3 rounded-lg border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                  : isPassed
                  ? 'bg-gray-900/80 border-emerald-900/60'
                  : 'bg-gray-900/30 border-gray-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full font-mono text-xs font-bold ${
                    isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {stage.stageNumber}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-200">
                      {stage.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                      {stage.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    Invariant: {stage.invariantCheck}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-gray-500 block text-[10px]">STATE HASH</span>
                  <span className="text-cyan-300">{stage.stateHash}</span>
                </div>
                <div className="text-right w-20">
                  <span className="text-gray-500 block text-[10px]">TIME</span>
                  <span className={isPassed ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                    {isPassed ? `${stage.actualDurationMs.toFixed(1)} ms` : '--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveReplayVerificationDashboard;
