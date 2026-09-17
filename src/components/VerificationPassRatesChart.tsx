import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ShieldCheck } from 'lucide-react';

interface DataPoint {
  timestamp: Date;
  passRate: number;
}

// Generate some mock historical data for the 14,902 hardware seals
const generateHistoricalData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // Past 30 days
    // Fluctuate pass rate between 99.9% and 100%
    const passRate = 99.9 + Math.random() * 0.1;
    data.push({ timestamp: time, passRate });
  }
  return data;
};

export const VerificationPassRatesChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const data = generateHistoricalData();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = containerRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.timestamp) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([99.8, 100])
      .range([height, 0]);

    // Define the gradient
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4') // cyan-500
      .attr('stop-opacity', 0.5);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0);

    const area = d3
      .area<DataPoint>()
      .x((d) => x(d.timestamp))
      .y0(height)
      .y1((d) => y(d.passRate))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    const line = d3
      .line<DataPoint>()
      .x((d) => x(d.timestamp))
      .y((d) => y(d.passRate))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#22d3ee') // cyan-400
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add axes
    const xAxis = d3.axisBottom(x).ticks(5).tickFormat((domainValue) => {
      const date = domainValue as Date;
      return d3.timeFormat('%b %d')(date);
    });
    
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('color', '#52525b') // zinc-600
      .selectAll('text')
      .attr('color', '#a1a1aa') // zinc-400
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    const yAxis = d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`);
    
    svg
      .append('g')
      .call(yAxis)
      .attr('color', '#52525b')
      .selectAll('text')
      .attr('color', '#a1a1aa')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    // Add Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .attr('color', '#27272a') // zinc-800
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '2,2');
      
  }, [data]);

  return (
    <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Historical Hardware Seal Pass Rates</h3>
            <p className="text-[11px] text-zinc-400">14,902 active chambers • Trailing 30 days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
            100% UP
          </span>
        </div>
      </div>
      
      <div ref={containerRef} className="w-full h-[300px] mt-4 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
};
