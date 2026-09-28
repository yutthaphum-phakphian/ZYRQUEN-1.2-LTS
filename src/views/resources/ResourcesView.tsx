/**
 * ZYRQUEN Ω∞ Resources Management View (Phase 5)
 * Cloud & Cryogenic Subsystem Hardware Utilization and Quota Control
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Server,
  Cpu,
  Database,
  Radio,
  Zap,
  Activity,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { playTone } from '../../components/AudioSynthesizer';

export const ResourcesView: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    playTone(720, 0.04);
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const resourceCards = [
    {
      title: 'CPU & Quantum Gate Core',
      usage: '41.2%',
      limit: '85.0% Quota',
      details: '32 vCPUs Nominal • 1,390 WARM OPs',
      barColor: 'bg-cyan-500',
      percentage: 48,
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    },
    {
      title: 'Cryostat Enclave Memory',
      usage: '54.0%',
      limit: '80.0% Quota',
      details: '69.1 GB / 128 GB Sub-Kelvin cryo RAM',
      barColor: 'bg-violet-500',
      percentage: 54,
      icon: <Database className="w-5 h-5 text-violet-400" />,
    },
    {
      title: 'Envoy Mesh High-Throughput TX',
      usage: '49 MB/s',
      limit: '150 MB/s SLA',
      details: 'HTTP/3 + gRPC Strict Invariant Stream',
      barColor: 'bg-emerald-500',
      percentage: 33,
      icon: <Radio className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'WORM Immutable Audit Storage',
      usage: '14,902',
      limit: '50,000 Seals',
      details: 'FIPS 140-3 Level 4 Sealed Hard-Sectors',
      barColor: 'bg-amber-500',
      percentage: 30,
      icon: <HardDrive className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              System Resources Management (Phase 5)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            การจัดสรรและควบคุมทรัพยากรประมวลผล (CPU, Memory, Storage, Network) ภายใต้เกณฑ์ความปลอดภัย Zero-Drift
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Resource Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resourceCards.map((res) => (
          <div
            key={res.title}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  {res.icon}
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">
                    {res.title}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {res.details}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-black text-white">
                  {res.usage}
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {res.limit}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-white/5">
                <div
                  className={`h-full ${res.barColor} transition-all duration-500`}
                  style={{ width: `${res.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Utilization: {res.percentage}%</span>
                <span>Threshold Safe (&lt; 85%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesView;
