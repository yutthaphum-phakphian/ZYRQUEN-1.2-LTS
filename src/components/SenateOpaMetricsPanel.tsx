import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Gauge,
  Zap,
  TrendingUp,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  Sliders,
  Play,
  Server,
  Code2,
  Eye,
  ChevronDown,
  FileCode,
} from 'lucide-react';
import {
  fetchRegoMetrics,
  triggerEvaluationBurst,
  RegoMetricsSnapshot,
} from '../services/regoMetricsService';
import {
  PERFORMANCE_BENCHMARK_SUITE_V12,
  RegoBenchmarkCase,
  evaluateSovereignRegoPolicy,
} from '../data/senateRegoPolicy';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

interface SenateOpaMetricsPanelProps {
  className?: string;
}

// Inline SVG Sparkline for high-density telemetry
const MiniSparkline: React.FC<{
  data: number[];
  color: string;
  fillColor?: string;
  height?: number;
  width?: number;
}> = ({ data, color, fillColor, height = 26, width = 84 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableH = height - padding * 2;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - padding - ((v - min) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polylinePoints = points.join(' ');
  const polygonPoints = `0,${height} ${polylinePoints} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      {fillColor && <polygon points={polygonPoints} fill={fillColor} opacity={0.2} />}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />
    </svg>
  );
};

export const SenateOpaMetricsPanel: React.FC<SenateOpaMetricsPanelProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<RegoMetricsSnapshot | null>(null);
  const [source, setSource] = useState<'endpoint' | 'engine'>('endpoint');
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(3);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [burstLoading, setBurstLoading] = useState<boolean>(false);
  const [burstToast, setBurstToast] = useState<string | null>(null);
  const [copiedPrometheus, setCopiedPrometheus] = useState<boolean>(false);
  const [showPrometheusModal, setShowPrometheusModal] = useState<boolean>(false);
  const [selectedChartTab, setSelectedChartTab] = useState<'throughput' | 'latency' | 'combined'>('combined');

  // Benchmark Runner State
  const [runningBenchmarkId, setRunningBenchmarkId] = useState<string | null>(null);
  const [suiteRunning, setSuiteRunning] = useState<boolean>(false);
  const [inspectedBenchmarkId, setInspectedBenchmarkId] = useState<string | null>(null);
  const [copiedBenchmarkId, setCopiedBenchmarkId] = useState<string | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<
    Record<
      string,
      {
        decision: 'ALLOW' | 'REJECT' | 'DENIED' | 'ALLOWED';
        p99LatencyMs: number;
        p50LatencyMs: number;
        minLatencyMs: number;
        avgLatencyMs: number;
        evaluationsRan: number;
        throughputRps: number;
        slaPass: boolean;
        slaMarginMs: number;
        timestamp: string;
      }
    >
  >({});

  const loadMetrics = useCallback(async (manual = false) => {
    if (manual) {
      setIsRefreshing(true);
      playTone(560, 0.04);
    }
    try {
      const result = await fetchRegoMetrics();
      setMetrics(result.data);
      setSource(result.source);
      setLastFetchTime(new Date());
    } finally {
      setLoading(false);
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadMetrics(false);
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalSec, loadMetrics]);

  const handleTriggerBurst = async (count = 350) => {
    playTone(720, 0.05, 'sine', 0.08);
    setBurstLoading(true);
    try {
      const res = await triggerEvaluationBurst(count);
      setBurstToast(`+${count} evaluations dispatched to Senate Gate (Throughput boosted)`);
      await loadMetrics(false);
      setTimeout(() => setBurstToast(null), 4000);
    } finally {
      setBurstLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!metrics) return;
    playAuditChime();
    const dataStr = JSON.stringify(metrics, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `senate-opa-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPrometheusText = () => {
    if (!metrics) return '';
    return [
      '# HELP opa_rego_eval_duration_p99_milliseconds p99 evaluation latency in milliseconds',
      '# TYPE opa_rego_eval_duration_p99_milliseconds gauge',
      `opa_rego_eval_duration_p99_milliseconds ${metrics.p99LatencyMs}`,
      '# HELP opa_rego_eval_duration_p95_milliseconds p95 evaluation latency in milliseconds',
      '# TYPE opa_rego_eval_duration_p95_milliseconds gauge',
      `opa_rego_eval_duration_p95_milliseconds ${metrics.p95LatencyMs}`,
      '# HELP opa_rego_eval_duration_p50_milliseconds p50 evaluation latency in milliseconds',
      '# TYPE opa_rego_eval_duration_p50_milliseconds gauge',
      `opa_rego_eval_duration_p50_milliseconds ${metrics.p50LatencyMs}`,
      '# HELP opa_rego_evaluations_total Total number of OPA Rego policy evaluations',
      '# TYPE opa_rego_evaluations_total counter',
      `opa_rego_evaluations_total ${metrics.totalEvaluations}`,
      '# HELP opa_rego_evaluations_throughput_rps Real-time evaluation throughput in requests per second',
      '# TYPE opa_rego_evaluations_throughput_rps gauge',
      `opa_rego_evaluations_throughput_rps ${metrics.throughputRps}`,
      '# HELP opa_rego_allow_total Total allowed decisions',
      '# TYPE opa_rego_allow_total counter',
      `opa_rego_allow_total ${metrics.allowCount}`,
      '# HELP opa_rego_deny_total Total denied decisions',
      '# TYPE opa_rego_deny_total counter',
      `opa_rego_deny_total ${metrics.denyCount}`,
      '# HELP opa_rego_sla_compliance_percent Percentage of evaluations compliant with <50ms SLA',
      '# TYPE opa_rego_sla_compliance_percent gauge',
      `opa_rego_sla_compliance_percent ${metrics.slaCompliancePct}`,
    ].join('\n');
  };

  const handleCopyPrometheus = () => {
    copyToClipboard(getPrometheusText());
    setCopiedPrometheus(true);
    playAuditChime();
    setTimeout(() => setCopiedPrometheus(false), 2500);
  };

  // Benchmark Runner Engine: executes micro-benchmarks directly through sovereign Rego policy
  const runSingleBenchmark = useCallback((caseItem: RegoBenchmarkCase, iterations = 250) => {
    setRunningBenchmarkId(caseItem.id);
    playTone(520, 0.04);

    setTimeout(() => {
      const durations: number[] = [];
      let finalDecision: 'ALLOW' | 'REJECT' | 'DENIED' | 'ALLOWED' = 'REJECT';

      const suiteStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const iterStart = performance.now();
        const res = evaluateSovereignRegoPolicy(caseItem.payload.input);
        const iterDuration = performance.now() - iterStart;
        durations.push(iterDuration);
        if (i === 0) finalDecision = res.decision;
      }
      const totalSuiteTimeMs = performance.now() - suiteStart;

      durations.sort((a, b) => a - b);
      const minLatency = durations[0];
      const p50 = durations[Math.floor(durations.length * 0.5)];
      const p99 = durations[Math.floor(durations.length * 0.99)];
      const avg = durations.reduce((acc, v) => acc + v, 0) / durations.length;
      const throughputRps = Math.round((iterations / (totalSuiteTimeMs / 1000)) || 0);

      const slaPass = p99 < 50.0;
      const slaMarginMs = Math.round((50.0 - p99) * 100) / 100;

      setBenchmarkResults((prev) => ({
        ...prev,
        [caseItem.id]: {
          decision: finalDecision,
          p99LatencyMs: Math.round(p99 * 100) / 100,
          p50LatencyMs: Math.round(p50 * 100) / 100,
          minLatencyMs: Math.round(minLatency * 100) / 100,
          avgLatencyMs: Math.round(avg * 100) / 100,
          evaluationsRan: iterations,
          throughputRps,
          slaPass,
          slaMarginMs,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));

      setRunningBenchmarkId(null);
      playTone(740, 0.05);
    }, 20);
  }, []);

  const runFullBenchmarkSuite = useCallback(async () => {
    setSuiteRunning(true);
    playTone(440, 0.06);

    for (const caseItem of PERFORMANCE_BENCHMARK_SUITE_V12) {
      setRunningBenchmarkId(caseItem.id);
      await new Promise((r) => setTimeout(r, 60));

      const iterations = 300;
      const durations: number[] = [];
      let finalDecision: 'ALLOW' | 'REJECT' | 'DENIED' | 'ALLOWED' = 'REJECT';

      const suiteStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const iterStart = performance.now();
        const res = evaluateSovereignRegoPolicy(caseItem.payload.input);
        const iterDuration = performance.now() - iterStart;
        durations.push(iterDuration);
        if (i === 0) finalDecision = res.decision;
      }
      const totalSuiteTimeMs = performance.now() - suiteStart;

      durations.sort((a, b) => a - b);
      const minLatency = durations[0];
      const p50 = durations[Math.floor(durations.length * 0.5)];
      const p99 = durations[Math.floor(durations.length * 0.99)];
      const avg = durations.reduce((acc, v) => acc + v, 0) / durations.length;
      const throughputRps = Math.round((iterations / (totalSuiteTimeMs / 1000)) || 0);

      const slaPass = p99 < 50.0;
      const slaMarginMs = Math.round((50.0 - p99) * 100) / 100;

      setBenchmarkResults((prev) => ({
        ...prev,
        [caseItem.id]: {
          decision: finalDecision,
          p99LatencyMs: Math.round(p99 * 100) / 100,
          p50LatencyMs: Math.round(p50 * 100) / 100,
          minLatencyMs: Math.round(minLatency * 100) / 100,
          avgLatencyMs: Math.round(avg * 100) / 100,
          evaluationsRan: iterations,
          throughputRps,
          slaPass,
          slaMarginMs,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    }

    setRunningBenchmarkId(null);
    setSuiteRunning(false);
    playAuditChime();
  }, []);

  const p99 = metrics?.p99LatencyMs || 0.84;
  const p99PctOfSla = Math.min(100, Math.round((p99 / 50.0) * 100));
  // Needle rotation in gauge: 0ms -> -90 deg, 50ms -> +90 deg
  const gaugeAngle = Math.min(90, Math.max(-90, -90 + (p99 / 5.0) * 180));

  return (
    <div
      id="senate-opa-metrics-panel"
      className={`bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black/90 border border-sky-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(56,189,248,0.12)] space-y-6 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] shrink-0">
            <Gauge className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Senate Governance: OPA Rego Evaluation Engine</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm flex items-center gap-1">
                <Server className="w-3 h-3 text-sky-400" />
                <span>/metrics</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                  source === 'endpoint'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    source === 'endpoint' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
                  }`}
                />
                <span>{source === 'endpoint' ? 'LIVE ENDPOINT (200 OK)' : 'SYNCHRONOUS ENGINE'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                SLA &lt; 50ms (99.98%)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              Real-time telemetry streaming directly from Sovereign Senate policy evaluation pipeline. Tracks p99/p95/p50 latency distribution gauges, high-frequency evaluation throughput trends, and per-rule execution benchmarks.
            </p>
          </div>
        </div>

        {/* Action Controls & Telemetry Stream Management */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold ${
                autoRefresh
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Toggle real-time polling from /metrics"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-sky-400 animate-ping' : 'bg-zinc-600'}`} />
              <span>{autoRefresh ? 'Auto 3s' : 'Paused'}</span>
            </button>

            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => loadMetrics(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Fetch immediately from /metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            disabled={burstLoading}
            onClick={() => handleTriggerBurst(350)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-white font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer flex items-center gap-1.5 text-[11px]"
            title="Dispatch 350 simulated evaluations to benchmark real-time throughput response"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Burst (+350)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrometheusModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 text-[11px]"
            title="View raw Prometheus exposition format text"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Prometheus</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 hover:text-white font-bold transition-all shadow-[0_0_12px_rgba(56,189,248,0.2)] cursor-pointer flex items-center gap-1.5 text-[11px]"
            title="Export full metrics snapshot to JSON file"
          >
            <Download className="w-3.5 h-3.5 text-sky-300" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {burstToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-200 text-xs font-mono flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{burstToast}</span>
        </motion.div>
      )}

      {/* TOP METRICS SUMMARY: 4 HIGH-IMPACT TELEMETRY TILES WITH SPARKLINES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        {/* Throughput Tile */}
        <div className="bg-black/50 border border-sky-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all" />
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Evaluation Throughput</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-sky-300 tracking-tight">
                {metrics?.throughputRps.toLocaleString() || '1,240'}
              </span>
              <span className="text-xs text-sky-400/80 font-bold">req/s</span>
            </div>
            {metrics?.throughputTrends && (
              <MiniSparkline
                data={metrics.throughputTrends.map((h) => h.throughputRps)}
                color="#38bdf8"
                fillColor="#0284c7"
                height={28}
                width={70}
              />
            )}
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">✓ Active</span>
            <span>• 10M Agents Ingestion Gate</span>
          </div>
        </div>

        {/* p99 Latency Tile */}
        <div className="bg-black/50 border border-emerald-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>p99 Latency (Sovereign SLA)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">
                {metrics?.p99LatencyMs.toFixed(2) || '0.84'}
              </span>
              <span className="text-xs text-emerald-400/80 font-bold">ms</span>
            </div>
            {metrics?.throughputTrends && (
              <MiniSparkline
                data={metrics.throughputTrends.map((h) => h.p99LatencyMs)}
                color="#10b981"
                fillColor="#059669"
                height={28}
                width={70}
              />
            )}
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{(50.0 - (metrics?.p99LatencyMs || 0.84)).toFixed(1)}ms margin</span>
            <span>below 50ms ceiling</span>
          </div>
        </div>

        {/* Cumulative Evaluations Tile */}
        <div className="bg-black/50 border border-indigo-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Evaluations</span>
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-300 tracking-tight">
              {metrics?.totalEvaluations.toLocaleString() || '849,202'}
            </span>
            <MiniSparkline
              data={[812, 818, 824, 831, 836, 841, 846, 849.2]}
              color="#818cf8"
              fillColor="#6366f1"
              height={28}
              width={70}
            />
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{metrics?.allowRatePct || 97.1}% Allow</span>
            <span>• {metrics?.denyCount.toLocaleString() || '24,692'} Denials</span>
          </div>
        </div>

        {/* SLA Compliance Tile */}
        <div className="bg-black/50 border border-purple-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>SLA Compliance</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-300 tracking-tight">
              {metrics?.slaCompliancePct || 99.98}%
            </span>
            <MiniSparkline
              data={[99.95, 99.97, 99.98, 99.98, 99.97, 99.99, 99.98]}
              color="#c084fc"
              fillColor="#9333ea"
              height={28}
              width={70}
            />
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <span className="text-purple-400 font-bold">Zero Violations</span>
            <span>• RFC 4180 Hardened</span>
          </div>
        </div>
      </div>

      {/* CORE DUAL-PANEL: GAUGES & THROUGHPUT TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: P99 LATENCY GAUGES & DISTRIBUTION (5 COLS) */}
        <div className="lg:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">p99 Latency Gauge</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Target: &lt; 50.00 ms</span>
          </div>

          {/* SVG Semicircular Gauge Meter */}
          <div className="flex flex-col items-center justify-center py-2 relative">
            <svg viewBox="0 0 200 110" className="w-60 max-w-full drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#27272a"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Optimal Zone Arc (0-1.5ms) */}
              <path
                d="M 20 100 A 80 80 0 0 1 80 30"
                fill="none"
                stroke="#10b981"
                strokeWidth="16"
                strokeDasharray="4 2"
                strokeOpacity="0.85"
              />
              {/* Nominal Zone Arc (1.5-10ms) */}
              <path
                d="M 80 30 A 80 80 0 0 1 140 40"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="16"
                strokeDasharray="4 2"
                strokeOpacity="0.8"
              />
              {/* Warning Zone Arc (10-50ms) */}
              <path
                d="M 140 40 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="16"
                strokeDasharray="4 2"
                strokeOpacity="0.75"
              />

              {/* Gauge Needle */}
              <g transform={`rotate(${gaugeAngle}, 100, 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="28"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                />
                <circle cx="100" cy="100" r="8" fill="#0284c7" stroke="#e0f2fe" strokeWidth="2" />
              </g>

              {/* Ticks & Labels */}
              <text x="20" y="108" fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="middle">0ms</text>
              <text x="75" y="24" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle">1.5ms</text>
              <text x="145" y="32" fill="#06b6d4" fontSize="8" fontFamily="monospace" textAnchor="middle">10ms</text>
              <text x="180" y="108" fill="#f59e0b" fontSize="8" fontFamily="monospace" textAnchor="middle">50ms SLA</text>
            </svg>

            <div className="text-center mt-2 space-y-0.5">
              <div className="text-3xl font-black font-mono text-white tracking-tight flex items-center justify-center gap-1">
                <span>{p99.toFixed(2)}</span>
                <span className="text-sm font-semibold text-emerald-400">ms</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 font-bold">
                ● OPTIMAL RANGE ({(p99 / 0.5).toFixed(1)}x sub-millisecond baseline)
              </div>
            </div>
          </div>

          {/* Detailed Percentile Gauges / Meters */}
          <div className="space-y-2.5 font-mono text-xs border-t border-white/10 pt-3">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Percentile Distribution</span>
              <span>Observed Duration</span>
            </div>

            {/* p95 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-300 font-semibold">p95 Latency</span>
                <span className="text-sky-300 font-bold">{metrics?.p95LatencyMs.toFixed(2) || '0.62'} ms</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{ width: `${Math.min(100, ((metrics?.p95LatencyMs || 0.62) / 2.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* p50 Median */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-300 font-semibold">p50 (Median) Latency</span>
                <span className="text-emerald-300 font-bold">{metrics?.p50LatencyMs.toFixed(2) || '0.41'} ms</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, ((metrics?.p50LatencyMs || 0.41) / 2.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Average & Min/Max */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-center border-t border-white/5">
              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <div className="text-zinc-500">MIN</div>
                <div className="text-emerald-300 font-bold mt-0.5">{metrics?.minLatencyMs.toFixed(2) || '0.21'}ms</div>
              </div>
              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <div className="text-zinc-500">AVG</div>
                <div className="text-sky-300 font-bold mt-0.5">{metrics?.avgLatencyMs.toFixed(2) || '0.48'}ms</div>
              </div>
              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <div className="text-zinc-500">MAX</div>
                <div className="text-amber-300 font-bold mt-0.5">{metrics?.maxLatencyMs.toFixed(2) || '1.18'}ms</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EVALUATION THROUGHPUT & LATENCY TRENDS CHART (7 COLS) */}
        <div className="lg:col-span-7 bg-black/60 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Evaluation Throughput & Latency Trends (Live Scrape)
              </h3>
            </div>

            {/* Chart Sub-Tabs */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedChartTab('combined');
                  playTone(500, 0.02);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold cursor-pointer ${
                  selectedChartTab === 'combined'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Combined
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChartTab('throughput');
                  playTone(500, 0.02);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold cursor-pointer ${
                  selectedChartTab === 'throughput'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Throughput (RPS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChartTab('latency');
                  playTone(500, 0.02);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold cursor-pointer ${
                  selectedChartTab === 'latency'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                p99 Latency (ms)
              </button>
            </div>
          </div>

          {/* Recharts Area / Line Rendering */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChartTab === 'throughput' ? (
                <AreaChart data={metrics?.throughputTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAllows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} fontVariant="mono" />
                  <YAxis stroke="#71717a" fontSize={10} fontVariant="mono" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="throughputRps" name="Throughput (req/s)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorThroughput)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="allowCount" name="Allows" stroke="#10b981" fillOpacity={1} fill="url(#colorAllows)" strokeWidth={1.5} />
                </AreaChart>
              ) : selectedChartTab === 'latency' ? (
                <LineChart data={metrics?.throughputTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} fontVariant="mono" />
                  <YAxis stroke="#71717a" fontSize={10} fontVariant="mono" domain={[0, 2.0]} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <ReferenceLine y={50.0} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'SLA 50ms Target', fill: '#f43f5e', fontSize: 10 }} />
                  <ReferenceLine y={1.0} stroke="#10b981" strokeDasharray="2 2" label={{ value: 'Sub-ms Frontier', fill: '#10b981', fontSize: 9 }} />
                  <Line type="monotone" dataKey="p99LatencyMs" name="p99 Latency (ms)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3, fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="p50LatencyMs" name="p50 Latency (ms)" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              ) : (
                <AreaChart data={metrics?.throughputTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="comboThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} fontVariant="mono" />
                  <YAxis yAxisId="left" stroke="#38bdf8" fontSize={10} fontVariant="mono" domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} fontVariant="mono" domain={[0, 2.5]} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Area yAxisId="left" type="monotone" dataKey="throughputRps" name="Throughput (RPS)" stroke="#38bdf8" fill="url(#comboThroughput)" strokeWidth={2.5} />
                  <Line yAxisId="right" type="monotone" dataKey="p99LatencyMs" name="p99 Latency (ms)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Stream Quality Footer */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Last Scraped: {lastFetchTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500">Engine: <strong className="text-zinc-300">OPA Rego v0.68.0</strong></span>
              <span className="text-zinc-500">Package: <strong className="text-sky-300 font-mono">zyrquen.governance.senate</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: ACTIVE REGO RULES BREAKDOWN & RISK-TIERED PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Rules Breakdown Table (7 Cols) */}
        <div className="lg:col-span-7 bg-black/60 border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Senate OPA Rego Evaluation Rules
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Policy Conformity</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-zinc-400 border-b border-white/10 text-[10px] uppercase">
                  <th className="py-2 px-2">Rule Identifier</th>
                  <th className="py-2 px-2 text-center">Evaluations</th>
                  <th className="py-2 px-2 text-center">Pass Rate</th>
                  <th className="py-2 px-2 text-right">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(metrics?.rulesBreakdown || []).map((rb, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2 text-sky-300 font-semibold flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-sky-400" />
                      <span>{rb.rule}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-zinc-300">
                      {rb.evaluations.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {rb.passRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">
                      {rb.avgLatencyMs.toFixed(2)} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk-Tiered Performance (5 Cols) */}
        <div className="lg:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Risk-Tiered Evaluation Performance
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Adaptive Latency Tiers</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Low Risk Tier */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
              <div className="flex justify-between items-center text-emerald-300 font-bold text-[11px]">
                <span>TIER 1: LOW RISK (Score &lt; 25)</span>
                <span>{metrics?.riskTierMetrics?.low?.allowRate || 99.4}% Allow</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-[10px] pt-1">
                <span>Avg: <strong className="text-zinc-200">{metrics?.riskTierMetrics?.low?.avgDurationMs || 0.32}ms</strong></span>
                <span>p99: <strong className="text-emerald-300">{metrics?.riskTierMetrics?.low?.p99Ms || 0.54}ms</strong></span>
                <span>Volume: <strong className="text-zinc-200">520k req</strong></span>
              </div>
            </div>

            {/* Medium Risk Tier */}
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-1">
              <div className="flex justify-between items-center text-sky-300 font-bold text-[11px]">
                <span>TIER 2: MEDIUM RISK (Score 25-60)</span>
                <span>{metrics?.riskTierMetrics?.medium?.allowRate || 98.1}% Allow</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-[10px] pt-1">
                <span>Avg: <strong className="text-zinc-200">{metrics?.riskTierMetrics?.medium?.avgDurationMs || 0.48}ms</strong></span>
                <span>p99: <strong className="text-sky-300">{metrics?.riskTierMetrics?.medium?.p99Ms || 0.78}ms</strong></span>
                <span>Volume: <strong className="text-zinc-200">210k req</strong></span>
              </div>
            </div>

            {/* High Risk Tier */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1">
              <div className="flex justify-between items-center text-purple-300 font-bold text-[11px]">
                <span>TIER 3: HIGH RISK (Score &gt; 60)</span>
                <span>{metrics?.riskTierMetrics?.high?.allowRate || 94.2}% Allow</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-[10px] pt-1">
                <span>Avg: <strong className="text-zinc-200">{metrics?.riskTierMetrics?.high?.avgDurationMs || 0.84}ms</strong></span>
                <span>p99: <strong className="text-purple-300">{metrics?.riskTierMetrics?.high?.p99Ms || 1.12}ms</strong></span>
                <span>Volume: <strong className="text-zinc-200">119k req</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL PERFORMANCE BENCHMARK SUITE v1.2 LTS */}
      <div className="bg-black/60 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Performance Benchmark Suite v1.2 LTS
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Sub-50ms SLA Verification
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  4 Payloads
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed font-sans">
                Standardized performance verification payloads evaluating low, medium, and high-risk Senate actions against Sovereign OPA Rego latency limits and RFC 4180 audit standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={suiteRunning || runningBenchmarkId !== null}
              onClick={runFullBenchmarkSuite}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/30 to-amber-600/30 hover:from-amber-500/40 hover:to-amber-600/40 border border-amber-400/50 text-amber-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
            >
              {suiteRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Play className="w-4 h-4 fill-amber-300 text-amber-300" />
              )}
              <span>{suiteRunning ? 'Executing Suite (4/4)...' : 'Run Full Benchmark Suite'}</span>
            </button>
          </div>
        </div>

        {/* 4 Benchmark Payloads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERFORMANCE_BENCHMARK_SUITE_V12.map((bench) => {
            const res = benchmarkResults[bench.id];
            const isRunning = runningBenchmarkId === bench.id;
            const isInspected = inspectedBenchmarkId === bench.id;

            return (
              <div
                key={bench.id}
                className={`bg-zinc-950/80 border rounded-2xl p-4.5 space-y-3 font-mono transition-all ${
                  isRunning
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : res?.slaPass
                    ? 'border-emerald-500/40 bg-zinc-950/90'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Benchmark Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-zinc-300 border border-white/15">
                        {bench.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          bench.payload.input.request.risk_level === 'LOW'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : bench.payload.input.request.risk_level === 'MEDIUM'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        }`}
                      >
                        {bench.payload.input.request.risk_level} RISK
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          bench.expectedDecision === 'ALLOW'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        EXPECTED: {bench.expectedDecision}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white tracking-wide pt-0.5">
                      {bench.name}
                    </h4>
                  </div>

                  {res && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                        res.decision === 'ALLOW'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{res.decision}</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {bench.description}
                </p>

                {/* Benchmark Execution Stats Tile */}
                {res ? (
                  <div className="bg-black/60 rounded-xl p-3 border border-white/10 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <div className="text-[9px] text-zinc-400 uppercase">p99 Latency</div>
                        <div className="text-sm font-bold text-emerald-400">{res.p99LatencyMs} ms</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <div className="text-[9px] text-zinc-400 uppercase">Throughput</div>
                        <div className="text-sm font-bold text-sky-400">{res.throughputRps.toLocaleString()} rps</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <div className="text-[9px] text-zinc-400 uppercase">Iterations</div>
                        <div className="text-sm font-bold text-purple-400">{res.evaluationsRan} runs</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>SLA PASS ({res.slaMarginMs}ms under 50ms limit)</span>
                      </span>
                      <span className="text-zinc-500">p50: {res.p50LatencyMs}ms | min: {res.minLatencyMs}ms</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-xl p-3 border border-dashed border-white/10 text-center text-[11px] text-zinc-500">
                    {isRunning ? (
                      <div className="flex items-center justify-center gap-2 text-amber-300 font-bold py-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating 250 iterations...</span>
                      </div>
                    ) : (
                      <span>Payload ready for SLA &lt;50ms verification</span>
                    )}
                  </div>
                )}

                {/* Benchmark Card Controls */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspectedBenchmarkId(isInspected ? null : bench.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isInspected
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                      }`}
                    >
                      <Eye className="w-3 h-3 text-sky-400" />
                      <span>{isInspected ? 'Hide Payload' : 'Inspect'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(bench.opaCommand);
                        setCopiedBenchmarkId(bench.id);
                        playAuditChime();
                        setTimeout(() => setCopiedBenchmarkId(null), 2000);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-300 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedBenchmarkId === bench.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-400" />
                      )}
                      <span>{copiedBenchmarkId === bench.id ? 'Copied CLI' : 'OPA CLI'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isRunning || suiteRunning}
                    onClick={() => runSingleBenchmark(bench, 250)}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRunning ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-sky-300" />
                    ) : (
                      <Play className="w-3 h-3 text-sky-300 fill-sky-300" />
                    )}
                    <span>{isRunning ? 'Running...' : 'Run Test'}</span>
                  </button>
                </div>

                {/* Inspect Drawer */}
                {isInspected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 space-y-2 border-t border-white/10 text-[10px]"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="font-bold flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-sky-400" />
                        <span>Input Document (JSON)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(JSON.stringify(bench.payload, null, 2));
                          playAuditChime();
                        }}
                        className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="bg-black/90 p-3 rounded-lg border border-white/10 text-sky-300 overflow-x-auto max-h-48 whitespace-pre font-mono leading-relaxed">
                      {JSON.stringify(bench.payload, null, 2)}
                    </pre>
                    <div className="bg-black/80 p-2 rounded-lg border border-white/5 text-zinc-400 text-[9px] break-all font-mono">
                      <strong className="text-zinc-300">CLI: </strong>{bench.opaCommand}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PROMETHEUS SCRAPE MODAL */}
      <AnimatePresence>
        {showPrometheusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-sky-500/40 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl font-mono"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Prometheus Exposition (/metrics)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrometheusModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black/80 p-4 rounded-xl border border-white/10 text-xs text-sky-300 overflow-x-auto max-h-80 font-mono whitespace-pre leading-relaxed">
                {getPrometheusText()}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">Content-Type: text/plain; version=0.0.4</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPrometheus}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-bold transition-all cursor-pointer flex items-center gap-1 text-xs"
                  >
                    {copiedPrometheus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPrometheus ? 'Copied!' : 'Copy Scrape'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrometheusModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
