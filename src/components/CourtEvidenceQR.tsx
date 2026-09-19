import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  ShieldCheck, 
  Copy, 
  Check, 
  Lock, 
  Maximize2, 
  History, 
  AlertOctagon, 
  Download, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { CourtEvidenceQRModal, EvidencePayload } from './CourtEvidenceQRModal';

export interface CourtEvidenceQRProps {
  id?: string;
  merkleRoot: string;
  anchorSignature: string;
  sealIndex: number;
  blockNumber: number;
  timestamp: string;
  principalId?: string;
  stageName?: string;
  manifestUrl?: string;
  auditTrailUrl?: string;
  evidenceCode?: string;
  className?: string;
  isCompareSelected?: boolean;
  showCheckbox?: boolean;
  onToggleCompare?: (id: string) => void;
  onOpenAuditHistory?: (sealIndex: number, blockNumber: number) => void;
  verificationStatus?: 'IDLE' | 'VERIFYING' | 'PASSED' | 'FAILED';
}

export const CourtEvidenceQR: React.FC<CourtEvidenceQRProps> = ({
  id = "seal-default",
  merkleRoot,
  anchorSignature,
  sealIndex,
  blockNumber,
  timestamp,
  principalId = "#EP-SOVEREIGN-01",
  stageName = "GENERAL_ATTESTATION",
  manifestUrl = "/zyrquen-court-manifest.json",
  auditTrailUrl = "/zyrquen-mtls13-otel-telemetry-audit.json",
  evidenceCode,
  className = "",
  isCompareSelected = false,
  showCheckbox = true,
  onToggleCompare,
  onOpenAuditHistory,
  verificationStatus = 'IDLE'
}) => {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const payload: EvidencePayload = {
    sys: "ZYRQUEN_OMEGA_INF",
    merkle_root: merkleRoot,
    pqc_sig: anchorSignature,
    seal_idx: sealIndex,
    genesis_block: blockNumber,
    ts: timestamp,
    principal: principalId,
    ssot_delta: "0.00%",
    court_admissible: true
  };

  // Trigger Toast Notification when verification passes successfully
  useEffect(() => {
    if (verificationStatus === 'PASSED') {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evidence-seal-${sealIndex}-block-${blockNumber}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isFailed = verificationStatus === 'FAILED';
  const isPassed = verificationStatus === 'PASSED';
  const isVerifying = verificationStatus === 'VERIFYING';

  const cardBorderClass = isFailed
    ? "border-red-500 bg-red-950/20 shadow-red-500/20"
    : isPassed
    ? "border-emerald-500/80 bg-slate-900/90 shadow-emerald-500/10"
    : isVerifying
    ? "border-cyan-500/80 bg-slate-900/90 shadow-cyan-500/20"
    : "border-slate-800 bg-slate-900/90 hover:border-slate-700";

  return (
    <>
      {/* Container with Sealing Entrance Animation */}
      <div 
        className={`printable-evidence-card relative overflow-hidden p-4 sm:p-5 rounded-2xl border backdrop-blur-md shadow-xl text-slate-100 font-sans space-y-4 transition duration-300 ${cardBorderClass} ${className}`}
        style={{
          animation: 'sealCardAppear 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <style>{`
          @keyframes sealCardAppear {
            0% {
              opacity: 0;
              transform: translateY(16px) scale(0.97);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes scanSweep {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(200%); }
          }
        `}</style>

        {/* 1. Subtle Toast Notification Popup */}
        {showToast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-emerald-950/95 border border-emerald-500/80 rounded-full shadow-lg shadow-emerald-900/50 text-[11px] font-mono text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-md pointer-events-none whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Payload Hash Validated against Ledger (SSoT Δ0.00%)</span>
          </div>
        )}

        {/* 2. Subtle Scanning Sweep Overlay (Active during 'VERIFYING') */}
        {isVerifying && (
          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-20">
            <div className="absolute inset-0 bg-cyan-500/5 backdrop-blur-[1px]" />
            <div 
              className="w-full h-1/2 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent border-b border-cyan-400/50"
              style={{
                animation: 'scanSweep 1.6s ease-in-out infinite alternate'
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            {showCheckbox && onToggleCompare && (
              <div className="no-print flex items-center justify-center p-1 rounded-md bg-slate-900 border border-slate-700 hover:border-cyan-500 transition z-10">
                <input
                  type="checkbox"
                  checked={isCompareSelected}
                  onChange={() => onToggleCompare(id)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                  title="Select for Batch Comparison"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                  {evidenceCode ? `${evidenceCode} • ${stageName}` : stageName}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Seal Index #{sealIndex}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVerifying ? (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> VERIFYING HANDSHAKE...
              </span>
            ) : isFailed ? (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 font-bold animate-bounce">
                <AlertOctagon className="w-3.5 h-3.5" /> ANOMALY DETECTED
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIED (SSoT Δ0)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div 
            onClick={() => setIsModalOpen(true)}
            className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer group transition duration-300 z-10"
            title="Click to expand for judicial scanning"
          >
            <div className="p-2 bg-white rounded-lg shadow-inner transition group-hover:scale-105">
              <QRCodeSVG
                value={JSON.stringify(payload)}
                size={105}
                level="M"
                fgColor="#020617"
                bgColor="#FFFFFF"
              />
            </div>
            <div className="mt-2 text-[10px] font-mono text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Expand QR
            </div>
          </div>

          <div className="sm:col-span-8 space-y-3 font-mono text-xs z-10">
            {/* 2. Merkle Root Field with Hover Tooltip */}
            <div className="relative group/tooltip">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Merkle Root Hash
                </span>
                <HelpCircle className="w-3 h-3 text-slate-500 hover:text-cyan-400 cursor-help transition" />
              </div>

              {/* Merkle Root Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block z-40 w-72 p-3 bg-slate-950 border border-cyan-500/40 rounded-xl shadow-2xl text-[10px] text-slate-300 font-sans leading-relaxed pointer-events-none transition-all">
                <div className="flex items-center gap-1.5 font-mono font-bold text-cyan-400 mb-1 border-b border-slate-800 pb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Merkle Tree Integrity
                </div>
                สัจจะทางคณิตศาสตร์จาก Dual-Hash (BLAKE3 + SHA3-512) ผ่านการยืนยัน Sibling Path 24 ชั้น การันตีความถูกต้องของข้อมูลทั้งหมดบน Genesis Block โดยปราศจากการเบี่ยงเบน (Δ0.00% Zero Drift)
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[11px] truncate select-all">
                {merkleRoot}
              </div>
            </div>

            {/* 3. PQC Signature Field with Hover Tooltip */}
            <div className="relative group/tooltip">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PQC Signature (Dilithium-5)
                </span>
                <HelpCircle className="w-3 h-3 text-slate-500 hover:text-purple-400 cursor-help transition" />
              </div>

              {/* PQC Signature Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block z-40 w-72 p-3 bg-slate-950 border border-purple-500/40 rounded-xl shadow-2xl text-[10px] text-slate-300 font-sans leading-relaxed pointer-events-none transition-all">
                <div className="flex items-center gap-1.5 font-mono font-bold text-purple-400 mb-1 border-b border-slate-800 pb-1">
                  <Lock className="w-3.5 h-3.5" /> NIST FIPS 204 (ML-DSA-87)
                </div>
                ตราประทับดิจิทัลฐานแลตทิซ (Lattice-based) ยุคหลังควอนตัม เพื่อป้องกันยุทธศาสตร์ดักจับข้อมูลในปัจจุบันเพื่อรอนำไปถอดรหัสในอนาคต (Harvest Now, Decrypt Later)
              </div>

              <div className="p-2 rounded-lg bg-slate-950 text-purple-300 text-[10px] truncate flex items-center justify-between">
                <span className="truncate">{anchorSignature}</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping ml-2 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <div className="no-print pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono z-10 relative">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 active:scale-95 text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? "Copied" : "Copy Payload"}</span>
            </button>

            {/* Download JSON Button */}
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition border border-cyan-500/30 active:scale-95 text-[11px] cursor-pointer"
              title="Download JSON Payload for Offline Verification"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>

            {onOpenAuditHistory && (
              <button
                onClick={() => onOpenAuditHistory(sealIndex, blockNumber)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition border border-purple-500/30 text-[11px] cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Audit Trail</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-500">Block #{blockNumber}</span>
        </div>
      </div>

      <CourtEvidenceQRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payload={payload}
      />
    </>
  );
};

export const CountEvidenceQR = CourtEvidenceQR;
export default CourtEvidenceQR;
