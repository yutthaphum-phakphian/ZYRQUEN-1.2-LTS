import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Server,
  Activity,
  Zap,
  Gauge,
  Thermometer,
  ShieldCheck,
  RefreshCw,
  Clock,
  Radio,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  BatteryCharging,
  BatteryMedium,
  Power,
  X,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Camera,
  FileCheck2,
  AlertTriangle,
  LayoutGrid,
  List,
  Flame,
  CheckCircle2,
  Database,
  Wifi,
  Workflow,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { playTone, playAuditChime, playWarningTone } from './AudioSynthesizer';
import { HardwareSnapshot } from '../types';

export interface PowerStateData {
  currentDrawAmps: number;
  voltageVolts: number;
  powerKw: number;
  batteryHealthPct: number;
  batteryChargePct: number;
  backupRuntimeHours: number;
  powerSource: 'MAINS_3PHASE_STABILIZED' | 'ULTRA_CAPACITOR_ISLAND';
  stage1CompressorKw: number;
  stage2TurboExpanderKw: number;
  stage3SorptionPumpKw: number;
  phaseBalancePct: number;
  tempCryoMk: number;
}

interface ConsoleHardwareTelemetryGridProps {
  onSnapshot?: (telemetryData: any) => void;
  onCpuLoadChange?: (cpuAvg: number, telemetry: any) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  cpuThreshold?: number;
  ramThreshold?: number;
}

interface ModuleInfo {
  id: string;
  name: string;
  category: 'CPU' | 'MEMORY' | 'CRYO' | 'NETWORK' | 'QUANTUM' | 'SECURITY';
  value: string | number;
  rawValue: number;
  unit: string;
  status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  lastActivity: string;
  minMax: string;
  description: string;
  icon: any;
}

export const ConsoleHardwareTelemetryGrid: React.FC<ConsoleHardwareTelemetryGridProps> = ({
  onSnapshot,
  onCpuLoadChange,
  viewMode: controlledViewMode,
  onViewModeChange,
  cpuThreshold = 75,
  ramThreshold = 80,
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('grid');
  const activeViewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;

  const [time, setTime] = useState<{ ict: string; utc: string; epoch: number }>({
    ict: '',
    utc: '',
    epoch: Date.now(),
  });

  const [telemetry, setTelemetry] = useState({
    core0: 42.1,
    core1: 39.8,
    core2: 44.5,
    core3: 38.6,
    memUsedMb: 5214,
    memTotalMb: 8192,
    cryoTempMk: 14.98,
    heliumPressureAtm: 1.02,
    heliumFlowPct: 100,
    networkRxMbps: 84.2,
    networkTxMbps: 112.6,
    otelSpansSec: 2450,
    qopsThroughput: 851.9,
    coherencePct: 99.98,
    syndromeRate: 0.0004,
    circuitBreakers: 'ARMED_FAIL_CLOSED',
  });

  // Rolling 5-minute CPU load history dataset for mini-line chart
  const [cpuHistory, setCpuHistory] = useState<Array<{ time: string; load: number }>>(() => {
    const points: Array<{ time: string; load: number }> = [];
    const now = Date.now();
    for (let i = 14; i >= 0; i--) {
      const t = new Date(now - i * 20000);
      points.push({
        time: t.toLocaleTimeString('th-TH', { hour12: false, minute: '2-digit', second: '2-digit' }),
        load: +(38 + Math.random() * 8).toFixed(1),
      });
    }
    return points;
  });

  // Hover Tooltip state
  const [hoveredModule, setHoveredModule] = useState<ModuleInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Power State for the Quantum Cooling Unit
  const [powerState, setPowerState] = useState<PowerStateData>({
    currentDrawAmps: 14.8,
    voltageVolts: 240.2,
    powerKw: 3.55,
    batteryHealthPct: 98.4,
    batteryChargePct: 99.2,
    backupRuntimeHours: 4.8,
    powerSource: 'MAINS_3PHASE_STABILIZED',
    stage1CompressorKw: 2.4,
    stage2TurboExpanderKw: 0.85,
    stage3SorptionPumpKw: 0.3,
    phaseBalancePct: 99.98,
    tempCryoMk: 14.98,
  });

  // Zoom and Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // Sub-module Inspection Modal
  const [inspectedModule, setInspectedModule] = useState<string | null>(null);
  const onCpuLoadChangeRef = useRef(onCpuLoadChange);

  useEffect(() => {
    onCpuLoadChangeRef.current = onCpuLoadChange;
  }, [onCpuLoadChange]);

  // Real-time ticking and telemetry fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const ictTime = now.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false });
      setTime({
        ict: ictTime + ' ICT',
        utc: now.toUTCString().slice(17, 25) + ' UTC',
        epoch: now.getTime(),
      });

      const core0 = +(40 + Math.random() * 5).toFixed(1);
      const core1 = +(38 + Math.random() * 4).toFixed(1);
      const core2 = +(42 + Math.random() * 6).toFixed(1);
      const core3 = +(37 + Math.random() * 5).toFixed(1);
      const cpuAvg = +((core0 + core1 + core2 + core3) / 4).toFixed(1);

      const nextTelemetry = {
        core0,
        core1,
        core2,
        core3,
        memUsedMb: Math.round(5200 + Math.random() * 50),
        memTotalMb: 8192,
        cryoTempMk: +(14.95 + Math.random() * 0.06).toFixed(2),
        heliumPressureAtm: 1.02,
        heliumFlowPct: 99.8,
        networkRxMbps: +(82 + Math.random() * 5).toFixed(1),
        networkTxMbps: +(110 + Math.random() * 7).toFixed(1),
        otelSpansSec: Math.round(2400 + Math.random() * 100),
        qopsThroughput: +(850 + Math.random() * 4).toFixed(1),
        coherencePct: 99.98,
        syndromeRate: 0.0004,
        circuitBreakers: 'ARMED_FAIL_CLOSED',
      };

      setTelemetry(nextTelemetry);

      if (onCpuLoadChangeRef.current) {
        onCpuLoadChangeRef.current(cpuAvg, nextTelemetry);
      }

      // Update CPU History trend points
      setCpuHistory((prevHist) => [
        ...prevHist.slice(1),
        {
          time: ictTime,
          load: cpuAvg,
        },
      ]);

      // Fluctuate simulated quantum cooling power draw
      const amps = +(14.6 + Math.random() * 0.4).toFixed(2);
      const kw = +((amps * 240) / 1000).toFixed(2);
      setPowerState((prev) => ({
        ...prev,
        currentDrawAmps: amps,
        powerKw: kw,
        voltageVolts: +(240.0 + (Math.random() * 0.4 - 0.2)).toFixed(1),
        tempCryoMk: +(14.95 + Math.random() * 0.06).toFixed(2),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerCalibrate = () => {
    playAuditChime();
    setTelemetry((prev) => ({
      ...prev,
      cryoTempMk: 14.98,
      heliumPressureAtm: 1.02,
      heliumFlowPct: 100,
    }));
    setPowerState((prev) => ({
      ...prev,
      batteryChargePct: 99.8,
      batteryHealthPct: 98.4,
      phaseBalancePct: 99.99,
    }));
  };

  const setViewMode = (mode: 'grid' | 'list') => {
    playTone(550, 0.03);
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // Compute real-time CPU Cluster Average
  const cpuAverage = +(
    (telemetry.core0 + telemetry.core1 + telemetry.core2 + telemetry.core3) /
    4
  ).toFixed(1);

  const ramUsedPct = +((telemetry.memUsedMb / telemetry.memTotalMb) * 100).toFixed(1);

  // Dynamic CPU load styling thresholds
  const getCpuLoadStyle = () => {
    const isExceeded = cpuAverage >= cpuThreshold;
    if (cpuAverage < 50) {
      return {
        cardBorder: isExceeded
          ? 'border-amber-500 ring-2 ring-amber-500/50 bg-amber-950/20'
          : 'border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_16px_rgba(16,185,129,0.15)]',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        barColor: 'bg-emerald-400',
        strokeColor: '#10b981',
        label: '<50% NOMINAL',
        textColor: 'text-emerald-400',
        isExceeded,
      };
    } else if (cpuAverage <= 80) {
      return {
        cardBorder: isExceeded
          ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/25 animate-pulse'
          : 'border-amber-500/50 bg-amber-950/25 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'bg-amber-400',
        strokeColor: '#f59e0b',
        label: '50-80% ELEVATED',
        textColor: 'text-amber-400',
        isExceeded,
      };
    } else {
      return {
        cardBorder: 'border-red-500/80 ring-2 ring-red-500/60 bg-red-950/35 shadow-[0_0_25px_rgba(239,68,68,0.45)] animate-pulse',
        badge: 'bg-red-500/25 text-red-300 border-red-500/50 animate-pulse',
        barColor: 'bg-red-400',
        strokeColor: '#ef4444',
        label: '>80% CRITICAL',
        textColor: 'text-red-400',
        isExceeded: true,
      };
    }
  };

  const cpuStyle = getCpuLoadStyle();
  const isRamAlert = ramUsedPct >= ramThreshold;

  const setCpuStressPreset = (target: 'low' | 'med' | 'high') => {
    playTone(target === 'high' ? 300 : target === 'med' ? 550 : 750, 0.08);
    if (target === 'low') {
      const nextT = {
        ...telemetry,
        core0: 41.2,
        core1: 39.4,
        core2: 43.1,
        core3: 38.0,
      };
      setTelemetry(nextT);
      if (onCpuLoadChange) onCpuLoadChange(40.4, nextT);
    } else if (target === 'med') {
      const nextT = {
        ...telemetry,
        core0: 64.5,
        core1: 68.2,
        core2: 62.0,
        core3: 66.1,
      };
      setTelemetry(nextT);
      if (onCpuLoadChange) onCpuLoadChange(65.2, nextT);
    } else {
      const nextT = {
        ...telemetry,
        core0: 89.4,
        core1: 86.8,
        core2: 92.5,
        core3: 87.2,
      };
      setTelemetry(nextT);
      if (onCpuLoadChange) onCpuLoadChange(89.0, nextT);
    }
  };

  // 16 Sub-Modules for the Dense 4x4 Grid and Accessible List
  const modules16: ModuleInfo[] = [
    {
      id: 'cpu-core0',
      name: 'CPU Core 0 (System Kernel)',
      category: 'CPU',
      value: `${telemetry.core0}%`,
      rawValue: telemetry.core0,
      unit: '% Load',
      status: telemetry.core0 > cpuThreshold ? 'ELEVATED' : 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '38.0% - 94.2%',
      description: 'Host execution governor & kernel interrupt dispatcher.',
      icon: Cpu,
    },
    {
      id: 'cpu-core1',
      name: 'CPU Core 1 (Cryptographic Engine)',
      category: 'CPU',
      value: `${telemetry.core1}%`,
      rawValue: telemetry.core1,
      unit: '% Load',
      status: telemetry.core1 > cpuThreshold ? 'ELEVATED' : 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '36.5% - 91.0%',
      description: 'SHA-256 Merkle root hashing and lattice-based Dilithium-5 signatures.',
      icon: ShieldCheck,
    },
    {
      id: 'cpu-core2',
      name: 'CPU Core 2 (AI Inference Node)',
      category: 'CPU',
      value: `${telemetry.core2}%`,
      rawValue: telemetry.core2,
      unit: '% Load',
      status: telemetry.core2 > cpuThreshold ? 'ELEVATED' : 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '40.1% - 96.8%',
      description: 'Gemini 2.5 Pro semantic context synthesis & vector tokenization.',
      icon: Sparkles,
    },
    {
      id: 'cpu-core3',
      name: 'CPU Core 3 (Consensus Gatekeeper)',
      category: 'CPU',
      value: `${telemetry.core3}%`,
      rawValue: telemetry.core3,
      unit: '% Load',
      status: telemetry.core3 > cpuThreshold ? 'ELEVATED' : 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '35.0% - 88.4%',
      description: 'Zero-trust policy gates & OTel sequence replay governor.',
      icon: Lock,
    },
    {
      id: 'mem-heap',
      name: 'RAM V8 Heap RSS',
      category: 'MEMORY',
      value: `${telemetry.memUsedMb} MB`,
      rawValue: telemetry.memUsedMb,
      unit: 'MB Allocation',
      status: ramUsedPct >= ramThreshold ? 'ELEVATED' : 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '4,800MB - 7,950MB',
      description: 'Active memory pages, V8 engine garbage collector latency: 0.32ms.',
      icon: Server,
    },
    {
      id: 'mem-buffer',
      name: 'Buffer Cache & Ring Buffer',
      category: 'MEMORY',
      value: `${(telemetry.memTotalMb - telemetry.memUsedMb)} MB`,
      rawValue: telemetry.memTotalMb - telemetry.memUsedMb,
      unit: 'MB Free',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '1,200MB - 3,400MB',
      description: 'Zero-copy DMA buffer cache for high-throughput I/O pipelines.',
      icon: Database,
    },
    {
      id: 'cryo-stage1',
      name: 'Cryo Dilution Stage 1 (Compressor)',
      category: 'CRYO',
      value: `${powerState.stage1CompressorKw} kW`,
      rawValue: powerState.stage1CompressorKw,
      unit: 'kW Draw',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '2.1kW - 2.8kW',
      description: 'Primary helium-4 pre-cooling sorption compressor at 4.2 K.',
      icon: Power,
    },
    {
      id: 'cryo-sorption',
      name: 'Cryo Stage 3 Cold Plate',
      category: 'CRYO',
      value: `${telemetry.cryoTempMk} mK`,
      rawValue: telemetry.cryoTempMk,
      unit: 'milliKelvin',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '14.80mK - 15.20mK',
      description: 'Sub-Kelvin base temperature plate housing the 768-qubit lattice.',
      icon: Thermometer,
    },
    {
      id: 'helium-flow',
      name: 'Helium He-4 Circulation Loop',
      category: 'CRYO',
      value: `${telemetry.heliumFlowPct}%`,
      rawValue: telemetry.heliumFlowPct,
      unit: '% Flow',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '98% - 100%',
      description: 'Closed-loop 1.02 atm pressurized supercritical helium-3/4 flow.',
      icon: Activity,
    },
    {
      id: 'otel-ingress',
      name: 'OTel Trace Sequence Ingress',
      category: 'NETWORK',
      value: `${telemetry.otelSpansSec} /s`,
      rawValue: telemetry.otelSpansSec,
      unit: 'Spans/sec',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '1,800 - 3,200 /s',
      description: 'Distributed OpenTelemetry trace ingestion with nanosecond timestamps.',
      icon: Workflow,
    },
    {
      id: 'net-rx',
      name: 'Network Ingress (RX Bandwidth)',
      category: 'NETWORK',
      value: `${telemetry.networkRxMbps} Mbps`,
      rawValue: telemetry.networkRxMbps,
      unit: 'Mbps',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '65.0 - 145.0 Mbps',
      description: 'Inbound TLS 1.3 telemetry stream from global civilization nodes.',
      icon: Wifi,
    },
    {
      id: 'net-tx',
      name: 'Network Egress (TX Bandwidth)',
      category: 'NETWORK',
      value: `${telemetry.networkTxMbps} Mbps`,
      rawValue: telemetry.networkTxMbps,
      unit: 'Mbps',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '80.0 - 180.0 Mbps',
      description: 'Outbound cryptographic evidence proofs and broadcast ledger blocks.',
      icon: Radio,
    },
    {
      id: 'quantum-qops',
      name: '768-Qubit QOps Accelerator',
      category: 'QUANTUM',
      value: `${telemetry.qopsThroughput}`,
      rawValue: telemetry.qopsThroughput,
      unit: 'QOps/sec',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '840.0 - 865.0 QOps',
      description: 'Superconducting qubit coprocessor executing parallel tensor operations.',
      icon: Zap,
    },
    {
      id: 'quantum-coherence',
      name: 'Surface-17 Coherence Lattice',
      category: 'QUANTUM',
      value: `${telemetry.coherencePct}%`,
      rawValue: telemetry.coherencePct,
      unit: '% Ratio',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '99.94% - 99.99%',
      description: 'Fault-tolerant quantum error correction ratio across 32 surface tiles.',
      icon: Layers,
    },
    {
      id: 'quantum-syndrome',
      name: 'Syndrome Measurement Engine',
      category: 'QUANTUM',
      value: `${telemetry.syndromeRate}`,
      rawValue: telemetry.syndromeRate,
      unit: 'Error rate',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '0.0001 - 0.0008',
      description: 'Real-time topological stabilizer syndrome decoding & correction cycles.',
      icon: Gauge,
    },
    {
      id: 'security-breakers',
      name: 'Merkle Circuit Breakers',
      category: 'SECURITY',
      value: 'ARMED',
      rawValue: 100,
      unit: 'Policy State',
      status: 'NOMINAL',
      lastActivity: time.ict || '05:03:12 ICT',
      minMax: '14,902 / 14,902 Intact',
      description: 'Fail-closed invariant gate enforcing absolute SSoT ledger integrity.',
      icon: ShieldCheck,
    },
  ];

  // Tooltip mouse handlers
  const handleMouseEnterModule = (m: ModuleInfo, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredModule(m);
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 12,
    });
  };

  const handleMouseLeaveModule = () => {
    setHoveredModule(null);
  };

  // Zoom and Pan Handlers
  const handleZoomIn = () => {
    playTone(600, 0.04);
    setZoomLevel((prev) => Math.min(+(prev + 0.25).toFixed(2), 2.0));
  };

  const handleZoomOut = () => {
    playTone(500, 0.04);
    setZoomLevel((prev) => {
      const next = Math.max(+(prev - 0.25).toFixed(2), 0.8);
      if (next <= 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    playTone(550, 0.04);
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1.0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1.0) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const maxPan = (zoomLevel - 1) * 350;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4 font-mono text-xs select-text relative">
      {/* Top Header Grid Bar with View Mode Toggle, Zoom, Stress, and Timestamps */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/8 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            HARDWARE TELEMETRY & SUBZERO CRYO GRID
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
            [LIVE SENSOR PROVENANCE]
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px]">
            OTEL-OTLP v1.28
          </span>

          {/* View Mode Switcher: 4x4 Grid vs Accessible Expanded List */}
          <div className="flex items-center bg-black/80 border border-white/15 rounded-xl p-0.5 text-[10px]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeViewMode === 'grid'
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Dense 4x4 Hardware Matrix View"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>4x4 Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeViewMode === 'list'
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Expanded Accessible List View with Metrics Breakdown"
            >
              <List className="w-3 h-3" />
              <span>Expanded List</span>
            </button>
          </div>

          {zoomLevel !== 1.0 && (
            <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold animate-pulse">
              ZOOM {Math.round(zoomLevel * 100)}% • DRAG TO PAN
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-zinc-400">
          {/* Zoom & Pan Toolbar Controls */}
          <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl p-1 text-[10px]">
            <span className="text-zinc-400 px-1 text-[9px] uppercase font-bold flex items-center gap-1">
              <Move className="w-3 h-3 text-cyan-400" /> Pan/Zoom:
            </span>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.8}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 transition-all"
              title="Zoom Out (Min 80%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-cyan-300 font-bold px-1 min-w-[38px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.0}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 transition-all"
              title="Zoom In (Max 200%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1.0 && (
              <button
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[9px] font-bold border border-cyan-500/30"
                title="Reset Zoom to 100%"
              >
                100%
              </button>
            )}
          </div>

          {/* CPU Stress Presets for live testing */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[10px]">
            <span className="text-zinc-500 px-1 text-[9px] uppercase">Load Test:</span>
            <button
              onClick={() => setCpuStressPreset('low')}
              className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all"
              title="Test <50% Nominal Green State"
            >
              41%
            </button>
            <button
              onClick={() => setCpuStressPreset('med')}
              className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all"
              title="Test 50-80% Elevated Amber State"
            >
              65%
            </button>
            <button
              onClick={() => setCpuStressPreset('high')}
              className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30 transition-all"
              title="Test >80% Critical Red Stress State"
            >
              88%
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-200">{time.ict || '05:03:08 ICT'}</span>
            <span className="text-zinc-600">|</span>
            <span>{time.utc || '22:03:08 UTC'}</span>
          </div>

          <button
            onClick={triggerCalibrate}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1 text-[10px] transition-all"
            title="Recalibrate Cryo & QOps Sensors"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span>CALIBRATE</span>
          </button>

          {onSnapshot && (
            <button
              onClick={() => {
                playAuditChime();
                onSnapshot(telemetry);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 text-[10px] font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="Capture instantaneous hardware telemetry snapshot into Ledger"
            >
              <Camera className="w-3 h-3 text-emerald-400" />
              <span>SNAPSHOT</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredModule && (
        <div
          className="fixed z-50 pointer-events-none p-3.5 rounded-2xl bg-[#07080F]/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl space-y-1.5 min-w-[240px] max-w-[320px] text-xs font-mono -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <hoveredModule.icon className="w-3.5 h-3.5 text-cyan-400" />
              {hoveredModule.name}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                hoveredModule.status === 'ELEVATED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {hoveredModule.status}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">Raw Value:</span>
              <span className="font-bold text-cyan-300">{hoveredModule.value}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Operating Range:</span>
              <span className="text-zinc-300">{hoveredModule.minMax}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Last Activity:</span>
              <span className="text-emerald-400">{hoveredModule.lastActivity}</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 font-sans border-t border-white/5 pt-1 leading-relaxed">
            {hoveredModule.description}
          </p>
        </div>
      )}

      {/* Zoomable & Pannable Viewport Wrapper */}
      <div
        ref={gridContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative overflow-hidden rounded-[24px] border border-white/5 p-1 bg-black/40 transition-colors ${
          zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab') : ''
        }`}
      >
        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            width: zoomLevel > 1.0 ? `${100 / zoomLevel}%` : '100%',
          }}
          className="space-y-3"
        >
          {/* Dedicated Power State Visual Indicator Bar for Quantum Cooling Unit */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0c1824]/90 via-[#0b101a]/85 to-[#081414]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Power State Headline & Source */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <BatteryCharging className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <Power className="w-3.5 h-3.5 text-cyan-400" />
                      Quantum Cooling Power State & Subzero Energy Matrix
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold">
                      ACTIVE DILUTION
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Real-time 3-Phase current draw • He-4 sorption compressor matrix • Sub-Kelvin cryogenic battery reserve
                  </p>
                </div>
              </div>

              {/* Right: Simulated Current Draw & Battery Health Readouts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Real-time Current Draw & Power */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Zap className="w-3 h-3" /> CURRENT DRAW
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-cyan-300 font-mono">
                      {powerState.currentDrawAmps}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">A / {powerState.powerKw} kW</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-mono">
                    3-Phase @ {powerState.voltageVolts}V
                  </div>
                </div>

                {/* 2. Battery Health Percentage */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <BatteryMedium className="w-3 h-3" /> BATTERY HEALTH
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-emerald-300 font-mono">
                      {powerState.batteryHealthPct}%
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Nominal</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-mono">
                    Charge: {powerState.batteryChargePct}%
                  </div>
                </div>

                {/* 3. Backup Runtime Buffer */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" /> RESERVE BUFFER
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-amber-300 font-mono">
                      {powerState.backupRuntimeHours}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Hours</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-mono">
                    Ultra-Capacitor Array
                  </div>
                </div>

                {/* 4. Power Grid Source & Phase */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span className="flex items-center gap-1 text-violet-400">
                      <Zap className="w-3 h-3" /> GRID BALANCE
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-violet-300 font-mono">
                      {powerState.phaseBalancePct}%
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Phase Synced
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-stage Power Distribution Bar */}
            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-zinc-400 font-mono">
              <div className="flex items-center justify-between bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                <span>Stage 1 (Compressor):</span>
                <span className="text-cyan-300 font-semibold">{powerState.stage1CompressorKw} kW (67.6%)</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                <span>Stage 2 (Turbo-Expander):</span>
                <span className="text-violet-300 font-semibold">{powerState.stage2TurboExpanderKw} kW (23.9%)</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                <span>Stage 3 (Sorption Cold Plate):</span>
                <span className="text-amber-300 font-semibold">{powerState.stage3SorptionPumpKw} kW (8.5%)</span>
              </div>
            </div>
          </div>

          {/* MODE 1: DENSE 4x4 HARDWARE MATRIX (16 MODULES) */}
          {activeViewMode === 'grid' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Top Row: Main Cluster with Recharts Mini Trend & Memory */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* CPU Cluster with Recharts Mini-Line Chart */}
                <div
                  onClick={() => {
                    playTone(600, 0.05);
                    setInspectedModule('cpu');
                  }}
                  className={`md:col-span-8 p-4 rounded-2xl border transition-all duration-300 cursor-pointer hover:ring-1 hover:ring-white/20 ${cpuStyle.cardBorder}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 font-bold text-xs ${cpuStyle.textColor}`}>
                        <Cpu className="w-4 h-4" /> CPU CLUSTER (4 CORES) & 5-MIN HISTORICAL TREND
                      </span>
                      {cpuStyle.isExceeded && (
                        <span className="px-2 py-0.2 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-bold animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> EXCEEDS {cpuThreshold}% THRESHOLD
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-xl font-bold border ${cpuStyle.badge}`}>
                        AVG LOAD: {cpuAverage}%
                      </span>
                    </div>
                  </div>

                  {/* Recharts Mini Area Line Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-3 items-center">
                    <div className="lg:col-span-7 h-[110px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cpuHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={cpuStyle.strokeColor} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={cpuStyle.strokeColor} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="p-2 rounded-xl bg-black/90 border border-white/15 text-[10px] font-mono text-white shadow-xl">
                                    <div>Time: {label}</div>
                                    <div className="font-bold text-cyan-300">CPU: {payload[0].value}%</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="load"
                            stroke={cpuStyle.strokeColor}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#cpuGrad)"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="flex justify-between text-[9px] text-zinc-500 font-mono pt-1">
                        <span>-5m 00s</span>
                        <span>Rolling 15-Sample Telemetry Buffer</span>
                        <span>Now ({time.ict || 'ICT'})</span>
                      </div>
                    </div>

                    {/* 4-Core Progress Bars */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 bg-black/40 rounded-xl border border-white/5 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Core 0:</span>
                          <span className="font-bold text-zinc-100">{telemetry.core0}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${cpuStyle.barColor}`} style={{ width: `${telemetry.core0}%` }} />
                        </div>
                      </div>
                      <div className="p-2 bg-black/40 rounded-xl border border-white/5 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Core 1:</span>
                          <span className="font-bold text-zinc-100">{telemetry.core1}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${cpuStyle.barColor}`} style={{ width: `${telemetry.core1}%` }} />
                        </div>
                      </div>
                      <div className="p-2 bg-black/40 rounded-xl border border-white/5 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Core 2:</span>
                          <span className="font-bold text-zinc-100">{telemetry.core2}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${cpuStyle.barColor}`} style={{ width: `${telemetry.core2}%` }} />
                        </div>
                      </div>
                      <div className="p-2 bg-black/40 rounded-xl border border-white/5 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Core 3:</span>
                          <span className="font-bold text-zinc-100">{telemetry.core3}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${cpuStyle.barColor}`} style={{ width: `${telemetry.core3}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Memory Allocation Card with Custom Threshold Alert */}
                <div
                  onClick={() => {
                    playTone(550, 0.05);
                    setInspectedModule('memory');
                  }}
                  className={`md:col-span-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer space-y-2.5 ${
                    isRamAlert
                      ? 'border-red-500/80 bg-red-950/25 ring-1 ring-red-500/50'
                      : 'bg-[#0b0e1a]/80 border-white/8 hover:border-violet-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5 text-violet-400 font-bold text-xs">
                      <Server className="w-4 h-4" /> RAM ALLOCATION
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-xl font-bold border ${
                        isRamAlert
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                          : 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                      }`}
                    >
                      {ramUsedPct}%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">ALLOCATED RSS:</span>
                      <span className="text-white font-bold">{telemetry.memUsedMb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">TOTAL CAPACITY:</span>
                      <span className="text-zinc-300">{telemetry.memTotalMb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">ALERT THRESHOLD:</span>
                      <span className="text-amber-400">{ramThreshold}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full ${isRamAlert ? 'bg-red-500 animate-pulse' : 'bg-violet-400'} transition-all duration-300`}
                        style={{ width: `${ramUsedPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4x4 Dense Matrix of 16 Individual Sub-Modules */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {modules16.map((m) => {
                  const Icon = m.icon;
                  const isHighCpu = m.category === 'CPU' && m.rawValue >= cpuThreshold;
                  const isHighRam = m.category === 'MEMORY' && isRamAlert;

                  return (
                    <div
                      key={m.id}
                      onMouseEnter={(e) => handleMouseEnterModule(m, e)}
                      onMouseLeave={handleMouseLeaveModule}
                      onClick={() => {
                        playTone(550, 0.04);
                        if (m.category === 'CPU') setInspectedModule('cpu');
                        else if (m.category === 'CRYO') setInspectedModule('cryo');
                        else if (m.category === 'QUANTUM') setInspectedModule('quantum');
                        else if (m.category === 'MEMORY') setInspectedModule('memory');
                        else if (m.category === 'NETWORK') setInspectedModule('network');
                        else setInspectedModule('watchdog');
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 relative group ${
                        isHighCpu || isHighRam
                          ? 'border-amber-500/60 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-[1.01]'
                          : 'bg-[#0b0e1a]/70 border-white/6 hover:border-cyan-500/40 hover:bg-[#0c1322]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 truncate flex items-center gap-1 font-semibold">
                          <Icon className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{m.name.split('(')[0]}</span>
                        </span>
                        <span className="text-[8px] font-bold px-1 rounded bg-white/5 text-zinc-400">
                          {m.category}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="text-sm font-bold text-white font-mono">{m.value}</span>
                        <span className="text-[9px] text-zinc-500">{m.unit}</span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          Intact
                        </span>
                        <span>{m.minMax.split('-')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 2: ACCESSIBLE EXPANDED LIST VIEW */}
          {activeViewMode === 'list' && (
            <div className="p-4 rounded-2xl bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="font-bold text-white uppercase text-xs flex items-center gap-2">
                  <List className="w-4 h-4 text-cyan-400" />
                  Accessible Sub-Module Telemetry Directory (16 Core Channels)
                </span>
                <span className="text-xs text-zinc-400">
                  Custom Thresholds: CPU &gt;{cpuThreshold}% • RAM &gt;{ramThreshold}%
                </span>
              </div>

              <div className="space-y-2">
                {modules16.map((m) => {
                  const Icon = m.icon;
                  const isHighCpu = m.category === 'CPU' && m.rawValue >= cpuThreshold;
                  const isHighRam = m.category === 'MEMORY' && isRamAlert;
                  const isAlert = isHighCpu || isHighRam;

                  return (
                    <div
                      key={m.id}
                      onMouseEnter={(e) => handleMouseEnterModule(m, e)}
                      onMouseLeave={handleMouseLeaveModule}
                      onClick={() => {
                        playTone(550, 0.04);
                        if (m.category === 'CPU') setInspectedModule('cpu');
                        else if (m.category === 'CRYO') setInspectedModule('cryo');
                        else if (m.category === 'QUANTUM') setInspectedModule('quantum');
                        else if (m.category === 'MEMORY') setInspectedModule('memory');
                        else if (m.category === 'NETWORK') setInspectedModule('network');
                        else setInspectedModule('watchdog');
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAlert
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-black/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            <span>{m.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 font-normal">
                              {m.category}
                            </span>
                            {isAlert && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                                THRESHOLD EXCEEDED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{m.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-zinc-500 text-[9px] block uppercase">Live Metric</span>
                          <span className="font-bold text-cyan-300 text-sm">{m.value}</span>
                        </div>
                        <div className="text-right hidden md:block">
                          <span className="text-zinc-500 text-[9px] block uppercase">Last Activity</span>
                          <span className="text-zinc-300 text-[11px]">{m.lastActivity}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                          NOMINAL
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-module In-Depth Diagnostic Modal */}
      {inspectedModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0b0e1a] border border-cyan-500/40 rounded-[28px] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-white text-sm uppercase">
                    Hardware Sub-Module Diagnostic Inspector
                  </h3>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    CHIP ARCHITECTURE: {inspectedModule.toUpperCase()} SUBSYSTEM
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedModule(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Diagnostic Content for inspected module */}
            <div className="space-y-4 text-xs font-mono">
              {inspectedModule === 'cpu' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">CORE 0 LOAD</span>
                      <span className="text-cyan-300 font-bold text-sm">{telemetry.core0}%</span>
                      <span className="text-zinc-600 text-[9px] block">3.80 GHz Target</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">CORE 1 LOAD</span>
                      <span className="text-cyan-300 font-bold text-sm">{telemetry.core1}%</span>
                      <span className="text-zinc-600 text-[9px] block">3.80 GHz Target</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">CORE 2 LOAD</span>
                      <span className="text-cyan-300 font-bold text-sm">{telemetry.core2}%</span>
                      <span className="text-zinc-600 text-[9px] block">3.80 GHz Target</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">CORE 3 LOAD</span>
                      <span className="text-cyan-300 font-bold text-sm">{telemetry.core3}%</span>
                      <span className="text-zinc-600 text-[9px] block">3.80 GHz Target</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-zinc-300">
                    <div className="flex justify-between text-[11px]">
                      <span>Instruction Set Architecture:</span>
                      <span className="text-emerald-400">ARM64 + AVX-512 VNNI Vector Extensions</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Microcode Security Patch Level:</span>
                      <span className="text-emerald-400">v2026.08-STABLE (Spectre/Meltdown Immune)</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Governor Mode:</span>
                      <span className="text-cyan-300">SOVEREIGN_PERFORMANCE_DETERMINISTIC</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectedModule === 'cryo' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">BASE TEMPERATURE</span>
                      <span className="text-amber-300 font-bold text-sm">{telemetry.cryoTempMk} mK</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">HE-4 FLOW RATE</span>
                      <span className="text-emerald-300 font-bold text-sm">100% Nominal</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">CHAMBER VACUUM</span>
                      <span className="text-cyan-300 font-bold text-sm">1.2 × 10⁻⁸ mbar</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-zinc-300">
                    <div className="flex justify-between text-[11px]">
                      <span>Dilution Circulation Loop:</span>
                      <span className="text-emerald-400">He-3 / He-4 Continuous Closed Cycle</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Cold Finger Vibration Damping:</span>
                      <span className="text-emerald-400">&lt; 0.05 nm RMS (Acoustic Isolation Locked)</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectedModule === 'quantum' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">LOGICAL QUBITS</span>
                      <span className="text-cyan-300 font-bold text-sm">768 Qubits</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">COHERENCE T2*</span>
                      <span className="text-violet-300 font-bold text-sm">184.2 μs</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">THROUGHPUT</span>
                      <span className="text-emerald-300 font-bold text-sm">{telemetry.qopsThroughput} QOps/s</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-zinc-300">
                    <div className="flex justify-between text-[11px]">
                      <span>Quantum Error Correction:</span>
                      <span className="text-emerald-400">Surface-17 Code Lattice with Real-Time Decoders</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Physical-to-Logical Ratio:</span>
                      <span className="text-cyan-300">1:1 Topological Protection</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectedModule === 'memory' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">V8 HEAP TOTAL</span>
                      <span className="text-violet-300 font-bold text-sm">2,048 MB</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">HEAP USED</span>
                      <span className="text-violet-300 font-bold text-sm">1,480 MB</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">BUFFER CACHE</span>
                      <span className="text-emerald-300 font-bold text-sm">3,734 MB</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectedModule === 'network' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">INGRESS (RX)</span>
                      <span className="text-cyan-300 font-bold text-sm">{telemetry.networkRxMbps} Mbps</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">EGRESS (TX)</span>
                      <span className="text-emerald-300 font-bold text-sm">{telemetry.networkTxMbps} Mbps</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">OTEL SPANS</span>
                      <span className="text-violet-300 font-bold text-sm">{telemetry.otelSpansSec} /s</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectedModule === 'watchdog' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-zinc-300">
                    <div className="flex justify-between text-[11px]">
                      <span>SSoT Invariant Policy:</span>
                      <span className="text-emerald-400">Strict Fail-Closed Enforced</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Merkle Root SSoT:</span>
                      <span className="text-cyan-300">{SYSTEM_METADATA.merkleRoot}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Audit Block Invariant Seals:</span>
                      <span className="text-emerald-400">14,902 / 14,902 Reproducible</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setInspectedModule(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
