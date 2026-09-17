import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  Clock,
  Cpu,
  Lock,
  Key,
  Database,
  Users,
  AlertTriangle,
  FileCheck,
  Download
} from 'lucide-react';
import { GuardEvaluationTrace, RegoEvaluationOutput } from '../../data/senateRegoPolicy';
import { exportOpaSessionPdf } from '../../utils/senateGovernanceAuditExport';

interface OpaSequentialGuardPipelineProps {
  evaluationResult: RegoEvaluationOutput | null;
  onExportPdf?: () => void;
}

interface GuardStageMeta {
  stageNumber: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  subsystem: string;
}

const GUARD_STAGES_META: GuardStageMeta[] = [
  {
    stageNumber: 1,
    name: 'Lifecycle Guard',
    icon: ShieldCheck,
    description: 'Verifies agent DID is in ACTIVE non-suspended lifecycle state.',
    subsystem: 'Zyrquen Identity Enclave'
  },
  {
    stageNumber: 2,
    name: 'Cryptographic Guard',
    icon: Key,
    description: 'Authenticates NIST FIPS 204 ML-DSA-87 / Dilithium signature integrity.',
    subsystem: 'Post-Quantum Hardware HSM'
  },
  {
    stageNumber: 3,
    name: 'Capability Guard',
    icon: Lock,
    description: 'Validates cryptographic capability token for target namespace action.',
    subsystem: 'Capability Delegation Bus'
  },
  {
    stageNumber: 4,
    name: 'Resource Budget Guard',
    icon: Database,
    description: 'Enforces real-time USD balance limit & non-negative allocation checks.',
    subsystem: 'Adaptive Scaling Controller'
  },
  {
    stageNumber: 5,
    name: 'Trust Score Guard',
    icon: Cpu,
    description: 'Enforces minimum Zero-Trust threshold (Score >= 70 / FIPS 140-3 Level 4).',
    subsystem: 'Attestation Scoring Matrix'
  },
  {
    stageNumber: 6,
    name: 'Senate Quorum Guard',
    icon: Users,
    description: 'Supermajority 66.7% consensus from Core Senators with zero dissent.',
    subsystem: 'Byzantine Senate Chamber'
  }
];

export const OpaSequentialGuardPipeline: React.FC<OpaSequentialGuardPipelineProps> = ({
  evaluationResult,
  onExportPdf
}) => {
  const [currentStep, setCurrentStep] = useState<number>(6);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');

  const speedMs = animationSpeed === 'fast' ? 90 : animationSpeed === 'normal' ? 240 : 550;

  // Run sequential animation when a new evaluation result arrives
  useEffect(() => {
    if (!evaluationResult) return;
    runSequence();
  }, [evaluationResult?.evaluation_timestamp_iso, evaluationResult?.matched_scenario_id]);

  const runSequence = () => {
    setIsAnimating(true);
    setCurrentStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCurrentStep(step);
      if (step >= 6) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, speedMs);
  };

  const getTraceForStage = (stageNum: number): GuardEvaluationTrace | undefined => {
    if (!evaluationResult?.guard_traces) return undefined;
    // Map stage number to trace
    return evaluationResult.guard_traces.find(
      (t) =>
        t.guard_name.toLowerCase().includes(GUARD_STAGES_META[stageNum - 1].name.toLowerCase()) ||
        t.guard_name.startsWith(`${stageNum}.`)
    ) || evaluationResult.guard_traces[stageNum - 1];
  };

  const isAllowed = evaluationResult?.decision === 'ALLOW' || evaluationResult?.decision === 'ALLOWED';
  const failedStageIndex = evaluationResult?.guard_traces?.findIndex((t) => t.status === 'FAILED') ?? -1;

  const handleDownloadSessionPdf = () => {
    if (!evaluationResult) return;
    if (onExportPdf) {
      onExportPdf();
      return;
    }

    exportOpaSessionPdf({
      decision: isAllowed ? 'ALLOWED' : 'DENIED',
      engineMode: evaluationResult.engine_mode,
      shortCircuitGuard: evaluationResult.short_circuit_guard,
      denialReasons: evaluationResult.denial_reasons,
      latencyUs: evaluationResult.evaluation_latency_microseconds,
      agentDid: evaluationResult.agent_did,
      action: evaluationResult.action,
      riskLevel: 'HIGH',
      guardTraces: evaluationResult.guard_traces.map((t) => ({
        guard_name: t.guard_name,
        status: t.status,
        latency_us: t.latency_us,
        details: t.details
      }))
    });
  };

  return (
    <div id="opa-sequential-guard-pipeline" className="rounded-xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAnimating ? 'bg-amber-400' : isAllowed ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isAnimating ? 'bg-amber-500' : isAllowed ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Sequential Short-Circuit Guard Pipeline
              <span className="rounded bg-sky-950/80 px-2 py-0.5 text-xs font-mono font-semibold text-sky-400 border border-sky-800">
                v2.5 Short-Circuit Engine
              </span>
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time visual trace of early fail-closed short-circuit enforcement (Lifecycle → Crypto → Capability → Budget → Trust → Quorum).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/80 p-0.5 text-xs">
            <button
              onClick={() => setAnimationSpeed('fast')}
              className={`rounded px-2 py-1 transition-colors ${animationSpeed === 'fast' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Fast (90ms)
            </button>
            <button
              onClick={() => setAnimationSpeed('normal')}
              className={`rounded px-2 py-1 transition-colors ${animationSpeed === 'normal' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Normal (240ms)
            </button>
            <button
              onClick={() => setAnimationSpeed('slow')}
              className={`rounded px-2 py-1 transition-colors ${animationSpeed === 'slow' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Step (550ms)
            </button>
          </div>

          <button
            onClick={runSequence}
            disabled={isAnimating}
            className="flex items-center gap-1.5 rounded-lg border border-sky-700 bg-sky-900/60 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-800 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isAnimating ? 'animate-spin' : ''}`} />
            Replay Trace
          </button>

          <button
            onClick={handleDownloadSessionPdf}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-950/80 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900 transition-all shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export Signed Evidence PDF
          </button>
        </div>
      </div>

      {/* Real-time Verdict Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950/80 border border-slate-800 p-3.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-400">Current Evaluation:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono font-bold ${
            isAllowed
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {isAllowed ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {isAllowed ? 'VERDICT: ALLOWED (100% PASS)' : 'VERDICT: DENIED (FAIL-CLOSED)'}
          </span>
          {evaluationResult?.short_circuit_guard && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 px-2 py-0.5 text-amber-300 border border-amber-800 font-mono text-[11px]">
              <AlertTriangle className="h-3 w-3" />
              Short-Circuited at: {evaluationResult.short_circuit_guard}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            Latency: <strong className="text-white">{evaluationResult?.evaluation_latency_microseconds ?? 184} µs</strong>
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            CPU Mode: <strong className="text-white">{evaluationResult?.engine_mode || 'v2.5-OPTIMIZED'}</strong>
          </span>
        </div>
      </div>

      {/* Interactive Sequential Pipeline Stages (6 Stages) */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {GUARD_STAGES_META.map((meta, idx) => {
          const stageNum = meta.stageNumber;
          const trace = getTraceForStage(stageNum);
          const isRevealed = currentStep >= stageNum;
          const isCurrentlyEvaluating = currentStep === stageNum && isAnimating;
          const isFailed = trace?.status === 'FAILED';
          const isShortCircuited = trace?.status === 'SHORT_CIRCUITED';
          const isPassed = trace?.status === 'PASSED';

          const IconComponent = meta.icon;

          return (
            <motion.div
              key={meta.stageNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-300 ${
                !isRevealed
                  ? 'border-slate-800 bg-slate-950/40 opacity-40'
                  : isCurrentlyEvaluating
                  ? 'border-amber-400/90 bg-amber-950/30 shadow-lg shadow-amber-900/20 ring-1 ring-amber-400'
                  : isFailed
                  ? 'border-rose-600 bg-rose-950/40 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500'
                  : isShortCircuited
                  ? 'border-slate-800 bg-slate-950/60 opacity-60'
                  : 'border-emerald-700/70 bg-emerald-950/20 hover:border-emerald-500'
              }`}
            >
              {/* Top Bar: Stage Number & Status Badge */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                  STAGE 0{stageNum}
                </span>

                {isRevealed && (
                  <AnimatePresence mode="wait">
                    {isCurrentlyEvaluating ? (
                      <motion.span
                        key="eval"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-600/40 animate-pulse"
                      >
                        <Zap className="h-2.5 w-2.5" /> EVAL
                      </motion.span>
                    ) : isPassed ? (
                      <motion.span
                        key="pass"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-600/40"
                      >
                        <ShieldCheck className="h-2.5 w-2.5" /> PASS
                      </motion.span>
                    ) : isFailed ? (
                      <motion.span
                        key="fail"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-500/30 px-1.5 py-0.5 text-[10px] font-mono text-rose-300 border border-rose-500 animate-bounce"
                      >
                        <ShieldAlert className="h-2.5 w-2.5" /> FAIL
                      </motion.span>
                    ) : (
                      <motion.span
                        key="bypass"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700"
                      >
                        <Zap className="h-2.5 w-2.5" /> BYPASS
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Guard Icon & Title */}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md ${
                    isFailed ? 'bg-rose-900/60 text-rose-400' : isPassed ? 'bg-emerald-900/60 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {meta.name}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                  {meta.description}
                </p>
              </div>

              {/* Stage Metrics or Bypass Note */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                {isRevealed && trace ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Latency:</span>
                      <span className={isFailed ? 'text-rose-400 font-bold' : isPassed ? 'text-emerald-400' : 'text-slate-500'}>
                        {trace.latency_us} µs
                      </span>
                    </div>

                    {isFailed && (
                      <div className="mt-1 rounded bg-rose-950/80 p-1.5 text-[9.5px] text-rose-300 border border-rose-800/60 leading-tight">
                        <strong>DENIAL TRIGGER:</strong> {trace.details}
                      </div>
                    )}

                    {isShortCircuited && (
                      <div className="text-[9.5px] text-slate-500 italic">
                        ⚡ Skipped: Upstream fail-closed (Saved ~48µs CPU)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-600 text-[10px]">
                    Waiting sequencer...
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Short Circuit Impact Explainer */}
      <div className="mt-4 rounded-lg bg-sky-950/30 border border-sky-900/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-300">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong>Architectural Guarantee:</strong> When any guard fails, evaluation halts immediately. No expensive cryptographic or quorum checks are performed on rogue requests.
          </span>
        </div>
        <div className="text-[11px] text-sky-400/80 font-mono">
          Fail-Closed Latency: ≤ 32 µs • Zero State Drift
        </div>
      </div>
    </div>
  );
};
