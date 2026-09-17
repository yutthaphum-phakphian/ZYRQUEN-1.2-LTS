import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
  Area,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Flame,
  Snowflake,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Radio,
  RotateCcw,
  CheckCircle2,
  Lock,
  Cpu,
  Clock,
  ArrowDownRight,
  TrendingUp,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface TelemetryPoint {
  timeLabel: string;
  timeSec: number;
  qopsReal?: number;
  qopsPredicted?: number;
  cryoTempReal?: number;
  cryoTempPredicted?: number;
  coherence: number;
  isForecast?: boolean;
}

export const CryogenicTelemetryVisualizer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isSimulatingAnomaly, setIsSimulatingAnomaly] = useState(false);
  const [failClosedLockdown, setFailClosedLockdown] = useState(false);
  const [zeroizationActive, setZeroizationActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'combined' | 'qops' | 'cryo'>('combined');
  const [timeRemaining60s, setTimeRemaining60s] = useState(58);

  // Generate initial + live telemetry dataset with +60s prediction horizon
  const [data, setData] = useState<TelemetryPoint[]>(() => {
    const points: TelemetryPoint[] = [];
    // Past 60 seconds (Historical Real Data)
    for (let t = -60; t <= 0; t += 10) {
      points.push({
        timeLabel: `${t}s`,
        timeSec: t,
        qopsReal: +(851.4 + Math.sin(t * 0.1) * 0.5 + (Math.random() * 0.4 - 0.2)).toFixed(2),
        cryoTempReal: +(14.95 + Math.cos(t * 0.08) * 0.04 + (Math.random() * 0.02 - 0.01)).toFixed(2),
        coherence: 99.992,
        isForecast: false,
      });
    }

    // Future +60 seconds (Predictive AI Horizon)
    const futureTimes = [10, 20, 30, 40, 50, 60];
    futureTimes.forEach((t) => {
      points.push({
        timeLabel: `+${t}s`,
        timeSec: t,
        qopsPredicted: +(851.8 - (t / 60) * 2.3 + (Math.random() * 0.3 - 0.15)).toFixed(2), // Forecasts drop towards 849.5
        cryoTempPredicted: +(14.97 + (t / 60) * 0.33 + (Math.random() * 0.02 - 0.01)).toFixed(2), // Forecasts spike towards 15.30 mK
        coherence: +(99.992 - (t / 60) * 0.02).toFixed(3),
        isForecast: true,
      });
    });

    return points;
  });

  // Countdown timer for 60s prediction risk window
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining60s((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const latestReal = useMemo(() => {
    const realPoints = data.filter((d) => !d.isForecast);
    return realPoints[realPoints.length - 1] || data[0];
  }, [data]);

  const latestForecast = useMemo(() => {
    const forecastPoints = data.filter((d) => d.isForecast);
    return forecastPoints[forecastPoints.length - 1] || data[data.length - 1];
  }, [data]);

  const handleTriggerFailClosed = useCallback(() => {
    setFailClosedLockdown(true);
    playTone(320, 0.2, 'sawtooth');
    setTimeout(() => playTone(240, 0.3, 'sawtooth'), 220);
  }, []);

  const handleTestZeroization = useCallback(() => {
    setZeroizationActive(true);
    playTone(900, 0.08, 'sine');
    setTimeout(() => {
      playTone(450, 0.12, 'square');
      setZeroizationActive(false);
    }, 1800);
  }, []);

  const handleResetLockdown = useCallback(() => {
    setFailClosedLockdown(false);
    setIsSimulatingAnomaly(false);
    playAuditChime();
  }, []);

  return (
    <div className={`w-full rounded-[24px] bg-[#070A16] border border-cyan-500/30 p-5 sm:p-6 shadow-2xl text-white font-mono space-y-6 ${className}`}>
      {/* Header & Status Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-fuchsia-500/20 to-amber-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0">
            <Snowflake className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
                Cryogenic Telemetry Visualizer & Anomaly Predictor
              </h2>
              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                +60s Horizon AI
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="text-cyan-400 font-semibold">QOps Quantum Ops</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-semibold">Cryo Temp He-4 (Subzero)</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-semibold">SSoT Δ0 Block #849202</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Quad */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-black/60 border border-cyan-500/30 p-2.5 rounded-xl shadow-inner">
            <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Real QOps</span>
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">{latestReal.qopsReal?.toFixed(1)} <span className="text-[10px] font-normal text-zinc-400">QOps/s</span></div>
          </div>

          <div className="bg-black/60 border border-amber-500/30 p-2.5 rounded-xl shadow-inner">
            <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Snowflake className="w-3 h-3 text-amber-400" />
              <span>Cryo He-4</span>
            </div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">{latestReal.cryoTempReal?.toFixed(2)} <span className="text-[10px] font-normal text-zinc-400">mK</span></div>
          </div>

          <div className="bg-black/60 border border-emerald-500/30 p-2.5 rounded-xl shadow-inner">
            <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Coherence</span>
            </div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">{latestReal.coherence}%</div>
          </div>

          <div className="bg-black/60 border border-fuchsia-500/30 p-2.5 rounded-xl shadow-inner">
            <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-fuchsia-400" />
              <span>Risk Window</span>
            </div>
            <div className="text-sm font-bold text-fuchsia-300 mt-0.5">+{timeRemaining60s}s <span className="text-[10px] font-normal text-zinc-400">AI</span></div>
          </div>
        </div>
      </div>

      {/* Anomaly Prediction Warning Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-amber-950/30 to-black/60 border border-fuchsia-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-400 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-fuchsia-300 flex items-center gap-2">
              <span>PREDICTIVE ANOMALY OVERLAY (+60s HORIZON)</span>
              <span className="text-[10px] bg-fuchsia-900/80 px-2 py-0.5 rounded text-fuchsia-200 border border-fuchsia-500/40">
                ACTIVE INFERENCE
              </span>
            </div>
            <div className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
              Model predicts <span className="text-fuchsia-400 font-bold">QOps Drop Risk ↓849.5 QOps/s</span> and <span className="text-amber-400 font-bold">Thermal Spike Alert ↑15.30 mK</span> at +60s. Fail-Closed Protocol is armed.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setIsSimulatingAnomaly(!isSimulatingAnomaly);
              playTone(720, 0.04);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isSimulatingAnomaly
                ? 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                : 'bg-black/60 text-zinc-300 border-white/10 hover:border-fuchsia-500/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isSimulatingAnomaly ? 'Live Simulation Active' : 'Toggle AI Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Chart Visualizer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">TELEMETRY DISPLAY MODE:</span>
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => {
                  setActiveTab('combined');
                  playTone(550, 0.03);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'combined'
                    ? 'bg-cyan-500/30 text-white font-bold border border-cyan-500/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Dual Axis (QOps + He-4)
              </button>
              <button
                onClick={() => {
                  setActiveTab('qops');
                  playTone(600, 0.03);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'qops'
                    ? 'bg-cyan-500/30 text-white font-bold border border-cyan-500/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                QOps Graph
              </button>
              <button
                onClick={() => {
                  setActiveTab('cryo');
                  playTone(650, 0.03);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'cryo'
                    ? 'bg-amber-500/30 text-white font-bold border border-amber-500/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cryo Temp He-4
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
              <span>Real QOps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span>Real He-4 (mK)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-fuchsia-400 inline-block" />
              <span className="text-fuchsia-400 font-bold">+60s Forecast (Drop/Spike)</span>
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-[320px] bg-[#050711] rounded-2xl border border-white/5 p-3 relative overflow-hidden shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" opacity={0.5} />
              <XAxis dataKey="timeLabel" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />

              {/* Left Axis: QOps */}
              <YAxis
                yAxisId="qops"
                domain={[848, 854]}
                orientation="left"
                stroke="#06B6D4"
                tick={{ fontSize: 11, fill: '#06B6D4' }}
                unit=" Q"
              />

              {/* Right Axis: Cryo Temp He-4 mK */}
              <YAxis
                yAxisId="cryo"
                domain={[14.8, 15.5]}
                orientation="right"
                stroke="#F59E0B"
                tick={{ fontSize: 11, fill: '#F59E0B' }}
                unit=" mK"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#090D1C',
                  borderColor: '#06B6D4',
                  borderRadius: '12px',
                  boxShadow: '0 0 20px rgba(0,0,0,0.8)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />

              {/* Shaded Forecast Region */}
              <ReferenceArea
                x1="0s"
                x2="+60s"
                yAxisId="qops"
                fill="#A855F7"
                fillOpacity={0.06}
                stroke="#A855F7"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />

              {/* Critical Alert Threshold Lines */}
              <ReferenceLine
                yAxisId="qops"
                y={849.5}
                stroke="#F43F5E"
                strokeDasharray="4 4"
                label={{ value: '⚠️ QOps Low Threshold (849.5)', fill: '#F43F5E', fontSize: 10, position: 'insideBottomLeft' }}
              />

              <ReferenceLine
                yAxisId="cryo"
                y={15.3}
                stroke="#E11D48"
                strokeDasharray="4 4"
                label={{ value: '⚠️ Temp Spike Alert (15.3 mK)', fill: '#E11D48', fontSize: 10, position: 'insideTopRight' }}
              />

              {/* Real Measured Lines */}
              {(activeTab === 'combined' || activeTab === 'qops') && (
                <Line
                  yAxisId="qops"
                  type="monotone"
                  dataKey="qopsReal"
                  name="Real QOps"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#06B6D4' }}
                />
              )}

              {(activeTab === 'combined' || activeTab === 'cryo') && (
                <Line
                  yAxisId="cryo"
                  type="monotone"
                  dataKey="cryoTempReal"
                  name="Real Cryo Temp (mK)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#F59E0B' }}
                />
              )}

              {/* Forecast Dashed Lines */}
              {(activeTab === 'combined' || activeTab === 'qops') && (
                <Line
                  yAxisId="qops"
                  type="monotone"
                  dataKey="qopsPredicted"
                  name="Predicted QOps (Drop Risk)"
                  stroke="#EC4899"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#EC4899' }}
                />
              )}

              {(activeTab === 'combined' || activeTab === 'cryo') && (
                <Line
                  yAxisId="cryo"
                  type="monotone"
                  dataKey="cryoTempPredicted"
                  name="Predicted Temp (Thermal Spike)"
                  stroke="#DB2777"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#DB2777' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly Response Console & Fail-Closed Quarantine Controls */}
      <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Fail-Closed Quarantine & Active Zeroization Console
            </h3>
          </div>
          {failClosedLockdown && (
            <span className="text-[10px] font-bold text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-500/50 animate-pulse">
              LOCKDOWN ACTIVE: SSoT PROTECTED
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleTriggerFailClosed}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              failClosedLockdown
                ? 'bg-red-500/30 border-red-500 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Trigger Fail-Closed Quarantine</span>
          </button>

          <button
            onClick={handleTestZeroization}
            disabled={zeroizationActive}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              zeroizationActive
                ? 'bg-amber-500/30 border-amber-500 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{zeroizationActive ? 'Zeroizing Volatile Enclave...' : 'Simulate Active Zeroization'}</span>
          </button>

          <button
            onClick={handleResetLockdown}
            className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reconcile Cryo He-4 & Clear State</span>
          </button>
        </div>

        <div className="text-[10px] text-zinc-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
          <span>Standard: ISO/IEC 27037 Digital Forensics & FIPS 140-3 Level 4</span>
          <span className="text-cyan-400 font-medium">Replay Latency: 142ms Bit-for-Bit</span>
        </div>
      </div>
    </div>
  );
};
