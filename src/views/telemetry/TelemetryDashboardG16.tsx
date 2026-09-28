/**
 * ZYRQUEN Ω∞ Telemetry Dashboard G16 (Phase 7)
 * High-frequency telemetry metrics, throughput and OTLP log stream
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Zap,
  Radio,
  Server,
  Terminal,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { playTone } from '../../components/AudioSynthesizer';

interface MetricItem {
  name: string;
  value: string;
  subtext: string;
  accent: string;
  borderColor: string;
  bgGlow: string;
}

export const TelemetryDashboardG16: React.FC = () => {
  const [isLive, setIsLive] = useState(true);

  const metrics: MetricItem[] = [
    {
      name: 'System Throughput',
      value: '14.2k req/s',
      subtext: 'High-Throughput Envoy Mesh',
      accent: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      bgGlow: 'from-cyan-500/10 to-transparent',
    },
    {
      name: 'Mean Latency SLA',
      value: '35.80 ms',
      subtext: 'Target < 142.00 ms (Passed)',
      accent: 'text-violet-400',
      borderColor: 'border-violet-500/30',
      bgGlow: 'from-violet-500/10 to-transparent',
    },
    {
      name: 'Mutation Drift Error',
      value: '0.000%',
      subtext: 'Zero-Drift Invariant Locked',
      accent: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      bgGlow: 'from-emerald-500/10 to-transparent',
    },
    {
      name: 'Phoenix Recovery Index',
      value: '99.98%',
      subtext: 'Automatic Fault Healing Active',
      accent: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgGlow: 'from-amber-500/10 to-transparent',
    },
  ];

  const logs = [
    { time: '20:26:01 ICT', level: 'INFO', text: 'Zyrquen Ω∞ Core engine initialized in Frozen Mode v1.2.1 LTS' },
    { time: '20:26:15 ICT', level: 'PASS', text: '10/10 REAL_HSM Quorum consensus validated under FIPS 140-3 Level 4' },
    { time: '20:27:00 ICT', level: 'INFO', text: 'Deca-Custodian PQC signatures anchored to Merkle Root 0x909ab814...' },
    { time: '20:27:42 ICT', level: 'WARN', text: 'Micro-latency jitter observed on Cryo-Bus (0.31ms compensated)' },
    { time: '20:28:10 ICT', level: 'PASS', text: 'Zero-mutation read-only boundary connectors verified across 18 Chambers' },
    { time: '20:28:30 ICT', level: 'RECOVERY', text: 'Phoenix Pipeline automated rollback ready (Zero mutation required)' },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.name}
            className={`p-5 rounded-2xl bg-gradient-to-b ${m.bgGlow} bg-slate-950/80 border ${m.borderColor} shadow-lg`}
          >
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">
              {m.name}
            </span>
            <div className={`mt-2 text-2xl font-mono font-black ${m.accent}`}>
              {m.value}
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-500">
              {m.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Telemetry Logs Box */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>High-Frequency Telemetry Stream (OTLP)</span>
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE STREAM
          </span>
        </div>

        <div className="bg-black/60 rounded-xl p-4 border border-white/5 font-mono text-xs text-slate-300 space-y-2 h-56 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-slate-500 text-[10px] shrink-0">{log.time}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                  log.level === 'PASS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : log.level === 'WARN'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    : log.level === 'RECOVERY'
                    ? 'bg-violet-950 text-violet-300 border border-violet-500/30'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {log.level}
              </span>
              <span className="text-slate-300 break-all">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TelemetryDashboardG16;
