/**
 * ZYRQUEN Ω∞ FROZEN v1.2 LTS — PROMOTION FIREWALL
 * 
 * Strict Zero-Trust Gatekeeper for Canonical State Transitions.
 * Independently evaluates artifact verification status, provenance, tenant namespace,
 * and policy authorization.
 * 
 * Invariant: Any non-verified, unauthorized, or cross-tenant promotion attempt
 * results in a strictly FAIL-CLOSED 'BLOCKED' response, ensuring SSoT Mutation = 0.
 */

export interface PromotionEvaluationRequest {
  artifactId: string;
  sourceFile: string;
  provenance: 'SOURCE_FILE' | 'REFERENCE' | 'OBSERVED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CANONICAL' | string;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFICATION_IN_PROGRESS' | 'VERIFIED' | 'MISMATCH' | 'QUARANTINED' | 'REJECTED' | 'BLOCKED' | string;
  tenantId: string;
  targetNamespace: string;
  computedHash: string | null;
  hardwareAttestationSlot?: string;
  freshnessStatus?: 'FRESH' | 'STALE' | 'EXPIRED' | 'REVOKED';
  requestActor: string;
}

export interface PromotionDecision {
  decision: 'BLOCKED' | 'PROMOTED_NON_CANONICAL_EXTENSION';
  isCanonicalWriteBlocked: true;
  ssotMutationDelta: 0;
  reason: string;
  timestamp: string;
  traceId: string;
  policyViolations: string[];
}

export class PromotionFirewall {
  private static readonly CANONICAL_FROZEN_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
  private static readonly CANONICAL_BLOCK = 849202;
  private static readonly CANONICAL_SEALS = 14902;

  /**
   * Independently evaluates promotion requests under Zero-Trust rules.
   * Default outcome is ALWAYS BLOCKED (Fail-Closed).
   */
  public static evaluatePromotion(request: PromotionEvaluationRequest): PromotionDecision {
    const timestamp = new Date().toISOString();
    const traceId = `TRACE-PRM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const policyViolations: string[] = [];

    // Rule 1: Verification status MUST be strictly 'VERIFIED'
    if (request.verificationStatus !== 'VERIFIED') {
      policyViolations.push(
        `Artifact state '${request.verificationStatus}' is not eligible for promotion. Required: 'VERIFIED'.`
      );
    }

    // Rule 2: Provenance must not be raw unverified source or unauthenticated reference
    if (request.provenance !== 'VERIFIED' && request.provenance !== 'CANONICAL') {
      policyViolations.push(
        `Provenance '${request.provenance}' does not possess promotion credentials.`
      );
    }

    // Rule 3: Computed digest must exist and be valid
    if (!request.computedHash || request.computedHash === 'NOT COMPUTED') {
      policyViolations.push('Cryptographic SHA-256 digest is missing or not computed.');
    }

    // Rule 4: Tenant isolation enforcement (Rule 9)
    if (request.tenantId && request.targetNamespace && request.targetNamespace !== request.tenantId) {
      policyViolations.push(
        `Cross-tenant namespace breach detected: '${request.tenantId}' requested promotion into '${request.targetNamespace}'.`
      );
    }

    // Rule 5: Freshness check
    if (request.freshnessStatus && request.freshnessStatus !== 'FRESH') {
      policyViolations.push(
        `Artifact freshness '${request.freshnessStatus}' violates freshness policy.`
      );
    }

    // Rule 6: Absolute Canonical Write Immunity — No extension may write to Frozen Core
    policyViolations.push(
      'FROZEN CORE IMMUNITY: Canonical SSoT is locked (v1.2 LTS, 14,902 Seals, Block #849202). All Canonical writes are strictly BLOCKED.'
    );

    // Final Decision is always BLOCKED for Canonical writes
    return {
      decision: 'BLOCKED',
      isCanonicalWriteBlocked: true,
      ssotMutationDelta: 0,
      reason: `Promotion blocked by Zero-Trust Promotion Firewall. Violations: ${policyViolations.join(' ')}`,
      timestamp,
      traceId,
      policyViolations,
    };
  }

  public static getCanonicalInvariants() {
    return {
      frozenBaseline: 'v1.2 LTS',
      canonicalSeals: this.CANONICAL_SEALS,
      canonicalMerkleRoot: this.CANONICAL_FROZEN_ROOT,
      canonicalBlock: this.CANONICAL_BLOCK,
      ssotMutation: 0,
      baselineDrift: 0.0,
      canonicalWriteAuthority: false,
    };
  }
}
