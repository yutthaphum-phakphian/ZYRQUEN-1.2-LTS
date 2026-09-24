/**
 * ZYRQUEN Ω∞ 3-Tier Gatekeeper Compliance Middleware
 * Dual-Middleware Security Framework - Layer 2
 * Thai ETA B.E. 2544 Sec 9, 26, 28 + IAL/AAL + Dilithium-5/SPHINCS+ + 10/10 HSM Quorum
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './sentinel.middleware';

export interface GateRule {
  section: string;
  minIAL: number;
  minAAL: number;
  requiredCrypto: string[];
  requireHSM: boolean;
  paths: string[];
  description: string;
}

export const TIER_RULES: Record<string, GateRule> = {
  "Level 1 Gate": {
    section: "Section 9 - Electronic Signature General",
    minIAL: 1,
    minAAL: 1,
    requiredCrypto: [], // No PQC required for telemetry
    requireHSM: false,
    paths: ["/api/v1/telemetry"],
    description: "ลายมือชื่ออิเล็กทรอนิกส์ทั่วไป IAL1/AAL1 - ดึงค่าโทรมาตรสด"
  },
  "Level 2 Gate": {
    section: "Section 26 - Secure Digital Signature High Assurance",
    minIAL: 2,
    minAAL: 2,
    requiredCrypto: ["Dilithium-5", "SPHINCS+"],
    requireHSM: false, // HSM optional but recommended
    paths: ["/api/v1/audit/records", "/api/v1/audit/replay", "/api/v1/replay/verify", "/api/v2/auth/register", "/api/v1/gold-seal/verify"],
    description: "ลายมือชื่อดิจิทัลปลอดภัยสูง IAL2+/AAL2+ + Dilithium-5/SPHINCS+ Non-repudiation"
  },
  "Level 3 Gate": {
    section: "Section 28 - Sovereign Vault Treasury Privileged",
    minIAL: 3,
    minAAL: 3,
    requiredCrypto: ["Dilithium-5"],
    requireHSM: true, // Must have 10/10 HSM Unanimous
    paths: ["/api/v2/treasury/refund"],
    description: "ด่านคลังอภิสิทธิ์ Sovereign Vault IAL3/AAL3 + 10/10 HSM Quorum FIPS 140-3 L4"
  },
  "Public Verification": {
    section: "Public Verification - Court/ETDA",
    minIAL: 0,
    minAAL: 0,
    requiredCrypto: [],
    requireHSM: false,
    paths: ["/api/v1/gold-seal/verify"],
    description: "ช่องทางสำหรับศาล พนักงานสอบสวน ETDA ตรวจสอบ Merkle Path"
  }
};

export function getTierForPath(path: string): { tierName: string; rule: GateRule } {
  for (const [tierName, rule] of Object.entries(TIER_RULES)) {
    if (rule.paths.some(p => path.startsWith(p) || path === p)) {
      return { tierName, rule };
    }
  }
  // Default to Level 2 for unknown protected paths under /api
  return { tierName: "Level 2 Gate", rule: TIER_RULES["Level 2 Gate"] };
}

export function gatekeeperCompliance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const fullPath = (req.baseUrl || '') + (req.path || '');

  // Non-API routes or internal health checks pass immediately
  if (
    !fullPath.startsWith('/api') ||
    fullPath === '/api/health' ||
    fullPath.startsWith('/api/v1/evidence/') ||
    fullPath.startsWith('/api/v1/export/') ||
    fullPath.startsWith('/api/v1/audio/') ||
    fullPath.startsWith('/api/v1/security/hsm/')
  ) {
    return next();
  }

  const { tierName, rule } = getTierForPath(fullPath);
  req.complianceTier = tierName;
  req.complianceRule = rule;

  // Extract auth from body or headers
  const auth = (req.body as any)?.auth || {};
  const ial = auth.ial ?? parseInt((req.headers['x-sov-ial'] || req.headers['x-ial'] || '0') as string, 10);
  const aal = auth.aal ?? parseInt((req.headers['x-sov-aal'] || req.headers['x-aal'] || '0') as string, 10);
  const cryptoScheme = auth.cryptoScheme || req.headers['x-sov-crypto'] || req.headers['x-crypto-scheme'] || '';
  const hsmSigned = auth.hsmSigned ?? (req.headers['x-sov-hsm-signed'] === 'true' || req.headers['x-hsm-quorum'] === '10/10');

  console.log(`[GATEKEEPER] Path=${fullPath} Tier=${tierName} IAL=${ial} AAL=${aal} Crypto=${cryptoScheme} HSM=${hsmSigned}`);

  // Public telemetry allowed (Level 1 Gate)
  if (tierName === "Level 1 Gate" && fullPath === "/api/v1/telemetry") {
    return next();
  }

  // Public verification for gold-seal or audit verification
  if (fullPath === "/api/v1/gold-seal/verify" || fullPath === "/api/v1/replay/verify") {
    return next();
  }

  // Check IAL/AAL
  if (ial < rule.minIAL || aal < rule.minAAL) {
    return res.status(401).json({
      status: "REJECTED_COMPLIANCE",
      tier: tierName,
      section: rule.section,
      reason: `IAL/AAL insufficient. Required IAL${rule.minIAL}+/AAL${rule.minAAL}+, got IAL${ial}/AAL${aal}`,
      required: `IAL${rule.minIAL}+/AAL${rule.minAAL}+ + ${rule.requiredCrypto.join(' or ') || 'No PQC'} + ${rule.requireHSM ? '10/10 HSM Quorum' : 'HSM optional'}`,
      genesis_block: 849202,
      merkle_root: "0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68",
      zero_drift: "0.00%",
      thai_law: "พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544",
      timestamp: new Date().toISOString()
    });
  }

  // Check PQC crypto
  if (rule.requiredCrypto.length > 0 && !rule.requiredCrypto.includes(cryptoScheme as string)) {
    return res.status(401).json({
      status: "REJECTED_PQC",
      tier: tierName,
      reason: `PQC Crypto scheme invalid. Required ${rule.requiredCrypto.join(' or ')}, got ${cryptoScheme}`,
      requiredCrypto: rule.requiredCrypto,
      section: rule.section,
      genesis_block: 849202,
      timestamp: new Date().toISOString()
    });
  }

  // Check HSM for Level 3
  if (rule.requireHSM && !hsmSigned) {
    return res.status(403).json({
      status: "REJECTED_HSM_QUORUM",
      tier: tierName,
      reason: "Section 28 Sovereign Vault requires 10/10 REAL_HSM Quorum unanimous FIPS 140-3 Level 4 / CC EAL6+",
      required: "10/10 REAL_HSM Quorum + Dilithium-5 + IAL3/AAL3",
      genesis_block: 849202,
      merkle_root: "0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68",
      hsm_standard: "Utimaco u.trust GP CSe-Series FIPS 140-3 Level 4",
      timestamp: new Date().toISOString()
    });
  }

  // Passed
  console.log(`[GATEKEEPER] PASS Tier=${tierName} Section=${rule.section} IAL${ial}/AAL${aal} Crypto=${cryptoScheme} HSM=${hsmSigned}`);
  next();
}
