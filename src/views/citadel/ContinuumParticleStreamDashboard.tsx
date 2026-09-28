/**
 * ZYRQUEN Ω∞ Continuum Particle Stream Dashboard (Phase 13)
 * Real-time Holographic Continuum Particle Stream for Verification & Recovery Events
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity, ShieldCheck, Flame, RefreshCw } from 'lucide-react';
import { playTone } from '../../components/AudioSynthesizer';
import { SYSTEM_METADATA } from '../../data/canonicalData';

export const ContinuumParticleStreamDashboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particleCount, setParticleCount] = useState<number>(64);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const height = (canvas.height = 360);

    const colors = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#38bdf8'];

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.8 * speedMultiplier,
      vy: (Math.random() - 0.5) * 1.8 * speedMultiplier,
      radius: Math.random() * 2.5 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI,
    }));

    const render = () => {
      ctx.fillStyle = 'rgba(4, 8, 20, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw faint connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 70) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.15 * (1 - dist / 70)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.05;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const currentRadius = p.radius + Math.sin(p.pulse) * 0.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [particleCount, speedMultiplier]);

  return (
    <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/20 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Continuum Particle Stream Dashboard (Phase 13)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
            14,902 SEALS STREAMING
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative w-full rounded-xl overflow-hidden border border-cyan-500/30 bg-[#02050f] shadow-inner">
        <canvas ref={canvasRef} className="w-full h-80 block" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-black/70 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Realtime Quantum Invariant Flow • Block #{SYSTEM_METADATA.genesisBlock}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between font-mono text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <span>Particles:</span>
          <button
            type="button"
            onClick={() => {
              playTone(600, 0.03);
              setParticleCount((prev) => (prev === 64 ? 128 : prev === 128 ? 32 : 64));
            }}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-500 transition-colors"
          >
            {particleCount} Units
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>Flow Rate:</span>
          <button
            type="button"
            onClick={() => {
              playTone(750, 0.03);
              setSpeedMultiplier((prev) => (prev === 1 ? 1.8 : prev === 1.8 ? 0.5 : 1));
            }}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-violet-300 hover:border-violet-500 transition-colors"
          >
            {speedMultiplier}x Velocity
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContinuumParticleStreamDashboard;
