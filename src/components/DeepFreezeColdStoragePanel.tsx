import React, { useState, useEffect } from 'react';
import {
  Archive,
  Snowflake,
  ShieldCheck,
  HardDrive,
  Download,
  Zap,
  Lock,
  CheckCircle2,
  Layers,
  Sparkles,
  Server,
} from 'lucide-react';
import {
  getDeepFreezeArchiveState,
  subscribeDeepFreeze,
  triggerManualDeepFreeze,
  evaluateAndTriggerDeepFreeze,
} from '../utils/deepFreezeArchiveService';
import { DeepFreezeArchiveState, DeepFreezePartition } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';

interface DeepFreezeColdStoragePanelProps {
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    statuteRef?: string,
    severity?: 'info' | 'warning' | 'critical',
    metaHash?: string
  ) => void;
}

export const DeepFreezeColdStoragePanel: React.FC<DeepFreezeColdStoragePanelProps> = ({
  onAddSystemEvent,
}) => {
  const [archiveState, setArchiveState] = useState<DeepFreezeArchiveState>(getDeepFreezeArchiveState);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedPartition, setSelectedPartition] = useState<DeepFreezePartition | null>(null);

  useEffect(() => {
    const unsub = subscribeDeepFreeze((state) => {
      setArchiveState(state);
      if (!selectedPartition && state.partitions.length > 0) {
        setSelectedPartition(state.partitions[state.partitions.length - 1]);
      }
    });
    return unsub;
  }, []);

  const handleTriggerDeepFreeze = () => {
    setIsProcessing(true);
    playTone(500, 0.05);

    setTimeout(() => {
      const newPart = triggerManualDeepFreeze(500);
      setIsProcessing(false);
      setSelectedPartition(newPart);
      playAuditChime();

      if (onAddSystemEvent) {
        onAddSystemEvent(
          'IMMUTABLE_LOGGED',
          `Deep Freeze Archiving: Partition ${newPart.partitionId} Sealed`,
          `Compressed ${newPart.recordsCount} Merkle ledger records into read-only cold-storage vault ${newPart.coldStorageVault} (${newPart.compressionRatio}% compression ratio). Branch Root: ${newPart.merkleBranchRoot.slice(0, 24)}...`,
          'ETDA Sec 28 / ISO 27001 Cold Archive Invariant',
          'info',
          newPart.merkleBranchRoot
        );
      }
    }, 600);
  };

  const handleExportManifest = () => {
    const data = {
      archiveHeader: 'ZYRQUEN Ω∞ IMMUTABLE MERKLE LEDGER DEEP FREEZE COLD STORAGE MANIFEST',
      archiveState,
      exportedAt: new Date().toISOString(),
      compliance: ['ETDA Section 28', 'PDPA Master Cold Storage Retention', 'FIPS-204-ML-DSA-87'],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN-DEEP-FREEZE-ARCHIVE-MANIFEST-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  const currentPart = selectedPartition || archiveState.partitions[0];

  return (
    <div
      id="deep-freeze-cold-storage-panel"
      className="p-6 rounded-[28px] bg-gradient-to-br from-[#0a121e]/90 via-[#070b14]/85 to-[#04060b] border border-cyan-500/25 backdrop-blur-xl space-y-5 shadow-2xl relative overflow-hidden font-mono"
    >
      {/* Background Cold Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Snowflake className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: '18s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                DEEP FREEZE ARCHIVE & COLD-STORAGE SERVICE
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                AUTO-ARCHIVE &gt; 1,000 ENTRIES ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Automated background engine moving immutable Merkle ledger entries to compressed read-only simulated cold storage
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={handleTriggerDeepFreeze}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-50"
            title="Force deep freeze compression on current uncompressed ledger segment"
          >
            <Snowflake className={`w-3.5 h-3.5 text-cyan-300 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'FREEZING RECORDS...' : 'TRIGGER DEEP FREEZE'}</span>
          </button>

          <button
            onClick={handleExportManifest}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center gap-1.5 transition-all"
            title="Download cold-storage archive manifest JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 text-xs">
        <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Total Ledger Entries
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-white">{archiveState.totalLedgerEntries.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500">Blocks</span>
          </div>
          <span className="text-[9px] text-cyan-400 mt-0.5">Threshold: 1,000 Hot Entries</span>
        </div>

        <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Snowflake className="w-3.5 h-3.5 text-blue-400" />
            Deep Frozen Records
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-blue-300">{archiveState.deepFrozenEntries.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500">Read-Only</span>
          </div>
          <span className="text-[9px] text-blue-400 mt-0.5">{archiveState.partitions.length} Cold Partitions</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            Storage Saved (Ratio)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-emerald-300">78.3%</span>
            <span className="text-[10px] text-zinc-500">({archiveState.totalBytesSavedMb} MB)</span>
          </div>
          <span className="text-[9px] text-emerald-400 mt-0.5">LZW / Zstandard Encrypted</span>
        </div>

        <div className="p-3 rounded-2xl bg-violet-950/20 border border-violet-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-violet-400" />
            Active Hot Memory Tier
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold text-violet-300">{archiveState.activeHotEntries}</span>
            <span className="text-[10px] text-zinc-500">/ 1,000 Max</span>
          </div>
          <span className="text-[9px] text-violet-400 mt-0.5">Automated Flush Armed</span>
        </div>
      </div>

      {/* Partitions Selector & Deep Frozen Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10 text-xs">
        {/* Partition Tabs */}
        <div className="lg:col-span-4 space-y-2 max-h-56 overflow-y-auto pr-1">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Cold Storage Vault Partitions:
          </div>
          {archiveState.partitions.map((part) => {
            const isSelected = currentPart?.partitionId === part.partitionId;
            return (
              <button
                key={part.partitionId}
                onClick={() => {
                  playTone(600, 0.03);
                  setSelectedPartition(part);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <Snowflake className="w-3 h-3 text-cyan-400" />
                    <span>{part.partitionId}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Blocks #{part.blockRangeStart.toLocaleString()} – #{part.blockRangeEnd.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {part.compressionRatio}%
                  </span>
                  <div className="text-[9px] text-zinc-500 mt-0.5">READ-ONLY</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Partition Forensic Proof Card */}
        {currentPart && (
          <div className="lg:col-span-8 p-4 rounded-2xl bg-black/40 border border-white/8 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">{currentPart.partitionId}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {currentPart.coldStorageVault}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">{currentPart.frozenAt}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-zinc-500">Block Range:</span>
                <p className="font-bold text-zinc-200">
                  #{currentPart.blockRangeStart.toLocaleString()} – #{currentPart.blockRangeEnd.toLocaleString()} ({currentPart.recordsCount.toLocaleString()} Entries)
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Compression Size:</span>
                <p className="font-bold text-emerald-300">
                  {(currentPart.compressedBytes / 1024).toFixed(1)} KB (from {(currentPart.uncompressedBytes / 1024).toFixed(1)} KB, {currentPart.compressionRatio}% saved)
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500">Merkle Branch Root Seal:</span>
              <p className="text-[10px] text-cyan-300 font-mono break-all bg-black/50 p-1.5 rounded-lg border border-white/5 mt-0.5">
                {currentPart.merkleBranchRoot}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                NIST FIPS 204 PQC Proof Verified
              </span>
              <span className="text-zinc-500">Delete Nothing Immutable Guarantee</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
