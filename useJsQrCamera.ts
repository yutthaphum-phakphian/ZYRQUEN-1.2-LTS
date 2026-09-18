import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface UseJsQrCameraOptions {
  enabled: boolean;
  facingMode?: 'environment' | 'user';
  onDetected: (payload: string) => void;
  scanIntervalMs?: number;
}

export function useJsQrCamera({
  enabled,
  facingMode = 'environment',
  onDetected,
  scanIntervalMs = 180,
}: UseJsQrCameraOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastPayloadRef = useRef('');
  const lastScanAtRef = useRef(0);
  const onDetectedRef = useRef(onDetected);
  const scanFrameRef = useRef<() => void>(() => undefined);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setIsReady(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      frameRef.current = requestAnimationFrame(() => scanFrameRef.current());
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const now = performance.now();
      if (now - lastScanAtRef.current >= scanIntervalMs) {
        lastScanAtRef.current = now;
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;

        if (sourceWidth > 0 && sourceHeight > 0) {
          const scale = Math.min(1, 960 / sourceWidth);
          const width = Math.max(1, Math.floor(sourceWidth * scale));
          const height = Math.max(1, Math.floor(sourceHeight * scale));

          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (context) {
            context.drawImage(video, 0, 0, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, width, height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code?.data && code.data !== lastPayloadRef.current) {
              lastPayloadRef.current = code.data;
              onDetectedRef.current(code.data);
            }
          }
        }
      }
    }

    frameRef.current = requestAnimationFrame(() => scanFrameRef.current());
  }, [scanIntervalMs]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    lastPayloadRef.current = '';

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
      frameRef.current = requestAnimationFrame(() => scanFrameRef.current());
    } catch (error) {
      const err = error as DOMException;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permission or use image upload.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera was found on this device.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is already being used by another application.');
      } else {
        setCameraError(`Unable to start camera: ${err.message || String(err)}`);
      }
    }
  }, [enabled, facingMode, stopCamera]);

  useEffect(() => {
    void startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  const resetPayloadGuard = useCallback(() => {
    lastPayloadRef.current = '';
  }, []);

  return {
    videoRef,
    canvasRef,
    cameraError,
    isReady,
    startCamera,
    stopCamera,
    resetPayloadGuard,
  };
}
