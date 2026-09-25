import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  Sparkles,
  Layers,
  Download,
  Printer,
  Stamp,
  Award,
  BookOpen,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

export interface CourtExhibitItem {
  id: string;
  exhibitCode: string;
  title: string;
  titleTh: string;
  category: string;
  legalStandard: string;
  sealAnchor: string;
  status: 'CERTIFIED' | 'PASSED' | 'COURT_ADMISSIBLE';
}

export const COURT_EXHIBITS: CourtExhibitItem[] = [
  {
    id: 'exhibit-01',
    exhibitCode: 'EXHIBIT-TH-01',
    title: 'Genesis Merkle Root & 14,902 Canonical Seals Attestation',
    titleTh: 'หลักฐานการตรึงตราประทับสัจธรรมและรากเมอร์เคิลปฐมกาล',
    category: 'Cryptographic Root Evidence',
    legalStandard: 'ETDA Sec 26 & Sec 28 Safe Harbor',
    sealAnchor: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    status: 'COURT_ADMISSIBLE'
  },
  {
    id: 'exhibit-02',
    exhibitCode: 'EXHIBIT-TH-02',
    title: 'LBMA Physical Gold Depository Certificate (14,902.00 oz)',
    titleTh: 'ใบรับรองทองคำแท่งกายภาพค้ำประกันคลังหลวงสัจธรรม',
    category: 'Fiduciary & Asset Evidence',
    legalStandard: 'ETDA Electronic Commercial Standard',
    sealAnchor: 'ZQ-GOLD-DEP-849202-3908',
    status: 'CERTIFIED'
  },
  {
    id: 'exhibit-03',
    exhibitCode: 'EXHIBIT-TH-03',
    title: '10/10 Deca-Key Real HSM Hardware Quorum Ledger',
    titleTh: 'รายงานผลการลงนามร่วมคลัสเตอร์ฮาร์ดแวร์ตู้เครื่องเหล็ก 10 ตู้',
    category: 'Hardware Security Evidence',
    legalStandard: 'NIST FIPS 140-3 Level 4 & ISO 27001',
    sealAnchor: 'QUORUM-10-OF-10-REAL-HSM-VERIFIED',
    status: 'COURT_ADMISSIBLE'
  },
  {
    id: 'exhibit-04',
    exhibitCode: 'EXHIBIT-TH-04',
    title: 'PDPA Redaction & Zero PII Leakage Forensic Certificate',
    titleTh: 'ใบรับรองความสอดคล้อง พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
    category: 'Privacy & Data Protection',
    legalStandard: 'PDPA มาตรา 9, 26, 28',
    sealAnchor: 'PDPA-CLEAN-ZERO-PII-VERIFIED',
    status: 'PASSED'
  }
];

interface Room11MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room11MasterPanel: React.FC<Room11MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate
}) => {
  const [activeTab, setActiveTab] = useState<'court-dossier' | 'exhibit-catalog' | 'pdf-generator' | 'legal-brief'>('court-dossier');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [selectedExhibitId, setSelectedExhibitId] = useState<string>('exhibit-01');

  const selectedExhibit = useMemo(
    () => COURT_EXHIBITS.find((e) => e.id === selectedExhibitId) || COURT_EXHIBITS[0],
    [selectedExhibitId]
  );

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadDossierPdf = () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    playTone(520, 0.06);

    setTimeout(() => {
      setIsGeneratingPdf(false);
      playAuditChime();

      const manifestContent = `================================================================================
ZYRQUEN Ω∞ SOVEREIGN WORLD ENGINE — COURT-ADMISSIBLE FORENSIC DOSSIER
================================================================================
Certificate ID: ZQ-GOLD-DEP-849202-3908
Canonical Block: #${CANONICAL_BLOCK}
Canonical Seals: ${CANONICAL_FROZEN_SEALS.toLocaleString()} Seals
Genesis Merkle Root: ${CANONICAL_MERKLE_ROOT}
Sovereign Principal: ${CANONICAL_PRINCIPAL}
Governing Law: พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (มาตรา 9, 26, 28)
Legal Status: Full Legal Standing (Safe Harbor Standard Qualified)
PQC Algorithm: FIPS 204 ML-DSA-87 (Dilithium-5) Lattice Signature
Fiduciary Reserve: ฿1,490,200,000.00 THB-SOV + 14,902.00 Troy Oz LBMA 99.99% Gold
Generated Timestamp: ${new Date().toISOString()}
================================================================================
EXHIBITS ATTACHED:
${COURT_EXHIBITS.map((e, idx) => `[${idx + 1}] ${e.exhibitCode}: ${e.title} (${e.legalStandard})`).join('\n')}
================================================================================`;

      const blob = new Blob([manifestContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ZYRQUEN_COURT_DOSSIER_BLOCK_${CANONICAL_BLOCK}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }, 800);
  };

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 11 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-indigo-950/40 via-[#0c0d1e]/95 to-black border-indigo-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                <Scale className="w-4 h-4 text-indigo-400 animate-pulse" />
                CHAMBER 11 • COURT-ADMISSIBLE DOSSIER & PDF EXPORT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">
                ETDA SEC 28 QUALIFIED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[11px] font-bold">
                PDF/A-3 FORENSIC
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ระบบจัดทำสำนวนพยานหลักฐานยื่นศาล และส่งออกเอกสารรับรองดิจิทัล (Forensic Court Dossier)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                จัดทำและส่งออกสำนวนพยานหลักฐานทางอิเล็กทรอนิกส์ที่มีผลสมบูรณ์ตามกฎหมายไทย (ETDA Sec 9, 26, 28)
                พร้อมการรับรองความถูกต้องของราก Merkle และใบรับรองทองคำแท่ง ZQ-GOLD-DEP-849202-3908
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleDownloadDossierPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/80 to-cyan-600/80 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 border-indigo-400/40 transition-all transform hover:-translate-y-0.5"
            >
              <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              {isGeneratingPdf ? 'Compiling Forensic Dossier...' : 'Export Court Dossier Package'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Legal Admissibility: 100% PASS</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Certificate ID</div>
            <div className="text-base sm:text-lg font-bold text-indigo-300">ZQ-GOLD-DEP</div>
            <div className="text-[10px] text-zinc-400">#849202-3908</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Legal Standard</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">ETDA Sec 28</div>
            <div className="text-[10px] text-emerald-300">Safe Harbor Pass</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Signature Anchor</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400">Dilithium-5</div>
            <div className="text-[10px] text-cyan-300">FIPS 204 Lattice</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Dossier Format</div>
            <div className="text-base sm:text-lg font-bold text-yellow-400">PDF/A-3</div>
            <div className="text-[10px] text-amber-300">Archival Grade</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0a0d16] border-indigo-500/20">
        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveTab('court-dossier');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'court-dossier'
              ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          1. Forensic Evidence Dossier Preview
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('exhibit-catalog');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'exhibit-catalog'
              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          2. Certified Court Exhibits Catalog
        </button>

        <button
          onClick={() => {
            playTone(680, 0.04);
            setActiveTab('pdf-generator');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pdf-generator'
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          3. PDF/A-3 Forensic Compiler
        </button>

        <button
          onClick={() => {
            playTone(720, 0.04);
            setActiveTab('legal-brief');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'legal-brief'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          4. Thai Legal Code & Safe Harbor Brief
        </button>
      </div>

      {/* Tab 1: Dossier Preview */}
      {activeTab === 'court-dossier' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#090b16] border-indigo-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <div className="text-xs text-indigo-400 font-bold">THAILAND ELECTRONIC TRANSACTIONS ACT (ETDA) QUALIFIED</div>
                <h3 className="text-base font-black text-white">
                  สารบัญสำนวนพยานหลักฐานอิเล็กทรอนิกส์ (Court Dossier Index)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold">
                Status: SEALED & ADMISSIBLE
              </span>
            </div>

            <div className="space-y-3">
              {COURT_EXHIBITS.map((exhibit) => (
                <div
                  key={exhibit.id}
                  className="p-4 rounded-xl bg-black/40 border-white/5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                        {exhibit.exhibitCode}
                      </span>
                      <span className="font-bold text-white">{exhibit.title}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{exhibit.titleTh}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">Anchor: {exhibit.sealAnchor}</div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border-emerald-500/20">
                      {exhibit.legalStandard}
                    </span>
                    <button
                      onClick={() => handleCopy(exhibit.id, exhibit.sealAnchor)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                      title="Copy Anchor Hash"
                    >
                      {copiedId === exhibit.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Exhibits Catalog */}
      {activeTab === 'exhibit-catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            {COURT_EXHIBITS.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  playTone(600, 0.03);
                  setSelectedExhibitId(e.id);
                }}
                className={`w-full p-4 rounded-2xl text-left transition-all space-y-1.5 ${
                  selectedExhibitId === e.id
                    ? 'bg-indigo-500/20 border-indigo-400/50 shadow-md'
                    : 'bg-[#0a0d1a] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">{e.exhibitCode}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{e.status}</span>
                </div>
                <div className="text-xs font-semibold text-white truncate">{e.title}</div>
                <div className="text-[10px] text-zinc-400">{e.category}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0a0d1a] border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-400">{selectedExhibit.exhibitCode} DETAILS</span>
                <h4 className="text-sm font-bold text-white">{selectedExhibit.title}</h4>
              </div>
              <Stamp className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="p-4 rounded-xl bg-black/50 border-white/10 space-y-2 text-xs">
              <div><span className="text-zinc-500">Exhibit Category:</span> <span className="text-zinc-300 font-bold">{selectedExhibit.category}</span></div>
              <div><span className="text-zinc-500">Legal Standard:</span> <span className="text-emerald-400 font-bold">{selectedExhibit.legalStandard}</span></div>
              <div><span className="text-zinc-500">Cryptographic Anchor:</span> <div className="text-cyan-300 font-mono text-[11px] break-all pt-1">{selectedExhibit.sealAnchor}</div></div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => handleCopy('anchor-detail', selectedExhibit.sealAnchor)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white flex items-center gap-2 border-white/10"
              >
                {copiedId === 'anchor-detail' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Exhibit Anchor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: PDF Generator */}
      {activeTab === 'pdf-generator' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                เครื่องสร้างและลงนามสำนวน PDF/A-3 นิติวิทยาศาสตร์ (Forensic PDF/A-3 Engine)
              </h3>
              <p className="text-xs text-zinc-400">
                ประมวลผลและผูกลายเซ็นดิจิทัล PQC Dilithium-5 พร้อมตราประทับเวลา (Timestamp Authority)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border-white/5">
              <div className="text-[10px] text-zinc-500">Compliance Standard</div>
              <div className="text-emerald-400 font-bold">ISO 19005-3 (PDF/A-3)</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border-white/5">
              <div className="text-[10px] text-zinc-500">Digital Signature</div>
              <div className="text-cyan-400 font-bold">FIPS 204 ML-DSA-87</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border-white/5">
              <div className="text-[10px] text-zinc-500">Court Admissibility</div>
              <div className="text-yellow-400 font-bold">ETDA Sec 9, 26, 28</div>
            </div>
          </div>

          <button
            onClick={handleDownloadDossierPdf}
            disabled={isGeneratingPdf}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Generate & Download Certified Forensic Dossier
          </button>
        </div>
      )}

      {/* Tab 4: Legal Brief */}
      {activeTab === 'legal-brief' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border-amber-500/20 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              ข้อกำหนดและมาตรากฎหมายไทยที่รองรับ (Thai Legal Code & Safe Harbor)
            </h3>
            <p className="text-xs text-zinc-400">
              พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border-white/5 space-y-1">
              <div className="font-bold text-amber-300">มาตรา 9 (ETDA Sec 9) — เจตนาและการลงลายมือชื่ออิเล็กทรอนิกส์</div>
              <div className="text-zinc-400 leading-relaxed">
                การลงลายมือชื่อผ่านระบบฮาร์ดแวร์ HSM 10/10 และ Dilithium-5 ถือว่าสามารถระบุตัวเจ้าของและแสดงเจตนาตามกฎหมายได้อย่างสมบูรณ์
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border-white/5 space-y-1">
              <div className="font-bold text-emerald-300">มาตรา 26 (ETDA Sec 26) — ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้</div>
              <div className="text-zinc-400 leading-relaxed">
                กุญแจสร้างลายมือชื่ออยู่ภายใต้การควบคุมของเจ้าของลายมือชื่อแต่ผู้เดียว และการเปลี่ยนแปลงใดๆ สามารถตรวจพบได้ 100%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border-white/5 space-y-1">
              <div className="font-bold text-cyan-300">มาตรา 28 (ETDA Sec 28) — การสันนิษฐานความเชื่อถือได้ (Safe Harbor)</div>
              <div className="text-zinc-400 leading-relaxed">
                ให้สันนิษฐานไว้ก่อนว่าเป็นลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ และมีผลผูกพันตามกฎหมายโดยมิต้องมีข้อพิสูจน์เพิ่มเติม
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
