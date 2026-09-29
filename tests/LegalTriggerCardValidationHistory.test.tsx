import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LegalTriggerCard,
  getTriggerValidationHistory,
  classifyValidationEvent,
  getEventLatencyMs,
  isEventMatchingSearch,
  isEventInDateRange,
  type LegalTriggerItem,
} from '../src/components/LegalTriggerCard';
import { SystemEvent } from '../src/components/SystemEventsSidebar';

const mockTrigger: LegalTriggerItem = {
  id: 'etda-sec-09',
  act: 'ETDA B.E. 2544 / 2562',
  section: 'มาตรา ๙ (Section 9)',
  title: 'Electronic Signature Legal Enforceability',
  titleTh: 'การรับรองผลทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์',
  status: 'PASS',
  statusText: '100% ENFORCED',
  pqcScheme: 'FIPS 204 ML-DSA-87 (Dilithium-5)',
  anchor: 'Sovereign Principal #EP-SOVEREIGN-01',
  description: 'Binds undeniable cryptographic intent and signatory identity.',
  descriptionTh: 'ผูกมัดเจตนาและอัตลักษณ์ของผู้ลงนามด้วยลายมือชื่อโครงข่ายแลตทิซ',
  statuteClause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙',
};

const mockEvents: SystemEvent[] = [
  {
    id: 'evt-etda-09',
    type: 'COMPLIANCE',
    title: 'ETDA Sec 9 Non-Repudiation Invariant Attested',
    description: 'Signatory identity bound via FIPS 204 ML-DSA-87 to Passport #EP-SOVEREIGN-01. SLA latency: 0.11ms.',
    timestamp: '2026-09-29 05:02:15 ICT',
    metaHash: 'trigger:etda-sec-09:sig_leaf_909ab814',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๙',
    targetView: 'legal',
    severity: 'success',
    bindingStatus: 'VERIFIED',
    latencyMs: 0.11,
  },
  {
    id: 'evt-etda-09-fail',
    type: 'ANOMALY',
    title: 'มาตรา ๙ (Section 9) Simulated Drift Detected',
    description: 'Adversarial stress test triggered simulated key deviation on Electronic Signature.',
    timestamp: '2026-09-29 05:02:30 ICT',
    metaHash: 'trigger:etda-sec-09:fail_test_0x1234',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๙',
    targetView: 'legal',
    severity: 'critical',
    bindingStatus: 'ORPHANED',
    latencyMs: 0.38,
  },
  {
    id: 'evt-etda-09-high-latency',
    type: 'COMPLIANCE',
    title: 'ETDA Sec 9 Gateway Delay Event',
    description: 'Statutory verification completed with network jitter exceeding normal thresholds. Execution in 620ms.',
    timestamp: '2026-09-28 05:03:00 ICT',
    metaHash: 'trigger:etda-sec-09:delayed_ack',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๙',
    targetView: 'legal',
    severity: 'warning',
    latencyMs: 620.0,
  },
  {
    id: 'evt-etda-09-hard-fail',
    type: 'SECURITY',
    title: 'ETDA Sec 9 Signature Verification Failed',
    description: 'Cryptographic invariant verification failed due to invalid Merkle proof branch.',
    timestamp: '2026-09-29 05:03:30 ICT',
    metaHash: 'trigger:etda-sec-09:hard_fail_root',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๙',
    targetView: 'legal',
    severity: 'critical',
    latencyMs: 45.0,
  },
  {
    id: 'evt-other-section',
    type: 'COMPLIANCE',
    title: 'PDPA Sec 28 Cross-Border Sovereign Safeguard Active',
    description: 'Multi-mesh gateway verified destination adequacy standard.',
    timestamp: '2026-09-29 05:06:00 ICT',
    metaHash: 'trigger:pdpa-sec-28:boundary_enclave_node',
    statuteRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา ๒๘',
    targetView: 'legal',
    severity: 'success',
  },
];

describe('LegalTriggerCard Validation History & Enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly filters validation history events for the specific legal trigger', () => {
    const history = getTriggerValidationHistory(mockTrigger, mockEvents);
    expect(history.length).toBe(4);
    expect(history.map((e) => e.id)).toEqual([
      'evt-etda-09',
      'evt-etda-09-fail',
      'evt-etda-09-high-latency',
      'evt-etda-09-hard-fail',
    ]);
  });

  it('renders critical failures badge in header and navigates to filtered failed records on click', () => {
    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    // Critical failures badge should be present in header
    const criticalBadge = screen.getByTestId(`critical-failures-badge-${mockTrigger.id}`);
    expect(criticalBadge).toBeInTheDocument();
    expect(criticalBadge).toHaveTextContent(/1 Critical Failure/i);

    // Clicking it navigates to history tab and sets filter to FAILED
    fireEvent.click(criticalBadge);

    expect(screen.getByTestId(`validation-history-content-${mockTrigger.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`filter-select-${mockTrigger.id}`)).toHaveValue('FAILED');
    expect(screen.getByText('ETDA Sec 9 Signature Verification Failed')).toBeInTheDocument();
    expect(screen.queryByText('ETDA Sec 9 Non-Repudiation Invariant Attested')).not.toBeInTheDocument();
  });

  it('toggles sparkline chart between Success/Fail Trend and Latency Trend', () => {
    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    const passToggle = screen.getByTestId(`sparkline-toggle-pass-${mockTrigger.id}`);
    const latencyToggle = screen.getByTestId(`sparkline-toggle-latency-${mockTrigger.id}`);

    expect(passToggle).toBeInTheDocument();
    expect(latencyToggle).toBeInTheDocument();

    // Default is pass rate
    expect(screen.getByText(/% PASS/i)).toBeInTheDocument();

    // Switch to Latency Trend
    fireEvent.click(latencyToggle);
    expect(screen.getByText(/ms AVG/i)).toBeInTheDocument();

    // Switch back to Pass Rate Trend
    fireEvent.click(passToggle);
    expect(screen.getByText(/% PASS/i)).toBeInTheDocument();
  });

  it('opens export configuration modal and allows configuring date range and filter before export', () => {
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-csv-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    // Click Export CSV button to open modal
    const exportBtn = screen.getByTestId(`btn-export-csv-${mockTrigger.id}`);
    fireEvent.click(exportBtn);

    // Modal should be open
    expect(screen.getByTestId(`export-modal-${mockTrigger.id}`)).toBeInTheDocument();
    expect(screen.getByText('Export Validation History (CSV)')).toBeInTheDocument();

    // Check preview count
    const previewCount = screen.getByTestId(`modal-preview-count-${mockTrigger.id}`);
    expect(previewCount).toHaveTextContent('4 records');

    // Change filter in modal to VERIFIED PASS
    const modalFilterSelect = screen.getByTestId(`modal-filter-select-${mockTrigger.id}`);
    fireEvent.change(modalFilterSelect, { target: { value: 'VERIFIED PASS' } });
    expect(previewCount).toHaveTextContent('1 records');

    // Click Confirm Export in modal
    const confirmBtn = screen.getByTestId(`confirm-export-csv-${mockTrigger.id}`);
    fireEvent.click(confirmBtn);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId(`export-modal-${mockTrigger.id}`)).not.toBeInTheDocument();

    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('renders summary header showing total count, success rate, and average latency', () => {
    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    expect(screen.getByTestId(`validation-summary-${mockTrigger.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`summary-total-${mockTrigger.id}`)).toHaveTextContent('4');
    expect(screen.getByTestId(`summary-success-rate-${mockTrigger.id}`)).toHaveTextContent('25.0%');
    expect(screen.getByTestId(`summary-avg-latency-${mockTrigger.id}`)).toHaveTextContent('166.37ms');
  });

  it('renders Validation Health mini-summary card comparing VERIFIED PASS vs anomalies', () => {
    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    const healthCard = screen.getByTestId(`validation-health-card-${mockTrigger.id}`);
    expect(healthCard).toBeInTheDocument();
    expect(healthCard).toHaveTextContent(/Validation Health Index/i);
    expect(healthCard).toHaveTextContent(/VERIFIED PASS:\s*1\s*\(25\.0%\)/i);
    expect(healthCard).toHaveTextContent(/Anomalies & Fails:\s*3\s*\(75\.0%\)/i);

    // Change status filter to VERIFIED PASS
    const filterSelect = screen.getByTestId(`filter-select-${mockTrigger.id}`);
    fireEvent.change(filterSelect, { target: { value: 'VERIFIED PASS' } });

    // Now health card should show 100% pass for this filter
    expect(healthCard).toHaveTextContent(/VERIFIED PASS:\s*1\s*\(100\.0%\)/i);
  });

  it('toggles and displays Audit Trail Matrix visual component mapping statuses against ledger IDs', () => {
    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    const matrixToggleBtn = screen.getByTestId(`btn-toggle-audit-matrix-${mockTrigger.id}`);
    expect(matrixToggleBtn).toBeInTheDocument();

    // Matrix is closed by default
    expect(screen.queryByTestId(`audit-trail-matrix-${mockTrigger.id}`)).not.toBeInTheDocument();

    // Click to open matrix
    fireEvent.click(matrixToggleBtn);

    const matrix = screen.getByTestId(`audit-trail-matrix-${mockTrigger.id}`);
    expect(matrix).toBeInTheDocument();
    expect(matrix).toHaveTextContent(/Audit Trail Matrix/i);

    // Verify all 4 validation status rows exist
    expect(screen.getByTestId('audit-matrix-row-VERIFIED_PASS')).toBeInTheDocument();
    expect(screen.getByTestId('audit-matrix-row-FAILED')).toBeInTheDocument();
    expect(screen.getByTestId('audit-matrix-row-ISOLATED')).toBeInTheDocument();
    expect(screen.getByTestId('audit-matrix-row-WARNING')).toBeInTheDocument();

    // Verify mapping of latest event ID for FAILED
    const failedRow = screen.getByTestId('audit-matrix-row-FAILED');
    expect(failedRow).toHaveTextContent('evt-etda-09-hard-fail');

    // Click to close
    fireEvent.click(matrixToggleBtn);
    expect(screen.queryByTestId(`audit-trail-matrix-${mockTrigger.id}`)).not.toBeInTheDocument();
  });

  it('resets search bar, date range picker, and status filter when Clear Filters is clicked', () => {
    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    // Apply search query
    const searchInput = screen.getByTestId(`search-input-${mockTrigger.id}`);
    fireEvent.change(searchInput, { target: { value: 'Gateway Delay' } });
    expect(screen.getByText('ETDA Sec 9 Gateway Delay Event')).toBeInTheDocument();
    expect(screen.queryByText('ETDA Sec 9 Non-Repudiation Invariant Attested')).not.toBeInTheDocument();

    // Apply date range
    const dateStart = screen.getByTestId(`date-start-${mockTrigger.id}`);
    fireEvent.change(dateStart, { target: { value: '2026-09-28' } });

    // Apply status filter
    const filterSelect = screen.getByTestId(`filter-select-${mockTrigger.id}`);
    fireEvent.change(filterSelect, { target: { value: 'WARNING' } });

    // Click Clear Filters
    const clearBtn = screen.getByTestId(`btn-clear-filters-${mockTrigger.id}`);
    expect(clearBtn).not.toBeDisabled();
    fireEvent.click(clearBtn);

    // Verify all fields are reset
    expect(searchInput).toHaveValue('');
    expect(dateStart).toHaveValue('');
    expect(filterSelect).toHaveValue('ALL');

    // All records should be visible again
    expect(screen.getByText('ETDA Sec 9 Non-Repudiation Invariant Attested')).toBeInTheDocument();
    expect(screen.getByText('ETDA Sec 9 Gateway Delay Event')).toBeInTheDocument();
    expect(screen.getByText('ETDA Sec 9 Signature Verification Failed')).toBeInTheDocument();
  });

  it('sorts validation history records by status, latency, and timestamp', () => {
    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    // Sort by Latency
    const latencySortBtn = screen.getByTestId(`sort-header-latency-${mockTrigger.id}`);
    fireEvent.click(latencySortBtn); // asc sort: lowest latency first

    const rowsAfterAsc = screen.getAllByTestId(new RegExp(`validation-item-${mockTrigger.id}`));
    expect(rowsAfterAsc.length).toBe(4);
    // The first item should be 0.11ms (evt-etda-09)
    expect(rowsAfterAsc[0]).toHaveTextContent('0.11ms');

    // Click again to toggle latency desc (highest latency first)
    fireEvent.click(latencySortBtn);
    const rowsAfterDesc = screen.getAllByTestId(new RegExp(`validation-item-${mockTrigger.id}`));
    // The first item should be 620ms (evt-etda-09-high-latency)
    expect(rowsAfterDesc[0]).toHaveTextContent('620ms');

    // Sort by Status
    const statusSortBtn = screen.getByTestId(`sort-header-status-${mockTrigger.id}`);
    fireEvent.click(statusSortBtn);
    expect(screen.getByTestId(`sort-header-status-${mockTrigger.id}`)).toBeInTheDocument();

    // Sort by Timestamp
    const timeSortBtn = screen.getByTestId(`sort-header-timestamp-${mockTrigger.id}`);
    fireEvent.click(timeSortBtn);
    expect(screen.getByTestId(`sort-header-timestamp-${mockTrigger.id}`)).toBeInTheDocument();
  });

  it('triggers onRefreshEvents callback when Refresh button is clicked', () => {
    const mockOnRefresh = vi.fn();

    render(
      <LegalTriggerCard
        trigger={mockTrigger}
        pqcHash="0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4"
        copiedHashId={null}
        onCopyHash={vi.fn()}
        systemEvents={mockEvents}
        onRefreshEvents={mockOnRefresh}
      />
    );

    fireEvent.click(screen.getByTestId(`tab-validation-history-${mockTrigger.id}`));

    const refreshBtn = screen.getByTestId(`btn-refresh-history-${mockTrigger.id}`);
    expect(refreshBtn).toBeInTheDocument();

    fireEvent.click(refreshBtn);
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
});
