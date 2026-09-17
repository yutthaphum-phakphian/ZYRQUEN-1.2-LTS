import React, { useEffect, useRef } from 'react';
import { Sparkles, Maximize2, RefreshCw } from 'lucide-react';
import { CANONICAL_CONSTANTS, SATELLITE_NODES } from '../data/sovereignData.ts';

export const QuantumVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    const resize = () => {
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || 600;
        canvas.height = 360;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!ctx || !canvas) return;

      ctx.fillStyle = '#040711';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
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

      // Draw Orbitals (Ω601–Ω1000 Sovereign Boundaries)
      const orbits = [70, 110, 150];
      orbits.forEach((radius, idx) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 - idx * 0.03})`;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw 10-point HSM Deca-Key constellation nodes
      const hsmCount = 10;
      const hsmRadius = 110;
      for (let i = 0; i < hsmCount; i++) {
        const theta = angle + (i * Math.PI * 2) / hsmCount;
        const x = centerX + Math.cos(theta) * hsmRadius;
        const y = centerY + Math.sin(theta) * hsmRadius;

        // Node line to center
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.stroke();

        // Node point
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.stroke();
      }

      // Draw Global Satellite Mesh (6 nodes)
      const satCount = SATELLITE_NODES.length;
      const satRadius = 150;
      for (let i = 0; i < satCount; i++) {
        const theta = -angle * 0.6 + (i * Math.PI * 2) / satCount;
        const x = centerX + Math.cos(theta) * satRadius;
        const y = centerY + Math.sin(theta) * satRadius;

        // Satellite icon/point
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        // Label
        ctx.font = '10px "Fira Code", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(SATELLITE_NODES[i].code, x + 8, y + 3);
      }

      // Draw Merkle Root Core (Center Node)
      const corePulse = 18 + Math.sin(angle * 4) * 3;
      const grad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, corePulse * 2);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
      grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();

      // Core text
      ctx.font = 'bold 11px "Cinzel", serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ω∞', centerX, centerY);

      angle += 0.008;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#040711] shadow-inner">
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sovereign Quantum Lattice (400T • Ω601–Ω1000)</span>
        </span>
        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800">
          60.0 FPS • REAL-TIME
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 text-xs">
        <span className="bg-slate-950/80 px-2 py-1 rounded text-slate-400 font-mono-code text-[11px] border border-slate-800">
          Deca Quorum: 10/10 Live
        </span>
      </div>

      <canvas ref={canvasRef} className="w-full block" />

      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded border border-slate-800/80 font-mono-code">
        <div>
          <span className="text-slate-500">Genesis Merkle Anchor: </span>
          <span className="text-cyan-300 font-semibold">{CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT.substring(0, 16)}...</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-emerald-400">● 6 Global Satellites Synced</span>
          <span className="text-sky-300">● T₁: {CANONICAL_CONSTANTS.QUBIT_COHERENCE_T1}</span>
        </div>
      </div>
    </div>
  );
};
