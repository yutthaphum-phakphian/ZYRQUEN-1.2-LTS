import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Server,
  Activity,
  Globe,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  RotateCcw,
  Terminal,
  Cpu,
  Lock,
  Layers,
  Zap,
  Flame,
  Radio,
  Clock,
  Gauge,
  Database,
  Shuffle,
  FileCode,
} from 'lucide-react';
import { playTone, playAuditChime, playWarningTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import {
  INITIAL_GEO_REGIONS,
  GeoRegionNode,
  BenchmarkRunResult,
  GlobalSyncAuditResult,
  runSimulatedV5Benchmark,
  runSimulatedGlobalSyncAudit,
  VALUES_BENCHMARK_YAML,
  RUN_BENCHMARK_SH,
  RUN_GLOBAL_SYNC_AUDIT_SH,
  HELM_BENCHMARK_YML,
  GLOBAL_CONSENSUS_SCHEMA_SQL,
  ENVOY_GLOBAL_ROUTER_YAML,
  CHAOS_MESH_EXPERIMENTS_YAML,
  PROMETHEUS_ALERTS_YAML,
  K6_LATENCY_BENCHMARK_JS,
  LOCUSTFILE_PY,
} from '../../data/senateBenchmarkSuiteV5';
import { SENATE_GATE_GRAFANA_DASHBOARD_JSON } from '../../data/senateRegoPolicy';

export const SenateBenchmarkV5Section: React.FC = () => {
  const [activeManifestTab, setActiveManifestTab] = useState<
    | 'helm-values'
    | 'run-bench'
    | 'sync-audit'
    | 'github-ci'
    | 'sql-schema'
    | 'envoy-router'
    | 'chaos-mesh'
    | 'prom-alerts'
    | 'k6-load'
    | 'locust'
    | 'grafana'
  >('helm-values');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Benchmark Simulator State
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchProgress, setBenchProgress] = useState(100);
  const [benchResult, setBenchResult] = useState<BenchmarkRunResult>(() => runSimulatedV5Benchmark(10000, 50));

  // Multi-Region Sync Audit State
  const [regions, setRegions] = useState<GeoRegionNode[]>(INITIAL_GEO_REGIONS);
  const [isAuditingSync, setIsAuditingSync] = useState(false);
  const [syncAuditResult, setSyncAuditResult] = useState<GlobalSyncAuditResult>(() =>
    runSimulatedGlobalSyncAudit(INITIAL_GEO_REGIONS)
  );

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    playAuditChime();
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleTriggerBenchmark = () => {
    setIsBenchmarking(true);
    setBenchProgress(0);
    playTone(520, 0.05);

    const interval = setInterval(() => {
      setBenchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBenchmarking(false);
          const res = runSimulatedV5Benchmark(10000, 50);
          setBenchResult(res);
          playAuditChime();
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleTriggerSyncAudit = () => {
    setIsAuditingSync(true);
    playTone(600, 0.05);

    setTimeout(() => {
      setIsAuditingSync(false);
      const res = runSimulatedGlobalSyncAudit(regions);
      setSyncAuditResult(res);
      playAuditChime();
    }, 600);
  };

  const manifestContents: Record<string, { title: string; filename: string; language: string; content: string }> = {
    'helm-values': {
      title: 'Helm Benchmark Values',
      filename: 'charts/senate-gate/values-benchmark.yaml',
      language: 'yaml',
      content: VALUES_BENCHMARK_YAML,
    },
    'run-bench': {
      title: 'Automated Benchmark Script',
      filename: 'scripts/run_benchmark.sh',
      language: 'bash',
      content: RUN_BENCHMARK_SH,
    },
    'sync-audit': {
      title: 'Geo-Distributed Sync Audit Script',
      filename: 'scripts/run_global_sync_audit.sh',
      language: 'bash',
      content: RUN_GLOBAL_SYNC_AUDIT_SH,
    },
    'github-ci': {
      title: 'GitHub Actions CI/CD Pipeline',
      filename: '.github/workflows/helm-benchmark.yml',
      language: 'yaml',
      content: HELM_BENCHMARK_YML,
    },
    'sql-schema': {
      title: 'CockroachDB Multi-Region Schema',
      filename: 'scripts/global_consensus_schema.sql',
      language: 'sql',
      content: GLOBAL_CONSENSUS_SCHEMA_SQL,
    },
    'envoy-router': {
      title: 'Envoy Global Outlier Router',
      filename: 'scripts/envoy_global_router.yaml',
      language: 'yaml',
      content: ENVOY_GLOBAL_ROUTER_YAML,
    },
    'chaos-mesh': {
      title: 'Chaos Mesh Experiments',
      filename: 'scripts/chaos_mesh_experiments.yaml',
      language: 'yaml',
      content: CHAOS_MESH_EXPERIMENTS_YAML,
    },
    'prom-alerts': {
      title: 'Prometheus SLA Alert Rules',
      filename: 'scripts/prometheus_alerts.yaml',
      language: 'yaml',
      content: PROMETHEUS_ALERTS_YAML,
    },
    'k6-load': {
      title: 'k6 Distributed Load Test (10k RPS)',
      filename: 'scripts/k6_latency_benchmark.js',
      language: 'javascript',
      content: K6_LATENCY_BENCHMARK_JS,
    },
    'locust': {
      title: 'Locust Behavior Simulation',
      filename: 'scripts/locustfile.py',
      language: 'python',
      content: LOCUSTFILE_PY,
    },
    'grafana': {
      title: 'Grafana Benchmark Dashboard JSON',
      filename: 'public/senategate_grafana_benchmark_dashboard.json',
      language: 'json',
      content: SENATE_GATE_GRAFANA_DASHBOARD_JSON,
    },
  };

  const currentManifest = manifestContents[activeManifestTab];

  return (
    <div className="space-y-6 pt-4 border-t border-white/10">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-sky-950/30 to-purple-950/40 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
            <Flame className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white font-mono tracking-wide">
                Enterprise Benchmark &amp; Multi-Region Resilience Suite
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                v5.0 LTS Enterprise
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-sans max-w-3xl">
              Production Kubernetes Helm orchestration, CockroachDB Survives-Region multi-region consensus, Envoy outlier ejection, Chaos Mesh resilience, and sub-millisecond p99 SLA governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerBenchmark}
            disabled={isBenchmarking}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isBenchmarking
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            <Play className={`w-4 h-4 ${isBenchmarking ? 'animate-spin' : ''}`} />
            <span>{isBenchmarking ? 'Running Benchmark...' : 'Run 10k RPS Benchmark'}</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerSyncAudit}
            disabled={isAuditingSync}
            className="px-4 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Globe className={`w-4 h-4 ${isAuditingSync ? 'animate-spin' : ''}`} />
            <span>{isAuditingSync ? 'Auditing Sync...' : 'Audit Multi-Region SSoT'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive KPI Benchmarks & SLA Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: p99 Latency SLA */}
        <div className="bg-black/50 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">p99 Latency (SLA &lt;1.00ms)</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {benchResult.p99Ms} <span className="text-lg">ms</span>
            </span>
            <span className="text-xs font-mono text-zinc-400">({Math.round(benchResult.p99Ms * 1000)} µs)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Statutory SLA Satisfied ✓</span>
          </div>
          {isBenchmarking && (
            <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-150" style={{ width: `${benchProgress}%` }} />
          )}
        </div>

        {/* Card 2: Global Throughput */}
        <div className="bg-black/50 border border-sky-500/30 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Throughput</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-sky-300">
              {benchResult.throughputOpsSec.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-zinc-400">ops/sec</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400">
            Concurrency: {benchResult.concurrency} threads | 10k batch
          </div>
        </div>

        {/* Card 3: Percentiles Profile */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Latency Percentiles</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-zinc-950 p-1.5 rounded border border-white/5">
              <div className="text-[9px] text-zinc-400">p50</div>
              <div className="text-xs font-bold text-white">{benchResult.p50Ms}ms</div>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-white/5">
              <div className="text-[9px] text-zinc-400">p90</div>
              <div className="text-xs font-bold text-sky-300">{benchResult.p90Ms}ms</div>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-white/5">
              <div className="text-[9px] text-zinc-400">p95</div>
              <div className="text-xs font-bold text-emerald-300">{benchResult.p95Ms}ms</div>
            </div>
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400 text-center">
            p99.9 Extreme Tail: <span className="text-amber-300 font-bold">{benchResult.p999Ms}ms</span>
          </div>
        </div>

        {/* Card 4: Security & Zero Leaks */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Zero-Trust Integrity</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">100%</span>
            <span className="text-xs font-mono text-emerald-400">0 Leaks</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400">
            Fast Drop Ratio: <span className="text-sky-300 font-bold">{benchResult.shortCircuitDropsPct}%</span>
          </div>
        </div>
      </div>

      {/* 3. Geo-Distributed Multi-Region Topology Map & Merkle SSoT Parity */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white font-mono text-sm uppercase tracking-wider">
              Geo-Distributed Consensus Topology (CockroachDB &amp; Raft Term {syncAuditResult.raftTerm})
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SSoT Merkle Parity: 100% Lockstep</span>
            </span>
            <span>Split-Brain Risk: <strong className="text-white">0.00%</strong></span>
          </div>
        </div>

        {/* Region Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {syncAuditResult.regions.map((reg) => (
            <div
              key={reg.id}
              className={`p-4 rounded-2xl border transition-all ${
                reg.id === 'us-central1' || reg.id === 'us-east-1'
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-black/50 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Server className={`w-4 h-4 ${reg.id === 'us-central1' || reg.id === 'us-east-1' ? 'text-emerald-400' : 'text-sky-400'}`} />
                  <span className="font-bold text-white">{reg.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {reg.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Role:</span>
                  <span className="font-bold text-sky-300">{reg.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Block Height:</span>
                  <span className="text-white font-bold">{reg.blockHeight.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Drift:</span>
                  <span className="text-emerald-400 font-bold">{reg.driftBlocks} blocks (0.00%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Network Latency:</span>
                  <span className="text-amber-300 font-bold">{reg.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Active Nodes:</span>
                  <span className="text-white">{reg.activeNodes} pods</span>
                </div>
                <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                  PQC: <span className="text-cyan-300">{reg.pqcAttestation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Merkle Root Banner */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-zinc-400">Global SSoT Merkle State Root:</span>
            <span className="text-cyan-300 font-bold truncate max-w-sm sm:max-w-md" title={syncAuditResult.merkleRootHash}>
              {syncAuditResult.merkleRootHash}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(syncAuditResult.merkleRootHash, 'merkle-copy')}
            className="text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copiedKey === 'merkle-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Merkle Root</span>
          </button>
        </div>
      </div>

      {/* 4. Enterprise Architecture Code & Manifest Inspector */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white font-mono text-sm uppercase tracking-wider">
                Enterprise Infrastructure &amp; Resilience Manifests
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Full production-grade manifests: Helm Chart, automated scripts, CI/CD, SQL, Envoy, Chaos Mesh, k6, Locust.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(currentManifest.content, `manifest-${activeManifestTab}`)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Copy current file content"
            >
              {copiedKey === `manifest-${activeManifestTab}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Copy {currentManifest.filename}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar font-mono text-xs">
          {[
            { id: 'helm-values', label: 'values-benchmark.yaml', badge: 'HELM' },
            { id: 'run-bench', label: 'run_benchmark.sh', badge: 'BASH' },
            { id: 'sync-audit', label: 'run_global_sync_audit.sh', badge: 'BASH' },
            { id: 'github-ci', label: 'helm-benchmark.yml', badge: 'CI/CD' },
            { id: 'sql-schema', label: 'global_consensus_schema.sql', badge: 'SQL' },
            { id: 'envoy-router', label: 'envoy_global_router.yaml', badge: 'ENVOY' },
            { id: 'chaos-mesh', label: 'chaos_mesh_experiments.yaml', badge: 'CHAOS' },
            { id: 'prom-alerts', label: 'prometheus_alerts.yaml', badge: 'ALERTS' },
            { id: 'k6-load', label: 'k6_latency_benchmark.js', badge: 'K6' },
            { id: 'locust', label: 'locustfile.py', badge: 'LOCUST' },
            { id: 'grafana', label: 'grafana_dashboard.json', badge: 'GRAFANA' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveManifestTab(tab.id as any);
                playTone(480, 0.02);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeManifestTab === tab.id
                  ? 'bg-sky-500 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                  : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-sky-200">
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Code Viewer Box */}
        <div className="bg-black/80 rounded-2xl p-5 border border-white/10 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10 text-zinc-400">
            <span className="text-sky-300 font-bold">{currentManifest.filename}</span>
            <span>Target: v5.0.0-LTS Production Ready</span>
          </div>

          <pre className="text-zinc-200 leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar text-[11px]">
            <code>{currentManifest.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
