// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTHORITATIVE_CONSTANTS } from '../lib/canonicalResolver';
import { SOVEREIGN_CONFIG } from '../sovereign.config';
import { SYSTEM_METADATA, CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT, CANONICAL_SEAL_COUNT } from '../data/canonicalData';
import { CANONICAL_CONSTANTS } from '../data/sovereignData';
import { verifyCanonicalReconciliation } from '../utils/authoritativeState';
import { verifyCrossModuleSSoTParity } from '../core/canonicalSSoT';
import { Room18MasterPanel } from '../components/Room18MasterPanel';
import { SecurityView, HSM_NODES_DATA } from '../components/views/SecurityView';
import { TelemetryStreamEngine } from '../services/TelemetryStreamEngine';
import { RemediationProgressToast } from '../components/RemediationProgressToast';
import { CriticalNodesDashboard } from '../components/dashboard/CriticalNodesDashboard';
import { NodeRemediationEngine, BK01_DETECTED_ANOMALIES } from '../services/NodeRemediationEngine';

if (typeof Animation !== 'undefined' && Animation.prototype) {
  Animation.prototype.cancel = function () {};
}

beforeEach(() => {
  // Ensure global fetch mock resolves cleanly for any background telemetry polls
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ status: 'ONLINE' }),
    text: () => Promise.resolve('OK'),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('🛡️ ZYRQUEN Ω∞ — Sovereign Canonical Resolver, Room18MasterPanel & SecurityView HSM Quorum Integration Suite', () => {
  // ==========================================================================
  // 1. CANONICAL RESOLVER (SSoT Δ0 ZERO-DRIFT & IMMUTABILITY)
  // ==========================================================================
  describe('1. Canonical Resolver (AUTHORITATIVE_CONSTANTS) Verification', () => {
    it('exposes accurate authoritative constants with zero discrepancy', () => {
      expect(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT).toBe(849202);
      expect(AUTHORITATIVE_CONSTANTS.BLOCK_HEIGHT).toBe(849202);
      expect(AUTHORITATIVE_CONSTANTS.BLOCK_TAG).toBe('#849202');
      expect(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT).toBe(
        '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
      );
      expect(AUTHORITATIVE_CONSTANTS.SEAL_COUNT).toBe(14902);
      expect(AUTHORITATIVE_CONSTANTS.QUARANTINED_SEALS).toBe(80);
      expect(AUTHORITATIVE_CONSTANTS.RAW_SEALS_TOTAL).toBe(14982);
      expect(AUTHORITATIVE_CONSTANTS.SEAL_COUNT + AUTHORITATIVE_CONSTANTS.QUARANTINED_SEALS).toBe(
        AUTHORITATIVE_CONSTANTS.RAW_SEALS_TOTAL
      );
      expect(AUTHORITATIVE_CONSTANTS.SSOT_MUTATION).toBe(0);
      expect(AUTHORITATIVE_CONSTANTS.SSOT_DRIFT).toBe('Δ0.00%');
      expect(AUTHORITATIVE_CONSTANTS.HSM_TOTAL_NODES).toBe(10);
      expect(AUTHORITATIVE_CONSTANTS.HSM_QUORUM_THRESHOLD).toBe(10);
      expect(AUTHORITATIVE_CONSTANTS.REPLAY_SLA_MS).toBe(142.0);
      expect(AUTHORITATIVE_CONSTANTS.MEASURED_REPLAY_MS).toBe(35.8);
      expect(AUTHORITATIVE_CONSTANTS.SYSTEM_AUDIT_ID).toBe('AUD-MOD_MUGWCIK6');
      expect(AUTHORITATIVE_CONSTANTS.SOVEREIGN_AUTHORITY).toBe('#EP-SOVEREIGN-01');
    });

    it('enforces strict Object.freeze runtime immutability on AUTHORITATIVE_CONSTANTS', () => {
      expect(Object.isFrozen(AUTHORITATIVE_CONSTANTS)).toBe(true);
      expect(() => {
        (AUTHORITATIVE_CONSTANTS as Record<string, unknown>).GENESIS_BLOCK_HEIGHT = 999999;
      }).toThrow(TypeError);
      expect(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT).toBe(849202);
    });

    it('maintains 100% cross-module SSoT parity across sovereign.config, canonicalData, sovereignData, and authoritativeState', () => {
      expect(SOVEREIGN_CONFIG.genesisAnchor.blockHeight).toBe(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT);
      expect(SOVEREIGN_CONFIG.genesisAnchor.merkleRoot).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
      expect(SOVEREIGN_CONFIG.sealsRegistry.canonicalSealsCount).toBe(AUTHORITATIVE_CONSTANTS.SEAL_COUNT);

      expect(CANONICAL_GENESIS_BLOCK).toBe(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT);
      expect(CANONICAL_MERKLE_ROOT).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
      expect(CANONICAL_SEAL_COUNT).toBe(AUTHORITATIVE_CONSTANTS.SEAL_COUNT);
      expect(SYSTEM_METADATA.auditId).toBe(AUTHORITATIVE_CONSTANTS.SYSTEM_AUDIT_ID);

      expect(CANONICAL_CONSTANTS.CANONICAL_BLOCK).toBe(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT);
      expect(CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
      expect(CANONICAL_CONSTANTS.CANONICAL_SEALS).toBe(AUTHORITATIVE_CONSTANTS.SEAL_COUNT);

      const reconciliation = verifyCanonicalReconciliation();
      expect(reconciliation.reconciled).toBe(true);
      expect(reconciliation.sources.every((s) => s.matched)).toBe(true);

      const ssotAudit = verifyCrossModuleSSoTParity();
      expect(ssotAudit.allMatched).toBe(true);
      expect(ssotAudit.modules.every((m) => m.parityMatched)).toBe(true);
    });
  });

  // ==========================================================================
  // 2. ROOM 18 MASTER PANEL (NEURAL SENTINEL & PREDICTIVE GOVERNANCE)
  // ==========================================================================
  describe('2. Room18MasterPanel Component Integration & State Transitions', () => {
    it('renders Room 18 header, canonical constants, and Neural Vector Topology Mapping accurately', () => {
      render(<Room18MasterPanel />);

      expect(screen.getByText('ROOM 18')).toBeTruthy();
      expect(screen.getByText('Neural Sentinel & Predictive Governance')).toBeTruthy();
      expect(screen.getByText('ANOMALY THRESHOLD')).toBeTruthy();
      expect(screen.getByText('Safety Cutoff Limit: 85.0%')).toBeTruthy();
      expect(screen.getByText('PREDICTIVE ACCURACY')).toBeTruthy();
      expect(
        screen.getByText(`Based on ${AUTHORITATIVE_CONSTANTS.SEAL_COUNT.toLocaleString()} Immutable Seals`)
      ).toBeTruthy();
      expect(screen.getByText('SENTINEL STATUS')).toBeTruthy();
      expect(screen.getByText('NOMINAL')).toBeTruthy();
      expect(
        screen.getByText(
          `Block #${AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT} Synced · Audit ${AUTHORITATIVE_CONSTANTS.SYSTEM_AUDIT_ID}`
        )
      ).toBeTruthy();
      expect(screen.getByText('Neural Vector Topology Mapping')).toBeTruthy();
      expect(screen.getByText('OTel Input')).toBeTruthy();
      expect(screen.getByText('Sentinel Hidden')).toBeTruthy();
      expect(screen.getByText('Policy Output')).toBeTruthy();
      expect(
        screen.getByText(`Merkle Root: ${AUTHORITATIVE_CONSTANTS.MERKLE_ROOT.slice(0, 16)}...`)
      ).toBeTruthy();
    });

    it('transitions Sentinel state deterministically through EVALUATING back to NOMINAL when Run Neural Scan is clicked', () => {
      vi.useFakeTimers();
      render(<Room18MasterPanel />);

      const scanButton = screen.getByRole('button', { name: /Run Neural Scan/i });
      expect(scanButton).toBeTruthy();
      expect(screen.getByText('NOMINAL')).toBeTruthy();

      // Trigger scan
      fireEvent.click(scanButton);

      // Immediately enters EVALUATING state
      expect(screen.getByText('Evaluating System...')).toBeTruthy();
      expect(screen.getByText('EVALUATING')).toBeTruthy();

      // Advance 800ms for deterministic evaluation completion
      act(() => {
        vi.advanceTimersByTime(850);
      });

      expect(screen.getByRole('button', { name: /Run Neural Scan/i })).toBeTruthy();
      expect(screen.getByText('NOMINAL')).toBeTruthy();
      expect(screen.getByText(/SENTINEL ATTESTED AT/i)).toBeTruthy();
    });

    it('invokes navigation and certificate callbacks from the Room 18 quick navigation bar', () => {
      const onNavigate = vi.fn();
      const onOpenCertificate = vi.fn();

      render(<Room18MasterPanel onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />);

      fireEvent.click(screen.getByRole('button', { name: /CH-02 Quarantine Buffer/i }));
      expect(onNavigate).toHaveBeenCalledWith('security');

      fireEvent.click(screen.getByRole('button', { name: /Immutable Audit Ledger/i }));
      expect(onNavigate).toHaveBeenCalledWith('ledger');

      fireEvent.click(screen.getByRole('button', { name: /Inspect Gold Certificate/i }));
      expect(onOpenCertificate).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // 3. SECURITY VIEW — HARDWARE HSM QUORUM MONITOR STATE TRANSITIONS
  // ==========================================================================
  describe('3. SecurityView Hardware HSM Quorum Monitor & State Transitions', () => {
    it('defines 10 HSM nodes (8 Hardware HSM and 2 Simulated Enclave nodes) matching AUTHORITATIVE_CONSTANTS', () => {
      expect(HSM_NODES_DATA).toHaveLength(AUTHORITATIVE_CONSTANTS.HSM_TOTAL_NODES);
      const hwNodes = HSM_NODES_DATA.filter((n) => n.isHardware);
      const simNodes = HSM_NODES_DATA.filter((n) => !n.isHardware);
      expect(hwNodes).toHaveLength(8);
      expect(simNodes).toHaveLength(2);
      expect(HSM_NODES_DATA[0].label).toBe('HSM-NODE-01');
      expect(HSM_NODES_DATA[9].label).toBe('HSM-NODE-10');
    });

    it('renders 10/10 VALID unanimous quorum initially and transitions to QUORUM DEGRADED (9/10) when a node is isolated, then restores 10/10 VALID when re-enabled', () => {
      render(<SecurityView />);

      // Verify initial 10/10 VALID state
      expect(screen.getByText(/QUORUM STATUS:\s*10\/10\s*VALID/i)).toBeTruthy();
      for (let i = 1; i <= 10; i++) {
        const label = `HSM-NODE-${i.toString().padStart(2, '0')}`;
        expect(screen.getByText(label)).toBeTruthy();
      }
      expect(screen.getAllByText('HW HSM')).toHaveLength(8);
      expect(screen.getAllByText('SIMULATED')).toHaveLength(2);

      // Isolate HSM-NODE-01
      const isolateButtons = screen.getAllByTitle('Isolate Node');
      expect(isolateButtons).toHaveLength(10);

      fireEvent.click(isolateButtons[0]);

      // Quorum must immediately degrade to 9/10 QUORUM DEGRADED and show OFFLINE
      expect(screen.getByText(/QUORUM STATUS:\s*9\/10\s*QUORUM DEGRADED/i)).toBeTruthy();
      expect(screen.getByText('OFFLINE')).toBeTruthy();

      // Re-enable HSM-NODE-01
      const enableButton = screen.getByTitle('Enable Node');
      fireEvent.click(enableButton);

      // Quorum restores to 10/10 VALID
      expect(screen.getByText(/QUORUM STATUS:\s*10\/10\s*VALID/i)).toBeTruthy();
      expect(screen.queryByText('OFFLINE')).toBeNull();
    });

    it('transitions an HSM node through SYN... cryptographic handshake and back to ONLINE after 1200ms', () => {
      vi.useFakeTimers();
      render(<SecurityView />);

      const handshakeButtons = screen.getAllByTitle('Trigger Cryptographic Handshake');
      expect(handshakeButtons).toHaveLength(10);

      // Trigger cryptographic handshake on HSM-NODE-01
      fireEvent.click(handshakeButtons[0]);

      // Node displays SYN... during handshake
      expect(screen.getByText(/SYN\.\.\./i)).toBeTruthy();

      // Advance 1200ms to complete handshake
      act(() => {
        vi.advanceTimersByTime(1250);
      });

      expect(screen.queryByText(/SYN\.\.\./i)).toBeNull();
      expect(screen.getByText(/QUORUM STATUS:\s*10\/10\s*VALID/i)).toBeTruthy();
    });
  });

  // ==========================================================================
  // 4. TELEMETRY STREAM ENGINE (PURE DETERMINISTIC SHA-256 FRAME BINDING)
  // ==========================================================================
  describe('4. TelemetryStreamEngine Pure Deterministic Verification', () => {
    it('generates 100% deterministic TEL-XXXXX frameIds and Dilithium-5 signatures without Math.random()', () => {
      const engine = new TelemetryStreamEngine();
      const frameA = engine.generateFrame('SG-NODE-01', 12.4, 'STG-01');
      const frameB = engine.generateFrame('SG-NODE-01', 12.4, 'STG-01');

      expect(frameA.frameId).toBe(frameB.frameId);
      expect(frameA.pqcSignature).toBe(frameB.pqcSignature);
      expect(frameA.frameId).toMatch(/^TEL-\d{5}$/);
      expect(frameA.genesisBlockHeight).toBe(AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT);
      expect(frameA.merkleRoot).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
      expect(frameA.quarantineTriggered).toBe(false);

      const verification = engine.verifyFrameIntegrity(frameA);
      expect(verification.isValid).toBe(true);
      expect(verification.message).toContain('100% PURE GREEN');
    });

    it('triggers Chamber 02 quarantine when anomalyScore exceeds 85.0% and sanitizes DOM output', () => {
      const engine = new TelemetryStreamEngine();
      const highRiskFrame = engine.generateFrame('SG-NODE-99', 91.5, 'STG-06');

      expect(highRiskFrame.quarantineTriggered).toBe(true);
      const sanitizedHtml = engine.formatFrameForCourtDOM(highRiskFrame);
      expect(sanitizedHtml).toContain('(CHAMBER 02 QUARANTINE)');
      expect(sanitizedHtml).toContain(highRiskFrame.frameId);
    });
  });

  // ==========================================================================
  // 5. REMEDIATION PROGRESS TOAST (MOTION/REACT SEQUENTIAL STATUS UPDATES)
  // ==========================================================================
  describe('5. RemediationProgressToast & NodeRemediationEngine Sequential Status Updates', () => {
    it('displays animated progress bar and sequential status updates for Isolation, Recalibration, and Verification when NodeRemediationEngine is triggered', async () => {
      render(<RemediationProgressToast />);

      // Initially hidden before NodeRemediationEngine is triggered
      expect(screen.queryByTestId('remediation-progress-toast')).toBeNull();

      // Step 1: Emit Isolation (33%)
      act(() => {
        NodeRemediationEngine.emitProgress({
          nodeId: 'BK01',
          phase: 'Isolation',
          stepIndex: 1,
          totalSteps: 3,
          progressPercent: 33,
          statusMessage: 'Isolation: Chamber 02 Quarantine (BK01)',
          logLine: '[STAGE 1] Isolating BK01 to Chamber 02...',
          nodeStatus: 'QUARANTINED',
        });
      });

      expect(screen.getByTestId('remediation-progress-toast')).toBeTruthy();
      expect(screen.getByTestId('remediation-motion-progress-bar').style.width).toBe('33%');
      expect(screen.getByTestId('remediation-step-isolation').getAttribute('data-status')).toBe('ACTIVE');
      expect(screen.getByTestId('remediation-step-recalibration').getAttribute('data-status')).toBe('PENDING');
      expect(screen.getByTestId('remediation-step-verification').getAttribute('data-status')).toBe('PENDING');

      // Step 2: Emit Recalibration (67%)
      act(() => {
        NodeRemediationEngine.emitProgress({
          nodeId: 'BK01',
          phase: 'Recalibration',
          stepIndex: 2,
          totalSteps: 3,
          progressPercent: 67,
          statusMessage: 'Recalibration: NIST PQC ML-DSA-87 Lattice & Phase Jitter',
          logLine: '[STAGE 2] Re-aligning NIST PQC ML-DSA-87 Lattice...',
          nodeStatus: 'QUARANTINED',
        });
      });

      expect(screen.getByTestId('remediation-motion-progress-bar').style.width).toBe('67%');
      expect(screen.getByTestId('remediation-step-isolation').getAttribute('data-status')).toBe('DONE');
      expect(screen.getByTestId('remediation-step-recalibration').getAttribute('data-status')).toBe('ACTIVE');
      expect(screen.getByTestId('remediation-step-verification').getAttribute('data-status')).toBe('PENDING');

      // Step 3: Trigger full NodeRemediationEngine execution completing Verification (100%)
      const engine = new NodeRemediationEngine();
      await act(async () => {
        await engine.executeRemediation('BK01', BK01_DETECTED_ANOMALIES);
      });

      expect(screen.getByTestId('remediation-motion-progress-bar').style.width).toBe('100%');
      expect(screen.getByTestId('remediation-step-isolation').getAttribute('data-status')).toBe('DONE');
      expect(screen.getByTestId('remediation-step-recalibration').getAttribute('data-status')).toBe('DONE');
      expect(screen.getByTestId('remediation-step-verification').getAttribute('data-status')).toBe('DONE');
      expect(screen.getByTestId('remediation-status-update-isolation').textContent).toContain('Isolation');
      expect(screen.getByTestId('remediation-status-update-recalibration').textContent).toContain('Recalibration');
      expect(screen.getByTestId('remediation-status-update-verification').textContent).toContain('Verification');
    });

    it('automatically appears and updates for any node when remediation is initiated via NodeRemediationEngine', async () => {
      render(<RemediationProgressToast />);

      await act(async () => {
        await NodeRemediationEngine.triggerRemediation('SG02');
      });

      const toast = screen.getByTestId('remediation-progress-toast');
      expect(toast).toBeTruthy();
      expect(toast.textContent).toContain('NODE SG02');
      expect(screen.getByTestId('remediation-motion-progress-bar').style.width).toBe('100%');
      expect(screen.getByTestId('remediation-step-isolation').getAttribute('data-status')).toBe('DONE');
      expect(screen.getByTestId('remediation-step-recalibration').getAttribute('data-status')).toBe('DONE');
      expect(screen.getByTestId('remediation-step-verification').getAttribute('data-status')).toBe('DONE');
    });

    it('activates CSS-based Isolation Zone pulsing warning border and animated background overlay for node BK01 when QUARANTINED', async () => {
      render(<CriticalNodesDashboard />);

      const bk01Card = screen.getByTestId('node-status-card-BK01');
      expect(bk01Card.getAttribute('data-isolation-zone')).toBe('INACTIVE');
      expect(screen.queryByTestId('isolation-zone-overlay-BK01')).toBeNull();

      // Quarantine BK01
      const quarantineBtn = screen.getByTestId('btn-simulate-bk01-quarantine');
      fireEvent.click(quarantineBtn);

      expect(bk01Card.getAttribute('data-status')).toBe('QUARANTINED');
      expect(bk01Card.getAttribute('data-isolation-zone')).toBe('ACTIVE');
      expect(bk01Card.className).toContain('isolation-zone-pulse');
      expect(bk01Card.className).toContain('bk01-isolation-zone');

      const overlay = screen.getByTestId('isolation-zone-overlay-BK01');
      expect(overlay).toBeTruthy();
      expect(overlay.className).toContain('isolation-zone-overlay');
      expect(screen.getByTestId('isolation-zone-banner-BK01').textContent).toContain(
        'ISOLATION ZONE'
      );

      // Restore BK01 to PURE GREEN via NodeRemediationEngine
      await act(async () => {
        await NodeRemediationEngine.triggerRemediation('BK01');
      });

      expect(bk01Card.getAttribute('data-status')).toBe('PURE GREEN');
      expect(bk01Card.getAttribute('data-isolation-zone')).toBe('INACTIVE');
      expect(screen.queryByTestId('isolation-zone-overlay-BK01')).toBeNull();
    });
  });
});
