import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';

export const PulseView: React.FC = () => {
  const { snapshots } = useTelemetry();
  return (
    <div id="quantum-pulse-view" className="bg-[#0A0F1E] p-6 rounded-xl text-cyan-300 border border-cyan-500/30 shadow-2xl font-mono">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-emerald-400 text-base font-bold flex items-center gap-2">
          <span>📈</span>
          <span>Quantum Entropy Drift</span>
        </h2>
        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
          Safe Bounds: [26, 78]
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={snapshots}>
          <XAxis 
            dataKey="timestamp" 
            stroke="#10B981" 
            tickFormatter={(unix) => new Date(unix).toLocaleTimeString()}
            tick={{ fontSize: 10 }}
          />
          <YAxis domain={[26, 78]} stroke="#D4AF37" tick={{ fontSize: 10 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0A0F1E', borderColor: '#066B64', color: '#06B6D4' }} 
            labelFormatter={(unix: any) => new Date(Number(unix)).toLocaleTimeString()}
          />
          <Line type="monotone" dataKey="entropyDrift" stroke="#066B64" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PulseView;
