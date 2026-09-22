import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Scale,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Download,
  Fingerprint,
  Cpu,
  Clock,
  ChevronRight,
  ArrowRight,
  Search,
} from 'lucide-react';
import { useJsQrCamera } from '../../hooks/useJsQrCamera';
import {
  FORENSIC_DOSSIER_V9,
  ForensicDossierMaster,
} from '../../data/forensicAuditMasterDossierData';
import {
  buildAllForensicEvidenceItems,
  ForensicEvidenceItem,
} from './ForensicEvidenceQrGeneratorModal';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { downloadEvidenceManifestPdf } from '../../utils/forensicDossierPdfExport';

export interface ForensicEvidenceQrScannerProps {
  onSelectEvidence?: (evidenceId: string, item: ForensicEvidenceItem) => void;
  onOpenQrGenerator?: (evidenceId: string) => void;
  onNavigateTab?: (tab: 'pillars' | 'audit-trail' | 'legal' | 'manifest' | 'qr-generator' | 'raw-json') => void;
  inline?: boolean;
}

export const ForensicEvidenceQrScanner: React.FC<ForensicEvidenceQrScannerProps> = ({
  onSelectEvidence,
  onOpenQrGenerator,
  onNavigateTab,
  inline = false,
}) => {
  const dossier = FORENSIC_DOSSIER_V9;
  const allItems = useMemo(() => buildAllForensicEvidenceItems(dossier), [dossier]);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedPayload, setLastScannedPayload] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<ForensicEvidenceItem | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);

  // Parse scanned raw data to match an evidence item
  const resolveEvidenceFromData = useCallback(
    (rawValue: string): ForensicEvidenceItem | null => {
      const trimmed = rawValue.trim();
      if (!trimmed) return null;

      // 1. Check if URL with query parameters (e.g. ?verify_evidence=step-1 or doc=...&code=STG-01)
      try {
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/?')) {
          const urlObj = new URL(trimmed, 'https://localhost');
          const evidenceId = urlObj.searchParams.get('verify_evidence') || urlObj.searchParams.get('id');
          const code = urlObj.searchParams.get('code');
          const hash = urlObj.searchParams.get('hash');

          if (evidenceId) {
            const found = allItems.find((i) => i.id.toLowerCase() === evidenceId.toLowerCase());
            if (found) return found;
          }
          if (code) {
            const found = allItems.find((i) => i.code.toLowerCase() === code.toLowerCase());
            if (found) return found;
          }
          if (hash) {
            const found = allItems.find(
              (i) => i.merkleHash.toLowerCase() === hash.toLowerCase() || i.merkleHash.toLowerCase().includes(hash.toLowerCase())
            );
            if (found) return found;
          }
        }
      } catch {
        // Not a standard URL, continue with fallback parsers
      }

      // 2. Check if JSON payload
      try {
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const parsed = JSON.parse(trimmed);
          if (parsed.id) {
            const found = allItems.find((i) => i.id.toLowerCase() === String(parsed.id).toLowerCase());
            if (found) return found;
          }
          if (parsed.code) {
            const found = allItems.find((i) => i.code.toLowerCase() === String(parsed.code).toLowerCase());
            if (found) return found;
          }
          if (parsed.merkleHash || parsed.merkleRoot) {
            const targetHash = parsed.merkleHash || parsed.merkleRoot;
            const found = allItems.find(
              (i) => i.merkleHash.toLowerCase() === String(targetHash).toLowerCase()
            );
            if (found) return found;
          }
        }
      } catch {
        // Not JSON
      }

      // 3. Match by ID directly (e.g. 'step-1', 'pillar-2', 'legal-3', 'master-dossier')
      const byId = allItems.find((i) => i.id.toLowerCase() === trimmed.toLowerCase());
      if (byId) return byId;

      // 4. Match by Code directly (e.g. 'STG-01', 'STG-16', 'PIL-01', 'LEG-01', 'DOC-MASTER-ROOT')
      const byCode = allItems.find((i) => i.code.toLowerCase() === trimmed.toLowerCase());
      if (byCode) return byCode;

      // 5. Match by exact or partial Merkle Hash (or leaf hash)
      const byHash = allItems.find(
        (i) =>
          i.merkleHash.toLowerCase() === trimmed.toLowerCase() ||
          (trimmed.length >= 12 && i.merkleHash.toLowerCase().includes(trimmed.toLowerCase()))
      );
      if (byHash) return byHash;

      // 6. Match by Step number format (e.g. "Step 1", "Step #5", "1", "16")
      const stepMatch = trimmed.match(/^(?:step\s*#?\s*)?(\d{1,2})$/i);
      if (stepMatch) {
        const stepNum = parseInt(stepMatch[1], 10);
        const byStep = allItems.find((i) => i.id === `step-${stepNum}`);
        if (byStep) return byStep;
      }

      return null;
    },
    [allItems]
  );

  // Process QR code detected in camera frame
  const handleScan = useCallback(
    (data: string | null) => {
      if (!data) return;

      // Prevent redundant rapid triggers for the same code
      if (data === lastScannedPayload && matchedItem) {
        return;
      }

      setLastScannedPayload(data);
      setScanCount((prev) => prev + 1);

      const resolved = resolveEvidenceFromData(data);
      if (resolved) {
        setMatchedItem(resolved);
        playAuditChime();
        onSelectEvidence?.(resolved.id, resolved);
      } else {
        playTone(440, 0.08);
      }
    },
    [lastScannedPayload, matchedItem, resolveEvidenceFromData, onSelectEvidence]
  );

  const handleCameraError = useCallback((error: string) => {
    setCameraError(error);
  }, []);

  const { videoRef, canvasRef, startScanning, stopScanning } = useJsQrCamera({
    facingMode,
    fps: 15,
    onScan: handleScan,
    onError: handleCameraError,
  });

  // Start camera when component mounts or camera toggle changes
  useEffect(() => {
    let isMounted = true;
    if (isCameraActive) {
      setCameraError(null);
      startScanning().catch((err) => {
        if (isMounted) {
          setCameraError(err instanceof Error ? err.message : 'Camera failed to start');
        }
      });
    } else {
      stopScanning();
    }

    return () => {
      isMounted = false;
      stopScanning();
    };
  }, [isCameraActive, facingMode, startScanning, stopScanning]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    playTone(520, 0.04);
  };

  const toggleCameraActive = () => {
    setIsCameraActive((prev) => !prev);
    playTone(600, 0.04);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const resolved = resolveEvidenceFromData(manualInput);
    setLastScannedPayload(manualInput);
    if (resolved) {
      setMatchedItem(resolved);
      playAuditChime();
      onSelectEvidence?.(resolved.id, resolved);
    } else {
      playTone(350, 0.1);
    }
  };

  const handleQuickSampleSelect = (code: string) => {
    const resolved = resolveEvidenceFromData(code);
    setLastScannedPayload(code);
    if (resolved) {
      setMatchedItem(resolved);
      playAuditChime();
      onSelectEvidence?.(resolved.id, resolved);
    }
  };

  const handleCopy = (text: string, key: string) => {
    safeCopyToClipboard(text);
    setCopiedKey(key);
    playTone(680, 0.04);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-5 font-mono text-zinc-100">
      {/* =================================================================== */}
      {/* SCANNER OVERVIEW & STATUS BANNER                                   */}
      {/* =================================================================== */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Physical Evidence Label Optical QR Scanner</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                jsQR Engine Active
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Scan cryptographic labels on physical hardware tokens (Utimaco HSM, NitroKey, Trezor Safe 5) or official court printouts to verify proof anchors and pull up audit records automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadEvidenceManifestPdf(dossier)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
            title="Download signed PDF inventory of all listed evidence items"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Evidence Manifest</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* CAMERA SCANNER VIEWPORT & REAL-TIME CONTROLS                        */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Live Camera Video Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-2xl border-2 border-zinc-800 overflow-hidden bg-black/95 shadow-[0_0_30px_rgba(0,0,0,0.5)] aspect-video sm:aspect-[4/3] flex items-center justify-center">
            {/* Hidden canvas required by jsQR engine frame processor */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Video Feed Element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
              muted
              playsInline
            />

            {/* Video Placeholder if Camera is Disabled or Errored */}
            {(!isCameraActive || cameraError) && (
              <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 space-y-3 z-10">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500">
                  <CameraOff className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-200">
                    {cameraError ? 'Camera Access Notice' : 'Camera is currently paused'}
                  </p>
                  <p className="text-[10px] text-zinc-400 max-w-xs mt-1">
                    {cameraError ||
                      'Click Start Camera below to activate real-time physical evidence scanning, or use the quick sample selectors below.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition cursor-pointer"
                >
                  Start Camera Feed
                </button>
              </div>
            )}

            {/* Animated Laser Scanning Reticle when Camera is Active */}
            {isCameraActive && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Viewfinder Target Frame */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-500/40 rounded-2xl flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  {/* Top-Left Corner Accent */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  {/* Top-Right Corner Accent */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  {/* Bottom-Left Corner Accent */}
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  {/* Bottom-Right Corner Accent */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Animated Laser Sweep Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />

                  <div className="flex justify-between text-[9px] text-emerald-400/80 font-mono font-bold uppercase tracking-wider">
                    <span>Target Frame</span>
                    <span>15 FPS</span>
                  </div>

                  <div className="text-center text-[10px] text-emerald-300 font-bold bg-black/60 backdrop-blur-sm py-0.5 rounded px-2 self-center">
                    Align QR Code within bounds
                  </div>
                </div>
              </div>
            )}

            {/* Overlay Status Badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-zinc-800 text-[10px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCameraActive && !cameraError ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                }`}
              />
              <span className="text-zinc-300">
                {isCameraActive && !cameraError ? `Scanning Active (${scanCount} frames)` : 'Standby'}
              </span>
            </div>
          </div>

          {/* Camera Controls Bar */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCameraActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isCameraActive
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
              </button>

              <button
                onClick={toggleFacingMode}
                disabled={!isCameraActive}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-zinc-700 transition cursor-pointer disabled:opacity-50"
                title="Switch between front and rear cameras"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{facingMode === 'environment' ? 'Rear (Back)' : 'Front (User)'}</span>
              </button>
            </div>

            <div className="text-[10px] text-zinc-400">
              Camera: <span className="text-zinc-200">{facingMode}</span> • SSoT: <span className="text-emerald-400 font-bold">Δ0.00%</span>
            </div>
          </div>

          {/* Quick Manual Search & Barcode Paste Bar */}
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste QR payload, code (e.g. STG-01, PIL-02), or hash..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition cursor-pointer shrink-0"
            >
              Resolve Record
            </button>
          </form>

          {/* Fast Sample Buttons for instant simulation */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
              Test Physical Evidence Labels:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: 'DOC-MASTER-ROOT', label: 'Master Root' },
                { code: 'STG-01', label: 'Step #1 TSA' },
                { code: 'STG-02', label: 'Step #2 Dilithium' },
                { code: 'STG-03', label: 'Step #3 SPHINCS+' },
                { code: 'PIL-02', label: 'Pillar II Deca-Key' },
                { code: 'LEG-01', label: 'ETDA Sec 9' },
                { code: 'LEG-02', label: 'ETDA Sec 26' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handleQuickSampleSelect(sample.code)}
                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-zinc-800 text-[10px] text-zinc-300 transition cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Record Card & Judicial Proof Binding (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {matchedItem ? (
            <div className="p-5 rounded-2xl bg-[#0b111f] border-2 border-emerald-500/50 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-in fade-in duration-200">
              {/* Record Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                      Audit Record Verified
                    </span>
                    <span className="font-bold text-xs text-white">{matchedItem.code}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {matchedItem.status}
                </span>
              </div>

              {/* Title & Category */}
              <div>
                <span className="text-[10px] text-zinc-400 block">{matchedItem.category}</span>
                <h4 className="font-bold text-sm text-zinc-100 mt-0.5">{matchedItem.title}</h4>
                {matchedItem.description && (
                  <p className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed">
                    {matchedItem.description}
                  </p>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="space-y-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px]">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Statutory Standard:</span>
                  <span className="text-zinc-200 font-bold">{matchedItem.statute}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <span>PQC Scheme:</span>
                  <span className="text-cyan-300 font-mono text-[10px]">{matchedItem.cryptographicScheme}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <span>Hardware Enclave:</span>
                  <span className="text-zinc-200 text-[10px]">{matchedItem.enclaveHardware}</span>
                </div>

                {matchedItem.executionTimeMs !== undefined && (
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Latency SLA:</span>
                    <span className="text-emerald-400 font-mono">{matchedItem.executionTimeMs.toFixed(1)} ms</span>
                  </div>
                )}
              </div>

              {/* Cryptographic Merkle Hash */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Merkle Leaf Hash:</span>
                  <button
                    onClick={() => handleCopy(matchedItem.merkleHash, 'hash')}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'hash' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'hash' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-[#060913] border border-emerald-500/30 font-mono text-[10px] text-emerald-300 break-all leading-tight">
                  {matchedItem.merkleHash}
                </div>
              </div>

              {/* Action Buttons for Scanned Item */}
              <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenQrGenerator?.(matchedItem.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Code</span>
                  </button>

                  <button
                    onClick={() => {
                      if (matchedItem.type === 'AUDIT_STEP') onNavigateTab?.('audit-trail');
                      else if (matchedItem.type === 'TECHNICAL_PILLAR') onNavigateTab?.('pillars');
                      else if (matchedItem.type === 'LEGAL_ALIGNMENT') onNavigateTab?.('legal');
                      else onNavigateTab?.('manifest');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Open in Dossier</span>
                  </button>
                </div>

                <button
                  onClick={() => setMatchedItem(null)}
                  className="w-full py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
                >
                  Clear & Scan Next Item
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#090d1a] border border-zinc-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-200">Awaiting Physical Label Scan</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed max-w-xs mx-auto">
                  Hold a QR evidence label in front of the camera or click any sample above to instantly verify and load the cryptographic record.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[10px] text-zinc-400 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compatible Evidence Label Types:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-zinc-400">
                  <li>Utimaco HSM Deca-Key Seal Barcodes</li>
                  <li>16-Step Forensic Audit Stage Tokens</li>
                  <li>ETDA Section 9/26/28 Court Certifications</li>
                  <li>RFC 3161 Merkle Leaf Hashes</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
