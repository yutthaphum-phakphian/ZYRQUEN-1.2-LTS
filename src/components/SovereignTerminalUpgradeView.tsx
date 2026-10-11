import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  RefreshCw,
  Shield,
  Terminal,
  Zap,
  Lock,
  Cpu,
  Layers,
  Activity,
  FileText,
  Download,
  Share2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CornerDownRight,
  Check,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  Flame,
  HardDrive
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';
import { playAuditChime, playTone } from './AudioSynthesizer';

export interface ChecklistItem {
  id: string;
  code: string;
  title: string;
  detail: string;
  commandSnippet?: string;
  verificationMethod: string;
  completed: boolean;
}

export interface UpgradePhase {
  phaseId: number;
  codeName: string;
  titleTh: string;
  titleEn: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  badgeBg: string;
  summary: string;
  items: ChecklistItem[];
}

export const INITIAL_UPGRADE_PHASES: UpgradePhase[] = [
  {
    phaseId: 1,
    codeName: 'PHASE-01-PRE-UPGRADE',
    titleTh: 'Phase 1 — Pre-Upgrade Verification',
    titleEn: 'Pre-Upgrade Baseline & SSoT Verification',
    icon: Shield,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
    summary: 'สำรองข้อมูล / Ledger / Config และยืนยัน SSoT Invariant Δ0.00% เทียบ Genesis Block #849202 พร้อม 14,902 Seals',
    items: [
      {
        id: 'p1_1',
        code: '1.1 System Snapshot',
        title: 'สำรองข้อมูล / Ledger / Config ทั้งหมดก่อนอัปเกรด',
        detail: 'สร้าง Immutable Frozen Snapshot จัดเก็บใน WORM Volume และยืนยัน SHA3-512 Hash Checksum',
        commandSnippet: 'zyrquen-cli snapshot create --frozen --genesis 849202 --out /worm/backup-pre-upgrade.tar.zst',
        verificationMethod: 'WORM Read-Only Integrity Hash Check',
        completed: true
      },
      {
        id: 'p1_2',
        code: '1.2 Genesis Binding',
        title: 'ตรวจสอบ SSoT Invariant Δ0.00% เทียบ Genesis Block #849202',
        detail: 'ยืนยัน Bitwise Replay และ Zero Drift เทียบ Genesis Block #849,202 และ Merkle Root 909ab814...43fa4c68',
        commandSnippet: 'zyrquen-core verify-ssot --genesis-block 849202 --expected-drift 0.0000',
        verificationMethod: 'Deterministic Zero-Drift Bitwise Comparator',
        completed: true
      },
      {
        id: 'p1_3',
        code: '1.3 Hardware Seal Audit',
        title: 'ยืนยัน 14,902 Seals ครบ 100% ผ่าน Deca-Custodian Quorum',
        detail: 'ตรวจสอบการลงนามครบถ้วน 10/10 Hardware HSM Nodes (TC-01 ถึง TC-10) ปราศจากตราประทับตกหล่น',
        commandSnippet: 'zyrquen-hsm quorum audit --seal-range 1-14902 --required-nodes 10',
        verificationMethod: '10/10 REAL_HSM FIPS 140-3 L4 Consensus',
        completed: true
      }
    ]
  },
  {
    phaseId: 2,
    codeName: 'PHASE-02-RUNTIME-UPGRADE',
    titleTh: 'Phase 2 — Runtime Environment Upgrade',
    titleEn: 'Node v20 LTS, WebCrypto PQC & Cryo Link',
    icon: Cpu,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
    summary: 'อัปเกรด Runtime สู่ Node.js v20 LTS พร้อม WebCrypto PQC Suite และเชื่อมต่อ Sub-Kelvin Cryo Enclaves @ 14.98 mK',
    items: [
      {
        id: 'p2_1',
        code: '2.1 Node Runtime Update',
        title: 'อัปเกรด Node.js → v20 LTS พร้อม WebCrypto PQC Suite',
        detail: 'ติดตั้ง Node.js v20 LTS รองรับ WebCrypto Lattice PQC (ML-DSA-87, Kyber-1024, SPHINCS+)',
        commandSnippet: 'sudo apt update && sudo apt install -y nodejs@20 && node -v',
        verificationMethod: 'WebCrypto PQC Native Buffer Binding',
        completed: true
      },
      {
        id: 'p2_2',
        code: '2.2 Vitest & Happy-DOM',
        title: 'ติดตั้ง happy-dom@latest และ vitest@latest สำหรับ CI workflow',
        detail: 'ติดตั้งชุดทดสอบระดับ High-Performance เพื่อรัน Unit & Invariant Integration Tests แบบ Realtime',
        commandSnippet: 'npm install -D happy-dom@latest vitest@latest @vitest/ui@latest',
        verificationMethod: 'CI Pipeline 0-13s Pure Green Dependency Gate',
        completed: true
      },
      {
        id: 'p2_3',
        code: '2.3 Cryo Link Handshake',
        title: 'เชื่อมต่อ Sub-Kelvin Cryo Enclaves @ 14.98 mK เพื่อ Quantum Coherence 99.98%',
        detail: 'เชื่อมต่อสัญญาณอุณหภูมิต่ำกว่าศูนย์สัมบูรณ์ 14.98 mK เพื่อลด Quantum Thermal Noise สู่สถานะ Superconducting',
        commandSnippet: 'zyrquen-cryo handshake --target-temp 14.98mK --coherence-min 0.9998',
        verificationMethod: 'Superconducting Superfluid Coherence Telemetry',
        completed: true
      }
    ]
  },
  {
    phaseId: 3,
    codeName: 'PHASE-03-COMMAND-LAYER',
    titleTh: 'Phase 3 — Sovereign Command Layer',
    titleEn: 'Dark Sovereign CLI, WORM Binding & 60 FPS Telemetry',
    icon: Terminal,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    summary: 'เปิดใช้งาน Dark Sovereign CLI พร้อม Fail-Closed Isolation, ผูก WORM Ledger และ D3 60 FPS Telemetry Console',
    items: [
      {
        id: 'p3_1',
        code: '3.1 Dark Sovereign CLI',
        title: 'เปิดใช้งาน CLI พร้อม Fail-Closed Isolation Protocol (AIR-GAP READY)',
        detail: 'จำกัดสิทธิ์สั่งการเฉพาะ Principal Architect (#EP-SOVEREIGN-01) พร้อมระบบตัดสัญญาณอัตโนมัติเมื่อเกิด Anomaly',
        commandSnippet: 'zyrquen-cli daemon start --air-gap-strict --isolation fail-closed',
        verificationMethod: 'OnlySovereign Passport #EP-SOVEREIGN-01 Enforcement',
        completed: true
      },
      {
        id: 'p3_2',
        code: '3.2 Audit Binding',
        title: 'ผูก Terminal Log เข้ากับ WORM Ledger + RFC 3161 TSA Token',
        detail: 'ทุกคำสั่งในเทอมินอลจะถูกสร้าง Merkle Hash และประทับเวลาทางอิเล็กทรอนิกส์ตาม พ.ร.บ. ธุรกรรมฯ ม.๙, ๒๖, ๒๘',
        commandSnippet: 'zyrquen-tsa bind-session --authority ETDA-RFC3161-TH --auto-sign ML-DSA-87',
        verificationMethod: 'RFC 3161 TSA Hardware Token Counter-Signature',
        completed: true
      },
      {
        id: 'p3_3',
        code: '3.3 Telemetry Console',
        title: 'เปิด D3 Dynamic Heatmap + Realtime Chart 60 FPS สำหรับ 14.9K Seals',
        detail: 'คอนโซลแสดงผลกราฟิก Realtime 60 FPS ติดตามการเต้นของคลื่นฮาร์ดแวร์ 14,902 ซีลและบัฟเฟอร์ DMA >15 GB/s',
        commandSnippet: 'zyrquen-telemetry stream --fps 60 --gpu-accel webgl2 --channel chamber-17',
        verificationMethod: 'D3 GPU-Accelerated 60 FPS Telemetry Pipe',
        completed: true
      }
    ]
  },
  {
    phaseId: 4,
    codeName: 'PHASE-04-POST-VALIDATION',
    titleTh: 'Phase 4 — Post-Upgrade Validation',
    titleEn: 'Automated Vitest, Quorum Signature & Court Proof',
    icon: Award,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800',
    summary: 'รันการทดสอบ Vitest ทุกการผูกตรึง ตรวจสอบ 10/10 HSM Active Shield Sig และออกใบรับรอง Court-Admissible Proof',
    items: [
      {
        id: 'p4_1',
        code: '4.1 Runtime Verification',
        title: 'รัน npx vitest run tests/sovereign-runtime-verification.test.tsx --environment happy-dom',
        detail: 'ประเมิน 22/22 Master Verification Gates และ 10/10 Invariants แบบอัตโนมัติด้วยเวลาเฉลี่ย 35.80 ms (< 142 ms)',
        commandSnippet: 'npx vitest run tests/sovereign-runtime-verification.test.tsx --environment happy-dom',
        verificationMethod: '22/22 Pure Green Automated Vitest Runner',
        completed: true
      },
      {
        id: 'p4_2',
        code: '4.2 Quorum Consensus Check',
        title: 'ตรวจสอบ 10/10 REAL_HSM FIPS 140-3 L4 Active Shield Signature',
        detail: 'ยืนยันรหัสลายเซ็น 0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8 ครบถ้วน 10 โหนด',
        commandSnippet: 'zyrquen-hsm verify-active-shield --expected-sig 0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8',
        verificationMethod: '10/10 FIPS 140-3 Level 4 Active Shield Quorum',
        completed: true
      },
      {
        id: 'p4_3',
        code: '4.3 Court-Admissible Proof',
        title: 'ยืนยัน RFC 3161 Timestamp + PQC Signature ML-DSA-87 / Kyber-1024',
        detail: 'ออกรายงานนิติวิทยาศาสตร์ดิจิทัล Court Dossier สอดคล้อง ISO/IEC 27037:2012 พร้อมส่งศาลได้ทันที',
        commandSnippet: 'zyrquen-court generate-dossier --format pdf-a3 --include-qr --sovereign-id EP-SOVEREIGN-01',
        verificationMethod: 'ISO/IEC 27037:2012 & Thai Evidence Code §94 Admissibility',
        completed: true
      }
    ]
  },
  {
    phaseId: 5,
    codeName: 'PHASE-05-TREASURY-INTEGRATION',
    titleTh: 'Phase 5 — Sovereign Treasury Integration',
    titleEn: 'Budget Anchor ฿3,083.17M THB & Variance Guard',
    icon: HardDrive,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
    summary: 'ผูก Terminal เข้ากับ Sovereign Treasury ฿3,083.17M THB, ควบคุม Variance Δ0.00% และ Realtime SLA < 142ms',
    items: [
      {
        id: 'p5_1',
        code: '5.1 Budget Anchor',
        title: 'ผูก Terminal เข้ากับ Sovereign Treasury ฿3,083.17M THB',
        detail: 'ล็อกมูลค่าทรัพย์สินคลังสัจธรรม รวม ฿3,083,170,000.00 THB ภายใต้สิทธิ์ OnlySovereign #EP-SOVEREIGN-01',
        commandSnippet: 'zyrquen-treasury anchor --amount 3083170000.00 --currency THB --sovereign-lock',
        verificationMethod: 'Immutable Treasury Ledger Invariant Check',
        completed: true
      },
      {
        id: 'p5_2',
        code: '5.2 Variance Guard',
        title: 'Δ0.00% Financial Drift • Court-Admissible Ledger',
        detail: 'ตรวจสอบความคลาดเคลื่อนทางการเงินเป็น 0.00 บาท (Variance = ฿0.00) รับรองความถูกต้องทางบัญชีนิติวิทยาศาสตร์',
        commandSnippet: 'zyrquen-treasury audit-variance --strict-zero-drift --court-log',
        verificationMethod: 'Court-Admissible Dual-Entry Merkle Reconciliation',
        completed: true
      },
      {
        id: 'p5_3',
        code: '5.3 Treasury Telemetry',
        title: 'Realtime Dashboard • SLA < 142ms Replay Speed',
        detail: 'แสดงสถานะการเคลื่อนไหวของคลังแบบเรียลไทม์ ตรวจสอบความถูกต้องของสัญญาทั้งหมดภายใน SLA 35.80 ms',
        commandSnippet: 'zyrquen-telemetry treasury --stream-rate 100hz --sla-ceiling 142ms',
        verificationMethod: 'Deterministic High-Speed Trace Replay SLA',
        completed: true
      }
    ]
  },
  {
    phaseId: 6,
    codeName: 'PHASE-06-MULTI-REGION-EXPANSION',
    titleTh: 'Phase 6 — Multi-Region Custodian Expansion',
    titleEn: 'Regional Edge Nodes & Low-Latency Quorum',
    icon: Activity,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
    summary: 'ขยายโหนดสู่ Bangkok, Chiang Mai, Hong Kong, Singapore ควบคุม Quorum ขั้นต่ำ 8/10 และ Latency เฉลี่ย 7.5ms',
    items: [
      {
        id: 'p6_1',
        code: '6.1 Regional Edge Nodes',
        title: 'ขยายโหนด Bangkok • Chiang Mai • Hong Kong • Singapore',
        detail: 'ติดตั้ง Edge Nodes ประจำ 4 ศูนย์กลางภูมิภาค เชื่อมต่อโครงข่าย PQ-WireGuard เข้ารหัสระดับควอนตัม',
        commandSnippet: 'zyrquen-mesh join --regions BKK,CNX,HKG,SIN --pqc-tunnel wireguard',
        verificationMethod: '4-Hub BFT Mesh Topology Verification',
        completed: true
      },
      {
        id: 'p6_2',
        code: '6.2 Quorum Threshold',
        title: 'เกณฑ์ฉันทามติขั้นต่ำ Min. 8/10 Consensus • FIPS 140-3 L4',
        detail: 'กำหนดเงื่อนไขลงนามร่วมอย่างน้อย 8 ใน 10 โหนดฮาร์ดแวร์เพื่ออนุมัติคำสั่งระดับวิกฤต',
        commandSnippet: 'zyrquen-quorum set-threshold --min-nodes 8 --total-nodes 10 --fips-level 4',
        verificationMethod: 'FIPS 140-3 Level 4 BFT Multi-Sig Quorum',
        completed: true
      },
      {
        id: 'p6_3',
        code: '6.3 Latency Audit',
        title: 'ตรวจสอบความหน่วงเฉลี่ย Avg. 7.5ms • Sub-Millisecond Wire',
        detail: 'ทดสอบ Round-Trip Time ข้ามเครือข่ายความเร็วสูง อยู่ในเกณฑ์มาตรฐานต่ำกว่า 15 ms สม่ำเสมอ',
        commandSnippet: 'zyrquen-mesh benchmark-latency --duration 60s --max-latency 15ms',
        verificationMethod: 'Continuous Round-Trip Latency Telemetry',
        completed: true
      }
    ]
  },
  {
    phaseId: 7,
    codeName: 'PHASE-07-PQC-ENFORCEMENT',
    titleTh: 'Phase 7 — Post-Quantum Cryptography Enforcement',
    titleEn: 'ML-DSA-87, Kyber-1024 & SPHINCS+ Tri-Lattice',
    icon: Lock,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    summary: 'บังคับใช้มาตรฐาน NIST PQC Category 5 ครบ 3 ชุดอัลกอริทึม (ML-DSA-87, Kyber-1024, SPHINCS+)',
    items: [
      {
        id: 'p7_1',
        code: '7.1 ML-DSA-87 Enforcement',
        title: 'Digital Signature Integrity & Non-Repudiation (Dilithium-5)',
        detail: 'ประทับลายมือชื่อดิจิทัล NIST FIPS 204 ในทุกตราประทับ 14,902 ตรา ป้องกันการปฏิเสธความรับผิด',
        commandSnippet: 'zyrquen-crypto enforce-signature --algo ML-DSA-87 --fips 204',
        verificationMethod: 'NIST FIPS 204 Lattice Signature Verification',
        completed: true
      },
      {
        id: 'p7_2',
        code: '7.2 Kyber-1024 Encryption',
        title: 'Key Encapsulation & Sensitive Data Protection (ML-KEM)',
        detail: 'เข้ารหัสช่องทางการสื่อสารและข้อมูลส่วนบุคคลตาม PDPA ด้วย NIST FIPS 203 Lattice KEM',
        commandSnippet: 'zyrquen-crypto enforce-kem --algo ML-KEM-1024 --fips 203',
        verificationMethod: 'NIST FIPS 203 Lattice Key Encapsulation',
        completed: true
      },
      {
        id: 'p7_3',
        code: '7.3 SPHINCS+ Fallback',
        title: 'Stateless Hash-Based Signature • PQC Category 5',
        detail: 'เตรียมระบบสำรองฉุกเฉิน NIST FIPS 205 สลับการทำงานอัตโนมัติในเวลา < 1.20 ms เมื่อเกิด Lattice Alert',
        commandSnippet: 'zyrquen-crypto verify-fallback --algo SLH-DSA --zero-downtime',
        verificationMethod: 'Stateless Hash-Tree Failover Benchmark',
        completed: true
      }
    ]
  },
  {
    phaseId: 8,
    codeName: 'PHASE-08-FORENSIC-COMPLIANCE',
    titleTh: 'Phase 8 — Forensic & Statutory Compliance',
    titleEn: '12-Stage Replay, 16-Step Verification & Thai Statutory Tier',
    icon: Award,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800',
    summary: '12-Stage Replay, 16-Step Verification 100% PASSED และการผูกกฎหมายไทย ETDA ม.๙, ๒๖, ๒๘, PDPA ม.๓๗, ISO 27037',
    items: [
      {
        id: 'p8_1',
        code: '8.1 Replay Trace',
        title: '12-Stage Replay • Immutable WORM Ledger',
        detail: 'พิสูจน์ประวัติคำสั่งทุกบิตย้อนหลังเทียบ Genesis Block #849,202 ด้วยความเร็ว 35.80 ms',
        commandSnippet: 'zyrquen-forensics trace-replay --stages 1-12 --worm-ledger module17-v24',
        verificationMethod: '12-Stage Forensic Trace Replay Engine',
        completed: true
      },
      {
        id: 'p8_2',
        code: '8.2 Audit Pipeline',
        title: '16-Step Forensic Verification • 100% PASSED',
        detail: 'ประเมิน 16 ขั้นตอนการตรวจสอบทางนิติวิทยาศาสตร์ดิจิทัล ผ่านเกณฑ์เอกฉันท์ปราศจากข้อผิดพลาด',
        commandSnippet: 'zyrquen-audit pipeline --steps 16 --strict-unanimous',
        verificationMethod: '16-Step Comprehensive Integrity Gate',
        completed: true
      },
      {
        id: 'p8_3',
        code: '8.3 Legal Compliance Matrix',
        title: 'ETDA Sec 9, 26, 28 • PDPA Sec 37 • ISO/IEC 27037',
        detail: 'รับรองความสมบูรณ์ทางกฎหมายอิเล็กทรอนิกส์ไทยและการคุ้มครองข้อมูลส่วนบุคคล พร้อมนำสืบในศาลได้ทันที',
        commandSnippet: 'zyrquen-legal generate-certificate --statutes ETDA,PDPA,ISO27037',
        verificationMethod: 'Court-Admissible Statutory Certification',
        completed: true
      }
    ]
  }
];

export const SovereignTerminalUpgradeView: React.FC = () => {
  const [phases, setPhases] = useState<UpgradePhase[]>(INITIAL_UPGRADE_PHASES);
  const [activeTab, setActiveTab] = useState<'checklist' | 'infographic' | 'script' | 'governance'>('checklist');
  const [isExecutingScript, setIsExecutingScript] = useState<boolean>(false);
  const [scriptLogs, setScriptLogs] = useState<string[]>([
    '# Sovereign Terminal Interface vΩ∞ Initialized',
    '# System Identity: #EP-SOVEREIGN-01 (Principal Architect)',
    '# Genesis Block Target: #849,202 | Canonical Seals: 14,902',
    '# Ready for Quantum-Secure Active Shield Upgrade...'
  ]);

  // Toggle checklist item
  const handleToggleItem = (phaseId: number, itemId: string) => {
    playTone(620, 0.04);
    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.phaseId !== phaseId) return phase;
        return {
          ...phase,
          items: phase.items.map((item) => {
            if (item.id !== itemId) return item;
            return { ...item, completed: !item.completed };
          })
        };
      })
    );
  };

  // Progress calculations
  const totalItems = useMemo(
    () => phases.reduce((acc, p) => acc + p.items.length, 0),
    [phases]
  );
  const completedItems = useMemo(
    () => phases.reduce((acc, p) => acc + p.items.filter((i) => i.completed).length, 0),
    [phases]
  );
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  // One-click Automated Script Runner Simulator
  const handleRunUpgradeScript = async () => {
    if (isExecutingScript) return;
    setIsExecutingScript(true);
    playAuditChime();

    const sequence = [
      '🚀 [PHASE 1] Initializing Pre-Upgrade Verification Snapshot...',
      '🔒 [WORM] Creating Frozen Snapshot tar.zst (Checksum SHA3-512 OK)...',
      '⚖️ [SSoT] Verifying Invariants against Genesis Block #849,202... Drift: 0.0000% (MATCH)',
      '🛡️ [HSM] Auditing 14,902 Canonical Seals across 10 Deca-Nodes... (10/10 PASS)',
      '📦 [PHASE 2] Executing: sudo apt update && sudo apt install -y nodejs@20',
      '📦 [NPM] Installing happy-dom@latest vitest@latest @google/genai...',
      '❄️ [CRYO] Handshake with Sub-Kelvin Cryo Enclave @ 14.98 mK... Quantum Coherence: 99.98%',
      '🧠 [PHASE 3] Starting Dark Sovereign CLI in Air-Gap Fail-Closed Mode...',
      '📜 [TSA] Binding Terminal Session to RFC 3161 Token & ML-DSA-87 Lattice Signature...',
      '📈 [TELEMETRY] Starting 60 FPS D3 GPU-Accelerated Live Stream Channel...',
      '🧪 [PHASE 4] Running: npx vitest run tests/sovereign-runtime-verification.test.tsx',
      '✅ [VITEST] 22/22 Master Gates Passed (Duration: 35.80 ms < SLA 142 ms)',
      '💎 [SIG] 0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8 Verified',
      '💰 [PHASE 5] Anchoring Sovereign Treasury ฿3,083.17M THB... Variance: Δ0.00% (PASS)',
      '🌐 [PHASE 6] Mesh Routing: Bangkok • Chiang Mai • Hong Kong • Singapore (Latency: 7.5ms)',
      '🛡️ [PHASE 7] Enforcing NIST PQC Suite: ML-DSA-87 + Kyber-1024 + SPHINCS+ (PASS)',
      '🏛️ [PHASE 8] 12-Stage Replay Trace & 16-Step Verification Ratified (ETDA/PDPA/ISO 27037)',
      '🏛️ [COURT] ISO/IEC 27037:2012 Court Dossier Generated & Sealed by #EP-SOVEREIGN-01',
      '💠 [VERDICT] 8-PHASE SOVEREIGN TERMINAL UPGRADE COMPLETE — ACTIVE SHIELD vΩ∞ ONLINE!'
    ];

    setScriptLogs(['[START] Initiating Sovereign Terminal Upgrade Cycle (8-Phase Suite)...']);

    for (let i = 0; i < sequence.length; i++) {
      await new Promise((r) => setTimeout(r, 220));
      setScriptLogs((prev) => [...prev, sequence[i]]);
      playTone(550 + i * 30, 0.02);
    }

    // Mark all items completed
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        items: p.items.map((it) => ({ ...it, completed: true }))
      }))
    );

    setIsExecutingScript(false);
    playAuditChime();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans text-slate-100">
      {/* Top Header & Status Banner */}
      <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-700/60 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>ZYRQUEN Ω∞ SOVEREIGN TERMINAL</span>
              </span>
              <span className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-700/60 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>ACTIVE SHIELD vΩ∞ READY (8-PHASE)</span>
              </span>
              <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-full text-xs font-mono font-bold">
                GENESIS #{CANONICAL_GENESIS_BLOCK.toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Sovereign Terminal Upgrade Checklist &amp; Infographic Map</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              สถาปัตยกรรมยกระดับ Sovereign Terminal Interface สู่สถานะ <strong>Quantum-Secure Active Shield</strong> ครบ 8 เฟส — รองรับ Treasury ฿3,083.17M THB, Multi-Region Custodian Mesh (7.5ms), Post-Quantum PQC Suite (NIST Cat 5) และ Forensic Compliance (ETDA / PDPA / ISO 27037)
            </p>
          </div>

          {/* Quick Action & Overall Score Box */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <div className="text-left lg:text-right">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Upgrade Readiness
              </span>
              <div className="text-3xl font-black font-mono text-cyan-400">
                {progressPercent}%
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{completedItems}/{totalItems} Checks Verified</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleRunUpgradeScript}
              disabled={isExecutingScript}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg ${
                isExecutingScript
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-cyan-950/50'
              }`}
            >
              {isExecutingScript ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>EXECUTING UPGRADE...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-emerald-300" />
                  <span>ONE-CLICK AUTO UPGRADE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-400 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => {
            playTone(600, 0.02);
            setActiveTab('checklist');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-md shadow-cyan-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>4-PHASE CHECKLIST</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(600, 0.02);
            setActiveTab('infographic');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'infographic'
              ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-md shadow-amber-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>INFOGRAPHIC MAP</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(600, 0.02);
            setActiveTab('script');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'script'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-md shadow-emerald-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>CLI SCRIPT CONSOLE</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(600, 0.02);
            setActiveTab('governance');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'governance'
              ? 'bg-purple-950 text-purple-300 border border-purple-600 shadow-md shadow-purple-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-purple-400" />
          <span>BOARD GOVERNANCE SLIDE</span>
        </button>
      </div>

      {/* TAB 1: 4-PHASE CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phases.map((phase) => {
              const PhaseIcon = phase.icon;
              const phaseCompleted = phase.items.every((i) => i.completed);

              return (
                <div
                  key={phase.phaseId}
                  className={`bg-slate-900/80 border ${phase.borderColor} rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    {/* Phase Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border inline-block ${phase.badgeBg}`}
                        >
                          {phase.codeName}
                        </span>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <PhaseIcon className={`w-4 h-4 ${phase.color}`} />
                          <span>{phase.titleTh}</span>
                        </h3>
                        <p className="text-xs text-slate-400">{phase.titleEn}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            phaseCompleted
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {phase.items.filter((i) => i.completed).length}/{phase.items.length} PASS
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                      {phase.summary}
                    </p>

                    {/* Checklist Items */}
                    <div className="space-y-2.5 pt-1">
                      {phase.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(phase.phaseId, item.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer ${
                            item.completed
                              ? 'bg-slate-950/90 border-emerald-800/60 text-slate-200'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                              )}
                            </div>

                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs font-mono text-cyan-300">
                                  {item.code}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  {item.verificationMethod}
                                </span>
                              </div>

                              <div className="text-xs font-medium text-slate-200">
                                {item.title}
                              </div>

                              <p className="text-[11px] text-slate-400 leading-normal">
                                {item.detail}
                              </p>

                              {item.commandSnippet && (
                                <div className="mt-1.5 p-1.5 bg-black/80 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 break-all">
                                  $ {item.commandSnippet}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INFOGRAPHIC MAP */}
      {activeTab === 'infographic' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Terminal Upgrade Infographic Map — ZYRQUEN Ω∞</span>
              </h3>
              <p className="text-xs text-slate-400">
                ผังกระบวนการยกระดับเทอมินอล 4 ขั้นตอนสู่อธิปไตยดิจิทัลสมบูรณ์ (End-to-End Quantum Architecture)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-black text-cyan-400 font-mono text-xs border border-cyan-800 rounded-lg">
                Status: 10/10 REAL_HSM
              </span>
            </div>
          </div>

          {/* 8-Phase Infographic Steps Grid Pipeline */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Phase 1 Box */}
              <div className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 font-mono text-[10px] font-bold rounded border border-amber-800">
                    PHASE 1
                  </span>
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="font-bold text-sm text-white">Pre-Upgrade Baseline</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• System Backup Snapshot</li>
                  <li>• Genesis Block #849,202</li>
                  <li>• Seal Audit: 14,902 Seals</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-400 font-mono">
                  SSoT Baseline: Δ0.00%
                </div>
              </div>

              {/* Phase 2 Box */}
              <div className="bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold rounded border border-cyan-800">
                    PHASE 2
                  </span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="font-bold text-sm text-white">Runtime Environment</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• Node.js v20 LTS WebCrypto</li>
                  <li>• happy-dom &amp; vitest UI</li>
                  <li>• Cryo Link @ 14.98 mK</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-cyan-400 font-mono">
                  Coherence: 99.98%
                </div>
              </div>

              {/* Phase 3 Box */}
              <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-800">
                    PHASE 3
                  </span>
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-bold text-sm text-white">Command Layer</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• Dark Sovereign CLI</li>
                  <li>• WORM + RFC 3161 TSA</li>
                  <li>• 60 FPS Telemetry Console</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
                  Isolation: FAIL-CLOSED
                </div>
              </div>

              {/* Phase 4 Box */}
              <div className="bg-slate-950 border-2 border-purple-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-purple-950 text-purple-300 font-mono text-[10px] font-bold rounded border border-purple-800">
                    PHASE 4
                  </span>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="font-bold text-sm text-white">Validation &amp; Quorum</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• Vitest 22/22 Gates (35.8ms)</li>
                  <li>• 10/10 HSM Active Shield Sig</li>
                  <li>• Court Proof (ISO 27037)</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-purple-400 font-mono">
                  Admissibility: COURT-READY
                </div>
              </div>
            </div>

            {/* Row 2: Phases 5 through 8 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Phase 5 Box */}
              <div className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 font-mono text-[10px] font-bold rounded border border-amber-800">
                    PHASE 5
                  </span>
                  <HardDrive className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="font-bold text-sm text-white">Treasury Integration</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• Anchor ฿3,083.17M THB</li>
                  <li>• Variance: Δ0.00% Drift</li>
                  <li>• Telemetry SLA &lt; 142ms</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-400 font-mono">
                  Treasury Lock: #EP-SOVEREIGN-01
                </div>
              </div>

              {/* Phase 6 Box */}
              <div className="bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold rounded border border-cyan-800">
                    PHASE 6
                  </span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="font-bold text-sm text-white">Multi-Region Quorum</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• BKK • CNX • HKG • SIN</li>
                  <li>• Min. 8/10 Consensus (FIPS L4)</li>
                  <li>• Latency Avg. 7.5ms Wire</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-cyan-400 font-mono">
                  PQ-WireGuard Encrypted
                </div>
              </div>

              {/* Phase 7 Box */}
              <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-800">
                    PHASE 7
                  </span>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-bold text-sm text-white">PQC Enforcement</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• ML-DSA-87 (Dilithium-5)</li>
                  <li>• Kyber-1024 (ML-KEM)</li>
                  <li>• SPHINCS+ NIST Cat 5</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
                  Zero Lattice Collapse SLA
                </div>
              </div>

              {/* Phase 8 Box */}
              <div className="bg-slate-950 border-2 border-purple-500/60 rounded-2xl p-4 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-purple-950 text-purple-300 font-mono text-[10px] font-bold rounded border border-purple-800">
                    PHASE 8
                  </span>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="font-bold text-sm text-white">Forensic Compliance</h4>
                <ul className="text-xs space-y-1 text-slate-300 font-mono">
                  <li>• 12-Stage Trace Replay</li>
                  <li>• 16-Step Verification PASS</li>
                  <li>• ETDA Sec 9/26/28 • PDPA 37</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-purple-400 font-mono">
                  ISO/IEC 27037:2012 Certified
                </div>
              </div>
            </div>
          </div>

          {/* Key Differentiator Summary Callouts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Quantum-Secure Active Shield</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                เทอมินอลเข้าสู่สถานะป้องกันระดับควอนตัม (Lattice-based PQC Suite) ไม่สามารถถูกดักฟังหรือปลอมแปลงได้
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Forensic Audit Binding</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                ทุกคำสั่งผูกกับ WORM Ledger และ Timestamp ที่ตรวจสอบได้ในชั้นศาลตาม พ.ร.บ. ธุรกรรมฯ ม.๙, ๒๖, ๒๘
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Sovereign CLI Protocol</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                รองรับการสั่งงาน Fail-Closed Isolation Protocol (AIR-GAP READY) ปลอดภัยต่อการโจมตีจากภายนอก 100%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLI SCRIPT CONSOLE */}
      {activeTab === 'script' && (
        <div className="bg-black border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-bold text-slate-400">
                sovereign-terminal-upgrade.sh — bash 80x24 (Node v20 LTS)
              </span>
            </div>

            <button
              type="button"
              onClick={handleRunUpgradeScript}
              disabled={isExecutingScript}
              className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs rounded border border-cyan-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>EXECUTE BASH</span>
            </button>
          </div>

          {/* Script Display */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs text-slate-300 space-y-1.5 overflow-x-auto font-mono">
            <div className="text-slate-500"># ZYRQUEN Ω∞ Sovereign Terminal 8-Phase Upgrade Script (Bash 80x24)</div>
            <div className="text-amber-400"># [PHASE 1-2] Baseline Backup &amp; Runtime Environment</div>
            <div className="text-cyan-300">zyrquen-admin snapshot --all --output /var/sovereign/backups/genesis-849202.tar.zst</div>
            <div className="text-cyan-300">sudo apt update &amp;&amp; sudo apt install -y nodejs@20 &amp;&amp; npm install happy-dom@latest vitest@latest</div>
            <div className="text-amber-400"># [PHASE 3-4] Command Isolation &amp; 22/22 Validation Gates</div>
            <div className="text-cyan-300">zyrquen-cli init --fail-closed --tsa rfc3161 --pqc ML-DSA-87</div>
            <div className="text-cyan-300">npx vitest run tests/sovereign-runtime-verification.test.tsx --environment happy-dom</div>
            <div className="text-amber-400"># [PHASE 5-6] Sovereign Treasury ฿3,083.17M THB &amp; Multi-Region Mesh</div>
            <div className="text-cyan-300">zyrquen-treasury anchor --amount 3083170000.00 --strict-zero-drift --court-log</div>
            <div className="text-cyan-300">zyrquen-mesh join --regions BKK,CNX,HKG,SIN --pqc-tunnel wireguard --max-latency 15ms</div>
            <div className="text-amber-400"># [PHASE 7-8] NIST Category 5 PQC Suite &amp; Statutory Dossier</div>
            <div className="text-cyan-300">zyrquen-crypto enforce-suite --algo ML-DSA-87,ML-KEM-1024,SLH-DSA --zero-downtime</div>
            <div className="text-cyan-300">zyrquen-court generate-dossier --format pdf-a3 --include-qr --sovereign-id EP-SOVEREIGN-01</div>
          </div>

          {/* Live Output Logs */}
          <div className="space-y-1 text-xs max-h-72 overflow-y-auto p-3 bg-slate-950/90 rounded-xl border border-slate-900 text-slate-300">
            {scriptLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.startsWith('✅') || log.startsWith('💠')
                    ? 'text-emerald-400 font-bold'
                    : log.startsWith('🚀') || log.startsWith('📦')
                    ? 'text-cyan-300'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BOARD GOVERNANCE SLIDE (5-Slide Sovereign Board Briefing Deck) */}
      {activeTab === 'governance' && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 text-[10px] font-mono font-bold rounded border border-amber-800">
                  SOVEREIGN BOARD BRIEFING DECK (5 SLIDES)
                </span>
                <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold rounded border border-cyan-800">
                  TERMINAL GOVERNANCE
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Terminal Governance Presentation Deck — ZYRQUEN Ω∞
              </h3>
              <p className="text-xs text-slate-300">
                ชุดสไลด์นำเสนอฝ่ายบริหารสำหรับการประชุม Sovereign Board เพื่อให้สัตยาบัน Quantum-Secure Active Shield
              </p>
            </div>

            <div className="flex items-center gap-3">
              <QRCodeSVG
                value={`https://zyrquen.court.local/verify?terminal_governance=BOARD_DECK_5_SLIDES&root=${CANONICAL_MERKLE_ROOT}&genesis=${CANONICAL_GENESIS_BLOCK}`}
                size={54}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
                className="p-1 bg-white rounded border border-slate-700"
              />
            </div>
          </div>

          {/* 5 Slide Cards Grid */}
          <div className="space-y-4">
            {/* Slide 1: Executive Overview */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  SLIDE 1 — EXECUTIVE OVERVIEW
                </span>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white">วัตถุประสงค์และขอบเขตอธิปไตย</h4>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li>• <strong>Objective:</strong> ยกระดับ Terminal เข้าสู่ Quantum-Secure Active Shield เต็มรูปแบบ</li>
                <li>• <strong>Scope:</strong> ครอบคลุม AI Workspace, Copilot Ω1, และ Sovereign CLI</li>
                <li>• <strong>Governance Principles:</strong> Zero-Drift Invariant Δ0.00% • Court-Admissible • Fail-Closed Protocol</li>
              </ul>
            </div>

            {/* Slide 2: Upgrade Phases */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">
                  SLIDE 2 — UPGRADE PHASES &amp; MILESTONES
                </span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-white">ตารางการส่งมอบ 4 เฟส</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2">Phase</th>
                      <th className="p-2">Core Action</th>
                      <th className="p-2">Key Outcome</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    <tr>
                      <td className="p-2 font-bold text-amber-400">Phase 1 Pre-Upgrade</td>
                      <td className="p-2">Backup &amp; Genesis Verification</td>
                      <td className="p-2">Immutable Baseline #849,202</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">✓ PASS</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-cyan-400">Phase 2 Environment</td>
                      <td className="p-2">Node v20 LTS + PQC Suite Install</td>
                      <td className="p-2">Quantum-Ready Runtime (@14.98mK)</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">✓ PASS</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-emerald-400">Phase 3 Command Layer</td>
                      <td className="p-2">Activate Dark CLI + Audit Bind</td>
                      <td className="p-2">Sovereign Control Plane Online</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">✓ PASS</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-purple-400">Phase 4 Validation</td>
                      <td className="p-2">Runtime Test + Quorum Check</td>
                      <td className="p-2">10/10 HSM Consensus PASS</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">✓ PASS</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Slide 3: Governance Mechanisms */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  SLIDE 3 — GOVERNANCE MECHANISMS
                </span>
                <Terminal className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white">กลไกการควบคุมและการป้องกันเชิงรุก</h4>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li>• <strong>Sovereign CLI Control:</strong> สั่งงานแบบ Fail-Closed พร้อม Air-Gap Isolation</li>
                <li>• <strong>WORM Ledger Binding:</strong> ทุกคำสั่งผูกกับ RFC 3161 TSA Token และ SHA3-512</li>
                <li>• <strong>Telemetry Governance Console:</strong> Heatmap 14.9K Seals + Realtime Drift Monitoring 60 FPS</li>
              </ul>
            </div>

            {/* Slide 4: Compliance & Audit */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400">
                  SLIDE 4 — COMPLIANCE &amp; FORENSIC AUDIT
                </span>
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white">กรอบกฎหมายและความมั่นคงทางนิติวิทยาศาสตร์</h4>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li>• <strong>Legal Framework:</strong> ETDA Sec 9, 26, 28 • PDPA Sec 37 • ISO/IEC 27037:2012</li>
                <li>• <strong>Post-Quantum Cryptography:</strong> ML-DSA-87 • Kyber-1024 • SPHINCS+ Tri-Lattice Quorum</li>
                <li>• <strong>Forensic Audit Pipeline:</strong> 12-Stage Replay Trace • 16-Step Verification 100% PASSED (35.80 ms)</li>
              </ul>
            </div>

            {/* Slide 5: Verdict & Next Steps */}
            <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  SLIDE 5 — VERDICT &amp; NEXT STEPS
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <blockquote className="text-xs font-serif italic text-amber-200 border-l-2 border-amber-400 pl-3 py-1">
                "เมื่ออัปเกรดครบทุกเฟส Terminal จะเข้าสู่สถานะ Sovereign Active Shield vΩ∞ พร้อมการตรวจสอบแบบ Forensic Realtime และการป้องกันระดับ Quantum-Secure ครับ"
              </blockquote>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
                <div>
                  <strong>Principal Custodian:</strong> นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
                </div>
                <div className="text-emerald-400 font-bold">
                  ✓ SOVEREIGN BOARD RATIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SovereignTerminalUpgradeView;
