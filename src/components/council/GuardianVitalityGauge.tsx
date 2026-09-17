import React from 'react';
import { Activity, Radio, Thermometer, Wifi, Zap, Cpu, ArrowRightLeft } from 'lucide-react';
import { GuardianVitality } from '../../data/councilData';

interface GuardianVitalityGaugeProps {
  vitality: GuardianVitality;
  councilCode: string;
  isVerified: boolean;
  compact?: boolean;
}

export const GuardianVitalityGauge: React.FC<GuardianVitalityGaugeProps> = ({
  vitality,
  councilCode,
  isVerified,
  compact = false,
}) => {
  const pct = vitality.connectivityPct;

  // Gauge styling calculations
  const radius = compact ? 22 : 36;
  const strokeWidth = compact ? 4 : 6;
  const circumference = 2 * Math.PI * radius;
  // Normalized percentage for visual (e.g. range 90-100% maps to full stroke or standard 0-100%)
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  // Status colors
  const isCrystalline = pct >= 99.9;
  const isHigh = pct >= 99.0;
  const strokeColor = isCrystalline ? '#10B981' : isHigh ? '#06B6D4' : '#F59E0B';
  const glowColor = isCrystalline
    ? 'rgba(16, 185, 129, 0.4)'
    : isHigh
    ? 'rgba(6, 182, 212, 0.4)'
    : 'rgba(245, 158, 11, 0.4)';

  if (compact) {
    return (
      <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Circular SVG Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              className="w-14 h-14 -rotate-90 transform"
              viewBox="0 0 56 56"
            >
              {/* Track */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress Arc */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter: `drop-shadow(0 0 4px ${glowColor})`,
                  transition: 'stroke-dashoffset 0.8s ease-in-out',
                }}
              />
            </svg>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-white tracking-tighter">
                {pct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Core Info */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1 font-semibold">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Guardian Vitality</span>
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  isVerified
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {vitality.signalClarity.replace('_', ' ')}
              </span>
            </div>

            {/* Hardware Bridge Link */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5 truncate">
              <span className="text-amber-400 font-semibold shrink-0">HSM</span>
              <ArrowRightLeft className="w-2.5 h-2.5 text-cyan-400 animate-pulse shrink-0" />
              <span className="text-cyan-300 font-semibold shrink-0">Runtime Core</span>
              <span className="ml-auto text-emerald-400 font-bold shrink-0">{vitality.lastPingMs}ms</span>
            </div>
          </div>
        </div>

        {/* Telemetry Micro Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/5 text-[9px] font-mono">
          <div className="p-1 rounded bg-black/50 text-center">
            <span className="text-zinc-500 block">Cryo Temp</span>
            <span className="text-cyan-300 font-bold">{vitality.subKelvinTempK} K</span>
          </div>
          <div className="p-1 rounded bg-black/50 text-center">
            <span className="text-zinc-500 block">Jitter</span>
            <span className="text-emerald-400 font-bold">&plusmn;{vitality.jitterMs}ms</span>
          </div>
          <div className="p-1 rounded bg-black/50 text-center">
            <span className="text-zinc-500 block">Loss</span>
            <span className="text-zinc-300 font-bold">{vitality.packetLossPct}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded View (for Detail Modal)
  return (
    <div className="p-5 rounded-2xl bg-zinc-950 border border-cyan-500/30 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Gauge + Big Percentage */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <svg
              className="w-20 h-20 -rotate-90 transform"
              viewBox="0 0 88 88"
            >
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter: `drop-shadow(0 0 6px ${glowColor})`,
                  transition: 'stroke-dashoffset 0.8s ease-in-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-mono font-bold text-white">
                {pct.toFixed(2)}%
              </span>
              <span className="text-[8px] font-mono text-zinc-400">VITALITY</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                Physical HSM &bull; Runtime Core Bridge
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{councilCode} Cryptographic Vitality Index</span>
            </h4>
            <p className="text-xs text-zinc-400">
              สถานะการเชื่อมต่อแบบ Sub-Kelvin Cryo-Bus และความบริสุทธิ์ของสัญญาณโทรมาตร
            </p>
          </div>
        </div>

        {/* Right: Status Pill */}
        <div className="text-right font-mono space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{vitality.signalClarity.replace('_', ' ')}</span>
          </div>
          <span className="text-[11px] text-zinc-500 block">
            Status: {vitality.hsmCoreStatus}
          </span>
        </div>
      </div>

      {/* Expanded Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs font-mono">
        <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
          <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            Cryo Temp
          </span>
          <p className="text-sm font-bold text-cyan-300">{vitality.subKelvinTempK} K</p>
          <span className="text-[10px] text-zinc-500">Superconducting State</span>
        </div>

        <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
          <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Roundtrip Latency
          </span>
          <p className="text-sm font-bold text-emerald-300">{vitality.lastPingMs} ms</p>
          <span className="text-[10px] text-zinc-500">Jitter: &plusmn;{vitality.jitterMs} ms</span>
        </div>

        <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
          <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
            <Wifi className="w-3.5 h-3.5 text-amber-400" />
            Bus Bandwidth
          </span>
          <p className="text-sm font-bold text-amber-300">{vitality.busBandwidthGbps} Gbps</p>
          <span className="text-[10px] text-zinc-500">Loss: {vitality.packetLossPct}%</span>
        </div>

        <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
          <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            Entropy Generation
          </span>
          <p className="text-sm font-bold text-purple-300">{vitality.activeEntropyRateKBps} KB/s</p>
          <span className="text-[10px] text-zinc-500">Quantum Hardware TRNG</span>
        </div>
      </div>
    </div>
  );
};
