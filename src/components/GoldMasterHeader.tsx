import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  QrCode, 
  Eye,
  FileText, 
  FileCheck2, 
  Download, 
  FileSpreadsheet
} from 'lucide-react';

export interface GoldMasterHeaderProps {
  onOpenOfflineQR?: () => void;
  onPreviewDossier?: () => void;
  onDownloadCourtAttestationPdf?: () => void;
  onDownloadMasterPdf?: () => void;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  activeTab?: string;
  className?: string;
}

export const GoldMasterHeader: React.FC<GoldMasterHeaderProps> = ({
  onOpenOfflineQR,
  onPreviewDossier,
  onDownloadCourtAttestationPdf,
  onDownloadMasterPdf,
  onExportCsv,
  onExportJson,
  activeTab,
  className = ""
}) => {
  return (
    <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-cyan-500/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 ${className}`}>
      
      {/* Compact Title & Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-mono font-bold text-white tracking-wide truncate">
              GOLD MASTER CERTIFICATE &amp; DEPLOYMENT GATE
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% VERIFIED
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono truncate">
            ZYRQUEN Ω∞ FROZEN v1.2 LTS • Merkle Root Attestation • SSoT Δ0.00%
          </p>
        </div>
      </div>

      {/* Compact Action Buttons Row */}
      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap overflow-x-auto max-w-full py-0.5 no-scrollbar">
        {onOpenOfflineQR && (
          <button
            type="button"
            onClick={onOpenOfflineQR}
            className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded border transition flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'qrGenerator'
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800 hover:border-cyan-500'
            }`}
            title="Generate Offline Seal Chain Verification QR Code for External Auditors"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Offline QR</span>
          </button>
        )}

        {onPreviewDossier && (
          <button
            type="button"
            onClick={onPreviewDossier}
            className="px-2.5 py-1 text-[11px] font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:border-cyan-500 rounded transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="Open Interactive Sovereign Dossier & PDF Preview"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dossier</span>
          </button>
        )}

        {onDownloadCourtAttestationPdf && (
          <button
            type="button"
            onClick={onDownloadCourtAttestationPdf}
            className="px-2.5 py-1 text-[11px] font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:border-cyan-500 rounded transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="Download Court-Admissible Sovereign Forensic Attestation PDF"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Attestation PDF</span>
          </button>
        )}

        {onDownloadMasterPdf && (
          <button
            type="button"
            onClick={onDownloadMasterPdf}
            className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 rounded transition flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.15)] shrink-0 cursor-pointer"
            title="Download Master Forensic Audit PDF"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Master PDF</span>
          </button>
        )}

        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="px-2.5 py-1 text-[11px] font-mono font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 rounded transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
        )}

        {onExportJson && (
          <button
            type="button"
            onClick={onExportJson}
            className="px-2.5 py-1 text-[11px] font-mono font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 rounded transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="Download Certificate JSON-LD"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>
        )}
      </div>

    </div>
  );
};

export default GoldMasterHeader;
