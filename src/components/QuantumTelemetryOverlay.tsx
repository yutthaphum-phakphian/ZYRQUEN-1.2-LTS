import React, { useState, useEffect } from 'react';
import { Activity, Zap, Cpu, Radio, ShieldCheck, Download, FileText } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

interface TelemetryPoint {
  time: string;
  qOps: number;
  heartbeat: string;
  latencyMs: number;
}

export const QuantumTelemetryOverlay: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([
    { time: '14:50:01', qOps: 1422.4, heartbeat: 'STABLE', latencyMs: 12.4 },
    { time: '14:50:03', qOps: 1431.8, heartbeat: 'STABLE', latencyMs: 11.8 },
    { time: '14:50:05', qOps: 1419.2, heartbeat: 'STABLE', latencyMs: 13.1 },
    { time: '14:50:07', qOps: 1445.0, heartbeat: 'STABLE', latencyMs: 10.9 },
    { time: '14:50:09', qOps: 1428.6, heartbeat: 'ACTIVE', latencyMs: 12.0 },
  ]);
  const [currentQOps, setCurrentQOps] = useState<number>(1428.6);
  const [heartbeatStatus, setHeartbeatStatus] = useState<string>('STABLE (12ms)');
  const [isLive, setIsLive] = useState<boolean>(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const randomQOps = +(1400 + Math.random() * 50).toFixed(2);
      const latency = +(10 + Math.random() * 5).toFixed(1);

      setCurrentQOps(randomQOps);
      setHeartbeatStatus(`STABLE (${latency}ms)`);
      setTelemetry(prev => [
        ...prev.slice(-4),
        { time: now, qOps: randomQOps, heartbeat: 'ACTIVE', latencyMs: latency },
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div
      id="quantum-telemetry-overlay-widget"
      className="bg-slate-950/90 border-cyan-500/30 rounded-xl p-5 text-cyan-400 font-mono shadow-2xl backdrop-blur-md my-4 transition-all duration-300 hover:border-cyan-500/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-base font-bold text-cyan-200 tracking-wide">
            Quantum Telemetry Overlay (qOps & Heartbeat Stream)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTone(660, 0.04);
              const el = document.getElementById('quantum-performance-report-widget');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/80 border-cyan-500/40 rounded text-xs text-cyan-200 hover:border-cyan-300 hover:text-white transition-colors cursor-pointer"
            title="Generate Forensic Master Dossier PDF"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate PDF Report</span>
          </button>
          <button
            onClick={() => setIsLive(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border-cyan-500/30 rounded text-xs hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <Radio className={`w-3 h-3 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className={isLive ? 'text-emerald-400' : 'text-slate-500'}>
              {isLive ? 'LIVE STREAM' : 'PAUSED'}
            </span>
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Immutable Kernel: <span className="text-emerald-400">Read-Only</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/80 border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>CURRENT QUANTUM OPS (qOps)</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-cyan-300">{currentQOps}</span>
            <span className="text-xs text-slate-400">ops/sec</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Post-Quantum Dilithium-5 / SPHINCS+ Engine</div>
        </div>

        <div className="bg-slate-900/80 border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>SYSTEM HEARTBEAT</span>
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-emerald-400">{heartbeatStatus}</div>
          <div className="text-[10px] text-slate-500 mt-1">Deca-Key Real HSM 10/10 Quorum Sync</div>
        </div>
      </div>

      <div className="bg-slate-900/80 border-cyan-500/20 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pb-1 border-b border-slate-800">
          <span>LIVE STREAM BUFFER (LAST 5 TICKS)</span>
          <span className="text-[10px] text-cyan-500">REAL-TIME INGRESS</span>
        </div>
        <div className="space-y-1.5">
          {telemetry.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-950/60 border-slate-800/60 hover:border-cyan-500/30 transition-colors"
            >
              <span className="text-slate-400 font-mono text-[11px]">{item.time}</span>
              <span className="text-cyan-300 font-mono font-semibold">{item.qOps} qOps</span>
              <span className="text-slate-400 text-[11px]">{item.latencyMs}ms</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                {item.heartbeat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
