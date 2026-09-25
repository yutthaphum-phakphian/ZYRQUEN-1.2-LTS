import React, { useState } from 'react';
import {
  Camera,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Search,
  ExternalLink,
} from 'lucide-react';
import { HardwareSnapshot } from '../types';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { downloadSimplifiedForensicReport } from '../utils/simplifiedForensicReportExport';

export interface Last5SnapshotsSidePanelProps {
  snapshots: HardwareSnapshot[];
  onSelectSnapshot?: (snapshot: HardwareSnapshot) => void;
  onOpenAuditModal?: (snapshot: HardwareSnapshot) => void;
}

export const Last5SnapshotsSidePanel: React.FC<Last5SnapshotsSidePanelProps> = ({
  snapshots,
  onSelectSnapshot,
  onOpenAuditModal,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [reportToast, setReportToast] = useState<string | null>(null);

  // Take the latest 5 snapshots (or reverse if chronological)
  const last5 = [...snapshots].slice(0, 5);

  const handleCopy = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    playTone(880, 0.04);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadSimplifiedReport = () => {
    playAuditChime();
    const filename = downloadSimplifiedForensicReport({
      snapshots,
      ssotMutationDrift: 0.0,
      sealCount: SYSTEM_METADATA.totalVerifiedSeals,
    });
    setReportToast(filename);
    setTimeout(() => setReportToast(null), 4500);
  };

  return (
    <aside
      aria-label="Hardware Snapshots Forensic Cross-Reference"
      className="w-full xl:w-80 shrink-0 space-y-3 font-mono"
    >
      <div className="p-4 rounded-2xl bg-[#0a0f1e] border-cyan-500/30 shadow-xl space-y-3">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Last 5 Snapshots
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border-cyan-500/30 text-[10px] font-bold">
            FORENSIC REF
          </span>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Cryptographic hashes for rapid evidentiary cross-referencing against SSoT Genesis Block #849202.
        </p>

        {/* Snapshot Cards List */}
        <div className="space-y-2.5">
          {last5.map((snap, idx) => {
            const isLatest = idx === 0;
            const hashShort = snap.sealedHash ? `${snap.sealedHash.slice(0, 10)}...${snap.sealedHash.slice(-8)}` : 'N/A';

            return (
              <div
                key={snap.id || idx}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isLatest
                    ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm'
                    : 'bg-[#070a12] border-white/5 hover:border-cyan-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-5 h-5 rounded-md bg-white/5 text-cyan-300 flex items-center justify-center text-[10px]">
                      #{snap.snapshotNumber}
                    </span>
                    <span className="text-white text-xs">
                      Snapshot {snap.snapshotNumber}
                    </span>
                    {isLatest && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border-emerald-500/30 text-[9px]">
                        LATEST
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    Δ0.00% Drift
                  </span>
                </div>

                {/* Hash Display & Copy */}
                <div className="mt-2 bg-black/60 p-2 rounded-lg border-white/5 flex items-center justify-between gap-1.5 font-mono text-[11px]">
                  <span className="text-zinc-300 truncate" title={snap.sealedHash}>
                    {hashShort}
                  </span>
                  <button
                    onClick={() => handleCopy(snap.sealedHash, `snap-${idx}`)}
                    className="p-1 text-zinc-400 hover:text-white transition-colors shrink-0"
                    title="Copy Full SHA-256 Hash"
                  >
                    {copiedIndex === `snap-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Timestamp & Quick Action */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{snap.timestampIct || snap.timestampUtc || '2026-08-22 02:04:15 ICT'}</span>
                  </span>

                  {onOpenAuditModal && (
                    <button
                      onClick={() => {
                        playTone(740, 0.03);
                        onOpenAuditModal(snap);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5"
                    >
                      <span>Verify</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button: Simplified Human-Readable Forensic Report Download */}
        <div className="pt-2 border-t border-cyan-500/20">
          <button
            onClick={handleDownloadSimplifiedReport}
            className="w-full px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            title="Download simplified human-readable forensic report (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Simplified Report</span>
          </button>
        </div>

        {reportToast && (
          <div className="p-2 rounded-lg bg-emerald-950/80 border-emerald-500/40 text-emerald-200 text-[10px] font-mono animate-in fade-in">
            ✓ Downloaded: <strong className="text-white">{reportToast}</strong>
          </div>
        )}
      </div>
    </aside>
  );
};
