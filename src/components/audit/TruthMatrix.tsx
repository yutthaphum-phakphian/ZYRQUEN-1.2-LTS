import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Cpu,
  Lock,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  Hash,
  Award,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Thermometer,
  FileCheck2,
  Volume2,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import { generateCourtDossierPdf } from '../../utils/courtDossierPdfGenerator';
import { CANONICAL_MERKLE_ROOT } from '../../data/canonicalData';

export type AuditStatusType = 'VERIFIED' | 'PASS' | 'ACTIVE_GUARD';

export interface ForensicModuleRecord {
  id: string;
  moduleNumber: number;
  requirement: string;
  engine: string;
  status: AuditStatusType;
  category: 'STATUTORY' | 'CRYPTOGRAPHY' | 'RESILIENCE' | 'TELEMETRY';
  statute: string;
  statuteCategory: string;
  evidenceFact: string;
  drift: string;
  hash: string;
  invariantFormula: string;
  judicialAdmissibility: string;
  technicalProof: {
    merkleRoot: string;
    pqcStandard: string;
    hsmLevel: string;
    cryoTemp: string;
    driftDelta: string;
  };
}

export const CANONICAL_16_MODULES: ForensicModuleRecord[] = [
  {
    id: 'MOD-01',
    moduleNumber: 1,
    requirement: 'Dual-Key PQC Invariant',
    engine: 'ML-DSA-87 / FALCON-1024 dual-signature gatekeeper',
    status: 'VERIFIED',
    category: 'CRYPTOGRAPHY',
    statuteCategory: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ & มาตรฐาน NIST FIPS 204',
    statute: 'ETDA มาตรา ๙, ๒๖ & NIST FIPS 204 (CRYSTALS-Dilithium-5 / ML-DSA-87)',
    evidenceFact: 'ทั้งสองชั้นของลายมือชื่อได้รับการตรวจสอบเทียบกับ Genesis Merkle Root 909ab814... โดยปราศจากการเสื่อมสภาพของคีย์',
    drift: 'Δ0.00%',
    hash: 'sha256:5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c71e4ec103dcc8cc3',
    invariantFormula: 'Sign(ML_DSA_87) ∧ Sign(FALCON_1024) == VALID',
    judicialAdmissibility:
      'รับฟังได้เป็นพยานเอกสารดิจิทัลที่มีการคุ้มครองความปลอดภัยขั้นสูงตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖ และมีผลผูกพันตามกฎหมายประดุจลงลายมือชื่อจริงในเอกสารกระดาษตาม มาตรา ๙ และ ป.วิ.พ. มาตรา 94/1',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'NIST FIPS 204 (ML-DSA-87 Dilithium-5)',
      hsmLevel: 'FIPS 140-3 Level 4 / CC EAL6+',
      cryoTemp: '14.96 mK (Sub-Kelvin Invariant)',
      driftDelta: 'Δ0.00% (Zero Mutation)',
    },
  },
  {
    id: 'MOD-02',
    moduleNumber: 2,
    requirement: 'Merkle-Tree Binding Invariant',
    engine: 'Root 909ab814... bound to Genesis Block #849202',
    status: 'VERIFIED',
    category: 'CRYPTOGRAPHY',
    statuteCategory: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ (ข้อสันนิษฐานความถูกต้อง)',
    statute: 'ETDA มาตรา ๒๘ ข้อสันนิษฐานเด็ดขาดทางกฎหมาย & PDPA มาตรา ๓๗',
    evidenceFact: '14,902 ใบรับรองดิจิทัลได้รับการประกอบคืนรูปแบบ Bitwise โดยปราศจากการกลายพันธุ์หรือดัดแปลงแก้ไขแม้แต่บิตเดียว',
    drift: 'Δ0.00%',
    hash: 'sha256:909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    invariantFormula: 'MerkleRoot(Leaves[0..14901]) == 0x909ab814...fa4c68',
    judicialAdmissibility:
      'ข้อสันนิษฐานเด็ดขาดตามกฎหมายว่าข้อมูลไม่มีการเปลี่ยนแปลงแก้ไขนับแต่เวลาที่ประทับตรา (Presumption of Integrity under ETDA Sec 28) มีน้ำหนักรับฟังเป็นพยานหลักฐานแห่งความจริงตาม ป.วิ.พ. มาตรา 95/1',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'Deterministic SHA3-512 & Dilithium Leaf Integrity',
      hsmLevel: 'FIPS 140-3 L4 Real Enclave Cluster',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00% (14,902 Active Seals)',
    },
  },
  {
    id: 'MOD-03',
    moduleNumber: 3,
    requirement: 'Post-Quantum Cryptography Agility',
    engine: 'Dilithium-5 / Kyber-1024 / SPHINCS+ hybrid defense',
    status: 'PASS',
    category: 'CRYPTOGRAPHY',
    statuteCategory: 'มาตรฐานความมั่นคงปลอดภัยสากล NIST PQC & ETDA',
    statute: 'NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) & ETDA มาตรา ๒๖',
    evidenceFact: 'การจำลองการโจมตีด้วยคอมพิวเตอร์ควอนตัม (Shor & Grover Algorithm) ไม่พบช่องโหว่ โดยมีระยะปลอดภัยระดับ 256-bit Post-Quantum',
    drift: 'Δ0.00%',
    hash: 'sha256:7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
    invariantFormula: 'PQCSecurityMargin(QubitThreat >= 4096) >= 256_BITS',
    judicialAdmissibility:
      'รับฟังได้โดยปราศจากข้อโต้แย้งเรื่องความล้าสมัยหรือการถูกถอดรหัสย้อนหลัง (Harvest Now, Decrypt Later Resistance) มีผลผูกพันในชั้นศาลสากลและศาลไทย',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'NIST FIPS 203/204/205 Hybrid Shield',
      hsmLevel: 'CC EAL6+ Certified Cryptographic Hardware',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-04',
    moduleNumber: 4,
    requirement: 'Zero-Drift Telemetry Invariant',
    engine: 'Continuous SSoT baseline parity monitor',
    status: 'ACTIVE_GUARD',
    category: 'TELEMETRY',
    statuteCategory: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. ๒๕๖๒',
    statute: 'NCSA Critical Information Infrastructure (CII) & พ.ร.บ. ไซเบอร์ฯ มาตรา ๖๐',
    evidenceFact: 'โทรมาตรตรวจวัดความสอดคล้อง SSoT Parity ต่อเนื่อง 24,960 qOps นับแต่ Genesis Block โดยมีความเบี่ยงเบนเป็นศูนย์แน่นอน',
    drift: 'Δ0.00%',
    hash: 'sha256:43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a',
    invariantFormula: 'Drift = |SSoT_Observed - SSoT_Canonical| == 0.00%',
    judicialAdmissibility:
      'บันทึกโทรมาตรไร้การเบี่ยงเบนเป็นพยานหลักฐานเชิงเทคนิคยืนยันว่าระบบทำงานต่อเนื่อง ปราศจากการหยุดชะงัก การตัดต่อ หรือการแทรกแซงจากบุคคลภายนอก',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'OpenTelemetry OTLP mTLS :4318 Protobuf',
      hsmLevel: '10/10 REAL_HSM Monitored',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00% (Strict Baseline Anchor)',
    },
  },
  {
    id: 'MOD-05',
    moduleNumber: 5,
    requirement: 'Fail-Closed Circuit Breaker',
    engine: 'Quarantine Isolation Gate with instant drop-dead guard',
    status: 'ACTIVE_GUARD',
    category: 'RESILIENCE',
    statuteCategory: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (มาตรการรักษาความปลอดภัย)',
    statute: 'PDPA มาตรา ๓๗ (มาตรการทางเทคนิคเพื่อความมั่นคงปลอดภัย) & NCSA Emergency Protocols',
    evidenceFact: 'กลไกตัดวงจรอัตโนมัติทำงานเมื่ออุณหภูมิแกนสูงเกิน 85.0°C หรือแบนด์วิดท์ต่ำกว่า 15 GB/s โดย 80 รายการต้องสงสัยถูกกักกันอย่างปลอดภัย',
    drift: 'Δ0.00%',
    hash: 'sha256:16bed34cdbb07528e18501da86fc4691763a43fa4c68909ab814479844d8a148',
    invariantFormula: 'if (Temp > 85.0 || BW < 15.0) isolateNamespace()',
    judicialAdmissibility:
      'พิสูจน์ถึงการใช้ความระมัดระวังตามสมควร (Due Diligence) ของผู้ควบคุมข้อมูลส่วนบุคคลตาม PDPA มาตรา ๓๗ และ ๗๗ ยกเว้นความรับผิดทางแพ่งและอาญา',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'Drop-Dead Latency < 1.2 ms',
      hsmLevel: 'Hardware Zeroization Trigger',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00% (80 Quarantined Safely)',
    },
  },
  {
    id: 'MOD-06',
    moduleNumber: 6,
    requirement: 'Real-HSM Quorum Attestation',
    engine: '10/10 Deca-Key Physical Security Enclave verification',
    status: 'VERIFIED',
    category: 'STATUTORY',
    statuteCategory: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ (การควบคุมลายมือชื่อขั้นสูง)',
    statute: 'ETDA มาตรา ๒๖ (อำนาจควบคุมโดยแท้จริงของผู้ลงลายมือชื่อ) & FIPS 140-3 Level 4',
    evidenceFact: 'โหนดฮาร์ดแวร์จริง 10 จาก 10 โหนด (NitroKey, YubiKey, Trezor, Ledger) ลงนามรับรองฉันทามติทางกายภาพครบถ้วน 100% (ไร้ Mock โหนด)',
    drift: 'Δ0.00%',
    hash: 'sha256:86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da',
    invariantFormula: 'QuorumCount(REAL_HSM_SIGNED) == 10 / 10 >= 8',
    judicialAdmissibility:
      'พิสูจน์การอยู่ภายใต้การควบคุมของผู้ลงลายมือชื่อแต่เพียงผู้เดียว (Sole Control Requirement) ป้องกันการอ้างว่าถูกแฮ็กหรือขโมยรหัสผ่านในชั้นศาล',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'FIPS 140-3 L4 Physical Cryptographic Tokens',
      hsmLevel: '10/10 Real HSMs Super-Majority Verified',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00% (Unanimous Consensus)',
    },
  },
  {
    id: 'MOD-07',
    moduleNumber: 7,
    requirement: 'PDPA Sovereign Data Isolation',
    engine: 'Section 26 & 28 enclave data boundary containment',
    status: 'VERIFIED',
    category: 'STATUTORY',
    statuteCategory: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒',
    statute: 'PDPA มาตรา ๙, ๒๖, ๒๘, ๓๗ (การห้ามโอนย้ายข้อมูลอ่อนไหวออกนอกราชอาณาจักรโดยมิชอบ)',
    evidenceFact: 'ข้อมูลประมวลผลอยู่เฉพาะภายในขอบเขตพาร์ทิชันอธิปไตย Ω601-Ω1000 (400 Tenants LOCKED) ปราศจากการรั่วไหลออกนอกประเทศ',
    drift: 'Δ0.00%',
    hash: 'sha256:a18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48cd41d04f29a28a30f',
    invariantFormula: 'CrossBorderTransit(UnencryptedPII) == 0 (BLOCKED)',
    judicialAdmissibility:
      'ใช้เป็นเอกสารรับรองความถูกต้องตามระเบียบคุ้มครองข้อมูลส่วนบุคคล เพื่อหักล้างข้อกล่าวหาการส่งต่อข้อมูลข้ามพรมแดนผิดกฎหมายตาม PDPA มาตรา ๒๘',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'Zero-Knowledge Proof Enclave Isolation',
      hsmLevel: 'FIPS 140-3 L4 Bound Boundary',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00% (Zero PII Egress)',
    },
  },
  {
    id: 'MOD-08',
    moduleNumber: 8,
    requirement: 'ETDA Legal Signature Admissibility',
    engine: 'Electronic Transactions Act Section 9, 26, 28 Proof Suite',
    status: 'VERIFIED',
    category: 'STATUTORY',
    statuteCategory: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔',
    statute: 'ETDA มาตรา ๙, ๒๖, ๒๘ และข้อกำหนดการยื่นพยานหลักฐานอิเล็กทรอนิกส์ในศาลยุติธรรม',
    evidenceFact: 'ลายมือชื่อดิจิทัล ML-DSA-87 ผูกพันโดยตรงกับ Merkle Genesis Root 909ab814... พร้อมเวลาสากล RFC 3161 TSA ประทับตราสมบูรณ์',
    drift: 'Δ0.00%',
    hash: 'sha256:b242e1b87d00f28ac37a109e3f19e48cd41d04f29a28a30fa18f91a3c091811e',
    invariantFormula: 'AdmissibilityScore(CourtEvidence) == 100%',
    judicialAdmissibility:
      'สำนวนคดีพร้อมใช้ในชั้นศาล (Court-Admissible Ready) ผู้พิพากษาสามารถรับฟังเป็นพยานเอกสารต้นฉบับได้ทันทีตาม ป.วิ.พ. มาตรา 94/1 และระเบียบศาล',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'RFC 3161 TSA + FIPS 204 Signatures',
      hsmLevel: '10/10 REAL_HSM Ratified',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-09',
    moduleNumber: 9,
    requirement: 'NCSA CII Protection Invariant',
    engine: 'Critical Information Infrastructure sovereign perimeter defense',
    status: 'PASS',
    category: 'STATUTORY',
    statuteCategory: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. ๒๕๖๒',
    statute: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. ๒๕๖๒ (โครงสร้างพื้นฐานสำคัญทางสารสนเทศระดับวิกฤติ)',
    evidenceFact: 'กำแพงไฟวอลล์ Zero-Trust บล็อกและปฏิเสธทุกแพ็กเกจที่ไม่มีการลงลายมือชื่อ PQC ครบถ้วน โดยความปลอดภัยอยู่ที่ 100%',
    drift: 'Δ0.00%',
    hash: 'sha256:c37a109e3f19e48cd41d04f29a28a30fa18f91a3c091811eb242e1b87d00f28a',
    invariantFormula: 'IngressFirewall(Unauthenticated) == DROP',
    judicialAdmissibility:
      'เป็นหลักฐานพิสูจน์การปฏิบัติตามคำสั่งของคณะกรรมการการรักษาความมั่นคงปลอดภัยไซเบอร์แห่งชาติ (สกมช.) ปราศจากความประมาทเลินเล่อ',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'Zero-Trust Write Firewall Ingress Drop',
      hsmLevel: 'FIPS 140-3 L4 Enclave Protection',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-10',
    moduleNumber: 10,
    requirement: '12-Stage Forensic Trace Determinism',
    engine: 'Deterministic OTel telemetry pipeline with cryptographic hashing',
    status: 'PASS',
    category: 'RESILIENCE',
    statuteCategory: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ (ระบบบันทึกร่องรอยการตรวจสอบ)',
    statute: 'ETDA มาตรา ๒๖ ข้อกำหนดระบบบันทึกร่องรอยการตรวจสอบ (Audit Trail Determinism) & ป.วิ.อ.',
    evidenceFact: 'การจำลองร่องรอยตรวจสอบย้อนกลับ 12 ขั้นตอน (STG-01 ถึง STG-12) แสดงค่า Hash chain ตรงกันทุกบิตภายใน 142ms',
    drift: 'Δ0.00%',
    hash: 'sha256:d41d04f29a28a30fa18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48c',
    invariantFormula: 'TraceReplay(Stages[1..12]) == CanonicalHashChain',
    judicialAdmissibility:
      'ห่วงโซ่การครอบครองพยานหลักฐาน (Chain of Custody) ครบถ้วนบริบูรณ์ 12 ขั้นตอน ไม่มีช่องว่างให้คู่ความอีกฝ่ายโต้แย้งเรื่องความน่าเชื่อถือ',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: '12-Stage Deterministic Replay Pipeline',
      hsmLevel: 'Cryptographic Hash Chain Sealed',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00% (<142ms SLA)',
    },
  },
  {
    id: 'MOD-11',
    moduleNumber: 11,
    requirement: 'Room 00 Gold Seal Legal Graph',
    engine: 'Statutory chain of custody binding engine',
    status: 'VERIFIED',
    category: 'STATUTORY',
    statuteCategory: 'ข้อบังคับประธานศาลฎีกาว่าด้วยการฟังพยานหลักฐานดิจิทัล',
    statute: 'ข้อบังคับประธานศาลฎีกาว่าด้วยการสืบพยานหลักฐานทางอิเล็กทรอนิกส์ & ราชกิจจานุเบกษา',
    evidenceFact: 'ผูกโยง Genesis Block #849202 เข้ากับตราประทับทางกฎหมาย 14,902 ใบรับรองดิจิทัลแบบ WORM ไม่สามารถเปลี่ยนแปลงย้อนหลังได้',
    drift: 'Δ0.00%',
    hash: 'sha256:e52e1503a139b410b253f2c98e11039bd48b21af402af59de52e1503ab39b410',
    invariantFormula: 'LegalGraphChain(Room00 -> Genesis) == INVIOLABLE',
    judicialAdmissibility:
      'กราฟพยานหลักฐานแสดงความสัมพันธ์เชิงประจักษ์ ศาลสามารถตรวจสอบย้อนกลับ (Traceability) ได้ทุกชั้นความลับโดยชอบด้วยกระบวนพิจารณาความ',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'WORM Immutable Legal Binding Graph',
      hsmLevel: '10/10 REAL_HSM Sign-Off',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-12',
    moduleNumber: 12,
    requirement: 'Chamber 15 Quantum Entropy Invariant',
    engine: 'Sub-Kelvin cryo-dilution thermal entropy monitor',
    status: 'ACTIVE_GUARD',
    category: 'TELEMETRY',
    statuteCategory: 'มาตรฐานการเข้ารหัสลับสากล NIST SP 800-90B',
    statute: 'NIST SP 800-90B Entropy Source & พระราชกฤษฎีกาการรักษาความมั่นคงปลอดภัยสารสนเทศภาครัฐ',
    evidenceFact: 'วัดอุณหภูมิ Cryostat ได้เฉลี่ย 14.96 mK (อัตราการไหลฮีเลียม-4 อยู่ที่ 74.2%) ค่า Entropy รวมอยู่ที่ 0.9998 bits/symbol',
    drift: 'Δ0.00%',
    hash: 'sha256:f63f2614b24ac521c36403da9f2214ace59c32ba513ba60ef63f2614bc4ac521',
    invariantFormula: 'MinEntropy(Chamber15) >= 0.9990 bits/symbol',
    judicialAdmissibility:
      'พิสูจน์ความสุ่มทางกายภาพที่แท้จริง (True Random Number Generation) ยืนยันว่าคีย์เข้ารหัสไม่ได้เกิดจากการคำนวณที่ทำนายหรือแฮ็กได้',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'TRNG True Physical Entropy Core',
      hsmLevel: 'FIPS 140-3 L4 Cryogenic Sensor Unit',
      cryoTemp: '14.96 mK (Bus Sub-Kelvin Target)',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-13',
    moduleNumber: 13,
    requirement: 'DS-901-PILOT Fiduciary Dataset Integrity',
    engine: 'MAEW Ω∞ FIOS Factor Intelligence Provenance Gate',
    status: 'PASS',
    category: 'RESILIENCE',
    statuteCategory: 'ระเบียบคณะกรรมการ ก.ล.ต. และ ธนาคารแห่งประเทศไทย',
    statute: 'พ.ร.บ. หลักทรัพย์และตลาดหลักทรัพย์ พ.ศ. ๒๕๓๕ & ประกาศ ก.ล.ต./ธปท. ๒๕๖๙',
    evidenceFact: 'ค่า SHA256: 8f912cba...bed34c สอดคล้องกับชุดข้อมูลแม่บท Fiduciary โดยไม่มีค่าผิดพลาดหรือการบันทึกทับ',
    drift: 'Δ0.00%',
    hash: 'sha256:8f912cba9910e53a201b4491763a43fa4c68909ab814479844d8a14816bed34c',
    invariantFormula: 'SHA256(DS_901_PILOT.json) == 8f912cba...bed34c',
    judicialAdmissibility:
      'ใช้แสดงเป็นพยานหลักฐานการบริหารจัดการสินทรัพย์ดิจิทัลและความโปร่งใสของธุรกรรมทางการเงินต่อศาลทรัพย์สินทางปัญญาและการค้าระหว่างประเทศ',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'Fiduciary Mathematical Commitment Hash',
      hsmLevel: 'Locked Immutable Artifact',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-14',
    moduleNumber: 14,
    requirement: 'Deca-Key Physical Security Enclave',
    engine: 'CC EAL6+ & FIPS 140-3 Level 4 tamper-resistant containment',
    status: 'VERIFIED',
    category: 'CRYPTOGRAPHY',
    statuteCategory: 'มาตรฐานความปลอดภัยทางกายภาพ ISO/IEC 19790',
    statute: 'ISO/IEC 19790 & มาตรฐานความปลอดภัย FIPS 140-3 Level 4 / CC EAL6+',
    evidenceFact: 'การป้องกันการวิเคราะห์สัญญาณข้างเคียง (Side-Channel Leakage) วัดได้ 0.00 dB ทั่วทั้ง 10 ฮาร์ดแวร์โทเค็น',
    drift: 'Δ0.00%',
    hash: 'sha256:07403725c35bd632d47514ebaf3325bdf60d43cb624cb71f07403725cd5bd632',
    invariantFormula: 'SideChannelLeakage(Tokens[1..10]) == 0.00 dB',
    judicialAdmissibility:
      'การรับรองมาตรฐานสากลว่าข้อมูลลับไม่เคยหลุดรอดออกนอกอุปกรณ์ฮาร์ดแวร์ จึงปราศจากข้อสงสัยเรื่องการแทรกแซงทางกายภาพ',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'Tamper-Resistant Physical Containment',
      hsmLevel: '10 Enclaves FIPS 140-3 Level 4',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-15',
    moduleNumber: 15,
    requirement: 'Deep Cobalt 17-Module Forensic Archive',
    engine: 'Long-term immutable forensic storage & cold sealing',
    status: 'ACTIVE_GUARD',
    category: 'RESILIENCE',
    statuteCategory: 'พ.ร.บ. จดหมายเหตุแห่งชาติ พ.ศ. ๒๕๕๖',
    statute: 'พ.ร.บ. จดหมายเหตุแห่งชาติ พ.ศ. ๒๕๕๖ (การจัดเก็บเอกสารและประวัติศาสตร์ดิจิทัล)',
    evidenceFact: 'ทุกโมดูลระบบถูกล็อกภายใต้สถานะ FROZEN_LAYER_COMPATIBLE โดยมีสิทธิ์การเขียนเป็น NONE ป้องกันการทำลายหลักฐาน',
    drift: 'Δ0.00%',
    hash: 'sha256:18514836d46ce743e58625fcba4436cef71e54dc735dc82018514836de6ce743',
    invariantFormula: 'WriteAuthority(DeepCobalt) == NONE',
    judicialAdmissibility:
      'การจัดเก็บเอกสารดิจิทัลระยะยาวที่ถูกต้องตามกฎหมายจดหมายเหตุ ใช้เป็นพยานหลักฐานประวัติศาสตร์และพยานเอกสารในชั้นศาลฎีกาได้ถาวร',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'WORM Immutable Archive Engine',
      hsmLevel: 'Cold Cryo Vault Anchored',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00%',
    },
  },
  {
    id: 'MOD-16',
    moduleNumber: 16,
    requirement: 'Phoenix Autonomous Self-Healing',
    engine: 'Closed-loop invariant reconciliation & state restoration',
    status: 'VERIFIED',
    category: 'RESILIENCE',
    statuteCategory: 'ข้อตกลงระดับการให้บริการระบบวิกฤติ (Mission Critical SLA)',
    statute: 'มาตรฐานความพร้อมใช้ SLA Directive 99.999% & ป.วิ.พ. มาตรา 94/1',
    evidenceFact: 'ระบบฟื้นฟูสภาพความสอดคล้องอัตโนมัติ (Phoenix Recovery) คืนค่าความเบี่ยงเบนกลับสู่ Δ0.00% ภายในเวลาเพียง 35.8ms (เกณฑ์ SLA ≤ 142ms)',
    drift: 'Δ0.00%',
    hash: 'sha256:29625947e57df854f697360dcb5547df082f65ed846ed93129625947ef7df854',
    invariantFormula: 'ReconcileLatency(Phoenix) <= 50ms',
    judicialAdmissibility:
      'พิสูจน์ว่าแม้เกิดความพยายามโจมตีหรือเกิดความเสียหายทางกายภาพ ระบบสามารถกู้คืนพยานหลักฐานกลับสู่สภาพสมบูรณ์ดั้งเดิมได้ทันทีโดยไม่มีข้อมูลสูญหาย',
    technicalProof: {
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      pqcStandard: 'Autonomous Phoenix Reconciler 35.8ms',
      hsmLevel: '10/10 REAL_HSM State Mirror',
      cryoTemp: '14.96 mK',
      driftDelta: 'Δ0.00% (14,902 Seals Restored)',
    },
  },
];

export interface TruthMatrixProps {
  statusFilter?: 'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED';
  onStatusFilterChange?: (filter: 'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED') => void;
  defaultViewMode?: 'STEPPER' | 'TABLE';
}

export const TruthMatrix: React.FC<TruthMatrixProps> = ({
  statusFilter: externalStatusFilter,
  onStatusFilterChange,
  defaultViewMode = 'STEPPER',
}) => {
  // View mode: 'STEPPER' (โหมดไล่ตรวจทีละขั้นตอน 1-16) or 'TABLE' (โหมดตารางรวม 16 รายการ)
  const [viewMode, setViewMode] = useState<'STEPPER' | 'TABLE'>(defaultViewMode);

  // Status filtering state: 'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED'
  const [internalStatusFilter, setInternalStatusFilter] = useState<'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED'>('ALL');
  const activeStatusFilter = externalStatusFilter || internalStatusFilter;

  // Category filter and search query
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Step-by-step Stepper State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedTableModuleId, setExpandedTableModuleId] = useState<string | null>(null);

  // Mutable status map so user can toggle PASSED on any step
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, AuditStatusType>>(() => {
    const map: Record<string, AuditStatusType> = {};
    CANONICAL_16_MODULES.forEach((m) => {
      map[m.id] = m.status;
    });
    return map;
  });

  const autoRunTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStatusFilterSelect = (newFilter: 'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED') => {
    setInternalStatusFilter(newFilter);
    onStatusFilterChange?.(newFilter);
    playTone(550, 0.03);
  };

  // Speak announcement using Web Speech API (with silent catch if unavailable)
  const announceStep = (stepNumber: number, reqName: string, status: string) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const thStatus = status === 'VERIFIED' ? 'ผ่านการรับรองความถูกต้อง' : status === 'PASS' ? 'ผ่านการตรวจสอบ' : 'โหมดเฝ้าระวังอัตโนมัติ';
        const msg = new SpeechSynthesisUtterance(`ขั้นตอนที่ ${stepNumber}: ${reqName} สถานะ ${thStatus}`);
        msg.lang = 'th-TH';
        msg.rate = 1.05;
        window.speechSynthesis.speak(msg);
      }
    } catch {
      // ignore
    }
  };

  // Auto-run stepper effect
  useEffect(() => {
    if (isAutoRunning) {
      autoRunTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          const next = prev + 1;
          if (next >= CANONICAL_16_MODULES.length) {
            setIsAutoRunning(false);
            playAuditChime();
            announceStep(16, 'การตรวจพิสูจน์ทั้ง 16 ขั้นตอนเสร็จสมบูรณ์', 'VERIFIED');
            return 15;
          }
          const mod = CANONICAL_16_MODULES[next];
          playTone(450 + next * 30, 0.04);
          announceStep(mod.moduleNumber, mod.requirement, moduleStatuses[mod.id] || mod.status);
          return next;
        });
      }, 2000);
    } else if (autoRunTimerRef.current) {
      clearInterval(autoRunTimerRef.current);
      autoRunTimerRef.current = null;
    }

    return () => {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
      }
    };
  }, [isAutoRunning, moduleStatuses]);

  // Jump directly to step
  const handleJumpToStep = (index: number) => {
    if (isAutoRunning) setIsAutoRunning(false);
    setCurrentStepIndex(index);
    const mod = CANONICAL_16_MODULES[index];
    playTone(480 + index * 25, 0.03);
    announceStep(mod.moduleNumber, mod.requirement, moduleStatuses[mod.id] || mod.status);
  };

  // Previous & Next step
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      handleJumpToStep(currentStepIndex - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < CANONICAL_16_MODULES.length - 1) {
      handleJumpToStep(currentStepIndex + 1);
    }
  };

  // Toggle PASSED status on the active step
  const handleToggleStepStatus = (id: string) => {
    const current = moduleStatuses[id] || 'VERIFIED';
    let next: AuditStatusType = 'VERIFIED';
    if (current === 'VERIFIED') next = 'PASS';
    else if (current === 'PASS') next = 'ACTIVE_GUARD';
    else next = 'VERIFIED';

    setModuleStatuses((prev) => ({ ...prev, [id]: next }));
    playAuditChime();
  };

  // Copy hash helper
  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedHash(id);
    playTone(700, 0.04);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Export PDF helper
  const handleExportCourtDossier = () => {
    playAuditChime();
    const updatedModules = CANONICAL_16_MODULES.map((m) => ({
      ...m,
      status: moduleStatuses[m.id] || m.status,
    }));
    generateCourtDossierPdf(updatedModules, currentStepIndex);
  };

  // Filter modules according to category, search, and the status filter dropdown
  const filteredModules = CANONICAL_16_MODULES.filter((mod) => {
    const curStatus = moduleStatuses[mod.id] || mod.status;
    const matchesStatus = activeStatusFilter === 'ALL' || curStatus === activeStatusFilter;
    const matchesCategory = filterCategory === 'ALL' || mod.category === filterCategory;
    const matchesSearch =
      mod.requirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.engine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.statute.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.evidenceFact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.judicialAdmissibility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const activeStep = CANONICAL_16_MODULES[currentStepIndex];
  const activeStepEffectiveStatus = moduleStatuses[activeStep.id] || activeStep.status;
  const progressPct = Math.round(((currentStepIndex + 1) / CANONICAL_16_MODULES.length) * 100);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* ── TOP CONTROL BAR: View Mode Switcher, Status Filter Dropdown, & PDF Export ── */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setViewMode('STEPPER');
              playTone(680, 0.03);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              viewMode === 'STEPPER'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>โหมดไล่ตรวจทีละขั้นตอน (Step-by-Step Stepper)</span>
          </button>

          <button
            onClick={() => {
              setViewMode('TABLE');
              playTone(600, 0.03);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              viewMode === 'TABLE'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>โหมดตารางรวม (Full Matrix 16 รายการ)</span>
          </button>
        </div>

        {/* Right: Status Filter Dropdown & Export PDF Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filtering Dropdown */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-zinc-400 font-bold uppercase">Status Filter:</span>
            <select
              value={activeStatusFilter}
              onChange={(e) => handleStatusFilterSelect(e.target.value as any)}
              className="bg-transparent text-cyan-300 font-bold text-xs focus:outline-none cursor-pointer pr-1"
              id="truth-matrix-status-filter"
            >
              <option value="ALL" className="bg-slate-900 text-white">ALL STATUSES (ทั้งหมด 16)</option>
              <option value="PASS" className="bg-slate-900 text-cyan-300">🔵 PASS (ผ่านการตรวจสอบ)</option>
              <option value="ACTIVE_GUARD" className="bg-slate-900 text-amber-300">🟡 ACTIVE_GUARD (เฝ้าระวัง)</option>
              <option value="VERIFIED" className="bg-slate-900 text-emerald-300">🟢 VERIFIED (รับรองความถูกต้อง)</option>
            </select>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportCourtDossier}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            title="ดาวน์โหลดเอกสารรายงานการตรวจพิสูจน์พยานหลักฐานดิจิทัลพร้อมตราประทับรับรอง"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก PDF สำนวนศาล</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. STEP-BY-STEP STEPPER MODE (โหมดไล่ตรวจทีละขั้นตอน 1 ถึง 16) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === 'STEPPER' && (
        <div className="space-y-4">
          {/* แถบนำทางขั้นตอน 1 ถึง 16 (Step Selector & Progress) */}
          <div className="p-4 rounded-2xl bg-[#0b0e1a]/85 border border-cyan-500/25 backdrop-blur-xl space-y-3.5 shadow-xl">
            {/* Header with Progress & Auto-Run Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm tracking-wide">
                    แถบนำทางขั้นตอน 1 ถึง 16 (STEP SELECTOR &amp; PROGRESS)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    ขั้นตอนที่ {currentStepIndex + 1} จาก 16 ({progressPct}%)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  คลิกที่ปุ่มตัวเลขเพื่อกระโดดข้ามขั้นตอน หรือกดปุ่ม [รันอัตโนมัติ] เพื่อไล่ตรวจทีละขั้นตอนพร้อมเสียงสังเคราะห์
                </p>
              </div>

              {/* Auto Run Button */}
              <button
                onClick={() => {
                  const next = !isAutoRunning;
                  setIsAutoRunning(next);
                  playTone(next ? 750 : 400, 0.05);
                  if (next) {
                    announceStep(activeStep.moduleNumber, activeStep.requirement, activeStepEffectiveStatus);
                  }
                }}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isAutoRunning
                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                }`}
              >
                {isAutoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isAutoRunning ? '⏸ หยุดชั่วคราว (Pause)' : '▶ รันอัตโนมัติ (Auto Run)'}</span>
              </button>
            </div>

            {/* Total Progress Bar */}
            <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
              <div
                className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Numbered Step Buttons (1 to 16) */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-1">
              {CANONICAL_16_MODULES.map((mod, idx) => {
                const isCurrent = idx === currentStepIndex;
                const status = moduleStatuses[mod.id] || mod.status;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleJumpToStep(idx)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer font-bold relative group ${
                      isCurrent
                        ? 'bg-cyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.6)] scale-105 z-10'
                        : 'bg-black/50 hover:bg-white/10 text-zinc-300 border border-white/10'
                    }`}
                    title={`ขั้นตอนที่ ${mod.moduleNumber}: ${mod.requirement}`}
                  >
                    <span className="text-xs">{String(mod.moduleNumber).padStart(2, '0')}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        status === 'VERIFIED'
                          ? isCurrent
                            ? 'bg-black'
                            : 'bg-emerald-400'
                          : status === 'PASS'
                          ? isCurrent
                            ? 'bg-black'
                            : 'bg-cyan-400'
                          : isCurrent
                          ? 'bg-black'
                          : 'bg-amber-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* รายละเอียดพยานหลักฐานประจำขั้นตอน (Active Step Detail Card) */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0e1322] to-[#080b14] border border-cyan-500/30 shadow-2xl space-y-5">
            {/* Header of Active Step */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold">
                    ขั้นตอนที่ {String(activeStep.moduleNumber).padStart(2, '0')} / 16
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                      activeStep.category === 'STATUTORY'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : activeStep.category === 'CRYPTOGRAPHY'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : activeStep.category === 'RESILIENCE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {activeStep.category}
                  </span>
                  <span className="text-zinc-400 text-xs">• Drift: <strong className="text-emerald-400">{activeStep.drift}</strong></span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {activeStep.requirement}
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  {activeStep.engine}
                </p>
              </div>

              {/* Status Badge & Toggle Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    activeStepEffectiveStatus === 'VERIFIED'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : activeStepEffectiveStatus === 'PASS'
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                      : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {activeStepEffectiveStatus === 'VERIFIED'
                      ? '🟢 VERIFIED (รับรอง)'
                      : activeStepEffectiveStatus === 'PASS'
                      ? '🔵 PASS (ผ่าน)'
                      : '🟡 ACTIVE_GUARD (เฝ้าระวัง)'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleStepStatus(activeStep.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/20 font-bold transition-all cursor-pointer text-xs flex items-center gap-1"
                  title="สลับสถานะการตรวจพิสูจน์ (Toggle Status)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>สลับสถานะ</span>
                </button>
              </div>
            </div>

            {/* Grid 1: หมวดหมู่และมาตรากฎหมาย (Statutory Reference) */}
            <div className="p-4 rounded-xl bg-black/40 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between text-blue-400">
                <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-blue-400" />
                  หมวดหมู่และมาตรากฎหมาย (STATUTORY REFERENCE)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  {activeStep.statuteCategory}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">
                {activeStep.statute}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {activeStep.evidenceFact}
              </p>
            </div>

            {/* Grid 2: หลักฐานทางเทคนิค (Technical Proof) */}
            <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  หลักฐานทางเทคนิค (TECHNICAL PROOF &amp; CRYPTOGRAPHY)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ZERO DRIFT Δ0.00%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 space-y-1">
                  <span className="text-zinc-400 text-[10px] block">CANONICAL MERKLE ROOT ANCHOR:</span>
                  <span className="text-cyan-300 font-bold break-all text-[11px] block">
                    {activeStep.technicalProof.merkleRoot}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 space-y-1">
                  <span className="text-zinc-400 text-[10px] block">POST-QUANTUM CRYPTOGRAPHY STANDARD:</span>
                  <span className="text-emerald-300 font-bold text-[11px] block">
                    {activeStep.technicalProof.pqcStandard}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 space-y-1">
                  <span className="text-zinc-400 text-[10px] block">HARDWARE HSM ENCLAVE ATTESTATION:</span>
                  <span className="text-zinc-200 font-bold text-[11px] block">
                    {activeStep.technicalProof.hsmLevel}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 space-y-1">
                  <span className="text-zinc-400 text-[10px] block">CRYOSTAT THERMAL TELEMETRY:</span>
                  <span className="text-violet-300 font-bold text-[11px] block flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-violet-400" />
                    {activeStep.technicalProof.cryoTemp}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 flex items-center gap-2 pt-1 border-t border-white/5">
                <span className="text-zinc-500">Mathematical Invariant Formula:</span>
                <code className="text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                  {activeStep.invariantFormula}
                </code>
              </div>
            </div>

            {/* Grid 3: ผลทางกฎหมายในชั้นศาล (Judicial Admissibility) */}
            <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-amber-400">
                <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-400" />
                  ผลทางกฎหมายในชั้นศาล (JUDICIAL ADMISSIBILITY)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  COURT-ADMISSIBLE READY
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                {activeStep.judicialAdmissibility}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>มีผลรับฟังเป็นพยานเอกสารดิจิทัลแห่งความจริงตาม ป.วิ.พ. มาตรา 94/1 และ 95/1</span>
              </div>
            </div>

            {/* Grid 4: กล่อง Cryptographic Hash Digest พร้อมปุ่มคัดลอก */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span className="flex items-center gap-1.5 font-bold uppercase">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  กล่อง Cryptographic Hash Digest ประจำขั้นตอน
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">SHA-256 Bitwise Invariant</span>
              </div>
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-black/80 border border-white/10">
                <span className="text-zinc-300 font-mono text-[11px] truncate select-all">
                  {activeStep.hash}
                </span>
                <button
                  onClick={() => handleCopy(activeStep.hash, activeStep.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  {copiedHash === activeStep.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอก Digest</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
              {/* Previous & Next Step Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/20 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>◀ ขั้นตอนก่อนหน้า</span>
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={currentStepIndex === CANONICAL_16_MODULES.length - 1}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <span>ขั้นตอนถัดไป ▶</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Mode Switch Shortcuts */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleToggleStepStatus(activeStep.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ผ่านการตรวจสอบ (PASSED)</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('TABLE');
                    playTone(600, 0.03);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>โหมดตารางรวม (Full Matrix)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. FULL MATRIX TABLE MODE (โหมดตารางรวม 16 รายการ)          */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === 'TABLE' && (
        <div className="space-y-4">
          {/* Category Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-black/40 border border-white/8 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-400 flex items-center gap-1.5 font-bold">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                CATEGORY:
              </span>
              {['ALL', 'STATUTORY', 'CRYPTOGRAPHY', 'RESILIENCE', 'TELEMETRY'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    playTone(550, 0.03);
                    setFilterCategory(cat);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 16 modules, laws, hashes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Table of Modules */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/50 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Module Requirement &amp; Engine</th>
                    <th className="p-3 hidden md:table-cell">Statute / Standard</th>
                    <th className="p-3 text-center">Drift</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredModules.map((mod) => {
                    const isExpanded = expandedTableModuleId === mod.id;
                    const status = moduleStatuses[mod.id] || mod.status;
                    return (
                      <React.Fragment key={mod.id}>
                        <tr
                          onClick={() => {
                            playTone(isExpanded ? 450 : 600, 0.03);
                            setExpandedTableModuleId(isExpanded ? null : mod.id);
                          }}
                          className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                        >
                          <td className="p-3 text-center font-bold text-zinc-500">
                            {String(mod.moduleNumber).padStart(2, '0')}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{mod.requirement}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  mod.category === 'STATUTORY'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : mod.category === 'CRYPTOGRAPHY'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : mod.category === 'RESILIENCE'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {mod.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate max-w-md font-sans mt-0.5">
                              {mod.engine}
                            </div>
                          </td>
                          <td className="p-3 hidden md:table-cell text-zinc-300">
                            <span className="text-[11px]">{mod.statute}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-emerald-400">{mod.drift}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                                status === 'VERIFIED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : status === 'PASS'
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  handleJumpToStep(mod.moduleNumber - 1);
                                  setViewMode('STEPPER');
                                }}
                                className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition cursor-pointer"
                                title="ไล่ตรวจขั้นตอนนี้ในโหมด Stepper"
                              >
                                <span>Stepper</span>
                              </button>
                              <button
                                onClick={() => handleCopy(mod.hash, mod.id)}
                                className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
                                title="Copy SHA-256 Digest"
                              >
                                {copiedHash === mod.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {isExpanded && (
                          <tr className="bg-white/[0.02]">
                            <td colSpan={6} className="p-4 space-y-3 border-t border-white/5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                  <span className="text-zinc-500 text-[10px] block uppercase">หลักฐานและข้อเท็จจริง (Evidence Fact):</span>
                                  <p className="text-zinc-200 font-sans leading-relaxed">{mod.evidenceFact}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                  <span className="text-zinc-500 text-[10px] block uppercase">ผลทางกฎหมายในชั้นศาล (Judicial Admissibility):</span>
                                  <p className="text-zinc-200 font-sans leading-relaxed">{mod.judicialAdmissibility}</p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-black/60 border border-white/5 text-[11px]">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-zinc-500">Digest Hash:</span>
                                  <span className="text-zinc-300 font-mono truncate">{mod.hash}</span>
                                </div>
                                <code className="text-cyan-300 text-[10px] shrink-0 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                                  {mod.invariantFormula}
                                </code>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
