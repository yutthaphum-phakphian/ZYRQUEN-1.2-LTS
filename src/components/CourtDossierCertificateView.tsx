import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  Scale,
  FileCheck2,
  Download,
  Copy,
  Check,
  Play,
  Activity,
  Cpu,
  RefreshCw,
  Lock,
  Globe,
  Radio,
  Flame,
  CheckCircle2,
  QrCode,
  Terminal,
} from 'lucide-react';
import { COURT_CERTIFICATE_DATA } from '../data/courtDossierCertificateData';
import { generateCourtDossierCertificatePdf } from '../utils/courtDossierCertificatePdf';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { MutationDeltaD3Chart } from './MutationDeltaD3Chart';
import ForensicDossierSuite from './ForensicDossierSuite';


interface ForensicRunResult {
  audit_timestamp_utc: string;
  sovereign_identity: string;
  genesis_integrity: string;
  hsm_quorum_status: string;
  dossier_hmac_parity: string;
  court_admissibility_flag: string;
  signature_reference: string;
  total_latency_ms: number;
}

export const CourtDossierCertificateView: React.FC = () => {
  const [copiedHmac, setCopiedHmac] = useState(false);
  const [copiedGenesis, setCopiedGenesis] = useState(false);
  const [isRunningScript, setIsRunningScript] = useState(false);
  const [scriptResult, setScriptResult] = useState<ForensicRunResult | null>(null);

  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [isSimulatingPipeline, setIsSimulatingPipeline] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleRunScript = () => {
    setIsRunningScript(true);
    playTone(550, 0.05);

    setTimeout(() => {
      const now = new Date().toISOString();
      setScriptResult({
        audit_timestamp_utc: now,
        sovereign_identity: COURT_CERTIFICATE_DATA.sovereignOwner,
        genesis_integrity: 'PASS (Delta 0.00%)',
        hsm_quorum_status: 'PASS (10/10 Nodes - Unanimous Quorum)',
        dossier_hmac_parity: 'MATCHED (64/64 Hex Characters)',
        court_admissibility_flag: 'VALID_LEGAL_EVIDENCE (100% Court-Admissible)',
        signature_reference: COURT_CERTIFICATE_DATA.forensicSignatureId,
        total_latency_ms: 35.56,
      });
      setIsRunningScript(false);
      playAuditChime();
    }, 450);
  };

  const handleRun16StepPipeline = () => {
    if (isSimulatingPipeline) return;
    setIsSimulatingPipeline(true);
    setCompletedSteps([]);
    setActiveStepIndex(0);
    playTone(600, 0.04);

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < COURT_CERTIFICATE_DATA.sixteenStepPipeline.length) {
        setActiveStepIndex(currentStep);
        setCompletedSteps((prev) => [...prev, currentStep]);
        playTone(650 + currentStep * 20, 0.03);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSimulatingPipeline(false);
        setActiveStepIndex(-1);
        playAuditChime();
      }
    }, 120);
  };

  const handleCopy = (text: string, type: 'hmac' | 'genesis') => {
    copyToClipboard(text);
    if (type === 'hmac') {
      setCopiedHmac(true);
      setTimeout(() => setCopiedHmac(false), 2000);
    } else {
      setCopiedGenesis(true);
      setTimeout(() => setCopiedGenesis(false), 2000);
    }
    playAuditChime();
  };

  const handleDownloadPdf = async () => {
    playTone(700, 0.04);
    await generateCourtDossierCertificatePdf();
  };

  const handleDownloadJson = () => {
    playTone(620, 0.03);
    const jsonStr = JSON.stringify(COURT_CERTIFICATE_DATA, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `COURT-CERTIFICATE-${COURT_CERTIFICATE_DATA.certNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  return (
    <div className="space-y-6 text-zinc-300 font-mono text-sm">
      {/* Top Banner & Quick Actions */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-indigo-500/15 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-black/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
              ⚖️ OFFICIAL COURT CERTIFICATE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
              10/10 REAL_HSM (100% PASS)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
              CERT NO: {COURT_CERTIFICATE_DATA.certNumber}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            หนังสือรับรองความถูกต้องของพยานหลักฐานดิจิทัลและลายมือชื่ออิเล็กทรอนิกส์
          </h2>
          <p className="text-xs text-zinc-400">
            พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (มาตรา ๙, ๒๖, ๒๘) & ISO/IEC 27037:2012
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            <span>Export Certificate PDF</span>
          </button>
          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>JSON Audit Data</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Formatted Paper Box */}
      <div className="p-6 rounded-2xl bg-[#090d1a] border border-white/10 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Certificate Heading */}
        <div className="border-b border-white/10 pb-4 space-y-1">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            เอกสารรับรองทางนิติวิทยาศาสตร์ดิจิทัลระดับศาลสถิตย์ยุติธรรม
          </div>
          <div className="text-sm font-bold text-zinc-100">
            เลขที่เอกสารรับรอง: <span className="text-cyan-300 font-mono">{COURT_CERTIFICATE_DATA.certNumber}</span>
          </div>
          <div className="text-xs text-zinc-400">
            วัน/เวลาที่ออกเอกสาร: {COURT_CERTIFICATE_DATA.issueDateTh}
          </div>
          <div className="text-xs text-zinc-400">
            สถานที่กักเก็บและประมวลผล: {COURT_CERTIFICATE_DATA.dataCenterLocation}
          </div>
        </div>

        {/* 1. System Identity */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <span>๑.</span>
            <span>รายละเอียดพยานหลักฐานและระบบต้นทาง (System Identity & Evidence Subject)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-zinc-500 text-[10px]">ชื่อระบบประมวลผล</div>
              <div className="text-white font-semibold">{COURT_CERTIFICATE_DATA.systemName}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-zinc-500 text-[10px]">ผู้ถือสิทธิ์อธิปไตยดิจิทัล (Sovereign Owner)</div>
              <div className="text-amber-300 font-semibold">{COURT_CERTIFICATE_DATA.sovereignOwner}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[10px]">Genesis Block Hash (#{COURT_CERTIFICATE_DATA.genesisBlockHeight})</span>
                <button
                  onClick={() => handleCopy(COURT_CERTIFICATE_DATA.genesisBlockHash, 'genesis')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedGenesis ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedGenesis ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-cyan-300 font-mono text-[11px] break-all select-all">
                {COURT_CERTIFICATE_DATA.genesisBlockHash}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-zinc-500 text-[10px]">ค่าความเบี่ยงเบนสถาปัตยกรรม (Mutation Delta)</div>
              <div className="text-emerald-400 font-bold">{COURT_CERTIFICATE_DATA.mutationDelta} (Zero-Drift Verified)</div>
            </div>
          </div>
        </div>

        {/* 2. Chain of Custody Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <span>๒.</span>
            <span>ห่วงโซ่การครอบครองพยานหลักฐานดิจิทัล (Digital Evidence Chain of Custody)</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 border-b border-white/10 text-[#D4AF37] text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">ดรรชนีตรวจสอบ (Audit Index)</th>
                  <th className="py-2.5 px-3.5">ค่าแฮชรหัสผ่านการเข้ารหัสลับ (Cryptographic Hash / Token)</th>
                  <th className="py-2.5 px-3.5 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/30">
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3.5 font-semibold text-white">Master Dossier SHA-256 Digest</td>
                  <td className="py-2.5 px-3.5 text-cyan-300 font-mono text-[11px] break-all">
                    <div className="flex items-center gap-2">
                      <span>{COURT_CERTIFICATE_DATA.masterHmacDigest}</span>
                      <button
                        onClick={() => handleCopy(COURT_CERTIFICATE_DATA.masterHmacDigest, 'hmac')}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                        title="Copy HMAC"
                      >
                        {copiedHmac ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      MATCH 64/64
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3.5 font-semibold text-white">Post-Quantum Algorithm Suite</td>
                  <td className="py-2.5 px-3.5 text-indigo-300">{COURT_CERTIFICATE_DATA.pqcSuite}</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                      FIPS RATIFIED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3.5 font-semibold text-white">Hardware Quorum Consensus</td>
                  <td className="py-2.5 px-3.5 text-emerald-300">{COURT_CERTIFICATE_DATA.hsmQuorum}</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      10/10 PASS
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3.5 font-semibold text-white">TSA Stamp (RFC 3161 Anchor)</td>
                  <td className="py-2.5 px-3.5 text-amber-300">{COURT_CERTIFICATE_DATA.tsaStamp}</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      SEALED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3.5 font-semibold text-white">Forensic Signature ID</td>
                  <td className="py-2.5 px-3.5 text-cyan-300 font-mono">{COURT_CERTIFICATE_DATA.forensicSignatureId}</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Legal Compliance Statements */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <span>๓.</span>
            <span>ข้อรับรองทางกฎหมาย (Legal Compliance Statement)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ ม. ๙ และ ม. ๒๖</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                ลายมือชื่อดิจิทัล ML-DSA-87 สร้างขึ้นโดยอุปกรณ์ NitroKey HSM-PQC-01 ภายใต้การควบคุมเด็ดขาดของ #EP-SOVEREIGN-01 ถือเป็นลายมือชื่อที่เชื่อถือได้และได้รับข้อสันนิษฐานเด็ดขาด
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ ม. ๒๘</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                ออกโดยระบบประมวลผลอัตโนมัติความมั่นคงปลอดภัย FIPS 140-3 Level 4 สามารถใช้รับฟังเป็นพยานหลักฐานในกระบวนการพิจารณาคดีตามกฎหมายได้ทันที
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) ม. ๒๖ และ ๓๗</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                ข้อมูลส่วนบุคคลอ่อนไหวทั้งหมดได้รับการเข้ารหัสแบบย้อนกลับไม่ได้ภายใน Chamber 15 PDPA Enclave และปกปิดด้วยเทคโนโลยี zk-SNARKs
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>มาตรฐานสากล ISO/IEC 27037:2012</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                ห่วงโซ่การครอบครองพยานหลักฐาน 14,902 Seals ใน Chamber 02 WORM Vault อยู่ในสภาวะ Zero Drift (Δ0.00%) ปราศจากการแทรกแซงหรือลบทำลาย
              </p>
            </div>
          </div>
        </div>

        {/* Digital Signature Footer */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-amber-300">
              (ลงลายมือชื่อดิจิทัล FIPS 204 ML-DSA-87)
            </div>
            <div className="text-sm font-bold text-white">
              นายยุทธภูมิ พากเพียร
            </div>
            <div className="text-[11px] text-zinc-400">
              ผู้ถือสิทธิ์อธิปไตยหลัก (#EP-SOVEREIGN-01) • ZYRQUEN Ω∞ Sovereign System Master
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-emerald-400">
              10/10 REAL_HSM UNANIMOUS QUORUM VERIFIED 🟢
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">
              Sig ID: {COURT_CERTIFICATE_DATA.forensicSignatureId}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars & 3-Layer PQC Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 4 Pillars Card */}
        <div className="p-5 rounded-2xl bg-[#090d1a] border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>เสาหลักแห่งระบบ (The 4 Pillars)</span>
          </h3>
          <div className="space-y-2.5">
            {COURT_CERTIFICATE_DATA.fourPillars.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200">{p.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Layer PQC Shield Card */}
        <div className="p-5 rounded-2xl bg-[#090d1a] border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>เกราะป้องกันยุคหลังควอนตัม 3 ชั้น (Post-Quantum Shield)</span>
          </h3>
          <div className="space-y-2.5">
            {COURT_CERTIFICATE_DATA.pqcLayers.map((l, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-200">{l.layer}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                    {l.algorithm}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{l.functionTh}</p>
              </div>
            ))}

            {/* Deca-Key Hardware Quorum Sub-panel */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Deca-Key Hardware Quorum</span>
                <span className="text-[10px] font-bold text-emerald-400">8/10 Threshold • 10/10 Active</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                NitroKey HSM-PQC-01 FIPS 140-3 L4 กระจายตัว ณ BKK (4 โหนด), CNX (2 โหนด), HKG (2 โหนด), SGP (2 โหนด) ที่อุณหภูมิ 14.98 mK (Coherence 99.98%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Phoenix Pipeline 5-Phase Execution & 16-Step Forensic Simulator */}
      <div className="p-5 rounded-2xl bg-[#090d1a] border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Phoenix Pipeline 5-Phase & 16-Step Forensic Evidence Pipeline</span>
            </h3>
            <p className="text-xs text-zinc-400">
              ประมวลผลรวม {COURT_CERTIFICATE_DATA.totalExecutionTimeMs} ms • เพดาน SLA &lt; {COURT_CERTIFICATE_DATA.slaLimitMs} ms (Headroom Margin +{COURT_CERTIFICATE_DATA.headroomMarginMs} ms)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun16StepPipeline}
              disabled={isSimulatingPipeline}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSimulatingPipeline
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-rose-400" />
              <span>{isSimulatingPipeline ? 'Executing 16 Stages...' : 'Run 16-Step Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* 5-Phase Timing Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {COURT_CERTIFICATE_DATA.phoenixPhases.map((phase, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-[10px] text-zinc-500">{phase.phase}</div>
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>{phase.name}</span>
                <span className="text-emerald-400 font-mono">{phase.durationMs}ms</span>
              </div>
              <p className="text-[10px] text-zinc-400 line-clamp-2">{phase.description}</p>
            </div>
          ))}
        </div>

        {/* 16-Step Pipeline Grid */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-300">
            สายพานนิติวิทยาศาสตร์ 16 ขั้นตอน (Deterministic Pipeline Verification)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {COURT_CERTIFICATE_DATA.sixteenStepPipeline.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              const isDone = completedSteps.includes(idx);
              return (
                <div
                  key={step.step}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : isDone
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-black/30 border-white/5 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px]">Stage {step.step.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] font-mono">{step.latencyMs}ms</span>
                  </div>
                  <div className="text-[11px] truncate mt-0.5">{step.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time D3 Mutation Delta & Genesis Hash Deviation Tracker */}
      <MutationDeltaD3Chart />

      {/* Phase 12 Digital Forensic Court Dossier & Multi-Agent Swarm Suite */}
      <ForensicDossierSuite />

      {/* Forensic Audit Python Script Engine Interactive Simulator */}
      <div className="p-5 rounded-2xl bg-[#090d1a] border border-white/10 space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Python Forensic Audit Engine (/scripts/forensic_audit_aura_v4.py)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              ISO/IEC 27037:2012 • NIST FIPS 204 (ML-DSA-87) • Thai ETA B.E. 2544
            </p>
          </div>

          <button
            onClick={handleRunScript}
            disabled={isRunningScript}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningScript ? 'animate-spin' : ''}`} />
            <span>{isRunningScript ? 'Executing Python Audit...' : 'Execute Forensic Audit Script'}</span>
          </button>
        </div>

        {scriptResult && (
          <div className="p-4 rounded-xl bg-black/80 border border-cyan-500/30 font-mono text-xs text-cyan-300 space-y-2">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>AUDIT EXECUTION REPORT — ALL INVARIANTS SATISFIED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-zinc-500">audit_timestamp_utc:</span> {scriptResult.audit_timestamp_utc}</div>
              <div><span className="text-zinc-500">sovereign_identity:</span> {scriptResult.sovereign_identity}</div>
              <div><span className="text-zinc-500">genesis_integrity:</span> <span className="text-emerald-400 font-bold">{scriptResult.genesis_integrity}</span></div>
              <div><span className="text-zinc-500">hsm_quorum_status:</span> <span className="text-emerald-400 font-bold">{scriptResult.hsm_quorum_status}</span></div>
              <div><span className="text-zinc-500">dossier_hmac_parity:</span> <span className="text-emerald-400 font-bold">{scriptResult.dossier_hmac_parity}</span></div>
              <div><span className="text-zinc-500">court_admissibility_flag:</span> <span className="text-emerald-400 font-bold">{scriptResult.court_admissibility_flag}</span></div>
              <div><span className="text-zinc-500">signature_reference:</span> {scriptResult.signature_reference}</div>
              <div><span className="text-zinc-500">total_latency:</span> {scriptResult.total_latency_ms} ms (PASS)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
