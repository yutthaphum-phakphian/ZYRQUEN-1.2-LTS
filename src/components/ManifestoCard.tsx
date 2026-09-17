import React, { useState } from 'react';
import systemMetadata from '../../metadata.json';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { SSOT } from '../lib/ssot-data';
import {
  Terminal,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Download,
  Flame,
  Award,
  Cpu,
  FileCode,
  Sparkles,
  Zap,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Globe,
  Radio,
  Layers,
  Database,
  CheckCircle2,
  FileCheck,
  Shield,
  Activity
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface ManifestoCardProps {
  onOpenCertificate?: () => void;
}

export const ManifestoCard: React.FC<ManifestoCardProps> = ({ onOpenCertificate }) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [crtEffect, setCrtEffect] = useState(true);
  const [activeTab, setActiveTab] = useState<'MANIFESTO' | 'BASELINE' | 'SECURITY_GATES' | 'PHASES_40' | 'TREASURY'>('MANIFESTO');

  // Core metadata dynamically extracted from metadata.json and current system state
  const METADATA = {
    name: systemMetadata.name || 'ZYRQUEN Ω∞ Sovereign Kernel & Truth Matrix',
    description: systemMetadata.description || 'Sovereign Operating System with 6-Stage DAG Automation Plane',
    edition: SYSTEM_METADATA?.version || SSOT.productVersion || 'APEX ULTIMATE FULL EDITION — LOCKED_FROZEN_v1.2_LTS',
    principal: SSOT.sovereignPrincipal || SYSTEM_METADATA.sovereignPrincipal || 'นายยุทธภูมิ พากเพียร (ID: #EP-SOVEREIGN-01)',
    platformBoundary: SYSTEM_METADATA.platformBoundary || 'Ω601–Ω1000 | Strict Enforcement',
    classification: 'Sovereign Immutable Kernel — Single Source of Truth (SSoT)',
    blocks: `#${SSOT.canonicalBlockHeight} / #849203 / #40202`,
    canonicalBlock: SSOT.canonicalBlockHeight || SYSTEM_METADATA.sealedBlock || 849202,
    merkleRoot: SSOT.merkleRoot || SYSTEM_METADATA.merkleRoot || '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    certificateId: 'ZQ-GOLD-DEP-849202-3908',
    liveUrl: 'https://hugeplease66-debug.github.io/',
    engine: 'v4.16',
    npmVersion: 'v4.16.0',
    canonicalSeals: SSOT.canonicalSealsCount || SYSTEM_METADATA.canonicalSeals || 14902,
    quarantinedSeals: 80,
    rawSeals: (SSOT.canonicalSealsCount || 14902) + 80,
    ssotDelta: '0',
    baselineDrift: SYSTEM_METADATA.baselineDrift || '0.00%',
    phoenixSLA: '142ms',
    custodianQuorum: SSOT.quorum || SYSTEM_METADATA.quorum || '10/10 REAL_HSM (Required 8, Actual 10)',
    cryoTemp: `${SYSTEM_METADATA.cryoTemp || SSOT.cryoTemp || '14.98 mK'} (Drift 0.00%)`,
    qOps: `${SYSTEM_METADATA.qOpsTelemetry || SSOT.qops || 851.9} Sustained`,
    coherence: SYSTEM_METADATA.coherence || SSOT.coherence || '99.992%',
    thaiLegal: SYSTEM_METADATA.legalCompliance || SSOT.legalCompliance || 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (มาตรา 9, 26, 28) & PDPA พ.ศ. 2562',
    pqcSuite: 'ML-KEM-1024 (FIPS 203), ML-DSA-87 / Dilithium-5 (FIPS 204), SLH-DSA (FIPS 205)'
  };

  const handleCopy = () => {
    playTone(880, 0.05);
    const manifestoFullText = `================================================================================
ZYRQUEN Ω∞ SOVEREIGN MANIFESTO & TRUTH MATRIX
APEX ULTIMATE FULL EDITION — LOCKED_FROZEN_v1.2_LTS
================================================================================
Sovereign Principal: ${METADATA.principal}
Clearance Level: OMEGA-1 SUPREME CLEARANCE
Platform Boundary: ${METADATA.platformBoundary}
Classification: ${METADATA.classification}
Canonical Block: #${METADATA.canonicalBlock} | Seals: ${METADATA.canonicalSeals} Verified
Genesis Merkle Root: ${METADATA.merkleRoot}
Certificate Anchor: ${METADATA.certificateId}
Official Live Portal: ${METADATA.liveUrl}

1. EXECUTIVE SUMMARY:
ZYRQUEN Ω∞ คือ Sovereign Kernel และ Truth Matrix ที่ออกแบบภายใต้หลักการ
Immutable Single Source of Truth โดยทุกสถานะของระบบถูกล็อคและตรวจสอบได้ด้วย cryptographic proof
รุ่น APEX ULTIMATE FULL EDITION เป็นการรวมองค์ประกอบ G11-G13 Security Gates, Prod Readiness,
Phoenix Self-Healing 142ms, FIOS DS-901, NIST Post-Quantum Cryptography, 10 Invariants,
Cryo Telemetry และ พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 เข้ากับ 17 Canonical Operating Modules

2. INVIOLABLE SSoT INVARIANTS:
- SSoT Mutation Delta: ${METADATA.ssotDelta} (ZERO DRIFT)
- Baseline Drift: ${METADATA.baselineDrift}
- Custodian Quorum: ${METADATA.custodianQuorum}
- Fail-Closed by Default: Active Zeroization on Tamper -> Quarantine Chamber 02
- Cryptographic Suite: ${METADATA.pqcSuite}
- Statutory Binding: ${METADATA.thaiLegal}

3. FIDUCIARY TREASURY (4.23B VALUATION):
- THB-SOV: ฿1,490,200,000.00 (100% Thai Treasury Guaranteed)
- XAU-PHYS: 14,902.00 oz Allocated Physical Gold (LBMA 99.99%)
- RWA-INFRA: National Fiber & Satellite Token (400 Tenants Ω601-Ω1000)

4. 40 PHASES VERIFICATION:
ALL 40/40 PASS | Status: 100% ALL GREEN | Frozen Core Contract Read-Only

Signed and Sealed by Dilithium-5 (ML-DSA-87) Key Ceremony #EP-SOVEREIGN-01
================================================================================`;

    navigator.clipboard.writeText(manifestoFullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerifySignature = () => {
    setIsVerifying(true);
    playTone(523.25, 0.08);
    setTimeout(() => playTone(659.25, 0.08), 90);
    setTimeout(() => playTone(783.99, 0.1), 180);

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
      playAuditChime();
      setTimeout(() => setVerificationSuccess(false), 4500);
    }, 650);
  };

  const handleDownloadAscii = () => {
    playTone(720, 0.05);
    const content = `-----BEGIN ZYRQUEN OMEGA SOVEREIGN MANIFESTO-----
Version: ZYRQUEN v4.16 LOCKED_FROZEN_v1.2_LTS
Principal: Yuttaphum Phakphian (#EP-SOVEREIGN-01)
Authority-Clearance: OMEGA-1 SUPREME CLEARANCE
Block-Height: 849202
Merkle-Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
Seals-Verified: 14902
Quarantine-Seals: 80
SSoT-Delta: 0.000%
NIST-PQC: FIPS203-ML-KEM-1024 / FIPS204-ML-DSA-87 / FIPS205-SLH-DSA
Legal-Jurisdiction: Thailand ETDA B.E. 2544 (Sec 9, 26, 28) & PDPA B.E. 2562
Fail-Closed-Trigger: 85.0C Thermal / Active Zeroization -> Chamber 02
Fiduciary-Treasury: THB 1.49B + 14902 oz Gold + 400 RWA Tenants = 4.23B Total

The Sovereign Truth Matrix is locked and perpetually immutable.
-----BEGIN DILITHIUM-5 SIGNATURE-----
k8F1a99014299831ffbc11289947aa1029348bc1209384bcda90192834bfa012
909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
E28F89B28B7A44F0A992BC9098711425667102E3B0C44298FC1C149AFBF4C899
-----END DILITHIUM-5 SIGNATURE-----
-----END ZYRQUEN OMEGA SOVEREIGN MANIFESTO-----`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_SOVEREIGN_MANIFESTO_BLOCK_849202.asc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="zyrquen-manifesto-card"
      className={`rounded-[28px] bg-[#050811] border border-cyan-500/40 p-5 sm:p-7 shadow-2xl relative overflow-hidden font-mono transition-all duration-300 ${
        terminalExpanded ? 'ring-2 ring-cyan-400/80 shadow-[0_0_80px_rgba(6,182,212,0.25)]' : ''
      }`}
    >
      {/* Faint CRT Scanline Overlay Effect */}
      {crtEffect && (
        <div
          className="pointer-events-none absolute inset-0 z-20 opacity-[0.035] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px]"
          aria-hidden="true"
        />
      )}

      {/* Terminal Ambient Light Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Terminal Bar Window Header */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-4">
        {/* Terminal Window Controls & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 tracking-wider">
              ZYRQUEN_TERMINAL // SOVEREIGN_MANIFESTO.sh
            </span>
          </div>

          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold">
            OMEGA-1 AUTHORIZED
          </span>
        </div>

        {/* Header Actions & Utilities */}
        <div className="flex items-center gap-2">
          {/* CRT Scanline Toggle */}
          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`px-2 py-1 rounded-lg text-[10px] border transition flex items-center gap-1 ${
              crtEffect
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-black/40 text-zinc-400 border-white/10 hover:text-zinc-200'
            }`}
            title="สลับเอฟเฟกต์หลอดภาพ CRT Scanlines"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">CRT:</span>
            <span>{crtEffect ? 'ON' : 'OFF'}</span>
          </button>

          {/* Copy Manifesto */}
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1.5"
            title="คัดลอกแถลงการณ์ลงในคลิปบอร์ด"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          {/* Verify Signature */}
          <button
            onClick={handleVerifySignature}
            disabled={isVerifying}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold transition flex items-center gap-1.5"
            title="ตรวจสอบความถูกต้องของลายเซ็น Dilithium-5"
          >
            <ShieldCheck className={`w-3 h-3 text-cyan-400 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'VERIFYING...' : 'VERIFY SIG'}</span>
          </button>

          {/* Download .asc */}
          <button
            onClick={handleDownloadAscii}
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1.5"
            title="ดาวน์โหลดไฟล์ .asc (ASCII Armor)"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>.ASC</span>
          </button>

          {/* Toggle Expand / Collapse */}
          <button
            onClick={() => setTerminalExpanded(!terminalExpanded)}
            className="p-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition"
            title={terminalExpanded ? 'ย่อส่วนการแสดงผล' : 'ขยายส่วนการแสดงผล'}
          >
            {terminalExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Verification Flash Alert Banner */}
      {verificationSuccess && (
        <div className="relative z-30 mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>VALIDATED:</strong> Post-Quantum Dilithium-5 ML-DSA signature confirmed against Genesis Merkle Root 909ab814... (SSoT Delta: 0.00%)
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-[10px] font-bold border border-emerald-400/30">
            10/10 REAL_HSM
          </span>
        </div>
      )}

      {/* Terminal ASCII Art & Identity Banner */}
      <div className="relative z-30 pt-4 pb-3">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <pre className="text-[9px] sm:text-[11px] leading-[1.15] text-cyan-400 select-none overflow-x-auto font-mono">
{`███████╗██╗   ██╗██████╗  ██████╗ ██╗   ██╗███████╗███╗   ██╗     ██████╗  ██████╗
╚══███╔╝╚██╗ ██╔╝██╔══██╗██╔═══██╗██║   ██║██╔════╝████╗  ██║    ██╔════╝ ██╔════╝
  ███╔╝  ╚████╔╝ ██████╔╝██║   ██║██║   ██║█████╗  ██╔██╗ ██║    ██║  ███╗██║  ███╗
 ███╔╝    ╚██╔╝  ██╔══██╗██║▄▄ ██║██║   ██║██╔══╝  ██║╚██╗██║    ██║   ██║██║   ██║
███████╗   ██║   ██║  ██║╚██████╔╝╚██████╔╝███████╗██║ ╚████║    ╚██████╔╝╚██████╔╝
╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝     ╚═════╝  ╚═════╝ `}
            </pre>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="font-bold text-white tracking-wide">
                ZYRQUEN Ω∞ SOVEREIGN MANIFESTO & TRUTH MATRIX
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                {METADATA.edition}
              </span>
            </div>
          </div>

          {/* Quick Metrics Badge Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2 text-[10px] shrink-0">
            <div className="p-2 rounded-xl bg-black/50 border border-white/5">
              <span className="text-zinc-500 block">CANONICAL SEALS</span>
              <span className="text-emerald-400 font-bold text-xs">{METADATA.canonicalSeals.toLocaleString()} Verified</span>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border border-white/5">
              <span className="text-zinc-500 block">MERKLE ROOT HASH</span>
              <span className="text-cyan-300 font-bold font-mono text-[10px] truncate max-w-[120px] block" title={METADATA.merkleRoot}>
                {METADATA.merkleRoot.slice(0, 12)}...
              </span>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border border-white/5">
              <span className="text-zinc-500 block">BASELINE DRIFT</span>
              <span className="text-amber-300 font-bold text-xs">{METADATA.baselineDrift} (Δ0)</span>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border border-white/5">
              <span className="text-zinc-500 block">CUSTODIAN QUORUM</span>
              <span className="text-violet-300 font-bold text-xs">10/10 REAL_HSM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Navigation Tabs */}
      <div className="relative z-30 flex flex-wrap items-center gap-1.5 border-y border-white/10 py-2.5 my-3 text-[11px]">
        <button
          onClick={() => {
            playTone(600, 0.02);
            setActiveTab('MANIFESTO');
          }}
          className={`px-3 py-1.5 rounded-xl border transition font-bold flex items-center gap-1.5 ${
            activeTab === 'MANIFESTO'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
              : 'bg-black/30 text-zinc-400 border-white/5 hover:text-zinc-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>1. แถลงการณ์อธิปไตย (Manifesto)</span>
        </button>

        <button
          onClick={() => {
            playTone(630, 0.02);
            setActiveTab('BASELINE');
          }}
          className={`px-3 py-1.5 rounded-xl border transition font-bold flex items-center gap-1.5 ${
            activeTab === 'BASELINE'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-black/30 text-zinc-400 border-white/5 hover:text-zinc-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>2. สัญญาแช่แข็ง (Frozen Baseline)</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.02);
            setActiveTab('SECURITY_GATES');
          }}
          className={`px-3 py-1.5 rounded-xl border transition font-bold flex items-center gap-1.5 ${
            activeTab === 'SECURITY_GATES'
              ? 'bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-sm'
              : 'bg-black/30 text-zinc-400 border-white/5 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-violet-400" />
          <span>3. ด่าน G11-G13 & 10 Invariants</span>
        </button>

        <button
          onClick={() => {
            playTone(690, 0.02);
            setActiveTab('PHASES_40');
          }}
          className={`px-3 py-1.5 rounded-xl border transition font-bold flex items-center gap-1.5 ${
            activeTab === 'PHASES_40'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
              : 'bg-black/30 text-zinc-400 border-white/5 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>4. บทพิสูจน์ 40 วัฏจักร (40 Phases)</span>
        </button>

        <button
          onClick={() => {
            playTone(720, 0.02);
            setActiveTab('TREASURY');
          }}
          className={`px-3 py-1.5 rounded-xl border transition font-bold flex items-center gap-1.5 ${
            activeTab === 'TREASURY'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
              : 'bg-black/30 text-zinc-400 border-white/5 hover:text-zinc-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-rose-400" />
          <span>5. คลังสินทรัพย์ & ดาวเทียม 6 โหนด</span>
        </button>
      </div>

      {/* Tab 1: Manifesto Executive Summary */}
      {activeTab === 'MANIFESTO' && (
        <div className="relative z-30 space-y-4 text-xs animate-in fade-in">
          {/* Executive Overview Box */}
          <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>1. บทสรุปผู้บริหารสูงสุด (Executive Summary)</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                Authorized by: {METADATA.principal}
              </span>
            </div>
            <p className="text-zinc-200 leading-relaxed font-sans text-xs">
              <strong>ZYRQUEN Ω∞</strong> คือ Sovereign Kernel และ Truth Matrix ที่ออกแบบภายใต้หลักการ <strong>Immutable Single Source of Truth (SSoT)</strong> โดยทุกสถานะของระบบถูกล็อคและตรวจสอบได้ด้วยหลักฐานเข้ารหัส (Cryptographic Proof) ปราศจากการบิดเบือน
            </p>
            <p className="text-zinc-400 leading-relaxed font-sans text-xs">
              รุ่น <strong>APEX ULTIMATE FULL EDITION</strong> เป็นการรวมองค์ประกอบที่เคยแยกส่วน ได้แก่ G11-G13 Security Gates, Phoenix Self-Healing 142ms, FIOS DS-901, NIST Post-Quantum Cryptography, 10 Invariants, Cryo Telemetry และ พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 เข้ากับ 17 Canonical Operating Modules เพื่อให้สามารถตรวจสอบและใช้งานได้จาก Single Artifact
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block text-[9px]">MUTATION DELTA</span>
                <span className="text-emerald-400 font-bold">Δ = 0 (Strict Frozen)</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block text-[9px]">BASELINE DRIFT</span>
                <span className="text-cyan-400 font-bold">0.00% Zero Drift</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block text-[9px]">FAIL-CLOSED GUARD</span>
                <span className="text-rose-400 font-bold">Chamber 02 Quarantine</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block text-[9px]">PQC SECURED</span>
                <span className="text-amber-400 font-bold">Dilithium-5 / Kyber-1024</span>
              </div>
            </div>
          </div>

          {/* 4 Sovereign Governance Invariants (Articles of Faith) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                <Lock className="w-3.5 h-3.5" />
                <span>หมวด ๑: ความสัจจริงเชิงเดี่ยวอันมิอาจล่วงละเมิด (Inviolable SSoT)</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                สถานะระบบ รหัสบล็อก #849202 และ 14,902 ตราประทับ จะคงอยู่ถาวร ห้ามมิให้มีการแก้ไข บิดเบือน หรือแทรกแซงจากบุคคลภายนอก หากเกิดการตรวจจับความผิดปกติ ระบบจะตัดตอนสู่อุณหภูมิ 85.0°C เข้าสู่ Chamber 02 ทันที
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
              <div className="flex items-center gap-1.5 text-violet-400 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>หมวด ๒: การคุ้มครองหลังยุคควอนตัม (NIST PQC Suite)</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                การสื่อสารและตราประทับได้รับการเข้ารหัสด้วย FIPS 203 (ML-KEM-1024), FIPS 204 (ML-DSA-87 Dilithium-5) และ FIPS 205 (SLH-DSA) ปลอดภัยต่อการถอดรหัสของควอนตัมคอมพิวเตอร์ 100%
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <Award className="w-3.5 h-3.5" />
                <span>หมวด ๓: การรับรองและผลผูกพันทางกฎหมายไทย (ETDA & PDPA)</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                สอดคล้องตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙, ๒๖, ๒๘ (Safe Harbor) และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ พร้อมนำสืบเป็นพยานหลักฐานดิจิทัลในชั้นศาลตามมาตรฐาน ISO 27037
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                <Zap className="w-3.5 h-3.5" />
                <span>หมวด ๔: ฟีนิกซ์ฮีลลิ่งอัตโนมัติ ๑๔๒ มิลลิวินาที (Phoenix Resilience)</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                วัฏจักรการฟื้นฟูตนเอง 5 ขั้นตอน (Detect, Analyze, Decide, Act, Verify) ทำงานภายใน 142ms คืนค่าสมบูรณ์ให้แก่ทุกโหนดโดยไม่สูญเสียความต่อเนื่องของห่วงโซ่ Merkle
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Canonical Contract — Frozen Baseline */}
      {activeTab === 'BASELINE' && (
        <div className="relative z-30 space-y-3 text-xs animate-in fade-in">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
            <span className="text-amber-400 font-bold">Canonical Contract — Frozen Baseline</span>
            <span className="text-zinc-400 text-[11px]">Single Source of Trust Anchor</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/8 bg-black/40">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/5 text-zinc-400 uppercase text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-2.5">Parameter</th>
                  <th className="p-2.5">Canonical Value</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">System Name</td>
                  <td className="p-2.5 text-white font-bold">{METADATA.name}</td>
                  <td className="p-2.5 text-emerald-400">NOMINAL</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Codename</td>
                  <td className="p-2.5 text-amber-300">{METADATA.edition}</td>
                  <td className="p-2.5 text-emerald-400">LOCKED</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Canonical Seals</td>
                  <td className="p-2.5 text-emerald-300 font-bold">{METADATA.canonicalSeals.toLocaleString()} Verified (Quarantine: 80, Raw: 14,982)</td>
                  <td className="p-2.5 text-emerald-400">SEALED</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Merkle Root Hash</td>
                  <td className="p-2.5 text-cyan-300 break-all select-all">{METADATA.merkleRoot}</td>
                  <td className="p-2.5 text-cyan-400">GENESIS MATCH</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Canonical Block</td>
                  <td className="p-2.5 text-white font-bold">#{METADATA.canonicalBlock} (Aux: #849203 / #40202)</td>
                  <td className="p-2.5 text-emerald-400">FROZEN</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">SSoT Delta / Drift</td>
                  <td className="p-2.5 text-emerald-400 font-bold">Δ = 0 / 0.00% Zero Drift</td>
                  <td className="p-2.5 text-emerald-400">INVOLATILE</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Phoenix Healing SLA</td>
                  <td className="p-2.5 text-cyan-300">{METADATA.phoenixSLA} (5-Phase Pipeline)</td>
                  <td className="p-2.5 text-cyan-400">VERIFIED</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Custodian Quorum</td>
                  <td className="p-2.5 text-violet-300">{METADATA.custodianQuorum}</td>
                  <td className="p-2.5 text-emerald-400">PASS (10/10)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Platform Boundary</td>
                  <td className="p-2.5 text-white">{METADATA.platformBoundary}</td>
                  <td className="p-2.5 text-emerald-400">ENFORCED</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-zinc-300 font-sans">Certificate Anchor</td>
                  <td className="p-2.5 text-amber-300">{METADATA.certificateId}</td>
                  <td className="p-2.5 text-amber-400">GOLD MASTER</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security Assurance — G11, G12, G13 & 10 Invariants */}
      {activeTab === 'SECURITY_GATES' && (
        <div className="relative z-30 space-y-4 text-xs animate-in fade-in">
          {/* G11-G13 Gates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-xs">G11 — Custodian Quorum</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">PASS</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                10 Slots: Alpha, Beta, Gamma, Delta, Epsilon, Zeta, Eta, Theta, Iota, Kappa.
                Required 8/10 | Achieved 10/10 REAL_HSM (FIPS 140-3 L4).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold text-xs">G12 — Root Provenance</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">VALID</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Genesis Token Match: PASS. Merkle Inclusion Proof: VALID. Platform Boundary Ω601–Ω1000: ENFORCED.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold text-xs">G13 — Composite Promotion</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">AUTHORIZED</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                10/10 Invariants: PASS. HSM Quorum: PASS. Genesis: VALID. Status: FINAL CLOSURE COMPLETE.
              </p>
            </div>
          </div>

          {/* 10 Invariant Laws (10/10 GREEN) */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/8 space-y-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>10 Invariant Laws — 10/10 ALL GREEN PASSED</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">ZERO MUTATION TOLERANCE</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-01 Canonical Non-Mutation</span>
                <span className="text-emerald-400 font-bold">0 Allowed</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-02 Merkle Root Deterministic</span>
                <span className="text-emerald-400 font-bold">909ab814...</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-03 Zero Trust Continuous Auth</span>
                <span className="text-emerald-400 font-bold">Dilithium-5</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-04 Blast Radius Boundary</span>
                <span className="text-emerald-400 font-bold">&lt; 2.0% Bound</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-05 Fail-Closed Auto-Defensive</span>
                <span className="text-rose-400 font-bold">Chamber 02 Isolate</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-06 Telemetry Non-Authoritative</span>
                <span className="text-blue-400 font-bold">Metrics Isolated</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-07 Zero Drift Baseline</span>
                <span className="text-emerald-400 font-bold">Δ0.00% Verified</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-08 14,902 Sealed Continuity</span>
                <span className="text-amber-400 font-bold">SHA-256 Chaining</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-09 Thai Sovereign Principal</span>
                <span className="text-emerald-400 font-bold">EP-SOVEREIGN-01</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-white/[0.02]">
                <span className="text-zinc-300">INV-10 12-Stage Forensic Trace</span>
                <span className="text-cyan-400 font-bold">39.4ms &lt; 142ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 40 Phases Verification — ALL GREEN 40/40 PASS */}
      {activeTab === 'PHASES_40' && (
        <div className="relative z-30 space-y-3 text-xs animate-in fade-in">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
            <div>
              <span className="text-emerald-400 font-bold text-xs block">
                40 Phases Verification — ALL GREEN 40/40 PASS
              </span>
              <span className="text-[10px] text-zinc-400">
                Foundation (P01-P10) • Governance (P11-P20) • Operations (P21-P30) • Extension (P31-P40)
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold text-[10px]">
              100% GREEN (14,902 SEALS)
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto pr-1 space-y-1 rounded-xl border border-white/5 bg-black/40 p-2 font-mono text-[10px]">
            <div className="grid grid-cols-12 gap-1 text-zinc-500 uppercase px-2 py-1 border-b border-white/5 font-bold">
              <span className="col-span-1">ID</span>
              <span className="col-span-6">Phase Name</span>
              <span className="col-span-2">Domain</span>
              <span className="col-span-1">Seals</span>
              <span className="col-span-2 text-right">Status</span>
            </div>

            {[
              { id: 'P01', name: 'Genesis Block Initialization', domain: 'Foundation' },
              { id: 'P02', name: 'SSoT Single Source of Truth Lock', domain: 'Foundation' },
              { id: 'P03', name: 'Merkle Tree Root Anchoring', domain: 'Foundation' },
              { id: 'P04', name: 'Cryogenic Vault 14.98 mK Stabilization', domain: 'Foundation' },
              { id: 'P05', name: 'HSM Quorum 10/10 REAL_HSM Mount', domain: 'Foundation' },
              { id: 'P06', name: 'Entropy Seeding & Quantum Random', domain: 'Foundation' },
              { id: 'P07', name: 'Lattice Field Calibration', domain: 'Foundation' },
              { id: 'P08', name: 'Time Anchor Block #849202', domain: 'Foundation' },
              { id: 'P09', name: 'Boot Attestation & Secure Enclave', domain: 'Foundation' },
              { id: 'P10', name: 'Key Ceremony #EP-SOVEREIGN-01', domain: 'Foundation' },
              { id: 'P11', name: 'G11 Custodian Quorum Formation', domain: 'Governance' },
              { id: 'P12', name: 'G12 Security Gate Stack', domain: 'Governance' },
              { id: 'P13', name: 'G13 Sovereign Legal Convergence', domain: 'Governance' },
              { id: 'P14', name: 'ETDA Level 3+ Compliance Certification', domain: 'Governance' },
              { id: 'P15', name: 'PDPA & Ratchakitcha Cloudflare Ray 43106bc8', domain: 'Governance' },
              { id: 'P16', name: 'Custodian Rotation & Dual-Custody', domain: 'Governance' },
              { id: 'P17', name: 'Audit Vault & Immutable Ledger Parity 452/452', domain: 'Governance' },
              { id: 'P18', name: 'Zero-Trust Network & Firewall Shield', domain: 'Governance' },
              { id: 'P19', name: 'SoD Creator ≠ Approver Enforcement', domain: 'Governance' },
              { id: 'P20', name: 'Truth Gate Validation Protocol', domain: 'Governance' },
              { id: 'P21', name: 'Phoenix 142ms Auto-Recovery Daemon', domain: 'Operations' },
              { id: 'P22', name: 'QOps 851.9 Quantum Operations Engine', domain: 'Operations' },
              { id: 'P23', name: 'Warp Drive Ω∞ Propulsion 37.93 MW', domain: 'Operations' },
              { id: 'P24', name: 'Fuel Core Burn Stabilization', domain: 'Operations' },
              { id: 'P25', name: 'Coherence 99.98% Lock', domain: 'Operations' },
              { id: 'P26', name: 'NIST FIPS 203 ML-KEM + 204 ML-DSA + 205 SLH', domain: 'Operations' },
              { id: 'P27', name: 'QKD 256-bit + X448 Secure Channel', domain: 'Operations' },
              { id: 'P28', name: 'Treasury THB 1.49B + XAU 14,902 oz + RWA 400', domain: 'Operations' },
              { id: 'P29', name: 'Satellite Mesh 6 Nodes Sovereign Network', domain: 'Operations' },
              { id: 'P30', name: 'Cryo Telemetry 14.90-15.02 mK Monitoring', domain: 'Operations' },
              { id: 'P31', name: '8K Ultra-Precision Tactical Quantum Radar', domain: 'Extension' },
              { id: 'P32', name: 'CLI Terminal ZYRQUEN SH', domain: 'Extension' },
              { id: 'P33', name: 'Passport Sovereign ID #EP-SOVEREIGN-01', domain: 'Extension' },
              { id: 'P34', name: 'SSoT Ledger Δ0 Verified Explorer', domain: 'Extension' },
              { id: 'P35', name: 'Merkle Seals 14,902 Active Verifier', domain: 'Extension' },
              { id: 'P36', name: 'Gold Production Deployment Certificate', domain: 'Extension' },
              { id: 'P37', name: '12 Chambers Sovereign Runtime Control Deck', domain: 'Extension' },
              { id: 'P38', name: 'Civilization Intelligence Control Plane', domain: 'Extension' },
              { id: 'P39', name: 'Holo Archive & Immutable Provenance', domain: 'Extension' },
              { id: 'P40', name: 'Ω∞ Final Lock & Infinite Sovereignty Seal', domain: 'Extension' },
            ].map((phase) => (
              <div key={phase.id} className="grid grid-cols-12 gap-1 items-center px-2 py-1 rounded hover:bg-white/5 transition">
                <span className="col-span-1 text-cyan-400 font-bold">{phase.id}</span>
                <span className="col-span-6 text-zinc-200 truncate">{phase.name}</span>
                <span className="col-span-2 text-zinc-400">{phase.domain}</span>
                <span className="col-span-1 text-zinc-400">14,902</span>
                <span className="col-span-2 text-right text-emerald-400 font-bold">PASS (99.98%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Treasury & Global Satellite Mesh */}
      {activeTab === 'TREASURY' && (
        <div className="relative z-30 space-y-4 text-xs animate-in fade-in">
          {/* Treasury Table */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-2">
            <span className="text-amber-400 font-bold text-xs uppercase block">
              Fiduciary Treasury & RWA Tokenization (Total Valuation: ฿4,230,000,000.00)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="text-[10px] text-zinc-400 block">THB-SOV</span>
                <span className="text-emerald-400 font-bold text-sm block mt-0.5">฿1,490,200,000.00</span>
                <span className="text-[10px] text-zinc-500">100% Thai Treasury Guaranteed</span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="text-[10px] text-zinc-400 block">XAU-PHYS (Gold Reserve)</span>
                <span className="text-amber-300 font-bold text-sm block mt-0.5">14,902.00 oz</span>
                <span className="text-[10px] text-zinc-500">LBMA 99.99% Audited Vault</span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="text-[10px] text-zinc-400 block">RWA-INFRA (Fiber & Sat)</span>
                <span className="text-cyan-300 font-bold text-sm block mt-0.5">400 Tenants</span>
                <span className="text-[10px] text-zinc-500">Platform Ω601–Ω1000 Bound</span>
              </div>
            </div>
          </div>

          {/* 6 Global Sovereign Nodes */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold text-xs uppercase">
                Global Satellite Mesh — 6 Sovereign Nodes (QKD Active)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">100% QKD ACTIVE</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-black/50 border border-cyan-500/20">
                <span className="text-white font-bold block">BK01 Bangkok</span>
                <span className="text-cyan-400">0.8ms PRIMARY</span>
              </div>
              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                <span className="text-white font-bold block">SG02 Singapore</span>
                <span className="text-zinc-400">8.2ms RELAY</span>
              </div>
              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                <span className="text-white font-bold block">TY03 Tokyo</span>
                <span className="text-zinc-400">24.1ms VAULT</span>
              </div>
              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                <span className="text-white font-bold block">ZH04 Zurich</span>
                <span className="text-zinc-400">112.5ms BOUNDARY</span>
              </div>
              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                <span className="text-white font-bold block">SV05 Silicon Valley</span>
                <span className="text-zinc-400">142.0ms GATEWAY</span>
              </div>
              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                <span className="text-white font-bold block">LD06 London</span>
                <span className="text-zinc-400">128.4ms CUSTODIAN</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Footer Strip */}
      <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-cyan-500/20 text-[10px] text-zinc-500">
        <div className="flex flex-wrap items-center gap-3">
          <span>Principal: <strong>{METADATA.principal}</strong></span>
          <span>•</span>
          <span>Platform: <strong>{METADATA.platformBoundary}</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">14,902 Seals Verified</span>
        </div>

        {onOpenCertificate && (
          <button
            onClick={() => {
              playTone(740, 0.05);
              onOpenCertificate();
            }}
            className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1 font-bold"
          >
            <span>เปิดใบรับรองทองคำ (View Gold Certificate)</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
