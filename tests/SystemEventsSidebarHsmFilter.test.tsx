import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SystemEventsSidebar,
  SystemEvent,
  isHsmNodeHardwareEvent,
} from '../src/components/SystemEventsSidebar';

describe('SystemEventsSidebar Dedicated HSM Hardware State Filter', () => {
  const mockEvents: SystemEvent[] = [
    {
      id: 'evt-compliance-1',
      type: 'COMPLIANCE',
      title: 'Thai Electronic Transactions Act Sec 28 Seal',
      description: 'Court admissibility check verified for statutory submission.',
      timestamp: '06:00:00 ICT',
      statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๒๘',
      severity: 'success',
      bindingStatus: 'VERIFIED',
    },
    {
      id: 'evt-pdpa-consent',
      type: 'COMPLIANCE',
      title: 'PDPA Section 9 Lawful Processing Validation',
      description: 'Zero drift compliance verified under privacy safeguard.',
      timestamp: '06:02:00 ICT',
      statuteRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา ๙',
      severity: 'success',
      bindingStatus: 'VERIFIED',
    },
    {
      id: 'evt-hsm-node-offline',
      type: 'HARDWARE',
      title: 'HSM Node Offline: TC-08 (Theta)',
      description: 'Hardware node went offline. Active Quorum: 9/10 (Degraded).',
      timestamp: '06:05:00 ICT',
      statuteRef: 'FIPS 140-3 Level 4 Hardware Security',
      metaHash: 'hsm:node_offline_event_8',
      severity: 'warning',
      bindingStatus: 'ORPHANED',
    },
    {
      id: 'evt-hsm-node-restored',
      type: 'HARDWARE',
      title: 'HSM Deca-Node TC-01 (Alpha) Online & Calibrated',
      description: 'Hardware cryptographic coprocessor TC-01 reached sub-Kelvin base temperature 14.98 mK.',
      timestamp: '06:10:00 ICT',
      statuteRef: 'FIPS 140-3 L4 Physical Cryptographic Module Security',
      metaHash: 'hsm:node_state:tc01_online',
      severity: 'success',
      bindingStatus: 'VERIFIED',
    },
    {
      id: 'evt-hsm-quorum-state',
      type: 'HARDWARE',
      title: 'HSM Cluster Hardware Quorum: 10/10 Nodes Operational',
      description: 'Unanimous hardware state confirmed across all 10 physical HSM modules.',
      timestamp: '06:15:00 ICT',
      statuteRef: 'FIPS 140-3 L4 Hardware Custody & Quorum Invariant',
      metaHash: 'hsm:quorum_state:10_10_ratified',
      severity: 'success',
      bindingStatus: 'VERIFIED',
    },
  ];

  it('correctly categorizes HSM node hardware state changes independently from compliance events', () => {
    // Check helper logic
    expect(isHsmNodeHardwareEvent(mockEvents[0])).toBe(false); // Compliance
    expect(isHsmNodeHardwareEvent(mockEvents[1])).toBe(false); // Compliance
    expect(isHsmNodeHardwareEvent(mockEvents[2])).toBe(true);  // HSM Node Offline
    expect(isHsmNodeHardwareEvent(mockEvents[3])).toBe(true);  // HSM Deca-Node TC-01 Online
    expect(isHsmNodeHardwareEvent(mockEvents[4])).toBe(true);  // HSM Cluster Hardware Quorum
  });

  it('renders dedicated HSM hardware state toggle and filters only HSM hardware events when toggled', () => {
    render(
      <SystemEventsSidebar
        isOpen={true}
        onClose={vi.fn()}
        events={mockEvents}
        onClearEvents={vi.fn()}
      />
    );

    // Initial state: All categories rendered
    expect(screen.getByText('Thai Electronic Transactions Act Sec 28 Seal')).toBeInTheDocument();
    expect(screen.getByText('HSM Node Offline: TC-08 (Theta)')).toBeInTheDocument();

    // Find dedicated HSM Hardware Filter toggle button
    const toggleButton = document.getElementById('btn-toggle-hsm-hardware-filter');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent(/FILTER OFF/i);

    // Click to activate dedicated HSM Hardware Filter
    fireEvent.click(toggleButton!);
    expect(toggleButton).toHaveTextContent(/FILTER ON/i);

    // Verify HSM node hardware events are visible
    expect(screen.getByText('HSM Node Offline: TC-08 (Theta)')).toBeInTheDocument();
    expect(screen.getByText('HSM Deca-Node TC-01 (Alpha) Online & Calibrated')).toBeInTheDocument();
    expect(screen.getByText('HSM Cluster Hardware Quorum: 10/10 Nodes Operational')).toBeInTheDocument();

    // Verify compliance events are NOT visible (filtered out independently)
    expect(screen.queryByText('Thai Electronic Transactions Act Sec 28 Seal')).not.toBeInTheDocument();
    expect(screen.queryByText('PDPA Section 9 Lawful Processing Validation')).not.toBeInTheDocument();

    // Click toggle again to turn filter off (revert to ALL)
    fireEvent.click(toggleButton!);
    expect(toggleButton).toHaveTextContent(/FILTER OFF/i);
    expect(screen.getByText('Thai Electronic Transactions Act Sec 28 Seal')).toBeInTheDocument();
  });

  it('allows selecting HSM Node Hardware States from the category dropdown', () => {
    render(
      <SystemEventsSidebar
        isOpen={true}
        onClose={vi.fn()}
        events={mockEvents}
        onClearEvents={vi.fn()}
      />
    );

    const select = document.getElementById('system-event-filter-select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // Select HSM_HARDWARE
    fireEvent.change(select, { target: { value: 'HSM_HARDWARE' } });

    // Verify only HSM node hardware events are displayed
    expect(screen.getByText('HSM Node Offline: TC-08 (Theta)')).toBeInTheDocument();
    expect(screen.queryByText('Thai Electronic Transactions Act Sec 28 Seal')).not.toBeInTheDocument();
  });
});
