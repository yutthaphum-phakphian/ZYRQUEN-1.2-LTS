// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { APEX_18_CHAMBERS, APEX_SOVEREIGN_CHAMBERS, CHAMBER_18_SENTINEL } from '../src/components/Chamber17ApexMatrix';
import { SLIDES_DATA } from '../src/components/ExecutiveSlideDeck';
import { JUDICIAL_GATES_15_22 } from '../src/components/JudicialEtdaDeepDive';
import { CHAMBERS_COHERENCE_DATA } from '../src/components/QuantumCoherenceAuditView';
import {
  COURT_EXHIBITS,
  DECA_KEY_SIGNERS,
  REPLAY_12_STAGES
} from '../src/components/FullForensicCourtDossierView';

describe('Chamber 17 Apex Matrix & Chamber 16 Visualizer Test Suite', () => {
  it('should have exactly 18 sovereign chambers configured in 6x3 matrix', () => {
    expect(APEX_18_CHAMBERS).toHaveLength(18);

    // Verify row distribution: exactly 6 per row
    const row1 = APEX_18_CHAMBERS.filter((c) => c.row === 1);
    const row2 = APEX_18_CHAMBERS.filter((c) => c.row === 2);
    const row3 = APEX_18_CHAMBERS.filter((c) => c.row === 3);

    expect(row1).toHaveLength(6);
    expect(row2).toHaveLength(6);
    expect(row3).toHaveLength(6);
  });

  it('should verify all 18 chambers maintain 0.0000% SSoT drift and #EP-SOVEREIGN-01 authority', () => {
    APEX_18_CHAMBERS.forEach((chamber) => {
      expect(chamber.drift).toBe('0.0000%');
      expect(chamber.authority).toBe('#EP-SOVEREIGN-01');
      expect(chamber.id).toMatch(/^CH-\d{2}$/);
    });
  });

  it('should verify Chamber 18 (Neural Sentinel & Pattern Detection) is integrated into Apex Matrix', () => {
    expect(CHAMBER_18_SENTINEL).toBeDefined();
    expect(CHAMBER_18_SENTINEL.id).toBe('CH-18');
    expect(CHAMBER_18_SENTINEL.name).toBe('Neural Sentinel');
    expect(CHAMBER_18_SENTINEL.authority).toBe('#EP-SOVEREIGN-01');
    expect(CHAMBER_18_SENTINEL.drift).toBe('0.0000%');
    expect(APEX_SOVEREIGN_CHAMBERS).toHaveLength(19);
  });

  it('should verify CH-16 (3D Visualizer) and CH-17 (Apex Control) existence and status', () => {
    const ch16 = APEX_18_CHAMBERS.find((c) => c.id === 'CH-16');
    const ch17 = APEX_18_CHAMBERS.find((c) => c.id === 'CH-17');

    expect(ch16).toBeDefined();
    expect(ch16?.name).toBe('3D Visualizer');
    expect(ch16?.category).toBe('Graphics');

    expect(ch17).toBeDefined();
    expect(ch17?.name).toBe('Apex Control');
    expect(ch17?.category).toBe('Command');
    expect(ch17?.status).toBe('SOVEREIGN');
  });

  it('should verify Row 1, Row 2, Row 3 specific chamber allocations', () => {
    // Row 1: CH-00 to CH-05
    const row1Ids = APEX_18_CHAMBERS.filter((c) => c.row === 1).map((c) => c.id);
    expect(row1Ids).toEqual(['CH-00', 'CH-01', 'CH-02', 'CH-03', 'CH-04', 'CH-05']);

    // Row 2: CH-06 to CH-11
    const row2Ids = APEX_18_CHAMBERS.filter((c) => c.row === 2).map((c) => c.id);
    expect(row2Ids).toEqual(['CH-06', 'CH-07', 'CH-08', 'CH-09', 'CH-10', 'CH-11']);

    // Row 3: CH-12 to CH-17
    const row3Ids = APEX_18_CHAMBERS.filter((c) => c.row === 3).map((c) => c.id);
    expect(row3Ids).toEqual(['CH-12', 'CH-13', 'CH-14', 'CH-15', 'CH-16', 'CH-17']);
  });

  it('should verify Executive Slide Deck contains exactly 10 master slides with full metadata', () => {
    expect(SLIDES_DATA).toHaveLength(10);
    SLIDES_DATA.forEach((slide, idx) => {
      expect(slide.id).toBe(idx + 1);
      expect(slide.title).toBeTruthy();
      expect(slide.subtitle).toBeTruthy();
      expect(slide.bulletPoints.length).toBeGreaterThan(0);
      expect(slide.footerNote).toBeTruthy();
    });
  });

  it('should verify Judicial ETDA Tier contains exactly Gates 15 to 22 with ETDA and PDPA compliance', () => {
    expect(JUDICIAL_GATES_15_22).toHaveLength(8);

    const gateIds = JUDICIAL_GATES_15_22.map((g) => g.id);
    expect(gateIds).toEqual([
      'GATE-15',
      'GATE-16',
      'GATE-17',
      'GATE-18',
      'GATE-19',
      'GATE-20',
      'GATE-21',
      'GATE-22'
    ]);

    // Verify ETDA Sec 9, 26, 28 and PDPA Sec 37 are explicitly covered
    const sec9Gate = JUDICIAL_GATES_15_22.find((g) => g.id === 'GATE-16');
    const sec26Gate = JUDICIAL_GATES_15_22.find((g) => g.id === 'GATE-17');
    const sec28Gate = JUDICIAL_GATES_15_22.find((g) => g.id === 'GATE-18');
    const pdpaGate = JUDICIAL_GATES_15_22.find((g) => g.id === 'GATE-19');

    expect(sec9Gate?.thaiLawSection).toContain('มาตรา ๙');
    expect(sec26Gate?.thaiLawSection).toContain('มาตรา ๒๖');
    expect(sec28Gate?.thaiLawSection).toContain('มาตรา ๒๘');
    expect(pdpaGate?.thaiLawSection).toContain('มาตรา ๓๗');

    JUDICIAL_GATES_15_22.forEach((g) => {
      expect(g.status).toBe('PASSED');
      expect(g.courtAdmissibility).toBeTruthy();
    });
  });

  it('should verify Quantum Coherence Audit covers all 19 chambers with minimum 99.98% coherence', () => {
    expect(CHAMBERS_COHERENCE_DATA).toHaveLength(19);

    CHAMBERS_COHERENCE_DATA.forEach((ch) => {
      expect(ch.coherenceValue).toBeGreaterThanOrEqual(99.98);
      expect(ch.isolationMode).toBeTruthy();
      expect(ch.condition).toBeTruthy();
    });

    // Check CH-00, CH-01, CH-16 have 100.000%
    const ch00 = CHAMBERS_COHERENCE_DATA.find((c) => c.id === 'CH-00');
    const ch01 = CHAMBERS_COHERENCE_DATA.find((c) => c.id === 'CH-01');
    const ch16 = CHAMBERS_COHERENCE_DATA.find((c) => c.id === 'CH-16');
    const ch18 = CHAMBERS_COHERENCE_DATA.find((c) => c.id === 'CH-18');

    expect(ch00?.coherence).toBe('100.000%');
    expect(ch01?.coherence).toBe('100.000%');
    expect(ch16?.coherence).toBe('100.000%');
    expect(ch18?.name).toContain('Neural Sentinel');
  });

  it('should verify Certified Court Exhibits TH-01 to TH-04 and 10/10 Deca-Key Council attestation', () => {
    expect(COURT_EXHIBITS).toHaveLength(4);
    const exhibitIds = COURT_EXHIBITS.map((e) => e.id);
    expect(exhibitIds).toEqual(['EXHIBIT-TH-01', 'EXHIBIT-TH-02', 'EXHIBIT-TH-03', 'EXHIBIT-TH-04']);

    expect(DECA_KEY_SIGNERS).toHaveLength(10);
    const principal = DECA_KEY_SIGNERS.find((s) => s.id === '#EP-SOVEREIGN-01');
    expect(principal?.name).toBe('นายยุทธภูมิ พากเพียร');
    expect(principal?.role).toBe('Sovereign Principal Architect');
    expect(principal?.fingerprint).toBe('5a13396c129c611f15232fdaf54bfad00c4147abdbc3424cf691ef002144d18e');

    expect(REPLAY_12_STAGES).toHaveLength(12);
  });
});
