import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  entropy: number;
  baseColor: string;
}

export const SubKelvinNebula: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    
    // Support retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        for (let entry of entries) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
        }
      });
    });
    resizeObserver.observe(containerRef.current);

    const numParticles = 800;
    const particles: Particle[] = Array.from({ length: numParticles }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 800,
      z: (Math.random() - 0.5) * 800,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: Math.random() * 2 + 0.5,
      entropy: Math.random(),
      baseColor: Math.random() > 0.5 ? '#06b6d4' : '#8b5cf6', // cyan & violet
    }));

    let time = 0;
    let cameraZ = 600;

    const timer = d3.timer((elapsed) => {
      time = elapsed * 0.001; // seconds

      ctx.clearRect(0, 0, width, height);

      // Add a subtle dark blue/cyan background gradient
      const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      bgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const fov = 300;
      
      // Sort for pseudo depth sorting
      particles.sort((a, b) => b.z - a.z);

      // Noise perturbation parameters
      const noiseFreq = 0.005;
      const noiseAmp = 0.5;
      
      particles.forEach((p) => {
        // Procedural vortex movement using D3 math logic
        const angle = Math.atan2(p.y, p.x);
        const dist = Math.sqrt(p.x * p.x + p.y * p.y);
        
        // Swirl force
        const forceX = -Math.sin(angle) * dist * 0.001;
        const forceY = Math.cos(angle) * dist * 0.001;
        const forceZ = Math.sin(time + p.x * noiseFreq) * noiseAmp;

        // Gravity to center
        const gravity = -0.001;
        
        p.vx += forceX + p.x * gravity + (Math.random() - 0.5) * p.entropy;
        p.vy += forceY + p.y * gravity + (Math.random() - 0.5) * p.entropy;
        p.vz += forceZ + p.z * gravity;

        // Friction
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.vz *= 0.95;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Entropy fluctuation
        p.entropy = Math.abs(Math.sin(time * 2 + p.id));

        // 3D to 2D Projection
        const scale = fov / (fov + p.z + cameraZ);
        const projX = (p.x * scale) + width / 2;
        const projY = (p.y * scale) + height / 2;

        if (scale > 0 && projX > 0 && projX < width && projY > 0 && projY < height) {
          const r = p.radius * scale;
          const alpha = Math.min(1, Math.max(0, scale * 1.5 * p.entropy));
          
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(0.1, r), 0, Math.PI * 2);
          
          // Glow effect for high entropy particles
          if (p.entropy > 0.8) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.baseColor;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillStyle = p.baseColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
          
          // Simple color alpha parsing hack - rely on hex to rgba conversion
          const hexToRgba = (hex: string, a: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${a})`;
          };

          ctx.fillStyle = hexToRgba(p.baseColor, alpha);
          ctx.fill();
        }
      });
      
      // Rotate camera gently
      cameraZ = 600 + Math.sin(time * 0.5) * 200;

    });

    return () => {
      timer.stop();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] rounded-[24px] border-cyan-500/20 bg-[#070914]/80 shadow-inner relative overflow-hidden flex flex-col items-center justify-center"
    >
      <div className="absolute top-4 left-6 z-10 font-mono text-xs text-cyan-400 flex items-center gap-2 drop-shadow-md">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>Sub-Kelvin 3D Entropy Flux (D3 Procedural Nebula)</span>
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
    </div>
  );
};
