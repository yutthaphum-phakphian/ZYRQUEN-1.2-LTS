import React, { useState } from 'react';
import { Zap, CheckCircle2, AlertTriangle, X, Play, RefreshCw } from 'lucide-react';
import { soundFx } from '../services/audioEngine';
import { CANONICAL_CONSTANTS } from '../data/sovereignData';

interface PhoenixHealingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HealingPhase {
  phase: string;
  name: string;
  nameTh: string;
  timeRange: string;
  durationMs: number;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE';
}

export const PhoenixHealingModal: React.FC<PhoenixHealingModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const [phases, setPhases] = useState<HealingPhase[]>([
    {
      phase: 'Phase 1',
      name: 'Detect Phase',
      nameTh: 'ตรวจจับความผิดปกติของสภาวะระบบ',
      timeRange: '0–19 ms',
      durationMs: 19,
      description: 'Heuristic anomaly scanner flags state perturbation. Latency within sub-20ms bound.',
      status: 'PENDING',
    },
    {
      phase: 'Phase 2',
      name: 'Analyze Phase',
      nameTh: 'วิเคราะห์สาเหตุและคำนวณเวกเตอร์แก้ไข',
      timeRange: '19–43 ms',
      durationMs: 24,
      description: 'Quantum state matrix isolates divergence point. Validates against Merkle root.',
      status: 'PENDING',
    },
    {
      phase: 'Phase 3',
      name: 'Decide Phase',
      nameTh: 'เลือกเส้นทางฟื้นฟูตามกฎการปกครอง',
      timeRange: '43–84 ms',
      durationMs: 41,
      description: 'G11-G13 governance quorum confirms fail-safe roll-forward vector.',
      status: 'PENDING',
    },
    {
      phase: 'Phase 4',
      name: 'Act Phase',
      nameTh: 'ปรับคืนสถานะ SSoT ล่าสุด',
      timeRange: '84–110 ms',
      durationMs: 26,
      description: 'Deca-Key HSM cluster applies bit-exact canonical snapshot.',
      status: 'PENDING',
    },
    {
      phase: 'Phase 5',
      name: 'Verify Phase',
      nameTh: 'ตรวจสอบลายเซ็นและการปิดผนึกความถูกต้อง',
      timeRange: '110–142 ms',
      durationMs: 32,
      description: 'NIST PQC ML-DSA-87 attestation re-anchors 14,902 seals. SLA met at 142ms.',
      status: 'PENDING',
    },
  ]);

  if (!isOpen) return null;

  const handleStartSimulation = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setElapsedMs(0);
    soundFx.playAlertBuzz();

    const phaseDelays = [19, 43, 84, 110, 142];

    phaseDelays.forEach((delay, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        setElapsedMs(delay);
        soundFx.playTelemetryBeacon(440 + index * 120, 0.05);

        setPhases((prev) =>
          prev.map((p, pIdx) => ({
            ...p,
            status: pIdx < index ? 'COMPLETE' : pIdx === index ? 'RUNNING' : 'PENDING',
          }))
        );

        if (index === phaseDelays.length - 1) {
          setTimeout(() => {
            setPhases((prev) => prev.map((p) => ({ ...p, status: 'COMPLETE' })));
            setIsRunning(false);
            soundFx.playPhoenixChime();
            soundFx.speakAnnouncement('Phoenix self healing complete. All 14,902 seals verified.');
          }, 32);
        }
      }, delay * 5); // scaled slightly for visual clarity while preserving exact ms timestamps
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-[#060a14] border border-amber-500/40 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-[#060a14] border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-bold text-base text-amber-200">
                  Phoenix 142ms Auto-Healing Engine
                </h3>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
                  SLA &lt; 142ms
                </span>
              </div>
              <p className="text-xs text-slate-400">
                5-Phase Autonomous Zero-Data-Loss Quantum State Restoration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Progress & Live Telemetry Bar */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono-code">
              <span className="text-slate-400">Execution Timeline</span>
              <span className="text-amber-300 font-bold">{elapsedMs} ms / 142 ms</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-100"
                style={{ width: `${Math.min(100, (elapsedMs / 142) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 5 Phases List */}
          <div className="space-y-2">
            {phases.map((item, idx) => (
              <div
                key={item.phase}
                className={`p-3 rounded-lg border transition-all ${
                  item.status === 'RUNNING'
                    ? 'bg-amber-950/40 border-amber-500/70 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : item.status === 'COMPLETE'
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-100'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-amber-400">
                      {item.phase}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400">({item.nameTh})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-[11px] text-slate-400">
                      {item.timeRange}
                    </span>
                    <span
                      className={`text-[9px] font-mono-code px-2 py-0.5 rounded ${
                        item.status === 'COMPLETE'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : item.status === 'RUNNING'
                          ? 'bg-amber-900/60 text-amber-300 animate-pulse'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono-code">
            <span>SSoT Invariant: </span>
            <span className="text-emerald-400 font-semibold">14,902 Seals Protected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartSimulation}
              disabled={isRunning}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Healing in Progress...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Phoenix Healing</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
