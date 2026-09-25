import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis } from 'recharts';
import { HardwareSnapshot } from '../types';
import { Cpu } from 'lucide-react';

interface SystemHealthPulseProps {
  snapshots: HardwareSnapshot[];
}

export const SystemHealthPulse: React.FC<SystemHealthPulseProps> = ({ snapshots }) => {
  const data = useMemo(() => {
    // Get last 10 snapshots
    const recent = snapshots.slice(-10);
    return recent.map(s => ({
      name: s.id,
      cpu: s.cpuAverage,
    }));
  }, [snapshots]);

  return (
    <div className="p-4 rounded-2xl bg-[#0b0e1a]/70 border-white/8 backdrop-blur-xl flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-emerald-400" />
        <h4 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider font-mono">System Health Pulse</h4>
      </div>
      <div className="text-[10px] text-zinc-400 font-mono">
        CPU Load Average (Last 10 Snapshots)
      </div>
      <div className="flex-1 min-h-[100px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '10px', borderRadius: '8px' }} 
              itemStyle={{ color: '#34d399' }} 
              labelStyle={{ color: '#a1a1aa' }}
            />
            <Line 
              type="monotone" 
              dataKey="cpu" 
              stroke="#34d399" 
              strokeWidth={2} 
              dot={{ r: 2, fill: '#34d399', stroke: '#10b981' }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
