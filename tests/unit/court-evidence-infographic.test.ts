import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EXHIBITS_DATA, buildExhibitPayload } from '../../src/components/CourtEvidenceInfographic';

describe('Court Evidence Deck - Exhibits & QR Verification Suite', () => {
  it('registers all 7 canonical court exhibits (จพ.๐๑ through จพ.๐๗)', () => {
    assert.equal(EXHIBITS_DATA.length, 7);
    const expectedIds = ['จพ.๐๑', 'จพ.๐๒', 'จพ.๐๓', 'จพ.๐๔', 'จพ.๐๕', 'จพ.๐๖', 'จพ.๐๗'];
    const actualIds = EXHIBITS_DATA.map((e) => e.id);
    assert.deepEqual(actualIds, expectedIds);
  });

  it('verifies จพ.๐๑ matches Genesis Anchor Block #849202 and Canonical Merkle Root', () => {
    const exhibit1 = EXHIBITS_DATA.find((e) => e.id === 'จพ.๐๑');
    assert.ok(exhibit1);
    assert.equal(
      exhibit1.merkleRootOrHash,
      '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
    );
    assert.equal(exhibit1.status, 'VERIFIED_SSOT');
    assert.ok(exhibit1.statutoryBasis.includes('มาตรา ๒๘'));
  });

  it('generates valid, deterministic QR verification payload for each exhibit', () => {
    for (const exhibit of EXHIBITS_DATA) {
      const payload = buildExhibitPayload(exhibit);
      assert.equal(payload.sys, 'ZYRQUEN_OMEGA_INFINITY_v1.2_LTS');
      assert.equal(payload.exhibit_id, exhibit.id);
      assert.equal(payload.genesis_block, 849202);
      assert.equal(payload.ssot_delta, 'Δ 0.00% (Zero Drift)');
      assert.equal(payload.court_admissible, true);
      assert.equal(payload.merkle_or_hash, exhibit.merkleRootOrHash);
      assert.ok(payload.verification_uri.startsWith('urn:zyrquen:court:exhibit:'));

      // Validate JSON serializeability
      const jsonStr = JSON.stringify(payload);
      const parsed = JSON.parse(jsonStr);
      assert.equal(parsed.exhibit_id, exhibit.id);
      assert.equal(parsed.genesis_block, 849202);
    }
  });

  it('verifies statutory mapping under Thai Electronic Transactions Act B.E. 2544', () => {
    const statutoryBases = EXHIBITS_DATA.map((e) => e.statutoryBasis).join(' ');
    assert.ok(statutoryBases.includes('มาตรา ๙') || statutoryBases.includes('มาตรา ๒๖') || statutoryBases.includes('มาตรา ๒๘'));
  });
});
