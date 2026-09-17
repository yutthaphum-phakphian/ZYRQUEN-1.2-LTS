import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Sparkles } from 'lucide-react';

export const EntropyFluxNebula: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entropyLevel, setEntropyLevel] = useState(50);

  useEffect(() => {
    const interval = setInterval(() => {
      setEntropyLevel(prev => Math.max(20, Math.min(100, prev + (Math.random() * 20 - 10))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const canvas = d3.select(canvasRef.current)
      .attr('width', width * window.devicePixelRatio)
      .attr('height', height * window.devicePixelRatio)
      .style('width', `${width}px`)
      .style('height', `${height}px`)
      .node();

    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const numParticles = 250;
    const particles = Array.from({ length: numParticles }, () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * width,
      radius: Math.random() * 2 + 0.5,
      hue: Math.random() > 0.5 ? 190 : 280,
    }));

    const timer = d3.timer((elapsed) => {
      ctx.fillStyle = 'rgba(7, 9, 20, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const fov = 300;
      const speedMultiplier = (entropyLevel / 50);

      ctx.lineWidth = 0.5;
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        
        p.z -= speedMultiplier;
        p.x += Math.sin(elapsed * 0.001 + p.y * 0.01) * speedMultiplier;
        p.y += Math.cos(elapsed * 0.001 + p.x * 0.01) * speedMultiplier;

        if (p.z < 1) p.z = width;
        if (p.x > width / 2) p.x = -width / 2;
        if (p.x < -width / 2) p.x = width / 2;
        if (p.y > height / 2) p.y = -height / 2;
        if (p.y < -height / 2) p.y = height / 2;

        const scale = fov / (fov + p.z);
        const x2d = (p.x * scale) + width / 2;
        const y2d = (p.y * scale) + height / 2;

        ctx.beginPath();
        ctx.arc(x2d, y2d, p.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${scale})`;
        ctx.fill();

        if (i % 3 === 0) {
           for (let j = i + 1; j < numParticles; j += Math.floor(numParticles / 10)) {
             const p2 = particles[j];
             const dx = p.x - p2.x;
             const dy = p.y - p2.y;
             const dz = p.z - p2.z;
             const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
             if (dist < 100) {
               const scale2 = fov / (fov + p2.z);
               const x2d2 = (p2.x * scale2) + width / 2;
               const y2d2 = (p2.y * scale2) + height / 2;
               
               ctx.beginPath();
               ctx.moveTo(x2d, y2d);
               ctx.lineTo(x2d2, y2d2);
               ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${scale * 0.2 * (1 - dist/100)})`;
               ctx.stroke();
             }
           }
        }
      }
    });

    return () => timer.stop();
  }, [entropyLevel]);

  return (
    <div className="w-full h-full min-h-[350px] bg-gradient-to-br from-[#070914]/90 via-[#0b0e1e]/80 to-[#070914]/90 border border-cyan-500/20 shadow-[0_8px_30px_-10px_rgba(6,182,212,0.15)] backdrop-blur-2xl rounded-[28px] p-6 flex flex-col relative overflow-hidden">
      <div className="relative z-10 flex items-center justify-between mb-4 pointer-events-none">
        <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-indigo-300 font-mono tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          ENTROPY FLUX NEBULA
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-cyan-300">
            FLUX RATE: {(entropyLevel * 10).toFixed(0)} E/s
          </span>
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30">
            PROCEDURAL D3
          </span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 absolute inset-0">
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" style={{ mixBlendMode: 'screen' }} />
      </div>
      
      <div className="absolute bottom-6 right-6 z-10 p-4 rounded-2xl bg-[#070914]/80 border border-white/10 backdrop-blur-md pointer-events-none w-64 shadow-2xl">
        <div className="flex justify-between items-end mb-2">
           <span className="text-xs text-zinc-400 font-mono">Sub-Kelvin State</span>
           <span className="text-sm font-bold text-white font-mono">{entropyLevel.toFixed(1)}%</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
           <div 
             className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
             style={{ width: `${entropyLevel}%` }}
           />
        </div>
      </div>
    </div>
  );
};
