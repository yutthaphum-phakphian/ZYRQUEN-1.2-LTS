import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, AlertTriangle, Zap, Activity } from 'lucide-react';
import { SystemEvent } from '../SystemEventsSidebar';
import { getEventLatencyMs } from '../LegalTriggerCard';

export interface DayVerificationPoint {
  dayIndex: number;
  dateStr: string;
  label: string;
  passes: number;
  fails: number;
  total: number;
  passRate: number;
  avgLatencyMs: number;
}

export interface ThirtyDayTriggerSparklineProps {
  triggerId: string;
  triggerSection: string;
  historyEvents: SystemEvent[];
}

/**
 * Deterministic pseudo-random generator based on string seed
 */
function pseudoHash(str: string, index: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash + index * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Generate 30 days of verification attempts trend, integrating live buffer events on Day 0 (today)
 */
export function generate30DayVerificationData(
  triggerId: string,
  historyEvents: SystemEvent[]
): DayVerificationPoint[] {
  const points: DayVerificationPoint[] = [];
  const now = new Date();

  // Count live events & latency for today
  let todayPasses = 0;
  let todayFails = 0;
  let todayLatencySum = 0;
  let todayLatencyCount = 0;

  historyEvents.forEach((evt) => {
    const isFail =
      evt.severity === 'critical' ||
      evt.title.toLowerCase().includes('fail') ||
      evt.title.toLowerCase().includes('drift') ||
      evt.title.toLowerCase().includes('reject') ||
      evt.title.toLowerCase().includes('anomaly');

    if (isFail) {
      todayFails++;
    } else {
      todayPasses++;
    }

    const lat = getEventLatencyMs(evt);
    if (lat !== null) {
      todayLatencySum += lat;
      todayLatencyCount++;
    }
  });

  const todayAvgLatency =
    todayLatencyCount > 0
      ? Number((todayLatencySum / todayLatencyCount).toFixed(2))
      : Number((0.18 + pseudoHash(triggerId, 0) * 0.2).toFixed(2));

  // Build 30 days (from day -29 to day 0 / today)
  for (let d = 29; d >= 0; d--) {
    const targetDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];
    const month = targetDate.getMonth() + 1;
    const dateNum = targetDate.getDate();
    const label = d === 0 ? 'Today' : `${month}/${dateNum}`;

    if (d === 0) {
      // Today: base + actual live buffer events
      const basePass = 18 + Math.floor(pseudoHash(triggerId, 0) * 8);
      const totalPass = basePass + todayPasses;
      const totalFail = todayFails;
      const total = totalPass + totalFail;
      const passRate = total > 0 ? (totalPass / total) * 100 : 100;

      points.push({
        dayIndex: 30 - d,
        dateStr,
        label,
        passes: totalPass,
        fails: totalFail,
        total,
        passRate: Number(passRate.toFixed(2)),
        avgLatencyMs: todayAvgLatency,
      });
    } else {
      // Historical days 1 to 29
      const rand = pseudoHash(triggerId, d);
      const rand2 = pseudoHash(triggerId + '_fail', d);

      // Baseline 16-28 verification cycles per day
      const dailyPasses = 16 + Math.floor(rand * 12);
      // Rare simulated adversarial test (1-2 isolated tests in 30 days)
      const hasSimulatedFail = rand2 > 0.94 && d % 7 === 3;
      const dailyFails = hasSimulatedFail ? 1 : 0;
      const dailyTotal = dailyPasses + dailyFails;
      const passRate = (dailyPasses / dailyTotal) * 100;
      const dailyLatency = Number((0.15 + (rand * 0.35) + (hasSimulatedFail ? 1.45 : 0)).toFixed(2));

      points.push({
        dayIndex: 30 - d,
        dateStr,
        label,
        passes: dailyPasses,
        fails: dailyFails,
        total: dailyTotal,
        passRate: Number(passRate.toFixed(2)),
        avgLatencyMs: dailyLatency,
      });
    }
  }

  return points;
}

export const ThirtyDayTriggerSparkline: React.FC<ThirtyDayTriggerSparklineProps> = ({
  triggerId,
  triggerSection,
  historyEvents,
}) => {
  const [trendMetric, setTrendMetric] = useState<'passRate' | 'latency'>('passRate');

  const data = useMemo(
    () => generate30DayVerificationData(triggerId, historyEvents),
    [triggerId, historyEvents]
  );

  const stats = useMemo(() => {
    const totalPasses = data.reduce((acc, p) => acc + p.passes, 0);
    const totalFails = data.reduce((acc, p) => acc + p.fails, 0);
    const totalAll = totalPasses + totalFails;
    const avgPassRate = totalAll > 0 ? (totalPasses / totalAll) * 100 : 100;
    const avgLatency = (
      data.reduce((acc, p) => acc + p.avgLatencyMs, 0) / (data.length || 1)
    ).toFixed(2);

    return {
      totalPasses,
      totalFails,
      totalAll,
      avgPassRate: avgPassRate.toFixed(2),
      avgLatency,
    };
  }, [data]);

  const [hoveredPoint, setHoveredPoint] = useState<DayVerificationPoint | null>(null);

  return (
    <div
      data-testid={`sparkline-container-${triggerId}`}
      className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-2 font-mono text-[10px]"
    >
      {/* Sparkline Header & Metrics */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-zinc-300 font-bold text-[9px] uppercase tracking-wider">
            30-Day Trend
          </span>
        </div>

        {/* Trend Mode Switcher (Success/Fail Trend vs Latency Trend) */}
        <div className="flex items-center bg-black/60 p-0.5 rounded border border-white/10 text-[8px]">
          <button
            type="button"
            data-testid={`sparkline-toggle-pass-${triggerId}`}
            onClick={() => setTrendMetric('passRate')}
            className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-semibold ${
              trendMetric === 'passRate'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pass Rate
          </button>
          <button
            type="button"
            data-testid={`sparkline-toggle-latency-${triggerId}`}
            onClick={() => setTrendMetric('latency')}
            className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-semibold ${
              trendMetric === 'latency'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Latency (ms)
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {trendMetric === 'passRate' ? (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>{stats.avgPassRate}% PASS</span>
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-cyan-400" />
              <span>{stats.avgLatency}ms AVG</span>
            </span>
          )}

          <span className="text-[8px] text-zinc-400">
            {stats.totalAll} probes / 30d
          </span>
        </div>
      </div>

      {/* Sparkline Chart Container */}
      <div className="h-14 w-full relative min-h-[56px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={48}>
          <AreaChart
            data={data}
            margin={{ top: 2, right: 2, left: 2, bottom: 0 }}
            onMouseMove={(e: any) => {
              if (e && e.activePayload && e.activePayload.length) {
                setHoveredPoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id={`grad-spark-pass-${triggerId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`grad-spark-latency-${triggerId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis domain={trendMetric === 'passRate' ? [90, 100] : [0, 'auto']} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as DayVerificationPoint;
                  return (
                    <div className="p-1.5 rounded-lg bg-[#070b14] border border-cyan-500/40 text-[9px] font-mono text-zinc-200 shadow-xl space-y-0.5">
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-0.5 font-bold text-cyan-300">
                        <span>{pt.dateStr}</span>
                        {trendMetric === 'passRate' ? (
                          <span className="text-emerald-400">{pt.passRate}%</span>
                        ) : (
                          <span className="text-cyan-300">{pt.avgLatencyMs}ms</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-zinc-300">
                        <span>Pass / Total:</span>
                        <span className="text-emerald-400 font-bold">{pt.passes} / {pt.total}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-purple-300">
                        <span>Avg Latency:</span>
                        <span className="font-bold">{pt.avgLatencyMs}ms</span>
                      </div>
                      {pt.fails > 0 && (
                        <div className="flex items-center justify-between gap-2 text-rose-300">
                          <span>Fails (Isolated):</span>
                          <span className="text-rose-400 font-bold">{pt.fails}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={trendMetric === 'passRate' ? 'passRate' : 'avgLatencyMs'}
              stroke={trendMetric === 'passRate' ? '#10b981' : '#06b6d4'}
              strokeWidth={1.8}
              fillOpacity={1}
              fill={`url(#${trendMetric === 'passRate' ? `grad-spark-pass-${triggerId}` : `grad-spark-latency-${triggerId}`})`}
              dot={false}
              activeDot={{
                r: 3,
                fill: trendMetric === 'passRate' ? '#06b6d4' : '#a855f7',
                stroke: '#fff',
                strokeWidth: 1,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 30-Day Axis Ticks & Point Inspection */}
      <div className="flex items-center justify-between text-[8px] text-zinc-500 border-t border-white/5 pt-1">
        <span>-30 Days</span>
        <span>-15 Days</span>
        {hoveredPoint ? (
          <span className="text-cyan-300 font-bold">
            {hoveredPoint.label}: {trendMetric === 'passRate' ? `${hoveredPoint.passRate}% pass` : `${hoveredPoint.avgLatencyMs}ms avg latency`}
          </span>
        ) : (
          <span className="text-emerald-400 font-semibold">Today (Live)</span>
        )}
      </div>
    </div>
  );
};
