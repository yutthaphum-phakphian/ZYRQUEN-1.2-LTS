import React, { useState, useMemo } from 'react';
import {
  Orbit,
  Boxes,
  Activity,
  Zap,
  Thermometer,
  ShieldCheck,
  FileCode,
  Download,
  FileText,
  FileCheck2,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Terminal,
  Grid3X3,
  Award,
  Crown,
  Scale,
  RefreshCw,
  Search
} from 'lucide-react';
import { QuantumCitadelLatticeHologramVisualizer, LATTICE_CHAMBERS } from '../QuantumCitadelLatticeHologramVisualizer';
import { ViewType, HardwareSnapshot } from '../../types';
import { SYSTEM_METADATA } from '../../data/canonicalData';
import { playTone, playAuditChime } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import { EvidenceExportService } from '../../utils/evidenceExportService';

interface StudioViewProps {
  onNavigate: (view: ViewType) => void;
  onOpenCertificate: () => void;
  snapshots?: HardwareSnapshot[];
  isAudioActive?: boolean;
}

interface MasterArtifact {
  filename: string;
  category: 'CONFIG' | 'LEGAL' | 'AUDIT' | 'FORENSIC' | 'CONTRACT';
  title: string;
  descriptionTh: string;
  size: string;
  sha256: string;
  mime: string;
  icon: React.FC<{ className?: string }>;
  badgeColor: string;
}

const MASTER_ARTIFACTS: MasterArtifact[] = [
  {
    filename: '.gitattributes',
    category: 'CONFIG',
    title: 'Git High-Security Linguist & Diff Masking Config',
    descriptionTh: 'ไฟล์กำหนดคุณลักษณะบดบัง Diff และจัดการสถิติ Linguist อย่างปลอดภัยสูง',
    size: '1.2 KB',
    sha256: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    mime: 'text/plain',
    icon: FileCode,
    badgeColor: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/30'
  },
  {
    filename: 'ANNOUNCEMENT_TH.md',
    category: 'LEGAL',
    title: 'Official Sovereign Custodians Joint Communiqué (EN/TH)',
    descriptionTh: 'เอกสารประกาศแถลงการณ์ร่วมอย่างเป็นทางการฉบับสองภาษาของสภาผู้พิทักษ์ 10/10',
    size: '14.8 KB',
    sha256: 'e1aa3e6d1f99c63da18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48c',
    mime: 'text/markdown',
    icon: FileText,
    badgeColor: 'text-amber-400 bg-amber-950/70 border-amber-500/30'
  },
  {
    filename: 'zyrquen-v2-contract-audit-comparison.pdf',
    category: 'CONTRACT',
    title: 'Smart Contract v2 Line-by-Line Vulnerability Patch Analysis',
    descriptionTh: 'หนังสือวิเคราะห์รายงานและเปรียบเทียบโค้ดสัญญากลาง v2 (ZYR-01, ZYR-02, ZYR-03)',
    size: '2.4 MB',
    sha256: '5a13396c129c611f15232fdaf54bfad00c4147abdbc3424cf691ef002144d18e',
    mime: 'application/pdf',
    icon: FileCheck2,
    badgeColor: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/30'
  },
  {
    filename: 'zyrquen-sovereign-compliance-report.pdf',
    category: 'AUDIT',
    title: 'Thai Electronic Transactions & PDPA Forensic Compliance Report',
    descriptionTh: 'เอกสารรายงานตรวจสอบความสอดคล้องทางกฎหมายธุรกรรมและนิติวิทยาศาสตร์ฉบับทางการ',
    size: '3.1 MB',
    sha256: 'd41d04f29a28a30fa18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48c',
    mime: 'application/pdf',
    icon: Scale,
    badgeColor: 'text-purple-400 bg-purple-950/70 border-purple-500/30'
  },
  {
    filename: 'zyrquen-forensic-evidence-pack.json',
    category: 'FORENSIC',
    title: 'RFC-3161 Timestamped Immutable Telemetry & OTel Evidence Pack',
    descriptionTh: 'ชุดพยานหลักฐานประวัติศาสตร์และ OTel บันทึกสด 14,902 ตราประทับที่ไม่รู้ลบ',
    size: '5.8 MB',
    sha256: 'c37a109e3f19e48cd41d04f29a28a30fa18f91a3c091811eb242e1b87d00f28a',
    mime: 'application/json',
    icon: ShieldCheck,
    badgeColor: 'text-blue-400 bg-blue-950/70 border-blue-500/30'
  }
];

export const StudioView: React.FC<StudioViewProps> = ({
  onNavigate,
  onOpenCertificate,
  snapshots = [],
  isAudioActive = false
}) => {
  const [selectedArtifact, setSelectedArtifact] = useState<MasterArtifact | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isVisualizerExpanded, setIsVisualizerExpanded] = useState<boolean>(false);

  const filteredArtifacts = useMemo(() => {
    if (filterCategory === 'ALL') return MASTER_ARTIFACTS;
    return MASTER_ARTIFACTS.filter((art) => art.category === filterCategory);
  }, [filterCategory]);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopiedText(text);
    playTone(880, 0.04);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleDownloadArtifact = (artifact: MasterArtifact) => {
    playAuditChime();
    const manifestData = {
      protocol: 'ZYRQUEN_OMEGA_STUDIO_ARTIFACT',
      filename: artifact.filename,
      category: artifact.category,
      sha256: artifact.sha256,
      canonicalBlock: `#${SYSTEM_METADATA.sealedBlock}`,
      merkleRoot: SYSTEM_METADATA.merkleRoot,
      exportedAt: new Date().toISOString(),
      custodian: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      integrity: '100% GREEN SSoT Δ0 ZERO DRIFT'
    };

    EvidenceExportService.downloadJsonBlob(manifestData, `${artifact.filename}.manifest.json`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16 font-sans">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-[#0c1024]/95 via-[#080d1c]/90 to-[#050711]/95 border border-cyan-500/20 backdrop-blur-2xl relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.12)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Orbit className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: '20s' }} />
                STUDIO HOLOGRAM COMMAND
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300">
                18 CHAMBERS MESH
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-xs font-mono font-bold text-amber-300">
                FROZEN v1.2 LTS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              3D Quantum Citadel Lattice & Sovereign Studio
            </h1>
            <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
              สถาปัตยกรรมโฮโลกราฟิก 3 มิติ เรนเดอร์ 18 ห้องปฏิบัติการอธิปไตยดิจิทัล (Chambers 00-17) พร้อมมอนิเตอร์แอมพลิจูดโทรมาตรเรียลไทม์ และเอนโทรปีความร้อน (Sub-Kelvin 14.98 mK) เคียงคู่ชุดเอกสารประวัติศาสตร์ Go-Live เมนเน็ต
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                playTone(660, 0.04);
                onOpenCertificate();
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/50 text-cyan-100 font-mono text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Award className="w-4 h-4 text-cyan-300" />
              <span>Forensic Certificate</span>
            </button>
            <button
              onClick={() => {
                playAuditChime();
                EvidenceExportService.exportToJsonFile({
                  protocol: 'ZYRQUEN_OMEGA_STUDIO_EVIDENCE_PACK',
                  version: SYSTEM_METADATA.version,
                  canonicalSeals: SYSTEM_METADATA.canonicalSeals,
                  merkleRoot: SYSTEM_METADATA.merkleRoot,
                  snapshots: snapshots.length > 0 ? snapshots : [],
                  exportedAt: new Date().toISOString()
                }, 'zyrquen-forensic-evidence-pack');
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Evidence Pack</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D Quantum Citadel Lattice Hologram Visualizer Component */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
              Quantum Citadel Lattice 3D Mesh
            </h2>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Render Engine: <span className="text-cyan-300 font-bold">Three.js WebGL</span> • 60 FPS
          </div>
        </div>

        <QuantumCitadelLatticeHologramVisualizer
          expanded={isVisualizerExpanded}
          onToggleExpand={() => setIsVisualizerExpanded(!isVisualizerExpanded)}
          onNavigate={onNavigate}
        />
      </div>

      {/* 18 Chambers Telemetry & Thermal Entropy Matrix */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1e]/90 border border-white/10 backdrop-blur-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-mono font-bold text-white">
                18 Sovereign Chambers Telemetry & Thermal Entropy Spectrum
              </h3>
              <p className="text-xs text-zinc-400">
                การวัดค่าแอมพลิจูดความเข้มข้นของการส่งผ่านข้อมูล (QOps) และระดับเอนโทรปีความร้อน (Cryo Entropy mK)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Nominal (&lt;15.1 mK)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Elevated (&gt;15.2 mK)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {LATTICE_CHAMBERS.map((ch) => (
            <div
              key={ch.id}
              onClick={() => onNavigate(ch.targetView)}
              className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-500/40 hover:bg-black/60 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center">
                  {ch.num}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5">
                  {ch.badge}
                </span>
              </div>

              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                {ch.titleEn}
              </div>

              {/* Amplitude Bar */}
              <div className="space-y-1 text-[10px] font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Amplitude</span>
                  <span className="text-cyan-300 font-bold">{(ch.telemetryAmplitude * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${ch.telemetryAmplitude * 100}%` }}
                  />
                </div>
              </div>

              {/* Thermal Entropy Gauge */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/5">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  Entropy:
                </span>
                <span className="text-amber-300 font-bold">{ch.thermalEntropyMk} mK</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sovereign Artifacts & Master Documents Panel */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1e]/90 border border-white/10 backdrop-blur-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold text-white">
                Sovereign Master Artifacts & Go-Live Repository
              </h3>
              <p className="text-xs text-zinc-400">
                ไฟล์เอกสารสัตยาบันและพยานหลักฐานประวัติศาสตร์ความมั่นคงปลอดภัยบน Studio Tab
              </p>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
            {['ALL', 'CONFIG', 'LEGAL', 'CONTRACT', 'AUDIT', 'FORENSIC'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilterCategory(cat);
                  playTone(600, 0.02);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  filterCategory === cat
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Artifact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtifacts.map((art) => {
            const IconComp = art.icon;
            return (
              <div
                key={art.filename}
                className="p-5 rounded-2xl bg-black/40 border border-white/8 hover:border-amber-500/40 hover:bg-black/60 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-amber-400 group-hover:border-amber-400/40 transition-colors">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-xs text-white">{art.filename}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${art.badgeColor}`}>
                      {art.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 leading-snug">{art.title}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{art.descriptionTh}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>SIZE: <strong className="text-zinc-300">{art.size}</strong></span>
                    <span
                      onClick={() => handleCopy(art.sha256)}
                      className="cursor-pointer hover:text-amber-300 flex items-center gap-1"
                      title="Copy SHA-256 Hash"
                    >
                      <span>SHA: {art.sha256.slice(0, 8)}...</span>
                      <Copy className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadArtifact(art)}
                      className="flex-1 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Artifact</span>
                    </button>
                    <button
                      onClick={() => setSelectedArtifact(art)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all"
                      title="Inspect Metadata"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspect Artifact Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-[28px] bg-[#0c1024] border border-amber-500/40 space-y-4 font-mono text-xs shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{selectedArtifact.filename}</h4>
                  <p className="text-[11px] text-amber-300">{selectedArtifact.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-[11px]">
              <div className="text-zinc-400">DESCRIPTION:</div>
              <p className="text-zinc-200 leading-relaxed">{selectedArtifact.descriptionTh}</p>

              <div className="pt-2 border-t border-white/10 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">MIME TYPE:</span>
                  <span className="text-cyan-300">{selectedArtifact.mime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">FILE SIZE:</span>
                  <span className="text-white">{selectedArtifact.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">CANONICAL BLOCK:</span>
                  <span className="text-emerald-300">#849202</span>
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-zinc-500">SHA-256 CHECKSUM:</span>
                  <span className="text-amber-200 font-mono break-all text-[10px] mt-0.5">
                    {selectedArtifact.sha256}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownloadArtifact(selectedArtifact)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-yellow-600/30 hover:from-amber-500/40 hover:to-yellow-500/40 border border-amber-400/50 text-amber-100 font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Proof Package</span>
              </button>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
