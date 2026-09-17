import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Clock, ShieldCheck, CheckCircle2, TrendingUp, Cpu } from 'lucide-react';
import { CouncilMember } from '../../data/councilData';

interface HistoricalUptimeSparklineProps {
  member: CouncilMember;
}

export const HistoricalUptimeSparkline: React.FC<HistoricalUptimeSparklineProps> = ({ member }) => {
  // Generate deterministic 24-hour uptime and latency hourly data points based on member slotId
  const hourlyData = Array.from({ length: 24 }).map((_, i) => {
    const hour = (24 - i) % 24;
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
    // High uptime baseline: 99.98% - 100.00%
    const baseUptime = 99.98;
    const variation = Math.sin((i + member.slotId) * 0.7) * 0.018;
    const uptimePct = Math.min(100, Math.max(99.92, Number((baseUptime + variation).toFixed(3))));

    // Latency variation: 0.12ms - 0.28ms
    const baseLatency = 0.14 + (member.slotId % 4) * 0.02;
    const latencyJitter = Math.cos((i * 1.3) + member.slotId) * 0.035;
    const latencyMs = Math.max(0.11, Number((baseLatency + latencyJitter).toFixed(2)));

    // Sub-Kelvin cryogenic bus temperature in Kelvin: 0.08K - 0.35K
    const tempK = (0.12 + Math.sin(i * 0.5 + member.slotId) * 0.04).toFixed(3);

    return {
      hourLabel,
      hourIndex: i,
      uptimePct,
      latencyMs,
      tempK,
      status: 'OPTIMAL',
    };
  }).reverse();

  const currentUptime = (
    hourlyData.reduce((acc, curr) => acc + curr.uptimePct, 0) / hourlyData.length
  ).toFixed(3);

  const avgLatency = (
    hourlyData.reduce((acc, curr) => acc + curr.latencyMs, 0) / hourlyData.length
  ).toFixed(2);

  const minLatency = Math.min(...hourlyData.map((d) => d.latencyMs)).toFixed(2);

  return (
    <div className="p-4 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 space-y-3 font-mono shadow-lg relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Activity className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Historical Uptime & Connectivity (24 Hours)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                100% RELIABLE
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block font-sans">
              บันทึกเวลาทำงานและประสิทธิภาพการเชื่อมต่อบัส Sub-Kelvin ย้อนหลัง 24 ชั่วโมง
            </span>
          </div>
        </div>

        {/* 24h Average Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-right">
            <span className="text-[10px] text-zinc-400 block">24h Uptime</span>
            <span className="text-emerald-400 font-bold">{currentUptime}%</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-right">
            <span className="text-[10px] text-zinc-400 block">Avg Latency</span>
            <span className="text-cyan-400 font-bold">{avgLatency} ms</span>
          </div>
        </div>
      </div>

      {/* Sparkline Area Chart */}
      <div className="h-28 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`uptimeGrad-${member.slotId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id={`latencyGrad-${member.slotId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hourLabel"
              stroke="#52525b"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              domain={[99.85, 100]}
              stroke="#52525b"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-xl bg-zinc-950/95 border border-emerald-500/40 text-xs shadow-2xl space-y-1">
                      <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400">
                        <span>เวลา: {data.hourLabel}</span>
                        <span className="text-emerald-400 font-bold">HSM Active</span>
                      </div>
                      <div className="text-white text-xs">
                        Uptime: <strong className="text-emerald-400">{data.uptimePct}%</strong>
                      </div>
                      <div className="text-zinc-300 text-[11px]">
                        Latency: <strong className="text-cyan-400">{data.latencyMs} ms</strong>
                      </div>
                      <div className="text-zinc-400 text-[10px]">
                        Cryo Temp: {data.tempK} K
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="uptimePct"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#uptimeGrad-${member.slotId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[10px]">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>Continuous Run: <strong>24/24 hrs</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 justify-center">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>Fastest Ping: <strong className="text-cyan-300">{minLatency} ms</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 justify-end">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Packet Loss: <strong className="text-emerald-400">0.00%</strong></span>
        </div>
      </div>
    </div>
  );
};
