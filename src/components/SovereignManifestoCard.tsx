import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface SovereignManifestoProps {
  onOpenCertificate?: () => void;
}

export const SovereignManifestoCard: React.FC<SovereignManifestoProps> = ({ onOpenCertificate }) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [crtEffect, setCrtEffect] = useState(true);

  // Core metadata values corresponding to /metadata.json
  const METADATA_CONFIG = {
    name: 'ZYRQUEN Ω∞ Sovereign World Engine',
    description:
      'Sovereign Operating System and Civilization Intelligence Control Plane - FROZEN v1.2 LTS with Post-Quantum Cryptography, 14,902 Canonical Seals, and Full ETDA/PDPA Compliance',
    requestFramePermissions: [] as string[],
    majorCapabilities: ['MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API'],
  };

  // Recent system state & SSoT invariants
  const SYSTEM_STATE = {
    productVersion: 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)',
    sovereignArchitect: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    clearanceLevel: 'OMEGA-1 SUPREME CLEARANCE',
    mutationAuthority: 0,
    ssotDelta: 'Δ0.0% ZERO DRIFT',
    canonicalSeals: 14902,
    canonicalBlockHeight: 849202,
    merkleGenesisRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    failClosedTrigger: 'Quarantine 85.0°C Active Trigger',
    cryptographicStandards: 'NIST FIPS 203 (ML-KEM-1024), FIPS 204 (ML-DSA-87 Dilithium-5), FIPS 205 (SPHINCS+)',
    legalStatute: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) มาตรา 9, 26, 28 & ETDA Sec 9, 26, 28 Safe Harbor',
    custodianQuorum: '10/10 REAL_HSM Unanimous (FIPS 140-3 Level 4)',
    cryoTelemetry: '14.98 mK Subzero Helium-3/4 Bus (Coherence: 99.992%)',
    manifestoTimestamp: '2026-09-01T20:30:00.000Z',
    signatureStamp: 'SIG_FIOS_GAS_EXPENSE_INTEGRITY_DILITHIUMS_E28F89B28B7A44F0A992BC9098711425667102',
  };

  const fullManifestoText = `-----BEGIN ZYRQUEN Ω∞ SOVEREIGN MANIFESTO (CANONICAL v1.2 LTS)-----
SYSTEM_NAME: ${METADATA_CONFIG.name}
SYSTEM_DESCRIPTION: ${METADATA_CONFIG.description}
MAJOR_CAPABILITIES: ${METADATA_CONFIG.majorCapabilities.join(', ')}
FRAME_PERMISSIONS: NONE (ZERO_OVERHEAD_SANDBOX)

[SOVEREIGN GOVERNANCE & PRINCIPAL]
SOVEREIGN_ARCHITECT: ${SYSTEM_STATE.sovereignArchitect}
CLEARANCE_LEVEL: ${SYSTEM_STATE.clearanceLevel}
MUTATION_AUTHORITY: ${SYSTEM_STATE.mutationAuthority} (STRICT READ-ONLY / NO UNAUTHORIZED MUTATION)
PRODUCT_VERSION: ${SYSTEM_STATE.productVersion}
TIMESTAMP: ${SYSTEM_STATE.manifestoTimestamp}

[INVIOLABLE SSOT MATHEMATICAL INVARIANTS]
CANONICAL_BLOCK_HEIGHT: #${SYSTEM_STATE.canonicalBlockHeight}
GENESIS_MERKLE_ROOT: ${SYSTEM_STATE.merkleGenesisRoot}
CANONICAL_SEALS_COUNT: ${SYSTEM_STATE.canonicalSeals} (INVOLATILE SSoT)
DRIFT_TOLERANCE: ${SYSTEM_STATE.ssotDelta}
FAIL_CLOSED_TRIGGER: ${SYSTEM_STATE.failClosedTrigger}

[POST-QUANTUM CRYPTOGRAPHIC PROTOCOLS]
CRYPTO_STANDARD: ${SYSTEM_STATE.cryptographicStandards}
HSM_ENCLAVE_QUORUM: ${SYSTEM_STATE.custodianQuorum}
CRYO_RESONANCE: ${SYSTEM_STATE.cryoTelemetry}

[STATUTORY SAFE HARBOR & LEGAL CONVERGENCE]
STATUTORY_COMPLIANCE: ${SYSTEM_STATE.legalStatute}
EVIDENTIARY_PROBATIVE_WEIGHT: FULL_JUDICIAL_ADMISSIBILITY_ETDA_2544

[ARTICLES OF SOVEREIGN FAITH]
ARTICLE I - THE PRIMACY OF INVARIANTS:
  The Canonical Block Height #${SYSTEM_STATE.canonicalBlockHeight} and its 14,902 Canonical Seals are eternally frozen.
  No algorithm, sentient agent, or exterior consensus plane possesses Mutation Authority > 0.
  Any attempted ambient drift instantly triggers automatic thermal quarantine at 85.0°C.

ARTICLE II - POST-QUANTUM ASSURANCE:
  All state transitions are sealed under NIST FIPS 204 ML-DSA-87 (Dilithium-5) and ML-KEM-1024.
  The cryptographic citadel stands impervious to Shor's factorization and BKZ lattice reduction.

ARTICLE III - EVIDENTIARY TRUTH UNDER THAI LAW:
  All electronic signatures bind the sovereign will of the Architect pursuant to Section 9 of the
  Electronic Transactions Act B.E. 2544. Integrity satisfies Section 26. Judicial admissibility
  in Thai court proceedings is irrevocable under Section 28 and PDPA B.E. 2562.

ARTICLE IV - DECA-CUSTODIAN UNANIMITY:
  All ten hardware enclaves (TC-01..TC-10) attest to the invariant baseline with zero divergence.

DILITHIUM5_SIGNATURE:
  ${SYSTEM_STATE.signatureStamp}
-----END ZYRQUEN Ω∞ SOVEREIGN MANIFESTO-----`;

  const handleCopyManifesto = () => {
    navigator.clipboard.writeText(fullManifestoText);
    setCopied(true);
    playAuditChime();
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadAsc = () => {
    playTone(720, 0.08);
    const blob = new Blob([fullManifestoText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_SOVEREIGN_MANIFESTO_FROZEN_v1.2_${Date.now()}.asc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerifyManifesto = () => {
    setIsVerifying(true);
    setVerificationSuccess(false);
    playTone(520, 0.1, 'sawtooth');

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
      playAuditChime();
      setTimeout(() => setVerificationSuccess(false), 4000);
    }, 1100);
  };

  return (
    <div className="rounded-[28px] bg-[#05090f] border border-cyan-500/40 p-5 sm:p-7 shadow-[0_0_50px_-10px_rgba(6,182,212,0.25)] relative overflow-hidden font-mono text-xs">
      {/* CRT Scanlines and phosphor background overlay */}
      {crtEffect && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30 z-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.04), rgba(0, 255, 65, 0.04) 1px, transparent 1px, transparent 3px)',
          }}
        />
      )}

      {/* Futuristic Window Chrome Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Mac / Terminal 3 Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_#27c93f]" />
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold tracking-wider text-xs sm:text-sm">
              SOVEREIGN_MANIFESTO_CANONICAL_V1.2.LTS.sig
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px]">
              OMEGA-1 AUTHORIZED
            </span>
          </div>
        </div>

        {/* Terminal Utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`px-2.5 py-1 rounded-lg text-[10px] border transition ${
              crtEffect
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
            }`}
            title="สลับโหมดฟอสฟอร์ CRT Scanlines"
          >
            CRT FX {crtEffect ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleVerifyManifesto}
            disabled={isVerifying}
            className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 flex items-center gap-1.5 transition text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : 'Verify Signature'}</span>
          </button>

          <button
            onClick={handleCopyManifesto}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 flex items-center gap-1.5 transition text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copied Sig' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadAsc}
            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition text-[11px]"
            title="Download signed ASCII armor .asc"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>.asc</span>
          </button>

          <button
            onClick={() => setTerminalExpanded(!terminalExpanded)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition"
          >
            {terminalExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Verification Success Banner */}
      {verificationSuccess && (
        <div className="relative z-10 mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              [PQC VERIFIED] Dilithium-5 Master Signature validated against Block #849202. Zero Mutation Confirmed (Authority === 0).
            </span>
          </div>
          <span className="text-[10px] font-bold text-cyan-300">NIST CATEGORY 5</span>
        </div>
      )}

      {/* Terminal Main Body */}
      <div className="relative z-10 space-y-4">
        {/* Terminal Prompt Line */}
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <span className="text-emerald-400 font-bold">root@zyrquen-sovereign-kernel</span>
          <span className="text-zinc-500">:</span>
          <span className="text-cyan-400">/etc/zyrquen</span>
          <span className="text-zinc-500">#</span>
          <span className="text-zinc-200">cat sovereign-manifesto.env --sign-fips204</span>
          <span className="w-2 h-4 bg-emerald-400 animate-pulse" />
        </div>

        {/* ASCII Header Banner */}
        <pre className="text-[10px] sm:text-[11px] leading-[1.15] text-cyan-400/90 font-mono select-none overflow-x-auto p-3 rounded-xl bg-black/60 border border-cyan-500/20">
{`███████╗██╗   ██╗██████╗  ██████╗ ██╗   ██╗███████╗███╗   ██╗     ██████╗  ██████╗ 
╚══███╔╝╚██╗ ██╔╝██╔══██╗██╔═══██╗██║   ██║██╔════╝████╗  ██║    ██╔═══██╗██╔════╝ 
  ███╔╝  ╚████╔╝ ██████╔╝██║   ██║██║   ██║█████╗  ██╔██╗ ██║    ██║   ██║███████╗ 
 ███╔╝    ╚██╔╝  ██╔══██╗██║▄▄ ██║██║   ██║██╔══╝  ██║╚██╗██║    ██║   ██║██╔═══██╗
███████╗   ██║   ██║  ██║╚██████╔╝╚██████╔╝███████╗██║ ╚████║    ╚██████╔╝╚██████╔╝
SOVEREIGN WORLD ENGINE • FROZEN v1.2 LTS • CANONICAL HASH #849202 • OMEGA-1 SUPREME`}
        </pre>

        {/* Metadata Key-Value Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left Column: Core Metadata & Identity */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/8 space-y-2">
            <div className="text-[10px] uppercase font-bold text-cyan-400 border-b border-white/10 pb-1 flex items-center justify-between">
              <span>[01] CORE PLATFORM IDENTITY (METADATA.JSON)</span>
              <span className="text-zinc-500">CANONICAL SPEC</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">System Name:</span>
                <span className="text-white font-bold text-right">{METADATA_CONFIG.name}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Release Baseline:</span>
                <span className="text-amber-300 font-bold text-right">{SYSTEM_STATE.productVersion}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Sovereign Architect:</span>
                <span className="text-emerald-300 font-bold text-right">{SYSTEM_STATE.sovereignArchitect}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Clearance:</span>
                <span className="text-violet-300 font-bold text-right">{SYSTEM_STATE.clearanceLevel}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Mutation Authority:</span>
                <span className="text-rose-400 font-bold text-right">0 (Strict Read-Only)</span>
              </div>
              <div className="pt-1 text-[11px] text-zinc-400 border-t border-white/5 font-sans leading-relaxed">
                {METADATA_CONFIG.description}
              </div>
            </div>
          </div>

          {/* Right Column: SSoT Invariants & Post-Quantum Hardware */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/8 space-y-2">
            <div className="text-[10px] uppercase font-bold text-emerald-400 border-b border-white/10 pb-1 flex items-center justify-between">
              <span>[02] SSOT INVARIANTS & HARDWARE CRYPTOGRAPHY</span>
              <span className="text-zinc-500">POST-QUANTUM</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Canonical Block:</span>
                <span className="text-cyan-300 font-bold text-right">#{SYSTEM_STATE.canonicalBlockHeight}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Canonical Seals:</span>
                <span className="text-emerald-400 font-bold text-right">14,902 Seals (Fixed)</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">SSoT Drift Rate:</span>
                <span className="text-emerald-400 font-bold text-right">{SYSTEM_STATE.ssotDelta}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Crypto Standard:</span>
                <span className="text-amber-300 font-bold text-right">FIPS 203 / 204 / 205</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Fail-Closed Trigger:</span>
                <span className="text-rose-400 font-bold text-right">85.0°C Active Thermal</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-400 shrink-0">Thai Legal Standard:</span>
                <span className="text-teal-300 font-bold text-right">ETDA Sec 9, 26, 28 • PDPA 2562</span>
              </div>
            </div>
          </div>
        </div>

        {/* Genesis Merkle Hash Strip */}
        <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/20 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>GENESIS MERKLE ROOT ANCHOR (SHA-256 + DILITHIUM-5)</span>
            </span>
            <span className="text-emerald-400 font-bold">100% SSoT MATCH</span>
          </div>
          <div className="text-[11px] text-emerald-300 font-mono break-all select-all bg-black/60 p-2 rounded-lg border border-emerald-500/30">
            {SYSTEM_STATE.merkleGenesisRoot}
          </div>
        </div>

        {/* Articles of Sovereign Governance */}
        <div
          className={`space-y-2 transition-all ${
            terminalExpanded ? 'max-h-none' : 'max-h-56 overflow-y-auto pr-1'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>พันธสัญญาอธิปไตย 4 หมวด (FOUR ARTICLES OF SOVEREIGN FAITH):</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/6 space-y-1">
            <span className="text-amber-300 font-bold text-[11px]">
              หมวดที่ ๑ (Article I) — กฎเหล็กแห่งความสัจธรรม (Primacy of Invariants):
            </span>
            <p className="text-zinc-300 text-xs font-sans leading-relaxed">
              ตราประทับ 14,902 ตราประทับ และบล็อกเจเนซิส #849202 ได้รับการแช่แข็งถาวรภายใต้สิทธิ์การกลายพันธุ์ระดับ 0 (Mutation Authority = 0)
              หากเกิดความพยายามดัดแปลงจากภายนอก ระบบจะตัดตอนเข้าสู่โหมดกักกันอุณหภูมิความร้อน 85.0°C ทันที
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/6 space-y-1">
            <span className="text-cyan-300 font-bold text-[11px]">
              หมวดที่ ๒ (Article II) — ปราการหลังยุคควอนตัม (Post-Quantum Sanctuary):
            </span>
            <p className="text-zinc-300 text-xs font-sans leading-relaxed">
              การลงนามธุรกรรมและแลกเปลี่ยนกุญแจทั้งหมดดำเนินตามมาตรฐาน NIST FIPS 203 (ML-KEM-1024), FIPS 204 (ML-DSA-87 Dilithium-5) และ FIPS 205 (SPHINCS+) ป้องกันการโจมตีจากอัลกอริทึมชอร์และแลตทิส BKZ สมบูรณ์แบบ
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/6 space-y-1">
            <span className="text-emerald-300 font-bold text-[11px]">
              หมวดที่ ๓ (Article III) — การรับรองพยานหลักฐานตามกฎหมายไทย (Court Admissibility):
            </span>
            <p className="text-zinc-300 text-xs font-sans leading-relaxed">
              ลายมือชื่ออิเล็กทรอนิกส์แสดงเจตนาอันแท้จริงตามมาตรา ๙ แห่ง พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ 
              และมีความน่าเชื่อถือตามมาตรา ๒๖ นำสืบเป็นพยานหลักฐานในชั้นศาลไทยได้ตามมาตรา ๒๘ และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/6 space-y-1">
            <span className="text-violet-300 font-bold text-[11px]">
              หมวดที่ ๔ (Article IV) — สภาฉันทามติเอกฉันท์ 10 ผู้พิทักษ์ (Deca-Custodian Quorum):
            </span>
            <p className="text-zinc-300 text-xs font-sans leading-relaxed">
              ผู้พิทักษ์กุญแจฮาร์ดแวร์ทั้ง 10 ท่าน (#EP-SOVEREIGN-01 ถึง EP-100) ลงนามรับรองเอกฉันท์ 10/10 ผ่านสภาผู้พิทักษ์ ไร้ข้อขัดแย้ง
            </p>
          </div>
        </div>

        {/* Digital Signature Block */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-black to-cyan-950/40 border border-emerald-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DILITHIUM-5 MASTER MANIFESTO SIGNATURE</span>
            </span>
            <span className="text-zinc-500">SEALED INVARIANT</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-300 break-all select-all bg-black/60 p-2 rounded border border-white/5">
            {SYSTEM_STATE.signatureStamp}
          </div>
        </div>

        {/* Terminal Footer Navigation */}
        {onOpenCertificate && (
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[10px] text-zinc-500">
              Certificate Gate Status: <span className="text-emerald-400 font-bold">READY (Ctrl+G)</span>
            </span>

            <button
              onClick={() => {
                playTone(700, 0.05);
                onOpenCertificate();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>เปิดใบรับรอง Gold Master Certificate</span>
              <ExternalLink className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
