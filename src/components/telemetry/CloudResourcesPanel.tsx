import React, { useState } from 'react';
import { Cpu, Database, HardDrive, Wifi, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export interface CloudResourceMetric {
  time: string;
  cpu: number;
  memory: number;
  iops: number;
  network: number;
}

const SAMPLE_METRICS: CloudResourceMetric[] = [
  { time: '05:00', cpu: 38, memory: 52, iops: 1200, network: 42 },
  { time: '05:05', cpu: 42, memory: 54, iops: 1350, network: 48 },
  { time: '05:10', cpu: 40, memory: 53, iops: 1280, network: 45 },
  { time: '05:15', cpu: 48, memory: 57, iops: 1600, network: 62 },
  { time: '05:20', cpu: 45, memory: 56, iops: 1480, network: 54 },
  { time: '05:25', cpu: 41, memory: 54, iops: 1390, network: 49 },
];

export const CloudResourcesPanel: React.FC = () => {
  const [data, setData] = useState<CloudResourceMetric[]>(SAMPLE_METRICS);
  const [activeMetric, setActiveMetric] = useState<'cpu' | 'memory' | 'iops' | 'network'>('cpu');

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Cloud Resources &amp; Real-Time Utilization
            </h3>
            <p className="text-[10px] text-slate-400">Kubernetes Pods &amp; Envoy Edge Telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
          {(['cpu', 'memory', 'iops', 'network'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`px-2 py-0.5 rounded capitalize transition-all cursor-pointer ${
                activeMetric === metric
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>CPU Allocation</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">41.2%</div>
          <div className="text-[10px] text-emerald-400">32 vCPUs Nominal</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Memory Quota</span>
            <Database className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">54.0%</div>
          <div className="text-[10px] text-emerald-400">69.1 / 128 GB</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>NVMe IOPS</span>
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">1,390</div>
          <div className="text-[10px] text-cyan-400">&lt; 0.42ms RTT</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Envoy Mesh Tx</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">49 MB/s</div>
          <div className="text-[10px] text-emerald-400">mTLS 1.3 Strict</div>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-40 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cloudMetricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={['dataMin - 5', 'dataMax + 10']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
            />
            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cloudMetricGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CloudResourcesView = CloudResourcesPanel;
export default CloudResourcesPanel;
