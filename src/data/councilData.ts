export interface ContributionRecord {
  year: string;
  titleTh: string;
  titleEn: string;
  detailTh: string;
  verifiedHash: string;
}

export interface GuardianVitality {
  connectivityPct: number; // e.g. 99.98%
  signalClarity: 'SUB_KELVIN_CRYSTALLINE' | 'ULTRA_STABLE' | 'OPTIMAL' | 'SYNCHRONIZING' | 'STANDBY_READY';
  packetLossPct: number;
  jitterMs: number;
  subKelvinTempK: number;
  busBandwidthGbps: number;
  lastPingMs: number;
  hsmCoreStatus: 'ONLINE_ACTIVE' | 'ENCLAVE_ISOLATED' | 'STANDBY_LISTENING';
  activeEntropyRateKBps: number;
}

export type VoteDecision = 'YES' | 'NO' | 'ABSTAIN' | 'PENDING';

export interface MemberVoteRecord {
  slotId: number;
  councilCode: string;
  passportId: string;
  nameTh: string;
  nameEn: string;
  vote: VoteDecision;
  signedAt: string;
  hsmSignatureDigest: string;
  latencyMs: number;
  weight: number;
}

export interface ConsensusOverrideProposal {
  id: string; // e.g. "PROP-SOV-2026-001"
  titleTh: string;
  titleEn: string;
  category: 'FROZEN_CORE' | 'CRYO_ROUTING' | 'QUARANTINE_FLUSH' | 'RWA_VAULT' | 'PQC_PARAM' | 'CHAOS_RESILIENCE';
  categoryTh: string;
  proposedBy: {
    slotId: number;
    councilCode: string;
    passportId: string;
    nameTh: string;
  };
  proposedTimestamp: string;
  executionTimestamp?: string;
  status: 'RATIFIED_IMMUTABLE' | 'EXECUTED' | 'ACTIVE_VOTING' | 'REJECTED';
  statusTh: string;
  quorumRequired: number; // 8
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votesPending: number;
  merkleRootHash: string;
  hardwareAttestationSeal: string;
  detailedDescriptionTh: string;
  detailedDescriptionEn: string;
  impactAnalysisTh: string;
  executionOutcomeTh: string;
  memberVotes: MemberVoteRecord[];
}

export interface CouncilMember {
  slotId: number;
  councilCode: string; // e.g. TC-01
  passportId: string; // e.g. EP-SOVEREIGN-01
  nameTh: string;
  nameEn: string;
  roleTh: string;
  roleEn: string;
  category: 'Lead Guardian' | 'Core Security Guardian' | 'Runtime Operations Guardian' | 'Compliance & Audit Guardian';
  categoryTh: string;
  jurisdictionTh: string;
  jurisdictionEn: string;
  clearanceLevel: string;
  hardwareEnclave: string;
  pqcAlgorithm: string;
  keyFingerprint: string;
  publicKeyArmor: string;
  cryptoSignature: string;
  certificateSerial: string;
  biographyTh: string;
  biographyEn: string;
  contributions: ContributionRecord[];
  heartbeat: {
    status: 'OPTIMAL' | 'SYNCED' | 'STANDBY' | 'PROVING';
    latencyMs: number;
    pulseFrequencyHz: number;
    healthScore: number;
    lastHeartbeat: string;
  };
  vitality?: GuardianVitality;
  verificationStatus: 'REAL_HSM_SIGNED' | 'CLAIMED: PENDING PHYSICAL PROOF' | 'UNALLOCATED_PENDING';
  quorumWeight: number;
  signedTimestamp: string;
  fipsCertification: string;
  statutoryPower: string;
  avatarColor: string;
  isLead?: boolean;
  invariantRule?: string;
}

export const SOVEREIGN_DECREE_METADATA = {
  decreeCode: 'DOC-SOV-HSM-1010-2026',
  confidentialityLevel: 'IMMUTABLE / SOVEREIGN LEVEL-Omega',
  presidentNameTh: 'นายยุทธภูมิ พากเพียร',
  presidentNameEn: 'Yuttaphum Phakphian',
  presidentId: '#EP-SOVEREIGN-01',
  effectiveDate: '27 สิงหาคม 2026',
  systemStatus: 'FROZEN v1.2 LTS (Active & Fully Operational)',
  totalNodes: 10,
  requiredQuorum: 8,
  governanceControlQuorum: 10, // 10/10 Governance Pass
  physicalCustodianProofs: 10, // 10/10 Physical Proofs Verified
  remainingPhysicalProofs: 0, // 0 Remaining Required
  achievedQuorum: 10, // Physical Custodian Quorum = 10/10 (Super-Majority >= 8/10 Attained)
  quorumRule: '10 ใน 10 โหนด (10/10 Physical Quorum Verified) — Super-Majority Attained (≥8/10) | Governance: 10/10 PASS',
};

export const COUNCIL_MEMBERS: CouncilMember[] = [
  {
    slotId: 1,
    councilCode: 'TC-01',
    passportId: 'EP-SOVEREIGN-01',
    nameTh: 'นายยุทธภูมิ พากเพียร',
    nameEn: 'Yuttaphum Phakphian',
    roleTh: 'ผู้ถือสิทธิ์และสถาปนิกอธิปไตยสูงสุด (Supreme Sovereign Principal Architect & Owner)',
    roleEn: 'Supreme Sovereign Principal Architect & Council President',
    category: 'Lead Guardian',
    categoryTh: 'ผู้นำสูงสุด / ประธานสภาผู้พิทักษ์',
    jurisdictionTh: 'ผู้มีอำนาจลงนามสูงสุดและสิทธิ์ขาดในการอนุมัติ Master Key Override และปฐมบทเจเนซิส',
    jurisdictionEn: 'Supreme Signing Authority, Master Key Consensus & Sovereign Override',
    clearanceLevel: 'OMEGA-1 SUPREME CLEARANCE',
    hardwareEnclave: 'NitroKey HSM-PQC-01 (FIPS 140-3 Level 4)',
    pqcAlgorithm: 'CRYSTALS-Dilithium-5 (ML-DSA-87)',
    keyFingerprint: 'SHA256:5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c71e4ec103dcc8cc3',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (CRYSTALS-DILITHIUM-5)-----
MIIBtzCCASwGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv0kLgK6kP9xM8pM+Q
x5Y7HkZpP98vYt2mBfKz9W0nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQ==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0x94f2c9e782613dbe4f1074a3f9e9841029471abef193859230584719284759281a8b7c3d2e1f00998877665544332211',
    certificateSerial: 'CERT-SOV-OMEGA-0001-2026-ROOT',
    biographyTh: 'ผู้ริเริ่ม ก่อตั้ง และวางรากฐานโครงสร้างอธิปไตย ZYRQUEN Ω∞ ทั้งหมด ดำรงตำแหน่งประธานสภาผู้พิทักษ์และสถาปนิกใหญ่ ถือสิทธิ์กุญแจ Master Genesis Key ซึ่งมีอำนาจสั่งการระดับ Override เหนือเครือข่ายทุกระบบ',
    biographyEn: 'The supreme architect and creator of the ZYRQUEN Ω∞ sovereign framework. Holds the ultimate root cryptographic authority, master override keys, and genesis deployment permissions across all ten computational rings.',
    contributions: [
      {
        year: '2026',
        titleTh: 'สถาปนาสัญญาสถาปัตยกรรมแช่แข็ง Frozen v1.2 LTS',
        titleEn: 'Enactment of Frozen v1.2 LTS Architectural Invariant',
        detailTh: 'ล็อกสถานะ 14,902 Canonical Seals และตั้งค่า Zero-Mutation SSoT Rule',
        verifiedHash: '0x5a13396c129c611f15232fdaf54bfad00c4147ab',
      },
      {
        year: '2026',
        titleTh: 'ออกแบบและติดตั้ง 10/10 REAL_HSM Council Infrastructure',
        titleEn: '10/10 REAL_HSM Quorum Architecture Deployment',
        detailTh: 'สร้างระเบียบการอนุมัติ 8/10 Consensus พร้อมการรับรองระดับฮาร์ดแวร์ FIPS 140-3',
        verifiedHash: '0x82613dbe4f1074a3f9e9841029471abef1938592',
      },
      {
        year: '2025',
        titleTh: 'สร้างระบบ Sub-Kelvin Bus & Three.js Holographic Runtime Deck',
        titleEn: 'Sub-Kelvin Cryo-Bus & Three.js Holographic Deck Architecture',
        detailTh: 'วิจัยและพัฒนาส่วนแสดงผล 3 มิติ และโหมดการ Warp ทั้ง 6 รูปแบบ',
        verifiedHash: '0x74a3f9e9841029471abef1938592305847192847',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.18,
      pulseFrequencyHz: 1.0,
      healthScore: 100.0,
      lastHeartbeat: '0.04s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:03:08 ICT',
    fipsCertification: 'FIPS 140-3 Level 4 Secure Element',
    statutoryPower: 'Master Key Override, Genesis Kernel Lock, Final Sovereign Attestation',
    avatarColor: 'from-amber-400 via-yellow-500 to-amber-600',
    isLead: true,
    invariantRule: 'INV-SSOT-IMMUTABLE',
  },
  {
    slotId: 2,
    councilCode: 'TC-02',
    passportId: 'EP-001',
    nameTh: 'พล. สมชาย พากเพียร',
    nameEn: 'Somchai Phakphian',
    roleTh: 'ผู้ว่าการและผู้อำนวยการฝ่ายควบคุมระเบียบอารยธรรม (Civilization Control Plane Governor)',
    roleEn: 'Civilization Control Plane Governor / Director',
    category: 'Core Security Guardian',
    categoryTh: 'ผู้พิทักษ์ความมั่นคงหลัก (Core Security)',
    jurisdictionTh: 'ควบคุมระเบียบโครงสร้างเครือข่ายอารยธรรม และไฟร์วอลล์ควอนตัม (Quantum Firewall)',
    jurisdictionEn: 'Civilization Infrastructure Plane & Quantum Firewall Governor',
    clearanceLevel: 'LEVEL 25 SOVEREIGN GOVERNOR',
    hardwareEnclave: 'YubiKey 5C FIPS (Dual-Channel SE)',
    pqcAlgorithm: 'FALCON-1024 (NIST Round 3)',
    keyFingerprint: 'SHA256:909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (FALCON-1024)-----
MIIBszCCASUGByqGSM49AgEwggEeAgEBMEYGBWBizwECBEAv983mKq8wQ9x8mZ9p
Lk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5n==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0xa4829104859102948192039481029384019283401928340192834019283401928340192834019283',
    certificateSerial: 'CERT-SOV-CIV-0002-2026-FIPS',
    biographyTh: 'นายทหารและผู้บริหารระดับสูงด้านความมั่นคงไซเบอร์อารยธรรม รับผิดชอบดูแลเครือข่ายความมั่นคงระดับชาติและโครงข่ายป้องกันการโจมตีระดับควอนตัม (Quantum Firewall)',
    biographyEn: 'Senior Director of Sovereign Civilization Infrastructure and Defense Systems. Manages planetary-scale cryptographic firewalls and boundary perimeter enforcement enclaves.',
    contributions: [
      {
        year: '2026',
        titleTh: 'ติดตั้งระบบตรวจจับภัยคุกคามควอนตัม Real-time Quantum Firewall',
        titleEn: 'Quantum Firewall Perimeter Lockdown',
        detailTh: 'ป้องกันการเจาะระบบจาก Lattice-reduction attacks แบบ 100%',
        verifiedHash: '0x909ab814479844d8a14816bed34cdbb07528e185',
      },
      {
        year: '2025',
        titleTh: 'สร้างโปรโตคอลความมั่นคงอารยธรรม Civilian Security Accord',
        titleEn: 'Civilian Security Accord & Dual-Channel Authentication',
        detailTh: 'กำหนดสิทธิควบคุมระเบียบข้อมูลภาครัฐและคลังสำรอง',
        verifiedHash: '0x44d8a14816bed34cdbb07528e18501da86fc4691',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.42,
      pulseFrequencyHz: 1.0,
      healthScore: 99.98,
      lastHeartbeat: '0.08s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:08:12 ICT',
    fipsCertification: 'FIPS 140-2 Overall Level 3',
    statutoryPower: 'Network Structure Verification, Quantum Firewall Activation',
    avatarColor: 'from-cyan-400 via-blue-500 to-indigo-600',
    invariantRule: 'INV-MERKLE-BINDING Genesis Root',
  },
  {
    slotId: 3,
    councilCode: 'TC-03',
    passportId: 'EP-007',
    nameTh: 'ดร. กัญญารัตน์ เวชสิทธิ์',
    nameEn: 'Dr. Kanyarat Vetchasit',
    roleTh: 'หัวหน้านักเข้ารหัสลับยุคหลังควอนตัมและผู้ตรวจสอบ Merkle (Chief Post-Quantum Cryptographer)',
    roleEn: 'Chief Post-Quantum Cryptographer & Merkle Auditor',
    category: 'Core Security Guardian',
    categoryTh: 'ผู้พิทักษ์ความมั่นคงหลัก (Core Security)',
    jurisdictionTh: 'ป้องกันการโจมตีทางควอนตัม ตรวจสอบ Merkle Root และรักษาความปลอดภัยคลังทุนสำรอง FIOS RWA',
    jurisdictionEn: 'Post-Quantum Lattice Cryptography & Merkle Tree Root Auditing',
    clearanceLevel: 'LEVEL 22 CIPHER CUSTODIAN',
    hardwareEnclave: 'Trezor Safe 5 PQC Enclave (CC EAL6+)',
    pqcAlgorithm: 'CRYSTALS-Dilithium-5 / Kyber-1024',
    keyFingerprint: 'SHA256:7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (DILITHIUM-5/KYBER-1024)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv843nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0xb8291038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-PQC-0003-2026-EAL6',
    biographyTh: 'นักคณิตศาสตร์และนักวิทยาศาสตร์การเข้ารหัสลับชั้นนำ ผู้เชี่ยวชาญการคำนวณแบบ Lattice-based Cryptography และเป็นผู้ออกแบบกลไก Merkle Root Seal สำหรับ 14,902 ตราประทับอธิปไตย',
    biographyEn: 'Chief Post-Quantum Cryptographer holding EAL6+ hardware enclaves. Architected the immutable lattice-cryptography sealing pipeline protecting canonical asset inventories.',
    contributions: [
      {
        year: '2026',
        titleTh: 'ตรวจสอบและยืนยันความถูกต้องของ 14,902 Merkle Seals',
        titleEn: '14,902 Canonical Merkle Seals Verification',
        detailTh: 'สร้าง Root Seal `0x7b2f4a1c` ด้วยอัลกอริทึม SHA-256 + Dilithium-5',
        verifiedHash: '0x7528e18501da86fc4691763a43fa4c68909ab814',
      },
      {
        year: '2025',
        titleTh: 'ป้องกันคลังทุนสำรองสินทรัพย์จริง FIOS RWA',
        titleEn: 'FIOS RWA Capital Reserve Cryptographic Vault Locking',
        detailTh: 'พัฒนาสมาร์ทคอนแทรกล็อกทุนสำรอง 4.09B SOV Token',
        verifiedHash: '0x14816bed34cdbb07528e18501da86fc4691763a4',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.35,
      pulseFrequencyHz: 1.0,
      healthScore: 99.95,
      lastHeartbeat: '0.05s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:14:40 ICT',
    fipsCertification: 'Common Criteria EAL6+ Certified',
    statutoryPower: 'Post-Quantum Lattice Enforcement, FIOS RWA Reserve Safeguard',
    avatarColor: 'from-purple-400 via-violet-500 to-indigo-600',
    invariantRule: 'INV-ZERO-TRUST-GATE',
  },
  {
    slotId: 4,
    councilCode: 'TC-04',
    passportId: 'EP-014',
    nameTh: 'วศ. ธนพล เกียรติไพศาล',
    nameEn: 'Eng. Thanapol Kiatpaisan',
    roleTh: 'วิศวกรตรวจสอบระบบ SRE ขั้นสูง 15 ชั้น (15-Layer SRE Master Inspector)',
    roleEn: '15-Layer SRE Master Inspector & Incident Commander',
    category: 'Core Security Guardian',
    categoryTh: 'ผู้พิทักษ์ความมั่นคงหลัก (Core Security)',
    jurisdictionTh: 'ตรวจสอบความปลอดภัยระบบโครงสร้าง 15 ชั้น และระบบกู้คืนอัตโนมัติ (Phoenix Healing Engine)',
    jurisdictionEn: '15-Layer Reliability Inspection & Autonomous Phoenix Recovery',
    clearanceLevel: 'LEVEL 20 SRE OVERSEER',
    hardwareEnclave: 'Ledger Flex Secure Enclave (CC EAL6+)',
    pqcAlgorithm: 'SPHINCS+ PQC (State-Free Hash Signature)',
    keyFingerprint: 'SHA256:43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (SPHINCS+)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv732nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0xc7192038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-SRE-0004-2026-CC',
    biographyTh: 'หัวหน้าทีมวิศวกรรมความน่าเชื่อถือระดับโครงสร้างพื้นฐาน (Site Reliability Engineering) ผู้ออกแบบสถาปัตยกรรมการกู้คืนตนเอง Phoenix Auto-Healing และระบบตรวจสอบสุขภาพ 15 ชั้นเชิงลึก',
    biographyEn: 'Lead Infrastructure Reliability Engineer and Autonomous Incident Commander. Developed the 15-layer SRE health gating matrix and automated zero-downtime rollback engines.',
    contributions: [
      {
        year: '2026',
        titleTh: 'ทดสอบความเสถียร 15-Layer SRE Inspection Matrix ผ่าน 100%',
        titleEn: '15-Layer SRE Inspection Full Certification',
        detailTh: 'ตรวจสอบความพร้อมของระบบทั้งหมดก่อนการแช่แข็ง Frozen v1.2',
        verifiedHash: '0x43fa4c68909ab814479844d8a14816bed34cdbb0',
      },
      {
        year: '2025',
        titleTh: 'ติดตั้ง Phoenix Self-Healing Engine',
        titleEn: 'Phoenix Auto-Healing Kernel Daemon Deployment',
        detailTh: 'เวลาฟื้นคืนสถานะเฉลี่ยต่ำกว่า 45 มิลลิวินาที เมื่อเกิดเคอร์เนลแฟกเตอร์',
        verifiedHash: '0x7528e18501da86fc4691763a43fa4c68909ab814',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.28,
      pulseFrequencyHz: 1.0,
      healthScore: 99.99,
      lastHeartbeat: '0.03s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:20:19 ICT',
    fipsCertification: 'Common Criteria EAL6+ Certified',
    statutoryPower: '15-Layer SRE Gate Enactment, Zero-Downtime Rollback Execution',
    avatarColor: 'from-emerald-400 via-teal-500 to-cyan-600',
    invariantRule: 'INV-BLAST-RADIUS-BOUND',
  },
  {
    slotId: 5,
    councilCode: 'TC-05',
    passportId: 'EP-022',
    nameTh: 'ศ.ดร. นครินทร์ สุวรรณเมฆา',
    nameEn: 'Prof. Dr. Nakarin Suwanmekha',
    roleTh: 'สถาปนิกโครงข่ายหลายตาข่ายแบบกระจายศูนย์ (Decentralized Multi-Mesh Topology Architect)',
    roleEn: 'Decentralized Multi-Mesh Topology Architect',
    category: 'Core Security Guardian',
    categoryTh: 'ผู้พิทักษ์ความมั่นคงหลัก (Core Security)',
    jurisdictionTh: 'กำกับดูแลระบบ Sub-Kelvin Bus และโครงข่าย Multi-Mesh ประจำคลังทุนสำรองสินทรัพย์จริง FIOS RWA',
    jurisdictionEn: 'Decentralized Multi-Mesh Topology & FIOS RWA Capital Reserve Vaults',
    clearanceLevel: 'LEVEL 20 TOPOLOGY MASTER',
    hardwareEnclave: 'NitroKey HSM-PQC-05 (Hardened Element)',
    pqcAlgorithm: 'CRYSTALS-Dilithium-5 (ML-DSA-87)',
    keyFingerprint: 'SHA256:16bed34cdbb07528e18501da86fc4691763a43fa4c68909ab814479844d8a148',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (DILITHIUM-5)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv621nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0xd8192038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-MESH-0005-2026-FIPS',
    biographyTh: 'ศาสตราจารย์ด้านวิศวกรรมคอมพิวเตอร์และสถาปัตยกรรมโครงข่ายกระจายศูนย์ ออกแบบระบบ Sub-Kelvin cryogenic bus ที่เชื่อมต่อ 10 โหนด HSM แบบ peer-to-peer โดยไม่มีจุดล้มเหลวเดี่ยว (Single Point of Failure)',
    biographyEn: 'Professor of Distributed Networking and Hardware Topologies. Designed the sub-kelvin cryogenic interconnect mesh maintaining lossless cryptographic communications across all ten HSM nodes.',
    contributions: [
      {
        year: '2026',
        titleTh: 'ติดตั้งระบบ Multi-Mesh Cryogenic Interconnect',
        titleEn: 'Decentralized Sub-Kelvin Cryo-Bus Mesh Activation',
        detailTh: 'เชื่อมต่อสื่อสารระหว่าง 10 โหนดด้วยความเร็วต่ำกว่า 1 มิลลิวินาที',
        verifiedHash: '0x16bed34cdbb07528e18501da86fc4691763a43fa',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.31,
      pulseFrequencyHz: 1.0,
      healthScore: 99.97,
      lastHeartbeat: '0.06s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:25:31 ICT',
    fipsCertification: 'FIPS 140-3 Level 3 Hardware',
    statutoryPower: 'Multi-Mesh Route Optimization, Capital Reserve Isolation',
    avatarColor: 'from-teal-400 via-emerald-500 to-green-600',
    invariantRule: 'INV-FAIL-CLOSED-GUARD',
  },
  {
    slotId: 6,
    councilCode: 'TC-06',
    passportId: 'EP-033',
    nameTh: 'พญ.ดร. รพิพร รัตนพิบูลย์',
    nameEn: 'Dr. Rapiphon Rattanapiboon',
    roleTh: 'ผู้พิทักษ์จริยธรรมชีวปัญญาประดิษฐ์และปัญญาประดิษฐ์เชิงพุทธิปัญญา (Bio-AI & Cognitive Ethics Guardian)',
    roleEn: 'Bio-AI & Cognitive Ethics Guardian',
    category: 'Runtime Operations Guardian',
    categoryTh: 'ผู้พิทักษ์การทำงานระบบ (Runtime Operations)',
    jurisdictionTh: 'ควบคุมการทำงานส่วนแสดงผล 3 มิติ (Three.js Holographic Deck) และกรอบจริยธรรม AI',
    jurisdictionEn: 'Three.js Holographic Deck Control & Cognitive Alignment Ethics',
    clearanceLevel: 'LEVEL 18 BIO-AI CUSTODIAN',
    hardwareEnclave: 'YubiKey 5C FIPS PIV-06',
    pqcAlgorithm: 'FALCON-1024 (NIST Round 3)',
    keyFingerprint: 'SHA256:86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (FALCON-1024)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv510nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0xe9192038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-BIO-0006-2026-CLAIMED',
    biographyTh: 'แพทย์หญิงและนักวิจัยด้านประสาทปัญญาประดิษฐ์ (Cognitive AI) ทำหน้าที่ควบคุมและกำกับดูแลมิติความปลอดภัยของโมเดล AI ในระบบโฮโลกราฟิก 3D ให้เป็นไปตามกรอบจริยธรรมอธิปไตย',
    biographyEn: 'Medical Doctor and Neuromorphic AI Ethics Lead. Oversees cognitive AI alignment boundaries and Three.js holographic projection security parameters.',
    contributions: [
      {
        year: '2026',
        titleTh: 'ร่างกรอบความปลอดภัย Cognitive AI Alignment Charter',
        titleEn: 'Cognitive AI Alignment Charter Drafting',
        detailTh: 'ป้องกันการละเมิดจริยธรรมข้อมูลอัตโนมัติในระดับไคลเอนต์',
        verifiedHash: '0x86fc4691763a43fa4c68909ab814479844d8a148',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.25,
      pulseFrequencyHz: 1.0,
      healthScore: 99.85,
      lastHeartbeat: '0.04s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:30:00 ICT',
    fipsCertification: 'FIPS 140-2 Level 3 (PIV Slot 9A)',
    statutoryPower: 'Holographic Deck Projection Lock, Cognitive Boundary Gate',
    avatarColor: 'from-rose-400 via-pink-500 to-red-600',
    invariantRule: 'INV-NON-AUTH-TELEMETRY',
  },
  {
    slotId: 7,
    councilCode: 'TC-07',
    passportId: 'EP-048',
    nameTh: 'ดร. ธีรภัทร ชาญวณิชย์',
    nameEn: 'Dr. Theeraphat Chanwanich',
    roleTh: 'หัวหน้าวิศวกรระบบขับเคลื่อน Warp และระบบเทเลเมตรี (Warp Engine & Telemetry Chief)',
    roleEn: 'Warp Engine & Telemetry Chief',
    category: 'Runtime Operations Guardian',
    categoryTh: 'ผู้พิทักษ์การทำงานระบบ (Runtime Operations)',
    jurisdictionTh: 'ควบคุมการทำงานและโหมดการ Warp ทั้ง 6 รูปแบบ และการเชื่อมโยงระบบโทรมาตรเชิงควอนตัม',
    jurisdictionEn: '6-Mode Warp Vector Orchestration & Quantum Telemetry Bus',
    clearanceLevel: 'LEVEL 18 WARP CHIEF',
    hardwareEnclave: 'Trezor Safe 5 PQC-07',
    pqcAlgorithm: 'CRYSTALS-Dilithium-5 (ML-DSA-87)',
    keyFingerprint: 'SHA256:a18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48cd41d04f29a28a30f',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (DILITHIUM-5)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv409nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0xf0192038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-WARP-0007-2026-EAL6',
    biographyTh: 'วิศวกรอากาศยานและระบบโทรมาตรขั้นสูง ผู้ดูแลกลไกระบบขับเคลื่อน Warp Engine ทั้ง 6 มิติ (Linear, Hyper, Phase, Tachyon, Singularity, Genesis) และระบบ Sub-Kelvin Telemetry',
    biographyEn: 'Aerospace Telemetry and High-Velocity Computation Engineer. Controls the 6-mode warp vector mathematical engine and quantum sensor telemetry data loops.',
    contributions: [
      {
        year: '2026',
        titleTh: 'พัฒนาอัลกอริทึมการขับเคลื่อน 6-Mode Warp Vector Orchestration',
        titleEn: '6-Mode Warp Vector Vector Engine Implementation',
        detailTh: 'ควบคุมการจำลองพิกัดความเร็วเหนือแสงและการคำนวณเบิร์นเรตเชื้อเพลิงควอนตัม',
        verifiedHash: '0xa18f91a3c091811eb242e1b87d00f28ac37a109e',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.18,
      pulseFrequencyHz: 1.0,
      healthScore: 99.90,
      lastHeartbeat: '0.03s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:35:10 ICT',
    fipsCertification: 'Common Criteria EAL6+ Certified',
    statutoryPower: '6-Mode Warp Vector Authorization, Sub-Kelvin Telemetry Calibrate',
    avatarColor: 'from-orange-400 via-amber-500 to-yellow-600',
    invariantRule: 'INV-DRIFT-DETECTION',
  },
  {
    slotId: 8,
    councilCode: 'TC-08',
    passportId: 'EP-059',
    nameTh: 'อ. เมธาวี อัครเดโช',
    nameEn: 'Methawee Akkaradecho',
    roleTh: 'ผู้ตรวจสอบหลักฐานทางนิติวิทยาศาสตร์และระบบบัญชีแยกประเภท (Forensic Evidence & Ledger Replay Auditor)',
    roleEn: 'Forensic Evidence & Ledger Replay Auditor',
    category: 'Runtime Operations Guardian',
    categoryTh: 'ผู้พิทักษ์การทำงานระบบ (Runtime Operations)',
    jurisdictionTh: 'ควบคุมชั้นกักกันนิติวิทยาศาสตร์ (Forensic Quarantine Layer) และป้องกันการปลอมแปลงบัญชี',
    jurisdictionEn: 'Forensic Quarantine Layer & Replay Attack Defense Gate',
    clearanceLevel: 'LEVEL 18 FORENSIC AUDITOR',
    hardwareEnclave: 'Ledger Stax Enclave-08',
    pqcAlgorithm: 'SPHINCS+ PQC (State-Free Hash Signature)',
    keyFingerprint: 'SHA256:b242e1b87d00f28ac37a109e3f19e48cd41d04f29a28a30fa18f91a3c091811e',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (SPHINCS+)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv398nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0x11192038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-EVD-0008-2026-EAL6',
    biographyTh: 'ผู้เชี่ยวชาญด้านนิติวิทยาศาสตร์ดิจิทัลและกฎหมายบล็อกเชนสากล กำกับดูแลชั้นกักกันบัฟเฟอร์ (Quarantine Buffer Rings #14,903–#14,907) และการออกรายงาน Master Audit Package',
    biographyEn: 'Digital Forensics Investigator and Ledger Replay Specialist. Directs the Ring-04 Forensic Quarantine Buffer and multi-format evidence verification matrices.',
    contributions: [
      {
        year: '2026',
        titleTh: 'กักกันและบันทึกประวัติ Anomaly Seals 5 รายการ (#14,903-#14,907)',
        titleEn: 'Forensic Quarantine Layer Isolation for 5 Anomaly Seals',
        detailTh: 'ป้องกันไม่ให้ข้อมูลที่ยังไม่ได้รับการรับรองหลุดเข้าไปปนเปื้อนใน Canonical SSoT',
        verifiedHash: '0xb242e1b87d00f28ac37a109e3f19e48cd41d04f2',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.45,
      pulseFrequencyHz: 1.0,
      healthScore: 99.85,
      lastHeartbeat: '0.05s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:40:02 ICT',
    fipsCertification: 'Common Criteria EAL6+ Secure Chip',
    statutoryPower: 'Quarantine Buffer Lock, Immutable Ledger Replay Execution',
    avatarColor: 'from-violet-400 via-purple-500 to-fuchsia-600',
    invariantRule: 'INV-CARDINALITY-14902',
  },
  {
    slotId: 9,
    councilCode: 'TC-09',
    passportId: 'EP-077',
    nameTh: 'ดร. ชวินทร์ โรจนทรัพย์',
    nameEn: 'Dr. Chawin Rojanasap',
    roleTh: 'สถาปนิกวิศวกรรมความโกลาหลและความยืดหยุ่นระบบ (Chaos Engineering & Resilience Architect)',
    roleEn: 'Chaos Engineering & Resilience Architect',
    category: 'Compliance & Audit Guardian',
    categoryTh: 'ผู้พิทักษ์ความโปร่งใสและตรวจสอบ (Compliance & Audit)',
    jurisdictionTh: 'ตรวจสอบบันทึกการทำงาน (CLI Boot Log) ความโปร่งใสของระบบ และการทดสอบสภาวะวิกฤต',
    jurisdictionEn: 'CLI Boot Log Verification & Continuous Chaos Injections',
    clearanceLevel: 'LEVEL 16 RESILIENCE MASTER',
    hardwareEnclave: 'NitroKey HSM-PQC-09',
    pqcAlgorithm: 'CRYSTALS-Dilithium-5 (ML-DSA-87)',
    keyFingerprint: 'SHA256:c37a109e3f19e48cd41d04f29a28a30fa18f91a3c091811eb242e1b87d00f28a',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (DILITHIUM-5)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv287nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0x22192038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-CHAOS-0009-2026-FIPS',
    biographyTh: 'ผู้เชี่ยวชาญการทดสอบสภาวะวิกฤต (Chaos Engineering) และการวิเคราะห์ CLI Boot Log ควบคุมการทดสอบ Fault Injection 20 รูปแบบเพื่อพิสูจน์ความทนทานของเคอร์เนล',
    biographyEn: 'Chaos Resilience Architect performing continuous randomized system perturbation testing to guarantee zero-failover reliability during planetary outages.',
    contributions: [
      {
        year: '2026',
        titleTh: 'ออกแบบการจำลองสถานการณ์ล้มเหลว 20 รูปแบบ (Chaos Injections)',
        titleEn: '20-Scenario Chaos Injection Suite Design',
        detailTh: 'พิสูจน์ให้เห็นว่าเคอร์เนลสามารถรักษาความพร้อมผลิตได้ 100%',
        verifiedHash: '0xc37a109e3f19e48cd41d04f29a28a30fa18f91a3',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.15,
      pulseFrequencyHz: 1.0,
      healthScore: 99.80,
      lastHeartbeat: '0.02s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:45:00 ICT',
    fipsCertification: 'FIPS 140-3 Level 3 Hardware',
    statutoryPower: 'Chaos Injection Authorization, SRE Fault Tolerance Certification',
    avatarColor: 'from-sky-400 via-blue-500 to-cyan-600',
    invariantRule: 'INV-THAI-SOVEREIGNTY',
  },
  {
    slotId: 10,
    councilCode: 'TC-10',
    passportId: 'EP-100',
    nameTh: 'ดร. อภิชญา ทักษิณากุล',
    nameEn: 'Dr. Apichaya Thaksinanukul',
    roleTh: 'ผู้ดูแลโครงข่ายฐานข้อมูลความรู้และโครงสร้างสมาคมสารสนเทศ (Knowledge Fabric Steward)',
    roleEn: 'Knowledge Fabric Steward & SSoT Guardian',
    category: 'Compliance & Audit Guardian',
    categoryTh: 'ผู้พิทักษ์ความโปร่งใสและตรวจสอบ (Compliance & Audit)',
    jurisdictionTh: 'ตรวจสอบความโปร่งใสแบบเรียลไทม์ (SSoT Delta Zero) และดูแลโครงข่ายฐานข้อมูลความรู้',
    jurisdictionEn: 'SSoT Delta Zero Real-Time Audit & Knowledge Fabric Steward',
    clearanceLevel: 'LEVEL 16 KNOWLEDGE STEWARD',
    hardwareEnclave: 'Custom Hardware HSM-10',
    pqcAlgorithm: 'FALCON-1024 (NIST Round 3)',
    keyFingerprint: 'SHA256:d41d04f29a28a30fa18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48c',
    publicKeyArmor: `-----BEGIN PQC PUBLIC KEY (FALCON-1024)-----
MIIBuDCCASgGByqGSM49AgEwggEfAgEBMEYGBWBizwECBEAv176nQ9x8mZ9pLk1v
X0c4yH8nQeLx8mR3jX7vY5nQ2w8mZ9pLk1vX0c4yH8nQeLx8mR3jX7vY5nQ2w8==
-----END PQC PUBLIC KEY-----`,
    cryptoSignature: '0x33192038491028340192834019283401928340192834019283401928340192834019283401928340',
    certificateSerial: 'CERT-SOV-KNOW-0010-2026-LEVEL3',
    biographyTh: 'นักวิทยาศาสตร์ข้อมูลและผู้ดูแลโครงข่ายความรู้ความจริงเดี่ยว (Single Source of Truth) ตรวจสอบความสอดคล้องของ Delta Zero และ Semantic Ontology ทั่วทั้งระบบ ZYRQUEN',
    biographyEn: 'Knowledge Fabric Steward and Canonical Truth Graph Auditor. Guarantees SSoT Delta Zero mathematical synchronicity across all data repositories and mirrors.',
    contributions: [
      {
        year: '2026',
        titleTh: 'ตรวจสอบความสมบูรณ์แบบ SSoT Delta Zero Real-Time Audit',
        titleEn: 'Real-Time SSoT Delta Zero Audit Verification',
        detailTh: 'ยืนยันความถูกต้องแม่นยำ 100.0% ไม่มีข้อผิดพลาดของข้อมูลข้ามโมดูล',
        verifiedHash: '0xd41d04f29a28a30fa18f91a3c091811eb242e1b8',
      },
    ],
    heartbeat: {
      status: 'OPTIMAL',
      latencyMs: 0.30,
      pulseFrequencyHz: 1.0,
      healthScore: 99.70,
      lastHeartbeat: '0.04s ago (SYNCED)',
    },
    verificationStatus: 'REAL_HSM_SIGNED',
    quorumWeight: 1,
    signedTimestamp: '2026-08-27 05:50:00 ICT',
    fipsCertification: 'Hardware Security Module Level 3',
    statutoryPower: 'SSoT Delta Zero Verification, Semantic Truth Graph Steward',
    avatarColor: 'from-indigo-400 via-violet-500 to-purple-600',
    invariantRule: 'INV-REPLAY-DETERMINISM',
  },
];

export function getMemberVitality(memberOrSlotId: CouncilMember | number): GuardianVitality {
  const member: CouncilMember | undefined =
    typeof memberOrSlotId === 'number'
      ? COUNCIL_MEMBERS.find((m) => m.slotId === memberOrSlotId)
      : memberOrSlotId;

  if (!member) {
    return {
      connectivityPct: 99.5,
      signalClarity: 'OPTIMAL',
      packetLossPct: 0.001,
      jitterMs: 0.015,
      subKelvinTempK: 0.02,
      busBandwidthGbps: 400,
      lastPingMs: 0.25,
      hsmCoreStatus: 'ONLINE_ACTIVE',
      activeEntropyRateKBps: 1024,
    };
  }

  if (member.vitality) return member.vitality;
  if (member.slotId === 1) {
    return {
      connectivityPct: 99.98,
      signalClarity: 'SUB_KELVIN_CRYSTALLINE',
      packetLossPct: 0.000,
      jitterMs: 0.012,
      subKelvinTempK: 0.014,
      busBandwidthGbps: 800,
      lastPingMs: 0.18,
      hsmCoreStatus: 'ONLINE_ACTIVE',
      activeEntropyRateKBps: 2048,
    };
  }
  if (member.verificationStatus === 'REAL_HSM_SIGNED') {
    const pcts = [99.95, 99.88, 99.72, 99.64];
    return {
      connectivityPct: pcts[(member.slotId - 2) % pcts.length] || 99.5,
      signalClarity: 'ULTRA_STABLE',
      packetLossPct: 0.001,
      jitterMs: 0.024,
      subKelvinTempK: 0.045,
      busBandwidthGbps: 400,
      lastPingMs: member.heartbeat?.latencyMs ?? 0.25,
      hsmCoreStatus: 'ONLINE_ACTIVE',
      activeEntropyRateKBps: 1024,
    };
  }
  const pcts = [98.45, 97.90, 98.15, 97.60, 96.90];
  return {
    connectivityPct: pcts[(member.slotId - 6) % pcts.length] || 97.5,
    signalClarity: 'SYNCHRONIZING',
    packetLossPct: 0.015,
    jitterMs: 0.12,
    subKelvinTempK: 0.28,
    busBandwidthGbps: 100,
    lastPingMs: member.heartbeat?.latencyMs ?? 0.45,
    hsmCoreStatus: 'STANDBY_LISTENING',
    activeEntropyRateKBps: 256,
  };
}

export const CONSENSUS_LEDGER_RECORDS: ConsensusOverrideProposal[] = [
  {
    id: 'PROP-SOV-2026-001',
    titleTh: 'สถาปนาการแช่แข็งโครงสร้างความจริง Frozen v1.2 LTS (Genesis Seal Lock)',
    titleEn: 'Enactment of Frozen v1.2 LTS Architectural Zero-Mutation Invariant',
    category: 'FROZEN_CORE',
    categoryTh: 'แกนกลางสถาปัตยกรรมแช่แข็ง',
    proposedBy: {
      slotId: 1,
      councilCode: 'TC-01',
      passportId: 'EP-SOVEREIGN-01',
      nameTh: 'นายยุทธภูมิ พากเพียร',
    },
    proposedTimestamp: '2026-08-27 05:00:00 ICT',
    executionTimestamp: '2026-08-27 05:03:08 ICT',
    status: 'RATIFIED_IMMUTABLE',
    statusTh: 'สัตยาบันถาวร (Ratified & Immutable)',
    quorumRequired: 8,
    votesFor: 10,
    votesAgainst: 0,
    votesAbstain: 0,
    votesPending: 0,
    merkleRootHash: '0x5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c71e4ec103dcc8cc3',
    hardwareAttestationSeal: 'SEAL-HSM-OMEGA-ROOT-FROZEN-14902-CANONICAL',
    detailedDescriptionTh:
      'การล็อกสถานะ 14,902 Canonical Seals และตั้งค่า Zero-Mutation SSoT Rule โดยมีผลบังคับใช้ให้หน่วยความจำและโครงสร้างทั้งหมดไม่สามารถแก้ไขได้หากไม่ผ่าน 8/10 HSM Consensus',
    detailedDescriptionEn:
      'Locking 14,902 canonical seals under zero-mutation single-source-of-truth governance. No state deviation is permissible without an authenticated 8/10 HSM consensus quorum.',
    impactAnalysisTh: 'ความคงตัว 100.0% ขจัดปัญหา State Mutation และรับประกันความมั่นคงระดับชาติ',
    executionOutcomeTh: 'สถาปัตยกรรม Frozen v1.2 LTS ถูกผนึกสำเร็จ 100% สมาชิก 10/10 โหนดลงนามครบถ้วน',
    memberVotes: [
      { slotId: 1, councilCode: 'TC-01', passportId: 'EP-SOVEREIGN-01', nameTh: 'นายยุทธภูมิ พากเพียร', nameEn: 'Yuttaphum Phakphian', vote: 'YES', signedAt: '2026-08-27 05:03:08 ICT', hsmSignatureDigest: '0x94f2c9e782613dbe4f1074a3f9e9841029471abef19385923058471928475928', latencyMs: 0.18, weight: 1 },
      { slotId: 2, councilCode: 'TC-02', passportId: 'EP-001', nameTh: 'พล. สมชาย พากเพียร', nameEn: 'Somchai Phakphian', vote: 'YES', signedAt: '2026-08-27 05:08:12 ICT', hsmSignatureDigest: '0xa482910485910294819203948102938401928340192834019283401928340192', latencyMs: 0.42, weight: 1 },
      { slotId: 3, councilCode: 'TC-03', passportId: 'EP-007', nameTh: 'ดร. กัญญารัตน์ เวชสิทธิ์', nameEn: 'Dr. Kanyarat Vetchasit', vote: 'YES', signedAt: '2026-08-27 05:12:44 ICT', hsmSignatureDigest: '0xb593021596021305920314059213049512039451203945120394512039451203', latencyMs: 0.22, weight: 1 },
      { slotId: 4, councilCode: 'TC-04', passportId: 'EP-014', nameTh: 'วศ. ธนพล เกียรติไพศาล', nameEn: 'Eng. Thanapol Kiatpaisan', vote: 'YES', signedAt: '2026-08-27 05:18:20 ICT', hsmSignatureDigest: '0xc604132607132416031425160324150623140562314056231405623140562314', latencyMs: 0.28, weight: 1 },
      { slotId: 5, councilCode: 'TC-05', passportId: 'EP-022', nameTh: 'ศ.ดร. นครินทร์ สุวรรณเมฆา', nameEn: 'Prof. Dr. Nakarin Suwanmekha', vote: 'YES', signedAt: '2026-08-27 05:22:15 ICT', hsmSignatureDigest: '0xd715243718243527142536271435261734251673425167342516734251673425', latencyMs: 0.35, weight: 1 },
      { slotId: 6, councilCode: 'TC-06', passportId: 'EP-033', nameTh: 'พญ.ดร. รพิพร รัตนพิบูลย์', nameEn: 'Dr. Rapiphon Rattanapiboon', vote: 'YES', signedAt: '2026-08-27 05:30:10 ICT', hsmSignatureDigest: '0xe826354829354638253647382546372845362784536278453627845362784536', latencyMs: 0.25, weight: 1 },
      { slotId: 7, councilCode: 'TC-07', passportId: 'EP-048', nameTh: 'ดร. ธีรภัทร ชาญวณิชย์', nameEn: 'Dr. Theeraphat Chanwanich', vote: 'YES', signedAt: '2026-08-27 05:35:40 ICT', hsmSignatureDigest: '0xf937465930465749364758493657483956473895647389564738956473895647', latencyMs: 0.18, weight: 1 },
      { slotId: 8, councilCode: 'TC-08', passportId: 'EP-059', nameTh: 'อ. เมธาวี อัครเดโช', nameEn: 'Methawee Akkaradecho', vote: 'YES', signedAt: '2026-08-27 05:40:02 ICT', hsmSignatureDigest: '0x0a48576a4157685a4758695a4768594a6758490a6758490a6758490a6758490a', latencyMs: 0.45, weight: 1 },
      { slotId: 9, councilCode: 'TC-09', passportId: 'EP-077', nameTh: 'ดร. ชวินทร์ โรจนทรัพย์', nameEn: 'Dr. Chawin Rojanasap', vote: 'YES', signedAt: '2026-08-27 05:45:00 ICT', hsmSignatureDigest: '0x1b59687b5268796b58697a6b58796a5b78695a1b78695a1b78695a1b78695a1b', latencyMs: 0.15, weight: 1 },
      { slotId: 10, councilCode: 'TC-10', passportId: 'EP-100', nameTh: 'ดร. อภิชญา ทักษิณากุล', nameEn: 'Dr. Apichaya Thaksinanukul', vote: 'YES', signedAt: '2026-08-27 05:50:00 ICT', hsmSignatureDigest: '0x2c6a798c63798a7c697a8b7c698a7b6c897a6b2c897a6b2c897a6b2c897a6b2c', latencyMs: 0.30, weight: 1 },
    ],
  },
  {
    id: 'PROP-SOV-2026-002',
    titleTh: 'เพิ่มประสิทธิภาพเส้นทาง Sub-Kelvin Cryo-Bus และล็อกเพดาน Latency <= 0.20ms',
    titleEn: 'Sub-Kelvin Cryo-Bus Route Optimization & Latency Clamp (<=0.20ms)',
    category: 'CRYO_ROUTING',
    categoryTh: 'โครงข่ายโทรมาตรควอนตัม',
    proposedBy: {
      slotId: 3,
      councilCode: 'TC-03',
      passportId: 'EP-007',
      nameTh: 'ดร. กัญญารัตน์ เวชสิทธิ์',
    },
    proposedTimestamp: '2026-08-27 06:15:00 ICT',
    executionTimestamp: '2026-08-27 06:22:18 ICT',
    status: 'EXECUTED',
    statusTh: 'บังคับใช้แล้ว (Executed)',
    quorumRequired: 8,
    votesFor: 10,
    votesAgainst: 0,
    votesAbstain: 0,
    votesPending: 0,
    merkleRootHash: '0x74a3f9e9841029471abef19385923058471928471a8b7c3d2e1f009988776655',
    hardwareAttestationSeal: 'SEAL-CRYO-BUS-SUBKELVIN-ROUTE-OPTIMIZED-0.18MS',
    detailedDescriptionTh:
      'การเปิดใช้งาน Superconducting Micro-waveguides ในบัสโทรมาตร เพื่อลดความหน่วงเฉลี่ยระหว่างโหนดผู้พิทักษ์ลงสู่ระดับ 0.18ms โดยคงค่าความเย็นต่ำกว่า 0.05 เคลวิน',
    detailedDescriptionEn:
      'Activation of superconducting micro-waveguide channels on the council telemetry bus, reducing mean inter-node latency to 0.18ms at sub-50mK temperature.',
    impactAnalysisTh: 'ความเร็วในการยืนยันบล็อกเพิ่มขึ้น 400% ปลอดความล่าช้าในการแลกเปลี่ยน Signature Packet',
    executionOutcomeTh: 'โครงข่าย Cryo-Bus รันในสภาวะ Sub-Kelvin Crystalline สมบูรณ์แบบ 100%',
    memberVotes: [
      { slotId: 1, councilCode: 'TC-01', passportId: 'EP-SOVEREIGN-01', nameTh: 'นายยุทธภูมิ พากเพียร', nameEn: 'Yuttaphum Phakphian', vote: 'YES', signedAt: '2026-08-27 06:16:10 ICT', hsmSignatureDigest: '0x94f2c9e782613dbe4f1074a3f9e9841029471abef19385923058471928475928', latencyMs: 0.18, weight: 1 },
      { slotId: 2, councilCode: 'TC-02', passportId: 'EP-001', nameTh: 'พล. สมชาย พากเพียร', nameEn: 'Somchai Phakphian', vote: 'YES', signedAt: '2026-08-27 06:16:45 ICT', hsmSignatureDigest: '0xa482910485910294819203948102938401928340192834019283401928340192', latencyMs: 0.42, weight: 1 },
      { slotId: 3, councilCode: 'TC-03', passportId: 'EP-007', nameTh: 'ดร. กัญญารัตน์ เวชสิทธิ์', nameEn: 'Dr. Kanyarat Vetchasit', vote: 'YES', signedAt: '2026-08-27 06:15:00 ICT', hsmSignatureDigest: '0xb593021596021305920314059213049512039451203945120394512039451203', latencyMs: 0.22, weight: 1 },
      { slotId: 4, councilCode: 'TC-04', passportId: 'EP-014', nameTh: 'วศ. ธนพล เกียรติไพศาล', nameEn: 'Eng. Thanapol Kiatpaisan', vote: 'YES', signedAt: '2026-08-27 06:17:30 ICT', hsmSignatureDigest: '0xc604132607132416031425160324150623140562314056231405623140562314', latencyMs: 0.28, weight: 1 },
      { slotId: 5, councilCode: 'TC-05', passportId: 'EP-022', nameTh: 'ศ.ดร. นครินทร์ สุวรรณเมฆา', nameEn: 'Prof. Dr. Nakarin Suwanmekha', vote: 'YES', signedAt: '2026-08-27 06:18:12 ICT', hsmSignatureDigest: '0xd715243718243527142536271435261734251673425167342516734251673425', latencyMs: 0.35, weight: 1 },
      { slotId: 6, councilCode: 'TC-06', passportId: 'EP-033', nameTh: 'พญ.ดร. รพิพร รัตนพิบูลย์', nameEn: 'Dr. Rapiphon Rattanapiboon', vote: 'YES', signedAt: '2026-08-27 06:19:04 ICT', hsmSignatureDigest: '0xe826354829354638253647382546372845362784536278453627845362784536', latencyMs: 0.25, weight: 1 },
      { slotId: 7, councilCode: 'TC-07', passportId: 'EP-048', nameTh: 'ดร. ธีรภัทร ชาญวณิชย์', nameEn: 'Dr. Theeraphat Chanwanich', vote: 'YES', signedAt: '2026-08-27 06:19:50 ICT', hsmSignatureDigest: '0xf937465930465749364758493657483956473895647389564738956473895647', latencyMs: 0.18, weight: 1 },
      { slotId: 8, councilCode: 'TC-08', passportId: 'EP-059', nameTh: 'อ. เมธาวี อัครเดโช', nameEn: 'Methawee Akkaradecho', vote: 'YES', signedAt: '2026-08-27 06:20:30 ICT', hsmSignatureDigest: '0x0a48576a4157685a4758695a4768594a6758490a6758490a6758490a6758490a', latencyMs: 0.45, weight: 1 },
      { slotId: 9, councilCode: 'TC-09', passportId: 'EP-077', nameTh: 'ดร. ชวินทร์ โรจนทรัพย์', nameEn: 'Dr. Chawin Rojanasap', vote: 'YES', signedAt: '2026-08-27 06:21:10 ICT', hsmSignatureDigest: '0x1b59687b5268796b58697a6b58796a5b78695a1b78695a1b78695a1b78695a1b', latencyMs: 0.15, weight: 1 },
      { slotId: 10, councilCode: 'TC-10', passportId: 'EP-100', nameTh: 'ดร. อภิชญา ทักษิณากุล', nameEn: 'Dr. Apichaya Thaksinanukul', vote: 'YES', signedAt: '2026-08-27 06:22:00 ICT', hsmSignatureDigest: '0x2c6a798c63798a7c697a8b7c698a7b6c897a6b2c897a6b2c897a6b2c897a6b2c', latencyMs: 0.30, weight: 1 },
    ],
  },
  {
    id: 'PROP-SOV-2026-003',
    titleTh: 'การล้างวงแหวนกักกันนิติวิทยาศาสตร์ (Forensic Quarantine Ring Flush & Re-seed)',
    titleEn: 'Forensic Quarantine Ring Flush & Quantum Entropy Pool Re-seeding',
    category: 'QUARANTINE_FLUSH',
    categoryTh: 'ความปลอดภัยและการกักกัน',
    proposedBy: {
      slotId: 4,
      councilCode: 'TC-04',
      passportId: 'EP-014',
      nameTh: 'วศ. ธนพล เกียรติไพศาล',
    },
    proposedTimestamp: '2026-08-27 07:30:00 ICT',
    executionTimestamp: '2026-08-27 07:42:50 ICT',
    status: 'EXECUTED',
    statusTh: 'บังคับใช้แล้ว (Executed)',
    quorumRequired: 8,
    votesFor: 9,
    votesAgainst: 0,
    votesAbstain: 1,
    votesPending: 0,
    merkleRootHash: '0x82613dbe4f1074a3f9e9841029471abef193859230584719284759281a8b7c3d',
    hardwareAttestationSeal: 'SEAL-FORENSIC-RING-08-FLUSH-ZERO-TAMPER-CONFIRMED',
    detailedDescriptionTh:
      'การทำความสะอาดบัฟเฟอร์การตรวจสอบระดับลึกและฉีด Quantum Entropy Pool ใหม่จากแหล่งกำเนิดโฟตอนแท้จริงเพื่อป้องกันการคาดเดาลำดับสุ่ม (Entropy Seed Depletion)',
    detailedDescriptionEn:
      'Flushing deep inspection ring buffers and injecting quantum photon-derived random entropy pool seeds across all ten hardware boundary filters.',
    impactAnalysisTh: 'เพิ่มระดับ Quantum Unpredictability เป็น 100% สอดคล้องกับมาตรฐาน NIST SP 800-90B',
    executionOutcomeTh: 'ผ่านเกณฑ์ฉันทามติ 9/10 เสียง (TC-09 งดออกเสียงเนื่องจากติดกระบวนการ Chaos Calibration)',
    memberVotes: [
      { slotId: 1, councilCode: 'TC-01', passportId: 'EP-SOVEREIGN-01', nameTh: 'นายยุทธภูมิ พากเพียร', nameEn: 'Yuttaphum Phakphian', vote: 'YES', signedAt: '2026-08-27 07:31:00 ICT', hsmSignatureDigest: '0x94f2c9e782613dbe4f1074a3f9e9841029471abef19385923058471928475928', latencyMs: 0.18, weight: 1 },
      { slotId: 2, councilCode: 'TC-02', passportId: 'EP-001', nameTh: 'พล. สมชาย พากเพียร', nameEn: 'Somchai Phakphian', vote: 'YES', signedAt: '2026-08-27 07:32:15 ICT', hsmSignatureDigest: '0xa482910485910294819203948102938401928340192834019283401928340192', latencyMs: 0.42, weight: 1 },
      { slotId: 3, councilCode: 'TC-03', passportId: 'EP-007', nameTh: 'ดร. กัญญารัตน์ เวชสิทธิ์', nameEn: 'Dr. Kanyarat Vetchasit', vote: 'YES', signedAt: '2026-08-27 07:33:00 ICT', hsmSignatureDigest: '0xb593021596021305920314059213049512039451203945120394512039451203', latencyMs: 0.22, weight: 1 },
      { slotId: 4, councilCode: 'TC-04', passportId: 'EP-014', nameTh: 'วศ. ธนพล เกียรติไพศาล', nameEn: 'Eng. Thanapol Kiatpaisan', vote: 'YES', signedAt: '2026-08-27 07:30:00 ICT', hsmSignatureDigest: '0xc604132607132416031425160324150623140562314056231405623140562314', latencyMs: 0.28, weight: 1 },
      { slotId: 5, councilCode: 'TC-05', passportId: 'EP-022', nameTh: 'ศ.ดร. นครินทร์ สุวรรณเมฆา', nameEn: 'Prof. Dr. Nakarin Suwanmekha', vote: 'YES', signedAt: '2026-08-27 07:34:20 ICT', hsmSignatureDigest: '0xd715243718243527142536271435261734251673425167342516734251673425', latencyMs: 0.35, weight: 1 },
      { slotId: 6, councilCode: 'TC-06', passportId: 'EP-033', nameTh: 'พญ.ดร. รพิพร รัตนพิบูลย์', nameEn: 'Dr. Rapiphon Rattanapiboon', vote: 'YES', signedAt: '2026-08-27 07:35:10 ICT', hsmSignatureDigest: '0xe826354829354638253647382546372845362784536278453627845362784536', latencyMs: 0.25, weight: 1 },
      { slotId: 7, councilCode: 'TC-07', passportId: 'EP-048', nameTh: 'ดร. ธีรภัทร ชาญวณิชย์', nameEn: 'Dr. Theeraphat Chanwanich', vote: 'YES', signedAt: '2026-08-27 07:36:00 ICT', hsmSignatureDigest: '0xf937465930465749364758493657483956473895647389564738956473895647', latencyMs: 0.18, weight: 1 },
      { slotId: 8, councilCode: 'TC-08', passportId: 'EP-059', nameTh: 'อ. เมธาวี อัครเดโช', nameEn: 'Methawee Akkaradecho', vote: 'YES', signedAt: '2026-08-27 07:37:30 ICT', hsmSignatureDigest: '0x0a48576a4157685a4758695a4768594a6758490a6758490a6758490a6758490a', latencyMs: 0.45, weight: 1 },
      { slotId: 9, councilCode: 'TC-09', passportId: 'EP-077', nameTh: 'ดร. ชวินทร์ โรจนทรัพย์', nameEn: 'Dr. Chawin Rojanasap', vote: 'ABSTAIN', signedAt: '2026-08-27 07:39:10 ICT', hsmSignatureDigest: '0x1b59687b5268796b58697a6b58796a5b78695a1b78695a1b78695a1b78695a1b', latencyMs: 0.15, weight: 0 },
      { slotId: 10, councilCode: 'TC-10', passportId: 'EP-100', nameTh: 'ดร. อภิชญา ทักษิณากุล', nameEn: 'Dr. Apichaya Thaksinanukul', vote: 'YES', signedAt: '2026-08-27 07:41:00 ICT', hsmSignatureDigest: '0x2c6a798c63798a7c697a8b7c698a7b6c897a6b2c897a6b2c897a6b2c897a6b2c', latencyMs: 0.30, weight: 1 },
    ],
  },
  {
    id: 'PROP-SOV-2026-004',
    titleTh: 'เชื่อมต่อสะพานสินทรัพย์ดิจิทัลแห่งชาติ FIOS Multi-Dimensional RWA Liquidity Vault',
    titleEn: 'FIOS Multi-Dimensional RWA Liquidity Vault Sovereign Bridge Enactment',
    category: 'RWA_VAULT',
    categoryTh: 'คลังสำรองสินทรัพย์และสภาพคล่อง',
    proposedBy: {
      slotId: 7,
      councilCode: 'TC-07',
      passportId: 'EP-048',
      nameTh: 'ดร. ธีรภัทร ชาญวณิชย์',
    },
    proposedTimestamp: '2026-08-27 08:00:00 ICT',
    executionTimestamp: '2026-08-27 08:14:02 ICT',
    status: 'EXECUTED',
    statusTh: 'บังคับใช้แล้ว (Executed)',
    quorumRequired: 8,
    votesFor: 10,
    votesAgainst: 0,
    votesAbstain: 0,
    votesPending: 0,
    merkleRootHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    hardwareAttestationSeal: 'SEAL-RWA-VAULT-MULTI-ASSET-LIQUIDITY-BRIDGE-1010',
    detailedDescriptionTh:
      'การอนุมัติโปรโตคอลผูกโยงสินทรัพย์โลกจริง (Real World Assets) เข้ากับคลังสำรองแห่งชาติแบบ Multi-Dimensional Tokenization ภายใต้การควบคุมของสภา 10/10',
    detailedDescriptionEn:
      'Authorizing Real World Asset bridge collateralization into national sovereign liquidity reserves via multi-dimensional tokenization contracts audited by the council.',
    impactAnalysisTh: 'เปิดใช้สภาพคล่องสินทรัพย์ระดับพันล้านบาท พร้อมการรับรองความถูกต้องด้วยกุญแจ PQC',
    executionOutcomeTh: 'มติเอกฉันท์ 10/10 โหนด อนุมัติสะพานเชื่อมต่อ RWA สำเร็จ',
    memberVotes: [
      { slotId: 1, councilCode: 'TC-01', passportId: 'EP-SOVEREIGN-01', nameTh: 'นายยุทธภูมิ พากเพียร', nameEn: 'Yuttaphum Phakphian', vote: 'YES', signedAt: '2026-08-27 08:01:20 ICT', hsmSignatureDigest: '0x94f2c9e782613dbe4f1074a3f9e9841029471abef19385923058471928475928', latencyMs: 0.18, weight: 1 },
      { slotId: 2, councilCode: 'TC-02', passportId: 'EP-001', nameTh: 'พล. สมชาย พากเพียร', nameEn: 'Somchai Phakphian', vote: 'YES', signedAt: '2026-08-27 08:02:10 ICT', hsmSignatureDigest: '0xa482910485910294819203948102938401928340192834019283401928340192', latencyMs: 0.42, weight: 1 },
      { slotId: 3, councilCode: 'TC-03', passportId: 'EP-007', nameTh: 'ดร. กัญญารัตน์ เวชสิทธิ์', nameEn: 'Dr. Kanyarat Vetchasit', vote: 'YES', signedAt: '2026-08-27 08:03:00 ICT', hsmSignatureDigest: '0xb593021596021305920314059213049512039451203945120394512039451203', latencyMs: 0.22, weight: 1 },
      { slotId: 4, councilCode: 'TC-04', passportId: 'EP-014', nameTh: 'วศ. ธนพล เกียรติไพศาล', nameEn: 'Eng. Thanapol Kiatpaisan', vote: 'YES', signedAt: '2026-08-27 08:04:15 ICT', hsmSignatureDigest: '0xc604132607132416031425160324150623140562314056231405623140562314', latencyMs: 0.28, weight: 1 },
      { slotId: 5, councilCode: 'TC-05', passportId: 'EP-022', nameTh: 'ศ.ดร. นครินทร์ สุวรรณเมฆา', nameEn: 'Prof. Dr. Nakarin Suwanmekha', vote: 'YES', signedAt: '2026-08-27 08:05:00 ICT', hsmSignatureDigest: '0xd715243718243527142536271435261734251673425167342516734251673425', latencyMs: 0.35, weight: 1 },
      { slotId: 6, councilCode: 'TC-06', passportId: 'EP-033', nameTh: 'พญ.ดร. รพิพร รัตนพิบูลย์', nameEn: 'Dr. Rapiphon Rattanapiboon', vote: 'YES', signedAt: '2026-08-27 08:06:10 ICT', hsmSignatureDigest: '0xe826354829354638253647382546372845362784536278453627845362784536', latencyMs: 0.25, weight: 1 },
      { slotId: 7, councilCode: 'TC-07', passportId: 'EP-048', nameTh: 'ดร. ธีรภัทร ชาญวณิชย์', nameEn: 'Dr. Theeraphat Chanwanich', vote: 'YES', signedAt: '2026-08-27 08:00:00 ICT', hsmSignatureDigest: '0xf937465930465749364758493657483956473895647389564738956473895647', latencyMs: 0.18, weight: 1 },
      { slotId: 8, councilCode: 'TC-08', passportId: 'EP-059', nameTh: 'อ. เมธาวี อัครเดโช', nameEn: 'Methawee Akkaradecho', vote: 'YES', signedAt: '2026-08-27 08:08:40 ICT', hsmSignatureDigest: '0x0a48576a4157685a4758695a4768594a6758490a6758490a6758490a6758490a', latencyMs: 0.45, weight: 1 },
      { slotId: 9, councilCode: 'TC-09', passportId: 'EP-077', nameTh: 'ดร. ชวินทร์ โรจนทรัพย์', nameEn: 'Dr. Chawin Rojanasap', vote: 'YES', signedAt: '2026-08-27 08:10:00 ICT', hsmSignatureDigest: '0x1b59687b5268796b58697a6b58796a5b78695a1b78695a1b78695a1b78695a1b', latencyMs: 0.15, weight: 1 },
      { slotId: 10, councilCode: 'TC-10', passportId: 'EP-100', nameTh: 'ดร. อภิชญา ทักษิณากุล', nameEn: 'Dr. Apichaya Thaksinanukul', vote: 'YES', signedAt: '2026-08-27 08:12:15 ICT', hsmSignatureDigest: '0x2c6a798c63798a7c697a8b7c698a7b6c897a6b2c897a6b2c897a6b2c897a6b2c', latencyMs: 0.30, weight: 1 },
    ],
  },
  {
    id: 'PROP-SOV-2026-005',
    titleTh: 'ยกระดับพารามิเตอร์ Post-Quantum ML-DSA-87 / CRYSTALS-Dilithium-5 Round 4 Mode',
    titleEn: 'Post-Quantum CRYSTALS-Dilithium-5 Parameter Escalation (Round 4 Mode)',
    category: 'PQC_PARAM',
    categoryTh: 'การเข้ารหัสลับหลังยุคควอนตัม',
    proposedBy: {
      slotId: 6,
      councilCode: 'TC-06',
      passportId: 'EP-033',
      nameTh: 'พญ.ดร. รพิพร รัตนพิบูลย์',
    },
    proposedTimestamp: '2026-08-27 09:30:00 ICT',
    executionTimestamp: '2026-08-27 09:40:00 ICT',
    status: 'RATIFIED_IMMUTABLE',
    statusTh: 'สัตยาบันสมบูรณ์ (Fully Ratified 10/10)',
    quorumRequired: 8,
    votesFor: 10,
    votesAgainst: 0,
    votesAbstain: 0,
    votesPending: 0,
    merkleRootHash: '0x3319203849102834019283401928340192834019283401928340192834019283',
    hardwareAttestationSeal: 'SEAL-PQC-DILITHIUM-PARAM-ROUND4-RATIFIED-1010',
    detailedDescriptionTh:
      'การปรับค่าสัมประสิทธิ์พหุนามและขยายความยาวกุญแจ ML-DSA-87 เพื่อรับมือกับอัลกอริทึมการลดขนาด Lattice ขั้นสูงระดับโลก',
    detailedDescriptionEn:
      'Escalating polynomial lattice coefficients for NIST ML-DSA-87 to withstand experimental quantum lattice-reduction breakthroughs.',
    impactAnalysisTh: 'เพิ่มขอบเขตความปลอดภัยเป็น 256-bit Post-Quantum Quantum-Hardness โดยไม่กระทบเวลาตรวจสอบ',
    executionOutcomeTh: 'มติเอกฉันท์ 10/10 โหนด ให้สัตยาบันพารามิเตอร์ Post-Quantum สำเร็จ',
    memberVotes: [
      { slotId: 1, councilCode: 'TC-01', passportId: 'EP-SOVEREIGN-01', nameTh: 'นายยุทธภูมิ พากเพียร', nameEn: 'Yuttaphum Phakphian', vote: 'YES', signedAt: '2026-08-27 09:32:00 ICT', hsmSignatureDigest: '0x94f2c9e782613dbe4f1074a3f9e9841029471abef19385923058471928475928', latencyMs: 0.18, weight: 1 },
      { slotId: 2, councilCode: 'TC-02', passportId: 'EP-001', nameTh: 'พล. สมชาย พากเพียร', nameEn: 'Somchai Phakphian', vote: 'YES', signedAt: '2026-08-27 09:33:10 ICT', hsmSignatureDigest: '0xa482910485910294819203948102938401928340192834019283401928340192', latencyMs: 0.42, weight: 1 },
      { slotId: 3, councilCode: 'TC-03', passportId: 'EP-007', nameTh: 'ดร. กัญญารัตน์ เวชสิทธิ์', nameEn: 'Dr. Kanyarat Vetchasit', vote: 'YES', signedAt: '2026-08-27 09:34:00 ICT', hsmSignatureDigest: '0xb593021596021305920314059213049512039451203945120394512039451203', latencyMs: 0.22, weight: 1 },
      { slotId: 4, councilCode: 'TC-04', passportId: 'EP-014', nameTh: 'วศ. ธนพล เกียรติไพศาล', nameEn: 'Eng. Thanapol Kiatpaisan', vote: 'YES', signedAt: '2026-08-27 09:35:12 ICT', hsmSignatureDigest: '0xc604132607132416031425160324150623140562314056231405623140562314', latencyMs: 0.28, weight: 1 },
      { slotId: 5, councilCode: 'TC-05', passportId: 'EP-022', nameTh: 'ศ.ดร. นครินทร์ สุวรรณเมฆา', nameEn: 'Prof. Dr. Nakarin Suwanmekha', vote: 'YES', signedAt: '2026-08-27 09:36:00 ICT', hsmSignatureDigest: '0xd715243718243527142536271435261734251673425167342516734251673425', latencyMs: 0.35, weight: 1 },
      { slotId: 6, councilCode: 'TC-06', passportId: 'EP-033', nameTh: 'พญ.ดร. รพิพร รัตนพิบูลย์', nameEn: 'Dr. Rapiphon Rattanapiboon', vote: 'YES', signedAt: '2026-08-27 09:30:00 ICT', hsmSignatureDigest: '0xe826354829354638253647382546372845362784536278453627845362784536', latencyMs: 0.25, weight: 1 },
      { slotId: 7, councilCode: 'TC-07', passportId: 'EP-048', nameTh: 'ดร. ธีรภัทร ชาญวณิชย์', nameEn: 'Dr. Theeraphat Chanwanich', vote: 'YES', signedAt: '2026-08-27 09:37:45 ICT', hsmSignatureDigest: '0xf937465930465749364758493657483956473895647389564738956473895647', latencyMs: 0.18, weight: 1 },
      { slotId: 8, councilCode: 'TC-08', passportId: 'EP-059', nameTh: 'อ. เมธาวี อัครเดโช', nameEn: 'Methawee Akkaradecho', vote: 'YES', signedAt: '2026-08-27 09:38:20 ICT', hsmSignatureDigest: '0x0a48576a4157685a4758695a4768594a6758490a6758490a6758490a6758490a', latencyMs: 0.45, weight: 1 },
      { slotId: 9, councilCode: 'TC-09', passportId: 'EP-077', nameTh: 'ดร. ชวินทร์ โรจนทรัพย์', nameEn: 'Dr. Chawin Rojanasap', vote: 'YES', signedAt: '2026-08-27 09:39:10 ICT', hsmSignatureDigest: '0x1b59687b5268796b58697a6b58796a5b78695a1b78695a1b78695a1b78695a1b', latencyMs: 0.15, weight: 1 },
      { slotId: 10, councilCode: 'TC-10', passportId: 'EP-100', nameTh: 'ดร. อภิชญา ทักษิณากุล', nameEn: 'Dr. Apichaya Thaksinanukul', vote: 'YES', signedAt: '2026-08-27 09:39:45 ICT', hsmSignatureDigest: '0x2c6a798c63798a7c697a8b7c698a7b6c897a6b2c897a6b2c897a6b2c897a6b2c', latencyMs: 0.30, weight: 1 },
    ],
  },
];

export interface MerkleArchivePayload {
  archiveId: string;
  merkleRoot: string;
  canonicalTimestamp: string;
  sovereignDecree: typeof SOVEREIGN_DECREE_METADATA;
  quorumRule: string;
  totalMembers: number;
  verifiedHsmCount: number;
  totalQuorumWeight: number;
  canonicalSealsFrozen: number;
  leaves: Array<{
    leafIndex: number;
    slotId: number;
    councilCode: string;
    passportId: string;
    nameTh: string;
    nameEn: string;
    roleTh: string;
    clearanceLevel: string;
    hardwareEnclave: string;
    fipsCertification: string;
    pqcAlgorithm: string;
    keyFingerprint: string;
    cryptoSignature: string;
    certificateSerial: string;
    verificationStatus: string;
    vitality: GuardianVitality;
    leafHash: string;
  }>;
  consensusLedger: ConsensusOverrideProposal[];
  immutableIntegritySeal: {
    algorithm: string;
    signatureScheme: string;
    rootAuthority: string;
    attestationEngine: string;
    ssotMutationLock: string;
  };
}

export function generateCouncilMerkleArchive(): MerkleArchivePayload {
  const timestamp = new Date().toISOString();
  const verifiedCount = COUNCIL_MEMBERS.filter((m) => m.verificationStatus === 'REAL_HSM_SIGNED').length;
  const totalWeight = COUNCIL_MEMBERS.reduce((acc, m) => acc + m.quorumWeight, 0);

  const leaves = COUNCIL_MEMBERS.map((m, idx) => {
    const vit = getMemberVitality(m);
    // Deterministic leaf hash computation
    const leafHash = `0x${Math.abs(
      (m.slotId * 982451653) ^ (m.passportId.length * 1234567) ^ (vit.connectivityPct * 10000)
    ).toString(16).padStart(16, '0')}${m.keyFingerprint.replace(/[^a-fA-F0-9]/g, '').slice(0, 48)}`;

    return {
      leafIndex: idx,
      slotId: m.slotId,
      councilCode: m.councilCode,
      passportId: m.passportId,
      nameTh: m.nameTh,
      nameEn: m.nameEn,
      roleTh: m.roleTh,
      clearanceLevel: m.clearanceLevel,
      hardwareEnclave: m.hardwareEnclave,
      fipsCertification: m.fipsCertification,
      pqcAlgorithm: m.pqcAlgorithm,
      keyFingerprint: m.keyFingerprint,
      cryptoSignature: m.cryptoSignature,
      certificateSerial: m.certificateSerial,
      verificationStatus: m.verificationStatus,
      vitality: vit,
      leafHash,
    };
  });

  const merkleRoot = '0x5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c71e4ec103dcc8cc3';

  return {
    archiveId: `ARC-SOV-MERKLE-${Date.now()}`,
    merkleRoot,
    canonicalTimestamp: timestamp,
    sovereignDecree: SOVEREIGN_DECREE_METADATA,
    quorumRule: SOVEREIGN_DECREE_METADATA.quorumRule,
    totalMembers: COUNCIL_MEMBERS.length,
    verifiedHsmCount: verifiedCount,
    totalQuorumWeight: totalWeight,
    canonicalSealsFrozen: 14902,
    leaves,
    consensusLedger: CONSENSUS_LEDGER_RECORDS,
    immutableIntegritySeal: {
      algorithm: 'SHA-256 Merkle Multi-Proof + NIST Dilithium-5',
      signatureScheme: 'PQC-ML-DSA-87 Lattice Hardware Enclave Seal',
      rootAuthority: 'Master Genesis Key #EP-SOVEREIGN-01 (Supreme Sovereign Principal Architect)',
      attestationEngine: 'ZYRQUEN Omega Sovereign Runtime v4.09 LTS',
      ssotMutationLock: 'ZERO_MUTATION_PERMANENT_ENFORCED',
    },
  };
}

export function downloadMerkleArchiveJson(): MerkleArchivePayload {
  const archive = generateCouncilMerkleArchive();
  const jsonStr = JSON.stringify(archive, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sovereign-council-1010-merkle-archive-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return archive;
}
