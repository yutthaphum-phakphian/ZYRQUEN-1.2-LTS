/**
 * ZYRQUEN Ω∞ Multiverse Defense Panorama (Phase 15)
 * 3D Holographic Panorama Visualization of All Defense Enclaves & Nodes
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Sparkles, Shield, Cpu, Activity, Play, Pause, RotateCw } from 'lucide-react';
import { playTone } from '../../components/AudioSynthesizer';

interface DefenseNode {
  name: string;
  angle: number;
  pitch: number;
  color: string;
  category: string;
}

const DEFENSE_NODES: DefenseNode[] = [
  { name: 'Constellation Map Enclave', angle: 0, pitch: 0.2, color: '#06b6d4', category: 'Topology' },
  { name: 'Quantum Sync Grid', angle: (Math.PI * 2) / 7, pitch: -0.4, color: '#a855f7', category: 'Quantum' },
  { name: 'Control Tower Enclave', angle: (Math.PI * 4) / 7, pitch: 0.5, color: '#10b981', category: 'Command' },
  { name: 'ERA∞ Portal Gate', angle: (Math.PI * 6) / 7, pitch: -0.2, color: '#f59e0b', category: 'Governance' },
  { name: 'Genesis Runtime #849202', angle: (Math.PI * 8) / 7, pitch: 0.3, color: '#ef4444', category: 'Kernel' },
  { name: 'Unified Engine Mesh', angle: (Math.PI * 10) / 7, pitch: -0.5, color: '#6366f1', category: 'AI Swarm' },
  { name: 'Simulation Hub Sandbox', angle: (Math.PI * 12) / 7, pitch: 0.4, color: '#14b8a6', category: 'Resilience' },
];

export const MultiverseDefensePanorama: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [selectedNode, setSelectedNode] = useState<DefenseNode | null>(DEFENSE_NODES[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotationAngle = 0;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const height = (canvas.height = 420);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    const render = () => {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Draw Orbit Rings
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Center Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update rotation
      if (isRotating) {
        rotationAngle += 0.008;
      }

      // Draw Nodes
      DEFENSE_NODES.forEach((node) => {
        const theta = node.angle + rotationAngle;
        const x = centerX + Math.cos(theta) * radius;
        const y = centerY + Math.sin(theta) * (radius * 0.45) + node.pitch * 35;
        const scale = 0.8 + (Math.sin(theta) + 1) * 0.3;

        // Link line to center
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node sphere
        ctx.beginPath();
        ctx.arc(x, y, 9 * scale, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '10px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.split(' ')[0], x, y + 18 * scale);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isRotating]);

  return (
    <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/20 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase">
          <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Multiverse Defense Panorama (Phase 15)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRotating((prev) => !prev)}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
          >
            {isRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isRotating ? 'Pause Orbit' : 'Resume Orbit'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full rounded-xl overflow-hidden border border-cyan-500/30 bg-[#02050f] shadow-inner">
        <canvas ref={canvasRef} className="w-full h-96 block" />
      </div>

      {/* Node Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-[10px]">
        {DEFENSE_NODES.map((node) => (
          <button
            key={node.name}
            type="button"
            onClick={() => {
              playTone(600, 0.03);
              setSelectedNode(node);
            }}
            className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
              selectedNode?.name === node.name
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm'
                : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <span className="block font-bold truncate">{node.name.split(' ')[0]}</span>
            <span className="text-[9px] text-slate-500 block truncate">{node.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MultiverseDefensePanorama;
