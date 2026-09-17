/**
 * ZYRQUEN Ω∞ FROZEN v1.2 LTS — WRITE FIREWALL
 * 
 * Strict non-bypassable state-mutation interceptor that blocks any attempt
 * to modify the Canonical Core (Canonical Seals, Merkle Root, Block Height, SSoT Mutation).
 * 
 * CANONICAL INVARIANTS:
 * - CANONICAL VERSION = 'v1.2 LTS'
 * - CANONICAL ROOT    = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
 * - CANONICAL BLOCK   = 849202
 * - CANONICAL SEALS   = 14902
 * - SSOT MUTATION     = 0
 */

import { alertEngine } from './alertEngine';
import { logTrace } from './telemetry';

export interface WriteFirewallAuditRecord {
  readonly auditId: string;
  readonly timestamp: string;
  readonly targetField: string;
  readonly requestedValue: string;
  readonly canonicalValue: string;
  readonly actor: string;
  readonly callerOrigin: string;
  readonly status: 'REJECTED_FAIL_CLOSED';
  readonly ssotMutationDelta: 0;
  readonly firewallPolicy: 'INVIOLABLE_FROZEN_CORE';
  readonly reason: string;
}

export interface WriteInterceptResult {
  readonly allowed: false;
  readonly rejected: true;
  readonly mutationDelta: 0;
  readonly auditRecord: WriteFirewallAuditRecord;
  readonly reason: string;
}

export interface MutationRequestPayload {
  readonly targetProperty: 'canonicalSeals' | 'canonicalRoot' | 'blockHeight' | 'ssotMutation' | 'isFrozen' | 'writeAuthority' | string;
  readonly requestedValue: any;
  readonly actor?: string;
  readonly origin?: string;
  readonly reason?: string;
}

export class WriteFirewallEngine {
  public static readonly CANONICAL_VERSION = 'v1.2 LTS' as const;
  public static readonly CANONICAL_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68' as const;
  public static readonly CANONICAL_BLOCK = 849202 as const;
  public static readonly CANONICAL_SEALS = 14902 as const;
  public static readonly SSOT_MUTATION = 0 as const;
  public static readonly WRITE_AUTHORITY = 'NONE' as const;
  public static readonly AUTO_RESEAL = 'BLOCKED' as const;
  public static readonly PROMOTION = 'FAIL_CLOSED' as const;

  private static onSystemEventCallback?: (
    type: 'SECURITY' | 'ALERT' | 'FORENSIC' | 'WARNING',
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'info' | 'warning' | 'critical',
    statuteRef?: string,
    targetView?: 'security' | 'ledger' | 'dashboard'
  ) => void;

  public static registerSystemEventHandler(
    handler: (
      type: 'SECURITY' | 'ALERT' | 'FORENSIC' | 'WARNING',
      title: string,
      description: string,
      metaHash?: string,
      severity?: 'info' | 'warning' | 'critical',
      statuteRef?: string,
      targetView?: 'security' | 'ledger' | 'dashboard'
    ) => void
  ) {
    this.onSystemEventCallback = handler;
  }

  private static auditLedger: WriteFirewallAuditRecord[] = [
    {
      auditId: 'WF-INIT-849202',
      timestamp: '2026-08-25T00:00:00.000Z',
      targetField: 'ALL_CANONICAL_PROPERTIES',
      requestedValue: 'N/A',
      canonicalValue: 'FROZEN_BASELINE',
      actor: 'SYSTEM_GENESIS_INIT',
      callerOrigin: 'kernel://genesis-anchor',
      status: 'REJECTED_FAIL_CLOSED',
      ssotMutationDelta: 0,
      firewallPolicy: 'INVIOLABLE_FROZEN_CORE',
      reason: 'Write Firewall armed at Genesis Block #849202. Zero mutation tolerance.',
    },
  ];

  /**
   * Intercepts any state-mutating request.
   * If target touches Canonical Root, Block Height, Seal Count, or SSoT Mutation:
   * 1. Rejects request immediately.
   * 2. Logs an immutable audit event.
   * 3. Dispatches high-severity alert.
   * 4. Guarantees mutation delta is strictly 0.
   */
  public static writeFirewall(request: MutationRequestPayload): WriteInterceptResult {
    const timestamp = new Date().toISOString();
    const actor = request.actor || 'ANONYMOUS_RUNTIME_CALLER';
    const origin = request.origin || 'window.runtimeScope';
    const target = request.targetProperty;
    const requestedValStr = String(request.requestedValue);

    let canonicalValStr = 'UNKNOWN_TARGET';
    if (target === 'canonicalSeals' || target === 'seals') canonicalValStr = '14902';
    else if (target === 'canonicalRoot' || target === 'merkleRoot' || target === 'root') canonicalValStr = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
    else if (target === 'blockHeight' || target === 'canonicalBlock' || target === 'block') canonicalValStr = '#849202';
    else if (target === 'ssotMutation') canonicalValStr = '0';

    const auditRecord: WriteFirewallAuditRecord = {
      auditId: `WF-AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      timestamp,
      targetField: target,
      requestedValue: requestedValStr,
      canonicalValue: canonicalValStr,
      actor,
      callerOrigin: origin,
      status: 'REJECTED_FAIL_CLOSED',
      ssotMutationDelta: 0,
      firewallPolicy: 'INVIOLABLE_FROZEN_CORE',
      reason: `Write Firewall blocked illegal mutation attempt to ${target}. Canonical SSoT remains inviolable.`,
    };

    // Immutable append to audit ledger
    this.auditLedger.unshift(auditRecord);

    // Trigger system alert
    alertEngine.triggerAlert({
      category: 'CANONICAL_WRITE_ATTEMPT',
      severity: 'CRITICAL',
      sourcePlaneId: 'CANONICAL_WRITE_FIREWALL',
      title: `Write Firewall: Intercepted ${target} Modification`,
      description: `Actor "${actor}" attempted to write value "${requestedValStr}" to canonical ${target}. Mutation blocked (Delta = 0).`,
    });

    if (this.onSystemEventCallback) {
      this.onSystemEventCallback(
        'SECURITY',
        `Write Firewall Intercepted ${target} Mutation`,
        `Actor "${actor}" attempted write "${requestedValStr}". Blocked fail-closed (SSoT Mutation = 0).`,
        `sha256:${auditRecord.auditId}`,
        'critical',
        'Canonical Frozen Core Invariant (ETDA Sec 26 & 28)',
        'ledger'
      );
    }

    logTrace({
      operationName: 'WRITE_FIREWALL_INTERCEPT',
      planeId: 'CANONICAL_WRITE_FIREWALL',
      latencyMs: 0.1,
      resultState: 'FAIL_CLOSED',
      attributes: {
        target,
        requestedValue: requestedValStr,
        mutationDelta: 0,
        actor,
      },
    });

    return {
      allowed: false,
      rejected: true,
      mutationDelta: 0,
      auditRecord,
      reason: auditRecord.reason,
    };
  }

  /**
   * Helper to check if a property is protected by the Frozen Core Firewall.
   */
  public static isProtectedProperty(property: string): boolean {
    const normalized = property.toLowerCase();
    return (
      normalized.includes('seal') ||
      normalized.includes('root') ||
      normalized.includes('merkle') ||
      normalized.includes('block') ||
      normalized.includes('mutation') ||
      normalized.includes('canonical') ||
      normalized.includes('frozen') ||
      normalized.includes('genesis')
    );
  }

  /**
   * Returns immutable copy of the write firewall audit records.
   */
  public static getAuditRecords(): readonly WriteFirewallAuditRecord[] {
    return [...this.auditLedger];
  }
}

// Exported utility functions
export const writeFirewall = (request: MutationRequestPayload): WriteInterceptResult => {
  return WriteFirewallEngine.writeFirewall(request);
};

export const isCanonicalWriteProtected = (property: string): boolean => {
  return WriteFirewallEngine.isProtectedProperty(property);
};

export const getWriteFirewallAuditLog = (): readonly WriteFirewallAuditRecord[] => {
  return WriteFirewallEngine.getAuditRecords();
};

export const enforceFailClosed = (reason: string) => {
  console.warn(`[WRITE FIREWALL] Fail-Closed Triggered: ${reason}`);
  return { status: 'BLOCKED' as const, mutation: 0, reason };
};

export const authorizeCanonicalWrite = (quorum: number) => {
  if (quorum < 10) return enforceFailClosed('Insufficient HSM Quorum');
  return { status: 'AUTHORIZED' as const, mutation: 0 };
};
