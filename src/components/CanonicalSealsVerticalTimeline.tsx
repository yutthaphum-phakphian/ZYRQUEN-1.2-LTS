import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Lock,
  CheckCircle2,
  Sparkles,
  Download,
  Search,
  Layers,
  Clock,
  Calendar,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Scale,
  Zap,
  Activity,
  AlertTriangle,
  Cpu,
  Key,
  ExternalLink,
  SlidersHorizontal,
  FileText,
  FileCode,
  Maximize2,
  Minimize2,
  Gauge,
  Compass,
} from 'lucide-react';
import {
  CANONICAL_SEALS,
  CANONICAL_GENESIS_BLOCK,
  CANONICAL_MERKLE_ROOT,
  QUARANTINE_COUNT,
  SYSTEM_METADATA,
} from '../data/canonicalData';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import {
  exportCourtReadyJsonAuditTrail,
  exportCourtReadySignedPdfDossier,
} from '../utils/courtReadyAuditService';

export type ZoomMode = 'epoch' | 'daily' | 'hourly';

export interface SealEpochMilestone {
  epochId: string;
  epochName: string;
  epochNameTh: string;
  startSeal: number;
  endSeal: number;
  blockHeight: number;
  blockRange: string;
  timestamp: string;
  merkleLeafRoot: string;
  pqcAlgorithm: string;
  custodianLeader: string;
  status: 'FINAL_FROZEN' | 'CANONICAL_VERIFIED' | 'QUARANTINE_ISOLATED';
  description: string;
  keyEvents: string[];
  colorTheme: string;
  samples: Array<{
    sealNumber: number;
    block: number;
    time?: string;
    hash: string;
    parentHash: string;
    actor: string;
    type: string;
    chamber: string;
    isKeyMilestone?: boolean;
  }>;
}

export interface DailyMilestone {
  dayId: string;
  dayLabel: string;
  dayLabelTh: string;
  date: string;
  blockRange: string;
  sealCount: number;
  startSeal: number;
  endSeal: number;
  cumulativeTotal: number;
  activeChambers: string[];
  merkleCheckpointHash: string;
  pqcAlgorithm: string;
  leadAuditor: string;
  summary: string;
  hourlyWindowsCount: number;
  colorTheme: string;
  samples: Array<{
    sealNumber: number;
    block: number;
    time: string;
    hash: string;
    parentHash: string;
    actor: string;
    type: string;
    chamber: string;
    isKeyMilestone?: boolean;
  }>;
}

export interface HourlyMilestone {
  hourId: string;
  timeLabel: string;
  date: string;
  blockHeight: number;
  sealRange: string;
  startSeal: number;
  endSeal: number;
  sealBatchSize: number;
  throughputPerSec: number;
  avgChamberLatencyMs: number;
  leadChamber: string;
  merkleLeafSample: string;
  pqcSignatureSample: string;
  status: 'VERIFIED_FINAL' | 'QUARANTINE_ISOLATED';
  description: string;
  colorTheme: string;
  samples: Array<{
    sealNumber: number;
    block: number;
    time: string;
    hash: string;
    parentHash: string;
    actor: string;
    type: string;
    chamber: string;
    isKeyMilestone?: boolean;
  }>;
}

export const CANONICAL_EPOCH_MILESTONES: SealEpochMilestone[] = [
  {
    epochId: 'EPOCH-01',
    epochName: 'Genesis Origin & Zero-Kernel Calibration',
    epochNameTh: 'ปฐมกาลกำเนิดระบบและสอบเทียบเคอร์เนลอธิปไตย',
    startSeal: 1,
    endSeal: 2500,
    blockHeight: 849198,
    blockRange: '#849198',
    timestamp: '2026-09-08 00:00:01 ICT',
    merkleLeafRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcAlgorithm: 'FIPS 204 ML-DSA-87 (Dilithium-5) + Kyber-1024',
    custodianLeader: 'Supreme Architect นายยุทธภูมิ ภักเพียร (#EP-SOVEREIGN-01)',
    status: 'CANONICAL_VERIFIED',
    description: 'Genesis block initialization, zero-entropy cold boot, cryptographic anchor creation, and baseline registry binding.',
    keyEvents: [
      'Genesis Merkle Root seeded with Zero Drift Δ0.0%',
      'Chamber 00 (Root Kernel) & Chamber 01 (Merkle SSoT) synchronized',
      'Initial 2,500 system state invariants sealed and verified',
    ],
    colorTheme: 'cyan',
    samples: [
      { sealNumber: 1, block: 849198, time: '00:00:01 ICT', hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000', actor: 'Genesis Custodian #01', type: 'GENESIS_ROOT_INIT', chamber: 'CH-00', isKeyMilestone: true },
      { sealNumber: 500, block: 849198, time: '01:15:30 ICT', hash: '0x3a4b9c1d8e7f2056a49c2d1b8e7f9a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a', parentHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', actor: 'Quantum Sentinel', type: 'KERNEL_BASELINE_SEAL', chamber: 'CH-01' },
      { sealNumber: 1250, block: 849198, time: '02:45:12 ICT', hash: '0x8f2a1b9c4d7e0f2156b89c3d4e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', parentHash: '0x3a4b9c1d8e7f2056a49c2d1b8e7f9a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a', actor: 'Entropy Stabilizer', type: 'ZERO_ENTROPY_PROOF', chamber: 'CH-10' },
      { sealNumber: 2500, block: 849198, time: '05:59:59 ICT', hash: '0x5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d', parentHash: '0x8f2a1b9c4d7e0f2156b89c3d4e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', actor: 'Supreme Architect', type: 'EPOCH_01_CHECKPOINT', chamber: 'CH-00', isKeyMilestone: true },
    ],
  },
  {
    epochId: 'EPOCH-02',
    epochName: 'SSoT Lattice Hardening & Truth Matrix',
    epochNameTh: 'การตรึงโครงผลึกสัจธรรมและการจัดรูปเมทริกซ์ความจริง',
    startSeal: 2501,
    endSeal: 6000,
    blockHeight: 849199,
    blockRange: '#849199',
    timestamp: '2026-09-08 06:00:00 ICT',
    merkleLeafRoot: '0x8b4c2d9a1f7e3058a9c2d1b8e7f9a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    pqcAlgorithm: 'FIPS 204 ML-DSA-87 + FIPS 205 SLH-DSA SPHINCS+',
    custodianLeader: 'AI Sovereign Sentinel & Quantum Core Warden',
    status: 'CANONICAL_VERIFIED',
    description: 'Enforcement of zero-mutation invariant, immutable truth matrix binding, and cryptographic lock of the 10 core systemic rules.',
    keyEvents: [
      '10/10 Invariants locked at 100% Coherence',
      'Mutation Authority set to 0 (READ-ONLY STRICT)',
      'Sub-Kelvin cryo-buffer thermal isolation verified at 14.91 mK',
    ],
    colorTheme: 'emerald',
    samples: [
      { sealNumber: 2501, block: 849199, time: '06:00:05 ICT', hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', parentHash: '0x5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d', actor: 'SSoT Guard Node', type: 'LATTICE_LOCK_INIT', chamber: 'CH-01' },
      { sealNumber: 4200, block: 849199, time: '08:30:20 ICT', hash: '0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d', parentHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', actor: 'Thai ETDA Auditor', type: 'ETDA_SEC9_ATTESTATION', chamber: 'CH-05', isKeyMilestone: true },
      { sealNumber: 6000, block: 849199, time: '11:59:59 ICT', hash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b', parentHash: '0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d', actor: 'Cryo Warden', type: 'EPOCH_02_CHECKPOINT', chamber: 'CH-10', isKeyMilestone: true },
    ],
  },
  {
    epochId: 'EPOCH-03',
    epochName: '18-Chamber Distributed Consensus & HSM Deca-Quorum',
    epochNameTh: 'ฉันทามติ 18 ห้องปฏิบัติการและองค์ประชุมเครื่องเหล็ก 10 ตู้',
    startSeal: 6001,
    endSeal: 10000,
    blockHeight: 849200,
    blockRange: '#849200',
    timestamp: '2026-09-08 12:00:00 ICT',
    merkleLeafRoot: '0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    pqcAlgorithm: 'FIPS 140-3 Level 4 Hardware HSM Attestation',
    custodianLeader: 'Council of 10 Thai Custodians (TC-01 – TC-10)',
    status: 'CANONICAL_VERIFIED',
    description: 'Full 10/10 physical HSM custodian quorum integration, FIPS 140-3 Level 4 hardware token signing, and 18-chamber inter-process binding.',
    keyEvents: [
      '10/10 Physical HSM Custodian Quorum Achieved',
      'Chambers 00 through 17 full mesh cross-verification',
      'Smart Contract Core V2 deployed with 42 deduplication rules',
    ],
    colorTheme: 'indigo',
    samples: [
      { sealNumber: 6001, block: 849200, time: '12:00:01 ICT', hash: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e', parentHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b', actor: 'HSM Controller TC-01', type: 'HSM_QUORUM_OPEN', chamber: 'CH-03', isKeyMilestone: true },
      { sealNumber: 8000, block: 849200, time: '14:45:00 ICT', hash: '0x6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d', parentHash: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e', actor: 'CyberDome Shield', type: 'CYBERDOME_100PCT_PASS', chamber: 'CH-06' },
      { sealNumber: 10000, block: 849200, time: '17:59:59 ICT', hash: '0x4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e', parentHash: '0x6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d', actor: 'Consensus Arbiter', type: 'EPOCH_03_CHECKPOINT', chamber: 'CH-17', isKeyMilestone: true },
    ],
  },
  {
    epochId: 'EPOCH-04',
    epochName: 'RWA Asset Orbital Mesh & Ω601–Ω1000 Platform Boundary',
    epochNameTh: 'โครงข่ายสินทรัพย์จริงและขอบเขตแพลตฟอร์ม Ω601–Ω1000',
    startSeal: 10001,
    endSeal: 14000,
    blockHeight: 849201,
    blockRange: '#849201',
    timestamp: '2026-09-08 18:00:00 ICT',
    merkleLeafRoot: '0x1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
    pqcAlgorithm: 'NIST PQC ML-DSA-87 + Smart Lease Automation',
    custodianLeader: 'Digital Twin Governor & Robotics Swarm Director',
    status: 'CANONICAL_VERIFIED',
    description: '400 RWA smart lease agreements bound (Ω601 through Ω1000), AgriSwarm autonomous drone validation, and PDPA compliance proofing.',
    keyEvents: [
      '400 Real-World Asset (RWA) Lease Contracts Bound',
      '4,200,000 AgriSwarm Autonomy Units Synchronized',
      'PDPA Sections 9, 26, 28 zero-leak compliance audit passed',
    ],
    colorTheme: 'amber',
    samples: [
      { sealNumber: 10001, block: 849201, time: '18:00:01 ICT', hash: '0x3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c', parentHash: '0x4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e', actor: 'RWA Vault Warden', type: 'RWA_OMEGA601_START', chamber: 'CH-04', isKeyMilestone: true },
      { sealNumber: 12000, block: 849201, time: '20:30:15 ICT', hash: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b', parentHash: '0x3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c', actor: 'AgriSwarm Controller', type: 'SWARM_4200K_UNITS_SEAL', chamber: 'CH-13' },
      { sealNumber: 14000, block: 849201, time: '23:59:59 ICT', hash: '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d', parentHash: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b', actor: 'RWA Gatekeeper', type: 'RWA_OMEGA1000_FINAL', chamber: 'CH-04', isKeyMilestone: true },
    ],
  },
  {
    epochId: 'EPOCH-05',
    epochName: 'Apex Canonical Finality & LTS Frozen Gate (Seal #14,902)',
    epochNameTh: 'สัตยาบันสูงสุดสัจธรรมและประตูปิดผนึกถาวร LTS (#14,902)',
    startSeal: 14001,
    endSeal: 14902,
    blockHeight: 849202,
    blockRange: '#849202',
    timestamp: '2026-09-09 00:00:00 ICT',
    merkleLeafRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcAlgorithm: 'Full NIST FIPS 203/204/205 Post-Quantum Cryptographic Suite',
    custodianLeader: 'Supreme Sovereign Architect (#EP-SOVEREIGN-01)',
    status: 'FINAL_FROZEN',
    description: 'Final canonical seal #14,902 applied at Block #849202. Write authority permanently denied. Baseline frozen as LTS v1.2 with Zero Drift Δ0.0%.',
    keyEvents: [
      'Canonical Block #849202 sealed with Root Hash 909ab814...a4c68',
      '14,902 verified seals locked in immutable cold storage',
      'Dossier certified for Thai & International Court Admissibility',
    ],
    colorTheme: 'cyan',
    samples: [
      { sealNumber: 14001, block: 849202, time: '00:00:01 ICT', hash: '0x8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c', parentHash: '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d', actor: 'Apex Command Node', type: 'APEX_FINALIZATION_START', chamber: 'CH-17' },
      { sealNumber: 14500, block: 849202, time: '02:30:00 ICT', hash: '0x2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b', parentHash: '0x8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c', actor: 'Court Evidence Hub', type: 'DOSSIER_CERTIFICATION', chamber: 'CH-08', isKeyMilestone: true },
      { sealNumber: 14902, block: 849202, time: '06:00:00 ICT', hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', parentHash: '0x2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b', actor: 'Supreme Sovereign Architect', type: 'CANONICAL_FINAL_SEAL_14902', chamber: 'CH-00', isKeyMilestone: true },
    ],
  },
  {
    epochId: 'EPOCH-QUARANTINE',
    epochName: 'Forensic Quarantine Layer (Ring-04 Isolated Buffer)',
    epochNameTh: 'ชั้นกักกันเชิงนิติวิทยาศาสตร์ (เขตกันชนนิรภัย Ring-04)',
    startSeal: 14903,
    endSeal: 14907,
    blockHeight: 849203,
    blockRange: 'ISOLATED-BUFFER',
    timestamp: '2026-09-09 00:00:01 ICT',
    merkleLeafRoot: '0xQUARANTINE_ISOLATED_RING04_80_FILES_ZERO_LEAK_CONFIRMED',
    pqcAlgorithm: 'Air-Gapped Cold Quarantine Firewall G11-G13',
    custodianLeader: 'Forensic Quarantine Guard (Chamber 02)',
    status: 'QUARANTINE_ISOLATED',
    description: '5 unverified mutation attempts (#14,903–#14,907) instantly quarantined in Ring-04 buffer. Zero leak into canonical core (80 raw artifacts isolated).',
    keyEvents: [
      '5 non-canonical transactions intercepted by fail-closed gate',
      'Quarantine buffer isolation confirmed at 85.0°C thermal boundary',
      'Canonical 14,902 seals preserved with 100% Zero Drift',
    ],
    colorTheme: 'rose',
    samples: [
      { sealNumber: 14903, block: 849203, time: '00:00:01 ICT', hash: '0xEE019A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B9C8D7E6F5A4B3C2D1E0F', parentHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', actor: 'Quarantine Firewall', type: 'QUARANTINE_TRAP_01', chamber: 'CH-02', isKeyMilestone: true },
      { sealNumber: 14907, block: 849203, time: '00:00:05 ICT', hash: '0xEE054F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B7A6F5E4D3C2B1A0F9E8D7C6B5A', parentHash: '0xEE019A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B9C8D7E6F5A4B3C2D1E0F', actor: 'Quarantine Firewall', type: 'QUARANTINE_TRAP_05_ISOLATED', chamber: 'CH-02', isKeyMilestone: true },
    ],
  },
];

export const CANONICAL_DAILY_MILESTONES: DailyMilestone[] = [
  {
    dayId: 'DAY-01',
    dayLabel: 'Day 1: Genesis Seed & Entropy Calibration',
    dayLabelTh: 'วันที่ 1: ปฐมกาลเพาะเมล็ดสัจธรรมและเทียบวัดเอนโทรปี',
    date: '2026-09-05',
    blockRange: 'Block #849198',
    sealCount: 2500,
    startSeal: 1,
    endSeal: 2500,
    cumulativeTotal: 2500,
    activeChambers: ['CH-00', 'CH-01', 'CH-10'],
    merkleCheckpointHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcAlgorithm: 'ML-DSA-87 / Kyber-1024',
    leadAuditor: 'Supreme Architect (#EP-SOVEREIGN-01)',
    summary: 'Seeding of Genesis Merkle tree, zero-state hardware calibration, and cold storage initial lock.',
    hourlyWindowsCount: 24,
    colorTheme: 'cyan',
    samples: [
      { sealNumber: 1, block: 849198, time: '00:00:01 ICT', hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', parentHash: '0x0000000000000000', actor: 'Genesis Node', type: 'GENESIS_BOOT', chamber: 'CH-00', isKeyMilestone: true },
      { sealNumber: 1500, block: 849198, time: '14:20:00 ICT', hash: '0x4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b', parentHash: '0x909ab814479844d8', actor: 'Cryo Tech', type: 'SUBKELVIN_LOCK', chamber: 'CH-10' },
      { sealNumber: 2500, block: 849198, time: '23:59:59 ICT', hash: '0x5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d', parentHash: '0x4a5b6c7d8e9f0a1b', actor: 'Audit Core', type: 'DAY_1_CHECKPOINT', chamber: 'CH-01', isKeyMilestone: true },
    ],
  },
  {
    dayId: 'DAY-02',
    dayLabel: 'Day 2: Invariant Binding & Truth Matrix Enforcement',
    dayLabelTh: 'วันที่ 2: ตรึงกฎเหล็กสัจธรรมและบังคับใช้เมทริกซ์ความจริง',
    date: '2026-09-06',
    blockRange: 'Block #849199',
    sealCount: 3500,
    startSeal: 2501,
    endSeal: 6000,
    cumulativeTotal: 6000,
    activeChambers: ['CH-01', 'CH-05', 'CH-06', 'CH-14'],
    merkleCheckpointHash: '0x8b4c2d9a1f7e3058a9c2d1b8e7f9a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    pqcAlgorithm: 'ML-DSA-87 + SLH-DSA',
    leadAuditor: 'SSoT Sentinel & ETDA Compliance Envoy',
    summary: 'Binding 10 core invariants, locking Mutation Authority to 0, and statutory safe-harbor mapping.',
    hourlyWindowsCount: 24,
    colorTheme: 'emerald',
    samples: [
      { sealNumber: 3000, block: 849199, time: '04:15:00 ICT', hash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c', parentHash: '0x5e4d3c2b1a0f9e8d', actor: 'SSoT Node', type: 'INVARIANT_BIND_01', chamber: 'CH-01' },
      { sealNumber: 4800, block: 849199, time: '16:40:00 ICT', hash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b', parentHash: '0x1b2c3d4e5f6a7b8c', actor: 'ETDA Envoy', type: 'SEC26_PRESUMPTION', chamber: 'CH-05', isKeyMilestone: true },
      { sealNumber: 6000, block: 849199, time: '23:59:59 ICT', hash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b', parentHash: '0x7a8b9c0d1e2f3a4b', actor: 'Audit Core', type: 'DAY_2_CHECKPOINT', chamber: 'CH-14', isKeyMilestone: true },
    ],
  },
  {
    dayId: 'DAY-03',
    dayLabel: 'Day 3: HSM Deca-Quorum & 18-Chamber Consensus Mesh',
    dayLabelTh: 'วันที่ 3: องค์ประชุม HSM 10 เครื่องและโครงข่ายฉันทามติ 18 ห้อง',
    date: '2026-09-07',
    blockRange: 'Block #849200',
    sealCount: 4000,
    startSeal: 6001,
    endSeal: 10000,
    cumulativeTotal: 10000,
    activeChambers: ['CH-03', 'CH-04', 'CH-06', 'CH-07', 'CH-17'],
    merkleCheckpointHash: '0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    pqcAlgorithm: 'FIPS 140-3 L4 Physical HSM',
    leadAuditor: 'Council of 10 Custodians (TC-01 – TC-10)',
    summary: 'Hardware token cryptographic attestation across 10 physical HSMs and 18-chamber full mesh execution.',
    hourlyWindowsCount: 24,
    colorTheme: 'indigo',
    samples: [
      { sealNumber: 7200, block: 849200, time: '08:00:00 ICT', hash: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e', parentHash: '0x9a8b7c6d5e4f3a2b', actor: 'HSM Lead TC-01', type: 'HSM_DECQUORUM_SYNC', chamber: 'CH-03', isKeyMilestone: true },
      { sealNumber: 9100, block: 849200, time: '18:15:30 ICT', hash: '0x6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b', parentHash: '0x3d4e5f6a7b8c9d0e', actor: 'Dyson Fusion', type: 'FUSION_250GW_SEAL', chamber: 'CH-07' },
      { sealNumber: 10000, block: 849200, time: '23:59:59 ICT', hash: '0x4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e', parentHash: '0x6a7b8c9d0e1f2a3b', actor: 'Audit Core', type: 'DAY_3_CHECKPOINT', chamber: 'CH-17', isKeyMilestone: true },
    ],
  },
  {
    dayId: 'DAY-04',
    dayLabel: 'Day 4: RWA Platform Boundary & Robotics Swarm Integration',
    dayLabelTh: 'วันที่ 4: ขอบเขตแพลตฟอร์มสินทรัพย์จริงและโครงข่ายหุ่นยนต์เกษตร',
    date: '2026-09-08',
    blockRange: 'Block #849201',
    sealCount: 4000,
    startSeal: 10001,
    endSeal: 14000,
    cumulativeTotal: 14000,
    activeChambers: ['CH-04', 'CH-08', 'CH-12', 'CH-13', 'CH-15'],
    merkleCheckpointHash: '0x1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
    pqcAlgorithm: 'ML-DSA-87 + Smart Lease Automation',
    leadAuditor: 'RWA Asset Governor & AgriSwarm Director',
    summary: 'Binding 400 RWA smart contracts (Ω601–Ω1000), 4.2M AgriSwarm units, and ZK-proof validation.',
    hourlyWindowsCount: 24,
    colorTheme: 'amber',
    samples: [
      { sealNumber: 11000, block: 849201, time: '06:30:00 ICT', hash: '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d', parentHash: '0x4f3e2d1c0b9a8f7e', actor: 'RWA Vault', type: 'RWA_LEASE_EXPANSION', chamber: 'CH-04' },
      { sealNumber: 12800, block: 849201, time: '15:20:00 ICT', hash: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', parentHash: '0x2c3d4e5f6a7b8c9d', actor: 'Swarm Director', type: 'SWARM_FLEET_SEAL', chamber: 'CH-13', isKeyMilestone: true },
      { sealNumber: 14000, block: 849201, time: '23:59:59 ICT', hash: '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d', parentHash: '0x5c6d7e8f9a0b1c2d', actor: 'Audit Core', type: 'DAY_4_CHECKPOINT', chamber: 'CH-08', isKeyMilestone: true },
    ],
  },
  {
    dayId: 'DAY-05',
    dayLabel: 'Day 5: Apex Finality Seal #14,902 & LTS Frozen Anchor',
    dayLabelTh: 'วันที่ 5: สัตยาบันสูงสุดปิดผนึกซีล #14,902 และการแช่แข็งถาวร LTS',
    date: '2026-09-09',
    blockRange: 'Block #849202',
    sealCount: 902,
    startSeal: 14001,
    endSeal: 14902,
    cumulativeTotal: 14902,
    activeChambers: ['CH-00', 'CH-01', 'CH-02', 'CH-08', 'CH-16', 'CH-17'],
    merkleCheckpointHash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcAlgorithm: 'Full NIST FIPS 203/204/205 PQC Suite',
    leadAuditor: 'Supreme Sovereign Architect (#EP-SOVEREIGN-01)',
    summary: 'Final canonical seal #14,902 locked at Block #849202 with Zero Drift Δ0.0%. Ring-04 quarantine isolation active.',
    hourlyWindowsCount: 6,
    colorTheme: 'cyan',
    samples: [
      { sealNumber: 14200, block: 849202, time: '01:00:00 ICT', hash: '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b', parentHash: '0x7e6d5c4b3a2f1e0d', actor: 'Apex Command', type: 'APEX_PREPARATION', chamber: 'CH-17' },
      { sealNumber: 14650, block: 849202, time: '03:45:00 ICT', hash: '0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a', parentHash: '0x8a9b0c1d2e3f4a5b', actor: 'Court Evidence', type: 'DOSSIER_ATTESTATION', chamber: 'CH-08', isKeyMilestone: true },
      { sealNumber: 14902, block: 849202, time: '06:00:00 ICT', hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', parentHash: '0x3f4a5b6c7d8e9f0a', actor: 'Supreme Architect', type: 'CANONICAL_FINAL_SEAL', chamber: 'CH-00', isKeyMilestone: true },
    ],
  },
];

export const CANONICAL_HOURLY_MILESTONES: HourlyMilestone[] = [
  {
    hourId: 'HR-01',
    timeLabel: '00:00 – 03:00 ICT',
    date: '2026-09-08',
    blockHeight: 849198,
    sealRange: '#00001 – #01250',
    startSeal: 1,
    endSeal: 1250,
    sealBatchSize: 1250,
    throughputPerSec: 115.7,
    avgChamberLatencyMs: 8.6,
    leadChamber: 'CH-00 (Root Kernel)',
    merkleLeafSample: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcSignatureSample: '0x5a13396c849198909ab814479844d8...',
    status: 'VERIFIED_FINAL',
    description: 'Genesis origin cold-boot, entropy calibration, and initialization of the first 1,250 kernel leaves.',
    colorTheme: 'cyan',
    samples: [
      { sealNumber: 1, block: 849198, time: '00:00:01 ICT', hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', parentHash: '0x0000000000000000', actor: 'Genesis Custodian #01', type: 'GENESIS_ROOT_INIT', chamber: 'CH-00', isKeyMilestone: true },
      { sealNumber: 625, block: 849198, time: '01:30:00 ICT', hash: '0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c', parentHash: '0x909ab814479844d8', actor: 'Kernel Guard', type: 'SUBKERNEL_SYNC', chamber: 'CH-00' },
      { sealNumber: 1250, block: 849198, time: '02:59:59 ICT', hash: '0x8f2a1b9c4d7e0f2156b89c3d4e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', parentHash: '0x4b5c6d7e8f9a0b1c', actor: 'Cryo Core', type: 'CRYO_NEBULA_SEAL', chamber: 'CH-10', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-02',
    timeLabel: '03:00 – 06:00 ICT',
    date: '2026-09-08',
    blockHeight: 849198,
    sealRange: '#01251 – #02500',
    startSeal: 1251,
    endSeal: 2500,
    sealBatchSize: 1250,
    throughputPerSec: 115.7,
    avgChamberLatencyMs: 9.1,
    leadChamber: 'CH-01 (Merkle SSoT)',
    merkleLeafSample: '0x5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d',
    pqcSignatureSample: '0x7b24487d8491985e4d3c2b1a0f9e8d...',
    status: 'VERIFIED_FINAL',
    description: 'Completion of Epoch 1, sealing invariant checkpoints, and zero-drift verification.',
    colorTheme: 'cyan',
    samples: [
      { sealNumber: 1800, block: 849198, time: '04:15:20 ICT', hash: '0x6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d', parentHash: '0x8f2a1b9c4d7e0f21', actor: 'SSoT Guard', type: 'LEAF_CHAIN_SYNC', chamber: 'CH-01' },
      { sealNumber: 2500, block: 849198, time: '05:59:59 ICT', hash: '0x5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d', parentHash: '0x6c7d8e9f0a1b2c3d', actor: 'Supreme Architect', type: 'EPOCH_01_CLOSE', chamber: 'CH-00', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-03',
    timeLabel: '06:00 – 09:00 ICT',
    date: '2026-09-08',
    blockHeight: 849199,
    sealRange: '#02501 – #04250',
    startSeal: 2501,
    endSeal: 4250,
    sealBatchSize: 1750,
    throughputPerSec: 162.0,
    avgChamberLatencyMs: 7.8,
    leadChamber: 'CH-05 (PDPA Enclave)',
    merkleLeafSample: '0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    pqcSignatureSample: '0x9c35598e8491997c8d9e0f1a2b3c4d...',
    status: 'VERIFIED_FINAL',
    description: 'Thai Legal Compliance integration, PDPA Sections 9/26/28 verification, and ETDA safe harbor binding.',
    colorTheme: 'emerald',
    samples: [
      { sealNumber: 3100, block: 849199, time: '07:10:00 ICT', hash: '0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b', parentHash: '0x5e4d3c2b1a0f9e8d', actor: 'PDPA Guardian', type: 'PDPA_PRIVACY_SEAL', chamber: 'CH-05' },
      { sealNumber: 4200, block: 849199, time: '08:50:00 ICT', hash: '0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d', parentHash: '0x2a3b4c5d6e7f8a9b', actor: 'ETDA Auditor', type: 'ETDA_SEC9_ATTESTATION', chamber: 'CH-05', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-04',
    timeLabel: '09:00 – 12:00 ICT',
    date: '2026-09-08',
    blockHeight: 849199,
    sealRange: '#04251 – #06000',
    startSeal: 4251,
    endSeal: 6000,
    sealBatchSize: 1750,
    throughputPerSec: 162.0,
    avgChamberLatencyMs: 8.2,
    leadChamber: 'CH-06 (CyberDome Shield)',
    merkleLeafSample: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    pqcSignatureSample: '0x1d46609f8491999a8b7c6d5e4f3a2b...',
    status: 'VERIFIED_FINAL',
    description: 'CyberDome active perimeter shield validation, 10/10 invariant coherence check, and sub-Kelvin lock.',
    colorTheme: 'emerald',
    samples: [
      { sealNumber: 5100, block: 849199, time: '10:25:00 ICT', hash: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c', parentHash: '0x7c8d9e0f1a2b3c4d', actor: 'Cyber Sentinel', type: 'CYBERDOME_SHIELD_UP', chamber: 'CH-06' },
      { sealNumber: 6000, block: 849199, time: '11:59:59 ICT', hash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b', parentHash: '0x8b9c0d1e2f3a4b5c', actor: 'Cryo Warden', type: 'EPOCH_02_CLOSE', chamber: 'CH-10', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-05',
    timeLabel: '12:00 – 15:00 ICT',
    date: '2026-09-08',
    blockHeight: 849200,
    sealRange: '#06001 – #08000',
    startSeal: 6001,
    endSeal: 8000,
    sealBatchSize: 2000,
    throughputPerSec: 185.1,
    avgChamberLatencyMs: 6.9,
    leadChamber: 'CH-03 (HSM Deca-Vault)',
    merkleLeafSample: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    pqcSignatureSample: '0x3e57710a8492002d3e4f5a6b7c8d9e...',
    status: 'VERIFIED_FINAL',
    description: '10/10 Physical HSM custodian quorum validation with FIPS 140-3 Level 4 hardware signatures.',
    colorTheme: 'indigo',
    samples: [
      { sealNumber: 6001, block: 849200, time: '12:00:01 ICT', hash: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e', parentHash: '0x9a8b7c6d5e4f3a2b', actor: 'HSM Lead TC-01', type: 'HSM_QUORUM_OPEN', chamber: 'CH-03', isKeyMilestone: true },
      { sealNumber: 8000, block: 849200, time: '14:45:00 ICT', hash: '0x6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d', parentHash: '0x2d3e4f5a6b7c8d9e', actor: 'Cyber Shield', type: 'CYBERDOME_100PCT_PASS', chamber: 'CH-06', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-06',
    timeLabel: '15:00 – 18:00 ICT',
    date: '2026-09-08',
    blockHeight: 849200,
    sealRange: '#08001 – #10000',
    startSeal: 8001,
    endSeal: 10000,
    sealBatchSize: 2000,
    throughputPerSec: 185.1,
    avgChamberLatencyMs: 7.2,
    leadChamber: 'CH-07 (Dyson Fusion Grid)',
    merkleLeafSample: '0x4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e',
    pqcSignatureSample: '0x5f68821b8492004f3e2d1c0b9a8f7e...',
    status: 'VERIFIED_FINAL',
    description: '18-chamber full cross-verification mesh and Smart Contract Core V2 deployment.',
    colorTheme: 'indigo',
    samples: [
      { sealNumber: 9000, block: 849200, time: '16:30:00 ICT', hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', parentHash: '0x6e5d4c3b2a1f0e9d', actor: 'Dyson Fusion', type: 'POWER_250GW_SEAL', chamber: 'CH-07' },
      { sealNumber: 10000, block: 849200, time: '17:59:59 ICT', hash: '0x4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e', parentHash: '0x3c4d5e6f7a8b9c0d', actor: 'Consensus Arbiter', type: 'EPOCH_03_CLOSE', chamber: 'CH-17', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-07',
    timeLabel: '18:00 – 21:00 ICT',
    date: '2026-09-08',
    blockHeight: 849201,
    sealRange: '#10001 – #12000',
    startSeal: 10001,
    endSeal: 12000,
    sealBatchSize: 2000,
    throughputPerSec: 185.1,
    avgChamberLatencyMs: 6.5,
    leadChamber: 'CH-04 (Smart Contract V2)',
    merkleLeafSample: '0x3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c',
    pqcSignatureSample: '0x7a79932c8492013b2c1d0e9f8a7b6c...',
    status: 'VERIFIED_FINAL',
    description: 'Binding first 200 Real-World Asset (RWA) lease agreements across Ω601 through Ω800.',
    colorTheme: 'amber',
    samples: [
      { sealNumber: 10001, block: 849201, time: '18:00:01 ICT', hash: '0x3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c', parentHash: '0x4f3e2d1c0b9a8f7e', actor: 'RWA Vault', type: 'RWA_OMEGA601_START', chamber: 'CH-04', isKeyMilestone: true },
      { sealNumber: 12000, block: 849201, time: '20:55:00 ICT', hash: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b', parentHash: '0x3b2c1d0e9f8a7b6c', actor: 'Swarm Guard', type: 'SWARM_FLEET_SYNC', chamber: 'CH-13', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-08',
    timeLabel: '21:00 – 23:59 ICT',
    date: '2026-09-08',
    blockHeight: 849201,
    sealRange: '#12001 – #14000',
    startSeal: 12001,
    endSeal: 14000,
    sealBatchSize: 2000,
    throughputPerSec: 185.1,
    avgChamberLatencyMs: 6.8,
    leadChamber: 'CH-13 (AgriSwarm Autonomy)',
    merkleLeafSample: '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d',
    pqcSignatureSample: '0x9b8aa43d8492017e6d5c4b3a2f1e0d...',
    status: 'VERIFIED_FINAL',
    description: 'Completion of 4.2M AgriSwarm drone validations and Ω1000 platform boundary closure.',
    colorTheme: 'amber',
    samples: [
      { sealNumber: 13000, block: 849201, time: '22:15:00 ICT', hash: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d', parentHash: '0x5a4b3c2d1e0f9a8b', actor: 'Drone Controller', type: 'AUTONOMY_CLUSTER_SEAL', chamber: 'CH-13' },
      { sealNumber: 14000, block: 849201, time: '23:59:59 ICT', hash: '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d', parentHash: '0x4c5d6e7f8a9b0c1d', actor: 'RWA Gatekeeper', type: 'EPOCH_04_CLOSE', chamber: 'CH-04', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-09',
    timeLabel: '00:00 – 06:00 ICT',
    date: '2026-09-09',
    blockHeight: 849202,
    sealRange: '#14001 – #14902',
    startSeal: 14001,
    endSeal: 14902,
    sealBatchSize: 902,
    throughputPerSec: 41.7,
    avgChamberLatencyMs: 4.8,
    leadChamber: 'CH-00 / CH-17 (Apex Finality)',
    merkleLeafSample: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcSignatureSample: '0x5a13396c849202909ab814479844d8...',
    status: 'VERIFIED_FINAL',
    description: 'Final canonical seal #14,902 applied at Block #849202. Sovereign LTS baseline frozen with zero drift.',
    colorTheme: 'cyan',
    samples: [
      { sealNumber: 14500, block: 849202, time: '02:30:00 ICT', hash: '0x2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b', parentHash: '0x7e6d5c4b3a2f1e0d', actor: 'Court Hub', type: 'DOSSIER_CERTIFICATION', chamber: 'CH-08', isKeyMilestone: true },
      { sealNumber: 14902, block: 849202, time: '06:00:00 ICT', hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', parentHash: '0x2a1b0c9d8e7f6a5b', actor: 'Supreme Sovereign Architect', type: 'CANONICAL_FINAL_SEAL', chamber: 'CH-00', isKeyMilestone: true },
    ],
  },
  {
    hourId: 'HR-10',
    timeLabel: '06:00+ ICT (Ring-04 Buffer)',
    date: '2026-09-09',
    blockHeight: 849203,
    sealRange: '#14903 – #14907',
    startSeal: 14903,
    endSeal: 14907,
    sealBatchSize: 5,
    throughputPerSec: 0.8,
    avgChamberLatencyMs: 0.2,
    leadChamber: 'CH-02 (Quarantine Buffer)',
    merkleLeafSample: '0xQUARANTINE_ISOLATED_RING04_80_FILES_ZERO_LEAK',
    pqcSignatureSample: '0xFAIL_CLOSED_INTERCEPT_GATE_G11_G13...',
    status: 'QUARANTINE_ISOLATED',
    description: '5 unauthorized mutation attempts quarantined in Ring-04 buffer at 85.0°C thermal threshold.',
    colorTheme: 'rose',
    samples: [
      { sealNumber: 14903, block: 849203, time: '06:00:01 ICT', hash: '0xEE019A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B9C8D7E6F5A4B3C2D1E0F', parentHash: '0x909ab814479844d8', actor: 'Quarantine Firewall', type: 'QUARANTINE_TRAP_01', chamber: 'CH-02', isKeyMilestone: true },
      { sealNumber: 14907, block: 849203, time: '06:00:05 ICT', hash: '0xEE054F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B7A6F5E4D3C2B1A0F9E8D7C6B5A', parentHash: '0xEE019A8B7C6D5E4F', actor: 'Quarantine Firewall', type: 'QUARANTINE_TRAP_05_ISOLATED', chamber: 'CH-02', isKeyMilestone: true },
    ],
  },
];

export interface CanonicalSealsVerticalTimelineProps {
  initialZoomMode?: ZoomMode;
  externalZoomMode?: ZoomMode;
  onZoomModeChange?: (mode: ZoomMode) => void;
}

export const CanonicalSealsVerticalTimeline: React.FC<CanonicalSealsVerticalTimelineProps> = ({
  initialZoomMode = 'epoch',
  externalZoomMode,
  onZoomModeChange,
}) => {
  const [internalZoomMode, setInternalZoomMode] = useState<ZoomMode>(initialZoomMode);
  
  const zoomMode = externalZoomMode ?? internalZoomMode;
  const setZoomMode = (mode: ZoomMode) => {
    setInternalZoomMode(mode);
    onZoomModeChange?.(mode);
  };
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'EPOCH-05': true,
    'EPOCH-01': true,
    'DAY-05': true,
    'DAY-01': true,
    'HR-09': true,
    'HR-01': true,
  });
  const [selectedSealSample, setSelectedSealSample] = useState<{
    sealNumber: number;
    block: number;
    time?: string;
    hash: string;
    parentHash: string;
    actor: string;
    type: string;
    chamber: string;
    originContext: string;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Zoom slider integer mapping: 1 = epoch, 2 = daily, 3 = hourly
  const zoomLevelNumber = useMemo(() => {
    if (zoomMode === 'epoch') return 1;
    if (zoomMode === 'daily') return 2;
    return 3;
  }, [zoomMode]);

  const handleZoomSliderChange = (newVal: number) => {
    playTone(480 + newVal * 60, 0.04);
    if (newVal === 1) setZoomMode('epoch');
    else if (newVal === 2) setZoomMode('daily');
    else setZoomMode('hourly');
  };

  const toggleItem = (id: string) => {
    playTone(560, 0.04);
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (key: string, value: string) => {
    copyToClipboard(value);
    setCopiedText(key);
    playTone(720, 0.05);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleExportJson = () => {
    playAuditChime();
    const filename = exportCourtReadyJsonAuditTrail();
    setExportToast(`JSON Audit Trail Exported: ${filename}`);
    setTimeout(() => setExportToast(null), 5000);
  };

  const handleExportPdf = () => {
    playAuditChime();
    const filename = exportCourtReadySignedPdfDossier();
    setExportToast(`Court-Ready Signed PDF Dossier Downloaded: ${filename}`);
    setTimeout(() => setExportToast(null), 5000);
  };

  // Filtered lists for each zoom level
  const filteredEpochs = useMemo(() => {
    if (!searchQuery.trim()) return CANONICAL_EPOCH_MILESTONES;
    const q = searchQuery.toLowerCase();
    return CANONICAL_EPOCH_MILESTONES.filter(
      (item) =>
        item.epochName.toLowerCase().includes(q) ||
        item.epochNameTh.toLowerCase().includes(q) ||
        item.epochId.toLowerCase().includes(q) ||
        item.blockRange.toLowerCase().includes(q) ||
        item.pqcAlgorithm.toLowerCase().includes(q) ||
        item.custodianLeader.toLowerCase().includes(q) ||
        item.samples.some(
          (s) =>
            String(s.sealNumber).includes(q) ||
            s.hash.toLowerCase().includes(q) ||
            s.actor.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q) ||
            s.chamber.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

  const filteredDays = useMemo(() => {
    if (!searchQuery.trim()) return CANONICAL_DAILY_MILESTONES;
    const q = searchQuery.toLowerCase();
    return CANONICAL_DAILY_MILESTONES.filter(
      (item) =>
        item.dayLabel.toLowerCase().includes(q) ||
        item.dayLabelTh.toLowerCase().includes(q) ||
        item.dayId.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q) ||
        item.blockRange.toLowerCase().includes(q) ||
        item.leadAuditor.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.samples.some(
          (s) =>
            String(s.sealNumber).includes(q) ||
            s.hash.toLowerCase().includes(q) ||
            s.actor.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q) ||
            s.chamber.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

  const filteredHours = useMemo(() => {
    if (!searchQuery.trim()) return CANONICAL_HOURLY_MILESTONES;
    const q = searchQuery.toLowerCase();
    return CANONICAL_HOURLY_MILESTONES.filter(
      (item) =>
        item.hourId.toLowerCase().includes(q) ||
        item.timeLabel.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q) ||
        item.sealRange.toLowerCase().includes(q) ||
        item.leadChamber.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.samples.some(
          (s) =>
            String(s.sealNumber).includes(q) ||
            s.hash.toLowerCase().includes(q) ||
            s.actor.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q) ||
            s.chamber.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Controls & Court Dossier Export Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#070914]/95 via-[#0c1024]/90 to-[#070914]/95 border border-cyan-500/25 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                14,902 SEALS CHRONOLOGICAL TIMELINE
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                BLOCKS #849198 – #849202
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                COURT-READY DOSSIER EXPORT
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-white tracking-wide">
              Vertical Canonical Seal Progression &amp; Multi-Scale Block Timeline
            </h3>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              Complete chronological audit trail of all 14,902 verified seals, SSoT invariant bindings, and quarantine boundaries.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Standardized JSON Audit Trail Download Button */}
            <button
              onClick={handleExportJson}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-emerald-600/30 via-cyan-600/25 to-emerald-600/30 hover:from-emerald-500/40 hover:to-cyan-500/40 border border-emerald-400/50 text-emerald-100 hover:text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] text-xs"
              title="Download standardized JSON audit trail serializing full verification state, custodian quorum, and Merkle leaf proofs"
            >
              <FileCode className="w-4 h-4 text-emerald-300" />
              <span>Export JSON Audit Trail</span>
              <Download className="w-3.5 h-3.5 text-emerald-300" />
            </button>

            {/* Cryptographically Signed PDF Dossier Download Button */}
            <button
              onClick={handleExportPdf}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-600/35 via-yellow-600/25 to-amber-600/35 hover:from-amber-500/45 hover:to-yellow-500/45 border border-amber-400/60 text-amber-100 hover:text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] text-xs"
              title="Download court-ready dossier as a cryptographically signed PDF with NIST PQC digital signature block and Thai ETDA Sec 9/26/28 bindings"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Court-Ready PDF Dossier</span>
              <Download className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE TIMELINE ZOOM SLIDER COMPONENT */}
        <div className="mt-5 p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-white font-bold text-xs uppercase tracking-wider">
                Timeline Granularity Zoom Slider:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
                {zoomMode === 'epoch' && '1x: Epoch Macro View (5 Epochs + Quarantine)'}
                {zoomMode === 'daily' && '2x: Daily Aggregate View (5 Days / 24h Cycles)'}
                {zoomMode === 'hourly' && '3x: Hourly High-Resolution Stream (10 Batches)'}
              </span>
            </div>

            {/* Direct Toggle Buttons */}
            <div className="flex items-center gap-1.5 bg-[#0a0f1e] p-1 rounded-xl border border-cyan-500/20">
              <button
                onClick={() => handleZoomSliderChange(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  zoomMode === 'epoch'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Epoch</span>
              </button>
              <button
                onClick={() => handleZoomSliderChange(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  zoomMode === 'daily'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily</span>
              </button>
              <button
                onClick={() => handleZoomSliderChange(3)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  zoomMode === 'hourly'
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hourly</span>
              </button>
            </div>
          </div>

          {/* Range Slider Track */}
          <div className="space-y-1.5 pt-1">
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={zoomLevelNumber}
              onChange={(e) => handleZoomSliderChange(Number(e.target.value))}
              aria-label="Timeline Zoom Scale Slider"
              className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-300 font-mono">
              <span 
                onClick={() => handleZoomSliderChange(1)}
                className={`flex items-center gap-1.5 cursor-pointer font-bold transition-colors ${zoomMode === 'epoch' ? 'text-cyan-300' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${zoomMode === 'epoch' ? 'bg-cyan-400 ring-2 ring-cyan-400/30' : 'bg-zinc-700'}`} />
                Epoch View (Macro)
              </span>
              <span 
                onClick={() => handleZoomSliderChange(2)}
                className={`flex items-center gap-1.5 cursor-pointer font-bold transition-colors ${zoomMode === 'daily' ? 'text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${zoomMode === 'daily' ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-zinc-700'}`} />
                Daily View (Aggregate)
              </span>
              <span 
                onClick={() => handleZoomSliderChange(3)}
                className={`flex items-center gap-1.5 cursor-pointer font-bold transition-colors ${zoomMode === 'hourly' ? 'text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${zoomMode === 'hourly' ? 'bg-indigo-400 ring-2 ring-indigo-400/30' : 'bg-zinc-700'}`} />
                Hourly View (High-Res)
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter timeline by Seal # (e.g. 14902), Block, Hash, Chamber, Actor, Date or Time Window..."
              className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-cyan-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportToast && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-cyan-950/80 to-[#070914] border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{exportToast}</span>
          </div>
          <button
            onClick={() => setExportToast(null)}
            className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Block Progression Bar (Historical Visualizer) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#080b18]/90 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-[11px] font-bold flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            BLOCK PROGRESSION &amp; CANONICAL SEAL CAPACITY
          </span>
          <span className="text-emerald-400 font-bold text-xs">14,902 / 14,902 SEALS (100.0% SEALED &amp; FROZEN)</span>
        </div>
        <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 flex gap-1">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: '16.7%' }} title="Epoch 1: Block #849198 (2,500 Seals)" />
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: '23.5%' }} title="Epoch 2: Block #849199 (3,500 Seals)" />
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: '26.8%' }} title="Epoch 3: Block #849200 (4,000 Seals)" />
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all" style={{ width: '26.8%' }} title="Epoch 4: Block #849201 (4,000 Seals)" />
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse transition-all" style={{ width: '6.2%' }} title="Epoch 5: Block #849202 (902 Apex Final Seals)" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 font-mono">
          <span>Genesis Block #849198 (Seal #00001)</span>
          <span className="hidden sm:inline">Block #849200 (Seal #10000)</span>
          <span className="text-emerald-400 font-bold">Final Block #849202 (Seal #14902)</span>
        </div>
      </div>

      {/* DYNAMIC TIMELINE CONTENT BASED ON ZOOM MODE */}

      {/* MODE 1: EPOCH-BASED VIEW (1x) */}
      {zoomMode === 'epoch' && (
        <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-emerald-500 before:to-rose-500">
          {filteredEpochs.map((epoch) => {
            const isExpanded = expandedItems[epoch.epochId] ?? false;
            const isQuarantine = epoch.status === 'QUARANTINE_ISOLATED';
            const isApex = epoch.status === 'FINAL_FROZEN';

            return (
              <div key={epoch.epochId} className="relative group">
                {/* Timeline Node Icon Indicator */}
                <div
                  className={`absolute -left-6 sm:-left-10 top-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform group-hover:scale-110 z-10 ${
                    isQuarantine
                      ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-rose-950/50'
                      : isApex
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-cyan-950/50 animate-pulse'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-emerald-950/50'
                  }`}
                >
                  {isQuarantine ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  ) : isApex ? (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>

                {/* Epoch Card Container */}
                <div
                  className={`rounded-2xl border p-5 transition-all backdrop-blur-xl ${
                    isQuarantine
                      ? 'bg-gradient-to-br from-rose-950/40 via-[#0a0507]/90 to-rose-950/30 border-rose-500/40 hover:border-rose-400/60 shadow-[0_4px_30px_rgba(244,63,94,0.15)]'
                      : isApex
                      ? 'bg-gradient-to-br from-cyan-950/50 via-[#070b1a]/95 to-indigo-950/40 border-cyan-400/50 hover:border-cyan-300/70 shadow-[0_4px_35px_rgba(6,182,212,0.2)]'
                      : 'bg-gradient-to-br from-[#080c1d]/90 via-[#060914]/90 to-[#080c1d]/90 border-white/10 hover:border-cyan-500/40 shadow-lg'
                  }`}
                >
                  {/* Epoch Header Bar */}
                  <div
                    onClick={() => toggleItem(epoch.epochId)}
                    className="cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[11px] px-2.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10">
                          {epoch.epochId}
                        </span>
                        <span
                          className={`font-bold text-[11px] px-2.5 py-0.5 rounded border ${
                            isQuarantine
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isApex
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {epoch.blockRange}
                        </span>
                        <span className="font-bold text-[11px] text-zinc-400">
                          Seals #{epoch.startSeal.toLocaleString()} – #{epoch.endSeal.toLocaleString()}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                        <span>{epoch.epochName}</span>
                        <span className="text-xs text-zinc-400 font-normal hidden md:inline">({epoch.epochNameTh})</span>
                      </h4>
                      <p className="text-zinc-400 text-xs leading-relaxed">{epoch.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                        {epoch.timestamp.split(' ')[0]}
                      </span>
                      <button
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details & Seal Samples */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-white/10 space-y-4"
                      >
                        {/* Key Events Checklist */}
                        <div className="space-y-1.5 bg-black/40 p-3.5 rounded-xl border border-white/5">
                          <span className="text-[11px] font-bold text-zinc-400 tracking-wider">MILESTONE KEY INVARIANTS:</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                            {epoch.keyEvents.map((evt, eIdx) => (
                              <div key={eIdx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{evt}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cryptographic Proof Header */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-2">
                            <span className="text-zinc-400">PQC Suite:</span>
                            <span className="text-cyan-300 font-bold truncate">{epoch.pqcAlgorithm}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-2">
                            <span className="text-zinc-400">Custodian Leader:</span>
                            <span className="text-amber-300 font-bold truncate">{epoch.custodianLeader}</span>
                          </div>
                        </div>

                        {/* Chronological Seal Samples Stream */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-zinc-400 tracking-wider">
                            VERIFIED BLOCK SEALS STREAM ({epoch.samples.length} SAMPLES):
                          </span>
                          <div className="space-y-2">
                            {epoch.samples.map((seal) => (
                              <div
                                key={seal.sealNumber}
                                onClick={() =>
                                  setSelectedSealSample({
                                    ...seal,
                                    originContext: `${epoch.epochId} (${epoch.epochName})`,
                                  })
                                }
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                  seal.isKeyMilestone
                                    ? 'bg-cyan-950/30 border-cyan-500/40 hover:border-cyan-400 shadow-sm'
                                    : 'bg-black/40 border-white/5 hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      seal.isKeyMilestone
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-white/10 text-zinc-300'
                                    }`}
                                  >
                                    SEAL #{seal.sealNumber.toLocaleString()}
                                  </span>
                                  <span className="font-bold text-zinc-200 text-xs">{seal.type}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {seal.chamber}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 justify-between sm:justify-end">
                                  <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[160px] sm:max-w-[220px]">
                                    {seal.hash.slice(0, 18)}...{seal.hash.slice(-8)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(`seal-${seal.sealNumber}`, seal.hash);
                                    }}
                                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-300"
                                    title="Copy Seal Hash"
                                  >
                                    {copiedText === `seal-${seal.sealNumber}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: DAILY AGGREGATE VIEW (2x) */}
      {zoomMode === 'daily' && (
        <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-indigo-500">
          {filteredDays.map((day) => {
            const isExpanded = expandedItems[day.dayId] ?? false;

            return (
              <div key={day.dayId} className="relative group">
                <div className="absolute -left-6 sm:-left-10 top-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 bg-emerald-950 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-950/50 z-10">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#080c1d]/90 via-[#060914]/90 to-[#080c1d]/90 p-5 backdrop-blur-xl hover:border-emerald-500/40 transition-all">
                  <div
                    onClick={() => toggleItem(day.dayId)}
                    className="cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[11px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {day.dayId} • {day.date}
                        </span>
                        <span className="font-bold text-[11px] px-2.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10">
                          {day.blockRange}
                        </span>
                        <span className="font-bold text-[11px] text-cyan-300">
                          {day.sealCount.toLocaleString()} Seals Sealed ({day.cumulativeTotal.toLocaleString()} Cumulative)
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                        {day.dayLabel}
                      </h4>
                      <p className="text-zinc-400 text-xs leading-relaxed">{day.summary}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {day.activeChambers.map((ch) => (
                          <span key={ch} className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                            {ch}
                          </span>
                        ))}
                      </div>
                      <button
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-white/10 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-zinc-500 text-[10px] block">Day Merkle Checkpoint Hash:</span>
                            <span className="text-cyan-300 font-mono text-[11px] break-all">{day.merkleCheckpointHash}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-zinc-500 text-[10px] block">PQC Suite &amp; Lead Auditor:</span>
                            <span className="text-amber-300 font-bold block">{day.pqcAlgorithm}</span>
                            <span className="text-zinc-400 text-[10px]">{day.leadAuditor}</span>
                          </div>
                        </div>

                        {/* Seal Samples */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-zinc-400 tracking-wider">
                            DAY TRANSACTIONS SNAPSHOTS:
                          </span>
                          <div className="space-y-2">
                            {day.samples.map((seal) => (
                              <div
                                key={seal.sealNumber}
                                onClick={() =>
                                  setSelectedSealSample({
                                    ...seal,
                                    originContext: `${day.dayId} (${day.dayLabel})`,
                                  })
                                }
                                className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                                    SEAL #{seal.sealNumber.toLocaleString()}
                                  </span>
                                  <span className="text-zinc-400 text-[10px]">{seal.time}</span>
                                  <span className="font-bold text-zinc-200 text-xs">{seal.type}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                    {seal.chamber}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[200px]">
                                  {seal.hash.slice(0, 20)}...
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: HOURLY HIGH-RESOLUTION STREAM VIEW (3x) */}
      {zoomMode === 'hourly' && (
        <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-cyan-500 before:to-emerald-500">
          {filteredHours.map((hour) => {
            const isExpanded = expandedItems[hour.hourId] ?? false;
            const isQuarantine = hour.status === 'QUARANTINE_ISOLATED';

            return (
              <div key={hour.hourId} className="relative group">
                <div
                  className={`absolute -left-6 sm:-left-10 top-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 shadow-lg z-10 ${
                    isQuarantine
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : 'bg-indigo-950 border-indigo-400 text-indigo-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                </div>

                <div
                  className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
                    isQuarantine
                      ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400'
                      : 'bg-[#080c1d]/90 border-white/10 hover:border-indigo-500/40'
                  }`}
                >
                  <div
                    onClick={() => toggleItem(hour.hourId)}
                    className="cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[11px] px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {hour.hourId} • {hour.timeLabel}
                        </span>
                        <span className="font-bold text-[11px] px-2.5 py-0.5 rounded bg-white/10 text-zinc-300">
                          Block #{hour.blockHeight}
                        </span>
                        <span className="font-bold text-[11px] text-cyan-300">
                          Seals {hour.sealRange} ({hour.sealBatchSize.toLocaleString()} batch)
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                        {hour.description}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {hour.throughputPerSec} seals/s
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {hour.avgChamberLatencyMs}ms
                        </span>
                      </div>
                      <button
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-white/10 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-zinc-500 text-[10px] block">Lead Execution Chamber:</span>
                            <span className="text-emerald-300 font-bold">{hour.leadChamber}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-zinc-500 text-[10px] block">Leaf Merkle Proof Sample:</span>
                            <span className="text-cyan-300 font-mono text-[10px] truncate block">{hour.merkleLeafSample}</span>
                          </div>
                        </div>

                        {/* Granular Sample Seals */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-zinc-400 tracking-wider">
                            HOURLY GRANULAR TRANSACTIONS ({hour.samples.length} SAMPLES):
                          </span>
                          <div className="space-y-2">
                            {hour.samples.map((seal) => (
                              <div
                                key={seal.sealNumber}
                                onClick={() =>
                                  setSelectedSealSample({
                                    ...seal,
                                    originContext: `${hour.hourId} (${hour.timeLabel})`,
                                  })
                                }
                                className="p-3 rounded-xl bg-black/50 border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                                    SEAL #{seal.sealNumber.toLocaleString()}
                                  </span>
                                  <span className="text-zinc-400 text-[10px]">{seal.time}</span>
                                  <span className="font-bold text-zinc-200 text-xs">{seal.type}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                                    {seal.chamber}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[200px]">
                                  {seal.hash.slice(0, 22)}...
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Seal Inspector Drawer Modal */}
      <AnimatePresence>
        {selectedSealSample && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#080b18] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-base font-bold text-white">
                    Canonical Seal #{selectedSealSample.sealNumber.toLocaleString()} Inspector
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedSealSample(null)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-zinc-500 block">Block Height</span>
                    <span className="text-cyan-300 font-bold text-sm">#{selectedSealSample.block}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-zinc-500 block">Issuing Chamber</span>
                    <span className="text-emerald-300 font-bold text-sm">{selectedSealSample.chamber}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-zinc-500 block">Timestamp</span>
                    <span className="text-zinc-300 font-bold text-xs">{selectedSealSample.time || '00:00:00 ICT'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-zinc-500 text-[10px] block">Cryptographic Seal Hash (SHA-256 / Post-Quantum Lattice):</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white font-mono text-xs break-all">{selectedSealSample.hash}</span>
                    <button
                      onClick={() => handleCopy('inspector-hash', selectedSealSample.hash)}
                      className="p-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 shrink-0"
                    >
                      {copiedText === 'inspector-hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-zinc-500 text-[10px] block">Parent Predecessor Hash:</span>
                  <span className="text-zinc-300 font-mono text-xs break-all">{selectedSealSample.parentHash}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Inclusion Proof Confirmed in Genesis Root:</span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-300 break-all">{CANONICAL_MERKLE_ROOT}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={handleExportPdf}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold"
                >
                  Export in Court Dossier (PDF)
                </button>
                <button
                  onClick={() => setSelectedSealSample(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-bold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
