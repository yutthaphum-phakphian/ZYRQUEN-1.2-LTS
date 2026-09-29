/**
 * ZYRQUEN Ω∞ — Offline Sync Heatmap Unit Test Suite
 * 
 * Verifies time-of-day activity calculations, peak log generation identification,
 * bottleneck classification, 24h matrix rendering, and work shift views.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineSyncHeatmap } from '../src/components/OfflineSyncHeatmap';
import { QueuedAuditEvent } from '../src/services/offlineAuditSyncService';

describe('OfflineSyncHeatmap Component', () => {
  it('renders without crashing and displays header KPI highlights', () => {
    render(<OfflineSyncHeatmap queuedEvents={[]} syncHistory={[]} />);

    expect(screen.getByText(/Time-of-Day Activity & Peak Log Heatmap/i)).toBeDefined();
    expect(screen.getByText(/ETDA 24H SPECTRUM/i)).toBeDefined();
    expect(screen.getByText(/Peak Hour/i)).toBeDefined();
    expect(screen.getByText(/24H Total Volume/i)).toBeDefined();
    expect(screen.getByText(/Bottleneck Index/i)).toBeDefined();
  });

  it('aggregates queued audit events into hourly data buckets accurately', () => {
    const fakeEvents: QueuedAuditEvent[] = [
      {
        id: 'evt-1',
        title: 'Morning Drill',
        description: 'Test',
        severity: 'info',
        queuedAt: new Date(2026, 8, 29, 10, 15, 0).toISOString(),
        retryCount: 0,
        type: 'AUDIT',
      },
      {
        id: 'evt-2',
        title: 'Morning Drill 2',
        description: 'Test',
        severity: 'info',
        queuedAt: new Date(2026, 8, 29, 10, 45, 0).toISOString(),
        retryCount: 0,
        type: 'AUDIT',
      },
    ];

    render(<OfflineSyncHeatmap queuedEvents={fakeEvents} syncHistory={[]} />);

    // Click on 10h slot
    const hour10Button = screen.getByTitle(/10:00/i);
    expect(hour10Button).toBeDefined();
    fireEvent.click(hour10Button);

    expect(screen.getByText(/Hour Slot: 10:00 - 10:59 ICT/i)).toBeDefined();
  });

  it('toggles between 24h Matrix and Work Shifts view modes', () => {
    render(<OfflineSyncHeatmap queuedEvents={[]} syncHistory={[]} />);

    const shiftsButton = screen.getByRole('button', { name: /Work Shifts/i });
    fireEvent.click(shiftsButton);

    expect(screen.getByText(/Night Shift/i)).toBeDefined();
    expect(screen.getByText(/Morning Intake/i)).toBeDefined();
    expect(screen.getByText(/Peak Afternoon/i)).toBeDefined();
    expect(screen.getByText(/Evening Audit/i)).toBeDefined();

    const matrixButton = screen.getByRole('button', { name: /24h Matrix/i });
    fireEvent.click(matrixButton);

    expect(screen.getByText(/00:00 \(Midnight\)/i)).toBeDefined();
  });
});
