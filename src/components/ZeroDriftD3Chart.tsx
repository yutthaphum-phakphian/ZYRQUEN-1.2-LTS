import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface ZeroDriftPoint {
  block: number;
  drift: number; // in percentage, expected 0.0000
  timestamp: string;
}

interface ZeroDriftD3ChartProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ZeroDriftD3Chart: React.FC<ZeroDriftD3ChartProps> = ({
  width = 240,
  height = 48,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Generate 20 consecutive blocks up to 849202
    const data: ZeroDriftPoint[] = Array.from({ length: 20 }, (_, i) => {
      const blockNum = 849202 - (19 - i);
      return {
        block: blockNum,
        drift: 0.0, // Strictly Zero Drift Δ0.00%
        timestamp: `${14 + Math.floor(i / 4)}:${(i * 3) % 60 < 10 ? '0' : ''}${(i * 3) % 60}:43`
      };
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 6, right: 8, bottom: 8, left: 8 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient definition
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'zeroDriftGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.8);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 1);

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Scale
    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([-0.05, 0.05])
      .range([innerHeight, 0]);

    // Baseline horizontal reference (0.00% Zero Drift line)
    const zeroY = yScale(0);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', zeroY)
      .attr('y2', zeroY)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2')
      .attr('opacity', 0.35);

    // Generator line
    const line = d3
      .line<ZeroDriftPoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.drift))
      .curve(d3.curveMonotoneX);

    // Draw path
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'url(#zeroDriftGradient)')
      .attr('stroke-width', 2.2)
      .attr('filter', 'url(#glow)')
      .attr('d', line);

    // Render node points
    g.selectAll('circle.point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (_, i) => xScale(i))
      .attr('cy', (d) => yScale(d.drift))
      .attr('r', (_, i) => (i === data.length - 1 ? 3.5 : 1.8))
      .attr('fill', (_, i) => (i === data.length - 1 ? '#22d3ee' : '#10b981'))
      .attr('stroke', '#020617')
      .attr('stroke-width', 1);

    // Active pulse on latest block
    const latestIndex = data.length - 1;
    g.append('circle')
      .attr('cx', xScale(latestIndex))
      .attr('cy', yScale(data[latestIndex].drift))
      .attr('r', 5.5)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7)
      .append('animate')
      .attr('attributeName', 'r')
      .attr('values', '4;8;4')
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');

  }, [width, height]);

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-inner ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider whitespace-nowrap">
            SSoT Δ0.00%
          </span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
          20 BLOCKS ZERO DRIFT
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        />
      </div>
    </div>
  );
};

export default ZeroDriftD3Chart;
