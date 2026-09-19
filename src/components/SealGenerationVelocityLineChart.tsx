import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Activity,
  Zap,
  TrendingUp,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { CANONICAL_SEALS } from '../data/canonicalData';

export interface SealGenerationEpochData {
  epoch: string;
  blockNumber: number;
  cumulativeSeals: number;
  generationVelocity: number; // seals per second
  batchSize: number;
  latencyMs: number;
  hsmSignersCount: number;
  status: string;
}

export const HISTORICAL_SEAL_GENERATION_DATA: SealGenerationEpochData[] = [
  {
    epoch: 'T-04 (08:00)',
    blockNumber: 849198,
    cumulativeSeals: 2800,
    generationVelocity: 1420,
    batchSize: 2800,
    latencyMs: 2.8,
    hsmSignersCount: 10,
    status: 'GENESIS_BOOTSTRAP',
  },
  {
    epoch: 'T-03 (08:10)',
    blockNumber: 849199,
    cumulativeSeals: 6200,
    generationVelocity: 2150,
    batchSize: 3400,
    latencyMs: 2.1,
    hsmSignersCount: 10,
    status: 'LATTICE_EXPANSION',
  },
  {
    epoch: 'T-02 (08:20)',
    blockNumber: 849200,
    cumulativeSeals: 9950,
    generationVelocity: 2980,
    batchSize: 3750,
    latencyMs: 1.6,
    hsmSignersCount: 10,
    status: 'RING_BUFFER_PARITY',
  },
  {
    epoch: 'T-01 (08:25)',
    blockNumber: 849201,
    cumulativeSeals: 13400,
    generationVelocity: 3450,
    batchSize: 3450,
    latencyMs: 1.2,
    hsmSignersCount: 10,
    status: 'QUORUM_HARDENING',
  },
  {
    epoch: 'T-00 (08:30)',
    blockNumber: 849202,
    cumulativeSeals: 14902,
    generationVelocity: 3820,
    batchSize: 1502,
    latencyMs: 0.9,
    hsmSignersCount: 10,
    status: 'CANONICAL_FROZEN',
  },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomSealChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data: SealGenerationEpochData = payload[0].payload;
    return (
      <div className="p-3 rounded-xl bg-[#08121a]/95 border border-cyan-500/40 text-xs font-mono shadow-[0_0_25px_rgba(6,182,212,0.3)] backdrop-blur-md space-y-1.5 min-w-[200px]">
        <div className="text-zinc-400 font-bold border-b border-white/10 pb-1 flex items-center justify-between">
          <span className="text-cyan-300">{label}</span>
          <span className="text-[10px] text-zinc-500">Block #{data.blockNumber}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-amber-300">
            <span>Cumulative Seals:</span>
            <span className="font-bold">{data.cumulativeSeals.toLocaleString()} / 14,902</span>
          </div>
          <div className="flex items-center justify-between text-cyan-300">
            <span>Velocity:</span>
            <span className="font-bold">{data.generationVelocity.toLocaleString()} seals/s</span>
          </div>
          <div className="flex items-center justify-between text-emerald-400">
            <span>Latency:</span>
            <span className="font-bold">{data.latencyMs} ms</span>
          </div>
          <div className="flex items-center justify-between text-violet-300">
            <span>HSM Quorum:</span>
            <span className="font-bold">{data.hsmSignersCount}/10 Enclaves</span>
          </div>
        </div>

        <div className="pt-1 border-t border-white/5 text-[9px] text-zinc-400">
          Status: <strong className="text-emerald-300">{data.status}</strong>
        </div>
      </div>
    );
  }
  return null;
};

interface SealGenerationVelocityLineChartProps {
  title?: string;
  subtitle?: string;
}

export const SealGenerationVelocityLineChart: React.FC<SealGenerationVelocityLineChartProps> = ({
  title = 'การสร้างตราประทับเมื่อเวลาผ่านไป (Seal Generation Over Time)',
  subtitle = 'แสดงอัตราความเร็ว (Velocity) และการเติบโตสะสมของการสร้างตราประทับทองคำ ๑๔,๙๐๒ ชุดในอดีต',
}) => {
  const [metricMode, setMetricMode] = useState<'both' | 'velocity' | 'cumulative'>('both');

  const maxVelocity = useMemo(() => {
    return Math.max(...HISTORICAL_SEAL_GENERATION_DATA.map((d) => d.generationVelocity));
  }, []);

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0a1520]/90 via-[#070e17]/95 to-black border border-cyan-500/30 text-zinc-200 font-mono shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              GOLD MASTER • RECHARTS VELOCITY
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
              PEAK: {maxVelocity.toLocaleString()} SEALS/SEC
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 font-sans">
            {subtitle}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('both')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              metricMode === 'both' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Metrics
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('velocity')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              metricMode === 'velocity' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Velocity (Speed)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('cumulative')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              metricMode === 'cumulative' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cumulative (14,902)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={HISTORICAL_SEAL_GENERATION_DATA}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis
              dataKey="epoch"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#ffffff20' }}
            />
            {/* Primary Left Y-Axis for Cumulative Seals */}
            {(metricMode === 'both' || metricMode === 'cumulative') && (
              <YAxis
                yAxisId="left"
                stroke="#f59e0b"
                fontSize={10}
                domain={[0, 16000]}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={{ stroke: '#f59e0b40' }}
              />
            )}
            {/* Secondary Right Y-Axis for Generation Velocity */}
            {(metricMode === 'both' || metricMode === 'velocity') && (
              <YAxis
                yAxisId="right"
                orientation={metricMode === 'both' ? 'right' : 'left'}
                stroke="#06b6d4"
                fontSize={10}
                domain={[0, 4500]}
                tickFormatter={(v) => `${v}/s`}
                tickLine={false}
                axisLine={{ stroke: '#06b6d440' }}
              />
            )}

            <Tooltip content={<CustomSealChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />

            {/* Cumulative Seals Golden Line */}
            {(metricMode === 'both' || metricMode === 'cumulative') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cumulativeSeals"
                name="ยอดสะสมตราประทับทองคำ (Seals)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {/* Generation Velocity Cyan Line */}
            {(metricMode === 'both' || metricMode === 'velocity') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="generationVelocity"
                name="ความเร็วการสร้าง (Seals/Sec)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                strokeDasharray="4 2"
                dot={{ r: 4, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-white/5">
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-zinc-500 text-[10px]">Canonical Frozen</div>
          <div className="text-amber-300 font-bold mt-0.5">14,902 Seals</div>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-zinc-500 text-[10px]">Peak Velocity</div>
          <div className="text-cyan-300 font-bold mt-0.5">3,820 seals/s</div>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-zinc-500 text-[10px]">Final Block Height</div>
          <div className="text-emerald-300 font-bold mt-0.5">Block #849202</div>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="text-zinc-500 text-[10px]">Deca-Key Quorum</div>
          <div className="text-violet-300 font-bold mt-0.5">10/10 Enclaves</div>
        </div>
      </div>
    </div>
  );
};
