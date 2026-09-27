import React from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Radio,
  Lock,
  X,
  Zap,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export interface RemediationSequenceNotificationProps {
  isOpen: boolean;
  nodeId: string;
  activeStage: 0 | 1 | 2 | 3 | 4;
  progressPercent: number;
  stageLabel: string;
  latestLog: string;
  elapsedMs?: number;
  onDismiss: () => void;
}

interface StageMeta {
  stage: 1 | 2 | 3 | 4;
  shortTitle: string;
  thaiSub: string;
  targetPct: number;
}

const REMEDIATION_STAGES: StageMeta[] = [
  {
    stage: 1,
    shortTitle: 'Chamber 02 Isolation',
    thaiSub: 'กักกันโหนดเข้า Ring-04 Buffer Gamma',
    targetPct: 25,
  },
  {
    stage: 2,
    shortTitle: 'Lattice Recalibration',
    thaiSub: 'ปรับสมดุล ML-DSA-87 & Phase Jitter',
    targetPct: 50,
  },
  {
    stage: 3,
    shortTitle: 'Port 8443 Stream Reroute',
    thaiSub: 'สลับทราฟฟิกสู่คลัสเตอร์ SG-01..10',
    targetPct: 75,
  },
  {
    stage: 4,
    shortTitle: 'SSoT Δ0 & HSM Attested',
    thaiSub: 'ยืนยัน 10/10 HSM คืนค่า PURE GREEN',
    targetPct: 100,
  },
];

export const RemediationSequenceNotification: React.FC<RemediationSequenceNotificationProps> = ({
  isOpen,
  nodeId,
  activeStage,
  progressPercent,
  stageLabel,
  latestLog,
  elapsedMs = 2.11,
  onDismiss,
}) => {
  if (!isOpen) return null;

  const isCompleted = progressPercent >= 100 && activeStage === 4;

  const progressBarColor =
    activeStage === 1
      ? 'from-rose-600 via-rose-500 to-amber-500'
      : activeStage === 2
        ? 'from-amber-600 via-amber-400 to-cyan-400'
        : activeStage === 3
          ? 'from-cyan-600 via-cyan-400 to-emerald-400'
          : 'from-emerald-600 via-emerald-400 to-teal-300';

  const cardContent = (
    <div
      role="status"
      aria-live="polite"
      data-testid="remediation-sequence-notification"
      className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 sm:px-0 pointer-events-none font-mono"
    >
      <div
        className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          isCompleted
            ? 'bg-slate-950/95 border-emerald-500/60 shadow-emerald-950/50'
            : 'bg-slate-950/95 border-cyan-500/60 shadow-cyan-950/50'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isCompleted
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
              }`}
            >
              {isCompleted ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  NODE {nodeId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {isCompleted ? '🟢 PURE GREEN RESTORED' : `STAGE ${activeStage}/4 ACTIVE`}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 mt-1">
                {isCompleted
                  ? `Auto-Remediation Complete (${elapsedMs} ms)`
                  : '4-Stage Auto-Remediation Sequence'}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close remediation notification"
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              {!isCompleted && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
              {stageLabel}
            </span>
            <span className="font-bold text-emerald-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              data-testid="remediation-progress-bar"
              className={`h-full rounded-full bg-gradient-to-r ${progressBarColor} transition-all duration-300 ease-out`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>

        {/* 4-Stage Step Matrix (Chamber 02 Isolation & Lattice Recalibration highlighted) */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {REMEDIATION_STAGES.map((st) => {
            const done = activeStage > st.stage || isCompleted;
            const current = activeStage === st.stage && !isCompleted;
            return (
              <div
                key={st.stage}
                className={`p-2 rounded-lg border text-[10px] transition-all ${
                  done
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : current
                      ? 'bg-cyan-950/40 border-cyan-400/60 text-cyan-100 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>
                    #{st.stage} {st.shortTitle}
                  </span>
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : current ? (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                  )}
                </div>
                <div className="text-[9px] opacity-80 truncate mt-0.5">{st.thaiSub}</div>
              </div>
            );
          })}
        </div>

        {/* Latest Telemetry Audit Line */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-300 flex items-center justify-between gap-2">
          <span className="truncate">{latestLog}</span>
          <span className="text-emerald-400 font-bold shrink-0">SSoT Δ0 0.00%</span>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(cardContent, document.body);
  }
  return cardContent;
};
