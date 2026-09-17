import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Flame,
  Wind,
  ShieldCheck,
  Zap,
  Gauge,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Download,
} from 'lucide-react';
import { playTone, playAuditChime, playWarningTone } from './AudioSynthesizer';

export interface EntropyThermalDataPoint {
  time: string;
  entropyLevel: number; // Atmospheric Entropy Rate (bits/s or KBps)
  thermalVariance: number; // CPU Thermal Variance (ΔT from 40.0°C base in °C)
  chaoticStability: number; // Chaotic Stability Index % (95% - 100%)
  lyapunovExponent: number; // Negative = dissipative stable attractor (<0)
  cpuTempActual: number; // Real-time CPU Temp °C
}

const GENERATE_INITIAL_SERIES = (): EntropyThermalDataPoint[] => {
  const points: EntropyThermalDataPoint[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 1000);
    const timeStr = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const cycle = Math.sin((i / 24) * Math.PI * 2);
    const noise1 = (Math.random() - 0.5) * 0.4;
    const noise2 = (Math.random() - 0.5) * 0.3;

    // Atmospheric entropy level (scaled 10.0 to 14.5 KBps for visual balance)
    const entropyLevel = +(11.8 + cycle * 0.8 + noise1).toFixed(2);
    // Real-time CPU thermal variance around nominal 41.2°C (1.1°C to 3.8°C variance)
    const thermalVariance = +(2.1 + Math.abs(Math.cos(i * 0.4)) * 0.9 + noise2).toFixed(2);
    // Chaotic stability index
    const chaoticStability = +(99.3 + Math.sin(i * 0.3) * 0.4 - thermalVariance * 0.05).toFixed(2);
    const lyapunovExponent = +(-0.042 + (thermalVariance / 20) * 0.01 + noise1 * 0.005).toFixed(4);
    const cpuTempActual = +(40.0 + thermalVariance).toFixed(1);

    points.push({
      time: timeStr,
      entropyLevel,
      thermalVariance,
      chaoticStability,
      lyapunovExponent,
      cpuTempActual,
    });
  }
  return points;
};

interface AtmosphericEntropyThermalAreaChartProps {
  onTriggerAlert?: (msg: string) => void;
}

export const AtmosphericEntropyThermalAreaChart: React.FC<AtmosphericEntropyThermalAreaChartProps> = ({
  onTriggerAlert,
}) => {
  const [data, setData] = useState<EntropyThermalDataPoint[]>(GENERATE_INITIAL_SERIES);
  const [timeHorizon, setTimeHorizon] = useState<'15m' | '60m' | '24h'>('60m');
  const [activeSeries, setActiveSeries] = useState<'all' | 'entropy' | 'thermal' | 'stability'>('all');
  const [isSurgeActive, setIsSurgeActive] = useState<boolean>(false);

  // Live real-time tick appending every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        let targetThermalVariance = 2.1 + (Math.random() - 0.5) * 0.8;
        let targetEntropy = 11.9 + (Math.random() - 0.5) * 0.9;

        if (isSurgeActive) {
          targetThermalVariance += 3.4; // Thermal surge
          targetEntropy += 2.8; // Atmospheric entropy pulse
        }

        const thermalVariance = +Math.max(0.5, targetThermalVariance).toFixed(2);
        const entropyLevel = +Math.max(8.0, targetEntropy).toFixed(2);
        const chaoticStability = +Math.min(99.98, Math.max(92.0, 99.4 - (thermalVariance > 4.5 ? 4.2 : 0) + (Math.random() - 0.5) * 0.2)).toFixed(2);
        const lyapunovExponent = +(-0.042 + (thermalVariance > 4.5 ? 0.025 : 0) + (Math.random() - 0.5) * 0.004).toFixed(4);
        const cpuTempActual = +(40.0 + thermalVariance).toFixed(1);

        const newPoint: EntropyThermalDataPoint = {
          time: timeStr,
          entropyLevel,
          thermalVariance,
          chaoticStability,
          lyapunovExponent,
          cpuTempActual,
        };

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSurgeActive]);

  const latestPoint = data[data.length - 1] || data[0];

  // Chaotic Stability Classification
  const isChaoticStable = latestPoint.lyapunovExponent < 0 && latestPoint.chaoticStability >= 98.0;
  const isBorderline = latestPoint.lyapunovExponent >= -0.01 || (latestPoint.chaoticStability < 98.0 && latestPoint.chaoticStability >= 95.0);
  const isDivergent = latestPoint.lyapunovExponent > 0 || latestPoint.chaoticStability < 95.0;

  const handleSimulateThermalSurge = () => {
    setIsSurgeActive(true);
    playWarningTone();
    if (onTriggerAlert) {
      onTriggerAlert('Thermal Surge Injected: CPU ΔT +3.4°C / Atmospheric Entropy Surge +2.8 KBps');
    }
    setTimeout(() => {
      setIsSurgeActive(false);
      playAuditChime();
    }, 8000);
  };

  const exportChartDataCsv = () => {
    const headers = ['Time', 'Atmospheric_Entropy_KBps', 'CPU_Thermal_Variance_DegC', 'CPU_Actual_Temp_DegC', 'Chaotic_Stability_Pct', 'Lyapunov_Exponent'];
    const rows = data.map((d) => [
      d.time,
      d.entropyLevel,
      d.thermalVariance,
      d.cpuTempActual,
      d.chaoticStability,
      d.lyapunovExponent,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zyrquen-atmospheric-entropy-thermal-variance-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playAuditChime();
  };

  return (
    <div
      id="atmospheric-entropy-thermal-areachart-card"
      className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1424]/90 via-[#070b14]/85 to-[#04060b] border border-cyan-500/25 backdrop-blur-xl space-y-5 shadow-2xl relative overflow-hidden"
    >
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-rose-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Activity className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
                ATMOSPHERIC ENTROPY vs. CPU THERMAL VARIANCE
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${
                isDivergent
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : isBorderline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isDivergent ? 'bg-rose-400 animate-ping' : isBorderline ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {isDivergent ? 'CHAOTIC INSTABILITY DIVERGENCE' : isBorderline ? 'METASTABLE OSCILLATION' : 'CHAOTIC STABILITY NOMINAL (ATTRACTOR BOUND)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Dual-layer AreaChart overlaying environmental microstate entropy against processor thermal jitter ($\Delta T$)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          {/* Series filter */}
          <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1">
            {[
              { id: 'all', label: 'Overlay' },
              { id: 'entropy', label: 'Entropy (Atm)', color: 'text-cyan-400' },
              { id: 'thermal', label: 'Thermal (ΔT)', color: 'text-rose-400' },
              { id: 'stability', label: 'Stability (%)', color: 'text-violet-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playTone(600, 0.04);
                  setActiveSeries(tab.id as any);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeSeries === tab.id
                    ? 'bg-white/15 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className={tab.color}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Simulate Thermal / Entropy Surge */}
          <button
            onClick={handleSimulateThermalSurge}
            disabled={isSurgeActive}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all font-bold ${
              isSurgeActive
                ? 'bg-rose-500/30 text-rose-200 border-rose-500/50 animate-pulse'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
            }`}
            title="Inject simulated thermal & microstate disturbance pulse"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>{isSurgeActive ? 'SURGE ACTIVE...' : 'TEST SURGE'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportChartDataCsv}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition-all"
            title="Export AreaChart telemetry as CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Real-time Forensic Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            Atmospheric Entropy Rate
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-cyan-300">{latestPoint.entropyLevel}</span>
            <span className="text-[10px] text-zinc-500">KBps (Ambient)</span>
          </div>
          <span className="text-[9px] text-cyan-400/80 mt-0.5">TRNG Shannon: 7.994 bits/byte</span>
        </div>

        <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            CPU Thermal Variance (ΔT)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-rose-300">+{latestPoint.thermalVariance}°C</span>
            <span className="text-[10px] text-zinc-500">({latestPoint.cpuTempActual}°C Actual)</span>
          </div>
          <span className="text-[9px] text-rose-400/80 mt-0.5">Ceiling: 55.0°C • Δ0 Invariant</span>
        </div>

        <div className="p-3 rounded-2xl bg-violet-950/20 border border-violet-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-violet-400" />
            Chaotic Stability Score
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-violet-300">{latestPoint.chaoticStability}%</span>
            <span className="text-[10px] text-zinc-500">Dissipative</span>
          </div>
          <span className="text-[9px] text-violet-400/80 mt-0.5">Attractor Limit: &gt;95.0%</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Lyapunov Exponent (&lambda;)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-emerald-300">{latestPoint.lyapunovExponent}</span>
            <span className="text-[10px] text-zinc-500">&lt; 0 (Stable)</span>
          </div>
          <span className="text-[9px] text-emerald-400/80 mt-0.5">Exponential Convergence Bound</span>
        </div>
      </div>

      {/* Main Recharts AreaChart Overlay */}
      <div className="h-72 w-full pt-2 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              {/* Atmospheric Entropy Gradient */}
              <linearGradient id="entropyAtmosphereGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>

              {/* CPU Thermal Variance Gradient */}
              <linearGradient id="cpuThermalVarianceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>

              {/* Chaotic Stability Gradient */}
              <linearGradient id="chaoticStabilityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#52525b"
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#27272a' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#52525b"
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#27272a' }}
              domain={[0, 20]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#52525b"
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#27272a' }}
              domain={[90, 100]}
              hide={activeSeries === 'entropy' || activeSeries === 'thermal'}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as EntropyThermalDataPoint;
                  return (
                    <div className="p-3.5 rounded-2xl bg-[#090d16]/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl font-mono text-xs space-y-2 min-w-[240px]">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-[11px]">
                        <span className="text-zinc-400 font-bold">TIMESTEP: {label}</span>
                        <span className="text-cyan-300 font-bold">CHAOTIC OBSERVER</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-cyan-300">
                          <span>Atmospheric Entropy:</span>
                          <span className="font-bold">{pt.entropyLevel} KBps</span>
                        </div>
                        <div className="flex items-center justify-between text-rose-300">
                          <span>CPU Thermal Variance (&Delta;T):</span>
                          <span className="font-bold">+{pt.thermalVariance}°C ({pt.cpuTempActual}°C)</span>
                        </div>
                        <div className="flex items-center justify-between text-violet-300">
                          <span>Chaotic Stability:</span>
                          <span className="font-bold">{pt.chaoticStability}%</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-300">
                          <span>Lyapunov Exponent (&lambda;):</span>
                          <span className="font-bold">{pt.lyapunovExponent}</span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-white/10 text-[9px] text-zinc-400 flex justify-between">
                        <span>Phase Space Attractor</span>
                        <span className="text-emerald-400 font-bold">DISSIPATIVE STABLE</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }}
            />

            {/* Reference Critical Threshold Bounds */}
            <ReferenceLine
              yAxisId="left"
              y={5.5}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{ value: 'Thermal Warning Bound (5.5°C ΔT)', fill: '#f43f5e', fontSize: 9, position: 'top' }}
            />
            <ReferenceLine
              yAxisId="left"
              y={16.0}
              stroke="#06b6d4"
              strokeDasharray="4 4"
              label={{ value: 'Atmospheric Critical Threshold (16 KBps)', fill: '#06b6d4', fontSize: 9, position: 'top' }}
            />

            {/* Primary Overlaid Area Series */}
            {(activeSeries === 'all' || activeSeries === 'entropy') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="entropyLevel"
                name="Atmospheric Entropy (KBps)"
                stroke="#06B6D4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#entropyAtmosphereGrad)"
              />
            )}

            {(activeSeries === 'all' || activeSeries === 'thermal') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="thermalVariance"
                name="CPU Thermal Variance ΔT (°C)"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cpuThermalVarianceGrad)"
              />
            )}

            {(activeSeries === 'all' || activeSeries === 'stability') && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="chaoticStability"
                name="Chaotic Stability Index (%)"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeDasharray="2 2"
                fillOpacity={1}
                fill="url(#chaoticStabilityGrad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chaotic Stability Equilibrium Footer Banner */}
      <div className="p-3 rounded-2xl bg-black/40 border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Chaotic Stability Matrix:</span>
          <span className="text-zinc-200">
            System dissipative damping coefficient <strong className="text-cyan-300">&gamma; = 0.941</strong> keeps processor temperature and atmospheric microstates bound within the strange attractor.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300 font-bold text-[11px]">PHASE-SPACE EQUILIBRIUM INTACT</span>
        </div>
      </div>
    </div>
  );
};
