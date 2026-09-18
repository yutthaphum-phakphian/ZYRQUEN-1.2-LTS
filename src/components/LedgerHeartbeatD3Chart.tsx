import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { HardwareSnapshot } from '../types';
import { triggerVibration } from '../utils/vibration';
import { Activity, Zap, Cpu, Waves, Sparkles, Maximize2 } from 'lucide-react';

interface LedgerHeartbeatD3ChartProps {
  snapshots: HardwareSnapshot[];
  title?: string;
}

type MetricType = 'pulse' | 'cpu' | 'cryo' | 'coherence';

export const LedgerHeartbeatD3Chart: React.FC<LedgerHeartbeatD3ChartProps> = ({
  snapshots,
  title = 'Real-Time Heartbeat & Telemetry Pulse Stream (D3.js)',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeMetric, setActiveMetric] = useState<MetricType>('pulse');
  const [hoveredData, setHoveredData] = useState<{
    snapshot: HardwareSnapshot;
    val: number;
    x: number;
    y: number;
  } | null>(null);

  // Prepare chart data points
  const chartData = useMemo(() => {
    const raw = snapshots.slice(-30); // Last 30 snapshots for high temporal resolution
    return raw.map((s, idx) => {
      let val = 0;
      if (activeMetric === 'cpu') {
        val = s.cpuAverage ?? 45;
      } else if (activeMetric === 'cryo') {
        val = s.cryoTempMk ?? 14.98;
      } else if (activeMetric === 'coherence') {
        val = s.coherencePct ?? 99.98;
      } else {
        // 'pulse' - simulated ms latency & heartbeat frequency
        val = s.bftNodeLatencyMs ?? Math.round(50 + (s.cpuAverage ?? 45) * 1.8 + Math.sin(idx) * 8);
      }

      return {
        index: idx,
        snapshot: s,
        time: s.timestampIct || s.timestampUtc || `T-${idx}`,
        value: val,
      };
    });
  }, [snapshots, activeMetric]);

  // Metric metadata
  const metricConfig = useMemo(() => {
    switch (activeMetric) {
      case 'cpu':
        return {
          label: 'CPU Telemetry Load',
          unit: '%',
          color: '#06b6d4', // Cyan
          colorStop: 'rgba(6, 182, 212, 0.45)',
          minDomain: 0,
          maxDomain: 100,
        };
      case 'cryo':
        return {
          label: 'Cryostat Core Temp',
          unit: 'mK',
          color: '#38bdf8', // Light blue
          colorStop: 'rgba(56, 189, 248, 0.45)',
          minDomain: 10,
          maxDomain: 25,
        };
      case 'coherence':
        return {
          label: 'Quantum Coherence',
          unit: '%',
          color: '#10b981', // Emerald
          colorStop: 'rgba(16, 185, 129, 0.45)',
          minDomain: 98,
          maxDomain: 100,
        };
      case 'pulse':
      default:
        return {
          label: 'Heartbeat Frequency Pulse',
          unit: 'ms',
          color: '#f59e0b', // Amber / Gold
          colorStop: 'rgba(245, 158, 11, 0.45)',
          minDomain: 30,
          maxDomain: 180,
        };
    }
  }, [activeMetric]);

  // Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { current: 0, min: 0, max: 0, avg: 0 };
    const vals = chartData.map((d) => d.value);
    const current = vals[vals.length - 1];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return {
      current: +current.toFixed(2),
      min: +min.toFixed(2),
      max: +max.toFixed(2),
      avg: +avg.toFixed(2),
    };
  }, [chartData]);

  // Render D3 line and area chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || chartData.length === 0) return;

    const width = containerRef.current.clientWidth || 600;
    const height = 180;
    const margin = { top: 18, right: 24, bottom: 26, left: 38 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient definitions
    const defs = svg.append('defs');
    const gradientId = `d3-heartbeat-grad-${activeMetric}`;
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', metricConfig.color)
      .attr('stop-opacity', 0.45);

    linearGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', metricConfig.color)
      .attr('stop-opacity', 0.0);

    // Glow filter
    const filter = defs.append('filter').attr('id', 'd3-line-glow');
    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, chartData.length - 1])
      .range([0, innerWidth]);

    const yMin = Math.min(metricConfig.minDomain, stats.min * 0.95);
    const yMax = Math.max(metricConfig.maxDomain, stats.max * 1.05);

    const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0]);

    // Grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(4);

    g.append('g')
      .attr('class', 'grid-lines')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '3 3');

    g.select('.grid-lines').select('.domain').remove();

    // Area Generator
    const areaGenerator = d3
      .area<(typeof chartData)[0]>()
      .x((d) => xScale(d.index))
      .y0(innerHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', areaGenerator);

    // Line Generator
    const lineGenerator = d3
      .line<(typeof chartData)[0]>()
      .x((d) => xScale(d.index))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Render path with glow
    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', metricConfig.color)
      .attr('stroke-width', 2.2)
      .attr('filter', 'url(#d3-line-glow)')
      .attr('d', lineGenerator);

    // Data points circles
    g.selectAll('.dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.index))
      .attr('cy', (d) => yScale(d.value))
      .attr('r', (d, i) => (i === chartData.length - 1 ? 4.5 : 2))
      .attr('fill', (d, i) => (i === chartData.length - 1 ? '#ffffff' : metricConfig.color))
      .attr('stroke', metricConfig.color)
      .attr('stroke-width', 1.5)
      .attr('class', (d, i) => (i === chartData.length - 1 ? 'animate-pulse' : ''));

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(6, chartData.length))
      .tickFormat((idx) => {
        const item = chartData[Math.round(idx as number)];
        if (!item) return '';
        const t = item.time.split(' ')[1] || item.time;
        return t;
      });

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    g.select('.domain').attr('stroke', '#334155');
    g.selectAll('.tick line').attr('stroke', '#334155');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((v) => `${v}${metricConfig.unit}`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    // Overlay for crosshair tracking
    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    const focusLine = g
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2')
      .attr('opacity', 0);

    const focusCircle = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#ffffff')
      .attr('stroke', metricConfig.color)
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    overlay
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event, this);
        const index = Math.round(xScale.invert(mx));
        if (index >= 0 && index < chartData.length) {
          const d = chartData[index];
          const cx = xScale(d.index);
          const cy = yScale(d.value);

          focusLine
            .attr('x1', cx)
            .attr('x2', cx)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('opacity', 0.8);

          focusCircle.attr('cx', cx).attr('cy', cy).attr('opacity', 1);

          setHoveredData({
            snapshot: d.snapshot,
            val: d.value,
            x: cx + margin.left,
            y: cy + margin.top,
          });
        }
      })
      .on('mouseleave', () => {
        focusLine.attr('opacity', 0);
        focusCircle.attr('opacity', 0);
        setHoveredData(null);
      });
  }, [chartData, metricConfig, stats, activeMetric]);

  return (
    <div
      ref={containerRef}
      className="p-4 rounded-2xl bg-[#070b16]/90 border border-cyan-500/20 backdrop-blur-xl space-y-3 font-mono"
    >
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{title}</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                D3 ENGINE
              </span>
            </h4>
            <p className="text-[10px] text-zinc-400">
              Live hardware telemetry stream • {snapshots.length} historical checkpoints anchored
            </p>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
          {(
            [
              { id: 'pulse', label: 'Pulse (ms)', icon: Waves },
              { id: 'cpu', label: 'CPU (%)', icon: Cpu },
              { id: 'cryo', label: 'Cryo (mK)', icon: Sparkles },
              { id: 'coherence', label: 'Coherence', icon: Zap },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            const isActive = activeMetric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  triggerVibration('click');
                  setActiveMetric(m.id);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
          <span className="text-zinc-500 text-[10px]">CURRENT:</span>
          <strong className="text-cyan-300 font-bold text-xs">
            {stats.current}
            {metricConfig.unit}
          </strong>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
          <span className="text-zinc-500 text-[10px]">PEAK:</span>
          <strong className="text-emerald-400 font-bold text-xs">
            {stats.max}
            {metricConfig.unit}
          </strong>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
          <span className="text-zinc-500 text-[10px]">MIN:</span>
          <strong className="text-indigo-300 font-bold text-xs">
            {stats.min}
            {metricConfig.unit}
          </strong>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
          <span className="text-zinc-500 text-[10px]">AVERAGE:</span>
          <strong className="text-amber-300 font-bold text-xs">
            {stats.avg}
            {metricConfig.unit}
          </strong>
        </div>
      </div>

      {/* SVG Container with relative positioning for hover tooltip */}
      <div className="relative w-full overflow-hidden">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {hoveredData && (
          <div
            className="absolute pointer-events-none z-20 px-2.5 py-1.5 rounded-xl bg-[#090d1a] border border-cyan-500/50 shadow-2xl text-[10px] space-y-0.5 transform -translate-x-1/2 -translate-y-full"
            style={{ left: hoveredData.x, top: hoveredData.y - 8 }}
          >
            <div className="text-cyan-300 font-bold flex items-center gap-2 justify-between">
              <span>{hoveredData.snapshot.id}</span>
              <span className="text-zinc-400 font-normal">{hoveredData.snapshot.timestampIct}</span>
            </div>
            <div className="text-white">
              {metricConfig.label}:{' '}
              <strong className="text-emerald-400">
                {hoveredData.val}
                {metricConfig.unit}
              </strong>
            </div>
            <div className="text-zinc-400 text-[9px]">
              CPU: {hoveredData.snapshot.cpuAverage}% • RAM: {hoveredData.snapshot.memoryUsedMb} MB • Cryo:{' '}
              {hoveredData.snapshot.cryoTempMk} mK
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
