/**
 * ZYRQUEN Ω∞ Canonical Legal Statutes & Category Registry
 * Grounded in Thai Statutory Law (ETDA, PDPA, NCSA) and International Cryptographic Standards (ISO/IEC 27037, NIST PQC)
 * Genesis Block #849202 • SSoT Δ0 Zero-Drift
 */

export type LegalCategory =
  | 'ALL'
  | 'ETDA'
  | 'PDPA'
  | 'INTERNATIONAL_STANDARDS'
  | 'CYBER_NCSA';

export interface CategoryOption {
  id: LegalCategory;
  labelEn: string;
  labelTh: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
  countKey?: string;
}

export const LEGAL_CATEGORIES: CategoryOption[] = [
  {
    id: 'ALL',
    labelEn: 'All Categories',
    labelTh: 'ทุกหมวดหมู่กฎหมาย',
    shortLabel: 'All',
    description: 'Universal statutory corpus across Thai Laws, International Standards, and Cryptographic Specifications.',
    badgeBg: 'bg-white/10',
    badgeText: 'text-zinc-200',
    borderColor: 'border-white/20',
    accentColor: '#94A3B8',
  },
  {
    id: 'ETDA',
    labelEn: 'ETDA & Electronic Transactions',
    labelTh: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544',
    shortLabel: 'ETDA',
    description: 'Electronic Signatures, Non-Repudiation, Legal Admissibility (Section 9, 26, 28) and ETDA Standards.',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    borderColor: 'border-cyan-500/30',
    accentColor: '#06B6D4',
  },
  {
    id: 'PDPA',
    labelEn: 'PDPA & Data Protection',
    labelTh: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
    shortLabel: 'PDPA',
    description: 'Data Protection, PII Isolation, Field-Level Security Safeguards (Section 19, 27, 37) and Data Controller Duties.',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
    accentColor: '#10B981',
  },
  {
    id: 'INTERNATIONAL_STANDARDS',
    labelEn: 'International Standards & PQC',
    labelTh: 'มาตรฐานสากล ISO/IEC & NIST PQC',
    shortLabel: 'Intl Standards',
    description: 'ISO/IEC 27037:2012 Digital Evidence Custody, NIST FIPS 203/204/205 PQC, RFC 3161 TSA, FIPS 140-3 HSM Quorum.',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    accentColor: '#F59E0B',
  },
  {
    id: 'CYBER_NCSA',
    labelEn: 'Cybersecurity & NCSA',
    labelTh: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์',
    shortLabel: 'Cyber NCSA',
    description: 'National Cybersecurity Act B.E. 2562, Critical Information Infrastructure (CII) protection, and risk mitigation.',
    badgeBg: 'bg-violet-500/15',
    badgeText: 'text-violet-300',
    borderColor: 'border-violet-500/30',
    accentColor: '#8B5CF6',
  },
];

export interface PinnedStatute {
  id: string;
  statuteNumber: string;
  title: string;
  actName: string;
  category: LegalCategory;
  categoryLabel: string;
  summary: string;
  fullText: string;
  legalWeight: 'HIGH_RELIABILITY' | 'MANDATORY' | 'INTERNATIONAL_STANDARD' | 'CRITICAL_DUTY';
  statutoryRef: string;
  citations: Array<{ title: string; uri: string }>;
  pinnedAt: string;
  query: string;
  tags: string[];
  forensicProofBinding: string;
}

export const CANONICAL_PINNED_STATUTES: PinnedStatute[] = [
  {
    id: 'statute-etda-sec-26',
    statuteNumber: 'มาตรา 26',
    title: 'ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ระดับสูง (High-Reliability Electronic Signature)',
    actName: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (แก้ไขเพิ่มเติม พ.ศ. 2562)',
    category: 'ETDA',
    categoryLabel: 'ETDA & Electronic Transactions',
    legalWeight: 'HIGH_RELIABILITY',
    statutoryRef: 'Section 26 — High-Reliability Electronic Signature Presumption',
    summary: 'ข้อสันนิษฐานทางกฎหมายให้เป็นลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้สูงสุด เมื่อข้อมูลสำหรับใช้สร้างลายมือชื่อเชื่อมโยงกับผู้ลงลายมือชื่อ อยู่ภายใต้การควบคุมเฉพาะของผู้ลงลายมือชื่อ และสามารถตรวจพบการแก้ไขเปลี่ยนแปลงย้อนหลังได้ทุกประการ',
    fullText: 'มาตรา ๒๖ ลายมือชื่ออิเล็กทรอนิกส์ให้ถือว่าเป็นลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ ถ้าเป็นไปตามหลักเกณฑ์ดังต่อไปนี้:\n(๑) ข้อมูลสำหรับใช้สร้างลายมือชื่อนั้นได้เชื่อมโยงไปยังผู้ลงลายมือชื่อโดยเฉพาะเจาะจงภายใต้สภาพแวดล้อมที่นำมาใช้\n(๒) ในขณะลงลายมือชื่อ ข้อมูลสำหรับใช้สร้างลายมือชื่อนั้นอยู่ภายใต้การควบคุมของผู้ลงลายมือชื่อโดยไม่มีการกระทำของบุคคลอื่น\n(๓) การเปลี่ยนแปลงใดๆ ที่เกิดขึ้นกับลายมือชื่ออิเล็กทรอนิกส์นั้นนับแต่เวลาที่ลงลายมือชื่อสามารถตรวจพบได้\n(๔) ในกรณีที่กฎหมายกำหนดให้ต้องมีลายมือชื่อเพื่อเป็นพยานหลักฐานแห่งความสมบูรณ์และถูกต้องของข้อความ การเปลี่ยนแปลงใดๆ แก่ข้อความนั้นสามารถตรวจพบได้นับแต่เวลาที่ลงลายมือชื่อ\n\n[ZYRQUEN Implementation]: รองรับด้วย 10/10 REAL_HSM Unanimous Quorum, FIPS 204 ML-DSA-87 (Dilithium-5) และ Genesis Merkle Root #849202 สอดคล้องตามข้อ (๑)-(๔) ครบถ้วน 100%',
    citations: [
      { title: 'สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์ (ETDA)', uri: 'https://www.etda.or.th' },
      { title: 'ราชกิจจานุเบกษา — พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544', uri: 'https://www.ratchakitcha.soc.go.th' },
      { title: 'ETDA Guidelines on Electronic Signatures (ขมธอ. 23-2563)', uri: 'https://www.etda.or.th/th/Useful-Resource/publications/standard.aspx' },
    ],
    pinnedAt: '2026-09-26T00:00:00.000Z',
    query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 26 ลายมือชื่อเชื่อถือได้ ETDA',
    tags: ['ETDA', 'มาตรา 26', 'High-Reliability', 'Dilithium-5', 'HSM Quorum', 'ลายมือชื่อดิจิทัล'],
    forensicProofBinding: 'Chamber 00 Merkle Root 0x909ab814... • 10/10 REAL_HSM Ratified',
  },
  {
    id: 'statute-etda-sec-9',
    statuteNumber: 'มาตรา 9',
    title: 'การรับรองผลทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์ (Legal Validity & Intent)',
    actName: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544',
    category: 'ETDA',
    categoryLabel: 'ETDA & Electronic Transactions',
    legalWeight: 'MANDATORY',
    statutoryRef: 'Section 9 — Legal Recognition of Electronic Signatures',
    summary: 'ในกรณีที่กฎหมายกำหนดให้มีการลงลายมือชื่อ ให้ถือว่าข้อมูลอิเล็กทรอนิกส์นั้นมีการลงลายมือชื่อแล้ว หากใช้วิธีการที่สามารถระบุตัวเจ้าของลายมือชื่อและแสดงเจตนารับรองข้อความในข้อมูลอิเล็กทรอนิกส์',
    fullText: 'มาตรา ๙ ในกรณีที่กฎหมายกำหนดให้มีการลงลายมือชื่อ ให้ถือว่าข้อมูลอิเล็กทรอนิกส์นั้นมีการลงลายมือชื่อแล้ว ถ้า\n(๑) ใช้วิธีการที่สามารถระบุตัวบุคคลผู้เป็นเจ้าของลายมือชื่อ และสามารถแสดงได้ว่าบุคคลดังกล่าวยอมรับข้อความในข้อมูลอิเล็กทรอนิกส์นั้นว่าเป็นของตน และ\n(๒) ใช้วิธีการอันเชื่อถือได้ซึ่งเหมาะสมกับวัตถุประสงค์ของการสร้างหรือส่งข้อมูลอิเล็กทรอนิกส์ โดยคำนึงถึงพฤติการณ์แวดล้อมทั้งปวงหรือข้อตกลงของคู่กรณี\n\n[ZYRQUEN Implementation]: ระบุตัวตนผู้ถือสิทธิ์ Sovereign Principal (#EP-SOVEREIGN-01 นายยุทธภูมิ พากเพียร) ผ่าน FIPS 204 Digital Signature และ RFC 3161 Hardware TSA UTC(NIMT)',
    citations: [
      { title: 'ราชกิจจานุเบกษา — มาตรา 9 พ.ร.บ. ธุรกรรมฯ', uri: 'https://www.ratchakitcha.soc.go.th' },
      { title: 'ETDA — ข้อแนะนำการใช้ลายมือชื่ออิเล็กทรอนิกส์ตามมาตรา 9', uri: 'https://www.etda.or.th' },
    ],
    pinnedAt: '2026-09-26T00:00:00.000Z',
    query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 9 การระบุตัวตนและเจตนา',
    tags: ['ETDA', 'มาตรา 9', 'Legal Intent', 'Identity Assurance', 'Electronic Signature'],
    forensicProofBinding: 'W3C WebAuthn Biometrics + FIPS 204 Signature Anchor',
  },
  {
    id: 'statute-etda-sec-28',
    statuteNumber: 'มาตรา 28',
    title: 'หน้าที่ในการดูแลรักษาข้อมูลสร้างลายมือชื่อและพยานหลักฐาน (Duty of Care & Immutable Ledger)',
    actName: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544',
    category: 'ETDA',
    categoryLabel: 'ETDA & Electronic Transactions',
    legalWeight: 'CRITICAL_DUTY',
    statutoryRef: 'Section 28 — Signatory Duty of Care & Storage Requirements',
    summary: 'กำหนดหน้าที่ของผู้ลงลายมือชื่อในการใช้ความระมัดระวังตามสมควรเพื่อมิให้ข้อมูลสำหรับใช้สร้างลายมือชื่อถูกนำไปใช้โดยมิชอบ และจัดเก็บหลักฐานในระบบ WORM เพื่อคงความครบถ้วนสมบูรณ์ของหลักฐานศาล',
    fullText: 'มาตรา ๒๘ ผู้ลงลายมือชื่อมีหน้าที่ดังต่อไปนี้:\n(๑) ใช้ความระมัดระวังตามสมควรเพื่อมิให้ข้อมูลสำหรับใช้สร้างลายมือชื่อของตนถูกนำไปใช้โดยมิชอบ\n(๒) แจ้งให้บุคคลที่ตนรู้หรือควรจะได้รู้ว่าจะอาศัยลายมือชื่ออิเล็กทรอนิกส์ของตน หรือผู้ให้บริการออกใบรับรองทราบโดยไม่ชักช้าเมื่อรู้ว่าข้อมูลสำหรับใช้สร้างลายมือชื่อของตนสูญหาย ถูกทำลาย หรือถูกล่วงรู้\n\n[ZYRQUEN Implementation]: จัดเก็บลงบน WORM Vault (Write Once, Read Many) 14,902 Canonical Seals พร้อมการตัดสิทธิ์อัตโนมัติ Zero-Drift Δ0.00% เมื่อตรวจพบความเสี่ยง ≥85%',
    citations: [
      { title: 'สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์ (ETDA)', uri: 'https://www.etda.or.th' },
      { title: 'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม (MDES)', uri: 'https://www.mdes.go.th' },
    ],
    pinnedAt: '2026-09-26T00:00:00.000Z',
    query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 28 หน้าที่ความระมัดระวัง WORM',
    tags: ['ETDA', 'มาตรา 28', 'WORM Storage', 'Duty of Care', 'Chain of Custody'],
    forensicProofBinding: 'Genesis Block #849202 Immutable WORM Storage',
  },
  {
    id: 'statute-pdpa-sec-37',
    statuteNumber: 'มาตรา 37',
    title: 'มาตรการรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคล (PII Safeguards & Isolation)',
    actName: 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
    category: 'PDPA',
    categoryLabel: 'PDPA & Data Protection',
    legalWeight: 'MANDATORY',
    statutoryRef: 'PDPA B.E. 2562 Section 37 — Security Measures & Data Controller Obligations',
    summary: 'ผู้ควบคุมข้อมูลส่วนบุคคลต้องจัดให้มีมาตรการรักษาความมั่นคงปลอดภัยที่เหมาะสม ป้องกันการสูญหาย เข้าถึง ใช้ เปลี่ยนแปลง แก้ไข หรือเปิดเผยข้อมูลส่วนบุคคลโดยมิชอบหรือโดยปราศจากอำนาจ',
    fullText: 'มาตรา ๓๗ ผู้ควบคุมข้อมูลส่วนบุคคลมีหน้าที่ดังต่อไปนี้:\n(๑) จัดให้มีมาตรการรักษาความมั่นคงปลอดภัยที่เหมาะสม เพื่อป้องกันการสูญหาย เข้าถึง ใช้ เปลี่ยนแปลง แก้ไข หรือเปิดเผยข้อมูลส่วนบุคคลโดยปราศจากอำนาจหรือโดยมิชอบ\n(๒) ดำเนินการเพื่อป้องกันมิให้ผู้อื่นใช้หรือเปิดเผยข้อมูลส่วนบุคคลโดยปราศจากอำนาจหรือโดยมิชอบ\n(๓) จัดให้มีระบบการตรวจสอบเพื่อดำเนินการลบหรือทำลายข้อมูลส่วนบุคคลเมื่อพ้นกำหนดระยะเวลาการเก็บรักษา\n\n[ZYRQUEN Implementation]: แยกเก็บ PII ใน Ring-04 Buffer Gamma นอกสายโซ่บล็อกเชน ใช้เทคโนโลยี zk-SNARKs และ Field-Level Zeroization คุ้มครองความเป็นส่วนตัว 100%',
    citations: [
      { title: 'สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส. / PDPC)', uri: 'https://www.pdpc.or.th' },
      { title: 'ราชกิจจานุเบกษา — พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562', uri: 'https://www.ratchakitcha.soc.go.th' },
    ],
    pinnedAt: '2026-09-26T00:00:00.000Z',
    query: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล 2562 มาตรา 37 มาตรการความปลอดภัย PDPA',
    tags: ['PDPA', 'มาตรา 37', 'PII Isolation', 'zk-SNARKs', 'Data Protection'],
    forensicProofBinding: 'zk-SNARKs Ring-04 Buffer Gamma Isolation Enclave',
  },
  {
    id: 'statute-iso-27037',
    statuteNumber: 'ISO/IEC 27037',
    title: 'แนวปฏิบัติในการระบุ รวบรวม ได้มา และเก็บรักษาพยานหลักฐานดิจิทัล (Digital Evidence Preservation)',
    actName: 'ISO/IEC 27037:2012 Information technology — Security techniques',
    category: 'INTERNATIONAL_STANDARDS',
    categoryLabel: 'International Standards & PQC',
    legalWeight: 'INTERNATIONAL_STANDARD',
    statutoryRef: 'ISO/IEC 27037:2012 Clause 6 & 7 — Evidence Handling & Chain of Custody',
    summary: 'มาตรฐานสากลว่าด้วยกระบวนการจัดการพยานหลักฐานดิจิทัล เพื่อให้พยานหลักฐานมีความน่าเชื่อถือ ยอมรับได้ในชั้นศาล (Court Admissibility) และสามารถตรวจสอบซ้ำได้ด้วยค่าแฮชและกระบวนการคงสภาพเดิม (Repeatability & Integrity)',
    fullText: 'ISO/IEC 27037:2012 provides guidelines for specific activities in the handling of digital evidence: identification, collection, acquisition and preservation of digital evidence that may be of evidential value.\nKey Core Principles:\n1. Auditability: Complete chain of custody logging from inception to presentation.\n2. Repeatability: Independent forensic examiners obtain identical bit-exact Merkle proofs.\n3. Defensibility: Protection against tampering using cryptographic integrity and TSA timestamps.\n\n[ZYRQUEN Implementation]: บรรจุลงในแฟ้มหลักฐานคำให้การศาล จพ.๐๑-๐๗ พร้อมการสอบทาน 12-Stage Deterministic Trace Replay <142ms',
    citations: [
      { title: 'International Organization for Standardization (ISO/IEC 27037)', uri: 'https://www.iso.org/standard/53595.html' },
      { title: 'ETDA — คู่มือแนวปฏิบัติการจัดการพยานหลักฐานดิจิทัล', uri: 'https://www.etda.or.th' },
    ],
    pinnedAt: '2026-09-26T00:00:00.000Z',
    query: 'ISO/IEC 27037 Digital Evidence Preservation Chain of Custody',
    tags: ['ISO/IEC 27037', 'Chain of Custody', 'Digital Forensics', 'Evidence Admissibility'],
    forensicProofBinding: 'Dossier จพ.๐๑-๐๗ Forensic Matrix & RFC 3161 TSA',
  },
  {
    id: 'statute-nist-fips-204',
    statuteNumber: 'NIST FIPS 204',
    title: 'มาตรฐานลายมือชื่อดิจิทัลพ้นควอนตัม (Module-Lattice-Based Digital Signature Algorithm - ML-DSA)',
    actName: 'NIST Federal Information Processing Standards Publication 204 (August 2024)',
    category: 'INTERNATIONAL_STANDARDS',
    categoryLabel: 'International Standards & PQC',
    legalWeight: 'INTERNATIONAL_STANDARD',
    statutoryRef: 'FIPS 204 ML-DSA-87 (Dilithium-5) Category 5 Post-Quantum Security',
    summary: 'มาตรฐานสากลของสถาบันมาตรฐานและเทคโนโลยีแห่งชาติสหรัฐอเมริกา (NIST) สำหรับลายมือชื่อดิจิทัลที่ทนทานต่อการโจมตีด้วยคอมพิวเตอร์ควอนตัม (Quantum-Resistant Cryptography) ใช้แทน RSA และ ECDSA',
    fullText: 'FIPS 204 specifies the Module-Lattice-Based Digital Signature Algorithm (ML-DSA), derived from CRYSTALS-Dilithium. ML-DSA provides security against cryptanalytic attacks launched using quantum computers by relying on the hardness of lattice problems in algebraic number fields.\nSecurity Level: Category 5 (equivalent to AES-256 brute-force resistance).\n\n[ZYRQUEN Implementation]: ผูกโยงกับฐานข้อมูลกฎหมายไทยตาม พ.ร.บ. ธุรกรรมฯ มาตรา ๒๖ ในฐานะลายมือชื่ออิเล็กทรอนิกส์ที่มีความเชื่อถือได้ระดับสูงสุด (High-Reliability)',
    citations: [
      { title: 'NIST Post-Quantum Cryptography Standardization (FIPS 204)', uri: 'https://csrc.nist.gov/pubs/fips/204/final' },
      { title: 'ETDA Post-Quantum Cryptography Transition Readiness Guide', uri: 'https://www.etda.or.th' },
    ],
    pinnedAt: '2026-09-26T00:00:00.000Z',
    query: 'NIST FIPS 204 ML-DSA Dilithium Post-Quantum Cryptography ETDA',
    tags: ['NIST FIPS 204', 'ML-DSA-87', 'Dilithium-5', 'Post-Quantum', 'Category 5'],
    forensicProofBinding: '10/10 REAL_HSM FIPS 140-3 Level 4 ML-DSA Enclave',
  },
  {
    id: 'statute-ncsa-sec-13',
    statuteNumber: 'พ.ร.บ. ไซเบอร์ มาตรา 13',
    title: 'การรักษาความมั่นคงปลอดภัยไซเบอร์ของหน่วยงานโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (CII Security)',
    actName: 'พระราชบัญญัติการรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562',
    category: 'CYBER_NCSA',
    categoryLabel: 'Cybersecurity & NCSA',
    legalWeight: 'MANDATORY',
    statutoryRef: 'Section 13 — Critical Information Infrastructure (CII) Cybersecurity Standards',
    summary: 'กำหนดให้หน่วยงานโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (CII) ต้องจัดให้มีมาตรการรักษาความมั่นคงปลอดภัยไซเบอร์ขั้นต่ำตามที่คณะกรรมการกำหนด และมีกลไกเฝ้าระวัง แจ้งเตือน และรับมือภัยคุกคามแบบเรียลไทม์',
    fullText: 'มาตรา ๑๓ เพื่อประโยชน์ในการรักษาความมั่นคงปลอดภัยไซเบอร์ ให้คณะกรรมการมีอำนาจหน้าที่กำหนดนโยบายและแผนปฏิบัติการ มาตรฐาน และแนวทางปฏิบัติในการรักษาความมั่นคงปลอดภัยไซเบอร์สำหรับหน่วยงานโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (CII)\n\n[ZYRQUEN Implementation]: ระบบติดตั้ง Ring-04 Chamber 02 Fail-Closed Buffer และระบบตัดวงจรอัตโนมัติ (Cutoff Threshold 85.0°C / Anomaly Score ≥0.85) ป้องกันภัยคุกคามทางไซเบอร์แบบ zero-trust',
    citations: [
      { title: 'สำนักงานคณะกรรมการการรักษาความมั่นคงปลอดภัยไซเบอร์แห่งชาติ (สกมช. / NCSA)', uri: 'https://www.ncsa.or.th' },
      { title: 'ราชกิจจานุเบกษา — พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562', uri: 'https://www.ratchakitcha.soc.go.th' },
    ],
    pinnedAt: '2026-09-26T00:00:00.000Z',
    query: 'พ.ร.บ. ความมั่นคงปลอดภัยไซเบอร์ 2562 NCSA CII โครงสร้างพื้นฐานสำคัญ',
    tags: ['NCSA', 'Cybersecurity', 'CII', 'โครงสร้างพื้นฐานสำคัญ', 'Fail-Closed'],
    forensicProofBinding: 'Chamber 02 Sentinel AI Ring-04 Cyber Isolation Gate',
  },
];

export interface CategoryPresetQuery {
  category: LegalCategory;
  categoryNameEn: string;
  title: string;
  statuteRef: string;
  query: string;
  badgeText: string;
  weight: string;
}

export const CATEGORY_PRESET_QUERIES: CategoryPresetQuery[] = [
  // ETDA Presets
  {
    category: 'ETDA',
    categoryNameEn: 'ETDA',
    title: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 26 (ลายมือชื่อเชื่อถือได้)',
    statuteRef: 'ETDA Sec 26 (High-Reliability)',
    query: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 26 ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ มาตรฐาน ETDA',
    badgeText: 'มาตรา 26',
    weight: 'HIGH_RELIABILITY',
  },
  {
    category: 'ETDA',
    categoryNameEn: 'ETDA',
    title: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 9 (ผลทางกฎหมายและการระบุตัวตน)',
    statuteRef: 'ETDA Sec 9 (Legal Intent)',
    query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 9 การระบุตัวบุคคลและเจตนายอมรับข้อความ',
    badgeText: 'มาตรา 9',
    weight: 'MANDATORY',
  },
  {
    category: 'ETDA',
    categoryNameEn: 'ETDA',
    title: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 28 (หน้าที่ความระมัดระวัง WORM)',
    statuteRef: 'ETDA Sec 28 (Duty of Care)',
    query: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 28 หน้าที่การเก็บรักษาข้อมูล WORM Ledger',
    badgeText: 'มาตรา 28',
    weight: 'CRITICAL_DUTY',
  },
  // PDPA Presets
  {
    category: 'PDPA',
    categoryNameEn: 'PDPA',
    title: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา 37 (มาตรการความปลอดภัย)',
    statuteRef: 'PDPA Sec 37 (Safeguards)',
    query: 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 PDPA Thailand มาตรา 37 ข้อกำหนดความมั่นคงปลอดภัย PII',
    badgeText: 'มาตรา 37',
    weight: 'MANDATORY',
  },
  {
    category: 'PDPA',
    categoryNameEn: 'PDPA',
    title: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา 19 & 27 (ฐานการประมวลผลข้อมูล)',
    statuteRef: 'PDPA Sec 19/27 (Lawful Basis)',
    query: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา 19 ความยินยอม และมาตรา 27 ข้อมูลอ่อนไหว',
    badgeText: 'มาตรา 19/27',
    weight: 'MANDATORY',
  },
  // International Standards Presets
  {
    category: 'INTERNATIONAL_STANDARDS',
    categoryNameEn: 'International Standards',
    title: 'ISO/IEC 27037:2012 มาตรฐานการเก็บรักษาพยานหลักฐานดิจิทัล (Digital Evidence)',
    statuteRef: 'ISO/IEC 27037 (Evidence)',
    query: 'ISO/IEC 27037:2012 Guidelines for identification collection acquisition and preservation of digital evidence court admissibility',
    badgeText: 'ISO 27037',
    weight: 'INTERNATIONAL_STANDARD',
  },
  {
    category: 'INTERNATIONAL_STANDARDS',
    categoryNameEn: 'International Standards',
    title: 'NIST FIPS 203 / 204 / 205 มาตรฐานวิทยาการรหัสลับพ้นควอนตัม (PQC Standards)',
    statuteRef: 'NIST PQC (FIPS 203/204/205)',
    query: 'NIST Post-Quantum Cryptography standards FIPS 203 ML-KEM FIPS 204 ML-DSA FIPS 205 SLH-DSA Merkle ledger compliance',
    badgeText: 'FIPS 204',
    weight: 'INTERNATIONAL_STANDARD',
  },
  {
    category: 'INTERNATIONAL_STANDARDS',
    categoryNameEn: 'International Standards',
    title: 'RFC 3161 Internet X.509 PKI Time-Stamp Protocol (NIMT UTC Anchor)',
    statuteRef: 'RFC 3161 (TSA Timestamp)',
    query: 'RFC 3161 Time-Stamp Protocol cryptographic legal evidence verification NIMT UTC anchor',
    badgeText: 'RFC 3161',
    weight: 'INTERNATIONAL_STANDARD',
  },
  // Cybersecurity NCSA Presets
  {
    category: 'CYBER_NCSA',
    categoryNameEn: 'Cybersecurity',
    title: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (NCSA CII Thailand)',
    statuteRef: 'NCSA Act B.E. 2562',
    query: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 โครงสร้างพื้นฐานสำคัญทางสารสนเทศ CII NCSA Thailand',
    badgeText: 'พ.ร.บ. ไซเบอร์',
    weight: 'MANDATORY',
  },
  {
    category: 'CYBER_NCSA',
    categoryNameEn: 'Cybersecurity',
    title: 'กรอบมาตรฐานการประเมินความเสี่ยงและมาตรการตอบสนองภัยคุกคามไซเบอร์',
    statuteRef: 'NCSA Threat Response Framework',
    query: 'ประกาศ สกมช. มาตรฐานและแนวทางปฏิบัติการประเมินความเสี่ยงและรับมือภัยคุกคามทางไซเบอร์ CII',
    badgeText: 'สกมช. CII',
    weight: 'MANDATORY',
  },
];
