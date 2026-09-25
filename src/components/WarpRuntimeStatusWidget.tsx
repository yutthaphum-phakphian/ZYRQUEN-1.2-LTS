import React, { useState, useEffect } from 'react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { Zap, Activity, ShieldCheck, Gauge, TrendingUp, Sparkles, Orbit, RefreshCw } from 'lucide-react';

interface WarpRuntimeStatusWidgetProps {
  onNavigate?: (view: any) => void;
}

export const WarpRuntimeStatusWidget: React.FC<WarpRuntimeStatusWidgetProps> = ({ onNavigate }) => {
  const [qOps, setQOps] = useState<number>(12840);
  const [warpFactor, setWarpFactor] = useState<number>(1.5);
  const [pulseTick, setPulseTick] = useState<boolean>(false);
  const [activeSectorsCount, setActiveSectorsCount] = useState<number>(6);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick((prev) => !prev);
      setQOps((prev) => {
        const delta = Math.floor(Math.random() * 90) - 45;
        return Math.max(9000, 12500 + delta);
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="warp-runtime-status-widget" className="p-5 rounded-2xl bg-[#070a12] border-[#D4AF37]/40 shadow-xl space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌌</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#D4AF37] tracking-wider">
                WARP RUNTIME CONTINUUM
              </h3>
              <span className="px-2 py-0.2 rounded bg-emerald-950/80 border-emerald-500 text-emerald-400 font-bold text-[9px] animate-pulse">
                WARP ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Real-time Sovereign Throughput &amp; Super-Luminal Continuum Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTone(700, 0.02);
              setWarpFactor((prev) => (prev >= 2.0 ? 1.0 : prev + 0.5));
            }}
            className="px-2.5 py-1 bg-[#0a0f1e] border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/20 rounded font-bold transition-all text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <span>⚡ Warp: {warpFactor.toFixed(1)}x</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => {
                playAuditChime();
                onNavigate('civilization');
              }}
              className="px-2.5 py-1 bg-cyan-950 border-cyan-500 text-cyan-300 hover:bg-cyan-900 rounded font-bold transition-all text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <span>Launch Civilization Engine →</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0a0f1e] border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block">qOps Throughput</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-400">{qOps.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400">ops/s</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.2% Boost
          </span>
        </div>

        <div className="p-3 bg-[#0a0f1e] border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block">SSoT Drift Delta</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-cyan-300">Δ0.00%</span>
          </div>
          <span className="text-[10px] text-cyan-400">Zero Drift Strict</span>
        </div>

        <div className="p-3 bg-[#0a0f1e] border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block">Active Continua</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-[#D4AF37]">{activeSectorsCount} / 6</span>
          </div>
          <span className="text-[10px] text-slate-400">All Sectors Linked</span>
        </div>

        <div className="p-3 bg-[#0a0f1e] border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block">HSM Quorum Lock</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-purple-300">10 / 10</span>
          </div>
          <span className="text-[10px] text-purple-400">FIPS 140-3 L4</span>
        </div>
      </div>

      {/* Animated Warp Stream Wave Bar */}
      <div className="p-3 bg-[#0a0f1e] border-slate-800 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${pulseTick ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            <span>Harmonic Sub-Kelvin Waveform (14.98 mK Cryo Baseline)</span>
          </span>
          <span className="text-cyan-400 font-bold">Dilithium-5 / ML-KEM-1024 Lattice</span>
        </div>

        {/* Dynamic Simulated Wave Graphic */}
        <div className="h-4 bg-[#070a12] rounded overflow-hidden flex items-center px-1 gap-1 border-slate-800/80">
          {Array.from({ length: 28 }).map((_, i) => {
            const heightPct = Math.min(100, Math.max(20, Math.sin(i * 0.4 + (pulseTick ? 1 : 0)) * 40 + 60));
            return (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-cyan-600 via-emerald-400 to-[#D4AF37] rounded-sm transition-all duration-300"
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
