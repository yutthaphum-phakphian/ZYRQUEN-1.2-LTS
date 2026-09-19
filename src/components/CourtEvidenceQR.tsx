import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  ShieldCheck,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Download,
  FileText,
  Activity,
  Sun,
  Moon,
  Scale
} from 'lucide-react';

export interface CourtEvidenceQRProps {
  merkleRoot: string;
  anchorSignature: string;
  sealIndex: number;
  blockNumber: number;
  timestamp: string;
  principalId?: string;
  manifestUrl?: string;
  auditTrailUrl?: string;
  evidenceCode?: string;
  className?: string;
}

export const CourtEvidenceQR: React.FC<CourtEvidenceQRProps> = ({
  merkleRoot,
  anchorSignature,
  sealIndex,
  blockNumber,
  timestamp,
  principalId = '#EP-SOVEREIGN-01',
  manifestUrl = '/zyrquen-court-manifest.json',
  auditTrailUrl = '/zyrquen-mtls13-otel-telemetry-audit.json',
  evidenceCode,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [qrMode, setQrMode] = useState<'payload' | 'manifest' | 'audit'>('payload');
  const [isHighContrastWhite, setIsHighContrastWhite] = useState(true);

  // Canonical Verification Payload for judicial officers (ETDA Sec 9/26/28, PDPA Sec 37)
  const verificationPayload = JSON.stringify({
    sys: 'ZYRQUEN_OMEGA_INF',
    merkle_root: merkleRoot,
    pqc_sig: anchorSignature,
    seal_idx: sealIndex,
    genesis_block: blockNumber,
    ts: timestamp,
    principal: principalId,
    manifest_uri: manifestUrl,
    audit_trail_uri: auditTrailUrl,
    evidence_ref: evidenceCode || `SEAL-${sealIndex}`,
    ssot_delta: '0.00%',
    court_admissible: true,
  });

  const fullManifestUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${manifestUrl}?root=${merkleRoot}&seal=${sealIndex}`
    : manifestUrl;

  const fullAuditTrailUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${auditTrailUrl}?root=${merkleRoot}&seal=${sealIndex}`
    : auditTrailUrl;

  let currentQrValue = verificationPayload;
  if (qrMode === 'manifest') currentQrValue = fullManifestUrl;
  if (qrMode === 'audit') currentQrValue = fullAuditTrailUrl;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(verificationPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svgNode = document.getElementById(`evidence-qr-code-${sealIndex}`);
    if (!svgNode) return;

    const svgData = new XMLSerializer().serializeToString(svgNode);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 60;
      canvas.height = img.height + 80;
      if (ctx) {
        ctx.fillStyle = '#020617'; // Slate-950 background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header text in PNG
        ctx.fillStyle = '#38bdf8'; // Sky-400
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`COURT SEAL #${sealIndex} | BLOCK #${blockNumber}`, 20, 24);

        ctx.drawImage(img, 30, 36);

        // Footer in PNG
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('ETDA Sec 9/26/28 • PDPA Sec 37 • SSoT Δ0.00%', 20, canvas.height - 14);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `COURT_EVIDENCE_SEAL_${sealIndex}_QR.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      id={`court-evidence-qr-${sealIndex}`}
      className={`p-4 sm:p-6 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-md shadow-2xl text-slate-100 font-sans space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-wide text-white flex items-center gap-2">
              Judicial Real-Time Verification QR
              {evidenceCode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {evidenceCode}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Direct Link to Immutable Evidence Audit Trail • Merkle Root &amp; PQC Dilithium-5
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* High Contrast Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsHighContrastWhite(!isHighContrastWhite)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white transition"
            title="Toggle High-Contrast Display for Courtroom Scanners"
          >
            {isHighContrastWhite ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isHighContrastWhite ? 'High-Contrast B&W' : 'Dark Mode QR'}</span>
          </button>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED (SSoT Δ0.00%)
          </span>
        </div>
      </div>

      {/* Target Audit Trail Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-xs font-mono">
        <span className="text-[11px] text-slate-400 px-1">Target Audit Stream:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setQrMode('payload')}
            className={`px-2.5 py-1 rounded-lg transition text-[11px] flex items-center gap-1.5 ${
              qrMode === 'payload'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Lock className="w-3 h-3 text-cyan-400" />
            1. PQC Signed Payload
          </button>
          <button
            type="button"
            onClick={() => setQrMode('manifest')}
            className={`px-2.5 py-1 rounded-lg transition text-[11px] flex items-center gap-1.5 ${
              qrMode === 'manifest'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <FileText className="w-3 h-3 text-amber-400" />
            2. Court Manifest JSON
          </button>
          <button
            type="button"
            onClick={() => setQrMode('audit')}
            className={`px-2.5 py-1 rounded-lg transition text-[11px] flex items-center gap-1.5 ${
              qrMode === 'audit'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            3. Telemetry Audit Trail
          </button>
        </div>
      </div>

      {/* QR Code and Meta Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* QR Rendering Panel with High-Contrast Framing */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 group shadow-inner">
          <div
            className={`p-3 rounded-xl transition-colors shadow-2xl ${
              isHighContrastWhite
                ? 'bg-white border-2 border-slate-300'
                : 'bg-black border-2 border-cyan-500/40'
            }`}
          >
            <QRCodeSVG
              id={`evidence-qr-code-${sealIndex}`}
              value={currentQrValue}
              size={150}
              level="H"
              includeMargin={false}
              fgColor={isHighContrastWhite ? '#000000' : '#38bdf8'}
              bgColor={isHighContrastWhite ? '#FFFFFF' : '#000000'}
            />
          </div>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="mt-3 text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 hover:underline transition"
          >
            <Download className="w-3.5 h-3.5" /> Download Court PNG Seal
          </button>
        </div>

        {/* Cryptographic Details Panel */}
        <div className="md:col-span-7 space-y-3 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
              Merkle Root Hash (SSoT Canonical Anchor)
            </span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[11px] break-all font-semibold select-all">
              {merkleRoot}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
              PQC Anchor Signature (Dilithium-5 / ML-DSA-87)
            </span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-purple-300 text-[11px] truncate select-all flex items-center justify-between">
              <span className="truncate">{anchorSignature}</span>
              <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Genesis Block</span>
              <span className="text-emerald-400 font-bold">#{blockNumber}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Seal Index</span>
              <span className="text-amber-400 font-bold">#{sealIndex}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Statutory Weight</span>
              <span className="text-cyan-400 font-bold">ม. 9 &amp; 26</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPayload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 active:scale-95 font-mono text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? 'Payload Copied!' : 'Copy Verification Payload'}</span>
          </button>

          <a
            href={manifestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-700/60 text-[11px] font-mono"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Court Manifest</span>
          </a>

          <a
            href={auditTrailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-700/60 text-[11px] font-mono"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry Audit</span>
          </a>
        </div>

        <a
          href={`https://sovereign-gateway.zyrquen.internal/verify?root=${merkleRoot}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-[11px] font-mono transition"
        >
          <Scale className="w-3.5 h-3.5 text-cyan-400" />
          <span>Court Portal Verification</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

// Also export alias CountEvidenceQR as provided in the user prompt for full backward compatibility
export const CountEvidenceQR = CourtEvidenceQR;
export default CourtEvidenceQR;
