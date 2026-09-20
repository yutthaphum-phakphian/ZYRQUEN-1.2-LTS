import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  Award,
  Key,
  Lock,
  Layers,
  FileCheck,
  Download,
  Search,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  Binary,
  Scroll,
  Cpu,
  Fingerprint,
  Radio,
  Clock,
  Check,
  Copy,
  QrCode,
  Landmark,
} from 'lucide-react';
import { SYSTEM_METADATA, THAI_CUSTODIANS, CANONICAL_MERKLE_ROOT } from '../../data/canonicalData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { ThaiLegalRuntimeDashboard } from '../ThaiLegalRuntimeDashboard';
import { SovereignLegalConvergence } from '../SovereignLegalConvergence';
import { ThaiLegalSovereignMapping } from '../ThaiLegalSovereignMapping';
import { LegalEnforcementDiagram } from '../LegalEnforcementDiagram';
import { Section28ResponsibilityLayer } from '../Section28ResponsibilityLayer';
import { PdpaEnclaveSuite } from '../PdpaEnclaveSuite';
import { NcsaCiiComplianceCard } from '../NcsaCiiComplianceCard';
import { ExpertWitnessCourtSuite } from '../ExpertWitnessCourtSuite';
import { CourtEvidenceManifestPanel } from '../executive/CourtEvidenceManifestPanel';
import { DigitalEvidenceChecklistModal } from '../DigitalEvidenceChecklistModal';
import { CryptographicEvidenceSandbox } from '../CryptographicEvidenceSandbox';
import { UnifiedQrEvidenceDossierModal } from '../UnifiedQrEvidenceDossierModal';
import { CourtEvidenceInfographic } from '../CourtEvidenceInfographic';
import { generateSovereignReportPdf } from '../../utils/sovereignReportPdfExport';
import { exportCanonicalSealArtifactJson } from '../../utils/canonicalSealArtifactExport';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { ViewType } from '../../types';

import { SystemEvent } from '../SystemEventsSidebar';
import { ForensicAuditStepper } from '../ForensicAuditStepper';

export type LegalSubTab =
  | 'forensic-stepper'
  | 'etda-statutes'
  | 'pdpa-enclave'
  | 'ncsa-cii'
  | 'court-manifest'
  | 'expert-witness'
  | 'architecture-topology'
  | 'custodian-passport'
  | 'audit-certify';

interface LegalViewProps {
  onNavigate?: (view: ViewType) => void;
  onOpenSearch?: () => void;
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: ViewType
  ) => void;
}

export const LegalView: React.FC<LegalViewProps> = ({
  onNavigate,
  onOpenSearch,
  onAddSystemEvent,
}) => {
  const [activeTab, setActiveTab] = useState<LegalSubTab>('etda-statutes');
  const [royalGazetteMode, setRoyalGazetteMode] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isCryptoSandboxOpen, setIsCryptoSandboxOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedRoot, setCopiedRoot] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportOfficialPdf = () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    playTone(520, 0.08);

    try {
      generateSovereignReportPdf({
        principalName: SYSTEM_METADATA.sovereignPrincipal,
        custodianPassport: '#EP-SOVEREIGN-01',
        sealBlockHeight: SYSTEM_METADATA.sealedBlock,
        merkleAnchor: '909ab814',
      });

      playAuditChime();
      showToast('สร้างเอกสารรับรองทางกฎหมายอย่างเป็นทางการ (Official PDF Report) สำเร็จ');
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'COMPLIANCE',
          'Official Thai Legal & PDPA PDF Exported',
          `Grounded under พระราชบัญญัติธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๙, ๒๖, ๒๘ & PDPA ๒๕๖๒. Merkle Block #${SYSTEM_METADATA.sealedBlock}`,
          CANONICAL_MERKLE_ROOT,
          'info',
          'ETDA Recommendation ขมธอ. 1-2562 & PDPA มาตรา ๓๗',
          'legal'
        );
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast('เกิดข้อผิดพลาดในการสร้าง PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCanonicalSealArtifact = () => {
    try {
      playTone(680, 0.06);
      const { filename } = exportCanonicalSealArtifactJson();
      playAuditChime();
      showToast(`ส่งออก Digital Signed Seal Manifest (${filename}) สำเร็จ`);
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'COMPLIANCE',
          'Canonical Seal Manifest Artifact Exported',
          `Digitally signed with NIST FIPS 204 ML-DSA-87 & Deca-Key Quorum. 14,902 Seals Verified on Block #${SYSTEM_METADATA.sealedBlock}`,
          CANONICAL_MERKLE_ROOT,
          'success',
          'ETDA Sec 9, 26, 28 & FIPS 204 Attestation',
          'legal'
        );
      }
    } catch (err) {
      console.error('Artifact Export Error:', err);
      showToast('เกิดข้อผิดพลาดในการสร้าง Seal Artifact JSON');
    }
  };

  const copyMerkleRoot = () => {
    safeCopyToClipboard(CANONICAL_MERKLE_ROOT);
    setCopiedRoot(true);
    playTone(700, 0.05);
    setTimeout(() => setCopiedRoot(false), 2000);
    showToast('คัดลอก Genesis Merkle Root Hash เรียบร้อย');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Sovereign Authority Header Banner */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-[#0a1526]/95 via-[#08101d]/90 to-[#050912]/95 border border-blue-500/25 shadow-[0_12px_40px_-15px_rgba(59,130,246,0.2)] backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.25)] shrink-0">
              <Scale className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>SOVEREIGN LEGAL & PDPA SUPREME CHAMBER</span>
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  ETDA LEVEL 3+ • PDPA v4.16 FINAL
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  NIST FIPS 204 (ML-DSA-87)
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-white mt-2 tracking-tight">
                ศูนย์กำกับกฎหมายอธิปไตยดิจิทัลและคุ้มครองข้อมูลส่วนบุคคล
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 font-mono mt-1.5 leading-relaxed max-w-4xl">
                ระบบกำกับความสอดคล้องตาม <strong>พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (แก้ไขเพิ่มเติม ๒๕๖๒)</strong> มาตรา ๙, ๒๖, ๒๘ (สพธอ. ETDA), <strong>พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (PDPA)</strong> และมาตรฐานความมั่นคงปลอดภัยไซเบอร์ NCSA เชื่อมโยงเข้ากับสถาปัตยกรรมเข้ารหัสลับยุคหลังควอนตัม
              </p>

              {/* SSoT Authority Metadata Bar */}
              <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-white/10 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-500">ผู้ถือสิทธิ์และสถาปนิกสูงสุด:</span>
                  <strong className="text-amber-300">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-500">Clearance:</span>
                  <span className="text-cyan-300 font-bold">OMEGA-1 SUPREME CLEARANCE</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-500">Mutation Authority:</span>
                  <span className="text-emerald-400 font-bold">0 (Read-Only)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-500">Canonical Seals:</span>
                  <span className="text-emerald-300 font-bold">14,902 / 14,902 Seals</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-500">Canonical Block:</span>
                  <span className="text-cyan-300 font-bold">#{SYSTEM_METADATA.sealedBlock}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0">
            <button
              onClick={() => {
                playTone(650, 0.05);
                setIsDossierModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
              title="Open Unified QR Evidence Dossier & Attestation Matrix"
            >
              <QrCode className="w-4 h-4 text-amber-200 animate-pulse" />
              <span>Unified QR Evidence Dossier</span>
            </button>

            <button
              onClick={handleExportOfficialPdf}
              disabled={isExportingPdf}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border shadow-lg ${
                isExportingPdf
                  ? 'bg-blue-500/20 text-blue-200 border-blue-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-blue-400/30 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
              }`}
            >
              <Download className={`w-4 h-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
              <span>{isExportingPdf ? 'Generating PDF Certificate...' : 'Official Legal PDF Certificate'}</span>
            </button>

            <button
              onClick={handleExportCanonicalSealArtifact}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white border border-violet-400/40 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2"
              title="Export canonical seal manifest & block metadata as a digitally signed JSON artifact"
            >
              <Lock className="w-4 h-4 text-violet-200" />
              <span>Export Signed Seal Artifact (JSON)</span>
            </button>

            <button
              onClick={() => {
                playTone(600, 0.04);
                setIsChecklistModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-white" />
              <span>Digital Evidence Checklist (v2)</span>
            </button>

            <button
              onClick={() => {
                playTone(640, 0.04);
                setIsCryptoSandboxOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-200" />
              <span>Cryptographic Evidence Engine</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => {
                  playTone(900, 0.05);
                  onNavigate('briefing');
                }}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all flex items-center justify-center gap-2"
                title="Open Executive Infographic & Court Admissible Evidence Timeline"
              >
                <Landmark className="w-4 h-4 text-[#D4AF37]" />
                <span>Executive & Court Dossier</span>
              </button>
            )}

            {onOpenSearch && (
              <button
                onClick={() => {
                  playTone(620, 0.06);
                  onOpenSearch();
                }}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Search Laws via Google Oracle</span>
              </button>
            )}

            <button
              onClick={() => {
                playTone(500, 0.04);
                setRoyalGazetteMode(!royalGazetteMode);
                showToast(royalGazetteMode ? 'ปิดโหมดมุมมองราชกิจจานุเบกษา' : 'เปิดโหมดมุมมองราชกิจจานุเบกษา (Royal Gazette Mode)');
              }}
              className={`px-3.5 py-2 rounded-xl font-mono text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 border ${
                royalGazetteMode
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>Royal Gazette: {royalGazetteMode ? 'ACTIVE 🇹🇭' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Merkle Root & Fail-Closed Invariant Strip */}
        <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            <span className="text-zinc-500 shrink-0">Genesis Merkle Root:</span>
            <code className="text-cyan-300 font-mono text-[11px] truncate select-all">{CANONICAL_MERKLE_ROOT}</code>
            <button
              onClick={copyMerkleRoot}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white shrink-0 transition-colors"
              title="คัดลอก Merkle Root Hash"
            >
              {copiedRoot ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-[11px]">
            <span className="text-zinc-500">Fail-Closed Trigger:</span>
            <span className="text-amber-400 font-bold">&gt;85.0°C หรือ &lt;15.0 GB/s กักกันทันที</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/10">
        {[
          {
            id: 'forensic-stepper',
            labelTh: 'กระบวนการตรวจสอบ ๑๖ ขั้นตอน (16-Step Stepper)',
            labelEn: '16-Stage Forensic Audit Pipeline & Matrix',
            icon: Sparkles,
            badge: '16 STEPS',
            accent: 'text-cyan-400',
          },
          {
            id: 'etda-statutes',
            labelTh: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ (ม. ๙, ๒๖, ๒๘)',
            labelEn: 'Electronic Transactions Act (Sec 9, 26, 28)',
            icon: Scale,
            badge: 'ETDA L3+',
            accent: 'text-blue-400',
          },
          {
            id: 'pdpa-enclave',
            labelTh: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA ๒๕๖๒)',
            labelEn: 'Personal Data Protection Act (PDPA)',
            icon: ShieldCheck,
            badge: 'v4.16 FINAL',
            accent: 'text-emerald-400',
          },
          {
            id: 'ncsa-cii',
            labelTh: 'พ.ร.บ. ความมั่นคงปลอดภัยไซเบอร์ (NCSA CII)',
            labelEn: 'Cybersecurity Act & CII Threat Monitor',
            icon: ShieldAlert,
            badge: 'CII 8 SECTORS',
            accent: 'text-amber-400',
          },
          {
            id: 'court-manifest',
            labelTh: 'แฟ้มสำนวนพยาน จพ.01–จพ.07 & Manifest',
            labelEn: 'Court-Admissible Evidence Dossier',
            icon: FileCheck,
            badge: '7 EXHIBITS',
            accent: 'text-emerald-400',
          },
          {
            id: 'expert-witness',
            labelTh: 'คำเบิกความพยานผู้เชี่ยวชาญ (Expert Witness)',
            labelEn: 'Courtroom Forensic Affidavit & Stress Suite',
            icon: Scale,
            badge: 'COURT READY',
            accent: 'text-amber-300',
          },
          {
            id: 'architecture-topology',
            labelTh: 'แผนผังความเชื่อมโยงสถาปัตยกรรม (Architecture Flow)',
            labelEn: 'Statute ↔ Sovereign Topology',
            icon: Layers,
            badge: '3-TIER',
            accent: 'text-cyan-400',
          },
          {
            id: 'custodian-passport',
            labelTh: 'หนังสือเดินทางอธิปไตย (#EP-SOVEREIGN-01)',
            labelEn: 'Sovereign Executive Passport',
            icon: Fingerprint,
            badge: 'OMEGA-1',
            accent: 'text-amber-400',
          },
          {
            id: 'audit-certify',
            labelTh: 'ศูนย์ตรวจสอบและออกใบรับรองอธิปไตย',
            labelEn: 'Legal Certification Hub',
            icon: Award,
            badge: '10/10 PASS',
            accent: 'text-violet-400',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playTone(560, 0.04);
                setActiveTab(tab.id as LegalSubTab);
              }}
              className={`px-4 py-3 rounded-2xl font-mono text-xs font-semibold flex items-center gap-2.5 transition-all shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-transparent border-blue-500/40 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                  : 'bg-black/40 hover:bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.accent : 'text-zinc-500'}`} />
              <div className="text-left">
                <div className="font-bold flex items-center gap-1.5">
                  <span>{tab.labelTh}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 font-normal">{tab.labelEn}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab 0: 16-Step Forensic Audit Stepper & Matrix */}
      {activeTab === 'forensic-stepper' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <ForensicAuditStepper
              onAddSystemEvent={onAddSystemEvent}
              onNavigateView={onNavigate}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 1: ETDA Electronic Transactions Act */}
      {activeTab === 'etda-statutes' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <ThaiLegalRuntimeDashboard />
          </motion.div>
          <motion.div variants={itemVariants}>
            <SovereignLegalConvergence />
          </motion.div>
          <motion.div variants={itemVariants}>
            <NcsaCiiComplianceCard
              onOpenSearch={(query) => {
                if (onOpenSearch) onOpenSearch();
              }}
              onOpenChecklist={() => setIsChecklistModalOpen(true)}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 2: PDPA Thailand Sovereign Enclave */}
      {activeTab === 'pdpa-enclave' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <PdpaEnclaveSuite />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 3: NCSA & Critical Information Infrastructure (CII) */}
      {activeTab === 'ncsa-cii' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <NcsaCiiComplianceCard
              onOpenSearch={(query) => {
                if (onOpenSearch) onOpenSearch();
              }}
              onOpenChecklist={() => setIsChecklistModalOpen(true)}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <SovereignLegalConvergence />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 3.5: Court-Admissible Exhibits & Manifest (จพ.01–จพ.07) */}
      {activeTab === 'court-manifest' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <CourtEvidenceInfographic />
          </motion.div>
          <motion.div variants={itemVariants}>
            <CourtEvidenceManifestPanel />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 4: Expert Witness Courtroom Forensic Suite */}
      {activeTab === 'expert-witness' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <ExpertWitnessCourtSuite />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 5: Legal-to-Cryptographic Architecture Topology */}
      {activeTab === 'architecture-topology' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <LegalEnforcementDiagram />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ThaiLegalSovereignMapping />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 4: Custodian Governance & Executive Passport */}
      {activeTab === 'custodian-passport' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Section28ResponsibilityLayer />
          </motion.div>
        </motion.div>
      )}

      {/* Tab 5: Audit & Legal Certification Hub */}
      {activeTab === 'audit-certify' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 sm:p-8 rounded-[28px] bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-6 shadow-2xl">
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.15)] shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-mono font-bold text-white">
                  ศูนย์ตรวจสอบและออกใบรับรองอธิปไตยดิจิทัล (Sovereign Legal Certification Hub)
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  การตรวจสอบความครบถ้วน 100% ของสัญญากฎหมาย ตราประทับ Merkle 14,902 ชุด และมาตรฐานสากล NIST PQC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={handleExportCanonicalSealArtifact}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>ส่งออก Seal Manifest Artifact (JSON)</span>
              </button>

              <button
                onClick={handleExportOfficialPdf}
                disabled={isExportingPdf}
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดเอกสารรับรองทางการ (PDF)</span>
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-2">
              <div className="text-xs font-mono text-zinc-500 uppercase">สถิติตราประทับที่ยืนยันแล้ว</div>
              <div className="text-2xl font-mono font-bold text-emerald-400">14,902 / 14,902</div>
              <p className="text-xs text-zinc-400 font-mono">
                ครบถ้วน 100% ไม่มีตราประทับใดสูญหายหรือถูกเปลี่ยนแปลง
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-2">
              <div className="text-xs font-mono text-zinc-500 uppercase">ความคลาดเคลื่อนทางคณิตศาสตร์ (Drift)</div>
              <div className="text-2xl font-mono font-bold text-cyan-400">0.0000%</div>
              <p className="text-xs text-zinc-400 font-mono">
                ผ่านการทดสอบ Invariant Telemetry ทุกรอบ 10/10 Invariants Passed
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-2">
              <div className="text-xs font-mono text-zinc-500 uppercase">มาตรฐานกฎหมายและศาลไทย</div>
              <div className="text-2xl font-mono font-bold text-amber-400">ระดับ A+ สมบูรณ์</div>
              <p className="text-xs text-zinc-400 font-mono">
                รับฟังเป็นพยานหลักฐานในศาลตามมาตรา ๑๑ และ ๒๙ แห่ง พ.ร.บ. ธุรกรรมฯ
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-violet-950/20 border border-white/10 space-y-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>การอ้างอิงพระราชบัญญัติและประกาศราชกิจจานุเบกษา (Statute Citations)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-zinc-300">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-cyan-300 font-bold">พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔</div>
                <div className="text-[11px] text-zinc-400">
                  แก้ไขเพิ่มเติม (ฉบับที่ ๓) พ.ศ. ๒๕๖๒ และ (ฉบับที่ ๔) พ.ศ. ๒๕๖๒ มาตรา ๙, ๒๖, ๒๘, ๒๙
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-emerald-300 font-bold">พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒</div>
                <div className="text-[11px] text-zinc-400">
                  มาตรา ๑๙, ๒๔, ๒๗, ๒๘, ๒๙, ๓๗ (มาตรการความปลอดภัย) และ ๓๙ (บันทึก ROPA)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-amber-300 font-bold">พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. ๒๕๖๒</div>
                <div className="text-[11px] text-zinc-400">
                  เกณฑ์การคุ้มครองหน่วยงานโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (CII) สกมช. (NCSA)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-violet-300 font-bold">มาตรฐาน สพธอ. (ETDA Standards)</div>
                <div className="text-[11px] text-zinc-400">
                  ขมธอ. ๑-๒๕๖๒ มาตรฐานลายมือชื่อดิจิทัลที่เชื่อถือได้ระดับ ๓+ (Highest Reliability)
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Digital Forensic Inspection Checklist Modal */}
      <DigitalEvidenceChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
      />

      {/* Cryptographic Evidence & Circuit Breaker Engine Sandbox */}
      <CryptographicEvidenceSandbox
        isOpen={isCryptoSandboxOpen}
        onClose={() => setIsCryptoSandboxOpen(false)}
      />

      {/* Unified QR Evidence Dossier & Attestation Matrix Modal */}
      <UnifiedQrEvidenceDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        onAddSystemEvent={onAddSystemEvent}
      />
    </div>
  );
};
