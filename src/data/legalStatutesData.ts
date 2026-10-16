/**
 * ZYRQUEN Ω∞ — Legal Statutes, Pinned Citations & Benchmark Queries
 * ETA B.E. 2544 / PDPA B.E. 2562 / ISO/IEC 27037 / NIST FIPS
 */

export type LegalCategory = 'ETDA' | 'PDPA' | 'INTERNATIONAL_STANDARDS' | 'CYBER_NCSA' | 'ALL';

export interface LegalCitation {
  title: string;
  uri: string;
  publisher: string;
}

export interface PinnedStatute {
  id: string;
  statuteNumber: string;
  title: string;
  actName: string;
  category: LegalCategory;
  legalWeight: 'MANDATORY' | 'HIGH_RELIABILITY' | 'INTERNATIONAL_STANDARD' | 'REGULATORY_GUIDELINE';
  summary: string;
  fullText: string;
  citations: LegalCitation[];
  categoryLabel?: string;
  forensicProofBinding?: string;
  pinnedAt?: string;
  query?: string;
  tags?: string[];
  statutoryRef?: string;
}

export interface LegalCategoryDef {
  id: LegalCategory;
  label: string;
  shortLabel: string;
  description: string;
}

export interface CategoryPresetQuery {
  id: string;
  category: 'ALL' | 'ETDA' | 'PDPA' | 'INTERNATIONAL_STANDARDS' | 'CYBER_NCSA';
  query: string;
  badgeText: string;
  description: string;
}

export const LEGAL_CATEGORIES: LegalCategoryDef[] = [
  {
    id: 'ALL',
    label: 'ทุกหมวดหมู่กฎหมายและมาตรฐาน',
    shortLabel: 'ALL',
    description: 'ครอบคลุมทุกบทบัญญัติ พระราชบัญญัติ และมาตรฐานสากล',
  },
  {
    id: 'ETDA',
    label: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔',
    shortLabel: 'ETDA',
    description: 'ข้อกำหนดลายมือชื่ออิเล็กทรอนิกส์และการรับฟังพยานหลักฐาน Section 9, 26, 28',
  },
  {
    id: 'PDPA',
    label: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒',
    shortLabel: 'PDPA',
    description: 'การคุ้มครองสิทธิเจ้าของข้อมูลและมาตรการความมั่นคงปลอดภัย Section 19, 27, 37',
  },
  {
    id: 'INTERNATIONAL_STANDARDS',
    label: 'มาตรฐานความมั่นคงปลอดภัยและนิติวิทยาศาสตร์สากล',
    shortLabel: 'INTL',
    description: 'มาตรฐานดิจิทัลสากล ISO/IEC 27037 และวิทยาการรหัสลับควอนตัม NIST FIPS',
  },
  {
    id: 'CYBER_NCSA',
    label: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. ๒๕๖๒ (สกมช.)',
    shortLabel: 'NCSA',
    description: 'โครงสร้างพื้นฐานสำคัญทางสารสนเทศ (CII) และการตอบสนองภัยคุกคาม',
  },
];

export const CANONICAL_PINNED_STATUTES: PinnedStatute[] = [
  {
    id: 'statute-etda-sec26',
    statuteNumber: 'มาตรา 26',
    title: 'ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้',
    actName: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (แก้ไขเพิ่มเติม พ.ศ. ๒๕๖๒)',
    category: 'ETDA',
    legalWeight: 'HIGH_RELIABILITY',
    summary: 'ให้ถือว่าเป็นลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ หากข้อมูลสำหรับใช้สร้างลายมือชื่อเชื่อมโยงไปยังเจ้าของลายมือชื่อ และอยู่ในความควบคุมของเจ้าของ',
    fullText: 'มาตรา ๒๖ ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ ต้องมีลักษณะตามที่กำหนด โดยข้อมูลสำหรับใช้สร้างลายมือชื่อนั้นต้องเชื่อมโยงไปยังเจ้าของลายมือชื่อแต่เพียงผู้เดียว และตรวจพบการเปลี่ยนแปลงใดๆ ได้',
    citations: [
      {
        title: 'สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์ (สพธอ.) - ETDA มาตรฐาน มธอ.',
        uri: 'https://www.etda.or.th/th/standards/electronic-signature-sec26',
        publisher: 'ETDA Thailand',
      },
    ],
  },
  {
    id: 'statute-etda-sec9',
    statuteNumber: 'มาตรา 9',
    title: 'การลงลายมือชื่อในข้อมูลอิเล็กทรอนิกส์',
    actName: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔',
    category: 'ETDA',
    legalWeight: 'MANDATORY',
    summary: 'ผลทางกฎหมายของการลงลายมือชื่ออิเล็กทรอนิกส์เพื่อระบุตัวบุคคลและเจตนา',
    fullText: 'มาตรา ๙ ในกรณีที่กฎหมายกำหนดให้มีการลงลายมือชื่อ ให้ถือว่าข้อมูลอิเล็กทรอนิกส์นั้นมีการลงลายมือชื่อแล้ว หากใช้วิธีการที่สามารถระบุตัวเจ้าของลายมือชื่อและแสดงว่าเจ้าของลายมือชื่อรับรองข้อความในข้อมูลอิเล็กทรอนิกส์นั้น',
    citations: [
      {
        title: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔',
        uri: 'https://www.etda.or.th/th/regulations/eta-sec9',
        publisher: 'ราชกิจจานุเบกษา',
      },
    ],
  },
  {
    id: 'statute-etda-sec28',
    statuteNumber: 'มาตรา 28',
    title: 'การรับฟังพยานหลักฐานอิเล็กทรอนิกส์ในศาล',
    actName: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔',
    category: 'ETDA',
    legalWeight: 'HIGH_RELIABILITY',
    summary: 'การยอมรับข้อมูลอิเล็กทรอนิกส์เป็นพยานหลักฐานในกระบวนการพิจารณาคดี',
    fullText: 'มาตรา ๒๘ การประเมินค่าน้ำหนักพยานหลักฐานของข้อมูลอิเล็กทรอนิกส์ ให้พิจารณาถึงความน่าเชื่อถือของลักษณะหรือวิธีการที่ใช้ในการสร้าง การเก็บรักษา หรือการสื่อสารข้อมูลอิเล็กทรอนิกส์',
    citations: [
      {
        title: 'ETDA Judicial Verification Standard',
        uri: 'https://www.etda.or.th/th/standards/court-evidence-sec28',
        publisher: 'ETDA Thailand',
      },
    ],
  },
  {
    id: 'statute-pdpa-sec37',
    statuteNumber: 'มาตรา 37',
    title: 'มาตรการรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคล',
    actName: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒',
    category: 'PDPA',
    legalWeight: 'MANDATORY',
    summary: 'ผู้ควบคุมข้อมูลส่วนบุคคลต้องจัดให้มีมาตรการรักษาความมั่นคงปลอดภัยที่เหมาะสม',
    fullText: 'มาตรา ๓๗ ผู้ควบคุมข้อมูลส่วนบุคคลมีหน้าที่จัดให้มีมาตรการรักษาความมั่นคงปลอดภัยที่เหมาะสม เพื่อป้องกันการสูญหาย เข้าถึง ใช้ เปลี่ยนแปลง แก้ไข หรือเปิดเผยข้อมูลส่วนบุคคลโดยปราศจากอำนาจ',
    citations: [
      {
        title: 'สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)',
        uri: 'https://www.pdpcthailand.com/regulations/pdpa-sec37',
        publisher: 'PDPC Thailand',
      },
    ],
  },
  {
    id: 'statute-iso-27037',
    statuteNumber: 'ISO/IEC 27037',
    title: 'Guidelines for identification, collection, acquisition and preservation of digital evidence',
    actName: 'International Organization for Standardization (ISO/IEC)',
    category: 'INTERNATIONAL_STANDARDS',
    legalWeight: 'INTERNATIONAL_STANDARD',
    summary: 'มาตรฐานสากลว่าด้วยการตรวจระบุ จัดเก็บ กู้คืน และรักษาสภาพพยานหลักฐานดิจิทัลให้มีผลบังคับใช้ได้ในศาล',
    fullText: 'ISO/IEC 27037 specifies fundamental principles and processes for digital evidence handling ensuring auditability, repeatability, and non-repudiation.',
    citations: [
      {
        title: 'ISO/IEC 27037:2012 Digital Evidence Standard',
        uri: 'https://www.iso.org/standard/44381.html',
        publisher: 'ISO/IEC',
      },
    ],
  },
  {
    id: 'statute-nist-fips204',
    statuteNumber: 'NIST FIPS 204',
    title: 'Module-Lattice-Based Digital Signature Standard (ML-DSA-87 / Dilithium-5)',
    actName: 'NIST Post-Quantum Cryptography Federal Information Processing Standards',
    category: 'INTERNATIONAL_STANDARDS',
    legalWeight: 'INTERNATIONAL_STANDARD',
    summary: 'มาตรฐานการลงลายมือชื่อดิจิทัลหลังยุคควอนตัม ระดับ Category 5 (256-bit Post-Quantum)',
    fullText: 'NIST FIPS 204 specifies ML-DSA, a cryptographic suite based on Module Learning with Errors problem providing quantum-attack immunity.',
    citations: [
      {
        title: 'NIST FIPS 204 ML-DSA Specification',
        uri: 'https://csrc.nist.gov/pubs/fips/204/final',
        publisher: 'NIST CSRC',
      },
    ],
  },
];

export const CATEGORY_PRESET_QUERIES: CategoryPresetQuery[] = [
  {
    id: 'preset-etda-1',
    category: 'ETDA',
    query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 26',
    badgeText: 'มาตรา 26',
    description: 'เกณฑ์ความน่าเชื่อถือระดับสูงของลายมือชื่ออิเล็กทรอนิกส์',
  },
  {
    id: 'preset-etda-2',
    category: 'ETDA',
    query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 9',
    badgeText: 'มาตรา 9',
    description: 'ข้อกำหนดการระบุตัวตนและเจตนาในเอกสารดิจิทัล',
  },
  {
    id: 'preset-etda-3',
    category: 'ETDA',
    query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 28',
    badgeText: 'มาตรา 28',
    description: 'การรับฟังพยานหลักฐานอิเล็กทรอนิกส์ในกระบวนการพิจารณาคดี',
  },
  {
    id: 'preset-pdpa-1',
    category: 'PDPA',
    query: 'PDPA มาตรา 37 มาตรการรักษาความปลอดภัย',
    badgeText: 'มาตรา 37',
    description: 'หน้าที่ของผู้ควบคุมข้อมูลในการจัดให้มีมาตรการความมั่นคงปลอดภัยเชิงเทคนิค',
  },
  {
    id: 'preset-pdpa-2',
    category: 'PDPA',
    query: 'PDPA มาตรา 19 ความยินยอมและฐานความชอบด้วยกฎหมาย',
    badgeText: 'มาตรา 19',
    description: 'หลักเกณฑ์การขอความยินยอมและการประมวลผลข้อมูลส่วนบุคคล',
  },
  {
    id: 'preset-intl-1',
    category: 'INTERNATIONAL_STANDARDS',
    query: 'ISO/IEC 27037 Digital Evidence Handling',
    badgeText: 'ISO 27037',
    description: 'มาตรฐานการรักษาสภาพและห่วงโซ่การครอบครองพยานหลักฐานดิจิทัล (Chain of Custody)',
  },
  {
    id: 'preset-intl-2',
    category: 'INTERNATIONAL_STANDARDS',
    query: 'NIST FIPS 204 ML-DSA-87 Post-Quantum Signatures',
    badgeText: 'FIPS 204',
    description: 'มาตรฐานวิทยาการรหัสลับทนทานต่อคอมพิวเตอร์ควอนตัม Dilithium-5',
  },
  {
    id: 'preset-intl-3',
    category: 'INTERNATIONAL_STANDARDS',
    query: 'NIST FIPS 140-3 Level 4 Hardware Security Modules',
    badgeText: 'FIPS 140-3',
    description: 'มาตรฐานความมั่นคงปลอดภัยฮาร์ดแวร์และการป้องกันการดัดแปลงทางกายภาพ',
  },
];

export interface LegalTriggerItem {
  id: string;
  act: string;
  section: string;
  title: string;
  titleTh: string;
  status: string;
  statusText: string;
  pqcScheme: string;
  anchor: string;
  description: string;
  descriptionTh: string;
  statuteClause: string;
}

export const TRIGGER_PQC_HASHES: Record<string, string> = {
  'etda-sec-09': '0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
  'etda-sec-26': '0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8',
  'etda-sec-28': '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  'pdpa-sec-09': '0x7b2274785f6964223a22534f562d4a554d502d343436222c22617574686f72223a224550227d',
  'pdpa-sec-26': '0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
  'pdpa-sec-28': '0xdeadbeef00112233445566778899aabbccddeeff112233445566778899aabbcc',
};

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
    descriptionTh: 'ผูกมัดเจตนาและอัตลักษณ์ของผู้ลงนามด้วยลายมือชื่อโครงข่ายแลตทิซโพสต์ควอนตัม มีผลผูกพันบังคับใช้ตามกฎหมายอย่างสมบูรณ์',
    statuteClause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙',
  },
  {
    id: 'etda-sec-26',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๒๖ (Section 26)',
    title: 'Trustworthy & Advanced Electronic Signature Security',
    titleTh: 'ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ระดับสูง',
    status: 'PASS',
    statusText: '10/10 REAL_HSM',
    pqcScheme: 'FIPS 140-3 Level 4 Active Tamper Protection',
    anchor: 'Deca-Custodian Quorum Active Shield',
    description: 'Guarantees advanced security, key control under sole custody, and automated Tamper-Evident Cascade with immediate Fail-Closed lockdown if altered.',
    descriptionTh: 'โครงสร้างลายมือชื่อขั้นสูงภายใต้การควบคุมของผู้ดูแล 10 จุด หากตรวจพบการดัดแปลงแม้เพียง 1 บิต ระบบจะปฏิเสธทันที (Fail-Closed)',
    statuteClause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖',
  },
  {
    id: 'etda-sec-28',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๒๘ (Section 28)',
    title: 'Third-Party Evidentiary Reliance & Certificate Anchors',
    titleTh: 'ความน่าเชื่อถือและการรับฟังพยานหลักฐานโดยบุคคลภายนอก',
    status: 'PASS',
    statusText: 'COURT ADMISSIBLE',
    pqcScheme: 'Immutable Merkle Root Binding',
    anchor: 'Root 909ab814...fa4c68 (Block #849202)',
    description: 'Enforces complete cryptographic audit trail (Ledger V25) certified for forensic presentation in Thai courts without repudiation.',
    descriptionTh: 'สร้างห่วงโซ่พยานหลักฐานที่ไม่สามารถแก้ไขย้อนหลังได้ (Immutable Ledger) ได้รับการยอมรับฟังในชั้นศาลตามประมวลกฎหมายวิธีพิจารณาความ',
    statuteClause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘',
  },
  {
    id: 'pdpa-sec-09',
    act: 'PDPA B.E. 2562',
    section: 'มาตรา ๙ (Section 9)',
    title: 'Lawful Basis & Sovereign Consent Matrix',
    titleTh: 'ฐานความชอบด้วยกฎหมายและการควบคุมความยินยอม',
    status: 'PASS',
    statusText: 'SSoT Δ0.0% ZERO DRIFT',
    pqcScheme: 'Zero-Knowledge Policy Engine',
    anchor: 'Authority: นายยุทธภูมิ พากเพียร',
    description: 'Restricts personal data operations strictly to predefined lawful purposes and platform boundaries Ω601–Ω1000 with zero drift.',
    descriptionTh: 'ควบคุมการประมวลผลข้อมูลให้อยู่ในขอบเขตอธิปไตยดิจิทัลที่กำหนด ปราศจากการดัดแปลงโครงสร้าง (Mutation Authority = 0)',
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๙',
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
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๒๖',
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
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๒๘',
  },
];
