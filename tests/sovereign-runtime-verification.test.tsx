// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SovereignGateways } from '../src/components/SovereignGateways';
import { SentinelRemediation } from '../src/components/SentinelRemediation';
import SovereignDashboard from '../src/pages/SovereignDashboard';
import { SecurityView } from '../src/components/views/SecurityView';
import { SOVEREIGN_CONFIG } from '../src/config/sovereign.config';
import {
  executeFullCycleHeadlessE2E,
  resetAuthoritativePhase11TransactionToFinalized,
  SOVEREIGN_PRINCIPAL_AUTHORITY,
  classifyFailureCategory,
  createFailureDiagnosticRecord,
  parseQuotaRetryAfterSeconds,
  PRODUCTION_INTEGRATION_CODE_PATHS,
  CHAMBER_INTEGRATION_COVERAGE_METRICS,
} from '../src/adapters/zyrquenAdapter';
import { GovernanceHealthHeatmap } from '../src/components/GovernanceHealthHeatmap';
import { ComplianceCoverageView } from '../src/components/views/ComplianceCoverageView';
import { CommandCenterOperationsConsole } from '../src/components/CommandCenterOperationsConsole';

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

  it('executes full-cycle headless E2E flow from AI command ingestion to WORM Audit Ledger finalization across all boundary connectors without UI intervention', () => {
    resetAuthoritativePhase11TransactionToFinalized();

    // 1. Happy path: Full-cycle execution from AI proposal -> Explicit Approval (#EP-SOVEREIGN-01) -> Command Engine -> Adapter -> Target Workspace -> Verification -> Audit Ledger
    const e2eResult = executeFullCycleHeadlessE2E({
      requestId: 'REQ-AI-849202-0101',
      traceId: 'TRC-AI-849202-0101',
      proposalId: 'PROP-AI-849202-0101',
      targetWorkspace: 'ws-agent-02',
      previousBatchSize: 64,
      proposedBatchSize: 48,
      approverSignature: SOVEREIGN_PRINCIPAL_AUTHORITY.id,
      aiProviderConnected: true,
      aiProviderEvidenceRef: 'E2E:REQ-AI-849202-0101:TRC-AI-849202-0101',
    });

    expect(e2eResult.ok).toBe(true);
    expect(e2eResult.transaction.isFinalized).toBe(true);
    expect(e2eResult.transaction.lifecycleStage).toBe('FINALIZED');
    expect(e2eResult.transaction.appliedValue).toBe(48);
    expect(e2eResult.executionTrace.overallStatus).toBe('FINALIZED');
    expect(e2eResult.executionTrace.stoppedAtStage).toBeNull();
    expect(e2eResult.executionTrace.stages.every((s) => s.status === 'PASSED' && Boolean(s.evidenceRef))).toBe(true);

    // Verify all 6 boundary connectors are green with real evidence
    expect(e2eResult.boundaryHealth.aiProvider.status).toBe('CONNECTED');
    expect(e2eResult.boundaryHealth.commandEngine.status).toBe('READY');
    expect(e2eResult.boundaryHealth.adapter.status).toBe('CONNECTED');
    expect(e2eResult.boundaryHealth.targetWorkspace.status).toBe('REACHABLE');
    expect(e2eResult.boundaryHealth.verification.status).toBe('READY');
    expect(e2eResult.boundaryHealth.auditLedger.status).toBe('AVAILABLE');
    expect(e2eResult.replayCheckBlocked).toBe(true);
    expect(e2eResult.coreFrozen).toBe(true);
    expect(e2eResult.coreMutationCount).toBe(0);

    // 2. Duplicate / replay execution on the finalized proposal must be BLOCKED at APPROVAL
    const replayResult = executeFullCycleHeadlessE2E({
      requestId: 'REQ-AI-849202-0101-DUP',
      traceId: 'TRC-AI-849202-0101',
      proposalId: 'PROP-AI-849202-0101',
      targetWorkspace: 'ws-agent-02',
      previousBatchSize: 64,
      proposedBatchSize: 48,
      approverSignature: SOVEREIGN_PRINCIPAL_AUTHORITY.id,
    });
    expect(replayResult.ok).toBe(false);
    expect(replayResult.diagnostic?.classification).toBe('BLOCKED');
    expect(replayResult.executionTrace.stoppedAtStage).toBe('APPROVAL');
    expect(replayResult.boundaryHealth.commandEngine.status).toBe('BLOCKED');

    // 3. Direct ZYRQUEN Core write attempt must be BLOCKED at ANALYSIS with 0 Core mutations
    const coreBlocked = executeFullCycleHeadlessE2E({
      requestId: 'REQ-AI-849202-CORE',
      traceId: 'TRC-AI-849202-CORE',
      proposalId: 'PROP-AI-849202-CORE',
      targetWorkspace: 'ZYRQUEN_CORE',
      previousBatchSize: 64,
      proposedBatchSize: 48,
      approverSignature: SOVEREIGN_PRINCIPAL_AUTHORITY.id,
    });
    expect(coreBlocked.ok).toBe(false);
    expect(coreBlocked.diagnostic?.classification).toBe('BLOCKED');
    expect(coreBlocked.executionTrace.stoppedAtStage).toBe('ANALYSIS');
    expect(coreBlocked.coreMutationCount).toBe(0);

    resetAuthoritativePhase11TransactionToFinalized();
  });

  it('exercises previously uncovered integration branches, toggles Integration Coverage overlay in GovernanceHealthHeatmap, and renders the D3 ComplianceCoverageView', () => {
    // 1. Exercise fallback branches in classifyFailureCategory & parseQuotaRetryAfterSeconds
    expect(
      parseQuotaRetryAfterSeconds(
        'Quota exceeded for metric: generativelanguage.googleapis.com/generate_requests_per_model, limit: 300, model: gdm-lc-eval-phase-1 Please retry in 52.538339493s.'
      )
    ).toBe(53);
    expect(
      classifyFailureCategory({
        actualError: 'The model API is currently overloaded and may experience intermittent errors.',
      })
    ).toBe('PROVIDER_UNAVAILABLE');
    const overloadDiag = createFailureDiagnosticRecord({
      failureId: 'FAIL-OVERLOAD-TEST-01',
      stage: 'ANALYSIS',
      component: 'AI_SERVICE_BOUNDARY',
      requestId: 'REQ-AI-OVERLOAD-01',
      traceId: 'TRC-AI-OVERLOAD-01',
      target: 'ws-agent-02',
      actualError: 'Error: The model API is currently overloaded and may experience intermittent errors.',
      expectedState: 'AI_PROVIDER_RESPONSE_OK',
      evidence: 'ERR:MODEL_API_OVERLOADED_INTERMITTENT',
    });
    expect(overloadDiag.classification).toBe('PROVIDER_UNAVAILABLE');
    expect(overloadDiag.retryAfterSeconds).toBe(15);
    expect(overloadDiag.observedState).toContain('MODEL_API_OVERLOADED_INTERMITTENT');
    expect(overloadDiag.recoveryState).toContain('OVERLOAD_COOLDOWN_15S');
    expect(
      classifyFailureCategory({
        actualError: 'DEADLINE_EXCEEDED: RPC timeout after 5000ms',
      })
    ).toBe('TIMEOUT');
    expect(
      classifyFailureCategory({
        actualError: 'Merkle SLA breach during post-execution check',
        stage: 'VERIFY',
      })
    ).toBe('VERIFICATION_FAILED');
    expect(
      classifyFailureCategory({
        actualError: 'WORM fault during ledger seal append',
        stage: 'AUDIT',
      })
    ).toBe('AUDIT_FAILED');
    expect(
      classifyFailureCategory({
        actualError: 'Unexpected runtime exception',
      })
    ).toBe('FAILED');

    // 2. Exercise invalid principal signature branch in executeFullCycleHeadlessE2E (L1539-1576)
    const sigRejected = executeFullCycleHeadlessE2E({
      requestId: 'REQ-AI-849202-BADSIG',
      traceId: 'TRC-AI-849202-BADSIG',
      proposalId: 'PROP-AI-849202-BADSIG',
      targetWorkspace: 'ws-agent-02',
      previousBatchSize: 64,
      proposedBatchSize: 48,
      approverSignature: '#INVALID-PRINCIPAL',
    });
    expect(sigRejected.ok).toBe(false);
    expect(sigRejected.executionTrace.stoppedAtStage).toBe('APPROVAL');
    expect(sigRejected.diagnostic?.classification).toBe('BLOCKED');
    expect(sigRejected.coreMutationCount).toBe(0);

    // 3. Verify canonical coverage models
    expect(PRODUCTION_INTEGRATION_CODE_PATHS.length).toBeGreaterThanOrEqual(9);
    expect(CHAMBER_INTEGRATION_COVERAGE_METRICS).toHaveLength(18);

    // 4. Render GovernanceHealthHeatmap, verify untested coverage cell pulse until interaction, HSM Quorum Breach Alert (<8/10), and ETDA Sec 28 PDF generation
    const onNavigateToView = vi.fn();
    const onAddSystemEvent = vi.fn();
    render(<GovernanceHealthHeatmap onNavigateToView={onNavigateToView} onAddSystemEvent={onAddSystemEvent} />);

    // Verify untested coverage cell (e.g., CH-04) has subtle CSS pulse class before interaction, then stops pulsing after interaction
    const ch04Cell = document.getElementById('chamber-cell-ch-04')!;
    expect(ch04Cell).toBeTruthy();
    expect(ch04Cell.getAttribute('data-untested-pulse')).toBe('active');
    expect(ch04Cell.className).toContain('untested-coverage-cell-pulse');
    fireEvent.click(ch04Cell);
    expect(ch04Cell.getAttribute('data-untested-pulse')).toBe('acknowledged');
    expect(ch04Cell.className).not.toContain('untested-coverage-cell-pulse');

    // Trigger HSM Quorum Breach (<8/10 nodes) and verify high-priority Health Breach Alert layer & direct forensic dossier links
    const heatmapContainer = document.getElementById('governance-health-heatmap-container')!;
    expect(heatmapContainer).toBeTruthy();
    expect(heatmapContainer.className).not.toContain('hsm-breach-alert-layer');
    expect(document.getElementById('hsm-quorum-health-breach-alert-layer')).toBeNull();
    const breachBtn = document.getElementById('btn-simulate-hsm-quorum-breach')!;
    fireEvent.click(breachBtn);
    const breachLayer = document.getElementById('hsm-quorum-health-breach-alert-layer')!;
    expect(breachLayer).toBeTruthy();
    expect(breachLayer.textContent).toContain('ACTIVE QUORUM: 7/10 NODES');

    // Verify GovernanceHealthHeatmap component container receives 'hsm-breach-alert-layer' CSS class when active HSM quorum < 8
    expect(heatmapContainer.className).toContain('hsm-breach-alert-layer');
    expect(heatmapContainer.getAttribute('data-hsm-breach-active')).toBe('true');

    // Verify affected hardware node cell (e.g., CH-02 mapped to TC-03) receives hsm-breach-alert-layer CSS animation
    const ch02Cell = document.getElementById('chamber-cell-ch-02')!;
    expect(ch02Cell.className).toContain('hsm-breach-alert-layer');
    expect(ch02Cell.getAttribute('data-hsm-breach-cell')).toBe('true');

    // Verify every hardware cell has a 'View Forensic Dossier' button mapped over HSM node state & linked to data store historical audit artifact
    const ch00DossierBtn = document.getElementById('btn-view-forensic-dossier-ch-00')!;
    const ch17DossierBtn = document.getElementById('btn-view-forensic-dossier-ch-17')!;
    expect(ch00DossierBtn).toBeTruthy();
    expect(ch17DossierBtn).toBeTruthy();
    expect(ch00DossierBtn.textContent).toContain('View Forensic Dossier');
    fireEvent.click(ch00DossierBtn);
    const cellDossierModal = document.getElementById('hsm-node-forensic-dossier-modal')!;
    expect(cellDossierModal).toBeTruthy();
    expect(cellDossierModal.textContent).toContain('Data Store Audit Artifact:');
    fireEvent.click(document.getElementById('btn-close-hsm-forensic-dossier')!);

    // Verify visual 'Node Status Dashboard' alongside the heatmap with scrollable real-time throughput metrics for each hardware node
    const nodeStatusDashboard = document.getElementById('node-status-dashboard')!;
    expect(nodeStatusDashboard).toBeTruthy();
    expect(nodeStatusDashboard.textContent).toContain('NODE STATUS DASHBOARD');
    expect(nodeStatusDashboard.textContent).toContain('QOPS');
    expect(nodeStatusDashboard.textContent).toContain('sig/s');
    const scrollableNodeList = document.getElementById('node-status-scrollable-list')!;
    expect(scrollableNodeList).toBeTruthy();
    expect(document.getElementById('node-status-item-tc-01')).toBeTruthy();
    expect(document.getElementById('node-status-item-tc-10')).toBeTruthy();

    // Verify local state handler triggering browser-level toast notification when hardware node drops below 'Warning' threshold
    let capturedBrowserToast: any = null;
    const toastListener = (evt: Event) => {
      capturedBrowserToast = (evt as CustomEvent).detail;
    };
    window.addEventListener('zyrquen-toast', toastListener);
    const warnTriggerBtn = document.getElementById('btn-trigger-node-warning-threshold')!;
    expect(warnTriggerBtn).toBeTruthy();
    fireEvent.click(warnTriggerBtn);
    expect(capturedBrowserToast).toBeTruthy();
    expect(capturedBrowserToast.type).toBe('warning');
    expect(capturedBrowserToast.message).toContain('Warning Threshold');
    window.removeEventListener('zyrquen-toast', toastListener);
    const warningToastBanner = document.getElementById('hardware-node-warning-toast')!;
    expect(warningToastBanner).toBeTruthy();
    expect(warningToastBanner.textContent).toContain('BELOW WARNING THRESHOLD');

    // Verify 24-hour integration coverage percentage trend line below the heatmap
    const trendSection = document.getElementById('heatmap-24h-integration-coverage-trend')!;
    expect(trendSection).toBeTruthy();
    expect(trendSection.textContent).toContain('24-HOUR INTEGRATION COVERAGE PERCENTAGE TREND LINE');

    // Verify Copy Deep-Link button
    const copyDeepLinkBtn = document.getElementById('btn-copy-heatmap-deep-link')!;
    expect(copyDeepLinkBtn).toBeTruthy();
    fireEvent.click(copyDeepLinkBtn);

    // Verify search bar locates hardware seal status or integration path by node ID or seal number
    const searchInput = document.getElementById('heatmap-node-seal-integration-search') as HTMLInputElement;
    expect(searchInput).toBeTruthy();
    fireEvent.change(searchInput, { target: { value: 'TC-03' } });
    expect(document.getElementById('chamber-cell-ch-02')).toBeTruthy();
    fireEvent.change(searchInput, { target: { value: '' } });

    // Verify d3-zoom zoom and pan controls on GovernanceHealthHeatmap
    const zoomCanvas = document.getElementById('heatmap-d3-zoom-canvas')!;
    expect(zoomCanvas).toBeTruthy();
    expect(zoomCanvas.getAttribute('data-zoom-scale')).toBe('1.00');
    fireEvent.click(document.getElementById('btn-heatmap-zoom-in')!);
    expect(zoomCanvas.getAttribute('data-zoom-scale')).toBe('1.25');
    fireEvent.click(document.getElementById('btn-heatmap-pan-right')!);
    expect(zoomCanvas.getAttribute('data-pan-x')).toBe('48');
    fireEvent.click(document.getElementById('btn-heatmap-zoom-reset')!);
    expect(zoomCanvas.getAttribute('data-zoom-scale')).toBe('1.00');
    expect(zoomCanvas.getAttribute('data-pan-x')).toBe('0');

    // Verify Date Picker to view historical snapshots of hardware seal status and integration coverage
    const datePicker = document.getElementById('heatmap-historical-date-picker') as HTMLInputElement;
    expect(datePicker).toBeTruthy();
    fireEvent.change(datePicker, { target: { value: '2026-09-27T11:00' } });
    const snapshotBanner = document.getElementById('heatmap-historical-snapshot-banner')!;
    expect(snapshotBanner).toBeTruthy();
    expect(snapshotBanner.textContent).toContain('HISTORICAL SNAPSHOT ACTIVE');
    expect(snapshotBanner.textContent).toContain('2026-09-27T11:00');

    // Verify Export to CSV button downloads raw data of the current grid for external spreadsheet analysis
    const exportCsvBtn = document.getElementById('btn-export-heatmap-csv')!;
    expect(exportCsvBtn).toBeTruthy();
    fireEvent.click(exportCsvBtn);
    const csvBanner = document.getElementById('heatmap-csv-export-banner')!;
    expect(csvBanner).toBeTruthy();
    expect(csvBanner.textContent).toContain('Spreadsheet CSV Exported:');
    expect(onAddSystemEvent).toHaveBeenCalledWith(
      'EXPORT_CSV',
      expect.stringContaining('Governance Heatmap CSV Exported'),
      expect.stringContaining('Exported current grid raw data'),
      expect.stringMatching(/^csv-export:/),
      'success',
      'ETDA Sec 28 / ISO-42001 Spreadsheet Audit'
    );

    // Open direct forensic dossier for isolated hardware node TC-03
    const tc03DossierBtn = document.getElementById('btn-open-forensic-dossier-tc-03')!;
    expect(tc03DossierBtn).toBeTruthy();
    fireEvent.click(tc03DossierBtn);
    const dossierModal = document.getElementById('hsm-node-forensic-dossier-modal')!;
    expect(dossierModal).toBeTruthy();
    expect(dossierModal.textContent).toContain('DOSSIER-HSM-TC03-849202');
    fireEvent.click(document.getElementById('btn-close-hsm-forensic-dossier')!);

    // Generate Heatmap Forensic PDF (ETDA Sec 28) using jsPDF
    const pdfBtn = document.getElementById('btn-generate-heatmap-forensic-pdf')!;
    expect(pdfBtn).toBeTruthy();
    fireEvent.click(pdfBtn);
    const pdfReceiptBanner = document.getElementById('heatmap-forensic-pdf-receipt-banner')!;
    expect(pdfReceiptBanner).toBeTruthy();
    expect(pdfReceiptBanner.textContent).toContain('Court-Admissible jsPDF Sealed:');
    expect(onAddSystemEvent).toHaveBeenCalledWith(
      'COMPLIANCE',
      expect.stringContaining('ETDA Sec 28 Heatmap Forensic PDF Sealed'),
      expect.stringContaining('Captured 18 Chambers Hardware Seal Status & Integration Coverage'),
      expect.stringMatching(/^0x[0-9a-f]+$/i),
      'success',
      'ETDA B.E. 2544 Section 28'
    );

    // Restore 10/10 HSM Quorum and verify container hsm-breach-alert-layer is removed
    fireEvent.click(document.getElementById('btn-restore-hsm-quorum-nodes')!);
    expect(document.getElementById('hsm-quorum-health-breach-alert-layer')).toBeNull();
    expect(heatmapContainer.className).not.toContain('hsm-breach-alert-layer');

    // Verify Framer Motion layout animation container when switching between 'SEAL_STATUS' and 'INTEGRATION_COVERAGE' views
    const animatedGrid = document.getElementById('heatmap-animated-grid-container')!;
    expect(animatedGrid).toBeTruthy();
    expect(animatedGrid.getAttribute('data-overlay-mode')).toBe('SEAL_STATUS');
    const toggleBtn = document.getElementById('btn-toggle-integration-coverage-overlay')!;
    expect(toggleBtn).toBeTruthy();
    fireEvent.click(toggleBtn);
    expect(animatedGrid.getAttribute('data-overlay-mode')).toBe('INTEGRATION_COVERAGE');
    expect(document.getElementById('integration-coverage-overlay-banner')).toBeTruthy();
    const hardwareSealModeBtn = document.getElementById('btn-mode-hardware-seal-status')!;
    expect(hardwareSealModeBtn).toBeTruthy();
    fireEvent.click(hardwareSealModeBtn);
    expect(animatedGrid.getAttribute('data-overlay-mode')).toBe('SEAL_STATUS');
    fireEvent.click(toggleBtn);

    const inspectMapBtn = document.getElementById('btn-open-d3-compliance-coverage-view')!;
    fireEvent.click(inspectMapBtn);
    expect(onNavigateToView).toHaveBeenCalledWith('compliance-coverage');

    cleanup();

    // 5. Render D3 ComplianceCoverageView and run live path probes
    render(<ComplianceCoverageView />);
    expect(document.getElementById('d3-compliance-coverage-svg')).toBeTruthy();
    const probeAllBtn = document.getElementById('btn-probe-all-uncovered')!;
    fireEvent.click(probeAllBtn);
    expect(screen.getAllByText(/PROBED PASS/i).length).toBeGreaterThan(0);

    cleanup();

    // 6. Verify Cloud Resources Recharts sparklines (utilizationHistory60m) and Chaos Simulator module (handleInjectChaos & activeChaosIncident)
    render(<CommandCenterOperationsConsole />);
    expect(document.getElementById('operations-cloud-resources-section')).toBeTruthy();
    expect(document.getElementById('operations-chaos-simulator-section')).toBeTruthy();
    const injectChaosBtn = document.getElementById('btn-quick-inject-chaos')!;
    expect(injectChaosBtn).toBeTruthy();
    fireEvent.click(injectChaosBtn);
    expect(screen.getAllByText(/RECOVERED_VERIFIED/i).length).toBeGreaterThan(0);

    resetAuthoritativePhase11TransactionToFinalized();
  });
});
