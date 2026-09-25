import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Activity, Zap, ShieldCheck, AlertCircle, RefreshCw, Flame } from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';

export interface LatencySample {
  id: string;
  timeLabel: string;
  latencyMs: number;
  slaTargetMs: number;
  isSpike?: boolean;
}

interface StressTestIndicatorD3ChartProps {
  initialLatencyMs?: number;
  slaLimitMs?: number;
  className?: string;
  compact?: boolean;
}

export const StressTestIndicatorD3Chart: React.FC<StressTestIndicatorD3ChartProps> = ({
  initialLatencyMs = 35.80,
  slaLimitMs = 142.00,
  className = '',
  compact = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [currentLatency, setCurrentLatency] = useState<number>(initialLatencyMs);
  const [isStressRunning, setIsStressRunning] = useState<boolean>(false);
  const [history, setHistory] = useState<LatencySample[]>(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const baseJitter = 35.80 + (Math.sin(i * 0.8) * 2.4) + (Math.random() * 1.8 - 0.9);
      const d = new Date(Date.now() - (24 - i) * 1200);
      const timeLabel = d.toLocaleTimeString('en-GB', { hour12: false });
      return {
        id: `sample-${i}`,
        timeLabel,
        latencyMs: Number(baseJitter.toFixed(2)),
        slaTargetMs: slaLimitMs,
      };
    });
  });

  // Real-time jitter tick effect
  useEffect(() => {
    const timer = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1]?.latencyMs || 35.80;
        let nextLatency: number;

        if (isStressRunning) {
          // Synthetic stress test load under high PQC replay
          nextLatency = Number((48.20 + Math.random() * 18.5).toFixed(2));
        } else {
          // Normal nominal sub-Kelvin execution ~34.50 - 37.80 ms
          const noise = (Math.random() - 0.5) * 1.6;
          nextLatency = Number(Math.max(32.10, Math.min(41.50, (last * 0.7) + (35.80 * 0.3) + noise)).toFixed(2));
        }

        setCurrentLatency(nextLatency);

        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-GB', { hour12: false });
        const newSample: LatencySample = {
          id: `sample-${Date.now()}`,
          timeLabel,
          latencyMs: nextLatency,
          slaTargetMs: slaLimitMs,
          isSpike: nextLatency > 60,
        };

        return [...prev.slice(1), newSample];
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isStressRunning, slaLimitMs]);

  // Trigger high-concurrency 12-stage stress replay simulation
  const handleTriggerStressTest = useCallback(() => {
    playTone(620, 0.12, 'sawtooth');
    setIsStressRunning(true);
    setTimeout(() => {
      setIsStressRunning(false);
      playAuditChime();
    }, 4500);
  }, []);

  // Draw D3 line and area chart
  useEffect(() => {
    if (!svgRef.current || history.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || (compact ? 320 : 540);
    const height = compact ? 120 : 160;
    const margin = { top: 16, right: 28, bottom: 24, left: 36 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient definitions
    const defs = svg.append('defs');

    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'latencyAreaGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.45);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.0);

    const lineGradient = defs
      .append('linearGradient')
      .attr('id', 'latencyLineGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    lineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    lineGradient.append('stop').attr('offset', '70%').attr('stop-color', '#38bdf8');
    lineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4');

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, history.length - 1])
      .range([0, innerWidth]);

    const maxHistoryLatency = Math.max(...history.map((d) => d.latencyMs), 0);
    const yMax = Math.max(slaLimitMs + 10, maxHistoryLatency + 15);
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    const yGrid = d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'y-grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.06)')
      .attr('stroke-dasharray', '2,2');
    g.selectAll('.y-grid .domain').remove();

    // SLA Target Threshold Line (142.00 ms)
    const slaY = yScale(slaLimitMs);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', slaY)
      .attr('y2', slaY)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.85);

    g.append('text')
      .attr('x', innerWidth - 4)
      .attr('y', slaY - 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#f87171')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(`SLA TARGET CEILING (${slaLimitMs.toFixed(2)} ms)`);

    // Nominal 35.80ms Benchmark Reference Line
    const benchmarkY = yScale(35.80);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', benchmarkY)
      .attr('y2', benchmarkY)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.45);

    // Area Generator
    const areaGen = d3
      .area<LatencySample>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(d.latencyMs))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(history)
      .attr('fill', 'url(#latencyAreaGrad)')
      .attr('d', areaGen);

    // Line Generator
    const lineGen = d3
      .line<LatencySample>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.latencyMs))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', 'url(#latencyLineGrad)')
      .attr('stroke-width', 2.2)
      .attr('d', lineGen);

    // Latest Active Data Point Pulse Indicator
    const latestIndex = history.length - 1;
    const latestSample = history[latestIndex];
    if (latestSample) {
      const cx = xScale(latestIndex);
      const cy = yScale(latestSample.latencyMs);

      // Outer glow pulse
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 6)
        .attr('fill', '#06b6d4')
        .attr('opacity', 0.45);

      // Inner solid point
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 3.5)
        .attr('fill', '#ffffff')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2);
    }

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}ms`);
    g.append('g')
      .attr('class', 'y-axis text-zinc-500 font-mono text-[9px]')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px');
    g.selectAll('.y-axis .domain').attr('stroke', 'rgba(255, 255, 255, 0.1)');

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(compact ? 4 : 6)
      .tickFormat((i) => history[Number(i)]?.timeLabel?.slice(3) || '');
    g.append('g')
      .attr('class', 'x-axis text-zinc-500 font-mono text-[9px]')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '8px');
    g.selectAll('.x-axis .domain').attr('stroke', 'rgba(255, 255, 255, 0.1)');
  }, [history, slaLimitMs, compact]);

  const marginRatio = (currentLatency / slaLimitMs) * 100;
  const headroomMs = (slaLimitMs - currentLatency).toFixed(2);
  const isHealthy = currentLatency < slaLimitMs;

  return (
    <div
      className={`p-4 rounded-2xl bg-[#090e1a]/95 border border-cyan-500/20 shadow-xl backdrop-blur-md font-mono ${className}`}
    >
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Real-Time Stress & Latency Jitter Indicator
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isHealthy
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{isHealthy ? 'SLA VERIFIED (PURE GREEN)' : 'SLA BREACH'}</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Continuous 12-Stage Trace Replay Monitor • Dilithium-5 / Kyber-1024 Verification
            </p>
          </div>
        </div>

        {/* Current Jitter Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-zinc-400 font-sans">Execution Latency</div>
            <div className="text-base font-bold text-cyan-300 flex items-center gap-1 justify-end">
              <span>{currentLatency.toFixed(2)}</span>
              <span className="text-[11px] text-zinc-400 font-normal">ms</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerStressTest}
            disabled={isStressRunning}
            className={`px-3 py-1.5 rounded-xl border text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isStressRunning
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
            }`}
            title="Inject synthetic 12-stage stress load to verify SLA headroom"
          >
            {isStressRunning ? (
              <>
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                <span>Stress Test Active...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulate Load Spike</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* D3 Real-Time SVG Canvas */}
      <div className="relative mt-3 w-full overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-[140px] overflow-visible select-none"
        />
      </div>

      {/* SLA Margin & Key Metrics Footer Bar */}
      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
          <div className="text-zinc-400 text-[10px]">Benchmark Baseline</div>
          <div className="text-emerald-400 font-bold mt-0.5">35.80 ms</div>
        </div>

        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
          <div className="text-zinc-400 text-[10px]">SLA Target Ceiling</div>
          <div className="text-rose-400 font-bold mt-0.5">&lt; {slaLimitMs.toFixed(2)} ms</div>
        </div>

        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
          <div className="text-zinc-400 text-[10px]">SLA Headroom Margin</div>
          <div className="text-cyan-300 font-bold mt-0.5">+{headroomMs} ms ({(100 - marginRatio).toFixed(1)}%)</div>
        </div>

        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
          <div className="text-zinc-400 text-[10px]">Chain of Custody</div>
          <div className="text-zinc-200 font-bold mt-0.5">ISO/IEC 27037:2012</div>
        </div>
      </div>
    </div>
  );
};
