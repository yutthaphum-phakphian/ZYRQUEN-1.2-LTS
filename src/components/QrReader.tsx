import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, Loader2, Trash2, Copy, Check, ScanLine, Clock, ShieldCheck } from 'lucide-react';

export interface ScannedRecord {
  id: string;
  text: string;
  timestamp: string;
  scannedAt: number;
}

export interface QrReaderProps {
  onResult?: (result: { getText: () => string } | null, error: any) => void;
  constraints?: MediaTrackConstraints;
  className?: string;
  containerStyle?: React.CSSProperties;
  videoContainerStyle?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
  showHistory?: boolean;
  showStatusIndicator?: boolean;
  maxHistoryItems?: number;
}

export const QrReader: React.FC<QrReaderProps> = ({
  onResult,
  constraints = { facingMode: 'environment' },
  className = '',
  containerStyle,
  videoContainerStyle,
  videoStyle,
  showHistory = true,
  showStatusIndicator = true,
  maxHistoryItems = 5,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedTextRef = useRef<string>('');

  const [cameraStatus, setCameraStatus] = useState<'initializing' | 'active' | 'denied' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScannedRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleClearHistory = useCallback(() => {
    setScanHistory([]);
    lastScannedTextRef.current = '';
  }, []);

  const handleCopyText = useCallback((id: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  }, []);

  useEffect(() => {
    let active = true;
    setCameraStatus('initializing');
    setErrorMessage(null);

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (active) {
          setCameraStatus('error');
          setErrorMessage('Camera access not supported in this browser/environment');
          onResult?.(null, new Error('Camera access not supported'));
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
        if (active) {
          setCameraStatus('active');
          setErrorMessage(null);
        }
      } catch (err: any) {
        if (active) {
          const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
          setCameraStatus(isDenied ? 'denied' : 'error');
          setErrorMessage(err?.message || 'Unable to access camera feed');
          onResult?.(null, err);
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
            const now = Date.now();
            const rawText = code.data.trim();

            // Notify parent
            onResult?.({ getText: () => rawText }, null);

            // De-duplicate rapid consecutive reads within 1.5 seconds
            if (rawText !== lastScannedTextRef.current || now - lastScanTimestampRef.current > 1500) {
              lastScannedTextRef.current = rawText;
              lastScanTimestampRef.current = now;

              const newRecord: ScannedRecord = {
                id: `qr-${now}-${Math.random().toString(36).substring(2, 6)}`,
                text: rawText,
                timestamp: new Date(now).toLocaleTimeString('th-TH', { hour12: false }),
                scannedAt: now,
              };

              setScanHistory((prev) => [newRecord, ...prev.filter((p) => p.text !== rawText)].slice(0, maxHistoryItems));
            }
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
  }, [constraints, onResult, maxHistoryItems]);

  return (
    <div
      style={{ position: 'relative', width: '100%', ...containerStyle }}
      className={`flex flex-col space-y-3 font-mono ${className}`}
    >
      {/* Video Viewport Container */}
      <div
        style={{ position: 'relative', width: '100%', overflow: 'hidden', ...videoContainerStyle }}
        className="rounded-lg border border-slate-700/80 bg-slate-950 shadow-inner group"
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', ...videoStyle }}
          className="block"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Dynamic Status Indicator Overlay */}
        {showStatusIndicator && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border transition-all duration-300">
            {cameraStatus === 'active' && (
              <div className="flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-950/70">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Camera className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[11px] tracking-wide">Scanner Active</span>
              </div>
            )}

            {cameraStatus === 'initializing' && (
              <div className="flex items-center gap-1.5 text-amber-400 border-amber-500/30 bg-amber-950/70">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="text-[11px] tracking-wide">Initializing Lens...</span>
              </div>
            )}

            {(cameraStatus === 'denied' || cameraStatus === 'error') && (
              <div className="flex items-center gap-1.5 text-rose-400 border-rose-500/30 bg-rose-950/80">
                <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] tracking-wide">
                  {cameraStatus === 'denied' ? 'Permission Denied' : 'Camera Offline'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Viewfinder Target Reticle */}
        {cameraStatus === 'active' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 border-2 border-emerald-500/40 rounded-lg">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5" />
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent animate-pulse" />
            </div>
          </div>
        )}

        {/* Error State Body if Camera Fails */}
        {(cameraStatus === 'denied' || cameraStatus === 'error') && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 backdrop-blur-sm space-y-2">
            <CameraOff className="w-8 h-8 text-rose-400 animate-bounce" />
            <p className="text-xs text-rose-300 font-medium max-w-xs">
              {errorMessage || 'Camera access is required to scan physical and cryptographic QR seals.'}
            </p>
            <p className="text-[10px] text-slate-500">
              Please grant camera permissions in your browser or device settings.
            </p>
          </div>
        )}
      </div>

      {/* Local Session Scan History Panel (Last 5 Scans) */}
      {showHistory && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-2">
              <ScanLine className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Recent Session Scans</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                {scanHistory.length}/{maxHistoryItems}
              </span>
            </div>

            {scanHistory.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                title="Clear local scan session history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Log</span>
              </button>
            )}
          </div>

          {scanHistory.length === 0 ? (
            <div className="py-3 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 opacity-50" />
              <span>No QR codes scanned in this session yet.</span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
              {scanHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800/60 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="flex items-center justify-center w-4 h-4 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 text-[9px] font-bold">
                      #{index + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{item.timestamp}</span>
                    <span
                      className="truncate text-[11px] text-slate-200 font-mono"
                      title={item.text}
                    >
                      {item.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.text.includes('0x') && (
                      <span className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/30">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Seal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyText(item.id, item.text)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
                      title="Copy scanned text"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QrReader;
