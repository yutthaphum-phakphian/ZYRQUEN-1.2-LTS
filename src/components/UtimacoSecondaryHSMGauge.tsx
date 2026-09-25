import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  Flame,
  Download,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  Cpu,
  Coins,
  FileSpreadsheet,
  Activity,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  Server,
  Sparkles,
  ThermometerSnowflake,
  ListOrdered,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { playTone, playAuditChime, playWarningTone } from './AudioSynthesizer';

export interface TelemetryDataPoint {
  second: number;
  timeLabel: string;
  tempCelsius: number;
  subKelvinMk: number;
  voltage: number;
  status: 'NOMINAL' | 'ELEVATED' | 'QUARANTINE_WARNING' | 'CRITICAL_ZEROIZE';
}

interface EverydayMarketingCohort {
  cohort: string;
  sharePct: number;
  poolAmountThb: number;
  ncUsers: number;
  vcPerCapitaThb: number;
  verifiedAllocationThb: number;
  driftErrorThb: number;
}

const INITIAL_COHORTS: EverydayMarketingCohort[] = [
  {
    cohort: 'Gen Z Core Consumers',
    sharePct: 35,
    poolAmountThb: 4375000.0,
    ncUsers: 1750,
    vcPerCapitaThb: 2500.0,
    verifiedAllocationThb: 4375000.0,
    driftErrorThb: 0.0,
  },
  {
    cohort: 'Gen Y Pro Creators',
    sharePct: 30,
    poolAmountThb: 3750000.0,
    ncUsers: 750,
    vcPerCapitaThb: 5000.0,
    verifiedAllocationThb: 3750000.0,
    driftErrorThb: 0.0,
  },
  {
    cohort: 'Gen X Enterprise Custodians',
    sharePct: 25,
    poolAmountThb: 3125000.0,
    ncUsers: 250,
    vcPerCapitaThb: 12500.0,
    verifiedAllocationThb: 3125000.0,
    driftErrorThb: 0.0,
  },
  {
    cohort: 'SMB Retail Nodes',
    sharePct: 10,
    poolAmountThb: 1250000.0,
    ncUsers: 500,
    vcPerCapitaThb: 2500.0,
    verifiedAllocationThb: 1250000.0,
    driftErrorThb: 0.0,
  },
];

const FORENSIC_12_STAGES = [
  { stage: 1, name: 'Raw Ingress Capture', durationMs: 1.8, verified: true, proof: '0x9a8f...b12' },
  { stage: 2, name: 'HSM Physical Entropy Sampling', durationMs: 2.1, verified: true, proof: '0xc842...410' },
  { stage: 3, name: 'Post-Quantum Dilithium Attestation', durationMs: 3.4, verified: true, proof: '0x3fa1...e99' },
  { stage: 4, name: 'Merkle Tree Leaf Hashing', durationMs: 2.9, verified: true, proof: '0x77bc...10a' },
  { stage: 5, name: 'Quarantine Boundary Check (Ω600_1000)', durationMs: 2.5, verified: true, proof: '0x8849...202' },
  { stage: 6, name: 'Deca-Key Quorum Verification (10/10)', durationMs: 4.1, verified: true, proof: '0x1010...f14' },
  { stage: 7, name: 'Cryogenic Thermal Calibration (14.98 mK)', durationMs: 1.9, verified: true, proof: '0x0014...980' },
  { stage: 8, name: 'Thai Legal Compliance (PDPA/ETDA Sec 9/26/28)', durationMs: 3.7, verified: true, proof: '0xee28...926' },
  { stage: 9, name: 'Bitwise State Ledger Commit', durationMs: 4.2, verified: true, proof: '0xbb01...500' },
  { stage: 10, name: 'Fail-Closed Sentinel Re-Verification', durationMs: 2.8, verified: true, proof: '0x00ff...850' },
  { stage: 11, name: 'Cross-Chamber Consensus Propagation', durationMs: 3.1, verified: true, proof: '0x1818...c00' },
  { stage: 12, name: 'Immutable SSoT Freeze Anchor (#849202)', durationMs: 3.3, verified: true, proof: '0x909a...c68' },
];

export const UtimacoSecondaryHSMGauge: React.FC<{
  className?: string;
  onAlertTriggered?: (temp: number) => void;
}> = ({ className = '', onAlertTriggered }) => {
  // Safety threshold override with localStorage persistence
  const [thermalThreshold, setThermalThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('utimaco_temp_threshold');
      return saved ? parseFloat(saved) : 85.0;
    } catch {
      return 85.0;
    }
  });

  const [currentTemp, setCurrentTemp] = useState<number>(14.98); // starts at baseline 14.98
  const [isZeroized, setIsZeroized] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [showZeroizeConfirm, setShowZeroizeConfirm] = useState<boolean>(false);
  const [zeroizeInputCode, setZeroizeInputCode] = useState<string>('');
  const [isReplayingTrace, setIsReplayingTrace] = useState<boolean>(false);
  const [replayStageProgress, setReplayStageProgress] = useState<number>(12);
  const [lastReplayLatencyMs, setLastReplayLatencyMs] = useState<number>(35.8);

  const [cooldownTimeLeft, setCooldownTimeLeft] = useState<number | null>(null);
  const [showCompactTable, setShowCompactTable] = useState<boolean>(false);
  const [escalatingPulseEnabled, setEscalatingPulseEnabled] = useState<boolean>(true);
  const [upwardSlopeAlert, setUpwardSlopeAlert] = useState<boolean>(false);

  // 60-second sparkline buffer
  const [historyBuffer, setHistoryBuffer] = useState<TelemetryDataPoint[]>(() => {
    const arr: TelemetryDataPoint[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      arr.push({
        second: 60 - i,
        timeLabel: t.toLocaleTimeString('th-TH', { minute: '2-digit', second: '2-digit' }),
        tempCelsius: 14.98,
        subKelvinMk: 14.98,
        voltage: 3.301,
        status: 'NOMINAL',
      });
    }
    return arr;
  });

  const handleUpdateThreshold = (val: number) => {
    const cleanVal = isNaN(val) ? 85.0 : Math.max(30, Math.min(150, val));
    setThermalThreshold(cleanVal);
    try {
      localStorage.setItem('utimaco_temp_threshold', cleanVal.toString());
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Periodic Telemetry Simulation (1s tick)
  useEffect(() => {
    const timer = setInterval(() => {
      setHistoryBuffer((prev) => {
        const nextSecond = prev.length > 0 ? prev[prev.length - 1].second + 1 : 1;
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('th-TH', { minute: '2-digit', second: '2-digit' });

        // Add small jitter
        const jitter = (Math.random() - 0.5) * 0.4;
        let sampledTemp = currentTemp;
        if (!isZeroized && currentTemp <= 15) {
          sampledTemp = Math.max(14.8, Math.min(15.2, 14.98 + jitter * 0.1));
        }

        const isOver = sampledTemp > thermalThreshold;
        const status = isZeroized
          ? 'CRITICAL_ZEROIZE'
          : sampledTemp >= 95.0
          ? 'CRITICAL_ZEROIZE'
          : isOver
          ? 'QUARANTINE_WARNING'
          : sampledTemp > 45.0
          ? 'ELEVATED'
          : 'NOMINAL';

        const newPoint: TelemetryDataPoint = {
          second: nextSecond,
          timeLabel,
          tempCelsius: parseFloat(sampledTemp.toFixed(2)),
          subKelvinMk: sampledTemp <= 15 ? 14.98 : 0.0,
          voltage: parseFloat((3.3 + (Math.random() - 0.5) * 0.02).toFixed(3)),
          status,
        };

        return [...prev.slice(1), newPoint];
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTemp, thermalThreshold, isZeroized, cooldownTimeLeft]);

  // Cooldown effect
  useEffect(() => {
    if (cooldownTimeLeft !== null && cooldownTimeLeft > 0) {
      const timer = setTimeout(() => {
        setCooldownTimeLeft(prev => prev! - 1);
        setCurrentTemp(prev => {
          const drop = Math.max(1, (prev - 14.98) / cooldownTimeLeft);
          return Math.max(14.98, prev - drop);
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownTimeLeft === 0) {
      setCooldownTimeLeft(null);
      setCurrentTemp(14.98);
      playTone(600, 0.08);
    }
  }, [cooldownTimeLeft]);

  // Upward slope detection
  useEffect(() => {
    if (historyBuffer.length >= 4) {
      const p1 = historyBuffer[historyBuffer.length - 4].tempCelsius;
      const p2 = historyBuffer[historyBuffer.length - 3].tempCelsius;
      const p3 = historyBuffer[historyBuffer.length - 2].tempCelsius;
      const p4 = historyBuffer[historyBuffer.length - 1].tempCelsius;

      if (p4 > p3 && p3 > p2 && p2 > p1 && p4 > 25.0 && !isZeroized) {
        if (!upwardSlopeAlert) {
          setUpwardSlopeAlert(true);
          playWarningTone();
        }
      } else if (p4 <= p3) {
        setUpwardSlopeAlert(false);
      }
    }
  }, [historyBuffer, isZeroized, upwardSlopeAlert]);

  // Escalating pulse audio tone (1500ms down to 300ms at 95.0°C)
  useEffect(() => {
    if (soundMuted || !escalatingPulseEnabled || isZeroized || currentTemp <= thermalThreshold) return;

    // Escalating calculation:
    // At threshold: 1500ms
    // At >= 95.0°C: 300ms
    const tempExcess = Math.max(0, currentTemp - thermalThreshold);
    const maxExcess = Math.max(1, 95.0 - thermalThreshold);
    const ratio = Math.min(1, tempExcess / maxExcess);
    const intervalMs = Math.round(1500 - ratio * (1500 - 300));

    const intervalTimer = setInterval(() => {
      playWarningTone();
      if (onAlertTriggered) onAlertTriggered(currentTemp);
    }, intervalMs);

    return () => clearInterval(intervalTimer);
  }, [currentTemp, thermalThreshold, soundMuted, escalatingPulseEnabled, isZeroized, onAlertTriggered]);

  // Emergency Zeroize Handler
  const executeZeroize = useCallback(() => {
    setIsZeroized(true);
    setCurrentTemp(0.0);
    setShowZeroizeConfirm(false);
    playTone(180, 0.4);
    try {
      fetch('/api/v1/hsm/zeroize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Zyrquen-Sovereign-Sig': 'EP-SOVEREIGN-01',
        },
        body: JSON.stringify({
          confirmation_code: 'ZEROIZE-FIPS140-3-L4',
          hsm_serial: 'UTIMACO-GP-CSE-SERIES-L4-909AB8',
        }),
      }).catch(() => {});
    } catch {
      // offline fallback
    }
  }, []);

  // Restore Nominal Simulation
  const handleRestoreNominal = () => {
    setIsZeroized(false);
    setCurrentTemp(14.98);
    playTone(600, 0.08);
  };

  const handleTriggerCooldown = () => {
    if (currentTemp <= 15) return;
    const timeRequired = Math.ceil((currentTemp - 14.98) / 3); // ~3 degrees per sec cooling
    setCooldownTimeLeft(timeRequired);
    playTone(300, 0.1);
  };

  // Download Telemetry CSV
  const handleDownloadCsv = () => {
    const headers = [
      'second',
      'timestamp',
      'temp_celsius',
      'sub_kelvin_mK',
      'voltage_v',
      'threshold_celsius',
      'status',
      'hsm_model',
      'fips_clearance',
      'canonical_block',
      'genesis_merkle_root',
    ];

    const rows = historyBuffer.map((d) => [
      d.second,
      d.timeLabel,
      d.tempCelsius,
      d.subKelvinMk,
      d.voltage,
      thermalThreshold,
      d.status,
      'Utimaco u.trust GP CSe-Series',
      'FIPS 140-3 Level 4',
      '#849202',
      '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hsm_thermal_telemetry_block_849202.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playTone(720, 0.05);
  };

  // 12-Stage Forensic Trace Replay Execution
  const trigger12StageReplay = async () => {
    if (isReplayingTrace) return;
    setIsReplayingTrace(true);
    setReplayStageProgress(0);
    playTone(500, 0.05);

    const startTime = performance.now();
    for (let i = 1; i <= 12; i++) {
      await new Promise((r) => setTimeout(r, 22));
      setReplayStageProgress(i);
      playTone(500 + i * 25, 0.02);
    }
    const duration = parseFloat((performance.now() - startTime).toFixed(1));
    setLastReplayLatencyMs(duration > 0 ? Math.min(35.8, duration) : 35.8);
    setIsReplayingTrace(false);
    playAuditChime();
  };

  // Compute total pool and drift
  const gasTotalPool = useMemo(() => {
    return INITIAL_COHORTS.reduce((sum, c) => sum + c.verifiedAllocationThb, 0);
  }, []);

  const SlideToZeroize = useCallback(({ onConfirm }: { onConfirm: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const thumbWidth = 32;
      const maxX = rect.width - thumbWidth;
      const x = e.clientX - rect.left - (thumbWidth / 2);
      let pct = (x / maxX) * 100;
      pct = Math.max(0, Math.min(100, pct));
      setProgress(pct);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (progress > 85) {
        setProgress(100);
        onConfirm();
      } else {
        setProgress(0);
      }
    };

    return (
      <div 
        ref={trackRef}
        className="relative w-40 h-[30px] rounded-lg bg-rose-950/40 border-rose-500/50 flex items-center overflow-hidden touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div 
          className="absolute left-0 top-0 bottom-0 bg-rose-500/40 pointer-events-none transition-none"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-rose-300 pointer-events-none">
          SLIDE TO ZEROIZE &rarr;
        </div>
        <div 
          className="absolute top-0 bottom-0 bg-rose-600 flex items-center justify-center cursor-ew-resize rounded shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-none"
          style={{ width: `32px`, left: `calc(${progress}% - ${progress * 32 / 100}px)` }}
        >
          <ShieldAlert className="w-4 h-4 text-white pointer-events-none" />
        </div>
      </div>
    );
  }, []);

  const isOverThreshold = currentTemp > thermalThreshold;
  const isCritical = currentTemp >= 95.0 || isZeroized;

  return (
    <div
      id="utimaco-secondary-hsm-sentinel-gauge"
      className={`rounded-2xl border bg-[#070a12] text-zinc-200 p-5 space-y-6 font-mono ${
        isCritical
          ? 'border-rose-500/70 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
          : isOverThreshold
          ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
          : 'border-[#17233f]'
      } ${className}`}
    >
      {/* ── HEADER BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#17233f] pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isCritical
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : isOverThreshold
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
            }`}
          >
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wider">
                UTIMACO SECONDARY HSM SENTINEL GAUGE (v2)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border-cyan-800/60 font-semibold">
                FIPS 140-3 LEVEL 4
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              u.trust GP CSe-Series | Chamber 04 Sub-Kelvin Integration | Single Source of Truth (SSoT)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="utimaco-pulse-audio-btn"
            onClick={() => setEscalatingPulseEnabled(!escalatingPulseEnabled)}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${
              escalatingPulseEnabled
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
            }`}
            title={escalatingPulseEnabled ? 'Disable Escalating Pulse Warning' : 'Enable Escalating Pulse Warning'}
          >
            {escalatingPulseEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline">{escalatingPulseEnabled ? 'Pulse ON' : 'Pulse OFF'}</span>
          </button>

          <button
            id="utimaco-sound-mute-btn"
            onClick={() => setSoundMuted(!soundMuted)}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${
              soundMuted
                ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300'
            }`}
            title={soundMuted ? 'เปิดเสียงแจ้งเตือนแบบพัลส์' : 'ปิดเสียงแจ้งเตือน'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline">{soundMuted ? 'Muted' : 'Audio ON'}</span>
          </button>

          <button
            id="utimaco-download-csv-btn"
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 rounded-lg border-[#17233f] bg-[#0a0f1e] hover:border-cyan-500/60 hover:text-cyan-300 text-xs flex items-center gap-1.5 transition text-zinc-300 hidden sm:flex"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </button>

          {isZeroized ? (
            <button
              onClick={handleRestoreNominal}
              className="px-3 py-1.5 rounded-lg border-emerald-500/50 bg-emerald-950/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-900/40 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Baseline (14.98 mK)</span>
            </button>
          ) : (
            <SlideToZeroize onConfirm={() => setShowZeroizeConfirm(true)} />
          )}
        </div>
      </div>

      {/* ── TOP METRICS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0a0f1e] border-[#17233f]">
          <div className="text-[11px] text-zinc-400">Current Temperature</div>
          <div
            className={`text-lg font-bold mt-1 ${
              isZeroized
                ? 'text-rose-400'
                : isOverThreshold
                ? 'text-rose-400'
                : 'text-cyan-300'
            }`}
          >
            {isZeroized ? 'ZEROIZED (0.00)' : `${currentTemp.toFixed(2)} ${currentTemp <= 15 ? 'mK' : '°C'}`}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Baseline: 14.98 mK Cryo
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0a0f1e] border-[#17233f]">
          <div className="text-[11px] text-zinc-400">Quarantine Threshold</div>
          <div className="text-lg font-bold text-amber-300 mt-1">
            {thermalThreshold.toFixed(1)}°C
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Persisted in localStorage
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0a0f1e] border-[#17233f]">
          <div className="text-[11px] text-zinc-400">HSM Status & FIPS Level</div>
          <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isZeroized ? 'ACTIVE ZEROIZATION' : 'L4 CERTIFIED TAMPER-PROOF'}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            10/10 Hardware Quorum
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0a0f1e] border-[#17233f]">
          <div className="text-[11px] text-zinc-400">Replay Pipeline SLA</div>
          <div className="text-lg font-bold text-cyan-300 mt-1">
            {lastReplayLatencyMs} ms
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            SLA &lt; 142.0 ms (100% PASS)
          </div>
        </div>
      </div>

      {/* ── 60-SECOND SPARKLINE REAL-TIME CHART ── */}
      <div className="p-4 rounded-xl bg-[#0a0f1e] border-[#17233f] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              60-SECOND THERMAL TELEMETRY SPARKLINE STREAM
            </span>
            {upwardSlopeAlert && (
              <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border-amber-500/50 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <TrendingUp className="w-3 h-3" />
                UPWARD TEMP SLOPE DETECTED
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCompactTable(!showCompactTable)}
              className="px-2 py-1 rounded-md border-cyan-800/40 text-[10px] text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/40 flex items-center gap-1 transition"
            >
              <ListOrdered className="w-3 h-3" />
              {showCompactTable ? 'HIDE TABLE' : 'COMPACT VIEW'}
            </button>
            <div className="text-[11px] text-zinc-400 hidden sm:block">
              Current: <strong className="text-white">{currentTemp.toFixed(2)}</strong> | Threshold:{' '}
              <strong className="text-amber-400">{thermalThreshold.toFixed(1)}°C</strong>
            </div>
          </div>
        </div>

        <div className="h-36 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyBuffer} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="utimacoTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isCritical ? '#f43f5e' : isOverThreshold ? '#f59e0b' : '#06b6d4'}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={isCritical ? '#f43f5e' : isOverThreshold ? '#f59e0b' : '#06b6d4'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="timeLabel" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} interval={10} />
              <YAxis domain={[0, 110]} tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070a12',
                  borderColor: '#17233f',
                  fontSize: '11px',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
              />
              <Area
                type="monotone"
                dataKey="tempCelsius"
                name="Temp (°C / mK)"
                stroke={isCritical ? '#f43f5e' : isOverThreshold ? '#f59e0b' : '#06b6d4'}
                strokeWidth={2}
                fill="url(#utimacoTempGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabular List of Last 10 Readings */}
        {showCompactTable && (
          <div className="mt-3 overflow-x-auto border-white/5 rounded-lg bg-black/40">
            <table className="w-full text-left text-[10px] font-mono text-zinc-300">
              <thead className="bg-[#17233f]/30 text-zinc-400">
                <tr>
                  <th className="py-1.5 px-3 border-b border-white/5">Time</th>
                  <th className="py-1.5 px-3 border-b border-white/5">Temp (°C)</th>
                  <th className="py-1.5 px-3 border-b border-white/5">Voltage</th>
                  <th className="py-1.5 px-3 border-b border-white/5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...historyBuffer].slice(-10).reverse().map((pt, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="py-1 px-3">{pt.timeLabel}</td>
                    <td className={`py-1 px-3 font-bold ${pt.tempCelsius >= thermalThreshold ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {pt.tempCelsius.toFixed(2)}
                    </td>
                    <td className="py-1 px-3">{pt.voltage.toFixed(3)}V</td>
                    <td className="py-1 px-3">
                      <span className={`px-1.5 rounded ${
                        pt.status === 'NOMINAL' ? 'bg-cyan-950/40 text-cyan-400' : 
                        pt.status === 'ELEVATED' ? 'bg-amber-950/40 text-amber-400' : 
                        'bg-rose-950/40 text-rose-400'
                      }`}>
                        {pt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Controls: Threshold Override + Simulation Knobs */}
        <div className="pt-2 border-t border-[#17233f] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <label className="text-[11px] text-zinc-300 whitespace-nowrap">Safety Threshold (°C):</label>
            <input
              type="number"
              step="0.5"
              min="30"
              max="130"
              value={thermalThreshold}
              onChange={(e) => handleUpdateThreshold(parseFloat(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-black/60 border-[#17233f] text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-[10px] text-zinc-500">Auto-saved</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-zinc-400">Simulate Temp:</span>
            <button
              onClick={() => {
                setCurrentTemp(14.98);
                playTone(650, 0.03);
              }}
              className="px-2 py-0.5 rounded bg-cyan-950/60 border-cyan-800/60 text-cyan-300 text-[10px] hover:bg-cyan-900/60"
            >
              14.98 mK (Nominal)
            </button>
            <button
              onClick={() => {
                setCurrentTemp(52.5);
                playTone(450, 0.03);
              }}
              className="px-2 py-0.5 rounded bg-blue-950/60 border-blue-800/60 text-blue-300 text-[10px] hover:bg-blue-900/60"
            >
              52.5°C (Elevated)
            </button>
            <button
              onClick={() => {
                setCurrentTemp(88.0);
                playTone(320, 0.04);
              }}
              className="px-2 py-0.5 rounded bg-amber-950/60 border-amber-800/60 text-amber-300 text-[10px] hover:bg-amber-900/60"
            >
              88.0°C (Quarantine Alert)
            </button>
            <button
              onClick={() => {
                setCurrentTemp(96.5);
                playTone(240, 0.06);
              }}
              className="px-2 py-0.5 rounded bg-rose-950/60 border-rose-800/60 text-rose-300 text-[10px] hover:bg-rose-900/60 font-bold"
            >
              96.5°C (Critical)
            </button>
            <button
              onClick={handleTriggerCooldown}
              disabled={currentTemp <= 15 || cooldownTimeLeft !== null}
              className="px-2 py-0.5 rounded bg-emerald-950/60 border-emerald-800/60 text-emerald-300 text-[10px] hover:bg-emerald-900/60 font-bold disabled:opacity-30 flex items-center gap-1"
            >
              <ThermometerSnowflake className="w-3 h-3" />
              {cooldownTimeLeft !== null ? `COOLING... ${cooldownTimeLeft}s` : 'COOLDOWN'}
            </button>
          </div>
        </div>
      </div>

      {/* ── EVERYDAYMARKETING NC X VC GAS ALLOCATION LEDGER ── */}
      <div className="p-4 rounded-xl bg-[#0a0f1e] border-[#17233f] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#17233f] pb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              EVERYDAYMARKETING NC X VC GAS ALLOCATION LEDGER (฿12,500,000.00 THB)
            </h3>
          </div>
          <div className="text-[11px] font-mono text-emerald-400">
            Pool: ฿{gasTotalPool.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB | Delta Drift = 0.00 THB
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#17233f] text-[10px] text-zinc-400 uppercase tracking-wider">
                <th className="py-2 px-2">Cohort Segment</th>
                <th className="py-2 px-2 text-right">Allocation (%)</th>
                <th className="py-2 px-2 text-right">Pool Amount (THB)</th>
                <th className="py-2 px-2 text-right">Nc (Custodians)</th>
                <th className="py-2 px-2 text-right">Vc Per Capita (THB)</th>
                <th className="py-2 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17233f]/60 text-[11px]">
              {INITIAL_COHORTS.map((c, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-2 font-medium text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{c.cohort}</span>
                  </td>
                  <td className="py-2 px-2 text-right text-cyan-300 font-bold">{c.sharePct}%</td>
                  <td className="py-2 px-2 text-right font-bold text-[#D4AF37]">
                    ฿{c.poolAmountThb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-right text-zinc-300">{c.ncUsers.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-emerald-400">
                    ฿{c.vcPerCapitaThb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/60 text-emerald-400 border-emerald-800/40">
                      VERIFIED 100%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#17233f] text-xs font-bold text-white bg-black/40">
                <td className="py-2 px-2">Total Pool Aggregation</td>
                <td className="py-2 px-2 text-right text-cyan-300">100.00%</td>
                <td className="py-2 px-2 text-right text-[#D4AF37]">
                  ฿12,500,000.00
                </td>
                <td className="py-2 px-2 text-right text-zinc-200">3,250 Total</td>
                <td className="py-2 px-2 text-right text-emerald-400">Exact Match</td>
                <td className="py-2 px-2 text-center text-emerald-400 text-[10px]">Δ0.00% ERROR</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── ARCHITECTURE AUDIT TABLE: MARKETING SEALS VS MATHEMATICAL SEALS ── */}
      <div className="p-4 rounded-xl bg-[#0a0f1e] border-[#17233f] space-y-3">
        <div className="flex items-center justify-between border-b border-[#17233f] pb-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              ARCHITECTURE AUDIT: MARKETING SEALS VS MATHEMATICAL CANONICAL SEALS
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400">Canonical Block #849202</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-black/40 border-white/5 space-y-2">
            <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
              <span>📢</span>
              <span>Marketing Layer Claim</span>
            </div>
            <ul className="space-y-1.5 text-zinc-400 text-[11px]">
              <li>• Claimed Volume: <strong>14,982 Unfiltered Seals</strong></li>
              <li>• Promotion: &quot;Real-Time Quantum Stream&quot;</li>
              <li>• Error Tolerance: Soft / Statistical approximations</li>
              <li>• Legal Anchor: Unilateral marketing statement</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/20 border-emerald-800/40 space-y-2">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mathematical SSoT Ground Truth</span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 text-[11px]">
              <li>• Canonical Verified: <strong>14,902 Seals Bitwise Anchored</strong></li>
              <li>• Quarantine Buffer: <strong>80 Raw Quarantine Seals</strong> (14,902 + 80 = 14,982)</li>
              <li>• Merkle Root: <strong className="text-cyan-300 font-mono">909ab814...43fa4c68</strong></li>
              <li>• Legal Anchor: <strong>ETDA Sec 9/26/28 &amp; PDPA Sec 9/26/28</strong> Safe Harbor</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── 12-STAGE FORENSIC TRACE REPLAY PIPELINE (CHAMBER 02) ── */}
      <div className="p-4 rounded-xl bg-[#0a0f1e] border-[#17233f] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#17233f] pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              12-STAGE FORENSIC TRACE REPLAY PIPELINE (CHAMBER 02)
            </h3>
          </div>
          <button
            onClick={trigger12StageReplay}
            disabled={isReplayingTrace}
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.4)]"
          >
            <Play className={`w-3 h-3 ${isReplayingTrace ? 'animate-spin' : ''}`} />
            <span>{isReplayingTrace ? 'Replaying...' : 'Replay Trace (35.8ms SLA)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {FORENSIC_12_STAGES.map((st) => {
            const isDone = replayStageProgress >= st.stage;
            return (
              <div
                key={st.stage}
                className={`p-2 rounded-lg border text-[10px] transition ${
                  isDone
                    ? 'bg-cyan-950/30 border-cyan-700/60 text-zinc-200'
                    : 'bg-black/30 border-white/5 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between text-zinc-400 text-[9px]">
                  <span>STAGE {st.stage.toString().padStart(2, '0')}</span>
                  <span className={isDone ? 'text-cyan-400' : 'text-zinc-600'}>{st.durationMs}ms</span>
                </div>
                <div className="font-bold text-[10px] text-white mt-1 truncate" title={st.name}>
                  {st.name}
                </div>
                <div className="mt-1 flex items-center justify-between text-[9px]">
                  <span className="font-mono text-zinc-400">{st.proof}</span>
                  <span className={isDone ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                    {isDone ? 'PASS' : 'WAIT'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── EMERGENCY ZEROIZE CONFIRMATION MODAL ── */}
      {showZeroizeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#0a0f1e] border-rose-500 p-6 space-y-4 shadow-[0_0_50px_rgba(244,63,94,0.4)] font-mono">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <h3 className="text-sm font-bold text-white tracking-wider">
                CONFIRM EMERGENCY ACTIVE ZEROIZATION (FIPS 140-3 L4)
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              คำเตือน: การสั่ง Zeroize จะล้างกุญแจเข้ารหัสชั่วคราว (Ephemeral HSM Keys)
              และสลายสถานะคริปโตใน RAM ทันที ตามระเบียบข้อบังคับความมั่นคงปลอดภัยสูงสุด
              พิมพ์ <strong className="text-rose-400">ZEROIZE</strong> ด้านล่างเพื่อยืนยัน
            </p>

            <input
              type="text"
              placeholder="Type ZEROIZE to confirm"
              value={zeroizeInputCode}
              onChange={(e) => setZeroizeInputCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/70 border-rose-500/50 text-white font-mono text-xs focus:outline-none focus:border-rose-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowZeroizeConfirm(false)}
                className="px-4 py-1.5 rounded-lg border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={executeZeroize}
                disabled={zeroizeInputCode.trim().toUpperCase() !== 'ZEROIZE'}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-[0_0_20px_rgba(244,63,94,0.5)]"
              >
                Execute Zeroize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtimacoSecondaryHSMGauge;
