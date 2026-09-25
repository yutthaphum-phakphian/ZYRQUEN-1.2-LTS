import React, { useEffect, useRef } from 'react';
import { getHarmonicCarrierSnapshot } from './AudioSynthesizer';

export const AudioWaveform: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const render = () => {
      const snapshot = getHarmonicCarrierSnapshot();
      const data = snapshot.waveform;
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      if (!snapshot.isActive || data.length === 0) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.beginPath();
        const sliceWidth = width / (data.length - 1);
        let x = 0;
        
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          const y = height / 2 + (v * height / 2);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          x += sliceWidth;
        }
        
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full h-16 bg-black/40 rounded-xl border-white/5 relative overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} width={300} height={60} className="w-full h-full opacity-80 mix-blend-screen" />
    </div>
  );
};
