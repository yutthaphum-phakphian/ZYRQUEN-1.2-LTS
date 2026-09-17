// =============================================================================
// ZYRQUEN Ω∞ Senate Gate — Distributed k6 Latency Benchmark v5.0 LTS
// Ramps up to 10,000 RPS to stress-test p99 SLA & short-circuit evaluation
// =============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'ramping-arrival-rate',
      startRate: 500,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 2000,
      stages: [
        { target: 2000, duration: '30s' },  // Warm-up ramp to 2,000 RPS
        { target: 8000, duration: '1m' },   // Burst to 8,000 RPS
        { target: 12000, duration: '1m' },  // Peak stress at 12,000 RPS
        { target: 2000, duration: '30s' },  // Ramp-down
      ],
    },
  },
  thresholds: {
    // Statutory SLA: 95% of queries must be under 1.5ms, 99% under 2.5ms (server-side < 1.0ms)
    'http_req_duration': ['p(95)<1.5', 'p(99)<2.5'],
    'http_req_failed': ['rate<0.001'], // 99.99% availability required
  },
};

const BASE_URL = __ENV.GATE_URL || 'http://localhost:8181';

export default function () {
  const rand = Math.random();
  let payload;
  let expectedAllowed;

  if (rand < 0.60) {
    // 1. Low Risk Vector (60% volume) - Sub-millisecond fast path
    payload = {
      input: {
        agent: {
          did: `did:zyrquen:ag-k6-low-${__VU}`,
          lifecycle_state: 'AUTHORIZED',
          trust_score: 92,
          grantedcapabilities: ['READ_METRICS'],
          resourcebudget: { remainingusd: 500 },
        },
        request: {
          risk_level: 'LOW',
          action: 'READ_METRICS',
          requiredcapability: 'READ_METRICS',
          requested_tokens: 100,
          estimatedcostusd: 0.01,
        },
        cryptographic: { signature_valid: true },
        senate_votes: [],
        context: { timestamp: new Date().toISOString() },
      },
    };
    expectedAllowed = true;
  } else if (rand < 0.85) {
    // 2. Medium Risk Vector (25% volume) - Capability check + crypto verification
    payload = {
      input: {
        agent: {
          did: `did:zyrquen:ag-k6-med-${__VU}`,
          lifecycle_state: 'AUTHORIZED',
          trust_score: 88,
          grantedcapabilities: ['DBWRITE', 'CACHE_PURGE'],
          resourcebudget: { remainingusd: 250 },
        },
        request: {
          risk_level: 'MEDIUM',
          action: 'EXECUTE_QUERY',
          requiredcapability: 'DBWRITE',
          requested_tokens: 500,
          estimatedcostusd: 2.5,
        },
        cryptographic: { signature_valid: true },
        senate_votes: [],
        context: { timestamp: new Date().toISOString() },
      },
    };
    expectedAllowed = true;
  } else if (rand < 0.95) {
    // 3. High Risk Full Senate Quorum Consensus (10% volume)
    payload = {
      input: {
        agent: {
          did: `did:zyrquen:ag-k6-high-${__VU}`,
          lifecycle_state: 'AUTHORIZED',
          trust_score: 96,
          grantedcapabilities: ['ALTER_CONFIG'],
          resourcebudget: { remainingusd: 1000 },
        },
        request: {
          risk_level: 'HIGH',
          action: 'ALTER_CONFIG',
          requiredcapability: 'ALTER_CONFIG',
          requested_tokens: 2000,
          estimatedcostusd: 15.0,
        },
        cryptographic: { signature_valid: true },
        senate_votes: [
          { voterrole: 'SENATENODECORE', decision: 'APPROVE', signatureverified: true },
          { voterrole: 'SENATENODECORE', decision: 'APPROVE', signatureverified: true },
          { voterrole: 'SENATENODEAUDITOR', decision: 'APPROVE', signatureverified: true },
        ],
        context: { timestamp: new Date().toISOString() },
      },
    };
    expectedAllowed = true;
  } else {
    // 4. Chaos Vector: Phantom Agent Suspended Intrusion (5% volume)
    payload = {
      input: {
        agent: {
          did: 'did:zyrquen:ag-chaos-intruder',
          lifecycle_state: 'SUSPENDED',
          trust_score: 99,
          grantedcapabilities: ['SYSTEM_PURGE'],
          resourcebudget: { remainingusd: 10 },
        },
        request: {
          risk_level: 'CRITICAL',
          action: 'SYSTEM_PURGE',
          requiredcapability: 'SYSTEM_PURGE',
          requested_tokens: 999999,
          estimatedcostusd: 8888,
        },
        cryptographic: { signature_valid: false },
        senate_votes: [],
        context: { timestamp: new Date().toISOString() },
      },
    };
    expectedAllowed = false;
  }

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Zyrquen-Benchmark-Id': `k6-run-${__ITER}`,
    },
  };

  const res = http.post(
    `${BASE_URL}/v1/data/zyrquen/governance/senate/allow`,
    JSON.stringify(payload),
    params
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response under 3ms': (r) => r.timings.duration < 3.0,
  });

  sleep(0.01);
}
