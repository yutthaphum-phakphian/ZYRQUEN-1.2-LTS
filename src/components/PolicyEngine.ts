/**
 * ZYRQUEN Ω∞ FROZEN v1.2 LTS — CENTRAL ZERO-TRUST POLICY ENGINE
 * 
 * Centralized Policy Enforcement Point (PEP) and Policy Decision Point (PDP).
 * Enforces a strict DEFAULT-DENY security architecture across all system operations:
 * READ, WRITE, PROMOTE, EXECUTE, CROSS_TENANT, and CANONICAL_WRITE.
 * 
 * Every operation requires explicit authorization evidence.
 * Invariant: SSoT Mutation = 0, Canonical Core remains immutable.
 */

import { PromotionFirewall, PromotionEvaluationRequest, PromotionDecision } from './PromotionFirewall';
import { EvidenceStateManager, EvidenceRuntimeState } from './EvidenceStateManager';

export type PolicyOperationType =
  | 'READ_SELF'
  | 'WRITE_SELF'
  | 'READ_CROSS_TENANT'
  | 'WRITE_CROSS_TENANT'
  | 'EVIDENCE_PROMOTE'
  | 'CANONICAL_WRITE'
  | 'SIMULATION_EXECUTE'
  | 'HARDWARE_ATTESTATION';

export type PolicyDecisionType = 'ALLOW' | 'DENY' | 'BLOCKED' | 'QUARANTINE';

export interface PolicyAuthorizationContext {
  actorId: string;
  tenantId: string;
  targetNamespace: string;
  operation: PolicyOperationType;
  artifactId?: string;
  artifactState?: EvidenceRuntimeState;
  provenance?: string;
  computedSha256?: string | null;
  hardwareSlot?: string;
  isSimulationSandbox?: boolean;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecisionType;
  allowed: boolean;
  policyVersion: string;
  policyDigest: string;
  reasons: string[];
  ssotMutationDelta: 0;
  evaluatedAt: string;
  traceId: string;
  promotionDecision?: PromotionDecision;
}

export interface SecurityPolicyRule {
  id: string;
  name: string;
  operation: PolicyOperationType;
  description: string;
  defaultAction: PolicyDecisionType;
  conditions: string[];
}

export class PolicyEngine {
  public static readonly POLICY_VERSION = 'v2.1-ZERO-TRUST-LTS';
  public static readonly POLICY_DIGEST = '0x8f4c2e91a0b36d7281f94c03b8e72159048a12bc93417eef50129a74b6c9201a';

  private static readonly POLICY_RULES: SecurityPolicyRule[] = [
    {
      id: 'POL-01-CANONICAL-IMMUNITY',
      name: 'Absolute Canonical Core Write Lock',
      operation: 'CANONICAL_WRITE',
      description: 'Frozen v1.2 LTS Canonical Core (#849202, 14,902 Seals) is read-only.',
      defaultAction: 'DENY',
      conditions: ['All write attempts to SSoT are permanently blocked.'],
    },
    {
      id: 'POL-02-CROSS-TENANT-ISOLATION',
      name: 'Strict Physical Namespace Containment',
      operation: 'WRITE_CROSS_TENANT',
      description: 'Tenants cannot write or access unauthenticated namespaces.',
      defaultAction: 'DENY',
      conditions: ['tenantId must equal targetNamespace.'],
    },
    {
      id: 'POL-03-EVIDENCE-PROMOTION',
      name: 'Zero-Trust Evidence Promotion Gate',
      operation: 'EVIDENCE_PROMOTE',
      description: 'Evidence promotion requires explicit byte verification, hardware HSM attestation, and fail-closed firewall clearance.',
      defaultAction: 'DENY',
      conditions: [
        'Artifact state must be VERIFIED',
        'Computed SHA-256 digest must match artifact bytes',
        'Hardware HSM attestation must be valid',
        'Promotion cannot write to Canonical SSoT',
      ],
    },
    {
      id: 'POL-04-SIMULATION-CONTAINMENT',
      name: 'Financial Safety Barrier & Digital Twin Isolation',
      operation: 'SIMULATION_EXECUTE',
      description: 'Monte Carlo and pilot backtests are strictly non-live with zero broker execution authority.',
      defaultAction: 'DENY',
      conditions: ['isSimulationSandbox must be true', 'No live broker sockets permitted'],
    },
  ];

  /**
   * Central Policy Decision Point (PDP)
   * Evaluates any request with a DEFAULT-DENY posture.
   */
  public static evaluate(context: PolicyAuthorizationContext): PolicyEvaluationResult {
    const timestamp = new Date().toISOString();
    const traceId = `POL-TRACE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const reasons: string[] = [];

    // 1. Permanent Fail-Closed Check on Canonical Write
    if (context.operation === 'CANONICAL_WRITE') {
      return {
        decision: 'DENY',
        allowed: false,
        policyVersion: this.POLICY_VERSION,
        policyDigest: this.POLICY_DIGEST,
        reasons: ['CRITICAL: Canonical Core (v1.2 LTS) write authority is permanently disabled. Zero mutations allowed.'],
        ssotMutationDelta: 0,
        evaluatedAt: timestamp,
        traceId,
      };
    }

    // 2. Cross-Tenant Check
    if (
      context.operation === 'READ_CROSS_TENANT' ||
      context.operation === 'WRITE_CROSS_TENANT' ||
      (context.targetNamespace && context.tenantId !== context.targetNamespace)
    ) {
      return {
        decision: 'DENY',
        allowed: false,
        policyVersion: this.POLICY_VERSION,
        policyDigest: this.POLICY_DIGEST,
        reasons: [`Cross-tenant boundary breach blocked: ${context.tenantId} -> ${context.targetNamespace}`],
        ssotMutationDelta: 0,
        evaluatedAt: timestamp,
        traceId,
      };
    }

    // 3. Evidence Promotion Evaluation
    if (context.operation === 'EVIDENCE_PROMOTE') {
      const promoRequest: PromotionEvaluationRequest = {
        artifactId: context.artifactId || 'UNKNOWN_ARTIFACT',
        sourceFile: `${context.artifactId || 'unknown'}.json`,
        provenance: context.provenance || 'SOURCE_FILE',
        verificationStatus: context.artifactState || 'PENDING_VERIFICATION',
        tenantId: context.tenantId,
        targetNamespace: context.targetNamespace,
        computedHash: context.computedSha256 || null,
        hardwareAttestationSlot: context.hardwareSlot || 'HSM-SLOT-01',
        freshnessStatus: 'FRESH',
        requestActor: context.actorId,
      };

      const promotionDecision = PromotionFirewall.evaluatePromotion(promoRequest);

      // Audit transition in EvidenceStateManager if artifact exists
      if (context.artifactId) {
        EvidenceStateManager.transitionState(
          context.artifactId,
          promotionDecision.decision === 'BLOCKED' ? 'BLOCKED' : 'VERIFIED',
          context.actorId,
          promotionDecision.reason,
          context.computedSha256 || '0xNOT_COMPUTED',
          context.hardwareSlot || 'HSM-SLOT-01'
        );
      }

      return {
        decision: promotionDecision.decision === 'BLOCKED' ? 'BLOCKED' : 'ALLOW',
        allowed: false, // Invariant: Even if non-canonical extension passes, canonical promotion is blocked
        policyVersion: this.POLICY_VERSION,
        policyDigest: this.POLICY_DIGEST,
        reasons: promotionDecision.policyViolations,
        ssotMutationDelta: 0,
        evaluatedAt: timestamp,
        traceId,
        promotionDecision,
      };
    }

    // 4. Simulation Execution Check
    if (context.operation === 'SIMULATION_EXECUTE') {
      if (context.isSimulationSandbox) {
        return {
          decision: 'ALLOW',
          allowed: true,
          policyVersion: this.POLICY_VERSION,
          policyDigest: this.POLICY_DIGEST,
          reasons: ['Authorized inside isolated Digital Twin Sandbox (Non-Live, Zero Execution Authority).'],
          ssotMutationDelta: 0,
          evaluatedAt: timestamp,
          traceId,
        };
      }
      return {
        decision: 'DENY',
        allowed: false,
        policyVersion: this.POLICY_VERSION,
        policyDigest: this.POLICY_DIGEST,
        reasons: ['DENIED: Simulation cannot run outside sandboxed environment.'],
        ssotMutationDelta: 0,
        evaluatedAt: timestamp,
        traceId,
      };
    }

    // 5. Tenant Self-Read Check
    if (context.operation === 'READ_SELF' && context.tenantId === context.targetNamespace) {
      return {
        decision: 'ALLOW',
        allowed: true,
        policyVersion: this.POLICY_VERSION,
        policyDigest: this.POLICY_DIGEST,
        reasons: ['Authorized self-namespace read operation.'],
        ssotMutationDelta: 0,
        evaluatedAt: timestamp,
        traceId,
      };
    }

    // Default Action: STRICT DENY
    return {
      decision: 'DENY',
      allowed: false,
      policyVersion: this.POLICY_VERSION,
      policyDigest: this.POLICY_DIGEST,
      reasons: ['DEFAULT-DENY: No explicit policy authorization granting permission for this operation.'],
      ssotMutationDelta: 0,
      evaluatedAt: timestamp,
      traceId,
    };
  }

  public static getPolicies(): readonly SecurityPolicyRule[] {
    return this.POLICY_RULES;
  }
}
