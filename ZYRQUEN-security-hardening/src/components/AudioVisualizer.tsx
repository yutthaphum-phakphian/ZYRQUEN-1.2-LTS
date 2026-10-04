import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isListening: boolean;
  stream: MediaStream | null;
  barCount?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  stream,
  barCount = 36,
  height = 56,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isListening) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // ignore
        }
        audioContextRef.current = null;
      }
      // Clear canvas to flat idle line
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    if (stream) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (err) {
        console.warn('Could not initialize microphone analyser:', err);
      }
    }

    let phase = 0;

    const render = () => {
      if (!isListening) return;

      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
      }

      const totalBars = barCount;
      const barSpacing = 3;
      const totalSpacing = (totalBars - 1) * barSpacing;
      const barWidth = Math.max(3, (width - totalSpacing) / totalBars);

      phase += 0.05;

      for (let i = 0; i < totalBars; i++) {
        let value = 0;

        if (dataArray && analyser) {
          // Map index to frequency bin
          const binIndex = Math.floor((i / totalBars) * dataArray.length * 0.7);
          value = dataArray[binIndex] / 255;
        } else {
          // Visual initialization indicator only; never used as audio evidence
          value = 0.25 + 0.45 * Math.sin(phase + (i / totalBars) * Math.PI * 2);
        }

        // Add minimum baseline height so bars are always visible during listening
        const minHeight = 4;
        const barHeight = Math.max(minHeight, value * (h - 8));
        const x = i * (barWidth + barSpacing);
        const y = (h - barHeight) / 2; // Center-aligned vertically

        // Create glowing vertical gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#22d3ee'); // Cyan
        gradient.addColorStop(0.5, '#818cf8'); // Indigo
        gradient.addColorStop(1, '#ec4899'); // Pink

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Rounded bar capsule
        const radius = barWidth / 2;
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [isListening, stream, barCount]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden py-1">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full max-w-sm h-12 rounded-lg"
      />
    </div>
  );
};
