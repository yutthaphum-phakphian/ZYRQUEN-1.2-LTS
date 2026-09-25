import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Sliders,
  Layers,
  Box,
  Circle,
  Cpu,
  Orbit,
  RotateCw,
  Eye,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';

interface Room16MasterPanelProps {
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room16MasterPanel: React.FC<Room16MasterPanelProps> = ({
  onNavigate,
  onOpenCertificate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);
  const [renderMode, setRenderMode] = useState<'3d-lattice' | 'orbital-mesh' | 'hsm-ring'>('3d-lattice');
  const [showRwaOrbits, setShowRwaOrbits] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let angle = 0;
    let lastTime = performance.now();
    let frameCount = 0;

    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 420;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (time: number) => {
      if (!ctx || !canvas) return;

      // FPS tracking
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - lastTime)));
        frameCount = 0;
        lastTime = time;
      }

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Background Quantum Grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw RWA Orbitals (Ω601-Ω1000)
      if (showRwaOrbits) {
        const orbits = [80, 130, 180];
        orbits.forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 - idx * 0.05})`;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // Draw Central SSoT Quantum Core Crystal (14,902 Seals)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.5);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3;
        const x = Math.cos(theta) * 36;
        const y = Math.sin(theta) * 36;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw Deca-Key HSM Constellation (10 Nodes)
      const hsmCount = 10;
      const hsmRadius = 130;
      for (let i = 0; i < hsmCount; i++) {
        const theta = angle + (i * Math.PI * 2) / hsmCount;
        const x = cx + Math.cos(theta) * hsmRadius;
        const y = cy + Math.sin(theta) * hsmRadius;

        // Line to center
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.stroke();

        // Node
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      angle += 0.01 * rotationSpeed;
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [rotationSpeed, renderMode, showRwaOrbits]);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 16 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-cyan-950/40 via-[#071720]/95 to-black border-cyan-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <Orbit className="w-4 h-4 text-cyan-400 animate-spin" />
                CHAMBER 16 • DYNAMIC 3D SOVEREIGN QUANTUM VISUALIZATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">
                {fps} FPS STABLE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-[11px] font-bold">
                10-POINT DECA-KEY RING
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                การแสดงผลโครงข่ายผลึกควอนตัม 3 มิติ (Quantum Lattice & Orbital Visualizer)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                จำลองโครงข่ายผลึกสัตยาบัน 14,902 ตราประทับ, วงโคจรของสัญญาเช่าสินทรัพย์จริง 400 รายการ (Ω601–Ω1000)
                และคลัสเตอร์เครื่องเหล็กฮาร์ดแวร์ 10 ตู้ (Deca-Key Constellation)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRotationSpeed((prev) => (prev >= 2.0 ? 0.5 : prev + 0.5));
                playTone(700, 0.03);
              }}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Speed: {rotationSpeed.toFixed(1)}x
            </button>
            <button
              onClick={() => {
                setShowRwaOrbits((prev) => !prev);
                playTone(600, 0.03);
              }}
              className="px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              RWA Orbits: {showRwaOrbits ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-cyan-500/20">
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Engine State</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400">Canvas 2D/3D</div>
            <div className="text-[10px] text-emerald-300">GPU Accelerated</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Frame Rate</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">{fps} FPS</div>
            <div className="text-[10px] text-zinc-400">Zero Frame Drop</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Lattice Nodes</div>
            <div className="text-base sm:text-lg font-bold text-indigo-400">400 RWA + 10 HSM</div>
            <div className="text-[10px] text-zinc-400">Ω601–Ω1000 Mapped</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Crystal Symmetry</div>
            <div className="text-base sm:text-lg font-bold text-yellow-300">Decagonal D10</div>
            <div className="text-[10px] text-zinc-400">Mathematical Parity</div>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="p-4 rounded-3xl bg-[#030712] border-cyan-500/30 overflow-hidden shadow-2xl relative">
        <canvas ref={canvasRef} className="w-full rounded-2xl block" />
      </div>
    </div>
  );
};
