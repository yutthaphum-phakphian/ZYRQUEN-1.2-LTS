/**
 * ZYRQUEN Ω∞ Quantum Radar Mk-III (Phase 8)
 * 360-Degree Real-time Holographic Radar Pulse for Workflow Runtime & Boundary Nodes
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Radio, Sparkles, Activity } from 'lucide-react';

interface RadarNode {
  id: string;
  name: string;
  angle: number; // in degrees
  distance: number; // 0 to 1
  color: string;
  status: string;
}

const RADAR_NODES: RadarNode[] = [
  { id: 'node-01', name: 'Parse & Ingestion', angle: 45, distance: 0.55, color: '#06b6d4', status: 'PASS' },
  { id: 'node-02', name: 'PQC Key Gen (Kyber)', angle: 120, distance: 0.75, color: '#8b5cf6', status: 'ACTIVE' },
  { id: 'node-03', name: 'Test & Verification', angle: 210, distance: 0.65, color: '#10b981', status: 'VALIDATED' },
  { id: 'node-04', name: 'Fail-Closed Guard', angle: 300, distance: 0.85, color: '#f59e0b', status: 'ARMED' },
  { id: 'node-05', name: 'Deca-Custodian Core', angle: 0, distance: 0.25, color: '#ec4899', status: 'QUORUM 10/10' },
];

export const QuantumRadarMkIII: React.FC = () => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 2) % 360);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/20 shadow-xl flex flex-col items-center justify-between space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase">
          <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
          <span>Quantum Radar Mk-III</span>
        </div>
        <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
          SWEEP ACTIVE (60 FPS)
        </span>
      </div>

      {/* Radar Viewport */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-cyan-500/30 bg-[#040814] flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Concentric Range Rings */}
        <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/20" />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/20" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-cyan-500/20" />

        {/* Crosshairs */}
        <div className="absolute w-full h-[1px] bg-cyan-500/15" />
        <div className="absolute h-full w-[1px] bg-cyan-500/15" />

        {/* Rotating Sweep Beam */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: 'conic-gradient(from 0deg, rgba(6,182,212,0.3) 0deg, rgba(6,182,212,0.0) 60deg, transparent 60deg)',
          }}
        />

        {/* Center Origin Dot */}
        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] z-10 animate-ping" />
        <div className="w-2.5 h-2.5 rounded-full bg-white z-20 absolute" />

        {/* Render Radar Nodes */}
        {RADAR_NODES.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          const radius = node.distance * 110;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          return (
            <div
              key={node.id}
              className="absolute z-20 flex flex-col items-center group cursor-pointer"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-lg animate-pulse"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-[9px] font-mono text-slate-300 mt-1 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
                {node.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
        <span>Sweep Frequency: <strong className="text-cyan-300">2.4 GHz</strong></span>
        <span>Resolution: <strong className="text-emerald-300">Sub-Kelvin Qubit</strong></span>
      </div>
    </div>
  );
};

export default QuantumRadarMkIII;
