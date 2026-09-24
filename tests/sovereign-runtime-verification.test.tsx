// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SovereignGateways } from '../src/components/SovereignGateways';
import { SentinelRemediation } from '../src/components/SentinelRemediation';
import SovereignDashboard from '../src/pages/SovereignDashboard';
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
    expect(screen.getByText(/Dilithium-5 \(FIPS 204\)/)).toBeTruthy();
    expect(onAlertLevelChange).toHaveBeenCalledWith('NOMINAL');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/PATCH_APPLIED/)).toBeTruthy();
    expect(screen.getByText(/Risk: 0\.9/)).toBeTruthy();
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
});
