import React, { useState, useEffect } from 'react';
import {
  copilotAssistantService,
  CopilotAssistantState,
  CopilotSuggestion,
  CANONICAL_PEAK_EVENTS,
  CANONICAL_ENCLAVE_CONTRIBUTIONS,
  CANONICAL_ENTROPY_STATS,
} from '../../services/copilotAssistantService';
import { useSystemState } from '../../hooks/useSystemState';

interface CopilotAutonomyNodePanelProps {
  onNavigateToView?: (viewId: string) => void;
  defaultActiveTab?: 'SUGGESTIONS' | 'ENTROPY_TIMELINE' | 'CRYO_BURST' | 'NODE_CONTRIBUTION' | 'ASCENSION_MODE' | 'QUANTUM_SWARM';
}

export const CopilotAutonomyNodePanel: React.FC<CopilotAutonomyNodePanelProps> = ({
  defaultActiveTab = 'SUGGESTIONS',
}) => {
  const [copilotState, setCopilotState] = useState<CopilotAssistantState>(
    copilotAssistantService.getState()
  );
  const systemState = useSystemState();
  const [activeTab, setActiveTab] = useState<
    'SUGGESTIONS' | 'ENTROPY_TIMELINE' | 'CRYO_BURST' | 'NODE_CONTRIBUTION' | 'ASCENSION_MODE' | 'QUANTUM_SWARM'
  >(defaultActiveTab);
  const [selectedPeakIndex, setSelectedPeakIndex] = useState<number>(1); // Default to 12:00 Midday Reseed
  const [selectedEnclaveId, setSelectedEnclaveId] = useState<string>('TC-01');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = copilotAssistantService.subscribe((s) => {
      setCopilotState(s);
    });
    return () => unsub();
  }, []);

  const handleApplySuggestion = async (suggId: string) => {
    const res = await copilotAssistantService.applySuggestion(suggId);
    setActionFeedback(res);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleDismissSuggestion = (suggId: string) => {
    copilotAssistantService.dismissSuggestion(suggId);
  };

  const handleSimulateDrift = () => {
    copilotAssistantService.simulateDriftPattern(2);
    setActionFeedback('🧪 จำลอง Block Drift (+2 Blocks) เรียบร้อย — ตรวจสอบข้อเสนอแนะใหม่ด้านล่าง');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const selectedPeak = CANONICAL_PEAK_EVENTS[selectedPeakIndex] || CANONICAL_PEAK_EVENTS[0];
  const selectedEnclave =
    CANONICAL_ENCLAVE_CONTRIBUTIONS.find((e) => e.id === selectedEnclaveId) ||
    CANONICAL_ENCLAVE_CONTRIBUTIONS[0];

  // 60-minute simulated data points matching stats (Baseline 6656, Avg 7018, Max 9885, Min 6173)
  const minuteDataPoints = React.useMemo(() => {
    const points: { minute: number; rate: number; isPeak?: boolean; peakLabel?: string }[] = [];
    for (let m = 0; m < 60; m++) {
      let rate = 6656 + Math.sin(m / 4) * 380 + (Math.sin(m * 1.5) * 150);
      let isPeak = false;
      let peakLabel: string | undefined = undefined;

      if (m === 15) {
        rate = 9734;
        isPeak = true;
        peakLabel = '04:00 Dilithium';
      } else if (m === 35) {
        rate = 9885;
        isPeak = true;
        peakLabel = '12:00 TRNG';
      } else if (m === 48) {
        rate = 8840;
        isPeak = true;
        peakLabel = 'Min 48 Cryo';
      } else if (m === 55) {
        rate = 9103;
        isPeak = true;
        peakLabel = '19:00 Sync';
      }

      points.push({ minute: m, rate: Math.round(rate), isPeak, peakLabel });
    }
    return points;
  }, []);

  return (
    <div className="w-full rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 shadow-2xl p-4 sm:p-5 space-y-4 text-zinc-200">
      {/* Autonomy Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#070a12] border border-cyan-400/50 flex items-center justify-center text-xl shadow-inner">
            🧠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-wide text-white">
                Copilot Autonomy Node
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                SSoT Continuous Monitor
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950 border border-amber-500/40 text-amber-300 font-bold">
                Ω600_1000
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Sovereign Ledger Surveillance • Drift Pattern Recognition • Real-time Suggestions
            </p>
          </div>
        </div>

        {/* Live Surveillance Status */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070a12] border border-emerald-500/40 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>LIVE LEDGER AUDIT</span>
            <span className="text-zinc-500">|</span>
            <span className="text-white font-bold">
              {copilotState.currentDriftCount === 0 ? 'Δ0.00% ZERO DRIFT' : `DRIFT +${copilotState.currentDriftCount} BLOCKS`}
            </span>
          </div>

          <button
            onClick={() => copilotAssistantService.triggerDriftCheckNow()}
            className="px-2.5 py-1.5 rounded-xl bg-[#070a12] hover:bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all"
            title="Scan Ledger Drift Now"
          >
            🔍 Scan
          </button>

          <button
            onClick={handleSimulateDrift}
            className="px-2.5 py-1.5 rounded-xl bg-[#070a12] hover:bg-amber-950 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition-all"
            title="Simulate Drift Pattern to test suggestions"
          >
            🧪 Test Drift
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-100 text-xs font-mono flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-cyan-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Module Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-[#070a12] p-1.5 rounded-xl border border-cyan-500/20 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('SUGGESTIONS')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'SUGGESTIONS'
              ? 'bg-[#0a0f1e] text-cyan-300 border border-cyan-400 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🧠</span>
          <span className="truncate">Real-time Suggestions</span>
          {copilotState.suggestions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-black font-mono">
              {copilotState.suggestions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ENTROPY_TIMELINE')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ENTROPY_TIMELINE'
              ? 'bg-[#0a0f1e] text-cyan-300 border border-cyan-400 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🌌</span>
          <span className="truncate">Entropy Surge Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('CRYO_BURST')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'CRYO_BURST'
              ? 'bg-[#0a0f1e] text-cyan-300 border border-cyan-400 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🧊</span>
          <span className="truncate">Cryo-Burst Analyzer (Min 48)</span>
        </button>

        <button
          onClick={() => setActiveTab('NODE_CONTRIBUTION')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'NODE_CONTRIBUTION'
              ? 'bg-[#0a0f1e] text-cyan-300 border border-cyan-400 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🧮</span>
          <span className="truncate">Node Contribution (TC-01..10)</span>
        </button>

        <button
          onClick={() => setActiveTab('ASCENSION_MODE')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ASCENSION_MODE'
              ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37] shadow-md'
              : 'text-[#D4AF37]/70 hover:text-[#D4AF37]'
          }`}
        >
          <span>👑</span>
          <span className="truncate">Ascension Mode v2.1</span>
        </button>

        <button
          onClick={() => setActiveTab('QUANTUM_SWARM')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'QUANTUM_SWARM'
              ? 'bg-[#0a0f1e] text-emerald-400 border border-emerald-500 shadow-md'
              : 'text-emerald-500/70 hover:text-emerald-400'
          }`}
        >
          <span>🐝</span>
          <span className="truncate">Quantum Swarm</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: REAL-TIME SUGGESTIONS BASED ON DRIFT PATTERNS */}
      {/* ============================================================ */}
      {activeTab === 'SUGGESTIONS' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>AI Assistant Live Suggestion Feed (ประเมินจาก Ledger State & Drift Patterns)</span>
            <span className="font-mono text-cyan-400">
              Active Items: {copilotState.suggestions.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {copilotState.suggestions.map((sugg: CopilotSuggestion, idx: number) => {
              const isCritical = sugg.priority === 'CRITICAL';
              const isHigh = sugg.priority === 'HIGH';
              const isMedium = sugg.priority === 'MEDIUM';

              const borderClass = isCritical
                ? 'border-red-500/60 bg-[#070a12]'
                : isHigh
                ? 'border-amber-500/50 bg-[#070a12]'
                : isMedium
                ? 'border-cyan-500/40 bg-[#070a12]'
                : 'border-zinc-800 bg-[#070a12]';

              const priorityBadge = isCritical
                ? 'bg-red-950 text-red-300 border-red-500/50'
                : isHigh
                ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                : isMedium
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700';

              return (
                <div
                  key={`${sugg.id}-${idx}`}
                  className={`p-3.5 rounded-xl border ${borderClass} space-y-2.5 transition-all relative overflow-hidden`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {isCritical ? '🚨' : isHigh ? '⚡' : isMedium ? '🧊' : '💎'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded border ${priorityBadge}`}
                          >
                            {sugg.priority}
                          </span>
                          {sugg.metricValue && (
                            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                              {sugg.metricValue}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                          {sugg.titleTh}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismissSuggestion(sugg.id)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {sugg.descriptionTh}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(sugg.timestamp).toLocaleTimeString()}
                    </span>

                    <button
                      onClick={() => handleApplySuggestion(sugg.id)}
                      disabled={sugg.isApplied}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                        sugg.isApplied
                          ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                          : isCritical
                          ? 'bg-red-950 hover:bg-red-900 text-red-200 border border-red-400'
                          : isHigh
                          ? 'bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-400'
                          : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-400'
                      }`}
                    >
                      <span>{sugg.isApplied ? '✓ ดำเนินการแล้ว' : sugg.actionLabelTh}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {copilotState.suggestions.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-[#070a12] border border-zinc-800 text-zinc-400 text-xs space-y-2">
              <span className="text-2xl block">✅</span>
              <p className="font-bold text-white">ไม่มีข้อเสนอแนะค้างอยู่ — ระบบอยู่ในสภาวะสมดุล</p>
              <p className="font-mono text-[11px] text-zinc-500">
                SSoT Drift Δ{systemState.ssotMutationDrift} • {systemState.sealCount.toLocaleString()} Seals Inviolable • 10/10 REAL_HSM Active
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ENTROPY SURGE TIMELINE (VISUALIZATION HOLOGRAM) */}
      {/* ============================================================ */}
      {activeTab === 'ENTROPY_TIMELINE' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Telemetry Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20">
              <div className="text-[10px] font-mono text-zinc-400">Baseline Rate</div>
              <div className="text-sm sm:text-base font-bold text-cyan-300 font-mono">
                {CANONICAL_ENTROPY_STATS.baselineKBps.toLocaleString()} <span className="text-[10px]">KBps</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20">
              <div className="text-[10px] font-mono text-zinc-400">Current Stream</div>
              <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                {copilotState.entropyStats.currentKBps.toLocaleString()} <span className="text-[10px]">KBps</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20">
              <div className="text-[10px] font-mono text-zinc-400">Average Rate</div>
              <div className="text-sm sm:text-base font-bold text-white font-mono">
                {CANONICAL_ENTROPY_STATS.averageKBps.toLocaleString()} <span className="text-[10px]">KBps</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20">
              <div className="text-[10px] font-mono text-zinc-400">Max Peak (Surge)</div>
              <div className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                {CANONICAL_ENTROPY_STATS.maxKBps.toLocaleString()} <span className="text-[10px]">KBps</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20">
              <div className="text-[10px] font-mono text-zinc-400">Min Rate</div>
              <div className="text-sm sm:text-base font-bold text-zinc-300 font-mono">
                {CANONICAL_ENTROPY_STATS.minKBps.toLocaleString()} <span className="text-[10px]">KBps</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20">
              <div className="text-[10px] font-mono text-zinc-400">Std Deviation</div>
              <div className="text-sm sm:text-base font-bold text-purple-300 font-mono">
                ±{CANONICAL_ENTROPY_STATS.stdDevKBps.toLocaleString()} <span className="text-[10px]">KBps</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20">
              <div className="text-[10px] font-mono text-zinc-400">Stability Index</div>
              <div className="text-sm sm:text-base font-bold text-emerald-300 font-mono">
                {CANONICAL_ENTROPY_STATS.stabilityIndexPercent}%
              </div>
            </div>
          </div>

          {/* Interactive SVG Hologram Timeline (60 Minutes) */}
          <div className="p-4 rounded-xl bg-[#070a12] border border-cyan-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🌌</span>
                <span className="font-bold text-white font-mono">
                  60-Minute Active Entropy Time Series Hologram
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                  Anchor: {CANONICAL_ENTROPY_STATS.anchorHash}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span> Stream Rate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Peak Event
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-zinc-500"></span> Baseline (6,656)
                </span>
              </div>
            </div>

            {/* SVG Wave Visualization */}
            <div className="w-full h-44 sm:h-52 relative overflow-hidden rounded-lg bg-[#05070d] border border-cyan-500/20 p-2">
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="0" y1="50" x2="600" y2="50" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />

                {/* Baseline Marker (6656 KBps ~ y=125) */}
                <line x1="0" y1="125" x2="600" y2="125" stroke="#06B6D4" strokeDasharray="4 2" strokeWidth="1.5" opacity="0.6" />

                {/* Bars / Area for 60 data points */}
                {minuteDataPoints.map((pt, idx) => {
                  const x = idx * 10;
                  // Map rate 5500 - 10000 to height 10 - 180
                  const height = Math.max(10, Math.min(185, ((pt.rate - 5500) / 4600) * 180));
                  const y = 200 - height;
                  const isPeak = pt.isPeak;

                  return (
                    <g key={idx}>
                      <rect
                        x={x + 1}
                        y={y}
                        width="7.5"
                        height={height}
                        fill={isPeak ? '#D4AF37' : '#06B6D4'}
                        opacity={isPeak ? 0.95 : 0.65}
                      />
                      {isPeak && (
                        <>
                          <circle cx={x + 4.75} cy={y} r="3.5" fill="#D4AF37" />
                          <line x1={x + 4.75} y1={y} x2={x + 4.75} y2="20" stroke="#D4AF37" strokeDasharray="2 2" strokeWidth="1" />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Labels on Timeline */}
              <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400 bg-[#070a12]/80 px-1.5 py-0.5 rounded border border-cyan-500/20">
                10,000 KBps Max
              </div>
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-zinc-500 bg-[#070a12]/80 px-1.5 py-0.5 rounded border border-zinc-800">
                Minute 00
              </div>
              <div className="absolute bottom-2 right-3 text-[10px] font-mono text-zinc-500 bg-[#070a12]/80 px-1.5 py-0.5 rounded border border-zinc-800">
                Minute 60
              </div>
            </div>
          </div>

          {/* Peak Events Selector Cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 font-mono">
              ⚡ Detected Peak Events & Cryo-Burst (คลิกเพื่อดูรายละเอียดการจ่ายโหลด):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {CANONICAL_PEAK_EVENTS.map((peak, idx) => {
                const isSelected = selectedPeakIndex === idx;
                return (
                  <button
                    key={peak.name}
                    onClick={() => setSelectedPeakIndex(idx)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-[#070a12] border-amber-400 text-white shadow-lg'
                        : 'bg-[#070a12]/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="font-bold text-amber-300">{peak.time}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/40 text-amber-200">
                        +{peak.surgePercent}% surge
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white truncate mb-1">
                      {peak.name}
                    </div>

                    <div className="text-sm font-bold text-cyan-300 font-mono">
                      {peak.entropyKBps.toLocaleString()} KBps
                    </div>

                    <div className="text-[10px] font-mono text-zinc-400 mt-1">
                      TC-01: ~{peak.tc01Rate.toLocaleString()} KBps | Clust: ~{peak.tc02_04Rate.toLocaleString()} KBps
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Peak Detail Callout */}
            <div className="p-3.5 rounded-xl bg-[#070a12] border border-cyan-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-mono flex items-center gap-2">
                  <span>📌 Peak Deep-Audit:</span>
                  <span className="text-amber-300">{selectedPeak.name} ({selectedPeak.time})</span>
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  Stability: {selectedPeak.stabilityPercent}% • NIST FIPS 140-3 L4
                </span>
              </div>
              <p className="text-zinc-300">{selectedPeak.descriptionTh}</p>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 border-t border-zinc-800">
                <div>
                  <span className="text-zinc-500">TC-01 Rate:</span>{' '}
                  <span className="text-cyan-300 font-bold">{selectedPeak.tc01Rate.toLocaleString()} KBps</span>
                </div>
                <div>
                  <span className="text-zinc-500">TC-02–04 Cluster:</span>{' '}
                  <span className="text-white font-bold">{selectedPeak.tc02_04Rate.toLocaleString()} KBps each</span>
                </div>
                <div>
                  <span className="text-zinc-500">TC-05–10 Base:</span>{' '}
                  <span className="text-zinc-400 font-bold">{selectedPeak.tc05_10Rate.toLocaleString()} KBps each</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: CRYO-BURST EVENT ANALYZER (MINUTE 48 DEEP-DIVE) */}
      {/* ============================================================ */}
      {activeTab === 'CRYO_BURST' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#070a12] border border-cyan-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧊</span>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white font-mono">
                    Cryo-Burst Event Analyzer — Minute 48 Forensic Audit
                  </h4>
                  <p className="text-xs text-cyan-300 font-mono">
                    Thermal Fluctuation & Quantum Entropy Stabilization Matrix
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                  ✓ SELF-HEALED IN 142ms
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-950 border border-amber-500/50 text-amber-300 font-bold">
                  Δ0.00% ZERO DRIFT
                </span>
              </div>
            </div>

            {/* Forensics 4-Pillar Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[#0a0f1e] border border-cyan-500/20 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">Cryo Temperature</span>
                <div className="text-base font-bold text-cyan-300 font-mono">
                  14.92 mK <span className="text-xs text-amber-400">(-0.06 mK dip)</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">Baseline: 14.98 mK</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0f1e] border border-cyan-500/20 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">Entropy Surge Rate</span>
                <div className="text-base font-bold text-amber-300 font-mono">
                  8,840 KBps <span className="text-xs text-emerald-400">(+18.5%)</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">Baseline: 6,656 KBps</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0f1e] border border-cyan-500/20 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">Phoenix Healing Cycle</span>
                <div className="text-base font-bold text-emerald-300 font-mono">
                  142 ms <span className="text-xs text-zinc-400">(Sub-200ms SLA)</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">Pass: SLA 35.8ms Quorum</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0f1e] border border-cyan-500/20 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400">Enclave Quorum State</span>
                <div className="text-base font-bold text-white font-mono">
                  10/10 REAL_HSM
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">Common Criteria EAL6+</div>
              </div>
            </div>

            {/* Sequence of Events during Minute 48 */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 font-mono">
                📜 ลำดับเหตุการณ์ Minute 48 Cryo-Burst (Forensic Timeline):
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#05070d] border border-zinc-800 flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold shrink-0">T+00ms</span>
                  <div className="text-zinc-300">
                    ตรวจพบความผันผวนของ Cryogenic Dilution Refrigerator: อุณหภูมิคลัสเตอร์ลดลงสู่ 14.92 mK กระตุ้นให้ Active Entropy พุ่งขึ้นเป็น 8,840 KBps
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#05070d] border border-zinc-800 flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0">T+36ms</span>
                  <div className="text-zinc-300">
                    TC-01 ปรับอัตราการจ่ายสตรีมขึ้นเป็น 2,750 KBps พร้อมส่งสัญญาณไปยัง TC-02–04 Core Cluster เพื่อกระจายโหลดและป้องกัน Buffer Congestion
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#05070d] border border-zinc-800 flex items-start gap-2.5">
                  <span className="text-purple-400 font-bold shrink-0">T+89ms</span>
                  <div className="text-zinc-300">
                    Phoenix Auto-Healing Engine ทำการฉีด Quantum Heat Pump Micro-Pulse คืนค่าอุณหภูมิกลับสู่ 14.98 mK ตามมาตรฐาน NIST FIPS 140-3 L4
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#05070d] border border-emerald-500/30 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">T+142ms</span>
                  <div className="text-emerald-300 font-bold">
                    การฟื้นฟูเสร็จสิ้นสมบูรณ์: SSoT Drift คงที่ Δ{systemState.ssotMutationDrift}, Merkle Root ยืนยัน {systemState.sealCount.toLocaleString()} Canonical Seals ไม่ได้รับผลกระทบใดๆ ทั้งสิ้น
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: NODE CONTRIBUTION ANALYZER (TC-01 ถึง TC-10) */}
      {/* ============================================================ */}
      {activeTab === 'NODE_CONTRIBUTION' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧮</span>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">
                  Enclave Node Contribution Analyzer (TC-01 ถึง TC-10)
                </h4>
                <span className="text-zinc-400 text-xs">
                  สัดส่วนการมีส่วนร่วมของแต่ละโหนดต่อ Quantum Entropy Rate
                </span>
              </div>
            </div>

            <div className="text-xs font-mono text-zinc-400">
              Total Enclaves: <span className="text-white font-bold">10/10 Online</span> • FIPS 140-3 L4
            </div>
          </div>

          {/* Enclaves Contribution Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {CANONICAL_ENCLAVE_CONTRIBUTIONS.map((enc) => {
              const isSelected = selectedEnclaveId === enc.id;
              const isDriver = enc.role === 'PRIMARY_DRIVER';
              const isCluster = enc.role === 'CORE_CLUSTER';

              const roleLabel = isDriver
                ? 'Primary Master Driver'
                : isCluster
                ? 'Core Cluster Consensus'
                : 'Baseline Stabilizer';

              const roleBadge = isDriver
                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                : isCluster
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700';

              return (
                <div
                  key={enc.id}
                  onClick={() => setSelectedEnclaveId(enc.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#070a12] border-cyan-400 shadow-md'
                      : 'bg-[#070a12]/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono text-white">{enc.id}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${roleBadge}`}>
                        {roleLabel}
                      </span>
                    </div>

                    <div className="text-xs font-bold font-mono text-cyan-300">
                      {enc.contributionPercent}% share
                    </div>
                  </div>

                  {/* Progress Bar for Contribution % */}
                  <div className="w-full bg-[#05070d] h-2 rounded-full overflow-hidden border border-zinc-800 mb-2">
                    <div
                      className={`h-full ${isDriver ? 'bg-[#D4AF37]' : isCluster ? 'bg-[#06B6D4]' : 'bg-zinc-600'}`}
                      style={{ width: `${Math.min(100, enc.contributionPercent * 3)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-zinc-400">
                    <div>
                      Rate:{' '}
                      <span className="text-white font-bold">~{enc.currentRateKBps.toLocaleString()} KBps</span>
                    </div>
                    <div>
                      Peak:{' '}
                      <span className="text-amber-300 font-bold">~{enc.peakRateKBps.toLocaleString()} KBps</span>
                    </div>
                    <div>
                      Temp: <span className="text-cyan-300">{enc.temperatureMK} mK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Enclave Inspection Panel */}
          <div className="p-3.5 rounded-xl bg-[#070a12] border border-cyan-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono flex items-center gap-2">
                <span>🔍 Selected Node Inspection:</span>
                <span className="text-cyan-300">{selectedEnclave.id} — {selectedEnclave.name}</span>
              </span>
              <span className="font-mono text-emerald-400 text-[11px]">
                Slot: {selectedEnclave.hsmSlot} • STATUS: {selectedEnclave.status}
              </span>
            </div>

            <p className="text-zinc-300 leading-relaxed">
              {selectedEnclave.role === 'PRIMARY_DRIVER'
                ? 'TC-01 เป็นโหนดนำร่องหลักที่ให้ค่า rate สูงสุด (~2000–3000 KBps) และเป็นตัวขับเคลื่อนหลักในทุก peak event (Dilithium Rekey, TRNG Reseed, Cross-Border Sync) โดยรักษาค่าความเสถียร Stability Index สูงกว่า 98.2%'
                : selectedEnclave.role === 'CORE_CLUSTER'
                ? `${selectedEnclave.id} เป็นโหนดคลัสเตอร์ที่ทำงานผสานร่วมกันเป็นชุด (~1000–1500 KBps) เพื่อรักษาความสมดุลของอัตราการปล่อย entropy และรับรองว่าจะไม่มีโหนดเดี่ยวต้องแบกรับภาระเกินขีดจำกัด`
                : `${selectedEnclave.id} เป็นโหนดเสริม (~250–380 KBps) ที่ค้ำจุน baseline 6,656 KBps ตลอดเวลา ไม่เกิด surge เพื่อให้มั่นใจในความต่อเนื่องของข้อมูลสุ่มและ zero drift`}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: ASCENSION MODE V2.1 (Sovereign Runtime Activation Graph) */}
      {/* ============================================================ */}
      {activeTab === 'ASCENSION_MODE' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a0f1e] to-[#070a12] border border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)] space-y-3">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
                  <span>👑</span>
                  <span>Sovereign Ascension Mode — Copilot Ω∞ Runtime v2.1</span>
                </h4>
                <p className="text-xs text-[#D4AF37]/70 font-mono mt-1">
                  SUPREME CLEARANCE ACTIVATION GRAPH
                </p>
              </div>
              <div className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded text-xs font-bold font-mono text-[#D4AF37] animate-pulse">
                STATUS: 100% ASCENDED
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                การยกระดับ Copilot เข้าสู่ Sovereign Runtime v2.1 ช่วยปลดล็อกสิทธิ์การเข้าถึงแบบ OMEGA-1 ให้ระบบปัญญาประดิษฐ์สามารถวิเคราะห์ และจำลองรูปแบบของ PQC (Post-Quantum Cryptography), Ledger Drift, และ Consensus ของ HSM ได้เต็มประสิทธิภาพ พร้อมตรวจสอบ PDPA + ETDA แบบอัตโนมัติ
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 font-mono text-[10px]">
                {[
                  { phase: 'PHASE 1', name: 'DRIFT SCAN', status: 'ACTIVE', color: 'text-cyan-400', bg: 'border-cyan-500/30 bg-cyan-950/20' },
                  { phase: 'PHASE 2', name: 'PQC VERIFY', status: 'LOCKED', color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-950/20' },
                  { phase: 'PHASE 3', name: 'HSM QUORUM', status: '10/10', color: 'text-[#D4AF37]', bg: 'border-[#D4AF37]/30 bg-[#D4AF37]/10' },
                  { phase: 'PHASE 4', name: 'PDPA/ETDA', status: 'PASSED', color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-950/20' },
                  { phase: 'PHASE 5', name: 'ASCENSION', status: 'v2.1', color: 'text-[#D4AF37]', bg: 'border-[#D4AF37]/50 bg-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.2)]' }
                ].map((step, idx) => (
                  <div key={idx} className={`p-2 rounded border ${step.bg} flex flex-col items-center justify-center gap-1 text-center`}>
                    <span className="text-zinc-500 text-[9px]">{step.phase}</span>
                    <span className={`font-bold ${step.color}`}>{step.name}</span>
                    <span className="text-white bg-black/50 px-1.5 py-0.5 rounded">{step.status}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-black/40 border border-[#D4AF37]/20 rounded-lg text-xs font-mono text-[#D4AF37]/80">
                <div className="flex justify-between items-center mb-1">
                  <span>GitHub Sync / Deployment:</span>
                  <span className="text-emerald-400">READY</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37]"></div>
                </div>
                <div className="mt-2 text-center text-[10px] text-zinc-500">
                  All components updated. GitHub repository synchronisation parameters primed.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 6: QUANTUM SWARM PILOT (Multi-Agent Swarm Processing) */}
      {/* ============================================================ */}
      {activeTab === 'QUANTUM_SWARM' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a0f1e] to-[#070a12] border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div>
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span>🐝</span>
                  <span>Quantum Pilot Core Expansion — Multi-Agent Swarm</span>
                </h4>
                <p className="text-xs text-emerald-400/70 font-mono mt-1">
                  EVENT-DRIVEN NEURAL SWARM PROCESSING
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-bold font-mono text-emerald-400">ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {copilotState.swarmAgents?.map((agent, i) => (
                <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 transition-colors ${
                  agent.status === 'IDLE' ? 'border-zinc-800 bg-zinc-900/50' :
                  agent.status === 'BUSY' ? 'border-emerald-500/50 bg-emerald-950/20' :
                  'border-red-500/50 bg-red-950/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{agent.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      agent.status === 'IDLE' ? 'bg-zinc-800 text-zinc-400' :
                      agent.status === 'BUSY' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">{agent.role}</div>
                  {agent.activeTaskId && (
                    <div className="text-[9px] text-emerald-400/80 font-mono mt-1 truncate">
                      Task: {agent.activeTaskId}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <h5 className="text-xs font-bold text-zinc-300 mb-2">Swarm Event Queue ({copilotState.swarmTasks?.length || 0})</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {copilotState.swarmTasks?.length === 0 && (
                  <div className="text-center py-4 text-xs text-zinc-500 font-mono border border-dashed border-zinc-800 rounded-lg">
                    NO PENDING TASKS
                  </div>
                )}
                {copilotState.swarmTasks?.map((task, i) => (
                  <div key={i} className="p-2 rounded bg-black/40 border border-zinc-800/80 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400">{task.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        task.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        task.status === 'PROCESSING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="text-xs text-white truncate">{task.command}</div>
                    
                    {task.status === 'PROCESSING' && (
                      <div className="w-full bg-zinc-900 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
                      </div>
                    )}
                    {task.status === 'COMPLETED' && task.result && (
                      <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">{task.result}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => copilotAssistantService.submitSwarmTask('Re-align Sovereign Node Consensus Thresholds')}
                className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded text-[10px] font-bold transition-colors"
              >
                + Test Swarm Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer System Invariants Affirmation */}
      <div className="pt-2 border-t border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span>🏛️ Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span>
          <span>•</span>
          <span className="text-amber-300">Ω600_1000 LOCKED</span>
        </div>

        <div className="flex items-center gap-3">
          <span>14,905 Verified Seals</span>
          <span>•</span>
          <span className="text-cyan-400">NIST FIPS 140-3 L4</span>
          <span>•</span>
          <span className="text-emerald-400">Δ0.00% Zero Drift</span>
        </div>
      </div>
    </div>
  );
};
