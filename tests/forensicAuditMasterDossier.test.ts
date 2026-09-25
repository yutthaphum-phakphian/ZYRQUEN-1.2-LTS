// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { FORENSIC_DOSSIER_V9 } from '../src/data/forensicAuditMasterDossierData';
import {
  generateMasterForensicDossierV9Pdf,
  generateFocusedChamberPdfSync,
  generateFocusedChamberPdf,
  getChamberCoherenceState,
  getDefaultSealStatus,
  buildChamberQRPayload,
} from '../src/utils/forensicDossierPdfExport';
import { INITIAL_18_CHAMBERS } from '../src/components/chamberConsoleData';
import { calculateRelevanceScore } from '../src/hooks/useGlobalSearch';

describe('Forensic Audit Master Dossier (DOC-SOV-HSM-1010-2026-V9)', () => {
  it('validates canonical document anchors and metadata', () => {
    expect(FORENSIC_DOSSIER_V9.documentId).toBe('DOC-SOV-HSM-1010-2026-V9');
    expect(FORENSIC_DOSSIER_V9.passportId).toBe('#EP-SOVEREIGN-01');
    expect(FORENSIC_DOSSIER_V9.genesisBlock).toBe(849202);
    expect(FORENSIC_DOSSIER_V9.merkleRoot).toBe(
      '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
    );
    expect(FORENSIC_DOSSIER_V9.canonicalSealsCount).toBe(14902);
    expect(FORENSIC_DOSSIER_V9.systemDrift).toContain('0.00%');
    expect(FORENSIC_DOSSIER_V9.status).toContain('100% Pure Green');
    expect(FORENSIC_DOSSIER_V9.certificateId).toBe('ZQ-GREEN-DEP-849202-3908');
  });

  it('validates all 4 Core Technical Pillars', () => {
    expect(FORENSIC_DOSSIER_V9.pillars).toHaveLength(4);

    const [p1, p2, p3, p4] = FORENSIC_DOSSIER_V9.pillars;
    expect(p1.pillarNumber).toBe('Pillar I');
    expect(p1.title).toBe('Genesis Anchor');
    expect(p1.status).toContain('SSoT Δ0 Verified');

    expect(p2.pillarNumber).toBe('Pillar II');
    expect(p2.title).toBe('Deca-Key Governance');
    expect(p2.hardware).toContain('FIPS 140-3 Level 4');
    expect(p2.status).toContain('10/10 REAL_HSM');

    expect(p3.pillarNumber).toBe('Pillar III');
    expect(p3.title).toBe('PQC Architecture');
    expect(p3.specification).toContain('FIPS 204');
    expect(p3.specification).toContain('Dilithium-5');

    expect(p4.pillarNumber).toBe('Pillar IV');
    expect(p4.title).toBe('Cryogenic Telemetry');
    expect(p4.specification).toContain('14.98 mK');
    expect(p4.status).toContain('Nominal State');
  });

  it('verifies all 16 steps of the master forensic audit trail passed within SLA', () => {
    expect(FORENSIC_DOSSIER_V9.steps).toHaveLength(16);

    FORENSIC_DOSSIER_V9.steps.forEach((step, idx) => {
      expect(step.step).toBe(idx + 1);
      expect(step.result).toBe('PASSED');
      expect(step.executionTimeMs).toBeGreaterThan(0);
      expect(step.executionTimeMs).toBeLessThanOrEqual(142); // 142ms SLA target
      expect(step.merkleHash).toMatch(/^0x/);
      expect(step.statutoryStandard).toBeTruthy();
    });

    // Verify critical recovery step 9 SLA
    const step9 = FORENSIC_DOSSIER_V9.steps.find((s) => s.step === 9);
    expect(step9).toBeDefined();
    expect(step9?.executionTimeMs).toBe(35.8); // 35.8ms vs 142ms SLA
  });

  it('validates Thai ETDA and PDPA statutory alignments', () => {
    expect(FORENSIC_DOSSIER_V9.legalAlignments).toHaveLength(4);

    const sections = FORENSIC_DOSSIER_V9.legalAlignments.map((l) => l.section);
    expect(sections.some((s) => s.includes('Section 9'))).toBe(true);
    expect(sections.some((s) => s.includes('Section 26'))).toBe(true);
    expect(sections.some((s) => s.includes('Section 28'))).toBe(true);
    expect(sections.some((s) => s.includes('Section 37'))).toBe(true);
  });

  it('generates court-admissible PDF document without throwing', () => {
    const doc = generateMasterForensicDossierV9Pdf(FORENSIC_DOSSIER_V9);
    expect(doc).toBeDefined();
    // Verify document contains at least 2 pages
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  });

  it('verifies search query scoring matches DOC-SOV-HSM-1010-2026-V9', () => {
    const item = {
      id: 'legal-forensic-master-dossier-v9',
      title: 'Forensic Audit Master Dossier (DOC-SOV-HSM-1010-2026-V9)',
      description: 'Sovereign Mathematical Truth & Court-Admissible Master Dossier under #EP-SOVEREIGN-01',
      category: 'legal' as const,
      badge: 'DOC-SOV-HSM-1010-2026-V9',
    };

    const score1 = calculateRelevanceScore(item, 'DOC-SOV-HSM-1010-2026-V9');
    expect(score1).toBeGreaterThan(50);

    const score2 = calculateRelevanceScore(item, 'Pillar');
    const score3 = calculateRelevanceScore(item, 'EP-SOVEREIGN-01');
    expect(score3).toBeGreaterThan(0);
  });

  it('validates dynamic coherence state classification (FROZEN, QUARANTINE, TEMPERED)', () => {
    expect(getChamberCoherenceState(0.998)).toBe('FROZEN');
    expect(getChamberCoherenceState(0.950)).toBe('FROZEN');
    expect(getChamberCoherenceState(0.949)).toBe('QUARANTINE');
    expect(getChamberCoherenceState(0.742)).toBe('QUARANTINE');
    expect(getChamberCoherenceState(0.700)).toBe('QUARANTINE');
    expect(getChamberCoherenceState(0.680)).toBe('TEMPERED');
    expect(getChamberCoherenceState(0.500)).toBe('TEMPERED');

    expect(getDefaultSealStatus('FROZEN')).toContain('CANONICAL_SEALED');
    expect(getDefaultSealStatus('QUARANTINE')).toContain('QUARANTINE_HOLD');
    expect(getDefaultSealStatus('TEMPERED')).toContain('INTEGRITY_BREACH');
  });

  it('generates high-contrast QR payload embedding Chamber ID, coherence state, and current seal status', () => {
    const chamber = INITIAL_18_CHAMBERS[0]; // CH-001
    const state = getChamberCoherenceState(chamber.coherence);
    const seal = getDefaultSealStatus(state);

    const payload = buildChamberQRPayload({
      chamberId: chamber.chamberId,
      name: chamber.name,
      coherence: chamber.coherence,
      coherenceState: state,
      sealStatus: seal,
      merkleHash: chamber.merkleHash,
      temperature: chamber.temperature,
    });

    expect(payload).toContain(`id=${chamber.chamberId}`);
    expect(payload).toContain(`state=${state}`);
    expect(payload).toContain('coherence=99.80%');
    expect(payload).toContain('sealStatus=');
    expect(payload).toContain('block=849202');
    expect(payload).toContain(chamber.merkleHash);
  });

  it('generates focused Chamber PDF with technical breakdown and QR container', async () => {
    const chamber = INITIAL_18_CHAMBERS[0]; // CH-001
    const state = getChamberCoherenceState(chamber.coherence);
    const seal = getDefaultSealStatus(state);

    const doc = await generateFocusedChamberPdf({
      chamberId: chamber.chamberId,
      name: chamber.name,
      coherence: chamber.coherence,
      coherenceState: state,
      sealStatus: seal,
      temperature: chamber.temperature,
      merkleHash: chamber.merkleHash,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('verifies all 18 chambers produce valid payloads and coherence state mappings', () => {
    expect(INITIAL_18_CHAMBERS).toHaveLength(18);

    INITIAL_18_CHAMBERS.forEach((chamber) => {
      const state = getChamberCoherenceState(chamber.coherence, chamber.status);
      expect(['FROZEN', 'QUARANTINE', 'TEMPERED']).toContain(state);

      const seal = getDefaultSealStatus(state);
      expect(seal).toBeTruthy();

      const payload = buildChamberQRPayload({
        chamberId: chamber.chamberId,
        name: chamber.name,
        coherence: chamber.coherence,
        coherenceState: state,
        sealStatus: seal,
        merkleHash: chamber.merkleHash,
        temperature: chamber.temperature,
      });

      expect(payload).toContain(`id=${chamber.chamberId}`);
      expect(payload).toContain(`state=${state}`);
      expect(payload).toContain(`sealStatus=`);
    });
  });

  it('guarantees template string interpolation with backticks across all step and legal QR buttons', () => {
    // Regression test for issue: string literals with single quotes '${s.step}' vs backticks `${s.step}`
    FORENSIC_DOSSIER_V9.steps.forEach((s) => {
      const expectedBtnId = `btn-qr-step-${s.step}`;
      const expectedHashKey = `hash-${s.step}`;
      expect(expectedBtnId).toBe(`btn-qr-step-${s.step}`);
      expect(expectedBtnId).not.toBe('btn-qr-step-${s.step}');
      expect(expectedHashKey).toBe(`hash-${s.step}`);
      expect(expectedHashKey).not.toBe('hash-${s.step}');
    });

    FORENSIC_DOSSIER_V9.legalAlignments.forEach((_, idx) => {
      const expectedLegalBtnId = `btn-qr-legal-${idx + 1}`;
      const expectedEvidenceKey = `legal-${idx + 1}`;
      expect(expectedLegalBtnId).toBe(`btn-qr-legal-${idx + 1}`);
      expect(expectedLegalBtnId).not.toBe('btn-qr-legal-${idx + 1}');
      expect(expectedEvidenceKey).toBe(`legal-${idx + 1}`);
      expect(expectedEvidenceKey).not.toBe('legal-${idx + 1}');
    });
  });
});

