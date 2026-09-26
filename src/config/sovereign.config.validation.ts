// ==========================================
// 1. Thai Legal Statutory Compliance
// ==========================================
export const THAI_LEGAL_COMPLIANCE = Object.freeze({
  etdaSec9: "พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙ | หมวด ๒ | การทำให้เกิดการรับรู้และการระบุอัตลักษณ์บุคคลในการสื่อสารทางอิเล็กทรอนิกส์",
  etdaSec26: "พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖ | ลายมือชื่อดิจิทัลปลอดภัยตามมาตรฐาน NIST FIPS 204 (ML-DSA-87)",
  etdaSec28: "พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘ | พยานหลักฐานอิเล็กทรอนิกส์และการรักษาบันทึกอิเล็กทรอนิกส์เป็นระยะเวลา ๕ ปี",
  pdpaSec37: "พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗ | Zero-Knowledge Privacy Isolation & Cryptographic PII Masking (ISO/IEC 27001:2022 Appendix A.12.6.1)",
});

// ==========================================
// 2. Runtime Invariants & Dynamic Override
// ==========================================
export function validateSovereignInvariants(): boolean {
  try {
    (SOVEREIGN_CONFIG as Record<string, unknown>).baselineDriftPct = 0.01;
    console.error("CRITICAL: Invariant mutation detected!");
    return false;
  } catch {
    return true; // Immutability confirmed
  }
}

export function verifyGenesisAnchor(): { valid: boolean; hash: string } {
  const config = SOVEREIGN_CONFIG.genesisAnchor;
  return {
    valid: config.blockHeight === 849202 && config.merkleRoot.length === 64,
    hash: config.merkleRoot,
  };
}

export interface SovereignConfigOverride {
  slaBenchmarks?: Partial<typeof SOVEREIGN_CONFIG.slaBenchmarks>;
  telemetryMetrics?: Partial<typeof SOVEREIGN_CONFIG.telemetryMetrics>;
}

export function getSovereignConfig(override?: SovereignConfigOverride) {
  if (!override) return SOVEREIGN_CONFIG;
  
  return Object.freeze({
    ...SOVEREIGN_CONFIG,
    slaBenchmarks: Object.freeze({
      ...SOVEREIGN_CONFIG.slaBenchmarks,
      ...override.slaBenchmarks,
    }),
    telemetryMetrics: Object.freeze({
      ...SOVEREIGN_CONFIG.telemetryMetrics,
      ...override.telemetryMetrics,
    }),
  });
}
