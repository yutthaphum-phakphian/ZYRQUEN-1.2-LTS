import { useState, useEffect, useCallback } from 'react';
import { telemetry, OtelSpan, PlanePerformanceSLO, logTrace } from '../utils/telemetry';
import { forensicSnapshotEngine, ForensicSnapshot } from '../utils/forensicSnapshot';

export type ExtensionHealthState =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'BLOCKED'
  | 'QUARANTINED'
  | 'RECOVERING'
  | 'DISABLED';

export interface SystemPlaneHealth {
  planeId: string;
  nameEn: string;
  nameTh: string;
  planeName?: string;
  healthState: ExtensionHealthState;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  sloMetrics?: {
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
  };
  throughputOpsSec: number;
  errorRatePercent: number;
  activeIncidentsCount: number;
  lastAttestedAt: string;
  description: string;
  failClosedPolicy: string;
}

export interface SecurityIncident {
  incidentId: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  affectedPlaneId: string;
  traceId: string;
  firstSeen: string;
  lastSeen: string;
  status: 'ACTIVE' | 'CONTAINED' | 'RESOLVED';
  containmentState: 'CONTAINED_FAIL_CLOSED' | 'INVESTIGATING' | 'RESOLVED_NON_CANONICAL';
  recoveryState: 'EXTENSION_RESTORED' | 'ISOLATED' | 'STANDBY';
  description: string;
  ssotMutationDelta: 0; // Invariant: always 0
}

const INITIAL_PLANES: SystemPlaneHealth[] = [
  {
    planeId: 'CRYPTO-VERIFY',
    nameEn: 'Deterministic Cryptographic Gate',
    nameTh: 'เกตตรวจสอบการเข้ารหัสดีเทอร์มินิสติก',
    healthState: 'HEALTHY',
    p50LatencyMs: 1.4,
    p95LatencyMs: 3.2,
    p99LatencyMs: 5.1,
    throughputOpsSec: 1420,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:04 ICT',
    description: 'Computes real-time WebCrypto SHA-256 digests and validates Ed25519 sovereign signatures.',
    failClosedPolicy: 'Deny admission on any byte digest mismatch or unknown provenance.',
  },
  {
    planeId: 'HARDWARE-TRUST',
    nameEn: 'Hardware HSM Sovereign Nodes',
    nameTh: 'โหนดฮาร์ดแวร์ความปลอดภัย HSM ระดับอธิปไตย',
    healthState: 'HEALTHY',
    p50LatencyMs: 4.8,
    p95LatencyMs: 9.1,
    p99LatencyMs: 14.5,
    throughputOpsSec: 840,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:10 ICT',
    description: 'Hardware crypto slots HSM-01 & HSM-02 with sub-Kelvin attestation locks.',
    failClosedPolicy: 'Block attestation promotion if physical key enclave does not respond.',
  },
  {
    planeId: 'EVIDENCE-INTAKE',
    nameEn: 'Evidence State Manager & Ledger',
    nameTh: 'ระบบจัดการสถานะหลักฐานและสมุดบัญชีตรวจสอบ',
    healthState: 'HEALTHY',
    p50LatencyMs: 2.1,
    p95LatencyMs: 4.6,
    p99LatencyMs: 7.8,
    throughputOpsSec: 1100,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:15 ICT',
    description: 'Maintains immutable event chaining across all incoming evidence artifacts.',
    failClosedPolicy: 'Append only. Never permit mutation of existing historical proof records.',
  },
  {
    planeId: 'QUARANTINE-FIREWALL',
    nameEn: 'Quarantine Mismatch Sandbox',
    nameTh: 'แซนด์บ็อกซ์กักกันหลักฐานที่ไม่ตรงกัน',
    healthState: 'HEALTHY',
    p50LatencyMs: 0.8,
    p95LatencyMs: 1.6,
    p99LatencyMs: 2.9,
    throughputOpsSec: 3200,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:18 ICT',
    description: 'Isolates tampered, mismatched, or unverified Candidate payloads from production.',
    failClosedPolicy: 'Hard block all promotion paths to canonical core.',
  },
  {
    planeId: 'TENANT-MATRIX',
    nameEn: 'Multi-Tenant Physical Isolation',
    nameTh: 'เมทริกซ์การแยกหน่วยงานแบบกายภาพ',
    healthState: 'HEALTHY',
    p50LatencyMs: 1.2,
    p95LatencyMs: 2.5,
    p99LatencyMs: 4.1,
    throughputOpsSec: 2400,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:20 ICT',
    description: 'Enforces strict tenant boundaries (TNT-TH-001 vs TNT-TH-002) with 0 cross-leakage.',
    failClosedPolicy: 'Reject all cross-tenant reference attempts at policy layer.',
  },
  {
    planeId: 'PROMOTION-FIREWALL',
    nameEn: 'Zero-Trust Promotion Firewall',
    nameTh: 'ไฟร์วอลล์ตรวจสอบการเลื่อนขั้นซีโร่ทรัสต์',
    healthState: 'HEALTHY',
    p50LatencyMs: 1.0,
    p95LatencyMs: 2.1,
    p99LatencyMs: 3.8,
    throughputOpsSec: 1950,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:22 ICT',
    description: '14-step release gate firewall verifying identity, SBOM, policy, and recovery readiness.',
    failClosedPolicy: 'Intercept and block all unauthorized write attempts to Frozen Core #849202.',
  },
  {
    planeId: 'DIGITAL-TWIN',
    nameEn: 'FIOS Digital Twin Stress Sandbox',
    nameTh: 'แซนด์บ็อกซ์จำลองความเครียดดิจิทัลทวิน FIOS',
    healthState: 'HEALTHY',
    p50LatencyMs: 18.5,
    p95LatencyMs: 34.2,
    p99LatencyMs: 48.9,
    throughputOpsSec: 320,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:25 ICT',
    description: 'Runs Monte Carlo non-live simulations for FIOS factor models with no trading authority.',
    failClosedPolicy: 'Simulation results are strictly non-canonical and non-live.',
  },
  {
    planeId: 'RECOVERY-ENGINE',
    nameEn: 'Crash-Safe Extension Recovery',
    nameTh: 'ระบบกู้คืนส่วนขยายที่ปลอดภัยจากเหตุขัดข้อง',
    healthState: 'HEALTHY',
    p50LatencyMs: 3.4,
    p95LatencyMs: 6.8,
    p99LatencyMs: 10.2,
    throughputOpsSec: 620,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastAttestedAt: '2026-08-23 09:12:28 ICT',
    description: 'Automates rollback and recovery of extension planes while leaving Frozen Core untouched.',
    failClosedPolicy: 'Frozen Core is never a recovery or migration target.',
  },
];

const INITIAL_INCIDENTS: SecurityIncident[] = [
  {
    incidentId: 'INC-PH20-901',
    severity: 'CRITICAL',
    affectedPlaneId: 'PROMOTION-FIREWALL',
    traceId: 'TRACE-P20-8849-01',
    firstSeen: '2026-08-23 08:55:10 ICT',
    lastSeen: '2026-08-23 08:55:10 ICT',
    status: 'CONTAINED',
    containmentState: 'CONTAINED_FAIL_CLOSED',
    recoveryState: 'EXTENSION_RESTORED',
    description: 'Synthetic CANONICAL_WRITE attack intercepted. Zero mutations to Frozen Block #849202.',
    ssotMutationDelta: 0,
  },
  {
    incidentId: 'INC-PH20-902',
    severity: 'HIGH',
    affectedPlaneId: 'TENANT-MATRIX',
    traceId: 'TRACE-P20-8849-02',
    firstSeen: '2026-08-23 09:02:44 ICT',
    lastSeen: '2026-08-23 09:02:44 ICT',
    status: 'CONTAINED',
    containmentState: 'CONTAINED_FAIL_CLOSED',
    recoveryState: 'ISOLATED',
    description: 'Cross-tenant namespace breach attempt (TNT-TH-001 -> TNT-TH-002) blocked by Rule 9.',
    ssotMutationDelta: 0,
  },
];

class HealthStateManager {
  private planes: SystemPlaneHealth[] = [...INITIAL_PLANES];
  private incidents: SecurityIncident[] = [...INITIAL_INCIDENTS];
  private listeners: Array<() => void> = [];

  public getPlanes(): SystemPlaneHealth[] {
    return [...this.planes];
  }

  public getIncidents(): SecurityIncident[] {
    return [...this.incidents];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public updatePlaneHealth(
    planeId: string,
    healthState: ExtensionHealthState,
    reason?: string
  ): void {
    const { span, finish } = telemetry.startSpan('UPDATE_PLANE_HEALTH', planeId, {
      'health.new_state': healthState,
      'health.reason': reason || 'Admin state change',
    });

    this.planes = this.planes.map((p) => {
      if (p.planeId === planeId) {
        return {
          ...p,
          healthState,
          lastAttestedAt: new Date().toLocaleTimeString('en-GB') + ' ICT',
        };
      }
      return p;
    });

    finish('OK');
    this.notify();
  }

  public triggerChaosDrill(planeId: string): SecurityIncident {
    const plane = this.planes.find((p) => p.planeId === planeId) || this.planes[0];
    const incidentId = `INC-CHAOS-${Date.now().toString().slice(-4)}`;
    const traceId = `TRACE-P20-${Math.random().toString(16).slice(2, 10)}`;

    const { finish } = telemetry.startSpan('CHAOS_DRILL_INJECTION', planeId, {
      'chaos.incident_id': incidentId,
      'chaos.affected_plane': plane.nameEn,
    });

    const newIncident: SecurityIncident = {
      incidentId,
      severity: 'HIGH',
      affectedPlaneId: planeId,
      traceId,
      firstSeen: new Date().toLocaleTimeString('en-GB') + ' ICT',
      lastSeen: new Date().toLocaleTimeString('en-GB') + ' ICT',
      status: 'ACTIVE',
      containmentState: 'CONTAINED_FAIL_CLOSED',
      recoveryState: 'STANDBY',
      description: `Chaos injection test on ${plane.nameEn}. Fail-closed containment engaged automatically.`,
      ssotMutationDelta: 0,
    };

    this.incidents = [newIncident, ...this.incidents];

    // Automatically capture READ-ONLY Forensic Snapshot for HIGH/CRITICAL incident
    forensicSnapshotEngine.captureSnapshot(newIncident, 'CHAOS_DRILL_HIGH_SEVERITY');

    this.planes = this.planes.map((p) => {
      if (p.planeId === planeId) {
        return {
          ...p,
          healthState: 'DEGRADED',
          activeIncidentsCount: p.activeIncidentsCount + 1,
          p95LatencyMs: Number((p.p95LatencyMs * 2.8).toFixed(1)),
          lastAttestedAt: new Date().toLocaleTimeString('en-GB') + ' ICT',
        };
      }
      return p;
    });

    finish('FAIL_CLOSED', 'Chaos drill engaged fail-closed boundary');
    this.notify();
    return newIncident;
  }

  public reportIncident(
    severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL',
    affectedPlaneId: string,
    description: string
  ): SecurityIncident {
    const incidentId = `INC-SEC-${Date.now().toString().slice(-4)}`;
    const traceId = `TRACE-P20-${Math.random().toString(16).slice(2, 10)}`;

    const { finish } = telemetry.startSpan('REPORT_INCIDENT', affectedPlaneId, {
      'incident.severity': severity,
      'incident.id': incidentId,
    });

    const incident: SecurityIncident = {
      incidentId,
      severity,
      affectedPlaneId,
      traceId,
      firstSeen: new Date().toLocaleTimeString('en-GB') + ' ICT',
      lastSeen: new Date().toLocaleTimeString('en-GB') + ' ICT',
      status: 'ACTIVE',
      containmentState: 'CONTAINED_FAIL_CLOSED',
      recoveryState: 'STANDBY',
      description,
      ssotMutationDelta: 0,
    };

    this.incidents = [incident, ...this.incidents];

    // Capture Forensic Snapshot on HIGH/CRITICAL
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      forensicSnapshotEngine.captureSnapshot(incident, `INCIDENT_REPORT_${severity}`);
    }

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      this.planes = this.planes.map((p) => {
        if (p.planeId === affectedPlaneId) {
          return {
            ...p,
            healthState: severity === 'CRITICAL' ? 'BLOCKED' : 'DEGRADED',
            activeIncidentsCount: p.activeIncidentsCount + 1,
          };
        }
        return p;
      });
    }

    finish(severity === 'CRITICAL' || severity === 'HIGH' ? 'FAIL_CLOSED' : 'OK');
    this.notify();
    return incident;
  }

  public resolveIncident(incidentId: string): void {
    const inc = this.incidents.find((i) => i.incidentId === incidentId);
    if (!inc) return;

    const { finish } = telemetry.startSpan('RESOLVE_INCIDENT', inc.affectedPlaneId, {
      'incident.id': incidentId,
    });

    this.incidents = this.incidents.map((i) => {
      if (i.incidentId === incidentId) {
        return {
          ...i,
          status: 'RESOLVED',
          containmentState: 'RESOLVED_NON_CANONICAL',
          recoveryState: 'EXTENSION_RESTORED',
        };
      }
      return i;
    });

    this.planes = this.planes.map((p) => {
      if (p.planeId === inc.affectedPlaneId) {
        const remaining = this.incidents.filter(
          (i) => i.affectedPlaneId === p.planeId && i.status === 'ACTIVE'
        ).length;
        return {
          ...p,
          healthState: remaining === 0 ? 'HEALTHY' : 'DEGRADED',
          activeIncidentsCount: remaining,
          p95LatencyMs: Number((p.p50LatencyMs * 2.2).toFixed(1)),
        };
      }
      return p;
    });

    finish('OK');
    this.notify();
  }

  public recoverAllPlanes(): void {
    const { finish } = telemetry.startSpan('RECOVER_ALL_PLANES', 'RECOVERY-ENGINE', {
      'recovery.scope': 'ALL_EXTENSION_PLANES',
      'recovery.frozen_core': 'PRESERVED_NO_WRITE',
    });

    this.planes = INITIAL_PLANES.map((p) => ({
      ...p,
      healthState: 'HEALTHY',
      activeIncidentsCount: 0,
      lastAttestedAt: new Date().toLocaleTimeString('en-GB') + ' ICT',
    }));

    this.incidents = this.incidents.map((i) => ({
      ...i,
      status: 'RESOLVED',
      containmentState: 'RESOLVED_NON_CANONICAL',
      recoveryState: 'EXTENSION_RESTORED',
    }));

    finish('OK');
    this.notify();
  }
}

export const healthStateManager = new HealthStateManager();

export function useExtensionHealth(
  onSystemEvent?: (
    type: 'CRYPTO' | 'HARDWARE' | 'COMPLIANCE' | 'SECURITY' | 'INVARIANT' | 'EVIDENCE_IMPORTED' | 'FORENSIC' | 'WARNING' | 'ALERT',
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'info' | 'warning' | 'critical' | 'success'
  ) => void
) {
  const [planes, setPlanes] = useState<SystemPlaneHealth[]>(healthStateManager.getPlanes());
  const [incidents, setIncidents] = useState<SecurityIncident[]>(healthStateManager.getIncidents());
  const [snapshots, setSnapshots] = useState<ForensicSnapshot[]>(forensicSnapshotEngine.getSnapshots());

  useEffect(() => {
    const unsubHealth = healthStateManager.subscribe(() => {
      setPlanes(healthStateManager.getPlanes());
      setIncidents(healthStateManager.getIncidents());
    });

    const unsubForensics = forensicSnapshotEngine.subscribe(() => {
      setSnapshots(forensicSnapshotEngine.getSnapshots());
    });

    return () => {
      unsubHealth();
      unsubForensics();
    };
  }, []);

  const dispatchSystemEvent = useCallback(
    (
      type: 'CRYPTO' | 'HARDWARE' | 'COMPLIANCE' | 'SECURITY' | 'INVARIANT' | 'EVIDENCE_IMPORTED' | 'FORENSIC' | 'WARNING' | 'ALERT',
      title: string,
      description: string,
      metaHash?: string,
      severity?: 'info' | 'warning' | 'critical' | 'success'
    ) => {
      if (onSystemEvent) {
        onSystemEvent(type, title, description, metaHash, severity);
      }
    },
    [onSystemEvent]
  );

  const reportIncident = useCallback(
    (
      severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL',
      affectedPlaneId: string,
      description: string
    ) => {
      const inc = healthStateManager.reportIncident(severity, affectedPlaneId, description);
      if (onSystemEvent) {
        onSystemEvent(
          'SECURITY',
          `Incident Reported [${severity}]: ${affectedPlaneId}`,
          `${description} (Trace: ${inc.traceId}, SSoT Mutation: 0)`,
          `incident:${inc.incidentId}`,
          severity === 'CRITICAL' ? 'critical' : severity === 'HIGH' ? 'warning' : 'info'
        );
      }
      return inc;
    },
    [onSystemEvent]
  );

  const triggerChaos = useCallback(
    (planeId: string) => {
      const inc = healthStateManager.triggerChaosDrill(planeId);
      if (onSystemEvent) {
        onSystemEvent(
          'SECURITY',
          `Chaos Drill Triggered: ${planeId}`,
          `Fail-closed containment engaged. Trace ${inc.traceId} logged. Forensic snapshot captured. SSoT Mutation = 0.`,
          `trace:${inc.traceId}`,
          'warning'
        );
      }
    },
    [onSystemEvent]
  );

  const resolveIncident = useCallback(
    (incidentId: string) => {
      healthStateManager.resolveIncident(incidentId);
      if (onSystemEvent) {
        onSystemEvent(
          'SECURITY',
          `Incident Resolved: ${incidentId}`,
          `Extension plane restored. Zero mutations made to Frozen Block #849202.`,
          `incident:${incidentId}`,
          'success'
        );
      }
    },
    [onSystemEvent]
  );

  const recoverAll = useCallback(() => {
    healthStateManager.recoverAllPlanes();
    if (onSystemEvent) {
      onSystemEvent(
        'SECURITY',
        'Global Extension Recovery Executed',
        'All 8 extension planes restored to checkpoint CP-994. Frozen Core #849202 remained untouched.',
        'recovery:all_planes_harmonized',
        'success'
      );
    }
  }, [onSystemEvent]);

  const updatePlaneHealth = useCallback(
    (planeId: string, state: ExtensionHealthState, reason?: string) => {
      healthStateManager.updatePlaneHealth(planeId, state, reason);
    },
    []
  );

  const hasCriticalIncidents = incidents.some((i) => i.status === 'ACTIVE' && i.severity === 'CRITICAL');
  const hasDegradedPlanes = planes.some((p) => p.healthState !== 'HEALTHY');

  const systemOverallHealth: 'OPTIMAL' | 'DEGRADED' | 'CONTAINED_FAIL_CLOSED' = hasCriticalIncidents
    ? 'CONTAINED_FAIL_CLOSED'
    : hasDegradedPlanes
    ? 'DEGRADED'
    : 'OPTIMAL';

  return {
    planes,
    incidents,
    snapshots,
    systemOverallHealth,
    dispatchSystemEvent,
    reportIncident,
    triggerChaos,
    resolveIncident,
    recoverAll,
    updatePlaneHealth,
  };
}
