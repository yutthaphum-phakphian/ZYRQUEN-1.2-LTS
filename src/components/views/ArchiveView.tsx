import React, { useState } from 'react';
import { Archive, Search, Download, Layers, CheckCircle2, ChevronRight, ExternalLink, Lock, Scale, Share2, X, QrCode } from 'lucide-react';
import { CANONICAL_MODULES, SYSTEM_METADATA } from '../../data/canonicalData';
import { ViewType, CanonicalModule } from '../../types';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { DeepFreezeColdStoragePanel } from '../DeepFreezeColdStoragePanel';
import { MultiverseNavigationGridPanel } from '../MultiverseNavigationGridPanel';
import { ArchiveMerkleTreeVisualizer } from '../archive/ArchiveMerkleTreeVisualizer';
import { exportCanonicalSealArtifactJson } from '../../utils/canonicalSealArtifactExport';
import { downloadForensicBundle } from '../../utils/forensicBundleExport';
import { generateCourtBundlePdf } from '../../utils/courtBundlePdf';
import { SupremeEternumNexusCodex } from '../SupremeEternumNexusCodex';
import { RepositoryChangeAudit } from '../archive/RepositoryChangeAudit';
import { ChambersExplorer } from '../ChambersExplorer';
import QRCode from 'qrcode';

interface ArchiveViewProps {
  onNavigate: (view: ViewType) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onNavigate }) => {
  const [archiveMode, setArchiveMode] = useState<'matrix_18' | 'modules_17'>('matrix_18');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<CanonicalModule>(CANONICAL_MODULES[0]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const handleShareSnapshot = async () => {
    try {
      playTone(600, 0.05);
      const uri = `zyrquen:snapshot:${SYSTEM_METADATA.merkleRoot}`;
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(dataUrl);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR Code', err);
    }
  };

  const filteredModules = CANONICAL_MODULES.filter((m) =>
    m.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.titleTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.num.includes(searchTerm) ||
    m.badge.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subModules.some((s) => s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || s.nameTh.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportManifest = () => {
    const data = {
      system: SYSTEM_METADATA,
      canonicalModules: CANONICAL_MODULES,
      exportTimestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN-OMEGA-17-MODULES-MANIFEST-FROZEN-v1.2.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Architecture Navigation Strip */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0a0f1e] border border-cyan-900/60 p-2 rounded-2xl">
        <button
          onClick={() => {
            playTone(600, 0.03);
            setArchiveMode('matrix_18');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
            archiveMode === 'matrix_18'
              ? 'bg-[#070a12] text-[#06B6D4] border border-[#06B6D4] shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🏛️</span>
          <span>1. 18 Chambers Sovereign Matrix (ผังโครงสร้าง 18 ห้องปฏิบัติการ)</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setArchiveMode('modules_17');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
            archiveMode === 'modules_17'
              ? 'bg-[#070a12] text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>📦</span>
          <span>2. 17 Canonical Modules Manifest Archive</span>
        </button>
      </div>

      {archiveMode === 'matrix_18' ? (
        <ChambersExplorer />
      ) : (
        <>
          {/* Top Banner */}
          <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1628]/90 via-[#0b0e1a]/80 to-[#07080F] border border-white/8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono">
              17 CANONICAL MODULES ARCHIVE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
              DELETE NOTHING GUARANTEE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
            Historical Snapshots & Extension Vault
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Full 17 Architecture Modules (Core, AI, Data, Workflow, Governance, Security, Observability, etc.)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 17 modules or sub-systems..."
              className="pl-9 pr-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 w-64"
            />
          </div>

          <button
            onClick={() => {
              playTone(680, 0.05);
              generateCourtBundlePdf(14902);
              playAuditChime();
            }}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 hover:from-purple-500/40 hover:to-fuchsia-500/40 border border-purple-400/40 text-white font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)]"
            title="Generate Court Bundle PDF for ETDA B.E. 2544 submission"
          >
            <Scale className="w-4 h-4 text-purple-300" />
            <span className="hidden sm:inline">Court Bundle Generator</span>
          </button>
          
          <button
            onClick={handleShareSnapshot}
            className="px-3.5 py-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            title="Share Forensic Snapshot QR Code"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Share Snapshot</span>
          </button>

          <button
            onClick={() => {
              playTone(680, 0.05);
              exportCanonicalSealArtifactJson();
              playAuditChime();
            }}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-violet-600/30 to-cyan-600/30 hover:from-violet-500/40 hover:to-cyan-500/40 border border-violet-400/40 text-white font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(139,92,246,0.25)]"
            title="Export digitally signed canonical seal manifest & block metadata (JSON)"
          >
            <Lock className="w-4 h-4 text-violet-300" />
            <span className="hidden sm:inline">Export Signed Seal Artifact</span>
          </button>

          <button
            onClick={() => {
              playTone(620, 0.05);
              downloadForensicBundle();
              playAuditChime();
            }}
            className="px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            title="Download Forensic Bundle (.zip archive)"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Download Forensic Bundle</span>
          </button>
          
          <button
            onClick={exportManifest}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export Manifest</span>
          </button>
        </div>
      </div>

      {/* 17 Modules Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Modules List */}
        <div className="lg:col-span-5 space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {filteredModules.map((mod) => {
            const isSelected = selectedModule.id === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => {
                  playTone(520, 0.04);
                  setSelectedModule(mod);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-blue-950/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                    : 'bg-[#0b0e1a]/70 border-white/6 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{mod.num}</span>
                    <span className="text-xs font-mono font-bold text-zinc-100">{mod.titleEn}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                    {mod.badge}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono line-clamp-1">{mod.titleTh}</div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 pt-1">
                  <span>{mod.subModules.length} Sub-modules</span>
                  <span>•</span>
                  <span className="text-emerald-400">{mod.metrics[0]?.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 7 Columns: Selected Module Detail & Sub-components */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">MODULE {selectedModule.num}</span>
                <h3 className="text-lg font-mono font-bold text-white mt-0.5">{selectedModule.titleEn}</h3>
                <p className="text-xs font-mono text-zinc-400">{selectedModule.titleTh}</p>
              </div>

              <button
                onClick={() => {
                  playTone(600, 0.05);
                  onNavigate(selectedModule.targetView);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Open View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              {selectedModule.descriptionEn}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {selectedModule.metrics.map((m, idx) => (
                <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-zinc-500 text-[10px] block">{m.label}</span>
                  <span className="text-zinc-200 font-bold block">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Sub-modules list */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Canonical Sub-Components ({selectedModule.subModules.length})
              </div>

              <div className="space-y-2">
                {selectedModule.subModules.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-zinc-200">{sub.nameEn}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{sub.nameTh}</div>
                      <p className="text-[11px] text-zinc-500 font-sans mt-0.5">{sub.descriptionEn}</p>
                    </div>

                    <button
                      onClick={() => {
                        playTone(550, 0.04);
                        onNavigate(sub.targetView);
                      }}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
                    >
                      <span>Jump</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Repository Change Audit: Forensic Time-Series Git Log */}
      <RepositoryChangeAudit />

      {/* Supreme Eternum Nexus Codex Documentation Hub */}
      <SupremeEternumNexusCodex
        onNavigateToLedger={() => onNavigate('ledger')}
        onNavigateToNexus={() => onNavigate('nexus')}
      />

      {/* Comprehensive 14,902 Sealed Blocks Merkle Tree Visualizer */}
      <ArchiveMerkleTreeVisualizer />

      {/* Deep Freeze Cold Storage Background Service Panel */}
      <DeepFreezeColdStoragePanel />

      {/* Multiverse Navigation Grid v15 & Quantum Continuum v14 Panel */}
      <MultiverseNavigationGridPanel />

      {/* QR Code Modal for Share Forensic Snapshot */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsQrModalOpen(false)}>
          <div className="bg-[#0b0d18] border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col items-center gap-4 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsQrModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <h3 className="text-cyan-400 font-bold text-sm tracking-widest">FORENSIC SNAPSHOT URI</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Scan to verify remote audit metadata</p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Snapshot QR Code" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center animate-pulse rounded-xl" />
              )}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono text-center max-w-[200px] break-all">
              zyrquen:snapshot:{SYSTEM_METADATA.merkleRoot}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
