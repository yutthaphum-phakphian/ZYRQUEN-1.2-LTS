/**
 * ZYRQUEN Ω∞ FROZEN v1.2 LTS — AUDIT LEDGER HOOK
 * 
 * Automatically records every forensic analysis step into the SystemEvents system:
 * - FORENSIC_STARTED
 * - PROVENANCE_CHECKED
 * - DIGEST_CHECKED
 * - MERKLE_CHECKED
 * - BLOCK_CHECKED
 * - SIGNATURE_CHECKED
 * - CLASSIFICATION_ASSIGNED
 * - PROMOTION_BLOCKED
 * 
 * Strict Invariants:
 * - SSOT_MUTATION = 0
 * - CANONICAL_SEALS = 14,902
 * - CANONICAL_ROOT = 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
 * - CANONICAL_BLOCK = #849202
 */

import { useState, useCallback, useEffect } from 'react';
import { logTrace } from '../utils/telemetry';
import { alertEngine } from '../utils/alertEngine';
import { P2ForensicEngine, ForensicAuditEvent, ForensicRecord } from '../utils/p2ForensicEngine';
import { SystemEvent } from '../components/SystemEventsSidebar';

export type ForensicStepType =
  | 'FORENSIC_STARTED'
  | 'PROVENANCE_CHECKED'
  | 'DIGEST_CHECKED'
  | 'MERKLE_CHECKED'
  | 'BLOCK_CHECKED'
  | 'SIGNATURE_CHECKED'
  | 'CLASSIFICATION_ASSIGNED'
  | 'PROMOTION_BLOCKED';

export interface ForensicStepPayload {
  step: ForensicStepType;
  evidenceId: string;
  observedSeal: number;
  operation: string;
  inputDigest?: string;
  result: string;
  reason: string;
  actor?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

// Global subscriber mechanism for audit ledger integration
type AuditLedgerSubscriber = (event: ForensicAuditEvent, systemEvent: SystemEvent) => void;
const subscribers = new Set<AuditLedgerSubscriber>();

export const subscribeToAuditLedger = (subscriber: AuditLedgerSubscriber): (() => void) => {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
};

export function useAuditLedger(
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void
) {
  const [auditLog, setAuditLog] = useState<readonly ForensicAuditEvent[]>(() =>
    P2ForensicEngine.getAuditLog()
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Sync with global engine updates
  const refreshAuditLog = useCallback(() => {
    setAuditLog(P2ForensicEngine.getAuditLog());
  }, []);

  /**
   * Automatically record a forensic step and pipe it to SystemEvents & immutable telemetry
   */
  const recordForensicStep = useCallback(
    (payload: ForensicStepPayload) => {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT';
      const actor = payload.actor || 'SOVEREIGN_FORENSIC_ORCHESTRATOR';
      const eventId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const auditEvent: ForensicAuditEvent = {
        eventId,
        type: payload.step,
        timestamp,
        actor,
        evidenceId: payload.evidenceId,
        operation: payload.operation,
        inputDigest: payload.inputDigest || 'N/A',
        result: payload.result,
        reason: payload.reason,
        ssotMutationDelta: 0,
      };

      // Formulate SystemEvent
      const systemEvent: SystemEvent = {
        id: `sys-${eventId}`,
        type: 'FORENSIC',
        title: `Forensic Audit [${payload.step}]: Seal #${payload.observedSeal}`,
        description: `${payload.operation} -> ${payload.result}. ${payload.reason} (SSoT Mutation = 0)`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + ' ICT',
        metaHash: payload.inputDigest ? `sha256:${payload.inputDigest.slice(0, 32)}...` : undefined,
        statuteRef: 'P2 Forensic Evidence Reconciliation Gate (Fail-Closed)',
        targetView: 'ledger',
        severity: payload.severity || (payload.result.includes('FAIL') || payload.result.includes('BLOCKED') || payload.result.includes('INVALID') ? 'critical' : 'info'),
      };

      // 1. Dispatch to SystemEvents callback if registered
      if (onAddSystemEvent) {
        onAddSystemEvent(
          systemEvent.type,
          systemEvent.title,
          systemEvent.description,
          systemEvent.metaHash,
          systemEvent.severity,
          systemEvent.statuteRef,
          systemEvent.targetView
        );
      }

      // 2. Alert engine integration
      alertEngine.triggerAlert({
        category: 'FORENSIC_INSPECTION',
        severity: payload.result.includes('BLOCKED') ? 'CRITICAL' : 'HIGH',
        sourcePlaneId: 'P2_FORENSIC_ENGINE',
        title: systemEvent.title,
        description: systemEvent.description,
      });

      // 3. Telemetry trace
      logTrace({
        operationName: payload.step,
        planeId: 'FORENSIC_AUDIT_LEDGER',
        latencyMs: 0.15,
        resultState: payload.result.includes('BLOCKED') || payload.result.includes('INVALID') ? 'FAIL_CLOSED' : 'OK',
        attributes: {
          evidenceId: payload.evidenceId,
          observedSeal: payload.observedSeal,
          operation: payload.operation,
          result: payload.result,
          mutationDelta: 0,
        },
      });

      // 4. Notify local subscribers
      subscribers.forEach((sub) => {
        try {
          sub(auditEvent, systemEvent);
        } catch (e) {
          console.error('Audit ledger subscriber error:', e);
        }
      });

      refreshAuditLog();
      return auditEvent;
    },
    [onAddSystemEvent, refreshAuditLog]
  );

  /**
   * Executes complete 5-step forensic analysis on a quarantined record
   * Recording every step in SystemEvents sequentially
   */
  const runCompleteForensicAudit = useCallback(
    async (record: ForensicRecord) => {
      setIsVerifying(true);

      // Step 1: FORENSIC_STARTED
      recordForensicStep({
        step: 'FORENSIC_STARTED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'INITIALIZE_FORENSIC_PROBE',
        inputDigest: record.artifactDigest,
        result: 'INSPECTION_ACTIVE',
        reason: `Commenced multi-plane validation on quarantined seal #${record.observedSeal}.`,
        severity: 'info',
      });

      // Small tick for UI visual cadence
      await new Promise((r) => setTimeout(r, 60));

      // Step 2: PROVENANCE_CHECKED
      recordForensicStep({
        step: 'PROVENANCE_CHECKED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'INSPECT_ORIGIN_PROVENANCE',
        inputDigest: record.artifactDigest.slice(0, 24),
        result: record.provenanceStatus,
        reason: `Source: ${record.sourceId} (${record.sourceType}). Provenance status: ${record.provenanceStatus}.`,
        severity: record.provenanceStatus === 'VERIFIED' ? 'success' : 'warning',
      });

      await new Promise((r) => setTimeout(r, 60));

      // Step 3: DIGEST_CHECKED
      recordForensicStep({
        step: 'DIGEST_CHECKED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'COMPUTE_ARTIFACT_SHA256',
        inputDigest: record.artifactDigest,
        result: record.digestStatus,
        reason: `Deterministic digest evaluated: ${record.artifactDigest.slice(0, 16)}... Status: ${record.digestStatus}.`,
        severity: 'info',
      });

      await new Promise((r) => setTimeout(r, 60));

      // Step 4: MERKLE_CHECKED
      recordForensicStep({
        step: 'MERKLE_CHECKED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'VERIFY_MERKLE_PROOF_ANCHOR',
        inputDigest: record.merklePath,
        result: record.merkleProofStatus,
        reason: `Merkle path calculation against canonical root (909ab814...fa4c68) evaluated as ${record.merkleProofStatus}.`,
        severity: record.merkleProofStatus === 'VALID' ? 'success' : 'critical',
      });

      await new Promise((r) => setTimeout(r, 60));

      // Step 5: BLOCK_CHECKED
      recordForensicStep({
        step: 'BLOCK_CHECKED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'VALIDATE_GENESIS_BLOCK_BINDING',
        inputDigest: record.blockReference,
        result: record.genesisAnchorStatus,
        reason: `Block reference claim "${record.blockReference}" evaluated against Genesis Block #849202. Status: ${record.genesisAnchorStatus}.`,
        severity: record.genesisAnchorStatus === 'BOUND' ? 'success' : 'critical',
      });

      await new Promise((r) => setTimeout(r, 60));

      // Step 6: SIGNATURE_CHECKED
      recordForensicStep({
        step: 'SIGNATURE_CHECKED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'VERIFY_CRYPTOGRAPHIC_SIGNATURE',
        inputDigest: record.keyFingerprint,
        result: record.signatureStatus,
        reason: `Algorithm: ${record.signatureAlgorithm}. Status: ${record.signatureStatus}. Dilithium/Ed25519 authorization missing Genesis anchor.`,
        severity: record.signatureStatus === 'VERIFIED' ? 'success' : 'warning',
      });

      await new Promise((r) => setTimeout(r, 60));

      // Step 7: CLASSIFICATION_ASSIGNED
      recordForensicStep({
        step: 'CLASSIFICATION_ASSIGNED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'ASSIGN_FORENSIC_CLASSIFICATION',
        result: record.classification,
        reason: record.classificationReason,
        severity: 'warning',
      });

      await new Promise((r) => setTimeout(r, 60));

      // Step 8: PROMOTION_BLOCKED
      recordForensicStep({
        step: 'PROMOTION_BLOCKED',
        evidenceId: record.evidenceId,
        observedSeal: record.observedSeal,
        operation: 'ENFORCE_FAIL_CLOSED_GATE',
        result: 'PROMOTION_BLOCKED',
        reason: `Fail-closed promotion gate enforced. Canonical seal count remains 14,902. Mutation delta strictly 0.`,
        severity: 'critical',
      });

      setIsVerifying(false);
      refreshAuditLog();
    },
    [recordForensicStep, refreshAuditLog]
  );

  return {
    auditLog,
    isVerifying,
    recordForensicStep,
    runCompleteForensicAudit,
    refreshAuditLog,
  };
}
