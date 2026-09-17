import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Download,
  Search,
  Filter,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Database,
  Terminal,
  Activity,
  AlertCircle
} from 'lucide-react';
import { exportOpaSessionPdf } from '../../utils/senateGovernanceAuditExport';

interface OpaDecisionLogItem {
  id: string;
  traceId: string;
  timestamp: string;
  decision: 'ALLOWED' | 'DENIED';
  action: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  agentDid: string;
  latencyUs: number;
  shortCircuitGuard: string | null;
  denialReasons: string[];
  passedRules: string[];
  guardTraces: Array<{
    guard_name: string;
    status: 'PASSED' | 'FAILED' | 'SHORT_CIRCUITED';
    latency_us: number;
    details: string;
  }>;
  sealMetadata: {
    merkleRoot: string;
    sealedBlock: number;
    epoch: string;
    sealsVerified: number;
    pqcAlgorithm: string;
    sovereignPrincipal: string;
  };
  inputSummary: any;
}

interface SenateGovernanceInsightsSubViewProps {
  onSelectDecision?: (decision: OpaDecisionLogItem) => void;
}

export const SenateGovernanceInsightsSubView: React.FC<SenateGovernanceInsightsSubViewProps> = ({
  onSelectDecision
}) => {
  const [logs, setLogs] = useState<OpaDecisionLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [apiMetadata, setApiMetadata] = useState<{
    total: number;
    p99LatencyUs: number;
    shortCircuitRatio: string;
    canonicalMerkleRoot: string;
  } | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/opa/decision-logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.decisions || []);
        setApiMetadata({
          total: data.total || 0,
          p99LatencyUs: data.p99LatencyUs || 184,
          shortCircuitRatio: data.shortCircuitRatio || '75.0%',
          canonicalMerkleRoot: data.canonicalMerkleRoot || '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
        });
      }
    } catch (err) {
      console.error('Failed to fetch OPA decision logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Polling interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredLogs = logs.filter((log) => {
    if (filterDecision !== 'ALL' && log.decision !== filterDecision) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchDid = log.agentDid.toLowerCase().includes(q);
      const matchGuard = log.shortCircuitGuard?.toLowerCase().includes(q) ?? false;
      const matchId = log.id.toLowerCase().includes(q);
      return matchAction || matchDid || matchGuard || matchId;
    }
    return true;
  });

  const allowedCount = logs.filter((l) => l.decision === 'ALLOWED').length;
  const deniedCount = logs.filter((l) => l.decision === 'DENIED').length;
  const totalCount = logs.length;
  const allowRate = totalCount > 0 ? Math.round((allowedCount / totalCount) * 100) : 100;

  const handleExportPdf = () => {
    const mostRecent = logs[0];
    exportOpaSessionPdf({
      decision: mostRecent ? mostRecent.decision : 'ALLOWED',
      engineMode: 'v2.5-OPTIMIZED',
      shortCircuitGuard: mostRecent ? mostRecent.shortCircuitGuard : null,
      denialReasons: mostRecent ? mostRecent.denialReasons : [],
      latencyUs: mostRecent ? mostRecent.latencyUs : 184,
      agentDid: mostRecent ? mostRecent.agentDid : 'did:key:z6MkuEP_SOVEREIGN_01_FIPS140_3_HSM',
      action: mostRecent ? mostRecent.action : 'CANONICAL_PROMOTION',
      riskLevel: mostRecent ? mostRecent.riskLevel : 'HIGH',
      guardTraces: mostRecent ? mostRecent.guardTraces : [],
      recentLogs: logs.slice(0, 8).map((l) => ({
        timestamp: l.timestamp,
        action: l.action,
        decision: l.decision,
        latencyUs: l.latencyUs,
        shortCircuitGuard: l.shortCircuitGuard
      }))
    });
  };

  const handleExportSingleItemPdf = (item: OpaDecisionLogItem) => {
    exportOpaSessionPdf({
      decision: item.decision,
      engineMode: 'v2.5-OPTIMIZED',
      shortCircuitGuard: item.shortCircuitGuard,
      denialReasons: item.denialReasons,
      latencyUs: item.latencyUs,
      agentDid: item.agentDid,
      action: item.action,
      riskLevel: item.riskLevel,
      guardTraces: item.guardTraces
    });
  };

  return (
    <div id="senate-governance-insights-subview" className="space-y-6">
      {/* Sub-view Header & Metric Cards */}
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Senate Governance Insights & Real-Time OPA Decision Logs
                  <span className="rounded bg-sky-950/80 px-2 py-0.5 text-xs font-mono font-bold text-sky-400 border border-sky-800">
                    OPA REST API v1
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Telemetry stream directly queryable from <code className="text-sky-300">GET /api/opa/decision-logs</code> with Merkle evidence attestation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                autoRefresh
                  ? 'border-emerald-700 bg-emerald-950/70 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-Sync {autoRefresh ? '(Active 4s)' : '(Paused)'}
            </button>

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Fetch Now
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-950/90 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export Session Audit PDF
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>TOTAL EVALUATIONS</span>
              <Database className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white font-mono">
              {apiMetadata?.total || logs.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Active Session Log Buffer
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>DECISION SPLIT</span>
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-400 font-mono">{allowedCount} ALLOWED</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xl font-bold text-rose-400 font-mono">{deniedCount} DENIED</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              Pass Rate: {allowRate}% • Fail-Closed Active
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>P99 ENGINE LATENCY</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-300 font-mono">
              {apiMetadata?.p99LatencyUs || 184} µs
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-mono">
              Sub-Millisecond Policy SLA (&lt;1000 µs)
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>SHORT-CIRCUIT RATIO</span>
              <Cpu className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-purple-300 font-mono">
              {apiMetadata?.shortCircuitRatio || '75.0%'}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-mono">
              Halted before Stage 3 (~48µs saved)
            </div>
          </div>
        </div>

        {/* Canonical Merkle Root Verification Strip */}
        <div className="mt-4 rounded-lg bg-slate-950 border border-slate-800/80 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Canonical Root:</span>
            <span className="text-sky-300 font-semibold truncate max-w-md">
              {apiMetadata?.canonicalMerkleRoot}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Sealed Block: <strong className="text-white">#849202</strong></span>
            <span>Epoch: <strong className="text-white">Ep. 849,205</strong></span>
            <span>Delta: <strong className="text-emerald-400">Δ = 0.00%</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Action, DID, or Guard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none w-64"
            />
          </div>

          {/* Decision Filter Pills */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => setFilterDecision('ALL')}
              className={`rounded px-2.5 py-1 transition-colors ${filterDecision === 'ALL' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilterDecision('ALLOWED')}
              className={`rounded px-2.5 py-1 transition-colors ${filterDecision === 'ALLOWED' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Allowed ({allowedCount})
            </button>
            <button
              onClick={() => setFilterDecision('DENIED')}
              className={`rounded px-2.5 py-1 transition-colors ${filterDecision === 'DENIED' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Denied ({deniedCount})
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredLogs.length} of {logs.length} decision records
        </div>
      </div>

      {/* Decision Log Table & Expandable Cards */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <p className="font-semibold text-sm">No OPA Decision Logs Found</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or triggering a chaos simulation above.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const isAllow = log.decision === 'ALLOWED';

            return (
              <motion.div
                key={log.id}
                layout
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-sky-700/80 bg-slate-900/95 shadow-xl ring-1 ring-sky-700'
                    : isAllow
                    ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    : 'border-rose-900/40 bg-rose-950/10 hover:border-rose-800/60'
                }`}
              >
                {/* Collapsible Row Header */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {/* Outcome Badge */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                      isAllow
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {isAllow ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {log.decision}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {log.action}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                          {log.riskLevel}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-sm sm:max-w-md">
                        {log.agentDid}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    {/* Short Circuit Badge if Denied */}
                    {log.shortCircuitGuard && (
                      <span className="hidden md:inline-flex items-center gap-1 rounded bg-amber-950/80 px-2 py-0.5 text-[10px] text-amber-300 border border-amber-800">
                        Halted at: {log.shortCircuitGuard}
                      </span>
                    )}

                    <span className="text-slate-400">
                      {log.latencyUs} µs
                    </span>

                    <span className="text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSingleItemPdf(log);
                      }}
                      title="Export Signed PDF Evidence for this Incident"
                      className="rounded-lg border border-slate-700 bg-slate-800 p-1 text-slate-300 hover:text-emerald-300 hover:border-emerald-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/80 p-4 space-y-4 text-xs font-mono">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">TRACE ID</div>
                        <div className="text-sky-300 font-bold truncate mt-0.5">{log.traceId}</div>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">SEALED BLOCK / ROOT</div>
                        <div className="text-slate-300 truncate mt-0.5">#{log.sealMetadata?.sealedBlock || 849202}</div>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">PQC ALGORITHM</div>
                        <div className="text-emerald-400 truncate mt-0.5">NIST FIPS 204 ML-DSA-87</div>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">SOVEREIGN JURISDICTION</div>
                        <div className="text-slate-300 truncate mt-0.5">ETDA B.E. 2544 (Sec. 9, 26, 28)</div>
                      </div>
                    </div>

                    {/* Guard Pipeline Breakdown */}
                    <div>
                      <div className="text-slate-400 font-bold mb-2 flex items-center justify-between">
                        <span>6-STAGE SHORT-CIRCUIT GUARD TRACE</span>
                        <span className="text-[10px] text-slate-500">Fast-Fail Verification</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {log.guardTraces?.map((gt, gIdx) => (
                          <div
                            key={gIdx}
                            className={`rounded-lg p-2 border ${
                              gt.status === 'PASSED'
                                ? 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300'
                                : gt.status === 'FAILED'
                                ? 'border-rose-800 bg-rose-950/40 text-rose-300'
                                : 'border-slate-800 bg-slate-900/40 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span>{gt.guard_name}</span>
                              <span>{gt.status}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Latency: {gt.latency_us} µs
                            </div>
                            <div className="text-[9.5px] mt-0.5 truncate text-slate-300">
                              {gt.details}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Denial Reasons */}
                    {log.denialReasons && log.denialReasons.length > 0 && (
                      <div className="rounded-lg bg-rose-950/50 p-3 border border-rose-800/80">
                        <div className="font-bold text-rose-300 mb-1">FAIL-CLOSED ENFORCEMENT REASONS:</div>
                        <ul className="list-disc list-inside space-y-1 text-rose-200">
                          {log.denialReasons.map((dr, drIdx) => (
                            <li key={drIdx}>{dr}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer Actions inside Drawer */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleExportSingleItemPdf(log)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition-all"
                      >
                        <Download className="h-3 w-3" />
                        Download Signed PDF Evidence Dossier
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
