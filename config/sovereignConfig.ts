/**
 * @file sovereignConfig.ts
 * @description ZYRQUEN Ω∞ Canonical Sovereign Configuration
 * SSoT Baseline: LOCKED_FROZEN_v1.2_LTS (v4.16 GOLD MASTER)
 * Genesis Block: #849,202 | Merkle Root: 0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
 */

export const SYSTEM_INVARIANTS = {
  systemState: 'LOCKED_FROZEN_v1.2_LTS',
  version: 'v4.16 GOLD MASTER',
  genesisBlock: 849202,
  merkleRoot: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  canonicalSeals: 14902,
  ssotMutation: 0,
  ssotDrift: '0.00%',
  canonicalWrite: 'DENIED',
  autoReseal: 'BLOCKED',
  observedEvidence: '+5',
  observedEvidenceState: 'QUARANTINED / NON-PROMOTED',
} as const;

export const NIST_PQC_STANDARDS = {
  digitalSignatures: {
    algorithm: 'ML-DSA-87 (Dilithium-5)',
    standard: 'NIST FIPS 204',
    securityCategory: 5,
  },
  keyEncapsulation: {
    algorithm: 'ML-KEM-1024 (Kyber-1024)',
    standard: 'NIST FIPS 203',
    securityCategory: 5,
  },
  statelessHashSignatures: {
    algorithm: 'SLH-DSA-SHAKE-256f (SPHINCS+)',
    standard: 'NIST FIPS 205',
    securityCategory: 5,
  },
} as const;

export const DECA_KEY_COUNCIL = [
  { id: 'TC-01', name: 'Council Node Alpha', role: 'Cryptographic Lead', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-02', name: 'Council Node Beta', role: 'Genesis Anchor Guardian', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-03', name: 'Council Node Gamma', role: 'NIST PQC Ratifier', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-04', name: 'Council Node Delta', role: 'RFC 3161 TSA Attestor', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-05', name: 'Council Node Epsilon', role: 'WORM Sanctuary Keeper', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-06', name: 'Council Node Zeta', role: 'Forensic SLA Inspector', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-07', name: 'Council Node Eta', role: 'zk-SNARKs Privacy Enclave', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-08', name: 'Council Node Theta', role: 'Chamber 02 Quarantine Warden', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-09', name: 'Council Node Iota', role: 'Phoenix Recovery Overseer', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
  { id: 'TC-10', name: 'Council Node Kappa', role: 'Sovereign Treasury Sentinel', status: 'ACTIVE_ONLINE', hsm: 'Utimaco u.trust GP CSe-Series (FIPS 140-3 L4)' },
] as const;

export const COMPLIANCE_FRAMEWORKS = {
  thailandETA: {
    title: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (และที่แก้ไขเพิ่มเติม)',
    sections: {
      section9: 'มาตรา 9 - ลายมือชื่ออิเล็กทรอนิกส์ทั่วไป (IAL1/AAL1)',
      section26: 'มาตรา 26 - ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ (IAL2+/AAL2+)',
      section28: 'มาตรา 28 - ลายมือชื่ออิเล็กทรอนิกส์ที่ออกโดยผู้ให้บริการออกใบรับรอง (IAL2+/AAL2+ with CA Certificate)',
    },
    standard: 'ขมธอ. 23-2563 (ETDA e-Signature Guideline)',
  },
  thailandPDPA: {
    title: 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
    section: 'มาตรา 37 - มาตรการรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคล (zk-SNARKs Zero-Knowledge Privacy)',
  },
  forensics: {
    standard: 'ISO/IEC 27037:2012 Digital Evidence Handling & Chain of Custody',
  },
} as const;

export const CHAIN_MODEL_CONFIG = {
  population: 70000000,
  segmentSizePct: 0.24, // 24% Gen Z
  segmentPenetration: 0.80, // 80% penetration
  usageRate: 5, // 5 units/year
  unitContributionThb: 2.0, // 2 THB
  // Nc = 70M * 0.24 * 0.80 = 13,440,000 customers
  // Vc = 5 * 2.0 = 10 THB
  // Total Gen Z Segment Value = ฿134,400,000.00
} as const;
