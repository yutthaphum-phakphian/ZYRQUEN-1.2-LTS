import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Zap,
  Cpu,
  Server,
  Wifi,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Globe2,
  Layers,
  Sparkles,
  BarChart2,
  HardDrive,
  Gauge,
  Clock,
  Download,
  Scale,
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
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { SYSTEM_METADATA } from '../../data/canonicalData';
import { ZYRQUEN_ENTROPY_CONFIG } from '../../utils/circuitBreakerSafety';
import { playTone } from '../AudioSynthesizer';
import { CryptographyStream } from '../CryptographyStream';
import { SearchInsightsPanel } from '../SearchInsightsPanel';
import { SubKelvinNebula } from "../SubKelvinNebula";
import { EntropyFluxNebula } from "../EntropyFluxNebula";
import { PulseHardwareGrid } from '../PulseHardwareGrid';
import { PulseView as QuantumEntropyDriftChart } from '../PulseView';
import {
  ActiveEntropyRateMonitor,
  exportActiveEntropyCsv,
  EntropyDataPoint,
} from '../ActiveEntropyRateMonitor';
import { CriticalEntropyAlertNotification } from '../CriticalEntropyAlertNotification';
import { EntropyGridHeatmap } from '../EntropyGridHeatmap';
import { TelemetryAnomalyObserver } from '../../utils/telemetryAnomalyObserver';
import { HardwareSnapshot } from '../../types';
import { INITIAL_HARDWARE_SNAPSHOTS, exportAllHardwareSnapshotsCsv } from '../../utils/telemetrySnapshot';
import { CryogenicTelemetryVisualizer } from '../CryogenicTelemetryVisualizer';
import { TelemetryAnomalyObserverTimeline } from '../TelemetryAnomalyObserverTimeline';
import { AtmosphericEntropyThermalAreaChart } from '../AtmosphericEntropyThermalAreaChart';
import { PulseForensicTimeline } from '../PulseForensicTimeline';
import { PulseAnomalyHeartbeatD3Chart } from '../PulseAnomalyHeartbeatD3Chart';
import { playAnomalyAlertChime } from '../AudioSynthesizer';
import { HistoricalComparisonOverlay } from '../HistoricalComparisonOverlay';

export interface TrendDataPoint {
  hour: string;
  qops: number;
  coherence: number;
  latency: number;
  nodes: number;
  seals: number;
  ssdWear: number;
  voltageStability: number;
  bkkLoad: number;
  sgLoad: number;
  tyLoad: number;
  projectedLoad?: number;
  projectedCpu?: number;
  isProjection?: boolean;
  confidenceUpper?: number;
  confidenceLower?: number;
}

// 24-Hour Civilization Intelligence Node Activity Dataset
const GENERATE_24H_DATA = (): TrendDataPoint[] => {
  const hours = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  ];

  return hours.map((hour, idx) => {
    // Diurnal civilization pattern simulation
    const cycle = Math.sin((idx / 24) * Math.PI * 2);
    const qops = +(840 + cycle * 18 + Math.random() * 8).toFixed(1);
    const coherence = +(99.94 + Math.sin(idx * 0.5) * 0.04 + Math.random() * 0.01).toFixed(3);
    const latency = +(1.18 - cycle * 0.08 + Math.random() * 0.05).toFixed(2);
    const nodes = Math.round(130 + cycle * 12 + Math.random() * 4);
    const seals = Math.round(610 + cycle * 35 + Math.random() * 20);
    const ssdWear = +(0.81 + (idx / 24) * 0.02 + Math.random() * 0.005).toFixed(2);
    const voltageStability = +(99.98 + Math.sin(idx * 0.4) * 0.01 + Math.random() * 0.005).toFixed(2);

    return {
      hour,
      qops,
      coherence,
      latency,
      nodes,
      seals,
      ssdWear,
      voltageStability,
      bkkLoad: Math.round(42 + cycle * 8),
      sgLoad: Math.round(38 + cycle * 6),
      tyLoad: Math.round(35 + cycle * 7),
    };
  });
};

const TREND_DATA_24H = GENERATE_24H_DATA();

// Custom Tooltip Component for Recharts with Forensic Hardware Telemetry
const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const ssdVal = dataPoint?.ssdWear ?? 0.82;
    const voltVal = dataPoint?.voltageStability ?? 99.98;

    const isSsdAmber = ssdVal >= 2.0 && ssdVal < 5.0;
    const isSsdRed = ssdVal >= 5.0;
    const ssdColorClass = isSsdRed ? 'text-rose-400' : isSsdAmber ? 'text-amber-400' : 'text-emerald-400';
    const ssdDotClass = isSsdRed ? 'bg-rose-500' : isSsdAmber ? 'bg-amber-400' : 'bg-emerald-400';
    const ssdStatusText = isSsdRed ? 'CRITICAL WEAR' : isSsdAmber ? 'ELEVATED' : 'NOMINAL';

    const isVoltAmber = voltVal < 99.90 && voltVal >= 99.50;
    const isVoltRed = voltVal < 99.50;
    const voltColorClass = isVoltRed ? 'text-rose-400' : isVoltAmber ? 'text-amber-400' : 'text-cyan-400';
    const voltDotClass = isVoltRed ? 'bg-rose-500' : isVoltAmber ? 'bg-amber-400' : 'bg-cyan-400';
    const voltStatusText = isVoltRed ? 'RAIL INSTABILITY' : isVoltAmber ? 'VOLTAGE JITTER' : 'STABLE 12.01V';

    return (
      <div className="p-4 rounded-2xl bg-[#07080F]/95 border border-white/15 backdrop-blur-xl shadow-2xl font-mono text-xs space-y-2.5 min-w-[260px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-zinc-400">
          <span className="font-bold text-white">Timeline: {label} {dataPoint?.isProjection ? '' : 'ICT'}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            dataPoint?.isProjection
              ? 'text-rose-300 bg-rose-500/20 border-rose-500/40'
              : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
          }`}>
            {dataPoint?.isProjection ? '10-MIN PROJECTION' : 'SEALED #849202'}
          </span>
        </div>

        {dataPoint?.isProjection && (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-300">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Future-State Estimation (Next 10 Min)</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">Projected System Load:</span>
              <span className="font-bold text-white">{dataPoint.projectedLoad} QOps/s</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">Confidence Band (95%):</span>
              <span className="text-rose-300">{dataPoint.confidenceLower} – {dataPoint.confidenceUpper} QOps/s</span>
            </div>
          </div>
        )}

        {/* Primary Selected Series */}
        <div className="space-y-1">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold text-white text-xs">
                {item.value} {item.unit || ''}
              </span>
            </div>
          ))}
        </div>

        {/* Dedicated Forensic Telemetry Section */}
        <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px]">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Forensic Hardware Telemetry</span>
            <span className="text-[9px] text-zinc-500">Sub-0.01% Precision</span>
          </div>

          {/* SSD Wear Forensics */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${ssdDotClass}`} />
              SSD Wear Level:
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${ssdColorClass}`}>{ssdVal}%</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${isSsdRed ? 'bg-rose-500/20 text-rose-300' : isSsdAmber ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {ssdStatusText}
              </span>
            </div>
          </div>

          {/* Voltage Stability Forensics */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${voltDotClass}`} />
              Voltage Stability:
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${voltColorClass}`}>{voltVal}%</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${isVoltRed ? 'bg-rose-500/20 text-rose-300' : isVoltAmber ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
                {voltStatusText}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-1 border-t border-white/8 text-[9px] text-zinc-500 flex justify-between">
          <span>SHA-256 Merkle Provenance</span>
          <span>Zero Baseline Drift</span>
        </div>
      </div>
    );
  }
  return null;
};

interface PulseViewProps {
  snapshots?: HardwareSnapshot[];
  onOpenEventsSidebar?: () => void;
  onAddHardwareSnapshot?: (snap: HardwareSnapshot) => void;
  onAddAnomalyReport?: (report: any) => void;
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    statuteRef?: string,
    severity?: 'info' | 'warning' | 'critical',
    metaHash?: string
  ) => void;
  isSystemActivityFrozen?: boolean;
}

import { SystemHealthPulse } from '../SystemHealthPulse';

export const PulseView: React.FC<PulseViewProps> = ({
  snapshots = INITIAL_HARDWARE_SNAPSHOTS,
  onOpenEventsSidebar,
  onAddHardwareSnapshot,
  onAddAnomalyReport,
  onAddSystemEvent,
  isSystemActivityFrozen = false,
}) => {
  const [activePulseTab, setActivePulseTab] = useState<'live_telemetry' | 'historical_comparison' | 'anomaly_observer' | 'forensic_timeline' | 'heartbeat_anomalies_d3'>('live_telemetry');
  const [isHistoricalOverlayOpen, setIsHistoricalOverlayOpen] = useState<boolean>(false);
  const [showHistoricalBaselineOnChart, setShowHistoricalBaselineOnChart] = useState<boolean>(true);
  const [activeMetric, setActiveMetric] = useState<'all' | 'qops' | 'coherence' | 'latency' | 'nodes' | 'ssdWear' | 'voltageStability'>('all');
  const [showProjection, setShowProjection] = useState<boolean>(true);
  const [pulseData, setPulseData] = useState({
    cpu: 41.2,
    memory: 62.4,
    qops: 851.9,
    latency: 1.2,
    cryo: 14.98,
    heliumFlow: 100,
    sla: 99.999,
    ssdWear: 0.82,
    voltageStability: 99.98,
  });

  // Detected anomaly count for PulseView tab badge
  const detectedAnomaliesCount = useMemo(() => {
    return snapshots.reduce((count, snap, idx) => {
      const window = snapshots.slice(0, idx + 1);
      const res = TelemetryAnomalyObserver.evaluate(snap, window);
      return count + (res.hasAnomaly ? 1 : 0);
    }, 0);
  }, [snapshots]);

  // Future-state 10-minute projection based on historical snapshots
  const { combinedTrendData, projectionStats } = useMemo(() => {
    const baseData = [...TREND_DATA_24H];

    // Compute regression baseline from historical hardware snapshots
    const recentSnaps = snapshots.slice(0, 12);
    let avgCpu = 41.2;
    let avgQops = 851.9;
    let avgCoherence = 99.98;
    let avgLatency = 1.18;
    let avgNodes = 134;
    let avgSsd = 0.82;
    let avgVolt = 99.98;

    let cpuSlope = 0;
    let qopsSlope = 0;

    if (recentSnaps.length >= 2) {
      const n = recentSnaps.length;
      let sumX = 0;
      let sumYCpu = 0;
      let sumYQops = 0;
      let sumXYCpu = 0;
      let sumXYQops = 0;
      let sumX2 = 0;

      recentSnaps.forEach((s, idx) => {
        const x = idx;
        const yCpu = s.cpuAverage ?? 41.2;
        const yQops = s.qopsThroughput ?? 851.9;
        sumX += x;
        sumYCpu += yCpu;
        sumYQops += yQops;
        sumXYCpu += x * yCpu;
        sumXYQops += x * yQops;
        sumX2 += x * x;
      });

      const denom = n * sumX2 - sumX * sumX || 1;
      cpuSlope = -((n * sumXYCpu - sumX * sumYCpu) / denom);
      qopsSlope = -((n * sumXYQops - sumX * sumYQops) / denom);

      avgCpu = recentSnaps[0].cpuAverage;
      avgQops = recentSnaps[0].qopsThroughput;
      avgCoherence = recentSnaps[0].coherencePct ?? 99.98;
      avgLatency = 1.15;
      avgNodes = 138;
      avgSsd = recentSnaps[0].ssdWearLevelPct ?? 0.82;
      avgVolt = recentSnaps[0].voltageStabilityPct ?? 99.98;
    }

    cpuSlope = Math.max(-0.35, Math.min(0.5, cpuSlope));
    qopsSlope = Math.max(-1.2, Math.min(1.8, qopsSlope));

    const lastBaseIndex = baseData.length - 1;
    if (lastBaseIndex >= 0) {
      baseData[lastBaseIndex] = {
        ...baseData[lastBaseIndex],
        projectedLoad: baseData[lastBaseIndex].qops,
      };
    }

    if (!showProjection) {
      return {
        combinedTrendData: baseData,
        projectionStats: {
          projectedLoad10m: avgQops,
          projectedCpu10m: avgCpu,
          trendSlope: 0,
          modelFit: '98.4%',
          anchorCount: snapshots.length,
        },
      };
    }

    const futureMinutes = [2, 4, 6, 8, 10];
    const futurePoints = futureMinutes.map((mins) => {
      const projQops = +(avgQops + qopsSlope * mins + Math.sin(mins * 0.7) * 1.2).toFixed(1);
      const projCpu = +(avgCpu + cpuSlope * mins).toFixed(1);
      const projCoherence = +(avgCoherence + Math.sin(mins) * 0.004).toFixed(3);
      const projLatency = +(avgLatency + mins * 0.008).toFixed(2);
      const projNodes = Math.round(avgNodes + (mins >= 6 ? 1 : 0));
      const projSsd = +(avgSsd + mins * 0.0005).toFixed(2);
      const projVolt = +(avgVolt - mins * 0.0008).toFixed(2);

      return {
        hour: `+${mins}m [PROJ]`,
        isProjection: true,
        projectedLoad: projQops,
        projectedCpu: projCpu,
        qops: undefined,
        coherence: projCoherence,
        latency: projLatency,
        nodes: projNodes,
        ssdWear: projSsd,
        voltageStability: projVolt,
        confidenceUpper: +(projQops + 3.8 + mins * 0.35).toFixed(1),
        confidenceLower: +(projQops - 3.8 - mins * 0.35).toFixed(1),
      };
    });

    const projectedLoad10m = +(avgQops + qopsSlope * 10).toFixed(1);
    const projectedCpu10m = +(avgCpu + cpuSlope * 10).toFixed(1);

    return {
      combinedTrendData: [...baseData, ...futurePoints],
      projectionStats: {
        projectedLoad10m,
        projectedCpu10m,
        trendSlope: +(qopsSlope).toFixed(2),
        modelFit: '98.7%',
        anchorCount: snapshots.length,
      },
    };
  }, [snapshots, showProjection]);

  // Real-time Active Entropy Telemetry state
  const [entropyHorizon, setEntropyHorizon] = useState<'60m' | '24h'>('60m');
  const [currentEntropyRateKBps, setCurrentEntropyRateKBps] = useState<number>(11264);
  const [entropyHistory60m, setEntropyHistory60m] = useState<EntropyDataPoint[]>([]);
  const [isSimulatedLowEntropy, setIsSimulatedLowEntropy] = useState<boolean>(false);

  const handleTriggerSidebarEntropyAlert = (rate: number) => {
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'VITALITY_ANOMALY',
        'Critical Entropy Alert: Rate Exceeded 85 KBps',
        `Active Entropy Rate surged to ${rate.toLocaleString()} KBps (Critical Threshold: 85 KBps). Physical TRNG quantum noise divergence detected across 10/10 Council nodes. Automated circuit breaker engaged.`,
        'ISO/IEC 18031 Physical TRNG Invariant Gate',
        'critical',
        'entropy-anchor:0x3319203849102834019283401928340192834019283401928340192834019283'
      );
    }
  };

  // Manual threshold override testing state (null = live auto simulation)
  const [overrideState, setOverrideState] = useState<'normal' | 'ssd-amber' | 'ssd-red' | 'volt-amber' | 'volt-red' | null>(null);

  // Small live fluctuation simulation (only if not manually overridden)
  useEffect(() => {
    if (overrideState) return;
    const interval = setInterval(() => {
      setPulseData((prev) => ({
        ...prev,
        cpu: +(40 + Math.random() * 4).toFixed(1),
        memory: +(62 + Math.random() * 1.5).toFixed(1),
        qops: +(850 + Math.random() * 4).toFixed(1),
        latency: +(1.1 + Math.random() * 0.3).toFixed(2),
        ssdWear: +(0.81 + Math.random() * 0.03).toFixed(2),
        voltageStability: +(99.97 + Math.random() * 0.02).toFixed(2),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [overrideState]);

  // Color threshold evaluations
  // SSD Wear Level: < 2.0% Nominal (Green), 2.0% - 5.0% Warning (Amber), >= 5.0% Critical (Red)
  const isSsdAmber = pulseData.ssdWear >= 2.0 && pulseData.ssdWear < 5.0;
  const isSsdRed = pulseData.ssdWear >= 5.0;
  const ssdLevel = isSsdRed ? 'RED' : isSsdAmber ? 'AMBER' : 'GREEN';

  // Voltage Stability: >= 99.90% Nominal (Green), 99.50% - 99.90% Warning (Amber), < 99.50% Critical (Red)
  const isVoltAmber = pulseData.voltageStability < 99.90 && pulseData.voltageStability >= 99.50;
  const isVoltRed = pulseData.voltageStability < 99.50;
  const voltLevel = isVoltRed ? 'RED' : isVoltAmber ? 'AMBER' : 'GREEN';

  const hasHardwareWarning = isSsdAmber || isSsdRed || isVoltAmber || isVoltRed;

  const handleSimulateThreshold = (mode: 'normal' | 'ssd-amber' | 'ssd-red' | 'volt-amber' | 'volt-red') => {
    setOverrideState(mode);
    playTone(mode === 'normal' ? 650 : mode.includes('red') ? 300 : 480, 0.08);
    if (mode === 'normal') {
      setPulseData((prev) => ({ ...prev, ssdWear: 0.82, voltageStability: 99.98 }));
      setOverrideState(null);
    } else if (mode === 'ssd-amber') {
      setPulseData((prev) => ({ ...prev, ssdWear: 3.45, voltageStability: 99.98 }));
    } else if (mode === 'ssd-red') {
      setPulseData((prev) => ({ ...prev, ssdWear: 6.80, voltageStability: 99.98 }));
    } else if (mode === 'volt-amber') {
      setPulseData((prev) => ({ ...prev, ssdWear: 0.82, voltageStability: 99.68 }));
    } else if (mode === 'volt-red') {
      setPulseData((prev) => ({ ...prev, ssdWear: 0.82, voltageStability: 99.20 }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0a1820]/90 via-[#0b0e1a]/80 to-[#07080F] border border-white/8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">
              CIVILIZATION INTELLIGENCE TELEMETRY
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
              SLO 99.999% NOMINAL
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono border transition-all ${
                hasHardwareWarning
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
              }`}
            >
              {hasHardwareWarning ? 'HARDWARE ANOMALY DETECTED' : 'HARDWARE HEALTH 100%'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
            System Telemetry, Cryo Thermal & 24H Intelligence Graph
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Cloud Run Container BK01 • Subzero Helium-4 Heat Exchanger • Recharts 24-Hour Node Activity
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Threshold Simulator Control Pill */}
          <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl">
            <span className="text-[10px] text-zinc-400 px-2">Threshold Test:</span>
            <button
              onClick={() => handleSimulateThreshold('normal')}
              className={`px-2 py-1 rounded-xl text-[10px] transition-all ${
                !overrideState ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Reset metrics to nominal Green operational range"
            >
              Nominal
            </button>
            <button
              onClick={() => handleSimulateThreshold('ssd-amber')}
              className={`px-2 py-1 rounded-xl text-[10px] transition-all ${
                overrideState === 'ssd-amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Simulate Amber warning for SSD wear"
            >
              SSD Warn
            </button>
            <button
              onClick={() => handleSimulateThreshold('ssd-red')}
              className={`px-2 py-1 rounded-xl text-[10px] transition-all ${
                overrideState === 'ssd-red' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Simulate Red critical alert for SSD wear"
            >
              SSD Crit
            </button>
            <button
              onClick={() => handleSimulateThreshold('volt-red')}
              className={`px-2 py-1 rounded-xl text-[10px] transition-all ${
                overrideState === 'volt-red' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Simulate Red critical alert for Voltage rail drop"
            >
              Volt Crit
            </button>
            <button
              onClick={() => {
                // Specifically trigger the custom low-frequency alert chime for detected anomaly
                playAnomalyAlertChime();
                const outlier = TelemetryAnomalyObserver.generateSimulatedOutlierSnapshot('thermal', snapshots.length + 1);
                if (onAddHardwareSnapshot) {
                  onAddHardwareSnapshot(outlier);
                } else if (onAddSystemEvent) {
                  onAddSystemEvent(
                    'ANOMALY',
                    `Statistical Anomaly: Outlier Snapshot #${String(snapshots.length + 1).padStart(3, '0')}`,
                    `Core 0-3 thermal surge detected at ${outlier.cpuAverage.toFixed(1)}°C (>3.5σ deviation from baseline). Automatically flagged by background TelemetryAnomalyObserver.`,
                    'ISO/IEC 27037 Telemetry Anomaly Gate',
                    'critical',
                    outlier.sealedHash
                  );
                }
              }}
              className="px-2 py-1 rounded-xl text-[10px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition-all flex items-center gap-1"
              title="Inject a statistical outlier snapshot into telemetry stream to test background observer"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Inject Outlier (Observer Test)</span>
            </button>
          </div>

          {/* Quick Historical Comparison Overlay Toggle */}
          <button
            id="pulseview-quick-historical-overlay-toggle-btn"
            onClick={() => {
              playTone(680, 0.04);
              setIsHistoricalOverlayOpen(!isHistoricalOverlayOpen);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isHistoricalOverlayOpen
                ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
            }`}
            title="Toggle Historical Comparison Overlay comparing live telemetry against Frozen Core Block #849202"
          >
            <span>{isHistoricalOverlayOpen ? '🧊' : '⚖️'}</span>
            <span>{isHistoricalOverlayOpen ? 'Hide Baseline Overlay' : 'Historical Comparison (Block #849202)'}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
              Δ0.00%
            </span>
          </button>

          <a
            href="#active-entropy-rate-monitor"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono transition-all hover:scale-105"
            title="Jump to D3 Active Entropy Rate (KBps) 60-Minute Real-Time Monitor"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>D3 Entropy Rate (60m)</span>
          </a>

          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono text-emerald-400 font-semibold">12.4k Events / Min</span>
          </div>
        </div>
      </div>

      {/* PulseView Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-[#0b0e1a]/90 border border-cyan-500/20 backdrop-blur-xl font-mono text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <button
            onClick={() => {
              playTone(600, 0.04);
              setActivePulseTab('live_telemetry');
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activePulseTab === 'live_telemetry'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Pulse &amp; Cryo Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            id="pulseview-historical-comparison-tab-btn"
            onClick={() => {
              playTone(620, 0.04);
              setActivePulseTab('historical_comparison');
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activePulseTab === 'historical_comparison'
                ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <span>⚖️</span>
            <span>Historical Comparison</span>
            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-mono border border-[#D4AF37]/30">
              BLOCK #849202
            </span>
          </button>

          <button
            onClick={() => {
              playTone(650, 0.04);
              setActivePulseTab('anomaly_observer');
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activePulseTab === 'anomaly_observer'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Telemetry Anomaly Observer &amp; Drift Timeline</span>
            {detectedAnomaliesCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-mono font-bold animate-pulse border border-rose-500/40">
                {detectedAnomaliesCount} FLAGGED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                0 DRIFT
              </span>
            )}
          </button>

          <button
            id="pulseview-forensic-timeline-tab-btn"
            onClick={() => {
              playTone(700, 0.04);
              setActivePulseTab('forensic_timeline');
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activePulseTab === 'forensic_timeline'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Forensic Timeline</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
              D3.JS
            </span>
          </button>

          <button
            id="pulseview-heartbeat-anomalies-d3-tab-btn"
            onClick={() => {
              playTone(720, 0.04);
              setActivePulseTab('heartbeat_anomalies_d3');
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activePulseTab === 'heartbeat_anomalies_d3'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4 text-[#06B6D4]" />
            <span>Heartbeat &amp; Anomalies</span>
            <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-[10px] font-mono border border-[#06B6D4]/30">
              D3.JS OVERLAY
            </span>
          </button>
        </div>

        {/* Global CSV Export for all snapshots */}
        <button
          id="pulseview-export-all-snapshots-csv-btn"
          onClick={() => {
            playTone(740, 0.04);
            exportAllHardwareSnapshotsCsv(snapshots);
          }}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          title="Export all hardware snapshot data as a CSV spreadsheet file"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Snapshots CSV</span>
        </button>
      </div>

      {activePulseTab === 'historical_comparison' ? (
        <HistoricalComparisonOverlay
          currentSnapshot={snapshots[snapshots.length - 1]}
          snapshots={snapshots}
          liveCpu={pulseData.cpu}
          liveMemory={pulseData.memory}
          liveCryo={pulseData.cryo}
          liveQops={pulseData.qops}
          liveLatency={pulseData.latency}
          liveSsdWear={pulseData.ssdWear}
          liveVoltageStability={pulseData.voltageStability}
        />
      ) : activePulseTab === 'anomaly_observer' ? (
        <TelemetryAnomalyObserverTimeline
          snapshots={snapshots}
          onAddHardwareSnapshot={onAddHardwareSnapshot}
          onAddSystemEvent={onAddSystemEvent}
        />
      ) : activePulseTab === 'forensic_timeline' ? (
        <PulseForensicTimeline snapshots={snapshots} />
      ) : activePulseTab === 'heartbeat_anomalies_d3' ? (
        <PulseAnomalyHeartbeatD3Chart
          snapshots={snapshots}
          onAddHardwareSnapshot={onAddHardwareSnapshot}
          onAddSystemEvent={onAddSystemEvent}
        />
      ) : (
        <>
          {/* Historical Comparison Overlay Panel (when toggled active in Live view) */}
          {isHistoricalOverlayOpen && (
            <HistoricalComparisonOverlay
              currentSnapshot={snapshots[snapshots.length - 1]}
              snapshots={snapshots}
              liveCpu={pulseData.cpu}
              liveMemory={pulseData.memory}
              liveCryo={pulseData.cryo}
              liveQops={pulseData.qops}
              liveLatency={pulseData.latency}
              liveSsdWear={pulseData.ssdWear}
              liveVoltageStability={pulseData.voltageStability}
              onClose={() => setIsHistoricalOverlayOpen(false)}
              isCompactOverlay={true}
            />
          )}

          {/* Immediate Visual Warning Alert Banner when metrics fall outside safe operational thresholds */}
          {hasHardwareWarning && (
        <div className="p-4 rounded-[22px] bg-gradient-to-r from-rose-950/80 via-amber-950/70 to-[#07080F] border-2 border-rose-500/50 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-200 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[10px] uppercase font-bold tracking-wider">
                  Operational Safety Breach
                </span>
                <span>Hardware Parameter Outside Nominal Threshold</span>
              </div>
              <p className="text-zinc-300 text-[11px] mt-0.5">
                {isSsdRed && '• SSD Wear Level is in CRITICAL state (≥5.0%). Failover recommended.'}
                {isSsdAmber && '• SSD Wear Level is in WARNING state (2.0% - 5.0%). Maintenance scheduled.'}
                {isVoltRed && ' • Voltage Stability dropped into CRITICAL instability (<99.50%). Secondary DC rail armed.'}
                {isVoltAmber && ' • Voltage Stability is exhibiting JITTER (99.50% - 99.90%). Capacitor filter engaged.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSimulateThreshold('normal')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all shrink-0 border border-white/15"
          >
            Acknowledge & Clear
          </button>
        </div>
      )}

      {/* Cryogenic Telemetry Visualizer & Anomaly Predictor (+60s Horizon) */}
      <CryogenicTelemetryVisualizer />

      {/* Metrics Row - 6 Hardware & Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>CPU CONTAINER LOAD</span>
            <span className="text-cyan-400 font-bold">{pulseData.cpu}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${pulseData.cpu}%` }} />
          </div>
          <div className="text-[11px] font-mono text-zinc-500">4 Cores Allocated • Stabilized</div>
        </div>

        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>MEMORY ALLOCATION</span>
            <span className="text-violet-400 font-bold">{pulseData.memory}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-violet-400 transition-all duration-500" style={{ width: `${pulseData.memory}%` }} />
          </div>
          <div className="text-[11px] font-mono text-zinc-500">5.1 GB / 8.0 GB RAM</div>
        </div>

        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>CRYO TEMPERATURE</span>
            <span className="text-amber-400 font-bold">{pulseData.cryo} mK</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: '18%' }} />
          </div>
          <div className="text-[11px] font-mono text-zinc-500">100% Helium Coolant Flow</div>
        </div>

        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>KERNEL SLA UPTIME</span>
            <span className="text-emerald-400 font-bold">{pulseData.sla}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: '99.999%' }} />
          </div>
          <div className="text-[11px] font-mono text-zinc-500">0 Outage Seconds in 90 Days</div>
        </div>

        {/* Extended Metric 1: SSD Wear Level with Color-Coded Indicator (Green/Amber/Red) */}
        <div
          className={`p-5 rounded-[24px] backdrop-blur-xl space-y-2 transition-all duration-300 ${
            isSsdRed
              ? 'bg-rose-950/40 border-2 border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              : isSsdAmber
              ? 'bg-amber-950/30 border-2 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-[#0b0e1a]/70 border border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <HardDrive
                className={`w-3.5 h-3.5 ${
                  isSsdRed ? 'text-rose-400 animate-bounce' : isSsdAmber ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />
              <span>SSD WEAR LEVEL</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isSsdRed
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : isSsdAmber
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {ssdLevel}
              </span>
              <span
                className={`font-bold ${
                  isSsdRed ? 'text-rose-400' : isSsdAmber ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {pulseData.ssdWear}%
              </span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isSsdRed ? 'bg-rose-500' : isSsdAmber ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, pulseData.ssdWear * 10))}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>
              {isSsdRed ? 'Critical Wear Warn' : isSsdAmber ? 'Elevated Wear Warn' : '99.18% Life Remaining'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isSsdRed ? 'bg-rose-500 animate-ping' : isSsdAmber ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          </div>
        </div>

        {/* Extended Metric 2: Voltage Stability with Color-Coded Indicator (Green/Amber/Red) */}
        <div
          className={`p-5 rounded-[24px] backdrop-blur-xl space-y-2 transition-all duration-300 ${
            isVoltRed
              ? 'bg-rose-950/40 border-2 border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              : isVoltAmber
              ? 'bg-amber-950/30 border-2 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-[#0b0e1a]/70 border border-blue-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Gauge
                className={`w-3.5 h-3.5 ${
                  isVoltRed ? 'text-rose-400 animate-bounce' : isVoltAmber ? 'text-amber-400' : 'text-blue-400'
                }`}
              />
              <span>VOLTAGE STABILITY</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isVoltRed
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : isVoltAmber
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                }`}
              >
                {voltLevel}
              </span>
              <span
                className={`font-bold ${
                  isVoltRed ? 'text-rose-400' : isVoltAmber ? 'text-amber-400' : 'text-blue-400'
                }`}
              >
                {pulseData.voltageStability}%
              </span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isVoltRed ? 'bg-rose-500' : isVoltAmber ? 'bg-amber-400' : 'bg-blue-400'
              }`}
              style={{ width: `${pulseData.voltageStability}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>
              {isVoltRed ? 'DC Rail Drop Alert' : isVoltAmber ? 'Voltage Jitter Warn' : '12.01V DC • ±0.01% Ripple'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isVoltRed ? 'bg-rose-500 animate-ping' : isVoltAmber ? 'bg-amber-400' : 'bg-blue-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Visual Hardware Grid: CPU & Memory Health Matrix using Telemetry Snapshots */}
      {/* Sub-Kelvin 3D Nebula */}
      <SubKelvinNebula />

      <PulseHardwareGrid
        snapshots={snapshots}
        currentCpu={pulseData.cpu}
        currentMemory={pulseData.memory}
        currentCryo={pulseData.cryo}
        currentSsdWear={pulseData.ssdWear}
        currentVoltageStability={pulseData.voltageStability}
      />

      {/* D3.JS LINE CHART: Hardware Anomaly Overlay & System Heartbeat Timeline */}
      <PulseAnomalyHeartbeatD3Chart
        snapshots={snapshots}
        onAddHardwareSnapshot={onAddHardwareSnapshot}
        onAddSystemEvent={onAddSystemEvent}
      />

      {/* RECHARTS AREACHART: Atmospheric Entropy vs. CPU Thermal Variance Chaotic Stability Overlay */}
      <AtmosphericEntropyThermalAreaChart
        onTriggerAlert={(msg) => {
          const simulatedSnap = TelemetryAnomalyObserver.generateSimulatedOutlierSnapshot('thermal', snapshots.length + 1);
          if (onAddHardwareSnapshot) {
            onAddHardwareSnapshot(simulatedSnap);
          }
          if (onAddSystemEvent) {
            onAddSystemEvent(
              'TELEMETRY_ANOMALY',
              'Atmospheric Entropy & Thermal Surge Detected',
              msg,
              'SSoT Thermodynamic & Quantum Drift Invariant',
              'warning',
              simulatedSnap.sealedHash
            );
          }
        }}
      />

      {/* RECHARTS TREND LINE GRAPH: 24-Hour Civilization Intelligence Node Activity with Smooth Pulsing Stream Animation */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-cyan-500/20 backdrop-blur-xl space-y-5 shadow-2xl relative overflow-hidden chart-pulse-container">
        {/* Real-time Stream Activity Scanning Beam */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
          <div className="w-48 h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent stream-radar-beam" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 beacon-pulse" />
                <span className="absolute w-4 h-4 rounded-full bg-cyan-400/30 animate-ping" />
              </div>
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                Civilization Intelligence Node Activity (Past 24 Hours)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                STREAM ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Live QOps Throughput, Post-Quantum Coherence, Neural Latency, Active Cluster Nodes & Forensic Hardware Metrics
            </p>
          </div>

          {/* Metric View Selector Buttons including SSD Wear and Voltage Stability */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {[
              { id: 'all', label: 'All Metrics' },
              { id: 'qops', label: 'QOps (QOps/s)' },
              { id: 'coherence', label: 'Coherence (%)' },
              { id: 'latency', label: 'Latency (ms)' },
              { id: 'nodes', label: 'Active Nodes' },
              { id: 'ssdWear', label: 'SSD Wear (%)' },
              { id: 'voltageStability', label: 'Voltage (%)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  playTone(600, 0.04);
                  setActiveMetric(m.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  activeMetric === m.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/8 hover:bg-white/10'
                }`}
              >
                {m.label}
              </button>
            ))}

            {/* 10-Minute Projection Toggle Button */}
            <button
              onClick={() => {
                playTone(640, 0.04);
                setShowProjection(!showProjection);
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                showProjection
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-bold'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/8 hover:bg-white/10'
              }`}
              title="Estimate system load trajectory for next 10 minutes using OLS regression"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>10-Min Projection</span>
              {showProjection && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
            </button>

            {/* Block #849202 Baseline Chart Overlay Toggle */}
            <button
              id="pulseview-chart-historical-overlay-toggle-btn"
              onClick={() => {
                playTone(620, 0.04);
                setShowHistoricalBaselineOnChart(!showHistoricalBaselineOnChart);
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                showHistoricalBaselineOnChart
                  ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)] font-bold'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/8 hover:bg-white/10'
              }`}
              title="Toggle Frozen Core Block #849202 Baseline Reference on chart"
            >
              <span>🧊</span>
              <span>Baseline #849202</span>
              {showHistoricalBaselineOnChart && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />}
            </button>
          </div>
        </div>

        {/* 10-Minute Projection Insights Banner */}
        {showProjection && (
          <div className="mx-1 mb-2 p-3 rounded-2xl bg-gradient-to-r from-rose-950/30 via-black/40 to-cyan-950/20 border border-rose-500/25 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-zinc-300 font-bold">10-Minute Predictive Horizon:</span>
              <span className="text-rose-300 font-bold">
                T+10m Forecast = {projectionStats.projectedLoad10m} QOps/s ({projectionStats.projectedCpu10m}% CPU)
              </span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
              <span>
                Trend Slope:{' '}
                <strong className={projectionStats.trendSlope >= 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {projectionStats.trendSlope >= 0 ? '+' : ''}{projectionStats.trendSlope} QOps/min
                </strong>
              </span>
              <span>
                Model Fit: <strong className="text-cyan-300">{projectionStats.modelFit}</strong>
              </span>
              <span>
                Historical Anchors: <strong className="text-white">{projectionStats.anchorCount} Snapshots</strong>
              </span>
            </div>
          </div>
        )}

        {/* Recharts Line / Area Visualizer with Glowing Filter */}
        <div className="h-80 w-full pt-2 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
                <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#ffffff15' }}
              />
              <YAxis
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#ffffff15' }}
                domain={
                  activeMetric === 'qops'
                    ? [800, 880]
                    : activeMetric === 'coherence'
                    ? [99.85, 100]
                    : activeMetric === 'latency'
                    ? [0.9, 1.5]
                    : activeMetric === 'nodes'
                    ? [110, 150]
                    : activeMetric === 'ssdWear'
                    ? [0.7, 1.0]
                    : activeMetric === 'voltageStability'
                    ? [99.9, 100]
                    : ['auto', 'auto']
                }
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
              />

              {/* Baseline Reference */}
              <ReferenceLine y={850} stroke="#06B6D4" strokeDasharray="3 3" opacity={0.3} label="" />

              {/* Frozen Core Block #849202 Baseline Reference */}
              {showHistoricalBaselineOnChart && (
                <ReferenceLine
                  y={851.9}
                  stroke="#D4AF37"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Frozen Core #849202 (851.9 QOPS)',
                    fill: '#D4AF37',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'qops') && (
                <Line
                  type="monotone"
                  dataKey="qops"
                  name="QOps / Second"
                  unit="QOps/s"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#06B6D4', strokeWidth: 1, stroke: '#07080F' }}
                  activeDot={{ r: 6, fill: '#06B6D4', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'coherence') && (
                <Line
                  type="monotone"
                  dataKey="coherence"
                  name="Superposition Coherence (%)"
                  unit="%"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#8B5CF6', strokeWidth: 1, stroke: '#07080F' }}
                  activeDot={{ r: 5, fill: '#8B5CF6' }}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'latency') && (
                <Line
                  type="monotone"
                  dataKey="latency"
                  name="Kernel Latency (ms)"
                  unit="ms"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#F59E0B', strokeWidth: 1, stroke: '#07080F' }}
                  activeDot={{ r: 5, fill: '#F59E0B' }}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'nodes') && (
                <Line
                  type="monotone"
                  dataKey="nodes"
                  name="Active Intelligence Nodes"
                  unit="Clusters"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#10B981', strokeWidth: 1, stroke: '#07080F' }}
                  activeDot={{ r: 5, fill: '#10B981' }}
                />
              )}

              {activeMetric === 'ssdWear' && (
                <Line
                  type="monotone"
                  dataKey="ssdWear"
                  name="SSD Wear Level (%)"
                  unit="%"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#14B8A6', strokeWidth: 1, stroke: '#07080F' }}
                  activeDot={{ r: 6, fill: '#14B8A6', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {activeMetric === 'voltageStability' && (
                <Line
                  type="monotone"
                  dataKey="voltageStability"
                  name="Voltage Stability (%)"
                  unit="%"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3B82F6', strokeWidth: 1, stroke: '#07080F' }}
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {/* Future-State 10-Minute Projection Line (OLS / Telemetry Horizon) */}
              {showProjection && (
                <Line
                  type="monotone"
                  dataKey="projectedLoad"
                  name="10-Min Projected Load (OLS Model)"
                  unit="QOps/s"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 3.5, fill: '#F43F5E', strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Highlights & Regional Cluster Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-[11px]">BANGKOK (BK01)</span>
              <div className="text-cyan-300 font-bold mt-0.5">54 Primary Nodes</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              SOVEREIGN HQ
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-[11px]">SINGAPORE (SG01)</span>
              <div className="text-violet-300 font-bold mt-0.5">42 Edge Relays</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
              ASEAN FABRIC
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-[11px]">TOKYO & ZURICH</span>
              <div className="text-emerald-300 font-bold mt-0.5">38 PQC Validators</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              FAIL-CLOSED
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <SystemHealthPulse snapshots={snapshots} />
      </div>

      {/* Live Waveform Oscilloscope & Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
              QOps & Latency Waveform Oscilloscope
            </span>
            <span className="text-xs font-mono text-cyan-400">{pulseData.qops} QOps/s</span>
          </div>

          <div className="h-48 rounded-2xl bg-black/40 border border-white/5 p-4 flex items-end gap-1.5 overflow-hidden">
            {Array.from({ length: 48 }).map((_, i) => {
              const h = 25 + Math.sin(i * 0.4 + Date.now() * 0.002) * 20 + Math.random() * 15;
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-cyan-500/30 to-cyan-400 rounded-t-sm transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ height: `${h}%` }}
                  title={`Sample #${i}: ${h.toFixed(1)}%`}
                  onClick={() => playTone(400 + i * 10, 0.04, 'sine', 0.02)}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>Sampling Window: 2,000ms</span>
            <span>Zero-packet loss detected</span>
          </div>
        </div>

        {/* Live System Log Feed */}
        <div className="lg:col-span-5 p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
              Live OpenTelemetry Stream
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>

          <div className="p-3 bg-black/50 rounded-2xl border border-white/5 font-mono text-[11px] space-y-2 max-h-48 overflow-y-auto">
            <div className="text-emerald-400">[08:28:12.546] SEALED: Block #849202 Merkle Hash 0x909ab814...</div>
            <div className="text-cyan-300">[08:28:12.536] VERIFIED: 10/10 Invariants passed (0.8% blast radius)</div>
            <div className="text-zinc-300">[08:28:12.522] OBSERVE: CPU stabilized to 41.2% • Span 16ch_5928a</div>
            <div className="text-zinc-400">[08:28:12.504] EXECUTE: Applied CPU_LIMIT=2.0 -&gt; 4.0 via Cloud Run</div>
            <div className="text-amber-300">[08:28:12.496] AUTHORIZE: Sovereign EP-001 Clearance Granted</div>
            <div className="text-zinc-500">[08:28:12.440] UNDERSTAND: Mapped claim to Knowledge Fabric c1</div>
          </div>
        </div>
      </div>

      {/* Critical Entropy Alert Visual Notification Banner (Triggers sidebar when > 15,000 KBps) */}
      <CriticalEntropyAlertNotification
        currentRateKBps={currentEntropyRateKBps}
        thresholdKBps={ZYRQUEN_ENTROPY_CONFIG.criticalThresholdKBps}
        onOpenSidebar={onOpenEventsSidebar}
        onTriggerSidebarAlert={handleTriggerSidebarEntropyAlert}
        isSimulatedLow={isSimulatedLowEntropy}
        onToggleSimulatedLow={setIsSimulatedLowEntropy}
      />

      {/* PulseView Active Entropy Telemetry Header & View-Switcher Toolbar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0c131d]/90 via-[#070b14]/85 to-[#04060b] border border-cyan-500/25 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                ACTIVE ENTROPY RATE TELEMETRY
              </span>
              <span className="text-[10px] text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                {entropyHorizon === '60m' ? 'LAST 60 MINUTES' : 'LAST 24 HOURS'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Real-time cryptographic vitality: {currentEntropyRateKBps.toLocaleString()} KBps • Threshold: 85 KBps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View-Switcher: Last 60 Minutes vs Last 24 Hours */}
          <div
            id="pulseview-entropy-view-switcher"
            className="flex items-center bg-black/60 border border-cyan-500/30 rounded-xl p-1 text-xs"
          >
            <button
              id="pulseview-horizon-toggle-60m"
              onClick={() => {
                setEntropyHorizon('60m');
                playTone(560, 0.04);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                entropyHorizon === '60m'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Display Last 60 Minutes of Entropy Telemetry"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Last 60 Minutes</span>
            </button>
            <button
              id="pulseview-horizon-toggle-24h"
              onClick={() => {
                setEntropyHorizon('24h');
                playTone(620, 0.04);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                entropyHorizon === '24h'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Display Last 24 Hours of Entropy Telemetry"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Last 24 Hours</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            id="pulseview-export-csv-btn"
            onClick={() => exportActiveEntropyCsv(entropyHistory60m, 'zyrquen-entropy-60min-telemetry')}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            title="Download current 60-minute Active Entropy Rate data points for external analysis"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3D Procedural Particle Nebula */}
      <EntropyFluxNebula />

      {/* 2D Spatiotemporal Entropy Distribution Heatmap (Recharts) */}
      <EntropyGridHeatmap />

      {/* Sovereign Quantum Pack v1.2 LTS: Quantum Entropy Drift Recharts Component */}
      <div className="my-6">
        <QuantumEntropyDriftChart />
      </div>

      {/* D3 Real-Time Active Entropy Rate (KBps) & Stability Monitor */}
      <ActiveEntropyRateMonitor
        timeHorizon={entropyHorizon}
        onTimeHorizonChange={setEntropyHorizon}
        onCurrentRateChange={setCurrentEntropyRateKBps}
        onHistoryChange={setEntropyHistory60m}
      />

      {/* Thai Legal Search & PQC Insights Analytics Panel */}
      <SearchInsightsPanel />

      {/* Cryptography & Merkle Proof Rolling Stream Component */}
      <CryptographyStream />
    </>
  )}
</div>
  );
};
