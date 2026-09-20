import { describe, it, expect, vi } from 'vitest';
import { GovernanceServiceAdapter, GovernanceDossier } from '../src/services/governanceServiceAdapter';

/**
 * ZYRQUEN Ω∞ Sovereign Kernel v1.2 LTS
 * Unit & Integration Test Suite: Court Evidence Dossier Generator
 * Target: court-evidence-dossier-generator.test.ts
 * Status: SSoT Δ0 (Zero Drift 0.00%) | Block #849202 Anchor
 */

describe('Court Evidence Dossier Generator Test Suite (court-evidence-dossier-generator)', () => {
  const CANONICAL_BLOCK = 849202;
  const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';

  it('1. Should generate a valid Court Evidence Dossier payload adhering to SSoT invariants', () => {
    const dossier: GovernanceDossier = GovernanceServiceAdapter.generateDossier(CANONICAL_BLOCK);

    expect(dossier).toBeDefined();
    expect(dossier.dossierId).toMatch(/^DOS-SOV-849202-\d{6}$/);
    expect(dossier.blockHeight).toBe(CANONICAL_BLOCK);
    expect(dossier.merkleRoot).toBe(CANONICAL_MERKLE_ROOT);
    expect(dossier.quorumStatus).toBe('10/10 REAL_HSM RATIFIED');
    expect(dossier.pqcAlgorithm).toContain('Dilithium-5');
    expect(dossier.complianceRef).toContain('พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544');
    expect(dossier.sealsVerified).toBe(14902);
    expect(dossier.zeroDrift).toBe('SSoT Δ0 (Zero Drift 0.00%)');
  });

  it('2. Should compute deterministic SHA-256 Canonical Payload Hash (Digest)', async () => {
    const mockPayload = {
      dossierId: 'DOS-SOV-849202-123456',
      blockHeight: CANONICAL_BLOCK,
      merkleRoot: CANONICAL_MERKLE_ROOT,
      sealsVerified: 14902,
    };

    const hash = await GovernanceServiceAdapter.canonicalPayloadHash(mockPayload);
    
    expect(hash).toBeDefined();
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    
    // Hash determinism check
    const hashRepeat = await GovernanceServiceAdapter.canonicalPayloadHash(mockPayload);
    expect(hash).toBe(hashRepeat);
  });

  it('3. Should trigger exportDossierAsFile without DOM or memory leaks (React 19 Safe)', () => {
    const mockDossier: GovernanceDossier = GovernanceServiceAdapter.generateDossier(CANONICAL_BLOCK);

    // Mock DOM elements & Blob/URL APIs
    const mockAppendChild = vi.spyOn(document.body, 'appendChild');
    const mockClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-url');
    const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    GovernanceServiceAdapter.exportDossierAsFile(mockDossier, 'ZYRQUEN_COURT_EVIDENCE_TEST.json');

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();

    // Fast-forward timer to verify React 19 safe cleanup (150ms timeout)
    vi.useFakeTimers();
    vi.advanceTimersByTime(200);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-url');
    vi.useRealTimers();
  });

  it('4. Should verify statutory Thai ETA Sections 9, 26, 28 compliance tags', () => {
    const dossier = GovernanceServiceAdapter.generateDossier();
    
    expect(dossier.complianceRef).toContain('มาตรา 9');
    expect(dossier.complianceRef).toContain('26');
    expect(dossier.complianceRef).toContain('28');
  });
});
