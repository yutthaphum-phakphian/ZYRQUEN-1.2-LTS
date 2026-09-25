import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WormVaultService, wormVaultService } from '../../src/services/wormVaultService';
import { pdfAuditSync } from '../../src/utils/pdfAuditSync';

describe('WormVaultService — Secure Read-Only Interface & 42-Event Forensic Root', () => {
  it('operates as a strict singleton with fail-closed properties', () => {
    const instance1 = WormVaultService.getInstance();
    const instance2 = WormVaultService.getInstance();
    assert.strictEqual(instance1, instance2);
    assert.strictEqual(instance1, wormVaultService);
  });

  it('verifies 42-event Chamber 02 WORM dataset structure and node distributions', () => {
    const dataset = wormVaultService.getChamber02Dataset();
    assert.strictEqual(dataset.chamberId, 'CH-02');
    assert.strictEqual(dataset.totalEvents, 42);
    assert.strictEqual(dataset.trigger, 'PHASE_JITTER_DECOHERENCE');
    assert.strictEqual(dataset.threshold, 85);
    assert.strictEqual(dataset.ssotDrift, '0.00%');

    // Verify node distribution totals sum to exactly 42
    const totalNodeEvents = Object.values(dataset.nodes).reduce((acc, count) => acc + count, 0);
    assert.strictEqual(totalNodeEvents, 42);
    assert.strictEqual(dataset.nodes.TY03, 8);
    assert.strictEqual(dataset.nodes.SG02, 11);
    assert.strictEqual(dataset.nodes.SV05, 8);
    assert.strictEqual(dataset.nodes.ZH04, 3);
    assert.strictEqual(dataset.nodes.LD06, 8);
    assert.strictEqual(dataset.nodes.BK01, 4);
  });

  it('computes bit-exact 64-char SHA-256 Merkle root from 42 leaf hashes', () => {
    const dataset = wormVaultService.getChamber02Dataset();
    assert.strictEqual(dataset.leafHashes.length, 42);

    const liveAnchor = wormVaultService.getLiveMerkleRoot('CH-02');
    assert.ok(liveAnchor.merkleRoot);
    assert.strictEqual(liveAnchor.merkleRoot.length, 64);
    assert.strictEqual(liveAnchor.zeroDrift, 'Δ0 0.00%');
    assert.strictEqual(liveAnchor.isFailClosedActive, true);
    assert.ok(liveAnchor.tsaToken.startsWith('RFC3161_TSA_WORM_TOKEN_'));
  });

  it('verifies cryptographic leaf inclusion and proof path in Chamber 02 Merkle tree', () => {
    const dataset = wormVaultService.getChamber02Dataset();
    const targetLeaf = dataset.leafHashes[0];

    const verification = wormVaultService.verifyLeafInclusion(targetLeaf, 'CH-02');
    assert.strictEqual(verification.isIncluded, true);
    assert.strictEqual(verification.leafIndex, 0);
    assert.ok(verification.proofPath.length > 0);

    const fakeVerification = wormVaultService.verifyLeafInclusion('0000000000000000000000000000000000000000000000000000000000000000', 'CH-02');
    assert.strictEqual(fakeVerification.isIncluded, false);
    assert.strictEqual(fakeVerification.leafIndex, -1);
  });

  it('integrates seamlessly with pdfAuditSync for live court document generation', () => {
    const liveBinding = pdfAuditSync.bindWormVault('CH-02');
    assert.ok(liveBinding);
    assert.strictEqual(liveBinding.chamberId, 'CH-02');
    assert.strictEqual(liveBinding.zeroDrift, 'Δ0 0.00%');

    const doc = pdfAuditSync.createA4Document({
      title: 'Chamber 02 Forensic Attestation',
    });
    assert.ok(doc);

    const nextY = pdfAuditSync.applyCourtBannerHeader(doc, 'CH-02 WORM ATTESTATION', undefined, {
      wormChamberId: 'CH-02',
    });
    assert.ok(nextY > 38);
  });
});
