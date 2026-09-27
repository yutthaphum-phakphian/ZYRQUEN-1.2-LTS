// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SovereignGateways } from '../src/components/SovereignGateways';
import { SentinelRemediation } from '../src/components/SentinelRemediation';
import SovereignDashboard from '../src/pages/SovereignDashboard';
import { SecurityView } from '../src/components/views/SecurityView';
import { SOVEREIGN_CONFIG } from '../src/config/sovereign.config';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Sovereign runtime verification', () => {
  it('binds gateway identity and SSoT values to sovereign.config.ts', () => {
    render(<SovereignGateways />);

    expect(screen.getByText('Quantum Satellite Gateway')).toBeTruthy();
    expect(screen.getByText('Legal Smart Contract Gateway')).toBeTruthy();
    expect(screen.getByText('Cryo-Thermal Bus Gateway')).toBeTruthy();
    expect(screen.getAllByText('OPERATIONAL')).toHaveLength(3);
    expect(screen.getByText(`SSoT Δ${SOVEREIGN_CONFIG.baselineSystemDriftPercent.toFixed(2)}%`)).toBeTruthy();
    expect(screen.getByText(new RegExp(SOVEREIGN_CONFIG.genesisBlockHeight))).toBeTruthy();
    expect(screen.getByText(/99\.992% coherence/)).toBeTruthy();
    expect(screen.getByText(/14\.98 mK stability/)).toBeTruthy();
    expect(screen.getByText(new RegExp(SOVEREIGN_CONFIG.hardwareSecurityEnclave.status))).toBeTruthy();
  });

  it('transitions Sentinel from nominal monitoring to critical remediation', () => {
    vi.useFakeTimers();
    const onAlertLevelChange = vi.fn();

    render(<SentinelRemediation monitoringIntervalMs={1000} onAlertLevelChange={onAlertLevelChange} />);

    expect(screen.getByText('AUTO_REMEDIATED')).toBeTruthy();
    expect(screen.getByText(/Dilithium-5/)).toBeTruthy();
    expect(onAlertLevelChange).toHaveBeenCalledWith('NOMINAL');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getAllByText(/PATCH_APPLIED/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Risk:\s*0\.\d+/).length).toBeGreaterThan(0);
    expect(onAlertLevelChange).toHaveBeenLastCalledWith('CRITICAL');

    fireEvent.click(screen.getByRole('button', { name: 'SHIELD: ACTIVE' }));
  });

  it('propagates Sentinel critical state to all gateway cards on one dashboard', () => {
    vi.useFakeTimers();
    render(<SovereignDashboard />);

    expect(screen.getAllByText('OPERATIONAL')).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(screen.getAllByText('ALERT')).toHaveLength(3);
  });

  it('triggers a real-time high-severity toast notification in SecurityView whenever HSM Quorum health drops below 8/10 nodes', () => {
    const onAddSystemEvent = vi.fn();
    render(<SecurityView onAddSystemEvent={onAddSystemEvent} />);

    expect(screen.queryByTestId('hsm-quorum-high-severity-toast')).toBeNull();
    expect(screen.getByText(/QUORUM STATUS:\s*10\/10\s*VALID/i)).toBeTruthy();

    fireEvent.click(screen.getByText('HSM-NODE-01').closest('button')!);
    fireEvent.click(screen.getByText('HSM-NODE-02').closest('button')!);
    expect(screen.getByText(/QUORUM STATUS:\s*8\/10\s*VALID/i)).toBeTruthy();
    expect(screen.queryByTestId('hsm-quorum-high-severity-toast')).toBeNull();

    fireEvent.click(screen.getByText('HSM-NODE-03').closest('button')!);
    expect(screen.getByText(/QUORUM STATUS:\s*7\/10\s*DEGRADED/i)).toBeTruthy();

    const highSeverityToast = screen.getByTestId('hsm-quorum-high-severity-toast');
    expect(highSeverityToast).toBeTruthy();
    expect(highSeverityToast.getAttribute('data-severity')).toBe('HIGH');
    expect(highSeverityToast.textContent).toMatch(/HIGH SEVERITY ALERT/i);
    expect(highSeverityToast.textContent).toMatch(/7\/10/i);

    expect(onAddSystemEvent).toHaveBeenCalledWith(
      'HARDWARE',
      expect.stringMatching(/HIGH-SEVERITY ALERT: HSM Quorum Dropped Below 8\/10/i),
      expect.stringMatching(/HSM-NODE-01, HSM-NODE-02, HSM-NODE-03/i),
      '0x909ab814',
      'critical',
      expect.any(String),
      'security'
    );

    fireEvent.click(screen.getByTestId('btn-restore-hsm-quorum-toast'));
    expect(screen.getByText(/QUORUM STATUS:\s*10\/10\s*VALID/i)).toBeTruthy();
    expect(screen.queryByTestId('hsm-quorum-high-severity-toast')).toBeNull();
  });
});
