// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { FORENSIC_DOSSIER_V9 } from '../src/data/forensicAuditMasterDossierData';
import {
  generateMasterForensicDossierV9Pdf,
  generateEvidenceManifestPdf,
} from '../src/utils/forensicDossierPdfExport';
import { buildAllForensicEvidenceItems } from '../src/components/forensics/ForensicEvidenceQrGeneratorModal';
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

  it('builds full forensic evidence inventory items accurately', () => {
    const items = buildAllForensicEvidenceItems(FORENSIC_DOSSIER_V9);
    expect(items.length).toBeGreaterThanOrEqual(22);

    // Verify presence of Master Dossier, 16 steps, 4 pillars, and legal items
    const master = items.find((i) => i.id === 'master-dossier');
    expect(master).toBeDefined();
    expect(master?.code).toBe('DOC-MASTER-ROOT');

    const step1 = items.find((i) => i.id === 'step-1');
    expect(step1).toBeDefined();
    expect(step1?.code).toBe('STG-01');

    const pillar2 = items.find((i) => i.id === 'pillar-2');
    expect(pillar2).toBeDefined();
    expect(pillar2?.code).toBe('PIL-02');

    const legal1 = items.find((i) => i.id === 'legal-1');
    expect(legal1).toBeDefined();
    expect(legal1?.code).toBe('LEG-01');
  });

  it('generates signed PDF evidence manifest inventory without throwing', () => {
    const doc = generateEvidenceManifestPdf(FORENSIC_DOSSIER_V9);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
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
});
