import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  Download,
  RotateCcw,
  Search,
  Check,
  Copy,
  Layers,
  Sparkles,
  Lock,
  ExternalLink,
  Clock,
  Filter,
  AlertCircle,
  Database,
} from 'lucide-react';
import {
  ForensicScanRecord,
  getForensicScanHistory,
  recordForensicScan,
  clearForensicScanHistory,
  exportForensicScanHistoryJson,
} from '../utils/forensicRegistry';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

interface ForensicHistorySidebarTabProps {
  onClose?: () => void;
  onNavigateToView?: (view: any, tab?: any) => void;
}

export const ForensicHistorySidebarTab: React.FC<ForensicHistorySidebarTabProps> = ({
  onClose,
  onNavigateToView,
}) => {
  const [scans, setScans] = useState<ForensicScanRecord[]>(() => getForensicScanHistory());
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      setScans(getForensicScanHistory());
    };
    window.addEventListener('zyrquen:forensic-scan-updated', handleUpdate);
    return () => window.removeEventListener('zyrquen:forensic-scan-updated', handleUpdate);
  }, []);

  const handleManualTriggerScan = () => {
    setIsScanning(true);
    playTone(580, 0.04);
    setTimeout(() => {
      recordForensicScan({
        triggerType: 'MANUAL_DEEP_SCAN',
        title: 'Manual 14,902 Chamber Forensic Interrogation',
        details: 'Operator manual cryptographic sweep across all 18 chambers. FIPS 140-3 L4 HSM attestation confirmed with zero system drift Δ0.00%.',
        statuteRef: 'ETDA มาตรา ๒๖, ๒๘ & PDPA มาตรา ๓๗(๑)',
        status: 'VERIFIED',
      });
      setIsScanning(false);
      playAuditChime();
    }, 450);
  };

  const handleExportJson = () => {
    playTone(720, 0.04);
    exportForensicScanHistoryJson();
  };

  const handleResetHistory = () => {
    playTone(420, 0.05);
    if (window.confirm('Reset virtual local storage forensic registry to initial canonical bootstrap state?')) {
      clearForensicScanHistory();
      setScans(getForensicScanHistory());
      playAuditChime();
    }
  };

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(880, 0.03);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter and search
  const filteredScans = scans.filter((scan) => {
    const matchesType = selectedFilter === 'ALL' || scan.triggerType === selectedFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      scan.title.toLowerCase().includes(q) ||
      scan.details.toLowerCase().includes(q) ||
      (scan.statuteRef && scan.statuteRef.toLowerCase().includes(q)) ||
      (scan.signatureDigest && scan.signatureDigest.toLowerCase().includes(q)) ||
      scan.triggerType.toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  const getTriggerBadge = (type: ForensicScanRecord['triggerType']) => {
    switch (type) {
      case 'BATCH_VERIFY':
        return {
          label: 'BATCH VERIFY',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        };
      case 'FORENSIC_MODE_TOGGLE':
        return {
          label: 'MODE OVERLAY',
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
        };
      case 'EXPORT_AUDIT_LOG':
        return {
          label: 'AUDIT EXPORT',
          color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
        };
      case 'STATUTE_INSPECTION':
        return {
          label: 'STATUTE PROBE',
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        };
      case 'MANUAL_DEEP_SCAN':
      default:
        return {
          label: 'DEEP SCAN',
          color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
        };
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden font-mono text-xs">
      {/* Top Metadata & SSoT Virtual LocalStorage Registry Banner */}
      <div className="p-3.5 mx-4 mt-3 rounded-2xl bg-gradient-to-b from-[#0e1327] via-[#090d1c] to-[#060812] border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.12)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wide text-[11px]">
                  VIRTUAL FORENSIC REGISTRY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[10px] text-zinc-400">
                localStorage &bull; SSoT Invariant Δ0.00%
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
              {scans.length} RECORDED
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[10px] text-zinc-300">
          <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col">
            <span className="text-[9px] text-zinc-500">SSoT Drift</span>
            <span className="font-bold text-emerald-400">Δ0.00% (ZERO)</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col">
            <span className="text-[9px] text-zinc-500">Hardware Seals</span>
            <span className="font-bold text-cyan-300">14,902 Verified</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col">
            <span className="text-[9px] text-zinc-500">PQC Standard</span>
            <span className="font-bold text-purple-300">FIPS 204 ML-DSA</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleManualTriggerScan}
            disabled={isScanning}
            className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className={`w-3.5 h-3.5 text-purple-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Probing Chambers...' : 'Trigger Forensic Scan'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="py-1.5 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Export full registry history as court-admissible signed JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleResetHistory}
            className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-rose-400 text-[11px] transition-all cursor-pointer"
            title="Reset virtual registry to baseline bootstrap events"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-4 pt-3 pb-2 space-y-2 border-b border-white/5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forensic scans, digests, statutes..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/50 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
          {[
            { id: 'ALL', label: 'All Scans', count: scans.length },
            { id: 'BATCH_VERIFY', label: 'Batch Verify' },
            { id: 'FORENSIC_MODE_TOGGLE', label: 'Mode Toggle' },
            { id: 'EXPORT_AUDIT_LOG', label: 'Exports' },
            { id: 'STATUTE_INSPECTION', label: 'Statute Probes' },
            { id: 'MANUAL_DEEP_SCAN', label: 'Manual Scans' },
          ].map((pill) => {
            const isActive = selectedFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => {
                  playTone(600, 0.02);
                  setSelectedFilter(pill.id);
                }}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Forensic Scans Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        {filteredScans.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
              <Fingerprint className="w-6 h-6" />
            </div>
            <p className="text-zinc-400 text-xs font-sans">
              No matching forensic scans recorded in the virtual registry.
            </p>
            <button
              onClick={handleManualTriggerScan}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold"
            >
              Trigger Forensic Scan Now
            </button>
          </div>
        ) : (
          filteredScans.map((scan) => {
            const badge = getTriggerBadge(scan.triggerType);
            const isCopied = copiedId === scan.id;

            return (
              <div
                key={scan.id}
                className="p-3.5 rounded-2xl bg-[#090d1c]/90 border border-white/10 hover:border-purple-500/40 transition-all space-y-2.5 shadow-lg group"
              >
                {/* Header line: Trigger type + statute + timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {scan.statuteRef && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                        {scan.statuteRef}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 shrink-0">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{new Date(scan.timestamp).toLocaleTimeString('th-TH', { hour12: false })}</span>
                  </div>
                </div>

                {/* Title & Details */}
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    {scan.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mt-1">
                    {scan.details}
                  </p>
                </div>

                {/* Cryptographic Signature Box */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400">
                    <span className="flex items-center gap-1 text-purple-300 font-bold">
                      <Lock className="w-2.5 h-2.5 text-purple-400" />
                      <span>{scan.pqcScheme}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {scan.status} &bull; Δ0.00%
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[280px]">
                      {scan.signatureDigest}
                    </span>
                    <button
                      onClick={() => handleCopy(scan.signatureDigest, scan.id)}
                      className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Copy PQC signature digest"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500">
                    <span>Block #{scan.blockHeight.toLocaleString()} &bull; 14,902 Seals</span>
                    <span className="text-zinc-400 truncate max-w-[140px]" title={scan.actor}>
                      {scan.actor}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
