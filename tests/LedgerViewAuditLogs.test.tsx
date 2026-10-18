import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LedgerView, DEFAULT_AUDIT_LOG_EVENTS } from '../src/components/views/LedgerView';
import { SystemEvent } from '../src/components/SystemEventsSidebar';

describe('LedgerView Audit Logs Search and Hover Tooltip', () => {
  const mockEvents: SystemEvent[] = [
    {
      id: 'test-evt-1',
      type: 'COMPLIANCE',
      title: 'Thai Electronic Transactions Act Sec 26 Seal',
      description: 'Full Raw Attestation Description: Key-pair verified by deca-key HSM cluster.',
      timestamp: '06:00:00 ICT',
      statuteRef: 'มาตรา 26: ลายมือชื่อดิจิทัลที่เชื่อถือได้',
      metaHash: 'sha256:abcd1234ef5678',
      traceId: 'TRC-TEST-TRACE-999',
      severity: 'success',
      bindingStatus: 'VERIFIED',
    },
    {
      id: 'test-evt-2',
      type: 'HARDWARE',
      title: 'Sub-Kelvin Thermal Integrity Verification',
      description: 'Full Raw Description: Dilution refrigerator steady at 14.98 mK without drift.',
      timestamp: '06:05:00 ICT',
      statuteRef: 'FIPS 140-3 L4 Hardware Custody',
      metaHash: 'cryo:sensor:temp_1498mk',
      traceId: 'TRC-CRYO-INTEG-002',
      severity: 'info',
      bindingStatus: 'ANCHORED',
    },
    {
      id: 'test-evt-3',
      type: 'CRYPTO',
      title: 'Post-Quantum ML-DSA-87 State Anchor',
      description: 'Full Raw Description: NIST FIPS 204 signature created and verified in enclave.',
      timestamp: '06:10:00 ICT',
      statuteRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา ๒๖',
      metaHash: 'pqc:mldsa87:sig_matrix_hex',
      traceId: 'TRC-PQC-MLDSA-003',
      severity: 'success',
      bindingStatus: 'VERIFIED',
    },
  ];

  it('navigates to audit logs tab and displays audit events', () => {
    render(<LedgerView events={mockEvents} />);
    
    // Switch to audit logs tab
    const auditTabBtn = screen.getByTestId ? document.getElementById('ledger-tab-audit-logs-btn') : null;
    expect(auditTabBtn).toBeTruthy();
    if (auditTabBtn) {
      fireEvent.click(auditTabBtn);
    }

    // Verify search input is present
    const searchInput = screen.getByPlaceholderText(/Search audit logs by title, statuteRef, or metaHash/i);
    expect(searchInput).toBeInTheDocument();

    // Verify event titles are rendered
    expect(screen.getByText('Thai Electronic Transactions Act Sec 26 Seal')).toBeInTheDocument();
    expect(screen.getByText('Sub-Kelvin Thermal Integrity Verification')).toBeInTheDocument();
    expect(screen.getByText('Post-Quantum ML-DSA-87 State Anchor')).toBeInTheDocument();
  });

  it('uses default audit logs when events are missing', () => {
    render(<LedgerView />);
    const auditTabBtn = document.getElementById('ledger-tab-audit-logs-btn');
    if (auditTabBtn) fireEvent.click(auditTabBtn);

    expect(screen.getByText('Evidence Ingested: TNT-TH-001 (Tenant Manifest)')).toBeInTheDocument();
  });

  it('filters audit logs by title using the search bar', () => {
    render(<LedgerView events={mockEvents} />);
    const auditTabBtn = document.getElementById('ledger-tab-audit-logs-btn');
    if (auditTabBtn) fireEvent.click(auditTabBtn);

    const searchInput = screen.getByPlaceholderText(/Search audit logs by title, statuteRef, or metaHash/i);
    fireEvent.change(searchInput, { target: { value: 'Thermal' } });

    expect(screen.getByText('Sub-Kelvin Thermal Integrity Verification')).toBeInTheDocument();
    expect(screen.queryByText('Thai Electronic Transactions Act Sec 26 Seal')).not.toBeInTheDocument();
    expect(screen.queryByText('Post-Quantum ML-DSA-87 State Anchor')).not.toBeInTheDocument();
  });

  it('filters audit logs by statuteRef using the search bar', () => {
    render(<LedgerView events={mockEvents} />);
    const auditTabBtn = document.getElementById('ledger-tab-audit-logs-btn');
    if (auditTabBtn) fireEvent.click(auditTabBtn);

    const searchInput = screen.getByPlaceholderText(/Search audit logs by title, statuteRef, or metaHash/i);
    fireEvent.change(searchInput, { target: { value: 'มาตรา 26' } });

    expect(screen.getByText('Thai Electronic Transactions Act Sec 26 Seal')).toBeInTheDocument();
    expect(screen.queryByText('Sub-Kelvin Thermal Integrity Verification')).not.toBeInTheDocument();
  });

  it('filters audit logs by metaHash using the search bar', () => {
    render(<LedgerView events={mockEvents} />);
    const auditTabBtn = document.getElementById('ledger-tab-audit-logs-btn');
    if (auditTabBtn) fireEvent.click(auditTabBtn);

    const searchInput = screen.getByPlaceholderText(/Search audit logs by title, statuteRef, or metaHash/i);
    fireEvent.change(searchInput, { target: { value: 'cryo:sensor' } });

    expect(screen.getByText('Sub-Kelvin Thermal Integrity Verification')).toBeInTheDocument();
    expect(screen.queryByText('Thai Electronic Transactions Act Sec 26 Seal')).not.toBeInTheDocument();
  });

  it('displays hover tooltip with full raw description and traceId when hovering over an audit log entry', () => {
    render(<LedgerView events={mockEvents} />);
    const auditTabBtn = document.getElementById('ledger-tab-audit-logs-btn');
    if (auditTabBtn) fireEvent.click(auditTabBtn);

    const entryCard = screen.getByTestId('audit-log-entry-test-evt-1');
    expect(entryCard).toBeInTheDocument();

    // Trigger hover
    fireEvent.mouseEnter(entryCard);

    // Verify hover tooltip displays the traceId and full raw description
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('TRC-TEST-TRACE-999');
    expect(tooltip).toHaveTextContent('Full Raw Attestation Description: Key-pair verified by deca-key HSM cluster.');

    // Mouse leave removes tooltip
    fireEvent.mouseLeave(entryCard);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
