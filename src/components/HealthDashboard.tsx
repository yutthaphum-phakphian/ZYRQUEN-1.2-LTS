// src/components/HealthDashboard.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Cpu,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Server,
  RefreshCw,
  BellRing,
  RotateCcw,
} from 'lucide-react';
import { HardwareSnapshot } from '../types';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface SnapshotData {
  timestamp: string;
  cpuUsage: number;        // %
  memoryUsage: number;     // %
  hsmAvailability: number; // % (100 = 10/10 nodes)
  hsmActiveNodes: number;  // 0 - 10
  cryostatTemp: number;    // K
  observedAt?: number;     // epoch ms
}

interface HealthDashboardProps {
  snapshots?: (SnapshotData | HardwareSnapshot)[];
  title?: string;
  className?: string;
  onNavigateToQuarantine?: () => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  snapshots = [],
  title = 'System Health Dashboard',
  className = '',
  onNavigateToQuarantine,
}) => {
  // View mode: Live Telemetry vs 24-Hour Trend
  const [timeRange, setTimeRange] = useState<'live' | '24h'>('live');

  // Simulation state for testing the 5-minute >90% sustained threshold
  const [simulatedHighCpu, setSimulatedHighCpu] = useState<boolean>(false);
  const [simulatedHighMemory, setSimulatedHighMemory] = useState<boolean>(false);
  const [simulatedMinutesOverThreshold, setSimulatedMinutesOverThreshold] = useState<number>(0);

  // Track sustained duration (>90%)
  const [cpuHighStartTime, setCpuHighStartTime] = useState<number | null>(null);
  const [memoryHighStartTime, setMemoryHighStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Interval timer for real-time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 24-Hour Mock Baseline Generator (24 hourly points)
  const twentyFourHourPoints: SnapshotData[] = useMemo(() => {
    const points: SnapshotData[] = [];
    const baseHour = new Date().getHours();
    for (let i = 23; i >= 0; i--) {
      const h = (baseHour - i + 24) % 24;
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      const wave = Math.sin((23 - i) * 0.4);
      points.push({
        timestamp: hourStr,
        cpuUsage: Number((42 + wave * 8).toFixed(1)),
        memoryUsage: Number((58 + wave * 6).toFixed(1)),
        hsmAvailability: 100,
        hsmActiveNodes: 10,
        cryostatTemp: 0.015,
        observedAt: Date.now() - i * 3600 * 1000,
      });
    }
    return points;
  }, []);

  // Normalize snapshots into SnapshotData[]
  const rawChartData: SnapshotData[] = useMemo(() => {
    if (timeRange === '24h') {
      return twentyFourHourPoints;
    }

    if (!snapshots || snapshots.length === 0) {
      return [
        { timestamp: '00:00:00', cpuUsage: 42.5, memoryUsage: 48, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.015 },
        { timestamp: '00:00:02', cpuUsage: 45.1, memoryUsage: 50, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.015 },
        { timestamp: '00:00:04', cpuUsage: 39.8, memoryUsage: 49, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.014 },
        { timestamp: '00:00:06', cpuUsage: 48.2, memoryUsage: 52, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.016 },
        { timestamp: '00:00:08', cpuUsage: 41.0, memoryUsage: 48, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.015 },
      ];
    }

    const mapped: SnapshotData[] = snapshots.slice(-24).map((s: any, idx) => {
      let ts = s.timestamp;
      if (!ts) {
        if (s.timestampIct) {
          const parts = s.timestampIct.split(' ');
          ts = parts[1] || parts[0];
        } else if (s.timestampUtc) {
          ts = s.timestampUtc.slice(11, 19);
        } else {
          ts = `T-${idx}`;
        }
      }

      // CPU usage
      let cpu = typeof s.cpuUsage === 'number' ? s.cpuUsage : s.cpuAverage;
      if (typeof cpu !== 'number' && Array.isArray(s.cpuCores)) {
        cpu = Math.round(s.cpuCores.reduce((a: number, b: number) => a + b, 0) / s.cpuCores.length);
      }
      if (typeof cpu !== 'number') cpu = 42.0;

      // Memory usage
      let mem = typeof s.memoryUsage === 'number' ? s.memoryUsage : undefined;
      if (typeof mem !== 'number' && typeof s.memoryUsedMb === 'number' && typeof s.memoryTotalMb === 'number' && s.memoryTotalMb > 0) {
        mem = Math.round((s.memoryUsedMb / s.memoryTotalMb) * 100);
      }
      if (typeof mem !== 'number') mem = 54;

      // Cryostat temp
      let temp = typeof s.cryostatTemp === 'number' ? s.cryostatTemp : undefined;
      if (typeof temp !== 'number' && typeof s.cryoTempMk === 'number') {
        temp = +(s.cryoTempMk / 1000).toFixed(3);
      }
      if (typeof temp !== 'number') temp = 0.015;

      // HSM availability
      let nodes = typeof s.hsmActiveNodes === 'number' ? s.hsmActiveNodes : 10;
      let avail = typeof s.hsmAvailability === 'number' ? s.hsmAvailability : (nodes / 10) * 100;

      return {
        timestamp: ts,
        cpuUsage: Number(cpu),
        memoryUsage: Number(mem),
        hsmAvailability: Number(avail),
        hsmActiveNodes: Number(nodes),
        cryostatTemp: Number(temp),
        observedAt: s.epoch || Date.now() - (snapshots.length - idx) * 2000,
      };
    });

    if (mapped.length < 8) {
      const anchor = mapped[0] || {
        timestamp: '08:20:00',
        cpuUsage: 41.5,
        memoryUsage: 54,
        hsmAvailability: 100,
        hsmActiveNodes: 10,
        cryostatTemp: 0.015,
      };
      const padCount = 8 - mapped.length;
      const cpuOffsets = [-2.4, -1.1, 1.3, -0.8, 1.9, -1.5, 0.7];
      const memOffsets = [-2, 1, -1, 2, 0, -2, 1];
      const seedPoints: SnapshotData[] = [];
      for (let i = padCount; i >= 1; i--) {
        seedPoints.push({
          timestamp: `T-${i * 2}s`,
          cpuUsage: +(anchor.cpuUsage + cpuOffsets[i % cpuOffsets.length]).toFixed(1),
          memoryUsage: Math.max(20, Math.min(98, Math.round(anchor.memoryUsage + memOffsets[i % memOffsets.length]))),
          hsmAvailability: 100,
          hsmActiveNodes: 10,
          cryostatTemp: anchor.cryostatTemp,
          observedAt: Date.now() - i * 2000,
        });
      }
      return [...seedPoints, ...mapped];
    }

    return mapped;
  }, [snapshots, timeRange, twentyFourHourPoints]);

  // Apply simulated high load values if active
  const chartData: SnapshotData[] = useMemo(() => {
    if (!simulatedHighCpu && !simulatedHighMemory) {
      return rawChartData;
    }

    return rawChartData.map((point, index) => {
      // In simulation mode, the last 6 points exceed 90%
      const isRecent = index >= rawChartData.length - 6;
      return {
        ...point,
        cpuUsage: simulatedHighCpu && isRecent ? 94.2 + (index % 3) * 1.5 : point.cpuUsage,
        memoryUsage: simulatedHighMemory && isRecent ? 93.8 + (index % 2) * 2.1 : point.memoryUsage,
      };
    });
  }, [rawChartData, simulatedHighCpu, simulatedHighMemory]);

  const latestPoint = chartData[chartData.length - 1] || {
    cpuUsage: 0,
    memoryUsage: 0,
    hsmAvailability: 100,
    hsmActiveNodes: 10,
    cryostatTemp: 0.015,
  };

  // Monitor sustained usage > 90%
  useEffect(() => {
    const isCpuOver = latestPoint.cpuUsage > 90;
    const isMemOver = latestPoint.memoryUsage > 90;

    if (isCpuOver) {
      if (!cpuHighStartTime) {
        setCpuHighStartTime(Date.now());
      }
    } else {
      if (!simulatedHighCpu) {
        setCpuHighStartTime(null);
      }
    }

    if (isMemOver) {
      if (!memoryHighStartTime) {
        setMemoryHighStartTime(Date.now());
      }
    } else {
      if (!simulatedHighMemory) {
        setMemoryHighStartTime(null);
      }
    }
  }, [latestPoint.cpuUsage, latestPoint.memoryUsage, simulatedHighCpu, simulatedHighMemory, cpuHighStartTime, memoryHighStartTime]);

  // Calculate elapsed time over threshold (seconds)
  const cpuOverSeconds = useMemo(() => {
    if (simulatedHighCpu) {
      return Math.max(310, simulatedMinutesOverThreshold * 60); // simulated > 5 mins
    }
    if (!cpuHighStartTime) return 0;
    return Math.floor((now - cpuHighStartTime) / 1000);
  }, [simulatedHighCpu, simulatedMinutesOverThreshold, cpuHighStartTime, now]);

  const memoryOverSeconds = useMemo(() => {
    if (simulatedHighMemory) {
      return Math.max(310, simulatedMinutesOverThreshold * 60); // simulated > 5 mins
    }
    if (!memoryHighStartTime) return 0;
    return Math.floor((now - memoryHighStartTime) / 1000);
  }, [simulatedHighMemory, simulatedMinutesOverThreshold, memoryHighStartTime, now]);

  // Sustained Threshold is 5 minutes (300 seconds)
  const SUSTAINED_ALERT_THRESHOLD_SECONDS = 300;
  const isCpuSustainedCritical = cpuOverSeconds >= SUSTAINED_ALERT_THRESHOLD_SECONDS;
  const isMemorySustainedCritical = memoryOverSeconds >= SUSTAINED_ALERT_THRESHOLD_SECONDS;
  const hasCriticalAlert = isCpuSustainedCritical || isMemorySustainedCritical;

  // Warning state (exceeded 90% but under 5 minutes)
  const isCpuWarning = latestPoint.cpuUsage > 90 && !isCpuSustainedCritical;
  const isMemoryWarning = latestPoint.memoryUsage > 90 && !isMemorySustainedCritical;

  // Sound chime when entering critical alert for the first time
  const alertNotifiedRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasCriticalAlert && !alertNotifiedRef.current) {
      alertNotifiedRef.current = true;
      playTone(440, 0.2, 'sawtooth');
      // Dispatch custom toast notification
      window.dispatchEvent(
        new CustomEvent('zyrquen:toast', {
          detail: {
            message: `CRITICAL ALERT: ${isCpuSustainedCritical ? 'CPU' : 'Memory'} usage has exceeded 90% for more than 5 minutes!`,
            type: 'critical',
          },
        })
      );
    } else if (!hasCriticalAlert) {
      alertNotifiedRef.current = false;
    }
  }, [hasCriticalAlert, isCpuSustainedCritical]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSimulateHighLoad = (type: 'cpu' | 'memory') => {
    playTone(660, 0.08);
    if (type === 'cpu') {
      setSimulatedHighCpu(true);
      setSimulatedMinutesOverThreshold(5.5); // 5.5 minutes (330s)
      setCpuHighStartTime(Date.now() - 330 * 1000);
    } else {
      setSimulatedHighMemory(true);
      setSimulatedMinutesOverThreshold(5.2); // 5.2 minutes (312s)
      setMemoryHighStartTime(Date.now() - 312 * 1000);
    }
  };

  const handleResetSimulation = () => {
    playAuditChime();
    setSimulatedHighCpu(false);
    setSimulatedHighMemory(false);
    setSimulatedMinutesOverThreshold(0);
    setCpuHighStartTime(null);
    setMemoryHighStartTime(null);
  };

  return (
    <div className={`p-4 sm:p-6 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl text-white font-mono ${className}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
            hasCriticalAlert
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-400 animate-pulse'
              : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
          }`}>
            {hasCriticalAlert ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Activity className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-cyan-400 flex flex-wrap items-center gap-2">
              <span>{title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-normal border ${
                hasCriticalAlert
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              }`}>
                {hasCriticalAlert ? 'THRESHOLD BREACH (>5 MIN)' : 'LIVE TELEMETRY'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time Hardware Cores, Memory Buffer &amp; Deca-HSM Node Availability Monitoring
            </p>
          </div>
        </div>

        {/* Range Switcher + Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => {
                playTone(520, 0.03);
                setTimeRange('live');
              }}
              className={`px-3 py-1 rounded text-xs transition-all ${
                timeRange === 'live'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Stream
            </button>
            <button
              onClick={() => {
                playTone(520, 0.03);
                setTimeRange('24h');
              }}
              className={`px-3 py-1 rounded text-xs transition-all ${
                timeRange === '24h'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24-Hour Trend
            </button>
          </div>
        </div>
      </div>

      {/* CRITICAL SUSTAINED LOAD ALERT BANNER (>90% FOR >5 MINUTES) */}
      {hasCriticalAlert && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-red-950/70 to-rose-950/90 border-2 border-rose-500 text-rose-200 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-900/80 border border-rose-400 text-rose-200 shrink-0">
                <Flame className="w-5 h-5 text-rose-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white uppercase tracking-wider">
                    CRITICAL SUSTAINED OVERLOAD ALERT
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-black">
                    &gt;90% FOR &gt;5 MIN
                  </span>
                </div>
                <p className="text-xs text-rose-300 mt-1">
                  {isCpuSustainedCritical && (
                    <span>
                      CPU usage is at <strong className="text-white font-bold">{latestPoint.cpuUsage}%</strong> (Sustained for {formatDuration(cpuOverSeconds)} &gt; 5m threshold).{' '}
                    </span>
                  )}
                  {isMemorySustainedCritical && (
                    <span>
                      Memory usage is at <strong className="text-white font-bold">{latestPoint.memoryUsage}%</strong> (Sustained for {formatDuration(memoryOverSeconds)} &gt; 5m threshold).{' '}
                    </span>
                  )}
                  Auto-mitigation circuit breaker standby active.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetSimulation}
                className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 border border-rose-400/50 text-xs text-rose-200 font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear / Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELEVATED WARNING BANNER (>90% but under 5 minutes) */}
      {!hasCriticalAlert && (isCpuWarning || isMemoryWarning) && (
        <div className="mb-5 p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-xs">
              <strong>ELEVATED LOAD WARNING:</strong>{' '}
              {isCpuWarning && `CPU at ${latestPoint.cpuUsage}% (${formatDuration(cpuOverSeconds)} / 5m alert timer)`}
              {isCpuWarning && isMemoryWarning && ' • '}
              {isMemoryWarning && `RAM at ${latestPoint.memoryUsage}% (${formatDuration(memoryOverSeconds)} / 5m alert timer)`}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-500/40 font-mono">
            MONITORING THRESHOLD
          </span>
        </div>
      )}

      {/* KPI METRIC CARDS WITH COLOR-CODED THRESHOLDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* CPU Metric Card */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isCpuSustainedCritical
            ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] ring-2 ring-rose-500'
            : isCpuWarning
            ? 'bg-amber-950/60 border-amber-500/60'
            : latestPoint.cpuUsage >= 70
            ? 'bg-amber-950/40 border-amber-500/30'
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Cpu className={`w-3.5 h-3.5 ${isCpuSustainedCritical ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />
              CPU USAGE
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              isCpuSustainedCritical
                ? 'bg-rose-500 text-black animate-pulse'
                : isCpuWarning
                ? 'bg-amber-500/30 text-amber-300'
                : 'bg-emerald-950 text-emerald-400'
            }`}>
              {isCpuSustainedCritical ? '>5m ALERT' : isCpuWarning ? 'RISING' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`text-xl sm:text-2xl font-bold ${
              isCpuSustainedCritical ? 'text-rose-300' : isCpuWarning ? 'text-amber-300' : 'text-white'
            }`}>
              {latestPoint.cpuUsage}%
            </div>
            <div className="text-[10px] text-slate-400">
              {isCpuSustainedCritical ? formatDuration(cpuOverSeconds) : 'Thresh: 90%'}
            </div>
          </div>
        </div>

        {/* Memory Metric Card */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isMemorySustainedCritical
            ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] ring-2 ring-rose-500'
            : isMemoryWarning
            ? 'bg-amber-950/60 border-amber-500/60'
            : latestPoint.memoryUsage >= 70
            ? 'bg-amber-950/40 border-amber-500/30'
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <HardDrive className={`w-3.5 h-3.5 ${isMemorySustainedCritical ? 'text-blue-400 animate-bounce' : 'text-blue-400'}`} />
              RAM BUFFER
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              isMemorySustainedCritical
                ? 'bg-rose-500 text-black animate-pulse'
                : isMemoryWarning
                ? 'bg-amber-500/30 text-amber-300'
                : 'bg-emerald-950 text-emerald-400'
            }`}>
              {isMemorySustainedCritical ? '>5m ALERT' : isMemoryWarning ? 'RISING' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`text-xl sm:text-2xl font-bold ${
              isMemorySustainedCritical ? 'text-rose-300' : isMemoryWarning ? 'text-amber-300' : 'text-white'
            }`}>
              {latestPoint.memoryUsage}%
            </div>
            <div className="text-[10px] text-slate-400">
              {isMemorySustainedCritical ? formatDuration(memoryOverSeconds) : 'Thresh: 90%'}
            </div>
          </div>
        </div>

        {/* HSM Availability Metric Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              HSM AVAILABILITY
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-bold">
              QUORUM
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-bold text-purple-300">
              {latestPoint.hsmAvailability}%
            </div>
            <div className="text-[10px] text-purple-400 font-semibold">
              {latestPoint.hsmActiveNodes}/10 NODES
            </div>
          </div>
        </div>

        {/* Cryostat Temp Metric Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              CRYOSTAT TEMP
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold">
              SUB-KELVIN
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-bold text-emerald-300">
              {latestPoint.cryostatTemp} K
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold">
              14.98 mK PARITY
            </div>
          </div>
        </div>
      </div>

      {/* CHART 1: CPU & MEMORY USAGE TREND (WITH 90% REFERENCE THRESHOLD LINE) */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              CPU &amp; Memory Utilization Over Time ({timeRange === '24h' ? '24-Hour Horizon' : 'Recent Telemetry Stream'})
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 font-mono">
            RED LINE = 90% SUSTAINED THRESHOLD
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full min-w-0 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070c1a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                itemStyle={{ padding: '2px 0' }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              {/* Reference line at 90% alert threshold */}
              <ReferenceLine
                y={90}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: '90% CRITICAL THRESHOLD (>5 MIN TRIGGER)',
                  fill: '#f87171',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Line
                type="monotone"
                dataKey="cpuUsage"
                name="CPU Usage (%)"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#ef4444' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="memoryUsage"
                name="Memory Usage (%)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: HSM NODE AVAILABILITY OVER TIME (COMPLEMENTARY CHART) */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              HSM Node Availability &amp; Quorum Consensus Trend
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 font-mono">
            PURPLE LINE = 10/10 HSM CONSENSUS (80% MIN QUORUM)
          </span>
        </div>

        <div className="h-48 sm:h-56 w-full min-w-0 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070c1a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                formatter={(value: any) => [`${value}% (${(Number(value) / 10).toFixed(0)}/10 Nodes)`, 'HSM Availability']}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              {/* Reference line at 80% Minimum Quorum (8/10 nodes) */}
              <ReferenceLine
                y={80}
                stroke="#a855f7"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '80% MINIMUM QUORUM (8/10 NODES REQUIRED)',
                  fill: '#c084fc',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Line
                type="stepAfter"
                dataKey="hsmAvailability"
                name="HSM Availability (%)"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#a855f7' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SIMULATION & THRESHOLD TESTING TOOLBAR */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <BellRing className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Test 90% Threshold Alert Engine:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateHighLoad('cpu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              simulatedHighCpu
                ? 'bg-rose-500 text-black shadow-md'
                : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Simulate CPU &gt;90% (5m+)</span>
          </button>

          <button
            onClick={() => handleSimulateHighLoad('memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              simulatedHighMemory
                ? 'bg-rose-500 text-black shadow-md'
                : 'bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-300'
            }`}
          >
            <HardDrive className="w-3 h-3" />
            <span>Simulate RAM &gt;90% (5m+)</span>
          </button>

          {(simulatedHighCpu || simulatedHighMemory) && (
            <button
              onClick={handleResetSimulation}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Reset Normal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
