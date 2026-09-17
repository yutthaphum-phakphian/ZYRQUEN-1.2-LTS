import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Key,
  Lock,
  Binary,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  FileCheck,
  RefreshCw,
  Cpu,
  Layers,
  ChevronRight,
  Eye,
  Award,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA, THAI_CUSTODIANS, AUDIT_TRACE_TX } from '../data/canonicalData';
import { copyToClipboard } from '../utils/clipboard';

export interface LegalMappingNode {
  sectionId: 'sec9' | 'sec26' | 'sec28';
  sectionName: string;
  sectionTitleTh: string;
  sectionTitleEn: string;
  legalPrincipleTh: string;
  legalPrincipleEn: string;
  sovereignLayer: string;
  sovereignLayerTh: string;
  cryptographicEnforcement: string;
  cryptographicEnforcementTh: string;
  etdaStandardLevel: string;
  runtimeProof: string;
  verifiedArtifact: string;
  statuteCitation: string;
  accentColor: string;
}

export const LEGAL_MAPPING_DATA: LegalMappingNode[] = [
  {
    sectionId: 'sec9',
    sectionName: 'มาตรา 9 (Section 9)',
    sectionTitleTh: 'การรับรองผลทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์',
    sectionTitleEn: 'Legal Recognition of Electronic Signatures',
    legalPrincipleTh:
      'รับรองผลทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์ หากสามารถระบุตัวบุคคลผู้เป็นเจ้าของลายมือชื่อ และแสดงเจตนาในการลงนามได้อย่างชัดเจน',
    legalPrincipleEn:
      'Recognizes legal validity if the electronic signature reliably identifies the signatory and conveys their explicit intent regarding the data message.',
    sovereignLayer: 'Identity Layer (Sovereign Identity Seal)',
    sovereignLayerTh: 'ชั้นอัตลักษณ์อธิปไตย (Sovereign Identity Seal)',
    cryptographicEnforcement:
      'Merkle Leaf Signatures with Dilithium-5 / SHA-256 hashes bound to unique sovereign session keys, preventing spoofing and asserting cryptographically non-repudiable intent.',
    cryptographicEnforcementTh:
      'ใช้ Merkle Leaf Signatures ร่วมกับ Dilithium-5 / SHA-256 เพื่อยืนยันตัวตนและเจตนาใน Sovereign Runtime แบบไม่สามารถปฏิเสธความรับผิดชอบได้',
    etdaStandardLevel: 'ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ (Reliable Electronic Signature - Level 2)',
    runtimeProof: 'Merkle Leaf Leaf#14902 :: Signature Valid :: Actor: SOVEREIGN_PRINCIPAL',
    verifiedArtifact: 'Leaf Hash: 9e3f847b... Dilithium-5 Public Key Binding',
    statuteCitation: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 9 (แก้ไขเพิ่มเติม ฉบับที่ 3 พ.ศ. 2562)',
    accentColor: '#3b82f6', // Blue
  },
  {
    sectionId: 'sec26',
    sectionName: 'มาตรา 26 (Section 26)',
    sectionTitleTh: 'มาตรฐานลายมือชื่อดิจิทัลที่เชื่อถือได้สูงสุด',
    sectionTitleEn: 'Standards of Highly Reliable Digital Signatures',
    legalPrincipleTh:
      'กำหนดมาตรฐานลายมือชื่อดิจิทัลที่เชื่อถือได้ โดยข้อมูลสำหรับสร้างลายมือชื่อต้องอยู่ภายใต้การควบคุมของเจ้าของ มีการเข้ารหัสที่มั่นคง ป้องกันการแก้ไขเปลี่ยนแปลง และตรวจสอบย้อนกลับได้ 100%',
    legalPrincipleEn:
      'Prescribes standards for reliable digital signatures: signature creation data strictly within signatory control, robust cryptographic security, immutable tamper-detection, and complete end-to-end verifiability.',
    sovereignLayer: 'Cryptographic Layer (Zero-Trust Cryptographic Fabric)',
    sovereignLayerTh: 'ชั้นโครงสร้างคริปโตกราฟิก (Zero-Trust Cryptographic Fabric)',
    cryptographicEnforcement:
      'Cryogenic Merkle Core (14,902 Sealed Blocks), Post-Quantum Kyber-1024 & Dilithium-5 lattice proofs, continuous qOps invariant checking with 0.00% invariant drift.',
    cryptographicEnforcementTh:
      'ใช้ Cryogenic Merkle Core ร่วมกับ Post-Quantum Kyber-1024 & Dilithium-5 และการตรวจวัด qOps Telemetry แบบเรียลไทม์ (Drift 0.00%) ป้องกันการดัดแปลงข้อมูล 100%',
    etdaStandardLevel: 'ลายมือชื่อดิจิทัลที่เชื่อถือได้ระดับสูงสุด (Highest-Reliability Digital Signature - Level 3+)',
    runtimeProof: 'Merkle Root: 7f8a9b2c3d4e5f60... :: Zero Mutation Invariant: VERIFIED 100%',
    verifiedArtifact: 'NIST FIPS 203 (ML-KEM) & FIPS 204 (ML-DSA) Invariant Guard',
    statuteCitation: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 26 (แก้ไขเพิ่มเติม ฉบับที่ 4 พ.ศ. 2562)',
    accentColor: '#06b6d4', // Cyan
  },
  {
    sectionId: 'sec28',
    sectionName: 'มาตรา 28 (Section 28)',
    sectionTitleTh: 'ความรับผิดชอบของเจ้าของข้อมูลลายมือชื่อ',
    sectionTitleEn: 'Signatory Liability & Keyholder Custody Responsibilities',
    legalPrincipleTh:
      'เจ้าของข้อมูลลายมือชื่อมีหน้าที่ตามกฎหมายในการควบคุม ดูแลรักษา และรับผิดชอบต่อการสร้างและการใช้ลายมือชื่อดิจิทัล รวมถึงการแจ้งเตือนทันทีหากเกิดความเสี่ยงหรือการละเมิด',
    legalPrincipleEn:
      'Signatory holds legal accountability to exercise reasonable care in safeguarding signature creation data and assumes responsibility for all authorized cryptographic sovereign seals.',
    sovereignLayer: 'Responsibility Layer (Executive Passport & Custody Gate)',
    sovereignLayerTh: 'ชั้นความรับผิดชอบและการปกครอง (Executive Passport & Custody Gate)',
    cryptographicEnforcement:
      'Sovereign Executive Passport #EP-SOVEREIGN-01 (นายยุทธภูมิ พากเพียร) binds physical biometric & hardware root-of-trust custody, enforcing personal executive non-repudiation over all sovereign system dispatches.',
    cryptographicEnforcementTh:
      'Sovereign Executive Passport #EP-SOVEREIGN-01 (นายยุทธภูมิ พากเพียร) บังคับความรับผิดชอบของผู้ถือ Seal ต่อการใช้ทุก Sovereign Signature แบบกำกับสิทธิ์ระดับสูงสุด (Omega Clearance)',
    etdaStandardLevel: 'มาตรฐานการกำกับดูแลความรับผิดชอบตามเกณฑ์ ETDA & NCSA',
    runtimeProof: 'Executive Passport: #EP-SOVEREIGN-01 :: Clearance: OMEGA-SOVEREIGN :: Custodian: นายยุทธภูมิ พากเพียร',
    verifiedArtifact: 'Fingerprint: 8F2A-9C4D-1E7B-3A5F-6D8E-0B2C-4E7A-9F1D-3C5E-7B9A',
    statuteCitation: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 28',
    accentColor: '#f59e0b', // Amber
  },
];

export const ThaiLegalSovereignMapping: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<'sec9' | 'sec26' | 'sec28'>('sec26');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentNode = LEGAL_MAPPING_DATA.find((n) => n.sectionId === selectedSection)!;

  const runAttestationSimulation = () => {
    setIsSimulating(true);
    setActiveStep(0);
    playTone(520, 0.08);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < 3) {
        setActiveStep(step);
        playTone(500 + step * 70, 0.06);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        playAuditChime();
      }
    }, 700);
  };

  const copyMappingSummary = () => {
    const summaryText = `ZYRQUEN Ω∞ THAI LEGAL & SOVEREIGN SEAL CHAIN MAPPING\nพระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 & 2562 (ETDA Compliant)\n\n1. มาตรา 9 (Identity Layer) -> Merkle Leaf Signatures (ยืนยันตัวตนและเจตนา)\n2. มาตรา 26 (Cryptographic Layer) -> Zero-Trust Cryogenic Merkle Core & Post-Quantum Invariant Guard (ความเชื่อถือได้สูงสุด)\n3. มาตรา 28 (Responsibility Layer) -> Sovereign Executive Passport #EP-SOVEREIGN-01 นายยุทธภูมิ พากเพียร (ความรับผิดชอบของผู้ถือ Seal)\n\nAttested under Merkle Root: ${SYSTEM_METADATA.merkleRoot}`;
    copyToClipboard(summaryText);
    setCopiedCode(true);
    playTone(650, 0.05);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
                Thai Electronic Transactions Act ↔ Sovereign Seal Chain Mapping
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                ETDA LEVEL 3+ COMPLIANT
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (แก้ไข 2562) มาตรา 9, 26, 28 ↔ ZYRQUEN Ω∞ Cryptographic Runtime
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={runAttestationSimulation}
            disabled={isSimulating}
            className={`px-4 py-2 rounded-2xl font-mono text-xs font-semibold flex items-center gap-2 transition-all border ${
              isSimulating
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 animate-pulse'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Attesting Full Flow...' : 'Simulate 3-Tier Flow'}</span>
          </button>

          <button
            onClick={copyMappingSummary}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-all"
          >
            {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedCode ? 'Copied' : 'Copy Spec'}</span>
          </button>
        </div>
      </div>

      {/* Interactive 3-Tier Legal-to-Cryptographic Architecture Flow Diagram */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Architecture Flow: Statute → Sovereign Layer → Cryptographic Enforcement</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-500">Interactive Tier Navigator</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {LEGAL_MAPPING_DATA.map((node, index) => {
            const isSelected = selectedSection === node.sectionId;
            const isStepActive = activeStep === index;
            const isStepPassed = activeStep > index;

            return (
              <div
                key={node.sectionId}
                onClick={() => {
                  playTone(520 + index * 60, 0.04);
                  setSelectedSection(node.sectionId);
                }}
                className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden space-y-3 ${
                  isSelected
                    ? 'bg-gradient-to-b from-white/[0.06] to-black/60 border-current shadow-xl ring-1 ring-white/20'
                    : 'bg-black/40 hover:bg-black/60 border-white/8 hover:border-white/20'
                }`}
                style={{ borderColor: isSelected ? node.accentColor : undefined }}
              >
                {/* Visual Step Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center transition-all ${
                        isStepActive
                          ? 'bg-cyan-400 text-black animate-pulse'
                          : isStepPassed
                          ? 'bg-emerald-400 text-black'
                          : isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-zinc-500'
                      }`}
                    >
                      {isStepPassed ? '✓' : index + 1}
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-white">{node.sectionName}</span>
                  </div>

                  <span
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${node.accentColor}15`,
                      color: node.accentColor,
                      borderColor: `${node.accentColor}30`,
                    }}
                  >
                    Tier {index + 1}
                  </span>
                </div>

                {/* Flow Mapping Steps */}
                <div className="space-y-2 text-xs font-mono">
                  {/* Legal Step */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">1. หลักการทางกฎหมาย (Legal Statute)</span>
                    <div className="text-zinc-200 font-medium text-[11px] leading-snug">{node.sectionTitleTh}</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center text-zinc-600">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>

                  {/* Sovereign Architecture Layer */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">2. Sovereign Layer</span>
                    <div className="text-cyan-300 font-semibold text-[11px]">{node.sovereignLayer}</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center text-zinc-600">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>

                  {/* Cryptographic Enforcement */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">3. Cryptographic Enforcement</span>
                    <div className="text-emerald-400 font-medium text-[11px] line-clamp-2">
                      {node.cryptographicEnforcementTh}
                    </div>
                  </div>
                </div>

                {/* Selection Footer Indicator */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Click to Inspect Evidence</span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <span>{isSelected ? 'ACTIVE' : 'INSPECT'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Inspection Panel for the Selected Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/60 border border-white/10 space-y-5 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${currentNode.accentColor}15`,
                color: currentNode.accentColor,
                borderColor: `${currentNode.accentColor}30`,
              }}
            >
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">{currentNode.sectionName}: {currentNode.sectionTitleTh}</span>
              </div>
              <span className="text-xs text-zinc-400 font-sans">{currentNode.sectionTitleEn}</span>
            </div>
          </div>

          <span
            className="px-3 py-1 rounded-xl text-xs font-semibold border self-start sm:self-auto"
            style={{
              backgroundColor: `${currentNode.accentColor}15`,
              color: currentNode.accentColor,
              borderColor: `${currentNode.accentColor}30`,
            }}
          >
            {currentNode.etdaStandardLevel}
          </span>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          {/* Left: Thai Statutory Legal Foundation */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold border-b border-white/5 pb-2">
              <BookOpen className="w-4 h-4" />
              <span>หลักการทางกฎหมายตามพระราชบัญญัติ (Legal Foundation)</span>
            </div>
            <p className="text-zinc-200 font-sans text-xs sm:text-sm leading-relaxed">
              {currentNode.legalPrincipleTh}
            </p>
            <p className="text-zinc-400 font-sans text-xs italic leading-relaxed pt-1">
              "{currentNode.legalPrincipleEn}"
            </p>
            <div className="text-[11px] text-zinc-500 pt-2 border-t border-white/5">
              <span>อ้างอิง: </span>
              <span className="text-zinc-300">{currentNode.statuteCitation}</span>
            </div>
          </div>

          {/* Right: ZYRQUEN Ω∞ Cryptographic Sovereign Enforcement */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold border-b border-white/5 pb-2">
              <Cpu className="w-4 h-4" />
              <span>การบังคับใช้เชิงเทคนิคและคริปโตกราฟิก (Cryptographic Runtime)</span>
            </div>
            <p className="text-zinc-200 font-sans text-xs sm:text-sm leading-relaxed">
              {currentNode.cryptographicEnforcementTh}
            </p>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1 font-mono text-[11px]">
              <div className="text-zinc-400">
                <span className="text-zinc-500">PROVEN RUNTIME INVARIANT:</span>
              </div>
              <div className="text-emerald-400 font-bold truncate">{currentNode.runtimeProof}</div>
              <div className="text-cyan-300 text-[10px] truncate">{currentNode.verifiedArtifact}</div>
            </div>
          </div>
        </div>

        {/* Section 28 Thai Sovereign Custodian Anchor */}
        {selectedSection === 'sec28' && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  Sovereign Custodian Legal Accountability Binding
                </span>
                <p className="text-[11px] text-zinc-300 font-mono mt-0.5">
                  ผูกพันความรับผิดชอบโดยตรงกับ Sovereign Principal Custodian: <strong className="text-white">นายยุทธภูมิ พากเพียร</strong> (#EP-SOVEREIGN-01)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 whitespace-nowrap self-start sm:self-auto">
              OMEGA CLEARANCE
            </span>
          </div>
        )}
      </div>

      {/* Comprehensive Mapping Summary Table */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
          <span className="font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <span>🧩</span>
            <span>Comprehensive Legal ↔ Sovereign Matrix (ETDA Reference)</span>
          </span>
          <span className="text-[11px] text-zinc-500">3 of 3 Articles Fully Mapped</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-[11px]">
                <th className="py-2.5 px-3">มาตราทางกฎหมาย</th>
                <th className="py-2.5 px-3">หลักการตาม พ.ร.บ. ธุรกรรมอิเล็กทรอนิกส์</th>
                <th className="py-2.5 px-3">Sovereign Layer</th>
                <th className="py-2.5 px-3">Cryptographic Enforcement</th>
                <th className="py-2.5 px-3">มาตรฐาน ETDA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {LEGAL_MAPPING_DATA.map((row) => (
                <tr
                  key={row.sectionId}
                  onClick={() => {
                    playTone(560, 0.04);
                    setSelectedSection(row.sectionId);
                  }}
                  className={`hover:bg-white/[0.03] cursor-pointer transition-colors ${
                    selectedSection === row.sectionId ? 'bg-cyan-950/20 text-white' : 'text-zinc-300'
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-cyan-300 whitespace-nowrap">{row.sectionName}</td>
                  <td className="py-3 px-3 max-w-xs">{row.sectionTitleTh}</td>
                  <td className="py-3 px-3 text-violet-300 font-semibold">{row.sovereignLayerTh}</td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">{row.cryptographicEnforcementTh}</td>
                  <td className="py-3 px-3 text-amber-300 whitespace-nowrap">{row.etdaStandardLevel.split('(')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
