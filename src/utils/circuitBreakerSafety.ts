// ZYRQUEN Ω∞ — CH-06-SAFETY Circuit Breaker Patch
// Fix: Threshold 85 KBps -> 15,000 KBps (from entropy report 2026-09-10)
// Canonical Anchor: 0x3319203849102834019283401928340192834019283401928340192834019283
// Baseline: 11264 KBps, StdDev: 1019, Stability: 98.2%

export const ZYRQUEN_ENTROPY_CONFIG = {
  // From file1208004929508286926.json report
  baselineKBps: 11264,
  upperStdKBps: 11784,
  lowerStdKBps: 10744,
  stdDev: 1019,
  stabilityIndex: 98.2,
  // OLD - WRONG (causes Critical alert spam)
  // criticalThresholdKBps: 85,
  // NEW - FIXED
  criticalThresholdKBps: 15000, // Baseline + 3*StdDev = 14321, rounded up + safety margin

  // Dynamic calculation (recommended)
  getDynamicThreshold: (baseline: number, stdDev: number) => baseline + 3 * stdDev,

  // TRNG Reseed peaks are AUTHORIZED surges
  authorizedSurgeLabels: [
    '12:00 Midday Quantum TRNG Reseed',
    '20:57 Quantum Reseed',
    '03:57 Quantum Reseed',
  ],

  // Node contributions (TC-01 primary double rate)
  enclaves: {
    'TC-01': 2633, // Primary - Bangkok Sovereign Root
    'TC-02': 1317,
    'TC-03': 1317,
    'TC-04': 1317,
    'TC-05': 1317,
    'TC-06': 1317,
    'TC-07': 1317,
    'TC-08': 1317,
    'TC-09': 1317,
    'TC-10': 1317,
  },
};

// CH-06 Fail-Closed Logic Fix
export function shouldTriggerCriticalAlert(currentRateKBps: number): boolean {
  const { criticalThresholdKBps } = ZYRQUEN_ENTROPY_CONFIG;

  // Only trigger if exceeds 15,000 AND not an authorized TRNG reseed
  if (currentRateKBps > criticalThresholdKBps) {
    // Check if this is a known TRNG reseed peak (from report)
    // If rate is within 14,300-14,900 range, treat as authorized
    if (currentRateKBps >= 14300 && currentRateKBps <= 14900) {
      console.log(`[CH-06] AUTHORIZED SURGE: ${currentRateKBps} KBps - TRNG Reseed`);
      return false; // Don't trigger critical
    }
    return true; // Real critical
  }
  return false;
}

export const CH06_SAFETY_STATUS = {
  chamber: 'CH-06-SAFETY',
  fix: 'Threshold 85 -> 15000 KBps',
  fips: 'NIST FIPS 140-3 Level 4',
  verificationGate: 'ACTIVE_GUARD',
  timestamp: '2026-09-10T00:59:02Z',
  canonicalHash: '0x3319203849102834019283401928340192834019283401928340192834019283',
};
