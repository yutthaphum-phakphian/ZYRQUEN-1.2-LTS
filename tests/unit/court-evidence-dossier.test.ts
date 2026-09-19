import assert from 'node:assert/strict';
import test from 'node:test';

import { CourtEvidenceDossierGenerator } from '../../src/services/CourtEvidenceDossierGenerator';
import { Module17LedgerV24 } from '../../src/services/Module17LedgerV24';

test('Court Evidence Dossier Generator & Legal Compliance Suite', async (t) => {
  await t.test('initializes with compliant configuration and canonical guardians', () => {
    const generator = new CourtEvidenceDossierGenerator({
      dossierId: 'DOSSIER-2026-0809-X99',
      caseNumber: 'TH-2026-SOV-849202',
      courtType: 'COURT_OF_JUSTICE_THAILAND',
      pqcAlgorithm: 'ML-DSA-87'
    });

    const config = generator.getConfig();
    assert.equal(config.dossierId, 'DOSSIER-2026-0809-X99');
    assert.equal(config.caseNumber, 'TH-2026-SOV-849202');
    assert.equal(config.courtType, 'COURT_OF_JUSTICE_THAILAND');
    assert.equal(config.pqcAlgorithm, 'ML-DSA-87');
    assert.equal(CourtEvidenceDossierGenerator.CANONICAL_COUNCIL_GUARDIANS.length, 10);
    assert.match(CourtEvidenceDossierGenerator.CANONICAL_COUNCIL_GUARDIANS[0], /นายยุทธภูมิ พากเพียร/);
  });

  await t.test('generates complete court-admissible dossier package with zero drift', async () => {
    const generator = new CourtEvidenceDossierGenerator({
      dossierId: 'DOSSIER-2026-0809-X99',
      caseNumber: 'TH-2026-SOV-849202',
      courtType: 'COURT_OF_JUSTICE_THAILAND',
      pqcAlgorithm: 'ML-DSA-87'
    });

    const dossierJson = await generator.generateCompleteDossier([
      'EVID-TC03-RESTORE-849202',
      'EVID-CANONICAL-MERKLE-ROOT'
    ]);

    assert.ok(dossierJson);
    const parsed = JSON.parse(dossierJson);

    assert.equal(parsed.dossierId, 'DOSSIER-2026-0809-X99');
    assert.equal(parsed.caseNumber, 'TH-2026-SOV-849202');
    assert.equal(parsed.genesisBlock, '#849202');
    assert.equal(parsed.merkleRoot, '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
    assert.equal(parsed.evidenceCount, 2);
    assert.equal(parsed.courtAdmissible, true);
    assert.equal(parsed.ssotDrift, 'Δ0.00% Zero Drift');
    assert.equal(parsed.payloads.length, 2);
    assert.equal(parsed.statutoryCompliance.length >= 4, true);
  });
});
