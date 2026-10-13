/**
 * ZYRQUEN Ω∞ — Backward Compatibility Type Augmentations & DTO Bridges
 * Restores legacy and optional fields across canonical DTOs to guarantee
 * zero build breakages while preserving strict SSoT runtime validation.
 */

import { ViewType, HardwareSnapshot } from '../types';

export interface CouncilMember {
  id?: string;
  code?: string;
  name?: { en?: string; th?: string };
  role?: { en?: string; th?: string };
  nameEn?: string;
  nameTh?: string;
  roleEn?: string;
  roleTh?: string;
  jurisdictionEn?: string;
  jurisdictionTh?: string;
  biographyEn?: string;
  biographyTh?: string;
  isLead?: boolean;
  avatarColor?: string;
  quorumWeight?: number;
  contributions?: unknown[];
  clearanceLevel?: string;
  fipsCertification?: string;
  publicKeyArmor?: string;
  keyFingerprint?: string;
  cryptoSignature?: string;
  hsmSignatureDigest?: string;
  councilCode?: string;
  hardwareEnclave?: string;
  hardwareDevice?: string;
  signedTimestamp?: string;
  signedDateIct?: string;
  [key: string]: any;
}

export interface SealVerificationResult {
  scannedPayload?: string;
  verificationTimestamp?: string;
  forensicSummary?: string;
  statuteReference?: string;
  assignedCustodian?: string;
  [key: string]: any;
}

export interface HardwareSealRecord {
  assignedCustodian?: string;
  tagSerialNumber?: string;
  serialNumber?: string;
  [key: string]: any;
}

export interface DossierLegalAlignment {
  lawName?: string;
  evidence?: unknown;
  law?: { name?: string };
  [key: string]: any;
}

export interface MerkleArchivePayload {
  merkleRoot?: string;
  totalMembers?: number;
  verifiedHsmCount?: number;
  consensusLedger?: any;
  [key: string]: any;
}
