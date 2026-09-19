import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Download, ShieldCheck, Terminal, FileCode } from 'lucide-react';

export interface EvidencePayload {
  sys: string;
  merkle_root: string;
  pqc_sig: string;
  seal_idx: number;
  genesis_block: number;
  ts: string;
  principal: string;
  ssot_delta: string;
  court_admissible: boolean;
  evidence_code?: string;
  stage_name?: string;
  council_quorum?: string;
  forensic_pipeline?: string;
  statute_refs?: string;
  hash_alg?: string;
}

interface CourtEvidenceQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: EvidencePayload | null;
}

export const CourtEvidenceQRModal: React.FC<CourtEvidenceQRModalProps> = ({
  isOpen,
  onClose,
  payload
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !payload) return null;

  const rawJsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const svgNode = document.getElementById("modal-evidence-qr");
    if (!svgNode) return;

    const svgData = new XMLSerializer().serializeToString(svgNode);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 60;
      canvas.height = img.height + 60;
      if (ctx) {
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 30, 30);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `COURT_VERIFIED_SEAL_${payload.seal_idx}_LARGE.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                JUDICIAL VERIFICATION INSPECTION
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Seal Index #{payload.seal_idx} • Genesis Block #{payload.genesis_block}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* High-Resolution QR Container */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="p-3 bg-white rounded-xl shadow-2xl">
              <QRCodeSVG
                id="modal-evidence-qr"
                value={JSON.stringify(payload)}
                size={210}
                level="H"
                fgColor="#020617"
                bgColor="#FFFFFF"
              />
            </div>
            <button
              onClick={handleDownloadPNG}
              className="mt-3 text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Download High-Res Seal PNG
            </button>
          </div>

          {/* Raw JSON Payload Viewer */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-400" /> RAW VERIFICATION PAYLOAD
              </span>
              <button
                onClick={handleCopy}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition border border-slate-700 active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copied ? "Copied!" : "Copy Raw JSON"}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-64 overflow-y-auto font-mono text-xs text-cyan-300">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">{rawJsonString}</pre>
            </div>
            
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>SSoT Invariant:</span>
                <span className="text-emerald-400 font-bold">{payload.ssot_delta}</span>
              </div>
              <div className="flex justify-between">
                <span>Court Admissible:</span>
                <span className="text-amber-400 font-bold">{payload.court_admissible ? "YES (ISO/IEC 27037)" : "NO"}</span>
              </div>
              {payload.council_quorum && (
                <div className="flex justify-between">
                  <span>Council Quorum:</span>
                  <span className="text-cyan-400 font-bold">{payload.council_quorum}</span>
                </div>
              )}
              {payload.forensic_pipeline && (
                <div className="flex justify-between">
                  <span>Forensic Pipeline:</span>
                  <span className="text-purple-400 font-bold">{payload.forensic_pipeline}</span>
                </div>
              )}
              {payload.statute_refs && (
                <div className="flex justify-between">
                  <span>Statute:</span>
                  <span className="text-slate-300 font-bold truncate max-w-[200px]">{payload.statute_refs}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
