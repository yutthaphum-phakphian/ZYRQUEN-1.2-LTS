import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PdfAuditSync, pdfAuditSync, PDF_STANDARD_LAYOUT } from '../../src/utils/pdfAuditSync';

describe('PdfAuditSync — Singleton, WORM Vault & Invariant Verification', () => {
  it('ensures PdfAuditSync operates as a strict singleton', () => {
    const instance1 = PdfAuditSync.getInstance();
    const instance2 = PdfAuditSync.getInstance();
    assert.strictEqual(instance1, instance2);
    assert.strictEqual(instance1, pdfAuditSync);
  });

  it('creates standardized A4 and A3 documents with document properties', () => {
    const docA4 = pdfAuditSync.createA4Document({
      title: 'Judicial Test Dossier',
      subject: 'Forensic Verification',
    });

    assert.ok(docA4);
    assert.strictEqual(Math.round(docA4.internal.pageSize.getWidth()), PDF_STANDARD_LAYOUT.A4_WIDTH);
    assert.strictEqual(Math.round(docA4.internal.pageSize.getHeight()), PDF_STANDARD_LAYOUT.A4_HEIGHT);

    const docA3 = pdfAuditSync.createA3Document({
      title: 'Aggregate Evidence Sheet',
    });
    assert.ok(docA3);
    assert.strictEqual(Math.round(docA3.internal.pageSize.getWidth()), PDF_STANDARD_LAYOUT.A3_HEIGHT); // Landscape width
    assert.strictEqual(Math.round(docA3.internal.pageSize.getHeight()), PDF_STANDARD_LAYOUT.A3_WIDTH);
  });

  it('sanitizes malicious script and XSS tags before PDF insertion via DOMPurify', () => {
    const maliciousInput = '<script>alert("XSS_EXPLOIT")</script><b>Valid Evidence</b>';
    const cleanText = pdfAuditSync.sanitize(maliciousInput);
    assert.ok(!cleanText.includes('<script>'));
    assert.ok(!cleanText.includes('alert'));

    const cleanHtml = pdfAuditSync.sanitizeHtml(maliciousInput);
    assert.ok(!cleanHtml.includes('<script>'));
    assert.ok(cleanHtml.includes('<b>Valid Evidence</b>'));
  });

  it('binds Chamber 02 WORM Vault dynamically with verifiable SHA-256 Merkle proofs', () => {
    const wormBinding = pdfAuditSync.bindWormVault('CH-02', [
      'LEAF_01_GENESIS_849202',
      'LEAF_02_WORM_CHAMBER_02',
      'LEAF_03_DILITHIUM5_SIG',
      'LEAF_04_HSM_QUORUM_1010',
    ]);

    assert.ok(wormBinding);
    assert.strictEqual(wormBinding.chamberId, 'CH-02');
    assert.strictEqual(wormBinding.zeroDrift, 'Δ0 0.00%');
    assert.ok(wormBinding.merkleRoot.length === 64); // Valid SHA-256 hex string
    assert.ok(wormBinding.tsaToken.startsWith('RFC3161_TSA_TOKEN_'));
    assert.strictEqual(wormBinding.pqcAlgorithm, 'Dilithium-5');

    const last = pdfAuditSync.getLastWormBinding();
    assert.strictEqual(last?.merkleRoot, wormBinding.merkleRoot);
  });

  it('applies court banner header and standard footer with dynamic WORM root', () => {
    const doc = pdfAuditSync.createA4Document();
    const worm = pdfAuditSync.getLastWormBinding();

    const nextY = pdfAuditSync.applyCourtBannerHeader(doc, 'SOVEREIGN WORM REPORT', 'ETDA SEC 9/26/28', {
      wormChamberId: 'CH-02',
      dynamicMerkleRoot: worm?.merkleRoot,
    });
    assert.ok(nextY > PDF_STANDARD_LAYOUT.HEADER_BANNER_HEIGHT);

    pdfAuditSync.applyStandardFooter(doc, {
      customNote: 'ISO/IEC 27037 WORM Tamper-Proof',
    });

    assert.strictEqual(doc.getNumberOfPages(), 1);
  });

  it('tracks module registrations and invariant status across 25 modules', () => {
    pdfAuditSync.registerModule('MODULE_01_FORENSIC_SNAPSHOT', { tier: 'P0' });
    pdfAuditSync.registerModule('MODULE_02_COURT_DOSSIER', { tier: 'P1' });

    const registered = pdfAuditSync.getRegisteredModules();
    assert.ok(registered.includes('MODULE_01_FORENSIC_SNAPSHOT'));
    assert.ok(registered.includes('MODULE_02_COURT_DOSSIER'));

    const status = pdfAuditSync.getInvariantStatus();
    assert.ok(status.registeredModulesCount >= 2);
    assert.strictEqual(status.baselineDrift, '0.00%');
    assert.strictEqual(status.hasActiveWormBinding, true);
    assert.ok(status.initializationCount > 0);
  });
});
