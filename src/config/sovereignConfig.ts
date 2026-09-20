import { ViewType } from '@/types';
import { SystemEvent } from '@/components/SystemEventsSidebar';

export interface ViewPersona {
  name: string;
  orb1: string;
  orb2: string;
  orb3: string;
  accentGlow: string;
}

export const VIEW_PERSONAS: Record<ViewType, ViewPersona> = {
  dashboard: {
    name: 'Unified Executive Command',
    orb1: 'bg-cyan-600/10',
    orb2: 'bg-violet-600/8',
    orb3: 'bg-emerald-600/8',
    accentGlow: 'rgba(6,182,212,0.06)',
  },
  fusion: {
    name: 'Quantum Audit & Telemetry Fusion',
    orb1: 'bg-fuchsia-600/12',
    orb2: 'bg-cyan-600/10',
    orb3: 'bg-amber-500/10',
    accentGlow: 'rgba(217,70,239,0.08)',
  },
  civilization: {
    name: 'Civilization Engine & Multi-Agent Governance',
    orb1: 'bg-amber-600/14',
    orb2: 'bg-cyan-600/12',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(212,175,55,0.1)',
  },
  studio: {
    name: '3D Quantum Citadel Lattice Hologram Studio',
    orb1: 'bg-cyan-500/20',
    orb2: 'bg-purple-600/15',
    orb3: 'bg-emerald-600/15',
    accentGlow: 'rgba(6,182,212,0.12)',
  },
  unified: {
    name: 'Unified Multiverse Control Panel',
    orb1: 'bg-cyan-600/16',
    orb2: 'bg-violet-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(6,182,212,0.1)',
  },
  heatmap: {
    name: '14,902 Hardware Seals Governance Heatmap',
    orb1: 'bg-emerald-600/16',
    orb2: 'bg-teal-600/12',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(16,185,129,0.09)',
  },
  playback: {
    name: '12-Stage Forensic Trace Replay Console',
    orb1: 'bg-amber-500/15',
    orb2: 'bg-orange-600/10',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(245,158,11,0.08)',
  },
  council: {
    name: '10/10 REAL_HSM Sovereign Council',
    orb1: 'bg-amber-500/18',
    orb2: 'bg-yellow-600/12',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(245,158,11,0.09)',
  },
  production: {
    name: 'Zero-Trust Production Readiness',
    orb1: 'bg-emerald-500/16',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-teal-600/12',
    accentGlow: 'rgba(16,185,129,0.08)',
  },
  quantum: {
    name: 'Sub-Kelvin Qubit Nexus',
    orb1: 'bg-cyan-500/16',
    orb2: 'bg-sky-600/14',
    orb3: 'bg-teal-500/10',
    accentGlow: 'rgba(14,165,233,0.08)',
  },
  nexus: {
    name: 'Neural Knowledge Fabric',
    orb1: 'bg-violet-600/14',
    orb2: 'bg-fuchsia-600/10',
    orb3: 'bg-purple-600/12',
    accentGlow: 'rgba(139,92,246,0.08)',
  },
  vault: {
    name: 'Sovereign Kyber-1024 Vault',
    orb1: 'bg-amber-500/14',
    orb2: 'bg-yellow-600/10',
    orb3: 'bg-orange-600/10',
    accentGlow: 'rgba(245,158,11,0.08)',
  },
  ledger: {
    name: 'Immutable Merkle Ledger',
    orb1: 'bg-emerald-500/14',
    orb2: 'bg-teal-600/10',
    orb3: 'bg-green-600/10',
    accentGlow: 'rgba(16,185,129,0.08)',
  },
  pulse: {
    name: 'Telemetry Pulse & Heartbeat',
    orb1: 'bg-rose-500/14',
    orb2: 'bg-cyan-600/12',
    orb3: 'bg-violet-600/10',
    accentGlow: 'rgba(244,63,94,0.08)',
  },
  forge: {
    name: 'Autonomous Industrial Forge',
    orb1: 'bg-amber-500/16',
    orb2: 'bg-orange-600/14',
    orb3: 'bg-red-600/10',
    accentGlow: 'rgba(245,158,11,0.09)',
  },
  matrix: {
    name: 'Multiverse Simulation Matrix',
    orb1: 'bg-violet-600/16',
    orb2: 'bg-pink-600/12',
    orb3: 'bg-indigo-600/12',
    accentGlow: 'rgba(217,70,239,0.08)',
  },
  archive: {
    name: 'Deep Cobalt 17-Module Archive',
    orb1: 'bg-blue-600/14',
    orb2: 'bg-indigo-600/10',
    orb3: 'bg-cyan-700/10',
    accentGlow: 'rgba(37,99,235,0.08)',
  },
  console: {
    name: 'Sovereign CLI Terminal',
    orb1: 'bg-emerald-500/14',
    orb2: 'bg-green-600/12',
    orb3: 'bg-teal-600/10',
    accentGlow: 'rgba(16,185,129,0.07)',
  },
  security: {
    name: 'Zero-Trust Bastion & Shield',
    orb1: 'bg-rose-600/14',
    orb2: 'bg-red-600/12',
    orb3: 'bg-violet-600/10',
    accentGlow: 'rgba(225,29,72,0.08)',
  },
  settings: {
    name: 'Thai Sovereign Custodian Registry',
    orb1: 'bg-amber-600/12',
    orb2: 'bg-slate-600/12',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(217,119,6,0.07)',
  },
  legal: {
    name: 'Thai Sovereign Legal & PDPA Supreme Chamber',
    orb1: 'bg-blue-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(59,130,246,0.1)',
  },
  canonical: {
    name: 'Canonical Integrity Dashboard & 3D Merkle Topology',
    orb1: 'bg-emerald-600/18',
    orb2: 'bg-cyan-600/15',
    orb3: 'bg-amber-600/12',
    accentGlow: 'rgba(16,185,129,0.12)',
  },
  admin: {
    name: 'Sovereign Admin Console & Role-Based Access Control',
    orb1: 'bg-cyan-600/18',
    orb2: 'bg-indigo-600/14',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(6,182,212,0.1)',
  },
  analytics: {
    name: 'Audit Analytics & UTC Telemetry Volatility Dashboard',
    orb1: 'bg-emerald-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-rose-600/10',
    accentGlow: 'rgba(16,185,129,0.1)',
  },
  chambers: {
    name: '18 Sovereign Chambers Control Plane',
    orb1: 'bg-indigo-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(99,102,241,0.12)',
  },
  audithistory: {
    name: 'Audit History & Cryptographic Snapshot Records',
    orb1: 'bg-emerald-600/18',
    orb2: 'bg-teal-600/14',
    orb3: 'bg-cyan-600/12',
    accentGlow: 'rgba(16,185,129,0.12)',
  },
  securitypipeline: {
    name: '3-Tier Sovereign Security Pipeline & Threat Gauge',
    orb1: 'bg-emerald-600/20',
    orb2: 'bg-cyan-600/16',
    orb3: 'bg-teal-600/12',
    accentGlow: 'rgba(16,185,129,0.15)',
  },
  briefing: {
    name: 'Executive & Court Admissible Briefing',
    orb1: 'bg-amber-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(212,175,55,0.12)',
  },
  'sovereign-wallet': {
    name: 'Sovereign Wallet & WebAuthn Key Dispatcher',
    orb1: 'bg-amber-600/18',
    orb2: 'bg-yellow-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(212,175,55,0.12)',
  },
};

export const VALID_VIEWS: ViewType[] = [
  'dashboard',
  'civilization',
  'studio',
  'unified',
  'heatmap',
  'production',
  'council',
  'quantum',
  'nexus',
  'vault',
  'ledger',
  'pulse',
  'forge',
  'matrix',
  'archive',
  'console',
  'security',
  'settings',
  'legal',
  'canonical',
  'admin',
  'analytics',
  'chambers',
  'fusion',
  'playback',
  'audithistory',
  'securitypipeline',
  'briefing',
  'sovereign-wallet',
];

export interface LegalTriggerItem {
  id: string;
  act: string;
  section: string;
  title: string;
  titleTh: string;
  status: 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED';
  statusText: string;
  pqcScheme: string;
  anchor: string;
  description: string;
  descriptionTh: string;
  statuteClause: string;
}

export const ETDA_PDPA_TRIGGERS: LegalTriggerItem[] = [
  {
    id: 'etda-sec-09',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๙ (Section 9)',
    title: 'Electronic Signature Legal Enforceability',
    titleTh: 'การรับรองผลทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์',
    status: 'PASS',
    statusText: '100% ENFORCED',
    pqcScheme: 'FIPS 204 ML-DSA-87 (Dilithium-5)',
    anchor: 'Sovereign Principal #EP-SOVEREIGN-01',
    description: 'Binds undeniable cryptographic intent and signatory identity to every transaction and seal creation without relying on blind trust.',
    descriptionTh: 'รับรองผลการลงลายมือชื่อดิจิทัล ไม่สามารถปฏิเสธความรับผิดชอบได้ ผูกพันทางกฎหมายเทียบเท่าลายมือชื่อบนกระดาษ',
    statuteClause: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙'
  },
  {
    id: 'etda-sec-26',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๒๖ (Section 26)',
    title: 'Reliable Electronic Signature Standards',
    titleTh: 'มาตรฐานลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้',
    status: 'PASS',
    statusText: 'FIPS 140-3 L4',
    pqcScheme: 'Deca-Custodian Dual-Plane Matrix',
    anchor: '10/10 REAL_HSM Enclave Quorum',
    description: 'Guarantees that signature creation data remains under the exclusive control of signatories and detects any post-signing alterations.',
    descriptionTh: 'ข้อมูลสำหรับใช้สร้างลายมือชื่ออยู่ภายใต้การควบคุมของผู้ลงลายมือชื่อโดยแท้จริง ตรวจพบการเปลี่ยนแปลงของข้อมูลได้ทุกกรณี',
    statuteClause: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖ (ETDA Level 3+)'
  },
  {
    id: 'etda-sec-28',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๒๘ (Section 28)',
    title: 'Certification Authority & Evidence Admissibility',
    titleTh: 'หน้าที่ของผู้ให้บริการออกใบรับรองและการรับฟังพยานหลักฐาน',
    status: 'PASS',
    statusText: 'IMMUTABLE WORM',
    pqcScheme: 'Zero-Drift Merkle Tree Anchor',
    anchor: 'Block #849202 Canonical Root',
    description: 'Maintains tamper-evident certification records admissible in judicial proceedings under ISO/IEC 27037 standards.',
    descriptionTh: 'จัดทำและเก็บรักษาบันทึกข้อมูลใบรับรองที่ไม่สามารถแก้ไขย้อนหลังได้ เพื่อใช้เป็นพยานหลักฐานในชั้นศาลตามกฎหมายไทย',
    statuteClause: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘ (และ ๒๙)'
  },
  {
    id: 'pdpa-sec-09',
    act: 'PDPA B.E. 2562',
    section: 'มาตรา ๙ (Section 9)',
    title: 'Territorial Scope & Sovereign Extraterritorial Jurisdiction',
    titleTh: 'ขอบเขตการบังคับใช้นอกราชอาณาจักรและอธิปไตยข้อมูล',
    status: 'PASS',
    statusText: 'SOVEREIGN BOUND',
    pqcScheme: 'Air-Gapped Sovereign Node Grid',
    anchor: 'Kingdom of Thailand Jurisdiction',
    description: 'Enforces data protection duties on collection, use, or disclosure of personal data regardless of physical server location.',
    descriptionTh: 'มีผลบังคับใช้กับการประมวลผลข้อมูลส่วนบุคคลของบุคคลในราชอาณาจักรไทย แม้ผู้ควบคุมข้อมูลจะอยู่นอกราชอาณาจักร',
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๙'
  },
  {
    id: 'pdpa-sec-26',
    act: 'PDPA B.E. 2562',
    section: 'มาตรา ๒๖ (Section 26)',
    title: 'Sensitive Personal Data Quantum Vault Protection',
    titleTh: 'การคุ้มครองข้อมูลส่วนบุคคลอ่อนไหวด้วยห้องนิรภัยควอนตัม',
    status: 'PASS',
    statusText: 'CRYO 14.98 mK',
    pqcScheme: 'FIPS 203 ML-KEM-1024 / SPHINCS+',
    anchor: 'Chamber 08 PQC Enclave',
    description: 'Provides quantum-proof encapsulation for sensitive records, biometric telemetry, and executive keys against post-quantum decrypt-later attacks.',
    descriptionTh: 'เข้ารหัสข้อมูลอ่อนไหวด้วยอัลกอริทึมแลตทิซและฟังก์ชันแฮชไร้สถานะ ป้องกันการถอดรหัสในอนาคตด้วยคอมพิวเตอร์ควอนตัม',
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๒๖'
  },
  {
    id: 'pdpa-sec-28',
    act: 'PDPA B.E. 2562',
    section: 'มาตรา ๒๘ (Section 28)',
    title: 'Cross-Border Sovereign Safeguard Boundaries',
    titleTh: 'มาตรการคุ้มครองการส่งหรือโอนข้อมูลข้ามพรมแดน',
    status: 'PASS',
    statusText: 'ISOLATED ENCLAVE',
    pqcScheme: 'Sovereign Multi-Mesh Gateway',
    anchor: 'Bangkok Command & Regional Nodes',
    description: 'Guarantees destination country adequacy standard and prevents unauthorized exfiltration beyond the sovereign enclave boundary.',
    descriptionTh: 'รับประกันมาตรฐานความคุ้มครองข้อมูลส่วนบุคคลของปลายทาง ป้องกันการรั่วไหลออกนอกเครือข่ายอธิปไตยไทย',
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๒๘'
  }
];

export const TRIGGER_PQC_HASHES: Record<string, string> = {
  'etda-sec-09': '0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
  'etda-sec-26': '0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8',
  'etda-sec-28': '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  'pdpa-sec-09': '0x7b2274785f6964223a22534f562d4a554d502d343436222c22617574686f72223a224550227d',
  'pdpa-sec-26': '0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
  'pdpa-sec-28': '0xdeadbeef00112233445566778899aabbccddeeff112233445566778899aabbcc',
};

export const INITIAL_SYSTEM_EVENTS: SystemEvent[] = [
  {
    id: 'evt-evidence-tnt',
    type: 'EVIDENCE_IMPORTED',
    title: 'Evidence Ingested: TNT-TH-001 (Tenant Manifest)',
    description: 'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Isolation: Tenant-isolated (MAEW HOLDINGS CO., LTD.) | Canonical write: BLOCKED',
    timestamp: '05:06:01 ICT',
    metaHash: 'source:TNT-TH-001 (Digest: NOT COMPUTED)',
    statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
    targetView: 'dashboard',
    severity: 'info',
  },
  {
    id: 'evt-evidence-fios',
    type: 'EVIDENCE_IMPORTED',
    title: 'Evidence Ingested: DS-901-PILOT (FIOS Pilot Dataset)',
    description: 'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Classification: Non-live pilot dataset | Canonical write: BLOCKED',
    timestamp: '05:06:02 ICT',
    metaHash: 'source:DS-901-PILOT (Digest: NOT COMPUTED)',
    statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
    targetView: 'dashboard',
    severity: 'info',
  },
  {
    id: 'evt-000',
    type: 'COMPLIANCE',
    title: 'Thai Electronic Transactions Act (Sec 9, 26, 28) Bound',
    description: 'Sovereign Seal Chain runtime anchored to ETDA Level 3+ standards and Passport #EP-SOVEREIGN-01.',
    timestamp: '05:01:22 ICT',
    statuteRef: 'มาตรา 9, 26, 28 (ETDA Level 3+)',
    targetView: 'security',
    severity: 'success',
  },
  {
    id: 'evt-001',
    type: 'CRYPTO',
    title: 'Sovereign Genesis Block #849202 Sealed',
    description: 'Merkle Root 909ab814...fa4c68 anchored with 14,902 cryptographic certificates.',
    timestamp: '05:03:08 ICT',
    metaHash: 'sha256:909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
    statuteRef: 'มาตรา 26: ลายมือชื่อดิจิทัลที่เชื่อถือได้',
    targetView: 'security',
    severity: 'success',
  },
  {
    id: 'evt-002',
    type: 'HARDWARE',
    title: 'Hardware Cryostat Chamber Stabilized',
    description: 'Sub-Kelvin base temperature locked at 12.4 mK with 0.9997 coherence ratio.',
    timestamp: '05:04:12 ICT',
    metaHash: 'qstate:768Q_COHERENCE_99.97PCT',
    severity: 'info',
  },
  {
    id: 'evt-003',
    type: 'COMPLIANCE',
    title: 'PDPA Thailand Compliance Pre-Flight Verified',
    description: 'Sections 19, 27, 37 validated against Thai Sovereign Custodian Passport #EP-SOVEREIGN-01.',
    timestamp: '05:05:30 ICT',
    statuteRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA Sec 37)',
    targetView: 'security',
    severity: 'success',
  },
];

export const TELEMETRY_AUDIT_INTERVAL_SEC = 30;
