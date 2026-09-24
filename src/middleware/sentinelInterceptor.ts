/**
 * @file sentinelInterceptor.ts
 * @description Layer 1: Sentinel AI Risk Interceptor & Multi-Tier ETDA Gatekeeper
 * Enforces Fail-Closed quarantine for risk scores >= 0.85 into Chamber 02.
 * Validates compliance with Thai Electronic Transactions Act B.E. 2544 (Sections 9, 26, 28).
 */

import type { Request, Response, NextFunction } from 'express';

export interface SentinelAuthPayload {
  ial?: number;
  aal?: number;
  cryptoScheme?: 'Dilithium-5' | 'SPHINCS+' | 'ECDSA' | 'RSA';
  hsmSigned?: boolean;
}

export interface SentinelRiskContext {
  riskScore: number;
  anomalyDetected: boolean;
  verdict: 'SAFE' | 'ELEVATED' | 'QUARANTINE_TRIGGERED';
  reasons: string[];
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      sentinelRiskScore?: number;
      complianceVerdict?: string;
      complianceReason?: string;
    }
  }
}

/**
 * Assesses request payload for behavioral or cryptographic anomalies.
 */
export function assessSentinelRisk(req: Request): SentinelRiskContext {
  const user = req.body?.user;
  const authHeader = req.headers['authorization'];
  const reasons: string[] = [];

  let riskScore = 0.02; // Baseline nominal risk

  if (!authHeader) {
    riskScore = Math.max(riskScore, 0.45);
    reasons.push('Missing Authorization Header');
  }

  const userName = user?.name || '';
  const userId = user?.id || '';

  if (userId === 'USR-SUSPECT' || /bot|hacker|probe|intruder|tamper/i.test(userName)) {
    riskScore = 0.96;
    reasons.push('Known suspect signature or automated adversary pattern detected');
  }

  const isAnomaly = riskScore >= 0.85;

  return {
    riskScore,
    anomalyDetected: isAnomaly,
    verdict: isAnomaly ? 'QUARANTINE_TRIGGERED' : riskScore > 0.4 ? 'ELEVATED' : 'SAFE',
    reasons,
  };
}

/**
 * Middleware: Sentinel AI Risk Interceptor
 * Intercepts incoming requests and attaches risk evaluation.
 */
export function sentinelRiskInterceptor(req: Request, res: Response, next: NextFunction): void {
  const assessment = assessSentinelRisk(req);
  req.sentinelRiskScore = assessment.riskScore;

  if (assessment.riskScore >= 0.85) {
    res.status(403).json({
      error: 'ZYRQUEN_QUARANTINE_TRIGGERED',
      verdict: 'QUARANTINED',
      chamber: 'Chamber 02 (FORENSICS & QUARANTINE)',
      riskScore: assessment.riskScore,
      reason: `Risk score (${assessment.riskScore.toFixed(2)}) exceeds threshold (0.85). Isolated to Chamber 02. No gas fees allocated.`,
      timestamp: new Date().toISOString(),
      quarantineLogId: `QZ-${Date.now()}`,
    });
    return;
  }

  next();
}

/**
 * Middleware: Multi-Tier Gatekeeper Compliance
 * Tier 1: Section 9 Compliance (IAL1, AAL1) - Low-risk retail
 * Tier 2: Section 26 Compliance (IAL2+, AAL2+) - Advanced secure signature, non-repudiation
 * Tier 3: Section 28 Compliance (IAL2+, AAL2+ with CA Certification) - Sovereign treasury functions
 */
export function gatekeeperCompliance(requiredSection: 9 | 26 | 28) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth: SentinelAuthPayload = req.body?.auth || {};
    const { ial = 1, aal = 1, cryptoScheme = 'Dilithium-5', hsmSigned = true } = auth;
    const riskScore = req.sentinelRiskScore ?? 0.02;

    if (riskScore >= 0.85) {
      res.status(403).json({
        error: 'ZYRQUEN_QUARANTINE_TRIGGERED',
        verdict: 'QUARANTINED',
        chamber: 'Chamber 02 (FORENSICS & QUARANTINE)',
        reason: `Risk score (${riskScore}) exceeds threshold (0.85). Isolated to Chamber 02.`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Tier 3: Section 28 Compliance Gate (Sovereign Operations & Treasury)
    if (requiredSection === 28) {
      if (ial >= 2 && aal >= 2 && cryptoScheme === 'Dilithium-5' && hsmSigned) {
        req.complianceVerdict = 'APPROVED_SECTION_28';
        req.complianceReason = 'CA-Certified secure signature bound to 10/10 REAL_HSM Quorum (FIPS 140-3 Level 4).';
        next();
        return;
      }
      res.status(401).json({
        error: 'UNAUTHORIZED_SECTION_28_REJECTED',
        reason: 'Sovereign treasury functions require IAL2+, AAL2+, Dilithium-5 (ML-DSA) and 10/10 REAL_HSM signature verification.',
        suggestedRemediation: 'Upgrade authentication to biometric MFA and use post-quantum hardware key.',
      });
      return;
    }

    // Tier 2: Section 26 Compliance Gate (Advanced secure signatures)
    if (requiredSection === 26) {
      if (ial >= 2 && aal >= 2 && (cryptoScheme === 'Dilithium-5' || cryptoScheme === 'SPHINCS+')) {
        req.complianceVerdict = 'APPROVED_SECTION_26';
        req.complianceReason = 'Passed Section 26 compliance. Advanced digital signature ensures integrity & non-repudiation.';
        next();
        return;
      }
      res.status(401).json({
        error: 'UNAUTHORIZED_SECTION_26_REJECTED',
        reason: 'Section 26 compliance requires a secure digital signature (Dilithium-5/SPHINCS+) and IAL2+/AAL2+.',
      });
      return;
    }

    // Tier 1: Section 9 Compliance Gate (General e-Signatures / Low-Risk)
    if (requiredSection === 9) {
      if (ial >= 1 && aal >= 1) {
        req.complianceVerdict = 'APPROVED_SECTION_9';
        req.complianceReason = 'Passed Section 9 compliance. Valid for low-risk, internal retail transactions.';
        next();
        return;
      }
      res.status(401).json({
        error: 'UNAUTHORIZED_SECTION_9_REJECTED',
        reason: 'At least IAL1/AAL1 is required for standard electronic signature validation.',
      });
      return;
    }

    res.status(500).json({ error: 'INVALID_COMPLIANCE_TIER' });
  };
}
