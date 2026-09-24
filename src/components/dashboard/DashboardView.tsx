// src/components/dashboard/DashboardView.tsx

import React, { useState, useEffect } from 'react';
import { 
  Thermometer, Cpu, Activity, RefreshCw, Zap, ShieldCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

export interface TelemetrySnapshot {
  id: string;
  timestampMs: number;
  time: string;
  cryostatTempK: number; // Cryostat Temperature in Kelvin (mK range)
  cpuCoreUsage: number;  // CPU Core Usage Percentage
}

export const DashboardView: React.FC = () => {
  const [snapshots, setSnapshots] = useState<TelemetrySnapshot[]>([]);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);

  // Initial Telemetry Buffer Generation
  useEffect(() => {
    const initialSnapshots: TelemetrySnapshot[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const timeMs = now - i * 2000;
      initialSnapshots.push({
        id: `SNAP-${timeMs}`,
        timestampMs: timeMs,
        time: new Date(timeMs).toLocaleTimeString('en-US', { 
          hour12: false, minute: '2-digit', second: '2-digit' 
        }),
        cryostatTempK: Number((0.0145 + Math.random() * 0.0025).toFixed(4)), // ~14.5mK to 17.0mK
        cpuCoreUsage: Number((32 + Math.random() * 45).toFixed(1))
      });
    }
    setSnapshots(initialSnapshots);
  }, []);

  // Dynamic Telemetry Ingestion Loop (Live Stream Simulation)
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLabel = new Date(now).toLocaleTimeString('en-US', { 
        hour12: false, minute: '2-digit', second: '2-digit' 
      });

      const newSnapshot: TelemetrySnapshot = {
        id: `SNAP-${now}`,
        timestampMs: now,
        time: timeLabel,
        // Occasional cryostat thermal fluctuation simulation
        cryostatTempK: Number((0.0145 + Math.random() * 0.003).toFixed(4)),
        // Dynamic load spike simulation
        cpuCoreUsage: Number((25 + Math.random() * 60 + (Math.random() < 0.15 ? 15 : 0)).toFixed(1))
      };

      setSnapshots(prev => {
        const updated = [...prev, newSnapshot];
        // Retain 30-snapshot rolling window
        return updated.slice(-30);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  const latestSnapshot = snapshots[snapshots.length - 1] || {
    cryostatTempK: 0.015,
    cpuCoreUsage: 0
  };

  return (
    <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6 font-mono">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            TELEMETRY DASHBOARD VIEW
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time Cryostat Thermal & Processing Core Monitoring</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
              isLiveStreamActive 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/60' 
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveStreamActive ? 'animate-spin' : ''}`} />
            {isLiveStreamActive ? 'STREAM ACTIVE' : 'STREAM PAUSED'}
          </button>
          
          <span className="text-xs px-2.5 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-md flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            NOMINAL
          </span>
        </div>
      </div>

      {/* Primary Status Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              CRYOSTAT TEMPERATURE
            </span>
            <div className="text-2xl font-black text-cyan-300">
              {(latestSnapshot.cryostatTempK * 1000).toFixed(2)} <span className="text-xs text-slate-500">mK</span>
            </div>
            <p className="text-[10px] text-slate-500">Sub-Kelvin Loop Target: 15.00 mK</p>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              CPU CORE USAGE
            </span>
            <div className="text-2xl font-black text-purple-300">
              {latestSnapshot.cpuCoreUsage.toFixed(1)} <span className="text-xs text-slate-500">%</span>
            </div>
            <p className="text-[10px] text-slate-500">Active Mesh Core Array Allocation</p>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Dynamic Telemetry Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. SECONDARY RECHARTS LINECHART: Cryostat Temperature History */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              CRYOSTAT TEMPERATURE HISTORY (mK)
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">
              Live LineChart
            </span>
          </div>

          <div className="h-60 w-full bg-slate-950/90 p-2 rounded-lg border border-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshots}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis 
                  domain={[0.012, 0.020]} 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  tickFormatter={(val) => `${(val * 1000).toFixed(1)}mK`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    color: '#f8fafc' 
                  }}
                  formatter={(value: any) => [`${(Number(value) * 1000).toFixed(2)} mK`, 'Cryostat Temp']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cryostatTempK" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. RECHARTS AREACHART: CPU Core Usage Trends */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              CPU CORE USAGE TRENDS (%)
            </h3>
            <span className="text-[10px] text-purple-400 font-mono">
              Dynamic AreaChart
            </span>
          </div>

          <div className="h-60 w-full bg-slate-950/90 p-2 rounded-lg border border-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshots}>
                <defs>
                  <linearGradient id="cpuUsageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    color: '#f8fafc' 
                  }}
                  formatter={(value: any) => [`${value}%`, 'CPU Usage']}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpuCoreUsage" 
                  stroke="#c084fc" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#cpuUsageGradient)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
