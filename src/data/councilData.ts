/**
 * ZYRQUEN Ω∞ — Council Members & Governance Consensus Ledger
 * Deca-Key Quorum (10/10 REAL_HSM)
 */

import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from './canonicalData';

export interface GuardianVitality {
  subKelvinTemp: number;
  latencyMs: number;
  coherencePct: number;
  signatureCount: number;
  status: 'OPTIMAL' | 'ELEVATED' | 'SYNCING';
  uptimePct: number;
}

export interface CouncilMember {
  slotId: number;
  councilCode: string;
  name: string;
  role: string;
  passportId: string;
  hardwareModel: string;
  algorithm: string;
  pqcAlgorithm?: string;
  certificateSerial: string;
  fingerprint: string;
  jurisdiction: string;
  status: 'ONLINE' | 'STANDBY' | 'SYNCING';
  fipsLevel: string;
  votesCast: number;
  lastActive: string;
  signedTimestamp?: string;
  verificationStatus?: string;
  invariantRule?: string;
  keyFingerprint?: string;
  nameTh?: string;
  hardwareEnclave?: string;
  cryptoSignature?: string;
  heartbeat?: {
    latencyMs: number;
    pulseFrequencyHz: number;
  };
}

export const COUNCIL_MEMBERS: CouncilMember[] = [
  {
    slotId: 1,
    councilCode: 'TC-01',
    name: 'นายยุทธภูมิ พากเพียร',
    role: 'Supreme Sovereign Architect & Quorum Lead',
    passportId: '#EP-SOVEREIGN-01',
    hardwareModel: 'NitroKey 3 Pro (FIPS 140-3 L4)',
    algorithm: 'Dilithium-5 (ML-DSA-87)',
    certificateSerial: 'CERT-TC01-849202-01',
    fingerprint: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    jurisdiction: 'Kingdom of Thailand (ETDA Sec 9/26/28)',
    status: 'ONLINE',
    fipsLevel: 'FIPS 140-3 Level 4',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 2,
    councilCode: 'TC-02',
    name: 'ดร.กานต์พิชชา ภักดีสรวิชญ์',
    role: 'Chief Security Guardian',
    passportId: '#EP-SOVEREIGN-02',
    hardwareModel: 'YubiKey 5C NFC FIPS',
    algorithm: 'FALCON-1024',
    certificateSerial: 'CERT-TC02-849202-02',
    fingerprint: '4f8c9b1a2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    jurisdiction: 'Bangkok Secure Zone 1',
    status: 'ONLINE',
    fipsLevel: 'CC EAL6+ / FIPS 140-3 L3',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 3,
    councilCode: 'TC-03',
    name: 'รศ.ดร.ปรมินทร์ วงศ์วรเวทย์',
    role: 'Quantum Cryptography Lead',
    passportId: '#EP-SOVEREIGN-03',
    hardwareModel: 'NitroKey HSM 2',
    algorithm: 'Dilithium-5 / Kyber-1024',
    certificateSerial: 'CERT-TC03-849202-03',
    fingerprint: '7b2a9e4d5c6f1a8b3d0e9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f',
    jurisdiction: 'Bangkok Research Center',
    status: 'ONLINE',
    fipsLevel: 'FIPS 140-3 Level 4',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 4,
    councilCode: 'TC-04',
    name: 'ดร.ศุภชัย เตชะรัตนโกสุม',
    role: 'Distributed Systems Architect',
    passportId: '#EP-SOVEREIGN-04',
    hardwareModel: 'YubiKey 5 Nano FIPS',
    algorithm: 'SPHINCS+',
    certificateSerial: 'CERT-TC04-849202-04',
    fingerprint: '1c3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d',
    jurisdiction: 'Bangkok Network Core',
    status: 'ONLINE',
    fipsLevel: 'CC EAL6+',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 5,
    councilCode: 'TC-05',
    name: 'พญ.นลินี อัมพสุวรรณ',
    role: 'Causal AI Research Director',
    passportId: '#EP-SOVEREIGN-05',
    hardwareModel: 'NitroKey 3 Pro',
    algorithm: 'Dilithium-5 (ML-DSA-87)',
    certificateSerial: 'CERT-TC05-849202-05',
    fingerprint: '8f0a2c4e6b8d0a2c4e6b8d0a2c4e6b8d0a2c4e6b8d0a2c4e6b8d0a2c4e6b8d0a',
    jurisdiction: 'Chiang Mai Bio-Secure DR',
    status: 'ONLINE',
    fipsLevel: 'FIPS 140-3 Level 4',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 6,
    councilCode: 'TC-06',
    name: 'นายธีรพัฒน์ จิตต์ประภัสสร',
    role: 'Bio-Secure Identity Lead',
    passportId: '#EP-SOVEREIGN-06',
    hardwareModel: 'YubiKey Bio FIPS Edition',
    algorithm: 'FALCON-1024',
    certificateSerial: 'CERT-TC06-849202-06',
    fingerprint: '5e7a9c1d3f5e7a9c1d3f5e7a9c1d3f5e7a9c1d3f5e7a9c1d3f5e7a9c1d3f5e7a',
    jurisdiction: 'Chiang Mai Secondary Enclave',
    status: 'ONLINE',
    fipsLevel: 'FIPS 140-3 Level 3',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 7,
    councilCode: 'TC-07',
    name: 'ดร.อัจฉรา สุวรรณประสิทธิ์',
    role: 'Federated Learning Architect',
    passportId: '#EP-SOVEREIGN-07',
    hardwareModel: 'Ledger Flex Secure Enclave',
    algorithm: 'Dilithium-5 (ML-DSA-87)',
    certificateSerial: 'CERT-TC07-849202-07',
    fingerprint: '2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f',
    jurisdiction: 'Hong Kong Financial Edge',
    status: 'ONLINE',
    fipsLevel: 'CC EAL6+',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 8,
    councilCode: 'TC-08',
    name: 'นายวรพจน์ มหาสมุทรวิชัย',
    role: 'Treasury & RWA Custodian',
    passportId: '#EP-SOVEREIGN-08',
    hardwareModel: 'Trezor Safe 5 Enclave',
    algorithm: 'SPHINCS+',
    certificateSerial: 'CERT-TC08-849202-08',
    fingerprint: '7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c9e',
    jurisdiction: 'Hong Kong Depository Vault',
    status: 'ONLINE',
    fipsLevel: 'CC EAL6+',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 9,
    councilCode: 'TC-09',
    name: 'ผศ.ดร.เกรียงไกร ชัยชนะพาณิชย์',
    role: 'Global Mesh Topology Lead',
    passportId: '#EP-SOVEREIGN-09',
    hardwareModel: 'NitroKey 3 Pro',
    algorithm: 'Dilithium-5 (ML-DSA-87)',
    certificateSerial: 'CERT-TC09-849202-09',
    fingerprint: '4b6d8f0a2c4b6d8f0a2c4b6d8f0a2c4b6d8f0a2c4b6d8f0a2c4b6d8f0a2c4b6d',
    jurisdiction: 'Singapore Gateway Edge',
    status: 'ONLINE',
    fipsLevel: 'FIPS 140-3 Level 4',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
  {
    slotId: 10,
    councilCode: 'TC-10',
    name: 'ดร.พิมลดา รัตนโชติอนันต์',
    role: 'Differential Privacy & Ethics',
    passportId: '#EP-SOVEREIGN-10',
    hardwareModel: 'YubiKey 5C NFC FIPS',
    algorithm: 'FALCON-1024',
    certificateSerial: 'CERT-TC10-849202-10',
    fingerprint: '1a3c5e7b9d1a3c5e7b9d1a3c5e7b9d1a3c5e7b9d1a3c5e7b9d1a3c5e7b9d1a3c',
    jurisdiction: 'Singapore Privacy Enclave',
    status: 'ONLINE',
    fipsLevel: 'CC EAL6+',
    votesCast: 14902,
    lastActive: '2026-09-30 21:18:47 ICT',
  },
];

export function getMemberVitality(member: CouncilMember | number): GuardianVitality {
  const slot = typeof member === 'number' ? member : member.slotId;
  return {
    subKelvinTemp: Number((14.92 + slot * 0.012).toFixed(4)),
    latencyMs: Number((0.85 + slot * 0.12).toFixed(2)),
    coherencePct: 99.992,
    signatureCount: 14902,
    status: 'OPTIMAL',
    uptimePct: 99.999,
  };
}

export interface MerkleArchivePayload {
  archiveId: string;
  genesisBlock: number;
  merkleRoot: string;
  quorumStatus: string;
  members: CouncilMember[];
  exportDateIso: string;
}

export function generateCouncilMerkleArchive(): MerkleArchivePayload {
  return {
    archiveId: `ARCHIVE-COUNCIL-DECA-${CANONICAL_GENESIS_BLOCK}`,
    genesisBlock: CANONICAL_GENESIS_BLOCK,
    merkleRoot: CANONICAL_MERKLE_ROOT,
    quorumStatus: '10/10 REAL_HSM Unanimous Ratification',
    members: COUNCIL_MEMBERS,
    exportDateIso: new Date().toISOString(),
  };
}

export function downloadMerkleArchiveJson(): void {
  const payload = generateCouncilMerkleArchive();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `council-merkle-archive-block${CANONICAL_GENESIS_BLOCK}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export const SOVEREIGN_DECREE_METADATA = {
  decreeId: 'DECREE-SOV-2026-849202',
  title: 'Sovereign Consensus Ratification Decree',
  blockHeight: CANONICAL_GENESIS_BLOCK,
  merkleRoot: CANONICAL_MERKLE_ROOT,
  issuingAuthority: 'Sovereign Council of Ten Custodians',
  legalClause: 'Thai Electronic Transactions Act B.E. 2544 Sections 9, 26, 28',
};

export type VoteDecision = 'YES' | 'NO' | 'ABSTAIN' | 'PENDING';

export interface CouncilMemberVote {
  slotId: number;
  councilCode: string;
  nameTh: string;
  passportId: string;
  vote: VoteDecision;
  signedAt: string;
  hsmSignatureDigest: string;
  weight: number;
  latencyMs: number;
}

export interface ConsensusOverrideProposal {
  id: string;
  categoryTh: string;
  status: 'RATIFIED_IMMUTABLE' | 'EXECUTED' | 'ACTIVE_VOTING';
  statusTh: string;
  titleTh: string;
  titleEn: string;
  quorumRequired: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votesPending: number;
  proposedTimestamp: string;
  proposedBy: {
    councilCode: string;
    nameTh: string;
  };
  detailedDescriptionTh: string;
  merkleRootHash: string;
  hardwareAttestationSeal: string;
  memberVotes: CouncilMemberVote[];
}

const DEFAULT_MEMBER_VOTES: CouncilMemberVote[] = COUNCIL_MEMBERS.map((m) => ({
  slotId: m.slotId,
  councilCode: m.councilCode,
  nameTh: m.name,
  passportId: m.passportId.replace('#', ''),
  vote: 'YES',
  signedAt: m.lastActive,
  hsmSignatureDigest: `0x${m.fingerprint.slice(0, 16)}...${m.fingerprint.slice(-8)}`,
  weight: 1,
  latencyMs: 1.2 + m.slotId * 0.15,
}));

export const CONSENSUS_LEDGER_RECORDS: ConsensusOverrideProposal[] = [
  {
    id: 'PROP-SOV-2026-005',
    categoryTh: 'วิทยาการรหัสลับควอนตัม (Quantum Cryptography)',
    status: 'RATIFIED_IMMUTABLE',
    statusTh: 'สัตยาบันถาวร (10/10 Full Quorum Sealed)',
    titleTh: 'ขยายเกณฑ์การทนทานต่อควอนตัมสู่ FIPS 204 ML-DSA-87 Level 5',
    titleEn: 'Elevate Post-Quantum Invariant to NIST FIPS 204 Crystals-Dilithium-5 Parameter Set 5',
    quorumRequired: 8,
    votesFor: 10,
    votesAgainst: 0,
    votesAbstain: 0,
    votesPending: 0,
    proposedTimestamp: '2026-09-30 21:18:47 ICT',
    proposedBy: {
      councilCode: 'TC-01',
      nameTh: 'นายยุทธภูมิ พากเพียร',
    },
    detailedDescriptionTh: 'ยกระดับมาตรฐานการลงนามดิจิทัลของสภาผู้พิทักษ์ทั้ง 10 จุด ให้บังคับใช้อัลกอริทึม Dilithium-5 (ML-DSA-87) อย่างเต็มรูปแบบ ป้องกันการถอดรหัสในอนาคตด้วยคอมพิวเตอร์ควอนตัมตามมาตรฐาน FIPS 204',
    merkleRootHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    hardwareAttestationSeal: 'SEAL-DECA-FIPS140-3-L4-ACTIVE-UNANIMOUS',
    memberVotes: DEFAULT_MEMBER_VOTES,
  },
  {
    id: 'PROP-SOV-2026-004',
    categoryTh: 'ความมั่นคงปลอดภัยฮาร์ดแวร์ (HSM & WORM)',
    status: 'EXECUTED',
    statusTh: 'บังคับใช้แล้ว (Executed in Genesis Block #849202)',
    titleTh: 'การตรึงห่วงโซ่พยานหลักฐานดิจิทัล WORM ไร้การกลายพันธุ์ (SSoT Δ0.00%)',
    titleEn: 'WORM Immutable Audit Chain & Zero Mutation Enforcement',
    quorumRequired: 8,
    votesFor: 10,
    votesAgainst: 0,
    votesAbstain: 0,
    votesPending: 0,
    proposedTimestamp: '2026-09-30 20:45:10 ICT',
    proposedBy: {
      councilCode: 'TC-02',
      nameTh: 'ดร.กานต์พิชชา ภักดีสรวิชญ์',
    },
    detailedDescriptionTh: 'กำหนดให้อุปกรณ์จัดเก็บข้อมูลพยานหลักฐานทำงานในโหมด Write-Once-Read-Many (WORM) ถาวร ห้ามการแก้ไขหรือลบประวัติการตรวจสอบทุกกรณีตามมาตรฐาน ETDA Section 28',
    merkleRootHash: '0x14901deadbeef909ab814479844d8a14816bed34cdbb07528e18501da86fc469',
    hardwareAttestationSeal: 'SEAL-WORM-ETDA-SEC28-COMPLIANT',
    memberVotes: DEFAULT_MEMBER_VOTES,
  },
  {
    id: 'PROP-SOV-2026-003',
    categoryTh: 'โครงข่ายกระจายศูนย์ (Sovereign Multi-Mesh)',
    status: 'RATIFIED_IMMUTABLE',
    statusTh: 'สัตยาบันถาวร (Quorum Reached & Sealed)',
    titleTh: 'การแยกส่วนเครือข่าย OpenTelemetry และการจำกัดสิทธิการเขียน (Read-Only Telemetry)',
    titleEn: 'OpenTelemetry Isolation & Strict Read-Only Authority Boundary',
    quorumRequired: 8,
    votesFor: 9,
    votesAgainst: 0,
    votesAbstain: 1,
    votesPending: 0,
    proposedTimestamp: '2026-09-30 19:30:00 ICT',
    proposedBy: {
      councilCode: 'TC-09',
      nameTh: 'ผศ.ดร.เกรียงไกร ชัยชนะพาณิชย์',
    },
    detailedDescriptionTh: 'ตัดสิทธิการเข้าถึงฐานข้อมูลหลักจากทราฟฟิก Telemetry ทั้งหมด และกำหนดให้ข้อมูลสถิติทำงานภายใต้ Sandbox แยกส่วน ป้องกันช่องโหว่ด้าน Injection หรือ Manipulation',
    merkleRootHash: '0x5a13396c129c611f15232fdaf54bfad021b33c1d932e652a263c9b83b6e82c1a',
    hardwareAttestationSeal: 'SEAL-MESH-BFT-ISOLATION-PASS',
    memberVotes: DEFAULT_MEMBER_VOTES.map((mv, idx) => idx === 7 ? { ...mv, vote: 'ABSTAIN' as const, weight: 0 } : mv),
  },
];
