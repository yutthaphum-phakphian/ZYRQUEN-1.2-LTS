import assert from 'node:assert/strict';
import test from 'node:test';

import { Module17LedgerV24 } from '../../src/services/Module17LedgerV24';
import { LegalPrintAutomationService } from '../../src/services/LegalPrintAutomation';

test('Legal Print Automation & Module 17 V24 Evidence Integration Suite', async (t) => {
  await t.test('fetches canonical evidence payload from Module 17 V24', async () => {
    const payload = await Module17LedgerV24.getEvidencePayload('EVID-TC03-RESTORE-849202');
    assert.ok(payload);
    assert.equal(payload.sys, 'ZYRQUEN_OMEGA_INFINITY_FROZEN_v1.2_LTS');
    assert.equal(payload.genesis_block, 849202);
    assert.equal(payload.merkle_root, '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
    assert.equal(payload.court_admissible, true);
    assert.equal(payload.ssot_delta, '0.00%');
  });

  await t.test('generates dynamic valid payload for arbitrary evidence ID', async () => {
    const payload = await Module17LedgerV24.getEvidencePayload('JP-03-CRYPTO-AGILITY');
    assert.ok(payload);
    assert.equal(payload.evidence_code, 'JP-03-CRYPTO-AGILITY');
    assert.equal(payload.genesis_block, 849202);
    assert.equal(payload.court_admissible, true);
  });

  await t.test('instantiates and executes LegalPrintAutomationService safely', async () => {
    const service = new LegalPrintAutomationService({
      autoTriggerAfterPhase12: true,
      targetContainerId: 'court-evidence-card-root',
      complianceStandard: 'ISO/IEC-27037'
    });

    assert.equal(service.getConfig().autoTriggerAfterPhase12, true);
    assert.equal(service.getConfig().complianceStandard, 'ISO/IEC-27037');

    // Execution in headless test environment (returns true when evidence payload is validated)
    const success = await service.executeAutomatedPrintAndSeal('EVID-CANONICAL-MERKLE-ROOT');
    assert.equal(success, true);
  });
});
