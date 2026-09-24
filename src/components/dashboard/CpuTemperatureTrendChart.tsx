import React, { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Cpu,
  Thermometer,
  Activity,
  Zap,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Flame,
  Snowflake,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { HardwareSnapshot } from '../../types';
import { INITIAL_HARDWARE_SNAPSHOTS } from '../../utils/telemetrySnapshot';
import { playTone } from '../AudioSynthesizer';

export interface CpuTemperatureTrendChartProps {
  snapshots?: HardwareSnapshot[];
  className?: string;
  onNavigateToLedger?: () => void;
}

export type TrendViewMode = 'dual' | 'cores' | 'thermal';

interface DerivedChartPoint {
  index: number;
  snapshotId: string;
  snapshotNumber: number;
  timeLabel: string;
  fullTime: string;
  cpuAverage: number;
  core0: number;
  core1: number;
  core2: number;
  core3: number;
  packageTempC: number;
  cryoTempMk: number;
  heliumFlowPct: number;
  voltageStabilityPct: number;
  status: 'OPTIMAL' | 'NOMINAL' | 'WARNING';
}

/**
 * Builds smooth historical snapshot data if only 1-2 baseline snapshots exist,
 * otherwise faithfully maps the real snapshot chain.
 */
export function deriveChartPoints(snapshots: HardwareSnapshot[]): DerivedChartPoint[] {
  const source = snapshots && snapshots.length > 0 ? snapshots : INITIAL_HARDWARE_SNAPSHOTS;
  
  // If we have 4 or more real snapshots, map them directly
  if (source.length >= 4) {
    return source.map((snap, idx) => {
      const c0 = snap.cpuCores?.[0] ?? snap.cpuAverage;
      const c1 = snap.cpuCores?.[1] ?? +(snap.cpuAverage * 0.96).toFixed(1);
      const c2 = snap.cpuCores?.[2] ?? +(snap.cpuAverage * 1.05).toFixed(1);
      const c3 = snap.cpuCores?.[3] ?? +(snap.cpuAverage * 0.92).toFixed(1);
      const avg = snap.cpuAverage;
      const pkgTemp = +(36.2 + (avg / 100) * 14.8).toFixed(1);
      const cryo = snap.cryoTempMk ?? 14.98;

      let timeStr = snap.timestampIct || snap.timestampUtc || `SNAP #${snap.snapshotNumber}`;
      if (timeStr.includes(':')) {
        const match = timeStr.match(/\d{2}:\d{2}:\d{2}/);
        if (match) timeStr = match[0];
      }

      return {
        index: idx + 1,
        snapshotId: snap.id,
        snapshotNumber: snap.snapshotNumber,
        timeLabel: `#${snap.snapshotNumber}`,
        fullTime: snap.timestampIct || snap.timestampUtc,
        cpuAverage: avg,
        core0: c0,
        core1: c1,
        core2: c2,
        core3: c3,
        packageTempC: pkgTemp,
        cryoTempMk: cryo,
        heliumFlowPct: snap.heliumFlowPct ?? 74.2,
        voltageStabilityPct: snap.voltageStabilityPct ?? 99.98,
        status: avg > 75 || pkgTemp > 70 ? 'WARNING' : avg > 55 ? 'NOMINAL' : 'OPTIMAL',
      };
    });
  }

  // Anchor to baseline and produce a 12-point deterministic timeline leading to current state
  const base = source[0] || INITIAL_HARDWARE_SNAPSHOTS[0];
  const now = Date.now();
  const points: DerivedChartPoint[] = [];
  const pointCount = 12;

  for (let i = pointCount - 1; i >= 0; i--) {
    const timeOffsetMs = i * 45 * 1000;
    const pointDate = new Date(now - timeOffsetMs);
    const timeLabel = pointDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const harmonic = Math.sin((pointCount - i) * 0.55);
    const harmonic2 = Math.cos((pointCount - i) * 0.42);

    const c0 = +(base.cpuCores?.[0] ?? 42.1 + harmonic * 3.8).toFixed(1);
    const c1 = +(base.cpuCores?.[1] ?? 39.8 + harmonic2 * 4.2).toFixed(1);
    const c2 = +(base.cpuCores?.[2] ?? 44.5 + harmonic * -2.9).toFixed(1);
    const c3 = +(base.cpuCores?.[3] ?? 38.6 + harmonic2 * -3.1).toFixed(1);
    const avg = +((c0 + c1 + c2 + c3) / 4).toFixed(1);

    // Package Temp: baseline ~38.4°C + dynamic load response
    const pkgTemp = +(37.0 + (avg / 100) * 13.5 + Math.sin(i) * 0.4).toFixed(1);
    
    // Cryo Temp in mK: sub-Kelvin oscillator around 14.98 mK
    const cryo = +(14.98 + (harmonic * 0.04)).toFixed(2);

    const snapNum = base.snapshotNumber + (pointCount - 1 - i);

    points.push({
      index: pointCount - i,
      snapshotId: `SNAP-849202-${String(snapNum).padStart(3, '0')}`,
      snapshotNumber: snapNum,
      timeLabel: timeLabel,
      fullTime: `${pointDate.toISOString().slice(0, 10)} ${timeLabel} ICT`,
      cpuAverage: avg,
      core0: c0,
      core1: c1,
      core2: c2,
      core3: c3,
      packageTempC: pkgTemp,
      cryoTempMk: cryo,
      heliumFlowPct: +(74.2 + harmonic * 0.5).toFixed(1),
      voltageStabilityPct: +(99.98 + harmonic2 * 0.01).toFixed(2),
      status: avg > 75 ? 'WARNING' : avg > 50 ? 'NOMINAL' : 'OPTIMAL',
    });
  }

  return points;
}

export const CpuTemperatureTrendChart: React.FC<CpuTemperatureTrendChartProps> = ({
  snapshots = [],
  className = '',
  onNavigateToLedger,
}) => {
  const [viewMode, setViewMode] = useState<TrendViewMode>('cores');
  const [rangeFilter, setRangeFilter] = useState<'10' | '20' | 'ALL'>('ALL');
  const [visibleCores, setVisibleCores] = useState<{ [key: string]: boolean }>({
    core0: true,
    core1: true,
    core2: true,
    core3: true,
    packageTemp: true,
    cryoTemp: true,
  });
  const [isStackedCores, setIsStackedCores] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const rawData = useMemo(() => deriveChartPoints(snapshots), [snapshots]);

  const filteredData = useMemo(() => {
    if (rangeFilter === '10') {
      return rawData.slice(-10);
    }
    if (rangeFilter === '20') {
      return rawData.slice(-20);
    }
    return rawData;
  }, [rawData, rangeFilter]);

  // Latest telemetry point metrics
  const latest = useMemo(() => {
    return filteredData[filteredData.length - 1] || rawData[0];
  }, [filteredData, rawData]);

  // Calculations for KPI cards
  const peakCoreUsage = useMemo(() => {
    if (!latest) return { core: 'Core 0', val: 0 };
    const cores = [
      { core: 'Core 0', val: latest.core0 },
      { core: 'Core 1', val: latest.core1 },
      { core: 'Core 2', val: latest.core2 },
      { core: 'Core 3', val: latest.core3 },
    ];
    cores.sort((a, b) => b.val - a.val);
    return cores[0];
  }, [latest]);

  const handleRefresh = useCallback(() => {
    playTone(880, 0.04);
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      playTone(1050, 0.03);
    }, 450);
  }, []);

  const toggleCore = (key: string) => {
    playTone(620, 0.02);
    setVisibleCores((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportJson = useCallback(() => {
    playTone(740, 0.04);
    const exportBlob = {
      title: 'ZYRQUEN Ω∞ CPU & Temperature Telemetry Snapshots',
      exportedAt: new Date().toISOString(),
      baselineBlock: 849202,
      merkleRoot: '0x909ab814e5bbcd71cf57b98a002166e4a2e5d5904ff8d80c3b03651b14a90a2f',
      drift: '0.00% (Δ0 Invariant)',
      dataPointsCount: filteredData.length,
      snapshots: filteredData,
    };

    const blob = new Blob([JSON.stringify(exportBlob, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-cpu-temp-trend-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  }, [filteredData]);

  // Custom HUD Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DerivedChartPoint = payload[0]?.payload;
      return (
        <div className="p-3 bg-[#0a0f1e]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl font-mono text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {dataPoint.snapshotId}
            </span>
            <span className="text-[10px] text-zinc-400">{dataPoint.timeLabel}</span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-400">CPU Average:</span>
              <span className="font-bold text-cyan-300">{dataPoint.cpuAverage}%</span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] pt-1 border-t border-white/5">
              <div className="text-cyan-200">C0: <span className="font-semibold">{dataPoint.core0}%</span></div>
              <div className="text-teal-200">C1: <span className="font-semibold">{dataPoint.core1}%</span></div>
              <div className="text-emerald-200">C2: <span className="font-semibold">{dataPoint.core2}%</span></div>
              <div className="text-indigo-200">C3: <span className="font-semibold">{dataPoint.core3}%</span></div>
            </div>

            <div className="flex justify-between items-center text-amber-300 pt-1 border-t border-white/5">
              <span className="text-zinc-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Package Temp:
              </span>
              <span className="font-bold">{dataPoint.packageTempC}°C</span>
            </div>

            <div className="flex justify-between items-center text-violet-300">
              <span className="text-zinc-400 flex items-center gap-1">
                <Snowflake className="w-3 h-3 text-violet-400" /> Cryo Bus:
              </span>
              <span className="font-bold">{dataPoint.cryoTempMk} mK</span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-0.5">
              <span>Helium Flow: {dataPoint.heliumFlowPct}%</span>
              <span>VRM: {dataPoint.voltageStabilityPct}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 shadow-2xl relative overflow-hidden font-mono space-y-4 ${className}`}
    >
      {/* Background Cybernetic Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/5 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>CPU Core Load & Thermal Dynamics</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                RECHARTS TELEMETRY
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Δ0.00% Drift
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Derived from Genesis Block #849202 hardware snapshots • Sub-Kelvin cryogenic bus & multi-core telemetry
            </p>
          </div>
        </div>

        {/* Action Buttons & Segmented View Controller */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                playTone(660, 0.03);
                setViewMode('dual');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'dual'
                  ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Dual Axis
            </button>
            <button
              type="button"
              onClick={() => {
                playTone(680, 0.03);
                setViewMode('cores');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cores'
                  ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              4-Core AreaChart
            </button>
            <button
              type="button"
              onClick={() => {
                playTone(700, 0.03);
                setViewMode('thermal');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'thermal'
                  ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Thermal &amp; Cryo
            </button>
          </div>

          {/* Stacking Toggle when in 4-Core AreaChart mode */}
          {viewMode === 'cores' && (
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  playTone(640, 0.02);
                  setIsStackedCores(false);
                }}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  !isStackedCores
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Overlay
              </button>
              <button
                type="button"
                onClick={() => {
                  playTone(680, 0.02);
                  setIsStackedCores(true);
                }}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  isStackedCores
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Stacked
              </button>
            </div>
          )}

          {/* Range Filter */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
            {(['10', '20', 'ALL'] as const).map((rng) => (
              <button
                key={rng}
                type="button"
                onClick={() => {
                  playTone(620, 0.02);
                  setRangeFilter(rng);
                }}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  rangeFilter === rng
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Export Telemetry Snapshots as JSON"
          >
            <Download className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Live Refresh Trigger */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
            title="Refresh snapshot telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Real-Time Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Average CPU */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              CPU Avg Load
            </span>
            <span className="text-emerald-400 text-[10px]">Nominal</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white flex items-baseline gap-1">
            <span>{latest?.cpuAverage ?? 41.2}%</span>
            <span className="text-[10px] text-zinc-500 font-normal">SLA &lt; 80%</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, latest?.cpuAverage ?? 40)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Peak Core Load */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              Peak Core ({peakCoreUsage.core})
            </span>
            <span className="text-cyan-400 text-[10px]">Balanced</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white flex items-baseline gap-1">
            <span>{peakCoreUsage.val}%</span>
            <span className="text-[10px] text-zinc-500 font-normal">Delta: ±3.4%</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, peakCoreUsage.val)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Package Temperature */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Package Temp
            </span>
            <span className="text-amber-400 text-[10px]">Cool</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-300 flex items-baseline gap-1">
            <span>{latest?.packageTempC ?? 41.8}°C</span>
            <span className="text-[10px] text-zinc-500 font-normal">Limit 85°C</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((latest?.packageTempC ?? 40) / 85) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Cryo Bus Temperature */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5 text-violet-400" />
              Cryostat Bus
            </span>
            <span className="text-violet-400 text-[10px]">Sub-Kelvin</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-violet-300 flex items-baseline gap-1">
            <span>{latest?.cryoTempMk ?? 14.98} mK</span>
            <span className="text-[10px] text-zinc-500 font-normal">He-4 {latest?.heliumFlowPct ?? 74.2}%</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((latest?.cryoTempMk ?? 15) / 25) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-[280px] sm:h-[320px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="core0Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="core1Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="core2Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="core3Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="cryoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />

            <XAxis
              dataKey="timeLabel"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#ffffff15' }}
            />

            {/* Left Y-Axis: CPU Load (%) */}
            <YAxis
              yAxisId="cpu"
              domain={viewMode === 'cores' && isStackedCores ? [0, 400] : [0, 100]}
              stroke="#06b6d4"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#06b6d440' }}
              tickFormatter={(v) => `${v}%`}
            />

            {/* Right Y-Axis: Cryogenic Temp (mK) for 'cores' view, or Package Temp (°C) for dual/thermal */}
            {viewMode === 'cores' ? (
              <YAxis
                yAxisId="cryo"
                orientation="right"
                domain={['dataMin - 0.2', 'dataMax + 0.2']}
                stroke="#c084fc"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#c084fc40' }}
                tickFormatter={(v) => `${Number(v).toFixed(2)} mK`}
              />
            ) : (
              <YAxis
                yAxisId="temp"
                orientation="right"
                domain={[20, 90]}
                stroke="#f59e0b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#f59e0b40' }}
                tickFormatter={(v) => `${v}°C`}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Line for CPU Load Threshold */}
            <ReferenceLine
              yAxisId="cpu"
              y={viewMode === 'cores' && isStackedCores ? 320 : 80}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: viewMode === 'cores' && isStackedCores ? 'SLA Combined (320%)' : 'SLA Limit (80%)',
                fill: '#ef4444',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />

            {/* Reference Line for 85°C Thermal Safety Threshold */}
            {viewMode !== 'cores' && (
              <ReferenceLine
                yAxisId="temp"
                y={85}
                stroke="#f97316"
                strokeDasharray="4 4"
                label={{
                  value: 'Trip Point (85°C)',
                  fill: '#f97316',
                  fontSize: 9,
                  position: 'insideBottomRight',
                }}
              />
            )}

            {/* Cryogenic Reference Line in cores mode */}
            {viewMode === 'cores' && visibleCores.cryoTemp && (
              <ReferenceLine
                yAxisId="cryo"
                y={14.98}
                stroke="#c084fc"
                strokeDasharray="3 3"
                label={{
                  value: 'Cryo Baseline (14.98 mK)',
                  fill: '#c084fc',
                  fontSize: 9,
                  position: 'insideBottomRight',
                }}
              />
            )}

            {/* MODE 1: DUAL AXIS (CPU Average Area + Package Temp Line + Cryo Trend) */}
            {viewMode === 'dual' && (
              <>
                <Area
                  yAxisId="cpu"
                  type="monotone"
                  dataKey="cpuAverage"
                  name="CPU Average (%)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#cpuGradient)"
                  dot={{ r: 3, fill: '#06b6d4', stroke: '#0a0f1e', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
                />
                {visibleCores.packageTemp && (
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="packageTempC"
                    name="Package Temp (°C)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f59e0b', stroke: '#0a0f1e', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
              </>
            )}

            {/* MODE 2: 4-CORE RECHARTS AREACHART (Core 0, Core 1, Core 2, Core 3 Area Trends) */}
            {viewMode === 'cores' && (
              <>
                {visibleCores.core0 && (
                  <Area
                    yAxisId="cpu"
                    type="monotone"
                    dataKey="core0"
                    name="Core 0 (%)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#core0Gradient)"
                    stackId={isStackedCores ? 'cores' : undefined}
                    dot={{ r: 2.5, fill: '#06b6d4' }}
                    activeDot={{ r: 4.5, fill: '#22d3ee', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                )}
                {visibleCores.core1 && (
                  <Area
                    yAxisId="cpu"
                    type="monotone"
                    dataKey="core1"
                    name="Core 1 (%)"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fill="url(#core1Gradient)"
                    stackId={isStackedCores ? 'cores' : undefined}
                    dot={{ r: 2.5, fill: '#14b8a6' }}
                    activeDot={{ r: 4.5, fill: '#2dd4bf', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                )}
                {visibleCores.core2 && (
                  <Area
                    yAxisId="cpu"
                    type="monotone"
                    dataKey="core2"
                    name="Core 2 (%)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#core2Gradient)"
                    stackId={isStackedCores ? 'cores' : undefined}
                    dot={{ r: 2.5, fill: '#10b981' }}
                    activeDot={{ r: 4.5, fill: '#34d399', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                )}
                {visibleCores.core3 && (
                  <Area
                    yAxisId="cpu"
                    type="monotone"
                    dataKey="core3"
                    name="Core 3 (%)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#core3Gradient)"
                    stackId={isStackedCores ? 'cores' : undefined}
                    dot={{ r: 2.5, fill: '#6366f1' }}
                    activeDot={{ r: 4.5, fill: '#818cf8', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                )}

                {/* Secondary Line Series: Cryogenic Temperature Trend (mK) */}
                {visibleCores.cryoTemp && (
                  <Line
                    yAxisId="cryo"
                    type="monotone"
                    dataKey="cryoTempMk"
                    name="Cryo Temp (mK)"
                    stroke="#c084fc"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                    dot={{ r: 3, fill: '#a855f7', stroke: '#0a0f1e', strokeWidth: 1.5 }}
                    activeDot={{ r: 5.5, fill: '#f3e8ff', stroke: '#9333ea', strokeWidth: 2 }}
                  />
                )}
              </>
            )}

            {/* MODE 3: THERMAL & CRYO (Silicon Package °C + Helium Flow % + Cryo mK) */}
            {viewMode === 'thermal' && (
              <>
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="packageTempC"
                  name="Silicon Package (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#tempGradient)"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
                <Line
                  yAxisId="cpu"
                  type="monotone"
                  dataKey="heliumFlowPct"
                  name="Helium-4 Flow (%)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 2.5, fill: '#8b5cf6' }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Legend & Core Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-zinc-500 text-[11px] flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" /> Filters:
          </span>

          {viewMode === 'cores' && (
            <>
              <button
                type="button"
                onClick={() => toggleCore('core0')}
                className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  visibleCores.core0
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                    : 'bg-white/5 border-transparent text-zinc-600 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Core 0
              </button>
              <button
                type="button"
                onClick={() => toggleCore('core1')}
                className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  visibleCores.core1
                    ? 'bg-teal-950/60 border-teal-500/50 text-teal-300'
                    : 'bg-white/5 border-transparent text-zinc-600 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Core 1
              </button>
              <button
                type="button"
                onClick={() => toggleCore('core2')}
                className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  visibleCores.core2
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-transparent text-zinc-600 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Core 2
              </button>
              <button
                type="button"
                onClick={() => toggleCore('core3')}
                className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  visibleCores.core3
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/5 border-transparent text-zinc-600 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Core 3
              </button>
              <button
                type="button"
                onClick={() => toggleCore('cryoTemp')}
                className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  visibleCores.cryoTemp
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-transparent text-zinc-600 line-through'
                }`}
                title="Toggle Cryo Temperature Trend (mK) Secondary Series"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                Cryo Temp (mK) [Secondary Line]
              </button>
            </>
          )}

          {viewMode === 'dual' && (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>CPU Load (Left Axis)</span>
              </div>
              <button
                type="button"
                onClick={() => toggleCore('packageTemp')}
                className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  visibleCores.packageTemp
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-white/5 border-transparent text-zinc-600 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Package Temp (Right Axis)
              </button>
            </>
          )}

          {viewMode === 'thermal' && (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Package Temp (°C)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-violet-300">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span>Helium-4 Flow (%)</span>
              </div>
            </>
          )}
        </div>

        {/* Action Link to Full Evidence Ledger */}
        <div className="flex items-center gap-2">
          {copiedNotification && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Exported JSON
            </span>
          )}
          {onNavigateToLedger && (
            <button
              type="button"
              onClick={() => {
                playTone(600, 0.04);
                onNavigateToLedger();
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-200 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect All {filteredData.length} Snapshots in Ledger</span>
              <TrendingUp className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CpuTemperatureTrendChart;
