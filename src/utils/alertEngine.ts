/**
 * ZYRQUEN Ω∞ — Policy-Driven Alert Engine
 * Handles severity classification (INFO, WARNING, HIGH, CRITICAL),
 * anomaly detection (Merkle mismatch, policy drift, hardware fault, canonical write intercept),
 * and dispatches auditable alerts into the system event stream and forensic snapshot engine.
 */

import { forensicSnapshotEngine } from './forensicSnapshot';
import { telemetry, logTrace } from './telemetry';
import { SecurityIncident } from '../hooks/useExtensionHealth';

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AlertCategory =
  | 'MERKLE_INTEGRITY'
  | 'POLICY_DRIFT'
  | 'HARDWARE_HSM'
  | 'SUPPLY_CHAIN'
  | 'CANONICAL_WRITE_ATTEMPT'
  | 'TENANT_BREACH'
  | 'SECRET_EXPOSURE'
  | 'ADVERSARIAL_ATTACK'
  | 'EXTENSION_HEALTH'
  | 'FORENSIC_INSPECTION';

export interface SystemAlert {
  alertId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  sourcePlaneId: string;
  traceId: string;
  spanId: string;
  timestamp: string;
  epoch: number;
  containmentPolicy: 'FAIL_CLOSED' | 'QUARANTINE' | 'AUDIT_ONLY' | 'REJECT_MUTATION';
  ssotMutationDelta: 0; // Strict invariant: always 0
  metadata: Record<string, string | number | boolean>;
  acknowledged: boolean;
}

type AlertListener = (alert: SystemAlert) => void;

class AlertEngine {
  private alerts: SystemAlert[] = [];
  private listeners: AlertListener[] = [];
  private onSystemEventCallback?: (
    type: 'CRYPTO' | 'HARDWARE' | 'COMPLIANCE' | 'SECURITY' | 'INVARIANT' | 'EVIDENCE_IMPORTED' | 'FORENSIC' | 'WARNING' | 'ALERT',
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'info' | 'warning' | 'critical' | 'success'
  ) => void;

  constructor() {
    this.seedInitialAlerts();
  }

  private seedInitialAlerts() {
    this.alerts = [
      {
        alertId: 'ALT-P21-001',
        category: 'CANONICAL_WRITE_ATTEMPT',
        severity: 'CRITICAL',
        title: 'Canonical Core Write Intercepted',
        description: 'Candidate payload #940120 attempted write to Frozen Core #849202. Intercepted by Promotion Firewall.',
        sourcePlaneId: 'PROMOTION-FIREWALL',
        traceId: 'TRACE-P20-8849-01',
        spanId: 'SP-ALT-001',
        timestamp: '2026-08-23 09:15:02 ICT',
        epoch: Date.now() - 600000,
        containmentPolicy: 'FAIL_CLOSED',
        ssotMutationDelta: 0,
        metadata: {
          'core.target_block': '#849202',
          'candidate.block': '#940120',
          'core.immutable_seals': 14902,
        },
        acknowledged: true,
      },
      {
        alertId: 'ALT-P21-002',
        category: 'TENANT_BREACH',
        severity: 'HIGH',
        title: 'Cross-Tenant Access Intercepted',
        description: 'Tenant TNT-TH-001 attempted cross-boundary reference to TNT-TH-002 sovereign key vault.',
        sourcePlaneId: 'TENANT-MATRIX',
        traceId: 'TRACE-P20-8849-02',
        spanId: 'SP-ALT-002',
        timestamp: '2026-08-23 09:20:45 ICT',
        epoch: Date.now() - 300000,
        containmentPolicy: 'QUARANTINE',
        ssotMutationDelta: 0,
        metadata: {
          'tenant.source': 'TNT-TH-001',
          'tenant.target': 'TNT-TH-002',
          'policy.rule': 'RULE-04-PHYSICAL-SILO',
        },
        acknowledged: false,
      },
      {
        alertId: 'ALT-P21-003',
        category: 'SUPPLY_CHAIN',
        severity: 'WARNING',
        title: 'Candidate SBOM Digest Discrepancy',
        description: 'Unattested candidate package v2.1.0-rc3 pending multi-signature release attestation.',
        sourcePlaneId: 'RECOVERY-ENGINE',
        traceId: 'TRACE-P21-1002',
        spanId: 'SP-ALT-003',
        timestamp: '2026-08-23 09:25:11 ICT',
        epoch: Date.now() - 120000,
        containmentPolicy: 'QUARANTINE',
        ssotMutationDelta: 0,
        metadata: {
          'package.name': 'zyrquen-extension-analytics',
          'sbom.status': 'PENDING_VERIFICATION',
        },
        acknowledged: false,
      },
    ];
  }

  public registerSystemEventHandler(
    handler: (
      type: 'CRYPTO' | 'HARDWARE' | 'COMPLIANCE' | 'SECURITY' | 'INVARIANT' | 'EVIDENCE_IMPORTED' | 'FORENSIC' | 'WARNING' | 'ALERT',
      title: string,
      description: string,
      metaHash?: string,
      severity?: 'info' | 'warning' | 'critical' | 'success'
    ) => void
  ) {
    this.onSystemEventCallback = handler;
  }

  public triggerAlert(params: {
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    description: string;
    sourcePlaneId: string;
    metadata?: Record<string, string | number | boolean>;
    containmentPolicy?: 'FAIL_CLOSED' | 'QUARANTINE' | 'AUDIT_ONLY' | 'REJECT_MUTATION';
  }): SystemAlert {
    const traceId = `TRACE-ALT-${Math.random().toString(16).slice(2, 10)}`;
    const spanId = `SP-ALT-${Math.random().toString(16).slice(2, 8)}`;
    const alertId = `ALT-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const alert: SystemAlert = {
      alertId,
      category: params.category,
      severity: params.severity,
      title: params.title,
      description: params.description,
      sourcePlaneId: params.sourcePlaneId,
      traceId,
      spanId,
      timestamp: now.toLocaleTimeString('en-GB') + ' ICT',
      epoch: now.getTime(),
      containmentPolicy: params.containmentPolicy || (params.severity === 'CRITICAL' ? 'FAIL_CLOSED' : 'QUARANTINE'),
      ssotMutationDelta: 0,
      metadata: params.metadata || {},
      acknowledged: false,
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 100) {
      this.alerts.pop();
    }

    // Log to OpenTelemetry fabric
    logTrace({
      traceId,
      spanId,
      operationName: `ALERT_TRIGGER_${params.category}`,
      planeId: params.sourcePlaneId,
      latencyMs: 0.2,
      resultState: params.severity === 'CRITICAL' ? 'FAIL_CLOSED' : params.severity === 'HIGH' ? 'BLOCKED' : 'OK',
      attributes: {
        'alert.id': alertId,
        'alert.severity': params.severity,
        'alert.title': params.title,
        ...(params.metadata || {}),
      },
    });

    // Automatically trigger forensic snapshot on HIGH or CRITICAL alert
    if (params.severity === 'HIGH' || params.severity === 'CRITICAL') {
      const incidentWrapper: SecurityIncident = {
        incidentId: `INC-${alertId}`,
        severity: params.severity,
        affectedPlaneId: params.sourcePlaneId,
        traceId,
        firstSeen: alert.timestamp,
        lastSeen: alert.timestamp,
        status: 'ACTIVE',
        containmentState: 'CONTAINED_FAIL_CLOSED',
        recoveryState: 'STANDBY',
        description: `[${params.category}] ${params.title}: ${params.description}`,
        ssotMutationDelta: 0,
      };
      forensicSnapshotEngine.captureSnapshot(incidentWrapper, `ALERT_ENGINE_${params.severity}`);
    }

    // Dispatch to system events log if bound
    if (this.onSystemEventCallback) {
      const mapSeverity: Record<AlertSeverity, 'info' | 'warning' | 'critical' | 'success'> = {
        INFO: 'info',
        WARNING: 'warning',
        HIGH: 'warning',
        CRITICAL: 'critical',
      };
      this.onSystemEventCallback(
        'ALERT',
        `[${params.severity}] ${params.title}`,
        `${params.description} (Trace: ${traceId}, SSoT Mutation: 0)`,
        `alert:${alertId}`,
        mapSeverity[params.severity]
      );
    }

    this.notify(alert);
    return alert;
  }

  public acknowledgeAlert(alertId: string) {
    this.alerts = this.alerts.map((a) => (a.alertId === alertId ? { ...a, acknowledged: true } : a));
    this.notify(this.alerts.find((a) => a.alertId === alertId)!);
  }

  public getAlerts(): SystemAlert[] {
    return [...this.alerts];
  }

  public subscribe(listener: AlertListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(alert: SystemAlert) {
    this.listeners.forEach((l) => {
      try {
        l(alert);
      } catch {
        // ignore subscriber errors
      }
    });
  }
}

export const alertEngine = new AlertEngine();
