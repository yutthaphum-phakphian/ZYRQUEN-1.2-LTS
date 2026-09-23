import QRCode from 'qrcode';

export interface DossierVerificationPayload {
  protocol: string;
  version: string;
  documentId: string;
  passportId: string;
  merkleRoot: string;
  blockHeight: number;
  canonicalSealsCount: number;
  systemDrift: string;
  hsmQuorum: string;
  pqcScheme: string;
  statutoryBasis: string;
  certificateId: string;
  verificationUri: string;
  verifiedAt: string;
}

export interface BuildDossierQrOptions {
  documentId?: string;
  passportId?: string;
  canonicalSealsCount?: number;
  systemDrift?: string;
  certificateId?: string;
  hsmQuorum?: string;
  pqcScheme?: string;
  statutoryBasis?: string;
  verificationUri?: string;
  timestamp?: string;
}

/**
 * Builds the canonical verification payload for external device inspection
 * of the Merkle Root, Block Height, and Forensic Master Dossier state.
 */
export function buildDossierVerificationPayload(
  merkleRoot: string,
  blockHeight: number,
  options: BuildDossierQrOptions = {}
): DossierVerificationPayload {
  const documentId = options.documentId ?? 'DOC-SOV-HSM-1010-2026-V9';
  const passportId = options.passportId ?? '#EP-SOVEREIGN-01';
  const canonicalSealsCount = options.canonicalSealsCount ?? 14902;
  const systemDrift = options.systemDrift ?? 'Δ 0.00%';
  const certificateId = options.certificateId ?? 'ZQ-GREEN-DEP-849202-3908';
  const hsmQuorum = options.hsmQuorum ?? '10/10 REAL_HSM FIPS 140-3 L4';
  const pqcScheme = options.pqcScheme ?? 'ML-DSA-87 (Dilithium-5) + SPHINCS+';
  const statutoryBasis =
    options.statutoryBasis ??
    'Thai Electronic Transactions Act B.E. 2544 (Sec 9, 26, 28) & PDPA B.E. 2562 (Sec 37)';
  const verificationUri =
    options.verificationUri ??
    `urn:zyrquen:audit:dossier:v9:block:${blockHeight}:merkle:${merkleRoot}`;
  const verifiedAt = options.timestamp ?? new Date().toISOString();

  return {
    protocol: 'ZYRQUEN_OMEGA_SSOT_VERIFY',
    version: 'v1.2-LTS',
    documentId,
    passportId,
    merkleRoot,
    blockHeight,
    canonicalSealsCount,
    systemDrift,
    hsmQuorum,
    pqcScheme,
    statutoryBasis,
    certificateId,
    verificationUri,
    verifiedAt,
  };
}

/**
 * Generates a high-resolution PNG data URL for downloading or rendering the QR code.
 */
export async function generateDossierQrPng(
  content: string,
  options: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'H',
    margin: 2,
    scale: 10,
    color: {
      dark: '#020617',
      light: '#ffffff',
    },
  }
): Promise<string> {
  return QRCode.toDataURL(content, options);
}
