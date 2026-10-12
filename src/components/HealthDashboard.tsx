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
import { hsmClusterService } from '../services/hsmClusterService';

export interface SnapshotData {
  timestamp: string;
  cpuUsage: number;        // %
  memoryUsage: number;     // %
  hsmAvailability: number; // % (100 = 10/10 nodes)
  hsmActiveNodes: number;  // 0 - 10
  cryostatTemp: number;    // K
  observedAt?: number | null; // epoch ms
}

export type ChartSnapshot = SnapshotData;

/**
 * Validates whether a resource metric (e.g. cpuUsage or memoryUsage)
 * has continuously stayed strictly above a threshold (default 90%)
 * for more than durationMs (default 5 minutes), with no telemetry gap longer than 2 minutes.
 */
export function isMetricSustainedAboveThreshold(
  samples: ChartSnapshot[],
  metricKey: keyof ChartSnapshot | string,
  currentTime?: number,
  threshold = 90,
  durationMs = 5 * 60_000
): boolean {
  if (!samples || samples.length === 0) return false;

  // Verify timestamps are present on all samples
  for (const s of samples) {
    if (s.observedAt == null || typeof s.observedAt !== 'number' || isNaN(s.observedAt)) {
      return false;
    }
  }

  // The latest sample must exceed the threshold
  const lastSample = samples[samples.length - 1];
  const lastVal = (lastSample as any)[metricKey];
  if (typeof lastVal !== 'number' || lastVal <= threshold) {
    return false;
  }

  const effectiveCurrentTime = currentTime ?? (lastSample.observedAt as number);

  // Telemetry must not have a stale gap longer than 2 minutes at the end
  if (effectiveCurrentTime - (lastSample.observedAt as number) > 2 * 60_000) {
    return false;
  }

  // Scan backwards to find the start of the continuous streak above threshold
  let startIndex = samples.length - 1;
  while (startIndex > 0) {
    const prev = samples[startIndex - 1];
    const curr = samples[startIndex];
    const prevVal = (prev as any)[metricKey];

    if (typeof prevVal !== 'number' || prevVal <= threshold) {
      break; // Fell to or below threshold, streak broke
    }

    // Telemetry gap longer than 2 minutes cannot be bridged
    const gap = (curr.observedAt as number) - (prev.observedAt as number);
    if (gap > 2 * 60_000 || gap < 0) {
      break;
    }

    startIndex--;
  }

  const streakStartTime = samples[startIndex].observedAt as number;
  const sustainedDuration = effectiveCurrentTime - streakStartTime;

  // Must strictly exceed durationMs (e.g. > 5 minutes)
  return sustainedDuration > durationMs;
}

/**
 * Validates whether HSM active node availability has continuously dropped
 * strictly below threshold (default 80%) for more than durationMs (default 5 minutes).
 */
export function isHsmSustainedBelowThreshold(
  samples: ChartSnapshot[],
  currentTime?: number,
  threshold = 80,
  durationMs = 5 * 60_000
): boolean {
  if (!samples || samples.length === 0) return false;

  for (const s of samples) {
    if (s.observedAt == null || typeof s.observedAt !== 'number' || isNaN(s.observedAt)) {
      return false;
    }
  }

  const lastSample = samples[samples.length - 1];
  const lastVal =
    typeof lastSample.hsmAvailability === 'number'
      ? lastSample.hsmAvailability
      : typeof lastSample.hsmActiveNodes === 'number'
      ? (lastSample.hsmActiveNodes / 10) * 100
      : 100;

  if (typeof lastVal !== 'number' || lastVal >= threshold) {
    return false;
  }

  const effectiveCurrentTime = currentTime ?? (lastSample.observedAt as number);
  if (effectiveCurrentTime - (lastSample.observedAt as number) > 2 * 60_000) {
    return false;
  }

  let startIndex = samples.length - 1;
  while (startIndex > 0) {
    const prev = samples[startIndex - 1];
    const curr = samples[startIndex];
    const prevVal =
      typeof prev.hsmAvailability === 'number'
        ? prev.hsmAvailability
        : typeof prev.hsmActiveNodes === 'number'
        ? (prev.hsmActiveNodes / 10) * 100
        : 100;

    if (typeof prevVal !== 'number' || prevVal >= threshold) {
      break;
    }

    const gap = (curr.observedAt as number) - (prev.observedAt as number);
    if (gap > 2 * 60_000 || gap < 0) {
      break;
    }

    startIndex--;
  }

  const streakStartTime = samples[startIndex].observedAt as number;
  const sustainedDuration = effectiveCurrentTime - streakStartTime;
  return sustainedDuration > durationMs;
}

interface HealthDashboardProps {
  snapshots?: (SnapshotData | HardwareSnapshot)[];
  title?: string;
  className?: string;
  onNavigateToQuarantine?: () => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  snapshots = [],
  title = 'แดชบอร์ดสถานะระบบ (System Status Dashboard)',
  className = '',
  onNavigateToQuarantine,
}) => {
  // View mode: Live Telemetry vs 24-Hour Trend
  const [timeRange, setTimeRange] = useState<'live' | '24h'>('live');

  // Simulation state for testing the 5-minute sustained threshold
  const [simulatedHighCpu, setSimulatedHighCpu] = useState<boolean>(false);
  const [simulatedHighMemory, setSimulatedHighMemory] = useState<boolean>(false);
  const [simulatedLowHsm, setSimulatedLowHsm] = useState<boolean>(false);
  const [simulatedMinutesOverThreshold, setSimulatedMinutesOverThreshold] = useState<number>(0);

  // Track sustained duration (>90% or <80% HSM)
  const [cpuHighStartTime, setCpuHighStartTime] = useState<number | null>(null);
  const [memoryHighStartTime, setMemoryHighStartTime] = useState<number | null>(null);
  const [hsmLowStartTime, setHsmLowStartTime] = useState<number | null>(null);
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
        { timestamp: '00:00:00', cpuUsage: 42.5, memoryUsage: 48, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.015, observedAt: Date.now() - 10000 },
        { timestamp: '00:00:02', cpuUsage: 45.1, memoryUsage: 50, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.015, observedAt: Date.now() - 8000 },
        { timestamp: '00:00:04', cpuUsage: 39.8, memoryUsage: 49, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.014, observedAt: Date.now() - 6000 },
        { timestamp: '00:00:06', cpuUsage: 48.2, memoryUsage: 52, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.016, observedAt: Date.now() - 4000 },
        { timestamp: '00:00:08', cpuUsage: 41.0, memoryUsage: 48, hsmAvailability: 100, hsmActiveNodes: 10, cryostatTemp: 0.015, observedAt: Date.now() - 2000 },
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
        observedAt: s.observedAt || s.epoch || (Date.now() - (snapshots.length - idx) * 2000),
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
        observedAt: Date.now() - 16000,
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

  // Apply simulated high load / degraded HSM values if active
  const chartData: SnapshotData[] = useMemo(() => {
    if (!simulatedHighCpu && !simulatedHighMemory && !simulatedLowHsm) {
      return rawChartData;
    }

    return rawChartData.map((point, index) => {
      // In simulation mode, the last 6 points reflect the simulated conditions
      const isRecent = index >= rawChartData.length - 6;
      return {
        ...point,
        cpuUsage: simulatedHighCpu && isRecent ? 94.2 + (index % 3) * 1.5 : point.cpuUsage,
        memoryUsage: simulatedHighMemory && isRecent ? 93.8 + (index % 2) * 2.1 : point.memoryUsage,
        hsmAvailability: simulatedLowHsm && isRecent ? 70 : point.hsmAvailability,
        hsmActiveNodes: simulatedLowHsm && isRecent ? 7 : point.hsmActiveNodes,
      };
    });
  }, [rawChartData, simulatedHighCpu, simulatedHighMemory, simulatedLowHsm]);

  const latestPoint = chartData[chartData.length - 1] || {
    cpuUsage: 0,
    memoryUsage: 0,
    hsmAvailability: 100,
    hsmActiveNodes: 10,
    cryostatTemp: 0.015,
  };

  // Monitor sustained usage > 90% and HSM nodes < 80%
  useEffect(() => {
    const isCpuOver = latestPoint.cpuUsage > 90;
    const isMemOver = latestPoint.memoryUsage > 90;
    const isHsmLow = latestPoint.hsmAvailability < 80;

    if (isCpuOver) {
      if (!cpuHighStartTime) setCpuHighStartTime(Date.now());
    } else {
      if (!simulatedHighCpu) setCpuHighStartTime(null);
    }

    if (isMemOver) {
      if (!memoryHighStartTime) setMemoryHighStartTime(Date.now());
    } else {
      if (!simulatedHighMemory) setMemoryHighStartTime(null);
    }

    if (isHsmLow) {
      if (!hsmLowStartTime) setHsmLowStartTime(Date.now());
    } else {
      if (!simulatedLowHsm) setHsmLowStartTime(null);
    }
  }, [
    latestPoint.cpuUsage,
    latestPoint.memoryUsage,
    latestPoint.hsmAvailability,
    simulatedHighCpu,
    simulatedHighMemory,
    simulatedLowHsm,
    cpuHighStartTime,
    memoryHighStartTime,
    hsmLowStartTime,
  ]);

  // Calculate elapsed time over threshold (seconds)
  const cpuOverSeconds = useMemo(() => {
    if (simulatedHighCpu) {
      return Math.max(310, simulatedMinutesOverThreshold * 60);
    }
    if (!cpuHighStartTime) return 0;
    return Math.floor((now - cpuHighStartTime) / 1000);
  }, [simulatedHighCpu, simulatedMinutesOverThreshold, cpuHighStartTime, now]);

  const memoryOverSeconds = useMemo(() => {
    if (simulatedHighMemory) {
      return Math.max(310, simulatedMinutesOverThreshold * 60);
    }
    if (!memoryHighStartTime) return 0;
    return Math.floor((now - memoryHighStartTime) / 1000);
  }, [simulatedHighMemory, simulatedMinutesOverThreshold, memoryHighStartTime, now]);

  const hsmUnderSeconds = useMemo(() => {
    if (simulatedLowHsm) {
      return Math.max(310, simulatedMinutesOverThreshold * 60);
    }
    if (!hsmLowStartTime) return 0;
    return Math.floor((now - hsmLowStartTime) / 1000);
  }, [simulatedLowHsm, simulatedMinutesOverThreshold, hsmLowStartTime, now]);

  // Sustained Threshold is strictly 5 minutes (300 seconds)
  const SUSTAINED_ALERT_THRESHOLD_SECONDS = 300;
  const isCpuSustainedCritical = cpuOverSeconds > SUSTAINED_ALERT_THRESHOLD_SECONDS;
  const isMemorySustainedCritical = memoryOverSeconds > SUSTAINED_ALERT_THRESHOLD_SECONDS;
  const isHsmSustainedCritical = hsmUnderSeconds > SUSTAINED_ALERT_THRESHOLD_SECONDS;
  const hasCriticalAlert = isCpuSustainedCritical || isMemorySustainedCritical || isHsmSustainedCritical;

  // Warning state (exceeded 90% or HSM < 80% but under 5 minutes)
  const isCpuWarning = latestPoint.cpuUsage > 90 && !isCpuSustainedCritical;
  const isMemoryWarning = latestPoint.memoryUsage > 90 && !isMemorySustainedCritical;
  const isHsmWarning = latestPoint.hsmAvailability < 80 && !isHsmSustainedCritical;

  // Sound chime when entering critical alert for the first time
  const alertNotifiedRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasCriticalAlert && !alertNotifiedRef.current) {
      alertNotifiedRef.current = true;
      playTone(440, 0.2, 'sawtooth');
      const cause = isCpuSustainedCritical
        ? 'CPU usage'
        : isMemorySustainedCritical
        ? 'Memory usage'
        : 'Active HSM node quorum';
      window.dispatchEvent(
        new CustomEvent('zyrquen:toast', {
          detail: {
            message: `CRITICAL ALERT: ${cause} has breached threshold for more than 5 minutes!`,
            type: 'critical',
          },
        })
      );
    } else if (!hasCriticalAlert) {
      alertNotifiedRef.current = false;
    }
  }, [hasCriticalAlert, isCpuSustainedCritical, isMemorySustainedCritical, isHsmSustainedCritical]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSimulateHighLoad = (type: 'cpu' | 'memory' | 'hsm') => {
    playTone(660, 0.08);
    if (type === 'cpu') {
      setSimulatedHighCpu(true);
      setSimulatedMinutesOverThreshold(5.5);
      setCpuHighStartTime(Date.now() - 330 * 1000);
    } else if (type === 'memory') {
      setSimulatedHighMemory(true);
      setSimulatedMinutesOverThreshold(5.2);
      setMemoryHighStartTime(Date.now() - 312 * 1000);
    } else {
      setSimulatedLowHsm(true);
      setSimulatedMinutesOverThreshold(5.5);
      setHsmLowStartTime(Date.now() - 330 * 1000);
      hsmClusterService.simulateDegradation(7, 5.5);
    }
  };

  const handleResetSimulation = () => {
    playAuditChime();
    setSimulatedHighCpu(false);
    setSimulatedHighMemory(false);
    setSimulatedLowHsm(false);
    setSimulatedMinutesOverThreshold(0);
    setCpuHighStartTime(null);
    setMemoryHighStartTime(null);
    setHsmLowStartTime(null);
    hsmClusterService.remediateCluster();
  };

  return (
    <div className={`p-4 sm:p-6 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl text-white font-mono ${className}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
              hasCriticalAlert
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-400 animate-pulse'
                : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
            }`}
          >
            {hasCriticalAlert ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Activity className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-cyan-400 flex flex-wrap items-center gap-2">
              <span>{title}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-normal border ${
                  hasCriticalAlert
                    ? 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse font-bold'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {hasCriticalAlert ? '🚨 SUSTAINED ALERT (>5 MIN THRESHOLD BREACH)' : '🟢 LIVE TELEMETRY'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time Hardware Cores, Memory Buffer &amp; 10/10 Deca-HSM Node Availability Monitoring
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

      {/* CRITICAL SUSTAINED LOAD ALERT BANNER (>90% CPU/RAM OR <80% HSM FOR >5 MINUTES) */}
      {hasCriticalAlert && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-red-950/80 to-rose-950/90 border-2 border-rose-500 text-rose-200 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-900/80 border border-rose-400 text-rose-200 shrink-0">
                <Flame className="w-5 h-5 text-rose-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-white uppercase tracking-wider">
                    CRITICAL SUSTAINED THRESHOLD BREACH
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-black">
                    SUSTAINED &gt;5 MIN ALERT
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
                  {isHsmSustainedCritical && (
                    <span>
                      Active HSM Nodes dropped to <strong className="text-white font-bold">{latestPoint.hsmAvailability}% ({latestPoint.hsmActiveNodes}/10 nodes)</strong> (Sustained for {formatDuration(hsmUnderSeconds)} &gt; 5m threshold).{' '}
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
                <span>Clear / Reset Normal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELEVATED WARNING BANNER (EXCEEDED THRESHOLD BUT UNDER 5 MINUTES) */}
      {!hasCriticalAlert && (isCpuWarning || isMemoryWarning || isHsmWarning) && (
        <div className="mb-5 p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-xs">
              <strong>ELEVATED THRESHOLD WARNING:</strong>{' '}
              {isCpuWarning && `CPU at ${latestPoint.cpuUsage}% (${formatDuration(cpuOverSeconds)} / 5m timer)`}
              {isCpuWarning && isMemoryWarning && ' • '}
              {isMemoryWarning && `RAM at ${latestPoint.memoryUsage}% (${formatDuration(memoryOverSeconds)} / 5m timer)`}
              {(isCpuWarning || isMemoryWarning) && isHsmWarning && ' • '}
              {isHsmWarning && `HSM Nodes at ${latestPoint.hsmAvailability}% (${latestPoint.hsmActiveNodes}/10 nodes, ${formatDuration(hsmUnderSeconds)} / 5m timer)`}
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
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isCpuSustainedCritical
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_18px_rgba(239,68,68,0.4)] ring-2 ring-rose-500'
              : isCpuWarning
              ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/40'
              : latestPoint.cpuUsage >= 70
              ? 'bg-amber-950/30 border-amber-500/30'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Cpu className={`w-3.5 h-3.5 ${isCpuSustainedCritical ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />
              CPU USAGE
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isCpuSustainedCritical
                  ? 'bg-rose-500 text-black animate-pulse'
                  : isCpuWarning
                  ? 'bg-amber-500/30 text-amber-300'
                  : latestPoint.cpuUsage >= 70
                  ? 'bg-amber-950 text-amber-400'
                  : 'bg-emerald-950 text-emerald-400'
              }`}
            >
              {isCpuSustainedCritical ? '🚨 >5m ALERT' : isCpuWarning ? '⚠️ RISING (>90%)' : latestPoint.cpuUsage >= 70 ? 'ELEVATED' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-xl sm:text-2xl font-bold ${
                isCpuSustainedCritical ? 'text-rose-300' : isCpuWarning ? 'text-amber-300' : latestPoint.cpuUsage >= 70 ? 'text-amber-200' : 'text-white'
              }`}
            >
              {latestPoint.cpuUsage}%
            </div>
            <div className="text-[10px] text-slate-400">
              {isCpuSustainedCritical ? formatDuration(cpuOverSeconds) : isCpuWarning ? `${formatDuration(cpuOverSeconds)} / 5m` : 'Thresh: 90%'}
            </div>
          </div>
        </div>

        {/* Memory Metric Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isMemorySustainedCritical
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_18px_rgba(239,68,68,0.4)] ring-2 ring-rose-500'
              : isMemoryWarning
              ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/40'
              : latestPoint.memoryUsage >= 70
              ? 'bg-amber-950/30 border-amber-500/30'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <HardDrive className={`w-3.5 h-3.5 ${isMemorySustainedCritical ? 'text-blue-400 animate-bounce' : 'text-blue-400'}`} />
              RAM BUFFER
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isMemorySustainedCritical
                  ? 'bg-rose-500 text-black animate-pulse'
                  : isMemoryWarning
                  ? 'bg-amber-500/30 text-amber-300'
                  : latestPoint.memoryUsage >= 70
                  ? 'bg-amber-950 text-amber-400'
                  : 'bg-emerald-950 text-emerald-400'
              }`}
            >
              {isMemorySustainedCritical ? '🚨 >5m ALERT' : isMemoryWarning ? '⚠️ RISING (>90%)' : latestPoint.memoryUsage >= 70 ? 'ELEVATED' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-xl sm:text-2xl font-bold ${
                isMemorySustainedCritical ? 'text-rose-300' : isMemoryWarning ? 'text-amber-300' : latestPoint.memoryUsage >= 70 ? 'text-amber-200' : 'text-white'
              }`}
            >
              {latestPoint.memoryUsage}%
            </div>
            <div className="text-[10px] text-slate-400">
              {isMemorySustainedCritical ? formatDuration(memoryOverSeconds) : isMemoryWarning ? `${formatDuration(memoryOverSeconds)} / 5m` : 'Thresh: 90%'}
            </div>
          </div>
        </div>

        {/* HSM Availability Metric Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isHsmSustainedCritical
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_18px_rgba(239,68,68,0.4)] ring-2 ring-rose-500'
              : isHsmWarning
              ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/40'
              : latestPoint.hsmAvailability < 100
              ? 'bg-purple-950/40 border-purple-500/30'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              HSM AVAILABILITY
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isHsmSustainedCritical
                  ? 'bg-rose-500 text-black animate-pulse'
                  : isHsmWarning
                  ? 'bg-amber-500/30 text-amber-300'
                  : latestPoint.hsmAvailability >= 80
                  ? 'bg-purple-950 text-purple-300'
                  : 'bg-rose-950 text-rose-400'
              }`}
            >
              {isHsmSustainedCritical ? '🚨 >5m <80%' : isHsmWarning ? '⚠️ <80% QUORUM' : 'RATIFIED'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-xl sm:text-2xl font-bold ${
                isHsmSustainedCritical ? 'text-rose-300' : isHsmWarning ? 'text-amber-300' : 'text-purple-300'
              }`}
            >
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              CPU &amp; Memory Utilization Over Time ({timeRange === '24h' ? '24-Hour Horizon' : 'Recent Telemetry Stream'})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                isCpuSustainedCritical || isMemorySustainedCritical
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse font-bold'
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
              }`}
            >
              {isCpuSustainedCritical || isMemorySustainedCritical
                ? '🚨 90% THRESHOLD BREACHED (>5 MIN)'
                : 'RED LINE = 90% SUSTAINED THRESHOLD'}
            </span>
          </div>
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

      {/* CHART 2: HSM NODE AVAILABILITY OVER TIME (NEW LINE CHART COMPLEMENTING CPU & MEMORY) */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              HSM Node Availability Over Time (ความพร้อมใช้งานของโหนด HSM เมื่อเวลาผ่านไป)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                isHsmSustainedCritical
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse font-bold'
                  : isHsmWarning
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
              }`}
            >
              {isHsmSustainedCritical
                ? '🚨 <80% QUORUM BREACH (>5 MIN)'
                : 'PURPLE LINE = 10/10 HSM CONSENSUS (80% MIN QUORUM)'}
            </span>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full min-w-0 text-xs">
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
                formatter={(value: any) => [
                  `${value}% (${(Number(value) / 10).toFixed(0)}/10 Active Real HSM Nodes)`,
                  'HSM Availability',
                ]}
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
                strokeWidth={1.8}
                label={{
                  value: '80% MINIMUM QUORUM THRESHOLD (ALERT IF <80% FOR >5 MIN)',
                  fill: '#c084fc',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              {/* Reference line at 100% Full Quorum */}
              <ReferenceLine
                y={100}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth={1}
                label={{
                  value: '100% DECA-KEY FULL CONSENSUS (10/10 PASS)',
                  fill: '#34d399',
                  fontSize: 9,
                  position: 'bottom',
                }}
              />
              <Line
                type="stepAfter"
                dataKey="hsmAvailability"
                name="HSM Availability (%)"
                stroke={isHsmSustainedCritical ? '#ef4444' : isHsmWarning ? '#f59e0b' : '#a855f7'}
                strokeWidth={2.5}
                dot={{ r: 3, fill: isHsmSustainedCritical ? '#ef4444' : '#a855f7' }}
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
            Test 5-Minute Threshold Alert Engine:
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

          <button
            onClick={() => handleSimulateHighLoad('hsm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              simulatedLowHsm
                ? 'bg-purple-500 text-black shadow-md'
                : 'bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300'
            }`}
          >
            <Server className="w-3 h-3" />
            <span>Simulate HSM &lt;80% (5m+)</span>
          </button>

          {(simulatedHighCpu || simulatedHighMemory || simulatedLowHsm) && (
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
