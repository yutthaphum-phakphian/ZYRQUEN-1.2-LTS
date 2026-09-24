import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from '../lib/router';
import {
  Search,
  LayoutDashboard,
  Cpu,
  Lock,
  FileCheck2,
  Activity,
  Workflow,
  Orbit,
  Archive,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Download,
  AlertTriangle,
  Radio,
  FileText,
  Database,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  Fingerprint,
} from 'lucide-react';
import { ViewType } from '../types';
import { playTone } from './AudioSynthesizer';

export type CommandCategory = 'all' | 'navigation' | 'legal' | 'events';

export interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'navigation' | 'legal' | 'events';
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  status?: string;
  severity?: 'success' | 'warning' | 'info' | 'critical';
  targetView?: ViewType;
  statuteRef?: string;
  timestamp?: string;
  codeSnippet?: string;
  actionPayload?: string;
}

export const CANONICAL_COMMANDS: CommandItem[] = [
  // -------------------------------------------------------------
  // 1. NAVIGATION VIEWS
  // -------------------------------------------------------------
  {
    id: 'nav-dashboard',
    title: 'Executive Dashboard',
    subtitle: 'Sovereign Mainnet Live SSoT Δ0.00%',
    description: 'หน้าจอสรุปภาพรวมสถานะระบบ, ค่า Telemetry สด, กราฟ Coherence และสถานะการตรวจสอบ 40 Verification Phases',
    category: 'navigation',
    icon: LayoutDashboard,
    tags: ['dashboard', 'home', 'main', 'overview', 'phases', 'หน้าแรก', 'แดชบอร์ด'],
    status: 'MAINNET LIVE',
    severity: 'success',
    targetView: 'dashboard',
  },
  {
    id: 'nav-chambers',
    title: 'Sovereign Chambers 18 Modules',
    subtitle: 'ระบบ 18 ตลับคาร์ดินัล & Cryo Sub-Kelvin Arrays',
    description: 'ควบคุมและตรวจสอบสถานะการทำงานของ 18 Sovereign Chambers ตั้งแต่ Genesis Kernel จนถึง Omnipresent Command Plane',
    category: 'navigation',
    icon: Layers,
    tags: ['chambers', 'modules', 'cryo', 'arrays', 'ห้องควอนตัม', '18โมดูล'],
    status: '18/18 ACTIVE',
    severity: 'success',
    targetView: 'chambers',
  },
  {
    id: 'nav-quantum',
    title: 'Quantum Cryo Bus & Field Engine',
    subtitle: 'Cryostat Sub-Kelvin 14.98 mK / 851.9 QOps',
    description: 'การควบคุม Coherence 99.992%, Entropy Fluctuation dS 0.0142 J/K และระบบป้องกัน Antimatter Reserve',
    category: 'navigation',
    icon: Activity,
    tags: ['quantum', 'cryo', 'coherence', 'temperature', 'kelvin', 'ฟิสิกส์ควอนตัม'],
    status: '14.98 mK NOMINAL',
    severity: 'success',
    targetView: 'quantum',
  },
  {
    id: 'nav-vault',
    title: 'Deca-Key Vault & PQC Hybrid Engine',
    subtitle: '10/10 REAL_HSM FIPS 140-3 L4 Quorum',
    description: 'ฮาร์ดแวร์นิรภัย Deca-Key Council 10 โหนด, PQC Dilithium-5 (ML-DSA-87), Kyber-1024 และ SPHINCS+ Fallback',
    category: 'navigation',
    icon: Lock,
    tags: ['vault', 'hsm', 'pqc', 'dilithium', 'kyber', 'sphincs', 'กุญแจเข้ารหัส'],
    status: '10/10 RATIFIED',
    severity: 'success',
    targetView: 'vault',
  },
  {
    id: 'nav-ledger',
    title: 'Immutable WORM Audit Ledger',
    subtitle: '14,902 Active Evidence Seals (Zero Drift)',
    description: 'ทะเบียนตราประทับพยานหลักฐาน 14,902 รายการ พร้อม Merkle Proofs และการสลัก WORM ไม่สามารถแก้ไขย้อนหลังได้',
    category: 'navigation',
    icon: Archive,
    tags: ['ledger', 'seals', 'worm', 'merkle', 'audit', 'บัญชีแยกประเภท'],
    status: '14,902 VERIFIED',
    severity: 'success',
    targetView: 'ledger',
  },
  {
    id: 'nav-legal',
    title: 'Safe Harbor Legal & Statutory Gate',
    subtitle: 'พ.ร.บ.ธุรกรรมอิเล็กทรอนิกส์ 2544 & PDPA 2562',
    description: 'ศูนย์กลางการคุ้มครองทางกฎหมาย Safe Harbor Gateway, ตรวจสอบ ม.9, ม.26, ม.28 และ PDPA ม.37',
    category: 'navigation',
    icon: Scale,
    tags: ['legal', 'etda', 'pdpa', 'court', 'statute', 'กฎหมาย', 'พยานหลักฐาน'],
    status: 'SAFE HARBOR',
    severity: 'success',
    targetView: 'legal',
  },
  {
    id: 'nav-wallet',
    title: 'Sovereign Treasury & RWA Reserve',
    subtitle: '฿4,230,000,000.00 THB + 14,902 oz Gold',
    description: 'คลังสินทรัพย์ค้ำประกันอธิปไตย ดิจิทัลบาท, ทองคำแท่ง LBMA 99.99% และโครงสร้างพื้นฐาน 400 Tenants Ω601-Ω1000',
    category: 'navigation',
    icon: Database,
    tags: ['treasury', 'rwa', 'gold', 'thb', 'assets', 'คลังอธิปไตย'],
    status: '฿4.23B LOCKED',
    severity: 'success',
    targetView: 'sovereign-wallet',
  },
  {
    id: 'nav-audithistory',
    title: '16-Step Forensic Audit Stepper',
    subtitle: 'WORM Parity Matrix & 12-Stage Replay Trace',
    description: 'เครื่องมือสเต็ปเปอร์ตรวจสอบความบริสุทธิ์ทางนิติวิทยาศาสตร์ 16 ขั้นตอน พร้อมการสร้างสำเนาพยานหลักฐาน',
    category: 'navigation',
    icon: Workflow,
    tags: ['stepper', 'forensic', 'replay', 'audit', '16-step', 'ตรวจสอบนิติวิทยาศาสตร์'],
    status: '16/16 PASSED',
    severity: 'success',
    targetView: 'audithistory',
  },
  {
    id: 'nav-nexus',
    title: 'Distributed Quorum BFT Mesh',
    subtitle: '6 Global Satellite Nodes (QKD Active)',
    description: 'เครือข่ายดาวเทียมและโหนดทั่วโลก Bangkok, Singapore, Tokyo, Zurich, Silicon Valley, London',
    category: 'navigation',
    icon: Radio,
    tags: ['nexus', 'mesh', 'satellite', 'bft', 'nodes', 'เครือข่ายโหนด'],
    status: '6/6 ONLINE',
    severity: 'success',
    targetView: 'nexus',
  },
  {
    id: 'nav-copilot',
    title: 'Copilot Sovereign AI Reflex',
    subtitle: 'Autonomous Diagnostics & Sentinel Observer',
    description: 'ระบบปัญญาประดิษฐ์ตรวจจับความผิดปกติ ตรวจสอบดัชนีความเสี่ยง และตอบสนองต่อเหตุการณ์เชิงรุก',
    category: 'navigation',
    icon: Sparkles,
    tags: ['copilot', 'ai', 'reflex', 'neural', 'sentinel', 'ปัญญาประดิษฐ์'],
    status: 'AI RESONANT',
    severity: 'info',
    targetView: 'console',
    actionPayload: 'trigger-copilot',
  },
  {
    id: 'nav-canonical',
    title: 'Canonical 3D Integrity Sphere',
    subtitle: 'Dynamic 3D Continuum Field Engine',
    description: 'การแสดงผลสามมิติของสนามความสอดคล้องทางควอนตัมและการหมุนตัวของเวกเตอร์สถานะระบบ',
    category: 'navigation',
    icon: Orbit,
    tags: ['3d', 'sphere', 'field', 'visualizer', 'สามมิติ'],
    status: 'RENDER ONLINE',
    severity: 'info',
    targetView: 'canonical',
  },
  {
    id: 'nav-security',
    title: 'Zero-Trust Write Firewall & Lockdown',
    subtitle: 'Circuit Breaker Fail-Closed Protection',
    description: 'กำแพงไฟป้องกันการเขียนทับหน่วยความจำ, สวิตช์ตัดวงจรความร้อนสูง 85°C และการแยกตัวแบบ Air-Gap',
    category: 'navigation',
    icon: ShieldAlert,
    tags: ['security', 'firewall', 'lockdown', 'airgap', 'zero-trust', 'ความปลอดภัย'],
    status: 'FAIL-CLOSED ARMED',
    severity: 'warning',
    targetView: 'security',
  },

  // -------------------------------------------------------------
  // 2. LEGAL TRIGGERS
  // -------------------------------------------------------------
  {
    id: 'legal-etda-sec9',
    title: 'ETDA B.E. 2544 Section 9: Digital Intent Binding',
    subtitle: 'มาตรา ๙ — ผลผูกพันทางกฎหมายของข้อมูลอิเล็กทรอนิกส์และเจตนา',
    description: 'การผูกโยงอัตลักษณ์และเจตนาของ Sovereign Principal (#EP-SOVEREIGN-01) กับข้อมูลธุรกรรมทางอิเล็กทรอนิกส์อย่างสมบูรณ์',
    category: 'legal',
    icon: Scale,
    tags: ['etda', 'sec9', 'section9', 'มาตรา9', 'intent', 'e-signature', 'กฎหมายธุรกรรม'],
    status: 'STATUTORY BINDING',
    severity: 'success',
    statuteRef: 'ETDA B.E. 2544 Section 9 (Intent & Identity)',
  },
  {
    id: 'legal-etda-sec26',
    title: 'ETDA B.E. 2544 Section 26: Advanced Secure Signature',
    subtitle: 'มาตรา ๒๖ — ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ & ปฏิเสธไม่ได้',
    description: 'การรับรองลายมือชื่อเข้ารหัสขั้นสูงด้วย PQC Dilithium-5 ร่วมกับ 10/10 REAL_HSM Council เพื่อผลการไม่สามารถปฏิเสธความรับผิดชอบ',
    category: 'legal',
    icon: Fingerprint,
    tags: ['etda', 'sec26', 'section26', 'มาตรา26', 'signature', 'non-repudiation', 'dilithium'],
    status: 'NON-REPUDIATION PASS',
    severity: 'success',
    statuteRef: 'ETDA B.E. 2544 Section 26 (Reliable Electronic Signature)',
  },
  {
    id: 'legal-etda-sec28',
    title: 'ETDA B.E. 2544 Section 28: Immutable Audit Ledger',
    subtitle: 'มาตรา ๒๘ — ข้อสันนิษฐานความถูกต้องแท้จริงของพยานหลักฐานในศาล',
    description: 'การบันทึกประวัติการเปลี่ยนแปลงในตลับ WORM V25 โดยมีข้อสันนิษฐานความถูกต้องตามกฎหมาย พร้อมรองรับการนำสืบพยานในชั้นศาล',
    category: 'legal',
    icon: FileCheck2,
    tags: ['etda', 'sec28', 'section28', 'มาตรา28', 'evidence', 'court', 'presumption', 'พยานศาล'],
    status: 'COURT ADMISSIBLE',
    severity: 'success',
    statuteRef: 'ETDA B.E. 2544 Section 28 (Presumption of Authenticity)',
  },
  {
    id: 'legal-pdpa-sec37',
    title: 'PDPA B.E. 2562 Section 37: Zero-Knowledge Privacy Isolation',
    subtitle: 'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล มาตรา ๓๗ — มาตรการความมั่นคงปลอดภัยขั้นสูง',
    description: 'การแยกข้อมูล 400 Enterprise Tenants (Ω601-Ω1000) ด้วย Zero-Knowledge Proofs ปราศจากการรั่วไหลของข้อมูลระบุตัวตน (PII)',
    category: 'legal',
    icon: ShieldCheck,
    tags: ['pdpa', 'sec37', 'privacy', 'zk-proof', 'มาตรา37', 'คุ้มครองข้อมูล', 'ข้อมูลส่วนบุคคล'],
    status: 'ZK ISOLATION ENFORCED',
    severity: 'success',
    statuteRef: 'PDPA B.E. 2562 Section 37 (Technical Safeguards)',
  },
  {
    id: 'legal-ncsa-cii',
    title: 'NCSA Critical Information Infrastructure (CII) Safe Harbor',
    subtitle: 'พ.ร.บ.การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562',
    description: 'มาตรการรับมือภัยคุกคามทางไซเบอร์ระดับวิกฤติ ตามเกณฑ์ สกมช. พร้อมกรอบปฏิบัติการ Safe Harbor Protection Gate',
    category: 'legal',
    icon: ShieldAlert,
    tags: ['ncsa', 'cii', 'cybersecurity', 'safe-harbor', 'สกมช', 'ความมั่นคงไซเบอร์'],
    status: 'CII COMPLIANT',
    severity: 'success',
    statuteRef: 'Cybersecurity Act B.E. 2562 (NCSA CII Standard)',
  },
  {
    id: 'legal-pdf-export',
    title: 'Court Evidence Dossier PDF Generator',
    subtitle: 'ส่งออกพยานหลักฐานดิจิทัลพร้อมลายมือชื่อ PQC และตารางแฮช',
    description: 'จัดทำเอกสารพยานหลักฐานศาล (PDF Format) สมบูรณ์พร้อม QR Code ยืนยันความถูกต้องตาม FIPS 204/205',
    category: 'legal',
    icon: Download,
    tags: ['pdf', 'dossier', 'export', 'evidence', 'เอกสารศาล', 'ดาวน์โหลดหลักฐาน'],
    status: 'EXPORT READY',
    severity: 'info',
    actionPayload: 'export-dossier-pdf',
  },
  {
    id: 'legal-dual-plane',
    title: 'Dual-Plane Invariant Governance Matrix',
    subtitle: 'การแยกชั้น Governance Policy 10/10 vs Physical HSM ≥8/10',
    description: 'การแยกมิติความยินยอมทางนโยบายและการรับรองทางกายภาพ เพื่อความต่อเนื่องของ Mainnet Live 100% Green',
    category: 'legal',
    icon: Workflow,
    tags: ['dual-plane', 'quorum', 'governance', 'physical', 'matrix', 'มิติคู่ขนาน'],
    status: '10/10 GOV + 10/10 PHY',
    severity: 'success',
    statuteRef: 'Sovereign Dual-Plane Decoupling Invariant',
  },
  {
    id: 'legal-worm-replay',
    title: '12-Stage Forensic Trace Engine Replay',
    subtitle: 'การเล่นซ้ำประวัติพยานหลักฐาน 12 ขั้นตอน (SLA < 142.00 ms)',
    description: 'กระบวนการตรวจสอบย้อนกลับทางนิติวิทยาศาสตร์ STG-01 Ingest จนถึง STG-12 Evidence Seal ภายในเวลา 35.80 ms',
    category: 'legal',
    icon: Clock,
    tags: ['trace', 'replay', '12-stage', 'forensic', 'sla', 'เล่นซ้ำประวัติ'],
    status: '35.80 ms (SLA PASS)',
    severity: 'success',
    statuteRef: 'ETDA Section 28 Forensic Verification Routine',
  },

  // -------------------------------------------------------------
  // 3. SYSTEM EVENTS
  // -------------------------------------------------------------
  {
    id: 'event-genesis-anchor',
    title: 'Genesis Block #849202 Canonical Anchor Lock',
    subtitle: 'Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    description: 'การตรึงราก Merkle และบล็อกตั้งต้นของระบบอธิปไตย ZYRQUEN Ω∞ รับประกัน Zero System Drift (Δ0.00%)',
    category: 'events',
    icon: CheckCircle2,
    tags: ['genesis', 'block', '849202', 'merkle', 'root', 'anchor', 'บล็อกปฐมบท'],
    status: 'SSoT Δ0.00% VERIFIED',
    severity: 'success',
    timestamp: '2026-09-14 14:04:43 UTC',
  },
  {
    id: 'event-tc03-tamper',
    title: 'Hardware Tamper Foil Breach TC-03 & Active Zeroization',
    subtitle: 'Chamber 04 Hardware Enclave Security Incident Intercepted',
    description: 'เซ็นเซอร์ตรวจพบการสัมผัสทางกายภาพที่โหนด TC-03 ระบบสั่ง Active Zeroization ภายใน 1.20 ms ย้ายคีย์ไปยัง SPHINCS+ Fallback',
    category: 'events',
    icon: AlertTriangle,
    tags: ['tamper', 'zeroization', 'tc03', 'breach', 'fail-closed', 'การล้างคีย์ฉุกเฉิน'],
    status: 'TAMPER ISOLATED',
    severity: 'warning',
    timestamp: '14:43:08 ICT',
  },
  {
    id: 'event-sentinel-quarantine',
    title: 'Sentinel AI Interceptor Seal #14903 Quarantine',
    subtitle: 'HTTP 423 Fail-Closed | Containment Chamber 02 Buffer',
    description: 'Sentinel AI สกัดกั้นตราประทับเกินจำนวน #14903 เข้าสู่ห้องกักกัน ป้องกัน State Cardinality Inflation สมบูรณ์แบบ',
    category: 'events',
    icon: ShieldAlert,
    tags: ['sentinel', 'quarantine', '14903', 'fail-closed', 'cardinality', 'การกักกัน'],
    status: 'FAIL-CLOSED 423',
    severity: 'warning',
    timestamp: '14:43:40 ICT',
  },
  {
    id: 'event-phoenix-recovery',
    title: 'Phoenix Continuum 35.8 ms Auto-Healing Completed',
    subtitle: '5-Phase Pipeline (Detect → Analyze → Decide → Act → Verify)',
    description: 'กระบวนการฟื้นฟูระบบอัตโนมัติสำเร็จใน 35.80 ms ซึ่งเร็วกว่าข้อตกลง SLA กำหนดที่ 142.00 ms ถึง 74.8%',
    category: 'events',
    icon: Flame,
    tags: ['phoenix', 'recovery', 'healing', '35.8ms', 'sla', 'การกู้คืนอัตโนมัติ'],
    status: 'RECOVERED 35.8 ms',
    severity: 'success',
    timestamp: '14:43:43 ICT',
  },
  {
    id: 'event-pqc-dilithium',
    title: 'PQC CRYSTALS-Dilithium-5 (ML-DSA-87 / FIPS 204) Commit',
    subtitle: 'Outer Shield Signature Signed by Supreme Sovereign #EP-SOVEREIGN-01',
    description: 'การลงนามทางคณิตศาสตร์แบบแลตทิซป้องกันการถอดรหัสด้วยควอนตัมคอมพิวเตอร์ตามมาตรฐาน NIST FIPS 204',
    category: 'events',
    icon: Fingerprint,
    tags: ['dilithium', 'pqc', 'fips204', 'signature', 'ml-dsa-87', 'การลงนามควอนตัม'],
    status: 'FIPS 204 ENFORCED',
    severity: 'success',
    timestamp: '14:43:42 ICT',
  },
  {
    id: 'event-sphincs-fallback',
    title: 'SPHINCS+ (SLH-DSA / FIPS 205) Stateless Hash Fallback Standby',
    subtitle: 'Crypto-Agility Engine Standby Active Failover Ready',
    description: 'เครื่องยนต์เข้ารหัสทางเลือกแบบไร้สถานะ (Stateless Hash-based) พร้อมทำงานทันทีหากพบความเสี่ยงในโครงสร้างแลตทิซ',
    category: 'events',
    icon: Lock,
    tags: ['sphincs', 'fips205', 'fallback', 'crypto-agility', 'slh-dsa', 'ระบบสำรอง'],
    status: 'STANDBY READY',
    severity: 'info',
    timestamp: 'Active Continuous',
  },
  {
    id: 'event-cryo-stabilize',
    title: 'Sub-Kelvin Cryostat Bus Stabilization (14.98 mK)',
    subtitle: 'Superconducting Helium-4 Bus | Jitter 0.31 ms',
    description: 'อุณหภูมิบัสตัวนำยิ่งยวดอยู่ในระดับ 14.98 mK ต่ำกว่าขีดจำกัดความปลอดภัย 18.00 mK สัญญาณรบกวนต่ำที่สุดในประวัติการณ์',
    category: 'events',
    icon: Activity,
    tags: ['cryo', '14.98mk', 'helium4', 'sub-kelvin', 'อุณหภูมิต่ำวิกฤต'],
    status: '14.98 mK NOMINAL',
    severity: 'success',
    timestamp: 'Live Continuous',
  },
  {
    id: 'event-14902-parity',
    title: 'Canonical 14,902 Frozen Seals Parity Invariant Re-verification',
    subtitle: 'Zero Mutations Detected across 14,902 Evidence Seals',
    description: 'ระบบตรวจสอบความคงที่ของตราประทับ 14,902 รายการเทียบกับ Genesis Block พบความสอดคล้อง 100% ปราศจากการกลายพันธุ์',
    category: 'events',
    icon: Archive,
    tags: ['parity', '14902', 'seals', 'zero-drift', 'ตราประทับคงที่'],
    status: 'PARITY 100%',
    severity: 'success',
    timestamp: '14:43:43 ICT',
  },
  {
    id: 'event-hsm-ratify',
    title: '10/10 REAL_HSM Council Unanimous Ratification',
    subtitle: 'Supreme Sovereign + 9 Global Enclaves Attested',
    description: 'สภาผู้พิทักษ์ Deca-Key Council ทั้ง 10 โหนดลงนามสัตยาบันรับรอง Golden Image v1.2 LTS อย่างเป็นเอกฉันท์',
    category: 'events',
    icon: ShieldCheck,
    tags: ['quorum', '10/10', 'council', 'ratification', 'สภาผู้พิทักษ์'],
    status: 'UNANIMOUS 10/10',
    severity: 'success',
    timestamp: '2026-09-14 14:04:43 UTC',
  },
  {
    id: 'event-otlp-telemetry',
    title: 'OpenTelemetry OTLP Protobuf Stream Active (Port 4318)',
    subtitle: 'mTLS Cryptographic Telemetry Tunnel to National Audit Node',
    description: 'การส่งต่อข้อมูลทางมาตรวิทยาและประสิทธิภาพระบบผ่านอุโมงค์นิรภัย mTLS ไปยังศูนย์ตรวจสอบแห่งชาติอย่างต่อเนื่อง',
    category: 'events',
    icon: Radio,
    tags: ['otlp', 'telemetry', 'opentelemetry', 'protobuf', 'การส่งโทรมาตร'],
    status: 'STREAM ACTIVE',
    severity: 'info',
    timestamp: 'Live Continuous',
  },
  {
    id: 'event-zero-trust',
    title: 'Zero-Trust Write Firewall Memory Protection Armed',
    subtitle: 'Strict Read-Only Immutable Ring Enforced',
    description: 'ระบบป้องกันการเขียนทับในหน่วยความจำระดับเคอร์เนล ป้องกันการโจมตีแบบ Memory Injection และ Buffer Overflow',
    category: 'events',
    icon: ShieldAlert,
    tags: ['zero-trust', 'firewall', 'memory', 'read-only', 'เกราะป้องกันหน่วยความจำ'],
    status: 'RING-0 GUARDED',
    severity: 'success',
    timestamp: 'Active Continuous',
  },
];

interface GlobalCommandSearchProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectView?: (view: ViewType) => void;
  onExecuteLegalAction?: (actionId: string) => void;
  onShowEventDetail?: (eventItem: CommandItem) => void;
  onExportPDF?: () => void;
}

export const GlobalCommandSearch: React.FC<GlobalCommandSearchProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onSelectView,
  onExecuteLegalAction,
  onShowEventDetail,
  onExportPDF,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CommandCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inspectedItem, setInspectedItem] = useState<CommandItem | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Automatically close modal on route / HashRouter transition
  useEffect(() => {
    handleClose();
  }, [location]);

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
    setQuery('');
    setInspectedItem(null);
  };

  // Keyboard shortcut listener (Cmd+K or Ctrl+K, or slash '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (externalIsOpen !== undefined) {
          if (isModalOpen && externalOnClose) externalOnClose();
        } else {
          setInternalIsOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape' && isModalOpen) {
        if (inspectedItem) {
          setInspectedItem(null);
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, externalIsOpen, externalOnClose, inspectedItem]);

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isModalOpen]);

  // Filter commands based on query and active category
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CANONICAL_COMMANDS.filter((cmd) => {
      // Category filter
      if (activeCategory !== 'all' && cmd.category !== activeCategory) {
        return false;
      }
      // Text search
      if (!q) return true;
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSub = cmd.subtitle.toLowerCase().includes(q);
      const matchDesc = cmd.description.toLowerCase().includes(q);
      const matchTags = cmd.tags.some((t) => t.toLowerCase().includes(q));
      const matchStatute = cmd.statuteRef?.toLowerCase().includes(q) || false;
      const matchStatus = cmd.status?.toLowerCase().includes(q) || false;
      const matchId = cmd.id.toLowerCase().includes(q);

      return matchTitle || matchSub || matchDesc || matchTags || matchStatute || matchStatus || matchId;
    });
  }, [query, activeCategory]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length, activeCategory]);

  // Handle keyboard navigation inside the list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      scrollSelectedIntoView((selectedIndex + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      scrollSelectedIntoView((selectedIndex - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  // Execute selected command
  const executeCommand = (cmd: CommandItem) => {
    try {
      playTone(680, 0.05);
    } catch {
      // Optional audio
    }

    if (cmd.category === 'navigation' && cmd.targetView) {
      if (onSelectView) onSelectView(cmd.targetView);
      handleClose();
    } else if (cmd.category === 'legal') {
      if (cmd.actionPayload === 'export-dossier-pdf' && onExportPDF) {
        onExportPDF();
        handleClose();
      } else if (onExecuteLegalAction) {
        onExecuteLegalAction(cmd.id);
        setInspectedItem(cmd);
      } else {
        setInspectedItem(cmd);
      }
    } else if (cmd.category === 'events') {
      if (onShowEventDetail) {
        onShowEventDetail(cmd);
      }
      setInspectedItem(cmd);
    }
  };

  // Category counts
  const counts = useMemo(() => {
    return {
      all: CANONICAL_COMMANDS.length,
      navigation: CANONICAL_COMMANDS.filter((c) => c.category === 'navigation').length,
      legal: CANONICAL_COMMANDS.filter((c) => c.category === 'legal').length,
      events: CANONICAL_COMMANDS.filter((c) => c.category === 'events').length,
    };
  }, []);

  if (!isModalOpen) return null;

  return (
    <div
      id="global-command-search-modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-3 sm:p-4 bg-black/85 backdrop-blur-xl font-mono text-zinc-100 animate-in fade-in-0 duration-300"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl transform rounded-3xl bg-[#090d18] bg-theme-card border border-cyan-500/40 border-theme shadow-[0_0_60px_var(--shadow-glow,rgba(6,182,212,0.25))] overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in fade-in-0 slide-in-from-top-6 duration-300 ease-out text-theme"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 border-theme bg-[#070a13] bg-theme-surface">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="tracking-wide">ZYRQUEN Ω∞ GLOBAL COMMAND SEARCH</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              FROZEN v1.2
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-zinc-500">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 ml-1">↓</kbd> นำทาง
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 ml-2">↵</kbd> เลือก
            </span>
            <button
              id="btn-close-command-search"
              onClick={handleClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/40">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            id="global-command-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="ค้นหา System Events, Legal Triggers, หรือ Navigation Views..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none font-mono"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer text-xs"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 hidden sm:inline">
            ESC
          </span>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-zinc-800/60 bg-[#070a13]/80 overflow-x-auto no-scrollbar">
          <button
            type="button"
            id="tab-search-all"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-zinc-900/40 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 rounded-full bg-black/40 text-zinc-400">{counts.all}</span>
          </button>

          <button
            type="button"
            id="tab-search-navigation"
            onClick={() => setActiveCategory('navigation')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              activeCategory === 'navigation'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-zinc-900/40 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>Navigation Views</span>
            <span className="text-[10px] px-1.5 rounded-full bg-black/40 text-zinc-400">{counts.navigation}</span>
          </button>

          <button
            type="button"
            id="tab-search-legal"
            onClick={() => setActiveCategory('legal')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              activeCategory === 'legal'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-zinc-900/40 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Scale className="w-3 h-3" />
            <span>Legal Triggers</span>
            <span className="text-[10px] px-1.5 rounded-full bg-black/40 text-zinc-400">{counts.legal}</span>
          </button>

          <button
            type="button"
            id="tab-search-events"
            onClick={() => setActiveCategory('events')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              activeCategory === 'events'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900/40 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>System Events</span>
            <span className="text-[10px] px-1.5 rounded-full bg-black/40 text-zinc-400">{counts.events}</span>
          </button>
        </div>

        {/* Quick Suggestion Chips when query is empty */}
        {!query && (
          <div className="px-5 py-2 border-b border-zinc-800/40 bg-zinc-950/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-zinc-500 shrink-0 font-bold">Suggestions:</span>
            {['ETDA Sec 26', 'Dilithium-5', 'Chamber 15', 'Phoenix 35.8ms', 'Treasury ฿4.23B', '14,902 Seals', 'PDPA Sec 37'].map(
              (chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuery(chip)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-900/60 hover:bg-cyan-500/10 text-[10px] text-zinc-400 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/30 transition-all shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              )
            )}
          </div>
        )}

        {/* Main Content Area: Item List + Detail Inspector */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Result List */}
          <div
            ref={listRef}
            id="global-command-search-results"
            className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar max-h-[50vh] md:max-h-[55vh]"
          >
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = cmd.icon;

                // Category badge colors
                const categoryBadge =
                  cmd.category === 'navigation'
                    ? { label: 'VIEW', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
                    : cmd.category === 'legal'
                    ? { label: 'LEGAL', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
                    : { label: 'EVENT', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };

                return (
                  <button
                    key={cmd.id}
                    id={`search-item-${cmd.id}`}
                    type="button"
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-start justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                        : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-800/60 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon */}
                      <div
                        className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-zinc-800/70 text-zinc-400 border border-zinc-700/40'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${categoryBadge.bg}`}
                          >
                            {categoryBadge.label}
                          </span>
                          <div
                            className={`text-xs font-bold truncate transition-colors ${
                              isSelected ? 'text-cyan-200' : 'text-zinc-200'
                            }`}
                          >
                            {cmd.title}
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-400 line-clamp-1 mb-1">{cmd.subtitle}</div>

                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                          {cmd.status && (
                            <span className="px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 border border-zinc-800">
                              {cmd.status}
                            </span>
                          )}
                          {cmd.statuteRef && (
                            <span className="truncate text-purple-400/80">§ {cmd.statuteRef}</span>
                          )}
                          {cmd.timestamp && (
                            <span className="truncate text-zinc-500">⏰ {cmd.timestamp}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="shrink-0 ml-2 pt-1 flex items-center gap-1">
                      {isSelected && (
                        <span className="text-[10px] text-cyan-400 font-bold hidden sm:inline">
                          Select
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-zinc-600'
                        }`}
                      />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center">
                <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3 opacity-50" />
                <div className="text-sm font-bold text-zinc-300 mb-1">ไม่พบผลการค้นหาสำหรับ &ldquo;{query}&rdquo;</div>
                <div className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                  ลองค้นหาคำสำคัญ เช่น &ldquo;ETDA&rdquo;, &ldquo;PQC&rdquo;, &ldquo;Chamber&rdquo;, &ldquo;Phoenix&rdquo;, หรือ &ldquo;Dashboard&rdquo;
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>

          {/* Inspected Item Detail Sidebar (if item clicked / selected for inspection) */}
          {inspectedItem && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-[#070a13] p-4 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    RECORD DETAIL INSPECTOR
                  </span>
                  <button
                    onClick={() => setInspectedItem(null)}
                    className="text-zinc-500 hover:text-white text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="text-xs font-bold text-white mb-0.5">{inspectedItem.title}</div>
                  <div className="text-[11px] text-cyan-400/90 font-mono mb-2">{inspectedItem.subtitle}</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{inspectedItem.description}</p>
                </div>

                {inspectedItem.statuteRef && (
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs space-y-1">
                    <div className="text-[10px] font-bold text-purple-300">STATUTORY COMPLIANCE:</div>
                    <div className="font-mono text-[11px]">{inspectedItem.statuteRef}</div>
                  </div>
                )}

                {inspectedItem.status && (
                  <div className="flex items-center justify-between text-xs py-1 border-y border-zinc-800">
                    <span className="text-zinc-500">SSoT Status:</span>
                    <span className="text-emerald-400 font-bold font-mono">{inspectedItem.status}</span>
                  </div>
                )}

                {inspectedItem.timestamp && (
                  <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-800">
                    <span className="text-zinc-500">Recorded At:</span>
                    <span className="text-zinc-300 font-mono text-[11px]">{inspectedItem.timestamp}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-2">
                {inspectedItem.category === 'navigation' && inspectedItem.targetView && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectView && inspectedItem.targetView) {
                        onSelectView(inspectedItem.targetView);
                        handleClose();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    <span>สลับไปยังหน้านี้</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {inspectedItem.id === 'legal-pdf-export' && onExportPDF && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportPDF();
                      handleClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดพยานหลักฐานศาล (PDF)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#070a13] flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              แสดง <strong className="text-zinc-300">{filteredCommands.length}</strong> จาก{' '}
              {CANONICAL_COMMANDS.length} รายการ
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline text-zinc-400">Genesis Block #849202 (SSoT Δ0.00%)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
              100% PURE GREEN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalCommandSearch;
