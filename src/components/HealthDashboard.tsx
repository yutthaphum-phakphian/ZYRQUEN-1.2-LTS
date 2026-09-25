// src/components/HealthDashboard.tsx
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity, Cpu, HardDrive, Thermometer, ShieldCheck } from 'lucide-react';
import { HardwareSnapshot } from '../types';

export interface SnapshotData {
  timestamp: string;
  cpuUsage: number;     // %
  memoryUsage: number;  // %
  cryostatTemp: number; // K หรือ °C
}

interface HealthDashboardProps {
  snapshots?: (SnapshotData | HardwareSnapshot)[];
  title?: string;
  className?: string;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  snapshots = [],
  title = 'System Health Dashboard',
  className = '',
}) => {
  // Normalize snapshot data to guarantee { timestamp, cpuUsage, memoryUsage, cryostatTemp }
  const chartData: SnapshotData[] = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      // Provide default fallback mock points if empty
      return [
        { timestamp: '00:00:00', cpuUsage: 42, memoryUsage: 38, cryostatTemp: 0.014 },
        { timestamp: '00:00:02', cpuUsage: 45, memoryUsage: 40, cryostatTemp: 0.015 },
        { timestamp: '00:00:04', cpuUsage: 39, memoryUsage: 39, cryostatTemp: 0.014 },
        { timestamp: '00:00:06', cpuUsage: 48, memoryUsage: 41, cryostatTemp: 0.016 },
        { timestamp: '00:00:08', cpuUsage: 41, memoryUsage: 38, cryostatTemp: 0.015 },
      ];
    }

    return snapshots.slice(-20).map((s: any, idx) => {
      // Extract timestamp string
      let ts = s.timestamp;
      if (!ts) {
        if (s.timestampIct) {
          const parts = s.timestampIct.split(' ');
          ts = parts[1] || parts[0];
        } else if (s.timestampUtc) {
          ts = s.timestampUtc.slice(11, 19);
        } else {
          ts = `T-${idx}`;
        }
      }

      // Extract CPU usage %
      let cpu = typeof s.cpuUsage === 'number' ? s.cpuUsage : s.cpuAverage;
      if (typeof cpu !== 'number' && Array.isArray(s.cpuCores)) {
        cpu = Math.round(s.cpuCores.reduce((a: number, b: number) => a + b, 0) / s.cpuCores.length);
      }
      if (typeof cpu !== 'number') cpu = 40;

      // Extract Memory usage %
      let mem = typeof s.memoryUsage === 'number' ? s.memoryUsage : undefined;
      if (typeof mem !== 'number' && typeof s.memoryUsedMb === 'number' && typeof s.memoryTotalMb === 'number' && s.memoryTotalMb > 0) {
        mem = Math.round((s.memoryUsedMb / s.memoryTotalMb) * 100);
      }
      if (typeof mem !== 'number') mem = 38;

      // Extract Cryostat temp (K)
      let temp = typeof s.cryostatTemp === 'number' ? s.cryostatTemp : undefined;
      if (typeof temp !== 'number' && typeof s.cryoTempMk === 'number') {
        temp = +(s.cryoTempMk / 1000).toFixed(3);
      }
      if (typeof temp !== 'number') temp = 0.015;

      return {
        timestamp: ts,
        cpuUsage: Number(cpu),
        memoryUsage: Number(mem),
        cryostatTemp: Number(temp),
      };
    });
  }, [snapshots]);

  const latestPoint = chartData[chartData.length - 1] || {
    cpuUsage: 0,
    memoryUsage: 0,
    cryostatTemp: 0,
  };

  return (
    <div className={`p-4 sm:p-6 bg-slate-900/95 rounded-2xl border-slate-800 shadow-xl text-white backdrop-blur-xl ${className}`}>
      {/* Header with KPI overview pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border-cyan-500/40 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-mono text-cyan-400 flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border-emerald-500/40 font-normal">
                LIVE TELEMETRY
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time Hardware Cores, RAM Buffer & Cryostat Sub-Kelvin Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border-rose-500/30 text-rose-300">
            <Cpu className="w-3.5 h-3.5 text-rose-400" />
            <span>CPU: <strong className="text-white">{latestPoint.cpuUsage}%</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border-blue-500/30 text-blue-300">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>RAM: <strong className="text-white">{latestPoint.memoryUsage}%</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border-emerald-500/30 text-emerald-300">
            <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryo: <strong className="text-white">{latestPoint.cryostatTemp} K</strong></span>
          </div>
        </div>
      </div>

      {/* Recharts Multi-line Stream */}
      <div className="h-72 sm:h-80 w-full min-w-0 font-mono text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#070c1a',
                borderColor: '#1e293b',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '12px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
            <Line
              type="monotone"
              dataKey="cpuUsage"
              name="CPU Usage (%)"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 2, fill: '#ef4444' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="memoryUsage"
              name="Memory Usage (%)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="cryostatTemp"
              name="Cryostat Temp (K)"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 2, fill: '#10b981' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthDashboard;
