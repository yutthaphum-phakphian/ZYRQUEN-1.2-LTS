import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_SSOT_CORE,
  verifyCrossModuleSSoTParity,
  FOUNDATION_PHASE_CONTRACTS,
  runContractCompatibilityAudit,
} from '../../src/core/index';
import { verifyGenesisMerkleRoot, generateSealProof } from '../../src/services/cryptoEngine';
import { hsmTamperService } from '../../src/services/hsmTamperService';

test('Cross-module SSoT parity check validates all 8 canonical sources', () => {
  const parity = verifyCrossModuleSSoTParity();

  assert.equal(parity.allMatched, true);
  assert.equal(parity.canonicalBlock, 849202);
  assert.equal(
    parity.canonicalMerkleRoot,
    '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
  );
  assert.equal(parity.canonicalSeals, 14902);
  assert.equal(parity.modules.length, 8);
  assert.ok(parity.modules.every((m) => m.parityMatched === true));
  assert.equal(parity.chambersCountParity.sovereignDataCount, 19);
  assert.equal(parity.chambersCountParity.ssotDataCount, 19);
  assert.equal(parity.chambersCountParity.matched, true);
});

test('Foundation Phase 01–10 contracts are defined and bound to invariants', () => {
  assert.equal(FOUNDATION_PHASE_CONTRACTS.length, 10);
  assert.deepEqual(
    FOUNDATION_PHASE_CONTRACTS.map((p) => p.phaseId),
    [
      'PHASE_01',
      'PHASE_02',
      'PHASE_03',
      'PHASE_04',
      'PHASE_05',
      'PHASE_06',
      'PHASE_07',
      'PHASE_08',
      'PHASE_09',
      'PHASE_10',
    ]
  );
});

test('Contract-level compatibility audit verifies all 19 chambers (CH-00 to CH-18)', () => {
  const report = runContractCompatibilityAudit();

  assert.equal(report.auditStatus, 'CONTRACT_AUDIT_PASSED');
  assert.equal(report.integrationReadiness, 'READY_CONTRACT_VERIFIED');
  assert.equal(report.summaryMetrics.totalChambersRegistered, 19);
  assert.equal(report.summaryMetrics.totalChambersWithMasterPanel, 19);
  assert.equal(report.summaryMetrics.totalSSoTModulesSynced, 8);
  assert.equal(report.summaryMetrics.totalFoundationPhasesVerified, 10);
  assert.equal(report.chamberInventory[18].code, 'CH-18');
  assert.equal(report.chamberInventory[18].roomCode, 'ROOM18');
  assert.equal(report.chamberInventory[18].masterPanelFile, 'src/components/Room18MasterPanel.tsx');
});

test('cryptoEngine produces deterministic WebCrypto SHA-256 proofs without Math.random drift', async () => {
  const root1 = await verifyGenesisMerkleRoot();
  const root2 = await verifyGenesisMerkleRoot();

  assert.equal(root1.calculatedHash, root2.calculatedHash);
  assert.equal(root1.pqcAttestation, root2.pqcAttestation);
  assert.equal(root1.verificationMode, 'WEBCRYPTO_SHA256_DETERMINISTIC');
  assert.equal(root1.pqcEnvelopeClassification, 'DETERMINISTIC_LATTICE_COMMITMENT_FIPS204');

  const seal1 = await generateSealProof(14902);
  const seal2 = await generateSealProof(14902);
  assert.equal(seal1.leafHash, seal2.leafHash);
  assert.equal(seal1.pqcProof, seal2.pqcProof);
  assert.equal(seal1.status, 'VERIFIED');

  const quarantinedSeal = await generateSealProof(14903);
  assert.equal(quarantinedSeal.status, 'QUARANTINED');
});

test('hsmTamperService produces deterministic benchmark metrics with explicit provenance', () => {
  const zeroize = hsmTamperService.triggerActiveZeroization();
  assert.equal(zeroize.zeroizationLatencyMs, 0.48);
  assert.equal(zeroize.zeroizationPassed, true);
  assert.equal(zeroize.attestationProvenance, 'CONFIGURED_HSM_ENCLAVE_MODEL');

  const phoenix = hsmTamperService.executePhoenixRecovery();
  assert.equal(phoenix.recoveryLatencyMs, 2.93);
  assert.equal(phoenix.recoveryPassed, true);
  assert.equal(phoenix.attestationProvenance, 'CONFIGURED_HSM_ENCLAVE_MODEL');
  assert.equal(CANONICAL_SSOT_CORE.genesisAnchor.blockHeight, phoenix.genesisBlock);
});
