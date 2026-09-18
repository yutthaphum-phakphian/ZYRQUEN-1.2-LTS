import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface UseJsQrCameraOptions {
  enabled: boolean;
  facingMode: 'environment' | 'user';
  onDetected: (payload: string) => void;
  scanIntervalMs?: number;
}

export function useJsQrCamera({
  enabled,
  facingMode,
  onDetected,
  scanIntervalMs = 180,
}: UseJsQrCameraOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastPayloadRef = useRef<string>('');
  const lastScanAtRef = useRef<number>(0);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setIsReady(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      frameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const now = performance.now();

    if (now - lastScanAtRef.current >= scanIntervalMs) {
      lastScanAtRef.current = now;

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (width > 0 && height > 0) {
        const maxWidth = 960;
        const scale = Math.min(1, maxWidth / width);
        const targetWidth = Math.floor(width * scale);
        const targetHeight = Math.floor(height * scale);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (context) {
          context.drawImage(video, 0, 0, targetWidth, targetHeight);

          const imageData = context.getImageData(
            0,
            0,
            targetWidth,
            targetHeight,
          );

          const code = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: 'attemptBoth',
            },
          );

          if (code?.data && code.data !== lastPayloadRef.current) {
            lastPayloadRef.current = code.data;
            onDetected(code.data);
          }
        }
      }
    }

    frameRef.current = requestAnimationFrame(scanFrame);
  }, [onDetected, scanIntervalMs]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!enabled) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported by this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      setIsReady(true);
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      const err = error as DOMException;

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera access was denied. Please allow camera permission or use image upload.',
        );
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera was found on this device.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is already being used by another application.');
      } else {
        setCameraError(`Unable to start camera: ${err.message || String(err)}`);
      }
    }
  }, [enabled, facingMode, scanFrame, stopCamera]);

  useEffect(() => {
    void startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const resetPayloadGuard = useCallback(() => {
    lastPayloadRef.current = '';
  }, []);

  return {
    videoRef,
    canvasRef,
    cameraError,
    isReady,
    stopCamera,
    startCamera,
    resetPayloadGuard,
  };
}