import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
vi.mock('../src/components/ActiveEntropyRateMonitor', () => ({
  ActiveEntropyRateMonitor: () => null,
}));

import { CouncilView } from '../src/components/views/CouncilView';
import {
  HsmNodeStatusTooltip,
  HsmNodeStatusIcon,
  getNodeMetrics,
} from '../src/components/council/HsmNodeStatusTooltip';
import { COUNCIL_MEMBERS } from '../src/data/councilData';

describe('CouncilView HSM Node Status Tooltip Suite', () => {
  it('correctly calculates and formats last recorded temperature and latency metrics for each node', () => {
    COUNCIL_MEMBERS.forEach((member) => {
      const metrics = getNodeMetrics(member);
      expect(metrics.temp).toMatch(/mK$/);
      expect(metrics.latency).toMatch(/ms$/);
      expect(metrics.subKelvinTempMk).toBeGreaterThan(0);
      expect(metrics.latencyMs).toBeGreaterThan(0);
    });

    // Test resolution by slotId and council code string
    const node1Metrics = getNodeMetrics(1);
    expect(node1Metrics.temp).toBeDefined();
    expect(node1Metrics.latency).toBeDefined();

    const node2Metrics = getNodeMetrics('TC-02');
    expect(node2Metrics.temp).toBeDefined();
    expect(node2Metrics.latency).toBeDefined();
  });

  it('renders HsmNodeStatusTooltip and displays last recorded temperature and latency on hover', async () => {
    const member = COUNCIL_MEMBERS[0]; // TC-01
    const expectedMetrics = getNodeMetrics(member);

    render(<HsmNodeStatusTooltip member={member} isVerified={true} />);

    // Initially, tooltip content should not be present in document
    expect(screen.queryByTestId(`hsm-node-status-tooltip-${member.slotId}`)).not.toBeInTheDocument();

    // Find the container element
    const container = screen.getByTestId(`hsm-node-status-container-${member.slotId}`);
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('data-node-temp', expectedMetrics.temp);
    expect(container).toHaveAttribute('data-node-latency', expectedMetrics.latency);

    // Mouse enter triggers hover tooltip
    fireEvent.mouseEnter(container);

    const tooltip = screen.getByTestId(`hsm-node-status-tooltip-${member.slotId}`);
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('role', 'tooltip');

    // Verify last recorded temperature and latency display
    const tempElement = screen.getByTestId(`hsm-node-temp-${member.slotId}`);
    expect(tempElement).toHaveTextContent(expectedMetrics.temp);

    const latencyElement = screen.getByTestId(`hsm-node-latency-${member.slotId}`);
    expect(latencyElement).toHaveTextContent(expectedMetrics.latency);

    // Mouse leave removes tooltip
    fireEvent.mouseLeave(container);
    expect(screen.queryByTestId(`hsm-node-status-tooltip-${member.slotId}`)).not.toBeInTheDocument();
  });

  it('renders HsmNodeStatusIcon component with hover tooltip functionality', async () => {
    const member = COUNCIL_MEMBERS[1]; // TC-02
    const metrics = getNodeMetrics(member);

    render(<HsmNodeStatusIcon member={member} isVerified={true} size="md" />);

    const iconBtn = screen.getByTestId(`hsm-node-status-icon-btn-${member.slotId}`);
    expect(iconBtn).toBeInTheDocument();

    const container = screen.getByTestId(`hsm-node-status-container-${member.slotId}`);
    fireEvent.mouseEnter(container);

    expect(screen.getByTestId(`hsm-node-status-tooltip-${member.slotId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`hsm-node-temp-${member.slotId}`)).toHaveTextContent(metrics.temp);
    expect(screen.getByTestId(`hsm-node-latency-${member.slotId}`)).toHaveTextContent(metrics.latency);

    fireEvent.mouseLeave(container);
    expect(screen.queryByTestId(`hsm-node-status-tooltip-${member.slotId}`)).not.toBeInTheDocument();
  });

  it('renders CouncilView and provides hover tooltips on HSM node status icons in Roster mode', async () => {
    render(<CouncilView />);

    // Switch to Council Roster mode
    const rosterButton = screen.getByText(/Council Roster/i);
    expect(rosterButton).toBeInTheDocument();
    fireEvent.click(rosterButton);

    // Check first council member status icon/badge
    const member = COUNCIL_MEMBERS[0];
    const metrics = getNodeMetrics(member);

    const statusContainer = screen.getAllByTestId(`hsm-node-status-container-${member.slotId}`)[0];
    expect(statusContainer).toBeInTheDocument();

    // Hover over the status icon container
    fireEvent.mouseEnter(statusContainer);

    // Ensure tooltip appears and displays last temperature and latency
    const tooltip = screen.getByTestId(`hsm-node-status-tooltip-${member.slotId}`);
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(metrics.temp);
    expect(tooltip).toHaveTextContent(metrics.latency);
    expect(tooltip).toHaveTextContent(member.councilCode);
  });
});
