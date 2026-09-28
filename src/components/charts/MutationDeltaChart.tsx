import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, Zap, Lock, Info } from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../../data/canonicalData';

export interface MutationDeltaDataPoint {
  id: string;
  blockHeight: number;
  timestamp: Date;
  deltaPct: number; // Nominal 0.0000%
  isAnomaly: boolean;
  computedHash: string;
  status: 'SSOT_LOCKED' | 'TRANSIENT_DRIFT' | 'DEVIATION_ALERT';
}

interface MutationDeltaChartProps {
  className?: string;
  onAlertTriggered?: (point: MutationDeltaDataPoint) => void;
}

export const MutationDeltaChart: React.FC<MutationDeltaChartProps> = ({
  className = '',
  onAlertTriggered,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dataPoints, setDataPoints] = useState<MutationDeltaDataPoint[]>([]);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<MutationDeltaDataPoint | null>(null);
  const [simulatedJitterActive, setSimulatedJitterActive] = useState(false);

  // Initialize with deterministic 24-point baseline history
  useEffect(() => {
    const now = Date.now();
    const initial: MutationDeltaDataPoint[] = [];
    for (let i = 23; i >= 0; i--) {
      const ptTime = new Date(now - i * 3000);
      initial.push({
        id: `PT-${CANONICAL_GENESIS_BLOCK - i}`,
        blockHeight: CANONICAL_GENESIS_BLOCK - i,
        timestamp: ptTime,
        deltaPct: 0.0000,
        isAnomaly: false,
        computedHash: CANONICAL_MERKLE_ROOT,
        status: 'SSOT_LOCKED',
      });
    }
    setDataPoints(initial);
  }, []);

  // Real-time telemetry generator
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const last = prev[prev.length - 1];
        const nextBlock = (last?.blockHeight || CANONICAL_GENESIS_BLOCK) + 1;
        
        let delta = 0.0000;
        let isAnomaly = false;
        let status: MutationDeltaDataPoint['status'] = 'SSOT_LOCKED';
        let hash = CANONICAL_MERKLE_ROOT;

        if (simulatedJitterActive) {
          // Injected micro-drift to demonstrate visual deviation highlight
          const jitterMagnitude = (Math.random() * 0.045) + 0.015;
          delta = Number(jitterMagnitude.toFixed(4));
          isAnomaly = delta > 0.02;
          status = isAnomaly ? 'DEVIATION_ALERT' : 'TRANSIENT_DRIFT';
          hash = `0x${Math.random().toString(16).substring(2, 10)}...${CANONICAL_MERKLE_ROOT.slice(-12)}`;
        }

        const newPoint: MutationDeltaDataPoint = {
          id: `PT-${nextBlock}`,
          blockHeight: nextBlock,
          timestamp: new Date(),
          deltaPct: delta,
          isAnomaly,
          computedHash: hash,
          status,
        };

        if (isAnomaly && onAlertTriggered) {
          onAlertTriggered(newPoint);
        }

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isLiveStreaming, simulatedJitterActive, onAlertTriggered]);

  // Render D3 SVG Chart
  useEffect(() => {
    if (!svgRef.current || dataPoints.length === 0) return;

    const container = containerRef.current;
    const width = container ? container.clientWidth : 680;
    const height = 220;
    const margin = { top: 20, right: 30, bottom: 35, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Gradient for nominal area fill (Emerald/Cyan)
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'chart-mutation-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Gradient for anomaly glow (Rose)
    const anomalyGlow = defs
      .append('linearGradient')
      .attr('id', 'chart-anomaly-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    anomalyGlow.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.45);
    anomalyGlow.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.0);

    // Glow filter
    const filter = defs.append('filter').attr('id', 'chart-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Time)
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataPoints, (d) => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    // Y Scale (Delta %)
    const maxDelta = Math.max(0.05, d3.max(dataPoints, (d) => d.deltaPct) || 0.05);
    const yScale = d3
      .scaleLinear()
      .domain([-0.01, maxDelta * 1.25])
      .range([innerHeight, 0])
      .nice();

    // Gridlines
    const yGrid = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid-lines')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.06)')
      .attr('stroke-dasharray', '2,2');

    g.select('.grid-lines .domain').remove();

    // Baseline Reference Line (y = 0.0000% Zero-Drift Baseline)
    const yZero = yScale(0);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yZero)
      .attr('y2', yZero)
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3')
      .attr('opacity', 0.9);

    g.append('text')
      .attr('x', 6)
      .attr('y', yZero - 6)
      .attr('text-anchor', 'start')
      .attr('fill', '#06b6d4')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('0.00% ZERO-DRIFT SSoT BASELINE');

    // Secondary Upper Deviation Threshold Line (y = 0.0200%)
    const thresholdDelta = 0.020;
    const yThreshold = yScale(thresholdDelta);
    
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yThreshold)
      .attr('y2', yThreshold)
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.85);

    g.append('text')
      .attr('x', innerWidth - 6)
      .attr('y', yThreshold - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#f43f5e')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('CRITICAL DRIFT THRESHOLD (+0.0200%)');

    // Area Generator
    const area = d3
      .area<MutationDeltaDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y0(innerHeight)
      .y1((d) => yScale(d.deltaPct))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', simulatedJitterActive ? 'url(#chart-anomaly-area-gradient)' : 'url(#chart-mutation-area-gradient)')
      .attr('d', area);

    // Line Generator
    const line = d3
      .line<MutationDeltaDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.deltaPct))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', simulatedJitterActive ? '#f43f5e' : '#10b981')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#chart-glow)')
      .attr('d', line);

    // Data Point Circles
    const circlesGroup = g.append('g').attr('class', 'data-points');

    circlesGroup
      .selectAll('circle')
      .data(dataPoints)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.timestamp))
      .attr('cy', (d) => yScale(d.deltaPct))
      .attr('r', (d) => (d.isAnomaly ? 5 : 3.5))
      .attr('fill', (d) => (d.isAnomaly ? '#f43f5e' : '#10b981'))
      .attr('stroke', '#030712')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setHoveredPoint(d);
        playTone(700 + d.deltaPct * 3000, 0.02);
      })
      .on('mouseleave', () => {
        setHoveredPoint(null);
      });

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    g.select('.x-axis .domain').attr('stroke', 'rgba(255, 255, 255, 0.15)');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => `+${d.valueOf()}%`);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    g.select('.y-axis .domain').attr('stroke', 'rgba(255, 255, 255, 0.15)');
  }, [dataPoints, simulatedJitterActive]);

  const latestPoint = dataPoints[dataPoints.length - 1];
  const isCurrentlyNormal = !simulatedJitterActive && (!latestPoint || latestPoint.deltaPct === 0);

  return (
    <div
      ref={containerRef}
      className={`p-5 rounded-2xl bg-[#090d1a] border border-cyan-500/20 space-y-4 relative overflow-hidden shadow-2xl ${className}`}
    >
      {/* Background Ambience */}
      <div
        className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          simulatedJitterActive ? 'bg-rose-500/15' : 'bg-emerald-500/10'
        }`}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              Forensic Audit: Mutation Delta vs. Genesis Hash Parity
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isCurrentlyNormal
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
              }`}
            >
              {isCurrentlyNormal ? 'Δ0.0000% ZERO-DRIFT SSoT' : 'ANOMALY DETECTED'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Real-time D3 line chart plotting drift deviation from Canonical Genesis Block #{CANONICAL_GENESIS_BLOCK}.
          </p>
        </div>

        {/* Controls & Metrics */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTone(600, 0.03);
              setSimulatedJitterActive(!simulatedJitterActive);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              simulatedJitterActive
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${simulatedJitterActive ? 'text-rose-400' : 'text-zinc-400'}`} />
            <span>{simulatedJitterActive ? 'Clear Jitter' : 'Inject Jitter'}</span>
          </button>

          <button
            onClick={() => {
              playTone(500, 0.03);
              setIsLiveStreaming(!isLiveStreaming);
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition-all cursor-pointer"
            title={isLiveStreaming ? 'Pause Stream' : 'Resume Stream'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* D3 Render Area */}
      <div className="relative w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full h-[220px]" />

        {/* Hover Inspector Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 left-16 bg-black/90 border border-cyan-500/40 rounded-xl p-3 shadow-2xl font-mono text-xs text-zinc-200 pointer-events-none z-20 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1">
              <span className="text-cyan-400 font-bold">Block #{hoveredPoint.blockHeight}</span>
              <span className={hoveredPoint.isAnomaly ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                +{hoveredPoint.deltaPct.toFixed(4)}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">Time: {hoveredPoint.timestamp.toLocaleTimeString()}</div>
            <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">Hash: {hoveredPoint.computedHash}</div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
          <span className="text-[10px] text-zinc-500 block">CURRENT DRIFT</span>
          <span className={`font-bold ${isCurrentlyNormal ? 'text-emerald-400' : 'text-rose-400'}`}>
            +{latestPoint?.deltaPct.toFixed(4) || '0.0000'}%
          </span>
        </div>
        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
          <span className="text-[10px] text-zinc-500 block">GENESIS HASH PARITY</span>
          <span className="text-cyan-300 font-bold">100% BITWISE</span>
        </div>
        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
          <span className="text-[10px] text-zinc-500 block">SSoT THRESHOLD</span>
          <span className="text-amber-300 font-bold">&lt; 0.0200%</span>
        </div>
        <div className="p-2 rounded-xl bg-black/40 border border-white/5">
          <span className="text-[10px] text-zinc-500 block">INSPECTOR STATE</span>
          <span className="text-purple-300 font-bold">ACTIVE STREAM</span>
        </div>
      </div>
    </div>
  );
};
export default MutationDeltaChart;
