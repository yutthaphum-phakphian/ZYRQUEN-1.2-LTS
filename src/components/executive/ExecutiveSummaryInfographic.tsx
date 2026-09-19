import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Award,
  Lock,
  Cpu,
  Database,
  Fingerprint,
  Download,
  Copy,
  Check,
  Play,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Key,
  Flame,
  Radio,
  FileText,
  Clock,
  Terminal,
} from 'lucide-react';
import {
  SYSTEM_METADATA,
  THAI_CUSTODIANS,
  CANONICAL_MERKLE_ROOT,
} from '../../data/canonicalData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { ViewType } from '../../types';

export interface ExecutiveSummaryInfographicProps {
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
  onSimulateOmegaSequence?: () => void;
  className?: string;
}

// 4-Tier Sovereign Matrix Definition
export interface SovereignMatrixTier {
  id: string;
  tierNumber: number;
  titleTh: string;
  titleEn: string;
  statute: string;
  standard: string;
  color: string;
  gradient: string;
  borderGlow: string;
  icon: any;
  summaryTh: string;
  summaryEn: string;
  technicalEnforcements: string[];
  judicialVerdict: string;
  passStatus: string;
}

export const SOVEREIGN_MATRIX_TIERS: SovereignMatrixTier[] = [
  {
    id: 'tier-1-data',
    tierNumber: 1,
    titleTh: 'อธิปไตยข้อมูลส่วนบุคคล (Data Sovereignty)',
    titleEn: 'Personal Data Sovereignty & Zero-Knowledge Vault',
    statute: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ม. 37',
    standard: 'PDPA Sec 37 • Zero-Knowledge Lattice Partition',
    color: '#06B6D4',
    gradient: 'from-cyan-950/80 via-[#0a1120] to-[#070a12]',
    borderGlow: 'border-cyan-500/40 hover:border-cyan-400',
    icon: Database,
    summaryTh: 'การแบ่งแยกข้อมูล 400 องค์กร (Ω601–Ω1000) ด้วย Zero-Knowledge Vault ป้องกันข้อมูลระบุตัวบุคคล (PII) รั่วไหล 100%',
    summaryEn: 'Strict multi-tenant isolation across 400 enterprise tenants with zero PII egress and lattice encryption.',
    technicalEnforcements: [
      'Multi-Tenant Cryptographic Partitioning (Ω601–Ω1000)',
      'Zero-Knowledge Proof Attestation across sub-tenants',
      'No PII plaintext data egress to external telemetry',
      'Hardware-enforced ephemeral enclave key derivation',
    ],
    judicialVerdict: '100% PDPA SEC 37 COMPLIANT',
    passStatus: 'PASS NOMINAL',
  },
  {
    id: 'tier-2-cyber',
    tierNumber: 2,
    titleTh: 'ความมั่นคงไซเบอร์ขั้นวิกฤติ (Zero-Trust Resilience)',
    titleEn: 'Zero-Trust Cybersecurity & Cryogenic Merkle Core',
    statute: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (NCSA)',
    standard: 'NCSA CII Sec 35 • Sub-Kelvin 14.98 mK Bus',
    color: '#10B981',
    gradient: 'from-emerald-950/80 via-[#081814] to-[#070a12]',
    borderGlow: 'border-emerald-500/40 hover:border-emerald-400',
    icon: ShieldCheck,
    summaryTh: 'เกราะป้องกันระดับโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (CII) สภาพแวดล้อมไครโอเจนิก 14.98 mK พร้อมระบบฟื้นฟู Phoenix 35.8ms',
    summaryEn: 'CII critical cyber resilience running in 14.98 mK cryogenic environment with 35.8ms Phoenix self-healing.',
    technicalEnforcements: [
      'Fail-Closed Defense Trigger (≤1.2ms isolation response)',
      'Sub-Kelvin Cryostat Bus 14.98 mK (<18.00 mK limit)',
      'Phoenix Self-Healing Auto-Recovery in 35.8 ms (SLA <142ms)',
      'Circuit Breaker Threshold 15,000 KBps Over-Limit Intercept',
    ],
    judicialVerdict: 'NCSA CII SEC 35 RATIFIED',
    passStatus: 'PASS EQUILIBRIUM',
  },
  {
    id: 'tier-3-trust',
    tierNumber: 3,
    titleTh: 'อัตลักษณ์ดิจิทัลและการลงนาม (Identity & Trust)',
    titleEn: 'Identity, Intent & Statutory Non-Repudiation',
    statute: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 ม. 9, 26, 28',
    standard: 'ETDA Sec 9/26/28 • Dilithium-5 Signatures',
    color: '#D4AF37',
    gradient: 'from-amber-950/80 via-[#181408] to-[#070a12]',
    borderGlow: 'border-amber-500/40 hover:border-amber-400',
    icon: Scale,
    summaryTh: 'การรับรองลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ตามมาตรา 26 ผูกพันเจตนาของ Sovereign Principal #EP-SOVEREIGN-01',
    summaryEn: 'Reliable electronic signature with non-repudiation binding Sovereign Principal #EP-SOVEREIGN-01 intent.',
    technicalEnforcements: [
      'RFC 3161 Hardware Trusted Timestamping Ingest (4.2ms)',
      'FIPS 204 CRYSTALS-Dilithium-5 (ML-DSA-87) Cryptographic Signature',
      'Immutable WORM Audit Ledger across 14,902 Frozen Seals',
      'Dual-Plane Separation: Governance 10/10 + Physical 10/10',
    ],
    judicialVerdict: 'ETDA COURT-ADMISSIBLE READY',
    passStatus: '10/10 RATIFIED',
  },
  {
    id: 'tier-4-pqc',
    tierNumber: 4,
    titleTh: 'วิทยาการรหัสลับหลังยุคควอนตัม (Executive Custody & PQC)',
    titleEn: 'Post-Quantum Cryptographic Shield & Hardware Enclaves',
    statute: 'NIST PQC FIPS 203, 204, 205 Standards',
    standard: 'FIPS 140-3 Level 4 • Kyber-1024 + Dilithium-5',
    color: '#8B5CF6',
    gradient: 'from-purple-950/80 via-[#140b24] to-[#070a12]',
    borderGlow: 'border-purple-500/40 hover:border-purple-400',
    icon: Cpu,
    summaryTh: 'เกราะป้องกัน 3 ชั้นต้านทานคอมพิวเตอร์ควอนตัม (ML-KEM-1024, ML-DSA-87, SLH-DSA) บนฮาร์ดแวร์ FIPS 140-3 ระดับ 4',
    summaryEn: '3-tier hybrid post-quantum cryptographic shield impervious to Shor algorithm and Harvest-Now-Decrypt-Later attacks.',
    technicalEnforcements: [
      'Outer Ring: CRYSTALS-Dilithium-5 (ML-DSA-87) Primary Signature',
      'Middle Ring: ML-KEM-1024 (Kyber-1024) Key Encapsulation (Cat 5)',
      'Inner Guard: SPHINCS+ (SLH-DSA) Stateless Hash-Based Fallback',
      'FIPS 140-3 Level 4 Hardware Security Modules with Active Zeroization',
    ],
    judicialVerdict: 'PQC RESILIENT TO 2050+',
    passStatus: 'ARMED & HARDENED',
  },
];

// Omega Sequence 12-Phase Attestation Steps
export interface OmegaAttestationPhase {
  step: number;
  phaseId: string;
  nameTh: string;
  nameEn: string;
  latencyMs: number;
  statute: string;
  legalBinding: string;
  keyAction: string;
  cryptoDetail: string;
  status: 'VERIFIED' | 'NOMINAL';
}

export const OMEGA_ATTESTATION_PHASES: OmegaAttestationPhase[] = [
  {
    step: 1,
    phaseId: 'P01-GENESIS',
    nameTh: 'รากฐานบล็อกกำเนิด (Genesis Seal)',
    nameEn: 'Genesis Seal & Root Anchor',
    latencyMs: 1.2,
    statute: 'SSoT Canonical Anchor',
    legalBinding: 'SSoT Anchor',
    keyAction: 'Root-of-Trust Invariant Initialization',
    cryptoDetail: 'Genesis Block #849202 locked with Canonical Merkle Root 909ab814...',
    status: 'VERIFIED',
  },
  {
    step: 2,
    phaseId: 'P02-PQC-FORGE',
    nameTh: 'หลอมคีย์ควอนตัม (Cryogenic Key Forge)',
    nameEn: 'Cryogenic Key Forge',
    latencyMs: 2.8,
    statute: 'NIST FIPS 203/204',
    legalBinding: 'FIPS 203 Category 5',
    keyAction: 'NIST PQC Lattice Key Generation',
    cryptoDetail: 'ML-KEM-1024 + ML-DSA-87 generation at 14.98 mK sub-Kelvin bus',
    status: 'VERIFIED',
  },
  {
    step: 3,
    phaseId: 'P03-IDENTITY',
    nameTh: 'ยืนยันอัตลักษณ์องค์อธิปัตย์ (Identity Attestation)',
    nameEn: 'Identity Attestation',
    latencyMs: 1.9,
    statute: 'ETDA Sec 9',
    legalBinding: 'ETDA Sec 9 Identity & Intent',
    keyAction: 'Sovereign Identity Sign-Off',
    cryptoDetail: 'RFC 3161 TSA Ingest (TSA_Signature = Sign_PQC(SHA3-512(Intent||UTC)))',
    status: 'VERIFIED',
  },
  {
    step: 4,
    phaseId: 'P04-CUSTODIAN',
    nameTh: 'ผูกพันผู้พิทักษ์ไทย (Custodian Binding)',
    nameEn: 'Custodian Binding',
    latencyMs: 3.1,
    statute: 'ETDA Sec 26',
    legalBinding: 'Thai Custodian Registry',
    keyAction: 'Thai Custodian Registry Attestation',
    cryptoDetail: '10 Thai Custodians mapped to FIPS 140-3 Hardware Security Modules',
    status: 'VERIFIED',
  },
  {
    step: 5,
    phaseId: 'P05-INVARIANT',
    nameTh: 'ผนึกความเบี่ยงเบนเป็นศูนย์ (Invariant Lock)',
    nameEn: 'Invariant Lock',
    latencyMs: 4.4,
    statute: 'ETDA Sec 26 / SSoT',
    legalBinding: 'Zero-Drift Merkle Proof',
    keyAction: 'Zero-Drift Merkle Tree Verification',
    cryptoDetail: '14,902 Canonical Seals mathematically bound with Δ0.00% Zero Drift',
    status: 'VERIFIED',
  },
  {
    step: 6,
    phaseId: 'P06-PASSPORT',
    nameTh: 'ประทับตราหนังสือสำคัญ (Passport Sign-Off)',
    nameEn: 'Passport Sign-Off',
    latencyMs: 2.1,
    statute: 'ETDA Sec 28',
    legalBinding: 'Executive Custody Duty',
    keyAction: 'Executive Custody Verification',
    cryptoDetail: 'Custodian Passports CERT-SOV-OMEGA-0001 to 0010 verified and ratified',
    status: 'VERIFIED',
  },
  {
    step: 7,
    phaseId: 'P07-AUDIT-OTLP',
    nameTh: 'เปล่งสัญญาณบันทึก WORM (Audit Trail Emission)',
    nameEn: 'Audit Trail Emission',
    latencyMs: 1.5,
    statute: 'NCSA Sec 35',
    legalBinding: 'Immutable OTLP Audit Trail',
    keyAction: 'Immutable OTLP Telemetry Audit Stream',
    cryptoDetail: 'Redacted OpenTelemetry metrics over OTLP mTLS port 4318 with zero PII egress',
    status: 'VERIFIED',
  },
  {
    step: 8,
    phaseId: 'P08-PQC-SYNC',
    nameTh: 'ประสานเกราะควอนตัม (Quantum Resilience Sync)',
    nameEn: 'Quantum Resilience Sync',
    latencyMs: 3.7,
    statute: 'FIPS 203/204/205',
    legalBinding: 'PQC 3-Tier Multi-Ring Sync',
    keyAction: 'PQC Shield Coherence Verification',
    cryptoDetail: 'Quantum coherence evaluated at 99.992% (SLA ≥99.950%)',
    status: 'VERIFIED',
  },
  {
    step: 9,
    phaseId: 'P09-LEGAL-BRIDGE',
    nameTh: 'สะพานกฎหมายและข้อสันนิษฐาน (Legal Bridge)',
    nameEn: 'Legal Attestation Bridge',
    latencyMs: 2.4,
    statute: 'ETDA Sec 9/26 & PDPA Sec 37',
    legalBinding: 'Statutory Presumption Bridge',
    keyAction: 'ETDA & PDPA Statutory Convergence',
    cryptoDetail: 'Prima Facie legal admissibility established under Thai Law',
    status: 'VERIFIED',
  },
  {
    step: 10,
    phaseId: 'P10-CUSTODY-REC',
    nameTh: 'กระทบยอดการดูแลสองกุญแจ (Custody Reconciliation)',
    nameEn: 'Custody Reconciliation',
    latencyMs: 5.1,
    statute: 'ETDA Sec 28',
    legalBinding: 'Dual-Key Legal Custody',
    keyAction: 'Dual-Key Legal Custody Balance',
    cryptoDetail: '฿4.23B THB Sovereign Reserve + 14,902 oz LBMA Gold confirmed',
    status: 'VERIFIED',
  },
  {
    step: 11,
    phaseId: 'P11-HOMEOSTASIS',
    nameTh: 'สมดุลแห่งอธิปไตย (Sovereign Homeostasis)',
    nameEn: 'Sovereign Homeostasis',
    latencyMs: 1.8,
    statute: 'NCSA CII Act',
    legalBinding: 'Zero-Trust Equilibrium',
    keyAction: 'Zero-Trust Equilibrium Attestation',
    cryptoDetail: 'Thermal entropy dS = 0.0142 J/K << 0.05 limit (Stable Equilibrium)',
    status: 'VERIFIED',
  },
  {
    step: 12,
    phaseId: 'P12-ASCENSION',
    nameTh: 'ปัจฉิมบทโอเมก้าพร้อมนำสืบ (Omega Ascension)',
    nameEn: 'Omega Ascension',
    latencyMs: 0.9,
    statute: 'ETDA Sec 9/26/28, PDPA, NCSA',
    legalBinding: 'Permanent Admissible Finality',
    keyAction: 'Permanent Admissible Court Finality',
    cryptoDetail: 'Status APPROVED_SECURED locked forever with zero mutation tolerance',
    status: 'VERIFIED',
  },
];

export const ExecutiveSummaryInfographic: React.FC<ExecutiveSummaryInfographicProps> = ({
  onNavigate,
  onOpenCertificate,
  onSimulateOmegaSequence,
  className = '',
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('tier-1-data');
  const [selectedPhase, setSelectedPhase] = useState<OmegaAttestationPhase>(OMEGA_ATTESTATION_PHASES[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSimStep, setCurrentSimStep] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'omega' | 'quorum' | 'compliance'>('matrix');

  const copyText = (text: string, label: string) => {
    safeCopyToClipboard(text);
    setCopiedKey(label);
    playAuditChime();
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCurrentSimStep(1);
    playTone(440, 0.08);

    if (onSimulateOmegaSequence) {
      onSimulateOmegaSequence();
    }

    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      if (step <= 12) {
        setCurrentSimStep(step);
        setSelectedPhase(OMEGA_ATTESTATION_PHASES[step - 1]);
        playTone(380 + step * 35, 0.05);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        playTone(980, 0.15);
      }
    }, 280);
  };

  const totalOmegaLatency = OMEGA_ATTESTATION_PHASES.reduce((acc, p) => acc + p.latencyMs, 0).toFixed(1);

  return (
    <div id="executive-summary-infographic-root" className={`space-y-6 ${className}`}>
      {/* ============================================================ */}
      {/* 1. CANONICAL BASELINE & VERDICT HERO BANNER                   */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#070a12] via-[#0d1527] to-[#070a12] border border-[#D4AF37]/40 p-6 md:p-8 shadow-[0_0_35px_rgba(212,175,55,0.12)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 flex items-center gap-1.5 shadow-sm">
                <Award className="w-3.5 h-3.5" />
                <span>EXECUTIVE BRIEFING</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>APPROVED_SECURED</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-500/30">
                COURT-ADMISSIBLE READY
              </span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Layers className="w-7 h-7 text-[#D4AF37]" />
                <span>ZYRQUEN Ω∞ Sovereign Kernel</span>
                <span className="text-xs md:text-sm font-mono font-normal text-zinc-400">
                  (Executive Infographic)
                </span>
              </h1>
              <p className="text-sm text-zinc-300 max-w-3xl pt-1 leading-relaxed">
                สถาปัตยกรรมอธิปไตยดิจิทัล 4 ชั้น (4-Tier Sovereign Matrix), สายพานรับรองโอเมก้า 12 ขั้น (Omega Sequence),
                และฉันทามติ 10/10 REAL_HSM ที่ผูกพันตามกฎหมายไทย (ETDA Sec 9/26/28, PDPA Sec 37, NCSA CII)
              </p>
            </div>

            {/* Canonical Baseline Quick Stats */}
            <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs font-mono text-zinc-300 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Genesis Block:</span>
                <strong className="text-emerald-400">#{SYSTEM_METADATA.genesisBlock}</strong>
              </div>
              <div className="text-zinc-600">•</div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Seals:</span>
                <strong className="text-emerald-400">14,902 Frozen</strong>
              </div>
              <div className="text-zinc-600">•</div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">SSoT Drift:</span>
                <strong className="text-emerald-400">Δ0.00% Zero Drift</strong>
              </div>
              <div className="text-zinc-600">•</div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Cryo Bus:</span>
                <strong className="text-cyan-400">14.98 mK</strong>
              </div>
              <div className="text-zinc-600">•</div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Quorum:</span>
                <strong className="text-[#D4AF37]">10/10 REAL_HSM</strong>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isSimulating
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              }`}
            >
              {isSimulating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isSimulating ? `กำลังรันเฟส ${currentSimStep}/12...` : 'จำลองตรวจสอบ 12 ขั้น (Simulate)'}</span>
            </button>

            {onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="px-4 py-2.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                <Award className="w-4 h-4" />
                <span>ตราตั้งใบรับรองศาล (Certificate)</span>
              </button>
            )}
          </div>
        </div>

        {/* Canonical Merkle Root Display */}
        <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-zinc-400 truncate max-w-full">
            <Key className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="text-zinc-500">CANONICAL_MERKLE_ROOT:</span>
            <span className="text-emerald-400 truncate font-semibold">{CANONICAL_MERKLE_ROOT}</span>
          </div>
          <button
            onClick={() => copyText(CANONICAL_MERKLE_ROOT, 'merkle-root')}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copiedKey === 'merkle-root' ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>คัดลอกแฮช</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. EXECUTIVE 6-PILLAR BENTO INFOGRAPHIC CARDS                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pillar 1: Canonical Baseline */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-[#0a121e] to-[#070a12] border border-cyan-500/40 shadow-xl hover:border-cyan-400 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>1. Canonical Baseline</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
              SSoT Δ0.00%
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">สมอยึดความจริงแท้ (Root Anchor)</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Genesis Block #{SYSTEM_METADATA.genesisBlock}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="truncate">Root: 909ab8144798...fa4c68</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>14,902 Canonical Frozen Seals</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-emerald-400 font-semibold">Zero Drift 0.00% (0 Mutations)</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            เอกสารอ้างอิง: <span className="text-zinc-200">DOC-SOV-HSM-1010-2026</span>
          </div>
        </div>

        {/* Pillar 2: 4-Tier Sovereign Matrix */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-[#181408] to-[#070a12] border border-[#D4AF37]/40 shadow-xl hover:border-[#D4AF37] transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>2. 4-Tier Sovereign Matrix</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-mono font-bold">
              4/4 TIERS ACTIVE
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">สถาปัตยกรรมอธิปไตย 4 มิติ</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>PDPA Sec 37: Zero-Knowledge Vault</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>NCSA CII: Cryogenic Merkle Core</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>ETDA Sec 9/26: Dilithium-5 Signatures</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="text-purple-300">PQC: Kyber-1024 + Dilithium-5</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            ครอบคลุม: <span className="text-zinc-200">400 Enterprise Tenants (Ω601-Ω1000)</span>
          </div>
        </div>

        {/* Pillar 3: Omega Sequence */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#140b24] to-[#070a12] border border-purple-500/40 shadow-xl hover:border-purple-400 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>3. Omega Sequence</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
              {totalOmegaLatency} ms TOTAL
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">สายพานการรับรอง 12 ขั้นตอน</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>12-Phase Attestation Pipeline</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Latency SLA 0.9 ms – 5.1 ms per stage</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Verified Custodian Binding</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-emerald-400">Sub-Kelvin Bus Latency 0.31 ms</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            การฟื้นฟู Phoenix: <span className="text-emerald-400 font-semibold">35.8 ms (SLA &lt;142ms)</span>
          </div>
        </div>

        {/* Pillar 4: REAL_HSM Quorum */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0a1b16] to-[#070a12] border border-emerald-500/40 shadow-xl hover:border-emerald-400 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-4 h-4" />
              <span>4. REAL_HSM Quorum</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
              10/10 UNANIMOUS
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">สภาผู้พิทักษ์ฮาร์ดแวร์ Deca-Key</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>10/10 REAL_HSM Ratified Unanimous</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>FIPS 140-3 Level 4 / CC EAL6+ Enclaves</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Passports: CERT-SOV-0001 to 0010</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-cyan-300">NitroKey, YubiKey, Trezor, Ledger</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            Sovereign Principal: <span className="text-zinc-200">#EP-SOVEREIGN-01</span>
          </div>
        </div>

        {/* Pillar 5: ETDA Compliance */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-[#0a1426] to-[#070a12] border border-blue-500/40 shadow-xl hover:border-blue-400 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>5. ETDA Compliance</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
              FULL STATUTORY
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">ความชอบด้วยกฎหมายไทย</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Sec 9: Electronic Signature &amp; Intent</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Sec 26: Reliable e-Signature (Non-Repudiation)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Sec 28: Custody Duty &amp; Integrity</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-emerald-400">ป.วิ.พ. ม. 94/1 &amp; ม. 11 รับฟังได้เต็มที่</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            พยานหลักฐาน: <span className="text-zinc-200">7 สำนวนศาลพร้อมสืบ</span>
          </div>
        </div>

        {/* Pillar 6: Sovereign Verdict */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#1e0a12] to-[#070a12] border border-rose-500/40 shadow-xl hover:border-rose-400 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>6. Sovereign Verdict</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
              LOCKED FROZEN
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">คำตัดสินแห่งอธิปไตย</h3>
          <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span className="text-emerald-400 font-bold">APPROVED_SECURED</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Structural Integrity &amp; Authenticity</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>LOCKED SSoT Δ0.00% Immutable</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span className="text-[#D4AF37]">Treasury ฿4.23B THB + 14,902 oz Gold</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            ใบรับรอง: <span className="text-zinc-200">ZQ-GREEN-DEP-849202-3908</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE SUB-SECTIONS NAVIGATION TABS                 */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0a0f1e] rounded-xl border border-zinc-800/80 shadow-md overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('matrix');
            playTone(520, 0.04);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'matrix'
              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 font-semibold shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>4-Tier Sovereign Matrix</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('omega');
            playTone(560, 0.04);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'omega'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-semibold shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Omega Sequence (12 Phases)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('quorum');
            playTone(600, 0.04);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'quorum'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-semibold shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>REAL_HSM 10/10 Quorum Roster</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('compliance');
            playTone(640, 0.04);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'compliance'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 font-semibold shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>ETDA &amp; Statutory Matrix</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 4. TAB CONTENT 1: 4-TIER SOVEREIGN RUNTIME MATRIX            */}
      {/* ============================================================ */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D4AF37]" />
                <span>โครงสร้าง 4-Tier Sovereign Matrix เชิงลึก</span>
              </h2>
              <p className="text-xs text-zinc-400">
                สถาปัตยกรรม 4 ชั้นผสานมาตรฐานความมั่นคงไซเบอร์และข้อสันนิษฐานทางกฎหมาย
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30">
              100% INVARIANT VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOVEREIGN_MATRIX_TIERS.map((tier) => {
              const IconComp = tier.icon;
              const isSelected = selectedTier === tier.id;

              return (
                <div
                  key={tier.id}
                  onClick={() => {
                    setSelectedTier(tier.id);
                    playTone(480 + tier.tierNumber * 40, 0.04);
                  }}
                  className={`p-5 rounded-2xl bg-gradient-to-br ${tier.gradient} border ${tier.borderGlow} transition-all cursor-pointer shadow-xl relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-[#D4AF37]/50 scale-[1.01]' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
                        style={{
                          backgroundColor: `${tier.color}20`,
                          borderColor: `${tier.color}60`,
                          color: tier.color,
                        }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                          TIER 0{tier.tierNumber} RUNTIME
                        </div>
                        <h3 className="text-base font-bold text-white">{tier.titleTh}</h3>
                        <div className="text-xs text-zinc-300 font-medium">{tier.titleEn}</div>
                      </div>
                    </div>

                    <span
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0"
                      style={{
                        backgroundColor: `${tier.color}25`,
                        color: tier.color,
                        border: `1px solid ${tier.color}50`,
                      }}
                    >
                      {tier.passStatus}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-200 mt-3 p-3 rounded-xl bg-black/40 border border-zinc-800/80 leading-relaxed">
                    {tier.summaryTh}
                  </p>

                  <div className="mt-3 space-y-1.5">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      Technical Invariants &amp; Enforcements:
                    </div>
                    {tier.technicalEnforcements.map((enf, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{enf}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 text-[11px] truncate max-w-[200px]" title={tier.statute}>
                      {tier.statute}
                    </span>
                    <span className="font-bold text-emerald-400 text-[11px]">{tier.judicialVerdict}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TAB CONTENT 2: 12-PHASE OMEGA SEQUENCE SIMULATION         */}
      {/* ============================================================ */}
      {activeTab === 'omega' && (
        <div className="p-6 rounded-2xl bg-[#070a12] border border-purple-500/40 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <span>Omega Sequence: สายพานรับรองอธิปไตย 12 เฟส (0.9ms – 5.1ms)</span>
              </h2>
              <p className="text-xs text-zinc-400">
                12-Phase Attestation Flow พร้อมการผูกพันเจตนาตามกฎหมายและค่าเวลาแฝงจริง
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                  isSimulating
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40'
                }`}
              >
                {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? `จำลองขั้นที่ ${currentSimStep}/12...` : 'เริ่มจำลอง 12 เฟส'}</span>
              </button>
            </div>
          </div>

          {/* 12-Step Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {OMEGA_ATTESTATION_PHASES.map((phase) => {
              const isSelected = selectedPhase.step === phase.step;
              const isSimActive = isSimulating && currentSimStep === phase.step;

              return (
                <button
                  key={phase.step}
                  onClick={() => {
                    setSelectedPhase(phase);
                    playTone(380 + phase.step * 30, 0.04);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSimActive
                      ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/60 scale-[1.03] shadow-lg'
                      : isSelected
                      ? 'bg-purple-500/20 border-purple-400 ring-1 ring-purple-400/40 shadow-md'
                      : 'bg-black/50 border-zinc-800 hover:border-zinc-700 hover:bg-black/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span className="font-bold">P{phase.step.toString().padStart(2, '0')}</span>
                    <span className="text-emerald-400 font-bold">{phase.latencyMs}ms</span>
                  </div>

                  <div className="font-semibold text-xs text-white truncate" title={phase.nameTh}>
                    {phase.nameTh}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{phase.nameEn}</div>

                  <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-zinc-400 truncate">{phase.legalBinding}</span>
                    <span className="text-emerald-400 font-bold">✓ PASS</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Phase Details Inspector */}
          <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/40">
                  PHASE {selectedPhase.step.toString().padStart(2, '0')} / 12 ({selectedPhase.phaseId})
                </span>
                <h3 className="text-sm md:text-base font-bold text-white">
                  {selectedPhase.nameTh}{' '}
                  <span className="text-zinc-400 font-normal text-xs">({selectedPhase.nameEn})</span>
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-zinc-400">
                  เวลาแฝง (Latency): <strong className="text-emerald-400">{selectedPhase.latencyMs} ms</strong>
                </span>
                <span className="text-zinc-400">
                  การผูกพันกฎหมาย: <strong className="text-cyan-400">{selectedPhase.statute}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Key Action:</span>
                <p className="text-zinc-200 mt-1 font-semibold">{selectedPhase.keyAction}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 md:col-span-2">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">
                  Cryptographic Enforcement &amp; Court Admissibility:
                </span>
                <p className="text-emerald-400 mt-1">{selectedPhase.cryptoDetail}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB CONTENT 3: REAL_HSM 10/10 QUORUM ROSTER              */}
      {/* ============================================================ */}
      {activeTab === 'quorum' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <span>บัญชีผู้พิทักษ์ฮาร์ดแวร์ Deca-Key REAL_HSM (10/10 Quorum Ratified)</span>
              </h2>
              <p className="text-xs text-zinc-400">
                รายชื่อและสถานะฮาร์ดแวร์ FIPS 140-3 ระดับ 4 ของผู้พิทักษ์ทั้ง 10 ประจำจุดสำคัญทั่วโลก
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded bg-emerald-500/15 border border-emerald-500/30">
              10/10 UNANIMOUS RATIFICATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {THAI_CUSTODIANS.map((custodian, idx) => (
              <div
                key={custodian.id}
                className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#D4AF37]">TC-0{idx + 1}</span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    RATIFIED
                  </span>
                </div>

                <div className="font-bold text-xs text-white truncate" title={custodian.nameTh}>
                  {custodian.nameTh}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">{custodian.roleTh}</div>

                <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[10px] font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>Passport:</span>
                    <span className="text-zinc-200">{custodian.passportNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hardware:</span>
                    <span className="text-cyan-400 truncate max-w-[100px]">{custodian.hardware || 'FIPS 140-3'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Algorithm:</span>
                    <span className="text-purple-300">{custodian.algorithm || 'Dilithium-5'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. TAB CONTENT 4: ETDA & STATUTORY COMPLIANCE TABLE          */}
      {/* ============================================================ */}
      {activeTab === 'compliance' && (
        <div className="p-6 rounded-2xl bg-[#070a12] border border-blue-500/40 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" />
              <span>ตารางสรุปข้อกฎหมายและหลักเกณฑ์การรับฟังพยานหลักฐาน (Statutory Compliance)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              การผูกพันตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์, PDPA, พ.ร.บ. ไซเบอร์ และ ประมวลกฎหมายวิธีพิจารณาความแพ่ง
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                  <th className="p-3">กฎหมาย / มาตรา</th>
                  <th className="p-3">สาระสำคัญทางกฎหมาย</th>
                  <th className="p-3">การบังคับใช้ใน ZYRQUEN Ω∞</th>
                  <th className="p-3">ผลทางคดีในชั้นศาล</th>
                  <th className="p-3 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr className="hover:bg-zinc-900/30">
                  <td className="p-3 font-bold text-[#D4AF37]">พ.ร.บ. ธุรกรรมฯ ม. 9</td>
                  <td className="p-3">ความสมบูรณ์ของลายมือชื่ออิเล็กทรอนิกส์และเจตนา</td>
                  <td className="p-3 text-zinc-200">ประทับเวลา RFC 3161 ร่วมกับ ML-DSA-87 ของผู้มีอำนาจ</td>
                  <td className="p-3 text-emerald-400">รับฟังได้เสมือนลงลายมือชื่อบนกระดาษ</td>
                  <td className="p-3 text-right font-bold text-emerald-400">✓ PASS</td>
                </tr>
                <tr className="hover:bg-zinc-900/30">
                  <td className="p-3 font-bold text-[#D4AF37]">พ.ร.บ. ธุรกรรมฯ ม. 26</td>
                  <td className="p-3">ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ (Non-Repudiation)</td>
                  <td className="p-3 text-zinc-200">Deca-Key 10/10 REAL_HSM FIPS 140-3 L4 ปลอดการปฏิเสธความรับผิด</td>
                  <td className="p-3 text-emerald-400">สันนิษฐานว่าเป็นลายมือชื่อที่เชื่อถือได้</td>
                  <td className="p-3 text-right font-bold text-emerald-400">✓ PASS</td>
                </tr>
                <tr className="hover:bg-zinc-900/30">
                  <td className="p-3 font-bold text-[#D4AF37]">พ.ร.บ. ธุรกรรมฯ ม. 28</td>
                  <td className="p-3">หน้าที่ดูแลรักษาข้อมูลและระบบการประมวลผล</td>
                  <td className="p-3 text-zinc-200">WORM Ledger 14,902 ตราประทับ ป้องกันการแก้ไขย้อนหลัง</td>
                  <td className="p-3 text-emerald-400">ไม่มีการดัดแปลงแก้ไข SSoT Δ0.00%</td>
                  <td className="p-3 text-right font-bold text-emerald-400">✓ PASS</td>
                </tr>
                <tr className="hover:bg-zinc-900/30">
                  <td className="p-3 font-bold text-cyan-400">PDPA พ.ศ. 2562 ม. 37</td>
                  <td className="p-3">มาตรการรักษาความปลอดภัยของข้อมูลส่วนบุคคล</td>
                  <td className="p-3 text-zinc-200">Zero-Knowledge Vault แบ่งแยก 400 องค์กร (Ω601–Ω1000)</td>
                  <td className="p-3 text-emerald-400">ป้องกันโทษปรับสูงสุด 5 ล้านบาท</td>
                  <td className="p-3 text-right font-bold text-emerald-400">✓ PASS</td>
                </tr>
                <tr className="hover:bg-zinc-900/30">
                  <td className="p-3 font-bold text-emerald-400">พ.ร.บ. ไซเบอร์ (NCSA CII)</td>
                  <td className="p-3">การรักษาความมั่นคงปลอดภัยโครงสร้างพื้นฐานสำคัญ</td>
                  <td className="p-3 text-zinc-200">Fail-Closed &lt;1.2ms พร้อม Phoenix Recovery 35.8ms</td>
                  <td className="p-3 text-emerald-400">ผ่านการตรวจสอบความมั่นคงสูงสุด</td>
                  <td className="p-3 text-right font-bold text-emerald-400">✓ PASS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. FOOTER ATTESTATION SIGN-OFF                                */}
      {/* ============================================================ */}
      <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 text-center text-xs font-mono text-zinc-400 space-y-1">
        <div>
          Sovereign Verdict: <span className="text-emerald-400 font-bold">APPROVED_SECURED</span> • Principal Custodian:{' '}
          <span className="text-zinc-200 font-semibold">{SYSTEM_METADATA.sovereignPrincipal}</span>
        </div>
        <div className="text-[11px] text-zinc-500">
          Canonical Root: {CANONICAL_MERKLE_ROOT} • 14,902 Frozen Seals • Zero Drift Δ0.00%
        </div>
      </div>
    </div>
  );
};
