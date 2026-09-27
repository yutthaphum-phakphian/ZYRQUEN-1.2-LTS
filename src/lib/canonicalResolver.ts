/**
 * ZYRQUEN Ω∞ FROZEN v1.2.1 LTS — Canonical Single Source of Truth Resolver
 *
 * Centralized authoritative constants for Genesis Block Height, Merkle Root,
 * Canonical Seal Count, Deca-Key HSM Quorum, and Sovereign Audit Identity.
 */

export const AUTHORITATIVE_CONSTANTS = Object.freeze({
  // Primary SSoT Keys
  GENESIS_BLOCK_HEIGHT: 849202,
  BLOCK_HEIGHT: 849202,
  BLOCK_TAG: '#849202',
  MERKLE_ROOT: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  SEAL_COUNT: 14902,
  QUARANTINED_SEALS: 80,
  RAW_SEALS_TOTAL: 14982,
  SSOT_MUTATION: 0,
  SSOT_DRIFT: 'Δ0.00%',

  // HSM & Replay SLA Constants
  HSM_TOTAL_NODES: 10,
  HSM_QUORUM_THRESHOLD: 10, // Unanimous Deca-Key Quorum (10/10)
  HSM_SUPER_MAJORITY_MIN: 8,
  REPLAY_SLA_MS: 142.0,
  MEASURED_REPLAY_MS: 35.8,
  CRYO_TEMP_MK: 14.98,

  // Sovereign Identity & Audit Metadata
  SYSTEM_AUDIT_ID: 'AUD-MOD_MUGWCIK6',
  SOVEREIGN_AUTHORITY: '#EP-SOVEREIGN-01',
  SOVEREIGN_PRINCIPAL_TH: 'นายยุทธภูมิ พากเพียร',
  SOVEREIGN_PRINCIPAL_EN: 'Yuttaphum Phakphian',
  DEPLOYMENT_CERT_CODE: 'ZQ-GREEN-DEP-849202-3908',
  GENESIS_SEED_TEXT: 'ZYRQUEN_GENESIS_CONTRACT_v1.2',
} as const);

export type AuthoritativeConstants = typeof AUTHORITATIVE_CONSTANTS;

export default AUTHORITATIVE_CONSTANTS;
