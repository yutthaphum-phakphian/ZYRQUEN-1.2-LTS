import React from 'react';

interface ThreatSparklineProps {
  data: number[];
}

export const ThreatSparkline: React.FC<ThreatSparklineProps> = ({ data }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const width = 220;
  const height = 45;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / (max - min || 1)) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
        <span>24h Threat Index History</span>
        <span className="text-emerald-400 font-semibold">Peak: {max.toFixed(2)}</span>
      </div>
      <div className="p-2 rounded-lg bg-slate-950 border-slate-800/80">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
          <defs>
            <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#threatGradient)"
            points={`0,${height} ${points} ${width},${height}`}
          />
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
};
export default ThreatSparkline;
