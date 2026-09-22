import React, { useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export interface QrReaderProps {
  onResult?: (result: { getText: () => string } | null, error: any) => void;
  constraints?: MediaTrackConstraints;
  className?: string;
  containerStyle?: React.CSSProperties;
  videoContainerStyle?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
}

export const QrReader: React.FC<QrReaderProps> = ({
  onResult,
  constraints = { facingMode: 'environment' },
  className = '',
  containerStyle,
  videoContainerStyle,
  videoStyle,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (active && onResult) {
          onResult(null, new Error('Camera access not supported in this environment'));
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (active && onResult) {
          onResult(null, err);
        }
      }
    }

    startCamera();

    const scanFrame = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            onResult?.({ getText: () => code.data }, null);
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [constraints, onResult]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...containerStyle }} className={className}>
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...videoContainerStyle }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', ...videoStyle }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default QrReader;
