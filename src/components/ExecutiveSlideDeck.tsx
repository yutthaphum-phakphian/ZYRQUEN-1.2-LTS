import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Award,
  Shield,
  Lock,
  Layers,
  Cpu,
  Scale,
  Sparkles,
  Download,
  RotateCcw
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';

export interface SlideItem {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  bulletPoints: {
    label: string;
    detail: string;
    highlight?: string;
  }[];
  statBox?: {
    value: string;
    label: string;
    sublabel: string;
  };
  footerNote: string;
}

export const SLIDES_DATA: SlideItem[] = [
  {
    id: 1,
    badge: 'SLIDE 01 / 10 • EXECUTIVE BRIEF',
    title: 'ZYRQUEN Ω v1.2 LTS — Sovereign Audit Report',
    subtitle: 'สรุปผลการตรวจสอบสถานะสัจธรรมแกนหลัก (Canonical SSoT Kernel) และอำนาจอธิปไตยเดี่ยว',
    bulletPoints: [
      { label: 'Canonical Status', detail: 'FROZEN v1.2 LTS สลักสิทธิ์ถาวร ห้ามเปลี่ยนแปลงแก้ไข', highlight: 'FROZEN v1.2 LTS' },
      { label: 'SSoT Mutation Delta', detail: '0 (ไม่มีการกลายพันธุ์หรือแทรกแซงโค้ดแกนหลัก)', highlight: 'Delta = 0' },
      { label: 'Baseline Drift', detail: '0.0000% คงสภาพสัจธรรมสมบูรณ์แบบข้ามเครือข่าย', highlight: '0.0000%' },
      { label: 'Sovereign Authority', detail: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)', highlight: '#EP-SOVEREIGN-01' },
      { label: 'Anchor Reference', detail: 'Genesis Block #849,202 ผูกตรึง 14,902 Canonical Seals', highlight: 'Block #849,202' }
    ],
    statBox: {
      value: 'Δ0.00%',
      label: 'Zero SSoT Drift',
      sublabel: '14,902 Seals Invariant'
    },
    footerNote: 'Certified by Supreme Sovereign Chamber 17 Apex Command Plane'
  },
  {
    id: 2,
    badge: 'SLIDE 02 / 10 • CHAMBER 04',
    title: '10/10 Invariants Shield (Zero-Drift Architecture)',
    subtitle: 'ระบบเกราะพิทักษ์ 10 ชั้น สอดส่องแบบอัตโนมัติความถี่ 100 Hz',
    bulletPoints: [
      { label: 'INV-SSOT-IMMUTABLE & DRIFT', detail: 'ห้ามแก้ไขแกนหลักและตรึงค่าความเบี่ยงเบน 0.00% เทียบเคียง Genesis Manifest', highlight: 'PASSED' },
      { label: 'INV-FAIL-CLOSED-GUARD', detail: 'กักกันความผิดปกติทันทีสู่ Chamber 02 Sandbox เมื่อตรวจพบการคุกคาม', highlight: 'PASSED' },
      { label: 'INV-CARDINALITY-14902', detail: 'รับรองความต่อเนื่องของตราประทับทองคำ 14,902 บล็อกไม่ขาดตอน', highlight: 'PASSED' },
      { label: 'INV-REPLAY-DETERMINISM', detail: '12-Stage Trace Replay พิสูจน์บิตต่อบิตได้ในระดับ < 142 ms', highlight: 'PASSED' },
      { label: 'INV-THAI-SOVEREIGNTY & BLAST', detail: 'ยืนยันสิทธิ์ #EP-SOVEREIGN-01 และควบคุมผลกระทบ Recovery ต่ำกว่า 2.0%', highlight: 'PASSED' }
    ],
    statBox: {
      value: '10 / 10',
      label: 'Invariants Unanimous',
      sublabel: '100 Hz Continuous Scan'
    },
    footerNote: 'Chamber 04 Invariants Engine — 100% Deterministic Guarantee'
  },
  {
    id: 3,
    badge: 'SLIDE 03 / 10 • CHAMBER 05',
    title: '22/22 Master Verification Gates Matrix',
    subtitle: 'ด่านตรวจผ่าน 22 ประตู คลอบคลุม 4 ระดับชั้นความปลอดภัยขั้นสูงสุด',
    bulletPoints: [
      { label: 'Tier 1: Pre-Flight & Authority', detail: 'Genesis Root, 10/10 Deca-Key Quorum, Passport Auth (Gates 1, 5, 6, 7)', highlight: '100% PASS' },
      { label: 'Tier 2: Lattice PQC Suite', detail: 'Dilithium-5, SPHINCS+ Fallback, Falcon-1024 Accelerator (Gates 2, 3, 4)', highlight: '100% PASS' },
      { label: 'Tier 3: Memory Ring Isolation', detail: 'Kernel DMA >15GB/s, 14.98mK Cryo, Fail-Closed Auto-Defensive (Gates 8–14)', highlight: '100% PASS' },
      { label: 'Tier 4: Judicial ETDA Compliance', detail: 'RFC 3161, ETDA ม.9/26/28, PDPA ZK-Proofs, ISO 27037 (Gates 15–22)', highlight: '100% PASS' }
    ],
    statBox: {
      value: '1.82 ms',
      label: 'Avg Gate Latency',
      sublabel: '22/22 All Gates Evaluated'
    },
    footerNote: 'Master Evaluation Reference: GATE-849202-ALL'
  },
  {
    id: 4,
    badge: 'SLIDE 04 / 10 • CHAMBER 08',
    title: 'Post-Quantum Cryptography (NIST Category 5)',
    subtitle: 'สถาปัตยกรรม Crypto-Agility ป้องกันการถอดรหัสด้วยควอนตัมคอมพิวเตอร์ 256-bit',
    bulletPoints: [
      { label: 'ML-DSA-87 (Dilithium-5)', detail: 'NIST FIPS 204 (Lattice-based) ลายเซ็นหลัก 4,595 bytes ประทับ 14,902 ซีล', highlight: 'Active Signature' },
      { label: 'SLH-DSA (SPHINCS+)', detail: 'NIST FIPS 205 (Stateless Hash-based) สำรองฉุกเฉิน Zero-Downtime สลับใน 1.20 ms', highlight: 'Standby Fallback' },
      { label: 'Falcon-1024', detail: 'NTRU Fast Fourier Sampling ขนาดเล็ก 1,330 bytes ประมวลผลความเร็วสูง', highlight: 'High-Speed Accel' },
      { label: 'ML-KEM-1024 (Kyber-1024)', detail: 'NIST FIPS 203 สำหรับการห่อหุ้มกุญแจและเข้ารหัสรักษาความลับข้ามเครือข่าย', highlight: 'Key Encapsulation' },
      { label: 'HAWK Signatures Purged', detail: 'ถอนการติดตั้งถาวร 100% ผ่านเกณฑ์ Gate 5 ตามรายงาน Claude Mythos', highlight: 'Deprecated/Removed' }
    ],
    statBox: {
      value: '256-bit',
      label: 'NIST Category 5',
      sublabel: 'Quantum-Proof Ceiling'
    },
    footerNote: 'Zero Lattice Collapse Vulnerability with Dual-Algorithm Failover'
  },
  {
    id: 5,
    badge: 'SLIDE 05 / 10 • CHAMBER 03',
    title: '10/10 Hardware HSM Quorum & Physical Defenses',
    subtitle: 'การลงนามร่วมทางฮาร์ดแวร์ FIPS 140-3 Level 4 ภายใต้สภาผู้พิทักษ์',
    bulletPoints: [
      { label: 'Deca-Key Custodian Council', detail: 'หัวหน้านักเข้ารหัสลับ ดร. กัญญารัตน์ เวชสิทธิ์ (#EP-007) และคณะพิทักษ์ 10 โหนด', highlight: '10/10 Quorum' },
      { label: 'Subzero Cryogenic State', detail: 'ฮีเลียมเหลว 14.98 mK Superconducting Quantum Zero-Noise Ring', highlight: '14.98 mK' },
      { label: 'Active Zeroization Trigger', detail: 'วงจรทำลายข้อมูลกุญแจฉุกเฉินอัตโนมัติหากอุณหภูมิเกิน 85°C Surge Cutoff', highlight: 'Tamper-Resistant' },
      { label: 'Zero-Copy DMA Bandwidth', detail: 'บัสข้อมูลความเร็วสูงพิเศษ > 15 GB/s ส่งถ่ายพยานหลักฐานโดยไม่ผ่าน User Space', highlight: '>15 GB/s' }
    ],
    statBox: {
      value: 'FIPS L4',
      label: 'FIPS 140-3 Level 4',
      sublabel: 'Tamper-Envelope Armed'
    },
    footerNote: 'Physical & Cryptographic Air-Gapped Co-Signing Architecture'
  },
  {
    id: 6,
    badge: 'SLIDE 06 / 10 • CHAMBER 10 & 11',
    title: 'Judicial ETDA Tier (Thai Statutory Compliance)',
    subtitle: 'การผูกตรึงกรอบกฎหมายไทย พ.ร.บ. ธุรกรรมอิเล็กทรอนิกส์ และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล',
    bulletPoints: [
      { label: 'ETDA มาตรา ๙ (เจตนาผูกพัน)', detail: 'ระบุตัวตนและยืนยันเจตนาการทำนิติกรรมสัญญาอิเล็กทรอนิกส์สมบูรณ์', highlight: 'มีผลผูกพันทางกฎหมาย' },
      { label: 'ETDA มาตรา ๒๖ (ลายมือชื่อปลอดภัยสูง)', detail: 'สันนิษฐานตามกฎหมายว่าเป็นลายมือชื่อที่เชื่อถือได้ ป้องกันการปฏิเสธความรับผิด', highlight: 'Non-Repudiation' },
      { label: 'ETDA มาตรา ๒๘ (ภาระการพิสูจน์)', detail: 'คู่กรณีสามารถตรวจสอบประวัติใบรับรองบน WORM Ledger ได้ตลอดเวลา', highlight: 'Reversed Burden' },
      { label: 'PDPA มาตรา ๓๗ (ZK Masking)', detail: 'ใช้ Zero-Knowledge Proofs ปกป้องข้อมูลส่วนบุคคลโดยมิต้องเปิดเผยข้อมูลลับ', highlight: 'ZK-PII Protected' }
    ],
    statBox: {
      value: '100%',
      label: 'Court-Admissible',
      sublabel: 'Thai Evidence Code §94'
    },
    footerNote: 'Admissible as Prima Facie Electronic Evidence in Thai Courts'
  },
  {
    id: 7,
    badge: 'SLIDE 07 / 10 • CHAMBER 12 & 14',
    title: '12-Stage Trace Replay Pipeline & Forensic Benchmark',
    subtitle: 'ห่วงโซ่การสืบย้อนรอยพยานดิจิทัลบิตต่อบิต 12 ขั้นตอนภายใต้ SLA < 142 ms',
    bulletPoints: [
      { label: 'Stages 01–04 (Ingest & Crypto)', detail: 'PREPARE → INGEST (Dilithium-5) → ASSURE (Kyber-1024) → UNDERSTAND (SPHINCS+)', highlight: 'Stages 01–04' },
      { label: 'Stages 05–08 (Logic & WORM)', detail: 'SIMULATE → AUDIT → CONCLUDE → COMMIT (Module 17 V24 WORM Ledger)', highlight: 'Stages 05–08' },
      { label: 'Stages 09–12 (Court Export)', detail: 'PROVE → BROADCAST (6-BFT Mesh) → SEAL (#849,202) → DOSSIER (PDF/A-3)', highlight: 'Stages 09–12' },
      { label: 'Benchmark Execution', detail: 'เวลาประมวลผลจริง 35.80 ms (เร็วกว่าเกณฑ์ SLA 142.00 ms ถึง 74.8%)', highlight: '35.80 ms SLA' }
    ],
    statBox: {
      value: '35.8 ms',
      label: 'Actual Replay Time',
      sublabel: 'SLA Limit < 142 ms'
    },
    footerNote: 'Compliant with ISO/IEC 27037 Digital Forensics Standards'
  },
  {
    id: 8,
    badge: 'SLIDE 08 / 10 • CHAMBERS 16 & 17',
    title: 'Peripheral Extensions: Chamber 16 & 17 Control Hub',
    subtitle: 'การเชื่อมโยงระบบรอบนอกโดยไม่กระทบความสมบูรณ์ของแกนหลัก SSoT Kernel',
    bulletPoints: [
      { label: 'Chamber 17 (Apex Control)', detail: 'ตาราง 6×3 Matrix Grid รวมศูนย์สถานะ 18 Chambers อำนาจสิทธิ์ #EP-SOVEREIGN-01', highlight: 'Apex Command' },
      { label: 'Chamber 16 (3D Visualizer)', detail: 'เรนเดอร์ GPU Isolated Buffer 410 โหนด (400 RWA Orbits + 10 HSM Deca-Key)', highlight: '10 FPS GPU' },
      { label: 'Decagonal D10 Symmetry', detail: 'สมมาตรผลึกทองคำ Golden Icosahedron Core #849202 พร้อมวงแหวน Torus', highlight: 'D10 Symmetry' },
      { label: 'Isolated UI Buffer', detail: 'รับส่งสัญญาณทางเดียว (Read-Only Telemetry) มั่นใจว่า Kernel Mutation Delta = 0', highlight: 'Zero Drift' }
    ],
    statBox: {
      value: '410',
      label: 'Lattice Nodes',
      sublabel: '400 RWA + 10 HSM'
    },
    footerNote: 'Continuous Synchronization via Reality Sync Pipeline'
  },
  {
    id: 9,
    badge: 'SLIDE 09 / 10 • CHAMBER 07 & 13',
    title: 'Treasury Stability & Global 6-Node BFT Mesh',
    subtitle: 'เสถียรภาพคลังสินทรัพย์ FIOS และโครงข่ายฉันทามติกระจายศูนย์ข้ามทวีป',
    bulletPoints: [
      { label: 'FIOS Treasury (Nc × Vc)', detail: 'กองทุนคืนค่าแก๊ส ฿12.5M FIOS Gas Refund Allocation Pool ตรวจสอบยอดแม่นยำ', highlight: '฿12.5M Pool' },
      { label: 'ZYR-02 Griefing Shield', detail: 'ฟังก์ชันคลังถูกจำกัดสิทธิ์เฉพาะ OnlySovereign ป้องกันการระบายสภาพคล่อง', highlight: 'Anti-Griefing' },
      { label: '6-Node Global BFT Mesh', detail: 'กรุงเทพฯ (BK01), สิงคโปร์ (SG02), โตเกียว (TY03), ซูริก (ZH04), ซิลิคอนวัลเลย์ (SV05), ลอนดอน (LD06)', highlight: '6 Hubs' },
      { label: 'Post-Quantum WireGuard', detail: 'อุโมงค์ข้อมูลความปลอดภัยระดับควอนตัม QKD + X448 + ML-KEM-1024', highlight: 'PQ-WireGuard' }
    ],
    statBox: {
      value: '฿12.5M',
      label: 'Gas Refund Reserve',
      sublabel: 'Nc × Vc Invariant'
    },
    footerNote: 'Byzantine Fault Tolerant (BFT) Global Consensus Topology'
  },
  {
    id: 10,
    badge: 'SLIDE 10 / 10 • RATIFICATION & VERDICT',
    title: 'Governance Certification & Court Readiness Verdict',
    subtitle: 'บทสรุปการรับรองความถูกต้องสมบูรณ์สูงสุดของ ZYRQUEN Ω v1.2 LTS',
    bulletPoints: [
      { label: 'Kernel Immutability', detail: 'FROZEN v1.2 LTS ปิดผนึกถาวร SSoT Mutation Delta = 0, Baseline Drift = 0.00%', highlight: '100% FROZEN' },
      { label: 'Master Gates Verdict', detail: '22/22 ด่านทดสอบผ่านฉันทามติเอกฉันท์ (Unanimous Pass) เวลาเฉลี่ย 1.82 ms', highlight: '22/22 PASSED' },
      { label: 'Judicial Admissibility', detail: 'รองรับการนำสืบพยานหลักฐานในชั้นศาลตามประมวลกฎหมายวิธีพิจารณาความแพ่ง', highlight: 'Court Admissible' },
      { label: 'Sole Authority', detail: 'สิทธิ์บริหารสูงสุดผูกขาดแก่นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) แต่เพียงผู้เดียว', highlight: '#EP-SOVEREIGN-01' }
    ],
    statBox: {
      value: 'READY',
      label: 'Master Verdict',
      sublabel: 'WORM-14902 Ratified'
    },
    footerNote: 'Issued under Canonical Protocol ZYRQUEN-Ω-2026-FROZEN-LTS'
  }
];

export const ExecutiveSlideDeck: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const currentSlide = SLIDES_DATA[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < SLIDES_DATA.length - 1) {
      playTone(700, 0.03);
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      playTone(500, 0.03);
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleSelectSlide = (idx: number) => {
    playTone(600, 0.03);
    setCurrentSlideIndex(idx);
  };

  const handleExportSummary = () => {
    playAuditChime();
    const summaryText = `ZYRQUEN Ω v1.2 LTS — Executive Slide Deck Summary
Sovereign Authority: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
Genesis Block: #849,202 | Canonical Seals: 14,902
Status: FROZEN v1.2 LTS (Delta=0, Drift=0.0000%)
Invariants: 10/10 PASSED | Master Gates: 22/22 PASSED (Avg 1.82ms)
PQC Suite: ML-DSA-87 (Dilithium-5) Active, SPHINCS+ Standby, Kyber-1024 KEM
Court Admissibility: ETDA Sections 9, 26, 28 & ISO/IEC 27037 100% Ready
Total Slides: 10/10
Exported at: ${new Date().toISOString()}`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_Executive_Slide_Deck_Summary_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-6">
      {/* Top Header & Slide Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-950/80 border-amber-700/60 rounded-xl text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border-cyan-800">
                EXECUTIVE SLIDE DECK
              </span>
              <span className="text-xs font-mono text-slate-400">10 Master Slides</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              สรุปสถาปัตยกรรมและการตรวจสอบ Master Gates 22/22 สำหรับผู้บริหาร
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportSummary}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Export Slide Deck Text Summary"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Summary</span>
          </button>

          <div className="flex items-center bg-slate-950 border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                currentSlideIndex === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-bold text-cyan-400">
              {currentSlideIndex + 1} / {SLIDES_DATA.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentSlideIndex === SLIDES_DATA.length - 1}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                currentSlideIndex === SLIDES_DATA.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Card Canvas */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[420px] flex flex-col justify-between">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          {/* Slide Badge & Title */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider">
              {currentSlide.badge}
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border-emerald-800/60">
              AUDIT CERTIFIED PASS
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {currentSlide.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
            {currentSlide.subtitle}
          </p>

          {/* Slide Content: Bullets + Stat Box */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Bullets */}
            <div className="md:col-span-2 space-y-3 font-sans">
              {currentSlide.bulletPoints.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/70 border-slate-800/80 p-3 rounded-xl flex items-start gap-3 hover:border-slate-700 transition"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-200">{item.label}: </span>
                    <span className="text-slate-300">{item.detail}</span>
                    {item.highlight && (
                      <span className="ml-2 inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-cyan-950 text-cyan-300 border-cyan-800">
                        {item.highlight}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right 1 Col: Stat Callout Box */}
            {currentSlide.statBox && (
              <div className="bg-slate-900/90 border-cyan-800/60 p-5 rounded-2xl text-center space-y-2 shadow-lg shadow-cyan-950/40">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  {currentSlide.statBox.label}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {currentSlide.statBox.value}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {currentSlide.statBox.sublabel}
                </p>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <span>✓</span>
                  <span>100% Deterministic</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500">
          <span>{currentSlide.footerNote}</span>
          <span className="text-cyan-400 font-bold">ZYRQUEN Ω v1.2 LTS FROZEN</span>
        </div>
      </div>

      {/* Slide Thumbnails Quick Navigation */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {SLIDES_DATA.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => handleSelectSlide(idx)}
            className={`p-2 rounded-xl border text-center transition cursor-pointer font-mono ${
              currentSlideIndex === idx
                ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-md shadow-amber-950'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span className="block text-[10px] font-bold">SLIDE</span>
            <span className="block text-xs font-black">{idx + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExecutiveSlideDeck;
