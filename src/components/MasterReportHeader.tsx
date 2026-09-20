import React from 'react';

export interface MasterReportHeaderProps {
  onOpenQr?: () => void;
  onPreviewDossier?: () => void;
  onDownloadCourtAttestation?: () => void;
  onDownloadMasterPdf?: () => void;
  onExportCsv?: () => void;
}

export const MasterReportHeader: React.FC<MasterReportHeaderProps> = ({
  onOpenQr,
  onPreviewDossier,
  onDownloadCourtAttestation,
  onDownloadMasterPdf,
  onExportCsv,
}) => {
  return (
    <header className="w-full bg-gray-950 border border-gray-800 p-3 rounded-lg space-y-3">
      {/* Title Bar & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 text-xs">
            🛡️
          </span>
          <h1 className="text-xs sm:text-sm font-bold text-gray-100 font-mono tracking-tight">
            GOLD MASTER CERTIFICATE &amp; DEPLOYMENT GATE
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
            100% VERIFIED
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-400">
          ZYRQUEN Ω∞ FROZEN v1.2 LTS • SSoT Δ0.00%
        </span>
      </div>

      {/* Compact Responsive Action Buttons Container */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenQr}
          className="btn-compact-cyan cursor-pointer"
        >
          <span>📱</span> Offline QR
        </button>

        <button
          type="button"
          onClick={onPreviewDossier}
          className="btn-compact-cyan cursor-pointer"
        >
          <span>👁️</span> Preview Dossier
        </button>

        <button
          type="button"
          onClick={onDownloadCourtAttestation}
          className="btn-compact-cyan cursor-pointer"
        >
          <span>📄</span> Court Attestation PDF
        </button>

        <button
          type="button"
          onClick={onDownloadMasterPdf}
          className="btn-compact-gold shadow-[0_0_8px_rgba(245,158,11,0.15)] cursor-pointer"
        >
          <span>👑</span> Master PDF
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          className="btn-compact-secondary cursor-pointer"
        >
          <span>📊</span> Export CSV
        </button>
      </div>
    </header>
  );
};

export default MasterReportHeader;
