import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ForensicAuditMasterDossierModal } from '../src/components/forensics/ForensicAuditMasterDossierModal';
import { FORENSIC_DOSSIER_V9 } from '../src/data/forensicAuditMasterDossierData';

describe('ForensicAuditMasterDossierModal Event Type Filter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders modal with initial audit-trail tab and filters events', () => {
    render(
      <ForensicAuditMasterDossierModal
        isOpen={true}
        onClose={vi.fn()}
        initialTab="audit-trail"
      />
    );

    // Initial state: ALL EVENTS
    const filterSelect = screen.getByLabelText(/Event Filter:/i) as HTMLSelectElement;
    expect(filterSelect).toBeTruthy();
    expect(filterSelect.value).toBe('ALL');

    // Filter to VERIFIED
    fireEvent.change(filterSelect, { target: { value: 'VERIFIED' } });
    expect(filterSelect.value).toBe('VERIFIED');
    expect(screen.getAllByText('VERIFIED').length).toBeGreaterThan(0);

    // Filter to PENDING
    fireEvent.change(filterSelect, { target: { value: 'PENDING' } });
    expect(filterSelect.value).toBe('PENDING');
    expect(screen.getAllByText('PENDING').length).toBeGreaterThan(0);

    // Filter to ORPHANED
    fireEvent.change(filterSelect, { target: { value: 'ORPHANED' } });
    expect(filterSelect.value).toBe('ORPHANED');
    expect(screen.getAllByText('ORPHANED').length).toBeGreaterThan(0);

    // Switch back to ALL
    fireEvent.change(filterSelect, { target: { value: 'ALL' } });
    expect(filterSelect.value).toBe('ALL');
  });

  it('toggles filter using quick segment buttons', () => {
    render(
      <ForensicAuditMasterDossierModal
        isOpen={true}
        onClose={vi.fn()}
        initialTab="audit-trail"
      />
    );

    // Click Verified button in desktop bar
    const verifiedBtn = screen.getByRole('button', { name: /Verified \(/i });
    fireEvent.click(verifiedBtn);
    expect(screen.getAllByText('VERIFIED').length).toBeGreaterThan(0);

    // Click Orphaned button
    const orphanedBtn = screen.getByRole('button', { name: /Orphaned \(/i });
    fireEvent.click(orphanedBtn);
    expect(screen.getAllByText('ORPHANED').length).toBeGreaterThan(0);
  });
});
