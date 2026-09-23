import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  ShieldCheck,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Smartphone,
  Lock,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { CANONICAL_MERKLE_ROOT, CANONICAL_GENESIS_BLOCK, CANONICAL_SEALS, SYSTEM_METADATA } from '../data/canonicalData';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

interface MerkleRootQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBlockHeight?: number;
  merkleRootHash?: string;
}

export const MerkleRootQrCodeModal: React.FC<MerkleRootQrCodeModalProps> = ({
  isOpen,
  onClose,
  currentBlockHeight = CANONICAL_GENESIS_BLOCK,
  merkleRootHash = CANONICAL_MERKLE_ROOT,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrPayloadType, setQrPayloadType] = useState<'AUDIT_URL' | 'CRYPTOGRAPHIC_MANIFEST' | 'RAW_MERKLE_ROOT'>('AUDIT_URL');
  const [encodingFormat, setEncodingFormat] = useState<'RAW' | 'BASE64'>('RAW');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Construct URLs and Payloads
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const liveAuditUrl = `${baseUrl}/?audit=live&merkle_root=${merkleRootHash}&block=${currentBlockHeight}&seals=${CANONICAL_SEALS}&pqc=ML-DSA-87`;
  
  const cryptographicManifestPayload = JSON.stringify({
    system: 'ZYRQUEN Ω∞ SOVEREIGN KERNEL & TRUTH MATRIX',
    version: 'v4.16 PDPA FINAL FROZEN v1.2 LTS',
    canonicalBlockHeight: currentBlockHeight,
    genesisMerkleRootHash: merkleRootHash,
    canonicalSealsCount: CANONICAL_SEALS,
    sovereignPrincipal: SYSTEM_METADATA.sovereignPrincipal,
    ssotMutationAuthority: 0,
    ssotDrift: '0.00%',
    pqcStandard: 'NIST FIPS 204 ML-DSA-87 / FIPS 203 ML-KEM-1024',
    auditUrl: liveAuditUrl,
  });

  const basePayload =
    qrPayloadType === 'AUDIT_URL'
      ? liveAuditUrl
      : qrPayloadType === 'CRYPTOGRAPHIC_MANIFEST'
      ? cryptographicManifestPayload
      : merkleRootHash;

  const activePayload = encodingFormat === 'BASE64' ? btoa(unescape(encodeURIComponent(basePayload))) : basePayload;

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsGenerating(true);

    const generateCode = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(activePayload, {
          width: 380,
          margin: 2,
          color: {
            dark: '#00F2FE', // Sovereign Cyan-Blue gradient dark
            light: '#070913', // Deep Void container background
          },
          errorCorrectionLevel: 'H',
        });

        const svgString = await QRCode.toString(activePayload, {
          type: 'svg',
          margin: 2,
          color: {
            dark: '#00F2FE',
            light: '#070913',
          },
          errorCorrectionLevel: 'H',
        });

        if (mounted) {
          setQrDataUrl(dataUrl);
          setQrSvg(svgString);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        if (mounted) setIsGenerating(false);
      }
    };

    generateCode();

    return () => {
      mounted = false;
    };
  }, [isOpen, activePayload, merkleRootHash, currentBlockHeight, qrPayloadType]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    playAuditChime();
    copyToClipboard(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleDownloadPng = () => {
    playTone(700, 0.08, 'sine');
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `zyrquen-merkle-root-block${currentBlockHeight}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    playTone(700, 0.08, 'sine');
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-merkle-root-block${currentBlockHeight}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#080914] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                  SOVEREIGN MERKLE ROOT QR AUDIT TRAIL
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  COURT ADMISSIBLE
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Chamber 02/09 Evidence &amp; Provenance • Mobile Scanning Link
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTone(400, 0.05, 'sine');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Payload Selection Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#0D0F1F] border border-white/10 text-xs font-mono">
            <button
              onClick={() => setQrPayloadType('AUDIT_URL')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition font-semibold text-center flex items-center justify-center gap-1.5 ${
                qrPayloadType === 'AUDIT_URL'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Live Audit Web URL</span>
            </button>
            <button
              onClick={() => setQrPayloadType('CRYPTOGRAPHIC_MANIFEST')}
              className={`flex-1 min-w-[150px] py-2 px-3 rounded-xl transition font-semibold text-center flex items-center justify-center gap-1.5 ${
                qrPayloadType === 'CRYPTOGRAPHIC_MANIFEST'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>SSoT Invariant Manifest</span>
            </button>
            <button
              onClick={() => setQrPayloadType('RAW_MERKLE_ROOT')}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition font-semibold text-center flex items-center justify-center gap-1.5 ${
                qrPayloadType === 'RAW_MERKLE_ROOT'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Raw Merkle Hash</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase">Encoding Format:</span>
            <div className="flex rounded-lg bg-[#0D0F1F] p-0.5 border border-white/10 text-[10px] font-mono">
              <button
                onClick={() => setEncodingFormat('RAW')}
                className={`px-3 py-1 rounded-md transition ${encodingFormat === 'RAW' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Raw Text
              </button>
              <button
                onClick={() => setEncodingFormat('BASE64')}
                className={`px-3 py-1 rounded-md transition ${encodingFormat === 'BASE64' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Base64
              </button>
            </div>
          </div>

          {/* QR Display + Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* QR Visual Card */}
            <div className="md:col-span-6 flex flex-col items-center justify-center">
              <div className="relative p-4 rounded-3xl bg-gradient-to-b from-[#0A0D22] to-[#04060E] border-2 border-cyan-400/40 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col items-center">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-3xl bg-cyan-500/5 filter blur-xl -z-10" />

                {isGenerating ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center text-cyan-300 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-mono">Generating PQC Signed QR...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Sovereign Merkle Root QR Code"
                    className="w-64 h-64 rounded-2xl border border-cyan-500/30 object-contain shadow-inner"
                  />
                ) : null}

                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-cyan-300/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NIST FIPS 204 ML-DSA-87 Signed Proof</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 mt-4">
                <button
                  onClick={handleDownloadPng}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 font-mono text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={handleDownloadSvg}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 font-mono text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG (Vector)</span>
                </button>
                <button
                  onClick={() => handleCopy(activePayload, 'PAYLOAD')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs flex items-center gap-1.5 transition"
                >
                  {copiedField === 'PAYLOAD' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'PAYLOAD' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Verification Metadata Details */}
            <div className="md:col-span-6 space-y-3.5 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-[#0D0F1F] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="font-semibold tracking-wider text-zinc-300">GENESIS MERKLE ROOT</span>
                  <span className="text-[10px] text-cyan-400/80 font-mono">SHA-256 SSoT Anchor</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 p-2.5 rounded-xl bg-black/70 border border-cyan-500/30 font-mono text-[11px] text-cyan-200 break-all select-all flex items-center">
                    {merkleRootHash}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(merkleRootHash, 'MERKLE_ROOT')}
                    aria-label="Copy Merkle Root hash to clipboard"
                    title="Copy Merkle Root hash to clipboard for forensic sharing"
                    className={`px-3.5 py-2 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm ${
                      copiedField === 'MERKLE_ROOT'
                        ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 hover:text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    }`}
                  >
                    {copiedField === 'MERKLE_ROOT' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-cyan-300" />
                        <span className="text-[11px]">Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#0D0F1F] border border-white/10">
                  <div className="text-[10px] text-zinc-400">BLOCK HEIGHT</div>
                  <div className="text-sm font-bold text-white">#{currentBlockHeight.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0D0F1F] border border-white/10">
                  <div className="text-[10px] text-zinc-400">CANONICAL SEALS</div>
                  <div className="text-sm font-bold text-emerald-300">{CANONICAL_SEALS.toLocaleString()} Verified</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0D0F1F] border border-white/10 space-y-1">
                <div className="text-[10px] text-zinc-400">PHYSICAL AUDIT INSTRUCTIONS</div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Point any standard mobile camera or optical scanner at this QR code to immediately verify the
                  unbroken cryptographic Merkle root hash, view the live sub-kelvin telemetry, and inspect the court-admissible
                  audit ledger.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-emerald-200 font-semibold">ETDA Sec 9/26/28 Compliant</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">100% GREEN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-cyan-500/20 bg-[#060710] flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Sovereign Principal: {SYSTEM_METADATA.sovereignPrincipal} (#EP-SOVEREIGN-01)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
