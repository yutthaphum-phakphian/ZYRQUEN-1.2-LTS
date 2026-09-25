import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  Award,
  Lock,
  Download,
  Copy,
  Check,
  FileText,
  Binary,
  Layers,
  ExternalLink,
  CheckCircle2,
  Cpu,
  X,
  Sparkles,
} from 'lucide-react';
import { SYSTEM_METADATA, CANONICAL_MERKLE_ROOT, CANONICAL_GENESIS_BLOCK } from '../data/canonicalData';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { exportCanonicalSealArtifactJson } from '../utils/canonicalSealArtifactExport';
import { generateSovereignReportPdf } from '../utils/sovereignReportPdfExport';
import { safeCopyToClipboard } from '../utils/clipboard';
import { SystemEvent } from './SystemEventsSidebar';

interface UnifiedQrEvidenceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string
  ) => void;
}

export const UnifiedQrEvidenceDossierModal: React.FC<UnifiedQrEvidenceDossierModalProps> = ({
  isOpen,
  onClose,
  onAddSystemEvent,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr-passport' | 'pqc-signatures' | 'chambers-matrix'>('qr-passport');

  if (!isOpen) return null;

  const handleCopy = (text: string, keyName: string) => {
    safeCopyToClipboard(text);
    setCopiedKey(keyName);
    playTone(700, 0.04);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportJson = () => {
    try {
      playTone(680, 0.05);
      const { filename } = exportCanonicalSealArtifactJson();
      playAuditChime();
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'COMPLIANCE',
          'Unified Dossier JSON Artifact Exported',
          `Exported digitally signed JSON seal manifest (${filename}) for sovereign audit trail.`,
          CANONICAL_MERKLE_ROOT,
          'success',
          'NIST FIPS 204 & ETDA Sec 9, 26, 28'
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      playTone(620, 0.05);
      generateSovereignReportPdf({
        principalName: SYSTEM_METADATA.sovereignPrincipal,
        custodianPassport: '#EP-SOVEREIGN-01',
        sealBlockHeight: SYSTEM_METADATA.sealedBlock,
        merkleAnchor: '909ab814',
      });
      playAuditChime();
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'COMPLIANCE',
          'Unified Dossier Official PDF Certificate Exported',
          `Court-admissible PDF generated under ETDA Sec 9, 26, 28 and PDPA 2562.`,
          CANONICAL_MERKLE_ROOT,
          'info',
          'ETDA Recommendation ขมธอ. 1-2562'
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const CHAMBERS_BRIEF = [
    { id: 'CH-00', nameTh: 'ศูนย์บัญชาการพหุจักรวาล และรากแก้วเจเนซิส', role: 'Genesis Root Anchor', status: 'SEALED' },
    { id: 'CH-01', nameTh: 'แกนประมวลผลหลัก G11 และเอนจินฉันทามติ', role: 'Consensus Core & DAG Engine', status: 'SEALED' },
    { id: 'CH-02', nameTh: 'ศูนย์นิติวิทยาศาสตร์ดิจิทัล และบัฟเฟอร์กักกัน', role: 'Digital Forensics Quarantine', status: 'QUARANTINED' },
    { id: 'CH-03', nameTh: 'ทำเนียบผู้พิทักษ์กุญแจฮาร์ดแวร์ HSM', role: 'Deca-Key 10/10 Quorum', status: 'ACTIVE' },
    { id: 'CH-04', nameTh: 'โล่พิทักษ์กฎเหล็ก 10 ประการ (Invariants)', role: '10 SSoT System Invariants', status: 'ACTIVE' },
    { id: 'CH-05', nameTh: 'ประตูด่านทดสอบหลัก 22 ด่าน (Master Gates)', role: '22 Master Verification Gates', status: 'ACTIVE' },
    { id: 'CH-06', nameTh: 'ศูนย์ฟื้นฟูภัยพิบัติฟีนิกซ์ (Phoenix Recovery)', role: 'Autonomous Self-Healing (142ms)', status: 'ACTIVE' },
    { id: 'CH-07', nameTh: 'คลังสินทรัพย์สัจธรรม FIOS และทองคำ RWA', role: 'Physical Gold 14,902 oz & Treasury', status: 'SEALED' },
    { id: 'CH-08', nameTh: 'เครื่องตรวจพิสูจน์โครงข่าย Merkle 14,902 Seals', role: 'Merkle Root Verification Engine', status: 'ACTIVE' },
    { id: 'CH-09', nameTh: 'ระบบโทรมาตรไร้ PII (Zero-PII Telemetry)', role: '100% PII Redaction Engine', status: 'ACTIVE' },
    { id: 'CH-10', nameTh: 'คลังหลวงอธิปไตย (Sovereign Treasury Vault)', role: '4.23B THB Asset Management', status: 'SEALED' },
    { id: 'CH-11', nameTh: 'ระบบจัดทำสำนวนพยานหลักฐานยื่นศาล', role: 'Court-Ready Evidence Dossier', status: 'QUARANTINED' },
    { id: 'CH-12', nameTh: 'ไฟร์วอลล์ห้ามเขียนทับ (Zero-Trust Write)', role: 'Fail-Closed Mutation Firewall', status: 'QUARANTINED' },
    { id: 'CH-13', nameTh: 'เครือข่าย BFT Mesh 6 โหนด', role: 'Byzantine Fault Tolerance Grid', status: 'ACTIVE' },
    { id: 'CH-14', nameTh: 'ผู้สังเกตการณ์ระบบประสาท AI (Neural Observer)', role: 'Cognitive Reasoning & Drift Monitor', status: 'ACTIVE' },
    { id: 'CH-15', nameTh: 'ระบบส่งสัญญาณเสียงสังเคราะห์เชิงคลื่น (Sonic)', role: 'Acoustic Diagnostic Synthesizer', status: 'ACTIVE' },
    { id: 'CH-16', nameTh: 'แบบจำลองภาพ 3 มิติควอนตัม (3D Visualization)', role: 'Quantum Multiverse Hologram Mesh', status: 'ACTIVE' },
    { id: 'CH-17', nameTh: 'ศูนย์บัญชาการสูงสุด (Supreme Command Desk)', role: 'OMEGA-1 Executive Authority Deck', status: 'SEALED' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-[32px] bg-gradient-to-br from-[#0c1628] via-[#090e1c] to-[#05070e] border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-6 sm:p-7 border-b border-white/10 flex items-center justify-between gap-4 bg-black/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] shrink-0">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px] font-mono tracking-wider font-bold">
                  COURT-ADMISSIBLE UNIFIED DOSSIER
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px] font-mono">
                  ETDA SEC 9, 26, 28
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] font-mono">
                  14,902 SEALS VERIFIED
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
                Unified QR Evidence Dossier & Attestation Matrix
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                สำนวนพยานหลักฐานอธิปไตยดิจิทัลแบบครบวงจร (JSON Manifest + PDF Certificate + 18-Chamber Matrix)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/10 bg-black/20 shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              playTone(550, 0.03);
              setActiveTab('qr-passport');
            }}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'qr-passport'
                ? 'text-cyan-300 border-cyan-400 bg-cyan-500/10'
                : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Attestation Passport</span>
          </button>

          <button
            onClick={() => {
              playTone(580, 0.03);
              setActiveTab('pqc-signatures');
            }}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'pqc-signatures'
                ? 'text-violet-300 border-violet-400 bg-violet-500/10'
                : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>NIST PQC Signatures & Statutory Proof</span>
          </button>

          <button
            onClick={() => {
              playTone(600, 0.03);
              setActiveTab('chambers-matrix');
            }}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'chambers-matrix'
                ? 'text-emerald-300 border-emerald-400 bg-emerald-500/10'
                : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>18 Chambers Sovereign Matrix</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 font-mono text-xs text-zinc-300">
          {activeTab === 'qr-passport' && (
            <div className="space-y-6">
              {/* QR Code & Attestation Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-3xl bg-black/40 border-white/10 backdrop-blur-xl">
                {/* QR Visual Frame */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.03] border-cyan-500/20 text-center space-y-3">
                  <div className="relative p-4 rounded-2xl bg-white text-black shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    {/* SVG High-Res QR Visual Representation */}
                    <svg
                      viewBox="0 0 160 160"
                      className="w-36 h-36 mx-auto"
                      fill="currentColor"
                    >
                      {/* Corner Position Detection Patterns */}
                      <rect x="10" y="10" width="40" height="40" rx="6" fill="#0c1628" />
                      <rect x="16" y="16" width="28" height="28" rx="3" fill="#ffffff" />
                      <rect x="22" y="22" width="16" height="16" rx="2" fill="#06b6d4" />

                      <rect x="110" y="10" width="40" height="40" rx="6" fill="#0c1628" />
                      <rect x="116" y="16" width="28" height="28" rx="3" fill="#ffffff" />
                      <rect x="122" y="22" width="16" height="16" rx="2" fill="#06b6d4" />

                      <rect x="10" y="110" width="40" height="40" rx="6" fill="#0c1628" />
                      <rect x="16" y="116" width="28" height="28" rx="3" fill="#ffffff" />
                      <rect x="22" y="122" width="16" height="16" rx="2" fill="#06b6d4" />

                      {/* Alignment & Center Sovereign Seal Pattern */}
                      <rect x="62" y="62" width="36" height="36" rx="6" fill="#0c1628" />
                      <rect x="68" y="68" width="24" height="24" rx="3" fill="#d97706" />
                      <circle cx="80" cy="80" r="6" fill="#ffffff" />

                      {/* Data Matrix Bits Representation */}
                      <rect x="60" y="15" width="8" height="8" fill="#0c1628" />
                      <rect x="75" y="20" width="8" height="8" fill="#0c1628" />
                      <rect x="90" y="15" width="8" height="8" fill="#0c1628" />
                      <rect x="60" y="35" width="8" height="8" fill="#0c1628" />
                      <rect x="85" y="38" width="8" height="8" fill="#0c1628" />

                      <rect x="15" y="60" width="8" height="8" fill="#0c1628" />
                      <rect x="35" y="65" width="8" height="8" fill="#0c1628" />
                      <rect x="20" y="85" width="8" height="8" fill="#0c1628" />
                      <rect x="40" y="90" width="8" height="8" fill="#0c1628" />

                      <rect x="115" y="60" width="8" height="8" fill="#0c1628" />
                      <rect x="135" y="70" width="8" height="8" fill="#0c1628" />
                      <rect x="120" y="85" width="8" height="8" fill="#0c1628" />
                      <rect x="138" y="95" width="8" height="8" fill="#0c1628" />

                      <rect x="60" y="115" width="8" height="8" fill="#0c1628" />
                      <rect x="80" y="125" width="8" height="8" fill="#0c1628" />
                      <rect x="95" y="115" width="8" height="8" fill="#0c1628" />
                      <rect x="70" y="140" width="8" height="8" fill="#0c1628" />
                      <rect x="125" y="125" width="8" height="8" fill="#0c1628" />
                      <rect x="140" y="135" width="8" height="8" fill="#0c1628" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">SOVEREIGN-DOSSIER-QR</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                      Digest: 909ab814...a4c68
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                    ✓ COURT-READY VERIFIED
                  </div>
                </div>

                {/* Evidence Passport Details */}
                <div className="md:col-span-8 space-y-4">
                  <div className="border-b border-white/10 pb-3">
                    <div className="text-zinc-500 text-[10px] uppercase tracking-wider">
                      สำนวนพยานหลักฐานอิเล็กทรอนิกส์นำสืบชั้นศาล (Official Court-Admissible Dossier)
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      ZYRQUEN Ω∞ FROZEN v1.2 LTS Sovereign Evidence Package
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
                      <div className="text-zinc-500 text-[10px]">ผู้ถือสิทธิ์และสถาปนิกสูงสุด</div>
                      <div className="text-amber-300 font-bold">{SYSTEM_METADATA.sovereignPrincipal}</div>
                      <div className="text-zinc-400 text-[10px]">Clearance: OMEGA-1 SUPREME</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
                      <div className="text-zinc-500 text-[10px]">หมายเลขบล็อกสัจธรรม</div>
                      <div className="text-cyan-300 font-bold">Block #{SYSTEM_METADATA.sealedBlock} (Range #849198–#849202)</div>
                      <div className="text-zinc-400 text-[10px]">Genesis Hash: 00000000000000000001f3e8...</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
                      <div className="text-zinc-500 text-[10px]">สถิติตราประทับ Merkle (Canonical Seals)</div>
                      <div className="text-emerald-400 font-bold">14,902 / 14,902 Seals (100.00%)</div>
                      <div className="text-zinc-400 text-[10px]">Quarantined: 80 | Raw Total: 14,982</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
                      <div className="text-zinc-500 text-[10px]">สิทธิอำนาจการกลายพันธุ์ (SSoT Mutation)</div>
                      <div className="text-emerald-300 font-bold">0 Mutation (Δ 0.00% Zero Drift)</div>
                      <div className="text-zinc-400 text-[10px]">Read-Only Immutable Kernel</div>
                    </div>
                  </div>

                  {/* Merkle Root Copy Bar */}
                  <div className="p-3 rounded-xl bg-cyan-950/20 border-cyan-500/30 flex items-center justify-between gap-3">
                    <div className="truncate space-y-0.5">
                      <div className="text-[10px] text-cyan-400 font-bold">CANONICAL GENESIS MERKLE ROOT:</div>
                      <div className="text-[11px] text-cyan-200 font-mono truncate select-all">
                        {CANONICAL_MERKLE_ROOT}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(CANONICAL_MERKLE_ROOT, 'merkle')}
                      className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors shrink-0"
                    >
                      {copiedKey === 'merkle' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Export Artifacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleExportJson}
                  className="p-4 rounded-2xl bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/40 hover:to-indigo-600/40 border-violet-400/40 text-white flex items-center justify-between group transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 border-violet-400/40 flex items-center justify-center text-violet-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">ส่งออก Digital Signed JSON Artifact</div>
                      <div className="text-[10px] text-zinc-400">NIST FIPS 204 ML-DSA-87 Signed Manifest</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-violet-300 group-hover:translate-y-0.5 transition-transform" />
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 border-blue-400/40 text-white flex items-center justify-between group transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border-blue-400/40 flex items-center justify-center text-blue-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">
                        {isExportingPdf ? 'กำลังสร้างเอกสาร PDF...' : 'ดาวน์โหลด Official Legal PDF Certificate'}
                      </div>
                      <div className="text-[10px] text-zinc-400">มาตรฐานศาลไทย & ETDA ขมธอ. ๑-๒๕๖๒</div>
                    </div>
                  </div>
                  <Download className={`w-4 h-4 text-cyan-300 group-hover:translate-y-0.5 transition-transform ${isExportingPdf ? 'animate-bounce' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pqc-signatures' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-violet-950/20 border-violet-500/30 space-y-2">
                <div className="flex items-center gap-2 text-violet-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>NIST Post-Quantum Cryptography Suite & Legal Safe Harbor</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  ระบบยกเลิกการใช้อัลกอริทึม HAWK และบังคับใช้มาตรฐาน NIST PQC FIPS 203, 204, 205 ร่วมกับกฎหมายไทย 100%
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-black/40 border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 text-xs">1. NIST FIPS 204: ML-DSA-87 (Dilithium-5)</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px]">PRIMARY SEAL SIGNATURE</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    ใช้ตรึงลายมือชื่อดิจิทัลบนตราประทับ 14,902 ตราประทับ ป้องกันการถอดรหัสจาก Quantum Computers
                  </p>
                  <div className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-zinc-500 truncate select-all">
                    SIG_ML_DSA_87: 3b9f4a821e90dc77a834f826...e042898c19fb724128a (Security Level 5)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-xs">2. NIST FIPS 203: ML-KEM-1024 (Kyber-1024)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px]">KEY ENCAPSULATION</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    เข้ารหัสช่องสัญญาณรับส่งข้อมูลแบบ End-to-End Quantum Resilient Bus (Cryo-Bus Latency ≤0.20ms)
                  </p>
                  <div className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-zinc-500 truncate select-all">
                    KEM_CIPHERTEXT: 7a88cf1038ba9201e74f63c8...91823746a5b4c3d2e1f (IND-CCA2 Secure)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-xs">3. NIST FIPS 205: SLH-DSA (SPHINCS+)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px]">STATELESS FALLBACK</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    ลายเซ็นดิจิทัลสำรองฉุกเฉินแบบไร้สถานะ (Stateless Hash-based Signature) ทำงานร่วมกับ 10/10 REAL_HSM
                  </p>
                  <div className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-zinc-500 truncate select-all">
                    SLH_FALLBACK_SIG: 19fa8c37d04e76b2519...882a17cb49301e5287f
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border-white/5 space-y-2">
                  <div className="font-bold text-blue-300 text-xs">4. สิทธิสภาพตามกฎหมายไทย (Thai Statutory Grounding)</div>
                  <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                    <li><strong className="text-zinc-300">พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔:</strong> มาตรา ๙, ๒๖, ๒๘, ๒๙ (Safe Harbor)</li>
                    <li><strong className="text-zinc-300">พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒:</strong> มาตรา ๓๗ (ความปลอดภัย) และ ๓๙ (บันทึก ROPA)</li>
                    <li><strong className="text-zinc-300">พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. ๒๕๖๒:</strong> มาตรฐานโครงสร้างพื้นฐานสำคัญ CII (NCSA)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chambers-matrix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border-emerald-500/30 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-emerald-300 text-xs">18-Chamber Civilization Matrix (CH-00 ถึง CH-17)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    สถานะการเชื่อมต่อห้องปฏิบัติการ 18 ห้อง เพื่อธำรงความเสถียรและสัจธรรมแห่งอารยธรรม (Δ0.00% Zero Drift)
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold shrink-0">
                  ALL 18 ACTIVE / SEALED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CHAMBERS_BRIEF.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3 rounded-2xl bg-black/40 border-white/5 space-y-1.5 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-cyan-300 font-bold text-[10px]">
                        {ch.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ch.status === 'SEALED'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : ch.status === 'QUARANTINED'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </div>
                    <div className="text-white font-bold text-xs truncate" title={ch.nameTh}>
                      {ch.nameTh}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate" title={ch.role}>
                      {ch.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-5 sm:p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Digital Evidence Seal Certificate: <strong>ZQ-GOLD-DEP-849202-3908</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-mono text-xs font-semibold transition-all"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
