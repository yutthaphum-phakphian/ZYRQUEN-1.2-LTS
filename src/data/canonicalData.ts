// src/data/canonicalData.ts
export const SYSTEM_METADATA = {
  system: 'ZYRQUEN Ω∞',
  version: 'v1.2.1 LTS',
  merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  genesisBlock: 849202,
  sealedBlock: 849202,
  canonicalSeals: 14902,
  totalVerifiedSeals: 14902,
  quarantineCount: 80,
  sovereignPrincipal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
  quorum: '10/10 REAL_HSM',
  coherence: '99.992%',
  cryoTemp: '14.98 mK',
  pqcCompliance: 'NIST FIPS 204 / ML-DSA-87',
  ssotMutation: 0,
  baselineDrift: 0,
} as const;

export const SYSTEM_INVARIANTS = [
  {
    id: 'INV-01',
    code: 'SSOT-DELTA-0',
    name: 'Zero Mutation Authority',
    description: 'Mutation authority must remain zero',
    layer: 'SSoT',
    status: 'PASSED',
    verificationHash: '0x00000000000000000000000000000000',
  },
] as const;

export const THAI_CUSTODIANS = [
  {
    id: 'TC-01',
    passportNumber: '#EP-SOVEREIGN-01',
    nameTh: 'นายยุทธภูมิ พากเพียร',
    nameEn: 'Yuttaphum Phakphian',
    roleTh: 'ผู้ออกแบบอธิปไตย',
    roleEn: 'Sovereign Architect',
    clearanceLevel: 'OMEGA-1',
    signedDate: '2026-10-11',
    keyFingerprint: 'dilithium5-fp-01',
    status: 'REAL_HSM_SIGNED',
  },
] as const;

export const CANONICAL_SEALS = 14902;
export const CANONICAL_GENESIS_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const QUARANTINE_COUNT = 80;
export const SSOT_MUTATION = 0;
export const BASELINE_DRIFT = 0;

export const CANONICAL_MODULES = [] as const;

export const AUDIT_TRACE_TX = {
  id: 'AUDIT-TRACE-001',
  stages: [],
} as const;
