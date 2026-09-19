import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Scan,
  Camera,
  Upload,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Lock,
  X,
  Fingerprint,
  FileCode,
  Download,
  Layers,
  Cpu,
  History,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import jsQR from 'jsqr';
import {
  HARDWARE_SEALS_LEDGER,
  verifyHardwareSealAgainstLedger,
  SealVerificationResult,
  HardwareSealRecord,
  CANONICAL_BLOCK_HEIGHT,
  GENESIS_MERKLE_ROOT,
} from '../../data/hardwareSealsData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { SystemEvent } from '../SystemEventsSidebar';

export interface HardwareSealQRScannerProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
  onVerificationSuccess?: (result: SealVerificationResult) => void;
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void;
}

export const HardwareSealQRScanner: React.FC<HardwareSealQRScannerProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
  onVerificationSuccess,
  onAddSystemEvent,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedPayload, setScannedPayload] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<SealVerificationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Scan History
  const [verificationHistory, setVerificationHistory] = useState<SealVerificationResult[]>(() => {
    try {
      const saved = localStorage.getItem('zyrquen_hardware_seal_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    // Default initial verified record from genesis
    const genesisResult = verifyHardwareSealAgainstLedger(HARDWARE_SEALS_LEDGER[0].qrPayload);
    return [genesisResult];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize scanner when opened
  useEffect(() => {
    if (isOpen) {
      setCameraActive(true);
      setCameraError(null);
    } else {
      setCameraActive(false);
    }
  }, [isOpen]);

  const handleProcessPayload = (payload: string) => {
    if (!payload || !payload.trim()) return;
    setIsProcessing(true);
    setScannedPayload(payload);

    try {
      const result = verifyHardwareSealAgainstLedger(payload);
      setVerificationResult(result);

      if (result.status === 'VERIFIED_INTACT') {
        playAuditChime();
        if (onVerificationSuccess) onVerificationSuccess(result);
        if (onAddSystemEvent) {
          onAddSystemEvent(
            'CRYPTO',
            `Physical Hardware Seal Verified: ${result.matchedSeal?.hardwareUnit || 'Chassis Unit'}`,
            `Physical seal ${result.matchedSeal?.sealId} matches Digital Ledger Block #${result.ledgerBlockHeight} (0.00% Drift). Provenance intact under ETDA Sec 26/28.`,
            result.matchedSeal?.merkleLeafHash.slice(0, 16),
            'info',
            'ETDA B.E. 2544 มาตรา ๒๖ & ๒๘',
            'security'
          );
        }
      } else if (result.status === 'TAMPER_DETECTED') {
        playTone(320, 0.25);
        if (onAddSystemEvent) {
          onAddSystemEvent(
            'ANOMALY',
            `TAMPER ALERT: Physical Seal Mismatch`,
            `Physical seal hash diverged from Digital Ledger leaf for ${result.matchedSeal?.hardwareUnit || 'hardware'}. Immediate fail-closed quarantine engaged.`,
            '0xTAMPER_ALERT',
            'critical',
            'PDPA Sec 39 & ETDA Sec 28 Tamper Penalty',
            'security'
          );
        }
      } else {
        playTone(440, 0.15);
      }

      // Update history
      setVerificationHistory((prev) => {
        const next = [result, ...prev.filter((p) => p.scannedPayload !== result.scannedPayload)].slice(0, 15);
        try {
          localStorage.setItem('zyrquen_hardware_seal_history', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    } catch (err: any) {
      console.error('Hardware seal verification failed:', err);
      setCameraError('Verification algorithm failed: ' + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  // Callback from react-qr-reader
  const handleQrResult = (result: any | null | undefined, error: any | null | undefined) => {
    if (result) {
      const text = typeof result === 'string' ? result : result?.getText?.() || result?.text;
      if (text && text !== scannedPayload) {
        playTone(880, 0.06);
        setCameraActive(false);
        handleProcessPayload(text);
      }
    }
    if (error) {
      const msg = error?.message || String(error);
      if (
        !msg.includes('No QR code found') &&
        !msg.includes('NotFoundException') &&
        !msg.includes('IndexSizeError')
      ) {
        // Only log serious camera access errors
        if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
          setCameraError('Camera access denied. Please grant camera permission or use image upload.');
        }
      }
    }
  };

  // Handle image upload with jsQR
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setCameraError('Could not create canvas context for QR decoding.');
            setIsProcessing(false);
            return;
          }
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            playTone(880, 0.08);
            handleProcessPayload(code.data);
          } else {
            setCameraError('No QR Code detected in the uploaded image. Ensure the hardware seal QR is clear and well-lit.');
          }
        } catch (decodeErr: any) {
          setCameraError('Failed to decode image: ' + (decodeErr.message || String(decodeErr)));
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setCameraError('Failed to load selected image file.');
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, key: string) => {
    safeCopyToClipboard(text).then((success) => {
      if (success) {
        setCopiedField(key);
        playTone(920, 0.04);
        setTimeout(() => setCopiedField(null), 2500);
      }
    });
  };

  const handleExportJson = () => {
    if (!verificationResult) return;
    const blob = new Blob([JSON.stringify(verificationResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hardware-seal-verification-${verificationResult.matchedSeal?.sealId || 'receipt'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playTone(740, 0.05);
  };

  const content = (
    <div className="space-y-6 font-mono text-xs">
      {/* Scanner Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c1024] via-[#070914] to-[#04060c] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold tracking-wider">
                PHYSICAL TAMPER-EVIDENT SEALS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold tracking-wider">
                FIPS 140-3 LEVEL 4
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold tracking-wider">
                BLOCK #{CANONICAL_BLOCK_HEIGHT} MERKLE ANCHOR
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
              <QrCode className="w-6 h-6 text-cyan-400" />
              <span>Hardware Seal QR Scanner &amp; Ledger Verifier</span>
            </h2>
            <p className="text-zinc-400 text-xs max-w-3xl leading-relaxed">
              สแกน QR Code บนซีลฮาร์ดแวร์กายภาพ (Utimaco HSM, ตู้แช่แข็ง Sub-Kelvin Chamber 14, ชิป TPM 2.0)
              เพื่อตรวจสอบความถูกต้องแบบเรียลไทม์เทียบกับ Single Source of Truth (SSoT) และ Merkle Root ในบัญชีแยกประเภทดิจิทัล
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                title="Close Scanner"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#070914] p-1.5 rounded-2xl border border-cyan-500/20">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setActiveMode('camera');
              setCameraActive(true);
              setCameraError(null);
              playTone(600, 0.04);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
              activeMode === 'camera'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('upload');
              setCameraActive(false);
              playTone(640, 0.04);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
              activeMode === 'upload'
                ? 'bg-purple-500/25 text-purple-200 border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Upload Seal Photo</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('samples');
              setCameraActive(false);
              playTone(680, 0.04);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
              activeMode === 'samples'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Sample Hardware Seals ({HARDWARE_SEALS_LEDGER.length})</span>
          </button>
        </div>

        {activeMode === 'camera' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
                playTone(520, 0.04);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[10px] flex items-center gap-1.5"
              title="Switch between front and rear cameras"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Camera: {facingMode === 'environment' ? 'Rear' : 'Front'}</span>
            </button>
            <button
              onClick={() => {
                setCameraActive(!cameraActive);
                playTone(cameraActive ? 400 : 700, 0.04);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                cameraActive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {cameraActive ? 'Pause Sensor' : 'Resume Sensor'}
            </button>
          </div>
        )}
      </div>

      {/* Camera Scanner View */}
      {activeMode === 'camera' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center">
              {cameraActive ? (
                <div className="w-full h-full relative">
                  <QrReader
                    onResult={handleQrResult}
                    constraints={{ facingMode }}
                    className="w-full h-full object-cover"
                    containerStyle={{ width: '100%', height: '100%' }}
                    videoContainerStyle={{ width: '100%', height: '100%' }}
                  />

                  {/* Optical Reticle & Scanning Animation */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-dashed border-cyan-400/90 rounded-2xl animate-pulse flex items-center justify-center relative shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                      {/* Corner Brackets */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-300 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-300 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-300 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-300 rounded-br-lg" />

                      {/* Moving laser scanline */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-bounce opacity-80" />

                      <div className="text-center px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-[10px] text-cyan-200">
                        ALIGN PHYSICAL HARDWARE SEAL QR
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Camera className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-zinc-400">Optical sensor paused.</p>
                  <button
                    onClick={() => {
                      setCameraActive(true);
                      setCameraError(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-bold"
                  >
                    Start Camera Sensor
                  </button>
                </div>
              )}

              {/* Error overlay */}
              {cameraError && (
                <div className="absolute inset-x-4 bottom-4 p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs backdrop-blur-md flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="flex-1">{cameraError}</span>
                  <button
                    onClick={() => setCameraError(null)}
                    className="p-1 text-rose-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#070914] border border-cyan-500/20 flex items-center justify-between text-zinc-400 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Optical Frame Rate: 30 FPS • Auto-focus: Enabled</span>
              </div>
              <span className="text-zinc-500">ISO 18004 QR Standard</span>
            </div>
          </div>

          {/* Quick Guide & Digital Ledger Anchor */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#070914]/90 border border-cyan-500/20 space-y-3.5">
              <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Digital Ledger Hardware Verification Protocol</span>
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                ทุกอุปกรณ์ความมั่นคงปลอดภัยขั้นสูง (Hardware Security Module) และชิ้นส่วนอธิปไตยได้รับการปิดผนึกด้วยซีลนิรภัย
                VOID-SILVER Holographic ซึ่งมีการสลัก Merkle Leaf และหมายเลขกำกับในบัญชีแยกประเภท
              </p>
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Canonical Block:</span>
                  <span className="text-cyan-300 font-bold">#{CANONICAL_BLOCK_HEIGHT}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Genesis Merkle Root:</span>
                  <span className="text-zinc-300 font-mono">{GENESIS_MERKLE_ROOT.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Registered Hardware Units:</span>
                  <span className="text-emerald-400 font-bold">{HARDWARE_SEALS_LEDGER.length} Physical Enclosures</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Admissibility Statute:</span>
                  <span className="text-amber-300">ETDA B.E. 2544 มาตรา ๙, ๒๖, ๒๘</span>
                </div>
              </div>
            </div>

            {/* Quick-test button using TC-01 Genesis Seal */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Quick Sensor Test</span>
              <button
                onClick={() => handleProcessPayload(HARDWARE_SEALS_LEDGER[0].qrPayload)}
                className="w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all text-left flex items-center justify-between"
              >
                <span>Inject TC-01 Alpha Custodian Seal</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Seal Photo Mode */}
      {activeMode === 'upload' && (
        <div className="space-y-4">
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-4 ${
              dragActive
                ? 'border-purple-400 bg-purple-500/15'
                : 'border-purple-500/30 bg-[#070914]/80 hover:border-purple-400/60 hover:bg-purple-500/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.25)]">
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Drag &amp; Drop or Browse Seal Photo</h3>
              <p className="text-zinc-400 text-xs">
                Supports PNG, JPEG, WEBP photos of physical holographic seal tags with high-contrast QR codes
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/50 font-bold"
            >
              Select Image File
            </button>
          </div>

          {cameraError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      )}

      {/* Sample Seals Mode */}
      {activeMode === 'samples' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Click on any registered hardware seal below to simulate scanning and verify against the digital ledger:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {HARDWARE_SEALS_LEDGER.map((seal) => (
              <div
                key={seal.sealId}
                onClick={() => handleProcessPayload(seal.qrPayload)}
                className="p-4 rounded-xl bg-[#070914] border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-500/5 transition-all cursor-pointer space-y-2.5 group shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-cyan-400">{seal.sealId}</span>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                      {seal.hardwareUnit}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                    SSoT INTACT
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                  {seal.physicalLocation}
                </p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Tag: {seal.tagSerialNumber}</span>
                  <span className="text-cyan-400 font-bold group-hover:underline">Verify Seal &rarr;</span>
                </div>
              </div>
            ))}

            {/* Simulated Tampered Test Card */}
            <div
              onClick={() => {
                const tamperedPayload = JSON.stringify({
                  protocol: 'ZYRQUEN_SEAL_V12',
                  sealId: 'SEAL-HSM-TC01-849202',
                  serial: 'FOIL-TAG-3908-01',
                  unit: 'TC-01',
                  block: 999999, // Mismatched block
                  leaf: '0000000000000000000000000000000000000000000000000000000000000000', // Invalid leaf
                  tampered: true,
                });
                handleProcessPayload(tamperedPayload);
              }}
              className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-400/60 hover:bg-rose-500/10 transition-all cursor-pointer space-y-2.5 group shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-rose-400">TEST-TAMPER-SIM</span>
                  <h4 className="text-xs font-bold text-rose-200">Simulated Tampered Seal (Drift)</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                  TEST ANOMALY
                </span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-relaxed">
                Contains altered Merkle leaf and incorrect block height to test fail-closed lockdown detection.
              </p>
              <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[10px] text-rose-400">
                <span>Triggers Quarantine</span>
                <span className="font-bold group-hover:underline">Test Failure &rarr;</span>
              </div>
            </div>

            {/* Simulated Unregistered Seal */}
            <div
              onClick={() => {
                handleProcessPayload('SEAL-UNKNOWN-ROGUE-CHASSIS-999');
              }}
              className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/10 transition-all cursor-pointer space-y-2.5 group shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-400">TEST-UNREGISTERED</span>
                  <h4 className="text-xs font-bold text-amber-200">Unregistered Rogue Hardware</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  TEST REJECT
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Simulates an unapproved hardware device scanning attempt outside the canonical registry.
              </p>
              <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-amber-400">
                <span>Zero-Trust Rejection</span>
                <span className="font-bold group-hover:underline">Test Reject &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Results Panel */}
      {verificationResult && (
        <div
          className={`p-6 rounded-2xl border transition-all duration-300 space-y-5 shadow-2xl ${
            verificationResult.status === 'VERIFIED_INTACT'
              ? 'bg-gradient-to-br from-emerald-950/40 via-[#070e14] to-[#04080c] border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
              : verificationResult.status === 'TAMPER_DETECTED'
              ? 'bg-gradient-to-br from-rose-950/40 via-[#14070a] to-[#0a0304] border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.2)]'
              : 'bg-gradient-to-br from-amber-950/40 via-[#140f07] to-[#0a0804] border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
          }`}
        >
          {/* Header Status Line */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  verificationResult.status === 'VERIFIED_INTACT'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : verificationResult.status === 'TAMPER_DETECTED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }`}
              >
                {verificationResult.status === 'VERIFIED_INTACT' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : verificationResult.status === 'TAMPER_DETECTED' ? (
                  <ShieldAlert className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${
                      verificationResult.status === 'VERIFIED_INTACT'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : verificationResult.status === 'TAMPER_DETECTED'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {verificationResult.status === 'VERIFIED_INTACT'
                      ? 'PHYSICAL SEAL: VERIFIED & INTACT (0.00% DRIFT)'
                      : verificationResult.status === 'TAMPER_DETECTED'
                      ? 'TAMPER ALERT: DIGITAL LEDGER MISMATCH'
                      : 'UNREGISTERED HARDWARE SEAL'}
                  </span>
                  <span className="text-zinc-500 text-[10px]">{verificationResult.verificationTimestamp.slice(11, 19)} UTC</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  {verificationResult.matchedSeal?.hardwareUnit || 'Unregistered Physical Seal'}
                </h3>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs flex items-center gap-1.5 font-bold transition-all"
                title="Download JSON forensic verification package"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Receipt</span>
              </button>

              <button
                onClick={() =>
                  copyToClipboard(
                    verificationResult.matchedSeal?.merkleLeafHash || verificationResult.scannedPayload,
                    'hash'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs flex items-center gap-1.5 font-bold transition-all"
              >
                {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'hash' ? 'Copied' : 'Copy Leaf Hash'}</span>
              </button>
            </div>
          </div>

          {/* Forensic Summary Box */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-zinc-300 text-xs leading-relaxed space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Forensic SSoT Statement</span>
            <p>{verificationResult.forensicSummary}</p>
          </div>

          {/* Side-by-Side Comparison: Physical Scan vs. Digital Ledger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Physical Hardware Seal Details */}
            <div className="p-4 rounded-xl bg-[#05070f] border border-cyan-500/20 space-y-2.5">
              <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Physical Seal Scan Metadata</span>
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Seal Identifier:</span>
                  <span className="text-white font-bold">{verificationResult.matchedSeal?.sealId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tamper Foil Serial:</span>
                  <span className="text-zinc-300">{verificationResult.matchedSeal?.tagSerialNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">FIPS Security Level:</span>
                  <span className="text-amber-300">{verificationResult.matchedSeal?.fipsLevel || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cryptographic Key Type:</span>
                  <span className="text-purple-300">{verificationResult.matchedSeal?.keyType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Physical Location:</span>
                  <span className="text-zinc-300 truncate max-w-[200px]" title={verificationResult.matchedSeal?.physicalLocation}>
                    {verificationResult.matchedSeal?.physicalLocation || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Digital Ledger SSoT Parity Details */}
            <div className="p-4 rounded-xl bg-[#05070f] border border-cyan-500/20 space-y-2.5">
              <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Digital Ledger Parity (Block #{CANONICAL_BLOCK_HEIGHT})</span>
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ledger Block Height:</span>
                  <span className="text-emerald-400 font-bold">Block #{verificationResult.ledgerBlockHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Baseline Drift Delta:</span>
                  <span className="text-emerald-300 font-bold">{verificationResult.driftDelta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Assigned Custodian:</span>
                  <span className="text-zinc-300 truncate max-w-[200px]" title={verificationResult.matchedSeal?.assignedCustodian}>
                    {verificationResult.matchedSeal?.assignedCustodian || 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Thai Statute Ref:</span>
                  <span className="text-amber-300 truncate max-w-[200px]" title={verificationResult.statuteReference}>
                    {verificationResult.statuteReference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Court Admissibility:</span>
                  <span
                    className={`font-bold ${
                      verificationResult.status === 'VERIFIED_INTACT' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {verificationResult.status === 'VERIFIED_INTACT' ? '100% ADMISSIBLE' : 'FLAGGED / REJECTED'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Merkle Leaf Hash Display */}
          {verificationResult.matchedSeal && (
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Cryptographic Merkle Leaf Digest (SHA-256 / Dilithium-5 Leaf)</span>
                <span className="text-emerald-400 font-bold">Anchored in Genesis Merkle Tree</span>
              </div>
              <div className="p-2 rounded bg-black/80 font-mono text-[11px] text-cyan-300 break-all select-all border border-cyan-500/20">
                {verificationResult.matchedSeal.merkleLeafHash}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Hardware Verification History */}
      {verificationHistory.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#070914] border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Recent Physical Hardware Verifications ({verificationHistory.length})</span>
            </h3>
            <button
              onClick={() => {
                setVerificationHistory([]);
                localStorage.removeItem('zyrquen_hardware_seal_history');
                playTone(480, 0.04);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
            >
              Clear History
            </button>
          </div>

          <div className="space-y-2">
            {verificationHistory.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setVerificationResult(item)}
                className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3 text-[11px] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'VERIFIED_INTACT'
                        ? 'bg-emerald-400'
                        : item.status === 'TAMPER_DETECTED'
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-white font-bold">{item.matchedSeal?.sealId || 'Unregistered Seal'}</span>
                  <span className="text-zinc-400 hidden sm:inline">&bull; {item.matchedSeal?.hardwareUnit}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 text-[10px]">
                  <span>{item.verificationTimestamp.slice(11, 19)} UTC</span>
                  <span
                    className={`font-bold ${
                      item.status === 'VERIFIED_INTACT' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // If used as modal
  if (!isEmbedded) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
        <div className="relative w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto rounded-[28px] bg-[#04060c] border border-cyan-500/40 p-5 sm:p-7 shadow-[0_0_60px_rgba(6,182,212,0.2)]">
          {content}
        </div>
      </div>
    );
  }

  // Embedded view
  return content;
};
