import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity } from 'lucide-react';

export const AggregateSystemEntropyChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [data, setData] = useState<{ time: number; value: number }[]>([]);

  useEffect(() => {
    // Generate initial data
    const now = Date.now();
    const initialData = Array.from({ length: 40 }).map((_, i) => ({
      time: now - (40 - i) * 1000,
      value: 50 + Math.sin(i * 0.5) * 20 + Math.random() * 10
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData(prev => {
        const nextTime = Date.now();
        const nextValue = Math.max(10, Math.min(90, prev[prev.length - 1].value + (Math.random() * 15 - 7.5)));
        const nextData = [...prev.slice(1), { time: nextTime, value: nextValue }];
        return nextData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.time) as [number, number])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Grid lines
    const yAxisGrid = d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => '').ticks(5);
    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', 'rgba(6, 182, 212, 0.1)')
      .attr('stroke-dasharray', '2,2');
    
    g.selectAll('.domain').remove(); // Hide axes spines

    const xAxis = d3.axisBottom(x).ticks(5).tickFormat((d: any) => d3.timeFormat('%H:%M:%S')(d));
    const yAxis = d3.axisLeft(y).ticks(5);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#52525b')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#52525b')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px');
      
    g.selectAll('.domain').attr('stroke', '#3f3f46');
    g.selectAll('.tick line').attr('stroke', '#3f3f46');

    const line = d3.line<{ time: number; value: number }>()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Area under line
    const area = d3.area<{ time: number; value: number }>()
      .x(d => x(d.time))
      .y0(innerHeight)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const gradientId = 'entropy-gradient';
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(6, 182, 212, 0.3)');
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(6, 182, 212, 0.0)');

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2)
      .attr('d', line);
      
    // Glowing dot at the end
    const lastPoint = data[data.length - 1];
    if (lastPoint) {
      g.append('circle')
        .attr('cx', x(lastPoint.time))
        .attr('cy', y(lastPoint.value))
        .attr('r', 4)
        .attr('fill', '#fff')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0px 0px 4px rgba(6, 182, 212, 0.8))');
    }

  }, [data]);

  const currentEntropy = data.length > 0 ? Math.round(data[data.length - 1].value) : 52;

  return (
    <div className="w-full rounded-[24px] bg-gradient-to-br from-[#0a0d1c]/95 via-[#080b18]/90 to-[#050712]/95 border border-cyan-500/25 shadow-[0_8px_30px_-10px_rgba(6,182,212,0.15)] backdrop-blur-2xl p-4 sm:p-5 flex flex-col space-y-3 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono tracking-wider flex items-center gap-2">
              AGGREGATE SYSTEM ENTROPY
            </h3>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>H(Ω): <strong className="text-cyan-300">{currentEntropy}%</strong></span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-semibold">EQUILIBRIUM NOMINAL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-[10px] font-mono">
          <span className="text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
            D3 LINE SERIES
          </span>
          <span className="text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            1.0s REFRESH
          </span>
        </div>
      </div>

      {/* Strictly Capped Height Container (Zero Overflow) */}
      <div ref={containerRef} className="w-full h-[180px] sm:h-[190px] relative overflow-hidden rounded-xl bg-black/40 border border-white/5 p-1">
        <svg ref={svgRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
