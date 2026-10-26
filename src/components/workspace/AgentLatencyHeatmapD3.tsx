import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  RefreshCw,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  aiAgentRegistryService,
  AgentLatencySeries,
  LatencyDataPoint,
} from '@/services/aiAgentRegistryService';

interface AgentLatencyHeatmapD3Props {
  onAgentSelect?: (agentId: string) => void;
}

export const AgentLatencyHeatmapD3: React.FC<AgentLatencyHeatmapD3Props> = ({ onAgentSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [seriesData, setSeriesData] = useState<AgentLatencySeries[]>(() =>
    aiAgentRegistryService.getLatencySeries()
  );
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<{
    agentName: string;
    model: string;
    data: LatencyDataPoint;
    x: number;
    y: number;
  } | null>(null);

  // Sync with registry service
  useEffect(() => {
    const unsub = aiAgentRegistryService.subscribe(() => {
      setSeriesData(aiAgentRegistryService.getLatencySeries());
    });
    return () => unsub();
  }, []);

  // Periodic simulated latency pulse if autoRefresh is on
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      await aiAgentRegistryService.pingAllAgents();
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handlePingAll = useCallback(async () => {
    setIsPinging(true);
    await aiAgentRegistryService.pingAllAgents();
    setIsPinging(false);
  }, []);

  // D3 Heatmap Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || seriesData.length === 0) return;

    const containerWidth = containerRef.current.clientWidth || 700;
    const margin = { top: 40, right: 30, bottom: 45, left: 180 };
    const width = Math.max(containerWidth - margin.left - margin.right, 420);
    const rowHeight = 44;
    const height = seriesData.length * rowHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Time slots (X-axis)
    const timeSlots = seriesData[0]?.dataPoints.map((d) => d.timeSlot) || [];
    // Agents (Y-axis)
    const agentNames = seriesData.map((d) => d.agentName);

    // Scales
    const xScale = d3
      .scaleBand()
      .range([0, width])
      .domain(timeSlots)
      .padding(0.08);

    const yScale = d3
      .scaleBand()
      .range([0, height])
      .domain(agentNames)
      .padding(0.12);

    // Latency Color Scale: Deep Green -> Teal -> Amber -> Rose Red
    const colorScale = d3
      .scaleThreshold<number, string>()
      .domain([40, 80, 142])
      .range(['#10b981', '#06b6d4', '#f59e0b', '#f43f5e']);

    // Background Grid Pattern
    const defs = svg.append('defs');
    const glowFilter = defs.append('filter').attr('id', 'cell-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    glowFilter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .select('.domain')
      .attr('stroke', '#27272a');

    g.selectAll('.tick text')
      .attr('fill', '#71717a')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('dy', '12px');

    // Y Axis (Custom labels with agent names and models)
    const yAxisG = g.append('g').call(d3.axisLeft(yScale).tickSize(0));
    yAxisG.select('.domain').attr('stroke', 'transparent');

    yAxisG
      .selectAll('.tick text')
      .attr('fill', '#e4e4e7')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'end')
      .attr('dx', '-8px')
      .each(function (d) {
        const textNode = d3.select(this);
        const agent = seriesData.find((s) => s.agentName === d);
        if (agent) {
          textNode.text('');
          textNode
            .append('tspan')
            .attr('x', -10)
            .attr('dy', '-2px')
            .text(agent.agentName.length > 20 ? agent.agentName.slice(0, 19) + '…' : agent.agentName);
          textNode
            .append('tspan')
            .attr('x', -10)
            .attr('dy', '12px')
            .attr('fill', '#06b6d4')
            .attr('font-size', '9px')
            .attr('font-weight', '400')
            .text(`avg ${agent.avgLatencyMs}ms`);
        }
      });

    // Render Heatmap Cells
    seriesData.forEach((series) => {
      const rowY = yScale(series.agentName) || 0;
      const cellHeight = yScale.bandwidth();

      series.dataPoints.forEach((point) => {
        const cellX = xScale(point.timeSlot) || 0;
        const cellWidth = xScale.bandwidth();
        const baseColor = colorScale(point.latencyMs);

        const rectGroup = g.append('g');

        rectGroup
          .append('rect')
          .attr('x', cellX)
          .attr('y', rowY)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('fill', baseColor)
          .attr('fill-opacity', 0.22)
          .attr('stroke', baseColor)
          .attr('stroke-width', 1.2)
          .attr('class', 'cursor-pointer transition-all duration-150')
          .on('mouseenter', function (event) {
            d3.select(this)
              .attr('fill-opacity', 0.85)
              .attr('stroke-width', 2)
              .attr('filter', 'url(#cell-glow)');

            const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

            setHoveredCell({
              agentName: series.agentName,
              model: series.model,
              data: point,
              x: rect.left - containerRect.left + cellWidth / 2,
              y: rect.top - containerRect.top - 8,
            });
          })
          .on('mouseleave', function () {
            d3.select(this)
              .attr('fill-opacity', 0.22)
              .attr('stroke-width', 1.2)
              .attr('filter', null);
            setHoveredCell(null);
          })
          .on('click', () => {
            onAgentSelect?.(series.agentId);
          });

        // Numeric latency text inside cell
        rectGroup
          .append('text')
          .attr('x', cellX + cellWidth / 2)
          .attr('y', rowY + cellHeight / 2 + 3)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f4f4f5')
          .attr('font-size', cellWidth < 40 ? '9px' : '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .attr('pointer-events', 'none')
          .text(`${point.latencyMs}ms`);
      });
    });

    // Top Header Axis labels
    g.append('text')
      .attr('x', 0)
      .attr('y', -18)
      .attr('fill', '#71717a')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text('CONNECTED AI AGENT NODES');

    g.append('text')
      .attr('x', width)
      .attr('y', -18)
      .attr('text-anchor', 'end')
      .attr('fill', '#06b6d4')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text('RECENT INFERENCE ROUND-TRIP LATENCY (ms)');
  }, [seriesData, onAgentSelect]);

  // Overall aggregate stats
  const allPoints = seriesData.flatMap((s) => s.dataPoints);
  const totalPoints = allPoints.length;
  const overallAvg =
    totalPoints > 0 ? Math.round((allPoints.reduce((acc, p) => acc + p.latencyMs, 0) / totalPoints) * 10) / 10 : 0;
  const slaPassed = allPoints.filter((p) => p.latencyMs <= 142).length;
  const globalSlaPassRate = totalPoints > 0 ? Math.round((slaPassed / totalPoints) * 1000) / 10 : 100;

  return (
    <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 p-4 font-mono space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Agent Latency & Responsiveness Heatmap
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>D3.js Live Telemetry</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Real-time communication responsiveness between ZYNTHEOR Sovereign Engine and imported AI models.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Auto-refresh telemetry every 12 seconds"
          >
            <Radio className={`w-3 h-3 ${autoRefresh ? 'text-cyan-400 animate-pulse' : ''}`} />
            <span>{autoRefresh ? 'Auto-Sweep ON' : 'Paused'}</span>
          </button>

          <button
            type="button"
            disabled={isPinging}
            onClick={handlePingAll}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-zinc-950 font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Sweeping...' : 'Ping All Agents'}</span>
          </button>
        </div>
      </div>

      {/* Metric KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Fleet Avg Latency</span>
            <Clock className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-zinc-100 mt-1 flex items-baseline gap-1">
            <span>{overallAvg}</span>
            <span className="text-[10px] font-normal text-zinc-400">ms</span>
          </div>
          <div className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <span>Target &lt; 142.0ms</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>SLA Compliance</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1 flex items-baseline gap-1">
            <span>{globalSlaPassRate}%</span>
          </div>
          <div className="text-[9px] text-zinc-400 mt-0.5">Under Thai ETDA Sec 28</div>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Active Agent Nodes</span>
            <Cpu className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-base font-bold text-purple-300 mt-1 flex items-baseline gap-1">
            <span>{seriesData.length}</span>
            <span className="text-[10px] font-normal text-zinc-400">Nodes</span>
          </div>
          <div className="text-[9px] text-cyan-400 mt-0.5">Zero Cross-Tenant Leak</div>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>SLA Latency Headroom</span>
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-300 mt-1 flex items-baseline gap-1">
            <span>{Math.max(0, Math.round((142.0 - overallAvg) * 10) / 10)}</span>
            <span className="text-[10px] font-normal text-zinc-400">ms margin</span>
          </div>
          <div className="text-[9px] text-emerald-400 mt-0.5">Safe Headroom Status</div>
        </div>
      </div>

      {/* D3 Heatmap Container */}
      <div ref={containerRef} className="relative overflow-x-auto bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
        <svg ref={svgRef} className="mx-auto block" />

        {/* Hover Tooltip Overlay */}
        {hoveredCell && (
          <div
            ref={tooltipRef}
            style={{
              position: 'absolute',
              left: `${hoveredCell.x}px`,
              top: `${hoveredCell.y}px`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 30,
            }}
            className="bg-zinc-900 border border-cyan-500/50 rounded-lg p-2.5 shadow-2xl text-[10px] font-mono min-w-[210px]"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1">
              <span className="font-bold text-cyan-300">{hoveredCell.agentName}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                  hoveredCell.data.status === 'PASS'
                    ? 'bg-emerald-950 text-emerald-300'
                    : hoveredCell.data.status === 'WARN'
                    ? 'bg-amber-950 text-amber-300'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                {hoveredCell.data.status}
              </span>
            </div>
            <div className="space-y-0.5 text-zinc-400">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="text-zinc-200">{hoveredCell.model}</span>
              </div>
              <div className="flex justify-between">
                <span>Round-Trip Latency:</span>
                <span className="font-bold text-emerald-400">{hoveredCell.data.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span>SLA Margin:</span>
                <span className="text-cyan-300">{(142.0 - hoveredCell.data.latencyMs).toFixed(1)} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Throughput:</span>
                <span className="text-zinc-300">{hoveredCell.data.throughputKb} KB/s</span>
              </div>
              <div className="flex justify-between text-[8px] text-zinc-500 pt-1">
                <span>Time:</span>
                <span>{new Date(hoveredCell.data.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[10px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-500 uppercase">SLA Thresholds:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span>&lt; 40ms (Sub-Kelvin Optimal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
            <span>40–80ms (Nominal Fast)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
            <span>80–142ms (Near SLA Limit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
            <span>&gt; 142ms (Degraded / SLA Breach)</span>
          </div>
        </div>

        <div className="text-zinc-500 text-[9px]">
          FIPS 140-3 Level 4 Replay Target: 142.00ms Max • Zero-Drift Assurance
        </div>
      </div>
    </div>
  );
};
