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

  it('triggers a real-time high-severity toast notification, crimson glow pulse, gauge chart update, and auto-heal Reconnect Nodes in SecurityView when HSM Quorum drops below 8/10', () => {
    const onAddSystemEvent = vi.fn();
    render(<SecurityView onAddSystemEvent={onAddSystemEvent} />);

    const securityContainer = screen.getByTestId('security-view-container');
    expect(securityContainer.getAttribute('data-quorum-pulse')).toBe('nominal');
    expect(securityContainer.className).not.toContain('security-view-crimson-pulse');

    expect(screen.queryByTestId('hsm-quorum-high-severity-toast')).toBeNull();
    expect(screen.getByText(/QUORUM STATUS:\s*10\/10\s*VALID/i)).toBeTruthy();
    expect(screen.getByTestId('hsm-quorum-health-gauge')).toBeTruthy();
    expect(screen.getByTestId('hsm-quorum-gauge-percentage').textContent).toBe('100%');
    expect(screen.getByTestId('hsm-quorum-node-uptime').textContent).toContain('100.0% (10/10 Active)');
    expect(screen.getByTestId('hsm-quorum-operational-status').textContent).toContain('OPTIMAL');

    fireEvent.click(screen.getByText('HSM-NODE-01').closest('button')!);
    fireEvent.click(screen.getByText('HSM-NODE-02').closest('button')!);
    expect(screen.getByText(/QUORUM STATUS:\s*8\/10\s*VALID/i)).toBeTruthy();
    expect(screen.getByTestId('hsm-quorum-gauge-percentage').textContent).toBe('80%');
    expect(screen.getByTestId('hsm-quorum-node-uptime').textContent).toContain('80.0% (8/10 Active)');
    expect(screen.queryByTestId('hsm-quorum-high-severity-toast')).toBeNull();
    expect(securityContainer.getAttribute('data-quorum-pulse')).toBe('nominal');

    fireEvent.click(screen.getByText('HSM-NODE-03').closest('button')!);
    expect(screen.getByText(/QUORUM STATUS:\s*7\/10\s*DEGRADED/i)).toBeTruthy();
    expect(screen.getByTestId('hsm-quorum-gauge-percentage').textContent).toBe('70%');
    expect(screen.getByTestId('hsm-quorum-node-uptime').textContent).toContain('70.0% (7/10 Active)');
    expect(screen.getByTestId('hsm-quorum-operational-status').textContent).toContain('DEGRADED');

    // Verify subtle crimson glow pulse animation on Security view container when < 8/10
    expect(securityContainer.getAttribute('data-quorum-pulse')).toBe('crimson-glow');
    expect(securityContainer.className).toContain('security-view-crimson-pulse');

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

    // Click 'Reconnect Nodes' auto-heal button to reset HSM Quorum nodes to 10/10 health
    const reconnectBtn = screen.getByRole('button', { name: /Reconnect Nodes/i });
    fireEvent.click(reconnectBtn);

    expect(screen.getByText(/QUORUM STATUS:\s*10\/10\s*VALID/i)).toBeTruthy();
    expect(screen.getByTestId('hsm-quorum-gauge-percentage').textContent).toBe('100%');
    expect(screen.getByTestId('hsm-quorum-node-uptime').textContent).toContain('100.0% (10/10 Active)');
    expect(screen.getByTestId('hsm-quorum-operational-status').textContent).toContain('OPTIMAL');
    expect(screen.getByTestId('hsm-auto-heal-status').textContent).toMatch(/10\/10 HSM Quorum Nodes Reconnected/i);
    expect(screen.queryByTestId('hsm-quorum-high-severity-toast')).toBeNull();
    expect(securityContainer.getAttribute('data-quorum-pulse')).toBe('nominal');
    expect(securityContainer.className).not.toContain('security-view-crimson-pulse');
  });
});
