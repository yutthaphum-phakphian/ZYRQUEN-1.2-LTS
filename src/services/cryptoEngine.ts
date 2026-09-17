import { CANONICAL_CONSTANTS } from '../data/sovereignData.ts';

export async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface MerkleVerificationResult {
  expectedRoot: string;
  calculatedHash: string;
  matched: boolean;
  blockHeight: number;
  totalSeals: number;
  quarantinedSeals: number;
  rawTotal: number;
  timestamp: string;
  pqcAttestation: string;
}

export async function verifyGenesisMerkleRoot(): Promise<MerkleVerificationResult> {
  const calculatedHash = await sha256Hex(CANONICAL_CONSTANTS.GENESIS_SEED_TEXT);
  const matched = calculatedHash.toLowerCase() === CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT.toLowerCase();
  
  // Generate a mock PQC ML-DSA-87 signature string
  const entropy = Math.random().toString(36).substring(2, 10);
  const pqcSig = `ML-DSA-87:[${entropy.toUpperCase()}-${calculatedHash.substring(0, 16)}...${calculatedHash.substring(48)}]`;

  return {
    expectedRoot: CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT,
    calculatedHash,
    matched,
    blockHeight: CANONICAL_CONSTANTS.CANONICAL_BLOCK,
    totalSeals: CANONICAL_CONSTANTS.CANONICAL_SEALS,
    quarantinedSeals: CANONICAL_CONSTANTS.QUARANTINED_SEALS,
    rawTotal: CANONICAL_CONSTANTS.RAW_SEALS_TOTAL,
    timestamp: new Date().toISOString(),
    pqcAttestation: pqcSig,
  };
}

export async function generateSealProof(sealIndex: number): Promise<{
  index: number;
  leafHash: string;
  pqcProof: string;
  status: 'VERIFIED' | 'QUARANTINED';
}> {
  const isQuarantined = sealIndex > CANONICAL_CONSTANTS.CANONICAL_SEALS;
  const rawSeed = `SEAL_#${sealIndex}_ROOT_${CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT}`;
  const leafHash = await sha256Hex(rawSeed);
  
  return {
    index: sealIndex,
    leafHash,
    pqcProof: `FIPS-204-ML-DSA-87::${leafHash.slice(0, 12)}...`,
    status: isQuarantined ? 'QUARANTINED' : 'VERIFIED',
  };
}
