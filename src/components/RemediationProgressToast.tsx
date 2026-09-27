import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Loader2,
  X,
  Zap,
  Activity,
} from 'lucide-react';
import {
  NodeRemediationEngine,
  RemediationProgressPayload,
  RemediationSequentialPhase,
} from '../services/NodeRemediationEngine';

export interface RemediationProgressToastProps {
  isOpen?: boolean;
  nodeId?: string;
  phase?: RemediationSequentialPhase;
  progressPercent?: number;
  statusMessage?: string;
  logLine?: string;
  latencyMs?: number;
  usePortal?: boolean;
  onDismiss?: () => void;
}

export interface RemediationStageStep {
  key: 'Isolation' | 'Recalibration' | 'Verification';
  stepNumber: number;
  title: 'Isolation' | 'Recalibration' | 'Verification';
  subtitle: string;
  defaultStatusMessage: string;
  thresholdPct: number;
}

export const SEQUENTIAL_REMEDIATION_STEPS: readonly RemediationStageStep[] = [
  {
    key: 'Isolation',
    stepNumber: 1,
    title: 'Isolation',
    subtitle: 'Chamber 02 Ring-04 Quarantine',
    defaultStatusMessage: 'Isolation: Chamber 02 Quarantine',
    thresholdPct: 33,
  },
  {
    key: 'Recalibration',
    stepNumber: 2,
    title: 'Recalibration',
    subtitle: 'NIST PQC ML-DSA-87 Lattice Re-align',
    defaultStatusMessage: 'Recalibration: NIST PQC ML-DSA-87 Lattice & Phase Jitter',
    thresholdPct: 67,
  },
  {
    key: 'Verification',
    stepNumber: 3,
    title: 'Verification',
    subtitle: '10/10 REAL_HSM & SSoT Δ0 Attested',
    defaultStatusMessage: 'Verification: 10/10 HSM Quorum & SSoT Δ0 Verified — PURE GREEN',
    thresholdPct: 100,
  },
];

const mountedToastInstances = new Set<symbol>();

export const RemediationProgressToast: React.FC<RemediationProgressToastProps> = ({
  isOpen: controlledOpen,
  nodeId: controlledNodeId,
  phase: controlledPhase,
  progressPercent: controlledProgress,
  statusMessage: controlledStatusMessage,
  logLine: controlledLogLine,
  latencyMs: controlledLatencyMs,
  usePortal = false,
  onDismiss,
}) => {
  const instanceIdRef = useRef<symbol | null>(null);
  if (!instanceIdRef.current) {
    instanceIdRef.current = Symbol('RemediationProgressToast');
  }
  const [isPrimaryInstance, setIsPrimaryInstance] = useState<boolean>(
    () => mountedToastInstances.size === 0
  );
  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const [livePayload, setLivePayload] = useState<RemediationProgressPayload>({
    nodeId: 'BK01',
    phase: 'Isolation',
    stepIndex: 1,
    totalSteps: 3,
    progressPercent: 33,
    statusMessage: 'Isolation: Chamber 02 Quarantine (BK01)',
    logLine: '[STAGE 1] Isolating BK01 to Chamber 02 (Ring-04 Buffer Gamma)...',
    nodeStatus: 'QUARANTINED',
  });
  const [stageUpdates, setStageUpdates] = useState<
    Partial<Record<'Isolation' | 'Recalibration' | 'Verification', RemediationProgressPayload>>
  >({});
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = instanceIdRef.current!;
    mountedToastInstances.add(id);
    const first = mountedToastInstances.values().next().value;
    setIsPrimaryInstance(first === id);
    return () => {
      mountedToastInstances.delete(id);
    };
  }, []);

  // Subscribe to NodeRemediationEngine progress events automatically
  useEffect(() => {
    const unsubscribe = NodeRemediationEngine.subscribeProgress((payload) => {
      setLivePayload(payload);
      setInternalOpen(true);
      if (
        payload.phase === 'Isolation' ||
        payload.phase === 'Recalibration' ||
        payload.phase === 'Verification'
      ) {
        const phaseKey = payload.phase;
        setStageUpdates((prev) => {
          if (phaseKey === 'Isolation') {
            return { Isolation: payload };
          }
          return {
            ...prev,
            [phaseKey]: payload,
          };
        });
      }
    });
    return unsubscribe;
  }, []);

  const visible =
    isPrimaryInstance && (controlledOpen !== undefined ? controlledOpen : internalOpen);
  const activeNodeId = controlledNodeId ?? livePayload.nodeId;
  const activePhase = controlledPhase ?? livePayload.phase;
  const activeProgress = controlledProgress ?? livePayload.progressPercent;
  const clampedProgress = Math.min(100, Math.max(0, activeProgress));
  const activeMessage = controlledStatusMessage ?? livePayload.statusMessage;
  const activeLog = controlledLogLine ?? livePayload.logLine;
  const activeLatency = controlledLatencyMs ?? livePayload.latencyMs ?? 2.11;

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${clampedProgress}%`;
    }
  }, [clampedProgress, visible]);

  const handleClose = () => {
    setInternalOpen(false);
    onDismiss?.();
  };

  const isCompleted =
    clampedProgress >= 100 || activePhase === 'Verification' || activePhase === 'COMPLETED';

  const getStepStatus = (step: RemediationStageStep): 'DONE' | 'ACTIVE' | 'PENDING' => {
    if (clampedProgress >= 100 || activePhase === 'COMPLETED') {
      return 'DONE';
    }
    if (activePhase === step.key) {
      return 'ACTIVE';
    }
    if (activePhase === 'Recalibration' && step.key === 'Isolation') {
      return 'DONE';
    }
    if (
      activePhase === 'Verification' &&
      (step.key === 'Isolation' || step.key === 'Recalibration')
    ) {
      return 'DONE';
    }
    if (clampedProgress >= step.thresholdPct && activePhase !== step.key) {
      return 'DONE';
    }
    return 'PENDING';
  };

  const activeStepNumber =
    activePhase === 'Isolation'
      ? 1
      : activePhase === 'Recalibration'
        ? 2
        : activePhase === 'Verification' || activePhase === 'COMPLETED' || clampedProgress >= 100
          ? 3
          : 1;

  const toastNode = (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="remediation-progress-toast"
          data-testid="remediation-progress-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
          className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 sm:px-0 pointer-events-none font-mono"
        >
          <div
            className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              isCompleted
                ? 'bg-slate-950/95 border-emerald-500/60 shadow-emerald-950/50'
                : 'bg-slate-950/95 border-cyan-500/60 shadow-cyan-950/50'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {isCompleted ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-cyan-300">NODE {activeNodeId}</span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className={isCompleted ? 'text-emerald-300' : 'text-amber-300'}>
                      {isCompleted ? 'PURE GREEN' : activePhase.toUpperCase()}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className="text-slate-400">STEP {activeStepNumber}/3</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-0.5">
                    NodeRemediationEngine — Sequential Status
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Dismiss remediation toast"
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Motion Animated Progress Bar */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                  {!isCompleted && (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                  )}
                  <span className="truncate">{activeMessage}</span>
                </span>
                <span
                  data-testid="remediation-progress-percentage"
                  className="font-bold text-emerald-400 shrink-0"
                >
                  {clampedProgress}%
                </span>
              </div>

              <div
                role="progressbar"
                aria-label="Node remediation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clampedProgress}
                className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5"
              >
                <motion.div
                  key={`progress-${clampedProgress}`}
                  ref={progressBarRef}
                  data-testid="remediation-motion-progress-bar"
                  data-progress={clampedProgress}
                  initial={false}
                  animate={{ width: `${clampedProgress}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ width: `${clampedProgress}%` }}
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    isCompleted
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300'
                      : 'bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400'
                  }`}
                />
              </div>
            </div>

            {/* Sequential Stages: Isolation -> Recalibration -> Verification */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {SEQUENTIAL_REMEDIATION_STEPS.map((step, idx) => {
                const st = getStepStatus(step);
                return (
                  <motion.div
                    key={step.key}
                    data-testid={`remediation-step-${step.key.toLowerCase()}`}
                    data-status={st}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.2, delay: idx * 0.05 }}
                    className={`p-2 rounded-lg border text-[10px] transition-all ${
                      st === 'DONE'
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : st === 'ACTIVE'
                          ? 'bg-cyan-950/40 border-cyan-400/60 text-cyan-100'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{step.title}</span>
                      {st === 'DONE' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : st === 'ACTIVE' ? (
                        <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[9px] opacity-80 truncate mt-0.5">{step.subtitle}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sequential Status Updates Feed */}
            <div
              data-testid="remediation-sequential-updates"
              className="bg-slate-900/60 border border-slate-800/90 rounded-lg p-2.5 mb-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1 font-bold text-cyan-300">
                  <Activity className="w-3 h-3" />
                  Sequential Status Updates
                </span>
                <span>Isolation → Recalibration → Verification</span>
              </div>
              <div className="space-y-1">
                {SEQUENTIAL_REMEDIATION_STEPS.map((step, idx) => {
                  const st = getStepStatus(step);
                  const recorded = stageUpdates[step.key];
                  const itemMessage =
                    activePhase === step.key
                      ? activeMessage
                      : recorded?.statusMessage ??
                        `${step.defaultStatusMessage} (${activeNodeId})`;
                  return (
                    <motion.div
                      key={`seq-update-${step.key}`}
                      data-testid={`remediation-status-update-${step.key.toLowerCase()}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.2, delay: idx * 0.06 }}
                      className={`flex items-center justify-between gap-2 text-[10px] px-2 py-1 rounded ${
                        st === 'DONE'
                          ? 'bg-emerald-950/25 text-emerald-200'
                          : st === 'ACTIVE'
                            ? 'bg-cyan-950/35 text-cyan-100 font-semibold'
                            : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold shrink-0">
                          {step.stepNumber}. {step.title}:
                        </span>
                        <span className="truncate opacity-90">{itemMessage}</span>
                      </div>
                      <span className="text-[9px] font-bold shrink-0">
                        {st === 'DONE'
                          ? `${step.thresholdPct}% DONE`
                          : st === 'ACTIVE'
                            ? `${clampedProgress}% ACTIVE`
                            : 'QUEUED'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer Log & SLA */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-300 flex items-center justify-between gap-2">
              <span className="truncate">{activeLog}</span>
              <span className="text-emerald-400 font-bold shrink-0">
                {activeLatency}ms • Δ0 0.00%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(toastNode, document.body);
  }
  return toastNode;
};

export default RemediationProgressToast;
