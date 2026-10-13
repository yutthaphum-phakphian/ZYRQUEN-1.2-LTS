export interface RegoBenchmarkInput {
  action: string;
  identity: string;
  riskTier: string;
  budgetApproved: boolean;
  approvals: number;
}

export interface RegoBenchmarkPayload {
  id: string;
  name: string;
  payload: {
    input: RegoBenchmarkInput;
  };
}

export const BENCHMARK_PAYLOAD_SUITE: RegoBenchmarkPayload[];
export const PERFORMANCE_BENCHMARK_SUITE_V12: RegoBenchmarkPayload[];

export interface RegoPolicyEvaluationResult {
  decision: 'ALLOW' | 'REJECT';
  allowed: boolean;
  evalDurationMs: number;
  package: string;
  timestamp: string;
}

export function evaluateSovereignRegoPolicy(input: RegoBenchmarkInput): RegoPolicyEvaluationResult;
