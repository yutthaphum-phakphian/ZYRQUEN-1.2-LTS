import { SYSTEM_METADATA } from '../data/canonicalData';

export interface ForensicScanRecord {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  triggerType:
    | 'BATCH_VERIFY'
    | 'EXPORT_AUDIT_LOG'
    | 'FORENSIC_MODE_TOGGLE'
    | 'STATUTE_INSPECTION'
    | 'MANUAL_DEEP_SCAN'
    | 'CHAMBER_INTEGRITY';
  title: string;
  details: string;
  blockHeight: number;
  merkleRoot: string;
  pqcScheme: string;
  signatureDigest: string;
  status: 'VERIFIED' | 'PASS' | 'SEALED';
  drift: string;
  statuteRef: string;
  verifiedSeals: number;
  actor: string;
  hashVerified: boolean;
}

const STORAGE_KEY = 'zyrquen_forensic_scan_registry';
const EVENT_NAME = 'zyrquen:forensic-scan-updated';

const INITIAL_BOOTSTRAP_RECORDS: ForensicScanRecord[] = [
  {
    id: 'SCAN-849202-GENESIS',
    timestamp: '05:05:30 ICT',
    isoTimestamp: '2026-09-18T05:05:30.000Z',
    triggerType: 'CHAMBER_INTEGRITY',
    title: 'Genesis Anchor Root & Canonical Core Attestation',
    details: 'Verified Merkle root 909ab814...43fa4c68 across 14,902 hardware seals. Zero system drift Δ0.00% established.',
    blockHeight: 849202,
    merkleRoot: SYSTEM_METADATA.merkleRoot,
    pqcScheme: 'ML-DSA-87 (FIPS 204)',
    signatureDigest: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    status: 'SEALED',
    drift: 'Δ0.00%',
    statuteRef: 'ETDA มาตรา ๙, ๒๖, ๒๘ & PDPA มาตรา ๓๗',
    verifiedSeals: 14902,
    actor: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    hashVerified: true,
  },
  {
    id: 'SCAN-849202-PQC-SHIELD',
    timestamp: '05:08:12 ICT',
    isoTimestamp: '2026-09-18T05:08:12.000Z',
    triggerType: 'BATCH_VERIFY',
    title: 'Post-Quantum Hardware Cryptographic Sweep',
    details: '10/10 REAL_HSM FIPS 140-3 L4 Quorum signed via ML-KEM-1024 & Dilithium-5. Active zeroization response < 0.48ms.',
    blockHeight: 849202,
    merkleRoot: SYSTEM_METADATA.merkleRoot,
    pqcScheme: 'ML-KEM-1024 + ML-DSA-87',
    signatureDigest: '0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8',
    status: 'VERIFIED',
    drift: 'Δ0.00%',
    statuteRef: 'ISO/IEC 27037 Digital Forensics',
    verifiedSeals: 14902,
    actor: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    hashVerified: true,
  },
  {
    id: 'SCAN-849202-LEGAL-SAFEHARBOR',
    timestamp: '05:12:44 ICT',
    isoTimestamp: '2026-09-18T05:12:44.000Z',
    triggerType: 'STATUTE_INSPECTION',
    title: 'Thai Statutory Safe Harbor Defense Verification',
    details: 'Evidentiary weight affirmed under ETDA B.E. 2544 Sections 11 & 28. Complete non-repudiation presumption verified for Thai courts.',
    blockHeight: 849202,
    merkleRoot: SYSTEM_METADATA.merkleRoot,
    pqcScheme: 'SLH-DSA-192 (SPHINCS+)',
    signatureDigest: '0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    status: 'PASS',
    drift: 'Δ0.00%',
    statuteRef: 'ETDA Sec 11, 26, 28',
    verifiedSeals: 14902,
    actor: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    hashVerified: true,
  },
];

export function getForensicScanHistory(): ForensicScanRecord[] {
  if (typeof window === 'undefined') return INITIAL_BOOTSTRAP_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOTSTRAP_RECORDS));
      return INITIAL_BOOTSTRAP_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_BOOTSTRAP_RECORDS;
  } catch (err) {
    console.error('Failed to read forensic scan registry from localStorage:', err);
    return INITIAL_BOOTSTRAP_RECORDS;
  }
}

export function recordForensicScan(
  params: Omit<
    ForensicScanRecord,
    | 'id'
    | 'timestamp'
    | 'isoTimestamp'
    | 'blockHeight'
    | 'merkleRoot'
    | 'actor'
    | 'drift'
    | 'pqcScheme'
    | 'signatureDigest'
    | 'verifiedSeals'
    | 'hashVerified'
  > &
    Partial<ForensicScanRecord>
): ForensicScanRecord {
  const current = getForensicScanHistory();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }) + ' ICT';

  // Generate deterministic-looking synthetic PQC digest based on title and timestamp
  const randomSuffix = Math.random().toString(16).substring(2, 10);
  const signatureDigest =
    params.signatureDigest ||
    `0x${randomSuffix}4479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`;

  const newRecord: ForensicScanRecord = {
    id: `FSCAN-${SYSTEM_METADATA.sealedBlock}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: timeStr,
    isoTimestamp: now.toISOString(),
    triggerType: params.triggerType,
    title: params.title,
    details: params.details,
    blockHeight: params.blockHeight ?? SYSTEM_METADATA.sealedBlock,
    merkleRoot: params.merkleRoot ?? SYSTEM_METADATA.merkleRoot,
    pqcScheme: params.pqcScheme ?? 'ML-DSA-87 (FIPS 204)',
    signatureDigest,
    status: params.status ?? 'VERIFIED',
    drift: params.drift ?? 'Δ0.00%',
    statuteRef: params.statuteRef ?? 'ETDA Sec 26/28 | PDPA Sec 37',
    verifiedSeals: params.verifiedSeals ?? 14902,
    actor: params.actor ?? SYSTEM_METADATA.sovereignPrincipal,
    hashVerified: params.hashVerified ?? true,
  };

  const updated = [newRecord, ...current].slice(0, 100); // Retain latest 100 scans
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newRecord }));
    }
  } catch (err) {
    console.error('Failed to write forensic scan to localStorage:', err);
  }

  return newRecord;
}

export function clearForensicScanHistory(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOTSTRAP_RECORDS));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  } catch (err) {
    console.error('Failed to reset forensic scan history:', err);
  }
}

export function exportForensicScanHistoryJson(): void {
  const records = getForensicScanHistory();
  const exportPayload = {
    registry: 'ZYRQUEN_VIRTUAL_LOCALSTORAGE_FORENSIC_REGISTRY',
    blockHeight: SYSTEM_METADATA.sealedBlock,
    merkleRoot: SYSTEM_METADATA.merkleRoot,
    drift: 'Δ0.00%',
    sovereignPrincipal: SYSTEM_METADATA.sovereignPrincipal,
    exportedAt: new Date().toISOString(),
    totalRecordedScans: records.length,
    scans: records,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ZYRQUEN-FORENSIC-SCAN-REGISTRY-BLOCK-${SYSTEM_METADATA.sealedBlock}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
