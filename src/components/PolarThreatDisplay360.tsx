/**
 * @file PolarThreatDisplay360.tsx
 * @description 360° Polar Threat Radar & Vector Hologram
 */

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Radio, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

interface ThreatPoint {
  id: string;
  name: string;
  angle: number;
  distance: number; // 0 to 100%
  severity: 'CRITICAL' | 'WARNING' | 'NEUTRAL';
  pqcMitigation: string;
}

const DEFAULT_VECTORS: ThreatPoint[] = [
  { id: 'VEC-101', name: "Shor's Algorithm Probe", angle: 45, distance: 75, severity: 'CRITICAL', pqcMitigation: 'Dilithium-5 Encapsulation' },
  { id: 'VEC-102', name: 'Grover Search Quantum Anomaly', angle: 120, distance: 40, severity: 'WARNING', pqcMitigation: 'SPHINCS+ Stateless Hash Seal' },
  { id: 'VEC-103', name: 'Physical Probe Enclosure Breach', angle: 210, distance: 90, severity: 'CRITICAL', pqcMitigation: 'Active Zeroization < 1.2ms' },
  { id: 'VEC-104', name: 'Timing Side-Channel Fluctuation', angle: 300, distance: 30, severity: 'NEUTRAL', pqcMitigation: 'Constant-Time Lattice Core' },
];

export const PolarThreatDisplay360: React.FC = () => {
  const [sweepAngle, setSweepAngle] = useState(0);
  const [vectors] = useState<ThreatPoint[]>(DEFAULT_VECTORS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#050814] border border-cyan-500/30 rounded-xl p-6 text-cyan-400 font-mono shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-6">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-lg font-bold tracking-wider text-cyan-200">POLAR THREAT DISPLAY 360°</h2>
            <p className="text-xs text-cyan-500/80">Continuous Quantum Perimeter & Tamper Surveillance</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-full text-xs">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>FIPS 140-3 LEVEL 4</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Polar Canvas Visualizer */}
        <div className="relative w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center">
          {/* Radar Circles */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
          <div className="absolute inset-[15%] rounded-full border border-cyan-500/25" />
          <div className="absolute inset-[30%] rounded-full border border-cyan-500/30" />
          <div className="absolute inset-[45%] rounded-full border border-cyan-500/40" />

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />

          {/* Sweep Needle */}
          <div
            className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-cyan-300 origin-left"
            style={{ transform: `rotate(${sweepAngle}deg)` }}
          />

          {/* Center Origin */}
          <div className="absolute w-4 h-4 rounded-full bg-cyan-400 border-2 border-black shadow-[0_0_12px_rgba(6,182,212,0.8)] z-10" />

          {/* Vectors */}
          {vectors.map((vec) => {
            const rad = (vec.angle * Math.PI) / 180;
            const r = (vec.distance / 100) * 45; // percentage from center
            const x = 50 + r * Math.cos(rad);
            const y = 50 + r * Math.sin(rad);

            const colorClass =
              vec.severity === 'CRITICAL'
                ? 'bg-rose-500 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                : vec.severity === 'WARNING'
                ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'bg-emerald-400 border-emerald-200';

            return (
              <div
                key={vec.id}
                className={`absolute w-3 h-3 rounded-full border ${colorClass} -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-150`}
                style={{ top: `${y}%`, left: `${x}%` }}
                title={`${vec.name} (${vec.angle}° - ${vec.distance}%)`}
              />
            );
          })}
        </div>

        {/* Threat Vector Feed */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-cyan-300 tracking-wider mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Active Vector Telemetry ({vectors.length})</span>
          </div>
          {vectors.map((vec) => (
            <div
              key={vec.id}
              className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-cyan-200">{vec.id} • {vec.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    vec.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : vec.severity === 'WARNING'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {vec.severity}
                </span>
              </div>
              <div className="text-[11px] text-cyan-400/80">
                Bearing: <span className="text-cyan-200">{vec.angle}°</span> | Distance: <span className="text-cyan-200">{vec.distance}%</span>
              </div>
              <div className="text-[11px] text-cyan-500 mt-1">
                Mitigation: <span className="text-cyan-300">{vec.pqcMitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolarThreatDisplay360;
