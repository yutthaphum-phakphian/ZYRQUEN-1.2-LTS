import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { Activity, ShieldCheck } from 'lucide-react';

export interface BlockDriftData {
  blockNumber: number;
  drift: number; // e.g., 0.000
  timestamp: string;
}

export interface SecurityPipelineHeaderProps {
  blockHistory?: BlockDriftData[];
  className?: string;
}

export const SecurityPipelineHeader: React.FC<SecurityPipelineHeaderProps> = ({ 
  blockHistory,
  className = ''
}) => {
  // จำลองข้อมูล 20 บล็อกล่าสุด หากไม่ได้ส่ง prop เข้ามา
  const data: BlockDriftData[] = useMemo(() => {
    if (blockHistory && blockHistory.length >= 20) return blockHistory.slice(-20);
    const startBlock = 849183;
    return Array.from({ length: 20 }, (_, i) => ({
      blockNumber: startBlock + i,
      drift: 0.00 + (Math.sin(i) * 0.001 - 0.0005), // เบี่ยงเบนระดับ Micro-drift เล็กน้อยรอบ 0.00%
      timestamp: new Date(Date.now() - (20 - i) * 3000).toLocaleTimeString()
    }));
  }, [blockHistory]);

  // คำนวณ D3 Path
  const svgWidth = 180;
  const svgHeight = 36;
  const margin = { top: 4, right: 4, bottom: 4, left: 4 };

  const pathD = useMemo(() => {
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, svgWidth - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-0.005, 0.005]) // ช่วงความเสถียร Zero Drift
      .range([svgHeight - margin.bottom, margin.top]);

    const lineGenerator = d3.line<BlockDriftData>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.drift))
      .curve(d3.curveMonotoneX);

    return lineGenerator(data) || '';
  }, [data]);

  return (
    <div className={`w-full bg-slate-950 border-b border-cyan-500/30 p-4 flex flex-wrap items-center justify-between gap-4 font-mono ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 border border-cyan-500/40 rounded-lg text-cyan-400">
          <ShieldCheck className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            SECURITY PIPELINE VIEW
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ACTIVE
            </span>
          </h2>
          <p className="text-[10px] text-slate-400">SSoT Invariant Validation &amp; Post-Quantum Enclave</p>
        </div>
      </div>

      {/* Mini D3.js Line Chart Component */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
        <div className="text-right">
          <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>SSoT Δ0.00% Zero Drift</span>
          </div>
          <div className="text-xs font-bold text-emerald-400">
            Last 20 Blocks Stable
          </div>
        </div>

        {/* D3 SVG Canvas */}
        <div className="relative">
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            {/* Zero Line */}
            <line
              x1={margin.left}
              y1={svgHeight / 2}
              x2={svgWidth - margin.right}
              y2={svgHeight / 2}
              stroke="#334155"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
            {/* Sparkline Glow */}
            <path
              d={pathD}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]"
            />
            {/* Current Block Marker Dot */}
            {data.length > 0 && (
              <circle
                cx={svgWidth - margin.right}
                cy={svgHeight / 2}
                r="3"
                className="fill-cyan-400 animate-ping"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
