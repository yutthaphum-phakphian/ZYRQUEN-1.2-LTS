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

test('CourtEvidenceDossierGenerator - ISO/IEC 27037 Compliance', async (t) => {
  await t.test('should generate deterministic dossier sorted by ID (Zero Drift)', async () => {
    const chambers = [
      { id: 'CH-02', name: 'Chamber 2', coherence: 98.5, cryogenicTemp: 14.95, status: 'PURE_GREEN', timestamp: new Date().toISOString() },
      { id: 'CH-00', name: 'Chamber 0', coherence: 93.5, cryogenicTemp: 15.05, status: 'UNSTABLE', timestamp: new Date().toISOString() },
      { id: 'CH-01', name: 'Chamber 1', coherence: 99.1, cryogenicTemp: 14.90, status: 'PURE_GREEN', timestamp: new Date().toISOString() },
    ];
    const audits = [
      { recordId: 'AUDIT-002', actionType: 'PRINT_QR', chamberSources: ['CH-02'], integrityHash: 'sha256:abc', timestamp: new Date().toISOString() },
      { recordId: 'AUDIT-001', actionType: 'BULK_LOCKDOWN', chamberSources: ['CH-00'], integrityHash: 'sha256:def', timestamp: new Date().toISOString() },
    ];

    const dossier = await CourtEvidenceDossierGenerator.generateDossier(chambers, audits);

    // Deterministic sorting
    assert.strictEqual(dossier.chambersEvidence[0].id, 'CH-00');
    assert.strictEqual(dossier.chambersEvidence[1].id, 'CH-01');
    assert.strictEqual(dossier.chambersEvidence[2].id, 'CH-02');
    assert.strictEqual(dossier.auditTrail[0].recordId, 'AUDIT-001');
    assert.strictEqual(dossier.auditTrail[1].recordId, 'AUDIT-002');
  });

  await t.test('should generate valid SHA-256 package integrity hash', async () => {
    const chambers = [
      { id: 'CH-00', name: 'Sovereign Chamber CH-00', coherence: 100, cryogenicTemp: 14.90, status: 'LOCKED_PROTECTED', timestamp: new Date().toISOString() }
    ];
    const audits: any[] = [];

    const dossier = await CourtEvidenceDossierGenerator.generateDossier(chambers, audits);

    assert.ok(dossier.dossierId.startsWith('DOSSIER-ZQ-'));
    assert.ok(dossier.packageIntegrityHash.startsWith('sha256:'));
    assert.strictEqual(dossier.packageIntegrityHash.length, 7 + 64); // sha256: + 64 hex
    assert.strictEqual(dossier.systemState, 'LOCKED_FROZEN_v1.2_LTS');
    assert.strictEqual(dossier.genesisBlock, '#849202');
    assert.ok(dossier.quorumAttestation.includes('10/10 REAL_HSM_VERIFIED'));
    assert.ok(dossier.principalCustodian.includes('ยุทธภูมิ'));
  });

  await t.test('should preserve WORM audit ledger linkage', async () => {
    const chambers: any[] = [];
    const audits = [
      { recordId: 'AUDIT-LOCK-0001', actionType: 'BULK_LOCKDOWN', chamberSources: ['CH-03', 'CH-11'], integrityHash: 'sha256:hash1', timestamp: '2026-01-01T00:00:00.000Z' },
      { recordId: 'AUDIT-CSV-0002', actionType: 'EXPORT_CSV', chamberSources: ['CH-00'], integrityHash: 'sha256:hash2', timestamp: '2026-01-01T00:01:00.000Z' },
    ];

    const dossier = await CourtEvidenceDossierGenerator.generateDossier(chambers, audits);

    assert.strictEqual(dossier.auditTrail.length, 2);
    assert.ok(dossier.auditTrail.every(a => a.integrityHash.startsWith('sha256:')));
    assert.strictEqual(dossier.generatedAt.length > 0, true);
  });

  await t.test('should handle empty evidence (edge case)', async () => {
    const dossier = await CourtEvidenceDossierGenerator.generateDossier([], []);
    assert.strictEqual(dossier.chambersEvidence.length, 0);
    assert.strictEqual(dossier.auditTrail.length, 0);
    assert.ok(dossier.packageIntegrityHash);
  });
});

