import { useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

export type JsQrCode = NonNullable<ReturnType<typeof jsQR>>;

export interface JsQrCameraOptions {
  /**
   * Selection of camera facing mode ('environment' for back camera, 'user' for front camera).
   * @default 'environment'
   */
  facingMode?: 'environment' | 'user';
  /**
   * Frame rate throttling limit (Frames Per Second) to optimize CPU/GPU rendering cycle.
   * @default 12
   */
  fps?: number;
  /**
   * Callback invoked on every frame scan pass.
   * Sends parsed payload string and full QRCode object if detected, or null if no code found.
   */
  onScan: (data: string | null, code: JsQrCode | null) => void;
  /**
   * Error handler for camera permissions, MediaDevices availability, or stream failures.
   */
  onError?: (error: string) => void;
}

export interface JsQrCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
}

/**
 * Custom React 19 Hook for High-Performance, Zero-Memory-Leak QR Code Scanning via HTML5 Video/Canvas & jsQR Engine.
 * Built for ZYRQUEN Ω∞ Sovereign Kernel v4.16 (v1.2 LTS).
 */
export const useJsQrCamera = ({
  facingMode = 'environment',
  fps = 12,
  onScan,
  onError,
}: JsQrCameraOptions): JsQrCameraReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Safely stop video stream tracks and cancel animation frame queue
  const stopScanning = useCallback(() => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Frame processing loop using requestAnimationFrame with FPS throttling
  const tick = useCallback(
    (time: number) => {
      const interval = 1000 / fps;
      const delta = time - lastScanTimeRef.current;

      if (delta >= interval) {
        lastScanTimeRef.current = time - (delta % interval);

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
          video &&
          canvas &&
          video.readyState === video.HAVE_ENOUGH_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              onScan(code.data, code);
            } else {
              onScan(null, null);
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    },
    [fps, onScan]
  );

  // Initialize camera stream and start requestAnimationFrame loop
  const startScanning = useCallback(async () => {
    stopScanning();

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API (getUserMedia) is not supported in this browser environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Camera access denied or unknown initialization error.';
      onError?.(errorMessage);
    }
  }, [facingMode, stopScanning, tick, onError]);

  // Clean up stream and animation frame on unmount or options change
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
  };
};
