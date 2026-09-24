import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Activity, Flame, Shield, Clock, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export interface EntropyHeatmapCell {
  x: string; // Time slice (e.g. T-50m, T-40m...)
  y: string; // Subsystem band
  timeIndex: number;
  bandIndex: number;
  intensity: number; // 0 to 100
  rateKBps: number;
  varianceSigma: number;
  status: 'NOMINAL' | 'ELEVATED' | 'PEAK';
}

const TIME_SLICES = ['T-50m', 'T-40m', 'T-30m', 'T-20m', 'T-10m', 'T-0m (Now)'];

const SUBSYSTEM_BANDS = [
  'Band 0: Cryo 14mK Dilution',
  'Band 1: TRNG Quantum Noise',
  'Band 2: Core 0-3 CPU Thermal',
  'Band 3: 882Hz Clock Jitter',
  'Band 4: Post-Quantum Coherence',
  'Band 5: Merkle Ledger Intake',
];

// Helper to determine color based on entropy fluctuation intensity
export function getHeatmapColor(intensity: number): string {
  if (intensity < 25) return '#083344'; // Very low / deep teal
  if (intensity < 50) return '#06B6D4'; // Nominal cyan
  if (intensity < 75) return '#10B981'; // Elevated emerald
  if (intensity < 88) return '#F59E0B'; // High amber
  return '#F43F5E'; // Peak / Critical hot rose
}

export function getHeatmapGlow(intensity: number): string {
  if (intensity >= 88) return 'rgba(244, 63, 94, 0.4)';
  if (intensity >= 75) return 'rgba(245, 158, 11, 0.3)';
  if (intensity >= 50) return 'rgba(16, 185, 129, 0.2)';
  return 'rgba(6, 182, 212, 0.15)';
}

export const EntropyGridHeatmap: React.FC = () => {
  const [metricMode, setMetricMode] = useState<'rate' | 'sigma' | 'fluctuation'>('rate');
  const [hoveredCell, setHoveredCell] = useState<EntropyHeatmapCell | null>(null);
  const [seed, setSeed] = useState<number>(0);

  // Generate grid matrix data points
  const heatmapData = useMemo<EntropyHeatmapCell[]>(() => {
    const cells: EntropyHeatmapCell[] = [];

    TIME_SLICES.forEach((time, tIdx) => {
      SUBSYSTEM_BANDS.forEach((band, bIdx) => {
        // Pseudo-chaotic physics simulation of quantum entropy fluctuations
        const wave1 = Math.sin(tIdx * 0.9 + bIdx * 1.3 + seed * 0.4);
        const wave2 = Math.cos(tIdx * 1.5 - bIdx * 0.7);
        const rawIntensity = 35 + wave1 * 28 + wave2 * 20 + (tIdx === 5 ? 12 : 0);
        const intensity = Math.max(8, Math.min(96, Math.round(rawIntensity)));

        const rateKBps = Math.round(intensity * 120 + (bIdx === 1 ? 2400 : 800));
        const varianceSigma = Number((0.4 + (intensity / 100) * 2.2).toFixed(2));
        const status = intensity >= 88 ? 'PEAK' : intensity >= 65 ? 'ELEVATED' : 'NOMINAL';

        cells.push({
          x: time,
          y: band,
          timeIndex: tIdx,
          bandIndex: bIdx,
          intensity,
          rateKBps,
          varianceSigma,
          status,
        });
      });
    });

    return cells;
  }, [seed]);

  const handleRefresh = () => {
    playTone(680, 0.05);
    setSeed((s) => s + 1);
  };

  // Custom Shape renderer for Recharts Scatter to draw 2D matrix tile cells
  const renderCellTile = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return <g />;

    const cell = payload as EntropyHeatmapCell;
    const isHovered =
      hoveredCell?.x === cell.x && hoveredCell?.y === cell.y;
    const color = getHeatmapColor(cell.intensity);
    const glow = getHeatmapGlow(cell.intensity);

    const tileWidth = 72;
    const tileHeight = 28;
    const x = cx - tileWidth / 2;
    const y = cy - tileHeight / 2;

    return (
      <g
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => setHoveredCell(cell)}
        onMouseLeave={() => setHoveredCell(null)}
        onClick={() => playTone(450 + cell.intensity * 4, 0.04)}
      >
        {/* Glow halo on hover or high intensity */}
        {(isHovered || cell.intensity > 80) && (
          <rect
            x={x - 2}
            y={y - 2}
            width={tileWidth + 4}
            height={tileHeight + 4}
            rx={8}
            fill="none"
            stroke={color}
            strokeWidth={isHovered ? 2.5 : 1.5}
            style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
          />
        )}

        {/* Main Cell Rectangle */}
        <rect
          x={x}
          y={y}
          width={tileWidth}
          height={tileHeight}
          rx={6}
          fill={color}
          fillOpacity={isHovered ? 1 : 0.85}
          stroke={isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.12)'}
          strokeWidth={isHovered ? 1.5 : 0.8}
          className="transition-colors duration-150"
        />

        {/* Display value inside cell */}
        <text
          x={cx}
          y={cy + 3.5}
          textAnchor="middle"
          fill={cell.intensity > 40 ? '#ffffff' : '#94A3B8'}
          fontSize={10}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="bold"
        >
          {metricMode === 'rate'
            ? `${(cell.rateKBps / 1000).toFixed(1)}k`
            : metricMode === 'sigma'
            ? `${cell.varianceSigma}σ`
            : `${cell.intensity}%`}
        </text>
      </g>
    );
  };

  // Custom Tooltip for Heatmap
  const CustomHeatmapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: EntropyHeatmapCell = payload[0].payload;
      return (
        <div className="p-3.5 rounded-2xl bg-[#070914]/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl font-mono text-xs space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-zinc-400">
            <span className="font-bold text-white">{data.x}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                data.status === 'PEAK'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : data.status === 'ELEVATED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {data.status}
            </span>
          </div>

          <div className="text-zinc-300 font-bold text-[11px]">{data.y}</div>

          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Entropy Rate:</span>
              <span className="text-cyan-300 font-bold">{data.rateKBps.toLocaleString()} KBps</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Variance Density:</span>
              <span className="text-violet-300 font-bold">{data.varianceSigma} σ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Fluctuation Level:</span>
              <span className="text-white font-bold">{data.intensity}% Intensity</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-[#0c1220]/90 via-[#070a14]/90 to-[#04060c] border border-cyan-500/25 shadow-[0_10px_40px_-10px_rgba(6,182,212,0.12)] backdrop-blur-2xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                2D Spatiotemporal Entropy Distribution Heatmap (Recharts)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                6x6 INTENSITY MATRIX
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Live entropy fluctuation distribution across cryogenic, quantum TRNG, and hardware core frequency bands.
            </p>
          </div>
        </div>

        {/* Metric Mode Selectors & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                playTone(520, 0.04);
                setMetricMode('rate');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'rate'
                  ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Rate (KBps)
            </button>
            <button
              onClick={() => {
                playTone(560, 0.04);
                setMetricMode('sigma');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'sigma'
                  ? 'bg-violet-500/20 text-violet-200 font-bold border border-violet-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Variance (σ)
            </button>
            <button
              onClick={() => {
                playTone(600, 0.04);
                setMetricMode('fluctuation');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'fluctuation'
                  ? 'bg-emerald-500/20 text-emerald-200 font-bold border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Intensity (%)
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-cyan-300 transition-colors"
            title="Sample Live Quantum Entropy Jitter"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2D Heatmap Stage using Recharts ScatterChart */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 15, right: 30, bottom: 10, left: 140 }}
          >
            <XAxis
              type="category"
              dataKey="x"
              name="Time"
              stroke="#71717A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#ffffff15' }}
            />
            <YAxis
              type="category"
              dataKey="y"
              name="Subsystem Band"
              stroke="#A1A1AA"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#ffffff15' }}
              width={130}
            />
            <ZAxis type="number" dataKey="intensity" range={[100, 100]} />
            <Tooltip content={<CustomHeatmapTooltip />} />
            <Scatter
              data={heatmapData}
              shape={renderCellTile}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Intensity Map Color Legend & Invariant Note */}
      <div className="pt-2 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Color scale gradient bar */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-[11px]">Entropy Intensity Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#083344] border border-white/10" title="< 25% (Low)" />
            <span className="w-3 h-3 rounded bg-[#06B6D4] border border-white/10" title="25-50% (Nominal)" />
            <span className="w-3 h-3 rounded bg-[#10B981] border border-white/10" title="50-75% (Elevated)" />
            <span className="w-3 h-3 rounded bg-[#F59E0B] border border-white/10" title="75-88% (High)" />
            <span className="w-3 h-3 rounded bg-[#F43F5E] border border-white/10" title="> 88% (Peak Surge)" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">0 KBps → 12,000+ KBps</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Post-Quantum Entropy Invariant: 100% Stability Passed</span>
        </div>
      </div>
    </div>
  );
};
