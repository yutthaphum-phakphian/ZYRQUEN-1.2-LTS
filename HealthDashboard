import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Activity, Cpu, HardDrive, Thermometer, ShieldAlert, ShieldCheck } from 'lucide-react';
import { HardwareSnapshot } from '../types';
import { toast } from '../utils/toast';

export interface SnapshotData {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  cryostatTemp: number;
}

interface HealthDashboardProps {
  snapshots?: (SnapshotData | HardwareSnapshot)[];
  title?: string;
  className?: string;
  /** Optional override for tests or a parent that already owns the HSM poll. */
  hsmAvailabilityPercent?: number;
}

export interface ChartSnapshot extends SnapshotData {
  observedAt: number | null;
}

export const RESOURCE_ALERT_THRESHOLD = 90;
export const RESOURCE_ALERT_DURATION_MS = 5 * 60 * 1000;
const MAX_SAMPLE_GAP_MS = 2 * 60 * 1000;
const HSM_POLL_INTERVAL_MS = 30 * 1000;
const HSM_REMEDIATION_ENDPOINT = '/api/v1/hsm/heal-all';

function parseObservedAt(snapshot: SnapshotData | HardwareSnapshot): number | null {
  const timestamp = 'timestamp' in snapshot
    ? snapshot.timestamp
    : Date.parse(snapshot.timestampUtc) && !Number.isNaN(Date.parse(snapshot.timestampUtc))
      ? snapshot.timestampUtc
      : snapshot.timestampIct;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSnapshot(snapshot: SnapshotData | HardwareSnapshot): ChartSnapshot {
  const hasCpuUsage = 'cpuUsage' in snapshot;
  const cpuUsage = hasCpuUsage
    ? snapshot.cpuUsage
    : 'cpuAverage' in snapshot && Number.isFinite(snapshot.cpuAverage)
      ? snapshot.cpuAverage
      : 'cpuCores' in snapshot && snapshot.cpuCores.length > 0
        ? snapshot.cpuCores.reduce((sum, core) => sum + core, 0) / snapshot.cpuCores.length
        : 0;
  const memoryUsage = 'memoryUsage' in snapshot
    ? snapshot.memoryUsage
    : 'memoryTotalMb' in snapshot && snapshot.memoryTotalMb > 0
      ? (snapshot.memoryUsedMb / snapshot.memoryTotalMb) * 100
      : 0;
  const cryostatTemp = 'cryostatTemp' in snapshot
    ? snapshot.cryostatTemp
    : 'cryoTempMk' in snapshot
      ? snapshot.cryoTempMk / 1000
      : 0;
  const timestamp = 'timestamp' in snapshot
    ? snapshot.timestamp
    : snapshot.timestampUtc || snapshot.timestampIct;

  return {
    timestamp,
    cpuUsage: Number.isFinite(cpuUsage) ? cpuUsage : 0,
    memoryUsage: Number.isFinite(memoryUsage) ? memoryUsage : 0,
    cryostatTemp: Number.isFinite(cryostatTemp) ? cryostatTemp : 0,
    observedAt: parseObservedAt(snapshot),
  };
}

/** Only treats a dense, timestamped run of high samples as a sustained breach. */
export function isMetricSustainedAboveThreshold(
  samples: ChartSnapshot[],
  metric: 'cpuUsage' | 'memoryUsage',
  now = Date.now()
): boolean {
  const ordered = samples
    .filter((sample) => sample.observedAt !== null)
    .slice()
    .sort((left, right) => (left.observedAt ?? 0) - (right.observedAt ?? 0));
  if (ordered.length < 2) return false;

  const latest = ordered[ordered.length - 1];
  if (latest.observedAt === null || now - latest.observedAt > MAX_SAMPLE_GAP_MS) return false;

  let firstHighSample = latest;
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    const current = ordered[index];
    const previous = ordered[index - 1];
    if (
      current.observedAt === null ||
      previous.observedAt === null ||
      current[metric] <= RESOURCE_ALERT_THRESHOLD ||
      previous[metric] <= RESOURCE_ALERT_THRESHOLD ||
      current.observedAt - previous.observedAt > MAX_SAMPLE_GAP_MS
    ) {
      break;
    }
    firstHighSample = previous;
  }

  return (
    firstHighSample.observedAt !== null &&
    latest.observedAt - firstHighSample.observedAt > RESOURCE_ALERT_DURATION_MS
  );
}

const formatDuration = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  return `${minutes}m ${seconds}s`;
};

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  snapshots = [],
  title = 'System Health Dashboard',
  className = '',
  hsmAvailabilityPercent,
}) => {
  const chartData = useMemo(() => snapshots.slice(-60).map(normalizeSnapshot), [snapshots]);
  const [polledHsmAvailability, setPolledHsmAvailability] = useState<number | null>(null);
  const previousHsmAlertRef = useRef(false);
  const hsmPercent = hsmAvailabilityPercent ?? polledHsmAvailability;
  const latestPoint = chartData[chartData.length - 1];
  const now = Date.now();
  const cpuSustained = isMetricSustainedAboveThreshold(chartData, 'cpuUsage', now);
  const memorySustained = isMetricSustainedAboveThreshold(chartData, 'memoryUsage', now);
  const cpuCurrentlyHigh = (latestPoint?.cpuUsage ?? 0) > RESOURCE_ALERT_THRESHOLD;
  const memoryCurrentlyHigh = (latestPoint?.memoryUsage ?? 0) > RESOURCE_ALERT_THRESHOLD;

  useEffect(() => {
    if (hsmAvailabilityPercent !== undefined) return undefined;
    let isMounted = true;
    const readHsmAvailability = async () => {
      try {
        const response = await fetch('/api/v1/hsm/quorum-status');
        if (!response.ok) return;
        const status: unknown = await response.json();
        if (typeof status !== 'object' || status === null) return;
        const quorum = status as { activeCount?: unknown; totalCount?: unknown };
        if (
          typeof quorum.activeCount === 'number' &&
          typeof quorum.totalCount === 'number' &&
          quorum.totalCount > 0 &&
          isMounted
        ) {
          setPolledHsmAvailability((quorum.activeCount / quorum.totalCount) * 100);
        }
      } catch {
        // Do not infer a breach from missing or unavailable telemetry.
      }
    };
    void readHsmAvailability();
    const intervalId = window.setInterval(() => void readHsmAvailability(), HSM_POLL_INTERVAL_MS);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [hsmAvailabilityPercent]);

  useEffect(() => {
    if (hsmPercent === null) return;
    const isBelowThreshold = hsmPercent < 80;
    if (isBelowThreshold && !previousHsmAlertRef.current) {
      toast.error(`HSM availability dropped to ${hsmPercent.toFixed(0)}% (below 80%). Restore the HSM quorum.`, {
        toastId: 'hsm-availability-below-80',
        durationMs: 15_000,
        action: {
          label: 'Restore HSM quorum',
          onClick: async () => {
            try {
              const response = await fetch(HSM_REMEDIATION_ENDPOINT, { method: 'POST' });
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const result: unknown = await response.json();
              const remediation = typeof result === 'object' && result !== null
                ? result as { activeNodes?: unknown; totalNodes?: unknown }
                : {};
              if (typeof remediation.activeNodes === 'number' && typeof remediation.totalNodes === 'number' && remediation.totalNodes > 0) {
                const recoveredPercent = (remediation.activeNodes / remediation.totalNodes) * 100;
                if (hsmAvailabilityPercent === undefined) setPolledHsmAvailability(recoveredPercent);
              }
              toast.success('HSM quorum remediation completed.', { toastId: 'hsm-remediation-complete' });
            } catch {
              toast.error('HSM remediation failed. Open Security > HSM Quorum and retry.', {
                toastId: 'hsm-remediation-failed',
              });
            }
          },
        },
      });
    }
    previousHsmAlertRef.current = isBelowThreshold;
  }, [hsmAvailabilityPercent, hsmPercent]);

  return (
    <section className={`p-4 sm:p-6 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-xl text-white ${className}`} aria-label={title}>
      <header className="flex flex-col gap-4 mb-5 border-b border-slate-800 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold font-mono text-cyan-400 flex flex-wrap items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-normal">LIVE TELEMETRY</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">CPU, Memory, HSM availability &amp; cryostat telemetry</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${cpuSustained ? 'bg-red-950/80 border-red-500 text-red-200' : cpuCurrentlyHigh ? 'bg-amber-950/70 border-amber-500/60 text-amber-200' : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-200'}`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>CPU: <strong className="text-white">{latestPoint ? `${latestPoint.cpuUsage.toFixed(1)}%` : '—'}</strong></span>
            {cpuSustained && <ShieldAlert className="w-3.5 h-3.5" aria-label="CPU alert" />}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${memorySustained ? 'bg-red-950/80 border-red-500 text-red-200' : memoryCurrentlyHigh ? 'bg-amber-950/70 border-amber-500/60 text-amber-200' : 'bg-blue-950/60 border-blue-500/30 text-blue-200'}`}>
            <HardDrive className="w-3.5 h-3.5" />
            <span>Memory: <strong className="text-white">{latestPoint ? `${latestPoint.memoryUsage.toFixed(1)}%` : '—'}</strong></span>
            {memorySustained && <ShieldAlert className="w-3.5 h-3.5" aria-label="Memory alert" />}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${hsmPercent !== null && hsmPercent < 80 ? 'bg-red-950/80 border-red-500 text-red-200' : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'}`}>
            {hsmPercent !== null && hsmPercent < 80 ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>HSM: <strong className="text-white">{hsmPercent === null ? '—' : `${hsmPercent.toFixed(0)}%`}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-emerald-950/60 border-emerald-500/30 text-emerald-200">
            <Thermometer className="w-3.5 h-3.5" />
            <span>Cryo: <strong className="text-white">{latestPoint ? `${latestPoint.cryostatTemp.toFixed(3)} K` : '—'}</strong></span>
          </div>
        </div>
      </header>

      {(cpuSustained || memorySustained) && (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/70 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          <div className="font-bold">Sustained resource threshold exceeded</div>
          <p className="mt-1 text-xs text-red-100/90">
            {[
              cpuSustained ? `CPU ${latestPoint?.cpuUsage.toFixed(1)}%` : null,
              memorySustained ? `Memory ${latestPoint?.memoryUsage.toFixed(1)}%` : null,
            ].filter(Boolean).join(' and ')} stayed above 90% for more than 5 minutes. Investigate and remediate the affected workload.
          </p>
        </div>
      )}

      <div className="h-72 sm:h-80 w-full min-w-0 font-mono text-xs">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="usage" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="temperature" orientation="right" stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#070c1a', borderColor: '#1e293b', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)', color: '#f8fafc', fontSize: '12px', fontFamily: 'monospace' }}
                itemStyle={{ padding: '2px 0' }}
              />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontFamily: 'monospace' }} />
              <ReferenceLine yAxisId="usage" y={RESOURCE_ALERT_THRESHOLD} stroke="#f87171" strokeDasharray="5 5" label={{ value: '90% alert threshold', fill: '#fca5a5', fontSize: 10 }} />
              <Line yAxisId="usage" type="monotone" dataKey="cpuUsage" name="CPU Usage (%)" stroke={cpuSustained ? '#ef4444' : '#22d3ee'} strokeWidth={cpuSustained ? 3 : 2} dot={{ r: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line yAxisId="usage" type="monotone" dataKey="memoryUsage" name="Memory Usage (%)" stroke={memorySustained ? '#ef4444' : '#3b82f6'} strokeWidth={memorySustained ? 3 : 2} dot={{ r: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line yAxisId="temperature" type="monotone" dataKey="cryostatTemp" name="Cryostat Temp (K)" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: '#10b981' }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-500">
            Waiting for timestamped hardware telemetry…
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] text-slate-500 font-mono">
        Alert rule: CPU or Memory &gt; 90% continuously for &gt; 5 minutes. Gaps longer than 2 minutes reset the visual timer.
        {(cpuSustained || memorySustained) && latestPoint?.timestamp && ` Latest sample: ${formatDuration(Math.max(0, now - (chartData[chartData.length - 1].observedAt ?? now)))} ago.`}
      </p>
    </section>
  );
};

export default HealthDashboard;
