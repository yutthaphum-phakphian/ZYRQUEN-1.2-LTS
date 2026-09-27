/**
 * ZYRQUEN Ω∞ FROZEN v1.2 LTS — Unified Canonical Single Source of Truth (SSoT Δ0)
 *
 * Consolidates all canonical constants, repository identity, deployment certificates,
 * and cross-module parity checks into a single immutable core module.
 */

import { SOVEREIGN_CONFIG } from '../sovereign.config';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { CANONICAL_CONSTANTS, STATE_AUTHORITY, SOVEREIGN_CHAMBERS } from '../data/sovereignData';
import { SSOT, CHAMBERS_DATA } from '../lib/ssot-data';
import { AUTHORITATIVE_STATE } from '../utils/authoritativeState';
import { WriteFirewallEngine } from '../utils/writeFirewall';
import { P0FrozenCoreGuard } from '../utils/p0FrozenCoreGuard';
import { frozenCore } from './ssot-lock';

export const CANONICAL_SSOT_CORE = Object.freeze({
  repositoryIdentity: Object.freeze({
    packageName: 'zyrquen-sovereign-world-engine',
    packageVersion: '1.2.1',
    engineVersion: 'v4.16',
    releaseCodename: 'LOCKED_FROZEN_v1.2_LTS',
    branch: 'main',
    headCommitAnchor: '98f9db98348f1c85e077d75d939718d5fe7a47aa',
    remoteHttps: 'https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git',
    remoteSsh: 'git@github.com:yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git',
    ghCliClone: 'gh repo clone yutthaphum-phakphian/ZYRQUEN-1.2-LTS',
  }),

  genesisAnchor: Object.freeze({
    blockHeight: 849202 as const,
    blockTag: '#849202' as const,
    merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68' as const,
    genesisSeedText: 'ZYRQUEN_GENESIS_CONTRACT_v1.2' as const,
    deploymentCertGold: 'ZQ-GOLD-DEP-849202-3908' as const,
    deploymentCertGreen: 'ZQ-GREEN-DEP-849202-3908' as const,
    documentRef: 'DOC-SOV-HSM-1010-2026' as const,
  }),

  sealsLedger: Object.freeze({
    canonicalSeals: 14902 as const,
    quarantinedSeals: 80 as const,
    rawTotalSeals: 14982 as const,
    observedRuntimeStreamSeals: 14907 as const,
    observedRuntimeQuarantineDelta: 5 as const,
    ssotMutation: 0 as const,
    ssotDrift: 'Δ0.00%' as const,
    writeAuthority: 'NONE' as const,
    promotionGate: 'FAIL_CLOSED' as const,
  }),

  sovereignPrincipal: Object.freeze({
    nameTh: 'นายยุทธภูมิ พากเพียร' as const,
    nameEn: 'Yuttaphum Phakphian' as const,
    passportId: '#EP-SOVEREIGN-01' as const,
    clearance: 'OMEGA-1 SUPREME CLEARANCE' as const,
  }),

  chambersRegistry: Object.freeze({
    canonicalRange: 'CH-00 to CH-18' as const,
    totalRegisteredChambers: 19 as const,
    foundationChambersCount: 18 as const,
    sentinelExtensionChamber: 'CH-18' as const,
    tenantBoundary: 'Ω601–Ω1000' as const,
    tenantBoundaryAlias: 'Ω600_1000' as const,
    tenantCount: 400 as const,
  }),
});

export interface SSoTModuleParityRecord {
  modulePath: string;
  blockHeight: number;
  merkleRoot: string;
  canonicalSeals: number;
  ssotMutation: number | string;
  certCode: string;
  parityMatched: boolean;
}

/**
 * Verifies that all 8 SSoT / Canonical modules across the repository
 * resolve to the exact same canonical block (#849202), Merkle root (909ab814...fa4c68),
 * seal count (14,902), and zero mutation delta (0).
 */
export function verifyCrossModuleSSoTParity(): {
  allMatched: boolean;
  canonicalBlock: number;
  canonicalMerkleRoot: string;
  canonicalSeals: number;
  chambersCountParity: {
    sovereignDataCount: number;
    ssotDataCount: number;
    matched: boolean;
  };
  modules: SSoTModuleParityRecord[];
} {
  const expectedBlock = CANONICAL_SSOT_CORE.genesisAnchor.blockHeight;
  const expectedRoot = CANONICAL_SSOT_CORE.genesisAnchor.merkleRoot;
  const expectedSeals = CANONICAL_SSOT_CORE.sealsLedger.canonicalSeals;

  const modules: SSoTModuleParityRecord[] = [
    {
      modulePath: 'src/sovereign.config.ts',
      blockHeight: SOVEREIGN_CONFIG.genesisAnchor.blockHeight,
      merkleRoot: SOVEREIGN_CONFIG.genesisAnchor.merkleRoot,
      canonicalSeals: SOVEREIGN_CONFIG.sealsRegistry.canonicalSealsCount,
      ssotMutation: SOVEREIGN_CONFIG.sealsRegistry.baselineDriftPct,
      certCode: SOVEREIGN_CONFIG.genesisAnchor.deploymentCertCode,
      parityMatched:
        SOVEREIGN_CONFIG.genesisAnchor.blockHeight === expectedBlock &&
        SOVEREIGN_CONFIG.genesisAnchor.merkleRoot === expectedRoot &&
        SOVEREIGN_CONFIG.sealsRegistry.canonicalSealsCount === expectedSeals &&
        SOVEREIGN_CONFIG.sealsRegistry.baselineDriftPct === 0,
    },
    {
      modulePath: 'src/data/canonicalData.ts',
      blockHeight: SYSTEM_METADATA.sealedBlock,
      merkleRoot: SYSTEM_METADATA.merkleRoot,
      canonicalSeals: SYSTEM_METADATA.canonicalSeals,
      ssotMutation: SYSTEM_METADATA.ssotMutation,
      certCode: CANONICAL_SSOT_CORE.genesisAnchor.deploymentCertGold,
      parityMatched:
        SYSTEM_METADATA.sealedBlock === expectedBlock &&
        SYSTEM_METADATA.merkleRoot === expectedRoot &&
        SYSTEM_METADATA.canonicalSeals === expectedSeals &&
        SYSTEM_METADATA.ssotMutation === 0,
    },
    {
      modulePath: 'src/data/sovereignData.ts',
      blockHeight: CANONICAL_CONSTANTS.CANONICAL_BLOCK,
      merkleRoot: CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT,
      canonicalSeals: CANONICAL_CONSTANTS.CANONICAL_SEALS,
      ssotMutation: STATE_AUTHORITY.SSOT_MUTATION_COUNT,
      certCode: CANONICAL_CONSTANTS.DEPLOYMENT_CERTIFICATE,
      parityMatched:
        CANONICAL_CONSTANTS.CANONICAL_BLOCK === expectedBlock &&
        CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT === expectedRoot &&
        CANONICAL_CONSTANTS.CANONICAL_SEALS === expectedSeals &&
        STATE_AUTHORITY.SSOT_MUTATION_COUNT === 0,
    },
    {
      modulePath: 'src/lib/ssot-data.ts',
      blockHeight: SSOT.canonicalBlockHeight,
      merkleRoot: SSOT.merkleRoot,
      canonicalSeals: SSOT.canonicalSealsCount,
      ssotMutation: SSOT.mutationAuthority,
      certCode: CANONICAL_SSOT_CORE.genesisAnchor.deploymentCertGold,
      parityMatched:
        SSOT.canonicalBlockHeight === expectedBlock &&
        SSOT.merkleRoot === expectedRoot &&
        SSOT.canonicalSealsCount === expectedSeals &&
        SSOT.mutationAuthority === 0,
    },
    {
      modulePath: 'src/utils/authoritativeState.ts',
      blockHeight: AUTHORITATIVE_STATE.canonical.blockHeight,
      merkleRoot: AUTHORITATIVE_STATE.canonical.merkleRoot,
      canonicalSeals: AUTHORITATIVE_STATE.canonical.seals,
      ssotMutation: AUTHORITATIVE_STATE.canonical.ssotMutation,
      certCode: AUTHORITATIVE_STATE.canonical.cert,
      parityMatched:
        AUTHORITATIVE_STATE.canonical.blockHeight === expectedBlock &&
        AUTHORITATIVE_STATE.canonical.merkleRoot === expectedRoot &&
        AUTHORITATIVE_STATE.canonical.seals === expectedSeals &&
        AUTHORITATIVE_STATE.canonical.ssotMutation === 0,
    },
    {
      modulePath: 'src/utils/writeFirewall.ts',
      blockHeight: WriteFirewallEngine.CANONICAL_BLOCK,
      merkleRoot: WriteFirewallEngine.CANONICAL_ROOT,
      canonicalSeals: WriteFirewallEngine.CANONICAL_SEALS,
      ssotMutation: WriteFirewallEngine.SSOT_MUTATION,
      certCode: CANONICAL_SSOT_CORE.genesisAnchor.deploymentCertGold,
      parityMatched:
        WriteFirewallEngine.CANONICAL_BLOCK === expectedBlock &&
        WriteFirewallEngine.CANONICAL_ROOT === expectedRoot &&
        WriteFirewallEngine.CANONICAL_SEALS === expectedSeals &&
        WriteFirewallEngine.SSOT_MUTATION === 0,
    },
    {
      modulePath: 'src/utils/p0FrozenCoreGuard.ts',
      blockHeight: P0FrozenCoreGuard.BLOCK_HEIGHT,
      merkleRoot: P0FrozenCoreGuard.CANONICAL_ROOT,
      canonicalSeals: P0FrozenCoreGuard.CANONICAL_SEALS,
      ssotMutation: P0FrozenCoreGuard.SSOT_MUTATION,
      certCode: CANONICAL_SSOT_CORE.genesisAnchor.deploymentCertGold,
      parityMatched:
        P0FrozenCoreGuard.BLOCK_HEIGHT === expectedBlock &&
        P0FrozenCoreGuard.CANONICAL_ROOT === expectedRoot &&
        P0FrozenCoreGuard.CANONICAL_SEALS === expectedSeals &&
        P0FrozenCoreGuard.SSOT_MUTATION === 0,
    },
    {
      modulePath: 'src/core/ssot-lock.ts',
      blockHeight: 849202,
      merkleRoot: frozenCore.merkleRoot,
      canonicalSeals: frozenCore.sealsCount,
      ssotMutation: 0,
      certCode: frozenCore.cert,
      parityMatched:
        frozenCore.genesisBlock.includes('#849202') &&
        frozenCore.merkleRoot === expectedRoot &&
        frozenCore.sealsCount === expectedSeals &&
        frozenCore.drift === 'Δ0.00% ZERO DRIFT',
    },
  ];

  const sovereignDataCount = SOVEREIGN_CHAMBERS.length;
  const ssotDataCount = CHAMBERS_DATA.length;

  return {
    allMatched: modules.every((m) => m.parityMatched) && sovereignDataCount === ssotDataCount,
    canonicalBlock: expectedBlock,
    canonicalMerkleRoot: expectedRoot,
    canonicalSeals: expectedSeals,
    chambersCountParity: {
      sovereignDataCount,
      ssotDataCount,
      matched: sovereignDataCount === ssotDataCount && sovereignDataCount === 19,
    },
    modules,
  };
}
