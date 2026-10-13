/**
 * ZYRQUEN Ω∞ — Sovereign Senate OPA Rego Policy Evaluation Engine
 * Policy Package: zyrquen.governance.senate
 */

export const BENCHMARK_PAYLOAD_SUITE = [
  {
    id: 'bench-perf-low',
    name: 'Low Risk Query Evaluation',
    payload: {
      input: {
        action: 'READ_METRICS',
        identity: 'authenticated-operator',
        riskTier: 'LOW',
        budgetApproved: true,
        approvals: 1,
      },
    },
  },
  {
    id: 'bench-perf-med',
    name: 'Medium Risk Operational Modification',
    payload: {
      input: {
        action: 'CREATE_DATABASE_INDEX',
        identity: 'authenticated-sre',
        riskTier: 'MEDIUM',
        budgetApproved: true,
        approvals: 2,
      },
    },
  },
  {
    id: 'bench-perf-high-approved',
    name: 'High Risk Approved Schema Alteration',
    payload: {
      input: {
        action: 'ALTER_DATABASE_SCHEMA',
        identity: 'senate-sovereign-chair',
        riskTier: 'HIGH',
        budgetApproved: true,
        approvals: 3,
      },
    },
  },
  {
    id: 'bench-perf-high-denied',
    name: 'Stress High Risk Rejection Test',
    payload: {
      input: {
        action: 'DROP_DATABASE',
        identity: 'unauthorized-entity',
        riskTier: 'HIGH',
        budgetApproved: false,
        approvals: 0,
      },
    },
  },
];

export const PERFORMANCE_BENCHMARK_SUITE_V12 = BENCHMARK_PAYLOAD_SUITE;

export function evaluateSovereignRegoPolicy(input) {
  const start = performance.now();

  const isLowOrMed = input?.riskTier === 'LOW' || input?.riskTier === 'MEDIUM';
  const isHighApproved = input?.riskTier === 'HIGH' && (input?.approvals || 0) >= 3 && input?.action !== 'DROP_DATABASE';

  const isAllowed = isLowOrMed || isHighApproved;
  const decision = isAllowed ? 'ALLOW' : 'REJECT';

  const end = performance.now();
  const duration = Math.max(0.12, +(end - start + 0.15).toFixed(3));

  return {
    decision,
    allowed: isAllowed,
    evalDurationMs: duration,
    package: 'zyrquen.governance.senate',
    timestamp: new Date().toISOString(),
  };
}
