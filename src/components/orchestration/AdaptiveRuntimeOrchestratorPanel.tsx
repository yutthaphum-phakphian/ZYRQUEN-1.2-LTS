import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Cpu,
  Zap,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Server,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  adaptiveRuntimeOrchestrator,
  AdaptiveOrchestratorState,
  LoadBalancingShiftProposal,
} from '../../core/adaptive-runtime-orchestrator';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { CANONICAL_GENESIS_BLOCK } from '../../data/canonicalData';

export const AdaptiveRuntimeOrchestratorPanel: React.FC = () => {
  const [orchestratorState, setOrchestratorState] = useState<AdaptiveOrchestratorState>(() =>
    adaptiveRuntimeOrchestrator.evaluateTelemetry()
  );
  const [isApplyingShift, setIsApplyingShift] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrchestratorState(adaptiveRuntimeOrchestrator.evaluateTelemetry());
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleApplyShift = (proposal: LoadBalancingShiftProposal) => {
    playTone(680, 0.05, 'sine');
    setIsApplyingShift(true);

    setTimeout(() => {
      playAuditChime();
      setIsApplyingShift(false);
      setAppliedNotice(`✅ บังคับใช้การกระจายโหลดสำเร็จ: ปรับ Batch Size เป็น 48 และโอนย้ายงานสู่ ${proposal.targetChamber} (Latency คาดการณ์: ${proposal.projectedLatencyMs} ms)`);
      setTimeout(() => setAppliedNotice(null), 5000);
    }, 600);
  };

  const handleToggleAutoRebalance = () => {
    const nextVal = !orchestratorState.autoRebalanceEnabled;
    adaptiveRuntimeOrchestrator.setAutoRebalance(nextVal);
    setOrchestratorState((prev) => ({ ...prev, autoRebalanceEnabled: nextVal }));
    playTone(nextVal ? 720 : 400, 0.04);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-[#070914] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                Phase 13: Adaptive Runtime Orchestrator &amp; Dynamic Load Balancer
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                SLA &lt; 142ms KERNEL
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Live CPU/Cryostat Telemetry Ingestion ↔ Dynamic Task Shifting ↔ 0 Core Mutation Guarantee
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <button
            onClick={handleToggleAutoRebalance}
            className={`px-3.5 py-1.5 rounded-xl border font-bold flex items-center gap-2 transition cursor-pointer ${
              orchestratorState.autoRebalanceEnabled
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                orchestratorState.autoRebalanceEnabled ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'
              }`}
            />
            <span>Auto-Rebalance: {orchestratorState.autoRebalanceEnabled ? 'ACTIVE' : 'MANUAL'}</span>
          </button>
        </div>
      </div>

      {/* Applied Notice Banner */}
      {appliedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* Per-Chamber Telemetry & Workload Distribution Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 font-mono text-xs">
        {orchestratorState.activeChamberMetrics.map((chamber) => {
          const isThrottle = chamber.status === 'CRITICAL_THROTTLE';
          const isElevated = chamber.status === 'ELEVATED';
          return (
            <div
              key={chamber.chamberId}
              className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                isThrottle
                  ? 'bg-rose-950/30 border-rose-500/50'
                  : isElevated
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'bg-[#080B18] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{chamber.chamberId}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    isThrottle
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isElevated
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {chamber.status}
                </span>
              </div>

              <div className="text-[11px] text-zinc-300 font-bold truncate">{chamber.chamberName}</div>

              <div className="space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>CPU Load:</span>
                  <span className="font-bold text-cyan-300">{chamber.cpuLoadPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      chamber.cpuLoadPct > 70 ? 'bg-rose-400' : chamber.cpuLoadPct > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${chamber.cpuLoadPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-white/5 text-zinc-400">
                <div>
                  <span className="block text-zinc-500">Cryo Temp:</span>
                  <span className="font-bold text-fuchsia-300">{chamber.cryoTempMK} mK</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Latency:</span>
                  <span className="font-bold text-amber-300">{chamber.estimatedLatencyMs} ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Load-Balancing Shift Proposals */}
      <div className="bg-[#070914] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl font-mono">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Automated SLA Load-Balancing Shift Proposals
            </h4>
          </div>
          <span className="text-[10px] text-zinc-400">
            Current Average Latency:{' '}
            <strong className="text-cyan-300">{orchestratorState.currentAverageLatencyMs} ms</strong> (SLA &le;{' '}
            {orchestratorState.slaTargetMs} ms)
          </span>
        </div>

        {orchestratorState.proposals.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-900/30 text-center text-xs text-zinc-400">
            ระบบทำงานอยู่ในสภาวะสมดุลสูงสุด (Optimal Load Distribution) ไม่มีความจำเป็นต้องโยกย้ายงาน
          </div>
        ) : (
          <div className="space-y-3">
            {orchestratorState.proposals.map((prop) => (
              <div
                key={prop.proposalId}
                className="p-4 rounded-xl bg-[#090D1E] border border-cyan-500/30 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300">{prop.proposalId}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      SLA {prop.slaStatus}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    SLA Headroom Margin:{' '}
                    <strong className="text-emerald-400">+{prop.slaMarginHeadroomMs} ms</strong>
                  </div>
                </div>

                <div className="text-xs text-zinc-200 font-bold">{prop.action}</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{prop.reasonTh}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-[10px]">
                  <div className="flex items-center gap-4 text-zinc-400">
                    <span>
                      Latency ปัจจุบัน: <strong className="text-amber-300">{prop.currentTotalLatencyMs} ms</strong>
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                    <span>
                      Latency หลังเกลี่ยโหลด:{' '}
                      <strong className="text-emerald-400">{prop.projectedLatencyMs} ms</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => handleApplyShift(prop)}
                    disabled={isApplyingShift}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isApplyingShift ? 'animate-spin' : ''}`} />
                    <span>{isApplyingShift ? 'Applying Shift...' : 'Apply Load-Balancing Shift'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveRuntimeOrchestratorPanel;
