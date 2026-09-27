import { describe, it, expect } from 'vitest';
import { AUTHORITATIVE_CONSTANTS } from '../canonicalResolver';
import { sovereignConfig, SOVEREIGN_CONFIG } from '../../sovereign.config';
import { CANONICAL_BASE_DATA, canonicalData, SYSTEM_METADATA } from '../../data/canonicalData';
import { CANONICAL_CONSTANTS, SOVEREIGN_CHAMBERS } from '../../data/sovereignData';
import {
  authoritativeState,
  getAuthoritativeState,
  AUTHORITATIVE_STATE,
  verifyCanonicalReconciliation,
} from '../../utils/authoritativeState';
import { HSM_NODES_DATA } from '../../components/views/SecurityView';
import {
  CANONICAL_BLOCK,
  CANONICAL_FROZEN_SEALS,
  CANONICAL_MERKLE_ROOT,
} from '../../components/Room18MasterPanel';

describe('ชุดทดสอบบูรณาการ ZYRQUEN Ω∞ FROZEN v1.2.1 LTS (100% SSoT Synchronization)', () => {
  it('๑. ตรวจสอบความถูกต้องของ AUTHORITATIVE_CONSTANTS ใน canonicalResolver.ts', () => {
    expect(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT).toBe(849202);
    expect(AUTHORITATIVE_CONSTANTS.BLOCK_HEIGHT).toBe(849202);
    expect(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT).toBe(
      '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
    );
    expect(AUTHORITATIVE_CONSTANTS.SEAL_COUNT).toBe(14902);
    expect(AUTHORITATIVE_CONSTANTS.HSM_TOTAL_NODES).toBe(10);
    expect(AUTHORITATIVE_CONSTANTS.HSM_QUORUM_THRESHOLD).toBe(10);
    expect(AUTHORITATIVE_CONSTANTS.REPLAY_SLA_MS).toBe(142.0);
    expect(AUTHORITATIVE_CONSTANTS.SYSTEM_AUDIT_ID).toBe('AUD-MOD_MUGWCIK6');
    expect(AUTHORITATIVE_CONSTANTS.SOVEREIGN_AUTHORITY).toBe('#EP-SOVEREIGN-01');
  });

  it('๒. ตรวจสอบการซิงโครไนซ์ SSoT 100.00% ข้ามโมดูล (sovereign.config, canonicalData, sovereignData, authoritativeState)', () => {
    expect(sovereignConfig.blockHeight).toBe(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT);
    expect(sovereignConfig.merkleRoot).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
    expect(sovereignConfig.sealCount).toBe(AUTHORITATIVE_CONSTANTS.SEAL_COUNT);
    expect(sovereignConfig.auditId).toBe(AUTHORITATIVE_CONSTANTS.SYSTEM_AUDIT_ID);

    expect(CANONICAL_BASE_DATA.anchorBlock).toBe(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT);
    expect(CANONICAL_BASE_DATA.rootHash).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
    expect(CANONICAL_BASE_DATA.totalSeals).toBe(AUTHORITATIVE_CONSTANTS.SEAL_COUNT);

    expect(canonicalData.blockHeight).toBe(AUTHORITATIVE_CONSTANTS.BLOCK_HEIGHT);
    expect(canonicalData.merkleRoot).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
    expect(canonicalData.seals).toBe(AUTHORITATIVE_CONSTANTS.SEAL_COUNT);

    const stateSnapshot = getAuthoritativeState();
    expect(stateSnapshot.blockHeight).toBe(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT);
    expect(stateSnapshot.merkleRoot).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
    expect(stateSnapshot.canonicalSeals).toBe(AUTHORITATIVE_CONSTANTS.SEAL_COUNT);
    expect(stateSnapshot.isZeroDrift).toBe(true);

    expect(authoritativeState.height).toBe(849202);
    expect(authoritativeState.root).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
    expect(authoritativeState.seals).toBe(14902);

    expect(SOVEREIGN_CONFIG.genesisAnchor.blockHeight).toBe(CANONICAL_CONSTANTS.CANONICAL_BLOCK);
    expect(SYSTEM_METADATA.sealedBlock).toBe(AUTHORITATIVE_STATE.canonical.blockHeight);

    const report = verifyCanonicalReconciliation();
    expect(report.reconciled).toBe(true);
  });

  it('๓. ตรวจสอบโครงสร้างโหนด Hardware HSM Quorum Monitor ทั้ง 10 โหนดใน SecurityView', () => {
    expect(HSM_NODES_DATA).toHaveLength(10);
    const hwCount = HSM_NODES_DATA.filter((n) => n.isHardware).length;
    const simCount = HSM_NODES_DATA.filter((n) => !n.isHardware).length;
    expect(hwCount).toBe(8);
    expect(simCount).toBe(2);
    expect(HSM_NODES_DATA[0].label).toBe('HSM-NODE-01');
    expect(HSM_NODES_DATA[9].label).toBe('HSM-NODE-10');
  });

  it('๔. ตรวจสอบการลงทะเบียน ROOM18 (Neural Sentinel & Predictive Governance) ครอบคลุม ROOM00–ROOM18', () => {
    expect(CANONICAL_BLOCK).toBe(849202);
    expect(CANONICAL_FROZEN_SEALS).toBe(14902);
    expect(CANONICAL_MERKLE_ROOT).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
    expect(SOVEREIGN_CHAMBERS).toHaveLength(19);
    const ch18 = SOVEREIGN_CHAMBERS.find((c) => c.code === 'CH-18');
    expect(ch18).toBeDefined();
    expect(ch18?.name).toContain('Neural Sentinel');
  });
});
