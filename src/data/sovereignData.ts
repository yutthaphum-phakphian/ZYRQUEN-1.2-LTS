/**
 * ZYRQUEN Ω∞ — Sovereign Data & Chamber Matrix
 * Architecture: Clean SSoT Baseline v1.2.1 LTS
 */

import { Chamber, OperatingModule, HSMUnit, InvariantRule } from '../types';
import { CHAMBERS_DATA } from '../lib/ssot-data';

export const CANONICAL_CONSTANTS = {
  GENESIS_SEED_TEXT: 'ZYRQUEN_OMEGA_INFINITY_GENESIS_SEED_849202',
  GENESIS_MERKLE_ROOT: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  CANONICAL_BLOCK: 849202,
  CANONICAL_SEALS: 14902,
  QUARANTINED_SEALS: 80,
  RAW_SEALS_TOTAL: 14982,
  PLATFORM_BOUNDARY: 'NIST FIPS 140-3 L4 & ETDA Sec 9/26/28',
};

export const STATE_AUTHORITY = {
  GOVERNANCE_CONSENSUS: '10/10 REAL_HSM Unanimous',
  CUSTODIAN_STATUS_LABEL: '10/10 Verified Online',
  CUSTODIAN_REQUIRED_COUNT: 8,
  CUSTODIAN_PENDING_COUNT: 0,
  RUNTIME_STATUS: 'NOMINAL',
  CANONICAL_SEALS: 14902,
  SSOT_MUTATION_COUNT: 0,
  SSOT_MUTATION_DELTA: '0.00%',
};

export const SOVEREIGN_CONFIG = {
  canonicalBlock: 849202,
  merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  clearance: 'OMEGA-1 SUPREME CLEARANCE',
  principal: '#EP-SOVEREIGN-01',
  principalName: 'นายยุทธภูมิ พากเพียร',
  seals: 14902,
  status: 'VERIFIED SECURED',
};

export const INVARIANTS: InvariantRule[] = [
  { id: 'INV-01', name: 'SSoT Merkle Root Parity', description: 'Zero drift from Block #849202', status: 'ZERO_DRIFT', guarantee: 'SSoT Δ0.00% Parity' },
  { id: 'INV-02', name: 'Canonical Seals Conservation', description: '14,902 Active Seals', status: 'ENFORCED', guarantee: '14,902 Canonical Seals' },
  { id: 'INV-03', name: '10/10 REAL_HSM Quorum Ratification', description: 'Unanimous hardware ratification', status: 'PASSED', guarantee: '10/10 REAL_HSM Quorum' },
  { id: 'INV-04', name: 'Cryo Subzero Bus Thermal Parity', description: '14.98 mK Helium-4 Subzero Bus', status: 'ENFORCED', guarantee: '14.98 mK Thermal Parity' },
  { id: 'INV-05', name: 'Deterministic Replay SLA', description: '< 142.00 ms Latency Bound', status: 'PASSED', guarantee: 'Latency SLA < 142.00 ms' },
  { id: 'INV-06', name: 'Thai ETA Section 9/26/28', description: 'Non-repudiation and court admissibility', status: 'ENFORCED', guarantee: 'ETDA Court Admissibility' },
  { id: 'INV-07', name: 'PDPA Section 37 Privacy Guard', description: 'Zero-Knowledge PII Masking', status: 'ENFORCED', guarantee: 'Zero-Knowledge PII Masking' },
  { id: 'INV-08', name: 'RWA Physical Gold Collateral', description: '14,902 oz 99.99% LBMA Gold', status: 'PASSED', guarantee: '14,902 oz LBMA Gold Backing' },
  { id: 'INV-09', name: 'Zero Ambient Mutation', description: 'Mutation Authority === 0', status: 'ZERO_DRIFT', guarantee: 'Zero Ambient Mutation' },
  { id: 'INV-10', name: 'Permanent LTS Release Lock', description: 'LOCKED_FROZEN_v1.2.1_LTS', status: 'ENFORCED', guarantee: 'LTS Freeze State Lock' },
];

export const HSM_UNITS: HSMUnit[] = [
  { id: 'HSM-01', code: 'TC-01', name: 'Bangkok Sovereign Alpha Core', temperature: '14.92 mK', status: 'REAL_HSM_ONLINE', keyType: 'Dilithium-5', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-02', code: 'TC-02', name: 'Bangkok Defense Sentry', temperature: '14.95 mK', status: 'REAL_HSM_ONLINE', keyType: 'Kyber-1024', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-03', code: 'TC-03', name: 'Bangkok Secondary Enclave', temperature: '14.98 mK', status: 'REAL_HSM_ONLINE', keyType: 'Dilithium-5', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-04', code: 'TC-04', name: 'Bangkok Distributed Enclave', temperature: '14.94 mK', status: 'REAL_HSM_ONLINE', keyType: 'SPHINCS+', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-05', code: 'TC-05', name: 'Chiang Mai Disaster Recovery Core', temperature: '15.01 mK', status: 'REAL_HSM_ONLINE', keyType: 'Dilithium-5', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-06', code: 'TC-06', name: 'Chiang Mai Secondary Enclave', temperature: '14.97 mK', status: 'REAL_HSM_ONLINE', keyType: 'Kyber-1024', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-07', code: 'TC-07', name: 'Hong Kong Financial Edge Node', temperature: '14.99 mK', status: 'REAL_HSM_ONLINE', keyType: 'Dilithium-5', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-08', code: 'TC-08', name: 'Hong Kong Treasury Depository Vault', temperature: '15.04 mK', status: 'REAL_HSM_ONLINE', keyType: 'SPHINCS+', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-09', code: 'TC-09', name: 'Singapore International Gateway', temperature: '14.96 mK', status: 'REAL_HSM_ONLINE', keyType: 'Dilithium-5', fipsLevel: 'FIPS 140-3 L4' },
  { id: 'HSM-10', code: 'TC-10', name: 'Singapore Edge Enclave', temperature: '14.97 mK', status: 'REAL_HSM_ONLINE', keyType: 'Kyber-1024', fipsLevel: 'FIPS 140-3 L4' },
];

export const SOVEREIGN_CHAMBERS: Chamber[] = CHAMBERS_DATA.map((ch, idx) => {
  const code = `CH-${String(idx).padStart(2, '0')}`;
  let category = 'Operations';
  if (idx <= 1) category = 'Foundation';
  else if ([3, 9, 10, 16].includes(idx)) category = 'Governance';
  else if ([2, 4, 6, 8, 11, 18].includes(idx)) category = 'Defense';
  else if (idx === 17) category = 'Extension';

  return {
    id: ch.id,
    code,
    name: ch.titleEn,
    nameTh: ch.titleTh,
    description: ch.descriptionEn,
    category,
    status: ch.status,
    metrics: ch.metrics.map(m => ({ label: m.label, value: m.value, status: m.status })),
    invariants: [
      `INV-SSOT-CH${String(idx).padStart(2, '0')}`,
      `INV-FROZEN-849202`,
      `INV-ZERO-DRIFT`
    ],
  };
});

export const OPERATING_MODULES: OperatingModule[] = [
  { id: 'MOD-00', number: '00', name: 'Multiverse Command & Genesis Merkle Root', technicalSubtitle: 'L0 Master Genesis Anchor #849202', targetView: 'dashboard', category: 'Foundation', status: 'SEALED', stat: '14,902 Seals', detail: 'Real-time master telemetry & SSoT Parity' },
  { id: 'MOD-01', number: '01', name: 'Canonical Core G11 & Execution Engine', technicalSubtitle: 'Deca-Key 10/10 Quorum Consensus Reactor', targetView: 'console', category: 'Foundation', status: 'SEALED', stat: '10/10 HSMs', detail: 'FIPS 140-3 Level 4 Hardware Bridge' },
  { id: 'MOD-02', number: '02', name: 'Forensics & Quarantine Buffer', technicalSubtitle: 'Fail-Closed Zero-Trust Sandboxing Buffer', targetView: 'security', category: 'Defense', status: 'ACTIVE', stat: '80 Quarantined', detail: '12-Stage Trace Replay SLA < 142ms' },
  { id: 'MOD-03', number: '03', name: 'Custodian Tracker & HSM Roster', technicalSubtitle: 'Thai Custodians TC-01..TC-10 Telemetry Pulse', targetView: 'council', category: 'Governance', status: 'ACTIVE', stat: '10/10 Online', detail: 'Cryo-Bus 14.98mK Biometric & Key Registry' },
  { id: 'MOD-04', number: '04', name: 'Invariants 10/10 State Protection', technicalSubtitle: 'Continuous Inviolable State Assertions', targetView: 'compliance', category: 'Defense', status: 'ACTIVE', stat: '10/10 100%', detail: '100 Hz Continuous Parity Verification' },
  { id: 'MOD-05', number: '05', name: 'Master Gates 22/22 Verification', technicalSubtitle: 'Multi-Phase Transition Security Gates', targetView: 'security-pipeline', category: 'Operations', status: 'ACTIVE', stat: '22/22 Passed', detail: 'Level 20 SRE Gate Verification' },
  { id: 'MOD-06', number: '06', name: 'Phoenix Recovery & Self-Healing', technicalSubtitle: 'Deterministic Disaster Recovery Engine', targetView: 'pulse', category: 'Defense', status: 'ACTIVE', stat: '< 1.5s RTO', detail: 'Helium-4 Subzero Thermal Flush' },
  { id: 'MOD-07', number: '07', name: 'FIOS Treasury & Asset Ledger', technicalSubtitle: '฿12.5M THB Gas & LBMA Gold Collateral', targetView: 'treasury', category: 'Operations', status: 'ACTIVE', stat: '14,902 oz Gold', detail: 'Zero Variance RWA Physical Backing' },
  { id: 'MOD-08', number: '08', name: 'Post-Quantum Crypto Dilithium-5', technicalSubtitle: 'NIST FIPS 204 ML-DSA-87 Lattice Core', targetView: 'vault', category: 'Defense', status: 'ACTIVE', stat: 'Category 5', detail: 'SPHINCS+ Stateless Archive Backups' },
  { id: 'MOD-09', number: '09', name: 'Phase Registry 01-40 System Lifecycle', technicalSubtitle: 'Genesis Bootstrap to Frozen LTS', targetView: 'production-readiness', category: 'Governance', status: 'ACTIVE', stat: 'Phase 40/40', detail: '100% Deterministic Lifecycle Tracker' },
  { id: 'MOD-10', number: '10', name: 'Thai Legal ETDA & Court Admissibility', technicalSubtitle: 'ETA B.E. 2544 (Sec 9, 26, 28) & PDPA', targetView: 'legal', category: 'Governance', status: 'ACTIVE', stat: 'Sec 9, 26, 28', detail: 'Judicial Verification Endpoint' },
  { id: 'MOD-11', number: '11', name: '8K Quantum Radar & Threat Mapper', technicalSubtitle: 'Threat-Vector Spatial Nebula & Sentinel AI', targetView: 'radar', category: 'Defense', status: 'ACTIVE', stat: '8K Ultra HD', detail: '< 2.4ms Interception Response' },
  { id: 'MOD-12', number: '12', name: 'Sovereign CLI & Command Console', technicalSubtitle: 'Interactive Macro Terminal & Voice Bridge', targetView: 'console', category: 'Operations', status: 'ACTIVE', stat: '48 Macros', detail: 'Vite Native POSIX Shell Sandbox' },
  { id: 'MOD-13', number: '13', name: 'Multiverse Navigation Grid & Citadel', technicalSubtitle: 'Spatial Matrix covering 49 ViewTypes', targetView: 'matrix', category: 'Operations', status: 'ACTIVE', stat: '49/49 Views', detail: 'Zero Orphan IDs Architecture' },
  { id: 'MOD-14', number: '14', name: 'Warp Path & Pipeline Accelerator', technicalSubtitle: 'Zero-Copy Ring Buffer & SIMD Batching', targetView: 'nexus', category: 'Operations', status: 'ACTIVE', stat: '37.93x Accel', detail: '1.2 GB/s Zero-Copy Ring Throughput' },
  { id: 'MOD-15', number: '15', name: 'Quantum Fuel Core & Cryo Telemetry', technicalSubtitle: '14.98 mK Helium-4 Subzero Bus Stabilizer', targetView: 'quantum', category: 'Operations', status: 'ACTIVE', stat: '14.98 mK', detail: '99.992% Quantum Coherence Baseline' },
  { id: 'MOD-16', number: '16', name: 'Runtime Deck Frozen & Immutable State', technicalSubtitle: 'Permanent LTS Specification V24 Lock', targetView: 'readiness', category: 'Governance', status: 'SEALED', stat: 'Δ === 0', detail: 'Strict Read-Only Zero Ambient Mutation' },
  { id: 'MOD-17', number: '17', name: 'Audit Trail Ledger & Provenance', technicalSubtitle: 'Immutable WORM Log & 7 Evidence Objects', targetView: 'ledger', category: 'Extension', status: 'ACTIVE', stat: '7 Packs Audited', detail: 'ISO/IEC 27037 Delete-Nothing Standard' },
  { id: 'MOD-18', number: '18', name: 'Neural Sentinel & Predictive Governance', technicalSubtitle: '12,480 spans/m Telemetry Anomaly Guard', targetView: 'forge', category: 'Defense', status: 'ACTIVE', stat: '12,480 sp/m', detail: 'Phase Jitter 1.33 fs Fail-Closed Guard' },
];
