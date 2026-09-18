import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HARDWARE_SEALS_LEDGER,
  verifyHardwareSealAgainstLedger,
  CANONICAL_BLOCK_HEIGHT,
  GENESIS_MERKLE_ROOT,
} from '../../src/data/hardwareSealsData';

describe('Physical Hardware Seals Digital Ledger Verification', () => {
  it('registers all canonical physical hardware seals mapped to Block #849202', () => {
    assert.ok(HARDWARE_SEALS_LEDGER.length >= 6);
    HARDWARE_SEALS_LEDGER.forEach((seal) => {
      assert.equal(seal.sealedBlockHeight, CANONICAL_BLOCK_HEIGHT);
      assert.ok(seal.sealId.startsWith('SEAL-'));
      assert.ok(seal.merkleLeafHash.length === 64);
      assert.equal(seal.digitalLedgerStatus, 'SEALED_INTACT');
    });
  });

  it('successfully verifies TC-01 Alpha Custodian HSM physical seal payload with zero drift', () => {
    const tc01 = HARDWARE_SEALS_LEDGER[0];
    const result = verifyHardwareSealAgainstLedger(tc01.qrPayload);

    assert.equal(result.status, 'VERIFIED_INTACT');
    assert.equal(result.isLeafMatch, true);
    assert.equal(result.isBlockMatch, true);
    assert.equal(result.ledgerBlockHeight, CANONICAL_BLOCK_HEIGHT);
    assert.equal(result.genesisMerkleRoot, GENESIS_MERKLE_ROOT);
    assert.equal(result.driftDelta, '0.00% (Absolute Parity)');
    assert.ok(result.courtAdmissibility.includes('ADMISSIBLE'));
  });

  it('detects tampering and divergence in physical seal hash or block height', () => {
    const tamperedPayload = JSON.stringify({
      protocol: 'ZYRQUEN_SEAL_V12',
      sealId: 'SEAL-HSM-TC01-849202',
      serial: 'FOIL-TAG-3908-01',
      unit: 'TC-01',
      block: 999999, // Altered block height
      leaf: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      tampered: true,
    });

    const result = verifyHardwareSealAgainstLedger(tamperedPayload);
    assert.equal(result.status, 'TAMPER_DETECTED');
    assert.equal(result.isLeafMatch, false);
    assert.ok(result.driftDelta.includes('CRITICAL_DRIFT'));
    assert.ok(result.courtAdmissibility.includes('FLAGGED'));
  });

  it('rejects unregistered hardware seals attempting unauthorized ledger attachment', () => {
    const roguePayload = 'SEAL-ROGUE-CHASSIS-UNREGISTERED-007';
    const result = verifyHardwareSealAgainstLedger(roguePayload);

    assert.equal(result.status, 'UNREGISTERED');
    assert.equal(result.isLeafMatch, false);
    assert.ok(result.courtAdmissibility.includes('INADMISSIBLE'));
  });

  it('gracefully handles empty or corrupted QR scan inputs', () => {
    const emptyResult = verifyHardwareSealAgainstLedger('');
    assert.equal(emptyResult.status, 'INVALID_FORMAT');
    assert.equal(emptyResult.isLeafMatch, false);
  });
});
