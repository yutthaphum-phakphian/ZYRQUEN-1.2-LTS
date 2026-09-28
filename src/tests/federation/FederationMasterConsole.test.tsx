/**
 * FederationMasterConsole Integration & Registration Test Suite
 * Verifies that all 7 defense modules and WebSocket stream are properly registered and rendering.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FederationMasterConsole, FEDERATION_MODULES } from '../../views/federation/FederationMasterConsole';

// Mock MockWebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1;

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 10);
  }

  send() {}
  close() {}
}

describe('FederationMasterConsole Component Suite', () => {
  beforeEach(() => {
    // @ts-ignore
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the console header, title and WebSocket connection status badge', () => {
    render(<FederationMasterConsole />);
    const consoleEl = screen.getByTestId('federation-master-console');
    expect(consoleEl).toBeTruthy();
    expect(screen.getByTestId('console-title').textContent).toContain('Federation Evolution Master Console');
    expect(screen.getByTestId('ws-status')).toBeTruthy();
  });

  it('correctly registers and renders all 7 federation modules in the grid', () => {
    render(<FederationMasterConsole />);
    expect(screen.getByTestId('modules-grid')).toBeTruthy();

    FEDERATION_MODULES.forEach((mod) => {
      const moduleElement = screen.getByTestId(mod.id);
      expect(moduleElement).toBeTruthy();
      expect(moduleElement.textContent).toContain(mod.title);
    });
  });

  it('renders the 3D Defense Panorama section and the Unified Log Stream with initial events', () => {
    render(<FederationMasterConsole />);
    expect(screen.getByTestId('defense-panorama-section')).toBeTruthy();
    expect(screen.getByTestId('unified-log-stream')).toBeTruthy();
    expect(screen.getByTestId('logs-container')).toBeTruthy();

    // Verify initial log messages are present
    expect(screen.getByText(/Federation Master Console initialized/i)).toBeTruthy();
    expect(screen.getByText(/Quantum timestamp drift compensated/i)).toBeTruthy();
  });
});
