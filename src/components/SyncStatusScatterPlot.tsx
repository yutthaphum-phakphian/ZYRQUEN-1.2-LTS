import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Zap,
  Info,
  Layers,
  Crosshair,
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface SyncScatterPoint {
  id: string;
  timestamp: string;
  dateObj: Date;
  status: 'Success' | 'Pending' | 'Failed';
  midBadge?: string;
  bottomBadge?: string;
  tag: string;
  traceRef: string;
  detailSummary: string;
  retryCount?: number;
  isReconciled?: boolean;
}

export type DateRangePreset = 'ALL' | '1H' | '6H' | '24H' | '7D' | 'CUSTOM';

interface SyncStatusScatterPlotProps {
  entries: SyncScatterPoint[];
  dateRangePreset: DateRangePreset;
  onDateRangePresetChange: (preset: DateRangePreset) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  selectedStatusFilter?: 'ALL' | 'Success' | 'Pending' | 'Failed';
  onPointSelect?: (point: SyncScatterPoint) => void;
  onRetryFailedLogs?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const SyncStatusScatterPlot: React.FC<SyncStatusScatterPlotProps> = ({
  entries,
  dateRangePreset,
  onDateRangePresetChange,
  customStartDate = '',
  customEndDate = '',
  onCustomDateChange,
  selectedStatusFilter = 'ALL',
  onPointSelect,
  onRetryFailedLogs,
  isRetrying = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<SyncScatterPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [showClusterSummary, setShowClusterSummary] = useState(true);

  // Status mapping for Y-axis categorical positions
  const statusYMap = useMemo(
    () => ({
      Failed: 2,
      Pending: 1,
      Success: 0,
    }),
    []
  );

  // Status color helpers
  const getStatusColor = (status: 'Success' | 'Pending' | 'Failed') => {
    switch (status) {
      case 'Success':
        return '#34d399'; // Emerald
      case 'Pending':
        return '#fbbf24'; // Amber
      case 'Failed':
        return '#f43f5e'; // Rose
    }
  };

  const getStatusGlow = (status: 'Success' | 'Pending' | 'Failed') => {
    switch (status) {
      case 'Success':
        return 'rgba(52, 211, 153, 0.6)';
      case 'Pending':
        return 'rgba(251, 191, 36, 0.7)';
      case 'Failed':
        return 'rgba(244, 63, 94, 0.85)';
    }
  };

  // Status counts within current dataset
  const statusStats = useMemo(() => {
    let success = 0;
    let pending = 0;
    let failed = 0;
    entries.forEach((e) => {
      if (e.status === 'Success') success++;
      else if (e.status === 'Pending') pending++;
      else if (e.status === 'Failed') failed++;
    });
    return { success, pending, failed, total: entries.length };
  }, [entries]);

  // Render D3 Scatter Plot
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const bounds = containerRef.current.getBoundingClientRect();
    const width = Math.max(340, bounds.width || 420);
    const height = 175;

    const margin = { top: 22, right: 28, bottom: 30, left: 62 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define defs & radial glows
    const defs = svg.append('defs');

    // Glow filter for failed / pending anomalies
    const filter = defs.append('filter').attr('id', 'scatter-point-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Time domain calculation
    const now = Date.now();
    let minTime = now - 24 * 60 * 60 * 1000;
    let maxTime = now;

    if (entries.length > 0) {
      const times = entries.map((d) => d.dateObj.getTime()).filter((t) => !isNaN(t));
      if (times.length > 0) {
        minTime = Math.min(...times);
        maxTime = Math.max(...times);
        // Add 5% padding so outer points aren't clipped
        const span = Math.max(60000, maxTime - minTime);
        minTime = minTime - span * 0.08;
        maxTime = maxTime + span * 0.08;
      }
    }

    const xScale = d3.scaleTime().domain([new Date(minTime), new Date(maxTime)]).range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([-0.5, 2.5]).range([innerHeight, 0]);

    // Grid lines for status categories
    const categories: Array<{ label: string; value: number; color: string; desc: string }> = [
      { label: 'FAILED', value: 2, color: '#f43f5e', desc: 'Gate Blocked / Network Rejections' },
      { label: 'PENDING', value: 1, color: '#fbbf24', desc: 'Offline Buffer Staged' },
      { label: 'SUCCESS', value: 0, color: '#34d399', desc: 'Bitwise SSoT Ratified' },
    ];

    // Background horizontal tier lanes
    categories.forEach((cat) => {
      const y = yScale(cat.value);

      // Category swimlane zone
      g.append('rect')
        .attr('x', 0)
        .attr('y', y - 18)
        .attr('width', innerWidth)
        .attr('height', 36)
        .attr('fill', cat.color)
        .attr('fill-opacity', 0.035)
        .attr('rx', 4);

      // Guideline
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', cat.color)
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '3,4')
        .attr('stroke-opacity', 0.35);

      // Y-Axis label
      g.append('text')
        .attr('x', -10)
        .attr('y', y + 3.5)
        .attr('text-anchor', 'end')
        .attr('fill', cat.color)
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(cat.label);
    });

    // Time Axis (X)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.max(3, Math.floor(innerWidth / 90)))
      .tickSize(-innerHeight)
      .tickFormat((d) => {
        const date = d as Date;
        return d3.timeFormat('%H:%M:%S')(date);
      });

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155').attr('stroke-width', 0.8);
    xAxisGroup.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,3');
    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '7.5px')
      .attr('font-family', 'monospace')
      .attr('dy', '8px');

    // Scatter Points
    const pointsGroup = g.append('g').attr('class', 'scatter-points');

    entries.forEach((point, idx) => {
      const cx = xScale(point.dateObj);
      const targetYVal = statusYMap[point.status] ?? 0;
      // Add subtle deterministic jitter within tier lane so overlapping logs at same timestamp are distinguishable
      const jitter = ((idx % 5) - 2) * 3.5;
      const cy = yScale(targetYVal) + jitter;
      const color = getStatusColor(point.status);
      const isFailed = point.status === 'Failed';
      const isPending = point.status === 'Pending';

      const pointG = pointsGroup
        .append('g')
        .attr('class', 'scatter-node')
        .style('cursor', 'pointer');

      // Pulse ring for failed / pending items to spotlight clusters
      if (isFailed || isPending) {
        pointG
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', isFailed ? 8 : 6)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 0.9)
          .attr('stroke-opacity', 0.4)
          .attr('stroke-dasharray', isFailed ? '2,2' : 'none');
      }

      // Main scatter circle
      const circle = pointG
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', isFailed ? 5.5 : isPending ? 4.5 : 4)
        .attr('fill', color)
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#090d16')
        .attr('stroke-width', 1.5)
        .attr('filter', isFailed ? 'url(#scatter-point-glow)' : 'none');

      // Interaction listeners
      pointG
        .on('mouseenter', (event) => {
          circle
            .transition()
            .duration(120)
            .attr('r', 7)
            .attr('fill-opacity', 1)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

          const [mx, my] = d3.pointer(event, containerRef.current);
          setHoveredPoint(point);
          setTooltipPos({ x: mx, y: my });
          playTone(isFailed ? 320 : isPending ? 580 : 820, 0.02);
          try {
            triggerVibration('click');
          } catch {
            // ignore
          }
        })
        .on('mousemove', (event) => {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on('mouseleave', () => {
          circle
            .transition()
            .duration(150)
            .attr('r', isFailed ? 5.5 : isPending ? 4.5 : 4)
            .attr('fill-opacity', 0.85)
            .attr('stroke', '#090d16')
            .attr('stroke-width', 1.5);

          setHoveredPoint(null);
          setTooltipPos(null);
        })
        .on('click', (event) => {
          event.stopPropagation();
          playTone(720, 0.04);
          if (onPointSelect) {
            onPointSelect(point);
          }
        });
    });
  }, [entries, statusYMap]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl bg-zinc-950/95 border border-cyan-500/30 p-2.5 font-mono shadow-xl overflow-hidden ${className}`}
    >
      {/* Header & Date-Range Controls */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-white/10 text-[8.5px]">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-bold text-cyan-200">
            D3 SYNC STATUS SCATTER DISTRIBUTION
          </span>
          <span className="text-zinc-500 hidden sm:inline">| Over Time</span>
        </div>

        {/* Date Range Selector Preset Pills */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-zinc-500 text-[7.5px] flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5 text-zinc-400" />
            <span>Range:</span>
          </span>
          {(['ALL', '1H', '6H', '24H', '7D', 'CUSTOM'] as DateRangePreset[]).map((preset) => {
            const isActive = dateRangePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playTone(620, 0.02);
                  onDateRangePresetChange(preset);
                }}
                className={`px-1.5 py-0.5 rounded text-[7px] font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Input Interval Selector if CUSTOM active */}
      {dateRangePreset === 'CUSTOM' && onCustomDateChange && (
        <div className="mb-2 p-1.5 rounded-lg bg-black/60 border border-cyan-500/25 flex flex-wrap items-center gap-2 text-[7.5px]">
          <span className="text-cyan-300 font-bold">Forensic Interval:</span>
          <div className="flex items-center gap-1">
            <label htmlFor="sync-custom-start" className="text-zinc-400">Start:</label>
            <input
              id="sync-custom-start"
              type="datetime-local"
              value={customStartDate}
              onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
              className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-cyan-200 text-[7px] outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <label htmlFor="sync-custom-end" className="text-zinc-400">End:</label>
            <input
              id="sync-custom-end"
              type="datetime-local"
              value={customEndDate}
              onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
              className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-cyan-200 text-[7px] outline-none"
            />
          </div>
          <span className="text-zinc-500 text-[7px] ml-auto">Forensic timestamp query active</span>
        </div>
      )}

      {/* Status Breakdown & Anomaly Cluster Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 rounded-lg bg-black/70 border border-zinc-800/80 text-[7.5px] mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-400 font-semibold">Distribution:</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
            {statusStats.success} Success
          </span>
          <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)] animate-pulse" />
            {statusStats.pending} Pending
          </span>
          <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.9)]" />
            {statusStats.failed} Failed
          </span>
        </div>

        {/* Failed Cluster Auto-Retry Action */}
        {statusStats.failed > 0 && onRetryFailedLogs && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-rose-300 text-[7px] animate-pulse">
              Failed cluster identified ({statusStats.failed})
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTone(660, 0.04);
                onRetryFailedLogs();
              }}
              disabled={isRetrying}
              className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 hover:border-rose-400 text-rose-200 font-bold text-[7px] flex items-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Trigger exponential backoff auto-retry for failed logs"
            >
              <RefreshCw className={`w-2 h-2 text-rose-300 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying (Backoff)...' : 'Auto-Retry Failed'}</span>
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas for D3 Scatter Plot */}
      <div className="w-full relative">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Empty state overlay if zero logs match current date range */}
        {entries.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg text-center p-3">
            <Info className="w-4 h-4 text-zinc-500 mb-1" />
            <span className="text-[8.5px] text-zinc-300 font-bold">No Sync Logs In Selected Date Interval</span>
            <span className="text-[7.5px] text-zinc-500">
              Expand range selector to &apos;ALL&apos; or adjust interval to inspect previous forensic batches.
            </span>
          </div>
        )}

        {/* Interactive Hover Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-2.5 py-1.5 rounded-lg bg-zinc-950/95 border border-cyan-400/80 shadow-[0_0_16px_rgba(6,182,212,0.5)] text-[7.5px] space-y-0.5 max-w-[220px]"
            style={{
              left: Math.max(110, Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 300) - 110)),
              top: Math.max(20, tooltipPos.y - 12),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
              <span className="font-bold text-white flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getStatusColor(hoveredPoint.status) }}
                />
                {hoveredPoint.status.toUpperCase()}
              </span>
              <span className="text-cyan-300 font-mono text-[7px]">{hoveredPoint.tag}</span>
            </div>
            <div className="text-zinc-300 truncate">
              <span className="text-zinc-500">Time: </span>
              {hoveredPoint.dateObj.toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC
            </div>
            <div className="text-zinc-400 truncate">
              <span className="text-zinc-500">Trace: </span>
              <span className="text-cyan-200 font-bold">{hoveredPoint.traceRef}</span>
            </div>
            {hoveredPoint.retryCount !== undefined && hoveredPoint.retryCount > 0 && (
              <div className="text-rose-300 font-semibold">
                Retry Attempts: {hoveredPoint.retryCount} (Exponential Backoff)
              </div>
            )}
            <p className="text-zinc-300 text-[7px] leading-tight line-clamp-2 pt-0.5 border-t border-white/5">
              {hoveredPoint.detailSummary}
            </p>
          </div>
        )}
      </div>

      {/* Footer Cluster Legend & Forensic Guide */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[7px] text-zinc-500 pt-1.5 mt-1 border-t border-white/5">
        <span className="flex items-center gap-1">
          <Crosshair className="w-2.5 h-2.5 text-cyan-400" />
          <span>Click any scatter point to inspect forensic seal metadata</span>
        </span>
        <span className="text-zinc-400 ml-auto">
          Canonical Merkle Leaf Parity: <span className="text-emerald-400 font-bold">Δ0.00%</span>
        </span>
      </div>
    </div>
  );
};
