import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HsmClusterHealthGauge } from '../src/components/HsmClusterHealthGauge';
import { hsmClusterService } from '../src/services/hsmClusterService';

describe('HsmClusterHealthGauge Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hsmClusterService.reset();
  });

  it('renders aggregate quorum health 100% with healthy tier label and real hardware telemetry badge', () => {
    render(<HsmClusterHealthGauge />);

    // Health Score 100%
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    expect(screen.getByText('10/10 โหนด')).toBeInTheDocument();
    expect(screen.getAllByText(/องค์ประชุมแข็งแรง/i).length).toBeGreaterThan(0);

    // Telemetry source origin
    expect(screen.getByText(/แหล่งข้อมูล: ฮาร์ดแวร์จริง/i)).toBeInTheDocument();

    // 80% legal threshold label
    expect(screen.getByText(/80% เกณฑ์ขั้นต่ำ/i)).toBeInTheDocument();
  });

  it('allows selecting individual nodes and reveals deep forensic properties', () => {
    render(<HsmClusterHealthGauge />);

    // Click on HSM-NODE-03
    const node3Btn = screen.getByText('HSM-NODE-03');
    expect(node3Btn).toBeInTheDocument();
    fireEvent.click(node3Btn);

    // Deep inspector should show forensic details for HSM-NODE-03
    expect(screen.getAllByText(/HSM-NODE-03/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Forensic SHA-256 Digest/i)).toBeInTheDocument();
    expect(screen.getByText(/คัดลอกแฮช/i)).toBeInTheDocument();
  });

  it('handles simulated stress scenario (7/10 breach) and toggles telemetry origin badge to SIMULATED', async () => {
    render(<HsmClusterHealthGauge />);

    // Click simulate 7/10 breach
    const breachBtn = screen.getByText(/จำลอง 7\/10/i);
    expect(breachBtn).toBeInTheDocument();
    fireEvent.click(breachBtn);

    // Score should reflect 70% and critical breach alert
    await waitFor(() => {
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('7/10 โหนด')).toBeInTheDocument();
      expect(screen.getAllByText(/วิกฤต — องค์ประชุมไม่ครบ/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/โหมดทดสอบสถานการณ์/i)).toBeInTheDocument();
    });

    // Phoenix recovery button should appear
    const healBtn = screen.getByText(/Phoenix Recovery/i);
    expect(healBtn).toBeInTheDocument();
  });

  it('executes Phoenix Recovery restoring 10/10 100% quorum back to real hardware state', async () => {
    render(<HsmClusterHealthGauge />);

    // Trigger breach first
    const breachBtn = screen.getByText(/จำลอง 7\/10/i);
    fireEvent.click(breachBtn);

    await waitFor(() => {
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    // Trigger Phoenix Recovery
    const healBtn = screen.getByText(/Phoenix Recovery/i);
    fireEvent.click(healBtn);

    // Should return to 100% and real hardware telemetry
    await waitFor(
      () => {
        expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
        expect(screen.getByText('10/10 โหนด')).toBeInTheDocument();
        expect(screen.getAllByText(/องค์ประชุมแข็งแรง/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/แหล่งข้อมูล: ฮาร์ดแวร์จริง/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });
});
