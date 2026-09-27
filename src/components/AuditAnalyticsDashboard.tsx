import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Calendar,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Clock,
  Filter,
  Eye,
  Hash
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { exportAuditLogsAsCsv, exportAuditLogsAsJson, ExportableAuditEvent } from '../utils/exportCsv';
import { SovereignAuditEvent, isAnomalyEvent } from '../services/anomalyDetector';
import { AnomalyDetailModal } from './AnomalyDetailModal';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { HardwareHeartbeatStabilityTrend } from './HardwareHeartbeatStabilityTrend';
import { ThirtyDayTelemetryVolatilityD3Chart } from './ThirtyDayTelemetryVolatilityD3Chart';

export type TimeframeOption = '24h' | '7d' | '30d';

export interface AuditDailyDataPoint {
  utcDate: string;
  totalEvents: number;
  anomalies: number;
  avgDrift: number;
}

export interface AuditAnalyticsResponse {
  timeframe: TimeframeOption;
  totalEvents: number;
  totalAnomalies: number;
  acknowledgedAnomalies: number;
  avgDriftPercentage: number;
  dailyTrend: AuditDailyDataPoint[];
  events: SovereignAuditEvent[];
}

export const AuditAnalyticsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [analyticsData, setAnalyticsData] = useState<AuditAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<SovereignAuditEvent | null>(null);

  const fetchAnalytics = useCallback(async (tf: TimeframeOption) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/audit-analytics?timeframe=${tf}`);
      if (!res.ok) {
        if (res.status === 503) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'DatabaseConnectionError: Permanent storage not established or unreachable.');
        }
        throw new Error(`Failed to load audit analytics (HTTP ${res.status})`);
      }
      const data: AuditAnalyticsResponse = await res.json();
      setAnalyticsData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setAnalyticsData(null);
      playTone(250, 0.1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe, fetchAnalytics]);

  const handleExportCsv = () => {
    if (!analyticsData || !analyticsData.events.length) return;
    playAuditChime();
    const exportEvents: ExportableAuditEvent[] = analyticsData.events.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      eventType: e.eventType,
      status: e.status,
      operator: e.operator,
      driftPercentage: e.driftPercentage,
      blockHash: e.blockHash,
      signature: e.signature,
      acknowledged: e.acknowledged,
      details: isAnomalyEvent(e) ? 'ANOMALY DETECTED' : 'NOMINAL'
    }));
    exportAuditLogsAsCsv(exportEvents);
  };

  const handleExportJson = () => {
    if (!analyticsData || !analyticsData.events.length) return;
    playAuditChime();
    const exportEvents: ExportableAuditEvent[] = analyticsData.events.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      eventType: e.eventType,
      status: e.status,
      operator: e.operator,
      driftPercentage: e.driftPercentage,
      blockHash: e.blockHash,
      signature: e.signature,
      acknowledged: e.acknowledged,
      details: isAnomalyEvent(e) ? 'ANOMALY DETECTED' : 'NOMINAL'
    }));
    exportAuditLogsAsJson(exportEvents);
  };

  const anomaliesList = (analyticsData?.events || []).filter(isAnomalyEvent);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-mono text-white">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0a0f1e] border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-wider text-white">
                ZYRQUEN Audit Analytics & Trends
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border-cyan-500/40">
                UTC BOUND
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              UTC Daily Grouped Invariant Verification • RFC 4180 Evidence Export
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#070b14] border-zinc-800 rounded-xl p-1 text-xs">
            {(['24h', '7d', '30d'] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  playTone(440, 0.03);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(timeframe)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#070b14] border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Export Buttons */}
          <button
            onClick={handleExportCsv}
            disabled={!analyticsData || !analyticsData.events.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070b14] border-cyan-500/30 hover:bg-cyan-950/40 text-cyan-300 text-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={!analyticsData || !analyticsData.events.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070b14] border-cyan-500/30 hover:bg-cyan-950/40 text-cyan-300 text-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Error Fallback Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border-amber-500/40 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Telemetry Fallback Status</span>
          </div>
          <p className="text-amber-200/90 leading-relaxed">
            {errorMessage}
          </p>
          <p className="text-[11px] text-zinc-400">
            Zero-Trust Constraint: In-memory mock data will NOT be generated to mask storage errors.
          </p>
        </div>
      )}

      {/* Summary KPI Cards */}
      {analyticsData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#0a0f1e] border-cyan-500/20">
            <span className="text-[10.5px] text-zinc-400 block mb-1">Total Audit Events</span>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {analyticsData.totalEvents.toLocaleString()}
            </div>
            <span className="text-[10px] text-cyan-400/80 mt-1 block">Window: {timeframe.toUpperCase()}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a0f1e] border-rose-500/30">
            <span className="text-[10.5px] text-zinc-400 block mb-1">Detected Anomalies</span>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 tracking-tight flex items-center gap-2">
              <span>{analyticsData.totalAnomalies}</span>
              {analyticsData.totalAnomalies > 0 && (
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] text-rose-400/80 mt-1 block">Drift ≥ 15% or Failure</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a0f1e] border-emerald-500/30">
            <span className="text-[10.5px] text-zinc-400 block mb-1">Acknowledged</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
              {analyticsData.acknowledgedAnomalies} / {analyticsData.totalAnomalies}
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">Immutable Trail Signed</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a0f1e] border-cyan-500/20">
            <span className="text-[10.5px] text-zinc-400 block mb-1">Mean Telemetric Drift</span>
            <div className="text-xl sm:text-2xl font-bold text-cyan-300 tracking-tight">
              {analyticsData.avgDriftPercentage.toFixed(2)}%
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">Threshold &lt; 15.00%</span>
          </div>
        </div>
      )}

      {/* UTC Trend Graph */}
      <div className="p-5 rounded-2xl bg-[#0a0f1e] border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>UTC Daily Execution & Anomaly Volatility</span>
          </div>
          <span className="text-[10.5px] text-zinc-400">Aggregated by Date (00:00:00 UTC)</span>
        </div>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-zinc-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Computing UTC telemetry bins...</span>
          </div>
        ) : !analyticsData || analyticsData.dailyTrend.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-xs">
            <span>No telemetry records found for timeframe {timeframe.toUpperCase()}</span>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="anomaliesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="utcDate" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070b14',
                    border: '1px solid rgba(6,182,212,0.3)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalEvents"
                  name="Total Invariants"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#eventsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="anomalies"
                  name="Anomalies"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#anomaliesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 30-Day D3.js Telemetry Volatility & Baseline Drift Component */}
      <ThirtyDayTelemetryVolatilityD3Chart />

      {/* Hardware Heartbeat Stability 60-Minute Trend Line Component */}
      <HardwareHeartbeatStabilityTrend />

      {/* Anomalies Inspection List */}
      <div className="rounded-2xl bg-[#0a0f1e] border-cyan-500/20 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-[#080d19]">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Flagged Telemetry Anomalies ({anomaliesList.length})</span>
          </div>
          <span className="text-[11px] text-zinc-400">Click entry to inspect cryptographic diagnostic</span>
        </div>

        {anomaliesList.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-zinc-300 font-bold">Zero Anomalies in Selected Timeframe</p>
            <p className="text-[11px] text-zinc-500">All audit invariants verified strictly under 15% drift.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {anomaliesList.map((anom) => (
              <div
                key={anom.id}
                onClick={() => {
                  playTone(480, 0.03);
                  setSelectedAnomaly(anom);
                }}
                className="p-3.5 sm:p-4 hover:bg-amber-500/[0.04] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{anom.eventType}</span>
                    <span className={`px-2 py-0.2 rounded text-[9.5px] font-bold uppercase ${
                      anom.status === 'SUCCESS'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950 text-rose-300 border-rose-500/40'
                    }`}>
                      {anom.status}
                    </span>
                    {anom.acknowledged ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border-emerald-500/40 text-[9px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        ACKNOWLEDGED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border-amber-500/40 text-[9px] font-bold">
                        ACTION REQUIRED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                    <span>ID: {anom.id}</span>
                    <span>•</span>
                    <span>Operator: {anom.operator || 'system'}</span>
                    <span>•</span>
                    <span>{anom.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block">Drift</span>
                    <span className="font-bold text-amber-400 text-xs sm:text-sm">
                      {anom.driftPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-900/60 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anomaly Diagnostic Modal */}
      <AnomalyDetailModal
        event={selectedAnomaly}
        isOpen={Boolean(selectedAnomaly)}
        onClose={() => setSelectedAnomaly(null)}
        onAcknowledged={(ackId) => {
          if (analyticsData) {
            setAnalyticsData({
              ...analyticsData,
              acknowledgedAnomalies: analyticsData.acknowledgedAnomalies + 1,
              events: analyticsData.events.map(e =>
                e.id === ackId ? { ...e, acknowledged: true } : e
              )
            });
          }
        }}
      />
    </div>
  );
};
