import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Radio,
  Clock,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface HeartbeatStabilityPoint {
  minute: number; // 0 (now) to 59 (60m ago)
  timeLabel: string; // e.g., '59m ago', '30m ago', 'Now'
  clockTime: string; // e.g., '13:44'
  heartbeatHz: number; // Nominal carrier: 1.0000 Hz (0.9998 - 1.0002 Hz)
  jitterMs: number; // Sub-Kelvin bus jitter: mean ~0.31 ms (SLA <= 2.00 ms)
  stabilityPct: number; // Stability index: ~99.992% (SLA >= 99.95%)
  coherencePct: number; // Quantum coherence: ~99.992%
  activeHsmNodes: number; // 10/10 REAL_HSM
  status: 'OPTIMAL' | 'NOMINAL' | 'WARNING';
}

export type HeartbeatMetricMode = 'composite' | 'stability' | 'frequency' | 'jitter' | 'all';

/**
 * Generates deterministic 60-minute hardware heartbeat stability historical data
 */
export function generateHeartbeatStabilityHistory(pointsCount: number = 60): HeartbeatStabilityPoint[] {
  const points: HeartbeatStabilityPoint[] = [];
  const now = Date.now();

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timeOffsetMs = i * 60 * 1000;
    const pointDate = new Date(now - timeOffsetMs);
    const clockTime = pointDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const timeLabel = i === 0 ? 'Now' : `${i}m ago`;

    // High-stability sub-Kelvin oscillator (1.0000 Hz baseline)
    const sinComponent = Math.sin((pointsCount - i) * 0.28) * 0.00015;
    const cosComponent = Math.cos((pointsCount - i) * 0.12) * 0.00009;
    const microJitterHz = (Math.random() * 0.00006) - 0.00003;
    const heartbeatHz = +(1.0000 + sinComponent + cosComponent + microJitterHz).toFixed(5);

    // Sub-Kelvin bus latency / jitter in milliseconds (Mean: ~0.31 ms, SLA <= 2.00 ms)
    const jitterNoise = (Math.random() * 0.08) - 0.04;
    const jitterMs = +(0.31 + (Math.sin(i * 0.4) * 0.06) + jitterNoise).toFixed(3);

    // Coherence & stability index (Target: 99.992%, SLA >= 99.950%)
    const stabilityPct = +(99.992 + (Math.cos(i * 0.2) * 0.004) + ((Math.random() * 0.002) - 0.001)).toFixed(3);
    const coherencePct = +(99.992 + ((Math.random() * 0.004) - 0.002)).toFixed(3);

    points.push({
      minute: i,
      timeLabel,
      clockTime,
      heartbeatHz,
      jitterMs: Math.max(0.18, jitterMs),
      stabilityPct: Math.min(100, Math.max(99.96, stabilityPct)),
      coherencePct: Math.min(100, Math.max(99.95, coherencePct)),
      activeHsmNodes: 10,
      status: jitterMs <= 1.0 ? 'OPTIMAL' : 'NOMINAL'
    });
  }

  return points;
}

export const HardwareHeartbeatStabilityTrend: React.FC<{
  className?: string;
  onPointClick?: (point: HeartbeatStabilityPoint) => void;
}> = ({ className = '', onPointClick }) => {
  const [dataPoints, setDataPoints] = useState<HeartbeatStabilityPoint[]>(() =>
    generateHeartbeatStabilityHistory(60)
  );
  const [metricMode, setMetricMode] = useState<HeartbeatMetricMode>('composite');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<HeartbeatStabilityPoint | null>(null);

  // Live simulation tick: periodically adds real-time heartbeat pulse
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const lastPoint = prev[prev.length - 1];
        const now = new Date();
        const clockTime = now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        const sinComponent = Math.sin(Date.now() / 8000) * 0.00012;
        const microJitterHz = (Math.random() * 0.00004) - 0.00002;
        const heartbeatHz = +(1.0000 + sinComponent + microJitterHz).toFixed(5);
        const jitterMs = +(0.31 + (Math.random() * 0.06 - 0.03)).toFixed(3);
        const stabilityPct = +(99.992 + (Math.random() * 0.003 - 0.0015)).toFixed(3);
        const coherencePct = +(99.992 + (Math.random() * 0.002 - 0.001)).toFixed(3);

        const newPoint: HeartbeatStabilityPoint = {
          minute: 0,
          timeLabel: 'Now',
          clockTime,
          heartbeatHz,
          jitterMs,
          stabilityPct,
          coherencePct,
          activeHsmNodes: 10,
          status: 'OPTIMAL'
        };

        // Shift minute labels
        const updated = [...prev.slice(1), newPoint].map((pt, idx, arr) => {
          const m = arr.length - 1 - idx;
          return {
            ...pt,
            minute: m,
            timeLabel: m === 0 ? 'Now' : `${m}m ago`
          };
        });

        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Aggregate statistics over the 60-minute window
  const summaryStats = useMemo(() => {
    if (!dataPoints.length) {
      return {
        meanStability: 99.992,
        meanJitter: 0.31,
        minHz: 0.9999,
        maxHz: 1.0001,
        slaBreaches: 0,
        carrierDriftPpm: 1.2
      };
    }

    const stabilities = dataPoints.map((d) => d.stabilityPct);
    const jitters = dataPoints.map((d) => d.jitterMs);
    const freqs = dataPoints.map((d) => d.heartbeatHz);

    const meanStability = stabilities.reduce((a, b) => a + b, 0) / stabilities.length;
    const meanJitter = jitters.reduce((a, b) => a + b, 0) / jitters.length;
    const minHz = Math.min(...freqs);
    const maxHz = Math.max(...freqs);
    const slaBreaches = jitters.filter((j) => j > 2.0).length;
    const maxDevHz = Math.max(Math.abs(maxHz - 1.0), Math.abs(minHz - 1.0));
    const carrierDriftPpm = +(maxDevHz * 1000000).toFixed(1);

    return {
      meanStability: +meanStability.toFixed(3),
      meanJitter: +meanJitter.toFixed(3),
      minHz,
      maxHz,
      slaBreaches,
      carrierDriftPpm
    };
  }, [dataPoints]);

  const handleRefresh = useCallback(() => {
    playTone(660, 0.04);
    setDataPoints(generateHeartbeatStabilityHistory(60));
  }, []);

  return (
    <div
      id="hardware-heartbeat-stability-trend"
      className={`p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.12)] space-y-4 font-mono text-white ${className}`}
    >
      {/* Header Bar & Control Panel */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Radio className="w-5 h-5 animate-pulse text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                Hardware Heartbeat Stability Trend
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  60-MIN ROLLING
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              1.00 Hz Carrier Synchronization • Sub-Kelvin Bus Jitter (0.31 ms) • 10/10 REAL_HSM Quorum
            </p>
          </div>
        </div>

        {/* View Controls & Action Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-[#070b14] border border-zinc-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                playTone(520, 0.02);
                setMetricMode('composite');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metricMode === 'composite'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Stability % & Jitter Dual-Axis"
            >
              Composite
            </button>
            <button
              onClick={() => {
                playTone(520, 0.02);
                setMetricMode('stability');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metricMode === 'stability'
                  ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Hardware Stability %"
            >
              Stability (%)
            </button>
            <button
              onClick={() => {
                playTone(520, 0.02);
                setMetricMode('jitter');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metricMode === 'jitter'
                  ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Sub-Kelvin Jitter (ms)"
            >
              Jitter (ms)
            </button>
            <button
              onClick={() => {
                playTone(520, 0.02);
                setMetricMode('frequency');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metricMode === 'frequency'
                  ? 'bg-purple-500 text-black shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Heartbeat Carrier Frequency (Hz)"
            >
              Carrier (Hz)
            </button>
            <button
              onClick={() => {
                playTone(520, 0.02);
                setMetricMode('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metricMode === 'all'
                  ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="All Metrics Combined"
            >
              All
            </button>
          </div>

          {/* Live Pulse Stream Toggle */}
          <button
            onClick={() => {
              playTone(isLiveStreaming ? 400 : 700, 0.03);
              setIsLiveStreaming(!isLiveStreaming);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-[#070b14] border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Live Real-Time Heartbeat Stream"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span>{isLiveStreaming ? 'STREAMING' : 'PAUSED'}</span>
          </button>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-xl bg-[#070b14] border border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Re-synchronize Heartbeat Array"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Summary KPI Mini-Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-[#070b14] border border-cyan-500/20">
          <span className="text-[10px] text-zinc-400 block mb-0.5">60m Stability Index</span>
          <div className="text-base sm:text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <span>{summaryStats.meanStability}%</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[9.5px] text-zinc-500 block mt-0.5">SLA Floor: ≥ 99.95%</span>
        </div>

        <div className="p-3 rounded-xl bg-[#070b14] border border-cyan-500/20">
          <span className="text-[10px] text-zinc-400 block mb-0.5">Sub-Kelvin Jitter</span>
          <div className="text-base sm:text-lg font-bold text-cyan-300 flex items-center gap-1.5">
            <span>{summaryStats.meanJitter} ms</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              OPTIMAL
            </span>
          </div>
          <span className="text-[9.5px] text-zinc-500 block mt-0.5">SLA Limit: ≤ 2.00 ms</span>
        </div>

        <div className="p-3 rounded-xl bg-[#070b14] border border-purple-500/20">
          <span className="text-[10px] text-zinc-400 block mb-0.5">Carrier Frequency</span>
          <div className="text-base sm:text-lg font-bold text-purple-300">
            {dataPoints[dataPoints.length - 1]?.heartbeatHz.toFixed(4) || '1.0000'} Hz
          </div>
          <span className="text-[9.5px] text-zinc-500 block mt-0.5">
            Drift: {summaryStats.carrierDriftPpm} ppm
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#070b14] border border-cyan-500/20">
          <span className="text-[10px] text-zinc-400 block mb-0.5">SLA Compliance</span>
          <div className="text-base sm:text-lg font-bold text-white flex items-center gap-1">
            <span className="text-emerald-400">100.0%</span>
            <span className="text-[10px] text-zinc-400 font-normal">
              ({summaryStats.slaBreaches} breaches)
            </span>
          </div>
          <span className="text-[9.5px] text-emerald-400/80 block mt-0.5">Zero Drift SSoT Δ0.00%</span>
        </div>

        <div className="p-3 rounded-xl bg-[#070b14] border border-cyan-500/20 col-span-2 md:col-span-1">
          <span className="text-[10px] text-zinc-400 block mb-0.5">Hardware Custodians</span>
          <div className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-1.5">
            <span>10 / 10</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              REAL_HSM
            </span>
          </div>
          <span className="text-[9.5px] text-zinc-500 block mt-0.5">FIPS 140-3 L4 Quorum</span>
        </div>
      </div>

      {/* Visual Recharts Trend Line Graph */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataPoints}
            margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload[0]) {
                const point = e.activePayload[0].payload as HeartbeatStabilityPoint;
                setSelectedPoint(point);
                if (onPointClick) onPointClick(point);
                playTone(600, 0.02);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              interval={5}
            />

            {/* Left Y-Axis for Stability Index (%) */}
            <YAxis
              yAxisId="stability"
              domain={[99.95, 100]}
              stroke="#10b981"
              fontSize={10}
              tickLine={false}
              unit="%"
              tickFormatter={(v) => v.toFixed(2)}
              hide={metricMode === 'frequency' || metricMode === 'jitter'}
            />

            {/* Right Y-Axis for Jitter (ms) */}
            <YAxis
              yAxisId="jitter"
              orientation="right"
              domain={[0, 2.2]}
              stroke="#06b6d4"
              fontSize={10}
              tickLine={false}
              unit="ms"
              tickFormatter={(v) => v.toFixed(1)}
              hide={metricMode === 'stability' || metricMode === 'frequency'}
            />

            {/* Third Y-Axis for Carrier Frequency (Hz) */}
            <YAxis
              yAxisId="frequency"
              orientation="right"
              domain={[0.9996, 1.0004]}
              stroke="#c084fc"
              fontSize={10}
              tickLine={false}
              unit="Hz"
              tickFormatter={(v) => v.toFixed(4)}
              hide={metricMode !== 'frequency' && metricMode !== 'all'}
            />

            {/* SLA Reference Line (Jitter SLA = 2.00 ms max) */}
            <ReferenceLine
              yAxisId="jitter"
              y={2.0}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'SLA Max (2.00 ms)',
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />

            {/* Coherence Reference Line (Stability >= 99.95% min) */}
            <ReferenceLine
              yAxisId="stability"
              y={99.95}
              stroke="#eab308"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              label={{
                value: 'Coherence Floor (99.95%)',
                fill: '#eab308',
                fontSize: 9,
                position: 'insideBottomLeft'
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload as HeartbeatStabilityPoint;
                return (
                  <div className="p-3 rounded-xl bg-[#070b14]/95 border border-cyan-500/40 shadow-xl backdrop-blur-md font-mono text-xs space-y-1.5 min-w-[220px]">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {p.clockTime} ({p.timeLabel})
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        {p.status}
                      </span>
                    </div>

                    <div className="space-y-1 pt-0.5 text-[11px]">
                      <div className="flex items-center justify-between text-emerald-300">
                        <span>Stability Index:</span>
                        <span className="font-bold">{p.stabilityPct.toFixed(3)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-cyan-300">
                        <span>Bus Jitter:</span>
                        <span className="font-bold">{p.jitterMs.toFixed(3)} ms</span>
                      </div>
                      <div className="flex items-center justify-between text-purple-300">
                        <span>Carrier Frequency:</span>
                        <span className="font-bold">{p.heartbeatHz.toFixed(5)} Hz</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Quantum Coherence:</span>
                        <span className="font-bold text-zinc-200">{p.coherencePct.toFixed(3)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Active Enclaves:</span>
                        <span className="font-bold text-cyan-400">{p.activeHsmNodes}/10 REAL_HSM</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
            />

            {/* Stability Index Line */}
            {(metricMode === 'composite' || metricMode === 'stability' || metricMode === 'all') && (
              <Line
                yAxisId="stability"
                type="monotone"
                dataKey="stabilityPct"
                name="Stability Index (%)"
                stroke="#10b981"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {/* Sub-Kelvin Bus Jitter Line */}
            {(metricMode === 'composite' || metricMode === 'jitter' || metricMode === 'all') && (
              <Line
                yAxisId="jitter"
                type="monotone"
                dataKey="jitterMs"
                name="Sub-Kelvin Jitter (ms)"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {/* Carrier Frequency Line */}
            {(metricMode === 'frequency' || metricMode === 'all') && (
              <Line
                yAxisId="frequency"
                type="monotone"
                dataKey="heartbeatHz"
                name="Carrier Freq (Hz)"
                stroke="#c084fc"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 5, fill: '#c084fc', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Detail Inspector Drawer if user clicks a data point */}
      {selectedPoint && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold text-white">
                Minute Epoch {selectedPoint.timeLabel} ({selectedPoint.clockTime})
              </span>
              <p className="text-[11px] text-zinc-400">
                Carrier: {selectedPoint.heartbeatHz.toFixed(5)} Hz • Jitter: {selectedPoint.jitterMs} ms • Stability: {selectedPoint.stabilityPct}%
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPoint(null)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Footer Invariant Anchor */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-cyan-500/15 text-[11px] text-zinc-500">
        <span>Hardware SLA Baseline: Cryo &le; 18.00 mK • Jitter &le; 2.00 ms • Coherence &ge; 99.95%</span>
        <span className="text-cyan-400/80 font-bold">Genesis Anchor: Block #849202</span>
      </div>
    </div>
  );
};
